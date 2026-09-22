import { EncabezadoPanel } from "@/components/panel/encabezado-panel";

import { FormularioGuia } from "../formulario-guia";

export default function NuevaGuia() {
  return (
    <>
      <EncabezadoPanel
        titulo="Nueva guía"
        volver={{ ruta: "/admin/contenido/guias", nombre: "Guías" }}
      />
      <FormularioGuia guia={null} />
    </>
  );
}
