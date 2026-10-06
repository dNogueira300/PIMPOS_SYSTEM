import { describe, expect, it } from "vitest";

import { accion, type Cambio, diferencias, frase, idsReferidos, quien } from "./redactar";

const NOMBRES = {
  p1: "Pan francés",
  i1: "Harina",
  kg: "kg",
  c1: "Rosa Quispe",
  z1: "Belén",
  z2: "Punchana",
};

function cambio(parcial: Partial<Cambio>): Cambio {
  return {
    id: 1,
    tabla: "public.productos",
    registro_id: "p1",
    operacion: "UPDATE",
    usuario_id: "u1",
    usuario_nombre: "Marcos",
    usuario_correo: "marcos@pimpos.test",
    rol: "ingeniero",
    datos_antes: null,
    datos_despues: null,
    ocurrido_en: "2026-10-06T15:00:00.000Z",
    ...parcial,
  };
}

describe("quien", () => {
  it("dice el nombre; si no lo hay, el correo; si no hubo nadie, el sistema (Review Focus)", () => {
    expect(quien(cambio({}))).toBe("Marcos");
    expect(quien(cambio({ usuario_nombre: "  " }))).toBe("marcos@pimpos.test");
    expect(quien(cambio({ usuario_nombre: null, usuario_correo: null }))).toBe(
      "Alguien cuya cuenta ya no existe",
    );
    expect(quien(cambio({ usuario_id: null, usuario_nombre: null, usuario_correo: null }))).toBe(
      "El sistema",
    );
  });
});

describe("diferencias", () => {
  it("de un cambio, solo lo que cambió, sin los campos de control", () => {
    const c = cambio({
      tabla: "public.producto_variantes",
      datos_antes: { id: "v1", nombre: "Unidad", precio: 0.2, updated_at: "a", producto_id: "p1" },
      datos_despues: {
        id: "v1",
        nombre: "Unidad",
        precio: 0.25,
        updated_at: "b",
        producto_id: "p1",
      },
    });
    expect(diferencias(c, NOMBRES)).toEqual([
      { campo: "precio", etiqueta: "Precio", antes: "S/ 0.20", despues: "S/ 0.25" },
    ]);
  });

  it("de un alta, lo que trae; de una eliminación, lo que había", () => {
    const alta = cambio({
      operacion: "INSERT",
      tabla: "public.zonas_reparto",
      datos_despues: { id: "z1", nombre: "Belén", descripcion: null, activo: true },
    });
    expect(diferencias(alta, NOMBRES)).toEqual([
      { campo: "nombre", etiqueta: "Nombre", antes: "—", despues: "Belén" },
      { campo: "activo", etiqueta: "Activo", antes: "—", despues: "Sí" },
    ]);
    const baja = cambio({ operacion: "DELETE", datos_antes: { id: "z1", nombre: "Belén" } });
    expect(diferencias(baja, NOMBRES)).toEqual([
      { campo: "nombre", etiqueta: "Nombre", antes: "Belén", despues: "—" },
    ]);
  });

  it("de una ficha con los datos borrados a pedido, nada (Review Focus)", () => {
    const c = cambio({
      tabla: "public.clientes",
      datos_antes: { borrado: true },
      datos_despues: { borrado: true },
    });
    expect(diferencias(c, NOMBRES)).toEqual([]);
  });
});

describe("accion", () => {
  it("un solo dato cambiado se dice con su antes y su después", () => {
    const c = cambio({
      tabla: "public.producto_variantes",
      datos_antes: { nombre: "Unidad", precio: 0.2, producto_id: "p1" },
      datos_despues: { nombre: "Unidad", precio: 0.25, producto_id: "p1" },
    });
    expect(accion(c, NOMBRES)).toBe(
      "cambió la presentación Unidad de Pan francés: Precio S/ 0.20 → S/ 0.25",
    );
    expect(frase(c, NOMBRES)).toBe(
      "Marcos cambió la presentación Unidad de Pan francés: Precio S/ 0.20 → S/ 0.25",
    );
  });

  it("varios datos cambiados se cuentan", () => {
    const c = cambio({
      datos_antes: { nombre: "Pan francés", descripcion: "a", destacado: false },
      datos_despues: { nombre: "Pan francés", descripcion: "b", destacado: true },
    });
    expect(accion(c, NOMBRES)).toBe("cambió el producto Pan francés (2 datos)");
  });

  it("un valor largo se recorta en la frase (Review Focus)", () => {
    const c = cambio({
      tabla: "public.guias",
      datos_antes: { titulo: "Cómo conservar el pan", contenido: "a".repeat(300) },
      datos_despues: { titulo: "Cómo conservar el pan", contenido: "b".repeat(300) },
    });
    const texto = accion(c, NOMBRES);
    expect(texto.length).toBeLessThan(160);
    expect(texto).toContain("…");
  });

  it("crear, eliminar y borrar (que en el panel es una marca) se dicen distinto", () => {
    expect(
      accion(cambio({ operacion: "INSERT", datos_despues: { nombre: "Pan francés" } }), NOMBRES),
    ).toBe("creó el producto Pan francés");
    expect(
      accion(cambio({ operacion: "DELETE", datos_antes: { nombre: "Pan francés" } }), NOMBRES),
    ).toBe("eliminó el producto Pan francés");
    expect(
      accion(
        cambio({
          datos_antes: { nombre: "Pan francés", deleted_at: null },
          datos_despues: { nombre: "Pan francés", deleted_at: "2026-10-06T15:00:00Z" },
        }),
        NOMBRES,
      ),
    ).toBe("borró el producto Pan francés");
  });

  it("publicar, despublicar, desactivar y reactivar", () => {
    const con = (antes: object, despues: object) =>
      accion(
        cambio({
          datos_antes: { nombre: "Pan francés", ...antes },
          datos_despues: { nombre: "Pan francés", ...despues },
        }),
        NOMBRES,
      );
    expect(con({ estado: "borrador" }, { estado: "publicado" })).toBe(
      "publicó el producto Pan francés",
    );
    expect(con({ estado: "publicado" }, { estado: "borrador" })).toBe(
      "despublicó el producto Pan francés",
    );
    expect(con({ activo: true }, { activo: false })).toBe("desactivó el producto Pan francés");
    expect(con({ activo: false }, { activo: true })).toBe("reactivó el producto Pan francés");
  });

  it("un movimiento de insumo dice qué fue", () => {
    const mov = (extra: object) =>
      accion(
        cambio({
          operacion: "INSERT",
          tabla: "public.movimientos_insumo",
          datos_despues: { insumo_id: "i1", unidad_id: "kg", cantidad: 50, sentido: 1, ...extra },
        }),
        NOMBRES,
      );
    expect(mov({ tipo: "ingreso" })).toBe("registró un ingreso de 50 kg de Harina");
    expect(mov({ tipo: "consumo", sentido: -1, cantidad: 2.5 })).toBe(
      "registró un consumo de 2.5 kg de Harina",
    );
    expect(mov({ tipo: "baja", sentido: -1 })).toBe("registró una baja de 50 kg de Harina");
    expect(mov({ tipo: "ajuste", sentido: -1, cantidad: 3 })).toBe(
      "ajustó por conteo Harina: −3 kg",
    );
    expect(mov({ tipo: "anulacion" })).toBe("anuló un movimiento de Harina");
  });

  it("las bajas: se piden, se aprueban o se rechazan", () => {
    const baja = { insumo_id: "i1", unidad_id: "kg", cantidad: 5 };
    expect(
      accion(
        cambio({ operacion: "INSERT", tabla: "public.solicitudes_baja", datos_despues: baja }),
        NOMBRES,
      ),
    ).toBe("pidió una baja de 5 kg de Harina");
    expect(
      accion(
        cambio({
          tabla: "public.solicitudes_baja",
          datos_antes: { ...baja, estado: "pendiente" },
          datos_despues: { ...baja, estado: "aprobada" },
        }),
        NOMBRES,
      ),
    ).toBe("aprobó la baja pedida de Harina");
  });

  it("clientes: registrar, anotar y retirar el permiso, añadir y cambiar una foto", () => {
    expect(
      accion(
        cambio({
          operacion: "INSERT",
          tabla: "public.clientes",
          datos_despues: { nombre_completo: "Rosa Quispe" },
        }),
        NOMBRES,
      ),
    ).toBe("registró al cliente Rosa Quispe");
    expect(
      accion(
        cambio({
          operacion: "INSERT",
          tabla: "public.consentimientos",
          datos_despues: { cliente_id: "c1" },
        }),
        NOMBRES,
      ),
    ).toBe("anotó el permiso de Rosa Quispe");
    expect(
      accion(
        cambio({
          tabla: "public.consentimientos",
          datos_antes: { cliente_id: "c1", revocado_en: null },
          datos_despues: { cliente_id: "c1", revocado_en: "2026-10-06T15:00:00Z" },
        }),
        NOMBRES,
      ),
    ).toBe("retiró el permiso de Rosa Quispe");
    expect(
      accion(
        cambio({
          tabla: "public.cliente_fotos",
          datos_antes: { cliente_id: "c1", ruta: "c1/a.webp", updated_at: "a" },
          datos_despues: { cliente_id: "c1", ruta: "c1/a.webp", updated_at: "b" },
        }),
        NOMBRES,
      ),
    ).toBe("cambió una foto de la casa de Rosa Quispe");
  });

  it("una ficha con los datos borrados a pedido dice solo eso (Review Focus)", () => {
    const c = cambio({
      tabla: "public.clientes",
      datos_antes: { borrado: true },
      datos_despues: { borrado: true },
    });
    expect(accion(c, NOMBRES)).toBe(
      "hizo un cambio en un cliente cuyos datos se borraron a pedido",
    );
  });

  it("el cambio de rol de una cuenta se dice con los dos roles", () => {
    const c = cambio({
      tabla: "public.perfiles",
      datos_antes: { nombre_completo: "Debra", rol: "ingeniero" },
      datos_despues: { nombre_completo: "Debra", rol: "administrador" },
    });
    expect(accion(c, NOMBRES)).toBe("cambió el rol de Debra: Ingeniero → Administrador");
  });

  it("guardar sin cambiar nada se dice así, no como un cambio", () => {
    const c = cambio({
      tabla: "public.clientes",
      datos_antes: { nombre_completo: "Rosa Quispe", updated_at: "a" },
      datos_despues: { nombre_completo: "Rosa Quispe", updated_at: "b" },
    });
    expect(accion(c, NOMBRES)).toBe("guardó el cliente Rosa Quispe sin cambiar nada");
  });

  it("una tabla que no está en el catálogo se dice de forma genérica, sin fallar", () => {
    const c = cambio({
      tabla: "public.tabla_del_futuro",
      operacion: "INSERT",
      datos_despues: { campo_nuevo: 1 },
    });
    expect(accion(c, NOMBRES)).toBe("creó un registro de tabla_del_futuro");
    expect(diferencias(c, NOMBRES)).toEqual([
      { campo: "campo_nuevo", etiqueta: "Campo nuevo", antes: "—", despues: "1" },
    ]);
  });
});

describe("idsReferidos", () => {
  it("junta, sin repetir, los ids a los que apuntan las filas", () => {
    const filas = [
      cambio({ datos_antes: { zona_id: "z1" }, datos_despues: { zona_id: "z2" } }),
      cambio({ datos_despues: { insumo_id: "i1", unidad_id: "kg", zona_id: "z1", nombre: "x" } }),
    ];
    expect(idsReferidos(filas).sort()).toEqual(["i1", "kg", "z1", "z2"]);
  });
});
