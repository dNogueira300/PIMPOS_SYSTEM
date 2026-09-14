import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Clock, Mail, MapPin, MessageCircle, Phone, Truck } from "lucide-react";

import { ArmaTuPedido } from "@/components/publico/arma-tu-pedido";
import { CondicionesPedido } from "@/components/publico/condiciones-pedido";
import { EncabezadoSeccion } from "@/components/publico/encabezado-seccion";
import { Horario } from "@/components/publico/horario";
import { direccionCompleta, enlaceWhatsApp, obtenerConfiguracion } from "@/lib/datos/configuracion";
import { condicionesDelPedido, numeroParaLeer, unirConY } from "@/lib/datos/pedido";

// Las zonas salen de la configuracion, no de una frase escrita aqui: el mismo
// dato estaba copiado a mano en cuatro sitios, y al cambiar uno los otros tres
// habrian seguido anunciando lo de antes.
export async function generateMetadata(): Promise<Metadata> {
  const config = await obtenerConfiguracion();
  const zonas = unirConY(config.delivery_zonas);

  return {
    title: "Contacto",
    description: `Teléfono, WhatsApp, correo y dirección de Panadería Pimpo's en Iquitos.${
      zonas ? ` Delivery propio a ${zonas}.` : ""
    }`,
  };
}

/**
 * Contacto, con la composicion de `<section id="contacto-ubicacion">` del
 * prototipo de Stitch (plan 03.1, tarea 8): los datos del local a la izquierda y
 * «Arma tu pedido» a la derecha.
 *
 * Sigue sin formulario de contacto, y es una decision: un formulario obliga al
 * negocio a vigilar un buzon que hoy nadie vigila. «Arma tu pedido» no es eso:
 * no envia nada a ningun servidor, arma el mensaje y abre WhatsApp, que es por
 * donde esta panaderia ya recibe los pedidos.
 */
export default async function Contacto() {
  const config = await obtenerConfiguracion();
  const whatsapp = enlaceWhatsApp(config, "Hola, quisiera hacer una consulta.");
  const numero = numeroParaLeer(config.whatsapp);
  const direccion = direccionCompleta(config);
  const condiciones = condicionesDelPedido(config);
  // El mismo numero que usa `enlaceWhatsApp`, limpio. El formulario es de
  // cliente y no puede importar `configuracion.ts` (CLAUDE.md).
  const digitos = config.whatsapp.replace(/\D/g, "");
  const pagos = config.formas_pago.map((forma) => forma.trim()).filter(Boolean);

  return (
    <>
      <EncabezadoSeccion
        titulo="Hablemos"
        entradilla="La forma más rápida es WhatsApp. También puedes llamarnos o venir al local."
      />

      <div className="mx-auto max-w-(--container-contenido) px-4 py-12 sm:px-6 sm:py-16">
        <div className="aparece-grupo grid items-start gap-8 lg:grid-cols-2 lg:gap-12">
          <section aria-labelledby="titulo-local" className="tarjeta flex flex-col p-6 sm:p-8">
            <div className="flex items-start gap-4">
              <span
                aria-hidden
                className="bg-primary text-primary-foreground grid size-12 shrink-0 place-items-center rounded-xl"
              >
                <MapPin className="size-6" />
              </span>
              <div>
                <h2
                  id="titulo-local"
                  className="font-heading text-primary text-2xl leading-tight font-semibold"
                >
                  {config.nombre_comercial}
                </h2>
                {direccion ? <p className="mt-1 text-pretty">{direccion}</p> : null}
                {config.referencia ? (
                  <p className="text-muted-foreground text-sm text-pretty">{config.referencia}</p>
                ) : null}
                {direccion ? (
                  <Link
                    href="/ubicacion"
                    className="text-acento focus-visible:outline-ring min-h-tactil inline-flex items-center gap-1.5 text-sm font-medium hover:underline focus-visible:outline-2 focus-visible:outline-offset-2"
                  >
                    Ver el mapa
                    <ArrowRight aria-hidden className="size-4" />
                  </Link>
                ) : null}
              </div>
            </div>

            {whatsapp ? (
              <a
                href={whatsapp}
                target="_blank"
                rel="noopener noreferrer"
                className="boton-whatsapp mt-6 w-full sm:w-fit"
              >
                <MessageCircle aria-hidden className="size-5" />
                Escribir por WhatsApp
              </a>
            ) : null}

            {/* Cada dato es un grupo `div > dt + dd`, que es la unica forma que
                admite un `<dl>`: el icono va dentro del `<dt>`, no al lado del
                grupo. Antes colgaba de un `div` intermedio junto al icono, y
                axe lo marcaba dos veces (`definition-list` y `dlitem`) porque
                ni el `dt` ni el `dd` eran hijos directos de su grupo. */}
            <dl className="border-border mt-6 grid gap-4 border-t pt-6 sm:grid-cols-2">
              {/* El numero escrito, ademas del boton: hay quien quiere guardarlo
                  en sus contactos, o escribir desde otro telefono. */}
              {whatsapp && numero ? (
                <div>
                  <dt className="flex items-center gap-2 text-sm font-semibold">
                    <MessageCircle aria-hidden className="text-acento size-4 shrink-0" />
                    WhatsApp
                  </dt>
                  <dd className="pl-6">
                    <a
                      href={whatsapp}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-muted-foreground hover:text-foreground min-h-tactil inline-flex items-center"
                    >
                      {numero}
                    </a>
                  </dd>
                </div>
              ) : null}

              {config.telefono ? (
                <div>
                  <dt className="flex items-center gap-2 text-sm font-semibold">
                    <Phone aria-hidden className="text-acento size-4 shrink-0" />
                    Teléfono
                  </dt>
                  <dd className="pl-6">
                    <a
                      href={`tel:${config.telefono.replace(/\s/g, "")}`}
                      className="text-muted-foreground hover:text-foreground min-h-tactil inline-flex items-center"
                    >
                      {config.telefono}
                    </a>
                  </dd>
                </div>
              ) : null}

              {config.correo ? (
                <div className="sm:col-span-2">
                  <dt className="flex items-center gap-2 text-sm font-semibold">
                    <Mail aria-hidden className="text-acento size-4 shrink-0" />
                    Correo
                  </dt>
                  <dd className="pl-6">
                    <a
                      href={`mailto:${config.correo}`}
                      className="text-muted-foreground hover:text-foreground min-h-tactil inline-flex items-center break-all"
                    >
                      {config.correo}
                    </a>
                  </dd>
                </div>
              ) : null}
            </dl>

            <div className="tarjeta bg-muted mt-6 p-4 sm:p-5">
              <h3 className="font-heading text-primary flex items-center gap-2 text-lg font-semibold">
                <Clock aria-hidden className="text-acento size-5" />
                Horario
              </h3>
              <div className="mt-3">
                <Horario config={config} />
              </div>
            </div>

            {pagos.length > 0 ? (
              <div className="mt-6">
                <h3 className="font-sans text-sm font-semibold">Formas de pago</h3>
                <ul className="mt-2 flex flex-wrap gap-2">
                  {pagos.map((forma) => (
                    <li key={forma} className="sello">
                      {forma}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </section>

          <div className="flex flex-col gap-8">
            {digitos ? <ArmaTuPedido numero={digitos} zonas={config.delivery_zonas} /> : null}

            {/* Las condiciones al lado del formulario y no en otra pagina: la
                duda de «¿cuanto me cobran por traerlo?» aparece justo antes de
                enviar. */}
            {condiciones.length > 0 ? (
              <section aria-labelledby="titulo-delivery">
                <h2
                  id="titulo-delivery"
                  className="font-heading text-primary flex items-center gap-2 text-2xl font-semibold"
                >
                  <Truck aria-hidden className="text-acento size-5" />
                  Delivery
                </h2>
                <CondicionesPedido condiciones={condiciones} enmarcada className="mt-4" />
              </section>
            ) : null}
          </div>
        </div>
      </div>
    </>
  );
}
