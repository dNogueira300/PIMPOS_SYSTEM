"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, X } from "lucide-react";

import { SECCIONES, esSeccionActiva } from "./navegacion";

type Props = {
  /** Solo para el nombre accesible del enlace: el logo raster ya no se pinta. */
  logoAlt: string;
  isotipo: string;
  nombre: string;
  /** El horario ya agrupado y con las horas escritas, listo para pintar. */
  horario: { dias: string; turnos: string[] }[];
  whatsapp: string | null;
};

// En el menu del celular va tambien "Inicio": en escritorio el logo ya lleva a
// la portada y todo el mundo lo sabe, pero en un menu desplegable la primera
// opcion que se busca para volver es esa (critica del 11/09).
const SECCIONES_DEL_MENU = [{ ruta: "/", nombre: "Inicio" }, ...SECCIONES] as const;

/**
 * Cabecera del sitio publico.
 *
 * Es cliente porque necesita saber la ruta actual y abrir el menu en movil. El
 * resto del sitio sigue siendo servidor: esto es una hoja aislada.
 *
 * La navegacion cabe en una linea en escritorio con las siete secciones; por
 * debajo de `lg` pasa a menu desplegable en lugar de partirse en dos filas.
 */
export function Cabecera({ logoAlt, isotipo, nombre, horario, whatsapp }: Props) {
  const ruta = usePathname();
  const [abierto, setAbierto] = useState(false);

  return (
    <header className="bg-primary text-primary-foreground sticky top-0 z-40">
      <div className="mx-auto flex max-w-(--container-contenido) items-center gap-4 px-4 py-3 sm:px-6">
        <Link
          href="/"
          className="focus-visible:outline-primary-foreground shrink-0 rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4"
          aria-label={`${logoAlt}, ir al inicio`}
        >
          {/* El isotipo y el nombre escrito, en todas las pantallas.

              El logo raster a 44 px de alto no se lee: el arco "PANADERÍA
              PASTELERÍA Y BODEGA" queda en letras de dos pixeles. Se arreglo
              primero solo en el celular, y la segunda critica (12/09) encontro
              que en escritorio seguia igual, que es donde peor sienta: es el
              primer elemento del primer pliegue y el unico que dice de quien es
              la pagina.

              El isotipo es SVG: `unoptimized` porque el optimizador de Next no
              toca los vectores, y asi escala sin limite. El logo completo se
              queda para donde se ve grande: los datos estructurados y la imagen
              para compartir el enlace. */}
          <span className="flex items-center gap-2 sm:gap-3">
            <Image
              src={isotipo}
              alt=""
              width={40}
              height={44}
              priority
              unoptimized
              className="h-11 w-auto sm:h-12"
            />
            <span className="font-heading text-xl leading-none sm:text-2xl">{nombre}</span>
          </span>
        </Link>

        <nav aria-label="Secciones del sitio" className="ml-auto hidden lg:block">
          <ul className="flex items-center gap-1">
            {SECCIONES.map(({ ruta: destino, nombre: seccion }) => {
              const activa = esSeccionActiva(ruta, destino);
              return (
                <li key={destino}>
                  <Link
                    href={destino}
                    aria-current={activa ? "page" : undefined}
                    className={`focus-visible:outline-primary-foreground min-h-tactil flex items-center rounded-md px-3 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 ${
                      activa
                        ? "bg-primary-foreground/15 font-medium"
                        : "hover:bg-primary-foreground/10"
                    }`}
                  >
                    {seccion}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {whatsapp ? (
          <a
            href={whatsapp}
            target="_blank"
            rel="noopener noreferrer"
            className="boton-cta boton-cta--sobre-azul ml-auto hidden px-4 text-sm sm:inline-flex lg:ml-4"
          >
            Pedir por WhatsApp
          </a>
        ) : null}

        <button
          type="button"
          onClick={() => setAbierto((estaba) => !estaba)}
          aria-expanded={abierto}
          aria-controls="menu-movil"
          className="focus-visible:outline-primary-foreground size-tactil ml-auto flex items-center justify-center rounded-md focus-visible:outline-2 focus-visible:outline-offset-2 sm:ml-0 lg:hidden"
        >
          {abierto ? <X aria-hidden className="size-6" /> : <Menu aria-hidden className="size-6" />}
          <span className="sr-only">{abierto ? "Cerrar el menú" : "Abrir el menú"}</span>
        </button>
      </div>

      {/* `hidden` en vez de desmontar: el menu conserva su sitio en el DOM y el
          lector de pantalla anuncia el cambio de estado del boton. */}
      <div
        id="menu-movil"
        hidden={!abierto}
        className="border-primary-foreground/20 border-t lg:hidden"
      >
        <nav
          aria-label="Secciones del sitio"
          className="mx-auto max-w-(--container-contenido) px-4 pb-4 sm:px-6"
        >
          <ul className="flex flex-col">
            {SECCIONES_DEL_MENU.map(({ ruta: destino, nombre: seccion }) => (
              <li key={destino}>
                <Link
                  href={destino}
                  aria-current={esSeccionActiva(ruta, destino) ? "page" : undefined}
                  // `onNavigate`, no `onClick` ni un efecto sobre la ruta.
                  //
                  // Con `onClick` el enlace se queda oculto en el mismo evento
                  // en que se pulsa y la navegacion no llega a ocurrir (pasó, y
                  // lo cazo la prueba de movil). Con un efecto sobre la ruta se
                  // cierra, pero a costa de un render extra en cada cambio de
                  // pagina, y ademas es lo que prohibe la regla
                  // `react-hooks/set-state-in-effect`. `onNavigate` se dispara
                  // cuando la navegacion ya empezo, que es justo el momento.
                  onNavigate={() => setAbierto(false)}
                  className="border-primary-foreground/10 min-h-tactil flex items-center border-b text-base"
                >
                  {seccion}
                </Link>
              </li>
            ))}
          </ul>

          {/* El horario a mano en el menu: es lo que mas se busca antes de salir
              de casa, y en el celular estaba a mas de 4000 px de scroll, en el
              pie (critica del 11/09). */}
          {horario.length > 0 ? (
            <section aria-label="Horario de atención" className="mt-4 text-sm">
              <p className="font-heading text-base">Horario</p>
              <dl className="text-primary-foreground/80 mt-1">
                {horario.map(({ dias, turnos }) => (
                  <div key={dias} className="flex justify-between gap-4 py-1">
                    <dt>{dias}</dt>
                    <dd className="text-right tabular-nums">
                      {turnos.length > 0
                        ? turnos.map((turno) => (
                            <span key={turno} className="block whitespace-nowrap">
                              {turno}
                            </span>
                          ))
                        : "Cerrado"}
                    </dd>
                  </div>
                ))}
              </dl>
            </section>
          ) : null}

          {whatsapp ? (
            <a
              href={whatsapp}
              target="_blank"
              rel="noopener noreferrer"
              className="boton-cta mt-4 flex px-4 sm:hidden"
            >
              Pedir por WhatsApp
            </a>
          ) : null}
        </nav>
      </div>
    </header>
  );
}
