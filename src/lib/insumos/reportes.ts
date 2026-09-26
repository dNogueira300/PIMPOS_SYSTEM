import "server-only";

import { formatearFechaLima } from "@/lib/panel/hora-lima";
import { crearClienteServidor } from "@/lib/supabase/servidor";

import type { TipoColumna } from "./formato-reporte";
import { detalleDeMovimiento, NOMBRE_MOTIVO, NOMBRE_TIPO } from "./kardex";
import type { Periodo } from "./periodo";

export type SlugReporte = "existencias" | "consumo" | "compras" | "mermas" | "kardex";
export type Columna = { clave: string; titulo: string; tipo: TipoColumna };
export type Fila = Record<string, string | number | null>;
export type Reporte = {
  slug: SlugReporte;
  titulo: string;
  subtitulo: string;
  columnas: Columna[];
  filas: Fila[];
  total: number | null;
  grafico: { nombre: string; valor: number }[] | null;
  unidadGrafico: "soles" | null;
};

export const REPORTES: Record<
  SlugReporte,
  { titulo: string; descripcion: string; conPeriodo: boolean }
> = {
  existencias: {
    titulo: "Existencias y valorización",
    descripcion: "Cuánto hay de cada insumo y cuánto dinero hay en el almacén.",
    conPeriodo: false,
  },
  consumo: {
    titulo: "Consumo por periodo",
    descripcion: "Qué se usó y cuánto costó.",
    conPeriodo: true,
  },
  compras: {
    titulo: "Compras por proveedor",
    descripcion: "Qué se compró a cada proveedor y cuánto se pagó.",
    conPeriodo: true,
  },
  mermas: {
    titulo: "Mermas y pérdidas",
    descripcion: "Lo que se perdió, por motivo, y cuánto costó.",
    conPeriodo: true,
  },
  kardex: {
    titulo: "Kárdex de un insumo",
    descripcion: "Cada entrada y salida de un insumo, con lo que quedaba después.",
    conPeriodo: true,
  },
};

export function esSlugReporte(valor: string): valor is SlugReporte {
  return valor in REPORTES;
}

const n = (v: unknown) => (v === null || v === undefined ? 0 : Number(v));
const rango = (p: Periodo) =>
  `Del ${p.desde.split("-").reverse().join("/")} al ${p.hasta.split("-").reverse().join("/")}`;

/** Los diez con más costo, para que el gráfico se lea en un celular. */
const primeros = (datos: { nombre: string; valor: number }[]) =>
  [...datos].sort((a, b) => b.valor - a.valor).slice(0, 10);

export async function leerReporte(
  slug: SlugReporte,
  periodo: Periodo,
  insumoId?: string,
): Promise<Reporte> {
  const supabase = await crearClienteServidor();
  const { titulo } = REPORTES[slug];

  switch (slug) {
    case "existencias": {
      const { data, error } = await supabase.rpc("reporte_existencias");
      if (error) throw new Error(error.message);
      const filas = data.map((f) => ({
        insumo: f.nombre,
        cantidad: n(f.cantidad_base),
        unidad: f.unidad,
        minimo: n(f.stock_minimo),
        valor: f.sin_costo ? null : n(f.valor),
      }));
      return {
        slug,
        titulo,
        subtitulo: "Hoy",
        columnas: [
          { clave: "insumo", titulo: "Insumo", tipo: "texto" },
          { clave: "cantidad", titulo: "Hay", tipo: "cantidad" },
          { clave: "unidad", titulo: "Unidad", tipo: "texto" },
          { clave: "minimo", titulo: "Mínimo", tipo: "cantidad" },
          { clave: "valor", titulo: "Valor", tipo: "soles" },
        ],
        filas,
        total: data.reduce((s, f) => s + n(f.valor), 0),
        grafico: null,
        unidadGrafico: null,
      };
    }
    case "consumo": {
      const { data, error } = await supabase.rpc("reporte_consumo", {
        p_desde: periodo.desde,
        p_hasta: periodo.hasta,
      });
      if (error) throw new Error(error.message);
      return {
        slug,
        titulo,
        subtitulo: rango(periodo),
        columnas: [
          { clave: "insumo", titulo: "Insumo", tipo: "texto" },
          { clave: "cantidad", titulo: "Se usó", tipo: "cantidad" },
          { clave: "unidad", titulo: "Unidad", tipo: "texto" },
          { clave: "costo", titulo: "Costo", tipo: "soles" },
        ],
        filas: data.map((f) => ({
          insumo: f.nombre,
          cantidad: n(f.cantidad_base),
          unidad: f.unidad,
          costo: n(f.costo),
        })),
        total: data.reduce((s, f) => s + n(f.costo), 0),
        grafico: primeros(data.map((f) => ({ nombre: f.nombre, valor: n(f.costo) }))),
        unidadGrafico: "soles",
      };
    }
    case "compras": {
      const { data, error } = await supabase.rpc("reporte_compras", {
        p_desde: periodo.desde,
        p_hasta: periodo.hasta,
      });
      if (error) throw new Error(error.message);
      const porProveedor = new Map<string, number>();
      for (const f of data)
        porProveedor.set(f.proveedor, (porProveedor.get(f.proveedor) ?? 0) + n(f.costo));
      return {
        slug,
        titulo,
        subtitulo: rango(periodo),
        columnas: [
          { clave: "proveedor", titulo: "Proveedor", tipo: "texto" },
          { clave: "insumo", titulo: "Insumo", tipo: "texto" },
          { clave: "cantidad", titulo: "Cantidad", tipo: "cantidad" },
          { clave: "unidad", titulo: "Unidad", tipo: "texto" },
          { clave: "costo", titulo: "Pagado", tipo: "soles" },
        ],
        filas: data.map((f) => ({
          proveedor: f.proveedor,
          insumo: f.insumo,
          cantidad: n(f.cantidad_base),
          unidad: f.unidad,
          costo: n(f.costo),
        })),
        total: data.reduce((s, f) => s + n(f.costo), 0),
        grafico: primeros([...porProveedor].map(([nombre, valor]) => ({ nombre, valor }))),
        unidadGrafico: "soles",
      };
    }
    case "mermas": {
      const { data, error } = await supabase.rpc("reporte_mermas", {
        p_desde: periodo.desde,
        p_hasta: periodo.hasta,
      });
      if (error) throw new Error(error.message);
      const porMotivo = new Map<string, number>();
      for (const f of data) {
        const nombre = NOMBRE_MOTIVO[f.motivo] ?? f.motivo;
        porMotivo.set(nombre, (porMotivo.get(nombre) ?? 0) + n(f.costo));
      }
      return {
        slug,
        titulo,
        subtitulo: rango(periodo),
        columnas: [
          { clave: "motivo", titulo: "Motivo", tipo: "texto" },
          { clave: "insumo", titulo: "Insumo", tipo: "texto" },
          { clave: "cantidad", titulo: "Cantidad", tipo: "cantidad" },
          { clave: "unidad", titulo: "Unidad", tipo: "texto" },
          { clave: "costo", titulo: "Costo", tipo: "soles" },
        ],
        filas: data.map((f) => ({
          motivo: NOMBRE_MOTIVO[f.motivo] ?? f.motivo,
          insumo: f.insumo,
          cantidad: n(f.cantidad_base),
          unidad: f.unidad,
          costo: n(f.costo),
        })),
        total: data.reduce((s, f) => s + n(f.costo), 0),
        grafico: primeros([...porMotivo].map(([nombre, valor]) => ({ nombre, valor }))),
        unidadGrafico: "soles",
      };
    }
    case "kardex": {
      if (!insumoId) {
        return {
          slug,
          titulo,
          subtitulo: "Elige un insumo",
          columnas: [],
          filas: [],
          total: null,
          grafico: null,
          unidadGrafico: null,
        };
      }
      const [{ data: insumo }, { data, error }] = await Promise.all([
        supabase.from("insumos").select("nombre").eq("id", insumoId).maybeSingle(),
        supabase.rpc("kardex_insumo", {
          p_insumo: insumoId,
          p_desde: periodo.desde,
          p_hasta: periodo.hasta,
        }),
      ]);
      if (error) throw new Error(error.message);
      return {
        slug,
        titulo: `${titulo}: ${insumo?.nombre ?? ""}`,
        subtitulo: rango(periodo),
        columnas: [
          { clave: "fecha", titulo: "Fecha", tipo: "texto" },
          { clave: "movimiento", titulo: "Movimiento", tipo: "texto" },
          { clave: "detalle", titulo: "Detalle", tipo: "texto" },
          { clave: "cantidad", titulo: "Cantidad", tipo: "cantidad" },
          { clave: "saldo", titulo: "Queda", tipo: "cantidad" },
          { clave: "responsable", titulo: "Registró", tipo: "texto" },
        ],
        filas: (data ?? []).map((m) => ({
          fecha: formatearFechaLima(m.ocurrido_en),
          movimiento: `${NOMBRE_TIPO[m.tipo] ?? m.tipo}${m.anulado ? " (anulado)" : ""}`,
          detalle: detalleDeMovimiento(m),
          cantidad: m.sentido * n(m.cantidad_base),
          saldo: n(m.saldo),
          responsable: m.responsable,
        })),
        total: null,
        grafico: null,
        unidadGrafico: null,
      };
    }
  }
}
