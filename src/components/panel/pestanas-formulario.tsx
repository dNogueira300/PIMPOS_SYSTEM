"use client";

import { useEffect, useState, type ReactNode } from "react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { useFormularioPanel } from "./formulario-panel";

export type Pestana = {
  valor: string;
  titulo: string;
  /** Los `name` de los campos que viven en esta pestaña. */
  campos: readonly string[];
  contenido: ReactNode;
};

/**
 * Radix desmonta el contenido de las pestañas que no se ven, y un campo
 * desmontado no llega al FormData: se guardaría el producto sin sus precios.
 * Por eso todas llevan `forceMount` y se esconden con CSS.
 */
export function PestanasFormulario({ pestanas }: { pestanas: readonly Pestana[] }) {
  const { errores, registrarAlFallar } = useFormularioPanel();
  const [activa, setActiva] = useState(pestanas[0]?.valor ?? "");

  // Solo registra el aviso; el cambio de pestaña ocurre dentro del envío.
  useEffect(
    () =>
      registrarAlFallar((nuevos) => {
        const conError = pestanas.find((p) => p.campos.some((c) => nuevos[c]?.length));
        if (conError) setActiva(conError.valor);
      }),
    [registrarAlFallar, pestanas],
  );

  return (
    <Tabs value={activa} onValueChange={setActiva}>
      <TabsList
        className="grid w-full"
        style={{ gridTemplateColumns: `repeat(${pestanas.length}, minmax(0, 1fr))` }}
      >
        {pestanas.map((p) => {
          const conError = p.campos.some((c) => errores[c]?.length);
          return (
            <TabsTrigger
              key={p.valor}
              value={p.valor}
              data-con-error={conError || undefined}
              className="data-[con-error]:text-destructive min-h-11"
            >
              {p.titulo}
              {conError ? (
                <>
                  <span
                    aria-hidden
                    className="bg-destructive ml-1.5 inline-block size-2 rounded-full"
                  />
                  <span className="sr-only"> (tiene errores)</span>
                </>
              ) : null}
            </TabsTrigger>
          );
        })}
      </TabsList>
      {pestanas.map((p) => (
        <TabsContent
          key={p.valor}
          value={p.valor}
          forceMount
          className="bg-card mt-3 flex flex-col gap-4 rounded-xl border p-4 data-[state=inactive]:hidden"
        >
          {p.contenido}
        </TabsContent>
      ))}
    </Tabs>
  );
}
