import * as z from "zod";

import { texto, textoOpcional } from "@/lib/panel/formulario";

import { erroresPorCampo } from "./movimiento";

export const esquemaZona = z.object({
  id: z.uuid().nullable(),
  nombre: z
    .string()
    .trim()
    .min(2, { error: "Escribe el nombre de la zona." })
    .max(60, { error: "Máximo 60 letras." }),
  descripcion: z.string().trim().max(200, { error: "Máximo 200 letras." }).nullable(),
});

export function leerZona(fd: FormData) {
  return {
    id: textoOpcional(fd, "id"),
    nombre: texto(fd, "nombre"),
    descripcion: textoOpcional(fd, "descripcion"),
  };
}

export function validarZona(fd: FormData) {
  const r = esquemaZona.safeParse(leerZona(fd));
  return r.success ? {} : erroresPorCampo(r.error);
}
