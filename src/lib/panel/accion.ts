import "server-only";

import { updateTag } from "next/cache";
import * as z from "zod";

import type { Rol } from "@/lib/auth/roles";
import { exigirAcceso, type Sesion } from "@/lib/auth/sesion";
import type { Etiqueta } from "@/lib/datos/etiquetas";
import { crearClienteServidor } from "@/lib/supabase/servidor";

import { traducirError, type ErrorDePostgres } from "./errores";

export type EstadoAccion =
  | { estado: "inicial" }
  | { estado: "ok"; mensaje: string; id?: string; extra?: Record<string, string> }
  | { estado: "error"; mensaje: string; errores?: Record<string, string[] | undefined> };

export const ESTADO_INICIAL: EstadoAccion = { estado: "inicial" };

export type ContextoAccion = {
  supabase: Awaited<ReturnType<typeof crearClienteServidor>>;
  sesion: Sesion & { rol: Rol };
};

export type ResultadoDeBase = {
  error: ErrorDePostgres | null;
  id?: string;
  /** Sustituye a `mensajeOk` cuando el resultado depende de algo que solo sabe `hacer`. */
  mensaje?: string;
  /** Lo que la pantalla necesita de vuelta y no es un id (la contraseña temporal, T6). */
  extra?: Record<string, string>;
};

export type OpcionesAccion<S extends z.ZodType> = {
  /** La ruta del panel que protege la acción: se vuelve a comprobar aquí. */
  ruta: string;
  esquema: S;
  entrada: unknown;
  /** Con artículo, como encaja en «Ya hay ___ con ese nombre». */
  entidad: string;
  etiquetas: readonly Etiqueta[];
  /** Puede depender de lo guardado: «Guardado. Ya se ve en el sitio» solo si se publicó. */
  mensajeOk: string | ((datos: z.output<S>) => string);
  hacer: (datos: z.output<S>, contexto: ContextoAccion) => Promise<ResultadoDeBase>;
};

/**
 * El camino de toda acción del panel que escribe:
 *
 *   1. `exigirAcceso` — las Server Functions se resuelven como POST a su ruta y
 *      un cambio de `matcher` puede sacarlas del proxy sin avisar.
 *   2. Zod — el mismo esquema que valida en el navegador.
 *   3. La escritura, con el JWT del usuario: la RLS decide.
 *   4. El error de Postgres, traducido; el original, al registro.
 *   5. `updateTag` — el sitio público muestra el cambio en la siguiente visita,
 *      sin redesplegar. Solo si la escritura salió bien.
 */
export async function ejecutarAccion<S extends z.ZodType>(
  op: OpcionesAccion<S>,
): Promise<EstadoAccion> {
  const sesion = await exigirAcceso(op.ruta);

  const validado = op.esquema.safeParse(op.entrada);
  if (!validado.success) {
    const errores = z.flattenError(validado.error).fieldErrors as Record<
      string,
      string[] | undefined
    >;
    return { estado: "error", mensaje: "Revisa los campos marcados en rojo.", errores };
  }

  const supabase = await crearClienteServidor();
  const {
    error,
    id,
    mensaje: mensajeDeHacer,
    extra,
  } = await op.hacer(validado.data, {
    supabase,
    sesion,
  });

  if (error) {
    console.error(
      `[panel] ${op.entidad}: código ${error.code ?? "?"} — ${error.message}`,
      error.hint ? `Pista: ${error.hint}` : "",
      error.details ? `Detalle: ${error.details}` : "",
    );
    return { estado: "error", mensaje: traducirError(error, op.entidad) };
  }

  for (const etiqueta of op.etiquetas) updateTag(etiqueta);
  const mensaje =
    mensajeDeHacer ??
    (typeof op.mensajeOk === "function" ? op.mensajeOk(validado.data) : op.mensajeOk);
  return { estado: "ok", mensaje, id, extra };
}
