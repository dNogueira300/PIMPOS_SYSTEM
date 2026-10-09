# SDD ledger — plan: DOC/Plan de Desarrollo 03.2 - Rediseño integral UI UX.md

Base: adf156c1c12c815cf4a258a6fa03dbf4a4101e49
T4.1/T5 fusionadas por Dan en PR92. Única tarea de esta entrega T6; T7 pendiente; parar en PR4 borrador.
Pre-flight: T6 consume tokens, LogoMarca y cáscara pública ya fusionados; conservar tapiz, consultas, props y navegación. Sin otros productores nuevos.
Ruling: brief T6 extraído del encabezado español en vez del extractor numérico — costo: seguimiento manual.
Ruling: disponibilidad no existe como campo público de stock — preservar precio ausente, WhatsApp condicional y 404 de productos no publicados, sin inventar estados de compra — costo: no hay mensaje nuevo de stock.
Ruling: cambios cosméticos verificados con regresiones/capturas, sin tests que repitan clases — costo: correspondencia estética requiere inspección.
Composición RED: pizarra con nombre sin espacios y precio largo falla a375px; presentaciones largas ya pasan. Se adapta flex-wrap y reparto mínimo del nombre, sin cambiar precios/cálculos.
Ruling: extremos de composición cambian solo texto del DOM — permite verificar el reparto visual sin modificar registros/cache — costo: no acreditan datos/cálculos, protegidos por suites reales existentes.
Regresión inicial: pizarra detecta precio principal móvil36px bajo mínimo44; se conserva expectativa existente y se corrige a clamp44–56px. Nuevos extremos de pizarra/presentaciones GREEN en móvil.
Ruling: raíz Turbopack temporal por junction de dependencias — permite compilar el checkout aislado y se restaura sin diff — costo: el entorno local difiere de CI.
Ruling: zoom CSS conserva breakpoints de escritorio y desborda cabecera; viewport efectivo720 no desborda — registrar el resultado adverso sin alterar la cabecera fusionada para una simulación distinta del zoom nativo — costo: zoom nativo pendiente de verificar en T7.
Verificación final: build aprobado, ESLint aprobado, AST18/18 visuales y fuentes protegidas intactas, Vitest491/491, Playwright191pass/19skip/0fail en16 suites. Capturas55 estados normales sin overflow/axe/azul/imágenes rotas;67PNG más diagnóstico720. Capturador exit1 solo por zoomCSS conocido, no ocultado.
Task 6: complete (commits adf156c..64b6756; pruebas finales: Playwright16 suites con --workers=1 ->191pass/19skip/0fail; Vitest491/491; ESLint/build aprobados; tipado y lint-staged del commit aprobados; evidencia55 vistas normales y diagnóstico zoom documentado).
Final review: fresh gpt-6-astra/high, rango adf156c..2bec20b, solo lectura. Ningún Critical/Important/Minor material. La interrupción por uso se resolvió al concluir el mismo informe sobre lo ya inspeccionado; sin segundo revisor ni revisión.
Final: Ruling: cambio/reserva de logo — usuario conserva marca configurada y reserva original, sin cambios T6, verificación heredada T1/T5 — costo: no se recertificó aquí su propagación entre superficies.
Final: Ruling: portales/foco/selección/paleta administrativos — estilos fusionados T2 intactos y fuera de las fuentes T6 — costo: estados completos pendientes de cierre T7.
Final: Ruling: formularios administrativos largos/teclado físico/errores por pestaña/borradores — flujos fusionados intactos; esta entrega no los modifica — costo: interacción física y regresión transversal pendientes T7.
Final: Ruling: autorizaciones/detalles de roles limitados — permisos/rutas/controles intactos, sin razón para alterar contratos — costo: no se recertifican roles transversalmente aquí.
Final: Ruling: todas las combinaciones administrables de portada — conservar lógica T5 y regresiones reales ejecutadas; componentes compartidos inspeccionados — costo: no se ejercitan exhaustivamente todas las configuraciones.
Final: Ruling: zoom nativo200 — no dar CSSzoom ni720 efectivos como certificación nativa; cabecera heredada intacta — costo: comprobación nativa pendiente T7.
Final: Ruling: impresión integral/teclado de todo el sistema — mantener estilos/controles existentes, sin inferirlos de axe — costo: comprobación integral pendiente T7.
Final: Ruling: Lighthouse comparativo/nueva Vercel — presupuesto/build local no sustituyen esos entornos; PR borrador mantiene el control posterior — costo: medición comparativa T7 y vista previa pendientes.
Final: Ruling: stock público — consumidor conserva precio ausente, WhatsApp condicional y no publicados404; no inventar disponibilidad — costo: ningún mensaje nuevo de stock.
Final: Ruling: teselas externas permanentes — mantener cartografía y controles; servicio externo excluido del detector de fotos — costo: cobertura cartográfica depende del proveedor y no está garantizada.
Final: Ruling: error real de servidor/transición streaming — handlers/mensajes intactos por inspección, sin rutas artificiales — costo: esas transiciones no se reprodujeron físicamente.
Final: Ruling: persistencia/cálculo extremos DOM — composición comprobada sin tocar registros; contratos reales cubiertos por suites existentes — costo: extremos inyectados no prueban persistencia/cálculo.
Final: minor (deferred): ninguno nuevo material en T6. M1 previo de unidades administrativas a768 permanece en T7.
