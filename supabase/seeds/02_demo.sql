-- =============================================================================
-- 02_demo.sql -- datos de ejemplo, desechables (es_demo = true)
--
-- Plan: doc 02 §14.
--
-- Todo lo que se inserta aqui lleva `es_demo = true`, de modo que
--   delete from <tabla> where es_demo;
-- limpia el contenido de relleno cuando llegue el material real del negocio.
-- Sin esa bandera, los datos falsos se quedan mezclados para siempre.
--
-- Este archivo NO llega a produccion: `supabase db push` no aplica semillas, y
-- la de datos reales se carga aparte con `--include-seed`. Es contenido para
-- que la Fase 3 tenga con que maquetar sin inventarse nada en el codigo.
-- =============================================================================

-- Idempotente: se borra lo que carga este mismo archivo, ni una fila mas.
delete from public.slides       where es_demo;
delete from public.testimonios  where es_demo;
delete from public.clientes     where es_demo;

-- =============================================================================
-- Carrusel de portada (R2)
--
-- Las imagenes son las fotos reales del local, ya subidas al bucket `slides`
-- por supabase/seeds/imagenes/subir-imagenes.sh. Los textos si son de relleno:
-- los escribe el negocio desde el panel en la Fase 4.
--
-- El delivery va de titular y no de nota al pie, y el precio se dice con
-- orgullo (doc 03): son los dos argumentos de venta del negocio.
-- =============================================================================
-- `enfoque` (0020): la fachada se encuadra al 30 % para que se vea el rótulo
-- «PANADERÍA PIMPO'S», que en el recorte panorámico de escritorio quedaba
-- fuera; las otras dos, centradas, que es como mejor salen (comprobado con
-- capturas a 1280 px).
insert into public.slides
  (titulo, subtitulo, imagen_url, imagen_alt, enlace_url, texto_boton, orden, estado, es_demo, enfoque) values
  ('Pan fresco todos los días',
   'Horneado desde las 4 de la mañana en Iquitos, desde S/ 0.10',
   'fachada1.webp', 'Fachada de Panadería Pimpo''s', '/productos', 'Ver el catálogo',
   1, 'publicado', true, 30),

  -- El slide que invita a pedir lleva directo a WhatsApp. Antes llevaba a
  -- /contacto, donde esperaba otro boton: un paso de mas justo en el momento
  -- de pedir. El numero y el mensaje van escritos porque es un dato de ejemplo
  -- (`es_demo`, nunca llega a produccion); los slides reales los carga el
  -- negocio desde el panel con el enlace que quiera.
  ('Llevamos tu pedido a tu casa',
   'Delivery propio en Iquitos, Belén, Punchana y San Juan Bautista',
   'atencion1.webp', 'Atención a un cliente en el mostrador',
   'https://wa.me/51947874820?text=Hola%2C%20quisiera%20hacer%20un%20pedido.%0APedido%3A%20%0ADirecci%C3%B3n%20de%20entrega%3A%20',
   'Pedir por WhatsApp',
   2, 'publicado', true, 50),

  ('22 años horneando en el mismo barrio',
   'Del horno al mostrador, todos los días',
   'horno1.webp', 'Horno de la panadería durante la producción', '/nosotros', 'Conocer la panadería',
   3, 'publicado', true, 50);

-- =============================================================================
-- Testimonios
--
-- Son de relleno y se nota a proposito: van firmados como "Cliente de ejemplo".
-- Un testimonio inventado con nombre de persona es una resena falsa en cuanto
-- alguien lo publica sin mirar, y estos existen solo para que la maqueta tenga
-- bloques del largo correcto. Los reales se recogen con permiso del cliente.
-- =============================================================================
insert into public.testimonios (nombre, texto, procedencia, orden, estado, es_demo) values
  ('Cliente de ejemplo 1',
   'Texto de ejemplo para maquetar el bloque de testimonios. Se reemplaza por uno real, recogido con el permiso de quien lo dice.',
   'Iquitos', 1, 'publicado', true),
  ('Cliente de ejemplo 2',
   'Texto de ejemplo, un poco más largo que el anterior, para comprobar cómo se comporta la tarjeta cuando el testimonio ocupa tres o cuatro líneas en un teléfono de 375 px.',
   'Belén', 2, 'publicado', true),
  ('Cliente de ejemplo 3',
   'Texto de ejemplo corto.',
   'Punchana', 3, 'publicado', true);

-- =============================================================================
-- Clientes de ejemplo (R14, R19; Ley N.o 29733)
--
-- Datos inventados de principio a fin, y que se note: los nombres son
-- "Clienta de ejemplo" y los celulares 900000001-3, que no son de nadie. En una
-- tabla que en produccion guardara nombres, celulares y direcciones reales de
-- vecinos del barrio, un dato de relleno que parezca autentico es el que acaba
-- colandose en una captura de pantalla o en un reporte.
-- =============================================================================
insert into public.clientes
  (id, nombre_completo, celular, direccion, referencia, zona_id, observacion, es_demo)
select v.id::uuid, v.nombre, v.celular, v.direccion, v.referencia,
       (select id from public.zonas_reparto where nombre = v.zona),
       'Cliente de ejemplo. Se borra con: delete from clientes where es_demo;',
       true
from (values
  ('a0000000-0000-4000-8000-000000000001', 'Clienta de ejemplo 1', '900000001',
   'Calle de ejemplo 100', 'Casa de dos pisos, portón azul', 'Iquitos'),
  ('a0000000-0000-4000-8000-000000000002', 'Cliente de ejemplo 2', '900000002',
   'Jirón de ejemplo 250', 'Al lado de la bodega', 'Belén'),
  ('a0000000-0000-4000-8000-000000000003', 'Clienta de ejemplo 3', '900000003',
   'Avenida de ejemplo 33', 'Frente al parque', 'Punchana')
) as v(id, nombre, celular, direccion, referencia, zona);

-- El consentimiento necesita quien lo registro, y en una base recien
-- reconstruida todavia no hay ningun usuario. Si no lo hay, esta insercion no
-- crea nada y los tres clientes quedan sin consentimiento -- que es justo el
-- caso que el panel tiene que saber ensenar: `clientes_con_consentimiento`
-- devuelve `tiene_consentimiento = false` y ahi se ve el aviso.
insert into public.consentimientos (cliente_id, modo, registrado_por, texto_version, observacion)
select c.id, 'verbal', u.id, 'v1-ejemplo',
       'Consentimiento de ejemplo, cargado por la semilla de demostración.'
from public.clientes c
cross join lateral (select id from auth.users order by created_at limit 1) u
where c.es_demo
  and c.id = 'a0000000-0000-4000-8000-000000000001';
