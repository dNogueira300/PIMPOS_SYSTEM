"use client";

import type { Map as MapaLeaflet, Marker } from "leaflet";
import { useCallback, useEffect, useRef, useState } from "react";

import "leaflet/dist/leaflet.css";

import { useFormularioPanel } from "./formulario-panel";

type Punto = { lat: number; lng: number };
type Leaflet = typeof import("leaflet");

const IQUITOS: Punto = { lat: -3.7595, lng: -73.2516 };

type Props = {
  inicial: Punto | null;
  /**
   * Clientes (F6, decisión 1): el punto se puede dejar vacío, se marca tocando
   * el mapa o con «Usar mi ubicación», y se puede quitar. Sin esto (la
   * configuración del local) siempre hay un punto, que se arrastra.
   */
  opcional?: boolean;
  instruccion?: string;
};

/**
 * El mismo Leaflet de /ubicacion (sin react-leaflet), con el marcador
 * arrastrable. Solo se carga en las pantallas del panel que lo usan.
 */
export function SelectorUbicacion({
  inicial,
  opcional = false,
  instruccion = "Arrastra el punto azul hasta la puerta del local.",
}: Props) {
  const { registrarRestaurable } = useFormularioPanel();
  const contenedor = useRef<HTMLDivElement>(null);
  const oculto = useRef<HTMLInputElement>(null);
  const leaflet = useRef<Leaflet | null>(null);
  const marcador = useRef<Marker | null>(null);
  const mapa = useRef<MapaLeaflet | null>(null);
  const [punto, setPunto] = useState<Punto | null>(inicial ?? (opcional ? null : IQUITOS));
  const [aviso, setAviso] = useState<string | null>(null);
  const [buscando, setBuscando] = useState(false);
  const nombreMarcador = opcional ? "Casa del cliente" : "Ubicación del local";

  // La copia local del formulario escucha `input`: se avisa cuando cambia el punto.
  const avisarCambio = () =>
    setTimeout(() => oculto.current?.dispatchEvent(new Event("input", { bubbles: true })), 0);

  const ponerMarcador = useCallback(
    (p: Punto) => {
      const L = leaflet.current;
      const instancia = mapa.current;
      if (!L || !instancia) return;
      if (marcador.current) {
        marcador.current.setLatLng([p.lat, p.lng]);
        return;
      }
      const icono = L.divIcon({
        className: "",
        html: '<span class="block size-6 rounded-full border-4 border-white bg-primary shadow"></span>',
        iconSize: [24, 24],
      });
      const m = L.marker([p.lat, p.lng], {
        draggable: true,
        icon: icono,
        keyboard: true,
        title: nombreMarcador,
        alt: nombreMarcador,
      }).addTo(instancia);
      m.getElement()?.setAttribute(
        "aria-label",
        `${nombreMarcador}. Usa las flechas para moverlo.`,
      );
      m.on("dragend", () => {
        const { lat, lng } = m.getLatLng();
        setPunto({ lat, lng });
        avisarCambio();
      });
      marcador.current = m;
    },
    [nombreMarcador],
  );

  const poner = useCallback(
    (p: Punto, acercar = false) => {
      setPunto(p);
      setAviso(null);
      ponerMarcador(p);
      if (acercar) mapa.current?.setView([p.lat, p.lng], 17);
      else mapa.current?.panTo([p.lat, p.lng]);
      avisarCambio();
    },
    [ponerMarcador],
  );

  const quitar = useCallback(() => {
    marcador.current?.remove();
    marcador.current = null;
    setPunto(null);
    avisarCambio();
  }, []);

  useEffect(() => {
    let cancelado = false;
    void (async () => {
      const L = await import("leaflet");
      if (cancelado || !contenedor.current || mapa.current) return;
      leaflet.current = L;
      const centro = punto ?? IQUITOS;
      const instancia = L.map(contenedor.current, {
        center: [centro.lat, centro.lng],
        zoom: punto ? 17 : 14,
        scrollWheelZoom: false,
      });
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution:
          '&copy; colaboradores de <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(instancia);
      mapa.current = instancia;
      if (punto) ponerMarcador(punto);
      if (opcional) {
        instancia.on("click", (e) => poner({ lat: e.latlng.lat, lng: e.latlng.lng }));
      }
    })();
    return () => {
      cancelado = true;
      mapa.current?.remove();
      mapa.current = null;
      marcador.current = null;
    };
    // El mapa se crea una vez; los cambios de `punto` los mueve el marcador.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(
    () =>
      registrarRestaurable("coordenadas", (valor) => {
        if (valor === "") {
          if (opcional) quitar();
          return;
        }
        try {
          poner(JSON.parse(valor) as Punto);
        } catch {
          // Copia rota: se ignora.
        }
      }),
    [registrarRestaurable, opcional, poner, quitar],
  );

  const usarMiUbicacion = () => {
    if (!("geolocation" in navigator)) {
      setAviso("Este teléfono no da la ubicación. Toca el mapa en la casa del cliente.");
      return;
    }
    setBuscando(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setBuscando(false);
        poner({ lat: pos.coords.latitude, lng: pos.coords.longitude }, true);
      },
      () => {
        setBuscando(false);
        setAviso("No se pudo leer tu ubicación. Toca el mapa en la casa del cliente.");
      },
      { enableHighAccuracy: true, timeout: 15_000 },
    );
  };

  return (
    <div className="flex flex-col gap-2">
      <input
        ref={oculto}
        type="hidden"
        name="coordenadas"
        value={punto ? JSON.stringify(punto) : ""}
      />
      <p className="text-sm">{instruccion}</p>
      {opcional ? (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="boton-linea"
            onClick={usarMiUbicacion}
            disabled={buscando}
          >
            {buscando ? "Buscando…" : "Usar mi ubicación"}
          </button>
          {punto ? (
            <button type="button" className="boton-linea" onClick={quitar}>
              Quitar el punto
            </button>
          ) : null}
        </div>
      ) : null}
      {aviso ? (
        <p role="status" className="text-destructive text-sm">
          {aviso}
        </p>
      ) : null}
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
      <p className="text-muted-foreground text-sm" data-punto>
        {punto ? `${punto.lat.toFixed(6)}, ${punto.lng.toFixed(6)}` : "Sin punto en el mapa."}
      </p>
    </div>
  );
}
