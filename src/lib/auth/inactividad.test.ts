import { describe, expect, it } from "vitest";

import { INACTIVIDAD_MAXIMA_MS, sesionInactiva } from "./inactividad";

const AHORA = Date.UTC(2026, 8, 29, 15, 0, 0);
const HORA = 60 * 60 * 1000;

describe("sesionInactiva", () => {
  it("son dos horas", () => {
    expect(INACTIVIDAD_MAXIMA_MS).toBe(2 * HORA);
  });

  it("con actividad hace menos de dos horas, sigue abierta", () => {
    expect(sesionInactiva(String(AHORA - HORA), AHORA)).toBe(false);
    expect(sesionInactiva(String(AHORA - 2 * HORA + 1000), AHORA)).toBe(false);
  });

  it("con más de dos horas sin actividad, se cierra", () => {
    expect(sesionInactiva(String(AHORA - 2 * HORA - 1000), AHORA)).toBe(true);
  });

  it("con sesión y sin marca, falla cerrado: se borró la cookie o la sesión es de antes", () => {
    // Entrar escribe la marca (`iniciarSesion`), así que una sesión sin ella
    // no es una recién abierta.
    expect(sesionInactiva(undefined, AHORA)).toBe(true);
  });

  it("una marca que no es un número cuenta como vencida: falla cerrado", () => {
    expect(sesionInactiva("abc", AHORA)).toBe(true);
    expect(sesionInactiva("", AHORA)).toBe(true);
  });

  it("una marca del futuro (reloj del navegador adelantado) no alarga la sesión más de dos horas", () => {
    expect(sesionInactiva(String(AHORA + 10 * HORA), AHORA)).toBe(true);
    expect(sesionInactiva(String(AHORA + 60 * 1000), AHORA)).toBe(false);
  });
});
