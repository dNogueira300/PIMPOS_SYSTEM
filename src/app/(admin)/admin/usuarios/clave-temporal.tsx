"use client";

import { Copy } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";

/**
 * Se ve una sola vez: vive solo en el estado de este componente. Al salir de
 * la pantalla no hay forma de volver a verla (ni en el navegador ni en la
 * base); si se pierde, se genera otra con «Darle una contraseña temporal nueva».
 */
export function ClaveTemporal({ correo, clave }: { correo: string; clave: string }) {
  const [copiada, setCopiada] = useState(false);

  async function copiar() {
    try {
      await navigator.clipboard.writeText(clave);
      setCopiada(true);
    } catch {
      toast.error("No se pudo copiar. Anótala a mano.");
    }
  }

  return (
    <section
      aria-labelledby="clave-titulo"
      className="bg-card mt-4 flex flex-col gap-4 rounded-xl border p-5"
      data-clave-temporal
    >
      {/* El foco salta aquí para que un lector de pantalla lo anuncie. */}
      <h2
        id="clave-titulo"
        tabIndex={-1}
        ref={(titulo) => titulo?.focus()}
        className="font-heading text-primary text-2xl outline-none"
      >
        Contraseña temporal
      </h2>
      <p>
        Para <strong className="break-all">{correo}</strong>. Dásela en persona o por WhatsApp.{" "}
        <strong>No se vuelve a mostrar.</strong> Al entrar, el panel le pedirá que elija una suya.
      </p>
      <output
        className="bg-muted rounded-lg p-4 text-center font-mono text-2xl tracking-widest break-all"
        data-clave
      >
        {clave}
      </output>
      <div className="flex flex-wrap gap-2">
        <button type="button" className="boton-linea" onClick={copiar}>
          <Copy aria-hidden className="size-5" /> {copiada ? "Copiada" : "Copiar"}
        </button>
        <Link href="/admin/usuarios" className="boton-cta">
          Listo, ya la anoté
        </Link>
      </div>
    </section>
  );
}
