# Verificación de rediseño 03.2 — Bloque 2

Fecha: 08/10/2026. Base: `c1f9582` (PR #90 fusionado por Dan).
Rama: `feat/rediseno-modulos-panel`. Checkout aislado: `PIMPOS_REDISENO_BLOQUE1`.
Alcance: T3 + T4; T5–T7 siguen pendientes. Estado: implementación y verificación en curso.

## Resultado

La dirección A se extiende a contenido, configuración, usuarios, Historial, insumos,
reportes y clientes. Los formularios tienen grupos con borde discreto y radio de 6 px;
las listas comparten filas, acciones y estados terracota; los detalles conservan sus datos
y jerarquía. Inicio, Contenido y Reportes usan accesos en filas. Se mantiene el logo optimizado
del bloque fusionado y el login móvil aprobado.

No se modifican acciones, consultas, campos, validaciones, permisos, estados, cálculos,
migraciones, exportadores ni lógica de sesión. Las pestañas siguen montadas, las copias
locales se restauran con el mecanismo existente y los errores abren su pestaña original.

## Comprobaciones

| Comprobación                              | Resultado                                                           |
| ----------------------------------------- | ------------------------------------------------------------------- |
| T3: build de producción y tipos           | Aprobados; 113 páginas estáticas                                    |
| T3: ESLint completo                       | Aprobado sin advertencias                                           |
| T3: ocho suites E2E, un trabajador        | 254 aprobadas, 14 omisiones previstas, 0 fallos (10,7 minutos)      |
| T3: evidencia autenticada                 | 89 capturas; 0 overflow, axe, azul, imágenes pendientes u omisiones |
| T4: build, tipos, regresiones y evidencia | Pendientes                                                          |
| Revisión independiente de la rama         | Pendiente                                                           |
| Vista previa Vercel                       | Pendiente                                                           |

Suites T3: `panel-contenido`, `panel-categorias`, `panel-productos`, `panel-novedades`,
`panel-configuracion`, `panel-usuarios`, `panel-historial`, `panel-accesibilidad`.
Las omisiones corresponden a condiciones declaradas por las suites; no se agregan omisiones,
se reducen expectativas ni se excluyen reglas de axe durante este bloque.

La comparación del AST de 45 archivos TSX contra la base identifica cuatro diferencias
fuera de atributos de presentación: radio de la constante de botones de contacto, radio
del tooltip del gráfico, `role="group"` en la vista de marca y la instrucción del selector
de ubicación, que deja de llamar azul al punto. Se revisaron individualmente; no cambian
datos, eventos ni operaciones. Este control complementa la regresión funcional.

## Hallazgos reproducidos antes de corregir

- Marca: el `aria-label` de un contenedor genérico causaba `aria-prohibited-attr`.
  Se conserva el contenedor y se declara su agrupación accesible.
- Copia local: Descartar sobre la franja daba 4,22:1. Se aplica la tinta semántica
  de esa franja; se mantienen recuperación, descarte y almacenamiento local.
- Validación: Sonner daba 3,18/4,34:1 durante su fundido y con los colores de error
  predeterminados. El error usa fondo, texto y borde semánticos, sin fundido; mantiene
  texto, acciones y duración. Los seis casos de estados fallaron antes y pasaron después.
- Mapas: los enlaces de ficha y atribución usaban `rgb(0,120,168)`; reciben el primario
  `rgb(149,62,44)` y foco visible, conservando destinos. Las dos pruebas fallaron antes.
- El SVG decorativo del crédito Leaflet conservaba `rgb(76,123,225)`. Se oculta ese
  SVG marcado `aria-hidden`, manteniendo el texto y enlace de crédito. Leaflet declara
  `display:inline !important`; la regla de ocultación debe superar esa declaración.

La regresión de las correcciones dio 30 aprobadas y cuatro omisiones previstas.
Tras la compilación final, los ocho casos de identidad pasan (31,6 s), incluido el SVG.
ESLint completo pasa sin advertencias y Vitest pasa las 492 pruebas de 60 archivos.
El primer intento de Vitest dentro del sandbox no pudo abrir sus módulos transformados
temporales; se repitió fuera del sandbox, sin cambiar pruebas ni código, con éxito.

## Evidencia y límites

Inventario de 58 páginas en `Maquetas/3.2/bloque2/INVENTARIO.md`. Las capturas proceden
del build real con Supabase exclusivamente local, sin inyectar el diseño. Se contrastan con
A y con el build de `c1f9582`. El contenido local puede variar tras las suites; no se presenta
la comparación como una diferencia de píxeles con datos idénticos.

T3: 89 capturas finales del build, incluidos anchos 375/768/1024 y estados de error,
vacío, marca, horarios, varias unidades e Historial extenso. La limpieza final eliminó
las dos cuentas, un producto y una novedad temporales; cero errores de limpieza.

El guion `scripts/capturar-modulos-redisenio.cjs` rechaza una API que no sea `127.0.0.1`.
Las cuentas y registros temporales tienen limpieza al terminar, con recuentos y errores
explícitos. La auditoría de esas operaciones locales se conserva. No se utiliza producción
ni se alteran registros del negocio. Sitrai permanece detenido.

Teclado móvil físico y zoom nativo siguen pendientes de revisión en dispositivo.
Altura reducida y zoom CSS son evidencia complementaria y no sustituyen esas comprobaciones.

## Decisiones de ejecución

1. Ejecutar únicamente T3/T4 y abrir el PR 2. Coste: público y cierre transversal pendientes.
2. Reutilizar el checkout aislado y sus dependencias desde el main fusionado. Coste: su nombre
   conserva BLOQUE1 aunque aloja el bloque 2.
3. Mantener pendiente la evidencia de teclado físico y zoom nativo. Coste: no certifica interacción
   física en dispositivo.
4. Usar regresiones funcionales existentes y capturas para cambios cosméticos; los hallazgos
   materiales tendrán reproducción antes/después. Coste: el aspecto depende también de revisión visual.
5. Usar los briefs T3/T4 completos del plan español porque el extractor no reconoce títulos Tn.
   Coste: seguimiento manual del contrato de tareas.
6. Preparar estilos específicos T4 mientras termina la captura T3, servida desde su build.
   Coste: staging explícito para separar commits de tareas.
7. Esperar DOM, contenido, fuentes e imágenes para capturar, en lugar de `networkidle`.
   El formulario estaba disponible mientras seguían solicitudes abiertas. Coste: condiciones
   explícitas de preparación y revisión visual; las suites funcionales no cambian.

## Revisión independiente

Pendiente. Ninguna observación se da por resuelta sin evidencia.
