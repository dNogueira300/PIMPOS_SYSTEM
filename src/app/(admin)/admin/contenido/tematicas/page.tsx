import { Suspense } from "react";

import { EncabezadoPanel } from "@/components/panel/encabezado-panel";
import { ListaAdaptable } from "@/components/panel/lista-adaptable";
import { exigirAcceso } from "@/lib/auth/sesion";
import { hoyEnLima } from "@/lib/insumos/periodo";
import { crearClienteServidor } from "@/lib/supabase/servidor";
import { comoEncendido, describirEstado, diaYMes } from "@/lib/tematicas/estado";

const RUTA = "/admin/contenido/tematicas";

/**
 * Las temáticas de temporada (plan 08, T2). Las crean las migraciones —cada una
 * necesita su diseño en el código—, así que aquí no hay «Nueva temática»: se
 * ponen sus fechas, cómo se enciende, sus textos y sus productos.
 */
export default function Tematicas() {
  return (
    <>
      <EncabezadoPanel
        titulo="Temáticas de temporada"
        descripcion="El sitio se viste de fiesta en cada fecha y saca al frente lo de la temporada."
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
    .from("tematicas_panel")
    .select("id, slug, nombre, inicio, fin, activa, encendido_vigente, encendido_hasta")
    .order("inicio");
  if (error) {
    return <p role="alert">No se pudieron cargar las temáticas. Recarga la página.</p>;
  }

  const hoy = hoyEnLima(new Date());
  const filas = data.map((t) => ({
    id: t.id ?? "",
    slug: t.slug ?? "",
    nombre: t.nombre ?? "",
    fechas: t.inicio && t.fin ? `Del ${diaYMes(t.inicio)} al ${diaYMes(t.fin)}` : "",
    estado: describirEstado(
      {
        activa: t.activa ?? false,
        encendido_vigente: comoEncendido(t.encendido_vigente),
        inicio: t.inicio ?? "",
        fin: t.fin ?? "",
        encendido_hasta: t.encendido_hasta,
      },
      hoy,
    ),
  }));

  return (
    <ListaAdaptable
      etiqueta="Temáticas de temporada"
      filas={filas}
      enlace={(t) => `${RUTA}/${t.slug}`}
      editar={(t) => `${RUTA}/${t.slug}`}
      columnas={[
        { titulo: "Temática", celda: (t) => t.nombre, principal: true },
        { titulo: "Estado", celda: (t) => t.estado },
        { titulo: "Fechas", celda: (t) => t.fechas },
      ]}
      vacio={<p>Todavía no hay temáticas.</p>}
    />
  );
}
