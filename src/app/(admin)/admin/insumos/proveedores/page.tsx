import { Plus } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";

import { ConfirmarBorrado } from "@/components/panel/confirmar-borrado";
import { EncabezadoPanel } from "@/components/panel/encabezado-panel";
import { ListaAdaptable } from "@/components/panel/lista-adaptable";
import { retirarProveedor } from "@/lib/acciones/proveedores";
import { exigirAcceso } from "@/lib/auth/sesion";
import { crearClienteServidor } from "@/lib/supabase/servidor";

const RUTA = "/admin/insumos/proveedores";

export default function Proveedores() {
  return (
    <>
      <EncabezadoPanel
        titulo="Proveedores"
        volver={{ ruta: "/admin/insumos", nombre: "Insumos" }}
        accion={
          <Link href={`${RUTA}/nuevo`} className="boton-cta">
            <Plus aria-hidden className="size-5" /> Nuevo proveedor
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
  const { data, error } = await supabase
    .from("proveedores")
    .select("id, nombre, observacion")
    .is("deleted_at", null)
    .order("nombre");

  if (error) {
    return <p role="alert">No se pudieron cargar los proveedores. Recarga la página.</p>;
  }

  return (
    <ListaAdaptable
      etiqueta="Proveedores"
      filas={data}
      enlace={(p) => `${RUTA}/${p.id}`}
      columnas={[
        { titulo: "Nombre", celda: (p) => p.nombre, principal: true },
        { titulo: "Qué nos vende", celda: (p) => p.observacion ?? "" },
      ]}
      acciones={(p) => (
        <ConfirmarBorrado
          nombre={`el proveedor ${p.nombre}`}
          accion={retirarProveedor.bind(null, p.id)}
          aviso="Deja de aparecer al registrar compras. Sus compras anteriores se conservan."
        />
      )}
      vacio={<p>Todavía no hay proveedores. Crea el primero con «Nuevo proveedor».</p>}
    />
  );
}
