import { Plus } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";

import { BotonesContacto } from "@/components/panel/botones-contacto";
import { BuscadorEnVivo } from "@/components/panel/buscador-en-vivo";
import { EncabezadoPanel } from "@/components/panel/encabezado-panel";
import { ListaAdaptable } from "@/components/panel/lista-adaptable";
import { MapaClientes } from "@/components/panel/mapa-clientes";
import { exigirAcceso } from "@/lib/auth/sesion";
import { buscarClientes, type ClienteDeLista, zonasActivas } from "@/lib/clientes/datos";

const RUTA = "/admin/clientes";
// `buscar_clientes` (0042) devuelve como mucho 200: si llega, se dice.
const TOPE_BUSQUEDA = 200;

export default function Clientes({ searchParams }: PageProps<"/admin/clientes">) {
  return (
    <Suspense fallback={<p className="text-muted-foreground text-sm">Cargando…</p>}>
      <Contenido searchParams={searchParams} />
    </Suspense>
  );
}

async function Contenido({
  searchParams,
}: {
  searchParams: PageProps<"/admin/clientes">["searchParams"];
}) {
  const [{ q, zona, estado, vista }, sesion] = await Promise.all([
    searchParams,
    exigirAcceso(RUTA),
  ]);
  const texto = typeof q === "string" ? q : "";
  const filtroZona = typeof zona === "string" ? zona : "";
  const encargado = sesion.rol !== "repartidor";
  // Solo los encargados ven los desactivados (decisión 3).
  const verDesactivados = encargado && estado === "desactivados";
  const enMapa = vista === "mapa";

  const [clientes, zonas] = await Promise.all([
    buscarClientes({ texto, zona: filtroZona, activos: !verDesactivados }),
    zonasActivas(),
  ]);

  const parametros = new URLSearchParams({
    ...(texto ? { q: texto } : {}),
    ...(filtroZona ? { zona: filtroZona } : {}),
    ...(verDesactivados ? { estado: "desactivados" } : {}),
  });
  const enlaceVista = (v: "lista" | "mapa") => {
    const p = new URLSearchParams(parametros);
    if (v === "mapa") p.set("vista", "mapa");
    return `${RUTA}${p.size ? `?${p}` : ""}`;
  };

  return (
    <>
      <EncabezadoPanel
        titulo="Clientes"
        descripcion="Para el reparto: busca por nombre o celular, filtra por zona, llama, escribe o mira cómo llegar."
        accion={
          encargado ? (
            <Link href={`${RUTA}/nuevo`} className="boton-cta">
              <Plus aria-hidden className="size-5" /> Nuevo cliente
            </Link>
          ) : null
        }
      />

      <BuscadorEnVivo
        nombre="q"
        etiqueta="Buscar cliente"
        placeholder="Nombre o celular"
        valor={texto}
        conservar={enMapa ? { vista: "mapa" } : {}}
        filtros={[
          {
            nombre: "zona",
            etiqueta: "Zona",
            valor: filtroZona,
            opciones: [
              { valor: "", nombre: "Todas las zonas" },
              ...zonas.map((z) => ({ valor: z.id, nombre: z.nombre })),
            ],
          },
          ...(encargado
            ? [
                {
                  nombre: "estado",
                  etiqueta: "Mostrar",
                  valor: verDesactivados ? "desactivados" : "",
                  opciones: [
                    { valor: "", nombre: "Activos" },
                    { valor: "desactivados", nombre: "Desactivados" },
                  ],
                },
              ]
            : []),
        ]}
      />

      <nav aria-label="Ver como" className="mb-4 flex gap-2">
        <Link
          href={enlaceVista("lista")}
          className={enMapa ? "boton-linea" : "boton-cta"}
          aria-current={enMapa ? undefined : "page"}
        >
          Lista
        </Link>
        <Link
          href={enlaceVista("mapa")}
          className={enMapa ? "boton-cta" : "boton-linea"}
          aria-current={enMapa ? "page" : undefined}
        >
          Mapa
        </Link>
      </nav>

      {clientes !== null && clientes.length >= TOPE_BUSQUEDA ? (
        <p role="status" className="bg-muted mb-4 rounded-xl p-3 text-sm" data-tope>
          Se muestran los primeros {TOPE_BUSQUEDA}. Escribe un nombre o elige una zona para ver los
          demás.
        </p>
      ) : null}

      {clientes === null ? (
        <p role="alert">No se pudieron cargar los clientes. Recarga la página.</p>
      ) : enMapa ? (
        <VistaMapa clientes={clientes} />
      ) : (
        <ListaAdaptable
          etiqueta="Clientes"
          filas={clientes}
          enlace={(c) => `${RUTA}/${c.id}`}
          editar={(c) => `${RUTA}/${c.id}/${encargado ? "editar" : "corregir"}`}
          etiquetaEditar={encargado ? "Editar" : "Corregir"}
          columnas={[
            { titulo: "Nombre", celda: (c) => c.nombre_completo, principal: true },
            { titulo: "Zona", celda: (c) => c.zona ?? "Sin zona" },
            {
              titulo: "Dirección",
              celda: (c) => (c.referencia ? `${c.direccion} · ${c.referencia}` : c.direccion),
            },
          ]}
          acciones={(c) => (
            <BotonesContacto
              nombre={c.nombre_completo}
              celular={c.celular}
              latitud={c.latitud}
              longitud={c.longitud}
            />
          )}
          vacio={
            texto || filtroZona ? (
              <p>Ningún cliente coincide con la búsqueda.</p>
            ) : (
              <p>
                Todavía no hay clientes.
                {encargado ? " Registra el primero con «Nuevo cliente»." : ""}
              </p>
            )
          }
        />
      )}
    </>
  );
}

function VistaMapa({ clientes }: { clientes: ClienteDeLista[] }) {
  const conPunto = clientes.flatMap((c) =>
    c.latitud !== null && c.longitud !== null
      ? [{ id: c.id, nombre: c.nombre_completo, latitud: c.latitud, longitud: c.longitud }]
      : [],
  );
  const sinPunto = clientes.length - conPunto.length;
  return (
    <>
      {conPunto.length > 0 ? (
        <MapaClientes clientes={conPunto} />
      ) : (
        <p className="bg-card rounded-xl border p-6 text-center">
          Ningún cliente de esta lista tiene su casa marcada en el mapa.
        </p>
      )}
      {sinPunto > 0 ? (
        <p className="text-muted-foreground mt-2 text-sm" data-sin-punto>
          {sinPunto} {sinPunto === 1 ? "cliente no tiene" : "clientes no tienen"} punto en el mapa:
          están en la lista.
        </p>
      ) : null}
    </>
  );
}
