# Ajustes aprobados de movimiento — PR #93

Dan aprobó implementar en PR #93 el recorrido de moto y el zoom mínimo.
La dirección A y las funcionalidades se conservan. No inicia T7.

Moto: silueta SVG original inspirada en la referencia adjunta, color crema del
token de fondo, pista separada del texto y de los botones. IntersectionObserver
inicia una sola animación CSS de 4 s al aparecer la pista y se desconecta.
Queda a la derecha, sin loop. Sin observador/JavaScript o con movimiento reducido
desde el inicio permanece estática. Cambiar a movimiento reducido cancela la
animación mediante CSS. No importa una librería de animación.

Fotografías públicas: `scale(1.03)` en 220 ms, easing suave sin rebote, solo en
pantallas con hover/cursor preciso y sin movimiento reducido. Se conservan fotos,
alt, proporciones, `sizes`, enfoque configurable y prioridades de carga. El
recorte evita que el zoom invada texto o controles. No se aplica a marca, mapa
ni ilustración de vacío. Cada foto vuelve a su tamaño al retirar el cursor.

## Evidencia

- RED inicial: faltaba la moto; el zoom no era uniforme. `pruebas/red.txt`.
- Nuevos E2E: 8 aprobadas/2 omisiones por tipo de dispositivo. Recorrido real,
  duración, destino final, no repetición, reduced motion, zoom y pantalla táctil.
- Regresión pública: 199 aprobadas/21 omisiones previstas/0 fallos en
  17 archivos. `pruebas/e2e-final.txt`.
- Capturas de delivery: 375/390/768/1024/1440; fotograma pausado a 2 s únicamente
  para inspección. El video móvil registra el recorrido real, sin pausa.
- Fotos normal/hover: galería, nosotros y producto con foto, a 1440.
- Captura final: axe sin violaciones y sin desbordamiento en los cinco anchos;
  color de moto comprobado como `rgb(247, 245, 240)`, token crema A.
  `manifest.json` y `pruebas/captura.txt`.
- Build final, ESLint completo y 491 unitarias aprobados; registros en `pruebas/`.
- Tipado y lint-staged aprobados en el commit `4a025e6`. Revisión independiente
  de esta ampliación sin hallazgos materiales; informe y límites en `pruebas/`.
- El comparador AST con `--ajustes-movimiento` admite explícitamente las dos
  fuentes decorativas revisadas (CSS y MotoDelivery) y retira solo su import y
  nodo añadido de portada. El resto conserva estructura no visual. No afirma
  que el observador o las nuevas reglas CSS sean cambios de clases solamente.
- Presupuesto E2E: 156 KB en móvil y 159 KB en escritorio; diferencia portada
  contra nosotros 0 KB redondeados. No constituye Lighthouse comparativo.

El primer capturador señaló contraste en «Nuestra historia» durante su aparición
por scroll a 1024/1440. Se conserva el diagnóstico y el manifiesto inicial en
`pruebas/`. La pasada final desactiva exclusivamente las clases de aparición
heredadas dentro del navegador de captura para medir contenido estable, siguiendo
el criterio de la suite de axe. No desactiva reglas de axe ni la moto; no cambia
el CSS del sitio ni acredita contraste en cada fotograma intermedio del scroll.
El primer build aún mostraba la moto blanca; las capturas finales corresponden
al build posterior con crema. Ambos registros de build se conservan.

Reproducción, con el build correcto y Supabase local en 3000:

```powershell
node scripts/capturar-ajustes-movimiento.cjs
node scripts/verificar-presentacion-publica.cjs adf156c1c12c815cf4a258a6fa03dbf4a4101e49 --ajustes-movimiento
node scripts/ejecutar-con-supabase-local.cjs node_modules/@playwright/test/cli.js test e2e/publico-movimiento-fotos.spec.ts --workers=1
```

Los detectores no certifican todos los dispositivos. Zoom nativo, teclado móvil
físico, impresión integral y Lighthouse continúan pendientes del cierre T7.
Las capturas anteriores del bloque 4 documentan el estado previo al movimiento.
