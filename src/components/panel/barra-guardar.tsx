"use client";

import Link from "next/link";

import { useFormularioPanel } from "./formulario-panel";

/**
 * «Cancelar» y «Guardar» siempre a la vista. En el celular se queda justo
 * encima de la barra inferior de navegación, no debajo.
 */
export function BarraGuardar({ volver }: { volver: string }) {
  const { pendiente } = useFormularioPanel();
  return (
    <div className="bg-background/95 border-border sticky bottom-[calc(3.5rem+env(safe-area-inset-bottom))] z-30 -mx-4 grid grid-cols-2 gap-2 border-t px-4 py-3 md:bottom-0 md:mx-0 md:flex md:justify-end md:border-0 md:px-0">
      <Link href={volver} className="boton-linea">
        Cancelar
      </Link>
      <button type="submit" className="boton-cta" disabled={pendiente} aria-disabled={pendiente}>
        {pendiente ? "Guardando…" : "Guardar"}
      </button>
    </div>
  );
}
