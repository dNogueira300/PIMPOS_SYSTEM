-- Verifica el kardex con lotes (0034).
--
-- Lo que se defiende: que cada salida descuente del lote que vence antes; que
-- el saldo no pueda quedar negativo; que el costo de cada lote salga del precio
-- de su ingreso; que una anulación devuelva a los mismos lotes lo mismo que se
-- movió, aunque la equivalencia haya cambiado; y que ajustar y anular sean cosa
-- de la administración, también si alguien llama a la API directamente.
begin;
select plan(53);

-- =============================================================================
-- Fixtures
-- =============================================================================
insert into auth.users (id, email, created_at, updated_at) values
  ('22222222-2222-2222-2222-222222222222', 'admin@pimpos.test',   now(), now()),
  ('33333333-3333-3333-3333-333333333333', 'inge@pimpos.test',    now(), now()),
  ('44444444-4444-4444-4444-444444444444', 'reparto@pimpos.test', now(), now());
update public.perfiles set rol = 'administrador', activo = true where id = '22222222-2222-2222-2222-222222222222';
update public.perfiles set rol = 'ingeniero',     activo = true where id = '33333333-3333-3333-3333-333333333333';
update public.perfiles set rol = 'repartidor',    activo = true where id = '44444444-4444-4444-4444-444444444444';

create temp table ref as
select
  (select id from public.insumos where nombre = 'Harina')            as harina,
  (select id from public.insumos where nombre = 'Sal')               as sal,
  (select id from public.insumos where nombre = 'Manteca')           as manteca,
  (select id from public.almacenes where es_principal)               as almacen,
  (select id from public.unidades_medida where codigo = 'saco')      as saco,
  (select id from public.unidades_medida where codigo = 'kg')        as kg,
  (select id from public.unidades_medida where codigo = 'g')         as g,
  (select id from public.unidades_medida where codigo = 'caja')      as caja,
  (select id from public.proveedores where nombre = 'Comercial FOX') as proveedor;
grant select on ref to authenticated;

-- Los movimientos que se anulan más abajo, por nombre.
create temp table mov (clave text primary key, id uuid);
grant all on mov to authenticated;

-- =============================================================================
-- Estructura
-- =============================================================================
select has_table('public', 'movimiento_lotes', 'existe movimiento_lotes');
select has_table('public', 'saldos_lote',      'existe saldos_lote');
select has_column('public', 'movimientos_insumo', 'sentido', 'el movimiento dice si entra o sale');
select has_column('public', 'lotes_insumo', 'costo_unitario', 'el lote guarda su costo');
select has_column('public', 'lotes_insumo', 'llegada', 'y su orden de llegada');
select is(app.formatear_cantidad(12.50), '12.5', 'una cantidad se escribe sin ceros de sobra');
select is(app.formatear_cantidad(30),    '30',   'y sin punto final si es entera');

-- =============================================================================
-- Una entrada crea su lote, con su costo
-- =============================================================================
-- 2 sacos a S/ 150 el saco: 100 kg a S/ 3.00 el kg.
with m as (
  insert into public.movimientos_insumo
    (tipo, insumo_id, cantidad, unidad_id, responsable_id, proveedor_id, documento_tipo, precio_unitario)
  select 'ingreso', harina, 2, saco, '33333333-3333-3333-3333-333333333333', proveedor, 'boleta', 150
  from ref returning id)
insert into mov select 'harina-1', id from m;

select is(
  (select count(*)::int from public.lotes_insumo where insumo_id = (select harina from ref)),
  1, 'un ingreso sin lote crea su lote'
);
select is(
  (select l.costo_unitario from public.lotes_insumo l where l.insumo_id = (select harina from ref)),
  3.000000::numeric(14,6), 'el costo del lote es el precio del saco entre sus 50 kg'
);
select is(
  (select sentido from public.movimientos_insumo where id = (select id from mov where clave = 'harina-1')),
  1::smallint, 'un ingreso entra'
);
select is(
  (select almacen_id from public.movimientos_insumo where id = (select id from mov where clave = 'harina-1')),
  (select almacen from ref), 'sin decir almacén, va al principal'
);

-- 1 saco a S/ 160: el segundo lote cuesta S/ 3.20 el kg.
insert into public.movimientos_insumo
  (tipo, insumo_id, cantidad, unidad_id, responsable_id, proveedor_id, documento_tipo, precio_unitario)
select 'ingreso', harina, 1, saco, '33333333-3333-3333-3333-333333333333', proveedor, 'boleta', 160 from ref;

-- =============================================================================
-- FEFO: sin fechas, sale primero el lote más antiguo
-- =============================================================================
insert into public.movimientos_insumo
  (tipo, insumo_id, cantidad, unidad_id, responsable_id, origen_consumo)
select 'consumo', harina, 120, kg, '33333333-3333-3333-3333-333333333333', 'produccion' from ref;

select is(
  (select array_agg(s.cantidad_base order by l.costo_unitario)
     from public.saldos_lote s join public.lotes_insumo l on l.id = s.lote_id
    where s.insumo_id = (select harina from ref)),
  array[0, 30]::numeric(14,4)[],
  'un consumo de 120 kg vacía el primer lote (100) y toma 20 del segundo'
);
select is(
  (select count(*)::int from public.movimiento_lotes ml
     join public.movimientos_insumo m on m.id = ml.movimiento_id
    where m.insumo_id = (select harina from ref) and m.tipo = 'consumo'),
  2, 'y el consumo queda repartido en dos lotes'
);
select is(
  (select cantidad_base from public.saldos_insumo where insumo_id = (select harina from ref)),
  (select sum(cantidad_base) from public.saldos_lote where insumo_id = (select harina from ref)),
  'el saldo del insumo es la suma de sus lotes'
);

-- =============================================================================
-- El saldo nunca es negativo
-- =============================================================================
select throws_ok(
  format($$ insert into public.movimientos_insumo
         (tipo, insumo_id, cantidad, unidad_id, responsable_id, origen_consumo)
       values ('consumo', %L, 31, %L, '33333333-3333-3333-3333-333333333333', 'produccion') $$,
    (select harina from ref), (select kg from ref)),
  'P0001',
  'Solo hay 30 kg de Harina. Si en el almacén hay más, falta registrar un ingreso o hacer un conteo.',
  'un consumo mayor que lo que hay se rechaza diciendo cuánto hay'
);
select is(
  (select cantidad_base from public.saldos_insumo where insumo_id = (select harina from ref)),
  30.0::numeric(14,4), 'y no toca el saldo'
);

-- =============================================================================
-- FEFO: con fechas, sale primero el que vence antes
-- =============================================================================
-- El que vence más tarde se registra primero, para que el orden de llegada no
-- esconda un FEFO roto.
insert into public.lotes_insumo (id, insumo_id, codigo, fecha_vencimiento) values
  ('aaaa3434-0000-0000-0000-000000000001', (select manteca from ref), 'L-TARDE',  current_date + 60),
  ('aaaa3434-0000-0000-0000-000000000002', (select manteca from ref), 'L-PRONTO', current_date + 10);
insert into public.movimientos_insumo
  (tipo, insumo_id, lote_id, cantidad, unidad_id, responsable_id, proveedor_id, documento_tipo, precio_unitario)
select 'ingreso', manteca, 'aaaa3434-0000-0000-0000-000000000001', 1, caja,
       '33333333-3333-3333-3333-333333333333', proveedor, 'factura', 90 from ref;
insert into public.movimientos_insumo
  (tipo, insumo_id, lote_id, cantidad, unidad_id, responsable_id, proveedor_id, documento_tipo, precio_unitario)
select 'ingreso', manteca, 'aaaa3434-0000-0000-0000-000000000002', 1, caja,
       '33333333-3333-3333-3333-333333333333', proveedor, 'factura', 100 from ref;

-- Media caja: 5 kg. Se anula más abajo, después de cambiar la equivalencia.
with m as (
  insert into public.movimientos_insumo
    (tipo, insumo_id, cantidad, unidad_id, responsable_id, origen_consumo)
  select 'consumo', manteca, 0.5, caja, '33333333-3333-3333-3333-333333333333', 'produccion'
  from ref returning id)
insert into mov select 'manteca-consumo', id from m;

select is(
  (select cantidad_base from public.saldos_lote where lote_id = 'aaaa3434-0000-0000-0000-000000000002'),
  5.0::numeric(14,4), 'el consumo sale del lote que vence antes aunque llegó después'
);
select is(
  (select cantidad_base from public.saldos_lote where lote_id = 'aaaa3434-0000-0000-0000-000000000001'),
  10.0::numeric(14,4), 'y el que vence más tarde queda entero'
);

-- Una baja que nombra su lote sale solo de ese lote.
insert into public.movimientos_insumo
  (tipo, insumo_id, lote_id, cantidad, unidad_id, responsable_id, motivo_baja, autorizado_por)
select 'baja', manteca, 'aaaa3434-0000-0000-0000-000000000001', 3, kg,
       '22222222-2222-2222-2222-222222222222', 'danado', '22222222-2222-2222-2222-222222222222' from ref;

select is(
  (select array_agg(cantidad_base order by lote_id) from public.saldos_lote
    where insumo_id = (select manteca from ref)),
  array[7, 5]::numeric(14,4)[],
  'una baja con lote descuenta de ese lote y no del que vence antes'
);
select throws_ok(
  format($$ insert into public.movimientos_insumo
         (tipo, insumo_id, lote_id, cantidad, unidad_id, responsable_id, motivo_baja, autorizado_por)
       values ('baja', %L, 'aaaa3434-0000-0000-0000-000000000002', 6, %L,
               '22222222-2222-2222-2222-222222222222', 'merma', '22222222-2222-2222-2222-222222222222') $$,
    (select manteca from ref), (select kg from ref)),
  'P0001',
  'Solo hay 5 kg de Manteca en ese lote. Si en el almacén hay más, falta registrar un ingreso o hacer un conteo.',
  'si el lote nombrado no alcanza, lo dice'
);

-- =============================================================================
-- Anulación
-- =============================================================================
-- Se cambia la equivalencia de la caja de manteca DESPUÉS del consumo: la
-- anulación tiene que devolver los 5 kg que salieron, no 0.5 × 12 = 6.
update public.equivalencias set factor = 12
 where insumo_id = (select manteca from ref) and unidad_desde = (select caja from ref);

with m as (
  insert into public.movimientos_insumo (tipo, anula_a, insumo_id, cantidad, unidad_id, responsable_id, observacion)
  select 'anulacion', (select id from mov where clave = 'manteca-consumo'), manteca, 1, kg,
         '22222222-2222-2222-2222-222222222222', 'Se registró dos veces' from ref
  returning id, cantidad_base, sentido)
insert into mov select 'anulacion-manteca', id from m;

select is(
  (select cantidad_base from public.movimientos_insumo where id = (select id from mov where clave = 'anulacion-manteca')),
  5.0::numeric(14,4), 'la anulación mueve lo mismo que el original, aunque la equivalencia haya cambiado'
);
select is(
  (select cantidad from public.movimientos_insumo where id = (select id from mov where clave = 'anulacion-manteca')),
  0.5::numeric(14,4), 'y copia la cantidad y la unidad del original, se mande lo que se mande'
);
select is(
  (select sentido from public.movimientos_insumo where id = (select id from mov where clave = 'anulacion-manteca')),
  1::smallint, 'anular un consumo es una entrada'
);
select is(
  (select cantidad_base from public.saldos_lote where lote_id = 'aaaa3434-0000-0000-0000-000000000002'),
  10.0::numeric(14,4), 'y devuelve los 5 kg al mismo lote del que salieron'
);
select throws_ok(
  format($$ insert into public.movimientos_insumo (tipo, anula_a, insumo_id, cantidad, unidad_id, responsable_id, observacion)
       values ('anulacion', %L, %L, 1, %L, '22222222-2222-2222-2222-222222222222', 'Otra vez') $$,
    (select id from mov where clave = 'manteca-consumo'), (select manteca from ref), (select kg from ref)),
  '23505', null, 'un movimiento se anula una sola vez'
);
select throws_ok(
  format($$ insert into public.movimientos_insumo (tipo, anula_a, insumo_id, cantidad, unidad_id, responsable_id, observacion)
       values ('anulacion', %L, %L, 1, %L, '22222222-2222-2222-2222-222222222222', 'Deshacer') $$,
    (select id from mov where clave = 'anulacion-manteca'), (select manteca from ref), (select kg from ref)),
  'P0001', 'Una anulación no se puede anular. Si hace falta, registra el movimiento otra vez.',
  'una anulación no se anula'
);
select throws_ok(
  format($$ insert into public.movimientos_insumo (tipo, anula_a, insumo_id, cantidad, unidad_id, responsable_id, observacion)
       values ('anulacion', %L, %L, 1, %L, '22222222-2222-2222-2222-222222222222', 'Error de boleta') $$,
    (select id from mov where clave = 'harina-1'), (select harina from ref), (select kg from ref)),
  'P0001',
  'Ya se usó parte de lo que entró con ese movimiento, así que no se puede anular. Cuenta lo que hay y registra un ajuste.',
  'no se anula un ingreso que ya se consumió en parte'
);
select throws_ok(
  format($$ insert into public.movimientos_insumo (tipo, anula_a, insumo_id, cantidad, unidad_id, responsable_id)
       values ('anulacion', %L, %L, 1, %L, '22222222-2222-2222-2222-222222222222') $$,
    (select id from mov where clave = 'harina-1'), (select harina from ref), (select kg from ref)),
  '23514', null, 'una anulación sin explicación no entra'
);

-- =============================================================================
-- Ajuste
-- =============================================================================
insert into public.movimientos_insumo (tipo, sentido, insumo_id, cantidad, unidad_id, responsable_id, observacion)
select 'ajuste', 1, sal, 10, kg, '22222222-2222-2222-2222-222222222222', 'Conteo inicial' from ref;

select is(
  (select cantidad_base from public.saldos_insumo where insumo_id = (select sal from ref)),
  10.0::numeric(14,4), 'un ajuste de entrada suma'
);
select is(
  (select l.costo_unitario::numeric from public.lotes_insumo l where l.insumo_id = (select sal from ref)),
  null::numeric, 'sin precio y sin compras anteriores, el lote queda sin costo conocido'
);

insert into public.movimientos_insumo (tipo, sentido, insumo_id, cantidad, unidad_id, responsable_id, observacion)
select 'ajuste', 1, harina, 5, kg, '22222222-2222-2222-2222-222222222222', 'Apareció un saco abierto' from ref;
select is(
  (select l.costo_unitario from public.lotes_insumo l
     join public.saldos_lote s on s.lote_id = l.id
    where l.insumo_id = (select harina from ref) and s.cantidad_base = 5),
  3.200000::numeric(14,6), 'un ajuste de entrada sin precio toma el último costo conocido'
);

insert into public.movimientos_insumo (tipo, sentido, insumo_id, cantidad, unidad_id, responsable_id, observacion)
select 'ajuste', -1, sal, 4000, g, '22222222-2222-2222-2222-222222222222', 'Conteo semanal' from ref;
select is(
  (select cantidad_base from public.saldos_insumo where insumo_id = (select sal from ref)),
  6.0::numeric(14,4), 'un ajuste de salida en gramos resta 4 kg'
);
select throws_ok(
  format($$ insert into public.movimientos_insumo (tipo, sentido, insumo_id, cantidad, unidad_id, responsable_id)
       values ('ajuste', 1, %L, 1, %L, '22222222-2222-2222-2222-222222222222') $$,
    (select sal from ref), (select kg from ref)),
  '23514', null, 'un ajuste sin explicación no entra'
);
select throws_ok(
  format($$ insert into public.movimientos_insumo (tipo, sentido, insumo_id, cantidad, unidad_id, responsable_id, observacion)
       values ('ajuste', 1, %L, 1, %L, '22222222-2222-2222-2222-222222222222', 'Conteo') $$,
    (select manteca from ref), (select kg from ref)),
  '23514', null, 'un ajuste de entrada de un perecible necesita lote con vencimiento'
);

-- =============================================================================
-- La unidad base no cambia cuando ya hay historia
-- =============================================================================
select throws_ok(
  format($$ update public.insumos set unidad_base_id = %L where id = %L $$,
    (select g from ref), (select harina from ref)),
  'P0001',
  'Harina ya tiene movimientos: su unidad base no se puede cambiar. Si hace falta, crea un insumo nuevo.',
  'la unidad base de un insumo con movimientos queda fija'
);

-- =============================================================================
-- El recálculo reconstruye también los lotes
-- =============================================================================
update public.saldos_lote   set cantidad_base = 999 where insumo_id = (select harina from ref);
update public.saldos_insumo set cantidad_base = 999 where insumo_id = (select harina from ref);
select ok(app.recalcular_saldos() > 0, 'se recalcula');
select is(
  (select sum(cantidad_base) from public.saldos_lote where insumo_id = (select harina from ref)),
  35.0::numeric(14,4), 'los lotes vuelven a sumar 30 + 5'
);
select is(
  (select cantidad_base from public.saldos_insumo where insumo_id = (select harina from ref)),
  35.0::numeric(14,4), 'y el insumo también'
);

-- =============================================================================
-- La alerta de vencimiento mira el lote, no el insumo
-- =============================================================================
insert into public.lotes_insumo (id, insumo_id, codigo, fecha_vencimiento) values
  ('aaaa3434-0000-0000-0000-000000000003', (select manteca from ref), 'L-GASTADO', current_date + 3);
insert into public.movimientos_insumo
  (tipo, insumo_id, lote_id, cantidad, unidad_id, responsable_id, proveedor_id, documento_tipo)
select 'ingreso', manteca, 'aaaa3434-0000-0000-0000-000000000003', 2, kg,
       '33333333-3333-3333-3333-333333333333', proveedor, 'factura' from ref;
insert into public.movimientos_insumo
  (tipo, insumo_id, lote_id, cantidad, unidad_id, responsable_id, motivo_baja, autorizado_por)
select 'baja', manteca, 'aaaa3434-0000-0000-0000-000000000003', 2, kg,
       '22222222-2222-2222-2222-222222222222', 'merma', '22222222-2222-2222-2222-222222222222' from ref;
delete from public.notificaciones;
select ok(app.evaluar_alertas() > 0, 'se evalúan las alertas');
select is(
  (select count(*)::int from public.notificaciones where lote_id = 'aaaa3434-0000-0000-0000-000000000003'),
  0, 'un lote que ya se gastó entero no avisa aunque quede manteca de otros lotes'
);
select is(
  (select count(*)::int from public.notificaciones where lote_id = 'aaaa3434-0000-0000-0000-000000000002'),
  1, 'uno con existencia que vence en 10 días sí'
);

-- =============================================================================
-- Anular un ingreso que nadie tocó todavía: el lote entero vuelve a 0
--
-- Hasta aquí las anulaciones probadas deshacían un CONSUMO (sentido pasa de -1
-- a 1). Falta el otro sentido: anular una ENTRADA intacta, que tiene que
-- devolver el lote a 0 y no solo bajar el saldo del insumo.
-- =============================================================================
with m as (
  insert into public.movimientos_insumo
    (tipo, insumo_id, cantidad, unidad_id, responsable_id, proveedor_id, documento_tipo)
  select 'ingreso', sal, 5, kg, '33333333-3333-3333-3333-333333333333', proveedor, 'boleta'
  from ref returning id)
insert into mov select 'sal-ingreso-intacto', id from m;

select lives_ok(
  format($$ insert into public.movimientos_insumo (tipo, anula_a, insumo_id, cantidad, unidad_id, responsable_id, observacion)
       values ('anulacion', %L, %L, 1, %L, '22222222-2222-2222-2222-222222222222', 'Se registró de más') $$,
    (select id from mov where clave = 'sal-ingreso-intacto'), (select sal from ref), (select kg from ref)),
  'un ingreso que nadie consumió sí se puede anular'
);
select is(
  (select s.cantidad_base from public.saldos_lote s
     join public.movimiento_lotes ml on ml.lote_id = s.lote_id
    where ml.movimiento_id = (select id from mov where clave = 'sal-ingreso-intacto')),
  0.0::numeric(14,4), 'y su lote entero vuelve a 0, no solo el saldo del insumo'
);
select is(
  (select cantidad_base from public.saldos_insumo where insumo_id = (select sal from ref)),
  6.0::numeric(14,4), 'el saldo del insumo baja lo mismo que había entrado'
);

-- Un segundo ingreso intacto, para que la administración lo anule por la API
-- más abajo (sin que nadie más lo haya tocado antes).
with m as (
  insert into public.movimientos_insumo
    (tipo, insumo_id, cantidad, unidad_id, responsable_id, proveedor_id, documento_tipo)
  select 'ingreso', sal, 3, kg, '33333333-3333-3333-3333-333333333333', proveedor, 'boleta'
  from ref returning id)
insert into mov select 'sal-ingreso-para-admin', id from m;

-- =============================================================================
-- Quién puede qué, por la API
-- =============================================================================
set local role authenticated;
set local request.jwt.claims = '{"sub": "33333333-3333-3333-3333-333333333333", "rol": "ingeniero"}';

select lives_ok(
  format($$ insert into public.movimientos_insumo (tipo, insumo_id, cantidad, unidad_id, origen_consumo)
       values ('consumo', %L, 1, %L, 'retiro_directo') $$, (select sal from ref), (select kg from ref)),
  'el ingeniero registra un consumo sin mandar almacén ni responsable'
);
select throws_ok(
  format($$ insert into public.movimientos_insumo (tipo, sentido, insumo_id, cantidad, unidad_id, observacion)
       values ('ajuste', 1, %L, 100, %L, 'Conteo') $$, (select sal from ref), (select kg from ref)),
  '42501', null, 'el ingeniero no ajusta'
);
select throws_ok(
  format($$ insert into public.movimientos_insumo (tipo, insumo_id, cantidad, unidad_id, motivo_baja, autorizado_por)
       values ('baja', %L, 1, %L, 'merma', '22222222-2222-2222-2222-222222222222') $$,
    (select sal from ref), (select kg from ref)),
  '42501', null, 'ni da de baja poniendo a un administrador como autorizador: la baja se pide (T5)'
);
select throws_ok(
  format($$ insert into public.movimientos_insumo (tipo, insumo_id, cantidad, unidad_id, responsable_id, origen_consumo)
       values ('consumo', %L, 1, %L, '22222222-2222-2222-2222-222222222222', 'produccion') $$,
    (select sal from ref), (select kg from ref)),
  '42501', null, 'ni registra a nombre de otra persona'
);
select throws_ok(
  $$ update public.saldos_lote set cantidad_base = 1000 $$,
  '42501', null, 'ni escribe un saldo de lote'
);
select throws_ok(
  format($$ insert into public.movimientos_insumo (tipo, anula_a, insumo_id, cantidad, unidad_id, observacion)
       values ('anulacion', %L, %L, 1, %L, 'Intento no autorizado') $$,
    (select id from mov where clave = 'harina-1'), (select harina from ref), (select kg from ref)),
  '42501', null, 'el ingeniero tampoco anula: ajuste y anulación son cosa de la administración'
);
select ok(
  (select count(*) from public.movimiento_lotes) > 0,
  'pero sí lee de qué lote salió cada cosa'
);

set local request.jwt.claims = '{"sub": "22222222-2222-2222-2222-222222222222", "rol": "administrador"}';
select lives_ok(
  format($$ insert into public.movimientos_insumo (tipo, anula_a, insumo_id, cantidad, unidad_id, responsable_id, observacion)
       values ('anulacion', %L, %L, 1, %L, '22222222-2222-2222-2222-222222222222', 'Se registró de más') $$,
    (select id from mov where clave = 'sal-ingreso-para-admin'), (select sal from ref), (select kg from ref)),
  'un administrador sí anula, por la API'
);

set local request.jwt.claims = '{"sub": "44444444-4444-4444-4444-444444444444", "rol": "repartidor"}';
select is((select count(*)::int from public.saldos_lote), 0, 'el repartidor no ve los lotes');
reset role;

select * from finish();
rollback;
