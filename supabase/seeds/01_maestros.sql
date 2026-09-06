-- =============================================================================
-- 01_maestros.sql -- datos reales y permanentes (es_demo = false)
--
-- Plan: doc 02 §14.
-- Se carga en cada `supabase db reset`, asi que debe ser idempotente.
--
-- Estado en la Fase 0: solo el catalogo de roles. El resto de maestros
-- (unidades, categorias, 22 insumos, 6 proveedores, configuracion del sitio,
-- zonas de reparto...) llega con las migraciones 0005-0009 de la Fase 2.
-- =============================================================================

-- --- Roles (doc de stack §7) -------------------------------------------------
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
