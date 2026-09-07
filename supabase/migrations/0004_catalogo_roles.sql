-- =============================================================================
-- 0004_catalogo_roles.sql
-- Mueve el catalogo de roles de las semillas a una migracion.
--
-- Por que: `supabase db push` NO aplica las semillas (hace falta
-- --include-seed). El push del 06/09/2026 dejo `public.roles` vacia en
-- produccion, y como `perfiles.rol` tiene clave foranea contra ella, cualquier
-- alta de usuario habria fallado con un error de FK dificil de leer.
--
-- La leccion de fondo: estas 4 filas no son datos de ejemplo, son la contraparte
-- legible del enum `app.rol_usuario`. Estructura, no contenido. Su sitio es una
-- migracion, que se aplica en todos los entornos por igual.
--
-- Idempotente a proposito: se ejecuta sin danos sobre una base que ya las tenga
-- (la local, sembrada por 01_maestros.sql).
-- =============================================================================

insert into public.roles (codigo, nombre, descripcion, orden) values
  ('superadmin',
   'Super administrador',
   'Propietario del negocio. Acceso total. Unico que puede eliminar usuarios.',
   1),

  ('administrador',
   'Administrador',
   'Gestiona contenido, insumos y clientes. Aprueba promociones. No elimina usuarios.',
   2),

  ('ingeniero',
   'Ingeniero',
   'Carga y edita contenido, insumos y clientes. Crea promociones, pero no las publica.',
   3),

  ('repartidor',
   'Repartidor',
   'Consulta y registra clientes para el reparto. Sin acceso a contenido ni insumos.',
   4)
on conflict (codigo) do update
  set nombre      = excluded.nombre,
      descripcion = excluded.descripcion,
      orden       = excluded.orden;

-- Red de seguridad: si en el futuro alguien anade un valor al enum y olvida
-- anadir su fila aqui, el despliegue se detiene en vez de dejar un rol que
-- rompe la clave foranea al primer usuario que lo use.
do $$
declare
  faltantes text;
begin
  select string_agg(e.enumlabel, ', ' order by e.enumsortorder)
    into faltantes
    from pg_enum e
    join pg_type t      on t.oid = e.enumtypid
    join pg_namespace n  on n.oid = t.typnamespace
   where n.nspname = 'app'
     and t.typname = 'rol_usuario'
     and not exists (select 1 from public.roles r where r.codigo::text = e.enumlabel);

  if faltantes is not null then
    raise exception
      'Faltan filas en public.roles para estos valores de app.rol_usuario: %', faltantes;
  end if;
end $$;
