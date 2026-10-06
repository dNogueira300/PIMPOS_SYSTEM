import Link from "next/link";

const PESTANAS = [
  { valor: "cambios", nombre: "Cambios", ruta: "/admin/auditoria" },
  { valor: "ingresos", nombre: "Ingresos", ruta: "/admin/auditoria/ingresos" },
  { valor: "borrados", nombre: "Datos borrados", ruta: "/admin/auditoria/borrados" },
  { valor: "descargas", nombre: "Descargas", ruta: "/admin/auditoria/descargas" },
] as const;

export type PestanaHistorial = (typeof PESTANAS)[number]["valor"];

/** Las cuatro vistas del historial. Son enlaces: cada una tiene su dirección. */
export function PestanasHistorial({ activa }: { activa: PestanaHistorial }) {
  return (
    <nav aria-label="Vistas del historial" className="mb-4 flex flex-wrap gap-2">
      {PESTANAS.map((p) => (
        <Link
          key={p.valor}
          href={p.ruta}
          className={p.valor === activa ? "boton-cta" : "boton-linea"}
          aria-current={p.valor === activa ? "page" : undefined}
        >
          {p.nombre}
        </Link>
      ))}
    </nav>
  );
}
