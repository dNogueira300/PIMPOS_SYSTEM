import { describe, expect, it } from "vitest";

import type { Rol } from "@/lib/auth/roles";

import {
  esquemaCambioClave,
  esquemaUsuario,
  puedeGestionarAcceso,
  puedeRestablecerClave,
  rolesQuePuedeAsignar,
} from "./usuario";

describe("rolesQuePuedeAsignar", () => {
  it("el administrador no ofrece superadmin", () => {
    expect(rolesQuePuedeAsignar("administrador")).toEqual([
      "administrador",
      "ingeniero",
      "repartidor",
    ]);
  });

  it("el superadmin ofrece los cuatro", () => {
    expect(rolesQuePuedeAsignar("superadmin")).toHaveLength(4);
  });

  it("el resto no asigna ninguno", () => {
    expect(rolesQuePuedeAsignar("ingeniero")).toEqual([]);
    expect(rolesQuePuedeAsignar("repartidor")).toEqual([]);
  });
});

describe("puedeGestionarAcceso", () => {
  // Contraseña temporal, desactivar: la service_role no pasa por el trigger de
  // 0029, así que esta función es la única regla entre un administrador y la
  // cuenta de un superadmin.
  it("el administrador NO toca el acceso de un superadmin", () => {
    expect(puedeGestionarAcceso("administrador", "superadmin")).toBe(false);
  });

  it("el administrador sí toca el de administradores, ingenieros y repartidores", () => {
    for (const destino of ["administrador", "ingeniero", "repartidor"] as const) {
      expect(puedeGestionarAcceso("administrador", destino)).toBe(true);
    }
  });

  it("el superadmin toca el de todos", () => {
    for (const destino of ["superadmin", "administrador", "ingeniero", "repartidor"] as const) {
      expect(puedeGestionarAcceso("superadmin", destino)).toBe(true);
    }
  });

  it("ingeniero y repartidor no tocan el de nadie", () => {
    for (const quien of ["ingeniero", "repartidor"] as const) {
      for (const destino of ["superadmin", "administrador", "ingeniero", "repartidor"] as const) {
        expect(puedeGestionarAcceso(quien, destino)).toBe(false);
      }
    }
  });
});

describe("puedeRestablecerClave", () => {
  // Pedido de Dan (revisión del PR #57): la contraseña de un administrador solo
  // la restablece el superadmin. La tabla entera, para que un cambio en
  // cualquier casilla se note.
  const TABLA = {
    superadmin: { superadmin: true, administrador: true, ingeniero: true, repartidor: true },
    administrador: { superadmin: false, administrador: false, ingeniero: true, repartidor: true },
    ingeniero: { superadmin: false, administrador: false, ingeniero: false, repartidor: false },
    repartidor: { superadmin: false, administrador: false, ingeniero: false, repartidor: false },
  } as const;

  for (const [quien, fila] of Object.entries(TABLA)) {
    for (const [destino, esperado] of Object.entries(fila)) {
      it(`${quien} → ${destino}: ${esperado ? "sí" : "no"}`, () => {
        expect(puedeRestablecerClave(quien as Rol, destino as Rol)).toBe(esperado);
      });
    }
  }
});

describe("esquemaUsuario", () => {
  it("un correo mal escrito dice qué revisar", () => {
    const r = esquemaUsuario.safeParse({
      id: null,
      nombre_completo: "Debra",
      correo: "debra@",
      celular: null,
      rol: "ingeniero",
    });
    expect(!r.success && r.error.issues[0]?.message).toBe(
      "Ese correo no parece válido. Revisa que esté bien escrito.",
    );
  });

  it("un celular peruano de 9 dígitos es válido, con o sin espacios", () => {
    const r = esquemaUsuario.safeParse({
      id: null,
      nombre_completo: "Marcos",
      correo: "m@pimpos.pe",
      celular: "987 654 321",
      rol: "administrador",
    });
    expect(r.success && r.data.celular).toBe("987654321");
  });

  it("un celular que no es peruano dice cómo es uno bueno", () => {
    const r = esquemaUsuario.safeParse({
      id: null,
      nombre_completo: "Marcos",
      correo: "m@pimpos.pe",
      celular: "12345",
      rol: "administrador",
    });
    expect(!r.success && r.error.issues[0]?.message).toBe(
      "El celular tiene 9 dígitos y empieza por 9.",
    );
  });

  it("un rol que no existe no pasa", () => {
    const r = esquemaUsuario.safeParse({
      id: null,
      nombre_completo: "Marcos",
      correo: "m@pimpos.pe",
      celular: null,
      rol: "dueño",
    });
    expect(!r.success && r.error.issues[0]?.message).toBe("Elige un rol.");
  });
});

describe("esquemaCambioClave", () => {
  it("exige 10 caracteres", () => {
    const r = esquemaCambioClave.safeParse({ clave: "corta", repetir: "corta" });
    expect(!r.success && r.error.issues[0]?.message).toBe(
      "Tiene que tener al menos 10 caracteres.",
    );
  });

  it("las dos tienen que coincidir", () => {
    const r = esquemaCambioClave.safeParse({ clave: "unaclavelarga", repetir: "otraclavelarga" });
    expect(!r.success && r.error.issues[0]).toMatchObject({
      path: ["repetir"],
      message: "Las dos contraseñas no coinciden.",
    });
  });
});
