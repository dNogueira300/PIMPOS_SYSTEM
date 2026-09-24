"use client";

import type { Map as MapaLeaflet, Marker } from "leaflet";
import { useEffect, useRef, useState } from "react";

import "leaflet/dist/leaflet.css";

import { useFormularioPanel } from "./formulario-panel";

type Punto = { lat: number; lng: number };

/**
 * El mismo Leaflet de /ubicacion (sin react-leaflet), con el marcador
 * arrastrable. Solo se carga en esta pantalla del panel.
 */
export function SelectorUbicacion({ inicial }: { inicial: Punto | null }) {
  const { registrarRestaurable } = useFormularioPanel();
  const contenedor = useRef<HTMLDivElement>(null);
  const oculto = useRef<HTMLInputElement>(null);
  const marcador = useRef<Marker | null>(null);
  const mapa = useRef<MapaLeaflet | null>(null);
  const [punto, setPunto] = useState<Punto>(inicial ?? { lat: -3.7595, lng: -73.2516 });

  useEffect(() => {
    let cancelado = false;
    void (async () => {
      const L = await import("leaflet");
      if (cancelado || !contenedor.current || mapa.current) return;
      const instancia = L.map(contenedor.current, {
        center: [punto.lat, punto.lng],
        zoom: 17,
        scrollWheelZoom: false,
      });
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
      const m = L.marker([punto.lat, punto.lng], {
        draggable: true,
        icon: icono,
        keyboard: true,
        title: "Ubicación del local",
        alt: "Ubicación del local",
      }).addTo(instancia);
      m.getElement()?.setAttribute(
        "aria-label",
        "Ubicación del local. Usa las flechas para moverlo.",
      );
      m.on("dragend", () => {
        const { lat, lng } = m.getLatLng();
        setPunto({ lat, lng });
        setTimeout(() => oculto.current?.dispatchEvent(new Event("input", { bubbles: true })), 0);
      });
      mapa.current = instancia;
      marcador.current = m;
    })();
    return () => {
      cancelado = true;
      mapa.current?.remove();
      mapa.current = null;
    };
    // El mapa se crea una vez; los cambios de `punto` los mueve el marcador.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(
    () =>
      registrarRestaurable("coordenadas", (valor) => {
        try {
          const p = JSON.parse(valor) as Punto;
          setPunto(p);
          marcador.current?.setLatLng([p.lat, p.lng]);
          mapa.current?.panTo([p.lat, p.lng]);
        } catch {
          // Copia rota: se ignora.
        }
      }),
    [registrarRestaurable],
  );

  return (
    <div className="flex flex-col gap-2">
      <input ref={oculto} type="hidden" name="coordenadas" value={JSON.stringify(punto)} />
      <p className="text-sm">Arrastra el punto azul hasta la puerta del local.</p>
      {/*
        `isolate`: Leaflet reparte z-index de 400 a 1000 entre sus paneles y
        controles (mismo motivo que src/components/publico/mapa.tsx). Sin un
        contexto de apilamiento propio, el mapa se pintaría encima de la barra
        inferior fija del panel en el celular.
      */}
      <div
        ref={contenedor}
        className="isolate h-72 w-full overflow-hidden rounded-xl border"
        data-selector-ubicacion
      />
      <p className="text-muted-foreground text-sm">
        {punto.lat.toFixed(6)}, {punto.lng.toFixed(6)}
      </p>
    </div>
  );
}
