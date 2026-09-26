-- Verifica registrar_conteo, anular_movimiento y kardex_insumo (0037).
begin;
select plan(15);

insert into auth.users (id, email, created_at, updated_at) values
  ('22222222-2222-2222-2222-222222222222', 'admin@pimpos.test', now(), now()),
  ('33333333-3333-3333-3333-333333333333', 'inge@pimpos.test',  now(), now());
update public.perfiles set rol = 'administrador', activo = true, nombre_completo = 'Debra Prueba'
 where id = '22222222-2222-2222-2222-222222222222';
update public.perfiles set rol = 'ingeniero', activo = true, nombre_completo = 'Marcos Prueba'
 where id = '33333333-3333-3333-3333-333333333333';

create temp table ref as
select
  (select id from public.insumos where nombre = 'Mejorador') as mejorador,
  (select id from public.insumos where nombre = 'Levadura')  as levadura,
  (select id from public.insumos where nombre = 'Sal')       as sal,
  (select id from public.unidades_medida where codigo = 'kg') as kg;
create temp table t (clave text primary key, valor uuid);
grant select on ref to authenticated;
grant all on t to authenticated;

select has_function('public', 'registrar_conteo', array['jsonb', 'text'], 'existe registrar_conteo');
select has_function('public', 'kardex_insumo', array['uuid', 'date', 'date'], 'existe kardex_insumo');

-- ---------------------------------------------------------------------------
-- Conteo: el inventario inicial
-- ---------------------------------------------------------------------------
set local role authenticated;
set local request.jwt.claims = '{"sub": "22222222-2222-2222-2222-222222222222", "rol": "administrador"}';

select is(
  public.registrar_conteo(
    jsonb_build_array(
      jsonb_build_object('insumo_id', (select mejorador from ref), 'contado', '12', 'precio_unitario', '8.50'),
      jsonb_build_object('insumo_id', (select sal from ref), 'contado', '0')),
    'Inventario inicial'),
  1, 'un conteo solo registra ajustes donde hay diferencia (la sal ya estaba en 0)'
);
select is(
  (select cantidad_base from public.saldos_insumo where insumo_id = (select mejorador from ref)),
  12.0::numeric(14,4), 'el mejorador queda en lo contado'
);
select is(
  (select l.costo_unitario from public.lotes_insumo l where l.insumo_id = (select mejorador from ref)),
  8.500000::numeric(14,6), 'con el precio que se escribió'
);
select is(
  public.registrar_conteo(
    jsonb_build_array(jsonb_build_object('insumo_id', (select mejorador from ref), 'contado', '9')),
    'Conteo semanal'),
  1, 'contar menos de lo que hay registra una salida'
);
select is(
  (select sentido from public.movimientos_insumo
    where insumo_id = (select mejorador from ref) order by secuencia desc limit 1),
  -1::smallint, 'de 3 kg'
);
select throws_ok($$
  select public.registrar_conteo(
    jsonb_build_array(jsonb_build_object('insumo_id', (select levadura from ref), 'contado', '4')),
    'Inventario inicial')
$$, '23514', null, 'la levadura vence: un conteo que la sube necesita fecha');

-- ---------------------------------------------------------------------------
-- Anular
-- ---------------------------------------------------------------------------
insert into t select 'salida', id from public.movimientos_insumo
 where insumo_id = (select mejorador from ref) and sentido = -1;
insert into t select 'anulacion', public.anular_movimiento((select valor from t where clave = 'salida'), 'Se contó mal');
select is(
  (select cantidad_base from public.saldos_insumo where insumo_id = (select mejorador from ref)),
  12.0::numeric(14,4), 'anular la salida devuelve los 3 kg'
);

-- ---------------------------------------------------------------------------
-- Kárdex
-- ---------------------------------------------------------------------------
-- Un consumo a las 23:30 de Iquitos del día anterior (04:30 UTC de hoy) cuenta
-- en el día de Iquitos, no en el de UTC.
reset role;
insert into public.movimientos_insumo
  (tipo, insumo_id, cantidad, unidad_id, responsable_id, origen_consumo, destino_lote, area_turno, ocurrido_en)
select 'consumo', mejorador, 1, kg, '33333333-3333-3333-3333-333333333333', 'produccion', 'Pan', 'Noche',
       ((now() at time zone 'America/Lima')::date - 1 + time '23:30') at time zone 'America/Lima'
from ref;

set local role authenticated;
set local request.jwt.claims = '{"sub": "33333333-3333-3333-3333-333333333333", "rol": "ingeniero"}';

select is(
  (select count(*)::int from public.kardex_insumo(
     (select mejorador from ref),
     (now() at time zone 'America/Lima')::date - 1,
     (now() at time zone 'America/Lima')::date - 1)),
  1, 'el consumo de las 23:30 cae en el día anterior de Iquitos'
);
select is(
  (select saldo from public.kardex_insumo(
     (select mejorador from ref),
     (now() at time zone 'America/Lima')::date - 1,
     (now() at time zone 'America/Lima')::date - 1)),
  -1::numeric,
  'y su saldo parte de lo que había antes del periodo (nada, ese día): 0 - 1'
);
select is(
  (select array_agg(saldo order by ocurrido_en)
     from public.kardex_insumo((select mejorador from ref),
                               (now() at time zone 'America/Lima')::date,
                               (now() at time zone 'America/Lima')::date)),
  array[11, 8, 11]::numeric[],
  'hoy: parte de -1 (ayer), +12 del inventario, -3 del conteo y +3 de la anulación'
);
select is(
  (select bool_and(anulado) from public.kardex_insumo((select mejorador from ref),
     (now() at time zone 'America/Lima')::date, (now() at time zone 'America/Lima')::date)
   where id = (select valor from t where clave = 'salida')),
  true, 'la salida anulada se marca como anulada'
);
select is(
  (select responsable from public.kardex_insumo((select mejorador from ref),
     (now() at time zone 'America/Lima')::date, (now() at time zone 'America/Lima')::date)
   where id = (select valor from t where clave = 'salida')),
  'Debra Prueba', 'el ingeniero ve el nombre de quien la registró'
);
select throws_ok($$
  select public.registrar_conteo(
    jsonb_build_array(jsonb_build_object('insumo_id', (select mejorador from ref), 'contado', '50')),
    'Intento')
$$, '42501', null, 'el ingeniero no cuenta');
reset role;

select * from finish();
rollback;
