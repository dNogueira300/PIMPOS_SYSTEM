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
      <ul className="tarjeta bg-muted inline-flex max-w-full flex-wrap gap-1 rounded-md p-1.5">
        {opciones.map(({ slug, nombre }) => {
          const seleccionada = activa === slug || (slug === null && activa === null);
          return (
            <li key={slug ?? "todos"}>
              <Link
                href={slug === null ? "/productos" : `/productos?categoria=${slug}`}
                aria-current={seleccionada ? "true" : undefined}
                scroll={false}
                className={`focus-visible:outline-ring min-h-tactil flex max-w-full items-center rounded-md px-4 text-sm wrap-anywhere transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 ${
                  seleccionada
                    ? "bg-primary text-primary-foreground font-medium"
                    : "text-foreground hover:bg-background"
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
