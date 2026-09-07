-- =============================================================================
-- 0007_auditoria.sql
-- Registro de quien cambio que y cuando (R9; ficha 6.5 y 9.2).
--
-- Va por trigger, no por la aplicacion. Confiar en que cada Server Action se
-- acuerde de registrar su propio cambio es confiar en que nadie se olvide
-- nunca: el dia que alguien anada una ruta nueva o toque una fila desde el
-- SQL Editor, ese cambio no quedaria registrado. El trigger no se olvida.
-- =============================================================================

create table app.auditoria (
  id            bigint generated always as identity primary key,
  tabla         text        not null,
  registro_id   uuid,
  operacion     text        not null check (operacion in ('INSERT', 'UPDATE', 'DELETE')),
  usuario_id    uuid,
  -- El correo se guarda AQUI, en el momento del cambio, en vez de resolverlo
  -- al leer. Dos motivos:
  --  1. Resolverlo al leer obligaria a que quien consulta la auditoria pudiera
  --     leer `auth.users`, y eso expondria los datos de todos los usuarios a
  --     cualquiera con sesion.
  --  2. Un registro que dice "usuario 4f3a..." y ya no se puede resolver
  --     porque esa cuenta se borro no sirve de nada. Esto sobrevive al borrado.
  usuario_correo text,
  rol           text,
  datos_antes   jsonb,
  datos_despues jsonb,
  ocurrido_en   timestamptz not null default now()
);

comment on table app.auditoria is
  'Registro append-only de cambios. Nadie puede modificarlo ni borrarlo: solo el trigger inserta.';
comment on column app.auditoria.registro_id is
  'Clave de la fila afectada, cuando es un uuid. NULL si la tabla usa otro tipo de clave.';
comment on column app.auditoria.usuario_id is
  'NULL cuando el cambio no vino de una sesion: una migracion, una semilla o el SQL Editor.';

-- El informe habitual es "que paso con esta tabla en este periodo", y la
-- pantalla de actividad reciente del panel (doc 03 §5.6) es lo mismo sin
-- filtrar por tabla.
create index idx_auditoria_tabla_fecha on app.auditoria (tabla, ocurrido_en desc);
create index idx_auditoria_fecha       on app.auditoria (ocurrido_en desc);
create index idx_auditoria_usuario     on app.auditoria (usuario_id, ocurrido_en desc);
-- Buscar el historial de una fila concreta: "que le paso a este producto".
create index idx_auditoria_registro    on app.auditoria (registro_id) where registro_id is not null;

-- -----------------------------------------------------------------------------
-- El trigger generico.
--
-- SECURITY DEFINER porque `app.auditoria` no es accesible para `authenticated`
-- -- que es justo lo que queremos: nadie escribe ahi salvo por esta via.
-- -----------------------------------------------------------------------------
create or replace function app.registrar_auditoria()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_antes   jsonb;
  v_despues jsonb;
  v_id      uuid;
  v_clave   text;
  v_usuario uuid;
  v_correo  text;
begin
  if tg_op = 'DELETE' then
    v_antes := to_jsonb(old);
  elsif tg_op = 'INSERT' then
    v_despues := to_jsonb(new);
  else
    v_antes   := to_jsonb(old);
    v_despues := to_jsonb(new);
  end if;

  -- No toda tabla tiene una clave uuid: `roles` usa un enum. Cuando no lo sea
  -- se guarda NULL y la fila entera queda igualmente en los jsonb.
  v_clave := coalesce(v_despues, v_antes) ->> 'id';
  if v_clave is not null and v_clave ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$' then
    v_id := v_clave::uuid;
  end if;

  v_usuario := auth.uid();

  -- Esta funcion es SECURITY DEFINER, asi que si puede leer auth.users aunque
  -- quien disparo el cambio no pueda.
  if v_usuario is not null then
    select u.email into v_correo from auth.users u where u.id = v_usuario;
  end if;

  insert into app.auditoria (
    tabla, registro_id, operacion, usuario_id, usuario_correo, rol,
    datos_antes, datos_despues
  )
  values (
    tg_table_schema || '.' || tg_table_name,
    v_id,
    tg_op,
    v_usuario,
    v_correo,
    -- Puede ser NULL: una migracion o una semilla no traen sesion.
    (select app.rol_actual())::text,
    v_antes,
    v_despues
  );

  return null; -- Trigger AFTER: el valor de retorno se ignora.
end;
$$;

comment on function app.registrar_auditoria() is
  'Trigger AFTER INSERT/UPDATE/DELETE: deja constancia del cambio en app.auditoria.';

revoke execute on function app.registrar_auditoria() from public, anon, authenticated;

-- -----------------------------------------------------------------------------
-- Atajo para enganchar el trigger.
--
-- Las tablas auditables son una docena y llegan repartidas en las migraciones
-- siguientes. Repetir el `create trigger` a mano en cada una invita a que en
-- alguna se escriba mal el nombre o se olvide una operacion.
-- -----------------------------------------------------------------------------
create or replace function app.auditar(p_tabla regclass)
returns void
language plpgsql
as $$
declare
  v_nombre text := 'auditar_' || replace(p_tabla::text, '.', '_');
begin
  execute format(
    'create trigger %I after insert or update or delete on %s
       for each row execute function app.registrar_auditoria()',
    v_nombre, p_tabla
  );
end;
$$;

comment on function app.auditar(regclass) is
  'Engancha el trigger de auditoria a una tabla. Se usa desde las migraciones.';

-- -----------------------------------------------------------------------------
-- Se audita lo que ya existe. El resto se engancha en su propia migracion.
-- -----------------------------------------------------------------------------
select app.auditar('public.perfiles');
select app.auditar('public.roles');

-- =============================================================================
-- RLS
--
-- Una auditoria que se puede editar no sirve de nada: quien hiciera un cambio
-- indebido podria borrar su rastro. Por eso solo hay politica de SELECT, y ni
-- siquiera el superadmin tiene UPDATE ni DELETE.
-- =============================================================================
alter table app.auditoria enable row level security;
alter table app.auditoria force  row level security;

-- El SELECT a nivel de tabla hace falta para que la vista de mas abajo
-- funcione: al declararse `security_invoker`, se ejecuta con los privilegios de
-- quien la llama, no con los de quien la creo. Sin este grant, el panel de
-- auditoria daria permiso denegado. Quien filtra las filas es la politica.
--
-- No abre nada de mas: `app` no se expone por PostgREST, asi que la tabla no
-- es alcanzable desde la API, y la RLS niega igualmente a quien no sea
-- administracion.
grant select on app.auditoria to authenticated;

create policy "solo administracion lee la auditoria"
  on app.auditoria
  for select
  to authenticated
  using ((select app.es_rol('superadmin', 'administrador')));

-- Sin politicas de INSERT, UPDATE ni DELETE. A proposito.

-- -----------------------------------------------------------------------------
-- Vista de lectura para el panel (doc 03 §5.2, /admin/auditoria).
--
-- `security_invoker` es imprescindible: sin el, una vista se ejecuta con los
-- privilegios de quien la creo y saltaria la RLS de la tabla, dejando el
-- historial completo a la vista de cualquiera con sesion.
-- -----------------------------------------------------------------------------
create view public.auditoria
with (security_invoker = true) as
select
  a.id,
  a.tabla,
  a.registro_id,
  a.operacion,
  a.usuario_id,
  a.usuario_correo,
  -- El nombre se resuelve al leer, a proposito: si alguien lo corrige, la
  -- pantalla muestra el nombre bueno. El correo, en cambio, identifica y por
  -- eso se conserva tal como estaba. `perfiles` si es legible por quien puede
  -- leer la auditoria, asi que este join no necesita privilegios extra.
  p.nombre_completo as usuario_nombre,
  a.rol,
  a.datos_antes,
  a.datos_despues,
  a.ocurrido_en
from app.auditoria a
left join public.perfiles p on p.id = a.usuario_id;

comment on view public.auditoria is
  'Auditoria con el nombre y correo de quien hizo el cambio. security_invoker: respeta la RLS.';

grant select on public.auditoria to authenticated;
