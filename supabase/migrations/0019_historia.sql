-- =============================================================================
-- 0019_historia.sql
-- La historia del negocio, reescrita en la voz de `docs/marca.md`.
--
-- La de la ficha empezaba "Bienvenidos a Panadería Pimpo's, un negocio
-- tradicional profundamente arraigado en el corazón de Iquitos", que es justo
-- el ejemplo de "no suena así" de la guía de marca: pomposo y vacío. Y su
-- primer párrafo es el que la portada enseña bajo "Veintidós años en el barrio"
-- (crítica de diseño del 11/09/2026). Dan pidió reescribirla (11/09/2026).
--
-- Se conservan los hechos de la ficha, sin añadir ninguno: emprendimiento
-- familiar en la Elías Aguirre, pan fresco hecho y vendido el mismo día, el
-- crecimiento gracias a la clientela, panes especiales e integrales, dulces
-- tradicionales y el reparto con movilidad propia. Se dice "en la Elías
-- Aguirre" porque la ficha la llama avenida y la dirección cargada, calle: está
-- en "Datos por confirmar" del avance.
--
-- Sigue siendo administrable: vive en `configuracion_sitio` (clave `historia`)
-- y el panel de configuración la edita en F4.
--
-- Solo se reescribe si sigue siendo la de 0008, reconocida por su principio y
-- su final: si el negocio ya la cambió, manda lo suyo. Sin auditar, como las
-- cargas de 0008 y 0017: corrige el texto de partida, no es un cambio que
-- alguien hizo.
-- =============================================================================
alter table public.configuracion_sitio disable trigger auditar_configuracion_sitio;

update public.configuracion_sitio
   set valor = '"Pimpo''s empezó como un emprendimiento familiar en la Elías Aguirre, con una idea sencilla: que los vecinos tuvieran pan fresco todos los días, hecho y vendido el mismo día.\n\nCon los años, gracias a quienes volvían por su pan, fuimos creciendo: sumamos panes especiales e integrales, dulces tradicionales y el reparto a domicilio con movilidad propia. Hoy llegamos a varios distritos de la ciudad, y seguimos trabajando como el primer día: con productos frescos, hechos aquí y con el sabor casero de siempre."'::jsonb
 where clave = 'historia'
   and valor #>> '{}' like 'Bienvenidos a Panadería Pimpo''s, un negocio tradicional profundamente arraigado%'
   and valor #>> '{}' like '%¡Gracias por ser parte de nuestra familia!';

alter table public.configuracion_sitio enable trigger auditar_configuracion_sitio;
