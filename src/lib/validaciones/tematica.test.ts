import { describe, expect, it } from "vitest";

import { esquemaTematica, leerTematica, validarTematica } from "./tematica";

const ID = "11111111-1111-4111-8111-111111111111";
const PRODUCTO = "22222222-2222-4222-8222-222222222222";

function formulario(cambios: Record<string, string> = {}): FormData {
  const fd = new FormData();
  const base: Record<string, string> = {
    id: ID,
    inicio: "2026-12-01",
    fin: "2026-12-26",
    fecha_evento: "2026-12-25",
    encendido: "fechas",
    texto_aviso: "Ya hay panetón",
    mensajes_cinta: "Feliz Navidad\nDelivery a todo Iquitos",
    titulo: "Lo de esta Navidad",
    entradilla: "",
    productos: JSON.stringify([{ producto_id: PRODUCTO, solo_temporada: true }]),
    ...cambios,
  };
  for (const [k, v] of Object.entries(base)) fd.set(k, v);
  return fd;
}

describe("esquemaTematica", () => {
  it("acepta una temática completa y lee la cinta línea a línea", () => {
    const r = esquemaTematica.safeParse(leerTematica(formulario()));
    expect(r.success).toBe(true);
    expect(r.data?.mensajes_cinta).toEqual(["Feliz Navidad", "Delivery a todo Iquitos"]);
    expect(r.data?.productos).toEqual([{ producto_id: PRODUCTO, solo_temporada: true }]);
    expect(r.data?.entradilla).toBeNull();
  });

  it("ignora las líneas vacías de la cinta", () => {
    const datos = leerTematica(formulario({ mensajes_cinta: "Feliz Navidad\n\n   \nPanetón\n" }));
    expect(datos.mensajes_cinta).toEqual(["Feliz Navidad", "Panetón"]);
  });

  it("rechaza siete mensajes", () => {
    const errores = validarTematica(formulario({ mensajes_cinta: "1\n2\n3\n4\n5\n6\n7" }));
    expect(errores.mensajes_cinta?.[0]).toBe("Como mucho seis mensajes.");
  });

  it("rechaza un mensaje de 61 letras", () => {
    const errores = validarTematica(formulario({ mensajes_cinta: "a".repeat(61) }));
    expect(errores.mensajes_cinta?.[0]).toBe("Cada mensaje, como mucho 60 letras.");
  });

  it("rechaza que termine antes de empezar", () => {
    const errores = validarTematica(formulario({ inicio: "2026-12-26", fin: "2026-12-01" }));
    expect(errores.fin?.[0]).toBe("Termina antes de empezar: revisa las fechas.");
  });

  it("una lista de productos rota cuenta como vacía", () => {
    expect(leerTematica(formulario({ productos: "{no es json" })).productos).toEqual([]);
  });
});
