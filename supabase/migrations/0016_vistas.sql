-- =============================================================================
-- 0016_vistas.sql
-- Vistas de lectura del sitio publico (doc 02 §3, migracion 0016).
--
-- Regla que establece este archivo: **el sitio publico lee vistas, nunca
-- tablas**. Cada pagina de la Fase 3 tiene aqui su vista `*_publica(s)`, con
-- las columnas ya listas y sin los metadatos internos (`created_by`,
-- `updated_by`, `deleted_at`).
--
-- -----------------------------------------------------------------------------
-- LO MAS IMPORTANTE DE ESTE ARCHIVO: `security_invoker = true`
--
-- Una vista de Postgres se ejecuta, por omision, con los privilegios de quien
-- la creo -- aqui `postgres`, que salta toda la RLS. Una sola vista sin esta
-- opcion convierte la API publica en un agujero: bastaria consultarla para
-- leer los borradores, las promociones sin aprobar y las novedades vencidas,
-- con las politicas de las tablas intactas y sin enterarse de nada.
--
-- No se puede activar RLS sobre una vista. Toda la proteccion viene de esta
-- opcion mas la RLS de las tablas de abajo. La prueba pgTAP recorre TODAS las
-- vistas de `public` y falla si alguna no la lleva, para que la siguiente que
-- se escriba no pueda olvidarla.
-- -----------------------------------------------------------------------------
--
-- Y la segunda regla, menos obvia: cada vista repite en su `where` la
-- condicion de publicado, aunque la RLS ya la imponga para el anonimo. No es
-- redundante. Un administrador con sesion SI puede leer los borradores, asi
-- que sin ese `where` la misma vista significaria una cosa para el visitante y
-- otra para el panel: la vista previa mostraria un "desde S/" calculado con
-- variantes desactivadas. Una vista publica tiene que devolver lo mismo a todo
-- el mundo; quien niega el acceso es la RLS, quien define el contenido es el
-- `where`.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Catalogo (R3)
-- -----------------------------------------------------------------------------
create view public.categorias_publicas
with (security_invoker = true) as
select
  c.id,
  c.nombre,
  c.slug,
  c.descripcion,
  c.imagen_url,
  c.orden
from public.categorias_producto c
where c.estado = 'publicado'
  and c.deleted_at is null;

comment on view public.categorias_publicas is
  'Categorias visibles en el sitio publico, ya filtradas y ordenadas.';

-- El producto tal como lo pinta una tarjeta del catalogo: con su categoria, su
-- rango de precios y su foto principal resueltos. Sin esta vista el frontend
-- haria cuatro consultas y agruparia en el navegador; con ella hace una.
--
-- El precio se muestra con orgullo (doc 03): hay panes desde S/ 0.10 y eso es
-- un argumento de venta, no un dato a esconder. Por eso `precio_desde` sale en
-- la tarjeta y no solo en el detalle.
create view public.productos_publicos
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
  img.alt  as imagen_alt
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

where p.estado = 'publicado'
  and p.deleted_at is null;

comment on view public.productos_publicos is
  'Una fila por producto publicado, con categoria, rango de precios, variante predeterminada e imagen principal (R3).';

-- -----------------------------------------------------------------------------
-- Contenido
-- -----------------------------------------------------------------------------
-- La vigencia se repite aqui a proposito, ademas de estar en la RLS y en el
-- cron: si el proyecto Supabase se pausa, `pg_cron` no corre y las novedades
-- vencidas se quedan en estado `publicado`. Con esta condicion, una promocion
-- caducada sigue sin aparecer en el sitio aunque nadie la haya archivado.
create view public.novedades_publicas
with (security_invoker = true) as
select
  n.id,
  n.tipo,
  n.titulo,
  n.slug,
  n.resumen,
  n.contenido,
  n.imagen_url,
  n.vigencia_inicio,
  n.vigencia_fin,
  n.es_demo,
  n.created_at as publicada_en
from public.novedades n
where n.estado = 'publicado'
  and n.deleted_at is null
  and (n.vigencia_inicio is null or n.vigencia_inicio <= now())
  and (n.vigencia_fin    is null or n.vigencia_fin    >= now());

comment on view public.novedades_publicas is
  'Novedades y promociones vigentes hoy (R7). No expone quien las aprobo.';

create view public.slides_publicos
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
  s.es_demo
from public.slides s
where s.estado = 'publicado'
  and s.deleted_at is null
  and (s.vigencia_inicio is null or s.vigencia_inicio <= now())
  and (s.vigencia_fin    is null or s.vigencia_fin    >= now());

comment on view public.slides_publicos is
  'Slides vigentes del carrusel de portada, en orden (R2).';

create view public.guias_publicas
with (security_invoker = true) as
select
  g.id,
  g.titulo,
  g.slug,
  g.resumen,
  g.contenido,
  g.imagen_url,
  g.orden,
  g.es_demo
from public.guias g
where g.estado = 'publicado'
  and g.deleted_at is null;

comment on view public.guias_publicas is
  'Guias publicadas: como hacer un pedido, como presentar un reclamo.';

create view public.galeria_publica
with (security_invoker = true) as
select
  g.id,
  g.titulo,
  g.alt,
  g.ruta,
  g.categoria,
  g.orden,
  g.es_demo
from public.galeria g
where g.estado = 'publicado'
  and g.deleted_at is null;

comment on view public.galeria_publica is
  'Fotos publicadas de la galeria del local (R5).';

create view public.faqs_publicas
with (security_invoker = true) as
select
  f.id,
  f.pregunta,
  f.respuesta,
  f.orden,
  f.es_demo
from public.faqs f
where f.estado = 'publicado'
  and f.deleted_at is null;

comment on view public.faqs_publicas is
  'Preguntas frecuentes publicadas (ficha 5.9).';

create view public.testimonios_publicos
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
  and t.deleted_at is null;

comment on view public.testimonios_publicos is
  'Testimonios aprobados para el sitio publico.';

-- -----------------------------------------------------------------------------
-- Configuracion del sitio (R21, R5)
--
-- Las 24 claves llegan como UNA fila con un solo objeto jsonb, en vez de 24
-- filas que el frontend tendria que recomponer en cada pagina. El layout
-- necesita logo, horarios, telefono y redes en todas, asi que esa recomposicion
-- se haria constantemente.
--
-- El `where es_publico` es el que deja fuera `correo_alertas` y
-- `dias_aviso_vencimiento`, que son de uso interno.
-- -----------------------------------------------------------------------------
create view public.configuracion_publica
with (security_invoker = true) as
select coalesce(
         jsonb_object_agg(c.clave, c.valor) filter (where c.es_publico),
         '{}'::jsonb
       ) as valores
from public.configuracion_sitio c;

comment on view public.configuracion_publica is
  'Las claves publicas de configuracion_sitio en un unico objeto jsonb (R21).';

-- =============================================================================
-- Permisos
--
-- Hacen falta porque `security_invoker` obliga a que el privilegio sea de quien
-- consulta. No abren nada: las filas siguen filtradas por la RLS de las tablas
-- de origen.
-- =============================================================================
grant select on public.categorias_publicas   to anon, authenticated;
grant select on public.productos_publicos    to anon, authenticated;
grant select on public.novedades_publicas    to anon, authenticated;
grant select on public.slides_publicos       to anon, authenticated;
grant select on public.guias_publicas        to anon, authenticated;
grant select on public.galeria_publica       to anon, authenticated;
grant select on public.faqs_publicas         to anon, authenticated;
grant select on public.testimonios_publicos  to anon, authenticated;
grant select on public.configuracion_publica to anon, authenticated;
