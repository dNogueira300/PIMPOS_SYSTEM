-- Verifica las funciones de reportes (0039).
--
-- Lo que se defiende: que cada total salga del costo REAL de los lotes; que lo
-- anulado no cuente; que un movimiento de las 23:30 de Iquitos caiga en su día
-- de Iquitos; y que un faltante de conteo aparezca como pérdida.
begin;
select plan(11);

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
  (select id from public.insumos where nombre = 'Azúcar')            as azucar,
  (select id from public.unidades_medida where codigo = 'saco')      as saco,
  (select id from public.unidades_medida where codigo = 'kg')        as kg,
  (select id from public.proveedores where nombre = 'Comercial FOX') as fox,
  (now() at time zone 'America/Lima')::date                          as hoy;
grant select on ref to authenticated;

-- Dos lotes de harina a distinto precio: 100 kg a S/ 3 y 50 kg a S/ 3.20.
insert into public.movimientos_insumo
  (tipo, insumo_id, cantidad, unidad_id, responsable_id, proveedor_id, documento_tipo, precio_unitario)
select 'ingreso', harina, 2, saco, '33333333-3333-3333-3333-333333333333', fox, 'boleta', 150 from ref;
insert into public.movimientos_insumo
  (tipo, insumo_id, cantidad, unidad_id, responsable_id, proveedor_id, documento_tipo, precio_unitario)
select 'ingreso', harina, 1, saco, '33333333-3333-3333-3333-333333333333', fox, 'boleta', 160 from ref;
-- Una compra anulada no cuenta.
insert into public.movimientos_insumo
  (tipo, insumo_id, cantidad, unidad_id, responsable_id, proveedor_id, documento_tipo, precio_unitario)
select 'ingreso', azucar, 1, saco, '33333333-3333-3333-3333-333333333333', fox, 'boleta', 120 from ref;
insert into public.movimientos_insumo (tipo, anula_a, insumo_id, cantidad, unidad_id, responsable_id, observacion)
select 'anulacion', m.id, m.insumo_id, 1, m.unidad_id, '22222222-2222-2222-2222-222222222222', 'Boleta de otro local'
  from public.movimientos_insumo m where m.insumo_id = (select azucar from ref) and m.tipo = 'ingreso';

-- Consumo de 120 kg: 100 a S/ 3 + 20 a S/ 3.20 = S/ 364. A las 23:30 de ayer en Iquitos.
insert into public.movimientos_insumo
  (tipo, insumo_id, cantidad, unidad_id, responsable_id, origen_consumo, destino_lote, area_turno, ocurrido_en)
select 'consumo', harina, 120, kg, '33333333-3333-3333-3333-333333333333', 'produccion', 'Pan', 'Noche',
       ((hoy - 1) + time '23:30') at time zone 'America/Lima'
from ref;

-- Una baja de 5 kg (S/ 16) y un faltante de conteo de 2 kg (S/ 6.40).
insert into public.movimientos_insumo
  (tipo, insumo_id, cantidad, unidad_id, responsable_id, motivo_baja, autorizado_por)
select 'baja', harina, 5, kg, '22222222-2222-2222-2222-222222222222', 'merma', '22222222-2222-2222-2222-222222222222' from ref;
insert into public.movimientos_insumo (tipo, sentido, insumo_id, cantidad, unidad_id, responsable_id, observacion)
select 'ajuste', -1, harina, 2, kg, '22222222-2222-2222-2222-222222222222', 'Conteo semanal' from ref;

set local role authenticated;
set local request.jwt.claims = '{"sub": "33333333-3333-3333-3333-333333333333", "rol": "ingeniero"}';

select is(
  (select costo from public.reporte_consumo((select hoy - 1 from ref), (select hoy - 1 from ref))
    where insumo_id = (select harina from ref)),
  364.00::numeric, 'el consumo cuesta lo que costaron sus lotes: 100 × 3 + 20 × 3.20'
);
select is(
  (select count(*)::int from public.reporte_consumo((select hoy from ref), (select hoy from ref))),
  0, 'el consumo de las 23:30 de ayer no cae en hoy'
);
select is(
  (select sum(costo) from public.reporte_compras((select hoy from ref), (select hoy from ref))),
  460.00::numeric, 'las compras suman 300 + 160; la anulada no cuenta'
);
select is(
  (select cantidad_base from public.reporte_compras((select hoy from ref), (select hoy from ref))
    where insumo = 'Harina'),
  150.0::numeric, 'la harina comprada son 150 kg'
);
select is(
  (select costo from public.reporte_mermas((select hoy from ref), (select hoy from ref))
    where motivo = 'merma'),
  16.00::numeric, 'la merma de 5 kg vale S/ 16'
);
select is(
  (select costo from public.reporte_mermas((select hoy from ref), (select hoy from ref))
    where motivo = 'faltante_conteo'),
  6.40::numeric, 'y el faltante de conteo aparece como pérdida: S/ 6.40'
);
select is(
  (select cantidad_base from public.reporte_existencias() where insumo_id = (select harina from ref)),
  23.0::numeric, 'quedan 150 − 120 − 5 − 2 = 23 kg'
);
select is(
  (select valor from public.reporte_existencias() where insumo_id = (select harina from ref)),
  73.60::numeric, 'que valen 23 × 3.20 (el lote barato ya se gastó)'
);
select is(
  (select sin_costo from public.reporte_existencias() where insumo_id = (select harina from ref)),
  false, 'y todos sus lotes tienen costo'
);

set local request.jwt.claims = '{"sub": "44444444-4444-4444-4444-444444444444", "rol": "repartidor"}';
select is((select count(*)::int from public.reporte_existencias()), 0, 'el repartidor no ve existencias');
select is((select count(*)::int from public.reporte_mermas((select hoy from ref), (select hoy from ref))), 0,
  'ni mermas');
reset role;

select * from finish();
rollback;
