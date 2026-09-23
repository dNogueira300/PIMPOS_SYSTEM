"use client";

import { Campo } from "@/components/panel/campo";
import { FormularioPanel } from "@/components/panel/formulario-panel";
import { cambiarMiClave } from "@/lib/acciones/usuarios";
import { validarCambioClave } from "@/lib/validaciones/usuario";

/**
 * Los dos campos son `password`: `FormularioPanel` no los copia al navegador
 * (y `e2e/panel-usuarios.spec.ts` lo comprueba mirando `localStorage`).
 */
export function FormularioCambioClave() {
  return (
    <FormularioPanel
      clave="pimpos:borrador:cambiar-clave:sin-copia"
      accion={cambiarMiClave}
      validar={validarCambioClave}
      destino={() => "/admin"}
    >
      <Campo
        nombre="clave"
        etiqueta="Contraseña nueva"
        ayuda="Al menos 10 caracteres. Que no sea la temporal."
      >
        {(p) => <input {...p} type="password" autoComplete="new-password" />}
      </Campo>
      <Campo nombre="repetir" etiqueta="Repítela">
        {(p) => <input {...p} type="password" autoComplete="new-password" />}
      </Campo>
      <button type="submit" className="boton-cta">
        Guardar y entrar
      </button>
    </FormularioPanel>
  );
}
