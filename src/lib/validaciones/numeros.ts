import * as z from "zod";

import { normalizarPrecio } from "./producto";

/**
 * Cantidades y precios viajan como TEXTO hasta la base, que los convierte a
 * `numeric` sin pasar por coma flotante. Aquí solo se limpian y se comprueban.
 */
export const normalizarNumero = normalizarPrecio;

const CANTIDAD = /^\d{1,8}(\.\d{1,4})?$/;
const PRECIO = /^\d{1,6}(\.\d{1,2})?$/;

export function cantidadPositiva(mensaje: string) {
  return z
    .string()
    .transform(normalizarNumero)
    .pipe(
      z
        .string()
        .regex(CANTIDAD, { error: mensaje })
        .refine((v) => Number(v) > 0, { error: "Tiene que ser mayor que cero." }),
    );
}

export function cantidadOCero(mensaje: string) {
  return z
    .string()
    .transform(normalizarNumero)
    .pipe(z.string().regex(CANTIDAD, { error: mensaje }));
}

export function precio(mensaje: string) {
  return z
    .string()
    .transform(normalizarNumero)
    .pipe(z.string().regex(PRECIO, { error: mensaje }));
}

export function precioOpcional(mensaje: string) {
  return z
    .string()
    .transform(normalizarNumero)
    .pipe(z.union([z.literal(""), z.string().regex(PRECIO, { error: mensaje })]))
    .transform((v) => (v === "" ? null : v));
}
