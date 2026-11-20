import type { Estilo } from "./estilos";

/**
 * Las temáticas que tienen diseño en el código (planes 08, 08.1 y 08.2), con
 * sus estilos, cómo se dice su nombre dentro de una frase y, si la tiene, su
 * alternativa: otra fiesta para la misma fecha, de las que el negocio celebra
 * una (Halloween y el Día de la Canción Criolla). Es la misma lista que repite
 * la base en `tematicas_slug_conocido`, `tematicas_estilo_de_su_tematica` y
 * `app.tematica_alternativa` (0050): una temática nueva se añade en los dos
 * sitios, más su CSS en `src/estilos/tematicas.css`.
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
  halloween: {
    articulo: "",
    alternativa: "cancion-criolla",
    estilos: [
      {
        valor: "calabaza-noche",
        nombre: "Noche de calabazas",
        ayuda: "Todo el sitio de noche, en morado casi negro, con naranja calabaza.",
      },
      {
        valor: "calabaza-crema",
        nombre: "Calabaza sobre crema",
        ayuda: "El crema de siempre, con naranja calabaza y la barra de arriba casi negra.",
      },
    ],
  },
  "cancion-criolla": {
    articulo: "el",
    alternativa: "halloween",
    estilos: [
      {
        valor: "rojo-blanco",
        nombre: "Rojo y blanco",
        ayuda: "El crema de siempre, con el rojo de la bandera.",
      },
      {
        valor: "balcon",
        nombre: "Balcón limeño",
        ayuda: "Crema con madera tallada y flores de buganvilla.",
      },
    ],
  },
} as const satisfies Record<
  string,
  { articulo: "" | "el"; alternativa?: string; estilos: readonly OpcionEstilo[] }
>;

export type SlugConDiseno = keyof typeof DISENOS;

export const SLUGS_CON_DISENO = Object.keys(DISENOS) as SlugConDiseno[];

export function esSlugConDiseno(slug: string | null | undefined): slug is SlugConDiseno {
  return typeof slug === "string" && Object.hasOwn(DISENOS, slug);
}

/**
 * La otra fiesta de la misma fecha, de las que el negocio celebra una: solo una
 * de las dos puede estar encendida (la base lo exige, 0050). NULL si no tiene.
 */
export function alternativaDe(slug: string | null | undefined): SlugConDiseno | null {
  if (!esSlugConDiseno(slug)) return null;
  const entrada = DISENOS[slug];
  return "alternativa" in entrada ? entrada.alternativa : null;
}
