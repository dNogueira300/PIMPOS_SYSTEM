-- Verifica que desactivar a alguien o restablecer su contraseña le cierre la
-- sesión en el acto (0030), y no en «hasta una hora».
--
-- Dos mitades: borrar sus filas de auth.sessions (se acabó el refresh) y que
-- app.rol_actual() deje de reconocer el access token que todavía tiene en la
-- mano (se acabó el rol en la RLS).
begin;
select plan(19);

insert into auth.users (id, email, created_at, updated_at) values
  ('11111111-1111-1111-1111-111111111111', 'super@pimpos.test',   now(), now()),
  ('22222222-2222-2222-2222-222222222222', 'admin@pimpos.test',   now(), now()),
  ('33333333-3333-3333-3333-333333333333', 'reparto@pimpos.test', now(), now()),
  ('44444444-4444-4444-4444-444444444444', 'inge@pimpos.test',    now(), now());
update public.perfiles set rol = 'superadmin',    activo = true where id = '11111111-1111-1111-1111-111111111111';
update public.perfiles set rol = 'administrador', activo = true where id = '22222222-2222-2222-2222-222222222222';
update public.perfiles set rol = 'repartidor',    activo = true where id = '33333333-3333-3333-3333-333333333333';
update public.perfiles set rol = 'ingeniero',     activo = true where id = '44444444-4444-4444-4444-444444444444';

-- Dos sesiones del repartidor (celular y computadora) y una del ingeniero.
insert into auth.sessions (id, user_id, created_at, updated_at) values
  ('aaaaaaaa-0000-0000-0000-000000000001', '33333333-3333-3333-3333-333333333333', now(), now()),
  ('aaaaaaaa-0000-0000-0000-000000000002', '33333333-3333-3333-3333-333333333333', now(), now()),
  ('bbbbbbbb-0000-0000-0000-000000000001', '44444444-4444-4444-4444-444444444444', now(), now());
insert into auth.refresh_tokens (token, user_id, session_id, revoked, created_at, updated_at) values
  ('token-reparto-prueba-0030', '33333333-3333-3333-3333-333333333333',
   'aaaaaaaa-0000-0000-0000-000000000001', false, now(), now());

-- --- El token que el usuario todavía tiene en la mano ----------------------
set local role authenticated;

set local request.jwt.claims =
  '{"sub": "44444444-4444-4444-4444-444444444444", "rol": "ingeniero", "session_id": "bbbbbbbb-0000-0000-0000-000000000001"}';
select is(app.rol_actual(), 'ingeniero'::app.rol_usuario,
  'con una session_id que existe, el rol del token vale');

set local request.jwt.claims =
  '{"sub": "44444444-4444-4444-4444-444444444444", "rol": "ingeniero", "session_id": "cccccccc-0000-0000-0000-000000000009"}';
select is(app.rol_actual(), null::app.rol_usuario,
  'con una session_id que ya no existe, no hay rol');
select is(app.es_rol('ingeniero'), false,
  'y es_rol() falla cerrado con ella');

set local request.jwt.claims =
  '{"sub": "44444444-4444-4444-4444-444444444444", "rol": "ingeniero"}';
select is(app.rol_actual(), 'ingeniero'::app.rol_usuario,
  'sin session_id (pruebas, llamadas internas) se conserva el comportamiento de siempre');

-- --- La pregunta del panel: public.sesion_abierta() --------------------------
set local request.jwt.claims =
  '{"sub": "44444444-4444-4444-4444-444444444444", "rol": "ingeniero", "session_id": "bbbbbbbb-0000-0000-0000-000000000001"}';
select is(public.sesion_abierta(), true, 'sesion_abierta(): sí, con una sesión que existe');
set local request.jwt.claims =
  '{"sub": "44444444-4444-4444-4444-444444444444", "rol": "ingeniero", "session_id": "cccccccc-0000-0000-0000-000000000009"}';
select is(public.sesion_abierta(), false, 'sesion_abierta(): no, con una sesión cerrada');
set local request.jwt.claims =
  '{"sub": "44444444-4444-4444-4444-444444444444", "rol": "ingeniero"}';
select is(public.sesion_abierta(), true, 'sesion_abierta(): sí, sin session_id (como rol_actual)');

-- --- Solo la service_role cierra sesiones a mano ----------------------------
select throws_ok(
  $$ select public.cerrar_sesiones('44444444-4444-4444-4444-444444444444') $$,
  '42501', null,
  'authenticated no puede ejecutar cerrar_sesiones'
);
set local role anon;
select throws_ok(
  $$ select public.cerrar_sesiones('44444444-4444-4444-4444-444444444444') $$,
  '42501', null,
  'anon tampoco'
);
select throws_ok(
  $$ select public.sesion_abierta() $$,
  '42501', null,
  'anon no pregunta por sesiones: no tiene ninguna'
);

-- --- Desactivar cierra las sesiones de esa persona y de nadie más -----------
set local role authenticated;
set local request.jwt.claims =
  '{"sub": "22222222-2222-2222-2222-222222222222", "rol": "administrador"}';
select lives_ok(
  $$ update public.perfiles set activo = false where id = '33333333-3333-3333-3333-333333333333' $$,
  'un administrador sigue pudiendo desactivar a otra persona'
);

reset role;
select is(
  (select count(*) from auth.sessions where user_id = '33333333-3333-3333-3333-333333333333'),
  0::bigint,
  'al desactivarlo, sus dos sesiones desaparecen'
);
select is(
  (select count(*) from auth.refresh_tokens where token = 'token-reparto-prueba-0030'),
  0::bigint,
  'y su refresh token con ellas (cascada de la FK)'
);
select is(
  (select count(*) from auth.sessions where user_id = '44444444-4444-4444-4444-444444444444'),
  1::bigint,
  'la sesión de otra persona no se toca'
);

-- Reactivarlo no resucita nada ni falla.
update public.perfiles set activo = true where id = '33333333-3333-3333-3333-333333333333';
insert into auth.sessions (id, user_id, created_at, updated_at) values
  ('aaaaaaaa-0000-0000-0000-000000000003', '33333333-3333-3333-3333-333333333333', now(), now());

-- Cambiar otra cosa del perfil (el nombre) no cierra nada.
update public.perfiles set nombre_completo = 'Repartidor con otro nombre'
 where id = '33333333-3333-3333-3333-333333333333';
select is(
  (select count(*) from auth.sessions where user_id = '33333333-3333-3333-3333-333333333333'),
  1::bigint,
  'editar el nombre no cierra la sesión'
);

-- --- Eliminar (borrado lógico) también las cierra ----------------------------
set local role authenticated;
set local request.jwt.claims =
  '{"sub": "11111111-1111-1111-1111-111111111111", "rol": "superadmin"}';
update public.perfiles set deleted_at = now() where id = '33333333-3333-3333-3333-333333333333';
reset role;
select is(
  (select count(*) from auth.sessions where user_id = '33333333-3333-3333-3333-333333333333'),
  0::bigint,
  'al eliminarlo, su sesión desaparece'
);

-- --- Restablecer la contraseña: la service_role llama a cerrar_sesiones -----
set local role service_role;
select lives_ok(
  $$ select public.cerrar_sesiones('44444444-4444-4444-4444-444444444444') $$,
  'la service_role sí puede cerrar las sesiones de alguien'
);
reset role;
select is(
  (select count(*) from auth.sessions where user_id = '44444444-4444-4444-4444-444444444444'),
  0::bigint,
  'y después ya no le queda ninguna'
);

select ok(
  (select not has_function_privilege('authenticated', 'public.cerrar_sesiones(uuid)', 'execute')
      and not has_function_privilege('anon', 'public.cerrar_sesiones(uuid)', 'execute')
      and has_function_privilege('service_role', 'public.cerrar_sesiones(uuid)', 'execute')),
  'EXECUTE de cerrar_sesiones: solo service_role'
);

select * from finish();
rollback;
