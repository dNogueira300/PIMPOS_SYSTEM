import { formatearCantidad, nombreDeUnidad } from "@/lib/insumos/unidades";

import {
  esDeControl,
  esIdSinNombre,
  escribirValor,
  etiquetaDe,
  recortar,
  senalaAOtro,
  tablaQueSenala,
} from "./campos";
import { type Datos, infoDeTabla, type Nombres } from "./catalogo";

/** Una fila de `public.auditoria`, ya sin nulos donde no puede haberlos. */
export type Cambio = {
  id: number;
  tabla: string;
  registro_id: string | null;
  operacion: "INSERT" | "UPDATE" | "DELETE";
  usuario_id: string | null;
  usuario_nombre: string | null;
  usuario_correo: string | null;
  rol: string | null;
  datos_antes: Datos | null;
  datos_despues: Datos | null;
  ocurrido_en: string;
};

export type Diferencia = { campo: string; etiqueta: string; antes: string; despues: string };

/** Cuánto de un valor cabe en la frase de la lista. El detalle lo enseña entero. */
const LARGO_EN_FRASE = 40;

/**
 * `borrar_datos_cliente` (0043) deja en el registro `{"borrado": true}` en
 * lugar de los datos del cliente. No hay nada que comparar ni que nombrar.
 */
const tachado = (d: Datos | null): boolean =>
  d !== null && d.borrado === true && Object.keys(d).length === 1;

const distinto = (a: unknown, b: unknown): boolean => JSON.stringify(a) !== JSON.stringify(b);

const vacio = (v: unknown): boolean =>
  v === null || v === undefined || (typeof v === "string" && v.trim() === "");

/** Quién lo hizo. Nunca «null»: sin nombre, el correo; sin nadie, el sistema. */
export function quien(c: Cambio): string {
  if (c.usuario_nombre?.trim()) return c.usuario_nombre.trim();
  if (c.usuario_correo?.trim()) return c.usuario_correo.trim();
  return c.usuario_id ? "Alguien cuya cuenta ya no existe" : "El sistema";
}

/** Lo que cambió, campo a campo, ya escrito para una persona. */
export function diferencias(c: Cambio, nombres: Nombres): Diferencia[] {
  if (tachado(c.datos_antes) || tachado(c.datos_despues)) return [];
  const antes = c.datos_antes ?? {};
  const despues = c.datos_despues ?? {};
  const campos = [...new Set([...Object.keys(antes), ...Object.keys(despues)])];
  return campos
    .filter((campo) => !esDeControl(campo) && !esIdSinNombre(campo))
    .filter((campo) =>
      c.operacion === "UPDATE"
        ? distinto(antes[campo], despues[campo])
        : // En un alta o una eliminación, lo que no tiene valor no es noticia.
          !vacio(c.operacion === "INSERT" ? despues[campo] : antes[campo]),
    )
    .map((campo) => ({
      campo,
      etiqueta: etiquetaDe(campo),
      antes: c.operacion === "INSERT" ? "—" : escribirValor(campo, antes[campo], nombres),
      despues: c.operacion === "DELETE" ? "—" : escribirValor(campo, despues[campo], nombres),
    }));
}

/** «50 kg de Harina», de una fila que lleva `cantidad`, `unidad_id` e `insumo_id`. */
function cantidadDeInsumo(d: Datos, nombres: Nombres): { cuanto: string; insumo: string } {
  const cantidad = Number(d.cantidad);
  const unidad = nombres[String(d.unidad_id)] ?? "";
  const cuanto = Number.isFinite(cantidad)
    ? `${formatearCantidad(cantidad)} ${unidad ? nombreDeUnidad(unidad, cantidad) : ""}`.trim()
    : "una cantidad";
  return { cuanto, insumo: nombres[String(d.insumo_id)] ?? "un insumo que ya no existe" };
}

function movimiento(d: Datos, nombres: Nombres): string {
  const { cuanto, insumo } = cantidadDeInsumo(d, nombres);
  switch (d.tipo) {
    case "ingreso":
      return `registró un ingreso de ${cuanto} de ${insumo}`;
    case "consumo":
      return `registró un consumo de ${cuanto} de ${insumo}`;
    case "baja":
      return `registró una baja de ${cuanto} de ${insumo}`;
    case "ajuste":
      return `ajustó por conteo ${insumo}: ${Number(d.sentido) < 0 ? "−" : "+"}${cuanto}`;
    case "anulacion":
      return `anuló un movimiento de ${insumo}`;
    default:
      return `registró un movimiento de ${insumo}`;
  }
}

/**
 * Qué hizo, sin el sujeto: «cambió el producto Pan francés (2 datos)». Las
 * reglas van de lo más concreto a lo más general, y lo que no encaja en
 * ninguna se dice de forma genérica. Nunca lanza.
 */
export function accion(c: Cambio, nombres: Nombres): string {
  if (tachado(c.datos_antes) || tachado(c.datos_despues)) {
    return "hizo un cambio en un cliente cuyos datos se borraron a pedido";
  }
  const tabla = c.tabla.replace(/^public\./, "");
  const antes = c.datos_antes ?? {};
  const despues = c.datos_despues ?? {};
  const datos = c.datos_despues ?? c.datos_antes ?? {};
  const cosa = infoDeTabla(c.tabla).referencia(datos, nombres);

  if (c.operacion === "INSERT") {
    if (tabla === "movimientos_insumo") return movimiento(datos, nombres);
    if (tabla === "solicitudes_baja") {
      const { cuanto, insumo } = cantidadDeInsumo(datos, nombres);
      return `pidió una baja de ${cuanto} de ${insumo}`;
    }
    if (tabla === "clientes") return `registró ${cosa.replace(/^el /, "al ")}`;
    if (tabla === "consentimientos") return `anotó ${cosa}`;
    if (tabla === "cliente_fotos" || tabla === "producto_imagenes") return `añadió ${cosa}`;
    return `creó ${cosa}`;
  }
  if (c.operacion === "DELETE") return `eliminó ${cosa}`;

  const cambio = (campo: string) => distinto(antes[campo], despues[campo]);

  if (cambio("deleted_at")) return `${vacio(despues.deleted_at) ? "recuperó" : "borró"} ${cosa}`;
  if (tabla === "solicitudes_baja" && cambio("estado")) {
    if (despues.estado === "aprobada") return `aprobó ${cosa}`;
    if (despues.estado === "rechazada") return `rechazó ${cosa}`;
  }
  if (tabla === "consentimientos" && cambio("revocado_en") && !vacio(despues.revocado_en)) {
    return `retiró ${cosa}`;
  }
  if (tabla === "perfiles" && cambio("rol") && antes.activo === false && despues.activo === true) {
    // El alta de una cuenta son dos pasos: nace desactivada y como repartidor
    // (0006), y después se le pone su rol. Nunca fue repartidora.
    const nombre =
      typeof despues.nombre_completo === "string" ? despues.nombre_completo : "una persona";
    return `dio de alta la cuenta de ${nombre} como ${escribirValor("rol", despues.rol, nombres)}`;
  }
  if (tabla === "perfiles" && cambio("rol")) {
    const nombre =
      typeof despues.nombre_completo === "string" ? despues.nombre_completo : "una cuenta";
    return `cambió el rol de ${nombre}: ${escribirValor("rol", antes.rol, nombres)} → ${escribirValor("rol", despues.rol, nombres)}`;
  }
  if (cambio("estado")) {
    if (despues.estado === "publicado") return `publicó ${cosa}`;
    if (antes.estado === "publicado") return `despublicó ${cosa}`;
  }
  if (cambio("activo") && typeof despues.activo === "boolean") {
    return `${despues.activo ? "reactivó" : "desactivó"} ${cosa}`;
  }

  const lista = diferencias(c, nombres);
  if (lista.length === 0) {
    // Cambiar una foto sobrescribe el archivo: la fila solo cambia de fecha.
    return tabla === "cliente_fotos" ? `cambió ${cosa}` : `guardó ${cosa} sin cambiar nada`;
  }
  if (lista.length === 1) {
    const d = lista[0]!;
    const antesCorto = recortar(d.antes, LARGO_EN_FRASE);
    const despuesCorto = recortar(d.despues, LARGO_EN_FRASE);
    // Un texto largo que cambia al final se vería igual a los dos lados.
    if (antesCorto === despuesCorto) return `cambió ${cosa}`;
    return `cambió ${cosa}: ${d.etiqueta} ${antesCorto} → ${despuesCorto}`;
  }
  return `cambió ${cosa} (${lista.length} datos)`;
}

export function frase(c: Cambio, nombres: Nombres): string {
  return `${quien(c)} ${accion(c, nombres)}`;
}

/** Los ids a los que apuntan estas filas, para pedir sus nombres de una vez. */
export function idsReferidos(cambios: readonly Cambio[]): string[] {
  const ids = new Set<string>();
  for (const c of cambios) {
    for (const datos of [c.datos_antes, c.datos_despues]) {
      for (const [campo, valor] of Object.entries(datos ?? {})) {
        if (senalaAOtro(campo) && typeof valor === "string" && valor) ids.add(valor);
      }
    }
  }
  return [...ids];
}

/** Los mismos ids, repartidos por la tabla donde hay que buscar su nombre. */
export function idsPorTabla(cambios: readonly Cambio[]): Record<string, string[]> {
  const porTabla = new Map<string, Set<string>>();
  for (const c of cambios) {
    for (const datos of [c.datos_antes, c.datos_despues]) {
      for (const [campo, valor] of Object.entries(datos ?? {})) {
        const tabla = tablaQueSenala(campo);
        if (!tabla || typeof valor !== "string" || !valor) continue;
        if (!porTabla.has(tabla)) porTabla.set(tabla, new Set());
        porTabla.get(tabla)?.add(valor);
      }
    }
  }
  return Object.fromEntries([...porTabla].map(([tabla, ids]) => [tabla, [...ids]]));
}

/** Un cambio que no movió ningún dato (solo la fecha de «última vez guardado»). */
function sinCambioNeto(c: Cambio): boolean {
  if (c.operacion !== "UPDATE") return false;
  if (tachado(c.datos_antes) || tachado(c.datos_despues)) return false;
  // Cambiar una foto sobrescribe el archivo: la fila no cambia y sí es noticia.
  if (c.tabla === "public.cliente_fotos") return false;
  const antes = c.datos_antes ?? {};
  const despues = c.datos_despues ?? {};
  return ![...new Set([...Object.keys(antes), ...Object.keys(despues)])].some(
    (campo) => !esDeControl(campo) && distinto(antes[campo], despues[campo]),
  );
}

/**
 * La lista, como la ve una persona. Un «Guardar» del panel reescribe el
 * registro entero y deja varias filas del mismo instante sobre lo mismo
 * (`guardar_producto` quita la marca de presentación principal y la vuelve a
 * poner): se juntan en una, de cómo estaba antes a cómo quedó, y lo que al
 * final no cambió ningún dato no sale. Recibe las filas de la más reciente a
 * la más antigua y conserva ese orden; el detalle de un cambio sigue
 * enseñando cada fila tal cual.
 */
export function fundir(cambios: readonly Cambio[]): Cambio[] {
  const grupos = new Map<string, Cambio[]>();
  const orden: (Cambio | string)[] = [];
  for (const c of cambios) {
    if (c.operacion !== "UPDATE" || c.registro_id === null) {
      orden.push(c);
      continue;
    }
    const clave = `${c.tabla}|${c.registro_id}|${c.ocurrido_en}|${c.usuario_id}`;
    if (!grupos.has(clave)) {
      grupos.set(clave, []);
      orden.push(clave);
    }
    grupos.get(clave)?.push(c);
  }
  return orden
    .map((entrada) => {
      if (typeof entrada !== "string") return entrada;
      const filas = [...(grupos.get(entrada) ?? [])].sort((a, b) => a.id - b.id);
      const primera = filas[0]!;
      const ultima = filas[filas.length - 1]!;
      return { ...ultima, datos_antes: primera.datos_antes };
    })
    .filter((c) => !sinCambioNeto(c));
}
