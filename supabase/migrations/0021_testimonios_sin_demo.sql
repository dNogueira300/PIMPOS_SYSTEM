-- =============================================================================
-- 0021_testimonios_sin_demo.sql
-- Los testimonios de ejemplo dejan de llegar al sitio publico.
--
-- La critica de diseno del 12/09/2026 lo marco como P0: la portada mostraba
-- «Texto de ejemplo para maquetar el bloque de testimonios», firmado «Cliente de
-- ejemplo 1, Iquitos». El unico bloque cuya funcion es dar confianza hacia lo
-- contrario: quien lo leia concluia que la pagina estaba sin terminar.
--
-- Hoy en produccion no se ven, porque `02_demo.sql` no se carga alli, pero eso
-- era suerte, no una defensa: la vista exponia `es_demo` y no filtraba por el,
-- asi que cualquier fila de ejemplo que llegue a produccion se publica sola.
--
-- Por que aqui si y en `slides_publicos` no: un testimonio inventado con nombre
-- de persona es una resena falsa en cuanto alguien lo publica sin mirar (lo dice
-- la propia semilla, 02_demo.sql). Un slide de ejemplo usa las fotos reales del
-- local y solo sirve para que la maqueta tenga bloques del largo correcto: no
-- afirma nada que no sea cierto.
--
-- La columna `es_demo` se queda en la vista: el panel (F4) la necesita para
-- distinguir lo de ejemplo, y quitarla obligaria a un `drop view`.
-- =============================================================================
create or replace view public.testimonios_publicos
with (security_invoker = true) as
select
  t.id,
  t.nombre,
  t.texto,
  t.procedencia,
  t.orden,
  t.es_demo
from public.testimonios t
where t.estado = 'publicado'
  and t.deleted_at is null
  and not t.es_demo;

comment on view public.testimonios_publicos is
  'Testimonios aprobados para el sitio publico. Los de ejemplo (es_demo) no salen: uno inventado con nombre de persona es una resena falsa.';
