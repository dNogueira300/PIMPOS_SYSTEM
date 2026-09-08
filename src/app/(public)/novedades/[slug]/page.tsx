import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { listarNovedades, obtenerNovedad } from "@/lib/datos/contenido";

/**
 * `generateStaticParams` tiene que devolver al menos un parametro con Cache
 * Components. Cuando no hay ninguna novedad publicada se devuelve un slug que
 * no existe: la ruta se genera, responde 404 y la pagina de listado se encarga
 * de explicar que no hay nada vigente.
 */
export async function generateStaticParams() {
  const novedades = await listarNovedades();
  if (novedades.length === 0) return [{ slug: "sin-novedades" }];
  return novedades.map((novedad) => ({ slug: novedad.slug }));
}

export async function generateMetadata(props: PageProps<"/novedades/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  const novedad = await obtenerNovedad(slug);
  if (!novedad) return { title: "Novedad no encontrada" };
  return {
    title: novedad.titulo,
    description: novedad.resumen ?? novedad.contenido.slice(0, 155),
  };
}

export default async function DetalleNovedad(props: PageProps<"/novedades/[slug]">) {
  const { slug } = await props.params;
  const novedad = await obtenerNovedad(slug);

  // Una promocion vencida deja de existir para el sitio publico en cuanto pasa
  // su vigencia: la vista ya no la devuelve y aqui se responde 404, sin dejar
  // una pagina con una oferta que ya no vale.
  if (!novedad) notFound();

  return (
    <article className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
      <Link
        href="/novedades"
        className="text-muted-foreground hover:text-foreground focus-visible:outline-ring min-h-tactil inline-flex items-center gap-1.5 text-sm focus-visible:outline-2 focus-visible:outline-offset-2"
      >
        <ArrowLeft aria-hidden className="size-4" />
        Todas las novedades
      </Link>

      <h1 className="font-heading mt-4 text-4xl text-balance sm:text-5xl">{novedad.titulo}</h1>

      {novedad.resumen ? (
        <p className="text-muted-foreground mt-4 text-lg text-pretty">{novedad.resumen}</p>
      ) : null}

      {novedad.imagen ? (
        <div className="relative mt-8 aspect-[16/9] overflow-hidden rounded-xl">
          <Image src={novedad.imagen} alt="" fill priority sizes="100vw" className="object-cover" />
        </div>
      ) : null}

      <div className="mt-8 flex flex-col gap-4">
        {novedad.contenido
          .split("\n\n")
          .filter((parrafo) => parrafo.trim().length > 0)
          .map((parrafo) => (
            <p key={parrafo.slice(0, 40)} className="text-lg text-pretty">
              {parrafo}
            </p>
          ))}
      </div>
    </article>
  );
}
