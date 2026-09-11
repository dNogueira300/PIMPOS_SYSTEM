import type { Configuracion, Dia } from "@/lib/datos/configuracion";
import { formatearPrecio } from "@/lib/datos/catalogo";

/**
 * Datos estructurados (JSON-LD) para buscadores (doc 03 §4.4).
 *
 * Es lo que permite que Google muestre, junto al nombre de la panadería, la
 * dirección, el horario con sus dos turnos, el teléfono y el rango de precios,
 * sin que la persona tenga que entrar a la página. Para un negocio de barrio que
 * nunca tuvo presencia digital (ficha 3.4), eso pesa tanto como el sitio.
 *
 * Las funciones son puras a propósito: reciben la configuración y devuelven un
 * objeto. Así se prueban sin navegador, y lo que se prueba es exactamente lo que
 * lee el buscador.
 */

/** La ciudad. No está en `configuracion_sitio` (que guarda distrito y provincia). */
const CIUDAD = "Iquitos";

const DIA_SCHEMA: Record<Dia, string> = {
  lunes: "https://schema.org/Monday",
  martes: "https://schema.org/Tuesday",
  miercoles: "https://schema.org/Wednesday",
  jueves: "https://schema.org/Thursday",
  viernes: "https://schema.org/Friday",
  sabado: "https://schema.org/Saturday",
  domingo: "https://schema.org/Sunday",
};

type HorarioSchema = {
  "@type": "OpeningHoursSpecification";
  dayOfWeek: string[];
  opens: string;
  closes: string;
};

/**
 * El horario semanal en el formato de schema.org.
 *
 * Los días con el mismo turno se agrupan: lunes a sábado comparten los dos, así
 * que salen dos entradas en vez de doce. Un día sin turnos (el domingo) no
 * aparece, y es lo correcto: en schema.org, un día que no figura es un día
 * cerrado. Escribirlo con horas vacías sería decir que abre.
 */
export function horarioSchema(horario: Configuracion["horario_semanal"]): HorarioSchema[] {
  const porTramo = new Map<string, HorarioSchema>();

  for (const [dia, tramos] of Object.entries(horario)) {
    const diaSchema = DIA_SCHEMA[dia as Dia];
    // Una clave que el negocio escribió mal en el panel se ignora, en vez de
    // publicar un `dayOfWeek` que ningún buscador entiende.
    if (!diaSchema) continue;

    for (const { desde, hasta } of tramos) {
      const clave = `${desde}-${hasta}`;
      const existente = porTramo.get(clave);
      if (existente) {
        existente.dayOfWeek.push(diaSchema);
      } else {
        porTramo.set(clave, {
          "@type": "OpeningHoursSpecification",
          dayOfWeek: [diaSchema],
          opens: desde,
          closes: hasta,
        });
      }
    }
  }

  return [...porTramo.values()];
}

/** "S/ 0.10 - S/ 25.00", o null si no hay precios que decir. */
export function rangoDePrecios(precios: readonly (number | null)[]): string | null {
  const validos = precios.filter((p): p is number => p !== null && Number.isFinite(p));
  if (validos.length === 0) return null;

  const minimo = Math.min(...validos);
  const maximo = Math.max(...validos);
  return minimo === maximo
    ? formatearPrecio(minimo)
    : `${formatearPrecio(minimo)} - ${formatearPrecio(maximo)}`;
}

/** La panadería como negocio local: nombre, dirección, horario, contacto. */
export function panaderiaSchema(opciones: {
  config: Configuracion;
  urlSitio: string;
  urlLogo: string;
  precios: readonly (number | null)[];
}) {
  const { config, urlSitio, urlLogo, precios } = opciones;

  const calle = [config.direccion, config.distrito].filter((p) => p.trim()).join(", ");
  const redes = [config.facebook, config.instagram].filter((url) => url.trim().length > 0);
  const rango = rangoDePrecios(precios);

  return {
    "@context": "https://schema.org",
    "@type": "Bakery",
    "@id": `${urlSitio}/#panaderia`,
    name: config.nombre_comercial,
    url: urlSitio,
    logo: urlLogo,
    image: urlLogo,
    ...(config.telefono ? { telephone: config.telefono } : {}),
    ...(config.correo ? { email: config.correo } : {}),
    address: {
      "@type": "PostalAddress",
      ...(calle ? { streetAddress: calle } : {}),
      addressLocality: CIUDAD,
      ...(config.departamento ? { addressRegion: config.departamento } : {}),
      addressCountry: "PE",
    },
    ...(config.coordenadas
      ? {
          geo: {
            "@type": "GeoCoordinates",
            latitude: config.coordenadas.lat,
            longitude: config.coordenadas.lng,
          },
        }
      : {}),
    openingHoursSpecification: horarioSchema(config.horario_semanal),
    ...(rango ? { priceRange: rango } : {}),
    // Solo las redes que el negocio cargó. Un `sameAs` vacío o con una URL a
    // ninguna parte es ruido para el buscador.
    ...(redes.length > 0 ? { sameAs: redes } : {}),
  };
}

/** Las preguntas frecuentes, para que Google pueda mostrarlas desplegables. */
export function preguntasSchema(faqs: readonly { pregunta: string; respuesta: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map(({ pregunta, respuesta }) => ({
      "@type": "Question",
      name: pregunta,
      acceptedAnswer: { "@type": "Answer", text: respuesta },
    })),
  };
}

/**
 * Serializa para meterlo en un `<script type="application/ld+json">`.
 *
 * El `replace` no es cosmético. Estos textos los escribe una persona desde el
 * panel, y `JSON.stringify` no escapa `<`: una respuesta de FAQ que contuviera
 * `</script><script>...` cerraría la etiqueta y ejecutaría lo que viniera
 * detrás en el navegador de cada visitante. `<` es el mismo carácter para
 * el JSON y ya no es una etiqueta para el HTML. Es lo que recomienda la propia
 * documentación de Next.
 */
export function serializarJsonLd(datos: unknown): string {
  return JSON.stringify(datos).replace(/</g, "\\u003c");
}
