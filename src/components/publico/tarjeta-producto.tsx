import Image from "next/image";
import Link from "next/link";
import { MessageCircle } from "lucide-react";

import { describirPrecio, type ProductoPublico } from "@/lib/datos/catalogo";

/**
 * Tarjeta de producto del prototipo de Stitch (plan 03.1, tarea 6), SOLO para
 * productos con foto real (ver `repartirPorFoto`). Sin foto no se usa: una caja
 * vacía por producto es lo que se retiró el 11/09.
 *
 * El enlace de la ficha y el botón de pedir son dos destinos distintos, así que
 * van por separado: un botón dentro de un enlace no es HTML válido y el lector
 * de pantalla leería los dos como uno.
 */
export function TarjetaProducto({
  producto,
  whatsapp,
}: {
  producto: ProductoPublico & { imagen: string };
  whatsapp: string | null;
}) {
  const precio = describirPrecio(producto);

  return (
    <article className="tarjeta tarjeta--elevable flex h-full flex-col p-4">
      <Link
        href={`/productos/${producto.slug}`}
        className="group focus-visible:outline-ring block rounded-xl focus-visible:outline-2 focus-visible:outline-offset-2"
      >
        <div className="bg-muted relative aspect-[4/3] overflow-hidden rounded-xl">
          <Image
            src={producto.imagen}
            alt={producto.imagenAlt ?? producto.nombre}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
          {producto.categoriaNombre ? (
            <span className="sello absolute top-3 left-3">{producto.categoriaNombre}</span>
          ) : null}
        </div>
        <div className="mt-4 flex items-baseline justify-between gap-3">
          <h3 className="font-heading text-primary text-lg leading-tight font-semibold decoration-1 underline-offset-4 group-hover:underline">
            {producto.nombre}
          </h3>
          {precio ? (
            <p
              data-precio
              className="font-heading text-precio shrink-0 text-lg font-semibold whitespace-nowrap tabular-nums"
            >
              {precio}
            </p>
          ) : null}
        </div>
      </Link>
      {producto.descripcion ? (
        <p className="text-muted-foreground mt-2 line-clamp-2 text-sm text-pretty">
          {producto.descripcion}
        </p>
      ) : null}
      {whatsapp ? (
        // `mt-auto` en un contenedor y no en el botón: así el botón queda al
        // pie de la tarjeta aunque las descripciones midan distinto.
        <div className="mt-auto pt-4">
          <a href={whatsapp} target="_blank" rel="noopener noreferrer" className="boton-cta w-full">
            <MessageCircle aria-hidden className="size-4" />
            Pedir por WhatsApp
            {/* Con varias tarjetas, «Pedir por WhatsApp» repetido no dice cuál.
                El nombre va oculto y DETRÁS del texto visible, no en un
                `aria-label`: quien usa control por voz dice lo que ve, y el
                nombre accesible tiene que empezar por eso (WCAG 2.5.3). */}
            <span className="sr-only">: {producto.nombre}</span>
          </a>
        </div>
      ) : null}
    </article>
  );
}
