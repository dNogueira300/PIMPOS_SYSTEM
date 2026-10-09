import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { inflateSync } from "node:zlib";

import { describe, expect, it, vi } from "vitest";

import { clientesATabla } from "@/lib/clientes/tabla";

import { reporteAPdf } from "./exportar-pdf";
import type { TablaExportable } from "./formato-reporte";

vi.mock("server-only", () => ({}));

const tabla: TablaExportable = {
  titulo: "Existencias y valorización",
  subtitulo: "Al 09/10/2026",
  columnas: [
    { clave: "insumo", titulo: "Insumo", tipo: "texto" },
    { clave: "cantidad", titulo: "Hay", tipo: "cantidad" },
    { clave: "unidad", titulo: "Unidad", tipo: "texto" },
    { clave: "valor", titulo: "Valor", tipo: "soles" },
  ],
  filas: [{ insumo: "Harina de ejemplo", cantidad: 12.5, unidad: "kilogramo", valor: 36.5 }],
  total: 36.5,
  sinCosto: [true],
  hayCostosDesconocidos: true,
};
const clientes = clientesATabla(
  Array.from({ length: 70 }, (_, i) => ({
    nombre_completo: `Cliente de ejemplo ${i + 1}`,
    celular: "999000000",
    direccion: "Dirección de ejemplo para comprobar la impresión",
    referencia: "Referencia de ejemplo",
    zona: "Zona de ejemplo",
    con_punto: i % 2 === 0,
    activo: true,
  })),
  "Todas las zonas · activos · al 09/10/2026",
);
const casos: [string, TablaExportable][] = [
  ["insumos", tabla],
  ["insumos-vacio", { ...tabla, filas: [], sinCosto: [], total: null }],
  ["clientes", clientes],
  ["clientes-vacio", clientesATabla([], "Todas las zonas · activos · al 09/10/2026")],
];

/** Comandos de dibujo reales; no depende de las clases o nombres de estilos. */
function comandos(pdf: Buffer): string {
  const streams = [...pdf.toString("latin1").matchAll(/stream\r?\n([\s\S]*?)\r?\nendstream/g)];
  return streams
    .map((stream) => {
      try {
        return inflateSync(Buffer.from(stream[1]!, "latin1")).toString("latin1");
      } catch {
        return ""; // No todos los streams usan FlateDecode.
      }
    })
    .join("\n");
}

describe("marca de todos los PDF descargables", () => {
  it.each(casos)("%s incorpora el logo en cada página", async (nombre, datos) => {
    const pdf = await reporteAPdf(datos);
    const destino = process.env.PIMPOS_PDF_EVIDENCIA_DIR;
    if (destino) {
      await mkdir(destino, { recursive: true });
      await writeFile(join(destino, `${nombre}.pdf`), pdf);
    }
    expect(pdf.subarray(0, 5).toString()).toBe("%PDF-");
    expect(pdf.toString("latin1")).toContain("/Subtype /Image");
    const paginas = [...pdf.toString("latin1").matchAll(/\/Type \/Page\b/g)].length;
    const dibujos = [...comandos(pdf).matchAll(/\/I\d+\s+Do\b/g)].length;
    expect(dibujos).toBe(paginas);
  });

  it("usa terracota y no conserva el azul anterior en texto o trazos", async () => {
    const contenido = comandos(await reporteAPdf(tabla));
    const colores = [
      ...contenido.matchAll(/([\d.]+)\s+([\d.]+)\s+([\d.]+)\s+(?:rg|RG|scn|SCN)\b/g),
    ].map((m) => m.slice(1, 4).map(Number));
    const contiene = (color: number[]) =>
      colores.some((c) => c.every((n, i) => Math.abs(n - color[i]!) < 0.00001));
    expect(contiene([149 / 255, 62 / 255, 44 / 255])).toBe(true);
    expect(contiene([18 / 255, 48 / 255, 110 / 255])).toBe(false);
  });
});
