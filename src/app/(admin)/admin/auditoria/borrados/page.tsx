import Link from "next/link";
import { Suspense } from "react";

import { EncabezadoPanel } from "@/components/panel/encabezado-panel";
import { PestanasHistorial } from "@/components/panel/pestanas-historial";
import { exigirAcceso } from "@/lib/auth/sesion";
import { leerConstancias } from "@/lib/auditoria/datos";
import { formatearFechaLima } from "@/lib/panel/hora-lima";

export default function DatosBorrados() {
  return (
    <>
      <EncabezadoPanel
        titulo="Historial"
        descripcion="Los clientes que pidieron que se borren sus datos. De cada uno queda solo esta constancia: cuándo, quién lo hizo y por qué."
      />
      <PestanasHistorial activa="borrados" />
      <Suspense fallback={<p className="text-muted-foreground text-sm">Cargando…</p>}>
        <Lista />
      </Suspense>
    </>
  );
}

async function Lista() {
  await exigirAcceso("/admin/auditoria");
  const constancias = await leerConstancias();
  if (constancias === null) {
    return <p role="alert">No se pudieron cargar las constancias. Recarga la página.</p>;
  }
  if (constancias.length === 0) {
    return (
      <p className="bg-card rounded-xl border p-6 text-center">
        Ningún cliente ha pedido que se borren sus datos.
      </p>
    );
  }
  return (
    <ul aria-label="Constancias de borrado" className="flex flex-col gap-2">
      {constancias.map((c) => (
        <li key={c.id} className="bg-card flex flex-col gap-1 rounded-xl border p-3 wrap-anywhere">
          <span>
            <strong className="font-semibold">{c.quien}</strong> borró los datos de un cliente
          </span>
          <span>Motivo: {c.motivo}</span>
          <span className="text-muted-foreground text-sm">{formatearFechaLima(c.borrado_en)}</span>
          <Link href={`/admin/clientes/${c.cliente_id}`} className="boton-linea mt-1 w-fit">
            Ver la ficha
          </Link>
        </li>
      ))}
    </ul>
  );
}
