import "server-only";

import type { InsumoParaLinea, UnidadDeLinea } from "@/lib/insumos/lineas";
import { crearClienteServidor } from "@/lib/supabase/servidor";

/**
 * Cada insumo con las unidades en que se puede registrar: su unidad base y
 * las de sus equivalencias. Así el selector de unidad nunca ofrece una que la
 * base rechazaría por falta de equivalencia.
 */
export async function insumosParaLineas(): Promise<InsumoParaLinea[]> {
  const supabase = await crearClienteServidor();
  const { data } = await supabase
    .from("insumos")
    .select(
      "id, nombre, es_perecible, base:unidades_medida!unidad_base_id(id, codigo, nombre), equivalencias(unidad:unidades_medida!unidad_desde(id, codigo, nombre))",
    )
    .eq("activo", true)
    .is("deleted_at", null)
    .order("nombre");

  return (data ?? []).map((i) => ({
    id: i.id,
    nombre: i.nombre,
    es_perecible: i.es_perecible,
    unidades: [i.base, ...i.equivalencias.map((e) => e.unidad)].filter(
      (u): u is UnidadDeLinea => u !== null,
    ),
  }));
}

export async function proveedoresActivos() {
  const supabase = await crearClienteServidor();
  const { data } = await supabase
    .from("proveedores")
    .select("id, nombre")
    .is("deleted_at", null)
    .order("nombre");
  return data ?? [];
}
