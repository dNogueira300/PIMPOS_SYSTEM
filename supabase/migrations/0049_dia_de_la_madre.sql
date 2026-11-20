-- =============================================================================
-- 0049 · El Día de la Madre, y cada temática con sus estilos (plan 08.1)
--
-- Diseño acordado con Dan el 20/11/2026: el Día de la Madre es un saludo
-- festivo, con dos estilos propios.
--
--   · rosa-crema («Rosa sobre crema», el puesto): el crema de siempre, con vino
--     y rosa en lo que se pulsa y en las franjas.
--   · rosa («Todo en rosa»): el sitio entero sobre rosa empolvado, con vino y
--     dorado.
--
-- Hasta ahora los estilos eran una lista común (0048), así que la base habría
-- aceptado Navidad en «rosa», que no tiene CSS, y el sitio saldría a medio
-- vestir. Desde aquí cada temática admite solo los suyos: la restricción es de
-- pares temática-estilo, la misma lista que `src/lib/tematicas/disenos.ts`.
-- Una temática nueva amplía las dos restricciones de abajo.
-- =============================================================================

alter table public.tematicas drop constraint tematicas_slug_conocido;
alter table public.tematicas
  add constraint tematicas_slug_conocido check (slug in ('navidad', 'dia-de-la-madre'));

alter table public.tematicas drop constraint tematicas_estilo_conocido;
alter table public.tematicas
  add constraint tematicas_estilo_de_su_tematica check (
    (slug = 'navidad' and estilo in ('noche', 'crema'))
    or (slug = 'dia-de-la-madre' and estilo in ('rosa-crema', 'rosa'))
  );

-- -----------------------------------------------------------------------------
-- El Día de la Madre, con sus textos de partida: el segundo domingo de mayo, una
-- semana antes y el día después. Sin productos: la temática es un saludo, y el
-- negocio los añade desde el panel si quiere.
--
-- Sin autoría ni auditoría: es el estado de partida, no un cambio que hiciera
-- una persona (trampa de 0024).
-- -----------------------------------------------------------------------------
alter table public.tematicas disable trigger tematicas_sellar_autoria;
alter table public.tematicas disable trigger auditar_tematicas;

insert into public.tematicas
  (slug, nombre, inicio, fin, fecha_evento, estilo, texto_aviso, mensajes_cinta, titulo, entradilla)
values (
  'dia-de-la-madre', 'Día de la Madre', '2027-05-03', '2027-05-10', '2027-05-09', 'rosa-crema',
  'Feliz Día de la Madre: gracias por todo, mamá',
  array['Feliz día, mamá', 'Gracias por todo', 'Delivery a todo Iquitos'],
  'Feliz Día de la Madre',
  'Gracias, mamá, por las mañanas de pan caliente. Hoy horneamos pensando en ti.'
);

alter table public.tematicas enable trigger auditar_tematicas;
alter table public.tematicas enable trigger tematicas_sellar_autoria;
