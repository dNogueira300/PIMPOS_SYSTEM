"use server";

import * as z from "zod";

import { ETIQUETAS, type Etiqueta } from "@/lib/datos/etiquetas";
import { ejecutarAccion, type EstadoAccion } from "@/lib/panel/accion";
import { reordenar } from "@/lib/panel/orden";

export type TablaOrdenable =
  "categorias_producto" | "slides" | "galeria" | "faqs" | "guias" | "testimonios";

const DESTINO: Record<TablaOrdenable, { ruta: string; etiqueta: Etiqueta }> = {
  categorias_producto: { ruta: "/admin/contenido/categorias", etiqueta: ETIQUETAS.catalogo },
  slides: { ruta: "/admin/contenido/portada", etiqueta: ETIQUETAS.novedades },
  galeria: { ruta: "/admin/contenido/galeria", etiqueta: ETIQUETAS.contenido },
  faqs: { ruta: "/admin/contenido/preguntas", etiqueta: ETIQUETAS.contenido },
  guias: { ruta: "/admin/contenido/guias", etiqueta: ETIQUETAS.contenido },
  testimonios: { ruta: "/admin/contenido/testimonios", etiqueta: ETIQUETAS.contenido },
};

// `tabla` y `hacia` llegan del navegador como cualquier argumento de una Server
// Action: sin validarlos, `DESTINO[tabla]` con un valor desconocido tiraba un
// 500 antes incluso de comprobar el acceso.
const esquemaDestino = z.object({
  tabla: z.enum(Object.keys(DESTINO) as [TablaOrdenable, ...TablaOrdenable[]]),
  hacia: z.enum(["arriba", "abajo"]),
});

export async function moverFila(
  tabla: TablaOrdenable,
  id: string,
  hacia: "arriba" | "abajo",
): Promise<EstadoAccion> {
  const destino = esquemaDestino.safeParse({ tabla, hacia });
  if (!destino.success) {
    return {
      estado: "error",
      mensaje: "No se pudo cambiar el orden. Recarga la página y vuelve a intentarlo.",
    };
  }
  const { ruta, etiqueta } = DESTINO[destino.data.tabla];
  return ejecutarAccion({
    ruta,
    esquema: z.object({ id: z.uuid(), hacia: z.enum(["arriba", "abajo"]) }),
    entrada: { id, hacia },
    entidad: "la fila",
    etiquetas: [etiqueta],
    mensajeOk: "Orden cambiado.",
    hacer: async (d, { supabase }) => {
      // Una rama por tabla: supabase-js deduce el tipo de la fila del nombre
      // literal, y con una unión de nombres pierde el tipo de `update`.
      const leer = () => {
        switch (tabla) {
          case "categorias_producto":
            return supabase
              .from("categorias_producto")
              .select("id, orden")
              .is("deleted_at", null)
              .order("orden")
              .order("id");
          case "slides":
            return supabase
              .from("slides")
              .select("id, orden")
              .is("deleted_at", null)
              .order("orden")
              .order("id");
          case "galeria":
            return supabase
              .from("galeria")
              .select("id, orden")
              .is("deleted_at", null)
              .order("orden")
              .order("id");
          case "faqs":
            return supabase
              .from("faqs")
              .select("id, orden")
              .is("deleted_at", null)
              .order("orden")
              .order("id");
          case "guias":
            return supabase
              .from("guias")
              .select("id, orden")
              .is("deleted_at", null)
              .order("orden")
              .order("id");
          case "testimonios":
            return supabase
              .from("testimonios")
              .select("id, orden")
              .is("deleted_at", null)
              .order("orden")
              .order("id");
        }
      };
      const escribir = (fila: string, orden: number) => {
        switch (tabla) {
          case "categorias_producto":
            return supabase.from("categorias_producto").update({ orden }).eq("id", fila);
          case "slides":
            return supabase.from("slides").update({ orden }).eq("id", fila);
          case "galeria":
            return supabase.from("galeria").update({ orden }).eq("id", fila);
          case "faqs":
            return supabase.from("faqs").update({ orden }).eq("id", fila);
          case "guias":
            return supabase.from("guias").update({ orden }).eq("id", fila);
          case "testimonios":
            return supabase.from("testimonios").update({ orden }).eq("id", fila);
        }
      };

      const { data, error } = await leer();
      if (error) return { error };

      const cambios = reordenar(
        data.map((f) => f.id),
        d.id,
        d.hacia,
        data.map((f) => f.orden),
      );
      for (const cambio of cambios) {
        const { error: errorEscritura } = await escribir(cambio.id, cambio.orden);
        if (errorEscritura) return { error: errorEscritura };
      }
      return { error: null };
    },
  });
}
