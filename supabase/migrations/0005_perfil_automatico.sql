-- =============================================================================
-- 0005_perfil_automatico.sql
-- Crea el perfil solo, en cuanto nace el usuario en auth.users.
--
-- Antes habia que copiar el UUID del panel e insertar la fila a mano. Ese olvido
-- es silencioso y caro de diagnosticar: el usuario inicia sesion sin problemas,
-- el hook no encuentra perfil, emite `rol: null`, y entonces la RLS le niega
-- todas las consultas. El login funciona y lo que falla es todo lo demas.
--
-- Los usuarios NO se crean por migracion (ver README): `auth.users` es de
-- GoTrue, su esquema cambia entre versiones, exige una fila hermana en
-- `auth.identities`, y meter contrasenas iniciales en un archivo versionado las
-- deja en el historial de Git para siempre. Se crean desde el panel o la Admin
-- API; lo que automatizamos es la parte que si es nuestra.
-- =============================================================================

create or replace function app.crear_perfil_de_usuario()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_rol_texto text;
  v_rol       app.rol_usuario;
  v_nombre    text;
begin
  v_rol_texto := nullif(btrim(coalesce(new.raw_user_meta_data ->> 'rol', '')), '');

  -- Solo los valores validos del enum se aceptan. Cualquier otra cosa cae al
  -- camino inerte de abajo en lugar de reventar el alta del usuario.
  if v_rol_texto is not null
     and exists (
       select 1
         from pg_enum e
         join pg_type t     on t.oid = e.enumtypid
         join pg_namespace n on n.oid = t.typnamespace
        where n.nspname = 'app'
          and t.typname = 'rol_usuario'
          and e.enumlabel = v_rol_texto
     )
  then
    v_rol := v_rol_texto::app.rol_usuario;
  else
    v_rol := null;
  end if;

  v_nombre := coalesce(
    nullif(btrim(coalesce(new.raw_user_meta_data ->> 'nombre_completo', '')), ''),
    split_part(coalesce(new.email, 'usuario'), '@', 1)
  );

  -- Regla de seguridad: un alta sin rol explicito entra INACTIVA.
  --
  -- El rol por defecto tendria que ser `repartidor`, que es el menos
  -- privilegiado -- pero `repartidor` lee la tabla `clientes`, con nombres,
  -- direcciones y fotos de domicilios (R19, Ley N.o 29733). Que un usuario
  -- recien creado acceda a datos personales sin que nadie lo decida es
  -- justo lo que no queremos.
  --
  -- Inactivo significa: el hook emite `rol: null`, app.rol_actual() devuelve
  -- NULL y la RLS niega todo. La cuenta existe y puede entrar, pero no ve nada
  -- hasta que un administrador la active. Es el mismo camino, ya probado, que
  -- el de un usuario dado de baja.
  insert into public.perfiles (id, rol, nombre_completo, activo)
  values (
    new.id,
    coalesce(v_rol, 'repartidor'),
    v_nombre,
    v_rol is not null
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

comment on function app.crear_perfil_de_usuario() is
  'Trigger AFTER INSERT en auth.users: crea el perfil. Sin `rol` en los metadatos, entra inactivo.';

revoke execute on function app.crear_perfil_de_usuario() from public, anon, authenticated;

create trigger crear_perfil_al_alta_de_usuario
  after insert on auth.users
  for each row execute function app.crear_perfil_de_usuario();

-- -----------------------------------------------------------------------------
-- Uso desde el panel (Authentication -> Users -> Add user) o la Admin API:
-- poner en los metadatos del usuario
--
--   {"rol": "ingeniero", "nombre_completo": "Marcos"}
--
-- y la cuenta queda lista y activa. Sin eso, se crea igual pero inactiva, y se
-- activa desde el panel de administracion.
-- -----------------------------------------------------------------------------
