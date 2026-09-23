-- Verifica la protección de perfiles (0029).
--
-- Lo que se defiende: que nadie escale a superadmin sin serlo, que nadie se
-- quite ni se cambie a sí mismo el acceso, y que eliminar sea solo del
-- superadmin (doc 03 §5.2). Sin sesión —migraciones, el alta desde el
-- servidor— todo sigue permitido.
--
-- Cada prueba negativa exige el código (P0001, lo que lanza `raise exception`)
-- Y el texto exacto: un 42501 de la RLS o una fila que no se actualiza
-- también serían «no pasó», pero no por la razón que se prueba aquí.
begin;
select plan(14);

insert into auth.users (id, email, created_at, updated_at) values
  ('11111111-1111-1111-1111-111111111111', 'super@pimpos.test', now(), now()),
  ('22222222-2222-2222-2222-222222222222', 'admin@pimpos.test', now(), now()),
  ('33333333-3333-3333-3333-333333333333', 'inge@pimpos.test',  now(), now()),
  ('44444444-4444-4444-4444-444444444444', 'nuevo@pimpos.test', now(), now());
update public.perfiles set rol = 'superadmin',    activo = true where id = '11111111-1111-1111-1111-111111111111';
update public.perfiles set rol = 'administrador', activo = true where id = '22222222-2222-2222-2222-222222222222';
update public.perfiles set rol = 'ingeniero',     activo = true where id = '33333333-3333-3333-3333-333333333333';
-- Una cuenta sin perfil, para probar el INSERT (el trigger de 0005 se lo creó).
delete from public.perfiles where id = '44444444-4444-4444-4444-444444444444';

select pass('sin sesión, los fixtures de arriba entraron: migraciones y altas del servidor siguen funcionando');

set local role authenticated;
set local request.jwt.claims = '{"sub": "22222222-2222-2222-2222-222222222222", "rol": "administrador"}';

select throws_ok(
  $$ update public.perfiles set rol = 'superadmin' where id = '22222222-2222-2222-2222-222222222222' $$,
  'P0001', 'No puedes cambiar tu propio rol ni darte de baja. Pídeselo a otro administrador.',
  'el administrador no se da el rol superadmin a sí mismo'
);
select throws_ok(
  $$ update public.perfiles set rol = 'superadmin' where id = '33333333-3333-3333-3333-333333333333' $$,
  'P0001', 'Solo el super administrador puede dar o quitar ese rol.',
  'ni se lo da a otro'
);
select throws_ok(
  $$ update public.perfiles set rol = 'administrador' where id = '11111111-1111-1111-1111-111111111111' $$,
  'P0001', 'Solo el super administrador puede dar o quitar ese rol.',
  'ni se lo quita al superadmin'
);
select throws_ok(
  $$ insert into public.perfiles (id, rol, nombre_completo, activo)
     values ('44444444-4444-4444-4444-444444444444', 'superadmin', 'Nuevo', true) $$,
  'P0001', 'Solo el super administrador puede dar o quitar ese rol.',
  'ni crea un perfil superadmin'
);
select throws_ok(
  $$ update public.perfiles set id = '44444444-4444-4444-4444-444444444444' where id = '11111111-1111-1111-1111-111111111111' $$,
  'P0001', 'Un perfil no cambia de cuenta.',
  'ni mueve la fila del superadmin a otra cuenta (el rol iría con ella)'
);
select throws_ok(
  $$ update public.perfiles set activo = false where id = '22222222-2222-2222-2222-222222222222' $$,
  'P0001', 'No puedes cambiar tu propio rol ni darte de baja. Pídeselo a otro administrador.',
  'no se desactiva a sí mismo'
);
select throws_ok(
  $$ update public.perfiles set activo = false where id = '11111111-1111-1111-1111-111111111111' $$,
  'P0001', 'Solo el super administrador puede dar de baja a un super administrador.',
  'no desactiva al superadmin'
);
select throws_ok(
  $$ update public.perfiles set deleted_at = now() where id = '33333333-3333-3333-3333-333333333333' $$,
  'P0001', 'Solo el super administrador puede eliminar usuarios.',
  'no elimina a nadie: eso es del superadmin'
);
select lives_ok(
  $$ update public.perfiles set rol = 'repartidor', activo = false where id = '33333333-3333-3333-3333-333333333333' $$,
  'sí cambia el rol y desactiva a un ingeniero'
);
select lives_ok(
  $$ update public.perfiles set nombre_completo = 'Super, con otro nombre' where id = '11111111-1111-1111-1111-111111111111' $$,
  'sí corrige el nombre del superadmin: eso no da ni quita acceso'
);

set local request.jwt.claims = '{"sub": "11111111-1111-1111-1111-111111111111", "rol": "superadmin"}';

select lives_ok(
  $$ update public.perfiles set rol = 'superadmin' where id = '22222222-2222-2222-2222-222222222222' $$,
  'el superadmin sí da el rol superadmin'
);
select throws_ok(
  $$ update public.perfiles set deleted_at = now() where id = '11111111-1111-1111-1111-111111111111' $$,
  'P0001', 'No puedes cambiar tu propio rol ni darte de baja. Pídeselo a otro administrador.',
  'ni el superadmin se elimina a sí mismo'
);
select lives_ok(
  $$ update public.perfiles set deleted_at = now(), activo = false where id = '33333333-3333-3333-3333-333333333333' $$,
  'el superadmin elimina a otro usuario'
);

select * from finish();
rollback;
