import { Plus } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";

import { BuscadorEnVivo } from "@/components/panel/buscador-en-vivo";
import { ConfirmarBorrado } from "@/components/panel/confirmar-borrado";
import { EncabezadoPanel } from "@/components/panel/encabezado-panel";
import { EtiquetaEstado } from "@/components/panel/etiqueta-estado";
import { ListaAdaptable } from "@/components/panel/lista-adaptable";
import { borrarProducto } from "@/lib/acciones/productos";
import { exigirAcceso } from "@/lib/auth/sesion";
import { formatearPrecio } from "@/lib/datos/catalogo";
import { crearClienteServidor } from "@/lib/supabase/servidor";

const RUTA = "/admin/contenido/productos";

export default function Productos({ searchParams }: PageProps<"/admin/contenido/productos">) {
  return (
    <>
      <EncabezadoPanel
        titulo="Productos"
        volver={{ ruta: "/admin/contenido", nombre: "Contenido" }}
        accion={
          <Link href={`${RUTA}/nuevo`} className="boton-cta">
            <Plus aria-hidden className="size-5" /> Nuevo producto
          </Link>
        }
      />
      <Suspense fallback={<p className="text-muted-foreground text-sm">Cargando…</p>}>
        <Lista searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function Lista({
  searchParams,
}: {
  searchParams: PageProps<"/admin/contenido/productos">["searchParams"];
}) {
  const { q, categoria } = await searchParams;
  await exigirAcceso(RUTA);
  const supabase = await crearClienteServidor();

  const buscar = typeof q === "string" ? q.trim() : "";
  const filtro = typeof categoria === "string" ? categoria : "";

  let consulta = supabase
    .from("productos")
    .select(
      "id, nombre, estado, orden, categoria_id, categorias_producto(nombre), producto_variantes(precio, es_predeterminada, deleted_at)",
    )
    .is("deleted_at", null)
    .order("orden")
    .order("nombre");
  if (buscar) consulta = consulta.ilike("nombre", `%${buscar}%`);
  if (filtro) consulta = consulta.eq("categoria_id", filtro);

  const [{ data, error }, { data: categorias }] = await Promise.all([
    consulta,
    supabase.from("categorias_producto").select("id, nombre").is("deleted_at", null).order("orden"),
  ]);

  if (error) return <p role="alert">No se pudieron cargar los productos. Recarga la página.</p>;

  const filas = data.map((p) => {
    const predeterminada = p.producto_variantes.find(
      (v) => v.es_predeterminada && v.deleted_at === null,
    );
    return {
      id: p.id,
      nombre: p.nombre,
      estado: p.estado,
      categoria: p.categorias_producto?.nombre ?? "—",
      precio: predeterminada ? formatearPrecio(Number(predeterminada.precio)) : "Sin precio",
    };
  });

  return (
    <>
      <BuscadorEnVivo
        nombre="q"
        etiqueta="Buscar producto"
        placeholder="Buscar por nombre"
        valor={buscar}
        filtros={[
          {
            nombre: "categoria",
            etiqueta: "Categoría",
            valor: filtro,
            opciones: [
              { valor: "", nombre: "Todas las categorías" },
              ...(categorias ?? []).map((c) => ({ valor: c.id, nombre: c.nombre })),
            ],
          },
        ]}
      />

      <ListaAdaptable
        etiqueta="Productos del catálogo"
        filas={filas}
        enlace={(p) => `${RUTA}/${p.id}`}
        editar={(p) => `${RUTA}/${p.id}`}
        columnas={[
          { titulo: "Nombre", celda: (p) => p.nombre, principal: true },
          { titulo: "Categoría", celda: (p) => p.categoria },
          {
            titulo: "Precio",
            celda: (p) => <span className="text-precio font-semibold">{p.precio}</span>,
          },
          { titulo: "Estado", celda: (p) => <EtiquetaEstado estado={p.estado} /> },
        ]}
        acciones={(p) => (
          <ConfirmarBorrado
            nombre={`el producto ${p.nombre}`}
            accion={borrarProducto.bind(null, p.id)}
          />
        )}
        vacio={
          buscar || filtro ? (
            <p>Ningún producto coincide con la búsqueda.</p>
          ) : (
            <p>Todavía no hay productos. Crea el primero con «Nuevo producto».</p>
          )
        }
      />
    </>
  );
}
