import { EncabezadoPanel } from "@/components/panel/encabezado-panel";

import { FormularioCategoria } from "../formulario-categoria";

export default function NuevaCategoria() {
  return (
    <>
      <EncabezadoPanel
        titulo="Nueva categoría"
        volver={{ ruta: "/admin/contenido/categorias", nombre: "Categorías" }}
      />
      <FormularioCategoria categoria={null} />
    </>
  );
}
