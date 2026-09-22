import { Suspense } from "react";

import { EncabezadoPanel } from "@/components/panel/encabezado-panel";
import { exigirAcceso } from "@/lib/auth/sesion";

import { FormularioNovedad } from "../formulario-novedad";

export default function NuevaNovedad() {
  return (
    <>
      <EncabezadoPanel
        titulo="Nueva novedad"
        volver={{ ruta: "/admin/contenido/novedades", nombre: "Novedades" }}
      />
      <Suspense fallback={null}>
        <Formulario />
      </Suspense>
    </>
  );
}

async function Formulario() {
  const sesion = await exigirAcceso("/admin/contenido/novedades");
  // Una novedad nueva todavía no tiene tipo: se ofrecen «Guardar» y lo que el
  // rol puede hacer con una promoción, que es el caso más restrictivo. Al
  // elegir otro tipo y guardar, la ficha ya enseña los botones de ese tipo.
  const acciones: ("guardar" | "enviar" | "publicar")[] =
    sesion.rol === "ingeniero" ? ["guardar", "enviar"] : ["guardar", "publicar"];
  return <FormularioNovedad novedad={null} acciones={acciones} />;
}
