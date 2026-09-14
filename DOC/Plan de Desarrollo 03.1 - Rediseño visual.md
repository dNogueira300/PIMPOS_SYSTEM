# Plan de Desarrollo 03.1 — Rediseño visual con el prototipo de Stitch

> **Para quien lo ejecute:** se trabaja tarea a tarea, en orden, **una rama y un PR por tarea**
> (`feat/f3.1-tN-...`), cada uno con el CI en verde antes del siguiente. Los pasos llevan casillas
> (`- [ ]`) para ir marcando. Antes de empezar, leer `CLAUDE.md` entero: las trampas que describe
> aplican aquí igual.

**Objetivo:** que el sitio público tenga el aspecto del prototipo de Stitch «Artisan Editorial» que
eligió Dan, con el azul institucional como color principal, sin perder nada de lo que F3 dejó medido
y probado.

**Arquitectura:** el sistema de diseño ya está partido en tres capas de tokens (primitivos →
semánticos → componente) en `src/estilos/globals.css`, y las fuentes entran por variables CSS desde
`src/estilos/fuentes.ts`. Por eso el rediseño empieza **por abajo**: primero fuentes y tokens, que
retiñen todo el sitio de golpe; después las piezas base (botones, sellos, tarjetas); y solo al final
cada sección, que a esas alturas es sobre todo composición. Los datos no se tocan: todo sigue
leyendo de las vistas de la base.

**Stack:** Next.js 16.3.4 · React 19.2.8 · Tailwind 4.3.3 · `next/font/local` · Vitest · Playwright ·
axe · fonttools (Python) para preparar las fuentes.

**Especificación visual:** `DOC/Maquetas/Stitch/` — `portal.html` y sus dos renders
(`portal-escritorio.webp`, `portal-movil.webp`). Leer antes su `LEEME.md`.

**Decisiones de Dan (13/09/2026):**

1. El diseño de Stitch es la dirección de la plataforma.
2. **El azul principal es el actual, `#12306E`**, no el `#174A68` del prototipo.
3. **Tipografía de Stitch:** Playfair Display en títulos y Plus Jakarta Sans en texto. Sustituye a
   Fraunces + Inter.
4. **Productos en híbrido:** tarjetas con foto en la portada, solo para los productos que tienen foto
   real; el catálogo completo sigue siendo la pizarra de precios, con el estilo nuevo.

## Restricciones globales

Valen para todas las tareas, aunque la tarea no las repita.

- **Ningún dato del prototipo llega al sitio.** Dirección, horario, teléfono, RUC, productos, precios,
  combos, testimonios, fotos de archivo y cifras («24+ años», «18 horas de fermentación») son
  inventados. Todo sale de la base, como hoy.
- **Ninguna cuenta de años escrita a mano.** Se dice el año (`Desde {config.anio_fundacion}`) o se
  calcula con `anosDeOficio()`. La prueba de 0025 caza un `NN años` publicado.
- **WCAG 2.1 AA.** Texto normal ≥ 4.5:1, grande ≥ 3:1, bordes de controles ≥ 3:1. Lo comprueba
  `src/estilos/paleta.test.ts` (tarea 2), no un comentario.
- **Área táctil ≥ 44 × 44 px** en todo control. `e2e/tactil.spec.ts` recorre todas las páginas.
- **axe en cero.** `e2e/accesibilidad.spec.ts`, sin desactivar reglas.
- **El celular no lleva carrusel** (decisión del 12/09). El botón flotante **se aparta** con otro
  botón de pedir a la vista y mientras se baja (12/09).
- **Iconos lucide**, nunca Material Symbols. **Fuentes locales**, nunca desde Google Fonts.
- **Movimiento solo con CSS guiado por scroll** y dentro de `prefers-reduced-motion:
no-preference`. Ninguna librería de animación nueva.
- **Sin mayúsculas en texto corrido.** Los sellos cortos pueden ir en mayúsculas; los titulares y los
  párrafos, no. Y **no se pone una etiqueta pequeña encima de cada sección**: el prototipo lo hace en
  las nueve y es la marca de un sitio hecho por plantilla. Como mucho, en tres (tarea 3).
- **No se añade el acceso al panel** a la cabecera ni al pie público, aunque el prototipo lo tenga.
- **Commits sin atribución** (sección Git de `CLAUDE.md`). Conventional Commits en español.
- **Rendimiento:** la mediana de `PASADAS=5 pnpm lighthouse` en `/` no puede bajar más de 5 puntos
  respecto a la línea base medida en la tarea 1, y las fuentes que se precargan no pasan de 140 KB.

---

## Qué se toma del prototipo y qué no

| Del prototipo                                                    | En 3.1                         | Por qué                                                                                                                                   |
| ---------------------------------------------------------------- | ------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------- |
| Playfair Display + Plus Jakarta Sans                             | ✅ Se adopta                   | Decisión de Dan                                                                                                                           |
| Superficies crema en capas, bordes muy tenues, sombras cálidas   | ✅ Se adopta                   | Es el lenguaje del diseño                                                                                                                 |
| Botones en píldora de 48 px                                      | ✅ Se adopta                   | Pasan de 44 px                                                                                                                            |
| Sellos (etiquetas cortas con borde dorado)                       | ✅ Se adopta, con mesura       | Uno por bloque como mucho                                                                                                                 |
| Barra de aviso terracota arriba                                  | ✅ Con datos reales            | Dice la hora de apertura y las zonas de reparto que hay en la base (tarea 4)                                                              |
| Cabecera con la sección activa en píldora azul                   | ✅ Se adopta                   |                                                                                                                                           |
| Hero con foto velada en crema y titular azul                     | ✅ En escritorio               | En el celular, foto quieta sin carrusel (12/09). El velo tiene opacidad mínima fijada por contraste (tarea 5)                             |
| Franja durazno bajo el hero                                      | ✅ Con los tres datos reales   | Del día · A toda Iquitos · Desde {año}                                                                                                    |
| Bloque «nosotros» con foto, sello flotante y tarjetas de valores | ✅ Con datos reales            | Los valores de la ficha; el sello dice el año, no «24+ años»                                                                              |
| Tarjetas de producto con foto y «Pedir por WhatsApp»             | ⚠️ Híbrido (decisión de Dan)   | Solo los destacados con foto real, en la portada. El catálogo sigue en pizarra: 32 de 34 no tienen foto                                   |
| Filtro de categorías en píldoras                                 | ✅ Se adopta                   |                                                                                                                                           |
| Tarjetas de «combos» con precio tachado                          | ❌ No                          | No existen combos ni precios de oferta en la base. La sección de novedades toma ese estilo de tarjeta con lo que sí hay                   |
| Galería en mosaico con pie de foto                               | ✅ Con las 10 fotos reales     | El pie es el `titulo` de cada foto                                                                                                        |
| Testimonios con estrellas y nombre                               | ⚠️ Estilo sí, estrellas no     | La tabla no guarda puntuación: cinco estrellas serían inventadas. El bloque sigue oculto mientras no haya testimonios reales (0021)       |
| «Arma tu pedido»: formulario que compone el mensaje de WhatsApp  | ✅ Se adopta                   | No choca con la decisión de no poner formulario: aquella era porque nadie vigila un buzón, y este no manda nada a un buzón, abre WhatsApp |
| Preguntas frecuentes en tarjetas redondeadas                     | ✅ Se adopta                   |                                                                                                                                           |
| Pie en cuatro columnas                                           | ✅ Con datos reales            | Sin «Acceso Kárdex & Panel»                                                                                                               |
| Botón flotante verde «Pedir Calentito»                           | ⚠️ Color sí, comportamiento no | Verde WhatsApp `#2D5A43`; se sigue apartando como decidió el 12/09. El texto sigue siendo «Pedir»                                         |
| Carrusel en el celular                                           | ❌ No                          | Decisión del 12/09                                                                                                                        |
| Material Symbols, Google Fonts por CDN                           | ❌ No                          | lucide y `next/font/local`                                                                                                                |
| Acceso al panel en la cabecera pública                           | ❌ No                          | El panel no se anuncia al visitante (`robots.txt` lo excluye)                                                                             |
| Pantalla del panel interno                                       | ⏭️ F4                          | Los tokens de 3.1 la dejan lista para heredar el aspecto                                                                                  |

---

## Mapa de archivos

| Archivo                                                                      | Tarea | Qué pasa                                                 |
| ---------------------------------------------------------------------------- | ----- | -------------------------------------------------------- |
| `scripts/preparar-fuentes.py`                                                | 1     | Nuevo: descarga, recorta a latín y convierte las fuentes |
| `src/estilos/fuentes/*.woff2`, `LICENCIA.md`                                 | 1     | Se sustituyen Fraunces e Inter                           |
| `src/estilos/fuentes.ts`                                                     | 1     | Las dos fuentes nuevas                                   |
| `src/recursos/compartir/*.ttf`, `LICENCIA.md`                                | 1     | Instancias estáticas para la imagen de compartir         |
| `src/app/opengraph-image.tsx`                                                | 1     | Nombres de familia                                       |
| `e2e/marca.spec.ts`                                                          | 1     | Prueba de que se aplican las fuentes nuevas              |
| `e2e/presupuesto.spec.ts`                                                    | 1     | Techo de peso de las fuentes precargadas                 |
| `src/estilos/globals.css`                                                    | 2, 3  | Capas de tokens y piezas base                            |
| `src/estilos/paleta.test.ts`                                                 | 2     | Ya existía (F1): se amplía con las parejas del prototipo |
| `src/lib/datos/aviso.ts` + `.test.ts`                                        | 4     | Nuevo: el texto de la barra de aviso, desde datos reales |
| `src/components/publico/barra-aviso.tsx`                                     | 4     | Nuevo                                                    |
| `src/components/publico/cascara-publica.tsx`                                 | 4     | Monta la barra                                           |
| `src/components/publico/cabecera.tsx`, `pie.tsx`                             | 4     | Estilo nuevo                                             |
| `src/components/publico/boton-whatsapp.tsx`                                  | 4     | Verde WhatsApp                                           |
| `src/components/publico/portada-movil.tsx`                                   | 5     | Estilo nuevo, sin carrusel                               |
| `src/components/publico/carrusel-portada.tsx`                                | 5     | Velo crema y titular azul                                |
| `src/app/(public)/page.tsx`                                                  | 5, 6  | Franja, bloque nosotros, tarjetas híbridas               |
| `src/lib/datos/destacados.ts` + `.test.ts`                                   | 6     | Nuevo: separa destacados con foto y sin foto             |
| `src/components/publico/tarjeta-producto.tsx`                                | 6     | Nuevo                                                    |
| `src/components/publico/pizarra-precios.tsx`                                 | 6     | Estilo nuevo                                             |
| `src/components/publico/filtro-categorias.tsx`                               | 6     | Píldoras                                                 |
| `src/app/(public)/productos/page.tsx`, `[slug]/page.tsx`                     | 6     | Estilo nuevo                                             |
| `src/app/(public)/novedades/**`, `galeria/page.tsx`                          | 7     | Estilo nuevo                                             |
| `src/lib/datos/pedido.ts` + `pedido.test.ts`                                 | 8     | `mensajeArmado()`                                        |
| `src/components/publico/arma-tu-pedido.tsx`                                  | 8     | Nuevo: el formulario que abre WhatsApp                   |
| `src/app/(public)/contacto`, `ubicacion`, `nosotros`, `preguntas-frecuentes` | 8     | Estilo nuevo                                             |
| `docs/marca.md`, `PRODUCT.md`, `CLAUDE.md`, `DOC/*`                          | 9     | Documentación                                            |

---

## Tarea 1 — Tipografía: Playfair Display y Plus Jakarta Sans, locales

Rama `feat/f3.1-t1-tipografia`.

**Consume:** nada. **Produce:** las variables `--fuente-titulo` y `--fuente-texto` apuntando a las
familias nuevas (los nombres de variable no cambian, así que ningún componente se toca), y la línea
base de Lighthouse contra la que se medirá el resto.

- [ ] **Paso 1: medir la línea base antes de cambiar nada.**

```bash
git checkout main && git pull
pnpm build && pnpm start   # antes, liberar el puerto 3000 (ver CLAUDE.md)
PASADAS=5 MSYS_NO_PATHCONV=1 node scripts/medir-lighthouse.mjs http://localhost:3000 / /productos
```

Anotar las dos medianas de rendimiento en la descripción del PR. Son el suelo de toda la fase.

- [ ] **Paso 2: escribir la prueba que falla.** Añadir al final de `e2e/marca.spec.ts`:

```ts
test("los titulares van en Playfair Display y el texto en Plus Jakarta Sans", async ({ page }) => {
  await page.goto("/");

  // `next/font` publica la familia con el nombre de la variable exportada en
  // `src/estilos/fuentes.ts`. Si alguien vuelve a una fuente de sistema, la
  // familia calculada deja de nombrarlas y esto falla.
  const titular = await page
    .getByRole("heading", { level: 2 })
    .first()
    .evaluate((el) => getComputedStyle(el).fontFamily.toLowerCase());
  const cuerpo = await page.evaluate(() =>
    getComputedStyle(document.body).fontFamily.toLowerCase(),
  );

  expect(titular, `Familia del titular: ${titular}`).toContain("playfair");
  expect(cuerpo, `Familia del cuerpo: ${cuerpo}`).toContain("jakarta");
});
```

Y en `e2e/presupuesto.spec.ts`, al final:

```ts
test("las fuentes que se precargan no pasan de 140 KB", async ({ page }) => {
  const fuentes: { url: string; bytes: number }[] = [];
  page.on("response", async (respuesta) => {
    if (!respuesta.url().endsWith(".woff2")) return;
    fuentes.push({ url: respuesta.url(), bytes: (await respuesta.body()).byteLength });
  });

  await page.goto("/", { waitUntil: "networkidle" });

  const total = fuentes.reduce((suma, f) => suma + f.bytes, 0);
  console.log(`Fuentes: ${fuentes.length} archivos, ${Math.round(total / 1024)} KB`);

  expect(fuentes.length, "No se midio ninguna fuente").toBeGreaterThan(0);
  // Fraunces + Inter pesaban 113 KB. El techo deja margen para el cambio de
  // familia sin permitir que se cuele una tercera fuente o un corte completo.
  expect(total).toBeLessThan(140 * 1024);
});
```

- [ ] **Paso 3: comprobar que falla.**

```bash
pnpm exec playwright test e2e/marca.spec.ts -g "Playfair" --project=escritorio
```

Esperado: FAIL, la familia calculada contiene `fraunces`.

- [ ] **Paso 4: el guion que prepara las fuentes.** Crear `scripts/preparar-fuentes.py`:

```python
#!/usr/bin/env python3
"""Descarga Playfair Display y Plus Jakarta Sans y las deja listas para el sitio.

    pip install fonttools brotli
    python scripts/preparar-fuentes.py

Dos salidas por fuente, porque las usan dos motores distintos:

- `src/estilos/fuentes/*.woff2`: variables, recortadas a latin. Las sirve
  `next/font/local` a todo el sitio.
- `src/recursos/compartir/*.ttf`: estaticas, de un solo peso. `ImageResponse`
  (`next/og`) no acepta woff2 ni maneja bien las variables (ver CLAUDE.md).

Las dos son OFL 1.1 y vienen del repositorio oficial de Google Fonts: se
descargan, no se toman de un CDN en tiempo de ejecucion.
"""

import subprocess
import sys
import urllib.request
from pathlib import Path

BASE = "https://raw.githubusercontent.com/google/fonts/main/ofl"
FUENTES = {
    "playfair": (f"{BASE}/playfairdisplay/PlayfairDisplay%5Bwght%5D.ttf", 700),
    "jakarta": (f"{BASE}/plusjakartasans/PlusJakartaSans%5Bwght%5D.ttf", 500),
}
# Latin basico + latin-1 (tildes, ñ, ¿, ¡) + puntuacion tipografica y el sol.
UNICODES = "U+0000-00FF,U+0131,U+0152-0153,U+2013-2014,U+2018-201E,U+2022,U+2026,U+20AC,U+2122"

RAIZ = Path(__file__).resolve().parent.parent
TMP = RAIZ / ".fuentes-origen"
WEB = RAIZ / "src/estilos/fuentes"
OG = RAIZ / "src/recursos/compartir"


def main() -> int:
    TMP.mkdir(exist_ok=True)
    for nombre, (url, peso_og) in FUENTES.items():
        origen = TMP / f"{nombre}.ttf"
        if not origen.exists():
            print(f"descargando {nombre}...")
            urllib.request.urlretrieve(url, origen)

        web = WEB / f"{nombre}-latin.woff2"
        subprocess.run(
            [sys.executable, "-m", "fontTools.subset", str(origen),
             f"--unicodes={UNICODES}", "--flavor=woff2", "--layout-features=*",
             f"--output-file={web}"],
            check=True,
        )

        og = OG / f"{nombre}-{peso_og}.ttf"
        subprocess.run(
            [sys.executable, "-m", "fontTools.varLib.instancer", str(origen),
             f"wght={peso_og}", "-o", str(og)],
            check=True,
        )
        subprocess.run(
            [sys.executable, "-m", "fontTools.subset", str(og),
             f"--unicodes={UNICODES}", f"--output-file={og}"],
            check=True,
        )
        print(f"{web.name}: {web.stat().st_size // 1024} KB · {og.name}: {og.stat().st_size // 1024} KB")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
```

Añadir `/.fuentes-origen/` al `.gitignore` y ejecutarlo:

```bash
pip install fonttools brotli
python scripts/preparar-fuentes.py
git rm src/estilos/fuentes/fraunces-latin.woff2 src/estilos/fuentes/inter-latin.woff2
git rm src/recursos/compartir/fraunces-600.ttf src/recursos/compartir/inter-500.ttf
```

Si la suma de los dos `.woff2` pasa de 140 KB, instanciar en lugar de dejar variables: Playfair a los
pesos 600 y 700, Jakarta a 400 y 600, con `fontTools.varLib.instancer` y `wght=600:700` /
`wght=400:600`, y volver a medir.

- [ ] **Paso 5: apuntar `next/font` a las nuevas.** En `src/estilos/fuentes.ts`, sustituir los dos
      `localFont` y el export final por:

```ts
/**
 * Playfair Display, para los títulos (decisión de Dan, 13/09/2026, sobre el
 * prototipo de Stitch). Un serif de alto contraste: el trazo fino contra el
 * grueso es lo que le da el aire de rótulo de panadería de siempre.
 */
export const playfair = localFont({
  src: "./fuentes/playfair-latin.woff2",
  weight: "400 900",
  style: "normal",
  display: "swap",
  variable: "--fuente-titulo",
  fallback: ["Georgia", "Times New Roman", "serif"],
  adjustFontFallback: "Times New Roman",
});

/** Plus Jakarta Sans, para el texto: geométrica pero cálida, muy legible en precios. */
export const jakarta = localFont({
  src: "./fuentes/jakarta-latin.woff2",
  weight: "200 800",
  style: "normal",
  display: "swap",
  variable: "--fuente-texto",
  fallback: ["system-ui", "Segoe UI", "Roboto", "sans-serif"],
  adjustFontFallback: "Arial",
});

/** Clases que hay que poner en el `<html>` para publicar ambas variables CSS. */
export const clasesDeFuentes = `${playfair.variable} ${jakarta.variable}`;
```

Actualizar el comentario de cabecera del archivo (quitar la referencia a Fraunces elegida por el
propietario, citar la decisión del 13/09) y `src/estilos/fuentes/LICENCIA.md` con los dos avisos OFL
de `.fuentes-origen/` (copiar `OFL.txt` de cada una desde `BASE`).

- [ ] **Paso 6: la imagen para compartir.** En `src/app/opengraph-image.tsx`:

```ts
const playfair = await readFile(join(RECURSOS, "playfair-700.ttf"));
const jakarta = await readFile(join(RECURSOS, "jakarta-500.ttf"));
```

y en `fonts: [...]`:

```ts
{ name: "Playfair Display", data: playfair, weight: 700, style: "normal" },
{ name: "Plus Jakarta Sans", data: jakarta, weight: 500, style: "normal" },
```

Reemplazar las tres apariciones de `fontFamily: "Fraunces"` por `fontFamily: "Playfair Display"` y
la de `fontFamily: "Inter"` por `fontFamily: "Plus Jakarta Sans"`. Actualizar
`src/recursos/compartir/LICENCIA.md`.

- [ ] **Paso 7: comprobar.**

```bash
pnpm typecheck && pnpm lint
pnpm exec playwright test e2e/marca.spec.ts e2e/presupuesto.spec.ts e2e/seo.spec.ts
```

Esperado: PASS, incluida «la imagen para compartir existe y es una imagen de verdad». Abrir
`http://localhost:3000/opengraph-image` y mirarla: los caracteres con tilde tienen que salir.

- [ ] **Paso 8: suite completa, commit y PR.**

```bash
pnpm test && pnpm exec playwright test && supabase test db
git add -A
git commit -m "feat(diseño): Playfair Display y Plus Jakarta Sans, servidas desde el proyecto"
```

---

## Tarea 2 — Tokens: la paleta del prototipo con el azul institucional

> **Dos correcciones a este plan, descubiertas al ejecutar la tarea (14/09/2026):**
>
> 1. `src/estilos/paleta.test.ts` **ya existía** desde F1, con el tema oscuro, los colores de estado
>    y las reglas del dorado. No se crea: se **amplía**, conservando todas sus comprobaciones y
>    sumando las del prototipo. Quedó en 44.
> 2. **El CTA sigue dorado en esta tarea** y pasa a la píldora azul en la tarea 3. Hoy hay
>    `boton-cta` sobre fondo azul en la cabecera, el menú del celular, el bloque de delivery y el
>    hero móvil: con el CTA azul, esos botones quedarían azul sobre azul, invisibles, y `main` se
>    desplegaría roto. La tarea 3 cambia el color y arregla esos botones en el mismo PR.

Rama `feat/f3.1-t2-tokens`.

**Consume:** nada de la tarea 1. **Produce:** los tokens que usan las tareas 3 a 8:
`--cta-*`, `--cta-secundario-*`, `--whatsapp-*`, `--aviso-*`, `--franja-*`, `--sello-*`,
`--sombra-1/2/3`, `--velo-hero`, y las utilidades Tailwind `bg-cta`, `bg-cta-secundario`,
`bg-whatsapp`, `bg-aviso`, `bg-franja`, `text-acento`, `text-precio`, `shadow-suave`,
`shadow-elevada`, `shadow-flotante`, `rounded-pildora`.

- [ ] **Paso 1: escribir la prueba que falla.** Crear `src/estilos/paleta.test.ts`:

```ts
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { aCanales, contraste } from "@/lib/utilidades/contraste";

/**
 * El contraste de cada pareja de colores que el sitio pinta de verdad, leído
 * del propio `globals.css`.
 *
 * `contraste.test.ts` prueba la fórmula con valores escritos a mano. Esto
 * prueba la PALETA: si alguien cambia un primitivo y una pareja deja de pasar
 * AA, falla aquí con el nombre de los dos tokens, no en una crítica de diseño
 * semanas después.
 */

const CSS = readFileSync(join(__dirname, "globals.css"), "utf8");

function primitivo(nombre: string): string {
  const encontrado = CSS.match(new RegExp(`--pimpos-${nombre}:\\s*(#[0-9a-fA-F]{6})`));
  if (!encontrado) throw new Error(`No existe el primitivo --pimpos-${nombre} en globals.css`);
  return encontrado[1];
}

/** `frente` pintado con opacidad `alfa` sobre `fondo`, como lo compone el navegador. */
function mezclar(frente: string, fondo: string, alfa: number): string {
  const f = aCanales(frente);
  const b = aCanales(fondo);
  return (
    "#" +
    f
      .map((canal, i) => Math.round(canal * alfa + b[i] * (1 - alfa)))
      .map((canal) => canal.toString(16).padStart(2, "0"))
      .join("")
  );
}

const TEXTO = 4.5;
const GRANDE_O_CONTROL = 3;

const PAREJAS: [descripcion: string, frente: () => string, fondo: () => string, minimo: number][] =
  [
    [
      "texto sobre el fondo de página",
      () => primitivo("tinta-900"),
      () => primitivo("crema-50"),
      TEXTO,
    ],
    [
      "texto secundario sobre sección alterna",
      () => primitivo("tinta-600"),
      () => primitivo("crema-100"),
      TEXTO,
    ],
    [
      "titular azul sobre el fondo",
      () => primitivo("azul-900"),
      () => primitivo("crema-50"),
      TEXTO,
    ],
    [
      "titular azul sobre sección apagada",
      () => primitivo("azul-900"),
      () => primitivo("crema-200"),
      TEXTO,
    ],
    [
      "botón principal: crema sobre azul",
      () => primitivo("crema-50"),
      () => primitivo("azul-900"),
      TEXTO,
    ],
    [
      "botón principal al pasar: crema sobre azul-800",
      () => primitivo("crema-50"),
      () => primitivo("azul-800"),
      TEXTO,
    ],
    [
      "botón secundario: crema sobre marrón",
      () => primitivo("crema-50"),
      () => primitivo("dorado-800"),
      TEXTO,
    ],
    [
      "botón secundario al pasar",
      () => primitivo("crema-50"),
      () => primitivo("dorado-900"),
      TEXTO,
    ],
    [
      "WhatsApp: blanco sobre verde",
      () => primitivo("crema-0"),
      () => primitivo("verde-700"),
      TEXTO,
    ],
    [
      "precio y etiquetas: marrón sobre el fondo",
      () => primitivo("dorado-800"),
      () => primitivo("crema-50"),
      TEXTO,
    ],
    [
      "precio sobre tarjeta blanca",
      () => primitivo("dorado-800"),
      () => primitivo("crema-0"),
      TEXTO,
    ],
    [
      "sello: marrón sobre crema",
      () => primitivo("dorado-800"),
      () => primitivo("crema-100"),
      TEXTO,
    ],
    [
      "barra de aviso: crema sobre terracota",
      () => primitivo("crema-50"),
      () => primitivo("terracota-800"),
      TEXTO,
    ],
    [
      "franja: tinta sobre durazno",
      () => primitivo("tinta-900"),
      () => primitivo("dorado-300"),
      TEXTO,
    ],
    [
      "franja, detalle al 80 %",
      () => mezclar(primitivo("tinta-900"), primitivo("dorado-300"), 0.8),
      () => primitivo("dorado-300"),
      TEXTO,
    ],
    [
      "foco visible sobre el fondo",
      () => primitivo("azul-600"),
      () => primitivo("crema-50"),
      GRANDE_O_CONTROL,
    ],
    [
      "borde de campo de formulario",
      () => primitivo("tinta-500"),
      () => primitivo("crema-0"),
      GRANDE_O_CONTROL,
    ],
    // El hero de escritorio pone el titular sobre una foto velada en crema. El
    // peor caso es un píxel negro debajo del velo: con el velo a --velo-hero
    // (0.85), el titular sigue pasando. Si alguien baja la opacidad, falla aquí.
    [
      "titular sobre el velo del hero, peor caso",
      () => primitivo("azul-900"),
      () => mezclar(primitivo("crema-50"), "#000000", 0.85),
      TEXTO,
    ],
    [
      "subtítulo sobre el velo del hero, peor caso",
      () => primitivo("tinta-600"),
      () => mezclar(primitivo("crema-50"), "#000000", 0.85),
      TEXTO,
    ],
  ];

describe("la paleta cumple AA en cada pareja que se pinta", () => {
  it.each(PAREJAS)("%s", (_descripcion, frente, fondo, minimo) => {
    const ratio = contraste(frente(), fondo());
    expect(ratio, `${frente()} sobre ${fondo()} da ${ratio.toFixed(2)}`).toBeGreaterThanOrEqual(
      minimo,
    );
  });

  // Documenta lo que NO se puede hacer, para que nadie lo intente: el dorado
  // claro solo vale de fondo.
  it("el dorado claro no vale como texto sobre crema", () => {
    expect(contraste(primitivo("dorado-500"), primitivo("crema-50"))).toBeLessThan(TEXTO);
  });

  // Y el marrón dorado no vale sobre la franja durazno (3.92): ahí va tinta.
  it("el marrón dorado no vale como texto sobre la franja", () => {
    expect(contraste(primitivo("dorado-800"), primitivo("dorado-300"))).toBeLessThan(TEXTO);
  });

  it("el velo del hero declarado en el CSS es el que da por bueno esta prueba", () => {
    expect(CSS).toMatch(/--velo-hero:\s*0\.85/);
  });
});
```

- [ ] **Paso 2: comprobar que falla.**

```bash
pnpm test -- src/estilos/paleta.test.ts
```

Esperado: FAIL con «No existe el primitivo --pimpos-tinta-600».

- [ ] **Paso 3: sustituir la capa 1.** En `src/estilos/globals.css`, dentro del primer `:root`,
      reemplazar los bloques «Azules», «Cremas», «Dorado» y «Tintas» (desde
      `/* Azules del logo y de la fachada */` hasta `--pimpos-tinta-500: #8a6b4f;` inclusive) por:

```css
/* Azul institucional. Es el primario de todo el sitio (decisión de Dan,
     13/09/2026): el prototipo de Stitch traía #174a68 y se sustituye por el
     del logo. */
--pimpos-azul-900: #12306e; /* Texto "PANADERIA PASTELERIA Y BODEGA" */
--pimpos-azul-800: #1d3f86; /* Hover del botón principal: 9.51 con crema */
--pimpos-azul-600: #0060a8; /* Fachada del local; foco visible */
--pimpos-azul-200: #9fc2f0; /* Derivado, para el tema oscuro */

/* Superficies crema en capas, del prototipo de Stitch. El fondo nunca es
     blanco puro; el blanco se reserva a lo que flota encima (tarjetas,
     campos de formulario). */
--pimpos-crema-0: #ffffff; /* Tarjeta elevada, campo de formulario */
--pimpos-crema-50: #fff9ee; /* Fondo de página */
--pimpos-crema-100: #faf3e6; /* Sección alterna */
--pimpos-crema-200: #f4ede0; /* Sección apagada, tarjeta sobre sección */
--pimpos-crema-300: #eee7db; /* Hover de superficies */

/* Dorados. Cuatro valores y cada uno con un solo papel:
     - dorado-300 (durazno): FONDO de la franja. Con tinta encima, 10.39.
     - dorado-500: FONDO de detalles y bordes de sellos. Como texto da 2.31.
     - dorado-800: TEXTO dorado (precios, sellos, enlaces). 6.18 sobre crema,
       pero 3.92 sobre el durazno: ahí no va.
     - dorado-900: hover del botón secundario. */
--pimpos-dorado-300: #fdbd73;
--pimpos-dorado-500: #d69b55;
--pimpos-dorado-800: #835413;
--pimpos-dorado-900: #6e460f;

/* Acentos del prototipo */
--pimpos-terracota-800: #842113; /* Barra de aviso: 9.07 con crema */
--pimpos-verde-700: #2d5a43; /* WhatsApp: 7.91 con blanco */
--pimpos-verde-800: #234735; /* Hover de WhatsApp */

/* Tintas */
--pimpos-tinta-900: #1e1b14; /* Texto principal: 16.40 sobre el fondo */
--pimpos-tinta-600: #41474d; /* Texto secundario: 8.97 sobre el fondo */
--pimpos-tinta-500: #8a6b4f; /* Borde de campos: 4.89 sobre blanco */
--pimpos-cafe-600: #6b3e26; /* Solo para bordes tenues y sombras, nunca texto */
```

Y cambiar `--radius: 0.875rem;` por `--radius: 1rem; /* 16 px: tarjetas del prototipo */`.

- [ ] **Paso 4: sustituir la capa 2** (el segundo `:root`, sin tocar `.dark`) por:

```css
:root {
  --background: var(--pimpos-crema-50);
  --foreground: var(--pimpos-tinta-900);

  --card: var(--pimpos-crema-0);
  --card-foreground: var(--pimpos-tinta-900);
  --popover: var(--pimpos-crema-0);
  --popover-foreground: var(--pimpos-tinta-900);

  /* Azul institucional: navegación, titulares y acción principal. */
  --primary: var(--pimpos-azul-900);
  --primary-foreground: var(--pimpos-crema-50);

  --secondary: var(--pimpos-crema-200);
  --secondary-foreground: var(--pimpos-tinta-900);

  --muted: var(--pimpos-crema-100);
  --muted-foreground: var(--pimpos-tinta-600);
  --accent: var(--pimpos-crema-300);
  --accent-foreground: var(--pimpos-tinta-900);

  --destructive: var(--pimpos-peligro-600);
  --destructive-foreground: var(--pimpos-crema-50);
  --exito: var(--pimpos-exito-600);
  --alerta: var(--pimpos-alerta-600);

  /* Dos bordes distintos, y no es capricho: el decorativo es casi invisible,
     como papel prensado (prototipo); el de un campo de formulario tiene que
     llegar a 3:1, que es lo que exige WCAG a un control. */
  --border: color-mix(in srgb, var(--pimpos-cafe-600) 12%, transparent);
  --input: var(--pimpos-tinta-500);
  --ring: var(--pimpos-azul-600);

  --chart-1: var(--pimpos-azul-900);
  --chart-2: var(--pimpos-dorado-800);
  --chart-3: var(--pimpos-azul-600);
  --chart-4: var(--pimpos-exito-600);
  --chart-5: var(--pimpos-terracota-800);

  --sidebar: var(--pimpos-crema-100);
  --sidebar-foreground: var(--pimpos-tinta-900);
  --sidebar-primary: var(--pimpos-azul-900);
  --sidebar-primary-foreground: var(--pimpos-crema-50);
  --sidebar-accent: var(--pimpos-crema-300);
  --sidebar-accent-foreground: var(--pimpos-tinta-900);
  --sidebar-border: color-mix(in srgb, var(--pimpos-cafe-600) 12%, transparent);
  --sidebar-ring: var(--pimpos-azul-600);

  --font-sans: var(--pimpos-fuente-texto);
  --font-heading: var(--pimpos-fuente-titulo);
}
```

- [ ] **Paso 5: sustituir la capa 3** (el `:root` que empieza con `/* Llamada a la accion principal`)
      por:

```css
:root {
  /* Acción principal: píldora azul (prototipo). */
  --cta-fondo: var(--pimpos-azul-900);
  --cta-texto: var(--pimpos-crema-50);
  --cta-fondo-hover: var(--pimpos-azul-800);
  --cta-texto-hover: var(--pimpos-crema-50);

  /* Acción secundaria: píldora marrón dorado. */
  --cta-secundario-fondo: var(--pimpos-dorado-800);
  --cta-secundario-texto: var(--pimpos-crema-50);
  --cta-secundario-fondo-hover: var(--pimpos-dorado-900);

  /* WhatsApp: el verde amazónico del prototipo, no el verde de la marca
     WhatsApp (#25d366 no llega a AA con texto blanco). */
  --whatsapp-fondo: var(--pimpos-verde-700);
  --whatsapp-texto: var(--pimpos-crema-0);
  --whatsapp-fondo-hover: var(--pimpos-verde-800);

  --acento-texto: var(--pimpos-dorado-800);
  --precio-texto: var(--pimpos-dorado-800);

  /* Franja de confianza bajo el hero: durazno con tinta. */
  --franja-fondo: var(--pimpos-dorado-300);
  --franja-texto: var(--pimpos-tinta-900);

  /* Barra de aviso de arriba del todo. */
  --aviso-fondo: var(--pimpos-terracota-800);
  --aviso-texto: var(--pimpos-crema-50);

  /* Sellos: etiquetas cortas de borde dorado. */
  --sello-fondo: var(--pimpos-crema-100);
  --sello-borde: color-mix(in srgb, var(--pimpos-dorado-500) 40%, transparent);
  --sello-texto: var(--pimpos-dorado-800);

  /* Sombras cálidas del prototipo: café y azul muy diluidos, nunca negro. */
  --sombra-1: 0 2px 6px -1px rgb(107 62 38 / 0.05), 0 1px 3px -1px rgb(18 48 110 / 0.04);
  --sombra-2: 0 10px 24px -4px rgb(107 62 38 / 0.08), 0 4px 8px -2px rgb(18 48 110 / 0.03);
  --sombra-3: 0 20px 40px -8px rgb(30 27 20 / 0.16);

  /* Opacidad mínima del velo crema del hero de escritorio. La fija el peor
     caso de contraste (titular azul sobre velo encima de un píxel negro =
     8.50) y la vigila src/estilos/paleta.test.ts. No bajarla. */
  --velo-hero: 0.85;

  --area-tactil-min: 2.75rem;
}
```

- [ ] **Paso 6: el puente con Tailwind.** En `@theme inline`, sustituir las seis líneas de
      `--color-cta` a `--color-franja-foreground` por:

```css
--color-cta: var(--cta-fondo);
--color-cta-foreground: var(--cta-texto);
--color-cta-secundario: var(--cta-secundario-fondo);
--color-cta-secundario-foreground: var(--cta-secundario-texto);
--color-whatsapp: var(--whatsapp-fondo);
--color-whatsapp-foreground: var(--whatsapp-texto);
--color-acento: var(--acento-texto);
--color-precio: var(--precio-texto);
--color-franja: var(--franja-fondo);
--color-franja-foreground: var(--franja-texto);
--color-aviso: var(--aviso-fondo);
--color-aviso-foreground: var(--aviso-texto);
--color-sello: var(--sello-fondo);
--color-sello-foreground: var(--sello-texto);

--shadow-suave: var(--sombra-1);
--shadow-elevada: var(--sombra-2);
--shadow-flotante: var(--sombra-3);
--radius-pildora: 9999px;
```

- [ ] **Paso 7: comprobar.**

```bash
pnpm test -- src/estilos/paleta.test.ts
```

Esperado: PASS en las 22 comprobaciones.

- [ ] **Paso 8: la franja cambia de azul a durazno, y hay que revisar su texto.** En
      `src/app/(public)/page.tsx`, dentro de la franja, `text-franja-foreground/80` sigue valiendo
      (6.50, en la prueba). Buscar cualquier otro uso de los tokens retirados:

```bash
grep -rn "dorado-700\|crema-100\b" src --include=*.tsx --include=*.ts
```

Esperado: ninguna coincidencia (los componentes solo usan capas 2 y 3).

- [ ] **Paso 9: suite completa, mirar el sitio y PR.**

```bash
pnpm typecheck && pnpm lint && pnpm test && pnpm exec playwright test
git add -A && git commit -m "feat(diseño): la paleta del prototipo de Stitch con el azul institucional"
```

Levantar el build y mirar `/`, `/productos` y `/contacto` a 375 y 1280 px. Tiene que verse retocado
de color pero **igual de estructura**: en este PR no cambia ningún componente.

---

## Tarea 3 — Piezas base: botones en píldora, sellos y tarjetas

Rama `feat/f3.1-t3-piezas`.

**Consume:** los tokens de la tarea 2. **Produce:** las clases `.boton-cta` (se conserva el nombre:
`e2e/movimiento.spec.ts` la busca), `.boton-secundario`, `.boton-linea`, `.boton-whatsapp`,
`.sello`, `.tarjeta` y `.tarjeta--elevable`, y el componente `TituloSeccion`.

- [ ] **Paso 1: la prueba que falla.** Añadir a `e2e/tactil.spec.ts`:

```ts
test("los botones son píldoras de al menos 48 px de alto", async ({ page }) => {
  await page.goto("/");
  // El primer botón VISIBLE de cualquier variante: en el celular el primer
  // `.boton-cta` es el del carrusel, que ahí está oculto (corregido al ejecutar).
  const boton = page
    .getByRole("main")
    .locator(
      ":is(a, button):is(.boton-cta, .boton-whatsapp, .boton-linea, .boton-secundario):visible",
    )
    .first();
  await expect(boton).toBeVisible();

  const { alto, radio } = await boton.evaluate((el) => {
    const estilo = getComputedStyle(el);
    return {
      alto: el.getBoundingClientRect().height,
      radio: parseFloat(estilo.borderTopLeftRadius),
    };
  });

  // 48 px y no 44: el prototipo los hace así y el margen sobre el mínimo
  // táctil es a propósito. La píldora es el radio igual o mayor que la mitad
  // del alto.
  expect(alto).toBeGreaterThanOrEqual(48);
  expect(radio).toBeGreaterThanOrEqual(alto / 2);
});
```

- [ ] **Paso 2: comprobar que falla.**

```bash
pnpm exec playwright test e2e/tactil.spec.ts -g "píldoras"
```

Esperado: FAIL (alto 44, radio 11).

- [ ] **Paso 3: las clases.** En `src/estilos/globals.css`, dentro de `@layer components`,
      sustituir desde `.boton-cta {` hasta el cierre de `.boton-linea--sobre-azul:focus-visible
{ ... }` por:

```css
/* Botones del prototipo: píldoras de 48 px. Una sola base para que ninguna
     copia se quede sin área táctil o sin foco visible. */
.boton-cta,
.boton-secundario,
.boton-linea,
.boton-whatsapp {
  min-height: 3rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  border-radius: 9999px;
  padding-inline: 1.5rem;
  font-weight: 600;
  font-size: 0.9375rem;
  transition:
    background-color 0.2s ease,
    border-color 0.2s ease,
    color 0.2s ease,
    box-shadow 0.2s ease,
    transform 0.1s ease;
}

.boton-cta {
  background-color: var(--cta-fondo);
  color: var(--cta-texto);
}
.boton-cta:hover {
  background-color: var(--cta-fondo-hover);
  color: var(--cta-texto-hover);
  box-shadow: var(--sombra-2);
}

.boton-secundario {
  background-color: var(--cta-secundario-fondo);
  color: var(--cta-secundario-texto);
}
.boton-secundario:hover {
  background-color: var(--cta-secundario-fondo-hover);
  box-shadow: var(--sombra-2);
}

.boton-whatsapp {
  background-color: var(--whatsapp-fondo);
  color: var(--whatsapp-texto);
}
.boton-whatsapp:hover {
  background-color: var(--whatsapp-fondo-hover);
  box-shadow: var(--sombra-2);
}

/* De línea: sobre crema, borde azul; sobre azul, borde crema al 45 %
     (3.63 con el azul, medido en F3). */
.boton-linea {
  border: 1.5px solid var(--primary);
  color: var(--primary);
}
.boton-linea:hover {
  background-color: color-mix(in srgb, var(--primary) 8%, transparent);
}
.boton-linea--sobre-azul {
  border-color: color-mix(in srgb, var(--primary-foreground) 45%, transparent);
  color: var(--primary-foreground);
}
.boton-linea--sobre-azul:hover {
  background-color: color-mix(in srgb, var(--primary-foreground) 12%, transparent);
  border-color: var(--primary-foreground);
}

.boton-cta:active,
.boton-secundario:active,
.boton-linea:active,
.boton-whatsapp:active {
  transform: translateY(1px);
}

.boton-cta:focus-visible,
.boton-secundario:focus-visible,
.boton-linea:focus-visible,
.boton-whatsapp:focus-visible {
  outline: 2px solid var(--ring);
  outline-offset: 3px;
}
.boton-linea--sobre-azul:focus-visible,
.boton-cta--sobre-azul:focus-visible {
  outline-color: var(--primary-foreground);
}

/* Sello: la etiqueta corta del prototipo ("RECIÉN SALIDO", "DESDE 2004").
     Mayúsculas solo aquí, porque son dos o tres palabras. */
.sello {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  border-radius: 9999px;
  border: 1px solid var(--sello-borde);
  background-color: var(--sello-fondo);
  color: var(--sello-texto);
  padding: 0.25rem 0.75rem;
  font-size: 0.6875rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  line-height: 1.3;
  text-transform: uppercase;
}

/* Tarjeta: blanca sobre crema, borde de papel y sombra cálida. */
.tarjeta {
  background-color: var(--card);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  box-shadow: var(--sombra-1);
}
```

Y dentro del bloque `@media (prefers-reduced-motion: no-preference)` que ya existe (el de
`@supports (animation-timeline: view())`), al final, antes de `@media print`:

```css
/* La tarjeta se levanta 3 px al pasar el mouse. Solo con puntero fino:
         en un teléfono el "hover" se queda pegado tras el toque. */
@media (hover: hover) {
  .tarjeta--elevable {
    transition:
      transform 0.25s cubic-bezier(0.22, 1, 0.36, 1),
      box-shadow 0.25s ease;
  }
  .tarjeta--elevable:hover {
    transform: translateY(-3px);
    box-shadow: var(--sombra-2);
  }
}
```

- [ ] **Paso 4: el título de sección.** Crear `src/components/publico/titulo-seccion.tsx`:

```tsx
import type { ReactNode } from "react";

/**
 * Titular de sección del prototipo: serif azul grande y, opcionalmente, un
 * sello encima y una entradilla debajo.
 *
 * El sello es OPCIONAL y se usa poco. El prototipo pone una etiqueta pequeña
 * en mayúsculas encima de las nueve secciones, y repetida así es la marca de
 * un sitio hecho por plantilla: pierde el sentido de destacar algo. En la
 * portada lo llevan como mucho tres bloques (ver el plan 03.1).
 */
export function TituloSeccion({
  id,
  titulo,
  sello,
  entradilla,
  centrado = false,
  nivel = 2,
}: {
  id?: string;
  titulo: ReactNode;
  sello?: string;
  entradilla?: ReactNode;
  centrado?: boolean;
  nivel?: 1 | 2;
}) {
  const Encabezado = nivel === 1 ? "h1" : "h2";
  return (
    <div className={centrado ? "mx-auto max-w-2xl text-center" : "max-w-2xl"}>
      {sello ? <p className="sello mb-3">{sello}</p> : null}
      <Encabezado
        id={id}
        className="font-heading text-primary text-[1.75rem] leading-[1.2] font-semibold tracking-[-0.01em] text-balance sm:text-4xl"
      >
        {titulo}
      </Encabezado>
      {entradilla ? (
        <p className="text-muted-foreground mt-3 text-base text-pretty sm:text-lg">{entradilla}</p>
      ) : null}
    </div>
  );
}
```

- [ ] **Paso 5: comprobar, sin tocar aún ninguna sección.**

```bash
pnpm exec playwright test e2e/tactil.spec.ts e2e/accesibilidad.spec.ts e2e/movimiento.spec.ts
pnpm test -- src/estilos/paleta.test.ts
```

Esperado: PASS. Los botones de todo el sitio ya salen en píldora azul.

- [ ] **Paso 6: el dorado ya no es el CTA.** Buscar los botones que eran dorados a propósito sobre
      fondo azul y hoy quedarían azul sobre azul:

```bash
grep -rn "boton-cta--sobre-azul\|bg-primary" src/components src/app --include=*.tsx
```

En cada `boton-cta` que esté dentro de un bloque `bg-primary`, cambiarlo por `boton-whatsapp` si
abre WhatsApp, o por `boton-linea boton-linea--sobre-azul` si no. **Nunca `boton-secundario` sobre
azul**: el marrón contra el azul da 1.94, y el botón se perdería contra su fondo. Hoy son el bloque
de delivery de la portada y `PortadaMovil`; los dos se rehacen en la tarea 5, así que aquí basta con
que no queden invisibles.

- [ ] **Paso 7: commit y PR.**

```bash
git add -A && git commit -m "feat(diseño): botones en píldora, sellos y tarjetas del prototipo"
```

---

## Tarea 4 — Cáscara: barra de aviso, cabecera, pie y botón flotante

> **Correcciones a este plan, descubiertas al ejecutar la tarea (14/09/2026):**
>
> 1. **`src/lib/datos/aviso.ts` ya existe** y es otra cosa: `avisarDeConsulta`, el registro de
>    errores de las consultas, que importan catálogo, configuración y contenido. Escribir encima,
>    como decía el paso 3, habría roto el build. La función va en **`texto-aviso.ts`**.
> 2. **La barra es un `<aside>` fuera de la cabecera**, no un `<div>`. Dentro de la cabecera fija se
>    quedaría pegada y comería ~40 px del celular siempre; fuera y como `<div>`, axe la marca por
>    estar fuera de toda región (lo mismo que pasó con el botón flotante en F3).
> 3. **La navegación en línea va desde `xl` (1280 px)**, como en el prototipo, no desde `lg`. Con la
>    cabecera nueva el contenido mide ~1200 px y a 1024 la página se desplazaba 173 px en horizontal.
>    Hay prueba nueva en 768, 1024, 1100, 1280 y 1366 px.
> 4. **El isotipo va en un círculo azul.** Es blanco con trazo fino, dibujado para el fondo azul, y
>    sobre crema desaparecía.
> 5. **Cabecera de fondo sólido**, sin el `backdrop-blur` del prototipo: un desenfoque en un elemento
>    fijo se recalcula en cada paso del scroll y la portada ya va justa de rendimiento.

Rama `feat/f3.1-t4-cascara`.

**Consume:** `.boton-cta`, `.boton-whatsapp`, `.sello`, tokens `aviso`, `primeraAperturaEscrita()`
de `src/lib/datos/horario.ts`, `unirConY()` de `src/lib/datos/pedido.ts`. **Produce:**
`textoDelAviso()` y `BarraAviso`.

- [ ] **Paso 1: la prueba que falla.** Crear `src/lib/datos/aviso.test.ts`:

```ts
import { describe, expect, it } from "vitest";

import { textoDelAviso } from "./aviso";

// La barra de aviso de arriba del todo. El prototipo decía "Horneamos desde las
// 4:00 AM · Envíos a todo Iquitos": aquí se arma con la hora y las zonas que
// hay en la base, para que no pueda contradecir al horario ni al reparto.

describe("textoDelAviso", () => {
  it("dice la hora de apertura y las zonas de reparto", () => {
    expect(textoDelAviso({ abreALas: "4:00 a. m.", zonas: "Iquitos, Belén y Punchana" })).toBe(
      "Abrimos a las 4:00 a. m. · Delivery a Iquitos, Belén y Punchana",
    );
  });

  it("sin zonas, solo la hora", () => {
    expect(textoDelAviso({ abreALas: "4:00 a. m.", zonas: "" })).toBe("Abrimos a las 4:00 a. m.");
  });

  it("sin horario, solo el reparto", () => {
    expect(textoDelAviso({ abreALas: null, zonas: "Iquitos" })).toBe("Delivery a Iquitos");
  });

  // Sin ningún dato no hay barra: una franja de color vacía o con un texto
  // genérico es peor que no tenerla.
  it("sin ningún dato, no hay aviso", () => {
    expect(textoDelAviso({ abreALas: null, zonas: "" })).toBeNull();
  });
});
```

- [ ] **Paso 2: comprobar que falla.**

```bash
pnpm test -- src/lib/datos/aviso.test.ts
```

Esperado: FAIL, «Cannot find module './aviso'».

- [ ] **Paso 3: la función.** Crear `src/lib/datos/aviso.ts`:

```ts
/**
 * El texto de la barra de aviso, a partir de datos reales.
 *
 * Sin dependencias a propósito: lo importa un componente de servidor, pero si
 * algún día lo usa uno de cliente no debe arrastrar Supabase ni `use cache`
 * (ver la trampa de `reloj.ts` en CLAUDE.md).
 */
export function textoDelAviso({
  abreALas,
  zonas,
}: {
  abreALas: string | null;
  zonas: string;
}): string | null {
  const partes = [
    abreALas ? `Abrimos a las ${abreALas}` : null,
    zonas ? `Delivery a ${zonas}` : null,
  ].filter((parte): parte is string => parte !== null);

  return partes.length > 0 ? partes.join(" · ") : null;
}
```

- [ ] **Paso 4: comprobar que pasa.**

```bash
pnpm test -- src/lib/datos/aviso.test.ts
```

- [ ] **Paso 5: el componente.** Crear `src/components/publico/barra-aviso.tsx`:

```tsx
import { Clock } from "lucide-react";

/**
 * Barra terracota de arriba del todo (prototipo de Stitch). Una línea en
 * escritorio; en el celular puede partirse en dos, y por eso el texto se
 * arma corto en `textoDelAviso`.
 */
export function BarraAviso({ texto }: { texto: string | null }) {
  if (!texto) return null;
  return (
    <div
      data-aviso
      className="bg-aviso text-aviso-foreground px-4 py-1.5 text-center text-xs font-semibold sm:text-[0.8125rem]"
    >
      <p className="mx-auto flex max-w-(--container-contenido) items-center justify-center gap-2">
        <Clock aria-hidden className="size-3.5 shrink-0" />
        <span>{texto}</span>
      </p>
    </div>
  );
}
```

En `src/components/publico/cascara-publica.tsx`, importar `BarraAviso`, `textoDelAviso`,
`primeraAperturaEscrita` (de `@/lib/datos/horario`) y `unirConY` (de `@/lib/datos/pedido`), y
justo después del enlace «Saltar al contenido» y antes de `<Cabecera>`:

```tsx
<BarraAviso
  texto={textoDelAviso({
    abreALas: primeraAperturaEscrita(config.horario_semanal),
    zonas: unirConY(config.delivery_zonas),
  })}
/>
```

- [ ] **Paso 6: la cabecera.** En `src/components/publico/cabecera.tsx`, siguiendo el `<header>` de
      `DOC/Maquetas/Stitch/portal.html`:
  - El `<header>` pasa de `bg-primary text-primary-foreground` a
    `bg-background/90 text-foreground border-b border-border backdrop-blur-md`, alto `h-20` en
    escritorio y `h-16` en celular.
  - Isotipo + nombre: el nombre en `font-heading text-primary text-2xl font-semibold`, y debajo, en
    escritorio (`hidden sm:block`), la línea `text-acento text-[0.6875rem] font-semibold
tracking-[0.08em] uppercase` con el texto «Panadería y pastelería · Iquitos».
  - Cada enlace de navegación de escritorio: `rounded-full px-4 min-h-tactil flex items-center
text-sm font-medium text-muted-foreground hover:text-primary`; el activo (`aria-current="page"`)
    añade `bg-primary text-primary-foreground`. Usar la variante de Tailwind
    `aria-[current=page]:bg-primary aria-[current=page]:text-primary-foreground` para no duplicar la
    lógica de `esSeccionActiva`.
  - El botón de pedir: `boton-whatsapp` con el icono `MessageCircle`, texto «Pedir por WhatsApp».
  - El botón de menú del celular: `text-primary`; el panel desplegable
    `bg-background border-t border-border`, los enlaces `min-h-tactil border-b border-border`, el
    horario en una `tarjeta p-4 mt-4`.
  - **Sin** «Panel interno» ni icono de usuario.

- [ ] **Paso 7: el botón flotante.** En `src/components/publico/boton-whatsapp.tsx`, en el `<a>`,
      cambiar `boton-cta` por `boton-whatsapp` y `shadow-lg shadow-black/20` por `shadow-flotante`.
      No tocar la lógica de apartarse.

- [ ] **Paso 8: el pie.** En `src/components/publico/pie.tsx`, siguiendo el `<footer>` del prototipo:
  - Fondo `bg-muted text-foreground` en lugar de azul; cuatro columnas en `lg:grid-cols-4`, dos en
    `sm`, una en celular.
  - Columna 1: isotipo + nombre comercial + eslogan (de `config`).
  - Columna 2: «Horario de atención» con `<Horario config={config} />` (variante clara, no
    `"oscuro"`).
  - Columna 3: «Dónde estamos» con `direccionCompleta(config)` y el enlace a `/ubicacion`.
  - Columna 4: la `<nav aria-label="Secciones del sitio, en el pie">` que ya existe.
  - Titulares de columna: `font-heading text-primary text-xl`.
  - Franja inferior: `tarjeta mt-10 px-6 py-4 flex flex-wrap justify-between gap-4 text-sm` con
    `© {anio} {config.razon_social}` y las redes si están cargadas. **Sin** «Libro de reclamaciones»
    ni «Términos de envío»: no existen esas páginas.
  - Conservar el `pb-*` que reserva sitio al botón flotante (trampa de `CLAUDE.md`).

- [ ] **Paso 9: prueba de la barra.** Añadir a `e2e/cabecera.spec.ts`:

```ts
test("la barra de aviso dice la hora y las zonas que hay en la base", async ({ page }) => {
  await page.goto("/");
  const aviso = page.locator("[data-aviso]");
  await expect(aviso).toBeVisible();
  // Las cuatro zonas confirmadas el 11/09 y la apertura del horario cargado.
  await expect(aviso).toContainText("4:00 a. m.");
  await expect(aviso).toContainText("Belén");
  // Lo que decía el prototipo, y es falso, no puede aparecer.
  await expect(page.getByText("Putumayo")).toHaveCount(0);
});
```

- [ ] **Paso 10: comprobar y PR.**

```bash
pnpm typecheck && pnpm lint && pnpm test
pnpm exec playwright test e2e/cabecera.spec.ts e2e/flotante.spec.ts e2e/tactil.spec.ts e2e/accesibilidad.spec.ts e2e/secciones.spec.ts
git add -A && git commit -m "feat(diseño): barra de aviso con datos reales, cabecera clara y pie en cuatro columnas"
```

Mirar a 375 px que la barra no pase de dos líneas y que el menú abierto se lea entero.

---

## Tarea 5 — Portada: hero, franja y bloque de nosotros

> **Correcciones a este plan, descubiertas al ejecutar la tarea (14/09/2026):**
>
> 1. **El velo no puede ser un degradado solo en porcentajes.** El texto va en un contenedor
>    centrado de ancho fijo: termina en el 50 % desde 1248 px, pero en el 59 % a 1024 y en el 78 % a
>    768, dentro de la zona que ya se desvanece. La zona opaca llega a `max(50% + 1rem, 40rem)`, en
>    la clase `.velo-hero` de `globals.css`, y una prueba mide con una sonda el CSS real en cuatro
>    anchos. La primera versión de esa prueba recalculaba la fórmula en JavaScript y pasaba con un
>    velo roto: se vio y se corrigió.
> 2. **Las flechas del carrusel van abajo a la derecha**, como en el prototipo. Centradas en los
>    bordes tapaban el comienzo del texto a 768 y 1024 px; la misma prueba lo vigila.
> 3. **El titular de la madrugada no pasa a `TituloSeccion`**: su tamaño (5xl en escritorio) está
>    medido para equilibrar la ilustración, y `TituloSeccion` lo encogería. Solo cambian color y peso.
> 4. `cabecera.spec.ts` buscaba el titular exacto «Veintidós años en el barrio», que caducaba el 1 de
>    enero; ahora busca la forma (`/años en el barrio/`).

Rama `feat/f3.1-t5-portada-hero`.

**Consume:** `TituloSeccion`, `.sello`, `.tarjeta`, `--velo-hero`, `anosDeOficio()`,
`primeraAperturaEscrita()`. **Produce:** nada que usen otras tareas.

Referencia: `<section id="inicio">` y `<section id="nosotros">` de `portal.html`.

- [ ] **Paso 1: la prueba que falla.** Añadir a `e2e/portada.spec.ts`:

```ts
test("el hero de escritorio pone el titular sobre el velo crema, en azul", async ({
  page,
  isMobile,
}) => {
  test.skip(isMobile, "El hero con carrusel es de escritorio.");
  await page.goto("/");

  const titular = page.locator('[aria-roledescription="diapositiva"][aria-label="1 de 3"] h2');
  await expect(titular).toBeVisible();
  // El azul institucional, no el crema de antes sobre degradado oscuro.
  await expect(titular).toHaveCSS("color", "rgb(18, 48, 110)");
});

test("el bloque de nosotros dice el año de apertura, no una cuenta de años", async ({ page }) => {
  await page.goto("/");
  const sello = page.getByText(/^Desde \d{4}$/).first();
  await expect(sello).toBeVisible();
  await expect(page.getByText(/\d+\+?\s*años horneando/i)).toHaveCount(0);
});
```

- [ ] **Paso 2: comprobar que falla.**

```bash
pnpm exec playwright test e2e/portada.spec.ts -g "velo crema|año de apertura"
```

Esperado: FAIL en los dos.

- [ ] **Paso 3: el hero de escritorio.** El maquetado de la diapositiva vive dentro de
      `src/components/publico/carrusel-portada.tsx`. Sustituir el degradado `bg-linear-to-t from-[#231a14]/85 via-[#231a14]/55 to-[#231a14]/10` por un velo
      lateral crema:

```tsx
{
  /* Velo crema desde la izquierda (prototipo de Stitch). Su opacidad mínima
    la fija el contraste del titular en el peor caso —un píxel negro debajo—
    y la vigila src/estilos/paleta.test.ts: no bajar de var(--velo-hero). */
}
<div
  className="absolute inset-0"
  style={{
    background:
      "linear-gradient(to right, rgb(255 249 238 / var(--velo-hero)) 0%, rgb(255 249 238 / var(--velo-hero)) 48%, rgb(255 249 238 / 0) 72%)",
  }}
/>;
```

Y el bloque de texto: contenedor `max-w-xl` alineado a la izquierda y centrado en vertical
(`items-center` en lugar de `items-end`, sin `pb-14`); titular
`font-heading text-primary text-5xl leading-[1.1] font-bold tracking-[-0.02em] text-balance`;
subtítulo `text-muted-foreground mt-4 text-lg`; botón `boton-cta mt-8`. Sustituir los colores
`text-[#fdf9f3]` por los tokens. Los puntos del carrusel pasan a `bg-primary` (activo) y
`bg-primary/30`, en una píldora `bg-background/80 rounded-full px-2`, **manteniendo** cada punto en
`size-tactil`. Las flechas: `size-tactil rounded-full bg-background text-primary shadow-suave`.

El rango de altura del `aspect-[21/9]` se queda. `fetchPriority`, `sizes` y `enfoque` no se tocan.

- [ ] **Paso 4: el hero del celular.** En `src/components/publico/portada-movil.tsx`, siguiendo
      `portal-movil.webp`: la foto se queda arriba y **sin** carrusel; el bloque de debajo pasa de
      `bg-primary` a `bg-background`, con el nombre en `font-heading text-primary text-4xl
font-bold`, el eslogan en `text-muted-foreground`, `EstadoAhora` sin `variante` (su valor por
      defecto ya es `"claro"`) y los dos botones: `boton-whatsapp w-full` («Pedir por WhatsApp») y
      `boton-linea w-full` («Ver los precios»). Retirar `boton-linea--sobre-azul`.

- [ ] **Paso 5: la franja.** En `src/app/(public)/page.tsx`, la `<section aria-label="Por qué
comprar aquí">` ya usa `bg-franja text-franja-foreground`, que ahora es durazno. Los iconos se
      quedan en `text-franja-foreground`: pasarlos a `text-acento` sería marrón sobre durazno, que
      da 3.92 y no llega a AA. Compactar a una sola fila en escritorio: `py-4`, título y detalle en
      línea (`flex items-center gap-2 text-sm`), como la franja del prototipo. En el celular, los tres
      apilados con `py-6`.

- [ ] **Paso 6: el bloque de nosotros.** Sustituir la sección «5. La historia» por la composición de
      `<section id="nosotros">` del prototipo, con datos reales:

```tsx
{
  config.historia ? (
    <section
      aria-labelledby="titulo-historia"
      className="mx-auto mt-20 grid max-w-(--container-contenido) items-center gap-10 px-4 sm:px-6 lg:grid-cols-2 lg:gap-16"
    >
      {fachada?.imagen ? (
        <div className="relative">
          <div className="acercarse shadow-elevada relative aspect-[4/5] overflow-hidden rounded-2xl sm:aspect-[4/3]">
            <Image
              src={fachada.imagen}
              alt={fachada.alt}
              fill
              sizes="(max-width: 1024px) 100vw, 45vw"
              className="object-cover"
            />
          </div>
          {/* El sello flotante del prototipo decía "24+ Años": aquí dice el año,
            que no caduca (ver migraciones 0024 y 0025). */}
          {config.anio_fundacion > 0 ? (
            <div className="tarjeta shadow-elevada absolute right-4 -bottom-6 flex flex-col items-center px-6 py-4 text-center sm:right-8">
              <p className="font-heading text-primary text-3xl font-bold">
                Desde {config.anio_fundacion}
              </p>
              <p className="text-acento mt-1 text-[0.6875rem] font-bold tracking-[0.08em] uppercase">
                En el mismo barrio
              </p>
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="aparece-lateral">
        <TituloSeccion
          id="titulo-historia"
          sello="Nuestra historia"
          titulo={anos ? `${enLetra(anos)} años en el barrio` : "Toda una vida en el barrio"}
          entradilla={config.historia.split("\n\n")[0]}
        />
        {config.valores.length > 0 ? (
          <ul className="aparece-grupo mt-8 grid gap-3 sm:grid-cols-2">
            {config.valores.slice(0, 4).map((valor, indice) => (
              <li
                key={valor.nombre}
                className="tarjeta bg-muted p-4"
                style={{ "--i": indice } as CSSProperties}
              >
                <p className="font-heading text-primary text-lg font-semibold">{valor.nombre}</p>
                <p className="text-muted-foreground mt-1 text-sm text-pretty">
                  {valor.descripcion}
                </p>
              </li>
            ))}
          </ul>
        ) : null}
        <Link href="/nosotros" className="boton-linea mt-8">
          Conocer la panadería
          <ArrowRight aria-hidden className="size-4" />
        </Link>
      </div>
    </section>
  ) : null;
}
```

`config.valores` sigue el esquema `VALOR` de `src/lib/datos/configuracion.ts`: `{ nombre,
  descripcion }`, las dos cadenas.

**Ojo:** el sello «Desde {año}» y la franja «Desde {año}» dicen lo mismo. En la franja, cambiar el
título a «En el barrio» y dejar la fecha solo en el sello flotante.

- [ ] **Paso 7: el bloque de la madrugada.** El de la ilustración del horno se queda (es de F3 y
      encaja con el prototipo): solo cambiar su titular a `TituloSeccion` sin sello.

- [ ] **Paso 8: el bloque de delivery.** Sigue siendo `bg-primary` (el prototipo usa una tarjeta azul
      invertida en «combos»): radio `rounded-2xl`, botón `boton-whatsapp`, y los datos del
      `condicionesDelPedido` en `font-heading text-2xl` sobre `border-primary-foreground/25`.

- [ ] **Paso 9: comprobar y PR.**

```bash
pnpm typecheck && pnpm lint
pnpm exec playwright test e2e/portada.spec.ts e2e/portada-movil.spec.ts e2e/marca.spec.ts e2e/cabecera.spec.ts e2e/movimiento.spec.ts e2e/accesibilidad.spec.ts e2e/tactil.spec.ts
git add -A && git commit -m "feat(portada): hero con velo crema, franja durazno y bloque de nosotros del prototipo"
```

`e2e/marca.spec.ts` busca «Desde 2004» en la región «Por qué comprar aquí»: con el cambio del paso 6
hay que moverla a buscar el sello. Actualizar esa aserción, no borrarla.

---

## Tarea 6 — Productos en híbrido

Rama `feat/f3.1-t6-productos`.

> **Correcciones a este plan, descubiertas al ejecutar la tarea (14/09/2026):**
>
> 1. **Hoy solo un destacado tiene foto** (Pan francés chico). Con la rejilla de cuatro del paso 6,
>    la tarjeta quedaba sola y con tres cuartos de fila vacíos, que se lee como contenido que no
>    cargó. **Con una o dos tarjetas van al lado de la pizarra** (`lg:grid-cols-[20rem_1fr]`); desde
>    tres, la fila del prototipo encima.
> 2. **«El pan del día empieza en S/ 0.10» estaba escrito a mano** en la entradilla. Sale ahora del
>    catálogo (el menor `precioDesde`) y dice «desde», no «el pan»: lo más barato no tiene por qué
>    ser pan. Lo mismo que «Ver los N precios», que el plan ya pedía calcular.
> 3. **El botón de la tarjeta lleva el nombre del producto oculto detrás del texto visible**
>    («Pedir por WhatsApp: Pan francés chico»). Con varias tarjetas, el mismo nombre repetido no dice
>    cuál. No va en `aria-label`: el nombre accesible tiene que empezar por lo que se ve (WCAG 2.5.3).
>    Y el mensaje de WhatsApp lleva el producto, no el genérico.
> 4. **Los puntos guía necesitan un token de capa 3** (`--guia-puntos`, utilidad `border-guia`): la
>    clase del paso 7 usaba `--pimpos-dorado-500` directamente, y ningún componente usa la capa 1.
> 5. **`CondicionesPedido` dentro de una tarjeta pintaba dos líneas** arriba y abajo (el borde de la
>    tarjeta y el de la lista). Tiene una prop `enmarcada` que pone la tarjeta y quita el borde propio;
>    contacto no cambia hasta la tarea 8.
> 6. **También se tocaron** los títulos de categoría del catálogo (al azul) y su esqueleto de carga,
>    que conservaba la forma de la rejilla de tarjetas retirada el 11/09 y hacía saltar la página.
> 7. **La prueba del paso 9 no miraba que un producto no saliera dos veces.** Ahora exige que lo que va
>    en tarjeta no se repita en la pizarra, y se vio fallar rompiendo `repartirPorFoto` a propósito.

**Consume:** `.tarjeta`, `.tarjeta--elevable`, `.sello`, `.boton-cta`, `TituloSeccion`,
`enlaceWhatsApp()`, `mensajeDePedido()`. **Produce:** `repartirPorFoto()` y `TarjetaProducto`.

- [ ] **Paso 1: la prueba que falla.** Crear `src/lib/datos/destacados.test.ts`:

```ts
import { describe, expect, it } from "vitest";

import type { ProductoPublico } from "./catalogo";
import { repartirPorFoto } from "./destacados";

function producto(nombre: string, imagen: string | null): ProductoPublico {
  return {
    id: nombre,
    nombre,
    slug: nombre.toLowerCase(),
    descripcion: null,
    destacado: true,
    categoriaNombre: null,
    categoriaSlug: null,
    precioDesde: 0.1,
    precioHasta: 0.1,
    variantes: 1,
    varianteNombre: null,
    varianteUnidad: null,
    imagen,
    imagenAlt: null,
    presentaciones: [],
  };
}

// Decisión de Dan (13/09/2026): en la portada, tarjeta con foto solo para los
// productos que la tienen. 32 de 34 no tienen: en tarjetas salían 32 cajas
// iguales, que es lo que originó la pizarra el 11/09.

describe("repartirPorFoto", () => {
  it("separa los que tienen foto de los que no, sin cambiar el orden", () => {
    const { conFoto, sinFoto } = repartirPorFoto([
      producto("Leche", "leche.webp"),
      producto("Francés", null),
      producto("Chancay", "chancay.webp"),
    ]);
    expect(conFoto.map((p) => p.nombre)).toEqual(["Leche", "Chancay"]);
    expect(sinFoto.map((p) => p.nombre)).toEqual(["Francés"]);
  });

  it("una cadena vacía no cuenta como foto", () => {
    const { conFoto } = repartirPorFoto([producto("Leche", "")]);
    expect(conFoto).toEqual([]);
  });

  it("limita las tarjetas a cuatro, que es una fila en escritorio", () => {
    const muchos = ["a", "b", "c", "d", "e"].map((n) => producto(n, `${n}.webp`));
    expect(repartirPorFoto(muchos).conFoto).toHaveLength(4);
  });
});
```

- [ ] **Paso 2: comprobar que falla.**

```bash
pnpm test -- src/lib/datos/destacados.test.ts
```

- [ ] **Paso 3: la función.** Crear `src/lib/datos/destacados.ts`:

```ts
import type { ProductoPublico } from "./catalogo";

/** Una fila de tarjetas en escritorio. */
const MAXIMO_TARJETAS = 4;

/**
 * Reparte los destacados de la portada: los que tienen foto real van en
 * tarjeta; el resto, en la pizarra. Decisión de Dan (13/09/2026) sobre el
 * prototipo de Stitch, que ponía todos en tarjeta.
 *
 * Cuando el negocio suba fotos desde el panel (F4), las tarjetas crecen solas.
 */
export function repartirPorFoto(productos: readonly ProductoPublico[]): {
  conFoto: ProductoPublico[];
  sinFoto: ProductoPublico[];
} {
  const conFoto = productos.filter((p) => Boolean(p.imagen)).slice(0, MAXIMO_TARJETAS);
  const enTarjeta = new Set(conFoto.map((p) => p.id));
  return { conFoto, sinFoto: productos.filter((p) => !enTarjeta.has(p.id)) };
}
```

- [ ] **Paso 4: comprobar que pasa**, con el mismo comando del paso 2.

- [ ] **Paso 5: la tarjeta.** Crear `src/components/publico/tarjeta-producto.tsx`, siguiendo la
      tarjeta de `<section id="productos">` del prototipo:

```tsx
import Image from "next/image";
import Link from "next/link";
import { MessageCircle } from "lucide-react";

import { describirPrecio, type ProductoPublico } from "@/lib/datos/catalogo";

/**
 * Tarjeta de producto del prototipo, SOLO para productos con foto real (ver
 * `repartirPorFoto`). Sin foto no se usa: una caja vacía por producto es lo
 * que se retiró el 11/09.
 */
export function TarjetaProducto({
  producto,
  whatsapp,
}: {
  producto: ProductoPublico & { imagen: string };
  whatsapp: string | null;
}) {
  return (
    <article className="tarjeta tarjeta--elevable flex h-full flex-col p-4">
      <Link href={`/productos/${producto.slug}`} className="group block">
        <div className="bg-muted relative aspect-[4/3] overflow-hidden rounded-xl">
          <Image
            src={producto.imagen}
            alt={producto.imagenAlt ?? producto.nombre}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
          {producto.categoriaNombre ? (
            <span className="sello absolute top-3 left-3">{producto.categoriaNombre}</span>
          ) : null}
        </div>
        <div className="mt-4 flex items-baseline justify-between gap-3">
          <h3 className="font-heading text-primary text-lg leading-tight font-semibold">
            {producto.nombre}
          </h3>
          {describirPrecio(producto) ? (
            <p className="font-heading text-precio shrink-0 text-lg font-semibold tabular-nums">
              {describirPrecio(producto)}
            </p>
          ) : null}
        </div>
      </Link>
      {producto.descripcion ? (
        <p className="text-muted-foreground mt-2 line-clamp-2 text-sm text-pretty">
          {producto.descripcion}
        </p>
      ) : null}
      {whatsapp ? (
        // `mt-auto` en un contenedor y no en el botón: así el botón queda al
        // pie de la tarjeta aunque las descripciones midan distinto.
        <div className="mt-auto pt-4">
          <a href={whatsapp} target="_blank" rel="noopener noreferrer" className="boton-cta w-full">
            <MessageCircle aria-hidden className="size-4" />
            Pedir por WhatsApp
          </a>
        </div>
      ) : null}
    </article>
  );
}
```

El precio sale de `describirPrecio()`, la misma función que usa hoy la pizarra: da «S/ 0.10» o
«Desde S/ 0.30» si hay varias presentaciones. El enlace de WhatsApp se construye en la página con
`enlaceWhatsApp(config, mensajeDePedido(producto))`.

- [ ] **Paso 6: la portada.** En `src/app/(public)/page.tsx`, en «3. Lo que vende»:

```tsx
const { conFoto, sinFoto } = repartirPorFoto(destacados);
```

Si `conFoto.length > 0`: una rejilla `aparece-grupo grid gap-6 sm:grid-cols-2 lg:grid-cols-4` de
`TarjetaProducto`, y debajo `PizarraPrecios productos={sinFoto}`. Si no hay ninguno con foto, solo
la pizarra, como hoy. El titular con `TituloSeccion` (sello «Del horno a tu mesa») y el enlace
«Ver los 34 precios» como `boton-linea`, con el número calculado de `productos.length`, no escrito.

- [ ] **Paso 7: la pizarra y el filtro.** En `pizarra-precios.tsx`: cada fila en `border-b
border-border py-3`, nombre en `font-heading text-primary`, puntos guía
      `border-dotted border-[color-mix(in_srgb,var(--pimpos-dorado-500)_35%,transparent)]` (las
      líneas punteadas del prototipo), precio `font-heading text-precio`. En
      `filtro-categorias.tsx`: contenedor `tarjeta bg-muted inline-flex flex-wrap gap-1 p-1.5
rounded-full`; cada categoría `rounded-full px-4 min-h-tactil text-sm`, la activa
      `bg-primary text-primary-foreground`. Mantener el `aria-current` que ya usa.

- [ ] **Paso 8: la ficha de producto.** En `src/app/(public)/productos/[slug]/page.tsx`: la foto en
      `rounded-2xl shadow-elevada`, el nombre con `font-heading text-primary text-4xl font-bold`, el
      precio `font-heading text-precio text-3xl`, el botón `boton-whatsapp`, y
      `CondicionesPedido` dentro de una `tarjeta p-6`.

- [ ] **Paso 9: la prueba del híbrido.** Añadir a `e2e/pizarra.spec.ts`:

```ts
test("en la portada, tarjeta solo para los productos con foto", async ({ page }) => {
  await page.goto("/");
  const seccion = page.locator("section").filter({
    has: page.getByRole("heading", { name: "Lo que horneamos hoy" }),
  });
  const tarjetas = seccion.locator("article.tarjeta");

  // Cada tarjeta lleva una imagen: una tarjeta sin foto es justo lo que no se
  // quiere. Y los productos sin foto siguen en la pizarra de debajo.
  const cuantas = await tarjetas.count();
  for (let i = 0; i < cuantas; i++) {
    await expect(tarjetas.nth(i).locator("img")).toHaveCount(1);
  }
  await expect(seccion.getByText("S/", { exact: false }).first()).toBeVisible();
});
```

- [ ] **Paso 10: comprobar y PR.**

```bash
pnpm typecheck && pnpm lint && pnpm test
pnpm exec playwright test e2e/pizarra.spec.ts e2e/pedido.spec.ts e2e/presentaciones.spec.ts e2e/secciones.spec.ts e2e/presupuesto.spec.ts e2e/accesibilidad.spec.ts e2e/tactil.spec.ts
git add -A && git commit -m "feat(catalogo): tarjetas con foto en la portada y pizarra reestilizada"
```

`presupuesto.spec.ts` incluye «la portada no se baja la misma foto dos veces»: con las tarjetas
nuevas tiene que seguir en verde. Si falla, es que una tarjeta y la pizarra piden la misma foto con
`sizes` distintos; igualarlos.

---

## Tarea 7 — Novedades y galería

Rama `feat/f3.1-t7-novedades-galeria`.

> **Correcciones a este plan, descubiertas al ejecutar la tarea (14/09/2026):**
>
> 1. **El pie de foto del paso 3 llevaba colores escritos** (`from-[#1e1b14]/80`,
>    `text-[#fff9ee]`), y ningún componente usa la capa 1. Van por tokens de capa 3,
>    `--pie-foto-fondo` y `--pie-foto-texto` (utilidades `from-pie-foto/80` y
>    `text-pie-foto-foreground`); el peor caso de contraste está en `paleta.test.ts`.
> 2. **El mosaico solo con tres fotos o más.** Dos de los cuatro grupos de la semilla tienen dos
>    fotos, y con la primera en `col-span-2 row-span-2` la otra quedaba arriba a su lado y debajo
>    un hueco del tamaño de una foto. Con dos van a la par. La grande no lleva `aspect-[4/3]` desde
>    `md`: ocupa el alto de las dos de al lado (`h-full`), y con el mismo aspecto no coincidían.
> 3. **La novedad destacada solo si hay más de una**: invertir en azul la única que hay no destaca
>    nada.
> 4. **Las iniciales del testimonio son una función con prueba** (`src/lib/utilidades/iniciales.ts`):
>    primer y último nombre, por letras y no por carácter, para que «C. Ríos» no dé «C.».
> 5. **En local no hay novedades ni testimonios publicables**, así que los pasos 4 y 5 no se veían.
>    Se cargaron filas de muestra solo para las capturas, axe y área táctil, y se borraron antes de
>    la suite completa. Y no bastaba con cargarlas: ver la trampa de `.next/cache/fetch-cache` en
>    `CLAUDE.md`.

**Consume:** `.tarjeta`, `.tarjeta--elevable`, `.sello`, `TituloSeccion`. **Produce:** nada.

Referencia: `<section id="novedades">` y `<section id="galeria">` del prototipo.

- [ ] **Paso 1: la prueba que falla.** Añadir a `e2e/secciones.spec.ts`:

```ts
test("la galería pone el título real de cada foto como pie", async ({ page }) => {
  await page.goto("/galeria");
  const pies = page.locator("figure figcaption");
  await expect(pies.first()).toBeVisible();
  // Los pies del prototipo ("4:15 AM · El primer encendido") son inventados.
  await expect(page.getByText("primer encendido")).toHaveCount(0);
});
```

- [ ] **Paso 2: comprobar que falla** (hoy la galería no usa `figcaption`).

```bash
pnpm exec playwright test e2e/secciones.spec.ts -g "pie"
```

- [ ] **Paso 3: la galería.** En `src/app/(public)/galeria/page.tsx`, cada foto pasa a:

```tsx
<figure className="tarjeta--elevable group relative overflow-hidden rounded-2xl">
  <div className="relative aspect-[4/3]">
    <Image
      src={foto.imagen}
      alt={foto.alt}
      fill
      sizes="(max-width: 768px) 100vw, 33vw"
      className="object-cover"
    />
  </div>
  {foto.titulo ? (
    <figcaption className="absolute inset-x-0 bottom-0 bg-linear-to-t from-[#1e1b14]/80 to-transparent px-4 pt-10 pb-3 text-sm font-semibold text-[#fff9ee]">
      {foto.titulo}
    </figcaption>
  ) : null}
</figure>
```

y la rejilla de cada grupo, el mosaico del prototipo: `grid gap-4 md:grid-cols-3`, con el primer
elemento de cada grupo en `md:col-span-2 md:row-span-2` y `aspect-[4/3]` en todos. El pie aguanta
el peor caso: crema sobre tinta al 80 % encima de un píxel blanco da 8.59, y el texto va siempre
dentro de la zona del degradado (`pt-10`). Añadir esa pareja a `PAREJAS` en
`src/estilos/paleta.test.ts`:

```ts
["pie de foto de la galería, peor caso", () => primitivo("crema-50"), () => mezclar(primitivo("tinta-900"), "#ffffff", 0.8), TEXTO],
```

- [ ] **Paso 4: novedades.** En `src/app/(public)/novedades/page.tsx`, cada tarjeta:
      `tarjeta tarjeta--elevable overflow-hidden`; el tipo (`NOMBRE_TIPO`) como `.sello`; el título
      `font-heading text-primary text-2xl`. La **primera** novedad de la lista, en escritorio,
      invertida como la tarjeta central de «combos» del prototipo: `bg-primary
text-primary-foreground` y su título en `text-primary-foreground`. Sin precios tachados ni
      listas de contenido: la tabla no los tiene.

  En la portada («6. Novedades vigentes») aplicar las mismas clases de tarjeta.

- [ ] **Paso 5: testimonios.** En la portada («7. Testimonios»), cada uno en `tarjeta bg-muted p-6`,
      el texto en cursiva `italic text-foreground`, y abajo, separado por `border-t border-border
pt-4`, un círculo `size-10 rounded-full bg-franja text-franja-foreground font-semibold` con las
      iniciales de `testimonio.nombre` y el nombre + `procedencia`. **Sin estrellas**: la tabla no
      guarda puntuación. El bloque sigue sin mostrarse si no hay testimonios reales.

- [ ] **Paso 6: comprobar y PR.**

```bash
pnpm typecheck && pnpm lint
pnpm exec playwright test e2e/secciones.spec.ts e2e/testimonios.spec.ts e2e/accesibilidad.spec.ts e2e/tactil.spec.ts
git add -A && git commit -m "feat(diseño): galería en mosaico con pies reales y tarjetas de novedades"
```

---

## Tarea 8 — Contacto con «Arma tu pedido», ubicación, nosotros y preguntas

Rama `feat/f3.1-t8-contacto`.

> **Correcciones a este plan, descubiertas al ejecutar la tarea (14/09/2026):**
>
> 1. **`mensajeArmado` no puede ir en `pedido.ts`.** El formulario es de cliente, y `pedido.ts`
>    importa `catalogo.ts`, que trae Supabase y funciones `use cache`: es exactamente la trampa de
>    `reloj.ts`. Va en **`src/lib/datos/pedido-armado.ts`**, sin dependencias, con su prueba.
> 2. **La zona no viene elegida de antemano.** Con la primera marcada, quien no la toca pide «a
>    Iquitos» sin haberlo decidido. Hay una opción vacía, «Elige tu zona», y el mensaje la omite.
> 3. **El aviso de que falta el pedido y el botón viven en una región `aria-live`**: el botón aparece
>    al escribir, y quien no lo ve tiene que enterarse. Los `placeholder` llevan
>    `text-muted-foreground`, que tiene contraste medido.
> 4. **Contacto conserva las condiciones del delivery**, debajo del formulario y en su tarjeta: la
>    duda de cuánto cuesta el envío aparece justo antes de enviar.
> 5. **Nosotros sigue usando `EncabezadoSeccion`** y no `TituloSeccion nivel={1}`: con los dos habría
>    dos `h1`. `TituloSeccion` va en «Cómo trabajamos», y en ubicación los dos bloques son tarjetas
>    con un titular pequeño: con `TituloSeccion` competían con el de la página.
> 6. **Ubicación llevaba las zonas de reparto escritas a mano.** Salen de `delivery_zonas`.
> 7. **Al pasar el encabezado a crema, la variante `sobre-azul` de `EnlaceWhatsApp` quedó sin uso** y
>    se retiró. Y la prueba de `movimiento.spec.ts` que buscaba `a.boton-cta` en contacto busca ahora
>    el botón por su nombre: el de contacto es el verde de WhatsApp.
> 8. **En preguntas, el contorno de foco va en la tarjeta con `has-[summary:focus-visible]`**, no con
>    `focus-within`: `focus-within` lo dibujaba también al abrir una pregunta con el ratón.

**Consume:** `.tarjeta`, `.sello`, `.boton-whatsapp`, `TituloSeccion`, `enlaceWhatsApp()`.
**Produce:** `mensajeArmado()` y `ArmaTuPedido`.

- [ ] **Paso 1: la prueba que falla.** Añadir a `src/lib/datos/pedido.test.ts`:

```ts
import { mensajeArmado } from "./pedido";

describe("mensajeArmado", () => {
  it("compone el pedido con los datos que dio el cliente", () => {
    expect(
      mensajeArmado({
        nombre: "Mariana",
        zona: "Belén",
        hora: "7:00 a. m.",
        productos: "10 panes franceses",
      }),
    ).toBe(
      "Hola, quiero hacer un pedido.\n\nNombre: Mariana\nZona: Belén\nHora de entrega: 7:00 a. m.\n\nPedido:\n10 panes franceses",
    );
  });

  // Solo el pedido es obligatorio: lo demás se omite si viene vacío, en vez de
  // mandar "Nombre: " sin nada detrás.
  it("omite lo que viene vacío", () => {
    expect(mensajeArmado({ nombre: "  ", zona: "", hora: "", productos: "2 empanadas" })).toBe(
      "Hola, quiero hacer un pedido.\n\nPedido:\n2 empanadas",
    );
  });

  it("sin pedido no hay mensaje", () => {
    expect(
      mensajeArmado({ nombre: "Mariana", zona: "Belén", hora: "", productos: "   " }),
    ).toBeNull();
  });
});
```

- [ ] **Paso 2: comprobar que falla.**

```bash
pnpm test -- src/lib/datos/pedido.test.ts
```

- [ ] **Paso 3: la función.** Añadir al final de `src/lib/datos/pedido.ts`:

```ts
export type PedidoArmado = { nombre: string; zona: string; hora: string; productos: string };

/**
 * El mensaje de "Arma tu pedido" (prototipo de Stitch).
 *
 * No choca con la decisión de F3 de no poner formulario de contacto: aquella
 * era porque nadie vigila un buzón. Este no manda nada a ningún sitio ni guarda
 * datos: arma el texto y abre WhatsApp, que es por donde el negocio ya pide.
 */
export function mensajeArmado(pedido: PedidoArmado): string | null {
  const productos = pedido.productos.trim();
  if (!productos) return null;

  const datos = [
    ["Nombre", pedido.nombre],
    ["Zona", pedido.zona],
    ["Hora de entrega", pedido.hora],
  ]
    .map(([etiqueta, valor]) => [etiqueta, valor.trim()])
    .filter(([, valor]) => valor.length > 0)
    .map(([etiqueta, valor]) => `${etiqueta}: ${valor}`);

  return [
    "Hola, quiero hacer un pedido.",
    ...(datos.length > 0 ? [datos.join("\n")] : []),
    `Pedido:\n${productos}`,
  ].join("\n\n");
}
```

- [ ] **Paso 4: comprobar que pasa.**

- [ ] **Paso 5: el formulario.** Crear `src/components/publico/arma-tu-pedido.tsx`:

```tsx
"use client";

import { useState } from "react";
import { MessageCircle } from "lucide-react";

import { mensajeArmado } from "@/lib/datos/pedido";

/**
 * "Arma tu pedido" (prototipo de Stitch). Compone el mensaje y abre WhatsApp:
 * no envía nada a un servidor ni guarda datos personales.
 *
 * Recibe el número ya validado y las zonas de la base; nunca importa
 * `configuracion.ts`, que arrastraría Supabase al navegador (CLAUDE.md).
 */
export function ArmaTuPedido({ numero, zonas }: { numero: string; zonas: readonly string[] }) {
  const [pedido, setPedido] = useState({
    nombre: "",
    zona: zonas[0] ?? "",
    hora: "",
    productos: "",
  });
  const mensaje = mensajeArmado(pedido);
  const enlace = mensaje ? `https://wa.me/${numero}?text=${encodeURIComponent(mensaje)}` : null;

  const campo =
    "bg-card border-input focus-visible:border-primary focus-visible:ring-primary/15 min-h-12 w-full rounded-[10px] border-[1.5px] px-4 text-base outline-none focus-visible:ring-[3px]";
  const etiqueta = "text-foreground mb-1.5 block text-xs font-bold tracking-[0.06em] uppercase";

  return (
    <form className="tarjeta p-6 sm:p-8" onSubmit={(evento) => evento.preventDefault()}>
      <p className="sello">Pedido rápido</p>
      <h2 className="font-heading text-primary mt-3 text-2xl font-semibold">Arma tu pedido</h2>
      <p className="text-muted-foreground mt-2 text-sm">
        Escribe lo que quieres y te abrimos WhatsApp con el mensaje listo. No se guarda nada.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <label className="sm:col-span-2">
          <span className={etiqueta}>Tu nombre</span>
          <input
            className={campo}
            autoComplete="name"
            value={pedido.nombre}
            onChange={(e) => setPedido({ ...pedido, nombre: e.target.value })}
          />
        </label>
        <label>
          <span className={etiqueta}>Zona</span>
          <select
            className={campo}
            value={pedido.zona}
            onChange={(e) => setPedido({ ...pedido, zona: e.target.value })}
          >
            {zonas.map((zona) => (
              <option key={zona}>{zona}</option>
            ))}
          </select>
        </label>
        <label>
          <span className={etiqueta}>Hora de entrega</span>
          <input
            className={campo}
            placeholder="Lo antes posible"
            value={pedido.hora}
            onChange={(e) => setPedido({ ...pedido, hora: e.target.value })}
          />
        </label>
        <label className="sm:col-span-2">
          <span className={etiqueta}>¿Qué quieres pedir?</span>
          <textarea
            className={`${campo} min-h-24 py-3`}
            required
            value={pedido.productos}
            onChange={(e) => setPedido({ ...pedido, productos: e.target.value })}
          />
        </label>
      </div>

      {enlace ? (
        <a
          href={enlace}
          target="_blank"
          rel="noopener noreferrer"
          className="boton-whatsapp mt-6 w-full"
        >
          <MessageCircle aria-hidden className="size-5" />
          Enviar el pedido por WhatsApp
        </a>
      ) : (
        <p className="text-muted-foreground mt-6 text-center text-sm">
          Escribe qué quieres pedir para poder enviarlo.
        </p>
      )}
    </form>
  );
}
```

La página le pasa `numero={config.whatsapp.replace(/\D/g, "")}`, que es exactamente lo que hace
`enlaceWhatsApp()` en `configuracion.ts`, y solo monta el formulario si ese número no está vacío.
El componente no puede importar `enlaceWhatsApp` porque vive en `configuracion.ts`.

- [ ] **Paso 6: contacto.** En `src/app/(public)/contacto/page.tsx`, rejilla de dos columnas del
      prototipo (`<section id="contacto-ubicacion">`): a la izquierda la `tarjeta p-6` con un bloque
      `size-12 rounded-xl bg-primary text-primary-foreground` para el icono de lugar, el nombre, la
      dirección real, el horario en una `tarjeta bg-muted p-4` y las formas de pago de
      `config.formas_pago` como `.sello`; a la derecha `ArmaTuPedido`. Mantener el `<dl>` válido que
      arregló F3 (icono dentro del `<dt>`).

- [ ] **Paso 7: ubicación, nosotros y preguntas.**
  - `ubicacion/page.tsx`: el mapa en `rounded-2xl overflow-hidden shadow-suave isolate` (conservar
    `isolate`, que evita que tape la cabecera). Los bloques de texto con `TituloSeccion`.
  - `nosotros/page.tsx`: `TituloSeccion` con `nivel={1}`; misión y visión en `tarjeta bg-muted p-6`;
    los valores como en la portada (tarea 5, paso 6).
  - `preguntas-frecuentes/page.tsx`: cada `<details>` en `tarjeta bg-muted mb-3 overflow-hidden`,
    el `<summary>` `min-h-tactil flex items-center justify-between gap-4 px-5 py-4 font-heading
text-primary text-lg`, con `ChevronDown` que gira en `group-open:rotate-180` (y `transition`
    solo dentro de `motion-safe:`). Ancho `max-w-3xl mx-auto`.
  - `EncabezadoSeccion` (cabecera de cada página interior): de azul a `bg-muted`, con el título en
    `text-primary` y la entradilla en `text-muted-foreground`.

- [ ] **Paso 8: prueba del formulario.** Añadir a `e2e/pedido.spec.ts`:

```ts
test("«Arma tu pedido» abre WhatsApp con lo que escribió el cliente", async ({ page }) => {
  await page.goto("/contacto");
  await expect(page.getByRole("link", { name: "Enviar el pedido por WhatsApp" })).toHaveCount(0);

  await page.getByLabel("Tu nombre").fill("Mariana");
  await page.getByLabel("¿Qué quieres pedir?").fill("10 panes franceses");

  const enlace = page.getByRole("link", { name: "Enviar el pedido por WhatsApp" });
  await expect(enlace).toBeVisible();
  const href = decodeURIComponent((await enlace.getAttribute("href")) ?? "");
  expect(href).toMatch(/^https:\/\/wa\.me\/\d+\?text=/);
  expect(href).toContain("Nombre: Mariana");
  expect(href).toContain("10 panes franceses");
});
```

- [ ] **Paso 9: comprobar y PR.**

```bash
pnpm typecheck && pnpm lint && pnpm test
pnpm exec playwright test e2e/pedido.spec.ts e2e/secciones.spec.ts e2e/mapa.spec.ts e2e/abierto-ahora.spec.ts e2e/accesibilidad.spec.ts e2e/tactil.spec.ts
git add -A && git commit -m "feat(contacto): arma tu pedido por WhatsApp y el resto de páginas con el estilo nuevo"
```

---

## Tarea 9 — Cierre: medir, enseñar y documentar

Rama `docs/f3.1-cierre`.

- [ ] **Paso 1: la suite entera.**

```bash
pnpm typecheck && pnpm lint && pnpm format:check && pnpm test && supabase test db && pnpm exec playwright test
```

- [ ] **Paso 2: rendimiento contra la línea base de la tarea 1.**

```bash
PASADAS=5 MSYS_NO_PATHCONV=1 node scripts/medir-lighthouse.mjs http://localhost:3000 / /productos /contacto
```

La mediana de `/` no puede estar más de 5 puntos por debajo de la anotada en la tarea 1.
Accesibilidad ≥ 95 y SEO 100, como en F3. Si el rendimiento cae más, lo primero a mirar es el peso
de las fuentes y las tarjetas con imagen; no se cierra la fase con la regresión sin explicar.

- [ ] **Paso 3: las capturas para Dan y el propietario.** Con el build levantado, capturar `/`,
      `/productos`, `/contacto` y `/galeria` a 375 y 1280 px en `DOC/Maquetas/3.1/` (WebP,
      calidad 75), y compararlas lado a lado con `DOC/Maquetas/Stitch/`.

- [ ] **Paso 4: documentación.**
  - `docs/marca.md` §8 (paleta) y la sección de tipografía: los valores nuevos de la tarea 2 y la
    decisión del 13/09, con los contrastes de `paleta.test.ts`.
  - `PRODUCT.md`: tipografía y el lenguaje «artisan editorial».
  - `CLAUDE.md`, sección «Diseño»: fuentes, paleta con el azul `#12306E`, píldoras, sellos con
    mesura, velo del hero; estado de la fase 3.1; las trampas que hayan salido.
  - `DOC/Plan de Desarrollo 03 - Frontend.md` §3 (sistema de diseño): remitir a este plan.
  - `DOC/Plan de Desarrollo 00 - General y Fases.md`: marcar 3.1 cerrada.
  - `DOC/Avance del proyecto.md`: qué se adoptó del prototipo, qué no y por qué, con las medidas.
  - `DOC/Stack Tecnologico - PIMPOS.md`: Playfair Display y Plus Jakarta Sans.

- [ ] **Paso 5: desplegar y mirar en producción** a 375 px en un teléfono real (queda de F3) y en
      escritorio. Commit y PR.

---

## Autorrevisión del plan

**Cobertura de las decisiones de Dan:** diseño de Stitch (tareas 2–8) · azul `#12306E` (tarea 2,
primitivo `azul-900` y `paleta.test.ts`) · tipografía de Stitch (tarea 1) · híbrido de productos
(tarea 6, con prueba unitaria y E2E).

**Cobertura del prototipo:** barra de aviso (4) · cabecera y pie (4) · hero (5) · franja (5) ·
nosotros (5) · productos y filtro (6) · novedades, galería, testimonios (7) · contacto con «Arma tu
pedido», ubicación, preguntas (8). Lo que se rechaza está en la tabla del principio, con motivo.

**Nombres entre tareas:** `repartirPorFoto` (6), `textoDelAviso` (4), `mensajeArmado` y
`PedidoArmado` (8), `TituloSeccion` (3, usado en 5–8), `TarjetaProducto` (6), `BarraAviso` (4),
clases `.boton-cta` · `.boton-secundario` · `.boton-linea` · `.boton-whatsapp` · `.sello` ·
`.tarjeta` · `.tarjeta--elevable` (3), tokens `--velo-hero` · `--sombra-1/2/3` (2).

**Comprobado contra el código al escribir el plan:** el precio sale de `describirPrecio()`
(`src/lib/datos/catalogo.ts`), `VALOR` es `{ nombre, descripcion }`, `EstadoAhora` tiene
`variante="claro"` por defecto, y el número de WhatsApp se limpia con `replace(/\D/g, "")`.
**Contrastes calculados para decidir**, no supuestos: marrón sobre azul 1.94 (por eso ningún botón
secundario va sobre azul), marrón sobre durazno 3.92 (por eso los iconos de la franja van en tinta),
titular sobre el velo del hero en el peor caso 8.50, pie de galería en el peor caso 8.59.
