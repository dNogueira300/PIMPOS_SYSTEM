const TEXTO = { bajo: "Bajo el mínimo", vencer: "Por vencer" } as const;
const CLASE = {
  bajo: "bg-alerta/15 text-foreground",
  vencer: "bg-aviso text-aviso-foreground",
} as const;

export function EtiquetaInsumo({ tipo }: { tipo: keyof typeof TEXTO }) {
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${CLASE[tipo]}`}>
      {TEXTO[tipo]}
    </span>
  );
}
