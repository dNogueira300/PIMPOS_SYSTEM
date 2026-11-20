-- =============================================================================
-- 0046 · Fechas de los ingresos de insumos (pedido de Dan, 19/11/2026)
--
-- Dos cosas que el panel de insumos no podía decir sin recorrer el kárdex de
-- cada insumo uno por uno:
--
--   1. `existencias_insumo.ultimo_ingreso`: cuándo entró por última vez cada
--      insumo, para una columna de la lista principal.
--   2. `ingresos_insumo`: todos los ingresos, uno por fila, con su insumo,
--      proveedor, documento y quién lo registró, para el historial que se filtra
--      por insumo, proveedor y periodo.
--
-- Las dos dejan fuera lo anulado de la misma manera que `ingreso_registrado`
-- (0036): un ingreso mal registrado y anulado no es una compra. El historial
-- sí lo enseña —marcado como anulado—, porque quien busca «¿cuándo compramos
-- bolsas?» tiene que ver también la boleta que se corrigió; la fecha del último
-- ingreso, no.
--
-- La fecha es `ocurrido_en`, la que escribe la persona en «Fecha y hora» del
-- ingreso, no la hora en que se tecleó: una boleta del lunes registrada el
-- martes es una compra del lunes.
--
-- Solo vistas, sin tablas nuevas: no hay RLS que añadir. Las dos llevan
-- `security_invoker`, así que heredan la de `movimientos_insumo`, `insumos`,
-- `proveedores` y `lotes_insumo` (solo superadmin, administrador e ingeniero).
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Existencias, con la fecha del último ingreso
--
-- `create or replace` solo admite columnas nuevas AL FINAL, y hay que repetir
-- `security_invoker` y el `where`: sin ellos la vista dejaría de respetar la
-- RLS sin que nada falle (ver la trampa de 0020 en AGENTS.md). El resto es la
-- definición de 0036, tal cual.
-- -----------------------------------------------------------------------------
create or replace view public.existencias_insumo
with (security_invoker = true) as
select
  i.id,
  i.nombre,
  i.presentacion,
  i.es_perecible,
  i.activo,
  u.codigo as unidad_base,
  i.stock_minimo,
  coalesce(s.cantidad_base, 0)::numeric as cantidad_base,
  (i.stock_minimo > 0 and coalesce(s.cantidad_base, 0) < i.stock_minimo) as bajo_minimo,
  v.proximo_vencimiento,
  (v.proximo_vencimiento is not null
   and v.proximo_vencimiento <= (now() at time zone 'America/Lima')::date + coalesce(c.dias, 15)) as por_vencer,
  ui.ultimo_ingreso
from public.insumos i
join public.unidades_medida u on u.id = i.unidad_base_id
left join (
  select insumo_id, sum(cantidad_base) as cantidad_base
    from public.saldos_insumo
   group by insumo_id
) s on s.insumo_id = i.id
left join lateral (
  select min(l.fecha_vencimiento) as proximo_vencimiento
    from public.lotes_insumo l
    join public.saldos_lote sl on sl.lote_id = l.id and sl.cantidad_base > 0
   where l.insumo_id = i.id
) v on true
left join lateral (
  select (valor #>> '{}')::integer as dias
    from public.configuracion_sitio
   where clave = 'dias_aviso_vencimiento'
) c on true
-- Usa idx_mov_insumo_fecha (insumo_id, ocurrido_en desc): un salto por insumo.
left join lateral (
  select m.ocurrido_en as ultimo_ingreso
    from public.movimientos_insumo m
   where m.insumo_id = i.id
     and m.tipo = 'ingreso'
     and not exists (select 1 from public.movimientos_insumo a where a.anula_a = m.id)
   order by m.ocurrido_en desc, m.secuencia desc
   limit 1
) ui on true
where i.deleted_at is null;

comment on view public.existencias_insumo is
  'Cuánto hay de cada insumo, si está bajo el mínimo, si algo vence pronto y cuándo entró por última vez. Para el panel (F5).';
comment on column public.existencias_insumo.ultimo_ingreso is
  'La fecha («Fecha y hora» del formulario) del último ingreso sin anular. NULL si nunca entró.';
revoke all on public.existencias_insumo from anon;
grant select on public.existencias_insumo to authenticated;

-- -----------------------------------------------------------------------------
-- 2. Historial de ingresos
--
-- `dia` es el día de Iquitos del ingreso, para que el panel filtre un periodo
-- con `gte`/`lte` sobre fechas, como los reportes (0039), sin hablar de horas.
-- -----------------------------------------------------------------------------
create view public.ingresos_insumo
with (security_invoker = true) as
select
  m.id,
  m.secuencia,
  m.ocurrido_en,
  (m.ocurrido_en at time zone 'America/Lima')::date as dia,
  m.insumo_id,
  i.nombre as insumo,
  m.cantidad,
  u.codigo as unidad,
  m.proveedor_id,
  p.nombre as proveedor,
  m.documento_tipo,
  m.documento_numero,
  m.precio_unitario,
  m.costo_total,
  l.fecha_vencimiento,
  m.observacion,
  app.nombre_de_persona(m.responsable_id) as responsable,
  exists (select 1 from public.movimientos_insumo a where a.anula_a = m.id) as anulado
from public.movimientos_insumo m
join public.insumos i on i.id = m.insumo_id
join public.unidades_medida u on u.id = m.unidad_id
left join public.proveedores p on p.id = m.proveedor_id
left join public.lotes_insumo l on l.id = m.lote_id
where m.tipo = 'ingreso';

comment on view public.ingresos_insumo is
  'Cada ingreso de insumos, con su fecha, proveedor, documento y quién lo registró, también los anulados (marcados). Para el historial de ingresos del panel.';
revoke all on public.ingresos_insumo from anon;
grant select on public.ingresos_insumo to authenticated;
