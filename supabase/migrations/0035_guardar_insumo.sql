-- =============================================================================
-- 0035_guardar_insumo.sql
-- Un insumo y sus equivalencias se guardan juntos, y la vista que alimenta
-- Existencias (F5, tarea 2).
--
-- Igual que guardar_producto (0027): supabase-js no abre transacciones y un
-- corte de señal a mitad dejaría un insumo sin su «1 saco = 50 kg», que es
-- justo lo que hace falta para registrar su primera compra.
--
-- Contrato:
--   p_insumo: { id?, nombre, descripcion?, unidad_base_id, presentacion?,
--               stock_minimo (texto), es_perecible?, proveedor_habitual_id? }
--   p_equivalencias: [{ unidad_desde_id, factor (texto) }], todas HACIA la
--     unidad base. Las del insumo que no vengan se quitan: no hay historial
--     que perder, porque cada movimiento guarda su propia cantidad base.
-- =============================================================================
create or replace function public.guardar_insumo(p_insumo jsonb, p_equivalencias jsonb)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_id     uuid := nullif(p_insumo ->> 'id', '')::uuid;
  v_base   uuid := (p_insumo ->> 'unidad_base_id')::uuid;
  v_item   jsonb;
  v_desde  uuid;
  v_quedan uuid[] := '{}';
begin
  if jsonb_typeof(p_equivalencias) is distinct from 'array' then
    raise exception 'Las equivalencias llegaron con una forma inesperada. Recarga la página.';
  end if;

  if v_id is null then
    insert into public.insumos
      (nombre, descripcion, unidad_base_id, presentacion, stock_minimo, es_perecible, proveedor_habitual_id)
    values (
      btrim(p_insumo ->> 'nombre'),
      nullif(btrim(p_insumo ->> 'descripcion'), ''),
      v_base,
      nullif(btrim(p_insumo ->> 'presentacion'), ''),
      (p_insumo ->> 'stock_minimo')::numeric(14,4),
      coalesce((p_insumo ->> 'es_perecible')::boolean, false),
      nullif(p_insumo ->> 'proveedor_habitual_id', '')::uuid
    )
    returning id into v_id;
  else
    update public.insumos
       set nombre                = btrim(p_insumo ->> 'nombre'),
           descripcion           = nullif(btrim(p_insumo ->> 'descripcion'), ''),
           unidad_base_id        = v_base,
           presentacion          = nullif(btrim(p_insumo ->> 'presentacion'), ''),
           stock_minimo          = (p_insumo ->> 'stock_minimo')::numeric(14,4),
           es_perecible          = coalesce((p_insumo ->> 'es_perecible')::boolean, false),
           proveedor_habitual_id = nullif(p_insumo ->> 'proveedor_habitual_id', '')::uuid
     where id = v_id
       and deleted_at is null;
    if not found then
      raise exception 'No se encontró el insumo. Puede que otra persona lo haya retirado.';
    end if;
  end if;

  for v_item in select value from jsonb_array_elements(p_equivalencias)
  loop
    v_desde := (v_item ->> 'unidad_desde_id')::uuid;
    insert into public.equivalencias (insumo_id, unidad_desde, unidad_hacia, factor)
    values (v_id, v_desde, v_base, (v_item ->> 'factor')::numeric(14,6))
    on conflict (insumo_id, unidad_desde, unidad_hacia) do update set factor = excluded.factor;
    v_quedan := v_quedan || v_desde;
  end loop;

  -- Las que no vinieron, y las que apuntaban a una unidad base anterior.
  delete from public.equivalencias
   where insumo_id = v_id
     and (unidad_hacia <> v_base or not (unidad_desde = any (v_quedan)));

  return v_id;
end;
$$;

comment on function public.guardar_insumo(jsonb, jsonb) is
  'Guarda un insumo y sus equivalencias en una sola transacción. Security invoker: decide la RLS.';
revoke execute on function public.guardar_insumo(jsonb, jsonb) from public, anon;
grant execute on function public.guardar_insumo(jsonb, jsonb) to authenticated;

-- -----------------------------------------------------------------------------
-- Existencias: lo que el propietario pidió ver primero (ficha 7.1)
--
-- `security_invoker`: sin él la vista saltaría la RLS de insumos (ver 0016).
-- Los días de aviso salen de la configuración, como en app.evaluar_alertas().
-- -----------------------------------------------------------------------------
create view public.existencias_insumo
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
   and v.proximo_vencimiento <= (now() at time zone 'America/Lima')::date + coalesce(c.dias, 15)) as por_vencer
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
where i.deleted_at is null;

comment on view public.existencias_insumo is
  'Cuánto hay de cada insumo, si está bajo el mínimo y si algo vence pronto. Para el panel (F5).';
revoke all on public.existencias_insumo from anon;
grant select on public.existencias_insumo to authenticated;
