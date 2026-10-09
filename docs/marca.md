# Marca — Panadería Pimpo's

> **Elección de Dan, 07/10/2026:** dirección A (terracota/neutros cálidos), sin azul en la interfaz.
> El logo para todas las superficies proviene de `DOC/Fotos y documentos Adjuntados Pimpos/Diseño/logo.png`.
> Derivados WebP 256/512/768 px, conservando transparencia y original, en
> `DOC/Maquetas/comparacion-redisenio/assets/`. La maqueta revisada es la referencia de dirección;
> los bloques 1–4 ya están fusionados en PR #90–93. El cierre transversal sigue en revisión.
> Las decisiones visuales históricas siguientes
> no deben reintroducir azul ni el logo anterior en el nuevo diseño.

> **Actualización de alcance, 06/10/2026 (Dan).** Para el próximo rediseño dejan de ser
> obligatorias las prohibiciones estéticas de minimalismo, acabado premium y estilo contemporáneo,
> así como la paleta y tipografías de F3.1. Las tres webs de referencia sí pueden orientar el nuevo
> lenguaje visual. Los apartados visuales inferiores describen la versión vigente y decisiones
> históricas. Se mantienen los hechos, textos oficiales, precios, identidad del negocio y todas las
> funcionalidades. La composición pública y los módulos específicos ya aplican A. Ver
> `../DOC/Analisis UI UX - Rediseno integral.md` y `../AGENTS.md`, sección Diseño.

Voz, tono y uso de marca. Todo lo de aquí sale de la **ficha de levantamiento** (secciones 1.8, 1.10,
1.11, 2.1–2.7 y 5.x); nada está inventado. Cuando algo no estaba en la ficha, se dice explícitamente.

## Identidad implementada en 03.2

| Uso                                       | Valor                                                                               |
| ----------------------------------------- | ----------------------------------------------------------------------------------- |
| Fondo / tinta / texto secundario          | `#F7F5F0` / `#28251F` / `#59554E`                                                   |
| Acción / hover / texto sobre acción       | `#953E2C` / `#773020` / `#FFFFFF`                                                   |
| Fondo secundario / borde / borde de campo | `#EEEAE2` / `#D9D4CA` / `#837B70`                                                   |
| Tipografía de interfaz, incluidos títulos | Plus Jakarta Sans local                                                             |
| Controles                                 | Radios de 5–6 px, foco terracota, área principal mínima de 44 px                    |
| Logo de acceso                            | WebP transparente dentro de un círculo claro; 160 px móvil, hasta 350 px escritorio |

Los WebP de 256/512/768 px están en `public/marca/`; el mayor conserva la ruta `logo.webp`.
El logo administrable mantiene prioridad sobre la imagen de reserva. Panel y acceso comparten
`LogoMarca`, con resolución de configuración en el servidor. El lateral es claro y la selección
terracota. Los avisos informativos usan neutros; peligro y éxito conservan su significado.
El público usa tapiz de panes tenue a6 (trazo 11 %), sin velo blanco del carrusel ni ilustración del horno.
El login móvil centra logo y títulos sobre cabecera ondulada; el escritorio conserva dos columnas.
El inicio administrativo organiza avisos, accesos por rol y actividad existente, sin nuevas métricas.
Novedades de portada muestran su imagen completa sobre crema; no recortar textos de un afiche.
Las fotografías admiten zoom del 3 % solo con cursor; la moto recorre una vez la sección delivery
en 4 s. Ambos se desactivan con movimiento reducido y al imprimir.
Los PDF emplean Jakarta, terracota, tinta y bordes cálidos sobre papel blanco, con el logo en cada
página. Comparten el derivado PNG 512 × 341 px con la tarjeta OpenGraph de 1200 × 630 px,
que utiliza fondo crema, franja terracota y logo en círculo. No inventar contenido para metadatos.
El tapiz aprobado no corresponde al panel ni al login. Los apartados de F3.1 siguientes son históricos.

**Para qué sirve:** cualquier texto que vea un cliente o el personal —un título de portada, el
mensaje de un error, el rótulo de un botón, un pie de correo— se escribe con este documento al lado.
Si una frase no encaja aquí, está mal escrita, aunque suene bien.

---

## 1. La marca en una frase

> Una panadería de barrio de Iquitos, con 22 años de oficio, que hornea y vende el mismo día y
> reparte con movilidad propia a toda la ciudad.

Eso es literal, no publicidad: la frescura del mismo día y el delivery propio son los dos
diferenciadores que el propietario declaró en la ficha 2.5, y ambos son verificables.

---

## 2. Textos oficiales

Estos textos son del negocio, **no se reescriben**. Se pueden recortar para una portada, pero la
versión completa vive en `configuracion_sitio` (grupo `textos`) y es la que manda en `/nosotros`.

### Misión

> Nos dedicamos a la elaboración y comercialización de una gran variedad de panes frescos y
> deliciosos dulces tradicionales, dirigidos a las familias y vecinos de Iquitos. Nuestro propósito
> es ofrecer una excelente experiencia de compra tanto a través de nuestra cálida atención en tienda
> como mediante un eficiente servicio de reparto a domicilio que llega a cada rincón de la ciudad,
> manteniendo siempre la calidad y el toque casero que nos caracteriza.

### Visión

> Consolidarnos dentro de cinco años como la panadería líder y preferida en todo Iquitos,
> reconocidos por la excelencia de nuestros productos de panadería y dulces, así como por la
> preferencia de nuestros clientes tanto en la atención en tienda como en nuestro servicio de
> delivery, expandiendo nuestra presencia y llegando de manera eficiente a cada rincón de la ciudad.

### Valores

| Valor           | Lo que significa para el negocio                                                                                |
| --------------- | --------------------------------------------------------------------------------------------------------------- |
| **Calidad**     | Panes frescos y dulces con los mejores insumos y un toque casero inconfundible.                                 |
| **Puntualidad** | Cumplir los tiempos de entrega a domicilio y atender con agilidad en tienda.                                    |
| **Compromiso**  | Esforzarse cada día para llegar a cada rincón de la ciudad y cumplir lo que las familias de Iquitos esperan.    |
| **Calidez**     | Trato amable, cercano y respetuoso, tanto con el vecino que entra como con quien recibe su pedido en la puerta. |

### Eslogan

> **Pan fresco, tradición de siempre**

Se usa completo y sin variaciones. No se abrevia ni se le añaden signos.

### Historia

El texto de la ficha 1.8, íntegro, va en `/nosotros`. En portada se usa un resumen de dos o tres
frases con enlace a la sección completa (doc 03 §4.2, bloque 6).

---

## 3. Posicionamiento: lo que Pimpo's **no** es

Los tres sitios que el propietario dio como referencia (ficha 5.7) son panaderías de gama alta de
Lima. Copiar su tono sería falso y no le hablaría al cliente de Pimpo's. De ahí tres reglas:

**No es premium ni gourmet.** Es de barrio, y eso es una virtud. Nada de "artesanal de autor",
"masa madre de cultivo propio" ni "experiencia sensorial".

**El precio se muestra con orgullo.** La ficha 5.2 pide mostrar todos los precios. Un pan a S/ 0.10
es un argumento de venta, no algo que disimular con "consultar precio".

**No es minimalista.** El estilo declarado en la ficha 2.6 es **tradicional / artesanal**, marcado
expresamente frente a "moderno o minimalista", "elegante o premium" y "rústico o campestre". El logo
tiene un bebé chef y un degradado arcoíris: un diseño demasiado sobrio pelearía con la marca en vez
de acompañarla.

Lo que el cliente debe sentir al entrar a la web, según la ficha 2.5:

> la calidez y cercanía de un negocio familiar y tradicional […] de modo que la web transmita la
> misma sensación que tendría al entrar directamente a la tienda.

Ese es el criterio para resolver cualquier duda de diseño o de redacción: **¿esto se parece a entrar
a la tienda?**

---

## 4. Voz

Cuatro rasgos. Cada uno con su límite, porque un rasgo sin límite se convierte en caricatura.

| Rasgo          | Es                                                                  | No es                                                         |
| -------------- | ------------------------------------------------------------------- | ------------------------------------------------------------- |
| **Cercana**    | Hablar de tú a tú, como quien atiende en el mostrador               | Confianzuda ni infantil. Nada de "¡Holaaa!" ni emojis sueltos |
| **Directa**    | Decir el precio, el horario y la dirección sin rodeos               | Seca. La brevedad no justifica sonar cortante                 |
| **Cálida**     | Reconocer a la persona: "gracias por tu pedido", "te lo llevamos"   | Melosa. Nada de "querido cliente" ni superlativos vacíos      |
| **Con oficio** | Hablar con seguridad de lo que se hornea y de los 22 años que lleva | Presumida ni técnica. El cliente no necesita saber de masas   |

### Suena así

- «Pan fresco todos los días. Lo horneamos y lo vendemos el mismo día.»
- «Te lo llevamos a cualquier parte de Iquitos, con movilidad propia.»
- «Abrimos desde las 4 de la mañana.»

### No suena así

- «Bienvenidos a nuestra experiencia panadera de excelencia.» — pomposo y vacío
- «Los mejores panes de todo el Perú.» — no es verificable
- «Consultar precio por interno.» — la ficha pide precios visibles

---

## 5. Tono por contexto

La voz no cambia; el tono se adapta.

| Contexto                    | Tono                                    | Ejemplo                                                            |
| --------------------------- | --------------------------------------- | ------------------------------------------------------------------ |
| **Portada**                 | Afirmativo, con un dato duro            | «Elaborado y vendido el mismo día»                                 |
| **Catálogo**                | Claro y factual: nombre, precio, unidad | «Pan francés · S/ 0.10 · unidad»                                   |
| **Novedades y promociones** | Entusiasta, sin exagerar                | «Panetón de temporada, desde el 1 de noviembre»                    |
| **Contacto y WhatsApp**     | Servicial, con la acción por delante    | «Escríbenos y coordinamos tu pedido»                               |
| **Errores del sitio**       | Tranquilizador y con salida             | «No pudimos cargar los productos. Intenta de nuevo en un momento.» |
| **Panel de administración** | Instructivo y sin jerga (R18)           | «Guardar», no «Persistir». «Publicado», no «Estado: activo»        |

### El panel merece su propia regla

Lo usan personas con nivel de computadora **básico** (ficha 6.5), desde la computadora y desde el
celular en la calle (ficha 8.5). Ahí el tono no es de marca, es de servicio:

- Se dice **qué** se va a borrar antes de borrarlo, con su nombre.
- Un error explica **qué hacer**, nunca muestra un código.
- Se usan las palabras del negocio: «insumo», «merma», «ingreso», «baja» — no «item», «stock out»
  ni «deprecar».

---

## 6. Mensajes clave

Cada mensaje va con su prueba. Un mensaje sin prueba no se publica.

| Mensaje                                 | Prueba                                                                |
| --------------------------------------- | --------------------------------------------------------------------- |
| **Fresco del día**                      | Se elabora y se vende el mismo día (ficha 2.5)                        |
| **Te llegamos donde estés**             | Reparto propio a toda Iquitos, con movilidad propia (ficha 2.5, 1.11) |
| **22 años en el barrio**                | Negocio tradicional en Iquitos desde 2004 (ficha 1.8)                 |
| **Precios de barrio, a la vista**       | Catálogo completo con precios, desde S/ 0.10 (ficha 5.2)              |
| **Variedad de pan y dulce tradicional** | 6 categorías y ~36 productos en el catálogo (ficha 6.1)               |

**Frase de 10 segundos:** Panadería Pimpo's hornea y vende el mismo día, y te lo lleva a cualquier
rincón de Iquitos.

---

## 7. Vocabulario

| Se dice                        | No se dice                | Por qué                                   |
| ------------------------------ | ------------------------- | ----------------------------------------- |
| pan fresco, del día            | producto de panificación  | El cliente compra pan, no producto        |
| reparto a domicilio, delivery  | logística de última milla | Jerga de otro sector                      |
| nuestros vecinos, las familias | usuarios, consumidores    | Aquí hay personas, no métricas            |
| tienda, local                  | punto de venta, sucursal  | Es un local, y solo uno                   |
| pedido por WhatsApp            | carrito, checkout         | No hay carrito: el pedido va por WhatsApp |

Se escribe **Pimpo's** con apóstrofo, siempre. El nombre legal, «Panadería Pastelería y Bodega
Pimpo's E.I.R.L.», solo aparece en el pie de página y en textos legales.

---

## 8. Identidad visual

Desde la **fase 3.1** (14/09/2026) el sitio tiene el aspecto del prototipo de Google Stitch
«Artisan Editorial» que eligió Dan, con una condición suya: **el azul principal es el del logo**, no
el del prototipo. El detalle, tarea a tarea, está en `DOC/Plan de Desarrollo 03.1 - Rediseño
visual.md`; las capturas del resultado, en `DOC/Maquetas/3.1/`.

| Rol                                   | Color     | Contraste (medido)                         | De dónde sale                                  |
| ------------------------------------- | --------- | ------------------------------------------ | ---------------------------------------------- |
| Azul institucional: titulares y botón | `#12306E` | 11.97 sobre el fondo                       | Texto «PANADERÍA PASTELERÍA Y BODEGA» del logo |
| Azul fachada: foco visible            | `#0060A8` | Contorno, no texto                         | La fachada del local                           |
| Fondo de página                       | `#FFF9EE` | —                                          | Crema del prototipo; nunca blanco puro         |
| Sección alterna                       | `#FAF3E6` | —                                          | Crema del prototipo                            |
| Tarjetas y campos                     | `#FFFFFF` | —                                          | Lo único blanco: lo que flota encima           |
| Tinta: texto                          | `#1E1B14` | 16.40 sobre el fondo                       | Marrón muy oscuro en lugar de negro puro       |
| Tinta secundaria                      | `#41474D` | 8.97 sobre el fondo, 8.52 sobre la alterna | Prototipo                                      |
| Dorado de texto: precios, sellos      | `#835413` | 6.18 sobre el fondo, 5.87 sobre la alterna | El producto horneado                           |
| Durazno: franja de confianza          | `#FDBD73` | 10.39 con tinta encima                     | Prototipo                                      |
| Verde WhatsApp: botón de pedir        | `#2D5A43` | 7.91 con blanco                            | El verde de WhatsApp no llega a AA con blanco  |
| Terracota: barra de aviso             | `#842113` | 9.07 con crema                             | Prototipo                                      |

Los números no son de un comentario: los calcula `src/estilos/paleta.test.ts` leyendo
`globals.css`, y la prueba falla si un token baja de AA. Dos peores casos también están ahí: el
titular del hero sobre el velo crema encima de un píxel negro (8.50) y el pie de foto de la galería
sobre su degradado encima de un píxel blanco (8.59).

**El dorado solo es texto en su tono oscuro, `#835413`, y nunca sobre el durazno ni junto al azul**:
da 3.92 sobre la franja y 1.94 contra el azul. Los dorados claros son fondos y bordes.

**El arcoíris del logo es un detalle, no una paleta.** El degradado multicolor de «PIMPO'S» se usa
como filete divisor o subrayado, nunca en fondos, botones ni bloques de texto. Compite con la
fotografía del producto, y en este sitio la fotografía manda.

**Tipografía.** **Playfair Display** en titulares y **Plus Jakarta Sans** en el texto (decisión de
Dan, 13/09/2026), servidas desde el propio sitio, recortadas a latín: 79 KB entre las dos. Sustituyen
a Fraunces + Inter, que había elegido el propietario en F1. Playfair declara un _Reserved Font Name_,
así que la copia recortada se llama «Playfair Pimpos» por dentro (ver `AGENTS.md`).

**Formas.** Botones en píldora de al menos 48 px; tarjetas blancas con bordes muy tenues y sombras
cálidas, nunca negras; sellos (etiquetas cortas con borde dorado) **con mesura**: como mucho uno por
bloque y en pocos bloques, porque una etiqueta encima de cada sección es la marca de un sitio hecho
por plantilla. El verde es solo para pedir por WhatsApp; el azul, para todo lo demás que se pulsa.

**Logo.** Contiene la fotografía de un niño, así que no existe versión vectorial completa; el
horizontal es raster (`logo-1024.webp`). El isotipo del bebé chef **sí** es vector real
(`isotipo-pimpos.svg`) y escala sin límite: es el que se usa en tamaños pequeños y como favicon.
Ambos son administrables desde el panel (R21), así que ningún componente debe cablear una ruta de
imagen.

La ficha 2.7 dice expresamente que **no hay ningún color, imagen ni estilo vetado** por el
propietario. Eso da libertad, pero no es permiso para alejarse del estilo tradicional/artesanal que
sí declaró en 2.6.

---

## 9. Datos que hay que confirmar con el negocio

No son opiniones de diseño: son datos que van a aparecer publicados y que hoy no cuadran entre sí.

| Dato           | Discrepancia                                                                                                                                            |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **WhatsApp**   | El plan fija `51947874820`; el `.env.local` en uso tiene otro número. Hay que decidir cuál se publica                                                   |
| **Dirección**  | El plan dice «Calle Elías Aguirre 1321»; la historia de la ficha dice «Av. Elías Aguirre». Afecta al JSON-LD y al mapa                                  |
| **Tipografía** | Resuelto: Playfair Display + Plus Jakarta Sans desde la fase 3.1 (Dan, 13/09). Falta enseñárselo al propietario con las capturas de `DOC/Maquetas/3.1/` |

---

## 10. Antes de publicar cualquier texto

1. ¿Se parece a entrar a la tienda? (ficha 2.5)
2. ¿Es verificable, o es una promesa vacía?
3. ¿Lo entendería alguien con nivel de computadora básico?
4. ¿Muestra el precio en vez de esconderlo?
5. ¿Está en español, sin jerga y sin anglicismos evitables?
