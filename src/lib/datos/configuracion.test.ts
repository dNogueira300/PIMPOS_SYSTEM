import { describe, expect, it } from "vitest";

import {
  describirTramos,
  direccionCompleta,
  enlaceWhatsApp,
  formatearHora,
  type Configuracion,
} from "./configuracion";

// Estas funciones no tocan la base: convierten lo que el negocio escribe en el
// panel en lo que lee un vecino. Se prueban aparte porque un error aqui no
// rompe nada, solo hace que la pagina diga algo que no es.

function config(parcial: Partial<Configuracion>): Configuracion {
  return {
    nombre_comercial: "Panadería Pimpo's",
    razon_social: "",
    eslogan: "",
    logo_url: "/marca/logo.webp",
    logo_alt: "Panadería Pimpo's",
    isotipo_url: "/marca/isotipo.svg",
    favicon_url: "/marca/favicon.svg",
    telefono: "",
    whatsapp: "",
    correo: "",
    facebook: "",
    instagram: "",
    direccion: "",
    referencia: "",
    distrito: "",
    provincia: "",
    departamento: "",
    coordenadas: null,
    horario_semanal: {},
    nota_horarios: "",
    historia: "",
    mision: "",
    vision: "",
    valores: [],
    ...parcial,
  };
}

describe("formatearHora", () => {
  it("convierte el formato de 24 horas al que se usa al hablar", () => {
    // La base guarda "04:00" porque es lo que ordena bien. Un vecino lee
    // "4:00 a. m.", y esa es toda la razon de esta funcion.
    expect(formatearHora("04:00")).toBe("4:00 a. m.");
    expect(formatearHora("13:00")).toBe("1:00 p. m.");
    expect(formatearHora("21:30")).toBe("9:30 p. m.");
  });

  it("trata la medianoche y el mediodia como los llama la gente", () => {
    // Los dos casos donde la aritmetica de 12 falla si se escribe rapido:
    // 0 y 12 no son "0:00 a. m." ni "0:00 p. m.".
    expect(formatearHora("00:00")).toBe("12:00 a. m.");
    expect(formatearHora("12:00")).toBe("12:00 p. m.");
    expect(formatearHora("12:45")).toBe("12:45 p. m.");
  });

  it("devuelve tal cual lo que no sabe leer", () => {
    // El valor lo escribe una persona en el panel. Si escribe cualquier cosa,
    // la pagina la muestra tal cual en vez de imprimir "NaN:NaN".
    expect(formatearHora("mediodía")).toBe("mediodía");
    expect(formatearHora("")).toBe("");
  });
});

describe("describirTramos", () => {
  it("une los dos turnos del dia", () => {
    // La panaderia abre en dos turnos (ficha 1.9), y el segundo importa: quien
    // llega a las 3 de la tarde tiene que saber que a las 4 vuelve a abrir.
    expect(
      describirTramos([
        { desde: "04:00", hasta: "13:00" },
        { desde: "16:00", hasta: "21:00" },
      ]),
    ).toBe("4:00 a. m. a 1:00 p. m. y 4:00 p. m. a 9:00 p. m.");
  });

  it("dice Cerrado cuando no hay ningun turno", () => {
    // El domingo llega como lista vacia. Dejarlo en blanco haria pensar que
    // falta el dato, no que el negocio descansa.
    expect(describirTramos([])).toBe("Cerrado");
  });
});

describe("direccionCompleta", () => {
  it("se salta las partes vacias", () => {
    // `referencia` viene vacia en la ficha y puede seguir asi. Unir con comas a
    // ciegas dejaria "Calle Elías Aguirre 1321, , Belén" en la portada.
    expect(
      direccionCompleta(
        config({
          direccion: "Calle Elías Aguirre 1321",
          distrito: "Belén",
          provincia: "",
          departamento: "Loreto",
        }),
      ),
    ).toBe("Calle Elías Aguirre 1321, Belén, Loreto");
  });

  it("devuelve cadena vacia si no hay nada cargado", () => {
    expect(direccionCompleta(config({}))).toBe("");
  });
});

describe("enlaceWhatsApp", () => {
  it("limpia el numero y lleva el mensaje escrito", () => {
    const enlace = enlaceWhatsApp(config({ whatsapp: "+51 947 874 820" }), "Hola, ¿tienen pan?");

    // wa.me solo acepta digitos. Si alguien escribe el numero con espacios o
    // con "+" desde el panel, el enlace tiene que seguir funcionando.
    expect(enlace).toContain("https://wa.me/51947874820");
    // El mensaje va codificado: sin esto, un "¿" o un espacio parten la URL.
    expect(enlace).toContain("text=Hola%2C%20%C2%BFtienen%20pan%3F");
  });

  it("devuelve null si el negocio no cargo su numero", () => {
    // Un boton de WhatsApp que lleva a wa.me sin numero es peor que no tenerlo:
    // el cliente cree que escribio y nadie recibe nada.
    expect(enlaceWhatsApp(config({ whatsapp: "" }), "Hola")).toBeNull();
    expect(enlaceWhatsApp(config({ whatsapp: "sin numero" }), "Hola")).toBeNull();
  });
});
