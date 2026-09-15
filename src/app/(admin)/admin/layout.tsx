import type { Metadata } from "next";
import { Suspense } from "react";

import { CascaraPanel } from "@/components/panel/cascara-panel";
import { exigirAcceso } from "@/lib/auth/sesion";
import { crearClienteServidor } from "@/lib/supabase/servidor";

export const metadata: Metadata = {
  title: "Panel",
  robots: { index: false, follow: false },
};

/**
 * La sesion sale de una cookie, así que todo lo que la lee va dentro de
 * <Suspense>: con Cache Components, leerla fuera ataría el render entero a la
 * petición y el build se negaría a prerenderizar.
 */
export default function LayoutPanel({ children }: LayoutProps<"/admin">) {
  return (
    <Suspense fallback={<p className="text-muted-foreground p-6 text-sm">Cargando el panel…</p>}>
      <CascaraConSesion>{children}</CascaraConSesion>
    </Suspense>
  );
}

async function CascaraConSesion({ children }: { children: React.ReactNode }) {
  const sesion = await exigirAcceso("/admin");
  const supabase = await crearClienteServidor();
  const { data } = await supabase
    .from("perfiles")
    .select("nombre_completo")
    .eq("id", sesion.usuarioId)
    .single();

  return (
    <CascaraPanel rol={sesion.rol} nombre={data?.nombre_completo ?? sesion.correo ?? ""}>
      {children}
    </CascaraPanel>
  );
}
