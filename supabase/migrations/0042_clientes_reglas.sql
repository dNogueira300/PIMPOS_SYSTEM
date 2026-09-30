-- =============================================================================
-- 0042_clientes_reglas.sql
-- Reglas del módulo de clientes (F6, tarea 1). Decisiones de Dan del
-- 30/09/2026, doc 06.
--
--   1. Un cliente y su permiso se guardan juntos: `registrar_cliente`, y un
--      trigger DIFERIDO que rechaza al terminar la transacción todo cliente sin
--      permiso vigente (un insert directo por la API tampoco lo salta).
--   2. El repartidor solo corrige referencia y punto; añade o cambia fotos, no
--      las borra; no da altas ni anota permisos.
--   3. Zonas: solo la administración; una zona con clientes activos no se
--      retira.
--   4. `buscar_clientes`: nombre sin tildes y con errores, o celular escrito de
--      cualquier forma.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Alta con permiso
-- -----------------------------------------------------------------------------
create or replace function public.registrar_cliente(p_cliente jsonb, p_version_texto text)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_id uuid;
begin
  if coalesce(btrim(p_version_texto), '') = '' then
    raise exception 'Falta la versión del texto del permiso.' using errcode = 'P0001';
  end if;

  insert into public.clientes
    (nombre_completo, celular, direccion, referencia, zona_id, latitud, longitud, observacion)
  values (
    p_cliente->>'nombre_completo',
    p_cliente->>'celular',
    p_cliente->>'direccion',
    nullif(btrim(p_cliente->>'referencia'), ''),
    nullif(p_cliente->>'zona_id', '')::uuid,
    (p_cliente->>'latitud')::numeric,
    (p_cliente->>'longitud')::numeric,
    nullif(btrim(p_cliente->>'observacion'), '')
  )
  returning id into v_id;

  insert into public.consentimientos (cliente_id, modo, registrado_por, texto_version)
  values (v_id, 'verbal', auth.uid(), p_version_texto);

  return v_id;
end;
$$;

comment on function public.registrar_cliente(jsonb, text) is
  'Cliente y permiso en una transacción (decisión 5). security invoker: la RLS decide quién registra.';
revoke execute on function public.registrar_cliente(jsonb, text) from public, anon;
grant execute on function public.registrar_cliente(jsonb, text) to authenticated;

-- `security definer`: tiene que ver el permiso aunque la RLS de quien inserta
-- no lo dejara (hoy los cuatro roles leen consentimientos; mañana, quién sabe).
create or replace function app.exigir_permiso()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- Al terminar la transacción la fila puede ya no existir (se borró en la
  -- misma transacción) o ser de ejemplo: no hay nada que exigir.
  if not exists (select 1 from public.clientes c where c.id = new.id and not c.es_demo) then
    return null;
  end if;
  if not exists (
    select 1 from public.consentimientos k where k.cliente_id = new.id and k.revocado_en is null
  ) then
    raise exception 'Sin el permiso del cliente no se puede registrar. Léele el texto y marca «Se lo leí y aceptó».'
      using errcode = 'P0001';
  end if;
  return null;
end;
$$;
revoke execute on function app.exigir_permiso() from public, anon, authenticated;

create constraint trigger clientes_exige_permiso
  after insert on public.clientes
  deferrable initially deferred
  for each row execute function app.exigir_permiso();

-- -----------------------------------------------------------------------------
-- 2. Lo que puede el repartidor
-- -----------------------------------------------------------------------------
drop policy "reparto gestiona clientes" on public.clientes;
create policy "encargados registran clientes"
  on public.clientes for insert to authenticated
  with check ((select app.es_rol('superadmin', 'administrador', 'ingeniero')));
create policy "reparto actualiza clientes"
  on public.clientes for update to authenticated
  using      ((select app.es_rol('superadmin', 'administrador', 'ingeniero', 'repartidor')))
  with check ((select app.es_rol('superadmin', 'administrador', 'ingeniero', 'repartidor')));
-- Sin política de delete: un cliente se desactiva, y a pedido se borran sus
-- datos con `borrar_datos_cliente` (0043).

-- La RLS decide qué FILAS toca cada rol; qué COLUMNAS, un trigger (misma
-- lección que 0029): el repartidor solo corrige lo que descubre en la puerta.
create or replace function app.proteger_clientes()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if (select app.es_rol('repartidor')) and (
       new.nombre_completo is distinct from old.nombre_completo
    or new.celular         is distinct from old.celular
    or new.direccion       is distinct from old.direccion
    or new.zona_id         is distinct from old.zona_id
    or new.observacion     is distinct from old.observacion
    or new.activo          is distinct from old.activo
    or new.deleted_at      is distinct from old.deleted_at
    or new.es_demo         is distinct from old.es_demo
  ) then
    raise exception 'Tu rol solo puede corregir la referencia y el punto en el mapa.'
      using errcode = '42501';
  end if;
  return new;
end;
$$;

create trigger clientes_proteger
  before update on public.clientes
  for each row execute function app.proteger_clientes();

drop policy "reparto gestiona fotos de clientes" on public.cliente_fotos;
create policy "reparto añade fotos de clientes"
  on public.cliente_fotos for insert to authenticated
  with check ((select app.es_rol('superadmin', 'administrador', 'ingeniero', 'repartidor')));
create policy "reparto cambia fotos de clientes"
  on public.cliente_fotos for update to authenticated
  using      ((select app.es_rol('superadmin', 'administrador', 'ingeniero', 'repartidor')))
  with check ((select app.es_rol('superadmin', 'administrador', 'ingeniero', 'repartidor')));
create policy "encargados quitan fotos de clientes"
  on public.cliente_fotos for delete to authenticated
  using ((select app.es_rol('superadmin', 'administrador', 'ingeniero')));

-- El archivo también: 0014 dejaba borrarlo a los cuatro roles. Borrar la foto
-- de la casa de alguien pasa a ser de los encargados, igual que la fila.
drop policy "reparto borra fotos de clientes" on storage.objects;
create policy "encargados borran fotos de clientes"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'clientes'
    and (select app.es_rol('superadmin', 'administrador', 'ingeniero'))
    and app.carpeta_es_cliente_visible(name)
  );

drop policy "reparto registra consentimientos" on public.consentimientos;
create policy "encargados registran consentimientos"
  on public.consentimientos for insert to authenticated
  with check (
    (select app.es_rol('superadmin', 'administrador', 'ingeniero'))
    and registrado_por = (select auth.uid())
  );

-- -----------------------------------------------------------------------------
-- 3. Zonas
-- -----------------------------------------------------------------------------
drop policy "administracion gestiona zonas" on public.zonas_reparto;
create policy "administracion gestiona zonas"
  on public.zonas_reparto for all to authenticated
  using      ((select app.es_rol('superadmin', 'administrador')))
  with check ((select app.es_rol('superadmin', 'administrador')));

create or replace function app.bloquear_retiro_de_zona()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_n integer;
begin
  if (old.activo and not new.activo) or (old.deleted_at is null and new.deleted_at is not null) then
    select count(*) into v_n
      from public.clientes c
     where c.zona_id = new.id and c.activo and c.deleted_at is null;
    if v_n > 0 then
      raise exception 'La zona % tiene % %. Pásalos a otra zona antes de retirarla.',
        new.nombre, v_n, case when v_n = 1 then 'cliente activo' else 'clientes activos' end
        using errcode = 'P0001';
    end if;
  end if;
  return new;
end;
$$;

create trigger zonas_bloquear_retiro
  before update on public.zonas_reparto
  for each row execute function app.bloquear_retiro_de_zona();

-- -----------------------------------------------------------------------------
-- 4. Búsqueda
--
-- El mismo criterio que probó 0013: `sin_tildes(lower(...))` y la similitud de
-- trigramas (0.3, la del operador %). Por celular, solo dígitos y sin el 51
-- de un celular escrito con prefijo, igual que `normalizarCelular` en TS.
-- -----------------------------------------------------------------------------
create or replace function public.buscar_clientes(
  p_texto   text    default null,
  p_zona    uuid    default null,
  p_activos boolean default true
)
returns table (
  id              uuid,
  nombre_completo text,
  celular         text,
  direccion       text,
  referencia      text,
  zona_id         uuid,
  zona            text,
  latitud         numeric,
  longitud        numeric,
  activo          boolean
)
language sql
stable
security invoker
set search_path = ''
as $$
  with q as (
    select app.sin_tildes(lower(btrim(coalesce(p_texto, '')))) as t,
           regexp_replace(coalesce(p_texto, ''), '\D', '', 'g') as d
  ), q2 as (
    select t, case when length(d) = 11 and d like '51%' then substr(d, 3) else d end as d from q
  )
  select c.id, c.nombre_completo, c.celular, c.direccion, c.referencia, c.zona_id, z.nombre,
         c.latitud, c.longitud, c.activo
    from public.clientes c
    left join public.zonas_reparto z on z.id = c.zona_id
    cross join q2
   where c.deleted_at is null
     and c.activo = p_activos
     and (p_zona is null or c.zona_id = p_zona)
     and (
          q2.t = ''
       or app.sin_tildes(lower(c.nombre_completo)) like '%' || q2.t || '%'
       or extensions.similarity(app.sin_tildes(lower(c.nombre_completo)), q2.t) >= 0.3
       or (length(q2.d) >= 3 and regexp_replace(c.celular, '\D', '', 'g') like '%' || q2.d || '%')
     )
   order by extensions.similarity(app.sin_tildes(lower(c.nombre_completo)), q2.t) desc,
            c.nombre_completo
   limit 200;
$$;

comment on function public.buscar_clientes(text, uuid, boolean) is
  'Búsqueda de la ficha 8.6: nombre sin tildes y con errores, o celular. security invoker.';
revoke execute on function public.buscar_clientes(text, uuid, boolean) from public, anon;
grant execute on function public.buscar_clientes(text, uuid, boolean) to authenticated;
