"use client";

import { useEffect } from "react";

import { cerrarSesionPorInactividad } from "@/lib/acciones/autenticacion";
import { COOKIE_ACTIVIDAD, sesionInactiva } from "@/lib/auth/inactividad";

/** Cada cuánto, como mucho, se reescribe la marca mientras alguien usa la página. */
const CADA_MS = 60 * 1000;
const EVENTOS = ["pointerdown", "keydown", "wheel", "touchstart", "scroll"] as const;

function leerMarca(): string | undefined {
  return document.cookie
    .split("; ")
    .find((c) => c.startsWith(`${COOKIE_ACTIVIDAD}=`))
    ?.slice(COOKIE_ACTIVIDAD.length + 1);
}

function escribirMarca(): void {
  const segura = location.protocol === "https:" ? "; secure" : "";
  document.cookie = `${COOKIE_ACTIVIDAD}=${Date.now()}; path=/; max-age=${30 * 24 * 60 * 60}; samesite=lax${segura}`;
}

/**
 * La otra mitad del cierre por inactividad (la primera está en el proxy).
 *
 * - Escribir, tocar o desplazarse cuenta como actividad aunque no haya
 *   ninguna petición al servidor: quien llena un formulario largo sin guardar
 *   no está inactivo. Se renueva la marca como mucho una vez por minuto.
 * - Con la pestaña abierta y quieta dos horas, cierra la sesión sin esperar a
 *   que alguien pulse algo: se mira cada minuto y al volver a la pestaña.
 *
 * No pinta nada.
 */
export function VigiaInactividad() {
  useEffect(() => {
    let cerrando = false;

    function alUsar() {
      const marca = Number(leerMarca());
      if (!Number.isFinite(marca) || Date.now() - marca > CADA_MS) escribirMarca();
    }

    function revisar() {
      if (cerrando || document.visibilityState === "hidden") return;
      if (sesionInactiva(leerMarca(), Date.now())) {
        cerrando = true;
        void cerrarSesionPorInactividad();
      }
    }

    for (const e of EVENTOS) window.addEventListener(e, alUsar, { passive: true });
    document.addEventListener("visibilitychange", revisar);
    const intervalo = setInterval(revisar, CADA_MS);
    return () => {
      for (const e of EVENTOS) window.removeEventListener(e, alUsar);
      document.removeEventListener("visibilitychange", revisar);
      clearInterval(intervalo);
    };
  }, []);

  return null;
}
