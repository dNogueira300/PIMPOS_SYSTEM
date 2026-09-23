import { notFound } from "next/navigation";
import { Suspense } from "react";

import { EncabezadoPanel } from "@/components/panel/encabezado-panel";
import type { Rol } from "@/lib/auth/roles";
import { exigirAcceso } from "@/lib/auth/sesion";
import { crearClienteAdministrador } from "@/lib/supabase/administrador";
import { crearClienteServidor } from "@/lib/supabase/servidor";
import { puedeGestionarAcceso, rolesQuePuedeAsignar } from "@/lib/validaciones/usuario";

import { AccionesUsuario } from "../acciones-usuario";
import { FormularioUsuario } from "../formulario-usuario";

const RUTA = "/admin/usuarios";

export default function EditarUsuario({ params }: PageProps<"/admin/usuarios/[id]">) {
  return (
    <Suspense fallback={<p className="text-muted-foreground text-sm">Cargando…</p>}>
      <Editor params={params} />
    </Suspense>
  );
}

async function Editor({ params }: { params: PageProps<"/admin/usuarios/[id]">["params"] }) {
  const { id } = await params;
  const sesion = await exigirAcceso(RUTA);
  const supabase = await crearClienteServidor();
  // Con la sesión: si la RLS no deja ver el perfil, no se pide nada a Auth.
  const { data: perfil } = await supabase
    .from("perfiles")
    .select("id, nombre_completo, celular, rol, activo")
    .eq("id", id)
    .is("deleted_at", null)
    .maybeSingle();
  if (!perfil) notFound();

  const { data: cuenta } = await crearClienteAdministrador().auth.admin.getUserById(perfil.id);
  const esYo = perfil.id === sesion.usuarioId;
  // Un administrador no toca el rol ni el acceso de un superadmin (0029): se
  // le enseña su rol, fijo, y ningún botón de acceso.
  const puedeGestionar = puedeGestionarAcceso(sesion.rol, perfil.rol);
  const asignables: Rol[] =
    esYo || !puedeGestionar ? [perfil.rol] : rolesQuePuedeAsignar(sesion.rol);

  return (
    <>
      <EncabezadoPanel
        titulo={perfil.nombre_completo}
        volver={{ ruta: RUTA, nombre: "Usuarios" }}
      />
      <FormularioUsuario
        usuario={{ ...perfil, correo: cuenta.user?.email ?? "" }}
        rolesAsignables={asignables}
      />
      <AccionesUsuario
        id={perfil.id}
        nombre={perfil.nombre_completo}
        activo={perfil.activo}
        esYo={esYo}
        puedeGestionar={puedeGestionar}
        puedeEliminar={sesion.rol === "superadmin"}
      />
    </>
  );
}
