-- Verifica las vistas de lectura del sitio publico (0016).
--
-- La comprobacion que justifica el archivo entero es la de `security_invoker`:
-- una vista sin esa opcion se ejecuta con los privilegios de quien la creo y
-- salta la RLS, dejando los borradores a la vista de cualquiera sin que ninguna
-- politica parezca rota. Se recorren TODAS las vistas de `public`, no solo las
-- de esta migracion, para que la proxima que se escriba tampoco pueda olvidarla.
begin;
select plan(32);

-- =============================================================================
-- Existen
-- =============================================================================
select has_view('public', 'categorias_publicas',   'existe categorias_publicas');
select has_view('public', 'productos_publicos',    'existe productos_publicos');
select has_view('public', 'novedades_publicas',    'existe novedades_publicas');
select has_view('public', 'slides_publicos',       'existe slides_publicos');
select has_view('public', 'guias_publicas',        'existe guias_publicas');
select has_view('public', 'galeria_publica',       'existe galeria_publica');
select has_view('public', 'faqs_publicas',         'existe faqs_publicas');
select has_view('public', 'testimonios_publicos',  'existe testimonios_publicos');
select has_view('public', 'configuracion_publica', 'existe configuracion_publica');

-- =============================================================================
-- Ninguna vista salta la RLS
-- =============================================================================
select is(
  (select coalesce(string_agg(c.relname, ', ' order by c.relname), 'ninguna')
     from pg_class c
     join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relkind = 'v'
      and coalesce(array_to_string(c.reloptions, ','), '') not like '%security_invoker=true%'),
  'ninguna',
  'ninguna vista de public se ejecuta con los privilegios de quien la creo'
);

-- La vista no expone quien aprobo la promocion: es dato interno del panel.
select hasnt_column('public', 'novedades_publicas', 'aprobada_por',
  'la novedad publica no dice quien la aprobo');
select hasnt_column('public', 'productos_publicos', 'created_by',
  'ni el producto publico quien lo creo');

-- =============================================================================
-- Fixtures del catalogo
-- =============================================================================
insert into public.categorias_producto (id, nombre, slug, orden, estado) values
  ('cc000000-0000-0000-0000-000000000001', 'Panes de prueba', 'panes-de-prueba', 90, 'publicado');

insert into public.productos (id, categoria_id, nombre, slug, estado, orden) values
  ('dd000000-0000-0000-0000-000000000001', 'cc000000-0000-0000-0000-000000000001',
   'Pan de prueba', 'pan-de-prueba', 'publicado', 1),
  ('dd000000-0000-0000-0000-000000000002', 'cc000000-0000-0000-0000-000000000001',
   'Pan en borrador', 'pan-en-borrador', 'borrador', 2);

-- La tercera variante esta desactivada y es la mas barata: si la vista la
-- contara, la tarjeta anunciaria un precio que nadie puede pagar.
insert into public.producto_variantes
  (producto_id, nombre, precio, unidad_venta, es_predeterminada, activo, orden) values
  ('dd000000-0000-0000-0000-000000000001', 'Bolsa de 10', 0.50, 'bolsa', true,  true,  1),
  ('dd000000-0000-0000-0000-000000000001', 'Docena',      2.00, 'docena', false, true,  2),
  ('dd000000-0000-0000-0000-000000000001', 'Descontinuada', 0.10, 'unidad', false, false, 3);

-- La principal va con `orden` mas alto a proposito: manda `es_principal`.
insert into public.producto_imagenes (producto_id, ruta, alt, orden, es_principal) values
  ('dd000000-0000-0000-0000-000000000001', 'prueba/secundaria.webp', 'otra',      1, false),
  ('dd000000-0000-0000-0000-000000000001', 'prueba/principal.webp',  'la buena',  9, true);

-- =============================================================================
-- El catalogo visto por un anonimo
-- =============================================================================
set local role anon;

select is(
  (select count(*)::int from public.productos_publicos
    where id = 'dd000000-0000-0000-0000-000000000002'),
  0,
  'un producto en borrador no aparece en el catalogo publico'
);

select is(
  (select count(*)::int from public.productos_publicos
    where id = 'dd000000-0000-0000-0000-000000000001'),
  1,
  'y el publicado si, una sola vez pese a tener dos variantes y dos fotos'
);

select is(
  (select precio_desde from public.productos_publicos
    where id = 'dd000000-0000-0000-0000-000000000001'),
  0.50::numeric,
  'el "desde" no cuenta la variante desactivada'
);

select is(
  (select precio_hasta from public.productos_publicos
    where id = 'dd000000-0000-0000-0000-000000000001'),
  2.00::numeric,
  'y el "hasta" es el de la docena'
);

select is(
  (select variantes from public.productos_publicos
    where id = 'dd000000-0000-0000-0000-000000000001'),
  2,
  'se cuentan las dos variantes que se venden'
);

select is(
  (select variante_nombre from public.productos_publicos
    where id = 'dd000000-0000-0000-0000-000000000001'),
  'Bolsa de 10',
  'la variante preseleccionada es la marcada como predeterminada'
);

select is(
  (select imagen_ruta from public.productos_publicos
    where id = 'dd000000-0000-0000-0000-000000000001'),
  'prueba/principal.webp',
  'la foto es la principal, aunque otra tenga menos orden'
);

select is(
  (select categoria_nombre from public.productos_publicos
    where id = 'dd000000-0000-0000-0000-000000000001'),
  'Panes de prueba',
  'la categoria viene resuelta: el frontend no hace un segundo viaje'
);

reset role;

-- =============================================================================
-- La vista significa lo mismo para el panel
--
-- Un administrador SI puede leer los borradores por RLS. Si la vista no
-- repitiera su `where`, la vista previa del panel ensenaria algo que el
-- visitante nunca vera -- y el "desde S/" saldria calculado con variantes
-- desactivadas.
-- =============================================================================
insert into auth.users (id, email, created_at, updated_at) values
  ('55555555-5555-5555-5555-555555555555', 'admin-vistas@pimpos.test', now(), now());
update public.perfiles set rol = 'administrador', activo = true
 where id = '55555555-5555-5555-5555-555555555555';

set local role authenticated;
set local request.jwt.claims = '{"sub": "55555555-5555-5555-5555-555555555555", "rol": "administrador"}';

select is(
  (select count(*)::int from public.productos_publicos
    where id = 'dd000000-0000-0000-0000-000000000002'),
  0,
  'el administrador tampoco ve el borrador a traves de la vista publica'
);

select is(
  (select precio_desde from public.productos_publicos
    where id = 'dd000000-0000-0000-0000-000000000001'),
  0.50::numeric,
  'y le sale el mismo precio que al visitante'
);

reset role;

-- =============================================================================
-- Contenido con vigencia
-- =============================================================================
insert into public.novedades (id, tipo, titulo, slug, contenido, estado, vigencia_inicio, vigencia_fin) values
  ('ee000000-0000-0000-0000-000000000001', 'campania', 'Vigente hoy', 'vigente-hoy',
   'x', 'publicado', now() - interval '1 day', now() + interval '10 day'),
  ('ee000000-0000-0000-0000-000000000002', 'campania', 'Ya vencida', 'ya-vencida',
   'x', 'publicado', now() - interval '20 day', now() - interval '1 day'),
  ('ee000000-0000-0000-0000-000000000003', 'campania', 'Aun no empieza', 'aun-no-empieza',
   'x', 'publicado', now() + interval '5 day', null),
  ('ee000000-0000-0000-0000-000000000004', 'campania', 'En borrador', 'en-borrador',
   'x', 'borrador', null, null);

insert into public.slides (id, titulo, imagen_url, orden, estado, vigencia_fin) values
  ('ff000000-0000-0000-0000-000000000001', 'Slide vigente', 'slides/a.webp', 90, 'publicado', null),
  ('ff000000-0000-0000-0000-000000000002', 'Slide vencido', 'slides/b.webp', 91, 'publicado',
   now() - interval '1 day');

insert into public.faqs (id, pregunta, respuesta, orden, estado) values
  ('ff000000-0000-0000-0000-000000000011', '¿Prueba?', 'Si', 90, 'borrador');

set local role anon;

select is(
  (select count(*)::int from public.novedades_publicas
    where id = 'ee000000-0000-0000-0000-000000000001'),
  1,
  'la novedad vigente hoy aparece'
);
select is(
  (select count(*)::int from public.novedades_publicas
    where id = 'ee000000-0000-0000-0000-000000000002'),
  0,
  'la vencida no, aunque siga en estado publicado porque el cron no corrio'
);
select is(
  (select count(*)::int from public.novedades_publicas
    where id = 'ee000000-0000-0000-0000-000000000003'),
  0,
  'y la que empieza dentro de cinco dias tampoco se adelanta'
);
select is(
  (select count(*)::int from public.novedades_publicas
    where id = 'ee000000-0000-0000-0000-000000000004'),
  0,
  'un borrador nunca sale'
);

select is(
  (select count(*)::int from public.slides_publicos
    where id = 'ff000000-0000-0000-0000-000000000001'),
  1,
  'el slide sin fecha de fin se muestra'
);
select is(
  (select count(*)::int from public.slides_publicos
    where id = 'ff000000-0000-0000-0000-000000000002'),
  0,
  'el slide vencido no'
);

select is(
  (select count(*)::int from public.faqs_publicas
    where id = 'ff000000-0000-0000-0000-000000000011'),
  0,
  'una pregunta frecuente en borrador no llega al sitio'
);

-- =============================================================================
-- Configuracion
-- =============================================================================
select is(
  (select count(*)::int from public.configuracion_publica),
  1,
  'la configuracion llega en una sola fila, no en veinticuatro'
);

select ok(
  (select jsonb_exists(valores, 'telefono') from public.configuracion_publica),
  'el telefono del negocio si es publico'
);

select ok(
  (select not jsonb_exists(valores, 'correo_alertas') from public.configuracion_publica),
  'pero el correo interno de alertas no sale de la casa'
);

reset role;

select * from finish();
rollback;
