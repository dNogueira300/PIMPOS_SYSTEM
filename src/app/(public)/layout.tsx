import { BotonWhatsApp } from "@/components/publico/boton-whatsapp";
import { Cabecera } from "@/components/publico/cabecera";
import { Pie } from "@/components/publico/pie";
import { enlaceWhatsApp, obtenerConfiguracion } from "@/lib/datos/configuracion";
import { urlDeImagen } from "@/lib/supabase/publico";

/**
 * Layout del sitio publico.
 *
 * Lee la configuracion una vez y la reparte. Esa lectura esta cacheada con la
 * etiqueta `marca`, asi que no cuesta una consulta por pagina: cuando el
 * negocio cambia el logo o los horarios desde el panel, se invalida la etiqueta
 * y se refrescan las ocho secciones a la vez (R21).
 */
export default async function LayoutPublico({ children }: LayoutProps<"/">) {
  const config = await obtenerConfiguracion();

  return (
    <>
      {/* Primer elemento enfocable de la pagina: quien navega con teclado no
          tiene que recorrer las siete secciones en cada pagina. */}
      <a
        href="#contenido"
        className="bg-cta text-cta-foreground focus:ring-ring sr-only rounded-md px-4 py-2 focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-50 focus:ring-2"
      >
        Saltar al contenido
      </a>

      <Cabecera
        logo={urlDeImagen("marca", config.logo_url) ?? "/marca/logo.webp"}
        logoAlt={config.logo_alt}
        whatsapp={enlaceWhatsApp(config, "Hola, quisiera hacer un pedido.")}
      />

      <main id="contenido">{children}</main>

      <BotonWhatsApp enlace={enlaceWhatsApp(config, "Hola, quisiera hacer un pedido.")} />
      <Pie config={config} />
    </>
  );
}
