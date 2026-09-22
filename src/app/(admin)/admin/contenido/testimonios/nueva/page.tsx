import { EncabezadoPanel } from "@/components/panel/encabezado-panel";

import { FormularioTestimonio } from "../formulario-testimonio";

export default function NuevoTestimonio() {
  return (
    <>
      <EncabezadoPanel
        titulo="Nuevo testimonio"
        volver={{ ruta: "/admin/contenido/testimonios", nombre: "Testimonios" }}
      />
      <FormularioTestimonio testimonio={null} />
    </>
  );
}
