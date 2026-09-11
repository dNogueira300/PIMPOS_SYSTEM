import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { EnlaceWhatsApp } from "@/components/publico/enlace-whatsapp";
import { PizarraPrecios } from "@/components/publico/pizarra-precios";
import { listarDestacados } from "@/lib/datos/catalogo";
import { enlaceWhatsApp, obtenerConfiguracion } from "@/lib/datos/configuracion";

/**
 * "No encontramos esta pagina", para los dos 404 del sitio: una direccion que
 * no existe y un producto o una novedad que ya no estan publicados.
 *
 * Antes eran los de Next: en ingles, sobre blanco y sin salida. Quien llega
 * aqui casi siempre viene de un enlace viejo reenviado por WhatsApp, y lo que
 * buscaba era pan, un precio o una forma de pedir. Por eso la pagina no se
 * queda en la disculpa: da las tres salidas y ensena lo que se hornea hoy.
 *
 * Sin el numero 404 a la vista, a proposito: docs/marca.md pide que un error
 * explique que hacer y nunca muestre un codigo. Para el buscador ya esta el
 * estado HTTP.
 */
export async function PaginaNoEncontrada() {
  const [config, destacados] = await Promise.all([obtenerConfiguracion(), listarDestacados(4)]);
  const consulta = enlaceWhatsApp(
    config,
    "Hola, estaba buscando algo en su página y no lo encontré.",
  );

  return (
    <div className="mx-auto max-w-(--container-contenido) px-4 py-16 sm:px-6 sm:py-24">
      <div className="max-w-2xl">
        <h1 className="font-heading text-4xl text-balance sm:text-5xl">
          No encontramos esta página
        </h1>
        <p className="text-muted-foreground mt-4 text-lg text-pretty">
          Puede que el enlace tenga un error o que lo que buscabas ya no esté publicado. El pan del
          día, sus precios y el delivery siguen donde siempre.
        </p>

        <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
          <Link href="/productos" className="boton-cta">
            Ver el catálogo
          </Link>
          <Link
            href="/"
            className="text-acento focus-visible:outline-ring min-h-tactil inline-flex items-center gap-1.5 font-medium hover:underline focus-visible:outline-2 focus-visible:outline-offset-2"
          >
            Volver al inicio
            <ArrowRight aria-hidden className="size-4" />
          </Link>
        </div>

        {consulta ? (
          <p className="text-muted-foreground mt-8 text-pretty">
            ¿Buscabas algo en especial?{" "}
            <EnlaceWhatsApp enlace={consulta}>Escríbenos por WhatsApp</EnlaceWhatsApp> y te decimos
            si lo tenemos.
          </p>
        ) : null}
      </div>

      {destacados.length > 0 ? (
        <section aria-labelledby="titulo-mientras" className="mt-16 max-w-3xl">
          <h2 id="titulo-mientras" className="font-heading text-2xl">
            Mientras tanto, lo que horneamos hoy
          </h2>
          <PizarraPrecios productos={destacados} className="mt-4" />
        </section>
      ) : null}
    </div>
  );
}
