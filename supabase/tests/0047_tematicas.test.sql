-- Verifica las temáticas de temporada (0047).
--
-- Lo que se defiende (ver «Puntos que vigilar» del plan 08):
--   · cuál está activa hoy, según fechas o a mano, y que lo manual caduque en
--     la fecha de fin (Punto 2) y se pierda al cambiar las fechas (Punto 3);
--   · que dos temáticas no puedan estar activas a la vez (Punto 4);
--   · que un producto «solo de temporada» no se vea fuera de su temporada, ni
--     por la vista ni leyendo las tablas como `anon` (Punto 5), y que baste con
--     una de sus temáticas activa (Punto 1);
--   · que solo la administración guarde temáticas.
--
-- Las fechas se escriben relativas a «hoy en Iquitos» para que la prueba no
-- caduque. Como en esta entrega solo existe Navidad, se crea una segunda
-- temática de fixture quitando el `check` del slug dentro de la transacción.
begin;
select plan(52);

insert into auth.users (id, email, created_at, updated_at) values
  ('22222222-2222-2222-2222-222222222222', 'admin@pimpos.test',   now(), now()),
  ('33333333-3333-3333-3333-333333333333', 'inge@pimpos.test',    now(), now()),
  ('44444444-4444-4444-4444-444444444444', 'reparto@pimpos.test', now(), now());
update public.perfiles set rol = 'administrador', activo = true where id = '22222222-2222-2222-2222-222222222222';
update public.perfiles set rol = 'ingeniero',     activo = true where id = '33333333-3333-3333-3333-333333333333';
update public.perfiles set rol = 'repartidor',    activo = true where id = '44444444-4444-4444-4444-444444444444';

create temp table ref as
select
  (now() at time zone 'America/Lima')::date                    as hoy,
  (select id from public.tematicas where slug = 'navidad')       as navidad,
  (select id from public.productos where slug = 'paneton')       as paneton,
  (select id from public.productos where slug = 'ciabatta')      as ciabatta;
grant select on ref to anon, authenticated;

-- La semilla no le pone foto al panetón: sin esta, «ni sus fotos» no podría
-- fallar (revisión de T1, hallazgo 3).
insert into public.producto_imagenes (producto_id, ruta, alt, es_principal)
select paneton, 'paneton-0047.webp', 'Panetón de prueba', true from ref;

-- Una segunda temática solo para la prueba. Antes se aparta Navidad, cuyas
-- fechas de fábrica (1–26/12) podrían cruzarse con las de la fixture.
update public.tematicas set inicio = (select hoy + 100 from ref), fin = (select hoy + 110 from ref)
 where slug = 'navidad';
alter table public.tematicas drop constraint tematicas_slug_conocido;
insert into public.tematicas (slug, nombre, inicio, fin, estilo)
select 'prueba-0047', 'San Prueba', hoy + 30, hoy + 40, 'noche' from ref;
alter table ref add column prueba uuid;
update ref set prueba = (select id from public.tematicas where slug = 'prueba-0047');

select has_table('public', 'tematicas', 'existe la tabla de temáticas');
select has_table('public', 'tematica_productos', 'existe la tabla de productos de temporada');
select has_function('app', 'tematica_activa_id', 'existe la regla de cuál está activa');
select is((select count(*)::int from public.tematicas where slug = 'navidad'), 1,
  'la migración deja la temática de Navidad');
select is(
  (select array_agg(relname::text order by relname) from pg_class
    where relnamespace = 'public'::regnamespace and relname in ('tematicas', 'tematica_productos')
      and relrowsecurity and relforcerowsecurity),
  array['tematica_productos', 'tematicas'], 'las dos tablas fuerzan la RLS, como todas');
select ok(has_function_privilege('service_role', 'app.tematica_activa_id()', 'execute')
      and has_function_privilege('service_role', 'app.producto_en_temporada(uuid)', 'execute'),
  'el servidor (service_role) puede leer las vistas que usan las reglas');

-- ---------------------------------------------------------------------------
-- Cuál está activa: fechas y modo
-- ---------------------------------------------------------------------------
update public.tematicas set inicio = (select hoy + 10 from ref), fin = (select hoy + 20 from ref)
 where slug = 'navidad';
select is(app.tematica_activa_id(), null, 'con las fechas por llegar, ninguna está activa');

update public.tematicas set inicio = (select hoy - 1 from ref), fin = (select hoy + 5 from ref)
 where slug = 'navidad';
select is(app.tematica_activa_id(), (select navidad from ref), 'dentro de sus fechas, Navidad está activa');

update public.tematicas set encendido = 'apagada' where slug = 'navidad';
select is(app.tematica_activa_id(), null, 'apagada a mano, no está activa aunque esté en fechas');
select is(
  (select encendido_hasta from public.tematicas where slug = 'navidad'),
  (select hoy + 5 from ref), 'lo manual caduca en la fecha de fin');

-- Punto 3: cambiar las fechas devuelve la temática a «según fechas».
update public.tematicas set fin = (select hoy + 6 from ref) where slug = 'navidad';
select is((select encendido from public.tematicas where slug = 'navidad'), 'fechas',
  'cambiar las fechas vuelve a «según fechas»');
select is(app.tematica_activa_id(), (select navidad from ref), 'y vuelve a estar activa por fechas');

update public.tematicas set inicio = (select hoy + 10 from ref), fin = (select hoy + 20 from ref)
 where slug = 'navidad';
update public.tematicas set encendido = 'encendida' where slug = 'navidad';
select is(app.tematica_activa_id(), (select navidad from ref),
  'encendida a mano antes de sus fechas, está activa');
select is((select activa from public.tematicas_panel where slug = 'navidad'), true,
  'el panel la ve activa');
update public.tematicas set encendido_hasta = (select hoy + 3650 from ref) where slug = 'navidad';
select is((select encendido_hasta from public.tematicas where slug = 'navidad'), (select hoy + 20 from ref),
  'hasta cuándo dura lo manual no se escribe a mano: es siempre la fecha de fin');
update public.tematicas set encendido_desde = (select hoy - 300 from ref) where slug = 'navidad';
select is((select encendido_desde from public.tematicas where slug = 'navidad'), (select hoy from ref),
  'ni desde cuándo');

-- Hallazgo 10a: encendida antes de su inicio, su ventana empieza hoy.
select throws_ok(
  $$ update public.tematicas set inicio = (select hoy + 2 from ref), fin = (select hoy + 5 from ref)
      where slug = 'prueba-0047' $$,
  'P0001', 'Las fechas se cruzan con «Navidad». Cambia las fechas de una de las dos.',
  'no cabe otra temática entre el día en que se encendió a mano y su inicio');

-- Punto 2: un modo manual que ya caducó deja mandar a las fechas.
alter table public.tematicas disable trigger tematicas_reglas;
update public.tematicas
   set encendido = 'encendida', encendido_desde = (select hoy - 30 from ref), encendido_hasta = (select hoy - 1 from ref),
       inicio = (select hoy - 30 from ref), fin = (select hoy - 1 from ref)
 where slug = 'navidad';
alter table public.tematicas enable trigger tematicas_reglas;
select is(app.tematica_activa_id(), null, 'pasada la fecha de fin, lo encendido a mano se apaga');
select is((select encendido_vigente from public.tematicas_panel where slug = 'navidad'), 'fechas',
  'y el panel dice que ya manda el calendario');

select lives_ok(
  $$ update public.tematicas set titulo = 'Otro título' where slug = 'navidad' $$,
  'con lo manual caducado se puede seguir editando la temática');
select is((select encendido from public.tematicas where slug = 'navidad'), 'fechas',
  'y al guardar queda en «según fechas»');
select throws_ok(
  $$ update public.tematicas set encendido = 'encendida' where slug = 'navidad' $$,
  'P0001', 'Las fechas de esta campaña ya pasaron: pon primero las de este año.',
  'no se enciende a mano una campaña con las fechas pasadas');

-- ---------------------------------------------------------------------------
-- Punto 4: una sola activa a la vez
-- ---------------------------------------------------------------------------
update public.tematicas set inicio = (select hoy - 1 from ref), fin = (select hoy + 5 from ref)
 where slug = 'navidad';
select throws_ok(
  $$ update public.tematicas set encendido = 'encendida' where slug = 'prueba-0047' $$,
  'P0001', 'Las fechas se cruzan con «Navidad». Cambia las fechas de una de las dos.',
  'encender una temática con otra activa se rechaza');
select throws_ok(
  $$ update public.tematicas set inicio = (select hoy + 3 from ref) where slug = 'prueba-0047' $$,
  'P0001', 'Las fechas se cruzan con «Navidad». Cambia las fechas de una de las dos.',
  'mover unas fechas encima de otra temática se rechaza');
select lives_ok(
  $$ update public.tematicas set inicio = (select hoy + 6 from ref) where slug = 'prueba-0047' $$,
  'unas fechas pegadas, sin solaparse, sí valen');

-- ---------------------------------------------------------------------------
-- Productos de temporada
-- ---------------------------------------------------------------------------
insert into public.tematica_productos (tematica_id, producto_id, solo_temporada, orden)
select navidad, paneton, true, 0 from ref
union all select navidad, ciabatta, false, 1 from ref;

-- Navidad fuera de fechas (primero se aparta la fixture, que quedó en hoy+6).
update public.tematicas set inicio = (select hoy + 30 from ref), fin = (select hoy + 40 from ref)
 where slug = 'prueba-0047';
update public.tematicas set inicio = (select hoy + 10 from ref), fin = (select hoy + 20 from ref)
 where slug = 'navidad';

set local role anon;
select is((select count(*)::int from public.productos_publicos where id = (select paneton from ref)), 0,
  'fuera de temporada, el producto solo de temporada no sale en la vista');
select is((select count(*)::int from public.productos where id = (select paneton from ref)), 0,
  'ni leyendo la tabla de productos');
select is((select count(*)::int from public.producto_variantes where producto_id = (select paneton from ref)), 0,
  'ni sus presentaciones');
select is((select count(*)::int from public.producto_imagenes where producto_id = (select paneton from ref)), 0,
  'ni sus fotos');
select is((select count(*)::int from public.productos_publicos where id = (select ciabatta from ref)), 1,
  'un producto de todo el año que está en la temporada sigue a la vista');
select is((select count(*)::int from public.tematica_publica), 0, 'sin temática activa, la vista pública está vacía');
select is((select count(*)::int from public.tematicas), 0, 'y el público no lee temáticas apagadas');
reset role;

-- Navidad activa.
update public.tematicas set inicio = (select hoy - 1 from ref), fin = (select hoy + 5 from ref)
 where slug = 'navidad';
set local role anon;
select is((select count(*)::int from public.productos_publicos where id = (select paneton from ref)), 1,
  'en temporada, el producto se ve');
select ok((select count(*) from public.producto_variantes where producto_id = (select paneton from ref)) > 0,
  'con sus presentaciones');
select is((select count(*)::int from public.producto_imagenes where producto_id = (select paneton from ref)), 1,
  'y su foto');
select is((select slug from public.tematica_publica), 'navidad', 'la vista pública dice cuál está activa');
select is(
  (select array_agg(slug order by orden_temporada) from public.productos_de_temporada),
  array['paneton', 'ciabatta'], 'los productos de la temporada, en su orden');
reset role;

-- Punto 1: con dos temáticas que lo venden, basta una activa.
insert into public.tematica_productos (tematica_id, producto_id, solo_temporada)
select prueba, paneton, true from ref;
update public.tematicas set inicio = (select hoy + 10 from ref), fin = (select hoy + 20 from ref)
 where slug = 'navidad';
update public.tematicas set inicio = (select hoy - 1 from ref), fin = (select hoy + 5 from ref)
 where slug = 'prueba-0047';
set local role anon;
select is((select count(*)::int from public.productos_publicos where id = (select paneton from ref)), 1,
  'en dos temáticas, se ve con la otra activa');
reset role;

-- ---------------------------------------------------------------------------
-- Quién guarda
-- ---------------------------------------------------------------------------
set local role authenticated;
set local request.jwt.claims = '{"sub": "22222222-2222-2222-2222-222222222222", "rol": "administrador"}';
select lives_ok(
  $$ select public.guardar_tematica(
       (select navidad from ref),
       jsonb_build_object('inicio', (select hoy + 10 from ref)::text, 'fin', (select hoy + 20 from ref)::text,
                          'fecha_evento', null, 'encendido', 'fechas', 'texto_aviso', 'Ya llegan los panetones',
                          'mensajes_cinta', jsonb_build_array('Feliz Navidad', 'Delivery a todo Iquitos'),
                          'titulo', 'Lo de esta Navidad', 'entradilla', null),
       jsonb_build_array(jsonb_build_object('producto_id', (select ciabatta from ref), 'solo_temporada', false))) $$,
  'la administración guarda una temática');
select is((select titulo from public.tematicas where slug = 'navidad'), 'Lo de esta Navidad', 'con sus textos');
select is(
  (select array_agg(producto_id) from public.tematica_productos where tematica_id = (select navidad from ref)),
  array[(select ciabatta from ref)], 'y reemplaza sus productos');
select is((select mensajes_cinta from public.tematicas where slug = 'navidad'),
  array['Feliz Navidad', 'Delivery a todo Iquitos'], 'y los mensajes de la cinta');
select lives_ok(
  $$ select public.guardar_tematica(
       (select navidad from ref),
       jsonb_build_object('inicio', (select hoy + 10 from ref)::text, 'fin', (select hoy + 20 from ref)::text,
                          'encendido', 'fechas', 'titulo', 'Lo de esta Navidad'),
       jsonb_build_array(
         jsonb_build_object('producto_id', (select ciabatta from ref), 'solo_temporada', false),
         jsonb_build_object('producto_id', (select ciabatta from ref), 'solo_temporada', true))) $$,
  'un producto repetido en la lista no rompe el guardado');
select is(
  (select count(*)::int from public.tematica_productos where tematica_id = (select navidad from ref)), 1,
  'y queda una sola vez');

set local request.jwt.claims = '{"sub": "33333333-3333-3333-3333-333333333333", "rol": "ingeniero"}';
select throws_ok(
  $$ select public.guardar_tematica((select navidad from ref), '{}'::jsonb, '[]'::jsonb) $$,
  '42501', null, 'el ingeniero no guarda temáticas');
select throws_ok(
  $$ insert into public.tematica_productos (tematica_id, producto_id)
     select navidad, paneton from ref $$,
  '42501', null, 'ni escribe directamente sus productos');

set local request.jwt.claims = '{"sub": "44444444-4444-4444-4444-444444444444", "rol": "repartidor"}';
update public.tematicas set titulo = 'Del repartidor' where slug = 'navidad';
reset role;
select is((select titulo from public.tematicas where slug = 'navidad'), 'Lo de esta Navidad',
  'el repartidor no cambia nada');

-- Volver a encender desde el panel una temática cuyo encendido a mano caducó:
-- el formulario manda «encendida» y la fila guardada también dice «encendida».
update public.tematicas set inicio = (select hoy + 200 from ref), fin = (select hoy + 210 from ref)
 where slug = 'prueba-0047';
alter table public.tematicas disable trigger tematicas_reglas;
update public.tematicas
   set encendido = 'encendida', encendido_desde = (select hoy - 30 from ref), encendido_hasta = (select hoy - 1 from ref),
       inicio = (select hoy - 30 from ref), fin = (select hoy - 1 from ref)
 where slug = 'navidad';
alter table public.tematicas enable trigger tematicas_reglas;
set local role authenticated;
set local request.jwt.claims = '{"sub": "22222222-2222-2222-2222-222222222222", "rol": "administrador"}';
select lives_ok(
  $$ select public.guardar_tematica(
       (select navidad from ref),
       jsonb_build_object('inicio', (select hoy + 10 from ref)::text, 'fin', (select hoy + 20 from ref)::text,
                          'encendido', 'encendida', 'titulo', 'Lo de esta Navidad'),
       '[]'::jsonb) $$,
  'con fechas nuevas, se vuelve a encender a mano una temática que había caducado');
select is((select encendido from public.tematicas where slug = 'navidad'), 'encendida', 'queda encendida');
select is((select encendido_desde from public.tematicas where slug = 'navidad'), (select hoy from ref),
  'desde hoy');
reset role;

select throws_ok(
  $$ update public.tematicas set mensajes_cinta = array['uno','dos','tres','cuatro','cinco','seis','siete']
      where slug = 'navidad' $$,
  '23514', null, 'la cinta admite como mucho seis mensajes');
select throws_ok(
  $$ update public.tematicas set mensajes_cinta = array[null, 'Feliz Navidad'] where slug = 'navidad' $$,
  '23514', null, 'ni mensajes vacíos');

select * from finish();
rollback;
