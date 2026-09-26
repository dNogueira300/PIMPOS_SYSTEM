import * as z from "zod";

import { texto, textoOpcional } from "@/lib/panel/formulario";

export const esquemaProveedor = z.object({
  id: z.uuid().nullable(),
  nombre: z
    .string()
    .trim()
    .min(1, { error: "Escribe el nombre del proveedor." })
    .max(80, { error: "Máximo 80 letras." }),
  contacto: z.string().max(80, { error: "Máximo 80 letras." }).nullable(),
  telefono: z.string().max(20, { error: "Máximo 20 caracteres." }).nullable(),
  observacion: z.string().max(300, { error: "Máximo 300 letras." }).nullable(),
});

export function leerProveedor(fd: FormData) {
  return {
    id: textoOpcional(fd, "id"),
    nombre: texto(fd, "nombre"),
    contacto: textoOpcional(fd, "contacto"),
    telefono: textoOpcional(fd, "telefono"),
    observacion: textoOpcional(fd, "observacion"),
  };
}

export function validarProveedor(fd: FormData) {
  const r = esquemaProveedor.safeParse(leerProveedor(fd));
  return r.success
    ? {}
    : (z.flattenError(r.error).fieldErrors as Record<string, string[] | undefined>);
}
