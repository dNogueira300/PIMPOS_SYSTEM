import { redirect } from "next/navigation";
import { Suspense } from "react";

import { EncabezadoPanel } from "@/components/panel/encabezado-panel";
import { exigirAcceso } from "@/lib/auth/sesion";
import { describirExistencia, presentacionPrincipal } from "@/lib/insumos/unidades";
import { crearClienteServidor } from "@/lib/supabase/servidor";

import { FormularioConteo } from "./formulario-conteo";

export default function Conteo() {
  return (
    <>
      <EncabezadoPanel
        titulo="Conteo físico"
        descripcion="Lo que hay de verdad en el almacén. También sirve para cargar el inventario inicial."
        volver={{ ruta: "/admin/insumos", nombre: "Insumos" }}
      />
      <Suspense fallback={<p className="text-muted-foreground text-sm">Cargando…</p>}>
        <Formulario />
      </Suspense>
    </>
  );
}

async function Formulario() {
  const sesion = await exigirAcceso("/admin/insumos/conteo");
  // Comodidad: la base ya lo niega (registrar_conteo). Aquí se evita enseñar
  // un formulario que va a fallar.
  if (sesion.rol !== "superadmin" && sesion.rol !== "administrador") {
    redirect("/admin/insumos");
  }
  const supabase = await crearClienteServidor();
  const [{ data: insumos }, { data: equivalencias }] = await Promise.all([
    supabase
      .from("existencias_insumo")
      .select("id, nombre, unidad_base, cantidad_base, es_perecible")
      .eq("activo", true)
      .order("nombre"),
    supabase
      .from("equivalencias")
      .select("insumo_id, factor, unidades_medida!unidad_desde(codigo)"),
  ]);

  const lista = (insumos ?? []).map((i) => ({
    id: i.id ?? "",
    nombre: i.nombre ?? "",
    unidad_base: i.unidad_base ?? "",
    es_perecible: i.es_perecible ?? false,
    hay: describirExistencia(
      Number(i.cantidad_base ?? 0),
      i.unidad_base ?? "",
      presentacionPrincipal(
        (equivalencias ?? [])
          .filter((e) => e.insumo_id === i.id && e.unidades_medida)
          .map((e) => ({ codigo: e.unidades_medida!.codigo, factor: Number(e.factor) })),
      ),
    ),
  }));

  return <FormularioConteo insumos={lista} />;
}
