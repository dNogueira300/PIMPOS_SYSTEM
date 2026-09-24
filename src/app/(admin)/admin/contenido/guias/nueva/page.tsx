import { Suspense } from "react";

import { EncabezadoPanel } from "@/components/panel/encabezado-panel";
import { exigirAcceso } from "@/lib/auth/sesion";

import { FormularioGuia } from "../formulario-guia";

export default function NuevaGuia() {
  return (
    <>
      <EncabezadoPanel
        titulo="Nueva guía"
        volver={{ ruta: "/admin/contenido/guias", nombre: "Guías" }}
      />
      <Suspense fallback={null}>
        <Formulario />
      </Suspense>
    </>
  );
}

// El layout solo exige «/admin», que un repartidor pasa: cada página comprueba
// su propia ruta, como la lista y la ficha de este mismo módulo.
async function Formulario() {
  await exigirAcceso("/admin/contenido/guias");
  return <FormularioGuia guia={null} />;
}
