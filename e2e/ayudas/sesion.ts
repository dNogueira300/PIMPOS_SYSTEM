import type { Page } from "@playwright/test";

import { crearUsuario, type UsuarioDePrueba } from "./usuarios";

type Rol = "superadmin" | "administrador" | "ingeniero" | "repartidor";

/**
 * Crea un usuario del rol y entra con él. Quien llama tiene que borrarlo al
 * terminar (`borrarUsuario(usuario.id)` en un `finally`).
 */
export async function entrarComo(page: Page, rol: Rol): Promise<UsuarioDePrueba> {
  const usuario = await crearUsuario(rol);
  await page.goto("/ingresar");
  await page.getByLabel("Correo").fill(usuario.correo);
  await page.getByLabel("Contraseña").fill(usuario.clave);
  await page.getByRole("button", { name: "Entrar" }).click();
  await page.waitForURL("/admin");
  // La URL cambia antes de que llegue el contenido: React 19 mantiene la
  // pantalla de /ingresar montada mientras el <Suspense> del layout del panel
  // resuelve la sesion, asi que un `<h1>` generico encontraria el de
  // "Panadería Pimpo's" que ya estaba ahi. `main#contenido` es el <main> de
  // CascaraPanel, y solo existe una vez que esa resolucion termino.
  await page.locator("main#contenido").waitFor();
  return usuario;
}
