import { Suspense } from "react";

import { EncabezadoPanel } from "@/components/panel/encabezado-panel";
import { exigirAcceso } from "@/lib/auth/sesion";

import { FormularioCategoria } from "../formulario-categoria";

export default function NuevaCategoria() {
  return (
    <>
      <EncabezadoPanel
        titulo="Nueva categoría"
        volver={{ ruta: "/admin/contenido/categorias", nombre: "Categorías" }}
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
  await exigirAcceso("/admin/contenido/categorias");
  return <FormularioCategoria categoria={null} />;
}
