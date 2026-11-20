-- =============================================================================
-- 0048 · El estilo de una temática (plan 08)
--
-- Dan vio la maqueta de Navidad en dos variantes y pidió, el 20/11/2026,
-- «desarrolla las dos, cuando hayas terminado deja aplicado la de noche de
-- navidad». El panel elige el estilo; Navidad queda con «noche».
--
--   · noche: el sitio entero sobre verde pino, con rojo y dorado.
--   · crema: el crema de siempre, con rojo en lo que se pulsa y pino en las
--     franjas.
--
-- Cada estilo necesita su CSS en `src/estilos/tematicas.css`, así que la lista
-- es cerrada: una temática nueva con estilos propios amplía este `check`.
-- =============================================================================

-- El valor por defecto solo existe para la fila de Navidad que ya está en la
-- tabla; después se quita, para que una temática nueva diga el suyo.
alter table public.tematicas
  add column estilo text not null default 'noche'
  constraint tematicas_estilo_conocido check (estilo in ('noche', 'crema'));
alter table public.tematicas alter column estilo drop default;

comment on column public.tematicas.estilo is
  'Cómo se viste el sitio con esta temática. Cada estilo tiene su CSS en el código.';

-- -----------------------------------------------------------------------------
-- Vistas
--
-- `tematicas_panel` lleva `t.*`, que se expandió al crearla: sin recrearla, la
-- columna nueva no aparecería. Y `create or replace` solo admite columnas
-- nuevas al final, así que se borra y se vuelve a crear con sus permisos.
-- -----------------------------------------------------------------------------
drop view public.tematicas_panel;
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

-- La columna nueva va al final; repite `security_invoker` y el `where`.
create or replace view public.tematica_publica
with (security_invoker = true) as
select t.slug, t.nombre, t.fecha_evento, t.texto_aviso, t.mensajes_cinta, t.titulo, t.entradilla, t.estilo
  from public.tematicas t
 where t.id = app.tematica_activa_id();
comment on view public.tematica_publica is
  'La temática activa hoy, con sus textos y su estilo. Vacía si no hay ninguna.';

-- -----------------------------------------------------------------------------
-- Guardar desde el panel: igual que en 0047, más el estilo. Si no llega, se
-- queda el que había.
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

  -- Un encendido a mano caducado se lleva antes a «según fechas»: así, pedir
  -- «encendida» otra vez cuenta como encenderla, con sus reglas.
  update public.tematicas
     set encendido = 'fechas'
   where id = p_tematica
     and encendido <> 'fechas'
     and (now() at time zone 'America/Lima')::date > encendido_hasta;

  update public.tematicas
     set inicio         = (p_datos ->> 'inicio')::date,
         fin            = (p_datos ->> 'fin')::date,
         fecha_evento   = nullif(p_datos ->> 'fecha_evento', '')::date,
         encendido      = coalesce(p_datos ->> 'encendido', 'fechas'),
         estilo         = coalesce(nullif(p_datos ->> 'estilo', ''), estilo),
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

  -- Un producto repetido en la lista cuenta una vez, en su primera posición.
  insert into public.tematica_productos (tematica_id, producto_id, solo_temporada, orden)
  select distinct on ((x.e ->> 'producto_id')::uuid)
         p_tematica, (x.e ->> 'producto_id')::uuid,
         coalesce((x.e ->> 'solo_temporada')::boolean, false), (x.o - 1)::integer
    from jsonb_array_elements(coalesce(p_productos, '[]'::jsonb)) with ordinality as x(e, o)
   order by (x.e ->> 'producto_id')::uuid, x.o
  on conflict (tematica_id, producto_id) do update
     set solo_temporada = excluded.solo_temporada,
         orden          = excluded.orden
   where (public.tematica_productos.solo_temporada, public.tematica_productos.orden)
         is distinct from (excluded.solo_temporada, excluded.orden);
end;
$$;
