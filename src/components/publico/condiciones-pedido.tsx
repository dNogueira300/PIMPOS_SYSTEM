import type { Condicion } from "@/lib/datos/pedido";

/**
 * Las condiciones del delivery, como las lineas de una boleta: el concepto a la
 * izquierda y el dato a la derecha.
 *
 * Van pegadas al boton de pedir y no en una pagina aparte. La duda de "¿cuanto
 * me cobran por traerlo?" aparece justo antes de pulsar, y si la respuesta esta
 * a dos clics, el cliente escribe para preguntarla o se va.
 */
export function CondicionesPedido({
  condiciones,
  enmarcada = false,
  className = "",
}: {
  condiciones: readonly Condicion[];
  /**
   * Dentro de una tarjeta del prototipo (fase 3.1). La tarjeta ya pone el borde
   * de fuera: con el de la lista encima, arriba y abajo salían dos líneas.
   */
  enmarcada?: boolean;
  className?: string;
}) {
  if (condiciones.length === 0) return null;

  const lista = (
    <dl className={`divide-border divide-y ${enmarcada ? "" : "border-border/40 border-y"}`}>
      {condiciones.map(({ clave, etiqueta, valor }) => (
        <div key={clave} className="flex items-baseline justify-between gap-6 py-2.5">
          <dt className="text-muted-foreground shrink-0">{etiqueta}</dt>
          <dd className="text-right font-medium text-pretty">{valor}</dd>
        </div>
      ))}
    </dl>
  );

  return enmarcada ? (
    <div className={`tarjeta px-5 py-1.5 ${className}`}>{lista}</div>
  ) : (
    <div className={className}>{lista}</div>
  );
}
