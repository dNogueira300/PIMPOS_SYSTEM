import { serializarJsonLd } from "@/lib/seo/datos-estructurados";

/**
 * Datos estructurados para buscadores, como `<script type="application/ld+json">`.
 *
 * Un `<script>` nativo y no `next/script`: esto no es código que se ejecute,
 * son datos que lee el buscador. `next/script` está pensado para cargar y
 * ejecutar JavaScript, y aquí solo añadiría trabajo.
 *
 * El escape de `<` lo hace `serializarJsonLd`, y es lo que impide que un texto
 * escrito desde el panel cierre la etiqueta. No se pasa `JSON.stringify` a
 * pelo nunca.
 */
export function DatosEstructurados({ datos }: { datos: unknown }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: serializarJsonLd(datos) }}
    />
  );
}
