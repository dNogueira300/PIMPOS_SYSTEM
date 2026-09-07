import type { Database } from "@/tipos/database.types";

/**
 * Los 4 roles del sistema. El tipo sale del esquema real: si alguien anade un
 * valor al enum `app.rol_usuario` y regenera los tipos, este archivo deja de
 * compilar hasta que se decida que permisos tiene el rol nuevo.
 */
export type Rol = Database["public"]["Tables"]["perfiles"]["Row"]["rol"];

export const ROLES = [
  "superadmin",
  "administrador",
  "ingeniero",
  "repartidor",
] as const satisfies readonly Rol[];

/** Estrecha un valor desconocido (p. ej. un claim del JWT) a un Rol. */
export function esRol(valor: unknown): valor is Rol {
  return typeof valor === "string" && (ROLES as readonly string[]).includes(valor);
}

/**
 * Que rol entra a que seccion del panel (doc 03 §5.2, doc de stack §7).
 *
 * El orden importa: se busca el prefijo mas largo que coincida, para que
 * `/admin/usuarios` no herede los permisos de `/admin`.
 *
 * Esto es una comodidad de navegacion, NO el control de acceso. La autorizacion
 * de verdad vive en las politicas RLS de Postgres: aunque esta tabla estuviera
 * mal, la base seguiria negando lo que debe negar.
 */
const ACCESO_POR_SECCION: ReadonlyArray<readonly [ruta: string, roles: readonly Rol[]]> = [
  ["/admin/usuarios", ["superadmin", "administrador"]],
  ["/admin/auditoria", ["superadmin", "administrador"]],
  ["/admin/configuracion", ["superadmin", "administrador"]],
  ["/admin/contenido", ["superadmin", "administrador", "ingeniero"]],
  ["/admin/insumos", ["superadmin", "administrador", "ingeniero"]],
  // El repartidor solo entra aqui: consulta y registra clientes para el reparto.
  ["/admin/clientes", ["superadmin", "administrador", "ingeniero", "repartidor"]],
  // El tablero lo ve cualquiera con sesion; cada tarjeta filtra su contenido.
  ["/admin", ["superadmin", "administrador", "ingeniero", "repartidor"]],
];

/** Devuelve los roles con acceso a una ruta del panel, o null si no es del panel. */
export function rolesConAcceso(ruta: string): readonly Rol[] | null {
  const entrada = ACCESO_POR_SECCION.filter(
    ([prefijo]) => ruta === prefijo || ruta.startsWith(`${prefijo}/`),
  )
    // El prefijo mas largo gana: /admin/usuarios antes que /admin.
    .sort((a, b) => b[0].length - a[0].length)[0];

  return entrada ? entrada[1] : null;
}

/** true si esa ruta pertenece al panel y por tanto exige sesion. */
export function esRutaDelPanel(ruta: string): boolean {
  return rolesConAcceso(ruta) !== null;
}

/**
 * true si el rol puede entrar a la ruta. Un rol nulo -- sin sesion, sin perfil,
 * o con el perfil desactivado -- nunca puede: falla cerrado, igual que
 * `app.es_rol()` en la base.
 */
export function puedeAcceder(rol: Rol | null, ruta: string): boolean {
  const permitidos = rolesConAcceso(ruta);
  if (permitidos === null) return true; // Fuera del panel: es publico.
  if (rol === null) return false;
  return permitidos.includes(rol);
}

/** Nombre legible del rol, para la interfaz. */
export const NOMBRE_DEL_ROL: Readonly<Record<Rol, string>> = {
  superadmin: "Super administrador",
  administrador: "Administrador",
  ingeniero: "Ingeniero",
  repartidor: "Repartidor",
};
