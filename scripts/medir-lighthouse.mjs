#!/usr/bin/env node
/**
 * Lighthouse en movil sobre las paginas publicas (doc 03 §7).
 *
 * Los umbrales los fija el plan y no se negocian aqui: rendimiento >= 90,
 * accesibilidad >= 95, SEO = 100. "Buenas practicas" se mide y se informa, pero
 * no corta: el plan no le puso numero y ponerselo aqui seria inventarse un
 * requisito.
 *
 * Por que un guion y no una prueba de Playwright: Lighthouse mide tiempos, y un
 * tiempo depende de la maquina. En un runner compartido de GitHub Actions el
 * mismo sitio puntua 96 una vez y 78 la siguiente, asi que meterlo en el CI
 * seria poner en rojo ramas sanas. Se ejecuta a mano —antes de cerrar una fase
 * y despues de cada despliegue— y deja el informe completo en disco. Lo que si
 * corre en cada PR es axe (`e2e/accesibilidad.spec.ts`), que es determinista.
 *
 *   node scripts/medir-lighthouse.mjs                          # el build local
 *   node scripts/medir-lighthouse.mjs https://pimpos-system-iota.vercel.app
 *   node scripts/medir-lighthouse.mjs <url> /productos /contacto
 */

import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

import { launch } from "chrome-launcher";
import lighthouse from "lighthouse";

const UMBRALES = { performance: 90, accessibility: 95, seo: 100 };
const CATEGORIAS = ["performance", "accessibility", "best-practices", "seo"];

const NOMBRES = {
  performance: "Rendimiento",
  accessibility: "Accesibilidad",
  "best-practices": "Buenas prácticas",
  seo: "SEO",
};

// Una de cada forma de pagina, no las quince: Lighthouse tarda ~30 s por
// medicion y las rutas que comparten plantilla dan el mismo resultado. Estan la
// portada (la que mas se abre), el catalogo (la lista larga), una ficha con
// foto y otra sin ella, ubicacion (el mapa, la mas pesada) y contacto.
const RUTAS_POR_DEFECTO = [
  "/",
  "/productos",
  "/productos/leche",
  "/productos/frances-chico",
  "/ubicacion",
  "/contacto",
];

const [urlBase = "http://localhost:3000", ...rutasPedidas] = process.argv.slice(2);
const rutas = rutasPedidas.length > 0 ? rutasPedidas : RUTAS_POR_DEFECTO;
// Fuera de `test-results/`: Playwright vacia esa carpeta al empezar, y los
// informes desaparecian en cuanto se corria cualquier prueba. Va al `.gitignore`.
const carpeta = ".lighthouse";

/** Las auditorias que fallaron dentro de una categoria, con su nombre legible. */
function auditoriasFallidas(lhr, categoria) {
  return lhr.categories[categoria].auditRefs
    .map((ref) => lhr.audits[ref.id])
    .filter((a) => a && a.score !== null && a.score < 1 && a.scoreDisplayMode !== "informative")
    .sort((a, b) => a.score - b.score)
    .map((a) => `      [${a.id}] ${a.title}`);
}

async function medir(chrome, ruta) {
  const url = new URL(ruta, urlBase).href;
  const resultado = await lighthouse(url, {
    port: chrome.port,
    output: "html",
    logLevel: "error",
    // El preset de movil de Lighthouse: pantalla de celular, CPU ralentizada y
    // red 4G lenta. Es el escenario que declara el proyecto (Iquitos, datos
    // moviles irregulares), no el escritorio con fibra donde todo puntua bien.
    formFactor: "mobile",
    screenEmulation: { mobile: true, width: 412, height: 823, deviceScaleFactor: 1.75 },
    onlyCategories: CATEGORIAS,
  });

  if (!resultado) throw new Error(`Lighthouse no devolvio nada para ${url}`);

  const archivo = join(
    carpeta,
    `${ruta.replace(/\W+/g, "-").replace(/^-|-$/g, "") || "inicio"}.html`,
  );
  await writeFile(archivo, resultado.report);

  return { ruta, url, lhr: resultado.lhr, archivo };
}

const chrome = await launch({ chromeFlags: ["--headless=new", "--no-sandbox"] });
await mkdir(carpeta, { recursive: true });

console.log(`Lighthouse (móvil) sobre ${urlBase}\n`);

const medidas = [];
try {
  for (const ruta of rutas) {
    process.stdout.write(`  midiendo ${ruta} ... `);
    const medida = await medir(chrome, ruta);
    const puntos = CATEGORIAS.map((c) => Math.round(medida.lhr.categories[c].score * 100));
    console.log(puntos.join("  "));
    medidas.push(medida);
  }
} finally {
  // En Windows, Chrome deja abierto algun archivo de su perfil temporal y el
  // borrado que hace `kill()` tira EPERM. Si eso escapa del `finally`, se
  // pierde la tabla entera de resultados por no haber podido borrar una carpeta
  // de Temp. El proceso ya esta muerto para entonces; lo que sobra es basura.
  try {
    await chrome.kill();
  } catch (error) {
    console.warn(`  (no se pudo limpiar el perfil temporal de Chrome: ${error.code ?? error})`);
  }
}

console.log(`\n${"Ruta".padEnd(26)}${CATEGORIAS.map((c) => NOMBRES[c].padStart(16)).join("")}`);
console.log("-".repeat(26 + 16 * CATEGORIAS.length));

const fallos = [];
for (const { ruta, lhr, archivo } of medidas) {
  const celdas = CATEGORIAS.map((categoria) => {
    const puntos = Math.round(lhr.categories[categoria].score * 100);
    const minimo = UMBRALES[categoria];
    const cumple = minimo === undefined || puntos >= minimo;
    if (!cumple) {
      fallos.push(
        `  ${ruta} → ${NOMBRES[categoria]} ${puntos}, se pedían ${minimo}\n` +
          auditoriasFallidas(lhr, categoria).join("\n") +
          `\n      informe: ${archivo}`,
      );
    }
    return `${puntos}${cumple ? "" : " ✗"}`.padStart(16);
  });
  console.log(ruta.padEnd(26) + celdas.join(""));
}

console.log(
  `\nMínimos del plan (doc 03 §7): rendimiento ${UMBRALES.performance}, ` +
    `accesibilidad ${UMBRALES.accessibility}, SEO ${UMBRALES.seo}. ` +
    `Buenas prácticas se informa, no corta.`,
);
console.log(`Informes completos en ${carpeta}/`);

if (fallos.length > 0) {
  // El detalle, no solo el numero: un "SEO 92" a secas obliga a abrir el
  // informe y buscar cual de las veinte auditorias fallo.
  console.error(`\nPor debajo del mínimo:\n${fallos.join("\n")}`);
  process.exit(1);
}

console.log("\nTodas las páginas cumplen los mínimos.");
