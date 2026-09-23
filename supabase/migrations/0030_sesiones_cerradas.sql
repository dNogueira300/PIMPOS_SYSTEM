-- =============================================================================
-- 0030_sesiones_cerradas.sql
-- Desactivar a alguien o restablecer su contraseña le cierra la sesión EN EL
-- ACTO (pedido de Dan en la revisión del PR #57, F4 tarea 6).
--
-- Hasta aquí, quien tenía una sesión abierta la conservaba hasta una hora:
-- el bloqueo de Auth impide renovar el token, pero el access token que ya
-- tiene en la mano sigue firmado y válido, y la RLS lee el rol de ese token
-- (0002/0003), no de la tabla. Se cierra por dos lados:
--
--   1. Se borran sus filas de auth.sessions. Los refresh tokens cuelgan de
--      ellas con ON DELETE CASCADE (refresh_tokens_session_id_fkey,
--      comprobado en local): sin sesión no hay token nuevo.
--        - Al desactivar (activo true -> false) o eliminar (deleted_at deja de
--          ser null): un trigger sobre public.perfiles. La regla vive aquí,
--          no en la acción del panel.
--        - Al restablecer la contraseña: public.cerrar_sesiones(uuid), que
--          solo puede ejecutar la service_role y que llama la acción
--          restablecerClave justo después de cambiarla. Cambiar la PROPIA
--          contraseña (/cambiar-clave) no la llama: cerraría la sesión con la
--          que se está entrando.
--
--   2. app.rol_actual() deja de reconocer el access token cuya sesión ya no
--      existe. GoTrue mete siempre un claim `session_id` en los tokens que
--      emite, y la firma impide que alguien se invente uno. Si el claim NO
--      está (las pruebas pgTAP que ponen claims a mano, llamadas internas sin
--      sesión de usuario), se mantiene el comportamiento de siempre: quitarle
--      el rol a un token sin session_id no protege nada —no lo emite GoTrue—
--      y rompería cada prueba que simula un rol.
--
--      Coste: una búsqueda por clave primaria en auth.sessions, y solo cuando
--      hay session_id. Las políticas envuelven es_rol() en `(select ...)`,
--      así que se evalúa una vez por consulta, no por fila. La función sigue
--      siendo `stable`.
--
-- Privilegios: auth.sessions es de supabase_auth_admin y tiene RLS activada
-- sin políticas. Las funciones de abajo son SECURITY DEFINER con dueño
-- `postgres`, que en local tiene DELETE y SELECT sobre ella y BYPASSRLS
-- (comprobado con has_table_privilege y pg_roles). En el alojado hay que
-- comprobar lo mismo antes de desplegar: ver el informe de la tarea 6.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Guarda: sin estos privilegios, 0030 no debe aplicarse.
--
-- Las funciones de abajo son de quien corre la migración (current_user). Si
-- no puede LEER auth.sessions, app.rol_actual() lanzaría un error en CADA
-- consulta con sesión: el panel entero caído. Si no salta la RLS de
-- auth.sessions (activada, sin políticas), no vería ninguna fila:
-- sesion_vigente() diría «cerrada» a todos y nadie tendría rol. Y sin DELETE,
-- desactivar a alguien fallaría. Mejor que la migración no entre, avisando.
-- Como toda migración corre en una transacción, nada de lo de abajo se aplica.
-- -----------------------------------------------------------------------------
do $$
declare
  v_leer    boolean := has_table_privilege(current_user, 'auth.sessions', 'SELECT');
  v_borrar  boolean := has_table_privilege(current_user, 'auth.sessions', 'DELETE');
  v_sin_rls boolean := (select rolbypassrls or rolsuper from pg_roles where rolname = current_user);
begin
  if not (v_leer and v_borrar and v_sin_rls) then
    raise exception using
      message = format(
        '0030 no se aplicó: el rol %s no puede %s. Sin eso, el panel se quedaría sin acceso para todos.',
        current_user,
        concat_ws(', ',
          case when not v_leer    then 'leer auth.sessions (SELECT)' end,
          case when not v_borrar  then 'borrar de auth.sessions (DELETE)' end,
          case when not v_sin_rls then 'saltar la RLS (BYPASSRLS)' end)),
      hint = 'No se aplicó nada de esta migración. Revisa los privilegios con el SQL del informe de la tarea 6 antes de volver a intentarlo.';
  end if;
end;
$$;

-- -----------------------------------------------------------------------------
-- ¿Sigue existiendo esta sesión? La usa rol_actual(), que corre con los
-- privilegios de quien consulta (authenticated), y authenticated no puede leer
-- auth.sessions: por eso es SECURITY DEFINER. Solo contesta sí o no sobre un
-- uuid que el propio llamante trae en su token firmado.
-- -----------------------------------------------------------------------------
create or replace function app.sesion_vigente(p_sesion uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from auth.sessions s where s.id = p_sesion);
$$;

comment on function app.sesion_vigente(uuid) is
  'true si la sesión existe en auth.sessions. La usa app.rol_actual() para no reconocer tokens de sesiones cerradas.';

revoke execute on function app.sesion_vigente(uuid) from public;
grant  execute on function app.sesion_vigente(uuid) to authenticated, anon, service_role;

-- -----------------------------------------------------------------------------
-- rol_actual(): misma firma, mismo NULL sin sesión (0002). Nuevo: NULL también
-- si el token trae una session_id que ya no existe.
-- -----------------------------------------------------------------------------
create or replace function app.rol_actual()
returns app.rol_usuario
language sql
stable
set search_path = ''
as $$
  select case
           when c ->> 'session_id' is not null
                and not app.sesion_vigente((c ->> 'session_id')::uuid)
             then null
           else nullif(c ->> 'rol', '')::app.rol_usuario
         end
    from (select nullif(current_setting('request.jwt.claims', true), '')::jsonb as c) as claims;
$$;

comment on function app.rol_actual() is
  'Rol del peticionario, leído del claim `rol` del JWT. NULL si no hay sesión o si su session_id ya no existe (0030).';

-- -----------------------------------------------------------------------------
-- ¿La sesión de quien pregunta sigue abierta? Para el panel: getClaims()
-- verifica la firma del token en local y no se entera de que su sesión se
-- cerró. Se eligió esta pregunta a PostgREST en vez de `auth.getUser()` por
-- coste, medido en local: ~20 ms frente a ~200-350 ms en reposo, y más de un
-- segundo con la suite E2E en marcha (GoTrue comparte CPU con el bcrypt de
-- cada ingreso). Contesta lo mismo que rol_actual(): un token sin session_id
-- (no lo emite GoTrue) cuenta como abierto.
-- -----------------------------------------------------------------------------
create or replace function public.sesion_abierta()
returns boolean
language sql
stable
set search_path = ''
as $$
  select case
           when c ->> 'session_id' is null then true
           else app.sesion_vigente((c ->> 'session_id')::uuid)
         end
    from (select nullif(current_setting('request.jwt.claims', true), '')::jsonb as c) as claims;
$$;

comment on function public.sesion_abierta() is
  'false si la session_id del token de quien pregunta ya no existe (sesión cerrada al desactivar o restablecer la contraseña).';

revoke execute on function public.sesion_abierta() from public, anon;
grant  execute on function public.sesion_abierta() to authenticated;

-- -----------------------------------------------------------------------------
-- Cerrar todas las sesiones de una persona. Solo la service_role: es la que
-- usa la acción de restablecer contraseña. Un usuario del panel no puede
-- llamarla ni por PostgREST (rpc) ni por SQL.
-- -----------------------------------------------------------------------------
create or replace function public.cerrar_sesiones(usuario uuid)
returns void
language sql
volatile
security definer
set search_path = ''
as $$
  delete from auth.sessions where user_id = usuario;
$$;

comment on function public.cerrar_sesiones(uuid) is
  'Cierra todas las sesiones de un usuario (y con ellas sus refresh tokens). Solo service_role. La llama restablecerClave.';

revoke execute on function public.cerrar_sesiones(uuid) from public, anon, authenticated;
grant  execute on function public.cerrar_sesiones(uuid) to service_role;

-- -----------------------------------------------------------------------------
-- Desactivar o eliminar desde perfiles cierra las sesiones. AFTER: si el
-- trigger de 0029 (BEFORE) niega el cambio, no se llega aquí.
-- -----------------------------------------------------------------------------
create or replace function app.cerrar_sesiones_al_dar_de_baja()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  delete from auth.sessions where user_id = new.id;
  return null;
end;
$$;

comment on function app.cerrar_sesiones_al_dar_de_baja() is
  'Trigger AFTER UPDATE en perfiles: al desactivar o eliminar una cuenta, borra sus sesiones.';

revoke execute on function app.cerrar_sesiones_al_dar_de_baja() from public, anon, authenticated;

create trigger perfiles_cerrar_sesiones
  after update of activo, deleted_at on public.perfiles
  for each row
  when (   (old.activo and not new.activo)
        or (old.deleted_at is null and new.deleted_at is not null))
  execute function app.cerrar_sesiones_al_dar_de_baja();
