import type { Metadata } from "next";
import { MessageCircle } from "lucide-react";

import { EncabezadoSeccion } from "@/components/publico/encabezado-seccion";
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
            <EnlaceWhatsApp enlace={consulta} variante="sobre-azul">
              escríbenos por WhatsApp
            </EnlaceWhatsApp>
            .
          </>
        }
      />

      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
        {faqs.length === 0 ? (
          <p className="text-muted-foreground">Todavía no hay preguntas publicadas.</p>
        ) : (
          <ul className="aparece-grupo border-border/30 border-t">
            {faqs.map((faq) => (
              <li key={faq.id} className="border-border/30 border-b">
                <details className="group">
                  <summary className="focus-visible:outline-ring min-h-tactil flex cursor-pointer list-none items-center justify-between gap-4 py-4 focus-visible:outline-2 focus-visible:outline-offset-2">
                    <h2 className="font-heading text-lg text-pretty">{faq.pregunta}</h2>
                    <span
                      aria-hidden
                      className="text-acento shrink-0 text-2xl transition-transform group-open:rotate-45"
                    >
                      +
                    </span>
                  </summary>
                  <p className="text-muted-foreground pb-5 text-pretty">{faq.respuesta}</p>
                </details>
              </li>
            ))}
          </ul>
        )}

        {guias.length > 0 ? (
          <section className="mt-16">
            <h2 className="font-heading text-3xl">Cómo hacerlo</h2>
            <div className="aparece-grupo mt-8 flex flex-col gap-10">
              {guias.map((guia) => (
                // El `id` es el `slug`: el detalle de producto enlaza aqui
                // directo. `scroll-mt` deja el titulo por debajo de la cabecera
                // fija, que si no lo taparia al llegar.
                <article key={guia.id} id={guia.slug} className="scroll-mt-24">
                  <h3 className="font-heading text-acento text-xl">{guia.titulo}</h3>
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
                      className="boton-cta mt-5 w-fit"
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
