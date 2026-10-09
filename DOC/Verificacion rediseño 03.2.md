# Verificación de rediseño 03.2 — Cierre transversal

Fecha: 09/10/2026. Base del bloque `ea4ee3747cb53456141c3797a9d1415631c6eb9d`,
PR #93 fusionado por Dan. Rama `feat/cierre-rediseno-ui-ux`, checkout aislado
`PIMPOS_REDISENO_BLOQUE1`. T7 implementada y verificada localmente, con revisión
independiente y corrección I1 terminadas. [PR #94](https://github.com/dNogueira300/PIMPOS_SYSTEM/pull/94)
abierto como borrador para Dan; este documento no autoriza fusión.

## Cambios solicitados y conservación de funciones

- M1 del bloque 2: «unidad» se mantiene en una línea a 768/1024 px en los reportes.
  El resto de textos largos conserva su ajuste y la tabla su desplazamiento local.
- Todos los PDF de insumos y clientes usan Jakarta, terracota, tinta y bordes cálidos,
  con el logo original aprobado en cada página. Papel blanco para impresión legible.
  Datos, columnas, totales, marcas de costo desconocido, avisos, filtros, nombres de
  archivo, autorizaciones y registro de descargas permanecen intactos. Excel no cambia.
- Novedades del inicio: imagen completa con `object-contain`, proporción reservada,
  carga diferida y zoom de fotografías existente; título y resumen sobre crema.
  Las tres novedades, orden, vigencia, enlaces y ausencia del bloque vacío se conservan.
- OpenGraph: PNG de 1200 × 630 px con logo en círculo, terracota, crema y Jakarta.
  Nombre comercial y precio mínimo siguen saliendo de las consultas existentes.
  Next declara la misma imagen para OpenGraph y Twitter/X, en URL absoluta.
- SEO: canónicas para todas las páginas públicas y detalles publicados; filtros del
  catálogo apuntan al listado canónico. JSON-LD Product describe nombre,
  categoría, descripción e imagen existentes; omite datos ausentes y no inventa
  valoraciones, disponibilidad, vencimientos ni precios de presentaciones diferentes.
  Se conservan Bakery, FAQPage, sitemap vigente y exclusión del panel y acceso.

No hay nuevas consultas, migraciones, dependencias ni funcionalidades de negocio.
El PNG derivado de `public/marca/logo-512.webp` conserva transparencia y proporciones
del logo aprobado; 512 × 341 px y 138.625 bytes. Jakarta y logo suman 162.797 bytes
en la tarjeta social, bajo su límite de 500 KB. Las trazas NFT de ambas funciones
de descarga incluyen explícitamente la TTF y el logo para Vercel.

## Comprobaciones registradas

| Comprobación           | Resultado actual                                                                                                                                     |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| Unitarias completas    | 496 aprobadas en 61 archivos                                                                                                                         |
| Ajustes dirigidos E2E  | 22 aprobadas, 18 omisiones previstas por proyecto, cero fallos                                                                                       |
| Build local            | Build final aprobado: `vjzWHRdBhka2hk1VPHDOZ`; evidencia visual previa `xpunENGfsnmpnnGmpz203`                                                       |
| Tipos                  | `next typegen` y `tsc --noEmit` aprobados con acceso real a las junctions                                                                            |
| Lint y formato         | Lint completo sin advertencias y formato completo aprobados al cierre                                                                                |
| Suite E2E completa     | 605 aprobadas, 105 omisiones previstas; 710 casos/54 archivos, cero faltantes o extras                                                               |
| Inventario y capturas  | 70 plantillas, 497 capturas, ninguna ruta omitida                                                                                                    |
| Lighthouse             | Inicio 85→91; catálogo 89→94; contacto 95→94, todas dentro de −3 y de mínimos absolutos                                                              |
| Revisión independiente | Revisión fresca: I1 corregido con RED→GREEN y suite completa aprobada                                                                                |
| CI y vista previa      | PR #94 abierto; aplicación, base y Vercel aprobados en `dbc504b`; E2E remoto en curso al registrar la evidencia. Estado vigente en los checks del PR |

Los saltos de las suites dirigidas son intencionales: SEO solo en escritorio,
descargas solo en móvil. No se debilitan reglas axe, cálculos o permisos.
El primer intento completo tuvo un timeout esperando `networkidle` en el mapa
móvil; repetición de presupuesto 9/1 y tandas 7/8 aprobadas sin tocar código ni
prueba. Se conservan los resultados del intento y del cierre, con el mismo build.
Las cifras de F7 y de los bloques anteriores son históricas, no resultados de T7.
La conciliación completa se guarda en `Maquetas/3.2/bloque5/pruebas/regresion-completa.json`;
los informes no publican la configuración ni las claves del entorno de pruebas.

## Vista previa publicada y CI

La vista previa de [PR #94](https://pimpos-system-git-fea-77d72d-daniel-nogueiras-projects-79bc3c01.vercel.app/)
se abrió sin barrera de autenticación. La tarjeta de Novedades muestra el afiche
publicado completo (`object-fit: contain`, imagen cargada), y mantiene la segunda
novedad sin imagen con su presentación textual. No se modifica contenido del negocio.
La captura móvil conserva 375 px de ancho útil (ventana solicitada de 390 px con scrollbar).
OpenGraph responde como imagen de 1200 × 630 con logo y paleta aprobados;
`og:image` y `twitter:image` señalan la misma URL absoluta. El login de escritorio
conserva logo circular, Jakarta y formulario terracota, sin enviar credenciales.

En `/productos/arroz-1kg`, el DOM publicado confirma nombre «Arroz Milli», categoría
Bodega, imagen y URL existentes, canónica de producción y ausencia de `brand`.
Evidencia en `Maquetas/3.2/bloque5/vercel/`: capturas de novedades, tarjeta social,
login de escritorio y JSON-LD leído del producto. No se presenta una captura de
login móvil remoto: el ajuste del navegador integrado mantuvo 1280 px; la evidencia
móvil local y las pruebas de acceso están en el inventario general.

[CI del código verificado](https://github.com/dNogueira300/PIMPOS_SYSTEM/actions/runs/37990388718):
tipos/lint/formato/unitarias y migraciones/pgTAP/controles de base aprobados;
Vercel aprobado. Playwright remoto aún en ejecución al escribir este registro.
Los checks del PR indican el resultado vigente, también después del commit documental.
Los PDF autenticados se descargaron y verificaron en local; no se afirma una
descarga autenticada en Vercel. Las trazas NFT locales incluyen logo y fuente.

## PDF y tarjeta al compartir

Muestras ficticias, sin datos personales del negocio, en
`Maquetas/3.2/bloque5/pdf/resultado/`: insumos, insumos vacío, clientes de ocho
páginas y clientes vacío. Las pruebas leen comandos reales del PDF: imagen incrustada,
un dibujo del logo por página, terracota presente y azul anterior ausente.
Los cuatro PDF conservan el texto de la base, ignorando cabeceras repetidas y
números de página al comparar; el nuevo margen puede redistribuir filas entre páginas.
Se inspeccionaron visualmente tablas, vacíos, páginas siguientes y última página.

La primera lectura del logo como ruta de Windows produjo una URL inválida en react-pdf;
la prueba lo detectó y ahora se pasa un Buffer leído una vez en el servidor.
No se añade una dependencia de imágenes en tiempo de ejecución. `Image` de react-pdf
no admite `alt`; el nombre de la panadería permanece como texto en el subtítulo.

`Maquetas/3.2/bloque5/compartir.png` se descargó del generador real del build y fue
revisada visualmente. La prueba de píxeles reprodujo la paleta azul anterior y
confirma terracota/crema después. WhatsApp y otras redes pueden conservar en caché
una tarjeta antigua hasta volver a consultar el enlace; el sitio sirve la nueva imagen.

## SEO para buscadores e IAs

Se prioriza HTML accesible, enlaces internos, contenido textual veraz, canónicas,
datos estructurados y rendimiento. La información procede de las vistas públicas,
sin exponer panel, clientes o auditoría ni alterar sus permisos.
`robots.txt` permite el contenido público con su regla general; la base de acceso
al panel sigue siendo autenticación/RLS y sus metadatos `noindex`.

[Google Search Central](https://developers.google.com/search/docs/appearance/ai-features)
indica que las prácticas de SEO existentes sirven también para AI Overviews/AI Mode,
sin archivos especiales ni un schema exclusivo para IA. Los datos estructurados
deben coincidir con el contenido visible. No se promete una posición o indexación.
[OpenAI](https://developers.openai.com/api/docs/bots) distingue el rastreador de
búsqueda OAI-SearchBot de GPTBot; no se modifican políticas de entrenamiento.
No se accede ni cambia Search Console, Business Profile o cuentas externas.

## Rendimiento comparado

Cinco pasadas móviles por ruta y versión, misma máquina/sesión/puerto3000,
dependencias y Supabase local. Base exacta `3113084`; sin builds ni capturadores
en paralelo. El guion original conserva rendimiento≥90, accesibilidad≥95 y
SEO100, y guarda las quince mediciones completas de cada versión.

| Ruta     | Base       | Rediseño   | Diferencia | Accesibilidad nueva | SEO nuevo |
| -------- | ---------- | ---------- | ---------- | ------------------- | --------- |
| Inicio   | 85 (69–95) | 91 (79–96) | +6         | 100                 | 100       |
| Catálogo | 89 (82–94) | 94 (88–96) | +5         | 100                 | 100       |
| Contacto | 95 (91–96) | 94 (90–97) | −1         | 97                  | 100       |

La base incumple el mínimo absoluto en inicio/catálogo; el rediseño lo cumple
en las tres rutas y no retrocede más de3 puntos frente a ella. Los rangos muestran
variabilidad; no se atribuye una mejora causal de6/5 puntos a una pasada favorable.
LCP mediano: inicio3643→3285ms, catálogo3103→2864ms y contacto2815→2773ms.
CLS: inicio0.0141→0.0182; catálogo/contacto0. El peso medido baja de446121→356307,
336236→308090 y307199→272111bytes. E2E confirma una fuente de31KB, sin Leaflet
en portada ni descarga duplicada de hero en móvil DPR2.

Informes originales, valores por pasada, medianas, LCP/CLS y conciliación en
`Maquetas/3.2/bloque5/lighthouse/`. Chrome termina correctamente, aunque Windows
impide limpiar parte de su perfil temporal (`EPERM`); no invalida la medición.

## Método y límites del entorno

El inventario se obtiene de los 70 `page.tsx` actuales: ninguna plantilla queda
sin captura. `Maquetas/3.2/bloque5/index.html` permite filtrar las 497 capturas por
ruta, ancho y rol. Incluye los cinco anchos 375/390/768/1024/1440, errores,
vacíos, pestañas, Más, diálogos, espera/deshabilitado y detalle de auditoría.
197 capturas de contenido, 182 de operación, 55 públicas y 16 de acceso no
registran axe ni desbordamientos. Las fotografías originales y la cartografía
conservan sus colores; las imágenes de test no son tokens de la interfaz.
297 muestras de controles en diez rutas verifican normal/hover/focus y sus
pseudoelementos sin azul; las capturas generales amplían el barrido normal.
El escaneo estático solo encuentra el azul en una prueba de conversión de color
y en el correo de avisos antiguo, apagado y fuera de esta entrega de sitio/PDF.

La comprobación nativa consta de 15 capturas: referencia al 100 %, seis páginas
de acceso/público y ocho del panel al 200 %, con DPR 2, CSS `zoom: 1`, ancho
efectivo 712 px y cero axe/desbordamientos. CDP captura el bitmap físico completo;
el método `fullPage` de Playwright recortaba el bitmap a las medidas CSS.
El ensayo adverso de CSS zoom del catálogo sí desborda y se conserva como tal;
no representa el zoom nativo y no se usa para certificarlo. Teclado, devolución
de foco, reduced motion e impresión se comprueban además en la suite completa.

Supabase exclusivamente local, correos desactivados, sin reset ni migraciones.
Se eliminan cuentas, imágenes y filas temporales propias conservando la auditoría local.
Un fixture residual de un ensayo cuya limpieza falló se identificó por su título/autor
de prueba y se eliminó; ninguna fila del negocio se usa como material desechable.
El checkout principal mantiene sus documentos y cambios locales sin tocar.

Turbopack usa temporalmente la raíz común para la junction de Windows y se restaura
en `finally`. El tipo de acceso restringido al árbol de dependencias causó falsos
errores de resolución; ejecutar tipos con acceso a sus destinos reales pasa sin
cambiar fuentes ni paquetes. Corepack sin red no pudo descargar pnpm inicialmente: las herramientas
Node instaladas ejecutaron las mismas verificaciones; después pnpm 12.3.4 resolvió con acceso real. Los controles finales y hooks se ejecutan con pnpm, sin omitirlos.

El intento de zoom por teclado en el navegador integrado no cambió sus métricas.
La comprobación de zoom nativo utiliza perfiles desechables de Chromium con preferencias
de escala: se exige DPR 2, ancho efectivo reducido y CSS `zoom: 1`.
La prueba inicial del login registra 1440 px exteriores, 712 efectivos y cero desbordamiento.
No equivale al ensayo del teclado virtual de un teléfono físico; ese límite se informa.
El perfil y las preferencias del navegador de Dan no se modifican.

La herramienta nativa de worktree no reconoce la carpeta contenedora como repositorio.
Para Lighthouse se prepara una copia descartable de `git archive 3113084` en la carpeta
ignorada `.superpowers`, con las mismas dependencias y Supabase local, sin tocar main.

## Decisiones de ejecución y menores

Decisiones trasladadas desde el ledger de T7 para conservarlas junto al código.
La ejecución local de T7 queda registrada como completa mediante `task-done`:
`pnpm test`, 496 aprobadas en 61 archivos. Revisión independiente y corrección
comprometidas; PR #94 borrador abierto. Fusión, publicación en producción y
teclado virtual de teléfono físico siguen fuera de esta certificación.

### Registro de decisiones

- Task 7: Ruling: task-start no reconoce encabezados Tn españoles — extraer el bloque completo T7, sin reescribir el plan ni omitir comprobaciones; coste si errado: seguimiento manual.
- Task 7: Ruling: Dan amplía explícitamente T7 a todos los PDF descargables — actualizar la paleta y añadir logo en el generador común de insumos/clientes, conservando columnas/textos/cálculos/permisos/registro; coste: cambia la presentación y cabecera, no el contenido ni el Excel.
- Task 7: Ruling: Dan amplía el cierre a novedades de portada, imagen al compartir y optimización SEO/IA — imagen completa object-contain, logo/paleta A en OpenGraph y canónicas/datos Product desde lecturas existentes; coste: más fuentes públicas y regresión SEO, sin consultas/acciones nuevas. Google documenta que no hacen falta archivos especiales para resultados IA; no prometer posiciones ni indexación. SEO RED confirma canónicas ausentes y Product ausente; OG RED confirma paleta anterior. El fixture visual requirió corregir etiquetas opcionales y nombres de enlace antes de medir el fallo real.
- Task 7: Ruling: herramienta nativa de worktree devuelve Not a git repository en carpeta contenedora — preparar copia descartable con git archive 3113084 en .superpowers ignorado para Lighthouse, sin tocar checkout principal ni crear estado de worktree invisible. Coste: se documenta SHA de archivo y configuración local idéntica. Typecheck sin elevación no resuelve dependencias enlazadas; typegen/tsc con acceso real pasan0, sin modificar dependencias. Primer GREEN E2E detectó esperas del fixture y normalización raíz de Next, corregidas sin reducir la exigencia de rutas ni imágenes.
- Task 7: Ruling: primera tanda7 falla esperando networkidle del mapa público (tesitura externa de tiles), sin cambios de mapa en este bloque; repetición de presupuesto pasa9/1 sin editar fuente ni prueba. Reanudar tandas7/8 en idéntico BUILD_ID, conservar intento fallido y conciliar710; coste si errado: un fallo intermitente de red sigue posible, no se presenta como cero fallos iniciales.
- Task 7: Ruling: capturador de portada bloqueado en decode de imágenes lazy fuera de la diapositiva visible; forzar carga eager únicamente en guion de evidencia, no en aplicación. Se detiene solo PID21948 identificado y se limpian3 cuentas dashboard de ese intervalo local; coste si errado: la captura no representa el orden de carga diferida, ya cubierto por pruebas de presupuesto. Ensayo CSS200 adverso desborda catálogo, mientras zoom nativo200 confirmado DPR2/CSS1 no desborda; registrar ambos sin rebajar reglas.
- Task 7: Ruling: screenshot fullPage de Playwright con zoom nativo usa medidas CSS para un bitmap físico y recorta; CDP Page.getLayoutMetrics.contentSize (DIP) + captureScreenshot clip conserva viewport y escala, probado1424x1303 contra CSS712x651/DPR2. Repetir evidencia nativa con guion corregido. Coste si errado: imagen del zoom poco representativa; métricas y axe son directas e independientes.

## Revisión independiente del cierre

Revisor fresco `gpt-6-astra`, de solo lectura, sobre `ea4ee37..2e491d9`.
Revisó fuentes, pruebas y guiones, trazas NFT y muestras PDF/OG/novedades,
conciliación E2E e inventario. Sin hallazgos críticos ni menores adicionales.

I1, importante: la marca comercial del negocio no acredita la marca de todos
los artículos que vende. El JSON-LD de `/productos/arroz-1kg` declaraba Pimpo’s,
pero su foto corresponde a arroz Milli. La prueba SEO reprodujo esa atribución
incorrecta; el único pase de corrección omite `brand` al no existir un campo
acreditado en el modelo público. Se comprueban arroz y pan francés sin nuevas
lecturas, campos ni cambios visibles. GREEN de arroz y pan francés aprobado; regresión completa 605/105 en `vjzWHRdBhka2hk1VPHDOZ`, 710 casos conciliados y cero fallos en las ocho tandas posteriores.
La evidencia anterior se conserva en `pruebas/antes-revision/`; las capturas,
PDF y Lighthouse corresponden al build visual `xpunENGfsnmpnnGmpz203`.
La corrección cambia exclusivamente JSON-LD, sin modificar la composición.

### Decisiones sobre límites considerados por el revisor

- Final: Ruling: teclado virtual de teléfono físico — conservarlo como limitación no certificada; perfiles de escritorio y zoom nativo no sustituyen un teléfono. Coste si errado: una interacción con teclado móvil puede requerir ajuste posterior.
- Final: Ruling: CI y Vercel — comprobar ambos después de crear el PR; las trazas NFT locales no sustituyen el despliegue. Coste si errado: un fallo de empaquetado o de entorno podría aparecer solo en la vista previa.
- Final: Ruling: correo antiguo de avisos — permanece fuera del alcance de sitio/PDF, con envío apagado. Coste si errado: al habilitar el correo conservaría su identidad anterior; revisar esa superficie antes de activarlo.
- Final: Ruling: posicionamiento y caché externa — certificar lo que publica el sitio y su información factual, sin prometer rankings ni renovación inmediata de WhatsApp. Coste si errado: visibilidad y tarjeta compartida pueden tardar en actualizarse.
- Final: Ruling: auditoría SQL/RLS nueva y pendientes F7 — no añadir cambios de base ni capacitación/manual/traspaso a un cierre visual; conservar CI existente de base. Coste si errado: los pendientes de entrega del proyecto continúan abiertos, separados del rediseño.

Menores diferidos del cierre: ninguno adicional. Los menores históricos siguen
con su estado registrado en cada bloque; M1 de unidades queda resuelto aquí.
