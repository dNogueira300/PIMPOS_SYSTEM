import type { Rol } from "@/lib/auth/roles";
import type { Database } from "@/tipos/database.types";

type Novedad = Database["public"]["Tables"]["novedades"]["Row"];
export type TipoNovedad = Novedad["tipo"];
export type EstadoPublicacion = Novedad["estado"];

export type Intencion = "guardar" | "enviar" | "publicar" | "devolver" | "archivar";

export const TIPOS_DE_NOVEDAD = [
  "promocion",
  "nuevo_producto",
  "campania",
  "evento",
  "aviso",
] as const satisfies readonly TipoNovedad[];

export const NOMBRE_DE_TIPO: Record<TipoNovedad, string> = {
  promocion: "Promoción",
  nuevo_producto: "Producto nuevo",
  campania: "Campaña",
  evento: "Evento",
  aviso: "Aviso",
};

const esAdministracion = (rol: Rol) => rol === "superadmin" || rol === "administrador";

/**
 * Qué botones ve cada rol (doc 03 §5.3). Es la interfaz: esconder «Publicar»
 * al ingeniero no es la regla; la regla está en 0010 y 0028. Pero la
 * interfaz no debe ofrecer lo que la base va a rechazar.
 */
export function accionesDisponibles(
  rol: Rol,
  tipo: TipoNovedad,
  estado: EstadoPublicacion,
): Intencion[] {
  if (rol === "repartidor") return [];

  if (esAdministracion(rol)) {
    switch (estado) {
      case "borrador":
        return ["guardar", "publicar"];
      case "en_revision":
        return tipo === "promocion" ? ["guardar", "publicar", "devolver"] : ["guardar", "publicar"];
      case "publicado":
        return ["guardar", "archivar"];
      case "archivado":
        return ["guardar", "publicar"];
    }
  }

  // Ingeniero.
  if (tipo === "promocion") {
    switch (estado) {
      case "borrador":
      case "archivado":
        return ["guardar", "enviar"];
      case "en_revision":
        return [];
      case "publicado":
        return ["guardar", "archivar"];
    }
  }

  return estado === "publicado" ? ["guardar", "archivar"] : ["guardar", "publicar"];
}

/**
 * Una novedad nueva no tiene tipo hasta que se elige, así que el ingeniero ve
 * «Enviar a revisión» también cuando al final escribe un aviso. Un aviso no se
 * revisa: para él, enviar es publicar.
 */
export function intencionEfectiva(rol: Rol, tipo: TipoNovedad, intencion: Intencion): Intencion {
  return rol === "ingeniero" && tipo !== "promocion" && intencion === "enviar"
    ? "publicar"
    : intencion;
}

export function estadoTras(intencion: Intencion, actual: EstadoPublicacion): EstadoPublicacion {
  switch (intencion) {
    case "guardar":
      return actual;
    case "enviar":
      return "en_revision";
    case "publicar":
      return "publicado";
    case "devolver":
      return "borrador";
    case "archivar":
      return "archivado";
  }
}
