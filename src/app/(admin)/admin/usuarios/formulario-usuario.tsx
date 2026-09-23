"use client";

import { useState } from "react";

import { BarraGuardar } from "@/components/panel/barra-guardar";
import { Campo } from "@/components/panel/campo";
import { FormularioPanel } from "@/components/panel/formulario-panel";
import { crearUsuarioDelPanel, guardarUsuario } from "@/lib/acciones/usuarios";
import { NOMBRE_DEL_ROL, type Rol } from "@/lib/auth/roles";
import { claveDeBorrador } from "@/lib/panel/borrador";
import { validarUsuario } from "@/lib/validaciones/usuario";

import { ClaveTemporal } from "./clave-temporal";

export type UsuarioEditable = {
  id: string;
  nombre_completo: string;
  correo: string;
  celular: string | null;
  rol: Rol;
};

const VOLVER = "/admin/usuarios";

const DESCRIPCION_DEL_ROL: Record<Rol, string> = {
  superadmin: "Todo, y es el único que elimina usuarios.",
  administrador: "Todo el panel y aprueba promociones.",
  ingeniero: "Contenido e insumos. Sus promociones pasan por un administrador.",
  repartidor: "Solo clientes, para el reparto.",
};

type Props = { usuario: UsuarioEditable | null; rolesAsignables: Rol[] };

export function FormularioUsuario({ usuario, rolesAsignables }: Props) {
  const [creada, setCreada] = useState<{ correo: string; clave: string } | null>(null);

  if (creada) return <ClaveTemporal correo={creada.correo} clave={creada.clave} />;

  return (
    <FormularioPanel
      clave={claveDeBorrador("usuario", usuario?.id ?? null)}
      accion={usuario ? guardarUsuario : crearUsuarioDelPanel}
      validar={validarUsuario}
      {...(usuario
        ? { destino: () => VOLVER }
        : {
            alGuardar: (r) => {
              if (r.extra?.clave && r.extra.correo)
                setCreada({ clave: r.extra.clave, correo: r.extra.correo });
            },
          })}
    >
      <input type="hidden" name="id" value={usuario?.id ?? ""} />
      <div className="bg-card flex flex-col gap-4 rounded-xl border p-4">
        <Campo nombre="nombre_completo" etiqueta="Nombre y apellido">
          {(p) => <input {...p} defaultValue={usuario?.nombre_completo ?? ""} autoComplete="off" />}
        </Campo>
        <Campo
          nombre="correo"
          etiqueta="Correo"
          ayuda={usuario ? "El correo no se puede cambiar." : "Con él entrará al panel."}
        >
          {(p) => (
            <input
              {...p}
              type="email"
              defaultValue={usuario?.correo ?? ""}
              readOnly={Boolean(usuario)}
              autoComplete="off"
            />
          )}
        </Campo>
        <Campo nombre="celular" etiqueta="Celular" opcional>
          {(p) => (
            <input {...p} type="tel" inputMode="numeric" defaultValue={usuario?.celular ?? ""} />
          )}
        </Campo>
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-1 text-sm font-semibold">Rol</legend>
          {rolesAsignables.map((rol) => (
            <label key={rol} className="flex min-h-12 items-center gap-3 rounded-lg border p-3">
              {/* 44 px como el interruptor: la prueba de área táctil mide el input. */}
              <input
                type="radio"
                name="rol"
                value={rol}
                defaultChecked={usuario ? usuario.rol === rol : rol === "repartidor"}
                className="accent-primary size-11 shrink-0"
              />
              <span>
                <span className="font-semibold">{NOMBRE_DEL_ROL[rol]}</span>
                <span className="text-muted-foreground block text-sm">
                  {DESCRIPCION_DEL_ROL[rol]}
                </span>
              </span>
            </label>
          ))}
        </fieldset>
      </div>
      <BarraGuardar volver={VOLVER} />
    </FormularioPanel>
  );
}
