-- =============================================================================
-- 0029_perfiles_protegidos.sql
-- Lo que la RLS de perfiles no puede ver (F4, tarea 6).
--
-- La política "administracion edita perfiles" (0003) decide QUÉ FILAS toca un
-- administrador: todas. No decide QUÉ VALOR escribe. Así que un administrador
-- podía ponerse rol = 'superadmin', desactivar al superadmin o eliminar
-- usuarios, que el doc 03 §5.2 reserva al superadmin. Nadie lo aprovechó
-- porque hasta F4 solo existía el superadmin; con el panel de usuarios dejaría
-- de ser teórico.
--
-- Cinco reglas, para toda escritura hecha con la sesión de una persona:
--   1. Nadie cambia su propio rol, su acceso ni su borrado (tampoco el
--      superadmin: así no se queda el sistema sin ninguno por un descuido).
--   2. Dar o quitar el rol superadmin, solo el superadmin.
--   3. Eliminar (deleted_at), solo el superadmin.
--   4. Desactivar a un superadmin, solo el superadmin.
--   5. El id no cambia: mover la fila del superadmin a otra cuenta sería
--      llevarse su rol sin tocar la columna `rol`.
--
-- Sin sesión (auth.uid() null: migraciones, el trigger de alta de 0005, la
-- service_role) no se aplica: esas escrituras no las hace una persona.
-- =============================================================================

create or replace function app.proteger_perfiles()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_yo        uuid    := auth.uid();
  v_soy_super boolean := (select app.es_rol('superadmin'));
begin
  if v_yo is null then
    return coalesce(new, old);
  end if;

  if tg_op = 'DELETE' then
    if old.id = v_yo then
      raise exception 'No puedes eliminarte a ti mismo.';
    end if;
    return old;
  end if;

  if tg_op = 'INSERT' then
    if new.rol = 'superadmin' and not v_soy_super then
      raise exception 'Solo el super administrador puede dar o quitar ese rol.';
    end if;
    return new;
  end if;

  -- UPDATE
  if new.id is distinct from old.id then
    raise exception 'Un perfil no cambia de cuenta.';
  end if;

  if new.id = v_yo
     and (new.rol is distinct from old.rol
          or new.activo is distinct from old.activo
          or new.deleted_at is distinct from old.deleted_at) then
    raise exception 'No puedes cambiar tu propio rol ni darte de baja. Pídeselo a otro administrador.';
  end if;

  if new.rol is distinct from old.rol
     and 'superadmin' in (new.rol, old.rol)
     and not v_soy_super then
    raise exception 'Solo el super administrador puede dar o quitar ese rol.';
  end if;

  if new.deleted_at is distinct from old.deleted_at and not v_soy_super then
    raise exception 'Solo el super administrador puede eliminar usuarios.';
  end if;

  if old.rol = 'superadmin'
     and new.activo is distinct from old.activo
     and not v_soy_super then
    raise exception 'Solo el super administrador puede dar de baja a un super administrador.';
  end if;

  return new;
end;
$$;

comment on function app.proteger_perfiles() is
  'Trigger BEFORE en perfiles: nadie escala a superadmin sin serlo, nadie se cambia a sí mismo, solo superadmin elimina, el id no cambia.';

create trigger perfiles_proteger
  before insert or update or delete on public.perfiles
  for each row execute function app.proteger_perfiles();
