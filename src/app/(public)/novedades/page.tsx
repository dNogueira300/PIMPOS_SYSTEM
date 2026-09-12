import type { Metadata } from "next";
import type { CSSProperties } from "react";
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
          //
          // Sin la caja de borde punteado que tenia antes. Un recuadro vacio y
          // discontinuo es el gesto universal de "aqui falta algo", y aqui no
          // falta nada: la panaderia simplemente no tiene promocion hoy. Lo que
          // queda es una pagina que dice lo que si hay, con el mismo dibujo del
          // horno de la portada y un boton de verdad en vez de un enlace
          // subrayado dentro de una frase.
          <div className="mx-auto flex max-w-lg flex-col items-center py-8 text-center">
            <div className="acercarse relative aspect-[900/879] w-full max-w-56">
              <Image
                src="/marca/horno-amanecer.webp"
                alt=""
                fill
                sizes="14rem"
                className="object-contain"
              />
            </div>
            <p className="font-heading mt-6 text-2xl text-balance">
              Hoy no tenemos promociones, pero sí pan recién horneado
            </p>
            <p className="text-muted-foreground mt-3 text-pretty">
              Cuando haya una campaña o un producto nuevo, aparece aquí. Mientras tanto, el pan del
              día sigue en su sitio y con su precio a la vista.
            </p>
            <Link href="/productos" className="boton-cta mt-8">
              Ver los precios
            </Link>
          </div>
        ) : (
          <ul className="aparece-grupo grid gap-8 md:grid-cols-2">
            {novedades.map((novedad, indice) => (
              <li key={novedad.id} style={{ "--i": indice % 2 } as CSSProperties}>
                <article className="group bg-card border-border/30 focus-within:outline-ring h-full overflow-hidden rounded-xl border transition-shadow duration-300 focus-within:outline-2 focus-within:outline-offset-2 hover:shadow-lg hover:shadow-black/5">
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
                          className="object-cover transition-transform duration-700 group-hover:scale-105"
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
