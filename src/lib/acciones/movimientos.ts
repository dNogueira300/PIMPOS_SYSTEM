"use server";

import { ejecutarAccion, type EstadoAccion } from "@/lib/panel/accion";
import { formatearFechaLima } from "@/lib/panel/hora-lima";
import { RUTA_INSUMOS } from "@/lib/insumos/rutas";
import {
  esquemaConsumo,
  esquemaIngreso,
  leerConsumo,
  leerIngreso,
} from "@/lib/validaciones/movimiento";

const lineas = (n: number) => `${n} ${n === 1 ? "insumo" : "insumos"}`;

export async function registrarIngreso(fd: FormData): Promise<EstadoAccion> {
  return ejecutarAccion({
    ruta: `${RUTA_INSUMOS}/ingreso`,
    esquema: esquemaIngreso,
    entrada: leerIngreso(fd),
    entidad: "un ingreso",
    etiquetas: [],
    mensajeOk: "Ingreso registrado.",
    hacer: async (d, { supabase }) => {
      if (!d.confirmar_repetido) {
        const { data: previo, error } = await supabase.rpc("ingreso_registrado", {
          p_proveedor: d.proveedor_id,
          p_numero: d.documento_numero,
        });
        if (error) return { error };
        if (previo) {
          return {
            error: {
              code: "P0001",
              message: `Ese documento de ese proveedor ya se registró el ${formatearFechaLima(previo)}. Si es otro, marca «Es otro documento aunque el número se repita» y guarda.`,
            },
          };
        }
      }
      const { data, error } = await supabase.rpc("registrar_ingreso", {
        p_documento: {
          proveedor_id: d.proveedor_id,
          documento_tipo: d.documento_tipo,
          documento_numero: d.documento_numero,
          observacion: d.observacion,
          ocurrido_en: d.ocurrido_en ?? "",
        },
        p_lineas: d.lineas,
      });
      return { error, mensaje: data ? `Ingreso registrado: ${lineas(data)}.` : undefined };
    },
  });
}

export async function registrarConsumo(fd: FormData): Promise<EstadoAccion> {
  return ejecutarAccion({
    ruta: `${RUTA_INSUMOS}/consumo`,
    esquema: esquemaConsumo,
    entrada: leerConsumo(fd),
    entidad: "un consumo",
    etiquetas: [],
    mensajeOk: "Consumo registrado.",
    hacer: async (d, { supabase }) => {
      const { data, error } = await supabase.rpc("registrar_consumo", {
        p_cabecera: {
          origen_consumo: d.origen_consumo,
          destino_lote: d.destino_lote,
          area_turno: d.area_turno,
          observacion: d.observacion,
          ocurrido_en: d.ocurrido_en ?? "",
        },
        p_lineas: d.lineas,
      });
      return { error, mensaje: data ? `Consumo registrado: ${lineas(data)}.` : undefined };
    },
  });
}
