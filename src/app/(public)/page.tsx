import Image from "next/image";

// Portada provisional. La portada real llega en la Fase 3, con sus 10 bloques
// (doc 03 §4.2). Esto existe para dejar el sistema de diseño aplicado y a la
// vista: tipografía, color, escala y área táctil salen de los tokens, no de
// valores sueltos.
//
// El logo va desde `public/` solo mientras tanto. En F4 pasa a leerse de
// `configuracion_sitio`, porque es administrable (R21).

const HECHOS = [
  { titulo: "Del día", detalle: "Lo horneamos y lo vendemos el mismo día" },
  { titulo: "A toda Iquitos", detalle: "Reparto propio, con movilidad nuestra" },
  { titulo: "Desde 2004", detalle: "22 años en el barrio" },
] as const;

export default function Inicio() {
  return (
    <main className="mx-auto flex min-h-screen max-w-(--container-contenido) flex-col justify-center gap-10 px-6 py-16">
      <header className="flex flex-col items-start gap-6">
        <Image
          src="/marca/logo.webp"
          alt="Panadería Pimpo's"
          width={320}
          height={107}
          priority
          className="h-auto w-56 sm:w-72"
        />

        <div className="flex flex-col gap-3">
          <h1 className="text-4xl leading-tight font-semibold text-balance sm:text-5xl">
            Pan fresco, tradición de siempre
          </h1>
          <p className="text-muted-foreground max-w-prose text-lg text-pretty">
            Panadería, pastelería y bodega en Iquitos. Elaborado y vendido el mismo día, con reparto
            propio a cada rincón de la ciudad.
          </p>
        </div>
      </header>

      {/* Franja de confianza (doc 03 §4.2, bloque 3): tres datos verificables
          de la ficha, no promesas. */}
      <ul className="grid gap-4 sm:grid-cols-3">
        {HECHOS.map(({ titulo, detalle }) => (
          <li
            key={titulo}
            className="bg-card border-border/40 flex flex-col gap-1 rounded-lg border p-4"
          >
            <span className="text-acento font-heading text-lg font-semibold">{titulo}</span>
            <span className="text-muted-foreground text-sm">{detalle}</span>
          </li>
        ))}
      </ul>

      <p className="text-muted-foreground text-sm">
        Sitio en construcción. El catálogo y las secciones llegan en la siguiente fase.
      </p>
    </main>
  );
}
