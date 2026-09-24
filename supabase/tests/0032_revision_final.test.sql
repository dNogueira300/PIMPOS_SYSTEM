-- Verifica los cuatro arreglos de base de la revisión final de F4 (0032).
--
--   1. Borrar una promoción en revisión cierra su aviso (si no, el inicio del
--      panel lo cuenta para siempre).
--   2. Cambiar el rol de alguien le cierra la sesión: el rol viaja en el token
--      y, sin esto, el anterior seguía valiendo hasta una hora.
--   3. El bucket `marca` (logo y favicon) solo lo escribe la administración,
--      como la configuración de marca desde F4. La lectura sigue siendo pública.
--   4. El ingeniero marca las alertas de insumos, no los avisos de revisión
--      de promociones, que son de la administración.
begin;
select plan(21);

insert into auth.users (id, email, created_at, updated_at) values
  ('11111111-1111-1111-1111-111111111111', 'super@pimpos.test',   now(), now()),
  ('22222222-2222-2222-2222-222222222222', 'admin@pimpos.test',   now(), now()),
  ('33333333-3333-3333-3333-333333333333', 'inge@pimpos.test',    now(), now()),
  ('44444444-4444-4444-4444-444444444444', 'reparto@pimpos.test', now(), now());
update public.perfiles set rol = 'superadmin',    activo = true where id = '11111111-1111-1111-1111-111111111111';
update public.perfiles set rol = 'administrador', activo = true where id = '22222222-2222-2222-2222-222222222222';
update public.perfiles set rol = 'ingeniero',     activo = true where id = '33333333-3333-3333-3333-333333333333';
update public.perfiles set rol = 'repartidor',    activo = true where id = '44444444-4444-4444-4444-444444444444';

-- =============================================================================
-- 1. Borrar una promoción en revisión cierra su aviso
-- =============================================================================
set local role authenticated;
set local request.jwt.claims = '{"sub": "33333333-3333-3333-3333-333333333333", "rol": "ingeniero"}';

insert into public.novedades (tipo, titulo, slug, contenido, estado) values
  ('promocion', 'Promo a borrar 0032', 'promo-borrar-0032', 'Dos por uno.', 'borrador'),
  ('promocion', 'Promo que sigue 0032', 'promo-sigue-0032', 'Tres por dos.', 'borrador');
update public.novedades set estado = 'en_revision'
 where slug in ('promo-borrar-0032', 'promo-sigue-0032');

set local request.jwt.claims = '{"sub": "22222222-2222-2222-2222-222222222222", "rol": "administrador"}';
update public.novedades set deleted_at = now() where slug = 'promo-borrar-0032';

reset role;
select is(
  (select count(*)::int from public.notificaciones n
     join public.novedades v on v.id = n.novedad_id
    where v.slug = 'promo-borrar-0032' and n.resuelta_en is null),
  0, 'borrar una promoción en revisión cierra su aviso'
);
select is(
  (select count(*)::int from public.notificaciones n
     join public.novedades v on v.id = n.novedad_id
    where v.slug = 'promo-sigue-0032' and n.resuelta_en is null),
  1, 'el aviso de otra promoción en revisión sigue abierto'
);

-- Una promoción borrada no vuelve a avisar aunque alguien la toque por la API.
set local role authenticated;
set local request.jwt.claims = '{"sub": "22222222-2222-2222-2222-222222222222", "rol": "administrador"}';
update public.novedades set estado = 'borrador' where slug = 'promo-borrar-0032';
set local request.jwt.claims = '{"sub": "33333333-3333-3333-3333-333333333333", "rol": "ingeniero"}';
update public.novedades set estado = 'en_revision' where slug = 'promo-borrar-0032';
reset role;
select is(
  (select count(*)::int from public.notificaciones n
     join public.novedades v on v.id = n.novedad_id
    where v.slug = 'promo-borrar-0032' and n.resuelta_en is null),
  0, 'una promoción borrada no abre avisos nuevos'
);

-- =============================================================================
-- 2. Cambiar el rol cierra las sesiones de esa persona, y solo las suyas
-- =============================================================================
insert into auth.sessions (id, user_id, created_at, updated_at) values
  ('aaaaaaaa-0000-0000-0000-000000000032', '44444444-4444-4444-4444-444444444444', now(), now()),
  ('bbbbbbbb-0000-0000-0000-000000000032', '33333333-3333-3333-3333-333333333333', now(), now());

set local role authenticated;
set local request.jwt.claims = '{"sub": "22222222-2222-2222-2222-222222222222", "rol": "administrador"}';
select lives_ok(
  $$ update public.perfiles set nombre_completo = 'Reparto 0032' where id = '44444444-4444-4444-4444-444444444444' $$,
  'el administrador edita el nombre de alguien'
);
reset role;
select is(
  (select count(*)::int from auth.sessions where user_id = '44444444-4444-4444-4444-444444444444'),
  1, 'editar el nombre no cierra la sesión'
);

set local role authenticated;
set local request.jwt.claims = '{"sub": "22222222-2222-2222-2222-222222222222", "rol": "administrador"}';
select lives_ok(
  $$ update public.perfiles set rol = 'ingeniero' where id = '44444444-4444-4444-4444-444444444444' $$,
  'el administrador cambia el rol de alguien'
);
reset role;
select is(
  (select count(*)::int from auth.sessions where user_id = '44444444-4444-4444-4444-444444444444'),
  0, 'cambiarle el rol le cierra la sesión: tiene que volver a entrar con el rol nuevo'
);
select is(
  (select count(*)::int from auth.sessions where user_id = '33333333-3333-3333-3333-333333333333'),
  1, 'la sesión de otra persona no se toca'
);

-- =============================================================================
-- 3. El bucket `marca`: lectura pública, escritura solo de la administración
-- =============================================================================
select is(app.bucket_de_contenido('marca'), false,
  'marca ya no es un bucket de contenido que escriba el ingeniero');
select is(app.bucket_de_contenido('productos'), true,
  'productos sigue siéndolo (los demás buckets no cambian)');

set local role authenticated;
set local request.jwt.claims = '{"sub": "33333333-3333-3333-3333-333333333333", "rol": "ingeniero"}';
select throws_ok(
  $$ insert into storage.objects (bucket_id, name) values ('marca', 'logo-inge-0032.png') $$,
  '42501', 'new row violates row-level security policy for table "objects"',
  'el ingeniero NO sube el logo ni el favicon'
);
select lives_ok(
  $$ insert into storage.objects (bucket_id, name) values ('productos', 'prueba/pan-0032.webp') $$,
  'el ingeniero sigue subiendo fotos de producto'
);

set local request.jwt.claims = '{"sub": "22222222-2222-2222-2222-222222222222", "rol": "administrador"}';
select lives_ok(
  $$ insert into storage.objects (bucket_id, name) values ('marca', 'logo-admin-0032.png') $$,
  'el administrador sí sube el logo'
);

set local request.jwt.claims = '{"sub": "33333333-3333-3333-3333-333333333333", "rol": "ingeniero"}';
update storage.objects set name = 'logo-cambiado-0032.png'
 where bucket_id = 'marca' and name = 'logo-admin-0032.png';
set local storage.allow_delete_query = 'true';
delete from storage.objects where bucket_id = 'marca' and name = 'logo-admin-0032.png';

set local role anon;
select is(
  (select count(*)::int from storage.objects where bucket_id = 'marca' and name = 'logo-admin-0032.png'),
  1, 'el ingeniero no pudo reemplazar ni borrar el logo, y un visitante lo sigue viendo'
);

set local role authenticated;
set local request.jwt.claims = '{"sub": "22222222-2222-2222-2222-222222222222", "rol": "administrador"}';
update storage.objects set metadata = '{"reemplazado": true}'
 where bucket_id = 'marca' and name = 'logo-admin-0032.png';
reset role;
select is(
  (select metadata ->> 'reemplazado' from storage.objects where bucket_id = 'marca' and name = 'logo-admin-0032.png'),
  'true', 'el administrador sí lo reemplaza'
);

set local role authenticated;
set local request.jwt.claims = '{"sub": "22222222-2222-2222-2222-222222222222", "rol": "administrador"}';
delete from storage.objects where bucket_id = 'marca' and name = 'logo-admin-0032.png';
reset role;
select is(
  (select count(*)::int from storage.objects where bucket_id = 'marca' and name = 'logo-admin-0032.png'),
  0, 'y lo borra'
);

set local role authenticated;
set local request.jwt.claims = '{"sub": "44444444-4444-4444-4444-444444444444", "rol": "repartidor"}';
select throws_ok(
  $$ insert into storage.objects (bucket_id, name) values ('marca', 'logo-reparto-0032.png') $$,
  '42501', 'new row violates row-level security policy for table "objects"',
  'el repartidor tampoco'
);
reset role;

-- =============================================================================
-- 4. El ingeniero marca alertas de insumos, no avisos de revisión
-- =============================================================================
insert into public.notificaciones (tipo, titulo, mensaje, clave_unica) values
  ('stock_bajo', 'Queda poca harina', 'Quedan 2 kg.', 'stock_bajo:prueba-0032');

set local role authenticated;
set local request.jwt.claims = '{"sub": "33333333-3333-3333-3333-333333333333", "rol": "ingeniero"}';
update public.notificaciones set resuelta_en = now()
 where novedad_id = (select id from public.novedades where slug = 'promo-sigue-0032');
update public.notificaciones set resuelta_en = now() where clave_unica = 'stock_bajo:prueba-0032';
reset role;

select is(
  (select count(*)::int from public.notificaciones n
     join public.novedades v on v.id = n.novedad_id
    where v.slug = 'promo-sigue-0032' and n.resuelta_en is null),
  1, 'el ingeniero NO cierra el aviso de revisión de una promoción (0 filas actualizadas)'
);
select isnt(
  (select resuelta_en from public.notificaciones where clave_unica = 'stock_bajo:prueba-0032'),
  null, 'el ingeniero sí marca una alerta de insumo'
);

set local role authenticated;
set local request.jwt.claims = '{"sub": "33333333-3333-3333-3333-333333333333", "rol": "ingeniero"}';
select throws_ok(
  $$ update public.notificaciones set tipo = 'promocion_en_revision' where clave_unica = 'stock_bajo:prueba-0032' $$,
  '42501', 'new row violates row-level security policy for table "notificaciones"',
  'ni convierte una alerta de insumo en aviso de revisión'
);

set local request.jwt.claims = '{"sub": "22222222-2222-2222-2222-222222222222", "rol": "administrador"}';
update public.notificaciones set resuelta_en = now()
 where novedad_id = (select id from public.novedades where slug = 'promo-sigue-0032');
reset role;
select is(
  (select count(*)::int from public.notificaciones n
     join public.novedades v on v.id = n.novedad_id
    where v.slug = 'promo-sigue-0032' and n.resuelta_en is null),
  0, 'el administrador sí lo cierra'
);

select * from finish();
rollback;
