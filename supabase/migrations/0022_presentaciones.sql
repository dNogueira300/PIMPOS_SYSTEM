-- =============================================================================
-- 0022_presentaciones.sql
-- El catálogo dice cuántas presentaciones hay; ahora dice cuáles.
--
-- P2 de la crítica del 12/09/2026. Dos productos de los treinta y cuatro tienen
-- dos variantes —la hamburguesa grande y la de ajonjolí, a S/ 0.30 y S/ 0.40—, y
-- el cliente no podía saber cuáles son en ningún sitio: la tarjeta decía «2
-- presentaciones», la ficha tampoco las listaba porque la vista no las manda, y
-- el mensaje de WhatsApp omitía la presentación a propósito (nombrar solo la
-- predeterminada haría creer que no hay otra). Resultado: el pedido salía sin
-- decir cuál y la panadería tenía que preguntarlo, que es justo la pregunta que
-- quitamos de en medio al rehacer el bloque de pedido.
--
-- Decisión de Dan (12/09/2026): se listan las dos con su precio y elige el
-- cliente. No se inventa qué las diferencia —los nombres de fábrica son «De
-- S/ 0.30» y «De S/ 0.40», y la semilla lo marca PENDIENTE—: cuando el
-- propietario los corrija desde el panel, esto mejora solo.
--
-- La vista se amplía, no se rehace: `create or replace` solo admite columnas
-- nuevas al final y conserva los permisos. Se repiten `security_invoker` y el
-- `where` de publicado, que son las dos reglas de toda vista pública (0016).
-- =============================================================================
create or replace view public.productos_publicos
with (security_invoker = true) as
select
  p.id,
  p.nombre,
  p.slug,
  p.descripcion,
  p.destacado,
  p.orden,
  p.es_demo,

  c.id     as categoria_id,
  c.nombre as categoria_nombre,
  c.slug   as categoria_slug,
  c.orden  as categoria_orden,

  -- Rango de precios de las variantes que de verdad se venden.
  precios.precio_desde,
  precios.precio_hasta,
  precios.variantes,

  -- La variante que se muestra preseleccionada (ficha 6.2: "bolsa de 10",
  -- "unidad", "docena").
  pred.id           as variante_id,
  pred.nombre       as variante_nombre,
  pred.precio       as variante_precio,
  pred.moneda       as variante_moneda,
  pred.unidad_venta as variante_unidad,

  img.ruta as imagen_ruta,
  img.alt  as imagen_alt,

  -- Todas las presentaciones, en el mismo orden en que las lista el catálogo.
  -- Va como jsonb y no como una vista aparte para que la ficha siga haciendo
  -- UNA consulta: ya trae el producto entero, y una segunda lectura por cada
  -- ficha para dos filas no se paga sola.
  --
  -- `[]` y no NULL cuando no hay ninguna: quien lo recorre no tiene que
  -- preguntar antes si existe.
  presentaciones.lista as presentaciones
from public.productos p

left join public.categorias_producto c
       on c.id = p.categoria_id
      and c.estado = 'publicado'
      and c.deleted_at is null

left join lateral (
  select
    min(v.precio)  as precio_desde,
    max(v.precio)  as precio_hasta,
    count(*)::int  as variantes
  from public.producto_variantes v
  where v.producto_id = p.id
    and v.activo
    and v.deleted_at is null
) precios on true

left join lateral (
  select v.id, v.nombre, v.precio, v.moneda, v.unidad_venta
  from public.producto_variantes v
  where v.producto_id = p.id
    and v.activo
    and v.deleted_at is null
  order by v.es_predeterminada desc, v.orden, v.precio
  limit 1
) pred on true

left join lateral (
  select i.ruta, i.alt
  from public.producto_imagenes i
  where i.producto_id = p.id
  order by i.es_principal desc, i.orden, i.created_at
  limit 1
) img on true

-- El mismo filtro que `precios` y `pred`: una variante inactiva o dada de baja
-- no se vende, así que no se ofrece.
left join lateral (
  select coalesce(
           jsonb_agg(
             jsonb_build_object(
               'id',     v.id,
               'nombre', v.nombre,
               'precio', v.precio,
               'unidad', v.unidad_venta
             )
             order by v.es_predeterminada desc, v.orden, v.precio
           ),
           '[]'::jsonb
         ) as lista
  from public.producto_variantes v
  where v.producto_id = p.id
    and v.activo
    and v.deleted_at is null
) presentaciones on true

where p.estado = 'publicado'
  and p.deleted_at is null;

comment on view public.productos_publicos is
  'Una fila por producto publicado, con categoria, rango de precios, variante predeterminada, imagen principal y todas sus presentaciones (R3).';
