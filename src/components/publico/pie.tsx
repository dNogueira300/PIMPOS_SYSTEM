import Link from "next/link";
import { ArrowRight, ExternalLink, Mail, MapPin, Phone } from "lucide-react";

import { anioActual, direccionCompleta, type Configuracion } from "@/lib/datos/configuracion";

import { Horario } from "./horario";
import { SECCIONES } from "./navegacion";

/** Titular de columna: serif azul, como los del prototipo. */
const TITULO_COLUMNA = "font-heading text-primary mb-4 text-lg font-semibold";
/** Enlace del pie: gris cálido que se vuelve azul, siempre con 44 px de alto. */
const ENLACE = "text-muted-foreground hover:text-primary min-h-tactil flex items-center";

/**
 * Pie del sitio público, en cuatro columnas como el del prototipo de Stitch
 * (plan 03.1, tarea 4): la marca, cómo contactar, el horario y las secciones.
 *
 * Claro y no azul desde 3.1. Del prototipo NO se toman ni el acceso al panel
 * («Acceso Kárdex & Panel») —el panel no se anuncia al visitante, y `robots.txt`
 * lo deja fuera— ni «Libro de reclamaciones» y «Términos de envío», que son
 * enlaces a páginas que no existen.
 */
export async function Pie({ config }: { config: Configuracion }) {
  const direccion = direccionCompleta(config);
  const anio = await anioActual();

  // `pb-20` en el celular: la altura del boton flotante mas su margen. El pie es
  // el final del documento, asi que aqui no queda scroll con el que apartar lo
  // de debajo: sin este hueco el boton se queda encima de «Iquitos, Perú» para
  // siempre (critica del 12/09). El hueco estuvo primero en `<main>`, que no es
  // lo ultimo que se ve, y la prueba lo cazo. Desde `sm` no hay flotante.
  return (
    <footer className="bg-muted text-foreground border-border mt-24 border-t pb-20 sm:pb-0">
      <div className="mx-auto grid max-w-(--container-contenido) gap-10 px-4 py-14 sm:grid-cols-2 sm:px-6 lg:grid-cols-4">
        {/* 1. La marca */}
        <div className="flex flex-col gap-3">
          <p className="font-heading text-primary text-2xl font-semibold">
            {config.nombre_comercial}
          </p>
          {config.eslogan ? (
            <p className="text-muted-foreground text-pretty">{config.eslogan}</p>
          ) : null}

          {/* Las redes vienen vacias en la ficha. Se muestran solo si el negocio
              las carga desde el panel: un icono que lleva a ningun sitio es
              peor que no tenerlo.

              Van con su nombre escrito y no con el logotipo de la red: la
              version 1 de lucide retiro las marcas comerciales, y dibujar un
              logotipo ajeno a mano no es algo que deba hacer este proyecto. */}
          {config.facebook || config.instagram ? (
            <ul className="flex flex-col text-sm">
              {config.facebook ? (
                <li>
                  <a
                    href={config.facebook}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`${ENLACE} gap-2`}
                  >
                    <ExternalLink aria-hidden className="size-4 shrink-0" />
                    Facebook
                  </a>
                </li>
              ) : null}
              {config.instagram ? (
                <li>
                  <a
                    href={config.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`${ENLACE} gap-2`}
                  >
                    <ExternalLink aria-hidden className="size-4 shrink-0" />
                    Instagram
                  </a>
                </li>
              ) : null}
            </ul>
          ) : null}
        </div>

        {/* 2. Contacto y dirección */}
        <div>
          <h2 className={TITULO_COLUMNA}>Dónde estamos</h2>
          <ul className="flex flex-col gap-1 text-sm">
            {direccion ? (
              <li className="text-muted-foreground flex items-start gap-2 py-2">
                <MapPin aria-hidden className="text-acento mt-0.5 size-4 shrink-0" />
                <span>{direccion}</span>
              </li>
            ) : null}
            {config.telefono ? (
              <li className="flex items-center gap-2">
                <Phone aria-hidden className="text-acento size-4 shrink-0" />
                <a href={`tel:${config.telefono.replace(/\s/g, "")}`} className={ENLACE}>
                  {config.telefono}
                </a>
              </li>
            ) : null}
            {config.correo ? (
              <li className="flex items-center gap-2">
                <Mail aria-hidden className="text-acento size-4 shrink-0" />
                <a href={`mailto:${config.correo}`} className={`${ENLACE} break-all`}>
                  {config.correo}
                </a>
              </li>
            ) : null}
            <li>
              <Link
                href="/ubicacion"
                className="text-acento min-h-tactil flex items-center gap-1.5 font-semibold hover:underline"
              >
                Ver el mapa
                <ArrowRight aria-hidden className="size-4" />
              </Link>
            </li>
          </ul>
        </div>

        {/* 3. Horario */}
        <div>
          <h2 className={TITULO_COLUMNA}>Horario de atención</h2>
          <Horario config={config} />
        </div>

        {/* 4. Secciones.

            Etiqueta distinta a la de la cabecera a proposito. Las dos listas
            llevan las mismas secciones, pero quien navega por landmarks con un
            lector de pantalla veia "Secciones del sitio" dos veces y no podia
            saber cual era el menu y cual el pie (axe, regla `landmark-unique`).
            El nombre visible sigue siendo "Secciones". */}
        <nav aria-label="Secciones del sitio, en el pie">
          <h2 className={TITULO_COLUMNA}>Secciones</h2>
          <ul className="grid grid-cols-2 gap-x-4 text-sm sm:grid-cols-1">
            {SECCIONES.map(({ ruta, nombre }) => (
              <li key={ruta}>
                <Link href={ruta} className={ENLACE}>
                  {nombre}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      <div className="mx-auto max-w-(--container-contenido) px-4 pb-8 sm:px-6">
        <div className="tarjeta text-muted-foreground flex flex-col gap-1 px-5 py-4 text-xs sm:flex-row sm:justify-between">
          <p>
            © {anio} {config.razon_social || config.nombre_comercial}
          </p>
          <p>Iquitos, Perú</p>
        </div>
      </div>
    </footer>
  );
}
