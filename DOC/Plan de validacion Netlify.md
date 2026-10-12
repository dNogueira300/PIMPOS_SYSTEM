# Plan de validación de Netlify

> Para ejecutar: `superpowers:executing-plans`, implementación en esta sesión y una revisión independiente final.

**Objetivo:** comprobar el sistema actual contra el adaptador de Netlify con Supabase local, sin cambiar ninguna función.

**Arquitectura:** copia aislada en `$RUNNER_TEMP/pimpos-validacion-netlify/app` con raíz Git propia sin remotos, fuera de los locks del checkout, sin enlaces, variables de producción ni dependencias del checkout. `netlify serve --offline` compila y sirve las funciones empaquetadas por el adaptador; no sustituirlo por `next start`. Ubuntu ejecuta la suite existente contra esa misma instancia.

**Stack:** Next 16.3.4, Node 24, pnpm 12.3.4, Netlify CLI 27.12.0, adaptador `@netlify/plugin-nextjs` 5.16.2, Supabase CLI 2.116.0 y Playwright 1.63.0.

**Especificación:** petición de Dan del 10/10/2026: «ahora sí comprobemos Netlify», seguida de «No, probar primero con Supabase local». El resultado negativo de Cloudflare permanece independiente. PR #95 sigue en borrador y no se fusiona.

## Restricciones

- No modificar `src`, `public`, los E2E existentes, las dependencias raíz, Proxy, PPR, permisos ni configuración de producción.
- No crear sitio remoto, comprar, cambiar DNS, contratar ni conectar Supabase del negocio en esta etapa local.
- Mantener versiones y resolución de las 40 dependencias directas de la aplicación. Solo el adaptador se añade a la copia; el CLI tiene otro directorio y lock para no cambiar los peers de Next.
- Ejecutar el runtime solo en Linux/CI limpio: rechazar perfiles modernos y heredados del CLI antes de iniciarlo. No reutilizar ni alterar la sesión guardada en Windows.
- Supabase solo acepta `http://127.0.0.1:54321`; correo apagado, secretos heredados eliminados y sin comandos de despliegue.
- Conservar trazas y fallos. Detener tras cinco fallos para diagnóstico; lo no ejecutado no es cobertura ni omisión prevista.
- Aprobar pruebas locales no certifica Netlify remoto ni suficiencia de sus 300 créditos mensuales.

## Enfoque de revisión

Enlaces y rutas que escapen, copia accidental de secretos, instalación en el checkout con junction, dependencia diferente de producción, uso accidental de `next start`, reporte que oculte casos sin ejecutar y confusión entre emulador y servicio remoto.

## T1: preparar la validación aislada

Archivos: `scripts/netlify/preparar.mjs`, `aislamiento.test.mjs`, `ejecutar.mjs`, `playwright.config.template`, `netlify.template.toml`, `dependencias/` y `cli/`.

- [x] Añadir pruebas Node que rechacen URL alojada, claves incompletas, enlaces, versiones distintas y copia de `.env`/dependencias; comprobar fuente y PostCSS idénticos.
- [x] Ejecutar `node --test scripts/netlify/aislamiento.test.mjs` antes de implementar y conservar el fallo.
- [x] Implementar `prepararCopia(repo, {soloCodigo})`, `entornoLocal(status)` y `entornoSeguro(heredado, locales)` con las guardas anteriores. La copia no sobrescribe una ejecución existente.
- [x] Copiar manifiesto/lock/workspace raíz a `scripts/netlify/dependencias`; añadir solo el adaptador fijado y regenerar allí el lock. Congelar CLI separado en `scripts/netlify/cli`. Comparar manifiesto y resoluciones con la raíz antes de copiar.
- [x] Ejecutar las pruebas de aislamiento, formato y ESLint; comprobar que la raíz sigue intacta. Guardar hashes SHA-256 de `src` y versiones de la copia.

## T2: ejecutar el adaptador y los flujos en Linux

Archivos: `.github/workflows/netlify-validacion.yml` y documentación de resultado.

- [x] Workflow por push limitado a las rutas Netlify de la rama del PR, y manual tras su primer registro: Ubuntu, Node/pnpm fijados, dependencias app/CLI congeladas por separado, Supabase temporal y Chromium.
- [x] Playwright inicia `node scripts/netlify/ejecutar.mjs serve`: ejecuta únicamente `node ../cli/node_modules/netlify-cli/bin/run.js serve --offline --port 3000 --context production`, sin perfil ni sitio enlazado en CI. El CLI realiza el build y sirve funciones/edge/caché locales.
- [x] Ejecutar los mismos casos móvil/escritorio, sin retirar casos ni cambiar aserciones. La lista inicial debe conciliar los 710 casos existentes.
- [x] Subir solo hashes, versiones, logs e informes/trazas; nunca `.env`, `.netlify` o dependencias. Apagar Supabase temporal incluso ante error.
- [x] Revisión independiente del delta de esta validación, un pase de correcciones materiales y commit/push: el push inicial registra e inicia el workflow sin fusionar. En repeticiones manuales usar `gh workflow run netlify-validacion.yml --ref feat/validacion-cloudflare`.
- [x] Descargar artefactos, registrar SHA/URL/etapas/conteos reales y emitir una conclusión limitada a lo demostrado. Si el emulador no representa una función remota, declararlo.

## T3: decidir la siguiente comprobación

- [x] Actualizar `DOC/Validacion de alojamiento Netlify.md`, `AGENTS.md`, avance y PR #95 con resultados y límites.
- [x] Conciliar funcionalidades: login/roles/revocación/inactividad, publicación/revalidación, imágenes y OpenGraph, clientes/insumos/auditoría, PDF/Excel y cron.
- [x] Separar tareas todavía necesarias para migrar: prueba remota con base de pruebas separada, consumo real y mecanismos de cron. Una base local no es accesible desde las funciones remotas; no reemplazarla por la base del negocio.

Referencias: [adaptador Next](https://docs.netlify.com/build/frameworks/framework-setup-guides/nextjs/overview/), [serve](https://cli.netlify.com/commands/serve/), [tarifas](https://www.netlify.com/pricing/).

## Cierre de la etapa local, 12/10/2026

Plan ejecutado, no aprobación del alojamiento. CI 38255212161 compila y empieza
la suite: cero aprobados, cinco fallidos por timeout y 705 sin ejecutar. Traza
contacto: HTTP 200, header gzip y ERR_CONTENT_DECODING_FAILED. Nueve guardas
aprobadas, 349 hashes iguales, 40 resoluciones directas conservadas. La revisión
independiente verifica el conteo y descarta `dev.publish` sin efecto; no se cambió
la aplicación para sortear el error. Ver la conciliación de capacidades y los
límites en `DOC/Validacion de alojamiento Netlify.md`.

El siguiente hito requiere Supabase de pruebas alojado y una vista previa remota;
no forma parte de la autorización «primero Supabase local». PR #95 continúa en
borrador y no hay proveedor nuevo aprobado ni cambios de producción.
