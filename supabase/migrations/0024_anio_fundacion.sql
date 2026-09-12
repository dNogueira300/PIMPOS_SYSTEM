-- El año en que abrió la panadería, para dejar de escribir "22 años" a mano.
--
-- La portada decía "Desde 2004", "22 años en el mismo barrio" y "Veintidós años
-- en el barrio", y la página de nosotros repetía "22 años" en su descripción
-- para buscadores. Los cuatro son textos fijos: el 1 de enero de 2027 los cuatro
-- pasan a mentir a la vez, sin que nada falle ni avise. Es justo lo que el
-- proyecto no hace con ningún otro dato del negocio.
--
-- El año de apertura sí es un dato fijo —2004 no cambia—; lo que cambia es la
-- CUENTA de años, y esa se calcula. Va en `configuracion_sitio` y no en una
-- constante del código por la misma razón que el teléfono o el horario: es un
-- dato del negocio, y si algún día resulta que la fecha real es otra, se corrige
-- desde el panel y no con un despliegue.

-- Sin auditar, como el resto de cargas iniciales (0019, 0023): esto no es un
-- cambio que hiciera una persona, es el estado de partida. Auditarlo mete en la
-- actividad reciente una fila sin autor —y deja la auditoría de
-- `configuracion_sitio` empezando por un cambio anónimo, que es justo lo que la
-- prueba de 0007 comprueba que no pase.
alter table public.configuracion_sitio disable trigger auditar_configuracion_sitio;

insert into public.configuracion_sitio (clave, valor, descripcion, grupo, es_publico, orden)
values (
  'anio_fundacion',
  '2004'::jsonb,
  'Año en que abrió la panadería. El sitio calcula solo cuántos años lleva: no escribas la cantidad en ningún texto.',
  'marca',
  true,
  8
)
on conflict (clave) do nothing;

alter table public.configuracion_sitio enable trigger auditar_configuracion_sitio;

-- Que sea un año con sentido, no un texto ni un número cualquiera. La misma
-- defensa que 0017 le puso a las condiciones del delivery: un valor con la forma
-- equivocada tiene que fallar al guardarlo, que es cuando quien lo escribió
-- puede corregirlo, y no en la página. Sin ella, un '"2004"' entre comillas deja
-- la validación de Zod al descubierto y el sitio entero cae a los valores de
-- reserva, que es como se pierden el teléfono y el horario de golpe.
--
-- El límite superior es un año fijo y no `now()`: una restricción CHECK solo
-- admite funciones inmutables, y `now()` no lo es. El rango ancho ya cumple su
-- papel, que es cazar un valor con la forma equivocada, no auditar la fecha.
alter table public.configuracion_sitio
  add constraint configuracion_anio_fundacion_valido
  check (
    clave <> 'anio_fundacion'
    or (jsonb_typeof(valor) = 'number' and (valor)::int between 1900 and 2100)
  );
