-- =============================================================================
-- 0039_reportes_insumos.sql
-- Los reportes de la ficha 7.8, calculados por la base (F5, tarea 6).
--
-- Tres reglas comunes:
--   · Días de Iquitos: `(ocurrido_en at time zone 'America/Lima')::date`.
--   · Lo anulado no cuenta: ni el original ni su anulación.
--   · El dinero sale de `movimiento_lotes.costo_unitario`, el costo del lote del
--     que salió de verdad cada kilo (decisión 5), nunca de un promedio.
-- Todas `security invoker`: la RLS de insumos decide quién ve qué.
-- =============================================================================

create or replace function app.vigente(p_id uuid)
returns boolean
language sql
stable
set search_path = ''
as $$
  select not exists (select 1 from public.movimientos_insumo a where a.anula_a = p_id);
$$;
grant execute on function app.vigente(uuid) to authenticated;

create or replace function app.dia_lima(p timestamptz)
returns date
language sql
immutable
set search_path = ''
as $$
  select (p at time zone 'America/Lima')::date;
$$;
grant execute on function app.dia_lima(timestamptz) to authenticated;

-- Existencias y valorización ---------------------------------------------------
create or replace function public.reporte_existencias()
returns table (
  insumo_id           uuid,
  nombre              text,
  unidad              text,
  cantidad_base       numeric,
  stock_minimo        numeric,
  valor               numeric,
  sin_costo           boolean,
  proximo_vencimiento date
)
language sql
stable
security invoker
set search_path = ''
as $$
  select i.id, i.nombre, u.codigo,
         coalesce(sum(sl.cantidad_base), 0),
         i.stock_minimo,
         round(coalesce(sum(sl.cantidad_base * l.costo_unitario), 0), 2),
         coalesce(bool_or(sl.cantidad_base > 0 and l.costo_unitario is null), false),
         min(l.fecha_vencimiento) filter (where sl.cantidad_base > 0)
    from public.insumos i
    join public.unidades_medida u on u.id = i.unidad_base_id
    left join public.saldos_lote sl on sl.insumo_id = i.id
    left join public.lotes_insumo l on l.id = sl.lote_id
   where i.deleted_at is null and i.activo
   group by i.id, i.nombre, u.codigo, i.stock_minimo
   order by i.nombre;
$$;

-- Consumo por periodo ----------------------------------------------------------
--
-- `sin_costo`: true si parte de lo consumido salió de un lote sin costo
-- registrado. `costo` ya excluía esa parte (`coalesce(ml.costo_unitario, 0)`
-- la suma como cero); sin esta columna, esa exclusión era invisible: un
-- costo bajo por un lote sin precio se veía igual que un costo bajo de
-- verdad (revisión de tarea 6, hallazgo I-2).
create or replace function public.reporte_consumo(p_desde date, p_hasta date)
returns table (
  insumo_id uuid, nombre text, unidad text, cantidad_base numeric, costo numeric,
  sin_costo boolean
)
language sql
stable
security invoker
set search_path = ''
as $$
  select i.id, i.nombre, u.codigo,
         sum(ml.cantidad_base),
         round(sum(ml.cantidad_base * coalesce(ml.costo_unitario, 0)), 2),
         bool_or(ml.costo_unitario is null)
    from public.movimientos_insumo m
    join public.movimiento_lotes ml on ml.movimiento_id = m.id
    join public.insumos i on i.id = m.insumo_id
    join public.unidades_medida u on u.id = i.unidad_base_id
   where m.tipo = 'consumo'
     and app.vigente(m.id)
     and app.dia_lima(m.ocurrido_en) between p_desde and p_hasta
   group by i.id, i.nombre, u.codigo
   order by 5 desc, 2;
$$;

-- Compras por proveedor --------------------------------------------------------
-- `sin_costo`: ver el comentario de `reporte_consumo`. Aquí es infrecuente (un
-- ingreso normal siempre trae precio o costo total), pero un ajuste de entrada
-- sin precio también crea un lote sin costo, y esta función lo hereda si algún
-- día un ingreso llegara a compartir lote con uno de esos.
create or replace function public.reporte_compras(p_desde date, p_hasta date)
returns table (
  proveedor text, insumo text, unidad text, cantidad_base numeric, costo numeric,
  documentos bigint, sin_costo boolean
)
language sql
stable
security invoker
set search_path = ''
as $$
  select p.nombre, i.nombre, u.codigo,
         -- De movimiento_lotes y no del movimiento: si algún día un ingreso se
         -- repartiera en dos lotes, sumar el del movimiento lo contaría dos veces.
         sum(ml.cantidad_base),
         round(sum(ml.cantidad_base * coalesce(ml.costo_unitario, 0)), 2),
         count(distinct lower(btrim(m.documento_numero))),
         bool_or(ml.costo_unitario is null)
    from public.movimientos_insumo m
    join public.movimiento_lotes ml on ml.movimiento_id = m.id
    join public.proveedores p on p.id = m.proveedor_id
    join public.insumos i on i.id = m.insumo_id
    join public.unidades_medida u on u.id = i.unidad_base_id
   where m.tipo = 'ingreso'
     and app.vigente(m.id)
     and app.dia_lima(m.ocurrido_en) between p_desde and p_hasta
   group by p.nombre, i.nombre, u.codigo
   order by 1, 5 desc;
$$;

-- Mermas y pérdidas: bajas aprobadas + faltantes encontrados al contar ---------
-- `sin_costo`: ver el comentario de `reporte_consumo`. Aquí es el caso más
-- probable de los tres: una baja o un faltante de conteo pueden salir
-- perfectamente de un lote de inventario inicial cargado sin precio.
create or replace function public.reporte_mermas(p_desde date, p_hasta date)
returns table (
  motivo text, insumo text, unidad text, cantidad_base numeric, costo numeric,
  sin_costo boolean
)
language sql
stable
security invoker
set search_path = ''
as $$
  select case when m.tipo = 'baja' then m.motivo_baja::text else 'faltante_conteo' end,
         i.nombre, u.codigo,
         sum(ml.cantidad_base),
         round(sum(ml.cantidad_base * coalesce(ml.costo_unitario, 0)), 2),
         bool_or(ml.costo_unitario is null)
    from public.movimientos_insumo m
    join public.movimiento_lotes ml on ml.movimiento_id = m.id
    join public.insumos i on i.id = m.insumo_id
    join public.unidades_medida u on u.id = i.unidad_base_id
   where (m.tipo = 'baja' or (m.tipo = 'ajuste' and m.sentido = -1))
     and app.vigente(m.id)
     and app.dia_lima(m.ocurrido_en) between p_desde and p_hasta
   group by 1, i.nombre, u.codigo
   order by 5 desc;
$$;

revoke execute on function public.reporte_existencias()          from public, anon;
revoke execute on function public.reporte_consumo(date, date)    from public, anon;
revoke execute on function public.reporte_compras(date, date)    from public, anon;
revoke execute on function public.reporte_mermas(date, date)     from public, anon;
grant execute on function public.reporte_existencias()           to authenticated;
grant execute on function public.reporte_consumo(date, date)     to authenticated;
grant execute on function public.reporte_compras(date, date)     to authenticated;
grant execute on function public.reporte_mermas(date, date)      to authenticated;
