-- =============================================================================
-- 0045_historial.sql
-- Lo que necesita la pantalla del historial (F7, módulo de auditoría). El
-- historial de cambios NO necesita nada: lee `public.auditoria` (0007). Aquí
-- va lo que faltaba para sus otras tres pestañas, todo de solo lectura.
--
--   1. `ingresos_al_sistema`: quién entró y quién salió, del registro de Auth.
--   2. `constancias_de_borrado` y `descargas_de_clientes`: las tablas de 0043,
--      con el nombre de la persona.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Guarda: sin poder leer el registro de Auth, esta migración no debe aplicarse.
--
-- `ingresos_al_sistema` es de quien corre la migración. Si ese rol no puede
-- leer `auth.audit_log_entries`, o no salta su RLS, la pestaña «Ingresos»
-- saldría vacía para siempre, sin decir por qué. Mejor que la migración no
-- entre, avisando (misma idea que la guarda de 0030).
-- -----------------------------------------------------------------------------
do $$
declare
  v_leer    boolean := has_table_privilege(current_user, 'auth.audit_log_entries', 'SELECT');
  v_sin_rls boolean := (select rolbypassrls or rolsuper from pg_roles where rolname = current_user);
  v_con_rls boolean := (select relrowsecurity from pg_class where oid = 'auth.audit_log_entries'::regclass);
begin
  if not v_leer or (v_con_rls and not v_sin_rls) then
    raise exception using
      message = format(
        '0045 no se aplicó: el rol %s no puede leer auth.audit_log_entries. Sin eso, la pestaña «Ingresos» del historial saldría vacía.',
        current_user),
      hint = 'No se aplicó nada de esta migración. Revisa los privilegios de ese rol sobre el esquema auth antes de volver a intentarlo.';
  end if;
end;
$$;

-- -----------------------------------------------------------------------------
-- 1. Ingresos al sistema
--
-- `security definer`: el registro de Auth no lo puede leer nadie con sesión.
-- Por eso comprueba el rol ella misma, y solo devuelve lo que la administración
-- ya puede saber: quién usa el panel. Solo `login` y `logout`: las altas y las
-- eliminaciones de usuarios ya salen en el historial de cambios (`perfiles`), y
-- un refresco de sesión no es un ingreso. `payload` es `json`, no `jsonb`.
-- Supabase no anota los intentos fallidos (comprobado en local el 06/10/2026), y
-- la IP, la anote o no el proyecto alojado, esta función no la devuelve.
-- -----------------------------------------------------------------------------
create or replace function public.ingresos_al_sistema(
  p_desde   timestamptz,
  p_hasta   timestamptz,
  p_usuario uuid default null
)
returns table (
  ocurrido_en timestamptz,
  accion      text,
  usuario_id  uuid,
  correo      text,
  nombre      text
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not (select app.es_rol('superadmin', 'administrador')) then
    raise exception 'Solo la administración puede ver los ingresos al sistema.' using errcode = '42501';
  end if;

  return query
  select e.created_at,
         case e.payload ->> 'action' when 'login' then 'ingreso' else 'salida' end,
         p.id,
         e.payload ->> 'actor_username',
         p.nombre_completo
    from auth.audit_log_entries e
    -- Por texto: `actor_id` viene dentro de un JSON y no siempre es un uuid.
    left join public.perfiles p on p.id::text = e.payload ->> 'actor_id'
   where e.payload ->> 'action' in ('login', 'logout')
     and e.created_at >= p_desde
     and e.created_at <  p_hasta
     and (p_usuario is null or e.payload ->> 'actor_id' = p_usuario::text)
   order by e.created_at desc
   limit 500;
end;
$$;

comment on function public.ingresos_al_sistema(timestamptz, timestamptz, uuid) is
  'Quién entró y quién salió del panel, del registro de Auth. Solo administración; como mucho 500 filas.';
revoke execute on function public.ingresos_al_sistema(timestamptz, timestamptz, uuid) from public, anon;
grant execute on function public.ingresos_al_sistema(timestamptz, timestamptz, uuid) to authenticated;

-- -----------------------------------------------------------------------------
-- 2. Constancias de borrado y descargas, con el nombre de la persona
--
-- `security_invoker`: las vistas no dan nada que las tablas no dieran ya. Solo
-- la administración lee `supresiones` y `exportaciones_clientes` (0043), y la
-- administración lee todos los perfiles.
-- -----------------------------------------------------------------------------
create view public.constancias_de_borrado
with (security_invoker = true) as
select s.id,
       s.cliente_id,
       s.borrado_en,
       s.motivo,
       s.borrado_por,
       p.nombre_completo as borrado_por_nombre
  from public.supresiones s
  left join public.perfiles p on p.id = s.borrado_por;

comment on view public.constancias_de_borrado is
  'Constancias de borrado de datos de clientes (0043) con el nombre de quien borró. security_invoker.';
grant select on public.constancias_de_borrado to authenticated;

create view public.descargas_de_clientes
with (security_invoker = true) as
select e.id,
       e.exportado_en,
       e.exportado_por,
       p.nombre_completo     as exportado_por_nombre,
       e.formato,
       e.cantidad,
       e.filtro ->> 'zona'   as zona,
       e.filtro ->> 'estado' as estado
  from public.exportaciones_clientes e
  left join public.perfiles p on p.id = e.exportado_por;

comment on view public.descargas_de_clientes is
  'Descargas de la lista de clientes (0043) con el nombre de quien descargó. security_invoker.';
grant select on public.descargas_de_clientes to authenticated;
