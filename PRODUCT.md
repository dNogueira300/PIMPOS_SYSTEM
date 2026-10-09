# Product

> Resumen para las herramientas de diseño. **La fuente de verdad sigue siendo `DOC/`** (planes 00–03)
> y `docs/marca.md`; si algo de aquí contradice a esos documentos, mandan ellos y este archivo se
> corrige.

## Register

brand

## Users

Los vecinos y las familias de Iquitos que compran el pan del día en Panadería Pimpo's, o que quieren
pedirlo a domicilio. Entran casi siempre **desde el celular, con 4G irregular**, y muchos tienen nivel
de computadora básico (ficha 6.5). Vienen a resolver tres cosas concretas: qué hay, a cuánto está y
cómo pedirlo; y en segundo lugar, dónde queda la tienda y a qué hora abre.

El panel de gestión (fases 4–6) lo usa el personal —administración, ingeniería de producción y
repartidores—, desde la computadora y desde el celular en la calle. Esa superficie es de registro
`product` y se trata como tal cuando se trabaje en ella.

## Product Purpose

Es la **primera presencia digital** de una panadería de barrio con 22 años de oficio (ficha 3.4):
sitio público con catálogo, precios, novedades, ubicación y contacto, más un panel para que el
negocio lo administre sin depender de nadie.

Tiene éxito si un vecino encuentra en segundos qué pan hay y a cuánto, y termina **pidiendo por
WhatsApp**; si Google muestra la dirección, el horario de dos turnos y el teléfono junto al nombre; y
si el negocio puede publicar un producto o una promoción por su cuenta.

## Brand Personality

**Cercana, directa, cálida, con oficio** (`docs/marca.md` §4). Habla de tú a tú, como quien atiende
en el mostrador; dice el precio, el horario y la dirección sin rodeos; reconoce a la persona sin
volverse melosa; y habla con seguridad de lo que hornea sin presumir ni ponerse técnica.

La emoción que busca la ficha 2.5: que la web transmita **la misma sensación que entrar a la tienda**.
Ese es el criterio para resolver cualquier duda.

## Visual Language

**Dirección elegida el 07/10/2026:** maqueta A, terracota y neutros cálidos, sin azul en la interfaz.
El logo fuente es `DOC/Fotos y documentos Adjuntados Pimpos/Diseño/logo.png`; usar sus derivados
optimizados con transparencia en público, login y panel. Galería revisada en
`DOC/Maquetas/comparacion-redisenio/index.html`. Los cuatro bloques se fusionaron en PR #90–93:
Jakarta también en títulos, login móvil centrado con onda, logo circular, panel y módulos terracota,
inicio administrativo organizado como dashboard y sitio público con tapiz tenue a6. La portada
conserva carrusel, contraste móvil y contenido de madrugada sin horno. Delivery: moto decorativa
de una pasada; fotografías: zoom mínimo solo con cursor y sin movimiento reducido.
El cierre añade imagen completa a novedades de portada, marca en todos los PDF y tarjeta social A,
además de canónicas públicas y descripción estructurada de productos con información existente.
Se mantienen todas las funcionalidades. El registro de comprobaciones vigente es
`DOC/Verificacion rediseño 03.2.md`; no confundir fusiones previas con el cierre aún en revisión.

**Rediseño abierto el 06/10/2026 por Dan.** La descripción siguiente corresponde a la interfaz
anterior a 03.2, no a una restricción para el nuevo diseño. Se pueden reemplazar estilo, tipografía, paleta
y composición, tanto en el público como en el panel. **Todas las funcionalidades y sus flujos se
conservan exactamente.** Ver `DOC/Analisis UI UX - Rediseno integral.md` y la decisión en `AGENTS.md`.

Desde la fase 3.1 (14/09/2026), el lenguaje **«artisan editorial»** del prototipo de Google Stitch
que eligió Dan: titulares en **Playfair Display** y texto en **Plus Jakarta Sans**, superficies crema
en capas con tarjetas blancas, bordes muy tenues y sombras cálidas, botones en píldora y sellos cortos
con borde dorado. El azul es el del logo (`#12306E`), no el del prototipo, y el verde se reserva al
botón de pedir por WhatsApp.

Editorial no quiere decir premium: del prototipo se tomó la forma y **ningún dato** (estaba lleno de
direcciones, productos, cifras y testimonios inventados), y los sellos van con mesura para que no se
lea como plantilla. Paleta y contrastes en `docs/marca.md` §8; el porqué de cada pieza, en
`DOC/Plan de Desarrollo 03.1 - Rediseño visual.md`.

## Anti-references

- **Presentar como propios atributos ajenos no verificados**, por ejemplo masa madre o procesos
  del obrador de otra panadería. Esto limita las afirmaciones, no la calidad ni el estilo visual.
- **Copiar literalmente una referencia.** El Pan de la Chola, Pan Atelier y Kalatanta pasan a ser
  referencias positivas por decisión de Dan (06/10/2026). Se puede explorar sobriedad y un acabado
  contemporáneo, manteniendo reconocible a Pimpo's y conservando sus funciones.
- **Esconder el precio** detrás de «consultar precio», o relegar el delivery a una nota al pie.
- **Promesas que no se pueden verificar** («los mejores panes del Perú»).

## Design Principles

1. **Cercanía y calidez con una ejecución cuidada.** La sofisticación visual está permitida; la
   identidad y los datos del negocio siguen siendo reales.
2. **El precio y el delivery van de titular.** Hay pan a S/ 0.10 y reparto propio a toda la ciudad:
   son los dos argumentos de venta, y se muestran con orgullo.
3. **Verificable o no se publica.** Cada mensaje lleva su prueba en la ficha; los datos salen de la
   base, no del código.
4. **El celular con 4G irregular es el caso normal, no el extremo.** Lo que cuesta peso se mide antes
   de añadirlo; 375 px es el ancho de referencia.
5. **La fotografía real del local manda.** El arcoíris del logo es un detalle, nunca una paleta.

## Accessibility & Inclusion

- **WCAG 2.1 AA como mínimo no negociable** (doc 03 §3.4): contraste 4.5:1 en texto normal y 3:1 en
  grande, **medido por prueba automática**, no afirmado.
- Todo control alcanzable con teclado y con foco visible; un solo `h1` por página.
- Área táctil mínima de 44 × 44 px.
- `prefers-reduced-motion` respetado: sin avance automático del carrusel ni apariciones animadas.
- Imágenes con `alt` real; las decorativas con `alt=""`.
- Textos en español llano y sin jerga: los usuarios tienen nivel de computadora básico.
