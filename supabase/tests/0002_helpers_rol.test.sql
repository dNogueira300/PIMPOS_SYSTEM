-- Verifica los helpers de rol de la migracion 0002.
--
-- Son la pieza de la que cuelga TODA la matriz RLS: si `es_rol()` devolviera
-- true de mas, cada politica del sistema se abriria a la vez. Por eso se
-- prueba explicitamente el caso "sin sesion".
begin;
select plan(12);

-- --- Tipos enumerados (doc 02 §4.2) ------------------------------------------
select has_type('app', 'rol_usuario',        'existe el enum app.rol_usuario');
select has_type('app', 'estado_publicacion', 'existe el enum app.estado_publicacion');

select is(
  (select array_agg(e.enumlabel::text order by e.enumsortorder)
     from pg_enum e
     join pg_type t on t.oid = e.enumtypid
     join pg_namespace n on n.oid = t.typnamespace
    where n.nspname = 'app' and t.typname = 'rol_usuario'),
  array['superadmin', 'administrador', 'ingeniero', 'repartidor'],
  'app.rol_usuario tiene exactamente los 4 roles del plan, en orden'
);

-- --- Sin JWT: falla cerrado --------------------------------------------------
select is(
  app.rol_actual(), null::app.rol_usuario,
  'rol_actual() devuelve NULL cuando no hay claims'
);
select is(
  app.es_rol('superadmin'), false,
  'es_rol() es false sin sesion (no hereda el rol menos privilegiado)'
);
select is(
  app.es_rol('superadmin', 'administrador', 'ingeniero', 'repartidor'), false,
  'es_rol() con los 4 roles sigue siendo false sin sesion'
);

-- --- Con un rol en el claim --------------------------------------------------
set local request.jwt.claims = '{"sub": "00000000-0000-0000-0000-000000000001", "rol": "ingeniero"}';

select is(
  app.rol_actual(), 'ingeniero'::app.rol_usuario,
  'rol_actual() lee el claim rol del JWT'
);
select is(
  app.es_rol('ingeniero'), true,
  'es_rol() reconoce el rol propio'
);
select is(
  app.es_rol('superadmin', 'ingeniero'), true,
  'es_rol() acepta cualquiera de la lista'
);
select is(
  app.es_rol('superadmin', 'administrador'), false,
  'un ingeniero no pasa por administrador'
);

-- --- Claim presente pero nulo (usuario dado de baja) -------------------------
-- El hook escribe `"rol": null` cuando el perfil esta inactivo o borrado.
set local request.jwt.claims = '{"sub": "00000000-0000-0000-0000-000000000001", "rol": null}';

select is(
  app.rol_actual(), null::app.rol_usuario,
  'un claim rol nulo se traduce a NULL'
);
select is(
  app.es_rol('repartidor'), false,
  'un usuario dado de baja no conserva permisos'
);

select * from finish();
rollback;
