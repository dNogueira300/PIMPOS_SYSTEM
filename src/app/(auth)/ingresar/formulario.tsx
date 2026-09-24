"use client";

import { useActionState, useEffect } from "react";

import { iniciarSesion, type EstadoIngreso } from "@/lib/acciones/autenticacion";
import { Button } from "@/components/ui/button";
import { olvidarBorradoresDelNavegador } from "@/lib/panel/borrador";

const ESTADO_INICIAL: EstadoIngreso = {};

export function FormularioIngreso({ volver }: { volver: string | null }) {
  const [estado, accion, enviando] = useActionState(iniciarSesion, ESTADO_INICIAL);

  // Aquí solo llega quien no tiene sesión (con sesión, el proxy lo manda al
  // panel): cerró sesión, o se la cerraron al desactivarlo, cambiarle el rol o
  // restablecer su contraseña. Las copias locales de formularios eran de esa
  // sesión y no deben quedar para quien entre después en el mismo celular.
  // Cubre también la copia que el formulario guarde justo tras pulsar «Cerrar
  // sesión», con el temporizador aún corriendo.
  useEffect(() => {
    olvidarBorradoresDelNavegador();
  }, []);

  return (
    <form action={accion} className="flex flex-col gap-4" noValidate>
      {volver ? <input type="hidden" name="volver" value={volver} /> : null}

      <div className="flex flex-col gap-1.5">
        <label htmlFor="correo" className="text-sm font-medium">
          Correo
        </label>
        <input
          id="correo"
          name="correo"
          type="email"
          autoComplete="email"
          required
          aria-describedby={estado.errores?.correo ? "error-correo" : undefined}
          aria-invalid={estado.errores?.correo ? true : undefined}
          className="border-input min-h-11 rounded-md border px-3 py-2 text-base"
        />
        {estado.errores?.correo ? (
          <p id="error-correo" className="text-destructive text-sm">
            {estado.errores.correo[0]}
          </p>
        ) : null}
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="clave" className="text-sm font-medium">
          Contraseña
        </label>
        <input
          id="clave"
          name="clave"
          type="password"
          autoComplete="current-password"
          required
          aria-describedby={estado.errores?.clave ? "error-clave" : undefined}
          aria-invalid={estado.errores?.clave ? true : undefined}
          className="border-input min-h-11 rounded-md border px-3 py-2 text-base"
        />
        {estado.errores?.clave ? (
          <p id="error-clave" className="text-destructive text-sm">
            {estado.errores.clave[0]}
          </p>
        ) : null}
      </div>

      {/* role="alert" para que un lector de pantalla lo anuncie al aparecer. */}
      {estado.mensaje ? (
        <p
          role="alert"
          data-testid="error-ingreso"
          className="border-destructive/40 text-destructive rounded-md border p-3 text-sm"
        >
          {estado.mensaje}
        </p>
      ) : null}

      <Button type="submit" disabled={enviando} className="min-h-11 w-full">
        {enviando ? "Entrando…" : "Entrar"}
      </Button>
    </form>
  );
}
