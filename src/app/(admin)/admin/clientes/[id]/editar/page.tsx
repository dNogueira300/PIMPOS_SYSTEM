import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";

import { EncabezadoPanel } from "@/components/panel/encabezado-panel";
import { exigirAcceso } from "@/lib/auth/sesion";
import { leerFicha, zonasActivas } from "@/lib/clientes/datos";

import { FormularioCliente } from "../../formulario-cliente";

type Props = PageProps<"/admin/clientes/[id]/editar">;

export default function EditarCliente(props: Props) {
  return (
    <Suspense fallback={<p className="text-muted-foreground text-sm">Cargando…</p>}>
      <Contenido {...props} />
    </Suspense>
  );
}

async function Contenido({ params, searchParams }: Props) {
  const [{ id }, { pestana }, sesion] = await Promise.all([
    params,
    searchParams,
    exigirAcceso("/admin/clientes"),
  ]);
  // El repartidor corrige; no edita (decisión 2). Su lápiz ya lleva a «corregir».
  if (sesion.rol === "repartidor") redirect(`/admin/clientes/${id}/corregir`);
  const [cliente, zonas] = await Promise.all([leerFicha(id), zonasActivas()]);
  if (!cliente || cliente.borrado) notFound();
  // Si su zona se desactivó, se sigue ofreciendo para no cambiársela sin querer.
  const conSuZona =
    cliente.zona_id && !zonas.some((z) => z.id === cliente.zona_id)
      ? [...zonas, { id: cliente.zona_id, nombre: `${cliente.zona ?? "Zona"} (desactivada)` }]
      : zonas;
  return (
    <>
      <EncabezadoPanel
        titulo={`Editar: ${cliente.nombre_completo}`}
        volver={{ ruta: `/admin/clientes/${id}`, nombre: "Ficha" }}
      />
      <FormularioCliente
        cliente={cliente}
        zonas={conSuZona}
        textoPermiso=""
        pestana={typeof pestana === "string" ? pestana : undefined}
      />
    </>
  );
}
