import { Suspense } from "react";

import { EncabezadoPanel } from "@/components/panel/encabezado-panel";
import { exigirAcceso } from "@/lib/auth/sesion";
import { crearClienteServidor } from "@/lib/supabase/servidor";
import { CLAVES_EDITABLES } from "@/lib/validaciones/configuracion-panel";

import { FormularioConfiguracion, type Ajuste } from "./formulario-configuracion";

export default function Configuracion() {
  return (
    <>
      <EncabezadoPanel
        titulo="Configuración"
        descripcion="Los datos del negocio que se ven en todo el sitio. Se guardan todos a la vez."
      />
      <Suspense fallback={<p className="text-muted-foreground text-sm">Cargando…</p>}>
        <Formulario />
      </Suspense>
    </>
  );
}

async function Formulario() {
  await exigirAcceso("/admin/configuracion");
  const supabase = await crearClienteServidor();
  const { data, error } = await supabase
    .from("configuracion_sitio")
    .select("clave, valor, descripcion")
    .in("clave", CLAVES_EDITABLES as string[]);
  if (error) return <p role="alert">No se pudo cargar la configuración. Recarga la página.</p>;

  const ajustes: Record<string, Ajuste> = Object.fromEntries(data.map((a) => [a.clave, a]));
  return <FormularioConfiguracion ajustes={ajustes} />;
}
