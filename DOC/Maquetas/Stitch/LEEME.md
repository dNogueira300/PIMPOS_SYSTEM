# Prototipo de Stitch — referencia visual de la Fase 3.1

Exportado el 13/09/2026 del proyecto de Google Stitch **«Panadería Pimpo's Web Platform»**, que Dan
eligió como dirección visual de la plataforma.

| Archivo                  | Qué es                                                                    |
| ------------------------ | ------------------------------------------------------------------------- |
| `portal.html`            | El portal público tal como lo genera Stitch (Tailwind por CDN)            |
| `portal-escritorio.webp` | Ese HTML renderizado a 1280 px, página entera                             |
| `portal-movil.webp`      | El mismo a 375 px, que es el ancho de referencia del proyecto             |
| `panel.html`             | La pantalla del panel interno (kárdex y clientes). Es de F4–F6, no de 3.1 |

## Cómo se usa

**Es una referencia de aspecto, no de contenido.** Se toma de aquí la forma: tipografía, colores,
radios, sombras, píldoras, sellos, la composición de cada sección. **No se toma nada de lo que dice.**
El prototipo lo generó una IA y está lleno de datos inventados que contradicen los reales:

- Dirección «Calle Putumayo 542» (la real: Calle Elías Aguirre 1321, Belén)
- Horario «Lunes a Domingo 4:00 AM – 9:30 PM» (el real: lunes a sábado en dos turnos, domingo cerrado)
- Teléfono, RUC, productos, precios, combos y fotos de archivo
- «24+ años» (son 22, y la cuenta ya no se escribe a mano: ver migración 0024)
- «Fermentación 18 horas», «masa madre», «insumos amazónicos»: promesas que la ficha no respalda
- Testimonios con nombre y apellido de personas que no existen

Lo que se construye lee **siempre** de la base, como el resto del sitio. El detalle de qué se adopta
y qué no, con el motivo, está en `DOC/Plan de Desarrollo 03.1 - Rediseño visual.md`.

## Lo que el plan cambia respecto al prototipo

- **El azul primario es el institucional `#12306E`**, no el `#174A68` de Stitch (decisión de Dan).
- Los iconos son **lucide**, no Material Symbols. Las fuentes van **locales**, no desde Google Fonts.
- El celular **no lleva carrusel** (decisión del 12/09), aunque el prototipo lo tenga.
