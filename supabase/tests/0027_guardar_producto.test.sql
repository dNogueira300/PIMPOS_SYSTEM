-- Verifica guardar_producto (0027).
--
-- Lo que se defiende: que un producto y sus presentaciones entren juntos o no
-- entren; que quitar una presentación la retire sin borrar su historial de
-- precios; que siempre haya exactamente una predeterminada; y que la función
-- no abra una puerta que la RLS tenía cerrada.
begin;
select plan(12);

insert into auth.users (id, email, created_at, updated_at) values
  ('33333333-3333-3333-3333-333333333333', 'inge@pimpos.test',    now(), now()),
  ('44444444-4444-4444-4444-444444444444', 'reparto@pimpos.test', now(), now());
update public.perfiles set rol = 'ingeniero',  activo = true where id = '33333333-3333-3333-3333-333333333333';
update public.perfiles set rol = 'repartidor', activo = true where id = '44444444-4444-4444-4444-444444444444';

select has_function('public', 'guardar_producto', array['jsonb', 'jsonb'], 'existe guardar_producto');

create temp table t (clave text primary key, valor uuid);
grant all on t to authenticated, anon;
insert into t select 'categoria', id from public.categorias_producto where deleted_at is null limit 1;

set local role authenticated;
set local request.jwt.claims = '{"sub": "33333333-3333-3333-3333-333333333333", "rol": "ingeniero"}';

insert into t select 'producto', public.guardar_producto(
  jsonb_build_object('categoria_id', (select valor from t where clave = 'categoria'),
                     'nombre', 'Pan de prueba 0027', 'slug', 'pan-de-prueba-0027',
                     'descripcion', '', 'destacado', false, 'estado', 'publicado'),
  '[{"nombre": "Unidad", "precio": "0.30", "unidad_venta": "unidad"},
    {"nombre": "Docena", "precio": "3.00", "unidad_venta": "docena"}]'::jsonb
);

select is(
  (select count(*)::int from public.producto_variantes
    where producto_id = (select valor from t where clave = 'producto') and deleted_at is null),
  2, 'crea el producto con sus dos presentaciones'
);
select is(
  (select nombre from public.producto_variantes
    where producto_id = (select valor from t where clave = 'producto') and es_predeterminada),
  'Unidad', 'la primera de la lista es la predeterminada'
);
select is(
  (select precio from public.producto_variantes
    where producto_id = (select valor from t where clave = 'producto') and nombre = 'Unidad'),
  0.30::numeric(12,4), 'el precio llega exacto, sin pasar por coma flotante'
);

insert into t select 'unidad', id from public.producto_variantes
 where producto_id = (select valor from t where clave = 'producto') and nombre = 'Unidad';

-- Editar: sube el precio de Unidad, quita Docena, añade Bolsa y la pone primera.
-- Dentro de lives_ok: un `select` suelto imprimiría una fila que no es TAP.
select lives_ok($$
  select public.guardar_producto(
    jsonb_build_object('id', (select valor from t where clave = 'producto'),
                       'categoria_id', (select valor from t where clave = 'categoria'),
                       'nombre', 'Pan de prueba 0027', 'descripcion', 'Editado',
                       'destacado', true, 'estado', 'publicado'),
    jsonb_build_array(
      jsonb_build_object('nombre', 'Bolsa', 'precio', '2.50', 'unidad_venta', 'bolsa'),
      jsonb_build_object('id', (select valor from t where clave = 'unidad'),
                         'nombre', 'Unidad', 'precio', '0.40', 'unidad_venta', 'unidad')
    )
  )
$$, 'editar un producto con sus presentaciones funciona');

select is(
  (select array_agg(nombre order by orden) from public.producto_variantes
    where producto_id = (select valor from t where clave = 'producto') and deleted_at is null),
  array['Bolsa', 'Unidad'], 'quedan las dos de la lista, en su orden'
);
select ok(
  (select deleted_at is not null and not activo from public.producto_variantes
    where producto_id = (select valor from t where clave = 'producto') and nombre = 'Docena'),
  'la que no vino en la lista se retira con borrado lógico, no se borra'
);
select is(
  (select count(*)::int from public.producto_variantes
    where producto_id = (select valor from t where clave = 'producto')
      and es_predeterminada and deleted_at is null),
  1, 'sigue habiendo una sola predeterminada'
);
select is(
  (select array_agg(precio order by id) from public.precio_historial
    where variante_id = (select valor from t where clave = 'unidad')),
  array[0.30, 0.40]::numeric(12,4)[], 'el cambio de precio queda en el historial'
);
select is(
  (select slug from public.productos where id = (select valor from t where clave = 'producto')),
  'pan-de-prueba-0027', 'editar no cambia la dirección del producto'
);

select throws_ok(
  $$ select public.guardar_producto(
       jsonb_build_object('categoria_id', (select valor from t where clave = 'categoria'),
                          'nombre', 'Sin precio', 'slug', 'sin-precio-0027', 'estado', 'borrador'),
       '[]'::jsonb) $$,
  'P0001', 'Un producto necesita al menos una presentación con su precio.',
  'sin presentaciones no se guarda nada'
);

set local request.jwt.claims = '{"sub": "44444444-4444-4444-4444-444444444444", "rol": "repartidor"}';
select throws_ok(
  $$ select public.guardar_producto(
       jsonb_build_object('categoria_id', (select valor from t where clave = 'categoria'),
                          'nombre', 'Del repartidor', 'slug', 'del-repartidor-0027', 'estado', 'borrador'),
       '[{"nombre": "Unidad", "precio": "1.00", "unidad_venta": "unidad"}]'::jsonb) $$,
  '42501', null,
  'la función no salta la RLS: el repartidor no crea productos'
);

select * from finish();
rollback;
