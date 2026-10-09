"use client";

import { LogoMarca } from "@/components/marca/logo-marca";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, X } from "lucide-react";

import { SECCIONES, esSeccionActiva } from "./navegacion";

type Props = {
  /** Nombre accesible del enlace a inicio. */
  logoAlt: string;
  logoSrc: string;
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
 * La navegacion va en una linea desde `xl` (1280 px) y por debajo pasa a menu
 * desplegable, como en el prototipo de Stitch. Estuvo en `lg` (1024 px) hasta
 * la fase 3.1: con la cabecera nueva —isotipo en circulo, nombre con su linea
 * de oficio, enlaces en pildora y el boton de pedir sin partirse— el contenido
 * mide unos 1200 px, y a 1024 la pagina entera se desplazaba 173 px en
 * horizontal. Lo vigila e2e/cabecera.spec.ts en 768, 1024, 1100, 1280 y 1366.
 */
export function Cabecera({ logoAlt, logoSrc, isotipo, nombre, horario, whatsapp }: Props) {
  const ruta = usePathname();
  const [abierto, setAbierto] = useState(false);
  // El logo principal es el aprobado/configurado. Un dibujo administrado
  // conserva su efecto en la cabecera, sin recuperar el SVG anterior por defecto.
  const isotipoPersonalizado = isotipo !== "/marca/isotipo.svg";

  return (
    // Fondo crema sólido de la dirección A. Fondo SÓLIDO: el
    // prototipo lo hace translúcido con `backdrop-blur`, y un desenfoque en una
    // cabecera fija se recalcula en cada paso del scroll, que en un celular
    // modesto se nota. La portada ya está justa de rendimiento (plan 03.1).
    <header className="bg-background text-foreground border-border sticky top-0 z-40 border-b">
      <div className="mx-auto flex max-w-(--container-contenido) items-center gap-4 px-4 py-2.5 sm:px-6 sm:py-3.5">
        <Link
          href="/"
          className="focus-visible:outline-ring shrink-0 rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4"
          aria-label={`${logoAlt}, ir al inicio`}
        >
          <span className="flex items-center gap-2 sm:gap-3">
            <span className="relative flex h-12 w-[72px] shrink-0 items-center">
              <LogoMarca
                src={logoSrc}
                alt=""
                sizes="72px"
                className={`h-12 object-contain ${isotipoPersonalizado ? "w-12" : "w-[72px]"}`}
              />
              {isotipoPersonalizado ? (
                <span className="bg-primary absolute top-1/2 right-0 grid size-6 -translate-y-1/2 place-items-center rounded-sm">
                  <LogoMarca src={isotipo} alt="" sizes="20px" className="size-5 object-contain" />
                </span>
              ) : null}
            </span>
            <span className="flex flex-col">
              <span className="font-heading text-primary text-xl leading-none font-semibold sm:text-2xl">
                {nombre}
              </span>
              {/* Lo que es, en letra pequeña, como en el prototipo. Sale de la
                  razón social («Panadería Pastelería y Bodega»), no inventado. */}
              <span className="text-acento mt-1 hidden text-[0.6875rem] leading-none font-semibold tracking-[0.08em] uppercase sm:block">
                Panadería y pastelería · Iquitos
              </span>
            </span>
          </span>
        </Link>

        <nav aria-label="Secciones del sitio" className="ml-auto hidden xl:block">
          <ul className="flex items-center gap-1">
            {SECCIONES.map(({ ruta: destino, nombre: seccion }) => {
              const activa = esSeccionActiva(ruta, destino);
              return (
                <li key={destino}>
                  <Link
                    href={destino}
                    aria-current={activa ? "page" : undefined}
                    className={`focus-visible:outline-ring min-h-tactil flex items-center rounded-md px-3 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 ${
                      activa
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-muted hover:text-primary"
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
            className="boton-whatsapp ml-auto hidden shrink-0 px-4 text-sm whitespace-nowrap sm:inline-flex xl:ml-4"
          >
            Pedir por WhatsApp
          </a>
        ) : null}

        <button
          type="button"
          onClick={() => setAbierto((estaba) => !estaba)}
          aria-expanded={abierto}
          aria-controls="menu-movil"
          className="text-primary focus-visible:outline-ring size-tactil ml-auto flex items-center justify-center rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 sm:ml-0 xl:hidden"
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
        className="border-border bg-background border-t xl:hidden"
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
                  className="border-border text-foreground aria-[current=page]:text-primary min-h-tactil flex items-center border-b text-base aria-[current=page]:font-semibold"
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
            <section aria-label="Horario de atención" className="tarjeta bg-muted mt-4 p-4 text-sm">
              <p className="font-heading text-primary text-base font-semibold">Horario</p>
              <dl className="text-muted-foreground mt-1">
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
              className="boton-whatsapp mt-4 flex px-4 sm:hidden"
            >
              Pedir por WhatsApp
            </a>
          ) : null}
        </nav>
      </div>
    </header>
  );
}
