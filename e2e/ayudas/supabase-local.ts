import { execFileSync } from "node:child_process";

/**
 * Datos de conexion del Supabase LOCAL, leidos de `supabase status`.
 *
 * Las pruebas nunca toman estos valores de `.env.local`, y es a proposito:
 * crean y borran usuarios. Si el `.env.local` de alguien apuntara al proyecto
 * alojado, la suite daria de alta usuarios de prueba en produccion. Leerlos de
 * aqui elimina esa posibilidad, y de paso hace que funcionen en el CI, donde
 * `.env.local` no existe porque no se versiona.
 *
 * Las llaves del entorno local son fijas y publicas (el entorno de demo del
 * CLI), asi que esto no filtra nada.
 */
export type SupabaseLocal = {
  apiUrl: string;
  anonKey: string;
  serviceRoleKey: string;
};

const VARIABLES = {
  apiUrl: "PIMPOS_E2E_API_URL",
  anonKey: "PIMPOS_E2E_ANON_KEY",
  serviceRoleKey: "PIMPOS_E2E_SERVICE_ROLE_KEY",
} as const;

let cache: SupabaseLocal | null = null;

function preguntarAlCli(): string {
  // Playwright carga esta configuracion en cada worker, asi que varios procesos
  // pueden preguntarle al CLI a la vez y alguno choca hablando con Docker.
  // Tres intentos con una pausa corta cubren esa contienda; el error se guarda
  // para poder explicarlo si aun asi falla.
  let ultimo: unknown;

  for (let intento = 1; intento <= 3; intento++) {
    try {
      return execFileSync("supabase", ["status", "-o", "env"], {
        encoding: "utf8",
        shell: process.platform === "win32",
      });
    } catch (error) {
      ultimo = error;
      if (intento < 3) {
        // Espera sincrona: esto corre al cargar la configuracion, antes de que
        // exista bucle de eventos util donde esperar de otra forma.
        Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 500 * intento);
      }
    }
  }

  const detalle = ultimo instanceof Error ? ultimo.message : String(ultimo);
  throw new Error(
    "No se pudo leer `supabase status` tras 3 intentos. Las pruebas de punta a punta " +
      "necesitan el entorno local: ejecuta `supabase start` antes de `pnpm test:e2e`.\n" +
      `Causa: ${detalle}`,
  );
}

export function supabaseLocal(): SupabaseLocal {
  if (cache) return cache;

  // Si la configuracion ya resolvio los valores, los workers los heredan por
  // el entorno y no vuelven a invocar al CLI.
  const deEntorno = {
    apiUrl: process.env[VARIABLES.apiUrl],
    anonKey: process.env[VARIABLES.anonKey],
    serviceRoleKey: process.env[VARIABLES.serviceRoleKey],
  };
  if (deEntorno.apiUrl && deEntorno.anonKey && deEntorno.serviceRoleKey) {
    cache = deEntorno as SupabaseLocal;
    return cache;
  }

  const salida = preguntarAlCli();

  const leer = (clave: string): string => {
    const encontrado = new RegExp(String.raw`^${clave}="?([^"\n]+)"?$`, "m").exec(salida);
    if (!encontrado) {
      throw new Error(
        `No se encontro ${clave} en la salida de \`supabase status\`. ` +
          `¿Termino de arrancar \`supabase start\`?`,
      );
    }
    return encontrado[1];
  };

  cache = {
    apiUrl: leer("API_URL"),
    anonKey: leer("ANON_KEY"),
    serviceRoleKey: leer("SERVICE_ROLE_KEY"),
  };

  // Se publican para que los workers que arranquen despues los hereden.
  process.env[VARIABLES.apiUrl] = cache.apiUrl;
  process.env[VARIABLES.anonKey] = cache.anonKey;
  process.env[VARIABLES.serviceRoleKey] = cache.serviceRoleKey;

  return cache;
}
