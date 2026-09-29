import { describe, expect, it } from "vitest";

import { armarResumen } from "./resumen";

describe("armarResumen", () => {
  const avisos = [
    { tipo: "stock_bajo", titulo: "Queda poco Harina", mensaje: "Quedan 30 kg de Harina." },
    {
      tipo: "baja_pendiente",
      titulo: "Baja esperando aprobación",
      mensaje: "Piden dar de baja 2 kg de Sal.",
    },
    { tipo: "stock_bajo", titulo: "Queda poco <Sal>", mensaje: "Quedan 1 kg." },
  ];

  it("el asunto dice cuántos avisos y de qué día", () => {
    expect(armarResumen(avisos, "12/10/2026").asunto).toBe("Pimpo's: 3 avisos del 12/10/2026");
  });

  it("un solo aviso, en singular", () => {
    expect(armarResumen(avisos.slice(0, 1), "12/10/2026").asunto).toBe(
      "Pimpo's: 1 aviso del 12/10/2026",
    );
  });

  it("agrupa por tipo, con el grupo más urgente primero", () => {
    const { texto } = armarResumen(avisos, "12/10/2026");
    expect(texto.indexOf("Por aprobar")).toBeLessThan(texto.indexOf("Queda poco"));
    expect(texto).toContain("Quedan 30 kg de Harina.");
  });

  it("escapa el HTML de lo que escribió una persona", () => {
    expect(armarResumen(avisos, "12/10/2026").html).toContain("Queda poco &lt;Sal&gt;");
  });

  it("un tipo que el resumen no conoce no se pierde: va en «Otros avisos»", () => {
    const { texto, asunto } = armarResumen(
      [{ tipo: "algo_nuevo", titulo: "Aviso nuevo", mensaje: "Algo pasó." }],
      "12/10/2026",
    );
    expect(asunto).toBe("Pimpo's: 1 aviso del 12/10/2026");
    expect(texto).toContain("Otros avisos:");
    expect(texto).toContain("Aviso nuevo. Algo pasó.");
  });
});
