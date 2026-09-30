/**
 * El celular se guarda y se compara normalizado: solo dígitos, y sin el 51
 * cuando es un celular peruano escrito con prefijo. Así «965 111 222» y
 * «+51 965111222» son el mismo cliente para el aviso de repetido, la búsqueda
 * y el enlace de WhatsApp (Review Focus).
 */
export function normalizarCelular(texto: string): string {
  const digitos = texto.replace(/\D/g, "");
  return digitos.length === 11 && digitos.startsWith("51") ? digitos.slice(2) : digitos;
}

const esCelular = (n: string) => /^9\d{8}$/.test(n);

export function celularParaLeer(celular: string): string {
  const n = normalizarCelular(celular);
  return n.length === 9 ? `${n.slice(0, 3)} ${n.slice(3, 6)} ${n.slice(6)}` : n;
}

export function enlaceLlamar(celular: string): string {
  const n = normalizarCelular(celular);
  return esCelular(n) ? `tel:+51${n}` : `tel:${n}`;
}

/** Solo un celular tiene WhatsApp; un fijo no. */
export function enlaceWhatsAppCliente(celular: string): string | null {
  const n = normalizarCelular(celular);
  return esCelular(n) ? `https://wa.me/51${n}` : null;
}

/** Google Maps con la ruta hasta el punto. Sin punto, no hay a dónde llevar. */
export function enlaceComoLlegar(latitud: number | null, longitud: number | null): string | null {
  if (latitud === null || longitud === null) return null;
  return `https://www.google.com/maps/dir/?api=1&destination=${latitud},${longitud}`;
}
