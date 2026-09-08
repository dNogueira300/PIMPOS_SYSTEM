import { DIAS, formatearHora, type Configuracion } from "@/lib/datos/configuracion";

const NOMBRE_DEL_DIA: Record<(typeof DIAS)[number], string> = {
  lunes: "Lunes",
  martes: "Martes",
  miercoles: "Miércoles",
  jueves: "Jueves",
  viernes: "Viernes",
  sabado: "Sábado",
  domingo: "Domingo",
};

/**
 * El horario semanal, con **un turno por línea**.
 *
 * La primera versión unía los dos turnos en una sola cadena con un "y" en
 * medio. En un teléfono no cabía: la línea se partía justo por la hora de
 * cierre y quedaba "4:00 p. m. a" arriba y "9:00 p. m." abajo, que se lee como
 * un error. Y no era solo cosa del móvil, era cosa de que dos horarios
 * distintos no son una frase, son dos datos.
 *
 * Así que cada turno va en su línea, en todos los tamaños. Es el dato que el
 * cliente mira antes de salir de casa; tiene que leerse de un vistazo.
 */
export function Horario({
  config,
  variante = "claro",
}: {
  config: Configuracion;
  /** `oscuro` para el pie, que va sobre el azul institucional. */
  variante?: "claro" | "oscuro";
}) {
  const apagado = variante === "oscuro" ? "text-primary-foreground/60" : "text-muted-foreground";
  const separador = variante === "oscuro" ? "border-primary-foreground/10" : "border-border/20";

  return (
    <>
      <dl className="text-sm">
        {DIAS.map((dia) => {
          const tramos = config.horario_semanal[dia] ?? [];
          const cerrado = tramos.length === 0;

          return (
            <div
              key={dia}
              className={`${separador} flex justify-between gap-4 border-b py-2 last:border-b-0`}
            >
              <dt className={cerrado ? apagado : "font-medium"}>{NOMBRE_DEL_DIA[dia]}</dt>
              <dd className={`text-right ${cerrado ? apagado : ""}`}>
                {cerrado ? (
                  "Cerrado"
                ) : (
                  // `tabular-nums` alinea las cifras de las dos líneas: sin
                  // eso, el "1:00" y el "4:00" bailan uno respecto al otro.
                  <span className="flex flex-col tabular-nums">
                    {tramos.map((tramo) => (
                      <span key={`${tramo.desde}-${tramo.hasta}`} className="whitespace-nowrap">
                        {formatearHora(tramo.desde)} a {formatearHora(tramo.hasta)}
                      </span>
                    ))}
                  </span>
                )}
              </dd>
            </div>
          );
        })}
      </dl>

      {config.nota_horarios ? (
        <p className={`mt-3 text-sm ${apagado}`}>{config.nota_horarios}</p>
      ) : null}
    </>
  );
}
