-- Verifica el catalogo de roles (0004) y el perfil automatico (0005).
begin;
select plan(16);

-- =============================================================================
-- 0004 -- el catalogo vive en una migracion, no en una semilla
-- =============================================================================
select is(
  (select count(*)::int from public.roles), 4,
  'las migraciones dejan los 4 roles cargados, sin depender de las semillas'
);

-- Cada valor del enum tiene su fila. Es lo que evita que un alta de usuario
-- falle por clave foranea, que fue justo lo que paso en produccion.
select is(
  (select count(*)::int
     from pg_enum e
     join pg_type t      on t.oid = e.enumtypid
     join pg_namespace n on n.oid = t.typnamespace
    where n.nspname = 'app' and t.typname = 'rol_usuario'
      and not exists (select 1 from public.roles r where r.codigo::text = e.enumlabel)),
  0,
  'todo valor de app.rol_usuario tiene su fila en public.roles'
);

-- =============================================================================
-- 0005 -- el trigger existe
-- =============================================================================
select has_function('app', 'crear_perfil_de_usuario', 'existe la funcion del trigger');
select ok(
  exists (select 1 from pg_trigger
           where tgname = 'crear_perfil_al_alta_de_usuario'
             and tgrelid = 'auth.users'::regclass),
  'el trigger esta enganchado a auth.users'
);

-- =============================================================================
-- Alta SIN metadatos: se crea, pero inerte
-- =============================================================================
insert into auth.users (id, email, created_at, updated_at)
values ('aaaaaaaa-0000-0000-0000-000000000001', 'sinmeta@pimpos.test', now(), now());

select is(
  (select count(*)::int from public.perfiles
    where id = 'aaaaaaaa-0000-0000-0000-000000000001'),
  1,
  'el perfil se crea solo, sin intervencion'
);
select is(
  (select activo from public.perfiles
    where id = 'aaaaaaaa-0000-0000-0000-000000000001'),
  false,
  'un alta sin rol explicito entra INACTIVA'
);
select is(
  (select nombre_completo from public.perfiles
    where id = 'aaaaaaaa-0000-0000-0000-000000000001'),
  'sinmeta',
  'a falta de nombre, se usa la parte local del correo'
);

-- Y lo que de verdad importa: inactivo significa cero permisos.
select is(
  app.custom_access_token(
    '{"user_id": "aaaaaaaa-0000-0000-0000-000000000001", "claims": {}}'::jsonb
  ) -> 'claims' ->> 'rol',
  null,
  'el hook le emite rol nulo: existe la cuenta, no los permisos'
);

-- =============================================================================
-- Alta CON metadatos validos: lista para usar
-- =============================================================================
insert into auth.users (id, email, created_at, updated_at, raw_user_meta_data)
values ('aaaaaaaa-0000-0000-0000-000000000002', 'marcos@pimpos.test', now(), now(),
        '{"rol": "ingeniero", "nombre_completo": "Marcos"}'::jsonb);

select is(
  (select rol from public.perfiles
    where id = 'aaaaaaaa-0000-0000-0000-000000000002'),
  'ingeniero'::app.rol_usuario,
  'el rol de los metadatos se aplica'
);
select is(
  (select activo from public.perfiles
    where id = 'aaaaaaaa-0000-0000-0000-000000000002'),
  true,
  'con rol explicito, la cuenta nace activa'
);
select is(
  (select nombre_completo from public.perfiles
    where id = 'aaaaaaaa-0000-0000-0000-000000000002'),
  'Marcos',
  'el nombre de los metadatos se aplica'
);
select is(
  app.custom_access_token(
    '{"user_id": "aaaaaaaa-0000-0000-0000-000000000002", "claims": {}}'::jsonb
  ) -> 'claims' ->> 'rol',
  'ingeniero',
  'y el hook ya emite su rol: alta de un clic'
);

-- =============================================================================
-- Alta con un rol inventado: no revienta, pero no otorga nada
-- =============================================================================
insert into auth.users (id, email, created_at, updated_at, raw_user_meta_data)
values ('aaaaaaaa-0000-0000-0000-000000000003', 'raro@pimpos.test', now(), now(),
        '{"rol": "gerente_supremo"}'::jsonb);

select is(
  (select activo from public.perfiles
    where id = 'aaaaaaaa-0000-0000-0000-000000000003'),
  false,
  'un rol que no existe en el enum no activa la cuenta'
);
select is(
  (select rol from public.perfiles
    where id = 'aaaaaaaa-0000-0000-0000-000000000003'),
  'repartidor'::app.rol_usuario,
  'cae al rol menos privilegiado, pero inactivo'
);

-- Un intento de colarse como superadmin tampoco funciona por accidente:
-- si el valor es valido, es porque un administrador lo escribio a proposito.
select is(
  app.custom_access_token(
    '{"user_id": "aaaaaaaa-0000-0000-0000-000000000003", "claims": {}}'::jsonb
  ) -> 'claims' ->> 'rol',
  null,
  'y sigue sin permisos'
);

-- =============================================================================
-- El trigger no pisa un perfil que ya exista
-- =============================================================================
update public.perfiles set rol = 'superadmin', activo = true
 where id = 'aaaaaaaa-0000-0000-0000-000000000001';

select lives_ok(
  $$ insert into auth.users (id, email, created_at, updated_at)
     values ('aaaaaaaa-0000-0000-0000-000000000004', 'otro@pimpos.test', now(), now()) $$,
  'altas posteriores no interfieren con perfiles ya existentes'
);

select * from finish();
rollback;
