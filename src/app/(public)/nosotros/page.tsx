import type { Metadata } from "next";
import Image from "next/image";

import { EncabezadoSeccion } from "@/components/publico/encabezado-seccion";
import { obtenerConfiguracion } from "@/lib/datos/configuracion";
import { listarGaleria } from "@/lib/datos/contenido";

export const metadata: Metadata = {
  title: "Nosotros",
  description:
    "La historia de Panadería Pimpo's: 22 años horneando en Iquitos, con misión, visión y valores del negocio.",
};

export default async function Nosotros() {
  const [config, galeria] = await Promise.all([obtenerConfiguracion(), listarGaleria()]);

  // El texto viene de la ficha con dobles saltos de linea: se respetan como
  // parrafos en vez de imprimir un bloque de doce lineas seguidas.
  const parrafos = config.historia.split("\n\n").filter((p) => p.trim().length > 0);
  const interior = galeria.find((foto) => foto.categoria === "interior") ?? galeria[0];

  return (
    <>
      <EncabezadoSeccion titulo="Nuestra historia" entradilla={config.eslogan || undefined} />

      <div className="mx-auto max-w-(--container-contenido) px-4 py-12 sm:px-6 sm:py-16">
        <div className="grid gap-10 lg:grid-cols-[1.2fr_1fr] lg:gap-16">
          <div className="aparece-grupo flex flex-col gap-4">
            {parrafos.map((parrafo) => (
              <p key={parrafo.slice(0, 40)} className="max-w-prose text-lg text-pretty">
                {parrafo}
              </p>
            ))}
          </div>

          {interior?.imagen ? (
            <div className="acercarse relative aspect-[4/5] overflow-hidden rounded-xl lg:sticky lg:top-24 lg:self-start">
              <Image
                src={interior.imagen}
                alt={interior.alt}
                fill
                sizes="(max-width: 1024px) 100vw, 40vw"
                className="object-cover"
              />
            </div>
          ) : null}
        </div>

        {config.mision || config.vision ? (
          <div className="aparece-grupo mt-20 grid gap-8 md:grid-cols-2">
            {config.mision ? (
              <section className="bg-card border-border/30 rounded-xl border p-6 sm:p-8">
                <h2 className="font-heading text-2xl">Misión</h2>
                <p className="mt-3 text-pretty">{config.mision}</p>
              </section>
            ) : null}
            {config.vision ? (
              <section className="bg-card border-border/30 rounded-xl border p-6 sm:p-8">
                <h2 className="font-heading text-2xl">Visión</h2>
                <p className="mt-3 text-pretty">{config.vision}</p>
              </section>
            ) : null}
          </div>
        ) : null}

        {config.valores.length > 0 ? (
          <section className="mt-20">
            <h2 className="font-heading text-3xl">Cómo trabajamos</h2>
            <dl className="aparece-grupo mt-8 grid gap-x-10 gap-y-8 sm:grid-cols-2">
              {config.valores.map((valor) => (
                <div key={valor.nombre} className="border-border/30 border-t pt-4">
                  <dt className="font-heading text-acento text-xl">{valor.nombre}</dt>
                  <dd className="text-muted-foreground mt-2 text-pretty">{valor.descripcion}</dd>
                </div>
              ))}
            </dl>
          </section>
        ) : null}
      </div>
    </>
  );
}
