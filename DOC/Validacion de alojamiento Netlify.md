# Validación de alojamiento Netlify

Evaluación iniciada por Dan el 10/10/2026. CLI 27.12.0 instalado y sesión comprobada.
Dan eligió **probar primero con Supabase local**, sin proyecto de pruebas alojado.
PR #95 permanece en borrador y no se fusiona. La conclusión negativa de Cloudflare
no cambia ni se aplica automáticamente a Netlify.

## Alcance y estado

Se conserva el sistema de Next 16.3.4, todas sus funciones y dependencias raíz.
No se ha creado un sitio remoto, conectado producción, comprado dominio ni contratado.
La compatibilidad y el consumo remoto todavía no están aprobados.

El [plan](<Plan de validacion Netlify.md>) prepara una copia limpia en Ubuntu con
Supabase temporal del runner. Usa `netlify serve --offline` para **compilar y servir
funciones empaquetadas por Netlify**, sin sustituirlas por `next start`.
Las pruebas E2E existentes y sus aserciones permanecen intactas.

Preparación: nueve pruebas Node de aislamiento aprobadas. Rechazan secretos y URLs
alojadas, enlaces, sobrescritura de evidencia, manifiesto diferente, resolución de
peers distinta y perfiles modernos/heredados de Netlify. El CLI se instala en otra
carpeta con lock propio; solo el adaptador se añade a la copia de la aplicación.
Las 40 resoluciones directas originales del lock se conservaron al separar el CLI.
La comparación se vuelve a exigir en cada preparación.

El runtime se ejecuta únicamente en un runner Linux limpio: la sesión guardada de
Windows se usó para comprobar acceso al servicio, no para alimentar plugins offline.
Eliminar una variable de token no basta porque el CLI puede cargar su perfil global.
Por eso se rechaza un perfil existente antes de iniciar el adaptador.

La ejecución Linux se inició; aún no hay regresión funcional aprobada. El listado
conserva 710 casos en 54 archivos y los 349 hashes src coinciden. No declarar
aprobados esos casos por haber preparado la copia. Con cinco fallos, se conservará diagnóstico y se
contarán separadamente los casos sin ejecutar y las omisiones previstas.

## Soporte declarado y presupuesto

Netlify [documenta](https://docs.netlify.com/build/frameworks/framework-setup-guides/nextjs/overview/)
Server Actions, Proxy/middleware, streaming, PPR, Cache Components, revalidación
por etiquetas e imágenes mediante su adaptador. Es soporte declarado, no un
resultado de Pimpo's. La simulación local tampoco certifica su CDN ni caché remota.

La [comparación oficial](https://www.netlify.com/guides/netlify-vs-vercel/) permite
proyectos comerciales en Free. La [tarifa](https://www.netlify.com/pricing/) indica
300 créditos mensuales, compartidos entre cómputo, transferencia y peticiones:
10 créditos/GB-hora de cómputo, 20/GB transferido y 2/10,000 peticiones.
Cada despliegue de producción cuesta 15 créditos; vistas previas no consumen
ese cargo de despliegue, pero su tráfico sí cuenta. Esta prueba offline no mide
créditos del servicio. No prometer gratuidad suficiente sin volumen y medición real.

## Verificaciones posteriores necesarias

- Resultado Linux con SHA, URL, versión de adaptador, hashes y conteos reales.
- Si los flujos pasan, vista previa remota con Supabase de pruebas separado:
  login/roles/revocación, publicación/revalidación, imágenes/OG y todas las descargas.
- Verificar los trabajos programados existentes: Netlify no interpreta automáticamente
  `vercel.json`; probar endpoints no demuestra que un programador remoto los invoque.
- Medir consumo, límites y comportamiento de PDF/Excel en funciones remotas antes
  de decidir si Free sirve para el negocio. Dominio, DNS y migración siguen separados.

Docker local: a petición de Dan se detuvieron los cinco contenedores activos de
Sitrai y se iniciaron solo seis servicios Pimpo's (DB, Auth, REST, Storage, Kong e
Inbucket). Salud de Auth, REST y Storage respondió HTTP 200. No se borraron datos.

## Ensayos iniciales, 11–12/10/2026

- [38204213512](https://github.com/dNogueira300/PIMPOS_SYSTEM/actions/runs/38204213512), SHA 8003688: ocho guardas aprobadas, pero descripción del manifiesto mal codificada al generarlo en Windows. Se regeneró desde UTF8 sin relajar la comparación. Sin build ni E2E.
- [38204346308](https://github.com/dNogueira300/PIMPOS_SYSTEM/actions/runs/38204346308), SHA a4292ce: copia y dependencias de app aprobadas; CLI detenido por scripts opcionales no declarados en pnpm. Se negaron explícitamente autocompletado y syslog opcionales. Sin build ni E2E.
- [38204520494](https://github.com/dNogueira300/PIMPOS_SYSTEM/actions/runs/38204520494), SHA 7d6d5cc: instalaciones, Supabase, Chromium y lista de 710 aprobados; Netlify eligió base raíz Git con Next ausente allí. Se fijó la base de copia. Cero E2E ejecutados, un error general de arranque.
- [38204834594](https://github.com/dNogueira300/PIMPOS_SYSTEM/actions/runs/38204834594), SHA 3f6e100: compila y empaqueta con Runtime 5.16.2, pero login local devuelve 500 al buscar request-context.cjs bajo `/var/task/.superpowers/...`. El servidor no alcanza disponibilidad y los E2E no empiezan.

La inspección del paquete oficial 5.16.2 demuestra que su plantilla monorepo usa
la ruta Lambda absoluta cuando Next informa `relativeAppDir` no vacío. La copia
bajo el checkout hereda locks padre y se interpreta como un monorepo, distinto del
repositorio de producción que está en raíz. Próxima comparación: copia fuera del
checkout, en el temporal fijado del runner, con raíz Git propia sin hooks ni remotos
heredados y base `.`. No parchear el adaptador ni los archivos generados.

Los cuatro intentos iniciales no certifican ni descartan Netlify remoto. Evidencias
completas de intentos 3/4 descargadas fuera de Git. Los dos menores de revisión
(registro al evento exit y listado reemplazado en pruebas.log) siguen diferidos;
el listado inicial se conserva en Actions y el JSON funcional se evalúa aparte.
