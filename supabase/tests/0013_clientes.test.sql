-- Verifica clientes, fotos y consentimiento (0013).
--
-- Aqui hay datos personales de vecinos de Iquitos -- nombre, celular,
-- direccion y foto del domicilio -- y les aplica la Ley N.o 29733. Lo que se
-- comprueba no es que el SQL corra, sino que esos datos no se puedan alcanzar
-- desde fuera y que quede constancia de quien los toco.
--
-- Cubre la otra mitad de una de las nueve obligatorias del doc 02 §11.3: un
-- anonimo no ve ninguna fila de clientes.
begin;
select plan(34);

-- =============================================================================
-- Fixtures
-- =============================================================================
insert into auth.users (id, email, created_at, updated_at) values
  ('11111111-1111-1111-1111-111111111111', 'super@pimpos.test',   now(), now()),
  ('22222222-2222-2222-2222-222222222222', 'admin@pimpos.test',   now(), now()),
  ('33333333-3333-3333-3333-333333333333', 'inge@pimpos.test',    now(), now()),
  ('44444444-4444-4444-4444-444444444444', 'reparto@pimpos.test', now(), now());

update public.perfiles set rol = 'superadmin',    activo = true where id = '11111111-1111-1111-1111-111111111111';
update public.perfiles set rol = 'administrador', activo = true where id = '22222222-2222-2222-2222-222222222222';
update public.perfiles set rol = 'ingeniero',     activo = true where id = '33333333-3333-3333-3333-333333333333';
update public.perfiles set rol = 'repartidor',    activo = true where id = '44444444-4444-4444-4444-444444444444';

insert into public.clientes (id, nombre_completo, celular, direccion, referencia, zona_id)
select 'ffff0000-0000-0000-0000-000000000001', 'María Núñez Rodríguez', '965111222',
       'Calle Próspero 123', 'Frente a la bodega azul',
       (select id from public.zonas_reparto where nombre = 'Belén');

-- =============================================================================
-- Estructura
-- =============================================================================
select has_table('public', 'zonas_reparto',   'existe zonas_reparto');
select has_table('public', 'clientes',        'existe clientes');
select has_table('public', 'cliente_fotos',   'existe cliente_fotos');
select has_table('public', 'consentimientos', 'existe consentimientos');

select is(
  (select count(*)::int from public.zonas_reparto), 4,
  'las 4 zonas de partida de Iquitos'
);

-- La ficha 8.3 dice que hoy la ubicacion se captura solo con la direccion
-- escrita, pero las columnas ya existen para no migrar despues (R22).
select has_column('public', 'clientes', 'latitud',
  'la columna de latitud existe, aunque hoy no se use');

-- =============================================================================
-- Busqueda por nombre: prioridad 1 de la ficha 8.6
--
-- Tiene que encontrar a María Núñez escribiendo "nunez", sin tildes, y con el
-- apellido mal tecleado. Si no, el repartidor no la encuentra y acaba
-- registrandola dos veces.
-- =============================================================================
select is(
  (select nombre_completo from public.clientes
    where app.sin_tildes(lower(nombre_completo)) like '%nunez%'),
  'María Núñez Rodríguez',
  'buscar "nunez" sin tildes encuentra a "Núñez"'
);
select is(
  (select nombre_completo from public.clientes
    where app.sin_tildes(lower(nombre_completo)) % app.sin_tildes(lower('Rodrigez'))),
  'María Núñez Rodríguez',
  'y "Rodrigez" mal escrito encuentra a "Rodríguez"'
);
select is(
  app.sin_tildes('Núñez Gómez'), 'Nunez Gomez',
  'sin_tildes quita tildes y enes sin destrozar la palabra'
);

-- =============================================================================
-- El limite de 3 fotos es de la BASE, no del formulario (ficha 8.3)
--
-- La foto de la casa de alguien es dato personal: un limite que solo viva en
-- la interfaz se salta con una peticion directa a la API.
-- =============================================================================
insert into public.cliente_fotos (cliente_id, ruta, orden) values
  ('ffff0000-0000-0000-0000-000000000001', 'clientes/ffff0000/1.webp', 1),
  ('ffff0000-0000-0000-0000-000000000001', 'clientes/ffff0000/2.webp', 2),
  ('ffff0000-0000-0000-0000-000000000001', 'clientes/ffff0000/3.webp', 3);

select is(
  (select count(*)::int from public.cliente_fotos
    where cliente_id = 'ffff0000-0000-0000-0000-000000000001'),
  3,
  'se pueden guardar 3 fotos'
);

select throws_ok(
  $$ insert into public.cliente_fotos (cliente_id, ruta, orden)
     values ('ffff0000-0000-0000-0000-000000000001', 'clientes/ffff0000/4.webp', 4) $$,
  '23514',
  null,
  'pero no una cuarta'
);

select throws_ok(
  $$ insert into public.cliente_fotos (cliente_id, ruta, orden)
     values ('ffff0000-0000-0000-0000-000000000001', 'clientes/ffff0000/otra.webp', 2) $$,
  '23505',
  null,
  'ni dos en la misma posicion'
);

-- =============================================================================
-- Consentimiento (ficha 8.4, Ley N.o 29733)
-- =============================================================================
insert into public.consentimientos (cliente_id, modo, registrado_por, texto_version)
values ('ffff0000-0000-0000-0000-000000000001', 'verbal',
        '33333333-3333-3333-3333-333333333333', 'v1-2026-09');

select is(
  (select modo from public.consentimientos
    where cliente_id = 'ffff0000-0000-0000-0000-000000000001'),
  'verbal',
  'el consentimiento verbal de la ficha 8.4 queda registrado'
);
select is(
  (select texto_version from public.consentimientos
    where cliente_id = 'ffff0000-0000-0000-0000-000000000001'),
  'v1-2026-09',
  'con la version del texto que se le leyo, que es lo que respalda al negocio'
);

select throws_ok(
  $$ insert into public.consentimientos (cliente_id, registrado_por, texto_version)
     values ('ffff0000-0000-0000-0000-000000000001',
             '33333333-3333-3333-3333-333333333333', '') $$,
  '23514',
  null,
  'un consentimiento sin version de texto se rechaza: no diria que se acepto'
);

-- Una revocacion a medias no se guarda: o consta quien y cuando, o no consta.
select throws_ok(
  $$ update public.consentimientos set revocado_en = now()
      where cliente_id = 'ffff0000-0000-0000-0000-000000000001' $$,
  '23514',
  null,
  'no se puede revocar sin decir quien lo revoco'
);

select is(
  (select tiene_consentimiento from public.clientes_con_consentimiento
    where cliente_id = 'ffff0000-0000-0000-0000-000000000001'),
  true,
  'la vista responde si un cliente tiene consentimiento vigente'
);

-- =============================================================================
-- NADA de esto es publico. Es lo que separa un registro interno de una filtracion.
-- =============================================================================
set local role anon;

select is((select count(*)::int from public.clientes), 0,
  'un anonimo NO ve ninguna fila de clientes');
select is((select count(*)::int from public.cliente_fotos), 0,
  'ni las fotos de sus domicilios');
select is((select count(*)::int from public.consentimientos), 0,
  'ni los consentimientos');
select is((select count(*)::int from public.zonas_reparto), 0,
  'ni siquiera las zonas de reparto');

select throws_ok(
  $$ insert into public.clientes (nombre_completo, celular, direccion)
     values ('Colado', '999', 'x') $$,
  '42501',
  null,
  'y no puede registrar a nadie'
);

reset role;

-- =============================================================================
-- Los cuatro roles entran: es el unico modulo del repartidor
-- =============================================================================
set local role authenticated;

set local request.jwt.claims = '{"sub": "44444444-4444-4444-4444-444444444444", "rol": "repartidor"}';
select is((select count(*)::int from public.clientes), 1,
  'un repartidor SI lee clientes: es su modulo');
select lives_ok(
  $$ insert into public.clientes (nombre_completo, celular, direccion)
     values ('Cliente del reparto', '965999888', 'Calle Nueva 1') $$,
  'y puede registrar uno nuevo en la calle');
select lives_ok(
  $$ insert into public.consentimientos (cliente_id, registrado_por, texto_version)
     select id, '44444444-4444-4444-4444-444444444444', 'v1-2026-09'
       from public.clientes where nombre_completo = 'Cliente del reparto' $$,
  'y registrar su consentimiento en el momento');

-- Pero revocar es una decision, no una correccion de tecleo.
update public.consentimientos
   set revocado_en = now(), revocado_por = '44444444-4444-4444-4444-444444444444'
 where cliente_id = 'ffff0000-0000-0000-0000-000000000001';
select is(
  (select count(*)::int from public.consentimientos
    where cliente_id = 'ffff0000-0000-0000-0000-000000000001' and revocado_en is not null),
  0,
  'un repartidor NO puede revocar un consentimiento'
);

set local request.jwt.claims = '{"sub": "22222222-2222-2222-2222-222222222222", "rol": "administrador"}';
select lives_ok(
  $$ update public.consentimientos
        set revocado_en = now(), revocado_por = '22222222-2222-2222-2222-222222222222'
      where cliente_id = 'ffff0000-0000-0000-0000-000000000001' $$,
  'un administrador si');

select is(
  (select tiene_consentimiento from public.clientes_con_consentimiento
    where cliente_id = 'ffff0000-0000-0000-0000-000000000001'),
  false,
  'y al revocarlo, la vista deja de darlo por vigente'
);

-- Un consentimiento no se borra: la constancia de que se otorgo es lo que
-- respalda al negocio. Para retirarlo esta la revocacion.
select throws_ok(
  $$ delete from public.consentimientos $$,
  '42501',
  null,
  'ni el administrador puede borrar un consentimiento'
);

reset role;

-- =============================================================================
-- Borrado logico: se deja de ver, pero el rastro queda
-- =============================================================================
update public.clientes set deleted_at = now()
 where id = 'ffff0000-0000-0000-0000-000000000001';

select is(
  (select count(*)::int from public.clientes
    where id = 'ffff0000-0000-0000-0000-000000000001'),
  1,
  'un cliente dado de baja conserva su fila y su rastro en auditoria'
);
select is(
  (select count(*)::int from public.clientes_con_consentimiento
    where cliente_id = 'ffff0000-0000-0000-0000-000000000001'),
  0,
  'pero desaparece de las consultas del dia a dia'
);

-- =============================================================================
-- Auditoria (R9; doc de stack §8 lo exige para datos de clientes)
-- =============================================================================
select ok(
  (select count(*) from app.auditoria where tabla = 'public.clientes') > 0,
  'todo cambio en un cliente queda auditado'
);
select ok(
  (select count(*) from app.auditoria where tabla = 'public.consentimientos') > 0,
  'y tambien los consentimientos'
);
select is(
  (select usuario_id from app.auditoria
    where tabla = 'public.clientes' and operacion = 'INSERT'
      and registro_id = (select id from public.clientes where nombre_completo = 'Cliente del reparto')),
  '44444444-4444-4444-4444-444444444444'::uuid,
  'con quien registro a cada persona'
);

select * from finish();
rollback;
