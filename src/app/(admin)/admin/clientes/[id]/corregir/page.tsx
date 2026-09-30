import { notFound } from "next/navigation";
import { Suspense } from "react";

import { EncabezadoPanel } from "@/components/panel/encabezado-panel";
import { exigirAcceso } from "@/lib/auth/sesion";
import { leerFicha } from "@/lib/clientes/datos";

import { FormularioCorreccion } from "./formulario-correccion";

type Props = PageProps<"/admin/clientes/[id]/corregir">;

export default function CorregirCliente({ params }: Props) {
  return (
    <Suspense fallback={<p className="text-muted-foreground text-sm">Cargando…</p>}>
      <Contenido params={params} />
    </Suspense>
  );
}

async function Contenido({ params }: Pick<Props, "params">) {
  const [{ id }, sesion] = await Promise.all([params, exigirAcceso("/admin/clientes")]);
  const cliente = await leerFicha(id);
  if (!cliente || cliente.borrado) notFound();
  return (
    <>
      <EncabezadoPanel
        titulo={`Corregir: ${cliente.nombre_completo}`}
        descripcion="La referencia, el punto en el mapa y las fotos. El nombre y el celular los cambia un encargado."
        volver={{ ruta: `/admin/clientes/${id}`, nombre: "Ficha" }}
      />
      <FormularioCorreccion cliente={cliente} puedeQuitarFotos={sesion.rol !== "repartidor"} />
    </>
  );
}
