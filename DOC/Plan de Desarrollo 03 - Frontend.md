# Plan de Desarrollo — 03. Frontend (Sitio Público y Panel)

**Fases cubiertas:** F1 (fundación y sistema de diseño), F3 (sitio público), F4 (panel de contenido) y la interfaz de F5–F6
**Requisito previo:** Fase 0 cerrada y esquema de F2 definido

> ### Next.js 16: dos cambios que afectan a este documento
>
> El scaffold trajo Next 16, y su propio `AGENTS.md` avisa de que hay rupturas respecto a versiones
> anteriores. Dos tocan lo escrito aquí:
>
> - **`middleware.ts` ya no existe: ahora es `src/proxy.ts`**, con export `proxy` y runtime Node
>   (el edge no está soportado). La guardia por rol vive ahí, ya implementada.
> - **`revalidateTag` exige un segundo argumento**: `revalidateTag('marca', 'max')`. Para que el
>   administrador vea su cambio de inmediato existe `updateTag('marca')`, pensado para Server
>   Actions. Afecta al logo y favicon administrables (R21, §5.5).
>
> Además, la documentación de Next insiste en algo que refuerza el diseño ya elegido: el proxy es
> un **chequeo optimista**, y las Server Functions se resuelven como POST a la ruta donde viven, así
> que un cambio de `matcher` puede sacarlas de la guardia sin avisar. La autorización real está en
> la RLS de Postgres, y cada acción vuelve a comprobar permisos por su cuenta.

---

## 1. Referencias de diseño

El propietario señaló tres sitios como referencia (ficha 5.7). Se revisaron los tres y esto es lo que tienen en común y lo que conviene tomar de cada uno.

### 1.1 Lo que comparten

| Patrón                                                        | Presente en                   | Se adopta                                                            |
| ------------------------------------------------------------- | ----------------------------- | -------------------------------------------------------------------- |
| Fondo **crema / hueso**, nunca blanco puro                    | Los tres                      | ✅ Ya está en la paleta (`#F7EFE2`)                                  |
| Tonos tierra cálidos, sin colores saturados                   | Los tres                      | ✅ El arcoíris del logo queda como detalle mínimo                    |
| **La fotografía manda**: imágenes grandes, poco texto encima  | Los tres                      | ✅ Condiciona el diseño de tarjetas y del hero                       |
| Carrusel o imagen grande en portada                           | El Pan de la Chola, Kalatanta | ✅ Es el requisito R2                                                |
| **Sección de relato de marca** ("nuestra esencia", "10 años") | Los tres                      | ✅ La historia de la ficha 1.8 va en portada, resumida               |
| Productos en **grilla de tarjetas** con foto, nombre y precio | El Pan de la Chola, Kalatanta | ↩️ Sustituida por la pizarra de precios mientras falten fotos (§4.0) |
| **WhatsApp visible y permanente**                             | Los tres                      | ✅ Requisito R4                                                      |
| Pie de página con ubicación, horarios, contacto y redes       | Los tres                      | ✅                                                                   |

### 1.2 Lo que se toma de cada uno

**El Pan de la Chola** — la contención. Navegación corta y horizontal, tarjetas limpias, mucho aire, tipografía sin adornos. Es el que mejor deja respirar la foto del producto. **Se toma:** la disciplina del espaciado y la sobriedad de la navegación.

**Pan Atelier** — el titular grande con voz propia ("Nuestra esencia nace 48 horas antes de hornear") y los bloques de proceso en tres columnas. **Se toma:** la idea de que el titular de portada afirme algo del negocio, no salude. Para Pimpo's ese algo ya existe y es real: _se elabora y se vende el mismo día_ (ficha 2.5).

**Kalatanta** — la calidez familiar y la estructura completa: servicios, historia, testimonios, más pedidos, horarios, contacto. Es el más cercano a lo que pide la ficha. **Se toma:** el esqueleto de secciones. **No se toma:** las barras de navegación repetidas ni el exceso de bloques, que hacen la página pesada y confusa.

### 1.3 Dónde Pimpo's se diferencia

Los tres referentes son panaderías de gama alta en Lima. Pimpo's es un negocio **de barrio, tradicional, de 22 años, con precios desde S/ 0.10 y delivery propio a toda la ciudad**. Copiar el tono "premium artesanal" sería falso y no le hablaría a su cliente.

Tres decisiones que salen de ahí:

1. **El precio se muestra con orgullo, no escondido.** La ficha (5.2) pide mostrar todos los precios. Pan a S/ 0.10 es un argumento de venta, no algo que disimular con "consultar".
2. **El delivery es el titular, no una nota al pie.** Es su diferencial real (ficha 2.5, 1.11): movilidad propia, toda la ciudad, algo que las panaderías de la zona no ofrecen.
3. **La calidez por encima del minimalismo.** El logo tiene un bebé chef y un degradado arcoíris. Un diseño demasiado sobrio pelearía con la marca en lugar de acompañarla. El estilo declarado en la ficha (2.6) es **tradicional/artesanal**, no minimalista.

---

## 2. Uso de las skills de diseño

Cada skill entra en un momento concreto y con un entregable concreto. No se invocan todas de golpe.

| Fase         | Skill                  | Para qué                                                                                               | Entregable                               |
| ------------ | ---------------------- | ------------------------------------------------------------------------------------------------------ | ---------------------------------------- |
| **F1**       | `brand`                | Consolidar voz, tono y uso de marca a partir de la ficha (misión, visión, valores, eslogan)            | `docs/marca.md`                          |
|              |                        | _(F1 va en tres PR: scaffold ✅, autenticación ✅, sistema de diseño ✅)_                              |                                          |
| **F1**       | `design-system`        | Arquitectura de tokens en tres capas (primitivo → semántico → componente) sobre Tailwind 4             | `src/estilos/globals.css` con los tokens |
| **F1**       | `ui-ux-pro-max`        | Elegir emparejamiento tipográfico, escala de espaciado, estados de interacción y revisar accesibilidad | Especificación del sistema               |
| **F1**       | `frontend-design`      | Dirección estética general: que no parezca una plantilla                                               | Dirección aprobada por el propietario    |
| **F3**       | `taste-skill`          | Portada y páginas públicas sin aspecto de plantilla; auditoría previa contra las 3 referencias         | Maquetas de las 8 secciones              |
| **F3**       | `impeccable`           | Jerarquía visual, carga cognitiva, comportamiento responsive, estados vacíos y de error                | Revisión sección por sección             |
| **F3–F4**    | `ui-styling`           | Componentes shadcn/ui, tema, accesibilidad de diálogos, formularios y tablas                           | Biblioteca de componentes                |
| **F3**       | `emil-design-eng`      | El pulido final: micro-interacciones, transiciones, los detalles que hacen que se sienta bien          | Ajustes de detalle                       |
| **F3**       | `animation-vocabulary` | Nombrar con precisión los efectos antes de implementarlos (carrusel, aparición al hacer scroll)        | Vocabulario compartido                   |
| **F4–F5**    | `dataviz`              | Gráficos del panel de insumos: consumo por periodo, mermas, valorización                               | Especificación de gráficos               |
| **Opcional** | `banner-design`        | Slides del carrusel mientras el negocio no entregue los suyos                                          | 3 slides semilla                         |

**Regla de orden:** primero las skills de proceso (`brand`, `design-system`, `ui-ux-pro-max`), que fijan el marco; después las de ejecución (`taste-skill`, `impeccable`, `ui-styling`, `emil-design-eng`). Aplicar pulido antes de tener el sistema de diseño es rehacer el trabajo dos veces.

---

## 3. Sistema de diseño

> **Desde la fase 3.1 (14/09/2026) los valores de esta sección están superados.** La paleta, la
> tipografía (Playfair Display + Plus Jakarta Sans), los radios y las piezas base son los del
> prototipo de Stitch con el azul institucional: ver `DOC/Plan de Desarrollo 03.1 - Rediseño
visual.md` y `docs/marca.md` §8. Lo que sigue en pie de aquí es la **estructura** —las tres capas
> de tokens, la regla de no usar primitivos en componentes, los mínimos de accesibilidad— y el
> historial de por qué se decidió cada cosa en F1.

### 3.1 Tokens en tres capas

✅ **Implementado** en `src/estilos/globals.css`.

**Capa 1 — primitivos**, con el prefijo `--pimpos-*`. Los colores crudos, extraídos de los archivos
reales del cliente: `--pimpos-azul-900: #12306E`, `--pimpos-azul-600: #0060A8`,
`--pimpos-crema-50: #FDF9F3`, `--pimpos-crema-100: #F7EFE2`, `--pimpos-tinta-900: #231A14`, más las
tintas suaves, los tonos de estado y los del tema oscuro.

El dorado tiene **dos** valores, y no es redundancia: `--pimpos-dorado-500: #C8801F` solo vale como
fondo, y `--pimpos-dorado-700: #8F5A10` es el único utilizable como texto (ver §3.4).

**Capa 2 — semánticos.** Se reutilizan los nombres que ya consumen los componentes de shadcn/ui
(`--background`, `--foreground`, `--primary`, `--muted`, `--border`, `--ring`…) en lugar de inventar
`--color-fondo` y compañía. Así toda la librería queda tintada con la marca sin tocar ni un
componente — comprobado: la pantalla de ingreso salió con el azul institucional sin editar el botón.
Se añaden `--exito` y `--alerta`, que shadcn no trae.

Una decisión que importa: el dorado **no** se mapea a `--accent`. En shadcn, `accent` y `muted` son
superficies discretas —fondos de hover, filas alternas—, así que teñirlas de dorado pintaría de
acento cada hover del sitio. El dorado vive en la capa 3.

**Capa 3 — de componente**: `--cta-fondo`, `--cta-texto`, `--acento-texto`, `--precio-texto`,
`--franja-fondo`, `--area-tactil-min`. (Los de la tarjeta de producto se retiraron con ella, al pasar
el catálogo a pizarra de precios.)

Las tres capas son variables CSS nativas, que es como Tailwind 4 espera la configuración; el puente
con las utilidades se hace con `@theme inline`. Ningún componente usa un color de la capa 1
directamente.

### 3.2 Tipografía

✅ **Decidido el 07/09/2026: Fraunces (títulos) + Inter (texto).**

- [x] Validado con el propietario sobre una maqueta real de la portada, no sobre una muestra de
      texto. Las tres opciones renderizadas están en `DOC/Maquetas/`, con su `LEEME`.

El criterio que decidió: el contraste entre trazo grueso y fino de Fraunces es lo que distingue una
letra artesanal de una industrial, y eso es el estilo que marca la ficha 2.6. Bitter, más pareja,
tiraba hacia lo neutro y dejaba solo a un logo que ya es fuerte.

Implementadas con `next/font/local` desde `src/estilos/fuentes/`, sin llamar a Google. Variables y
solo subconjunto latin: ~115 KB las dos. Una prueba E2E comprueba que la familia llega de verdad al
navegador, no solo que compile.

### 3.3 Espaciado y escala

Escala de 4 px. Ancho máximo de contenido 1200 px. Radio de esquina generoso (12–16 px) — acompaña el tono cálido; las esquinas vivas leerían corporativas.

### 3.4 Accesibilidad — mínimos no negociables

- Contraste **AA** en todo texto (4.5:1 normal, 3:1 grande).
- ⚠️ **Corregido tras medirlo.** Esta guía decía que el dorado `#C8801F` sobre crema no alcanza AA
  para texto pequeño y que por eso se reservara a «superficies grandes, iconos o texto de 18 px o
  más». Medido, da **2.80**: tampoco llega al umbral de 3.0 de texto grande ni al de iconos. La
  regla real es:
  - `#C8801F` **solo como fondo**, con tinta `#231A14` encima (5.34). Con blanco da 3.20 y no pasa.
  - Para texto, precio, icono o enlace dorado se usa `#8F5A10` (5.06 sobre crema).

  Los contrastes ya no se afirman: `src/estilos/paleta.test.ts` los mide leyendo `globals.css` y
  falla el commit si alguno baja del mínimo.

- Todo control alcanzable con teclado, con foco visible.
- Toda imagen con `alt` real; las decorativas con `alt=""`.
- Área táctil mínima de 44 × 44 px — el panel se usa desde el celular en campo (R15).
- Respetar `prefers-reduced-motion`: el carrusel deja de avanzar solo.

---

## 4. Sitio público (F3)

### 4.0 Estado

**Las ocho secciones están construidas y probadas** (08/09/2026). Leen de las vistas de la migración
0016, no de tablas ni del código. El build genera **52 páginas estáticas**, los 34 productos entre
ellas, y las cubren **160 pruebas de navegador** a 375 px y en escritorio.

**El SEO está hecho** (11/09/2026): datos estructurados, `sitemap`, `robots` e imagen para compartir,
con 6 pruebas de navegador que piden cada archivo y comprueban lo que vuelve. Falta el pulido de
detalle con `impeccable` y `emil-design-eng`, y que el panel de F4 dispare el `revalidateTag` cuyas
etiquetas ya están puestas.

**Crítica de diseño (11/09/2026): 24/40, aceptable.** Con la skill `impeccable`, dos evaluaciones
aisladas —revisión de diseño y detector automático con evidencia de navegador— más una medición de
contraste por píxeles. Cuatro problemas P1, un PR cada uno y en este orden:

1. La animación dejaba contenido a medias con la página quieta. **Corregido**, ver §4.6.
2. El momento de pedir por WhatsApp no daba seguridad y el mensaje no decía cuántos. **Corregido**:
   junto a cada botón de pedir van qué pasa al pulsarlo, el número escrito como se dicta y las
   condiciones del delivery (costo, mínimo, tiempo, pago y zonas), que salen de la configuración
   —migración 0017— y no del código. El mensaje llega con el hueco para la cantidad y la dirección,
   cada «escríbenos por WhatsApp» se puede pulsar y el slide del delivery lleva directo al chat.
3. El catálogo sin fotos (32 de 34 productos) mostraba 32 croissants de relleno y un aviso «sin foto»
   a 1.9:1. **Corregido**: pasa a **pizarra de precios** (`PizarraPrecios`), una fila por producto
   con puntos guía y el precio grande, agrupada por categoría; los productos con foto la conservan
   en su fila. La ficha sin foto quita la caja vacía y pone el precio de titular. «Unidad» deja de
   repetirse: la presentación solo se dice cuando informa. De paso se corrige el salto de `h1` a
   `h3` en `/productos`: ahora las categorías son `h2`.
4. Las páginas de 404 y de error eran las de Next, en inglés, y `/esto-no-existe` salía sin cabecera.
   **Corregido**: `PaginaNoEncontrada` sirve a los dos 404 —el de la raíz (`app/not-found.tsx`) y el
   de dentro de las secciones (`app/(public)/not-found.tsx`)—, con la cabecera y el pie del sitio,
   tres salidas (catálogo, inicio, WhatsApp) y los destacados en la pizarra. `app/(public)/error.tsx`
   ofrece «Intentar de nuevo» con `retry` y «Volver al inicio». Sin códigos a la vista, como pide
   `docs/marca.md`. Los dos 404 tienen prueba de punta a punta (estado 404, `noindex`, título en
   español, salidas). **La página de error no tiene prueba automática**: provocar un fallo del
   servidor en el build exigiría dejar en producción una ruta que falle a demanda. Se verificó a
   mano, con una ruta temporal que fallaba al hidratar, y se retiró antes del commit.

**P2 corregidos (11/09/2026), con medida:**

- **Área táctil.** Medir cada control de las 10 páginas a 375 px encontró 22 por debajo de 44 px,
  más de los que citaba la crítica: los puntos del carrusel (32), los enlaces del pie (36 y 20), los
  datos de contacto (17 a 20), el zoom (30) y el marcador (20) del mapa. Ahora no queda ninguno fuera
  de lo que WCAG 2.5.8 exime (enlaces dentro de una frase y el crédito de licencia del mapa), y
  `e2e/tactil.spec.ts` recorre todos los controles de todas las páginas.
- **Contraste del carrusel.** Degradado 85/55/10. Medido por píxeles sobre la foto real, el peor 5 %
  del subtítulo de la diapositiva 2 queda en 5.67 en escritorio y 6.47 en el celular (antes 4.46), y
  ni su píxel más desfavorable baja de 4.5. Los titulares, texto grande, no bajan de 3.45 en ningún
  píxel.
- **El botón flotante «Pedir»** se aparta mientras el botón de pedir de la propia página está a la
  vista: ahí sobraba y tapaba el precio y las condiciones.
- **Horario.** Eran siete filas casi idénticas, repetidas en la sección y en el pie. Ahora los días
  seguidos que abren igual van juntos («Lunes a sábado», «Domingo»), con cada turno en su propia
  línea como antes, y el horario ocupa dos filas donde ocupaba siete. `agruparHorario` solo junta
  días seguidos (si el miércoles cerrara, «Lunes a sábado» mentiría) y, sin ningún día cargado, no
  anuncia «cerrado toda la semana». La respuesta de preguntas frecuentes pasó de 24 h a 12 h con la
  migración 0018, solo si el negocio no la había reescrito. Esa respuesta repite las horas como texto
  libre: cuando el panel permita cambiar el horario (F4), hay que avisar de que también se edita.

**Detalles menores, también corregidos (11/09/2026):**

- **El logo no se leía a 375 px**: el arco «PANADERÍA PASTELERÍA Y BODEGA» quedaba en letras de dos
  píxeles. En el celular la cabecera lleva el isotipo y el nombre escrito en Fraunces; desde `sm`,
  el logo completo de siempre.
- **El menú del celular** empieza por «Inicio» y termina con el horario agrupado: era lo más buscado
  y estaba a más de 4000 px de scroll, en el pie.
- **La dirección de `/galeria`** estaba escrita en el código; ahora sale de la configuración, como en
  el resto del sitio.
- **El rótulo cortado en el hero.** En escritorio el carrusel es panorámico y las fotos del negocio
  son verticales. Cada diapositiva guarda ahora su propio encuadre (`slides.enfoque`, migración
  0020, editable desde el panel en F4): la fachada al 30 %, que es donde está el rótulo, y las otras
  centradas. Una sola posición para todas no servía: al horno le sacaba una franja del techo.
- **La historia** empezaba por «Bienvenidos… profundamente arraigado», que es el ejemplo de «no suena
  así» de `docs/marca.md`. Reescrita con los mismos hechos de la ficha (migración 0019), y sigue
  siendo administrable: vive en `configuracion_sitio`.

Con esto, la crítica del 11/09 quedó cerrada: los 4 P1, el P2 y los detalles menores.

**Segunda crítica (12/09/2026): 29/40**, con el mismo método (dos evaluaciones aisladas, revisión de
diseño y detector con evidencia de navegador). Sube cinco puntos, y sube donde se trabajó:
recuperación de errores 1 → 4, prevención 2 → 3, flexibilidad 2 → 3 y ayuda 2 → 3. **Baja una**:
control y libertad 3 → 2, por omisión y no por regresión —el carrusel nunca se pudo pausar con el
dedo, pero ahora que el resto está resuelto ese fallo pesa más—. El escaneo determinista da **cero
hallazgos** en el sitio público; de las reglas que disparó el detector en el navegador, solo tres
eran reales (el resto, falsos positivos verificados uno a uno: medía el contraste del carrusel contra
el fondo crema en vez de contra la foto, y se detectaba a sí mismo en dos reglas).

Lo que salió, por prioridad:

| Prioridad | Problema                                                                  | Estado            |
| --------- | ------------------------------------------------------------------------- | ----------------- |
| P0        | Los testimonios de ejemplo se publicaban                                  | ✅ Migración 0021 |
| P1        | El botón flotante tapa contenido en portada, catálogo, FAQ, 404 y galería | ✅                |
| P1        | El logo de escritorio sigue ilegible (el arreglo solo llegó a móvil)      | ✅                |
| P2        | Los productos con dos presentaciones se piden a ciegas                    | ✅                |
| P2        | Nadie dice si la panadería está abierta ahora                             | ✅                |

**Los dos P1, corregidos (12/09/2026):**

- **El logo.** La cabecera usa el isotipo vectorial con el nombre en Fraunces **en todas las
  pantallas**, algo mayor desde `sm`. El raster a 44 px de alto dejaba el arco «PANADERÍA PASTELERÍA
  Y BODEGA» en letras de dos píxeles; se arregló primero solo en el celular y el escritorio se quedó
  con él, que es donde peor sienta: primer elemento del primer pliegue y lo único que dice de quién
  es la página. El logo completo se queda donde se ve grande: datos estructurados e imagen para
  compartir, que siguen leyendo `logo_url` de la configuración.
- **El botón flotante**, con tres medidas y no una: (1) **el pie** reserva abajo la altura del botón,
  porque al final del documento no hay más scroll con el que apartar lo de debajo y el tapado sería
  permanente —el hueco se puso primero en `<main>`, que no es lo último que se ve, y la prueba lo
  cazó: el botón seguía encima de «Iquitos, Perú» en portada y galería—; (2) se aparta con
  **cualquier** enlace a WhatsApp a la vista, no solo los del
  contenido —al abrir el menú quedaban dos botones de pedir en la misma pantalla—; y (3) se retira
  mientras el cliente baja y vuelve al parar o al subir, que es cuando se comía la línea que se
  estaba leyendo. **Sigue siendo permanente (R4)**: no se quita, se aparta y vuelve solo.

**El primer P2, cerrado (12/09/2026): «Abierto ahora».** El horario decía cuándo se abre, pero la
pregunta del cliente es otra: si puede ir ya. Con apertura a las 4 de la madrugada y cierre al
mediodía, esa cuenta la hace mal cualquiera. Ahora el horario va encabezado por **«Abierto ahora ·
Hasta la 1:00 p. m.»** o **«Cerrado ahora · Abre mañana a las 4:00 a. m.»**. Cuatro decisiones que
lo sostienen:

- **Sale del horario cargado** (decisión de Dan), no de un interruptor aparte: un interruptor se
  queda encendido un feriado y miente. Se edita el horario y el estado se corrige solo.
- **Va dentro del componente `Horario`**, que es el único sitio que lo pinta, así que aparece de una
  vez en portada, contacto, ubicación y pie, y no puede olvidarse en ninguno.
- **Es de cliente por fuerza**: depende de qué hora es. Calcularlo en el servidor lo congelaría en el
  momento del build —«Abierto ahora» a las tres de la madrugada— y un `new Date()` suelto rompe el
  prerenderizado con Cache Components. Usa `useSyncExternalStore`, cuya versión de servidor devuelve
  `null`: el HTML prerenderizado no lleva nada y no hay desajuste al hidratar.
- **El reloj es el de Iquitos** (`America/Lima`), no el del visitante: si alguien mira la página
  desde Lima o con el reloj del teléfono mal puesto, la panadería abre igual.

La lógica es una función pura (`estadoDelHorario`) con ocho pruebas, incluidos los dos minutos que
deciden si el cliente sale de casa para nada —a las 4:00 en punto ya se atiende, a la 1:00 en punto
ya no— y el salto del domingo. En el navegador, `page.clock` congela la hora: hay prueba de que a
las 12:59 dice «Abierto» y de que **cambia solo** al llegar la 1:00, sin recargar.

**El segundo P2, cerrado (12/09/2026): las presentaciones.** Dos productos de los treinta y cuatro
tienen dos precios —la hamburguesa grande y la de ajonjolí, a S/ 0.30 y S/ 0.40— y se pedían a
ciegas. Se rompía en tres sitios seguidos, no en uno:

1. **El catálogo** decía «2 presentaciones» y «Desde S/ 0.30». Cuántas hay, no cuáles.
2. **La ficha** tampoco las listaba, y no era un olvido de maquetación: `productos_publicos` solo
   mandaba el rango de precios, el conteo y la variante predeterminada. El dato no llegaba.
3. **El pedido** omitía la presentación a propósito cuando había más de una —nombrar la
   predeterminada haría creer que no hay otra—, así que el mensaje salía «quisiera pedir Hamburguesa
   grande» y el negocio tenía que preguntar cuál: justo la pregunta que se quitó de en medio al
   rehacer el bloque de pedido.

Decisión de Dan: **listarlas con su precio y que elija el cliente.** La migración 0022 amplía la
vista con todas las presentaciones en un `jsonb` —columna nueva al final, con `security_invoker` y el
`where` repetidos—, la ficha las enseña **debajo del precio** con el patrón de la pizarra, y el
mensaje lleva su propia línea: `Presentación (De S/ 0.30 o De S/ 0.40):`.

**Lo que no se hizo: inventar qué las diferencia.** Se llaman por su propio precio y la semilla lo
marca PENDIENTE; nadie lo ha confirmado. La interfaz funciona igual con los nombres de hoy y mejora
sola en cuanto el propietario los corrija desde el panel. Es distinto del delivery, donde lo
inventado era una condición comercial: aquí sería un dato del producto, y si está mal el cliente se
entera al recibirlo.

**Dos decisiones de fondo que la crítica cuestiona.** La primera está cerrada por Dan (12/09/2026):
**el catálogo no se convierte en carrusel ni pasa a ser la portada**. La portada sigue siendo
portada y el catálogo su propia sección; la propuesta de la crítica —que el visitante caiga
directamente sobre los treinta y cuatro productos— queda descartada.

La segunda **también está decidida** (Dan, 12/09/2026), y parte la portada en dos: **en escritorio el
carrusel se queda como está; en el celular no hay carrusel.**

El motivo no es de gusto. El carrusel se pausaba al pasar el mouse y al enfocar con teclado —las dos
cosas de escritorio—, así que en un teléfono **nada lo detenía**: el mensaje cambiaba cada seis
segundos bajo el dedo de quien lo estaba leyendo, justo en la pantalla que el proyecto declara
prioritaria (R6). Y obligaba a esconder el `h1`, porque el titular visible era el del slide y un `h1`
que cambia solo no le sirve a nadie.

En su lugar, el celular abre con la foto de la primera diapositiva **quieta** y, debajo, sobre el
azul de marca, lo que el vecino vino a saber: de quién es esto, si está abierto **ahora** y el botón
de pedir. El texto va debajo de la foto y no encima, para que el contraste no dependa de qué foto
suba el negocio desde el panel. R2 se sigue cumpliendo —los slides siguen siendo datos editables, y
en escritorio se ven todos—; lo que se retira es la rotación donde no se podía parar.

Dos costes que estaban ocultos y se corrigieron con el cambio: el carrusel **ya no descarga su foto
en el celular** (`priority` inyecta un `<link rel=preload>` que ignora el `display:none` del
contenedor, así que se le pide `1px` por debajo de 640) y **su temporizador no arranca** en pantalla
pequeña, porque el componente se monta igual aunque esté oculto.

Lo que sigue siendo para el propietario es enseñarle las dos portadas y que diga si le convence,
sabiendo que sus fotos siguen estando: enteras en escritorio, y la primera, fija, en el celular.

**Hero desde el primer día (12/09/2026).** Hasta la migración 0023 las únicas diapositivas eran las
de `02_demo.sql`, que **nunca llega a producción**: allí la tabla estaba vacía y la portada caía en
su variante sin foto. Funcionaba, pero el negocio perdía justo lo que mejor tiene. Ahora las tres son
**reales y van como migración**, no como semilla, porque producción no carga semillas.

Tres decisiones dentro de esa migración:

- **Los enlaces son rutas internas** (`/productos`, `/contacto`, `/nosotros`), no un `wa.me` escrito
  a mano como en el slide de ejemplo. El teléfono vive en `configuracion_sitio` y el sitio arma el
  enlace con el mensaje ya redactado; copiarlo dentro de una fila lo dejaría viejo el día que cambie,
  sin que nadie sepa que hay que corregirlo en dos sitios. Hay prueba de que ningún slide lo lleva.
- **No pisa el trabajo del negocio**: el `insert` va con un `where not exists` sobre los slides
  propios, así que en cuanto el panel (F4) cargue los suyos, esta migración deja de significar nada.
- **La ruta de la imagen es relativa al bucket**, nunca la URL entera: guardar el dominio ataría cada
  fila a este proyecto de Supabase y bastaría cambiar de proyecto para romper las tres fotos.

**El mapa ya no se monta encima de la cabecera.** En `/ubicacion`, al bajar, el mapa pasaba **por
encima** del menú y lo dejaba inservible. No era un despiste de maquetación: Leaflet reparte
`z-index` de 400 a 1000 entre sus paneles y la cabecera del sitio es `z-40`, así que el mapa ganaba
siempre. Se arregla dándole al contenedor su propio contexto de apilamiento (`isolation: isolate`),
**no subiendo el `z-index` de la cabecera**: esa carrera no se gana, porque el mapa siempre puede
pedir más. La prueba no mira el `z-index` calculado —que puede ser cualquiera si cada uno vive en su
contexto—, sino **quién recibe el clic** en el centro de la cabecera con el mapa debajo.

**Seis decisiones que se apartan de lo escrito más abajo**, todas con su motivo en el apartado que
corresponde:

| Decisión                                                             | Dónde se explica                                               |
| -------------------------------------------------------------------- | -------------------------------------------------------------- |
| El mapa **no** va en la portada, aunque §4.2 lo ponga en su bloque 9 | §4.5: Leaflet pesa más que el presupuesto entero de la portada |
| Contacto **no** lleva formulario                                     | §4.1: obliga a vigilar un buzón que hoy nadie vigila           |
| El `h1` de la portada no se ve                                       | §4.3: el titular del hero cambia cada seis segundos            |
| El presupuesto de 150 KB estaba por debajo del suelo del framework   | §4.5                                                           |
| El catálogo es una pizarra de precios, no una grilla de tarjetas     | §4.0: 32 de 34 productos no tienen foto                        |
| El movimiento se hace con CSS, no con `motion`                       | §4.6                                                           |

### 4.1 Rutas

| Ruta                    | Sección                                 | Prioridad (ficha 5.1) | Renderizado           |
| ----------------------- | --------------------------------------- | --------------------- | --------------------- |
| `/`                     | Inicio                                  | 1                     | Estático + ISR        |
| `/nosotros`             | Historia, misión, visión, valores       | 3                     | Estático              |
| `/productos`            | Catálogo por categorías                 | 2                     | Estático + ISR        |
| `/productos/[slug]`     | Detalle de producto                     | —                     | Estático + ISR        |
| `/novedades`            | Promociones y anuncios                  | 1                     | ISR corto (vigencias) |
| `/novedades/[slug]`     | Detalle                                 | —                     | ISR                   |
| `/galeria`              | Fotos del local y productos             | 1                     | Estático              |
| `/contacto`             | Teléfonos, WhatsApp, correo, formulario | 1                     | Estático              |
| `/ubicacion`            | Mapa y referencias                      | 2                     | Estático              |
| `/preguntas-frecuentes` | FAQ                                     | 2                     | Estático              |

`/guias` queda fuera: la ficha (5.1) la marcó como no incluida, aunque las guías sí se administran (6.4). Se publican dentro de `/preguntas-frecuentes`.

**`/contacto` no lleva formulario**, y es una decisión, no un olvido. Un formulario obliga al negocio
a vigilar un buzón que hoy nadie vigila, y el cliente de esta panadería pide por WhatsApp. Uno que
nadie lee es peor que no tenerlo, porque promete una respuesta que no llega. Se reconsidera cuando el
panel tenga bandeja de entrada (F4).

### 4.2 Portada — orden de secciones

1. **Cabecera** — logo (administrable), navegación, botón de WhatsApp siempre visible
2. **Carrusel** (R2) — 3–4 slides, avance automático, controles accesibles, imagen distinta en móvil
3. **Franja de confianza** — tres datos duros de la ficha: _elaborado y vendido el mismo día_ · _delivery propio a toda Iquitos_ · _desde 2004_
4. **Destacados** — 6–8 productos con `destacado = true`, con foto y precio
5. **Delivery** — el diferencial, con llamado directo a WhatsApp
6. **Nuestra historia** — resumen de la ficha 1.8 con foto de la fachada, enlace a `/nosotros`
7. **Novedades vigentes** — hasta 3
8. **Testimonios** — si hay publicados
9. **Ubicación y horarios** — mapa y los dos turnos (ficha 1.9)
10. **Pie** — contacto, redes, horarios, aviso de privacidad

### 4.3 Componentes clave

| Componente         | Notas                                                                                                                                                                                                                                                                                                                                                                             |
| ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `CarruselPortada`  | Embla + autoplay. **Se detiene al enfocar o al pasar el mouse**, y respeta `prefers-reduced-motion`. El `h1` de la página va **oculto a la vista**: el titular del hero es el del slide y cambia cada seis segundos, así que un `h1` que cambia solo no le sirve a nadie, y sin `h1` quien navega con lector de pantalla no sabe dónde está. Los titulares de los slides son `h2` |
| `PizarraPrecios`   | Una fila por producto: nombre, puntos guía y precio grande; la presentación solo si informa. **Sin placeholder**: con 32 de 34 productos sin foto, un relleno repetido enfriaba el catálogo. Un producto con foto la muestra en su fila. En escritorio, dos columnas que se leen de arriba abajo                                                                                  |
| `BotonWhatsApp`    | Flotante en móvil, en línea en escritorio. Mensaje prellenado según el contexto                                                                                                                                                                                                                                                                                                   |
| `Mapa`             | Leaflet, carga diferida (no bloquea la portada), coordenadas desde `configuracion_sitio`                                                                                                                                                                                                                                                                                          |
| `Horario`          | Los dos turnos por día, **cada uno en su propia línea y en todos los tamaños**. Unirlos con un «y» en medio partía la línea justo por la hora de cierre en un teléfono, y se leía como un error de la página. Dos horarios distintos no son una frase, son dos datos. Marca que **domingos y feriados no hay atención**                                                           |
| `FiltroCategorias` | Filtro por categoría en `/productos`, con el estado en la URL (compartible e indexable)                                                                                                                                                                                                                                                                                           |

### 4.4 SEO — es su primera presencia digital

- [x] `metadata` por página: título, descripción, Open Graph, Twitter Card. Verificado por prueba que Next rellena `og:title` y `og:description` desde el `title` y la `description` de cada página
- [x] **JSON-LD tipo `Bakery`**: nombre, dirección, teléfono, coordenadas, horarios de los dos turnos (el domingo no figura: en schema.org un día que no aparece es un día cerrado) y rango de precios sacado del catálogo
- [x] JSON-LD `FAQPage` en preguntas frecuentes, solo si hay alguna publicada (vacío lo marca como error)
- [x] `sitemap.ts` y `robots.ts` generados desde la base. El sitemap **sin `lastModified`**: las vistas no exponen la fecha, y `new Date()` rompería el build con Cache Components y además le diría a Google que todo cambió hoy
- [x] URLs en español y con slug legible
- [x] Imagen Open Graph 1200 × 630 generada desde la marca, con el nombre y el precio más bajo leídos de la base
- [ ] Verificación en Google Search Console tras el despliegue
- [ ] **Crear el perfil de Google Business** — la ficha (3.4) dice que no lo tienen. Para una panadería local, pesa tanto como el sitio

**Tres cosas que costó averiguar para la imagen para compartir**, las tres leyendo la documentación
de Next antes de escribir código:

- `ImageResponse` **no acepta woff2**, que es el formato de las fuentes del sitio. Solo ttf, otf y
  woff, y tampoco maneja bien las fuentes variables. Las de `src/recursos/compartir/` son las mismas
  Fraunces e Inter convertidas a TTF estáticas; ninguna declara _Reserved Font Name_, así que la OFL
  permite conservar el nombre. El procedimiento y el aviso de licencia están junto a los archivos.
- El isotipo en PNG solo existía en `DOC/Fotos...`, que está fuera de git. Se copió al repositorio.
- El paquete de la imagen tiene un límite de **500 KB** con fuentes y logos. Hoy son unos 125 KB.

**La URL del sitio** sale de `src/lib/sitio.ts`, en este orden: `NEXT_PUBLIC_SITE_URL` (la del
dominio, cuando llegue), `VERCEL_PROJECT_PRODUCTION_URL` (para desplegar antes del dominio sin
publicar URLs de `localhost`) y `http://localhost:3000`. Si sale mal no se ve en ninguna pantalla:
el sitemap le diría a Google que el catálogo vive en `localhost`.

### 4.5 Rendimiento

Objetivo: **LCP por debajo de 2.5 s en 4G**. Iquitos tiene conectividad móvil variable y el móvil es prioritario (R6).

- Imágenes por `next/image`, con AVIF/WebP y `sizes` correcto ✅
- La primera imagen del carrusel con `priority`; las demás diferidas ✅
- Leaflet cargado con `dynamic()` — no entra en el paquete inicial ✅ (hay prueba de que no aparece en la portada)
- Fuentes locales con `display: swap` y precarga solo de la variante usada ✅
- **`cacheComponents: true`**: el sitio sale como HTML estático y lo que depende de la petición llega
  después, en streaming. Con eso el LCP deja de depender de la latencia de la base ✅

#### El presupuesto de 150 KB estaba por debajo del suelo del framework

El borrador de este documento pedía **menos de 150 KB de JavaScript comprimido** en la portada. Al
medirlo de verdad:

| Página                                                 | JavaScript comprimido |
| ------------------------------------------------------ | --------------------- |
| `/nosotros` — sin carrusel, sin filtros, todo servidor | 150 KB                |
| `/` — con carrusel, destacados y todo lo demás         | 150 KB                |

**Los 150 KB son React 19 más Next 16.** El código de la aplicación no llega a marcar diferencia. Un
presupuesto puesto justo en el suelo del framework no mide el trabajo de nadie: o pasa por
milímetros o falla el día que Next cambie de versión, y en ninguno de los dos casos dice algo útil.

Lo que se vigila ahora, con prueba automática en cada PR:

1. Un **techo absoluto con margen** (175 KB), que avisa si el framework se dispara.
2. **Cuánto añade la portada sobre una página que solo tiene servidor**, que es lo único que
   controlamos. Si alguien importa una librería de gráficos en la portada, salta aunque el suelo
   cambie. Hoy añade **0 KB**.

`/ubicacion` queda fuera de ese techo a propósito: carga un mapa porque quien entra en «dónde
estamos» viene a verlo. Se vigila con su propio límite (194 KB medidos, tope 250).

**Desde F4, el umbral de rendimiento del sitio público es relativo, no absoluto** (decisión 3 de
Dan, 14/09/2026): ningún PR de F4 puede bajar la mediana de `PASADAS=5 pnpm lighthouse` en una ruta
pública más de **3 puntos**, medida en la misma sesión contra `main` (`git stash` + `git checkout
main` + build; nunca contra un número guardado de otro día — es la misma trampa de medición que ya
costó una fase en F3.1). Sustituye al «≥ 90 en móvil» de este documento, que la investigación de
arriba ya había dejado sin sustento: el suelo lo pone React 19 + Next 16, no el código del proyecto.
Solo las tareas que tocan código que llega al sitio público quedan obligadas a medir (en F4, la de
productos y la de configuración/favicon, por tocar el layout raíz); el resto del panel no carga nada
en las rutas públicas y no necesita remedirlas.

**Dos trampas de medición**, las dos del tipo que ya salió caro antes:

- Sumar la cabecera `content-length` de las respuestas daba **2 KB** y la prueba pasaba. Esa cabecera
  no viene en respuestas troceadas: era una comprobación que pasaba sin medir.
- `transferSize` sí mide, pero el servidor de producción local sirve el JavaScript **sin comprimir**:
  daba 495 KB donde el visitante recibe 150. Comparar eso contra un presupuesto que habla de bytes
  comprimidos es comparar dos cosas distintas. Ahora se descargan los guiones y se comprimen antes de
  contar.

### 4.6 Movimiento

El sitio aparece por bloques al bajar: cada foto y cada caja de texto entra con una subida corta y un
fundido, las rejillas escalonan sus tarjetas, las fotos se acercan un poco al pasar el mouse y el
botón de pedido se hunde un píxel al pulsarlo.

Se hace con **animaciones guiadas por el scroll de CSS nativo** (`animation-timeline: view()`), **sin
una sola línea de JavaScript**, y eso es consecuencia directa de §4.5: `motion` habría costado más
que todo el código de la aplicación junto. Con 4G irregular y el móvil como prioridad, eso se le
cobra al visitante. La librería se quitó de las dependencias para que nadie la alcance por descuido.

Tres salvaguardas, con prueba cada una:

| Salvaguarda                                                 | Qué evita                                                                                                                                             |
| ----------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| Todo dentro de `@supports`                                  | Un navegador que no conozca la técnica muestra el contenido tal cual. El estado por defecto es «visible»: si algo falla, se ve                        |
| Dentro de `prefers-reduced-motion: no-preference`           | Quien pide menos movimiento no recibe ninguno, y lo recibe visible                                                                                    |
| **Apagado al imprimir**                                     | Sin scroll no hay línea de tiempo: la animación se congela en su primer fotograma y el bloque saldría en blanco sobre el papel. Lo encontró la prueba |
| **Termina mientras el bloque entra** (`entry 0% entry 70%`) | Con la página quieta, que lo que ya se ve entero siga a medio aparecer. Ver abajo                                                                     |

Detalle que costó ver: la regla de impresión tiene que ir **al final** del bloque. A igualdad de
especificidad manda la última, y colocada antes no apagaba las rejillas.

**La cuarta salvaguarda llegó tarde, y conviene contar por qué.** La primera versión terminaba la
aparición en `cover 25%`, cuando el bloque ya llevaba un cuarto de pantalla recorrido. Con la página
quieta, lo que se veía entero seguía a medias: en el primer pliegue del celular «Del día» a opacidad
0.40 y «Desde 2004» a 0.1, y las tarjetas con su precio a 0.7. Quien entraba y no tocaba nada no veía
dos de los tres argumentos de venta.

Había una prueba que decía cubrir que nada se quedara invisible, pero centraba cada bloque en
pantalla antes de medirlo: siempre medía el mejor caso. Lo encontró la crítica de diseño con la
página quieta, ya en `main`. La corrección tiene tres partes: el rango termina mientras el bloque
entra; la franja de confianza, que está en el primer pliegue del celular, ya no se anima; y dos
pruebas nuevas que no ayudan a la animación. Una comprueba que con la página quieta nada entero en
pantalla baje de 0.95 —se escribió primero y **falló contra el código anterior**, que es lo que
demuestra que caza el fallo—. La otra comprueba que al bajar algún bloque se vea a medio camino,
porque el arreglo más fácil de lo primero es romper el movimiento entero sin que nada falle.

---

## 5. Panel de administración (F4–F6)

### 5.1 Principio rector

El panel lo usan personas con **nivel de computadora básico** (ficha 6.5) desde computadora **y celular** (ficha 8.5). Esto no es un detalle de estilo, es la restricción principal:

- Español claro, cero jerga. "Guardar", no "Persistir". "Publicado", no "Estado: activo"
- Una acción principal por pantalla, visible sin desplazarse
- Confirmación explícita antes de borrar, diciendo **qué** se borra — y sin prometer una
  recuperación que el panel no tiene: el texto dice «pide ayuda al encargado del sistema», no
  «puedes deshacerlo»
- Errores que explican qué hacer, no códigos
- **Todo formulario guarda borrador, con una copia local automática en el navegador** (decisión de
  Dan, 14/09/2026): mientras se escribe, `FormularioPanel` guarda el texto (nunca fotos) bajo una
  clave `pimpos:borrador:<ruta>` en `localStorage`; si la persona vuelve a esa pantalla con algo sin
  guardar, ve «Tienes cambios sin guardar… Recuperarlos / Descartar». Piezas compartidas desde F4,
  tarea 2: `src/lib/panel/borrador.ts`. La copia se borra al guardar con éxito, al cerrar sesión y al
  llegar a `/ingresar` sin sesión — no sobrevive a un cambio de quién usa el teclado, porque puede
  llevar datos personales. React 19 vacía un `<form action={...}>` al terminar la acción, también al
  volver con errores, así que `FormularioPanel` no usa `action`: envía con `onSubmit` +
  `startTransition` para no perder lo escrito justo cuando hay que corregirlo. Y un control de Radix
  (`Select`, `Switch`) no se restaura solo con rellenar el HTML: el propio componente tiene que
  aplicar el valor guardado al montar.
- **Todas las tablas funcionan a 375 px** de ancho — en móvil se convierten en tarjetas, no en tablas con desplazamiento lateral

### 5.2 Rutas

| Ruta                                                            | Módulo                                                            | Roles                                         |
| --------------------------------------------------------------- | ----------------------------------------------------------------- | --------------------------------------------- |
| `/admin`                                                        | Dashboard: alertas, atajos, actividad reciente                    | Todos                                         |
| `/admin/contenido/productos`                                    | Productos, variantes, imágenes                                    | superadmin, admin, ingeniero                  |
| `/admin/contenido/categorias`                                   | Categorías                                                        | ídem                                          |
| `/admin/contenido/novedades`                                    | Novedades y promociones **con aprobación**                        | ídem (publicar promo: solo admin/superadmin)  |
| `/admin/contenido/slides`                                       | Carrusel de portada                                               | ídem                                          |
| `/admin/contenido/galeria` · `/faq` · `/guias` · `/testimonios` | Resto de contenido                                                | ídem                                          |
| `/admin/insumos`                                                | Insumos, kárdex, alertas, reportes                                | ídem                                          |
| `/admin/clientes`                                               | Clientes, fotos, zonas, mapa                                      | + repartidor                                  |
| `/admin/usuarios`                                               | Usuarios y roles                                                  | superadmin, admin (eliminar: solo superadmin) |
| `/admin/auditoria`                                              | Historial de cambios                                              | superadmin, admin                             |
| `/admin/configuracion`                                          | **Logo, favicon, contacto, coordenadas, horarios, redes, textos** | superadmin, admin                             |

### 5.3 Flujo de aprobación de promociones (R10)

```
Ingeniero crea    →  borrador
Ingeniero envía   →  en_revision   (notifica a administradores)
Administrador     →  publicado     (queda registrado quién y cuándo)
                  →  o devuelve a borrador con un comentario
```

En la interfaz, el botón "Publicar" simplemente **no existe** para el ingeniero cuando la novedad es de tipo promoción; ve "Enviar a revisión". Y aunque la interfaz fallara, la base lo rechaza (documento 02, §8.1).

### 5.4 Subida de imágenes

Camino único para todo el panel:

1. El usuario elige archivo o **toma la foto con la cámara** (`capture="environment"`, R14)
2. `browser-image-compression` redimensiona a máx. 1600 px y convierte a WebP **en el navegador**
3. Se sube al bucket que corresponda
4. Se guarda la ruta en la base

El paso 2 no es opcional: sin él, una foto de celular de 4 MB llena el gigabyte gratuito de Storage en unas 250 fotos.

### 5.5 Configuración de marca (R21)

En `/admin/configuracion`, pestaña **Marca**:

- Subir **logo** (WebP/PNG/SVG, máx. 2 MB) con vista previa sobre fondo claro y oscuro
- Subir **favicon** (SVG/PNG/ICO) con vista previa a 16, 32 y 180 px, para que se vea si es legible antes de guardar
- Al guardar: `updateTag(ETIQUETAS.marca)` refresca el sitio público sin volver a desplegar

**Implementado (F4, tarea 7) con `generateMetadata`, no con `app/icon.tsx`/`app/apple-icon.tsx`.**
`ImageResponse` (`next/og`), el motor detrás de un `icon.tsx` dinámico, no dibuja bien un SVG — y el
favicon de fábrica del sitio es un SVG. `app/layout.tsx` exporta un `generateMetadata` asíncrono que
añade `icons.icon` desde `obtenerConfiguracion()` (`"use cache"`, etiqueta `marca`); sin favicon
subido, resuelve a `/marca/favicon.svg` en `public/`. `icons.apple` queda fijo en
`public/marca/apple-touch-icon.png`, porque Apple no acepta SVG para el icono de inicio.

### 5.6 Dashboard

Con la skill `dataviz`:

- Tarjetas de alerta: insumos bajo el mínimo, lotes por vencer en 15 días (R12, prioridad 1)
- Consumo de insumos por periodo (barras)
- Mermas y pérdidas por motivo (ficha 7.8, prioridad 1)
- Valorización del inventario
- Actividad reciente desde `auditoria`

Todos los gráficos con **texto alternativo y tabla de datos accesible** — un gráfico que solo comunica por color no comunica.

---

## 6. Pruebas

| Tipo              | Qué cubre                                                                                                                                                                                        |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Vitest**        | Conversión de unidades, cálculo de saldos, formato de moneda, armado de enlaces `wa.me`, generación de slugs                                                                                     |
| **Playwright**    | Ingreso por rol · publicar producto · **ingeniero intenta publicar promoción y es rechazado** · registrar movimiento de insumo · crear cliente con foto · exportar a Excel                       |
| **Manual**        | Cada pantalla a 375 px, 768 px y 1440 px                                                                                                                                                         |
| **Accesibilidad** | **axe automatizado** en `e2e/accesibilidad.spec.ts`, en cada PR: 12 rutas públicas × 2 tamaños + el menú del celular abierto, sin desactivar ninguna regla; navegación completa solo con teclado |
| **Lighthouse**    | `pnpm lighthouse`, a mano. **No va en el CI**: mide tiempos, y un tiempo depende de la máquina — en un runner compartido el mismo sitio da 96 y luego 78, y pondría en rojo ramas sanas          |

**El panel (F4) tiene su propia capa, además de la del sitio público:**

| Tipo                                  | Qué cubre                                                                                                                                                                                                                                                                                         |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`e2e/panel-accesibilidad.spec.ts`** | axe **y** área táctil (≥ 44 × 44 px) por **cada ruta** del panel, en `RUTAS_DEL_PANEL` (21 rutas al cierre de F4: dashboard, cada módulo de contenido y su `nueva/`, usuarios y su `nuevo/`, configuración). Al añadir una ruta, se añade a la lista                                              |
| **`e2e/panel-*.spec.ts` por módulo**  | Un flujo completo por módulo — crear, editar, publicar, borrar — desde la interfaz, no llamando a la Server Action directamente. `panel-usuarios.spec.ts` cubre además el primer ingreso con cambio de contraseña obligatorio                                                                     |
| **`e2e/panel-sesiones.spec.ts`**      | Que desactivar, restablecer la contraseña o cambiar el rol de otra persona le cierre la sesión **en el acto** (dos navegadores: uno actúa, el otro es el afectado), y que cambiar la propia contraseña no cierre nada                                                                             |
| **Vitest por regla de autorización**  | Cada función pura que decide quién puede hacer qué (`puedeGestionarAcceso`, `puedeRestablecerClave`, `rolesQuePuedeAsignar`) tiene su tabla de verdad completa, no solo casos sueltos                                                                                                             |
| **pgTAP por migración**               | Cada migración de F4 (`0026`–`0032`) prueba su regla de base, con las pruebas negativas exigiendo el código y el texto exacto del error, no solo «algo falló»                                                                                                                                     |
| **Carreras entre proyectos**          | Las pruebas que escriben en una fila compartida (`configuracion_sitio`, el orden de `faqs`) se restringen a un solo proyecto de Playwright o usan un cerrojo entre procesos (`e2e/ayudas/cerrojo.ts`) — dos proyectos en paralelo sobre la misma fila se pisan aunque cada uno mida algo distinto |

---

## 7. Checklist de cierre de F3 (sitio público en producción)

Lo marcado se comprobó ejecutándolo, no leyéndolo.

**Construcción**

- [x] Las 8 secciones construidas y navegables
- [x] Carrusel **solo en escritorio**, con los slides semilla y pausa al enfocar y al pasar el mouse.
      En el celular no hay carrusel (decisión de Dan, 12/09/2026): foto quieta, el nombre a la vista,
      si está abierto ahora y el botón de pedir. El aviso que lo destapó: la pausa era por _hover_ y
      por foco, y en un teléfono no ocurre ninguna de las dos, así que el mensaje cambiaba cada seis
      segundos bajo el dedo de quien lo estaba leyendo — justo donde el móvil es prioritario (R6)
- [x] Catálogo mostrando los 34 productos con precio confirmado, filtrable por categoría
- [x] WhatsApp operativo desde portada, catálogo, ficha de producto y contacto, con el mensaje escrito
- [x] Mapa cargando con las coordenadas reales, en diferido
- [x] Horarios correctos, con cada turno en su línea y el domingo cerrado
- [x] Un solo `h1` por página, y ninguna sin él
- [x] Todo funciona a 375 px
- [x] Presupuesto de JavaScript vigilado por prueba automática
- [x] `sitemap.xml` y `robots.txt` accesibles, con URLs absolutas y sin rastro del panel
- [x] Imagen para compartir el enlace (1200 × 630), descargada y comprobada como PNG real
- [x] Datos estructurados `Bakery` y `FAQPage` presentes y con la forma correcta, verificado por prueba
- [x] **Desplegado en Vercel** (12/09/2026), con la base de producción cargada: 34 productos, 10
      fotos de galería, los 3 slides de la migración 0023 y las 62 imágenes en sus buckets

**Cerrado en el último tramo** (12/09/2026)

- [x] **Sin errores de axe en ninguna página.** `e2e/accesibilidad.spec.ts` pasa axe por las 12 rutas
      públicas en los dos tamaños y con el menú del celular abierto, con las reglas WCAG 2.1 AA más
      las buenas prácticas y **sin desactivar ninguna**. Encontró cuatro problemas reales, los cuatro
      corregidos: el botón flotante de WhatsApp vivía fuera de todo _landmark_, la cabecera y el pie
      llevaban dos `nav` con el mismo nombre, y el `<dl>` de contacto anidaba los `dt`/`dd` dos
      niveles por debajo de su grupo. Corre en cada PR
- [x] **Lighthouse en móvil: accesibilidad ≥ 95 ✅ y SEO 100 ✅.** Medido con `pnpm lighthouse` contra
      producción: SEO 100 en las seis rutas medidas, accesibilidad 96–100 y buenas prácticas 96–100
- [x] **Rendimiento ≥ 90 en móvil: investigado a fondo y NO alcanzable con este stack.** Tres
      hipótesis medidas y las tres descartadas, incluida una que llegó a implementarse y se revirtió
      porque medía peor. Ver «El rendimiento, medido» aquí debajo

**Pasa a la Fase 4.** Nada de esto bloquea el cierre de F3: depende del negocio, de una URL con
dominio propio, o de una decisión sobre el umbral.

- [x] **Decidir qué se hace con el umbral de rendimiento.** Decidido en F4 (decisión 3, 14/09/2026):
      el umbral pasa de absoluto (≥ 90) a **relativo** — ningún PR baja la mediana más de 3 puntos
      contra `main`, medida en la misma sesión. Ver §4.5, «Desde F4, el umbral de rendimiento del
      sitio público es relativo, no absoluto»
- [ ] JSON-LD validado con la herramienta de resultados enriquecidos de Google. La forma ya la
      comprueba una prueba; la herramienta necesita una URL pública
- [ ] Verificado en Chrome y Safari móvil **reales**, no solo en el emulador
- [ ] Dominio conectado con HTTPS
- [ ] Google Search Console verificado
- [ ] Revisado con el propietario y con Marcos y Debra

### El rendimiento, medido (12/09/2026)

Lighthouse móvil contra producción, antes de tocar nada:

| Ruta                       | Rendimiento | Accesibilidad | Buenas prácticas | SEO |
| -------------------------- | ----------- | ------------- | ---------------- | --- |
| `/`                        | **71**      | 100           | 100              | 100 |
| `/productos`               | **87**      | 100           | 100              | 100 |
| `/productos/leche`         | **84**      | 100           | 100              | 100 |
| `/productos/frances-chico` | **89**      | 96            | 100              | 100 |
| `/ubicacion`               | **65**      | 100           | 96               | 100 |
| `/contacto`                | **88**      | 93            | 100              | 100 |

**Un derroche real, encontrado y corregido.** En el celular la portada se bajaba **la misma foto de
la fachada dos veces**: 41 KB para `PortadaMovil`, que es la que se ve, y 32 KB más para la primera
diapositiva del carrusel, que en el celular está en `display:none` y no se ve nunca. Las dos llevaban
`priority`, que inyecta un `<link rel=preload>` en el `<head>` — y un preload no mira si el elemento
está oculto. Ya se había intentado evitar con `sizes="(max-width: 639px) 1px, 100vw"`, y eso **no
impide la descarga**: solo hace que el navegador elija la candidata más pequeña del `srcset`, que son
640w. Costaba justo donde más duele: 32 KB compitiendo por el ancho de banda mientras se descarga el
LCP, en la pantalla prioritaria y con la conectividad de Iquitos. Hay prueba (`presupuesto.spec.ts`),
y se vio fallar contra el código anterior.

### Por qué el rendimiento no llega a 90, medido y no supuesto

**Primero, dónde está el problema de verdad.** El desglose del LCP de la portada en móvil:

| Fase del LCP         | Tiempo      |
| -------------------- | ----------- |
| Hasta el primer byte | 36 ms       |
| Descubrir la imagen  | 31 ms       |
| Descargar la imagen  | 77 ms       |
| **Pintarla**         | **2207 ms** |

La imagen está lista en 144 ms. Los 2.2 s siguientes son el navegador **sin poder pintar** porque el
hilo principal está ocupado. O sea: el LCP (peso 25 sobre 100) y el tiempo de bloqueo (peso 30) no
son dos problemas, son **el mismo**: la hidratación de React. Un solo archivo —el runtime de React 19
más Next 16, 70 KB comprimidos— se lleva ~945 ms de ejecución.

Eso descarta de entrada todo el repertorio habitual: comprimir más las fotos, otro formato, un CDN,
`preconnect`. La imagen no es el cuello de botella.

**Tres hipótesis, las tres medidas, las tres descartadas.**

| Hipótesis                                                                               | Cómo se probó                                                      | Resultado                                                                                                                                                                                                                                                                                            |
| --------------------------------------------------------------------------------------- | ------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Las animaciones de scroll** cuestan estilo y maquetación (`styleLayout` salía 708 ms) | El mismo build con `--force-prefers-reduced-motion`, que las apaga | ❌ No mejora: `styleLayout` 473 → 404 ms y la puntuación igual o peor. **No se tocan**                                                                                                                                                                                                               |
| **Embla se inicializa en el celular** aunque el carrusel esté oculto                    | `active: false` con `breakpoints` en las opciones de embla         | ❌ El módulo se descarga igual y el bloqueo se quedó en 325 ms, o sea en la línea de partida                                                                                                                                                                                                         |
| **No mandar el carrusel al celular**, con `next/dynamic` y el hero estático en el HTML  | Implementado entero: se midió y **se revirtió**                    | ❌ Consiguió el objetivo (embla fuera, 150 → 144 KB, carrusel fuera del DOM) y aun así midió **peor, dos veces**: bloqueo 548 y 734 ms frente a 280 y 371 de las líneas base que lo rodeaban. Pasar contenido del servidor a través de una frontera de cliente cuesta más de lo que ahorran los 8 KB |

**El techo, medido.** Quitando el carrusel **entero** —que no es una opción, porque escritorio lo
necesita— el bloqueo baja a 199 ms y la ejecución a 742 ms. Y aun así la mediana local se queda en
**83**, no en 90. Producción mide 71.

Esos 742 ms que quedan **sin carrusel ninguno** son React 19 + Next 16 hidratando la página. Es el
mismo suelo de framework que este plan ya midió para el peso —los 150 KB que obligaron a revisar el
presupuesto— visto ahora desde el tiempo de CPU.

**Qué haría falta para llegar a 90:** quitar interactividad de cliente. En esta portada eso significa
el menú desplegable, «Abierto ahora», el botón flotante de WhatsApp y el carrusel — y las cuatro
entraron **a propósito**, tres de ellas como respuesta a una crítica de diseño. Cambiar accesibilidad
y utilidad reales por una cifra de laboratorio sería el peor negocio posible para este proyecto.

**La recomendación**, para que la decida Dan y no un guion: tratar el umbral como ya se trató el
presupuesto de JavaScript —revisarlo con la evidencia— y vigilar en su lugar lo que sí está en
nuestra mano: que la portada no añada trabajo de cliente sobre una página sin interacción. Ese es el
número que mide nuestro trabajo; 90 mide el de React.

**Y una lección de método.** La primera versión de esta investigación se hizo con **una** medición
por escenario, y con eso se llegó a dar por bueno un cambio que en realidad empeoraba. Midiendo la
misma portada cinco veces seguidas, sin tocar nada, la puntuación salió 71, 91, 81, 80 y 82. Desde
entonces `pnpm lighthouse` acepta `PASADAS=5` e informa la **mediana** con todas las pasadas al lado,
para que la dispersión se vea.

**Un falso positivo que conviene reconocer**, porque volverá a salir: Lighthouse marca
`color-contrast` 4.28 en un enlace de la ficha de producto. El color computado es `#986722` y el
token es `#8f5a10`, que da 5.06. `#986722` es exactamente `#8f5a10` **a 0.913 de opacidad** sobre el
crema: es la aparición por scroll, congelada a medio camino porque Lighthouse mide la página sin
bajar nunca. Un visitante lee ese texto después de bajar, y entonces está opaco —hay prueba de eso
desde el 11/09—. Por eso `e2e/accesibilidad.spec.ts` apaga las animaciones antes de medir, y es axe
quien manda sobre el contraste, no la captura de Lighthouse.

**Un hueco declarado, no cubierto.** Las imágenes semilla no viven en el repositorio (están en la
carpeta del cliente), así que en el CI los buckets están vacíos y las comprobaciones que miran si una
foto **se ve** se saltan diciendo por qué. Localmente sí se ejecutan. Para cubrirlo habría que meter
unos 4 MB de imágenes en el repositorio o subirlas desde el flujo de trabajo; conviene decidirlo
antes de F4.
