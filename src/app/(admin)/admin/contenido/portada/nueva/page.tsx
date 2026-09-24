import { Suspense } from "react";

import { EncabezadoPanel } from "@/components/panel/encabezado-panel";
import { exigirAcceso } from "@/lib/auth/sesion";

import { FormularioSlide } from "../formulario-slide";

export default function NuevoSlide() {
  return (
    <>
      <EncabezadoPanel
        titulo="Nuevo slide"
        volver={{ ruta: "/admin/contenido/portada", nombre: "Portada" }}
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
  await exigirAcceso("/admin/contenido/portada");
  return <FormularioSlide slide={null} />;
}
