"use client";

import { useEffect } from "react";

import { COOKIE_ACTIVIDAD, DURACION_MARCA_S, sesionInactiva } from "@/lib/auth/inactividad";

/** Cada cuánto, como mucho, se reescribe la marca mientras alguien usa la página. */
const CADA_MS = 60 * 1000;
const EVENTOS = ["pointerdown", "keydown", "wheel", "touchstart", "scroll"] as const;

function leerMarca(): string | undefined {
  return document.cookie
    .split("; ")
    .find((c) => c.startsWith(`${COOKIE_ACTIVIDAD}=`))
    ?.slice(COOKIE_ACTIVIDAD.length + 1);
}

/**
 * La otra mitad del cierre por inactividad (la primera está en el proxy).
 *
 * - Escribir, tocar o desplazarse cuenta como actividad aunque no haya
 *   ninguna petición al servidor: quien llena un formulario largo sin guardar
 *   no está inactivo. Se renueva la marca como mucho una vez por minuto.
 * - Con la pestaña quieta dos horas, o si la sesión se cerró en otra pestaña
 *   (la marca desaparece), lleva al ingreso. No cierra la sesión aquí: navega
 *   a `/ingresar`, y es el proxy, con su reloj, quien la cierra.
 *
 * Todo en HORA DEL SERVIDOR: la marca la escribió el proxy al servir esta
 * página, así que la diferencia con el reloj de esta computadora es su
 * desfase. Una PC con la hora mal puesta no cierra la sesión antes de tiempo
 * ni la alarga.
 *
 * No pinta nada.
 */
export function VigiaInactividad() {
  useEffect(() => {
    const inicial = Number(leerMarca());
    const desfase = Number.isFinite(inicial) ? inicial - Date.now() : 0;
    const ahora = () => Date.now() + desfase;
    let saliendo = false;

    function salir(destino: string) {
      if (saliendo) return;
      saliendo = true;
      window.location.replace(destino);
    }

    function alUsar() {
      const marca = leerMarca();
      if (marca === undefined) return; // la sesión ya se cerró: `revisar` lo resuelve
      if (ahora() - Number(marca) < CADA_MS) return;
      const segura = location.protocol === "https:" ? "; secure" : "";
      document.cookie = `${COOKIE_ACTIVIDAD}=${ahora()}; path=/; max-age=${DURACION_MARCA_S}; samesite=lax${segura}`;
    }

    function revisar() {
      if (document.visibilityState === "hidden") return;
      const marca = leerMarca();
      if (marca === undefined) salir("/ingresar");
      else if (sesionInactiva(marca, ahora())) salir("/ingresar?motivo=inactividad");
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
