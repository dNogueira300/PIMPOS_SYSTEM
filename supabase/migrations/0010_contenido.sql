-- =============================================================================
-- 0010_contenido.sql
-- Novedades, slides, guias, galeria, preguntas frecuentes y testimonios.
-- (R2 carrusel, R7 vigencias, R10 aprobacion; doc 02 §8)
--
-- La pieza importante de este archivo es el flujo de aprobacion de promociones,
-- y esta impuesto en la BASE, no en la interfaz. Un ingeniero puede crear y
-- editar una promocion, pero al intentar publicarla Postgres se lo rechaza.
-- Ocultar el boton en el panel no es control de acceso: una peticion directa a
-- la API se lo salta.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Novedades (R7, R10)
-- -----------------------------------------------------------------------------
create table public.novedades (
  id              uuid primary key default gen_random_uuid(),
  tipo            app.tipo_novedad not null,
  titulo          text not null check (length(btrim(titulo)) > 0),
  slug            text not null check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  -- Resumen para la tarjeta de la portada; el cuerpo va en `contenido`.
  resumen         text,
  contenido       text not null check (length(btrim(contenido)) > 0),
  imagen_url      text,
  estado          app.estado_publicacion not null default 'borrador',

  -- Vigencia: una promocion caducada deja de verse sola (R7).
  vigencia_inicio timestamptz,
  vigencia_fin    timestamptz,

  -- Quien la aprobo y cuando. Lo rellena el trigger, no la aplicacion.
  aprobada_por    uuid references auth.users(id),
  aprobada_en     timestamptz,

  es_demo         boolean not null default false,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  created_by      uuid references auth.users(id),
  updated_by      uuid references auth.users(id),
  deleted_at      timestamptz,

  constraint vigencia_coherente check (
    vigencia_fin is null or vigencia_inicio is null or vigencia_fin > vigencia_inicio
  )
);

comment on table public.novedades is
  'Promociones y anuncios. Las de tipo `promocion` exigen aprobacion para publicarse (R10).';
comment on column public.novedades.vigencia_fin is
  'Cuando deja de mostrarse. La RLS ya la filtra y ademas un cron la archiva (doble red).';

create unique index idx_novedades_slug on public.novedades (slug) where deleted_at is null;

-- El sitio publico pide "las novedades vigentes ahora", que es una fraccion.
create index idx_novedades_vigentes on public.novedades (vigencia_inicio, vigencia_fin)
  where estado = 'publicado' and deleted_at is null;
-- El panel filtra por estado para ver que hay pendiente de aprobar.
create index idx_novedades_estado on public.novedades (estado, created_at desc)
  where deleted_at is null;

create trigger novedades_set_updated_at
  before update on public.novedades
  for each row execute function app.set_updated_at();

-- -----------------------------------------------------------------------------
-- La regla de aprobacion (R10; doc 02 §8.1)
--
-- Solo aplica al tipo `promocion`. El resto de novedades -- nuevo producto,
-- campana, evento, aviso -- se publica sin aprobacion, que es lo que pide la
-- ficha 6.5.
-- -----------------------------------------------------------------------------
create or replace function app.exigir_aprobacion_promocion()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.tipo = 'promocion' and new.estado = 'publicado' then

    -- Si ya estaba publicada y aprobada, no se vuelve a exigir: editar el texto
    -- de una promocion ya viva no deberia requerir aprobar de nuevo.
    if tg_op = 'UPDATE' and old.estado = 'publicado' and old.aprobada_por is not null then
      return new;
    end if;

    if not (select app.es_rol('administrador', 'superadmin')) then
      raise exception 'Las promociones requieren aprobacion de un administrador'
        using errcode = 'check_violation',
              hint = 'Guardala como `en_revision` y pide a un administrador que la publique.';
    end if;

    -- Queda constancia de quien aprobo y cuando, sin que la aplicacion tenga
    -- que acordarse de escribirlo.
    new.aprobada_por := auth.uid();
    new.aprobada_en  := now();
  end if;

  return new;
end;
$$;

comment on function app.exigir_aprobacion_promocion() is
  'Trigger BEFORE INSERT/UPDATE en novedades: solo administracion publica promociones (R10).';

create trigger novedades_exigir_aprobacion
  before insert or update on public.novedades
  for each row execute function app.exigir_aprobacion_promocion();

-- -----------------------------------------------------------------------------
-- Slides del carrusel (R2)
-- -----------------------------------------------------------------------------
create table public.slides (
  id               uuid primary key default gen_random_uuid(),
  titulo           text not null check (length(btrim(titulo)) > 0),
  subtitulo        text,
  imagen_url       text not null check (length(btrim(imagen_url)) > 0),
  -- Separada a proposito: una imagen apaisada de portada recortada a un celular
  -- deja el texto fuera de cuadro, y el movil es prioritario (R6).
  imagen_movil_url text,
  imagen_alt       text,
  enlace_url       text,
  texto_boton      text,
  orden            smallint not null default 0,
  estado           app.estado_publicacion not null default 'borrador',
  vigencia_inicio  timestamptz,
  vigencia_fin     timestamptz,
  es_demo          boolean not null default false,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  created_by       uuid references auth.users(id),
  updated_by       uuid references auth.users(id),
  deleted_at       timestamptz,

  constraint slide_vigencia_coherente check (
    vigencia_fin is null or vigencia_inicio is null or vigencia_fin > vigencia_inicio
  ),
  -- Un boton sin destino no lleva a ninguna parte, y un destino sin boton no se
  -- puede pulsar: o los dos o ninguno.
  constraint slide_boton_coherente check (
    (enlace_url is null and texto_boton is null)
    or (enlace_url is not null and texto_boton is not null)
  )
);

create index idx_slides_vigentes on public.slides (orden)
  where estado = 'publicado' and deleted_at is null;

create trigger slides_set_updated_at
  before update on public.slides
  for each row execute function app.set_updated_at();

-- -----------------------------------------------------------------------------
-- Guias (ficha 6.4). Formato: texto con imagenes.
-- -----------------------------------------------------------------------------
create table public.guias (
  id          uuid primary key default gen_random_uuid(),
  titulo      text not null check (length(btrim(titulo)) > 0),
  slug        text not null check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  resumen     text,
  contenido   text not null check (length(btrim(contenido)) > 0),
  imagen_url  text,
  orden       smallint not null default 0,
  estado      app.estado_publicacion not null default 'borrador',
  es_demo     boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  created_by  uuid references auth.users(id),
  updated_by  uuid references auth.users(id),
  deleted_at  timestamptz
);

comment on table public.guias is
  'Guias de la ficha 6.4. No tienen seccion propia: se publican dentro de /preguntas-frecuentes (doc 03 §4.1).';

create unique index idx_guias_slug on public.guias (slug) where deleted_at is null;

create trigger guias_set_updated_at
  before update on public.guias
  for each row execute function app.set_updated_at();

-- -----------------------------------------------------------------------------
-- Galeria
-- -----------------------------------------------------------------------------
create table public.galeria (
  id          uuid primary key default gen_random_uuid(),
  titulo      text,
  -- Texto alternativo obligatorio: estas imagenes comunican, no decoran, y sin
  -- `alt` real un lector de pantalla no transmite nada (doc 03 §3.4).
  alt         text not null check (length(btrim(alt)) > 0),
  ruta        text not null check (length(btrim(ruta)) > 0),
  categoria   text not null check (categoria in ('fachada', 'interior', 'atencion', 'hornos', 'productos')),
  orden       smallint not null default 0,
  estado      app.estado_publicacion not null default 'borrador',
  es_demo     boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  created_by  uuid references auth.users(id),
  updated_by  uuid references auth.users(id),
  deleted_at  timestamptz
);

create index idx_galeria_publicada on public.galeria (categoria, orden)
  where estado = 'publicado' and deleted_at is null;

create trigger galeria_set_updated_at
  before update on public.galeria
  for each row execute function app.set_updated_at();

-- -----------------------------------------------------------------------------
-- Preguntas frecuentes (ficha 5.9)
-- -----------------------------------------------------------------------------
create table public.faqs (
  id          uuid primary key default gen_random_uuid(),
  pregunta    text not null check (length(btrim(pregunta)) > 0),
  respuesta   text not null check (length(btrim(respuesta)) > 0),
  orden       smallint not null default 0,
  estado      app.estado_publicacion not null default 'publicado',
  es_demo     boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  created_by  uuid references auth.users(id),
  updated_by  uuid references auth.users(id),
  deleted_at  timestamptz
);

create index idx_faqs_publicadas on public.faqs (orden)
  where estado = 'publicado' and deleted_at is null;

create trigger faqs_set_updated_at
  before update on public.faqs
  for each row execute function app.set_updated_at();

-- -----------------------------------------------------------------------------
-- Testimonios
-- -----------------------------------------------------------------------------
create table public.testimonios (
  id          uuid primary key default gen_random_uuid(),
  nombre      text not null check (length(btrim(nombre)) > 0),
  texto       text not null check (length(btrim(texto)) > 0),
  -- No se pide foto ni apellido: son vecinos, no clientes de una plataforma.
  procedencia text,
  orden       smallint not null default 0,
  estado      app.estado_publicacion not null default 'borrador',
  es_demo     boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  created_by  uuid references auth.users(id),
  updated_by  uuid references auth.users(id),
  deleted_at  timestamptz
);

create index idx_testimonios_publicados on public.testimonios (orden)
  where estado = 'publicado' and deleted_at is null;

create trigger testimonios_set_updated_at
  before update on public.testimonios
  for each row execute function app.set_updated_at();

-- -----------------------------------------------------------------------------
-- Auditoria (R9)
-- -----------------------------------------------------------------------------
select app.auditar('public.novedades');
select app.auditar('public.slides');
select app.auditar('public.guias');
select app.auditar('public.galeria');
select app.auditar('public.faqs');
select app.auditar('public.testimonios');

-- =============================================================================
-- RLS (doc 02 §11)
-- =============================================================================
alter table public.novedades   enable row level security;
alter table public.slides      enable row level security;
alter table public.guias       enable row level security;
alter table public.galeria     enable row level security;
alter table public.faqs        enable row level security;
alter table public.testimonios enable row level security;

alter table public.novedades   force row level security;
alter table public.slides      force row level security;
alter table public.guias       force row level security;
alter table public.galeria     force row level security;
alter table public.faqs        force row level security;
alter table public.testimonios force row level security;

-- --- Lectura publica -------------------------------------------------------
-- Novedades y slides: publicados Y VIGENTES. La vigencia se comprueba aqui
-- ademas de archivarse por cron (0014): si el cron no corriera -- y no corre si
-- el proyecto se pausa --, el publico seguiria sin ver una promocion caducada.
-- Doble red a proposito.
create policy "publico ve novedades vigentes"
  on public.novedades for select to anon
  using (
    estado = 'publicado'
    and deleted_at is null
    and (vigencia_inicio is null or vigencia_inicio <= now())
    and (vigencia_fin    is null or vigencia_fin    >= now())
  );

create policy "publico ve slides vigentes"
  on public.slides for select to anon
  using (
    estado = 'publicado'
    and deleted_at is null
    and (vigencia_inicio is null or vigencia_inicio <= now())
    and (vigencia_fin    is null or vigencia_fin    >= now())
  );

create policy "publico ve guias publicadas"
  on public.guias for select to anon
  using (estado = 'publicado' and deleted_at is null);

create policy "publico ve la galeria publicada"
  on public.galeria for select to anon
  using (estado = 'publicado' and deleted_at is null);

create policy "publico ve las faqs publicadas"
  on public.faqs for select to anon
  using (estado = 'publicado' and deleted_at is null);

create policy "publico ve testimonios publicados"
  on public.testimonios for select to anon
  using (estado = 'publicado' and deleted_at is null);

-- --- Lectura autenticada: todo -----------------------------------------------
create policy "autenticado ve todas las novedades"
  on public.novedades for select to authenticated using (true);
create policy "autenticado ve todos los slides"
  on public.slides for select to authenticated using (true);
create policy "autenticado ve todas las guias"
  on public.guias for select to authenticated using (true);
create policy "autenticado ve toda la galeria"
  on public.galeria for select to authenticated using (true);
create policy "autenticado ve todas las faqs"
  on public.faqs for select to authenticated using (true);
create policy "autenticado ve todos los testimonios"
  on public.testimonios for select to authenticated using (true);

-- --- Escritura: los tres roles de contenido ----------------------------------
-- El ingeniero tambien crea y edita novedades, incluidas las promociones. Lo
-- que no puede es PUBLICARLAS, y de eso se encarga el trigger de arriba: la
-- distincion no cabe en una politica RLS, que decide sobre la fila entera y no
-- sobre la transicion de un estado a otro.
create policy "contenido gestiona novedades"
  on public.novedades for all to authenticated
  using      ((select app.es_rol('superadmin', 'administrador', 'ingeniero')))
  with check ((select app.es_rol('superadmin', 'administrador', 'ingeniero')));

create policy "contenido gestiona slides"
  on public.slides for all to authenticated
  using      ((select app.es_rol('superadmin', 'administrador', 'ingeniero')))
  with check ((select app.es_rol('superadmin', 'administrador', 'ingeniero')));

create policy "contenido gestiona guias"
  on public.guias for all to authenticated
  using      ((select app.es_rol('superadmin', 'administrador', 'ingeniero')))
  with check ((select app.es_rol('superadmin', 'administrador', 'ingeniero')));

create policy "contenido gestiona la galeria"
  on public.galeria for all to authenticated
  using      ((select app.es_rol('superadmin', 'administrador', 'ingeniero')))
  with check ((select app.es_rol('superadmin', 'administrador', 'ingeniero')));

create policy "contenido gestiona las faqs"
  on public.faqs for all to authenticated
  using      ((select app.es_rol('superadmin', 'administrador', 'ingeniero')))
  with check ((select app.es_rol('superadmin', 'administrador', 'ingeniero')));

create policy "contenido gestiona los testimonios"
  on public.testimonios for all to authenticated
  using      ((select app.es_rol('superadmin', 'administrador', 'ingeniero')))
  with check ((select app.es_rol('superadmin', 'administrador', 'ingeniero')));

-- =============================================================================
-- Las 5 preguntas frecuentes de la ficha 5.9.
--
-- Van en la migracion, como las categorias: la seccion existe en el sitio
-- publico desde el primer despliegue y sin estas filas estaria vacia.
--
-- Las preguntas son literales de la ficha. Las respuestas se redactan a partir
-- de lo que la propia ficha responde en otras secciones (2.5 frescura, 1.9
-- horarios, 1.11 reparto, 1.10 encargos, 6.1 integrales), y el negocio las
-- ajusta desde el panel.
-- =============================================================================
insert into public.faqs (pregunta, respuesta, orden) values
  ('¿Los productos son frescos?',
   'Sí. Elaboramos y vendemos el mismo día: el pan que compras salió del horno esa misma jornada.',
   1),
  ('¿Cuáles son los horarios de atención?',
   'Abrimos de lunes a sábado en dos turnos: de 4:00 a 13:00 y de 16:00 a 21:00. Domingos y feriados no hay atención.',
   2),
  ('¿Hacen delivery a mi zona? ¿Cuánto tiempo tarda?',
   'Sí, repartimos a toda Iquitos con movilidad propia. Escríbenos por WhatsApp con tu dirección y te confirmamos el tiempo de entrega.',
   3),
  ('¿Hacen pedidos por encargo? ¿Con cuánta anticipación?',
   'Sí, tomamos pedidos por encargo. Escríbenos por WhatsApp para coordinar la cantidad y la fecha de entrega.',
   4),
  ('¿Tienen productos integrales o sin azúcar?',
   'Tenemos una línea de panes integrales: molde integral, bico integral, bolitas integrales y tostadas integrales. Consúltanos por otras opciones.',
   5)
on conflict do nothing;

-- =============================================================================
-- Las 2 guias de la ficha 6.4.
--
-- El contenido es un punto de partida honesto a partir de lo que dice la ficha.
-- El negocio lo reescribe desde el panel cuando quiera.
-- =============================================================================
insert into public.guias (titulo, slug, resumen, contenido, orden, estado) values
  ('Cómo hacer un pedido', 'como-hacer-un-pedido',
   'Los pasos para pedir por WhatsApp y recibir en casa.',
   E'1. Revisa el catálogo y anota lo que quieres, con las cantidades.\n\n'
   '2. Escríbenos por WhatsApp con tu pedido, tu dirección y una referencia para encontrarte.\n\n'
   '3. Te confirmamos el total y el tiempo aproximado de entrega.\n\n'
   '4. Recibes tu pedido en la puerta de tu casa.\n\n'
   'Para pedidos grandes o por encargo, escríbenos con anticipación para coordinar la fecha.',
   1, 'publicado'),
  ('Cómo realizar un reclamo', 'como-realizar-un-reclamo',
   'Qué hacer si algo no salió como esperabas.',
   E'Si algo no salió como esperabas, queremos saberlo.\n\n'
   '1. Escríbenos por WhatsApp o acércate a la tienda.\n\n'
   '2. Cuéntanos qué pasó: qué producto era, qué día lo compraste y cuál fue el problema.\n\n'
   '3. Revisamos el caso y te respondemos con una solución.\n\n'
   'Tu reclamo nos sirve para mejorar. Gracias por tomarte el tiempo de contarnos.',
   2, 'publicado')
on conflict do nothing;
