# Diagnóstico del CI del catálogo — 14/10/2026

## Resultado remoto confirmado

PR #99 fue fusionado el 13/10/2026; main `cf492311273c2d6876598657ef3ad0ba3ab909d8`.
[CI posterior a la fusión](https://github.com/dNogueira300/PIMPOS_SYSTEM/actions/runs/38475537335)
terminó con 603 pruebas aprobadas, 109 omisiones previstas, una intermitente y una fallida.

- Publicar un producto (`panel-productos.spec.ts:10`) no lo encontró en el primer intento,
  pero aprobó un reintento: intermitente, no el fallo definitivo del trabajo.
- Comparar el contador de portada y catálogo (`pizarra.spec.ts:178`) falló en los tres intentos.
  El catálogo indicaba 35; el registro no conservó el contador observado en la portada.
- No se subieron artefactos. Solo estaba configurado el reporter `github`, que no produce
  `playwright-report/`; el workflow intentaba subir únicamente esa carpeta.

## Cambios de diagnóstico

Se generan HTML y JSON además de las anotaciones de GitHub. El workflow conserva
`playwright-report/` y `test-results/` durante siete días, también si un reintento pasa.
El JSON permite distinguir aprobado, intermitente y fallido sin depender del resumen visual.

Cuando falla la comparación, se adjuntan los contadores observados, estados HTTP y cuatro
cabeceras de caché permitidas. No se registran cookies, autorización ni variables de entorno.
Un fallo al recoger el diagnóstico conserva la excepción original. No se cambian aserciones,
reintentos, tiempos, fuentes del sitio ni consultas.

## Reproducción local y límites

- Supabase local, seis servicios necesarios de Pimpo’s; Sitrai apagado. Ningún dato productivo.
- Copia aislada de las fuentes de main, build limpio de Next 16.3.4, compilación y tipos aprobados.
- Publicación y contador, escritorio, dos workers, tres repeticiones sin reintentos: 6/6 aprobadas.
- Productos, categorías y pizarra, ambos tamaños, dos workers, tres repeticiones sin reintentos:
  94/96 aprobadas. Falló una medición de alineación móvil sobre un producto temporal de otra
  prueba y una publicación agotó el tiempo; su captura mostró el catálogo de 34 productos.
  Las seis comparaciones de contador aprobaron en esta tanda.
- Durante parte de la tanda, un observador público local registró 12 diferencias: portada 35
  frente a catálogo 34 durante unos 12 segundos y después la diferencia inversa. La navegación
  extra puede alterar el orden de regeneración; no es prueba de la causa exacta en Linux.
- Los productos publicados de E2E se limpian directamente por REST y eso no llama a updateTag.
  Es un riesgo de contaminación de caché comprobable en el código, no una causa demostrada
  del fallo remoto. No se añade una invalidación o serialización especulativa.
- Smoke del reporte: fallo inicial intencional y reintento aprobado; HTML creado y JSON con
  `flaky: 1`, `unexpected: 0`. ESLint y formato de los cambios aprobados.
- La comprobación adicional `tsc --noEmit` con dependencias compartidas falló en tipos de
  Playwright, Vitest y Supabase Auth, como en la validación anterior. No equivale al chequeo
  del build ni se presenta como aprobada; los tipos completos se validarán en CI con
  instalación limpia. No se modificaron dependencias o lockfile para ocultar esos errores.

## Cómo cerrar

Ejecutar el CI en Linux con esta captura. Si reaparece, revisar `contadores-catalogo-portada`,
`error-context.md` y la traza del primer reintento, contrastando los tiempos de publicación,
limpieza y lectura. Corregir la causa con la comprobación existente, sin ocultar fallos ni
cambiar funcionalidad. Una ejecución verde no basta para atribuir la causa o asegurar que
se resolvió la intermitencia. Este documento no declara la suite corregida.
