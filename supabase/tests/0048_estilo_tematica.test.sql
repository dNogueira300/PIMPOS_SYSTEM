-- Verifica el estilo de una temática (0048).
--
-- Dan pidió las dos variantes de Navidad («Noche de Navidad» y «Crema
-- navideña») y dejar puesta la de noche. Lo que se defiende:
--   · Navidad queda con «noche»;
--   · solo se aceptan los estilos que tienen diseño en el código;
--   · el público lee el estilo de la temática activa, y el panel el de todas;
--   · `guardar_tematica` lo cambia, y si no lo manda deja el que había;
--   · solo la administración lo cambia.
begin;
select plan(11);

insert into auth.users (id, email, created_at, updated_at) values
  ('22222222-2222-2222-2222-222222222222', 'admin@pimpos.test', now(), now()),
  ('33333333-3333-3333-3333-333333333333', 'inge@pimpos.test',  now(), now());
update public.perfiles set rol = 'administrador', activo = true where id = '22222222-2222-2222-2222-222222222222';
update public.perfiles set rol = 'ingeniero',     activo = true where id = '33333333-3333-3333-3333-333333333333';

create temp table ref as
select (now() at time zone 'America/Lima')::date as hoy,
       (select id from public.tematicas where slug = 'navidad') as navidad;
grant select on ref to anon, authenticated;

-- Halloween y el Día de la Canción Criolla (0050), muy lejos: sus fechas de
-- fábrica (25/10–01/11) podrían cruzarse con las que esta prueba pone, según el
-- día en que corra. Las dos van juntas: son alternativas y la Canción Criolla
-- va apagada, así que pueden compartir fechas.
update public.tematicas set inicio = (select hoy + 800 from ref), fin = (select hoy + 810 from ref),
       fecha_evento = null
 where slug in ('cancion-criolla', 'halloween');

select has_column('public', 'tematicas', 'estilo', 'las temáticas tienen estilo');
select is((select estilo from public.tematicas where slug = 'navidad'), 'noche',
  'Navidad queda con «Noche de Navidad», como pidió Dan');
select throws_ok(
  $$ update public.tematicas set estilo = 'neon' where slug = 'navidad' $$,
  '23514', null, 'un estilo sin diseño en el código no entra');
select throws_ok(
  $$ update public.tematicas set estilo = null where slug = 'navidad' $$,
  '23502', null, 'ni se queda sin estilo');

-- El Día de la Madre (0049), lejos: si no, en mayo sus fechas de fábrica se
-- cruzarían con las de Navidad que se ponen aquí.
update public.tematicas set inicio = (select hoy + 400 from ref), fin = (select hoy + 410 from ref),
       fecha_evento = null
 where slug = 'dia-de-la-madre';

-- Navidad activa hoy, para leerla como el público.
update public.tematicas set inicio = (select hoy - 1 from ref), fin = (select hoy + 1 from ref)
 where slug = 'navidad';
set local role anon;
select is((select estilo from public.tematica_publica), 'noche', 'el público lee el estilo de la activa');
reset role;

set local role authenticated;
set local request.jwt.claims = '{"sub": "22222222-2222-2222-2222-222222222222", "rol": "administrador"}';
select is((select estilo from public.tematicas_panel where slug = 'navidad'), 'noche',
  'el panel también lo lee');
select is((select activa from public.tematicas_panel where slug = 'navidad'), true,
  'y la vista del panel sigue diciendo si está activa');

select lives_ok(
  $$ select public.guardar_tematica(
       (select navidad from ref),
       jsonb_build_object('inicio', (select hoy - 1 from ref)::text, 'fin', (select hoy + 1 from ref)::text,
                          'encendido', 'fechas', 'estilo', 'crema'),
       '[]'::jsonb) $$,
  'la administración cambia el estilo');
select is((select estilo from public.tematicas where slug = 'navidad'), 'crema', 'y queda guardado');

select lives_ok(
  $$ select public.guardar_tematica(
       (select navidad from ref),
       jsonb_build_object('inicio', (select hoy - 1 from ref)::text, 'fin', (select hoy + 1 from ref)::text,
                          'encendido', 'fechas'),
       '[]'::jsonb) $$,
  'guardar sin estilo no falla');

set local request.jwt.claims = '{"sub": "33333333-3333-3333-3333-333333333333", "rol": "ingeniero"}';
update public.tematicas set estilo = 'noche' where slug = 'navidad';
reset role;
select is((select estilo from public.tematicas where slug = 'navidad'), 'crema',
  'guardar sin estilo deja el que había, y el ingeniero no lo cambia');

select * from finish();
rollback;
