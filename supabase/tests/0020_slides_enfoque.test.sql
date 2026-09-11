-- Verifica el encuadre de las diapositivas (0020).
--
-- Un valor fuera de rango no rompería la página, pero dejaría la foto
-- encuadrada donde nadie la pidió: se rechaza al guardarlo, que es cuando
-- quien lo escribe puede corregirlo.
begin;
select plan(7);

select has_column('public', 'slides', 'enfoque', 'las diapositivas tienen encuadre');
select col_not_null('public', 'slides', 'enfoque', 'nunca vacío');
select col_default_is('public', 'slides', 'enfoque', '50', 'y por defecto, centrado: como estaba antes');

select throws_ok(
  $$ update public.slides set enfoque = 101 $$,
  '23514', null,
  'no admite un encuadre por debajo del borde'
);

select lives_ok(
  $$ update public.slides set enfoque = 0 $$,
  'arriba del todo sí es un encuadre válido'
);

-- La vista pública es la que lee el sitio: sin la columna, el dato no llega.
select has_column('public', 'slides_publicos', 'enfoque', 'la vista pública lo expone');

-- Al ampliar una vista es fácil perder la opción que la hace respetar la RLS.
select ok(
  (select coalesce(reloptions::text, '') like '%security_invoker=true%'
     from pg_class where oid = 'public.slides_publicos'::regclass),
  'y la vista sigue con security_invoker'
);

select * from finish();
rollback;
