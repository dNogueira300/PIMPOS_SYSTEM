"use server";

import * as z from "zod";

import { CELULAR_BORRADO } from "@/lib/clientes/borrado";
import { normalizarCelular } from "@/lib/clientes/contacto";
import { VERSION_PERMISO } from "@/lib/clientes/permiso";
import { type ContextoAccion, ejecutarAccion, type EstadoAccion } from "@/lib/panel/accion";
import { crearClienteServidor } from "@/lib/supabase/servidor";
import { exigirAcceso } from "@/lib/auth/sesion";
import {
  esquemaCliente,
  esquemaCorreccion,
  leerCliente,
  leerCorreccion,
} from "@/lib/validaciones/cliente";

// `exigirAcceso` mira la ruta: `/admin/clientes/nuevo` es la de los encargados
// (roles.ts), `/admin/clientes` la de los cuatro roles. La regla de verdad está
// en la base (0042): RLS y el trigger `clientes_proteger`.
const ENCARGADOS = "/admin/clientes/nuevo";
const TODOS = "/admin/clientes";

export async function registrarCliente(fd: FormData): Promise<EstadoAccion> {
  return ejecutarAccion({
    ruta: ENCARGADOS,
    esquema: esquemaCliente,
    entrada: leerCliente(fd),
    entidad: "un cliente",
    etiquetas: [],
    mensajeOk: "Cliente registrado. Ahora añade las fotos de la fachada.",
    hacer: async (d, { supabase }) => {
      const { data, error } = await supabase.rpc("registrar_cliente", {
        p_cliente: {
          nombre_completo: d.nombre_completo,
          celular: d.celular,
          direccion: d.direccion,
          referencia: d.referencia,
          zona_id: d.zona_id,
          latitud: d.ubicacion?.lat ?? null,
          longitud: d.ubicacion?.lng ?? null,
          observacion: d.observacion,
        },
        p_version_texto: VERSION_PERMISO,
      });
      return { error, id: data ?? undefined };
    },
  });
}

export async function editarCliente(fd: FormData): Promise<EstadoAccion> {
  return ejecutarAccion({
    ruta: ENCARGADOS,
    esquema: esquemaCliente,
    entrada: leerCliente(fd),
    entidad: "el cliente",
    etiquetas: [],
    mensajeOk: "Cambios guardados.",
    hacer: async (d, { supabase }) => {
      if (!d.id) return { error: { code: "P0002", message: "Falta el cliente." } };
      const { error } = await supabase
        .from("clientes")
        .update({
          nombre_completo: d.nombre_completo,
          celular: d.celular,
          direccion: d.direccion,
          referencia: d.referencia,
          zona_id: d.zona_id,
          latitud: d.ubicacion?.lat ?? null,
          longitud: d.ubicacion?.lng ?? null,
          observacion: d.observacion,
        })
        .eq("id", d.id)
        .is("deleted_at", null)
        .select("id")
        .single();
      return { error, id: d.id };
    },
  });
}

export async function corregirCliente(fd: FormData): Promise<EstadoAccion> {
  return ejecutarAccion({
    ruta: TODOS,
    esquema: esquemaCorreccion,
    entrada: leerCorreccion(fd),
    entidad: "el cliente",
    etiquetas: [],
    mensajeOk: "Corrección guardada.",
    hacer: async (d, { supabase }) => {
      const { error } = await supabase
        .from("clientes")
        .update({
          referencia: d.referencia,
          latitud: d.ubicacion?.lat ?? null,
          longitud: d.ubicacion?.lng ?? null,
        })
        .eq("id", d.id)
        .is("deleted_at", null)
        .select("id")
        .single();
      return { error, id: d.id };
    },
  });
}

export async function cambiarActivoCliente(id: string, activo: boolean): Promise<EstadoAccion> {
  return ejecutarAccion({
    ruta: ENCARGADOS,
    esquema: z.object({ id: z.uuid(), activo: z.boolean() }),
    entrada: { id, activo },
    entidad: "el cliente",
    etiquetas: [],
    mensajeOk: activo
      ? "Cliente reactivado."
      : "Cliente desactivado. Ya no sale en la lista ni en el mapa.",
    hacer: async (d, { supabase }) => {
      const { error } = await supabase
        .from("clientes")
        .update({ activo: d.activo })
        .eq("id", d.id)
        .select("id")
        .single();
      return { error };
    },
  });
}

/** Hasta 3 fotos (ficha 8.3): toma el primer hueco libre del 1 al 3. */
export async function agregarFotoCliente(id: string, ruta: string): Promise<EstadoAccion> {
  return ejecutarAccion({
    ruta: TODOS,
    esquema: z.object({ id: z.uuid(), ruta: z.string().min(1) }),
    entrada: { id, ruta },
    entidad: "la foto",
    etiquetas: [],
    mensajeOk: "Foto añadida.",
    hacer: async (d, { supabase }) => {
      const { data: hay, error: errorLeer } = await supabase
        .from("cliente_fotos")
        .select("orden")
        .eq("cliente_id", d.id);
      if (errorLeer) return { error: errorLeer };
      const usados = new Set((hay ?? []).map((f) => f.orden));
      const orden = [1, 2, 3].find((n) => !usados.has(n));
      if (!orden) {
        return {
          error: { code: "P0001", message: "Ya tiene 3 fotos. Quita una antes de añadir otra." },
        };
      }
      const { error } = await supabase
        .from("cliente_fotos")
        .insert({ cliente_id: d.id, ruta: d.ruta, orden });
      return { error };
    },
  });
}

export async function quitarFotoCliente(fotoId: string): Promise<EstadoAccion> {
  return ejecutarAccion({
    ruta: ENCARGADOS,
    esquema: z.object({ id: z.uuid() }),
    entrada: { id: fotoId },
    entidad: "la foto",
    etiquetas: [],
    mensajeOk: "Foto quitada.",
    hacer: async ({ id }, { supabase }) => {
      const { data, error } = await supabase
        .from("cliente_fotos")
        .delete()
        .eq("id", id)
        .select("ruta")
        .single();
      if (error) return { error };
      // La fila ya no está; si el archivo no se borra, queda en el bucket
      // privado sin nadie que lo enseñe. Se registra para limpiarlo, no se
      // le echa la culpa a quien quitó la foto.
      const { error: errorArchivo } = await supabase.storage.from("clientes").remove([data.ruta]);
      if (errorArchivo)
        console.error(
          "[clientes] foto quitada, archivo sin borrar:",
          data.ruta,
          errorArchivo.message,
        );
      return { error: null };
    },
  });
}

/** Aviso de celular repetido (decisión 8). No bloquea: avisa. */
export async function buscarCelularRepetido(
  celular: string,
  excluir: string | null,
): Promise<{ id: string; nombre: string; zona: string | null } | null> {
  await exigirAcceso(TODOS);
  const numero = normalizarCelular(celular);
  // El celular de las fichas borradas a pedido (0043) es de todas ellas: no es de nadie.
  if (numero.length < 6 || numero === CELULAR_BORRADO) return null;
  const supabase = await crearClienteServidor();
  let consulta = supabase
    .from("clientes")
    .select("id, nombre_completo, zonas_reparto(nombre)")
    .eq("celular", numero)
    .is("deleted_at", null)
    .limit(1);
  if (excluir) consulta = consulta.neq("id", excluir);
  const { data } = await consulta.maybeSingle();
  return data
    ? { id: data.id, nombre: data.nombre_completo, zona: data.zonas_reparto?.nombre ?? null }
    : null;
}

const ADMINISTRACION = "/admin/clientes/zonas"; // prefijo solo de superadmin y administrador (roles.ts)

/**
 * Borra en Storage todo lo que quede en la carpeta del cliente. Por carpeta y
 * no por la lista de filas: si un intento anterior borró la base y falló aquí,
 * las filas ya no existen y la carpeta sí. Borrar lo que no está no falla, así
 * que repetirlo es seguro.
 */
async function vaciarCarpeta(
  supabase: ContextoAccion["supabase"],
  id: string,
): Promise<{ quedan: number }> {
  const listar = () => supabase.storage.from("clientes").list(id, { limit: 100 });
  const { data, error } = await listar();
  if (error) {
    console.error("[clientes] no se pudo listar la carpeta", id, error.message);
    return { quedan: -1 };
  }
  const rutas = (data ?? []).map((f) => `${id}/${f.name}`);
  if (rutas.length === 0) return { quedan: 0 };
  await supabase.storage.from("clientes").remove(rutas);
  // `remove()` no da error cuando la RLS no deja borrar: devuelve una lista
  // vacía. Lo único fiable es volver a mirar qué quedó en la carpeta.
  const { data: despues, error: errorDespues } = await listar();
  if (errorDespues) return { quedan: -1 };
  const quedan = (despues ?? []).length;
  if (quedan > 0) console.error("[clientes] fotos sin borrar en la carpeta", id, quedan);
  return { quedan };
}

/** Decisión 3: borra de verdad, con motivo. Solo la administración (la base lo exige también). */
export async function borrarDatosCliente(id: string, motivo: string): Promise<EstadoAccion> {
  return ejecutarAccion({
    ruta: ADMINISTRACION,
    esquema: z.object({
      id: z.uuid(),
      motivo: z
        .string()
        .trim()
        .min(3, { error: "Escribe por qué, por ejemplo «lo pidió por WhatsApp»." })
        .max(300),
    }),
    entrada: { id, motivo },
    entidad: "el cliente",
    etiquetas: [],
    mensajeOk: "Datos borrados. Queda solo la constancia de que se borraron.",
    hacer: async (d, { supabase }) => {
      const { error } = await supabase.rpc("borrar_datos_cliente", {
        p_id: d.id,
        p_motivo: d.motivo,
      });
      if (error) return { error };
      const { quedan } = await vaciarCarpeta(supabase, d.id);
      if (quedan !== 0) {
        return {
          error: null,
          mensaje:
            "Datos borrados, pero algunas fotos no se pudieron borrar. Pulsa «Borrar las fotos que quedaron» en la ficha.",
          extra: { fotosSinBorrar: String(quedan) },
        };
      }
      return { error: null };
    },
  });
}

export async function borrarFotosQueQuedaron(id: string): Promise<EstadoAccion> {
  return ejecutarAccion({
    ruta: ADMINISTRACION,
    esquema: z.object({ id: z.uuid() }),
    entrada: { id },
    entidad: "las fotos",
    etiquetas: [],
    mensajeOk: "Listo: ya no queda ninguna foto de este cliente.",
    hacer: async (d, { supabase }) => {
      const { quedan } = await vaciarCarpeta(supabase, d.id);
      return quedan === 0
        ? { error: null }
        : {
            error: {
              code: "P0001",
              message: "Todavía no se pudieron borrar. Inténtalo en un rato.",
            },
          };
    },
  });
}

/**
 * «Sigue siendo cliente» (decisión 4): renueva la fecha sin cambiar nada. Un
 * `update` que no cambia ningún valor igual dispara `set_updated_at`, que es lo
 * que mide `clientes_para_revisar`.
 */
export async function seguirComoCliente(id: string): Promise<EstadoAccion> {
  return ejecutarAccion({
    ruta: ADMINISTRACION,
    esquema: z.object({ id: z.uuid() }),
    entrada: { id },
    entidad: "el cliente",
    etiquetas: [],
    mensajeOk: "Anotado. No vuelve a salir aquí hasta dentro de dos años.",
    hacer: async (d, { supabase }) => {
      const { error } = await supabase
        .from("clientes")
        .update({ activo: true })
        .eq("id", d.id)
        // Solo renueva la fecha de uno que sigue activo: si otra persona lo
        // acaba de desactivar, no lo devuelve al reparto a escondidas.
        .eq("activo", true)
        .is("deleted_at", null)
        .select("id")
        .single();
      return { error };
    },
  });
}
