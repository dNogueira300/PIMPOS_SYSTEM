import { Suspense } from "react";

import { EncabezadoPanel } from "@/components/panel/encabezado-panel";
import { exigirAcceso } from "@/lib/auth/sesion";

import { FormularioFaq } from "../formulario-faq";

export default function NuevaPregunta() {
  return (
    <>
      <EncabezadoPanel
        titulo="Nueva pregunta"
        volver={{ ruta: "/admin/contenido/preguntas", nombre: "Preguntas frecuentes" }}
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
  await exigirAcceso("/admin/contenido/preguntas");
  return <FormularioFaq faq={null} />;
}
