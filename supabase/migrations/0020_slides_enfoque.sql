-- =============================================================================
-- 0020_slides_enfoque.sql
-- Cada diapositiva del carrusel dice por qué altura se encuadra su foto.
--
-- En escritorio el carrusel es panorámico (21:9) y las fotos del negocio son
-- verticales: la imagen se recorta, y centrada dejaba fuera el rótulo
-- «PANADERÍA PIMPO'S» de la fachada (crítica de diseño del 11/09/2026). Subir
-- el encuadre al 30 % lo arregla en esa foto, pero en la del horno enseña una
-- franja amarilla del techo: una posición para todas no sirve, cada foto
-- necesita la suya. Por eso es un dato de la diapositiva, que el panel (F4)
-- dejará ajustar, y no un valor escrito en el componente.
--
-- 0 es arriba del todo, 50 el centro y 100 abajo del todo, como el
-- `object-position` vertical de CSS.
-- =============================================================================
alter table public.slides
  add column enfoque smallint not null default 50
  check (enfoque between 0 and 100);

comment on column public.slides.enfoque is
  'Por qué altura se encuadra la foto cuando se recorta: 0 arriba, 50 centro, 100 abajo.';

-- La vista se amplía, no se rehace: `create or replace` solo admite columnas
-- nuevas al final, y conserva los permisos. Se repiten `security_invoker` y el
-- `where` de publicado, que son las dos reglas de toda vista pública (0016).
create or replace view public.slides_publicos
with (security_invoker = true) as
select
  s.id,
  s.titulo,
  s.subtitulo,
  s.imagen_url,
  s.imagen_movil_url,
  s.imagen_alt,
  s.enlace_url,
  s.texto_boton,
  s.orden,
  s.es_demo,
  s.enfoque
from public.slides s
where s.estado = 'publicado'
  and s.deleted_at is null
  and (s.vigencia_inicio is null or s.vigencia_inicio <= now())
  and (s.vigencia_fin    is null or s.vigencia_fin    >= now());
