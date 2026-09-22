-- =============================================================================
-- 0027_guardar_producto.sql
-- Un producto y sus presentaciones se guardan juntos (F4, tarea 3).
--
-- supabase-js no abre transacciones, y guardar el producto y después sus
-- presentaciones en dos llamadas deja una ventana en la que un corte de señal
-- publica un producto sin precio. Una función es una transacción entera.
--
-- `security invoker`: corre con los permisos de quien llama, así que la RLS de
-- productos y variantes decide igual que si el panel escribiera fila a fila.
-- No abre ninguna puerta nueva; la prueba 0027 lo comprueba con el repartidor.
--
-- Contrato:
--   p_producto: { id?, categoria_id, nombre, slug (solo al crear), descripcion,
--                 destacado, estado }
--   p_presentaciones: [{ id?, nombre, precio (texto "0.40"), unidad_venta }]
--     El orden de la lista es el orden en el sitio, y la primera es la
--     predeterminada. Las presentaciones del producto que no vengan en la
--     lista se retiran con borrado lógico: su historial de precios se queda.
-- =============================================================================

create or replace function public.guardar_producto(p_producto jsonb, p_presentaciones jsonb)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_id        uuid := nullif(p_producto ->> 'id', '')::uuid;
  v_conservar uuid[] := '{}';
  v_item      jsonb;
  v_item_id   uuid;
  v_orden     smallint := 0;
begin
  if jsonb_typeof(p_presentaciones) is distinct from 'array'
     or jsonb_array_length(p_presentaciones) = 0 then
    raise exception 'Un producto necesita al menos una presentación con su precio.';
  end if;

  if v_id is null then
    insert into public.productos (categoria_id, nombre, slug, descripcion, destacado, estado)
    values (
      (p_producto ->> 'categoria_id')::uuid,
      p_producto ->> 'nombre',
      p_producto ->> 'slug',
      nullif(btrim(p_producto ->> 'descripcion'), ''),
      coalesce((p_producto ->> 'destacado')::boolean, false),
      (p_producto ->> 'estado')::app.estado_publicacion
    )
    returning id into v_id;
  else
    update public.productos
       set categoria_id = (p_producto ->> 'categoria_id')::uuid,
           nombre       = p_producto ->> 'nombre',
           descripcion  = nullif(btrim(p_producto ->> 'descripcion'), ''),
           destacado    = coalesce((p_producto ->> 'destacado')::boolean, false),
           estado       = (p_producto ->> 'estado')::app.estado_publicacion
     where id = v_id
       and deleted_at is null;
    if not found then
      raise exception 'No se encontró el producto. Puede que otra persona lo haya borrado.';
    end if;
  end if;

  -- Se quita la marca a todas antes de repartirla: el índice único parcial
  -- chocaría si por un instante hubiera dos predeterminadas.
  update public.producto_variantes
     set es_predeterminada = false
   where producto_id = v_id and deleted_at is null and es_predeterminada;

  for v_item in select value from jsonb_array_elements(p_presentaciones)
  loop
    v_item_id := nullif(v_item ->> 'id', '')::uuid;

    if v_item_id is null then
      insert into public.producto_variantes
        (producto_id, nombre, precio, unidad_venta, es_predeterminada, orden)
      values (
        v_id,
        v_item ->> 'nombre',
        (v_item ->> 'precio')::numeric(12,4),
        coalesce(v_item ->> 'unidad_venta', 'unidad'),
        v_orden = 0,
        v_orden
      )
      returning id into v_item_id;
    else
      update public.producto_variantes
         set nombre            = v_item ->> 'nombre',
             precio            = (v_item ->> 'precio')::numeric(12,4),
             unidad_venta      = coalesce(v_item ->> 'unidad_venta', 'unidad'),
             es_predeterminada = v_orden = 0,
             orden             = v_orden,
             activo            = true
       where id = v_item_id
         and producto_id = v_id
         and deleted_at is null;
      if not found then
        raise exception 'Una de las presentaciones ya no existe. Recarga la página y vuelve a intentarlo.';
      end if;
    end if;

    v_conservar := v_conservar || v_item_id;
    v_orden := v_orden + 1;
  end loop;

  update public.producto_variantes
     set deleted_at = now(), activo = false
   where producto_id = v_id
     and deleted_at is null
     and not (id = any (v_conservar));

  return v_id;
end;
$$;

comment on function public.guardar_producto(jsonb, jsonb) is
  'Guarda un producto y sus presentaciones en una sola transacción. Security invoker: decide la RLS.';

revoke execute on function public.guardar_producto(jsonb, jsonb) from public, anon;
grant execute on function public.guardar_producto(jsonb, jsonb) to authenticated;
