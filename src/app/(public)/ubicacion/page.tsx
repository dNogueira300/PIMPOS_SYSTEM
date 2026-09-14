import type { Metadata } from "next";
import dynamic from "next/dynamic";
import { ExternalLink } from "lucide-react";

import { EncabezadoSeccion } from "@/components/publico/encabezado-seccion";
import { Horario } from "@/components/publico/horario";
import { direccionCompleta, obtenerConfiguracion } from "@/lib/datos/configuracion";
import { unirConY } from "@/lib/datos/pedido";

export const metadata: Metadata = {
  title: "Ubicación",
  description:
    "Panadería Pimpo's está en la Calle Elías Aguirre 1321, Belén, Iquitos. Mapa, referencias y horario de atención.",
};

// Leaflet toca `window` al cargarse y pesa mas que el resto de la pagina junta.
// Cargarlo en diferido es lo que permite que esta seccion siga entrando en el
// presupuesto de JS (doc 03 §4.5) sin renunciar al mapa.
const Mapa = dynamic(() => import("@/components/publico/mapa").then((m) => m.Mapa), {
  loading: () => (
    // Las mismas medidas que el mapa para que la pagina no de un salto al
    // cargarlo, `isolate` incluido: asi el hueco y el mapa se apilan igual.
    <div
      className="bg-muted isolate h-[60vh] min-h-80 w-full animate-pulse rounded-2xl"
      aria-hidden
    />
  ),
});

export default async function Ubicacion() {
  const config = await obtenerConfiguracion();
  const direccion = direccionCompleta(config);
  const coords = config.coordenadas;
  const zonas = unirConY(config.delivery_zonas);

  return (
    <>
      {/* Las teselas del mapa vienen de tres subdominios de OpenStreetMap, y
          hasta que Leaflet no termina de cargarse el navegador ni sabe que
          existen: medido en produccion el 12/09, la primera tesela —que es el
          elemento mas grande de la pagina, o sea el LCP— empezaba a pedirse
          3.9 s despues del primer byte. Abrir la conexion (DNS + TLS) mientras
          tanto no la adelanta del todo, pero le quita el handshake del camino
          critico. Los tres subdominios porque Leaflet reparte entre ellos. */}
      {coords
        ? ["a", "b", "c"].map((sub) => (
            <link
              key={sub}
              rel="preconnect"
              href={`https://${sub}.tile.openstreetmap.org`}
              crossOrigin=""
            />
          ))
        : null}

      <EncabezadoSeccion titulo="Dónde estamos" entradilla={direccion || "Iquitos, Loreto"} />

      <div className="mx-auto max-w-(--container-contenido) px-4 py-12 sm:px-6 sm:py-16">
        {coords ? (
          <Mapa
            lat={coords.lat}
            lng={coords.lng}
            titulo={config.nombre_comercial}
            direccion={direccion}
          />
        ) : (
          <p className="text-muted-foreground">
            Todavía no hemos cargado las coordenadas del local.
          </p>
        )}

        <div className="mt-10 grid gap-6 md:grid-cols-2 lg:gap-8">
          <section className="tarjeta p-6 sm:p-8">
            <h2 className="font-heading text-primary text-2xl font-semibold">Cómo llegar</h2>
            {direccion ? <p className="mt-3 text-lg">{direccion}</p> : null}
            {config.referencia ? (
              <p className="text-muted-foreground mt-1">{config.referencia}</p>
            ) : null}

            {coords ? (
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${coords.lat},${coords.lng}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-acento focus-visible:outline-ring min-h-tactil mt-5 inline-flex items-center gap-2 font-medium hover:underline focus-visible:outline-2 focus-visible:outline-offset-2"
              >
                Abrir en Google Maps
                <ExternalLink aria-hidden className="size-4" />
              </a>
            ) : null}

            {/* Las zonas de la base, como en el resto del sitio: esta frase las
                llevaba escritas a mano, y era el quinto sitio que habria que
                acordarse de cambiar. */}
            {zonas ? (
              <p className="text-muted-foreground mt-6 text-pretty">
                Si te queda lejos, repartimos a domicilio en {zonas}.
              </p>
            ) : null}
          </section>

          <section className="tarjeta bg-muted p-6 sm:p-8">
            <h2 className="font-heading text-primary text-2xl font-semibold">Horario</h2>
            <div className="mt-3">
              <Horario config={config} />
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
