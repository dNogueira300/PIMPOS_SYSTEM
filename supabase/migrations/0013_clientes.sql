-- =============================================================================
-- 0013_clientes.sql
-- Zonas de reparto, clientes, fotos de domicilio y consentimiento.
-- (R14, R19; doc 02 §10)
--
-- Este es el bloque con datos personales: nombre, celular, direccion y FOTO DEL
-- DOMICILIO de vecinos de Iquitos. Le aplica la Ley N.o 29733 de Proteccion de
-- Datos Personales, y eso cambia como se disena, no solo como se documenta:
--
--   - Ninguna politica `to anon`. Nada de aqui es publico, ni por error.
--   - Las fotos viven en un bucket PRIVADO y solo se sirven por URL firmada.
--     Aqui solo se guarda la ruta.
--   - El consentimiento se registra como un hecho con fecha, autor y VERSION
--     DEL TEXTO que se leyo.
--   - Todo cambio queda auditado.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Zonas de reparto
-- -----------------------------------------------------------------------------
create table public.zonas_reparto (
  id          uuid primary key default gen_random_uuid(),
  nombre      text not null check (length(btrim(nombre)) > 0),
  descripcion text,
  -- Previsto para cuando el negocio quiera diferenciar tarifas o tiempos por
  -- zona. Hoy reparten a toda la ciudad sin distincion (ficha 1.11).
  orden       smallint not null default 0,
  activo      boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  created_by  uuid references auth.users(id),
  updated_by  uuid references auth.users(id),
  deleted_at  timestamptz
);

create unique index idx_zonas_nombre on public.zonas_reparto (lower(nombre))
  where deleted_at is null;

create trigger zonas_reparto_set_updated_at
  before update on public.zonas_reparto
  for each row execute function app.set_updated_at();

-- -----------------------------------------------------------------------------
-- Clientes
-- -----------------------------------------------------------------------------
create table public.clientes (
  id              uuid primary key default gen_random_uuid(),
  nombre_completo text not null check (length(btrim(nombre_completo)) > 0),

  -- Es por donde se coordina el pedido (R17), asi que es obligatorio. Se
  -- valida solo la forma, no el operador: un numero mal escrito hace inutil
  -- la ficha entera, pero una validacion estricta bloquearia un fijo o un
  -- numero con prefijo.
  celular         text not null check (celular ~ '^[0-9+() -]{6,20}$'),

  direccion       text not null check (length(btrim(direccion)) > 0),
  -- "Frente al mercado", "casa de reja verde". En una ciudad donde muchas
  -- calles no estan numeradas, esto vale mas que la direccion.
  referencia      text,
  zona_id         uuid references public.zonas_reparto(id) on delete set null,

  -- PREVISTOS, sin usar todavia. La ficha 8.3 dice expresamente que la
  -- ubicacion se captura "solo con la direccion escrita": ni GPS, ni punto en
  -- el mapa. Estan aqui para que anadirlo mas adelante no exija migrar datos.
  latitud         numeric(10,7) check (latitud  is null or latitud  between -90  and 90),
  longitud        numeric(10,7) check (longitud is null or longitud between -180 and 180),

  observacion     text,
  activo          boolean not null default true,
  es_demo         boolean not null default false,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  created_by      uuid references auth.users(id),
  updated_by      uuid references auth.users(id),
  -- Borrado logico: un cliente dado de baja conserva su rastro en auditoria y
  -- no rompe los pedidos pasados que lo referencien.
  deleted_at      timestamptz
);

comment on table public.clientes is
  'Datos personales de clientes de reparto. Ley N.o 29733: sin lectura anonima, con consentimiento y auditoria.';
comment on column public.clientes.latitud is
  'Previsto. Hoy sin usar: la ficha 8.3 captura la ubicacion solo con la direccion escrita.';

-- -----------------------------------------------------------------------------
-- Busqueda por nombre: prioridad 1 de la ficha 8.6
--
-- Tiene que tolerar tildes y errores de tecleo: quien busca "Nunez" debe
-- encontrar "Núñez", y quien escribe "Rodrigez" debe encontrar "Rodríguez".
--
-- `unaccent` no es IMMUTABLE -- depende del diccionario cargado --, asi que
-- Postgres no la acepta en un indice. La envoltura de abajo fija el
-- diccionario explicitamente, que es lo que la hace determinista.
-- -----------------------------------------------------------------------------
create or replace function app.sin_tildes(p_texto text)
returns text
language sql
immutable
strict
parallel safe
set search_path = ''
as $$
  select extensions.unaccent('extensions.unaccent'::regdictionary, p_texto);
$$;

comment on function app.sin_tildes(text) is
  'unaccent con el diccionario fijado, para poder usarla en un indice. "Núñez" -> "Nunez".';

grant execute on function app.sin_tildes(text) to authenticated;

create index idx_clientes_nombre_trgm on public.clientes
  using gin (app.sin_tildes(lower(nombre_completo)) extensions.gin_trgm_ops);

-- Buscar por celular es la otra consulta del dia a dia: llega un pedido por
-- WhatsApp y hay que ver si el numero ya esta registrado.
create index idx_clientes_celular on public.clientes (celular) where deleted_at is null;
create index idx_clientes_zona    on public.clientes (zona_id) where activo and deleted_at is null;

create trigger clientes_set_updated_at
  before update on public.clientes
  for each row execute function app.set_updated_at();

-- -----------------------------------------------------------------------------
-- Fotos de la fachada (R14)
--
-- El limite de 3 es de la ficha 8.3, y es una RESTRICCION DE LA BASE, no una
-- validacion de formulario: la foto de la casa de alguien es dato personal, y
-- un limite que solo vive en la interfaz se salta con una peticion a la API.
-- -----------------------------------------------------------------------------
create table public.cliente_fotos (
  id         uuid primary key default gen_random_uuid(),
  cliente_id uuid not null references public.clientes(id) on delete cascade,
  -- Ruta en el bucket PRIVADO `clientes`, con la convencion de doc 02 §12:
  -- clientes/{cliente_id}/{orden}.webp
  ruta       text not null check (length(btrim(ruta)) > 0),
  descripcion text,
  orden      smallint not null check (orden between 1 and 3),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id),

  -- Junto con el check de arriba, esto impone el maximo de 3.
  unique (cliente_id, orden)
);

comment on table public.cliente_fotos is
  'Hasta 3 fotos de la fachada, en el bucket PRIVADO. El limite lo impone la base, no el formulario.';

create index idx_cliente_fotos_cliente on public.cliente_fotos (cliente_id, orden);

create trigger cliente_fotos_set_updated_at
  before update on public.cliente_fotos
  for each row execute function app.set_updated_at();

-- -----------------------------------------------------------------------------
-- Consentimiento (R19, Ley N.o 29733)
--
-- La ficha 8.4 acepta autorizacion VERBAL. Registrarla igualmente es lo que
-- respalda al negocio ante un reclamo: sin constancia, "nos dio permiso" es
-- solo la palabra de una parte.
--
-- `texto_version` es la pieza que suele faltar: guarda QUE se le leyo. Si el
-- texto de consentimiento cambia, se sabe exactamente que acepto cada persona.
-- -----------------------------------------------------------------------------
create table public.consentimientos (
  id             uuid primary key default gen_random_uuid(),
  cliente_id     uuid not null references public.clientes(id) on delete cascade,
  modo           text not null default 'verbal' check (modo in ('verbal', 'escrito', 'digital')),
  otorgado_en    timestamptz not null default now(),
  registrado_por uuid not null references auth.users(id) on delete restrict,
  texto_version  text not null check (length(btrim(texto_version)) > 0),
  -- Un consentimiento se puede retirar. No se borra la fila: se marca, porque
  -- la retirada tambien es un hecho que hay que poder demostrar.
  revocado_en    timestamptz,
  revocado_por   uuid references auth.users(id) on delete restrict,
  observacion    text,
  created_at     timestamptz not null default now(),

  constraint revocacion_coherente check (
    (revocado_en is null and revocado_por is null)
    or (revocado_en is not null and revocado_por is not null)
  )
);

comment on table public.consentimientos is
  'Constancia del permiso del cliente (ficha 8.4). `texto_version` guarda que se le leyo.';
comment on column public.consentimientos.texto_version is
  'Version del texto que se leyo al cliente. Si el texto cambia, se sabe que acepto cada uno.';

create index idx_consentimientos_cliente on public.consentimientos (cliente_id, otorgado_en desc);

-- Vista de conveniencia: que clientes tienen consentimiento vigente. Es la
-- consulta que hay que poder responder si alguien pregunta.
create view public.clientes_con_consentimiento
with (security_invoker = true) as
select c.id as cliente_id,
       c.nombre_completo,
       exists (
         select 1 from public.consentimientos k
          where k.cliente_id = c.id and k.revocado_en is null
       ) as tiene_consentimiento,
       (select max(k.otorgado_en) from public.consentimientos k
         where k.cliente_id = c.id and k.revocado_en is null) as otorgado_en
  from public.clientes c
 where c.deleted_at is null;

comment on view public.clientes_con_consentimiento is
  'Que clientes tienen consentimiento vigente. security_invoker: respeta la RLS.';

grant select on public.clientes_con_consentimiento to authenticated;

-- -----------------------------------------------------------------------------
-- Auditoria (R9)
--
-- El doc de stack §8 lo pide expresamente para datos de clientes: "Auditoria de
-- todo acceso y modificacion a datos de clientes". La modificacion queda
-- cubierta; el acceso de solo lectura no se registra, porque auditar cada
-- SELECT multiplicaria las filas sin aportar nada accionable en un negocio de
-- este tamano.
-- -----------------------------------------------------------------------------
select app.auditar('public.zonas_reparto');
select app.auditar('public.clientes');
select app.auditar('public.cliente_fotos');
select app.auditar('public.consentimientos');

-- =============================================================================
-- RLS (doc 02 §11)
--
-- Los CUATRO roles leen y registran clientes, repartidor incluido: es el unico
-- modulo al que entra. Ninguna politica `to anon`.
-- =============================================================================
alter table public.zonas_reparto    enable row level security;
alter table public.clientes         enable row level security;
alter table public.cliente_fotos    enable row level security;
alter table public.consentimientos  enable row level security;

alter table public.zonas_reparto    force row level security;
alter table public.clientes         force row level security;
alter table public.cliente_fotos    force row level security;
alter table public.consentimientos  force row level security;

create policy "reparto lee zonas"
  on public.zonas_reparto for select to authenticated
  using ((select app.es_rol('superadmin', 'administrador', 'ingeniero', 'repartidor')));
create policy "administracion gestiona zonas"
  on public.zonas_reparto for all to authenticated
  using      ((select app.es_rol('superadmin', 'administrador', 'ingeniero')))
  with check ((select app.es_rol('superadmin', 'administrador', 'ingeniero')));

create policy "reparto lee clientes"
  on public.clientes for select to authenticated
  using ((select app.es_rol('superadmin', 'administrador', 'ingeniero', 'repartidor')));
create policy "reparto gestiona clientes"
  on public.clientes for all to authenticated
  using      ((select app.es_rol('superadmin', 'administrador', 'ingeniero', 'repartidor')))
  with check ((select app.es_rol('superadmin', 'administrador', 'ingeniero', 'repartidor')));

create policy "reparto lee fotos de clientes"
  on public.cliente_fotos for select to authenticated
  using ((select app.es_rol('superadmin', 'administrador', 'ingeniero', 'repartidor')));
create policy "reparto gestiona fotos de clientes"
  on public.cliente_fotos for all to authenticated
  using      ((select app.es_rol('superadmin', 'administrador', 'ingeniero', 'repartidor')))
  with check ((select app.es_rol('superadmin', 'administrador', 'ingeniero', 'repartidor')));

create policy "reparto lee consentimientos"
  on public.consentimientos for select to authenticated
  using ((select app.es_rol('superadmin', 'administrador', 'ingeniero', 'repartidor')));
create policy "reparto registra consentimientos"
  on public.consentimientos for insert to authenticated
  with check ((select app.es_rol('superadmin', 'administrador', 'ingeniero', 'repartidor')));
-- Revocar es un UPDATE, y solo lo hace administracion: retirar el permiso de
-- alguien es una decision, no una correccion de tecleo.
create policy "administracion revoca consentimientos"
  on public.consentimientos for update to authenticated
  using      ((select app.es_rol('superadmin', 'administrador')))
  with check ((select app.es_rol('superadmin', 'administrador')));

-- Un consentimiento no se borra: la constancia de que se otorgo es justamente
-- lo que respalda al negocio. Para retirarlo esta `revocado_en`.
revoke delete on public.consentimientos from anon, authenticated;

-- =============================================================================
-- Zonas de reparto de Iquitos.
--
-- La ficha 1.11 dice que reparten "a cada rincon de la ciudad, en todas las
-- zonas y distritos", sin dar una lista. Se cargan los cuatro distritos que
-- forman Iquitos como punto de partida; el negocio los ajusta desde el panel
-- si quiere trabajar con zonas propias ("centro", "carretera").
-- =============================================================================
insert into public.zonas_reparto (nombre, descripcion, orden) values
  ('Iquitos',            'Distrito de Iquitos, el cercado.',     1),
  ('Belén',              'Distrito de Belén, donde está el local.', 2),
  ('Punchana',           'Distrito de Punchana.',                3),
  ('San Juan Bautista',  'Distrito de San Juan Bautista.',       4)
on conflict do nothing;
