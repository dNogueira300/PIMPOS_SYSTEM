-- Verifica la RLS de `roles` y `perfiles` y el hook del access token (0003).
--
-- Cubre, para las tablas que ya existen, dos de las nueve pruebas obligatorias
-- del doc 02 §11.3: "solo el superadmin puede eliminar un perfil" y el aislamiento
-- del usuario anonimo. Y la comprobacion 4 del cierre de Fase 0: el rol viaja
-- en el JWT.
begin;
select plan(27);

-- =============================================================================
-- Fixtures. Se insertan como `postgres`, que salta RLS.
-- =============================================================================
insert into auth.users (id, email, created_at, updated_at) values
  ('11111111-1111-1111-1111-111111111111', 'super@pimpos.test',  now(), now()),
  ('22222222-2222-2222-2222-222222222222', 'admin@pimpos.test',  now(), now()),
  ('33333333-3333-3333-3333-333333333333', 'inge@pimpos.test',   now(), now()),
  ('44444444-4444-4444-4444-444444444444', 'reparto@pimpos.test',now(), now()),
  ('55555555-5555-5555-5555-555555555555', 'baja@pimpos.test',   now(), now());

insert into public.perfiles (id, rol, nombre_completo, activo) values
  ('11111111-1111-1111-1111-111111111111', 'superadmin',    'Organda Sifuentes', true),
  ('22222222-2222-2222-2222-222222222222', 'administrador', 'Administradora',    true),
  ('33333333-3333-3333-3333-333333333333', 'ingeniero',     'Marcos',            true),
  ('44444444-4444-4444-4444-444444444444', 'repartidor',    'Repartidor 1',      true),
  ('55555555-5555-5555-5555-555555555555', 'ingeniero',     'Debra (de baja)',   false);

-- Las aserciones de visibilidad se acotan a estos ids. Contar la tabla entera
-- haria que la prueba dependiera de que la base este vacia, y entonces fallaria
-- despues de restaurar un respaldo o de cargar semillas nuevas.
create temp table fixture (id uuid primary key);
insert into fixture
  select id from public.perfiles
   where id in ('11111111-1111-1111-1111-111111111111',
                '22222222-2222-2222-2222-222222222222',
                '33333333-3333-3333-3333-333333333333',
                '44444444-4444-4444-4444-444444444444',
                '55555555-5555-5555-5555-555555555555');
grant select on fixture to anon, authenticated;

-- =============================================================================
-- Estructura
-- =============================================================================
select has_table('public', 'roles',    'existe public.roles');
select has_table('public', 'perfiles', 'existe public.perfiles');

select ok(
  (select relrowsecurity from pg_class where oid = 'public.roles'::regclass),
  'roles tiene RLS activada'
);
select ok(
  (select relrowsecurity from pg_class where oid = 'public.perfiles'::regclass),
  'perfiles tiene RLS activada'
);
select ok(
  (select relforcerowsecurity from pg_class where oid = 'public.perfiles'::regclass),
  'perfiles tiene RLS forzada tambien para el dueno de la tabla'
);

-- El catalogo de roles no se toca desde la API: sin politicas de escritura.
select is(
  (select count(*)::int from pg_policies
    where schemaname = 'public' and tablename = 'roles'
      and cmd in ('INSERT', 'UPDATE', 'DELETE')),
  0,
  'roles no tiene ninguna politica de escritura'
);

select is(
  (select count(*)::int from public.roles),
  4,
  'la semilla cargo los 4 roles'
);

-- =============================================================================
-- Hook del access token (doc 01 §3.4)
-- =============================================================================
select is(
  app.custom_access_token(
    '{"user_id": "11111111-1111-1111-1111-111111111111", "claims": {"sub": "x"}}'::jsonb
  ) -> 'claims' ->> 'rol',
  'superadmin',
  'el hook inyecta el rol del superadmin en el JWT'
);

select is(
  app.custom_access_token(
    '{"user_id": "44444444-4444-4444-4444-444444444444", "claims": {"sub": "x"}}'::jsonb
  ) -> 'claims' ->> 'rol',
  'repartidor',
  'el hook inyecta el rol del repartidor en el JWT'
);

select is(
  app.custom_access_token(
    '{"user_id": "55555555-5555-5555-5555-555555555555", "claims": {"sub": "x"}}'::jsonb
  ) -> 'claims' ->> 'rol',
  null,
  'un perfil inactivo sale del hook con rol nulo'
);

select is(
  app.custom_access_token(
    '{"user_id": "99999999-9999-9999-9999-999999999999", "claims": {"sub": "x"}}'::jsonb
  ) -> 'claims' ->> 'rol',
  null,
  'un usuario sin perfil sale del hook con rol nulo'
);

select is(
  app.custom_access_token(
    '{"user_id": "11111111-1111-1111-1111-111111111111", "claims": {"sub": "x", "email": "a@b.c"}}'::jsonb
  ) -> 'claims' ->> 'email',
  'a@b.c',
  'el hook conserva los claims que ya traia el evento'
);

-- =============================================================================
-- Lectura anonima: ninguna (doc 02 §11)
-- =============================================================================
set local role anon;

select is(
  (select count(*)::int from public.perfiles), 0,
  'un usuario anonimo no ve ningun perfil'
);
select is(
  (select count(*)::int from public.roles), 0,
  'un usuario anonimo no ve el catalogo de roles'
);

reset role;

-- =============================================================================
-- Lectura autenticada
-- =============================================================================

-- --- Repartidor: solo el suyo ------------------------------------------------
set local role authenticated;
set local request.jwt.claims = '{"sub": "44444444-4444-4444-4444-444444444444", "rol": "repartidor"}';

select is(
  (select count(*)::int from public.perfiles where id in (select id from fixture)), 1,
  'un repartidor solo ve su propio perfil'
);
select is(
  (select nombre_completo from public.perfiles where id in (select id from fixture)), 'Repartidor 1',
  'y el perfil que ve es el suyo'
);
select is(
  (select count(*)::int from public.roles), 4,
  'cualquier autenticado lee el catalogo de roles'
);

-- Un repartidor no crea usuarios.
select throws_ok(
  $$ insert into public.perfiles (id, rol, nombre_completo)
     values ('66666666-6666-6666-6666-666666666666', 'repartidor', 'Colado') $$,
  '42501',
  null,
  'un repartidor no puede crear perfiles'
);

-- --- Ingeniero: tampoco administra -------------------------------------------
set local request.jwt.claims = '{"sub": "33333333-3333-3333-3333-333333333333", "rol": "ingeniero"}';

select is(
  (select count(*)::int from public.perfiles where id in (select id from fixture)), 1,
  'un ingeniero solo ve su propio perfil'
);
select is(
  (select count(*)::int from public.perfiles
    where id = '44444444-4444-4444-4444-444444444444'), 0,
  'un ingeniero no ve el perfil de otro'
);

-- --- Administrador: ve todos, edita, pero no elimina -------------------------
set local request.jwt.claims = '{"sub": "22222222-2222-2222-2222-222222222222", "rol": "administrador"}';

select is(
  (select count(*)::int from public.perfiles where id in (select id from fixture)), 5,
  'un administrador ve todos los perfiles'
);

select lives_ok(
  $$ update public.perfiles set celular = '965000000'
      where id = '44444444-4444-4444-4444-444444444444' $$,
  'un administrador puede editar un perfil'
);

-- El delete no lanza error: la politica simplemente no deja ver la fila que
-- borrar, asi que afecta a 0 filas. Es el comportamiento correcto de RLS.
delete from public.perfiles where id = '44444444-4444-4444-4444-444444444444';
select is(
  (select count(*)::int from public.perfiles
    where id = '44444444-4444-4444-4444-444444444444'), 1,
  'un administrador NO puede eliminar un perfil'
);

-- --- Superadmin: unico que elimina (ficha 12.1) ------------------------------
set local request.jwt.claims = '{"sub": "11111111-1111-1111-1111-111111111111", "rol": "superadmin"}';

select is(
  (select count(*)::int from public.perfiles where id in (select id from fixture)), 5,
  'un superadmin ve todos los perfiles'
);

delete from public.perfiles where id = '44444444-4444-4444-4444-444444444444';
select is(
  (select count(*)::int from public.perfiles
    where id = '44444444-4444-4444-4444-444444444444'), 0,
  'solo el superadmin puede eliminar un perfil'
);

-- --- Sesion sin rol: sesion valida, cero permisos ----------------------------
set local request.jwt.claims = '{"sub": "55555555-5555-5555-5555-555555555555", "rol": null}';

select is(
  (select count(*)::int from public.perfiles where id in (select id from fixture)), 1,
  'un usuario dado de baja solo se ve a si mismo, nada mas'
);
select throws_ok(
  $$ insert into public.perfiles (id, rol, nombre_completo)
     values ('77777777-7777-7777-7777-777777777777', 'ingeniero', 'Colado') $$,
  '42501',
  null,
  'un usuario dado de baja no puede crear perfiles'
);

reset role;

select * from finish();
rollback;
