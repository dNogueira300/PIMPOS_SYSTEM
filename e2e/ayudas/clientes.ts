import { supabaseLocal } from "./supabase-local";
import { sesionDeApi } from "./insumos";

/**
 * Un cliente real, con su permiso, registrado por un ingeniero por la API
 * (`registrar_cliente`, 0042). Devuelve su id.
 */
export async function crearClienteDePrueba(
  datos: Partial<{
    nombre: string;
    celular: string;
    zona: string;
    latitud: number;
    longitud: number;
  }> = {},
): Promise<string> {
  const ingeniero = await sesionDeApi("ingeniero");
  const { data: zona } = await ingeniero
    .from("zonas_reparto")
    .select("id")
    .eq("nombre", datos.zona ?? "Belén")
    .single();
  const { data, error } = await ingeniero.rpc("registrar_cliente", {
    p_cliente: {
      nombre_completo: datos.nombre ?? `Cliente E2E ${Date.now()}`,
      celular: datos.celular ?? `9${String(Date.now()).slice(-8)}`,
      direccion: "Jirón Próspero 100",
      referencia: "Portón verde",
      zona_id: zona!.id,
      ...(datos.latitud !== undefined ? { latitud: datos.latitud, longitud: datos.longitud } : {}),
    },
    p_version_texto: "v1-2026-10",
  });
  if (error) throw new Error(`No se pudo crear el cliente de prueba: ${error.message}`);
  return data as string;
}

/** Borrado físico con la service_role local (no hay política de delete, a propósito). */
export async function borrarClienteDePrueba(id: string): Promise<void> {
  const { apiUrl, serviceRoleKey } = supabaseLocal();
  const cabeceras = { apikey: serviceRoleKey, Authorization: `Bearer ${serviceRoleKey}` };
  // Storage no borra carpetas: se listan los archivos de la del cliente y se
  // borran por nombre. Es limpieza: si falla, no rompe la prueba.
  const lista = await fetch(`${apiUrl}/storage/v1/object/list/clientes`, {
    method: "POST",
    headers: { ...cabeceras, "Content-Type": "application/json" },
    body: JSON.stringify({ prefix: `${id}/`, limit: 100 }),
  });
  const archivos = lista.ok ? ((await lista.json()) as { name: string }[]) : [];
  if (archivos.length > 0) {
    await fetch(`${apiUrl}/storage/v1/object/clientes`, {
      method: "DELETE",
      headers: { ...cabeceras, "Content-Type": "application/json" },
      body: JSON.stringify({ prefixes: archivos.map((a) => `${id}/${a.name}`) }),
    });
  }
  // La constancia de un borrado a pedido (0043, T5) no deja borrar al cliente.
  await fetch(`${apiUrl}/rest/v1/supresiones?cliente_id=eq.${id}`, {
    method: "DELETE",
    headers: cabeceras,
  });
  const r = await fetch(`${apiUrl}/rest/v1/clientes?id=eq.${id}`, {
    method: "DELETE",
    headers: cabeceras,
  });
  if (!r.ok)
    throw new Error(`No se pudo borrar el cliente de prueba: ${r.status} ${await r.text()}`);
}
