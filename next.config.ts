import type { NextConfig } from "next";

/**
 * Host de Supabase, para autorizar sus imagenes en `next/image`.
 *
 * Se deriva de la variable en vez de escribirse a mano: la misma configuracion
 * vale para el Docker local (127.0.0.1:54321) y para el proyecto alojado, y no
 * hay una lista de dominios que se quede vieja al cambiar de proyecto.
 */
function hostDeSupabase(): URL | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) return null;
  try {
    return new URL(url);
  } catch {
    return null;
  }
}

const supabase = hostDeSupabase();

/** Si el proyecto de Supabase corre en esta maquina (Docker de desarrollo). */
function esLocal(url: URL | null): boolean {
  if (!url) return false;
  return ["127.0.0.1", "localhost", "::1", "0.0.0.0"].includes(url.hostname);
}

const nextConfig: NextConfig = {
  /**
   * Cache Components (Next 16). Es lo que hace posible el modelo que pide el
   * plan: el sitio publico se prerenderiza y el panel invalida por etiqueta con
   * `revalidateTag` cuando publica algo (R21, R7).
   *
   * Trae ademas Partial Prerendering por defecto: la pagina sale como HTML
   * estatico y lo que de verdad depende de la peticion llega despues, en
   * streaming. Con eso el objetivo de LCP < 2.5 s en 4G (doc 03 §4.5) deja de
   * depender de la latencia de la base.
   *
   * A cambio, todo lo que lea `cookies()`, `headers()` o `searchParams` tiene
   * que ir dentro de un `<Suspense>`. Es la razon de que las paginas del panel
   * separen su parte autenticada en un componente aparte.
   */
  cacheComponents: true,

  images: {
    // AVIF primero: pesa menos que WebP y el movil es prioritario (R6).
    formats: ["image/avif", "image/webp"],

    /**
     * Next 16 bloquea optimizar imagenes alojadas en una IP privada, y hace
     * bien: es una defensa contra SSRF. Pero el Supabase de desarrollo vive en
     * 127.0.0.1, asi que en un build local las fotos del catalogo y de la
     * galeria no se ven -- solo salia el aviso en el registro del servidor.
     *
     * Se levanta la restriccion SOLO cuando el destino es local. En produccion
     * el host es publico, la condicion no se cumple y la proteccion sigue en
     * pie: no hay forma de que este `true` viaje al despliegue por descuido.
     */
    dangerouslyAllowLocalIP: esLocal(supabase),
    remotePatterns: supabase
      ? [
          {
            protocol: supabase.protocol.replace(":", "") as "http" | "https",
            hostname: supabase.hostname,
            port: supabase.port || undefined,
            pathname: "/storage/v1/object/public/**",
          },
        ]
      : [],
  },
};

export default nextConfig;
