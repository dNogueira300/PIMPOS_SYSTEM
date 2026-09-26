import { notFound } from "next/navigation";
import { Suspense } from "react";

import { ConfirmarBorrado } from "@/components/panel/confirmar-borrado";
import { EncabezadoPanel } from "@/components/panel/encabezado-panel";
import { retirarInsumo } from "@/lib/acciones/insumos";
import { exigirAcceso } from "@/lib/auth/sesion";
import { crearClienteServidor } from "@/lib/supabase/servidor";

import { datosDelFormulario } from "../../datos-formulario";
import { FormularioInsumo } from "../../formulario-insumo";

export default function EditarInsumo({ params }: PageProps<"/admin/insumos/[id]/editar">) {
  return (
    <Suspense fallback={<p className="text-muted-foreground text-sm">Cargando…</p>}>
      <Editor params={params} />
    </Suspense>
  );
}

async function Editor({ params }: { params: PageProps<"/admin/insumos/[id]/editar">["params"] }) {
  const { id } = await params;
  await exigirAcceso("/admin/insumos");
  const supabase = await crearClienteServidor();
  const [{ data }, { count }, datos] = await Promise.all([
    supabase
      .from("insumos")
      .select(
        "id, nombre, descripcion, unidad_base_id, presentacion, stock_minimo, es_perecible, proveedor_habitual_id, equivalencias(unidad_desde, unidad_hacia, factor)",
      )
      .eq("id", id)
      .is("deleted_at", null)
      .maybeSingle(),
    supabase
      .from("movimientos_insumo")
      .select("id", { count: "exact", head: true })
      .eq("insumo_id", id),
    datosDelFormulario(),
  ]);
  if (!data) notFound();

  const insumo = {
    ...data,
    stock_minimo: Number(data.stock_minimo),
    equivalencias: data.equivalencias
      .filter((e) => e.unidad_hacia === data.unidad_base_id)
      .map((e) => ({ unidad_desde_id: e.unidad_desde, factor: String(e.factor) })),
    tieneMovimientos: (count ?? 0) > 0,
  };

  return (
    <>
      <EncabezadoPanel
        titulo={data.nombre}
        volver={{ ruta: "/admin/insumos", nombre: "Insumos" }}
        accion={
          <ConfirmarBorrado
            nombre={`el insumo ${data.nombre}`}
            accion={retirarInsumo.bind(null, id)}
            aviso="Deja de aparecer en Existencias. Sus movimientos se conservan."
          />
        }
      />
      <FormularioInsumo insumo={insumo} {...datos} />
    </>
  );
}
