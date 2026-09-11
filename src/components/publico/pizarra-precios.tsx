import type { CSSProperties } from "react";
import Image from "next/image";
import Link from "next/link";

import { describirPrecio, describirPresentacion, type ProductoPublico } from "@/lib/datos/catalogo";

/**
 * La pizarra de precios: el catalogo como lo escribe una panaderia en su
 * mostrador, una linea por producto, puntos y el precio a la derecha.
 *
 * Sustituye a la rejilla de tarjetas (critica de diseno del 11/09, P1). 32 de
 * los 34 productos no tienen foto, y la rejilla los mostraba como 32 croissants
 * de relleno identicos: el sitio se enfriaba justo donde el cliente viene a
 * mirar. Una lista se lee de un vistazo, cabe entera en menos pantallas de
 * celular y deja el precio donde se busca.
 *
 * Un producto con foto la conserva: su linea es mas alta y lleva la imagen.
 * Cuando el negocio suba fotos desde el panel, cada producto la gana solo.
 *
 * En escritorio va a dos columnas que se leen de arriba abajo, como una carta:
 * a todo lo ancho, los puntos cruzarian media pantalla entre nombre y precio.
 */
export function PizarraPrecios({
  productos,
  className = "",
}: {
  productos: readonly ProductoPublico[];
  className?: string;
}) {
  return (
    <ul className={`aparece-grupo border-border/50 gap-x-12 border-t md:columns-2 ${className}`}>
      {productos.map((producto, indice) => (
        <li
          key={producto.id}
          style={{ "--i": indice % 2 } as CSSProperties}
          className="border-border/50 break-inside-avoid border-b"
        >
          <FilaPrecio producto={producto} />
        </li>
      ))}
    </ul>
  );
}

function FilaPrecio({ producto }: { producto: ProductoPublico }) {
  const precio = describirPrecio(producto);
  const presentacion = describirPresentacion(producto);

  return (
    <Link
      href={`/productos/${producto.slug}`}
      className="group focus-visible:outline-ring min-h-tactil flex items-center gap-4 py-3 focus-visible:outline-2 focus-visible:outline-offset-2"
    >
      {producto.imagen ? (
        // `alt` vacio a proposito: el nombre ya va escrito al lado y es el
        // nombre del enlace. Leerlo dos veces no ayuda a nadie.
        <span className="bg-secondary relative size-16 shrink-0 overflow-hidden rounded-md sm:size-20">
          <Image
            src={producto.imagen}
            alt=""
            fill
            sizes="80px"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        </span>
      ) : null}

      <span className="flex min-w-0 flex-1 items-baseline gap-3">
        <span data-nombre className="min-w-0">
          <span className="font-heading block text-lg leading-snug decoration-1 underline-offset-4 group-hover:underline">
            {producto.nombre}
          </span>
          {presentacion ? (
            <span className="text-muted-foreground block text-sm">{presentacion}</span>
          ) : null}
        </span>

        {/* Los puntos guia, como en una carta: llevan el ojo del nombre a su
            precio aunque esten lejos. Decorativos, fuera del arbol de
            accesibilidad. */}
        <span
          aria-hidden
          className="border-foreground/25 relative -top-1 min-w-4 flex-1 border-b-2 border-dotted"
        />

        {precio ? (
          <span
            data-precio
            className="text-precio font-heading shrink-0 text-xl font-semibold whitespace-nowrap tabular-nums"
          >
            {precio}
          </span>
        ) : null}
      </span>
    </Link>
  );
}
