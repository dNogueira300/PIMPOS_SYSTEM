import { randomUUID } from "node:crypto";
import {
  mkdirSync,
  readFileSync,
  renameSync,
  rmSync,
  statSync,
  utimesSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { test } from "@playwright/test";

/** Cada cuánto el dueño renueva la fecha de su cerrojo mientras lo tiene. */
const LATIDO_MS = 2_000;
/** Un cerrojo sin latido durante este tiempo es de un proceso que murió. */
const CADUCA_MS = 15_000;
const SONDEO_MS = 200;
/** Nombre en ASCII: el archivo vive en el tmp de Windows y de Linux. */
const ARCHIVO_DUEÑO = "dueno";

function leerDueño(ruta: string): string | null {
  try {
    return readFileSync(join(ruta, ARCHIVO_DUEÑO), "utf8");
  } catch {
    return null;
  }
}

/** Fecha del último latido; la de la carpeta si el dueño aún no escribió. */
function ultimoLatido(ruta: string): number {
  try {
    return statSync(join(ruta, ARCHIVO_DUEÑO)).mtimeMs;
  } catch {
    return statSync(ruta).mtimeMs;
  }
}

/**
 * Rompe un cerrojo abandonado SOLO si sigue siendo el que se vio caducado.
 * Se aparta con `rename` (atómico) y se mira de quién era lo apartado: si
 * entre medias otro lo rompió y volvió a tomarlo, lo apartado es suyo y se
 * devuelve a su sitio en vez de borrarlo.
 */
function romperSiSigueCaducado(ruta: string, dueñoVisto: string | null) {
  const apartado = `${ruta}.roto-${randomUUID()}`;
  try {
    renameSync(ruta, apartado);
  } catch {
    return; // Ya no estaba: lo soltó o lo rompió otro.
  }
  const dueñoApartado = leerDueño(apartado);
  if (dueñoApartado === dueñoVisto && Date.now() - ultimoLatido(apartado) > CADUCA_MS) {
    rmSync(apartado, { recursive: true, force: true });
    return;
  }
  try {
    renameSync(apartado, ruta);
  } catch {
    // Alguien lo tomó en ese instante: el devuelto pierde el cerrojo, y su
    // latido lo detecta y se lo avisa al soltar (ver `conCerrojo`).
    rmSync(apartado, { recursive: true, force: true });
  }
}

/**
 * Exclusión mutua entre procesos de Playwright (los dos proyectos y las
 * repeticiones corren en workers distintos). `mkdir` es atómico: quien lo crea
 * tiene el cerrojo, y deja dentro un archivo `dueno` con un id suyo.
 *
 * Caducidad por latido, no por reloj de la prueba: mientras `hacer()` corre,
 * el dueño renueva la fecha de `dueno` cada `LATIDO_MS`. Así solo parece
 * abandonado (sin latido más de `CADUCA_MS`) el cerrojo de un proceso que
 * murió, dure lo que dure la prueba viva —con `test.slow()` o sin él— y sin
 * atar la cifra al `timeout` de `playwright.config.ts`.
 *
 * Soltar borra el cerrojo solo si `dueno` sigue siendo el nuestro: si otro
 * lo rompió, nuestro `finally` no le quita el suyo.
 *
 * Solo para lo que la aplicación hace sobre una tabla ENTERA y por tanto no se
 * puede aislar con datos propios (ver la prueba de orden de las preguntas).
 */
export async function conCerrojo<T>(
  nombre: string,
  hacer: () => Promise<T>,
  { esperaMaxMs }: { esperaMaxMs?: number } = {},
): Promise<T> {
  const ruta = join(tmpdir(), `pimpos-e2e-cerrojo-${nombre}`);
  const yo = `${process.pid}-${randomUUID()}`;
  // Sin cota propia, la espera acaba cuando se agota el tiempo de la prueba,
  // con un mensaje que no dice por qué. Se corta 5 s antes, diciéndolo.
  const tiempoPrueba = test.info().timeout;
  const limite =
    esperaMaxMs ?? (tiempoPrueba > 0 ? Math.max(1_000, tiempoPrueba - 5_000) : 120_000);
  const inicio = Date.now();

  for (;;) {
    try {
      mkdirSync(ruta);
      writeFileSync(join(ruta, ARCHIVO_DUEÑO), yo);
      break;
    } catch (error) {
      // En Windows, crear una carpeta que otro está borrando da EPERM/EACCES.
      const codigo = (error as NodeJS.ErrnoException).code;
      if (codigo !== "EEXIST" && codigo !== "EPERM" && codigo !== "EACCES") throw error;
      try {
        const dueñoVisto = leerDueño(ruta);
        if (Date.now() - ultimoLatido(ruta) > CADUCA_MS) romperSiSigueCaducado(ruta, dueñoVisto);
      } catch {
        // Lo soltó otro entre medias: se vuelve a intentar.
      }
      const esperado = Date.now() - inicio;
      if (esperado > limite) {
        throw new Error(
          `No se pudo tomar el cerrojo «${nombre}» (${ruta}): otra prueba lo tuvo ocupado ` +
            `${Math.round(esperado / 1000)} s seguidos y renovándolo, así que sigue viva. ` +
            `Límite de espera: ${Math.round(limite / 1000)} s.`,
        );
      }
      await new Promise((listo) => setTimeout(listo, SONDEO_MS));
    }
  }

  let perdido = false;
  const latido = setInterval(() => {
    if (leerDueño(ruta) !== yo) {
      perdido = true;
      return;
    }
    const ahora = new Date();
    try {
      utimesSync(join(ruta, ARCHIVO_DUEÑO), ahora, ahora);
    } catch {
      perdido = true;
    }
  }, LATIDO_MS);

  try {
    return await hacer();
  } finally {
    clearInterval(latido);
    if (leerDueño(ruta) === yo) rmSync(ruta, { recursive: true, force: true });
    else perdido = true;
    if (perdido) {
      // No se lanza: taparía el resultado de `hacer()`. Queda en el registro.
      console.warn(
        `[cerrojo] «${nombre}»: otro proceso rompió el cerrojo mientras esta prueba lo tenía; ` +
          "el tramo pudo correr a la vez que otro.",
      );
    }
  }
}
