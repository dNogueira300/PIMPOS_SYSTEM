import { describe, expect, it } from "vitest";

import { anosDeOficio, enLetra } from "./reloj";

// La cuenta de años se publica en la portada ("Desde 2004", "Veintidós años en
// el barrio") y en la descripción de nosotros para buscadores. Estaba escrita a
// mano en los cuatro sitios: no fallaba, simplemente el 1 de enero siguiente
// pasaba a mentir en los cuatro a la vez. Esto es lo que impide que vuelva.

describe("anosDeOficio", () => {
  it("cuenta los años desde la apertura", () => {
    expect(anosDeOficio(2026, 2004)).toBe(22);
    expect(anosDeOficio(2027, 2004)).toBe(23);
  });

  // El caso que motiva todo: en cuanto cambia el año, la cifra cambia sola.
  it("el número sube solo al cambiar de año, sin tocar código", () => {
    const anios = [2026, 2027, 2028, 2029].map((anio) => anosDeOficio(anio, 2004));
    expect(anios).toEqual([22, 23, 24, 25]);
  });

  // Devolver null y no un número raro: quien llama escribe la frase sin la
  // cifra. "Años en el barrio" se lee bien; "0 años en el barrio" no.
  it("no inventa una cuenta cuando los datos no dan para una", () => {
    expect(anosDeOficio(2026, 2026)).toBeNull(); // abrió este año
    expect(anosDeOficio(2026, 2030)).toBeNull(); // en el futuro
    expect(anosDeOficio(2026, 1800)).toBeNull(); // absurdo
    expect(anosDeOficio(2026, Number.NaN)).toBeNull();
    expect(anosDeOficio(Number.NaN, 2004)).toBeNull();
  });
});

describe("enLetra", () => {
  it("escribe el número como va en un titular", () => {
    expect(enLetra(22)).toBe("Veintidós");
    expect(enLetra(23)).toBe("Veintitrés");
    expect(enLetra(25)).toBe("Veinticinco");
    expect(enLetra(30)).toBe("Treinta");
    expect(enLetra(21)).toBe("Veintiún");
    expect(enLetra(26)).toBe("Veintiséis");
    expect(enLetra(31)).toBe("Treinta y un");
    expect(enLetra(45)).toBe("Cuarenta y cinco");
  });

  // Feo antes que falso: fuera del rango cubierto devuelve la cifra, que nunca
  // es incorrecta, en vez de una palabra mal formada.
  it("fuera del rango que cubre, devuelve la cifra", () => {
    expect(enLetra(12)).toBe("12");
    expect(enLetra(60)).toBe("60");
    expect(enLetra(22.5)).toBe("22.5");
  });
});
