export type UnidadDeLinea = { id: string; codigo: string; nombre: string };

/** Un lote con existencias, para elegir de cuál sale una baja. */
export type LoteDeLinea = { id: string; descripcion: string };

export type InsumoParaLinea = {
  id: string;
  nombre: string;
  es_perecible: boolean;
  unidades: UnidadDeLinea[];
  /** Solo en la baja, y solo de los insumos que vencen. */
  lotes?: LoteDeLinea[];
};
