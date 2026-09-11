-- Verifica la correccion del horario en las preguntas frecuentes (0018).
--
-- El mismo dato en dos formatos en la misma pagina hace dudar de cual es el
-- bueno. Y la respuesta sale tambien en los datos estructurados de la pagina:
-- lo que diga aqui es lo que Google puede ensenar en el resultado.
begin;
select plan(4);

select is(
  (select count(*)::int from public.faqs where pregunta = '¿Cuáles son los horarios de atención?'),
  1,
  'la pregunta del horario sigue ahi, una sola vez'
);

select ok(
  (select respuesta not like '%13:00%' and respuesta not like '%21:00%'
     from public.faqs where pregunta = '¿Cuáles son los horarios de atención?'),
  'ya no da las horas en formato de 24 h'
);

select ok(
  (select respuesta like '%4:00 a. m. a 1:00 p. m.%' and respuesta like '%4:00 p. m. a 9:00 p. m.%'
     from public.faqs where pregunta = '¿Cuáles son los horarios de atención?'),
  'da los dos turnos como los da el resto del sitio'
);

-- El riesgo de apagar un trigger es olvidarse de encenderlo.
select is(
  (select tgenabled::text from pg_trigger
    where tgrelid = 'public.faqs'::regclass and tgname = 'auditar_faqs'),
  'O',
  'y la auditoria de las preguntas queda encendida'
);

select * from finish();
rollback;
