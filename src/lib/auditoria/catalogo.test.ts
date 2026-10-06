import { describe, expect, it } from "vitest";

import { HIJOS_DE, infoDeTabla, SECCIONES, TABLAS_AUDITADAS, tablasVisibles } from "./catalogo";

describe("catálogo de tablas", () => {
  it("cubre las 25 tablas auditadas (la misma lista que fija el pgTAP de 0045)", () => {
    expect(TABLAS_AUDITADAS).toHaveLength(25);
    for (const tabla of TABLAS_AUDITADAS) {
      const info = infoDeTabla(`public.${tabla}`);
      expect(info.conocida, tabla).toBe(true);
      expect(
        SECCIONES.map((s) => s.valor),
        tabla,
      ).toContain(info.seccion);
    }
  });

  it("nombra cada cosa con su artículo, y a quien cuelga, con su dueño", () => {
    expect(infoDeTabla("public.productos").referencia({ nombre: "Pan francés" }, {})).toBe(
      "el producto Pan francés",
    );
    expect(
      infoDeTabla("public.producto_variantes").referencia(
        { nombre: "Unidad", producto_id: "p1" },
        { p1: "Pan francés" },
      ),
    ).toBe("la presentación Unidad de Pan francés");
    expect(infoDeTabla("public.zonas_reparto").referencia({ nombre: "Belén" }, {})).toBe(
      "la zona Belén",
    );
  });

  it("si el dueño ya no existe, lo dice en vez de fallar (Review Focus)", () => {
    expect(
      infoDeTabla("public.producto_variantes").referencia(
        { nombre: "Unidad", producto_id: "x" },
        {},
      ),
    ).toBe("la presentación Unidad de un producto que ya no existe");
    expect(infoDeTabla("public.productos").referencia({}, {})).toBe("un producto");
  });

  it("una tabla que no está en el catálogo se dice de forma genérica", () => {
    const info = infoDeTabla("public.tabla_del_futuro");
    expect(info.conocida).toBe(false);
    expect(info.interna).toBe(true);
    expect(info.referencia({ nombre: "X" }, {})).toBe("un registro de tabla_del_futuro");
  });

  it("las tablas internas no salen en la lista llana", () => {
    const visibles = tablasVisibles();
    for (const interna of ["movimiento_lotes", "lotes_insumo", "almacenes", "roles"]) {
      expect(visibles).not.toContain(`public.${interna}`);
    }
    expect(visibles).toContain("public.movimientos_insumo");
    expect(visibles).toHaveLength(21);
  });

  it("una sección trae solo sus tablas visibles", () => {
    expect(tablasVisibles("clientes").sort()).toEqual([
      "public.cliente_fotos",
      "public.clientes",
      "public.consentimientos",
      "public.zonas_reparto",
    ]);
    expect(tablasVisibles("insumos")).not.toContain("public.lotes_insumo");
  });

  it("lleva a la pantalla del registro, o a la de su dueño", () => {
    expect(infoDeTabla("public.productos").ruta?.({ id: "p1" })).toBe(
      "/admin/contenido/productos/p1",
    );
    expect(infoDeTabla("public.producto_variantes").ruta?.({ producto_id: "p1" })).toBe(
      "/admin/contenido/productos/p1",
    );
    expect(infoDeTabla("public.clientes").ruta?.({ id: "c1" })).toBe("/admin/clientes/c1");
    expect(infoDeTabla("public.movimiento_lotes").ruta).toBeUndefined();
  });

  it("sabe qué cuelga de un producto, de un insumo y de un cliente («Ver historial»)", () => {
    expect(HIJOS_DE.producto).toEqual({ tabla: "public.productos", campo: "producto_id" });
    expect(HIJOS_DE.insumo.campo).toBe("insumo_id");
    expect(HIJOS_DE.cliente.campo).toBe("cliente_id");
  });

  it("un dato de la configuración se nombra como en su formulario, no por su clave", () => {
    const info = infoDeTabla("public.configuracion_sitio");
    expect(info.referencia({ clave: "horario_semanal" }, {})).toBe(
      "el horario de atención, en la configuración",
    );
    expect(info.referencia({ clave: "dias_aviso_vencimiento" }, {})).toBe(
      "los días de aviso de vencimiento, en la configuración",
    );
    // Una clave nueva que el catálogo no conoce se dice de forma genérica.
    expect(info.referencia({ clave: "otra_cosa" }, {})).toBe(
      "el dato «otra_cosa» de la configuración",
    );
  });
});
