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

-- -----------------------------------------------------------------------------
-- Reparación de 0035 en producción
--
-- El 25/09/2026 se aplicó en producción una 0035 a medio escribir: el
-- `db push` se hizo desde una carpeta donde el archivo aún no tenía commit, y
-- a producción le faltó al menos el trigger que impide retirar un insumo con
-- existencias. Supabase no vuelve a ejecutar una versión ya registrada, y una
-- migración aplicada no se edita, así que la versión FINAL de 0035 se repite
-- aquí de forma que se pueda ejecutar dos veces: `create or replace` para las
-- funciones, y borrar y volver a crear la vista y el trigger. En una base que
-- ya tenía la 0035 completa (local, CI) esto deja todo igual.
--
-- Lo que sigue es copia literal de 0035 salvo esas dos líneas `drop ... if exists`.
-- -----------------------------------------------------------------------------

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
drop view if exists public.existencias_insumo;
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

-- -----------------------------------------------------------------------------
-- Retirar un insumo con existencias, prohibido en la base (revisión de la
-- tarea 2, hallazgo I-1).
--
-- `retirarInsumo()` (src/lib/acciones/insumos.ts) comprobaba esto en el
-- servidor antes de hacer el `update`, pero la política "insumos gestiona
-- insumos" (0011) deja que superadmin, administrador e ingeniero actualicen
-- `deleted_at`/`activo` en una fila de `insumos` directamente por la API —
-- una llamada a PostgREST que se salte la Server Action rodea el control por
-- completo. La regla se repite aquí porque es la que de verdad importa.
--
-- Sin `security definer`: los tres roles que pueden llegar a este `update`
-- (la misma política de arriba) ya tienen `select` sobre `saldos_insumo`
-- ("insumos lee saldos", 0012) y sobre `unidades_medida`, así que el trigger
-- corre con los privilegios de quien retira sin necesitar más permiso del
-- que ya tiene.
-- -----------------------------------------------------------------------------
create or replace function app.bloquear_retiro_con_saldo()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_saldo  numeric(14,4);
  v_unidad text;
begin
  if (new.deleted_at is not null and old.deleted_at is null)
     or (new.activo is false and old.activo is true) then
    select coalesce(sum(cantidad_base), 0) into v_saldo
      from public.saldos_insumo
     where insumo_id = old.id;

    if v_saldo > 0 then
      select u.codigo into v_unidad
        from public.unidades_medida u
       where u.id = old.unidad_base_id;
      raise exception '%', format(
        'Todavía quedan %s %s de %s. Pide su baja o haz un conteo antes de retirarlo.',
        app.formatear_cantidad(v_saldo), v_unidad, old.nombre)
        using errcode = 'P0001';
    end if;
  end if;
  return new;
end;
$$;

comment on function app.bloquear_retiro_con_saldo() is
  'Trigger BEFORE UPDATE en insumos: no deja poner deleted_at/activo=false en un insumo con saldo.';

drop trigger if exists insumos_bloquear_retiro_con_saldo on public.insumos;
create trigger insumos_bloquear_retiro_con_saldo
  before update on public.insumos
  for each row execute function app.bloquear_retiro_con_saldo();

-- -----------------------------------------------------------------------------
-- Lo propio de 0036
-- -----------------------------------------------------------------------------

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
