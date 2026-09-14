import type { CSSProperties } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Clock, MapPin, MessageCircle, Truck } from "lucide-react";

import { CarruselPortada } from "@/components/publico/carrusel-portada";
import { Horario } from "@/components/publico/horario";
import { PortadaMovil } from "@/components/publico/portada-movil";
import { PizarraPrecios } from "@/components/publico/pizarra-precios";
import { TarjetaProducto } from "@/components/publico/tarjeta-producto";
import { TituloSeccion } from "@/components/publico/titulo-seccion";
import { DatosEstructurados } from "@/components/seo/datos-estructurados";
import { formatearPrecio, listarDestacados, listarProductos } from "@/lib/datos/catalogo";
import {
  anioActual,
  anosDeOficio,
  direccionCompleta,
  enLetra,
  enlaceWhatsApp,
  obtenerConfiguracion,
} from "@/lib/datos/configuracion";
import {
  listarGaleria,
  listarNovedades,
  listarSlides,
  listarTestimonios,
} from "@/lib/datos/contenido";
import { repartirPorFoto } from "@/lib/datos/destacados";
import { primeraAperturaEscrita } from "@/lib/datos/horario";
import { condicionesDelPedido, mensajeDePedido, unirConY } from "@/lib/datos/pedido";
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

/**
 * Los tres datos de la franja de confianza. Es una funcion y no una constante
 * porque sus datos vienen de la base: las zonas de reparto y el anio de
 * apertura estaban escritos aqui a mano, y los dos envejecen igual de mal —el
 * reparto, en cuanto cambie; los anios, el 1 de enero siguiente, sin que nada
 * falle ni avise.
 */
function hechos(zonas: string, anos: number | null) {
  return [
    {
      icono: Clock,
      titulo: "Del día",
      detalle: "Se hornea y se vende el mismo día. Nada de un día para otro.",
    },
    {
      icono: Truck,
      titulo: "A toda Iquitos",
      detalle: zonas ? `Reparto con movilidad propia a ${zonas}.` : "Reparto con movilidad propia.",
    },
    {
      icono: MapPin,
      // El año de apertura ya no va aqui sino en el sello del bloque de
      // nosotros, como en el prototipo (plan 03.1, tarea 5): dicho dos veces en
      // la misma pagina sobraba en una de las dos.
      titulo: "En el barrio",
      // Sin la cuenta de anios, la frase se escribe sin ella: "en el mismo
      // barrio" se lee bien, y "0 anios en el mismo barrio" no.
      detalle: anos
        ? `${anos} años en el mismo barrio, atendiendo a los mismos vecinos.`
        : "Siempre en el mismo barrio, atendiendo a los mismos vecinos.",
    },
  ] as const;
}

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
  const whatsapp = enlaceWhatsApp(config, mensajeDePedido());
  const fachada = galeria.find((foto) => foto.categoria === "fachada") ?? galeria[0];
  const direccion = direccionCompleta(config);
  const zonas = unirConY(config.delivery_zonas);
  // Las zonas ya van dichas en la frase del bloque; repetirlas debajo como un
  // dato mas seria leer lo mismo dos veces.
  const condiciones = condicionesDelPedido(config).filter(({ clave }) => clave !== "zonas");
  // La cuenta de años se calcula, no se escribe: ver `anosDeOficio`.
  const anos = anosDeOficio(await anioActual(), config.anio_fundacion);
  const abreALas = primeraAperturaEscrita(config.horario_semanal);
  const { conFoto, sinFoto } = repartirPorFoto(destacados);
  // «Empieza en S/ 0.10» estaba escrito a mano: el día que el pan suba desde el
  // panel, la entradilla mentiría. Sale del catálogo, como el número de precios,
  // y dice «desde» y no «el pan»: el más barato no tiene por qué ser un pan.
  const precios = productos
    .map((producto) => producto.precioDesde)
    .filter((precio): precio is number => precio !== null);
  const precioMinimo = precios.length > 0 ? Math.min(...precios) : null;

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

          {/* Dos presentaciones de la misma portada, no una que se encoge: en
              el celular, foto quieta y lo que se vino a saber; desde `sm`, el
              carrusel como estaba (decision de Dan, 12/09).

              El `h1` sigue siendo uno solo y va aqui arriba, fuera de los dos:
              dentro de cualquiera de ellos quedaria en un bloque oculto para la
              otra pantalla, y esa se quedaria sin encabezado. */}
          <PortadaMovil
            slide={slides[0]}
            nombre={config.nombre_comercial}
            eslogan={config.eslogan}
            horario={config.horario_semanal}
            whatsapp={whatsapp}
          />
          <div className="hidden sm:block">
            <CarruselPortada slides={slides} />
          </div>
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
        <ul className="mx-auto grid max-w-(--container-contenido) gap-6 px-4 py-8 sm:grid-cols-3 sm:gap-8 sm:px-6">
          {hechos(zonas, anos).map(({ icono: Icono, titulo, detalle }) => (
            <li key={titulo} className="flex gap-3">
              <Icono aria-hidden className="mt-1 size-5 shrink-0" />
              <div>
                <p className="font-heading text-lg font-semibold">{titulo}</p>
                <p className="text-franja-foreground/80 text-sm text-pretty">{detalle}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      {/* 3. Lo que vende, con su precio. Híbrido (decisión de Dan, 13/09):
          tarjeta del prototipo para los destacados con foto real y la pizarra
          para el resto, que hoy son casi todos.

          Con una o dos tarjetas van AL LADO de la pizarra y no encima: una
          tarjeta sola en una fila de cuatro dejaba tres cuartos de fila vacíos,
          que se lee como contenido que no cargó. Desde tres, la fila del
          prototipo. */}
      <section
        aria-labelledby="titulo-horneamos"
        className="mx-auto max-w-(--container-contenido) px-4 pt-16 sm:px-6"
      >
        <div className="aparece flex flex-wrap items-end justify-between gap-4">
          <TituloSeccion
            id="titulo-horneamos"
            sello="Del horno a tu mesa"
            titulo="Lo que horneamos hoy"
            entradilla={
              precioMinimo !== null
                ? `Todos los precios están a la vista, desde ${formatearPrecio(precioMinimo)}.`
                : "Todos los precios están a la vista."
            }
          />
          <Link href="/productos" className="boton-linea">
            {productos.length > 0 ? `Ver los ${productos.length} precios` : "Ver el catálogo"}
            <ArrowRight aria-hidden className="size-4" />
          </Link>
        </div>

        {conFoto.length === 0 ? (
          <PizarraPrecios productos={sinFoto} className="mt-8" />
        ) : conFoto.length <= 2 ? (
          <div className="mt-8 grid items-start gap-8 lg:grid-cols-[minmax(0,20rem)_1fr] lg:gap-12">
            <ul className="aparece-grupo grid gap-6 sm:grid-cols-2 lg:grid-cols-1">
              {conFoto.map((producto, indice) => (
                <li key={producto.id} style={{ "--i": indice } as CSSProperties}>
                  <TarjetaProducto
                    producto={producto}
                    whatsapp={enlaceWhatsApp(config, mensajeDePedido(producto))}
                  />
                </li>
              ))}
            </ul>
            {sinFoto.length > 0 ? <PizarraPrecios productos={sinFoto} /> : null}
          </div>
        ) : (
          <>
            <ul className="aparece-grupo mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {conFoto.map((producto, indice) => (
                <li key={producto.id} style={{ "--i": indice } as CSSProperties}>
                  <TarjetaProducto
                    producto={producto}
                    whatsapp={enlaceWhatsApp(config, mensajeDePedido(producto))}
                  />
                </li>
              ))}
            </ul>
            {sinFoto.length > 0 ? <PizarraPrecios productos={sinFoto} className="mt-10" /> : null}
          </>
        )}
      </section>

      {/* 3 bis. La madrugada, ilustrada.
          
          Es el unico bloque de la portada que no da un dato nuevo: lo que hace
          es ponerle cara a uno que ya estaba enterrado en la tabla de horarios
          del final. Que la panaderia abra a las 4 de la manana es lo mas
          concreto que puede decir sobre el pan fresco, y en texto plano al pie
          de la pagina no lo lee nadie.
          
          La ilustracion es un linograbado del horno con el sol saliendo y
          palmeras al fondo — el dibujo, no una foto, porque aqui no se esta
          ensenando el local sino contando una hora del dia, y porque las fotos
          reales del local ya mandan en la galeria y en la historia (principio 5
          de PRODUCT.md). Las palmeras son las de Iquitos, no un adorno.
          
          Va DESPUES de la pizarra de precios y no antes: en el celular, cada
          bloque que se mete por encima retrasa lo que el vecino vino a ver
          —que hay y a cuanto—, y esto es calidez, no informacion de compra.
          
          La hora sale del horario cargado (`primeraAperturaEscrita`), no
          escrita aqui: si el negocio cambia el turno desde el panel, este
          titular no puede quedarse contradiciendo a la tabla de horarios. */}
      <section
        aria-labelledby="titulo-madrugada"
        className="mx-auto mt-20 grid max-w-(--container-contenido) items-center gap-8 px-4 sm:px-6 lg:grid-cols-[26rem_1fr] lg:gap-16"
      >
        {/* El dibujo va acotado a 26 rem tambien en escritorio. Sin tope ocupaba
            578 px de alto y el texto, que son 180, quedaba flotando con 192 px
            de vacio arriba y otros tantos abajo: la seccion se leia sin
            terminar. Acotado, el titular puede crecer y los dos pesan igual. */}
        <div className="acercarse relative mx-auto aspect-[900/879] w-full max-w-md lg:max-w-none">
          <Image
            src="/marca/horno-amanecer.webp"
            // Decorativa: lo que dice ya esta escrito al lado, y repetirlo
            // obligaria a un lector de pantalla a oirlo dos veces.
            alt=""
            fill
            sizes="(max-width: 1024px) min(100vw, 28rem), 26rem"
            className="object-contain"
          />
        </div>

        <div className="aparece-lateral">
          <h2
            id="titulo-madrugada"
            className="font-heading text-primary text-3xl font-semibold text-balance sm:text-4xl lg:text-5xl"
          >
            {abreALas
              ? `Aquí el día empieza a las ${abreALas}`
              : "Aquí el día empieza de madrugada"}
          </h2>
          <p className="text-muted-foreground mt-5 max-w-prose text-lg text-pretty">
            A esa hora abrimos, con el horno todavía caliente y el pan del día recién salido. Lo que
            horneamos hoy se vende hoy: por eso a media mañana ya huele distinto.
          </p>
        </div>
      </section>

      {/* 4. El delivery, que es el diferencial real del negocio (ficha 2.5) y
          por eso va con su propio bloque, no como nota al pie.

          Con sus condiciones a la vista y en grande: "te lo llevamos a tu casa"
          sin decir cuanto cuesta obligaba a escribir para preguntarlo, y el
          precio del envio es tan argumento de venta como el del pan. */}
      <section
        aria-labelledby="titulo-delivery"
        className="mx-auto mt-20 max-w-(--container-contenido) px-4 sm:px-6"
      >
        <div className="aparece bg-primary text-primary-foreground shadow-elevada rounded-2xl px-6 py-12 sm:px-12">
          <div className="max-w-2xl">
            <h2
              id="titulo-delivery"
              className="font-heading text-3xl font-semibold text-balance sm:text-4xl"
            >
              Te lo llevamos a tu casa
            </h2>
            <p className="text-primary-foreground/85 mt-3 text-lg text-pretty">
              Tenemos movilidad propia{zonas ? ` y repartimos en ${zonas}` : ""}. Nos dices qué
              quieres y a dónde, y te confirmamos el total.
            </p>
          </div>

          {/* En el celular, una fila por dato: el concepto a la izquierda y la
              cifra a la derecha. En dos columnas de 135 px, "30 a 45 minutos"
              se partia en "30 a" y "45 minutos". Desde `sm` caben columnas. */}
          {condiciones.length > 0 ? (
            <dl className="mt-8 grid gap-x-6 gap-y-3 sm:grid-cols-2 sm:gap-y-6 lg:grid-cols-4">
              {condiciones.map(({ clave, etiqueta, valor }) => (
                <div
                  key={clave}
                  className="border-primary-foreground/25 flex items-baseline justify-between gap-4 border-t pt-3 sm:block"
                >
                  <dt className="text-primary-foreground/80 shrink-0 text-sm">{etiqueta}</dt>
                  <dd className="font-heading text-right text-xl sm:mt-1 sm:text-left sm:text-2xl">
                    {valor}
                  </dd>
                </div>
              ))}
            </dl>
          ) : null}

          {whatsapp ? (
            <a
              href={whatsapp}
              target="_blank"
              rel="noopener noreferrer"
              className="boton-whatsapp mt-8"
            >
              <MessageCircle aria-hidden className="size-5" />
              Pedir por WhatsApp
            </a>
          ) : null}
        </div>
      </section>

      {/* 5. La historia, con la foto de la fachada y los valores de la ficha,
          en la composición del bloque «nosotros» del prototipo de Stitch.
          Asimétrico a propósito: es el único bloque de relato y no debe leerse
          como otra rejilla más. */}
      {config.historia ? (
        <section
          aria-labelledby="titulo-historia"
          className="mx-auto mt-24 grid max-w-(--container-contenido) items-center gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:gap-16"
        >
          {fachada?.imagen ? (
            <div className="relative">
              <div className="acercarse shadow-elevada relative aspect-[4/3] overflow-hidden rounded-2xl">
                <Image
                  src={fachada.imagen}
                  alt={fachada.alt}
                  fill
                  sizes="(max-width: 1024px) 100vw, 45vw"
                  className="object-cover"
                />
              </div>

              {/* El sello flotante del prototipo decía «24+ Años horneando en la
                  Amazonía»: una cuenta inventada y además equivocada. Aquí dice
                  el año de apertura, que sale de la base y no caduca (0024,
                  0025). */}
              {config.anio_fundacion > 0 ? (
                <div
                  data-sello-apertura
                  className="tarjeta shadow-elevada absolute right-4 -bottom-7 flex flex-col items-center px-6 py-4 text-center sm:right-8"
                >
                  <p className="font-heading text-primary text-2xl font-bold sm:text-3xl">
                    Desde {config.anio_fundacion}
                  </p>
                  <p className="text-acento mt-1 text-[0.6875rem] font-bold tracking-[0.08em] uppercase">
                    Horneando en Iquitos
                  </p>
                </div>
              ) : null}
            </div>
          ) : null}

          <div className="aparece-lateral">
            {/* El número va en letra porque es un titular, pero no escrito a
                mano: se genera desde el año de apertura. Sin cuenta creíble, el
                titular se queda sin cifra en vez de decir una falsa. */}
            <TituloSeccion
              id="titulo-historia"
              sello="Nuestra historia"
              titulo={anos ? `${enLetra(anos)} años en el barrio` : "Toda una vida en el barrio"}
              entradilla={config.historia.split("\n\n")[0]}
            />

            {/* Los valores de la ficha, en las tarjetas de «nosotros» del
                prototipo. Los del prototipo («fermentación lenta», «insumos
                locales») eran inventados; estos son los del negocio. */}
            {config.valores.length > 0 ? (
              <ul className="aparece-grupo mt-8 grid gap-3 sm:grid-cols-2">
                {config.valores.slice(0, 4).map((valor, indice) => (
                  <li
                    key={valor.nombre}
                    className="tarjeta bg-muted p-4"
                    style={{ "--i": indice } as CSSProperties}
                  >
                    <p className="font-heading text-primary text-lg font-semibold">
                      {valor.nombre}
                    </p>
                    <p className="text-muted-foreground mt-1 text-sm text-pretty">
                      {valor.descripcion}
                    </p>
                  </li>
                ))}
              </ul>
            ) : null}

            <Link href="/nosotros" className="boton-linea mt-8">
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
