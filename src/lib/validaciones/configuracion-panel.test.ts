import { describe, expect, it } from "vitest";

import { esquemaConfiguracion } from "@/lib/datos/configuracion";

import { esquemaConfiguracionPanel, leerConfiguracion } from "./configuracion-panel";

const HORARIO = {
  lunes: [
    { desde: "04:00", hasta: "13:00" },
    { desde: "16:00", hasta: "21:00" },
  ],
  martes: [{ desde: "04:00", hasta: "13:00" }],
  miercoles: [],
  jueves: [],
  viernes: [],
  sabado: [],
  domingo: [],
};

function formulario(cambios: Record<string, string> = {}) {
  const base: Record<string, string> = {
    telefono: "065 123456",
    whatsapp: "947 874 820",
    correo: "contactopimpos@gmail.com",
    correo_alertas: "contactopimpos@gmail.com",
    dias_aviso_vencimiento: "15",
    direccion: "Calle Elías Aguirre 1321",
    referencia: "",
    distrito: "Belén",
    provincia: "Maynas",
    departamento: "Loreto",
    coordenadas: JSON.stringify({ lat: -3.7595, lng: -73.2516 }),
    horario_semanal: JSON.stringify(HORARIO),
    nota_horarios: "Domingos y feriados no hay atención.",
    delivery_zonas: "Iquitos\nBelén\n\nPunchana ",
    delivery_costo: "3",
    pedido_minimo: "10,00",
    delivery_tiempo: "30 a 45 minutos",
    formas_pago: "Efectivo\nYape",
    facebook: "",
    instagram: "https://instagram.com/pimpos",
    nombre_comercial: "Panadería Pimpo's",
    razon_social: "Panadería Pastelería y Bodega Pimpo's E.I.R.L.",
    eslogan: "Pan fresco, tradición de siempre",
    logo_url: "/marca/logo.webp",
    logo_alt: "Panadería Pimpo's",
    isotipo_url: "/marca/isotipo.svg",
    favicon_url: "/marca/favicon.svg",
    confirmar_delivery_costo: "on",
    ...cambios,
  };
  const fd = new FormData();
  for (const [k, v] of Object.entries(base)) fd.set(k, v);
  return fd;
}

describe("configuración desde el panel", () => {
  it("lo que guarda el panel lo acepta el esquema del sitio, sin caer a la reserva", () => {
    const panel = esquemaConfiguracionPanel.parse(leerConfiguracion(formulario()).valores);
    const sitio = esquemaConfiguracion.safeParse(panel);
    expect(sitio.success).toBe(true);
    expect(sitio.success && sitio.data.whatsapp).toBe("51947874820");
  });

  it("normaliza lo que escribe una persona: WhatsApp sin 51, precios con coma, líneas vacías", () => {
    const { valores } = leerConfiguracion(formulario());
    const r = esquemaConfiguracionPanel.parse(valores);
    expect(r.whatsapp).toBe("51947874820");
    expect(r.pedido_minimo).toBe(10);
    expect(r.delivery_zonas).toEqual(["Iquitos", "Belén", "Punchana"]);
  });

  it("recoge los datos confirmados", () => {
    expect(leerConfiguracion(formulario()).confirmadas).toEqual(["delivery_costo"]);
  });

  it("un WhatsApp que no es un celular peruano dice cómo escribirlo", () => {
    const r = esquemaConfiguracionPanel.safeParse(
      leerConfiguracion(formulario({ whatsapp: "12345" })).valores,
    );
    expect(!r.success && r.error.issues[0]?.message).toBe(
      "Escribe el celular de WhatsApp de 9 dígitos, por ejemplo 947 874 820.",
    );
  });

  it("un turno que cierra antes de abrir se rechaza", () => {
    const malo = { ...HORARIO, lunes: [{ desde: "13:00", hasta: "04:00" }] };
    const r = esquemaConfiguracionPanel.safeParse(
      leerConfiguracion(formulario({ horario_semanal: JSON.stringify(malo) })).valores,
    );
    expect(!r.success && r.error.issues.map((i) => i.message)).toContain(
      "La hora de cierre tiene que ser después de la de apertura.",
    );
  });

  it("el costo del delivery no puede quedar vacío: la base exige un número (0017)", () => {
    const r = esquemaConfiguracionPanel.safeParse(
      leerConfiguracion(formulario({ delivery_costo: "" })).valores,
    );
    expect(!r.success && r.error.issues[0]?.message).toBe("Escribe el costo. Pon 0 si es gratis.");
  });

  it("una red social tiene que ser un enlace completo o quedar vacía", () => {
    const r = esquemaConfiguracionPanel.safeParse(
      leerConfiguracion(formulario({ facebook: "facebook.com/pimpos" })).valores,
    );
    expect(!r.success && r.error.issues[0]?.message).toBe(
      "Pega el enlace completo, empezando por https://",
    );
  });
});
