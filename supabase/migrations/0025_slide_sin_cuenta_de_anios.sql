-- El tercer slide contaba los años, y esa cuenta envejece sola.
--
-- 0024 quitó «22 años» del código, pero se quedó uno dentro de la base: el
-- titular del tercer slide, que 0023 sembró como «22 años horneando en el mismo
-- barrio». Se vio en producción, no leyendo el SQL — la portada desplegada
-- seguía diciendo 22 mientras el resto de la página ya calculaba la cuenta.
--
-- Aquí no sirve calcularla: un slide es contenido que el negocio edita desde el
-- panel, y su titular es texto libre. Lo que sí se puede es **decir el año en
-- vez de la cuenta**. «Desde 2004» es igual de concreto, dice lo mismo —que el
-- negocio lleva mucho— y no caduca nunca.
--
-- Solo se reescribe si sigue siendo el de 0023: si el negocio ya lo cambió,
-- manda lo suyo. Sin auditar, como las demás correcciones de texto de fábrica
-- (0018, 0019, 0024): no es un cambio que hiciera una persona.

alter table public.slides disable trigger auditar_slides;

update public.slides
   set titulo = 'Horneando en el mismo barrio desde 2004'
 where titulo = '22 años horneando en el mismo barrio'
   and not es_demo
   and deleted_at is null;

alter table public.slides enable trigger auditar_slides;
