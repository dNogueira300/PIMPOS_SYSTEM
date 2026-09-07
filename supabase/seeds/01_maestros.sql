-- =============================================================================
-- 01_maestros.sql -- datos reales y permanentes (es_demo = false)
--
-- Plan: doc 02 §14. Se carga en cada `supabase db reset`, asi que es idempotente.
--
-- Regla que salio de un tropiezo real: si un dato tiene que existir en TODOS los
-- entornos, va en una MIGRACION, porque `supabase db push` no aplica semillas.
-- Por eso los roles (0004), la configuracion del sitio (0008) y las categorias
-- de producto (0009) ya no estan aqui.
--
-- Lo que si vive aqui es el CONTENIDO: productos, precios y, mas adelante,
-- insumos y proveedores. El negocio lo administra desde el panel a partir de la
-- Fase 4; hasta entonces esta es la forma de tenerlo versionado y reproducible.
--
-- Para cargarlo en produccion una vez:  supabase db push --include-seed
-- =============================================================================

-- =============================================================================
-- Catalogo de productos (LISTAPRODUCTOS.docx)
--
-- Tres cosas que conviene saber antes de tocar esto:
--
-- 1. El documento agrupa por bloques de precio ("PANES DE S/ 0.10"), pero
--    dentro de un bloque hay items con precio propio: dos hamburguesas grandes
--    figuran bajo el bloque de 0.10 con precio 0.30 y 0.40. Manda el del item.
--
-- 2. "Hamburguesa grande" aparece a S/ 0.30 y a S/ 0.40, y lo mismo la version
--    con ajonjoli. El documento no dice que las diferencia. Se cargan como dos
--    variantes de la misma familia -- que es exactamente el caso que justifica
--    el modelo de variantes -- pero HAY QUE CONFIRMARLO con el negocio: si son
--    dos tamanos, las variantes deberian llamarse por su tamano y no por su
--    precio.
--
-- 3. "Arvejas" figura sin precio. Se carga en BORRADOR y sin variante: sin
--    precio no se puede publicar, e inventarselo seria peor que dejarlo
--    pendiente. El negocio lo completa desde el panel.
-- =============================================================================

-- Idempotencia: se borra lo que esta misma semilla carga, identificado por sus
-- slugs. El `on delete cascade` de las variantes se encarga del resto.
delete from public.productos where slug in (
  'bizcocho-chico', 'frances-chico', 'cerveza', 'leche', 'hamburguesa-chica',
  'bico-chico', 'carioco', 'maiz', 'hot-dog-chico', 'hamburguesa-suave', 'rosca',
  'cartera', 'hamburguesa-grande', 'hamburguesa-grande-ajonjoli',
  'hot-dog-grande-ajonjoli', 'bico-grande', 'bizcocho-grande', 'ciabatta',
  'pan-molde', 'pan-molde-integral', 'tostada-integral', 'tostada-blanca',
  'bico-integral', 'bolitas-integral', 'pate', 'paneton', 'arroz-1kg',
  'cereales', 'harina-de-platano', 'upe', 'arvejas', 'lentejas',
  'roscas-blancas-de-almidon', 'pan-al-ajo'
);

insert into public.productos (categoria_id, nombre, slug, estado, destacado, orden)
select c.id, p.nombre, p.slug, p.estado::app.estado_publicacion, p.destacado, p.orden
from (values
  -- Panes clasicos
  ('panes-clasicos',   'Pan francés chico',   'frances-chico',      'publicado', true,  1),
  ('panes-clasicos',   'Pan de leche',        'leche',              'publicado', true,  2),
  ('panes-clasicos',   'Pan de cerveza',      'cerveza',            'publicado', false, 3),
  ('panes-clasicos',   'Pan bico chico',      'bico-chico',         'publicado', false, 4),
  ('panes-clasicos',   'Pan de maíz',         'maiz',               'publicado', false, 5),
  ('panes-clasicos',   'Hamburguesa chica',   'hamburguesa-chica',  'publicado', false, 6),
  ('panes-clasicos',   'Hamburguesa suave',   'hamburguesa-suave',  'publicado', false, 7),
  ('panes-clasicos',   'Hot dog chico',       'hot-dog-chico',      'publicado', false, 8),

  -- Panes especiales
  ('panes-especiales', 'Bizcocho chico',      'bizcocho-chico',     'publicado', false, 1),
  ('panes-especiales', 'Bizcocho grande',     'bizcocho-grande',    'publicado', true,  2),
  ('panes-especiales', 'Carioco',             'carioco',            'publicado', false, 3),
  ('panes-especiales', 'Ciabatta',            'ciabatta',           'publicado', true,  4),
  ('panes-especiales', 'Pan bico grande',     'bico-grande',        'publicado', false, 5),
  ('panes-especiales', 'Pan al ajo',          'pan-al-ajo',         'publicado', false, 6),
  ('panes-especiales', 'Hamburguesa grande',  'hamburguesa-grande', 'publicado', false, 7),
  ('panes-especiales', 'Hamburguesa grande con ajonjolí', 'hamburguesa-grande-ajonjoli', 'publicado', false, 8),
  ('panes-especiales', 'Hot dog grande con ajonjolí',     'hot-dog-grande-ajonjoli',     'publicado', false, 9),

  -- Panes integrales
  ('panes-integrales', 'Pan molde integral',  'pan-molde-integral', 'publicado', true,  1),
  ('panes-integrales', 'Bico integral',       'bico-integral',      'publicado', false, 2),
  ('panes-integrales', 'Bolitas integrales',  'bolitas-integral',   'publicado', false, 3),
  ('panes-integrales', 'Tostada integral',    'tostada-integral',   'publicado', false, 4),

  -- Panes tostados
  ('panes-tostados',   'Pan molde',           'pan-molde',          'publicado', true,  1),
  ('panes-tostados',   'Tostada blanca',      'tostada-blanca',     'publicado', false, 2),
  ('panes-tostados',   'Rosca',               'rosca',              'publicado', false, 3),
  ('panes-tostados',   'Cartera',             'cartera',            'publicado', false, 4),

  -- Snacks
  ('snacks',           'Roscas blancas de almidón', 'roscas-blancas-de-almidon', 'publicado', false, 1),
  ('snacks',           'Panetón',             'paneton',            'publicado', true,  2),
  ('snacks',           'Paté',                'pate',               'publicado', false, 3),

  -- Bodega
  ('bodega',           'Arroz',               'arroz-1kg',          'publicado', false, 1),
  ('bodega',           'Lentejas',            'lentejas',           'publicado', false, 2),
  ('bodega',           'Harina de plátano',   'harina-de-platano',  'publicado', false, 3),
  ('bodega',           'Upe',                 'upe',                'publicado', false, 4),
  ('bodega',           'Cereales',            'cereales',           'publicado', false, 5),
  -- Sin precio en el documento: en borrador y sin variante (ver nota 3).
  ('bodega',           'Arvejas',             'arvejas',            'borrador',  false, 6)
) as p(categoria, nombre, slug, estado, destacado, orden)
join public.categorias_producto c on c.slug = p.categoria;

-- --- Variantes de precio unico ----------------------------------------------
insert into public.producto_variantes (producto_id, nombre, precio, unidad_venta, es_predeterminada, orden)
select p.id, v.nombre, v.precio, v.unidad, true, 1
from (values
  ('frances-chico',             'Unidad', 0.10, 'unidad'),
  ('leche',                     'Unidad', 0.10, 'unidad'),
  ('cerveza',                   'Unidad', 0.10, 'unidad'),
  ('bico-chico',                'Unidad', 0.10, 'unidad'),
  ('maiz',                      'Unidad', 0.10, 'unidad'),
  ('hamburguesa-chica',         'Unidad', 0.10, 'unidad'),
  ('hamburguesa-suave',         'Unidad', 0.10, 'unidad'),
  ('hot-dog-chico',             'Unidad', 0.10, 'unidad'),
  ('bizcocho-chico',            'Unidad', 0.10, 'unidad'),
  ('carioco',                   'Unidad', 0.10, 'unidad'),
  ('rosca',                     'Unidad', 0.10, 'unidad'),
  ('cartera',                   'Unidad', 0.10, 'unidad'),
  ('hot-dog-grande-ajonjoli',   'Unidad', 0.30, 'unidad'),
  ('bico-grande',               'Unidad', 0.50, 'unidad'),
  ('bizcocho-grande',           'Unidad', 0.50, 'unidad'),
  ('ciabatta',                  'Unidad', 0.50, 'unidad'),
  ('cereales',                  'Unidad', 0.50, 'unidad'),
  ('pan-al-ajo',                'Unidad', 1.50, 'unidad'),
  ('bico-integral',             'Unidad', 1.50, 'unidad'),
  ('tostada-integral',          'Unidad', 2.00, 'unidad'),
  ('tostada-blanca',            'Unidad', 2.00, 'unidad'),
  ('lentejas',                  'Unidad', 2.00, 'unidad'),
  ('roscas-blancas-de-almidon', 'Unidad', 2.50, 'unidad'),
  ('bolitas-integral',          'Bolsa',  3.00, 'bolsa'),
  ('harina-de-platano',         'Unidad', 4.00, 'unidad'),
  ('upe',                       'Unidad', 4.00, 'unidad'),
  ('arroz-1kg',                 'Kilo',   4.50, 'kilo'),
  ('pate',                      'Unidad', 5.00, 'unidad'),
  ('pan-molde',                 'Unidad', 6.00, 'unidad'),
  ('pan-molde-integral',        'Unidad', 7.00, 'unidad'),
  ('paneton',                   'Unidad', 14.00, 'unidad')
) as v(slug, nombre, precio, unidad)
join public.productos p on p.slug = v.slug;

-- --- Las dos familias con dos precios ---------------------------------------
-- Es el caso que justifica el modelo de variantes. PENDIENTE de confirmar que
-- diferencia una de otra (ver nota 2).
insert into public.producto_variantes (producto_id, nombre, precio, es_predeterminada, orden)
select p.id, v.nombre, v.precio, v.predeterminada, v.orden
from (values
  ('hamburguesa-grande',          'De S/ 0.30', 0.30, true,  1),
  ('hamburguesa-grande',          'De S/ 0.40', 0.40, false, 2),
  ('hamburguesa-grande-ajonjoli', 'De S/ 0.30', 0.30, true,  1),
  ('hamburguesa-grande-ajonjoli', 'De S/ 0.40', 0.40, false, 2)
) as v(slug, nombre, precio, predeterminada, orden)
join public.productos p on p.slug = v.slug;
