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
            Por ahora tu rol no tiene secciones en el panel. Clientes llega pronto.
          </p>
        ) : null}
      </section>
    </>
  );
}

type Aviso = { clave: string; texto: string; ruta: string };

/**
 * Cada tarea que añade algo que revisar añade aquí su cuenta. T1 trae la de
 * datos por confirmar; T4, las de promociones.
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
  }

  return avisos;
}
