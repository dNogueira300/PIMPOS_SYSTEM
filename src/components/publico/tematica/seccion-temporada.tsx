import type { CSSProperties, ReactNode } from "react";
import { Sparkles } from "lucide-react";

import { PizarraPrecios } from "@/components/publico/pizarra-precios";
import { TarjetaProducto } from "@/components/publico/tarjeta-producto";
import { TituloSeccion } from "@/components/publico/titulo-seccion";
import type { ProductoPublico } from "@/lib/datos/catalogo";
import type { Configuracion } from "@/lib/datos/configuracion";
import { enlaceWhatsApp } from "@/lib/datos/configuracion";
import { repartirPorFoto } from "@/lib/datos/destacados";
import { mensajeDePedido } from "@/lib/datos/pedido";
import type { TematicaPublica } from "@/lib/datos/tematica";

/**
 * El titular con el nombre de la fiesta en la caligrafía de la marca («Lo de
 * esta *Navidad*»), como en la maqueta aprobada. Si el negocio escribió un
 * título que no lo nombra, va entero en la letra de los títulos.
 */
function tituloConAcento(titulo: string, nombre: string): ReactNode {
  const donde = nombre ? titulo.indexOf(nombre) : -1;
  if (donde < 0) return titulo;
  return (
    <>
      {titulo.slice(0, donde)}
      <span className="texto-caligrafico text-acento text-[1.2em] leading-none">{nombre}</span>
      {titulo.slice(donde + nombre.length)}
    </>
  );
}

/**
 * La sección de temporada de la portada (plan 08, T4), antes de «Lo que
 * horneamos hoy». Los productos con foto van en tarjeta, como los destacados,
 * y los demás en la pizarra. Sin productos ni cuenta regresiva no sale.
 */
export function SeccionTemporada({
  tematica,
  productos,
  cuenta,
  config,
}: {
  tematica: TematicaPublica;
  productos: readonly ProductoPublico[];
  cuenta: string | null;
  config: Configuracion;
}) {
  if (productos.length === 0 && !cuenta) return null;
  const { conFoto, sinFoto } = repartirPorFoto(productos);
  const titulo = tematica.titulo ?? tematica.nombre;
  const tarjetas = conFoto.map((producto, indice) => (
    <li key={producto.id} style={{ "--i": indice } as CSSProperties}>
      <TarjetaProducto
        producto={producto}
        whatsapp={enlaceWhatsApp(config, mensajeDePedido(producto))}
      />
    </li>
  ));

  return (
    <section
      aria-labelledby="titulo-temporada"
      data-seccion-temporada
      className="seccion-temporada"
    >
      {/* La sección ocupa todo el ancho para que el borde nevado cruce la
          pantalla, como en la maqueta; el contenido va en el ancho de siempre. */}
      <div className="mx-auto max-w-(--container-contenido) px-4 sm:px-6">
        {cuenta ? (
          <p className="cuenta-regresiva mb-4" data-cuenta-regresiva>
            <Sparkles aria-hidden className="size-4" />
            {cuenta}
          </p>
        ) : null}
        <TituloSeccion
          id="titulo-temporada"
          titulo={tituloConAcento(titulo, tematica.nombre)}
          entradilla={tematica.entradilla ?? undefined}
        />

        {/* El mismo reparto que «Lo que horneamos hoy»: con una o dos tarjetas,
          al lado de la pizarra y no encima, para no dejar una fila medio
          vacía. */}
        {productos.length === 0 ? null : conFoto.length === 0 ? (
          <PizarraPrecios productos={sinFoto} className="mt-8" />
        ) : conFoto.length <= 2 ? (
          <div className="mt-8 grid items-start gap-8 lg:grid-cols-[minmax(0,20rem)_1fr] lg:gap-12">
            <ul className="aparece-grupo grid gap-6 sm:grid-cols-2 lg:grid-cols-1">{tarjetas}</ul>
            {sinFoto.length > 0 ? <PizarraPrecios productos={sinFoto} /> : null}
          </div>
        ) : (
          <>
            <ul className="aparece-grupo mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {tarjetas}
            </ul>
            {sinFoto.length > 0 ? <PizarraPrecios productos={sinFoto} className="mt-10" /> : null}
          </>
        )}
      </div>
    </section>
  );
}
