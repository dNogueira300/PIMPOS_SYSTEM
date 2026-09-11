import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, MessageCircle } from "lucide-react";

import { CondicionesPedido } from "@/components/publico/condiciones-pedido";
import { PizarraPrecios } from "@/components/publico/pizarra-precios";
import {
  describirPrecio,
  describirPresentacion,
  listarProductos,
  obtenerProducto,
} from "@/lib/datos/catalogo";
import { enlaceWhatsApp, obtenerConfiguracion } from "@/lib/datos/configuracion";
import { listarGuias, type Guia } from "@/lib/datos/contenido";
import {
  condicionesDelPedido,
  GUIA_DEL_PEDIDO,
  mensajeDePedido,
  numeroParaLeer,
  type Condicion,
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
  const presentacion = describirPresentacion(producto);
  const pedido = (
    <BloquePedido
      whatsapp={enlaceWhatsApp(config, mensajeDePedido(producto))}
      numero={numeroParaLeer(config.whatsapp)}
      condiciones={condicionesDelPedido(config)}
      guia={guias.find((una) => una.slug === GUIA_DEL_PEDIDO) ?? null}
    />
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

      {producto.imagen ? (
        <div className="mt-4 grid gap-8 lg:grid-cols-2 lg:gap-12">
          <div className="acercarse bg-secondary relative aspect-[4/3] overflow-hidden rounded-xl">
            <Image
              src={producto.imagen}
              alt={producto.imagenAlt ?? producto.nombre}
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover"
            />
          </div>

          <div className="aparece-lateral flex flex-col">
            <h1 className="font-heading text-4xl text-balance sm:text-5xl">{producto.nombre}</h1>
            {precio ? (
              <p className="text-precio font-heading mt-4 text-3xl font-semibold">{precio}</p>
            ) : null}
            {presentacion ? <p className="text-muted-foreground mt-1">{presentacion}</p> : null}
            {producto.descripcion ? (
              <p className="mt-6 max-w-prose text-lg text-pretty">{producto.descripcion}</p>
            ) : null}
            <div className="mt-8">{pedido}</div>
          </div>
        </div>
      ) : (
        // Sin foto no hay caja vacia esperando una. Antes la ficha reservaba
        // media pantalla para un croissant de relleno y un aviso a 1.9:1 de
        // contraste; ahora el precio ocupa ese sitio, a tamano de titular,
        // y el pedido va al lado. Es lo que el cliente viene a ver.
        <div className="mt-6 grid gap-10 lg:grid-cols-[1.1fr_1fr] lg:gap-16">
          <div className="aparece">
            <h1 className="font-heading text-4xl text-balance sm:text-5xl">{producto.nombre}</h1>
            {presentacion ? (
              <p className="text-muted-foreground mt-2 text-lg">{presentacion}</p>
            ) : null}
            {precio ? (
              <p className="text-precio font-heading mt-6 text-5xl leading-none font-semibold text-balance tabular-nums sm:text-7xl">
                {precio}
              </p>
            ) : null}
            {producto.descripcion ? (
              <p className="mt-8 max-w-prose text-lg text-pretty">{producto.descripcion}</p>
            ) : null}
          </div>

          <div className="aparece-lateral lg:pt-2">{pedido}</div>
        </div>
      )}

      {relacionados.length > 0 ? (
        <section className="mt-20">
          <h2 className="font-heading text-2xl">
            También en {producto.categoriaNombre ?? "el catálogo"}
          </h2>
          <PizarraPrecios productos={relacionados} className="mt-6" />
        </section>
      ) : null}
    </div>
  );
}

/**
 * El momento de pedir: el boton, que pasa al pulsarlo, a que numero se escribe
 * y cuanto cuesta que lo traigan. Es el mismo bloque con foto y sin ella; solo
 * cambia donde se coloca.
 */
function BloquePedido({
  whatsapp,
  numero,
  condiciones,
  guia,
}: {
  whatsapp: string | null;
  numero: string | null;
  condiciones: readonly Condicion[];
  guia: Pick<Guia, "slug" | "titulo"> | null;
}) {
  return (
    <div className="flex flex-col">
      {whatsapp ? (
        <>
          <a href={whatsapp} target="_blank" rel="noopener noreferrer" className="boton-cta w-fit">
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
  );
}
