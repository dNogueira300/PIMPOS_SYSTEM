import Link from "next/link";
import { ExternalLink, Mail, MapPin, Phone } from "lucide-react";

import { anioActual, direccionCompleta, type Configuracion } from "@/lib/datos/configuracion";

import { Horario } from "./horario";
import { SECCIONES } from "./navegacion";

export async function Pie({ config }: { config: Configuracion }) {
  const direccion = direccionCompleta(config);
  const anio = await anioActual();

  // `pb-20` en el celular: la altura del boton flotante mas su margen. El pie es
  // el final del documento, asi que aqui no queda scroll con el que apartar lo
  // de debajo: sin este hueco el boton se queda encima de «Iquitos, Perú» para
  // siempre (critica del 12/09). El hueco estuvo primero en `<main>`, que no es
  // lo ultimo que se ve, y la prueba lo cazo. Desde `sm` no hay flotante.
  return (
    <footer className="bg-primary text-primary-foreground mt-24 pb-20 sm:pb-0">
      <div className="mx-auto grid max-w-(--container-contenido) gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[1.2fr_1fr_1.3fr]">
        <div className="flex flex-col gap-4">
          <p className="font-heading text-2xl">{config.nombre_comercial}</p>
          {config.eslogan ? (
            <p className="text-primary-foreground/80 text-pretty">{config.eslogan}</p>
          ) : null}

          <ul className="flex flex-col gap-2 text-sm">
            {direccion ? (
              <li className="flex items-start gap-2">
                <MapPin aria-hidden className="mt-0.5 size-4 shrink-0" />
                <span>{direccion}</span>
              </li>
            ) : null}
            {config.telefono ? (
              <li className="flex items-center gap-2">
                <Phone aria-hidden className="size-4 shrink-0" />
                <a
                  href={`tel:${config.telefono.replace(/\s/g, "")}`}
                  className="min-h-tactil flex items-center hover:underline"
                >
                  {config.telefono}
                </a>
              </li>
            ) : null}
            {config.correo ? (
              <li className="flex items-center gap-2">
                <Mail aria-hidden className="size-4 shrink-0" />
                <a
                  href={`mailto:${config.correo}`}
                  className="min-h-tactil flex items-center break-all hover:underline"
                >
                  {config.correo}
                </a>
              </li>
            ) : null}
          </ul>

          {/* Las redes vienen vacias en la ficha. Se muestran solo si el negocio
              las carga desde el panel: un icono que lleva a ningun sitio es
              peor que no tenerlo.

              Van con su nombre escrito y no con el logotipo de la red: la
              version 1 de lucide retiro las marcas comerciales, y dibujar un
              logotipo ajeno a mano no es algo que deba hacer este proyecto. */}
          {config.facebook || config.instagram ? (
            <ul className="flex flex-col gap-1 text-sm">
              {config.facebook ? (
                <li>
                  <a
                    href={config.facebook}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="min-h-tactil flex items-center gap-2 hover:underline"
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
                    className="min-h-tactil flex items-center gap-2 hover:underline"
                  >
                    <ExternalLink aria-hidden className="size-4 shrink-0" />
                    Instagram
                  </a>
                </li>
              ) : null}
            </ul>
          ) : null}
        </div>

        <nav aria-label="Secciones del sitio">
          <h2 className="font-heading mb-4 text-lg">Secciones</h2>
          <ul className="flex flex-col gap-1 text-sm">
            {SECCIONES.map(({ ruta, nombre }) => (
              <li key={ruta}>
                <Link href={ruta} className="min-h-tactil flex items-center hover:underline">
                  {nombre}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div>
          <h2 className="font-heading mb-4 text-lg">Horario de atención</h2>
          <Horario config={config} variante="oscuro" />
        </div>
      </div>

      <div className="border-primary-foreground/20 border-t">
        <div className="text-primary-foreground/70 mx-auto flex max-w-(--container-contenido) flex-col gap-1 px-4 py-6 text-xs sm:flex-row sm:justify-between sm:px-6">
          <p>
            {anio} {config.razon_social || config.nombre_comercial}
          </p>
          <p>Iquitos, Perú</p>
        </div>
      </div>
    </footer>
  );
}
