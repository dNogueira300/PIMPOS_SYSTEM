-- Verifica los datos del pedido (0017).
--
-- Dos cosas importan: que el sitio los lea sin sesión --si no, el detalle de
-- producto vuelve a mandar al cliente a ciegas-- y que un valor mal escrito
-- desde el panel no llegue a guardarse. Un "3 soles" donde va un número no
-- rompería solo esa línea: la configuración se valida entera, y el sitio se
-- quedaría sin teléfono, sin dirección y sin horario.
begin;
select plan(17);

-- =============================================================================
-- Carga inicial
-- =============================================================================
select bag_eq(
  $$ select clave from public.configuracion_sitio where grupo = 'pedidos' $$,
  $$ values ('delivery_zonas'), ('delivery_costo'), ('pedido_minimo'),
            ('delivery_tiempo'), ('formas_pago') $$,
  'el grupo pedidos trae justo las cinco claves que lee el sitio'
);

select is(
  (select count(*)::int from public.configuracion_sitio where grupo = 'pedidos' and not es_publico),
  0,
  'todas son publicas: son para el cliente, no para la casa'
);

select is(
  (select valor from public.configuracion_sitio where clave = 'delivery_zonas'),
  '["Iquitos", "Belén", "Punchana", "San Juan Bautista"]'::jsonb,
  'las zonas son las cuatro que el sitio ya anunciaba'
);

-- Lo inventado tiene que decirlo, para que nadie lo tome por dato del negocio.
select bag_eq(
  $$ select clave from public.configuracion_sitio
      where grupo = 'pedidos' and descripcion like '%PENDIENTE%' $$,
  $$ values ('delivery_costo'), ('pedido_minimo'), ('delivery_tiempo'), ('formas_pago') $$,
  'los valores provisionales van marcados como PENDIENTE, y las zonas no'
);

-- =============================================================================
-- Auditoria: la carga no cuenta como cambio, pero lo que venga despues si
-- =============================================================================
select is(
  (select count(*)::int from app.auditoria
    where tabla = 'public.configuracion_sitio'
      and operacion = 'INSERT'
      and datos_despues ->> 'clave' in ('delivery_zonas', 'delivery_costo', 'pedido_minimo',
                                        'delivery_tiempo', 'formas_pago')),
  0,
  'la carga inicial no llena la actividad reciente'
);

-- El riesgo de apagar un trigger es olvidarse de encenderlo.
select is(
  (select tgenabled::text from pg_trigger
    where tgrelid = 'public.configuracion_sitio'::regclass
      and tgname = 'auditar_configuracion_sitio'),
  'O',
  'y la auditoria queda encendida despues de la carga'
);

-- =============================================================================
-- Lectura anonima, por la vista que usa el sitio
-- =============================================================================
set local role anon;

select ok(
  (select valores ?& array['delivery_zonas', 'delivery_costo', 'pedido_minimo',
                           'delivery_tiempo', 'formas_pago']
     from public.configuracion_publica),
  'el visitante lee las cinco por configuracion_publica'
);

select is(
  (select jsonb_typeof(valores -> 'delivery_costo') from public.configuracion_publica),
  'number',
  'y el costo le llega como numero, no como texto'
);

reset role;

-- =============================================================================
-- La forma de cada valor
-- =============================================================================
select throws_ok(
  $$ update public.configuracion_sitio set valor = '"3 soles"' where clave = 'delivery_costo' $$,
  '23514', null,
  'el costo del delivery no acepta texto'
);

select throws_ok(
  $$ update public.configuracion_sitio set valor = '-1' where clave = 'delivery_costo' $$,
  '23514', null,
  'ni un costo negativo'
);

select throws_ok(
  $$ update public.configuracion_sitio set valor = '"diez"' where clave = 'pedido_minimo' $$,
  '23514', null,
  'el pedido minimo tampoco acepta texto'
);

select throws_ok(
  $$ update public.configuracion_sitio set valor = '45' where clave = 'delivery_tiempo' $$,
  '23514', null,
  'el tiempo va como frase ("30 a 45 minutos"), no como un numero suelto'
);

select throws_ok(
  $$ update public.configuracion_sitio set valor = '"Iquitos, Belén"' where clave = 'delivery_zonas' $$,
  '23514', null,
  'las zonas son una lista, no un texto separado por comas'
);

select throws_ok(
  $$ update public.configuracion_sitio set valor = '["Efectivo", 5]' where clave = 'formas_pago' $$,
  '23514', null,
  'y cada forma de pago es un texto'
);

select lives_ok(
  $$ update public.configuracion_sitio set valor = '0' where clave = 'delivery_costo' $$,
  'un delivery gratis, con costo 0, si es valido'
);

select ok(
  exists(select 1 from app.auditoria
          where tabla = 'public.configuracion_sitio'
            and operacion = 'UPDATE'
            and datos_despues ->> 'clave' = 'delivery_costo'),
  'y ese cambio de precio queda en la auditoria'
);

-- La restriccion mira la clave: el resto de la configuracion sigue igual.
select lives_ok(
  $$ update public.configuracion_sitio set valor = '"Pan caliente"' where clave = 'eslogan' $$,
  'las reglas de pedidos no tocan al resto de claves'
);

select * from finish();
rollback;
