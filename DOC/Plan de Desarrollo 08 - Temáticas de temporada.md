# Plan de Desarrollo 08 — Temáticas de temporada

Diseño acordado con Dan el 19/11/2026. Arriba va el diseño (la spec) y debajo, cuando esté, el plan de
tareas. Primera entrega: **la base completa y solo la temática de Navidad**, para que llegue antes del
25/12. Las demás temáticas vienen después, una por una.

---

## 1. Para qué

Dan quiere que el sitio público **se sienta de fiesta** en las fechas importantes y que **venda lo de
temporada**: panetones en Navidad, tortas en el Día de la Madre. La referencia es la campaña navideña
de https://tumanzanita.store/. Ahí la Navidad cambia el sitio entero: fondo verde pino con dorado y
rojo, luces colgando bajo la cabecera, nieve que cae, bordes nevados en las secciones, una cinta con
mensajes («Feliz Navidad», «Llega antes del 24»), una cuenta regresiva («Faltan 35 días») y títulos de
campaña («Los más pedidos esta Navidad»). De la referencia se toma **el tipo de cambio, no su diseño
ni su contenido**: la Navidad de Pimpo's se diseña sobre la marca de Pimpo's.

Hay productos que **solo se venden en su fecha**. La temática los publica cuando se enciende y los
esconde cuando se apaga.

Una temática se enciende y se apaga **a mano desde el panel y también sola, por fechas** (Dan). La
razón de las fechas es el 2 de enero: si nadie se acuerda de apagar la Navidad, el sitio no puede
seguir con nieve y ofreciendo panetones.

## 2. Objetivos, lo que no entra y lo que lo haría fracasar

**Objetivos**

- Cada temática cambia el aspecto del sitio público (colores, adornos y acentos), pone sus mensajes y
  saca al frente sus productos.
- Una sola temática activa a la vez. Se activa por fechas o a mano, y se ve en el sitio sin
  redesplegar.
- Los productos «solo de temporada» se ven **únicamente** mientras su temática está activa. La regla
  vive en la base, no solo en el formulario.
- El negocio edita desde el panel los textos de cada campaña y qué productos salen.

**No entra (en esta entrega)**

- Temáticas distintas de Navidad. El catálogo de temáticas queda listo para sumarlas: Día de la
  Madre, San Juan, Fiestas Patrias, Halloween / Canción Criolla y San Valentín.
- Que el negocio diseñe temáticas (colores, imágenes de adornos). El aspecto lo diseñamos nosotros y se
  prueba antes de publicarlo.
- Cambiar el panel: la temática es solo del sitio público.
- Cuenta regresiva con horas, minutos y segundos: solo días.
- Calcular solas las fechas que se mueven (el segundo domingo de mayo). Las fechas se escriben cada
  año.
- Cambiar cualquier otra funcionalidad del sitio o del panel.

**Lo que lo haría fracasar aunque funcione**

- Un texto que no se lee sobre el fondo de la temática (el contraste se mide igual que hoy).
- Una portada más lenta: los adornos van sin librerías y la nieve no es JavaScript.
- Un producto de temporada que se ve fuera de su fecha, por la vista o por la API.
- Una temática que se queda encendida porque nadie se acordó de apagarla.
- Movimiento que no se apaga para quien pide menos movimiento, o adornos que salen al imprimir.

## 3. Restricciones del proyecto que aplican

- Todo lo de AGENTS.md: RLS en toda tabla nueva en la misma migración, vistas con `security_invoker`
  que repiten su condición de publicado, migración sola en su PR (la regla de F6), pgTAP de cada
  regla, Vitest de la lógica pura y E2E del flujo, funcionar a 375 px y textos sin jerga.
- **Una tabla auditada nueva necesita su entrada en `src/lib/auditoria/catalogo.ts`**: una prueba
  pgTAP fija la lista.
- El sitio público lee **vistas**, nunca tablas. Con Cache Components la portada se prerenderiza: lo
  que cambie la temática tiene que refrescarse con `updateTag` desde el panel y caducar solo
  (`cacheLife`) cuando el cambio lo provocan las fechas.
- Movimiento solo con CSS, con las salvaguardas de siempre: dentro de `@supports` cuando use
  `animation-timeline`, dentro de `prefers-reduced-motion: no-preference` y apagado al imprimir.
- La dirección visual vigente es la A del rediseño 03.2 (terracota y crema, sin azul). La Navidad se
  diseña sobre ella, con las skills de diseño en el orden de AGENTS.md.
- Rendimiento: Lighthouse de la portada medido con la temática encendida contra `main`, en la misma
  sesión e intercalado (la regla de AGENTS.md).

## 4. Caminos considerados

| Camino                                                                                                | Qué se gana                                                                                                                       | Qué se paga                                                                                                             |
| ----------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| **A. Temáticas diseñadas en el código; calendario, modo, textos y productos en la base** (el elegido) | Cada temática se prueba antes de salir (contraste, peso, celular). El negocio controla fechas, textos y productos sin programador | Una temática nueva necesita un programador para su diseño                                                               |
| B. Temáticas que el negocio arma desde el panel (colores, imágenes)                                   | Más flexible                                                                                                                      | El sitio puede quedar ilegible o pesado sin que nada lo pruebe; cuesta bastante más; va contra lo que se viene cuidando |
| C. Solo lo que ya existe (slides de temporada, barra de aviso, destacados)                            | Casi gratis                                                                                                                       | El sitio no se siente de fiesta: no hay colores, adornos, cuenta regresiva ni productos que aparezcan y desaparezcan    |

**Dan eligió A, empezando por Navidad** (19/11/2026).

## 5. El diseño

### 5.1 Cuándo está activa una temática

Cada temática tiene **fechas** (inicio y fin, días de Iquitos, ambos incluidos) y un **modo**:

- **Según fechas** (el normal): activa entre inicio y fin.
- **Encendida ya**: activa desde ahora **hasta su fecha de fin**. Después vuelve sola a «según fechas».
- **Apagada**: no se activa **hasta su fecha de fin**, aunque esté dentro de sus fechas. Después vuelve
  sola a «según fechas».

_Llamada mía (Claude), para que Dan la confirme:_ los dos modos manuales caducan en la fecha de fin
de la campaña. Así, encender la Navidad a mano el 1/12 tampoco la deja puesta el 2 de enero, y
apagarla un año no la deja apagada para siempre. Para encender a mano, la fecha de fin tiene que ser
hoy o posterior: si ya pasó, el panel pide poner primero las fechas de este año.

_Llamada mía:_ el modo manual guarda **su propia fecha de caducidad**, que es la fecha de fin vigente
cuando se puso. **Cambiar las fechas devuelve la temática a «según fechas»**: apagar la Navidad un año
y luego poner las fechas del siguiente no la deja apagada también esa campaña. El panel lo avisa al
cambiar las fechas con un modo manual puesto.

**Una sola activa a la vez.** Si dos temáticas quedarían activas el mismo día, la base rechaza el
cambio que provoca el cruce y el panel dice con cuál choca («Las fechas se cruzan con San Valentín»).
Esto vale tanto para fechas que se solapan como para encender una a mano con otra activa.

Las fechas son **completas** (con año). Cada año el negocio pone las nuevas. Cuando las fechas de
una temática ya pasaron, el panel lo dice («Las fechas de esta campaña ya pasaron: pon las del
próximo año»). Si nadie las cambia, la temática simplemente no se enciende: falla del lado seguro.

La regla «¿cuál está activa hoy?» vive **en la base** (una función o vista), y la usan por igual el
sitio, el panel y las reglas de visibilidad de productos. Así no puede haber dos respuestas distintas.

### 5.2 Qué guarda cada temática

- `slug` fijo (`navidad`, después `dia-de-la-madre`, `san-juan`…) y nombre. **El catálogo de temáticas
  lo crean las migraciones**: el negocio no crea temáticas, porque cada una necesita su diseño en el
  código. Una fila sin diseño en el código no se puede encender.
- Fechas, modo y, si aplica, la fecha del evento para la cuenta regresiva (Navidad: 25/12).
- **Textos editables**: la frase de la barra de arriba, los mensajes de la cinta (lista corta) y el
  título y la entradilla de la sección de temporada en la portada. Con valores de partida razonables
  escritos en la migración.
- **Productos**: qué productos salen en la sección de temporada, en qué orden, y cuáles de ellos son
  **solo de temporada**.

### 5.3 Productos de temporada

- Un producto puede estar en la sección de una o varias temáticas.
- Si está marcado **solo de temporada** en alguna temática, **solo se ve** mientras alguna de esas
  temáticas está activa. Fuera de ellas no sale en la portada, en `/productos`, en su ficha (404), en
  el sitemap ni en los datos estructurados, y tampoco se puede leer por la API anónima de la base (PostgREST).
  _Llamada mía:_ las **fotos** siguen en su bucket público y su dirección sigue respondiendo fuera de
  temporada. La foto de un panetón no es un dato sensible, y hacer privado el bucket obligaría a servir
  todo el catálogo con URL firmada. Por eso la
  condición va en `productos_publicos` **y** en las políticas RLS de `anon` sobre `productos`,
  `producto_variantes` y `producto_imagenes`.
- Al apagarse la temática el producto **no se borra ni cambia de estado**: sigue «publicado» en el
  panel, con su ficha, fotos e historial de precios, listo para el año siguiente. El panel muestra a su
  lado «Solo en Navidad · ahora no se ve».
- Un producto de todo el año (el Panetón, hoy destacado) puede ir en la sección de temporada **sin**
  ser solo de temporada: sale al frente durante la campaña y sigue visible el resto del año.

### 5.4 El panel

- Una pantalla nueva, **Contenido → Temáticas**, solo para **superadmin y administración**. Encender una
  temática cambia lo que ve todo el público, como publicar una promoción, que el ingeniero tampoco
  puede.
- La lista dice el estado de cada temática en palabras: «Activa ahora, hasta el 26/12», «Se enciende
  sola el 15/11», «Apagada a mano hasta el 26/12» o «Las fechas ya pasaron».
- Cada temática abre un formulario (la cáscara de siempre: pestañas, un solo «Guardar», copia local):
  **Cuándo** (fechas, fecha del evento y modo con sus tres opciones explicadas), **Textos**
  (barra, cinta, título y entradilla) y **Productos** (elegir del catálogo, ordenar y marcar «solo se
  vende en esta temporada»).
- Al guardar, el sitio se refresca al instante (`updateTag` de `catalogo` y `marca`).
- En la ficha de un producto que es solo de temporada se ve en qué temáticas está y si hoy se ve o no.
- El Historial del panel registra los cambios de temáticas como cualquier otro, con sus frases.

### 5.5 El sitio público con la temática activa

- Un atributo en la cáscara pública (`data-tematica="navidad"`) cambia los colores **sustituyendo los
  tokens de la capa semántica** de `globals.css`. Ningún componente cambia su CSS ni usa colores
  propios.
- Los **adornos** de la temática viven en un componente propio, decorativo y oculto para lectores de
  pantalla (`aria-hidden`). En Navidad: luces bajo la cabecera, nieve que cae y los bordes de algunas
  secciones. La nieve es CSS puro y se apaga con menos movimiento y al imprimir.
- La **barra de arriba** muestra el texto de la campaña en lugar del de horario y reparto. Ese texto
  vuelve cuando la temática se apaga.
- Una **cinta** con los mensajes de la campaña, que se desliza. Con menos movimiento, queda quieta y
  se lee entera.
- En la portada, una **sección de temporada** antes de «Lo que horneamos hoy», con la cuenta regresiva
  en días cuando hay fecha de evento («Faltan 12 días para Navidad», o «¡Hoy es Navidad!»), el título,
  la entradilla y los productos de la temporada en tarjeta. Sin productos, la sección muestra solo
  título y cuenta, o no sale si tampoco hay cuenta.
- **Sin temática activa, el sitio queda exactamente como hoy.**
- Cuándo se ve un cambio: lo que se cambia desde el panel, al instante; lo que cambian las fechas, en
  menos de una hora. Las lecturas de temática y catálogo caducan cada hora (`cacheLife("hours")`), así
  que no hace falta cron ni redespliegue. **Esto se apoya en que Vercel revalida las páginas
  prerenderizadas.** Si antes de Navidad el sitio se muda a otro alojamiento (hay una evaluación de
  Cloudflare en `feat/validacion-cloudflare`, sin fusionar), hay que comprobar ahí la revalidación por
  hora o añadir un cron que refresque el sitio al cambiar el día. Mientras el sitio siga en Vercel, no
  hace falta.

### 5.6 El aspecto de Navidad

Se diseña sobre la dirección A con las skills de diseño, y **Dan aprueba una maqueta antes de que se
implemente**: portada en celular y escritorio, con y sin la temática. Puntos de partida: un fondo
oscuro festivo o un acento navideño sobre el crema (lo decide la maqueta), dorado y rojo como acentos,
y la caligrafía de la sesión de tipografía, si para entonces está fusionada, para un acento. Todo par
de color de texto mide el contraste mínimo de AGENTS.md.

## 6. Lo que queda a quien construya

- Los nombres exactos de tablas, columnas y funciones, y si «cuál está activa» es una vista o una
  función (sí tiene que estar en la base y ser la única fuente).
- Cómo se impide el cruce de fechas (trigger o restricción), siempre con un mensaje que el panel pueda
  traducir a una frase.
- El reparto en tareas y PR, respetando la regla de F6 (la migración sola en su PR).
- Los textos de partida de Navidad, en la voz de `docs/marca.md`.
- Cuántos productos caben en la sección de temporada (sugerencia: hasta 8, como los destacados).

## 7. Llamadas de Claude que Dan debe revisar

1. Los dos modos manuales caducan en la fecha de fin de la campaña (§5.1).
2. Solo superadmin y administración manejan temáticas; el ingeniero no (§5.4).
3. Fechas con año, que se escriben cada año; sin cálculo automático de fechas móviles (§5.1).
4. La cuenta regresiva va en días, sin segundos (§5.5).
5. Un producto solo de temporada que está fuera de su fecha sigue «publicado» en el panel; lo que cambia
   es si el público lo ve (§5.3).
6. Cambiar las fechas devuelve la temática a «según fechas» (§5.1).
7. Las fotos de un producto fuera de temporada siguen respondiendo en su dirección; lo oculto es el
   producto en el sitio y en la base (§5.3).
8. Encender y apagar solo por fechas se apoya en la revalidación de Vercel; si cambia el alojamiento,
   hay que comprobarla o añadir un cron (§5.5).

Dan aprobó el diseño y estas llamadas el 19/11/2026.

---

# Plan de implementación

> **Para agentes:** sub-skill obligatoria: `superpowers:subagent-driven-development` (recomendada) o
> `superpowers:executing-plans`, tarea a tarea. Los pasos llevan casillas (`- [ ]`).

**Objetivo:** temáticas de temporada para el sitio público, encendidas por fechas o a mano desde el
panel, con productos que solo se ven en su temporada. En esta entrega, solo Navidad.

**Arquitectura:** la base guarda el catálogo de temáticas (lo crean las migraciones), sus fechas,
modo, textos y productos, y es la única que responde «¿cuál está activa hoy?»
(`app.tematica_activa_id()`). Las vistas públicas y las políticas de `anon` usan esa respuesta. El
sitio lee la temática activa con `use cache` y `cacheLife("hours")`, la pone en `data-tematica` y el
CSS de esa temática sustituye los tokens semánticos. El panel la gestiona con
`public.guardar_tematica` a través de `ejecutarAccion`.

**Tecnología:** Next 16 (Cache Components), Supabase/Postgres con RLS, Tailwind 4, Zod, Vitest,
pgTAP y Playwright.

**Spec:** las secciones 1 a 7 de este mismo documento.

## Restricciones globales

- Migración **0047**, sola en su PR (T1). Se para hasta que Dan haga `supabase db push` desde
  `PIMPOS_SYSTEM` con la carpeta quieta, y entonces se fusiona. T2+T3 van juntas en un PR y T4 en otro.
- Toda vista nueva lleva `with (security_invoker = true)`. Las tablas nuevas, RLS en la misma
  migración, el trigger `app.sellar_autoria()` (0026 solo cubrió las tablas que existían) y el de
  auditoría `app.registrar_auditoria()`.
- Días de Iquitos: `(now() at time zone 'America/Lima')::date`.
- Solo `superadmin` y `administrador` escriben temáticas. El ingeniero no ve la pantalla
  (`ACCESO_POR_SECCION`) y la base se lo niega.
- Las acciones del panel refrescan `catalogo` y `marca`. Las lecturas públicas de temática caducan con
  `cacheLife("hours")`.
- Sin temática activa, el HTML del sitio no cambia: ni atributo, ni adornos, ni sección.
- Movimiento: dentro de `prefers-reduced-motion: no-preference`, apagado en `@media print` y adornos
  con `aria-hidden`.
- Commits en español, Conventional Commits, **sin `Co-Authored-By`** ni marcas de Claude.

## Puntos que vigilar en la revisión

Lo que ninguna prueba de tarea cubriría por sí sola, y cómo queda cubierto:

1. **Un producto solo de temporada en dos temáticas, con una de ellas activa:** se ve. Prueba
   pgTAP en T1.
2. **Una temática «encendida ya» cuando pasa su fecha de fin:** vuelve a mandar el calendario y, fuera
   de sus fechas, se apaga. Prueba pgTAP en T1, moviendo las fechas al pasado.
3. **Cambiar las fechas con un modo manual puesto:** vuelve a «según fechas». pgTAP en T1 y aviso
   del formulario en T2.
4. **Cruces:** encender A con B activa hoy, o mover las fechas de B dentro de la ventana de A, se
   rechaza con el nombre de la otra temática. pgTAP en T1 y frase del panel en T2.
5. **La API anónima fuera de temporada:** leer `productos`, `producto_variantes` y `producto_imagenes`
   directamente devuelve 0 filas del producto. pgTAP en T1 y el guion
   `verificar-sitio-publico.sh` en T4.

---

## T1 — Base de datos: temáticas, reglas y productos de temporada (migración 0047)

**Archivos**

- Crear: `supabase/migrations/0047_tematicas.sql` y `supabase/tests/0047_tematicas.test.sql`
- Modificar: `supabase/tests/0045_historial.test.sql` (la lista de tablas auditadas pasa de 25 a 27),
  `src/lib/auditoria/catalogo.ts` (+ `catalogo.test.ts`: 27), `src/lib/auditoria/campos.ts` (nombres
  llanos de los campos nuevos) y `src/tipos/database.types.ts` (regenerado)

**Produce (los nombres que usan T2 y T4)**

- `public.tematicas`: `id uuid`, `slug text unique check (slug in ('navidad'))`, `nombre`,
  `inicio date`, `fin date` (`fin >= inicio`), `fecha_evento date null`,
  `encendido text check (encendido in ('fechas','encendida','apagada')) default 'fechas'`,
  `encendido_desde date`, `encendido_hasta date` (los dos NULL si y solo si `encendido = 'fechas'`),
  `texto_aviso text` (≤ 120), `mensajes_cinta text[]` (≤ 6 mensajes de 1 a 60 caracteres), `titulo`
  (≤ 80), `entradilla` (≤ 240), `created_at`, `updated_at`, `created_by` y `updated_by`.
- `public.tematica_productos`: `id`, `tematica_id` (FK, `on delete cascade`), `producto_id` (FK,
  `on delete cascade`), `solo_temporada boolean default false`, `orden int default 0`,
  `unique (tematica_id, producto_id)` y las cuatro columnas de autoría.
- `app.tematica_activa_id() returns uuid`, `stable security definer`. Activa = si
  `encendido <> 'fechas' and hoy <= encendido_hasta`, entonces `encendido = 'encendida'`; si no,
  `hoy between inicio and fin`.
- `app.producto_en_temporada(p_producto uuid) returns boolean`, `stable security definer`. Devuelve
  verdadero si el producto no tiene ninguna fila con `solo_temporada`, o si alguna de esas filas es de
  la temática activa.
- Trigger `before update` en `tematicas`, con estas reglas:
  - Si cambian `inicio` o `fin`, pone `modo = 'fechas'`.
  - Si `encendido` pasa a manual, pone `encendido_desde = hoy` y `encendido_hasta = fin`.
  - `encendida` con `fin < hoy` se rechaza con P0001: «Las fechas de esta campaña ya pasaron: pon
    primero las de este año».
  - Cruce: la ventana de cada temática es `[least(inicio, encendido_desde si está encendida), fin]`. Si
    dos ventanas se solapan, P0001: «Las fechas se cruzan con «<nombre>»». Se toma antes un
    `lock table public.tematicas in share row exclusive mode`.
- `public.guardar_tematica(p_tematica uuid, p_datos jsonb, p_productos jsonb) returns void`,
  `security invoker`. Actualiza la fila y reemplaza sus productos (`[{producto_id, solo_temporada}]`,
  y el orden es el del array) en una transacción.
- Vistas, todas con `security_invoker`:
  - `public.tematicas_panel`: todas las columnas, más `activa boolean` y `encendido_vigente` (`'fechas'`
    cuando el modo manual ya caducó).
  - `public.tematica_publica`: `slug`, `nombre`, `fecha_evento`, `texto_aviso`, `mensajes_cinta`,
    `titulo` y `entradilla`. Una fila o ninguna.
  - `public.productos_de_temporada`: las columnas de `productos_publicos` más `orden_temporada`, solo
    de la temática activa.
- RLS:
  - `tematicas`: `select` para `authenticated` y para `anon` solo con
    `id = app.tematica_activa_id()`. `update` solo superadmin y administración. Sin `insert` ni
    `delete`.
  - `tematica_productos`: `select` igual que `tematicas`; `insert`, `update` y `delete` solo
    superadmin y administración.
- Reemplazar las tres políticas de `anon` de 0009 («publico ve productos publicados», «… variantes …»
  y «… imagenes …») añadiendo `app.producto_en_temporada(...)`. `productos_publicos` repite la
  condición en su `where` (`create or replace`, con las columnas idénticas).
- La fila de `navidad`: inicio `2026-12-01`, fin `2026-12-26`, fecha del evento `2026-12-25` y
  textos de partida en la voz de `docs/marca.md`. Se inserta con la auditoría apagada (la trampa de
  0024).

**Pasos**

- [ ] Escribir `0047_tematicas.test.sql`. Las cuentas son sobre la fixture, nunca sobre el total. Con
      `set local request.jwt.claims` por rol, prueba esto:
  - `tematica_activa_id()` según fechas, encendida, apagada, modo caducado (Punto 2) y antes y
    después de un cambio de fechas (Punto 3).
  - Los dos cruces del Punto 4, con el texto exacto del error.
  - `encendida` con fechas pasadas, rechazada.
  - El producto solo de temporada: invisible para `anon` en las tres tablas y en `productos_publicos`
    fuera de temporada (Punto 5), y visible dentro. También el caso con dos temáticas del Punto 1.
  - Un producto de todo el año dentro de `tematica_productos` sigue visible.
  - `guardar_tematica` como administrador funciona; como ingeniero, 0 filas o 42501 (que no entre
    nada).
  - `tematica_publica` vacía sin temática activa.
  - El repartidor no escribe.

  Como en esta entrega solo existe `navidad`, la prueba crea una segunda temática de fixture (con un
  slug permitido solo dentro de la prueba, quitando y reponiendo el `check` o insertando como
  `postgres` con el `check` ampliado de forma temporal) para cubrir los cruces y el Punto 1.

- [ ] Correr `supabase test db supabase/tests/0047_tematicas.test.sql`: falla (no existe la tabla).
- [ ] Escribir la migración y aplicarla en local (`supabase migration up --local`).
- [ ] Actualizar la lista de 0045 a 27 tablas. En `catalogo.ts`: `tematicas` y `tematica_productos`
      en la sección `contenido`, con referencia `conNombre("la temática", "una temática")`. Los productos
      dicen «los productos de la temática <nombre>» y la ruta es `/admin/contenido/tematicas/<slug>`.
      Nombres de los campos en `campos.ts`. (Al ejecutar: no entran en `TABLAS_CON_PANTALLA`; ver «Lo que
      resultó distinto».)
- [ ] `supabase db reset` y `supabase test db`: todo en verde. Vitest de `src/lib/auditoria`.
- [ ] `pnpm supabase:tipos`, `pnpm typecheck` y `pnpm lint`.
- [ ] Commit: `feat(tematicas): temáticas de temporada y productos que solo se ven en su fecha (0047)`.
      PR solo, y parada para el `db push` de Dan.

## T2 — Panel: Contenido → Temáticas

**Archivos**

- Crear:
  - `src/lib/tematicas/estado.ts` y `estado.test.ts`
  - `src/lib/validaciones/tematica.ts` y `tematica.test.ts`
  - `src/lib/acciones/tematicas.ts`
  - `src/app/(admin)/admin/contenido/tematicas/page.tsx`, `[slug]/page.tsx` y
    `[slug]/formulario-tematica.tsx`
  - `e2e/panel-tematicas.spec.ts`
- Modificar:
  - `src/lib/auth/roles.ts` (+ test): `["/admin/contenido/tematicas", ["superadmin", "administrador"]]`
  - `src/lib/panel/navegacion.ts`: añadir «Temáticas» a `SUBSECCIONES_DE_CONTENIDO`, y que la
    página de Contenido filtre las subsecciones con `puedeAcceder`
  - la ficha o el formulario de producto: «Solo en Navidad · hoy se ve / ahora no se ve»
  - `e2e/panel-accesibilidad.spec.ts`: las dos rutas nuevas

**Usa:** `public.tematicas_panel`, `public.guardar_tematica` y `public.tematica_productos` (T1).

**Produce**

- `describirEstado(t: { activa: boolean; encendido_vigente: "fechas" | "encendida" | "apagada"; inicio: string; fin: string; encendido_hasta: string | null }, hoy: string): string`. Las frases:
  - «Activa ahora, hasta el 26/12»
  - «Encendida a mano hasta el 26/12»
  - «Apagada a mano hasta el 26/12»
  - «Se enciende sola el 01/12»
  - «Las fechas ya pasaron: pon las del próximo año»
- `esquemaTematica` (Zod) y `leerTematica(fd: FormData)`. Los mensajes de la cinta se escriben uno por
  línea (≤ 6, ≤ 60 caracteres). `fin >= inicio`. Los productos llegan como
  `[{ producto_id, solo_temporada }]`.
- `guardarTematica(id: string, previo: EstadoAccion, fd: FormData): Promise<EstadoAccion>`, con
  `ejecutarAccion`, roles `["superadmin", "administrador"]` y etiquetas `["catalogo", "marca"]`. Los
  P0001 de T1 llegan tal cual como frase.

**Pasos**

- [ ] Vitest de `describirEstado`: las cinco frases, más el día justo de inicio y el de fin.
      `esquemaTematica`: siete mensajes, rechazado; un mensaje de 61 caracteres, rechazado;
      `fin < inicio`, rechazado; líneas vacías de la cinta, ignoradas.
- [ ] Verlas fallar, implementar y verlas pasar.
- [ ] Las páginas, con la cáscara de siempre:
  - La lista, con `ListaAdaptable`, el estado de cada temática y el lápiz «Editar».
  - El formulario, con `PestanasFormulario` y `forceMount`: **Cuándo** (fechas, fecha del evento y el
    modo con sus tres opciones explicadas), **Textos** y **Productos** (elegir del catálogo, ordenar
    con subir/bajar, casilla «Solo se vende en esta temporada»).
  - Si se cambian las fechas con un modo manual puesto, el formulario avisa de que vuelve a «según
    fechas» (Punto 3).
- [ ] E2E en un solo proyecto (escribe una fila global):
  - Un administrador pone las fechas, enciende «Encendida ya», marca un producto de prueba como solo
    de temporada y guarda. Se ve «Encendida a mano hasta …», y el producto se ve en `/productos`.
  - La apaga y el producto deja de verse.
  - Un ingeniero no ve «Temáticas» en Contenido, y `/admin/contenido/tematicas` lo saca.
  - La limpieza deja la temática en «según fechas» y borra el producto de prueba.
- [ ] Axe y área táctil de las dos rutas, a 375 px y en escritorio.
- [ ] `pnpm typecheck`, `pnpm lint` y las suites tocadas. Commit:
      `feat(tematicas): pantalla de temáticas en el panel`.

## T3 — Maqueta de Navidad y aprobación de Dan

**Archivos:** crear `DOC/Maquetas/tematicas/navidad/` (capturas y `LEEME.md`).

- [ ] Con las skills de diseño, en el orden de AGENTS.md, decidir sobre la dirección A:
  - los tokens semánticos que cambian con Navidad (fondo, tarjeta, CTA, acentos, franja y aviso);
  - los adornos: luces bajo la cabecera, nieve y borde nevado de las secciones;
  - la cinta y la sección de temporada;
  - la caligrafía de acento, si la rama de tipografía ya está en `main`.

  Todo par de texto tiene que medir el contraste mínimo de `docs/marca.md` §8.

- [ ] Capturas de la portada en celular y escritorio, con y sin Navidad, más `/productos` con Navidad.
      Escribir el `LEEME.md` con los tokens elegidos y sus contrastes medidos.
- [x] **Parar y enseñar a Dan.** T4 no empieza hasta que la apruebe; si la corrige, se rehace aquí.
      Aprobada el 20/11/2026: las dos variantes, elegibles desde el panel, con Noche de Navidad puesta.
- [ ] Commit: `docs(tematicas): maqueta de Navidad aprobada`. Va en el PR de T2.

## T4 — Sitio público con la temática activa

**Archivos**

- Crear:
  - `src/lib/datos/tematica.ts`
  - `src/lib/tematicas/cuenta-regresiva.ts` y su test
  - `src/estilos/tematicas.css` (importado desde `globals.css`)
  - en `src/components/publico/tematica/`: `adornos-navidad.tsx`, `cinta-tematica.tsx` y
    `seccion-temporada.tsx`
  - `e2e/tematica-navidad.spec.ts`
  - `docs/tematicas.md` (el manual para el negocio)
- Modificar:
  - `src/components/publico/cascara-publica.tsx`: un envoltorio con `data-tematica` y
    `bg-background text-foreground`, y la barra con el texto de la campaña
  - `src/app/(public)/page.tsx`: la sección de temporada antes de «Lo que horneamos hoy»
  - `e2e/accesibilidad.spec.ts`: axe con Navidad encendida
  - `scripts/verificar-sitio-publico.sh`: la comprobación del Punto 5
  - `AGENTS.md`: estado, migración 0047 y las trampas que salgan

**Usa:** `public.tematica_publica` y `public.productos_de_temporada` (T1); la maqueta aprobada (T3).

**Produce**

- `obtenerTematicaActiva(): Promise<TematicaPublica | null>` (`use cache`, `cacheTag(ETIQUETAS.marca)`,
  `cacheLife("hours")`), con
  `type TematicaPublica = { slug: "navidad"; nombre: string; fechaEvento: string | null; textoAviso: string | null; mensajes: string[]; titulo: string | null; entradilla: string | null }`.
  Un `slug` que el código no conoce devuelve `null`: una fila sin diseño no viste el sitio.
- `listarProductosDeTemporada(): Promise<ProductoPublico[]>` (`use cache`, `catalogo`, `hours`, como
  mucho 8), reutilizando `aProducto` de `catalogo.ts`.
- `textoCuentaRegresiva(fechaEvento: string, hoy: string, evento: string): string | null`:
  - 12 días: «Faltan 12 días para Navidad»
  - 1 día: «Falta 1 día para Navidad»
  - 0 días: «¡Hoy es Navidad!»
  - días negativos: `null`

  Se calcula dentro de una función `use cache` con `cacheLife("hours")`, con `hoyEnLima` de
  `src/lib/insumos/periodo.ts` (o movida a un módulo común si conviene).

**Pasos**

- [ ] Vitest de `textoCuentaRegresiva`: los cuatro casos, y que la medianoche UTC no adelante el día
      (una hora UTC de las 03:00 sigue siendo el día anterior en Iquitos).
- [ ] Verlas fallar, implementar y verlas pasar.
- [ ] Las lecturas de datos, la cáscara (sin temática, el mismo HTML que hoy) y los tokens de Navidad
      de la maqueta en `tematicas.css`, bajo `[data-tematica="navidad"]`.
- [ ] Los adornos:
  - `aria-hidden` y `pointer-events: none`;
  - nieve en CSS, solo con `prefers-reduced-motion: no-preference`;
  - `display: none` en `@media print`;
  - ningún adorno tapa un control (la prueba del `elementFromPoint` del botón flotante).
- [ ] La cinta: con menos movimiento queda quieta y envuelve en varias líneas. Se lee con un lector de
      pantalla una sola vez (el duplicado del bucle lleva `aria-hidden`).
- [ ] La sección de temporada: tarjetas como los destacados (`TarjetaProducto`), cuenta regresiva y
      título. Sin productos ni cuenta, no sale.
- [ ] E2E (enciende Navidad por `sqlLocal` y la deja en «según fechas» al terminar; un solo proyecto
      donde escriba):
  - con Navidad: el `data-tematica`, la barra con el texto de la campaña, la cinta, la sección y la
    cuenta regresiva;
  - el producto solo de temporada se ve en la portada y en su ficha;
  - apagada: la ficha da 404 y el sitio vuelve a como estaba;
  - axe sin fallos con Navidad, en los dos tamaños y con el menú del celular abierto;
  - el área táctil, en verde.
- [ ] `PASADAS` de Lighthouse de `/` con Navidad encendida contra `main`, intercaladas y en la misma
      sesión (la regla de AGENTS.md), anotando el resultado en «Lo que resultó distinto».
- [ ] Escribir `docs/tematicas.md` (cómo poner fechas, encender, apagar y elegir productos) y
      actualizar `AGENTS.md`.
- [ ] Revisión de la rama por un subagente (opus) antes del PR. Arreglar lo Importante viendo fallar
      primero su prueba.
- [ ] Commit: `feat(tematicas): Navidad en el sitio público`. Abrir el PR.

## Lo que resultó distinto

**T1 (20/11/2026).**

- **La columna `modo` se llama `encendido`** (y `encendido_desde`, `encendido_hasta` y, en
  `tematicas_panel`, `encendido_vigente`). `modo` ya tenía etiqueta y palabras en el Historial, las de
  los permisos de clientes («Cómo se dio», «De palabra»), y ese diccionario no distingue tablas. El
  formulario de T2 manda `encendido` a `guardar_tematica`.
- **`tematicas` no entra en `TABLAS_CON_PANTALLA`**: no tiene `deleted_at`, siempre existe y su
  pantalla va por slug (`/admin/contenido/tematicas/<slug>`), así que «Ir a» no necesita preguntar si
  existe.
- **La revisión de la rama encontró tres cosas importantes**, arregladas con su prueba vista fallar:
  - el panel podía escribir `encendido_hasta` a mano (y dejar Navidad encendida hasta 2099), así que
    ahora el trigger la pone siempre igual a la fecha de fin;
  - una temática encendida a mano y ya caducada no dejaba guardar ni un texto, así que ahora cuenta
    como «según fechas», y `guardar_tematica` la lleva a «según fechas» antes de aplicar lo que pide
    el formulario;
  - la prueba «ni sus fotos» no podía fallar, porque el panetón no tenía foto en la semilla.
- **También se arreglaron menores que, después del `db push`, costarían otra migración**: el cerrojo
  de cruces es `pg_advisory_xact_lock` (el `lock table` dejaba a dos guardados a la vez en bloqueo
  mutuo), `service_role` puede ejecutar las dos funciones, las tablas fuerzan la RLS como todas, la
  cinta no admite mensajes vacíos y un producto repetido en el formulario cuenta una vez.
- **pgTAP:** 52 pruebas nuevas; la suite queda en 798.

**T3 (20/11/2026).**

- **Dan eligió las dos variantes**: «desarrolla las dos, cuando hayas terminado deja aplicado la de
  noche de navidad». Eso no estaba en el plan y pide una migración, la **0048**
  (`tematicas.estilo`, `noche` o `crema`, con un `check` de los estilos que tienen CSS). Navidad
  queda con `noche`. Va sola en su PR, como toda migración, entre el de T2+T3 y el de T4.
- **El panel gana una pestaña «Estilo»** en el formulario de la temática (dos opciones, con su
  descripción), y el Historial dice «Estilo: Noche de Navidad → Crema navideña».
- `tematicas_panel` se borra y se vuelve a crear: llevaba `t.*`, que Postgres expande al crear la
  vista, así que la columna nueva no habría aparecido. `tematica_publica` se amplía al final.
- Una temática nueva tiene que decir su estilo (la columna no tiene valor por defecto). La fixture de
  `0047_tematicas.test.sql` lo dice; pgTAP queda en 809.

**T4 (20/11/2026).**

- **Los dos estilos van en el mismo CSS**, bajo `[data-tematica="navidad"][data-estilo="noche|crema"]`,
  y los tokens se repiten en `:root:has(...)`: la envoltura de `CascaraPublica` es `display: contents`
  y no pinta fondo, así que sin eso el `body` seguía crema detrás del pino. En `noche` el logo va
  sobre un fondo crema (`.logo-publico`), como pedía la maqueta.
- **Los adornos son solo CSS** (luces en `header::before/::after`, nieve en el `::before` de la
  envoltura, borde nevado en la sección); no hizo falta `adornos-navidad.tsx`. La cinta y la sección
  sí son componentes (`cinta-tematica.tsx`, `seccion-temporada.tsx`).
- **La sección de temporada reparte como «Lo que horneamos hoy»**: con una o dos fotos, tarjetas al
  lado de la pizarra; con tres o más, la rejilla. Con una tarjeta sola en una fila de cuatro quedaba
  medio vacía, que es lo que el bloque de abajo ya había resuelto. El borde nevado cruza la pantalla:
  la sección ocupa todo el ancho y el contenido va dentro.
- **La barra de arriba dice el texto de la campaña** con su propio nombre de región («Campaña de
  temporada») y un icono de destellos, en lugar del horario.
- **Las E2E que encienden la temática van en un proyecto aparte** (`tematicas`, que depende de `movil`
  y `escritorio`), y un proyecto `preparar` apaga antes la que esté activa. Sin eso, una temática
  encendida a mitad de suite tiñe el sitio y tumba pruebas de color; y en diciembre la suite entera
  correría con Navidad encendida por fechas. `panel-tematicas.spec.ts` se mudó también allí.
- **`verificar-sitio-publico.sh` prueba el Punto 5** por PostgREST: marca el panetón como solo de
  Navidad con la llave de servicio, comprueba que `anon` deja de verlo en `productos`,
  `producto_variantes`, `producto_imagenes` y `productos_publicos`, y que vuelve a verse al quitar la
  marca. Si hay una temática activa, se salta diciendo por qué.
- **La revisión de la rama (opus) encontró** que las dos pruebas del proyecto `tematicas` podían correr
  a la vez y pisarse la fila de Navidad (ahora con el cerrojo `tematica-navidad`), que al imprimir con
  la noche el texto crema salía invisible sobre el papel (los tokens van en `@media screen`), que si
  fallaba la lectura de productos el formulario salía vacío y «Guardar» los borraba todos (ahora se
  avisa y no se pinta), y menores: la estrella de la cinta se leía en voz alta, las casillas «Solo se
  vende en esta temporada» no decían de qué producto eran, el editor no avisaba de que la portada
  enseña ocho, y el guion borraba una fila que no había creado. Todo arreglado.
- **axe en todas las páginas públicas** con la temática (no solo la portada) cazó que en `/ubicacion`
  el crédito de Leaflet, que se pinta en blanco, quedaba con letra crema: dentro del mapa, `--primary`
  vuelve al terracota de la marca.
- **Rendimiento** (20/11/2026, `/` con Navidad encendida en estilo noche, frente a `main` `68e5f02`,
  10 rondas intercaladas con las dos builds guardadas, misma sesión): mediana **91 frente a 90.5**,
  media 91.1 frente a 90.3, p = 0.13 (prueba de permutación). Las 20 pasadas cayeron en el modo de LCP
  alto (> 3 s) en las dos versiones. La temática no cuesta.
- **Verificación:** Vitest 580 (contrastes de los dos estilos, cuenta regresiva, estilos), pgTAP 809,
  E2E de temáticas 4/4 con dos procesos a la vez (axe en las 11 páginas públicas a 375 px y en
  escritorio, menú abierto, área táctil de la sección, cinta quieta con menos movimiento, sin adornos
  ni letra crema al imprimir), sitio público 259 pasan y 35 se saltan, panel (accesibilidad, productos,
  historial) 212 pasan, y `verificar-sitio-publico.sh` en verde.

**Ajustes del 20/11/2026, pedidos por Dan con todo ya en `main`** (sin migración):

- **Volver en Temáticas:** la lista lleva `volver` a «Contenido», como las demás listas de Contenido
  (con su E2E en `panel-tematicas.spec.ts`).
- **Las luces se turnan:** las bombillas van en dos tandas (rojas y verdes en `header::before`,
  doradas y blancas en `.adornos-tematica__luces`), cada una con su halo dibujado, y solo se anima su
  opacidad, con media vuelta de diferencia. Con menos movimiento, quietas y encendidas.
- **Bolas colgando:** cuatro desordenadas a la izquierda (roja, dorada, verde y blanca, hilos y
  tamaños distintos) y una sola a la derecha, cada una con su balanceo. Hacía falta un elemento: un
  seudoelemento no da para cinco bolas que se mezan cada una a su aire. Es `.adornos-tematica`, que
  `Cabecera` pinta solo con una temática activa (`aria-hidden`, sin clics); sin temática, el HTML no
  cambia. El elemento que gira es solo el hilo (1.5 px), y la tapa y la bola son sus seudoelementos:
  así, al mecerse, nada sube por encima de la cabecera. A partir de 768 px, todo un 35 % más grande.
- **Copos grandes:** en el `::after` de la envoltura, una máscara de copos de seis puntas sobre el
  color de `--nieve`, que cae más despacio que los puntos y se mece. Se mueve la capa (`translate`),
  no el fondo, así que no se vuelve a pintar en cada fotograma.
- **Pruebas:** `tematica-navidad.spec.ts` comprueba ahora que las dos tandas se turnan, que las cinco
  bolas y los copos se mueven, que ningún adorno recibe clics, sube sobre la cabecera ni desborda (a
  375 px y a 1280 px, con los dos estilos), que con menos movimiento **nada** de la página se anima
  (ni un seudoelemento) y que al imprimir no sale ningún adorno. Capturas en
  `DOC/Maquetas/tematicas/navidad/adornos/`.
- **La revisión de la rama (opus) no encontró nada importante.** Se arreglaron sus menores: las
  bombillas doradas y blancas se pintaban delante de las bolas (ahora detrás, como las otras), la bola
  verde se cortaba contra el borde al mecerse, tapa y bola se centran con `transform` (también sin las
  propiedades sueltas), y la prueba mira ahora que los seudoelementos de la cabecera y de la envoltura
  no reciben clics, que al apagar la temática el elemento de los adornos desaparece del HTML y dónde
  empieza de verdad lo que cuelga (el borde de la cabecera, no 1 px fijo). Queda sin tocar, porque es
  de T4: la nieve de puntos anima `background-position` en una capa a pantalla completa y se repinta en
  cada fotograma; se puede pasar a `translate`, como los copos. Tampoco se volvió a medir Lighthouse.
