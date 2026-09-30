-- Verifica el borrado a pedido, la conservación y el registro de exportaciones (0043).
--
-- Lo que se defiende: que solo la administración borre los datos de un
-- cliente; que después no quede NI UN dato personal suyo, tampoco en la
-- auditoría; que quede la constancia; que la conservación avise en el borde
-- de los 2 años; y que cada exportación quede registrada y no se pueda tocar.
begin;
select plan(27);

insert into auth.users (id, email, created_at, updated_at) values
  ('22222222-2222-2222-2222-222222222222', 'admin@pimpos.test',   now(), now()),
  ('33333333-3333-3333-3333-333333333333', 'inge@pimpos.test',    now(), now()),
  ('44444444-4444-4444-4444-444444444444', 'reparto@pimpos.test', now(), now());
update public.perfiles set rol = 'administrador', activo = true where id = '22222222-2222-2222-2222-222222222222';
update public.perfiles set rol = 'ingeniero',     activo = true, nombre_completo = 'Marcos Prueba' where id = '33333333-3333-3333-3333-333333333333';
update public.perfiles set rol = 'repartidor',    activo = true where id = '44444444-4444-4444-4444-444444444444';

create temp table t (clave text primary key, valor uuid);
grant all on t to authenticated;

select has_function('public', 'borrar_datos_cliente', array['uuid', 'text'], 'existe borrar_datos_cliente');
select has_table('public', 'supresiones', 'existe supresiones');
select has_table('public', 'exportaciones_clientes', 'existe exportaciones_clientes');

-- Un cliente con foto, y con un cambio que deja su dirección en la auditoría.
set local role authenticated;
set local request.jwt.claims = '{"sub": "33333333-3333-3333-3333-333333333333", "rol": "ingeniero"}';
insert into t select 'rosa', public.registrar_cliente(
  jsonb_build_object('nombre_completo', 'Rosa Quispe Tapullima', 'celular', '965444555',
    'direccion', 'Jirón Putumayo 777', 'referencia', 'Casa amarilla',
    'zona_id', (select id from public.zonas_reparto where nombre = 'Belén'),
    'latitud', -3.75, 'longitud', -73.24),
  'v1-2026-10');
insert into public.cliente_fotos (cliente_id, ruta, orden)
values ((select valor from t where clave = 'rosa'), (select valor from t where clave = 'rosa')::text || '/fachada.webp', 1);
update public.clientes set direccion = 'Jirón Putumayo 778' where id = (select valor from t where clave = 'rosa');
-- En el panel, registrar y borrar son transacciones distintas: el permiso
-- (diferido, 0042) ya se comprobó al registrar. Aquí se resuelve a mano.
set constraints clientes_exige_permiso immediate;
set constraints clientes_exige_permiso deferred;

-- ---------------------------------------------------------------------------
-- Solo la administración
-- ---------------------------------------------------------------------------
select throws_ok($$ select * from public.borrar_datos_cliente((select valor from t where clave = 'rosa'), 'Lo pidió') $$,
  '42501', 'Solo la administración puede borrar los datos de un cliente.', 'el ingeniero no borra datos');
set local request.jwt.claims = '{"sub": "44444444-4444-4444-4444-444444444444", "rol": "repartidor"}';
select throws_ok($$ select * from public.borrar_datos_cliente((select valor from t where clave = 'rosa'), 'Lo pidió') $$,
  '42501', null, 'el repartidor tampoco');

set local request.jwt.claims = '{"sub": "22222222-2222-2222-2222-222222222222", "rol": "administrador"}';
select throws_ok($$ select * from public.borrar_datos_cliente((select valor from t where clave = 'rosa'), '  ') $$,
  'P0001', 'Escribe por qué se borran, por ejemplo «Lo pidió por WhatsApp el 3/10».', 'sin motivo, no');
select throws_ok($$ select * from public.borrar_datos_cliente('00000000-0000-0000-0000-000000000000', 'Lo pidió') $$,
  'P0002', 'No se encontró el cliente. Recarga la página.', 'un cliente que no existe lo dice');

-- ---------------------------------------------------------------------------
-- Borrar
-- ---------------------------------------------------------------------------
select is(
  (select array_agg(ruta) from public.borrar_datos_cliente((select valor from t where clave = 'rosa'), 'Lo pidió por WhatsApp')),
  array[(select valor from t where clave = 'rosa')::text || '/fachada.webp'],
  'devuelve las rutas de sus fotos, para borrar los archivos');
select is(
  (select nombre_completo || ' | ' || celular || ' | ' || direccion || ' | ' || coalesce(referencia, '-')
          || ' | ' || coalesce(latitud::text, '-') || ' | ' || activo::text
     from public.clientes where id = (select valor from t where clave = 'rosa')),
  'Datos borrados a pedido del cliente | 000000 | Datos borrados | - | - | false',
  'la ficha queda sin datos personales y desactivada');
select is((select count(*)::int from public.cliente_fotos where cliente_id = (select valor from t where clave = 'rosa')),
  0, 'sin filas de fotos');
select is((select count(*)::int from public.consentimientos
            where cliente_id = (select valor from t where clave = 'rosa') and revocado_en is null),
  0, 'con el permiso revocado');
reset role;

select is(
  (select count(*)::int from app.auditoria
    where coalesce(datos_antes::text, '') || coalesce(datos_despues::text, '')
          ~* '(Rosa Quispe|965444555|Putumayo|Casa amarilla|fachada\.webp)'),
  0, 'y NI UN dato suyo en la auditoría: ni nombre, ni celular, ni dirección, ni referencia, ni foto');
select cmp_ok(
  (select count(*)::int from app.auditoria
    where registro_id = (select valor from t where clave = 'rosa') and datos_despues = '{"borrado": true}'::jsonb),
  '>', 0, 'la auditoría conserva quién y cuándo, con el contenido tachado');
select is(
  (select motivo || ' | ' || (borrado_por = '22222222-2222-2222-2222-222222222222')::text from public.supresiones
    where cliente_id = (select valor from t where clave = 'rosa')),
  'Lo pidió por WhatsApp | true', 'queda la constancia: motivo y quién');

set local role authenticated;
set local request.jwt.claims = '{"sub": "22222222-2222-2222-2222-222222222222", "rol": "administrador"}';
select throws_ok($$ select * from public.borrar_datos_cliente((select valor from t where clave = 'rosa'), 'Otra vez') $$,
  'P0001', 'Los datos de este cliente ya se borraron.', 'no se borra dos veces');
select is((select count(*)::int from public.supresiones where cliente_id = (select valor from t where clave = 'rosa')),
  1, 'la administración lee las constancias');
set local request.jwt.claims = '{"sub": "33333333-3333-3333-3333-333333333333", "rol": "ingeniero"}';
select is((select count(*)::int from public.supresiones), 0, 'el ingeniero no');
select throws_ok($$ insert into public.supresiones (cliente_id, motivo, borrado_por)
  values ((select valor from t where clave = 'rosa'), 'Falsa', '33333333-3333-3333-3333-333333333333') $$,
  '42501', null, 'y nadie escribe una constancia a mano');
reset role;

-- ---------------------------------------------------------------------------
-- Conservación: el borde de los 2 años
-- ---------------------------------------------------------------------------
set local role authenticated;
set local request.jwt.claims = '{"sub": "33333333-3333-3333-3333-333333333333", "rol": "ingeniero"}';
insert into t select 'viejo', public.registrar_cliente(jsonb_build_object('nombre_completo', 'Cliente Viejo',
  'celular', '965000010', 'direccion', 'Calle 1', 'referencia', 'R',
  'zona_id', (select id from public.zonas_reparto where nombre = 'Belén')), 'v1-2026-10');
insert into t select 'casi', public.registrar_cliente(jsonb_build_object('nombre_completo', 'Cliente Casi',
  'celular', '965000011', 'direccion', 'Calle 2', 'referencia', 'R',
  'zona_id', (select id from public.zonas_reparto where nombre = 'Belén')), 'v1-2026-10');
reset role;
-- Se envejecen a mano: el trigger de updated_at pondría now(). Antes se
-- resuelve lo pendiente del permiso (0042, diferido): con eventos en cola,
-- Postgres no deja tocar los triggers de la tabla.
set constraints clientes_exige_permiso immediate;
set constraints clientes_exige_permiso deferred;
alter table public.clientes disable trigger clientes_set_updated_at;
update public.clientes set updated_at = now() - interval '2 years 1 day' where id = (select valor from t where clave = 'viejo');
update public.clientes set updated_at = now() - interval '2 years' + interval '1 day' where id = (select valor from t where clave = 'casi');
alter table public.clientes enable trigger clientes_set_updated_at;
update public.consentimientos set created_at = now() - interval '3 years'
 where cliente_id in (select valor from t where clave in ('viejo', 'casi'));

set local role authenticated;
set local request.jwt.claims = '{"sub": "22222222-2222-2222-2222-222222222222", "rol": "administrador"}';
select ok(exists(select 1 from public.clientes_para_revisar where id = (select valor from t where clave = 'viejo')),
  'con 2 años y un día sin cambios, aparece para revisar');
select ok(not exists(select 1 from public.clientes_para_revisar where id = (select valor from t where clave = 'casi')),
  'con un día menos, todavía no');
update public.clientes set activo = true where id = (select valor from t where clave = 'viejo');
select ok(not exists(select 1 from public.clientes_para_revisar where id = (select valor from t where clave = 'viejo')),
  '«Sigue siendo cliente» renueva la fecha y sale de la lista');
set local request.jwt.claims = '{"sub": "33333333-3333-3333-3333-333333333333", "rol": "ingeniero"}';
select is((select count(*)::int from public.clientes_para_revisar), 0, 'la lista es solo de la administración');

select is(
  (select texto_version || ' | ' || registrado_por from public.permiso_de_cliente((select valor from t where clave = 'casi'))),
  'v1-2026-10 | Marcos Prueba',
  'la ficha dice qué versión se leyó y quién anotó el permiso');

-- ---------------------------------------------------------------------------
-- Exportaciones
-- ---------------------------------------------------------------------------
set local request.jwt.claims = '{"sub": "22222222-2222-2222-2222-222222222222", "rol": "administrador"}';
select lives_ok($$ insert into public.exportaciones_clientes (formato, cantidad, filtro)
  values ('xlsx', 12, '{"zona": "Belén"}') $$, 'la administración registra una exportación');
select is((select exportado_por from public.exportaciones_clientes where cantidad = 12),
  '22222222-2222-2222-2222-222222222222'::uuid, 'a su nombre, sin escribirlo');
select throws_ok($$ update public.exportaciones_clientes set cantidad = 1 $$, '42501', null,
  'y nadie la corrige después');
set local request.jwt.claims = '{"sub": "33333333-3333-3333-3333-333333333333", "rol": "ingeniero"}';
select throws_ok($$ insert into public.exportaciones_clientes (formato, cantidad) values ('pdf', 3) $$,
  '42501', null, 'el ingeniero no exporta');
reset role;

select * from finish();
rollback;
