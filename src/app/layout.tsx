import type { Metadata } from "next";

import { clasesDeFuentes } from "@/estilos/fuentes";
import { urlDelSitio } from "@/lib/sitio";

import "@/estilos/globals.css";

export const metadata: Metadata = {
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

export default function RootLayout({ children }: LayoutProps<"/">) {
  // Las clases de `next/font` publican `--fuente-titulo` y `--fuente-texto`,
  // que es lo que consume la capa de primitivos de globals.css.
  return (
    <html lang="es-PE" className={clasesDeFuentes}>
      <body>{children}</body>
    </html>
  );
}
