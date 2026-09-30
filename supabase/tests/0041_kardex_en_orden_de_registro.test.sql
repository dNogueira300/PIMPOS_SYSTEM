-- Verifica 0041: el kárdex acumula en el orden en que se registró cada cosa, y
-- las cantidades se escriben con los gramos.
--
-- Lo que se defiende: que una persona que escribe la hora real de un consumo
-- ANTES de registrar el ingreso que lo cubría no vea «Queda −15 kg» en el
-- kárdex (la base nunca dejó el saldo en negativo: lo validó en el orden de
-- registro); y que «Solo hay 9.985 kg» no se escriba «9.99», que deja a la
-- persona sin salida.
begin;
select plan(8);

insert into auth.users (id, email, created_at, updated_at) values
  ('22222222-2222-2222-2222-222222222222', 'admin@pimpos.test', now(), now()),
  ('33333333-3333-3333-3333-333333333333', 'inge@pimpos.test',  now(), now());
update public.perfiles set rol = 'administrador', activo = true where id = '22222222-2222-2222-2222-222222222222';
update public.perfiles set rol = 'ingeniero',     activo = true where id = '33333333-3333-3333-3333-333333333333';

create temp table ref as
select (select id from public.insumos where nombre = 'Azúcar')    as azucar,
       (select id from public.unidades_medida where codigo = 'kg') as kg,
       (now() at time zone 'America/Lima')::date - 1                as ayer;
grant select on ref to authenticated;

-- ---------------------------------------------------------------------------
-- Cantidades con gramos
-- ---------------------------------------------------------------------------
select is(app.formatear_cantidad(9.985), '9.985', 'los gramos no se redondean: 9.985 kg');
select is(app.formatear_cantidad(0.004), '0.004', 'ni lo poco que queda: 0.004 kg, no «0»');
select is(app.formatear_cantidad(30), '30', 'un entero, sin punto ni ceros');
select is(app.formatear_cantidad(12.5), '12.5', 'y sin ceros de sobra');

-- ---------------------------------------------------------------------------
-- El kárdex, en el orden de registro
-- ---------------------------------------------------------------------------
-- Ayer: 5 kg a las 06:00. El saco de 50 llegó a las 07:00 pero se registró
-- con las 10:00. Por la tarde se registra el consumo de 20 kg con su hora
-- real, las 08:00: la base lo acepta porque, al registrarlo, había 55.
insert into public.movimientos_insumo
  (tipo, sentido, insumo_id, cantidad, unidad_id, responsable_id, observacion, ocurrido_en)
select 'ajuste', 1, azucar, 5, kg, '22222222-2222-2222-2222-222222222222', 'Había',
       (ayer + time '06:00') at time zone 'America/Lima' from ref;
insert into public.movimientos_insumo
  (tipo, sentido, insumo_id, cantidad, unidad_id, responsable_id, observacion, ocurrido_en)
select 'ajuste', 1, azucar, 50, kg, '22222222-2222-2222-2222-222222222222', 'El saco',
       (ayer + time '10:00') at time zone 'America/Lima' from ref;
insert into public.movimientos_insumo
  (tipo, insumo_id, cantidad, unidad_id, responsable_id, origen_consumo, destino_lote, area_turno, ocurrido_en)
select 'consumo', azucar, 20, kg, '33333333-3333-3333-3333-333333333333', 'produccion', 'Pan', 'Mañana',
       (ayer + time '08:00') at time zone 'America/Lima' from ref;

set local role authenticated;
set local request.jwt.claims = '{"sub": "33333333-3333-3333-3333-333333333333", "rol": "ingeniero"}';

select is(
  (select array_agg(saldo)::numeric[] from public.kardex_insumo(
     (select azucar from ref), (select ayer from ref), (select ayer from ref))),
  array[5, 55, 35]::numeric[],
  'se acumula en el orden en que se registró: 5, 55, 35'
);
select is(
  (select bool_and(saldo >= 0) from public.kardex_insumo(
     (select azucar from ref), (select ayer from ref), (select ayer from ref))),
  true,
  'y «Queda» nunca sale negativo, como el saldo real'
);
select is(
  (select array_agg(cantidad_base * sentido)::numeric[] from public.kardex_insumo(
     (select azucar from ref), (select ayer from ref), (select ayer from ref))),
  array[5, 50, -20]::numeric[],
  'las filas salen en ese mismo orden, aunque el consumo diga las 08:00'
);
select is(
  (select to_char(ocurrido_en at time zone 'America/Lima', 'HH24:MI')
     from public.kardex_insumo((select azucar from ref), (select ayer from ref), (select ayer from ref))
    where tipo = 'consumo'),
  '08:00',
  'la hora que escribió la persona se sigue enseñando'
);
reset role;

select * from finish();
rollback;
