# Páginas públicas — bloque 4

T6 del rediseño 03.2, desde `adf156c` (PR #92 fusionado). La dirección A/a6
ya está aprobada. La galería compara catálogo con A a 390/1440 y catálogo/fichas
con las capturas de la base; otros anchos o páginas no tienen maqueta exacta.

Se conservan pizarra, filtros por URL, presentaciones, precios, mensajes de pedido,
preguntas, guías, imágenes reales, mapa, contactos y condiciones. El vacío de
novedades conserva su ilustración: la retirada aprobada afectaba a la portada.
No se añaden campos de stock ni mensajes de disponibilidad inventados.

## Reproducción

Con Supabase local y el build correcto sirviendo en el puerto 3000:

```powershell
node scripts/capturar-paginas-publicas.cjs
node scripts/servir-maquetas-panel.cjs
```

Abrir `http://127.0.0.1:4178/3.2/bloque4/index.html`. El capturador no modifica
usuarios ni registros. `--base` guarda las seis referencias antes del cambio.
Los manifiestos registran ruta, ancho, estado HTTP, axe, overflow, azul en
controles/títulos e imágenes rotas. Fotos y cartografía están exentas de la
restricción de azul de interfaz.

Las pruebas de composición extrema modifican solo texto del DOM del navegador:
no prueban cálculo o persistencia. Esas funciones siguen cubiertas por las suites
de presentaciones, pedido y pizarra sobre datos reales.
La comparación AST elimina clases y espacios JSX vacíos; confirma que las 18
fuentes modificadas conservan la misma estructura y contenido no visual.

Zoom CSS no equivale a zoom nativo; no se usa teclado móvil físico.
El capturador termina con código 1: sus 55 vistas normales pasan, pero la
comprobación adicional `html{zoom:2}` desborda la cabecera porque mantiene el
breakpoint de escritorio. El diagnóstico a 720 px efectivos no desborda.
Conservar este resultado adverso no acredita zoom nativo; verificarlo en T7.
Los errores de servidor y el streaming no se inducen mediante rutas productivas
artificiales; sus límites y mensajes se conservan por inspección. T7 mantiene el
cierre transversal y rendimiento comparativo. Resultados de este bloque en
`../../../Verificacion rediseño 03.2 - Bloque 4.md`.
