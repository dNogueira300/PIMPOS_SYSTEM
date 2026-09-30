import type { TablaExportable } from "@/lib/insumos/formato-reporte";

import { celularParaLeer } from "./contacto";

export type FilaExportable = {
  nombre_completo: string;
  celular: string;
  direccion: string;
  referencia: string | null;
  zona: string | null;
  con_punto: boolean;
  activo: boolean;
};

/**
 * La lista para el Excel y el PDF. Sin fotos ni coordenadas (decisión 6):
 * solo si tiene punto, que es lo que sirve para repartir en papel.
 */
export function clientesATabla(filas: FilaExportable[], subtitulo: string): TablaExportable {
  return {
    titulo: "Clientes",
    subtitulo,
    columnas: [
      { clave: "cliente", titulo: "Cliente", tipo: "texto" },
      { clave: "celular", titulo: "Celular", tipo: "texto" },
      { clave: "direccion", titulo: "Dirección", tipo: "texto" },
      { clave: "referencia", titulo: "Referencia", tipo: "texto" },
      { clave: "zona", titulo: "Zona", tipo: "texto" },
      { clave: "punto", titulo: "Punto en el mapa", tipo: "texto" },
    ],
    filas: filas.map((c) => ({
      cliente: c.nombre_completo,
      celular: celularParaLeer(c.celular),
      direccion: c.direccion,
      referencia: c.referencia,
      zona: c.zona ?? "Sin zona",
      punto: c.con_punto ? "Sí" : "No",
    })),
    total: null,
    sinCosto: filas.map(() => false),
    hayCostosDesconocidos: false,
    vacio: "No hay clientes con ese filtro.",
  };
}
