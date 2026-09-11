-- =============================================================================
-- 0017_pedidos.sql
-- Lo que un cliente necesita saber ANTES de pedir por WhatsApp: a qué zonas se
-- reparte, cuánto cuesta el delivery, desde qué monto, cuánto tarda y cómo se
-- paga (crítica de diseño del 11/09/2026, P1 "el momento de pedir").
--
-- Sin estos datos, "Pedir por WhatsApp" era un salto a ciegas: el vecino no
-- sabía si le iban a cobrar el envío ni si su pedido llegaba al mínimo, así que
-- escribía para preguntar lo que la página podía haberle dicho, o no escribía.
--
-- Van en `configuracion_sitio` y no en el código por la misma razón que el
-- horario: los cambia el negocio. Y en un grupo propio, `pedidos`, porque en el
-- panel (F4) forman una pantalla con sentido para quien la edita.
--
-- VALORES PROVISIONALES. El costo, el mínimo, el tiempo y las formas de pago
-- son inventados, por decisión de Dan (11/09/2026), para que el sitio se
-- maquete con datos del largo real; el negocio los confirma desde el panel.
-- Cada uno lo dice en su descripción, que es lo que ve el administrador junto
-- al campo. Las zonas no son inventadas: son las cuatro que el sitio ya
-- anunciaba, escritas a mano en la portada, el detalle de producto y contacto.
--
-- Para listar todo lo que sigue pendiente de confirmar (incluye el teléfono):
--   select clave, valor from public.configuracion_sitio where descripcion like '%PENDIENTE%';
-- =============================================================================

alter table public.configuracion_sitio
  drop constraint configuracion_sitio_grupo_check;

alter table public.configuracion_sitio
  add constraint configuracion_sitio_grupo_check
  check (grupo in ('marca', 'contacto', 'ubicacion', 'horarios', 'redes', 'textos', 'pedidos'));

-- =============================================================================
-- La forma de cada valor, comprobada en la base.
--
-- El sitio ya valida con Zod al leer, pero valida la configuración ENTERA: si
-- alguien escribe "3 soles" donde va un número, no se pierde solo el costo del
-- delivery, sino que el objeto completo cae a los valores de reserva y el sitio
-- se queda sin teléfono, sin dirección y sin horario. Un error así tiene que
-- rebotar al guardarlo, que es cuando quien lo escribió puede corregirlo.
--
-- `case` anidado y no `and`: Postgres no promete el orden en que evalúa un
-- `and`, y convertir a numeric un texto que no lo es lanzaría un error de
-- conversión en lugar del de la restricción, que es el que el panel sabe leer.
-- =============================================================================
alter table public.configuracion_sitio
  add constraint configuracion_sitio_valores_de_pedido_check check (
    case clave
      when 'delivery_costo' then
        case when jsonb_typeof(valor) = 'number' then (valor #>> '{}')::numeric >= 0 else false end
      when 'pedido_minimo' then
        case when jsonb_typeof(valor) = 'number' then (valor #>> '{}')::numeric >= 0 else false end
      when 'delivery_tiempo' then
        jsonb_typeof(valor) = 'string'
      when 'delivery_zonas' then
        jsonb_typeof(valor) = 'array'
        and not jsonb_path_exists(valor, '$[*] ? (@.type() != "string")')
      when 'formas_pago' then
        jsonb_typeof(valor) = 'array'
        and not jsonb_path_exists(valor, '$[*] ? (@.type() != "string")')
      else true
    end
  );

-- =============================================================================
-- Valores iniciales.
--
-- Sin auditar, por la misma razón que en 0008: es el estado de partida, no un
-- cambio que alguien hizo. Si el `insert` fallara, la migración entera se
-- deshace y el trigger no se queda apagado: cada archivo corre en su propia
-- transacción.
-- =============================================================================
alter table public.configuracion_sitio disable trigger auditar_configuracion_sitio;

insert into public.configuracion_sitio (clave, valor, descripcion, grupo, es_publico, orden) values
  ('delivery_zonas', '["Iquitos", "Belén", "Punchana", "San Juan Bautista"]'::jsonb,
   'Distritos a los que llega el delivery, uno por línea.', 'pedidos', true, 1),
  ('delivery_costo', '3.00'::jsonb,
   'Cuánto se cobra por el delivery, en soles. Pon 0 si es gratis. PENDIENTE de confirmar con el negocio: el valor actual es provisional.',
   'pedidos', true, 2),
  ('pedido_minimo', '10.00'::jsonb,
   'Monto mínimo de un pedido con delivery, en soles. Pon 0 si no hay mínimo. PENDIENTE de confirmar con el negocio: el valor actual es provisional.',
   'pedidos', true, 3),
  ('delivery_tiempo', '"30 a 45 minutos"'::jsonb,
   'Cuánto tarda en llegar un pedido, dicho como se le diría al cliente. PENDIENTE de confirmar con el negocio: el valor actual es provisional.',
   'pedidos', true, 4),
  ('formas_pago', '["Efectivo", "Yape", "Plin"]'::jsonb,
   'Con qué puede pagar el cliente, una forma por línea. PENDIENTE de confirmar con el negocio: el valor actual es provisional.',
   'pedidos', true, 5)
on conflict (clave) do nothing;

alter table public.configuracion_sitio enable trigger auditar_configuracion_sitio;
