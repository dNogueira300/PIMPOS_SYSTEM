import type { CSSProperties } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Clock, MapPin, Truck } from "lucide-react";

import { CarruselPortada } from "@/components/publico/carrusel-portada";
import { Horario } from "@/components/publico/horario";
import { TarjetaProducto } from "@/components/publico/tarjeta-producto";
import { DatosEstructurados } from "@/components/seo/datos-estructurados";
import { listarDestacados, listarProductos } from "@/lib/datos/catalogo";
import { direccionCompleta, enlaceWhatsApp, obtenerConfiguracion } from "@/lib/datos/configuracion";
import {
  listarGaleria,
  listarNovedades,
  listarSlides,
  listarTestimonios,
} from "@/lib/datos/contenido";
import { panaderiaSchema } from "@/lib/seo/datos-estructurados";
import { urlAbsoluta, urlDelSitio } from "@/lib/sitio";
import { urlDeImagen } from "@/lib/supabase/publico";

/**
 * Portada (doc 03 §4.2).
 *
 * El orden de bloques sale del plan y no es arbitrario: primero lo que el
 * cliente vino a ver (que hay y a cuanto), luego el diferencial (delivery
 * propio), y solo despues el relato de marca. Copiar el orden de una panaderia
 * de gama alta de Lima, que abre con "nuestra esencia", seria hablarle a otro
 * cliente.
 *
 * El mapa NO va aqui aunque el plan lo mencione en el bloque 9. Leaflet pesa
 * mas que el presupuesto entero de JS de la portada (§4.5: menos de 150 KB), y
 * la portada es la pagina que mas se abre desde un celular con 4G irregular.
 * Aqui van la direccion y los horarios; el mapa vive en /ubicacion, cargado en
 * diferido.
 */

const HECHOS = [
  {
    icono: Clock,
    titulo: "Del día",
    detalle: "Se hornea y se vende el mismo día. Nada de un día para otro.",
  },
  {
    icono: Truck,
    titulo: "A toda Iquitos",
    detalle: "Reparto con movilidad propia a Iquitos, Belén, Punchana y San Juan.",
  },
  {
    icono: MapPin,
    titulo: "Desde 2004",
    detalle: "22 años en el mismo barrio, atendiendo a los mismos vecinos.",
  },
] as const;

export default async function Inicio() {
  const [config, slides, destacados, novedades, testimonios, galeria] = await Promise.all([
    obtenerConfiguracion(),
    listarSlides(),
    listarDestacados(8),
    listarNovedades(3),
    listarTestimonios(),
    listarGaleria(),
  ]);

  // Cacheada con la misma etiqueta que el resto del catálogo: no es una
  // consulta más, es la misma lectura que ya hace listarDestacados.
  const productos = await listarProductos();
  const whatsapp = enlaceWhatsApp(config, "Hola, quisiera hacer un pedido para delivery.");
  const fachada = galeria.find((foto) => foto.categoria === "fachada") ?? galeria[0];
  const direccion = direccionCompleta(config);

  return (
    <>
      {/* Datos estructurados: nombre, dirección, horario de dos turnos,
          teléfono y rango de precios, para que el buscador los muestre junto
          al nombre sin que haya que entrar. Van en la portada y no en el
          layout: es lo que recomienda Google para un negocio local, y en cada
          página repetirían lo mismo. */}
      <DatosEstructurados
        datos={panaderiaSchema({
          config,
          urlSitio: urlDelSitio(),
          urlLogo: urlAbsoluta(urlDeImagen("marca", config.logo_url) ?? "/marca/logo.webp"),
          precios: productos.map((producto) => producto.precioDesde),
        })}
      />

      {/* 1. Carrusel.

          El h1 va oculto a la vista y no es un truco de SEO: el hero es una
          foto con el titular del slide, y ese titular cambia cada seis
          segundos. Un h1 que cambia solo no le sirve a nadie, y dejar la pagina
          sin h1 deja a quien navega con lector de pantalla sin saber donde
          esta. Los titulares de los slides son h2.

          Si el negocio todavia no cargo slides, la portada empieza por lo que
          vende, con su h1 a la vista, que es mejor que un hueco gris. */}
      {slides.length > 0 ? (
        <>
          <h1 className="sr-only">
            {config.nombre_comercial}: {config.eslogan || "pan fresco todos los días"} en Iquitos
          </h1>
          <CarruselPortada slides={slides} />
        </>
      ) : (
        <section className="bg-primary text-primary-foreground">
          <div className="mx-auto max-w-(--container-contenido) px-4 py-20 sm:px-6">
            <h1 className="font-heading max-w-2xl text-4xl leading-tight text-balance sm:text-6xl">
              {config.eslogan || "Pan fresco, tradición de siempre"}
            </h1>
          </div>
        </section>
      )}

      {/* 2. Franja de confianza. Tres datos verificables de la ficha, no
          promesas de marketing.

          Sin animacion de aparicion, a proposito: en el celular esta en el
          primer pliegue, justo bajo el carrusel. Animarla dejaba "Desde 2004"
          casi invisible para quien entra y no toca nada. */}
      <section aria-label="Por qué comprar aquí" className="bg-franja text-franja-foreground">
        <ul className="mx-auto grid max-w-(--container-contenido) gap-8 px-4 py-10 sm:grid-cols-3 sm:px-6">
          {HECHOS.map(({ icono: Icono, titulo, detalle }) => (
            <li key={titulo} className="flex gap-3">
              <Icono aria-hidden className="mt-1 size-5 shrink-0" />
              <div>
                <p className="font-heading text-lg">{titulo}</p>
                <p className="text-franja-foreground/80 text-sm text-pretty">{detalle}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      {/* 3. Lo que vende, con su precio. */}
      <section className="mx-auto max-w-(--container-contenido) px-4 pt-16 sm:px-6">
        <div className="aparece flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="font-heading text-3xl sm:text-4xl">Lo que horneamos hoy</h2>
            <p className="text-muted-foreground mt-2 max-w-prose text-pretty">
              Todos los precios están a la vista. El pan del día empieza en S/ 0.10.
            </p>
          </div>
          <Link
            href="/productos"
            className="text-acento focus-visible:outline-ring min-h-tactil flex items-center gap-1.5 font-medium hover:underline focus-visible:outline-2 focus-visible:outline-offset-2"
          >
            Ver el catálogo completo
            <ArrowRight aria-hidden className="size-4" />
          </Link>
        </div>

        <div className="aparece-grupo mt-8 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {destacados.map((producto, indice) => (
            <div key={producto.id} style={{ "--i": indice % 4 } as CSSProperties}>
              <TarjetaProducto producto={producto} />
            </div>
          ))}
        </div>
      </section>

      {/* 4. El delivery, que es el diferencial real del negocio (ficha 2.5) y
          por eso va con su propio bloque, no como nota al pie. */}
      <section className="mx-auto mt-20 max-w-(--container-contenido) px-4 sm:px-6">
        <div className="aparece bg-primary text-primary-foreground rounded-xl px-6 py-12 sm:px-12">
          <div className="max-w-2xl">
            <h2 className="font-heading text-3xl text-balance sm:text-4xl">
              Te lo llevamos a tu casa
            </h2>
            <p className="text-primary-foreground/85 mt-3 text-lg text-pretty">
              Tenemos movilidad propia y repartimos en Iquitos, Belén, Punchana y San Juan Bautista.
              Escríbenos por WhatsApp y coordinamos la entrega.
            </p>
            {whatsapp ? (
              <a
                href={whatsapp}
                target="_blank"
                rel="noopener noreferrer"
                className="boton-cta boton-cta--sobre-azul mt-8"
              >
                Pedir por WhatsApp
              </a>
            ) : null}
          </div>
        </div>
      </section>

      {/* 5. La historia, con la foto de la fachada. Asimetrico a proposito: es
          el unico bloque de relato y no debe leerse como otra rejilla mas. */}
      {config.historia ? (
        <section className="mx-auto mt-20 grid max-w-(--container-contenido) gap-10 px-4 sm:px-6 lg:grid-cols-[1fr_1.1fr] lg:items-center">
          {fachada?.imagen ? (
            <div className="acercarse relative aspect-[4/3] overflow-hidden rounded-xl">
              <Image
                src={fachada.imagen}
                alt={fachada.alt}
                fill
                sizes="(max-width: 1024px) 100vw, 45vw"
                className="object-cover"
              />
            </div>
          ) : null}

          <div className="aparece-lateral">
            <h2 className="font-heading text-3xl sm:text-4xl">Veintidós años en el barrio</h2>
            <p className="text-muted-foreground mt-4 max-w-prose text-pretty">
              {config.historia.split("\n\n")[0]}
            </p>
            <Link
              href="/nosotros"
              className="text-acento focus-visible:outline-ring min-h-tactil mt-6 inline-flex items-center gap-1.5 font-medium hover:underline focus-visible:outline-2 focus-visible:outline-offset-2"
            >
              Conocer la panadería
              <ArrowRight aria-hidden className="size-4" />
            </Link>
          </div>
        </section>
      ) : null}

      {/* 6. Novedades vigentes. Se omite el bloque entero si no hay ninguna: un
          "no hay novedades" no le sirve a nadie. */}
      {novedades.length > 0 ? (
        <section className="mx-auto mt-20 max-w-(--container-contenido) px-4 sm:px-6">
          <h2 className="font-heading text-3xl sm:text-4xl">Novedades</h2>
          <ul className="aparece-grupo divide-border/30 border-border/30 mt-8 divide-y border-y">
            {novedades.map((novedad, indice) => (
              <li key={novedad.id} style={{ "--i": indice } as CSSProperties}>
                <Link
                  href={`/novedades/${novedad.slug}`}
                  className="group focus-visible:outline-ring flex flex-col gap-1 py-5 focus-visible:outline-2 focus-visible:outline-offset-2 sm:flex-row sm:items-baseline sm:gap-8"
                >
                  <h3 className="font-heading text-xl group-hover:underline sm:w-2/5">
                    {novedad.titulo}
                  </h3>
                  {novedad.resumen ? (
                    <p className="text-muted-foreground flex-1 text-pretty">{novedad.resumen}</p>
                  ) : null}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {/* 7. Testimonios. */}
      {testimonios.length > 0 ? (
        <section className="mx-auto mt-20 max-w-(--container-contenido) px-4 sm:px-6">
          <h2 className="font-heading text-3xl sm:text-4xl">Lo que dicen los vecinos</h2>
          <ul className="aparece-grupo mt-8 grid gap-6 md:grid-cols-3">
            {testimonios.slice(0, 3).map((testimonio, indice) => (
              <li
                key={testimonio.id}
                style={{ "--i": indice } as CSSProperties}
                className="border-border/30 flex flex-col gap-4 border-t pt-5"
              >
                <blockquote className="text-pretty">“{testimonio.texto}”</blockquote>
                <p className="text-muted-foreground mt-auto text-sm">
                  {testimonio.nombre}
                  {testimonio.procedencia ? `, ${testimonio.procedencia}` : ""}
                </p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {/* 8. Dónde y cuándo. */}
      <section className="mx-auto mt-20 max-w-(--container-contenido) px-4 pb-4 sm:px-6">
        <div className="aparece bg-card border-border/30 grid gap-8 rounded-xl border p-6 sm:p-10 lg:grid-cols-2">
          <div>
            <h2 className="font-heading text-3xl">Dónde estamos</h2>
            {direccion ? <p className="mt-3 text-lg text-pretty">{direccion}</p> : null}
            {config.referencia ? (
              <p className="text-muted-foreground mt-1">{config.referencia}</p>
            ) : null}
            <Link
              href="/ubicacion"
              className="text-acento focus-visible:outline-ring min-h-tactil mt-6 inline-flex items-center gap-1.5 font-medium hover:underline focus-visible:outline-2 focus-visible:outline-offset-2"
            >
              Ver el mapa
              <ArrowRight aria-hidden className="size-4" />
            </Link>
          </div>

          <div>
            <h2 className="font-heading text-3xl">Horario</h2>
            <div className="mt-3">
              <Horario config={config} />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
