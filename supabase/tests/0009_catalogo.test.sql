-- Verifica el catalogo (0009).
--
-- Cubre dos de las nueve pruebas obligatorias del doc 02 §11.3: que un anonimo
-- no vea productos en borrador, y que un repartidor no pueda modificarlos.
begin;
select plan(33);

-- =============================================================================
-- Fixtures
-- =============================================================================
insert into auth.users (id, email, created_at, updated_at) values
  ('11111111-1111-1111-1111-111111111111', 'super@pimpos.test',   now(), now()),
  ('33333333-3333-3333-3333-333333333333', 'inge@pimpos.test',    now(), now()),
  ('44444444-4444-4444-4444-444444444444', 'reparto@pimpos.test', now(), now());

update public.perfiles set rol = 'superadmin', activo = true where id = '11111111-1111-1111-1111-111111111111';
update public.perfiles set rol = 'ingeniero',  activo = true where id = '33333333-3333-3333-3333-333333333333';
update public.perfiles set rol = 'repartidor', activo = true where id = '44444444-4444-4444-4444-444444444444';

-- Un producto publicado y otro en borrador, en la misma categoria.
insert into public.productos (id, categoria_id, nombre, slug, estado, destacado) values
  ('aaaa0000-0000-0000-0000-000000000001',
   (select id from public.categorias_producto where slug = 'panes-clasicos'),
   'Pan francés chico', 'pan-frances-chico', 'publicado', true),
  ('aaaa0000-0000-0000-0000-000000000002',
   (select id from public.categorias_producto where slug = 'panes-clasicos'),
   'Producto sin terminar', 'producto-sin-terminar', 'borrador', false);

insert into public.producto_variantes (id, producto_id, nombre, precio, es_predeterminada) values
  ('bbbb0000-0000-0000-0000-000000000001', 'aaaa0000-0000-0000-0000-000000000001', 'Unidad', 0.10, true),
  ('bbbb0000-0000-0000-0000-000000000002', 'aaaa0000-0000-0000-0000-000000000002', 'Unidad', 9.99, true);

-- Las aserciones se acotan a estos ids. Contar la tabla entera haria que la
-- prueba dependiera de que este vacia, y la semilla carga el catalogo real:
-- 34 productos. Es el mismo error que ya rompio la prueba de perfiles.
create temp table fixture (id uuid primary key);
insert into fixture values
  ('aaaa0000-0000-0000-0000-000000000001'),
  ('aaaa0000-0000-0000-0000-000000000002');
grant select on fixture to anon, authenticated;

-- =============================================================================
-- Estructura
-- =============================================================================
select has_table('public', 'categorias_producto', 'existe categorias_producto');
select has_table('public', 'productos', 'existe productos');
select has_table('public', 'producto_variantes', 'existe producto_variantes');
select has_table('public', 'producto_imagenes', 'existe producto_imagenes');
select has_table('public', 'precio_historial', 'existe precio_historial');

select is(
  (select count(*)::int from public.categorias_producto), 6,
  'la migracion deja las 6 categorias de la ficha 6.1'
);

-- El dinero es numeric exacto, no float: hay productos a S/ 0.10 y un
-- redondeo binario ahi es inaceptable.
select col_type_is('public', 'producto_variantes', 'precio', 'numeric(12,4)',
  'el precio es numeric(12,4), no float');

select is(
  (select precio from public.producto_variantes
    where id = 'bbbb0000-0000-0000-0000-000000000001'),
  0.10::numeric(12,4),
  'y guarda S/ 0.10 exacto'
);

-- =============================================================================
-- El precio vive en la variante (R22)
-- =============================================================================
select hasnt_column('public', 'productos', 'precio',
  'el producto NO tiene precio: lo tienen sus variantes');
select has_column('public', 'producto_variantes', 'stock_disponible',
  'la variante ya tiene el hueco de stock previsto para e-commerce');

-- Como mucho una variante predeterminada por producto: dos candidatas darian
-- un resultado arbitrario en la tarjeta del catalogo.
select throws_ok(
  $$ insert into public.producto_variantes (producto_id, nombre, precio, es_predeterminada)
     values ('aaaa0000-0000-0000-0000-000000000001', 'Otra', 0.20, true) $$,
  '23505',
  null,
  'no se pueden tener dos variantes predeterminadas del mismo producto'
);

-- =============================================================================
-- El historial de precios se escribe solo (doc 02 §7.2)
-- =============================================================================
select is(
  (select count(*)::int from public.precio_historial
    where variante_id = 'bbbb0000-0000-0000-0000-000000000001'),
  1,
  'crear una variante registra su precio de partida'
);

update public.producto_variantes set precio = 0.15
 where id = 'bbbb0000-0000-0000-0000-000000000001';

select is(
  (select count(*)::int from public.precio_historial
    where variante_id = 'bbbb0000-0000-0000-0000-000000000001'),
  2,
  'y cada cambio anade otro registro'
);
select is(
  (select precio from public.precio_historial
    where variante_id = 'bbbb0000-0000-0000-0000-000000000001'
    order by id desc limit 1),
  0.15::numeric(12,4),
  'con el precio nuevo'
);

-- Tocar otra cosa no ensucia el historial.
update public.producto_variantes set nombre = 'Unidad suelta'
 where id = 'bbbb0000-0000-0000-0000-000000000001';
select is(
  (select count(*)::int from public.precio_historial
    where variante_id = 'bbbb0000-0000-0000-0000-000000000001'),
  2,
  'cambiar el nombre no registra un precio nuevo'
);

-- =============================================================================
-- Lectura anonima: solo lo publicado (doc 02 §11.3)
-- =============================================================================
set local role anon;

select is(
  (select count(*)::int from public.productos where id in (select id from fixture)), 1,
  'un anonimo NO ve productos en borrador'
);
select is(
  (select nombre from public.productos where id in (select id from fixture)),
  'Pan francés chico',
  'solo ve el publicado'
);

-- La parte que se olvida: si la variante no comprobara el estado de su
-- producto, el precio de algo sin publicar seria consultable por la API
-- aunque el producto no apareciera.
select is(
  (select count(*)::int from public.producto_variantes
    where producto_id in (select id from fixture)), 1,
  'ni las variantes de un producto en borrador'
);
select is(
  (select count(*)::int from public.producto_variantes
    where producto_id = 'aaaa0000-0000-0000-0000-000000000002'),
  0,
  'el precio de un borrador no se filtra por la puerta de atras'
);

select is(
  (select count(*)::int from public.precio_historial), 0,
  'el historial de precios no es publico'
);
select ok(
  (select count(*) from public.categorias_producto) = 6,
  'las categorias publicadas si son publicas'
);

reset role;

-- =============================================================================
-- Un producto borrado deja de verse, pero no desaparece
-- =============================================================================
update public.productos set deleted_at = now()
 where id = 'aaaa0000-0000-0000-0000-000000000001';

set local role anon;
select is(
  (select count(*)::int from public.productos where id in (select id from fixture)), 0,
  'un producto con borrado logico deja de ser publico'
);
reset role;

select is(
  (select count(*)::int from public.productos
    where id = 'aaaa0000-0000-0000-0000-000000000001'),
  1,
  'pero la fila sigue ahi: los movimientos pasados la siguen referenciando'
);

update public.productos set deleted_at = null
 where id = 'aaaa0000-0000-0000-0000-000000000001';

-- =============================================================================
-- Escritura por rol (doc 02 §11)
-- =============================================================================
set local role authenticated;

-- --- Repartidor: no toca el catalogo (doc 02 §11.3) ------------------------
set local request.jwt.claims = '{"sub": "44444444-4444-4444-4444-444444444444", "rol": "repartidor"}';

select is(
  (select count(*)::int from public.productos where id in (select id from fixture)), 2,
  'un repartidor ve el catalogo entero, borradores incluidos, como cualquier autenticado'
);

update public.productos set nombre = 'Robado' where id = 'aaaa0000-0000-0000-0000-000000000001';
select is(
  (select nombre from public.productos where id = 'aaaa0000-0000-0000-0000-000000000001'),
  'Pan francés chico',
  'pero NO puede modificar un producto'
);

select throws_ok(
  $$ insert into public.productos (categoria_id, nombre, slug)
     select id, 'Colado', 'colado' from public.categorias_producto limit 1 $$,
  '42501',
  null,
  'ni crear uno'
);

select is(
  (select count(*)::int from public.precio_historial), 0,
  'ni ve el historial de precios'
);

-- --- Ingeniero: si gestiona el catalogo ------------------------------------
set local request.jwt.claims = '{"sub": "33333333-3333-3333-3333-333333333333", "rol": "ingeniero"}';

select lives_ok(
  $$ update public.productos set nombre = 'Pan francés'
      where id = 'aaaa0000-0000-0000-0000-000000000001' $$,
  'un ingeniero si puede editar un producto'
);
select lives_ok(
  $$ insert into public.productos (categoria_id, nombre, slug)
     select id, 'Producto nuevo', 'producto-nuevo' from public.categorias_producto limit 1 $$,
  'y crear uno'
);
select ok(
  (select count(*) from public.precio_historial) > 0,
  'y consultar el historial de precios'
);

reset role;

-- =============================================================================
-- Un cambio de precio queda auditado y con autor
-- =============================================================================
set local role authenticated;
set local request.jwt.claims = '{"sub": "11111111-1111-1111-1111-111111111111", "rol": "superadmin"}';

update public.producto_variantes set precio = 0.20
 where id = 'bbbb0000-0000-0000-0000-000000000001';

reset role;

select is(
  (select registrado_por from public.precio_historial
    where variante_id = 'bbbb0000-0000-0000-0000-000000000001'
    order by id desc limit 1),
  '11111111-1111-1111-1111-111111111111'::uuid,
  'el historial guarda quien cambio el precio'
);
select ok(
  (select count(*) from app.auditoria
    where tabla = 'public.producto_variantes' and operacion = 'UPDATE') > 0,
  'y el cambio tambien queda en la auditoria'
);

-- El historial no se retoca ni siendo superadmin: es un registro, como la
-- auditoria.
set local role authenticated;
set local request.jwt.claims = '{"sub": "11111111-1111-1111-1111-111111111111", "rol": "superadmin"}';
delete from public.precio_historial;
reset role;

select ok(
  (select count(*) from public.precio_historial) > 0,
  'nadie puede borrar el historial de precios'
);

select * from finish();
rollback;
