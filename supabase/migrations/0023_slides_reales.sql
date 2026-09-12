-- =============================================================================
-- 0023_slides_reales.sql
-- Los tres slides de portada, de verdad y en producción.
--
-- Hasta ahora los únicos slides eran los de `02_demo.sql`, que **nunca llega a
-- producción**: allí la tabla estaba vacía y la portada caía en su variante sin
-- foto (el titular sobre el azul de marca). Funcionaba, pero el negocio pierde
-- justo lo que mejor tiene: las fotos de su local.
--
-- Van como migración y no como semilla porque producción no carga semillas: es
-- contenido inicial versionado, igual que los textos de 0018 y 0019. El panel
-- (F4) los podrá editar; a partir de ese momento, esta migración ya no vuelve a
-- tocar nada (ver el `where not exists`).
--
-- Las fotos ya están en el bucket `slides` de producción, subidas el
-- 12/09/2026 y comprobadas sirviéndose. La ruta va relativa al bucket, nunca la
-- URL entera: guardar el dominio ataría cada fila a este proyecto de Supabase.
-- =============================================================================

-- La carga inicial no la hizo una persona, así que no se audita — mismo criterio
-- que las de 0008 y 0010.
alter table public.slides disable trigger auditar_slides;

-- Solo si el negocio no tiene ya slides propios. Si alguien cargó los suyos
-- desde el panel, esta migración no pisa su trabajo.
insert into public.slides
  (titulo, subtitulo, imagen_url, imagen_alt, enlace_url, texto_boton, orden, estado, es_demo, enfoque)
select * from (values
  -- `enfoque = 30`: la fachada es vertical y el carrusel de escritorio es
  -- panorámico; centrada, el recorte se come el rótulo «PANADERÍA PIMPO'S»
  -- (es lo que midió la crítica del 11/09 y resolvió la migración 0020).
  ('Pan fresco todos los días',
   'Horneado desde las 4 de la mañana en Iquitos, desde S/ 0.10',
   'fachada1.webp', 'Fachada de Panadería Pimpo''s',
   '/productos', 'Ver el catálogo',
   1::smallint, 'publicado'::app.estado_publicacion, false, 30::smallint),

  -- Enlaza a /contacto y no a un `wa.me` escrito aquí: el número vive en
  -- `configuracion_sitio` y el sitio arma el enlace con el mensaje ya escrito.
  -- Un teléfono copiado dentro de una fila se queda viejo el día que cambie, y
  -- nadie sabría que hay que corregirlo en dos sitios.
  ('Llevamos tu pedido a tu casa',
   'Delivery propio en Iquitos, Belén, Punchana y San Juan Bautista',
   'atencion1.webp', 'Atención a un cliente en el mostrador',
   '/contacto', 'Cómo pedir',
   2::smallint, 'publicado'::app.estado_publicacion, false, 50::smallint),

  ('22 años horneando en el mismo barrio',
   'Del horno al mostrador, todos los días',
   'horno1.webp', 'Horno de la panadería durante la producción',
   '/nosotros', 'Conocer la panadería',
   3::smallint, 'publicado'::app.estado_publicacion, false, 50::smallint)
) as nuevos(titulo, subtitulo, imagen_url, imagen_alt, enlace_url, texto_boton, orden, estado, es_demo, enfoque)
where not exists (
  select 1 from public.slides
  where not es_demo and deleted_at is null
);

-- Los de ejemplo ya no hacen falta: existían para maquetar mientras no había
-- reales, y dejarían la portada enseñando las mismas tres fotos repetidas.
-- Borrado lógico, que es como se retira todo en este esquema.
--
-- Esto alcanza a una base que YA tenga los de ejemplo cargados. En un
-- `db reset` no hace nada, y no por error: el reset aplica las migraciones
-- **antes** que las semillas, así que en este punto los de ejemplo todavía no
-- existen. Por eso, además, `02_demo.sql` dejó de cargarlos.
--
-- En producción no afecta a nada: allí `02_demo.sql` nunca se cargó.
update public.slides
   set deleted_at = now()
 where es_demo
   and deleted_at is null;

alter table public.slides enable trigger auditar_slides;

comment on table public.slides is
  'Diapositivas de la portada (R2). Las tres iniciales las carga la migración 0023; el panel las edita desde F4.';
