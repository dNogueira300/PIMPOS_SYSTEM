-- =============================================================================
-- 0003_roles_perfiles.sql
-- Catalogo de roles, perfiles de usuario, hook del JWT y sus politicas RLS.
--
-- Plan: doc 02 §3 (orden), §11 (matriz RLS) y doc 01 §3.4 (hook del token).
-- Regla del proyecto: ninguna tabla se crea sin su politica RLS en la misma
-- migracion.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- public.roles -- catalogo legible de los 4 roles.
--
-- El conjunto de roles lo fija el enum `app.rol_usuario` (0002), que es lo que
-- leen las politicas. Esta tabla existe para que el panel muestre nombre y
-- descripcion en espanol sin cablearlos en el frontend.
--
-- Por eso NO tiene politicas de insert ni de delete, ni siquiera para el
-- superadmin: anadir un rol exige un valor nuevo del enum, y eso es una
-- migracion. Un catalogo que se puede desincronizar del enum es una trampa.
-- -----------------------------------------------------------------------------
create table public.roles (
  codigo      app.rol_usuario primary key,
  nombre      text        not null,
  descripcion text        not null,
  orden       smallint    not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

comment on table public.roles is
  'Catalogo legible de roles. El conjunto real lo fija el enum app.rol_usuario.';

create trigger roles_set_updated_at
  before update on public.roles
  for each row execute function app.set_updated_at();

-- -----------------------------------------------------------------------------
-- public.perfiles -- datos de aplicacion de cada usuario de auth.
-- -----------------------------------------------------------------------------
create table public.perfiles (
  id              uuid primary key references auth.users(id) on delete cascade,
  rol             app.rol_usuario not null references public.roles(codigo),
  nombre_completo text        not null check (length(btrim(nombre_completo)) > 0),
  celular         text,
  activo          boolean     not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  created_by      uuid references auth.users(id),
  updated_by      uuid references auth.users(id),
  deleted_at      timestamptz
);

comment on table public.perfiles is
  'Perfil de aplicacion de cada usuario. `rol` es la fuente del claim del JWT.';
comment on column public.perfiles.deleted_at is
  'Borrado logico. Un perfil borrado no aparece en el panel pero conserva su rastro en auditoria.';

create trigger perfiles_set_updated_at
  before update on public.perfiles
  for each row execute function app.set_updated_at();

-- Indice sobre la columna que usan las politicas RLS y el hook.
create index idx_perfiles_rol on public.perfiles (rol) where deleted_at is null;

-- -----------------------------------------------------------------------------
-- Hook del access token (doc 01 §3.4).
--
-- Mete el rol dentro del JWT al emitirlo. Sin esto, cada consulta con RLS
-- tendria que ir a buscar el rol a `perfiles` en cada peticion.
--
-- Lo invoca GoTrue como `supabase_auth_admin`, no el usuario final. Es
-- SECURITY DEFINER porque tiene que leer `perfiles` saltando su RLS -- pero no
-- acepta entrada del usuario: `event` lo construye GoTrue.
-- -----------------------------------------------------------------------------
create or replace function app.custom_access_token(event jsonb)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_rol    text;
  v_claims jsonb;
begin
  select p.rol::text
    into v_rol
    from public.perfiles p
   where p.id = (event ->> 'user_id')::uuid
     and p.activo
     and p.deleted_at is null;

  v_claims := coalesce(event -> 'claims', '{}'::jsonb);

  -- Un usuario sin perfil, inactivo o borrado sale con `rol: null`.
  -- app.rol_actual() lo traduce a NULL y app.es_rol() a false: sesion valida,
  -- cero permisos. Es el comportamiento que queremos al dar de baja a alguien.
  if v_rol is null then
    v_claims := jsonb_set(v_claims, '{rol}', 'null'::jsonb, true);
  else
    v_claims := jsonb_set(v_claims, '{rol}', to_jsonb(v_rol), true);
  end if;

  return jsonb_set(event, '{claims}', v_claims, true);
end;
$$;

comment on function app.custom_access_token(jsonb) is
  'Custom Access Token Hook: anade el claim `rol` al JWT leyendo public.perfiles.';

-- Solo GoTrue puede ejecutarlo. Que un cliente pudiera llamarlo no filtraria
-- nada, pero un SECURITY DEFINER accesible es superficie que no hace falta.
revoke execute on function app.custom_access_token(jsonb) from public, anon, authenticated;
grant  usage   on schema   app                             to supabase_auth_admin;
grant  execute on function app.custom_access_token(jsonb)  to supabase_auth_admin;

-- El hook lee `perfiles` con los privilegios del creador (postgres), pero
-- GoTrue necesita ademas el privilegio de tabla para que el plan se resuelva.
grant select on table public.perfiles to supabase_auth_admin;

-- =============================================================================
-- RLS
--
-- Toda tabla arranca negando todo: `enable row level security` sin politicas.
-- Despues se abre lo estrictamente necesario (doc 02 §11).
--
-- Nota de rendimiento: los helpers van envueltos en `(select ...)` para que
-- Postgres los evalue una vez por consulta y no una vez por fila.
-- =============================================================================

alter table public.roles    enable row level security;
alter table public.perfiles enable row level security;

-- Forzar RLS tambien para el dueno de la tabla: sin esto, `postgres` la salta
-- y una prueba pgTAP podria pasar en falso.
alter table public.roles    force row level security;
alter table public.perfiles force row level security;

-- --- roles -------------------------------------------------------------------
-- Lectura anonima: ninguna. Cualquier autenticado puede leer el catalogo.
create policy "autenticado lee catalogo de roles"
  on public.roles
  for select
  to authenticated
  using (true);

-- Sin politicas de insert/update/delete: el catalogo solo cambia por migracion.

-- --- perfiles ----------------------------------------------------------------
-- Cada usuario ve el suyo.
create policy "usuario ve su propio perfil"
  on public.perfiles
  for select
  to authenticated
  using ((select auth.uid()) = id);

-- Los administradores ven todos.
create policy "administracion ve todos los perfiles"
  on public.perfiles
  for select
  to authenticated
  using ((select app.es_rol('superadmin', 'administrador')));

-- Crear y editar: superadmin y administrador.
create policy "administracion crea perfiles"
  on public.perfiles
  for insert
  to authenticated
  with check ((select app.es_rol('superadmin', 'administrador')));

create policy "administracion edita perfiles"
  on public.perfiles
  for update
  to authenticated
  using      ((select app.es_rol('superadmin', 'administrador')))
  with check ((select app.es_rol('superadmin', 'administrador')));

-- Eliminar: solo el superadmin (ficha 12.1, doc 02 §11).
create policy "solo superadmin elimina perfiles"
  on public.perfiles
  for delete
  to authenticated
  using ((select app.es_rol('superadmin')));
