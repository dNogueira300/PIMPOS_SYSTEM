-- Verifica que la vista pública lista las presentaciones (0022).
--
-- Lo que se juega aquí: un producto con dos precios que se pide a ciegas. Si la
-- columna llega vacía, la ficha vuelve a decir «2 presentaciones» sin decir
-- cuáles; si trae de más, ofrece algo que no se vende.
begin;
select plan(7);

select has_column(
  'public', 'productos_publicos', 'presentaciones',
  'la vista pública manda las presentaciones'
);

-- Al reemplazar una vista es fácil perder la opción que la hace respetar la RLS
-- y el `where` de publicado. Sin ellos deja de significar lo mismo para todos.
select ok(
  (select coalesce(reloptions::text, '') like '%security_invoker=true%'
     from pg_class where oid = 'public.productos_publicos'::regclass),
  'y sigue con security_invoker'
);

select is(
  (select count(*)::int from public.productos_publicos where slug = 'hamburguesa-grande'),
  1,
  'el producto de dos precios sigue publicándose'
);

select is(
  (select jsonb_array_length(presentaciones)
     from public.productos_publicos where slug = 'hamburguesa-grande'),
  2,
  'con sus dos presentaciones, no solo la predeterminada'
);

-- El precio es lo que distingue hoy una de otra, así que tiene que viajar.
select is(
  (select presentaciones -> 0 ->> 'precio'
     from public.productos_publicos where slug = 'hamburguesa-grande'),
  '0.3000',
  'la primera es la predeterminada, con su precio'
);

-- Un pan de un solo precio no gana una lista vacía ni un NULL: quien la recorre
-- no debería tener que preguntar antes si existe.
select is(
  (select jsonb_array_length(presentaciones)
     from public.productos_publicos where slug = 'frances-chico'),
  1,
  'un producto de una sola presentación trae una, no ninguna'
);

-- Una variante retirada no se vende. La vista ya lo hacía para el rango de
-- precios; la lista nueva tiene que usar el mismo filtro o acabará ofreciendo
-- algo que el negocio dio de baja.
insert into public.producto_variantes (producto_id, nombre, precio, activo)
select id, 'Retirada', 9.99, false from public.productos where slug = 'frances-chico';

select is(
  (select jsonb_array_length(presentaciones)
     from public.productos_publicos where slug = 'frances-chico'),
  1,
  'y una variante inactiva no aparece'
);

select * from finish();
rollback;
