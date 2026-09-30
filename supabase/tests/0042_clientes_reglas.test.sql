-- Verifica las reglas de clientes (0042).
--
-- Lo que se defiende: que no entre un cliente sin su permiso, ni por la API;
-- que el repartidor solo corrija referencia y punto, y no borre fotos; que las
-- zonas sean de la administración y no se retiren con clientes; y que la
-- búsqueda encuentre por nombre sin tildes, con errores y por celular.
begin;
select plan(26);

insert into auth.users (id, email, created_at, updated_at) values
  ('22222222-2222-2222-2222-222222222222', 'admin@pimpos.test',   now(), now()),
  ('33333333-3333-3333-3333-333333333333', 'inge@pimpos.test',    now(), now()),
  ('44444444-4444-4444-4444-444444444444', 'reparto@pimpos.test', now(), now());
update public.perfiles set rol = 'administrador', activo = true where id = '22222222-2222-2222-2222-222222222222';
update public.perfiles set rol = 'ingeniero',     activo = true where id = '33333333-3333-3333-3333-333333333333';
update public.perfiles set rol = 'repartidor',    activo = true where id = '44444444-4444-4444-4444-444444444444';

-- Zonas propias: las de la semilla pueden tener clientes de ejemplo, y el
-- mensaje de «tiene N clientes activos» dejaría de ser exacto.
insert into public.zonas_reparto (id, nombre, orden) values
  ('eeee0000-0000-0000-0000-000000000001', 'Prueba 0042',       90),
  ('eeee0000-0000-0000-0000-000000000002', 'Prueba 0042 vacía', 91);
create temp table ref as
select 'eeee0000-0000-0000-0000-000000000001'::uuid as belen,
       'eeee0000-0000-0000-0000-000000000002'::uuid as punchana;
create temp table t (clave text primary key, valor uuid);
grant select on ref to authenticated;
grant all on t to authenticated;

select has_function('public', 'registrar_cliente', array['jsonb', 'text'], 'existe registrar_cliente');
select has_function('public', 'buscar_clientes', array['text', 'uuid', 'boolean'], 'existe buscar_clientes');

-- ---------------------------------------------------------------------------
-- Alta con permiso
-- ---------------------------------------------------------------------------
set local role authenticated;
set local request.jwt.claims = '{"sub": "33333333-3333-3333-3333-333333333333", "rol": "ingeniero"}';

insert into t select 'maria', public.registrar_cliente(
  jsonb_build_object('nombre_completo', 'María Núñez Rodríguez', 'celular', '965111222',
    'direccion', 'Calle Próspero 123', 'referencia', 'Frente a la bodega azul',
    'zona_id', (select belen from ref), 'latitud', -3.76, 'longitud', -73.25),
  'v1-2026-10');
select isnt((select valor from t where clave = 'maria'), null, 'el ingeniero registra un cliente');
select is(
  (select texto_version || ' / ' || (registrado_por = '33333333-3333-3333-3333-333333333333')::text
     from public.consentimientos where cliente_id = (select valor from t where clave = 'maria')),
  'v1-2026-10 / true', 'con su permiso: versión leída y quién lo registró');
select lives_ok($$ set constraints clientes_exige_permiso immediate $$,
  'al terminar, el cliente tiene su permiso');
set constraints clientes_exige_permiso deferred;

set local request.jwt.claims = '{"sub": "44444444-4444-4444-4444-444444444444", "rol": "repartidor"}';
select throws_ok($$
  select public.registrar_cliente(
    jsonb_build_object('nombre_completo', 'Otro', 'celular', '965000000', 'direccion', 'X',
      'referencia', 'Y', 'zona_id', (select belen from ref)), 'v1-2026-10')
$$, '42501', null, 'el repartidor no registra clientes (decisión 2)');

-- Por la API, sin permiso: el insert entra, pero al terminar la transacción no.
set local request.jwt.claims = '{"sub": "33333333-3333-3333-3333-333333333333", "rol": "ingeniero"}';
with x as (
  insert into public.clientes (nombre_completo, celular, direccion, referencia, zona_id)
  values ('Sin Permiso', '965000001', 'Calle 1', 'Ref', (select belen from ref)) returning id)
insert into t select 'sin_permiso', id from x;
select throws_ok($$ set constraints clientes_exige_permiso immediate $$,
  'P0001', 'Sin el permiso del cliente no se puede registrar. Léele el texto y marca «Se lo leí y aceptó».',
  'un cliente sin permiso no llega a guardarse');
set constraints clientes_exige_permiso deferred;
reset role;
delete from public.clientes where id = (select valor from t where clave = 'sin_permiso');

set local role authenticated;
set local request.jwt.claims = '{"sub": "44444444-4444-4444-4444-444444444444", "rol": "repartidor"}';
select throws_ok($$
  insert into public.consentimientos (cliente_id, registrado_por, texto_version)
  values ((select valor from t where clave = 'maria'), '44444444-4444-4444-4444-444444444444', 'v1-2026-10')
$$, '42501', null, 'ni anota permisos');

-- ---------------------------------------------------------------------------
-- Lo que corrige el repartidor
-- ---------------------------------------------------------------------------
select lives_ok($$
  update public.clientes set referencia = 'Portón verde', latitud = -3.7601, longitud = -73.2502
   where id = (select valor from t where clave = 'maria')
$$, 'el repartidor corrige la referencia y el punto');
select is((select referencia from public.clientes where id = (select valor from t where clave = 'maria')),
  'Portón verde', 'y queda corregido');
select throws_ok($$ update public.clientes set celular = '965999999' where id = (select valor from t where clave = 'maria') $$,
  '42501', 'Tu rol solo puede corregir la referencia y el punto en el mapa.', 'no cambia el celular');
select throws_ok($$ update public.clientes set nombre_completo = 'Otra' where id = (select valor from t where clave = 'maria') $$,
  '42501', null, 'ni el nombre');
select throws_ok($$ update public.clientes set zona_id = (select punchana from ref) where id = (select valor from t where clave = 'maria') $$,
  '42501', null, 'ni la zona');
select throws_ok($$ update public.clientes set activo = false where id = (select valor from t where clave = 'maria') $$,
  '42501', null, 'ni lo desactiva');

-- Fotos: añade, no borra.
select lives_ok($$
  insert into public.cliente_fotos (cliente_id, ruta, orden)
  values ((select valor from t where clave = 'maria'), (select valor from t where clave = 'maria')::text || '/a.webp', 1)
$$, 'el repartidor añade una foto');
delete from public.cliente_fotos where cliente_id = (select valor from t where clave = 'maria');
select is((select count(*)::int from public.cliente_fotos where cliente_id = (select valor from t where clave = 'maria')),
  1, 'pero no la borra (sin política, el borrado no toca nada)');

set local request.jwt.claims = '{"sub": "33333333-3333-3333-3333-333333333333", "rol": "ingeniero"}';
delete from public.cliente_fotos where cliente_id = (select valor from t where clave = 'maria');
select is((select count(*)::int from public.cliente_fotos where cliente_id = (select valor from t where clave = 'maria')),
  0, 'el ingeniero sí quita una foto');
select lives_ok($$ update public.clientes set activo = false where id = (select valor from t where clave = 'maria') $$,
  'y desactiva un cliente');
update public.clientes set activo = true where id = (select valor from t where clave = 'maria');

-- ---------------------------------------------------------------------------
-- Zonas
-- ---------------------------------------------------------------------------
update public.zonas_reparto set nombre = 'Cambiada' where id = (select belen from ref);
select is((select nombre from public.zonas_reparto where id = (select belen from ref)), 'Prueba 0042',
  'el ingeniero ya no edita zonas (decisión 10)');

set local request.jwt.claims = '{"sub": "22222222-2222-2222-2222-222222222222", "rol": "administrador"}';
select throws_ok($$ update public.zonas_reparto set activo = false where id = (select belen from ref) $$,
  'P0001', 'La zona Prueba 0042 tiene 1 cliente activo. Pásalos a otra zona antes de retirarla.',
  'una zona con clientes activos no se retira');
select lives_ok($$ update public.zonas_reparto set activo = false where id = (select punchana from ref) $$,
  'una zona sin clientes sí');

-- ---------------------------------------------------------------------------
-- Búsqueda
-- ---------------------------------------------------------------------------
set local request.jwt.claims = '{"sub": "44444444-4444-4444-4444-444444444444", "rol": "repartidor"}';
-- Se busca la fixture, no se cuenta la tabla: la semilla de ejemplo tiene clientes.
select ok(exists(select 1 from public.buscar_clientes('nunez') where id = (select valor from t where clave = 'maria')),
  'el repartidor busca «nunez» sin tildes');
select ok(exists(select 1 from public.buscar_clientes('Rodrigez') where id = (select valor from t where clave = 'maria')),
  'con el apellido mal escrito');
select ok(exists(select 1 from public.buscar_clientes('+51 965 111 222') where id = (select valor from t where clave = 'maria')),
  'y por el celular escrito con prefijo y espacios');
select is((select zona from public.buscar_clientes(null, (select belen from ref))), 'Prueba 0042',
  'filtra por zona y dice su nombre');
reset role;

-- ---------------------------------------------------------------------------
-- Nada anónimo
-- ---------------------------------------------------------------------------
select is(
  (select count(*)::int from pg_policies
    where schemaname = 'public' and tablename in ('clientes', 'cliente_fotos', 'consentimientos', 'zonas_reparto')
      and 'anon' = any(roles)),
  0, 'ninguna política de clientes es para anon');

select * from finish();
rollback;
