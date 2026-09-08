import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Croissant } from "lucide-react";

import { TarjetaProducto } from "@/components/publico/tarjeta-producto";
import { describirPrecio, listarProductos, obtenerProducto } from "@/lib/datos/catalogo";
import { enlaceWhatsApp, obtenerConfiguracion } from "@/lib/datos/configuracion";

/**
 * Detalle de producto.
 *
 * `generateStaticParams` tiene que devolver al menos un parametro con Cache
 * Components, asi que se generan los 34 en el build. Son pocos y cambian poco:
 * cuesta menos generarlos todos que decidir cuales.
 */
export async function generateStaticParams() {
  const productos = await listarProductos();
  return productos.map((producto) => ({ slug: producto.slug }));
}

export async function generateMetadata(props: PageProps<"/productos/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  const producto = await obtenerProducto(slug);
  if (!producto) return { title: "Producto no encontrado" };

  const precio = describirPrecio(producto);
  return {
    title: producto.nombre,
    description:
      producto.descripcion ??
      `${producto.nombre} en Panadería Pimpo's, Iquitos${precio ? `. ${precio}` : ""}.`,
  };
}

export default async function DetalleProducto(props: PageProps<"/productos/[slug]">) {
  const { slug } = await props.params;
  const [producto, config, todos] = await Promise.all([
    obtenerProducto(slug),
    obtenerConfiguracion(),
    listarProductos(),
  ]);

  if (!producto) notFound();

  const precio = describirPrecio(producto);
  const whatsapp = enlaceWhatsApp(
    config,
    `Hola, quisiera pedir ${producto.nombre}${producto.varianteNombre ? ` (${producto.varianteNombre})` : ""}.`,
  );

  // De la misma categoria, sin repetir el que se esta viendo.
  const relacionados = todos
    .filter((otro) => otro.categoriaSlug === producto.categoriaSlug && otro.id !== producto.id)
    .slice(0, 4);

  return (
    <div className="mx-auto max-w-(--container-contenido) px-4 py-8 sm:px-6 sm:py-12">
      <Link
        href={
          producto.categoriaSlug ? `/productos?categoria=${producto.categoriaSlug}` : "/productos"
        }
        className="text-muted-foreground hover:text-foreground focus-visible:outline-ring min-h-tactil inline-flex items-center gap-1.5 text-sm focus-visible:outline-2 focus-visible:outline-offset-2"
      >
        <ArrowLeft aria-hidden className="size-4" />
        {producto.categoriaNombre ?? "Todos los productos"}
      </Link>

      <div className="mt-4 grid gap-8 lg:grid-cols-2 lg:gap-12">
        <div className="acercarse bg-secondary relative aspect-[4/3] overflow-hidden rounded-xl">
          {producto.imagen ? (
            <Image
              src={producto.imagen}
              alt={producto.imagenAlt ?? producto.nombre}
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover"
            />
          ) : (
            <div className="text-muted-foreground/40 flex h-full flex-col items-center justify-center gap-3">
              <Croissant aria-hidden className="size-16" />
              <p className="text-sm">Todavía no tenemos foto de este producto</p>
            </div>
          )}
        </div>

        <div className="aparece-lateral flex flex-col">
          <h1 className="font-heading text-4xl text-balance sm:text-5xl">{producto.nombre}</h1>

          {precio ? (
            <p className="text-precio font-heading mt-4 text-3xl font-semibold">{precio}</p>
          ) : null}

          {producto.varianteNombre ? (
            <p className="text-muted-foreground mt-1">
              Presentación: {producto.varianteNombre}
              {producto.variantes > 1 ? ` y ${producto.variantes - 1} más` : ""}
            </p>
          ) : null}

          {producto.descripcion ? (
            <p className="mt-6 max-w-prose text-lg text-pretty">{producto.descripcion}</p>
          ) : null}

          {whatsapp ? (
            <a
              href={whatsapp}
              target="_blank"
              rel="noopener noreferrer"
              className="boton-cta mt-8 w-fit"
            >
              Pedir por WhatsApp
            </a>
          ) : null}

          <p className="text-muted-foreground mt-4 text-sm text-pretty">
            Repartimos en Iquitos, Belén, Punchana y San Juan Bautista.
          </p>
        </div>
      </div>

      {relacionados.length > 0 ? (
        <section className="mt-20">
          <h2 className="font-heading text-2xl">
            También en {producto.categoriaNombre ?? "el catálogo"}
          </h2>
          <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
            {relacionados.map((otro) => (
              <TarjetaProducto key={otro.id} producto={otro} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
