import * as z from "zod";

/**
 * Esquema del formulario de ingreso. El mismo objeto valida en el cliente y en
 * el servidor (doc de stack §4.2), asi que las reglas no pueden divergir.
 *
 * Los mensajes van en espanol y sin jerga: los lee personal con nivel de
 * computadora basico (R18).
 */
export const esquemaIngreso = z.object({
  correo: z
    .string()
    .trim()
    .min(1, { error: "Escribe tu correo." })
    .pipe(z.email({ error: "Ese correo no parece valido. Revisa que este bien escrito." })),
  // Sin exigir longitud al ingresar: la regla de 10 caracteres es para crear la
  // contrasena. Pedirla aqui solo delataria el largo de las que ya existen.
  clave: z.string().min(1, { error: "Escribe tu contrasena." }),
});

export type DatosIngreso = z.infer<typeof esquemaIngreso>;
