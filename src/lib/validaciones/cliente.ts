import * as z from "zod";

import { normalizarCelular } from "@/lib/clientes/contacto";
import { casilla, json, texto, textoOpcional } from "@/lib/panel/formulario";

import { erroresPorCampo } from "./movimiento";

const referencia = z
  .string()
  .trim()
  .min(3, {
    error: "Escribe cómo reconocer la casa, por ejemplo «portón verde, frente a la bodega».",
  })
  .max(200, { error: "Máximo 200 letras." });

const ubicacion = z
  .object({
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
  })
  .nullable();

export const esquemaCliente = z
  .object({
    id: z.uuid().nullable(),
    nombre_completo: z
      .string()
      .trim()
      .min(3, { error: "Escribe su nombre y apellido." })
      .max(120, { error: "Máximo 120 letras." }),
    celular: z
      .string()
      .transform(normalizarCelular)
      .pipe(
        z
          .string()
          .min(6, { error: "Escribe el celular con números, por ejemplo 965 111 222." })
          .max(15, { error: "Ese número es demasiado largo." }),
      ),
    direccion: z
      .string()
      .trim()
      .min(5, { error: "Escribe la dirección, por ejemplo «Jr. Próspero 123»." })
      .max(200, { error: "Máximo 200 letras." }),
    referencia,
    zona_id: z.uuid({ error: "Elige la zona." }),
    observacion: z.string().trim().max(300, { error: "Máximo 300 letras." }).nullable(),
    ubicacion,
    permiso: z.boolean(),
  })
  .refine((d) => d.id !== null || d.permiso, {
    error: "Léele el texto y marca «Se lo leí y aceptó». Sin su permiso no se puede registrar.",
    path: ["permiso"],
  });

/** `coordenadas` llega vacío (sin punto) o como JSON de `SelectorUbicacion`. */
function leerUbicacion(fd: FormData) {
  const valor = json(fd, "coordenadas");
  return valor && typeof valor === "object" ? valor : null;
}

export function leerCliente(fd: FormData) {
  return {
    id: textoOpcional(fd, "id"),
    nombre_completo: texto(fd, "nombre_completo"),
    celular: texto(fd, "celular"),
    direccion: texto(fd, "direccion"),
    referencia: texto(fd, "referencia"),
    zona_id: texto(fd, "zona_id"),
    observacion: textoOpcional(fd, "observacion"),
    ubicacion: leerUbicacion(fd),
    permiso: casilla(fd, "permiso"),
  };
}

export function validarCliente(fd: FormData) {
  const r = esquemaCliente.safeParse(leerCliente(fd));
  return r.success ? {} : erroresPorCampo(r.error);
}

/** Lo que corrige el repartidor en la puerta (decisión 2). Zod descarta el resto. */
export const esquemaCorreccion = z.object({ id: z.uuid(), referencia, ubicacion });

export function leerCorreccion(fd: FormData) {
  return { id: texto(fd, "id"), referencia: texto(fd, "referencia"), ubicacion: leerUbicacion(fd) };
}

export function validarCorreccion(fd: FormData) {
  const r = esquemaCorreccion.safeParse(leerCorreccion(fd));
  return r.success ? {} : erroresPorCampo(r.error);
}
