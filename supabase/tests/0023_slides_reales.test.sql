-- Verifica los slides reales de portada (0023).
--
-- Lo que se juega: que la portada tenga hero desde el primer día en producción,
-- donde no hay semillas. Si esto falla, el visitante entra a la variante sin
-- foto sin que nadie se entere.
begin;
select plan(6);

select is(
  (select count(*)::int from public.slides where not es_demo and deleted_at is null),
  3,
  'hay tres slides reales'
);

select is(
  (select count(*)::int from public.slides_publicos),
  3,
  'y la vista pública los publica, que es lo que lee el sitio'
);

-- Los de ejemplo repetían estas mismas fotos: dos juegos a la vez dejaban la
-- portada enseñando la fachada dos veces.
select is(
  (select count(*)::int from public.slides where es_demo and deleted_at is null),
  0,
  'los de ejemplo quedaron retirados'
);

-- La ruta va relativa al bucket. Una URL entera ataría la fila a este proyecto
-- de Supabase y bastaría cambiar de proyecto para romper las tres imágenes.
select ok(
  (select bool_and(imagen_url not like 'http%')
     from public.slides where not es_demo and deleted_at is null),
  'las imágenes son rutas del bucket, no URLs absolutas'
);

-- El número de teléfono vive en `configuracion_sitio`. Copiado dentro de un
-- slide se quedaría viejo el día que cambie, sin que nadie sepa dónde mirar.
select ok(
  (select bool_and(enlace_url not like '%wa.me%')
     from public.slides where not es_demo and deleted_at is null),
  'ningún slide lleva el teléfono escrito a mano'
);

-- El encuadre de la fachada no es decorativo: centrada, el recorte panorámico
-- se come el rótulo del negocio (crítica del 11/09, migración 0020).
select is(
  (select enfoque from public.slides where imagen_url = 'fachada1.webp' and not es_demo),
  30::smallint,
  'la fachada conserva su encuadre alto'
);

select * from finish();
rollback;
