# Maqueta de la temática de Navidad (plan 08, T3)

Dos variantes sobre la **portada real** (build local, 20/11/2026). El CSS de `navidad.css` se inyecta
encima del sitio; los adornos y la sección de temporada se añaden como lo hará la T4.

**Decisión de Dan (20/11/2026): «desarrolla las dos, cuando hayas terminado deja aplicado la de
noche de navidad».** Las dos variantes se implementan y el panel deja elegir el **estilo** de la
temática (migración 0048); Navidad queda con **Noche de Navidad**.

**Ojo con los datos:** en la sección de temporada, «Panetón chico» y «Pan de pascua» y sus precios
son **inventados para la maqueta**, y las tres tarjetas usan la foto del pan francés porque la base
local solo tiene esa. En el sitio real la sección muestra los productos que el negocio elija en el
panel, con sus fotos y precios.

## Las dos variantes

|                   | **1. Noche de Navidad**                                                                                       | **2. Crema navideña**                                                                                    |
| ----------------- | ------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| Idea              | El sitio entero de noche: fondo verde pino, rojo y dorado. La más cercana a la referencia (tumanzanita.store) | El crema de Pimpo's de siempre, con el rojo de Navidad en lo que se pulsa y el verde pino en las franjas |
| Fondo             | `#13291f` pino                                                                                                | `#f7f5f0` crema (sin cambio)                                                                             |
| Botones           | Rojo `#b3262a`, letra blanca (6.51)                                                                           | Rojo `#a3201f`, letra blanca (7.54)                                                                      |
| Titulares         | Crema `#f7f1e3` (13.66)                                                                                       | Rojo `#a3201f` (6.92)                                                                                    |
| Precios y acentos | Dorado claro `#f2c46d` (7.51 sobre tarjeta)                                                                   | Verde pino `#1f4d3a` (8.84)                                                                              |
| Franja y cinta    | Rojo `#9e1f24`, crema encima (7.20)                                                                           | Pino `#1f4d3a`, crema encima (8.93)                                                                      |
| Barra de arriba   | Pino profundo, dorado encima (10.72)                                                                          | Pino profundo, crema encima (11.17)                                                                      |
| WhatsApp          | Verde claro con letra verde oscura (el verde de siempre no se ve sobre el pino: 1.95)                         | El verde de siempre                                                                                      |
| Tapiz de panes    | Se apaga (se perdía sobre lo oscuro)                                                                          | Se queda                                                                                                 |
| A cuidar          | El logo tiene letras oscuras: sobre el pino iría en un círculo crema, como en el ingreso                      | Nada pendiente                                                                                           |

Todos los contrastes de texto pasan AA (4.5) con holgura; se midieron con la misma fórmula de
`src/estilos/paleta.test.ts`.

## Común a las dos

- **Luces** colgando bajo la cabecera (rojas, doradas, verdes y blancas) que titilan despacio.
- **Nieve** que cae, muy tenue en la variante crema.
- **Cinta** con los mensajes de la campaña, que se desliza.
- **Sección de temporada** antes de «Lo que horneamos hoy», con borde nevado, la cuenta regresiva
  («Faltan 35 días para Navidad»), el título con «Navidad» en la caligrafía de la marca y las tarjetas
  de los productos de temporada.
- La barra de arriba dice el texto de la campaña en lugar del horario.
- Con «menos movimiento» activado en el teléfono, las luces, la nieve y la cinta se quedan quietas;
  al imprimir, los adornos no salen. Sin temática, el sitio queda exactamente como hoy.

## Capturas (`capturas/`)

- `sin-tematica-{movil,escritorio}-pliegue.png`: el sitio de hoy, para comparar.
- `navidad-noche-{movil,escritorio}[-pliegue].png`: variante 1, página entera y primer pliegue.
- `navidad-crema-{movil,escritorio}[-pliegue].png`: variante 2, página entera y primer pliegue.

## Implementada (T4, 20/11/2026)

`implementada/`: capturas del **build real** con Navidad encendida en la base local, en los dos estilos
(`navidad-{noche,crema}-{movil,escritorio}-{pliegue,temporada}.png`). Los productos de la sección son
los que había en la base local (el pan francés, con foto; panetón y bizcocho, en la pizarra). El estilo
crema se capturó cambiando `data-estilo` en la página: el HTML de los dos es el mismo y solo cambia el
CSS.

Diferencias con la maqueta: con una o dos fotos, las tarjetas van al lado de la pizarra (como en «Lo
que horneamos hoy»), el borde nevado cruza la pantalla entera, el cable de las luces es más claro en
la noche para que se vea sobre el pino, y al imprimir el sitio sale con los colores de la marca.
