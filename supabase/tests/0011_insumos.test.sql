-- Verifica el catalogo de insumos y la conversion de unidades (0011).
--
-- Esta es LA prueba del proyecto. El plan (doc 02 §9.1) señala la conversion
-- como "la logica con mas riesgo de error silencioso del sistema": si un factor
-- se aplica mal, el sistema no falla -- sigue sumando, con el numero
-- equivocado, y nadie se entera hasta que el inventario no cuadra.
--
-- Cubre ademas una de las nueve obligatorias del doc 02 §11.3: un repartidor no
-- puede leer insumos.
begin;
select plan(32);

-- =============================================================================
-- Fixtures
-- =============================================================================
insert into auth.users (id, email, created_at, updated_at) values
  ('11111111-1111-1111-1111-111111111111', 'super@pimpos.test',   now(), now()),
  ('33333333-3333-3333-3333-333333333333', 'inge@pimpos.test',    now(), now()),
  ('44444444-4444-4444-4444-444444444444', 'reparto@pimpos.test', now(), now());

update public.perfiles set rol = 'superadmin', activo = true where id = '11111111-1111-1111-1111-111111111111';
update public.perfiles set rol = 'ingeniero',  activo = true where id = '33333333-3333-3333-3333-333333333333';
update public.perfiles set rol = 'repartidor', activo = true where id = '44444444-4444-4444-4444-444444444444';

-- =============================================================================
-- Estructura y carga
-- =============================================================================
select has_table('public', 'unidades_medida', 'existe unidades_medida');
select has_table('public', 'proveedores',     'existe proveedores');
select has_table('public', 'almacenes',       'existe almacenes');
select has_table('public', 'insumos',         'existe insumos');
select has_table('public', 'equivalencias',   'existe equivalencias');

select is(
  (select count(*)::int from public.unidades_medida), 11,
  'las 11 unidades de la ficha 7.4'
);
select is(
  (select count(*)::int from public.almacenes where es_principal), 1,
  'hay un almacen principal'
);
select is(
  (select count(*)::int from public.insumos), 22,
  'los 22 insumos de la ficha 7.2'
);
select is(
  (select count(*)::int from public.proveedores), 6,
  'los 6 proveedores de la ficha 7.9'
);
select is(
  (select count(*)::int from public.insumos where es_perecible), 5,
  'los 5 perecibles: manteca, levadura, huevo, mantequilla y frutas confitadas'
);

-- =============================================================================
-- LA PRUEBA CENTRAL: la equivalencia cuelga del insumo, no es global
--
-- Si esto fuera una tabla global de conversiones, "saco" tendria un unico
-- valor y la mitad del inventario quedaria mal desde el primer registro.
-- =============================================================================
select is(
  app.convertir_a_base(
    (select id from public.insumos where nombre = 'Harina'),
    (select id from public.unidades_medida where codigo = 'saco'),
    3
  ),
  150.0::numeric,
  '3 sacos de harina son 150 kg'
);

select is(
  app.convertir_a_base(
    (select id from public.insumos where nombre = 'Sal'),
    (select id from public.unidades_medida where codigo = 'saco'),
    3
  ),
  75.0::numeric,
  'pero 3 sacos de SAL son 75 kg: el mismo "saco" vale distinto'
);

select is(
  app.convertir_a_base(
    (select id from public.insumos where nombre = 'Manteca'),
    (select id from public.unidades_medida where codigo = 'caja'),
    2
  ),
  20.0::numeric,
  '2 cajas de manteca son 20 kg'
);

select is(
  app.convertir_a_base(
    (select id from public.insumos where nombre = 'Frutas confitadas'),
    (select id from public.unidades_medida where codigo = 'caja'),
    2
  ),
  10.0::numeric,
  'y 2 cajas de frutas confitadas son 10 kg: la misma "caja", otro factor'
);

select is(
  app.convertir_a_base(
    (select id from public.insumos where nombre = 'Huevo'),
    (select id from public.unidades_medida where codigo = 'caja'),
    2
  ),
  200.0::numeric,
  'y 2 cajas de huevo son 200 UNIDADES: la misma "caja", ni siquiera la misma magnitud'
);

-- Una cantidad ya en la unidad base pasa tal cual.
select is(
  app.convertir_a_base(
    (select id from public.insumos where nombre = 'Harina'),
    (select id from public.unidades_medida where codigo = 'kg'),
    7.5
  ),
  7.5::numeric,
  'lo que ya viene en la unidad base no se toca'
);

-- Gramos a kilos, para lo que la ficha registra como "Kg/gr".
select is(
  app.convertir_a_base(
    (select id from public.insumos where nombre = 'Levadura'),
    (select id from public.unidades_medida where codigo = 'g'),
    500
  ),
  0.5::numeric,
  '500 g de levadura son 0.5 kg'
);

select is(
  app.convertir_a_base(
    (select id from public.insumos where nombre = 'Vainilla'),
    (select id from public.unidades_medida where codigo = 'botella'),
    2
  ),
  8.0::numeric,
  '2 botellas de vainilla son 8 litros'
);

-- =============================================================================
-- Cuando falta la equivalencia, FALLA. No devuelve la cantidad sin convertir.
--
-- Esta es la parte que evita el error silencioso: si la funcion devolviera el
-- numero tal cual, registrar "3 sacos" sumaria 3 kg al saldo en vez de 150, y
-- el sistema no se quejaria.
-- =============================================================================
select throws_ok(
  format(
    $$ select app.convertir_a_base(%L, %L, 3) $$,
    (select id from public.insumos where nombre = 'Harina'),
    (select id from public.unidades_medida where codigo = 'botella')
  ),
  'P0002',
  null,
  'sin equivalencia registrada, la conversion FALLA en vez de sumar mal'
);

select throws_ok(
  format(
    $$ select app.convertir_a_base('99999999-9999-9999-9999-999999999999', %L, 1) $$,
    (select id from public.unidades_medida where codigo = 'kg')
  ),
  '23503',
  null,
  'y un insumo inexistente tambien falla'
);

-- =============================================================================
-- Restricciones del catalogo
-- =============================================================================
select throws_ok(
  format(
    $$ insert into public.equivalencias (insumo_id, unidad_desde, unidad_hacia, factor)
       values (%L, %L, %L, 1) $$,
    (select id from public.insumos where nombre = 'Harina'),
    (select id from public.unidades_medida where codigo = 'kg'),
    (select id from public.unidades_medida where codigo = 'kg')
  ),
  '23514',
  null,
  'una equivalencia de una unidad consigo misma se rechaza'
);

select throws_ok(
  format(
    $$ insert into public.equivalencias (insumo_id, unidad_desde, unidad_hacia, factor)
       values (%L, %L, %L, 0) $$,
    (select id from public.insumos where nombre = 'Harina'),
    (select id from public.unidades_medida where codigo = 'caja'),
    (select id from public.unidades_medida where codigo = 'kg')
  ),
  '23514',
  null,
  'un factor de cero se rechaza: dejaria el stock siempre en nada'
);

select throws_ok(
  format(
    $$ insert into public.equivalencias (insumo_id, unidad_desde, unidad_hacia, factor)
       values (%L, %L, %L, 99) $$,
    (select id from public.insumos where nombre = 'Harina'),
    (select id from public.unidades_medida where codigo = 'saco'),
    (select id from public.unidades_medida where codigo = 'kg')
  ),
  '23505',
  null,
  'no se puede declarar dos veces la misma equivalencia con otro factor'
);

-- =============================================================================
-- Nada de esto es publico
-- =============================================================================
set local role anon;

select is((select count(*)::int from public.insumos), 0,
  'un anonimo NO ve ningun insumo');
select is((select count(*)::int from public.proveedores), 0,
  'ni los proveedores');
select is((select count(*)::int from public.equivalencias), 0,
  'ni las equivalencias');

reset role;

-- =============================================================================
-- El repartidor tampoco (doc 02 §11.3)
-- =============================================================================
set local role authenticated;
set local request.jwt.claims = '{"sub": "44444444-4444-4444-4444-444444444444", "rol": "repartidor"}';

select is((select count(*)::int from public.insumos), 0,
  'un repartidor NO puede leer insumos');
select is((select count(*)::int from public.proveedores), 0,
  'ni proveedores');

select throws_ok(
  format(
    $$ insert into public.insumos (nombre, unidad_base_id) values ('Colado', %L) $$,
    (select id from public.unidades_medida where codigo = 'kg')
  ),
  '42501',
  null,
  'ni crear uno'
);

-- --- El ingeniero si ---------------------------------------------------------
set local request.jwt.claims = '{"sub": "33333333-3333-3333-3333-333333333333", "rol": "ingeniero"}';

select is((select count(*)::int from public.insumos), 22,
  'un ingeniero si gestiona los insumos');
select lives_ok(
  $$ update public.insumos set stock_minimo = 2000 where nombre = 'Harina' $$,
  'y puede ajustar el stock minimo'
);

reset role;

-- =============================================================================
-- Auditoria (R9)
-- =============================================================================
select ok(
  (select count(*) from app.auditoria where tabla = 'public.insumos') > 0,
  'los cambios en insumos quedan auditados'
);

select * from finish();
rollback;
