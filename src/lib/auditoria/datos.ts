import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { crearClienteServidor } from "@/lib/supabase/servidor";

import { type Datos, HIJOS_DE, type Nombres, tablasVisibles } from "./catalogo";
import { type Filtros, limitesDelPeriodo } from "./filtros";
import { type Cambio, delMismoGuardado, enLineas, enTandas, idsPorTabla } from "./redactar";

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

const LOTES_EN_EL_HISTORIAL = 100;
const FILAS_DE_MARGEN = 50;

/**
 * La lista de la pestaña Cambios. `null` si la base no respondió (la página lo
 * dice en vez de enseñar una lista vacía). Pide una fila de más para saber si
 * hay «Ver más» sin contar toda la tabla.
 */
export async function leerCambios(
  f: Filtros,
): Promise<{ cambios: Cambio[]; hayMas: boolean } | null> {
  const supabase = await crearClienteServidor();
  // Se piden más filas que líneas: un guardado deja varias filas y muchas no
  // cambian nada (ver `enLineas`). Nunca más de 1000, el tope de PostgREST.
  const tope = Math.min(f.ver * 4 + FILAS_DE_MARGEN, 1000);
  let consulta = supabase
    .from("auditoria")
    .select(COLUMNAS)
    .order("ocurrido_en", { ascending: false })
    .order("id", { ascending: false })
    .limit(tope);

  if (f.registro) {
    // Lo suyo y lo que cuelga de él (sus presentaciones, sus movimientos, sus
    // fotos y permisos): ahí sí entran las tablas internas, como los lotes.
    const { campo } = HIJOS_DE[f.registro.de];
    const id = f.registro.id;
    const condiciones = [
      `registro_id.eq.${id}`,
      `datos_despues->>${campo}.eq.${id}`,
      `datos_antes->>${campo}.eq.${id}`,
    ];
    if (f.registro.de === "insumo") {
      // El reparto de cada movimiento entre lotes no guarda el insumo, guarda
      // el lote: se busca por los lotes de este insumo. Los 100 más recientes
      // (van en la dirección de la consulta); son ids de la base, no de la URL.
      const { data: lotes, error } = await supabase
        .from("lotes_insumo")
        .select("id")
        .eq("insumo_id", id)
        .order("llegada", { ascending: false })
        .limit(LOTES_EN_EL_HISTORIAL);
      if (error) console.error("[historial] lotes del insumo:", error.message);
      if (lotes && lotes.length > 0) {
        condiciones.push(`datos_despues->>lote_id.in.(${lotes.map((l) => l.id).join(",")})`);
      }
    }
    consulta = consulta.or(condiciones.join(","));
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
  const filas = (data as FilaDeLaVista[]).map(aCambio).filter((c): c is Cambio => c !== null);
  return enLineas(filas, f.ver, tope);
}

/**
 * Un cambio por su número. También los de tablas internas: es el detalle
 * técnico. `null` es «no existe»; `"error"`, que la base no respondió: la
 * página no puede decir «no encontramos esta página» de algo que sí está.
 */
export async function leerCambio(id: number): Promise<Cambio | null | "error"> {
  const supabase = await crearClienteServidor();
  const { data, error } = await supabase
    .from("auditoria")
    .select(COLUMNAS)
    .eq("id", id)
    .maybeSingle();
  if (error) {
    console.error("[historial] cambio:", error.message);
    return "error";
  }
  return data ? aCambio(data as FilaDeLaVista) : null;
}

/**
 * El cambio como lo enseña el detalle: junto con las demás filas que dejó el
 * mismo «Guardar» sobre ese registro (ver `delMismoGuardado`). Si la consulta
 * falla, la fila sola: es lo que había antes.
 */
export async function leerGuardado(c: Cambio): Promise<{ cambio: Cambio; filas: number[] }> {
  if (c.operacion !== "UPDATE" || c.registro_id === null) return { cambio: c, filas: [c.id] };
  const supabase = await crearClienteServidor();
  const { data, error } = await supabase
    .from("auditoria")
    .select(COLUMNAS)
    .eq("tabla", c.tabla)
    .eq("registro_id", c.registro_id)
    .eq("ocurrido_en", c.ocurrido_en)
    .eq("operacion", "UPDATE")
    .limit(20);
  if (error) console.error("[historial] guardado:", error.message);
  const filas = ((data ?? []) as FilaDeLaVista[])
    .map(aCambio)
    .filter((f): f is Cambio => f !== null);
  return delMismoGuardado(c, filas);
}

/**
 * ¿Sigue existiendo el registro al que llevaría «Ir a donde se hizo»? Lo que se
 * borró desde el panel sigue en su tabla con `deleted_at`: eso cuenta como que
 * ya no está. Si la consulta falla se responde que sí: mejor un botón de más
 * que esconderlo por un fallo pasajero.
 */
export async function existeDestino(destino: { tabla: string; id: string }): Promise<boolean> {
  if (!Object.hasOwn(COLUMNA_DEL_NOMBRE, destino.tabla)) return true;
  const supabase = await crearClienteServidor();
  const { data, error } = await (supabase as unknown as SupabaseClient)
    .from(destino.tabla)
    .select("*")
    .eq("id", destino.id)
    .maybeSingle();
  if (error) {
    console.error(`[historial] destino en ${destino.tabla}:`, error.message);
    return true;
  }
  const fila = data as Record<string, unknown> | null;
  return fila !== null && (fila.deleted_at === null || fila.deleted_at === undefined);
}

/** De qué columna sale el nombre en cada tabla a la que una fila puede señalar. */
const COLUMNA_DEL_NOMBRE: Readonly<Record<string, string>> = {
  insumos: "nombre",
  productos: "nombre",
  producto_variantes: "nombre",
  clientes: "nombre_completo",
  zonas_reparto: "nombre",
  categorias_producto: "nombre",
  proveedores: "nombre",
  unidades_medida: "codigo",
  almacenes: "nombre",
  // Un lote no tiene nombre: el suyo es el de su insumo.
  lotes_insumo: "insumos(nombre)",
  perfiles: "nombre_completo",
};

/** PostgREST recibe los ids en la dirección: con más de ~200 responde 414. */
const IDS_POR_CONSULTA = 100;

/**
 * Los nombres de lo que estas filas señalan (un movimiento guarda el id del
 * insumo, no su nombre). Cada id se busca solo en la tabla de su campo, en
 * tandas, y `ademas` añade ids sueltos (el dueño de un «Ver historial»). Lo
 * que ya no existe no sale en el mapa, y el redactor dice «ya no existe»; por
 * eso un fallo de la consulta se deja en el registro: sin él, la lista
 * afirmaría que todo dejó de existir.
 */
export async function resolverNombres(
  cambios: readonly Cambio[],
  ademas: Readonly<Record<string, readonly string[]>> = {},
): Promise<Nombres> {
  const porTabla: Record<string, string[]> = idsPorTabla(cambios);
  for (const [tabla, ids] of Object.entries(ademas)) {
    porTabla[tabla] = [...new Set([...(porTabla[tabla] ?? []), ...ids])];
  }
  const consultas: { tabla: string; columna: string; ids: string[] }[] = [];
  for (const [tabla, ids] of Object.entries(porTabla)) {
    const columna = COLUMNA_DEL_NOMBRE[tabla];
    if (!columna) continue;
    for (const tanda of enTandas(ids, IDS_POR_CONSULTA)) {
      consultas.push({ tabla, columna, ids: tanda });
    }
  }
  if (consultas.length === 0) return {};

  const supabase = await crearClienteServidor();
  const nombres: Record<string, string> = {};
  await Promise.all(
    consultas.map(async ({ tabla, columna, ids }) => {
      // La tabla y la columna salen de la lista cerrada de arriba, nunca de la
      // dirección; el cliente tipado no admite un nombre de tabla variable.
      const { data, error } = await (supabase as unknown as SupabaseClient)
        .from(tabla)
        .select(`id, ${columna}`)
        .in("id", ids);
      if (error) {
        console.error(`[historial] nombres de ${tabla}:`, error.message);
        return;
      }
      for (const fila of (data ?? []) as unknown as Record<string, unknown>[]) {
        // `insumos(nombre)` llega como un objeto anidado: `{ insumos: { nombre } }`.
        const [propia, anidada] = columna.replace(")", "").split("(");
        const valor = fila[propia ?? columna];
        const nombre =
          anidada && valor !== null && typeof valor === "object"
            ? (valor as Record<string, unknown>)[anidada]
            : valor;
        if (typeof fila.id === "string" && typeof nombre === "string" && nombre) {
          nombres[fila.id] = nombre;
        }
      }
    }),
  );
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
