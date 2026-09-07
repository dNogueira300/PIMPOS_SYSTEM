-- Verifica el catalogo de roles (0004) y el perfil automatico (0005 + 0006).
--
-- La regla que sostiene todo este archivo: un alta NUNCA concede permisos por
-- si sola. El rol lo asigna una persona, con una escritura explicita.
begin;
select plan(17);

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
-- El trigger existe y esta enganchado
-- =============================================================================
select has_function('app', 'crear_perfil_de_usuario', 'existe la funcion del trigger');
select ok(
  exists (select 1 from pg_trigger
           where tgname = 'crear_perfil_al_alta_de_usuario'
             and tgrelid = 'auth.users'::regclass),
  'el trigger esta enganchado a auth.users'
);

-- =============================================================================
-- Alta simple: se crea sola, pero inerte
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
  'y nace INACTIVA'
);
select is(
  (select nombre_completo from public.perfiles
    where id = 'aaaaaaaa-0000-0000-0000-000000000001'),
  'sinmeta',
  'a falta de nombre, se usa la parte local del correo'
);
select is(
  app.custom_access_token(
    '{"user_id": "aaaaaaaa-0000-0000-0000-000000000001", "claims": {}}'::jsonb
  ) -> 'claims' ->> 'rol',
  null,
  'el hook le emite rol nulo: existe la cuenta, no los permisos'
);

-- =============================================================================
-- Ningun metadato concede el rol (0006)
--
-- `raw_user_meta_data` lo escribe el propio usuario (updateUser, o
-- options.data al registrarse). `raw_app_meta_data` solo la Admin API, pero
-- GoTrue lo rellena en un UPDATE posterior al INSERT, asi que este trigger
-- tampoco llegaria a verlo. Ni uno ni otro decide permisos.
-- =============================================================================
insert into auth.users (id, email, created_at, updated_at, raw_user_meta_data)
values ('aaaaaaaa-0000-0000-0000-000000000002', 'colado@pimpos.test', now(), now(),
        '{"rol": "superadmin", "nombre_completo": "Colado"}'::jsonb);

select is(
  (select activo from public.perfiles
    where id = 'aaaaaaaa-0000-0000-0000-000000000002'),
  false,
  'un rol pedido en user_metadata no activa la cuenta'
);
select is(
  app.custom_access_token(
    '{"user_id": "aaaaaaaa-0000-0000-0000-000000000002", "claims": {}}'::jsonb
  ) -> 'claims' ->> 'rol',
  null,
  'y su JWT sale sin rol: cero permisos'
);
select is(
  (select nombre_completo from public.perfiles
    where id = 'aaaaaaaa-0000-0000-0000-000000000002'),
  'Colado',
  'el nombre si se acepta de los metadatos: es presentacion, no autorizacion'
);

insert into auth.users (id, email, created_at, updated_at, raw_app_meta_data)
values ('aaaaaaaa-0000-0000-0000-000000000003', 'apimeta@pimpos.test', now(), now(),
        '{"rol": "superadmin"}'::jsonb);

select is(
  (select activo from public.perfiles
    where id = 'aaaaaaaa-0000-0000-0000-000000000003'),
  false,
  'un rol pedido en app_metadata tampoco activa la cuenta'
);

-- =============================================================================
-- La activacion explicita: como lo hace un administrador de verdad
-- =============================================================================
update public.perfiles p
   set rol = 'ingeniero', nombre_completo = 'Marcos', activo = true
  from auth.users u
 where u.id = p.id
   and u.email = 'sinmeta@pimpos.test';

select is(
  (select rol from public.perfiles
    where id = 'aaaaaaaa-0000-0000-0000-000000000001'),
  'ingeniero'::app.rol_usuario,
  'un administrador asigna el rol por correo, sin copiar UUID'
);
select is(
  app.custom_access_token(
    '{"user_id": "aaaaaaaa-0000-0000-0000-000000000001", "claims": {}}'::jsonb
  ) -> 'claims' ->> 'rol',
  'ingeniero',
  'y desde ese momento el hook si emite su rol'
);

-- Y al darla de baja vuelve a quedarse sin nada, sin borrar la fila.
update public.perfiles set activo = false
 where id = 'aaaaaaaa-0000-0000-0000-000000000001';

select is(
  app.custom_access_token(
    '{"user_id": "aaaaaaaa-0000-0000-0000-000000000001", "claims": {}}'::jsonb
  ) -> 'claims' ->> 'rol',
  null,
  'dar de baja a alguien le quita los permisos en el siguiente token'
);

-- =============================================================================
-- El trigger no pisa un perfil que ya exista
-- =============================================================================
update public.perfiles set activo = true
 where id = 'aaaaaaaa-0000-0000-0000-000000000001';

select lives_ok(
  $$ insert into auth.users (id, email, created_at, updated_at)
     values ('aaaaaaaa-0000-0000-0000-000000000004', 'otro@pimpos.test', now(), now()) $$,
  'altas posteriores no interfieren con perfiles ya existentes'
);
select is(
  (select rol from public.perfiles
    where id = 'aaaaaaaa-0000-0000-0000-000000000001'),
  'ingeniero'::app.rol_usuario,
  'y el perfil ya asignado conserva su rol'
);

select * from finish();
rollback;
