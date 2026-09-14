import type { Metadata } from "next";
import { ChevronDown, MessageCircle } from "lucide-react";

import { EncabezadoSeccion } from "@/components/publico/encabezado-seccion";
import { TituloSeccion } from "@/components/publico/titulo-seccion";
import { EnlaceWhatsApp } from "@/components/publico/enlace-whatsapp";
import { DatosEstructurados } from "@/components/seo/datos-estructurados";
import { enlaceWhatsApp, obtenerConfiguracion } from "@/lib/datos/configuracion";
import { listarFaqs, listarGuias } from "@/lib/datos/contenido";
import { GUIA_DEL_PEDIDO, mensajeDePedido } from "@/lib/datos/pedido";
import { preguntasSchema } from "@/lib/seo/datos-estructurados";

export const metadata: Metadata = {
  title: "Preguntas frecuentes",
  description:
    "Horarios, delivery, pedidos por encargo y productos integrales: las preguntas que más nos hacen en Panadería Pimpo's.",
};

/**
 * Preguntas frecuentes y guias.
 *
 * Las guias van aqui y no en su propia seccion: la ficha (5.1) marco `/guias`
 * como no incluida, pero si se administran (6.4). Poner "cómo hacer un pedido"
 * junto a las preguntas es donde la va a buscar quien la necesita.
 *
 * Se usa `<details>` nativo en vez de un acordeon de libreria: funciona sin
 * JavaScript, el buscador del navegador encuentra el texto de dentro, y no hay
 * estado que sincronizar.
 */
export default async function PreguntasFrecuentes() {
  const [faqs, guias, config] = await Promise.all([
    listarFaqs(),
    listarGuias(),
    obtenerConfiguracion(),
  ]);
  const consulta = enlaceWhatsApp(config, "Hola, quisiera hacer una consulta.");
  const pedido = enlaceWhatsApp(config, mensajeDePedido());

  return (
    <>
      {/* Para que el buscador pueda mostrar las preguntas desplegables en el
          propio resultado. Solo si hay alguna: un FAQPage vacío lo marca
          como error. */}
      {faqs.length > 0 ? <DatosEstructurados datos={preguntasSchema(faqs)} /> : null}

      <EncabezadoSeccion
        titulo="Preguntas frecuentes"
        entradilla={
          <>
            Lo que más nos preguntan. Si tu duda no está aquí,{" "}
            <EnlaceWhatsApp enlace={consulta}>escríbenos por WhatsApp</EnlaceWhatsApp>.
          </>
        }
      />

      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
        {faqs.length === 0 ? (
          <p className="text-muted-foreground">Todavía no hay preguntas publicadas.</p>
        ) : (
          <ul className="aparece-grupo flex flex-col gap-3">
            {faqs.map((faq) => (
              <li key={faq.id}>
                {/* Cada pregunta en su tarjeta, como el acordeon del prototipo.
                    El foco de teclado se dibuja en la tarjeta y no en el `summary`: con el
                    `overflow-hidden` que redondea las esquinas, el contorno del
                    `summary` quedaba recortado. */}
                <details className="group tarjeta bg-muted has-[summary:focus-visible]:outline-ring overflow-hidden has-[summary:focus-visible]:outline-2 has-[summary:focus-visible]:outline-offset-2">
                  <summary className="min-h-tactil flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 outline-none [&::-webkit-details-marker]:hidden">
                    <h2 className="font-heading text-primary text-lg font-semibold text-pretty">
                      {faq.pregunta}
                    </h2>
                    <ChevronDown
                      aria-hidden
                      className="text-acento size-5 shrink-0 group-open:rotate-180 motion-safe:transition-transform"
                    />
                  </summary>
                  <p className="text-muted-foreground px-5 pb-5 text-pretty">{faq.respuesta}</p>
                </details>
              </li>
            ))}
          </ul>
        )}

        {guias.length > 0 ? (
          <section className="mt-16">
            <TituloSeccion titulo="Cómo hacerlo" />
            <div className="aparece-grupo mt-8 flex flex-col gap-10">
              {guias.map((guia) => (
                // El `id` es el `slug`: el detalle de producto enlaza aqui
                // directo. `scroll-mt` deja el titulo por debajo de la cabecera
                // fija, que si no lo taparia al llegar.
                <article key={guia.id} id={guia.slug} className="scroll-mt-24">
                  <h3 className="font-heading text-primary text-xl font-semibold">{guia.titulo}</h3>
                  {guia.resumen ? (
                    <p className="text-muted-foreground mt-1 text-pretty">{guia.resumen}</p>
                  ) : null}
                  <div className="mt-3 flex flex-col gap-3">
                    {guia.contenido
                      .split("\n\n")
                      .filter((parrafo) => parrafo.trim().length > 0)
                      .map((parrafo) => (
                        <p key={parrafo.slice(0, 40)} className="text-pretty">
                          {parrafo}
                        </p>
                      ))}
                  </div>

                  {/* Quien acaba de leer los pasos para pedir no tiene que ir a
                      buscar el boton a otra pagina. */}
                  {guia.slug === GUIA_DEL_PEDIDO && pedido ? (
                    <a
                      href={pedido}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="boton-whatsapp mt-5 w-fit"
                    >
                      <MessageCircle aria-hidden className="size-5" />
                      Pedir por WhatsApp
                    </a>
                  ) : null}
                </article>
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </>
  );
}
