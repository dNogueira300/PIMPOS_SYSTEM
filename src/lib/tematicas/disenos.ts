import type { Estilo } from "./estilos";

/**
 * Las temáticas que tienen diseño en el código (plan 08 y 08.1), con sus
 * estilos y cómo se dice su nombre dentro de una frase. Es la misma lista que
 * repite la base en `tematicas_slug_conocido` y `tematicas_estilo_de_su_tematica`
 * (0049): una temática nueva se añade en los dos sitios, más su CSS en
 * `src/estilos/tematicas.css`.
 *
 * El primer estilo de cada temática es el que se pone si no hay otro. Sin
 * dependencias: lo usan el panel y el sitio.
 */
export type OpcionEstilo = { valor: Estilo; nombre: string; ayuda: string };

export const DISENOS = {
  navidad: {
    articulo: "",
    estilos: [
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
    ],
  },
  "dia-de-la-madre": {
    articulo: "el",
    estilos: [
      {
        valor: "rosa-crema",
        nombre: "Rosa sobre crema",
        ayuda: "El crema de siempre, con vino y rosa en los botones y las franjas.",
      },
      {
        valor: "rosa",
        nombre: "Todo en rosa",
        ayuda: "Todo el sitio sobre rosa empolvado, con vino y dorado.",
      },
    ],
  },
} as const satisfies Record<string, { articulo: "" | "el"; estilos: readonly OpcionEstilo[] }>;

export type SlugConDiseno = keyof typeof DISENOS;

export const SLUGS_CON_DISENO = Object.keys(DISENOS) as SlugConDiseno[];

export function esSlugConDiseno(slug: string | null | undefined): slug is SlugConDiseno {
  return typeof slug === "string" && Object.hasOwn(DISENOS, slug);
}
