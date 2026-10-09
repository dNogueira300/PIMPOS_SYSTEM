# Verificación de rediseño 03.2 — Bloque 3

Fecha: 08/10/2026. Base: `429a25d` (PR #91 fusionado). Rama:
`feat/rediseno-portada-dashboard`. Dan aprobó el dashboard comparable con
«perfecto, dale palante». Esta entrega reúne T4.1 y T5; T6/T7 siguen pendientes.

Inicio reorganiza los mismos avisos, accesos por rol y cinco cambios recientes.
Las cantidades se separan del texto existente con reserva segura y conservan
el nombre accesible completo. El historial solo cambia de presentación dentro
del inicio. No se añaden métricas, consultas ni acciones.

El sitio público usa el logo optimizado/configurable en cabecera y pie, el tapiz
tenue aprobado, y texto blanco en un panel terracota separado de la fotografía.
El dibujo de marca personalizado sigue administrándose de forma independiente:
se muestra como marca auxiliar dentro de los mismos 72 px de cabecera. El SVG
anterior por defecto no reaparece. No se quita ni desactiva su campo.
La portada móvil conserva el estado calculado y WhatsApp, con el contraste
aprobado. Madrugada conserva el título, hora y descripción sin ilustración.
No se rediseña aún la composición de catálogo, detalles ni páginas restantes.

## Comprobaciones

| Comprobación                                  | Resultado                                                                                |
| --------------------------------------------- | ---------------------------------------------------------------------------------------- |
| Build de producción                           | Aprobado; 113 páginas estáticas                                                          |
| ESLint completo                               | Aprobado sin advertencias                                                                |
| Typecheck explícito                           | Aprobado: `next typegen` y `tsc --noEmit`                                                |
| Vitest completo                               | 491 aprobadas, 60 archivos, 0 fallos                                                     |
| Dashboard y nueve suites administrativas      | 233 aprobadas, 25 saltos previstos, 0 fallos (10,2 min)                                  |
| Diez suites públicas y Configuración completa | 120 aprobadas, 18 saltos previstos, 0 fallos (2 min)                                     |
| Capturas finales y foco                       | 31 PNG; 19 estados sin incidencias y dos focos visibles de 2 px; tres cuentas eliminadas |
| Revisión independiente de rama                | Pendiente de registrar                                                                   |
| Vista previa de Vercel                        | Pendiente                                                                                |

Las suites administrativas incluyen `panel-cascara`, `panel-historial`,
`panel-accesibilidad`, `panel-inicio`, `panel-configuracion`, `panel-insumos`,
`panel-bajas`, `panel-novedades` y `panel-clientes-administracion`.
Las públicas incluyen `portada`, `portada-movil`, `marca`, `cabecera`,
`abierto-ahora`, `flotante`, `movimiento`, `tactil` y `accesibilidad`, además
del archivo nuevo `carrusel-estados`. Se usa un trabajador. La tanda completa
administrativa se ejecutó sobre el build con la corrección de cantidades.
Después solo cambió la cabecera pública para conservar el dibujo configurable:
Configuración y todas las suites públicas se vuelven a ejecutar sobre ese
build final, que también pasa Vitest completo, ESLint y compilación.

No se añaden saltos ni se excluyen reglas de axe. La prueba de marca comprueba
la actualización del logo en panel, login, cabecera y pie, además del dibujo
independiente de la cabecera. Restaura ambos campos, caché y archivos temporales.

## RED → GREEN y contratos

- Antes de T5: cinco fallos esperados por logo anterior, horno y velo, con un
  salto móvil previsto. Después del cambio: cinco aprobados, un salto.
- Las tres pruebas móviles nuevas por rol detectaron que la descripción del
  acceso se concatenaba al nombre accesible. `aria-label` conserva los nombres
  anteriores y los destinos literales. Resultado final en la tabla superior.
- Una cantidad de cuatro dígitos se superponía al texto con la columna móvil
  fija de 56 px. Se vio fallar en ambos proyectos; la columna conserva ese
  mínimo y crece con la cantidad. La fixture solo cambia texto del navegador,
  sin alterar avisos ni conteos en la base.
- La ampliación de la prueba de marca reprodujo que guardar un dibujo no
  actualizaba la cabecera. Se restaura esa prop y su consumidor como marca
  auxiliar cuando está personalizada, conservando el logo principal y el
  espacio del enlace. Ambos campos, archivos y caché se restauran en `finally`.
- La primera regresión pública dio 104 aprobados, 15 saltos y una expectativa
  obsoleta de titular terracota. Se actualiza al blanco sobre fondo terracota
  sólido aprobado, conservando contraste AA. La comprobación posterior de
  portada y estados extremos dio 26 aprobados y cuatro saltos.
- El primer harness SSR chocó con el transformador JSX de Playwright. Se
  renderiza el componente real en un proceso React aislado, sin alterar base,
  caché ni props productivas. La fixture se sirve exclusivamente en el navegador
  de Playwright, con UTF-8 y los estilos del build: así la hidratación de la
  portada no restaura sus slides sobre el caso controlado. Comprueba ausencia
  de slides y texto largo sin fotografía a 768/1024/1440. No simula hidratación.
- Comparación normalizada contra `429a25d`: `contarAvisos`, preparación de datos
  de Inicio, carga de portada y estado/efectos del carrusel permanecen iguales.
  No cambia ningún archivo de acciones, datos, permisos, migraciones o
  dependencias. El tapiz coincide byte por byte con a6 (SHA-256
  `6d52af580e5176d38875de72e14e36c595bfeb7d77aa2d7300f41f1237422f6f`).

## Evidencia y límites

Galería: `Maquetas/3.2/bloque3/index.html`; manifiesto y capturas junto a ella.
Administrador a 375/390/768/1024/1440, ingeniero/repartidor a 390/1440,
`motivo=sin-acceso` para los tres, zoom CSS y portada en los cinco anchos,
estado cerrado y madrugada. Los fixtures locales varían respecto a la maqueta;
la comparación no es una diferencia de píxeles con datos idénticos.
Las 19 mediciones no detectan desbordamientos, infracciones axe, controles
azules, imágenes rotas ni objetivos táctiles inferiores al mínimo. Las dos
capturas de foco registran `:focus-visible` y contorno de 2 px. Se inspeccionaron
el dashboard de escritorio, portada móvil/escritorio, madrugada y ambos focos.

Los estados sin actividad o avisos restringidos se verifican por rol; no se
vacía artificialmente el historial administrativo para una captura. La ausencia
de historial en administración conserva su condición original por inspección.
Las imágenes largas desplazan el dibujo de controles fijos: se guardan también
viewports móviles. Las fotografías pueden conservar azul.

No se han usado teclado móvil físico ni zoom nativo; el aumento CSS no los
sustituye. Esta entrega todavía no acredita Vercel, rendimiento final ni el
cierre integral del rediseño. T7 conserva esas comprobaciones transversales.

## Decisiones de ejecución

1. Los briefs se extraen directamente de los encabezados españoles T4.1/T5,
   que el extractor numérico no reconoce. Costo: seguimiento manual de pasos.
2. El dashboard cosmético se verifica con regresiones y capturas, sin pruebas
   que repitan clases CSS. Costo: correspondencia estética por revisión visual.
3. Se sustituyen expectativas de estética retirada por contraste y geometría
   del diseño aprobado. Costo: cambia la referencia visual protegida; AA permanece.
4. Raíz temporal de Turbopack para la junction Windows, restaurada en `finally`.
   Costo: build local con raíz distinta del CI.
5. Estados extremos renderizados con React real aislado para evitar el JSX
   propio de Playwright y cambios en fixtures. Costo: esos casos no cubren
   hidratación; movimiento/navegación reales tienen sus regresiones E2E.
6. Se conserva el dibujo configurado como marca auxiliar, sin recuperar el SVG
   antiguo por defecto. La instrucción de no perder funcionalidad prevalece
   sobre la omisión de este consumidor en el plan. Costo: con dibujo personalizado,
   ambos assets comparten los 72 px de marca y el logo principal ocupa 48 px.

## Revisión independiente

Pendiente de registrar.
