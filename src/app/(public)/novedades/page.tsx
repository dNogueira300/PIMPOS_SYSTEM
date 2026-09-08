import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { EncabezadoSeccion } from "@/components/publico/encabezado-seccion";
import { listarNovedades } from "@/lib/datos/contenido";

export const metadata: Metadata = {
  title: "Novedades",
  description: "Promociones, campañas y avisos vigentes de Panadería Pimpo's en Iquitos.",
};

const NOMBRE_TIPO: Record<string, string> = {
  promocion: "Promoción",
  nuevo_producto: "Producto nuevo",
  campania: "Campaña",
  evento: "Evento",
  aviso: "Aviso",
};

export default async function Novedades() {
  const novedades = await listarNovedades();

  return (
    <>
      <EncabezadoSeccion
        titulo="Novedades"
        entradilla="Promociones y avisos que están vigentes hoy. Lo que caduca desaparece solo."
      />

      <div className="mx-auto max-w-(--container-contenido) px-4 py-12 sm:px-6 sm:py-16">
        {novedades.length === 0 ? (
          // Vacio con salida: es el estado normal muchos dias del anio, no un
          // fallo, y tiene que decir a donde ir.
          <div className="border-border/40 rounded-lg border border-dashed px-6 py-16 text-center">
            <p className="font-heading text-xl">Ahora mismo no hay promociones vigentes</p>
            <p className="text-muted-foreground mt-2">
              El pan del día sigue en su sitio.{" "}
              <Link href="/productos" className="text-acento underline">
                Ver el catálogo
              </Link>
              .
            </p>
          </div>
        ) : (
          <ul className="grid gap-8 md:grid-cols-2">
            {novedades.map((novedad) => (
              <li key={novedad.id}>
                <article className="bg-card border-border/30 focus-within:outline-ring h-full overflow-hidden rounded-xl border focus-within:outline-2 focus-within:outline-offset-2">
                  <Link
                    href={`/novedades/${novedad.slug}`}
                    className="flex h-full flex-col outline-hidden"
                  >
                    {novedad.imagen ? (
                      <div className="relative aspect-[16/9] w-full">
                        <Image
                          src={novedad.imagen}
                          alt=""
                          fill
                          sizes="(max-width: 768px) 100vw, 50vw"
                          className="object-cover"
                        />
                      </div>
                    ) : null}
                    <div className="flex flex-1 flex-col gap-2 p-6">
                      <p className="text-acento text-sm font-medium">
                        {NOMBRE_TIPO[novedad.tipo] ?? "Novedad"}
                      </p>
                      <h2 className="font-heading text-2xl text-balance">{novedad.titulo}</h2>
                      {novedad.resumen ? (
                        <p className="text-muted-foreground text-pretty">{novedad.resumen}</p>
                      ) : null}
                    </div>
                  </Link>
                </article>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
