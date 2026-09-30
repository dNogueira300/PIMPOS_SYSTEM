import Link from "next/link";
import { Suspense } from "react";

import { EncabezadoPanel } from "@/components/panel/encabezado-panel";
import { exigirAcceso } from "@/lib/auth/sesion";
import { seccionesPara } from "@/lib/panel/navegacion";
import { crearClienteServidor } from "@/lib/supabase/servidor";

export default function Inicio({ searchParams }: PageProps<"/admin">) {
  return (
    <Suspense fallback={null}>
      <InicioConSesion searchParams={searchParams} />
    </Suspense>
  );
}

async function InicioConSesion({
  searchParams,
}: {
  searchParams: PageProps<"/admin">["searchParams"];
}) {
  // `searchParams` es una Promise en Next 16, y se espera DENTRO del Suspense.
  const { motivo } = await searchParams;
  const sesion = await exigirAcceso("/admin");
  const secciones = seccionesPara(sesion.rol).filter((s) => s.ruta !== "/admin");
  const avisos = await contarAvisos(sesion.rol, sesion.usuarioId);

  return (
    <>
      <EncabezadoPanel titulo="Inicio" />
      {motivo === "sin-acceso" ? (
        <p role="status" className="bg-alerta/15 mb-4 rounded-xl p-3 text-sm">
          Esa sección no está disponible para tu rol.
        </p>
      ) : null}

      {avisos.length > 0 ? (
        <section aria-labelledby="avisos" className="mb-6 flex flex-col gap-2">
          <h2 id="avisos" className="font-semibold">
            Para revisar
          </h2>
          {avisos.map((aviso) => (
            <Link
              key={aviso.ruta}
              href={aviso.ruta}
              data-aviso={aviso.clave}
              className="bg-card flex min-h-12 items-center rounded-xl border p-4"
            >
              {aviso.texto}
            </Link>
          ))}
        </section>
      ) : null}

      <section aria-labelledby="atajos">
        <h2 id="atajos" className="mb-2 font-semibold">
          Tus secciones
        </h2>
        <ul className="grid gap-2 sm:grid-cols-2">
          {secciones.map((s) => (
            <li key={s.ruta}>
              <Link
                href={s.ruta}
                data-seccion={s.nombre}
                className="tarjeta flex min-h-16 items-center p-4 font-semibold"
              >
                {s.nombre}
              </Link>
            </li>
          ))}
        </ul>
        {secciones.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            Por ahora tu rol no tiene secciones en el panel. Pide a un administrador que revise tu
            cuenta.
          </p>
        ) : null}
      </section>
    </>
  );
}

type Aviso = { clave: string; texto: string; ruta: string };

/**
 * Cada tarea que añade algo que revisar añade aquí su cuenta. T1 trae la de
 * datos por confirmar; T4, las de promociones; T5 de F5, las de insumos y
 * bajas; F6, la de clientes para revisar.
 */
async function contarAvisos(rol: string, usuarioId: string): Promise<Aviso[]> {
  const supabase = await crearClienteServidor();
  const avisos: Aviso[] = [];

  if (rol === "superadmin" || rol === "administrador") {
    const { count } = await supabase
      .from("configuracion_sitio")
      .select("clave", { count: "exact", head: true })
      .like("descripcion", "%PENDIENTE%");
    if (count && count > 0) {
      avisos.push({
        clave: "pendientes",
        texto: `${count} ${count === 1 ? "dato del sitio está" : "datos del sitio están"} por confirmar`,
        ruta: "/admin/configuracion",
      });
    }

    const { count: enRevision } = await supabase
      .from("notificaciones")
      .select("id", { count: "exact", head: true })
      .eq("tipo", "promocion_en_revision")
      .is("resuelta_en", null);
    if (enRevision && enRevision > 0) {
      avisos.unshift({
        clave: "promociones-en-revision",
        texto: `${enRevision} ${enRevision === 1 ? "promoción espera" : "promociones esperan"} tu aprobación`,
        ruta: "/admin/contenido/novedades",
      });
    }

    const { count: bajas } = await supabase
      .from("solicitudes_baja")
      .select("id", { count: "exact", head: true })
      .eq("estado", "pendiente");
    if (bajas && bajas > 0) {
      avisos.unshift({
        clave: "bajas-pendientes",
        texto: `${bajas} ${bajas === 1 ? "baja espera" : "bajas esperan"} tu aprobación`,
        ruta: "/admin/insumos/bajas",
      });
    }

    const { count: paraRevisar } = await supabase
      .from("clientes_para_revisar")
      .select("id", { count: "exact", head: true });
    if (paraRevisar && paraRevisar > 0) {
      avisos.push({
        clave: "clientes-para-revisar",
        texto: `${paraRevisar} ${paraRevisar === 1 ? "cliente lleva" : "clientes llevan"} dos años sin cambios`,
        ruta: "/admin/clientes/revisar",
      });
    }
  }

  if (rol === "superadmin" || rol === "administrador" || rol === "ingeniero") {
    const [{ count: bajo }, { count: vencer }] = await Promise.all([
      supabase
        .from("existencias_insumo")
        .select("id", { count: "exact", head: true })
        .eq("activo", true)
        .eq("bajo_minimo", true),
      supabase
        .from("existencias_insumo")
        .select("id", { count: "exact", head: true })
        .eq("activo", true)
        .eq("por_vencer", true),
    ]);
    if (bajo && bajo > 0) {
      avisos.push({
        clave: "insumos-bajo-minimo",
        texto: `${bajo} ${bajo === 1 ? "insumo está" : "insumos están"} bajo el mínimo`,
        ruta: "/admin/insumos?ver=bajo",
      });
    }
    if (vencer && vencer > 0) {
      avisos.push({
        clave: "insumos-por-vencer",
        texto: `${vencer} ${vencer === 1 ? "insumo tiene" : "insumos tienen"} algo por vencer`,
        ruta: "/admin/insumos?ver=vencer",
      });
    }
  }

  if (rol === "ingeniero") {
    const { count: devueltas } = await supabase
      .from("novedades")
      .select("id", { count: "exact", head: true })
      .eq("tipo", "promocion")
      .eq("estado", "borrador")
      .not("comentario_revision", "is", null)
      .eq("created_by", usuarioId)
      .is("deleted_at", null);
    if (devueltas && devueltas > 0) {
      avisos.push({
        clave: "promociones-devueltas",
        texto: `${devueltas} ${devueltas === 1 ? "promoción tuya fue devuelta" : "promociones tuyas fueron devueltas"} con comentario`,
        ruta: "/admin/contenido/novedades",
      });
    }

    const { count: rechazadas } = await supabase
      .from("solicitudes_baja")
      .select("id", { count: "exact", head: true })
      .eq("estado", "rechazada")
      .eq("solicitado_por", usuarioId)
      .gte("resuelto_en", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());
    if (rechazadas && rechazadas > 0) {
      avisos.push({
        clave: "bajas-rechazadas",
        texto: `${rechazadas} ${rechazadas === 1 ? "baja tuya fue rechazada" : "bajas tuyas fueron rechazadas"} esta semana`,
        ruta: "/admin/insumos/bajas",
      });
    }
  }

  return avisos;
}
