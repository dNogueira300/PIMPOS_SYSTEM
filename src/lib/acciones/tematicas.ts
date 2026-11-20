"use server";

import { ETIQUETAS } from "@/lib/datos/etiquetas";
import { ejecutarAccion, type EstadoAccion } from "@/lib/panel/accion";
import { esquemaTematica, leerTematica } from "@/lib/validaciones/tematica";

const RUTA = "/admin/contenido/tematicas";

/**
 * Guarda una temática y sus productos de una vez (`public.guardar_tematica`,
 * 0047). Las reglas —fechas que se cruzan, encender una campaña pasada— las
 * pone la base, y su frase llega tal cual. Refresca el catálogo (los productos
 * solo de temporada aparecen o desaparecen) y la marca (la barra de arriba).
 */
export async function guardarTematica(fd: FormData): Promise<EstadoAccion> {
  return ejecutarAccion({
    ruta: RUTA,
    esquema: esquemaTematica,
    entrada: leerTematica(fd),
    entidad: "la temática",
    etiquetas: [ETIQUETAS.catalogo, ETIQUETAS.marca],
    mensajeOk: "Guardado. El sitio ya muestra el cambio.",
    hacer: async (d, { supabase }) => {
      const { error } = await supabase.rpc("guardar_tematica", {
        p_tematica: d.id,
        p_datos: {
          inicio: d.inicio,
          fin: d.fin,
          fecha_evento: d.fecha_evento,
          encendido: d.encendido,
          texto_aviso: d.texto_aviso,
          mensajes_cinta: d.mensajes_cinta,
          titulo: d.titulo,
          entradilla: d.entradilla,
        },
        p_productos: d.productos,
      });
      return { error, id: d.id };
    },
  });
}
