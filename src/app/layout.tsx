import type { Metadata } from "next";

import { clasesDeFuentes } from "@/estilos/fuentes";

import "@/estilos/globals.css";

export const metadata: Metadata = {
  title: {
    default: "Panadería Pimpo's",
    template: "%s · Panadería Pimpo's",
  },
  description:
    "Panadería, pastelería y bodega en Iquitos. Elaborado y vendido el mismo día, con delivery propio a toda la ciudad.",
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
