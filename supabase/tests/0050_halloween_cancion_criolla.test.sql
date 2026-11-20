-- Verifica Halloween, el Día de la Canción Criolla y la regla de alternativas
-- (0050, plan 08.2).
--
-- Lo que se defiende:
--   · las dos filas llegan con sus fechas, estilos y textos de partida, sin
--     productos y sin autoría ni auditoría; la Canción Criolla, «Apagada»;
--   · cada temática admite solo sus estilos;
--   · Halloween y la Canción Criolla comparten fechas, pero solo una puede estar
--     encendida: entre ellas el cruce se perdona si una está «Apagada», y la
--     frase dice qué hacer;
--   · la «Apagada» de una alternativa sigue apagada aunque le cambien las
--     fechas (por la tabla y por el panel), y el año siguiente se pueden poner
--     las fechas nuevas a las dos;
--   · la excepción no alcanza a Navidad ni al Día de la Madre.
--
-- Las fechas se escriben relativas a «hoy en Iquitos» para que la prueba no
-- caduque.
begin;
select plan(53);

insert into auth.users (id, email, created_at, updated_at) values
  ('55555555-5555-5555-5555-555555555555', 'admin-0050@pimpos.test', now(), now());
update public.perfiles set rol = 'administrador', activo = true
 where id = '55555555-5555-5555-5555-555555555555';

create temp table ref as
select (now() at time zone 'America/Lima')::date as hoy,
       (select id from public.tematicas where slug = 'navidad')         as navidad,
       (select id from public.tematicas where slug = 'dia-de-la-madre') as madre,
       (select id from public.tematicas where slug = 'halloween')       as halloween,
       (select id from public.tematicas where slug = 'cancion-criolla') as criolla;
grant select on ref to anon, authenticated;

-- Guarda una temática como lo hace el panel.
create function pg_temp.guardar(p_slug text, p_inicio date, p_fin date, p_encendido text)
returns void language sql as $$
  select public.guardar_tematica(
    (select id from public.tematicas where slug = p_slug),
    jsonb_build_object('inicio', p_inicio::text, 'fin', p_fin::text, 'encendido', p_encendido,
                       'titulo', 'Prueba 0050'),
    '[]'::jsonb);
$$;

-- ---------------------------------------------------------------------------
-- Las filas, tal como las deja la migración
-- ---------------------------------------------------------------------------
select is((select count(*)::int from public.tematicas where slug in ('halloween', 'cancion-criolla')), 2,
  'existen Halloween y el Día de la Canción Criolla');
select is(
  (select concat_ws('|', nombre, inicio, fin, fecha_evento, estilo, encendido)
     from public.tematicas where slug = 'halloween'),
  'Halloween|2027-10-25|2027-11-01|2027-10-31|calabaza-noche|fechas',
  'Halloween, con sus fechas, «Noche de calabazas» y según fechas');
select is(
  (select mensajes_cinta from public.tematicas where slug = 'halloween'),
  array['Dulce o truco', 'Pan calientito para los disfrazados', 'Delivery a todo Iquitos'],
  'con los tres mensajes de su cinta');
select is(
  (select concat_ws('|', texto_aviso, titulo, entradilla) from public.tematicas where slug = 'halloween'),
  'Feliz Halloween: dulce o truco en Pimpo''s|Feliz Halloween|'
    || 'Dulce o truco: aquí siempre hay pan calientito para los pequeños disfrazados.',
  'con su aviso, su título y su entradilla');
select is(
  (select concat_ws('|', nombre, inicio, fin, fecha_evento, estilo, encendido, encendido_hasta)
     from public.tematicas where slug = 'cancion-criolla'),
  'Día de la Canción Criolla|2027-10-25|2027-11-01|2027-10-31|rojo-blanco|apagada|2027-11-01',
  'la Canción Criolla, en las mismas fechas, «Rojo y blanco» y apagada hasta su fin');
select is(
  (select mensajes_cinta from public.tematicas where slug = 'cancion-criolla'),
  array['Feliz día criollo', 'Pan para la jarana', 'Delivery a todo Iquitos'],
  'con los tres mensajes de su cinta');
select is(
  (select concat_ws('|', texto_aviso, titulo, entradilla) from public.tematicas where slug = 'cancion-criolla'),
  'Feliz Día de la Canción Criolla: pan calientito y buena música|Feliz Día de la Canción Criolla|'
    || 'Un valsecito, un cajón y pan calientito: así se celebra en casa.',
  'con su aviso, su título y su entradilla');
select is(
  (select count(*)::int from public.tematica_productos
    where tematica_id in ((select halloween from ref), (select criolla from ref))),
  0, 'las dos sin productos de fábrica');
-- Solo `created_by` y el alta: las E2E guardan estas temáticas desde el panel
-- en la base local, y esos cambios sí se auditan.
select ok(
  (select bool_and(created_by is null) from public.tematicas where slug in ('halloween', 'cancion-criolla')),
  'sin autoría: no las creó una persona');
select is(
  (select count(*)::int from app.auditoria
    where tabla = 'public.tematicas' and operacion = 'INSERT'
      and registro_id in ((select halloween from ref), (select criolla from ref))),
  0, 'y su alta no dejó filas en la auditoría');

-- ---------------------------------------------------------------------------
-- Los estilos de cada temática
-- ---------------------------------------------------------------------------
select throws_ok($$ update public.tematicas set estilo = 'rosa' where slug = 'halloween' $$,
  '23514', null, 'Halloween no se viste de rosa');
select throws_ok($$ update public.tematicas set estilo = 'calabaza-noche' where slug = 'cancion-criolla' $$,
  '23514', null, 'ni la Canción Criolla de calabazas');
select throws_ok($$ update public.tematicas set estilo = 'balcon' where slug = 'navidad' $$,
  '23514', null, 'ni Navidad de balcón');
select lives_ok($$ update public.tematicas set estilo = 'calabaza-crema' where slug = 'halloween' $$,
  'Halloween admite «calabaza-crema»');
select lives_ok($$ update public.tematicas set estilo = 'calabaza-noche' where slug = 'halloween' $$,
  'y «calabaza-noche»');
select lives_ok($$ update public.tematicas set estilo = 'balcon' where slug = 'cancion-criolla' $$,
  'la Canción Criolla admite «balcon»');
select lives_ok($$ update public.tematicas set estilo = 'rojo-blanco' where slug = 'cancion-criolla' $$,
  'y «rojo-blanco»');

-- ---------------------------------------------------------------------------
-- Las fixtures llevan las dos a un estado conocido, sea el día que sea
-- ---------------------------------------------------------------------------
-- Desde el 02/11/2027 la «Apagada» de fábrica de la Canción Criolla ya nació
-- caducada (y del 25/10 al 01/11/2027 `preparar` apaga Halloween). Aquí se
-- simula lo primero, y el bloque que usan las pruebas 0047–0049 y esta tiene
-- que dejarlas igual: la Canción Criolla apagada y Halloween según fechas,
-- lejos, en las mismas fechas.
update public.tematicas set inicio = (select hoy - 20 from ref), fin = (select hoy - 10 from ref)
 where slug = 'cancion-criolla';
update public.tematicas set inicio = (select hoy - 20 from ref), fin = (select hoy - 10 from ref)
 where slug = 'halloween';
select lives_ok(
  $$
    alter table public.tematicas disable trigger tematicas_reglas;
    update public.tematicas
       set inicio = (select hoy + 800 from ref), fin = (select hoy + 810 from ref), fecha_evento = null,
           encendido = case slug when 'cancion-criolla' then 'apagada' else 'fechas' end,
           encendido_desde = case slug when 'cancion-criolla' then (select hoy from ref) end,
           encendido_hasta = case slug when 'cancion-criolla' then (select hoy + 810 from ref) end
     where slug in ('cancion-criolla', 'halloween');
    alter table public.tematicas enable trigger tematicas_reglas;
  $$,
  'el bloque de las fixtures funciona aunque la «Apagada» de fábrica haya caducado');
select is(
  (select string_agg(concat_ws('|', slug, encendido, inicio - (select hoy from ref),
                               coalesce(encendido_hasta - (select hoy from ref), -1)), ',' order by slug)
     from public.tematicas where slug in ('cancion-criolla', 'halloween')),
  'cancion-criolla|apagada|800|810,halloween|fechas|800|-1',
  'y las deja lejos: la Canción Criolla apagada, Halloween según fechas');

-- ---------------------------------------------------------------------------
-- Solo una de las dos encendida
-- ---------------------------------------------------------------------------
-- Navidad y el Día de la Madre, lejos de todo lo que se mueve aquí.
update public.tematicas set inicio = (select hoy + 600 from ref), fin = (select hoy + 610 from ref)
 where slug = 'navidad';
update public.tematicas set inicio = (select hoy + 700 from ref), fin = (select hoy + 710 from ref),
       fecha_evento = null
 where slug = 'dia-de-la-madre';

-- Las dos alrededor de hoy: Halloween según fechas, la Canción Criolla apagada.
update public.tematicas set inicio = (select hoy - 1 from ref), fin = (select hoy + 5 from ref),
       fecha_evento = null
 where slug = 'halloween';
select lives_ok(
  $$ update public.tematicas set inicio = (select hoy - 1 from ref), fin = (select hoy + 5 from ref),
            fecha_evento = null
      where slug = 'cancion-criolla' $$,
  'la Canción Criolla apagada puede tener las mismas fechas que Halloween');
select is(
  (select concat_ws('|', encendido, encendido_hasta) from public.tematicas where slug = 'cancion-criolla'),
  concat_ws('|', 'apagada', (select hoy + 5 from ref)),
  'y al cambiarle las fechas sigue apagada, hasta su fin nuevo');
select is(app.tematica_activa_id(), (select halloween from ref), 'Halloween es la activa');

select throws_like(
  $$ update public.tematicas set encendido = 'fechas' where slug = 'cancion-criolla' $$,
  '%«Halloween»%deja una de las dos «Apagada»%',
  'las dos según fechas no: la frase dice qué hacer');
select throws_like(
  $$ update public.tematicas set encendido = 'encendida' where slug = 'cancion-criolla' $$,
  '%deja una de las dos «Apagada»%',
  'ni encender a mano una mientras la otra va según fechas');

update public.tematicas set encendido = 'apagada' where slug = 'halloween';
select lives_ok(
  $$ update public.tematicas set encendido = 'fechas' where slug = 'cancion-criolla' $$,
  'apagando antes Halloween, la Canción Criolla va según fechas');
select is(app.tematica_activa_id(), (select criolla from ref), 'y la activa es la Canción Criolla');
select throws_like(
  $$ update public.tematicas set encendido = 'encendida' where slug = 'halloween' $$,
  '%«Día de la Canción Criolla»%deja una de las dos «Apagada»%',
  'y Halloween ya no se puede encender a mano');

-- De vuelta a como venían: primero se apaga la que está encendida.
update public.tematicas set encendido = 'apagada' where slug = 'cancion-criolla';
update public.tematicas set encendido = 'fechas' where slug = 'halloween';
select is(app.tematica_activa_id(), (select halloween from ref), 'Halloween vuelve a ser la activa');

-- ---------------------------------------------------------------------------
-- La excepción es solo entre alternativas
-- ---------------------------------------------------------------------------
select throws_like(
  $$ update public.tematicas set inicio = (select hoy - 1 from ref), fin = (select hoy + 5 from ref)
      where slug = 'navidad' $$,
  '%Cambia las fechas de una de las dos%',
  'Navidad sobre Halloween choca, con la frase de siempre');
update public.tematicas set encendido = 'apagada' where slug = 'halloween';
select throws_like(
  $$ update public.tematicas set inicio = (select hoy - 1 from ref), fin = (select hoy + 5 from ref)
      where slug = 'navidad' $$,
  '%Cambia las fechas de una de las dos%',
  'aunque las dos alternativas estén apagadas: Navidad no es su alternativa');
select throws_like(
  $$ update public.tematicas set inicio = (select hoy - 1 from ref), fin = (select hoy + 5 from ref),
            encendido = 'apagada'
      where slug = 'dia-de-la-madre' $$,
  '%Cambia las fechas de una de las dos%',
  'y el Día de la Madre apagado tampoco puede cruzarse con ellas');
update public.tematicas set encendido = 'fechas' where slug = 'halloween';

-- Navidad apagada a la que le cambian las fechas sigue volviendo a según fechas.
update public.tematicas set encendido = 'apagada' where slug = 'navidad';
update public.tematicas set inicio = (select hoy + 601 from ref) where slug = 'navidad';
select is((select encendido from public.tematicas where slug = 'navidad'), 'fechas',
  'Navidad apagada vuelve a según fechas al cambiarle las fechas, como siempre');

-- Ni la Canción Criolla encendida a mano conserva lo manual al cambiar fechas.
update public.tematicas set encendido = 'apagada' where slug = 'halloween';
update public.tematicas set encendido = 'encendida' where slug = 'cancion-criolla';
update public.tematicas set fin = (select hoy + 6 from ref) where slug = 'cancion-criolla';
select is((select encendido from public.tematicas where slug = 'cancion-criolla'), 'fechas',
  'la alternativa encendida a mano vuelve a según fechas al cambiarle las fechas');
update public.tematicas set encendido = 'apagada', fin = (select hoy + 5 from ref)
 where slug = 'cancion-criolla';
update public.tematicas set encendido = 'fechas' where slug = 'halloween';
select is((select encendido from public.tematicas where slug = 'cancion-criolla'), 'apagada',
  'apagarla en el mismo cambio sí la deja apagada');

-- ---------------------------------------------------------------------------
-- Por el panel: cambiar las fechas de la apagada
-- ---------------------------------------------------------------------------
set local role authenticated;
set local request.jwt.claims = '{"sub": "55555555-5555-5555-5555-555555555555", "rol": "administrador"}';
select lives_ok(
  $$ select pg_temp.guardar('cancion-criolla', (select hoy from ref), (select hoy + 6 from ref), 'apagada') $$,
  'el panel guarda la Canción Criolla apagada con fechas que cruzan las de Halloween');
select is(
  (select concat_ws('|', encendido, encendido_hasta) from public.tematicas where slug = 'cancion-criolla'),
  concat_ws('|', 'apagada', (select hoy + 6 from ref)),
  'y sigue apagada, hasta su fin nuevo');
select lives_ok(
  $$ select pg_temp.guardar('cancion-criolla', (select hoy + 365 from ref), (select hoy + 372 from ref),
                            'apagada') $$,
  'con las fechas del año siguiente, que aún no cruzan nada');
select is((select encendido from public.tematicas where slug = 'cancion-criolla'), 'apagada',
  'también sigue apagada (no pasa sola a según fechas)');
select lives_ok(
  $$ select pg_temp.guardar('halloween', (select hoy + 365 from ref), (select hoy + 372 from ref), 'fechas') $$,
  'y después Halloween se guarda con esas mismas fechas, según fechas');
select throws_like(
  $$ select pg_temp.guardar('cancion-criolla', (select hoy + 365 from ref), (select hoy + 372 from ref),
                            'fechas') $$,
  '%deja una de las dos «Apagada»%',
  'el panel tampoco deja las dos según fechas');

-- ---------------------------------------------------------------------------
-- El año siguiente: las dos con fechas que ya pasaron
-- ---------------------------------------------------------------------------
reset role;
set local request.jwt.claims = '{}';
update public.tematicas set inicio = (select hoy - 20 from ref), fin = (select hoy - 10 from ref)
 where slug = 'halloween';
select lives_ok(
  $$ update public.tematicas set inicio = (select hoy - 20 from ref), fin = (select hoy - 10 from ref)
      where slug = 'cancion-criolla' $$,
  'dos campañas que ya terminaron no se cruzan');
select is(
  (select concat_ws('|', encendido, encendido_hasta < (select hoy from ref))
     from public.tematicas where slug = 'cancion-criolla'),
  'apagada|t',
  'la Canción Criolla quedó con una «Apagada» caducada, como el año siguiente');
select is((select encendido from public.tematicas where slug = 'halloween'), 'fechas',
  'y Halloween según fechas, ya pasadas');

set local role authenticated;
set local request.jwt.claims = '{"sub": "55555555-5555-5555-5555-555555555555", "rol": "administrador"}';
select lives_ok(
  $$ select pg_temp.guardar('cancion-criolla', (select hoy + 30 from ref), (select hoy + 37 from ref),
                            'apagada') $$,
  'el año siguiente, la que no se celebra se guarda con sus fechas nuevas y apagada');
select is(
  (select concat_ws('|', encendido, encendido_hasta) from public.tematicas where slug = 'cancion-criolla'),
  concat_ws('|', 'apagada', (select hoy + 37 from ref)),
  'y queda apagada hasta el fin de la campaña nueva');
select lives_ok(
  $$ select pg_temp.guardar('halloween', (select hoy + 30 from ref), (select hoy + 37 from ref), 'fechas') $$,
  'y la que se celebra, con las mismas fechas y según fechas');
select is((select encendido from public.tematicas where slug = 'halloween'), 'fechas', 'queda según fechas');

-- Al revés: la que se celebraba (Halloween) caducada y la otra según fechas
-- pasadas; el panel guarda primero la que no se celebra.
reset role;
set local request.jwt.claims = '{}';
update public.tematicas set encendido = 'apagada' where slug = 'cancion-criolla';
update public.tematicas set inicio = (select hoy - 20 from ref), fin = (select hoy - 10 from ref)
 where slug = 'cancion-criolla';
update public.tematicas set encendido = 'apagada' where slug = 'halloween';
update public.tematicas set inicio = (select hoy - 20 from ref), fin = (select hoy - 10 from ref)
 where slug = 'halloween';
select is(
  (select string_agg(encendido, '|' order by slug) from public.tematicas
    where slug in ('halloween', 'cancion-criolla')),
  'apagada|apagada', 'las dos con una «Apagada» caducada');
set local role authenticated;
set local request.jwt.claims = '{"sub": "55555555-5555-5555-5555-555555555555", "rol": "administrador"}';
select lives_ok(
  $$ select pg_temp.guardar('halloween', (select hoy + 30 from ref), (select hoy + 37 from ref), 'fechas') $$,
  'guardar una con fechas nuevas no choca con la otra, todavía en las pasadas');
select lives_ok(
  $$ select pg_temp.guardar('cancion-criolla', (select hoy + 30 from ref), (select hoy + 37 from ref),
                            'apagada') $$,
  'y la otra se guarda después, apagada, en las mismas fechas');
reset role;
select is(app.tematica_activa_id(), null::uuid, 'hoy no hay ninguna activa (la campaña es dentro de un mes)');

-- ---------------------------------------------------------------------------
-- Las restricciones, con su nombre
-- ---------------------------------------------------------------------------
select ok(
  pg_get_constraintdef((select oid from pg_constraint
                         where conrelid = 'public.tematicas'::regclass
                           and conname = 'tematicas_slug_conocido')) like '%cancion-criolla%',
  'la lista de temáticas conocidas tiene la Canción Criolla');
select ok(
  pg_get_constraintdef((select oid from pg_constraint
                         where conrelid = 'public.tematicas'::regclass
                           and conname = 'tematicas_estilo_de_su_tematica')) like '%calabaza-noche%',
  'y la de pares, los estilos de Halloween');

select * from finish();
rollback;
