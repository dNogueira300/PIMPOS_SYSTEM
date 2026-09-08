import Image from "next/image";
import Link from "next/link";
import { Croissant } from "lucide-react";

import { describirPrecio, type ProductoPublico } from "@/lib/datos/catalogo";

/**
 * Tarjeta de producto del catalogo (doc 03 §4.3).
 *
 * El precio no es un dato secundario aqui: hay pan a S/ 0.10 y la ficha (5.2)
 * pide mostrarlo todo. Por eso va en su propia linea, con el dorado de acento y
 * peso de titulo, no en gris pequeno debajo del nombre.
 *
 * Hoy solo dos de los 34 productos tienen foto, asi que el caso sin imagen no
 * es una excepcion rara: es lo normal, y tiene que verse bien.
 */
export function TarjetaProducto({ producto }: { producto: ProductoPublico }) {
  const precio = describirPrecio(producto);

  return (
    <article className="group border-tarjeta-borde bg-tarjeta focus-within:outline-ring overflow-hidden rounded-lg border transition-shadow focus-within:outline-2 focus-within:outline-offset-2 hover:shadow-md hover:shadow-black/5">
      <Link href={`/productos/${producto.slug}`} className="flex h-full flex-col outline-hidden">
        <div className="bg-secondary relative aspect-[4/3] w-full overflow-hidden">
          {producto.imagen ? (
            <Image
              src={producto.imagen}
              alt={producto.imagenAlt ?? producto.nombre}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="text-muted-foreground/50 flex h-full items-center justify-center">
              <Croissant aria-hidden className="size-10" />
            </div>
          )}
        </div>

        <div className="flex flex-1 flex-col gap-1 p-4">
          <h3 className="font-heading text-lg leading-snug">{producto.nombre}</h3>

          {producto.varianteNombre ? (
            <p className="text-muted-foreground text-sm">{producto.varianteNombre}</p>
          ) : null}

          {precio ? (
            <p className="text-precio font-heading mt-auto pt-2 text-xl font-semibold">{precio}</p>
          ) : null}
        </div>
      </Link>
    </article>
  );
}
