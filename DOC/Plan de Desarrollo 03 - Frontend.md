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
ellas, y las cubren **136 pruebas de navegador** a 375 px y en escritorio.

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
| P1        | El botón flotante tapa contenido en portada, catálogo, FAQ, 404 y galería | 🔄                |
| P1        | El logo de escritorio sigue ilegible (el arreglo solo llegó a móvil)      | 🔄                |
| P2        | Los productos con dos presentaciones se piden a ciegas                    | ⬜                |
| P2        | Nadie dice si la panadería está abierta ahora                             | ⬜                |

**Dos decisiones de fondo que la crítica cuestiona y que NO se tocan** (decisión de Dan, 12/09/2026):
el carrusel —cuesta una librería, rota el mensaje bajo el dedo del cliente, no se pausa en móvil y
obliga a esconder el `h1`— y que la portada no sea directamente el catálogo. El carrusel es el
requisito R2 de la ficha, así que **son preguntas para el propietario**, no decisiones técnicas: hay
que planteárselas cuando se le enseñe el sitio, con el dato de que hoy el visitante cruza un carrusel
y una franja de iconos antes de ver siete de los treinta y cuatro productos.

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
- Confirmación explícita antes de borrar, diciendo **qué** se borra
- Errores que explican qué hacer, no códigos
- Todo formulario guarda borrador: perder una conexión no debe perder el trabajo
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
- Al guardar: `revalidateTag('marca')` refresca el sitio público sin volver a desplegar

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

| Tipo              | Qué cubre                                                                                                                                                                  |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Vitest**        | Conversión de unidades, cálculo de saldos, formato de moneda, armado de enlaces `wa.me`, generación de slugs                                                               |
| **Playwright**    | Ingreso por rol · publicar producto · **ingeniero intenta publicar promoción y es rechazado** · registrar movimiento de insumo · crear cliente con foto · exportar a Excel |
| **Manual**        | Cada pantalla a 375 px, 768 px y 1440 px                                                                                                                                   |
| **Accesibilidad** | axe DevTools en las 8 páginas públicas; navegación completa solo con teclado                                                                                               |

---

## 7. Checklist de cierre de F3 (sitio público en producción)

Lo marcado se comprobó ejecutándolo, no leyéndolo.

**Construcción**

- [x] Las 8 secciones construidas y navegables
- [x] Carrusel funcionando con los slides semilla, con pausa al enfocar y al pasar el mouse
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

**Pendiente**

- [ ] JSON-LD validado con la herramienta de resultados enriquecidos de Google. La forma ya la comprueba una prueba; la herramienta necesita una URL pública, así que va tras el despliegue
- [ ] Lighthouse: rendimiento ≥ 90, accesibilidad ≥ 95, SEO 100 en móvil
- [ ] Sin errores de axe en ninguna página
- [ ] Verificado en Chrome y Safari móvil **reales**, no solo en el emulador
- [ ] Dominio conectado con HTTPS
- [ ] Google Search Console verificado
- [ ] Revisado con el propietario y con Marcos y Debra

**Un hueco declarado, no cubierto.** Las imágenes semilla no viven en el repositorio (están en la
carpeta del cliente), así que en el CI los buckets están vacíos y las comprobaciones que miran si una
foto **se ve** se saltan diciendo por qué. Localmente sí se ejecutan. Para cubrirlo habría que meter
unos 4 MB de imágenes en el repositorio o subirlas desde el flujo de trabajo; conviene decidirlo
antes de F4.
