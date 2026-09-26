/**
 * La ruta de Existencias, compartida por las acciones y las pantallas de
 * insumos.
 *
 * Vive fuera de `src/lib/acciones/insumos.ts` porque ese archivo lleva
 * `"use server"`, y Next 16 solo permite exportar funciones async desde un
 * archivo con esa directiva — un `export const` ahí rompe el build
 * («Only async functions are allowed to be exported in a "use server"
 * file»). Ver AGENTS.md: antes de escribir código de app, revisar
 * `node_modules/next/dist/docs/`.
 */
export const RUTA_INSUMOS = "/admin/insumos";
