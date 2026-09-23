-- Verifica guardar_configuracion (0031).
--
-- Lo que se defiende: que los ajustes se guarden juntos o ninguno; que un dato
-- provisional deje de estarlo al confirmarlo; que el panel no pueda inventar
-- claves; y que solo la administración cambie la configuración.
begin;
select plan(10);

insert into auth.users (id, email, created_at, updated_at) values
  ('22222222-2222-2222-2222-222222222222', 'admin@pimpos.test', now(), now()),
  ('33333333-3333-3333-3333-333333333333', 'inge@pimpos.test',  now(), now());
update public.perfiles set rol = 'administrador', activo = true where id = '22222222-2222-2222-2222-222222222222';
update public.perfiles set rol = 'ingeniero',     activo = true where id = '33333333-3333-3333-3333-333333333333';

select has_function('public', 'guardar_configuracion', array['jsonb', 'text[]'], 'existe guardar_configuracion');

set local role authenticated;
set local request.jwt.claims = '{"sub": "22222222-2222-2222-2222-222222222222", "rol": "administrador"}';

select is(
  public.guardar_configuracion('{"telefono": "065 123456"}'::jsonb, array['delivery_costo']),
  1, 'devuelve cuántos ajustes guardó'
);
select is(
  (select descripcion from public.configuracion_sitio where clave = 'telefono'),
  'Teléfono fijo del local.', 'un dato provisional que se cambia deja de estar PENDIENTE'
);
select ok(
  (select descripcion not like '%PENDIENTE%' from public.configuracion_sitio where clave = 'delivery_costo'),
  'un dato provisional que se confirma sin cambiarlo también deja de estarlo'
);
select ok(
  (select descripcion like '%PENDIENTE%' from public.configuracion_sitio where clave = 'delivery_tiempo'),
  'lo que no se tocó ni se confirmó sigue PENDIENTE'
);
select is(
  (select updated_by from public.configuracion_sitio where clave = 'telefono'),
  '22222222-2222-2222-2222-222222222222'::uuid, 'queda quién lo cambió'
);

select throws_ok(
  $$ select public.guardar_configuracion('{"inventado": "x"}'::jsonb, '{}') $$,
  'P0001', 'No existe el ajuste «inventado».', 'no se crean claves desde el panel'
);

select throws_ok(
  $$ select public.guardar_configuracion('{"telefono": "999", "delivery_costo": "tres"}'::jsonb, '{}') $$,
  '23514', null, 'un valor que viola su check hace fallar la llamada entera'
);
select is(
  (select valor from public.configuracion_sitio where clave = 'telefono'),
  '"065 123456"'::jsonb, 'y el ajuste válido de la misma llamada tampoco se guarda'
);

set local request.jwt.claims = '{"sub": "33333333-3333-3333-3333-333333333333", "rol": "ingeniero"}';
select throws_ok(
  $$ select public.guardar_configuracion('{"telefono": "1"}'::jsonb, '{}') $$,
  '42501', null, 'el ingeniero no cambia la configuración'
);

select * from finish();
rollback;
