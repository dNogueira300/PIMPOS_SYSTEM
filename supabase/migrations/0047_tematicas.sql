-- =============================================================================
-- 0047 · Temáticas de temporada (plan 08, T1)
--
-- Navidad, y después Día de la Madre, San Juan…: el sitio público se viste de
-- fiesta y saca al frente lo de la temporada. Hay productos que SOLO se venden
-- en su fecha: se ven mientras su temática está activa y, fuera de ella, el
-- público no los ve ni por la vista ni leyendo las tablas.
--
-- Decisiones de Dan del 19/11/2026 (spec en «Plan de Desarrollo 08»):
--   · Una temática se enciende sola por fechas y también a mano. Lo manual
--     caduca en la fecha de fin de la campaña, y cambiar las fechas lo quita.
--   · Una sola activa a la vez: la base rechaza el cruce.
--   · Solo superadmin y administración las cambian.
--   · El catálogo de temáticas lo crean las migraciones: cada una necesita su
--     diseño en el código, así que el negocio no crea temáticas.
--
-- La pregunta «¿cuál está activa hoy?» tiene UNA respuesta, aquí
-- (`app.tematica_activa_id`). La usan las vistas, las políticas de `anon` y el
-- panel, así que no pueden contradecirse.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Tablas
-- -----------------------------------------------------------------------------

-- Para un `check`: solo admite funciones inmutables, y un `check` no puede
-- llevar una subconsulta.
create or replace function app.mensajes_cinta_validos(p_mensajes text[])
returns boolean
language sql
immutable
set search_path = ''
as $$
  select coalesce(bool_and(length(btrim(m)) between 1 and 60), true)
    from unnest(p_mensajes) as m;
$$;

create table public.tematicas (
  id           uuid primary key default gen_random_uuid(),
  slug         text not null unique,
  nombre       text not null check (length(btrim(nombre)) > 0),
  -- Días de Iquitos, los dos incluidos.
  inicio       date not null,
  fin          date not null,
  -- Para la cuenta regresiva («Faltan 12 días para Navidad»). Opcional.
  fecha_evento date,
  encendido    text not null default 'fechas',
  -- Cuándo se puso el modo manual y hasta cuándo vale (la fecha de fin del
  -- momento en que se puso). Los pone el trigger, nunca la aplicación.
  encendido_desde date,
  encendido_hasta date,
  texto_aviso    text check (texto_aviso is null or length(texto_aviso) <= 120),
  mensajes_cinta text[] not null default '{}',
  titulo         text check (titulo is null or length(titulo) <= 80),
  entradilla     text check (entradilla is null or length(entradilla) <= 240),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  created_by   uuid references auth.users(id),
  updated_by   uuid references auth.users(id),

  -- Una temática sin su diseño en el código no se puede crear. Cada temática
  -- nueva amplía esta lista en su propia migración.
  constraint tematicas_slug_conocido check (slug in ('navidad')),
  constraint tematicas_fechas_en_orden check (fin >= inicio),
  constraint tematicas_encendido_conocido check (encendido in ('fechas', 'encendida', 'apagada')),
  constraint tematicas_encendido_completo check (
    (encendido = 'fechas') = (encendido_desde is null and encendido_hasta is null)
    and (encendido_desde is null) = (encendido_hasta is null)
  ),
  constraint tematicas_cinta_corta check (
    cardinality(mensajes_cinta) <= 6 and app.mensajes_cinta_validos(mensajes_cinta)
  )
);

comment on table public.tematicas is
  'Las temáticas de temporada del sitio público (Navidad…). Las crean las migraciones; el panel edita fechas, encendido, textos y productos.';
comment on column public.tematicas.encendido is
  '«fechas»: activa entre inicio y fin. «encendida»/«apagada»: a mano, hasta encendido_hasta; después mandan las fechas.';

create table public.tematica_productos (
  id             uuid primary key default gen_random_uuid(),
  tematica_id    uuid not null references public.tematicas(id) on delete cascade,
  producto_id    uuid not null references public.productos(id) on delete cascade,
  -- Solo se vende en esta temporada: fuera de ella, el público no lo ve.
  solo_temporada boolean not null default false,
  orden          integer not null default 0,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  created_by     uuid references auth.users(id),
  updated_by     uuid references auth.users(id),
  unique (tematica_id, producto_id)
);

comment on table public.tematica_productos is
  'Los productos que salen en la sección de temporada de cada temática, y cuáles solo se venden en ella.';

create index idx_tematica_productos_producto on public.tematica_productos (producto_id)
  where solo_temporada;

-- -----------------------------------------------------------------------------
-- ¿Cuál está activa hoy?
--
-- `security definer`: el público solo puede leer la temática activa, y para
-- saber cuál es hay que mirarlas todas.
-- -----------------------------------------------------------------------------
create or replace function app.tematica_activa_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select t.id
    from public.tematicas t,
         lateral (select (now() at time zone 'America/Lima')::date as hoy) h
   where case
           when t.encendido <> 'fechas' and h.hoy <= t.encendido_hasta then t.encendido = 'encendida'
           else h.hoy between t.inicio and t.fin
         end
   order by t.inicio
   limit 1;
$$;
comment on function app.tematica_activa_id() is
  'La temática activa hoy (día de Iquitos), o NULL. Lo manual manda hasta encendido_hasta; después, las fechas.';
revoke execute on function app.tematica_activa_id() from public;
grant execute on function app.tematica_activa_id() to anon, authenticated;

-- Un producto se ve si no es solo de temporada en ninguna temática, o si lo es
-- en la que está activa. `security definer` por lo mismo: el público no lee las
-- filas de las temáticas apagadas.
create or replace function app.producto_en_temporada(p_producto uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select not exists (
           select 1 from public.tematica_productos tp
            where tp.producto_id = p_producto and tp.solo_temporada
         )
      or exists (
           select 1 from public.tematica_productos tp
            where tp.producto_id = p_producto and tp.solo_temporada
              and tp.tematica_id = app.tematica_activa_id()
         );
$$;
comment on function app.producto_en_temporada(uuid) is
  'Falso solo para un producto «solo de temporada» cuya temática no está activa hoy.';
revoke execute on function app.producto_en_temporada(uuid) from public;
grant execute on function app.producto_en_temporada(uuid) to anon, authenticated;

-- -----------------------------------------------------------------------------
-- Las reglas de fechas y modo
-- -----------------------------------------------------------------------------
create or replace function app.tematicas_reglas()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_hoy  date := (now() at time zone 'America/Lima')::date;
  v_otra text;
begin
  -- Cambiar las fechas devuelve la temática a «según fechas», salvo que el
  -- mismo cambio ponga un modo nuevo: apagarla un año y luego poner las fechas
  -- del siguiente no puede dejarla apagada también esa campaña.
  if tg_op = 'UPDATE'
     and (new.inicio is distinct from old.inicio or new.fin is distinct from old.fin)
     and new.encendido = old.encendido then
    new.encendido := 'fechas';
  end if;

  if new.encendido = 'fechas' then
    new.encendido_desde := null;
    new.encendido_hasta := null;
  elsif tg_op = 'INSERT' or new.encendido is distinct from old.encendido or new.encendido_desde is null then
    new.encendido_desde := v_hoy;
    new.encendido_hasta := new.fin;
  end if;

  if new.encendido = 'encendida' and new.fin < v_hoy then
    raise exception 'Las fechas de esta campaña ya pasaron: pon primero las de este año.'
      using errcode = 'P0001';
  end if;

  -- Una sola activa a la vez. La ventana de una temática va de su inicio (o
  -- del día en que se encendió a mano, si fue antes) a su fin. El cerrojo evita
  -- que dos guardados a la vez se crucen sin verse.
  lock table public.tematicas in share row exclusive mode;
  select t.nombre into v_otra
    from public.tematicas t
   where t.id <> new.id
     and daterange(
           least(t.inicio, case when t.encendido = 'encendida' and v_hoy <= t.encendido_hasta
                                then t.encendido_desde else t.inicio end),
           t.fin, '[]')
      && daterange(
           least(new.inicio, case when new.encendido = 'encendida' then new.encendido_desde else new.inicio end),
           new.fin, '[]')
   limit 1;
  if v_otra is not null then
    raise exception 'Las fechas se cruzan con «%». Cambia las fechas de una de las dos.', v_otra
      using errcode = 'P0001';
  end if;

  return new;
end;
$$;

create trigger tematicas_reglas
  before insert or update on public.tematicas
  for each row execute function app.tematicas_reglas();
create trigger tematicas_set_updated_at
  before update on public.tematicas
  for each row execute function app.set_updated_at();
create trigger tematica_productos_set_updated_at
  before update on public.tematica_productos
  for each row execute function app.set_updated_at();

-- -----------------------------------------------------------------------------
-- Navidad, con sus textos de partida. Antes de la autoría y la auditoría: es el
-- estado de partida, no un cambio que hiciera una persona (trampa de 0024).
-- -----------------------------------------------------------------------------
insert into public.tematicas (slug, nombre, inicio, fin, fecha_evento, texto_aviso, mensajes_cinta, titulo, entradilla)
values (
  'navidad', 'Navidad', '2026-12-01', '2026-12-26', '2026-12-25',
  'Ya hay panetón: pídelo por WhatsApp y te lo llevamos',
  array['Feliz Navidad', 'Panetón recién horneado', 'Delivery a todo Iquitos', 'Pídelo por WhatsApp'],
  'Lo de esta Navidad',
  'Lo que se hornea para estas fechas, con su precio a la vista.'
);

-- 0026 solo cubrió las tablas que existían entonces.
create trigger tematicas_sellar_autoria
  before insert or update on public.tematicas
  for each row execute function app.sellar_autoria();
create trigger tematica_productos_sellar_autoria
  before insert or update on public.tematica_productos
  for each row execute function app.sellar_autoria();
select app.auditar('public.tematicas');
select app.auditar('public.tematica_productos');

-- -----------------------------------------------------------------------------
-- RLS
-- -----------------------------------------------------------------------------
alter table public.tematicas enable row level security;
alter table public.tematica_productos enable row level security;

create policy "autenticado ve las temáticas"
  on public.tematicas for select to authenticated using (true);
-- El público solo ve la activa: los textos de la próxima campaña no se
-- adelantan.
create policy "publico ve la temática activa"
  on public.tematicas for select to anon
  using (id = (select app.tematica_activa_id()));
-- Sin `insert` ni `delete`: el catálogo lo crean las migraciones.
create policy "administracion edita las temáticas"
  on public.tematicas for update to authenticated
  using      ((select app.es_rol('superadmin', 'administrador')))
  with check ((select app.es_rol('superadmin', 'administrador')));

create policy "autenticado ve los productos de temporada"
  on public.tematica_productos for select to authenticated using (true);
create policy "publico ve los productos de la temática activa"
  on public.tematica_productos for select to anon
  using (tematica_id = (select app.tematica_activa_id()));
create policy "administracion gestiona los productos de temporada"
  on public.tematica_productos for all to authenticated
  using      ((select app.es_rol('superadmin', 'administrador')))
  with check ((select app.es_rol('superadmin', 'administrador')));

-- -----------------------------------------------------------------------------
-- El catálogo público respeta la temporada (Punto 5 del plan)
--
-- La condición va en la vista Y en las políticas de `anon`: sin estas, el
-- producto se podría leer pidiendo la tabla directamente por la API.
-- -----------------------------------------------------------------------------
drop policy "publico ve productos publicados" on public.productos;
create policy "publico ve productos publicados"
  on public.productos for select to anon
  using (estado = 'publicado' and deleted_at is null and app.producto_en_temporada(id));

drop policy "publico ve variantes de productos publicados" on public.producto_variantes;
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
         and app.producto_en_temporada(p.id)
    )
  );

drop policy "publico ve imagenes de productos publicados" on public.producto_imagenes;
create policy "publico ve imagenes de productos publicados"
  on public.producto_imagenes for select to anon
  using (
    exists (
      select 1 from public.productos p
       where p.id = producto_id
         and p.estado = 'publicado'
         and p.deleted_at is null
         and app.producto_en_temporada(p.id)
    )
  );

-- La vista se reemplaza con las mismas columnas, en el mismo orden, y repite
-- `security_invoker` y el `where` de publicado (las dos reglas de 0016),
-- ahora con la temporada.
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
  and p.deleted_at is null
  and app.producto_en_temporada(p.id);

comment on view public.productos_publicos is
  'Una fila por producto publicado y en temporada, con categoria, rango de precios, variante predeterminada, imagen principal y todas sus presentaciones (R3).';

-- -----------------------------------------------------------------------------
-- Vistas
-- -----------------------------------------------------------------------------

-- Para el panel: si está activa y qué modo manda de verdad (un modo manual
-- caducado ya no manda).
create view public.tematicas_panel
with (security_invoker = true) as
select
  t.*,
  (t.id = app.tematica_activa_id()) as activa,
  case
    when t.encendido <> 'fechas' and (now() at time zone 'America/Lima')::date <= t.encendido_hasta then t.encendido
    else 'fechas'
  end as encendido_vigente
from public.tematicas t;
comment on view public.tematicas_panel is
  'Las temáticas con su estado de hoy, para el panel.';
revoke all on public.tematicas_panel from anon;
grant select on public.tematicas_panel to authenticated;

-- Para el sitio: la temática activa, una fila o ninguna.
create view public.tematica_publica
with (security_invoker = true) as
select t.slug, t.nombre, t.fecha_evento, t.texto_aviso, t.mensajes_cinta, t.titulo, t.entradilla
  from public.tematicas t
 where t.id = app.tematica_activa_id();
comment on view public.tematica_publica is
  'La temática activa hoy, con sus textos. Vacía si no hay ninguna.';
grant select on public.tematica_publica to anon, authenticated;

-- Los productos de la sección de temporada, en su orden. Sale de
-- `productos_publicos`, así que ya respeta lo publicado y la temporada.
create view public.productos_de_temporada
with (security_invoker = true) as
select pp.*, tp.orden as orden_temporada
  from public.productos_publicos pp
  join public.tematica_productos tp on tp.producto_id = pp.id
 where tp.tematica_id = app.tematica_activa_id();
comment on view public.productos_de_temporada is
  'Los productos de la sección de temporada de la temática activa, en su orden.';
grant select on public.productos_de_temporada to anon, authenticated;

-- -----------------------------------------------------------------------------
-- Guardar desde el panel: la temática y sus productos, todo o nada
-- -----------------------------------------------------------------------------
create or replace function public.guardar_tematica(p_tematica uuid, p_datos jsonb, p_productos jsonb)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  -- La RLS ya lo niega, pero un `update` negado no da error: devuelve cero
  -- filas. Aquí se dice.
  if not (select app.es_rol('superadmin', 'administrador')) then
    raise exception 'Solo la administración puede cambiar las temáticas.' using errcode = '42501';
  end if;

  update public.tematicas
     set inicio         = (p_datos ->> 'inicio')::date,
         fin            = (p_datos ->> 'fin')::date,
         fecha_evento   = nullif(p_datos ->> 'fecha_evento', '')::date,
         encendido           = coalesce(p_datos ->> 'encendido', 'fechas'),
         texto_aviso    = nullif(btrim(p_datos ->> 'texto_aviso'), ''),
         mensajes_cinta = coalesce(
                            array(select btrim(m)
                                    from jsonb_array_elements_text(coalesce(p_datos -> 'mensajes_cinta', '[]'::jsonb)) as m
                                   where btrim(m) <> ''),
                            '{}'),
         titulo         = nullif(btrim(p_datos ->> 'titulo'), ''),
         entradilla     = nullif(btrim(p_datos ->> 'entradilla'), '')
   where id = p_tematica;
  if not found then
    raise exception 'Esa temática ya no existe. Recarga la página.' using errcode = 'P0001';
  end if;

  -- Sin borrar y volver a crear lo que no cambia: así el Historial dice qué
  -- producto entró o salió, y no reescribe todos en cada «Guardar».
  delete from public.tematica_productos tp
   where tp.tematica_id = p_tematica
     and tp.producto_id not in (
           select (e ->> 'producto_id')::uuid
             from jsonb_array_elements(coalesce(p_productos, '[]'::jsonb)) as e);

  insert into public.tematica_productos (tematica_id, producto_id, solo_temporada, orden)
  select p_tematica, (x.e ->> 'producto_id')::uuid,
         coalesce((x.e ->> 'solo_temporada')::boolean, false), (x.o - 1)::integer
    from jsonb_array_elements(coalesce(p_productos, '[]'::jsonb)) with ordinality as x(e, o)
  on conflict (tematica_id, producto_id) do update
     set solo_temporada = excluded.solo_temporada,
         orden          = excluded.orden
   where (public.tematica_productos.solo_temporada, public.tematica_productos.orden)
         is distinct from (excluded.solo_temporada, excluded.orden);
end;
$$;
comment on function public.guardar_tematica(uuid, jsonb, jsonb) is
  'Guarda una temática y sus productos en una transacción. Solo superadmin y administración.';
revoke execute on function public.guardar_tematica(uuid, jsonb, jsonb) from public, anon;
grant execute on function public.guardar_tematica(uuid, jsonb, jsonb) to authenticated;
