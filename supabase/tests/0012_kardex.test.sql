-- Verifica el kardex: movimientos, conversion automatica y saldos (0012).
--
-- Cubre la ultima de las nueve pruebas obligatorias del doc 02 §11.3: una baja
-- de insumo sin autorizacion es rechazada. Con esta, van las 9.
--
-- Lo que se comprueba aqui no es que el SQL corra, sino que el saldo salga
-- BIEN: un kardex que suma mal no da error, da un numero equivocado.
begin;
select plan(33);

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

create temp table ref as
select
  (select id from public.insumos where nombre = 'Harina')            as harina,
  (select id from public.insumos where nombre = 'Sal')               as sal,
  (select id from public.insumos where nombre = 'Manteca')           as manteca,
  (select id from public.almacenes where es_principal)               as almacen,
  (select id from public.unidades_medida where codigo = 'saco')      as saco,
  (select id from public.unidades_medida where codigo = 'kg')        as kg,
  (select id from public.unidades_medida where codigo = 'caja')      as caja,
  (select id from public.proveedores where nombre = 'Comercial FOX') as proveedor;

-- =============================================================================
-- Estructura
-- =============================================================================
select has_table('public', 'lotes_insumo',       'existe lotes_insumo');
select has_table('public', 'movimientos_insumo', 'existe movimientos_insumo');
select has_table('public', 'saldos_insumo',      'existe saldos_insumo');
select has_function('app', 'calcular_cantidad_base', 'existe el trigger de conversion');
select has_function('app', 'recalcular_saldos',      'existe el recalculo de saldos');

-- =============================================================================
-- El trigger convierte, y el saldo sale bien
-- =============================================================================
insert into public.movimientos_insumo
  (tipo, insumo_id, almacen_id, cantidad, unidad_id, responsable_id, proveedor_id, documento_tipo, documento_numero)
select 'ingreso', r.harina, r.almacen, 3, r.saco, '33333333-3333-3333-3333-333333333333',
       r.proveedor, 'factura', 'F001-123'
from ref r;

select is(
  (select cantidad_base from public.movimientos_insumo where insumo_id = (select harina from ref)),
  150.0::numeric(14,4),
  '3 sacos de harina se guardan como 150 kg: el trigger convirtio solo'
);
select is(
  (select cantidad from public.movimientos_insumo where insumo_id = (select harina from ref)),
  3.0::numeric(14,4),
  'y se conserva lo que la persona escribio: 3 sacos'
);
select is(
  (select cantidad_base from public.saldos_insumo where insumo_id = (select harina from ref)),
  150.0::numeric(14,4),
  'el saldo quedo en 150 kg'
);

-- El mismo "saco" en otro insumo da otro numero. Es la razon de ser del modelo.
insert into public.movimientos_insumo
  (tipo, insumo_id, almacen_id, cantidad, unidad_id, responsable_id, proveedor_id, documento_tipo)
select 'ingreso', r.sal, r.almacen, 3, r.saco, '33333333-3333-3333-3333-333333333333',
       r.proveedor, 'boleta'
from ref r;

select is(
  (select cantidad_base from public.saldos_insumo where insumo_id = (select sal from ref)),
  75.0::numeric(14,4),
  'los mismos 3 sacos, pero de sal, dejan 75 kg y no 150'
);

-- =============================================================================
-- El saldo se acumula y resta
-- =============================================================================
insert into public.movimientos_insumo
  (tipo, insumo_id, almacen_id, cantidad, unidad_id, responsable_id, proveedor_id, documento_tipo)
select 'ingreso', r.harina, r.almacen, 50, r.kg, '33333333-3333-3333-3333-333333333333',
       r.proveedor, 'guia'
from ref r;

select is(
  (select cantidad_base from public.saldos_insumo where insumo_id = (select harina from ref)),
  200.0::numeric(14,4),
  'un segundo ingreso suma: 150 + 50 = 200 kg'
);

insert into public.movimientos_insumo
  (tipo, insumo_id, almacen_id, cantidad, unidad_id, responsable_id, origen_consumo, area_turno)
select 'consumo', r.harina, r.almacen, 25, r.kg, '33333333-3333-3333-3333-333333333333',
       'produccion', 'Turno mañana'
from ref r;

select is(
  (select cantidad_base from public.saldos_insumo where insumo_id = (select harina from ref)),
  175.0::numeric(14,4),
  'un consumo resta: 200 - 25 = 175 kg'
);

insert into public.movimientos_insumo
  (tipo, insumo_id, almacen_id, cantidad, unidad_id, responsable_id, motivo_baja, autorizado_por)
select 'baja', r.harina, r.almacen, 1, r.saco, '33333333-3333-3333-3333-333333333333',
       'merma', '22222222-2222-2222-2222-222222222222'
from ref r;

select is(
  (select cantidad_base from public.saldos_insumo where insumo_id = (select harina from ref)),
  125.0::numeric(14,4),
  'una baja de 1 saco resta 50 kg: 175 - 50 = 125'
);

-- =============================================================================
-- El recalculo reconstruye lo mismo
--
-- Esto es lo que hace fiable el saldo: si algun dia no cuadra, se recalcula
-- desde los movimientos y se ve el numero verdadero.
-- =============================================================================
update public.saldos_insumo set cantidad_base = 99999
 where insumo_id = (select harina from ref);

select is(
  (select cantidad_base from public.saldos_insumo where insumo_id = (select harina from ref)),
  99999.0::numeric(14,4),
  'se ensucia el saldo a proposito'
);

select ok(app.recalcular_saldos() >= 2, 'el recalculo devuelve las filas reconstruidas');

select is(
  (select cantidad_base from public.saldos_insumo where insumo_id = (select harina from ref)),
  125.0::numeric(14,4),
  'y el saldo vuelve al valor verdadero, derivado de los movimientos'
);
select is(
  (select cantidad_base from public.saldos_insumo where insumo_id = (select sal from ref)),
  75.0::numeric(14,4),
  'sin tocar el de los demas insumos'
);

-- =============================================================================
-- El saldo NO se puede falsear desde la aplicacion
-- =============================================================================
insert into public.movimientos_insumo
  (tipo, insumo_id, almacen_id, cantidad, unidad_id, cantidad_base, responsable_id, proveedor_id, documento_tipo)
select 'ingreso', r.sal, r.almacen, 1, r.saco, 99999, '33333333-3333-3333-3333-333333333333',
       r.proveedor, 'boleta'
from ref r;

select is(
  (select cantidad_base from public.movimientos_insumo
    where insumo_id = (select sal from ref) order by secuencia desc limit 1),
  25.0::numeric(14,4),
  'mandar cantidad_base a mano no sirve: el trigger la recalcula igual'
);

-- =============================================================================
-- Las reglas de la ficha, impuestas por la base
-- =============================================================================

-- Ficha 7.7: una baja exige autorizacion del encargado. Es la ultima de las
-- nueve pruebas obligatorias del doc 02 §11.3.
select throws_ok(
  format(
    $$ insert into public.movimientos_insumo
         (tipo, insumo_id, almacen_id, cantidad, unidad_id, responsable_id, motivo_baja)
       values ('baja', %L, %L, 1, %L, '33333333-3333-3333-3333-333333333333', 'merma') $$,
    (select harina from ref), (select almacen from ref), (select kg from ref)
  ),
  '23514',
  null,
  'una baja SIN autorizacion es rechazada'
);

select throws_ok(
  format(
    $$ insert into public.movimientos_insumo
         (tipo, insumo_id, almacen_id, cantidad, unidad_id, responsable_id, autorizado_por)
       values ('baja', %L, %L, 1, %L, '33333333-3333-3333-3333-333333333333',
               '22222222-2222-2222-2222-222222222222') $$,
    (select harina from ref), (select almacen from ref), (select kg from ref)
  ),
  '23514',
  null,
  'y una baja sin motivo tambien'
);

-- Ficha 7.5: un ingreso sin proveedor ni documento no se puede rastrear.
select throws_ok(
  format(
    $$ insert into public.movimientos_insumo
         (tipo, insumo_id, almacen_id, cantidad, unidad_id, responsable_id)
       values ('ingreso', %L, %L, 1, %L, '33333333-3333-3333-3333-333333333333') $$,
    (select harina from ref), (select almacen from ref), (select kg from ref)
  ),
  '23514',
  null,
  'un ingreso sin proveedor ni documento es rechazado'
);

-- Los campos de un tipo no se rellenan en otro.
select throws_ok(
  format(
    $$ insert into public.movimientos_insumo
         (tipo, insumo_id, almacen_id, cantidad, unidad_id, responsable_id, origen_consumo)
       values ('consumo', %L, %L, 1, %L, '33333333-3333-3333-3333-333333333333', 'produccion'),
              ('consumo', %L, %L, 1, %L, '33333333-3333-3333-3333-333333333333', 'produccion') $$,
    (select harina from ref), (select almacen from ref), (select kg from ref),
    (select harina from ref), (select almacen from ref), (select kg from ref)
  ) || $$ ; insert into public.movimientos_insumo
         (tipo, insumo_id, almacen_id, cantidad, unidad_id, responsable_id, motivo_baja)
       select 'consumo', harina, almacen, 1, kg, '33333333-3333-3333-3333-333333333333', 'merma' from ref $$,
  '23514',
  null,
  'un consumo con motivo de baja se rechaza: son campos de otro tipo'
);

-- Un perecible sin lote con vencimiento no puede entrar: sin fecha no puede
-- entrar en la alerta de vencimiento proximo (R12, prioridad 1).
select throws_ok(
  format(
    $$ insert into public.movimientos_insumo
         (tipo, insumo_id, almacen_id, cantidad, unidad_id, responsable_id, proveedor_id, documento_tipo)
       values ('ingreso', %L, %L, 1, %L, '33333333-3333-3333-3333-333333333333', %L, 'factura') $$,
    (select manteca from ref), (select almacen from ref), (select caja from ref),
    (select proveedor from ref)
  ),
  '23514',
  null,
  'un perecible sin lote con fecha de vencimiento no puede ingresar'
);

-- Con su lote, si.
insert into public.lotes_insumo (id, insumo_id, codigo, fecha_vencimiento)
select 'eeee0000-0000-0000-0000-000000000001', harina, 'L-001', current_date + 30 from ref;

insert into public.lotes_insumo (id, insumo_id, codigo, fecha_vencimiento)
select 'eeee0000-0000-0000-0000-000000000002', manteca, 'L-002', current_date + 20 from ref;

select lives_ok(
  format(
    $$ insert into public.movimientos_insumo
         (tipo, insumo_id, almacen_id, lote_id, cantidad, unidad_id, responsable_id, proveedor_id, documento_tipo)
       values ('ingreso', %L, %L, 'eeee0000-0000-0000-0000-000000000002', 2, %L,
               '33333333-3333-3333-3333-333333333333', %L, 'factura') $$,
    (select manteca from ref), (select almacen from ref), (select caja from ref),
    (select proveedor from ref)
  ),
  'con su lote y fecha, el perecible si ingresa'
);

select is(
  (select cantidad_base from public.saldos_insumo where insumo_id = (select manteca from ref)),
  20.0::numeric(14,4),
  'y 2 cajas de manteca dejan 20 kg'
);

-- =============================================================================
-- El kardex es un registro: solo se inserta
-- =============================================================================
set local role authenticated;
set local request.jwt.claims = '{"sub": "11111111-1111-1111-1111-111111111111", "rol": "superadmin"}';

select throws_ok(
  $$ update public.movimientos_insumo set cantidad = 1 $$,
  '42501',
  null,
  'ni el superadmin puede modificar un movimiento ya registrado'
);
select throws_ok(
  $$ delete from public.movimientos_insumo $$,
  '42501',
  null,
  'ni borrarlo: un error se corrige con un movimiento contrario'
);
select throws_ok(
  $$ update public.saldos_insumo set cantidad_base = 0 $$,
  '42501',
  null,
  'ni editar el saldo a mano'
);

reset role;

-- =============================================================================
-- Nada de esto es publico, y el repartidor tampoco entra
-- =============================================================================
set local role anon;
select is((select count(*)::int from public.movimientos_insumo), 0,
  'un anonimo no ve ningun movimiento');
select is((select count(*)::int from public.saldos_insumo), 0,
  'ni los saldos');
reset role;

set local role authenticated;
set local request.jwt.claims = '{"sub": "44444444-4444-4444-4444-444444444444", "rol": "repartidor"}';
select is((select count(*)::int from public.movimientos_insumo), 0,
  'un repartidor no ve el kardex');
select is((select count(*)::int from public.saldos_insumo), 0,
  'ni los saldos');

set local request.jwt.claims = '{"sub": "33333333-3333-3333-3333-333333333333", "rol": "ingeniero"}';
select ok((select count(*) from public.movimientos_insumo) > 0,
  'un ingeniero si lleva el kardex');
reset role;

-- =============================================================================
-- Auditoria (R9)
-- =============================================================================
select ok(
  (select count(*) from app.auditoria where tabla = 'public.movimientos_insumo') > 0,
  'cada movimiento queda auditado'
);

select * from finish();
rollback;
