-- Verifica el Día de la Madre y los estilos por temática (0049, plan 08.1).
--
-- Lo que se defiende:
--   · la fila del Día de la Madre llega con sus fechas, su estilo y sus textos
--     de partida, sin productos y sin autoría ni auditoría (es el estado de
--     partida, no un cambio de una persona);
--   · cada temática admite solo sus estilos: Navidad no se viste de rosa ni el
--     Día de la Madre de noche, y un estilo sin diseño no entra en ninguna;
--   · el Día de la Madre en diciembre choca con Navidad;
--   · en sus fechas es la activa, y el público lee su estilo.
begin;
select plan(20);

create temp table ref as
select (now() at time zone 'America/Lima')::date as hoy,
       (select id from public.tematicas where slug = 'navidad') as navidad,
       (select id from public.tematicas where slug = 'dia-de-la-madre') as madre;
grant select on ref to anon, authenticated;

-- La fila, tal como la deja la migración.
select is((select count(*)::int from public.tematicas where slug = 'dia-de-la-madre'), 1,
  'existe el Día de la Madre');
select is(
  (select concat_ws('|', nombre, inicio, fin, fecha_evento, estilo, encendido)
     from public.tematicas where slug = 'dia-de-la-madre'),
  'Día de la Madre|2027-05-03|2027-05-10|2027-05-09|rosa-crema|fechas',
  'con sus fechas de fábrica, el estilo «Rosa sobre crema» y según fechas');
select is(
  (select mensajes_cinta from public.tematicas where slug = 'dia-de-la-madre'),
  array['Feliz día, mamá', 'Gracias por todo', 'Delivery a todo Iquitos'],
  'con los tres mensajes de la cinta');
select is(
  (select concat_ws('|', texto_aviso, titulo, entradilla) from public.tematicas
    where slug = 'dia-de-la-madre'),
  'Feliz Día de la Madre: gracias por todo, mamá|Feliz Día de la Madre|'
    || 'Gracias, mamá, por las mañanas de pan caliente. Hoy horneamos pensando en ti.',
  'con el aviso, el título y la entradilla de partida');
select is(
  (select count(*)::int from public.tematica_productos where tematica_id = (select madre from ref)),
  0, 'sin productos de fábrica');
select ok(
  (select created_by is null and updated_by is null from public.tematicas
    where slug = 'dia-de-la-madre'),
  'sin autoría: no la creó una persona');
select is(
  (select count(*)::int from app.auditoria
    where tabla = 'tematicas' and registro_id = (select madre from ref)),
  0, 'y sin filas en la auditoría');

-- Los estilos de cada temática.
select throws_ok(
  $$ update public.tematicas set estilo = 'rosa' where slug = 'navidad' $$,
  '23514', null, 'Navidad no se viste de rosa');
select throws_ok(
  $$ update public.tematicas set estilo = 'noche' where slug = 'dia-de-la-madre' $$,
  '23514', null, 'ni el Día de la Madre de noche');
select throws_ok(
  $$ update public.tematicas set estilo = 'neon' where slug = 'dia-de-la-madre' $$,
  '23514', null, 'y un estilo sin diseño no entra en ninguna');
select lives_ok(
  $$ update public.tematicas set estilo = 'crema' where slug = 'navidad' $$,
  'Navidad admite «crema»');
select lives_ok(
  $$ update public.tematicas set estilo = 'noche' where slug = 'navidad' $$,
  'y «noche»');
select lives_ok(
  $$ update public.tematicas set estilo = 'rosa' where slug = 'dia-de-la-madre' $$,
  'el Día de la Madre admite «rosa»');
select lives_ok(
  $$ update public.tematicas set estilo = 'rosa-crema' where slug = 'dia-de-la-madre' $$,
  'y «rosa-crema»');
select throws_ok(
  $$ insert into public.tematicas (slug, nombre, inicio, fin, estilo)
     values ('san-juan', 'San Juan', '2027-06-20', '2027-06-25', 'noche') $$,
  '23514', null, 'una temática sin diseño en el código no entra');

-- El Día de la Madre en diciembre se cruza con Navidad (en sus fechas de fábrica).
select throws_like(
  $$ update public.tematicas set inicio = '2026-12-05', fin = '2026-12-10'
      where slug = 'dia-de-la-madre' $$,
  '%Navidad%', 'el Día de la Madre en diciembre choca con Navidad');

-- En sus fechas es la activa. Antes se aparta Navidad, que podría estar en las
-- suyas según el día en que corra la prueba.
update public.tematicas set inicio = (select hoy + 200 from ref), fin = (select hoy + 210 from ref)
 where slug = 'navidad';
update public.tematicas set inicio = (select hoy - 1 from ref), fin = (select hoy + 1 from ref)
 where slug = 'dia-de-la-madre';
select is(app.tematica_activa_id(), (select madre from ref), 'en sus fechas, es la activa');
set local role anon;
select is((select slug from public.tematica_publica), 'dia-de-la-madre',
  'el público ve el Día de la Madre');
select is((select estilo from public.tematica_publica), 'rosa-crema', 'con su estilo');
reset role;

-- La restricción de pares es la que manda, también con el nombre de antes fuera.
select ok(
  not exists (select 1 from pg_constraint
               where conrelid = 'public.tematicas'::regclass
                 and conname = 'tematicas_estilo_conocido'),
  'la lista común de estilos de 0048 ya no existe');

select * from finish();
rollback;
