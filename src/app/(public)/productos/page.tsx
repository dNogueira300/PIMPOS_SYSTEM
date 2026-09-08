import type { Metadata } from "next";
import { Suspense, type CSSProperties } from "react";

import { EncabezadoSeccion } from "@/components/publico/encabezado-seccion";
import { FiltroCategorias } from "@/components/publico/filtro-categorias";
import { TarjetaProducto } from "@/components/publico/tarjeta-producto";
import { listarCategorias, listarProductos } from "@/lib/datos/catalogo";

export const metadata: Metadata = {
  title: "Productos",
  description:
    "Catálogo completo de Panadería Pimpo's en Iquitos: panes, panes especiales, integrales, dulces y abarrotes, con todos los precios a la vista desde S/ 0.10.",
};

/**
 * Catalogo (doc 03 §4.1, prioridad 2 de la ficha).
 *
 * La cascara de la pagina se prerenderiza y solo la parte que depende del
 * filtro llega en streaming: `searchParams` es dato de la peticion y con Cache
 * Components tiene que leerse dentro de un `<Suspense>`.
 */
export default function Productos(props: PageProps<"/productos">) {
  return (
    <>
      <EncabezadoSeccion
        titulo="Nuestros productos"
        entradilla="Todo lo que horneamos, con su precio. Si no encuentras algo, escríbenos por WhatsApp y te decimos si lo tenemos."
      />

      <div className="mx-auto max-w-(--container-contenido) px-4 py-12 sm:px-6">
        <Suspense fallback={<EsqueletoCatalogo />}>
          <Catalogo searchParams={props.searchParams} />
        </Suspense>
      </div>
    </>
  );
}

/**
 * Esqueleto con la forma final, no un spinner: al llegar el contenido la
 * pagina no da un salto, que es lo que hace que se sienta lenta aunque no lo
 * sea.
 */
function EsqueletoCatalogo() {
  return (
    <div aria-hidden className="animate-pulse">
      <div className="bg-secondary h-11 w-full max-w-md rounded-full" />
      <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, indice) => (
          <div key={indice} className="bg-secondary aspect-[4/3] rounded-lg" />
        ))}
      </div>
    </div>
  );
}

async function Catalogo({ searchParams }: Pick<PageProps<"/productos">, "searchParams">) {
  const [{ categoria }, productos, categorias] = await Promise.all([
    searchParams,
    listarProductos(),
    listarCategorias(),
  ]);

  const filtro = typeof categoria === "string" ? categoria : null;
  const visibles = filtro ? productos.filter((p) => p.categoriaSlug === filtro) : productos;
  const nombreCategoria = categorias.find((c) => c.slug === filtro)?.nombre;

  return (
    <>
      <FiltroCategorias categorias={categorias} />

      <p className="text-muted-foreground mt-6 text-sm" role="status">
        {visibles.length === 1 ? "1 producto" : `${visibles.length} productos`}
        {nombreCategoria ? ` en ${nombreCategoria}` : ""}
      </p>

      {visibles.length === 0 ? (
        // Estado vacio con salida: una categoria puede quedarse sin productos
        // publicados, y dejar la pagina en blanco haria pensar que se rompio.
        <div className="border-border/40 mt-8 rounded-lg border border-dashed px-6 py-16 text-center">
          <p className="font-heading text-xl">Todavía no hay productos en esta categoría</p>
          <p className="text-muted-foreground mt-2">
            Escríbenos por WhatsApp y te contamos qué tenemos hoy.
          </p>
        </div>
      ) : (
        <div className="aparece-grupo mt-6 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {visibles.map((producto, indice) => (
            <div key={producto.id} style={{ "--i": indice % 4 } as CSSProperties}>
              <TarjetaProducto producto={producto} />
            </div>
          ))}
        </div>
      )}
    </>
  );
}
