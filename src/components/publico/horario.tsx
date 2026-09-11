import { formatearHora, type Configuracion } from "@/lib/datos/configuracion";
import { agruparHorario } from "@/lib/datos/horario";

/**
 * El horario de la semana: los dias que abren igual van juntos, y cada turno en
 * su propia linea.
 *
 * Juntos, porque una fila por dia eran siete filas casi identicas (critica de
 * diseno del 11/09): de lunes a sabado se abre igual y el domingo se cierra.
 * Son dos datos, y en la portada, en ubicacion y en contacto el horario sale
 * dos veces (la seccion y el pie), asi que cada fila de mas se pagaba doble.
 *
 * Cada turno en su linea, en todos los tamanos: la primera version unia los
 * dos con un "y" en medio, y en un telefono la linea se partia justo por la
 * hora de cierre, "4:00 p. m. a" arriba y "9:00 p. m." abajo, que se lee como un
 * error. Dos horarios distintos no son una frase, son dos datos. Es lo que el
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
  const grupos = agruparHorario(config.horario_semanal);

  return (
    <>
      {grupos.length > 0 ? (
        <dl className="text-sm">
          {grupos.map(({ dias, tramos }) => {
            const cerrado = tramos.length === 0;

            return (
              <div
                key={dias}
                className={`${separador} flex justify-between gap-4 border-b py-2 last:border-b-0`}
              >
                <dt className={cerrado ? apagado : "font-medium"}>{dias}</dt>
                <dd className={`text-right ${cerrado ? apagado : ""}`}>
                  {cerrado ? (
                    "Cerrado"
                  ) : (
                    // `tabular-nums` alinea las cifras de las dos lineas: sin
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
      ) : null}

      {config.nota_horarios ? (
        <p className={`text-sm ${grupos.length > 0 ? "mt-3" : ""} ${apagado}`}>
          {config.nota_horarios}
        </p>
      ) : null}
    </>
  );
}
