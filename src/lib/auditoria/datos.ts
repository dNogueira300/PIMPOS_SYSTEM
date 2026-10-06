import "server-only";

import { crearClienteServidor } from "@/lib/supabase/servidor";

import { type Datos, HIJOS_DE, type Nombres, tablasVisibles } from "./catalogo";
import { type Filtros, limitesDelPeriodo } from "./filtros";
import { type Cambio, idsReferidos } from "./redactar";

const COLUMNAS =
  "id, tabla, registro_id, operacion, usuario_id, usuario_correo, usuario_nombre, rol, datos_antes, datos_despues, ocurrido_en";

type FilaDeLaVista = {
  id: number | null;
  tabla: string | null;
  registro_id: string | null;
  operacion: string | null;
  usuario_id: string | null;
  usuario_correo: string | null;
  usuario_nombre: string | null;
  rol: string | null;
  datos_antes: unknown;
  datos_despues: unknown;
  ocurrido_en: string | null;
};

const objeto = (v: unknown): Datos | null =>
  v !== null && typeof v === "object" && !Array.isArray(v) ? (v as Datos) : null;

/** Las columnas de una vista salen nullables en los tipos: se normalizan aquí (AGENTS.md). */
function aCambio(f: FilaDeLaVista): Cambio | null {
  if (f.id === null || !f.tabla || !f.ocurrido_en) return null;
  const operacion = f.operacion === "INSERT" || f.operacion === "DELETE" ? f.operacion : "UPDATE";
  return {
    id: f.id,
    tabla: f.tabla,
    registro_id: f.registro_id,
    operacion,
    usuario_id: f.usuario_id,
    usuario_nombre: f.usuario_nombre,
    usuario_correo: f.usuario_correo,
    rol: f.rol,
    datos_antes: objeto(f.datos_antes),
    datos_despues: objeto(f.datos_despues),
    ocurrido_en: f.ocurrido_en,
  };
}

/**
 * La lista de la pestaña Cambios. `null` si la base no respondió (la página lo
 * dice en vez de enseñar una lista vacía). Pide una fila de más para saber si
 * hay «Ver más» sin contar toda la tabla.
 */
export async function leerCambios(
  f: Filtros,
): Promise<{ cambios: Cambio[]; hayMas: boolean } | null> {
  const supabase = await crearClienteServidor();
  let consulta = supabase
    .from("auditoria")
    .select(COLUMNAS)
    .order("ocurrido_en", { ascending: false })
    .order("id", { ascending: false })
    .limit(f.ver + 1);

  if (f.registro) {
    // Lo suyo y lo que cuelga de él (sus presentaciones, sus movimientos, sus
    // fotos y permisos): ahí sí entran las tablas internas, como los lotes.
    const { campo } = HIJOS_DE[f.registro.de];
    const id = f.registro.id;
    consulta = consulta.or(
      `registro_id.eq.${id},datos_despues->>${campo}.eq.${id},datos_antes->>${campo}.eq.${id}`,
    );
  } else {
    consulta = consulta.in("tabla", tablasVisibles(f.seccion ?? undefined));
  }
  if (f.persona === "sistema") consulta = consulta.is("usuario_id", null);
  else if (f.persona) consulta = consulta.eq("usuario_id", f.persona);

  // «Borró» en el panel casi nunca es un DELETE: es la marca `deleted_at`.
  if (f.hizo === "creo") consulta = consulta.eq("operacion", "INSERT");
  if (f.hizo === "borro") {
    consulta = consulta.or(
      "operacion.eq.DELETE,and(operacion.eq.UPDATE,datos_despues->>deleted_at.not.is.null,datos_antes->>deleted_at.is.null)",
    );
  }
  if (f.hizo === "cambio") {
    consulta = consulta
      .eq("operacion", "UPDATE")
      .or("datos_despues->>deleted_at.is.null,datos_antes->>deleted_at.not.is.null");
  }
  if (f.periodo) {
    const { desde, hasta } = limitesDelPeriodo(f.periodo);
    consulta = consulta.gte("ocurrido_en", desde).lt("ocurrido_en", hasta);
  }

  const { data, error } = await consulta;
  if (error) {
    console.error("[historial] cambios:", error.message);
    return null;
  }
  const cambios = (data as FilaDeLaVista[]).map(aCambio).filter((c): c is Cambio => c !== null);
  return { cambios: cambios.slice(0, f.ver), hayMas: cambios.length > f.ver };
}

/** Un cambio por su número. También los de tablas internas: es el detalle técnico. */
export async function leerCambio(id: number): Promise<Cambio | null> {
  const supabase = await crearClienteServidor();
  const { data, error } = await supabase
    .from("auditoria")
    .select(COLUMNAS)
    .eq("id", id)
    .maybeSingle();
  if (error) console.error("[historial] cambio:", error.message);
  return data ? aCambio(data as FilaDeLaVista) : null;
}

/**
 * Los nombres de lo que estas filas señalan (un movimiento guarda el id del
 * insumo, no su nombre). Una consulta por tabla, con todos los ids de la
 * página: los uuid no se repiten entre tablas, así que caben en un solo mapa.
 * Lo que ya no existe no sale en el mapa, y el redactor dice «ya no existe».
 */
export async function resolverNombres(cambios: readonly Cambio[]): Promise<Nombres> {
  const ids = idsReferidos(cambios);
  if (ids.length === 0) return {};
  const supabase = await crearClienteServidor();
  const [
    insumos,
    productos,
    variantes,
    clientes,
    zonas,
    categorias,
    proveedores,
    unidades,
    almacenes,
    personas,
  ] = await Promise.all([
    supabase.from("insumos").select("id, nombre").in("id", ids),
    supabase.from("productos").select("id, nombre").in("id", ids),
    supabase.from("producto_variantes").select("id, nombre").in("id", ids),
    supabase.from("clientes").select("id, nombre:nombre_completo").in("id", ids),
    supabase.from("zonas_reparto").select("id, nombre").in("id", ids),
    supabase.from("categorias_producto").select("id, nombre").in("id", ids),
    supabase.from("proveedores").select("id, nombre").in("id", ids),
    supabase.from("unidades_medida").select("id, nombre:codigo").in("id", ids),
    supabase.from("almacenes").select("id, nombre").in("id", ids),
    supabase.from("perfiles").select("id, nombre:nombre_completo").in("id", ids),
  ]);
  const nombres: Record<string, string> = {};
  for (const { data } of [
    insumos,
    productos,
    variantes,
    clientes,
    zonas,
    categorias,
    proveedores,
    unidades,
    almacenes,
    personas,
  ]) {
    for (const fila of data ?? []) if (fila.nombre) nombres[fila.id] = fila.nombre;
  }
  return nombres;
}

/** Las personas del panel, para el filtro. La administración lee todos los perfiles. */
export async function personasDelPanel(): Promise<{ id: string; nombre: string }[]> {
  const supabase = await crearClienteServidor();
  const { data } = await supabase
    .from("perfiles")
    .select("id, nombre_completo")
    .order("nombre_completo");
  return (data ?? []).map((p) => ({ id: p.id, nombre: p.nombre_completo ?? "Sin nombre" }));
}

export type Ingreso = {
  ocurrido_en: string;
  accion: "ingreso" | "salida";
  usuario_id: string | null;
  quien: string;
};

/** Sin periodo («Siempre»), la función igual pide dos instantes. */
const SIEMPRE = { desde: "2000-01-01T00:00:00.000Z", hasta: "2100-01-01T00:00:00.000Z" };

/** Quién entró y quién salió. La función (0045) devuelve como mucho 500, lo más reciente primero. */
export async function leerIngresos(f: Filtros): Promise<Ingreso[] | null> {
  const supabase = await crearClienteServidor();
  const { desde, hasta } = f.periodo ? limitesDelPeriodo(f.periodo) : SIEMPRE;
  const { data, error } = await supabase.rpc("ingresos_al_sistema", {
    p_desde: desde,
    p_hasta: hasta,
    // «El sistema» no entra ni sale: ese filtro aquí no existe.
    ...(f.persona && f.persona !== "sistema" ? { p_usuario: f.persona } : {}),
  });
  if (error) {
    console.error("[historial] ingresos:", error.message);
    return null;
  }
  return (data ?? []).map((i) => ({
    ocurrido_en: i.ocurrido_en,
    accion: i.accion === "salida" ? "salida" : "ingreso",
    usuario_id: i.usuario_id,
    quien: i.nombre?.trim() || i.correo?.trim() || "Alguien que ya no tiene cuenta",
  }));
}

export type Constancia = {
  id: string;
  cliente_id: string;
  borrado_en: string;
  motivo: string;
  quien: string;
};

/** Las constancias de borrado de datos de clientes. Son pocas: van todas, hasta 200. */
export async function leerConstancias(): Promise<Constancia[] | null> {
  const supabase = await crearClienteServidor();
  const { data, error } = await supabase
    .from("constancias_de_borrado")
    .select("id, cliente_id, borrado_en, motivo, borrado_por_nombre")
    .order("borrado_en", { ascending: false })
    .limit(200);
  if (error) {
    console.error("[historial] constancias:", error.message);
    return null;
  }
  return (data ?? []).flatMap((c) =>
    c.id && c.cliente_id && c.borrado_en
      ? [
          {
            id: c.id,
            cliente_id: c.cliente_id,
            borrado_en: c.borrado_en,
            motivo: c.motivo ?? "",
            quien: c.borrado_por_nombre?.trim() || "Alguien que ya no tiene cuenta",
          },
        ]
      : [],
  );
}

export type Descarga = {
  id: string;
  exportado_en: string;
  quien: string;
  formato: string;
  cantidad: number;
  zona: string | null;
  estado: string | null;
};

/** Las descargas de la lista de clientes. Hasta 200, lo más reciente primero. */
export async function leerDescargas(): Promise<Descarga[] | null> {
  const supabase = await crearClienteServidor();
  const { data, error } = await supabase
    .from("descargas_de_clientes")
    .select("id, exportado_en, exportado_por_nombre, formato, cantidad, zona, estado")
    .order("exportado_en", { ascending: false })
    .limit(200);
  if (error) {
    console.error("[historial] descargas:", error.message);
    return null;
  }
  return (data ?? []).flatMap((d) =>
    d.id && d.exportado_en
      ? [
          {
            id: d.id,
            exportado_en: d.exportado_en,
            quien: d.exportado_por_nombre?.trim() || "Alguien que ya no tiene cuenta",
            formato: d.formato ?? "",
            cantidad: d.cantidad ?? 0,
            zona: d.zona,
            estado: d.estado,
          },
        ]
      : [],
  );
}

/** Los últimos cambios, sin tablas internas, para el inicio del panel. */
export async function ultimosCambios(cuantos: number): Promise<Cambio[]> {
  const resultado = await leerCambios({
    persona: null,
    seccion: null,
    hizo: null,
    cuando: "todo",
    periodo: null,
    registro: null,
    ver: cuantos,
  });
  return resultado?.cambios ?? [];
}
