export const NOMBRE_TIPO: Readonly<Record<string, string>> = {
  ingreso: "Ingreso",
  consumo: "Consumo",
  baja: "Baja",
  ajuste: "Conteo",
  anulacion: "Anulación",
};

export const NOMBRE_MOTIVO: Readonly<Record<string, string>> = {
  merma: "Merma o desperdicio",
  vencimiento: "Vencimiento",
  danado: "Producto dañado",
  devolucion_proveedor: "Devolución al proveedor",
  consumo_interno: "Consumo del personal",
};

type FilaKardex = {
  tipo: string;
  proveedor: string | null;
  documento: string | null;
  destino_lote: string | null;
  area_turno: string | null;
  motivo_baja: string | null;
  observacion: string | null;
};

const unir = (...partes: (string | null)[]) => partes.filter(Boolean).join(" · ");

/** Una línea que explica el movimiento a quien lee el kárdex. */
export function detalleDeMovimiento(f: FilaKardex): string {
  switch (f.tipo) {
    case "ingreso":
      return unir(f.proveedor, f.documento);
    case "consumo":
      return unir(f.destino_lote, f.area_turno);
    case "baja":
      return f.motivo_baja ? (NOMBRE_MOTIVO[f.motivo_baja] ?? f.motivo_baja) : "";
    case "anulacion":
      return `Anula un registro: ${f.observacion ?? ""}`.trim();
    default:
      return f.observacion ?? "";
  }
}
