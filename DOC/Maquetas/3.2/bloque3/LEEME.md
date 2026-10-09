# Evidencia del bloque 3

Implementación de T4.1 (dashboard de Inicio) y T5 (estructura pública/portada),
desde `429a25d`, después de la aprobación «perfecto, dale palante» del 08/10/2026.
La galería compara el resultado con el dashboard aprobado y con A/a6.
No cambia consultas, permisos, operaciones ni temporización del carrusel.
Las páginas internas del sitio público corresponden a T6, todavía pendiente.

`manifest.json` relaciona 19 capturas con ruta, rol, ancho, avisos, destinos,
actividad, axe, desbordamiento, colores de interfaz y áreas táctiles.
También se guardan dos capturas de foco de teclado, viewports móviles y madrugada a 390/1440 para inspeccionar
elementos fijos y el bloque sin horno. Los datos son locales; las cantidades y
frases de auditoría no tienen que coincidir con la maqueta.

## Reproducción

Con Supabase local disponible y un build que sirva en el puerto 3000:

```powershell
node scripts/ejecutar-con-supabase-local.cjs node_modules/next/dist/bin/next build
node scripts/ejecutar-con-supabase-local.cjs node_modules/next/dist/bin/next start --hostname 127.0.0.1
```

En otra terminal, sin suites E2E modificando los fixtures simultáneamente:

```powershell
node scripts/ejecutar-con-supabase-local.cjs scripts/capturar-dashboard-portada.cjs
node scripts/servir-maquetas-panel.cjs
```

Abrir `http://127.0.0.1:4178/3.2/bloque3/index.html`.
El capturador rechaza una API externa y elimina sus tres cuentas temporales
en `finally`; la limpieza queda registrada. No crea registros comerciales.
El reloj fijado pertenece únicamente al navegador de evidencia.

En este checkout Windows se utiliza una junction de dependencias y una raíz
temporal de Turbopack para compilar. `next.config.ts` se restaura al terminar;
un checkout con dependencias propias no necesita ese ajuste.

## Límites

Las métricas automáticas complementan la revisión visual. Las fotografías
pueden conservar azul: la restricción se aplica a la interfaz.
El zoom CSS al 200 % no equivale a zoom nativo. No se ha usado teclado móvil
físico ni se ha verificado esta entrega en producción. La revisión de Vercel
queda para la vista previa del PR. Resultados completos en
`../../../Verificacion rediseño 03.2 - Bloque 3.md` y salidas en `pruebas/`.
