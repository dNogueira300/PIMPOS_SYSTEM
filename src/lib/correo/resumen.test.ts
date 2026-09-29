import { describe, expect, it } from "vitest";

import { armarResumen, avisosVigentes } from "./resumen";

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

describe("avisosVigentes", () => {
  // En orden de llegada, como los lee el resumen. `stock_bajo` y los de
  // vencimiento se repiten cada día con clave nueva mientras el correo esté
  // apagado: al encenderlo, cada insumo tiene que salir una vez, con el dato
  // más reciente.
  const aviso = (
    tipo: string,
    mensaje: string,
    insumo_id: string | null,
    lote_id: string | null = null,
  ) => ({ tipo, titulo: tipo, mensaje, insumo_id, lote_id });

  it("de un mismo insumo y tipo, solo el más reciente", () => {
    const vigentes = avisosVigentes([
      aviso("stock_bajo", "Quedan 30 kg de Harina.", "harina"),
      aviso("stock_bajo", "Quedan 5 kg de Sal.", "sal"),
      aviso("stock_bajo", "Quedan 12 kg de Harina.", "harina"),
    ]);
    expect(vigentes.map((a) => a.mensaje)).toEqual([
      "Quedan 5 kg de Sal.",
      "Quedan 12 kg de Harina.",
    ]);
  });

  it("los de vencimiento se distinguen por lote, y un tipo distinto no pisa a otro", () => {
    const vigentes = avisosVigentes([
      aviso("por_vencer", "Lote 1 vence pronto.", "leche", "lote-1"),
      aviso("por_vencer", "Lote 2 vence pronto.", "leche", "lote-2"),
      aviso("vencido", "Lote 1 venció.", "leche", "lote-1"),
      aviso("stock_bajo", "Queda poca leche.", "leche"),
    ]);
    expect(vigentes).toHaveLength(4);
  });

  it("los que esperan una decisión se quedan todos: cada uno es otra baja u otra promoción", () => {
    const vigentes = avisosVigentes([
      aviso("baja_pendiente", "Baja de 2 kg de Sal.", "sal"),
      aviso("baja_pendiente", "Baja de 1 kg de Sal.", "sal"),
      aviso("promocion_en_revision", "2x1 en pan.", null),
      aviso("promocion_en_revision", "Tortas.", null),
    ]);
    expect(vigentes).toHaveLength(4);
  });
});
