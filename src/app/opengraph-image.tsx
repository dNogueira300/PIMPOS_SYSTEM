import { readFile } from "node:fs/promises";
import { join } from "node:path";

import { ImageResponse } from "next/og";

import { formatearPrecio, listarProductos } from "@/lib/datos/catalogo";
import { obtenerConfiguracion } from "@/lib/datos/configuracion";

/**
 * La imagen que aparece al compartir un enlace del sitio (doc 03 §4.4).
 *
 * Es lo primero que ve la mayoría: el sitio de una panadería de barrio se
 * comparte por WhatsApp mucho más de lo que se busca en Google, y un enlace sin
 * imagen parece spam. Por eso existe aunque ningún visitante la vea en la
 * página.
 *
 * Tres detalles que costó averiguar antes de escribirla:
 *
 * - `ImageResponse` **no acepta woff2**, que es el formato de las fuentes del
 *   sitio. Solo ttf, otf y woff. Los `.ttf` de `src/recursos/compartir/` son
 *   las mismas Fraunces e Inter del sitio (misma licencia OFL, mismo archivo de
 *   origen), convertidas a estáticas: el motor tampoco maneja bien las fuentes
 *   variables, así que se fijaron grosor y tamaño óptico.
 * - El isotipo va en PNG y dentro del repositorio. El de `DOC/Fotos...` está fuera
 *   de git, y en el CI o en un despliegue no existiría.
 * - El paquete de esta imagen tiene un límite de 500 KB con fuentes y logos
 *   incluidos. Hoy son unos 125 KB.
 *
 * El nombre y el precio salen de la base, no de este archivo: si el pan más
 * barato sube de precio, la imagen deja de anunciar uno que ya no existe.
 */

export const alt = "Panadería Pimpo's, pan fresco todos los días en Iquitos";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const RECURSOS = join(process.cwd(), "src/recursos/compartir");

// No dependen de la petición: se leen una vez al cargar el módulo.
const fraunces = await readFile(join(RECURSOS, "fraunces-600.ttf"));
const inter = await readFile(join(RECURSOS, "inter-500.ttf"));
const isotipo = `data:image/png;base64,${await readFile(join(RECURSOS, "isotipo.png"), "base64")}`;

// Los colores van en crudo porque aquí no hay CSS ni variables: es una imagen.
// Son los mismos de la capa de primitivos de globals.css.
const AZUL = "#12306e";
const CREMA = "#f7efe2";
const DORADO = "#c8801f";
const TINTA = "#231a14";

export default async function ImagenParaCompartir() {
  const [config, productos] = await Promise.all([obtenerConfiguracion(), listarProductos()]);

  const precios = productos
    .map((producto) => producto.precioDesde)
    .filter((precio): precio is number => precio !== null);
  const masBarato = precios.length > 0 ? Math.min(...precios) : null;

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        backgroundColor: CREMA,
        fontFamily: "Inter",
      }}
    >
      {/* Franja azul a la izquierda con el isotipo: el azul es el color que
            carga la identidad, no el dorado. */}
      <div
        style={{
          width: 420,
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: AZUL,
        }}
      >
        {/* `<img>` y no `next/image`, y no por descuido: esto no es una página
              sino la entrada de `ImageResponse`, que dibuja JSX plano. Un
              componente de React con optimización no existe en ese motor. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={isotipo} width={242} height={320} alt="" />
      </div>

      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "0 64px",
        }}
      >
        <div
          style={{
            fontFamily: "Fraunces",
            fontSize: 76,
            lineHeight: 1.05,
            color: AZUL,
          }}
        >
          {config.nombre_comercial}
        </div>

        <div style={{ marginTop: 20, fontSize: 34, lineHeight: 1.3, color: TINTA }}>
          Pan fresco todos los días en Iquitos
        </div>

        <div style={{ marginTop: 40, display: "flex", flexDirection: "column", gap: 10 }}>
          {masBarato !== null ? (
            <div style={{ fontSize: 30, color: TINTA, display: "flex" }}>
              <span style={{ fontFamily: "Fraunces", color: DORADO, marginRight: 12 }}>
                Desde {formatearPrecio(masBarato)}
              </span>
            </div>
          ) : null}
          <div style={{ fontSize: 28, color: TINTA }}>Delivery propio a toda la ciudad</div>
        </div>
      </div>
    </div>,
    {
      ...size,
      fonts: [
        { name: "Fraunces", data: fraunces, weight: 600, style: "normal" },
        { name: "Inter", data: inter, weight: 500, style: "normal" },
      ],
    },
  );
}
