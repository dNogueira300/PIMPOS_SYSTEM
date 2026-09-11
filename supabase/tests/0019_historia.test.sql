-- Verifica la historia reescrita (0019).
--
-- El primer párrafo sale en la portada bajo "Veintidós años en el barrio" y la
-- historia entera en Nosotros: es de lo primero que se lee del negocio.
begin;
select plan(5);

select ok(
  (select valor #>> '{}' not like 'Bienvenidos%' from public.configuracion_sitio where clave = 'historia'),
  'la historia ya no empieza por «Bienvenidos», el ejemplo de lo que no suena a Pimpo''s'
);

select ok(
  (select valor #>> '{}' not like '%profundamente arraigado%' from public.configuracion_sitio where clave = 'historia'),
  'ni conserva el «profundamente arraigado»'
);

-- La portada corta por el primer párrafo: sin el salto doble, enseñaría la
-- historia entera.
select ok(
  (select strpos(valor #>> '{}', E'\n\n') > 0 from public.configuracion_sitio where clave = 'historia'),
  'sigue en dos párrafos, que es por donde la corta la portada'
);

select ok(
  (select split_part(valor #>> '{}', E'\n\n', 1) like '%pan fresco%'
     from public.configuracion_sitio where clave = 'historia'),
  'y el primer párrafo, el de la portada, dice lo esencial: pan fresco del día'
);

select is(
  (select tgenabled::text from pg_trigger
    where tgrelid = 'public.configuracion_sitio'::regclass
      and tgname = 'auditar_configuracion_sitio'),
  'O',
  'la auditoría de la configuración queda encendida'
);

select * from finish();
rollback;
