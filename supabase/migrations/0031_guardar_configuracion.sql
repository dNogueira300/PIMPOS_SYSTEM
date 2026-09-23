-- =============================================================================
-- 0031_guardar_configuracion.sql
-- La configuración se guarda entera o nada (F4, tarea 7).
--
-- El formulario de configuración cambia hasta ~30 filas de una vez. Guardarlas
-- una a una desde la aplicación dejaría el sitio a medias si se corta la señal
-- a la mitad: el WhatsApp nuevo con la dirección vieja. Una función es una
-- transacción.
--
-- Además, al guardar o confirmar un dato provisional, su descripción pierde la
-- palabra PENDIENTE, que es lo que usa la consulta de pendientes (0017) y el
-- aviso del inicio del panel.
-- =============================================================================

create or replace function public.guardar_configuracion(p_valores jsonb, p_confirmadas text[] default '{}')
returns integer
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_clave text;
  v_valor jsonb;
  v_total integer := 0;
begin
  -- Con RLS, el update de un ingeniero no fallaría: no tocaría ninguna fila, y
  -- el mensaje de abajo diría que la clave no existe. Se dice la verdad antes.
  if not (select app.es_rol('superadmin', 'administrador')) then
    raise exception 'Solo la administración cambia la configuración del sitio.'
      using errcode = 'insufficient_privilege';
  end if;

  for v_clave, v_valor in select key, value from jsonb_each(p_valores)
  loop
    update public.configuracion_sitio c
       set valor = v_valor,
           descripcion = case
             when c.valor is distinct from v_valor or v_clave = any (p_confirmadas)
               then btrim(regexp_replace(c.descripcion, '\s*PENDIENTE[^.]*\.', '', 'g'))
             else c.descripcion
           end
     where c.clave = v_clave;

    if not found then
      raise exception 'No existe el ajuste «%».', v_clave;
    end if;
    v_total := v_total + 1;
  end loop;

  -- Una clave confirmada que no vino en p_valores también se confirma.
  update public.configuracion_sitio c
     set descripcion = btrim(regexp_replace(c.descripcion, '\s*PENDIENTE[^.]*\.', '', 'g'))
   where c.clave = any (p_confirmadas)
     and not p_valores ? c.clave
     and c.descripcion like '%PENDIENTE%';

  return v_total;
end;
$$;

comment on function public.guardar_configuracion(jsonb, text[]) is
  'Guarda varios ajustes de configuracion_sitio en una transacción y quita PENDIENTE a lo confirmado.';

revoke execute on function public.guardar_configuracion(jsonb, text[]) from public, anon;
grant execute on function public.guardar_configuracion(jsonb, text[]) to authenticated;

-- configuracion_sitio tiene updated_by pero no created_by, así que 0026 no le
-- puso trigger de autoría. Este es el suyo.
create or replace function app.sellar_editor_configuracion()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_by := coalesce(auth.uid(), old.updated_by);
  return new;
end;
$$;

create trigger configuracion_sitio_sellar_editor
  before update on public.configuracion_sitio
  for each row execute function app.sellar_editor_configuracion();
