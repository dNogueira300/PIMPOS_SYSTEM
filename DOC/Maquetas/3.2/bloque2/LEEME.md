# Evidencia del bloque 2

La galería `index.html` compara las capturas del build real con la maqueta A aprobada
y con la base `c1f9582`. El inventario identifica 58 páginas; los manifiestos relacionan
cada captura con su ruta, rol, ancho, controles, imágenes, geometría y resultado de axe.

`base/` contiene 18 capturas seleccionadas de la ejecución inicial autenticada.
Su manifiesto original registra 28 capturas y la limpieza de sus tres cuentas; las otras
diez no se duplican aquí. A permanece en `../../comparacion-redisenio/pantallas/`.
No todas las pantallas o estados tenían maqueta propia: la galería lo indica.
Los datos locales varían después de las regresiones; la comparación es visual, no una
diferencia de píxeles con una base de datos idéntica.

## Reproducción

Desde la raíz del repositorio, con Node 24, dependencias y Supabase local disponible:

```powershell
node scripts/ejecutar-con-supabase-local.cjs node_modules/next/dist/bin/next build
node scripts/ejecutar-con-supabase-local.cjs node_modules/next/dist/bin/next start --hostname 127.0.0.1
```

En otra terminal, cuando el build ya sirve en el puerto 3000:

```powershell
node scripts/ejecutar-con-supabase-local.cjs scripts/capturar-modulos-redisenio.cjs DOC/Maquetas/3.2/bloque2/t3 --t3
node scripts/ejecutar-con-supabase-local.cjs scripts/capturar-modulos-redisenio.cjs DOC/Maquetas/3.2/bloque2/t4 --t4
```

Ejecutar por separado de las suites E2E para evitar capturar sus registros transitorios.
El runner utiliza el entorno de pruebas local y apaga el correo; no lee claves de producción.
El guion de captura rechaza una API ajena a `127.0.0.1` y elimina sus cuentas y registros
temporales al terminar. `limpieza.json` registra los recuentos reales y cualquier fallo.
No interrumpirlo durante la creación de fixtures: esperar a su limpieza.

En este checkout Windows las dependencias están enlazadas al repositorio original.
Para compilar se ajustó temporalmente la raíz de Turbopack al directorio común, restaurando
`next.config.ts` al terminar. Un checkout con instalación propia no necesita ese ajuste.

Servir `DOC/Maquetas/` con un servidor estático local y abrir `3.2/bloque2/index.html`.
El navegador debe poder cargar los manifiestos por HTTP; abrir el archivo directamente
puede bloquear `fetch`.

## Límites

Evidencia exclusivamente local; no se modifican datos del negocio ni se utiliza producción.
La auditoría local de fixtures y limpieza se conserva. Las métricas no sustituyen la revisión
visual. Los píxeles de las teselas cartográficas no forman parte del barrido de estilos CSS;
sí se revisan controles, atribución y enlaces de los mapas.

La altura reducida con foco y el aumento CSS al 200 % no son un teclado móvil físico ni
zoom nativo. Esas dos revisiones en dispositivo siguen pendientes.
