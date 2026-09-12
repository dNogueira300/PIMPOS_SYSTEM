@AGENTS.md

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Proyecto: plataforma web + panel de gestión para **Panadería Pimpo's E.I.R.L.** (Iquitos, Perú).
Práctica preprofesional de Dan (FISI-UNAP), ventana set–nov 2026.

---

## Estado

**F0, F1 y F2 cerradas. F3 con secciones y SEO hechos** (11/09/2026). Resumen completo en
`DOC/Avance del proyecto.md` — léelo primero para ponerte al día.

| Fase             | Estado                                                                                 |
| ---------------- | -------------------------------------------------------------------------------------- |
| F0 Preparación   | ✅ 8/8 comprobaciones, verificadas en producción                                       |
| F1 Fundación     | ✅ scaffold + autenticación + sistema de diseño + tipografía                           |
| F2 Backend       | ✅ 16 migraciones, checklist de cierre del doc 02 §15 completo                         |
| F3 Sitio público | 🔄 Secciones y SEO hechos. Crítica: 24/40 → **29/40**; P0, los dos P1 y un P2 cerrados |
| F4–F7            | ⬜                                                                                     |

**La base hoy:** 27 tablas **todas con RLS** (cero sin proteger), 11 vistas **todas con
`security_invoker`**, 78 políticas, 2 trabajos de `pg_cron`, 377 pruebas pgTAP. Las 9 pruebas
obligatorias del doc 02 §11.3 pasan las 9.

**Verificación:** 371 pgTAP + 125 unitarias + 160 flujos E2E + 3 guiones que prueban lo que SQL no
puede (`verificar-fase0.sh`, `verificar-storage.sh`, `verificar-sitio-publico.sh`). Todo por PR con
CI en verde; `main` protegida. No dar nada por cerrado sin ejecutarlo.

**Los E2E corren contra el build, no contra `next dev`.** Con quince rutas y cuatro procesos en
paralelo, `next dev` compila cada ruta a demanda y las pruebas fallaban por tiempo agotado sin que
hubiera nada roto.

**Antes de levantar el servidor de pruebas, liberar el puerto 3000.** Matar la tarea de `pnpm start`
deja vivo el `next start` que cuelga de ella: el arranque siguiente muere con `EADDRINUSE` —en
segundo plano, sin que se vea— y las pruebas corren contra el build **anterior**, así que fallan o
pasan por razones que no son. Pasó dos veces. `netstat -ano | grep ":3000 " | grep LISTENING` da el
PID; se cierra ese y solo ese.

- **Las migraciones crean el esquema, no el contenido.** El primer despliegue a Vercel se cayó con
  _«all `generateStaticParams` functions must return at least one result»_, que no menciona la base.
  La causa: el proyecto alojado tenía **las 22 migraciones aplicadas y ninguna semilla**, así que
  `productos_publicos` devolvía cero filas y no había ficha que generar. Se ve en un vistazo pidiendo
  el conteo a cada vista pública con `Prefer: count=exact`; allí salía configuración 1, categorías 6
  y preguntas 5 —todo eso lo insertan migraciones— frente a productos 0, slides 0 y galería 0, que
  son de `01_maestros.sql`. **Comprobar el contenido de producción, no solo `migration list`.**
- **`supabase db push --include-seed` carga TODAS las semillas del `config.toml`**, y ahí están
  `01_maestros.sql` y `02_demo.sql`. En producción eso mete slides de ejemplo —que **sí se
  publican**: `slides_publicos` no filtra `es_demo`, a diferencia de los testimonios— y clientes
  inventados en una tabla con datos personales. A producción va **solo** `01_maestros.sql`.
- **Una lectura que devuelve `[]` cuando falla esconde la causa justo cuando más se necesita.** Las
  nueve funciones de `src/lib/datos/` hacían `if (error || !data) return []`, que está bien para la
  página —mejor una sección vacía que una página caída— pero tiraba el mensaje de PostgREST, que es
  el único que dice si falta una columna, si la RLS niega la lectura o si no hay datos. Ahora pasan
  por `avisarDeConsulta()`, que lo deja en el registro del servidor o del build. Es la misma lección
  que ya estaba escrita para los guiones de verificación.
- **`supabase db reset` puede morir por un servicio que no es la base, y dejarla vacía.** El 12/09
  falló con `LegacyDbSetupError: error running container` en «Initialising schema», antes de aplicar
  ninguna migración: la base quedó con **cero tablas** y sin `supabase_migrations.schema_migrations`.
  El culpable era `vector`, el recolector de logs, en bucle de reinicio porque no alcanzaba el socket
  de Docker (`Network unreachable`). Se sale con `supabase stop --no-backup` y
  `supabase start -x vector,edge-runtime,imgproxy,pooler` —los cuatro que este proyecto ya tenía
  parados—. Antes de culpar al SQL, `docker ps -a`: si el contenedor de la base está sano y la base
  vacía, el fallo es del arranque, no de la migración.
- **Las migraciones corren ANTES que las semillas en `db reset`.** Una migración no puede corregir ni
  retirar filas que inserte una semilla: cuando se ejecuta, esas filas todavía no existen. Lo pagó
  0023, que retiraba los slides de ejemplo y en un reset no encontraba ninguno —la prueba pgTAP lo
  cazó, porque la vista devolvía seis diapositivas en vez de tres—. Si el contenido pasa de semilla a
  migración, hay que **quitarlo de la semilla**, no taparlo desde la migración.

**Una prueba que mide algo que se deshace solo hay que medirla dentro del navegador.** El botón
flotante vuelve a los 500 ms y la prueba miraba la opacidad _después_ del gesto: unas veces llegaba
a tiempo y otras no. **`page.clock` no lo arregla** —se intentó—: el evento de scroll llega después
de adelantar el reloj, así que el `requestAnimationFrame` del manejador se queda pendiente y el
estado no cambia nunca. Lo que funciona es un `page.evaluate` que mueve la página, espera dos
fotogramas y lee el estado en el mismo turno. Y se mira el **atributo** (`aria-hidden`), que cambia
en el mismo instante, no la opacidad, que pasa por una transición de 200 ms.

`page.clock` sí es la herramienta correcta cuando lo que se congela es **el paso del tiempo como
dato** —«Abierto ahora» depende de qué hora es—, no cuando se persigue un efecto de un gesto.

**Pendiente del negocio:** crear al resto de usuarios (solo existe el superadmin), Vercel (aplazado
por decisión de Dan), el dominio, las fotos de producto y las redes sociales (Facebook e Instagram
están vacíos y el pie solo los muestra si se cargan). Ninguno bloquea el trabajo técnico.

**Un hueco declarado, no cubierto:** las imágenes semilla no van en el repositorio, así que en el CI
los buckets están vacíos y las comprobaciones que miran si una foto **se ve** se saltan diciendo por
qué. Localmente sí corren. Decidir antes de F4 si se cubre.

Tampoco proponer cambios de stack ni de hosting: se cerraron el 05/09/2026.

---

## Distribución del trabajo

Todo vive en **un solo repositorio**, `github.com/dNogueira300/PIMPOS_SYSTEM`. Los planes estaban
fuera del control de versiones hasta el 08/09/2026; se movieron dentro para que el código y la
documentación compartan historial y se revisen en el mismo PR.

| Ruta                                                    | Qué es                                                                                                                                                                             |
| ------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `DOC/`                                                  | Los cuatro planes de desarrollo + `Stack Tecnologico - PIMPOS.md`. **Fuente de verdad del proyecto**                                                                               |
| `PRODUCT.md`                                            | Resumen de producto que exige la skill de diseño `impeccable` (registro, usuarios, principios, accesibilidad). No manda: la fuente de verdad sigue siendo `DOC/` y `docs/marca.md` |
| `DOC/Maquetas/`                                         | Capturas de la portada y las opciones de tipografía, para enseñar al propietario                                                                                                   |
| `DOC/Fotos y documentos Adjuntados Pimpos/_OPTIMIZADO/` | Imágenes semilla. **Fuera de git** (8 MB de fotos del cliente): están en disco, no en el repositorio                                                                               |
| `src/`, `supabase/`, `e2e/`, `scripts/`                 | El código, el esquema, las pruebas y los guiones de verificación                                                                                                                   |

**Qué documento leer antes de trabajar:**

- **Ponerse al día → `DOC/Avance del proyecto.md`** (qué está hecho, qué se decidió y por qué)
- Planificar la semana o dudar del orden → `Plan de Desarrollo 00 - General y Fases.md`
- Cualquier tarea de Fase 0 (Supabase, GitHub, entorno, dominio) → `01 - Preparacion y Servicios.md`
- Tocar el esquema, RLS, migraciones, semillas → `02 - Backend y Base de Datos.md`
- Diseño, sitio público, panel → `03 - Frontend.md` (mapea qué skill de diseño usar en qué fase)
- Versiones exactas de librerías y por qué se eligió cada una → `Stack Tecnologico - PIMPOS.md`

---

## Stack (versiones verificadas el 05/09/2026)

Next.js 16.3.4 (App Router) · React 19.2.8 · TypeScript 7.0.2 · Tailwind 4.3.3 · shadcn/ui ·
pnpm 12.3.4 · Supabase (Postgres + Auth + Storage + RLS) · Supabase CLI 2.116.0.

**Sin ORM.** `@supabase/supabase-js` + `@supabase/ssr` con tipos generados por
`supabase gen types typescript`. Prisma/Drizzle duplicarían el esquema y estorbarían a RLS.

Librerías fijadas: embla-carousel-react (carrusel R2) · leaflet (mapa R5, **sin** react-leaflet) ·
@tanstack/react-table · recharts · react-hook-form + zod 4.5.4 · exceljs · @react-pdf/renderer ·
browser-image-compression · resend · lucide-react.

**`motion` se quitó de las dependencias**, y `react-leaflet` con él. El movimiento se hace con CSS
nativo guiado por el scroll; el mapa usa Leaflet directamente. El motivo está medido: la portada
pesa 150 KB de JavaScript comprimido y una página sin carrusel ni filtros pesa lo mismo — eso es
React 19 más Next 16, y nuestro código añade 0 KB. `motion` habría costado más que toda la
aplicación. Si el panel (F4–F6) la necesita, vuelve entonces: ahí no hay presupuesto de portada que
cuidar. Una dependencia instalada sin usar es una invitación a alcanzarla.

Hosting: Vercel en desarrollo; Cloudflare Workers es el destino probable de producción
(decisión abierta hasta octubre). Hostinger quedó descartado como hosting — solo se contempla
como registrador de dominio.

Si TypeScript 7 rompe algún plugin del ecosistema, la salida acordada es fijar `typescript@5.9`
**solo en devDependencies**, nunca cambiar el código de la aplicación por eso.

---

## Comandos

```bash
pnpm install                       # activa tambien los hooks de husky
pnpm dev
pnpm typecheck                     # next typegen + tsc --noEmit
pnpm lint · pnpm lint:fix
pnpm format · pnpm format:check    # Prettier, con el plugin de Tailwind
pnpm test                          # Vitest: src/**/*.test.ts
pnpm test -- src/lib/utilidades/slug.test.ts   # un solo archivo
pnpm test:e2e                      # Playwright; levanta pnpm dev solo
pnpm exec playwright test e2e/portada.spec.ts --project=movil   # un solo E2E
pnpm supabase:tipos                # regenera src/tipos/database.types.ts
```

El `pre-commit` corre `typecheck` + `lint-staged`. El CI corre todo lo anterior más `build`
implícito en E2E, en Ubuntu, con `--frozen-lockfile`: si el lockfile no cuadra con `package.json`,
falla ahí y no en local.

Supabase — la CLI 2.116.0 ya está instalada globalmente, `supabase` funciona directo:

```bash
supabase start                    # entorno local en Docker (opción A del plan)
supabase db reset                 # reconstruye desde migraciones + semillas
supabase test db                  # 377 pruebas pgTAP
supabase gen types typescript --local > src/tipos/database.types.ts

# Lo que pgTAP no puede probar. Los tres corren tambien en el CI.
bash scripts/verificar-fase0.sh          # registro cerrado, rol en el JWT, bucket privado
bash scripts/verificar-storage.sh        # las politicas de Storage, con JWT de usuario real
bash scripts/verificar-sitio-publico.sh  # el camino del navegador: PostgREST + vistas + bucket

bash supabase/seeds/imagenes/subir-imagenes.sh   # 62 imagenes a sus buckets
supabase db dump --linked --data-only -f datos.sql   # respaldo; ver docs/respaldo-y-restauracion.md
```

pnpm se activa por corepack (`corepack prepare pnpm@12.3.4 --activate`), **no** con `npm -g`.

**Trampas ya pagadas, no repetirlas:**

- No lanzar `supabase db reset` mientras `supabase start` sigue corriendo: aborta y se lleva por
  delante el contenedor de la base. Hay que esperar a que el arranque termine.
- En Git Bash, `docker exec ... psql -f /tmp/x.sql` falla porque MSYS convierte `/tmp/...` a una
  ruta de Windows. Anteponer `MSYS_NO_PATHCONV=1`.
- Restaurar un volcado en una base recién creada con `createdb` no sirve: faltan los esquemas
  `auth`, `storage` y `extensions` de la plataforma, y las políticas que usan `auth.uid()` se
  pierden en silencio. Se restaura sobre una base que ya tenga Supabase instalado.
- **El Supabase local no valida la apikey** en `/rest/v1/`: devuelve 200 con cualquier llave. Una
  comprobación de autenticación que pase en local no prueba nada; el único juez es el proyecto
  alojado.
- **Una comprobación que solo dice "falló" cuesta más de lo que ahorra.** Pasó dos veces: el
  keep-alive mandaba el cuerpo a `/dev/null` y el verificador se quedaba solo con `access_token`.
  En ambos casos el mensaje del servidor (`Only the service_role API key...`,
  `email_not_confirmed`, `invalid_credentials`) era el único dato útil, y no lleva secretos.
  Guardar la respuesta entera e imprimirla al fallar.
- **Next 16 no es el Next de los docs viejos.** Antes de escribir codigo de app, leer
  `node_modules/next/dist/docs/` (el propio `AGENTS.md` que genera `next dev` lo exige). Lo que ya
  toca a este proyecto: `middleware.ts` pasa a **`src/proxy.ts`** con export `proxy` y runtime
  Node (sin edge); `cookies()`, `headers()`, `params` y `searchParams` son **async**;
  **`revalidateTag(tag, 'max')`** exige segundo argumento y `updateTag(tag)` es la variante
  read-your-writes para Server Actions — el `revalidateTag('marca')` del plan (R21, favicon
  administrable) se escribe asi; los `icon.tsx`/`apple-icon.tsx` reciben `params` como Promise;
  `next lint` ya no existe (usamos `eslint .`); `next dev` escribe en `.next/dev`, separado del
  build. Los tipos `LayoutProps`/`PageProps` salen de `next typegen`.
- **Scaffold (F1):** `create-next-app` rechaza directorios con archivos ajenos; se genera en el
  scratchpad con `--empty --disable-git --skip-install` y se copia. `shadcn init` sin TTY necesita
  `--preset nova` (con `--base radix`), y **mete Geist desde Google Fonts en `layout.tsx`**: hay que
  revertirlo, el plan exige `next/font/local`. `LayoutProps<"/">` lo genera `next typegen`; sin él
  `tsc` falla, por eso `typecheck` lo encadena. La config de Vitest va en `.mts` (el proyecto no es
  `"type": "module"`), con `resolve.tsconfigPaths: true` en vez del plugin.
- **Versiones que el plan fijó y el ecosistema no alcanza:** TS 7 (typescript-eslint pide `<6.1`) y
  ESLint 10 (eslint-plugin-react llega a `^9.7`). Se usan TS 5.9.3 y ESLint 9.39.5, documentado en
  el README. No volver a intentarlo sin comprobar antes `npm view <plugin> peerDependencies`.
- **Una prueba negativa tiene que exigir el fallo concreto.** Cuatro comprobaciones de Storage
  daban OK comparando "distinto de 200": una petición que ni sale también es distinta de 200. Ahora
  exigen un 4xx. Lo mismo con las pruebas que cuentan una tabla entera: el total nunca es suyo —una
  semilla o un guion de verificación mete una fila y la prueba falla en otro archivo, sin decir por
  qué. Se cuenta la fixture.
- **`supabase db reset` vacía los buckets de Storage.** Recrea los contenedores; las filas de la
  base sobreviven, los archivos no. Después de cada reset, `subir-imagenes.sh`.
- **Un volcado de `supabase db dump` no basta para restaurar.** No lleva las políticas de Storage ni
  los trabajos de cron (viven en `storage` y `cron`; el volcado es de `public` y `app`), y choca con
  las filas que insertan las propias migraciones —`duplicate key ... auditoria_pkey`—. Sí lleva los
  usuarios con su contraseña cifrada, así que **un respaldo es material sensible**. Procedimiento
  ensayado en `docs/respaldo-y-restauracion.md`; automatizado en `scripts/restaurar-respaldo.sh`.
- **Con Cache Components, un `new Date()` suelto rompe el build.** Es un valor que cambia entre
  renderizados y Next se niega a prerenderizarlo. El año del pie vive en `anioActual()`, dentro de
  `use cache`.
- **`onNavigate`, no `onClick`, para cerrar el menú móvil al elegir una sección.** Con `onClick` el
  enlace se oculta en el mismo evento en que se pulsa y la navegación no llega a ocurrir; con un
  efecto sobre la ruta, `react-hooks/set-state-in-effect` lo prohíbe y además cuesta un render por
  cada cambio de página.
- **`supabase-js` deduce el tipo de la fila del texto literal del `select`.** Un `"a" + "b"` le
  llega como `string` genérico y el resultado sale sin tipar, con un error críptico sobre
  `GenericStringError`. La cadena va entera, en una línea.
- **Las imágenes semilla no están en el CI.** Viven en `DOC/Fotos y documentos Adjuntados Pimpos/`,
  no en el repositorio, así que en el CI las filas de `galeria` existen y los archivos no. Una prueba
  que compruebe que una foto **se ve** tiene que preguntar antes si en ese entorno hay archivo que
  cargar, y saltarse diciendo por qué. Y no vale mirar el `src` del `<img>`: es el del optimizador
  (`/_next/image?url=...`) y responde 200 aunque el original no exista — hay que sacar el parámetro
  `url` y pedir el archivo del bucket.
- **`ImageResponse` (`next/og`) no acepta woff2**, solo ttf, otf y woff, y tampoco maneja bien las
  fuentes variables. Las fuentes del sitio son woff2 variables. La imagen para compartir usa TTF
  estáticas convertidas con `fonttools` + `brotli` desde los mismos archivos, en
  `src/recursos/compartir/` con su aviso de licencia. Límite del paquete: 500 KB. Y dentro de
  `ImageResponse` va `<img>` y no `next/image` —el motor dibuja JSX plano—, con el aviso de lint
  desactivado y explicado en esa línea.
- **El sitemap no lleva `lastModified`.** Las vistas no exponen la fecha, y `new Date()` rompería el
  build con Cache Components (valor inestable) y además mentiría a Google en cada petición.
- **`NodeJS.ProcessEnv` exige `NODE_ENV`** porque Next la añade como obligatoria. Una función que lee
  dos variables y se prueba con entornos inventados recibe un `Record<string, string | undefined>`,
  no el tipo entero.
- **Mover un archivo dentro del repositorio no lo versiona.** `CLAUDE.md` pasó días dentro de
  `PIMPOS_SYSTEM/` sin entrar en git: lo excluía la regla de F0 del `.gitignore`, y ni `git status`
  ni Prettier avisan de lo ignorado (Prettier respeta el `.gitignore` y simplemente no lo miraba).
  El commit que decía haberlo versionado lo daba por hecho sin comprobarlo. Después de mover algo
  que tiene que estar en git: `git ls-files --error-unmatch <archivo>`; si falla,
  `git check-ignore -v <archivo>` dice qué regla lo excluye.
- **Una prueba de animación que centra el bloque antes de medirlo no ve el reposo.** La aparición
  por scroll terminaba en `cover 25%`, y con la página quieta dejaba a medias lo que ya se veía
  entero: en el primer pliegue del celular, «Desde 2004» a opacidad 0.1 y los precios a 0.7. La
  prueba que decía cubrirlo hacía `scrollIntoView({ block: "center" })` en cada bloque, así que
  siempre medía el mejor caso y seguía en verde. Lo encontró la crítica de diseño, ya en `main`.
  Ahora hay dos pruebas que miran los dos lados sin ayudar a la animación: nada entero en pantalla
  por debajo de 0.95 con la página quieta, y algún bloque a medio camino mientras entra (si no, el
  movimiento se ha roto sin que nada falle).
- **El 404 de la raíz no pasa por el layout de `(public)`.** `app/not-found.tsx` atiende toda
  dirección que no existe y Next lo pinta dentro del layout raíz, que solo pone `<html>` y `<body>`:
  `/esto-no-existe` salía sin cabecera ni pie. La cáscara del sitio vive en `CascaraPublica` para que
  el layout y ese 404 la compartan. `app/(public)/not-found.tsx` solo atiende los `notFound()` de
  dentro de las secciones.
- **`error.tsx` recibe `retry`, no `reset`** (estable desde Next 16.3). `retry` vuelve a pedir los
  datos y a pintar; `reset` solo limpia el estado y, con un fallo de un Server Component, vuelve a
  fallar igual. Los ejemplos de versiones anteriores usan `reset`.
- **Una regla dentro de `@layer` pierde contra una hoja sin capa, sea cual sea su especificidad.**
  Pasó con Leaflet: sus botones de zoom miden 30 px y la hoja `leaflet.css` no está en ninguna capa,
  así que agrandarlos desde `@layer components` no hacía nada. La regla va al final de `globals.css`,
  fuera de toda capa. Lo mismo valdrá para cualquier librería que traiga su propio CSS.
- **El área táctil se mide en todo el sitio, no se promete.** Hasta el 11/09 solo dos botones tenían
  prueba, y medir todas las páginas a 375 px encontró 22 controles por debajo de 44 px (puntos del
  carrusel, enlaces del pie, datos de contacto, zoom y marcador del mapa). `e2e/tactil.spec.ts`
  recorre ahora cada control de cada página; los enlaces dentro de una frase y el crédito de licencia
  del mapa quedan exentos, como en WCAG 2.5.8.
- **El hueco que reserva un elemento fijo va en lo último del documento, no en `<main>`.** El botón
  flotante de WhatsApp tapaba texto al final de la página; el `padding-bottom` se puso en `<main>` y
  no cambió nada, porque debajo sigue el pie: el último texto que se ve es «Iquitos, Perú», no el
  contenido. Va en el `<footer>`. Mirarlo en pantalla no lo habría cazado —hay que bajar del todo—;
  lo cazó la prueba que pregunta qué hay debajo del centro del botón con `elementFromPoint`, en cada
  ruta y con la página al fondo.
- **Un componente de cliente no puede tirar del hilo de `configuracion.ts`.** «Abierto ahora» tiene
  que saber qué hora es, así que es de cliente; importaba `lib/datos/horario.ts`, que importaba
  `configuracion.ts`, que trae Zod, el cliente de Supabase y funciones `use cache`. El build se cayó
  con _«It is not allowed to define inline "use cache" annotated functions in Client Components»_, y
  la traza de importación señalaba la cadena entera. Lo puro —los días, `formatearHora`,
  `describirTramos` y el tipo `Tramo`— vive ahora en `src/lib/datos/reloj.ts`, **sin dependencias**;
  `configuracion.ts` lo reexporta, así que ningún consumidor cambió una línea. Antes de importar algo
  desde un `"use client"`, seguir la cadena hasta el final: el error no aparece hasta el build.
- **Ampliar una vista es `create or replace`, y solo admite columnas nuevas al final.** Cambiar el
  orden o el tipo de una columna existente obliga a `drop view` y a recrear permisos. Al reemplazar
  hay que repetir `with (security_invoker = true)` y el `where` de publicado: si se olvidan, la
  vista deja de respetar la RLS sin que nada falle. La prueba de 0020 los comprueba.
- **«Esta vista trae filas» envejece mal como comprobación.** `verificar-sitio-publico.sh` exigía
  filas a todas las vistas públicas; cuando 0021 hizo que `testimonios_publicos` dejara fuera los
  de ejemplo, el CI falló por el comportamiento correcto —en una base con solo datos de ejemplo,
  cero filas es lo que se busca—. Una comprobación así tiene que decir qué espera y por qué: ahora
  se exige que la vista **responda** y que **no deje escapar ningún `es_demo`**, que es la regla de
  verdad. Antes de dar por buena una comprobación nueva, verla fallar: con la vista sin filtrar,
  esta dice «3 testimonio(s) de ejemplo se están publicando».
- **Un texto de fábrica se corrige solo si nadie lo cambió.** Las migraciones 0018, 0019 y 0020
  reescriben contenido que el negocio puede editar desde el panel. El `update` lleva en su `where` el
  texto anterior (o un trozo reconocible): si ya lo editaron, no se pisa. Y va sin auditar, como las
  cargas iniciales, porque no es un cambio que hiciera una persona.
- **lucide 1.x retiró los iconos de marca** (Facebook, Instagram). No se dibujan a mano: las redes
  van con su nombre escrito y un icono genérico de enlace externo.
- **`GET /rest/v1/` (la raíz) exige `service_role` en el alojado** — devuelve el esquema OpenAPI
  completo. Con la `anon` responde 401 `"Only the service_role API key can be used for this
endpoint"`. Para un ping se consulta una tabla real; meter la `service_role` en un workflow
  sería poner una llave que salta toda la RLS dentro de un ping.

---

## Arquitectura

Un solo proyecto Next.js con dos zonas, separadas por route groups:

- `src/app/(public)/` — 8 secciones (inicio, nosotros, productos, novedades, galería, contacto,
  ubicación, faq). **Construidas y probadas**; el build genera 52 páginas estáticas, los 34 productos
  entre ellas. Se revalidará con `revalidateTag` cuando el panel publique (F4); las etiquetas ya
  están puestas en `src/lib/datos/etiquetas.ts`.
  - **SEO:** `app/sitemap.ts`, `app/robots.ts` y `app/opengraph-image.tsx`, más los datos
    estructurados de `src/lib/seo/` (funciones puras, con Vitest) que renderiza
    `src/components/seo/datos-estructurados.tsx`. La URL absoluta del sitio sale **siempre** de
    `src/lib/sitio.ts`, nunca de una cadena escrita a mano.
  - **`cacheComponents: true`** (Next 16): el sitio se prerenderiza y lo que depende de la petición
    llega en streaming. A cambio, todo lo que lea `cookies()`, `headers()` o `searchParams` va
    dentro de un `<Suspense>` — por eso las páginas del panel separan su parte autenticada.
  - `src/lib/datos/` — las lecturas del sitio público, con `use cache` + `cacheTag`. Consultan las
    **vistas** de la migración 0016, nunca tablas.
  - `src/lib/supabase/publico.ts` — cliente **sin cookies**. Leer una cookie ataría el renderizado
    a la petición y tiraría el prerenderizado entero; sin sesión, PostgREST atiende como `anon` y la
    RLS muestra justo lo que ve un visitante.
- `src/app/(admin)/` — dashboard, contenido, insumos, clientes, usuarios, auditoría, configuración.
  Dinámico y siempre autenticado.
- `middleware.ts` — refresco de sesión + guardia por rol.
- Mutaciones por **Server Actions** validadas con Zod; no hay API REST propia salvo webhooks puntuales.

**La seguridad vive en la base.** El rol viaja dentro del JWT vía _custom access token hook_, y las
políticas RLS lo leen con `app.rol_actual()` / `app.es_rol(...)` sin consultar otra tabla. Ocultar
un botón en la interfaz nunca cuenta como control de acceso: si la regla importa, va también como
política o restricción en Postgres (p. ej. la aprobación de promociones y la autorización de bajas
de insumo son triggers/`check`, no validaciones de formulario).

**Cuatro roles:** `superadmin` (único que elimina usuarios) · `administrador` · `ingeniero`
(crea promociones pero no las publica) · `repartidor` (solo clientes). Matriz completa de RLS en
el doc 02 §11.

**Esquemas Postgres:** `public` para lo que el frontend consulta; `app` para auditoría, funciones
internas, hooks y cron — **no se expone por PostgREST**.

**Las 23 migraciones** (`supabase/migrations/`), en orden:

| Archivo                        | Contenido                                                                                                      |
| ------------------------------ | -------------------------------------------------------------------------------------------------------------- |
| `0001_extensiones`             | Esquema `app` + las 5 extensiones. `pg_cron` va en `pg_catalog`                                                |
| `0002_comunes`                 | Los 6 enums, `app.set_updated_at()`, `app.rol_actual()`, `app.es_rol()`                                        |
| `0003_roles_perfiles`          | `roles`, `perfiles`, el hook `app.custom_access_token()` y sus políticas                                       |
| `0004_catalogo_roles`          | Las 4 filas de `roles` — migración, no semilla, ver la trampa de abajo                                         |
| `0005_perfil_automatico`       | Trigger sobre `auth.users` que crea el perfil                                                                  |
| `0006_perfil_siempre_inactivo` | El trigger deja de leer el rol de los metadatos                                                                |
| `0007_auditoria`               | `app.auditoria`, trigger genérico y la vista `public.auditoria`                                                |
| `0008_configuracion`           | `configuracion_sitio` y sus ~24 valores de la ficha                                                            |
| `0009_catalogo`                | Categorías, productos, variantes, imágenes e historial de precios                                              |
| `0010_contenido`               | Novedades con aprobación, slides, guías, galería, faqs, testimonios                                            |
| `0011_insumos`                 | Unidades, equivalencias, proveedores, almacenes y `app.convertir_a_base()`                                     |
| `0012_kardex`                  | Lotes, movimientos, saldos por trigger y `app.recalcular_saldos()`                                             |
| `0013_clientes`                | Zonas, clientes, fotos, consentimientos y `app.sin_tildes()`                                                   |
| `0014_storage_politicas`       | Las 12 políticas de los 7 buckets                                                                              |
| `0015_cron_alertas`            | `notificaciones`, `app.evaluar_alertas()` y los 2 trabajos de cron                                             |
| `0016_vistas`                  | Las 9 vistas de lectura del sitio público                                                                      |
| `0017_pedidos`                 | Condiciones del delivery en `configuracion_sitio`, con su forma comprobada                                     |
| `0018_faq_horario`             | La respuesta del horario en 12 h. Repite las horas como texto libre: si cambia el horario, cambia también ella |
| `0019_historia`                | La historia del negocio, reescrita en la voz de `docs/marca.md`                                                |
| `0020_slides_enfoque`          | `slides.enfoque`: por qué altura se recorta cada foto del carrusel. La vista `slides_publicos` lo expone       |
| `0021_testimonios_sin_demo`    | `testimonios_publicos` deja fuera los `es_demo`: un testimonio inventado es una reseña falsa                   |
| `0022_presentaciones`          | `productos_publicos` manda todas las presentaciones con su precio, no solo cuántas hay                         |
| `0023_slides_reales`           | Las tres diapositivas de portada, reales. Producción no carga semillas: el hero va en migración                |

Semillas en `supabase/seeds/`: `01_maestros.sql` (34 productos, 22 insumos, 10 fotos del local;
datos reales, a producción con `db push --include-seed`) y `02_demo.sql` (slides, testimonios y
clientes de ejemplo, `es_demo = true`, nunca llega a producción). Las imágenes las sube
`seeds/imagenes/subir-imagenes.sh` — **`db reset` vacía los buckets**, hay que volver a correrlo.

Tres decisiones que se apartan del borrador del plan, y por qué:

- **`app.rol_actual()` devuelve NULL sin sesión**, no `'repartidor'` como sugería el doc 02 §4.3.
  Un peticionario sin JWT no debe heredar el rol menos privilegiado — `repartidor` tiene acceso a
  `clientes`. `es_rol()` convierte ese NULL en `false`: las políticas fallan cerradas.
- **`public.roles` no tiene políticas de escritura**, ni para el superadmin. Añadir un rol exige un
  valor nuevo del enum, que es una migración; un catálogo capaz de desincronizarse del enum sería
  una trampa.
- **El sitio público lee vistas, nunca tablas** (0016). Cada página tiene su `*_publica(s)`, con las
  columnas listas y sin metadatos internos. Dos reglas que las gobiernan y que no son opcionales:
  toda vista lleva **`security_invoker = true`** —sin él se ejecuta con los privilegios de quien la
  creó y salta la RLS, y no se puede activar RLS sobre una vista— y toda vista **repite en su
  `where` la condición de publicado**, porque un administrador con sesión sí ve los borradores y la
  vista tiene que significar lo mismo para todos. La prueba pgTAP recorre **todas** las vistas de
  `public`, no solo las de esa migración.

**Trampa de configuración de Auth, ya pisada:** `[auth.email] enable_signup` **no** controla el
registro público — controla `GOTRUE_EXTERNAL_EMAIL_ENABLED`, o sea si el proveedor de correo
existe. Ponerlo en `false` deja fuera a todo el mundo, incluidos los usuarios que crea el
administrador. Quien cierra el registro es `[auth] enable_signup` (`GOTRUE_DISABLE_SIGNUP`). Lo
mismo aplica al panel web: desactivar "Allow new users to sign up", nunca el proveedor Email.

**Piezas con lógica no obvia:**

- _Kárdex de insumos_ (doc 02 §9): una sola tabla `movimientos_insumo` para ingreso/consumo/baja.
  `cantidad_base` la calcula un trigger aplicando la equivalencia, y `saldos_insumo` se mantiene
  por trigger — **nunca se edita a mano**, siempre se puede recalcular desde los movimientos.
- _Equivalencias de unidades_: cuelgan del insumo, no son globales (un saco de harina son 50 kg,
  uno de sal 25 kg). Es la lógica con más riesgo de error silencioso; va cubierta con Vitest
  **antes** de escribir su interfaz.
- _`configuracion_sitio`_ (clave/valor jsonb): hace administrables logo, favicon, coordenadas,
  horarios y textos, y desde 0017 las condiciones del delivery (grupo `pedidos`). `app/icon.tsx` y
  `app/apple-icon.tsx` leen de ahí (requisito R21). **Zod la valida entera**: un valor con la forma
  equivocada no se pierde solo, tira el objeto completo a los valores de reserva y el sitio se queda
  sin teléfono, dirección ni horario. Por eso las claves de `pedidos` llevan además un `check` por
  clave en la base, que rechaza el valor al guardarlo. Lo inventado para maquetar lleva `PENDIENTE`
  en la descripción; `where descripcion like '%PENDIENTE%'` lo lista.
- _`pg_cron`_: despublica novedades vencidas y evalúa alertas de stock/vencimiento. **Si el proyecto
  Supabase se pausa, el cron no corre** — por eso el keep-alive cada 3 días no es opcional.
- _Storage_: 7 buckets. `clientes` y `documentos` son **privados**; `clientes` guarda fotos de
  fachadas de domicilios (Ley N.° 29733) y solo se sirve por URL firmada.

---

## Convenciones

**Idioma.** Rutas, tablas, columnas, carpetas de dominio y textos de interfaz **en español**.
Solo los nombres que impone el framework van en inglés (`layout.tsx`, `page.tsx`, `middleware.ts`).

**Base de datos.**

- Tablas en plural `snake_case`; toda tabla de negocio lleva `id uuid`, `created_at`, `updated_at`,
  `created_by`, `updated_by`, `deleted_at` (borrado lógico), y `es_demo` si admite datos de ejemplo.
- Migraciones numeradas en `supabase/migrations/` y **nunca editadas después de aplicarse**: se
  corrige con una migración nueva.
- Ninguna tabla se crea sin su política RLS en la misma migración.
- Dinero es `numeric(12,4)`, nunca `float` (hay productos a S/ 0.10 y descuentos porcentuales).
- Toda fecha es `timestamptz`; la base va en UTC y la conversión a Iquitos (UTC−5) se hace en la
  interfaz.
- Semillas partidas en `01_maestros.sql` (datos reales, `es_demo = false`) y `02_demo.sql`
  (desechables, `es_demo = true`).

**Código.**

- TypeScript `strict`. **`any` prohibido** — usar `unknown` y estrechar.
- Server Components por defecto; `'use client'` solo con estado o eventos.
- La `service_role key` jamás sale del servidor. Si una variable no lleva `NEXT_PUBLIC_`, no llega
  al navegador — esa es la regla que evita el accidente caro.

**Git.** `main` siempre desplegable y protegida. Ramas `feat/f4-crud-productos`,
`fix/f5-conversion-unidades`. Conventional Commits **en español**:
`feat(insumos): registrar ingreso con lote y vencimiento`. Una fase = una rama larga; cada tarea =
un PR pequeño. Nunca se commitea `.env.local` ni claves.

---

## Definición de "hecho"

Una tarea no está hecha hasta que:

1. `pnpm typecheck` y `pnpm lint` pasan sin advertencias.
2. Si toca la base: hay migración versionada **y** prueba pgTAP de su RLS.
3. Si toca lógica de negocio (unidades, stock, precios): hay prueba en Vitest.
4. Si es un flujo de usuario crítico: hay prueba en Playwright.
5. Funciona a **375 px** de ancho (el panel se usa desde el celular en campo).
6. Los textos están en español y sin jerga técnica — los usuarios tienen nivel de computadora básico.
7. Está desplegada en la vista previa de Vercel y revisada en el navegador.

---

## Diseño

Estilo declarado: **tradicional / artesanal**, no minimalista ni "premium". Pimpo's es un negocio
de barrio de 22 años con precios desde S/ 0.10 y delivery propio: el precio se muestra con orgullo
y el delivery es titular, no nota al pie.

Paleta extraída de los archivos reales del cliente: azul institucional `#12306E`, azul fachada
`#0060A8`, crema de fondo `#F7EFE2` (nunca blanco puro), dorado corteza `#C8801F` (acento/CTA),
tinta `#231A14`. El degradado arcoíris del logo va **solo como detalle**, nunca en fondos ni botones.
El dorado no alcanza contraste AA en texto pequeño: solo superficies grandes, iconos o ≥18 px.

Tokens en tres capas (primitivo → semántico → componente) como variables CSS nativas en
`src/estilos/globals.css`. Ningún componente usa un color de la capa 1 directamente.

**El movimiento se hace con CSS nativo guiado por el scroll** (`animation-timeline: view()`), no con
una librería. La portada está justo en el suelo de React 19 + Next 16 —150 KB comprimidos, medido—
y `motion` costaría más que todo el código de la aplicación junto. Cuatro salvaguardas obligatorias,
y hay prueba de cada una: va dentro de `@supports` (un navegador que no lo soporte muestra el
contenido tal cual), dentro de `prefers-reduced-motion: no-preference`, y **apagado al imprimir**
—sin scroll la animación se congela en su primer fotograma y el bloque saldría en blanco—. Y **termina mientras el bloque entra** (`entry 0% entry 70%`), no después: con la página quieta, todo lo que se ve entero está opaco.

Tipografías por `next/font` **locales**, sin llamar a Google. Fraunces + Inter (alternativa:
Bitter + Source Sans 3).

Dan pidió usar las skills de diseño instaladas. `03 - Frontend.md` §2 mapea cuál en qué fase y con
qué entregable. **Orden obligatorio:** primero las de proceso (`brand`, `design-system`,
`ui-ux-pro-max`), después las de ejecución (`taste-skill`, `impeccable`, `ui-styling`,
`emil-design-eng`). Pulir antes de tener el sistema de diseño es rehacer el trabajo dos veces.

---

## Si el calendario aprieta

El cronograma de 12 semanas no tiene holgura. Lo que se recorta, en este orden: PWA offline (R16)
→ detalle de los reportes de F5 → testimonios. **Nunca se recorta:** SEO, RLS, auditoría ni
consentimiento de datos personales.
