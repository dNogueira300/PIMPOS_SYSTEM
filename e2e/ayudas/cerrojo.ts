import { mkdirSync, rmSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

/**
 * Exclusión mutua entre procesos de Playwright (los dos proyectos y las
 * repeticiones corren en workers distintos). `mkdir` es atómico: quien lo crea
 * tiene el cerrojo. Un cerrojo de más de `caducaMs` es de una prueba que murió
 * sin soltarlo, y se rompe.
 *
 * Solo para lo que la aplicación hace sobre una tabla ENTERA y por tanto no se
 * puede aislar con datos propios (ver la prueba de orden de las preguntas).
 */
export async function conCerrojo<T>(
  nombre: string,
  hacer: () => Promise<T>,
  { caducaMs = 60_000 } = {},
): Promise<T> {
  const ruta = join(tmpdir(), `pimpos-e2e-cerrojo-${nombre}`);
  for (;;) {
    try {
      mkdirSync(ruta);
      break;
    } catch {
      try {
        if (Date.now() - statSync(ruta).mtimeMs > caducaMs) rmSync(ruta, { recursive: true });
      } catch {
        // Lo soltó otro entre medias: se vuelve a intentar.
      }
      await new Promise((listo) => setTimeout(listo, 200));
    }
  }
  try {
    return await hacer();
  } finally {
    rmSync(ruta, { recursive: true, force: true });
  }
}
