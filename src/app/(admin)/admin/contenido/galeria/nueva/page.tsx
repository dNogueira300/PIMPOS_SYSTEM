import { EncabezadoPanel } from "@/components/panel/encabezado-panel";

import { FormularioFotoGaleria } from "../formulario-foto-galeria";

export default function NuevaFoto() {
  return (
    <>
      <EncabezadoPanel
        titulo="Nueva foto"
        volver={{ ruta: "/admin/contenido/galeria", nombre: "Galería" }}
      />
      <FormularioFotoGaleria foto={null} />
    </>
  );
}
