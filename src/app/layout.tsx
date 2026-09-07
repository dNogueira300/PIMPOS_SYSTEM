import type { Metadata } from "next";

import "@/estilos/globals.css";

// Sin tipografia todavia, a proposito. shadcn intento cargar Geist desde
// Google Fonts y el plan lo prohibe (doc 03 §3.2): las fuentes van con
// next/font/local, sin mandar la IP de cada visitante a un tercero. Fraunces e
// Inter entran con el sistema de diseno, en su propio PR.
export const metadata: Metadata = {
  title: {
    default: "Panadería Pimpo's",
    template: "%s · Panadería Pimpo's",
  },
  description:
    "Panadería, pastelería y bodega en Iquitos. Elaborado y vendido el mismo día, con delivery propio a toda la ciudad.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es-PE">
      <body>{children}</body>
    </html>
  );
}
