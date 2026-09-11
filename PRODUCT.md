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

## Anti-references

- **El tono «premium» de las panaderías de gama alta de Lima** —El Pan de la Chola, Pan Atelier,
  Kalatanta—, que son las referencias que dio el propietario (ficha 5.7). De ellas se toma la
  estructura (contención y espaciado; un titular que afirma algo del negocio; el esqueleto de
  secciones), **nunca el tono**: nada de «artesanal de autor», «masa madre de cultivo propio» ni
  «experiencia sensorial».
- **El minimalismo sobrio.** El estilo declarado es tradicional / artesanal, marcado expresamente
  frente a «moderno o minimalista», «elegante o premium» y «rústico o campestre» (ficha 2.6). El logo
  tiene un bebé chef: un diseño demasiado austero pelearía con la marca.
- **Esconder el precio** detrás de «consultar precio», o relegar el delivery a una nota al pie.
- **Promesas que no se pueden verificar** («los mejores panes del Perú»).

## Design Principles

1. **¿Se parece a entrar a la tienda?** Cercanía y calidez antes que sofisticación.
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
