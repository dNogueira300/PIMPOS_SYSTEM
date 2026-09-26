-- Verifica guardar_insumo y existencias_insumo (0035).
begin;
select plan(14);

insert into auth.users (id, email, created_at, updated_at) values
  ('33333333-3333-3333-3333-333333333333', 'inge@pimpos.test',    now(), now()),
  ('44444444-4444-4444-4444-444444444444', 'reparto@pimpos.test', now(), now());
update public.perfiles set rol = 'ingeniero',  activo = true where id = '33333333-3333-3333-3333-333333333333';
update public.perfiles set rol = 'repartidor', activo = true where id = '44444444-4444-4444-4444-444444444444';

create temp table ref as
select
  (select id from public.unidades_medida where codigo = 'kg')    as kg,
  (select id from public.unidades_medida where codigo = 'saco')  as saco,
  (select id from public.unidades_medida where codigo = 'bolsa') as bolsa,
  (select id from public.unidades_medida where codigo = 'g')     as g,
  (select id from public.insumos where nombre = 'Harina')        as harina,
  (select id from public.proveedores where nombre = 'Comercial FOX') as proveedor;
create temp table t (clave text primary key, valor uuid);
grant all on ref, t to authenticated;

select has_function('public', 'guardar_insumo', array['jsonb', 'jsonb'], 'existe guardar_insumo');
select has_view('public', 'existencias_insumo', 'existe la vista de existencias');

set local role authenticated;
set local request.jwt.claims = '{"sub": "33333333-3333-3333-3333-333333333333", "rol": "ingeniero"}';

insert into t select 'coco', public.guardar_insumo(
  jsonb_build_object('nombre', 'Coco rallado 0035', 'unidad_base_id', (select kg from ref),
                     'presentacion', 'Bolsa de 5 kg', 'stock_minimo', '10', 'es_perecible', true,
                     'proveedor_habitual_id', (select proveedor from ref)),
  jsonb_build_array(
    jsonb_build_object('unidad_desde_id', (select bolsa from ref), 'factor', '5'),
    jsonb_build_object('unidad_desde_id', (select g from ref),     'factor', '0.001'))
);

select is(
  (select count(*)::int from public.equivalencias where insumo_id = (select valor from t where clave = 'coco')),
  2, 'crea el insumo con sus dos equivalencias'
);
select is(
  (select stock_minimo from public.insumos where id = (select valor from t where clave = 'coco')),
  10.0::numeric(14,4), 'el mínimo llega exacto'
);

select lives_ok($$
  select public.guardar_insumo(
    jsonb_build_object('id', (select valor from t where clave = 'coco'), 'nombre', 'Coco rallado 0035',
                       'unidad_base_id', (select kg from ref), 'presentacion', 'Bolsa de 6 kg',
                       'stock_minimo', '12', 'es_perecible', true),
    jsonb_build_array(jsonb_build_object('unidad_desde_id', (select bolsa from ref), 'factor', '6')))
$$, 'se edita');
select is(
  (select factor from public.equivalencias
    where insumo_id = (select valor from t where clave = 'coco') and unidad_desde = (select bolsa from ref)),
  6.0::numeric(14,6), 'el factor cambia'
);
select is(
  (select count(*)::int from public.equivalencias where insumo_id = (select valor from t where clave = 'coco')),
  1, 'y la equivalencia que no vino se quita'
);
select is(
  (select proveedor_habitual_id from public.insumos where id = (select valor from t where clave = 'coco')),
  null::uuid, 'un campo que no viene queda vacío, no con el valor anterior'
);
select throws_ok($$
  select public.guardar_insumo(
    jsonb_build_object('nombre', 'Otro 0035', 'unidad_base_id', (select kg from ref), 'stock_minimo', '0'),
    jsonb_build_array(jsonb_build_object('unidad_desde_id', (select kg from ref), 'factor', '1')))
$$, '23514', null, 'la unidad base no lleva equivalencia consigo misma');

-- La vista
select is(
  (select cantidad_base from public.existencias_insumo where id = (select valor from t where clave = 'coco')),
  0::numeric, 'un insumo sin movimientos tiene 0'
);
select is(
  (select bajo_minimo from public.existencias_insumo where id = (select valor from t where clave = 'coco')),
  true, 'y está bajo el mínimo'
);
reset role;

insert into public.lotes_insumo (id, insumo_id, codigo, fecha_vencimiento)
values ('aaaa3535-0000-0000-0000-000000000001', (select valor from t where clave = 'coco'), 'L1',
        (now() at time zone 'America/Lima')::date + 5);
insert into public.movimientos_insumo (tipo, insumo_id, lote_id, cantidad, unidad_id, responsable_id, proveedor_id, documento_tipo)
select 'ingreso', (select valor from t where clave = 'coco'), 'aaaa3535-0000-0000-0000-000000000001', 3,
       bolsa, '33333333-3333-3333-3333-333333333333', proveedor, 'boleta' from ref;

select is(
  (select por_vencer from public.existencias_insumo where id = (select valor from t where clave = 'coco')),
  true, 'un lote con existencia que vence en 5 días lo marca por vencer'
);

set local role authenticated;
set local request.jwt.claims = '{"sub": "44444444-4444-4444-4444-444444444444", "rol": "repartidor"}';
select is((select count(*)::int from public.existencias_insumo), 0, 'el repartidor no ve existencias');
select throws_ok($$
  select public.guardar_insumo(
    jsonb_build_object('nombre', 'Intruso 0035', 'unidad_base_id', (select kg from ref), 'stock_minimo', '0'),
    '[]'::jsonb)
$$, '42501', null, 'ni guarda insumos');
reset role;

select * from finish();
rollback;
