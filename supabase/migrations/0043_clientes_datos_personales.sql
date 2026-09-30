-- =============================================================================
-- 0043_clientes_datos_personales.sql
-- Borrado a pedido, conservación y registro de exportaciones (F6, tarea 2).
-- Decisiones 3, 4 y 6 de Dan (30/09/2026), doc 06. Ley N.° 29733.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- La constancia de cada borrado. Sin datos personales: solo quién, cuándo y
-- por qué. La escribe `borrar_datos_cliente`, nunca una persona a mano.
-- -----------------------------------------------------------------------------
create table public.supresiones (
  id          uuid primary key default gen_random_uuid(),
  cliente_id  uuid not null unique references public.clientes(id) on delete restrict,
  motivo      text not null check (length(btrim(motivo)) >= 3),
  borrado_por uuid not null references auth.users(id) on delete restrict,
  borrado_en  timestamptz not null default now()
);

comment on table public.supresiones is
  'Constancia de que se borraron los datos de un cliente a su pedido (Ley 29733). Sin datos personales.';

alter table public.supresiones enable row level security;
alter table public.supresiones force row level security;
create policy "administracion lee supresiones"
  on public.supresiones for select to authenticated
  using ((select app.es_rol('superadmin', 'administrador')));
revoke insert, update, delete on public.supresiones from anon, authenticated;

-- -----------------------------------------------------------------------------
-- Borrar los datos de un cliente
-- -----------------------------------------------------------------------------
create or replace function public.borrar_datos_cliente(p_id uuid, p_motivo text)
returns table (ruta text)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_rutas text[];
begin
  if not (select app.es_rol('superadmin', 'administrador')) then
    raise exception 'Solo la administración puede borrar los datos de un cliente.' using errcode = '42501';
  end if;
  if coalesce(length(btrim(p_motivo)), 0) < 3 then
    raise exception 'Escribe por qué se borran, por ejemplo «Lo pidió por WhatsApp el 3/10».'
      using errcode = 'P0001';
  end if;

  perform 1 from public.clientes c where c.id = p_id for update;
  if not found then
    raise exception 'No se encontró el cliente. Recarga la página.' using errcode = 'P0002';
  end if;
  if exists (select 1 from public.supresiones s where s.cliente_id = p_id) then
    raise exception 'Los datos de este cliente ya se borraron.' using errcode = 'P0001';
  end if;

  select coalesce(array_agg(f.ruta order by f.orden), '{}') into v_rutas
    from public.cliente_fotos f where f.cliente_id = p_id;

  delete from public.cliente_fotos f where f.cliente_id = p_id;

  update public.consentimientos k
     set revocado_en = now(), revocado_por = auth.uid()
   where k.cliente_id = p_id and k.revocado_en is null;

  -- La nota del permiso es texto libre y puede llevar datos; también la de los
  -- revocados antes.
  update public.consentimientos k
     set observacion = null
   where k.cliente_id = p_id and k.observacion is not null;

  update public.clientes c
     set nombre_completo = 'Datos borrados a pedido del cliente',
         celular         = '000000',
         direccion       = 'Datos borrados',
         referencia      = null,
         observacion     = null,
         latitud         = null,
         longitud        = null,
         activo          = false
   where c.id = p_id;

  -- La única excepción a «la auditoría no se toca» (decisión 3): se tacha el
  -- CONTENIDO de todo lo que dejó este cliente —la ficha, sus fotos, también
  -- las ya quitadas, y sus permisos—, incluidas las filas que acaban de
  -- escribir los cambios de arriba. Quién, cuándo y qué operación se quedan.
  update app.auditoria a
     set datos_antes   = case when a.datos_antes   is null then null else '{"borrado": true}'::jsonb end,
         datos_despues = case when a.datos_despues is null then null else '{"borrado": true}'::jsonb end
   where (a.tabla = 'public.clientes' and a.registro_id = p_id)
      or (a.tabla in ('public.cliente_fotos', 'public.consentimientos')
          and p_id::text in (a.datos_antes ->> 'cliente_id', a.datos_despues ->> 'cliente_id'));

  insert into public.supresiones (cliente_id, motivo, borrado_por)
  values (p_id, btrim(p_motivo), auth.uid());

  return query select unnest(v_rutas);
end;
$$;

comment on function public.borrar_datos_cliente(uuid, text) is
  'Borra los datos personales de un cliente a su pedido, también de la auditoría (tachando el contenido), y deja la constancia. Devuelve las rutas de sus fotos para borrar los archivos.';
revoke execute on function public.borrar_datos_cliente(uuid, text) from public, anon;
grant execute on function public.borrar_datos_cliente(uuid, text) to authenticated;

-- -----------------------------------------------------------------------------
-- Lo borrado no se vuelve a llenar. Sin esto, la ficha anonimizada se podía
-- reactivar y rellenar (y la auditoría guardaría los datos nuevos sin tachar),
-- y el repartidor podía volver a subirle fotos. Si el cliente vuelve, se le
-- registra de nuevo, con su permiso. `borrar_datos_cliente` escribe la
-- constancia AL FINAL, así que sus propios cambios pasan.
--
-- `security definer`: `supresiones` solo la lee la administración, y la regla
-- tiene que ver la constancia también cuando actúa el repartidor.
-- -----------------------------------------------------------------------------
create or replace function app.datos_borrados(p_cliente uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.supresiones s where s.cliente_id = p_cliente);
$$;
revoke execute on function app.datos_borrados(uuid) from public, anon;
grant execute on function app.datos_borrados(uuid) to authenticated;

create or replace function app.proteger_datos_borrados()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_cliente uuid;
begin
  -- Un `if` y no un `case`: PL/pgSQL resuelve los dos lados, y `clientes` no
  -- tiene `cliente_id`.
  if tg_table_name = 'clientes' then
    v_cliente := new.id;
  else
    v_cliente := new.cliente_id;
  end if;
  if app.datos_borrados(v_cliente) then
    raise exception 'Los datos de este cliente se borraron a su pedido. Si vuelve, regístralo de nuevo.'
      using errcode = 'P0001';
  end if;
  return new;
end;
$$;

create trigger clientes_datos_borrados
  before update on public.clientes
  for each row execute function app.proteger_datos_borrados();
create trigger cliente_fotos_datos_borrados
  before insert or update on public.cliente_fotos
  for each row execute function app.proteger_datos_borrados();
create trigger consentimientos_datos_borrados
  before insert or update on public.consentimientos
  for each row execute function app.proteger_datos_borrados();

-- Los archivos, igual: a la carpeta de un cliente borrado no se sube nada. El
-- borrado (0042) sigue igual, para poder reintentar quitar lo que quedó.
create or replace function app.carpeta_admite_fotos(p_nombre text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select not exists (
    select 1 from public.supresiones s
     where s.cliente_id::text = (storage.foldername(p_nombre))[1]
  );
$$;
revoke execute on function app.carpeta_admite_fotos(text) from public, anon;
grant execute on function app.carpeta_admite_fotos(text) to authenticated;

drop policy "reparto sube fotos de clientes" on storage.objects;
create policy "reparto sube fotos de clientes"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'clientes'
    and (select app.es_rol('superadmin', 'administrador', 'ingeniero', 'repartidor'))
    and app.carpeta_es_cliente_visible(name)
    and app.carpeta_admite_fotos(name)
  );

drop policy "reparto reemplaza fotos de clientes" on storage.objects;
create policy "reparto reemplaza fotos de clientes"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'clientes'
    and (select app.es_rol('superadmin', 'administrador', 'ingeniero', 'repartidor'))
    and app.carpeta_es_cliente_visible(name)
    and app.carpeta_admite_fotos(name)
  )
  with check (
    bucket_id = 'clientes'
    and (select app.es_rol('superadmin', 'administrador', 'ingeniero', 'repartidor'))
    and app.carpeta_es_cliente_visible(name)
    and app.carpeta_admite_fotos(name)
  );

-- -----------------------------------------------------------------------------
-- Conservación (decisión 4): nada se borra solo; la administración revisa.
-- «Actividad» es el último cambio en la ficha, sus fotos o su permiso.
-- -----------------------------------------------------------------------------
create view public.clientes_para_revisar
with (security_invoker = true) as
select c.id,
       c.nombre_completo,
       z.nombre as zona,
       x.ultima_actividad
  from public.clientes c
  left join public.zonas_reparto z on z.id = c.zona_id
  cross join lateral (
    select greatest(
      c.updated_at,
      (select max(f.updated_at) from public.cliente_fotos f where f.cliente_id = c.id),
      (select max(k.created_at) from public.consentimientos k where k.cliente_id = c.id)
    ) as ultima_actividad
  ) x
 where c.activo
   and c.deleted_at is null
   and not c.es_demo
   and not exists (select 1 from public.supresiones s where s.cliente_id = c.id)
   and x.ultima_actividad < now() - interval '2 years'
   and (select app.es_rol('superadmin', 'administrador'));

comment on view public.clientes_para_revisar is
  'Clientes activos sin cambios en 2 años (decisión 4). Solo administración. security_invoker.';
grant select on public.clientes_para_revisar to authenticated;

-- -----------------------------------------------------------------------------
-- El permiso vigente de un cliente, con el nombre de quien lo anotó, para la
-- ficha. `app.nombre_de_persona` (0037) solo da el nombre a los roles que ya
-- lo pueden ver; al repartidor le llega «otra persona».
-- -----------------------------------------------------------------------------
create or replace function public.permiso_de_cliente(p_cliente uuid)
returns table (texto_version text, otorgado_en timestamptz, registrado_por text)
language sql
stable
security invoker
set search_path = ''
as $$
  select k.texto_version,
         k.otorgado_en,
         coalesce(app.nombre_de_persona(k.registrado_por), 'otra persona')
    from public.consentimientos k
   where k.cliente_id = p_cliente and k.revocado_en is null
   order by k.otorgado_en desc
   limit 1;
$$;
revoke execute on function public.permiso_de_cliente(uuid) from public, anon;
grant execute on function public.permiso_de_cliente(uuid) to authenticated;

-- -----------------------------------------------------------------------------
-- Registro de exportaciones (decisión 6). Nadie lo corrige ni lo borra.
-- -----------------------------------------------------------------------------
create table public.exportaciones_clientes (
  id            uuid primary key default gen_random_uuid(),
  exportado_por uuid not null default auth.uid() references auth.users(id) on delete restrict,
  exportado_en  timestamptz not null default now(),
  formato       text not null check (formato in ('xlsx', 'pdf')),
  cantidad      integer not null check (cantidad >= 0),
  filtro        jsonb not null default '{}'::jsonb
);

comment on table public.exportaciones_clientes is
  'Cada descarga de la lista de clientes: quién, cuándo, cuántos, filtro y formato (decisión 6).';

alter table public.exportaciones_clientes enable row level security;
alter table public.exportaciones_clientes force row level security;
create policy "administracion registra exportaciones"
  on public.exportaciones_clientes for insert to authenticated
  with check (
    (select app.es_rol('superadmin', 'administrador'))
    and exportado_por = (select auth.uid())
  );
create policy "administracion lee exportaciones"
  on public.exportaciones_clientes for select to authenticated
  using ((select app.es_rol('superadmin', 'administrador')));
revoke update, delete on public.exportaciones_clientes from anon, authenticated;
