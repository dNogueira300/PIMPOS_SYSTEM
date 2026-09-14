import { Clock } from "lucide-react";

/**
 * La barra terracota de arriba del todo (prototipo de Stitch, plan 03.1).
 *
 * El texto lo arma `textoDelAviso` con datos de la base; sin datos no hay
 * barra, porque una franja de color vacía es peor que no tenerla.
 *
 * Es un `<aside>` y va FUERA de la cabecera, por dos razones:
 *
 * - Dentro de la cabecera, que es fija, la barra se quedaría pegada arriba al
 *   bajar y se comería unos 40 px del celular en todo momento. Fuera, se va con
 *   el scroll después de haberse leído, y la cabecera sigue fija.
 * - Fuera de la cabecera y como `<div>` suelto, quedaría fuera de toda región:
 *   axe lo marca (regla `region`) y quien navega por regiones se lo salta. Es lo
 *   mismo que le pasó al botón flotante en F3, y se resuelve igual.
 */
export function BarraAviso({ texto }: { texto: string | null }) {
  if (!texto) return null;

  return (
    <aside
      data-aviso
      aria-label="Horario y reparto"
      className="bg-aviso text-aviso-foreground px-4 py-1.5 text-center text-xs font-semibold sm:text-[0.8125rem]"
    >
      <p className="mx-auto flex max-w-(--container-contenido) items-center justify-center gap-2">
        <Clock aria-hidden className="size-3.5 shrink-0" />
        <span>{texto}</span>
      </p>
    </aside>
  );
}
