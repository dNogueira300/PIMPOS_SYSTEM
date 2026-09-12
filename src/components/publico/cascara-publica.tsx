import type { ReactNode } from "react";

import { BotonWhatsApp } from "@/components/publico/boton-whatsapp";
import { Cabecera } from "@/components/publico/cabecera";
import { Pie } from "@/components/publico/pie";
import { enlaceWhatsApp, formatearHora, obtenerConfiguracion } from "@/lib/datos/configuracion";
import { agruparHorario } from "@/lib/datos/horario";
import { mensajeDePedido } from "@/lib/datos/pedido";
import { urlDeImagen } from "@/lib/supabase/publico";

/**
 * La cascara del sitio publico: salto al contenido, cabecera, pie y el boton
 * flotante de WhatsApp.
 *
 * Vive aqui y no en el layout porque la usan dos sitios. El layout de
 * `(public)`, y el 404 de una direccion que no existe (`app/not-found.tsx`), que
 * Next pinta dentro del layout raiz y no del de este grupo: sin la cascara, esa
 * pagina salia desnuda, sin menu ni forma de pedir.
 *
 * Lee la configuracion una vez y la reparte. Esa lectura esta cacheada con la
 * etiqueta `marca`, asi que no cuesta una consulta por pagina: cuando el
 * negocio cambia el logo o los horarios desde el panel, se invalida la etiqueta
 * y se refrescan las ocho secciones a la vez (R21).
 */
export async function CascaraPublica({ children }: { children: ReactNode }) {
  const config = await obtenerConfiguracion();
  const pedido = enlaceWhatsApp(config, mensajeDePedido());
  // La cabecera es de cliente: recibe el horario ya agrupado y con las horas
  // escritas, en vez de la configuracion entera y la logica para leerla.
  const horario = agruparHorario(config.horario_semanal).map(({ dias, tramos }) => ({
    dias,
    turnos: tramos.map(({ desde, hasta }) => `${formatearHora(desde)} a ${formatearHora(hasta)}`),
  }));

  return (
    <>
      {/* Primer elemento enfocable de la pagina: quien navega con teclado no
          tiene que recorrer las siete secciones en cada pagina. */}
      <a
        href="#contenido"
        className="bg-cta text-cta-foreground focus:ring-ring focus:min-h-tactil sr-only rounded-md px-4 py-2 focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-50 focus:inline-flex focus:items-center focus:ring-2"
      >
        Saltar al contenido
      </a>

      <Cabecera
        logoAlt={config.logo_alt}
        isotipo={urlDeImagen("marca", config.isotipo_url) ?? "/marca/isotipo.svg"}
        nombre={config.nombre_comercial}
        horario={horario}
        whatsapp={pedido}
      />

      {/* El hueco que reserva el boton flotante va en el pie, que es lo ultimo
          que se ve: aqui no servia de nada. */}
      <main id="contenido">{children}</main>

      <BotonWhatsApp enlace={pedido} />
      <Pie config={config} />
    </>
  );
}
