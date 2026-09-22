"use server";

import * as z from "zod";

import { ETIQUETAS } from "@/lib/datos/etiquetas";
import { ejecutarAccion, type EstadoAccion } from "@/lib/panel/accion";
import { accionesDisponibles, estadoTras, intencionEfectiva } from "@/lib/panel/aprobacion";
import { generarSlug } from "@/lib/utilidades/slug";
import { esquemaNovedad, leerNovedad } from "@/lib/validaciones/novedad";

const RUTA = "/admin/contenido/novedades";

const MENSAJES = {
  guardar: "Cambios guardados.",
  enviar: "Enviada a revisión. Un administrador la verá en su inicio.",
  publicar: "Publicada. Ya se ve en el sitio.",
  devolver: "Devuelta con tu comentario.",
  archivar: "Retirada del sitio.",
} as const;

export async function guardarNovedad(fd: FormData): Promise<EstadoAccion> {
  return ejecutarAccion({
    ruta: RUTA,
    esquema: esquemaNovedad,
    entrada: leerNovedad(fd),
    entidad: "una novedad",
    etiquetas: [ETIQUETAS.novedades],
    mensajeOk: (d) => MENSAJES[d.intencion],
    hacer: async (d, { supabase, sesion }) => {
      const intencion = intencionEfectiva(sesion.rol, d.tipo, d.intencion);

      let estadoActual: "borrador" | "en_revision" | "publicado" | "archivado" = "borrador";
      if (d.id) {
        const { data, error } = await supabase
          .from("novedades")
          .select("estado")
          .eq("id", d.id)
          .is("deleted_at", null)
          .single();
        if (error) return { error };
        estadoActual = data.estado;
      }

      // La interfaz solo enseña lo permitido, pero una acción se puede llamar
      // a mano. La base tiene la última palabra en promociones; esto evita
      // escrituras absurdas en el resto (p. ej. «devolver» un aviso).
      if (!accionesDisponibles(sesion.rol, d.tipo, estadoActual).includes(intencion)) {
        return { error: { code: "42501", message: "intención no permitida" } };
      }

      const fila = {
        tipo: d.tipo,
        titulo: d.titulo,
        resumen: d.resumen,
        contenido: d.contenido,
        imagen_url: d.imagen_url,
        vigencia_inicio: d.vigencia_inicio,
        vigencia_fin: d.vigencia_fin,
        estado: estadoTras(intencion, estadoActual),
        // Solo al devolver se escribe; en el resto se deja como está (la base lo limpia).
        ...(intencion === "devolver" ? { comentario_revision: d.comentario_revision } : {}),
      };

      if (d.id) {
        const { error } = await supabase
          .from("novedades")
          .update(fila)
          .eq("id", d.id)
          .is("deleted_at", null)
          .select("id")
          .single();
        return { error, id: d.id, mensaje: MENSAJES[intencion] };
      }
      const { data, error } = await supabase
        .from("novedades")
        .insert({ ...fila, slug: generarSlug(d.titulo) })
        .select("id")
        .single();
      return { error, id: data?.id, mensaje: MENSAJES[intencion] };
    },
  });
}

export async function borrarNovedad(id: string): Promise<EstadoAccion> {
  return ejecutarAccion({
    ruta: RUTA,
    esquema: z.object({ id: z.uuid() }),
    entrada: { id },
    entidad: "la novedad",
    etiquetas: [ETIQUETAS.novedades],
    mensajeOk: "Novedad borrada.",
    hacer: async ({ id }, { supabase }) => {
      const { error } = await supabase
        .from("novedades")
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", id)
        .select("id")
        .single();
      return { error };
    },
  });
}
