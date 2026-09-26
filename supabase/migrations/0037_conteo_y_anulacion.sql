-- =============================================================================
-- 0037_conteo_y_anulacion.sql
-- Conteo físico, anulación y el kárdex de un insumo (F5, tarea 4).
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Un nombre para enseñar. `perfiles` solo deja ver el propio al ingeniero
-- (0003), y el kárdex tiene que decir quién registró cada cosa.
-- -----------------------------------------------------------------------------
create or replace function app.nombre_de_persona(p_id uuid)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select nombre_completo from public.perfiles where id = p_id;
$$;
revoke execute on function app.nombre_de_persona(uuid) from public, anon;
grant execute on function app.nombre_de_persona(uuid) to authenticated;

-- -----------------------------------------------------------------------------
-- Conteo físico
--
-- p_lineas: [{ insumo_id, contado (texto, en la unidad base), precio_unitario?,
--              fecha_vencimiento? }]
--
-- `security definer` para poder bloquear el saldo mientras se compara (el
-- rol `authenticated` no tiene UPDATE sobre saldos_insumo, y `for update` lo
-- exige). Por eso la comprobación de rol va escrita aquí: sin ella, cualquiera
-- podría ajustar pasando por la función.
-- -----------------------------------------------------------------------------
create or replace function public.registrar_conteo(p_lineas jsonb, p_observacion text)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_item    jsonb;
  v_actual  numeric(14,4);
  v_contado numeric(14,4);
  v_dif     numeric(14,4);
  v_lote    uuid;
  v_n       integer := 0;
begin
  if not (select app.es_rol('superadmin', 'administrador')) then
    raise exception 'Solo la administración registra conteos.' using errcode = '42501';
  end if;
  if length(btrim(coalesce(p_observacion, ''))) = 0 then
    raise exception 'Escribe por qué se contó, por ejemplo «Inventario inicial».' using errcode = 'P0001';
  end if;

  for v_item in select value from jsonb_array_elements(p_lineas)
  loop
    v_contado := (v_item ->> 'contado')::numeric(14,4);
    select s.cantidad_base into v_actual
      from public.saldos_insumo s
     where s.insumo_id = (v_item ->> 'insumo_id')::uuid
       and s.almacen_id = app.almacen_principal()
       for update;
    v_dif := v_contado - coalesce(v_actual, 0);
    continue when v_dif = 0;

    v_lote := null;
    if v_dif > 0 and nullif(v_item ->> 'fecha_vencimiento', '') is not null then
      insert into public.lotes_insumo (insumo_id, fecha_vencimiento)
      values ((v_item ->> 'insumo_id')::uuid, (v_item ->> 'fecha_vencimiento')::date)
      returning id into v_lote;
    end if;

    insert into public.movimientos_insumo
      (tipo, sentido, insumo_id, lote_id, cantidad, unidad_id, precio_unitario, observacion)
    select 'ajuste', sign(v_dif)::smallint, i.id, v_lote, abs(v_dif), i.unidad_base_id,
           case when v_dif > 0 then nullif(v_item ->> 'precio_unitario', '')::numeric(12,4) end,
           btrim(p_observacion)
      from public.insumos i
     where i.id = (v_item ->> 'insumo_id')::uuid;
    v_n := v_n + 1;
  end loop;

  return v_n;
end;
$$;
comment on function public.registrar_conteo(jsonb, text) is
  'Conteo físico: registra un ajuste por cada insumo cuyo saldo no coincide con lo contado. Solo administración.';
revoke execute on function public.registrar_conteo(jsonb, text) from public, anon;
grant execute on function public.registrar_conteo(jsonb, text) to authenticated;

-- -----------------------------------------------------------------------------
-- Anular. `security invoker`: la política de 0034 ya dice que solo la
-- administración inserta anulaciones.
-- -----------------------------------------------------------------------------
create or replace function public.anular_movimiento(p_id uuid, p_motivo text)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_id uuid;
begin
  insert into public.movimientos_insumo (tipo, anula_a, insumo_id, cantidad, unidad_id, observacion)
  select 'anulacion', m.id, m.insumo_id, m.cantidad, m.unidad_id, nullif(btrim(p_motivo), '')
    from public.movimientos_insumo m
   where m.id = p_id
  returning id into v_id;
  if v_id is null then
    raise exception 'No se encontró el movimiento que quieres anular.' using errcode = 'P0001';
  end if;
  return v_id;
end;
$$;
revoke execute on function public.anular_movimiento(uuid, text) from public, anon;
grant execute on function public.anular_movimiento(uuid, text) to authenticated;

-- -----------------------------------------------------------------------------
-- El kárdex de un insumo, en días de Iquitos, con el saldo después de cada
-- movimiento. El saldo parte de lo acumulado antes del periodo.
-- -----------------------------------------------------------------------------
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
  with previo as (
    select coalesce(sum(m.sentido * m.cantidad_base), 0) as saldo
      from public.movimientos_insumo m
     where m.insumo_id = p_insumo
       and (m.ocurrido_en at time zone 'America/Lima')::date < p_desde
  )
  select
    m.id,
    m.ocurrido_en,
    m.tipo::text,
    m.sentido,
    m.cantidad,
    u.codigo,
    m.cantidad_base,
    (select saldo from previo)
      + sum(m.sentido * m.cantidad_base) over (order by m.ocurrido_en, m.secuencia),
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
  from public.movimientos_insumo m
  join public.unidades_medida u on u.id = m.unidad_id
  left join public.proveedores p on p.id = m.proveedor_id
  where m.insumo_id = p_insumo
    and (m.ocurrido_en at time zone 'America/Lima')::date between p_desde and p_hasta
  order by m.ocurrido_en, m.secuencia;
$$;
comment on function public.kardex_insumo(uuid, date, date) is
  'Movimientos de un insumo entre dos días de Iquitos, con el saldo acumulado después de cada uno.';
revoke execute on function public.kardex_insumo(uuid, date, date) from public, anon;
grant execute on function public.kardex_insumo(uuid, date, date) to authenticated;
