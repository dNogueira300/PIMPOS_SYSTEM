import type { Reporte } from "./reportes";
import { formatearCantidad } from "./unidades";

export type TipoColumna = "texto" | "cantidad" | "soles";

/** Solo para enseñar: el total ya viene sumado por la base con `numeric`. */
export function formatearSoles(n: number): string {
  const [enteros, decimales] = n.toFixed(2).split(".");
  const conMiles = enteros!.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return `S/ ${conMiles}.${decimales}`;
}

export function formatearCelda(valor: string | number | null, tipo: TipoColumna): string {
  if (valor === null || valor === "") return "—";
  if (tipo === "soles") return formatearSoles(Number(valor));
  if (tipo === "cantidad") return formatearCantidad(Number(valor));
  return String(valor);
}

/**
 * El texto de una celda en soles, con el aviso de que parte de la cantidad no
 * tiene costo registrado (revisión de tarea 6, hallazgo I-2). Solo marca la
 * columna de dinero: una fila «sin costo» sigue teniendo cantidad exacta, lo
 * que no se sabe es cuánto costó una parte de ella.
 *
 * Pura y exportada para que la pantalla y, en la tarea 7, el Excel y el PDF
 * escriban exactamente el mismo texto — la misma regla que ya sigue
 * `leerReporte` con el resto del reporte.
 */
export function marcarSinCosto(celda: string, tipo: TipoColumna, sinCosto: boolean): string {
  return tipo === "soles" && sinCosto ? `${celda}${MARCA_SIN_COSTO}` : celda;
}

/** Lo que `marcarSinCosto` añade. El Excel lo pone en el formato de la celda, no en su valor. */
export const MARCA_SIN_COSTO = " *";

/** La nota que acompaña al total cuando alguna fila lleva la marca: la misma en pantalla, Excel y PDF. */
export const AVISO_SIN_COSTO =
  "* Parte de esta cantidad no tiene costo registrado, así que su costo no está incluido. Se corrige registrando el precio en el próximo conteo o ingreso.";

/**
 * Cada celda del reporte como la escribe la pantalla, marca incluida. Es lo que
 * pinta el PDF: así el texto de una celda se prueba aquí y no leyendo el PDF.
 */
export function textosDeLasFilas(reporte: Reporte): string[][] {
  return reporte.filas.map((fila, i) =>
    reporte.columnas.map((c) =>
      marcarSinCosto(
        formatearCelda(fila[c.clave] ?? null, c.tipo),
        c.tipo,
        reporte.sinCosto[i] ?? false,
      ),
    ),
  );
}
