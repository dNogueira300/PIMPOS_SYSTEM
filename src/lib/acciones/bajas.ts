"use server";

import { after } from "next/server";
import * as z from "zod";

import { enviarCorreo } from "@/lib/correo/enviar";
import { RUTA_INSUMOS } from "@/lib/insumos/rutas";
import { ejecutarAccion, type EstadoAccion } from "@/lib/panel/accion";
import { urlAbsoluta } from "@/lib/sitio";
import { esquemaBaja, leerBaja } from "@/lib/validaciones/baja";

const RUTA = `${RUTA_INSUMOS}/bajas`;

export async function pedirBaja(fd: FormData): Promise<EstadoAccion> {
  const resultado = await ejecutarAccion({
    ruta: `${RUTA}/nueva`,
    esquema: esquemaBaja,
    entrada: leerBaja(fd),
    entidad: "una baja",
    etiquetas: [],
    mensajeOk: "Baja pedida. Se descuenta cuando un administrador la apruebe.",
    hacer: async (d, { supabase }) => {
      const linea = d.lineas[0]!;
      const { data, error } = await supabase
        .from("solicitudes_baja")
        .insert({
          insumo_id: linea.insumo_id,
          cantidad: Number(linea.cantidad),
          unidad_id: linea.unidad_id,
          lote_id: linea.lote_id,
          motivo_baja: d.motivo_baja,
          observacion: d.observacion,
        })
        .select("id")
        .single();
      return { error, id: data?.id };
    },
  });
  // `after`: el correo sale cuando la respuesta ya se fue, así que un correo
  // lento no hace esperar a nadie. Es un segundo canal: el aviso del panel
  // (0038) no cambia.
  if (resultado.estado === "ok") {
    const enlace = urlAbsoluta(RUTA);
    after(() =>
      enviarCorreo({
        asunto: "Pimpo's: una baja espera tu aprobación",
        texto: `Alguien pidió dar de baja un insumo. Revísala en ${enlace}`,
        html: `<p>Alguien pidió dar de baja un insumo. <a href="${enlace}">Revísala en el panel</a>.</p>`,
      }),
    );
  }
  return resultado;
}

export async function aprobarBaja(id: string): Promise<EstadoAccion> {
  return ejecutarAccion({
    ruta: RUTA,
    esquema: z.object({ id: z.uuid() }),
    entrada: { id },
    entidad: "la baja",
    etiquetas: [],
    mensajeOk: "Baja aprobada. Ya se descontó del almacén.",
    hacer: async ({ id }, { supabase }) => {
      const { error } = await supabase.rpc("aprobar_baja", { p_id: id });
      return { error };
    },
  });
}

export async function rechazarBaja(id: string, fd: FormData): Promise<EstadoAccion> {
  return ejecutarAccion({
    ruta: RUTA,
    esquema: z.object({
      id: z.uuid(),
      comentario: z.string().trim().min(1, { error: "Escribe por qué la rechazas." }).max(300),
    }),
    entrada: { id, comentario: fd.get("comentario") ?? "" },
    entidad: "la baja",
    etiquetas: [],
    mensajeOk: "Baja rechazada. El ingeniero verá tu comentario.",
    hacer: async ({ id, comentario }, { supabase }) => {
      const { error } = await supabase.rpc("rechazar_baja", { p_id: id, p_comentario: comentario });
      return { error };
    },
  });
}
