-- Verifica el año de fundación (0024).
--
-- Existe para que la cuenta de años deje de estar escrita a mano. Lo que esta
-- prueba defiende no es el número 2004 —eso no cambia— sino las dos cosas que
-- lo harían inútil: que el sitio no pudiera leerlo sin sesión, y que alguien
-- pudiera guardar ahí un texto. Un '"2004"' entre comillas pasa el `not null`
-- pero rompe la validación de Zod del sitio, y esa se valida entera: la página
-- se quedaría sin teléfono, sin dirección y sin horario a la vez.
begin;
select plan(7);

-- =============================================================================
-- Carga inicial y lectura pública
-- =============================================================================
select is(
  (select valor from public.configuracion_sitio where clave = 'anio_fundacion'),
  '2004'::jsonb,
  'el año de apertura cargado es 2004, el de la ficha'
);

select is(
  (select grupo from public.configuracion_sitio where clave = 'anio_fundacion'),
  'marca',
  'vive en el grupo marca, junto al nombre y el eslogan'
);

select ok(
  (select es_publico from public.configuracion_sitio where clave = 'anio_fundacion'),
  'es publico: sin eso la portada no puede calcular los años'
);

-- La vista es lo que de verdad consulta el sitio, y no la tabla.
select is(
  (select (valores->>'anio_fundacion')::int from public.configuracion_publica),
  2004,
  'llega a la vista publica como numero, que es lo que espera Zod'
);

-- No es un dato provisional: no debe salir en la lista de lo que falta confirmar.
select ok(
  (select descripcion not like '%PENDIENTE%'
     from public.configuracion_sitio where clave = 'anio_fundacion'),
  'no va marcado como PENDIENTE: 2004 es un dato de la ficha, no inventado'
);

-- =============================================================================
-- La forma, comprobada en la base y no solo en el formulario
-- =============================================================================
select throws_ok(
  $$ update public.configuracion_sitio set valor = '"2004"'::jsonb
      where clave = 'anio_fundacion' $$,
  '23514',
  null,
  'un año escrito como texto se rechaza al guardarlo, no en la pagina'
);

select throws_ok(
  $$ update public.configuracion_sitio set valor = '1800'::jsonb
      where clave = 'anio_fundacion' $$,
  '23514',
  null,
  'un año fuera de rango tampoco entra'
);

select * from finish();
rollback;
