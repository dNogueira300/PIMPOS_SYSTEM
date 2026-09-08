"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

import type { CategoriaPublica } from "@/lib/datos/catalogo";

/**
 * Filtro por categoria del catalogo (doc 03 §4.3).
 *
 * El estado vive en la URL y no en el componente, a proposito: asi el cliente
 * puede mandar por WhatsApp el enlace de "los integrales", el buscador puede
 * indexar cada categoria, y el boton "atras" del navegador hace lo que se
 * espera. Un `useState` aqui perderia las tres cosas.
 *
 * Son enlaces, no botones: cada uno lleva a una URL de verdad.
 */
export function FiltroCategorias({ categorias }: { categorias: CategoriaPublica[] }) {
  const parametros = useSearchParams();
  const activa = parametros.get("categoria");

  const opciones = [{ slug: null, nombre: "Todos" }, ...categorias];

  return (
    <nav aria-label="Filtrar por categoría">
      <ul className="flex flex-wrap gap-2">
        {opciones.map(({ slug, nombre }) => {
          const seleccionada = activa === slug || (slug === null && activa === null);
          return (
            <li key={slug ?? "todos"}>
              <Link
                href={slug === null ? "/productos" : `/productos?categoria=${slug}`}
                aria-current={seleccionada ? "true" : undefined}
                scroll={false}
                className={`focus-visible:outline-ring min-h-tactil flex items-center rounded-full px-4 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 ${
                  seleccionada
                    ? "bg-primary text-primary-foreground font-medium"
                    : "bg-secondary text-secondary-foreground hover:bg-muted"
                }`}
              >
                {nombre}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
