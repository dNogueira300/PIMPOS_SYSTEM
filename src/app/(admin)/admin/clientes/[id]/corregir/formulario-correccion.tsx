"use client";

import { BarraGuardar } from "@/components/panel/barra-guardar";
import { Campo } from "@/components/panel/campo";
import { FormularioPanel } from "@/components/panel/formulario-panel";
import { FotosCliente } from "@/components/panel/fotos-cliente";
import { SelectorUbicacion } from "@/components/panel/selector-ubicacion";
import { corregirCliente } from "@/lib/acciones/clientes";
import type { FichaCliente } from "@/lib/clientes/datos";
import { claveDeBorrador } from "@/lib/panel/borrador";
import { validarCorreccion } from "@/lib/validaciones/cliente";

/** Lo que el repartidor descubre en la puerta (decisión 2): referencia, punto y fotos. */
export function FormularioCorreccion({
  cliente,
  puedeQuitarFotos,
}: {
  cliente: FichaCliente;
  puedeQuitarFotos: boolean;
}) {
  return (
    <FormularioPanel
      clave={claveDeBorrador("correccion-cliente", cliente.id)}
      accion={corregirCliente}
      validar={validarCorreccion}
      destino={() => `/admin/clientes/${cliente.id}`}
    >
      <input type="hidden" name="id" value={cliente.id} />
      <Campo
        nombre="referencia"
        etiqueta="Referencia"
        ayuda="Cómo reconocer la casa: color del portón, qué hay al frente."
      >
        {(p) => <input {...p} defaultValue={cliente.referencia ?? ""} />}
      </Campo>
      <SelectorUbicacion
        opcional
        instruccion="Toca la casa en el mapa o, si estás en la puerta, usa tu ubicación."
        inicial={
          cliente.latitud !== null && cliente.longitud !== null
            ? { lat: cliente.latitud, lng: cliente.longitud }
            : null
        }
      />
      <FotosCliente clienteId={cliente.id} fotos={cliente.fotos} puedeQuitar={puedeQuitarFotos} />
      <BarraGuardar volver={`/admin/clientes/${cliente.id}`} />
    </FormularioPanel>
  );
}
