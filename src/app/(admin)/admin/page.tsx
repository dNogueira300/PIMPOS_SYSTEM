import Link from "next/link";
import { Suspense } from "react";
import { ArrowRight, ArrowUpRight } from "lucide-react";

import { AccesoInicio } from "@/components/panel/acceso-inicio";
import { EncabezadoPanel } from "@/components/panel/encabezado-panel";
import { ListaDeCambios } from "@/components/panel/lista-de-cambios";
import { resolverNombres, ultimosCambios } from "@/lib/auditoria/datos";
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
  const administracion = sesion.rol === "superadmin" || sesion.rol === "administrador";
  const recientes = administracion ? await ultimosCambios(5) : [];
  const nombres = await resolverNombres(recientes);

  return (
    <>
      <EncabezadoPanel
        titulo="Inicio"
        descripcion={
          administracion
            ? "Revisiones pendientes, tus secciones y los últimos cambios."
            : "Tus revisiones pendientes y secciones del panel."
        }
      />
      {motivo === "sin-acceso" ? (
        <p role="status" className="bg-alerta/15 mb-4 rounded-md p-3 text-sm">
          Esa sección no está disponible para tu rol.
        </p>
      ) : null}

      {avisos.length > 0 ? (
        <section aria-labelledby="avisos" className="mb-8">
          <h2 id="avisos" className="mb-3 text-xl font-semibold tracking-[-0.025em]">
            Para revisar
          </h2>
          <div className="grid gap-3 lg:grid-cols-3 xl:gap-4">
            {avisos.map((aviso) => {
              const partes = aviso.texto.match(/^(\d+)\s(.+)$/u);
              return (
                <Link
                  key={aviso.ruta}
                  href={aviso.ruta}
                  data-aviso={aviso.clave}
                  aria-label={aviso.texto}
                  className="bg-card hover:border-primary relative grid min-h-[84px] grid-cols-[minmax(56px,auto)_minmax(0,1fr)] items-center gap-2 rounded-md border p-[18px] pr-11 lg:min-h-[146px] lg:grid-cols-1 lg:content-start lg:items-start lg:pr-[18px] xl:p-[22px]"
                >
                  {partes ? (
                    <>
                      <span className="text-primary text-[34px] leading-[1.1] font-semibold tracking-[-0.045em] tabular-nums lg:text-[40px]">
                        {partes[1]}
                      </span>{" "}
                      <span className="text-sm wrap-anywhere lg:mt-3 lg:max-w-[24ch]">
                        {partes[2]}
                      </span>
                    </>
                  ) : (
                    <span className="col-span-full pr-5 text-sm wrap-anywhere">{aviso.texto}</span>
                  )}
                  <ArrowUpRight
                    aria-hidden
                    className="text-primary absolute top-[calc(50%-10px)] right-3.5 size-5 lg:top-5 lg:right-[18px]"
                  />
                </Link>
              );
            })}
          </div>
        </section>
      ) : null}

      <div
        className={`grid items-start gap-7 ${administracion && recientes.length > 0 ? "xl:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]" : ""}`}
      >
        <section aria-labelledby="atajos" className="min-w-0">
          <h2 id="atajos" className="mb-3 text-xl font-semibold tracking-[-0.025em]">
            Tus secciones
          </h2>
          <ul
            className={`grid grid-cols-2 gap-3 ${administracion && recientes.length > 0 ? "lg:grid-cols-3 xl:grid-cols-2" : "lg:grid-cols-3"}`}
          >
            {secciones.map((s) => (
              <li key={s.ruta}>
                <AccesoInicio seccion={s} />
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
        {administracion && recientes.length > 0 ? (
          <section
            aria-labelledby="actividad"
            className="actividad-inicio min-w-0"
            data-actividad-reciente
          >
            <h2 id="actividad" className="mb-3 text-xl font-semibold tracking-[-0.025em]">
              Actividad reciente
            </h2>
            <ListaDeCambios cambios={recientes} nombres={nombres} etiqueta="Los últimos cambios" />
            <p className="mt-3">
              <Link href="/admin/auditoria" className="boton-linea flex w-full justify-center">
                Ver todo el historial
                <ArrowRight aria-hidden className="size-5" />
              </Link>
            </p>
          </section>
        ) : null}
      </div>
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
