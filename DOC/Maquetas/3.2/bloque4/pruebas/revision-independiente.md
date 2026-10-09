# Revisión independiente — T6, bloque 4

Rango: `adf156c1c12c815cf4a258a6fa03dbf4a4101e49` → `2bec20b47718fc316e4a366b73ccdab31b13c45f`.
Revisor independiente, contexto nuevo, gpt-6-astra/high; solo lectura del diff,
plan T6, restricciones, especificación §§10/12, A, ledger, registros y capturas.
No volvió a ejecutar build, suites ni capturadores. La primera respuesta se
interrumpió por límite de uso; el mismo revisor completó el informe con lo ya
inspeccionado, sin una segunda revisión ni otro agente.

## Fortalezas

- Las 18 fuentes conservan consultas, condiciones, props, enlaces, slugs,
  precios, mensajes WhatsApp y metadatos; cambios productivos de presentación.
- Catálogo 390/1440 mantiene A: Jakarta, terracota, fondos cálidos, tapiz y
  categorías. Radios y distribución coherentes con el contrato.
- Fichas con foto y varias presentaciones mantienen precio, pedido y condiciones
  legibles; intermedios examinados sin superposición ni pérdida de contenido.
- PizarraPrecios y TarjetaProducto, compartidos con portada, conservan destinos
  y condiciones. Wrapping atiende extremos sin cambiar cálculos.
- Mapa y placeholder conservan dimensiones, aislamiento, importación diferida,
  escapado del popup y enlaces. Proporciones y foco fotográfico intactos.
- Nuevas pruebas de geometría observable; distingue DOM de persistencia/cálculo.
- Registros:491 unitarias;191 E2E aprobadas/19 omisiones/0 fallos;55 vistas
  normales sin incidencias en detectores. Zoom CSS adverso visible.

## Hallazgos

Critical: ninguno. Important: ninguno en T6. Minor: ninguno material antes del
PR borrador. Sin desviación funcional ni reinterpretación material de A
introducida por la entrega. No certifica contenido o entornos no ejercitados.

## Recomendaciones

Mantener límites publicados y última casilla T6 pendiente hasta la revisión
de Dan. Detectores no son certificación integral de accesibilidad;720 px no
equivale a aprobación de zoom nativo.

## Declined to judge

- Cambio/reserva del logo: heredado T1/T5; no repitió configuración real.
- Portales administrativos/foco/selección/paleta: heredados T2; sin cambios T6.
- Formularios administrativos largos/teclado físico/errores por pestaña/borradores:
  T2–T4 y cierre T7; sin interacción física.
- Autorizaciones/detalles de roles limitados: sin cambios; recertificación T7.
- Todas las combinaciones de portada sin slides/textos largos/pausa/reduced motion:
  heredadas T5; efectos compartidos y regresión revisados, no todas reproducidas.
- Zoom nativo200: pendiente; diagnóstico CSS2387 distinto y cabecera sin cambios T6.
- Impresión integral/teclado de todo el sistema: T7; no inferidas de axe/capturas.
- Lighthouse comparativo/nueva Vercel: no medidos; presupuesto/build no sustituyen.
- Stock público: sin contrato de disponibilidad; conservar condiciones existentes.
- Teselas externas permanentes: detector excluye; no garantiza servicio ajeno.
- Error real de servidor/transición completa streaming: inspección de código,
  sin inducir fallos ni capturar transiciones.
- Persistencia/cálculo extremos DOM: solo composición; suites reales existentes.

## Veredicto

Apta para entregar PR4 borrador a Dan sin correcciones obligatorias. Sin bloqueos
técnicos introducidos por T6. No autoriza fusionar, no acredita controles pendientes
ni inicia o cierra T7. Decisiones del implementador ante cada exclusión: `registro.md`.
