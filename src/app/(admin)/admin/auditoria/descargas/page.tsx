import { Suspense } from "react";

import { EncabezadoPanel } from "@/components/panel/encabezado-panel";
import { PestanasHistorial } from "@/components/panel/pestanas-historial";
import { exigirAcceso } from "@/lib/auth/sesion";
import { type Descarga, leerDescargas } from "@/lib/auditoria/datos";
import { formatearFechaLima } from "@/lib/panel/hora-lima";

const FORMATO: Readonly<Record<string, string>> = { xlsx: "Excel", pdf: "PDF" };

/** «12 clientes activos de Belén, en Excel». */
function queSeLlevo(d: Descarga): string {
  const cuantos = `${d.cantidad} ${d.cantidad === 1 ? "cliente" : "clientes"}`;
  const estado = d.estado ? ` ${d.cantidad === 1 ? d.estado.replace(/s$/, "") : d.estado}` : "";
  const zona = d.zona ? ` de ${d.zona}` : " de todas las zonas";
  return `${cuantos}${estado}${zona}, en ${FORMATO[d.formato] ?? d.formato}`;
}

export default function Descargas() {
  return (
    <>
      <EncabezadoPanel
        titulo="Historial"
        descripcion="Cada vez que alguien descargó la lista de clientes en un archivo: quién, cuándo y cuántos se llevó."
      />
      <PestanasHistorial activa="descargas" />
      <Suspense fallback={<p className="text-muted-foreground text-sm">Cargando…</p>}>
        <Lista />
      </Suspense>
    </>
  );
}

async function Lista() {
  await exigirAcceso("/admin/auditoria");
  const descargas = await leerDescargas();
  if (descargas === null) {
    return <p role="alert">No se pudieron cargar las descargas. Recarga la página.</p>;
  }
  if (descargas.length === 0) {
    return (
      <p className="bg-card rounded-xl border p-6 text-center">
        Nadie ha descargado la lista de clientes.
      </p>
    );
  }
  return (
    <ul aria-label="Descargas de la lista de clientes" className="flex flex-col gap-2">
      {descargas.map((d) => (
        <li
          key={d.id}
          data-descarga={d.id}
          className="bg-card flex flex-col gap-0.5 rounded-xl border p-3 wrap-anywhere"
        >
          <span>
            <strong className="font-semibold">{d.quien}</strong> descargó {queSeLlevo(d)}
          </span>
          <span className="text-muted-foreground text-sm">
            {formatearFechaLima(d.exportado_en)}
          </span>
        </li>
      ))}
    </ul>
  );
}
