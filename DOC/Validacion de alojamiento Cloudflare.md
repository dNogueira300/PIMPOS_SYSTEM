# Validación de alojamiento Cloudflare

Consultas: 09–10/10/2026, America/Lima. Conclusión de evaluación: 10/10/2026.
Base de la aplicación: `main`, commit `2e7cfa803580135e52677e3edeae1011caf44baf`, después de PR #94.

## Alcance y estado

Evaluar Cloudflare Workers para el sitio público y el panel existentes, preservando toda
funcionalidad. Esta evaluación no cambia producción, DNS, datos del negocio ni el dominio.
La prueba aislada de PDF y Excel funciona en el runtime local y en Cloudflare, con ajustes de
empaquetado. Las seis exportaciones medidas exceden el límite publicado de CPU de Free;
**no se recomienda Free para la arquitectura actual**. El empaquetado completo pasa en
Ubuntu, pero el login falla tanto con Next 16.3.4 como con la comparación 16.3.8.
**Evaluación cerrada con resultado negativo: no migrar el sistema actual a Cloudflare.**
Workers Paid tampoco queda aprobado por estas pruebas. PR #95 permanece en borrador;
no hay compra, contratación, fusión ni cambio de producción.

Se usa una copia de los archivos versionados, con sus propias dependencias, en
`.superpowers/validacion-cloudflare/app`. Esta carpeta está ignorada por Git. Los registros de
instalación y compilación quedan en `.superpowers/validacion-cloudflare/`, no en el repositorio.
No se copiaron variables de producción. Las comprobaciones de exportación usan datos ficticios.

## Cuenta y dominio: verificados mediante la sesión autenticada

El panel de Cloudflare muestra Workers **Free** como plan actual: 100,000 peticiones diarias y
10 ms de CPU por petición. En la consulta inicial no había aplicaciones ni consumo.
Después de que Dan inició sesión manualmente con `npx wrangler login`, se publicó solamente
la sonda `pimpos-validacion-exportaciones`. Al finalizar la medición se comprobó otra vez
que **Gratuito** seguía siendo el plan actual. No se activó una suscripción de pago.

Cloudflare Registrar muestra **panaderiapimpos.com disponible**, con registro de **US$10.46**
y renovación de **US$10.46 por año**. Es el resultado de una consulta, no una reserva ni compra;
precio y disponibilidad pueden cambiar. No se avanzó al pago ni se completaron contactos WHOIS.
La captura local de la consulta queda fuera de Git porque incluye la cabecera de la cuenta.

## Condiciones y presupuesto

Vercel Hobby se limita al uso personal no comercial según su
[documentación oficial](https://vercel.com/docs/plans/hobby).
En las restricciones y condiciones gratuitas del
[acuerdo de Cloudflare](https://www.cloudflare.com/terms/) no se identificó una prohibición
general equivalente. Esta es una lectura de las condiciones revisadas, no una confirmación
individual del proveedor. La tarjeta del panel describe Free como orientado al uso personal y
aplicaciones sencillas; esa descripción tampoco demuestra compatibilidad técnica ni constituye
por sí sola una garantía de alojamiento gratuito para Pimpo's.

Workers Free tiene los límites anteriores; Workers Paid parte de **US$5 mensuales**, con
consumo adicional según la [tarifa oficial](https://developers.cloudflare.com/workers/platform/pricing/).
La espera por la base de datos no equivale a CPU: hay que medir las peticiones ejecutadas, sobre
todo la generación de archivos. La medición remota de esta evaluación registra 36–152 ms por
Excel y 318–964 ms por PDF de 70 filas: ambos exceden el límite gratuito publicado.

La optimización de imágenes puede conservar Supabase Storage como origen. Cloudflare Images
incluye **5,000 transformaciones únicas mensuales** en Free; al agotarlas, las nuevas
transformaciones fallan y las existentes en caché siguen sirviéndose. No se factura un exceso
automático en Free. Véase [Cloudflare Images](https://developers.cloudflare.com/images/pricing/).
Una transformación distinta de tamaño cuenta por separado. Este presupuesto es independiente
del de Workers.

## Compatibilidad que hay que demostrar

| Área                | Evidencia actual                                                                                                                                                     | Criterio de aceptación                                                                                                             |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| Versión de Next.js  | Sistema: 16.3.4. OpenNext 1.20.10 admite Next 15 desde 15.5.27 y Next desde 16.3.8. Comparación aislada: 16.3.8.                                                     | Compilar y ejecutar sin cambiar comportamiento.                                                                                    |
| Sesión y permisos   | `src/proxy.ts` utiliza el proxy Node de Next 16. Las guías generales dicen que no está soportado, pero la versión 1.20.3 de OpenNext incorporó soporte experimental. | No quitar ni rebajar el control de sesión. Probar ingreso, roles, clave temporal y revocación con la versión instalada.            |
| PDF                 | `exportar-pdf.tsx` lee PNG y TTF desde `process.cwd()/src/recursos/compartir`.                                                                                       | Descargar PDF de clientes e insumos con el logo en cada página y sus fuentes, sin errores de archivos ni memoria.                  |
| Excel               | Generación en servidor mediante ExcelJS y Buffer.                                                                                                                    | Abrir los archivos y conservar datos numéricos, totales y formatos.                                                                |
| Compartir enlaces   | `opengraph-image.tsx` usa `next/og`, fuentes y PNG locales.                                                                                                          | Imagen de compartir válida y con identidad nueva en el runtime destino.                                                            |
| Contenido publicado | `cacheComponents: true`, `use cache` e invalidación por etiquetas.                                                                                                   | Una publicación desde el panel actualiza la web sin volver a desplegar.                                                            |
| Imágenes            | `next/image`, imágenes en Supabase Storage.                                                                                                                          | Mantener tamaños, calidad y restricciones de origen mediante el adaptador.                                                         |
| Avisos diarios      | Ruta `/api/avisos/diario` protegida por `CRON_SECRET`; horario actual 12:00 UTC.                                                                                     | Cron Trigger con la misma cabecera, sin duplicar envíos; no confundirlo con los dos trabajos `pg_cron` que permanecen en Supabase. |

La [guía oficial de OpenNext](https://developers.cloudflare.com/workers/framework-guides/web-apps/opennext/)
confirma soporte general para rutas, Server Actions e ISR, pero advierte de Node middleware.
Sin embargo, las [notas de OpenNext 1.20.3](https://github.com/opennextjs/opennextjs-cloudflare/releases/tag/@opennextjs%2Fcloudflare@1.20.3)
registran soporte experimental de `proxy.ts` desde el 26/08/2026, con `nodejs_compat`.
Esta discrepancia documental no se debe confundir con un fallo observado del sistema: exige
contrastar la versión instalada con el proyecto real antes de aprobar o descartar el adaptador.
El [sistema de archivos de Workers](https://developers.cloudflare.com/workers/runtime-apis/nodejs/fs/)
es virtual: `/bundle` contiene módulos incorporados al Worker y `/tmp` es temporal por petición.
No basta con trasladar las rutas de archivos de Vercel y suponer que siguen existiendo.

La [configuración de caché de OpenNext](https://opennext.js.org/cloudflare/caching) separa caché
incremental, cola de revalidación e invalidación por etiquetas. Para sitios pequeños propone
R2, Durable Objects y D1. Son recursos que deben configurarse y probarse; una compilación sin
ellos no certifica que las novedades o el catálogo se actualicen correctamente.
No se ha habilitado R2 ni se ha aceptado facturación para esta prueba.

## Prueba local reproducible

Entorno: Windows, Node 24.13.0, pnpm 12.3.4.
Versiones objetivo: Next 16.3.8, `@opennextjs/cloudflare` 1.20.10, Wrangler 4.149.0,
`rclone.js` 0.6.6. Son herramientas de validación; el manifiesto de la aplicación se mantiene
con Next 16.3.4.

En la copia aislada se añadieron `open-next.config.ts` y `wrangler.jsonc`, con fecha de
compatibilidad `2026-10-09`, `nodejs_compat`, enlace de assets y autorreferencia al Worker local.
No contienen claves de producción ni una configuración de dominio.

Incidencias de preparación: pnpm detectó inicialmente el workspace antecesor. Se añadió una
configuración propia y se verificó que `pnpm root -w` apuntase a la copia aislada. Un intento
con `--ignore-workspace` omitió la política local de scripts y terminó con
`ERR_PNPM_IGNORED_BUILDS` por `unrs-resolver`; se continuó usando el workspace propio, con las
exclusiones originales de scripts. Estas incidencias no son fallos del runtime Cloudflare.

### Resultados medidos

| Comprobación                               | Resultado                                                                                                                | Límite de la evidencia                                                                                                                                                                    |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Compilación Next 16.3.8                    | Compilación, TypeScript y generación de 113 páginas aprobadas.                                                           | No equivale a ejecutar la aplicación completa en Workers.                                                                                                                                 |
| Referencia de exportación en Node          | 9 pruebas aprobadas en 2 archivos: marca PDF y Excel.                                                                    | Es la referencia Node, no la prueba del runtime destino.                                                                                                                                  |
| Empaquetado OpenNext estándar en Windows   | Fallo `EPERM` al crear enlaces de dependencias.                                                                          | El adaptador advierte que Windows no tiene soporte completo; repetir en Linux/CI antes de decidir compatibilidad.                                                                         |
| Instrumentación Windows con copias físicas | Superó el proxy y llegó al servidor; falló al resolver dependencias de Next y React PDF.                                 | Se sustituyeron 168 enlaces por copias dentro de la carpeta privada. No es un empaquetado oficial aprobado.                                                                               |
| Excel en workerd                           | HTTP 200, archivo XLSX de aproximadamente 7.9 KB, con 70 filas ficticias.                                                | Se abrió con ExcelJS y se comprobaron primera/última fila, valor numérico y total de 2555. No se certificó CPU remoto.                                                                    |
| PDF en workerd                             | HTTP 200 tras incluir recursos y resolver el empaquetado de fuentes/Wasm: 411,234 bytes, 3 páginas y 70 filas ficticias. | Se verificaron datos y total; logo y Jakarta en todas las páginas. Inspección visual de las tres páginas sin cortes ni superposiciones. No certifica todas las descargas ni sus permisos. |
| PDFKit 0.20.1                              | La sonda requiere empaquetar explícitamente sus fuentes estándar, cargadas mediante `createRequire`.                     | Una sonda configurada con condiciones de navegador produjo antes `Invalid URL`; ese error no demuestra incompatibilidad de la variante Node.                                              |
| Yoga 3.2.1, motor de maquetación PDF       | La compilación dinámica falla; la sonda funciona incorporando el mismo Wasm, 70.05 KiB, como `CompiledWasm`.             | El puente usa `instantiateWasm` del cargador existente y conserva el motor; todavía debe integrarse y verificarse dentro de OpenNext.                                                     |

La restricción de Wasm observada es coherente con el
[modelo de WebAssembly de Workers](https://developers.cloudflare.com/workers/runtime-apis/webassembly/).
No es un defecto del PDF actual en Node ni se resuelve contratando Workers Paid.
La prueba positiva utiliza la variante Node de las dependencias, incorpora PNG/TTF como
módulos `Data`, convierte las importaciones de fuentes estándar de PDFKit en importaciones
estáticas y carga el Wasm original de Yoga como `CompiledWasm`. No reemplaza el generador.
El ajuste pertenece al empaquetado del destino; no autoriza cambiar columnas, diseño, fuentes,
logo, cálculos, permisos ni registro de descargas.

Las sondas no acceden a Supabase y sus rutas no se añadieron al sistema. La primera prueba
usó los puertos locales 8788/8789. Las respuestas con pila eran diagnósticas y se eliminaron
antes del despliegue remoto. Los tiempos de pared de Wrangler no representan CPU; el
resultado remoto usa los campos `cpuTime` y `wallTime` proporcionados por Cloudflare.

Registros locales: `build-opennext-copias.log`, `build-opennext-resolver.log`,
`exports-node-hilo.log`, `verificacion-excel-runtime.log`, `exportaciones-node-5.log`,
`exportaciones-con-recursos.log`, `exportaciones-fuentes-estaticas.log`,
`exportaciones-wasm-precompilado.log` y `verificacion-pdf-runtime.log` dentro de la carpeta
privada de validación. El XLSX contiene exclusivamente los datos ficticios descritos arriba.
El PDF y los tres PNG de inspección también son ficticios y quedan en esa carpeta ignorada.

El intento adicional de resolver las dependencias desde su grafo pnpm original llegó al
empaquetado del servidor y mostró errores con binarios nativos `.node` de Sharp. Se detuvo
esa instrumentación y se restauró el adaptador privado a su versión original. No se utiliza
este resultado para afirmar que el empaquetado oficial en Linux falla: el resolvedor de
diagnóstico también puede introducir rutas que el adaptador normalmente modifica.
El empaquetado completo no está aprobado; el siguiente ensayo debe hacerse sin ese
resolvedor en Linux/CI. Los procesos temporales de compilación y de la sonda se cerraron;
se conservaron los registros y los archivos. No se cambiaron las dependencias versionadas.

### Medición remota: completada para la sonda de exportaciones

La revisión automática rechazó inicialmente iniciar OAuth sin autorización explícita.
Dan realizó el ingreso de Wrangler manualmente y pidió volver a intentar. Se verificaron
la sesión y los permisos disponibles; no se pidieron ni compartieron contraseñas o tokens.

Worker separado:
[pimpos-validacion-exportaciones](https://pimpos-validacion-exportaciones.danielnogueira04999-003.workers.dev/).
Versión: `ba27b534-4df7-4970-a203-30db95eee6d1`. Código minificado y sin sourcemaps, sin
bindings, secretos, variables, rutas de dominio propio ni conexión de producción. Recursos
adicionales: logo, Jakarta y Wasm original de Yoga. Tamaño de subida: 3048.04 KiB;
comprimido: 1010.60 KiB. Arranque informado por el despliegue: 11 ms; **no es la CPU de
cada petición**.

Se hicieron tres vueltas consecutivas, cada una con `/`, `/excel` y `/pdf`, sin carga
concurrente. Las nueve respuestas dieron HTTP 200 y los nueve eventos registraron `ok`
y cero excepciones. CPU y pared, en milisegundos:

| Ruta     | Vuelta 1: CPU / pared | Vuelta 2: CPU / pared | Vuelta 3: CPU / pared | Exportaciones sobre 10 ms                               |
| -------- | --------------------- | --------------------- | --------------------- | ------------------------------------------------------- |
| `/`      | 0 / 0                 | 0 / 0                 | 0 / 3                 | No aplica: respuesta JSON ficticia, no la portada real. |
| `/excel` | 152 / 160             | 38 / 39               | 36 / 38               | 3 de 3                                                  |
| `/pdf`   | 964 / 1007            | 318 / 336             | 340 / 363             | 3 de 3                                                  |

El `0` es la resolución de la métrica reportada, no una garantía de CPU nula. Las vueltas
2 y 3 también exceden el límite: el resultado no se explica solamente por la primera
generación. Los XLSX remotos se abrieron y comprobaron las 70 filas, cantidades, importes
numéricos y total de 2555 en los tres archivos. El primer PDF remoto se verificó y renderizó:
70 filas, tres páginas, total correcto, logo y Jakarta en todas las páginas, sin defectos
visuales observados.

Estas nueve solicitudes no certifican concurrencia, todas las clases de reporte, memoria,
sesión, permisos, OpenGraph ni caché de la aplicación completa. Tampoco demuestra que Free
vaya a terminar siempre las peticiones que superan 10 ms: **las pruebas sí respondieron**.
Lo que demuestra es que la carga medida excede el presupuesto publicado, por lo que no
se debe aprobar producción en Free basándose en esas respuestas exitosas.

Evidencia versionable sin cabeceras, IP, datos de cuenta ni credenciales:
[`cpu-exportaciones.json`](<Evidencias Cloudflare/cpu-exportaciones.json>).
Registros completos y archivos ficticios permanecen en la carpeta privada ignorada:
`despliegue-remoto.log`, `eventos-remotos.jsonl`, `resultados-remotos.json`,
`resumen-cpu-remota.log`, `verificacion-excel-remoto.log` y `verificacion-pdf-remoto.log`.
El observador temporal de logs se cerró después de guardar los nueve eventos.
La sonda sigue desplegada en Free para revisar la evidencia; no es el sitio de Pimpo's.

## Puerta de decisión

**Resultado de presupuesto: no recomendar Workers Free para el sistema completo actual.**
Las exportaciones reales con datos ficticios exceden su límite publicado en las seis
mediciones, conservando sus funciones. No quitar ni trasladar descargas automáticamente
para forzar la gratuidad.

El empaquetado oficial en Linux/CI ya está aprobado; la aplicación sigue bloqueada en
el login, también con una versión de Next admitida por el adaptador. **No continuar hacia
producción ni contratar Workers Paid para resolverlo:** pagar no corrige una incompatibilidad
del adaptador. Reabrir esta opción exigiría resolver el fallo y ejecutar los 710 casos,
validar el entorno remoto, todas las descargas y el presupuesto de recursos asociados.
No quitar Proxy, PPR, permisos ni funciones para forzar el alojamiento.
El siguiente candidato gratuito es Netlify, todavía sin prueba de Pimpo's. El dominio
puede registrarse independientemente del hosting; su compra permanece pendiente.

## Continuación autorizada: Linux/CI

Dan autorizó preparar y ejecutar la validación en GitHub Actions. La rama incorpora
`.github/workflows/cloudflare-validacion.yml` y `scripts/cloudflare/`: copia aislada,
dependencias congeladas con Next **16.3.4**, OpenNext **1.20.10** y Wrangler **4.149.0**.
El código de `src`, el manifiesto raíz, las funciones y el despliegue actual no cambian.
Supabase se inicia únicamente en el runner y sus variables se obtienen del CLI local;
R2/D1/Images se emulan sin crear recursos en la cuenta de Cloudflare.

El empaquetado usa el adaptador oficial sin los parches de diagnóstico de Windows.
Playwright apunta a OpenNext preview en workerd, con los dos tamaños y todos los
archivos E2E existentes, sin filtros y sin reutilizar un servidor externo. Los informes
deben conciliar aprobados, fallos y omisiones. Compilar no certifica esos flujos.

Preparación verificada: seis pruebas Node de aislamiento aprobadas, incluidos el rechazo
de configuración y destino enlazados. Revisión independiente: dos importantes corregidos
(PostCSS y enlaces en entradas explícitas), comprobados con pruebas que fallaron antes.
Menores aplazados: el filtro de push no incluye cambios exclusivos de public/PostCSS/
tsconfig (repetir manualmente); el fixture de node_modules no contiene un centinela.

### Resultado real en Ubuntu: empaquetado aprobado, compatibilidad bloqueada

Ejecutado el **10/10/2026**, contra la aplicación de `main` `2e7cfa8`, con Next
16.3.4, OpenNext 1.20.10, su adaptador AWS 4.1.9 y Wrangler 4.149.0. Los **349 archivos
de src** copiados coinciden por SHA-256 con el código actual: cero diferencias.

| Ejecución                                                                             | Commit                                     | Resultado                                                                                                                         |
| ------------------------------------------------------------------------------------- | ------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| [Primera](https://github.com/dNogueira300/PIMPOS_SYSTEM/actions/runs/38026557814)     | `e1ac911f50cbd92e669fbf4f02a03985979fc96c` | Preparación, instalación, Supabase y empaquetado aprobados. Cancelada al repetirse el error del login; no hay informe JSON final. |
| [Diagnóstico](https://github.com/dNogueira300/PIMPOS_SYSTEM/actions/runs/38027301473) | `5adf2d95061955d8af19f8439c2caaf2a3281787` | Las mismas etapas aprobadas; E2E fallida. Informe, capturas y trazas guardados; Supabase temporal detenido correctamente.         |

La segunda ejecución activa el diagnóstico nativo de OpenNext y detiene Playwright
tras cinco fallos. Conserva los 710 casos existentes, sin filtros ni cambios de tests:
**17 aprobados, 5 fallidos y 688 sin ejecutar**. De los cinco fallos, uno es axe sobre
la pantalla de error de `/ingresar` y cuatro son timeouts esperando el formulario
(validación vacía, credenciales incorrectas, superadmin y repartidor). El JSON agrupa
los 688 pendientes bajo `skipped`, pero sus arrays de resultados están vacíos:
**no son omisiones deliberadas por pantalla ni pruebas aprobadas**. La parada aparece
también como error general de Playwright; es el límite de fallos, no un sexto caso.
Escritorio y los demás flujos administrativos, invalidación, cron, imágenes y descargas
de la aplicación completa quedaron sin certificar.

Síntoma reproducido: el acceso directo a `/ingresar` responde HTTP 200, pero el
navegador termina en la pantalla global de error del servidor: digest `241716660`
en el primer build y `2811352710` en el segundo.
La traza registra React 419/441 y datos de la portada pública en la continuación
RSC de esa respuesta. Los logs de OpenNext resuelven correctamente `/ingresar`
antes del render. En el segundo ensayo, el caso de redirección anónima a
`/ingresar?volver=%2Fadmin` sí pasa. Esto acota la investigación al render/resume
de la ruta sin parámetros; **no demuestra todavía la causa exacta ni que añadir
un parámetro arregle el sistema**. No se modifica el login para ocultar el fallo.

Además, el manifiesto instalado del adaptador declara el peer de Next
`>=15.5.27 <16 || >=16.3.8`; la aplicación actual está en 16.3.4. También avisa
que Node Proxy es experimental. Estos son límites de soporte y candidatos de
diagnóstico, no una atribución confirmada del error. El siguiente ensayo controlado
puede comparar una copia con una versión admitida de Next, repitiendo login/resume
y después la suite; requiere su propio lock y evidencia. No se ha actualizado
Next de producción, desactivado Cache Components ni eliminado Proxy o permisos.

**Decisión: no aprobar todavía Cloudflare para el sistema completo.** Linux elimina
el bloqueo de empaquetado observado en Windows, pero descubre un bloqueo funcional.
Pagar Workers no resuelve esta incompatibilidad. La conclusión previa sobre los
10 ms de Free permanece separada y vigente.

Resumen sanitizado y versionado: [`linux-ci.json`](<Evidencias Cloudflare/linux-ci.json>).
Los artefactos de GitHub se conservan siete días; los dos ensayos se descargaron a
`.superpowers/validacion-cloudflare-ci/evidencia-linux-1` y `evidencia-linux-2`,
ignorados por Git. El segundo contiene `playwright-report/`, JSON, capturas y trazas.
No se versionan logs de diagnóstico completos ni credenciales locales.

Decisiones de revisión: la compatibilidad se juzga con ejecución real; los casos no
ejecutados no cuentan como cobertura; la CPU remota y cualquier contratación quedan
fuera del CI local; se conserva el historial separado de la sonda. El límite de cinco
fallos permite obtener informes ante el bloqueo; una futura aprobación exige ejecutar
los casos restantes. Si se omiten estas distinciones, se podría aprobar una migración
sin verificar sesión ni presupuesto. Los dos menores anteriores siguen aplazados.

Plan y criterios: [`Plan de validacion Cloudflare Linux CI.md`](<Plan de validacion Cloudflare Linux CI.md>).

### Comparación final: Next 16.3.8 reproduce el bloqueo

Dan autorizó continuar antes de fusionar PR #95. La comparación cambia exclusivamente
`next` y `eslint-config-next` de 16.3.4 a 16.3.8 en el manifiesto y lock de validación.
El preparador rechaza cualquier otro cambio de versión y guarda las dos diferencias
en `versiones.json`. Producción conserva Next 16.3.4, Cache Components y Proxy.

[Ejecución de comparación](https://github.com/dNogueira300/PIMPOS_SYSTEM/actions/runs/38058759716),
commit `58daf1a16f0e8ce4862eb709f46c17f6c80c6302`, Ubuntu, OpenNext 1.20.10,
Wrangler 4.149.0, mismo código de aplicación. Preparación, instalación congelada,
Supabase temporal, Chromium, build oficial, artefactos y limpieza pasan. Las nueve
pruebas de aislamiento pasan; los 349 archivos src siguen idénticos por SHA-256.

Playwright registra **17 aprobados, 5 fallidos y 688 sin ejecutar**, cero reintentos.
Los cinco casos fallidos son los mismos de la ejecución anterior: axe en el login
y formulario vacío, credenciales incorrectas, superadmin y repartidor. La pantalla
global muestra digest `1840303558`; la traza conserva errores React 419/441.
El formulario puede aparecer inicialmente y después quedar sustituido por el error;
esto no equivale a una autenticación funcional. La parada de cinco fallos impide
certificar escritorio y el resto de los flujos. Los pendientes no cuentan como cobertura.

**Resultado de la hipótesis:** actualizar a la versión admitida no elimina el fallo;
el desfase de versión no es una explicación suficiente. La causa interna precisa
del render/resume continúa sin confirmar. No se atribuye el fallo a Proxy solamente
por su aviso experimental ni se concluye que Cloudflare nunca pueda soportar Next.

Evidencia sanitizada: [`linux-ci-next-16.3.8.json`](<Evidencias Cloudflare/linux-ci-next-16.3.8.json>).
Artefacto original descargado a `evidencia-linux-3`, ignorado, además de las dos
ejecuciones anteriores. Las evidencias históricas no se sustituyen.

## Conclusión de alojamiento y siguiente paso

**Descartar Cloudflare como destino del sistema actual en esta evaluación.** Hay dos
motivos independientes: Free tiene un presupuesto de CPU menor al de las exportaciones
medidas; la aplicación completa no supera el login en Workers con ninguna de las
dos versiones comparadas. Workers Paid amplía el presupuesto, pero no corrige el render.
No contratarlo ni preparar una migración basándose solamente en el build aprobado.
PR #95 queda en borrador y sin fusionar; documenta una evaluación negativa, no un despliegue.

Recomiendo **validar Netlify Free como siguiente candidato**, preservando todas las
funciones. Su [comparación oficial](https://www.netlify.com/guides/netlify-vs-vercel/)
permite explícitamente proyectos comerciales en Free. La
[documentación de Next](https://docs.netlify.com/build/frameworks/framework-setup-guides/nextjs/overview/)
declara soporte de App Router, Server Actions, PPR y Cache Components; también
documenta restricciones del middleware Node. Esto justifica probarlo, pero **no certifica
Pimpo's**. La validación aún no se ha ejecutado ni se ha creado un sitio en Netlify.

Según la [tarifa vigente](https://www.netlify.com/pricing/), Free tiene 300 créditos/mes:
15 por despliegue de producción, 10 por GB-hora de cómputo, 20 por GB transferido y
2 por 10.000 peticiones. Las previews no cobran el despliegue, pero sí su tráfico y
cómputo. Al alcanzar el límite se pausan los proyectos de la cuenta hasta la siguiente
recarga o cambio de plan; véase [cómo funcionan los créditos](https://docs.netlify.com/manage/accounts-and-billing/billing/billing-for-credit-based-plans/how-credits-work/).
No prometer alojamiento gratuito permanente sin medir tráfico, imágenes y descargas.

La siguiente tarea deberá comprobar empaquetado Linux y ejecución real del adaptador
de Netlify, login/roles/revocación, los 710 casos conciliados, publicación/caché,
imágenes/OpenGraph, cron y cada clase de PDF/Excel con datos ficticios. Después se
requiere preview aislada y medición de consumo mensual estimado, antes de elegir
hosting o conectar producción. No modificar funciones ni usar la base del negocio
para obtener un resultado favorable. Cloudflare Registrar sigue siendo una opción
de dominio independiente; todavía no hay compra, cambio DNS ni nueva contratación.

La comparación de versión y su guard exacto tienen revisión independiente sin hallazgos.
Decisión de ejecución: se cierra la evaluación negativa con evidencia, sin perseguir
parches de arquitectura para forzar Workers. Coste de mezclar versiones o de aprobar
desde el build: recomendar una migración que no conserva una sesión funcional.
Los dos menores del arnés anotados arriba permanecen aplazados.
