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
              <h2 className="font-heading text-primary text-2xl font-semibold sm:text-3xl">
                {NOMBRE_CATEGORIA[categoria] ?? categoria}
              </h2>

              {/* El mosaico del prototipo: la primera foto de cada grupo ocupa
                  el doble. Una cuadricula perfecta de diez fotos iguales se lee
                  como catalogo de stock, no como el album de un negocio.

                  Solo con tres o mas. Con dos, la grande ocupaba dos columnas y
                  dos filas y la otra se quedaba arriba a su lado: debajo, un
                  hueco del tamano de una foto. Dos van a la par. */}
              <ul
                className={`aparece-grupo mt-6 grid gap-3 sm:gap-4 ${
                  delGrupo.length >= 3 ? "grid-cols-2 md:grid-cols-3" : "grid-cols-2"
                }`}
              >
                {delGrupo.map((foto, indice) => {
                  const grande = delGrupo.length >= 3 && indice === 0;
                  return (
                    <li
                      key={foto.id}
                      style={{ "--i": indice % 3 } as CSSProperties}
                      className={grande ? "col-span-2 md:row-span-2" : undefined}
                    >
                      <figure
                        className={`tarjeta--elevable group bg-muted relative h-full overflow-hidden rounded-2xl ${
                          grande ? "aspect-[4/3] md:aspect-auto" : "aspect-[4/3]"
                        }`}
                      >
                        {foto.imagen ? (
                          <Image
                            src={foto.imagen}
                            alt={foto.alt}
                            fill
                            sizes={
                              grande
                                ? "(max-width: 768px) 100vw, 66vw"
                                : "(max-width: 640px) 50vw, 33vw"
                            }
                            className="object-cover transition-transform duration-700 group-hover:scale-105"
                          />
                        ) : null}

                        {/* El titulo que tiene la foto en la base, no los pies
                            del prototipo («4:15 AM · El primer encendido»),
                            que eran inventados. El texto va siempre dentro del
                            degradado (`pt-10`): su peor caso de contraste, en
                            paleta.test.ts. */}
                        {foto.titulo ? (
                          <figcaption className="from-pie-foto/80 text-pie-foto-foreground absolute inset-x-0 bottom-0 bg-linear-to-t to-transparent px-3 pt-10 pb-2.5 text-sm font-semibold text-pretty sm:px-4 sm:pb-3">
                            {foto.titulo}
                          </figcaption>
                        ) : null}
                      </figure>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))
        )}
      </div>
    </>
  );
}
