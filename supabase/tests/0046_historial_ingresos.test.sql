-- Verifica las fechas de los ingresos (0046): `existencias_insumo.ultimo_ingreso`
-- y la vista `ingresos_insumo`.
--
-- El caso es el del pedido de Dan: bolsas compradas el 7/10 y otra vez el
-- 10/10. Lo que se defiende: que el último ingreso sea el más reciente, que un
-- ingreso anulado no cuente como el último pero siga en el historial marcado,
-- que el día sea el de Iquitos (una compra a las 11:30 p. m. no pasa al día
-- siguiente), y que el repartidor no vea ningún ingreso.
begin;
select plan(12);

insert into auth.users (id, email, created_at, updated_at) values
  ('22222222-2222-2222-2222-222222222222', 'admin@pimpos.test',   now(), now()),
  ('33333333-3333-3333-3333-333333333333', 'inge@pimpos.test',    now(), now()),
  ('44444444-4444-4444-4444-444444444444', 'reparto@pimpos.test', now(), now());
update public.perfiles set rol = 'administrador', activo = true, nombre_completo = 'Debra Prueba'
 where id = '22222222-2222-2222-2222-222222222222';
update public.perfiles set rol = 'ingeniero', activo = true, nombre_completo = 'Marcos Prueba'
 where id = '33333333-3333-3333-3333-333333333333';
update public.perfiles set rol = 'repartidor', activo = true, nombre_completo = 'Julio Prueba'
 where id = '44444444-4444-4444-4444-444444444444';

-- Un insumo propio, sin compras: el total nunca es de la prueba (las E2E dejan
-- ingresos de las bolsas de la semilla en una base local).
insert into public.insumos (nombre, unidad_base_id, presentacion, stock_minimo, es_perecible)
select 'Bolsa de prueba 0046', id, 'Paquete de 20 unidades', 0, false
  from public.unidades_medida where codigo = 'unidad';

create temp table ref as
select
  (select id from public.insumos where nombre = 'Bolsa de prueba 0046')  as bolsa,
  (select id from public.unidades_medida where codigo = 'unidad')        as unidad,
  (select id from public.proveedores where nombre = 'La Casa Plast')     as plast;
create temp table t (clave text primary key, valor uuid);
grant select on ref to authenticated;
grant all on t to authenticated;

select has_column('public', 'existencias_insumo', 'ultimo_ingreso', 'existencias trae la fecha del último ingreso');
select has_view('public', 'ingresos_insumo', 'existe el historial de ingresos');

select is(
  (select ultimo_ingreso from public.existencias_insumo where id = (select bolsa from ref)),
  null, 'un insumo que nunca entró no tiene último ingreso'
);

-- ---------------------------------------------------------------------------
-- Dos compras: el 7/10 por la mañana y el 10/10 a las 11:30 p. m.
-- ---------------------------------------------------------------------------
set local role authenticated;
set local request.jwt.claims = '{"sub": "33333333-3333-3333-3333-333333333333", "rol": "ingeniero"}';

select public.registrar_ingreso(
  jsonb_build_object('proveedor_id', (select plast from ref), 'documento_tipo', 'boleta',
                     'documento_numero', 'B046-1', 'ocurrido_en', '2026-10-07T09:00:00-05:00'),
  jsonb_build_array(jsonb_build_object('insumo_id', (select bolsa from ref), 'cantidad', '40',
                                       'unidad_id', (select unidad from ref))));
select public.registrar_ingreso(
  jsonb_build_object('proveedor_id', (select plast from ref), 'documento_tipo', 'boleta',
                     'documento_numero', 'B046-2', 'ocurrido_en', '2026-10-10T23:30:00-05:00'),
  jsonb_build_array(jsonb_build_object('insumo_id', (select bolsa from ref), 'cantidad', '20',
                                       'unidad_id', (select unidad from ref))));

select is(
  (select ultimo_ingreso from public.existencias_insumo where id = (select bolsa from ref)),
  '2026-10-10T23:30:00-05:00'::timestamptz, 'el último ingreso es la compra del 10/10'
);
select results_eq(
  $$ select dia, documento_numero, proveedor, responsable, anulado
       from public.ingresos_insumo where insumo_id = (select bolsa from ref)
      order by ocurrido_en $$,
  $$ values ('2026-10-07'::date, 'B046-1'::text, 'La Casa Plast'::text, 'Marcos Prueba'::text, false),
            ('2026-10-10'::date, 'B046-2'::text, 'La Casa Plast'::text, 'Marcos Prueba'::text, false) $$,
  'el historial trae las dos compras, con su día de Iquitos, proveedor y quién las registró'
);
select is(
  (select count(*)::integer from public.ingresos_insumo
    where insumo_id = (select bolsa from ref) and dia between '2026-10-08' and '2026-10-31'),
  1, 'filtrar por periodo deja solo la del 10/10'
);
select is(
  (select insumo from public.ingresos_insumo where documento_numero = 'B046-1'),
  'Bolsa de prueba 0046', 'cada ingreso dice de qué insumo es'
);

-- ---------------------------------------------------------------------------
-- Anular la del 10/10: deja de ser el último ingreso, pero sigue en el historial
-- ---------------------------------------------------------------------------
set local request.jwt.claims = '{"sub": "22222222-2222-2222-2222-222222222222", "rol": "administrador"}';
insert into t select 'segunda', id from public.ingresos_insumo where documento_numero = 'B046-2';
select public.anular_movimiento((select valor from t where clave = 'segunda'), 'Boleta repetida');

select is(
  (select ultimo_ingreso from public.existencias_insumo where id = (select bolsa from ref)),
  '2026-10-07T09:00:00-05:00'::timestamptz, 'un ingreso anulado no cuenta como el último'
);
select is(
  (select anulado from public.ingresos_insumo where documento_numero = 'B046-2'),
  true, 'pero sigue en el historial, marcado como anulado'
);
select is(
  (select count(*)::integer from public.ingresos_insumo where insumo_id = (select bolsa from ref)),
  2, 'la anulación no aparece como un ingreso más'
);

-- ---------------------------------------------------------------------------
-- El repartidor no ve insumos
-- ---------------------------------------------------------------------------
set local request.jwt.claims = '{"sub": "44444444-4444-4444-4444-444444444444", "rol": "repartidor"}';
select is(
  (select count(*)::integer from public.ingresos_insumo),
  0, 'el repartidor no ve ningún ingreso'
);
select is(
  (select count(*)::integer from public.existencias_insumo),
  0, 'ni las existencias'
);

select * from finish();
rollback;
