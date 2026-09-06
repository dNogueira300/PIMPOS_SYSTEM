-- =============================================================================
-- 0002_comunes.sql
-- Tipos enumerados, disparador de updated_at y helpers de rol.
--
-- Plan: doc 02 §4 (piezas comunes) y §4.3 (helper de rol).
-- Estas piezas las usan todas las migraciones siguientes, asi que van antes
-- que cualquier tabla de negocio.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Tipos enumerados (doc 02 §4.2).
--
-- Viven en `app` porque son vocabulario del dominio, no datos consultables.
-- `estado_publicacion` se define desde el inicio aunque hoy solo las
-- promociones exijan aprobacion (R10): anadir un flujo de aprobacion despues,
-- con datos ya cargados, es mucho mas caro.
-- -----------------------------------------------------------------------------
create type app.rol_usuario        as enum ('superadmin', 'administrador', 'ingeniero', 'repartidor');
create type app.estado_publicacion as enum ('borrador', 'en_revision', 'publicado', 'archivado');
create type app.tipo_novedad       as enum ('promocion', 'nuevo_producto', 'campania', 'evento', 'aviso');
create type app.tipo_movimiento    as enum ('ingreso', 'consumo', 'baja');
create type app.motivo_baja        as enum ('merma', 'vencimiento', 'danado', 'devolucion_proveedor', 'consumo_interno');
create type app.origen_consumo     as enum ('produccion', 'retiro_directo');

-- Los tipos si tienen que ser legibles por quien consulta la API, porque las
-- columnas que los usan viven en `public`.
grant usage on schema app to anon, authenticated;

-- -----------------------------------------------------------------------------
-- Disparador generico de updated_at.
--
-- `search_path = ''` evita el secuestro de esquema: dentro de la funcion todo
-- va calificado. `now()` y los operadores estan en pg_catalog, que siempre
-- forma parte del path.
-- -----------------------------------------------------------------------------
create or replace function app.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

comment on function app.set_updated_at() is
  'Trigger BEFORE UPDATE: refresca updated_at. Se engancha a toda tabla de negocio.';

-- -----------------------------------------------------------------------------
-- Helpers de rol (doc 02 §4.3).
--
-- Leen el claim que el hook del JWT inyecta al iniciar sesion (ver 0003).
-- No consultan ninguna tabla: cero coste por fila en las politicas RLS.
--
-- Diferencia deliberada con el borrador del plan: `rol_actual()` devuelve NULL
-- cuando no hay claim, en lugar de caer a 'repartidor'. Un peticionario sin
-- sesion no debe heredar el rol menos privilegiado -- debe no tener ninguno.
-- `es_rol()` convierte ese NULL en `false`, de modo que las politicas fallan
-- cerradas.
-- -----------------------------------------------------------------------------
create or replace function app.rol_actual()
returns app.rol_usuario
language sql
stable
set search_path = ''
as $$
  select nullif(
           current_setting('request.jwt.claims', true)::jsonb ->> 'rol',
           ''
         )::app.rol_usuario;
$$;

comment on function app.rol_actual() is
  'Rol del peticionario, leido del claim `rol` del JWT. NULL si no hay sesion.';

create or replace function app.es_rol(variadic roles app.rol_usuario[])
returns boolean
language sql
stable
set search_path = ''
as $$
  select coalesce(app.rol_actual() = any(roles), false);
$$;

comment on function app.es_rol(app.rol_usuario[]) is
  'true si el rol del peticionario esta entre los indicados. false si no hay sesion.';

-- Las politicas RLS se evaluan con los privilegios del peticionario, asi que
-- `authenticated` necesita EXECUTE. Ninguna de las dos es SECURITY DEFINER:
-- no saltan RLS ni leen tablas, solo interpretan el JWT del propio llamante.
grant execute on function app.rol_actual()                to authenticated, anon;
grant execute on function app.es_rol(app.rol_usuario[])   to authenticated, anon;
