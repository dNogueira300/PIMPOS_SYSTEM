import { Suspense } from "react";

import { EncabezadoPanel } from "@/components/panel/encabezado-panel";
import { exigirAcceso } from "@/lib/auth/sesion";
import { zonasActivas } from "@/lib/clientes/datos";
import { textoDelPermiso } from "@/lib/clientes/permiso";
import { obtenerConfiguracion } from "@/lib/datos/configuracion";
import { numeroParaLeer } from "@/lib/datos/pedido";

import { FormularioCliente } from "../formulario-cliente";

export default function NuevoCliente() {
  return (
    <>
      <EncabezadoPanel
        titulo="Nuevo cliente"
        descripcion="Antes de guardar, léele el texto de la pestaña Permiso."
        volver={{ ruta: "/admin/clientes", nombre: "Clientes" }}
      />
      <Suspense fallback={<p className="text-muted-foreground text-sm">Cargando…</p>}>
        <Formulario />
      </Suspense>
    </>
  );
}

async function Formulario() {
  await exigirAcceso("/admin/clientes/nuevo");
  const [zonas, config] = await Promise.all([zonasActivas(), obtenerConfiguracion()]);
  const texto = textoDelPermiso(numeroParaLeer(config.whatsapp) ?? config.whatsapp);
  return <FormularioCliente cliente={null} zonas={zonas} textoPermiso={texto} />;
}
