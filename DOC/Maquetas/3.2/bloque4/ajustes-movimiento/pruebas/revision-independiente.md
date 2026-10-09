# Revisión independiente de la ampliación — PR #93

Rango: `d34d0c8..4a025e6`. Solo lectura; no repite la revisión inicial de T6
ni ejecuta nuevamente suites, builds o capturadores.

Critical: ninguno. Important: ninguno. Minor: ninguno material.

- Moto SVG decorativa, oculta al árbol accesible, no enfocable ni intercepta
  clics. Token crema comprobado en evidencia como `rgb(247, 245, 240)`.
- Transformación CSS izquierda a derecha, 4 segundos, una iteración y posición
  final conservada. Observador desconectado al iniciar y al desmontar; sin
  IntersectionObserver queda estática.
- Movimiento reducido excluye observador y animación. CSS cancela el movimiento
  al activar esa preferencia posteriormente.
- Fotos: `scale(1.03)` en 220 ms, solo pantalla, hover, cursor preciso y movimiento
  permitido. Recorte conserva texto y controles. Imágenes, alt, sizes, carga,
  enfoque, datos, enlaces y lógica del carrusel intactos.
- Sin dependencias nuevas, temporizadores recurrentes ni JavaScript por fotograma;
  la pista reserva su geometría antes de animarse.
- Registros consultados: 199 E2E aprobadas/21 omisiones, 491 unitarias aprobadas,
  cinco anchos sin axe/overflow. AST declara explícitamente CSS y MotoDelivery
  como excepciones; no los presenta como cambios de clases únicamente.

## Límites de la revisión

La referencia artística original no estuvo disponible para el revisor: examinó
SVG e integración en capturas. Fallback sin observador, limpieza al navegar y
cambio de preferencias se examinaron por código, sin una nueva prueba específica.
No reprodujo el video completo: duración, dirección y no repetición respaldadas
por E2E registrados. No certifica contraste de cada fotograma de aparición heredada:
la captura final neutraliza esas apariciones y conserva la moto activa y el
diagnóstico adverso inicial. CI y nueva vista previa no comprobados en esta
revisión local. Lighthouse comparativo, dispositivo físico, zoom nativo e
impresión integral siguen en T7; presupuesto JS no los sustituye.

Veredicto: ampliación apta para PR #93 borrador sin correcciones obligatorias.
No autoriza fusionar ni iniciar T7.
