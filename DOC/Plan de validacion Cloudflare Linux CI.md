# Validación de Cloudflare en Linux/CI

Autorizada por Dan el 09/10/2026. Ejecutar en `feat/validacion-cloudflare`.
Especificación: probar la aplicación completa conservando funciones y versiones
de producción, sin desplegar, comprar, activar servicios remotos ni usar la base alojada.

Continuación autorizada por Dan el 10/10/2026, antes de fusionar PR #95: obtener una
conclusión de alojamiento. Comparar la copia con Next y eslint-config-next 16.3.8,
únicas variaciones frente a 16.3.4, registradas en `versiones.json`. La aplicación de
producción sigue intacta. Hipótesis: el límite de soporte declarado por OpenNext
puede explicar el bloqueo del login; si se reproduce con 16.3.8, se descarta como
explicación suficiente. No sustituir esta comparación por retirar Proxy o PPR.
Si pasa el login, continuar los 710 casos; si falla, conservar diagnóstico y decidir
la adecuación de Cloudflare con ese resultado y las mediciones de CPU ya existentes.

1. Preparar una copia aislada del código y un entorno de dependencias congeladas:
   las versiones actuales de la aplicación más OpenNext 1.20.10 y Wrangler 4.149.0.
   Validar que no se copian `.env`, enlaces o dependencias locales y que el destino
   permanece dentro de la carpeta ignorada `.superpowers/validacion-cloudflare-ci`.
   Pruebas de aislamiento: Node test runner, primero fallo, después aprobación.
2. Añadir un workflow de Ubuntu activado por push a la rama de validación y manualmente.
   Supabase temporal, sin secretos de GitHub; empaquetado oficial sin los parches
   diagnósticos de Windows. R2/D1/Images se emulan localmente para caché e imágenes.
   Toda operación de Wrangler se restringe a local; no hay comando de despliegue.
3. Ejecutar los flujos existentes con Playwright contra OpenNext/Workers, en móvil
   y escritorio. Incluir autenticación, revocación/inactividad, publicación/caché,
   imágenes/OpenGraph, módulos administrativos, descargas y cron. Guardar informes
   y capturas; no confundir compilación aprobada con regresión funcional aprobada.
4. Revisar la rama con un revisor independiente, corregir problemas materiales y
   ejecutar en GitHub. Registrar URL, SHA y resultado real de cada etapa. Si existe
   incompatibilidad del adaptador, documentarla: no retirar controles ni cambiar
   funciones para que la prueba pase.

Interfaz: el preparador entrega la copia a `.superpowers/validacion-cloudflare-ci/app`;
el ejecutor y Playwright usan ese mismo directorio y el mismo build. Las pruebas
leen únicamente el Supabase local iniciado por el runner. Ninguna clave de producción
se acepta como sustituto. El CI actual y el despliegue Vercel conservan su configuración.

Enfoque de revisión: rutas/enlaces que escapen del directorio, copia accidental de
secretos, URLs de producción, credenciales heredadas por Wrangler, falsa aprobación
por usar `next start`, pruebas omitidas, conservación de las versiones y del código
de la aplicación, recursos remotos creados por accidente y artefactos sensibles.

Completar Linux/CI no elimina el presupuesto de CPU de Free ya excedido en las
exportaciones ni certifica el entorno remoto. La migración requiere una decisión
de alojamiento y una revisión del despliegue completo por separado.

## Resultado de ejecución, 10/10/2026

Preparación y empaquetado oficiales aprobados en Ubuntu con Next 16.3.4 y 16.3.8.
La comparación final (run `38058759716`, SHA `58daf1a`) registra las dos diferencias
de versión autorizadas y conserva los 349 archivos src idénticos. Nueve pruebas
de aislamiento pasan. El login falla también con 16.3.8: 17 casos aprobados,
5 fallidos y 688 sin ejecutar al alcanzar `maxFailures: 5`. No se certifica el resto
de la suite; no se retiraron Proxy, PPR ni permisos. La causa interna exacta sigue abierta.

Evaluación cerrada con resultado negativo: no migrar el sistema actual a Cloudflare.
Free tampoco cumple el presupuesto medido de exportaciones. Paid no queda aprobado
por pagar ni por compilar. PR #95 sigue en borrador, sin fusionar por instrucción de Dan.
La siguiente evaluación recomendada es Netlify Free; aún no ejecutada ni aprobada.
Resultados completos y evidencias sanitizadas en `Validacion de alojamiento Cloudflare.md`.
