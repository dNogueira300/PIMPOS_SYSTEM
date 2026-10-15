# Marca pública: cabecera e iconos — 14/10/2026

Dan informa que Google muestra el icono azul y la cabecera pública dibuja dos logos.
No se cambia ninguna función, navegación, formulario, permiso o consulta.

## Causa verificada y corrección

La cabecera dibujaba `logo_url` y, al existir `isotipo_url` personalizado, una segunda
insignia. Ahora muestra una sola imagen: el dibujo administrado, o el logo principal
si no hay dibujo personalizado. Ambos campos siguen operativos: logo completo en pie,
login y panel, dibujo en cabecera. Nombre accesible del enlace, nombre visible, menú,
WhatsApp y puntos de adaptación se conservan.

El archivo público `/favicon.ico` aún contenía el azul `#12306E` (64×64), comprobado
por descarga. La vista previa del panel empleaba un SVG transparente sobre crema;
no era el PNG crema preparado en PR #99. Esto prueba que coexistían versiones, no
qué archivo seleccionó Google ni cuándo lo leyó.

`preparar-favicon.cjs` genera también ICO 96×96 y el SVG compatible usando exactamente
el PNG crema aprobado. Las rutas se conservan. El PNG y Apple ya aprobados no cambian.
El script usa el original de `DOC/Fotos y documentos Adjuntados Pimpos/Diseño/logo.png`;
no redibuja la marca. ICO validado con Pillow, PNG embebido y SVG coincidentes byte a byte.

## Publicación mediante el panel existente

Con la sesión que inició Dan, se actualizó solo el dibujo de cabecera al derivado
`logo-256.webp` y el favicon al PNG crema 96×96 aprobado. Se guardó cada cambio usando
el formulario, sin SQL/API alternativa. Logo completo y otros campos no se editaron.
Después de guardar, una visita pública anuncia el PNG nuevo y el dibujo nuevo.
Favicon descargado y verificado: SHA256
`fd92d3f8a35d45ce2a1a2f01c4b2711fa1173eb5541c80aec71349b23a1c0331`,
idéntico al PNG aprobado en PR #99. Evidencia pública en
`Evidencias SEO/marca-publica-2026-10-14.json`.

La cabecera única y las rutas de compatibilidad requieren desplegar esta rama. El cambio
no prueba que Google haya actualizado su resultado. Tras desplegar, comprobar portada,
`/favicon.ico` y `/marca/favicon.png`, y solicitar una nueva indexación de la portada en
Search Console. Google controla el rastreo y la selección del icono.
[Guía oficial de favicons](https://developers.google.com/search/docs/appearance/favicon-in-search).

## Verificación

- Diagnóstico React SSR del componente real: main produce dos imágenes con dibujo
  personalizado; corrección produce una. Logo de reserva también produce una.
- ICO y SVG contienen los mismos bytes PNG crema aprobados; no cambian PNG ni Apple.
- Detector de interfaz: sin observaciones mecánicas.
- Revisión independiente: corregida una expectativa E2E que suponía isotipo predeterminado;
  ahora respeta el dibujo previo y sigue verificando logo completo en el pie. Sin observaciones restantes.
- Primer intento E2E no llegó a ejecutar pruebas: solapamiento de arranque local y timeout
  del build a 300 s. No se registra como prueba aprobada ni como fallo del producto.
- Compilación limpia Next 16.3.4 aprobada: compilación 91 s, TypeScript 98 s,
  113 páginas generadas. Dependencias compartidas solo de lectura; configuración
  Turbopack ajustada únicamente en la copia privada para resolver ese enlace.
- Vista real del build local en 1440×900 y 390×844: una imagen en cabecera y sin
  desbordamiento horizontal. Menú y controles conservados. Capturas privadas en
  `.superpowers/seo/marca-unica/cabecera-escritorio.jpg` y `cabecera-movil.jpg`.
- Regresión E2E de cabecera, configuración y SEO: **35 aprobadas, 17 omisiones previstas,
  cero fallos y cero reintentos** (52 casos conciliados, 1.8 min). Incluye modificar
  logo/dibujo por el panel y verificar una sola imagen en cabecera con logo completo en pie.
- ESLint, formato de archivos modificados y `git diff --check` aprobados.
