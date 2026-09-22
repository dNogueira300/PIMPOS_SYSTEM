import { puedeAcceder, type Rol } from "@/lib/auth/roles";

/**
 * Las secciones del panel, en el orden en que se muestran.
 *
 * Aquí se decide qué se ENSEÑA; quién puede ENTRAR lo decide `roles.ts` y, de
 * verdad, la RLS. Por eso cada sección se filtra con `puedeAcceder`: si un rol
 * pierde acceso a una ruta, pierde también el botón, sin tocar este archivo.
 */
export type NombreIcono = "inicio" | "contenido" | "usuarios" | "configuracion";

export type SeccionPanel = {
  ruta: string;
  nombre: string;
  icono: NombreIcono;
  /** Va en la barra inferior del celular; si no, dentro de «Más». */
  enBarraInferior: boolean;
};

export const SUBSECCIONES_DE_CONTENIDO = [
  { ruta: "/admin/contenido/productos", nombre: "Productos" },
  { ruta: "/admin/contenido/categorias", nombre: "Categorías" },
  { ruta: "/admin/contenido/novedades", nombre: "Novedades" },
  { ruta: "/admin/contenido/portada", nombre: "Portada" },
  { ruta: "/admin/contenido/galeria", nombre: "Galería" },
  { ruta: "/admin/contenido/preguntas", nombre: "Preguntas frecuentes" },
  { ruta: "/admin/contenido/guias", nombre: "Guías" },
  { ruta: "/admin/contenido/testimonios", nombre: "Testimonios" },
] as const;

const SECCIONES: readonly SeccionPanel[] = [
  { ruta: "/admin", nombre: "Inicio", icono: "inicio", enBarraInferior: true },
  { ruta: "/admin/contenido", nombre: "Contenido", icono: "contenido", enBarraInferior: true },
  { ruta: "/admin/usuarios", nombre: "Usuarios", icono: "usuarios", enBarraInferior: true },
  {
    ruta: "/admin/configuracion",
    nombre: "Configuración",
    icono: "configuracion",
    enBarraInferior: false,
  },
];

export function seccionesPara(rol: Rol): SeccionPanel[] {
  return SECCIONES.filter((seccion) => puedeAcceder(rol, seccion.ruta));
}

/** `/admin` solo se marca activo en sí mismo; el resto, en cualquier subruta. */
export function esSeccionActiva(actual: string, ruta: string): boolean {
  if (ruta === "/admin") return actual === "/admin";
  return actual === ruta || actual.startsWith(`${ruta}/`);
}
