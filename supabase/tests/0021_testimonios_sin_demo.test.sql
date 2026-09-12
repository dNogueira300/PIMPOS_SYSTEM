-- Verifica que los testimonios de ejemplo no llegan al sitio (0021).
--
-- Es el bloque que existe para dar confianza. Uno inventado con nombre de
-- persona es una resena falsa en cuanto alguien lo publica sin mirar, y la
-- semilla de demostracion carga tres.
begin;
select plan(5);

-- La semilla de demo carga tres testimonios publicados y marcados como ejemplo.
select ok(
  (select count(*) from public.testimonios where es_demo and estado = 'publicado') > 0,
  'la semilla de demostracion si tiene testimonios de ejemplo publicados'
);

select is(
  (select count(*)::int from public.testimonios_publicos where es_demo),
  0,
  'pero ninguno de ejemplo sale por la vista publica'
);

-- Uno real si tiene que salir: el filtro no puede vaciar el bloque entero.
insert into public.testimonios (id, nombre, texto, procedencia, orden, estado, es_demo) values
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'Vecina de Belén',
   'Compro aquí todas las mañanas.', 'Belén', 99, 'publicado', false);

select is(
  (select count(*)::int from public.testimonios_publicos
    where id = 'cccccccc-cccc-cccc-cccc-cccccccccccc'),
  1,
  'y un testimonio real si llega al sitio'
);

-- Un borrador tampoco, que es la otra regla de toda vista publica.
update public.testimonios set estado = 'borrador'
  where id = 'cccccccc-cccc-cccc-cccc-cccccccccccc';

select is(
  (select count(*)::int from public.testimonios_publicos
    where id = 'cccccccc-cccc-cccc-cccc-cccccccccccc'),
  0,
  'un testimonio en borrador sigue sin salir'
);

-- Al reemplazar una vista es facil perder la opcion que la hace respetar la RLS.
select ok(
  (select coalesce(reloptions::text, '') like '%security_invoker=true%'
     from pg_class where oid = 'public.testimonios_publicos'::regclass),
  'y la vista sigue con security_invoker'
);

select * from finish();
rollback;
