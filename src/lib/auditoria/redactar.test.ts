import { describe, expect, it } from "vitest";

import {
  accion,
  type Cambio,
  diferencias,
  frase,
  fundir,
  idsPorTabla,
  idsReferidos,
  quien,
} from "./redactar";

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

describe("idsPorTabla", () => {
  it("reparte cada id a la tabla donde hay que buscar su nombre", () => {
    const filas = [
      cambio({ datos_antes: { zona_id: "z1" }, datos_despues: { zona_id: "z2" } }),
      cambio({
        datos_despues: { insumo_id: "i1", unidad_id: "kg", registrado_por: "u9", nombre: "x" },
      }),
    ];
    const ids = idsPorTabla(filas);
    expect(ids.zonas_reparto?.sort()).toEqual(["z1", "z2"]);
    expect(ids.insumos).toEqual(["i1"]);
    expect(ids.unidades_medida).toEqual(["kg"]);
    expect(ids.perfiles).toEqual(["u9"]);
    expect(Object.keys(ids)).toHaveLength(4);
  });
});

describe("fundir", () => {
  // Lo que deja de verdad un «Guardar» del formulario de producto
  // (`guardar_producto`, 0027): reescribe el producto, quita la marca de
  // principal, la vuelve a poner y reescribe cada presentación.
  const AHORA = "2026-10-06T15:00:00.000Z";
  const variante = (id: number, antes: object, despues: object, registro = "v1") =>
    cambio({
      id,
      tabla: "public.producto_variantes",
      registro_id: registro,
      ocurrido_en: AHORA,
      datos_antes: { nombre: "Unidad", producto_id: "p1", ...antes },
      datos_despues: { nombre: "Unidad", producto_id: "p1", ...despues },
    });
  const guardado = [
    variante(14, { precio: 0.2, updated_at: "a" }, { precio: 0.2, updated_at: "b" }, "v2"),
    variante(
      13,
      { es_predeterminada: false, precio: 0.2 },
      { es_predeterminada: true, precio: 0.25 },
    ),
    variante(
      12,
      { es_predeterminada: true, precio: 0.2 },
      { es_predeterminada: false, precio: 0.2 },
    ),
    cambio({
      id: 11,
      ocurrido_en: AHORA,
      datos_antes: { nombre: "Pan francés", updated_at: "a" },
      datos_despues: { nombre: "Pan francés", updated_at: "b" },
    }),
  ];

  it("de un guardado de producto queda una línea: el precio que cambió", () => {
    const lista = fundir(guardado);
    expect(lista).toHaveLength(1);
    expect(lista[0]?.id).toBe(13);
    expect(accion(lista[0]!, NOMBRES)).toBe(
      "cambió la presentación Unidad de Pan francés: Precio S/ 0.20 → S/ 0.25",
    );
  });

  it("no junta cambios de momentos distintos ni toca altas y eliminaciones", () => {
    const filas = [
      variante(3, { precio: 0.25 }, { precio: 0.3 }),
      {
        ...variante(2, { precio: 0.2 }, { precio: 0.25 }),
        ocurrido_en: "2026-10-05T15:00:00.000Z",
      },
      cambio({ id: 1, operacion: "INSERT", ocurrido_en: AHORA, datos_despues: { nombre: "Pan" } }),
    ];
    expect(fundir(filas).map((c) => c.id)).toEqual([3, 2, 1]);
  });

  it("conserva lo que no cambia de datos pero sí es noticia", () => {
    const tachada = cambio({
      id: 5,
      tabla: "public.clientes",
      registro_id: "c1",
      datos_antes: { borrado: true },
      datos_despues: { borrado: true },
    });
    const foto = cambio({
      id: 4,
      tabla: "public.cliente_fotos",
      registro_id: "f1",
      datos_antes: { cliente_id: "c1", ruta: "c1/a.webp", updated_at: "a" },
      datos_despues: { cliente_id: "c1", ruta: "c1/a.webp", updated_at: "b" },
    });
    expect(fundir([tachada, foto]).map((c) => c.id)).toEqual([5, 4]);
  });

  it("la configuración no tiene id: no se junta, pero un guardado sin cambio no sale", () => {
    const fila = (id: number, antes: unknown, despues: unknown) =>
      cambio({
        id,
        tabla: "public.configuracion_sitio",
        registro_id: null,
        ocurrido_en: AHORA,
        datos_antes: { clave: `k${id}`, valor: antes },
        datos_despues: { clave: `k${id}`, valor: despues },
      });
    expect(fundir([fila(2, "a", "b"), fila(1, "x", "x")]).map((c) => c.id)).toEqual([2]);
  });
});
