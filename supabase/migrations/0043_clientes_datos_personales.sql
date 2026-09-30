-- =============================================================================
-- 0043_clientes_datos_personales.sql
-- Borrado a pedido, conservación y registro de exportaciones (F6, tarea 2).
-- Decisiones 3, 4 y 6 de Dan (30/09/2026), doc 06. Ley N.° 29733.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- La constancia de cada borrado. Sin datos personales: solo quién, cuándo y
-- por qué. La escribe `borrar_datos_cliente`, nunca una persona a mano.
-- -----------------------------------------------------------------------------
create table public.supresiones (
  id          uuid primary key default gen_random_uuid(),
  cliente_id  uuid not null unique references public.clientes(id) on delete restrict,
  motivo      text not null check (length(btrim(motivo)) >= 3),
  borrado_por uuid not null references auth.users(id) on delete restrict,
  borrado_en  timestamptz not null default now()
);

comment on table public.supresiones is
  'Constancia de que se borraron los datos de un cliente a su pedido (Ley 29733). Sin datos personales.';

alter table public.supresiones enable row level security;
alter table public.supresiones force row level security;
create policy "administracion lee supresiones"
  on public.supresiones for select to authenticated
  using ((select app.es_rol('superadmin', 'administrador')));
revoke insert, update, delete on public.supresiones from anon, authenticated;

-- -----------------------------------------------------------------------------
-- Borrar los datos de un cliente
-- -----------------------------------------------------------------------------
create or replace function public.borrar_datos_cliente(p_id uuid, p_motivo text)
returns table (ruta text)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_rutas text[];
begin
  if not (select app.es_rol('superadmin', 'administrador')) then
    raise exception 'Solo la administración puede borrar los datos de un cliente.' using errcode = '42501';
  end if;
  if coalesce(length(btrim(p_motivo)), 0) < 3 then
    raise exception 'Escribe por qué se borran, por ejemplo «Lo pidió por WhatsApp el 3/10».'
      using errcode = 'P0001';
  end if;

  perform 1 from public.clientes c where c.id = p_id for update;
  if not found then
    raise exception 'No se encontró el cliente. Recarga la página.' using errcode = 'P0002';
  end if;
  if exists (select 1 from public.supresiones s where s.cliente_id = p_id) then
    raise exception 'Los datos de este cliente ya se borraron.' using errcode = 'P0001';
  end if;

  select coalesce(array_agg(f.ruta order by f.orden), '{}') into v_rutas
    from public.cliente_fotos f where f.cliente_id = p_id;

  delete from public.cliente_fotos f where f.cliente_id = p_id;

  update public.consentimientos k
     set revocado_en = now(), revocado_por = auth.uid()
   where k.cliente_id = p_id and k.revocado_en is null;

  update public.clientes c
     set nombre_completo = 'Datos borrados a pedido del cliente',
         celular         = '000000',
         direccion       = 'Datos borrados',
         referencia      = null,
         observacion     = null,
         latitud         = null,
         longitud        = null,
         activo          = false
   where c.id = p_id;

  -- La única excepción a «la auditoría no se toca» (decisión 3): se tacha el
  -- CONTENIDO de todo lo que dejó este cliente —la ficha, sus fotos, también
  -- las ya quitadas, y sus permisos—, incluidas las filas que acaban de
  -- escribir los cambios de arriba. Quién, cuándo y qué operación se quedan.
  update app.auditoria a
     set datos_antes   = case when a.datos_antes   is null then null else '{"borrado": true}'::jsonb end,
         datos_despues = case when a.datos_despues is null then null else '{"borrado": true}'::jsonb end
   where (a.tabla = 'public.clientes' and a.registro_id = p_id)
      or (a.tabla in ('public.cliente_fotos', 'public.consentimientos')
          and p_id::text in (a.datos_antes ->> 'cliente_id', a.datos_despues ->> 'cliente_id'));

  insert into public.supresiones (cliente_id, motivo, borrado_por)
  values (p_id, btrim(p_motivo), auth.uid());

  return query select unnest(v_rutas);
end;
$$;

comment on function public.borrar_datos_cliente(uuid, text) is
  'Borra los datos personales de un cliente a su pedido, también de la auditoría (tachando el contenido), y deja la constancia. Devuelve las rutas de sus fotos para borrar los archivos.';
revoke execute on function public.borrar_datos_cliente(uuid, text) from public, anon;
grant execute on function public.borrar_datos_cliente(uuid, text) to authenticated;

-- -----------------------------------------------------------------------------
-- Conservación (decisión 4): nada se borra solo; la administración revisa.
-- «Actividad» es el último cambio en la ficha, sus fotos o su permiso.
-- -----------------------------------------------------------------------------
create view public.clientes_para_revisar
with (security_invoker = true) as
select c.id,
       c.nombre_completo,
       z.nombre as zona,
       x.ultima_actividad
  from public.clientes c
  left join public.zonas_reparto z on z.id = c.zona_id
  cross join lateral (
    select greatest(
      c.updated_at,
      (select max(f.updated_at) from public.cliente_fotos f where f.cliente_id = c.id),
      (select max(k.created_at) from public.consentimientos k where k.cliente_id = c.id)
    ) as ultima_actividad
  ) x
 where c.activo
   and c.deleted_at is null
   and not c.es_demo
   and not exists (select 1 from public.supresiones s where s.cliente_id = c.id)
   and x.ultima_actividad < now() - interval '2 years'
   and (select app.es_rol('superadmin', 'administrador'));

comment on view public.clientes_para_revisar is
  'Clientes activos sin cambios en 2 años (decisión 4). Solo administración. security_invoker.';
grant select on public.clientes_para_revisar to authenticated;

-- -----------------------------------------------------------------------------
-- El permiso vigente de un cliente, con el nombre de quien lo anotó, para la
-- ficha. `app.nombre_de_persona` (0037) solo da el nombre a los roles que ya
-- lo pueden ver; al repartidor le llega «otra persona».
-- -----------------------------------------------------------------------------
create or replace function public.permiso_de_cliente(p_cliente uuid)
returns table (texto_version text, otorgado_en timestamptz, registrado_por text)
language sql
stable
security invoker
set search_path = ''
as $$
  select k.texto_version,
         k.otorgado_en,
         coalesce(app.nombre_de_persona(k.registrado_por), 'otra persona')
    from public.consentimientos k
   where k.cliente_id = p_cliente and k.revocado_en is null
   order by k.otorgado_en desc
   limit 1;
$$;
revoke execute on function public.permiso_de_cliente(uuid) from public, anon;
grant execute on function public.permiso_de_cliente(uuid) to authenticated;

-- -----------------------------------------------------------------------------
-- Registro de exportaciones (decisión 6). Nadie lo corrige ni lo borra.
-- -----------------------------------------------------------------------------
create table public.exportaciones_clientes (
  id            uuid primary key default gen_random_uuid(),
  exportado_por uuid not null default auth.uid() references auth.users(id) on delete restrict,
  exportado_en  timestamptz not null default now(),
  formato       text not null check (formato in ('xlsx', 'pdf')),
  cantidad      integer not null check (cantidad >= 0),
  filtro        jsonb not null default '{}'::jsonb
);

comment on table public.exportaciones_clientes is
  'Cada descarga de la lista de clientes: quién, cuándo, cuántos, filtro y formato (decisión 6).';

alter table public.exportaciones_clientes enable row level security;
alter table public.exportaciones_clientes force row level security;
create policy "administracion registra exportaciones"
  on public.exportaciones_clientes for insert to authenticated
  with check (
    (select app.es_rol('superadmin', 'administrador'))
    and exportado_por = (select auth.uid())
  );
create policy "administracion lee exportaciones"
  on public.exportaciones_clientes for select to authenticated
  using ((select app.es_rol('superadmin', 'administrador')));
revoke update, delete on public.exportaciones_clientes from anon, authenticated;
