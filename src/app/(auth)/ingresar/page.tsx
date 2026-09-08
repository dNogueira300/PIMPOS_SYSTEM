import type { Metadata } from "next";
import { Suspense } from "react";

import { FormularioIngreso } from "./formulario";

export const metadata: Metadata = {
  title: "Ingresar",
  // El panel es privado: no tiene por que aparecer en buscadores.
  robots: { index: false, follow: false },
};

const MOTIVOS: Readonly<Record<string, string>> = {
  "sin-permisos":
    "Tu cuenta todavía no tiene permisos asignados. Pide a un administrador que la active.",
};

/**
 * `searchParams` es dato de la peticion: con Cache Components hay que leerlo
 * dentro de un `<Suspense>` para que la cascara de la pagina siga siendo
 * estatica. La cabecera se pinta enseguida y solo el formulario espera.
 */
export default function Ingresar(props: PageProps<"/ingresar">) {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-sm flex-col justify-center gap-6 px-6 py-12">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold">Panadería Pimpo&apos;s</h1>
        <p className="text-muted-foreground text-sm">Panel de gestión</p>
      </div>

      <Suspense fallback={<p className="text-muted-foreground text-sm">Cargando...</p>}>
        <Formulario searchParams={props.searchParams} />
      </Suspense>
    </main>
  );
}

async function Formulario({ searchParams }: Pick<PageProps<"/ingresar">, "searchParams">) {
  const parametros = await searchParams;

  const volver = typeof parametros.volver === "string" ? parametros.volver : null;
  const motivo = typeof parametros.motivo === "string" ? MOTIVOS[parametros.motivo] : undefined;

  return (
    <>
      {motivo ? (
        <p role="status" data-testid="motivo-ingreso" className="bg-muted rounded-md p-3 text-sm">
          {motivo}
        </p>
      ) : null}

      <FormularioIngreso volver={volver} />
    </>
  );
}
