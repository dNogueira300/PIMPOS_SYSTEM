# Evidencia para el análisis del 06/10/2026

Capturas de consulta, no propuestas de diseño ni referencias aprobadas para copiar.

- `review-public-*`: sitio publicado de Pimpo's, capturado por la evaluación independiente. Los
  archivos `*-first` muestran el primer viewport móvil (390 × 844); las capturas completas pueden
  incluir recursos diferidos que aún no se habían activado. No interpretar esos huecos como fallos.
- `chola-*`: El Pan de la Chola, 1440 px escritorio y 375 px móvil.
- `kalatanta-*`: Kalatanta, 1440 px escritorio y 375 px móvil. El documento móvil mostró 441 px de
  ancho desplazable en esta sesión.
- `atelier-*`: captura sin contenido visible. **No sirve como evidencia del diseño de Pan Atelier.**
  Su análisis se limita al contenido obtenido de sus páginas oficiales indexadas.
- `referencias.json`: metadatos de la inspección. HTTP 200 no demuestra por sí mismo que una página
  haya terminado de renderizarse. Las familias computadas pueden incluir elementos ocultos o fuentes
  de reserva; no atribuir una tipografía a toda una marca solo por esos valores.

Las referencias se capturaron con movimiento reducido y recorrido de scroll para activar recursos
diferidos. No se enviaron formularios, aceptaron cookies ni realizaron pedidos. No se accedió al
panel de producción ni se guardaron datos de clientes. La automatización nativa agotó el tiempo de
inicio; se usó el navegador Playwright instalado como alternativa de lectura.

El script reproducible está en `scripts/inspeccionar-referencias-redisenio.cjs`. Requiere el
navegador instalado que use Playwright y acceso de red a los tres dominios públicos.
