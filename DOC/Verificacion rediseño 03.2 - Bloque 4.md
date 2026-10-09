# Verificación de rediseño 03.2 — Bloque 4

Fecha: 09/10/2026. Base `adf156c1c12c815cf4a258a6fa03dbf4a4101e49`, PR #92
fusionado por Dan con CI y Vercel en verde. Rama `feat/rediseno-paginas-publicas`.
Solo T6; detenerse al entregar PR 4 borrador. T7 pendiente.

Catálogo y fichas completan A con filtros, radios y fotos coherentes, superficies
de lectura para la información del producto y precio destacado proporcionado.
Los nombres/precios largos pueden reorganizarse sin recorte. Se conserva la
pizarra, las presentaciones y todas las condiciones de aparición. Contacto,
preguntas/guías, galería, historia, novedades, mapa, error y 404 comparten ese
tratamiento visual y mantienen sus enlaces y contenido.

No cambian consultas, acciones, props, filtros, slugs, cálculo de precios,
mensajes WhatsApp, mapa/escapado, metadata ni límites de error. El comparador AST
confirmó las 18 fuentes iniciales modificadas ignorando solo `className`, el literal de
clases `CAMPO` y espacios JSX vacíos; no permite cambios en expresiones de datos.
Las fuentes de datos, migraciones y dependencias permanecen intactas.

**Ampliación aprobada por Dan en PR #93:** moto decorativa en la sección de
movilidad propia, una pasada de 4 s al aparecer, y zoom uniforme del 3 % en
fotografías públicas. SVG inspirado en su referencia, sin librerías nuevas.
Respeta movimiento reducido y cursor/tacto. Evidencia adicional en
`Maquetas/3.2/bloque4/ajustes-movimiento/`, con video y comparaciones normal/hover.
El comparador actual con `--ajustes-movimiento` distingue las dos fuentes
decorativas nuevas/revisadas de los cambios de clases; no certifica su lógica
mediante eliminación de clases. Consultas, acciones y datos siguen intactos.

## Comprobaciones de los ajustes de PR #93

Build final aprobado con el color crema aplicado y configuración restaurada.
ESLint completo aprobado; Vitest: 491 pruebas aprobadas en 60 archivos.
Playwright contra ese build: 199 aprobadas, 21 omisiones previstas y cero fallos
en 17 suites, 3.3 min. Incluye ocho casos ejecutados de moto/hover/tacto/reduced
motion y dos omisiones por tipo de dispositivo. Se conserva el RED previo.
Las pruebas de precios, filtros, pedido, mapa, carrusel, contenido y SEO pasan.
Presupuesto de portada: 156 KB móvil y 159 KB escritorio, dentro del umbral.

Las cinco capturas adicionales a 375/390/768/1024/1440 no desbordan y axe no
señala violaciones. La moto usa el token crema `#f7f5f0`. Video del recorrido real
y pares normal/hover de galería, nosotros y producto en
`Maquetas/3.2/bloque4/ajustes-movimiento/`. Galería abierta en el navegador:
las cuatro imágenes y el video cargan; este último dura 5.28 s, con 4 s de recorrido.

La primera captura señaló contraste durante la aparición heredada de «Nuestra
historia» por scroll. El diagnóstico se conserva. El capturador final neutraliza
solo esas clases de aparición dentro de su navegador para medir texto estable;
mantiene activa la moto y todas las reglas de axe. No altera la aplicación ni
certifica cada fotograma intermedio. El comparador AST actual requiere
`--ajustes-movimiento` y mantiene las fuentes protegidas intactas.

Tipado y lint-staged aprobados en `4a025e6`, con hooks activos. Revisión
independiente de la ampliación `d34d0c8..4a025e6` concluida sin hallazgos materiales;
no sustituye sus límites de prueba por código ni la revisión pendiente de Dan.
Informe: `Maquetas/3.2/bloque4/ajustes-movimiento/pruebas/revision-independiente.md`.

## Comprobaciones iniciales de T6

Build de producción aprobado; configuración temporal restaurada sin diff.
ESLint completo aprobado. Vitest: 491/491 en 60 archivos, 11.42 s en la pasada
final. Playwright: 191 aprobadas, 19 omisiones existentes, cero fallos (2.9 min).
Se ejecutaron las diez suites obligatorias de T6 y `publico-composicion`,
`cabecera`, `tactil`, `movimiento`, `carrusel-interacciones` y `portada`, con
un trabajador contra el mismo build final. El presupuesto conserva 158 KB de
JavaScript público en portada y nosotros, sin aporte adicional de la aplicación.
Esto no constituye una medición comparativa Lighthouse.

55 vistas de 11 rutas a 375/390/768/1024/1440: axe WCAG A/AA sin violaciones,
sin desbordamiento, sin azul en controles/títulos de `main` y sin imágenes
visibles rotas fuera de Leaflet. No se desactivaron reglas de axe. Se guardaron
67 PNG principales, más un diagnóstico a 720 px. Las teselas cartográficas son
externas y no forman parte del detector de imágenes rotas. La base conserva seis
vistas a 390/1440 y sus tres viewports móviles. Catálogo comparado con A y fichas
con la base; se inspeccionaron además contacto, preguntas, mapa y 404.

El capturador termina con código 1 por la prueba adicional de zoom CSS: `html{zoom:2}`
mantiene la media query de escritorio a 1440 y ensancha su navegación hasta
2387 px. A 720 px de viewport efectivo (equivalente al reflow de 200 %), el
catálogo mide 720 px y usa menú móvil, sin overflow. Se conserva el resultado
adverso; no se declara zoom nativo aprobado. Registro en `pruebas/zoom-diagnostico.txt`.
Tipado y lint-staged aprobados en el commit `64b6756`; formato completo aprobado.
La revisión independiente se registra antes de entregar.

RED de composición: un nombre continuo y un precio largo desbordaban la pizarra
a 375 px. Se corrige el reparto y wrapping, sin cambiar el nombre/precio ni su
procedencia. La prueba de presentaciones largas ya pasaba antes del cambio;
se mantiene como regresión, sin atribuirle un defecto inexistente.
La primera regresión completa detectó precio principal de 36 px en ficha sin
foto. Se conservó el mínimo existente de 44 px y se corrigió el tamaño a
`clamp(44px,4vw,56px)`; la suite final pasa sin debilitar su expectativa.

## Decisiones y límites

- Brief extraído directamente del encabezado T6 español. Costo: seguimiento manual.
- No hay campo público de stock: conservar precio ausente, WhatsApp condicional y
  404 de productos no publicados. Costo: sin mensaje nuevo de disponibilidad.
- Estética verificada mediante capturas y regresiones, sin repetir clases en
  tests. Costo: requiere inspección visual.
- Textos extremos probados solo en el DOM, sin tocar datos/cache. Costo: no
  acreditan cálculo o persistencia; las suites existentes prueban esos contratos.
- Compilación local con raíz temporal Turbopack para la junction de dependencias;
  configuración restaurada. Costo: no equivale por sí sola a CI.
- El zoom CSS no emula los breakpoints del zoom nativo; se conserva su overflow
  como diagnóstico y se contrasta con 720 px efectivos. Costo: falta comprobar
  zoom nativo y cierre transversal en T7.

No hay vista previa nueva de Vercel, teclado móvil físico, zoom nativo, impresión
integral ni medición comparativa Lighthouse en este bloque. Los estados de error
de servidor y streaming se revisan por código sin introducir rutas artificiales
en la aplicación. T7 mantiene el cierre integral.

## Revisión independiente

Revisión independiente única de `adf156c..2bec20b`, solo lectura, concluida sin
Critical, Important ni Minor material. Apta para entregar PR4 borrador a Dan;
no autoriza fusionar ni iniciar T7. Informe en
`Maquetas/3.2/bloque4/pruebas/revision-independiente.md`. Cada conducta apartada
tiene decisión y costo explícitos en `pruebas/registro.md`. Se mantiene la última
casilla del plan pendiente de revisión de Dan.

Galería: `Maquetas/3.2/bloque4/index.html`, abierta en el navegador y con ambas
imágenes de catálogo A/resultado comprobadas. Checkout conservado para revisión.
