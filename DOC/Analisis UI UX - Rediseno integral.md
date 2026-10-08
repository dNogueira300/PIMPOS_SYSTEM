# Análisis UI/UX para el rediseño integral de Pimpo's

Fecha: 06/10/2026 · Base de código: `main`, `3113084`.

Estado: diagnóstico y propuesta de dirección. **No es una identidad aprobada ni una implementación.**

## 1. Decisiones que gobiernan el trabajo

Dan pide revisar por completo la apariencia del sitio público y del administrativo, tomando como
inspiración El Pan de la Chola, Pan Atelier y Kalatanta. Autoriza expresamente quitar o sustituir las
restricciones estéticas anteriores. Después precisa: **«no se debe cambiar ninguna funcionalidad»**.

Por tanto:

- Se pueden cambiar tipografía, paleta, composición, espaciado, radios, bordes, iconografía dentro de
  la familia existente, jerarquía visual, tratamiento fotográfico y transiciones ornamentales.
- Se conservan rutas, destinos, acciones, campos, flujos, controles, estados, consultas, validaciones,
  cálculos, permisos, borradores y resultados. No se añaden capacidades nuevas.
- Se conserva el carrusel de escritorio y la portada estática de móvil, con sus comportamientos
  actuales. Un rediseño del hero no autoriza retirar los slides administrables.
- La mejora de UX se consigue presentando mejor lo existente. Cambiar un formulario por un asistente,
  fusionar páginas, eliminar pestañas o esconder acciones dentro de un menú nuevo alteraría el flujo
  y queda fuera de este alcance.
- Los datos del negocio siguen siendo reales. Un acabado más sofisticado no obliga a inventar
  productos gourmet, procesos de masa madre, servicios, precios ni testimonios.

Esta decisión está registrada en `AGENTS.md`, `PRODUCT.md` y `docs/marca.md`. Las decisiones de F3.1
se conservan como historia, pero sus prohibiciones visuales ya no condicionan la nueva propuesta.

## 2. Método, evidencia y límites

La evaluación combina revisión visual del público, lectura del código y documentos, análisis de
referencias y dos evaluaciones independientes de diseño y de patrones técnicos. La primera
evaluación visual se interrumpió tras obtener capturas; se completó después con un evaluador aislado.
Los informes auxiliares son `Analisis-redisenio-evaluacion-diseno.md` y
`Analisis-redisenio-evidencia-tecnica.md`.

| Superficie            | Evidencia disponible                                                                                          | Alcance real                                                                                                                     |
| --------------------- | ------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| Pimpo's público       | Capturas actuales de producción de portada y catálogo, escritorio/móvil; código de las diez páginas públicas  | Jerarquía y composición verificadas en las capturas; resto de páginas revisado en código                                         |
| Panel y autenticación | Código actual: 58 archivos `page.tsx` administrativos, dos de autenticación, componentes y pruebas existentes | Auditoría estructural. No se inspeccionó una sesión autenticada ni se ejecutaron altas, bajas o guardados                        |
| El Pan de la Chola    | Capturas actuales a 1440 y 375 px, DOM y página oficial                                                       | Composición, fotografía y navegación observadas                                                                                  |
| Pan Atelier           | Contenido indexado de su web oficial                                                                          | El navegador devolvió HTTP 200 sin contenido visible en el intento final. No hay base para afirmar su paleta o tipografía actual |
| Kalatanta             | Capturas actuales a 1440 y 375 px, DOM y página oficial                                                       | Composición, contenido y un desbordamiento móvil observado                                                                       |

Las capturas y metadatos están en `DOC/Maquetas/rediseno-2026-10-06/`. Los archivos de Atelier en
blanco documentan una limitación de la captura, **no prueban que su web esté caída para sus usuarios**.
Las capturas antiguas de F3.1 y las maquetas de F4 son antecedentes, no prueba de la interfaz actual.

El detector de Impeccable devolvió `[]`, código 0: **cero hallazgos automáticos**. Esto no significa
que el diseño sea bueno ni contradice el descontento del usuario: un detector de patrones no mide
identidad, atractivo, claridad de prioridades o satisfacción. No se generó un overlay en navegador.

No se hicieron pruebas con usuarios ni una medición nueva de Lighthouse, WCAG o conversión. Los
riesgos de usabilidad que se infieren del código se señalan como tales. Las cifras históricas de
pruebas en `AGENTS.md` no se presentan como comprobaciones ejecutadas en este análisis.

## 3. Diagnóstico principal

**Pimpo's tiene una base funcional considerable, pero su lenguaje visual se repite demasiado y no
se adapta suficientemente a la tarea de cada superficie.** La portada intenta comunicar calidez
mediante crema, serif, dorados, sellos y píldoras; el panel hereda buena parte de ese vocabulario.
La acumulación de esas convenciones produce una apariencia de plantilla y diluye las prioridades.

Cambiar únicamente Playfair por otra fuente, o azul por marrón, dejaría intacto el problema de
composición. El rediseño necesita una nueva dirección completa: proporción de imagen y texto,
ritmo entre bloques, escala tipográfica, jerarquía de acciones y densidad apropiada al uso.

La oportunidad es una marca reconocible en dos expresiones relacionadas:

- **Público:** mostrar apetito, oficio y cercanía; facilitar reconocer productos, precios y contacto.
- **Panel:** facilitar lectura y ejecución; distinguir navegación, datos, acciones y estados sin ruido.

La diferencia es de presentación. El sistema seguirá haciendo exactamente lo mismo.

## 4. Qué aportan las referencias

### El Pan de la Chola

Su apertura observada entrega casi toda la atención a una fotografía de pan. La cabecera oscura y
compacta, pocos accesos de primer nivel y tipografía monoespaciada en navegación refuerzan una
identidad reconocible. La fotografía sostiene la impresión de oficio; no depende de cubrir cada
sección con adornos. [Web oficial](https://elpandelachola.com/).

**Aplicación a Pimpo's:** hacer que la fotografía tenga un papel deliberado; reducir competencia
cromática; dar más fuerza al encuadre y al titular. No copiar su navegación literalmente: Pimpo's
conserva todos sus accesos y funciones. Tampoco incorporar su carrito o cuenta pública.

### Pan Atelier

El contenido oficial organiza una promesa central, explicación del proceso e invitaciones comerciales
diferenciadas: pedido inmediato y programado. La lección transferible es la claridad de la secuencia
y de cada llamada a la acción. El acabado visual actual queda pendiente de una captura válida.
[Portada oficial](https://www.panatelier.com.pe/).

**Aplicación a Pimpo's:** dar un cometido visual claro a cada bloque y separar las acciones primarias
de los enlaces secundarios. No trasladar pedidos programados, reservas, gift cards o afirmaciones
sobre masa madre: no forman parte de las funcionalidades o hechos actuales de Pimpo's.

### Kalatanta

La captura muestra pan protagonista, fondo fotográfico oscuro, tipografía condensada, un logotipo
central visible y una llamada a pedir. Su historia y variedad regional aportan cercanía. También hay
exceso de recursos tipográficos y contenido de plantilla en páginas indexadas; a 375 px se midieron
441 px de ancho desplazable. [Web oficial](https://kalatanta.pe/),
[página Nosotros](https://kalatanta.pe/about/).

**Aplicación a Pimpo's:** claridad del producto y presencia de marca. No copiar sus mezclas
tipográficas, los restos de plantilla ni ese comportamiento móvil. La referencia debe orientar la
intención, no convertirse en una especificación que se reproduce entera.

### Lectura conjunta

Lo más útil es el protagonismo de producto, la identidad reconocible y una secuencia comercial clara.
Eso no equivale a usar las mismas fuentes, fotos, tonos oscuros o componentes. Las tres webs son
referencias del escaparate; ninguna justifica que un formulario de insumos parezca una portada.

## 5. Sitio público: problemas y recomendaciones

### P1 — La primera impresión está dominada por la fachada cerrada

En la captura de producción a 390 × 844 px, la fotografía ocupa aproximadamente 294 px y muestra la
persiana cerrada. Después vuelve a aparecer el nombre que ya está en la cabecera. Los dos accesos
principales sí están visibles, pero el título de la sección de productos comienza aproximadamente
en `y=1127`. La fotografía demuestra que el local existe; comunica poco del pan que se quiere comprar.

**Tratamiento:** recomponer las proporciones del hero, aligerar la repetición de marca y dar más
espacio visual al producto dentro del contenido existente. Conservar imagen y texto administrables,
estado de apertura, enlaces, slides y controles. Una eventual nueva foto de producto será una
sustitución de contenido real mediante los mecanismos existentes; no cargarla a producción durante
el rediseño sin que forme parte del trabajo de contenido acordado.

Evidencia: `portada-movil.tsx`, `carrusel-portada.tsx`, `app/(public)/page.tsx` y
`review-public-mobile-first.png`.

### P1 — La portada y el catálogo retrasan la lectura del producto

La portada móvil capturada mide unos 8653 px de alto con el contenido de esa sesión. El catálogo,
unos 5140 px. La longitud por sí sola no es un defecto, pero la apertura del catálogo consume casi
una pantalla en cabecera, introducción, caja de filtros y separaciones: la primera fila de producto
aparece alrededor de `y=726`.

**Tratamiento:** mantener todas las secciones y filtros, reducir espacio que no ayuda a agrupar,
compactar encabezados interiores y diseñar mejor la transición entre introducción y lista. No
eliminar categorías, no añadir un buscador nuevo, no cambiar el filtrado por URL y no retirar textos
necesarios para entender el pedido.

### P2 — Demasiados recursos compiten por representar la marca

Crema, azul, dorado, durazno, terracota y verde se distribuyen entre títulos, precios, avisos,
botones y secciones. Cada elección tiene un motivo histórico; juntas reducen la disciplina visual.
A ello se suman serif en numerosos títulos, tarjetas redondeadas, sombras, sellos y botones píldora.

**Tratamiento:** definir un fondo, una tinta y un acento dominante por superficie; mantener colores
semánticos para estados. Una forma de botón no debe servir indistintamente como filtro, navegación
y acción principal. El color del logo puede convivir con el nuevo sistema sin teñir cada elemento.

### P2 — El catálogo tiene buena información, pero necesita mejor presentación

La pizarra mantiene nombres, precios, unidades y acceso al detalle incluso cuando faltan fotos.
Es una solución útil que no debe cambiarse por tarjetas vacías. En móvil, tipografía ornamental,
punteados, miniaturas y espacios entre grupos compiten con la comparación rápida.

**Tratamiento:** alinear precios, reforzar la relación precio/presentación, mejorar ancho y contraste
de nombres, unificar miniaturas cuando existen y dar el mismo cuidado a los productos sin foto.
Mantener todos los datos, enlaces y variantes. No introducir stock de venta, disponibilidad en
tiempo real, carrito ni filtros inexistentes.

### P2 — La misma acción de pedido cambia de tratamiento

La portada móvil usa `boton-whatsapp` verde; `tarjeta-producto.tsx` usa `boton-cta` azul para el
pedido; el catálogo ofrece además un enlace contextual dorado. El nuevo sistema debe distinguir
acción principal y enlace contextual, pero mantener reconocible el pedido a través de las páginas.
No se cambia el destino, mensaje, apertura ni disponibilidad de esos enlaces.

### P2 — Falta una dirección fotográfica consistente

Las capturas actuales contienen más productos con foto que las antiguas maquetas. El documento de
avance que habla de solo dos productos con foto no puede usarse como inventario actual sin verificarlo.
Hay que clasificar los recursos reales disponibles antes de diseñar una composición que dependa de ellos.

**Tratamiento:** preparar un inventario de foto, producto vinculado, tamaño, orientación y uso
posible; conservar los campos de enfoque y variantes existentes. Diseñar también el caso sin imagen.
No utilizar pan ajeno o generado como si fuese el producto real de Pimpo's.

### Resto de páginas públicas

| Pantalla existente   | Trabajo de presentación                                          | Lo que se conserva                                          |
| -------------------- | ---------------------------------------------------------------- | ----------------------------------------------------------- |
| Detalle de producto  | Mejor relación entre foto, nombre, presentación, precio y pedido | Selección/cálculo actual, mensaje de WhatsApp y condiciones |
| Novedades y detalle  | Jerarquía editorial y coherencia de imágenes                     | Publicación, vigencia, tipo, enlaces y contenido            |
| Nosotros             | Ritmo de lectura y relación texto/fotografía                     | Historia, misión, visión y valores oficiales                |
| Galería              | Encuadres, proporciones, márgenes y secuencia visual             | Fotografías, categorías e interacción actual                |
| Ubicación            | Claridad de dirección, horario y mapa                            | Mapa y enlaces existentes, carga diferida                   |
| Preguntas frecuentes | Legibilidad y separación entre pregunta, respuesta y guía        | Preguntas, respuestas, guías y comportamiento               |
| Contacto             | Jerarquía de canales, dirección y horario                        | Todos los medios de contacto y condiciones actuales         |
| Error/no encontrado  | Composición y claridad de los enlaces de salida                  | Recuperación y navegación actuales                          |

## 6. Panel: diagnóstico estructural

Estos hallazgos se identificaron inicialmente en el código. El 07/10 se contrastaron con capturas
autenticadas locales; la evidencia y sus límites están en la sección 14 y en el LEEME de las maquetas.

### P1 — El panel necesita un lenguaje operativo propio

`globals.css` aplica la familia de títulos a `h1`, `h2` y `h3`; `EncabezadoPanel` usa además
`font-heading text-primary`. `CascaraPanel` comparte fondo global y una estructura de 15 rem de
lateral más contenido limitado a `max-w-5xl`.

**Tratamiento:** ámbito visual propio para el panel: sans legible, fondo neutro, densidad moderada,
filas claras, números alineados y un acento contenido. La identidad se conserva en la firma, el
acento y los detalles; no hace falta repetir el tratamiento de los titulares comerciales.

### P1 — Navegación, acciones y estados tienen pesos demasiado parecidos

Las clases `boton-cta` y `boton-linea` aparecen en muchas pantallas administrativas. Las cuatro
vistas del Historial también se dibujan como esos botones. En Insumos conviven crear insumo,
registrar ingreso, consumo, conteo y baja; necesitan lectura jerárquica, no más capacidades.

**Tratamiento:** variantes visuales coherentes para acción principal, secundaria, destructiva,
enlace y navegación. Conservar ubicación funcional, destinos, visibilidad por rol y disponibilidad.
Historial seguirá siendo navegación entre cuatro rutas, aunque parezca una barra de pestañas más
sobria. No convertir sus enlaces en paneles locales que pierdan las URLs.

### P2 — Inicio y contenido se leen como índices uniformes

Inicio ya contiene avisos, Tus secciones y actividad reciente. Contenido ya contiene ocho
subsecciones. Una cuadrícula de cajas de igual peso hace difícil distinguir avisos de accesos.

**Tratamiento:** diferenciar niveles con tipografía, fondo, agrupación y espacio. Mostrar los mismos
avisos, enlaces y actividad, según el mismo rol. No añadir indicadores de ventas, nuevas estadísticas,
atajos, tareas pendientes calculadas ni un dashboard con datos que el sistema no tiene.

### P2 — Las filas móviles pierden contexto de las columnas

`ListaAdaptable` conserva los valores secundarios, pero en móvil los imprime sin sus títulos de
columna. Un estado puede reconocerse por sí solo; un conjunto de cantidades y unidades puede requerir
más contexto. Es un riesgo de comprensión, no una pérdida de datos demostrada.

**Tratamiento:** incorporar a la presentación los rótulos que ya existen en las columnas, agrupar
valores relacionados y separar acciones de lectura. Mantener todas las filas, datos, destinos y
acciones, incluidos el lápiz de edición y las acciones específicas de cada módulo.

### P2 — Formularios funcionalmente cuidados, visualmente poco diferenciados

Hay una base valiosa: borrador local, validación, conservación de valores al fallar, pestaña con
errores, confirmaciones y Guardar/Cancelar accesibles. `forceMount` conserva los campos de pestañas
inactivas. Rehacer estos componentes desde cero por apariencia podría introducir pérdida de datos.

**Tratamiento:** cambiar superficies, etiquetas, espaciado y jerarquía del formulario conservando su
estructura funcional. No desmontar campos, transformar pestañas en pasos, cambiar nombres de inputs,
alterar `FormData` ni reemplazar el submitter de Guardar/Enviar a revisión.

### Historial: conservar lo recién terminado

La auditoría debe seguir siendo de solo lectura, en frases comprensibles, con las cuatro vistas,
filtros, detalle técnico, constancias, descargas registradas, actividad reciente y enlaces desde
producto/insumo/cliente. El rediseño puede distinguir mejor persona, acción, objeto, fecha y cambio
de valor mediante tipografía y espacio. No altera agrupación de eventos, ocultación de tablas,
tachado de datos, paginación, límites o acceso por rol. No añade exportación del Historial.

## 7. Qué conviene conservar de la interfaz actual

- Precios y unidades visibles; productos sin foto con una presentación utilizable.
- CTA de WhatsApp reconocible, estado de apertura y datos administrables.
- Fuentes locales, imágenes responsivas y carga diferida del mapa.
- Navegación por rol y adaptación móvil del panel.
- Formularios con borradores y recuperación; confirmaciones con contexto.
- Lenguaje llano del Historial y filtros que conservan el contexto.
- Tokens en tres capas y componentes reutilizables: hay una base para sustituir el diseño sin
  duplicar la lógica del sistema.

Las revisiones históricas de accesibilidad son un antecedente favorable. Sus resultados deben
repetirse con la nueva interfaz; no se heredan automáticamente al cambiar colores o tamaños.

## 8. Dirección visual recomendada para explorar

**Una panadería contemporánea, cálida y reconocible, con producto protagonista; un panel claro y
sobrio que comparte la identidad sin repetir la composición comercial.**

No se propone lujo distante ni una caricatura rústica. Un negocio accesible puede tener una
presentación de gran calidad. El precio de sus productos no obliga a una interfaz visualmente pobre.

### Dos alternativas que merecen maquetarse

| Dirección                            | Público                                                                                          | Panel                                                                 | Evaluación                                                              |
| ------------------------------------ | ------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| **Horno contemporáneo**              | Papel claro, tinta oscura, acento de corteza/terracota; títulos con carácter y fotografía amplia | Neutros claros, sans funcional y el mismo acento usado con moderación | Recomendada para probar una ruptura perceptible con F3.1                |
| **Azul de marca, nueva composición** | Azul más selectivo, blanco cálido, fotografía protagonista, menos dorado y menos redondeado      | Fondo neutro y acento azul limitado a acciones/selección              | Alternativa si el reconocimiento del azul pesa más al comparar maquetas |

No hay colores hexadecimales ni familias cerradas: deben verse con el logo y el contenido real.
No sería riguroso aprobar una combinación únicamente leyendo sus nombres.

### Tipografía

- Público: comparar una sans expresiva con una serif de oficio usada de forma selectiva. No asumir
  que «panadería» obliga a serif en todos los títulos, ni que cambiar de serif resuelve la composición.
- Panel: familia sans con buena lectura de números, etiquetas y nombres; cifras tabulares donde
  corresponda. Probar precios como `S/ 0.10`, cantidades, fechas y nombres largos.
- Mantener carga local, licencias y reservas de fuente. Dos familias como máximo para el sistema
  es un presupuesto de diseño inicial, no una obligación de cargar ambas en todas las rutas.
- Base de lectura de 16 px como punto de partida; texto secundario del panel puede ser menor cuando
  conserve legibilidad. El criterio final es la pantalla real y el zoom, no una escala abstracta.

### Composición y componentes

- Menos cajas decorativas. Bordes para separar datos; superficies para agrupar; sombras donde haya
  una capa flotante real.
- Radios moderados en panel; la píldora deja de ser la forma universal.
- Espacio amplio donde el producto merece atención, compacto donde se comparan valores.
- El color expresa jerarquía y estado; no es el único medio para distinguirlos.
- Iconos de la familia ya instalada, con trazo consistente. No se necesita sustituir el stack.

## 9. Movimiento: uso de Design Motion Principles

La web ya tiene movimiento. El problema no es una ausencia general de animación. CSS aporta
apariciones por scroll, desplazamientos de 24 px, zoom desde 1,06 y elevación de tarjetas de 3 px.
Los hover de fotos duran 500 ms en productos y hasta 700 ms en otras páginas. El carrusel tiene
autoplay cada 6 segundos, con pausas y protección de movimiento reducido.

| Perspectiva de la skill        | Público                                              | Panel                                     |
| ------------------------------ | ---------------------------------------------------- | ----------------------------------------- |
| Jakub: acabado y continuidad   | Principal: transiciones discretas y coherentes       | Secundaria: claridad de cambios visuales  |
| Emil: rapidez según frecuencia | Principal en enlaces, filtros y pedido               | Principal en toda operación repetida      |
| Jhey: exploración expresiva    | Selectiva, solo si no compite con producto y lectura | Sin decoración continua en tareas diarias |

**Lo que funciona:** `@supports`, contenido visible por defecto, reducción de movimiento,
protección al imprimir y separación de portada móvil. No se deben perder estas garantías.

**Lo que revisar:** repetición del mismo revelado en bloques distintos, diferencias de duración entre
imágenes y controles, uso de `transition-all` y relación del movimiento con la jerarquía. Son ajustes
visuales; no se ha demostrado un fallo crítico de animación ni medido latencia en esta sesión.

**Política propuesta:** respuesta de pulsación inmediata; transiciones de color alrededor de
120–180 ms; desplegables existentes alrededor de 160–220 ms; transiciones fotográficas discretas
alrededor de 220–320 ms cuando aporten algo. Son rangos para probar, no tiempos aprobados. Evitar
retrasos secuenciales de filas, rebotes en formularios y texto borroso al entrar.

La skill contiene recomendaciones que no deben aplicarse mecánicamente: ausencia de
`AnimatePresence` no es un defecto, una pestaña puede cambiar instantáneamente y no hace falta una
biblioteca de animación. El proyecto usa CSS y puede seguir haciéndolo. No se altera el intervalo de
autoplay, el comportamiento de pausa, el scroll, el foco, los eventos o la espera real de las acciones.

## 10. Matriz de conservación funcional

Esta matriz es el contrato del plan posterior. Una maqueta que no pueda representar todas estas
capacidades queda incompleta, por atractiva que resulte.

| Área                      | Contrato que permanece                                                                                     | Presentación que puede cambiar                                                            |
| ------------------------- | ---------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Navegación pública        | Las diez páginas actuales, enlaces de cabecera/pie, rutas y destinos                                       | Tamaños, alineación, estilo de estado activo                                              |
| Portada                   | Aviso, slides editables, carrusel y controles en escritorio, portada móvil estática, bloques condicionales | Proporciones, tipografía, fondos, encuadres                                               |
| Catálogo/pedido           | Categorías, parámetros URL, precios, unidades, detalle, presentaciones y mensaje WhatsApp                  | Jerarquía, filas, miniaturas, agrupación visual                                           |
| Contenido público         | Novedades, nosotros, galería, ubicación, preguntas/guías y contacto                                        | Composición y ritmo, sin suprimir contenido                                               |
| Autenticación             | Ingreso, cambio de clave, sesión de dos horas, cierre y permisos                                           | Layout y estilos de estados                                                               |
| Navegación del panel      | Siete secciones según rol; lateral y barra inferior/Más existentes                                         | Contraste, separación y tratamiento activo                                                |
| Productos/categorías      | Alta, edición, fotos, presentaciones, orden/estado y precios/historial                                     | Formularios, listas y controles                                                           |
| Novedades                 | Borrador, revisión, aprobación y devolución según permisos                                                 | Jerarquía de acciones y estados                                                           |
| Otros contenidos          | Portada, galería, preguntas, guías, testimonios                                                            | Listas y formularios actuales                                                             |
| Insumos                   | Existencias, ingreso/consumo multilínea, lotes, FEFO, conteo, baja/aprobación, anulación, proveedores      | Densidad, alineación y señales visuales                                                   |
| Reportes                  | Selección de periodo, cálculos, gráficos, Excel y PDF                                                      | Presentación de la pantalla; no alterar resultados ni estructura de archivos en esta fase |
| Clientes                  | Alta/edición, permiso, zonas, mapa, fotos privadas, corrección por repartidor, revisión y supresión        | Jerarquía de ficha, lista y formularios                                                   |
| Descargas clientes        | Excel/PDF y registro de quién descarga y qué                                                               | Estilo de controles y mensajes                                                            |
| Historial                 | Cuatro rutas, filtros, detalle, contexto, actividad y solo lectura                                         | Lectura de eventos y navegación                                                           |
| Usuarios/configuración    | Roles, contraseña temporal, desactivación, marca/contacto/horario y demás campos                           | Organización visual dentro del flujo actual                                               |
| Formularios transversales | Campos, pestañas, borradores, errores, submitter, Guardar/Cancelar, confirmaciones                         | Tokens, estados visuales y espaciado                                                      |

No se introducirán carrito, pago online, reservas, búsqueda global, acciones masivas, nuevos gráficos,
modo oscuro, notificaciones adicionales o un nuevo modelo de navegación como parte del rediseño.

## 11. Base para el nuevo plan

Esta secuencia documenta la propuesta inicial del análisis. **Actualización del 07/10/2026:** Dan
eligió A y aprobó los ajustes hasta a6. El plan ejecutable está en
`DOC/Plan de Desarrollo 03.2 - Rediseño integral UI UX.md`; empieza por login y estructura del
panel. La tabla siguiente se conserva como antecedente, no como una nueva elección pendiente.

| Paso                       | Entregable                                                                                         | Condición para pasar al siguiente                                       |
| -------------------------- | -------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| 1. Base visual y funcional | Capturas de rutas/estados representativos, inventario de recursos y matriz anterior ampliada       | Público y panel autenticado cubiertos; separar datos reales de ejemplos |
| 2. Comparar dirección      | Dos propuestas del mismo contenido: portada, catálogo, inicio panel y formulario; móvil/escritorio | Elegir por comparación visible, sin añadir o quitar funciones           |
| 3. Sistema de diseño       | Tokens por superficie, escala, componentes y estados; documentación del lenguaje elegido           | Contraste medido, logo legible, datos densos y textos largos resueltos  |
| 4. Plan de implementación  | Tareas pequeñas, archivos afectados, contratos y pruebas por tarea                                 | Alcance funcional cerrado, dependencias y revisión definidas            |
| 5. Público                 | Aplicación coherente a todas las páginas y estados existentes                                      | Revisión completa de páginas, no solo de secciones aisladas             |
| 6. Panel y acceso          | Estructura visual, componentes compartidos y todas las familias de pantallas                       | Mismos flujos por rol y misma información en móvil/escritorio           |
| 7. Cierre                  | Comparación antes/después, accesibilidad, regresión funcional y rendimiento                        | Cero pérdida funcional y documentación alineada con lo construido       |

Los pasos 5 y 6 pueden dividirse en entregas pequeñas; no se estrenan dos sistemas visuales a medias
en una misma pantalla. Mantener la disciplina de ramas/PR del proyecto: tareas sin migración,
dos como máximo por PR y revisión antes de abrirlo. **Este rediseño no necesita migraciones.**

### Pantallas representativas mínimas para maquetas

1. Portada y catálogo con el contenido real actual, incluida la ausencia de fotos.
2. Detalle de producto con varias presentaciones y pedido.
3. Inicio del panel con avisos y actividad existentes.
4. Insumos con estados y todas sus acciones; formulario de ingreso multilínea.
5. Ficha/edición de cliente con las mismas pestañas, permisos y mapa.
6. Historial con filtros, resultado y detalle.
7. Formulario de producto y pantalla de ingreso para comprobar el sistema transversal.

Validar a 375/390 px y escritorio, añadiendo 768/1024 px para navegación y tablas. No basta una
portada bonita a 1440 px para aprobar el sistema completo.

## 12. Verificación y criterios de aceptación

- Cada ruta y acción de la matriz tiene correspondencia antes/después. Cero capacidades retiradas,
  añadidas o modificadas por comodidad de diseño.
- Mismos datos de prueba y mismas salidas para precios, cantidades, estados y permisos.
- Se conservan pruebas de lógica y seguridad. Ajustar solo expectativas que dependan legítimamente
  del aspecto sustituido; no eliminar aserciones para hacer pasar una regresión.
- Verificar altas/ediciones, borradores, cambio de pestaña con errores, aprobación de promociones,
  movimientos y bajas, clientes por rol, exportaciones e Historial en entorno de prueba.
- `typecheck`, `lint` y pruebas relevantes por entrega; suite de regresión completa al cierre,
  respetando el límite de memoria de esta máquina. Datos personales y pruebas destructivas, fuera
  de producción.
- Lectura de texto y controles con contraste medido, teclado, zoom 200 %, objetivos táctiles de
  44 px, foco visible, reducción de movimiento e impresión.
- Sin desbordamiento horizontal de página ni campos o acciones escondidos bajo las barras fijas.
- Comparación de rendimiento contra la base anterior en la misma sesión y condiciones; conservar el
  criterio del proyecto de no perder más de 3 puntos de rendimiento en la comparación equivalente.
  Medir también peso de fuentes e imágenes. Los resultados de septiembre no son esta medición.
- Comprobar vacíos, carga, errores, permisos, datos abundantes, nombres largos, ausencia de fotos y
  las combinaciones de contenido administrable. No aceptar solo el caso ideal de la maqueta.

## 13. Conclusión y siguiente decisión

Se recomienda un rediseño visual integral, no otra capa de retoques sobre F3.1. La primera hipótesis
a probar es **Horno contemporáneo**, comparada con una alternativa que conserve más peso del azul.
La elección se hará viendo el mismo contenido en ambos tratamientos.

La evidencia autenticada y la primera comparación de maquetas ya están disponibles (actualización
del 07/10/2026, sección 14). Después se cerrará el plan técnico con la dirección elegida. El resultado
debe seguir siendo el mismo sistema, con todas sus capacidades, presentado con más claridad,
personalidad y coherencia.

Questions skipped: la finalidad, el alcance y la conservación funcional ya están definidos por Dan;
la próxima elección visual requiere maquetas comparables, no otra pregunta abstracta sobre estilos.

## 14. Evidencia autenticada y maquetas — 07/10/2026

**Actualización posterior de Dan:** dirección **A elegida**, con el logo fuente
`DOC/Fotos y documentos Adjuntados Pimpos/Diseño/logo.png` en todo el sistema y **sin azul en la
interfaz**. La galería ya muestra esta revisión: 20 vistas A, paridad de controles y 212 barridos
de estilos visibles sin azul en normales/hover/foco. Los derivados WebP transparentes reducen
el peso del logo entre 94.4 % y 98.6 %; original intacto. La elección resuelve la comparación
de dirección; resta cerrar componentes/estados y el plan ejecutable. La aplicación no se ha modificado.
Los párrafos A/B que siguen documentan la exploración previa a esa elección.

Galería: `DOC/Maquetas/comparacion-redisenio/index.html`. Su `LEEME.md` documenta el método,
inventario, contrastes parciales, sustituciones fotográficas y límites. Se capturó el login real y
el panel con administración, ingeniería y reparto: **28 capturas en dos tamaños**. Las cuentas
temporales fueron eliminadas de Supabase local; no se modificó producción ni se guardaron datos
de negocio. La auditoría local conserva sus huellas.

La comparación A/B contiene **10 pantallas × 2 tamaños × 3 tratamientos** (actual/A/B): login,
portada, catálogo, inicio administrativo, insumos, ingreso, nuevo cliente, Historial, Configuración
y nuevo producto. Se confirmó paridad de campos, etiquetas, enlaces y botones en los 40 registros
de propuestas. Es una verificación estructural; no reemplaza pruebas completas de funcionalidad.

Dan añadió dos decisiones vinculantes: **retirar el velo blanco del carrusel** y **empezar el
panel desde el login, con el logo visible en acceso y administración**. Ambas propuestas las
incorporan. El texto del carrusel pasa a una superficie sólida para conservar contraste; no se
elimina el carrusel ni se cambian sus acciones. Se conserva la portada móvil independiente.

La evidencia confirma la falta de logo y el amontonamiento de pestañas de Configuración a 390 px.
Las maquetas añaden la marca real y distribuyen las pestañas móviles en filas legibles. El orden
de implementación propuesto se actualiza: login y cáscara del panel primero, componentes
transversales y dirección pública después, sin alterar las capacidades existentes.

A explora terracota, navegación clara y sans; B conserva el azul, usa una base neutra en el panel
y reserva la serif para el sitio público. No son paletas aprobadas. Los cuatro bocetos generados
se distinguen de las capturas reales y no definen datos ni funciones.

Quedan por completar, con la dirección elegida, detalle/edición de cliente y mapa, detalle de
producto, detalle del Historial, estados de error/vacío/diálogo y tamaños intermedios. Las
maquetas de formularios muestran su primera pestaña; no se declara cerrado el sistema visual.
El código de aplicación permanece sin cambios. No se midió de nuevo Lighthouse ni se ejecutó
la suite completa, porque esta entrega es evidencia y exploración visual.
