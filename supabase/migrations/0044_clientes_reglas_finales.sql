-- =============================================================================
-- 0044_clientes_reglas_finales.sql
-- Lo que encontró la revisión final de F6 (06/10/2026): reglas que solo vivían
-- en el formulario, o que solo se comprobaban al registrar. Por la API se
-- podían saltar. Producción tiene 0 clientes: no hay nada que migrar.
--
--   1. Referencia y zona son obligatorias (ficha 8), y un cliente activo no
--      puede quedar en una zona retirada.
--   2. Un permiso no se falsea: su fecha es la de cuando se anota, su versión
--      tiene forma de versión, y una vez anotado solo se puede retirar.
--   3. Un cliente no se queda sin permiso DESPUÉS de registrado: retirar el
--      único que tiene no llega a guardarse (para eso está «Borrar sus datos»).
--   4. La anotación de una descarga no se fecha a mano.
--
-- Las tres primeras se aplican a quien tiene sesión, igual que la marca de
-- ejemplo (0042): las semillas y una restauración corren sin ella.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Referencia y zona
-- -----------------------------------------------------------------------------
-- Un trigger y no un `check`: la regla mira otra tabla (la zona) y no vale para
-- los clientes de ejemplo ni para los desactivados. Borrar los datos de un
-- cliente (0043) lo desactiva en el mismo cambio, así que pasa.
create or replace function app.exigir_datos_de_cliente()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_zona record;
begin
  if auth.uid() is null or new.es_demo or not new.activo or new.deleted_at is not null then
    return new;
  end if;

  if coalesce(btrim(new.referencia), '') = '' then
    raise exception 'Escribe la referencia: cómo reconocer la casa.' using errcode = 'P0001';
  end if;
  if new.zona_id is null then
    raise exception 'Elige la zona del cliente.' using errcode = 'P0001';
  end if;

  -- La zona solo se mira cuando cambia o cuando el cliente vuelve a estar
  -- activo: corregir la referencia de un cliente no depende de su zona.
  if tg_op = 'INSERT' or new.zona_id is distinct from old.zona_id or not old.activo then
    select z.nombre, z.activo, z.deleted_at into v_zona
      from public.zonas_reparto z where z.id = new.zona_id;
    if found and (not v_zona.activo or v_zona.deleted_at is not null) then
      raise exception 'La zona % está retirada. Pásalo a otra zona antes de %.',
        v_zona.nombre, case when tg_op = 'INSERT' then 'registrarlo' else 'reactivarlo' end
        using errcode = 'P0001';
    end if;
  end if;
  return new;
end;
$$;

create trigger clientes_exigir_datos
  before insert or update on public.clientes
  for each row execute function app.exigir_datos_de_cliente();

-- -----------------------------------------------------------------------------
-- 2. El permiso no se falsea
-- -----------------------------------------------------------------------------
create or replace function app.proteger_consentimientos()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if auth.uid() is null then
    return new;
  end if;

  if tg_op = 'INSERT' then
    -- La versión que se leyó: `v1-2026-10`. No una palabra cualquiera.
    if new.texto_version !~ '^v[0-9]+-[0-9]{4}-[0-9]{2}$' then
      raise exception 'La versión del texto del permiso no es válida.' using errcode = 'P0001';
    end if;
    -- La fecha es la de cuando se anota: un permiso no se fecha hacia atrás ni
    -- hacia adelante (la ficha enseña el más reciente).
    new.otorgado_en := now();
    new.revocado_en := null;
    new.revocado_por := null;
    return new;
  end if;

  -- Una vez anotado, de un permiso solo cambia que se retiró (y su nota).
  if new.cliente_id     is distinct from old.cliente_id
  or new.modo           is distinct from old.modo
  or new.otorgado_en    is distinct from old.otorgado_en
  or new.registrado_por is distinct from old.registrado_por
  or new.texto_version  is distinct from old.texto_version
  or new.created_at     is distinct from old.created_at then
    raise exception 'De un permiso solo se puede anotar que se retiró.' using errcode = '42501';
  end if;
  return new;
end;
$$;

create trigger consentimientos_proteger
  before insert or update on public.consentimientos
  for each row execute function app.proteger_consentimientos();

-- -----------------------------------------------------------------------------
-- 3. Un cliente no se queda sin permiso después de registrado
--
-- 0042 lo comprobaba al insertar el cliente; faltaba el otro lado: retirar su
-- único permiso lo dejaba con sus datos guardados y sin consentimiento. Es un
-- trigger diferido, como aquel: se mira al terminar la transacción, así que
-- `borrar_datos_cliente` —que retira el permiso y anota la constancia en la
-- misma— pasa, y anotar un permiso nuevo y retirar el viejo, también.
-- `security definer`: tiene que ver la constancia (`supresiones`) aunque quien
-- actúe no pueda leerla.
-- -----------------------------------------------------------------------------
create or replace function app.exigir_permiso_al_retirar()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if exists (
       select 1 from public.clientes c
        where c.id = old.cliente_id and not c.es_demo and c.deleted_at is null)
     and not exists (select 1 from public.supresiones s where s.cliente_id = old.cliente_id)
     and not exists (
       select 1 from public.consentimientos k
        where k.cliente_id = old.cliente_id and k.revocado_en is null)
  then
    raise exception 'Este cliente se quedaría sin permiso. Si lo retiró, usa «Borrar sus datos» en su ficha.'
      using errcode = 'P0001';
  end if;
  return null;
end;
$$;
revoke execute on function app.exigir_permiso_al_retirar() from public, anon, authenticated;

create constraint trigger consentimientos_cliente_con_permiso
  after update of revocado_en, cliente_id on public.consentimientos
  deferrable initially deferred
  for each row execute function app.exigir_permiso_al_retirar();

-- -----------------------------------------------------------------------------
-- 4. La anotación de una descarga
--
-- Quién y cuándo los pone la base (sus valores por defecto); quien descarga
-- solo dice qué formato, cuántos y con qué filtro.
-- -----------------------------------------------------------------------------
revoke insert on public.exportaciones_clientes from authenticated;
grant insert (formato, cantidad, filtro) on public.exportaciones_clientes to authenticated;
