import type { Metadata } from "next";
import type { CSSProperties } from "react";
import Image from "next/image";

import { EncabezadoSeccion } from "@/components/publico/encabezado-seccion";
import { obtenerConfiguracion } from "@/lib/datos/configuracion";
import { listarGaleria } from "@/lib/datos/contenido";

export const metadata: Metadata = {
  title: "Galería",
  description:
    "Fotos de Panadería Pimpo's en Iquitos: la fachada, el interior de la tienda, el horno y la atención en el mostrador.",
};

// Los nombres que ve el visitante. La base guarda la clave; traducirla aqui
// evita que un enum de Postgres acabe impreso en la pagina.
const NOMBRE_CATEGORIA: Record<string, string> = {
  fachada: "El local",
  interior: "Por dentro",
  hornos: "El horno",
  atencion: "La atención",
  productos: "Los productos",
};

export default async function Galeria() {
  const [fotos, config] = await Promise.all([listarGaleria(), obtenerConfiguracion()]);

  // La direccion sale de la configuracion, como en el resto del sitio. Estaba
  // escrita aqui a mano ("Calle Elías Aguirre, en Belén"): si el negocio la
  // corrige desde el panel, esta pagina habria seguido diciendo la de antes.
  const donde = config.direccion
    ? ` Estamos en ${config.direccion}${config.distrito ? `, en ${config.distrito}` : ""}.`
    : "";

  // Se agrupa por categoria conservando el orden en que llegan, que ya viene
  // ordenado desde la vista.
  const grupos = new Map<string, typeof fotos>();
  for (const foto of fotos) {
    const grupo = grupos.get(foto.categoria) ?? [];
    grupo.push(foto);
    grupos.set(foto.categoria, grupo);
  }

  return (
    <>
      <EncabezadoSeccion
        titulo="Así es la panadería"
        entradilla={`Fotos del local, del horno y del día a día.${donde}`}
      />

      <div className="mx-auto max-w-(--container-contenido) px-4 py-12 sm:px-6 sm:py-16">
        {fotos.length === 0 ? (
          <p className="text-muted-foreground">Todavía no hay fotos publicadas.</p>
        ) : (
          [...grupos].map(([categoria, delGrupo]) => (
            <section key={categoria} className="mb-16 last:mb-0">
              <h2 className="font-heading text-2xl">{NOMBRE_CATEGORIA[categoria] ?? categoria}</h2>

              {/* Rejilla irregular: la primera foto de cada grupo ocupa el
                  doble. Una cuadricula perfecta de diez fotos iguales se lee
                  como catalogo de stock, no como el album de un negocio. */}
              <ul className="aparece-grupo mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {delGrupo.map((foto, indice) => (
                  <li
                    key={foto.id}
                    style={{ "--i": indice % 4 } as CSSProperties}
                    className={indice === 0 ? "col-span-2 row-span-2" : undefined}
                  >
                    <figure className="group relative aspect-square h-full w-full overflow-hidden rounded-lg">
                      {foto.imagen ? (
                        <Image
                          src={foto.imagen}
                          alt={foto.alt}
                          fill
                          sizes={
                            indice === 0
                              ? "(max-width: 640px) 100vw, 50vw"
                              : "(max-width: 640px) 50vw, 25vw"
                          }
                          className="object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                      ) : null}
                    </figure>
                  </li>
                ))}
              </ul>
            </section>
          ))
        )}
      </div>
    </>
  );
}
