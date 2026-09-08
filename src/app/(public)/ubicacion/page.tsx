import type { Metadata } from "next";
import dynamic from "next/dynamic";
import { ExternalLink } from "lucide-react";

import { EncabezadoSeccion } from "@/components/publico/encabezado-seccion";
import { Horario } from "@/components/publico/horario";
import { direccionCompleta, obtenerConfiguracion } from "@/lib/datos/configuracion";

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
    <div className="bg-secondary h-[60vh] min-h-80 w-full animate-pulse rounded-xl" aria-hidden />
  ),
});

export default async function Ubicacion() {
  const config = await obtenerConfiguracion();
  const direccion = direccionCompleta(config);
  const coords = config.coordenadas;

  return (
    <>
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

        <div className="mt-10 grid gap-10 md:grid-cols-2">
          <section>
            <h2 className="font-heading text-2xl">Cómo llegar</h2>
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

            <p className="text-muted-foreground mt-6 text-pretty">
              Si te queda lejos, repartimos a domicilio en Iquitos, Belén, Punchana y San Juan
              Bautista.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-2xl">Horario</h2>
            <div className="mt-3">
              <Horario config={config} />
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
