-- Verifica la columna de envío por correo (0040).
--
-- Lo que se defiende: que un aviso nuevo empiece sin enviar; que ninguna
-- persona con sesión (ni la administración) lo marque como enviado, aunque la
-- RLS le deje actualizar la fila; que el servidor sí pueda; y que el trigger
-- no estorbe lo que el panel ya hacía (marcar un aviso como leído).
begin;
select plan(6);

insert into auth.users (id, email, created_at, updated_at) values
  ('22222222-2222-2222-2222-222222222222', 'admin@pimpos.test', now(), now()),
  ('33333333-3333-3333-3333-333333333333', 'inge@pimpos.test',  now(), now());
update public.perfiles set rol = 'administrador', activo = true where id = '22222222-2222-2222-2222-222222222222';
update public.perfiles set rol = 'ingeniero',     activo = true where id = '33333333-3333-3333-3333-333333333333';

insert into public.notificaciones (tipo, titulo, mensaje, clave_unica)
values ('stock_bajo', 'Queda poco Sal', 'Quedan 2 kg de Sal.', 'prueba-0040');

select has_column('public', 'notificaciones', 'enviada_en', 'la notificación recuerda si ya se envió');
select is(
  (select enviada_en from public.notificaciones where clave_unica = 'prueba-0040'),
  null,
  'y empieza sin enviar'
);

set local role authenticated;
set local request.jwt.claims = '{"sub": "33333333-3333-3333-3333-333333333333", "rol": "ingeniero"}';
select throws_ok(
  $$ update public.notificaciones set enviada_en = now() where clave_unica = 'prueba-0040' $$,
  '42501', null, 'marcarla como enviada es cosa del servidor, no de una persona'
);
select lives_ok(
  $$ update public.notificaciones set leida_en = now() where clave_unica = 'prueba-0040' $$,
  'el ingeniero sigue pudiendo marcar el aviso como leído'
);

set local request.jwt.claims = '{"sub": "22222222-2222-2222-2222-222222222222", "rol": "administrador"}';
select throws_ok(
  $$ update public.notificaciones set enviada_en = now() where clave_unica = 'prueba-0040' $$,
  '42501', null, 'tampoco la administración: lo marca solo el resumen diario'
);
reset role;

set local role service_role;
update public.notificaciones set enviada_en = now() where clave_unica = 'prueba-0040';
reset role;
select isnt(
  (select enviada_en from public.notificaciones where clave_unica = 'prueba-0040'),
  null,
  'el servidor (service_role) sí la marca'
);

select * from finish();
rollback;
