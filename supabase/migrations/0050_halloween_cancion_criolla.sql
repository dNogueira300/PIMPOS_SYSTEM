-- =============================================================================
-- 0050 · Halloween y el Día de la Canción Criolla, alternativas para el 31 de
--        octubre (plan 08.2)
--
-- Diseño acordado con Dan el 20/11/2026. En Perú el 31 de octubre es Halloween y
-- también el Día de la Canción Criolla, y el negocio elige cuál celebra: son dos
-- temáticas para las mismas fechas, y solo una puede estar encendida.
--
--   · halloween: calabaza-noche («Noche de calabazas», el puesto) y
--     calabaza-crema («Calabaza sobre crema»).
--   · cancion-criolla: rojo-blanco («Rojo y blanco», el puesto) y balcon
--     («Balcón limeño»).
--
-- Hasta ahora dos temáticas no podían cruzar sus fechas aunque una estuviera
-- apagada (0047). Entre estas dos, que son alternativas, el cruce se perdona si
-- una de las dos está «Apagada», y la «Apagada» sigue apagada aunque le cambien
-- las fechas: si no, al poner las fechas del año siguiente a la que no se
-- celebra, la base la pasaría a «según fechas» y chocaría con la otra. Navidad y
-- el Día de la Madre se comportan como antes.
--
-- Una temática nueva amplía las dos restricciones de abajo, y si tiene
-- alternativa, `app.tematica_alternativa`: es la misma lista que
-- `src/lib/tematicas/disenos.ts`.
-- =============================================================================

alter table public.tematicas drop constraint tematicas_slug_conocido;
alter table public.tematicas
  add constraint tematicas_slug_conocido
  check (slug in ('navidad', 'dia-de-la-madre', 'halloween', 'cancion-criolla'));

alter table public.tematicas drop constraint tematicas_estilo_de_su_tematica;
alter table public.tematicas
  add constraint tematicas_estilo_de_su_tematica check (
    (slug = 'navidad' and estilo in ('noche', 'crema'))
    or (slug = 'dia-de-la-madre' and estilo in ('rosa-crema', 'rosa'))
    or (slug = 'halloween' and estilo in ('calabaza-noche', 'calabaza-crema'))
    or (slug = 'cancion-criolla' and estilo in ('rojo-blanco', 'balcon'))
  );

-- -----------------------------------------------------------------------------
-- Qué temática es alternativa de cuál: dos fiestas para la misma fecha, de las
-- que el negocio celebra una. NULL si no tiene.
-- -----------------------------------------------------------------------------
create function app.tematica_alternativa(p_slug text)
returns text
language sql
immutable
set search_path = ''
as $$
  select case p_slug
           when 'halloween' then 'cancion-criolla'
           when 'cancion-criolla' then 'halloween'
         end;
$$;

comment on function app.tematica_alternativa(text) is
  'La temática alternativa de otra (misma fiesta, el negocio celebra una), o NULL. Igual que disenos.ts.';

-- -----------------------------------------------------------------------------
-- Las reglas de fechas y modo (0047), con dos excepciones entre alternativas.
-- Lo demás, igual que en 0047.
-- -----------------------------------------------------------------------------
create or replace function app.tematicas_reglas()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_hoy         date := (now() at time zone 'America/Lima')::date;
  v_alternativa text := app.tematica_alternativa(new.slug);
  v_otra        text;
  v_es_alterna  boolean;
begin
  -- Un encendido a mano que ya caducó cuenta como «según fechas»: guardar
  -- cualquier otra cosa (un texto, un producto) no puede chocar con él.
  if tg_op = 'UPDATE' and old.encendido <> 'fechas' and v_hoy > old.encendido_hasta
     and new.encendido = old.encendido then
    new.encendido := 'fechas';
  end if;

  -- Cambiar las fechas devuelve la temática a «según fechas», salvo que el
  -- mismo cambio ponga un modo nuevo: apagarla un año y luego poner las fechas
  -- del siguiente no puede dejarla apagada también esa campaña.
  --
  -- Excepto la «Apagada» de una temática con alternativa (0050): esa es la
  -- fiesta que el negocio no celebra, y tiene que seguir apagada con sus fechas
  -- nuevas. Si no, chocaría con la otra (o, si las fechas aún no se cruzan,
  -- pasaría a «según fechas» sin que nadie lo pidiera). Aquí llega solo una
  -- «Apagada» en vigor: la caducada ya pasó a «según fechas» arriba.
  if tg_op = 'UPDATE'
     and (new.inicio is distinct from old.inicio or new.fin is distinct from old.fin)
     and new.encendido = old.encendido
     and not (new.encendido = 'apagada' and v_alternativa is not null) then
    new.encendido := 'fechas';
  end if;

  -- Desde y hasta cuándo vale lo manual los pone siempre este trigger: lo que
  -- llegue de la aplicación se ignora (la RLS decide qué fila, no qué valor).
  if new.encendido = 'fechas' then
    new.encendido_desde := null;
    new.encendido_hasta := null;
  else
    if tg_op = 'INSERT' or new.encendido is distinct from old.encendido then
      if new.encendido = 'encendida' and new.fin < v_hoy then
        raise exception 'Las fechas de esta campaña ya pasaron: pon primero las de este año.'
          using errcode = 'P0001';
      end if;
      new.encendido_desde := v_hoy;
    else
      new.encendido_desde := old.encendido_desde;
    end if;
    new.encendido_hasta := new.fin;
  end if;

  -- Una sola activa a la vez. La ventana de una temática va de su inicio (o
  -- del día en que se encendió a mano, si fue antes) a su fin. El cerrojo evita
  -- que dos guardados a la vez se crucen sin verse. Es un cerrojo de consejo y
  -- no `lock table`: el `update` ya tiene la tabla en ROW EXCLUSIVE, y pedir
  -- SHARE ROW EXCLUSIVE dejaba a dos guardados esperándose (40P01).
  --
  -- Entre alternativas (0050) el cruce se perdona si una de las dos está
  -- apagada en vigor (no puede encenderse), o si las dos campañas ya
  -- terminaron (tampoco: es el año siguiente, antes de poner las fechas nuevas).
  perform pg_advisory_xact_lock(hashtext('public.tematicas'));
  select t.nombre, coalesce(t.slug = v_alternativa, false)
    into v_otra, v_es_alterna
    from public.tematicas t
   where t.id <> new.id
     and daterange(
           least(t.inicio, case when t.encendido = 'encendida' and v_hoy <= t.encendido_hasta
                                then t.encendido_desde else t.inicio end),
           t.fin, '[]')
      && daterange(
           least(new.inicio, case when new.encendido = 'encendida' then new.encendido_desde else new.inicio end),
           new.fin, '[]')
     and not (
           coalesce(t.slug = v_alternativa, false)
           and (
             (t.encendido = 'apagada' and v_hoy <= t.encendido_hasta)
             or (new.encendido = 'apagada' and v_hoy <= new.encendido_hasta)
             or (t.fin < v_hoy and new.fin < v_hoy)
           )
         )
   limit 1;
  if v_otra is not null and v_es_alterna then
    raise exception 'Las fechas se cruzan con «%». Las dos son para la misma fiesta: deja una de las dos «Apagada».',
      v_otra
      using errcode = 'P0001';
  elsif v_otra is not null then
    raise exception 'Las fechas se cruzan con «%». Cambia las fechas de una de las dos.', v_otra
      using errcode = 'P0001';
  end if;

  return new;
end;
$$;

-- -----------------------------------------------------------------------------
-- Las dos temáticas, con sus textos de partida: del lunes 25/10 al lunes
-- 01/11/2027, con la fiesta el domingo 31. Sin productos: son un saludo, y el
-- negocio los añade desde el panel si quiere. Halloween según fechas y la
-- Canción Criolla apagada (el trigger le pone desde hoy hasta su fin), en ese
-- orden: el de reglas no se apaga, así que la segunda ya pasa por la excepción.
--
-- Sin autoría ni auditoría: es el estado de partida, no un cambio que hiciera
-- una persona (trampa de 0024).
-- -----------------------------------------------------------------------------
alter table public.tematicas disable trigger tematicas_sellar_autoria;
alter table public.tematicas disable trigger auditar_tematicas;

insert into public.tematicas
  (slug, nombre, inicio, fin, fecha_evento, encendido, estilo, texto_aviso, mensajes_cinta, titulo, entradilla)
values (
  'halloween', 'Halloween', '2027-10-25', '2027-11-01', '2027-10-31', 'fechas', 'calabaza-noche',
  'Feliz Halloween: dulce o truco en Pimpo''s',
  array['Dulce o truco', 'Pan calientito para los disfrazados', 'Delivery a todo Iquitos'],
  'Feliz Halloween',
  'Dulce o truco: aquí siempre hay pan calientito para los pequeños disfrazados.'
);

insert into public.tematicas
  (slug, nombre, inicio, fin, fecha_evento, encendido, estilo, texto_aviso, mensajes_cinta, titulo, entradilla)
values (
  'cancion-criolla', 'Día de la Canción Criolla', '2027-10-25', '2027-11-01', '2027-10-31', 'apagada',
  'rojo-blanco',
  'Feliz Día de la Canción Criolla: pan calientito y buena música',
  array['Feliz día criollo', 'Pan para la jarana', 'Delivery a todo Iquitos'],
  'Feliz Día de la Canción Criolla',
  'Un valsecito, un cajón y pan calientito: así se celebra en casa.'
);

alter table public.tematicas enable trigger auditar_tematicas;
alter table public.tematicas enable trigger tematicas_sellar_autoria;
