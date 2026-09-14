"use client";

import { useState } from "react";
import { MessageCircle } from "lucide-react";

import { mensajeArmado, type PedidoArmado } from "@/lib/datos/pedido-armado";

const CAMPO =
  "bg-card border-input text-foreground focus-visible:border-primary focus-visible:ring-primary/15 placeholder:text-muted-foreground min-h-12 w-full rounded-[10px] border-[1.5px] px-4 text-base outline-none focus-visible:ring-[3px]";
const ETIQUETA = "text-foreground mb-1.5 block text-xs font-bold tracking-[0.06em] uppercase";

/**
 * «Arma tu pedido» (prototipo de Stitch, plan 03.1 tarea 8). Compone el mensaje
 * y abre WhatsApp: no envía nada a un servidor ni guarda datos personales.
 *
 * Recibe el número ya limpio y las zonas de la base; nunca importa
 * `configuracion.ts`, que arrastraría Supabase al navegador (CLAUDE.md).
 *
 * El botón no existe hasta que hay algo que pedir, en vez de estar desactivado:
 * un enlace no se puede desactivar de verdad, y uno que abre WhatsApp con un
 * pedido vacío es la pregunta que este bloque quiere ahorrar. El cambio se
 * anuncia (`aria-live`) para quien no lo ve aparecer.
 */
export function ArmaTuPedido({ numero, zonas }: { numero: string; zonas: readonly string[] }) {
  // Sin zona elegida de antemano: marcar la primera haría que medio Iquitos
  // pidiera «a Iquitos» sin haberlo decidido.
  const [pedido, setPedido] = useState<PedidoArmado>({
    nombre: "",
    zona: "",
    hora: "",
    productos: "",
  });
  const mensaje = mensajeArmado(pedido);
  const enlace = mensaje ? `https://wa.me/${numero}?text=${encodeURIComponent(mensaje)}` : null;

  const cambiar =
    (campo: keyof PedidoArmado) =>
    (evento: { target: { value: string } }): void =>
      setPedido((anterior) => ({ ...anterior, [campo]: evento.target.value }));

  return (
    <form
      aria-labelledby="titulo-arma-tu-pedido"
      className="tarjeta p-6 sm:p-8"
      onSubmit={(evento) => evento.preventDefault()}
    >
      <p className="sello">Pedido rápido</p>
      <h2
        id="titulo-arma-tu-pedido"
        className="font-heading text-primary mt-3 text-2xl font-semibold"
      >
        Arma tu pedido
      </h2>
      <p className="text-muted-foreground mt-2 text-sm text-pretty">
        Escribe lo que quieres y te abrimos WhatsApp con el mensaje listo. No se guarda nada.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <label className="sm:col-span-2">
          <span className={ETIQUETA}>Tu nombre</span>
          <input
            className={CAMPO}
            autoComplete="given-name"
            value={pedido.nombre}
            onChange={cambiar("nombre")}
          />
        </label>
        {zonas.length > 0 ? (
          <label>
            <span className={ETIQUETA}>Zona</span>
            <select className={CAMPO} value={pedido.zona} onChange={cambiar("zona")}>
              <option value="">Elige tu zona</option>
              {zonas.map((zona) => (
                <option key={zona} value={zona}>
                  {zona}
                </option>
              ))}
            </select>
          </label>
        ) : null}
        <label className={zonas.length > 0 ? undefined : "sm:col-span-2"}>
          <span className={ETIQUETA}>Hora de entrega</span>
          <input
            className={CAMPO}
            placeholder="Lo antes posible"
            value={pedido.hora}
            onChange={cambiar("hora")}
          />
        </label>
        <label className="sm:col-span-2">
          <span className={ETIQUETA}>¿Qué quieres pedir?</span>
          <textarea
            className={`${CAMPO} min-h-28 py-3`}
            required
            placeholder="Por ejemplo: 10 panes franceses y 1 pan de molde"
            value={pedido.productos}
            onChange={cambiar("productos")}
          />
        </label>
      </div>

      <div aria-live="polite" className="mt-6">
        {enlace ? (
          <a
            href={enlace}
            target="_blank"
            rel="noopener noreferrer"
            className="boton-whatsapp w-full"
          >
            <MessageCircle aria-hidden className="size-5" />
            Enviar el pedido por WhatsApp
          </a>
        ) : (
          <p className="text-muted-foreground flex min-h-12 items-center justify-center text-center text-sm">
            Escribe qué quieres pedir para poder enviarlo.
          </p>
        )}
      </div>
    </form>
  );
}
