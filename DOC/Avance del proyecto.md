# Avance del proyecto — Panadería Pimpo's

**Corte:** 12/09/2026
**Repositorio:** https://github.com/dNogueira300/PIMPOS_SYSTEM
**Producción:** proyecto Supabase `pimpos-produccion` (región São Paulo)
**Sitio desplegado:** https://pimpos-system-iota.vercel.app — sin dominio propio todavía

Este documento resume qué está hecho, qué decisiones se tomaron y por qué, y qué falta. Es el que
hay que leer para ponerse al día sin recorrer el historial de commits.

---

## 1. Dónde estamos

| Fase   | Nombre                   | Estado                                                                       |
| ------ | ------------------------ | ---------------------------------------------------------------------------- |
| **F0** | Preparación de servicios | ✅ Cerrada el 06/09                                                          |
| **F1** | Fundación técnica        | ✅ Cerrada el 07/09                                                          |
| **F2** | Backend de datos         | ✅ Cerrada el 08/09                                                          |
| **F3** | Sitio público            | 🔄 Desplegado. Crítica 24/40 → 29/40, cerrada entera. Falta dominio y pulido |
| F4     | Panel: contenido         | ⬜                                                                           |
| F5     | Panel: insumos           | ⬜                                                                           |
| F6     | Panel: clientes          | ⬜                                                                           |
| F7     | Cierre                   | ⬜                                                                           |

**Adelanto respecto al cronograma.** El plan (doc 00 §3) daba la semana 1 a F0, la 2 a F1, la 3 a
F2 y la 4 a F3. Las tres primeras están cerradas y F3 tiene ya sus ocho secciones en pie, leyendo
de la base. El margen ganado importa porque el cronograma no tenía semana de reserva.

---

## 2. Lo que ya funciona

### Infraestructura

Supabase en producción y en local (Docker), con las mismas migraciones en los dos. Autenticación por
correo con **registro público cerrado**: los usuarios los crea el administrador, nadie se da de alta
solo. El rol viaja dentro del JWT, así que las políticas de seguridad lo leen sin consultar ninguna
tabla en cada petición.

Tres automatizaciones en GitHub Actions:

- **CI** en cada PR: migraciones desde cero, pruebas de base de datos, tipos, linter, formato,
  pruebas unitarias y pruebas de navegador.
- **Respaldo semanal** de la base, retenido 90 días.
- **Keep-alive cada 3 días**, que evita que Supabase pause el proyecto por inactividad. No es
  opcional: si se pausa, las tareas programadas dejan de correr.

### Aplicación

Next.js 16 con React 19 y Tailwind 4. Sitio público y panel en un mismo proyecto, separados por
zonas. Autenticación funcionando con los 4 roles, con guardia de navegación y comprobación en cada
página.

Sistema de diseño aplicado: colores sacados del logo y de las fotos reales del local, tipografía
Fraunces + Inter servida desde el propio proyecto, y contraste AA **verificado por pruebas**, no
afirmado en un comentario.

### Sitio público

**Las ocho secciones están en pie y leen de la base**, no del código: portada, catálogo con filtro
por categoría, ficha de cada producto, novedades, nosotros, galería, ubicación con mapa, preguntas
frecuentes y contacto.

| Sección   | Qué trae                                                                                                             |
| --------- | -------------------------------------------------------------------------------------------------------------------- |
| Portada   | Carrusel, tres datos de confianza, destacados con precio, delivery, historia, novedades, testimonios, dónde y cuándo |
| Productos | Los 34 del catálogo en una pizarra de precios por categoría, filtrable                                               |
| Producto  | Precio y pedido por WhatsApp junto a las condiciones del delivery; sin foto, el precio va de titular                 |
| Novedades | Solo lo vigente hoy. Lo caducado desaparece solo                                                                     |
| Nosotros  | Historia, misión, visión y los cuatro valores, literales de la ficha                                                 |
| Galería   | Las 10 fotos reales del local, agrupadas por zona                                                                    |
| Ubicación | Mapa de OpenStreetMap, cargado en diferido                                                                           |
| Preguntas | Las 5 de la ficha más las 2 guías, en acordeón nativo                                                                |
| Contacto  | WhatsApp con el número escrito, teléfono, correo, dirección, horario y condiciones del delivery                      |

El build genera **52 páginas estáticas**, los 34 productos entre ellas. El contenido cambia sin
tocar código: cuando el panel publique (F4), se invalidará por etiqueta y el sitio se refresca solo.

**El movimiento** (aparición de bloques al bajar, escalonado de las rejillas, acercamiento de las
fotos, hundimiento del botón al pulsarlo) está hecho con **CSS nativo guiado por el scroll**, sin
una sola línea de JavaScript. El motivo está medido y se explica en §3.

**Corregido el 11/09.** La aparición terminaba tarde y, con la página quieta, dejaba a medias lo
que ya se veía entero: en el celular, «Desde 2004» a opacidad 0.1 y los precios de las tarjetas a
0.7. La prueba que decía cubrirlo centraba cada bloque antes de medir, así que siempre medía el
mejor caso. Lo encontró la crítica de diseño. Ahora hay una prueba de reposo, que se vio **fallar**
contra el código anterior antes de arreglarlo, y otra que comprueba que el movimiento sigue ahí.

**El momento de pedir, corregido el 11/09.** Pulsar «Pedir por WhatsApp» era un salto a ciegas: nada
decía cuánto costaba el envío ni qué había que escribir. Ahora, junto a cada botón de pedir van qué
pasa al pulsarlo, el número escrito como se dicta y las condiciones del delivery (costo, mínimo,
tiempo, formas de pago y zonas), que salen de la configuración y no del código; varias están
inventadas a propósito, ver §5. El mensaje llega con el hueco para la cantidad y la dirección, cada
«escríbenos por WhatsApp» del sitio se puede pulsar y la base rechaza un valor con la forma
equivocada antes de que llegue a la página.

**La pizarra de precios, 11/09.** 32 de los 34 productos no tienen foto, y la rejilla de tarjetas los
mostraba como 32 croissants de relleno idénticos, con «Unidad» debajo de casi todos. El catálogo, los
destacados de la portada y los «También en…» de la ficha son ahora una lista de mostrador: nombre,
puntos guía y precio grande, agrupada por categoría. Los productos con foto la conservan en su fila,
y cada producto la ganará solo cuando el negocio las suba. La ficha sin foto ya no reserva una caja
vacía: el precio ocupa ese sitio a tamaño de titular. La presentación solo se dice cuando informa
(«Por kilo», «2 presentaciones»), y el mensaje de WhatsApp dejó de decir «(Unidad)».

**El SEO está hecho.** Es la primera presencia digital del negocio (ficha 3.4), así que no se trata
como un añadido:

| Pieza                         | Qué consigue                                                                                                             |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Datos estructurados `Bakery`  | Que Google muestre dirección, horario de dos turnos, teléfono y rango de precios junto al nombre, sin entrar a la página |
| Datos estructurados `FAQPage` | Que las preguntas frecuentes puedan salir desplegables en el propio resultado                                            |
| `sitemap.xml`                 | Las 42 URLs públicas, generadas desde la base: un pan nuevo aparece solo                                                 |
| `robots.txt`                  | El panel y la pantalla de ingreso fuera del índice                                                                       |
| Imagen para compartir         | Lo que ve quien recibe el enlace por WhatsApp: el isotipo, el nombre y «Desde S/ 0.10», leído del catálogo               |

Nada de esto se ve en la pantalla de nadie, y por eso tiene **6 pruebas** que piden cada archivo y
comprueban lo que vuelve: que la imagen sea un PNG real y no un error, que el sitemap no filtre el
panel, que el horario salga con el domingo cerrado.

### Base de datos

**27 tablas, todas con seguridad a nivel de fila activada.** Ninguna sin proteger. Y **11 vistas,
todas con `security_invoker`**, que es lo que impide que una vista salte esa seguridad.

| Bloque           | Qué contiene                                                                      |
| ---------------- | --------------------------------------------------------------------------------- |
| Roles y perfiles | Los 4 roles y el perfil de cada usuario                                           |
| Auditoría        | Quién cambió qué y cuándo. No se puede editar ni borrar                           |
| Configuración    | Logo, favicon, coordenadas, horarios, contacto y textos, todo administrable       |
| Catálogo         | Categorías, productos, variantes, imágenes e historial de precios                 |
| Contenido        | Novedades, carrusel, guías, galería, preguntas frecuentes y testimonios           |
| Insumos          | Unidades, equivalencias por insumo, proveedores, almacenes e insumos              |
| Kárdex           | Lotes, movimientos y saldos. El saldo lo mantiene la base, nunca se edita a mano  |
| Clientes         | Zonas de reparto, clientes, fotos de fachada y **consentimiento** (Ley N.° 29733) |
| Alertas          | Notificaciones de stock bajo y de vencimiento, generadas por tarea programada     |
| Vistas públicas  | Una por página del sitio, con las columnas listas y sin metadatos internos        |

### Contenido cargado

- Los **34 productos** del catálogo con sus **36 variantes** y precios confirmados
- Las **6 categorías** de la ficha
- Las **5 preguntas frecuentes** y las **2 guías**
- Misión, visión, valores, historia, horarios y coordenadas, literales de la ficha
- Los **22 insumos** con su presentación, stock mínimo y equivalencias, y los **6 proveedores**
- **10 fotos del local** en la galería, y **62 imágenes** subidas a sus buckets
- 3 slides de portada, 3 testimonios y 3 clientes de ejemplo, marcados como desechables

---

## 3. Cómo se está trabajando

**Nada se da por hecho sin ejecutarlo.** Cada bloque se verifica antes de cerrarlo:

| Capa                    | Qué cubre                                                               | Cuántas |
| ----------------------- | ----------------------------------------------------------------------- | ------- |
| pgTAP                   | Seguridad y reglas de negocio en la base                                | 326     |
| Vitest                  | Lógica pura: unidades, precios, horarios, roles, contraste              | 89      |
| Playwright              | Flujos completos en navegador, a 375 px y en escritorio                 | 90      |
| Guiones de verificación | Lo que SQL no puede probar: la API de Storage y el camino del navegador | 3       |

Los tres guiones existen porque hay cosas que una consulta no prueba. Que un archivo del bucket
`clientes` no se descargue lo decide la API de Storage, no una fila; y entre una vista consultada
con `set role anon` dentro de una transacción y lo que ve un visitante hay tres piezas más
—PostgREST, los permisos de la vista y el bucket público— que ninguna prueba en SQL ejerce.

**Las pruebas de navegador corren contra el build, no contra el servidor de desarrollo.** Con quince
rutas y cuatro procesos en paralelo, el servidor de desarrollo compila cada ruta a demanda y las
pruebas fallaban por tiempo agotado sin que hubiera nada roto. Contra el build, además, cada
petición mide lo que va a medir el visitante.

Todo pasa por pull request con el CI en verde antes de entrar a `main`, que está protegida.

**Esa disciplina ya evitó doce problemas** que habrían aparecido más tarde y más caros:

1. **La tabla de roles estaba vacía en producción.** `supabase db push` no aplica las semillas.
   Habría fallado al crear el primer usuario, con un error de clave foránea ilegible. De ahí salió
   una regla: si un dato tiene que existir en todos los entornos, va en una migración.
2. **Elevación de privilegios en el alta de usuarios.** El trigger tomaba el rol de un campo que el
   propio usuario puede editar. No era explotable con el registro cerrado, pero dependía de una
   sola casilla del panel.
3. **El panel de auditoría no habría funcionado**, y arreglarlo mal habría expuesto los datos de
   todos los usuarios.
4. **El dorado de la marca no cumple accesibilidad** ni siquiera como icono. El plan decía que sí.
5. **El panel no podía subir ni una foto.** `storage.objects` no tenía ninguna política, así que lo
   único que funcionaba era la llave de servicio —la que salta toda la seguridad y no debe salir del
   servidor.
6. **Cuatro pruebas de seguridad de Storage daban OK sin haberse ejecutado.** Comparaban «distinto
   de 200», y una petición que no llega a salir también es distinta de 200.
7. **El respaldo no se podía restaurar tal cual.** El ensayo completo encontró que el volcado choca
   con las filas que insertan las propias migraciones, y que no lleva ni las políticas de Storage ni
   las tareas programadas. Ahora hay procedimiento probado.
8. **La galería salía en blanco en un build local**, y nada avisaba. Next 16 bloquea por seguridad
   las imágenes alojadas en una IP privada, y el Supabase de desarrollo vive en una. Lo único que lo
   delataba era una línea en el registro del servidor: la prueba comprobaba que la etiqueta de
   imagen estuviera en la página, no que la imagen se viera.
9. **La primera medición del peso de la página daba 2 KB y pasaba sin medir nada.** Sumaba una
   cabecera que no viene en respuestas troceadas. La segunda medía bien pero comparaba bytes sin
   comprimir contra un presupuesto de bytes comprimidos, que son cosas distintas.
10. **Cerrar el menú móvil al pulsar impedía la navegación.** El enlace se ocultaba en el mismo
    evento en que se pulsaba. Lo cazó la prueba de móvil.
11. **Una animación al aparecer habría dejado los bloques en blanco al imprimir.** Sin scroll no hay
    línea de tiempo, así que se congelaban en su primer fotograma. Lo encontró la prueba, no el
    papel.
12. **La imagen para compartir no habría funcionado con las fuentes del sitio.** El motor que la
    genera no acepta woff2, que es el formato que usa todo el sitio. Salió al leer la documentación
    de Next antes de escribir código, no con la imagen ya rota.

---

## 4. Decisiones que se apartan del plan

Todas medidas o verificadas, ninguna por preferencia.

| Decisión                                                                      | Motivo                                                                                                                                                                                                                                                                                                                    |
| ----------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Sin sesión no se hereda ningún rol                                            | El plan caía a `repartidor`, que lee la tabla de clientes con direcciones y fotos de domicilios                                                                                                                                                                                                                           |
| Un usuario nuevo nace **inactivo**                                            | Ningún metadato concede permisos. El rol lo asigna una persona, siempre                                                                                                                                                                                                                                                   |
| Dos tonos de dorado                                                           | El de marca da 2.80 de contraste: no vale como texto ni como icono, solo como fondo                                                                                                                                                                                                                                       |
| TypeScript 5.9 y ESLint 9                                                     | El ecosistema aún no alcanza a las versiones 7 y 10 del plan. Documentado para revertir                                                                                                                                                                                                                                   |
| Sistema de diseño al final de F1                                              | La tipografía se valida sobre una maqueta real, y para eso hacía falta la aplicación en pie                                                                                                                                                                                                                               |
| La numeración de migraciones corre 3                                          | Se añadieron tres no previstas al implementar                                                                                                                                                                                                                                                                             |
| El sitio público lee **vistas, nunca tablas**                                 | Las columnas llegan listas y sin metadatos internos, y el frontend hace una consulta donde haría cuatro                                                                                                                                                                                                                   |
| Los índices van en la migración de su tabla                                   | El plan les daba archivo propio; se entienden donde está la tabla                                                                                                                                                                                                                                                         |
| Los testimonios de ejemplo no llevan nombre de persona                        | Un testimonio inventado con nombre y apellido es una reseña falsa en cuanto alguien lo publica sin mirar                                                                                                                                                                                                                  |
| **El presupuesto de peso del plan estaba por debajo del suelo del framework** | El plan pedía menos de 150 KB de JavaScript en la portada. Medido: una página sin carrusel ni filtros pesa los mismos 150 KB. Eso es React 19 más Next 16; nuestro código añade 0 KB. Ahora se vigila un techo con margen **y** cuánto añade la portada sobre una página sin interacción, que es lo único que controlamos |
| **El movimiento se hace con CSS, no con una librería**                        | Por lo anterior: `motion` habría costado más que todo el código de la aplicación junto, y con 4G irregular en Iquitos eso se le cobra al visitante. Se quitó de las dependencias                                                                                                                                          |
| **El mapa no está en la portada**, aunque el plan lo pusiera ahí              | Leaflet pesa más que el presupuesto entero de la portada, que es la página que más se abre desde un celular. Vive en `/ubicacion`, cargado en diferido                                                                                                                                                                    |
| **Contacto no lleva formulario**                                              | Obliga a vigilar un buzón que hoy nadie vigila, y el cliente pide por WhatsApp. Un formulario que nadie lee promete una respuesta que no llega. Se reconsidera cuando el panel tenga bandeja                                                                                                                              |
| El `h1` de la portada no se ve                                                | El hero es una foto con el titular del slide, que cambia cada seis segundos. Un `h1` que cambia solo no le sirve a nadie, y sin `h1` quien navega con lector de pantalla no sabe dónde está                                                                                                                               |
| Cada turno del horario en su propia línea                                     | Dos horarios distintos no son una frase, son dos datos. En un teléfono la línea se partía por la hora de cierre y se leía como un error                                                                                                                                                                                   |
| **La base comprueba la forma de los datos del delivery**                      | El sitio valida la configuración entera: un «3 soles» escrito donde va un número no se perdería solo, dejaría la página sin teléfono, sin dirección y sin horario. La base lo rechaza al guardarlo, que es cuando quien lo escribió puede corregirlo                                                                      |

---

## 5. Lo que falta

### Fase 3 — lo que queda

La crítica de diseño del 11/09 dio **24/40** (aceptable) y cuatro problemas P1. **Los cuatro están
corregidos**: la animación en reposo, el momento de pedir por WhatsApp, el catálogo sin fotos (ahora
una pizarra de precios) y las páginas de «no encontrado» y de error, que ya hablan en español, llevan
la cabecera del sitio y siempre dejan por dónde seguir.

**Los P2 también están corregidos y medidos**: el **área táctil** (22 controles por debajo de 44 px,
hoy ninguno, con una prueba que recorre todas las páginas), el **contraste del carrusel** (el peor
subtítulo pasa de 4.46 a 5.67), el **botón flotante**, que ya no tapa el botón de pedir de la
página, y el **horario**, que pasa de siete filas a dos («Lunes a sábado» y «Domingo») y ya no
cambia de formato en preguntas frecuentes.

**Y los detalles menores**: el nombre del negocio se lee en la cabecera del celular (el logo completo
no se leía), el menú empieza por «Inicio» y trae el horario, la dirección de la galería sale de la
configuración, cada diapositiva del carrusel guarda su propio encuadre —la fachada ya no pierde su
rótulo— y la historia está reescrita en la voz de la marca. La crítica del 11/09 quedó cerrada
entera. Ver el doc 03 §4.0.

**Segunda crítica (12/09/2026): 29/40.** Repetida con el mismo método —dos evaluaciones aisladas,
revisión de diseño y detector con evidencia de navegador— para poder comparar. Sube cinco puntos, y
sube justo donde se trabajó: recuperación de errores de 1 a 4, prevención de 2 a 3, flexibilidad de 2
a 3 y ayuda de 2 a 3. Baja una, control y libertad de 3 a 2, por omisión: el carrusel nunca se pudo
pausar con el dedo, y ahora que lo demás está resuelto ese fallo pesa más. El escaneo automático da
**cero hallazgos** en el sitio público; de las reglas que saltaron en el navegador, solo tres eran
reales y el resto falsos positivos comprobados uno a uno (medía el contraste del carrusel contra el
fondo crema en vez de contra la foto, y llegó a detectarse a sí mismo).

Salió un **P0 ya corregido**: los tres testimonios de ejemplo se estaban publicando en la portada
(«Cliente de ejemplo 1, Iquitos»). En producción no se veían porque la semilla de demostración no se
carga allí, pero eso era suerte y no una defensa: la vista no filtraba. La migración 0021 los deja
fuera.

**Los dos P1 también están corregidos.** El nombre del negocio se lee ahora en la cabecera de
cualquier pantalla, no solo en el celular: va escrito junto al isotipo, en vez de dibujado en un logo
que a ese tamaño era una mancha. Y el botón flotante de WhatsApp dejó de taparle el texto al cliente:
el pie le reserva sitio al final de la página, se aparta con cualquier botón de pedir a la
vista y se retira mientras se baja, volviendo al parar. Sigue estando siempre a mano, que es lo que
pide la ficha; lo que ya no hace es comerse la línea que se está leyendo.

**El segundo P2 también está cerrado**: el horario dice ahora si la panadería está **abierta en este
momento** («Abierto ahora · Hasta la 1:00 p. m.») y, si no, cuándo vuelve a abrir. Sale del horario
cargado, no de un interruptor que alguien tenga que acordarse de apagar, y se calcula con el reloj de
Iquitos, no con el del visitante. Aparece en la portada, en contacto, en ubicación y en el pie.

**Y el primero también**: los productos con dos presentaciones ya no se piden a ciegas. Son dos de
los treinta y cuatro —la hamburguesa grande y la de ajonjolí, a S/ 0.30 y S/ 0.40—, y se rompía en
tres sitios seguidos: el catálogo decía «2 presentaciones» sin decir cuáles, la ficha tampoco las
listaba porque **la vista no las mandaba**, y el mensaje de WhatsApp las omitía a propósito, así que
el pedido salía sin decir cuál y la panadería tenía que preguntarlo. Dan decidió (12/09/2026)
listarlas con su precio y dejar que elija el cliente. La migración 0022 amplía `productos_publicos`
con todas las presentaciones; la ficha las enseña debajo del precio y el mensaje va con las opciones
escritas y su hueco.

No se inventó qué las diferencia: hoy se llaman por su propio precio y la semilla lo marca
PENDIENTE. Cuando el propietario ponga los nombres de verdad desde el panel, esto mejora solo.

**Con esto, la crítica del 12/09 queda cerrada entera**: el P0, los dos P1 y los dos P2.

**Hero en producción y el mapa en su sitio (12/09/2026).** Dos cosas más del mismo día:

- **La portada ya tiene sus tres diapositivas en producción.** Eran de `02_demo.sql`, que nunca llega
  allí, así que el sitio desplegado habría salido sin foto de cabecera. Ahora son reales y van como
  migración (0023), con enlaces a secciones del propio sitio en vez de un WhatsApp escrito a mano, y
  sin pisar lo que el negocio cargue desde el panel más adelante.
- **El mapa se montaba encima de la cabecera.** Al bajar en Ubicación tapaba el menú entero. Leaflet
  usa `z-index` de 400 a 1000 y la cabecera es 40: el mapa ganaba siempre. Se resolvió encerrándolo
  en su propio contexto de apilamiento, no subiendo la cabecera —esa carrera no se gana—. Hay prueba
  de que el clic en la cabecera le llega a la cabecera, y de que el menú del celular se abre y
  funciona con el mapa a la vista.

**Y una decisión de Dan que va más allá de la crítica** (12/09/2026): **en el celular la portada ya
no lleva carrusel.** En escritorio se queda igual. El carrusel solo se pausaba al pasar el mouse y al
enfocar con teclado —ninguna de las dos ocurre en un teléfono—, así que rotaba cada seis segundos
mientras el cliente leía, en la pantalla que el proyecto declara prioritaria. Ahora el celular abre
con la foto de la primera diapositiva quieta y, debajo, el nombre del negocio, si está abierto ahora
y el botón de pedir. De paso dejó de descargar en el celular una foto panorámica que no se veía, y de
mover un temporizador para nadie.

### El primer despliegue, y lo que enseñó (12/09/2026)

El primer intento de desplegar en Vercel **falló en el build**, con un mensaje que no llevaba a
ninguna parte: _«all `generateStaticParams` functions must return at least one result»_. Ni una
palabra sobre la base de datos.

La causa, comprobada y no supuesta: el proyecto alojado tenía **las 22 migraciones aplicadas y
ninguna semilla**. Pidiendo el conteo a cada vista pública salía configuración 1, categorías 6 y
preguntas 5 —eso lo insertan las migraciones— frente a **productos 0, slides 0 y galería 0**, que
viven en `01_maestros.sql`. Sin productos no hay ficha que generar, y con Cache Components eso es un
build roto.

Dos cosas salieron de ahí:

- **Las lecturas ya no se tragan el error.** Las nueve funciones de `src/lib/datos/` devolvían `[]`
  cuando la consulta fallaba, que está bien para la página —mejor una sección vacía que una página
  caída— pero tiraban el mensaje de PostgREST, que es el único que dice si falta una columna, si la
  RLS niega la lectura o si sencillamente no hay datos. Ahora lo dejan en el registro.
- **El build dice qué pasa.** Si el catálogo llega vacío, se detiene con un mensaje que nombra las
  dos variables de entorno, la semilla que falta y dónde mirar el error de la consulta. Se comprobó
  **viéndolo fallar**: un build apuntando a producción muere con ese texto y no con el de Next.

**Producción quedó cargada ese mismo día.** Dan ejecutó `01_maestros.sql` desde el editor SQL del
panel y las 62 imágenes semilla se subieron a sus buckets, comprobando después que **se sirven**
—galería, slides y una foto de producto responden 200—, que es lo que la subida por sí sola no
prueba. El estado quedó así: configuración 1, categorías 6, productos 34, galería 10, preguntas 5.

**La regla que no se salta**: a producción va **solo** `01_maestros.sql`, nunca
`supabase db push --include-seed`. Ese comando aplica todas las semillas del `config.toml`, y ahí
está también `02_demo.sql`, que metería slides de ejemplo —se publican, porque `slides_publicos` no
filtra `es_demo`— y clientes inventados en una tabla con datos personales.

**El hero llegó por migración.** Con la semilla cargada, `slides` seguía en 0 —las diapositivas
vivían en `02_demo.sql`, que no va a producción—, así que la portada pintaba su variante sin foto.
La migración **0023** siembra las tres reales, y ahí quedó resuelto: producción las tiene y la vista
pública las devuelve.

**Y enseñó una tercera cosa, la más fácil de confundir con un fallo.** Aplicada la migración, el
sitio **seguía** sin hero. No era la base: `slides_publicos` devolvía las tres filas. Era el HTML,
que con Cache Components se prerenderiza **en el build** y se había generado antes. Mientras el panel
de F4 no dispare `revalidateTag`, **cada cambio de contenido en producción exige un redespliegue**.
Conviene saber distinguirlo en un minuto: preguntar a la vista si tiene las filas y al HTML servido
si las pinta son dos preguntas distintas, y aquí daban respuestas distintas.

Las ocho secciones y el SEO están construidos y probados. Falta:

| Tarea                   | Por qué importa                                                                                                                                                                                |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Validar con Google      | La forma de los datos estructurados ya la comprueba una prueba; la herramienta de resultados enriquecidos de Google y Search Console necesitan una URL pública, así que van tras el despliegue |
| Refresco desde el panel | El `revalidateTag` ya tiene sus etiquetas puestas, pero necesita el panel de F4 para dispararse                                                                                                |

**Un hueco declarado, no cubierto.** Las imágenes semilla no viven en el repositorio (están en la
carpeta del cliente), así que en el CI los buckets están vacíos y las comprobaciones que miran si
una foto se ve **se saltan diciendo por qué**. Para cubrirlo de verdad habría que meter unos 4 MB de
imágenes en el repositorio o subirlas desde el flujo de trabajo. Declarado no es lo mismo que
cubierto, y conviene decidirlo antes de F4.

### Pendiente del negocio

| Tema                  | Qué hace falta                                                                                                                                                         |
| --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Usuarios**          | Crear a Marcos, Debra y los repartidores. Hoy solo existe el superadmin                                                                                                |
| **Vercel**            | Aplazado por decisión propia. No bloquea                                                                                                                               |
| **Dominio**           | `panaderiapimpos.com`. Se necesita antes de publicar el sitio                                                                                                          |
| **Redes sociales**    | Facebook e Instagram están vacíos en la configuración. El pie solo los muestra si se cargan: un icono que no lleva a ningún sitio es peor que no tenerlo               |
| **Fotos**             | De las 5 fotos de producto entregadas solo 2 corresponden a un item del catálogo. Faltan las de los otros 32, y las que hay están por debajo del mínimo de 1200 px     |
| **Fotos sin asignar** | «Hamburguesa mediana» no existe en el catálogo (hay chica, suave y grande), ni «kekito» ni «palitos salados». Están subidas al bucket; se asignan desde el panel en F4 |
| **Google Business**   | El negocio no lo tiene. Para una panadería local pesa tanto como el sitio                                                                                              |

### Datos por confirmar

Se van a publicar y hoy no cuadran entre sí:

- **WhatsApp:** el plan fija un número y el entorno de desarrollo tiene otro
- **Dirección:** «Calle Elías Aguirre 1321» según el plan, «Av. Elías Aguirre» según la historia de
  la ficha
- **Teléfono fijo:** el valor cargado es provisional

**Inventados a propósito para maquetar** (decisión del 11/09/2026). El detalle de producto, la
portada y contacto muestran ya las condiciones del delivery, y el negocio todavía no las ha dado.
Van en la configuración con la palabra PENDIENTE en su descripción, nunca escritos en el código:

| Dato               | Valor provisional     |
| ------------------ | --------------------- |
| Costo del delivery | S/ 3.00               |
| Pedido mínimo      | S/ 10.00              |
| Tiempo de entrega  | 30 a 45 minutos       |
| Formas de pago     | Efectivo, Yape y Plin |

Las **zonas de reparto** (Iquitos, Belén, Punchana y San Juan Bautista) no son inventadas: no
aparecen en la ficha, pero Dan las confirmó el 11/09/2026. Todo lo pendiente se lista desde la base
con
`select clave, valor from configuracion_sitio where descripcion like '%PENDIENTE%'`.

Ninguno bloquea: todos son administrables y se corrigen desde el panel en la Fase 4.

---

## 6. Riesgos vivos

| Riesgo                                     | Estado                                                                                               |
| ------------------------------------------ | ---------------------------------------------------------------------------------------------------- |
| El cronograma no tiene holgura             | 🟢 Aliviado: F0, F1 y F2 cerradas antes de tiempo, y F3 adelantada                                   |
| Supabase se pausa por inactividad          | 🟢 Controlado: keep-alive cada 3 días, verificado                                                    |
| Falta de contenido real (fotos, precios)   | 🟡 Precios resueltos; las fotos siguen siendo el hueco                                               |
| Sin copias automáticas en el plan gratuito | 🟢 Controlado: respaldo semanal y **restauración ensayada de principio a fin**                       |
| El respaldo lleva datos personales         | 🟡 Lo puede descargar cualquiera con lectura del repositorio. Confirmar quién antes de F6            |
| Vercel Hobby prohíbe uso comercial         | 🟡 Sin decidir. Antes de octubre                                                                     |
| Usuarios de nivel básico no usan el panel  | 🟡 Se mitiga en F4 con lenguaje sin jerga y capacitación                                             |
| Un solo desarrollador y mantenedor         | 🟢 Todo versionado, documentado y con pruebas                                                        |
| El CI no comprueba que las fotos se vean   | 🟡 Declarado, no cubierto: las imágenes no van en el repositorio. Decidir antes de F4                |
| Conectividad móvil de Iquitos              | 🟢 Medido, no supuesto: la portada añade 0 KB sobre el suelo del framework y el mapa se carga aparte |

---

## 7. Dónde está cada cosa

| Documento                                         | Para qué                                            |
| ------------------------------------------------- | --------------------------------------------------- |
| `Plan de Desarrollo 00 - General y Fases`         | Orden de fases, convenciones y cronograma           |
| `Plan de Desarrollo 01 - Preparacion y Servicios` | Fase 0, cerrada, con lo que resultó distinto        |
| `Plan de Desarrollo 02 - Backend y Base de Datos` | Esquema, seguridad y migraciones                    |
| `Plan de Desarrollo 03 - Frontend`                | Diseño, sitio público y panel                       |
| `Stack Tecnologico - PIMPOS`                      | Versiones y por qué cada una                        |
| `Maquetas/`                                       | Las opciones de tipografía y las capturas           |
| **Este documento**                                | Resumen de avance. Se actualiza al cerrar cada fase |

Dentro del repositorio:

- `README.md` — cómo levantar, probar, desplegar y restaurar
- `docs/marca.md` — voz, tono y uso de marca
- `src/lib/datos/` — las lecturas del sitio público, con sus etiquetas de refresco
- `docs/respaldo-y-restauracion.md` — qué lleva un respaldo, qué no, y cómo se restaura
- `src/estilos/globals.css` — los tokens de diseño
- `supabase/migrations/` — el esquema completo, versionado
