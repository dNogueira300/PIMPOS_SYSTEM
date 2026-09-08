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
--    con ajonjoli. CONFIRMADO con el negocio el 07/09: se quedan asi, como dos
--    variantes de la misma familia distinguidas por su precio. Es exactamente
--    el caso que justifica el modelo de variantes.
--
-- 3. "Arvejas" figuraba sin precio en el documento. CONFIRMADO el 07/09:
--    S/ 2.00. Ya entra publicado como el resto.
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
  ('bodega',           'Arvejas',             'arvejas',            'publicado', false, 6)
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
  ('arvejas',                   'Unidad', 2.00, 'unidad'),
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

-- =============================================================================
-- Insumos, proveedores y equivalencias (ficha 7.2 y 7.9)
--
-- Aqui esta la parte con mas riesgo de error silencioso de todo el sistema, y
-- los datos de la ficha lo demuestran solos:
--
--     saco de harina  = 50 kg        saco de sal            = 25 kg
--     caja de manteca = 10 kg        caja de huevos         = 100 unidades
--                                    caja de fruta confit.  =  5 kg
--
-- "Saco" y "caja" no significan nada por si solos. Por eso la equivalencia
-- cuelga del insumo y no de una tabla global de conversiones.
-- =============================================================================

delete from public.proveedores where nombre in (
  'Comercial FOX', 'Maíz Center', 'Charapita',
  'Comercializadora San Juan', 'La Casa Plast', 'La Región'
);

-- Los contactos figuran como "Por definir" en la ficha 7.9. Se dejan vacios a
-- proposito en lugar de inventarlos; el negocio los completa desde el panel.
insert into public.proveedores (nombre, observacion) values
  ('Comercial FOX',             'Harina, azúcar, manteca, huevo, levadura, mejorador, vainilla, colorante, mantequilla y aceite.'),
  ('Maíz Center',               'Huevo y sal.'),
  ('Charapita',                 'Ajonjolí.'),
  ('Comercializadora San Juan', 'Bolsas en rollo 10x15, 12x17 y 14x20.'),
  ('La Casa Plast',             'Bolsa panadera 18x26 y 20x30.'),
  ('La Región',                 'Leche en polvo.');

delete from public.insumos where nombre in (
  'Harina', 'Azúcar', 'Manteca', 'Levadura', 'Mejorador', 'Vainilla', 'Aceite',
  'Sal', 'Huevo', 'Mantequilla', 'Leche en polvo', 'Ajonjolí', 'Colorante',
  'Frutas confitadas', 'Bolsa panadera 18x26', 'Bolsa panadera 20x30',
  'Bolsa en rollo 8x12', 'Bolsa en rollo 10x15', 'Bolsa en rollo 12x17',
  'Bolsa en rollo 14x20', 'Bolsa blancosito 12x17', 'Bolsa blancosito 14x20'
);

-- El stock minimo va EN LA UNIDAD BASE. La ficha lo expresa en presentaciones
-- ("30 sacos" de harina), asi que se convierte al cargarlo: 30 x 50 = 1500 kg.
insert into public.insumos (nombre, unidad_base_id, presentacion, stock_minimo, es_perecible, proveedor_habitual_id)
select i.nombre, u.id, i.presentacion, i.stock_minimo, i.perecible, p.id
from (values
  ('Harina',                 'kg',     'Saco de 50 kg',           1500.0, false, 'Comercial FOX'),
  ('Azúcar',                 'kg',     'Saco de 50 kg',            100.0, false, 'Comercial FOX'),
  ('Manteca',                'kg',     'Caja de 10 kg',             60.0, true,  'Comercial FOX'),
  ('Levadura',               'kg',     'Caja de 10 kg',             10.0, true,  'Comercial FOX'),
  ('Mejorador',              'kg',     'Paquete de 5 kg',            5.0, false, 'Comercial FOX'),
  ('Vainilla',               'l',      'Botella de 4 litros',        4.0, false, 'Comercial FOX'),
  ('Aceite',                 'unidad', 'Paquete de 12 botellas',     3.0, false, 'Comercial FOX'),
  ('Sal',                    'kg',     'Saco de 25 kg',             25.0, false, 'Maíz Center'),
  ('Huevo',                  'unidad', 'Caja con 100 unidades',     20.0, true,  'Maíz Center'),
  ('Mantequilla',            'kg',     'Caja de 10 kg',              1.0, true,  'Comercial FOX'),
  ('Leche en polvo',         'kg',     'Saco de 25 kg',              3.0, false, 'La Región'),
  ('Ajonjolí',               'kg',     'Bolsa de 10 kg',             1.0, false, 'Charapita'),
  ('Colorante',              'unidad', 'Paquete de 6 unidades',      1.0, false, 'Comercial FOX'),
  ('Frutas confitadas',      'kg',     'Caja de 5 kg',               5.0, true,  'Comercial FOX'),
  ('Bolsa panadera 18x26',   'unidad', 'Paquete de 20 unidades',     4.0, false, 'La Casa Plast'),
  ('Bolsa panadera 20x30',   'unidad', 'Paquete de 15 unidades',     3.0, false, 'La Casa Plast'),
  ('Bolsa en rollo 8x12',    'rollo',  'Paquete de 5 rollos',        1.0, false, 'Comercializadora San Juan'),
  ('Bolsa en rollo 10x15',   'rollo',  'Paquete de 5 rollos',        1.0, false, 'Comercializadora San Juan'),
  ('Bolsa en rollo 12x17',   'rollo',  'Paquete de 5 rollos',        1.0, false, 'Comercializadora San Juan'),
  ('Bolsa en rollo 14x20',   'rollo',  'Paquete de 5 rollos',        1.0, false, 'Comercializadora San Juan'),
  ('Bolsa blancosito 12x17', 'unidad', 'Paquete de 50 unidades',     3.0, false, 'La Casa Plast'),
  ('Bolsa blancosito 14x20', 'unidad', 'Paquete de 50 unidades',     3.0, false, 'La Casa Plast')
) as i(nombre, unidad, presentacion, stock_minimo, perecible, proveedor)
join public.unidades_medida u on u.codigo = i.unidad
left join public.proveedores p on p.nombre = i.proveedor;

-- --- Las equivalencias -------------------------------------------------------
-- Cada fila responde a "cuanto es UNA unidad de compra de ESTE insumo".
-- Comparar harina con sal, o manteca con frutas confitadas, deja clara la razon
-- de que esto no pueda ser una tabla global.
insert into public.equivalencias (insumo_id, unidad_desde, unidad_hacia, factor)
select ins.id, ud.id, uh.id, e.factor
from (values
  ('Harina',                 'saco',    'kg',      50.0),
  ('Azúcar',                 'saco',    'kg',      50.0),
  ('Sal',                    'saco',    'kg',      25.0),
  ('Leche en polvo',         'saco',    'kg',      25.0),
  ('Manteca',                'caja',    'kg',      10.0),
  ('Levadura',               'caja',    'kg',      10.0),
  ('Mantequilla',            'caja',    'kg',      10.0),
  ('Frutas confitadas',      'caja',    'kg',       5.0),
  ('Huevo',                  'caja',    'unidad', 100.0),
  ('Mejorador',              'paquete', 'kg',       5.0),
  ('Ajonjolí',               'bolsa',   'kg',      10.0),
  ('Vainilla',               'botella', 'l',        4.0),
  ('Aceite',                 'paquete', 'unidad',  12.0),
  ('Colorante',              'paquete', 'unidad',   6.0),
  ('Bolsa panadera 18x26',   'paquete', 'unidad',  20.0),
  ('Bolsa panadera 20x30',   'paquete', 'unidad',  15.0),
  ('Bolsa blancosito 12x17', 'paquete', 'unidad',  50.0),
  ('Bolsa blancosito 14x20', 'paquete', 'unidad',  50.0),
  ('Bolsa en rollo 8x12',    'paquete', 'rollo',    5.0),
  ('Bolsa en rollo 10x15',   'paquete', 'rollo',    5.0),
  ('Bolsa en rollo 12x17',   'paquete', 'rollo',    5.0),
  ('Bolsa en rollo 14x20',   'paquete', 'rollo',    5.0)
) as e(insumo, desde, hacia, factor)
join public.insumos ins        on ins.nombre = e.insumo
join public.unidades_medida ud on ud.codigo  = e.desde
join public.unidades_medida uh on uh.codigo  = e.hacia;

-- Conversiones dentro del mismo sistema metrico. La ficha dice que levadura,
-- mejorador y sal se manejan en "Kg/gr": conviene poder registrar 500 g sin
-- tener que escribir 0.5.
insert into public.equivalencias (insumo_id, unidad_desde, unidad_hacia, factor)
select i.id, ug.id, uk.id, 0.001
from public.insumos i
cross join (select id from public.unidades_medida where codigo = 'g')  ug
cross join (select id from public.unidades_medida where codigo = 'kg') uk
where i.unidad_base_id = uk.id;

insert into public.equivalencias (insumo_id, unidad_desde, unidad_hacia, factor)
select i.id, um.id, ul.id, 0.001
from public.insumos i
cross join (select id from public.unidades_medida where codigo = 'ml') um
cross join (select id from public.unidades_medida where codigo = 'l')  ul
where i.unidad_base_id = ul.id;
