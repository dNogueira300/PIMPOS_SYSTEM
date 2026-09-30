import { Suspense } from "react";

import { EncabezadoPanel } from "@/components/panel/encabezado-panel";
import { exigirAcceso } from "@/lib/auth/sesion";

import { FormularioZona } from "../formulario-zona";

export default function NuevaZona() {
  return (
    <>
      <EncabezadoPanel
        titulo="Nueva zona"
        volver={{ ruta: "/admin/clientes/zonas", nombre: "Zonas" }}
      />
      <Suspense fallback={null}>
        <Protegido />
      </Suspense>
    </>
  );
}

async function Protegido() {
  await exigirAcceso("/admin/clientes/zonas");
  return <FormularioZona zona={null} />;
}
