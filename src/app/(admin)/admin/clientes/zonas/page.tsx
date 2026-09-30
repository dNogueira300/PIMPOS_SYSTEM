import { Plus } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";

import { BotonesOrden } from "@/components/panel/botones-orden";
import { EncabezadoPanel } from "@/components/panel/encabezado-panel";
import { ListaAdaptable } from "@/components/panel/lista-adaptable";
import { moverFila } from "@/lib/acciones/orden";
import { exigirAcceso } from "@/lib/auth/sesion";
import { crearClienteServidor } from "@/lib/supabase/servidor";

import { BotonActivaZona } from "./boton-activa-zona";

const RUTA = "/admin/clientes/zonas";

export default function Zonas() {
  return (
    <>
      <EncabezadoPanel
        titulo="Zonas de reparto"
        descripcion="Las que se ofrecen al registrar un cliente. Una zona con clientes activos no se puede retirar."
        volver={{ ruta: "/admin/clientes", nombre: "Clientes" }}
        accion={
          <Link href={`${RUTA}/nueva`} className="boton-cta">
            <Plus aria-hidden className="size-5" /> Nueva zona
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
    .from("zonas_reparto")
    .select("id, nombre, activo, orden, clientes(count)")
    .is("deleted_at", null)
    .eq("clientes.activo", true)
    .is("clientes.deleted_at", null)
    .order("orden")
    .order("id");
  if (error) return <p role="alert">No se pudieron cargar las zonas. Recarga la página.</p>;

  const filas = data.map((z) => ({ ...z, clientes: z.clientes[0]?.count ?? 0 }));
  return (
    <ListaAdaptable
      etiqueta="Zonas de reparto"
      filas={filas}
      enlace={(z) => `${RUTA}/${z.id}`}
      editar={(z) => `${RUTA}/${z.id}`}
      columnas={[
        { titulo: "Zona", celda: (z) => z.nombre, principal: true },
        { titulo: "Clientes activos", celda: (z) => String(z.clientes) },
        { titulo: "Estado", celda: (z) => (z.activo ? "Activa" : "Retirada") },
      ]}
      acciones={(z) => (
        <>
          <BotonesOrden
            nombre={`la zona ${z.nombre}`}
            subir={moverFila.bind(null, "zonas_reparto", z.id, "arriba")}
            bajar={moverFila.bind(null, "zonas_reparto", z.id, "abajo")}
            primero={z.id === filas[0]?.id}
            ultimo={z.id === filas.at(-1)?.id}
          />
          <BotonActivaZona id={z.id} nombre={z.nombre} activa={z.activo} />
        </>
      )}
      vacio={<p>No hay zonas. Crea la primera con «Nueva zona».</p>}
    />
  );
}
