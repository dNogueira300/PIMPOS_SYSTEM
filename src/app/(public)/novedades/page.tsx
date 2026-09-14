import type { Metadata } from "next";
import type { CSSProperties } from "react";
import Image from "next/image";
import Link from "next/link";

import { EncabezadoSeccion } from "@/components/publico/encabezado-seccion";
import { listarNovedades, type Novedad } from "@/lib/datos/contenido";

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
          <ul className="aparece-grupo grid gap-6 md:grid-cols-2 lg:gap-8">
            {novedades.map((novedad, indice) => (
              <li key={novedad.id} style={{ "--i": indice % 2 } as CSSProperties}>
                <TarjetaNovedad
                  novedad={novedad}
                  destacada={indice === 0 && novedades.length > 1}
                  tipo={NOMBRE_TIPO[novedad.tipo] ?? "Novedad"}
                />
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}

/**
 * Tarjeta de novedad del prototipo de Stitch (plan 03.1, tarea 7).
 *
 * La primera, invertida en azul como la tarjeta central de «combos» del
 * prototipo, y solo si hay más de una: destacar la única que hay no destaca
 * nada. Sin precios tachados ni listas de contenido: la tabla no los tiene, y
 * inventarlos para llenar la tarjeta sería publicar una oferta que no existe.
 *
 * El enlace cubre la tarjeta entera, así que el foco se dibuja en la tarjeta
 * (`focus-within`) y no en un rectángulo interior que nadie ve.
 */
function TarjetaNovedad({
  novedad,
  destacada,
  tipo,
}: {
  novedad: Novedad;
  destacada: boolean;
  tipo: string;
}) {
  return (
    <article
      data-destacada={destacada || undefined}
      className={`tarjeta tarjeta--elevable group focus-within:outline-ring h-full overflow-hidden focus-within:outline-2 focus-within:outline-offset-2 ${
        destacada ? "bg-primary text-primary-foreground border-transparent" : ""
      }`}
    >
      <Link href={`/novedades/${novedad.slug}`} className="flex h-full flex-col outline-hidden">
        {novedad.imagen ? (
          <div className="bg-muted relative aspect-[16/9] w-full overflow-hidden">
            <Image
              src={novedad.imagen}
              alt=""
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover transition-transform duration-700 group-hover:scale-105"
            />
          </div>
        ) : null}
        <div className="flex flex-1 flex-col gap-3 p-6">
          <p className="sello w-fit">{tipo}</p>
          <h2
            className={`font-heading text-2xl leading-tight font-semibold text-balance decoration-1 underline-offset-4 group-hover:underline ${
              destacada ? "text-primary-foreground" : "text-primary"
            }`}
          >
            {novedad.titulo}
          </h2>
          {novedad.resumen ? (
            <p
              className={`text-pretty ${
                destacada ? "text-primary-foreground/85" : "text-muted-foreground"
              }`}
            >
              {novedad.resumen}
            </p>
          ) : null}
        </div>
      </Link>
    </article>
  );
}
