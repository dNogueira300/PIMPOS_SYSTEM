import type { Metadata } from "next";
import Image from "next/image";

import { EncabezadoSeccion } from "@/components/publico/encabezado-seccion";
import { TituloSeccion } from "@/components/publico/titulo-seccion";
import { anioActual, anosDeOficio, obtenerConfiguracion } from "@/lib/datos/configuracion";
import { listarGaleria } from "@/lib/datos/contenido";

// `generateMetadata` y no un objeto fijo: la descripcion decia "22 años
// horneando en Iquitos" escrito a mano, y eso es lo que ve quien encuentra la
// pagina en Google. El 1 de enero siguiente habria pasado a mentir en el sitio
// donde menos se mira y mas tarda en corregirse. La cuenta sale del año de
// apertura cargado (0024), como en la portada.
export async function generateMetadata(): Promise<Metadata> {
  const config = await obtenerConfiguracion();
  const anos = anosDeOficio(await anioActual(), config.anio_fundacion);

  return {
    title: "Nosotros",
    description: anos
      ? `La historia de Panadería Pimpo's: ${anos} años horneando en Iquitos, con misión, visión y valores del negocio.`
      : "La historia de Panadería Pimpo's, horneando en Iquitos: misión, visión y valores del negocio.",
  };
}

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
            <div className="acercarse shadow-elevada relative aspect-[4/5] overflow-hidden rounded-2xl lg:sticky lg:top-24 lg:self-start">
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
              <section className="tarjeta bg-muted p-6 sm:p-8">
                <h2 className="font-heading text-primary text-2xl font-semibold">Misión</h2>
                <p className="mt-3 text-pretty">{config.mision}</p>
              </section>
            ) : null}
            {config.vision ? (
              <section className="tarjeta bg-muted p-6 sm:p-8">
                <h2 className="font-heading text-primary text-2xl font-semibold">Visión</h2>
                <p className="mt-3 text-pretty">{config.vision}</p>
              </section>
            ) : null}
          </div>
        ) : null}

        {config.valores.length > 0 ? (
          <section className="mt-20">
            <TituloSeccion titulo="Cómo trabajamos" />
            {/* Las tarjetas de valores de la portada (tarea 5), aqui todas y no
                solo las cuatro primeras. */}
            <dl className="aparece-grupo mt-8 grid gap-4 sm:grid-cols-2">
              {config.valores.map((valor) => (
                <div key={valor.nombre} className="tarjeta p-5 sm:p-6">
                  <dt className="font-heading text-primary text-xl font-semibold">
                    {valor.nombre}
                  </dt>
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
