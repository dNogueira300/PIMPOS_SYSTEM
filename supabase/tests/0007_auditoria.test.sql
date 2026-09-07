-- Verifica la auditoria (0007).
--
-- Cubre una de las nueve pruebas obligatorias del doc 02 §11.3: "Nadie puede
-- hacer update ni delete sobre app.auditoria". Es la que sostiene todo el
-- valor del registro: una auditoria editable no sirve de nada, porque quien
-- hiciera un cambio indebido podria borrar su rastro.
begin;
select plan(23);

-- =============================================================================
-- Fixtures
-- =============================================================================
insert into auth.users (id, email, created_at, updated_at) values
  ('11111111-1111-1111-1111-111111111111', 'super@pimpos.test', now(), now()),
  ('22222222-2222-2222-2222-222222222222', 'admin@pimpos.test', now(), now()),
  ('33333333-3333-3333-3333-333333333333', 'inge@pimpos.test',  now(), now());

update public.perfiles set rol = 'superadmin',    activo = true where id = '11111111-1111-1111-1111-111111111111';
update public.perfiles set rol = 'administrador', activo = true where id = '22222222-2222-2222-2222-222222222222';
update public.perfiles set rol = 'ingeniero',     activo = true where id = '33333333-3333-3333-3333-333333333333';

-- =============================================================================
-- Estructura
-- =============================================================================
select has_table('app', 'auditoria', 'existe app.auditoria');
select has_function('app', 'registrar_auditoria', 'existe la funcion del trigger');
select has_function('app', 'auditar', 'existe el atajo para enganchar el trigger');

select ok(
  (select relrowsecurity from pg_class where oid = 'app.auditoria'::regclass),
  'la auditoria tiene RLS activada'
);

-- La clave del asunto: solo hay politica de lectura.
select is(
  (select count(*)::int from pg_policies
    where schemaname = 'app' and tablename = 'auditoria'
      and cmd in ('INSERT', 'UPDATE', 'DELETE')),
  0,
  'la auditoria NO tiene politicas de escritura, ni para el superadmin'
);

-- =============================================================================
-- El trigger registra lo que pasa
-- =============================================================================
set local role authenticated;
set local request.jwt.claims = '{"sub": "22222222-2222-2222-2222-222222222222", "rol": "administrador"}';

update public.configuracion_sitio set valor = '"065 000111"' where clave = 'telefono';

reset role;

select is(
  (select count(*)::int from app.auditoria
    where tabla = 'public.configuracion_sitio' and operacion = 'UPDATE'),
  1,
  'un cambio en la configuracion queda registrado'
);
select is(
  (select usuario_id from app.auditoria where tabla = 'public.configuracion_sitio' limit 1),
  '22222222-2222-2222-2222-222222222222'::uuid,
  'y queda registrado QUIEN lo hizo'
);
select is(
  (select rol from app.auditoria where tabla = 'public.configuracion_sitio' limit 1),
  'administrador',
  'con el rol que tenia en ese momento'
);
select is(
  (select datos_antes ->> 'valor' from app.auditoria
    where tabla = 'public.configuracion_sitio' limit 1),
  '065 987654',
  'guarda el valor anterior'
);
select is(
  (select datos_despues ->> 'valor' from app.auditoria
    where tabla = 'public.configuracion_sitio' limit 1),
  '065 000111',
  'y el nuevo'
);

-- Un alta tambien. Se hace sin cambiar de rol porque `auth.users` es tabla de
-- GoTrue y `authenticated` no escribe en ella ni en produccion: los usuarios
-- los crea la Admin API.
insert into auth.users (id, email, created_at, updated_at)
values ('44444444-4444-4444-4444-444444444444', 'nuevo@pimpos.test', now(), now());

-- Se acota al usuario recien creado: los tres del fixture de arriba tambien
-- dispararon su propio registro, que es justamente lo que se espera.
select is(
  (select count(*)::int from app.auditoria
    where tabla = 'public.perfiles' and operacion = 'INSERT'
      and registro_id = '44444444-4444-4444-4444-444444444444'),
  1,
  'el alta de un perfil queda registrada, con el id de la fila afectada'
);
select is(
  (select datos_despues ->> 'activo' from app.auditoria
    where tabla = 'public.perfiles' and operacion = 'INSERT'
      and registro_id = '44444444-4444-4444-4444-444444444444'),
  'false',
  'y guarda el estado con el que nacio: inactiva'
);

-- =============================================================================
-- Quien puede leerla (doc 02 §11)
-- =============================================================================
set local role authenticated;

set local request.jwt.claims = '{"sub": "11111111-1111-1111-1111-111111111111", "rol": "superadmin"}';
select ok(
  (select count(*) from app.auditoria) > 0,
  'el superadmin lee la auditoria'
);

set local request.jwt.claims = '{"sub": "22222222-2222-2222-2222-222222222222", "rol": "administrador"}';
select ok(
  (select count(*) from app.auditoria) > 0,
  'el administrador tambien'
);

set local request.jwt.claims = '{"sub": "33333333-3333-3333-3333-333333333333", "rol": "ingeniero"}';
select is(
  (select count(*)::int from app.auditoria), 0,
  'un ingeniero NO ve la auditoria'
);

-- =============================================================================
-- Y nadie la puede tocar (doc 02 §11.3)
-- =============================================================================
set local request.jwt.claims = '{"sub": "11111111-1111-1111-1111-111111111111", "rol": "superadmin"}';

-- La proteccion es doble, y aqui se ve la primera capa: a `authenticated` solo
-- se le concedio SELECT, asi que ni siquiera llega a evaluarse la RLS. La
-- operacion se deniega por privilegio.
select throws_ok(
  $$ update app.auditoria set rol = 'falseado' $$,
  '42501',
  null,
  'ni el superadmin puede alterar lo que ya quedo registrado'
);
select throws_ok(
  $$ delete from app.auditoria $$,
  '42501',
  null,
  'ni puede borrar la auditoria'
);

reset role;

select ok(
  (select count(*) from app.auditoria) > 0,
  'y todo lo registrado sigue ahi'
);
select is(
  (select count(*)::int from app.auditoria where rol = 'falseado'),
  0,
  'sin rastro del intento de falsearla'
);

-- =============================================================================
-- La vista respeta la RLS
--
-- Una vista sin `security_invoker` se ejecuta con los privilegios de quien la
-- creo y saltaria la RLS: cualquiera con sesion veria el historial entero.
-- =============================================================================
select ok(
  (select reloptions::text from pg_class where oid = 'public.auditoria'::regclass)
    like '%security_invoker=%',
  'la vista public.auditoria declara security_invoker'
);

set local role authenticated;
set local request.jwt.claims = '{"sub": "33333333-3333-3333-3333-333333333333", "rol": "ingeniero"}';
select is(
  (select count(*)::int from public.auditoria), 0,
  'un ingeniero tampoco ve nada a traves de la vista'
);

set local request.jwt.claims = '{"sub": "22222222-2222-2222-2222-222222222222", "rol": "administrador"}';
select ok(
  (select count(*) from public.auditoria) > 0,
  'y el administrador si'
);
select is(
  (select usuario_correo from public.auditoria
    where tabla = 'public.configuracion_sitio' limit 1),
  'admin@pimpos.test',
  'con el correo de quien hizo el cambio, guardado en su momento'
);
reset role;

select * from finish();
rollback;
