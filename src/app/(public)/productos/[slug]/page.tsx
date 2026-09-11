import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, Croissant, MessageCircle } from "lucide-react";

import { CondicionesPedido } from "@/components/publico/condiciones-pedido";
import { TarjetaProducto } from "@/components/publico/tarjeta-producto";
import { describirPrecio, listarProductos, obtenerProducto } from "@/lib/datos/catalogo";
import { enlaceWhatsApp, obtenerConfiguracion } from "@/lib/datos/configuracion";
import { listarGuias } from "@/lib/datos/contenido";
import {
  condicionesDelPedido,
  GUIA_DEL_PEDIDO,
  mensajeDePedido,
  numeroParaLeer,
} from "@/lib/datos/pedido";

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
  const [producto, config, todos, guias] = await Promise.all([
    obtenerProducto(slug),
    obtenerConfiguracion(),
    listarProductos(),
    listarGuias(),
  ]);

  if (!producto) notFound();

  const precio = describirPrecio(producto);
  const whatsapp = enlaceWhatsApp(config, mensajeDePedido(producto));
  const numero = numeroParaLeer(config.whatsapp);
  const condiciones = condicionesDelPedido(config);
  const guia = guias.find((una) => una.slug === GUIA_DEL_PEDIDO);

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

          {/* El momento de pedir. Lo que el cliente se pregunta antes de pulsar
              va aqui, pegado al boton y no en otra pagina: que pasa al pulsarlo,
              a que numero escribe y cuanto le cuesta que se lo traigan. */}
          {whatsapp ? (
            <>
              <a
                href={whatsapp}
                target="_blank"
                rel="noopener noreferrer"
                className="boton-cta mt-8 w-fit"
              >
                <MessageCircle aria-hidden className="size-5" />
                Pedir por WhatsApp
              </a>
              <p className="text-muted-foreground mt-3 max-w-md text-sm text-pretty">
                Se abre WhatsApp con tu pedido ya escrito: completa la cantidad y tu dirección, y te
                respondemos con el total en horario de atención.
                {numero ? (
                  <>
                    {" "}
                    {/* Espacio duro: "es" no se queda solo al final de la linea. */}
                    Nuestro número es&nbsp;
                    <span className="text-foreground font-medium whitespace-nowrap">{numero}</span>.
                  </>
                ) : null}
              </p>
            </>
          ) : null}

          <CondicionesPedido condiciones={condiciones} className="mt-6 max-w-md text-sm" />

          {guia ? (
            <Link
              href={`/preguntas-frecuentes#${guia.slug}`}
              className="text-acento focus-visible:outline-ring min-h-tactil mt-2 inline-flex w-fit items-center gap-1.5 text-sm font-medium hover:underline focus-visible:outline-2 focus-visible:outline-offset-2"
            >
              {guia.titulo}, paso a paso
              <ArrowRight aria-hidden className="size-4" />
            </Link>
          ) : null}
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
