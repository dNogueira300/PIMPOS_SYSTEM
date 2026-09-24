-- =============================================================================
-- 0032_revision_final.sql
-- Los cuatro arreglos de base de la revisión final de F4. No reescribe 0014,
-- 0015, 0028 ni 0030: los corrige encima.
--
--   1. Borrar una promoción en revisión cierra su aviso. Antes, borrarla solo
--      ponía `deleted_at`, el aviso se quedaba abierto y el inicio del panel lo
--      contaba para siempre (cuenta notificaciones sin mirar la novedad).
--   2. Cambiar el rol de alguien le cierra la sesión, como ya lo hacía
--      desactivarlo (0030). El rol viaja en el token: sin esto, el anterior
--      seguía valiendo hasta que el token caducara, hasta una hora.
--   3. El bucket `marca` (logo y favicon) solo lo escribe la administración.
--      Desde F4 la configuración de marca es de administración, y 0014 dejaba
--      al ingeniero subir, reemplazar y borrar esos archivos. La lectura sigue
--      siendo pública; los otros cuatro buckets públicos no cambian.
--   4. El ingeniero marca las alertas de insumos, no los avisos de revisión de
--      promociones: esos son de quien aprueba.
--
-- Privilegios: ninguno que 0014, 0015, 0028 o 0030 no necesitaran ya. Crea
-- políticas en storage.objects (como 0014), reemplaza funciones del esquema
-- app y recrea triggers sobre tablas de public. El trigger de sesiones reusa
-- app.cerrar_sesiones_al_dar_de_baja(), que 0030 ya creó con su guarda.
-- =============================================================================

-- =============================================================================
-- 1. El aviso de revisión se cierra al borrar la promoción
-- =============================================================================
create or replace function app.avisar_promocion_en_revision()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- Borrada (borrado lógico): nadie la va a revisar. Va antes del filtro por
  -- tipo a propósito: el aviso se cierra aunque ya no sea una promoción.
  if tg_op = 'UPDATE' and old.deleted_at is null and new.deleted_at is not null then
    update public.notificaciones
       set resuelta_en = now()
     where novedad_id = new.id
       and tipo = 'promocion_en_revision'
       and resuelta_en is null;
    return null;
  end if;

  if new.tipo <> 'promocion' then
    return null;
  end if;

  if new.estado = 'en_revision'
     and new.deleted_at is null
     and (tg_op = 'INSERT' or old.estado is distinct from 'en_revision') then
    insert into public.notificaciones (tipo, titulo, mensaje, novedad_id, clave_unica)
    values (
      'promocion_en_revision',
      'Promoción esperando aprobación',
      format('«%s» espera que la revises antes de publicarla.', new.titulo),
      new.id,
      -- Cada envío es un aviso distinto: una promoción devuelta y reenviada
      -- tiene que volver a avisar.
      format('promocion_en_revision:%s:%s', new.id, extract(epoch from clock_timestamp()))
    );
  elsif tg_op = 'UPDATE' and old.estado = 'en_revision' and new.estado is distinct from 'en_revision' then
    update public.notificaciones
       set resuelta_en = now()
     where novedad_id = new.id
       and tipo = 'promocion_en_revision'
       and resuelta_en is null;
  end if;

  return null;
end;
$$;

drop trigger novedades_avisar_revision on public.novedades;
create trigger novedades_avisar_revision
  after insert or update of estado, deleted_at on public.novedades
  for each row execute function app.avisar_promocion_en_revision();

-- Los avisos que ya quedaron huérfanos antes de esta migración. notificaciones
-- no tiene trigger de auditoría: no hay nada que apagar.
update public.notificaciones n
   set resuelta_en = now()
  from public.novedades v
 where v.id = n.novedad_id
   and v.deleted_at is not null
   and n.tipo = 'promocion_en_revision'
   and n.resuelta_en is null;

-- =============================================================================
-- 2. Cambiar el rol cierra las sesiones
--
-- Misma función que 0030 (borra las filas de auth.sessions de esa persona);
-- cambia solo cuándo se dispara. AFTER: si 0029 niega el cambio de rol, no se
-- llega aquí.
-- =============================================================================
comment on function app.cerrar_sesiones_al_dar_de_baja() is
  'Trigger AFTER UPDATE en perfiles: al desactivar, eliminar o cambiar el rol de una cuenta, borra sus sesiones (0030, 0032).';

drop trigger perfiles_cerrar_sesiones on public.perfiles;
create trigger perfiles_cerrar_sesiones
  after update of activo, deleted_at, rol on public.perfiles
  for each row
  when (   (old.activo and not new.activo)
        or (old.deleted_at is null and new.deleted_at is not null)
        or (old.rol is distinct from new.rol))
  execute function app.cerrar_sesiones_al_dar_de_baja();

-- =============================================================================
-- 3. El bucket `marca`, solo de la administración
--
-- `marca` sale del helper de 0014, y con eso de sus cuatro políticas (lectura
-- incluida). Aquí se le devuelve la lectura pública tal cual y se le dan sus
-- propias políticas de escritura. Los otros cuatro buckets siguen con las de
-- 0014 sin tocarlas.
-- =============================================================================
create or replace function app.bucket_de_contenido(p_bucket text)
returns boolean
language sql
immutable
parallel safe
set search_path = ''
as $$
  select p_bucket in ('productos', 'galeria', 'slides', 'insumos');
$$;

comment on function app.bucket_de_contenido(text) is
  'Los 4 buckets públicos que gestionan los roles de contenido. `marca` tiene políticas propias (0032).';

create policy "publico ve la marca"
  on storage.objects for select to anon, authenticated
  using (bucket_id = 'marca');

create policy "administracion sube a la marca"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'marca'
    and (select app.es_rol('superadmin', 'administrador'))
  );

create policy "administracion reemplaza en la marca"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'marca'
    and (select app.es_rol('superadmin', 'administrador'))
  )
  with check (
    bucket_id = 'marca'
    and (select app.es_rol('superadmin', 'administrador'))
  );

create policy "administracion borra de la marca"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'marca'
    and (select app.es_rol('superadmin', 'administrador'))
  );

-- =============================================================================
-- 4. Quién marca qué notificación
--
-- La administración, todas. El ingeniero, solo las de insumos: el aviso de una
-- promoción en revisión lo cierra el trigger de 1 al aprobarla, devolverla o
-- borrarla, no quien la envió.
-- =============================================================================
drop policy "insumos marca las notificaciones" on public.notificaciones;

create policy "insumos marca las notificaciones"
  on public.notificaciones for update to authenticated
  using (
    (select app.es_rol('superadmin', 'administrador'))
    or ((select app.es_rol('ingeniero')) and tipo in ('stock_bajo', 'por_vencer', 'vencido'))
  )
  with check (
    (select app.es_rol('superadmin', 'administrador'))
    or ((select app.es_rol('ingeniero')) and tipo in ('stock_bajo', 'por_vencer', 'vencido'))
  );
