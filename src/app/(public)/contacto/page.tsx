import type { Metadata } from "next";
import Link from "next/link";
import { Clock, Mail, MapPin, MessageCircle, Phone } from "lucide-react";

import { EncabezadoSeccion } from "@/components/publico/encabezado-seccion";
import { Horario } from "@/components/publico/horario";
import { direccionCompleta, enlaceWhatsApp, obtenerConfiguracion } from "@/lib/datos/configuracion";

export const metadata: Metadata = {
  title: "Contacto",
  description:
    "Teléfono, WhatsApp, correo y dirección de Panadería Pimpo's en Iquitos. Delivery propio a Iquitos, Belén, Punchana y San Juan Bautista.",
};

/**
 * Contacto.
 *
 * No lleva formulario, y es una decision, no un olvido: un formulario obliga al
 * negocio a vigilar un buzon que hoy nadie vigila, y el cliente de esta
 * panaderia pide por WhatsApp. Un formulario que nadie lee es peor que no
 * tenerlo, porque promete una respuesta que no llega. Cuando el panel tenga
 * bandeja de entrada (F4) se puede reconsiderar.
 */
export default async function Contacto() {
  const config = await obtenerConfiguracion();
  const whatsapp = enlaceWhatsApp(config, "Hola, quisiera hacer una consulta.");
  const direccion = direccionCompleta(config);

  return (
    <>
      <EncabezadoSeccion
        titulo="Hablemos"
        entradilla="La forma más rápida es WhatsApp. También puedes llamarnos o venir al local."
      />

      <div className="mx-auto max-w-(--container-contenido) px-4 py-12 sm:px-6 sm:py-16">
        <div className="aparece-grupo grid gap-10 lg:grid-cols-[1.1fr_1fr] lg:gap-16">
          <div>
            {whatsapp ? (
              <a
                href={whatsapp}
                target="_blank"
                rel="noopener noreferrer"
                className="boton-cta w-fit text-lg"
              >
                <MessageCircle aria-hidden className="size-5" />
                Escribir por WhatsApp
              </a>
            ) : null}

            <dl className="mt-10 flex flex-col gap-6">
              {config.telefono ? (
                <div className="flex gap-3">
                  <Phone aria-hidden className="text-acento mt-1 size-5 shrink-0" />
                  <div>
                    <dt className="font-medium">Teléfono</dt>
                    <dd>
                      <a
                        href={`tel:${config.telefono.replace(/\s/g, "")}`}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        {config.telefono}
                      </a>
                    </dd>
                  </div>
                </div>
              ) : null}

              {config.correo ? (
                <div className="flex gap-3">
                  <Mail aria-hidden className="text-acento mt-1 size-5 shrink-0" />
                  <div>
                    <dt className="font-medium">Correo</dt>
                    <dd>
                      <a
                        href={`mailto:${config.correo}`}
                        className="text-muted-foreground hover:text-foreground break-all"
                      >
                        {config.correo}
                      </a>
                    </dd>
                  </div>
                </div>
              ) : null}

              {direccion ? (
                <div className="flex gap-3">
                  <MapPin aria-hidden className="text-acento mt-1 size-5 shrink-0" />
                  <div>
                    <dt className="font-medium">Dirección</dt>
                    <dd className="text-muted-foreground">
                      {direccion}
                      {config.referencia ? <br /> : null}
                      {config.referencia}
                    </dd>
                    <dd className="mt-1">
                      <Link href="/ubicacion" className="text-acento text-sm underline">
                        Ver el mapa
                      </Link>
                    </dd>
                  </div>
                </div>
              ) : null}
            </dl>
          </div>

          <section className="bg-card border-border/30 rounded-xl border p-6 sm:p-8">
            <h2 className="font-heading flex items-center gap-2 text-2xl">
              <Clock aria-hidden className="text-acento size-5" />
              Horario
            </h2>
            <div className="mt-4">
              <Horario config={config} />
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
