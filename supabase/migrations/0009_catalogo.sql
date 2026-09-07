-- =============================================================================
-- 0009_catalogo.sql
-- Categorias, productos, variantes, imagenes e historial de precios.
-- (R3 precios visibles, R22 preparado para e-commerce; doc 02 §7)
--
-- La decision que ordena todo este archivo: el precio vive en la VARIANTE, no
-- en el producto. El catalogo real ya tiene variantes -- "Hamburguesa grande
-- de S/ 0.30" y "de S/ 0.40" son la misma familia con distinto precio -- y
-- partir un producto plano en variantes mas adelante, con datos cargados y
-- pedidos apuntando a ellos, es la migracion mas dolorosa de un e-commerce.
-- Se hace ahora, que no cuesta nada.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Categorias (ficha 6.1)
-- -----------------------------------------------------------------------------
create table public.categorias_producto (
  id          uuid primary key default gen_random_uuid(),
  nombre      text not null check (length(btrim(nombre)) > 0),
  slug        text not null check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  descripcion text,
  -- Se usa como respaldo en la tarjeta de un producto que aun no tiene foto
  -- propia: de los ~36 del catalogo solo 5 la tienen (doc de stack §1.1).
  imagen_url  text,
  orden       smallint not null default 0,
  estado      app.estado_publicacion not null default 'publicado',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  created_by  uuid references auth.users(id),
  updated_by  uuid references auth.users(id),
  deleted_at  timestamptz
);

comment on table public.categorias_producto is
  'Las 6 categorias de la ficha 6.1. Agrupan el catalogo y dan el filtro de /productos.';

-- El slug va en la URL (/productos?categoria=panes-clasicos), asi que tiene que
-- ser unico -- pero solo entre las vivas: borrar una categoria no deberia
-- reservar su slug para siempre.
create unique index idx_categorias_slug on public.categorias_producto (slug)
  where deleted_at is null;

create trigger categorias_producto_set_updated_at
  before update on public.categorias_producto
  for each row execute function app.set_updated_at();

-- -----------------------------------------------------------------------------
-- Productos
-- -----------------------------------------------------------------------------
create table public.productos (
  id           uuid primary key default gen_random_uuid(),
  categoria_id uuid not null references public.categorias_producto(id) on delete restrict,
  nombre       text not null check (length(btrim(nombre)) > 0),
  slug         text not null check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  descripcion  text,
  -- Los 6-8 que salen en la portada (ficha 6.2, doc 03 §4.2 bloque 4).
  destacado    boolean not null default false,
  estado       app.estado_publicacion not null default 'borrador',
  orden        integer not null default 0,
  -- Permite purgar de un golpe el contenido de relleno cuando llegue el real.
  es_demo      boolean not null default false,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  created_by   uuid references auth.users(id),
  updated_by   uuid references auth.users(id),
  deleted_at   timestamptz
);

comment on table public.productos is
  'La familia de producto. El precio no esta aqui: esta en cada variante.';
comment on column public.productos.estado is
  'Un producto solo es visible para el publico en `publicado`. Nace en `borrador`.';

-- `on delete restrict` en la categoria y no `cascade`: borrar una categoria no
-- puede llevarse por delante sus productos sin que nadie lo note.

create unique index idx_productos_slug on public.productos (slug)
  where deleted_at is null;

-- El sitio publico solo consulta lo publicado, y ese es una fraccion del total:
-- el indice parcial es mas pequeno y mas rapido que uno completo.
create index idx_productos_publicados on public.productos (categoria_id, orden)
  where estado = 'publicado' and deleted_at is null;
create index idx_productos_destacados on public.productos (orden)
  where destacado and estado = 'publicado' and deleted_at is null;

create trigger productos_set_updated_at
  before update on public.productos
  for each row execute function app.set_updated_at();

-- -----------------------------------------------------------------------------
-- Variantes: lo que de verdad se vende y tiene precio
-- -----------------------------------------------------------------------------
create table public.producto_variantes (
  id                uuid primary key default gen_random_uuid(),
  producto_id       uuid not null references public.productos(id) on delete cascade,
  nombre            text not null check (length(btrim(nombre)) > 0),
  sku               text,

  -- numeric(12,4) y no (10,2), ni float jamas. Hay productos a S/ 0.10: con dos
  -- decimales no se puede expresar un descuento del 15 % ni un costo unitario
  -- derivado del kardex sin arrastrar error de redondeo. Y `float` no
  -- representa 0.10 de forma exacta, que en dinero es inaceptable.
  precio            numeric(12,4) not null check (precio >= 0),
  moneda            char(3) not null default 'PEN' check (moneda ~ '^[A-Z]{3}$'),

  unidad_venta      text not null default 'unidad'
                      check (unidad_venta in ('unidad', 'docena', 'kilo', 'bolsa', 'paquete', 'botella')),
  es_predeterminada boolean not null default false,
  activo            boolean not null default true,
  -- En que orden se listan dentro de su producto ("Chico" antes que "Grande").
  orden             smallint not null default 0,

  -- Previstos para el e-commerce (R22). Sin usar todavia: hoy el pedido va por
  -- WhatsApp y no hay carrito. Estan aqui para que anadirlo sea agregar
  -- logica, no migrar datos.
  stock_disponible  integer check (stock_disponible is null or stock_disponible >= 0),
  peso_gramos       integer check (peso_gramos is null or peso_gramos > 0),

  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  created_by        uuid references auth.users(id),
  updated_by        uuid references auth.users(id),
  deleted_at        timestamptz
);

comment on table public.producto_variantes is
  'Lo que se vende y tiene precio. Un producto tiene una variante o varias.';
comment on column public.producto_variantes.stock_disponible is
  'Previsto para e-commerce (R22). Hoy sin usar: el pedido va por WhatsApp.';

create unique index idx_variantes_sku on public.producto_variantes (sku)
  where sku is not null and deleted_at is null;

-- Como mucho una predeterminada por producto: es la que la tarjeta del catalogo
-- muestra por defecto, y dos candidatas darian un resultado arbitrario.
create unique index idx_variantes_una_predeterminada
  on public.producto_variantes (producto_id)
  where es_predeterminada and deleted_at is null;

create index idx_variantes_producto on public.producto_variantes (producto_id, orden)
  where deleted_at is null;

create trigger producto_variantes_set_updated_at
  before update on public.producto_variantes
  for each row execute function app.set_updated_at();

-- -----------------------------------------------------------------------------
-- Imagenes
-- -----------------------------------------------------------------------------
create table public.producto_imagenes (
  id           uuid primary key default gen_random_uuid(),
  producto_id  uuid not null references public.productos(id) on delete cascade,
  -- Una imagen puede ser de una variante concreta ("con ajonjoli") o del
  -- producto entero. `set null` y no `cascade`: si se borra la variante, la
  -- foto sigue sirviendo para el producto.
  variante_id  uuid references public.producto_variantes(id) on delete set null,
  -- Ruta en el bucket `productos`, con la convencion de doc 02 §12:
  -- productos/{producto_id}/{uuid}.webp. Poner el id de la entidad en la ruta
  -- permite escribir politicas de Storage que dependan del registro dueno.
  ruta         text not null check (length(btrim(ruta)) > 0),
  -- Texto alternativo real, no decorativo: estas imagenes comunican (doc 03 §3.4).
  alt          text,
  orden        smallint not null default 0,
  es_principal boolean not null default false,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  created_by   uuid references auth.users(id),
  updated_by   uuid references auth.users(id)
);

create unique index idx_imagenes_una_principal
  on public.producto_imagenes (producto_id)
  where es_principal;

create index idx_imagenes_producto on public.producto_imagenes (producto_id, orden);

create trigger producto_imagenes_set_updated_at
  before update on public.producto_imagenes
  for each row execute function app.set_updated_at();

-- -----------------------------------------------------------------------------
-- Historial de precios (doc 02 §7.2)
--
-- El negocio necesita saber cuando subio cada precio, y eso no se puede
-- reconstruir despues: si solo se guarda el precio actual, el anterior se
-- pierde en el momento de cambiarlo.
-- -----------------------------------------------------------------------------
create table public.precio_historial (
  -- Identidad secuencial y no uuid, a proposito. `vigente_desde` toma `now()`,
  -- que es la hora de INICIO de la transaccion: dos cambios de precio dentro de
  -- la misma quedan con la marca identica y no habria forma de saber cual fue
  -- antes. Con una secuencia, el orden de insercion queda garantizado siempre.
  -- Mismo criterio que app.auditoria.
  id             bigint generated always as identity primary key,
  variante_id    uuid not null references public.producto_variantes(id) on delete cascade,
  precio         numeric(12,4) not null check (precio >= 0),
  moneda         char(3) not null default 'PEN',
  vigente_desde  timestamptz not null default now(),
  registrado_por uuid references auth.users(id)
);

comment on table public.precio_historial is
  'Un registro por cada precio que ha tenido una variante. Lo escribe un trigger.';

-- El orden util es "el precio mas reciente de esta variante", y quien desempata
-- es el id, no la fecha.
create index idx_precio_historial_variante
  on public.precio_historial (variante_id, id desc);

create or replace function app.registrar_precio()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- Al crear la variante se registra su precio de partida: sin esto el
  -- historial empezaria en el primer cambio y no se sabria el precio original.
  if tg_op = 'INSERT' or new.precio is distinct from old.precio then
    insert into public.precio_historial (variante_id, precio, moneda, registrado_por)
    values (new.id, new.precio, new.moneda, auth.uid());
  end if;

  return null;
end;
$$;

comment on function app.registrar_precio() is
  'Trigger AFTER INSERT/UPDATE en producto_variantes: guarda cada precio en precio_historial.';

revoke execute on function app.registrar_precio() from public, anon, authenticated;

create trigger variantes_registrar_precio
  after insert or update of precio on public.producto_variantes
  for each row execute function app.registrar_precio();

-- -----------------------------------------------------------------------------
-- Auditoria (R9)
-- -----------------------------------------------------------------------------
select app.auditar('public.categorias_producto');
select app.auditar('public.productos');
select app.auditar('public.producto_variantes');
select app.auditar('public.producto_imagenes');
-- `precio_historial` no se audita: ya ES un registro historico, y auditarlo
-- duplicaria cada cambio de precio en dos tablas.

-- =============================================================================
-- RLS (doc 02 §11)
--
-- El publico ve solo lo publicado y no borrado. Los tres roles de contenido
-- escriben. El repartidor no toca el catalogo.
-- =============================================================================
alter table public.categorias_producto enable row level security;
alter table public.productos           enable row level security;
alter table public.producto_variantes  enable row level security;
alter table public.producto_imagenes   enable row level security;
alter table public.precio_historial    enable row level security;

alter table public.categorias_producto force row level security;
alter table public.productos           force row level security;
alter table public.producto_variantes  force row level security;
alter table public.producto_imagenes   force row level security;
alter table public.precio_historial    force row level security;

-- --- Lectura publica -------------------------------------------------------
create policy "publico ve categorias publicadas"
  on public.categorias_producto for select to anon
  using (estado = 'publicado' and deleted_at is null);

create policy "publico ve productos publicados"
  on public.productos for select to anon
  using (estado = 'publicado' and deleted_at is null);

-- Una variante se ve si su producto se ve. Sin esta comprobacion, el precio de
-- un producto en borrador seria consultable por la API aunque el producto no.
create policy "publico ve variantes de productos publicados"
  on public.producto_variantes for select to anon
  using (
    activo
    and deleted_at is null
    and exists (
      select 1 from public.productos p
       where p.id = producto_id
         and p.estado = 'publicado'
         and p.deleted_at is null
    )
  );

create policy "publico ve imagenes de productos publicados"
  on public.producto_imagenes for select to anon
  using (
    exists (
      select 1 from public.productos p
       where p.id = producto_id
         and p.estado = 'publicado'
         and p.deleted_at is null
    )
  );

-- El historial de precios NO es publico: a un visitante no le incumbe cuando
-- subio un precio, y publicarlo daria una foto de la politica comercial.

-- --- Lectura autenticada ---------------------------------------------------
create policy "autenticado ve todas las categorias"
  on public.categorias_producto for select to authenticated using (true);
create policy "autenticado ve todos los productos"
  on public.productos for select to authenticated using (true);
create policy "autenticado ve todas las variantes"
  on public.producto_variantes for select to authenticated using (true);
create policy "autenticado ve todas las imagenes"
  on public.producto_imagenes for select to authenticated using (true);

-- El historial de precios solo lo lee quien gestiona el catalogo.
create policy "contenido lee el historial de precios"
  on public.precio_historial for select to authenticated
  using ((select app.es_rol('superadmin', 'administrador', 'ingeniero')));

-- --- Escritura: los tres roles de contenido --------------------------------
create policy "contenido gestiona categorias"
  on public.categorias_producto for all to authenticated
  using      ((select app.es_rol('superadmin', 'administrador', 'ingeniero')))
  with check ((select app.es_rol('superadmin', 'administrador', 'ingeniero')));

create policy "contenido gestiona productos"
  on public.productos for all to authenticated
  using      ((select app.es_rol('superadmin', 'administrador', 'ingeniero')))
  with check ((select app.es_rol('superadmin', 'administrador', 'ingeniero')));

create policy "contenido gestiona variantes"
  on public.producto_variantes for all to authenticated
  using      ((select app.es_rol('superadmin', 'administrador', 'ingeniero')))
  with check ((select app.es_rol('superadmin', 'administrador', 'ingeniero')));

create policy "contenido gestiona imagenes"
  on public.producto_imagenes for all to authenticated
  using      ((select app.es_rol('superadmin', 'administrador', 'ingeniero')))
  with check ((select app.es_rol('superadmin', 'administrador', 'ingeniero')));

-- Sin politicas de escritura sobre `precio_historial`: lo escribe el trigger,
-- que es SECURITY DEFINER. Un historial que se puede editar a mano no es un
-- historial -- mismo criterio que la auditoria.

-- =============================================================================
-- Las 6 categorias de la ficha 6.1.
--
-- Van en la migracion y no en una semilla porque el sitio publico agrupa el
-- catalogo por ellas y las usa en el filtro de /productos: sin estas filas la
-- pagina de productos no tendria por donde empezar. `db push` no aplica
-- semillas (leccion de 0004).
--
-- Los ejemplos de cada una salen literales de la tabla de la ficha.
-- =============================================================================
insert into public.categorias_producto (nombre, slug, descripcion, orden) values
  ('Panes clásicos',   'panes-clasicos',
   'Pan bico, pan hamburguesa, pan leche, pan cerveza y los de siempre.', 1),
  ('Panes especiales', 'panes-especiales',
   'Bizcocho, pan con ajonjolí, ciabatta y carioco.', 2),
  ('Panes integrales', 'panes-integrales',
   'Bolitas integrales, bico integral, molde integral y tostadas integrales.', 3),
  ('Panes tostados',   'panes-tostados',
   'Molde tostado, bico tostado, rosca y cartera.', 4),
  ('Snacks',           'snacks',
   'Dulce rojo, rosquillas de mantequilla, rosquillas de almidón y kekitos.', 5),
  ('Bodega',           'bodega',
   'Abarrotes y otros productos de la bodega: pan molido, arroz y más.', 6)
on conflict do nothing;
