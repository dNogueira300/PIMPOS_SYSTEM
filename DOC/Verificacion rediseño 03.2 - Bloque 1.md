# Verificación de rediseño 03.2 — Bloque 1

Fecha: 08/10/2026. Base: `3113084`. Rama: `feat/rediseno-acceso-panel`.
Checkout: `PIMPOS_REDISENO_BLOQUE1`. Alcance: T1 + T2 del plan 03.2.
Estado: [PR #90](https://github.com/dNogueira300/PIMPOS_SYSTEM/pull/90) en borrador;
verificación local aprobada y login de vista previa revisado. Revisión en dispositivo pendiente.

## Resultado implementado

Tokens terracota y neutros cálidos, Jakarta local para texto y títulos, logo transparente optimizado
en acceso y panel, círculo del login en móvil y escritorio, lateral claro, cabecera móvil con marca,
listas y controles compartidos. Se conserva la marca administrable y el archivo de reserva.
No se modifican acciones, validaciones, consultas de negocio, permisos, cálculos, exportadores o migraciones.
La consulta existente de configuración se reutiliza para resolver el logo en el servidor.
La composición pública y los módulos específicos corresponden a T3–T6; el cierre integral, a T7.

Los tres WebP provienen del PNG aprobado, sin modificar el original. Tamaños: 18 356 / 43 978 /
72 284 bytes para 256 / 512 / 768 px. El mayor conserva la ruta `public/marca/logo.webp`.

## Comprobaciones

| Comprobación                  | Resultado                                                                                      |
| ----------------------------- | ---------------------------------------------------------------------------------------------- |
| Vitest completo               | 492 pruebas aprobadas, 60 archivos                                                             |
| Paleta y contraste            | 45 pruebas aprobadas                                                                           |
| Build de producción           | Turbopack; compilación y tipos aprobados, 113 páginas estáticas                                |
| ESLint completo               | Aprobado sin advertencias, incluidos los guiones finales                                       |
| Prettier completo             | Aprobado, incluidos los documentos y manifiestos de evidencia                                  |
| E2E funcional + accesibilidad | 273 aprobadas / 21 omisiones previstas / 0 fallos; un trabajador, móvil y escritorio           |
| Capturas del build            | 28 pantallas + 11 estados a 390 / 1440 px, tres roles; imágenes cargadas y sin desbordamiento  |
| Vista previa Vercel           | Login revisado en navegador a 1582 y 390 px reales; logo cargado, círculo y sin desbordamiento |
| CI del PR #90                 | Primera ejecución y correcciones documentadas abajo; resultado posterior disponible en el PR   |

Suites E2E: `identidad-panel`, `autenticacion`, `panel-sesiones`, `panel-inactividad`,
`panel-cascara`, `panel-configuracion`, `panel-editar`, `panel-busqueda`,
`panel-accesibilidad` y `accesibilidad`. La navegación y el logo se comprueban además a
375, 390, 768, 1024 y 1440 px. No se desactivan reglas de axe para acomodar el nuevo diseño.
La prueba de marca carga una imagen local temporal, comprueba panel/login y restaura la
configuración y el archivo al terminar. La comprobación de cabecera pública se completa en T5.

Tras las correcciones de CI se repitieron las suites afectadas: 59 casos aprobados y 21 omisiones
previstas. Dos casos de identidad detectaron que la nueva expectativa de duración no representaba
la desactivación de la animación; corregida a `transition-property: none`, la suite de identidad
aprobó 18/18 en tres repeticiones por tamaño. Build final, tipos, ESLint completo y formato completo
aprobados. Los resultados posteriores de CI se conservan en el PR; esta evidencia local no los sustituye.

Evidencia en `Maquetas/3.2/bloque1/`, con manifiesto y limpieza de tres usuarios temporales.
Los once estados revisados no muestran azul en el barrido orientativo de estilos computados.
Login e inicio se compararon visualmente con A; también se inspeccionaron error, diálogo y guardado
pendiente. El aumento CSS al 200 % no genera scroll horizontal. En el viewport bajo, la barra
de guardado conserva su posición fija; la interacción con teclado real requiere revisión en dispositivo.

## Revisión independiente y correcciones

La revisión de la rama no encontró cambios en permisos, autenticación ni acciones de negocio.
Detectó contraste insuficiente (2.18:1) en el hover de la pestaña activa: corregido con texto blanco
explícito y texto de peligro en la pestaña con error. La prueba axe reprodujo el fallo y pasó tras
el ajuste. El barrido posterior encontró que la cabecera móvil quedaba fuera de los landmarks:
se sustituyó su `div` por `header`. El caso de `/admin` falló antes y pasó después de esa corrección.

La primera ejecución completa de CI (`37784905720`) aprobó 547 casos E2E, omitió 102 y falló en
siete; dos casos aprobaron al reintentar. Seis fallos exigían el azul, Playfair o los botones en
píldora del plan 03.1: se actualizaron esas expectativas al contrato A conservando la carga real
de fuentes, la navegación activa y el área táctil. El caso de XSS del mapa falló también aislado:
los eventos capturados mostraron que el foco de Leaflet desplaza la página durante el clic de
mouse y suelta sobre la barra inferior. La suite móvil usa ahora `tap`; dos ejecuciones aisladas
aprobaron manteniendo las tres comprobaciones de seguridad. No se modifica la lógica del mapa.

El caso intermitente de la pestaña con error detectó contraste de 3.6:1 durante su transición de
150 ms. Se elimina la transición únicamente en el estado de error. La comprobación inicial de
duración falló con `0.15s`; se corrigió para afirmar `transition-property: none`, que es lo que
desactiva la animación aunque el valor heredado de duración siga declarado. El marcador del mapa, compartido por contacto y ficha de cliente,
tenía un azul inline heredado; ahora usa los tokens de marca y fondo. Se conserva su tamaño y
toda su interacción. El caso intermitente de existencias obtuvo 46 en vez de 45 y aprobó al
reintentar; no se modifica ni se relaja el cálculo ni su expectativa.

Vercel aprobó el despliegue de vista previa. La protección SSO impidió inicialmente su lectura;
Dan abrió el acceso y confirmó que estaba disponible. Se revisó exclusivamente `/ingresar`:
logo original optimizado, círculo de 350 px en escritorio y 160 px en móvil, fuente Jakarta y
campos intactos. A 390 px reales `scrollWidth` es 390; el logo carga `logo-256.webp`. Se restauró
el viewport al terminar. Esta revisión no entra al panel alojado ni utiliza credenciales del negocio.

Menor diferido: el test automático del círculo compara sus lados, pero no afirma el radio; utiliza
los tamaños por defecto de Playwright. Las capturas a 390/1440 registran también el radio
computado: lados iguales de 160 y 345.59375 px respectivamente, con `rounded-full`. El login
se revisó visualmente a ambos tamaños. Queda la revisión en un dispositivo con teclado físico y
zoom nativo del navegador.

## Ajuste posterior del login móvil — 08/10/2026

Dan pidió adaptar una referencia adjunta antes de pasar al siguiente bloque: cabecera orgánica
con transición ondulada al formulario. Se aplicó terracota/crema, Jakarta y el logo original circular,
con los mismos títulos, campos y botón. En su ajuste posterior, Dan pidió centrar el logo y los títulos
en móvil: quedan alineados al centro de la pantalla; el formulario conserva su alineación.
La onda y las formas son decorativas, sin foco ni animación.
La composición de escritorio conserva sus dos columnas. No cambian acciones de autenticación,
retornos, validación, permisos ni comportamiento de sesión; tampoco se añaden controles.

El cambio de producto se limita a `CascaraAcceso` y la composición de `/ingresar`. La variante es
optativa: cambiar la clave mantiene su composición. La cabecera ocupa su altura natural, para
conservar el texto por encima de la onda cuando crece o se divide en varias líneas.

Build Turbopack y tipos aprobados (113 páginas); las ocho vistas del build final, incluidos error,
inactividad, altura reducida y zoom CSS al 200 %, registran cero violaciones de axe sin desactivar
reglas, controles visibles y cero desbordamiento horizontal. Evidencia y límites en
`Maquetas/3.2/bloque1/login-movil-ondulado/`. Esperar los campos y Entrar visibles evita capturar
el fallback de Suspense. La comparación de escritorio registra 12596 píxeles distintos (0.875 %),
sin afirmar igualdad exacta.

La revisión independiente detectó inicialmente que el subtítulo se cruzaba con la onda; la medición
vio el solapamiento antes del arreglo. Se sustituyó la cabecera de altura fija por flujo normal
con espacio reservado para la onda. Después detectó evidencia con controles todavía a 0×0:
se repitieron las capturas esperando el formulario. La comprobación al 200 % mostró un ancho mínimo
implícito de cuadrícula que desbordaba; se corrigió con `minmax(0,1fr)` y se repitió la misma
medición sin ocultar overflow. Las ocho capturas finales pasan esas comprobaciones.

Revisión independiente final: los hallazgos importantes quedan cerrados y no hay nuevos problemas
materiales. Subtítulo separado de la onda por 17 px normales y 34 px con zoom CSS. ESLint completo
sin advertencias y Prettier completo aprobado. E2E del build final: `autenticacion`, `identidad-panel` y `panel-sesiones`,
**32 aprobadas, cero omisiones y cero fallos** (un trabajador, móvil y escritorio, 1.8 minutos).
Esta ejecución corresponde al diseño ondulado anterior al ajuste final de alineación; el centrado
no cambia estructura ni formulario. Sus capturas se repiten con el build final y verifican también
el centro del logo y la alineación de títulos en móvil. El CI del PR comprueba el último commit.

La validación funcional y el CI anteriores corresponden al commit `39793cc`; no se atribuyen a este
ajuste posterior. Los resultados actuales se registran en el PR #90. Siguen pendientes el teclado
físico móvil y el zoom nativo en un formulario largo; el PR continúa en borrador y T3–T7 pendientes.

## Decisiones de ejecución y límites

1. Se creó un worktree Git en la carpeta hermana porque la herramienta de la app no reconocía el
   repositorio desde la carpeta padre. Coste: checkout no registrado por la app; se usa su ruta explícita.
2. Se ejecutan únicamente T1/T2 y se detiene el trabajo al abrir su PR, conforme al primer bloque
   autorizado. Coste: el rediseño integral permanece pendiente.
3. El extractor de la skill no reconoce encabezados españoles T1/T2: se usaron los apartados completos
   del plan como brief. Coste: seguimiento manual de las casillas.
4. La revisión independiente se realizó con el modelo disponible gpt-6-astra. Coste: no utiliza el
   modelo opus citado por la guía histórica del proyecto.
5. El tema oscuro latente, variantes sin consumidores, módulos y composición pública se revisan
   en sus entregas; Lighthouse corresponde al cierre. Coste: esta evidencia no demuestra T3–T7.
6. La validación existente prohíbe guardar una ruta de logo vacía. Se retiró el nuevo caso que
   intentaba esa operación. Coste: una fila antigua vacía no queda ejercitada por un guardado de UI;
   el fallback está implementado sin alterar esa validación.
7. Se reutilizaron las dependencias instaladas mediante junction, tras atascarse la instalación local.
   Turbopack necesitó una raíz temporal que incluyera ese enlace; `next.config.ts` se restauró al
   terminar. Coste: condición local del checkout; no se incorpora una ruta de Windows al producto.
8. La selección de categoría antes de hidratar falló en el build alternativo webpack y pasó tanto en
   la base como en la rama con Turbopack, el compilador habitual. Se conservó la lógica de búsqueda.
   Coste: no se afirma equivalencia de comportamiento entre compiladores.

Los usuarios y archivos de prueba son locales y se eliminan al terminar, conservando la auditoría.
Sitrai permanece detenido por petición de Dan. No se reinició la base ni se cambiaron datos productivos.
No hay autorización para fusionar ni desplegar en producción.
