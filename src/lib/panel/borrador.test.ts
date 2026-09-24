import { describe, expect, it } from "vitest";

import {
  CADUCIDAD_MS,
  borrarBorrador,
  borrarTodosLosBorradores,
  claveDeBorrador,
  guardarBorrador,
  haceCuanto,
  leerBorrador,
  valoresDe,
} from "./borrador";

function almacenFalso() {
  const datos = new Map<string, string>();
  return {
    getItem: (k: string) => datos.get(k) ?? null,
    setItem: (k: string, v: string) => void datos.set(k, v),
    removeItem: (k: string) => void datos.delete(k),
    datos,
  };
}

describe("copia local de un formulario", () => {
  it("la clave distingue el formulario y la fila, y «nuevo» cuando no hay fila", () => {
    expect(claveDeBorrador("producto", "abc")).toBe("pimpos:borrador:producto:abc");
    expect(claveDeBorrador("producto", null)).toBe("pimpos:borrador:producto:nuevo");
  });

  it("guarda y recupera los valores con la hora", () => {
    const almacen = almacenFalso();
    guardarBorrador(almacen, "k", { nombre: "Pan" }, 1000);
    expect(leerBorrador(almacen, "k", 2000)).toEqual({
      valores: { nombre: "Pan" },
      guardadoEn: 1000,
    });
  });

  it("una copia de hace más de 7 días se descarta y se borra", () => {
    const almacen = almacenFalso();
    guardarBorrador(almacen, "k", { nombre: "Pan" }, 0);
    expect(leerBorrador(almacen, "k", CADUCIDAD_MS + 1)).toBeNull();
    expect(almacen.datos.has("k")).toBe(false);
  });

  it("algo que no es una copia válida se ignora sin romper la página", () => {
    const almacen = almacenFalso();
    almacen.setItem("k", "{roto");
    expect(leerBorrador(almacen, "k", 0)).toBeNull();
    almacen.setItem("k", JSON.stringify({ valores: { a: 1 }, guardadoEn: 0 }));
    expect(leerBorrador(almacen, "k", 0)).toBeNull();
  });

  it("si el navegador no deja guardar (modo privado, lleno) no lanza", () => {
    const almacen = {
      getItem: () => null,
      setItem: () => {
        throw new Error("QuotaExceededError");
      },
      removeItem: () => undefined,
    };
    expect(() => guardarBorrador(almacen, "k", { a: "b" }, 0)).not.toThrow();
  });

  it("borrar la quita", () => {
    const almacen = almacenFalso();
    guardarBorrador(almacen, "k", { a: "b" }, 0);
    borrarBorrador(almacen, "k");
    expect(leerBorrador(almacen, "k", 0)).toBeNull();
  });

  it("valoresDe se queda con el texto y descarta archivos", () => {
    const fd = new FormData();
    fd.set("nombre", "Pan");
    fd.set("foto", new File(["x"], "x.png"));
    expect(valoresDe(fd)).toEqual({ nombre: "Pan" });
  });

  it("dice hace cuánto en palabras", () => {
    const minuto = 60_000;
    expect(haceCuanto(0, 20_000)).toBe("hace un momento");
    expect(haceCuanto(0, 12 * minuto)).toBe("hace 12 minutos");
    expect(haceCuanto(0, 60 * minuto)).toBe("hace 1 hora");
    expect(haceCuanto(0, 5 * 60 * minuto)).toBe("hace 5 horas");
    expect(haceCuanto(0, 3 * 24 * 60 * minuto)).toBe("hace 3 días");
  });

  it("al cerrar sesión se borran todas las copias, y nada más", () => {
    const datos = new Map<string, string>([
      ["pimpos:borrador:usuario:nuevo", "{}"],
      ["pimpos:borrador:producto:abc", "{}"],
      ["pimpos:otra-cosa", "1"],
      ["tema", "oscuro"],
    ]);
    const almacen = {
      get length() {
        return datos.size;
      },
      key: (i: number) => [...datos.keys()][i] ?? null,
      removeItem: (k: string) => void datos.delete(k),
    };
    borrarTodosLosBorradores(almacen);
    expect([...datos.keys()]).toEqual(["pimpos:otra-cosa", "tema"]);
  });

  it("si el almacén no se deja leer, no revienta el cierre de sesión", () => {
    const almacen = {
      get length(): number {
        throw new Error("SecurityError");
      },
      key: () => null,
      removeItem: () => undefined,
    };
    expect(() => borrarTodosLosBorradores(almacen)).not.toThrow();
  });
});
