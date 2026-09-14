import type { ReactNode } from "react";

/**
 * Titular de sección del prototipo de Stitch: serif azul grande y,
 * opcionalmente, un sello encima y una entradilla debajo (plan 03.1, tarea 3).
 *
 * El sello es OPCIONAL y se usa poco. El prototipo pone una etiqueta pequeña en
 * mayúsculas encima de las nueve secciones, y repetida así es la marca de un
 * sitio hecho por plantilla: deja de destacar nada. En la portada lo llevan como
 * mucho tres bloques.
 *
 * `nivel` existe para las páginas interiores, donde el titular de la sección es
 * el `h1` de la página. Nunca debe haber dos `h1` (doc 03 §7).
 */
export function TituloSeccion({
  id,
  titulo,
  sello,
  entradilla,
  centrado = false,
  nivel = 2,
}: {
  id?: string;
  titulo: ReactNode;
  sello?: string;
  entradilla?: ReactNode;
  centrado?: boolean;
  nivel?: 1 | 2;
}) {
  const Encabezado = nivel === 1 ? "h1" : "h2";

  return (
    <div className={centrado ? "mx-auto max-w-2xl text-center" : "max-w-2xl"}>
      {sello ? <p className="sello mb-3">{sello}</p> : null}
      <Encabezado
        id={id}
        className="font-heading text-primary text-[1.75rem] leading-[1.2] font-semibold tracking-[-0.01em] text-balance sm:text-4xl"
      >
        {titulo}
      </Encabezado>
      {entradilla ? (
        <p className="text-muted-foreground mt-3 text-base text-pretty sm:text-lg">{entradilla}</p>
      ) : null}
    </div>
  );
}
