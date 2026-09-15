import type { Database } from "@/tipos/database.types";

// El enum vive en el esquema `app`, que no se expone: el tipo generado aparece
// como unión literal en cada columna, no en `Enums`. Se toma de una de ellas.
export type EstadoPublicacion = Database["public"]["Tables"]["productos"]["Row"]["estado"];

const TEXTO: Record<EstadoPublicacion, string> = {
  borrador: "Borrador",
  en_revision: "En revisión",
  publicado: "Publicado",
  archivado: "Archivado",
};

// Cada estado lleva su palabra además del color: un estado que solo se
// distingue por color no se distingue (doc 03 §3.4).
const CLASES: Record<EstadoPublicacion, string> = {
  borrador: "bg-muted text-foreground",
  en_revision: "bg-alerta/15 text-foreground",
  publicado: "bg-exito/15 text-foreground",
  archivado: "bg-muted text-muted-foreground",
};

export function EtiquetaEstado({ estado }: { estado: EstadoPublicacion }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${CLASES[estado]}`}
      data-estado={estado}
    >
      {TEXTO[estado]}
    </span>
  );
}
