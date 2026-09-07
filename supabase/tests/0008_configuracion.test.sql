-- Verifica la configuracion del sitio (0008).
--
-- Lo que importa aqui es que el sitio publico pueda leer lo suyo sin sesion
-- --si no, la portada no sabria ni como se llama el negocio-- y que nada
-- privado se escape por esa misma puerta.
begin;
select plan(19);

insert into auth.users (id, email, created_at, updated_at) values
  ('11111111-1111-1111-1111-111111111111', 'super@pimpos.test', now(), now()),
  ('33333333-3333-3333-3333-333333333333', 'inge@pimpos.test',  now(), now());

update public.perfiles set rol = 'superadmin', activo = true where id = '11111111-1111-1111-1111-111111111111';
update public.perfiles set rol = 'ingeniero',  activo = true where id = '33333333-3333-3333-3333-333333333333';

-- =============================================================================
-- Estructura y carga inicial
-- =============================================================================
select has_table('public', 'configuracion_sitio', 'existe configuracion_sitio');
select ok(
  (select relrowsecurity from pg_class where oid = 'public.configuracion_sitio'::regclass),
  'tiene RLS activada'
);

-- Va en una migracion, no en una semilla: `db push` no aplica semillas y sin
-- estas filas el sitio no arranca en produccion (misma leccion que 0004).
select ok(
  (select count(*) from public.configuracion_sitio) >= 20,
  'la migracion deja la configuracion cargada, sin depender de las semillas'
);

-- Las claves que el sitio publico da por hechas.
select bag_has(
  $$ select clave from public.configuracion_sitio $$,
  $$ values ('nombre_comercial'), ('eslogan'), ('logo_url'), ('favicon_url'),
            ('whatsapp'), ('direccion'), ('coordenadas'), ('horario_semanal'),
            ('historia'), ('mision'), ('vision'), ('valores') $$,
  'estan todas las claves que el sitio publico necesita'
);

-- =============================================================================
-- Los valores de la ficha llegaron intactos
-- =============================================================================
select is(
  (select valor #>> '{}' from public.configuracion_sitio where clave = 'eslogan'),
  'Pan fresco, tradición de siempre',
  'el eslogan es el de la ficha 2.4, literal'
);
select is(
  (select (valor -> 'lat')::text from public.configuracion_sitio where clave = 'coordenadas'),
  '-3.759545048266943',
  'las coordenadas son las entregadas el 05/09'
);
select is(
  (select jsonb_array_length(valor) from public.configuracion_sitio where clave = 'valores'),
  4,
  'los 4 valores institucionales de la ficha 2.3'
);

-- Domingo cerrado no es un olvido: la ficha 1.9 lo dice y el sitio tiene que
-- mostrarlo explicitamente (doc 03 §7).
select is(
  (select jsonb_array_length(valor -> 'domingo') from public.configuracion_sitio where clave = 'horario_semanal'),
  0,
  'el domingo no tiene turnos: cerrado'
);
select is(
  (select jsonb_array_length(valor -> 'lunes') from public.configuracion_sitio where clave = 'horario_semanal'),
  2,
  'los dias laborables tienen dos turnos'
);

-- =============================================================================
-- Toda clave se explica sola
--
-- El panel lo usa gente con nivel de computadora basico (R18): un campo
-- llamado `coordenadas` sin explicacion al lado no se puede rellenar.
-- =============================================================================
select is(
  (select count(*)::int from public.configuracion_sitio
    where btrim(descripcion) = '' or descripcion is null),
  0,
  'ninguna clave se queda sin descripcion para el administrador'
);

-- =============================================================================
-- Lectura anonima: solo lo publico
-- =============================================================================
set local role anon;

select ok(
  (select count(*) from public.configuracion_sitio) > 0,
  'el visitante anonimo lee la configuracion publica'
);
select is(
  (select count(*)::int from public.configuracion_sitio where not es_publico),
  0,
  'pero NO ve ninguna clave privada'
);
select is(
  (select count(*)::int from public.configuracion_sitio where clave = 'correo_alertas'),
  0,
  'el correo de alertas internas no se filtra al sitio publico'
);
select is(
  (select valor #>> '{}' from public.configuracion_sitio where clave = 'nombre_comercial'),
  'Panadería Pimpo''s',
  'y si lee el nombre del negocio, que es lo que necesita la portada'
);

-- Nadie escribe sin sesion. No lanza error: sin politica de UPDATE para `anon`,
-- la RLS simplemente no le deja ver ninguna fila que modificar, y la operacion
-- afecta a cero. Es el comportamiento correcto.
update public.configuracion_sitio set valor = '"pirata"' where clave = 'whatsapp';
select is(
  (select valor #>> '{}' from public.configuracion_sitio where clave = 'whatsapp'),
  '51947874820',
  'un anonimo no puede cambiar el numero de WhatsApp'
);

reset role;

-- =============================================================================
-- Escritura: solo administracion
-- =============================================================================
set local role authenticated;

set local request.jwt.claims = '{"sub": "33333333-3333-3333-3333-333333333333", "rol": "ingeniero"}';
select ok(
  (select count(*) from public.configuracion_sitio) >= 20,
  'un ingeniero lee toda la configuracion, incluida la privada'
);

update public.configuracion_sitio set valor = '"999999999"' where clave = 'whatsapp';
select is(
  (select valor #>> '{}' from public.configuracion_sitio where clave = 'whatsapp'),
  '51947874820',
  'pero un ingeniero NO puede cambiarla'
);

set local request.jwt.claims = '{"sub": "11111111-1111-1111-1111-111111111111", "rol": "superadmin"}';
select lives_ok(
  $$ update public.configuracion_sitio set valor = '"51900000000"' where clave = 'whatsapp' $$,
  'el superadmin si puede'
);

-- Las claves no se inventan desde el panel: el juego lo fija una migracion.
select throws_ok(
  $$ insert into public.configuracion_sitio (clave, valor, descripcion, grupo)
     values ('clave_inventada', '"x"'::jsonb, 'x', 'marca') $$,
  '42501',
  null,
  'ni el superadmin puede inventarse una clave nueva'
);

reset role;

select * from finish();
rollback;
