-- =============================================================================
-- 0038_solicitudes_baja.sql
-- Bajas con solicitud y aprobación (F5, tarea 5; decisión 1 del plan 05).
--
-- El kárdex sigue guardando solo hechos. Lo que se pide vive aquí; lo que se
-- aprueba se convierte en un movimiento `baja` con `autorizado_por` = quien
-- aprueba. Desde 0034 ninguna persona puede insertar una baja a nombre de otro
-- autorizador, así que este es el único camino del ingeniero.
-- =============================================================================
create table public.solicitudes_baja (
  id                 uuid primary key default gen_random_uuid(),
  insumo_id          uuid not null references public.insumos(id) on delete restrict,
  lote_id            uuid references public.lotes_insumo(id) on delete restrict,
  cantidad           numeric(14,4) not null check (cantidad > 0),
  unidad_id          uuid not null references public.unidades_medida(id) on delete restrict,
  motivo_baja        app.motivo_baja not null,
  observacion        text not null check (length(btrim(observacion)) > 0),
  estado             text not null default 'pendiente'
                     check (estado in ('pendiente', 'aprobada', 'rechazada')),
  comentario_rechazo text,
  movimiento_id      uuid unique references public.movimientos_insumo(id) on delete restrict,
  solicitado_por     uuid not null default auth.uid() references auth.users(id) on delete restrict,
  resuelto_por       uuid references auth.users(id) on delete restrict,
  resuelto_en        timestamptz,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  created_by         uuid references auth.users(id),
  updated_by         uuid references auth.users(id),

  constraint rechazo_explicado check (
    estado <> 'rechazada' or length(btrim(coalesce(comentario_rechazo, ''))) > 0),
  constraint aprobada_con_movimiento check ((estado = 'aprobada') = (movimiento_id is not null)),
  constraint resuelta_con_autor check ((estado = 'pendiente') = (resuelto_por is null))
);
comment on table public.solicitudes_baja is
  'Bajas pedidas por el ingeniero. No descuentan hasta que la administración las aprueba (ficha 7.7).';

create index idx_solicitudes_baja_pendientes on public.solicitudes_baja (created_at desc)
  where estado = 'pendiente';

create trigger solicitudes_baja_set_updated_at
  before update on public.solicitudes_baja
  for each row execute function app.set_updated_at();
-- 0026 solo cubrió las tablas que existían entonces.
create trigger solicitudes_baja_sellar_autoria
  before insert or update on public.solicitudes_baja
  for each row execute function app.sellar_autoria();
select app.auditar('public.solicitudes_baja');

alter table public.solicitudes_baja enable row level security;
alter table public.solicitudes_baja force row level security;

create policy "insumos lee solicitudes de baja"
  on public.solicitudes_baja for select to authenticated
  using ((select app.es_rol('superadmin', 'administrador', 'ingeniero')));
create policy "insumos pide bajas"
  on public.solicitudes_baja for insert to authenticated
  with check (
    (select app.es_rol('superadmin', 'administrador', 'ingeniero'))
    and estado = 'pendiente'
    and solicitado_por = (select auth.uid())
    and movimiento_id is null and resuelto_por is null and comentario_rechazo is null
  );
-- Resolver solo por las funciones de abajo.
revoke update, delete on public.solicitudes_baja from anon, authenticated;

-- -----------------------------------------------------------------------------
-- El aviso
-- -----------------------------------------------------------------------------
alter table public.notificaciones drop constraint notificaciones_tipo_check;
alter table public.notificaciones add constraint notificaciones_tipo_check
  check (tipo in ('stock_bajo', 'por_vencer', 'vencido', 'promocion_en_revision', 'baja_pendiente'));
alter table public.notificaciones
  add column solicitud_baja_id uuid references public.solicitudes_baja(id) on delete cascade;

create or replace function app.avisar_baja_pendiente()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.notificaciones (tipo, titulo, mensaje, insumo_id, solicitud_baja_id, clave_unica)
    select 'baja_pendiente',
           'Baja esperando aprobación',
           format('Piden dar de baja %s %s de %s (%s).',
                  app.formatear_cantidad(new.cantidad), u.nombre, i.nombre, new.observacion),
           new.insumo_id, new.id, 'baja_pendiente:' || new.id
      from public.insumos i, public.unidades_medida u
     where i.id = new.insumo_id and u.id = new.unidad_id;
  elsif old.estado = 'pendiente' and new.estado <> 'pendiente' then
    update public.notificaciones
       set resuelta_en = now()
     where solicitud_baja_id = new.id and resuelta_en is null;
  end if;
  return null;
end;
$$;
revoke execute on function app.avisar_baja_pendiente() from public, anon, authenticated;

create trigger solicitudes_baja_avisar
  after insert or update of estado on public.solicitudes_baja
  for each row execute function app.avisar_baja_pendiente();

-- -----------------------------------------------------------------------------
-- Aprobar y rechazar
--
-- `security definer` porque `authenticated` no tiene UPDATE sobre la tabla
-- (y la baja se inserta a nombre de quien la pidió, cosa que la política de
-- movimientos no deja hacer a nadie). Por eso comprueban el rol aquí mismo.
-- -----------------------------------------------------------------------------
create or replace function public.aprobar_baja(p_id uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_s   public.solicitudes_baja;
  v_mov uuid;
begin
  if not (select app.es_rol('superadmin', 'administrador')) then
    raise exception 'Solo la administración aprueba o rechaza bajas.' using errcode = '42501';
  end if;
  select * into v_s from public.solicitudes_baja where id = p_id for update;
  if not found then
    raise exception 'No se encontró la solicitud.' using errcode = 'P0001';
  end if;
  if v_s.estado <> 'pendiente' then
    raise exception 'Esa solicitud ya se resolvió. Recarga la página.' using errcode = 'P0001';
  end if;

  -- Si ya no alcanza, el reparto (0034) lo dice con su frase y nada cambia.
  insert into public.movimientos_insumo
    (tipo, insumo_id, lote_id, cantidad, unidad_id, motivo_baja, autorizado_por, responsable_id, observacion)
  values ('baja', v_s.insumo_id, v_s.lote_id, v_s.cantidad, v_s.unidad_id, v_s.motivo_baja,
          auth.uid(), v_s.solicitado_por, v_s.observacion)
  returning id into v_mov;

  update public.solicitudes_baja
     set estado = 'aprobada', movimiento_id = v_mov, resuelto_por = auth.uid(), resuelto_en = now()
   where id = p_id;
  return v_mov;
end;
$$;
revoke execute on function public.aprobar_baja(uuid) from public, anon;
grant execute on function public.aprobar_baja(uuid) to authenticated;

create or replace function public.rechazar_baja(p_id uuid, p_comentario text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not (select app.es_rol('superadmin', 'administrador')) then
    raise exception 'Solo la administración aprueba o rechaza bajas.' using errcode = '42501';
  end if;
  if length(btrim(coalesce(p_comentario, ''))) = 0 then
    raise exception 'Escribe por qué la rechazas: el ingeniero lo va a leer.' using errcode = 'P0001';
  end if;
  update public.solicitudes_baja
     set estado = 'rechazada', comentario_rechazo = btrim(p_comentario),
         resuelto_por = auth.uid(), resuelto_en = now()
   where id = p_id and estado = 'pendiente';
  if not found then
    raise exception 'Esa solicitud ya se resolvió. Recarga la página.' using errcode = 'P0001';
  end if;
end;
$$;
revoke execute on function public.rechazar_baja(uuid, text) from public, anon;
grant execute on function public.rechazar_baja(uuid, text) to authenticated;
