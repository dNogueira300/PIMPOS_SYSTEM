import { EncabezadoPanel } from "@/components/panel/encabezado-panel";

import { FormularioSlide } from "../formulario-slide";

export default function NuevoSlide() {
  return (
    <>
      <EncabezadoPanel
        titulo="Nuevo slide"
        volver={{ ruta: "/admin/contenido/portada", nombre: "Portada" }}
      />
      <FormularioSlide slide={null} />
    </>
  );
}
