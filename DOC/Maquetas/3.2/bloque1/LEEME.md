# Evidencia del build — 03.2, bloque 1

Capturas del build de producción de `feat/rediseno-acceso-panel`, base `3113084`, el 08/10/2026.
Turbopack, Supabase local, Chrome, movimiento reducido. No se inyectó el CSS de las maquetas.
Los datos, avisos, usuarios y reloj pertenecen al entorno local de captura; no son contenido productivo.

Reproducción, con build local ya servido en el puerto 3000:

```powershell
node scripts/capturar-panel-redisenio.cjs DOC/Maquetas/3.2/bloque1 --estados
```

`manifest.json` registra rutas, roles, anchos, imágenes y geometría del contenedor del logo.
`estados.json` registra hover, error, diálogo, Más, lista vacía, guardado pendiente y pruebas de espacio.
El guardado pendiente se captura reteniendo y abortando el POST; no se crea una categoría.
Los diálogos de borrado se cancelan. Los usuarios temporales se eliminan; `limpieza.json` lo registra.
La auditoría local se conserva.

El viewport bajo con foco simula espacio reducido, pero no un teclado físico. El zoom CSS al 200 %
simula aumento de contenido; la revisión con zoom nativo y teclado físico sigue pendiente.
El barrido de colores computados es una detección orientativa de azul en estilos; no examina píxeles
de fotografías ni sustituye axe. La cartografía ajena conserva sus colores.

Comparar `login-1440.png`, `login-390.png`, `inicio-1440.png` e `inicio-390.png` con sus referencias
`../../comparacion-redisenio/pantallas/*-a.png`. Las capturas de módulos muestran el efecto de los
tokens y controles compartidos; su composición específica se completa en T3/T4.

Resultados completos en `../../../Verificacion rediseño 03.2 - Bloque 1.md`.
