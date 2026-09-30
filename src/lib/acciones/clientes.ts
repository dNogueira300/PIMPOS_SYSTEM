"use server";

import * as z from "zod";

import { normalizarCelular } from "@/lib/clientes/contacto";
import { VERSION_PERMISO } from "@/lib/clientes/permiso";
import { ejecutarAccion, type EstadoAccion } from "@/lib/panel/accion";
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
  if (numero.length < 6) return null;
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
