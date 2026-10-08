"use client";

import type { Map as MapaLeaflet } from "leaflet";
import { useEffect, useRef } from "react";

import "leaflet/dist/leaflet.css";

import { escaparHtml } from "@/lib/utilidades/html";

type Punto = { id: string; nombre: string; latitud: number; longitud: number };

/**
 * Los clientes con punto, cada uno con su marcador; al tocarlo, el nombre y
 * «Ver ficha». El mismo Leaflet sin react-leaflet del sitio público y de
 * `selector-ubicacion.tsx`, con `isolate` para no pintarse encima de la barra
 * inferior del panel.
 */
export function MapaClientes({ clientes }: { clientes: Punto[] }) {
  const contenedor = useRef<HTMLDivElement>(null);
  const mapa = useRef<MapaLeaflet | null>(null);

  useEffect(() => {
    let cancelado = false;
    void (async () => {
      const L = await import("leaflet");
      if (cancelado || !contenedor.current || mapa.current || clientes.length === 0) return;
      const instancia = L.map(contenedor.current, { scrollWheelZoom: false });
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution:
          '&copy; colaboradores de <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(instancia);
      const icono = L.divIcon({
        className: "",
        html: '<span class="block size-6 rounded-full border-4 border-white bg-primary shadow"></span>',
        iconSize: [24, 24],
      });
      for (const c of clientes) {
        L.marker([c.latitud, c.longitud], {
          icon: icono,
          keyboard: true,
          title: c.nombre,
          alt: c.nombre,
        })
          .bindPopup(
            `<strong>${escaparHtml(c.nombre)}</strong><br><a href="/admin/clientes/${c.id}">Ver ficha</a>`,
          )
          .addTo(instancia);
      }
      instancia.fitBounds(
        L.latLngBounds(clientes.map((c) => [c.latitud, c.longitud] as [number, number])),
        { padding: [32, 32], maxZoom: 17 },
      );
      mapa.current = instancia;
    })();
    return () => {
      cancelado = true;
      mapa.current?.remove();
      mapa.current = null;
    };
  }, [clientes]);

  return (
    <div
      ref={contenedor}
      className="isolate h-[60vh] min-h-72 w-full overflow-hidden rounded-md border"
      data-mapa-clientes
      role="region"
      aria-label="Mapa de clientes"
    />
  );
}
