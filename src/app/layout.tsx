import type { Metadata } from "next";

import { clasesDeFuentes } from "@/estilos/fuentes";
import { obtenerConfiguracion } from "@/lib/datos/configuracion";
import { urlDelSitio } from "@/lib/sitio";
import { urlDeImagen } from "@/lib/supabase/publico";

import "@/estilos/globals.css";

const METADATA_FIJA: Metadata = {
  // Base de toda URL que un buscador o una red social lee fuera de la página:
  // la imagen para compartir, la canónica. Sin ella, Next rechaza las rutas
  // relativas en el build, y con una base equivocada el enlace compartido por
  // WhatsApp sale sin foto. Ver src/lib/sitio.ts.
  metadataBase: new URL(urlDelSitio()),
  title: {
    default: "Panadería Pimpo's",
    template: "%s · Panadería Pimpo's",
  },
  description:
    "Panadería, pastelería y bodega en Iquitos. Elaborado y vendido el mismo día, con delivery propio a toda la ciudad.",
  // La imagen la genera src/app/opengraph-image.tsx; aquí van el resto de
  // campos. `es_PE`, no `es_ES`: el negocio y su cliente están en Iquitos.
  openGraph: {
    type: "website",
    locale: "es_PE",
    siteName: "Panadería Pimpo's",
  },
  twitter: { card: "summary_large_image" },
};

/**
 * El favicon es administrable (R21). No se sirve con `app/icon.tsx` +
 * `ImageResponse`: ese generador no dibuja SVG de forma fiable (trampa de
 * `next/og` en AGENTS.md). El archivo de reserva es PNG cuadrado para
 * buscadores y navegadores. Un
 * `<link rel="icon">` a la URL guardada no necesita generar ninguna imagen.
 *
 * `obtenerConfiguracion` está en `use cache` con la etiqueta `marca`: no
 * cuesta una consulta por página, y al guardar la configuración el panel
 * invalida la etiqueta y el enlace cambia sin redesplegar. El
 * `apple-touch-icon` conserva su archivo local en `public/marca/`.
 * Ambos archivos locales se preparan desde el logo aprobado con
 * `scripts/preparar-favicon.cjs`; el favicon configurado conserva prioridad.
 */
export async function generateMetadata(): Promise<Metadata> {
  const config = await obtenerConfiguracion();
  return {
    ...METADATA_FIJA,
    icons: {
      icon: urlDeImagen("marca", config.favicon_url) ?? "/marca/favicon.png",
      apple: "/marca/apple-touch-icon.png",
    },
  };
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  // La clase de `next/font` publica `--fuente-texto` para títulos y texto,
  // que es lo que consume la capa de primitivos de globals.css.
  return (
    <html lang="es-PE" className={clasesDeFuentes}>
      <body>{children}</body>
    </html>
  );
}
