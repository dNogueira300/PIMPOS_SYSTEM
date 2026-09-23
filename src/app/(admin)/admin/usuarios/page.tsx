import { Plus } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";

import { EncabezadoPanel } from "@/components/panel/encabezado-panel";
import { ListaAdaptable } from "@/components/panel/lista-adaptable";
import { NOMBRE_DEL_ROL } from "@/lib/auth/roles";
import { exigirAcceso } from "@/lib/auth/sesion";
import { crearClienteAdministrador } from "@/lib/supabase/administrador";
import { crearClienteServidor } from "@/lib/supabase/servidor";

const RUTA = "/admin/usuarios";

export default function Usuarios() {
  return (
    <>
      <EncabezadoPanel
        titulo="Usuarios"
        descripcion="Las cuentas que entran al panel. Cada cuenta nueva recibe una contraseña temporal que cambia al entrar."
        accion={
          <Link href={`${RUTA}/nuevo`} className="boton-cta">
            <Plus aria-hidden className="size-5" /> Nueva cuenta
          </Link>
        }
      />
      <Suspense fallback={<p className="text-muted-foreground text-sm">Cargando…</p>}>
        <Lista />
      </Suspense>
    </>
  );
}

async function Lista() {
  await exigirAcceso(RUTA);
  const supabase = await crearClienteServidor();
  const { data: perfiles, error } = await supabase
    .from("perfiles")
    .select("id, nombre_completo, rol, activo")
    .is("deleted_at", null)
    .order("nombre_completo");
  if (error) return <p role="alert">No se pudieron cargar los usuarios. Recarga la página.</p>;

  // El correo vive en auth.users, que la RLS no expone. Se lee con la
  // service_role DESPUÉS de exigirAcceso, y de ahí solo se toma el correo.
  const { data: cuentas } = await crearClienteAdministrador().auth.admin.listUsers({
    perPage: 1000,
  });
  const correos = new Map((cuentas?.users ?? []).map((u) => [u.id, u.email ?? ""]));

  const filas = perfiles.map((p) => ({ ...p, correo: correos.get(p.id) ?? "" }));

  return (
    <ListaAdaptable
      etiqueta="Cuentas del panel"
      filas={filas}
      enlace={(u) => `${RUTA}/${u.id}`}
      columnas={[
        { titulo: "Nombre", celda: (u) => u.nombre_completo, principal: true },
        { titulo: "Correo", celda: (u) => <span className="break-all">{u.correo}</span> },
        { titulo: "Rol", celda: (u) => NOMBRE_DEL_ROL[u.rol] },
        { titulo: "Acceso", celda: (u) => (u.activo ? "Activa" : "Desactivada") },
      ]}
      vacio={<p>Todavía no hay cuentas. Crea la primera con «Nueva cuenta».</p>}
    />
  );
}
