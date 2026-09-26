-- =============================================================================
-- 0036_registrar_movimientos.sql
-- Una boleta con varios insumos, y el consumo del día con varios, en una sola
-- transacción cada uno (F5, tarea 3; decisión 8 del plan 05).
--
-- `security invoker`: la política de movimientos_insumo (0034) decide igual
-- que si el panel insertara fila a fila. El almacén y el responsable los pone
-- la base (defaults de 0034), así que aquí no aparecen.
--
-- Contratos:
--   registrar_ingreso(p_documento, p_lineas)
--     p_documento: { proveedor_id, documento_tipo, documento_numero,
--                    observacion, ocurrido_en? (ISO; vacío = ahora) }
--     p_lineas:    [{ insumo_id, cantidad, unidad_id, precio_unitario,
--                     fecha_vencimiento?, codigo_lote? }]
--   registrar_consumo(p_cabecera, p_lineas)
--     p_cabecera: { origen_consumo, destino_lote, area_turno, observacion,
--                   ocurrido_en? }
--     p_lineas:   [{ insumo_id, cantidad, unidad_id }]
-- Las cantidades y los precios llegan como TEXTO y se convierten aquí a
-- numeric, sin pasar por coma flotante.
-- =============================================================================

create or replace function app.momento_del_registro(p_texto text)
returns timestamptz
language plpgsql
stable
set search_path = ''
as $$
declare
  v timestamptz := coalesce(nullif(p_texto, '')::timestamptz, now());
begin
  -- Cinco minutos de margen: el reloj del celular puede ir un poco adelantado.
  if v > now() + interval '5 minutes' then
    raise exception 'La fecha no puede ser de un día que aún no llega.' using errcode = 'P0001';
  end if;
  return v;
end;
$$;
revoke execute on function app.momento_del_registro(text) from public, anon;
grant execute on function app.momento_del_registro(text) to authenticated;

create or replace function public.registrar_ingreso(p_documento jsonb, p_lineas jsonb)
returns integer
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_cuando    timestamptz := app.momento_del_registro(p_documento ->> 'ocurrido_en');
  v_item      jsonb;
  v_lote      uuid;
  v_codigo    text;
  v_perecible boolean;
  v_fecha     date;
  v_n         integer := 0;
begin
  if jsonb_typeof(p_lineas) is distinct from 'array' or jsonb_array_length(p_lineas) = 0 then
    raise exception 'Añade al menos un insumo.' using errcode = 'P0001';
  end if;

  for v_item in select value from jsonb_array_elements(p_lineas)
  loop
    v_lote := null;
    v_codigo := nullif(btrim(v_item ->> 'codigo_lote'), '');

    select i.es_perecible into v_perecible
      from public.insumos i where i.id = (v_item ->> 'insumo_id')::uuid;

    -- Una fecha de vencimiento solo tiene sentido si el insumo vence. Si
    -- llega igual (por ejemplo, el formulario traía otra línea con un
    -- insumo perecible y no se limpió al cambiarlo), se ignora: nada de
    -- crear un lote con fecha fantasma que dispare una alerta de
    -- vencimiento falsa para un insumo que nunca vence.
    v_fecha := case when v_perecible then nullif(v_item ->> 'fecha_vencimiento', '')::date else null end;

    if v_codigo is not null and exists (
      select 1 from public.lotes_insumo
       where insumo_id = (v_item ->> 'insumo_id')::uuid and lower(codigo) = lower(v_codigo)
    ) then
      raise exception '%', format('El lote %s de %s ya está registrado. Usa otro código o déjalo vacío.',
        v_codigo, (select nombre from public.insumos where id = (v_item ->> 'insumo_id')::uuid))
        using errcode = 'P0001';
    end if;

    -- Con código o fecha, el lote se crea aquí; sin ninguno de los dos, lo crea
    -- el reparto (0034) al registrar la entrada.
    if v_codigo is not null or v_fecha is not null then
      insert into public.lotes_insumo (insumo_id, codigo, fecha_vencimiento)
      values ((v_item ->> 'insumo_id')::uuid, v_codigo, v_fecha)
      returning id into v_lote;
    end if;

    insert into public.movimientos_insumo
      (tipo, insumo_id, lote_id, cantidad, unidad_id, ocurrido_en, observacion,
       proveedor_id, documento_tipo, documento_numero, precio_unitario)
    values (
      'ingreso',
      (v_item ->> 'insumo_id')::uuid,
      v_lote,
      (v_item ->> 'cantidad')::numeric(14,4),
      (v_item ->> 'unidad_id')::uuid,
      v_cuando,
      nullif(btrim(p_documento ->> 'observacion'), ''),
      (p_documento ->> 'proveedor_id')::uuid,
      p_documento ->> 'documento_tipo',
      btrim(p_documento ->> 'documento_numero'),
      nullif(v_item ->> 'precio_unitario', '')::numeric(12,4)
    );
    v_n := v_n + 1;
  end loop;

  return v_n;
end;
$$;
comment on function public.registrar_ingreso(jsonb, jsonb) is
  'Un documento de compra con varias líneas, en una transacción. Devuelve cuántas líneas registró.';
revoke execute on function public.registrar_ingreso(jsonb, jsonb) from public, anon;
grant execute on function public.registrar_ingreso(jsonb, jsonb) to authenticated;

create or replace function public.registrar_consumo(p_cabecera jsonb, p_lineas jsonb)
returns integer
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_cuando timestamptz := app.momento_del_registro(p_cabecera ->> 'ocurrido_en');
  v_item   jsonb;
  v_n      integer := 0;
begin
  if jsonb_typeof(p_lineas) is distinct from 'array' or jsonb_array_length(p_lineas) = 0 then
    raise exception 'Añade al menos un insumo.' using errcode = 'P0001';
  end if;

  for v_item in select value from jsonb_array_elements(p_lineas)
  loop
    insert into public.movimientos_insumo
      (tipo, insumo_id, cantidad, unidad_id, ocurrido_en, observacion,
       origen_consumo, destino_lote, area_turno)
    values (
      'consumo',
      (v_item ->> 'insumo_id')::uuid,
      (v_item ->> 'cantidad')::numeric(14,4),
      (v_item ->> 'unidad_id')::uuid,
      v_cuando,
      nullif(btrim(p_cabecera ->> 'observacion'), ''),
      (p_cabecera ->> 'origen_consumo')::app.origen_consumo,
      nullif(btrim(p_cabecera ->> 'destino_lote'), ''),
      nullif(btrim(p_cabecera ->> 'area_turno'), '')
    );
    v_n := v_n + 1;
  end loop;

  return v_n;
end;
$$;
comment on function public.registrar_consumo(jsonb, jsonb) is
  'El consumo del día con varias líneas, en una transacción. Si una no alcanza, no entra ninguna.';
revoke execute on function public.registrar_consumo(jsonb, jsonb) from public, anon;
grant execute on function public.registrar_consumo(jsonb, jsonb) to authenticated;

-- -----------------------------------------------------------------------------
-- ¿Ya se registró este documento? (ficha 7.1: compras duplicadas)
--
-- Sin distinguir mayúsculas ni espacios, y sin contar los ingresos anulados:
-- una boleta mal registrada, anulada y vuelta a registrar no es un duplicado.
-- -----------------------------------------------------------------------------
create or replace function public.ingreso_registrado(p_proveedor uuid, p_numero text)
returns timestamptz
language sql
stable
security invoker
set search_path = ''
as $$
  select max(m.ocurrido_en)
    from public.movimientos_insumo m
   where m.tipo = 'ingreso'
     and m.proveedor_id = p_proveedor
     and lower(btrim(m.documento_numero)) = lower(btrim(p_numero))
     and not exists (select 1 from public.movimientos_insumo a where a.anula_a = m.id);
$$;
revoke execute on function public.ingreso_registrado(uuid, text) from public, anon;
grant execute on function public.ingreso_registrado(uuid, text) to authenticated;
