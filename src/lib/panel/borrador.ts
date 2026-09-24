/**
 * Copia local de un formulario (decisión 2 del plan 04).
 *
 * Mientras se escribe, lo escrito se guarda en el navegador. Si la señal se
 * corta o se cierra la pestaña, al volver se ofrece recuperarlo. Es texto y
 * nada más: una foto a medio subir no se puede guardar aquí y se vuelve a
 * elegir.
 *
 * Todo recibe el almacén y la hora como argumentos para poder probarlo sin
 * navegador; el componente le pasa `localStorage` y `Date.now()`.
 */
export type ValoresBorrador = Record<string, string>;
export type Borrador = { valores: ValoresBorrador; guardadoEn: number };
type Almacen = Pick<Storage, "getItem" | "setItem" | "removeItem">;

export const CADUCIDAD_MS = 7 * 24 * 60 * 60 * 1000;

const PREFIJO = "pimpos:borrador:";

export function claveDeBorrador(formulario: string, id: string | null): string {
  return `${PREFIJO}${formulario}:${id ?? "nuevo"}`;
}

export function valoresDe(fd: FormData): ValoresBorrador {
  const valores: ValoresBorrador = {};
  for (const [nombre, valor] of fd.entries()) {
    if (typeof valor === "string") valores[nombre] = valor;
  }
  return valores;
}

export function guardarBorrador(
  almacen: Almacen,
  clave: string,
  valores: ValoresBorrador,
  ahora: number,
): void {
  try {
    almacen.setItem(clave, JSON.stringify({ valores, guardadoEn: ahora } satisfies Borrador));
  } catch {
    // Modo privado o almacén lleno: se pierde la red de seguridad, no el
    // formulario. No hay nada útil que enseñar.
  }
}

function esBorrador(valor: unknown): valor is Borrador {
  if (typeof valor !== "object" || valor === null) return false;
  const { valores, guardadoEn } = valor as Record<string, unknown>;
  return (
    typeof guardadoEn === "number" &&
    typeof valores === "object" &&
    valores !== null &&
    Object.values(valores).every((v) => typeof v === "string")
  );
}

export function leerBorrador(almacen: Almacen, clave: string, ahora: number): Borrador | null {
  let crudo: string | null;
  try {
    crudo = almacen.getItem(clave);
  } catch {
    return null;
  }
  if (!crudo) return null;

  let valor: unknown;
  try {
    valor = JSON.parse(crudo);
  } catch {
    return null;
  }
  if (!esBorrador(valor)) return null;

  if (ahora - valor.guardadoEn > CADUCIDAD_MS) {
    borrarBorrador(almacen, clave);
    return null;
  }
  return valor;
}

export function borrarBorrador(almacen: Almacen, clave: string): void {
  try {
    almacen.removeItem(clave);
  } catch {
    // Igual que al guardar.
  }
}

/**
 * Todas las copias de este navegador, de todos los formularios. Se llama al
 * cerrar sesión y al llegar a /ingresar: en un celular compartido, quien entra
 * después no debe ver lo que escribió el anterior (en el alta de un usuario,
 * datos personales; Ley N.° 29733).
 */
export function borrarTodosLosBorradores(
  almacen: Pick<Storage, "length" | "key" | "removeItem">,
): void {
  try {
    // Primero se juntan las claves: borrar mientras se recorre corre los índices.
    const claves: string[] = [];
    for (let i = 0; i < almacen.length; i++) {
      const clave = almacen.key(i);
      if (clave?.startsWith(PREFIJO)) claves.push(clave);
    }
    for (const clave of claves) almacen.removeItem(clave);
  } catch {
    // Almacén bloqueado: no hay copias que borrar, y el cierre de sesión sigue.
  }
}

/** `borrarTodosLosBorradores` sobre el `localStorage` de este navegador. */
export function olvidarBorradoresDelNavegador(): void {
  try {
    borrarTodosLosBorradores(window.localStorage);
  } catch {
    // Acceder a `localStorage` también puede lanzar (almacenamiento bloqueado).
  }
}

export function haceCuanto(desde: number, ahora: number): string {
  const minutos = Math.floor((ahora - desde) / 60_000);
  if (minutos < 1) return "hace un momento";
  if (minutos < 60) return `hace ${minutos} ${minutos === 1 ? "minuto" : "minutos"}`;
  const horas = Math.floor(minutos / 60);
  if (horas < 24) return `hace ${horas} ${horas === 1 ? "hora" : "horas"}`;
  const dias = Math.floor(horas / 24);
  return `hace ${dias} ${dias === 1 ? "día" : "días"}`;
}
