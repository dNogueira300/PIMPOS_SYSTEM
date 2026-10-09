# Cierre de rediseño03.2

Galería del build real `xpunENGfsnmpnnGmpz203`: `index.html` e `inventario.json`.
70 plantillas obtenidas del código, 497 capturas registradas y ninguna ruta omitida.
Dirección A/a6 aprobada; no son nuevas maquetas ni aprobación de fusión.

`pdf/resultado/` contiene cuatro muestras ficticias con logo en cada página.
`pdf/base/` conserva su comparación anterior; `contenido-comparado.json` confirma
paridad del texto. Las seis descargas autenticadas reales se validan en memoria,
sin publicar datos de clientes del entorno. Su manifiesto está en `pdf/descargas/`.

`compartir.png` sale del generador OpenGraph del build, compartido por Twitter/X.
`novedad/` muestra un registro temporal con fotografía original de Pimpo’s.
El título de prueba y el texto no son contenido comercial aprobado. La novedad,
imagen subida, usuario y demás fixtures se retiraron/eliminaron en Supabase local.
Las capturas `novedad-movil/escritorio.png` de E2E usan una imagen sintética para
comprobar el contrato de carga y proporción; su azul no pertenece a la interfaz.

`zoom-nativo/` verifica200% de Chromium con perfiles desechables, DPR2 y CSSzoom1.
Las imágenes usan coordenadas físicas de CDP para evitar el recorte de Playwright.
El ensayo CSSzoom del catálogo, conservado por separado, sí desborda; no equivale
al zoom nativo. No se certifica teclado virtual de un teléfono físico.

`pruebas/regresion-completa.json` concilia710 casos en54 archivos:605 aprobados,
105 omisiones previstas por rol/proyecto/datos y cero faltantes o extras.
La evidencia previa en `pruebas/antes-revision/` conserva el timeout de red del mapa y su repetición, sin cambiar
código/prueba. Los logs de capturadores incluyen ensayos interrumpidos/corregidos;
los manifiestos finales y sus limpiezas son la evidencia del cierre.

`lighthouse/` conserva5 pasadas por ruta y versión en la misma sesión/puerto:
inicio85→91, catálogo89→94, contacto95→94. El rediseño cumple los mínimos originales
y la diferencia mediana≥−3. Los rangos completos evitan atribuir causalidad a una
única pasada favorable. La base exacta es `3113084`, archivada en una copia ignorada.

Los scripts `capturar-*cierre.cjs`, `verificar-*cierre.cjs`,
`verificar-cierre-redisenio.cjs` y `comparar-lighthouse-cierre.cjs` documentan el método.
Las escrituras de fixtures se limitan a Supabase local mediante
`scripts/ejecutar-con-supabase-local.cjs`; producción, correo y contenedores de Sitrai
no se tocan. La fotografía del capturador de novedad proviene de los archivos
locales originales, excluidos del repositorio. Los informes públicos no incluyen
configuración del runner ni sus claves.

La revisión final detectó una atribución de marca incorrecta en JSON-LD de bodega.
Se omite ese campo sin información acreditada; arroz y pan francés pasan su prueba.
El build posterior `vjzWHRdBhka2hk1VPHDOZ` solo cambia ese dato SEO. Las capturas,
PDF y Lighthouse anteriores siguen documentando la misma presentación visual.
El manifiesto de regresión final identifica su build por separado.
