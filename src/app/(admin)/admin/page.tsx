import type { Metadata } from "next";
import { Suspense } from "react";

import { cerrarSesion } from "@/lib/acciones/autenticacion";
import { exigirAcceso } from "@/lib/auth/sesion";
import { NOMBRE_DEL_ROL, rolesConAcceso } from "@/lib/auth/roles";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Panel",
  robots: { index: false, follow: false },
};

// Las secciones reales llegan en F4-F6. Esto muestra a que tiene acceso cada
// rol, que es lo que hay que poder comprobar hoy.
const SECCIONES = [
  { ruta: "/admin/contenido", nombre: "Contenido" },
  { ruta: "/admin/insumos", nombre: "Insumos" },
  { ruta: "/admin/clientes", nombre: "Clientes" },
  { ruta: "/admin/usuarios", nombre: "Usuarios" },
  { ruta: "/admin/auditoria", nombre: "Auditoría" },
  { ruta: "/admin/configuracion", nombre: "Configuración" },
] as const;

/**
 * Con Cache Components, leer la sesion (que sale de una cookie) ata el
 * renderizado a la peticion. Metiendolo en su propio componente dentro de un
 * `<Suspense>`, la cascara de la pagina se prerenderiza igual y solo esta parte
 * llega en streaming.
 */
export default function Panel() {
  return (
    <Suspense fallback={<CargandoPanel />}>
      <PanelAutenticado />
    </Suspense>
  );
}

function CargandoPanel() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-2xl flex-col gap-8 px-6 py-12">
      <p className="text-muted-foreground text-sm">Cargando el panel...</p>
    </main>
  );
}

async function PanelAutenticado() {
  // Se vuelve a comprobar aunque el proxy ya lo hizo: una Server Function se
  // resuelve como POST a esta misma ruta y podria quedar fuera del `matcher`.
  const sesion = await exigirAcceso("/admin");

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-2xl flex-col gap-8 px-6 py-12">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Panel de gestión</h1>
          <p className="text-muted-foreground text-sm">
            {sesion.correo} · {NOMBRE_DEL_ROL[sesion.rol]}
          </p>
        </div>
        <form action={cerrarSesion}>
          <Button type="submit" variant="outline" className="min-h-11">
            Cerrar sesión
          </Button>
        </form>
      </header>

      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-medium">Secciones disponibles para tu rol</h2>
        <ul className="flex flex-col gap-1.5">
          {SECCIONES.map(({ ruta, nombre }) => {
            const permitido = rolesConAcceso(ruta)?.includes(sesion.rol) ?? false;
            return (
              <li key={ruta} className="text-sm" data-seccion={nombre} data-permitido={permitido}>
                {permitido ? "✓" : "—"} {nombre}
                {permitido ? null : (
                  <span className="text-muted-foreground"> (sin acceso con tu rol)</span>
                )}
              </li>
            );
          })}
        </ul>
        <p className="text-muted-foreground text-sm">
          Las secciones se construyen en las fases siguientes.
        </p>
      </section>
    </main>
  );
}
