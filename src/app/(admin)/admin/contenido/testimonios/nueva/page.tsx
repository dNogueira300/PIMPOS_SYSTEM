import { Suspense } from "react";

import { EncabezadoPanel } from "@/components/panel/encabezado-panel";
import { exigirAcceso } from "@/lib/auth/sesion";

import { FormularioTestimonio } from "../formulario-testimonio";

export default function NuevoTestimonio() {
  return (
    <>
      <EncabezadoPanel
        titulo="Nuevo testimonio"
        volver={{ ruta: "/admin/contenido/testimonios", nombre: "Testimonios" }}
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
  await exigirAcceso("/admin/contenido/testimonios");
  return <FormularioTestimonio testimonio={null} />;
}
