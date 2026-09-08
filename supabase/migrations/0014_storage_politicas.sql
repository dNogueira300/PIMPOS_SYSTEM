-- =============================================================================
-- 0014_storage_politicas.sql
-- Politicas de los 7 buckets (doc 02 §12).
--
-- Hasta aqui `storage.objects` no tenia NINGUNA politica. Con RLS activada eso
-- significa que el panel no podia subir ni leer un archivo con el JWT del
-- usuario: lo unico que funcionaba era la `service_role`, que salta toda la
-- seguridad y no debe salir del servidor. Este archivo cierra ese hueco.
--
-- Los limites de tamano y los tipos MIME ya los impone la configuracion del
-- bucket (config.toml); aqui se decide QUIEN puede hacer que.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Helpers, para no repetir la lista de buckets en catorce politicas.
-- -----------------------------------------------------------------------------
create or replace function app.bucket_de_contenido(p_bucket text)
returns boolean
language sql
immutable
parallel safe
set search_path = ''
as $$
  select p_bucket in ('marca', 'productos', 'galeria', 'slides', 'insumos');
$$;

comment on function app.bucket_de_contenido(text) is
  'Los 5 buckets publicos que gestionan los roles de contenido.';

grant execute on function app.bucket_de_contenido(text) to anon, authenticated;

-- =============================================================================
-- Los 5 buckets publicos: marca, productos, galeria, slides, insumos
--
-- Su contenido se ve en el sitio publico, asi que la lectura es de todos. La
-- escritura, de los tres roles de contenido -- el repartidor no sube fotos de
-- producto.
-- =============================================================================
create policy "publico ve los buckets de contenido"
  on storage.objects for select to anon, authenticated
  using (app.bucket_de_contenido(bucket_id));

create policy "contenido sube a los buckets de contenido"
  on storage.objects for insert to authenticated
  with check (
    app.bucket_de_contenido(bucket_id)
    and (select app.es_rol('superadmin', 'administrador', 'ingeniero'))
  );

create policy "contenido reemplaza en los buckets de contenido"
  on storage.objects for update to authenticated
  using (
    app.bucket_de_contenido(bucket_id)
    and (select app.es_rol('superadmin', 'administrador', 'ingeniero'))
  )
  with check (
    app.bucket_de_contenido(bucket_id)
    and (select app.es_rol('superadmin', 'administrador', 'ingeniero'))
  );

create policy "contenido borra de los buckets de contenido"
  on storage.objects for delete to authenticated
  using (
    app.bucket_de_contenido(bucket_id)
    and (select app.es_rol('superadmin', 'administrador', 'ingeniero'))
  );

-- =============================================================================
-- Bucket `clientes` -- PRIVADO (R14, R19; Ley N.o 29733)
--
-- Aqui viven las fotos de las fachadas de los domicilios. Nunca hay lectura
-- anonima: el archivo solo sale por una URL firmada de corta duracion, y para
-- firmarla el servidor necesita justamente el permiso de SELECT de abajo.
--
-- La ruta empieza por el id del cliente -- `{cliente_id}/{orden}.webp` --, y esa
-- convencion no es cosmetica: permite que la politica compruebe que la carpeta
-- corresponde a un cliente que el peticionario puede ver. Sin eso, cualquiera
-- de los cuatro roles podria dejar archivos sueltos en el bucket privado sin
-- que nadie pudiera relacionarlos con nadie.
-- =============================================================================
create or replace function app.carpeta_es_cliente_visible(p_nombre text)
returns boolean
language sql
stable
parallel safe
set search_path = ''
as $$
  select exists (
    select 1
      from public.clientes c
     where c.id::text = (storage.foldername(p_nombre))[1]
  );
$$;

comment on function app.carpeta_es_cliente_visible(text) is
  'true si la primera carpeta de la ruta es un cliente que el peticionario puede ver por RLS.';

grant execute on function app.carpeta_es_cliente_visible(text) to authenticated;

-- Sin politica `to anon`. A proposito, y es lo que hace que el bucket sea
-- privado de verdad y no solo de nombre.

create policy "reparto ve las fotos de sus clientes"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'clientes'
    and (select app.es_rol('superadmin', 'administrador', 'ingeniero', 'repartidor'))
    and app.carpeta_es_cliente_visible(name)
  );

create policy "reparto sube fotos de clientes"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'clientes'
    and (select app.es_rol('superadmin', 'administrador', 'ingeniero', 'repartidor'))
    and app.carpeta_es_cliente_visible(name)
  );

create policy "reparto reemplaza fotos de clientes"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'clientes'
    and (select app.es_rol('superadmin', 'administrador', 'ingeniero', 'repartidor'))
    and app.carpeta_es_cliente_visible(name)
  )
  with check (
    bucket_id = 'clientes'
    and (select app.es_rol('superadmin', 'administrador', 'ingeniero', 'repartidor'))
    and app.carpeta_es_cliente_visible(name)
  );

-- Borrar la foto del domicilio de alguien es parte de poder atender una
-- solicitud de supresion de datos, asi que los cuatro roles pueden hacerlo.
create policy "reparto borra fotos de clientes"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'clientes'
    and (select app.es_rol('superadmin', 'administrador', 'ingeniero', 'repartidor'))
    and app.carpeta_es_cliente_visible(name)
  );

-- =============================================================================
-- Bucket `documentos` -- PRIVADO
--
-- Reportes generados y certificaciones. No es contenido publico y tampoco lo
-- necesita el reparto.
-- =============================================================================
create policy "administracion ve los documentos"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'documentos'
    and (select app.es_rol('superadmin', 'administrador', 'ingeniero'))
  );

create policy "administracion gestiona los documentos"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'documentos'
    and (select app.es_rol('superadmin', 'administrador'))
  );

create policy "administracion reemplaza documentos"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'documentos'
    and (select app.es_rol('superadmin', 'administrador'))
  )
  with check (
    bucket_id = 'documentos'
    and (select app.es_rol('superadmin', 'administrador'))
  );

create policy "administracion borra documentos"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'documentos'
    and (select app.es_rol('superadmin', 'administrador'))
  );
