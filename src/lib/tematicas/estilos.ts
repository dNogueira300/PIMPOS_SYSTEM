/**
 * Los estilos de una temática (plan 08, migración 0048). Dan pidió las dos
 * variantes de Navidad y dejar puesta la de noche. Cada estilo tiene su CSS en
 * `src/estilos/tematicas.css` (`[data-estilo="…"]`); la base solo admite estos
 * (`tematicas_estilo_conocido`). Sin dependencias: lo usan el panel y el sitio.
 */
export const ESTILOS = ["noche", "crema"] as const;

export type Estilo = (typeof ESTILOS)[number];

export const OPCIONES_DE_ESTILO: readonly { valor: Estilo; nombre: string; ayuda: string }[] = [
  {
    valor: "noche",
    nombre: "Noche de Navidad",
    ayuda: "Todo el sitio sobre verde pino, con botones rojos y precios dorados.",
  },
  {
    valor: "crema",
    nombre: "Crema navideña",
    ayuda: "El crema de siempre, con rojo en los botones y verde pino en las franjas.",
  },
];

/** Lo que llega de la base (texto, quizá NULL) como uno de los estilos. */
export function comoEstilo(valor: string | null | undefined): Estilo {
  return ESTILOS.find((e) => e === valor) ?? "noche";
}
