-- Verifica las reglas que cerró la revisión final de F6 (0044).
--
-- Lo que se defiende, por la API y no solo por el formulario: que un cliente no
-- se quede sin permiso DESPUÉS de registrarlo; que el permiso no se pueda
-- falsear (versión, fecha, a quién pertenece); que referencia y zona sean
-- obligatorias de verdad (ficha 8); que no quede un cliente activo en una zona
-- retirada; y que la anotación de una descarga no se pueda fechar a mano.
begin;
select plan(21);

insert into auth.users (id, email, created_at, updated_at) values
  ('22222222-2222-2222-2222-222222222222', 'admin@pimpos.test',   now(), now()),
  ('33333333-3333-3333-3333-333333333333', 'inge@pimpos.test',    now(), now()),
  ('44444444-4444-4444-4444-444444444444', 'reparto@pimpos.test', now(), now());
update public.perfiles set rol = 'administrador', activo = true where id = '22222222-2222-2222-2222-222222222222';
update public.perfiles set rol = 'ingeniero',     activo = true where id = '33333333-3333-3333-3333-333333333333';
update public.perfiles set rol = 'repartidor',    activo = true where id = '44444444-4444-4444-4444-444444444444';

insert into public.zonas_reparto (id, nombre, orden) values
  ('eeee0000-0000-0000-0000-000000000044', 'Prueba 0044', 90);
create temp table t (clave text primary key, valor uuid);
grant all on t to authenticated;

-- ---------------------------------------------------------------------------
-- Referencia y zona, obligatorias en la base (ficha 8)
-- ---------------------------------------------------------------------------
set local role authenticated;
set local request.jwt.claims = '{"sub": "33333333-3333-3333-3333-333333333333", "rol": "ingeniero"}';

select throws_ok($$
  select public.registrar_cliente(jsonb_build_object('nombre_completo', 'Sin Referencia', 'celular', '965440001',
    'direccion', 'Calle 1', 'zona_id', 'eeee0000-0000-0000-0000-000000000044'), 'v1-2026-10')
$$, 'P0001', 'Escribe la referencia: cómo reconocer la casa.', 'sin referencia no se registra');
select throws_ok($$
  select public.registrar_cliente(jsonb_build_object('nombre_completo', 'Sin Zona', 'celular', '965440002',
    'direccion', 'Calle 1', 'referencia', 'Portón'), 'v1-2026-10')
$$, 'P0001', 'Elige la zona del cliente.', 'ni sin zona');

insert into t select 'ana', public.registrar_cliente(
  jsonb_build_object('nombre_completo', 'Ana Flores Ríos', 'celular', '965440003', 'direccion', 'Calle 2',
    'referencia', 'Casa verde', 'zona_id', 'eeee0000-0000-0000-0000-000000000044'), 'v1-2026-10');
select isnt((select valor from t where clave = 'ana'), null, 'con las dos, sí');

set local request.jwt.claims = '{"sub": "44444444-4444-4444-4444-444444444444", "rol": "repartidor"}';
select throws_ok($$ update public.clientes set referencia = null where id = (select valor from t where clave = 'ana') $$,
  'P0001', 'Escribe la referencia: cómo reconocer la casa.', 'el repartidor no deja la referencia en blanco');
select lives_ok($$ update public.clientes set referencia = 'Casa verde, reja negra' where id = (select valor from t where clave = 'ana') $$,
  'pero sí la corrige');

-- ---------------------------------------------------------------------------
-- El permiso no se falsea
-- ---------------------------------------------------------------------------
set local request.jwt.claims = '{"sub": "33333333-3333-3333-3333-333333333333", "rol": "ingeniero"}';
select throws_ok($$
  select public.registrar_cliente(jsonb_build_object('nombre_completo', 'Versión Rara', 'celular', '965440004',
    'direccion', 'Calle 3', 'referencia', 'R', 'zona_id', 'eeee0000-0000-0000-0000-000000000044'), 'lo-que-sea')
$$, 'P0001', 'La versión del texto del permiso no es válida.', 'una versión inventada no entra');

insert into public.consentimientos (cliente_id, registrado_por, texto_version, modo, otorgado_en)
values ((select valor from t where clave = 'ana'), '33333333-3333-3333-3333-333333333333', 'v1-2026-10', 'verbal',
        now() - interval '5 years');
select is(
  (select count(*)::int from public.consentimientos
    where cliente_id = (select valor from t where clave = 'ana') and otorgado_en < now() - interval '1 day'),
  0, 'la fecha del permiso es la de cuando se anota, no la que se escriba');

set local request.jwt.claims = '{"sub": "22222222-2222-2222-2222-222222222222", "rol": "administrador"}';
select throws_ok($$ update public.consentimientos set texto_version = 'v9-2030-01'
                     where cliente_id = (select valor from t where clave = 'ana') $$,
  '42501', 'De un permiso solo se puede anotar que se retiró.', 'un permiso anotado no se reescribe');

set local request.jwt.claims = '{"sub": "33333333-3333-3333-3333-333333333333", "rol": "ingeniero"}';
insert into t select 'beto', public.registrar_cliente(
  jsonb_build_object('nombre_completo', 'Beto Ramos Paz', 'celular', '965440005', 'direccion', 'Calle 4',
    'referencia', 'Esquina', 'zona_id', 'eeee0000-0000-0000-0000-000000000044'), 'v1-2026-10');
set local request.jwt.claims = '{"sub": "22222222-2222-2222-2222-222222222222", "rol": "administrador"}';
select throws_ok($$ update public.consentimientos set cliente_id = (select valor from t where clave = 'ana')
                     where cliente_id = (select valor from t where clave = 'beto') $$,
  '42501', null, 'ni se pasa a otro cliente');

-- ---------------------------------------------------------------------------
-- Un cliente no se queda sin permiso después de registrado
-- ---------------------------------------------------------------------------
-- Los permisos de arriba ya están comprobados (en el panel, cada uno es su transacción).
set constraints all immediate;
set constraints all deferred;

-- Ana tiene dos permisos vigentes: retirar uno la deja con el otro.
select lives_ok($$
  update public.consentimientos set revocado_en = now(), revocado_por = '22222222-2222-2222-2222-222222222222'
   where id = (select id from public.consentimientos where cliente_id = (select valor from t where clave = 'ana')
                order by otorgado_en limit 1)
$$, 'retirar un permiso cuando queda otro vigente, sí');
select lives_ok($$ set constraints all immediate $$, 'y al terminar, sigue con permiso');
set constraints all deferred;

-- Beto solo tiene uno: retirarlo lo dejaría sin permiso y con sus datos
-- guardados. El cambio y su comprobación van en un mismo bloque: al fallar se
-- deshace entero, como la transacción de verdad.
select throws_ok($$
  do $x$ begin
    update public.consentimientos
       set revocado_en = now(), revocado_por = '22222222-2222-2222-2222-222222222222'
     where cliente_id = (select valor from public.clientes c join t on t.valor = c.id where t.clave = 'beto');
    set constraints all immediate;
  end $x$
$$, 'P0001', 'Este cliente se quedaría sin permiso. Si lo retiró, usa «Borrar sus datos» en su ficha.',
  'retirar el único permiso de un cliente no llega a guardarse');
select is(
  (select count(*)::int from public.consentimientos
    where cliente_id = (select valor from t where clave = 'beto') and revocado_en is null),
  1, 'y su permiso sigue vigente');

-- Borrar sus datos sí retira el permiso: queda la constancia, y con ella basta.
select lives_ok($$ select * from public.borrar_datos_cliente((select valor from t where clave = 'beto'), 'Lo pidió') $$,
  'borrar sus datos sigue funcionando');
select lives_ok($$ set constraints all immediate $$, 'y no choca con la regla del permiso');
set constraints all deferred;

-- ---------------------------------------------------------------------------
-- Ni un cliente activo en una zona retirada
-- ---------------------------------------------------------------------------
set local request.jwt.claims = '{"sub": "33333333-3333-3333-3333-333333333333", "rol": "ingeniero"}';
update public.clientes set activo = false where id = (select valor from t where clave = 'ana');
set local request.jwt.claims = '{"sub": "22222222-2222-2222-2222-222222222222", "rol": "administrador"}';
select lives_ok($$ update public.zonas_reparto set activo = false where id = 'eeee0000-0000-0000-0000-000000000044' $$,
  'sin clientes activos, la zona se retira');
set local request.jwt.claims = '{"sub": "33333333-3333-3333-3333-333333333333", "rol": "ingeniero"}';
select throws_ok($$ update public.clientes set activo = true where id = (select valor from t where clave = 'ana') $$,
  'P0001', 'La zona Prueba 0044 está retirada. Pásalo a otra zona antes de reactivarlo.',
  'no se reactiva a un cliente en una zona retirada');
select throws_ok($$
  select public.registrar_cliente(jsonb_build_object('nombre_completo', 'En Zona Retirada', 'celular', '965440006',
    'direccion', 'Calle 5', 'referencia', 'R', 'zona_id', 'eeee0000-0000-0000-0000-000000000044'), 'v1-2026-10')
$$, 'P0001', null, 'ni se registra uno nuevo en ella');
select lives_ok($$
  update public.clientes set activo = true, zona_id = (select id from public.zonas_reparto where nombre = 'Belén')
   where id = (select valor from t where clave = 'ana')
$$, 'pasándolo a una zona activa, sí');

-- ---------------------------------------------------------------------------
-- La anotación de una descarga no se fecha a mano
-- ---------------------------------------------------------------------------
set local request.jwt.claims = '{"sub": "22222222-2222-2222-2222-222222222222", "rol": "administrador"}';
select throws_ok($$ insert into public.exportaciones_clientes (formato, cantidad, exportado_en)
                     values ('xlsx', 3, now() - interval '1 year') $$,
  '42501', null, 'la fecha de una descarga la pone la base');
select lives_ok($$ insert into public.exportaciones_clientes (formato, cantidad, filtro)
                    values ('pdf', 3, '{"zona": null, "estado": "activos"}') $$,
  'la descarga normal se sigue anotando');
reset role;

select * from finish();
rollback;
