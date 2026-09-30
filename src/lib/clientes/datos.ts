import "server-only";

import { crearClienteServidor } from "@/lib/supabase/servidor";

/** Las fotos del bucket privado se sirven por URL firmada, 10 minutos (Global Constraints). */
export const SEGUNDOS_URL_FIRMADA = 600;

export type ClienteDeLista = {
  id: string;
  nombre_completo: string;
  celular: string;
  direccion: string;
  referencia: string | null;
  zona_id: string | null;
  zona: string | null;
  latitud: number | null;
  longitud: number | null;
  activo: boolean;
};

export type FotoCliente = { id: string; orden: number; ruta: string; url: string | null };

export type FichaCliente = ClienteDeLista & {
  observacion: string | null;
  fotos: FotoCliente[];
  permiso: { texto_version: string; otorgado_en: string; registrado_por: string } | null;
  borrado: boolean;
};

const numero = (v: unknown) => (v === null || v === undefined ? null : Number(v));

/** `null` si la base no respondió: la página lo dice en vez de enseñar una lista vacía. */
export async function buscarClientes(f: {
  texto?: string;
  zona?: string;
  activos?: boolean;
}): Promise<ClienteDeLista[] | null> {
  const supabase = await crearClienteServidor();
  const { data, error } = await supabase.rpc("buscar_clientes", {
    p_texto: f.texto?.trim() || undefined,
    p_zona: f.zona || undefined,
    p_activos: f.activos ?? true,
  });
  if (error) {
    console.error("[clientes] buscar:", error.message);
    return null;
  }
  return data.map((c) => ({
    id: c.id,
    nombre_completo: c.nombre_completo,
    celular: c.celular,
    direccion: c.direccion,
    referencia: c.referencia,
    zona_id: c.zona_id,
    zona: c.zona,
    latitud: numero(c.latitud),
    longitud: numero(c.longitud),
    activo: c.activo,
  }));
}

export async function leerFicha(id: string): Promise<FichaCliente | null> {
  const supabase = await crearClienteServidor();
  const [{ data: c }, { data: fotos }, { data: permiso }, { data: supresion }] = await Promise.all([
    supabase
      .from("clientes")
      .select(
        "id, nombre_completo, celular, direccion, referencia, zona_id, latitud, longitud, observacion, activo, zonas_reparto(nombre)",
      )
      .eq("id", id)
      .is("deleted_at", null)
      .maybeSingle(),
    supabase.from("cliente_fotos").select("id, orden, ruta").eq("cliente_id", id).order("orden"),
    supabase.rpc("permiso_de_cliente", { p_cliente: id }).maybeSingle(),
    supabase.from("supresiones").select("id").eq("cliente_id", id).maybeSingle(),
  ]);
  if (!c) return null;

  const rutas = (fotos ?? []).map((f) => f.ruta);
  const { data: firmadas } = rutas.length
    ? await supabase.storage.from("clientes").createSignedUrls(rutas, SEGUNDOS_URL_FIRMADA)
    : { data: [] };
  const urlDe = new Map((firmadas ?? []).map((f) => [f.path, f.signedUrl]));

  return {
    id: c.id,
    nombre_completo: c.nombre_completo,
    celular: c.celular,
    direccion: c.direccion,
    referencia: c.referencia,
    zona_id: c.zona_id,
    zona: c.zonas_reparto?.nombre ?? null,
    latitud: numero(c.latitud),
    longitud: numero(c.longitud),
    observacion: c.observacion,
    activo: c.activo,
    fotos: (fotos ?? []).map((f) => ({ ...f, url: urlDe.get(f.ruta) ?? null })),
    permiso: permiso ?? null,
    // La administración ve la constancia; los demás, la ficha tachada por su nombre.
    borrado: Boolean(supresion) || c.nombre_completo === "Datos borrados a pedido del cliente",
  };
}

export async function zonasActivas(): Promise<{ id: string; nombre: string }[]> {
  const supabase = await crearClienteServidor();
  const { data } = await supabase
    .from("zonas_reparto")
    .select("id, nombre")
    .eq("activo", true)
    .is("deleted_at", null)
    .order("orden")
    .order("nombre");
  return data ?? [];
}
