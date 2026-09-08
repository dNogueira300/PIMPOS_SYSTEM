-- =============================================================================
-- 0015_cron_alertas.sql
-- Notificaciones y las dos tareas programadas (R7, R12; doc 02 §9.4).
--
-- RECORDATORIO QUE NO ES MENOR: si el proyecto Supabase se pausa por
-- inactividad, `pg_cron` DEJA DE EJECUTARSE. Ni las novedades caducan solas ni
-- salta ninguna alerta de stock. Por eso el keep-alive cada 3 días no es un
-- adorno, y por eso la RLS de novedades comprueba la vigencia por su cuenta
-- (0010): si el cron no corre, el publico sigue sin ver una promocion vencida.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Notificaciones (R12)
-- -----------------------------------------------------------------------------
create table public.notificaciones (
  id          uuid primary key default gen_random_uuid(),
  tipo        text not null check (tipo in ('stock_bajo', 'por_vencer', 'vencido')),
  titulo      text not null check (length(btrim(titulo)) > 0),
  -- En espanol y sin jerga: lo lee gente con nivel de computadora basico (R18).
  mensaje     text not null check (length(btrim(mensaje)) > 0),

  -- A que se refiere. Nullable porque una alerta futura podria no ser de un
  -- insumo.
  insumo_id   uuid references public.insumos(id) on delete cascade,
  lote_id     uuid references public.lotes_insumo(id) on delete cascade,

  -- Para no repetir la misma alerta cada dia. Es la clave de que el panel sea
  -- util y no una lista de doscientas notificaciones iguales.
  clave_unica text not null,

  leida_en    timestamptz,
  leida_por   uuid references auth.users(id) on delete set null,
  resuelta_en timestamptz,
  created_at  timestamptz not null default now()
);

comment on table public.notificaciones is
  'Alertas de stock bajo y de vencimiento proximo (R12). Las genera app.evaluar_alertas() por cron.';
comment on column public.notificaciones.clave_unica is
  'Identifica la alerta para no repetirla a diario. Ej: stock_bajo:<insumo>:2026-09-07';

-- Una alerta por clave y dia: si el stock sigue bajo manana, se genera otra
-- con la fecha nueva, pero hoy no se duplica.
create unique index idx_notificaciones_clave on public.notificaciones (clave_unica);
create index idx_notificaciones_pendientes on public.notificaciones (created_at desc)
  where leida_en is null and resuelta_en is null;

-- -----------------------------------------------------------------------------
-- La evaluacion de alertas
-- -----------------------------------------------------------------------------
create or replace function app.evaluar_alertas()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_creadas integer := 0;
  v_dias    integer;
  v_hoy     text := to_char(now() at time zone 'America/Lima', 'YYYY-MM-DD');
begin
  -- Cuantos dias de antelacion avisar. Es administrable (0008): si el negocio
  -- decide que 15 dias es poco, lo cambia desde el panel sin tocar codigo.
  select coalesce((valor #>> '{}')::integer, 15)
    into v_dias
    from public.configuracion_sitio
   where clave = 'dias_aviso_vencimiento';

  v_dias := coalesce(v_dias, 15);

  -- --- Stock por debajo del minimo ------------------------------------------
  insert into public.notificaciones (tipo, titulo, mensaje, insumo_id, clave_unica)
  select
    'stock_bajo',
    'Queda poco ' || i.nombre,
    'Quedan ' || trim(to_char(s.cantidad_base, 'FM999999990.99')) || ' ' || u.nombre ||
      ' de ' || i.nombre || ', y el mínimo es ' ||
      trim(to_char(i.stock_minimo, 'FM999999990.99')) || '. Conviene reponer.',
    i.id,
    'stock_bajo:' || i.id || ':' || v_hoy
  from public.saldos_insumo s
  join public.insumos i          on i.id = s.insumo_id
  join public.unidades_medida u  on u.id = i.unidad_base_id
  where i.activo
    and i.deleted_at is null
    and i.stock_minimo > 0
    and s.cantidad_base < i.stock_minimo
  on conflict (clave_unica) do nothing;

  get diagnostics v_creadas = row_count;

  -- --- Lotes por vencer -----------------------------------------------------
  insert into public.notificaciones (tipo, titulo, mensaje, insumo_id, lote_id, clave_unica)
  select
    case when l.fecha_vencimiento < current_date then 'vencido' else 'por_vencer' end,
    case when l.fecha_vencimiento < current_date
         then 'Venció ' || i.nombre
         else i.nombre || ' está por vencer' end,
    case when l.fecha_vencimiento < current_date
         then 'El lote ' || coalesce(l.codigo, 'sin código') || ' de ' || i.nombre ||
              ' venció el ' || to_char(l.fecha_vencimiento, 'DD/MM/YYYY') || '.'
         else 'El lote ' || coalesce(l.codigo, 'sin código') || ' de ' || i.nombre ||
              ' vence el ' || to_char(l.fecha_vencimiento, 'DD/MM/YYYY') || '.' end,
    i.id,
    l.id,
    'vencimiento:' || l.id || ':' || v_hoy
  from public.lotes_insumo l
  join public.insumos i on i.id = l.insumo_id
  where l.fecha_vencimiento is not null
    and l.fecha_vencimiento <= current_date + v_dias
    and i.deleted_at is null
    -- Solo si aun queda existencia: avisar de un lote ya consumido es ruido.
    and exists (
      select 1 from public.saldos_insumo s
       where s.insumo_id = i.id and s.cantidad_base > 0
    )
  on conflict (clave_unica) do nothing;

  get diagnostics v_dias = row_count;
  return v_creadas + v_dias;
end;
$$;

comment on function app.evaluar_alertas() is
  'Genera las notificaciones de stock bajo y vencimiento. La ejecuta pg_cron a diario.';

revoke execute on function app.evaluar_alertas() from public, anon, authenticated;

-- -----------------------------------------------------------------------------
-- Despublicar novedades vencidas (R7)
-- -----------------------------------------------------------------------------
create or replace function app.archivar_novedades_vencidas()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_filas integer;
begin
  update public.novedades
     set estado = 'archivado'
   where estado = 'publicado'
     and vigencia_fin is not null
     and vigencia_fin < now()
     and deleted_at is null;

  get diagnostics v_filas = row_count;
  return v_filas;
end;
$$;

comment on function app.archivar_novedades_vencidas() is
  'Archiva las novedades cuya vigencia expiro (R7). La RLS ya las oculta; esto deja el estado coherente.';

revoke execute on function app.archivar_novedades_vencidas() from public, anon, authenticated;

-- =============================================================================
-- RLS de notificaciones
-- =============================================================================
alter table public.notificaciones enable row level security;
alter table public.notificaciones force  row level security;

-- Sin politica `to anon`. El stock del negocio no le incumbe a un visitante.

create policy "insumos lee las notificaciones"
  on public.notificaciones for select to authenticated
  using ((select app.es_rol('superadmin', 'administrador', 'ingeniero')));

-- Marcarlas como leidas o resueltas es lo unico que se hace desde el panel.
create policy "insumos marca las notificaciones"
  on public.notificaciones for update to authenticated
  using      ((select app.es_rol('superadmin', 'administrador', 'ingeniero')))
  with check ((select app.es_rol('superadmin', 'administrador', 'ingeniero')));

-- Las crea el cron, no la aplicacion: sin politica de INSERT.
revoke insert, delete on public.notificaciones from anon, authenticated;

-- =============================================================================
-- Las dos tareas programadas.
--
-- Las horas van en UTC, que es como corre la base. Iquitos es UTC-5:
--   '5 5 * * *'  = 00:05 en Iquitos
--   '10 11 * * *' = 06:10 en Iquitos, justo antes del turno de la manana
--                   (la panaderia abre a las 4:00).
-- =============================================================================
do $$
begin
  -- `cron.schedule` falla si el trabajo ya existe, y esta migracion tiene que
  -- poder reaplicarse sobre una base que ya la tenga.
  perform cron.unschedule('despublicar-novedades')
   where exists (select 1 from cron.job where jobname = 'despublicar-novedades');

  perform cron.unschedule('evaluar-alertas')
   where exists (select 1 from cron.job where jobname = 'evaluar-alertas');

  perform cron.schedule(
    'despublicar-novedades',
    '5 5 * * *',
    $cron$ select app.archivar_novedades_vencidas(); $cron$
  );

  perform cron.schedule(
    'evaluar-alertas',
    '10 11 * * *',
    $cron$ select app.evaluar_alertas(); $cron$
  );
end $$;
