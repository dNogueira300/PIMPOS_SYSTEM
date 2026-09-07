-- =============================================================================
-- 0008_configuracion.sql
-- Lo que hace administrables el logo, el favicon, las coordenadas, los horarios
-- y los textos del sitio (R21, R5; doc 02 §6).
--
-- Es clave/valor con jsonb en vez de una tabla de columnas fijas porque el
-- contenido es heterogeneo -- una URL, un par de coordenadas, el horario de la
-- semana entera -- y porque anadir un ajuste nuevo no deberia exigir una
-- migracion cada vez.
-- =============================================================================

create table public.configuracion_sitio (
  clave       text primary key check (clave ~ '^[a-z][a-z0-9_]*$'),
  valor       jsonb       not null,
  -- Se muestra al administrador junto al campo: el panel lo usa gente con
  -- nivel de computadora basico (R18) y "coordenadas" a secas no dice nada.
  descripcion text        not null check (length(btrim(descripcion)) > 0),
  grupo       text        not null check (grupo in ('marca', 'contacto', 'ubicacion', 'horarios', 'redes', 'textos')),
  -- Que el sitio publico pueda leerlo. Explicito, en lugar de deducirlo del
  -- grupo: asi anadir un ajuste privado mas adelante no obliga a tocar la RLS.
  es_publico  boolean     not null default false,
  orden       smallint    not null default 0,
  updated_at  timestamptz not null default now(),
  updated_by  uuid references auth.users(id)
);

comment on table public.configuracion_sitio is
  'Ajustes del sitio en clave/valor. Lo que el negocio cambia sin tocar codigo.';
comment on column public.configuracion_sitio.es_publico is
  'Si el visitante anonimo puede leerlo. Lo comprueba la politica RLS.';

create trigger configuracion_sitio_set_updated_at
  before update on public.configuracion_sitio
  for each row execute function app.set_updated_at();

-- El trigger de auditoria NO se engancha aqui, sino al final del archivo:
-- la carga inicial de mas abajo no es "un cambio que alguien hizo", es el
-- estado de partida. Auditarla llenaria la pantalla de actividad reciente con
-- dos docenas de inserciones sin autor antes de que nadie toque nada.

-- El sitio publico pide siempre por grupo ("dame la marca", "dame los
-- horarios"), y solo lo publico.
create index idx_configuracion_grupo on public.configuracion_sitio (grupo, orden)
  where es_publico;

-- =============================================================================
-- RLS (doc 02 §11)
-- =============================================================================
alter table public.configuracion_sitio enable row level security;
alter table public.configuracion_sitio force  row level security;

create policy "publico lee la configuracion publica"
  on public.configuracion_sitio
  for select
  to anon
  using (es_publico);

create policy "autenticado lee toda la configuracion"
  on public.configuracion_sitio
  for select
  to authenticated
  using (true);

-- Solo administracion escribe. El ingeniero carga contenido, no cambia el logo
-- ni las coordenadas del negocio.
create policy "administracion edita la configuracion"
  on public.configuracion_sitio
  for update
  to authenticated
  using      ((select app.es_rol('superadmin', 'administrador')))
  with check ((select app.es_rol('superadmin', 'administrador')));

-- Sin INSERT ni DELETE desde la API: el juego de claves lo define una
-- migracion. Que alguien pueda inventarse una clave desde el panel solo
-- serviria para que el sitio buscara una que no existe.

-- =============================================================================
-- Valores iniciales.
--
-- Van en la migracion y no en una semilla porque el sitio los necesita en
-- TODOS los entornos: `supabase db push` no aplica semillas, y sin estas filas
-- la portada no sabria ni como se llama el negocio. Misma leccion que el
-- catalogo de roles (0004).
--
-- Los datos salen de la ficha (1.9 horarios, 3.1 direccion, 2.1-2.4 textos) y
-- de las coordenadas entregadas el 05/09.
-- =============================================================================
insert into public.configuracion_sitio (clave, valor, descripcion, grupo, es_publico, orden) values

  -- --- Marca (R21) ---------------------------------------------------------
  ('nombre_comercial', '"Panadería Pimpo''s"'::jsonb,
   'Nombre corto del negocio, el que se ve en la cabecera.', 'marca', true, 1),
  ('razon_social', '"Panadería Pastelería y Bodega Pimpo''s E.I.R.L."'::jsonb,
   'Nombre legal completo. Solo aparece en el pie de página y en textos legales.', 'marca', true, 2),
  ('eslogan', '"Pan fresco, tradición de siempre"'::jsonb,
   'Frase de la marca. Se usa completa, sin abreviar.', 'marca', true, 3),
  ('logo_url', '"/marca/logo.webp"'::jsonb,
   'Logo horizontal, para la cabecera y el pie. Súbelo en formato WebP o PNG.', 'marca', true, 4),
  ('logo_alt', '"Panadería Pimpo''s"'::jsonb,
   'Texto que lee un lector de pantalla en lugar del logo.', 'marca', true, 5),
  ('isotipo_url', '"/marca/isotipo.svg"'::jsonb,
   'Solo el dibujo, sin el texto. Se usa en tamaños pequeños.', 'marca', true, 6),
  ('favicon_url', '"/marca/favicon.svg"'::jsonb,
   'Iconito que se ve en la pestaña del navegador.', 'marca', true, 7),

  -- --- Contacto (R4, R17) --------------------------------------------------
  ('telefono', '"065 987654"'::jsonb,
   'Teléfono fijo del local. PENDIENTE de confirmar con el negocio.', 'contacto', true, 1),
  ('whatsapp', '"51947874820"'::jsonb,
   'Número de WhatsApp con código de país y sin espacios ni signos. Es al que llegan los pedidos.',
   'contacto', true, 2),
  ('correo', '"contactopimpos@gmail.com"'::jsonb,
   'Correo de contacto que se muestra en el sitio.', 'contacto', true, 3),

  -- --- Ubicacion (R5) ------------------------------------------------------
  ('direccion', '"Calle Elías Aguirre 1321"'::jsonb,
   'Dirección del local, tal como debe verse en el sitio.', 'ubicacion', true, 1),
  ('distrito', '"Belén"'::jsonb, 'Distrito.', 'ubicacion', true, 2),
  ('provincia', '"Maynas"'::jsonb, 'Provincia.', 'ubicacion', true, 3),
  ('departamento', '"Loreto"'::jsonb, 'Departamento.', 'ubicacion', true, 4),
  ('referencia', '""'::jsonb,
   'Una referencia para encontrar el local más fácil. Por ejemplo, "frente al mercado".',
   'ubicacion', true, 5),
  ('coordenadas', '{"lat": -3.759545048266943, "lng": -73.2516156605442}'::jsonb,
   'Punto exacto del local en el mapa. Se puede ajustar arrastrando el marcador.',
   'ubicacion', true, 6),

  -- --- Horarios (ficha 1.9) ------------------------------------------------
  -- Dos turnos por dia. `null` significa cerrado, que es lo que pasa los
  -- domingos y feriados y hay que mostrar explicitamente (doc 03 §7).
  ('horario_semanal',
   '{"lunes":     [{"desde": "04:00", "hasta": "13:00"}, {"desde": "16:00", "hasta": "21:00"}],
     "martes":    [{"desde": "04:00", "hasta": "13:00"}, {"desde": "16:00", "hasta": "21:00"}],
     "miercoles": [{"desde": "04:00", "hasta": "13:00"}, {"desde": "16:00", "hasta": "21:00"}],
     "jueves":    [{"desde": "04:00", "hasta": "13:00"}, {"desde": "16:00", "hasta": "21:00"}],
     "viernes":   [{"desde": "04:00", "hasta": "13:00"}, {"desde": "16:00", "hasta": "21:00"}],
     "sabado":    [{"desde": "04:00", "hasta": "13:00"}, {"desde": "16:00", "hasta": "21:00"}],
     "domingo":   []}'::jsonb,
   'Horario de cada día, en dos turnos. Un día sin turnos significa cerrado.',
   'horarios', true, 1),
  ('nota_horarios', '"Domingos y feriados no hay atención."'::jsonb,
   'Aclaración que se muestra junto al horario.', 'horarios', true, 2),

  -- --- Redes (ficha 3.x) ---------------------------------------------------
  ('facebook', '""'::jsonb, 'Enlace a la página de Facebook. Déjalo vacío si no hay.', 'redes', true, 1),
  ('instagram', '""'::jsonb, 'Enlace a Instagram. Déjalo vacío si no hay.', 'redes', true, 2),

  -- --- Textos (ficha 1.8, 2.1-2.3) -----------------------------------------
  ('historia',
   '"Bienvenidos a Panadería Pimpo''s, un negocio tradicional profundamente arraigado en el corazón de Iquitos. Nacimos con el sueño y el compromiso de llevar a los hogares loretanos el aroma y el sabor del pan fresco de calidad, elaborado cada día con dedicación y esmero.\n\nDesde nuestros inicios en la Av. Elías Aguirre, comenzamos como un emprendimiento familiar enfocado en atender con calidez a nuestros vecinos. Con el pasar de los años, gracias a la preferencia y confianza de nuestra comunidad, hemos crecido y adaptado nuestra oferta, especializándonos en una gran variedad de panes y deliciosos dulces tradicionales. Hoy en día, seguimos manteniendo la misma esencia del primer día: ofrecer productos frescos, artesanales y con ese toque casero inconfundible que nos caracteriza en toda la ciudad. ¡Gracias por ser parte de nuestra familia!"'::jsonb,
   'La historia del negocio. Se muestra completa en la sección Nosotros.', 'textos', true, 1),
  ('mision',
   '"Nos dedicamos a la elaboración y comercialización de una gran variedad de panes frescos y deliciosos dulces tradicionales, dirigidos a las familias y vecinos de Iquitos. Nuestro propósito es ofrecer una excelente experiencia de compra tanto a través de nuestra cálida atención en tienda como mediante un eficiente servicio de reparto a domicilio que llega a cada rincón de la ciudad, manteniendo siempre la calidad y el toque casero que nos caracteriza."'::jsonb,
   'Misión del negocio.', 'textos', true, 2),
  ('vision',
   '"Consolidarnos dentro de cinco años como la panadería líder y preferida en todo Iquitos, reconocidos por la excelencia de nuestros productos de panadería y dulces, así como por la preferencia de nuestros clientes tanto en la atención en tienda como en nuestro servicio de delivery, expandiendo nuestra presencia y llegando de manera eficiente a cada rincón de la ciudad."'::jsonb,
   'Visión del negocio a cinco años.', 'textos', true, 3),
  ('valores',
   '[{"nombre": "Calidad",     "descripcion": "Ofrecer siempre panes frescos y dulces elaborados con los mejores insumos y un toque casero inconfundible."},
     {"nombre": "Puntualidad", "descripcion": "Cumplir con los tiempos de entrega a domicilio y asegurar una atención ágil y oportuna en tienda."},
     {"nombre": "Compromiso",  "descripcion": "Esforzarnos cada día para llegar a cada rincón de la ciudad y satisfacer las expectativas de las familias de Iquitos."},
     {"nombre": "Calidez",     "descripcion": "Brindar un trato amable, cercano y respetuoso tanto a los vecinos que nos visitan como a través del delivery."}]'::jsonb,
   'Los valores del negocio, cada uno con su explicación.', 'textos', true, 4),

  -- --- Alertas (R12). El unico ajuste que NO es publico. --------------------
  ('correo_alertas', '"contactopimpos@gmail.com"'::jsonb,
   'Correo al que llegan los avisos de stock bajo y de insumos por vencer.', 'contacto', false, 10),
  ('dias_aviso_vencimiento', '15'::jsonb,
   'Con cuántos días de antelación avisar de un insumo por vencer.', 'contacto', false, 11)

on conflict (clave) do nothing;

-- `do nothing` y no `do update`: a diferencia del catalogo de roles, estos
-- valores los cambia el negocio desde el panel. Reaplicar la migracion no debe
-- devolverlos a los de fabrica.

-- Ahora si: a partir de aqui, todo cambio queda registrado (R9).
select app.auditar('public.configuracion_sitio');
