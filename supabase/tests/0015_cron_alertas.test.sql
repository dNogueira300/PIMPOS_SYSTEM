-- Verifica las alertas y las tareas programadas (0015).
--
-- Lo que importa aqui no es que las funciones corran, sino que DETECTEN lo que
-- deben: la ficha marca las alertas de stock y vencimiento como prioridad 1
-- (7.8), y una alerta que no salta es peor que no tenerla, porque da confianza
-- falsa.
begin;
select plan(24);

-- =============================================================================
-- Fixtures
-- =============================================================================
insert into auth.users (id, email, created_at, updated_at) values
  ('33333333-3333-3333-3333-333333333333', 'inge@pimpos.test',    now(), now()),
  ('44444444-4444-4444-4444-444444444444', 'reparto@pimpos.test', now(), now());

update public.perfiles set rol = 'ingeniero',  activo = true where id = '33333333-3333-3333-3333-333333333333';
update public.perfiles set rol = 'repartidor', activo = true where id = '44444444-4444-4444-4444-444444444444';

create temp table ref as
select (select id from public.insumos where nombre = 'Harina')            as harina,
       (select id from public.insumos where nombre = 'Sal')               as sal,
       (select id from public.insumos where nombre = 'Manteca')           as manteca,
       (select id from public.almacenes where es_principal)               as almacen,
       (select id from public.unidades_medida where codigo = 'kg')        as kg,
       (select id from public.unidades_medida where codigo = 'caja')      as caja,
       (select id from public.proveedores where nombre = 'Comercial FOX') as proveedor;

-- =============================================================================
-- Estructura
-- =============================================================================
select has_table('public', 'notificaciones', 'existe notificaciones');
select has_function('app', 'evaluar_alertas',             'existe la evaluacion de alertas');
select has_function('app', 'archivar_novedades_vencidas', 'existe el archivado de novedades');

select is(
  (select count(*)::int from cron.job where jobname = 'despublicar-novedades'), 1,
  'la tarea que despublica novedades esta programada'
);
select is(
  (select count(*)::int from cron.job where jobname = 'evaluar-alertas'), 1,
  'y la que evalua alertas tambien'
);
select is(
  (select schedule from cron.job where jobname = 'evaluar-alertas'), '10 11 * * *',
  'a las 06:10 de Iquitos, justo antes del turno de la manana'
);

-- =============================================================================
-- Alerta de stock bajo (R12)
-- =============================================================================
-- La harina tiene minimo 1500 kg. Se ingresan 100: muy por debajo.
insert into public.movimientos_insumo
  (tipo, insumo_id, almacen_id, cantidad, unidad_id, responsable_id, proveedor_id, documento_tipo)
select 'ingreso', harina, almacen, 100, kg, '33333333-3333-3333-3333-333333333333',
       proveedor, 'factura' from ref;

-- La sal tiene minimo 25 kg. Se ingresan 500: de sobra.
insert into public.movimientos_insumo
  (tipo, insumo_id, almacen_id, cantidad, unidad_id, responsable_id, proveedor_id, documento_tipo)
select 'ingreso', sal, almacen, 500, kg, '33333333-3333-3333-3333-333333333333',
       proveedor, 'boleta' from ref;

select ok(app.evaluar_alertas() > 0, 'la evaluacion genera alertas');

select is(
  (select count(*)::int from public.notificaciones
    where tipo = 'stock_bajo' and insumo_id = (select harina from ref)),
  1,
  'la harina por debajo del minimo genera su alerta'
);
select is(
  (select count(*)::int from public.notificaciones
    where tipo = 'stock_bajo' and insumo_id = (select sal from ref)),
  0,
  'y la sal, que va sobrada, NO genera ninguna'
);

-- El mensaje lo lee gente con nivel de computadora basico (R18): tiene que
-- decir cuanto queda y cuanto deberia haber, no un codigo.
select ok(
  (select mensaje from public.notificaciones
    where tipo = 'stock_bajo' and insumo_id = (select harina from ref))
  like '%Harina%mínimo%',
  'el mensaje dice de que insumo se trata y cual es el minimo'
);
select ok(
  (select titulo from public.notificaciones
    where tipo = 'stock_bajo' and insumo_id = (select harina from ref))
  = 'Queda poco Harina',
  'y el titulo se entiende sin jerga'
);

-- =============================================================================
-- No se repite la misma alerta cada vez
--
-- Sin esto, el panel se llenaria de doscientas notificaciones identicas y
-- dejarian de leerse -- que es como una alerta deja de servir.
-- =============================================================================
select ok(true, 'se evalua otra vez el mismo dia');
select is(
  (select app.evaluar_alertas()), 0,
  'la segunda evaluacion del dia no crea ninguna alerta nueva'
);
select is(
  (select count(*)::int from public.notificaciones
    where tipo = 'stock_bajo' and insumo_id = (select harina from ref)),
  1,
  'y sigue habiendo una sola'
);

-- =============================================================================
-- Alerta de vencimiento (R12, prioridad 1 de la ficha 7.8)
-- =============================================================================
insert into public.lotes_insumo (id, insumo_id, codigo, fecha_vencimiento)
select 'aaaa1111-0000-0000-0000-000000000001', manteca, 'L-PRONTO', current_date + 5 from ref;
insert into public.lotes_insumo (id, insumo_id, codigo, fecha_vencimiento)
select 'aaaa1111-0000-0000-0000-000000000002', manteca, 'L-LEJOS',  current_date + 200 from ref;

insert into public.movimientos_insumo
  (tipo, insumo_id, almacen_id, lote_id, cantidad, unidad_id, responsable_id, proveedor_id, documento_tipo)
select 'ingreso', manteca, almacen, 'aaaa1111-0000-0000-0000-000000000001', 2, caja,
       '33333333-3333-3333-3333-333333333333', proveedor, 'factura' from ref;

delete from public.notificaciones;
select ok(app.evaluar_alertas() > 0, 'se vuelve a evaluar con los lotes cargados');

select is(
  (select count(*)::int from public.notificaciones
    where tipo = 'por_vencer' and lote_id = 'aaaa1111-0000-0000-0000-000000000001'),
  1,
  'un lote que vence en 5 dias genera alerta'
);
select is(
  (select count(*)::int from public.notificaciones
    where lote_id = 'aaaa1111-0000-0000-0000-000000000002'),
  0,
  'uno que vence en 200 dias no'
);
select ok(
  (select mensaje from public.notificaciones
    where lote_id = 'aaaa1111-0000-0000-0000-000000000001')
  like '%L-PRONTO%vence el%',
  'el mensaje dice que lote es y cuando vence'
);

-- =============================================================================
-- Despublicar novedades vencidas (R7)
-- =============================================================================
insert into public.novedades (id, tipo, titulo, slug, contenido, estado, vigencia_fin) values
  ('bbbb1111-0000-0000-0000-000000000001', 'campania', 'Campaña vencida', 'campania-vencida',
   'x', 'publicado', now() - interval '1 day'),
  ('bbbb1111-0000-0000-0000-000000000002', 'campania', 'Campaña vigente', 'campania-vigente',
   'x', 'publicado', now() + interval '30 day'),
  ('bbbb1111-0000-0000-0000-000000000003', 'aviso', 'Aviso sin vigencia', 'aviso-sin-vigencia',
   'x', 'publicado', null);

select is(app.archivar_novedades_vencidas(), 1, 'se archiva exactamente una novedad');

select is(
  (select estado from public.novedades where id = 'bbbb1111-0000-0000-0000-000000000001'),
  'archivado'::app.estado_publicacion,
  'la vencida pasa a archivada'
);
select is(
  (select estado from public.novedades where id = 'bbbb1111-0000-0000-0000-000000000002'),
  'publicado'::app.estado_publicacion,
  'la vigente se queda publicada'
);
select is(
  (select estado from public.novedades where id = 'bbbb1111-0000-0000-0000-000000000003'),
  'publicado'::app.estado_publicacion,
  'y una sin fecha de fin no se toca nunca'
);

-- =============================================================================
-- Quien ve las alertas
-- =============================================================================
set local role anon;
select is((select count(*)::int from public.notificaciones), 0,
  'un anonimo no ve las alertas: el stock del negocio no le incumbe');
reset role;

set local role authenticated;
set local request.jwt.claims = '{"sub": "44444444-4444-4444-4444-444444444444", "rol": "repartidor"}';
select is((select count(*)::int from public.notificaciones), 0,
  'un repartidor tampoco: no entra a insumos');
reset role;

select * from finish();
rollback;
