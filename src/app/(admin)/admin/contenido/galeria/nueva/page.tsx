import { Suspense } from "react";

import { EncabezadoPanel } from "@/components/panel/encabezado-panel";
import { exigirAcceso } from "@/lib/auth/sesion";

import { FormularioFotoGaleria } from "../formulario-foto-galeria";

export default function NuevaFoto() {
  return (
    <>
      <EncabezadoPanel
        titulo="Nueva foto"
        volver={{ ruta: "/admin/contenido/galeria", nombre: "Galería" }}
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
  await exigirAcceso("/admin/contenido/galeria");
  return <FormularioFotoGaleria foto={null} />;
}
