import { Suspense } from "react";

import { EncabezadoPanel } from "@/components/panel/encabezado-panel";
import { exigirAcceso } from "@/lib/auth/sesion";
import { rolesQuePuedeAsignar } from "@/lib/validaciones/usuario";

import { FormularioUsuario } from "../formulario-usuario";

export default function NuevoUsuario() {
  return (
    <>
      <EncabezadoPanel
        titulo="Nueva cuenta"
        volver={{ ruta: "/admin/usuarios", nombre: "Usuarios" }}
      />
      <Suspense fallback={<p className="text-muted-foreground text-sm">Cargando…</p>}>
        <Formulario />
      </Suspense>
    </>
  );
}

async function Formulario() {
  const sesion = await exigirAcceso("/admin/usuarios");
  return <FormularioUsuario usuario={null} rolesAsignables={rolesQuePuedeAsignar(sesion.rol)} />;
}
