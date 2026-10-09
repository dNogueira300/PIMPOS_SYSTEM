# Revisión independiente del bloque 3

Revisor independiente, contexto nuevo y solo lectura. Rango revisado:
`429a25d62536c7bcd410d4a06dfc4f71ac21660d..4a3065c0af20b3376aab4d7dbb25d26cb29a843c`.
No modificó archivos, índice, HEAD ni rama; no delegó ni repitió suites pesadas.

Confirmó conservación de consultas, permisos, acciones, cálculos y cinco cambios
recientes; correspondencia razonable con dashboard aprobado y A/a6; logo/dibujo
administrables; tapiz idéntico; regresiones, capturas, foco y limpieza respaldados
por las salidas. Inspeccionó dashboard escritorio/móvil, portada 390/1440/768,
referencias aprobadas y ambos focos.

Critical: ninguno. Minor material: ninguno.

## Important I1: interacción del carrusel hidratado sin cobertura específica

Referencias del rango revisado: `e2e/carrusel-estados.spec.ts:31`,
`e2e/movimiento.spec.ts:241` y verificación del bloque 3, línea 113.
El SSR aislado solo acredita geometría. Las suites existentes de movimiento
prueban scroll, y las de navegación menú/catálogo; no flechas, indicadores,
intervalo de seis segundos, pausas ni movimiento reducido de Embla.
El código de hooks estaba conservado, pero no bastaba para acreditar la nueva
composición integrada. No se encontró un fallo funcional demostrado.

Corrección indicada: añadir casos sobre página real hidratada y precisar la
documentación; no modificar comportamiento para fabricar un RED ni repetir
administración. La resolución del ejecutor y sus resultados están en el documento
de verificación y el registro `ejecucion.txt`.

## Declined to judge: lista completa del revisor

1. Vercel: todavía no hay vista previa de este PR comprobada.
2. Fusión/despliegue: aprobación visual no los autoriza.
3. Cierre de todas las rutas/estados: corresponde a T7.
4. Composición final de catálogo, detalles y páginas restantes: T6; sí se
   revisaron cabecera, pie y tapiz compartidos.
5. Regresión exhaustiva de formularios largos, borradores, errores de pestaña
   y submitter: sus componentes no cambian en esta rama.
6. Teclado virtual físico y barras fijas: captura no sustituye prueba física.
7. Zoom nativo al 200 %: CSS no es equivalente.
8. Impresión completa: la prueba existente solo verifica opacidad de animaciones.
9. Todos los portales, selecciones, hover y focos: las 19 capturas no certifican
   el cierre transversal de T7.
10. Hidratación de fixtures vacíos/largos: el harness SSR la excluye; interacción
    ordinaria se trata como I1, no como exclusión.
11. Administrador con historial realmente vacío: condición intacta por lectura,
    sin vaciar auditoría para obtener evidencia.
12. Todas las marcas, proporciones y nombres largos administrables: guardado
    real y resolución de rutas comprobados, sin exhaustividad de assets.
13. Rendimiento, Lighthouse y presupuesto final de imágenes: T7; no cambiar
    aisladamente `sizes="100vw"`, cuya reutilización está documentada.
14. Fachada cerrada y azul fotográfico/cartográfico: contenido existente y
    excepción expresa a la restricción de azul en interfaz.
15. RLS, exportaciones, cálculos y seguridad de módulos sin cambios: fuentes
    intactas, sin nueva ejecución SQL/regresión exhaustiva de esos módulos.
16. Equivalencia del build temporal con CI y otros dispositivos/navegadores:
    necesitan sus propios entornos.
17. Espacios finales de salidas brutas `.txt`: `git diff --check` los marca
    únicamente allí; el chequeo de `src`, `e2e` y `scripts` pasa.

Veredicto original: con corrección de I1 y verificaciones pendientes del PR,
proceder a PR borrador para Dan; no fusionar ni iniciar T6/T7.
