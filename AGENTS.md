<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Guía del proyecto para agentes

Este archivo es **la fuente única de contexto** para cualquier agente que trabaje en el repositorio
(Claude Code, Codex, Cursor, Copilot u otro). `CLAUDE.md` no tiene contenido propio: solo importa
este archivo con `@AGENTS.md`, para que Claude Code lo cargue igual que los demás. **Todo lo que
haya que recordar se escribe aquí**, nunca en `CLAUDE.md`. El bloque de arriba, entre las marcas
`nextjs-agent-rules`, lo mantiene `next dev`: no se toca.

Proyecto: plataforma web + panel de gestión para **Panadería Pimpo's E.I.R.L.** (Iquitos, Perú).
Práctica preprofesional de Dan (FISI-UNAP), ventana set–nov 2026.

---

## Estado

**F0, F1, F2, F3, F3.1, F4 y F5 cerradas** (F5 el 30/09/2026, en lo técnico: falta que el negocio
cargue su inventario inicial). **F6 (clientes) en curso: T1–T6 fusionadas y aplicadas en producción
(30/09/2026); falta la T7, el cierre.** Ver «F6 en curso — cómo retomar», más abajo. El sitio está desplegado (12/09/2026) en
https://pimpos-system-iota.vercel.app, todavía sin dominio propio. Resumen completo en
`DOC/Avance del proyecto.md` — léelo primero para ponerte al día.

| Fase               | Estado                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| F0 Preparación     | ✅ 8/8 comprobaciones, verificadas en producción                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| F1 Fundación       | ✅ scaffold + autenticación + sistema de diseño + tipografía                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| F2 Backend         | ✅ 16 migraciones, checklist de cierre del doc 02 §15 completo                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| F3 Sitio público   | ✅ **Cerrada el 12/09.** Desplegado, crítica **29/40** cerrada, axe en cero y en el CI, Lighthouse accesibilidad y SEO ✅. El rendimiento y lo del negocio pasan a F4                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| F3.1 Rediseño      | ✅ **Cerrada el 14/09.** El aspecto del prototipo de Stitch con el azul `#12306E`, Playfair Display + Plus Jakarta Sans y productos en híbrido. Rendimiento contra F3 medido el mismo día y en la misma máquina: `/` 91 frente a 95, `/productos` 95 frente a 94, `/contacto` 96 frente a 96. Accesibilidad ≥ 97 y SEO 100. Plan en `DOC/Plan de Desarrollo 03.1`, capturas en `DOC/Maquetas/3.1/`                                                                                                                                                                                                                                |
| F4 Panel contenido | ✅ **Cerrada el 24/09/2026** (PR #61, revisión final incluida). Las 8 tareas: cáscara del panel, categorías, productos con presentaciones/fotos/historial de precios, novedades con aprobación, portada/galería/preguntas/guías/testimonios, usuarios con contraseña temporal y cierre de sesión al instante, configuración y marca. Rendimiento medido el 25/09 contra `ae96d1b`, en la misma sesión: `/` **91 frente a 91** (37 pasadas intercaladas por versión, diferencia no significativa), `/productos` 91 → 95 y `/contacto` 95 → 96 (`PASADAS=5`). Accesibilidad 100/100/97 y SEO 100 en las tres                        |
| F5 Panel insumos   | ✅ **Cerrada el 30/09/2026** (PR #66 a #75, plan en #65). Kárdex por lotes (FEFO) con costo y sin saldos negativos, catálogo y existencias, ingresos y consumos de varias líneas, ficha con kárdex, anulación y conteo, bajas con aprobación, reportes con gráficos y descarga en Excel y PDF, avisos por correo apagados hasta tener dominio; y, a pedido de Dan, lápiz de editar, búsqueda al escribir y sesión de 2 horas. Rendimiento contra `a5e6a4b`, misma sesión: `/` **86.5 frente a 85** (20 pasadas intercaladas por versión, p = 0.79), `/productos` 90 → 88, `/contacto` 95 → 95. Accesibilidad 100/100/97 y SEO 100 |
| F6 Panel clientes  | 🟡 **T1–T6 fusionadas** (PR #78 a #81, plan en #77). Permiso obligatorio en la base (0042), el repartidor solo corrige referencia, punto y fotos, borrar a pedido con la auditoría tachada y aviso de conservación a los 2 años (0043), lista con buscador en vivo y mapa, ficha con fotos por URL firmada, alta en pestañas con aviso de celular repetido, zonas, «Para revisar» y descarga en Excel y PDF con registro. Falta **T7** (suite entera, rendimiento contra `371c202`, ensayo de restauración, repaso de `docs/clientes.md` con el negocio y revisión final). Plan en `DOC/Plan de Desarrollo 06 - Clientes.md`      |
| F7                 | ⬜                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |

**La base hoy** (30/09/2026, F6 hasta la T6): 33 tablas (32 en `public` + `app.auditoria`) **todas
con RLS** (cero sin proteger), 13 vistas **todas con `security_invoker`**, 93 políticas (76 en
`public`, 1 en `app`, 16 en `storage`), 89 triggers en `public`, 2 trabajos de `pg_cron`, **43
migraciones**. Cómo se cuenta, para que la próxima cifra sea comparable: `pg_tables` de `public` y
`app`; `pg_class` de vistas de `public` con `reloptions` buscando `security_invoker=true`;
`pg_policies` por esquema; `pg_trigger` sin `tgisinternal`, por esquema de la tabla (la cifra de F5,
86, no dice con qué consulta salió). Las 9 pruebas obligatorias del doc 02 §11.3 pasan las 9. Desde F4: la
autoría de cada fila la sella un trigger (0026), el catálogo se guarda con `public.guardar_producto`
(0027) y la configuración con `public.guardar_configuracion` (0031), las dos en una transacción; y
desactivar a alguien, restablecerle la contraseña o cambiarle el rol le cierra la sesión **en el
acto** (0030 + 0032), no en la próxima hora. Desde F5: el kárdex reparte cada salida entre lotes
(primero el que vence antes) y el saldo **no puede** quedar negativo (0034); las bajas pasan por una
solicitud que aprueba la administración (0038); los reportes los calcula la base con el costo real
de cada lote (0039); la base recuerda qué avisos salieron ya por correo (0040); y el kárdex
acumula el saldo en el orden en que se registró cada cosa, con las cantidades escritas hasta en
gramos (0041). Desde F6: un cliente y su permiso se guardan juntos o no se guarda nada —un trigger
**diferido** rechaza, al terminar la transacción, al cliente sin permiso vigente—, el repartidor solo
corrige referencia y punto, el celular se guarda normalizado (solo dígitos) y un punto es latitud y
longitud o ninguna (0042); borrar los datos de un cliente a su pedido los quita también de la
auditoría (tachando el contenido, no las filas), deja la constancia en `supresiones` y la ficha
borrada ya no se puede volver a llenar (0043).

**Verificación** (30/09/2026, F6 hasta la T6): **695 pgTAP** (39 archivos) + **416 unitarias** (56
archivos, Vitest) + **612 E2E listadas en 43 archivos**. La última vez que la suite E2E se corrió
**entera** fue al cerrar F5, sobre `main` @ `e83d35c` (540 entonces: 478 pasan y 62 se saltan a
propósito, por tamaño de pantalla o sin fotos en el entorno; 0 fallos). En F6 cada PR corrió sus
E2E, la accesibilidad y el área táctil de **todas** las rutas del panel (167) y las pantallas que
comparten los componentes que tocó; la suite entera vuelve a correrse en la T7.
En esta máquina la suite no cabe de una vez por la memoria: se corre **por tandas contra un mismo
build** levantado a mano (`pnpm build` + `pnpm start` con el entorno de `playwright.config.ts`), con
`--workers=1` en los flujos largos (bajas, novedades, movimientos, contenido) + 3 guiones que prueban lo que
SQL no puede (`verificar-fase0.sh`, `verificar-storage.sh`, `verificar-sitio-publico.sh`). Todo por
PR con CI en verde; `main` protegida. No dar nada por cerrado sin ejecutarlo.

**axe corre en el CI; Lighthouse no, y es a propósito.** `e2e/accesibilidad.spec.ts` pasa axe por las
12 rutas públicas en los dos tamaños y con el menú del celular abierto, sin desactivar ni una regla:
es determinista, mira la estructura del documento. Lighthouse mide **tiempos**, y un tiempo depende
de la máquina —en un runner compartido el mismo sitio da 96 y luego 78—, así que va en
`pnpm lighthouse` y se ejecuta a mano antes de cerrar una fase y después de cada despliegue. Los
umbrales del plan (doc 03 §7) están escritos en el guion y este imprime **qué auditorías** fallaron,
no solo el número.

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
- **El sitio no refleja un cambio de la base hasta que algo lo revalide.** Con Cache Components la
  portada se prerenderiza **en el build**. El 12/09 se aplicó la migración 0023 en producción —los
  tres slides— y el sitio siguió enseñando la variante sin hero: la base tenía las tres filas
  (comprobado pidiéndoselas a `slides_publicos`) y el HTML servido era el del build anterior.
  **Mientras el panel de F4 no llame a `revalidateTag`, cada cambio de contenido en producción exige
  un redespliegue.** El síntoma engaña: parece que la migración no entró. Se distingue en un minuto
  —preguntar a la vista si tiene las filas y al HTML si las pinta—, y son dos respuestas distintas.
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

**Pendiente del negocio (F4):** crear a Marcos y Debra **desde el panel** ahora que existe
`/admin/usuarios` (solo existe el superadmin todavía), confirmar con el negocio los datos «Por
confirmar» (teléfono fijo, costo y tiempo de delivery, pedido mínimo, formas de pago), asignar las
tres fotos sueltas del bucket si corresponden a algún producto, cargar Facebook e Instagram si ya
existen, el dominio y las fotos de los 32 productos que aún no tienen. Ninguno bloquea el trabajo
técnico. Ver el paso 3 de la tarea 8 del plan de F4 para el procedimiento exacto.

**F5 cerrada — lo que dejó** (30/09/2026).

- **El plan** es `DOC/Plan de Desarrollo 05 - Insumos.md`, y su sección «Lo que resultó distinto»
  cuenta tarea a tarea en qué se apartó la ejecución del texto. El manual para el negocio, con el
  inventario inicial y cómo encender el correo, es `docs/insumos.md`.
- **Cómo se trabajó:** T1–T6 con `superpowers:subagent-driven-development` (implementador y revisor
  por tarea); desde la T7, a pedido de Dan, la sesión principal implementa
  (`superpowers:executing-plans`) y un subagente hace **solo** la revisión final de la rama, con los
  Importantes arreglados —prueba vista fallar primero— antes del PR.
- **El ritmo que pidió Dan, sin excepciones, y que sigue en F6:** una rama y un PR por tarea, desde
  `main` actualizado. Al abrir el PR **se para**: nadie trabaja ni deja archivos sin commit en
  `PIMPOS_SYSTEM` hasta que Dan haga `supabase db push` (si la tarea trae migración) **desde esa
  misma carpeta** y fusione. **Nada de copias, worktrees ni enlaces** a `node_modules` para el push:
  la carpeta quieta es la garantía (ver las trampas de F5).
- **Decidido por Dan el 30/09/2026:** cerrar la sesión por inactividad borra los borradores locales
  de formularios (la regla de privacidad de F4 se mantiene); y **queda pendiente para más adelante**
  que la marca de actividad (`pimpos_actividad`) deje de poder reescribirse desde el navegador —hoy
  no es `httpOnly`, así que quien tenga la sesión podría alargarla con las herramientas del
  navegador. Cerrarlo exige renovar la marca solo desde el servidor.
- **Los menores que quedaron** están al final del plan de F5 («Hallazgos menores aplazados»), con lo
  que la revisión final decidió de cada uno.

**F6 en curso — cómo retomar** (30/09/2026).

- **El plan** es `DOC/Plan de Desarrollo 06 - Clientes.md`: arriba la spec (lo que decidió el negocio
  en la ficha 8, las 11 decisiones de Dan del 30/09, el texto del permiso `v1-2026-10` y el diseño),
  debajo las 7 tareas paso a paso y, al final, «Lo que resultó distinto» con lo que cambió en la
  ejecución y los hallazgos menores aplazados. **Siguiente: la T7** (cierre de la fase). El manual
  para el negocio es `docs/clientes.md`.
- **Cómo se trabaja**, igual que desde la T7 de F5: la sesión principal implementa
  (`superpowers:executing-plans`) y un subagente (opus) revisa la rama antes de cada PR; lo
  Importante se arregla con su prueba vista fallar primero. El registro de ejecución vive en
  `.superpowers/sdd/Plan de Desarrollo 06 - Clientes/progress.md` (fuera de git): cada «Ruling:» y
  cada menor aplazado.
- **La regla de PR de F6 (Dan, 30/09/2026):** una tarea **con** migración va sola en su PR y se para
  hasta que Dan hace `supabase db push` desde `PIMPOS_SYSTEM` y fusiona; una tarea **sin** migración no
  abre PR: se junta con la siguiente, **dos como mucho**, siempre que ninguna lleve migración. Así
  quedó: T1 (0042) sola, T2 (0043) sola, T3+T4 y T5+T6 juntas, T7 sola.
- **Producción tiene 0 clientes** (30/09/2026): las reglas de 0042 y 0043 no chocaron con nada. El
  primer cliente real lo registra el negocio; **no** se registran clientes de prueba en producción
  (uno borrado dejaría una constancia en `supresiones` que no se puede quitar).
- **Esta máquina se queda sin memoria** con Docker, el build de Next y Playwright a la vez: Claude
  Code llegó a parar el build en segundo plano dos veces. Supabase se levanta solo con lo que usa el
  proyecto:
  `supabase start -x realtime,imgproxy,postgres-meta,studio,edge-runtime,logflare,vector,supavisor`
  (y, si Docker Desktop vuelve a arrancar `realtime` por su cuenta,
  `docker stop supabase_realtime_PIMPOS_SYSTEM`). Un solo build por tanda de E2E, y pararlo al
  terminar.

**El despliegue, en corto** (actualizado el 30/09/2026, F6 hasta la T6). El sitio vive en
https://pimpos-system-iota.vercel.app, sin dominio todavía. En Vercel hay **cuatro variables**:

| Variable                        | De dónde sale                                                                                                                                                                   |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`      | Supabase → Project Settings → Data API                                                                                                                                          |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Project Settings → API Keys (la `anon`/publishable)                                                                                                                  |
| `SUPABASE_SERVICE_ROLE_KEY`     | Supabase → Project Settings → API Keys (la `service_role`), **Production y Preview**, añadida el 23/09/2026                                                                     |
| `CRON_SECRET`                   | Una cadena aleatoria (`openssl rand -hex 32`), **solo Production**: el cron del resumen diario (F5, T8). Puesta el 30/09/2026 (la llamada de prueba respondió `{"enviados":0}`) |

**`SUPABASE_SERVICE_ROLE_KEY` no lleva `NEXT_PUBLIC_`**, así que nunca llega al navegador. La lee
solo `src/lib/supabase/administrador.ts` (`import "server-only"`), y solo la usan las acciones de
`/admin/usuarios` (F4, tarea 6), siempre después de `exigirAcceso`. Sin ella, esas páginas fallan con
un error explicado en vez de exponer nada.

**`NEXT_PUBLIC_SITE_URL` se deja sin poner a propósito** hasta que haya dominio: sin ella,
`urlDelSitio()` usa `VERCEL_PROJECT_PRODUCTION_URL`, que Vercel inyecta sola, y así el `sitemap`, las
canónicas y la imagen para compartir no publican una dirección provisional. Cuando llegue
`panaderiapimpos.com`, se añade y manda ella.

**El correo está apagado a propósito**: `RESEND_API_KEY`, `CORREO_ALERTAS` y `CORREO_REMITENTE`
**no se ponen** hasta que haya dominio verificado en Resend (sin él, solo entrega a la cuenta
dueña). Sin ellas, `enviarCorreo()` lo deja en el registro (`[correo] apagado …`) y no falla. Se
encienden como dice `docs/insumos.md`. `NEXT_PUBLIC_WHATSAPP` sigue sin leerla nadie: el número sale
de `configuracion_sitio`.

Producción tiene las migraciones hasta la **0043** aplicadas (Dan, 26–30/09/2026), **sin
`--include-seed`**. La 0035 llegó a medias (ver las trampas de F5) y la 0036 la repara al empezar;
comprobado en producción que el trigger que faltaba ya existe. `movimientos_insumo` y
`lotes_insumo` estaban vacías al aplicar la 0034: el inventario inicial se carga con el conteo
físico del panel (la T9 deja el procedimiento está en `docs/insumos.md`). La semilla es `01_maestros.sql` (cargada a mano desde el editor SQL del panel,
**nunca con `--include-seed`**) y las 62 imágenes están en sus buckets.

**Recuperar la contraseña del superadmin, si hace falta.** No hay flujo de «¿Olvidaste tu
contraseña?» en el sitio: se hace por SQL, desde el editor de Supabase alojado, contra el `id` del
superadmin en `auth.users`:

```sql
update auth.users
set encrypted_password = extensions.crypt('<clave-nueva>', extensions.gen_salt('bf'))
where id = '<uuid-del-superadmin>';
```

No deja la clave en ningún registro de la aplicación; queda solo en el historial de quien lo ejecuta
en el editor SQL.

**Un hueco declarado, no cubierto:** las imágenes semilla no van en el repositorio, así que en el CI
los buckets están vacíos y las comprobaciones que miran si una foto **se ve** se saltan diciendo por
qué. Localmente sí corren. La decisión de cubrirlo o no se aplazó durante toda F4; sigue pendiente.

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
- **Rediseño visual (fase 3.1)** → `03.1 - Rediseño visual.md`, tarea a tarea, con el prototipo en
  `DOC/Maquetas/Stitch/`. Del prototipo se toma la forma, **nunca los datos**: está lleno de
  dirección, horario, productos y testimonios inventados (ver su `LEEME.md`)
- **Panel de contenido (fase 4)** → `04 - Panel de contenido.md`, tarea a tarea, con las 12
  decisiones del 14/09/2026 y las maquetas aprobadas en `DOC/Maquetas/4/`
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
pnpm lighthouse                    # Lighthouse movil contra el build local
PASADAS=5 pnpm lighthouse          # mediana de 5 pasadas: una sola no decide nada
pnpm lighthouse https://pimpos-system-iota.vercel.app   # contra lo desplegado
pnpm supabase:tipos                # regenera src/tipos/database.types.ts
```

El `pre-commit` corre `typecheck` + `lint-staged`. El CI corre todo lo anterior más `build`
implícito en E2E, en Ubuntu, con `--frozen-lockfile`: si el lockfile no cuadra con `package.json`,
falla ahí y no en local.

Supabase — la CLI 2.116.0 ya está instalada globalmente, `supabase` funciona directo:

```bash
supabase start                    # entorno local en Docker (opción A del plan)
supabase db reset                 # reconstruye desde migraciones + semillas
supabase test db                  # 695 pruebas pgTAP
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

- **Los puertos de Supabase caen dentro del rango efímero de Linux, y en el CI eso es una carrera.**
  El proyecto usa 54320–54329 y el rango efímero por defecto es 32768–60999: cualquier conexión
  saliente del runner —bajar la CLI, `pnpm install`, bajar Chromium— puede quedarse el 54322 como
  puerto de origen unos segundos, y entonces Docker no lo puede enlazar y `supabase start` muere con
  `address already in use`. No es culpa de la rama ni del SQL, y por eso salía de vez en cuando y en
  un trabajo distinto cada vez. El CI reserva esos puertos antes de instalar nada
  (`sysctl net.ipv4.ip_local_reserved_ports=54320-54329`): impide el reparto automático sin impedir
  que Docker los enlace a propósito. Si vuelve a fallar, el paso imprime **quién** tiene el puerto
  (`ss` y `docker ps -a`) en vez de dejar el mensaje de Docker a secas.
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
- **El App Router deja montado el DOM de la pantalla anterior** tras una navegación de cliente, para
  que volver sea instantáneo. En una prueba, `getByLabel("Precio (S/)")` encuentra entonces dos
  campos y falla por modo estricto **siempre**, no de vez en cuando. `getByRole` sí respeta el árbol
  de accesibilidad: se busca dentro de la región viva (`getByRole("tabpanel", { name: "Precios" })`)
  y no en toda la página. Salió al navegar de crear a editar un producto (F4, tarea 3).
- **Una prueba que compara dos lecturas hechas en momentos distintos se rompe cuando otra prueba
  escribe entremedias.** La del catálogo leía el total de productos en `/productos` y después el
  número de la portada; desde que el panel publica productos reales durante la suite, podían no
  coincidir. Se leen las dos juntas y se reintenta hasta que concuerdan (`expect(...).toPass()`),
  sin dejar de fallar si la portada trae el número equivocado. Es la misma lección del «el total
  nunca es suyo», aplicada al tiempo y no a la fixture.
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
  **A `AGENTS.md` le pasó lo mismo:** estaba en el `.gitignore` (lo generaba `next dev` y se
  daba por desechable) y no se versionó hasta el 27/09/2026, cuando pasó a ser la guía del proyecto.
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
- **`priority` de `next/image` quedó deprecado en Next 16**, y su sustituto `preload` **no se usa
  cuando hay dos candidatas a LCP según el ancho de pantalla** — lo dice el propio doc de Next. Es
  justo el caso de la portada: `PortadaMovil` y la primera diapositiva del carrusel. `preload`
  inyecta un `<link rel=preload>` en el `<head>` que **no mira el `display:none`**, así que el
  celular se bajaba las dos: 41 KB de la suya y 32 KB de la del carrusel, que no se ve nunca,
  compitiendo por el ancho de banda mientras se mide el LCP. Ya se había intentado tapar con
  `sizes="(max-width: 639px) 1px, 100vw"` y **eso no impide la descarga**: solo hace que el navegador
  elija la candidata más pequeña del `srcset`, que son 640w. Lo correcto: `fetchPriority="high"` en
  las dos, `sizes` **idéntico** en las dos (así resuelven a la misma candidata y se descarga una sola
  vez), y `loading="eager"` solo en la del celular, que es el LCP de la pantalla prioritaria —con
  `lazy` el propio Lighthouse avisa, y el descubrimiento pasaba de 21 ms a 301 ms.
- **Una prueba de imágenes con densidad de pantalla 1 no ve el derroche.** El proyecto `movil` de
  Playwright mide 375 px con `deviceScaleFactor` 1, y con esa densidad las dos candidatas del punto
  anterior elegían la misma imagen del `srcset`: la prueba **pasaba contra el código roto**. No hay
  teléfono con densidad 1. El `test.describe` lleva `test.use({ deviceScaleFactor: 2 })`, y se vio
  fallar antes de arreglar nada.
- **Un elemento fijo fuera de `header`, `main` y `footer` no está en ninguna región.** El botón
  flotante de WhatsApp era el único contenido del sitio fuera de todo landmark, y axe lo marcaba
  (regla `region`) en las cuatro páginas sin botón de pedir propio —en las demás se salvaba solo
  porque estaba `aria-hidden`—. Quien navega por landmarks se lo saltaba entero, que es lo contrario
  de lo que pide R4. Va envuelto en un `<aside aria-label="Pedido rápido">`.
- **Dos `<nav>` con la misma etiqueta son un laberinto para un lector de pantalla.** La cabecera y el
  pie llevaban los dos `aria-label="Secciones del sitio"`: en la lista de landmarks salía dos veces
  lo mismo, sin forma de saber cuál era cuál (axe, `landmark-unique`). El del pie dice ahora
  «Secciones del sitio, en el pie»; el título visible no cambió.
- **Un `<div>` dentro de un `<dl>` solo vale si contiene directamente el `dt` y el `dd`.** En contacto
  cada dato era `dl > div.flex > (icono + div > dt + dd)`, dos niveles de más, y axe lo marcaba dos
  veces (`definition-list` y `dlitem`). El icono va dentro del `<dt>`.
- **Un contraste medido en el navegador puede estar pillando una animación a medias.** Lighthouse
  marcó 4.28 en un enlace de la ficha de producto; el color computado era `#986722` y el token es
  `#8f5a10`, que da 5.06. `#986722` es exactamente `#8f5a10` a **0.913 de opacidad** sobre el crema:
  la aparición por scroll, a mitad de camino. Por eso `e2e/accesibilidad.spec.ts` desactiva las
  animaciones antes de medir. Antes de tocar un token, comprobar si el color que se reporta es el
  del token o una mezcla.
- **Un build local puede servir datos de la base de un build anterior.** Next guarda las respuestas
  de `fetch` —y supabase-js consulta por `fetch`— en `.next/cache/fetch-cache`, y el build siguiente
  las reutiliza. El 14/09 se cargaron novedades y testimonios en la base local, PostgREST los
  devolvía con la llave anónima y la portada, recién construida, seguía sin mostrarlos. Parece un
  problema de RLS y no lo es. Después de cambiar datos a mano: `rm -rf .next/cache/fetch-cache` y
  volver a construir. En el CI no pasa, porque cada ejecución empieza sin caché.
- **Una línea base de rendimiento solo vale el día que se mide.** La tarea 1 de 3.1 anotó 79 de
  mediana en la portada; al cerrar, la fase dio 91, y parecía que el rediseño había mejorado doce
  puntos. Se volvió a construir el commit de antes de la fase y se midió en la misma sesión: **95**.
  La máquina iba más rápida ese día; el rediseño en realidad **costó 4 puntos**. Para comparar
  rendimiento, las dos versiones se miden seguidas, con `git stash` + `git checkout <commit>` +
  build, nunca contra un número guardado de otro día.
- **Un plan que reparte el rediseño por secciones deja huecos entre ellas.** El plan 03.1 nombraba
  cada bloque de la portada menos uno, «Dónde estamos · Horario», que llegó al cierre con el estilo
  de F3 y todas las pruebas en verde: ninguna prueba mira si un titular es azul. Lo encontró
  comparar la portada **entera** con el prototipo, lado a lado. Al cerrar un rediseño, antes de dar
  nada por hecho: capturas de página completa y un `grep` de las clases viejas (`font-heading` sin
  color, `bg-secondary`, `rounded-xl border`).
- **`test-results/` no sirve para guardar informes:** Playwright la vacía al empezar, así que los
  informes de Lighthouse desaparecían en cuanto se corría cualquier prueba. Van a `.lighthouse/`.
- **En Git Bash, `pnpm lighthouse <url> /` no funciona:** MSYS convierte el `/` en una ruta de
  Windows y Lighthouse responde `INVALID_URL`. Es la misma trampa del `docker exec ... /tmp/x.sql`;
  se sale igual, con `MSYS_NO_PATHCONV=1`.
- **Quitar un dato del código no lo quita de la base.** 0024 sacó «22 años» de las cuatro frases
  escritas a mano, y al día siguiente producción seguía diciendo 22: el titular del tercer slide lo
  llevaba dentro, sembrado por 0023. Se vio mirando el HTML desplegado, no leyendo el SQL. En un
  contenido que el negocio edita no se puede calcular la cuenta, así que se dice **el año** y no los
  años: «desde 2004» dice lo mismo y no caduca (0025). La prueba comprueba la regla —ningún texto
  publicable lleva `NN años`— y no el titular concreto.
- **El LCP de la portada móvil no es la imagen: es el hilo principal.** Medido: 36 ms de servidor,
  31 de descubrir la foto y 77 de descargarla — lista en 144 ms. Los **2207 ms** siguientes son
  «element render delay», el navegador sin poder pintar porque está hidratando React. LCP (peso 25) y
  tiempo de bloqueo (peso 30) son **el mismo problema**, así que comprimir fotos, cambiar de formato
  o poner un CDN no mueven nada. Antes de optimizar una imagen, mirar el desglose del LCP.
- **Tres hipótesis de rendimiento medidas y descartadas** (no volver a intentarlas sin leer el doc 03):
  las animaciones de scroll (apagarlas con `--force-prefers-reduced-motion` no mejora); `active:
false` con `breakpoints` en embla (el módulo se descarga igual, el bloqueo se queda igual); y no
  mandar el carrusel al celular con `next/dynamic` — **esta se implementó entera y se revirtió**:
  consiguió el objetivo (embla fuera, 150 → 144 KB) y midió **peor, dos veces**, porque pasar
  contenido del servidor por una frontera de cliente cuesta más que los 8 KB que ahorra.
- **El LCP de la portada en Lighthouse es bimodal, y una mediana de 5 u 8 pasadas no distingue una
  regresión de 3 puntos del azar.** En el modo simulado, cada pasada de `/` da ~2.65 s (96) o
  ~3.4 s (90), sin término medio. Lantern mete en el grafo del LCP todo script cuya evaluación
  **empiece** antes de la marca de LCP. En localhost, el chunk de React (229 KB) casi siempre termina
  de bajar mientras se pinta el primer fotograma y se evalúa antes de que ese fotograma se presente,
  así que su descarga a 4G simulado suma +750 ms. Pasa en el 70–80 % de las pasadas, antes y después
  de F4. Así nació la «regresión» de F4 (96 frente a 90.5): eran dos muestras pequeñas de la misma
  moneda cargada. Con 37 pasadas intercaladas salió `ae96d1b` 91 y `main` 91 (p = 0.25). Una build
  **idéntica byte a byte** dio 95 frente a 91 con 12 pasadas: ese es el tamaño del ruido. Para
  comparar dos versiones: builds guardadas y medidas **intercaladas**, muchas pasadas, contar
  cuántas caen en cada modo (LCP por encima o por debajo de 3 s) y comparar la media con una prueba
  de permutación, con un control A/A al lado. Si hace falta saber si un cambio cuesta de verdad, se
  mide con `throttlingMethod: "devtools"` y se miran tiempos de la traza (fin del CSS, inicio del
  layout), que no son bimodales. Un coste pequeño y conocido que salió así: el CSS global creció un
  30 % con las clases del panel (13.8 → 16.9 KB comprimido, la misma hoja bloqueante para el sitio
  público) y con estrangulamiento real llega ~65 ms más tarde, sin mover FCP, LCP ni la puntuación.
  Separar las utilidades del panel en su propia hoja lo recuperaría.
- **Una sola medición de Lighthouse no decide nada.** La misma portada, cinco veces seguidas y sin
  tocar nada: 71, 91, 81, 80 y 82. Con una pasada se puede «demostrar» casi cualquier cosa, y así se
  llegó a dar por bueno un cambio que empeoraba. `PASADAS=5 pnpm lighthouse` informa la mediana con
  todas las pasadas al lado.
- **Un número que cuenta años no se escribe, se calcula.** «22 años» y «Veintidós años» estaban a
  mano en la franja de la portada, en el titular de la historia y en la descripción de nosotros para
  Google. No fallan nunca: el 1 de enero siguiente pasan a mentir los cuatro a la vez, en silencio, y
  el de Google es el que más tarda en notarse. El año de apertura vive en `configuracion_sitio`
  (0024) y la cuenta sale de `anosDeOficio()`. Vale para cualquier dato derivado del reloj.
- **Un dato que se dice en dos sitios se lee del mismo origen.** «Aquí el día empieza a las 4:00 a.
  m.» y la tabla de horarios del pie dicen lo mismo; si el titular llevara la hora escrita, el día
  que el negocio cambie el turno desde el panel la página se contradiría sola. Sale de
  `primeraAperturaEscrita()`, y hay prueba E2E de que las dos coinciden.
- **Una migración que carga datos va con el trigger de auditoría apagado.** Lo hacen 0019 y 0023, y
  0024 se olvidó: la fila nueva entró auditada y sin autor, y tiró una prueba de 0007 que no menciona
  la configuración por ningún lado. No es un cambio que hiciera una persona, es el estado de partida.
- **Una restricción `check` solo admite funciones inmutables.** `extract(year from now())` como
  límite superior no compila. Un rango fijo y ancho cumple igual su papel, que es cazar un valor con
  la forma equivocada, no auditar la fecha.
- **Añadir un campo al esquema Zod de la configuración rompe los fixtures de prueba**, no el código
  de la aplicación: `Configuracion` es el tipo inferido, y los dos archivos que construyen una
  configuración completa a mano (`configuracion.test.ts`, `datos-estructurados.test.ts`) dejan de
  compilar hasta que se les añade el campo. Es justo lo que se quiere.
- **Quitarle el fondo a una ilustración es un problema de topología, no de color.** El crema del
  papel y el crema de la argamasa entre los ladrillos del horno son el MISMO color: ninguna clave de
  color los separa. Lo que los distingue es que uno toca el borde y el otro está encerrado, así que
  se rellena por inundación desde un marco de 1 px. Las motas de grano que el relleno no alcanza se
  quitan por **densidad local** y no con morfología: una línea fina del grabado tiene vecinas y una
  mota no, y una apertura obligaría a elegir entre dejar motas o adelgazar el trazo. Todo en
  `scripts/preparar-ilustracion.py`, que además deja el asset en 130 KB desde los 2.4 MB del original.
- **Antes de recortar una fuente OFL, leer si declara un _Reserved Font Name_.** Playfair Display lo
  declara («Playfair Display»), y la OFL prohíbe que una **versión modificada** lo lleve. Recortar a
  latín o fijar un peso es modificar, así que la derivada se llama «Playfair Pimpos» por dentro
  —el trazo no cambia, y el nombre CSS lo pone `next/font`, no la tabla `name`—. Fraunces, Inter y
  Plus Jakarta Sans no declaran ninguno. Se ve en la primera línea del `OFL.txt` de cada fuente, y
  `scripts/preparar-fuentes.py` falla si el nombre reservado sigue dentro del archivo.
- **`GET /rest/v1/` (la raíz) exige `service_role` en el alojado** — devuelve el esquema OpenAPI
  completo. Con la `anon` responde 401 `"Only the service_role API key can be used for this
endpoint"`. Para un ping se consulta una tabla real; meter la `service_role` en un workflow
  sería poner una llave que salta toda la RLS dentro de un ping.
- **React 19 vacía un `<form action={...}>` al terminar la acción, también cuando vuelve con
  errores.** Es justo cuando la persona necesita ver lo que escribió para corregirlo. Por eso
  `FormularioPanel` (F4) envía con `onSubmit` + `startTransition`, no con `action`.
- **Radix Tabs desmonta el panel oculto**, así que un campo en una pestaña que no está activa pierde
  su valor al cambiar de pestaña, salvo que se le pase `forceMount`. `PestanasFormulario` lo usa en
  las tres pestañas del formulario de producto (F4, tarea 3) precisamente por esto.
- **La copia local de un formulario no restaura un control de Radix** (un `Select`, un `Switch`):
  esos componentes no son `<input>` nativos y no leen su valor de un atributo `value` del DOM. El
  borrador guarda y devuelve el dato, pero el componente tiene que aplicarlo él mismo al montar, no
  basta con rellenar el HTML.
- **La RLS decide qué filas se pueden tocar, no qué valor se escribe en ellas.** La política de
  `perfiles` (0003) deja que un administrador edite su propio perfil, y eso incluía poder ponerse
  `rol = 'superadmin'`: la fila era suya, así que la política lo dejaba pasar. Se cierra con un
  trigger (0029, `app.proteger_perfiles()`), que sí puede mirar de qué valor a qué valor cambia una
  columna. Regla general: cuando lo que importa es la transición de un valor y no solo la fila, hace
  falta un trigger además de la política.
- **Una escritura con `service_role` no pasa por los triggers que dependen de la sesión**, porque
  `auth.uid()` es NULL para ese rol. `app.proteger_perfiles()` (0029) no ve una llamada de la Admin
  API. Cada camino que usa `service_role` (F4, tarea 6: restablecer contraseña, desactivar) repite su
  propia comprobación de autorización contra la sesión de quien pide la acción (`perfilDeOtro()`,
  `puedeGestionarAcceso()`, `puedeRestablecerClave()`) antes de tocar Auth — la regla en Postgres no
  basta cuando el camino la puede rodear.
- **`setInputFiles` como primera interacción después de `goto` se pierde si llega antes de que React
  hidrate.** El evento se dispara sobre el DOM del servidor y no hay manejador todavía escuchando.
  Rellenar antes un campo de texto (que fuerza la espera a la hidratación) resuelve la carrera.
- **`PestanasFormulario` salta a la PRIMERA pestaña con error, no a la que se estaba viendo.** Es a
  propósito (el plan de F4 lo pide: una pestaña con errores se marca en rojo con un punto), pero una
  prueba que espera quedarse en la pestaña actual tras un error de otra falla si no lo tiene en
  cuenta.
- **Dos proyectos de Playwright en paralelo escribiendo la misma fila compartida se pisan.** Pasó con
  `configuracion_sitio` (una tabla singleton) y con el orden de `faqs`: `test.describe.configure({
mode: "serial" })` solo ordena pruebas **dentro** de un proyecto, no entre los dos proyectos
  (`movil` y `escritorio`), que corren en workers separados y a la vez. Salidas usadas en F4: cuando
  la prueba escribe en una fila global, restringirla a un solo proyecto
  (`test.skip(info.project.name !== "movil", ...)`, como ya hacía `panel-cascara.spec.ts`); cuando
  además hace falta que dos operaciones no se crucen (crear y reordenar en la misma lista), un
  cerrojo entre procesos (`e2e/ayudas/cerrojo.ts`: `mkdir` atómico con dueño y latido, se rompe solo
  si lleva 15 s sin renovarse).
- **`getClaims()` verifica la firma del JWT en local y no puede ver que la sesión se borró en el
  servidor.** El token sigue siendo válido criptográficamente hasta que expira (hasta 1 h), aunque
  `auth.sessions` ya no tenga la fila. Para saber si una sesión sigue abierta de verdad (F4, tarea 6:
  desactivar/restablecer/cambiar rol cierran en el acto) hace falta preguntarle a la base
  (`public.sesion_abierta()`, un RPC), no a la firma del token.
- **Un PR se puede fusionar mientras todavía hay rondas de revisión abiertas sobre él.** Pasó con el
  PR #57 de F4 (tarea 6): se fusionó en un commit intermedio y las rondas 2–4 quedaron sin destino.
  La salida fue abrir un PR nuevo desde una rama renombrada con los commits que faltaban, no forzar
  nada sobre `main`. Si el ritmo de fusión no está claro, confirmar antes de seguir arreglando sobre
  una rama que ya se fusionó.
- **`ghcr.io` puede responder `toomanyrequests` en el paso «Levantar Supabase» del CI**, antes de
  tocar ninguna migración. Es infraestructura compartida de GitHub Container Registry, no un fallo
  del PR: se relanza el job más tarde y pasa.

- **Un valor nuevo de un enum no se puede usar en la misma transacción que lo crea**, y cada
  migración es una transacción. Por eso `ajuste` y `anulacion` van solos en 0033, y 0034 ya los usa.
- **`INSERT … ON CONFLICT DO UPDATE` comprueba los `check` sobre la fila candidata antes de mirar el
  conflicto.** Con `saldos_lote.cantidad_base >= 0`, sumar un delta negativo por esa vía fallaba
  siempre, aunque el valor final fuera positivo. `app.mover_saldo_lote` (0034) hace `update` y, si
  no hay fila, `insert`.
- **Dentro de una transacción `now()` es el mismo para todas las filas**, así que `created_at` no
  desempata. El FEFO entre lotes sin fecha y el «último costo conocido» usan `lotes_insumo.llegada`
  (identidad), no la fecha de creación.
- **El trigger `BEFORE` corre antes que la política RLS `WITH CHECK`.** Un repartidor que intenta
  registrar un consumo no recibe 42501: el trigger de conversión falla antes (no puede ver el
  insumo) con 23503. Una prueba negativa así comprueba que **no entra nada**, no el código del error.
- **El check del saldo va solo en `saldos_lote`.** Los triggers `AFTER` del mismo evento corren por
  orden alfabético y `movimientos_actualizar_saldo` va antes que el reparto: con un check también en
  `saldos_insumo`, el consumo que no alcanza chocaría primero con él (un 23514 mudo) y la frase
  «Solo hay 30 kg de Harina…» no llegaría nunca.
- **Un archivo `"use server"` solo puede exportar funciones asíncronas.** Exportar una constante
  (`RUTA_INSUMOS`) desde `src/lib/acciones/insumos.ts` rompió `pnpm build`; vive en
  `src/lib/insumos/rutas.ts`.
- **`supabase db push` sube lo que haya en `supabase/migrations/` de la carpeta, tenga commit o no.**
  El 25/09 Dan hizo push mientras un subagente tenía la 0035 a medio escribir en la misma carpeta:
  producción aplicó una 0035 sin el trigger que impide retirar un insumo con existencias, y Supabase
  **no vuelve a ejecutar** una versión ya registrada, así que no avisó de nada. Se reparó repitiendo
  la 0035 final, de forma idempotente, al principio de la 0036 (aún sin aplicar). Regla desde
  entonces: el push se hace con la carpeta quieta, después de la revisión y sin nadie trabajando.
  Para comprobar qué aplicó producción:
  `select version, md5(array_to_string(statements, E'\n')) from supabase_migrations.schema_migrations`,
  y compararlo con la base local.
- **Nunca enlazar `node_modules` desde otra carpeta.** Para un push se montó un `git worktree` con un
  enlace (junction) al `node_modules` del repositorio; al borrar el worktree se borraron archivos de
  `node_modules/.pnpm` a través del enlace y hubo que reinstalar, con el editor cerrado: VS Code y su
  servidor de Playwright bloquean la carpeta y `pnpm install` responde «Acceso denegado».
- **Las E2E de insumos dejan movimientos que no se pueden borrar** (el kárdex no admite `delete`, y
  `responsable_id` impide borrar al usuario de prueba). En la base local eso desajusta cuentas de
  pgTAP (0011, 0012, 0034) hasta un `supabase db reset`. En el CI no pasa: pgTAP y Playwright van en
  trabajos separados. Lo que una E2E crea y **sí** se puede borrar (un insumo sin movimientos, un
  proveedor) se borra en un `finally`.
- **Para dar stock a una prueba, un ajuste relativo, nunca «leer el saldo y escribir el total».**
  `sumarStock()` (`e2e/ayudas/insumos.ts`) inserta un `ajuste` con `sentido: 1`; la versión que leía y
  llamaba a `registrar_conteo` con un total absoluto se pisaba entre pruebas en paralelo.
- **`getByLabel` busca por subcadena.** «Precio por unidad 1» contenía «Unidad 1» y la prueba fallaba
  por modo estricto; «Número» chocaba con «Es otro documento aunque el número se repita». Etiquetas
  que no se contengan unas a otras, o `{ exact: true }`.
- **recharts 3 hace el gráfico enfocable** (`accessibilityLayer`: `role="application"`,
  `tabindex="0"`), y dentro de un bloque `aria-hidden` axe lo marca (`aria-hidden-focus`). El gráfico
  lleva `accessibilityLayer={false}`: lo accesible es la tabla de al lado.
- **`exceljs` declara su propio `interface Buffer` global**, y sus tipos no aceptan el `Buffer` de
  Node en `workbook.xlsx.load()`, aunque en ejecución es lo que lee. Se convierte en la llamada
  (`as unknown as Parameters<typeof libro.xlsx.load>[0]`), con un comentario; no se cambia el tipo
  que devuelve `reporteAExcel`.
- **Una variable de entorno vacía del proceso gana a `.env.local`.** `@next/env` solo rellena las que
  el proceso no tiene (`hasOwnProperty`), aunque la del proceso sea `""`. Por eso el servidor de las
  E2E arranca con `RESEND_API_KEY: ""` y `CORREO_ALERTAS: ""` en `playwright.config.ts`: nunca manda
  un correo de verdad, tenga quien tenga su llave en local.
- **Un texto oculto para lectores de pantalla también lo encuentra `getByText`.** El lápiz de editar
  llevaba su nombre en un `<span class="sr-only">Editar Harina</span>`, y toda prueba que buscaba la
  fila con `getByText("Harina")` pasó a encontrar dos elementos y a fallar por modo estricto. Un
  control con icono lleva su nombre en `aria-label`, que no crea un segundo nodo de texto.
- **Una violación de modo estricto no se reintenta.** Con un buscador que filtra tras una pausa, la
  comprobación siguiente corre sobre la lista SIN filtrar y falla al instante, aunque el
  `expect` tenga 20 s. Antes de comprobar, esperar a que la lista quede filtrada (p. ej. cuántos
  lápices «Editar» hay).
- **Next le quita al proxy las cabeceras del router** (`rsc`, `next-router-prefetch`,
  `next-router-state-tree`…: `FLIGHT_HEADERS` en `server/web/adapter.js`), así que desde
  `src/proxy.ts` una precarga de `<Link>` no se distingue de una navegación. Pasó con la marca de
  actividad: las precargas la renovaban y una pestaña quieta no caducaba nunca. Lo que sí llega es
  `sec-fetch-dest`, que pone el navegador: `document` solo en una carga de página entera.
- **Un botón más por fila puede sacar los demás de la tarjeta a 375 px.** Con el lápiz, preguntas
  pasó a cuatro botones (188 px) y, con una palabra larga sin cortes en el texto, el enlace no
  encogía por debajo de ella (`min-width: auto` de un hijo flex): los botones acababan en x = 544,
  tapados por la tarjeta de al lado. La E2E de reordenar falló dos de cada tres veces «al azar»
  —dependía del largo del sufijo aleatorio— y pasaba en `main`; se llegó a atribuir a un cerrojo
  huérfano. Lo que lo destapó fue correr la misma tanda contra `main` y leer la traza del clic
  («… intercepts pointer events»). El texto de una fila lleva `min-w-0` y `wrap-anywhere`, y los
  botones `shrink-0`. **Un fallo que solo sale a veces no es intermitente hasta que `main` pasa la
  misma tanda y la traza dice otra cosa.**
- **Las columnas de una vista salen nullables en los tipos generados**, aunque en la tabla sean
  `not null` (`existencias_insumo`). Se normalizan al leer (`?? ""`, `?? false`), nunca con `!`.

**Trampas de F6 (clientes):**

- **Un trigger diferido no se ve en pgTAP**, porque la prueba termina en `rollback` y nunca llega al
  final de la transacción. Se fuerza con `set constraints clientes_exige_permiso immediate` (y se
  vuelve a `deferred`). Y mientras haya eventos diferidos en cola, Postgres **no deja**
  `alter table … disable trigger` («pending trigger events»): se resuelven antes con el mismo
  `immediate`.
- **Un `case` de PL/pgSQL resuelve sus dos ramas.** `case when tg_table_name = 'clientes' then new.id
else new.cliente_id end` falla en `clientes` («record "new" has no field "cliente_id"»), aunque esa
  rama no se elija. Va con `if`.
- **Una tabla que solo lee la administración no la ve un trigger que corre como el repartidor.**
  `supresiones` tiene RLS de lectura solo para la administración, y la regla de «lo borrado no se
  vuelve a llenar» tiene que verla con cualquier rol: el trigger llama a una función
  `security definer` (`app.datos_borrados`). Lo mismo la política de Storage
  (`app.carpeta_admite_fotos`).
- **`storage.remove()` no da error cuando la RLS no deja borrar**: devuelve una lista vacía. Para
  saber si quedó algo hay que volver a listar la carpeta (`vaciarCarpeta`).
- **El `DELETE` de Storage con `prefixes` recibe nombres exactos, no carpetas.** `["<id>/"]` no borra
  nada; se lista la carpeta y se borran los archivos por su nombre.
- **PostgREST no devuelve más de 1000 filas por petición** (`max_rows`, en local y en el alojado), sin
  avisar. Una descarga de «todos» se cortaba ahí: se lee por páginas con `leerTodas`
  (`src/lib/clientes/paginas.ts`).
- **Leaflet dentro de una pestaña oculta (`forceMount`) nace gris**: lee tamaño 0, pide una tesela y
  no se recalcula al verse. `SelectorUbicacion` lleva un `ResizeObserver` que llama a
  `invalidateSize()`. Arregló también el mapa de Configuración, que ya salía así desde F4.
- **El globo de Leaflet se pinta con `innerHTML`.** Un nombre de cliente con `<img onerror>` se
  ejecutaba en la sesión de quien abría la ficha (un ingeniero podía robar la de un administrador).
  Todo texto escrito por una persona pasa por `escaparHtml` antes de ir a un globo, también en el
  mapa del sitio público.
- **Un control que guarda solo, dentro de un `FormularioPanel`, le escribe a la copia local.** La foto
  de un cliente se guarda al subirla, pero su campo oculto y su evento `input` dejaban «Tienes cambios
  sin guardar», y «Recuperarlos» podía pisar la corrección de otra persona. `SubidaImagen inmediata`
  no deja rastro en el formulario.
- **`BuscadorEnVivo` arma la dirección solo con sus campos**, así que borraba `vista=mapa` al buscar.
  Lo que haya que conservar va en `conservar`.
- **Dos botones de texto junto al nombre lo dejan en 0 px a 375 px** (el lápiz más «Sigue siendo
  cliente» y «Borrar sus datos»), y en la tabla de escritorio el lápiz encogía por debajo de 44 px.
  `ListaAdaptable accionesDebajo` los baja a su propia fila en el celular; el lápiz lleva `shrink-0` y
  la celda de acciones `flex-wrap`. Lo cazó la prueba de área táctil **solo cuando la lista tenía una
  fila**: con la lista vacía pasaba.
- **Una prueba que pasa antes del arreglo no prueba el arreglo.** La del mapa gris abría la pestaña
  antes de que Leaflet cargara, así que el mapa nacía visible y pasaba contra el código roto. Espera
  a que el mapa exista (todavía oculto) antes de abrir la pestaña.
- **`clientes_para_revisar` mira la ficha, sus fotos y su permiso.** Para envejecer un cliente en una
  prueba hay que envejecer los tres (`envejecer()` en `e2e/panel-clientes-administracion.spec.ts`),
  con los triggers de `updated_at` apagados, por `sqlLocal` (`e2e/ayudas/base.ts`, `docker exec` con
  el SQL por la entrada estándar).
- **El orden de la limpieza en una E2E importa.** `created_by`, `registrado_por`, `borrado_por` y
  `exportado_por` apuntan a `auth.users` sin `on delete`: si se borra antes al usuario de prueba,
  `borrarUsuario` falla **sin avisar** y el usuario se queda. Primero el cliente (y su constancia o su
  descarga), al final el usuario. Y una prueba que se corta por tiempo puede no terminar su limpieza:
  deja un cliente que otra prueba encuentra después.

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
- `src/app/(admin)/` — contenido (categorías, productos, novedades, portada, galería, preguntas,
  guías, testimonios), usuarios, configuración, insumos (F5) y clientes (F6). La auditoría queda
  para F7.
  Dinámico y siempre autenticado. **Construido en F4** (las 7 tareas de contenido + cierre, cerrada
  el 24/09/2026): la cáscara vive en `src/components/panel/` (barra lateral en escritorio, barra
  inferior fija a 375 px, lista que pasa de tabla a tarjetas nunca a scroll lateral, formulario con
  copia local automática en el navegador — «Tienes cambios sin guardar… Recuperarlos / Descartar» —,
  formularios largos en pestañas con un solo «Guardar», subida de fotos comprimidas en el navegador)
  y la lógica en `src/lib/panel/`. **Toda mutación pasa por `ejecutarAccion()`**
  (`src/lib/panel/accion.ts`): vuelve a exigir acceso (`exigirAcceso`), valida con el mismo esquema
  Zod que el navegador, traduce el error de Postgres a una frase que dice qué hacer, y refresca el
  sitio con `updateTag` usando la etiqueta de `src/lib/datos/etiquetas.ts` que corresponda
  (`catalogo`, `novedades`, `contenido` o `marca`). La copia local vive en `src/lib/panel/borrador.ts`
  (claves `pimpos:borrador:*`) y se borra al cerrar sesión y al llegar a `/ingresar` sin sesión —
  contiene datos que pueden ser personales, así que no sobrevive a un cambio de quién está sentado
  frente al teclado. `src/lib/supabase/administrador.ts` es el único archivo que lee
  `SUPABASE_SERVICE_ROLE_KEY` (`import "server-only"`), y solo lo usan las páginas y acciones de
  `/admin/usuarios`, siempre después de `exigirAcceso`. Hay una prueba de axe y otra de área táctil
  **por cada ruta** del panel (`e2e/panel-accesibilidad.spec.ts`, 41 rutas): al añadir una ruta, se
  añade a `RUTAS_DEL_PANEL`.
  - **Editar tiene su lápiz, y buscar filtra al escribir** (arreglos del 29/09/2026, pedidos por
    Dan al probar como superadmin). `ListaAdaptable` recibe `editar` (y `nombreFila` si la columna
    principal no es texto) y pinta un lápiz «Editar …» junto a borrar, en una columna «Acción»; en
    insumos el nombre abre la ficha y el lápiz, el formulario. Los buscadores de productos e insumos
    son `BuscadorEnVivo`: cambian la dirección con `router.replace` dentro de una transición, tras
    una pausa de 250 ms, sin recargar la página; la base sigue filtrando.
  - **Dos horas sin usar el panel cierran la sesión.** Supabase solo lo ofrece en el plan de pago,
    así que lo lleva la aplicación con la cookie `pimpos_actividad` (`src/lib/auth/inactividad.ts`),
    siempre en **hora del servidor**: la escriben el ingreso, el proxy (solo al cargar una página
    entera del panel, `sec-fetch-dest: document`) y el navegador al tocar o escribir
    (`VigiaInactividad`, como mucho una vez por minuto, corrigiendo el desfase de su reloj con la
    marca que acaba de poner el proxy). El proxy la mira en cada petición del panel y del ingreso;
    con más de dos horas, o **sin marca** (falla cerrado), cierra la sesión y lleva a
    `/ingresar?motivo=inactividad`. El navegador, con la pestaña quieta o si la marca desaparece
    (salieron en otra pestaña), navega a `/ingresar` y deja que el proxy cierre: no usa una Server
    Action, que el proxy interceptaría. Dura 400 días, como las cookies de sesión, y salir la borra;
    una marca vencida se conserva, así el ingreso sabe decir por qué se cerró.
  - **La sesión se cierra en el acto, no en la próxima hora.** Desactivar a alguien, eliminarlo,
    restablecerle la contraseña o cambiarle el rol borra sus filas de `auth.sessions` (0030 + 0032):
    `app.rol_actual()` devuelve NULL si la `session_id` del JWT ya no existe, y el panel se entera
    preguntando a `public.sesion_abierta()` — en `obtenerSesion()` (cada página y cada Server Action,
    vía `exigirAcceso`) y, en el proxy, solo en `/ingresar` y `/cambiar-clave` (se descartó
    `getUser()` de Auth por coste medido: ~0.2–0.36 s por llamada contra ~0.02 s del RPC contra
    PostgREST). No queda ningún límite conocido de «hasta una hora» en estos cuatro caminos.
- `src/app/(admin)/admin/insumos/` — **F5**: Existencias, alta y edición de insumos
  con sus unidades de compra, proveedores, registrar ingreso (una boleta de varias líneas, con aviso
  de documento repetido) y consumo del día, ficha del insumo con lotes y kárdex, anular
  (administración), conteo físico (administración; también el inventario inicial), bajas pedidas por
  el ingeniero y aprobadas o rechazadas por la administración, y reportes con gráfico y tabla. La
  lógica del inventario vive en Postgres: triggers que reparten cada movimiento entre lotes
  (`movimiento_lotes`, `saldos_lote`), funciones de varias líneas en una transacción
  (`registrar_ingreso`, `registrar_consumo`, `registrar_conteo`) y reportes calculados por la base
  (`reporte_*`, `kardex_insumo`). La lógica pura del navegador está en `src/lib/insumos/` (unidades,
  periodos en días de Iquitos, formato de reportes); **las cantidades y el dinero viajan como texto**
  hasta la base y el navegador solo los enseña. Insumos no toca el sitio público: sus acciones pasan
  `etiquetas: []` y `recharts` solo carga en `/admin/insumos/reportes/[reporte]`.
- `src/app/(admin)/admin/clientes/` — **F6** (tareas 1–6): la lista con buscador en vivo, filtro por
  zona y activos/desactivados y vista Lista o Mapa (`MapaClientes`); en cada cliente **Llamar**,
  **WhatsApp** y **Cómo llegar** (`BotonesContacto`); la ficha con fotos por **URL firmada de 10
  minutos** (el bucket `clientes` es privado) y el permiso (versión, fecha, quién); el alta en
  pestañas (Datos · Ubicación y fotos · Permiso) con aviso de celular repetido y punto opcional
  («Usar mi ubicación»), que al guardar lleva a añadir las fotos —la política del bucket solo deja
  subir a la carpeta de un cliente que ya existe—; editar (encargados), «Corregir» (repartidor:
  referencia, punto y fotos), desactivar; y, solo para la administración, zonas, «Borrar sus datos»
  (con los archivos de su carpeta y un reintento si Storage falla), «Para revisar» (sin cambios en 2
  años) y la descarga en Excel o PDF, que queda anotada en `exportaciones_clientes` **antes** de salir
  el archivo. Las reglas viven en la base (0042, 0043); la lógica pura en `src/lib/clientes/`
  (`contacto.ts` normaliza el celular igual que `buscar_clientes`, `permiso.ts` guarda el texto con
  su versión y una huella que falla si alguien lo cambia sin subirla, `paginas.ts` lee por páginas
  por el tope de 1000 filas de PostgREST). Tampoco toca el sitio público (`etiquetas: []`).
  - **Descargas** (T7): cada reporte se baja en Excel y PDF desde dos route handlers,
    `reportes/[reporte]/{excel,pdf}/route.ts`, que comparten `descargarReporte()`: el mismo acceso
    que la página (`exigirAcceso`) y los mismos datos (`leerReporte`). `exceljs` y
    `@react-pdf/renderer` solo viven ahí (ningún archivo de `.next/static` los trae); las TTF del
    PDF viajan a Vercel por `outputFileTracingIncludes` en `next.config.ts`.
  - **Correo** (T8): `src/lib/correo/` y `src/app/api/avisos/diario/route.ts`, el único route
    handler fuera del panel. Lo llama el cron de Vercel (`vercel.json`) con `CRON_SECRET`; usa la
    `service_role` porque corre sin sesión, y solo lee avisos y los marca como enviados.
- `middleware.ts` — refresco de sesión + guardia por rol.
- Mutaciones por **Server Actions** validadas con Zod; no hay API REST propia salvo webhooks puntuales.

**La seguridad vive en la base.** El rol viaja dentro del JWT vía _custom access token hook_, y las
políticas RLS lo leen con `app.rol_actual()` / `app.es_rol(...)` sin consultar otra tabla. Ocultar
un botón en la interfaz nunca cuenta como control de acceso: si la regla importa, va también como
política o restricción en Postgres (p. ej. la aprobación de promociones y la autorización de bajas
de insumo son triggers/`check`, no validaciones de formulario).

**Cuatro roles:** `superadmin` (único que elimina usuarios, que le cambia el rol a otro superadmin, o
que le restablece la contraseña a un administrador — matriz completa de quién gestiona el acceso de
quién en `puedeGestionarAcceso()`/`puedeRestablecerClave()`, `src/lib/validaciones/usuario.ts`) ·
`administrador` · `ingeniero` (crea promociones pero no las publica; desde F4 tampoco resuelve avisos
de promoción ni escribe en el bucket `marca`; en insumos registra ingresos y consumos y **pide** bajas, pero
no ajusta, no anula ni aprueba; en clientes registra, edita y desactiva, pero no borra datos ni
exporta) · `repartidor` (solo clientes: los ve todos, llama y corrige referencia, punto y fotos; no
da altas, no quita fotos ni ve insumos). Matriz completa de RLS
en el doc 02 §11.

**Esquemas Postgres:** `public` para lo que el frontend consulta; `app` para auditoría, funciones
internas, hooks y cron — **no se expone por PostgREST**.

**Las 43 migraciones** (`supabase/migrations/`), en orden:

| Archivo                            | Contenido                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| ---------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `0001_extensiones`                 | Esquema `app` + las 5 extensiones. `pg_cron` va en `pg_catalog`                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `0002_comunes`                     | Los 6 enums, `app.set_updated_at()`, `app.rol_actual()`, `app.es_rol()`                                                                                                                                                                                                                                                                                                                                                                                                                |
| `0003_roles_perfiles`              | `roles`, `perfiles`, el hook `app.custom_access_token()` y sus políticas                                                                                                                                                                                                                                                                                                                                                                                                               |
| `0004_catalogo_roles`              | Las 4 filas de `roles` — migración, no semilla, ver la trampa de abajo                                                                                                                                                                                                                                                                                                                                                                                                                 |
| `0005_perfil_automatico`           | Trigger sobre `auth.users` que crea el perfil                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| `0006_perfil_siempre_inactivo`     | El trigger deja de leer el rol de los metadatos                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `0007_auditoria`                   | `app.auditoria`, trigger genérico y la vista `public.auditoria`                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `0008_configuracion`               | `configuracion_sitio` y sus ~24 valores de la ficha                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| `0009_catalogo`                    | Categorías, productos, variantes, imágenes e historial de precios                                                                                                                                                                                                                                                                                                                                                                                                                      |
| `0010_contenido`                   | Novedades con aprobación, slides, guías, galería, faqs, testimonios                                                                                                                                                                                                                                                                                                                                                                                                                    |
| `0011_insumos`                     | Unidades, equivalencias, proveedores, almacenes y `app.convertir_a_base()`                                                                                                                                                                                                                                                                                                                                                                                                             |
| `0012_kardex`                      | Lotes, movimientos, saldos por trigger y `app.recalcular_saldos()`                                                                                                                                                                                                                                                                                                                                                                                                                     |
| `0013_clientes`                    | Zonas, clientes, fotos, consentimientos y `app.sin_tildes()`                                                                                                                                                                                                                                                                                                                                                                                                                           |
| `0014_storage_politicas`           | Las 12 políticas de los 7 buckets                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| `0015_cron_alertas`                | `notificaciones`, `app.evaluar_alertas()` y los 2 trabajos de cron                                                                                                                                                                                                                                                                                                                                                                                                                     |
| `0016_vistas`                      | Las 9 vistas de lectura del sitio público                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| `0017_pedidos`                     | Condiciones del delivery en `configuracion_sitio`, con su forma comprobada                                                                                                                                                                                                                                                                                                                                                                                                             |
| `0018_faq_horario`                 | La respuesta del horario en 12 h. Repite las horas como texto libre: si cambia el horario, cambia también ella                                                                                                                                                                                                                                                                                                                                                                         |
| `0019_historia`                    | La historia del negocio, reescrita en la voz de `docs/marca.md`                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `0020_slides_enfoque`              | `slides.enfoque`: por qué altura se recorta cada foto del carrusel. La vista `slides_publicos` lo expone                                                                                                                                                                                                                                                                                                                                                                               |
| `0021_testimonios_sin_demo`        | `testimonios_publicos` deja fuera los `es_demo`: un testimonio inventado es una reseña falsa                                                                                                                                                                                                                                                                                                                                                                                           |
| `0022_presentaciones`              | `productos_publicos` manda todas las presentaciones con su precio, no solo cuántas hay                                                                                                                                                                                                                                                                                                                                                                                                 |
| `0023_slides_reales`               | Las tres diapositivas de portada, reales. Producción no carga semillas: el hero va en migración                                                                                                                                                                                                                                                                                                                                                                                        |
| `0024_anio_fundacion`              | El año de apertura (2004) en la configuración: la cuenta de años deja de estar escrita a mano                                                                                                                                                                                                                                                                                                                                                                                          |
| `0025_slide_sin_cuenta`            | El tercer slide decía «22 años»: pasa a decir el año de apertura, que no caduca                                                                                                                                                                                                                                                                                                                                                                                                        |
| `0026_autoria`                     | `created_by`/`updated_by` los pone un trigger con el usuario del JWT, en toda tabla que tenga las dos columnas                                                                                                                                                                                                                                                                                                                                                                         |
| `0027_guardar_producto`            | `public.guardar_producto`: el producto y sus presentaciones, en una sola transacción. `security invoker`                                                                                                                                                                                                                                                                                                                                                                               |
| `0028_aprobacion_con_aviso`        | Flujo de aprobación de promociones completo: aviso al administrador cuando una entra en revisión, comentario de devolución para el ingeniero                                                                                                                                                                                                                                                                                                                                           |
| `0029_perfiles_protegidos`         | Trigger `app.proteger_perfiles()`: nadie cambia su propio rol/`activo`/`deleted_at`, solo el superadmin da o quita el rol superadmin, el `id` de un perfil no se puede mover                                                                                                                                                                                                                                                                                                           |
| `0030_sesiones_cerradas`           | Desactivar a alguien o restablecerle la contraseña le cierra la sesión **en el acto**: `app.sesion_vigente()`, `app.rol_actual()` ya no reconoce una `session_id` borrada, `public.cerrar_sesiones()` (solo `service_role`) y `public.sesion_abierta()` que consulta el panel. Guarda de privilegios: se niega a aplicarse si el rol de la migración no puede `SELECT`/`DELETE` sobre `auth.sessions` o no tiene `BYPASSRLS`                                                           |
| `0031_guardar_configuracion`       | `public.guardar_configuracion`: hasta ~30 filas de `configuracion_sitio` de una vez, todas o ninguna. Numerada 0031 y no 0030 porque T6 (sesiones) ya había tomado ese número                                                                                                                                                                                                                                                                                                          |
| `0032_revision_final`              | Cuatro arreglos de la revisión final de F4: cierra avisos de revisión huérfanos al borrar una promoción, el cambio de **rol** también cierra la sesión en el acto, solo superadmin/administrador escriben en el bucket `marca`, el ingeniero solo resuelve avisos de insumo (no los de promoción)                                                                                                                                                                                      |
| `0033_tipos_kardex`                | `ajuste` y `anulacion` en el enum de movimientos, solos: un valor nuevo no se usa en la misma transacción                                                                                                                                                                                                                                                                                                                                                                              |
| `0034_kardex_lotes`                | Kárdex por lotes: `sentido`, `anula_a`, costo por lote, `movimiento_lotes`, `saldos_lote` (nunca negativo), reparto FEFO por trigger, ajuste y anulación solo administración, baja solo con `autorizado_por` = quien la registra, unidad base fija si hay movimientos, alerta de vencimiento por lote                                                                                                                                                                                  |
| `0035_guardar_insumo`              | `public.guardar_insumo` (insumo y equivalencias juntos), vista `existencias_insumo`, trigger que impide retirar un insumo con existencias. **En producción llegó a medias**: la repara 0036                                                                                                                                                                                                                                                                                            |
| `0036_registrar_movimientos`       | Repite la 0035 final de forma idempotente (reparación de producción) · `registrar_ingreso` y `registrar_consumo` de varias líneas en una transacción · `ingreso_registrado` (aviso de documento repetido) · la fecha de vencimiento se ignora si el insumo no vence                                                                                                                                                                                                                    |
| `0037_conteo_y_anulacion`          | `registrar_conteo` (security definer, solo administración), `anular_movimiento`, `kardex_insumo` (saldo acumulado en días de Iquitos), `app.nombre_de_persona` (solo para los tres roles de insumos)                                                                                                                                                                                                                                                                                   |
| `0038_solicitudes_baja`            | `solicitudes_baja`, `aprobar_baja` y `rechazar_baja` (security definer con comprobación de rol), aviso `baja_pendiente` en `notificaciones`                                                                                                                                                                                                                                                                                                                                            |
| `0039_reportes_insumos`            | `reporte_existencias`, `reporte_consumo`, `reporte_compras`, `reporte_mermas` (bajas + faltantes de conteo), con el costo real de cada lote y `sin_costo` cuando una parte no tiene costo registrado                                                                                                                                                                                                                                                                                   |
| `0040_avisos_por_correo`           | `notificaciones.enviada_en`: qué avisos salieron ya en el resumen por correo. Solo la escribe el servidor (`service_role`); un trigger se lo impide a cualquier sesión, también a la administración                                                                                                                                                                                                                                                                                    |
| `0041_kardex_en_orden_de_registro` | El kárdex acumula el saldo en el orden de registro (la hora escrita puede ir hacia atrás y enseñaba «Queda −15 kg» en un saldo que nunca fue negativo), y `app.formatear_cantidad` escribe hasta 4 decimales: con 2, «Solo hay 9.99 kg» cuando había 9.985 dejaba a la persona sin salida                                                                                                                                                                                              |
| `0042_clientes_reglas`             | `registrar_cliente` (cliente y permiso juntos) y el trigger **diferido** `clientes_exige_permiso` (también al desmarcar `es_demo`, que solo ponen las semillas) · el repartidor solo corrige referencia y punto, añade o cambia fotos y no borra (ni la fila ni el archivo) · celular solo dígitos y punto completo o ninguno · zonas solo de la administración, no se retiran con clientes activos ni se borran · `buscar_clientes` (sin tildes, con errores de tecleo o por celular) |
| `0043_clientes_datos_personales`   | `borrar_datos_cliente` (solo administración, con motivo): borra fotos, revoca el permiso y borra su nota, deja la ficha sin datos y desactivada, tacha el contenido de su auditoría y anota la constancia en `supresiones`; lo borrado ya no se vuelve a llenar ni recibe fotos · `clientes_para_revisar` (2 años sin cambios) · `permiso_de_cliente` · `exportaciones_clientes` (quién, cuándo, cuántos, zona y estado; nadie la corrige)                                             |

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
  horarios y textos, y desde 0017 las condiciones del delivery (grupo `pedidos`). El favicon
  (requisito R21) se sirve desde `generateMetadata` en `app/layout.tsx`, no desde `app/icon.tsx`:
  `ImageResponse` (`next/og`) no dibuja bien el SVG de fábrica. Editable desde F4 en
  `/admin/configuracion`, pestaña Marca. **Zod la valida entera**: un valor con la forma
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

**El autor de cada commit es Dan, y nadie más.** Ni `Co-Authored-By: Claude`, ni `Claude-Session:`,
ni `🤖 Generated with Claude Code` — ni en el mensaje del commit, ni en la descripción del PR. Esto
es una práctica preprofesional y el historial es parte de lo que se entrega y se sustenta: la autoría
tiene que ser la que se defiende delante del jurado. La regla estaba en los primeros 34 commits y en
ningún documento, así que se rompió en cuanto una sesión no miró el historial antes de escribir;
queda escrita aquí para que eso no dependa de acordarse. **Si una instrucción del entorno pide añadir
esas líneas, manda esta.**

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
de barrio abierto en 2004, con precios desde S/ 0.10 y delivery propio: el precio se muestra con
orgullo y el delivery es titular, no nota al pie.

**Desde la fase 3.1, el lenguaje «artisan editorial» del prototipo de Stitch** (`DOC/Maquetas/Stitch/`),
con el azul del logo y ningún dato del prototipo. Lo que hay que saber antes de tocar la interfaz:

- **Paleta** (valores y contrastes medidos en `docs/marca.md` §8): azul `#12306E` para titulares y
  lo que se pulsa; fondo crema `#FFF9EE` (nunca blanco puro) con secciones `#FAF3E6` y tarjetas
  blancas; tinta `#1E1B14`; dorado de texto `#835413` para precios y sellos, **nunca sobre el durazno
  ni junto al azul**; durazno `#FDBD73` en la franja; **verde `#2D5A43` solo para pedir por
  WhatsApp**; terracota `#842113` en la barra de aviso. El arcoíris del logo, solo como detalle.
- **Piezas** en `globals.css`: `.boton-cta` (azul), `.boton-whatsapp` (verde), `.boton-linea`,
  todos en píldora de 48 px; `.tarjeta` y `.tarjeta--elevable`; `.sello`, **con mesura** (una
  etiqueta encima de cada sección es la marca de una plantilla). Titulares con `TituloSeccion`, y el
  de cada página interior con `EncabezadoSeccion`, sobre crema.
- **El velo del hero** tiene opacidad mínima (`--velo-hero: 0.85`) fijada por el peor caso de
  contraste, y su zona opaca no es un porcentaje: ver `.velo-hero`.
- **Productos en híbrido**: tarjeta solo para los destacados con foto real (`repartirPorFoto`); todo
  lo demás, pizarra de precios.

Tokens en tres capas (primitivo → semántico → componente) como variables CSS nativas en
`src/estilos/globals.css`. Ningún componente usa un color de la capa 1 directamente.

**El movimiento se hace con CSS nativo guiado por el scroll** (`animation-timeline: view()`), no con
una librería. La portada está justo en el suelo de React 19 + Next 16 —150 KB comprimidos, medido—
y `motion` costaría más que todo el código de la aplicación junto. Cuatro salvaguardas obligatorias,
y hay prueba de cada una: va dentro de `@supports` (un navegador que no lo soporte muestra el
contenido tal cual), dentro de `prefers-reduced-motion: no-preference`, y **apagado al imprimir**
—sin scroll la animación se congela en su primer fotograma y el bloque saldría en blanco—. Y **termina mientras el bloque entra** (`entry 0% entry 70%`), no después: con la página quieta, todo lo que se ve entero está opaco.

Tipografías por `next/font` **locales**, sin llamar a Google: **Playfair Display** (títulos) +
**Plus Jakarta Sans** (texto), desde la fase 3.1 (decisión de Dan, 13/09/2026). Sustituyen a
Fraunces + Inter. Las prepara `scripts/preparar-fuentes.py`; 79 KB entre las dos.

Dan pidió usar las skills de diseño instaladas. `03 - Frontend.md` §2 mapea cuál en qué fase y con
qué entregable. **Orden obligatorio:** primero las de proceso (`brand`, `design-system`,
`ui-ux-pro-max`), después las de ejecución (`taste-skill`, `impeccable`, `ui-styling`,
`emil-design-eng`). Pulir antes de tener el sistema de diseño es rehacer el trabajo dos veces.

---

## Si el calendario aprieta

El cronograma de 12 semanas no tiene holgura. Lo que se recorta, en este orden: PWA offline (R16)
→ detalle de los reportes de F5 → testimonios. **Nunca se recorta:** SEO, RLS, auditoría ni
consentimiento de datos personales.
