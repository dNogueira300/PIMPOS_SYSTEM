-- Verifica que ningún slide publicado cuenta años (0025).
--
-- La prueba no mira el titular concreto sino la **regla**: ningún texto que se
-- publique puede llevar una cuenta de años escrita. 0024 la sacó del código y
-- se dejó una dentro de la base, en el tercer slide; esto es lo que impide que
-- vuelva a colarse por ahí, y da igual si el número es 22 o 31.
--
-- Un año suelto («desde 2004») sí se admite, y es justo la salida: dice lo
-- mismo y no caduca.
begin;
select plan(4);

select is(
  (select titulo from public.slides where orden = 3 and not es_demo and deleted_at is null),
  'Horneando en el mismo barrio desde 2004',
  'el tercer slide dice el año de apertura, no cuántos años van'
);

-- La regla, no el caso. Cualquier "NN años" en un titular o subtitulo publicado.
select is(
  (select count(*)::int from public.slides
    where estado = 'publicado' and deleted_at is null
      and (titulo ~* '[0-9]+\s*años' or coalesce(subtitulo, '') ~* '[0-9]+\s*años')),
  0,
  'ningún slide publicado lleva una cuenta de años escrita'
);

select is(
  (select count(*)::int from public.configuracion_sitio
    where es_publico and valor #>> '{}' ~* '\m[0-9]{1,2}\s*años\M'),
  0,
  'ningún texto publicable de la configuración lleva una cuenta de años'
);

-- Y que el slide siga publicándose: corregir el texto no debe esconderlo.
select is(
  (select count(*)::int from public.slides_publicos
    where titulo = 'Horneando en el mismo barrio desde 2004'),
  1,
  'y sigue saliendo en la portada'
);

select * from finish();
rollback;
