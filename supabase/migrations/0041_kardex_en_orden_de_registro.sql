-- =============================================================================
-- 0041_kardex_en_orden_de_registro.sql
-- Dos arreglos de la revisión final de F5 (30/09/2026).
--
-- 1. El kárdex acumula el saldo en el ORDEN EN QUE SE REGISTRÓ cada cosa
--    (`secuencia`), no en el de la fecha que escribió la persona. La base
--    valida que el saldo no quede negativo en el orden de registro; el kárdex
--    lo calculaba por `ocurrido_en`, que se puede escribir hacia atrás, y
--    enseñaba «Queda −15 kg» en un saldo que nunca fue negativo: un saco que
--    llegó a las 07:00 se registró con las 10:00, y el consumo de las 08:00 se
--    registró después. Decisión de Dan: el kárdex sale en orden de registro y
--    enseña al lado la fecha y hora escritas (alguna puede verse fuera de
--    orden). El saldo se acumula sobre todos los movimientos del insumo, así
--    que el de la primera fila del periodo ya lleva todo lo anterior.
--
-- 2. `app.formatear_cantidad` escribe hasta 4 decimales (los que guarda la
--    base), no 2. Con 2, un insumo en kg que se consume en gramos quedaba en
--    un bucle: «Solo hay 9.99 kg» cuando había 9.985, y al pedir 9.99 la
--    misma frase otra vez; y 0.004 kg salía como «0 kg».
-- =============================================================================

create or replace function app.formatear_cantidad(p numeric)
returns text
language sql
immutable
set search_path = ''
as $$
  -- «FM» quita los ceros de sobra pero deja el punto en un entero: «30.».
  select rtrim(to_char(p, 'FM999999990.9999'), '.');
$$;
comment on function app.formatear_cantidad(numeric) is
  'Una cantidad como la lee una persona: 12.5, 30, 9.985. Hasta 4 decimales, los que guarda la base.';

create or replace function public.kardex_insumo(p_insumo uuid, p_desde date, p_hasta date)
returns table (
  id            uuid,
  ocurrido_en   timestamptz,
  tipo          text,
  sentido       smallint,
  cantidad      numeric,
  unidad        text,
  cantidad_base numeric,
  saldo         numeric,
  costo         numeric,
  proveedor     text,
  documento     text,
  destino_lote  text,
  area_turno    text,
  motivo_baja   text,
  observacion   text,
  responsable   text,
  anulado       boolean,
  anula_a       uuid
)
language sql
stable
security invoker
set search_path = ''
as $$
  with acumulado as (
    select m.*,
           sum(m.sentido * m.cantidad_base) over (order by m.secuencia) as saldo_tras
      from public.movimientos_insumo m
     where m.insumo_id = p_insumo
  )
  select
    m.id,
    m.ocurrido_en,
    m.tipo::text,
    m.sentido,
    m.cantidad,
    u.codigo,
    m.cantidad_base,
    m.saldo_tras,
    (select sum(ml.cantidad_base * ml.costo_unitario) from public.movimiento_lotes ml where ml.movimiento_id = m.id),
    p.nombre,
    nullif(concat_ws(' ', m.documento_tipo, m.documento_numero), ''),
    m.destino_lote,
    m.area_turno,
    m.motivo_baja::text,
    m.observacion,
    app.nombre_de_persona(m.responsable_id),
    exists (select 1 from public.movimientos_insumo a where a.anula_a = m.id),
    m.anula_a
  from acumulado m
  join public.unidades_medida u on u.id = m.unidad_id
  left join public.proveedores p on p.id = m.proveedor_id
  where (m.ocurrido_en at time zone 'America/Lima')::date between p_desde and p_hasta
  order by m.secuencia;
$$;
comment on function public.kardex_insumo(uuid, date, date) is
  'Movimientos de un insumo entre dos días de Iquitos, en el orden en que se registraron, con el saldo que quedó después de cada uno (0041).';
revoke execute on function public.kardex_insumo(uuid, date, date) from public, anon;
grant execute on function public.kardex_insumo(uuid, date, date) to authenticated;
