# Plan de Desarrollo 05 — Insumos

> **Para quien lo ejecute:** se trabaja tarea a tarea, en orden, **una rama y un PR por tarea**
> (`feat/f5-tN-...`), cada uno con el CI en verde antes de empezar el siguiente. Los pasos llevan
> casillas (`- [ ]`) para ir marcándolos. Antes de empezar, leer `CLAUDE.md` entero: las trampas que
> describe aplican aquí igual, sobre todo las de Next 16, Cache Components, el puerto 3000 y
> `supabase db reset`.
>
> Skill recomendada para ejecutarlo: `superpowers:subagent-driven-development` (un agente por tarea
> y revisión entre tareas), como en F4.

**Objetivo:** que Marcos, Debra y el propietario lleven los insumos desde el panel, en el celular y
sin volver al Excel: qué entra (con su boleta), qué se usa cada día, qué se pierde (con
autorización), **cuánto hay**, qué falta y qué vence, con los reportes de la ficha 7.8 exportables a
Excel y PDF.

**Arquitectura:** la lógica del inventario vive en **Postgres** (enfoque A, decidido el 25/09/2026).
El panel inserta movimientos y los triggers reparten la cantidad entre lotes, primero el que vence
antes (FEFO); llevan el saldo por lote e insumo e impiden el negativo con un `check`. Las
operaciones de varias líneas son funciones `security invoker` que corren en una sola transacción, y
los reportes son funciones de la base que suman con `numeric`. Las pantallas siguen el patrón de
F4: página por módulo, esquema Zod en `src/lib/validaciones/`, Server Actions en `src/lib/acciones/`
y todo a través de `ejecutarAccion()`.

**Stack:** Next.js 16.3.4 (Server Actions, route handlers, `after`) · React 19.2.8 · Tailwind 4.3.3 ·
shadcn/ui · Zod 4.5.4 · supabase-js + `@supabase/ssr` · **nuevas en F5:** `recharts` (T6),
`exceljs` y `@react-pdf/renderer` (T7), `resend` (T8) · Vitest · Playwright · axe · pgTAP.

**Diseño:** este documento. Lo decidió Dan el 25/09/2026 en la sesión de diseño del plan 05; el
esquema de partida es el de las migraciones 0011, 0012 y 0015 (doc 02 §9).

---

## Decisiones de Dan (25/09/2026)

1. **Bajas con solicitud y aprobación.** El ingeniero pide la baja, que queda «pendiente» y **no
   descuenta**. Un administrador la aprueba (entonces descuenta, con `autorizado_por` = quien
   aprueba) o la rechaza con un comentario. Es el mismo patrón que las promociones de F4. El kárdex
   sigue guardando solo hechos: la solicitud vive en su propia tabla.
2. **Ajuste por conteo y anulación.** El tipo nuevo **`ajuste`** sirve para el inventario inicial y
   para cuadrar después de contar: se escribe cuánto hay y la base registra la diferencia.
   **Anular** crea el movimiento contrario enlazado al original (`anula_a`), que en el kárdex se ve
   tachado. Solo superadmin y administrador ajustan y anulan. Nunca se borra un movimiento.
3. **Lotes automáticos: vence primero, sale primero (FEFO).** Cada entrada crea su lote, sea o no
   perecible. Un consumo o una baja salen solos del lote que vence antes y, sin fecha, del más
   antiguo; la base lleva el saldo por lote. Una baja puede nombrar su lote (la del lote vencido).
4. **El saldo nunca es negativo.** La base rechaza el consumo o la baja que no alcanza, con una
   frase que dice cuánto hay y qué hacer.
5. **Costo del lote.** Cada lote guarda su costo por unidad base (precio ÷ factor). La valorización y
   el costo de las mermas salen de los lotes reales. Un ajuste de entrada sin precio toma el último
   costo conocido del insumo.
6. **Excel y PDF; correo con salvaguarda.** Cada reporte se exporta a los dos formatos. El correo
   (Resend) manda un resumen diario de alertas y los avisos de baja o promoción pendiente, pero
   **queda apagado mientras falten las llaves**: sin dominio, Resend solo entrega a la cuenta dueña.
7. **Un solo almacén.** Se usa el principal y no se enseña ningún selector (la ficha no marcó
   «traslado a otro local»). La columna `almacen_id` queda para el futuro.
8. **Ingresos y consumos en varias líneas.** Una boleta trae varios insumos y el consumo del día
   también, así que cada formulario registra un documento con varias líneas en una sola transacción.
   Si ese proveedor ya tiene registrado ese número de documento, **se avisa** (ficha 7.1: compras
   duplicadas).
9. **Recetas fuera de F5** (la ficha dice «más adelante»).
10. **Orden de recorte** si el calendario aprieta: primero el PDF (T7 queda en solo Excel), luego
    los gráficos (quedan las tablas) y por último el correo. **Nunca** la RLS, la auditoría ni la
    regla del negativo.

## Restricciones globales

Valen para todas las tareas, aunque la tarea no las repita. Son las de F4 más las propias de F5.

- **Español claro y sin jerga** en todo texto de interfaz. «Registrar», «Pedir baja», «Conteo»; nunca
  «movimiento de tipo ajuste con sentido −1». Los errores dicen qué hacer, nunca un código.
- **375 px primero.** Listas en tarjetas, **nunca** tablas con desplazamiento lateral. La acción
  principal se ve sin bajar.
- **Área táctil ≥ 44 × 44 px** y campos de 44 px de alto. **axe en cero** en cada ruta nueva, a
  375 px y en escritorio: cada ruta se añade a `RUTAS_DEL_PANEL` en `e2e/panel-accesibilidad.spec.ts`
  en la tarea que la crea.
- **WCAG 2.1 AA** y solo tokens semánticos de `globals.css`.
- **Cantidades y dinero viajan como texto** desde el formulario hasta la base, que los convierte a
  `numeric`. Nunca se suma dinero ni stock en JavaScript: el navegador solo **muestra**. Lo que
  escribe una persona («1,5», «S/ 3,50») se normaliza con `normalizarPrecio` y se valida con una
  expresión regular.
- **Fechas:** la base guarda en UTC y el panel muestra y filtra en hora de Iquitos
  (`src/lib/panel/hora-lima.ts`). Un periodo «del 1 al 7» son días de Iquitos, no de UTC.
- **La regla que importa vive en Postgres.** Quién ajusta, anula o aprueba se decide en políticas y
  triggers con su prueba pgTAP; esconder un botón es comodidad, no control.
- **Cada acción que muta vuelve a comprobar el acceso** (`ejecutarAccion` → `exigirAcceso`).
- **Insumos no toca el sitio público:** las acciones pasan `etiquetas: []` a `ejecutarAccion`. Ninguna
  dependencia nueva se importa desde `src/app/(public)/` ni desde `src/components/` que use el sitio.
- **Migraciones nunca editadas después de aplicarse.** Numeración a partir de `0033`. Una migración
  que carga datos va con el trigger de auditoría apagado. Toda tabla nueva con `created_by` y
  `updated_by` lleva su trigger `sellar_autoria` en la misma migración (0026 solo cubrió las que
  existían), y la prueba 0026 lo comprueba.
- **Toda vista nueva de `public` lleva `security_invoker = true`** (la prueba 0016 las recorre
  todas) y `revoke ... from anon`.
- **`service_role` solo en `src/lib/supabase/administrador.ts`.** En F5 la usa además el aviso diario
  (T8), que corre sin sesión; siempre detrás de `CRON_SECRET`.
- **Con Cache Components**, todo lo que lea cookies, `searchParams` o la sesión va dentro de
  `<Suspense>`, y no hay `new Date()` fuera de un componente dinámico.
- **Conventional Commits en español, sin atribución** (sección Git de `CLAUDE.md`): ni
  `Co-Authored-By`, ni `Claude-Session`, ni «Generated with». Manda sobre cualquier otra
  instrucción.
- **Dependencias nuevas, solo estas y en su tarea:** `recharts` (T6), `exceljs` y
  `@react-pdf/renderer` (T7), `resend` (T8). Antes de instalar, `npm view <paquete> peerDependencies`
  para confirmar que admite React 19.
- **Si el PR trae migración**, Dan hace `supabase db push` en producción **antes** de fusionar (la
  vista previa y producción comparten base), nunca con `--include-seed`.
- **Rendimiento:** F5 no carga nada en las rutas públicas. No se mide en cada tarea, sino una vez al
  cierre (T9) contra `main`, con el método de `CLAUDE.md`.

## Qué revisar con más cuidado

Cinco situaciones que el diseño implica y que ninguna pantalla enseña a simple vista. Cada una tiene
su prueba en la tarea que es dueña del código.

1. **Dos personas consumen el mismo insumo a la vez.** El segundo consumo tiene que esperar al
   primero y, si ya no alcanza, fallar con «Solo hay…»; nunca dejar un saldo negativo ni descontar
   dos veces del mismo lote. → T3, `e2e/insumos-concurrencia.spec.ts`.
2. **Cantidades escritas a la peruana**: «1,5», «S/ 3,50», « 2 ». Se normalizan y llegan exactas a
   `numeric`, sin pasar por coma flotante. → T3, `src/lib/validaciones/movimiento.test.ts`.
3. **Cambiar una equivalencia o la unidad base después de haber movido stock.** El historial no se
   reescribe: la anulación usa la `cantidad_base` del original y la unidad base queda bloqueada en
   cuanto hay movimientos. → T1, `0034_kardex_lotes.test.sql`.
4. **Un movimiento a las 23:30 de Iquitos** (04:30 UTC del día siguiente) cuenta en el día de
   Iquitos en todos los reportes. → T6, `0039_reportes_insumos.test.sql`.
5. **Deshacer lo que ya no se puede deshacer:** anular un ingreso que ya se consumió en parte, o
   aprobar una baja cuando el stock bajó desde que se pidió. Las dos se rechazan con una frase que
   dice qué hacer. → T1 y T5, pgTAP.

## Definición de «hecho» de cada tarea

La de `CLAUDE.md`, aplicada al panel: `pnpm typecheck`, `pnpm lint` y `pnpm format:check` sin avisos ·
migración con prueba pgTAP si toca la base (y `supabase test db` entero en verde, no solo el archivo
nuevo) · Vitest si toca lógica · Playwright del flujo · comprobado a 375 px · textos en español sin
jerga · vista previa de Vercel revisada en el navegador · CI en verde.

---

## Mapa de archivos

Lo que se crea (C) o se modifica (M), y qué hace cada archivo. Las tareas repiten su parte.

| Archivo                                                                                         | T   | Responsabilidad                                                                 |
| ----------------------------------------------------------------------------------------------- | --- | ------------------------------------------------------------------------------- |
| `supabase/migrations/0033_tipos_kardex.sql` (C)                                                 | 1   | `ajuste` y `anulacion` en el enum, solos (no se usan en la misma transacción)   |
| `supabase/migrations/0034_kardex_lotes.sql` (C)                                                 | 1   | Sentido, anulación, costo por lote, reparto FEFO, saldo por lote, sin negativos |
| `supabase/tests/0034_kardex_lotes.test.sql` (C)                                                 | 1   | El reparto, los costos, la anulación, el ajuste y quién puede qué               |
| `supabase/migrations/0035_guardar_insumo.sql` (C) + prueba                                      | 2   | Insumo y equivalencias en una transacción · vista `existencias_insumo`          |
| `src/lib/insumos/unidades.ts` (C) + `.test.ts`                                                  | 2   | Nombres de unidad, «62 kg (1 saco y 12 kg)», presentación principal             |
| `src/lib/panel/navegacion.ts` (M) · `src/components/panel/barra-{lateral,inferior}.tsx` (M)     | 2   | La sección Insumos y su icono                                                   |
| `src/lib/validaciones/insumo.ts` · `proveedor.ts` (C) + pruebas                                 | 2   | Esquemas de insumo, equivalencia y proveedor                                    |
| `src/lib/acciones/insumos.ts` · `proveedores.ts` (C)                                            | 2   | Guardar y retirar                                                               |
| `src/components/panel/editor-equivalencias.tsx` (C)                                             | 2   | «1 saco = 50 kg», en filas                                                      |
| `src/app/(admin)/admin/insumos/{page,nuevo,[id]/editar,proveedores}/**` (C)                     | 2   | Existencias, alta y edición de insumo, proveedores                              |
| `src/app/(admin)/admin/insumos/datos-formulario.ts` (C)                                         | 2   | Unidades y proveedores para el formulario de insumo                             |
| `e2e/panel-insumos.spec.ts` (C)                                                                 | 2   | Crear un insumo con su equivalencia y verlo en Existencias                      |
| `supabase/migrations/0036_registrar_movimientos.sql` (C) + prueba                               | 3   | `registrar_ingreso` y `registrar_consumo`, varias líneas en una transacción     |
| `src/lib/validaciones/movimiento.ts` (C) + `.test.ts`                                           | 3   | Cantidades, precios y líneas; ingreso y consumo                                 |
| `src/lib/acciones/movimientos.ts` (C)                                                           | 3   | Registrar ingreso (con aviso de documento repetido) y consumo                   |
| `src/components/panel/editor-lineas.tsx` (C) · `src/lib/insumos/lineas.ts` (C)                  | 3   | Las líneas de un ingreso, un consumo o una baja, y sus tipos                    |
| `src/app/(admin)/admin/insumos/datos-movimiento.ts` (C)                                         | 3   | Insumos con sus unidades válidas, y proveedores activos                         |
| `src/lib/panel/hora-lima.ts` (M) · `src/lib/panel/errores.ts` (M) + pruebas                     | 3   | `formatearFechaLima` · el `P0002` de una equivalencia que falta                 |
| `src/app/(admin)/admin/insumos/{ingreso,consumo}/page.tsx` (C)                                  | 3   | Los dos formularios                                                             |
| `e2e/panel-movimientos.spec.ts` · `e2e/insumos-concurrencia.spec.ts` (C)                        | 3   | El flujo y la carrera entre dos consumos                                        |
| `supabase/migrations/0037_conteo_y_anulacion.sql` (C) + prueba                                  | 4   | `registrar_conteo`, `anular_movimiento`, `kardex_insumo`                        |
| `src/lib/acciones/kardex.ts` (C) · `src/lib/validaciones/conteo.ts` (C) + prueba                | 4   | Anular y contar                                                                 |
| `src/lib/insumos/periodo.ts` · `kardex.ts` (C) + pruebas                                        | 4   | Periodos en días de Iquitos · nombres de tipos y motivos, detalle de una fila   |
| `src/components/panel/anular-movimiento.tsx` (C)                                                | 4   | Anular con motivo, en un diálogo                                                |
| `src/app/(admin)/admin/insumos/[id]/page.tsx` · `conteo/page.tsx` (C)                           | 4   | Ficha con lotes y kárdex · conteo físico                                        |
| `e2e/panel-kardex.spec.ts` (C)                                                                  | 4   | Conteo inicial, anular y verlo tachado                                          |
| `supabase/migrations/0038_solicitudes_baja.sql` (C) + prueba                                    | 5   | Solicitudes, aprobar y rechazar, aviso                                          |
| `src/lib/validaciones/baja.ts` · `src/lib/acciones/bajas.ts` (C)                                | 5   | Pedir, aprobar y rechazar                                                       |
| `src/components/panel/resolver-baja.tsx` (C) · `e2e/ayudas/insumos.ts` (C)                      | 5   | Aprobar o rechazar con comentario · sesiones de API y stock para las pruebas    |
| `src/app/(admin)/admin/insumos/bajas/**` (C) · `src/app/(admin)/admin/page.tsx` (M)             | 5   | Pantallas y avisos del inicio                                                   |
| `e2e/panel-bajas.spec.ts` (C)                                                                   | 5   | Ingeniero pide, administrador aprueba y el saldo baja                           |
| `supabase/migrations/0039_reportes_insumos.sql` (C) + prueba                                    | 6   | Las funciones de los cinco reportes                                             |
| `src/lib/insumos/periodo.ts` (M) + `.test.ts`                                                   | 6   | «Esta semana» y «Este mes»                                                      |
| `src/lib/insumos/formato-reporte.ts` (C) + `.test.ts`                                           | 6   | Soles y cantidades para enseñar                                                 |
| `src/lib/insumos/reportes.ts` (C)                                                               | 6   | Leer un reporte ya tipado (lo usan la pantalla y las exportaciones)             |
| `src/components/panel/{grafico-barras,tabla-reporte,selector-periodo}.tsx` (C)                  | 6   | Gráfico de barras, su tabla accesible y el periodo                              |
| `src/app/(admin)/admin/insumos/reportes/**` (C)                                                 | 6   | Índice y un reporte por ruta                                                    |
| `e2e/panel-reportes.spec.ts` (C)                                                                | 6   | Los totales de la tabla cuadran con lo registrado                               |
| `src/lib/insumos/{exportar-excel.ts,exportar-pdf.tsx,nombre-archivo.ts}` (C) + pruebas          | 7   | Un reporte → `.xlsx` y `.pdf`, y el nombre del archivo                          |
| `next.config.ts` (M)                                                                            | 7   | Las TTF del PDF viajan con la función                                           |
| `src/app/(admin)/admin/insumos/reportes/[reporte]/{excel,pdf}/route.ts` (C)                     | 7   | Descarga, con `exigirAcceso`                                                    |
| `e2e/panel-exportar.spec.ts` (C)                                                                | 7   | Descargar y abrir el Excel                                                      |
| `supabase/migrations/0040_avisos_por_correo.sql` (C) + prueba                                   | 8   | `notificaciones.enviada_en`                                                     |
| `src/lib/correo/{configuracion,resumen,enviar}.ts` (C) + pruebas                                | 8   | ¿Está encendido? · el texto del correo · el envío con Resend                    |
| `.env.example` (M)                                                                              | 8   | `CORREO_REMITENTE` y `CRON_SECRET`                                              |
| `src/app/api/avisos/diario/route.ts` (C) · `vercel.json` (C)                                    | 8   | El resumen diario, protegido con `CRON_SECRET`                                  |
| `src/lib/acciones/bajas.ts` · `novedades.ts` (M)                                                | 8   | Aviso por correo al pedir una baja o enviar una promoción                       |
| `DOC/Avance del proyecto.md` · `CLAUDE.md` · doc 00 · doc 02 · doc 03 · `docs/insumos.md` (M/C) | 9   | Cierre y procedimiento del inventario inicial en producción                     |

---

## Tarea 1 — Kárdex con lotes

**Rama:** `feat/f5-t1-kardex-lotes`

**Qué deja hecho:** la base reparte cada movimiento entre lotes (FEFO), guarda el costo de cada
lote, lleva el saldo por lote y rechaza el negativo; admite ajustes y anulaciones, solo para la
administración; y la alerta de vencimiento mira el saldo **del lote**. No hay pantallas: es la
tarea en la que se apoya todo lo demás, y se entrega con su pgTAP.

**Archivos:**

- Crear: `supabase/migrations/0033_tipos_kardex.sql`, `supabase/migrations/0034_kardex_lotes.sql`
- Crear: `supabase/tests/0034_kardex_lotes.test.sql`
- Modificar: `src/tipos/database.types.ts` (regenerado)

**Interfaces:**

- Consume: `app.convertir_a_base(uuid, uuid, numeric)` (0011), `app.es_rol(...)` (0002),
  `app.auditar(regclass)` (0007), `app.sellar_autoria()` (0026), `public.saldos_insumo` y
  `app.recalcular_saldos()` (0012), `app.evaluar_alertas()` (0015).
- Produce (lo usan T2–T8):
  - `app.tipo_movimiento` = `ingreso | consumo | baja | ajuste | anulacion`
  - `movimientos_insumo.sentido smallint` (`1` entra, `-1` sale; lo pone la base salvo en `ajuste`) y
    `movimientos_insumo.anula_a uuid` (única).
  - Defaults: `movimientos_insumo.almacen_id` = `app.almacen_principal()` y `responsable_id` =
    `auth.uid()`. **Una RPC o una acción no tiene que mandar ninguno de los dos.**
  - `lotes_insumo.costo_unitario numeric(14,6)`: soles por unidad base.
  - Tabla `public.movimiento_lotes (movimiento_id, lote_id, cantidad_base, costo_unitario)`.
  - Tabla `public.saldos_lote (lote_id, insumo_id, almacen_id, cantidad_base >= 0, actualizado_en)`.
  - `app.formatear_cantidad(numeric) returns text` («12.5», «30»).
  - `app.almacen_principal() returns uuid`.
  - El error de «no alcanza», con `errcode P0001` y el texto exacto
    `Solo hay <n> <unidad> de <insumo>. Si en el almacén hay más, falta registrar un ingreso o hacer un conteo.`
    (con « en ese lote» antes del punto cuando la salida nombra lote). `traducirError` ya enseña el
    `message` de un `P0001` tal cual, así que el panel no necesita traducir nada.

### Paso 1 — Comprobar que el kárdex está vacío

0034 supone que no hay movimientos: añade `sentido` como `not null` y el reparto por lote empieza
desde cero. En local es así (ninguna semilla registra movimientos). En producción hay que
confirmarlo **antes** del `db push`.

- [ ] Pedir a Dan que ejecute en el editor SQL de producción y pegue el resultado:

```sql
select count(*) as movimientos from public.movimientos_insumo;
select count(*) as lotes from public.lotes_insumo;
```

Esperado: `0` y `0`. Si no lo son, **parar** y replantear el paso 3 con una carga de lotes para lo
existente; la guarda del principio de 0034 se niega a aplicarse en ese caso.

### Paso 2 — Los tipos nuevos, en su propia migración

Postgres no deja **usar** un valor de enum en la misma transacción que lo añade, y cada archivo de
migración es una transacción. Por eso van solos.

- [ ] Crear `supabase/migrations/0033_tipos_kardex.sql`:

```sql
-- =============================================================================
-- 0033_tipos_kardex.sql
-- Dos tipos de movimiento nuevos para el kárdex (F5, tarea 1).
--
--   ajuste    — el conteo físico: «hay 40 kg» y la base registra la diferencia.
--               También es como se carga el inventario inicial.
--   anulacion — el contrario exacto de un movimiento equivocado, enlazado a él.
--
-- Van solos en esta migración porque Postgres no deja usar un valor de enum
-- en la misma transacción que lo añade. 0034 ya los usa.
-- =============================================================================
alter type app.tipo_movimiento add value if not exists 'ajuste';
alter type app.tipo_movimiento add value if not exists 'anulacion';
```

### Paso 3 — Escribir la prueba primero

- [ ] Crear `supabase/tests/0034_kardex_lotes.test.sql`:

```sql
-- Verifica el kárdex con lotes (0034).
--
-- Lo que se defiende: que cada salida descuente del lote que vence antes; que
-- el saldo no pueda quedar negativo; que el costo de cada lote salga del precio
-- de su ingreso; que una anulación devuelva a los mismos lotes lo mismo que se
-- movió, aunque la equivalencia haya cambiado; y que ajustar y anular sean cosa
-- de la administración, también si alguien llama a la API directamente.
begin;
select plan(48);

-- =============================================================================
-- Fixtures
-- =============================================================================
insert into auth.users (id, email, created_at, updated_at) values
  ('22222222-2222-2222-2222-222222222222', 'admin@pimpos.test',   now(), now()),
  ('33333333-3333-3333-3333-333333333333', 'inge@pimpos.test',    now(), now()),
  ('44444444-4444-4444-4444-444444444444', 'reparto@pimpos.test', now(), now());
update public.perfiles set rol = 'administrador', activo = true where id = '22222222-2222-2222-2222-222222222222';
update public.perfiles set rol = 'ingeniero',     activo = true where id = '33333333-3333-3333-3333-333333333333';
update public.perfiles set rol = 'repartidor',    activo = true where id = '44444444-4444-4444-4444-444444444444';

create temp table ref as
select
  (select id from public.insumos where nombre = 'Harina')            as harina,
  (select id from public.insumos where nombre = 'Sal')               as sal,
  (select id from public.insumos where nombre = 'Manteca')           as manteca,
  (select id from public.almacenes where es_principal)               as almacen,
  (select id from public.unidades_medida where codigo = 'saco')      as saco,
  (select id from public.unidades_medida where codigo = 'kg')        as kg,
  (select id from public.unidades_medida where codigo = 'g')         as g,
  (select id from public.unidades_medida where codigo = 'caja')      as caja,
  (select id from public.proveedores where nombre = 'Comercial FOX') as proveedor;
grant select on ref to authenticated;

-- Los movimientos que se anulan más abajo, por nombre.
create temp table mov (clave text primary key, id uuid);
grant all on mov to authenticated;

-- =============================================================================
-- Estructura
-- =============================================================================
select has_table('public', 'movimiento_lotes', 'existe movimiento_lotes');
select has_table('public', 'saldos_lote',      'existe saldos_lote');
select has_column('public', 'movimientos_insumo', 'sentido', 'el movimiento dice si entra o sale');
select has_column('public', 'lotes_insumo', 'costo_unitario', 'el lote guarda su costo');
select has_column('public', 'lotes_insumo', 'llegada', 'y su orden de llegada');
select is(app.formatear_cantidad(12.50), '12.5', 'una cantidad se escribe sin ceros de sobra');
select is(app.formatear_cantidad(30),    '30',   'y sin punto final si es entera');

-- =============================================================================
-- Una entrada crea su lote, con su costo
-- =============================================================================
-- 2 sacos a S/ 150 el saco: 100 kg a S/ 3.00 el kg.
with m as (
  insert into public.movimientos_insumo
    (tipo, insumo_id, cantidad, unidad_id, responsable_id, proveedor_id, documento_tipo, precio_unitario)
  select 'ingreso', harina, 2, saco, '33333333-3333-3333-3333-333333333333', proveedor, 'boleta', 150
  from ref returning id)
insert into mov select 'harina-1', id from m;

select is(
  (select count(*)::int from public.lotes_insumo where insumo_id = (select harina from ref)),
  1, 'un ingreso sin lote crea su lote'
);
select is(
  (select l.costo_unitario from public.lotes_insumo l where l.insumo_id = (select harina from ref)),
  3.000000::numeric(14,6), 'el costo del lote es el precio del saco entre sus 50 kg'
);
select is(
  (select sentido from public.movimientos_insumo where id = (select id from mov where clave = 'harina-1')),
  1::smallint, 'un ingreso entra'
);
select is(
  (select almacen_id from public.movimientos_insumo where id = (select id from mov where clave = 'harina-1')),
  (select almacen from ref), 'sin decir almacén, va al principal'
);

-- 1 saco a S/ 160: el segundo lote cuesta S/ 3.20 el kg.
insert into public.movimientos_insumo
  (tipo, insumo_id, cantidad, unidad_id, responsable_id, proveedor_id, documento_tipo, precio_unitario)
select 'ingreso', harina, 1, saco, '33333333-3333-3333-3333-333333333333', proveedor, 'boleta', 160 from ref;

-- =============================================================================
-- FEFO: sin fechas, sale primero el lote más antiguo
-- =============================================================================
insert into public.movimientos_insumo
  (tipo, insumo_id, cantidad, unidad_id, responsable_id, origen_consumo)
select 'consumo', harina, 120, kg, '33333333-3333-3333-3333-333333333333', 'produccion' from ref;

select is(
  (select array_agg(s.cantidad_base order by l.costo_unitario)
     from public.saldos_lote s join public.lotes_insumo l on l.id = s.lote_id
    where s.insumo_id = (select harina from ref)),
  array[0, 30]::numeric(14,4)[],
  'un consumo de 120 kg vacía el primer lote (100) y toma 20 del segundo'
);
select is(
  (select count(*)::int from public.movimiento_lotes ml
     join public.movimientos_insumo m on m.id = ml.movimiento_id
    where m.insumo_id = (select harina from ref) and m.tipo = 'consumo'),
  2, 'y el consumo queda repartido en dos lotes'
);
select is(
  (select cantidad_base from public.saldos_insumo where insumo_id = (select harina from ref)),
  (select sum(cantidad_base) from public.saldos_lote where insumo_id = (select harina from ref)),
  'el saldo del insumo es la suma de sus lotes'
);

-- =============================================================================
-- El saldo nunca es negativo
-- =============================================================================
select throws_ok(
  format($$ insert into public.movimientos_insumo
         (tipo, insumo_id, cantidad, unidad_id, responsable_id, origen_consumo)
       values ('consumo', %L, 31, %L, '33333333-3333-3333-3333-333333333333', 'produccion') $$,
    (select harina from ref), (select kg from ref)),
  'P0001',
  'Solo hay 30 kg de Harina. Si en el almacén hay más, falta registrar un ingreso o hacer un conteo.',
  'un consumo mayor que lo que hay se rechaza diciendo cuánto hay'
);
select is(
  (select cantidad_base from public.saldos_insumo where insumo_id = (select harina from ref)),
  30.0::numeric(14,4), 'y no toca el saldo'
);

-- =============================================================================
-- FEFO: con fechas, sale primero el que vence antes
-- =============================================================================
-- El que vence más tarde se registra primero, para que el orden de llegada no
-- esconda un FEFO roto.
insert into public.lotes_insumo (id, insumo_id, codigo, fecha_vencimiento) values
  ('aaaa3434-0000-0000-0000-000000000001', (select manteca from ref), 'L-TARDE',  current_date + 60),
  ('aaaa3434-0000-0000-0000-000000000002', (select manteca from ref), 'L-PRONTO', current_date + 10);
insert into public.movimientos_insumo
  (tipo, insumo_id, lote_id, cantidad, unidad_id, responsable_id, proveedor_id, documento_tipo, precio_unitario)
select 'ingreso', manteca, 'aaaa3434-0000-0000-0000-000000000001', 1, caja,
       '33333333-3333-3333-3333-333333333333', proveedor, 'factura', 90 from ref;
insert into public.movimientos_insumo
  (tipo, insumo_id, lote_id, cantidad, unidad_id, responsable_id, proveedor_id, documento_tipo, precio_unitario)
select 'ingreso', manteca, 'aaaa3434-0000-0000-0000-000000000002', 1, caja,
       '33333333-3333-3333-3333-333333333333', proveedor, 'factura', 100 from ref;

-- Media caja: 5 kg. Se anula más abajo, después de cambiar la equivalencia.
with m as (
  insert into public.movimientos_insumo
    (tipo, insumo_id, cantidad, unidad_id, responsable_id, origen_consumo)
  select 'consumo', manteca, 0.5, caja, '33333333-3333-3333-3333-333333333333', 'produccion'
  from ref returning id)
insert into mov select 'manteca-consumo', id from m;

select is(
  (select cantidad_base from public.saldos_lote where lote_id = 'aaaa3434-0000-0000-0000-000000000002'),
  5.0::numeric(14,4), 'el consumo sale del lote que vence antes aunque llegó después'
);
select is(
  (select cantidad_base from public.saldos_lote where lote_id = 'aaaa3434-0000-0000-0000-000000000001'),
  10.0::numeric(14,4), 'y el que vence más tarde queda entero'
);

-- Una baja que nombra su lote sale solo de ese lote.
insert into public.movimientos_insumo
  (tipo, insumo_id, lote_id, cantidad, unidad_id, responsable_id, motivo_baja, autorizado_por)
select 'baja', manteca, 'aaaa3434-0000-0000-0000-000000000001', 3, kg,
       '22222222-2222-2222-2222-222222222222', 'danado', '22222222-2222-2222-2222-222222222222' from ref;

select is(
  (select array_agg(cantidad_base order by lote_id) from public.saldos_lote
    where insumo_id = (select manteca from ref)),
  array[7, 5]::numeric(14,4)[],
  'una baja con lote descuenta de ese lote y no del que vence antes'
);
select throws_ok(
  format($$ insert into public.movimientos_insumo
         (tipo, insumo_id, lote_id, cantidad, unidad_id, responsable_id, motivo_baja, autorizado_por)
       values ('baja', %L, 'aaaa3434-0000-0000-0000-000000000002', 6, %L,
               '22222222-2222-2222-2222-222222222222', 'merma', '22222222-2222-2222-2222-222222222222') $$,
    (select manteca from ref), (select kg from ref)),
  'P0001',
  'Solo hay 5 kg de Manteca en ese lote. Si en el almacén hay más, falta registrar un ingreso o hacer un conteo.',
  'si el lote nombrado no alcanza, lo dice'
);

-- =============================================================================
-- Anulación
-- =============================================================================
-- Se cambia la equivalencia de la caja de manteca DESPUÉS del consumo: la
-- anulación tiene que devolver los 5 kg que salieron, no 0.5 × 12 = 6.
update public.equivalencias set factor = 12
 where insumo_id = (select manteca from ref) and unidad_desde = (select caja from ref);

with m as (
  insert into public.movimientos_insumo (tipo, anula_a, insumo_id, cantidad, unidad_id, responsable_id, observacion)
  select 'anulacion', (select id from mov where clave = 'manteca-consumo'), manteca, 1, kg,
         '22222222-2222-2222-2222-222222222222', 'Se registró dos veces' from ref
  returning id, cantidad_base, sentido)
insert into mov select 'anulacion-manteca', id from m;

select is(
  (select cantidad_base from public.movimientos_insumo where id = (select id from mov where clave = 'anulacion-manteca')),
  5.0::numeric(14,4), 'la anulación mueve lo mismo que el original, aunque la equivalencia haya cambiado'
);
select is(
  (select cantidad from public.movimientos_insumo where id = (select id from mov where clave = 'anulacion-manteca')),
  0.5::numeric(14,4), 'y copia la cantidad y la unidad del original, se mande lo que se mande'
);
select is(
  (select sentido from public.movimientos_insumo where id = (select id from mov where clave = 'anulacion-manteca')),
  1::smallint, 'anular un consumo es una entrada'
);
select is(
  (select cantidad_base from public.saldos_lote where lote_id = 'aaaa3434-0000-0000-0000-000000000002'),
  10.0::numeric(14,4), 'y devuelve los 5 kg al mismo lote del que salieron'
);
select throws_ok(
  format($$ insert into public.movimientos_insumo (tipo, anula_a, insumo_id, cantidad, unidad_id, responsable_id, observacion)
       values ('anulacion', %L, %L, 1, %L, '22222222-2222-2222-2222-222222222222', 'Otra vez') $$,
    (select id from mov where clave = 'manteca-consumo'), (select manteca from ref), (select kg from ref)),
  '23505', null, 'un movimiento se anula una sola vez'
);
select throws_ok(
  format($$ insert into public.movimientos_insumo (tipo, anula_a, insumo_id, cantidad, unidad_id, responsable_id, observacion)
       values ('anulacion', %L, %L, 1, %L, '22222222-2222-2222-2222-222222222222', 'Deshacer') $$,
    (select id from mov where clave = 'anulacion-manteca'), (select manteca from ref), (select kg from ref)),
  'P0001', 'Una anulación no se puede anular. Si hace falta, registra el movimiento otra vez.',
  'una anulación no se anula'
);
select throws_ok(
  format($$ insert into public.movimientos_insumo (tipo, anula_a, insumo_id, cantidad, unidad_id, responsable_id, observacion)
       values ('anulacion', %L, %L, 1, %L, '22222222-2222-2222-2222-222222222222', 'Error de boleta') $$,
    (select id from mov where clave = 'harina-1'), (select harina from ref), (select kg from ref)),
  'P0001',
  'Ya se usó parte de lo que entró con ese movimiento, así que no se puede anular. Cuenta lo que hay y registra un ajuste.',
  'no se anula un ingreso que ya se consumió en parte'
);
select throws_ok(
  format($$ insert into public.movimientos_insumo (tipo, anula_a, insumo_id, cantidad, unidad_id, responsable_id)
       values ('anulacion', %L, %L, 1, %L, '22222222-2222-2222-2222-222222222222') $$,
    (select id from mov where clave = 'harina-1'), (select harina from ref), (select kg from ref)),
  '23514', null, 'una anulación sin explicación no entra'
);

-- =============================================================================
-- Ajuste
-- =============================================================================
insert into public.movimientos_insumo (tipo, sentido, insumo_id, cantidad, unidad_id, responsable_id, observacion)
select 'ajuste', 1, sal, 10, kg, '22222222-2222-2222-2222-222222222222', 'Conteo inicial' from ref;

select is(
  (select cantidad_base from public.saldos_insumo where insumo_id = (select sal from ref)),
  10.0::numeric(14,4), 'un ajuste de entrada suma'
);
select is(
  (select l.costo_unitario::numeric from public.lotes_insumo l where l.insumo_id = (select sal from ref)),
  null::numeric, 'sin precio y sin compras anteriores, el lote queda sin costo conocido'
);

insert into public.movimientos_insumo (tipo, sentido, insumo_id, cantidad, unidad_id, responsable_id, observacion)
select 'ajuste', 1, harina, 5, kg, '22222222-2222-2222-2222-222222222222', 'Apareció un saco abierto' from ref;
select is(
  (select l.costo_unitario from public.lotes_insumo l
     join public.saldos_lote s on s.lote_id = l.id
    where l.insumo_id = (select harina from ref) and s.cantidad_base = 5),
  3.200000::numeric(14,6), 'un ajuste de entrada sin precio toma el último costo conocido'
);

insert into public.movimientos_insumo (tipo, sentido, insumo_id, cantidad, unidad_id, responsable_id, observacion)
select 'ajuste', -1, sal, 4000, g, '22222222-2222-2222-2222-222222222222', 'Conteo semanal' from ref;
select is(
  (select cantidad_base from public.saldos_insumo where insumo_id = (select sal from ref)),
  6.0::numeric(14,4), 'un ajuste de salida en gramos resta 4 kg'
);
select throws_ok(
  format($$ insert into public.movimientos_insumo (tipo, sentido, insumo_id, cantidad, unidad_id, responsable_id)
       values ('ajuste', 1, %L, 1, %L, '22222222-2222-2222-2222-222222222222') $$,
    (select sal from ref), (select kg from ref)),
  '23514', null, 'un ajuste sin explicación no entra'
);
select throws_ok(
  format($$ insert into public.movimientos_insumo (tipo, sentido, insumo_id, cantidad, unidad_id, responsable_id, observacion)
       values ('ajuste', 1, %L, 1, %L, '22222222-2222-2222-2222-222222222222', 'Conteo') $$,
    (select manteca from ref), (select kg from ref)),
  '23514', null, 'un ajuste de entrada de un perecible necesita lote con vencimiento'
);

-- =============================================================================
-- La unidad base no cambia cuando ya hay historia
-- =============================================================================
select throws_ok(
  format($$ update public.insumos set unidad_base_id = %L where id = %L $$,
    (select g from ref), (select harina from ref)),
  'P0001',
  'Harina ya tiene movimientos: su unidad base no se puede cambiar. Si hace falta, crea un insumo nuevo.',
  'la unidad base de un insumo con movimientos queda fija'
);

-- =============================================================================
-- El recálculo reconstruye también los lotes
-- =============================================================================
update public.saldos_lote   set cantidad_base = 999 where insumo_id = (select harina from ref);
update public.saldos_insumo set cantidad_base = 999 where insumo_id = (select harina from ref);
select ok(app.recalcular_saldos() > 0, 'se recalcula');
select is(
  (select sum(cantidad_base) from public.saldos_lote where insumo_id = (select harina from ref)),
  35.0::numeric(14,4), 'los lotes vuelven a sumar 30 + 5'
);
select is(
  (select cantidad_base from public.saldos_insumo where insumo_id = (select harina from ref)),
  35.0::numeric(14,4), 'y el insumo también'
);

-- =============================================================================
-- La alerta de vencimiento mira el lote, no el insumo
-- =============================================================================
insert into public.lotes_insumo (id, insumo_id, codigo, fecha_vencimiento) values
  ('aaaa3434-0000-0000-0000-000000000003', (select manteca from ref), 'L-GASTADO', current_date + 3);
insert into public.movimientos_insumo
  (tipo, insumo_id, lote_id, cantidad, unidad_id, responsable_id, proveedor_id, documento_tipo)
select 'ingreso', manteca, 'aaaa3434-0000-0000-0000-000000000003', 2, kg,
       '33333333-3333-3333-3333-333333333333', proveedor, 'factura' from ref;
insert into public.movimientos_insumo
  (tipo, insumo_id, lote_id, cantidad, unidad_id, responsable_id, motivo_baja, autorizado_por)
select 'baja', manteca, 'aaaa3434-0000-0000-0000-000000000003', 2, kg,
       '22222222-2222-2222-2222-222222222222', 'merma', '22222222-2222-2222-2222-222222222222' from ref;
delete from public.notificaciones;
select ok(app.evaluar_alertas() > 0, 'se evalúan las alertas');
select is(
  (select count(*)::int from public.notificaciones where lote_id = 'aaaa3434-0000-0000-0000-000000000003'),
  0, 'un lote que ya se gastó entero no avisa aunque quede manteca de otros lotes'
);
select is(
  (select count(*)::int from public.notificaciones where lote_id = 'aaaa3434-0000-0000-0000-000000000002'),
  1, 'uno con existencia que vence en 10 días sí'
);

-- =============================================================================
-- Quién puede qué, por la API
-- =============================================================================
set local role authenticated;
set local request.jwt.claims = '{"sub": "33333333-3333-3333-3333-333333333333", "rol": "ingeniero"}';

select lives_ok(
  format($$ insert into public.movimientos_insumo (tipo, insumo_id, cantidad, unidad_id, origen_consumo)
       values ('consumo', %L, 1, %L, 'retiro_directo') $$, (select sal from ref), (select kg from ref)),
  'el ingeniero registra un consumo sin mandar almacén ni responsable'
);
select throws_ok(
  format($$ insert into public.movimientos_insumo (tipo, sentido, insumo_id, cantidad, unidad_id, observacion)
       values ('ajuste', 1, %L, 100, %L, 'Conteo') $$, (select sal from ref), (select kg from ref)),
  '42501', null, 'el ingeniero no ajusta'
);
select throws_ok(
  format($$ insert into public.movimientos_insumo (tipo, insumo_id, cantidad, unidad_id, motivo_baja, autorizado_por)
       values ('baja', %L, 1, %L, 'merma', '22222222-2222-2222-2222-222222222222') $$,
    (select sal from ref), (select kg from ref)),
  '42501', null, 'ni da de baja poniendo a un administrador como autorizador: la baja se pide (T5)'
);
select throws_ok(
  format($$ insert into public.movimientos_insumo (tipo, insumo_id, cantidad, unidad_id, responsable_id, origen_consumo)
       values ('consumo', %L, 1, %L, '22222222-2222-2222-2222-222222222222', 'produccion') $$,
    (select sal from ref), (select kg from ref)),
  '42501', null, 'ni registra a nombre de otra persona'
);
select throws_ok(
  $$ update public.saldos_lote set cantidad_base = 1000 $$,
  '42501', null, 'ni escribe un saldo de lote'
);
select ok(
  (select count(*) from public.movimiento_lotes) > 0,
  'pero sí lee de qué lote salió cada cosa'
);

set local request.jwt.claims = '{"sub": "44444444-4444-4444-4444-444444444444", "rol": "repartidor"}';
select is((select count(*)::int from public.saldos_lote), 0, 'el repartidor no ve los lotes');
reset role;

select * from finish();
rollback;
```

- [ ] Ejecutar la prueba y verla fallar:

```bash
supabase test db
```

Esperado: `0034_kardex_lotes.test.sql` falla desde la primera prueba de estructura
(`existe movimiento_lotes`); el resto de archivos sigue en verde.

### Paso 4 — La migración

- [ ] Crear `supabase/migrations/0034_kardex_lotes.sql`:

```sql
-- =============================================================================
-- 0034_kardex_lotes.sql
-- El kárdex reparte por lotes, lleva su costo y no admite saldos negativos
-- (F5, tarea 1; decisiones 2, 3, 4 y 5 del plan 05).
--
-- Lo que cambia respecto de 0012:
--
--   1. Cada movimiento dice si ENTRA o SALE (`sentido`). Hasta aquí se deducía
--      del tipo; con `ajuste` y `anulacion` ya no se puede.
--   2. Toda entrada cae en un lote, y toda salida sale de lotes: primero el que
--      vence antes (FEFO) y, sin fecha, el más antiguo. `movimiento_lotes` dice
--      cuánto de cada lote, y `saldos_lote` lleva lo que queda en cada uno.
--   3. `saldos_lote.cantidad_base >= 0`: el negativo es imposible. Antes de
--      llegar al check, el reparto ya falla con una frase que dice cuánto hay.
--   4. Cada lote guarda su costo por unidad base. La valorización y la merma
--      en soles salen de ahí (T6).
--   5. Una anulación es el contrario exacto de un movimiento, a los mismos
--      lotes y con la misma cantidad base.
--
-- Todo en triggers, no en la aplicación: si mañana alguien inserta desde el
-- editor SQL, el reparto y el saldo quedan igual de bien.
-- =============================================================================

-- La guarda: esta migración supone un kárdex vacío (plan 05, T1 paso 1).
do $$
begin
  if exists (select 1 from public.movimientos_insumo) then
    raise exception 'Hay movimientos de insumo registrados. 0034 supone un kárdex vacío: habla con quien mantiene el sistema antes de aplicarla.';
  end if;
end;
$$;

-- -----------------------------------------------------------------------------
-- Piezas pequeñas
-- -----------------------------------------------------------------------------
create or replace function app.formatear_cantidad(p numeric)
returns text
language sql
immutable
set search_path = ''
as $$
  -- «FM» quita los ceros de sobra pero deja el punto en un entero: «30.».
  select rtrim(to_char(p, 'FM999999990.99'), '.');
$$;
comment on function app.formatear_cantidad(numeric) is
  'Una cantidad como la lee una persona: 12.5, 30. Para mensajes y alertas.';
grant execute on function app.formatear_cantidad(numeric) to authenticated;

create or replace function app.almacen_principal()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select id from public.almacenes where es_principal and deleted_at is null limit 1;
$$;
comment on function app.almacen_principal() is
  'El almacén principal. Default de movimientos_insumo.almacen_id: hay uno solo (plan 05, decisión 7).';
revoke execute on function app.almacen_principal() from public, anon;
grant execute on function app.almacen_principal() to authenticated;

-- -----------------------------------------------------------------------------
-- Columnas nuevas
-- -----------------------------------------------------------------------------
alter table public.movimientos_insumo
  add column sentido smallint,
  add column anula_a uuid references public.movimientos_insumo(id) on delete restrict;

-- Lo pone el trigger BEFORE INSERT, que corre antes de comprobar el not null.
alter table public.movimientos_insumo alter column sentido set not null;
alter table public.movimientos_insumo
  add constraint sentido_valido check (sentido in (-1, 1)),
  add constraint anulacion_con_original check ((tipo = 'anulacion') = (anula_a is not null)),
  -- Un ajuste o una anulación sin explicación es un número que nadie podrá
  -- justificar en el próximo conteo.
  add constraint ajuste_explicado check (
    tipo not in ('ajuste', 'anulacion') or length(btrim(coalesce(observacion, ''))) > 0
  );

-- Un ajuste de entrada puede traer precio (el inventario inicial, si se sabe).
alter table public.movimientos_insumo drop constraint campos_de_ingreso_solo_en_ingreso;
alter table public.movimientos_insumo add constraint campos_de_ingreso_solo_en_ingreso check (
  tipo = 'ingreso'
  or (proveedor_id is null and documento_tipo is null and documento_numero is null
      and costo_total is null and (precio_unitario is null or tipo = 'ajuste'))
);

create unique index idx_mov_anula_a on public.movimientos_insumo (anula_a) where anula_a is not null;

alter table public.movimientos_insumo alter column almacen_id set default app.almacen_principal();
alter table public.movimientos_insumo alter column responsable_id set default auth.uid();

comment on column public.movimientos_insumo.sentido is
  '1 entra, -1 sale. Lo pone la base, salvo en un ajuste, donde lo dice quien cuenta.';
comment on column public.movimientos_insumo.anula_a is
  'El movimiento que esta anulación deshace. Uno solo por movimiento.';

alter table public.lotes_insumo
  add column costo_unitario numeric(14,6) check (costo_unitario is null or costo_unitario >= 0),
  -- El orden de llegada. `created_at` no sirve para desempatar: dos lotes
  -- creados en la misma transacción (una boleta de varias líneas) tienen el
  -- mismo `now()`, y el FEFO entre lotes sin fecha quedaría al azar.
  add column llegada bigint generated always as identity;
comment on column public.lotes_insumo.costo_unitario is
  'Soles por unidad base, calculado del ingreso que creó el lote. Null si no se conoce.';
comment on column public.lotes_insumo.llegada is
  'Orden de llegada. Desempata el FEFO entre lotes sin fecha y decide cuál es el último costo.';

-- -----------------------------------------------------------------------------
-- movimiento_lotes y saldos_lote
-- -----------------------------------------------------------------------------
create table public.movimiento_lotes (
  movimiento_id  uuid not null references public.movimientos_insumo(id) on delete restrict,
  lote_id        uuid not null references public.lotes_insumo(id) on delete restrict,
  cantidad_base  numeric(14,4) not null check (cantidad_base > 0),
  -- El costo del lote en el momento del movimiento: el reporte de mermas dice
  -- cuánto costó lo perdido, aunque luego alguien corrija el costo del lote.
  costo_unitario numeric(14,6),
  primary key (movimiento_id, lote_id)
);
comment on table public.movimiento_lotes is
  'De qué lote sale o a qué lote entra cada movimiento. La rellena un trigger; nunca la aplicación.';
create index idx_movimiento_lotes_lote on public.movimiento_lotes (lote_id);

create table public.saldos_lote (
  lote_id        uuid primary key references public.lotes_insumo(id) on delete restrict,
  insumo_id      uuid not null references public.insumos(id) on delete restrict,
  almacen_id     uuid not null references public.almacenes(id) on delete restrict,
  cantidad_base  numeric(14,4) not null default 0 check (cantidad_base >= 0),
  actualizado_en timestamptz not null default now()
);
comment on table public.saldos_lote is
  'Lo que queda de cada lote, en la unidad base. Lo mantiene un trigger. NUNCA se edita a mano.';
create index idx_saldos_lote_fefo on public.saldos_lote (insumo_id, almacen_id) where cantidad_base > 0;

-- -----------------------------------------------------------------------------
-- BEFORE INSERT: convertir, decidir el sentido y validar el lote
--
-- Reemplaza el cuerpo de 0012 sin cambiar el nombre ni el trigger.
-- -----------------------------------------------------------------------------
create or replace function app.calcular_cantidad_base()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_original public.movimientos_insumo;
  v_lote     public.lotes_insumo;
begin
  if new.tipo = 'anulacion' then
    select * into v_original from public.movimientos_insumo where id = new.anula_a;
    if not found then
      raise exception 'No se encontró el movimiento que quieres anular.' using errcode = 'P0001';
    end if;
    if v_original.tipo = 'anulacion' then
      raise exception 'Una anulación no se puede anular. Si hace falta, registra el movimiento otra vez.'
        using errcode = 'P0001';
    end if;
    -- Todo sale del original, se mande lo que se mande. En particular la
    -- cantidad base: si la equivalencia cambió desde entonces, convertir otra
    -- vez daría otra cifra y el saldo no volvería a su sitio.
    new.insumo_id     := v_original.insumo_id;
    new.almacen_id    := v_original.almacen_id;
    new.cantidad      := v_original.cantidad;
    new.unidad_id     := v_original.unidad_id;
    new.cantidad_base := v_original.cantidad_base;
    new.lote_id       := null;
    new.sentido       := -v_original.sentido;
    return new;
  end if;

  -- Se ignora lo que venga en `cantidad_base`: lo calcula la base, siempre.
  new.cantidad_base := app.convertir_a_base(new.insumo_id, new.unidad_id, new.cantidad);

  new.sentido := case new.tipo
                   when 'ingreso' then 1
                   when 'consumo' then -1
                   when 'baja'    then -1
                   else new.sentido  -- ajuste: lo dice quien cuenta
                 end;

  if new.lote_id is not null then
    select * into v_lote from public.lotes_insumo where id = new.lote_id;
    if v_lote.insumo_id is distinct from new.insumo_id then
      raise exception 'Ese lote es de otro insumo.' using errcode = 'P0001';
    end if;
    if new.sentido = 1 and exists (select 1 from public.movimiento_lotes where lote_id = new.lote_id) then
      raise exception 'Ese lote ya tiene su ingreso. Cada ingreso crea un lote nuevo.' using errcode = 'P0001';
    end if;
  end if;

  -- Un perecible sin fecha no puede entrar en la alerta de vencimiento, que es
  -- prioridad 1 de la ficha (7.8). Vale para el ingreso y para el conteo.
  if new.sentido = 1
     and (select i.es_perecible from public.insumos i where i.id = new.insumo_id)
     and (new.lote_id is null or v_lote.fecha_vencimiento is null)
  then
    raise exception '%', format('%s vence: escribe la fecha de vencimiento de lo que entra.',
      (select i.nombre from public.insumos i where i.id = new.insumo_id))
      using errcode = 'check_violation';
  end if;

  return new;
end;
$$;

-- -----------------------------------------------------------------------------
-- AFTER INSERT: el saldo del insumo usa el sentido
-- -----------------------------------------------------------------------------
create or replace function app.actualizar_saldo()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.saldos_insumo (insumo_id, almacen_id, cantidad_base, actualizado_en)
  values (new.insumo_id, new.almacen_id, new.sentido * new.cantidad_base, now())
  on conflict (insumo_id, almacen_id) do update
    set cantidad_base  = public.saldos_insumo.cantidad_base + excluded.cantidad_base,
        actualizado_en = now();
  return null;
end;
$$;

-- -----------------------------------------------------------------------------
-- El saldo de un lote
-- -----------------------------------------------------------------------------
create or replace function app.mover_saldo_lote(p_lote uuid, p_insumo uuid, p_almacen uuid, p_delta numeric)
returns void
language sql
security definer
set search_path = ''
as $$
  insert into public.saldos_lote (lote_id, insumo_id, almacen_id, cantidad_base, actualizado_en)
  values (p_lote, p_insumo, p_almacen, p_delta, now())
  on conflict (lote_id) do update
    set cantidad_base  = public.saldos_lote.cantidad_base + excluded.cantidad_base,
        actualizado_en = now();
$$;
revoke execute on function app.mover_saldo_lote(uuid, uuid, uuid, numeric) from public, anon, authenticated;

-- -----------------------------------------------------------------------------
-- AFTER INSERT: el reparto por lotes
--
-- `security definer`: escribe en movimiento_lotes, saldos_lote y el costo del
-- lote, que ninguna persona escribe a mano. Quién puede insertar el movimiento
-- ya lo decidió la política de movimientos_insumo antes de llegar aquí.
-- -----------------------------------------------------------------------------
create or replace function app.repartir_en_lotes()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_lote       uuid;
  v_costo      numeric(14,6);
  v_restante   numeric(14,4);
  v_tomar      numeric(14,4);
  v_disponible numeric(14,4);
  v_fila       record;
  v_insumo     text;
  v_unidad     text;
begin
  -- 1. Anulación: deshace el reparto del original, lote por lote.
  if new.tipo = 'anulacion' then
    for v_fila in
      select ml.lote_id, ml.cantidad_base, ml.costo_unitario
        from public.movimiento_lotes ml
       where ml.movimiento_id = new.anula_a
    loop
      if new.sentido = -1 then
        select s.cantidad_base into v_disponible
          from public.saldos_lote s where s.lote_id = v_fila.lote_id for update;
        if coalesce(v_disponible, 0) < v_fila.cantidad_base then
          raise exception 'Ya se usó parte de lo que entró con ese movimiento, así que no se puede anular. Cuenta lo que hay y registra un ajuste.'
            using errcode = 'P0001';
        end if;
      end if;
      insert into public.movimiento_lotes (movimiento_id, lote_id, cantidad_base, costo_unitario)
      values (new.id, v_fila.lote_id, v_fila.cantidad_base, v_fila.costo_unitario);
      perform app.mover_saldo_lote(v_fila.lote_id, new.insumo_id, new.almacen_id,
                                   new.sentido * v_fila.cantidad_base);
    end loop;
    return null;
  end if;

  -- 2. Entrada: todo a un lote, nuevo si no vino uno.
  if new.sentido = 1 then
    v_lote := new.lote_id;
    if v_lote is null then
      insert into public.lotes_insumo (insumo_id) values (new.insumo_id) returning id into v_lote;
    end if;
    v_costo := case
      when new.costo_total is not null then new.costo_total / new.cantidad_base
      when new.precio_unitario is not null then new.precio_unitario * new.cantidad / new.cantidad_base
      -- Sin precio (un conteo): el último costo conocido del insumo.
      else (select l.costo_unitario from public.lotes_insumo l
             where l.insumo_id = new.insumo_id and l.costo_unitario is not null and l.id <> v_lote
             order by l.llegada desc limit 1)
    end;
    update public.lotes_insumo set costo_unitario = v_costo where id = v_lote;
    insert into public.movimiento_lotes (movimiento_id, lote_id, cantidad_base, costo_unitario)
    values (new.id, v_lote, new.cantidad_base, v_costo);
    perform app.mover_saldo_lote(v_lote, new.insumo_id, new.almacen_id, new.cantidad_base);
    return null;
  end if;

  -- 3. Salida: del lote nombrado, o por FEFO. `for update` pone en fila a
  --    quien consuma lo mismo a la vez: el segundo ve lo que dejó el primero.
  v_restante := new.cantidad_base;
  for v_fila in
    select s.lote_id, s.cantidad_base, l.costo_unitario
      from public.saldos_lote s
      join public.lotes_insumo l on l.id = s.lote_id
     where s.insumo_id = new.insumo_id
       and s.almacen_id = new.almacen_id
       and s.cantidad_base > 0
       and (new.lote_id is null or s.lote_id = new.lote_id)
     order by l.fecha_vencimiento nulls last, l.llegada
     for update of s
  loop
    exit when v_restante <= 0;
    v_tomar := least(v_restante, v_fila.cantidad_base);
    insert into public.movimiento_lotes (movimiento_id, lote_id, cantidad_base, costo_unitario)
    values (new.id, v_fila.lote_id, v_tomar, v_fila.costo_unitario);
    perform app.mover_saldo_lote(v_fila.lote_id, new.insumo_id, new.almacen_id, -v_tomar);
    v_restante := v_restante - v_tomar;
  end loop;

  if v_restante > 0 then
    select i.nombre, u.codigo into v_insumo, v_unidad
      from public.insumos i join public.unidades_medida u on u.id = i.unidad_base_id
     where i.id = new.insumo_id;
    raise exception '%', format(
      'Solo hay %s %s de %s%s. Si en el almacén hay más, falta registrar un ingreso o hacer un conteo.',
      app.formatear_cantidad(new.cantidad_base - v_restante), v_unidad, v_insumo,
      case when new.lote_id is not null then ' en ese lote' else '' end)
      using errcode = 'P0001';
  end if;

  return null;
end;
$$;
comment on function app.repartir_en_lotes() is
  'Trigger AFTER INSERT en movimientos_insumo: reparte por lotes (FEFO), guarda el costo y lleva saldos_lote.';
revoke execute on function app.repartir_en_lotes() from public, anon, authenticated;

create trigger movimientos_repartir_en_lotes
  after insert on public.movimientos_insumo
  for each row execute function app.repartir_en_lotes();

-- -----------------------------------------------------------------------------
-- La unidad base queda fija en cuanto hay historia
-- -----------------------------------------------------------------------------
create or replace function app.fijar_unidad_base()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.unidad_base_id is distinct from old.unidad_base_id
     and exists (select 1 from public.movimientos_insumo m where m.insumo_id = old.id) then
    raise exception '% ya tiene movimientos: su unidad base no se puede cambiar. Si hace falta, crea un insumo nuevo.',
      old.nombre using errcode = 'P0001';
  end if;
  return new;
end;
$$;
create trigger insumos_fijar_unidad_base
  before update of unidad_base_id on public.insumos
  for each row execute function app.fijar_unidad_base();

-- -----------------------------------------------------------------------------
-- El recálculo reconstruye también los lotes
-- -----------------------------------------------------------------------------
create or replace function app.recalcular_saldos()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_filas integer;
begin
  delete from public.saldos_lote;
  insert into public.saldos_lote (lote_id, insumo_id, almacen_id, cantidad_base, actualizado_en)
  select ml.lote_id, m.insumo_id, m.almacen_id, sum(m.sentido * ml.cantidad_base), now()
    from public.movimiento_lotes ml
    join public.movimientos_insumo m on m.id = ml.movimiento_id
   group by ml.lote_id, m.insumo_id, m.almacen_id;

  delete from public.saldos_insumo;
  insert into public.saldos_insumo (insumo_id, almacen_id, cantidad_base, actualizado_en)
  select m.insumo_id, m.almacen_id, sum(m.sentido * m.cantidad_base), now()
    from public.movimientos_insumo m
   group by m.insumo_id, m.almacen_id;

  get diagnostics v_filas = row_count;
  return v_filas;
end;
$$;

-- -----------------------------------------------------------------------------
-- La alerta de vencimiento mira el saldo DEL LOTE
--
-- Igual que 0015 salvo dos cosas: un lote ya gastado no avisa aunque quede
-- existencia de otros lotes, y las cantidades se escriben sin «30.».
-- -----------------------------------------------------------------------------
create or replace function app.evaluar_alertas()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_creadas integer := 0;
  v_dias    integer;
  v_filas   integer;
  v_hoy     text := to_char(now() at time zone 'America/Lima', 'YYYY-MM-DD');
begin
  select coalesce((valor #>> '{}')::integer, 15)
    into v_dias
    from public.configuracion_sitio
   where clave = 'dias_aviso_vencimiento';
  v_dias := coalesce(v_dias, 15);

  insert into public.notificaciones (tipo, titulo, mensaje, insumo_id, clave_unica)
  select
    'stock_bajo',
    'Queda poco ' || i.nombre,
    'Quedan ' || app.formatear_cantidad(s.cantidad_base) || ' ' || u.codigo ||
      ' de ' || i.nombre || ', y el mínimo es ' ||
      app.formatear_cantidad(i.stock_minimo) || ' ' || u.codigo || '. Conviene reponer.',
    i.id,
    'stock_bajo:' || i.id || ':' || v_hoy
  from public.saldos_insumo s
  join public.insumos i          on i.id = s.insumo_id
  join public.unidades_medida u  on u.id = i.unidad_base_id
  where i.activo
    and i.deleted_at is null
    and i.stock_minimo > 0
    and s.cantidad_base < i.stock_minimo
  on conflict (clave_unica) do nothing;
  get diagnostics v_creadas = row_count;

  insert into public.notificaciones (tipo, titulo, mensaje, insumo_id, lote_id, clave_unica)
  select
    case when l.fecha_vencimiento < current_date then 'vencido' else 'por_vencer' end,
    case when l.fecha_vencimiento < current_date
         then 'Venció ' || i.nombre
         else i.nombre || ' está por vencer' end,
    case when l.fecha_vencimiento < current_date
         then 'El lote ' || coalesce(l.codigo, 'sin código') || ' de ' || i.nombre ||
              ' venció el ' || to_char(l.fecha_vencimiento, 'DD/MM/YYYY') || '. Quedan ' ||
              app.formatear_cantidad(sl.cantidad_base) || ' ' || u.codigo || '.'
         else 'El lote ' || coalesce(l.codigo, 'sin código') || ' de ' || i.nombre ||
              ' vence el ' || to_char(l.fecha_vencimiento, 'DD/MM/YYYY') || '. Quedan ' ||
              app.formatear_cantidad(sl.cantidad_base) || ' ' || u.codigo || '.' end,
    i.id,
    l.id,
    'vencimiento:' || l.id || ':' || v_hoy
  from public.lotes_insumo l
  join public.saldos_lote sl    on sl.lote_id = l.id and sl.cantidad_base > 0
  join public.insumos i         on i.id = l.insumo_id
  join public.unidades_medida u on u.id = i.unidad_base_id
  where l.fecha_vencimiento is not null
    and l.fecha_vencimiento <= current_date + v_dias
    and i.deleted_at is null
  on conflict (clave_unica) do nothing;
  get diagnostics v_filas = row_count;

  return v_creadas + v_filas;
end;
$$;

-- -----------------------------------------------------------------------------
-- Auditoría (R9). Los saldos no se auditan (valor derivado, igual que 0012).
-- -----------------------------------------------------------------------------
select app.auditar('public.movimiento_lotes');

-- =============================================================================
-- RLS
-- =============================================================================
alter table public.movimiento_lotes enable row level security;
alter table public.saldos_lote      enable row level security;
alter table public.movimiento_lotes force row level security;
alter table public.saldos_lote      force row level security;

create policy "insumos lee el reparto"
  on public.movimiento_lotes for select to authenticated
  using ((select app.es_rol('superadmin', 'administrador', 'ingeniero')));
create policy "insumos lee saldos de lote"
  on public.saldos_lote for select to authenticated
  using ((select app.es_rol('superadmin', 'administrador', 'ingeniero')));

-- Como saldos_insumo en 0012: se revoca el privilegio, no solo se omite la
-- política, para que un intento de escribir falle en voz alta.
revoke insert, update, delete on public.movimiento_lotes from anon, authenticated;
revoke insert, update, delete on public.saldos_lote      from anon, authenticated;

-- Quién registra qué (decisiones 1 y 2):
--   · ingreso y consumo: los tres roles de insumos, siempre a su propio nombre.
--   · ajuste y anulación: solo la administración.
--   · baja: solo la administración, y autorizada por quien la registra. El
--     ingeniero la PIDE (T5); nunca la registra poniendo a otro de autorizador.
drop policy "insumos registra movimientos" on public.movimientos_insumo;
create policy "insumos registra movimientos"
  on public.movimientos_insumo for insert to authenticated
  with check (
    (select app.es_rol('superadmin', 'administrador', 'ingeniero'))
    and responsable_id = (select auth.uid())
    and (tipo in ('ingreso', 'consumo') or (select app.es_rol('superadmin', 'administrador')))
    and (tipo <> 'baja' or autorizado_por = (select auth.uid()))
  );

-- Lotes: el ingeniero los crea (al registrar un ingreso con fecha); corregir
-- su fecha, código o costo es cosa de la administración; borrar, nadie.
drop policy "insumos gestiona lotes" on public.lotes_insumo;
create policy "insumos crea lotes"
  on public.lotes_insumo for insert to authenticated
  with check ((select app.es_rol('superadmin', 'administrador', 'ingeniero')));
create policy "administracion corrige lotes"
  on public.lotes_insumo for update to authenticated
  using      ((select app.es_rol('superadmin', 'administrador')))
  with check ((select app.es_rol('superadmin', 'administrador')));
revoke delete on public.lotes_insumo from anon, authenticated;
```

> **Nota sobre el orden de los triggers.** Postgres dispara los `AFTER` del mismo evento por orden
> alfabético: `movimientos_actualizar_saldo` antes que `movimientos_repartir_en_lotes`. Por eso el
> `check (>= 0)` va **solo** en `saldos_lote`, y no en `saldos_insumo`: si estuviera en los dos, un
> consumo que no alcanza chocaría primero con el check del insumo (un `23514` sin explicación) y la
> frase «Solo hay…» del reparto no llegaría nunca. Con el check solo en los lotes, el saldo del
> insumo baja un instante por debajo de cero, el reparto falla con su frase y la sentencia entera se
> deshace. El saldo del insumo es la suma de sus lotes, así que tampoco puede quedar negativo.

### Paso 5 — Aplicar y ver pasar

- [ ] Reconstruir la base y correr **todas** las pruebas:

```bash
supabase db reset
supabase test db
```

Esperado: `0034_kardex_lotes.test.sql .. ok` y el resto igual que antes. `0012` y `0015` siguen en
verde sin tocarlos: insertan como `postgres` (sin RLS) y sus cuentas no cambian con el reparto.
`0026` también, porque ninguna de las dos tablas nuevas tiene `created_by`.

- [ ] Volver a subir las imágenes (el reset vacía los buckets) y regenerar los tipos:

```bash
bash supabase/seeds/imagenes/subir-imagenes.sh
pnpm supabase:tipos
pnpm typecheck
```

Esperado: `typecheck` sin errores. `database.types.ts` gana `movimiento_lotes`, `saldos_lote`,
`sentido`, `anula_a` y los dos valores del enum.

### Paso 6 — Comprobar los guiones de verificación

- [ ] `bash scripts/verificar-fase0.sh && bash scripts/verificar-storage.sh && bash scripts/verificar-sitio-publico.sh`

Esperado: los tres en verde (ninguno toca insumos, pero corren en el CI y el reset los afecta).

### Paso 7 — Commit, PR y producción

- [ ] Commit:

```bash
git add supabase/migrations/0033_tipos_kardex.sql supabase/migrations/0034_kardex_lotes.sql \
        supabase/tests/0034_kardex_lotes.test.sql src/tipos/database.types.ts
git commit -m "feat(insumos): repartir el kárdex por lotes, con costo y sin saldos negativos"
```

- [ ] Subir la rama y abrir el PR. En la descripción, **pedir a Dan** que antes de fusionar:
  1. confirme el paso 1 (cero movimientos y cero lotes en producción);
  2. ejecute `supabase db push` (sin `--include-seed`), que aplica 0033 y 0034.

---

## Tarea 2 — Catálogo de insumos, proveedores y Existencias

**Rama:** `feat/f5-t2-catalogo`

**Qué deja hecho:** la sección **Insumos** aparece en la navegación de superadmin, administrador e
ingeniero; **Existencias** dice cuánto hay de cada insumo, en su unidad y en su presentación, con
las marcas «Bajo el mínimo» y «Por vencer»; se crean y editan insumos con sus equivalencias en una
sola transacción, y se gestionan los proveedores (solo el nombre es obligatorio, ficha 7.10).

**Archivos:**

- Crear: `supabase/migrations/0035_guardar_insumo.sql`, `supabase/tests/0035_guardar_insumo.test.sql`
- Crear: `src/lib/insumos/unidades.ts` + `.test.ts`, `src/lib/validaciones/numeros.ts` + `.test.ts`
- Crear: `src/lib/validaciones/insumo.ts` + `.test.ts`, `src/lib/validaciones/proveedor.ts` + `.test.ts`
- Crear: `src/lib/acciones/insumos.ts`, `src/lib/acciones/proveedores.ts`
- Crear: `src/components/panel/editor-equivalencias.tsx`, `src/components/panel/etiqueta-insumo.tsx`
- Crear: `src/app/(admin)/admin/insumos/page.tsx`, `formulario-insumo.tsx`, `nuevo/page.tsx`,
  `[id]/editar/page.tsx`, `proveedores/page.tsx`, `proveedores/formulario-proveedor.tsx`,
  `proveedores/nuevo/page.tsx`, `proveedores/[id]/page.tsx`
- Modificar: `src/lib/panel/navegacion.ts` + `.test.ts`, `src/components/panel/barra-lateral.tsx`
- Modificar: `e2e/panel-accesibilidad.spec.ts` (rutas nuevas)
- Crear: `e2e/panel-insumos.spec.ts`

**Interfaces:**

- Consume (T1): `saldos_insumo`, `saldos_lote`, `lotes_insumo`. De F4: `ejecutarAccion`,
  `FormularioPanel`, `Campo`, `Interruptor`, `CLASE_CONTROL`, `BarraGuardar`, `ListaAdaptable`,
  `ConfirmarBorrado`, `EncabezadoPanel`, `claveDeBorrador`, `useFormularioPanel`, `texto`,
  `textoOpcional`, `casilla`, `json`, `normalizarPrecio` (de `src/lib/validaciones/producto.ts`).
- Produce (lo usan T3–T7):
  - `public.guardar_insumo(p_insumo jsonb, p_equivalencias jsonb) returns uuid`
  - Vista `public.existencias_insumo (id, nombre, presentacion, es_perecible, activo, unidad_base,
stock_minimo, cantidad_base, bajo_minimo, proximo_vencimiento, por_vencer)`
  - `src/lib/insumos/unidades.ts`: `nombreDeUnidad(codigo, cantidad)`, `formatearCantidad(n)`,
    `presentacionPrincipal(equivalencias)`, `describirExistencia(cantidadBase, unidadBase,
presentacion)` y `type UnidadConFactor = { codigo: string; factor: number }`
  - `src/lib/validaciones/numeros.ts`: `normalizarNumero(valor)`, `cantidadPositiva(mensaje)`,
    `cantidadOCero(mensaje)`, `precio(mensaje)`, `precioOpcional(mensaje)`
  - `<EtiquetaInsumo tipo="bajo" | "vencer" />`
  - `const RUTA_INSUMOS = "/admin/insumos"` en `src/lib/acciones/insumos.ts`

### Paso 1 — Unidades para leer, lógica pura (primero la prueba)

La base convierte y suma; el navegador solo **enseña**. Este módulo decide cómo se escribe una
cantidad para una persona: «62 kg (1 saco y 12 kg)», «250 unidades (2 cajas y 50 unidades)».

- [ ] Crear `src/lib/insumos/unidades.test.ts`:

```ts
import { describe, expect, it } from "vitest";

import {
  describirExistencia,
  formatearCantidad,
  nombreDeUnidad,
  presentacionPrincipal,
} from "./unidades";

describe("nombreDeUnidad", () => {
  it("las métricas van abreviadas y no cambian en plural", () => {
    expect(nombreDeUnidad("kg", 1)).toBe("kg");
    expect(nombreDeUnidad("kg", 62)).toBe("kg");
    expect(nombreDeUnidad("ml", 500)).toBe("ml");
  });

  it("las de conteo se escriben enteras y en plural cuando toca", () => {
    expect(nombreDeUnidad("saco", 1)).toBe("saco");
    expect(nombreDeUnidad("saco", 2)).toBe("sacos");
    expect(nombreDeUnidad("unidad", 1)).toBe("unidad");
    expect(nombreDeUnidad("unidad", 250)).toBe("unidades");
    expect(nombreDeUnidad("rollo", 0)).toBe("rollos");
  });
});

describe("formatearCantidad", () => {
  it("sin ceros de sobra y con dos decimales como mucho", () => {
    expect(formatearCantidad(12.5)).toBe("12.5");
    expect(formatearCantidad(30)).toBe("30");
    expect(formatearCantidad(0.1234)).toBe("0.12");
    expect(formatearCantidad(1500)).toBe("1500");
  });
});

describe("presentacionPrincipal", () => {
  it("es la equivalencia más grande", () => {
    expect(
      presentacionPrincipal([
        { codigo: "g", factor: 0.001 },
        { codigo: "saco", factor: 50 },
      ]),
    ).toEqual({ codigo: "saco", factor: 50 });
  });

  it("sin una equivalencia mayor que 1 no hay presentación que mostrar", () => {
    expect(presentacionPrincipal([{ codigo: "g", factor: 0.001 }])).toBeNull();
    expect(presentacionPrincipal([])).toBeNull();
  });
});

describe("describirExistencia", () => {
  const saco = { codigo: "saco", factor: 50 };

  it("pone la presentación entre paréntesis cuando llega a una entera", () => {
    expect(describirExistencia(62, "kg", saco)).toBe("62 kg (1 saco y 12 kg)");
    expect(describirExistencia(100, "kg", saco)).toBe("100 kg (2 sacos)");
    expect(describirExistencia(250, "unidad", { codigo: "caja", factor: 100 })).toBe(
      "250 unidades (2 cajas y 50 unidades)",
    );
  });

  it("no la pone cuando no llega a una", () => {
    expect(describirExistencia(30, "kg", saco)).toBe("30 kg");
    expect(describirExistencia(0, "kg", saco)).toBe("0 kg");
    expect(describirExistencia(1, "unidad", null)).toBe("1 unidad");
  });

  it("un resto con decimales no se vuelve 49.99999", () => {
    expect(describirExistencia(62.3, "kg", saco)).toBe("62.3 kg (1 saco y 12.3 kg)");
  });
});
```

- [ ] `pnpm test -- src/lib/insumos/unidades.test.ts` → FALLA (`Cannot find module './unidades'`).

- [ ] Crear `src/lib/insumos/unidades.ts`:

```ts
/**
 * Cómo se lee una cantidad de insumo. Solo para ENSEÑAR: convertir y sumar lo
 * hace la base con `numeric` (0011, 0034). Aquí puede usarse `number` porque
 * nada de lo que sale vuelve a la base.
 */
export type UnidadConFactor = { codigo: string; factor: number };

/** Las métricas se escriben abreviadas: «12 kg», nunca «12 kilogramos». */
const ABREVIADAS = new Set(["kg", "g", "l", "ml"]);

export function nombreDeUnidad(codigo: string, cantidad: number): string {
  if (ABREVIADAS.has(codigo) || cantidad === 1) return codigo;
  return /[aeiou]$/.test(codigo) ? `${codigo}s` : `${codigo}es`;
}

/** Hasta dos decimales y sin ceros de sobra: «12.5», «30». Sin separador de miles. */
export function formatearCantidad(n: number): string {
  return String(Number(n.toFixed(2)));
}

/** La unidad de compra más grande del insumo: el saco de la harina, la caja del huevo. */
export function presentacionPrincipal(
  equivalencias: readonly UnidadConFactor[],
): UnidadConFactor | null {
  const mayores = equivalencias.filter((e) => e.factor > 1);
  if (mayores.length === 0) return null;
  return mayores.reduce((a, b) => (b.factor > a.factor ? b : a));
}

/** «62 kg (1 saco y 12 kg)». La presentación solo aparece si llega a una entera. */
export function describirExistencia(
  cantidadBase: number,
  unidadBase: string,
  presentacion: UnidadConFactor | null,
): string {
  const base = `${formatearCantidad(cantidadBase)} ${nombreDeUnidad(unidadBase, cantidadBase)}`;
  if (!presentacion || cantidadBase < presentacion.factor) return base;

  // El 1e-9 evita que 100 / 50 = 1.9999999 cuente un saco de menos.
  const enteras = Math.floor(cantidadBase / presentacion.factor + 1e-9);
  const resto = Number((cantidadBase - enteras * presentacion.factor).toFixed(2));
  const partes = `${enteras} ${nombreDeUnidad(presentacion.codigo, enteras)}`;
  return resto > 0
    ? `${base} (${partes} y ${formatearCantidad(resto)} ${nombreDeUnidad(unidadBase, resto)})`
    : `${base} (${partes})`;
}
```

- [ ] `pnpm test -- src/lib/insumos/unidades.test.ts` → PASA.

### Paso 2 — Números escritos por una persona

- [ ] Crear `src/lib/validaciones/numeros.test.ts`:

```ts
import { describe, expect, it } from "vitest";

import {
  cantidadOCero,
  cantidadPositiva,
  normalizarNumero,
  precio,
  precioOpcional,
} from "./numeros";

describe("normalizarNumero", () => {
  it("acepta la coma, el símbolo del sol y los espacios", () => {
    expect(normalizarNumero(" 1,5 ")).toBe("1.5");
    expect(normalizarNumero("S/ 3,50")).toBe("3.50");
  });
});

describe("cantidadPositiva", () => {
  const esquema = cantidadPositiva("Escribe la cantidad.");

  it("devuelve el texto normalizado, no un número", () => {
    expect(esquema.parse("1,5")).toBe("1.5");
    expect(esquema.parse("0.0005")).toBe("0.0005");
  });

  it("rechaza el cero, lo negativo y lo que no es número", () => {
    expect(esquema.safeParse("0").success).toBe(false);
    expect(esquema.safeParse("-2").success).toBe(false);
    expect(esquema.safeParse("dos").success).toBe(false);
    expect(esquema.safeParse("").success).toBe(false);
    expect(esquema.safeParse("1.23456").success).toBe(false);
  });
});

describe("cantidadOCero", () => {
  it("admite el cero", () => {
    expect(cantidadOCero("Escribe el mínimo.").parse("0")).toBe("0");
  });
});

describe("precio", () => {
  it("es obligatorio", () => {
    expect(precio("Escribe el precio.").safeParse("").success).toBe(false);
    expect(precio("Escribe el precio.").parse("150,5")).toBe("150.5");
  });
});

describe("precioOpcional", () => {
  const esquema = precioOpcional("Escribe el precio con números.");

  it("vacío es null", () => {
    expect(esquema.parse("")).toBeNull();
  });

  it("normaliza y deja dos decimales como mucho", () => {
    expect(esquema.parse("S/ 150")).toBe("150");
    expect(esquema.safeParse("1.234").success).toBe(false);
  });
});
```

- [ ] `pnpm test -- src/lib/validaciones/numeros.test.ts` → FALLA.

- [ ] Crear `src/lib/validaciones/numeros.ts`:

```ts
import * as z from "zod";

import { normalizarPrecio } from "./producto";

/**
 * Cantidades y precios viajan como TEXTO hasta la base, que los convierte a
 * `numeric` sin pasar por coma flotante. Aquí solo se limpian y se comprueban.
 */
export const normalizarNumero = normalizarPrecio;

const CANTIDAD = /^\d{1,8}(\.\d{1,4})?$/;
const PRECIO = /^\d{1,6}(\.\d{1,2})?$/;

export function cantidadPositiva(mensaje: string) {
  return z
    .string()
    .transform(normalizarNumero)
    .pipe(
      z
        .string()
        .regex(CANTIDAD, { error: mensaje })
        .refine((v) => Number(v) > 0, { error: "Tiene que ser mayor que cero." }),
    );
}

export function cantidadOCero(mensaje: string) {
  return z
    .string()
    .transform(normalizarNumero)
    .pipe(z.string().regex(CANTIDAD, { error: mensaje }));
}

export function precio(mensaje: string) {
  return z
    .string()
    .transform(normalizarNumero)
    .pipe(z.string().regex(PRECIO, { error: mensaje }));
}

export function precioOpcional(mensaje: string) {
  return z
    .string()
    .transform(normalizarNumero)
    .pipe(z.union([z.literal(""), z.string().regex(PRECIO, { error: mensaje })]))
    .transform((v) => (v === "" ? null : v));
}
```

- [ ] `pnpm test -- src/lib/validaciones/numeros.test.ts` → PASA.

### Paso 3 — La base: insumo y equivalencias juntos, y la vista de existencias

- [ ] Crear `supabase/tests/0035_guardar_insumo.test.sql`:

```sql
-- Verifica guardar_insumo y existencias_insumo (0035).
begin;
select plan(14);

insert into auth.users (id, email, created_at, updated_at) values
  ('33333333-3333-3333-3333-333333333333', 'inge@pimpos.test',    now(), now()),
  ('44444444-4444-4444-4444-444444444444', 'reparto@pimpos.test', now(), now());
update public.perfiles set rol = 'ingeniero',  activo = true where id = '33333333-3333-3333-3333-333333333333';
update public.perfiles set rol = 'repartidor', activo = true where id = '44444444-4444-4444-4444-444444444444';

create temp table ref as
select
  (select id from public.unidades_medida where codigo = 'kg')    as kg,
  (select id from public.unidades_medida where codigo = 'saco')  as saco,
  (select id from public.unidades_medida where codigo = 'bolsa') as bolsa,
  (select id from public.unidades_medida where codigo = 'g')     as g,
  (select id from public.insumos where nombre = 'Harina')        as harina,
  (select id from public.proveedores where nombre = 'Comercial FOX') as proveedor;
create temp table t (clave text primary key, valor uuid);
grant all on ref, t to authenticated;

select has_function('public', 'guardar_insumo', array['jsonb', 'jsonb'], 'existe guardar_insumo');
select has_view('public', 'existencias_insumo', 'existe la vista de existencias');

set local role authenticated;
set local request.jwt.claims = '{"sub": "33333333-3333-3333-3333-333333333333", "rol": "ingeniero"}';

insert into t select 'coco', public.guardar_insumo(
  jsonb_build_object('nombre', 'Coco rallado 0035', 'unidad_base_id', (select kg from ref),
                     'presentacion', 'Bolsa de 5 kg', 'stock_minimo', '10', 'es_perecible', true,
                     'proveedor_habitual_id', (select proveedor from ref)),
  jsonb_build_array(
    jsonb_build_object('unidad_desde_id', (select bolsa from ref), 'factor', '5'),
    jsonb_build_object('unidad_desde_id', (select g from ref),     'factor', '0.001'))
);

select is(
  (select count(*)::int from public.equivalencias where insumo_id = (select valor from t where clave = 'coco')),
  2, 'crea el insumo con sus dos equivalencias'
);
select is(
  (select stock_minimo from public.insumos where id = (select valor from t where clave = 'coco')),
  10.0::numeric(14,4), 'el mínimo llega exacto'
);

select lives_ok($$
  select public.guardar_insumo(
    jsonb_build_object('id', (select valor from t where clave = 'coco'), 'nombre', 'Coco rallado 0035',
                       'unidad_base_id', (select kg from ref), 'presentacion', 'Bolsa de 6 kg',
                       'stock_minimo', '12', 'es_perecible', true),
    jsonb_build_array(jsonb_build_object('unidad_desde_id', (select bolsa from ref), 'factor', '6')))
$$, 'se edita');
select is(
  (select factor from public.equivalencias
    where insumo_id = (select valor from t where clave = 'coco') and unidad_desde = (select bolsa from ref)),
  6.0::numeric(14,6), 'el factor cambia'
);
select is(
  (select count(*)::int from public.equivalencias where insumo_id = (select valor from t where clave = 'coco')),
  1, 'y la equivalencia que no vino se quita'
);
select is(
  (select proveedor_habitual_id from public.insumos where id = (select valor from t where clave = 'coco')),
  null::uuid, 'un campo que no viene queda vacío, no con el valor anterior'
);
select throws_ok($$
  select public.guardar_insumo(
    jsonb_build_object('nombre', 'Otro 0035', 'unidad_base_id', (select kg from ref), 'stock_minimo', '0'),
    jsonb_build_array(jsonb_build_object('unidad_desde_id', (select kg from ref), 'factor', '1')))
$$, '23514', null, 'la unidad base no lleva equivalencia consigo misma');

-- La vista
select is(
  (select cantidad_base from public.existencias_insumo where id = (select valor from t where clave = 'coco')),
  0::numeric, 'un insumo sin movimientos tiene 0'
);
select is(
  (select bajo_minimo from public.existencias_insumo where id = (select valor from t where clave = 'coco')),
  true, 'y está bajo el mínimo'
);
reset role;

insert into public.lotes_insumo (id, insumo_id, codigo, fecha_vencimiento)
values ('aaaa3535-0000-0000-0000-000000000001', (select valor from t where clave = 'coco'), 'L1',
        (now() at time zone 'America/Lima')::date + 5);
insert into public.movimientos_insumo (tipo, insumo_id, lote_id, cantidad, unidad_id, responsable_id, proveedor_id, documento_tipo)
select 'ingreso', (select valor from t where clave = 'coco'), 'aaaa3535-0000-0000-0000-000000000001', 3,
       bolsa, '33333333-3333-3333-3333-333333333333', proveedor, 'boleta' from ref;

select is(
  (select por_vencer from public.existencias_insumo where id = (select valor from t where clave = 'coco')),
  true, 'un lote con existencia que vence en 5 días lo marca por vencer'
);

set local role authenticated;
set local request.jwt.claims = '{"sub": "44444444-4444-4444-4444-444444444444", "rol": "repartidor"}';
select is((select count(*)::int from public.existencias_insumo), 0, 'el repartidor no ve existencias');
select throws_ok($$
  select public.guardar_insumo(
    jsonb_build_object('nombre', 'Intruso 0035', 'unidad_base_id', (select kg from ref), 'stock_minimo', '0'),
    '[]'::jsonb)
$$, '42501', null, 'ni guarda insumos');
reset role;

select * from finish();
rollback;
```

- [ ] `supabase test db` → FALLA `0035_guardar_insumo.test.sql`.

- [ ] Crear `supabase/migrations/0035_guardar_insumo.sql`:

```sql
-- =============================================================================
-- 0035_guardar_insumo.sql
-- Un insumo y sus equivalencias se guardan juntos, y la vista que alimenta
-- Existencias (F5, tarea 2).
--
-- Igual que guardar_producto (0027): supabase-js no abre transacciones y un
-- corte de señal a mitad dejaría un insumo sin su «1 saco = 50 kg», que es
-- justo lo que hace falta para registrar su primera compra.
--
-- Contrato:
--   p_insumo: { id?, nombre, descripcion?, unidad_base_id, presentacion?,
--               stock_minimo (texto), es_perecible?, proveedor_habitual_id? }
--   p_equivalencias: [{ unidad_desde_id, factor (texto) }], todas HACIA la
--     unidad base. Las del insumo que no vengan se quitan: no hay historial
--     que perder, porque cada movimiento guarda su propia cantidad base.
-- =============================================================================
create or replace function public.guardar_insumo(p_insumo jsonb, p_equivalencias jsonb)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_id     uuid := nullif(p_insumo ->> 'id', '')::uuid;
  v_base   uuid := (p_insumo ->> 'unidad_base_id')::uuid;
  v_item   jsonb;
  v_desde  uuid;
  v_quedan uuid[] := '{}';
begin
  if jsonb_typeof(p_equivalencias) is distinct from 'array' then
    raise exception 'Las equivalencias llegaron con una forma inesperada. Recarga la página.';
  end if;

  if v_id is null then
    insert into public.insumos
      (nombre, descripcion, unidad_base_id, presentacion, stock_minimo, es_perecible, proveedor_habitual_id)
    values (
      btrim(p_insumo ->> 'nombre'),
      nullif(btrim(p_insumo ->> 'descripcion'), ''),
      v_base,
      nullif(btrim(p_insumo ->> 'presentacion'), ''),
      (p_insumo ->> 'stock_minimo')::numeric(14,4),
      coalesce((p_insumo ->> 'es_perecible')::boolean, false),
      nullif(p_insumo ->> 'proveedor_habitual_id', '')::uuid
    )
    returning id into v_id;
  else
    update public.insumos
       set nombre                = btrim(p_insumo ->> 'nombre'),
           descripcion           = nullif(btrim(p_insumo ->> 'descripcion'), ''),
           unidad_base_id        = v_base,
           presentacion          = nullif(btrim(p_insumo ->> 'presentacion'), ''),
           stock_minimo          = (p_insumo ->> 'stock_minimo')::numeric(14,4),
           es_perecible          = coalesce((p_insumo ->> 'es_perecible')::boolean, false),
           proveedor_habitual_id = nullif(p_insumo ->> 'proveedor_habitual_id', '')::uuid
     where id = v_id
       and deleted_at is null;
    if not found then
      raise exception 'No se encontró el insumo. Puede que otra persona lo haya retirado.';
    end if;
  end if;

  for v_item in select value from jsonb_array_elements(p_equivalencias)
  loop
    v_desde := (v_item ->> 'unidad_desde_id')::uuid;
    insert into public.equivalencias (insumo_id, unidad_desde, unidad_hacia, factor)
    values (v_id, v_desde, v_base, (v_item ->> 'factor')::numeric(14,6))
    on conflict (insumo_id, unidad_desde, unidad_hacia) do update set factor = excluded.factor;
    v_quedan := v_quedan || v_desde;
  end loop;

  -- Las que no vinieron, y las que apuntaban a una unidad base anterior.
  delete from public.equivalencias
   where insumo_id = v_id
     and (unidad_hacia <> v_base or not (unidad_desde = any (v_quedan)));

  return v_id;
end;
$$;

comment on function public.guardar_insumo(jsonb, jsonb) is
  'Guarda un insumo y sus equivalencias en una sola transacción. Security invoker: decide la RLS.';
revoke execute on function public.guardar_insumo(jsonb, jsonb) from public, anon;
grant execute on function public.guardar_insumo(jsonb, jsonb) to authenticated;

-- -----------------------------------------------------------------------------
-- Existencias: lo que el propietario pidió ver primero (ficha 7.1)
--
-- `security_invoker`: sin él la vista saltaría la RLS de insumos (ver 0016).
-- Los días de aviso salen de la configuración, como en app.evaluar_alertas().
-- -----------------------------------------------------------------------------
create view public.existencias_insumo
with (security_invoker = true) as
select
  i.id,
  i.nombre,
  i.presentacion,
  i.es_perecible,
  i.activo,
  u.codigo as unidad_base,
  i.stock_minimo,
  coalesce(s.cantidad_base, 0)::numeric as cantidad_base,
  (i.stock_minimo > 0 and coalesce(s.cantidad_base, 0) < i.stock_minimo) as bajo_minimo,
  v.proximo_vencimiento,
  (v.proximo_vencimiento is not null
   and v.proximo_vencimiento <= (now() at time zone 'America/Lima')::date + coalesce(c.dias, 15)) as por_vencer
from public.insumos i
join public.unidades_medida u on u.id = i.unidad_base_id
left join (
  select insumo_id, sum(cantidad_base) as cantidad_base
    from public.saldos_insumo
   group by insumo_id
) s on s.insumo_id = i.id
left join lateral (
  select min(l.fecha_vencimiento) as proximo_vencimiento
    from public.lotes_insumo l
    join public.saldos_lote sl on sl.lote_id = l.id and sl.cantidad_base > 0
   where l.insumo_id = i.id
) v on true
left join lateral (
  select (valor #>> '{}')::integer as dias
    from public.configuracion_sitio
   where clave = 'dias_aviso_vencimiento'
) c on true
where i.deleted_at is null;

comment on view public.existencias_insumo is
  'Cuánto hay de cada insumo, si está bajo el mínimo y si algo vence pronto. Para el panel (F5).';
revoke all on public.existencias_insumo from anon;
grant select on public.existencias_insumo to authenticated;
```

- [ ] `supabase db reset && supabase test db` → todo en verde (también `0016`, que exige
      `security_invoker` a **toda** vista de `public`). Después, `bash supabase/seeds/imagenes/subir-imagenes.sh`
      y `pnpm supabase:tipos`.

### Paso 4 — Esquemas de insumo y proveedor

- [ ] Crear `src/lib/validaciones/insumo.test.ts`:

```ts
import { describe, expect, it } from "vitest";

import { esquemaInsumo } from "./insumo";

const KG = "7a1f3a52-6b1e-4f7e-9d3a-0a1b2c3d4e5f";
const SACO = "8b2f3a52-6b1e-4f7e-9d3a-0a1b2c3d4e5f";
const G = "9c3f3a52-6b1e-4f7e-9d3a-0a1b2c3d4e5f";

const base = {
  id: null,
  nombre: "Harina",
  descripcion: null,
  unidad_base_id: KG,
  presentacion: "Saco de 50 kg",
  stock_minimo: "1500",
  es_perecible: false,
  proveedor_habitual_id: null,
  equivalencias: [{ unidad_desde_id: SACO, factor: "50" }],
};

describe("esquemaInsumo", () => {
  it("acepta un insumo completo", () => {
    expect(esquemaInsumo.safeParse(base).success).toBe(true);
  });

  it("normaliza el mínimo y el factor escritos con coma", () => {
    const r = esquemaInsumo.parse({
      ...base,
      stock_minimo: "25,5",
      equivalencias: [{ unidad_desde_id: G, factor: "0,001" }],
    });
    expect(r.stock_minimo).toBe("25.5");
    expect(r.equivalencias[0]?.factor).toBe("0.001");
  });

  it("no deja repetir una unidad", () => {
    const r = esquemaInsumo.safeParse({
      ...base,
      equivalencias: [
        { unidad_desde_id: SACO, factor: "50" },
        { unidad_desde_id: SACO, factor: "25" },
      ],
    });
    expect(r.success).toBe(false);
  });

  it("no deja una equivalencia de la unidad base consigo misma", () => {
    const r = esquemaInsumo.safeParse({
      ...base,
      equivalencias: [{ unidad_desde_id: KG, factor: "1" }],
    });
    expect(r.success).toBe(false);
  });

  it("pide un nombre y una unidad base", () => {
    expect(esquemaInsumo.safeParse({ ...base, nombre: "" }).success).toBe(false);
    expect(esquemaInsumo.safeParse({ ...base, unidad_base_id: "" }).success).toBe(false);
  });
});
```

- [ ] Crear `src/lib/validaciones/proveedor.test.ts`:

```ts
import { describe, expect, it } from "vitest";

import { esquemaProveedor } from "./proveedor";

describe("esquemaProveedor", () => {
  it("solo el nombre es obligatorio (ficha 7.10)", () => {
    const r = esquemaProveedor.safeParse({
      id: null,
      nombre: "Comercial FOX",
      contacto: null,
      telefono: null,
      observacion: null,
    });
    expect(r.success).toBe(true);
  });

  it("sin nombre, no", () => {
    const r = esquemaProveedor.safeParse({
      id: null,
      nombre: "",
      contacto: null,
      telefono: null,
      observacion: null,
    });
    expect(r.success).toBe(false);
  });
});
```

- [ ] `pnpm test -- src/lib/validaciones/insumo.test.ts src/lib/validaciones/proveedor.test.ts` → FALLAN.

- [ ] Crear `src/lib/validaciones/insumo.ts`:

```ts
import * as z from "zod";

import { casilla, json, texto, textoOpcional } from "@/lib/panel/formulario";

import { cantidadOCero, cantidadPositiva } from "./numeros";

export const esquemaEquivalencia = z.object({
  unidad_desde_id: z.uuid({ error: "Elige la unidad." }),
  factor: cantidadPositiva("Escribe cuánto trae, por ejemplo 50."),
});

export const esquemaInsumo = z
  .object({
    id: z.uuid().nullable(),
    nombre: z
      .string()
      .trim()
      .min(1, { error: "Escribe el nombre del insumo." })
      .max(80, { error: "Máximo 80 letras." }),
    descripcion: z.string().max(300, { error: "Máximo 300 letras." }).nullable(),
    unidad_base_id: z.uuid({ error: "Elige en qué unidad se cuenta." }),
    presentacion: z.string().max(80, { error: "Máximo 80 letras." }).nullable(),
    stock_minimo: cantidadOCero("Escribe el mínimo con números, por ejemplo 25."),
    es_perecible: z.boolean(),
    proveedor_habitual_id: z.uuid().nullable(),
    equivalencias: z.array(esquemaEquivalencia).max(10, { error: "Como mucho 10 equivalencias." }),
  })
  .refine(
    (d) => new Set(d.equivalencias.map((e) => e.unidad_desde_id)).size === d.equivalencias.length,
    { error: "Cada unidad va una sola vez.", path: ["equivalencias"] },
  )
  .refine((d) => d.equivalencias.every((e) => e.unidad_desde_id !== d.unidad_base_id), {
    error: "La unidad en la que se cuenta no necesita equivalencia.",
    path: ["equivalencias"],
  });

export type DatosInsumo = z.infer<typeof esquemaInsumo>;

export function leerInsumo(fd: FormData) {
  return {
    id: textoOpcional(fd, "id"),
    nombre: texto(fd, "nombre"),
    descripcion: textoOpcional(fd, "descripcion"),
    unidad_base_id: texto(fd, "unidad_base_id"),
    presentacion: textoOpcional(fd, "presentacion"),
    stock_minimo: texto(fd, "stock_minimo"),
    es_perecible: casilla(fd, "es_perecible"),
    proveedor_habitual_id: textoOpcional(fd, "proveedor_habitual_id"),
    equivalencias: json(fd, "equivalencias") ?? [],
  };
}

export function validarInsumo(fd: FormData) {
  const r = esquemaInsumo.safeParse(leerInsumo(fd));
  return r.success
    ? {}
    : (z.flattenError(r.error).fieldErrors as Record<string, string[] | undefined>);
}
```

- [ ] Crear `src/lib/validaciones/proveedor.ts`:

```ts
import * as z from "zod";

import { texto, textoOpcional } from "@/lib/panel/formulario";

export const esquemaProveedor = z.object({
  id: z.uuid().nullable(),
  nombre: z
    .string()
    .trim()
    .min(1, { error: "Escribe el nombre del proveedor." })
    .max(80, { error: "Máximo 80 letras." }),
  contacto: z.string().max(80, { error: "Máximo 80 letras." }).nullable(),
  telefono: z.string().max(20, { error: "Máximo 20 caracteres." }).nullable(),
  observacion: z.string().max(300, { error: "Máximo 300 letras." }).nullable(),
});

export function leerProveedor(fd: FormData) {
  return {
    id: textoOpcional(fd, "id"),
    nombre: texto(fd, "nombre"),
    contacto: textoOpcional(fd, "contacto"),
    telefono: textoOpcional(fd, "telefono"),
    observacion: textoOpcional(fd, "observacion"),
  };
}

export function validarProveedor(fd: FormData) {
  const r = esquemaProveedor.safeParse(leerProveedor(fd));
  return r.success
    ? {}
    : (z.flattenError(r.error).fieldErrors as Record<string, string[] | undefined>);
}
```

- [ ] `pnpm test -- src/lib/validaciones/` → PASAN.

### Paso 5 — Acciones

- [ ] Crear `src/lib/acciones/insumos.ts`:

```ts
"use server";

import * as z from "zod";

import { ejecutarAccion, type EstadoAccion } from "@/lib/panel/accion";
import { esquemaInsumo, leerInsumo } from "@/lib/validaciones/insumo";

export const RUTA_INSUMOS = "/admin/insumos";

export async function guardarInsumo(fd: FormData): Promise<EstadoAccion> {
  return ejecutarAccion({
    ruta: RUTA_INSUMOS,
    esquema: esquemaInsumo,
    entrada: leerInsumo(fd),
    entidad: "un insumo",
    // Insumos no se ve en el sitio público: no hay nada que refrescar.
    etiquetas: [],
    mensajeOk: "Insumo guardado.",
    hacer: async (d, { supabase }) => {
      const { data, error } = await supabase.rpc("guardar_insumo", {
        p_insumo: {
          id: d.id,
          nombre: d.nombre,
          descripcion: d.descripcion,
          unidad_base_id: d.unidad_base_id,
          presentacion: d.presentacion,
          stock_minimo: d.stock_minimo,
          es_perecible: d.es_perecible,
          proveedor_habitual_id: d.proveedor_habitual_id,
        },
        p_equivalencias: d.equivalencias,
      });
      return { error, id: data ?? undefined };
    },
  });
}

/** Retirar, no borrar: sus movimientos siguen contando la historia. */
export async function retirarInsumo(id: string): Promise<EstadoAccion> {
  return ejecutarAccion({
    ruta: RUTA_INSUMOS,
    esquema: z.object({ id: z.uuid() }),
    entrada: { id },
    entidad: "el insumo",
    etiquetas: [],
    mensajeOk: "Insumo retirado. Ya no aparece en Existencias.",
    hacer: async ({ id }, { supabase }) => {
      const { data: existencia, error: errorLectura } = await supabase
        .from("existencias_insumo")
        .select("cantidad_base, unidad_base")
        .eq("id", id)
        .single();
      if (errorLectura) return { error: errorLectura };
      if (Number(existencia.cantidad_base) > 0) {
        return {
          error: {
            code: "P0001",
            message: `Todavía quedan ${existencia.cantidad_base} ${existencia.unidad_base}. Pide su baja o haz un conteo antes de retirarlo.`,
          },
        };
      }
      const { error } = await supabase
        .from("insumos")
        .update({ deleted_at: new Date().toISOString(), activo: false })
        .eq("id", id)
        .select("id")
        .single();
      return { error };
    },
  });
}
```

- [ ] Crear `src/lib/acciones/proveedores.ts`:

```ts
"use server";

import * as z from "zod";

import { ejecutarAccion, type EstadoAccion } from "@/lib/panel/accion";
import { esquemaProveedor, leerProveedor } from "@/lib/validaciones/proveedor";

const RUTA = "/admin/insumos/proveedores";

export async function guardarProveedor(fd: FormData): Promise<EstadoAccion> {
  return ejecutarAccion({
    ruta: RUTA,
    esquema: esquemaProveedor,
    entrada: leerProveedor(fd),
    entidad: "un proveedor",
    etiquetas: [],
    mensajeOk: "Proveedor guardado.",
    hacer: async (d, { supabase }) => {
      const fila = {
        nombre: d.nombre,
        contacto: d.contacto,
        telefono: d.telefono,
        observacion: d.observacion,
      };
      if (d.id) {
        const { error } = await supabase
          .from("proveedores")
          .update(fila)
          .eq("id", d.id)
          .is("deleted_at", null)
          .select("id")
          .single();
        return { error, id: d.id };
      }
      const { data, error } = await supabase.from("proveedores").insert(fila).select("id").single();
      return { error, id: data?.id };
    },
  });
}

export async function retirarProveedor(id: string): Promise<EstadoAccion> {
  return ejecutarAccion({
    ruta: RUTA,
    esquema: z.object({ id: z.uuid() }),
    entrada: { id },
    entidad: "el proveedor",
    etiquetas: [],
    mensajeOk: "Proveedor retirado. Sus compras anteriores siguen en los reportes.",
    hacer: async ({ id }, { supabase }) => {
      const { error } = await supabase
        .from("proveedores")
        .update({ deleted_at: new Date().toISOString(), activo: false })
        .eq("id", id)
        .select("id")
        .single();
      return { error };
    },
  });
}
```

### Paso 6 — La sección en la navegación

- [ ] En `src/lib/panel/navegacion.test.ts`, sustituir las dos primeras pruebas por:

```ts
it("el administrador ve insumos entre contenido y usuarios", () => {
  expect(nombres("administrador")).toEqual([
    "Inicio",
    "Contenido",
    "Insumos",
    "Usuarios",
    "Configuración",
  ]);
});

it("el ingeniero ve inicio, contenido e insumos, no usuarios ni configuración", () => {
  expect(nombres("ingeniero")).toEqual(["Inicio", "Contenido", "Insumos"]);
});
```

- [ ] `pnpm test -- src/lib/panel/navegacion.test.ts` → FALLA.

- [ ] En `src/lib/panel/navegacion.ts`: ampliar el tipo y añadir la sección después de Contenido.

```ts
export type NombreIcono = "inicio" | "contenido" | "insumos" | "usuarios" | "configuracion";
```

```ts
  { ruta: "/admin/contenido", nombre: "Contenido", icono: "contenido", enBarraInferior: true },
  { ruta: "/admin/insumos", nombre: "Insumos", icono: "insumos", enBarraInferior: true },
```

(`roles.ts` ya da `/admin/insumos` a superadmin, administrador e ingeniero desde F1; el
administrador queda con cuatro botones abajo: Inicio, Contenido, Insumos y Usuarios, dentro del
límite que comprueba la prueba.)

- [ ] En `src/components/panel/barra-lateral.tsx`, importar `Package` de `lucide-react` y añadir
      `insumos: Package,` a `ICONOS`.

- [ ] `pnpm test -- src/lib/panel/navegacion.test.ts` → PASA. `pnpm typecheck` → sin errores.

### Paso 7 — Piezas de pantalla

- [ ] Crear `src/components/panel/etiqueta-insumo.tsx`:

```tsx
const TEXTO = { bajo: "Bajo el mínimo", vencer: "Por vencer" } as const;
const CLASE = {
  bajo: "bg-alerta/15 text-foreground",
  vencer: "bg-aviso text-aviso-foreground",
} as const;

export function EtiquetaInsumo({ tipo }: { tipo: keyof typeof TEXTO }) {
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${CLASE[tipo]}`}>
      {TEXTO[tipo]}
    </span>
  );
}
```

- [ ] Crear `src/components/panel/editor-equivalencias.tsx`:

```tsx
"use client";

import { Plus, Trash } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { CLASE_CONTROL } from "./campo";
import { useFormularioPanel } from "./formulario-panel";

export type UnidadOpcion = { id: string; codigo: string; nombre: string };
export type Equivalencia = { unidad_desde_id: string; factor: string };
type Fila = Equivalencia & { clave: string };

const nueva = (): Fila => ({ clave: crypto.randomUUID(), unidad_desde_id: "", factor: "" });

/**
 * «1 saco = 50 kg», una fila por unidad de compra. Viaja en un campo oculto
 * con JSON, como las presentaciones de un producto (F4).
 */
export function EditorEquivalencias({
  iniciales,
  unidades,
  unidadBase,
}: {
  iniciales: Equivalencia[];
  unidades: UnidadOpcion[];
  /** El código de la unidad en la que se cuenta el insumo: «kg». */
  unidadBase: string;
}) {
  const { errores, registrarRestaurable } = useFormularioPanel();
  const oculto = useRef<HTMLInputElement>(null);
  const [filas, setFilas] = useState<Fila[]>(() =>
    iniciales.map((e) => ({ ...e, clave: crypto.randomUUID() })),
  );

  useEffect(
    () =>
      registrarRestaurable("equivalencias", (valor) => {
        try {
          const lista = JSON.parse(valor) as Equivalencia[];
          setFilas(lista.map((e) => ({ ...e, clave: crypto.randomUUID() })));
        } catch {
          // Una copia rota no pisa lo que hay.
        }
      }),
    [registrarRestaurable],
  );

  function cambiar(nuevas: Fila[]) {
    setFilas(nuevas);
    setTimeout(() => oculto.current?.dispatchEvent(new Event("input", { bubbles: true })), 0);
  }

  const valor = JSON.stringify(
    filas.map((f) => ({ unidad_desde_id: f.unidad_desde_id, factor: f.factor })),
  );
  const error = errores.equivalencias?.[0];

  return (
    <fieldset className="flex flex-col gap-3">
      <legend className="mb-1 font-semibold">Unidades de compra</legend>
      <p className="text-muted-foreground text-sm">
        Cuánto trae cada unidad en la que se compra. Por ejemplo: 1 saco = 50 {unidadBase}.
      </p>
      <input ref={oculto} type="hidden" name="equivalencias" value={valor} />
      {filas.map((f, i) => (
        <div key={f.clave} className="flex flex-wrap items-end gap-2">
          <label className="flex flex-col gap-1 text-sm">
            <span>Unidad {i + 1}</span>
            <select
              className={CLASE_CONTROL}
              value={f.unidad_desde_id}
              onChange={(e) =>
                cambiar(
                  filas.map((x) =>
                    x.clave === f.clave ? { ...x, unidad_desde_id: e.target.value } : x,
                  ),
                )
              }
            >
              <option value="">Elige…</option>
              {unidades.map((u) => (
                <option key={u.id} value={u.id}>
                  1 {u.nombre.toLowerCase()}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span>= cuántos {unidadBase}</span>
            <input
              className={CLASE_CONTROL}
              inputMode="decimal"
              value={f.factor}
              onChange={(e) =>
                cambiar(
                  filas.map((x) => (x.clave === f.clave ? { ...x, factor: e.target.value } : x)),
                )
              }
            />
          </label>
          <button
            type="button"
            className="boton-linea size-12 p-0"
            aria-label={`Quitar la unidad ${i + 1}`}
            onClick={() => cambiar(filas.filter((x) => x.clave !== f.clave))}
          >
            <Trash aria-hidden className="size-5" />
          </button>
        </div>
      ))}
      {error ? (
        <p role="alert" className="text-destructive text-sm">
          {error}
        </p>
      ) : null}
      <button
        type="button"
        className="boton-linea self-start"
        onClick={() => cambiar([...filas, nueva()])}
      >
        <Plus aria-hidden className="size-5" /> Añadir unidad de compra
      </button>
    </fieldset>
  );
}
```

### Paso 8 — Existencias

- [ ] Crear `src/app/(admin)/admin/insumos/page.tsx`:

```tsx
import { Plus } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";

import { EncabezadoPanel } from "@/components/panel/encabezado-panel";
import { EtiquetaInsumo } from "@/components/panel/etiqueta-insumo";
import { ListaAdaptable } from "@/components/panel/lista-adaptable";
import { exigirAcceso } from "@/lib/auth/sesion";
import { describirExistencia, presentacionPrincipal } from "@/lib/insumos/unidades";
import { crearClienteServidor } from "@/lib/supabase/servidor";

const RUTA = "/admin/insumos";

/**
 * Lo que se puede registrar desde aquí. Cada tarea añade su entrada: T3
 * ingreso y consumo, T4 conteo (solo administración), T5 pedir baja.
 */
const REGISTRAR: ReadonlyArray<{ ruta: string; nombre: string; soloAdministracion?: boolean }> = [];

export default function Existencias({ searchParams }: PageProps<"/admin/insumos">) {
  return (
    <>
      <EncabezadoPanel
        titulo="Insumos"
        descripcion="Cuánto hay de cada insumo en el almacén."
        accion={
          <Link href={`${RUTA}/nuevo`} className="boton-linea">
            <Plus aria-hidden className="size-5" /> Nuevo insumo
          </Link>
        }
      />
      <Suspense fallback={<p className="text-muted-foreground text-sm">Cargando…</p>}>
        <Lista searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function Lista({
  searchParams,
}: {
  searchParams: PageProps<"/admin/insumos">["searchParams"];
}) {
  const { buscar, ver } = await searchParams;
  const sesion = await exigirAcceso(RUTA);
  const esAdministracion = sesion.rol === "superadmin" || sesion.rol === "administrador";
  const supabase = await crearClienteServidor();

  let consulta = supabase
    .from("existencias_insumo")
    .select("id, nombre, unidad_base, cantidad_base, bajo_minimo, por_vencer, proximo_vencimiento")
    .eq("activo", true)
    .order("nombre");
  if (typeof buscar === "string" && buscar.trim() !== "") {
    consulta = consulta.ilike("nombre", `%${buscar.trim()}%`);
  }
  if (ver === "bajo") consulta = consulta.eq("bajo_minimo", true);
  if (ver === "vencer") consulta = consulta.eq("por_vencer", true);

  const [{ data, error }, { data: equivalencias }] = await Promise.all([
    consulta,
    supabase
      .from("equivalencias")
      .select("insumo_id, factor, unidades_medida!unidad_desde(codigo)"),
  ]);

  if (error) {
    return <p role="alert">No se pudieron cargar las existencias. Recarga la página.</p>;
  }

  const presentacion = (insumoId: string) =>
    presentacionPrincipal(
      (equivalencias ?? [])
        .filter((e) => e.insumo_id === insumoId && e.unidades_medida)
        .map((e) => ({ codigo: e.unidades_medida!.codigo, factor: Number(e.factor) })),
    );

  const acciones = REGISTRAR.filter((a) => !a.soloAdministracion || esAdministracion);

  return (
    <>
      {acciones.length > 0 ? (
        <nav aria-label="Registrar" className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {acciones.map((a) => (
            <Link key={a.ruta} href={a.ruta} className="boton-cta justify-center">
              {a.nombre}
            </Link>
          ))}
        </nav>
      ) : null}

      <form role="search" className="mb-4 flex flex-wrap gap-2">
        <label className="sr-only" htmlFor="buscar">
          Buscar insumo
        </label>
        <input
          id="buscar"
          name="buscar"
          defaultValue={typeof buscar === "string" ? buscar : ""}
          placeholder="Buscar insumo"
          className="border-input bg-card min-h-11 flex-1 rounded-xl border px-3"
        />
        <label className="sr-only" htmlFor="ver">
          Mostrar
        </label>
        <select
          id="ver"
          name="ver"
          defaultValue={typeof ver === "string" ? ver : ""}
          className="border-input bg-card min-h-11 rounded-xl border px-3"
        >
          <option value="">Todos</option>
          <option value="bajo">Bajo el mínimo</option>
          <option value="vencer">Por vencer</option>
        </select>
        <button type="submit" className="boton-linea">
          Buscar
        </button>
      </form>

      <ListaAdaptable
        etiqueta="Existencias de insumos"
        filas={data}
        enlace={(i) => `${RUTA}/${i.id}/editar`}
        columnas={[
          { titulo: "Insumo", celda: (i) => i.nombre, principal: true },
          {
            titulo: "Hay",
            celda: (i) =>
              describirExistencia(Number(i.cantidad_base), i.unidad_base, presentacion(i.id)),
          },
          {
            titulo: "Avisos",
            celda: (i) => (
              <span className="flex flex-wrap gap-1">
                {i.bajo_minimo ? <EtiquetaInsumo tipo="bajo" /> : null}
                {i.por_vencer ? <EtiquetaInsumo tipo="vencer" /> : null}
              </span>
            ),
          },
        ]}
        vacio={<p>No hay insumos que coincidan. Prueba con otra palabra o crea uno nuevo.</p>}
      />
      <p className="mt-4 text-sm">
        <Link href={`${RUTA}/proveedores`} className="underline">
          Proveedores
        </Link>
      </p>
    </>
  );
}
```

> Si `supabase-js` no tipa la relación `unidades_medida!unidad_desde(codigo)` (hay **dos** claves
> hacia `unidades_medida`, así que el nombre de la columna es obligatorio), revisar el nombre exacto
> de la relación en `src/tipos/database.types.ts` (`Relationships` de `equivalencias`) y usarlo.
> La cadena del `select` va entera y en una línea (trampa de `CLAUDE.md`).

### Paso 9 — Formulario de insumo

- [ ] Crear `src/app/(admin)/admin/insumos/formulario-insumo.tsx`:

```tsx
"use client";

import { useState } from "react";

import { BarraGuardar } from "@/components/panel/barra-guardar";
import { Campo, Interruptor } from "@/components/panel/campo";
import {
  EditorEquivalencias,
  type Equivalencia,
  type UnidadOpcion,
} from "@/components/panel/editor-equivalencias";
import { FormularioPanel } from "@/components/panel/formulario-panel";
import { guardarInsumo } from "@/lib/acciones/insumos";
import { claveDeBorrador } from "@/lib/panel/borrador";
import { validarInsumo } from "@/lib/validaciones/insumo";

export type InsumoEditable = {
  id: string;
  nombre: string;
  descripcion: string | null;
  unidad_base_id: string;
  presentacion: string | null;
  stock_minimo: number;
  es_perecible: boolean;
  proveedor_habitual_id: string | null;
  equivalencias: Equivalencia[];
  /** Con movimientos, la unidad base queda fija (0034). */
  tieneMovimientos: boolean;
};

const VOLVER = "/admin/insumos";

export function FormularioInsumo({
  insumo,
  unidadesBase,
  unidadesCompra,
  proveedores,
}: {
  insumo: InsumoEditable | null;
  unidadesBase: UnidadOpcion[];
  unidadesCompra: UnidadOpcion[];
  proveedores: { id: string; nombre: string }[];
}) {
  const [base, setBase] = useState(insumo?.unidad_base_id ?? "");
  const codigoBase = unidadesBase.find((u) => u.id === base)?.codigo ?? "unidades base";

  return (
    <FormularioPanel
      clave={claveDeBorrador("insumo", insumo?.id ?? null)}
      accion={guardarInsumo}
      validar={validarInsumo}
      destino={() => VOLVER}
    >
      <input type="hidden" name="id" value={insumo?.id ?? ""} />
      <Campo nombre="nombre" etiqueta="Nombre">
        {(p) => <input {...p} defaultValue={insumo?.nombre ?? ""} autoComplete="off" />}
      </Campo>
      <Campo
        nombre="unidad_base_id"
        etiqueta="Se cuenta en"
        ayuda={
          insumo?.tieneMovimientos
            ? "Ya tiene movimientos: esta unidad no se puede cambiar."
            : "La unidad en la que se lleva el saldo: kg, litros, unidades…"
        }
      >
        {(p) => (
          <select
            {...p}
            value={base}
            disabled={insumo?.tieneMovimientos}
            onChange={(e) => setBase(e.target.value)}
          >
            <option value="">Elige…</option>
            {unidadesBase.map((u) => (
              <option key={u.id} value={u.id}>
                {u.nombre}
              </option>
            ))}
          </select>
        )}
      </Campo>
      {insumo?.tieneMovimientos ? <input type="hidden" name="unidad_base_id" value={base} /> : null}
      <Campo
        nombre="presentacion"
        etiqueta="Presentación"
        opcional
        ayuda="Por ejemplo: Saco de 50 kg"
      >
        {(p) => <input {...p} defaultValue={insumo?.presentacion ?? ""} />}
      </Campo>
      <Campo nombre="stock_minimo" etiqueta={`Stock mínimo (en ${codigoBase})`}>
        {(p) => (
          <input {...p} inputMode="decimal" defaultValue={String(insumo?.stock_minimo ?? "0")} />
        )}
      </Campo>
      <Interruptor
        nombre="es_perecible"
        etiqueta="Vence"
        ayuda="Cada ingreso pedirá la fecha de vencimiento"
        marcado={insumo?.es_perecible ?? false}
      />
      <Campo nombre="proveedor_habitual_id" etiqueta="Proveedor habitual" opcional>
        {(p) => (
          <select {...p} defaultValue={insumo?.proveedor_habitual_id ?? ""}>
            <option value="">Ninguno</option>
            {proveedores.map((pr) => (
              <option key={pr.id} value={pr.id}>
                {pr.nombre}
              </option>
            ))}
          </select>
        )}
      </Campo>
      <Campo nombre="descripcion" etiqueta="Notas" opcional>
        {(p) => <textarea {...p} rows={2} defaultValue={insumo?.descripcion ?? ""} />}
      </Campo>
      <EditorEquivalencias
        iniciales={insumo?.equivalencias ?? []}
        unidades={unidadesCompra.filter((u) => u.id !== base)}
        unidadBase={codigoBase}
      />
      <BarraGuardar volver={VOLVER} />
    </FormularioPanel>
  );
}
```

> El `select` de unidad base es **controlado** porque de él depende la etiqueta del mínimo y de las
> equivalencias. `FormularioPanel` restaura campos por `name` al recuperar la copia local; si al
> probar la recuperación el selector no vuelve a su valor, registrar un restaurable como hace
> `EditorEquivalencias` (trampa de `CLAUDE.md`: un control que no lee su valor del DOM se restaura
> solo).

- [ ] Crear `src/app/(admin)/admin/insumos/nuevo/page.tsx` y `src/app/(admin)/admin/insumos/[id]/editar/page.tsx`.
      Las dos cargan lo mismo con esta función, que va en un archivo nuevo
      `src/app/(admin)/admin/insumos/datos-formulario.ts`:

```ts
import "server-only";

import type { UnidadOpcion } from "@/components/panel/editor-equivalencias";
import { crearClienteServidor } from "@/lib/supabase/servidor";

export async function datosDelFormulario() {
  const supabase = await crearClienteServidor();
  const [{ data: unidades }, { data: proveedores }] = await Promise.all([
    supabase.from("unidades_medida").select("id, codigo, nombre, es_base").order("nombre"),
    supabase.from("proveedores").select("id, nombre").is("deleted_at", null).order("nombre"),
  ]);
  const todas: (UnidadOpcion & { es_base: boolean })[] = unidades ?? [];
  return {
    unidadesBase: todas.filter((u) => u.es_base),
    unidadesCompra: todas,
    proveedores: proveedores ?? [],
  };
}
```

`nuevo/page.tsx`:

```tsx
import { Suspense } from "react";

import { EncabezadoPanel } from "@/components/panel/encabezado-panel";
import { exigirAcceso } from "@/lib/auth/sesion";

import { datosDelFormulario } from "../datos-formulario";
import { FormularioInsumo } from "../formulario-insumo";

export default function NuevoInsumo() {
  return (
    <>
      <EncabezadoPanel
        titulo="Nuevo insumo"
        volver={{ ruta: "/admin/insumos", nombre: "Insumos" }}
      />
      <Suspense fallback={<p className="text-muted-foreground text-sm">Cargando…</p>}>
        <Formulario />
      </Suspense>
    </>
  );
}

async function Formulario() {
  await exigirAcceso("/admin/insumos");
  const datos = await datosDelFormulario();
  return <FormularioInsumo insumo={null} {...datos} />;
}
```

`[id]/editar/page.tsx`:

```tsx
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { ConfirmarBorrado } from "@/components/panel/confirmar-borrado";
import { EncabezadoPanel } from "@/components/panel/encabezado-panel";
import { retirarInsumo } from "@/lib/acciones/insumos";
import { exigirAcceso } from "@/lib/auth/sesion";
import { crearClienteServidor } from "@/lib/supabase/servidor";

import { datosDelFormulario } from "../../datos-formulario";
import { FormularioInsumo } from "../../formulario-insumo";

export default function EditarInsumo({ params }: PageProps<"/admin/insumos/[id]/editar">) {
  return (
    <Suspense fallback={<p className="text-muted-foreground text-sm">Cargando…</p>}>
      <Editor params={params} />
    </Suspense>
  );
}

async function Editor({ params }: { params: PageProps<"/admin/insumos/[id]/editar">["params"] }) {
  const { id } = await params;
  await exigirAcceso("/admin/insumos");
  const supabase = await crearClienteServidor();
  const [{ data }, { count }, datos] = await Promise.all([
    supabase
      .from("insumos")
      .select(
        "id, nombre, descripcion, unidad_base_id, presentacion, stock_minimo, es_perecible, proveedor_habitual_id, equivalencias(unidad_desde, unidad_hacia, factor)",
      )
      .eq("id", id)
      .is("deleted_at", null)
      .maybeSingle(),
    supabase
      .from("movimientos_insumo")
      .select("id", { count: "exact", head: true })
      .eq("insumo_id", id),
    datosDelFormulario(),
  ]);
  if (!data) notFound();

  const insumo = {
    ...data,
    stock_minimo: Number(data.stock_minimo),
    equivalencias: data.equivalencias
      .filter((e) => e.unidad_hacia === data.unidad_base_id)
      .map((e) => ({ unidad_desde_id: e.unidad_desde, factor: String(e.factor) })),
    tieneMovimientos: (count ?? 0) > 0,
  };

  return (
    <>
      <EncabezadoPanel
        titulo={data.nombre}
        volver={{ ruta: "/admin/insumos", nombre: "Insumos" }}
        accion={
          <ConfirmarBorrado
            nombre={`el insumo ${data.nombre}`}
            accion={retirarInsumo.bind(null, id)}
          />
        }
      />
      <FormularioInsumo insumo={insumo} {...datos} />
    </>
  );
}
```

### Paso 10 — Proveedores

- [ ] Crear `src/app/(admin)/admin/insumos/proveedores/formulario-proveedor.tsx`, con el mismo
      patrón que `formulario-categoria.tsx` y sin pestañas:

```tsx
"use client";

import { BarraGuardar } from "@/components/panel/barra-guardar";
import { Campo } from "@/components/panel/campo";
import { FormularioPanel } from "@/components/panel/formulario-panel";
import { guardarProveedor } from "@/lib/acciones/proveedores";
import { claveDeBorrador } from "@/lib/panel/borrador";
import { validarProveedor } from "@/lib/validaciones/proveedor";

export type ProveedorEditable = {
  id: string;
  nombre: string;
  contacto: string | null;
  telefono: string | null;
  observacion: string | null;
};

const VOLVER = "/admin/insumos/proveedores";

export function FormularioProveedor({ proveedor }: { proveedor: ProveedorEditable | null }) {
  return (
    <FormularioPanel
      clave={claveDeBorrador("proveedor", proveedor?.id ?? null)}
      accion={guardarProveedor}
      validar={validarProveedor}
      destino={() => VOLVER}
    >
      <input type="hidden" name="id" value={proveedor?.id ?? ""} />
      <Campo nombre="nombre" etiqueta="Nombre">
        {(p) => <input {...p} defaultValue={proveedor?.nombre ?? ""} autoComplete="off" />}
      </Campo>
      <Campo nombre="contacto" etiqueta="Persona de contacto" opcional>
        {(p) => <input {...p} defaultValue={proveedor?.contacto ?? ""} />}
      </Campo>
      <Campo nombre="telefono" etiqueta="Teléfono" opcional>
        {(p) => (
          <input {...p} type="tel" inputMode="tel" defaultValue={proveedor?.telefono ?? ""} />
        )}
      </Campo>
      <Campo nombre="observacion" etiqueta="Qué nos vende" opcional>
        {(p) => <textarea {...p} rows={2} defaultValue={proveedor?.observacion ?? ""} />}
      </Campo>
      <BarraGuardar volver={VOLVER} />
    </FormularioPanel>
  );
}
```

- [ ] Crear `src/app/(admin)/admin/insumos/proveedores/page.tsx`:

```tsx
import { Plus } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";

import { ConfirmarBorrado } from "@/components/panel/confirmar-borrado";
import { EncabezadoPanel } from "@/components/panel/encabezado-panel";
import { ListaAdaptable } from "@/components/panel/lista-adaptable";
import { retirarProveedor } from "@/lib/acciones/proveedores";
import { exigirAcceso } from "@/lib/auth/sesion";
import { crearClienteServidor } from "@/lib/supabase/servidor";

const RUTA = "/admin/insumos/proveedores";

export default function Proveedores() {
  return (
    <>
      <EncabezadoPanel
        titulo="Proveedores"
        volver={{ ruta: "/admin/insumos", nombre: "Insumos" }}
        accion={
          <Link href={`${RUTA}/nuevo`} className="boton-cta">
            <Plus aria-hidden className="size-5" /> Nuevo proveedor
          </Link>
        }
      />
      <Suspense fallback={<p className="text-muted-foreground text-sm">Cargando…</p>}>
        <Lista />
      </Suspense>
    </>
  );
}

async function Lista() {
  await exigirAcceso(RUTA);
  const supabase = await crearClienteServidor();
  const { data, error } = await supabase
    .from("proveedores")
    .select("id, nombre, observacion")
    .is("deleted_at", null)
    .order("nombre");

  if (error) {
    return <p role="alert">No se pudieron cargar los proveedores. Recarga la página.</p>;
  }

  return (
    <ListaAdaptable
      etiqueta="Proveedores"
      filas={data}
      enlace={(p) => `${RUTA}/${p.id}`}
      columnas={[
        { titulo: "Nombre", celda: (p) => p.nombre, principal: true },
        { titulo: "Qué nos vende", celda: (p) => p.observacion ?? "" },
      ]}
      acciones={(p) => (
        <ConfirmarBorrado
          nombre={`el proveedor ${p.nombre}`}
          accion={retirarProveedor.bind(null, p.id)}
        />
      )}
      vacio={<p>Todavía no hay proveedores. Crea el primero con «Nuevo proveedor».</p>}
    />
  );
}
```

- [ ] Crear `src/app/(admin)/admin/insumos/proveedores/nuevo/page.tsx`:

```tsx
import { Suspense } from "react";

import { EncabezadoPanel } from "@/components/panel/encabezado-panel";
import { exigirAcceso } from "@/lib/auth/sesion";

import { FormularioProveedor } from "../formulario-proveedor";

export default function NuevoProveedor() {
  return (
    <>
      <EncabezadoPanel
        titulo="Nuevo proveedor"
        volver={{ ruta: "/admin/insumos/proveedores", nombre: "Proveedores" }}
      />
      <Suspense fallback={<p className="text-muted-foreground text-sm">Cargando…</p>}>
        <Formulario />
      </Suspense>
    </>
  );
}

async function Formulario() {
  await exigirAcceso("/admin/insumos/proveedores");
  return <FormularioProveedor proveedor={null} />;
}
```

- [ ] Crear `src/app/(admin)/admin/insumos/proveedores/[id]/page.tsx`:

```tsx
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { EncabezadoPanel } from "@/components/panel/encabezado-panel";
import { exigirAcceso } from "@/lib/auth/sesion";
import { crearClienteServidor } from "@/lib/supabase/servidor";

import { FormularioProveedor } from "../formulario-proveedor";

const RUTA = "/admin/insumos/proveedores";

export default function EditarProveedor({ params }: PageProps<"/admin/insumos/proveedores/[id]">) {
  return (
    <Suspense fallback={<p className="text-muted-foreground text-sm">Cargando…</p>}>
      <Editor params={params} />
    </Suspense>
  );
}

async function Editor({
  params,
}: {
  params: PageProps<"/admin/insumos/proveedores/[id]">["params"];
}) {
  const { id } = await params;
  await exigirAcceso(RUTA);
  const supabase = await crearClienteServidor();
  const { data } = await supabase
    .from("proveedores")
    .select("id, nombre, contacto, telefono, observacion")
    .eq("id", id)
    .is("deleted_at", null)
    .maybeSingle();
  if (!data) notFound();

  return (
    <>
      <EncabezadoPanel titulo={data.nombre} volver={{ ruta: RUTA, nombre: "Proveedores" }} />
      <FormularioProveedor proveedor={data} />
    </>
  );
}
```

### Paso 11 — Pruebas de navegador

- [ ] En `e2e/panel-accesibilidad.spec.ts`, añadir a `RUTAS_DEL_PANEL`:

```ts
  "/admin/insumos",
  "/admin/insumos/nuevo",
  "/admin/insumos/proveedores",
  "/admin/insumos/proveedores/nuevo",
```

- [ ] Crear `e2e/panel-insumos.spec.ts`:

```ts
import { expect, test } from "@playwright/test";

import { entrarComo } from "./ayudas/sesion";
import { borrarUsuario } from "./ayudas/usuarios";

test("el ingeniero crea un insumo con su equivalencia y lo ve en Existencias", async ({ page }) => {
  const usuario = await entrarComo(page, "ingeniero");
  const nombre = `Coco rallado ${Date.now()}`;
  try {
    await page.goto("/admin/insumos/nuevo");
    await page.getByLabel("Nombre").fill(nombre);
    await page.getByLabel("Se cuenta en").selectOption({ label: "Kilogramo" });
    await page.getByLabel("Stock mínimo (en kg)").fill("10");
    await page.getByRole("button", { name: "Añadir unidad de compra" }).click();
    await page.getByLabel("Unidad 1").selectOption({ label: "1 bolsa" });
    await page.getByLabel("= cuántos kg").fill("5");
    await page.getByRole("button", { name: "Guardar" }).click();

    await page.waitForURL("/admin/insumos");
    await page.getByLabel("Buscar insumo").fill(nombre);
    await page.getByRole("button", { name: "Buscar" }).click();
    const fila = page.getByRole("list", { name: "Existencias de insumos" }).getByText(nombre);
    const tabla = page.getByRole("table", { name: "Existencias de insumos" }).getByText(nombre);
    await expect(fila.or(tabla)).toBeVisible();
    await expect(page.getByText("Bajo el mínimo").first()).toBeVisible();
  } finally {
    await borrarUsuario(usuario.id);
  }
});

test("el repartidor no ve la sección de insumos", async ({ page }) => {
  const usuario = await entrarComo(page, "repartidor");
  try {
    await page.goto("/admin/insumos");
    await page.waitForURL(/\/admin\?motivo=sin-acceso/);
  } finally {
    await borrarUsuario(usuario.id);
  }
});
```

- [ ] Liberar el puerto 3000 (`netstat -ano | grep ":3000 " | grep LISTENING`), construir y correr:

```bash
pnpm build
pnpm exec playwright test e2e/panel-insumos.spec.ts e2e/panel-accesibilidad.spec.ts e2e/panel-cascara.spec.ts
```

Esperado: todo en verde. Si `panel-cascara.spec.ts` contaba los botones de la barra inferior, se
ajusta a la navegación nueva (el administrador tiene cuatro).

### Paso 12 — Cerrar la tarea

- [ ] `pnpm typecheck && pnpm lint && pnpm format:check && pnpm test` sin avisos.
- [ ] Comprobar a 375 px, en la vista previa de Vercel, Existencias y el formulario.
- [ ] Commit, PR y `db push` de 0035 por Dan antes de fusionar:

```bash
git add supabase/migrations/0035_guardar_insumo.sql supabase/tests/0035_guardar_insumo.test.sql \
        src/tipos/database.types.ts src/lib/insumos src/lib/validaciones/numeros.ts \
        src/lib/validaciones/numeros.test.ts src/lib/validaciones/insumo.ts \
        src/lib/validaciones/insumo.test.ts src/lib/validaciones/proveedor.ts \
        src/lib/validaciones/proveedor.test.ts src/lib/acciones/insumos.ts \
        src/lib/acciones/proveedores.ts src/lib/panel/navegacion.ts src/lib/panel/navegacion.test.ts \
        src/components/panel "src/app/(admin)/admin/insumos" e2e/panel-insumos.spec.ts \
        e2e/panel-accesibilidad.spec.ts
git commit -m "feat(insumos): catálogo de insumos, proveedores y existencias"
```

---

## Tarea 3 — Ingresos y consumos en varias líneas

**Rama:** `feat/f5-t3-ingresos-consumos`

**Qué deja hecho:** el ingeniero registra **una boleta con varios insumos** (proveedor, documento,
precio por línea y vencimiento en los perecibles) y **el consumo del día en varias líneas**. Cada
registro entra entero o no entra. Si el número de documento ya se registró con ese proveedor, se
avisa. Si un consumo no alcanza, la frase dice cuánto hay. Existencias enseña los botones
«Registrar ingreso» y «Registrar consumo».

**Archivos:**

- Crear: `supabase/migrations/0036_registrar_movimientos.sql` + `supabase/tests/0036_registrar_movimientos.test.sql`
- Crear: `src/lib/validaciones/movimiento.ts` + `.test.ts`
- Modificar: `src/lib/panel/hora-lima.ts` + `.test.ts` (`formatearFechaLima`)
- Crear: `src/lib/acciones/movimientos.ts`
- Crear: `src/components/panel/editor-lineas.tsx`, `src/lib/insumos/lineas.ts`
- Crear: `src/app/(admin)/admin/insumos/datos-movimiento.ts`, `ingreso/page.tsx`,
  `ingreso/formulario-ingreso.tsx`, `consumo/page.tsx`, `consumo/formulario-consumo.tsx`
- Modificar: `src/app/(admin)/admin/insumos/page.tsx` (`REGISTRAR`)
- Crear: `e2e/panel-movimientos.spec.ts`, `e2e/insumos-concurrencia.spec.ts`
- Modificar: `e2e/panel-accesibilidad.spec.ts`

**Interfaces:**

- Consume (T1): reparto FEFO y error «Solo hay…»; defaults de `almacen_id` y `responsable_id`.
  (T2): `cantidadPositiva`, `precio`, `RUTA_INSUMOS`, `existencias_insumo`. (F4): `limaAUtc`,
  `utcALima`, `json`, `ejecutarAccion`, `FormularioPanel`, `useFormularioPanel`, `Campo`,
  `CLASE_CONTROL`, `Interruptor`, `BarraGuardar`, `claveDeBorrador`.
- Produce:
  - `public.registrar_ingreso(p_documento jsonb, p_lineas jsonb) returns integer`
  - `public.registrar_consumo(p_cabecera jsonb, p_lineas jsonb) returns integer`
  - `public.ingreso_registrado(p_proveedor uuid, p_numero text) returns timestamptz`
  - `formatearFechaLima(iso: string): string` → «12/10/2026 08:00»
  - `type InsumoParaLinea = { id: string; nombre: string; es_perecible: boolean; unidades: { id: string; codigo: string; nombre: string }[] }`
    en `src/lib/insumos/lineas.ts`, y `insumosParaLineas(): Promise<InsumoParaLinea[]>` en
    `src/app/(admin)/admin/insumos/datos-movimiento.ts` (T4 y T5 los reutilizan)
  - `<EditorLineas tipo="ingreso" | "consumo" | "baja" insumos={...} />` (T5 usa `"baja"`)
  - `erroresPorCampo(error: z.ZodError): Record<string, string[]>`: claves con punto,
    `lineas.0.cantidad`

### Paso 1 — La base: registrar en una sola transacción

- [ ] Crear `supabase/tests/0036_registrar_movimientos.test.sql`:

```sql
-- Verifica registrar_ingreso, registrar_consumo e ingreso_registrado (0036).
--
-- Lo que se defiende: que una boleta de varias líneas entre entera o no entre;
-- que un lote con código repetido se explique; que un consumo que no alcanza
-- no deje a medias las líneas anteriores; y que avisar de un documento repetido
-- no cuente los anulados.
begin;
select plan(17);

insert into auth.users (id, email, created_at, updated_at) values
  ('22222222-2222-2222-2222-222222222222', 'admin@pimpos.test',   now(), now()),
  ('33333333-3333-3333-3333-333333333333', 'inge@pimpos.test',    now(), now()),
  ('44444444-4444-4444-4444-444444444444', 'reparto@pimpos.test', now(), now());
update public.perfiles set rol = 'administrador', activo = true where id = '22222222-2222-2222-2222-222222222222';
update public.perfiles set rol = 'ingeniero',     activo = true where id = '33333333-3333-3333-3333-333333333333';
update public.perfiles set rol = 'repartidor',    activo = true where id = '44444444-4444-4444-4444-444444444444';

create temp table ref as
select
  (select id from public.insumos where nombre = 'Harina')            as harina,
  (select id from public.insumos where nombre = 'Azúcar')            as azucar,
  (select id from public.insumos where nombre = 'Manteca')           as manteca,
  (select id from public.unidades_medida where codigo = 'saco')      as saco,
  (select id from public.unidades_medida where codigo = 'kg')        as kg,
  (select id from public.unidades_medida where codigo = 'caja')      as caja,
  (select id from public.unidades_medida where codigo = 'botella')   as botella,
  (select id from public.proveedores where nombre = 'Comercial FOX') as fox,
  (select id from public.proveedores where nombre = 'Maíz Center')   as maiz;
grant select on ref to authenticated;

select has_function('public', 'registrar_ingreso', array['jsonb', 'jsonb'], 'existe registrar_ingreso');
select has_function('public', 'registrar_consumo', array['jsonb', 'jsonb'], 'existe registrar_consumo');

set local role authenticated;
set local request.jwt.claims = '{"sub": "33333333-3333-3333-3333-333333333333", "rol": "ingeniero"}';

select is(
  public.registrar_ingreso(
    jsonb_build_object('proveedor_id', (select fox from ref), 'documento_tipo', 'boleta',
                       'documento_numero', 'B001-123', 'observacion', 'Todo en buen estado'),
    jsonb_build_array(
      jsonb_build_object('insumo_id', (select harina from ref), 'cantidad', '2',
                         'unidad_id', (select saco from ref), 'precio_unitario', '150'),
      jsonb_build_object('insumo_id', (select manteca from ref), 'cantidad', '1',
                         'unidad_id', (select caja from ref), 'precio_unitario', '90',
                         'fecha_vencimiento', (current_date + 30)::text, 'codigo_lote', 'M-01'))),
  2, 'una boleta de dos líneas registra dos ingresos'
);
select is(
  (select cantidad_base from public.saldos_insumo where insumo_id = (select harina from ref)),
  100.0::numeric(14,4), 'la harina sube 100 kg'
);
select is(
  (select codigo from public.lotes_insumo l
     join public.saldos_lote s on s.lote_id = l.id
    where l.insumo_id = (select manteca from ref)),
  'M-01', 'la manteca entra en su lote con código y fecha'
);
select is(
  (select responsable_id from public.movimientos_insumo where documento_numero = 'B001-123' limit 1),
  '33333333-3333-3333-3333-333333333333'::uuid, 'a nombre de quien registra'
);

select throws_ok($$
  select public.registrar_ingreso(
    jsonb_build_object('proveedor_id', (select fox from ref), 'documento_tipo', 'boleta',
                       'documento_numero', 'B001-124', 'observacion', 'x'),
    jsonb_build_array(
      jsonb_build_object('insumo_id', (select azucar from ref), 'cantidad', '1',
                         'unidad_id', (select saco from ref), 'precio_unitario', '120'),
      jsonb_build_object('insumo_id', (select harina from ref), 'cantidad', '1',
                         'unidad_id', (select botella from ref), 'precio_unitario', '1')))
$$, 'P0002', null, 'una línea con una unidad sin equivalencia tumba la boleta');
select is(
  (select count(*)::int from public.movimientos_insumo where documento_numero = 'B001-124'),
  0, 'y no queda ninguna línea a medias'
);
select throws_ok($$
  select public.registrar_ingreso(
    jsonb_build_object('proveedor_id', (select fox from ref), 'documento_tipo', 'boleta',
                       'documento_numero', 'B001-125', 'observacion', 'x'),
    jsonb_build_array(
      jsonb_build_object('insumo_id', (select manteca from ref), 'cantidad', '1',
                         'unidad_id', (select caja from ref), 'precio_unitario', '90',
                         'fecha_vencimiento', (current_date + 40)::text, 'codigo_lote', 'm-01')))
$$, 'P0001', 'El lote m-01 de Manteca ya está registrado. Usa otro código o déjalo vacío.',
   'un código de lote repetido se explica (sin distinguir mayúsculas)');
select throws_ok($$
  select public.registrar_ingreso(
    jsonb_build_object('proveedor_id', (select fox from ref), 'documento_tipo', 'boleta',
                       'documento_numero', 'B001-126', 'observacion', 'x',
                       'ocurrido_en', (now() + interval '2 days')::text),
    jsonb_build_array(jsonb_build_object('insumo_id', (select harina from ref), 'cantidad', '1',
                                         'unidad_id', (select kg from ref), 'precio_unitario', '3')))
$$, 'P0001', 'La fecha no puede ser de un día que aún no llega.', 'no se registra en el futuro');

-- El aviso de documento repetido
select ok(public.ingreso_registrado((select fox from ref), ' b001-123 ') is not null,
  'el mismo número del mismo proveedor, con otra forma de escribirlo, se reconoce');
select is(public.ingreso_registrado((select maiz from ref), 'B001-123'), null::timestamptz,
  'el mismo número de otro proveedor no');

-- Consumo
select is(
  public.registrar_consumo(
    jsonb_build_object('origen_consumo', 'produccion', 'destino_lote', 'Pan francés',
                       'area_turno', 'Mañana', 'observacion', 'Primera hornada'),
    jsonb_build_array(
      jsonb_build_object('insumo_id', (select harina from ref), 'cantidad', '40', 'unidad_id', (select kg from ref)),
      jsonb_build_object('insumo_id', (select manteca from ref), 'cantidad', '2', 'unidad_id', (select kg from ref)))),
  2, 'un consumo de dos líneas'
);
select throws_ok($$
  select public.registrar_consumo(
    jsonb_build_object('origen_consumo', 'retiro_directo', 'destino_lote', 'Pan dulce',
                       'area_turno', 'Tarde', 'observacion', 'x'),
    jsonb_build_array(
      jsonb_build_object('insumo_id', (select harina from ref), 'cantidad', '10', 'unidad_id', (select kg from ref)),
      jsonb_build_object('insumo_id', (select manteca from ref), 'cantidad', '50', 'unidad_id', (select kg from ref))))
$$, 'P0001', 'Solo hay 8 kg de Manteca. Si en el almacén hay más, falta registrar un ingreso o hacer un conteo.',
   'si una línea no alcanza, lo dice');
select is(
  (select cantidad_base from public.saldos_insumo where insumo_id = (select harina from ref)),
  60.0::numeric(14,4), 'y la harina de la primera línea no se descontó'
);

set local request.jwt.claims = '{"sub": "44444444-4444-4444-4444-444444444444", "rol": "repartidor"}';
select throws_ok($$
  select public.registrar_consumo(
    jsonb_build_object('origen_consumo', 'produccion', 'destino_lote', 'x', 'area_turno', 'x', 'observacion', 'x'),
    jsonb_build_array(jsonb_build_object('insumo_id', (select harina from ref), 'cantidad', '1', 'unidad_id', (select kg from ref))))
$$, null, null, 'el repartidor no registra consumos');
-- Sin código: el repartidor no ve la harina, así que el trigger BEFORE (que
-- corre antes que la política) ya falla al convertir. Lo que importa es que no
-- entre, y lo comprueba la cuenta de abajo, ya sin el rol del repartidor
-- (con él, la RLS daría cero de todas formas).
reset role;
select is((select count(*)::int from public.movimientos_insumo where destino_lote = 'x'), 0,
  'y no queda nada registrado');

select * from finish();
rollback;
```

> `P0002` es `no_data_found`, el `errcode` con que `app.convertir_a_base` (0011) avisa de que falta
> una equivalencia. `traducirError` no lo conoce todavía: el paso 3 lo añade.

- [ ] `supabase test db` → FALLA `0036`.

- [ ] Crear `supabase/migrations/0036_registrar_movimientos.sql`:

```sql
-- =============================================================================
-- 0036_registrar_movimientos.sql
-- Una boleta con varios insumos, y el consumo del día con varios, en una sola
-- transacción cada uno (F5, tarea 3; decisión 8 del plan 05).
--
-- `security invoker`: la política de movimientos_insumo (0034) decide igual
-- que si el panel insertara fila a fila. El almacén y el responsable los pone
-- la base (defaults de 0034), así que aquí no aparecen.
--
-- Contratos:
--   registrar_ingreso(p_documento, p_lineas)
--     p_documento: { proveedor_id, documento_tipo, documento_numero,
--                    observacion, ocurrido_en? (ISO; vacío = ahora) }
--     p_lineas:    [{ insumo_id, cantidad, unidad_id, precio_unitario,
--                     fecha_vencimiento?, codigo_lote? }]
--   registrar_consumo(p_cabecera, p_lineas)
--     p_cabecera: { origen_consumo, destino_lote, area_turno, observacion,
--                   ocurrido_en? }
--     p_lineas:   [{ insumo_id, cantidad, unidad_id }]
-- Las cantidades y los precios llegan como TEXTO y se convierten aquí a
-- numeric, sin pasar por coma flotante.
-- =============================================================================

create or replace function app.momento_del_registro(p_texto text)
returns timestamptz
language plpgsql
stable
set search_path = ''
as $$
declare
  v timestamptz := coalesce(nullif(p_texto, '')::timestamptz, now());
begin
  -- Cinco minutos de margen: el reloj del celular puede ir un poco adelantado.
  if v > now() + interval '5 minutes' then
    raise exception 'La fecha no puede ser de un día que aún no llega.' using errcode = 'P0001';
  end if;
  return v;
end;
$$;
revoke execute on function app.momento_del_registro(text) from public, anon;
grant execute on function app.momento_del_registro(text) to authenticated;

create or replace function public.registrar_ingreso(p_documento jsonb, p_lineas jsonb)
returns integer
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_cuando timestamptz := app.momento_del_registro(p_documento ->> 'ocurrido_en');
  v_item   jsonb;
  v_lote   uuid;
  v_codigo text;
  v_n      integer := 0;
begin
  if jsonb_typeof(p_lineas) is distinct from 'array' or jsonb_array_length(p_lineas) = 0 then
    raise exception 'Añade al menos un insumo.' using errcode = 'P0001';
  end if;

  for v_item in select value from jsonb_array_elements(p_lineas)
  loop
    v_lote := null;
    v_codigo := nullif(btrim(v_item ->> 'codigo_lote'), '');

    if v_codigo is not null and exists (
      select 1 from public.lotes_insumo
       where insumo_id = (v_item ->> 'insumo_id')::uuid and lower(codigo) = lower(v_codigo)
    ) then
      raise exception '%', format('El lote %s de %s ya está registrado. Usa otro código o déjalo vacío.',
        v_codigo, (select nombre from public.insumos where id = (v_item ->> 'insumo_id')::uuid))
        using errcode = 'P0001';
    end if;

    -- Con código o fecha, el lote se crea aquí; sin ninguno de los dos, lo crea
    -- el reparto (0034) al registrar la entrada.
    if v_codigo is not null or nullif(v_item ->> 'fecha_vencimiento', '') is not null then
      insert into public.lotes_insumo (insumo_id, codigo, fecha_vencimiento)
      values ((v_item ->> 'insumo_id')::uuid, v_codigo, nullif(v_item ->> 'fecha_vencimiento', '')::date)
      returning id into v_lote;
    end if;

    insert into public.movimientos_insumo
      (tipo, insumo_id, lote_id, cantidad, unidad_id, ocurrido_en, observacion,
       proveedor_id, documento_tipo, documento_numero, precio_unitario)
    values (
      'ingreso',
      (v_item ->> 'insumo_id')::uuid,
      v_lote,
      (v_item ->> 'cantidad')::numeric(14,4),
      (v_item ->> 'unidad_id')::uuid,
      v_cuando,
      nullif(btrim(p_documento ->> 'observacion'), ''),
      (p_documento ->> 'proveedor_id')::uuid,
      p_documento ->> 'documento_tipo',
      btrim(p_documento ->> 'documento_numero'),
      nullif(v_item ->> 'precio_unitario', '')::numeric(12,4)
    );
    v_n := v_n + 1;
  end loop;

  return v_n;
end;
$$;
comment on function public.registrar_ingreso(jsonb, jsonb) is
  'Un documento de compra con varias líneas, en una transacción. Devuelve cuántas líneas registró.';
revoke execute on function public.registrar_ingreso(jsonb, jsonb) from public, anon;
grant execute on function public.registrar_ingreso(jsonb, jsonb) to authenticated;

create or replace function public.registrar_consumo(p_cabecera jsonb, p_lineas jsonb)
returns integer
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_cuando timestamptz := app.momento_del_registro(p_cabecera ->> 'ocurrido_en');
  v_item   jsonb;
  v_n      integer := 0;
begin
  if jsonb_typeof(p_lineas) is distinct from 'array' or jsonb_array_length(p_lineas) = 0 then
    raise exception 'Añade al menos un insumo.' using errcode = 'P0001';
  end if;

  for v_item in select value from jsonb_array_elements(p_lineas)
  loop
    insert into public.movimientos_insumo
      (tipo, insumo_id, cantidad, unidad_id, ocurrido_en, observacion,
       origen_consumo, destino_lote, area_turno)
    values (
      'consumo',
      (v_item ->> 'insumo_id')::uuid,
      (v_item ->> 'cantidad')::numeric(14,4),
      (v_item ->> 'unidad_id')::uuid,
      v_cuando,
      nullif(btrim(p_cabecera ->> 'observacion'), ''),
      (p_cabecera ->> 'origen_consumo')::app.origen_consumo,
      nullif(btrim(p_cabecera ->> 'destino_lote'), ''),
      nullif(btrim(p_cabecera ->> 'area_turno'), '')
    );
    v_n := v_n + 1;
  end loop;

  return v_n;
end;
$$;
comment on function public.registrar_consumo(jsonb, jsonb) is
  'El consumo del día con varias líneas, en una transacción. Si una no alcanza, no entra ninguna.';
revoke execute on function public.registrar_consumo(jsonb, jsonb) from public, anon;
grant execute on function public.registrar_consumo(jsonb, jsonb) to authenticated;

-- -----------------------------------------------------------------------------
-- ¿Ya se registró este documento? (ficha 7.1: compras duplicadas)
--
-- Sin distinguir mayúsculas ni espacios, y sin contar los ingresos anulados:
-- una boleta mal registrada, anulada y vuelta a registrar no es un duplicado.
-- -----------------------------------------------------------------------------
create or replace function public.ingreso_registrado(p_proveedor uuid, p_numero text)
returns timestamptz
language sql
stable
security invoker
set search_path = ''
as $$
  select max(m.ocurrido_en)
    from public.movimientos_insumo m
   where m.tipo = 'ingreso'
     and m.proveedor_id = p_proveedor
     and lower(btrim(m.documento_numero)) = lower(btrim(p_numero))
     and not exists (select 1 from public.movimientos_insumo a where a.anula_a = m.id);
$$;
revoke execute on function public.ingreso_registrado(uuid, text) from public, anon;
grant execute on function public.ingreso_registrado(uuid, text) to authenticated;
```

- [ ] `supabase db reset && supabase test db` → todo en verde. Después
      `bash supabase/seeds/imagenes/subir-imagenes.sh` y `pnpm supabase:tipos`.

### Paso 2 — Fecha legible, lógica pura

- [ ] Añadir a `src/lib/panel/hora-lima.test.ts`:

```ts
describe("formatearFechaLima", () => {
  it("escribe la fecha y la hora de Iquitos como se lee aquí", () => {
    expect(formatearFechaLima("2026-10-12T13:00:00.000Z")).toBe("12/10/2026 08:00");
  });

  it("una hora de UTC pasada la medianoche es del día anterior en Iquitos", () => {
    expect(formatearFechaLima("2026-10-13T04:30:00.000Z")).toBe("12/10/2026 23:30");
  });

  it("vacío si no es una fecha", () => {
    expect(formatearFechaLima("ayer")).toBe("");
  });
});
```

(e importar `formatearFechaLima` junto a lo que ya importa ese archivo).

- [ ] `pnpm test -- src/lib/panel/hora-lima.test.ts` → FALLA.

- [ ] Añadir a `src/lib/panel/hora-lima.ts`:

```ts
/** «12/10/2026 08:00», en hora de Iquitos. Para mensajes y listas. */
export function formatearFechaLima(iso: string): string {
  const local = utcALima(iso);
  if (!local) return "";
  const [fecha, hora] = local.split("T");
  const [anio, mes, dia] = fecha!.split("-");
  return `${dia}/${mes}/${anio} ${hora}`;
}
```

- [ ] `pnpm test -- src/lib/panel/hora-lima.test.ts` → PASA.

### Paso 3 — Que falte una equivalencia se entienda

- [ ] Añadir a `src/lib/panel/errores.test.ts`:

```ts
it("una unidad sin equivalencia enseña el mensaje de la base, que dice cuál falta", () => {
  expect(
    traducirError(
      {
        code: "P0002",
        message:
          "No hay equivalencia de Botella a la unidad base de este insumo. Registrala antes de mover stock.",
      },
      "un ingreso",
    ),
  ).toBe(
    "No hay equivalencia de Botella a la unidad base de este insumo. Registrala antes de mover stock.",
  );
});
```

(dentro del `describe` que ya existe).

- [ ] `pnpm test -- src/lib/panel/errores.test.ts` → FALLA (hoy devuelve «No se pudo guardar…»).

- [ ] En `src/lib/panel/errores.ts`, añadir `case "P0002":` junto a `case "23514":` y `case "P0001":`.
      El mensaje de 0011 está escrito para personas y no cae en `esMensajeDePostgres`.

- [ ] `pnpm test -- src/lib/panel/errores.test.ts` → PASA.

### Paso 4 — Esquemas de ingreso y consumo

- [ ] Crear `src/lib/validaciones/movimiento.test.ts`:

```ts
import { describe, expect, it } from "vitest";

import { erroresPorCampo, esquemaConsumo, esquemaIngreso } from "./movimiento";

const HARINA = "0a1f3a52-6b1e-4f7e-9d3a-0a1b2c3d4e5f";
const SACO = "1b2f3a52-6b1e-4f7e-9d3a-0a1b2c3d4e5f";
const FOX = "2c3f3a52-6b1e-4f7e-9d3a-0a1b2c3d4e5f";

const ingreso = {
  proveedor_id: FOX,
  documento_tipo: "boleta",
  documento_numero: "B001-123",
  ocurrido_en: "",
  observacion: "Todo en buen estado",
  confirmar_repetido: false,
  lineas: [
    {
      insumo_id: HARINA,
      cantidad: "2",
      unidad_id: SACO,
      precio_unitario: "S/ 150,00",
      fecha_vencimiento: "",
      codigo_lote: "",
    },
  ],
};

describe("esquemaIngreso", () => {
  it("normaliza cantidades y precios escritos a mano, sin volverlos números", () => {
    const r = esquemaIngreso.parse({
      ...ingreso,
      lineas: [{ ...ingreso.lineas[0]!, cantidad: " 1,5 " }],
    });
    expect(r.lineas[0]?.cantidad).toBe("1.5");
    expect(r.lineas[0]?.precio_unitario).toBe("150.00");
    expect(r.lineas[0]?.fecha_vencimiento).toBeNull();
    expect(r.lineas[0]?.codigo_lote).toBeNull();
  });

  it("vacío en la fecha es «ahora»; con fecha, pasa de Iquitos a UTC", () => {
    expect(esquemaIngreso.parse(ingreso).ocurrido_en).toBeNull();
    expect(esquemaIngreso.parse({ ...ingreso, ocurrido_en: "2026-10-12T08:00" }).ocurrido_en).toBe(
      "2026-10-12T13:00:00.000Z",
    );
  });

  it("una fecha que no lo es se rechaza", () => {
    expect(esquemaIngreso.safeParse({ ...ingreso, ocurrido_en: "ayer" }).success).toBe(false);
  });

  it("pide al menos una línea, el número de documento y el precio", () => {
    expect(esquemaIngreso.safeParse({ ...ingreso, lineas: [] }).success).toBe(false);
    expect(esquemaIngreso.safeParse({ ...ingreso, documento_numero: " " }).success).toBe(false);
    expect(
      esquemaIngreso.safeParse({
        ...ingreso,
        lineas: [{ ...ingreso.lineas[0]!, precio_unitario: "" }],
      }).success,
    ).toBe(false);
  });

  it("no deja el mismo insumo dos veces en la misma boleta", () => {
    const r = esquemaIngreso.safeParse({
      ...ingreso,
      lineas: [ingreso.lineas[0], ingreso.lineas[0]],
    });
    expect(r.success).toBe(false);
  });
});

describe("esquemaConsumo", () => {
  const consumo = {
    origen_consumo: "produccion",
    destino_lote: "Pan francés",
    area_turno: "Mañana",
    observacion: "Primera hornada",
    ocurrido_en: "",
    lineas: [{ insumo_id: HARINA, cantidad: "40", unidad_id: SACO }],
  };

  it("acepta el consumo del día", () => {
    expect(esquemaConsumo.safeParse(consumo).success).toBe(true);
  });

  it("pide para qué fue y en qué turno (ficha 7.6)", () => {
    expect(esquemaConsumo.safeParse({ ...consumo, destino_lote: "" }).success).toBe(false);
    expect(esquemaConsumo.safeParse({ ...consumo, area_turno: "" }).success).toBe(false);
  });
});

describe("erroresPorCampo", () => {
  it("dice en qué línea está el error", () => {
    const r = esquemaIngreso.safeParse({
      ...ingreso,
      lineas: [{ ...ingreso.lineas[0]!, cantidad: "cero" }],
    });
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(Object.keys(erroresPorCampo(r.error))).toContain("lineas.0.cantidad");
    }
  });
});
```

- [ ] `pnpm test -- src/lib/validaciones/movimiento.test.ts` → FALLA.

- [ ] Crear `src/lib/validaciones/movimiento.ts`:

```ts
import * as z from "zod";

import { casilla, json, texto } from "@/lib/panel/formulario";
import { limaAUtc } from "@/lib/panel/hora-lima";

import { cantidadPositiva, precio } from "./numeros";

const vacioANull = (v: string) => (v.trim() === "" ? null : v.trim());

/** `datetime-local` en hora de Iquitos → ISO en UTC. Vacío es «ahora» (lo decide la base). */
const momento = z
  .string()
  // Vacío es null, «ahora». Un texto que no es fecha es undefined, y se rechaza:
  // `limaAUtc` también devuelve null cuando falla, y no hay que confundirlos.
  .transform((v) => (v.trim() === "" ? null : (limaAUtc(v.trim()) ?? undefined)))
  .refine((v) => v !== undefined, { error: "Escribe la fecha y la hora." });

const observacion = z
  .string()
  .trim()
  .min(1, { error: "Escribe una observación, por ejemplo «Todo en buen estado»." })
  .max(300, { error: "Máximo 300 letras." });

const lineaBase = {
  insumo_id: z.uuid({ error: "Elige el insumo." }),
  cantidad: cantidadPositiva("Escribe la cantidad con números, por ejemplo 2 o 1.5."),
  unidad_id: z.uuid({ error: "Elige la unidad." }),
};

const sinRepetir = <L extends { insumo_id: string }>(lineas: L[]) =>
  new Set(lineas.map((l) => l.insumo_id)).size === lineas.length;

export const esquemaLineaIngreso = z.object({
  ...lineaBase,
  precio_unitario: precio("Escribe el precio con números, por ejemplo 150."),
  fecha_vencimiento: z
    .union([z.literal(""), z.iso.date({ error: "Elige la fecha de vencimiento." })])
    .transform((v) => (v === "" ? null : v)),
  codigo_lote: z.string().max(40, { error: "Máximo 40 caracteres." }).transform(vacioANull),
});

export const esquemaIngreso = z.object({
  proveedor_id: z.uuid({ error: "Elige el proveedor." }),
  documento_tipo: z.enum(["boleta", "factura", "guia"], { error: "Elige el tipo de documento." }),
  documento_numero: z
    .string()
    .trim()
    .min(1, { error: "Escribe el número del documento." })
    .max(40, { error: "Máximo 40 caracteres." }),
  ocurrido_en: momento,
  observacion,
  confirmar_repetido: z.boolean(),
  lineas: z
    .array(esquemaLineaIngreso)
    .min(1, { error: "Añade al menos un insumo." })
    .max(30, { error: "Como mucho 30 líneas por documento." })
    .refine(sinRepetir, { error: "Cada insumo va en una sola línea." }),
});

export const esquemaLineaConsumo = z.object(lineaBase);

export const esquemaConsumo = z.object({
  origen_consumo: z.enum(["produccion", "retiro_directo"], { error: "Elige de dónde sale." }),
  destino_lote: z
    .string()
    .trim()
    .min(1, { error: "Escribe para qué fue, por ejemplo «Pan francés»." })
    .max(80, { error: "Máximo 80 letras." }),
  area_turno: z
    .string()
    .trim()
    .min(1, { error: "Escribe el área o el turno." })
    .max(40, { error: "Máximo 40 letras." }),
  observacion,
  ocurrido_en: momento,
  lineas: z
    .array(esquemaLineaConsumo)
    .min(1, { error: "Añade al menos un insumo." })
    .max(30, { error: "Como mucho 30 líneas." })
    .refine(sinRepetir, { error: "Cada insumo va en una sola línea." }),
});

/**
 * Los errores con su ruta completa: `lineas.0.cantidad`. `z.flattenError` los
 * juntaría todos bajo `lineas`, y en un formulario de varias líneas hay que
 * saber cuál marcar en rojo.
 */
export function erroresPorCampo(error: z.ZodError): Record<string, string[]> {
  const errores: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const clave = issue.path.map(String).join(".") || "formulario";
    (errores[clave] ??= []).push(issue.message);
  }
  return errores;
}

export function leerIngreso(fd: FormData) {
  return {
    proveedor_id: texto(fd, "proveedor_id"),
    documento_tipo: texto(fd, "documento_tipo"),
    documento_numero: texto(fd, "documento_numero"),
    ocurrido_en: texto(fd, "ocurrido_en"),
    observacion: texto(fd, "observacion"),
    confirmar_repetido: casilla(fd, "confirmar_repetido"),
    lineas: json(fd, "lineas") ?? [],
  };
}

export function leerConsumo(fd: FormData) {
  return {
    origen_consumo: texto(fd, "origen_consumo"),
    destino_lote: texto(fd, "destino_lote"),
    area_turno: texto(fd, "area_turno"),
    observacion: texto(fd, "observacion"),
    ocurrido_en: texto(fd, "ocurrido_en"),
    lineas: json(fd, "lineas") ?? [],
  };
}

export function validarIngreso(fd: FormData) {
  const r = esquemaIngreso.safeParse(leerIngreso(fd));
  return r.success ? {} : erroresPorCampo(r.error);
}

export function validarConsumo(fd: FormData) {
  const r = esquemaConsumo.safeParse(leerConsumo(fd));
  return r.success ? {} : erroresPorCampo(r.error);
}
```

- [ ] `pnpm test -- src/lib/validaciones/movimiento.test.ts` → PASA.

### Paso 5 — Acciones

- [ ] Crear `src/lib/acciones/movimientos.ts`:

```ts
"use server";

import { ejecutarAccion, type EstadoAccion } from "@/lib/panel/accion";
import { formatearFechaLima } from "@/lib/panel/hora-lima";
import {
  esquemaConsumo,
  esquemaIngreso,
  leerConsumo,
  leerIngreso,
} from "@/lib/validaciones/movimiento";

import { RUTA_INSUMOS } from "./insumos";

const lineas = (n: number) => `${n} ${n === 1 ? "insumo" : "insumos"}`;

export async function registrarIngreso(fd: FormData): Promise<EstadoAccion> {
  return ejecutarAccion({
    ruta: `${RUTA_INSUMOS}/ingreso`,
    esquema: esquemaIngreso,
    entrada: leerIngreso(fd),
    entidad: "un ingreso",
    etiquetas: [],
    mensajeOk: "Ingreso registrado.",
    hacer: async (d, { supabase }) => {
      if (!d.confirmar_repetido) {
        const { data: previo, error } = await supabase.rpc("ingreso_registrado", {
          p_proveedor: d.proveedor_id,
          p_numero: d.documento_numero,
        });
        if (error) return { error };
        if (previo) {
          return {
            error: {
              code: "P0001",
              message: `Ese documento de ese proveedor ya se registró el ${formatearFechaLima(previo)}. Si es otro, marca «Es otro documento aunque el número se repita» y guarda.`,
            },
          };
        }
      }
      const { data, error } = await supabase.rpc("registrar_ingreso", {
        p_documento: {
          proveedor_id: d.proveedor_id,
          documento_tipo: d.documento_tipo,
          documento_numero: d.documento_numero,
          observacion: d.observacion,
          ocurrido_en: d.ocurrido_en ?? "",
        },
        p_lineas: d.lineas,
      });
      return { error, mensaje: data ? `Ingreso registrado: ${lineas(data)}.` : undefined };
    },
  });
}

export async function registrarConsumo(fd: FormData): Promise<EstadoAccion> {
  return ejecutarAccion({
    ruta: `${RUTA_INSUMOS}/consumo`,
    esquema: esquemaConsumo,
    entrada: leerConsumo(fd),
    entidad: "un consumo",
    etiquetas: [],
    mensajeOk: "Consumo registrado.",
    hacer: async (d, { supabase }) => {
      const { data, error } = await supabase.rpc("registrar_consumo", {
        p_cabecera: {
          origen_consumo: d.origen_consumo,
          destino_lote: d.destino_lote,
          area_turno: d.area_turno,
          observacion: d.observacion,
          ocurrido_en: d.ocurrido_en ?? "",
        },
        p_lineas: d.lineas,
      });
      return { error, mensaje: data ? `Consumo registrado: ${lineas(data)}.` : undefined };
    },
  });
}
```

### Paso 6 — El editor de líneas

- [ ] Crear `src/lib/insumos/lineas.ts`, solo tipos (lo importan un componente de cliente y un
      módulo de servidor, así que no puede vivir en ninguno de los dos):

```ts
export type UnidadDeLinea = { id: string; codigo: string; nombre: string };

export type InsumoParaLinea = {
  id: string;
  nombre: string;
  es_perecible: boolean;
  unidades: UnidadDeLinea[];
};
```

- [ ] Crear `src/app/(admin)/admin/insumos/datos-movimiento.ts`:

```ts
import "server-only";

import type { InsumoParaLinea, UnidadDeLinea } from "@/lib/insumos/lineas";
import { crearClienteServidor } from "@/lib/supabase/servidor";

/**
 * Cada insumo con las unidades en que se puede registrar: su unidad base y
 * las de sus equivalencias. Así el selector de unidad nunca ofrece una que la
 * base rechazaría por falta de equivalencia.
 */
export async function insumosParaLineas(): Promise<InsumoParaLinea[]> {
  const supabase = await crearClienteServidor();
  const { data } = await supabase
    .from("insumos")
    .select(
      "id, nombre, es_perecible, base:unidades_medida!unidad_base_id(id, codigo, nombre), equivalencias(unidad:unidades_medida!unidad_desde(id, codigo, nombre))",
    )
    .eq("activo", true)
    .is("deleted_at", null)
    .order("nombre");

  return (data ?? []).map((i) => ({
    id: i.id,
    nombre: i.nombre,
    es_perecible: i.es_perecible,
    unidades: [i.base, ...i.equivalencias.map((e) => e.unidad)].filter(
      (u): u is UnidadDeLinea => u !== null,
    ),
  }));
}

export async function proveedoresActivos() {
  const supabase = await crearClienteServidor();
  const { data } = await supabase
    .from("proveedores")
    .select("id, nombre")
    .is("deleted_at", null)
    .order("nombre");
  return data ?? [];
}
```

> Los alias `base:` y `unidad:` con la columna como pista (`!unidad_base_id`, `!unidad_desde`) son
> necesarios porque `insumos` y `equivalencias` tienen más de una clave hacia `unidades_medida`. Si
> los tipos generados no los reconocen, usar el nombre de la restricción que aparece en
> `Relationships` de `database.types.ts`.

- [ ] Crear `src/components/panel/editor-lineas.tsx`:

```tsx
"use client";

import { Plus, Trash } from "lucide-react";
import { type ReactNode, useEffect, useRef, useState } from "react";

import type { InsumoParaLinea } from "@/lib/insumos/lineas";

import { CLASE_CONTROL } from "./campo";
import { useFormularioPanel } from "./formulario-panel";

type Tipo = "ingreso" | "consumo" | "baja";

export type Linea = {
  insumo_id: string;
  cantidad: string;
  unidad_id: string;
  precio_unitario?: string;
  fecha_vencimiento?: string;
  codigo_lote?: string;
};
type Fila = Linea & { clave: string };

const nueva = (tipo: Tipo): Fila => ({
  clave: crypto.randomUUID(),
  insumo_id: "",
  cantidad: "",
  unidad_id: "",
  ...(tipo === "ingreso" ? { precio_unitario: "", fecha_vencimiento: "", codigo_lote: "" } : {}),
});

/**
 * Las líneas de un ingreso, de un consumo o de una baja. Viajan en un campo
 * oculto con JSON (como las presentaciones de F4) y se restauran desde la copia
 * local por `registrarRestaurable`. Los errores llegan con su línea:
 * `lineas.0.cantidad` (ver `erroresPorCampo`).
 */
export function EditorLineas({
  tipo,
  insumos,
  unaSola = false,
}: {
  tipo: Tipo;
  insumos: InsumoParaLinea[];
  /** La baja pide un solo insumo. */
  unaSola?: boolean;
}) {
  const { errores, registrarRestaurable } = useFormularioPanel();
  const oculto = useRef<HTMLInputElement>(null);
  const [filas, setFilas] = useState<Fila[]>(() => [nueva(tipo)]);

  useEffect(
    () =>
      registrarRestaurable("lineas", (valor) => {
        try {
          const lista = JSON.parse(valor) as Linea[];
          if (lista.length > 0) setFilas(lista.map((l) => ({ ...l, clave: crypto.randomUUID() })));
        } catch {
          // Una copia rota no pisa lo que hay.
        }
      }),
    [registrarRestaurable],
  );

  function cambiar(nuevas: Fila[]) {
    setFilas(nuevas);
    setTimeout(() => oculto.current?.dispatchEvent(new Event("input", { bubbles: true })), 0);
  }

  const actualizar = (clave: string, cambios: Partial<Linea>) =>
    cambiar(filas.map((f) => (f.clave === clave ? { ...f, ...cambios } : f)));

  const valor = JSON.stringify(
    filas.map((f) => ({
      insumo_id: f.insumo_id,
      cantidad: f.cantidad,
      unidad_id: f.unidad_id,
      ...(tipo === "ingreso"
        ? {
            precio_unitario: f.precio_unitario ?? "",
            fecha_vencimiento: f.fecha_vencimiento ?? "",
            codigo_lote: f.codigo_lote ?? "",
          }
        : {}),
    })),
  );
  const errorDe = (i: number, campo: string) => errores[`lineas.${i}.${campo}`]?.[0];

  return (
    <fieldset className="flex flex-col gap-4">
      <legend className="mb-1 font-semibold">{unaSola ? "Insumo" : "Insumos"}</legend>
      <input ref={oculto} type="hidden" name="lineas" value={valor} />
      {filas.map((f, i) => {
        const insumo = insumos.find((x) => x.id === f.insumo_id);
        const n = i + 1;
        return (
          <div
            key={f.clave}
            className="bg-card flex flex-col gap-3 rounded-xl border p-3"
            data-linea={n}
          >
            <ControlLinea
              etiqueta={unaSola ? "Insumo" : `Insumo ${n}`}
              error={errorDe(i, "insumo_id")}
            >
              {(p) => (
                <select
                  {...p}
                  value={f.insumo_id}
                  onChange={(e) => {
                    const elegido = insumos.find((x) => x.id === e.target.value);
                    actualizar(f.clave, {
                      insumo_id: e.target.value,
                      // La unidad del insumo anterior no vale para el nuevo.
                      unidad_id: elegido?.unidades[0]?.id ?? "",
                    });
                  }}
                >
                  <option value="">Elige…</option>
                  {insumos.map((x) => (
                    <option key={x.id} value={x.id}>
                      {x.nombre}
                    </option>
                  ))}
                </select>
              )}
            </ControlLinea>
            <div className="grid grid-cols-2 gap-2">
              <ControlLinea
                etiqueta={`Cantidad ${unaSola ? "" : n}`.trim()}
                error={errorDe(i, "cantidad")}
              >
                {(p) => (
                  <input
                    {...p}
                    inputMode="decimal"
                    value={f.cantidad}
                    onChange={(e) => actualizar(f.clave, { cantidad: e.target.value })}
                  />
                )}
              </ControlLinea>
              <ControlLinea
                etiqueta={`Unidad ${unaSola ? "" : n}`.trim()}
                error={errorDe(i, "unidad_id")}
              >
                {(p) => (
                  <select
                    {...p}
                    value={f.unidad_id}
                    onChange={(e) => actualizar(f.clave, { unidad_id: e.target.value })}
                  >
                    {(insumo?.unidades ?? []).map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.nombre}
                      </option>
                    ))}
                  </select>
                )}
              </ControlLinea>
            </div>
            {tipo === "ingreso" ? (
              <div className="grid grid-cols-2 gap-2">
                <ControlLinea
                  etiqueta={`Precio por unidad ${n} (S/)`}
                  error={errorDe(i, "precio_unitario")}
                >
                  {(p) => (
                    <input
                      {...p}
                      inputMode="decimal"
                      value={f.precio_unitario ?? ""}
                      onChange={(e) => actualizar(f.clave, { precio_unitario: e.target.value })}
                    />
                  )}
                </ControlLinea>
                {insumo?.es_perecible ? (
                  <ControlLinea etiqueta={`Vence ${n}`} error={errorDe(i, "fecha_vencimiento")}>
                    {(p) => (
                      <input
                        {...p}
                        type="date"
                        required
                        value={f.fecha_vencimiento ?? ""}
                        onChange={(e) => actualizar(f.clave, { fecha_vencimiento: e.target.value })}
                      />
                    )}
                  </ControlLinea>
                ) : null}
              </div>
            ) : null}
            {!unaSola && filas.length > 1 ? (
              <button
                type="button"
                className="boton-linea self-end"
                onClick={() => cambiar(filas.filter((x) => x.clave !== f.clave))}
              >
                <Trash aria-hidden className="size-5" /> Quitar la línea {n}
              </button>
            ) : null}
          </div>
        );
      })}
      {errores.lineas?.[0] ? (
        <p role="alert" className="text-destructive text-sm">
          {errores.lineas[0]}
        </p>
      ) : null}
      {!unaSola ? (
        <button
          type="button"
          className="boton-linea self-start"
          onClick={() => cambiar([...filas, nueva(tipo)])}
        >
          <Plus aria-hidden className="size-5" /> Añadir otro insumo
        </button>
      ) : null}
    </fieldset>
  );
}

function ControlLinea({
  etiqueta,
  error,
  children,
}: {
  etiqueta: string;
  error: string | undefined;
  children: (p: {
    id: string;
    className: string;
    "aria-invalid": boolean;
    "aria-describedby"?: string;
  }) => ReactNode;
}) {
  const id = `linea-${etiqueta.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
  return (
    <label className="flex flex-col gap-1 text-sm" htmlFor={id}>
      <span>{etiqueta}</span>
      {children({
        id,
        className: CLASE_CONTROL,
        "aria-invalid": Boolean(error),
        "aria-describedby": error ? `${id}-error` : undefined,
      })}
      {error ? (
        <span id={`${id}-error`} className="text-destructive">
          {error}
        </span>
      ) : null}
    </label>
  );
}
```

> `ControlLinea` genera el `id` a partir de la etiqueta. Las etiquetas llevan el número de línea
> («Cantidad 2»), así que no se repiten en la página y axe no marca `duplicate-id`. Para `unaSola`
> no hay número y hay una sola línea. El formulario no enseña el código de lote (la ficha 7.5 lo
> marcó como no obligatorio): la línea lo manda vacío y la base lo admite así. La RPC ya lo acepta
> por si un día se pide.

### Paso 7 — Las dos pantallas

- [ ] Crear `src/app/(admin)/admin/insumos/ingreso/formulario-ingreso.tsx`:

```tsx
"use client";

import { BarraGuardar } from "@/components/panel/barra-guardar";
import { Campo, Interruptor } from "@/components/panel/campo";
import { EditorLineas } from "@/components/panel/editor-lineas";
import { FormularioPanel } from "@/components/panel/formulario-panel";
import { registrarIngreso } from "@/lib/acciones/movimientos";
import type { InsumoParaLinea } from "@/lib/insumos/lineas";
import { claveDeBorrador } from "@/lib/panel/borrador";
import { validarIngreso } from "@/lib/validaciones/movimiento";

const VOLVER = "/admin/insumos";

export function FormularioIngreso({
  insumos,
  proveedores,
}: {
  insumos: InsumoParaLinea[];
  proveedores: { id: string; nombre: string }[];
}) {
  return (
    <FormularioPanel
      clave={claveDeBorrador("ingreso", null)}
      accion={registrarIngreso}
      validar={validarIngreso}
      destino={() => VOLVER}
    >
      <Campo nombre="proveedor_id" etiqueta="Proveedor">
        {(p) => (
          <select {...p} defaultValue="">
            <option value="">Elige…</option>
            {proveedores.map((pr) => (
              <option key={pr.id} value={pr.id}>
                {pr.nombre}
              </option>
            ))}
          </select>
        )}
      </Campo>
      <div className="grid grid-cols-2 gap-2">
        <Campo nombre="documento_tipo" etiqueta="Documento">
          {(p) => (
            <select {...p} defaultValue="boleta">
              <option value="boleta">Boleta</option>
              <option value="factura">Factura</option>
              <option value="guia">Guía</option>
            </select>
          )}
        </Campo>
        <Campo nombre="documento_numero" etiqueta="Número">
          {(p) => <input {...p} autoComplete="off" />}
        </Campo>
      </div>
      <Campo
        nombre="ocurrido_en"
        etiqueta="Fecha y hora"
        opcional
        ayuda="Déjalo vacío si llegó ahora."
      >
        {(p) => <input {...p} type="datetime-local" />}
      </Campo>
      <EditorLineas tipo="ingreso" insumos={insumos} />
      <Campo nombre="observacion" etiqueta="Observación" ayuda="Cómo llegó: «Todo en buen estado».">
        {(p) => <textarea {...p} rows={2} />}
      </Campo>
      <Interruptor
        nombre="confirmar_repetido"
        etiqueta="Es otro documento aunque el número se repita"
        marcado={false}
      />
      <BarraGuardar volver={VOLVER} />
    </FormularioPanel>
  );
}
```

- [ ] Crear `src/app/(admin)/admin/insumos/ingreso/page.tsx`:

```tsx
import { Suspense } from "react";

import { EncabezadoPanel } from "@/components/panel/encabezado-panel";
import { exigirAcceso } from "@/lib/auth/sesion";

import { insumosParaLineas, proveedoresActivos } from "../datos-movimiento";
import { FormularioIngreso } from "./formulario-ingreso";

export default function RegistrarIngreso() {
  return (
    <>
      <EncabezadoPanel
        titulo="Registrar ingreso"
        descripcion="Lo que llegó con una boleta, factura o guía."
        volver={{ ruta: "/admin/insumos", nombre: "Insumos" }}
      />
      <Suspense fallback={<p className="text-muted-foreground text-sm">Cargando…</p>}>
        <Formulario />
      </Suspense>
    </>
  );
}

async function Formulario() {
  await exigirAcceso("/admin/insumos/ingreso");
  const [insumos, proveedores] = await Promise.all([insumosParaLineas(), proveedoresActivos()]);
  return <FormularioIngreso insumos={insumos} proveedores={proveedores} />;
}
```

- [ ] Crear `src/app/(admin)/admin/insumos/consumo/formulario-consumo.tsx`:

```tsx
"use client";

import { BarraGuardar } from "@/components/panel/barra-guardar";
import { Campo } from "@/components/panel/campo";
import { EditorLineas } from "@/components/panel/editor-lineas";
import { FormularioPanel } from "@/components/panel/formulario-panel";
import { registrarConsumo } from "@/lib/acciones/movimientos";
import type { InsumoParaLinea } from "@/lib/insumos/lineas";
import { claveDeBorrador } from "@/lib/panel/borrador";
import { validarConsumo } from "@/lib/validaciones/movimiento";

const VOLVER = "/admin/insumos";

export function FormularioConsumo({ insumos }: { insumos: InsumoParaLinea[] }) {
  return (
    <FormularioPanel
      clave={claveDeBorrador("consumo", null)}
      accion={registrarConsumo}
      validar={validarConsumo}
      destino={() => VOLVER}
    >
      <Campo nombre="origen_consumo" etiqueta="Cómo salió">
        {(p) => (
          <select {...p} defaultValue="produccion">
            <option value="produccion">Para producción</option>
            <option value="retiro_directo">Retiro directo del almacén</option>
          </select>
        )}
      </Campo>
      <Campo
        nombre="destino_lote"
        etiqueta="Para qué"
        ayuda="Por ejemplo: Pan francés, 2.ª hornada"
      >
        {(p) => <input {...p} autoComplete="off" />}
      </Campo>
      <Campo nombre="area_turno" etiqueta="Área o turno" ayuda="Por ejemplo: Mañana">
        {(p) => <input {...p} autoComplete="off" />}
      </Campo>
      <Campo
        nombre="ocurrido_en"
        etiqueta="Fecha y hora"
        opcional
        ayuda="Déjalo vacío si es ahora."
      >
        {(p) => <input {...p} type="datetime-local" />}
      </Campo>
      <EditorLineas tipo="consumo" insumos={insumos} />
      <Campo nombre="observacion" etiqueta="Observación">
        {(p) => <textarea {...p} rows={2} />}
      </Campo>
      <BarraGuardar volver={VOLVER} />
    </FormularioPanel>
  );
}
```

- [ ] Crear `src/app/(admin)/admin/insumos/consumo/page.tsx` igual que la de ingreso: título
      «Registrar consumo», descripción «Lo que salió del almacén hoy.»,
      `exigirAcceso("/admin/insumos/consumo")` y `<FormularioConsumo insumos={await insumosParaLineas()} />`:

```tsx
import { Suspense } from "react";

import { EncabezadoPanel } from "@/components/panel/encabezado-panel";
import { exigirAcceso } from "@/lib/auth/sesion";

import { insumosParaLineas } from "../datos-movimiento";
import { FormularioConsumo } from "./formulario-consumo";

export default function RegistrarConsumo() {
  return (
    <>
      <EncabezadoPanel
        titulo="Registrar consumo"
        descripcion="Lo que salió del almacén hoy."
        volver={{ ruta: "/admin/insumos", nombre: "Insumos" }}
      />
      <Suspense fallback={<p className="text-muted-foreground text-sm">Cargando…</p>}>
        <Formulario />
      </Suspense>
    </>
  );
}

async function Formulario() {
  await exigirAcceso("/admin/insumos/consumo");
  return <FormularioConsumo insumos={await insumosParaLineas()} />;
}
```

- [ ] En `src/app/(admin)/admin/insumos/page.tsx`, llenar `REGISTRAR`:

```ts
const REGISTRAR: ReadonlyArray<{ ruta: string; nombre: string; soloAdministracion?: boolean }> = [
  { ruta: "/admin/insumos/ingreso", nombre: "Registrar ingreso" },
  { ruta: "/admin/insumos/consumo", nombre: "Registrar consumo" },
];
```

### Paso 8 — Pruebas de navegador

- [ ] Añadir a `RUTAS_DEL_PANEL`: `"/admin/insumos/ingreso"`, `"/admin/insumos/consumo"`.

- [ ] Crear `e2e/panel-movimientos.spec.ts`:

```ts
import { expect, test } from "@playwright/test";

import { entrarComo } from "./ayudas/sesion";
import { borrarUsuario } from "./ayudas/usuarios";

// Escribe en la harina y el azúcar de la semilla: un solo proyecto, para que
// móvil y escritorio no se pisen el saldo (trampa de CLAUDE.md).
test.beforeEach(({}, info) => {
  test.skip(info.project.name !== "movil", "escribe en insumos compartidos");
});

async function saldoDe(page: import("@playwright/test").Page, nombre: string): Promise<string> {
  await page.goto(`/admin/insumos?buscar=${encodeURIComponent(nombre)}`);
  const tarjeta = page
    .getByRole("list", { name: "Existencias de insumos" })
    .getByRole("listitem")
    .filter({ hasText: nombre })
    .first();
  return (await tarjeta.innerText()).replace(/\s+/g, " ");
}

test("un ingreso de dos líneas sube el saldo y un consumo lo baja", async ({ page }) => {
  const usuario = await entrarComo(page, "ingeniero");
  const boleta = `E2E-${Date.now()}`;
  try {
    await page.goto("/admin/insumos/ingreso");
    await page.getByLabel("Proveedor").selectOption({ label: "Comercial FOX" });
    await page.getByLabel("Número").fill(boleta);
    await page.getByLabel("Insumo 1").selectOption({ label: "Azúcar" });
    await page.getByLabel("Cantidad 1").fill("1");
    await page.getByLabel("Unidad 1").selectOption({ label: "Saco" });
    await page.getByLabel("Precio por unidad 1 (S/)").fill("120,50");
    await page.getByRole("button", { name: "Añadir otro insumo" }).click();
    await page.getByLabel("Insumo 2").selectOption({ label: "Sal" });
    await page.getByLabel("Cantidad 2").fill("2");
    await page.getByLabel("Unidad 2").selectOption({ label: "Kilogramo" });
    await page.getByLabel("Precio por unidad 2 (S/)").fill("2");
    await page.getByLabel("Observación").fill("Todo en buen estado");
    await page.getByRole("button", { name: "Guardar" }).click();
    await page.waitForURL("/admin/insumos");

    const antes = await saldoDe(page, "Azúcar");
    expect(antes).toMatch(/\d+ kg/);

    await page.goto("/admin/insumos/consumo");
    await page.getByLabel("Para qué").fill("Pan dulce");
    await page.getByLabel("Área o turno").fill("Mañana");
    await page.getByLabel("Insumo 1").selectOption({ label: "Azúcar" });
    await page.getByLabel("Cantidad 1").fill("5");
    await page.getByLabel("Unidad 1").selectOption({ label: "Kilogramo" });
    await page.getByLabel("Observación").fill("Prueba E2E");
    await page.getByRole("button", { name: "Guardar" }).click();
    await page.waitForURL("/admin/insumos");

    const kilos = (texto: string) => Number(/([\d.]+) kg/.exec(texto)?.[1]);
    expect(kilos(await saldoDe(page, "Azúcar"))).toBe(kilos(antes) - 5);

    // El mismo documento otra vez: avisa y no registra.
    await page.goto("/admin/insumos/ingreso");
    await page.getByLabel("Proveedor").selectOption({ label: "Comercial FOX" });
    await page.getByLabel("Número").fill(boleta);
    await page.getByLabel("Insumo 1").selectOption({ label: "Azúcar" });
    await page.getByLabel("Cantidad 1").fill("1");
    await page.getByLabel("Precio por unidad 1 (S/)").fill("120");
    await page.getByLabel("Observación").fill("Repetida");
    await page.getByRole("button", { name: "Guardar" }).click();
    await expect(page.getByText(/ya se registró el/)).toBeVisible();
  } finally {
    await borrarUsuario(usuario.id);
  }
});

test("un consumo que no alcanza dice cuánto hay", async ({ page }) => {
  const usuario = await entrarComo(page, "ingeniero");
  try {
    await page.goto("/admin/insumos/consumo");
    await page.getByLabel("Para qué").fill("Prueba");
    await page.getByLabel("Área o turno").fill("Tarde");
    await page.getByLabel("Insumo 1").selectOption({ label: "Ajonjolí" });
    await page.getByLabel("Cantidad 1").fill("99999");
    await page.getByLabel("Observación").fill("Prueba E2E");
    await page.getByRole("button", { name: "Guardar" }).click();
    await expect(page.getByText(/Solo hay .* de Ajonjolí/)).toBeVisible();
  } finally {
    await borrarUsuario(usuario.id);
  }
});
```

> `borrarUsuario` falla en silencio para un usuario con movimientos: `responsable_id` no deja
> borrarlo (0012, `on delete restrict`), y es lo correcto, porque el kárdex no pierde a su autor. En
> local y en el CI quedan esas cuentas de prueba, que el siguiente `db reset` limpia.

- [ ] Crear `e2e/insumos-concurrencia.spec.ts`. Es la primera prueba del plan que habla con la base
      **sin navegador**: dos sesiones reales consumen a la vez y se mira qué pasa.

```ts
import { createClient } from "@supabase/supabase-js";
import { expect, test } from "@playwright/test";

import { supabaseLocal } from "./ayudas/supabase-local";
import { crearUsuario } from "./ayudas/usuarios";

test.beforeEach(({}, info) => {
  test.skip(info.project.name !== "movil", "no depende del tamaño de pantalla");
});

async function sesion(rol: string) {
  const { apiUrl, anonKey } = supabaseLocal();
  const usuario = await crearUsuario(rol);
  const cliente = createClient(apiUrl, anonKey, { auth: { persistSession: false } });
  const { error } = await cliente.auth.signInWithPassword({
    email: usuario.correo,
    password: usuario.clave,
  });
  if (error) throw new Error(`No se pudo entrar: ${error.message}`);
  return cliente;
}

test("dos consumos a la vez del mismo insumo: uno entra, el otro dice cuánto queda", async () => {
  const administracion = await sesion("administrador");
  const [uno, otro] = await Promise.all([sesion("ingeniero"), sesion("ingeniero")]);

  const { data: kg } = await administracion
    .from("unidades_medida")
    .select("id")
    .eq("codigo", "kg")
    .single();
  const { data: insumoId, error: errorInsumo } = await administracion.rpc("guardar_insumo", {
    p_insumo: {
      nombre: `Concurrencia ${Date.now()}`,
      unidad_base_id: kg!.id,
      stock_minimo: "0",
      es_perecible: false,
    },
    p_equivalencias: [],
  });
  expect(errorInsumo).toBeNull();

  const { error: errorAjuste } = await administracion.from("movimientos_insumo").insert({
    tipo: "ajuste",
    sentido: 1,
    insumo_id: insumoId!,
    cantidad: 10,
    unidad_id: kg!.id,
    observacion: "Prueba de concurrencia",
  });
  expect(errorAjuste).toBeNull();

  const consumir = (cliente: typeof uno) =>
    cliente.rpc("registrar_consumo", {
      p_cabecera: {
        origen_consumo: "produccion",
        destino_lote: "Prueba",
        area_turno: "Mañana",
        observacion: "Carrera",
      },
      p_lineas: [{ insumo_id: insumoId, cantidad: "7", unidad_id: kg!.id }],
    });

  const [a, b] = await Promise.all([consumir(uno), consumir(otro)]);
  const errores = [a.error, b.error].filter((e) => e !== null);

  expect(errores, "exactamente uno de los dos tiene que fallar").toHaveLength(1);
  expect(errores[0]!.message).toMatch(/^Solo hay 3 kg de Concurrencia/);

  const { data: saldo } = await administracion
    .from("saldos_insumo")
    .select("cantidad_base")
    .eq("insumo_id", insumoId!)
    .single();
  expect(Number(saldo!.cantidad_base)).toBe(3);
});
```

> Se comprueba antes de confiar en ella: quitar temporalmente `for update of s` de 0034 en la base
> local (`create or replace function app.repartir_en_lotes() ...` sin esa línea), correr la prueba y
> verla fallar al menos una vez de cada diez (`--repeat-each=10`); después `supabase db reset` para
> volver a la versión buena. Si nunca falla sin el cerrojo, la prueba no está midiendo la carrera y
> hay que abrir más la ventana (por ejemplo, con cinco consumos de 3 kg en vez de dos de 7).

- [ ] `pnpm build` y, con el puerto 3000 libre:
      `pnpm exec playwright test e2e/panel-movimientos.spec.ts e2e/insumos-concurrencia.spec.ts e2e/panel-accesibilidad.spec.ts`
      → verde.

### Paso 9 — Cerrar la tarea

- [ ] `pnpm typecheck && pnpm lint && pnpm format:check && pnpm test` sin avisos.
- [ ] Probar a 375 px en la vista previa: una boleta de tres líneas con un perecible (el campo
      «Vence» aparece solo en esa línea), recargar a medias y recuperar la copia local.
- [ ] Commit y PR; Dan aplica 0036 con `db push` antes de fusionar:

```bash
git add src/lib/insumos/lineas.ts supabase/migrations/0036_registrar_movimientos.sql supabase/tests/0036_registrar_movimientos.test.sql \
        src/tipos/database.types.ts src/lib/validaciones/movimiento.ts src/lib/validaciones/movimiento.test.ts \
        src/lib/panel/hora-lima.ts src/lib/panel/hora-lima.test.ts src/lib/panel/errores.ts \
        src/lib/panel/errores.test.ts src/lib/acciones/movimientos.ts src/components/panel/editor-lineas.tsx \
        "src/app/(admin)/admin/insumos" e2e/panel-movimientos.spec.ts e2e/insumos-concurrencia.spec.ts \
        e2e/panel-accesibilidad.spec.ts
git commit -m "feat(insumos): registrar ingresos y consumos de varias líneas"
```

---

## Tarea 4 — Ficha del insumo, kárdex, anular y conteo físico

**Rama:** `feat/f5-t4-kardex-conteo`

**Qué deja hecho:** cada insumo tiene su **ficha**: cuánto hay, los lotes con existencia (vence,
queda y costo) y el **kárdex** del periodo con el saldo después de cada movimiento. La
administración puede **anular** un movimiento, que queda tachado con su motivo, y hacer un
**conteo físico**, que sirve también para cargar el **inventario inicial** el primer día.

**Archivos:**

- Crear: `supabase/migrations/0037_conteo_y_anulacion.sql` + `supabase/tests/0037_conteo_y_anulacion.test.sql`
- Crear: `src/lib/insumos/periodo.ts` + `.test.ts`, `src/lib/insumos/kardex.ts` + `.test.ts`
- Crear: `src/lib/validaciones/conteo.ts` + `.test.ts`, `src/lib/acciones/kardex.ts`
- Crear: `src/components/panel/anular-movimiento.tsx`
- Crear: `src/app/(admin)/admin/insumos/[id]/page.tsx`, `conteo/page.tsx`, `conteo/formulario-conteo.tsx`
- Modificar: `src/app/(admin)/admin/insumos/page.tsx` (enlace a la ficha y `REGISTRAR`)
- Crear: `e2e/panel-kardex.spec.ts`. Modificar: `e2e/panel-accesibilidad.spec.ts`

**Interfaces:**

- Consume (T1): `anula_a`, `sentido`, `movimiento_lotes`, `saldos_lote`, `app.formatear_cantidad`.
  (T2): `existencias_insumo`, `describirExistencia`, `presentacionPrincipal`, `cantidadOCero`,
  `precioOpcional`, `RUTA_INSUMOS`. (T3): `formatearFechaLima`.
- Produce:
  - `public.registrar_conteo(p_lineas jsonb, p_observacion text) returns integer`: cuántos ajustes
    creó.
  - `public.anular_movimiento(p_id uuid, p_motivo text) returns uuid`
  - `public.kardex_insumo(p_insumo uuid, p_desde date, p_hasta date)`, con filas
    `(id, ocurrido_en, tipo, sentido, cantidad, unidad, cantidad_base, saldo, costo, proveedor,
documento, destino_lote, area_turno, motivo_baja, observacion, responsable, anulado, anula_a)`
  - `app.nombre_de_persona(uuid) returns text`
  - `src/lib/insumos/periodo.ts`: `hoyEnLima(ahora: Date): string` («2026-10-12»),
    `sumarDias(fecha: string, dias: number): string`, `type Periodo = { desde: string; hasta: string }`,
    `leerPeriodo(params: { desde?: unknown; hasta?: unknown }, ahora: Date, diasPorDefecto: number): Periodo`
  - `src/lib/insumos/kardex.ts`: `NOMBRE_TIPO`, `NOMBRE_MOTIVO`, `detalleDeMovimiento(fila)`
    (T5 y T6 usan `NOMBRE_MOTIVO`)

### Paso 1 — La base

- [ ] Crear `supabase/tests/0037_conteo_y_anulacion.test.sql`:

```sql
-- Verifica registrar_conteo, anular_movimiento y kardex_insumo (0037).
begin;
select plan(15);

insert into auth.users (id, email, created_at, updated_at) values
  ('22222222-2222-2222-2222-222222222222', 'admin@pimpos.test', now(), now()),
  ('33333333-3333-3333-3333-333333333333', 'inge@pimpos.test',  now(), now());
update public.perfiles set rol = 'administrador', activo = true, nombre_completo = 'Debra Prueba'
 where id = '22222222-2222-2222-2222-222222222222';
update public.perfiles set rol = 'ingeniero', activo = true, nombre_completo = 'Marcos Prueba'
 where id = '33333333-3333-3333-3333-333333333333';

create temp table ref as
select
  (select id from public.insumos where nombre = 'Mejorador') as mejorador,
  (select id from public.insumos where nombre = 'Levadura')  as levadura,
  (select id from public.insumos where nombre = 'Sal')       as sal,
  (select id from public.unidades_medida where codigo = 'kg') as kg;
create temp table t (clave text primary key, valor uuid);
grant select on ref to authenticated;
grant all on t to authenticated;

select has_function('public', 'registrar_conteo', array['jsonb', 'text'], 'existe registrar_conteo');
select has_function('public', 'kardex_insumo', array['uuid', 'date', 'date'], 'existe kardex_insumo');

-- ---------------------------------------------------------------------------
-- Conteo: el inventario inicial
-- ---------------------------------------------------------------------------
set local role authenticated;
set local request.jwt.claims = '{"sub": "22222222-2222-2222-2222-222222222222", "rol": "administrador"}';

select is(
  public.registrar_conteo(
    jsonb_build_array(
      jsonb_build_object('insumo_id', (select mejorador from ref), 'contado', '12', 'precio_unitario', '8.50'),
      jsonb_build_object('insumo_id', (select sal from ref), 'contado', '0')),
    'Inventario inicial'),
  1, 'un conteo solo registra ajustes donde hay diferencia (la sal ya estaba en 0)'
);
select is(
  (select cantidad_base from public.saldos_insumo where insumo_id = (select mejorador from ref)),
  12.0::numeric(14,4), 'el mejorador queda en lo contado'
);
select is(
  (select l.costo_unitario from public.lotes_insumo l where l.insumo_id = (select mejorador from ref)),
  8.500000::numeric(14,6), 'con el precio que se escribió'
);
select is(
  public.registrar_conteo(
    jsonb_build_array(jsonb_build_object('insumo_id', (select mejorador from ref), 'contado', '9')),
    'Conteo semanal'),
  1, 'contar menos de lo que hay registra una salida'
);
select is(
  (select sentido from public.movimientos_insumo
    where insumo_id = (select mejorador from ref) order by secuencia desc limit 1),
  -1::smallint, 'de 3 kg'
);
select throws_ok($$
  select public.registrar_conteo(
    jsonb_build_array(jsonb_build_object('insumo_id', (select levadura from ref), 'contado', '4')),
    'Inventario inicial')
$$, '23514', null, 'la levadura vence: un conteo que la sube necesita fecha');

-- ---------------------------------------------------------------------------
-- Anular
-- ---------------------------------------------------------------------------
insert into t select 'salida', id from public.movimientos_insumo
 where insumo_id = (select mejorador from ref) and sentido = -1;
insert into t select 'anulacion', public.anular_movimiento((select valor from t where clave = 'salida'), 'Se contó mal');
select is(
  (select cantidad_base from public.saldos_insumo where insumo_id = (select mejorador from ref)),
  12.0::numeric(14,4), 'anular la salida devuelve los 3 kg'
);

-- ---------------------------------------------------------------------------
-- Kárdex
-- ---------------------------------------------------------------------------
-- Un consumo a las 23:30 de Iquitos del día anterior (04:30 UTC de hoy) cuenta
-- en el día de Iquitos, no en el de UTC.
reset role;
insert into public.movimientos_insumo
  (tipo, insumo_id, cantidad, unidad_id, responsable_id, origen_consumo, destino_lote, area_turno, ocurrido_en)
select 'consumo', mejorador, 1, kg, '33333333-3333-3333-3333-333333333333', 'produccion', 'Pan', 'Noche',
       ((now() at time zone 'America/Lima')::date - 1 + time '23:30') at time zone 'America/Lima'
from ref;

set local role authenticated;
set local request.jwt.claims = '{"sub": "33333333-3333-3333-3333-333333333333", "rol": "ingeniero"}';

select is(
  (select count(*)::int from public.kardex_insumo(
     (select mejorador from ref),
     (now() at time zone 'America/Lima')::date - 1,
     (now() at time zone 'America/Lima')::date - 1)),
  1, 'el consumo de las 23:30 cae en el día anterior de Iquitos'
);
select is(
  (select saldo from public.kardex_insumo(
     (select mejorador from ref),
     (now() at time zone 'America/Lima')::date - 1,
     (now() at time zone 'America/Lima')::date - 1)),
  -1::numeric,
  'y su saldo parte de lo que había antes del periodo (nada, ese día): 0 - 1'
);
select is(
  (select array_agg(saldo order by ocurrido_en)
     from public.kardex_insumo((select mejorador from ref),
                               (now() at time zone 'America/Lima')::date,
                               (now() at time zone 'America/Lima')::date)),
  array[11, 8, 11]::numeric[],
  'hoy: parte de -1 (ayer), +12 del inventario, -3 del conteo y +3 de la anulación'
);
select is(
  (select bool_and(anulado) from public.kardex_insumo((select mejorador from ref),
     (now() at time zone 'America/Lima')::date, (now() at time zone 'America/Lima')::date)
   where id = (select valor from t where clave = 'salida')),
  true, 'la salida anulada se marca como anulada'
);
select is(
  (select responsable from public.kardex_insumo((select mejorador from ref),
     (now() at time zone 'America/Lima')::date, (now() at time zone 'America/Lima')::date)
   where id = (select valor from t where clave = 'salida')),
  'Debra Prueba', 'el ingeniero ve el nombre de quien la registró'
);
select throws_ok($$
  select public.registrar_conteo(
    jsonb_build_array(jsonb_build_object('insumo_id', (select mejorador from ref), 'contado', '50')),
    'Intento')
$$, '42501', null, 'el ingeniero no cuenta');
reset role;

select * from finish();
rollback;
```

> **Qué fijan las pruebas del kárdex.** El consumo de «ayer» se registra **después** del conteo de
> hoy, con la fecha atrasada, y sale de los 12 kg contados hoy. El kárdex ordena por `ocurrido_en`,
> no por orden de registro, así que ese día enseña un saldo de −1, y hoy parte de −1. Es lo que
> dice el registro tal como se hizo. El saldo actual (`saldos_insumo`) es siempre el correcto: 11.
> **Decisión:** el kárdex no esconde ni recalcula ese negativo histórico. Si aparece, es la señal
> de que alguien registró tarde un consumo, y el conteo siguiente lo explica.

- [ ] `supabase test db` → FALLA `0037`.

- [ ] Crear `supabase/migrations/0037_conteo_y_anulacion.sql`:

```sql
-- =============================================================================
-- 0037_conteo_y_anulacion.sql
-- Conteo físico, anulación y el kárdex de un insumo (F5, tarea 4).
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Un nombre para enseñar. `perfiles` solo deja ver el propio al ingeniero
-- (0003), y el kárdex tiene que decir quién registró cada cosa.
-- -----------------------------------------------------------------------------
create or replace function app.nombre_de_persona(p_id uuid)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select nombre_completo from public.perfiles where id = p_id;
$$;
revoke execute on function app.nombre_de_persona(uuid) from public, anon;
grant execute on function app.nombre_de_persona(uuid) to authenticated;

-- -----------------------------------------------------------------------------
-- Conteo físico
--
-- p_lineas: [{ insumo_id, contado (texto, en la unidad base), precio_unitario?,
--              fecha_vencimiento? }]
--
-- `security definer` para poder bloquear el saldo mientras se compara (el
-- rol `authenticated` no tiene UPDATE sobre saldos_insumo, y `for update` lo
-- exige). Por eso la comprobación de rol va escrita aquí: sin ella, cualquiera
-- podría ajustar pasando por la función.
-- -----------------------------------------------------------------------------
create or replace function public.registrar_conteo(p_lineas jsonb, p_observacion text)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_item    jsonb;
  v_actual  numeric(14,4);
  v_contado numeric(14,4);
  v_dif     numeric(14,4);
  v_lote    uuid;
  v_n       integer := 0;
begin
  if not (select app.es_rol('superadmin', 'administrador')) then
    raise exception 'Solo la administración registra conteos.' using errcode = '42501';
  end if;
  if length(btrim(coalesce(p_observacion, ''))) = 0 then
    raise exception 'Escribe por qué se contó, por ejemplo «Inventario inicial».' using errcode = 'P0001';
  end if;

  for v_item in select value from jsonb_array_elements(p_lineas)
  loop
    v_contado := (v_item ->> 'contado')::numeric(14,4);
    select s.cantidad_base into v_actual
      from public.saldos_insumo s
     where s.insumo_id = (v_item ->> 'insumo_id')::uuid
       and s.almacen_id = app.almacen_principal()
       for update;
    v_dif := v_contado - coalesce(v_actual, 0);
    continue when v_dif = 0;

    v_lote := null;
    if v_dif > 0 and nullif(v_item ->> 'fecha_vencimiento', '') is not null then
      insert into public.lotes_insumo (insumo_id, fecha_vencimiento)
      values ((v_item ->> 'insumo_id')::uuid, (v_item ->> 'fecha_vencimiento')::date)
      returning id into v_lote;
    end if;

    insert into public.movimientos_insumo
      (tipo, sentido, insumo_id, lote_id, cantidad, unidad_id, precio_unitario, observacion)
    select 'ajuste', sign(v_dif)::smallint, i.id, v_lote, abs(v_dif), i.unidad_base_id,
           case when v_dif > 0 then nullif(v_item ->> 'precio_unitario', '')::numeric(12,4) end,
           btrim(p_observacion)
      from public.insumos i
     where i.id = (v_item ->> 'insumo_id')::uuid;
    v_n := v_n + 1;
  end loop;

  return v_n;
end;
$$;
comment on function public.registrar_conteo(jsonb, text) is
  'Conteo físico: registra un ajuste por cada insumo cuyo saldo no coincide con lo contado. Solo administración.';
revoke execute on function public.registrar_conteo(jsonb, text) from public, anon;
grant execute on function public.registrar_conteo(jsonb, text) to authenticated;

-- -----------------------------------------------------------------------------
-- Anular. `security invoker`: la política de 0034 ya dice que solo la
-- administración inserta anulaciones.
-- -----------------------------------------------------------------------------
create or replace function public.anular_movimiento(p_id uuid, p_motivo text)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_id uuid;
begin
  insert into public.movimientos_insumo (tipo, anula_a, insumo_id, cantidad, unidad_id, observacion)
  select 'anulacion', m.id, m.insumo_id, m.cantidad, m.unidad_id, nullif(btrim(p_motivo), '')
    from public.movimientos_insumo m
   where m.id = p_id
  returning id into v_id;
  if v_id is null then
    raise exception 'No se encontró el movimiento que quieres anular.' using errcode = 'P0001';
  end if;
  return v_id;
end;
$$;
revoke execute on function public.anular_movimiento(uuid, text) from public, anon;
grant execute on function public.anular_movimiento(uuid, text) to authenticated;

-- -----------------------------------------------------------------------------
-- El kárdex de un insumo, en días de Iquitos, con el saldo después de cada
-- movimiento. El saldo parte de lo acumulado antes del periodo.
-- -----------------------------------------------------------------------------
create or replace function public.kardex_insumo(p_insumo uuid, p_desde date, p_hasta date)
returns table (
  id            uuid,
  ocurrido_en   timestamptz,
  tipo          text,
  sentido       smallint,
  cantidad      numeric,
  unidad        text,
  cantidad_base numeric,
  saldo         numeric,
  costo         numeric,
  proveedor     text,
  documento     text,
  destino_lote  text,
  area_turno    text,
  motivo_baja   text,
  observacion   text,
  responsable   text,
  anulado       boolean,
  anula_a       uuid
)
language sql
stable
security invoker
set search_path = ''
as $$
  with previo as (
    select coalesce(sum(m.sentido * m.cantidad_base), 0) as saldo
      from public.movimientos_insumo m
     where m.insumo_id = p_insumo
       and (m.ocurrido_en at time zone 'America/Lima')::date < p_desde
  )
  select
    m.id,
    m.ocurrido_en,
    m.tipo::text,
    m.sentido,
    m.cantidad,
    u.codigo,
    m.cantidad_base,
    (select saldo from previo)
      + sum(m.sentido * m.cantidad_base) over (order by m.ocurrido_en, m.secuencia),
    (select sum(ml.cantidad_base * ml.costo_unitario) from public.movimiento_lotes ml where ml.movimiento_id = m.id),
    p.nombre,
    nullif(concat_ws(' ', m.documento_tipo, m.documento_numero), ''),
    m.destino_lote,
    m.area_turno,
    m.motivo_baja::text,
    m.observacion,
    app.nombre_de_persona(m.responsable_id),
    exists (select 1 from public.movimientos_insumo a where a.anula_a = m.id),
    m.anula_a
  from public.movimientos_insumo m
  join public.unidades_medida u on u.id = m.unidad_id
  left join public.proveedores p on p.id = m.proveedor_id
  where m.insumo_id = p_insumo
    and (m.ocurrido_en at time zone 'America/Lima')::date between p_desde and p_hasta
  order by m.ocurrido_en, m.secuencia;
$$;
comment on function public.kardex_insumo(uuid, date, date) is
  'Movimientos de un insumo entre dos días de Iquitos, con el saldo acumulado después de cada uno.';
revoke execute on function public.kardex_insumo(uuid, date, date) from public, anon;
grant execute on function public.kardex_insumo(uuid, date, date) to authenticated;
```

- [ ] `supabase db reset && supabase test db` → todo en verde. Después
      `bash supabase/seeds/imagenes/subir-imagenes.sh` y `pnpm supabase:tipos`.

### Paso 2 — Periodo y detalle del kárdex, lógica pura

- [ ] Crear `src/lib/insumos/periodo.test.ts`:

```ts
import { describe, expect, it } from "vitest";

import { hoyEnLima, leerPeriodo, sumarDias } from "./periodo";

// 12/10/2026 a las 02:00 en UTC son las 21:00 del 11/10 en Iquitos.
const AHORA = new Date("2026-10-12T02:00:00.000Z");

describe("hoyEnLima", () => {
  it("es el día de Iquitos, no el de UTC", () => {
    expect(hoyEnLima(AHORA)).toBe("2026-10-11");
  });
});

describe("sumarDias", () => {
  it("cruza meses", () => {
    expect(sumarDias("2026-10-01", -1)).toBe("2026-09-30");
    expect(sumarDias("2026-10-11", -29)).toBe("2026-09-12");
  });
});

describe("leerPeriodo", () => {
  it("sin parámetros, los últimos N días hasta hoy", () => {
    expect(leerPeriodo({}, AHORA, 30)).toEqual({ desde: "2026-09-12", hasta: "2026-10-11" });
  });

  it("respeta fechas válidas", () => {
    expect(leerPeriodo({ desde: "2026-10-01", hasta: "2026-10-07" }, AHORA, 30)).toEqual({
      desde: "2026-10-01",
      hasta: "2026-10-07",
    });
  });

  it("si vienen al revés, las ordena", () => {
    expect(leerPeriodo({ desde: "2026-10-07", hasta: "2026-10-01" }, AHORA, 30)).toEqual({
      desde: "2026-10-01",
      hasta: "2026-10-07",
    });
  });

  it("ignora lo que no es una fecha", () => {
    expect(leerPeriodo({ desde: "ayer", hasta: ["x"] }, AHORA, 7)).toEqual({
      desde: "2026-10-05",
      hasta: "2026-10-11",
    });
  });
});
```

- [ ] Crear `src/lib/insumos/kardex.test.ts`:

```ts
import { describe, expect, it } from "vitest";

import { detalleDeMovimiento } from "./kardex";

const vacio = {
  tipo: "ingreso",
  proveedor: null,
  documento: null,
  destino_lote: null,
  area_turno: null,
  motivo_baja: null,
  observacion: null,
};

describe("detalleDeMovimiento", () => {
  it("un ingreso dice de quién y con qué documento", () => {
    expect(
      detalleDeMovimiento({ ...vacio, proveedor: "Comercial FOX", documento: "boleta B001-123" }),
    ).toBe("Comercial FOX · boleta B001-123");
  });

  it("un consumo dice para qué y en qué turno", () => {
    expect(
      detalleDeMovimiento({
        ...vacio,
        tipo: "consumo",
        destino_lote: "Pan francés",
        area_turno: "Mañana",
      }),
    ).toBe("Pan francés · Mañana");
  });

  it("una baja dice el motivo en palabras", () => {
    expect(
      detalleDeMovimiento({ ...vacio, tipo: "baja", motivo_baja: "devolucion_proveedor" }),
    ).toBe("Devolución al proveedor");
  });

  it("un ajuste y una anulación dicen su explicación", () => {
    expect(
      detalleDeMovimiento({ ...vacio, tipo: "ajuste", observacion: "Inventario inicial" }),
    ).toBe("Inventario inicial");
    expect(detalleDeMovimiento({ ...vacio, tipo: "anulacion", observacion: "Se contó mal" })).toBe(
      "Anula un registro: Se contó mal",
    );
  });
});
```

- [ ] `pnpm test -- src/lib/insumos/` → FALLAN.

- [ ] Crear `src/lib/insumos/periodo.ts`:

```ts
/**
 * Periodos en días de Iquitos. La base filtra con
 * `(ocurrido_en at time zone 'America/Lima')::date`, así que aquí basta con
 * hablar en fechas «2026-10-12», sin hora.
 */
export type Periodo = { desde: string; hasta: string };

const FECHA = /^\d{4}-\d{2}-\d{2}$/;
const CINCO_HORAS_MS = 5 * 60 * 60 * 1000;

export function hoyEnLima(ahora: Date): string {
  return new Date(ahora.getTime() - CINCO_HORAS_MS).toISOString().slice(0, 10);
}

export function sumarDias(fecha: string, dias: number): string {
  const d = new Date(`${fecha}T12:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() + dias);
  return d.toISOString().slice(0, 10);
}

const fechaValida = (v: unknown): v is string =>
  typeof v === "string" && FECHA.test(v) && !Number.isNaN(new Date(`${v}T12:00:00Z`).getTime());

/** Desde `searchParams`. Sin fechas válidas, los últimos `diasPorDefecto` días hasta hoy. */
export function leerPeriodo(
  params: { desde?: unknown; hasta?: unknown },
  ahora: Date,
  diasPorDefecto: number,
): Periodo {
  const hoy = hoyEnLima(ahora);
  const hasta = fechaValida(params.hasta) ? params.hasta : hoy;
  const desde = fechaValida(params.desde) ? params.desde : sumarDias(hasta, -(diasPorDefecto - 1));
  return desde <= hasta ? { desde, hasta } : { desde: hasta, hasta: desde };
}
```

> Ojo con la prueba «ignora lo que no es una fecha»: con `hasta` inválido se usa hoy (11/10) y
> `desde` = 11/10 − 6 = 05/10. Coincide con lo escrito en la prueba.

- [ ] Crear `src/lib/insumos/kardex.ts`:

```ts
export const NOMBRE_TIPO: Readonly<Record<string, string>> = {
  ingreso: "Ingreso",
  consumo: "Consumo",
  baja: "Baja",
  ajuste: "Conteo",
  anulacion: "Anulación",
};

export const NOMBRE_MOTIVO: Readonly<Record<string, string>> = {
  merma: "Merma o desperdicio",
  vencimiento: "Vencimiento",
  danado: "Producto dañado",
  devolucion_proveedor: "Devolución al proveedor",
  consumo_interno: "Consumo del personal",
};

type FilaKardex = {
  tipo: string;
  proveedor: string | null;
  documento: string | null;
  destino_lote: string | null;
  area_turno: string | null;
  motivo_baja: string | null;
  observacion: string | null;
};

const unir = (...partes: (string | null)[]) => partes.filter(Boolean).join(" · ");

/** Una línea que explica el movimiento a quien lee el kárdex. */
export function detalleDeMovimiento(f: FilaKardex): string {
  switch (f.tipo) {
    case "ingreso":
      return unir(f.proveedor, f.documento);
    case "consumo":
      return unir(f.destino_lote, f.area_turno);
    case "baja":
      return f.motivo_baja ? (NOMBRE_MOTIVO[f.motivo_baja] ?? f.motivo_baja) : "";
    case "anulacion":
      return `Anula un registro: ${f.observacion ?? ""}`.trim();
    default:
      return f.observacion ?? "";
  }
}
```

- [ ] `pnpm test -- src/lib/insumos/` → PASAN.

### Paso 3 — Conteo: esquema y acciones

- [ ] Crear `src/lib/validaciones/conteo.test.ts`:

```ts
import { describe, expect, it } from "vitest";

import { esquemaConteo } from "./conteo";

const HARINA = "0a1f3a52-6b1e-4f7e-9d3a-0a1b2c3d4e5f";

describe("esquemaConteo", () => {
  it("solo cuenta los insumos con algo escrito", () => {
    const r = esquemaConteo.parse({
      observacion: "Inventario inicial",
      lineas: [{ insumo_id: HARINA, contado: "62,5", precio_unitario: "", fecha_vencimiento: "" }],
    });
    expect(r.lineas[0]).toEqual({
      insumo_id: HARINA,
      contado: "62.5",
      precio_unitario: null,
      fecha_vencimiento: null,
    });
  });

  it("pide al menos un insumo contado y una explicación", () => {
    expect(esquemaConteo.safeParse({ observacion: "x", lineas: [] }).success).toBe(false);
    expect(
      esquemaConteo.safeParse({
        observacion: "",
        lineas: [{ insumo_id: HARINA, contado: "1", precio_unitario: "", fecha_vencimiento: "" }],
      }).success,
    ).toBe(false);
  });
});
```

- [ ] `pnpm test -- src/lib/validaciones/conteo.test.ts` → FALLA.

- [ ] Crear `src/lib/validaciones/conteo.ts`:

```ts
import * as z from "zod";

import { json, texto } from "@/lib/panel/formulario";

import { cantidadOCero, precioOpcional } from "./numeros";

export const esquemaConteo = z.object({
  observacion: z
    .string()
    .trim()
    .min(1, { error: "Escribe por qué se contó, por ejemplo «Inventario inicial»." })
    .max(300, { error: "Máximo 300 letras." }),
  lineas: z
    .array(
      z.object({
        insumo_id: z.uuid(),
        contado: cantidadOCero("Escribe lo contado con números, por ejemplo 12.5."),
        precio_unitario: precioOpcional("Escribe el precio con números, por ejemplo 3.20."),
        fecha_vencimiento: z
          .union([z.literal(""), z.iso.date()])
          .transform((v) => (v === "" ? null : v)),
      }),
    )
    .min(1, { error: "Escribe lo contado en al menos un insumo." }),
});

type LineaCruda = { contado?: unknown };

export function leerConteo(fd: FormData) {
  const lineas = json(fd, "lineas");
  return {
    observacion: texto(fd, "observacion"),
    // Un insumo sin nada escrito no se contó: no es un «0».
    lineas: Array.isArray(lineas)
      ? lineas.filter((l: LineaCruda) => typeof l.contado === "string" && l.contado.trim() !== "")
      : [],
  };
}

export function validarConteo(fd: FormData) {
  const r = esquemaConteo.safeParse(leerConteo(fd));
  return r.success
    ? {}
    : (z.flattenError(r.error).fieldErrors as Record<string, string[] | undefined>);
}
```

- [ ] `pnpm test -- src/lib/validaciones/conteo.test.ts` → PASA.

- [ ] Crear `src/lib/acciones/kardex.ts`:

```ts
"use server";

import * as z from "zod";

import { ejecutarAccion, type EstadoAccion } from "@/lib/panel/accion";
import { esquemaConteo, leerConteo } from "@/lib/validaciones/conteo";

import { RUTA_INSUMOS } from "./insumos";

export async function registrarConteo(fd: FormData): Promise<EstadoAccion> {
  return ejecutarAccion({
    ruta: `${RUTA_INSUMOS}/conteo`,
    esquema: esquemaConteo,
    entrada: leerConteo(fd),
    entidad: "un conteo",
    etiquetas: [],
    mensajeOk: "Conteo registrado.",
    hacer: async (d, { supabase }) => {
      const { data, error } = await supabase.rpc("registrar_conteo", {
        p_lineas: d.lineas,
        p_observacion: d.observacion,
      });
      const mensaje =
        data === 0
          ? "Todo coincide: no hizo falta ningún ajuste."
          : `Conteo registrado: ${data} ${data === 1 ? "ajuste" : "ajustes"}.`;
      return { error, mensaje: error ? undefined : mensaje };
    },
  });
}

export async function anularMovimiento(id: string, fd: FormData): Promise<EstadoAccion> {
  return ejecutarAccion({
    ruta: RUTA_INSUMOS,
    esquema: z.object({
      id: z.uuid(),
      motivo: z
        .string()
        .trim()
        .min(1, { error: "Escribe por qué se anula." })
        .max(300, { error: "Máximo 300 letras." }),
    }),
    entrada: { id, motivo: fd.get("motivo") ?? "" },
    entidad: "el registro",
    etiquetas: [],
    mensajeOk: "Registro anulado. Se ve tachado en el kárdex.",
    hacer: async ({ id, motivo }, { supabase }) => {
      const { data, error } = await supabase.rpc("anular_movimiento", {
        p_id: id,
        p_motivo: motivo,
      });
      return { error, id: data ?? undefined };
    },
  });
}
```

### Paso 4 — Anular, en un diálogo

- [ ] Crear `src/components/panel/anular-movimiento.tsx`:

```tsx
"use client";

import { Undo2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import type { EstadoAccion } from "@/lib/panel/accion";

import { CLASE_CONTROL } from "./campo";

/**
 * Anular pide un motivo: sin él, el kárdex tendría una línea tachada que nadie
 * sabe explicar en el próximo conteo. Nombra lo que se anula, como
 * `ConfirmarBorrado`.
 */
export function AnularMovimiento({
  descripcion,
  accion,
}: {
  /** «el consumo del 12/10/2026 08:00 (5 kg)» */
  descripcion: string;
  accion: (fd: FormData) => Promise<EstadoAccion>;
}) {
  const [abierto, setAbierto] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendiente, iniciar] = useTransition();
  const router = useRouter();

  function enviar(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const datos = new FormData(evento.currentTarget);
    iniciar(async () => {
      const r = await accion(datos);
      if (r.estado === "ok") {
        setAbierto(false);
        router.refresh();
      } else if (r.estado === "error") {
        setError(r.mensaje);
      }
    });
  }

  return (
    <AlertDialog open={abierto} onOpenChange={setAbierto}>
      <AlertDialogTrigger asChild>
        <button
          type="button"
          className="boton-linea size-12 p-0"
          aria-label={`Anular ${descripcion}`}
        >
          <Undo2 aria-hidden className="size-5" />
        </button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <form onSubmit={enviar} className="flex flex-col gap-4">
          <AlertDialogHeader>
            <AlertDialogTitle>¿Anular {descripcion}?</AlertDialogTitle>
            <AlertDialogDescription>
              Se registra el movimiento contrario y el original queda tachado. No se borra nada.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <label className="flex flex-col gap-1 text-sm">
            <span>Motivo</span>
            <textarea name="motivo" rows={2} required className={CLASE_CONTROL} />
          </label>
          {error ? (
            <p role="alert" className="text-destructive text-sm">
              {error}
            </p>
          ) : null}
          <AlertDialogFooter>
            <AlertDialogCancel className="boton-linea">Cancelar</AlertDialogCancel>
            <button type="submit" className="boton-cta" disabled={pendiente}>
              {pendiente ? "Anulando…" : "Anular"}
            </button>
          </AlertDialogFooter>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  );
}
```

> Importar `type FormEvent` de `react` en vez de usar `React.FormEvent` si la configuración de
> TypeScript no expone el espacio de nombres `React` global (en `formulario-panel.tsx` se ve cuál
> usa el proyecto).

### Paso 5 — La ficha del insumo

- [ ] Crear `src/app/(admin)/admin/insumos/[id]/page.tsx`:

```tsx
import { Pencil } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { AnularMovimiento } from "@/components/panel/anular-movimiento";
import { EncabezadoPanel } from "@/components/panel/encabezado-panel";
import { EtiquetaInsumo } from "@/components/panel/etiqueta-insumo";
import { ListaAdaptable } from "@/components/panel/lista-adaptable";
import { anularMovimiento } from "@/lib/acciones/kardex";
import { exigirAcceso } from "@/lib/auth/sesion";
import { detalleDeMovimiento, NOMBRE_TIPO } from "@/lib/insumos/kardex";
import { leerPeriodo } from "@/lib/insumos/periodo";
import {
  describirExistencia,
  formatearCantidad,
  presentacionPrincipal,
} from "@/lib/insumos/unidades";
import { formatearFechaLima } from "@/lib/panel/hora-lima";
import { crearClienteServidor } from "@/lib/supabase/servidor";

export default function FichaInsumo({ params, searchParams }: PageProps<"/admin/insumos/[id]">) {
  return (
    <Suspense fallback={<p className="text-muted-foreground text-sm">Cargando…</p>}>
      <Ficha params={params} searchParams={searchParams} />
    </Suspense>
  );
}

async function Ficha({
  params,
  searchParams,
}: {
  params: PageProps<"/admin/insumos/[id]">["params"];
  searchParams: PageProps<"/admin/insumos/[id]">["searchParams"];
}) {
  const [{ id }, filtros] = await Promise.all([params, searchParams]);
  const sesion = await exigirAcceso("/admin/insumos");
  const esAdministracion = sesion.rol === "superadmin" || sesion.rol === "administrador";
  // Dentro de un componente dinámico (espera la sesión): aquí `new Date()` no
  // rompe el prerenderizado (trampa de Cache Components en CLAUDE.md).
  const periodo = leerPeriodo(filtros, new Date(), 30);

  const supabase = await crearClienteServidor();
  const [{ data: insumo }, { data: equivalencias }, { data: lotes }, { data: kardex, error }] =
    await Promise.all([
      supabase.from("existencias_insumo").select("*").eq("id", id).maybeSingle(),
      supabase
        .from("equivalencias")
        .select("factor, unidades_medida!unidad_desde(codigo)")
        .eq("insumo_id", id),
      supabase
        .from("saldos_lote")
        .select("cantidad_base, lotes_insumo(codigo, fecha_vencimiento, costo_unitario)")
        .eq("insumo_id", id)
        .gt("cantidad_base", 0),
      supabase.rpc("kardex_insumo", {
        p_insumo: id,
        p_desde: periodo.desde,
        p_hasta: periodo.hasta,
      }),
    ]);
  if (!insumo) notFound();

  const presentacion = presentacionPrincipal(
    (equivalencias ?? [])
      .filter((e) => e.unidades_medida)
      .map((e) => ({ codigo: e.unidades_medida!.codigo, factor: Number(e.factor) })),
  );
  const filas = (kardex ?? []).slice().reverse(); // lo más reciente arriba

  return (
    <>
      <EncabezadoPanel
        titulo={insumo.nombre}
        volver={{ ruta: "/admin/insumos", nombre: "Insumos" }}
        accion={
          <Link href={`/admin/insumos/${id}/editar`} className="boton-linea">
            <Pencil aria-hidden className="size-5" /> Editar datos
          </Link>
        }
      />
      <section aria-labelledby="hay" className="tarjeta mb-6 p-4">
        <h2 id="hay" className="text-muted-foreground text-sm">
          Hay en el almacén
        </h2>
        <p className="text-2xl font-semibold">
          {describirExistencia(Number(insumo.cantidad_base), insumo.unidad_base, presentacion)}
        </p>
        <p className="mt-1 flex gap-1">
          {insumo.bajo_minimo ? <EtiquetaInsumo tipo="bajo" /> : null}
          {insumo.por_vencer ? <EtiquetaInsumo tipo="vencer" /> : null}
        </p>
      </section>

      {lotes && lotes.length > 0 ? (
        <section aria-labelledby="lotes" className="mb-6">
          <h2 id="lotes" className="mb-2 font-semibold">
            Lotes con existencia
          </h2>
          <ul className="flex flex-col gap-2">
            {lotes.map((l, i) => (
              <li
                key={i}
                className="bg-card flex flex-wrap justify-between gap-2 rounded-xl border p-3 text-sm"
              >
                <span>{l.lotes_insumo?.codigo ?? "Sin código"}</span>
                <span>
                  {l.lotes_insumo?.fecha_vencimiento
                    ? `Vence el ${l.lotes_insumo.fecha_vencimiento.split("-").reverse().join("/")}`
                    : "No vence"}
                </span>
                <span>
                  Quedan {formatearCantidad(Number(l.cantidad_base))} {insumo.unidad_base}
                </span>
                <span>
                  {l.lotes_insumo?.costo_unitario != null
                    ? `S/ ${Number(l.lotes_insumo.costo_unitario).toFixed(2)} el ${insumo.unidad_base}`
                    : "Costo sin registrar"}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section aria-labelledby="kardex">
        <h2 id="kardex" className="mb-2 font-semibold">
          Movimientos
        </h2>
        <form className="mb-3 flex flex-wrap items-end gap-2">
          <label className="flex flex-col gap-1 text-sm">
            <span>Desde</span>
            <input
              type="date"
              name="desde"
              defaultValue={periodo.desde}
              className="border-input bg-card min-h-11 rounded-xl border px-3"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span>Hasta</span>
            <input
              type="date"
              name="hasta"
              defaultValue={periodo.hasta}
              className="border-input bg-card min-h-11 rounded-xl border px-3"
            />
          </label>
          <button type="submit" className="boton-linea">
            Ver
          </button>
        </form>
        {error ? (
          <p role="alert">No se pudo cargar el kárdex. Recarga la página.</p>
        ) : (
          <ListaAdaptable
            etiqueta={`Movimientos de ${insumo.nombre}`}
            filas={filas}
            enlace={() => `/admin/insumos/${id}`}
            columnas={[
              {
                titulo: "Movimiento",
                principal: true,
                celda: (m) => {
                  const texto = `${NOMBRE_TIPO[m.tipo] ?? m.tipo} · ${formatearFechaLima(m.ocurrido_en)}`;
                  return m.anulado ? (
                    <>
                      <s>{texto}</s> <span className="text-muted-foreground">(anulado)</span>
                    </>
                  ) : (
                    texto
                  );
                },
              },
              { titulo: "Detalle", celda: (m) => detalleDeMovimiento(m) },
              {
                titulo: "Cantidad",
                celda: (m) =>
                  `${m.sentido > 0 ? "+" : "−"}${formatearCantidad(Number(m.cantidad_base))} ${insumo.unidad_base}`,
              },
              {
                titulo: "Queda",
                celda: (m) => `${formatearCantidad(Number(m.saldo))} ${insumo.unidad_base}`,
              },
              { titulo: "Registró", celda: (m) => m.responsable ?? "" },
            ]}
            acciones={
              esAdministracion
                ? (m) =>
                    m.anulado || m.tipo === "anulacion" ? null : (
                      <AnularMovimiento
                        descripcion={`el ${(NOMBRE_TIPO[m.tipo] ?? m.tipo).toLowerCase()} del ${formatearFechaLima(m.ocurrido_en)}`}
                        accion={anularMovimiento.bind(null, m.id)}
                      />
                    )
                : undefined
            }
            vacio={<p>No hay movimientos entre esas fechas.</p>}
          />
        )}
      </section>
    </>
  );
}
```

> `ListaAdaptable` exige un enlace por fila. El kárdex no tiene a dónde ir desde una fila, así que
> apunta a la propia ficha. Si la revisión de accesibilidad lo marca como ruido (un enlace por fila
> que no lleva a ningún sitio nuevo), añadir a `ListaAdaptable` una prop `enlace` **opcional** que,
> sin ella, pinte la fila sin `<Link>`, y ajustar sus usos: es un cambio de F4 pequeño y con prueba
> en `panel-accesibilidad.spec.ts`.

- [ ] En `src/app/(admin)/admin/insumos/page.tsx`, cambiar `enlace={(i) => `${RUTA}/${i.id}/editar`}`
      por `enlace={(i) => `${RUTA}/${i.id}`}`.

### Paso 6 — El conteo

- [ ] Crear `src/app/(admin)/admin/insumos/conteo/formulario-conteo.tsx`:

```tsx
"use client";

import { useEffect, useRef, useState } from "react";

import { BarraGuardar } from "@/components/panel/barra-guardar";
import { Campo, CLASE_CONTROL } from "@/components/panel/campo";
import { FormularioPanel, useFormularioPanel } from "@/components/panel/formulario-panel";
import { registrarConteo } from "@/lib/acciones/kardex";
import { claveDeBorrador } from "@/lib/panel/borrador";
import { validarConteo } from "@/lib/validaciones/conteo";

export type InsumoAContar = {
  id: string;
  nombre: string;
  unidad_base: string;
  hay: string; // ya escrito: «62 kg (1 saco y 12 kg)»
  es_perecible: boolean;
};

type Linea = { contado: string; precio_unitario: string; fecha_vencimiento: string };

const VOLVER = "/admin/insumos";

export function FormularioConteo({ insumos }: { insumos: InsumoAContar[] }) {
  return (
    <FormularioPanel
      clave={claveDeBorrador("conteo", null)}
      accion={registrarConteo}
      validar={validarConteo}
      destino={() => VOLVER}
    >
      <Campo
        nombre="observacion"
        etiqueta="Por qué se cuenta"
        ayuda="Por ejemplo: Inventario inicial"
      >
        {(p) => <input {...p} defaultValue="" />}
      </Campo>
      <p className="text-muted-foreground text-sm">
        Escribe solo lo que contaste. Un insumo en blanco no se toca.
      </p>
      <Lineas insumos={insumos} />
      <BarraGuardar volver={VOLVER} />
    </FormularioPanel>
  );
}

function Lineas({ insumos }: { insumos: InsumoAContar[] }) {
  const { errores, registrarRestaurable } = useFormularioPanel();
  const oculto = useRef<HTMLInputElement>(null);
  const [valores, setValores] = useState<Record<string, Linea>>({});

  useEffect(
    () =>
      registrarRestaurable("lineas", (valor) => {
        try {
          const lista = JSON.parse(valor) as (Linea & { insumo_id: string })[];
          setValores(Object.fromEntries(lista.map(({ insumo_id, ...l }) => [insumo_id, l])));
        } catch {
          // Una copia rota no pisa lo que hay.
        }
      }),
    [registrarRestaurable],
  );

  function cambiar(id: string, cambios: Partial<Linea>) {
    setValores((v) => ({
      ...v,
      [id]: { contado: "", precio_unitario: "", fecha_vencimiento: "", ...v[id], ...cambios },
    }));
    setTimeout(() => oculto.current?.dispatchEvent(new Event("input", { bubbles: true })), 0);
  }

  const valor = JSON.stringify(
    Object.entries(valores).map(([insumo_id, l]) => ({ insumo_id, ...l })),
  );

  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="sr-only">Insumos</legend>
      <input ref={oculto} type="hidden" name="lineas" value={valor} />
      {errores.lineas?.[0] ? (
        <p role="alert" className="text-destructive text-sm">
          {errores.lineas[0]}
        </p>
      ) : null}
      {insumos.map((i) => (
        <div key={i.id} className="bg-card flex flex-col gap-2 rounded-xl border p-3">
          <p className="font-semibold">{i.nombre}</p>
          <p className="text-muted-foreground text-sm">Según el sistema: {i.hay}</p>
          <div className="grid grid-cols-2 gap-2">
            <label className="flex flex-col gap-1 text-sm">
              <span>
                Contado de {i.nombre} ({i.unidad_base})
              </span>
              <input
                className={CLASE_CONTROL}
                inputMode="decimal"
                value={valores[i.id]?.contado ?? ""}
                onChange={(e) => cambiar(i.id, { contado: e.target.value })}
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span>Precio por {i.unidad_base} (S/), si sobra</span>
              <input
                className={CLASE_CONTROL}
                inputMode="decimal"
                value={valores[i.id]?.precio_unitario ?? ""}
                onChange={(e) => cambiar(i.id, { precio_unitario: e.target.value })}
              />
            </label>
            {i.es_perecible ? (
              <label className="col-span-2 flex flex-col gap-1 text-sm">
                <span>Vence (si sobra) — {i.nombre}</span>
                <input
                  type="date"
                  className={CLASE_CONTROL}
                  value={valores[i.id]?.fecha_vencimiento ?? ""}
                  onChange={(e) => cambiar(i.id, { fecha_vencimiento: e.target.value })}
                />
              </label>
            ) : null}
          </div>
        </div>
      ))}
    </fieldset>
  );
}
```

- [ ] Crear `src/app/(admin)/admin/insumos/conteo/page.tsx`:

```tsx
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { EncabezadoPanel } from "@/components/panel/encabezado-panel";
import { exigirAcceso } from "@/lib/auth/sesion";
import { describirExistencia, presentacionPrincipal } from "@/lib/insumos/unidades";
import { crearClienteServidor } from "@/lib/supabase/servidor";

import { FormularioConteo } from "./formulario-conteo";

export default function Conteo() {
  return (
    <>
      <EncabezadoPanel
        titulo="Conteo físico"
        descripcion="Lo que hay de verdad en el almacén. También sirve para cargar el inventario inicial."
        volver={{ ruta: "/admin/insumos", nombre: "Insumos" }}
      />
      <Suspense fallback={<p className="text-muted-foreground text-sm">Cargando…</p>}>
        <Formulario />
      </Suspense>
    </>
  );
}

async function Formulario() {
  const sesion = await exigirAcceso("/admin/insumos/conteo");
  // Comodidad: la base ya lo niega (registrar_conteo). Aquí se evita enseñar
  // un formulario que va a fallar.
  if (sesion.rol !== "superadmin" && sesion.rol !== "administrador") {
    redirect("/admin/insumos");
  }
  const supabase = await crearClienteServidor();
  const [{ data: insumos }, { data: equivalencias }] = await Promise.all([
    supabase
      .from("existencias_insumo")
      .select("id, nombre, unidad_base, cantidad_base, es_perecible")
      .eq("activo", true)
      .order("nombre"),
    supabase
      .from("equivalencias")
      .select("insumo_id, factor, unidades_medida!unidad_desde(codigo)"),
  ]);

  const lista = (insumos ?? []).map((i) => ({
    id: i.id,
    nombre: i.nombre,
    unidad_base: i.unidad_base,
    es_perecible: i.es_perecible,
    hay: describirExistencia(
      Number(i.cantidad_base),
      i.unidad_base,
      presentacionPrincipal(
        (equivalencias ?? [])
          .filter((e) => e.insumo_id === i.id && e.unidades_medida)
          .map((e) => ({ codigo: e.unidades_medida!.codigo, factor: Number(e.factor) })),
      ),
    ),
  }));

  return <FormularioConteo insumos={lista} />;
}
```

> Las columnas de la vista salen como `string | null` en los tipos generados (Postgres no marca
> `not null` en una vista). Si `typecheck` protesta, estrechar con `?? ""` y `?? false` al armar
> `lista`, no con `!`.

- [ ] En `src/app/(admin)/admin/insumos/page.tsx`, añadir a `REGISTRAR`:

```ts
  { ruta: "/admin/insumos/conteo", nombre: "Conteo", soloAdministracion: true },
```

### Paso 7 — Pruebas de navegador

- [ ] Añadir a `RUTAS_DEL_PANEL`: `"/admin/insumos/conteo"`. La ficha lleva un id: añadir en
      `e2e/panel-accesibilidad.spec.ts` una prueba aparte que lea el id de «Harina» con la
      `service_role` local y pase axe y el área táctil por `/admin/insumos/<id>`:

```ts
test("axe y área táctil en la ficha de un insumo", async ({ page }) => {
  const { apiUrl, serviceRoleKey } = supabaseLocal();
  const respuesta = await fetch(`${apiUrl}/rest/v1/insumos?nombre=eq.Harina&select=id`, {
    headers: { apikey: serviceRoleKey, Authorization: `Bearer ${serviceRoleKey}` },
  });
  const [{ id }] = (await respuesta.json()) as { id: string }[];
  await page.goto(`/admin/insumos/${id}`);
  await page.locator("main#contenido").waitFor();
  const { violations } = await new AxeBuilder({ page }).analyze();
  expect(violations).toEqual([]);
  expect(await controlesPequenos(page)).toEqual([]);
});
```

(importar `supabaseLocal` de `./ayudas/supabase-local`; el archivo ya tiene `AxeBuilder`,
`controlesPequenos` y la sesión de administrador en su `beforeEach` — si no la tiene a nivel de
archivo, envolver la prueba en el mismo `describe` que usan las demás).

- [ ] Crear `e2e/panel-kardex.spec.ts`:

```ts
import { expect, test } from "@playwright/test";

import { entrarComo } from "./ayudas/sesion";
import { borrarUsuario } from "./ayudas/usuarios";

test.beforeEach(({}, info) => {
  test.skip(info.project.name !== "movil", "escribe en el mejorador de la semilla");
});

test("el administrador cuenta, ve el ajuste en el kárdex y lo anula", async ({ page }) => {
  const usuario = await entrarComo(page, "administrador");
  try {
    await page.goto("/admin/insumos/conteo");
    await page.getByLabel("Por qué se cuenta").fill("Prueba E2E de conteo");
    await page.getByLabel("Contado de Mejorador (kg)").fill("137");
    await page.getByRole("button", { name: "Guardar" }).click();
    await page.waitForURL("/admin/insumos");

    await page.goto("/admin/insumos?buscar=Mejorador");
    await page.getByRole("list", { name: "Existencias de insumos" }).getByText("Mejorador").click();
    await expect(page.getByRole("heading", { name: "Mejorador" })).toBeVisible();
    await expect(page.getByText("137 kg").first()).toBeVisible();

    const lista = page.getByRole("list", { name: "Movimientos de Mejorador" });
    await lista
      .getByRole("button", { name: /^Anular el conteo del/ })
      .first()
      .click();
    await page.getByLabel("Motivo").fill("Prueba E2E");
    await page.getByRole("button", { name: "Anular", exact: true }).click();
    await expect(lista.getByText("(anulado)").first()).toBeVisible();
  } finally {
    await borrarUsuario(usuario.id);
  }
});

test("el ingeniero no ve Conteo ni Anular", async ({ page }) => {
  const usuario = await entrarComo(page, "ingeniero");
  try {
    await page.goto("/admin/insumos");
    await expect(page.getByRole("link", { name: "Conteo" })).toHaveCount(0);
    await page.goto("/admin/insumos/conteo");
    await page.waitForURL("/admin/insumos");
  } finally {
    await borrarUsuario(usuario.id);
  }
});
```

- [ ] `pnpm build` y, con el puerto 3000 libre:
      `pnpm exec playwright test e2e/panel-kardex.spec.ts e2e/panel-accesibilidad.spec.ts` → verde.

### Paso 8 — Cerrar la tarea

- [ ] `pnpm typecheck && pnpm lint && pnpm format:check && pnpm test` sin avisos.
- [ ] A 375 px en la vista previa: la ficha con más de diez movimientos, el diálogo de anular y el
      conteo de los 22 insumos (se baja cómodo y «Guardar» sigue a la vista).
- [ ] Commit y PR; Dan aplica 0037 antes de fusionar:

```bash
git add supabase/migrations/0037_conteo_y_anulacion.sql supabase/tests/0037_conteo_y_anulacion.test.sql \
        src/tipos/database.types.ts src/lib/insumos src/lib/validaciones/conteo.ts \
        src/lib/validaciones/conteo.test.ts src/lib/acciones/kardex.ts \
        src/components/panel/anular-movimiento.tsx "src/app/(admin)/admin/insumos" \
        e2e/panel-kardex.spec.ts e2e/panel-accesibilidad.spec.ts
git commit -m "feat(insumos): ficha con kárdex, anulación y conteo físico"
```

---

## Tarea 5 — Bajas con solicitud y aprobación

**Rama:** `feat/f5-t5-bajas`

**Qué deja hecho:** el ingeniero **pide** una baja (insumo, cantidad, motivo de la ficha 7.7 y
explicación) y no se descuenta nada. La administración ve el aviso en el inicio y la **aprueba**
(entonces descuenta, por FEFO, a nombre de quien la aprueba) o la **rechaza** con un comentario que
el ingeniero ve. Si el stock ya no alcanza al aprobar, la frase lo dice. El inicio avisa también de
los insumos bajo el mínimo y por vencer.

**Archivos:**

- Crear: `supabase/migrations/0038_solicitudes_baja.sql` + `supabase/tests/0038_solicitudes_baja.test.sql`
- Crear: `src/lib/validaciones/baja.ts` + `.test.ts`, `src/lib/acciones/bajas.ts`
- Crear: `src/components/panel/resolver-baja.tsx`
- Crear: `src/app/(admin)/admin/insumos/bajas/page.tsx`, `bajas/nueva/page.tsx`,
  `bajas/nueva/formulario-baja.tsx`
- Modificar: `src/app/(admin)/admin/insumos/page.tsx` (`REGISTRAR`), `src/app/(admin)/admin/page.tsx`
  (avisos)
- Crear: `e2e/ayudas/insumos.ts`, `e2e/panel-bajas.spec.ts`. Modificar: `e2e/panel-accesibilidad.spec.ts`

**Interfaces:**

- Consume (T1): reparto FEFO, «Solo hay…», la política que reserva la baja a la administración.
  (T3): `EditorLineas` con `tipo="baja"` y `unaSola`, `insumosParaLineas`, `cantidadPositiva`,
  `erroresPorCampo`, `formatearFechaLima`. (T4): `NOMBRE_MOTIVO`. (F4): el patrón de avisos de
  `contarAvisos` en el inicio.
- Produce:
  - Tabla `public.solicitudes_baja` (`estado`: `pendiente | aprobada | rechazada`)
  - `public.aprobar_baja(p_id uuid) returns uuid` (el id del movimiento) y
    `public.rechazar_baja(p_id uuid, p_comentario text) returns void`
  - `notificaciones.tipo` admite `baja_pendiente`, y `notificaciones.solicitud_baja_id`
  - `e2e/ayudas/insumos.ts`: `sesionDeApi(rol)` y `sumarStock(nombreInsumo, cantidadBase)`
    (T6 y T7 los usan)

### Paso 1 — La base

- [ ] Crear `supabase/tests/0038_solicitudes_baja.test.sql`:

```sql
-- Verifica las solicitudes de baja (0038).
--
-- Lo que se defiende: que pedir no descuente; que solo la administración
-- apruebe o rechace, también llamando a la API; que aprobar descuente con el
-- autorizador correcto; que un rechazo lleve su motivo; y que no se apruebe
-- lo que ya no alcanza.
begin;
select plan(15);

insert into auth.users (id, email, created_at, updated_at) values
  ('22222222-2222-2222-2222-222222222222', 'admin@pimpos.test', now(), now()),
  ('33333333-3333-3333-3333-333333333333', 'inge@pimpos.test',  now(), now());
update public.perfiles set rol = 'administrador', activo = true where id = '22222222-2222-2222-2222-222222222222';
update public.perfiles set rol = 'ingeniero',     activo = true where id = '33333333-3333-3333-3333-333333333333';

create temp table ref as
select (select id from public.insumos where nombre = 'Azúcar')    as azucar,
       (select id from public.unidades_medida where codigo = 'kg') as kg;
create temp table t (clave text primary key, valor uuid);
grant select on ref to authenticated;
grant all on t to authenticated;

-- 20 kg de azúcar para trabajar.
insert into public.movimientos_insumo (tipo, sentido, insumo_id, cantidad, unidad_id, responsable_id, observacion)
select 'ajuste', 1, azucar, 20, kg, '22222222-2222-2222-2222-222222222222', 'Inventario inicial' from ref;

select has_table('public', 'solicitudes_baja', 'existe solicitudes_baja');

set local role authenticated;
set local request.jwt.claims = '{"sub": "33333333-3333-3333-3333-333333333333", "rol": "ingeniero"}';

with s as (
  insert into public.solicitudes_baja (insumo_id, cantidad, unidad_id, motivo_baja, observacion)
  select azucar, 5, kg, 'merma', 'Se mojó un saco' from ref returning id)
insert into t select 'uno', id from s;

select is(
  (select cantidad_base from public.saldos_insumo where insumo_id = (select azucar from ref)),
  20.0::numeric(14,4), 'pedir una baja no descuenta'
);
select is(
  (select solicitado_por from public.solicitudes_baja where id = (select valor from t where clave = 'uno')),
  '33333333-3333-3333-3333-333333333333'::uuid, 'queda a nombre de quien la pide'
);
select throws_ok(
  $$ insert into public.solicitudes_baja (insumo_id, cantidad, unidad_id, motivo_baja, observacion, estado)
     select azucar, 1, kg, 'merma', 'x', 'aprobada' from ref $$,
  '42501', null, 'nadie crea una solicitud ya aprobada'
);
select throws_ok(
  format($$ update public.solicitudes_baja set estado = 'aprobada' where id = %L $$,
         (select valor from t where clave = 'uno')),
  '42501', null, 'ni la cambia a mano'
);
select throws_ok(
  format($$ select public.aprobar_baja(%L) $$, (select valor from t where clave = 'uno')),
  '42501', 'Solo la administración aprueba o rechaza bajas.', 'el ingeniero no aprueba'
);

reset role;
select is(
  (select count(*)::int from public.notificaciones
    where tipo = 'baja_pendiente' and solicitud_baja_id = (select valor from t where clave = 'uno')
      and resuelta_en is null),
  1, 'pedirla avisa a la administración'
);

set local role authenticated;
set local request.jwt.claims = '{"sub": "22222222-2222-2222-2222-222222222222", "rol": "administrador"}';

insert into t select 'movimiento', public.aprobar_baja((select valor from t where clave = 'uno'));

select is(
  (select cantidad_base from public.saldos_insumo where insumo_id = (select azucar from ref)),
  15.0::numeric(14,4), 'aprobarla descuenta 5 kg'
);
select is(
  (select autorizado_por from public.movimientos_insumo where id = (select valor from t where clave = 'movimiento')),
  '22222222-2222-2222-2222-222222222222'::uuid, 'autorizada por quien la aprueba'
);
select is(
  (select responsable_id from public.movimientos_insumo where id = (select valor from t where clave = 'movimiento')),
  '33333333-3333-3333-3333-333333333333'::uuid, 'a nombre de quien la pidió'
);
select throws_ok(
  format($$ select public.aprobar_baja(%L) $$, (select valor from t where clave = 'uno')),
  'P0001', 'Esa solicitud ya se resolvió. Recarga la página.', 'no se aprueba dos veces'
);

-- Una que ya no alcanza
insert into public.solicitudes_baja (id, insumo_id, cantidad, unidad_id, motivo_baja, observacion)
select 'bbbb3838-0000-0000-0000-000000000001', azucar, 50, kg, 'vencimiento', 'Todo vencido' from ref;
select throws_ok(
  $$ select public.aprobar_baja('bbbb3838-0000-0000-0000-000000000001') $$,
  'P0001', 'Solo hay 15 kg de Azúcar. Si en el almacén hay más, falta registrar un ingreso o hacer un conteo.',
  'no se aprueba lo que ya no alcanza, y lo dice'
);
select throws_ok(
  $$ select public.rechazar_baja('bbbb3838-0000-0000-0000-000000000001', ' ') $$,
  'P0001', 'Escribe por qué la rechazas: el ingeniero lo va a leer.', 'un rechazo necesita motivo'
);
select lives_ok(
  $$ select public.rechazar_baja('bbbb3838-0000-0000-0000-000000000001', 'Cuéntalo primero') $$,
  'se rechaza con motivo'
);

reset role;
select is(
  (select count(*)::int from public.notificaciones where tipo = 'baja_pendiente' and resuelta_en is null),
  0, 'y los avisos de las dos quedan resueltos'
);

select * from finish();
rollback;
```

- [ ] `supabase test db` → FALLA `0038`.

- [ ] Crear `supabase/migrations/0038_solicitudes_baja.sql`:

```sql
-- =============================================================================
-- 0038_solicitudes_baja.sql
-- Bajas con solicitud y aprobación (F5, tarea 5; decisión 1 del plan 05).
--
-- El kárdex sigue guardando solo hechos. Lo que se pide vive aquí; lo que se
-- aprueba se convierte en un movimiento `baja` con `autorizado_por` = quien
-- aprueba. Desde 0034 ninguna persona puede insertar una baja a nombre de otro
-- autorizador, así que este es el único camino del ingeniero.
-- =============================================================================
create table public.solicitudes_baja (
  id                 uuid primary key default gen_random_uuid(),
  insumo_id          uuid not null references public.insumos(id) on delete restrict,
  lote_id            uuid references public.lotes_insumo(id) on delete restrict,
  cantidad           numeric(14,4) not null check (cantidad > 0),
  unidad_id          uuid not null references public.unidades_medida(id) on delete restrict,
  motivo_baja        app.motivo_baja not null,
  observacion        text not null check (length(btrim(observacion)) > 0),
  estado             text not null default 'pendiente'
                     check (estado in ('pendiente', 'aprobada', 'rechazada')),
  comentario_rechazo text,
  movimiento_id      uuid unique references public.movimientos_insumo(id) on delete restrict,
  solicitado_por     uuid not null default auth.uid() references auth.users(id) on delete restrict,
  resuelto_por       uuid references auth.users(id) on delete restrict,
  resuelto_en        timestamptz,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  created_by         uuid references auth.users(id),
  updated_by         uuid references auth.users(id),

  constraint rechazo_explicado check (
    estado <> 'rechazada' or length(btrim(coalesce(comentario_rechazo, ''))) > 0),
  constraint aprobada_con_movimiento check ((estado = 'aprobada') = (movimiento_id is not null)),
  constraint resuelta_con_autor check ((estado = 'pendiente') = (resuelto_por is null))
);
comment on table public.solicitudes_baja is
  'Bajas pedidas por el ingeniero. No descuentan hasta que la administración las aprueba (ficha 7.7).';

create index idx_solicitudes_baja_pendientes on public.solicitudes_baja (created_at desc)
  where estado = 'pendiente';

create trigger solicitudes_baja_set_updated_at
  before update on public.solicitudes_baja
  for each row execute function app.set_updated_at();
-- 0026 solo cubrió las tablas que existían entonces.
create trigger solicitudes_baja_sellar_autoria
  before insert or update on public.solicitudes_baja
  for each row execute function app.sellar_autoria();
select app.auditar('public.solicitudes_baja');

alter table public.solicitudes_baja enable row level security;
alter table public.solicitudes_baja force row level security;

create policy "insumos lee solicitudes de baja"
  on public.solicitudes_baja for select to authenticated
  using ((select app.es_rol('superadmin', 'administrador', 'ingeniero')));
create policy "insumos pide bajas"
  on public.solicitudes_baja for insert to authenticated
  with check (
    (select app.es_rol('superadmin', 'administrador', 'ingeniero'))
    and estado = 'pendiente'
    and solicitado_por = (select auth.uid())
    and movimiento_id is null and resuelto_por is null and comentario_rechazo is null
  );
-- Resolver solo por las funciones de abajo.
revoke update, delete on public.solicitudes_baja from anon, authenticated;

-- -----------------------------------------------------------------------------
-- El aviso
-- -----------------------------------------------------------------------------
alter table public.notificaciones drop constraint notificaciones_tipo_check;
alter table public.notificaciones add constraint notificaciones_tipo_check
  check (tipo in ('stock_bajo', 'por_vencer', 'vencido', 'promocion_en_revision', 'baja_pendiente'));
alter table public.notificaciones
  add column solicitud_baja_id uuid references public.solicitudes_baja(id) on delete cascade;

create or replace function app.avisar_baja_pendiente()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.notificaciones (tipo, titulo, mensaje, insumo_id, solicitud_baja_id, clave_unica)
    select 'baja_pendiente',
           'Baja esperando aprobación',
           format('Piden dar de baja %s %s de %s (%s).',
                  app.formatear_cantidad(new.cantidad), u.nombre, i.nombre, new.observacion),
           new.insumo_id, new.id, 'baja_pendiente:' || new.id
      from public.insumos i, public.unidades_medida u
     where i.id = new.insumo_id and u.id = new.unidad_id;
  elsif old.estado = 'pendiente' and new.estado <> 'pendiente' then
    update public.notificaciones
       set resuelta_en = now()
     where solicitud_baja_id = new.id and resuelta_en is null;
  end if;
  return null;
end;
$$;
revoke execute on function app.avisar_baja_pendiente() from public, anon, authenticated;

create trigger solicitudes_baja_avisar
  after insert or update of estado on public.solicitudes_baja
  for each row execute function app.avisar_baja_pendiente();

-- -----------------------------------------------------------------------------
-- Aprobar y rechazar
--
-- `security definer` porque `authenticated` no tiene UPDATE sobre la tabla
-- (y la baja se inserta a nombre de quien la pidió, cosa que la política de
-- movimientos no deja hacer a nadie). Por eso comprueban el rol aquí mismo.
-- -----------------------------------------------------------------------------
create or replace function public.aprobar_baja(p_id uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_s   public.solicitudes_baja;
  v_mov uuid;
begin
  if not (select app.es_rol('superadmin', 'administrador')) then
    raise exception 'Solo la administración aprueba o rechaza bajas.' using errcode = '42501';
  end if;
  select * into v_s from public.solicitudes_baja where id = p_id for update;
  if not found then
    raise exception 'No se encontró la solicitud.' using errcode = 'P0001';
  end if;
  if v_s.estado <> 'pendiente' then
    raise exception 'Esa solicitud ya se resolvió. Recarga la página.' using errcode = 'P0001';
  end if;

  -- Si ya no alcanza, el reparto (0034) lo dice con su frase y nada cambia.
  insert into public.movimientos_insumo
    (tipo, insumo_id, lote_id, cantidad, unidad_id, motivo_baja, autorizado_por, responsable_id, observacion)
  values ('baja', v_s.insumo_id, v_s.lote_id, v_s.cantidad, v_s.unidad_id, v_s.motivo_baja,
          auth.uid(), v_s.solicitado_por, v_s.observacion)
  returning id into v_mov;

  update public.solicitudes_baja
     set estado = 'aprobada', movimiento_id = v_mov, resuelto_por = auth.uid(), resuelto_en = now()
   where id = p_id;
  return v_mov;
end;
$$;
revoke execute on function public.aprobar_baja(uuid) from public, anon;
grant execute on function public.aprobar_baja(uuid) to authenticated;

create or replace function public.rechazar_baja(p_id uuid, p_comentario text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not (select app.es_rol('superadmin', 'administrador')) then
    raise exception 'Solo la administración aprueba o rechaza bajas.' using errcode = '42501';
  end if;
  if length(btrim(coalesce(p_comentario, ''))) = 0 then
    raise exception 'Escribe por qué la rechazas: el ingeniero lo va a leer.' using errcode = 'P0001';
  end if;
  update public.solicitudes_baja
     set estado = 'rechazada', comentario_rechazo = btrim(p_comentario),
         resuelto_por = auth.uid(), resuelto_en = now()
   where id = p_id and estado = 'pendiente';
  if not found then
    raise exception 'Esa solicitud ya se resolvió. Recarga la página.' using errcode = 'P0001';
  end if;
end;
$$;
revoke execute on function public.rechazar_baja(uuid, text) from public, anon;
grant execute on function public.rechazar_baja(uuid, text) to authenticated;
```

- [ ] `supabase db reset && supabase test db` → todo en verde, **`0026` incluida** (la tabla nueva
      tiene `created_by` y `updated_by`, y su trigger). Después `subir-imagenes.sh` y
      `pnpm supabase:tipos`.

### Paso 2 — Esquema y acciones

- [ ] Crear `src/lib/validaciones/baja.test.ts`:

```ts
import { describe, expect, it } from "vitest";

import { esquemaBaja } from "./baja";

const AZUCAR = "0a1f3a52-6b1e-4f7e-9d3a-0a1b2c3d4e5f";
const KG = "1b2f3a52-6b1e-4f7e-9d3a-0a1b2c3d4e5f";

describe("esquemaBaja", () => {
  const baja = {
    motivo_baja: "merma",
    observacion: "Se mojó un saco",
    lineas: [{ insumo_id: AZUCAR, cantidad: "5", unidad_id: KG }],
  };

  it("acepta una baja con motivo y explicación", () => {
    expect(esquemaBaja.safeParse(baja).success).toBe(true);
  });

  it("solo los cinco motivos de la ficha 7.7", () => {
    expect(esquemaBaja.safeParse({ ...baja, motivo_baja: "robo" }).success).toBe(false);
  });

  it("una sola línea y con explicación", () => {
    expect(
      esquemaBaja.safeParse({ ...baja, lineas: [...baja.lineas, ...baja.lineas] }).success,
    ).toBe(false);
    expect(esquemaBaja.safeParse({ ...baja, observacion: "" }).success).toBe(false);
  });
});
```

- [ ] `pnpm test -- src/lib/validaciones/baja.test.ts` → FALLA.

- [ ] Crear `src/lib/validaciones/baja.ts`:

```ts
import * as z from "zod";

import { json, texto } from "@/lib/panel/formulario";

import { erroresPorCampo, esquemaLineaConsumo } from "./movimiento";

export const MOTIVOS = [
  "merma",
  "vencimiento",
  "danado",
  "devolucion_proveedor",
  "consumo_interno",
] as const;

export const esquemaBaja = z.object({
  motivo_baja: z.enum(MOTIVOS, { error: "Elige el motivo." }),
  observacion: z
    .string()
    .trim()
    .min(1, { error: "Cuenta qué pasó, por ejemplo «Se mojó un saco»." })
    .max(300, { error: "Máximo 300 letras." }),
  lineas: z.array(esquemaLineaConsumo).length(1, { error: "Elige un insumo." }),
});

export function leerBaja(fd: FormData) {
  return {
    motivo_baja: texto(fd, "motivo_baja"),
    observacion: texto(fd, "observacion"),
    lineas: json(fd, "lineas") ?? [],
  };
}

export function validarBaja(fd: FormData) {
  const r = esquemaBaja.safeParse(leerBaja(fd));
  return r.success ? {} : erroresPorCampo(r.error);
}
```

- [ ] `pnpm test -- src/lib/validaciones/baja.test.ts` → PASA.

- [ ] Crear `src/lib/acciones/bajas.ts`:

```ts
"use server";

import * as z from "zod";

import { ejecutarAccion, type EstadoAccion } from "@/lib/panel/accion";
import { esquemaBaja, leerBaja } from "@/lib/validaciones/baja";

const RUTA = "/admin/insumos/bajas";

export async function pedirBaja(fd: FormData): Promise<EstadoAccion> {
  return ejecutarAccion({
    ruta: `${RUTA}/nueva`,
    esquema: esquemaBaja,
    entrada: leerBaja(fd),
    entidad: "una baja",
    etiquetas: [],
    mensajeOk: "Baja pedida. Se descuenta cuando un administrador la apruebe.",
    hacer: async (d, { supabase }) => {
      const linea = d.lineas[0]!;
      const { data, error } = await supabase
        .from("solicitudes_baja")
        .insert({
          insumo_id: linea.insumo_id,
          cantidad: Number(linea.cantidad),
          unidad_id: linea.unidad_id,
          motivo_baja: d.motivo_baja,
          observacion: d.observacion,
        })
        .select("id")
        .single();
      return { error, id: data?.id };
    },
  });
}

export async function aprobarBaja(id: string): Promise<EstadoAccion> {
  return ejecutarAccion({
    ruta: RUTA,
    esquema: z.object({ id: z.uuid() }),
    entrada: { id },
    entidad: "la baja",
    etiquetas: [],
    mensajeOk: "Baja aprobada. Ya se descontó del almacén.",
    hacer: async ({ id }, { supabase }) => {
      const { error } = await supabase.rpc("aprobar_baja", { p_id: id });
      return { error };
    },
  });
}

export async function rechazarBaja(id: string, fd: FormData): Promise<EstadoAccion> {
  return ejecutarAccion({
    ruta: RUTA,
    esquema: z.object({
      id: z.uuid(),
      comentario: z.string().trim().min(1, { error: "Escribe por qué la rechazas." }).max(300),
    }),
    entrada: { id, comentario: fd.get("comentario") ?? "" },
    entidad: "la baja",
    etiquetas: [],
    mensajeOk: "Baja rechazada. El ingeniero verá tu comentario.",
    hacer: async ({ id, comentario }, { supabase }) => {
      const { error } = await supabase.rpc("rechazar_baja", { p_id: id, p_comentario: comentario });
      return { error };
    },
  });
}
```

> `cantidad: Number(linea.cantidad)` es la única vez en F5 que una cantidad pasa por `number`, y es
> porque `supabase-js` tipa la columna `numeric` como `number` en un `insert` directo. El texto ya
> viene validado con como mucho cuatro decimales (`/^\d{1,8}(\.\d{1,4})?$/`), que `number`
> representa sin error y Postgres guarda en `numeric(14,4)` exacto. No se hace ninguna cuenta con
> él.

### Paso 3 — Aprobar o rechazar, en pantalla

- [ ] Crear `src/components/panel/resolver-baja.tsx`:

```tsx
"use client";

import { Check, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { type FormEvent, useState, useTransition } from "react";

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import type { EstadoAccion } from "@/lib/panel/accion";

import { CLASE_CONTROL } from "./campo";

export function ResolverBaja({
  descripcion,
  aprobar,
  rechazar,
}: {
  /** «5 kg de Azúcar» */
  descripcion: string;
  aprobar: () => Promise<EstadoAccion>;
  rechazar: (fd: FormData) => Promise<EstadoAccion>;
}) {
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [abierto, setAbierto] = useState(false);
  const [pendiente, iniciar] = useTransition();
  const router = useRouter();

  const ejecutar = (paso: () => Promise<EstadoAccion>) =>
    iniciar(async () => {
      const r = await paso();
      if (r.estado === "ok") {
        setAbierto(false);
        router.refresh();
      } else if (r.estado === "error") {
        setMensaje(r.mensaje);
      }
    });

  function enviarRechazo(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const datos = new FormData(evento.currentTarget);
    ejecutar(() => rechazar(datos));
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2">
        <button
          type="button"
          className="boton-cta"
          disabled={pendiente}
          onClick={() => ejecutar(aprobar)}
          aria-label={`Aprobar la baja de ${descripcion}`}
        >
          <Check aria-hidden className="size-5" /> Aprobar
        </button>
        <AlertDialog open={abierto} onOpenChange={setAbierto}>
          <AlertDialogTrigger asChild>
            <button
              type="button"
              className="boton-linea"
              aria-label={`Rechazar la baja de ${descripcion}`}
            >
              <X aria-hidden className="size-5" /> Rechazar
            </button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <form onSubmit={enviarRechazo} className="flex flex-col gap-4">
              <AlertDialogHeader>
                <AlertDialogTitle>¿Rechazar la baja de {descripcion}?</AlertDialogTitle>
                <AlertDialogDescription>
                  No se descuenta nada. Quien la pidió verá tu comentario.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <label className="flex flex-col gap-1 text-sm">
                <span>Comentario</span>
                <textarea name="comentario" rows={2} required className={CLASE_CONTROL} />
              </label>
              <AlertDialogFooter>
                <AlertDialogCancel className="boton-linea">Cancelar</AlertDialogCancel>
                <button type="submit" className="boton-cta" disabled={pendiente}>
                  Rechazar
                </button>
              </AlertDialogFooter>
            </form>
          </AlertDialogContent>
        </AlertDialog>
      </div>
      {mensaje ? (
        <p role="alert" className="text-destructive text-sm">
          {mensaje}
        </p>
      ) : null}
    </div>
  );
}
```

### Paso 4 — Pantallas

- [ ] Crear `src/app/(admin)/admin/insumos/bajas/nueva/formulario-baja.tsx`:

```tsx
"use client";

import { BarraGuardar } from "@/components/panel/barra-guardar";
import { Campo } from "@/components/panel/campo";
import { EditorLineas } from "@/components/panel/editor-lineas";
import { FormularioPanel } from "@/components/panel/formulario-panel";
import { pedirBaja } from "@/lib/acciones/bajas";
import { NOMBRE_MOTIVO } from "@/lib/insumos/kardex";
import type { InsumoParaLinea } from "@/lib/insumos/lineas";
import { claveDeBorrador } from "@/lib/panel/borrador";
import { MOTIVOS, validarBaja } from "@/lib/validaciones/baja";

const VOLVER = "/admin/insumos/bajas";

export function FormularioBaja({ insumos }: { insumos: InsumoParaLinea[] }) {
  return (
    <FormularioPanel
      clave={claveDeBorrador("baja", null)}
      accion={pedirBaja}
      validar={validarBaja}
      destino={() => VOLVER}
    >
      <EditorLineas tipo="baja" insumos={insumos} unaSola />
      <Campo nombre="motivo_baja" etiqueta="Motivo">
        {(p) => (
          <select {...p} defaultValue="">
            <option value="">Elige…</option>
            {MOTIVOS.map((m) => (
              <option key={m} value={m}>
                {NOMBRE_MOTIVO[m]}
              </option>
            ))}
          </select>
        )}
      </Campo>
      <Campo nombre="observacion" etiqueta="Qué pasó">
        {(p) => <textarea {...p} rows={2} />}
      </Campo>
      <BarraGuardar volver={VOLVER} />
    </FormularioPanel>
  );
}
```

- [ ] Crear `src/app/(admin)/admin/insumos/bajas/nueva/page.tsx`:

```tsx
import { Suspense } from "react";

import { EncabezadoPanel } from "@/components/panel/encabezado-panel";
import { exigirAcceso } from "@/lib/auth/sesion";

import { insumosParaLineas } from "../../datos-movimiento";
import { FormularioBaja } from "./formulario-baja";

export default function PedirBaja() {
  return (
    <>
      <EncabezadoPanel
        titulo="Pedir baja"
        descripcion="Lo que se perdió, venció o se devolvió. Se descuenta cuando un administrador lo apruebe."
        volver={{ ruta: "/admin/insumos/bajas", nombre: "Bajas" }}
      />
      <Suspense fallback={<p className="text-muted-foreground text-sm">Cargando…</p>}>
        <Formulario />
      </Suspense>
    </>
  );
}

async function Formulario() {
  await exigirAcceso("/admin/insumos/bajas/nueva");
  return <FormularioBaja insumos={await insumosParaLineas()} />;
}
```

- [ ] Crear `src/app/(admin)/admin/insumos/bajas/page.tsx`:

```tsx
import { Plus } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";

import { EncabezadoPanel } from "@/components/panel/encabezado-panel";
import { ResolverBaja } from "@/components/panel/resolver-baja";
import { aprobarBaja, rechazarBaja } from "@/lib/acciones/bajas";
import { exigirAcceso } from "@/lib/auth/sesion";
import { NOMBRE_MOTIVO } from "@/lib/insumos/kardex";
import { formatearCantidad } from "@/lib/insumos/unidades";
import { formatearFechaLima } from "@/lib/panel/hora-lima";
import { crearClienteServidor } from "@/lib/supabase/servidor";

const ESTADO = { pendiente: "Pendiente", aprobada: "Aprobada", rechazada: "Rechazada" } as const;

export default function Bajas() {
  return (
    <>
      <EncabezadoPanel
        titulo="Bajas"
        volver={{ ruta: "/admin/insumos", nombre: "Insumos" }}
        accion={
          <Link href="/admin/insumos/bajas/nueva" className="boton-cta">
            <Plus aria-hidden className="size-5" /> Pedir baja
          </Link>
        }
      />
      <Suspense fallback={<p className="text-muted-foreground text-sm">Cargando…</p>}>
        <Listas />
      </Suspense>
    </>
  );
}

async function Listas() {
  const sesion = await exigirAcceso("/admin/insumos/bajas");
  const esAdministracion = sesion.rol === "superadmin" || sesion.rol === "administrador";
  const supabase = await crearClienteServidor();
  const { data, error } = await supabase
    .from("solicitudes_baja")
    .select(
      "id, cantidad, motivo_baja, observacion, estado, comentario_rechazo, created_at, solicitado_por, insumos(nombre), unidades_medida(codigo)",
    )
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) return <p role="alert">No se pudieron cargar las bajas. Recarga la página.</p>;

  const describir = (b: (typeof data)[number]) =>
    `${formatearCantidad(Number(b.cantidad))} ${b.unidades_medida?.codigo ?? ""} de ${b.insumos?.nombre ?? ""}`;
  const pendientes = data.filter((b) => b.estado === "pendiente");
  const resto = esAdministracion
    ? data.filter((b) => b.estado !== "pendiente")
    : data.filter((b) => b.solicitado_por === sesion.usuarioId);

  return (
    <>
      {esAdministracion ? (
        <section aria-labelledby="por-aprobar" className="mb-6">
          <h2 id="por-aprobar" className="mb-2 font-semibold">
            Por aprobar
          </h2>
          {pendientes.length === 0 ? (
            <p className="text-muted-foreground text-sm">No hay bajas esperando.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {pendientes.map((b) => (
                <li
                  key={b.id}
                  className="bg-card flex flex-col gap-2 rounded-xl border p-3"
                  data-baja={b.id}
                >
                  <p className="font-semibold">{describir(b)}</p>
                  <p className="text-sm">
                    {NOMBRE_MOTIVO[b.motivo_baja]} · {b.observacion}
                  </p>
                  <p className="text-muted-foreground text-sm">
                    Pedida el {formatearFechaLima(b.created_at)}
                  </p>
                  <ResolverBaja
                    descripcion={describir(b)}
                    aprobar={aprobarBaja.bind(null, b.id)}
                    rechazar={rechazarBaja.bind(null, b.id)}
                  />
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : null}

      <section aria-labelledby="historial">
        <h2 id="historial" className="mb-2 font-semibold">
          {esAdministracion ? "Resueltas" : "Tus bajas"}
        </h2>
        {resto.length === 0 ? (
          <p className="text-muted-foreground text-sm">Todavía no hay ninguna.</p>
        ) : (
          <ul
            aria-label={esAdministracion ? "Bajas resueltas" : "Tus bajas"}
            className="flex flex-col gap-2"
          >
            {resto.map((b) => (
              <li key={b.id} className="bg-card flex flex-col gap-1 rounded-xl border p-3 text-sm">
                <p className="font-semibold">{describir(b)}</p>
                <p>
                  {ESTADO[b.estado as keyof typeof ESTADO]} · {NOMBRE_MOTIVO[b.motivo_baja]} ·{" "}
                  {formatearFechaLima(b.created_at)}
                </p>
                {b.comentario_rechazo ? <p>Comentario: {b.comentario_rechazo}</p> : null}
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
```

- [ ] En `src/app/(admin)/admin/insumos/page.tsx`, añadir a `REGISTRAR`
      `{ ruta: "/admin/insumos/bajas/nueva", nombre: "Pedir baja" }`, y junto al enlace a
      Proveedores, uno a `/admin/insumos/bajas` con el texto «Bajas».

### Paso 5 — Avisos en el inicio

- [ ] En `src/app/(admin)/admin/page.tsx`, dentro de `contarAvisos`, añadir **antes** del bloque
      `if (rol === "ingeniero")`:

```ts
if (rol === "superadmin" || rol === "administrador" || rol === "ingeniero") {
  const [{ count: bajo }, { count: vencer }] = await Promise.all([
    supabase
      .from("existencias_insumo")
      .select("id", { count: "exact", head: true })
      .eq("activo", true)
      .eq("bajo_minimo", true),
    supabase
      .from("existencias_insumo")
      .select("id", { count: "exact", head: true })
      .eq("activo", true)
      .eq("por_vencer", true),
  ]);
  if (bajo && bajo > 0) {
    avisos.push({
      clave: "insumos-bajo-minimo",
      texto: `${bajo} ${bajo === 1 ? "insumo está" : "insumos están"} bajo el mínimo`,
      ruta: "/admin/insumos?ver=bajo",
    });
  }
  if (vencer && vencer > 0) {
    avisos.push({
      clave: "insumos-por-vencer",
      texto: `${vencer} ${vencer === 1 ? "insumo tiene" : "insumos tienen"} algo por vencer`,
      ruta: "/admin/insumos?ver=vencer",
    });
  }
}
```

y, dentro del bloque de superadmin/administrador:

```ts
const { count: bajas } = await supabase
  .from("solicitudes_baja")
  .select("id", { count: "exact", head: true })
  .eq("estado", "pendiente");
if (bajas && bajas > 0) {
  avisos.unshift({
    clave: "bajas-pendientes",
    texto: `${bajas} ${bajas === 1 ? "baja espera" : "bajas esperan"} tu aprobación`,
    ruta: "/admin/insumos/bajas",
  });
}
```

y, dentro del bloque del ingeniero:

```ts
const { count: rechazadas } = await supabase
  .from("solicitudes_baja")
  .select("id", { count: "exact", head: true })
  .eq("estado", "rechazada")
  .eq("solicitado_por", usuarioId)
  .gte("resuelto_en", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());
if (rechazadas && rechazadas > 0) {
  avisos.push({
    clave: "bajas-rechazadas",
    texto: `${rechazadas} ${rechazadas === 1 ? "baja tuya fue rechazada" : "bajas tuyas fueron rechazadas"} esta semana`,
    ruta: "/admin/insumos/bajas",
  });
}
```

(`contarAvisos` corre dentro del `<Suspense>` y después de `exigirAcceso`, así que `Date.now()`
no toca el prerenderizado. Actualizar su comentario: «T5 de F5, las de insumos y bajas».)

### Paso 6 — Pruebas de navegador

- [ ] Crear `e2e/ayudas/insumos.ts`:

```ts
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { supabaseLocal } from "./supabase-local";
import { crearUsuario } from "./usuarios";

/** Una sesión real de la API con un usuario nuevo del rol. */
export async function sesionDeApi(rol: string): Promise<SupabaseClient> {
  const { apiUrl, anonKey } = supabaseLocal();
  const usuario = await crearUsuario(rol);
  const cliente = createClient(apiUrl, anonKey, { auth: { persistSession: false } });
  const { error } = await cliente.auth.signInWithPassword({
    email: usuario.correo,
    password: usuario.clave,
  });
  if (error) throw new Error(`No se pudo entrar como ${rol}: ${error.message}`);
  return cliente;
}

/**
 * Sube el saldo de un insumo de la semilla con un conteo de la administración.
 * Se usa para que una prueba tenga stock sin depender de lo que dejó otra.
 */
export async function sumarStock(nombreInsumo: string, cantidadBase: number): Promise<void> {
  const administracion = await sesionDeApi("administrador");
  const { data: insumo, error } = await administracion
    .from("existencias_insumo")
    .select("id, cantidad_base")
    .eq("nombre", nombreInsumo)
    .single();
  if (error) throw new Error(`No se encontró ${nombreInsumo}: ${error.message}`);
  const { error: errorConteo } = await administracion.rpc("registrar_conteo", {
    p_lineas: [
      { insumo_id: insumo.id, contado: String(Number(insumo.cantidad_base) + cantidadBase) },
    ],
    p_observacion: "Stock para una prueba E2E",
  });
  if (errorConteo) throw new Error(`No se pudo sumar stock: ${errorConteo.message}`);
}
```

- [ ] En `e2e/insumos-concurrencia.spec.ts`, sustituir la función local `sesion` por
      `sesionDeApi` de esta ayuda (una sola forma de abrir sesiones de API en toda la suite).

- [ ] Añadir a `RUTAS_DEL_PANEL`: `"/admin/insumos/bajas"`, `"/admin/insumos/bajas/nueva"`.

- [ ] Crear `e2e/panel-bajas.spec.ts`:

```ts
import { expect, test } from "@playwright/test";

import { sumarStock } from "./ayudas/insumos";
import { entrarComo } from "./ayudas/sesion";
import { borrarUsuario } from "./ayudas/usuarios";

test.beforeEach(({}, info) => {
  test.skip(info.project.name !== "movil", "escribe en la sal de la semilla");
});

async function pedir(page: import("@playwright/test").Page, observacion: string) {
  await page.goto("/admin/insumos/bajas/nueva");
  await page.getByLabel("Insumo").selectOption({ label: "Sal" });
  await page.getByLabel("Cantidad").fill("2");
  await page.getByLabel("Motivo").selectOption({ label: "Merma o desperdicio" });
  await page.getByLabel("Qué pasó").fill(observacion);
  await page.getByRole("button", { name: "Guardar" }).click();
  await page.waitForURL("/admin/insumos/bajas");
}

test("el ingeniero pide, el administrador aprueba y el saldo baja", async ({ browser }) => {
  await sumarStock("Sal", 10);
  const paginaIngeniero = await (await browser.newContext()).newPage();
  const paginaAdmin = await (await browser.newContext()).newPage();
  const ingeniero = await entrarComo(paginaIngeniero, "ingeniero");
  const admin = await entrarComo(paginaAdmin, "administrador");
  const observacion = `Aprobar E2E ${Date.now()}`;
  try {
    await pedir(paginaIngeniero, observacion);
    await expect(paginaIngeniero.getByText("Pendiente").first()).toBeVisible();

    await paginaAdmin.goto("/admin");
    await paginaAdmin.locator('[data-aviso="bajas-pendientes"]').click();
    const tarjeta = paginaAdmin.getByRole("listitem").filter({ hasText: observacion });
    await tarjeta.getByRole("button", { name: /^Aprobar la baja de 2 kg de Sal/ }).click();
    await expect(tarjeta).toHaveCount(0);

    await paginaIngeniero.reload();
    await expect(
      paginaIngeniero.getByRole("list", { name: "Tus bajas" }).getByText("Aprobada").first(),
    ).toBeVisible();
  } finally {
    await borrarUsuario(ingeniero.id);
    await borrarUsuario(admin.id);
  }
});

test("un rechazo llega con su comentario", async ({ browser }) => {
  const paginaIngeniero = await (await browser.newContext()).newPage();
  const paginaAdmin = await (await browser.newContext()).newPage();
  const ingeniero = await entrarComo(paginaIngeniero, "ingeniero");
  const admin = await entrarComo(paginaAdmin, "administrador");
  const observacion = `Rechazar E2E ${Date.now()}`;
  try {
    await pedir(paginaIngeniero, observacion);

    await paginaAdmin.goto("/admin/insumos/bajas");
    const tarjeta = paginaAdmin.getByRole("listitem").filter({ hasText: observacion });
    await tarjeta.getByRole("button", { name: /^Rechazar la baja/ }).click();
    await paginaAdmin.getByLabel("Comentario").fill("Cuéntalo primero");
    await paginaAdmin.getByRole("button", { name: "Rechazar", exact: true }).click();
    await expect(tarjeta).toHaveCount(0);

    await paginaIngeniero.goto("/admin");
    await expect(paginaIngeniero.locator('[data-aviso="bajas-rechazadas"]')).toBeVisible();
    await paginaIngeniero.goto("/admin/insumos/bajas");
    await expect(paginaIngeniero.getByText("Comentario: Cuéntalo primero").first()).toBeVisible();
  } finally {
    await borrarUsuario(ingeniero.id);
    await borrarUsuario(admin.id);
  }
});
```

- [ ] `pnpm build` y, con el puerto 3000 libre:
      `pnpm exec playwright test e2e/panel-bajas.spec.ts e2e/insumos-concurrencia.spec.ts e2e/panel-accesibilidad.spec.ts`
      → verde.

### Paso 7 — Cerrar la tarea

- [ ] `pnpm typecheck && pnpm lint && pnpm format:check && pnpm test` sin avisos.
- [ ] A 375 px en la vista previa: pedir una baja desde el celular y aprobarla desde otro navegador.
- [ ] Commit y PR; Dan aplica 0038 antes de fusionar:

```bash
git add supabase/migrations/0038_solicitudes_baja.sql supabase/tests/0038_solicitudes_baja.test.sql \
        src/tipos/database.types.ts src/lib/validaciones/baja.ts src/lib/validaciones/baja.test.ts \
        src/lib/acciones/bajas.ts src/components/panel/resolver-baja.tsx \
        "src/app/(admin)/admin/insumos" "src/app/(admin)/admin/page.tsx" \
        e2e/ayudas/insumos.ts e2e/panel-bajas.spec.ts e2e/insumos-concurrencia.spec.ts \
        e2e/panel-accesibilidad.spec.ts
git commit -m "feat(insumos): bajas con solicitud, aprobación y aviso"
```

---

## Tarea 6 — Reportes y gráficos

**Rama:** `feat/f5-t6-reportes`

**Qué deja hecho:** `/admin/insumos/reportes` con los reportes de la ficha 7.8: **existencias y
valorización** (cuánto dinero hay en el almacén), **consumo por periodo**, **compras por
proveedor**, **mermas y pérdidas** y el **kárdex de un insumo**. Todos filtran por «Esta semana»,
«Este mes» o de fecha a fecha en días de Iquitos. Los tres de periodo llevan un gráfico de barras
con su **tabla accesible**, y los totales los suma la base.

**Archivos:**

- Crear: `supabase/migrations/0039_reportes_insumos.sql` + `supabase/tests/0039_reportes_insumos.test.sql`
- Modificar: `src/lib/insumos/periodo.ts` + `.test.ts` (`periodoNombrado`)
- Modificar: `src/lib/insumos/kardex.ts` (motivo `faltante_conteo`)
- Crear: `src/lib/insumos/reportes.ts` + `src/lib/insumos/formato-reporte.ts` + `.test.ts`
- Crear: `src/components/panel/grafico-barras.tsx`, `src/components/panel/tabla-reporte.tsx`,
  `src/components/panel/selector-periodo.tsx`
- Crear: `src/app/(admin)/admin/insumos/reportes/page.tsx`, `reportes/[reporte]/page.tsx`
- Modificar: `src/app/(admin)/admin/insumos/page.tsx` (enlace a Reportes), `package.json`
  (`recharts`)
- Crear: `e2e/panel-reportes.spec.ts`. Modificar: `e2e/panel-accesibilidad.spec.ts`

**Interfaces:**

- Consume (T1–T5): `movimiento_lotes` (costo real de cada salida), `saldos_lote`, `anula_a`,
  `kardex_insumo`, `leerPeriodo`, `hoyEnLima`, `sumarDias`, `NOMBRE_MOTIVO`, `NOMBRE_TIPO`,
  `detalleDeMovimiento`, `formatearCantidad`, `formatearFechaLima`, `sumarStock`, `sesionDeApi`.
- Produce (T7 lo usa entero):
  - Funciones SQL: `reporte_existencias()`, `reporte_consumo(date, date)`,
    `reporte_compras(date, date)` y `reporte_mermas(date, date)`
  - `src/lib/insumos/reportes.ts` (servidor):
    - `type SlugReporte = "existencias" | "consumo" | "compras" | "mermas" | "kardex"`
    - `type Columna = { clave: string; titulo: string; tipo: "texto" | "cantidad" | "soles" }`
    - `type Reporte = { slug: SlugReporte; titulo: string; subtitulo: string; columnas: Columna[]; filas: Record<string, string | number | null>[]; total: number | null; grafico: { nombre: string; valor: number }[] | null; unidadGrafico: "soles" | null }`
    - `const REPORTES: Record<SlugReporte, { titulo: string; descripcion: string; conPeriodo: boolean }>`
    - `leerReporte(slug: SlugReporte, periodo: Periodo, insumoId?: string): Promise<Reporte>`
  - `src/lib/insumos/formato-reporte.ts` (puro): `formatearSoles(n)` → «S/ 1,234.50»,
    `formatearCelda(valor, tipo)`
  - `periodoNombrado(nombre: "semana" | "mes", ahora: Date): Periodo`

### Paso 1 — Los reportes, en la base

- [ ] Crear `supabase/tests/0039_reportes_insumos.test.sql`:

```sql
-- Verifica las funciones de reportes (0039).
--
-- Lo que se defiende: que cada total salga del costo REAL de los lotes; que lo
-- anulado no cuente; que un movimiento de las 23:30 de Iquitos caiga en su día
-- de Iquitos; y que un faltante de conteo aparezca como pérdida.
begin;
select plan(11);

insert into auth.users (id, email, created_at, updated_at) values
  ('22222222-2222-2222-2222-222222222222', 'admin@pimpos.test',   now(), now()),
  ('33333333-3333-3333-3333-333333333333', 'inge@pimpos.test',    now(), now()),
  ('44444444-4444-4444-4444-444444444444', 'reparto@pimpos.test', now(), now());
update public.perfiles set rol = 'administrador', activo = true where id = '22222222-2222-2222-2222-222222222222';
update public.perfiles set rol = 'ingeniero',     activo = true where id = '33333333-3333-3333-3333-333333333333';
update public.perfiles set rol = 'repartidor',    activo = true where id = '44444444-4444-4444-4444-444444444444';

create temp table ref as
select
  (select id from public.insumos where nombre = 'Harina')            as harina,
  (select id from public.insumos where nombre = 'Azúcar')            as azucar,
  (select id from public.unidades_medida where codigo = 'saco')      as saco,
  (select id from public.unidades_medida where codigo = 'kg')        as kg,
  (select id from public.proveedores where nombre = 'Comercial FOX') as fox,
  (now() at time zone 'America/Lima')::date                          as hoy;
grant select on ref to authenticated;

-- Dos lotes de harina a distinto precio: 100 kg a S/ 3 y 50 kg a S/ 3.20.
insert into public.movimientos_insumo
  (tipo, insumo_id, cantidad, unidad_id, responsable_id, proveedor_id, documento_tipo, precio_unitario)
select 'ingreso', harina, 2, saco, '33333333-3333-3333-3333-333333333333', fox, 'boleta', 150 from ref;
insert into public.movimientos_insumo
  (tipo, insumo_id, cantidad, unidad_id, responsable_id, proveedor_id, documento_tipo, precio_unitario)
select 'ingreso', harina, 1, saco, '33333333-3333-3333-3333-333333333333', fox, 'boleta', 160 from ref;
-- Una compra anulada no cuenta.
insert into public.movimientos_insumo
  (tipo, insumo_id, cantidad, unidad_id, responsable_id, proveedor_id, documento_tipo, precio_unitario)
select 'ingreso', azucar, 1, saco, '33333333-3333-3333-3333-333333333333', fox, 'boleta', 120 from ref;
insert into public.movimientos_insumo (tipo, anula_a, insumo_id, cantidad, unidad_id, responsable_id, observacion)
select 'anulacion', m.id, m.insumo_id, 1, m.unidad_id, '22222222-2222-2222-2222-222222222222', 'Boleta de otro local'
  from public.movimientos_insumo m where m.insumo_id = (select azucar from ref) and m.tipo = 'ingreso';

-- Consumo de 120 kg: 100 a S/ 3 + 20 a S/ 3.20 = S/ 364. A las 23:30 de ayer en Iquitos.
insert into public.movimientos_insumo
  (tipo, insumo_id, cantidad, unidad_id, responsable_id, origen_consumo, destino_lote, area_turno, ocurrido_en)
select 'consumo', harina, 120, kg, '33333333-3333-3333-3333-333333333333', 'produccion', 'Pan', 'Noche',
       ((hoy - 1) + time '23:30') at time zone 'America/Lima'
from ref;

-- Una baja de 5 kg (S/ 16) y un faltante de conteo de 2 kg (S/ 6.40).
insert into public.movimientos_insumo
  (tipo, insumo_id, cantidad, unidad_id, responsable_id, motivo_baja, autorizado_por)
select 'baja', harina, 5, kg, '22222222-2222-2222-2222-222222222222', 'merma', '22222222-2222-2222-2222-222222222222' from ref;
insert into public.movimientos_insumo (tipo, sentido, insumo_id, cantidad, unidad_id, responsable_id, observacion)
select 'ajuste', -1, harina, 2, kg, '22222222-2222-2222-2222-222222222222', 'Conteo semanal' from ref;

set local role authenticated;
set local request.jwt.claims = '{"sub": "33333333-3333-3333-3333-333333333333", "rol": "ingeniero"}';

select is(
  (select costo from public.reporte_consumo((select hoy - 1 from ref), (select hoy - 1 from ref))
    where insumo_id = (select harina from ref)),
  364.00::numeric, 'el consumo cuesta lo que costaron sus lotes: 100 × 3 + 20 × 3.20'
);
select is(
  (select count(*)::int from public.reporte_consumo((select hoy from ref), (select hoy from ref))),
  0, 'el consumo de las 23:30 de ayer no cae en hoy'
);
select is(
  (select sum(costo) from public.reporte_compras((select hoy from ref), (select hoy from ref))),
  460.00::numeric, 'las compras suman 300 + 160; la anulada no cuenta'
);
select is(
  (select cantidad_base from public.reporte_compras((select hoy from ref), (select hoy from ref))
    where insumo = 'Harina'),
  150.0::numeric, 'la harina comprada son 150 kg'
);
select is(
  (select costo from public.reporte_mermas((select hoy from ref), (select hoy from ref))
    where motivo = 'merma'),
  16.00::numeric, 'la merma de 5 kg vale S/ 16'
);
select is(
  (select costo from public.reporte_mermas((select hoy from ref), (select hoy from ref))
    where motivo = 'faltante_conteo'),
  6.40::numeric, 'y el faltante de conteo aparece como pérdida: S/ 6.40'
);
select is(
  (select cantidad_base from public.reporte_existencias() where insumo_id = (select harina from ref)),
  23.0::numeric, 'quedan 150 − 120 − 5 − 2 = 23 kg'
);
select is(
  (select valor from public.reporte_existencias() where insumo_id = (select harina from ref)),
  73.60::numeric, 'que valen 23 × 3.20 (el lote barato ya se gastó)'
);
select is(
  (select sin_costo from public.reporte_existencias() where insumo_id = (select harina from ref)),
  false, 'y todos sus lotes tienen costo'
);

set local request.jwt.claims = '{"sub": "44444444-4444-4444-4444-444444444444", "rol": "repartidor"}';
select is((select count(*)::int from public.reporte_existencias()), 0, 'el repartidor no ve existencias');
select is((select count(*)::int from public.reporte_mermas((select hoy from ref), (select hoy from ref))), 0,
  'ni mermas');
reset role;

select * from finish();
rollback;
```

> Con FEFO sin fechas sale primero el lote más antiguo. El consumo, con `ocurrido_en` de ayer, se
> **registra** después de las compras de hoy y sale de sus lotes: el reporte de consumo lo cuenta
> ayer y el de compras hoy, que es la verdad del registro (ver la decisión del kárdex en T4).

- [ ] `supabase test db` → FALLA `0039`.

- [ ] Crear `supabase/migrations/0039_reportes_insumos.sql`:

```sql
-- =============================================================================
-- 0039_reportes_insumos.sql
-- Los reportes de la ficha 7.8, calculados por la base (F5, tarea 6).
--
-- Tres reglas comunes:
--   · Días de Iquitos: `(ocurrido_en at time zone 'America/Lima')::date`.
--   · Lo anulado no cuenta: ni el original ni su anulación.
--   · El dinero sale de `movimiento_lotes.costo_unitario`, el costo del lote del
--     que salió de verdad cada kilo (decisión 5), nunca de un promedio.
-- Todas `security invoker`: la RLS de insumos decide quién ve qué.
-- =============================================================================

create or replace function app.vigente(p_id uuid)
returns boolean
language sql
stable
set search_path = ''
as $$
  select not exists (select 1 from public.movimientos_insumo a where a.anula_a = p_id);
$$;
grant execute on function app.vigente(uuid) to authenticated;

create or replace function app.dia_lima(p timestamptz)
returns date
language sql
immutable
set search_path = ''
as $$
  select (p at time zone 'America/Lima')::date;
$$;
grant execute on function app.dia_lima(timestamptz) to authenticated;

-- Existencias y valorización ---------------------------------------------------
create or replace function public.reporte_existencias()
returns table (
  insumo_id           uuid,
  nombre              text,
  unidad              text,
  cantidad_base       numeric,
  stock_minimo        numeric,
  valor               numeric,
  sin_costo           boolean,
  proximo_vencimiento date
)
language sql
stable
security invoker
set search_path = ''
as $$
  select i.id, i.nombre, u.codigo,
         coalesce(sum(sl.cantidad_base), 0),
         i.stock_minimo,
         round(coalesce(sum(sl.cantidad_base * l.costo_unitario), 0), 2),
         coalesce(bool_or(sl.cantidad_base > 0 and l.costo_unitario is null), false),
         min(l.fecha_vencimiento) filter (where sl.cantidad_base > 0)
    from public.insumos i
    join public.unidades_medida u on u.id = i.unidad_base_id
    left join public.saldos_lote sl on sl.insumo_id = i.id
    left join public.lotes_insumo l on l.id = sl.lote_id
   where i.deleted_at is null and i.activo
   group by i.id, i.nombre, u.codigo, i.stock_minimo
   order by i.nombre;
$$;

-- Consumo por periodo ----------------------------------------------------------
create or replace function public.reporte_consumo(p_desde date, p_hasta date)
returns table (insumo_id uuid, nombre text, unidad text, cantidad_base numeric, costo numeric)
language sql
stable
security invoker
set search_path = ''
as $$
  select i.id, i.nombre, u.codigo,
         sum(ml.cantidad_base),
         round(sum(ml.cantidad_base * coalesce(ml.costo_unitario, 0)), 2)
    from public.movimientos_insumo m
    join public.movimiento_lotes ml on ml.movimiento_id = m.id
    join public.insumos i on i.id = m.insumo_id
    join public.unidades_medida u on u.id = i.unidad_base_id
   where m.tipo = 'consumo'
     and app.vigente(m.id)
     and app.dia_lima(m.ocurrido_en) between p_desde and p_hasta
   group by i.id, i.nombre, u.codigo
   order by 5 desc, 2;
$$;

-- Compras por proveedor --------------------------------------------------------
create or replace function public.reporte_compras(p_desde date, p_hasta date)
returns table (proveedor text, insumo text, unidad text, cantidad_base numeric, costo numeric, documentos bigint)
language sql
stable
security invoker
set search_path = ''
as $$
  select p.nombre, i.nombre, u.codigo,
         -- De movimiento_lotes y no del movimiento: si algún día un ingreso se
         -- repartiera en dos lotes, sumar el del movimiento lo contaría dos veces.
         sum(ml.cantidad_base),
         round(sum(ml.cantidad_base * coalesce(ml.costo_unitario, 0)), 2),
         count(distinct lower(btrim(m.documento_numero)))
    from public.movimientos_insumo m
    join public.movimiento_lotes ml on ml.movimiento_id = m.id
    join public.proveedores p on p.id = m.proveedor_id
    join public.insumos i on i.id = m.insumo_id
    join public.unidades_medida u on u.id = i.unidad_base_id
   where m.tipo = 'ingreso'
     and app.vigente(m.id)
     and app.dia_lima(m.ocurrido_en) between p_desde and p_hasta
   group by p.nombre, i.nombre, u.codigo
   order by 1, 5 desc;
$$;

-- Mermas y pérdidas: bajas aprobadas + faltantes encontrados al contar ---------
create or replace function public.reporte_mermas(p_desde date, p_hasta date)
returns table (motivo text, insumo text, unidad text, cantidad_base numeric, costo numeric)
language sql
stable
security invoker
set search_path = ''
as $$
  select case when m.tipo = 'baja' then m.motivo_baja::text else 'faltante_conteo' end,
         i.nombre, u.codigo,
         sum(ml.cantidad_base),
         round(sum(ml.cantidad_base * coalesce(ml.costo_unitario, 0)), 2)
    from public.movimientos_insumo m
    join public.movimiento_lotes ml on ml.movimiento_id = m.id
    join public.insumos i on i.id = m.insumo_id
    join public.unidades_medida u on u.id = i.unidad_base_id
   where (m.tipo = 'baja' or (m.tipo = 'ajuste' and m.sentido = -1))
     and app.vigente(m.id)
     and app.dia_lima(m.ocurrido_en) between p_desde and p_hasta
   group by 1, i.nombre, u.codigo
   order by 5 desc;
$$;

revoke execute on function public.reporte_existencias()          from public, anon;
revoke execute on function public.reporte_consumo(date, date)    from public, anon;
revoke execute on function public.reporte_compras(date, date)    from public, anon;
revoke execute on function public.reporte_mermas(date, date)     from public, anon;
grant execute on function public.reporte_existencias()           to authenticated;
grant execute on function public.reporte_consumo(date, date)     to authenticated;
grant execute on function public.reporte_compras(date, date)     to authenticated;
grant execute on function public.reporte_mermas(date, date)      to authenticated;
```

> Sin índice por día de Iquitos, cada reporte recorre los movimientos del insumo o del tipo. Con el
> volumen de una panadería (decenas de movimientos al día) sobra por años; si algún día pesa, el
> índice sobre `app.dia_lima(ocurrido_en)` es posible porque la función es `immutable`.

- [ ] `supabase db reset && supabase test db` → todo en verde. Después `subir-imagenes.sh` y
      `pnpm supabase:tipos`.

### Paso 2 — Periodos con nombre y formato, lógica pura

- [ ] Añadir a `src/lib/insumos/periodo.test.ts`:

```ts
describe("periodoNombrado", () => {
  // Domingo 11/10/2026 a las 21:00 en Iquitos.
  it("esta semana va del lunes a hoy", () => {
    expect(periodoNombrado("semana", AHORA)).toEqual({ desde: "2026-10-05", hasta: "2026-10-11" });
  });

  it("este mes va del día 1 a hoy", () => {
    expect(periodoNombrado("mes", AHORA)).toEqual({ desde: "2026-10-01", hasta: "2026-10-11" });
  });
});
```

(importar `periodoNombrado`).

- [ ] Crear `src/lib/insumos/formato-reporte.test.ts`:

```ts
import { describe, expect, it } from "vitest";

import { formatearCelda, formatearSoles } from "./formato-reporte";

describe("formatearSoles", () => {
  it("con separador de miles y dos decimales, como en una boleta", () => {
    expect(formatearSoles(1234.5)).toBe("S/ 1,234.50");
    expect(formatearSoles(0.1)).toBe("S/ 0.10");
  });
});

describe("formatearCelda", () => {
  it("según el tipo de columna", () => {
    expect(formatearCelda(12.5, "cantidad")).toBe("12.5");
    expect(formatearCelda(364, "soles")).toBe("S/ 364.00");
    expect(formatearCelda("Harina", "texto")).toBe("Harina");
    expect(formatearCelda(null, "soles")).toBe("—");
  });
});
```

- [ ] `pnpm test -- src/lib/insumos/` → FALLAN.

- [ ] Añadir a `src/lib/insumos/periodo.ts`:

```ts
/** «Esta semana» (lunes a hoy) o «Este mes» (día 1 a hoy), en días de Iquitos. */
export function periodoNombrado(nombre: "semana" | "mes", ahora: Date): Periodo {
  const hoy = hoyEnLima(ahora);
  if (nombre === "mes") return { desde: `${hoy.slice(0, 8)}01`, hasta: hoy };
  const diaSemana = new Date(`${hoy}T12:00:00.000Z`).getUTCDay(); // 0 = domingo
  const desdeLunes = (diaSemana + 6) % 7;
  return { desde: sumarDias(hoy, -desdeLunes), hasta: hoy };
}
```

- [ ] Crear `src/lib/insumos/formato-reporte.ts`:

```ts
import { formatearCantidad } from "./unidades";

export type TipoColumna = "texto" | "cantidad" | "soles";

/** Solo para enseñar: el total ya viene sumado por la base con `numeric`. */
export function formatearSoles(n: number): string {
  const [enteros, decimales] = n.toFixed(2).split(".");
  const conMiles = enteros!.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return `S/ ${conMiles}.${decimales}`;
}

export function formatearCelda(valor: string | number | null, tipo: TipoColumna): string {
  if (valor === null || valor === "") return "—";
  if (tipo === "soles") return formatearSoles(Number(valor));
  if (tipo === "cantidad") return formatearCantidad(Number(valor));
  return String(valor);
}
```

- [ ] En `src/lib/insumos/kardex.ts`, añadir a `NOMBRE_MOTIVO`: `faltante_conteo: "Faltó al contar",`.

- [ ] `pnpm test -- src/lib/insumos/` → PASAN.

### Paso 3 — Leer un reporte ya armado

Una sola función arma cada reporte con sus columnas, filas, total y datos del gráfico. La usan la
pantalla y, en T7, las descargas: así un Excel no puede decir otra cosa que la pantalla.

- [ ] Crear `src/lib/insumos/reportes.ts`:

```ts
import "server-only";

import { formatearFechaLima } from "@/lib/panel/hora-lima";
import { crearClienteServidor } from "@/lib/supabase/servidor";

import type { TipoColumna } from "./formato-reporte";
import { detalleDeMovimiento, NOMBRE_MOTIVO, NOMBRE_TIPO } from "./kardex";
import type { Periodo } from "./periodo";

export type SlugReporte = "existencias" | "consumo" | "compras" | "mermas" | "kardex";
export type Columna = { clave: string; titulo: string; tipo: TipoColumna };
export type Fila = Record<string, string | number | null>;
export type Reporte = {
  slug: SlugReporte;
  titulo: string;
  subtitulo: string;
  columnas: Columna[];
  filas: Fila[];
  total: number | null;
  grafico: { nombre: string; valor: number }[] | null;
  unidadGrafico: "soles" | null;
};

export const REPORTES: Record<
  SlugReporte,
  { titulo: string; descripcion: string; conPeriodo: boolean }
> = {
  existencias: {
    titulo: "Existencias y valorización",
    descripcion: "Cuánto hay de cada insumo y cuánto dinero hay en el almacén.",
    conPeriodo: false,
  },
  consumo: {
    titulo: "Consumo por periodo",
    descripcion: "Qué se usó y cuánto costó.",
    conPeriodo: true,
  },
  compras: {
    titulo: "Compras por proveedor",
    descripcion: "Qué se compró a cada proveedor y cuánto se pagó.",
    conPeriodo: true,
  },
  mermas: {
    titulo: "Mermas y pérdidas",
    descripcion: "Lo que se perdió, por motivo, y cuánto costó.",
    conPeriodo: true,
  },
  kardex: {
    titulo: "Kárdex de un insumo",
    descripcion: "Cada entrada y salida de un insumo, con lo que quedaba después.",
    conPeriodo: true,
  },
};

export function esSlugReporte(valor: string): valor is SlugReporte {
  return valor in REPORTES;
}

const n = (v: unknown) => (v === null || v === undefined ? 0 : Number(v));
const rango = (p: Periodo) =>
  `Del ${p.desde.split("-").reverse().join("/")} al ${p.hasta.split("-").reverse().join("/")}`;

/** Los diez con más costo, para que el gráfico se lea en un celular. */
const primeros = (datos: { nombre: string; valor: number }[]) =>
  [...datos].sort((a, b) => b.valor - a.valor).slice(0, 10);

export async function leerReporte(
  slug: SlugReporte,
  periodo: Periodo,
  insumoId?: string,
): Promise<Reporte> {
  const supabase = await crearClienteServidor();
  const { titulo } = REPORTES[slug];

  switch (slug) {
    case "existencias": {
      const { data, error } = await supabase.rpc("reporte_existencias");
      if (error) throw new Error(error.message);
      const filas = data.map((f) => ({
        insumo: f.nombre,
        cantidad: n(f.cantidad_base),
        unidad: f.unidad,
        minimo: n(f.stock_minimo),
        valor: f.sin_costo ? null : n(f.valor),
      }));
      return {
        slug,
        titulo,
        subtitulo: "Hoy",
        columnas: [
          { clave: "insumo", titulo: "Insumo", tipo: "texto" },
          { clave: "cantidad", titulo: "Hay", tipo: "cantidad" },
          { clave: "unidad", titulo: "Unidad", tipo: "texto" },
          { clave: "minimo", titulo: "Mínimo", tipo: "cantidad" },
          { clave: "valor", titulo: "Valor", tipo: "soles" },
        ],
        filas,
        total: data.reduce((s, f) => s + n(f.valor), 0),
        grafico: null,
        unidadGrafico: null,
      };
    }
    case "consumo": {
      const { data, error } = await supabase.rpc("reporte_consumo", {
        p_desde: periodo.desde,
        p_hasta: periodo.hasta,
      });
      if (error) throw new Error(error.message);
      return {
        slug,
        titulo,
        subtitulo: rango(periodo),
        columnas: [
          { clave: "insumo", titulo: "Insumo", tipo: "texto" },
          { clave: "cantidad", titulo: "Se usó", tipo: "cantidad" },
          { clave: "unidad", titulo: "Unidad", tipo: "texto" },
          { clave: "costo", titulo: "Costo", tipo: "soles" },
        ],
        filas: data.map((f) => ({
          insumo: f.nombre,
          cantidad: n(f.cantidad_base),
          unidad: f.unidad,
          costo: n(f.costo),
        })),
        total: data.reduce((s, f) => s + n(f.costo), 0),
        grafico: primeros(data.map((f) => ({ nombre: f.nombre, valor: n(f.costo) }))),
        unidadGrafico: "soles",
      };
    }
    case "compras": {
      const { data, error } = await supabase.rpc("reporte_compras", {
        p_desde: periodo.desde,
        p_hasta: periodo.hasta,
      });
      if (error) throw new Error(error.message);
      const porProveedor = new Map<string, number>();
      for (const f of data)
        porProveedor.set(f.proveedor, (porProveedor.get(f.proveedor) ?? 0) + n(f.costo));
      return {
        slug,
        titulo,
        subtitulo: rango(periodo),
        columnas: [
          { clave: "proveedor", titulo: "Proveedor", tipo: "texto" },
          { clave: "insumo", titulo: "Insumo", tipo: "texto" },
          { clave: "cantidad", titulo: "Cantidad", tipo: "cantidad" },
          { clave: "unidad", titulo: "Unidad", tipo: "texto" },
          { clave: "costo", titulo: "Pagado", tipo: "soles" },
        ],
        filas: data.map((f) => ({
          proveedor: f.proveedor,
          insumo: f.insumo,
          cantidad: n(f.cantidad_base),
          unidad: f.unidad,
          costo: n(f.costo),
        })),
        total: data.reduce((s, f) => s + n(f.costo), 0),
        grafico: primeros([...porProveedor].map(([nombre, valor]) => ({ nombre, valor }))),
        unidadGrafico: "soles",
      };
    }
    case "mermas": {
      const { data, error } = await supabase.rpc("reporte_mermas", {
        p_desde: periodo.desde,
        p_hasta: periodo.hasta,
      });
      if (error) throw new Error(error.message);
      const porMotivo = new Map<string, number>();
      for (const f of data) {
        const nombre = NOMBRE_MOTIVO[f.motivo] ?? f.motivo;
        porMotivo.set(nombre, (porMotivo.get(nombre) ?? 0) + n(f.costo));
      }
      return {
        slug,
        titulo,
        subtitulo: rango(periodo),
        columnas: [
          { clave: "motivo", titulo: "Motivo", tipo: "texto" },
          { clave: "insumo", titulo: "Insumo", tipo: "texto" },
          { clave: "cantidad", titulo: "Cantidad", tipo: "cantidad" },
          { clave: "unidad", titulo: "Unidad", tipo: "texto" },
          { clave: "costo", titulo: "Costo", tipo: "soles" },
        ],
        filas: data.map((f) => ({
          motivo: NOMBRE_MOTIVO[f.motivo] ?? f.motivo,
          insumo: f.insumo,
          cantidad: n(f.cantidad_base),
          unidad: f.unidad,
          costo: n(f.costo),
        })),
        total: data.reduce((s, f) => s + n(f.costo), 0),
        grafico: primeros([...porMotivo].map(([nombre, valor]) => ({ nombre, valor }))),
        unidadGrafico: "soles",
      };
    }
    case "kardex": {
      if (!insumoId) {
        return {
          slug,
          titulo,
          subtitulo: "Elige un insumo",
          columnas: [],
          filas: [],
          total: null,
          grafico: null,
          unidadGrafico: null,
        };
      }
      const [{ data: insumo }, { data, error }] = await Promise.all([
        supabase.from("insumos").select("nombre").eq("id", insumoId).maybeSingle(),
        supabase.rpc("kardex_insumo", {
          p_insumo: insumoId,
          p_desde: periodo.desde,
          p_hasta: periodo.hasta,
        }),
      ]);
      if (error) throw new Error(error.message);
      return {
        slug,
        titulo: `${titulo}: ${insumo?.nombre ?? ""}`,
        subtitulo: rango(periodo),
        columnas: [
          { clave: "fecha", titulo: "Fecha", tipo: "texto" },
          { clave: "movimiento", titulo: "Movimiento", tipo: "texto" },
          { clave: "detalle", titulo: "Detalle", tipo: "texto" },
          { clave: "cantidad", titulo: "Cantidad", tipo: "cantidad" },
          { clave: "saldo", titulo: "Queda", tipo: "cantidad" },
          { clave: "responsable", titulo: "Registró", tipo: "texto" },
        ],
        filas: data.map((m) => ({
          fecha: formatearFechaLima(m.ocurrido_en),
          movimiento: `${NOMBRE_TIPO[m.tipo] ?? m.tipo}${m.anulado ? " (anulado)" : ""}`,
          detalle: detalleDeMovimiento(m),
          cantidad: m.sentido * n(m.cantidad_base),
          saldo: n(m.saldo),
          responsable: m.responsable,
        })),
        total: null,
        grafico: null,
        unidadGrafico: null,
      };
    }
  }
}
```

> **El total que se enseña lo suma JavaScript** a partir de las filas que ya redondeó la base a dos
> decimales. Con dinero redondeado a céntimos y como mucho unas decenas de filas, la suma en
> `number` no pierde un céntimo, pero la regla del plan dice que el dinero se suma en la base. Si la
> revisión lo pide, se cambia por una fila de total que devuelva cada función (`grouping sets`). Se
> deja así a propósito, anotado aquí, porque la suma de filas redondeadas es exactamente lo que ve
> quien suma la tabla con una calculadora.

### Paso 4 — Gráfico, tabla y selector de periodo

- [ ] **Antes de escribir el gráfico, cargar la skill `dataviz`** (doc 03 §2 la asigna a los gráficos
      de F5) y aplicar lo que diga sobre color, ejes y texto alternativo. Lo de abajo es el punto de
      partida, no el resultado final.

- [ ] Instalar recharts: `npm view recharts peerDependencies` (debe admitir `react@^19`), después
      `pnpm add recharts`.

- [ ] Crear `src/components/panel/grafico-barras.tsx`:

```tsx
"use client";

import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { formatearSoles } from "@/lib/insumos/formato-reporte";

/**
 * Barras horizontales: los nombres de insumo son largos y a 375 px no caben
 * debajo de una barra vertical. El gráfico es decorativo para un lector de
 * pantalla (`aria-hidden`): la tabla de al lado dice lo mismo con números.
 */
export function GraficoBarras({
  datos,
  titulo,
}: {
  datos: { nombre: string; valor: number }[];
  titulo: string;
}) {
  if (datos.length === 0) return null;
  return (
    <figure className="tarjeta mb-4 p-3">
      <figcaption className="mb-2 text-sm font-semibold">{titulo}</figcaption>
      <div aria-hidden style={{ height: Math.max(160, datos.length * 36) }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={datos} layout="vertical" margin={{ left: 8, right: 16 }}>
            <XAxis type="number" hide />
            <YAxis type="category" dataKey="nombre" width={120} tick={{ fontSize: 12 }} />
            <Tooltip formatter={(v) => formatearSoles(Number(v))} />
            <Bar dataKey="valor" fill="var(--primary)" radius={[0, 6, 6, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </figure>
  );
}
```

- [ ] Crear `src/components/panel/tabla-reporte.tsx`:

```tsx
import { formatearCelda, formatearSoles } from "@/lib/insumos/formato-reporte";
import type { Reporte } from "@/lib/insumos/reportes";

/**
 * La tabla del reporte. En el celular cada fila es una tarjeta (restricción
 * global: nunca desplazamiento lateral); en escritorio, una tabla con `caption`.
 */
export function TablaReporte({ reporte }: { reporte: Reporte }) {
  const { columnas, filas, total, titulo } = reporte;
  if (filas.length === 0) {
    return (
      <p className="bg-card rounded-xl border p-6 text-center">No hay datos en ese periodo.</p>
    );
  }
  const [principal, ...resto] = columnas;
  return (
    <>
      <ul aria-label={titulo} className="flex flex-col gap-2 md:hidden">
        {filas.map((f, i) => (
          <li key={i} className="bg-card rounded-xl border p-3 text-sm">
            <p className="font-semibold">
              {formatearCelda(f[principal!.clave] ?? null, principal!.tipo)}
            </p>
            <dl className="grid grid-cols-2 gap-x-2">
              {resto.map((c) => (
                <div key={c.clave} className="contents">
                  <dt className="text-muted-foreground">{c.titulo}</dt>
                  <dd>{formatearCelda(f[c.clave] ?? null, c.tipo)}</dd>
                </div>
              ))}
            </dl>
          </li>
        ))}
      </ul>
      <table className="bg-card hidden w-full rounded-xl border text-sm md:table">
        <caption className="sr-only">{titulo}</caption>
        <thead>
          <tr>
            {columnas.map((c) => (
              <th
                key={c.clave}
                scope="col"
                className={`p-2 ${c.tipo === "texto" ? "text-left" : "text-right"}`}
              >
                {c.titulo}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {filas.map((f, i) => (
            <tr key={i} className="border-t">
              {columnas.map((c) => (
                <td
                  key={c.clave}
                  className={`p-2 ${c.tipo === "texto" ? "" : "text-right tabular-nums"}`}
                >
                  {formatearCelda(f[c.clave] ?? null, c.tipo)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {total !== null ? (
        <p className="mt-3 text-right text-lg font-semibold" data-total>
          Total: {formatearSoles(total)}
        </p>
      ) : null}
    </>
  );
}
```

> Un `<div className="contents">` entre `dl` y `dt/dd` es justo lo que axe marcó en F3
> (`definition-list`, trampa de `CLAUDE.md`). Un `div` directo con su `dt` y su `dd` sí vale; si
> axe protesta por `contents`, quitar la clase y darle al `div` `className="col-span-2 grid grid-cols-2"`.

- [ ] Crear `src/components/panel/selector-periodo.tsx`:

```tsx
import Link from "next/link";

import type { Periodo } from "@/lib/insumos/periodo";

/** Atajos y fechas libres. Es un formulario GET: el periodo vive en la URL y se puede compartir. */
export function SelectorPeriodo({
  ruta,
  periodo,
  semana,
  mes,
  extra,
}: {
  ruta: string;
  periodo: Periodo;
  semana: Periodo;
  mes: Periodo;
  /** Parámetros que el formulario conserva (el insumo del kárdex). */
  extra?: Record<string, string>;
}) {
  const enlace = (p: Periodo) => `${ruta}?${new URLSearchParams({ ...extra, ...p }).toString()}`;
  return (
    <div className="mb-4 flex flex-col gap-2">
      <div className="flex flex-wrap gap-2">
        <Link href={enlace(semana)} className="boton-linea">
          Esta semana
        </Link>
        <Link href={enlace(mes)} className="boton-linea">
          Este mes
        </Link>
      </div>
      <form className="flex flex-wrap items-end gap-2">
        {Object.entries(extra ?? {}).map(([k, v]) => (
          <input key={k} type="hidden" name={k} value={v} />
        ))}
        <label className="flex flex-col gap-1 text-sm">
          <span>Desde</span>
          <input
            type="date"
            name="desde"
            defaultValue={periodo.desde}
            className="border-input bg-card min-h-11 rounded-xl border px-3"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span>Hasta</span>
          <input
            type="date"
            name="hasta"
            defaultValue={periodo.hasta}
            className="border-input bg-card min-h-11 rounded-xl border px-3"
          />
        </label>
        <button type="submit" className="boton-linea">
          Ver
        </button>
      </form>
    </div>
  );
}
```

### Paso 5 — Pantallas

- [ ] Crear `src/app/(admin)/admin/insumos/reportes/page.tsx`:

```tsx
import Link from "next/link";

import { EncabezadoPanel } from "@/components/panel/encabezado-panel";
import { REPORTES } from "@/lib/insumos/reportes";

export default function Reportes() {
  return (
    <>
      <EncabezadoPanel titulo="Reportes" volver={{ ruta: "/admin/insumos", nombre: "Insumos" }} />
      <ul className="grid gap-2 sm:grid-cols-2">
        {Object.entries(REPORTES).map(([slug, r]) => (
          <li key={slug}>
            <Link
              href={`/admin/insumos/reportes/${slug}`}
              className="tarjeta flex min-h-20 flex-col justify-center p-4"
            >
              <span className="font-semibold">{r.titulo}</span>
              <span className="text-muted-foreground text-sm">{r.descripcion}</span>
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
```

> Esta página no lee la sesión ni datos: se prerenderiza, y el proxy protege la ruta. Si el revisor
> prefiere que toda página del panel llame a `exigirAcceso`, envolver la lista en un componente
> asíncrono dentro de `<Suspense>`, como las demás.

- [ ] Crear `src/app/(admin)/admin/insumos/reportes/[reporte]/page.tsx`:

```tsx
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { EncabezadoPanel } from "@/components/panel/encabezado-panel";
import { GraficoBarras } from "@/components/panel/grafico-barras";
import { SelectorPeriodo } from "@/components/panel/selector-periodo";
import { TablaReporte } from "@/components/panel/tabla-reporte";
import { exigirAcceso } from "@/lib/auth/sesion";
import { leerPeriodo, periodoNombrado } from "@/lib/insumos/periodo";
import { esSlugReporte, leerReporte, REPORTES } from "@/lib/insumos/reportes";
import { crearClienteServidor } from "@/lib/supabase/servidor";

type Props = PageProps<"/admin/insumos/reportes/[reporte]">;

export default function PaginaReporte({ params, searchParams }: Props) {
  return (
    <Suspense fallback={<p className="text-muted-foreground text-sm">Cargando…</p>}>
      <Contenido params={params} searchParams={searchParams} />
    </Suspense>
  );
}

async function Contenido({ params, searchParams }: Props) {
  const [{ reporte: slug }, filtros] = await Promise.all([params, searchParams]);
  if (!esSlugReporte(slug)) notFound();
  await exigirAcceso(`/admin/insumos/reportes/${slug}`);

  const ahora = new Date();
  const periodo = leerPeriodo(filtros, ahora, 30);
  const insumo = typeof filtros.insumo === "string" ? filtros.insumo : undefined;
  const reporte = await leerReporte(slug, periodo, insumo);
  const ruta = `/admin/insumos/reportes/${slug}`;

  let insumos: { id: string; nombre: string }[] = [];
  if (slug === "kardex") {
    const supabase = await crearClienteServidor();
    const { data } = await supabase
      .from("insumos")
      .select("id, nombre")
      .is("deleted_at", null)
      .order("nombre");
    insumos = data ?? [];
  }

  return (
    <>
      <EncabezadoPanel
        titulo={reporte.titulo}
        descripcion={`${REPORTES[slug].descripcion} ${reporte.subtitulo}.`}
        volver={{ ruta: "/admin/insumos/reportes", nombre: "Reportes" }}
      />
      {slug === "kardex" ? (
        <form className="mb-3 flex flex-wrap items-end gap-2">
          <label className="flex flex-col gap-1 text-sm">
            <span>Insumo</span>
            <select
              name="insumo"
              defaultValue={insumo ?? ""}
              className="border-input bg-card min-h-11 rounded-xl border px-3"
            >
              <option value="">Elige…</option>
              {insumos.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.nombre}
                </option>
              ))}
            </select>
          </label>
          <input type="hidden" name="desde" value={periodo.desde} />
          <input type="hidden" name="hasta" value={periodo.hasta} />
          <button type="submit" className="boton-linea">
            Ver
          </button>
        </form>
      ) : null}
      {REPORTES[slug].conPeriodo ? (
        <SelectorPeriodo
          ruta={ruta}
          periodo={periodo}
          semana={periodoNombrado("semana", ahora)}
          mes={periodoNombrado("mes", ahora)}
          extra={insumo ? { insumo } : undefined}
        />
      ) : null}
      {reporte.grafico ? (
        <GraficoBarras datos={reporte.grafico} titulo={`${reporte.titulo}, en soles`} />
      ) : null}
      <TablaReporte reporte={reporte} />
    </>
  );
}
```

- [ ] En `src/app/(admin)/admin/insumos/page.tsx`, junto a «Proveedores» y «Bajas», añadir el enlace
      «Reportes» a `/admin/insumos/reportes`.

### Paso 6 — Pruebas de navegador

- [ ] Añadir a `RUTAS_DEL_PANEL`: `"/admin/insumos/reportes"`, `"/admin/insumos/reportes/existencias"`,
      `"/admin/insumos/reportes/consumo"`, `"/admin/insumos/reportes/compras"`,
      `"/admin/insumos/reportes/mermas"`, `"/admin/insumos/reportes/kardex"`.

- [ ] Crear `e2e/panel-reportes.spec.ts`:

```ts
import { expect, test } from "@playwright/test";

import { sesionDeApi, sumarStock } from "./ayudas/insumos";
import { entrarComo } from "./ayudas/sesion";
import { borrarUsuario } from "./ayudas/usuarios";

test.beforeEach(({}, info) => {
  test.skip(info.project.name !== "movil", "escribe en el ajonjolí de la semilla");
});

test("un consumo de hoy aparece en el reporte con su costo", async ({ page }) => {
  // 10 kg de ajonjolí a S/ 8 el kg, y se consumen 2: S/ 16.
  const administracion = await sesionDeApi("administrador");
  const { data: insumo } = await administracion
    .from("existencias_insumo")
    .select("id, cantidad_base")
    .eq("nombre", "Ajonjolí")
    .single();
  await administracion.rpc("registrar_conteo", {
    p_lineas: [
      {
        insumo_id: insumo!.id,
        contado: String(Number(insumo!.cantidad_base) + 10),
        precio_unitario: "8",
      },
    ],
    p_observacion: "Stock para el reporte E2E",
  });
  const ingeniero = await sesionDeApi("ingeniero");
  const { data: kg } = await ingeniero
    .from("unidades_medida")
    .select("id")
    .eq("codigo", "kg")
    .single();
  const { error } = await ingeniero.rpc("registrar_consumo", {
    p_cabecera: {
      origen_consumo: "produccion",
      destino_lote: "Pan con ajonjolí",
      area_turno: "Mañana",
      observacion: "E2E",
    },
    p_lineas: [{ insumo_id: insumo!.id, cantidad: "2", unidad_id: kg!.id }],
  });
  expect(error).toBeNull();

  const usuario = await entrarComo(page, "administrador");
  try {
    await page.goto("/admin/insumos/reportes/consumo");
    await page.getByRole("link", { name: "Esta semana" }).click();
    const tarjeta = page
      .getByRole("list", { name: "Consumo por periodo" })
      .getByRole("listitem")
      .filter({ hasText: "Ajonjolí" });
    await expect(tarjeta).toBeVisible();
    // FEFO: si otra prueba dejó ajonjolí más barato antes, el costo cambia; se
    // comprueba que el costo exista y que el total lo incluya, no una cifra fija.
    await expect(tarjeta.getByText(/S\/ \d/)).toBeVisible();
    await expect(page.locator("[data-total]")).toContainText("S/");
  } finally {
    await borrarUsuario(usuario.id);
  }
});

test("existencias enseña el valor del almacén", async ({ page }) => {
  await sumarStock("Sal", 1);
  const usuario = await entrarComo(page, "ingeniero");
  try {
    await page.goto("/admin/insumos/reportes/existencias");
    await expect(
      page.getByRole("list", { name: "Existencias y valorización" }).getByText("Sal"),
    ).toBeVisible();
    await expect(page.locator("[data-total]")).toContainText("Total: S/");
  } finally {
    await borrarUsuario(usuario.id);
  }
});
```

- [ ] `pnpm build` y, con el puerto 3000 libre:
      `pnpm exec playwright test e2e/panel-reportes.spec.ts e2e/panel-accesibilidad.spec.ts` → verde.

### Paso 7 — Cerrar la tarea

- [ ] `pnpm typecheck && pnpm lint && pnpm format:check && pnpm test` sin avisos.
- [ ] **Comprobar que recharts no llegó al sitio público:** `pnpm build` y buscar `recharts` en los
      chunks de las rutas públicas (`grep -l recharts .next/static/chunks/*.js` y cruzar con el
      manifiesto de `/`). Solo puede aparecer en chunks del panel.
- [ ] A 375 px en la vista previa: los cuatro reportes con datos, el gráfico legible y la tabla en
      tarjetas.
- [ ] Commit y PR; Dan aplica 0039 antes de fusionar:

```bash
git add supabase/migrations/0039_reportes_insumos.sql supabase/tests/0039_reportes_insumos.test.sql \
        src/tipos/database.types.ts src/lib/insumos src/components/panel/grafico-barras.tsx \
        src/components/panel/tabla-reporte.tsx src/components/panel/selector-periodo.tsx \
        "src/app/(admin)/admin/insumos" package.json pnpm-lock.yaml \
        e2e/panel-reportes.spec.ts e2e/panel-accesibilidad.spec.ts
git commit -m "feat(insumos): reportes de existencias, consumo, compras, mermas y kárdex"
```

---

## Tarea 7 — Exportar a Excel y PDF

**Rama:** `feat/f5-t7-exportar`

**Qué deja hecho:** cada reporte tiene «Descargar Excel» y «Descargar PDF», con los mismos datos
que la pantalla (salen de la misma `leerReporte`), el título, el periodo y el total. El Excel lleva
números de verdad (se pueden sumar en la hoja) y el PDF usa la tipografía del sitio.

> **Primera en recortarse** (decisión 10): si el calendario aprieta, se hace solo el Excel (pasos
> 1, 2, 4 y 5 sin la parte del PDF) y el PDF pasa a pendiente declarado en el cierre.

**Archivos:**

- Crear: `src/lib/insumos/exportar-excel.ts` + `.test.ts`, `src/lib/insumos/exportar-pdf.tsx` + `.test.ts`,
  `src/lib/insumos/nombre-archivo.ts` + `.test.ts`
- Crear: `src/app/(admin)/admin/insumos/reportes/[reporte]/excel/route.ts`, `.../pdf/route.ts`
- Modificar: `src/app/(admin)/admin/insumos/reportes/[reporte]/page.tsx` (botones), `next.config.ts`
  (fuentes del PDF en la traza), `package.json` (`exceljs`, `@react-pdf/renderer`)
- Crear: `e2e/panel-exportar.spec.ts`

**Interfaces:**

- Consume (T6): `type Reporte`, `leerReporte`, `esSlugReporte`, `formatearCelda`, `formatearSoles`,
  `leerPeriodo`, `type Periodo`.
- Produce: `reporteAExcel(reporte: Reporte): Promise<Buffer>`,
  `reporteAPdf(reporte: Reporte): Promise<Buffer>`,
  `nombreDeArchivo(slug: string, periodo: Periodo | null, extension: "xlsx" | "pdf"): string`.

### Paso 1 — Dependencias

- [ ] `npm view exceljs peerDependencies` y `npm view @react-pdf/renderer peerDependencies`: el
      segundo tiene que admitir `react@^19`. Después: `pnpm add exceljs @react-pdf/renderer`.

> `@react-pdf/renderer` ya está en la lista de paquetes que Next deja fuera del bundle del servidor
> sin configurar nada (`node_modules/next/dist/docs/01-app/03-api-reference/05-config/01-next-config-js/serverExternalPackages.md`).
> `exceljs` no, y no hace falta: se empaqueta bien en un route handler. Si el build protesta, se
> añade a `serverExternalPackages` en `next.config.ts`.

### Paso 2 — Nombre del archivo y Excel, primero la prueba

- [ ] Crear `src/lib/insumos/nombre-archivo.test.ts`:

```ts
import { describe, expect, it } from "vitest";

import { nombreDeArchivo } from "./nombre-archivo";

describe("nombreDeArchivo", () => {
  it("dice qué reporte y qué periodo, sin espacios ni tildes", () => {
    expect(nombreDeArchivo("consumo", { desde: "2026-10-01", hasta: "2026-10-07" }, "xlsx")).toBe(
      "pimpos-consumo-2026-10-01-al-2026-10-07.xlsx",
    );
  });

  it("sin periodo, solo el reporte", () => {
    expect(nombreDeArchivo("existencias", null, "pdf")).toBe("pimpos-existencias.pdf");
  });
});
```

- [ ] Crear `src/lib/insumos/exportar-excel.test.ts`:

```ts
import ExcelJS from "exceljs";
import { describe, expect, it } from "vitest";

import { reporteAExcel } from "./exportar-excel";
import type { Reporte } from "./reportes";

const reporte: Reporte = {
  slug: "consumo",
  titulo: "Consumo por periodo",
  subtitulo: "Del 01/10/2026 al 07/10/2026",
  columnas: [
    { clave: "insumo", titulo: "Insumo", tipo: "texto" },
    { clave: "cantidad", titulo: "Se usó", tipo: "cantidad" },
    { clave: "costo", titulo: "Costo", tipo: "soles" },
  ],
  filas: [
    { insumo: "Harina", cantidad: 120, costo: 364 },
    { insumo: "Manteca", cantidad: 2.5, costo: 22.5 },
  ],
  total: 386.5,
  grafico: null,
  unidadGrafico: null,
};

describe("reporteAExcel", () => {
  it("pone título, periodo, cabecera, filas y total, con números de verdad", async () => {
    const libro = new ExcelJS.Workbook();
    await libro.xlsx.load(await reporteAExcel(reporte));
    const hoja = libro.worksheets[0]!;

    expect(hoja.name).toBe("Consumo por periodo");
    expect(hoja.getCell("A1").value).toBe("Consumo por periodo");
    expect(hoja.getCell("A2").value).toBe("Del 01/10/2026 al 07/10/2026");
    expect(hoja.getRow(4).values).toEqual([undefined, "Insumo", "Se usó", "Costo"]);
    expect(hoja.getCell("A5").value).toBe("Harina");
    expect(hoja.getCell("C5").value).toBe(364);
    expect(hoja.getCell("C5").numFmt).toBe('"S/" #,##0.00');
    expect(hoja.getCell("B6").value).toBe(2.5);
    expect(hoja.getCell("B7").value).toBe("Total");
    expect(hoja.getCell("C7").value).toBe(386.5);
  });
});
```

- [ ] `pnpm test -- src/lib/insumos/nombre-archivo.test.ts src/lib/insumos/exportar-excel.test.ts` → FALLAN.

- [ ] Crear `src/lib/insumos/nombre-archivo.ts`:

```ts
import type { Periodo } from "./periodo";

export function nombreDeArchivo(
  slug: string,
  periodo: Periodo | null,
  extension: "xlsx" | "pdf",
): string {
  const rango = periodo ? `-${periodo.desde}-al-${periodo.hasta}` : "";
  return `pimpos-${slug}${rango}.${extension}`;
}
```

- [ ] Crear `src/lib/insumos/exportar-excel.ts`:

```ts
import ExcelJS from "exceljs";

import type { Reporte } from "./reportes";

const FORMATO = { soles: '"S/" #,##0.00', cantidad: "0.####" } as const;

/**
 * Un reporte a `.xlsx`. Los números van como números (el propietario los suma
 * en su hoja, como hacía antes), con formato de soles o de cantidad. Filas:
 * 1 título · 2 periodo · 3 vacía · 4 cabecera · 5… datos · última, el total.
 */
export async function reporteAExcel(reporte: Reporte): Promise<Buffer> {
  const libro = new ExcelJS.Workbook();
  libro.creator = "Panadería Pimpo's";
  // Excel no admite más de 31 caracteres ni algunos signos en el nombre de hoja.
  const hoja = libro.addWorksheet(reporte.titulo.replace(/[\\/?*[\]:]/g, " ").slice(0, 31));

  hoja.getCell("A1").value = reporte.titulo;
  hoja.getCell("A1").font = { bold: true, size: 14 };
  hoja.getCell("A2").value = reporte.subtitulo;

  const cabecera = hoja.getRow(4);
  reporte.columnas.forEach((c, i) => {
    cabecera.getCell(i + 1).value = c.titulo;
    cabecera.getCell(i + 1).font = { bold: true };
  });

  reporte.filas.forEach((f, i) => {
    const fila = hoja.getRow(5 + i);
    reporte.columnas.forEach((c, j) => {
      const celda = fila.getCell(j + 1);
      const valor = f[c.clave] ?? null;
      celda.value = c.tipo === "texto" || valor === null ? valor : Number(valor);
      if (c.tipo !== "texto") celda.numFmt = FORMATO[c.tipo];
    });
  });

  if (reporte.total !== null) {
    const ultima = hoja.getRow(5 + reporte.filas.length);
    const columnaSoles = reporte.columnas.findIndex((c) => c.tipo === "soles");
    if (columnaSoles > 0) {
      ultima.getCell(columnaSoles).value = "Total";
      ultima.getCell(columnaSoles).font = { bold: true };
      ultima.getCell(columnaSoles + 1).value = reporte.total;
      ultima.getCell(columnaSoles + 1).numFmt = FORMATO.soles;
      ultima.getCell(columnaSoles + 1).font = { bold: true };
    }
  }

  hoja.columns.forEach((columna, i) => {
    columna.width = reporte.columnas[i]?.tipo === "texto" ? 28 : 14;
  });

  return Buffer.from(await libro.xlsx.writeBuffer());
}
```

- [ ] `pnpm test -- src/lib/insumos/nombre-archivo.test.ts src/lib/insumos/exportar-excel.test.ts` → PASAN.

### Paso 3 — PDF

- [ ] Crear `src/lib/insumos/exportar-pdf.test.ts`:

```ts
import { describe, expect, it } from "vitest";

import { reporteAPdf } from "./exportar-pdf";
import type { Reporte } from "./reportes";

const reporte: Reporte = {
  slug: "mermas",
  titulo: "Mermas y pérdidas",
  subtitulo: "Del 01/10/2026 al 07/10/2026",
  columnas: [
    { clave: "motivo", titulo: "Motivo", tipo: "texto" },
    { clave: "costo", titulo: "Costo", tipo: "soles" },
  ],
  filas: [{ motivo: "Merma o desperdicio", costo: 16 }],
  total: 16,
  grafico: null,
  unidadGrafico: null,
};

describe("reporteAPdf", () => {
  it("devuelve un PDF", async () => {
    const pdf = await reporteAPdf(reporte);
    expect(pdf.subarray(0, 5).toString()).toBe("%PDF-");
    expect(pdf.length).toBeGreaterThan(1000);
  });
});
```

> Leer el texto de un PDF exigiría otra dependencia. Esta prueba asegura que se genera y que las
> fuentes cargan (si una ruta de fuente está mal, `renderToBuffer` lanza); el contenido se revisa
> abriéndolo en el paso 6, y el E2E comprueba la descarga.

- [ ] `pnpm test -- src/lib/insumos/exportar-pdf.test.ts` → FALLA.

- [ ] Crear `src/lib/insumos/exportar-pdf.tsx`:

```tsx
import { join } from "node:path";

import { Document, Font, Page, renderToBuffer, StyleSheet, Text, View } from "@react-pdf/renderer";

import { formatearCelda, formatearSoles } from "./formato-reporte";
import type { Reporte } from "./reportes";

// Las mismas TTF estáticas que usa la imagen para compartir (F3): el PDF no
// admite woff2 variables, igual que `ImageResponse`. Ver su LICENCIA.md.
const RECURSOS = join(process.cwd(), "src/recursos/compartir");
Font.register({ family: "Jakarta", src: join(RECURSOS, "jakarta-500.ttf") });
Font.register({ family: "Playfair", src: join(RECURSOS, "playfair-700.ttf") });

const AZUL = "#12306E";
const estilos = StyleSheet.create({
  pagina: { padding: 36, fontFamily: "Jakarta", fontSize: 10, color: "#1E1B14" },
  titulo: { fontFamily: "Playfair", fontSize: 18, color: AZUL },
  subtitulo: { marginTop: 4, marginBottom: 16, color: "#5b5446" },
  fila: {
    flexDirection: "row",
    borderBottomWidth: 0.5,
    borderBottomColor: "#d9d2c3",
    paddingVertical: 4,
  },
  cabecera: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: AZUL,
    paddingBottom: 4,
  },
  celda: { flex: 1, paddingRight: 6 },
  numero: { flex: 1, textAlign: "right" },
  total: { marginTop: 12, textAlign: "right", fontSize: 12, color: AZUL },
  pie: { position: "absolute", bottom: 20, left: 36, right: 36, fontSize: 8, color: "#5b5446" },
});

export async function reporteAPdf(reporte: Reporte): Promise<Buffer> {
  const documento = (
    <Document title={reporte.titulo} author="Panadería Pimpo's">
      <Page size="A4" style={estilos.pagina}>
        <Text style={estilos.titulo}>{reporte.titulo}</Text>
        <Text style={estilos.subtitulo}>Panadería Pimpo&apos;s · {reporte.subtitulo}</Text>
        <View style={estilos.cabecera} fixed>
          {reporte.columnas.map((c) => (
            <Text key={c.clave} style={c.tipo === "texto" ? estilos.celda : estilos.numero}>
              {c.titulo}
            </Text>
          ))}
        </View>
        {reporte.filas.map((f, i) => (
          <View key={i} style={estilos.fila} wrap={false}>
            {reporte.columnas.map((c) => (
              <Text key={c.clave} style={c.tipo === "texto" ? estilos.celda : estilos.numero}>
                {formatearCelda(f[c.clave] ?? null, c.tipo)}
              </Text>
            ))}
          </View>
        ))}
        {reporte.total !== null ? (
          <Text style={estilos.total}>Total: {formatearSoles(reporte.total)}</Text>
        ) : null}
        <Text
          style={estilos.pie}
          fixed
          render={({ pageNumber, totalPages }) => `Página ${pageNumber} de ${totalPages}`}
        />
      </Page>
    </Document>
  );
  return renderToBuffer(documento);
}
```

> Si Vitest no transforma JSX en un `.tsx` de `src/lib` (la configuración está en `vitest.config.mts`),
> revisar que su `include` cubra `src/**/*.test.ts` **y** que el archivo importado `.tsx` se
> transforme; Vite lo hace por defecto con esbuild. Si el entorno de Vitest no es `node`, añadir
> `// @vitest-environment node` al principio de la prueba.

- [ ] `pnpm test -- src/lib/insumos/exportar-pdf.test.ts` → PASA.

- [ ] En `next.config.ts`, para que las TTF viajen con la función en Vercel (se leen en tiempo de
      ejecución, no en el build como la imagen para compartir):

```ts
  outputFileTracingIncludes: {
    "/admin/insumos/reportes/[reporte]/pdf": ["./src/recursos/compartir/*.ttf"],
  },
```

### Paso 4 — Las rutas de descarga

- [ ] Crear `src/app/(admin)/admin/insumos/reportes/[reporte]/excel/route.ts`:

```ts
import { exigirAcceso } from "@/lib/auth/sesion";
import { reporteAExcel } from "@/lib/insumos/exportar-excel";
import { nombreDeArchivo } from "@/lib/insumos/nombre-archivo";
import { leerPeriodo } from "@/lib/insumos/periodo";
import { esSlugReporte, leerReporte, REPORTES } from "@/lib/insumos/reportes";

export async function GET(
  peticion: Request,
  ctx: RouteContext<"/admin/insumos/reportes/[reporte]/excel">,
) {
  const { reporte: slug } = await ctx.params;
  if (!esSlugReporte(slug)) return new Response("Ese reporte no existe.", { status: 404 });
  // Igual que una página del panel: sin sesión, redirige a /ingresar.
  await exigirAcceso(`/admin/insumos/reportes/${slug}`);

  const parametros = new URL(peticion.url).searchParams;
  const periodo = leerPeriodo(Object.fromEntries(parametros), new Date(), 30);
  const reporte = await leerReporte(slug, periodo, parametros.get("insumo") ?? undefined);
  const archivo = await reporteAExcel(reporte);

  return new Response(new Uint8Array(archivo), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${nombreDeArchivo(slug, REPORTES[slug].conPeriodo ? periodo : null, "xlsx")}"`,
      "Cache-Control": "no-store",
    },
  });
}
```

- [ ] Crear `src/app/(admin)/admin/insumos/reportes/[reporte]/pdf/route.ts`: el mismo archivo con
      `reporteAPdf`, `"Content-Type": "application/pdf"`, extensión `"pdf"` y
      `RouteContext<"/admin/insumos/reportes/[reporte]/pdf">`:

```ts
import { exigirAcceso } from "@/lib/auth/sesion";
import { reporteAPdf } from "@/lib/insumos/exportar-pdf";
import { nombreDeArchivo } from "@/lib/insumos/nombre-archivo";
import { leerPeriodo } from "@/lib/insumos/periodo";
import { esSlugReporte, leerReporte, REPORTES } from "@/lib/insumos/reportes";

export async function GET(
  peticion: Request,
  ctx: RouteContext<"/admin/insumos/reportes/[reporte]/pdf">,
) {
  const { reporte: slug } = await ctx.params;
  if (!esSlugReporte(slug)) return new Response("Ese reporte no existe.", { status: 404 });
  await exigirAcceso(`/admin/insumos/reportes/${slug}`);

  const parametros = new URL(peticion.url).searchParams;
  const periodo = leerPeriodo(Object.fromEntries(parametros), new Date(), 30);
  const reporte = await leerReporte(slug, periodo, parametros.get("insumo") ?? undefined);
  const archivo = await reporteAPdf(reporte);

  return new Response(new Uint8Array(archivo), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${nombreDeArchivo(slug, REPORTES[slug].conPeriodo ? periodo : null, "pdf")}"`,
      "Cache-Control": "no-store",
    },
  });
}
```

> `exigirAcceso` redirige con `redirect()`, que en un route handler funciona igual que en una
> página. `RouteContext` lo genera `next typegen` (lo encadena `pnpm typecheck`), sin importarlo.

- [ ] En `reportes/[reporte]/page.tsx`, antes de `<TablaReporte>`, los dos botones (con el mismo
      periodo e insumo de la pantalla):

```tsx
{
  reporte.filas.length > 0 ? (
    <div className="mb-4 flex flex-wrap gap-2">
      {(["excel", "pdf"] as const).map((formato) => (
        <a
          key={formato}
          href={`${ruta}/${formato}?${new URLSearchParams({ ...periodo, ...(insumo ? { insumo } : {}) })}`}
          className="boton-linea"
          download
        >
          Descargar {formato === "excel" ? "Excel" : "PDF"}
        </a>
      ))}
    </div>
  ) : null;
}
```

### Paso 5 — Prueba de navegador

- [ ] Crear `e2e/panel-exportar.spec.ts`:

```ts
import ExcelJS from "exceljs";
import { expect, test } from "@playwright/test";

import { sumarStock } from "./ayudas/insumos";
import { entrarComo } from "./ayudas/sesion";
import { borrarUsuario } from "./ayudas/usuarios";

test.beforeEach(({}, info) => {
  test.skip(info.project.name !== "movil", "una descarga basta");
});

test("el Excel de existencias trae lo mismo que la pantalla", async ({ page }) => {
  await sumarStock("Sal", 1);
  const usuario = await entrarComo(page, "administrador");
  try {
    await page.goto("/admin/insumos/reportes/existencias");
    const [descarga] = await Promise.all([
      page.waitForEvent("download"),
      page.getByRole("link", { name: "Descargar Excel" }).click(),
    ]);
    expect(descarga.suggestedFilename()).toBe("pimpos-existencias.xlsx");

    const libro = new ExcelJS.Workbook();
    await libro.xlsx.readFile(await descarga.path());
    const hoja = libro.worksheets[0]!;
    const insumos: unknown[] = [];
    hoja.eachRow((fila, n) => {
      if (n >= 5) insumos.push(fila.getCell(1).value);
    });
    expect(insumos).toContain("Sal");
  } finally {
    await borrarUsuario(usuario.id);
  }
});

test("el PDF se descarga", async ({ page }) => {
  const usuario = await entrarComo(page, "ingeniero");
  try {
    await page.goto("/admin/insumos/reportes/existencias");
    const [descarga] = await Promise.all([
      page.waitForEvent("download"),
      page.getByRole("link", { name: "Descargar PDF" }).click(),
    ]);
    expect(descarga.suggestedFilename()).toBe("pimpos-existencias.pdf");
  } finally {
    await borrarUsuario(usuario.id);
  }
});

test("sin sesión, la descarga manda a ingresar", async ({ page }) => {
  const respuesta = await page.goto("/admin/insumos/reportes/existencias/excel");
  expect(page.url()).toContain("/ingresar");
  expect(respuesta?.headers()["content-type"] ?? "").not.toContain("spreadsheet");
});
```

- [ ] `pnpm build` y `pnpm exec playwright test e2e/panel-exportar.spec.ts` → verde.

### Paso 6 — Cerrar la tarea

- [ ] `pnpm typecheck && pnpm lint && pnpm format:check && pnpm test` sin avisos.
- [ ] **Abrir** en la vista previa de Vercel un Excel y un PDF de cada reporte: en el PDF, las
      tildes y la «ñ» se ven (la TTF recortada a latín las incluye) y la tabla no se sale de la
      página; en el Excel, la columna de soles suma con una fórmula escrita a mano. En Vercel, el
      PDF comprueba además que `outputFileTracingIncludes` funcionó (sin él, falla con `ENOENT`).
- [ ] Comprobar que `exceljs` y `@react-pdf/renderer` no llegan al navegador:
      `grep -l "exceljs\|react-pdf" .next/static/chunks/*.js` no devuelve nada.
- [ ] Commit y PR (sin migración):

```bash
git add src/lib/insumos "src/app/(admin)/admin/insumos/reportes" next.config.ts package.json \
        pnpm-lock.yaml e2e/panel-exportar.spec.ts
git commit -m "feat(insumos): exportar los reportes a Excel y PDF"
```

---

## Tarea 8 — Avisos por correo, apagados hasta que haya llaves

**Rama:** `feat/f5-t8-correo`

**Qué deja hecho:** cada mañana a las 06:15 de Iquitos, un **resumen por correo** de las alertas
nuevas (stock bajo, por vencer, vencido, bajas y promociones por aprobar), y un **aviso al momento**
cuando alguien pide una baja o envía una promoción a revisión. Todo con Resend, y **apagado** mientras
falten `RESEND_API_KEY` o `CORREO_ALERTAS`: entonces lo deja escrito en el registro y no falla. Así
se cierra la decisión 5 de F4.

> **Por qué apagado.** Sin dominio verificado, Resend solo entrega a la dirección de la cuenta dueña.
> El código se construye y se prueba entero; encenderlo es poner dos variables en Vercel el día que
> haya dominio (T9 lo deja escrito).

**Archivos:**

- Crear: `supabase/migrations/0040_avisos_por_correo.sql` + `supabase/tests/0040_avisos_por_correo.test.sql`
- Crear: `src/lib/correo/configuracion.ts` + `.test.ts`, `src/lib/correo/resumen.ts` + `.test.ts`,
  `src/lib/correo/enviar.ts`
- Crear: `src/app/api/avisos/diario/route.ts`, `vercel.json`
- Modificar: `src/lib/acciones/bajas.ts`, `src/lib/acciones/novedades.ts`, `.env.example`,
  `package.json` (`resend`)

**Interfaces:**

- Consume: `crearClienteAdministrador()` de `src/lib/supabase/administrador.ts`; `urlAbsoluta(ruta)`
  de `src/lib/sitio.ts`; `notificaciones` (0015, 0028, 0038); `after` de `next/server`.
- Produce:
  - `notificaciones.enviada_en timestamptz`
  - `leerConfiguracionCorreo(entorno: Record<string, string | undefined>): ConfiguracionCorreo`
  - `armarResumen(avisos: AvisoCorreo[], fecha: string): { asunto: string; texto: string; html: string }`
  - `enviarCorreo(correo: { asunto: string; texto: string; html: string }): Promise<{ enviado: boolean; motivo?: string }>`
  - `GET /api/avisos/diario` con `Authorization: Bearer <CRON_SECRET>`

### Paso 1 — La base: recordar qué se envió

- [ ] Crear `supabase/tests/0040_avisos_por_correo.test.sql`:

```sql
-- Verifica la columna de envío por correo (0040).
begin;
select plan(3);

select has_column('public', 'notificaciones', 'enviada_en', 'la notificación recuerda si ya se envió');
select col_is_null('public', 'notificaciones', 'enviada_en', 'y empieza sin enviar');

insert into auth.users (id, email, created_at, updated_at) values
  ('33333333-3333-3333-3333-333333333333', 'inge@pimpos.test', now(), now());
update public.perfiles set rol = 'ingeniero', activo = true where id = '33333333-3333-3333-3333-333333333333';
insert into public.notificaciones (tipo, titulo, mensaje, clave_unica)
values ('stock_bajo', 'Queda poco Sal', 'Quedan 2 kg de Sal.', 'prueba-0040');

set local role authenticated;
set local request.jwt.claims = '{"sub": "33333333-3333-3333-3333-333333333333", "rol": "ingeniero"}';
select throws_ok(
  $$ update public.notificaciones set enviada_en = now() where clave_unica = 'prueba-0040' $$,
  '42501', null, 'marcarla como enviada es cosa del servidor, no de una persona'
);
reset role;

select * from finish();
rollback;
```

- [ ] `supabase test db` → FALLA `0040`.

- [ ] Crear `supabase/migrations/0040_avisos_por_correo.sql`:

```sql
-- =============================================================================
-- 0040_avisos_por_correo.sql
-- Qué alertas ya salieron por correo (F5, tarea 8).
--
-- El resumen diario manda las que tengan `enviada_en` vacío y las marca. Lo
-- hace el servidor con la service_role (sin sesión: lo dispara el cron), así
-- que ninguna persona necesita escribir esta columna.
--
-- Se protege con un trigger y no con un `revoke update (enviada_en)`: en
-- `public`, `authenticated` tiene UPDATE sobre la tabla entera, y un privilegio
-- de tabla anula el `revoke` de una columna. Quitar el de tabla obligaría a
-- volver a conceder columna por columna lo que el panel sí escribe, y cambiaría
-- el error que la prueba 0032 espera de la RLS.
-- =============================================================================
alter table public.notificaciones add column enviada_en timestamptz;
comment on column public.notificaciones.enviada_en is
  'Cuándo salió en el resumen por correo. Null si todavía no. Solo la escribe el servidor.';

create index idx_notificaciones_por_enviar on public.notificaciones (created_at)
  where enviada_en is null and resuelta_en is null;

-- Sin `security definer`: tiene que ver el rol de quien llama.
create or replace function app.proteger_enviada_en()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.enviada_en is distinct from old.enviada_en and current_user in ('authenticated', 'anon') then
    raise exception 'Solo el servidor marca un aviso como enviado.' using errcode = '42501';
  end if;
  return new;
end;
$$;

create trigger notificaciones_proteger_enviada_en
  before update of enviada_en on public.notificaciones
  for each row execute function app.proteger_enviada_en();
```

- [ ] `supabase db reset && supabase test db` → todo en verde (también `0015`, `0028`, `0032` y
      `0038`, que actualizan notificaciones). Después `subir-imagenes.sh` y `pnpm supabase:tipos`.

### Paso 2 — Configuración y resumen, lógica pura

- [ ] Crear `src/lib/correo/configuracion.test.ts`:

```ts
import { describe, expect, it } from "vitest";

import { leerConfiguracionCorreo } from "./configuracion";

describe("leerConfiguracionCorreo", () => {
  it("apagado sin llave, y lo dice", () => {
    expect(leerConfiguracionCorreo({ CORREO_ALERTAS: "a@b.pe" })).toEqual({
      activo: false,
      motivo: "Falta RESEND_API_KEY",
    });
  });

  it("apagado sin destinatarios", () => {
    expect(leerConfiguracionCorreo({ RESEND_API_KEY: "re_x" })).toEqual({
      activo: false,
      motivo: "Falta CORREO_ALERTAS",
    });
  });

  it("encendido con las dos; varios destinatarios separados por coma", () => {
    expect(
      leerConfiguracionCorreo({ RESEND_API_KEY: "re_x", CORREO_ALERTAS: " a@b.pe, c@d.pe " }),
    ).toEqual({
      activo: true,
      apiKey: "re_x",
      destinatarios: ["a@b.pe", "c@d.pe"],
      remitente: "Panadería Pimpo's <onboarding@resend.dev>",
    });
  });

  it("el remitente se puede cambiar cuando haya dominio", () => {
    const r = leerConfiguracionCorreo({
      RESEND_API_KEY: "re_x",
      CORREO_ALERTAS: "a@b.pe",
      CORREO_REMITENTE: "Pimpo's <avisos@panaderiapimpos.com>",
    });
    expect(r.activo && r.remitente).toBe("Pimpo's <avisos@panaderiapimpos.com>");
  });
});
```

- [ ] Crear `src/lib/correo/resumen.test.ts`:

```ts
import { describe, expect, it } from "vitest";

import { armarResumen } from "./resumen";

describe("armarResumen", () => {
  const avisos = [
    { tipo: "stock_bajo", titulo: "Queda poco Harina", mensaje: "Quedan 30 kg de Harina." },
    {
      tipo: "baja_pendiente",
      titulo: "Baja esperando aprobación",
      mensaje: "Piden dar de baja 2 kg de Sal.",
    },
    { tipo: "stock_bajo", titulo: "Queda poco <Sal>", mensaje: "Quedan 1 kg." },
  ];

  it("el asunto dice cuántos avisos y de qué día", () => {
    expect(armarResumen(avisos, "12/10/2026").asunto).toBe("Pimpo's: 3 avisos del 12/10/2026");
  });

  it("agrupa por tipo, con el grupo más urgente primero", () => {
    const { texto } = armarResumen(avisos, "12/10/2026");
    expect(texto.indexOf("Por aprobar")).toBeLessThan(texto.indexOf("Queda poco"));
    expect(texto).toContain("Quedan 30 kg de Harina.");
  });

  it("escapa el HTML de lo que escribió una persona", () => {
    expect(armarResumen(avisos, "12/10/2026").html).toContain("Queda poco &lt;Sal&gt;");
  });
});
```

- [ ] `pnpm test -- src/lib/correo/` → FALLAN.

- [ ] Crear `src/lib/correo/configuracion.ts`:

```ts
export type ConfiguracionCorreo =
  | { activo: false; motivo: string }
  | { activo: true; apiKey: string; destinatarios: string[]; remitente: string };

/**
 * El correo está encendido solo si hay llave Y destinatarios. Sin dominio
 * verificado, Resend solo entrega a la cuenta dueña: hasta entonces se deja sin
 * `RESEND_API_KEY` y todo sigue funcionando sin mandar nada.
 */
export function leerConfiguracionCorreo(
  entorno: Record<string, string | undefined>,
): ConfiguracionCorreo {
  const apiKey = entorno.RESEND_API_KEY?.trim();
  if (!apiKey) return { activo: false, motivo: "Falta RESEND_API_KEY" };
  const destinatarios = (entorno.CORREO_ALERTAS ?? "")
    .split(",")
    .map((d) => d.trim())
    .filter(Boolean);
  if (destinatarios.length === 0) return { activo: false, motivo: "Falta CORREO_ALERTAS" };
  return {
    activo: true,
    apiKey,
    destinatarios,
    remitente: entorno.CORREO_REMITENTE?.trim() || "Panadería Pimpo's <onboarding@resend.dev>",
  };
}
```

- [ ] Crear `src/lib/correo/resumen.ts`:

```ts
export type AvisoCorreo = { tipo: string; titulo: string; mensaje: string };

/** El orden de los grupos: lo que espera una decisión va primero. */
const GRUPOS: ReadonlyArray<{ nombre: string; tipos: readonly string[] }> = [
  { nombre: "Por aprobar", tipos: ["baja_pendiente", "promocion_en_revision"] },
  { nombre: "Vencido", tipos: ["vencido"] },
  { nombre: "Por vencer", tipos: ["por_vencer"] },
  { nombre: "Stock bajo", tipos: ["stock_bajo"] },
];

const escapar = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export function armarResumen(avisos: AvisoCorreo[], fecha: string) {
  const grupos = GRUPOS.map((g) => ({
    nombre: g.nombre,
    avisos: avisos.filter((a) => g.tipos.includes(a.tipo)),
  })).filter((g) => g.avisos.length > 0);

  const asunto = `Pimpo's: ${avisos.length} ${avisos.length === 1 ? "aviso" : "avisos"} del ${fecha}`;
  const texto = grupos
    .map((g) => [`${g.nombre}:`, ...g.avisos.map((a) => `- ${a.titulo}. ${a.mensaje}`)].join("\n"))
    .join("\n\n");
  const html = grupos
    .map(
      (g) =>
        `<h2 style="color:#12306E;font-family:Georgia,serif">${escapar(g.nombre)}</h2><ul>${g.avisos
          .map((a) => `<li><strong>${escapar(a.titulo)}.</strong> ${escapar(a.mensaje)}</li>`)
          .join("")}</ul>`,
    )
    .join("");
  return { asunto, texto, html };
}
```

- [ ] `pnpm test -- src/lib/correo/` → PASAN.

### Paso 3 — El envío

- [ ] `npm view resend peerDependencies` y `pnpm add resend`.

- [ ] Crear `src/lib/correo/enviar.ts`:

```ts
import "server-only";

import { Resend } from "resend";

import { leerConfiguracionCorreo } from "./configuracion";

/**
 * Manda un correo a CORREO_ALERTAS. NUNCA lanza: un correo que no sale no puede
 * deshacer una baja ya pedida ni tumbar el resumen. Lo que pasó queda en el
 * registro del servidor, con el mensaje de Resend entero (trampa de CLAUDE.md:
 * una comprobación que solo dice «falló» cuesta más de lo que ahorra).
 */
export async function enviarCorreo(correo: {
  asunto: string;
  texto: string;
  html: string;
}): Promise<{ enviado: boolean; motivo?: string }> {
  const configuracion = leerConfiguracionCorreo(process.env);
  if (!configuracion.activo) {
    console.info(`[correo] apagado (${configuracion.motivo}): «${correo.asunto}»`);
    return { enviado: false, motivo: configuracion.motivo };
  }
  try {
    const resend = new Resend(configuracion.apiKey);
    const { error } = await resend.emails.send({
      from: configuracion.remitente,
      to: configuracion.destinatarios,
      subject: correo.asunto,
      text: correo.texto,
      html: correo.html,
    });
    if (error) {
      console.error(`[correo] Resend rechazó «${correo.asunto}»:`, JSON.stringify(error));
      return { enviado: false, motivo: error.message };
    }
    return { enviado: true };
  } catch (e) {
    console.error(`[correo] no se pudo enviar «${correo.asunto}»:`, e);
    return { enviado: false, motivo: e instanceof Error ? e.message : String(e) };
  }
}
```

### Paso 4 — El resumen diario

- [ ] Crear `src/app/api/avisos/diario/route.ts`:

```ts
import { armarResumen } from "@/lib/correo/resumen";
import { enviarCorreo } from "@/lib/correo/enviar";
import { formatearFechaLima } from "@/lib/panel/hora-lima";
import { crearClienteAdministrador } from "@/lib/supabase/administrador";

/**
 * Lo llama el cron de Vercel a las 11:15 UTC (06:15 en Iquitos), cinco minutos
 * después de que `pg_cron` evalúe las alertas (0015). Si producción pasa a
 * Cloudflare, lo llama un Cron Trigger con la misma cabecera: la ruta no
 * depende del hosting.
 *
 * Corre sin sesión, así que usa la service_role; por eso exige CRON_SECRET y
 * no hace nada más que leer avisos y marcarlos.
 */
export async function GET(peticion: Request) {
  const secreto = process.env.CRON_SECRET;
  if (!secreto) {
    return Response.json({ error: "Falta CRON_SECRET en el entorno." }, { status: 503 });
  }
  if (peticion.headers.get("authorization") !== `Bearer ${secreto}`) {
    return Response.json({ error: "No autorizado." }, { status: 401 });
  }

  const supabase = crearClienteAdministrador();
  const { data: avisos, error } = await supabase
    .from("notificaciones")
    .select("id, tipo, titulo, mensaje")
    .is("enviada_en", null)
    .is("resuelta_en", null)
    .order("created_at");
  if (error) {
    console.error("[avisos] no se pudieron leer:", error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
  if (avisos.length === 0) return Response.json({ enviados: 0 });

  const resultado = await enviarCorreo(
    armarResumen(avisos, formatearFechaLima(new Date().toISOString()).slice(0, 10)),
  );
  // Solo se marcan si salieron: apagado, se quedan para el día que se encienda.
  if (resultado.enviado) {
    const { error: errorMarca } = await supabase
      .from("notificaciones")
      .update({ enviada_en: new Date().toISOString() })
      .in(
        "id",
        avisos.map((a) => a.id),
      );
    if (errorMarca) console.error("[avisos] enviados pero sin marcar:", errorMarca.message);
  }
  return Response.json({
    enviados: resultado.enviado ? avisos.length : 0,
    motivo: resultado.motivo,
  });
}
```

> Con Cache Components, un route handler que lee `peticion.headers` es dinámico, así que
> `new Date()` no rompe el build. Si `pnpm build` protesta, poner la lectura de la cabecera antes
> que cualquier otra cosa (ya lo está) y revisar `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/route.md`.

- [ ] Crear `vercel.json`:

```json
{
  "crons": [{ "path": "/api/avisos/diario", "schedule": "15 11 * * *" }]
}
```

- [ ] Añadir a `.env.example`, en la sección de correo:

```bash
# Apagado mientras falte alguna de las dos: sin dominio, Resend solo entrega a
# la cuenta dueña. Varios destinatarios, separados por coma.
RESEND_API_KEY=
CORREO_ALERTAS=contactopimpos@gmail.com
# Opcional. Por defecto «Panadería Pimpo's <onboarding@resend.dev>».
CORREO_REMITENTE=
# Lo manda Vercel en la cabecera Authorization al llamar al cron. SOLO servidor.
CRON_SECRET=
```

- [ ] Probar la ruta a mano contra el build local (sin llaves de Resend: tiene que responder
      `{"enviados":0,"motivo":"Falta RESEND_API_KEY"}` si hay avisos, y 401 sin la cabecera):

```bash
pnpm build && pnpm start   # en otra terminal, con CRON_SECRET=prueba en .env.local
curl -s -H "Authorization: Bearer prueba" http://localhost:3000/api/avisos/diario
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/api/avisos/diario   # 401
```

### Paso 5 — Avisos al momento

- [ ] En `src/lib/acciones/bajas.ts`, envolver `pedirBaja` para avisar **después** de responder
      (`after` corre cuando la respuesta ya salió, así que un correo lento no hace esperar a nadie):

```ts
import { after } from "next/server";

import { enviarCorreo } from "@/lib/correo/enviar";
import { urlAbsoluta } from "@/lib/sitio";

export async function pedirBaja(fd: FormData): Promise<EstadoAccion> {
  const resultado = await ejecutarAccion({
    ruta: `${RUTA}/nueva`,
    esquema: esquemaBaja,
    entrada: leerBaja(fd),
    entidad: "una baja",
    etiquetas: [],
    mensajeOk: "Baja pedida. Se descuenta cuando un administrador la apruebe.",
    hacer: async (d, { supabase }) => {
      const linea = d.lineas[0]!;
      const { data, error } = await supabase
        .from("solicitudes_baja")
        .insert({
          insumo_id: linea.insumo_id,
          cantidad: Number(linea.cantidad),
          unidad_id: linea.unidad_id,
          motivo_baja: d.motivo_baja,
          observacion: d.observacion,
        })
        .select("id")
        .single();
      return { error, id: data?.id };
    },
  });
  if (resultado.estado === "ok") {
    after(() =>
      enviarCorreo({
        asunto: "Pimpo's: una baja espera tu aprobación",
        texto: `Alguien pidió dar de baja un insumo. Revísala en ${urlAbsoluta("/admin/insumos/bajas")}`,
        html: `<p>Alguien pidió dar de baja un insumo. <a href="${urlAbsoluta("/admin/insumos/bajas")}">Revísala en el panel</a>.</p>`,
      }),
    );
  }
  return resultado;
}
```

- [ ] En `src/lib/acciones/novedades.ts` (importar `after`, `enviarCorreo` y `urlAbsoluta` como
      arriba), dentro de `guardarNovedad`: cambiar `return ejecutarAccion({` por
      `const resultado = await ejecutarAccion({`; declarar
      `let paraRevision = false;` antes de `ejecutarAccion`; dentro de `hacer`, justo antes de
      armar `fila`, poner
      `paraRevision = estadoTras(intencion, estadoActual) === "en_revision" && estadoActual !== "en_revision";`;
      y después de `ejecutarAccion`, igual que arriba:

```ts
if (resultado.estado === "ok" && paraRevision) {
  after(() =>
    enviarCorreo({
      asunto: "Pimpo's: una promoción espera tu aprobación",
      texto: `Hay una promoción esperando revisión en ${urlAbsoluta("/admin/contenido/novedades")}`,
      html: `<p>Hay una promoción esperando revisión. <a href="${urlAbsoluta("/admin/contenido/novedades")}">Ábrela en el panel</a>.</p>`,
    }),
  );
}
return resultado;
```

> El aviso en el panel (0028, 0038) no cambia: el correo es un segundo canal, no el primero. Si
> alguien envía cinco promociones seguidas, llegan cinco correos; con dos administradores no justifica
> agruparlos.

### Paso 6 — Cerrar la tarea

- [ ] `pnpm typecheck && pnpm lint && pnpm format:check && pnpm test` sin avisos.
- [ ] Correr las E2E de bajas y novedades (`e2e/panel-bajas.spec.ts`, `e2e/panel-novedades.spec.ts`):
      siguen en verde con el correo apagado, y el registro del servidor muestra `[correo] apagado`.
- [ ] **Para Dan, en la descripción del PR:** añadir en Vercel `CRON_SECRET` (una cadena larga
      aleatoria, `openssl rand -hex 32`) en Production. `RESEND_API_KEY` y `CORREO_ALERTAS` **no** se
      ponen todavía. Aplicar 0040 con `db push` antes de fusionar.
- [ ] Commit:

```bash
git add supabase/migrations/0040_avisos_por_correo.sql supabase/tests/0040_avisos_por_correo.test.sql \
        src/tipos/database.types.ts src/lib/correo src/app/api/avisos vercel.json \
        src/lib/acciones/bajas.ts src/lib/acciones/novedades.ts .env.example package.json pnpm-lock.yaml
git commit -m "feat(avisos): resumen diario y avisos por correo, apagados sin llaves"
```

---

## Tarea 9 — Cierre de F5

**Rama:** `docs/f5-cierre`

**Qué deja hecho:** la fase medida, desplegada y documentada, y el procedimiento para que el negocio
cargue su **inventario inicial** en producción el primer día.

**Archivos:**

- Crear: `docs/insumos.md` (manual corto para el negocio y procedimiento del inventario inicial)
- Modificar: `DOC/Avance del proyecto.md`, `CLAUDE.md`, `DOC/Plan de Desarrollo 00 - General y Fases.md`,
  `DOC/Plan de Desarrollo 02 - Backend y Base de Datos.md` (§9), `DOC/Plan de Desarrollo 03 - Frontend.md`
  (§5.2, §5.6, §6), este plan (casillas y «lo que resultó distinto»)

### Paso 1 — Verificación completa

- [ ] Base: `supabase db reset && supabase test db`. Anotar el total de pruebas pgTAP y de archivos.
- [ ] Unitarias: `pnpm test`. Anotar el total.
- [ ] E2E: `pnpm build` y, con el puerto 3000 libre, `pnpm test:e2e`. Si la memoria de la máquina no
      da para la suite entera (pasó en F4), correr por grupos (`e2e/panel-*.spec.ts`,
      `e2e/insumos-*.spec.ts` y el resto) y anotar que se corrió así. Anotar también
      `pnpm exec playwright test --list | tail -1`.
- [ ] Los tres guiones: `verificar-fase0.sh`, `verificar-storage.sh`, `verificar-sitio-publico.sh`.
- [ ] Contar lo que hay en la base para `CLAUDE.md` (tablas, vistas, políticas, triggers y
      migraciones), con las mismas consultas que se usaron al cerrar F4:

```sql
select count(*) from pg_tables where schemaname = 'public';
select count(*) from pg_tables where schemaname = 'public' and not rowsecurity;   -- tiene que ser 0
select count(*) from pg_views where schemaname = 'public';
select schemaname, count(*) from pg_policies where schemaname in ('public', 'storage') group by 1;
select count(*) from pg_trigger t join pg_class c on c.oid = t.tgrelid
  join pg_namespace n on n.oid = c.relnamespace
 where not t.tgisinternal and n.nspname in ('public', 'app', 'storage');
```

### Paso 2 — Rendimiento del sitio público

F5 no toca las rutas públicas, pero el CSS global puede crecer con las clases del panel (pasó en F4:
13.8 → 16.9 KB). Se mide con el método de `CLAUDE.md`, contra el commit en que se cerró F4:

- [ ] Construir `a5e6a4b` (F4 cerrada) y `main` en carpetas separadas, y medir **intercalando**
      `PASADAS=5 pnpm lighthouse` de cada una, varias rondas, en la misma sesión. Anotar las
      medianas de `/`, `/productos` y `/contacto`, y el tamaño del CSS global comprimido de las dos.
- [ ] Criterio (decisión 3 de F4, que sigue vigente): la mediana de `/` no baja más de 3 puntos. Si
      baja, mirar primero el CSS global: separar las utilidades del panel en su propia hoja es el
      arreglo ya identificado.

### Paso 3 — El inventario inicial en producción

- [ ] Crear `docs/insumos.md`:

```markdown
# Insumos — cómo se usa y cómo se empieza

## El primer día: cargar lo que ya hay

El sistema empieza con los 22 insumos de la ficha y **sin existencias**. Antes de registrar
compras o consumos hay que decirle cuánto hay hoy:

1. Entrar como administrador y abrir **Insumos → Conteo**.
2. En «Por qué se cuenta», escribir **Inventario inicial**.
3. Contar el almacén y escribir, en cada insumo, cuánto hay **en su unidad** (kg, litros,
   unidades, rollos). Un insumo que no se cuenta se deja en blanco.
4. Si se sabe cuánto costó, escribir el precio por kg (o por unidad): con eso la valorización del
   almacén sale bien desde el primer día. Si no se sabe, se deja en blanco y el reporte lo marca
   como «costo sin registrar» hasta la primera compra.
5. En los que vencen (manteca, levadura, huevo, mantequilla, frutas confitadas), escribir la fecha
   de vencimiento de lo que hay.
6. Guardar. Existencias enseña ya las cantidades.

## Cada día

| Qué pasa                              | Quién          | Dónde                                        |
| ------------------------------------- | -------------- | -------------------------------------------- |
| Llega una compra                      | Ingeniero      | Insumos → Registrar ingreso                  |
| Se usa algo para producir o se retira | Ingeniero      | Insumos → Registrar consumo (una vez al día) |
| Algo se pierde, vence o se devuelve   | Ingeniero pide | Insumos → Pedir baja                         |
|                                       | Administrador  | Inicio → «Baja espera tu aprobación»         |
| Algo se registró mal                  | Administrador  | Ficha del insumo → Anular                    |
| Se cuenta el almacén                  | Administrador  | Insumos → Conteo                             |

## Si un número no cuadra

El saldo se puede reconstruir desde los movimientos: `select app.recalcular_saldos();` en el editor
SQL de Supabase (solo quien mantiene el sistema). Si después sigue sin cuadrar con lo que hay en el
almacén, la respuesta es un **conteo**, no tocar la base.

## Encender el correo

Cuando haya dominio verificado en Resend: añadir en Vercel `RESEND_API_KEY`, `CORREO_ALERTAS` (los
correos que reciben, separados por coma) y `CORREO_REMITENTE` con una dirección del dominio, y
volver a desplegar. `CRON_SECRET` ya está puesto desde la tarea 8.

## Una cuenta con movimientos no se elimina

El kárdex guarda quién registró cada cosa. A alguien que ya registró movimientos se le **desactiva**
desde Usuarios; eliminarlo lo impide la base.
```

- [ ] Pedir a Dan que haga el inventario inicial **con el negocio** (no es un paso técnico) y que
      lo anote en `DOC/Avance del proyecto.md` cuando esté hecho. Hasta entonces, la fase está
      cerrada en lo técnico y pendiente en lo del negocio, igual que las cuentas de Marcos y Debra
      en F4.

### Paso 4 — Documentación

- [ ] `DOC/Avance del proyecto.md`: F5 ✅ con fecha, qué se construyó (tarea a tarea, con sus PR), las
      cifras del paso 1 y del paso 2, y lo que queda del negocio (inventario inicial, llaves de
      Resend, fotos de insumos si algún día se quieren).
- [ ] `CLAUDE.md`:
  - la fila F5 de la tabla de estado;
  - «La base hoy» con las cifras nuevas;
  - la tabla de migraciones con 0033–0040, una línea cada una;
  - en «Arquitectura», un párrafo de `(admin)/admin/insumos` (FEFO en triggers, el negativo
    imposible, bajas por solicitud, reportes en funciones de la base, exportaciones en route
    handlers);
  - en «Trampas ya pagadas», las que hayan salido durante la fase. **Por lo menos**: el enum que no
    se usa en la misma transacción (0033), `created_at` que empata dentro de una transacción
    (`llegada` en 0034) y el trigger BEFORE que corre antes que la política RLS (el repartidor ve
    un 23503 y no un 42501);
  - en «Despliegue», `CRON_SECRET` en la tabla de variables y las tres de Resend como «apagadas a
    propósito».
- [ ] `DOC/Plan de Desarrollo 00`: marcar F5 como cerrada.
- [ ] `DOC/Plan de Desarrollo 02` §9: añadir que el kárdex reparte por lotes (FEFO), que hay
      `ajuste` y `anulacion`, y que las bajas pasan por `solicitudes_baja`, con referencia a este plan.
- [ ] `DOC/Plan de Desarrollo 03` §5.2, §5.6 y §6: las rutas de insumos tal como quedaron, los
      gráficos (dónde están: en Reportes, no en el tablero) y las pruebas nuevas.
- [ ] Este plan: marcar las casillas y añadir al final una sección «Lo que resultó distinto» con lo
      que cambió al ejecutarlo, como se hizo con el plan 04.

### Paso 5 — Revisión final y PR

- [ ] Revisión final de la fase entera (skill `superpowers:requesting-code-review`), contra `main`
      desde el commit de cierre de F4: seguridad de las funciones `security definer` nuevas
      (`registrar_conteo`, `aprobar_baja`, `rechazar_baja`, `app.nombre_de_persona`), que ninguna
      dependencia nueva llegue al sitio público y que ningún texto tenga jerga.
- [ ] Commit y PR:

```bash
git add docs/insumos.md "DOC/Avance del proyecto.md" CLAUDE.md DOC/
git commit -m "docs(f5): cerrar la fase de insumos"
```

---

## Lo que resultó distinto

(Se completa al ejecutar el plan, tarea a tarea.)
