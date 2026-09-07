-- Verifica el contenido (0010).
--
-- Cubre dos de las nueve pruebas obligatorias del doc 02 §11.3, y son las dos
-- caras de la misma regla (R10): un ingeniero NO puede publicar una novedad de
-- tipo promocion, y un administrador SI.
--
-- Lo que se prueba aqui no es la interfaz: el panel puede esconder el boton,
-- pero una peticion directa a la API se lo salta. Lo que impide publicar es
-- Postgres.
begin;
select plan(31);

-- =============================================================================
-- Fixtures
-- =============================================================================
insert into auth.users (id, email, created_at, updated_at) values
  ('11111111-1111-1111-1111-111111111111', 'super@pimpos.test',   now(), now()),
  ('22222222-2222-2222-2222-222222222222', 'admin@pimpos.test',   now(), now()),
  ('33333333-3333-3333-3333-333333333333', 'inge@pimpos.test',    now(), now()),
  ('44444444-4444-4444-4444-444444444444', 'reparto@pimpos.test', now(), now());

update public.perfiles set rol = 'superadmin',    activo = true where id = '11111111-1111-1111-1111-111111111111';
update public.perfiles set rol = 'administrador', activo = true where id = '22222222-2222-2222-2222-222222222222';
update public.perfiles set rol = 'ingeniero',     activo = true where id = '33333333-3333-3333-3333-333333333333';
update public.perfiles set rol = 'repartidor',    activo = true where id = '44444444-4444-4444-4444-444444444444';

-- =============================================================================
-- Estructura
-- =============================================================================
select has_table('public', 'novedades',   'existe novedades');
select has_table('public', 'slides',      'existe slides');
select has_table('public', 'guias',       'existe guias');
select has_table('public', 'galeria',     'existe galeria');
select has_table('public', 'faqs',        'existe faqs');
select has_table('public', 'testimonios', 'existe testimonios');

select is(
  (select count(*)::int from public.faqs), 5,
  'la migracion deja las 5 preguntas de la ficha 5.9'
);
select is(
  (select count(*)::int from public.guias), 2,
  'y las 2 guias de la ficha 6.4'
);

-- Un slide con boton pero sin destino no lleva a ninguna parte.
select throws_ok(
  $$ insert into public.slides (titulo, imagen_url, texto_boton)
     values ('Sin destino', '/x.webp', 'Ver más') $$,
  '23514',
  null,
  'un slide no puede tener boton sin enlace'
);

-- Una vigencia que termina antes de empezar no tiene sentido.
select throws_ok(
  $$ insert into public.novedades (tipo, titulo, slug, contenido, vigencia_inicio, vigencia_fin)
     values ('aviso', 'Al revés', 'al-reves', 'x', now(), now() - interval '1 day') $$,
  '23514',
  null,
  'la vigencia no puede terminar antes de empezar'
);

-- =============================================================================
-- R10 -- la aprobacion de promociones, impuesta por la base
-- =============================================================================
set local role authenticated;
set local request.jwt.claims = '{"sub": "33333333-3333-3333-3333-333333333333", "rol": "ingeniero"}';

-- Un ingeniero SI crea promociones: lo que no puede es publicarlas.
select lives_ok(
  $$ insert into public.novedades (id, tipo, titulo, slug, contenido, estado)
     values ('cccc0000-0000-0000-0000-000000000001', 'promocion',
             'Dos por uno en pan francés', 'dos-por-uno', 'Todo el mes.', 'borrador') $$,
  'un ingeniero puede crear una promocion en borrador'
);

select lives_ok(
  $$ update public.novedades set estado = 'en_revision'
      where id = 'cccc0000-0000-0000-0000-000000000001' $$,
  'y enviarla a revision'
);

-- Y aqui la regla. Es la prueba obligatoria del doc 02 §11.3.
select throws_ok(
  $$ update public.novedades set estado = 'publicado'
      where id = 'cccc0000-0000-0000-0000-000000000001' $$,
  '23514',
  'Las promociones requieren aprobacion de un administrador',
  'un ingeniero NO puede publicar una promocion'
);

-- Tampoco creandola ya publicada de un golpe, que seria la forma obvia de
-- rodear la comprobacion.
select throws_ok(
  $$ insert into public.novedades (tipo, titulo, slug, contenido, estado)
     values ('promocion', 'Atajo', 'atajo', 'x', 'publicado') $$,
  '23514',
  'Las promociones requieren aprobacion de un administrador',
  'ni crearla directamente como publicada'
);

-- El resto de tipos se publica sin aprobacion (ficha 6.5).
select lives_ok(
  $$ insert into public.novedades (id, tipo, titulo, slug, contenido, estado)
     values ('cccc0000-0000-0000-0000-000000000002', 'nuevo_producto',
             'Llegó el panetón', 'llego-el-paneton', 'Ya disponible.', 'publicado') $$,
  'pero si puede publicar un aviso de nuevo producto'
);
select is(
  (select aprobada_por from public.novedades where id = 'cccc0000-0000-0000-0000-000000000002'),
  null,
  'y esa no queda marcada como aprobada, porque no lo necesita'
);

-- --- El administrador si la publica ------------------------------------------
set local request.jwt.claims = '{"sub": "22222222-2222-2222-2222-222222222222", "rol": "administrador"}';

select lives_ok(
  $$ update public.novedades set estado = 'publicado'
      where id = 'cccc0000-0000-0000-0000-000000000001' $$,
  'un administrador SI puede publicar una promocion'
);
select is(
  (select aprobada_por from public.novedades where id = 'cccc0000-0000-0000-0000-000000000001'),
  '22222222-2222-2222-2222-222222222222'::uuid,
  'y queda registrado quien la aprobo, sin que la aplicacion lo escriba'
);
select ok(
  (select aprobada_en from public.novedades
    where id = 'cccc0000-0000-0000-0000-000000000001') is not null,
  'y cuando'
);

-- Una vez aprobada, el ingeniero puede seguir editando el texto sin que se le
-- exija aprobar de nuevo: corregir una errata no es volver a publicar.
set local request.jwt.claims = '{"sub": "33333333-3333-3333-3333-333333333333", "rol": "ingeniero"}';
select lives_ok(
  $$ update public.novedades set contenido = 'Todo el mes de setiembre.'
      where id = 'cccc0000-0000-0000-0000-000000000001' $$,
  'un ingeniero puede corregir una promocion ya publicada'
);

-- El superadmin tambien aprueba (doc de stack §7).
set local request.jwt.claims = '{"sub": "11111111-1111-1111-1111-111111111111", "rol": "superadmin"}';
select lives_ok(
  $$ insert into public.novedades (tipo, titulo, slug, contenido, estado)
     values ('promocion', 'Descuento de aniversario', 'aniversario', 'x', 'publicado') $$,
  'el superadmin tambien puede publicar promociones'
);

reset role;

-- =============================================================================
-- Vigencias (R7): el publico no ve lo caducado ni lo que aun no empieza
-- =============================================================================
insert into public.novedades (id, tipo, titulo, slug, contenido, estado, vigencia_inicio, vigencia_fin) values
  ('dddd0000-0000-0000-0000-000000000001', 'campania', 'Vigente ahora', 'vigente-ahora', 'x',
   'publicado', now() - interval '1 day', now() + interval '1 day'),
  ('dddd0000-0000-0000-0000-000000000002', 'campania', 'Ya caducada', 'ya-caducada', 'x',
   'publicado', now() - interval '10 day', now() - interval '1 day'),
  ('dddd0000-0000-0000-0000-000000000003', 'campania', 'Aun no empieza', 'aun-no-empieza', 'x',
   'publicado', now() + interval '1 day', now() + interval '10 day');

create temp table fixture (id uuid primary key);
insert into fixture values
  ('dddd0000-0000-0000-0000-000000000001'),
  ('dddd0000-0000-0000-0000-000000000002'),
  ('dddd0000-0000-0000-0000-000000000003');
grant select on fixture to anon, authenticated;

set local role anon;

select is(
  (select count(*)::int from public.novedades where id in (select id from fixture)), 1,
  'de las tres, el publico solo ve la vigente'
);
select is(
  (select titulo from public.novedades where id in (select id from fixture)), 'Vigente ahora',
  'y es la que corresponde'
);

-- Esto es la doble red del doc 02 §11.2: aunque el cron que archiva las
-- caducadas no corriera -- y no corre si el proyecto se pausa --, la RLS ya
-- filtra por vigencia.
select is(
  (select count(*)::int from public.novedades
    where id = 'dddd0000-0000-0000-0000-000000000002'),
  0,
  'una promocion caducada no se ve aunque siga en estado publicado'
);

select is(
  (select count(*)::int from public.novedades
    where id = 'cccc0000-0000-0000-0000-000000000001'),
  1,
  'la promocion aprobada si es publica'
);

-- El borrador nunca.
select is(
  (select count(*)::int from public.novedades where estado = 'borrador'), 0,
  'un anonimo no ve borradores'
);

-- Contenido publicado por la migracion.
select is(
  (select count(*)::int from public.faqs), 5,
  'las preguntas frecuentes son publicas: la seccion existe desde el primer despliegue'
);
select is(
  (select count(*)::int from public.guias), 2,
  'y las guias tambien'
);

reset role;

-- =============================================================================
-- El repartidor no toca el contenido
-- =============================================================================
set local role authenticated;
set local request.jwt.claims = '{"sub": "44444444-4444-4444-4444-444444444444", "rol": "repartidor"}';

select throws_ok(
  $$ insert into public.novedades (tipo, titulo, slug, contenido)
     values ('aviso', 'Colado', 'colado', 'x') $$,
  '42501',
  null,
  'un repartidor no puede crear novedades'
);

update public.faqs set respuesta = 'Alterada' where orden = 1;
select is(
  (select count(*)::int from public.faqs where respuesta = 'Alterada'), 0,
  'ni modificar las preguntas frecuentes'
);

reset role;

-- =============================================================================
-- Todo cambio queda auditado (R9)
-- =============================================================================
select ok(
  (select count(*) from app.auditoria where tabla = 'public.novedades') > 0,
  'los cambios en novedades quedan en la auditoria'
);

select * from finish();
rollback;
