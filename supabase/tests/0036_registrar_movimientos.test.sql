-- Verifica registrar_ingreso, registrar_consumo e ingreso_registrado (0036).
--
-- Lo que se defiende: que una boleta de varias líneas entre entera o no entre;
-- que un lote con código repetido se explique; que un consumo que no alcanza
-- no deje a medias las líneas anteriores; que avisar de un documento repetido
-- no cuente los anulados; y que una fecha de vencimiento mandada para un
-- insumo que no vence se ignore (revisión de la tarea 3, hallazgo I-1).
begin;
select plan(19);

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
  (select id from public.insumos where nombre = 'Manteca')           as manteca,
  (select id from public.unidades_medida where codigo = 'saco')      as saco,
  (select id from public.unidades_medida where codigo = 'kg')        as kg,
  (select id from public.unidades_medida where codigo = 'caja')      as caja,
  (select id from public.unidades_medida where codigo = 'botella')   as botella,
  (select id from public.proveedores where nombre = 'Comercial FOX') as fox,
  (select id from public.proveedores where nombre = 'Maíz Center')   as maiz;
grant select on ref to authenticated;

select has_function('public', 'registrar_ingreso', array['jsonb', 'jsonb'], 'existe registrar_ingreso');
select has_function('public', 'registrar_consumo', array['jsonb', 'jsonb'], 'existe registrar_consumo');

set local role authenticated;
set local request.jwt.claims = '{"sub": "33333333-3333-3333-3333-333333333333", "rol": "ingeniero"}';

select is(
  public.registrar_ingreso(
    jsonb_build_object('proveedor_id', (select fox from ref), 'documento_tipo', 'boleta',
                       'documento_numero', 'B001-123', 'observacion', 'Todo en buen estado'),
    jsonb_build_array(
      jsonb_build_object('insumo_id', (select harina from ref), 'cantidad', '2',
                         'unidad_id', (select saco from ref), 'precio_unitario', '150'),
      jsonb_build_object('insumo_id', (select manteca from ref), 'cantidad', '1',
                         'unidad_id', (select caja from ref), 'precio_unitario', '90',
                         'fecha_vencimiento', (current_date + 30)::text, 'codigo_lote', 'M-01'))),
  2, 'una boleta de dos líneas registra dos ingresos'
);
select is(
  (select cantidad_base from public.saldos_insumo where insumo_id = (select harina from ref)),
  100.0::numeric(14,4), 'la harina sube 100 kg'
);
select is(
  (select codigo from public.lotes_insumo l
     join public.saldos_lote s on s.lote_id = l.id
    where l.insumo_id = (select manteca from ref)),
  'M-01', 'la manteca entra en su lote con código y fecha'
);
select is(
  (select responsable_id from public.movimientos_insumo where documento_numero = 'B001-123' limit 1),
  '33333333-3333-3333-3333-333333333333'::uuid, 'a nombre de quien registra'
);

-- Una fecha de vencimiento para un insumo que no vence se ignora: nada de un
-- lote con vencimiento fantasma que dispare una alerta falsa (I-1).
select is(
  public.registrar_ingreso(
    jsonb_build_object('proveedor_id', (select fox from ref), 'documento_tipo', 'boleta',
                       'documento_numero', 'B001-127', 'observacion', 'x'),
    jsonb_build_array(
      jsonb_build_object('insumo_id', (select azucar from ref), 'cantidad', '1',
                         'unidad_id', (select saco from ref), 'precio_unitario', '120',
                         'fecha_vencimiento', (current_date + 10)::text))),
  1, 'un ingreso de un insumo que no vence, con una fecha de vencimiento igual'
);
select is(
  (select l.fecha_vencimiento
     from public.lotes_insumo l
     join public.movimiento_lotes ml on ml.lote_id = l.id
     join public.movimientos_insumo m on m.id = ml.movimiento_id
    where m.documento_numero = 'B001-127'),
  null::date,
  'la fecha se ignora: el insumo no es perecible, su lote no lleva vencimiento'
);

select throws_ok($$
  select public.registrar_ingreso(
    jsonb_build_object('proveedor_id', (select fox from ref), 'documento_tipo', 'boleta',
                       'documento_numero', 'B001-124', 'observacion', 'x'),
    jsonb_build_array(
      jsonb_build_object('insumo_id', (select azucar from ref), 'cantidad', '1',
                         'unidad_id', (select saco from ref), 'precio_unitario', '120'),
      jsonb_build_object('insumo_id', (select harina from ref), 'cantidad', '1',
                         'unidad_id', (select botella from ref), 'precio_unitario', '1')))
$$, 'P0002', null, 'una línea con una unidad sin equivalencia tumba la boleta');
select is(
  (select count(*)::int from public.movimientos_insumo where documento_numero = 'B001-124'),
  0, 'y no queda ninguna línea a medias'
);
select throws_ok($$
  select public.registrar_ingreso(
    jsonb_build_object('proveedor_id', (select fox from ref), 'documento_tipo', 'boleta',
                       'documento_numero', 'B001-125', 'observacion', 'x'),
    jsonb_build_array(
      jsonb_build_object('insumo_id', (select manteca from ref), 'cantidad', '1',
                         'unidad_id', (select caja from ref), 'precio_unitario', '90',
                         'fecha_vencimiento', (current_date + 40)::text, 'codigo_lote', 'm-01')))
$$, 'P0001', 'El lote m-01 de Manteca ya está registrado. Usa otro código o déjalo vacío.',
   'un código de lote repetido se explica (sin distinguir mayúsculas)');
select throws_ok($$
  select public.registrar_ingreso(
    jsonb_build_object('proveedor_id', (select fox from ref), 'documento_tipo', 'boleta',
                       'documento_numero', 'B001-126', 'observacion', 'x',
                       'ocurrido_en', (now() + interval '2 days')::text),
    jsonb_build_array(jsonb_build_object('insumo_id', (select harina from ref), 'cantidad', '1',
                                         'unidad_id', (select kg from ref), 'precio_unitario', '3')))
$$, 'P0001', 'La fecha no puede ser de un día que aún no llega.', 'no se registra en el futuro');

-- El aviso de documento repetido
select ok(public.ingreso_registrado((select fox from ref), ' b001-123 ') is not null,
  'el mismo número del mismo proveedor, con otra forma de escribirlo, se reconoce');
select is(public.ingreso_registrado((select maiz from ref), 'B001-123'), null::timestamptz,
  'el mismo número de otro proveedor no');

-- Consumo
select is(
  public.registrar_consumo(
    jsonb_build_object('origen_consumo', 'produccion', 'destino_lote', 'Pan francés',
                       'area_turno', 'Mañana', 'observacion', 'Primera hornada'),
    jsonb_build_array(
      jsonb_build_object('insumo_id', (select harina from ref), 'cantidad', '40', 'unidad_id', (select kg from ref)),
      jsonb_build_object('insumo_id', (select manteca from ref), 'cantidad', '2', 'unidad_id', (select kg from ref)))),
  2, 'un consumo de dos líneas'
);
select throws_ok($$
  select public.registrar_consumo(
    jsonb_build_object('origen_consumo', 'retiro_directo', 'destino_lote', 'Pan dulce',
                       'area_turno', 'Tarde', 'observacion', 'x'),
    jsonb_build_array(
      jsonb_build_object('insumo_id', (select harina from ref), 'cantidad', '10', 'unidad_id', (select kg from ref)),
      jsonb_build_object('insumo_id', (select manteca from ref), 'cantidad', '50', 'unidad_id', (select kg from ref))))
$$, 'P0001', 'Solo hay 8 kg de Manteca. Si en el almacén hay más, falta registrar un ingreso o hacer un conteo.',
   'si una línea no alcanza, lo dice');
select is(
  (select cantidad_base from public.saldos_insumo where insumo_id = (select harina from ref)),
  60.0::numeric(14,4), 'y la harina de la primera línea no se descontó'
);

set local request.jwt.claims = '{"sub": "44444444-4444-4444-4444-444444444444", "rol": "repartidor"}';
select throws_ok($$
  select public.registrar_consumo(
    jsonb_build_object('origen_consumo', 'produccion', 'destino_lote', 'x', 'area_turno', 'x', 'observacion', 'x'),
    jsonb_build_array(jsonb_build_object('insumo_id', (select harina from ref), 'cantidad', '1', 'unidad_id', (select kg from ref))))
$$, null, null, 'el repartidor no registra consumos');
-- Sin código: el repartidor no ve la harina, así que el trigger BEFORE (que
-- corre antes que la política) ya falla al convertir. Lo que importa es que no
-- entre, y lo comprueba la cuenta de abajo, ya sin el rol del repartidor
-- (con él, la RLS daría cero de todas formas).
reset role;
select is((select count(*)::int from public.movimientos_insumo where destino_lote = 'x'), 0,
  'y no queda nada registrado');

select * from finish();
rollback;
