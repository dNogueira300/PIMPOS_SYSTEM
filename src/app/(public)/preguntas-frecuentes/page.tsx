import type { Metadata } from "next";

import { EncabezadoSeccion } from "@/components/publico/encabezado-seccion";
import { listarFaqs, listarGuias } from "@/lib/datos/contenido";

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
  const [faqs, guias] = await Promise.all([listarFaqs(), listarGuias()]);

  return (
    <>
      <EncabezadoSeccion
        titulo="Preguntas frecuentes"
        entradilla="Lo que más nos preguntan. Si tu duda no está aquí, escríbenos por WhatsApp."
      />

      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
        {faqs.length === 0 ? (
          <p className="text-muted-foreground">Todavía no hay preguntas publicadas.</p>
        ) : (
          <ul className="border-border/30 border-t">
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
            <div className="mt-8 flex flex-col gap-10">
              {guias.map((guia) => (
                <article key={guia.id}>
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
                </article>
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </>
  );
}
