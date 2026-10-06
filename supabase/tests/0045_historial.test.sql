-- Verifica lo que añade el historial del panel (0045).
--
-- Lo que se defiende: que los ingresos al sistema los vea solo la
-- administración, y que sean ingresos y salidas (no altas ni refrescos de
-- sesión); que las dos vistas nuevas no enseñen nada a quien no es de la
-- administración; y que la lista de tablas auditadas sea la que el catálogo de
-- la aplicación espera (`src/lib/auditoria/catalogo.ts`).
begin;
select plan(18);

insert into auth.users (id, email, created_at, updated_at) values
  ('11111111-1111-1111-1111-111111111111', 'dueno@pimpos.test',   now(), now()),
  ('22222222-2222-2222-2222-222222222222', 'admin@pimpos.test',   now(), now()),
  ('33333333-3333-3333-3333-333333333333', 'inge@pimpos.test',    now(), now()),
  ('44444444-4444-4444-4444-444444444444', 'reparto@pimpos.test', now(), now());
update public.perfiles set rol = 'superadmin', activo = true where id = '11111111-1111-1111-1111-111111111111';
update public.perfiles set rol = 'administrador', activo = true, nombre_completo = 'Debra Prueba'
 where id = '22222222-2222-2222-2222-222222222222';
update public.perfiles set rol = 'ingeniero',  activo = true, nombre_completo = 'Marcos Prueba'
 where id = '33333333-3333-3333-3333-333333333333';
update public.perfiles set rol = 'repartidor', activo = true where id = '44444444-4444-4444-4444-444444444444';

-- El registro de Supabase, como lo deja Auth: un ingreso y una salida de
-- Marcos, un refresco de sesión y un alta (que NO son ingresos), y un ingreso
-- de hace un mes (fuera del periodo que se pide).
insert into auth.audit_log_entries (instance_id, id, payload, created_at) values
  ('00000000-0000-0000-0000-000000000000', gen_random_uuid(),
   '{"action":"login","actor_id":"33333333-3333-3333-3333-333333333333","actor_username":"inge@pimpos.test"}',
   now() - interval '2 hours'),
  ('00000000-0000-0000-0000-000000000000', gen_random_uuid(),
   '{"action":"logout","actor_id":"33333333-3333-3333-3333-333333333333","actor_username":"inge@pimpos.test"}',
   now() - interval '1 hour'),
  ('00000000-0000-0000-0000-000000000000', gen_random_uuid(),
   '{"action":"token_refreshed","actor_id":"33333333-3333-3333-3333-333333333333","actor_username":"inge@pimpos.test"}',
   now() - interval '90 minutes'),
  ('00000000-0000-0000-0000-000000000000', gen_random_uuid(),
   '{"action":"user_signedup","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role"}',
   now() - interval '3 hours'),
  ('00000000-0000-0000-0000-000000000000', gen_random_uuid(),
   '{"action":"login","actor_id":"22222222-2222-2222-2222-222222222222","actor_username":"admin@pimpos.test"}',
   now() - interval '30 days'),
  ('00000000-0000-0000-0000-000000000000', gen_random_uuid(),
   '{"action":"login","actor_id":"33333333-3333-3333-3333-333333333333","actor_username":"inge@pimpos.test"}',
   '2020-01-01 12:00+00');

select has_function('public', 'ingresos_al_sistema', array['timestamp with time zone', 'timestamp with time zone', 'uuid'],
  'existe ingresos_al_sistema');
select has_view('public', 'constancias_de_borrado', 'existe constancias_de_borrado');
select has_view('public', 'descargas_de_clientes', 'existe descargas_de_clientes');

-- ---------------------------------------------------------------------------
-- Ingresos: solo la administración
-- ---------------------------------------------------------------------------
set local role authenticated;
set local request.jwt.claims = '{"sub": "33333333-3333-3333-3333-333333333333", "rol": "ingeniero"}';
select throws_ok($$ select * from public.ingresos_al_sistema(now() - interval '1 day', now()) $$,
  '42501', 'Solo la administración puede ver los ingresos al sistema.', 'el ingeniero no ve los ingresos');
set local request.jwt.claims = '{"sub": "44444444-4444-4444-4444-444444444444", "rol": "repartidor"}';
select throws_ok($$ select * from public.ingresos_al_sistema(now() - interval '1 day', now()) $$,
  '42501', null, 'el repartidor tampoco');

set local request.jwt.claims = '{"sub": "22222222-2222-2222-2222-222222222222", "rol": "administrador"}';
select results_eq(
  $$ select accion, correo, nombre from public.ingresos_al_sistema(now() - interval '1 day', now())
      where correo = 'inge@pimpos.test' $$,
  $$ values ('salida', 'inge@pimpos.test', 'Marcos Prueba'), ('ingreso', 'inge@pimpos.test', 'Marcos Prueba') $$,
  'la administración ve el ingreso y la salida, la más reciente primero, con el nombre');
-- Se cuenta la fixture, no la etiqueta: la función llama «salida» a todo lo que
-- no es un ingreso, así que mirar `accion` no vería un alta colada.
select is(
  (select count(*)::int from public.ingresos_al_sistema(now() - interval '1 day', now())
    where correo in ('inge@pimpos.test', 'service_role')),
  2, 'no salen ni las altas ni los refrescos de sesión');
select is(
  (select count(*)::int from public.ingresos_al_sistema(now() - interval '1 day', now())
    where correo = 'admin@pimpos.test'),
  0, 'lo de hace un mes queda fuera del periodo pedido');
select is(
  (select count(*)::int from public.ingresos_al_sistema(now() - interval '60 days', now(),
                                                         '22222222-2222-2222-2222-222222222222')),
  1, 'se puede pedir los de una sola persona');

-- Los límites del periodo: desde, incluido; hasta, sin incluir. Con un ingreso
-- justo en el instante que parte dos periodos, sale en uno y solo en uno.
set local request.jwt.claims = '{"sub": "11111111-1111-1111-1111-111111111111", "rol": "superadmin"}';
select is(
  (select count(*)::int from public.ingresos_al_sistema('2020-01-01 12:00+00', '2020-01-01 13:00+00')),
  1, 'el superadmin también los ve, y el instante de «desde» entra');
select is(
  (select count(*)::int from public.ingresos_al_sistema('2020-01-01 11:00+00', '2020-01-01 12:00+00')),
  0, 'el instante de «hasta» queda fuera');
reset role;

select is(has_function_privilege('anon', 'public.ingresos_al_sistema(timestamptz, timestamptz, uuid)', 'EXECUTE'),
  false, 'un anónimo no puede ni llamarla');

-- ---------------------------------------------------------------------------
-- Las dos vistas: solo lo que ya veía la administración
-- ---------------------------------------------------------------------------
insert into public.exportaciones_clientes (exportado_por, formato, cantidad, filtro)
values ('22222222-2222-2222-2222-222222222222', 'xlsx', 7, '{"zona": "Belén", "estado": "activos"}');

-- Una constancia de borrado, puesta sin sesión (la escribe `borrar_datos_cliente`).
set local request.jwt.claims = '{}';
insert into public.clientes (id, nombre_completo, celular, direccion, referencia, zona_id)
values ('55555555-5555-5555-5555-555555555555', 'Clienta Prueba', '987000111', 'Calle 1', 'Portón',
        (select id from public.zonas_reparto order by nombre limit 1));
insert into public.supresiones (cliente_id, motivo, borrado_por)
values ('55555555-5555-5555-5555-555555555555', 'Lo pidió por teléfono', '22222222-2222-2222-2222-222222222222');

set local role authenticated;
set local request.jwt.claims = '{"sub": "22222222-2222-2222-2222-222222222222", "rol": "administrador"}';
select is(
  (select borrado_por_nombre || ' | ' || motivo from public.constancias_de_borrado
    where cliente_id = '55555555-5555-5555-5555-555555555555'),
  'Debra Prueba | Lo pidió por teléfono',
  'la administración ve la constancia con el nombre de quien borró y el motivo');
set local request.jwt.claims = '{"sub": "44444444-4444-4444-4444-444444444444", "rol": "repartidor"}';
select is(
  (select count(*)::int from public.constancias_de_borrado
    where cliente_id = '55555555-5555-5555-5555-555555555555'),
  0, 'el repartidor no ve la constancia, aunque sí ve a los clientes');
select is(
  (select count(*)::int from public.descargas_de_clientes where cantidad = 7),
  0, 'ni la descarga');
set local request.jwt.claims = '{"sub": "22222222-2222-2222-2222-222222222222", "rol": "administrador"}';
select is(
  (select exportado_por_nombre || ' | ' || formato || ' | ' || cantidad || ' | ' || zona || ' | ' || estado
     from public.descargas_de_clientes where cantidad = 7),
  'Debra Prueba | xlsx | 7 | Belén | activos',
  'la administración ve la descarga con el nombre de quien la hizo, la zona y el estado');
set local request.jwt.claims = '{"sub": "33333333-3333-3333-3333-333333333333", "rol": "ingeniero"}';
select is(
  (select count(*)::int from public.descargas_de_clientes) + (select count(*)::int from public.constancias_de_borrado),
  0, 'el ingeniero no ve ni descargas ni constancias');
reset role;

-- ---------------------------------------------------------------------------
-- La lista de tablas auditadas es la que el catálogo espera
-- ---------------------------------------------------------------------------
select is(
  (select array_agg(distinct event_object_table::text order by event_object_table::text)
     from information_schema.triggers
    where trigger_schema = 'public' and action_statement ilike '%registrar_auditoria%'),
  array['almacenes', 'categorias_producto', 'cliente_fotos', 'clientes', 'configuracion_sitio',
        'consentimientos', 'equivalencias', 'faqs', 'galeria', 'guias', 'insumos', 'lotes_insumo',
        'movimiento_lotes', 'movimientos_insumo', 'novedades', 'perfiles', 'producto_imagenes',
        'producto_variantes', 'productos', 'proveedores', 'roles', 'slides', 'solicitudes_baja',
        'testimonios', 'zonas_reparto'],
  'se auditan estas 25 tablas: si cambia la lista, hay que darle su frase en src/lib/auditoria/catalogo.ts');

select * from finish();
rollback;
