-- Verifica las solicitudes de baja (0038).
--
-- Lo que se defiende: que pedir no descuente; que solo la administración
-- apruebe o rechace, también llamando a la API; que aprobar descuente con el
-- autorizador correcto; que un rechazo lleve su motivo; y que no se apruebe
-- lo que ya no alcanza.
begin;
select plan(15);

insert into auth.users (id, email, created_at, updated_at) values
  ('22222222-2222-2222-2222-222222222222', 'admin@pimpos.test', now(), now()),
  ('33333333-3333-3333-3333-333333333333', 'inge@pimpos.test',  now(), now());
update public.perfiles set rol = 'administrador', activo = true where id = '22222222-2222-2222-2222-222222222222';
update public.perfiles set rol = 'ingeniero',     activo = true where id = '33333333-3333-3333-3333-333333333333';

create temp table ref as
select (select id from public.insumos where nombre = 'Azúcar')    as azucar,
       (select id from public.unidades_medida where codigo = 'kg') as kg;
create temp table t (clave text primary key, valor uuid);
grant select on ref to authenticated;
grant all on t to authenticated;

-- 20 kg de azúcar para trabajar.
insert into public.movimientos_insumo (tipo, sentido, insumo_id, cantidad, unidad_id, responsable_id, observacion)
select 'ajuste', 1, azucar, 20, kg, '22222222-2222-2222-2222-222222222222', 'Inventario inicial' from ref;

select has_table('public', 'solicitudes_baja', 'existe solicitudes_baja');

set local role authenticated;
set local request.jwt.claims = '{"sub": "33333333-3333-3333-3333-333333333333", "rol": "ingeniero"}';

with s as (
  insert into public.solicitudes_baja (insumo_id, cantidad, unidad_id, motivo_baja, observacion)
  select azucar, 5, kg, 'merma', 'Se mojó un saco' from ref returning id)
insert into t select 'uno', id from s;

select is(
  (select cantidad_base from public.saldos_insumo where insumo_id = (select azucar from ref)),
  20.0::numeric(14,4), 'pedir una baja no descuenta'
);
select is(
  (select solicitado_por from public.solicitudes_baja where id = (select valor from t where clave = 'uno')),
  '33333333-3333-3333-3333-333333333333'::uuid, 'queda a nombre de quien la pide'
);
select throws_ok(
  $$ insert into public.solicitudes_baja (insumo_id, cantidad, unidad_id, motivo_baja, observacion, estado)
     select azucar, 1, kg, 'merma', 'x', 'aprobada' from ref $$,
  '42501', null, 'nadie crea una solicitud ya aprobada'
);
select throws_ok(
  format($$ update public.solicitudes_baja set estado = 'aprobada' where id = %L $$,
         (select valor from t where clave = 'uno')),
  '42501', null, 'ni la cambia a mano'
);
select throws_ok(
  format($$ select public.aprobar_baja(%L) $$, (select valor from t where clave = 'uno')),
  '42501', 'Solo la administración aprueba o rechaza bajas.', 'el ingeniero no aprueba'
);

reset role;
select is(
  (select count(*)::int from public.notificaciones
    where tipo = 'baja_pendiente' and solicitud_baja_id = (select valor from t where clave = 'uno')
      and resuelta_en is null),
  1, 'pedirla avisa a la administración'
);

set local role authenticated;
set local request.jwt.claims = '{"sub": "22222222-2222-2222-2222-222222222222", "rol": "administrador"}';

insert into t select 'movimiento', public.aprobar_baja((select valor from t where clave = 'uno'));

select is(
  (select cantidad_base from public.saldos_insumo where insumo_id = (select azucar from ref)),
  15.0::numeric(14,4), 'aprobarla descuenta 5 kg'
);
select is(
  (select autorizado_por from public.movimientos_insumo where id = (select valor from t where clave = 'movimiento')),
  '22222222-2222-2222-2222-222222222222'::uuid, 'autorizada por quien la aprueba'
);
select is(
  (select responsable_id from public.movimientos_insumo where id = (select valor from t where clave = 'movimiento')),
  '33333333-3333-3333-3333-333333333333'::uuid, 'a nombre de quien la pidió'
);
select throws_ok(
  format($$ select public.aprobar_baja(%L) $$, (select valor from t where clave = 'uno')),
  'P0001', 'Esa solicitud ya se resolvió. Recarga la página.', 'no se aprueba dos veces'
);

-- Una que ya no alcanza
insert into public.solicitudes_baja (id, insumo_id, cantidad, unidad_id, motivo_baja, observacion)
select 'bbbb3838-0000-0000-0000-000000000001', azucar, 50, kg, 'vencimiento', 'Todo vencido' from ref;
select throws_ok(
  $$ select public.aprobar_baja('bbbb3838-0000-0000-0000-000000000001') $$,
  'P0001', 'Solo hay 15 kg de Azúcar. Si en el almacén hay más, falta registrar un ingreso o hacer un conteo.',
  'no se aprueba lo que ya no alcanza, y lo dice'
);
select throws_ok(
  $$ select public.rechazar_baja('bbbb3838-0000-0000-0000-000000000001', ' ') $$,
  'P0001', 'Escribe por qué la rechazas: el ingeniero lo va a leer.', 'un rechazo necesita motivo'
);
select lives_ok(
  $$ select public.rechazar_baja('bbbb3838-0000-0000-0000-000000000001', 'Cuéntalo primero') $$,
  'se rechaza con motivo'
);

reset role;
select is(
  (select count(*)::int from public.notificaciones where tipo = 'baja_pendiente' and resuelta_en is null),
  0, 'y los avisos de las dos quedan resueltos'
);

select * from finish();
rollback;
