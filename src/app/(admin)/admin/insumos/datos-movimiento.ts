import "server-only";

import type { InsumoParaLinea, LoteDeLinea, UnidadDeLinea } from "@/lib/insumos/lineas";
import { formatearCantidad } from "@/lib/insumos/unidades";
import { crearClienteServidor } from "@/lib/supabase/servidor";

/**
 * Cada insumo con las unidades en que se puede registrar: su unidad base y
 * las de sus equivalencias. Así el selector de unidad nunca ofrece una que la
 * base rechazaría por falta de equivalencia.
 */
export async function insumosParaLineas({ conLotes = false }: { conLotes?: boolean } = {}): Promise<
  InsumoParaLinea[]
> {
  const supabase = await crearClienteServidor();
  const lotes = conLotes ? await lotesConExistencias() : new Map<string, LoteDeLinea[]>();
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
    ...(conLotes && i.es_perecible ? { lotes: lotes.get(i.id) ?? [] } : {}),
  }));
}

/**
 * Los lotes con existencias de cada insumo, en el orden en que salen (el que
 * vence primero, primero): «Vence 12/10/2026 · quedan 3 kg».
 */
async function lotesConExistencias(): Promise<Map<string, LoteDeLinea[]>> {
  const supabase = await crearClienteServidor();
  const { data } = await supabase
    .from("saldos_lote")
    .select(
      "cantidad_base, lote:lotes_insumo!inner(id, insumo_id, codigo, fecha_vencimiento, llegada, insumo:insumos!inner(unidad:unidades_medida!unidad_base_id(codigo)))",
    )
    .gt("cantidad_base", 0);

  const filas = (data ?? [])
    .filter((f) => f.lote !== null)
    .sort(
      (a, b) =>
        (a.lote.fecha_vencimiento ?? "9999").localeCompare(b.lote.fecha_vencimiento ?? "9999") ||
        Number(a.lote.llegada) - Number(b.lote.llegada),
    );
  const porInsumo = new Map<string, LoteDeLinea[]>();
  for (const f of filas) {
    const vence = f.lote.fecha_vencimiento
      ? `Vence ${f.lote.fecha_vencimiento.split("-").reverse().join("/")}`
      : "Sin fecha";
    const codigo = f.lote.codigo ? ` · lote ${f.lote.codigo}` : "";
    const quedan =
      `quedan ${formatearCantidad(Number(f.cantidad_base))} ${f.lote.insumo?.unidad?.codigo ?? ""}`.trim();
    const lista = porInsumo.get(f.lote.insumo_id) ?? [];
    lista.push({ id: f.lote.id, descripcion: `${vence}${codigo} · ${quedan}` });
    porInsumo.set(f.lote.insumo_id, lista);
  }
  return porInsumo;
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
