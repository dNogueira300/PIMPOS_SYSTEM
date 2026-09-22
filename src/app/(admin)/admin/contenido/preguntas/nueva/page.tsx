import { EncabezadoPanel } from "@/components/panel/encabezado-panel";

import { FormularioFaq } from "../formulario-faq";

export default function NuevaPregunta() {
  return (
    <>
      <EncabezadoPanel
        titulo="Nueva pregunta"
        volver={{ ruta: "/admin/contenido/preguntas", nombre: "Preguntas frecuentes" }}
      />
      <FormularioFaq faq={null} />
    </>
  );
}
