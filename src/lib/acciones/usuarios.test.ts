import { beforeEach, describe, expect, it, vi } from "vitest";

import type { OpcionesAccion } from "@/lib/panel/accion";

/**
 * El orden de `restablecerClave` con la service_role (ronda 3 de la revisión):
 * primero cerrar sesiones, después cambiar la contraseña. Se sustituyen
 * Supabase y `ejecutarAccion` para poder hacer fallar cada paso; la
 * autorización ya tiene sus propias pruebas (usuario.test.ts, pgTAP, E2E).
 */
const pasos: string[] = [];
const fallos = { cerrar: false, cambiar: false };

vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/servidor", () => ({ crearClienteServidor: vi.fn() }));
vi.mock("@/lib/supabase/administrador", () => ({
  crearClienteAdministrador: () => ({
    rpc: async (nombre: string) => {
      pasos.push(nombre);
      return { error: fallos.cerrar ? { code: "XX000", message: "caída" } : null };
    },
    auth: {
      admin: {
        updateUserById: async () => {
          pasos.push("cambiar_clave");
          return fallos.cambiar
            ? { data: { user: null }, error: { code: "unexpected_failure", message: "caída" } }
            : { data: { user: { email: "b@pimpos.test" } }, error: null };
        },
      },
    },
  }),
}));

// Perfil de destino: un repartidor; quien pide: un administrador.
const supabaseDeLaSesion = {
  from: () => ({
    select: () => ({
      eq: () => ({
        is: () => ({ single: async () => ({ data: { id: "b", rol: "repartidor" }, error: null }) }),
      }),
    }),
  }),
};

vi.mock("@/lib/panel/accion", () => ({
  ejecutarAccion: async (op: OpcionesAccion<never>) => {
    const r = await op.hacer({ id: "00000000-0000-4000-8000-00000000000b" } as never, {
      supabase: supabaseDeLaSesion as never,
      sesion: { usuarioId: "a", correo: null, rol: "administrador" },
    });
    return r.error
      ? { estado: "error", mensaje: r.error.message }
      : { estado: "ok", mensaje: "ok", extra: r.extra };
  },
}));

const { restablecerClave } = await import("./usuarios");

beforeEach(() => {
  pasos.length = 0;
  fallos.cerrar = false;
  fallos.cambiar = false;
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("restablecerClave", () => {
  it("cierra las sesiones ANTES de cambiar la contraseña", async () => {
    const r = await restablecerClave("00000000-0000-4000-8000-00000000000b");
    expect(pasos).toEqual(["cerrar_sesiones", "cambiar_clave"]);
    expect(r.estado).toBe("ok");
  });

  it("si no puede cerrar las sesiones, no toca la contraseña y dice que se reintente", async () => {
    fallos.cerrar = true;
    const r = await restablecerClave("00000000-0000-4000-8000-00000000000b");
    expect(pasos).toEqual(["cerrar_sesiones"]);
    expect(r).toMatchObject({
      estado: "error",
      mensaje:
        "No se pudo darle una contraseña nueva: no cambió nada. Inténtalo otra vez en un momento.",
    });
  });

  it("si el cambio de contraseña falla, dice que sigue la de antes y cómo reintentarlo", async () => {
    fallos.cambiar = true;
    const r = await restablecerClave("00000000-0000-4000-8000-00000000000b");
    expect(pasos).toEqual(["cerrar_sesiones", "cambiar_clave"]);
    expect(r).toMatchObject({
      estado: "error",
      mensaje:
        "Se cerró su sesión, pero la contraseña no se cambió: sigue siendo la de antes. Pulsa otra vez «Darle una contraseña temporal nueva».",
    });
    expect(r).not.toHaveProperty("extra");
  });
});
