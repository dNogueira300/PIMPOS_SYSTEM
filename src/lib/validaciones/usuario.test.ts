import { describe, expect, it } from "vitest";

import { esquemaCambioClave, esquemaUsuario, rolesQuePuedeAsignar } from "./usuario";

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
