"use server";

import * as z from "zod";

import { ejecutarAccion, type EstadoAccion } from "@/lib/panel/accion";
import { esquemaProveedor, leerProveedor } from "@/lib/validaciones/proveedor";

const RUTA = "/admin/insumos/proveedores";

export async function guardarProveedor(fd: FormData): Promise<EstadoAccion> {
  return ejecutarAccion({
    ruta: RUTA,
    esquema: esquemaProveedor,
    entrada: leerProveedor(fd),
    entidad: "un proveedor",
    etiquetas: [],
    mensajeOk: "Proveedor guardado.",
    hacer: async (d, { supabase }) => {
      const fila = {
        nombre: d.nombre,
        contacto: d.contacto,
        telefono: d.telefono,
        observacion: d.observacion,
      };
      if (d.id) {
        const { error } = await supabase
          .from("proveedores")
          .update(fila)
          .eq("id", d.id)
          .is("deleted_at", null)
          .select("id")
          .single();
        return { error, id: d.id };
      }
      const { data, error } = await supabase.from("proveedores").insert(fila).select("id").single();
      return { error, id: data?.id };
    },
  });
}

export async function retirarProveedor(id: string): Promise<EstadoAccion> {
  return ejecutarAccion({
    ruta: RUTA,
    esquema: z.object({ id: z.uuid() }),
    entrada: { id },
    entidad: "el proveedor",
    etiquetas: [],
    mensajeOk: "Proveedor retirado. Sus compras anteriores siguen en los reportes.",
    hacer: async ({ id }, { supabase }) => {
      const { error } = await supabase
        .from("proveedores")
        .update({ deleted_at: new Date().toISOString(), activo: false })
        .eq("id", id)
        .select("id")
        .single();
      return { error };
    },
  });
}
