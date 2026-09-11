-- =============================================================================
-- 0018_faq_horario.sql
-- La pregunta del horario daba las horas en formato de 24 h ("de 4:00 a 13:00 y
-- de 16:00 a 21:00"), y el resto del sitio las da como se dicen: "4:00 a. m. a
-- 1:00 p. m.". Dos formatos para el mismo dato en la misma pagina hacen dudar
-- de cual es el bueno (critica de diseno del 11/09/2026, P2).
--
-- Solo se corrige si el texto sigue siendo el que cargo 0010: si el negocio ya
-- reescribio la respuesta desde el panel, manda lo suyo.
--
-- Sin auditar, como las cargas de 0008 y 0017: es una correccion del texto de
-- partida, no un cambio que alguien hizo. Si el `update` fallara, la migracion
-- entera se deshace y el trigger no se queda apagado.
--
-- Ojo: esta respuesta es texto libre y repite las horas de `horario_semanal`.
-- Si el negocio cambia el horario, tiene que cambiar tambien esta respuesta.
-- =============================================================================
alter table public.faqs disable trigger auditar_faqs;

update public.faqs
   set respuesta = 'Abrimos de lunes a sábado en dos turnos: de 4:00 a. m. a 1:00 p. m. y de 4:00 p. m. a 9:00 p. m. Domingos y feriados no hay atención.'
 where pregunta = '¿Cuáles son los horarios de atención?'
   and respuesta = 'Abrimos de lunes a sábado en dos turnos: de 4:00 a 13:00 y de 16:00 a 21:00. Domingos y feriados no hay atención.';

alter table public.faqs enable trigger auditar_faqs;
