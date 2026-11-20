import * as z from "zod";

import { json, texto, textoOpcional } from "@/lib/panel/formulario";

/**
 * El formulario de una temática (plan 08, T2). Los límites son los de la base
 * (0047): seis mensajes de cinta de hasta 60 letras, barra de 120, título de
 * 80 y entradilla de 240. Si llegan mal hasta la base, ella los rechaza igual.
 */
const FECHA = z.iso.date({ error: "Elige una fecha." });

export const ENCENDIDOS = ["fechas", "encendida", "apagada"] as const;

export const esquemaTematica = z
  .object({
    id: z.uuid(),
    inicio: z.iso.date({ error: "Elige el día en que empieza." }),
    fin: z.iso.date({ error: "Elige el día en que termina." }),
    fecha_evento: FECHA.nullable(),
    encendido: z.enum(ENCENDIDOS, { error: "Elige cómo se enciende." }),
    texto_aviso: z.string().max(120, { error: "Máximo 120 letras." }).nullable(),
    mensajes_cinta: z
      .array(z.string().max(60, { error: "Cada mensaje, como mucho 60 letras." }))
      .max(6, { error: "Como mucho seis mensajes." }),
    titulo: z.string().max(80, { error: "Máximo 80 letras." }).nullable(),
    entradilla: z.string().max(240, { error: "Máximo 240 letras." }).nullable(),
    productos: z
      .array(z.object({ producto_id: z.uuid(), solo_temporada: z.boolean() }))
      .max(30, { error: "Como mucho 30 productos." }),
  })
  .refine((d) => d.fin >= d.inicio, {
    path: ["fin"],
    error: "Termina antes de empezar: revisa las fechas.",
  });

export type DatosTematica = z.infer<typeof esquemaTematica>;

/** La lista oculta de productos; si llega rota, cuenta como vacía. */
function leerProductos(fd: FormData): unknown[] {
  const valor = json(fd, "productos");
  return Array.isArray(valor) ? valor : [];
}

export function leerTematica(fd: FormData) {
  return {
    id: texto(fd, "id"),
    inicio: texto(fd, "inicio"),
    fin: texto(fd, "fin"),
    fecha_evento: textoOpcional(fd, "fecha_evento"),
    encendido: texto(fd, "encendido"),
    texto_aviso: textoOpcional(fd, "texto_aviso"),
    // Un mensaje por línea; las vacías no cuentan.
    mensajes_cinta: texto(fd, "mensajes_cinta")
      .split("\n")
      .map((m) => m.trim())
      .filter(Boolean),
    titulo: textoOpcional(fd, "titulo"),
    entradilla: textoOpcional(fd, "entradilla"),
    productos: leerProductos(fd),
  };
}

/** Para la validación en el navegador: los errores por campo, o vacío. */
export function validarTematica(fd: FormData) {
  const r = esquemaTematica.safeParse(leerTematica(fd));
  return r.success
    ? {}
    : (z.flattenError(r.error).fieldErrors as Record<string, string[] | undefined>);
}
