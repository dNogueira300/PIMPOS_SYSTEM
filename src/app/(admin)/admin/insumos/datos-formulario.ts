import "server-only";

import type { UnidadOpcion } from "@/components/panel/editor-equivalencias";
import { crearClienteServidor } from "@/lib/supabase/servidor";

export async function datosDelFormulario() {
  const supabase = await crearClienteServidor();
  const [{ data: unidades }, { data: proveedores }] = await Promise.all([
    supabase.from("unidades_medida").select("id, codigo, nombre, es_base").order("nombre"),
    supabase.from("proveedores").select("id, nombre").is("deleted_at", null).order("nombre"),
  ]);
  const todas: (UnidadOpcion & { es_base: boolean })[] = unidades ?? [];
  return {
    unidadesBase: todas.filter((u) => u.es_base),
    unidadesCompra: todas,
    proveedores: proveedores ?? [],
  };
}
