/**
 * La URL pública del sitio, para todo lo que un buscador o una red social lee
 * fuera de la página: el `sitemap`, el `robots.txt`, la URL canónica, la imagen
 * que sale al compartir un enlace por WhatsApp y los datos estructurados.
 *
 * Todos esos campos exigen una URL absoluta. Si saliera mal, el daño no se ve
 * en la pantalla de nadie: el sitemap le diría a Google que el catálogo está en
 * `localhost`, y el enlace compartido saldría sin foto.
 *
 * El orden importa:
 *
 * 1. `NEXT_PUBLIC_SITE_URL`, la que se fija a mano. Es la que manda cuando
 *    llegue el dominio `panaderiapimpos.com`.
 * 2. `VERCEL_PROJECT_PRODUCTION_URL`, que Vercel pone sola. Cubre el caso de
 *    desplegar antes de tener dominio sin publicar URLs de `localhost`.
 * 3. `http://localhost:3000`, para el desarrollo y el CI.
 */
const RESERVA_LOCAL = "http://localhost:3000";

/**
 * Solo las dos variables que se leen, no `NodeJS.ProcessEnv` entero: Next le
 * añade `NODE_ENV` como obligatoria, y eso obligaba a las pruebas a inventarse
 * un entorno completo para comprobar dos claves.
 */
type Entorno = Readonly<Record<string, string | undefined>>;

export function urlDelSitio(entorno: Entorno = process.env): string {
  const fijada = entorno.NEXT_PUBLIC_SITE_URL?.trim();
  if (fijada) return sinBarraFinal(fijada);

  const deVercel = entorno.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  if (deVercel) return `https://${sinBarraFinal(deVercel)}`;

  return RESERVA_LOCAL;
}

/** `/productos` a `https://panaderiapimpos.com/productos`. */
export function urlAbsoluta(ruta: string, entorno: Entorno = process.env): string {
  if (ruta.startsWith("http://") || ruta.startsWith("https://")) return ruta;
  const base = urlDelSitio(entorno);
  return `${base}${ruta.startsWith("/") ? ruta : `/${ruta}`}`;
}

// Una barra final duplicaría la del camino: `https://sitio.com//productos` es
// otra URL para un buscador, y partiría la página en dos entradas del índice.
function sinBarraFinal(url: string): string {
  return url.replace(/\/+$/, "");
}
