export type UnidadDeLinea = { id: string; codigo: string; nombre: string };

export type InsumoParaLinea = {
  id: string;
  nombre: string;
  es_perecible: boolean;
  unidades: UnidadDeLinea[];
};
