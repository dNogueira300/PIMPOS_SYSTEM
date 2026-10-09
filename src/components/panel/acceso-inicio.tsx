import { ChevronRight, Contact, History, LayoutGrid, Package, Settings, Users } from "lucide-react";
import Link from "next/link";

import type { NombreIcono, SeccionPanel } from "@/lib/panel/navegacion";

const PRESENTACION: Partial<Record<NombreIcono, { icono: typeof Package; descripcion: string }>> = {
  contenido: { icono: LayoutGrid, descripcion: "Productos y contenido del sitio" },
  insumos: { icono: Package, descripcion: "Existencias y movimientos" },
  clientes: { icono: Contact, descripcion: "Fichas, zonas y reparto" },
  usuarios: { icono: Users, descripcion: "Cuentas y permisos" },
  historial: { icono: History, descripcion: "Cambios y registros de acceso" },
  configuracion: { icono: Settings, descripcion: "Datos del negocio y marca" },
};

/** Presentación de los mismos destinos filtrados por seccionesPara, sin consulta propia. */
export function AccesoInicio({ seccion }: { seccion: SeccionPanel }) {
  const presentacion = PRESENTACION[seccion.icono];
  const Icono = presentacion?.icono;
  return (
    <Link
      href={seccion.ruta}
      data-seccion={seccion.nombre}
      aria-label={seccion.nombre}
      className="bg-card hover:border-primary relative grid h-full min-h-[150px] content-start gap-2 rounded-md border p-4 wrap-anywhere xl:min-h-[166px] xl:p-[18px]"
    >
      {Icono ? (
        <span className="bg-muted text-primary grid size-9 place-items-center rounded-sm">
          <Icono aria-hidden className="size-5" />
        </span>
      ) : null}
      <strong className="text-[15px] font-semibold">{seccion.nombre}</strong>
      {presentacion ? (
        <span className="text-muted-foreground text-xs leading-relaxed">
          {presentacion.descripcion}
        </span>
      ) : null}
      <ChevronRight aria-hidden className="text-muted-foreground absolute top-6 right-3 size-4" />
    </Link>
  );
}
