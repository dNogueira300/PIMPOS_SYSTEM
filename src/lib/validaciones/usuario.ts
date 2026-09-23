import * as z from "zod";

import { ROLES, type Rol } from "@/lib/auth/roles";
import { texto, textoOpcional } from "@/lib/panel/formulario";

/**
 * Qué roles ofrece el formulario a quien da de alta o edita. Es comodidad: la
 * regla de verdad está en el trigger de 0029, que rechaza a un administrador
 * que dé o quite el rol superadmin aunque llame a la acción a mano.
 */
export function rolesQuePuedeAsignar(rol: Rol): Rol[] {
  if (rol === "superadmin") return [...ROLES];
  if (rol === "administrador") return ROLES.filter((r) => r !== "superadmin");
  return [];
}

export const esquemaUsuario = z.object({
  id: z.uuid().nullable(),
  nombre_completo: z
    .string()
    .min(1, { error: "Escribe el nombre." })
    .max(80, { error: "Máximo 80 letras." }),
  correo: z
    .string()
    .min(1, { error: "Escribe el correo." })
    .pipe(z.email({ error: "Ese correo no parece válido. Revisa que esté bien escrito." })),
  celular: z
    .string()
    .transform((c) => c.replace(/\s+/g, ""))
    .pipe(z.string().regex(/^9\d{8}$/, { error: "El celular tiene 9 dígitos y empieza por 9." }))
    .nullable(),
  rol: z.enum(ROLES, { error: "Elige un rol." }),
});

export function leerUsuario(fd: FormData) {
  return {
    id: textoOpcional(fd, "id"),
    nombre_completo: texto(fd, "nombre_completo"),
    correo: texto(fd, "correo").toLowerCase(),
    celular: textoOpcional(fd, "celular"),
    rol: texto(fd, "rol"),
  };
}

export function validarUsuario(fd: FormData) {
  const r = esquemaUsuario.safeParse(leerUsuario(fd));
  return r.success
    ? {}
    : (z.flattenError(r.error).fieldErrors as Record<string, string[] | undefined>);
}

export const esquemaCambioClave = z
  .object({
    clave: z.string().min(10, { error: "Tiene que tener al menos 10 caracteres." }),
    repetir: z.string(),
  })
  .refine((d) => d.clave === d.repetir, {
    path: ["repetir"],
    error: "Las dos contraseñas no coinciden.",
  });

/** Sin `trim`: un espacio al final de una contraseña es parte de ella. */
export function leerCambioClave(fd: FormData) {
  const valor = (nombre: string) => {
    const v = fd.get(nombre);
    return typeof v === "string" ? v : "";
  };
  return { clave: valor("clave"), repetir: valor("repetir") };
}

export function validarCambioClave(fd: FormData) {
  const r = esquemaCambioClave.safeParse(leerCambioClave(fd));
  return r.success
    ? {}
    : (z.flattenError(r.error).fieldErrors as Record<string, string[] | undefined>);
}
