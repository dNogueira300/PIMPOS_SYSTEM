-- =============================================================================
-- 0006_perfil_siempre_inactivo.sql
-- El trigger deja de sacar el rol de los metadatos. Siempre.
--
-- Dos motivos, uno de seguridad y otro de que sencillamente no funcionaba.
--
-- 1) SEGURIDAD. La version 0005 leia el rol de `raw_user_meta_data`, que es
--    **editable por el propio usuario**: se escribe con
--    `supabase.auth.updateUser({ data: ... })`, y quien se registra lo manda en
--    `options.data`, que llega en el mismo INSERT que dispara este trigger.
--    Hoy no es explotable porque el registro publico esta cerrado, pero eso lo
--    sostiene un solo ajuste del panel: el dia que alguien reactive los
--    registros, un desconocido se daria de alta con {"rol":"superadmin"}.
--
-- 2) NO FUNCIONABA. La salida evidente era leer `raw_app_meta_data`, que solo
--    escribe la Admin API. Pero GoTrue inserta la fila con su app_metadata por
--    defecto ({"provider":"email",...}) y anade el personalizado en un UPDATE
--    POSTERIOR. Un trigger AFTER INSERT nunca lo ve. Comprobado: un alta con
--    app_metadata {"rol":"superadmin"} producia un perfil `repartidor`
--    inactivo.
--
-- Se podria enganchar tambien al UPDATE, pero eso convierte un metadato en una
-- via de asignacion de permisos, con su propio reparto de confianza que
-- mantener. No compensa: el panel de Supabase **no tiene campo de metadatos**,
-- asi que esa comodidad nunca existio para quien administra a mano, y el panel
-- de usuarios de la Fase 4 asignara el rol con una escritura explicita sobre
-- `perfiles`, que es mas claro de leer y de auditar.
--
-- Lo que el trigger conserva -- y es lo que de verdad aportaba -- es garantizar
-- que TODA alta tenga su fila en `perfiles`, y que nazca inerte. Sin el, un
-- olvido deja al usuario entrando sin perfil: el hook le emite `rol: null`, la
-- RLS le niega cada consulta, y el sintoma es "entro pero no veo nada", que es
-- de los mas caros de diagnosticar.
-- =============================================================================

create or replace function app.crear_perfil_de_usuario()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_nombre text;
begin
  -- El nombre si puede venir de los metadatos: es un dato de presentacion, no
  -- de autorizacion, y el administrador lo corrige desde el panel.
  v_nombre := coalesce(
    nullif(btrim(coalesce(new.raw_user_meta_data ->> 'nombre_completo', '')), ''),
    nullif(btrim(coalesce(new.raw_app_meta_data  ->> 'nombre_completo', '')), ''),
    split_part(coalesce(new.email, 'usuario'), '@', 1)
  );

  -- `repartidor` es solo un relleno para satisfacer la clave foranea: con
  -- `activo = false` el hook emite `rol: null` y la cuenta no alcanza nada.
  -- El rol real lo asigna una persona, siempre.
  insert into public.perfiles (id, rol, nombre_completo, activo)
  values (new.id, 'repartidor', v_nombre, false)
  on conflict (id) do nothing;

  return new;
end;
$$;

comment on function app.crear_perfil_de_usuario() is
  'Trigger AFTER INSERT en auth.users: crea el perfil SIEMPRE inactivo. El rol lo asigna un administrador de forma explicita; nunca sale de metadatos.';

-- -----------------------------------------------------------------------------
-- Activar una cuenta, por correo y sin copiar UUID:
--
--   update public.perfiles p
--      set rol = 'ingeniero', nombre_completo = 'Marcos', activo = true
--     from auth.users u
--    where u.id = p.id and u.email = 'correo@ejemplo.com';
-- -----------------------------------------------------------------------------
