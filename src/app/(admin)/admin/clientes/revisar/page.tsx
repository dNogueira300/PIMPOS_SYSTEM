import { Suspense } from "react";

import { EncabezadoPanel } from "@/components/panel/encabezado-panel";
import { BorrarDatosCliente } from "@/components/panel/borrar-datos-cliente";
import { ListaAdaptable } from "@/components/panel/lista-adaptable";
import { exigirAcceso } from "@/lib/auth/sesion";
import { crearClienteServidor } from "@/lib/supabase/servidor";

import { BotonSigueCliente } from "./boton-sigue-cliente";

const FECHA = new Intl.DateTimeFormat("es-PE", { dateStyle: "long", timeZone: "America/Lima" });

export default function ClientesParaRevisar() {
  return (
    <>
      <EncabezadoPanel
        titulo="Clientes para revisar"
        descripcion="Sin cambios en dos años. Si sigue comprando, pulsa «Sigue siendo cliente». Si ya no, desactívalo desde su ficha o, si lo pidió, borra sus datos."
        volver={{ ruta: "/admin/clientes", nombre: "Clientes" }}
      />
      <Suspense fallback={<p className="text-muted-foreground text-sm">Cargando…</p>}>
        <Lista />
      </Suspense>
    </>
  );
}

async function Lista() {
  await exigirAcceso("/admin/clientes/revisar");
  const supabase = await crearClienteServidor();
  const { data, error } = await supabase
    .from("clientes_para_revisar")
    .select("id, nombre_completo, zona, ultima_actividad")
    .order("ultima_actividad");
  if (error) return <p role="alert">No se pudo cargar la lista. Recarga la página.</p>;
  const filas = data.map((c) => ({
    id: c.id ?? "",
    nombre: c.nombre_completo ?? "",
    zona: c.zona ?? "Sin zona",
    ultima: c.ultima_actividad ? FECHA.format(new Date(c.ultima_actividad)) : "—",
  }));
  return (
    <ListaAdaptable
      etiqueta="Clientes sin cambios en dos años"
      accionesDebajo
      filas={filas}
      enlace={(c) => `/admin/clientes/${c.id}`}
      editar={(c) => `/admin/clientes/${c.id}/editar`}
      columnas={[
        { titulo: "Cliente", celda: (c) => c.nombre, principal: true },
        { titulo: "Zona", celda: (c) => c.zona },
        { titulo: "Último cambio", celda: (c) => c.ultima },
      ]}
      acciones={(c) => (
        <>
          <BotonSigueCliente id={c.id} nombre={c.nombre} />
          <BorrarDatosCliente id={c.id} nombre={c.nombre} />
        </>
      )}
      vacio={
        <p>No hay clientes para revisar. Todos tuvieron algún cambio en los últimos dos años.</p>
      }
    />
  );
}
