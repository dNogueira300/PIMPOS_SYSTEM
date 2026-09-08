"use client";

import { useEffect, useRef } from "react";
import type { Map as MapaLeaflet } from "leaflet";

import "leaflet/dist/leaflet.css";

type Props = {
  lat: number;
  lng: number;
  titulo: string;
  direccion: string;
};

/**
 * Mapa del local (R5).
 *
 * Se usa Leaflet directamente, sin react-leaflet, por una razon concreta: este
 * mapa no tiene estado ni interaccion con React mas alla de dibujarse una vez.
 * Envolverlo en componentes solo anadiria otra libreria al paquete de una
 * pagina que ya carga el mayor peso del sitio.
 *
 * `import("leaflet")` es dinamico porque Leaflet toca `window` al cargarse y
 * reventaria en el renderizado del servidor. La pagina que lo usa ademas lo
 * carga con `next/dynamic`, asi que el JS no entra en el paquete inicial: el
 * presupuesto de la portada (doc 03 §4.5) se mantiene.
 *
 * Los mosaicos son de OpenStreetMap, sin llave ni cuenta. Google Maps exigiria
 * tarjeta de credito y una cuota mensual para algo que aqui es un punto fijo.
 */
export function Mapa({ lat, lng, titulo, direccion }: Props) {
  const contenedor = useRef<HTMLDivElement>(null);
  const mapa = useRef<MapaLeaflet | null>(null);

  useEffect(() => {
    let cancelado = false;

    void (async () => {
      const L = await import("leaflet");
      if (cancelado || !contenedor.current || mapa.current) return;

      const instancia = L.map(contenedor.current, {
        center: [lat, lng],
        zoom: 17,
        // El scroll del mouse mueve la pagina, no el mapa: en movil un mapa que
        // captura el gesto deja al visitante atrapado a mitad de la pagina.
        scrollWheelZoom: false,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution:
          '&copy; colaboradores de <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(instancia);

      // El icono por defecto de Leaflet apunta a archivos que el empaquetador
      // no resuelve y sale roto. Un circulo con el azul de la marca se ve mejor
      // y no depende de ninguna imagen.
      const marca = L.divIcon({
        className: "",
        html: '<span style="display:block;width:20px;height:20px;border-radius:9999px;background:#12306e;border:3px solid #fdf9f3;box-shadow:0 2px 6px rgba(35,26,20,.4)"></span>',
        iconSize: [20, 20],
        iconAnchor: [10, 10],
      });

      L.marker([lat, lng], { icon: marca, title: titulo, alt: titulo })
        .addTo(instancia)
        .bindPopup(`<strong>${titulo}</strong><br>${direccion}`);

      mapa.current = instancia;
    })();

    return () => {
      cancelado = true;
      mapa.current?.remove();
      mapa.current = null;
    };
  }, [lat, lng, titulo, direccion]);

  return (
    <div
      ref={contenedor}
      role="application"
      aria-label={`Mapa con la ubicación de ${titulo}`}
      className="h-[60vh] min-h-80 w-full rounded-xl"
    />
  );
}
