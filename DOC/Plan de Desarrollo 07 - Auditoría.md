# Plan de Desarrollo 07 — Auditoría (historial del panel)

> **Para quien lo ejecute:** se trabaja tarea a tarea, en orden, con la **regla de PR de F6** (Dan,
> 30/09/2026): una tarea **con migración** va sola en su PR y se para hasta que Dan haga
> `supabase db push` desde `PIMPOS_SYSTEM` (con la carpeta quieta) y fusione; una tarea **sin
> migración** no abre PR sola: se sigue con la siguiente en la misma rama y se abre un PR con las
> dos. **Nunca más de dos tareas por PR**, y solo si ninguna lleva migración. Antes de empezar, leer
> `AGENTS.md` entero.
>
> Cómo se ejecuta: como F6 — la sesión principal implementa (`superpowers:executing-plans`) y un
> subagente (opus) revisa la rama antes de cada PR; lo Importante se arregla antes de abrirlo, con
> una prueba vista fallar primero.

**Objetivo:** que el propietario y la administración puedan responder «¿quién cambió esto, y
cuándo?» desde el panel, en frases que se entienden sin saber de computadoras, y ver quién entró al
sistema, qué datos de clientes se borraron a pedido y qué listas se descargaron.

**Arquitectura:** una fila por cambio (enfoque 1, Dan, 06/10/2026). El registro ya existe desde F2
(`app.auditoria`, vista `public.auditoria`, triggers en 25 tablas): este módulo es **la pantalla que
lo muestra**. Las frases se arman en la aplicación con un catálogo por tabla y por campo, lógica
pura probada con Vitest antes de la interfaz. La base solo gana una función de solo lectura para los
ingresos y dos vistas para las constancias de F6.

**Stack:** el de F6, sin dependencias nuevas.

**Punto de partida:** migración 0007 (`app.auditoria`, `app.registrar_auditoria()`, la vista
`public.auditoria` con `security_invoker`, lectura solo para superadmin y administrador, sin
políticas de escritura); la ruta `/admin/auditoria` ya reservada en `src/lib/auth/roles.ts` para esos
dos roles; `supresiones` y `exportaciones_clientes` (0043), solo legibles por la administración y
sin pantalla; doc 02 §5; ficha del negocio 6.5 y 9.2 (requisito R9). No hay ni una pantalla de
auditoría.

**Es la primera parte de F7.** El resto de la fase (capacitación, manual, informe final y traspaso
de credenciales) se planifica aparte, después de este módulo.

---

## Decisiones de Dan del 06/10/2026 que cierran F6

Tres preguntas que el cierre de F6 dejó al negocio, resueltas:

- **El texto del permiso** (`v1-2026-10`) queda como está.
- **Las zonas** quedan como están: los cuatro distritos, administrables desde el panel.
- **Las fotos de la fachada son opcionales.** La ficha 8 las ponía entre los datos obligatorios; el
  sistema las deja opcionales y así se queda. No se exigen ni se avisa cuando faltan.

## Decisiones de Dan sobre este módulo (06/10/2026)

1. **Para qué sirve: las dos cosas.** Una lista en lenguaje llano para el propietario («Marcos
   cambió el precio de Pan francés de S/ 0.20 a S/ 0.25 — ayer, 4:10 p. m.») y, en cada cambio, un
   «Detalle técnico» con los datos completos para quien lo necesite.
2. **Qué entra: todo.** El historial de cambios; las constancias de borrado de clientes y el
   registro de descargas (prometidos en F6); la «actividad reciente» en el inicio del panel (estaba
   en el plan original, doc 03); y «Ver historial» desde la pantalla de un producto, la ficha de un
   insumo y la ficha de un cliente.
3. **Cambios e ingresos.** Además de quién modificó qué, quién entró al sistema y cuándo.
4. **De los ingresos, solo lo que Supabase ya registra.** Probado el 06/10/2026 en la base local:
   Supabase anota cada ingreso correcto y cada salida, **no** los intentos fallidos, y no guarda la
   dirección IP. No se construye un registro propio de intentos fallidos.
5. **El historial no se descarga.** Se consulta en pantalla. Un archivo del historial llevaría datos
   de clientes fuera del sistema, que es lo que F6 se esforzó en controlar.
6. **Una fila por cambio, ocultando lo interno.** Cada cosa tocada es una línea; las tablas que son
   mecanismo interno no salen en la lista llana, solo en el detalle técnico. No se agrupa por
   «acción»: se puede añadir después si la lista resulta larga.

---

## Diseño

### 1. La base (migración 0045)

El historial de cambios **no necesita nada nuevo**: lee `public.auditoria`, que ya respeta que solo
la administración lo ve. Sus filtros —persona, sección, fechas, tipo de cambio, un registro— son
consultas normales sobre esa vista, que ya tiene índices por fecha, por tabla, por persona y por
registro.

Lo que se añade:

- **`public.ingresos_al_sistema(p_desde timestamptz, p_hasta timestamptz, p_usuario uuid default
null)`**, `security definer`, de solo lectura. Devuelve `ocurrido_en`, `accion` (`'ingreso'` o
  `'salida'`), `usuario_id`, `correo` y `nombre`, del más reciente al más antiguo. Lee
  `auth.audit_log_entries` —el registro de Supabase, que el panel no puede tocar— y solo las
  acciones `login` y `logout`: las altas y eliminaciones de usuarios ya salen en el historial de
  cambios, y los refrescos de sesión no son un ingreso. Solo responde a superadmin y administrador
  (`42501` para los demás); sin permiso de ejecución para `anon`.
  - La migración lleva una **guarda al principio**, como la 0030: si el rol que la aplica no puede
    leer `auth.audit_log_entries`, se niega a aplicarse con un mensaje que dice por qué, en vez de
    dejar una pestaña vacía sin explicación.
- **Dos vistas** con `security_invoker = true`, que solo añaden el nombre de la persona a tablas que
  ya existen y ya son de la administración:
  - `public.constancias_de_borrado`: `cliente_id`, `borrado_en`, `motivo`, `borrado_por`,
    `borrado_por_nombre`.
  - `public.descargas_de_clientes`: `exportado_en`, `exportado_por`, `exportado_por_nombre`,
    `formato`, `cantidad`, `zona`, `estado` (los dos últimos, sacados de `filtro`).

Lo que **no** cambia: nadie edita ni borra el historial; ingenieros y repartidores no lo ven; y el
contenido de un cliente con los datos borrados a pedido sigue saliendo como «borrado» (lo tachó
0043), también aquí.

Una salida normal y la de las dos horas de inactividad quedan anotadas como «salió». Cuando la
administración le cierra la sesión a alguien (al desactivarlo o cambiarle el rol), eso **no** sale
en Ingresos —ese mecanismo borra la sesión directamente (0030)—; sale en Cambios, como «desactivó
a…» o «cambió el rol de…».

### 2. Las pantallas

Todo bajo **Historial**, una entrada nueva del menú que solo ve la administración (en el celular,
dentro de «Más»: la barra inferior ya lleva sus cuatro botones). La dirección es `/admin/auditoria`,
con cuatro pestañas.

- **Cambios** (`/admin/auditoria`) — la principal.
  - Filtros que se aplican al elegir, sin recargar: **Persona**, **Sección** (Productos · Novedades y
    portada · Contenido del sitio · Configuración · Insumos · Clientes · Usuarios), **Cuándo** (hoy,
    7 días, 30 días o un rango; al entrar, los últimos 7 días) y **Qué hizo** (creó, cambió, borró).
  - La lista, del más reciente al más antiguo, de 50 en 50, con «Ver más». Cada fila: la frase, quién
    y con qué rol, y cuándo (hora de Iquitos). Los cambios sin persona —el cron, las migraciones—
    salen como «El sistema».
  - Las tablas internas no salen en esta lista.
- **Un cambio** (`/admin/auditoria/[id]`): la frase, quién, con qué rol y cuándo; una tabla de **solo
  los campos que cambiaron**, con su nombre en llano y su valor de antes y de después; un enlace «Ir
  a…» si el registro todavía existe; y un desplegable **«Detalle técnico»**, cerrado, con la tabla,
  la operación, el identificador y los datos completos de antes y después. Por esta dirección sí se
  puede abrir un cambio de una tabla interna.
- **Ingresos** (`/admin/auditoria/ingresos`): quién entró y quién salió, y cuándo, con filtros por
  persona y por fecha.
- **Datos borrados** (`/admin/auditoria/borrados`): fecha, quién los borró y el motivo, con enlace a
  la ficha del cliente.
- **Descargas** (`/admin/auditoria/descargas`): fecha, quién, formato, cuántos clientes y de qué zona
  y estado.

Fuera de `/admin/auditoria`:

- **Inicio del panel:** un bloque «Actividad reciente» con los últimos 5 cambios (sin tablas
  internas) y un enlace «Ver todo el historial». Solo para la administración.
- **«Ver historial»** en la pantalla de un producto, en la ficha de un insumo y en la ficha de un
  cliente: abre Cambios filtrado a ese registro, **con lo que cuelga de él** —las presentaciones y
  fotos del producto, los movimientos y lotes del insumo, las fotos y permisos del cliente—. Solo
  para la administración.

Como el resto del panel: a 375 px, la lista en tarjetas, botones de 44 px, textos sin jerga, y cada
ruta nueva en `RUTAS_DEL_PANEL` (axe y área táctil).

### 3. Las frases

Lógica pura en `src/lib/auditoria/`, sin dependencias de servidor, con Vitest **antes** de la
interfaz. Tres partes:

- **El catálogo de tablas:** una entrada por cada tabla auditada. Dice a qué sección pertenece, cómo
  se llama la cosa («el producto», «la zona», «el cliente»), de qué campo sale su nombre, si es
  interna, de quién cuelga (una presentación, de su producto) y a qué pantalla lleva «Ir a…».
  Las 25 de hoy: `almacenes`, `categorias_producto`, `cliente_fotos`, `clientes`,
  `configuracion_sitio`, `consentimientos`, `equivalencias`, `faqs`, `galeria`, `guias`, `insumos`,
  `lotes_insumo`, `movimiento_lotes`, `movimientos_insumo`, `novedades`, `perfiles`,
  `producto_imagenes`, `producto_variantes`, `productos`, `proveedores`, `roles`, `slides`,
  `solicitudes_baja`, `testimonios`, `zonas_reparto`. Internas: `movimiento_lotes`, `lotes_insumo`,
  `almacenes` y `roles`.
- **El catálogo de campos:** el nombre en llano de cada campo y cómo se escribe su valor —dinero
  como «S/ 0.25», sí o no, fechas en hora de Iquitos, estados, cantidades con su unidad—. Los campos
  de control (`created_at`, `updated_at`, `created_by`, `updated_by`) nunca salen como cambio.
- **El redactor:** de una fila del registro saca la frase y la lista de diferencias. Reglas para lo
  que no es un simple «cambió»: se publicó o se despublicó; se desactivó o se reactivó; se borró (el
  borrado del panel es una marca, `deleted_at`, y tiene que decir «borró»); un movimiento de insumo
  dice qué fue («registró un ingreso de 50 kg de Harina», «aprobó una baja»); y una ficha con los
  datos borrados a pedido dice solo eso.

Dos reglas para que no mienta ni se rompa:

- **Lo desconocido se dice de forma genérica.** Una tabla sin entrada o un campo sin nombre dan
  «cambió un registro de …» con el nombre técnico; nunca un error, nunca una fila que desaparece.
  Una prueba compara el catálogo con la lista real de tablas auditadas: una tabla nueva sin entrada
  hace fallar la prueba.
- **Los nombres ajenos se resuelven por página.** Un movimiento guarda el identificador del insumo,
  no su nombre: antes de pintar una página se buscan de una vez los nombres que hacen falta
  (insumos, productos, clientes, zonas, categorías). Si el registro ya no existe, la frase dice «un
  insumo que ya no existe».

Datos personales: el historial de un cliente enseña sus datos de antes y de después tal como ya los
guarda la base, y solo a la administración, que ya puede ver a los clientes. No se crea ninguna
copia nueva.

### 4. Las pruebas

- **pgTAP:** `ingresos_al_sistema` responde solo a superadmin y administrador (ingeniero y
  repartidor, `42501`; anónimo, sin permiso de ejecución) y devuelve ingresos y salidas, no altas ni
  refrescos; las dos vistas nuevas no enseñan nada a quien no es de la administración; la prueba que
  recorre todas las vistas de `public` las encuentra con `security_invoker`; y la lista de tablas
  auditadas es la que el catálogo espera.
- **Vitest:** un caso por cada regla del redactor (publicar, desactivar, borrar, cada tipo de
  movimiento, ficha borrada); las diferencias enseñan solo lo que cambió, con dinero, fechas y sí o
  no bien escritos; una tabla o un campo desconocidos dan la frase genérica; el catálogo cubre todas
  las tablas auditadas.
- **Playwright:** un administrador cambia un precio y lo encuentra en Cambios con su frase, lo abre
  y ve el antes y el después; los filtros por persona, sección y fecha, sin recargar; «Ver historial»
  desde un producto trae sus presentaciones; Ingresos muestra el ingreso que la propia prueba acaba
  de hacer; Datos borrados y Descargas muestran lo que deja un borrado y una descarga; el ingeniero
  no ve «Historial» ni llega escribiendo la dirección; axe y área táctil en cada ruta nueva.

### 5. Las tareas

| Tarea | Qué deja                                                                                                               | Migración | PR            |
| ----- | ---------------------------------------------------------------------------------------------------------------------- | --------- | ------------- |
| T1    | La base: `ingresos_al_sistema` con su guarda, las dos vistas y sus pruebas                                             | 0045      | Sola; se para |
| T2    | El redactor de frases con sus pruebas, «Historial» en el menú, la pestaña Cambios y el detalle de un cambio            | —         | Con T3        |
| T3    | Ingresos, Datos borrados, Descargas, «Actividad reciente» en el inicio y «Ver historial» en producto, insumo y cliente | —         | ↑ T2 + T3     |
| T4    | Cierre del módulo: la suite afectada, `docs/historial.md` para el negocio, la documentación al día y la revisión final | —         | Sola          |

## Fuera de este módulo

- Los intentos fallidos de ingreso (decisión 4) y la dirección IP.
- Descargar el historial (decisión 5).
- Deshacer un cambio desde el historial: es de solo lectura.
- Agrupar por acción (decisión 6).
- Que los ingenieros o los repartidores vean su propio historial.
- El resto de F7: capacitación, manual, informe final y traspaso de credenciales.

---

# Plan paso a paso

> **Para quien lo ejecute:** skill `superpowers:executing-plans` (la sesión principal implementa) y,
> antes de cada PR, una revisión de la rama con un subagente (`superpowers:requesting-code-review`).
> Los pasos llevan casillas (`- [ ]`). Cada paso con comando dice qué debe salir (**Esperado**).
> **Spec:** la primera parte de este documento («Decisiones de Dan» y «Diseño»): el plan argumenta
> desde ella; si un paso la contradice, manda la spec y se anota en «Lo que resultó distinto».

**Goal:** la pantalla que enseña el historial que la base ya guarda —quién cambió qué y cuándo, en
frases llanas—, más los ingresos al sistema, las constancias de borrado y las descargas.

**Architecture:** una fila por cambio. `public.auditoria` (0007) se lee tal cual con PostgREST; las
frases salen de un catálogo por tabla y por campo en `src/lib/auditoria/` (lógica pura, Vitest). La
base gana una función de solo lectura (`ingresos_al_sistema`) y dos vistas (0045).

**Tech Stack:** Next.js 16.3.4 · React 19.2.8 · Tailwind 4.3.3 · supabase-js + `@supabase/ssr` ·
lucide-react · Vitest · Playwright · axe · pgTAP. Sin dependencias nuevas.

## Global Constraints

- Textos de interfaz **en español y sin jerga** (usuarios con nivel básico de computadora).
- Todo funciona a **375 px**, con área táctil **≥ 44 × 44 px** y **axe en cero**; cada ruta nueva sin
  `[id]` entra en `RUTAS_DEL_PANEL` (`e2e/panel-accesibilidad.spec.ts`).
- **Solo lectura.** Ninguna acción de este módulo escribe: no hay `ejecutarAccion`, ni migración que
  dé permisos de escritura sobre el historial. Nadie lo edita ni lo borra.
- **Solo la administración** (superadmin y administrador): `/admin/auditoria` y todo lo que cuelga
  de ella, «Actividad reciente» y «Ver historial». La regla está en la base (RLS de `app.auditoria`,
  comprobación de rol en `ingresos_al_sistema`); ocultar el enlace no cuenta.
- Las fechas se enseñan en **hora de Iquitos** (UTC−5, `src/lib/panel/hora-lima.ts`), y los filtros
  por día son días de Iquitos.
- **Lo desconocido se dice de forma genérica**: una tabla o un campo sin entrada en el catálogo
  nunca da un error ni hace desaparecer una fila.
- Sin dependencias nuevas. Sin `service_role`: todo con la sesión del usuario.
- Migraciones numeradas, **nunca editadas tras aplicarse**; toda vista con `security_invoker = true`.
- Commits en español (Conventional Commits) **sin** `Co-Authored-By` ni `Claude-Session` (AGENTS.md).
- En esta máquina **el build va en primer plano** y un solo build por tanda de E2E (AGENTS.md).
- Regla de PR (encabezado del documento): T1 sola; T2+T3 juntas; T4 sola.

## Review Focus

- **Quien hizo el cambio ya no tiene nombre** (cuenta eliminada, perfil sin nombre, o un cambio del
  cron): la frase dice su correo, o «El sistema», nunca «null» ni una frase sin sujeto. T2 (Vitest).
- **Valores largos o que no son texto** (el contenido de una guía, el horario de la configuración,
  que es un objeto): la lista no se desborda —se recorta con «…»— y el detalle los enseña enteros y
  legibles. T2 (Vitest del recorte y del formato de objetos).
- **Filtros escritos a mano en la dirección** (`persona=abc`, `desde=ayer`, `seccion=otra`,
  `ver=999999`): se ignoran o se acotan; la página no da un error. T2 (Vitest de `leerFiltros`).
- **Un cambio hecho a las 11:30 p. m. de Iquitos** (04:30 UTC del día siguiente) sale en el día de
  Iquitos, y el filtro «hoy» lo incluye. T2 (Vitest de `limitesDelPeriodo`).
- **El registro al que se refiere el cambio ya no existe** (un insumo eliminado, un cliente con los
  datos borrados): la frase lo dice y «Ir a…» no aparece. T2 (Vitest) y T3 (E2E de «Datos
  borrados»).

## Mapa de archivos

| Archivo                                                                                                       | Tarea | Qué hace                                                       |
| ------------------------------------------------------------------------------------------------------------- | ----- | -------------------------------------------------------------- |
| `supabase/migrations/0045_historial.sql` (C) + prueba                                                         | 1     | `ingresos_al_sistema`, las dos vistas, la guarda               |
| `src/lib/auditoria/catalogo.ts` (C) + prueba                                                                  | 2     | Qué es cada tabla: sección, cómo se nombra, a dónde lleva      |
| `src/lib/auditoria/campos.ts` (C) + prueba                                                                    | 2     | Nombre en llano de cada campo y cómo se escribe su valor       |
| `src/lib/auditoria/redactar.ts` (C) + prueba                                                                  | 2     | De una fila del registro, la frase y las diferencias           |
| `src/lib/auditoria/filtros.ts` (C) + prueba                                                                   | 2     | Leer los filtros de la dirección; límites de un día de Iquitos |
| `src/lib/auditoria/datos.ts` (C)                                                                              | 2–3   | Lecturas del servidor: cambios, nombres, ingresos, constancias |
| `src/lib/panel/navegacion.ts` (M), `src/components/panel/barra-lateral.tsx` (M)                               | 2     | «Historial» en el menú                                         |
| `src/components/panel/pestanas-historial.tsx` (C)                                                             | 2     | Las cuatro pestañas                                            |
| `src/components/panel/filtros-historial.tsx` (C)                                                              | 2     | Filtros que se aplican al elegir                               |
| `src/components/panel/lista-de-cambios.tsx` (C)                                                               | 2     | La lista de cambios (la usan Cambios y el inicio)              |
| `src/app/(admin)/admin/auditoria/page.tsx`, `[id]/page.tsx` (C)                                               | 2     | Cambios y el detalle de un cambio                              |
| `src/app/(admin)/admin/auditoria/{ingresos,borrados,descargas}/page.tsx` (C)                                  | 3     | Las otras tres pestañas                                        |
| `src/app/(admin)/admin/page.tsx` (M)                                                                          | 3     | «Actividad reciente»                                           |
| `src/components/panel/enlace-historial.tsx` (C); pantalla de producto, ficha de insumo y ficha de cliente (M) | 3     | «Ver historial»                                                |
| `e2e/panel-historial.spec.ts` (C), `e2e/panel-accesibilidad.spec.ts` (M)                                      | 2–3   | Flujos y accesibilidad                                         |
| `docs/historial.md` (C)                                                                                       | 4     | Manual del negocio                                             |

---

## Tarea 1 — La base

**Rama:** `feat/f7-t1-historial-base` · **Migración:** 0045 · **PR:** solo; al abrirlo, se para hasta
el `db push` y la fusión de Dan.

**Qué deja hecho:** `ingresos_al_sistema` devuelve, solo a la administración, quién entró y quién
salió y cuándo; `constancias_de_borrado` y `descargas_de_clientes` añaden el nombre de la persona a
dos tablas que ya eran de la administración; y una prueba fija la lista de tablas auditadas, que es
la que el catálogo de la T2 tiene que cubrir.

**Files:**

- Create: `supabase/migrations/0045_historial.sql`, `supabase/tests/0045_historial.test.sql`
- Modify: `src/tipos/database.types.ts` (regenerado)

**Interfaces:**

- Consumes: `app.es_rol`, `auth.audit_log_entries` (`payload json` con `action`, `actor_id`,
  `actor_username`; `created_at`), `public.supresiones`, `public.exportaciones_clientes`,
  `public.perfiles`.
- Produces: `public.ingresos_al_sistema(p_desde timestamptz, p_hasta timestamptz, p_usuario uuid
default null) returns table (ocurrido_en timestamptz, accion text, usuario_id uuid, correo text,
nombre text)` — `accion` es `'ingreso'` o `'salida'`; como mucho 500 filas, de la más reciente a la
  más antigua. Vistas `public.constancias_de_borrado (id, cliente_id, borrado_en, motivo,
borrado_por, borrado_por_nombre)` y `public.descargas_de_clientes (id, exportado_en, exportado_por,
exportado_por_nombre, formato, cantidad, zona, estado)`.

### Paso 1 — La prueba de la base

- [ ] Crear `supabase/tests/0045_historial.test.sql`:

```sql
-- Verifica lo que añade el historial del panel (0045).
--
-- Lo que se defiende: que los ingresos al sistema los vea solo la
-- administración, y que sean ingresos y salidas (no altas ni refrescos de
-- sesión); que las dos vistas nuevas no enseñen nada a quien no es de la
-- administración; y que la lista de tablas auditadas sea la que el catálogo de
-- la aplicación espera (`src/lib/auditoria/catalogo.ts`).
begin;
select plan(13);

insert into auth.users (id, email, created_at, updated_at) values
  ('22222222-2222-2222-2222-222222222222', 'admin@pimpos.test',   now(), now()),
  ('33333333-3333-3333-3333-333333333333', 'inge@pimpos.test',    now(), now()),
  ('44444444-4444-4444-4444-444444444444', 'reparto@pimpos.test', now(), now());
update public.perfiles set rol = 'administrador', activo = true, nombre_completo = 'Debra Prueba'
 where id = '22222222-2222-2222-2222-222222222222';
update public.perfiles set rol = 'ingeniero',  activo = true, nombre_completo = 'Marcos Prueba'
 where id = '33333333-3333-3333-3333-333333333333';
update public.perfiles set rol = 'repartidor', activo = true where id = '44444444-4444-4444-4444-444444444444';

-- El registro de Supabase, como lo deja Auth: un ingreso y una salida de
-- Marcos, un refresco de sesión y un alta (que NO son ingresos), y un ingreso
-- de hace un mes (fuera del periodo que se pide).
insert into auth.audit_log_entries (instance_id, id, payload, created_at) values
  ('00000000-0000-0000-0000-000000000000', gen_random_uuid(),
   '{"action":"login","actor_id":"33333333-3333-3333-3333-333333333333","actor_username":"inge@pimpos.test"}',
   now() - interval '2 hours'),
  ('00000000-0000-0000-0000-000000000000', gen_random_uuid(),
   '{"action":"logout","actor_id":"33333333-3333-3333-3333-333333333333","actor_username":"inge@pimpos.test"}',
   now() - interval '1 hour'),
  ('00000000-0000-0000-0000-000000000000', gen_random_uuid(),
   '{"action":"token_refreshed","actor_id":"33333333-3333-3333-3333-333333333333","actor_username":"inge@pimpos.test"}',
   now() - interval '90 minutes'),
  ('00000000-0000-0000-0000-000000000000', gen_random_uuid(),
   '{"action":"user_signedup","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role"}',
   now() - interval '3 hours'),
  ('00000000-0000-0000-0000-000000000000', gen_random_uuid(),
   '{"action":"login","actor_id":"22222222-2222-2222-2222-222222222222","actor_username":"admin@pimpos.test"}',
   now() - interval '30 days');

select has_function('public', 'ingresos_al_sistema', array['timestamp with time zone', 'timestamp with time zone', 'uuid'],
  'existe ingresos_al_sistema');
select has_view('public', 'constancias_de_borrado', 'existe constancias_de_borrado');
select has_view('public', 'descargas_de_clientes', 'existe descargas_de_clientes');

-- ---------------------------------------------------------------------------
-- Ingresos: solo la administración
-- ---------------------------------------------------------------------------
set local role authenticated;
set local request.jwt.claims = '{"sub": "33333333-3333-3333-3333-333333333333", "rol": "ingeniero"}';
select throws_ok($$ select * from public.ingresos_al_sistema(now() - interval '1 day', now()) $$,
  '42501', 'Solo la administración puede ver los ingresos al sistema.', 'el ingeniero no ve los ingresos');
set local request.jwt.claims = '{"sub": "44444444-4444-4444-4444-444444444444", "rol": "repartidor"}';
select throws_ok($$ select * from public.ingresos_al_sistema(now() - interval '1 day', now()) $$,
  '42501', null, 'el repartidor tampoco');

set local request.jwt.claims = '{"sub": "22222222-2222-2222-2222-222222222222", "rol": "administrador"}';
select results_eq(
  $$ select accion, correo, nombre from public.ingresos_al_sistema(now() - interval '1 day', now())
      where correo = 'inge@pimpos.test' $$,
  $$ values ('salida', 'inge@pimpos.test', 'Marcos Prueba'), ('ingreso', 'inge@pimpos.test', 'Marcos Prueba') $$,
  'la administración ve el ingreso y la salida, la más reciente primero, con el nombre');
select is(
  (select count(*)::int from public.ingresos_al_sistema(now() - interval '1 day', now())
    where accion not in ('ingreso', 'salida')),
  0, 'no salen ni las altas ni los refrescos de sesión');
select is(
  (select count(*)::int from public.ingresos_al_sistema(now() - interval '1 day', now())
    where correo = 'admin@pimpos.test'),
  0, 'lo de hace un mes queda fuera del periodo pedido');
select is(
  (select count(*)::int from public.ingresos_al_sistema(now() - interval '60 days', now(),
                                                         '22222222-2222-2222-2222-222222222222')),
  1, 'se puede pedir los de una sola persona');
reset role;

select is(has_function_privilege('anon', 'public.ingresos_al_sistema(timestamptz, timestamptz, uuid)', 'EXECUTE'),
  false, 'un anónimo no puede ni llamarla');

-- ---------------------------------------------------------------------------
-- Las dos vistas: solo lo que ya veía la administración
-- ---------------------------------------------------------------------------
insert into public.exportaciones_clientes (exportado_por, formato, cantidad, filtro)
values ('22222222-2222-2222-2222-222222222222', 'xlsx', 7, '{"zona": "Belén", "estado": "activos"}');

set local role authenticated;
set local request.jwt.claims = '{"sub": "22222222-2222-2222-2222-222222222222", "rol": "administrador"}';
select is(
  (select exportado_por_nombre || ' | ' || formato || ' | ' || cantidad || ' | ' || zona || ' | ' || estado
     from public.descargas_de_clientes where cantidad = 7),
  'Debra Prueba | xlsx | 7 | Belén | activos',
  'la administración ve la descarga con el nombre de quien la hizo, la zona y el estado');
set local request.jwt.claims = '{"sub": "33333333-3333-3333-3333-333333333333", "rol": "ingeniero"}';
select is(
  (select count(*)::int from public.descargas_de_clientes) + (select count(*)::int from public.constancias_de_borrado),
  0, 'el ingeniero no ve ni descargas ni constancias');
reset role;

-- ---------------------------------------------------------------------------
-- La lista de tablas auditadas es la que el catálogo espera
-- ---------------------------------------------------------------------------
select is(
  (select array_agg(distinct event_object_table::text order by event_object_table::text)
     from information_schema.triggers
    where trigger_schema = 'public' and action_statement ilike '%registrar_auditoria%'),
  array['almacenes', 'categorias_producto', 'cliente_fotos', 'clientes', 'configuracion_sitio',
        'consentimientos', 'equivalencias', 'faqs', 'galeria', 'guias', 'insumos', 'lotes_insumo',
        'movimiento_lotes', 'movimientos_insumo', 'novedades', 'perfiles', 'producto_imagenes',
        'producto_variantes', 'productos', 'proveedores', 'roles', 'slides', 'solicitudes_baja',
        'testimonios', 'zonas_reparto'],
  'se auditan estas 25 tablas: si cambia la lista, hay que darle su frase en src/lib/auditoria/catalogo.ts');

select * from finish();
rollback;
```

> La prueba mete filas en `auth.audit_log_entries` como `postgres`: es el mismo camino que usa Auth.
> Si la tabla exige alguna columna más en la versión instalada, el `insert` lo dirá: añadirla con su
> valor por defecto y anotarlo en «Lo que resultó distinto».

- [ ] Ejecutar: `supabase test db`
      **Esperado:** FALLA `0045` («function public.ingresos_al_sistema… does not exist»). Si fallan
      otras por restos de E2E, `supabase db reset` antes (AGENTS.md).

### Paso 2 — La migración

- [ ] Crear `supabase/migrations/0045_historial.sql`:

```sql
-- =============================================================================
-- 0045_historial.sql
-- Lo que necesita la pantalla del historial (F7, módulo de auditoría). El
-- historial de cambios NO necesita nada: lee `public.auditoria` (0007). Aquí
-- va lo que faltaba para sus otras tres pestañas, todo de solo lectura.
--
--   1. `ingresos_al_sistema`: quién entró y quién salió, del registro de Auth.
--   2. `constancias_de_borrado` y `descargas_de_clientes`: las tablas de 0043,
--      con el nombre de la persona.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Guarda: sin poder leer el registro de Auth, esta migración no debe aplicarse.
--
-- `ingresos_al_sistema` es de quien corre la migración. Si ese rol no puede
-- leer `auth.audit_log_entries`, o no salta su RLS, la pestaña «Ingresos»
-- saldría vacía para siempre, sin decir por qué. Mejor que la migración no
-- entre, avisando (misma idea que la guarda de 0030).
-- -----------------------------------------------------------------------------
do $$
declare
  v_leer    boolean := has_table_privilege(current_user, 'auth.audit_log_entries', 'SELECT');
  v_sin_rls boolean := (select rolbypassrls or rolsuper from pg_roles where rolname = current_user);
  v_con_rls boolean := (select relrowsecurity from pg_class where oid = 'auth.audit_log_entries'::regclass);
begin
  if not v_leer or (v_con_rls and not v_sin_rls) then
    raise exception using
      message = format(
        '0045 no se aplicó: el rol %s no puede leer auth.audit_log_entries. Sin eso, la pestaña «Ingresos» del historial saldría vacía.',
        current_user),
      hint = 'No se aplicó nada de esta migración. Revisa los privilegios de ese rol sobre el esquema auth antes de volver a intentarlo.';
  end if;
end;
$$;

-- -----------------------------------------------------------------------------
-- 1. Ingresos al sistema
--
-- `security definer`: el registro de Auth no lo puede leer nadie con sesión.
-- Por eso comprueba el rol ella misma, y solo devuelve lo que la administración
-- ya puede saber: quién usa el panel. Solo `login` y `logout`: las altas y las
-- eliminaciones de usuarios ya salen en el historial de cambios (`perfiles`), y
-- un refresco de sesión no es un ingreso. `payload` es `json`, no `jsonb`.
-- Supabase no anota los intentos fallidos ni la IP (comprobado el 06/10/2026).
-- -----------------------------------------------------------------------------
create or replace function public.ingresos_al_sistema(
  p_desde   timestamptz,
  p_hasta   timestamptz,
  p_usuario uuid default null
)
returns table (
  ocurrido_en timestamptz,
  accion      text,
  usuario_id  uuid,
  correo      text,
  nombre      text
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not (select app.es_rol('superadmin', 'administrador')) then
    raise exception 'Solo la administración puede ver los ingresos al sistema.' using errcode = '42501';
  end if;

  return query
  select e.created_at,
         case e.payload ->> 'action' when 'login' then 'ingreso' else 'salida' end,
         p.id,
         e.payload ->> 'actor_username',
         p.nombre_completo
    from auth.audit_log_entries e
    -- Por texto: `actor_id` viene dentro de un JSON y no siempre es un uuid.
    left join public.perfiles p on p.id::text = e.payload ->> 'actor_id'
   where e.payload ->> 'action' in ('login', 'logout')
     and e.created_at >= p_desde
     and e.created_at <  p_hasta
     and (p_usuario is null or e.payload ->> 'actor_id' = p_usuario::text)
   order by e.created_at desc
   limit 500;
end;
$$;

comment on function public.ingresos_al_sistema(timestamptz, timestamptz, uuid) is
  'Quién entró y quién salió del panel, del registro de Auth. Solo administración; como mucho 500 filas.';
revoke execute on function public.ingresos_al_sistema(timestamptz, timestamptz, uuid) from public, anon;
grant execute on function public.ingresos_al_sistema(timestamptz, timestamptz, uuid) to authenticated;

-- -----------------------------------------------------------------------------
-- 2. Constancias de borrado y descargas, con el nombre de la persona
--
-- `security_invoker`: las vistas no dan nada que las tablas no dieran ya. Solo
-- la administración lee `supresiones` y `exportaciones_clientes` (0043), y la
-- administración lee todos los perfiles.
-- -----------------------------------------------------------------------------
create view public.constancias_de_borrado
with (security_invoker = true) as
select s.id,
       s.cliente_id,
       s.borrado_en,
       s.motivo,
       s.borrado_por,
       p.nombre_completo as borrado_por_nombre
  from public.supresiones s
  left join public.perfiles p on p.id = s.borrado_por;

comment on view public.constancias_de_borrado is
  'Constancias de borrado de datos de clientes (0043) con el nombre de quien borró. security_invoker.';
grant select on public.constancias_de_borrado to authenticated;

create view public.descargas_de_clientes
with (security_invoker = true) as
select e.id,
       e.exportado_en,
       e.exportado_por,
       p.nombre_completo     as exportado_por_nombre,
       e.formato,
       e.cantidad,
       e.filtro ->> 'zona'   as zona,
       e.filtro ->> 'estado' as estado
  from public.exportaciones_clientes e
  left join public.perfiles p on p.id = e.exportado_por;

comment on view public.descargas_de_clientes is
  'Descargas de la lista de clientes (0043) con el nombre de quien descargó. security_invoker.';
grant select on public.descargas_de_clientes to authenticated;
```

- [ ] Ejecutar: `supabase db reset && supabase test db`
      **Esperado:** `Result: PASS`, `0045` incluida (13) y también `0016`, que recorre todas las vistas
      de `public` buscando `security_invoker`. Después, `bash supabase/seeds/imagenes/subir-imagenes.sh`.

> Si `results_eq` de los ingresos falla por el **orden** (dos filas con el mismo instante), no es el
> caso: la prueba las separa una hora. Si falla por el **nombre**, es que el perfil de prueba no
> tomó `nombre_completo`: mirar el `update` de la fixture.

### Paso 3 — Tipos y cierre

- [ ] `pnpm supabase:tipos` y `pnpm typecheck && pnpm lint && pnpm test`
      **Esperado:** sin errores; `database.types.ts` gana la función y las dos vistas.
- [ ] `bash scripts/verificar-fase0.sh && bash scripts/verificar-storage.sh && bash scripts/verificar-sitio-publico.sh`
      **Esperado:** los tres OK (`verificar-sitio-publico.sh` pide las vistas públicas con la llave
      anónima: las dos nuevas no son públicas y no las toca).
- [ ] Commit:

```bash
git add supabase/migrations/0045_historial.sql supabase/tests/0045_historial.test.sql src/tipos/database.types.ts
git commit -m "feat(historial): ingresos al sistema y vistas de constancias y descargas"
```

- [ ] Revisión de la rama con un subagente; lo Importante, arreglado con prueba vista fallar.
- [ ] PR (sin atribución) y **parar**: Dan hace `supabase db push` desde `PIMPOS_SYSTEM` y fusiona.
      En el PR, avisar: si el `db push` falla con «0045 no se aplicó…», no es un error del SQL sino
      la guarda — el rol de producción no puede leer el registro de Auth, y hay que verlo antes.

---

## Tarea 2 — Las frases y la pestaña Cambios

**Rama:** `feat/f7-t2-t3-historial` (desde `main` con la T1 fusionada; la T3 sigue en la misma) ·
**Migración:** no · **PR:** junto con la T3.

**Qué deja hecho:** la lógica que convierte una fila del registro en una frase y en una lista de
diferencias, probada; «Historial» en el menú de la administración; la pestaña **Cambios** con sus
filtros y «Ver más»; y la pantalla de un cambio con su «Detalle técnico».

**Files:**

- Create: `src/lib/auditoria/catalogo.ts` + `.test.ts`, `src/lib/auditoria/campos.ts` + `.test.ts`,
  `src/lib/auditoria/redactar.ts` + `.test.ts`, `src/lib/auditoria/filtros.ts` + `.test.ts`,
  `src/lib/auditoria/datos.ts`
- Modify: `src/lib/panel/navegacion.ts` + `.test.ts`, `src/components/panel/barra-lateral.tsx`
- Create: `src/components/panel/pestanas-historial.tsx`, `src/components/panel/filtros-historial.tsx`,
  `src/components/panel/lista-de-cambios.tsx`
- Create: `src/app/(admin)/admin/auditoria/page.tsx`, `src/app/(admin)/admin/auditoria/[id]/page.tsx`
- Create: `e2e/panel-historial.spec.ts` · Modify: `e2e/panel-accesibilidad.spec.ts`

**Interfaces:**

- Consumes: la vista `public.auditoria` (`id`, `tabla`, `registro_id`, `operacion`, `usuario_id`,
  `usuario_correo`, `usuario_nombre`, `rol`, `datos_antes`, `datos_despues`, `ocurrido_en`),
  `formatearFechaLima` (`src/lib/panel/hora-lima.ts`), `hoyEnLima` y `sumarDias`
  (`src/lib/insumos/periodo.ts`), `formatearSoles` (`src/lib/insumos/formato-reporte.ts`),
  `formatearCantidad` y `nombreDeUnidad` (`src/lib/insumos/unidades.ts`), `NOMBRE_TIPO` y
  `NOMBRE_MOTIVO` (`src/lib/insumos/kardex.ts`), `NOMBRE_DEL_ROL` (`src/lib/auth/roles.ts`).
- Produces:
  - `catalogo.ts`: `type Datos = Record<string, unknown>`, `type Nombres = Readonly<Record<string,
string>>`, `type Seccion`, `SECCIONES`, `TABLAS_AUDITADAS`, `infoDeTabla(tabla)`,
    `tablasVisibles(seccion?)`, `HIJOS_DE` (`producto` | `insumo` | `cliente` → tablas y campo).
  - `campos.ts`: `etiquetaDe(campo)`, `escribirValor(campo, valor, nombres)`, `esDeControl(campo)`.
  - `redactar.ts`: `type Cambio`, `type Diferencia = { campo: string; etiqueta: string; antes:
string; despues: string }`, `quien(c)`, `diferencias(c, nombres)`, `accion(c, nombres)`,
    `frase(c, nombres)`, `idsReferidos(cambios)`.
  - `filtros.ts`: `type Filtros`, `leerFiltros(params, ahora)`, `limitesDelPeriodo(periodo)`.
  - `datos.ts` (`server-only`): `leerCambios(f: Filtros)`, `leerCambio(id: number)`,
    `resolverNombres(cambios)`, `personasDelPanel()`.
  - `<PestanasHistorial activa />`, `<FiltrosHistorial … />`, `<ListaDeCambios cambios nombres etiqueta />`.

### Paso 1 — El catálogo de tablas, primero la prueba

- [ ] Crear `src/lib/auditoria/catalogo.test.ts`:

```ts
import { describe, expect, it } from "vitest";

import { HIJOS_DE, infoDeTabla, SECCIONES, TABLAS_AUDITADAS, tablasVisibles } from "./catalogo";

describe("catálogo de tablas", () => {
  it("cubre las 25 tablas auditadas (la misma lista que fija el pgTAP de 0045)", () => {
    expect(TABLAS_AUDITADAS).toHaveLength(25);
    for (const tabla of TABLAS_AUDITADAS) {
      const info = infoDeTabla(`public.${tabla}`);
      expect(info.conocida, tabla).toBe(true);
      expect(
        SECCIONES.map((s) => s.valor),
        tabla,
      ).toContain(info.seccion);
    }
  });

  it("nombra cada cosa con su artículo, y a quien cuelga, con su dueño", () => {
    expect(infoDeTabla("public.productos").referencia({ nombre: "Pan francés" }, {})).toBe(
      "el producto Pan francés",
    );
    expect(
      infoDeTabla("public.producto_variantes").referencia(
        { nombre: "Unidad", producto_id: "p1" },
        { p1: "Pan francés" },
      ),
    ).toBe("la presentación Unidad de Pan francés");
    expect(infoDeTabla("public.zonas_reparto").referencia({ nombre: "Belén" }, {})).toBe(
      "la zona Belén",
    );
  });

  it("si el dueño ya no existe, lo dice en vez de fallar (Review Focus)", () => {
    expect(
      infoDeTabla("public.producto_variantes").referencia(
        { nombre: "Unidad", producto_id: "x" },
        {},
      ),
    ).toBe("la presentación Unidad de un producto que ya no existe");
    expect(infoDeTabla("public.productos").referencia({}, {})).toBe("un producto");
  });

  it("una tabla que no está en el catálogo se dice de forma genérica", () => {
    const info = infoDeTabla("public.tabla_del_futuro");
    expect(info.conocida).toBe(false);
    expect(info.interna).toBe(true);
    expect(info.referencia({ nombre: "X" }, {})).toBe("un registro de tabla_del_futuro");
  });

  it("las tablas internas no salen en la lista llana", () => {
    const visibles = tablasVisibles();
    for (const interna of ["movimiento_lotes", "lotes_insumo", "almacenes", "roles"]) {
      expect(visibles).not.toContain(`public.${interna}`);
    }
    expect(visibles).toContain("public.movimientos_insumo");
    expect(visibles).toHaveLength(21);
  });

  it("una sección trae solo sus tablas visibles", () => {
    expect(tablasVisibles("clientes").sort()).toEqual([
      "public.cliente_fotos",
      "public.clientes",
      "public.consentimientos",
      "public.zonas_reparto",
    ]);
    expect(tablasVisibles("insumos")).not.toContain("public.lotes_insumo");
  });

  it("lleva a la pantalla del registro, o a la de su dueño", () => {
    expect(infoDeTabla("public.productos").ruta?.({ id: "p1" })).toBe(
      "/admin/contenido/productos/p1",
    );
    expect(infoDeTabla("public.producto_variantes").ruta?.({ producto_id: "p1" })).toBe(
      "/admin/contenido/productos/p1",
    );
    expect(infoDeTabla("public.clientes").ruta?.({ id: "c1" })).toBe("/admin/clientes/c1");
    expect(infoDeTabla("public.movimiento_lotes").ruta).toBeUndefined();
  });

  it("sabe qué cuelga de un producto, de un insumo y de un cliente («Ver historial»)", () => {
    expect(HIJOS_DE.producto).toEqual({ tabla: "public.productos", campo: "producto_id" });
    expect(HIJOS_DE.insumo.campo).toBe("insumo_id");
    expect(HIJOS_DE.cliente.campo).toBe("cliente_id");
  });
});
```

- [ ] Ejecutar: `pnpm test -- src/lib/auditoria/catalogo.test.ts`
      **Esperado:** FALLA («Cannot find module './catalogo'»).

- [ ] Crear `src/lib/auditoria/catalogo.ts`:

```ts
/**
 * Qué es cada tabla auditada, para decirlo en llano en el historial (F7).
 *
 * La lista de tablas es la que fija `supabase/tests/0045_historial.test.sql`:
 * si una migración audita una tabla nueva, esa prueba falla y manda aquí. Una
 * tabla sin entrada no rompe nada —se dice «un registro de …»—, pero tampoco
 * sale en la lista llana hasta que alguien le dé su frase.
 */
export type Datos = Record<string, unknown>;
/** Nombres de los registros a los que apunta una fila, por su id (los resuelve `datos.ts`). */
export type Nombres = Readonly<Record<string, string>>;

export type Seccion =
  "productos" | "novedades" | "contenido" | "configuracion" | "insumos" | "clientes" | "usuarios";

export const SECCIONES: readonly { valor: Seccion; nombre: string }[] = [
  { valor: "productos", nombre: "Productos" },
  { valor: "novedades", nombre: "Novedades y portada" },
  { valor: "contenido", nombre: "Contenido del sitio" },
  { valor: "configuracion", nombre: "Configuración" },
  { valor: "insumos", nombre: "Insumos" },
  { valor: "clientes", nombre: "Clientes" },
  { valor: "usuarios", nombre: "Usuarios" },
];

export type InfoTabla = {
  conocida: boolean;
  seccion: Seccion | null;
  /** Mecanismo interno: fuera de la lista llana, visible en el detalle técnico. */
  interna: boolean;
  /** «el producto Pan francés», «una foto de la casa de Rosa Quispe». Nunca falla. */
  referencia: (d: Datos, n: Nombres) => string;
  /** A dónde lleva «Ir a…». Sin ella, el cambio no tiene pantalla propia. */
  ruta?: (d: Datos) => string | null;
};

const texto = (v: unknown): string | null => (typeof v === "string" && v.trim() ? v.trim() : null);

/** «el producto Pan francés»; sin nombre (fila tachada o vacía), «un producto». */
const conNombre =
  (definido: string, indefinido: string, campo = "nombre") =>
  (d: Datos): string => {
    const nombre = texto(d[campo]);
    return nombre ? `${definido} ${nombre}` : indefinido;
  };

/** El nombre del registro al que apunta `campo`, o que ya no existe. */
const dueno = (d: Datos, n: Nombres, campo: string, siFalta: string): string => {
  const id = texto(d[campo]);
  return (id && n[id]) || siFalta;
};

const aRuta =
  (base: string, campo = "id") =>
  (d: Datos): string | null => {
    const id = texto(d[campo]);
    return id ? `${base}/${id}` : null;
  };

type Entrada = Omit<InfoTabla, "conocida" | "interna"> & { interna?: true };

const TABLAS: Readonly<Record<string, Entrada>> = {
  // --- Productos ---
  productos: {
    seccion: "productos",
    referencia: conNombre("el producto", "un producto"),
    ruta: aRuta("/admin/contenido/productos"),
  },
  producto_variantes: {
    seccion: "productos",
    referencia: (d, n) =>
      `${conNombre("la presentación", "una presentación")(d)} de ${dueno(d, n, "producto_id", "un producto que ya no existe")}`,
    ruta: aRuta("/admin/contenido/productos", "producto_id"),
  },
  producto_imagenes: {
    seccion: "productos",
    referencia: (d, n) =>
      `una foto de ${dueno(d, n, "producto_id", "un producto que ya no existe")}`,
    ruta: aRuta("/admin/contenido/productos", "producto_id"),
  },
  categorias_producto: {
    seccion: "productos",
    referencia: conNombre("la categoría", "una categoría"),
    ruta: aRuta("/admin/contenido/categorias"),
  },
  // --- Novedades y portada ---
  novedades: {
    seccion: "novedades",
    referencia: conNombre("la novedad", "una novedad", "titulo"),
    ruta: aRuta("/admin/contenido/novedades"),
  },
  slides: {
    seccion: "novedades",
    referencia: conNombre("la diapositiva de portada", "una diapositiva de portada", "titulo"),
    ruta: aRuta("/admin/contenido/portada"),
  },
  // --- Contenido del sitio ---
  faqs: {
    seccion: "contenido",
    referencia: conNombre("la pregunta", "una pregunta frecuente", "pregunta"),
    ruta: aRuta("/admin/contenido/preguntas"),
  },
  galeria: {
    seccion: "contenido",
    referencia: conNombre("la foto de galería", "una foto de la galería", "titulo"),
    ruta: aRuta("/admin/contenido/galeria"),
  },
  guias: {
    seccion: "contenido",
    referencia: conNombre("la guía", "una guía", "titulo"),
    ruta: aRuta("/admin/contenido/guias"),
  },
  testimonios: {
    seccion: "contenido",
    referencia: conNombre("el testimonio de", "un testimonio"),
    ruta: aRuta("/admin/contenido/testimonios"),
  },
  // --- Configuración ---
  configuracion_sitio: {
    seccion: "configuracion",
    referencia: (d) => {
      const clave = texto(d.clave);
      return clave ? `el dato «${clave}» de la configuración` : "un dato de la configuración";
    },
    ruta: () => "/admin/configuracion",
  },
  // --- Insumos ---
  insumos: {
    seccion: "insumos",
    referencia: conNombre("el insumo", "un insumo"),
    ruta: aRuta("/admin/insumos"),
  },
  equivalencias: {
    seccion: "insumos",
    referencia: (d, n) =>
      `una unidad de compra de ${dueno(d, n, "insumo_id", "un insumo que ya no existe")}`,
    ruta: aRuta("/admin/insumos", "insumo_id"),
  },
  proveedores: {
    seccion: "insumos",
    referencia: conNombre("el proveedor", "un proveedor"),
    ruta: aRuta("/admin/insumos/proveedores"),
  },
  movimientos_insumo: {
    seccion: "insumos",
    referencia: (d, n) =>
      `un movimiento de ${dueno(d, n, "insumo_id", "un insumo que ya no existe")}`,
    ruta: aRuta("/admin/insumos", "insumo_id"),
  },
  solicitudes_baja: {
    seccion: "insumos",
    referencia: (d, n) =>
      `la baja pedida de ${dueno(d, n, "insumo_id", "un insumo que ya no existe")}`,
    ruta: () => "/admin/insumos/bajas",
  },
  lotes_insumo: {
    seccion: "insumos",
    interna: true,
    referencia: (d, n) => `un lote de ${dueno(d, n, "insumo_id", "un insumo que ya no existe")}`,
  },
  movimiento_lotes: {
    seccion: "insumos",
    interna: true,
    referencia: () => "el reparto de un movimiento entre lotes",
  },
  almacenes: {
    seccion: "insumos",
    interna: true,
    referencia: conNombre("el almacén", "un almacén"),
  },
  // --- Clientes ---
  clientes: {
    seccion: "clientes",
    referencia: conNombre("el cliente", "un cliente", "nombre_completo"),
    ruta: aRuta("/admin/clientes"),
  },
  cliente_fotos: {
    seccion: "clientes",
    referencia: (d, n) =>
      `una foto de la casa de ${dueno(d, n, "cliente_id", "un cliente que ya no está")}`,
    ruta: aRuta("/admin/clientes", "cliente_id"),
  },
  consentimientos: {
    seccion: "clientes",
    referencia: (d, n) => `el permiso de ${dueno(d, n, "cliente_id", "un cliente que ya no está")}`,
    ruta: aRuta("/admin/clientes", "cliente_id"),
  },
  zonas_reparto: {
    seccion: "clientes",
    referencia: conNombre("la zona", "una zona"),
    ruta: aRuta("/admin/clientes/zonas"),
  },
  // --- Usuarios ---
  perfiles: {
    seccion: "usuarios",
    referencia: conNombre("la cuenta de", "una cuenta", "nombre_completo"),
    ruta: aRuta("/admin/usuarios"),
  },
  roles: {
    seccion: "usuarios",
    interna: true,
    referencia: conNombre("el rol", "un rol"),
  },
};

export const TABLAS_AUDITADAS: readonly string[] = Object.keys(TABLAS).sort();

/** `tabla` llega como en el registro: `public.productos`. */
export function infoDeTabla(tabla: string): InfoTabla {
  const nombre = tabla.replace(/^public\./, "");
  const entrada = TABLAS[nombre];
  if (!entrada) {
    return {
      conocida: false,
      seccion: null,
      interna: true,
      referencia: () => `un registro de ${nombre}`,
    };
  }
  return { ...entrada, conocida: true, interna: entrada.interna === true };
}

/** Las tablas de la lista llana, de todas las secciones o de una. Con su esquema. */
export function tablasVisibles(seccion?: Seccion): string[] {
  return Object.entries(TABLAS)
    .filter(([, t]) => !t.interna && (!seccion || t.seccion === seccion))
    .map(([nombre]) => `public.${nombre}`);
}

/**
 * «Ver historial» de un producto, un insumo o un cliente: sus propios cambios
 * (`registro_id`) más los de lo que cuelga de él, que lo señalan con `campo`.
 */
export const HIJOS_DE = {
  producto: { tabla: "public.productos", campo: "producto_id" },
  insumo: { tabla: "public.insumos", campo: "insumo_id" },
  cliente: { tabla: "public.clientes", campo: "cliente_id" },
} as const;
export type Dueno = keyof typeof HIJOS_DE;
```

- [ ] Ejecutar: `pnpm test -- src/lib/auditoria/catalogo.test.ts`
      **Esperado:** PASAN (8).

### Paso 2 — Los campos, primero la prueba

- [ ] Crear `src/lib/auditoria/campos.test.ts`:

```ts
import { describe, expect, it } from "vitest";

import { esDeControl, escribirValor, etiquetaDe, recortar } from "./campos";

describe("campos del historial", () => {
  it("cada campo conocido tiene su nombre en llano", () => {
    expect(etiquetaDe("precio")).toBe("Precio");
    expect(etiquetaDe("nombre_completo")).toBe("Nombre");
    expect(etiquetaDe("stock_minimo")).toBe("Cantidad mínima");
  });

  it("un campo desconocido se dice con su nombre técnico, legible (nunca falla)", () => {
    expect(etiquetaDe("campo_del_futuro")).toBe("Campo del futuro");
  });

  it("los campos de control no son un cambio", () => {
    for (const c of ["id", "created_at", "updated_at", "created_by", "updated_by", "secuencia"]) {
      expect(esDeControl(c), c).toBe(true);
    }
    expect(esDeControl("precio")).toBe(false);
  });

  it("escribe el dinero, el sí o no y lo vacío", () => {
    expect(escribirValor("precio", 0.2, {})).toBe("S/ 0.20");
    expect(escribirValor("costo_total", "125.5", {})).toBe("S/ 125.50");
    expect(escribirValor("activo", true, {})).toBe("Sí");
    expect(escribirValor("destacado", false, {})).toBe("No");
    expect(escribirValor("descripcion", null, {})).toBe("—");
    expect(escribirValor("descripcion", "  ", {})).toBe("—");
  });

  it("escribe las fechas en hora de Iquitos (Review Focus: 04:30 UTC es la noche anterior)", () => {
    expect(escribirValor("aprobada_en", "2026-10-06T04:30:00.000Z", {})).toBe("05/10/2026 23:30");
    expect(escribirValor("fecha_vencimiento", "2026-12-01", {})).toBe("01/12/2026");
  });

  it("escribe los estados, los roles y los tipos con sus palabras", () => {
    expect(escribirValor("estado", "en_revision", {})).toBe("En revisión");
    expect(escribirValor("rol", "ingeniero", {})).toBe("Ingeniero");
    expect(escribirValor("tipo", "ajuste", {})).toBe("Conteo");
    expect(escribirValor("motivo_baja", "vencimiento", {})).toBe("Vencimiento");
  });

  it("un identificador se cambia por el nombre de lo que señala, o dice que ya no existe", () => {
    expect(escribirValor("zona_id", "z1", { z1: "Belén" })).toBe("Belén");
    expect(escribirValor("zona_id", "z9", {})).toBe("algo que ya no existe");
    expect(escribirValor("registrado_por", "u1", { u1: "Marcos" })).toBe("Marcos");
  });

  it("lo que no es texto se escribe legible, no como [object Object] (Review Focus)", () => {
    expect(escribirValor("valor", { lunes: ["04:00", "20:00"] }, {})).toBe(
      '{"lunes":["04:00","20:00"]}',
    );
    expect(escribirValor("valor", "+51 947 874 820", {})).toBe("+51 947 874 820");
    expect(escribirValor("cantidad", 50, {})).toBe("50");
  });

  it("recorta lo largo para la lista (Review Focus)", () => {
    expect(recortar("corto", 20)).toBe("corto");
    expect(recortar("x".repeat(100), 20)).toBe(`${"x".repeat(19)}…`);
  });
});
```

- [ ] Ejecutar: `pnpm test -- src/lib/auditoria/campos.test.ts`
      **Esperado:** FALLA («Cannot find module './campos'»).

- [ ] Crear `src/lib/auditoria/campos.ts`:

```ts
import { NOMBRE_DEL_ROL } from "@/lib/auth/roles";
import { formatearSoles } from "@/lib/insumos/formato-reporte";
import { NOMBRE_MOTIVO, NOMBRE_TIPO } from "@/lib/insumos/kardex";
import { formatearCantidad } from "@/lib/insumos/unidades";
import { formatearFechaLima } from "@/lib/panel/hora-lima";

import type { Nombres } from "./catalogo";

/** Columnas que cambian solas o que solo identifican: no son «un cambio». */
const DE_CONTROL = new Set([
  "id",
  "created_at",
  "updated_at",
  "created_by",
  "updated_by",
  "secuencia",
]);
export const esDeControl = (campo: string): boolean => DE_CONTROL.has(campo);

const ETIQUETAS: Readonly<Record<string, string>> = {
  nombre: "Nombre",
  nombre_completo: "Nombre",
  titulo: "Título",
  subtitulo: "Subtítulo",
  slug: "Dirección en el sitio",
  descripcion: "Descripción",
  resumen: "Resumen",
  contenido: "Contenido",
  pregunta: "Pregunta",
  respuesta: "Respuesta",
  texto: "Texto",
  procedencia: "De dónde es",
  estado: "Estado",
  activo: "Activo",
  destacado: "Destacado",
  orden: "Orden",
  precio: "Precio",
  moneda: "Moneda",
  unidad_venta: "Se vende por",
  es_predeterminada: "Presentación principal",
  es_principal: "Principal",
  peso_gramos: "Peso (g)",
  stock_disponible: "Disponible",
  sku: "Código",
  categoria_id: "Categoría",
  producto_id: "Producto",
  variante_id: "Presentación",
  imagen_url: "Foto",
  imagen_movil_url: "Foto para celular",
  imagen_alt: "Texto de la foto",
  alt: "Texto de la foto",
  ruta: "Archivo",
  enlace_url: "Enlace",
  texto_boton: "Texto del botón",
  enfoque: "Encuadre de la foto",
  categoria: "Categoría",
  tipo: "Tipo",
  vigencia_inicio: "Se publica desde",
  vigencia_fin: "Se publica hasta",
  aprobada_por: "Aprobada por",
  aprobada_en: "Aprobada el",
  comentario_revision: "Comentario de la revisión",
  deleted_at: "Borrado el",
  es_demo: "De ejemplo",
  clave: "Dato",
  valor: "Valor",
  grupo: "Grupo",
  es_publico: "Se ve en el sitio",
  rol: "Rol",
  celular: "Celular",
  telefono: "Teléfono",
  correo: "Correo",
  contacto: "Contacto",
  direccion: "Dirección",
  referencia: "Referencia",
  zona_id: "Zona",
  latitud: "Latitud",
  longitud: "Longitud",
  observacion: "Observación",
  cliente_id: "Cliente",
  modo: "Cómo se dio",
  otorgado_en: "Dado el",
  registrado_por: "Lo anotó",
  texto_version: "Versión del texto",
  revocado_en: "Retirado el",
  revocado_por: "Lo retiró",
  insumo_id: "Insumo",
  unidad_base_id: "Unidad",
  unidad_id: "Unidad",
  unidad_desde: "Unidad de compra",
  unidad_hacia: "Equivale en",
  factor: "Equivale a",
  presentacion: "Presentación",
  stock_minimo: "Cantidad mínima",
  es_perecible: "Vence",
  proveedor_habitual_id: "Proveedor habitual",
  proveedor_id: "Proveedor",
  almacen_id: "Almacén",
  lote_id: "Lote",
  codigo: "Código",
  fecha_vencimiento: "Vence el",
  costo_unitario: "Costo por unidad",
  costo_total: "Costo total",
  precio_unitario: "Precio por unidad",
  cantidad: "Cantidad",
  cantidad_base: "Cantidad en su unidad",
  ocurrido_en: "Cuándo pasó",
  responsable_id: "Responsable",
  documento_tipo: "Tipo de documento",
  documento_numero: "Número de documento",
  origen_consumo: "Para qué se usó",
  destino_lote: "Para qué lote",
  area_turno: "Área o turno",
  motivo_baja: "Motivo",
  autorizado_por: "La autorizó",
  sentido: "Suma o resta",
  anula_a: "Movimiento que anula",
  comentario_rechazo: "Por qué se rechazó",
  movimiento_id: "Movimiento",
  solicitado_por: "La pidió",
  resuelto_por: "La resolvió",
  resuelto_en: "Resuelta el",
  llegada: "Orden de llegada",
};

/** «Precio»; para un campo que nadie ha nombrado, su nombre técnico sin guiones. */
export function etiquetaDe(campo: string): string {
  const conocida = ETIQUETAS[campo];
  if (conocida) return conocida;
  const legible = campo.replace(/_/g, " ").trim();
  return legible.charAt(0).toUpperCase() + legible.slice(1);
}

const DINERO = new Set(["precio", "precio_unitario", "costo_unitario", "costo_total"]);
const FECHA_Y_HORA = new Set([
  "vigencia_inicio",
  "vigencia_fin",
  "aprobada_en",
  "deleted_at",
  "otorgado_en",
  "revocado_en",
  "ocurrido_en",
  "resuelto_en",
]);
const SOLO_FECHA = new Set(["fecha_vencimiento"]);
/** Campos que guardan el id de otra cosa: se escribe su nombre. */
const SEÑALA_A = new Set([
  "categoria_id",
  "producto_id",
  "variante_id",
  "zona_id",
  "cliente_id",
  "insumo_id",
  "unidad_base_id",
  "unidad_id",
  "unidad_desde",
  "unidad_hacia",
  "proveedor_habitual_id",
  "proveedor_id",
  "almacen_id",
  "aprobada_por",
  "registrado_por",
  "revocado_por",
  "responsable_id",
  "autorizado_por",
  "solicitado_por",
  "resuelto_por",
]);

const PALABRAS: Readonly<Record<string, Readonly<Record<string, string>>>> = {
  estado: {
    borrador: "Borrador",
    en_revision: "En revisión",
    publicado: "Publicado",
    archivado: "Archivado",
    pendiente: "Pendiente",
    aprobada: "Aprobada",
    rechazada: "Rechazada",
  },
  rol: NOMBRE_DEL_ROL,
  motivo_baja: NOMBRE_MOTIVO,
  tipo: {
    ...NOMBRE_TIPO,
    promocion: "Promoción",
    nuevo_producto: "Producto nuevo",
    campania: "Campaña",
    evento: "Evento",
    aviso: "Aviso",
  },
  origen_consumo: { produccion: "Producción", retiro_directo: "Retiro directo" },
  modo: { verbal: "De palabra", escrito: "Por escrito", digital: "Digital" },
};

/** Un valor del registro, escrito para una persona. Nunca lanza. */
export function escribirValor(campo: string, valor: unknown, nombres: Nombres): string {
  if (valor === null || valor === undefined) return "—";
  if (typeof valor === "boolean") return valor ? "Sí" : "No";
  if (typeof valor === "object") return JSON.stringify(valor);

  const crudo = String(valor).trim();
  if (crudo === "") return "—";

  if (DINERO.has(campo)) {
    const n = Number(crudo);
    return Number.isFinite(n) ? formatearSoles(n) : crudo;
  }
  if (FECHA_Y_HORA.has(campo)) return formatearFechaLima(crudo) || crudo;
  if (SOLO_FECHA.has(campo)) {
    const [anio, mes, dia] = crudo.slice(0, 10).split("-");
    return anio && mes && dia ? `${dia}/${mes}/${anio}` : crudo;
  }
  if (SEÑALA_A.has(campo)) return nombres[crudo] ?? "algo que ya no existe";

  const palabra = PALABRAS[campo]?.[crudo];
  if (palabra) return palabra;

  if (typeof valor === "number") return formatearCantidad(valor);
  return crudo;
}

/** Para la lista: lo largo se corta con «…». El detalle lo enseña entero. */
export function recortar(texto: string, maximo: number): string {
  return texto.length <= maximo ? texto : `${texto.slice(0, maximo - 1)}…`;
}
```

> `formatearSoles` debe dar «S/ 0.20»: comprobar su formato en `src/lib/insumos/formato-reporte.ts`
> antes de dar por buena la prueba; si escribe otra cosa (separador de miles, por ejemplo), la
> prueba se ajusta a lo que el panel ya enseña en los reportes, no al revés. `SEÑALA_A` lleva «ñ»:
> si el linter protesta por el identificador, renombrar a `SENALA_A`.

- [ ] Ejecutar: `pnpm test -- src/lib/auditoria/campos.test.ts`
      **Esperado:** PASAN (9).

### Paso 3 — El redactor, primero la prueba

- [ ] Crear `src/lib/auditoria/redactar.test.ts`:

```ts
import { describe, expect, it } from "vitest";

import { accion, type Cambio, diferencias, frase, idsReferidos, quien } from "./redactar";

const NOMBRES = {
  p1: "Pan francés",
  i1: "Harina",
  kg: "kg",
  c1: "Rosa Quispe",
  z1: "Belén",
  z2: "Punchana",
};

function cambio(parcial: Partial<Cambio>): Cambio {
  return {
    id: 1,
    tabla: "public.productos",
    registro_id: "p1",
    operacion: "UPDATE",
    usuario_id: "u1",
    usuario_nombre: "Marcos",
    usuario_correo: "marcos@pimpos.test",
    rol: "ingeniero",
    datos_antes: null,
    datos_despues: null,
    ocurrido_en: "2026-10-06T15:00:00.000Z",
    ...parcial,
  };
}

describe("quien", () => {
  it("dice el nombre; si no lo hay, el correo; si no hubo nadie, el sistema (Review Focus)", () => {
    expect(quien(cambio({}))).toBe("Marcos");
    expect(quien(cambio({ usuario_nombre: "  " }))).toBe("marcos@pimpos.test");
    expect(quien(cambio({ usuario_nombre: null, usuario_correo: null }))).toBe(
      "Alguien cuya cuenta ya no existe",
    );
    expect(quien(cambio({ usuario_id: null, usuario_nombre: null, usuario_correo: null }))).toBe(
      "El sistema",
    );
  });
});

describe("diferencias", () => {
  it("de un cambio, solo lo que cambió, sin los campos de control", () => {
    const c = cambio({
      tabla: "public.producto_variantes",
      datos_antes: { id: "v1", nombre: "Unidad", precio: 0.2, updated_at: "a", producto_id: "p1" },
      datos_despues: {
        id: "v1",
        nombre: "Unidad",
        precio: 0.25,
        updated_at: "b",
        producto_id: "p1",
      },
    });
    expect(diferencias(c, NOMBRES)).toEqual([
      { campo: "precio", etiqueta: "Precio", antes: "S/ 0.20", despues: "S/ 0.25" },
    ]);
  });

  it("de un alta, lo que trae; de una eliminación, lo que había", () => {
    const alta = cambio({
      operacion: "INSERT",
      tabla: "public.zonas_reparto",
      datos_despues: { id: "z1", nombre: "Belén", descripcion: null, activo: true },
    });
    expect(diferencias(alta, NOMBRES)).toEqual([
      { campo: "nombre", etiqueta: "Nombre", antes: "—", despues: "Belén" },
      { campo: "activo", etiqueta: "Activo", antes: "—", despues: "Sí" },
    ]);
    const baja = cambio({ operacion: "DELETE", datos_antes: { id: "z1", nombre: "Belén" } });
    expect(diferencias(baja, NOMBRES)).toEqual([
      { campo: "nombre", etiqueta: "Nombre", antes: "Belén", despues: "—" },
    ]);
  });

  it("de una ficha con los datos borrados a pedido, nada (Review Focus)", () => {
    const c = cambio({
      tabla: "public.clientes",
      datos_antes: { borrado: true },
      datos_despues: { borrado: true },
    });
    expect(diferencias(c, NOMBRES)).toEqual([]);
  });
});

describe("accion", () => {
  it("un solo dato cambiado se dice con su antes y su después", () => {
    const c = cambio({
      tabla: "public.producto_variantes",
      datos_antes: { nombre: "Unidad", precio: 0.2, producto_id: "p1" },
      datos_despues: { nombre: "Unidad", precio: 0.25, producto_id: "p1" },
    });
    expect(accion(c, NOMBRES)).toBe(
      "cambió la presentación Unidad de Pan francés: Precio S/ 0.20 → S/ 0.25",
    );
    expect(frase(c, NOMBRES)).toBe(
      "Marcos cambió la presentación Unidad de Pan francés: Precio S/ 0.20 → S/ 0.25",
    );
  });

  it("varios datos cambiados se cuentan", () => {
    const c = cambio({
      datos_antes: { nombre: "Pan francés", descripcion: "a", destacado: false },
      datos_despues: { nombre: "Pan francés", descripcion: "b", destacado: true },
    });
    expect(accion(c, NOMBRES)).toBe("cambió el producto Pan francés (2 datos)");
  });

  it("un valor largo se recorta en la frase (Review Focus)", () => {
    const c = cambio({
      tabla: "public.guias",
      datos_antes: { titulo: "Cómo conservar el pan", contenido: "a".repeat(300) },
      datos_despues: { titulo: "Cómo conservar el pan", contenido: "b".repeat(300) },
    });
    const texto = accion(c, NOMBRES);
    expect(texto.length).toBeLessThan(160);
    expect(texto).toContain("…");
  });

  it("crear, eliminar y borrar (que en el panel es una marca) se dicen distinto", () => {
    expect(
      accion(cambio({ operacion: "INSERT", datos_despues: { nombre: "Pan francés" } }), NOMBRES),
    ).toBe("creó el producto Pan francés");
    expect(
      accion(cambio({ operacion: "DELETE", datos_antes: { nombre: "Pan francés" } }), NOMBRES),
    ).toBe("eliminó el producto Pan francés");
    expect(
      accion(
        cambio({
          datos_antes: { nombre: "Pan francés", deleted_at: null },
          datos_despues: { nombre: "Pan francés", deleted_at: "2026-10-06T15:00:00Z" },
        }),
        NOMBRES,
      ),
    ).toBe("borró el producto Pan francés");
  });

  it("publicar, despublicar, desactivar y reactivar", () => {
    const con = (antes: object, despues: object) =>
      accion(
        cambio({
          datos_antes: { nombre: "Pan francés", ...antes },
          datos_despues: { nombre: "Pan francés", ...despues },
        }),
        NOMBRES,
      );
    expect(con({ estado: "borrador" }, { estado: "publicado" })).toBe(
      "publicó el producto Pan francés",
    );
    expect(con({ estado: "publicado" }, { estado: "borrador" })).toBe(
      "despublicó el producto Pan francés",
    );
    expect(con({ activo: true }, { activo: false })).toBe("desactivó el producto Pan francés");
    expect(con({ activo: false }, { activo: true })).toBe("reactivó el producto Pan francés");
  });

  it("un movimiento de insumo dice qué fue", () => {
    const mov = (extra: object) =>
      accion(
        cambio({
          operacion: "INSERT",
          tabla: "public.movimientos_insumo",
          datos_despues: { insumo_id: "i1", unidad_id: "kg", cantidad: 50, sentido: 1, ...extra },
        }),
        NOMBRES,
      );
    expect(mov({ tipo: "ingreso" })).toBe("registró un ingreso de 50 kg de Harina");
    expect(mov({ tipo: "consumo", sentido: -1, cantidad: 2.5 })).toBe(
      "registró un consumo de 2.5 kg de Harina",
    );
    expect(mov({ tipo: "baja", sentido: -1 })).toBe("registró una baja de 50 kg de Harina");
    expect(mov({ tipo: "ajuste", sentido: -1, cantidad: 3 })).toBe(
      "ajustó por conteo Harina: −3 kg",
    );
    expect(mov({ tipo: "anulacion" })).toBe("anuló un movimiento de Harina");
  });

  it("las bajas: se piden, se aprueban o se rechazan", () => {
    const baja = { insumo_id: "i1", unidad_id: "kg", cantidad: 5 };
    expect(
      accion(
        cambio({ operacion: "INSERT", tabla: "public.solicitudes_baja", datos_despues: baja }),
        NOMBRES,
      ),
    ).toBe("pidió una baja de 5 kg de Harina");
    expect(
      accion(
        cambio({
          tabla: "public.solicitudes_baja",
          datos_antes: { ...baja, estado: "pendiente" },
          datos_despues: { ...baja, estado: "aprobada" },
        }),
        NOMBRES,
      ),
    ).toBe("aprobó la baja pedida de Harina");
  });

  it("clientes: registrar, anotar y retirar el permiso, añadir y cambiar una foto", () => {
    expect(
      accion(
        cambio({
          operacion: "INSERT",
          tabla: "public.clientes",
          datos_despues: { nombre_completo: "Rosa Quispe" },
        }),
        NOMBRES,
      ),
    ).toBe("registró al cliente Rosa Quispe");
    expect(
      accion(
        cambio({
          operacion: "INSERT",
          tabla: "public.consentimientos",
          datos_despues: { cliente_id: "c1" },
        }),
        NOMBRES,
      ),
    ).toBe("anotó el permiso de Rosa Quispe");
    expect(
      accion(
        cambio({
          tabla: "public.consentimientos",
          datos_antes: { cliente_id: "c1", revocado_en: null },
          datos_despues: { cliente_id: "c1", revocado_en: "2026-10-06T15:00:00Z" },
        }),
        NOMBRES,
      ),
    ).toBe("retiró el permiso de Rosa Quispe");
    expect(
      accion(
        cambio({
          tabla: "public.cliente_fotos",
          datos_antes: { cliente_id: "c1", ruta: "c1/a.webp", updated_at: "a" },
          datos_despues: { cliente_id: "c1", ruta: "c1/a.webp", updated_at: "b" },
        }),
        NOMBRES,
      ),
    ).toBe("cambió una foto de la casa de Rosa Quispe");
  });

  it("una ficha con los datos borrados a pedido dice solo eso (Review Focus)", () => {
    const c = cambio({
      tabla: "public.clientes",
      datos_antes: { borrado: true },
      datos_despues: { borrado: true },
    });
    expect(accion(c, NOMBRES)).toBe(
      "hizo un cambio en un cliente cuyos datos se borraron a pedido",
    );
  });

  it("el cambio de rol de una cuenta se dice con los dos roles", () => {
    const c = cambio({
      tabla: "public.perfiles",
      datos_antes: { nombre_completo: "Debra", rol: "ingeniero" },
      datos_despues: { nombre_completo: "Debra", rol: "administrador" },
    });
    expect(accion(c, NOMBRES)).toBe("cambió el rol de Debra: Ingeniero → Administrador");
  });

  it("guardar sin cambiar nada se dice así, no como un cambio", () => {
    const c = cambio({
      tabla: "public.clientes",
      datos_antes: { nombre_completo: "Rosa Quispe", updated_at: "a" },
      datos_despues: { nombre_completo: "Rosa Quispe", updated_at: "b" },
    });
    expect(accion(c, NOMBRES)).toBe("guardó el cliente Rosa Quispe sin cambiar nada");
  });

  it("una tabla que no está en el catálogo se dice de forma genérica, sin fallar", () => {
    const c = cambio({
      tabla: "public.tabla_del_futuro",
      operacion: "INSERT",
      datos_despues: { campo_nuevo: 1 },
    });
    expect(accion(c, NOMBRES)).toBe("creó un registro de tabla_del_futuro");
    expect(diferencias(c, NOMBRES)).toEqual([
      { campo: "campo_nuevo", etiqueta: "Campo nuevo", antes: "—", despues: "1" },
    ]);
  });
});

describe("idsReferidos", () => {
  it("junta, sin repetir, los ids a los que apuntan las filas", () => {
    const filas = [
      cambio({ datos_antes: { zona_id: "z1" }, datos_despues: { zona_id: "z2" } }),
      cambio({ datos_despues: { insumo_id: "i1", unidad_id: "kg", zona_id: "z1", nombre: "x" } }),
    ];
    expect(idsReferidos(filas).sort()).toEqual(["i1", "kg", "z1", "z2"]);
  });
});
```

- [ ] Ejecutar: `pnpm test -- src/lib/auditoria/redactar.test.ts`
      **Esperado:** FALLA («Cannot find module './redactar'»).

- [ ] En `src/lib/auditoria/campos.ts`, exportar el conjunto de campos que señalan a otra cosa
      (`export const senalaAOtro = (campo: string): boolean => SEÑALA_A.has(campo);`), que el
      redactor necesita para saber qué ids hay que resolver.

- [ ] Crear `src/lib/auditoria/redactar.ts`:

```ts
import { formatearCantidad, nombreDeUnidad } from "@/lib/insumos/unidades";

import { esDeControl, escribirValor, etiquetaDe, recortar, senalaAOtro } from "./campos";
import { type Datos, infoDeTabla, type Nombres } from "./catalogo";

/** Una fila de `public.auditoria`, ya sin nulos donde no puede haberlos. */
export type Cambio = {
  id: number;
  tabla: string;
  registro_id: string | null;
  operacion: "INSERT" | "UPDATE" | "DELETE";
  usuario_id: string | null;
  usuario_nombre: string | null;
  usuario_correo: string | null;
  rol: string | null;
  datos_antes: Datos | null;
  datos_despues: Datos | null;
  ocurrido_en: string;
};

export type Diferencia = { campo: string; etiqueta: string; antes: string; despues: string };

/** Cuánto de un valor cabe en la frase de la lista. El detalle lo enseña entero. */
const LARGO_EN_FRASE = 40;

/**
 * `borrar_datos_cliente` (0043) deja en el registro `{"borrado": true}` en
 * lugar de los datos del cliente. No hay nada que comparar ni que nombrar.
 */
const tachado = (d: Datos | null): boolean =>
  d !== null && d.borrado === true && Object.keys(d).length === 1;

const distinto = (a: unknown, b: unknown): boolean => JSON.stringify(a) !== JSON.stringify(b);

const vacio = (v: unknown): boolean =>
  v === null || v === undefined || (typeof v === "string" && v.trim() === "");

/** Quién lo hizo. Nunca «null»: sin nombre, el correo; sin nadie, el sistema. */
export function quien(c: Cambio): string {
  if (c.usuario_nombre?.trim()) return c.usuario_nombre.trim();
  if (c.usuario_correo?.trim()) return c.usuario_correo.trim();
  return c.usuario_id ? "Alguien cuya cuenta ya no existe" : "El sistema";
}

/** Lo que cambió, campo a campo, ya escrito para una persona. */
export function diferencias(c: Cambio, nombres: Nombres): Diferencia[] {
  if (tachado(c.datos_antes) || tachado(c.datos_despues)) return [];
  const antes = c.datos_antes ?? {};
  const despues = c.datos_despues ?? {};
  const campos = [...new Set([...Object.keys(antes), ...Object.keys(despues)])];
  return campos
    .filter((campo) => !esDeControl(campo))
    .filter((campo) =>
      c.operacion === "UPDATE"
        ? distinto(antes[campo], despues[campo])
        : // En un alta o una eliminación, lo que no tiene valor no es noticia.
          !vacio(c.operacion === "INSERT" ? despues[campo] : antes[campo]),
    )
    .map((campo) => ({
      campo,
      etiqueta: etiquetaDe(campo),
      antes: c.operacion === "INSERT" ? "—" : escribirValor(campo, antes[campo], nombres),
      despues: c.operacion === "DELETE" ? "—" : escribirValor(campo, despues[campo], nombres),
    }));
}

/** «50 kg de Harina», de una fila que lleva `cantidad`, `unidad_id` e `insumo_id`. */
function cantidadDeInsumo(d: Datos, nombres: Nombres): { cuanto: string; insumo: string } {
  const cantidad = Number(d.cantidad);
  const unidad = nombres[String(d.unidad_id)] ?? "";
  const cuanto = Number.isFinite(cantidad)
    ? `${formatearCantidad(cantidad)} ${unidad ? nombreDeUnidad(unidad, cantidad) : ""}`.trim()
    : "una cantidad";
  return { cuanto, insumo: nombres[String(d.insumo_id)] ?? "un insumo que ya no existe" };
}

function movimiento(d: Datos, nombres: Nombres): string {
  const { cuanto, insumo } = cantidadDeInsumo(d, nombres);
  switch (d.tipo) {
    case "ingreso":
      return `registró un ingreso de ${cuanto} de ${insumo}`;
    case "consumo":
      return `registró un consumo de ${cuanto} de ${insumo}`;
    case "baja":
      return `registró una baja de ${cuanto} de ${insumo}`;
    case "ajuste":
      return `ajustó por conteo ${insumo}: ${Number(d.sentido) < 0 ? "−" : "+"}${cuanto}`;
    case "anulacion":
      return `anuló un movimiento de ${insumo}`;
    default:
      return `registró un movimiento de ${insumo}`;
  }
}

/**
 * Qué hizo, sin el sujeto: «cambió el producto Pan francés (2 datos)». Las
 * reglas van de lo más concreto a lo más general, y lo que no encaja en
 * ninguna se dice de forma genérica. Nunca lanza.
 */
export function accion(c: Cambio, nombres: Nombres): string {
  if (tachado(c.datos_antes) || tachado(c.datos_despues)) {
    return "hizo un cambio en un cliente cuyos datos se borraron a pedido";
  }
  const tabla = c.tabla.replace(/^public\./, "");
  const antes = c.datos_antes ?? {};
  const despues = c.datos_despues ?? {};
  const datos = c.datos_despues ?? c.datos_antes ?? {};
  const cosa = infoDeTabla(c.tabla).referencia(datos, nombres);

  if (c.operacion === "INSERT") {
    if (tabla === "movimientos_insumo") return movimiento(datos, nombres);
    if (tabla === "solicitudes_baja") {
      const { cuanto, insumo } = cantidadDeInsumo(datos, nombres);
      return `pidió una baja de ${cuanto} de ${insumo}`;
    }
    if (tabla === "clientes") return `registró ${cosa.replace(/^el /, "al ")}`;
    if (tabla === "consentimientos") return `anotó ${cosa}`;
    if (tabla === "cliente_fotos" || tabla === "producto_imagenes") return `añadió ${cosa}`;
    return `creó ${cosa}`;
  }
  if (c.operacion === "DELETE") return `eliminó ${cosa}`;

  const cambio = (campo: string) => distinto(antes[campo], despues[campo]);

  if (cambio("deleted_at")) return `${vacio(despues.deleted_at) ? "recuperó" : "borró"} ${cosa}`;
  if (tabla === "solicitudes_baja" && cambio("estado")) {
    if (despues.estado === "aprobada") return `aprobó ${cosa}`;
    if (despues.estado === "rechazada") return `rechazó ${cosa}`;
  }
  if (tabla === "consentimientos" && cambio("revocado_en") && !vacio(despues.revocado_en)) {
    return `retiró ${cosa}`;
  }
  if (tabla === "perfiles" && cambio("rol")) {
    const nombre =
      typeof despues.nombre_completo === "string" ? despues.nombre_completo : "una cuenta";
    return `cambió el rol de ${nombre}: ${escribirValor("rol", antes.rol, nombres)} → ${escribirValor("rol", despues.rol, nombres)}`;
  }
  if (cambio("estado")) {
    if (despues.estado === "publicado") return `publicó ${cosa}`;
    if (antes.estado === "publicado") return `despublicó ${cosa}`;
  }
  if (cambio("activo") && typeof despues.activo === "boolean") {
    return `${despues.activo ? "reactivó" : "desactivó"} ${cosa}`;
  }

  const lista = diferencias(c, nombres);
  if (lista.length === 0) {
    // Cambiar una foto sobrescribe el archivo: la fila solo cambia de fecha.
    return tabla === "cliente_fotos" ? `cambió ${cosa}` : `guardó ${cosa} sin cambiar nada`;
  }
  if (lista.length === 1) {
    const d = lista[0]!;
    return `cambió ${cosa}: ${d.etiqueta} ${recortar(d.antes, LARGO_EN_FRASE)} → ${recortar(d.despues, LARGO_EN_FRASE)}`;
  }
  return `cambió ${cosa} (${lista.length} datos)`;
}

export function frase(c: Cambio, nombres: Nombres): string {
  return `${quien(c)} ${accion(c, nombres)}`;
}

/** Los ids a los que apuntan estas filas, para pedir sus nombres de una vez. */
export function idsReferidos(cambios: readonly Cambio[]): string[] {
  const ids = new Set<string>();
  for (const c of cambios) {
    for (const datos of [c.datos_antes, c.datos_despues]) {
      for (const [campo, valor] of Object.entries(datos ?? {})) {
        if (senalaAOtro(campo) && typeof valor === "string" && valor) ids.add(valor);
      }
    }
  }
  return [...ids];
}
```

- [ ] Ejecutar: `pnpm test -- src/lib/auditoria/`
      **Esperado:** PASAN las tres (catálogo 8, campos 9, redactor 17).

### Paso 4 — Los filtros de la dirección, primero la prueba

- [ ] Crear `src/lib/auditoria/filtros.test.ts`:

```ts
import { describe, expect, it } from "vitest";

import { leerFiltros, limitesDelPeriodo } from "./filtros";

// 6 de octubre de 2026, 10:00 a. m. en Iquitos.
const AHORA = new Date("2026-10-06T15:00:00.000Z");
const UUID = "0a1f3a52-6b1e-4f7e-9d3a-0a1b2c3d4e5f";

describe("leerFiltros", () => {
  it("sin nada, los últimos 7 días y 50 filas", () => {
    expect(leerFiltros({}, AHORA)).toEqual({
      persona: null,
      seccion: null,
      hizo: null,
      cuando: "7",
      periodo: { desde: "2026-09-30", hasta: "2026-10-06" },
      registro: null,
      ver: 50,
    });
  });

  it("lee lo que viene bien escrito", () => {
    const f = leerFiltros(
      { persona: UUID, seccion: "clientes", hizo: "borro", cuando: "hoy", ver: "100" },
      AHORA,
    );
    expect(f).toMatchObject({
      persona: UUID,
      seccion: "clientes",
      hizo: "borro",
      cuando: "hoy",
      periodo: { desde: "2026-10-06", hasta: "2026-10-06" },
      ver: 100,
    });
    expect(leerFiltros({ persona: "sistema" }, AHORA).persona).toBe("sistema");
  });

  it("lo que viene mal escrito se ignora, sin error (Review Focus)", () => {
    const f = leerFiltros(
      { persona: "abc", seccion: "otra", hizo: "rompio", cuando: "siempre", ver: "999999" },
      AHORA,
    );
    expect(f).toMatchObject({ persona: null, seccion: null, hizo: null, cuando: "7", ver: 500 });
    expect(leerFiltros({ ver: "-3" }, AHORA).ver).toBe(50);
    expect(leerFiltros({ ver: "hola" }, AHORA).ver).toBe(50);
    expect(leerFiltros({ persona: ["a", "b"] }, AHORA).persona).toBeNull();
  });

  it("un rango con fechas válidas se respeta; con una mala, vuelve a los 7 días", () => {
    expect(
      leerFiltros({ cuando: "rango", desde: "2026-09-01", hasta: "2026-09-15" }, AHORA),
    ).toMatchObject({ cuando: "rango", periodo: { desde: "2026-09-01", hasta: "2026-09-15" } });
    expect(
      leerFiltros({ cuando: "rango", desde: "ayer", hasta: "2026-09-15" }, AHORA),
    ).toMatchObject({
      cuando: "7",
    });
  });

  it("«Ver historial» de un registro no pone límite de fechas, salvo que se pida", () => {
    const f = leerFiltros({ registro: UUID, de: "producto" }, AHORA);
    expect(f.registro).toEqual({ id: UUID, de: "producto" });
    expect(f).toMatchObject({ cuando: "todo", periodo: null });
    expect(leerFiltros({ registro: UUID, de: "factura" }, AHORA).registro).toBeNull();
    expect(leerFiltros({ registro: "abc", de: "producto" }, AHORA).registro).toBeNull();
    expect(leerFiltros({ registro: UUID, de: "cliente", cuando: "30" }, AHORA).cuando).toBe("30");
  });
});

describe("limitesDelPeriodo", () => {
  it("un día de Iquitos va de las 05:00 UTC a las 05:00 UTC del siguiente (Review Focus)", () => {
    const { desde, hasta } = limitesDelPeriodo({ desde: "2026-10-05", hasta: "2026-10-05" });
    expect(desde).toBe("2026-10-05T05:00:00.000Z");
    expect(hasta).toBe("2026-10-06T05:00:00.000Z");
    // Las 11:30 p. m. del 5 en Iquitos son las 04:30 UTC del 6: dentro del día 5.
    const cambio = "2026-10-06T04:30:00.000Z";
    expect(cambio >= desde && cambio < hasta).toBe(true);
  });
});
```

- [ ] Ejecutar: `pnpm test -- src/lib/auditoria/filtros.test.ts`
      **Esperado:** FALLA («Cannot find module './filtros'»).

- [ ] Crear `src/lib/auditoria/filtros.ts`:

```ts
import { hoyEnLima, type Periodo, sumarDias } from "@/lib/insumos/periodo";

import { type Dueno, HIJOS_DE, type Seccion, SECCIONES } from "./catalogo";

export type Hizo = "creo" | "cambio" | "borro";
export type Cuando = "hoy" | "7" | "30" | "rango" | "todo";

/** Lo que pide la dirección de la pestaña Cambios, ya validado. */
export type Filtros = {
  /** El id de una persona, `"sistema"` (cambios sin persona) o todas. */
  persona: string | null;
  seccion: Seccion | null;
  hizo: Hizo | null;
  cuando: Cuando;
  /** En días de Iquitos. `null`: sin límite de fechas. */
  periodo: Periodo | null;
  /** «Ver historial» de un producto, un insumo o un cliente. */
  registro: { id: string; de: Dueno } | null;
  /** Cuántas filas enseñar: «Ver más» lo sube de 50 en 50, hasta 500. */
  ver: number;
};

export const POR_PAGINA = 50;
export const MAXIMO = 500;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const FECHA = /^\d{4}-\d{2}-\d{2}$/;

const texto = (v: unknown): string | null => (typeof v === "string" && v.trim() ? v.trim() : null);
const fecha = (v: unknown): string | null => {
  const t = texto(v);
  return t && FECHA.test(t) && !Number.isNaN(new Date(`${t}T12:00:00Z`).getTime()) ? t : null;
};

/**
 * La dirección la puede escribir cualquiera: lo que no se reconoce se ignora
 * (vuelve a su valor de siempre) y nunca llega a la base un filtro inventado.
 */
export function leerFiltros(params: Record<string, unknown>, ahora: Date): Filtros {
  const persona = texto(params.persona);
  const seccion = texto(params.seccion);
  const hizo = texto(params.hizo);
  const de = texto(params.de);
  const idRegistro = texto(params.registro);
  const registro =
    idRegistro && UUID.test(idRegistro) && de && de in HIJOS_DE
      ? { id: idRegistro, de: de as Dueno }
      : null;

  const hoy = hoyEnLima(ahora);
  const pedido = texto(params.cuando);
  const desde = fecha(params.desde);
  const hasta = fecha(params.hasta);
  let cuando: Cuando = registro ? "todo" : "7";
  if (pedido === "hoy" || pedido === "7" || pedido === "30" || pedido === "todo") cuando = pedido;
  if (pedido === "rango" && desde && hasta) cuando = "rango";

  const periodos: Record<Cuando, Periodo | null> = {
    hoy: { desde: hoy, hasta: hoy },
    "7": { desde: sumarDias(hoy, -6), hasta: hoy },
    "30": { desde: sumarDias(hoy, -29), hasta: hoy },
    rango:
      desde && hasta ? (desde <= hasta ? { desde, hasta } : { desde: hasta, hasta: desde }) : null,
    todo: null,
  };

  const pedidas = Number.parseInt(texto(params.ver) ?? "", 10);
  const ver = Number.isFinite(pedidas)
    ? Math.min(Math.max(pedidas, POR_PAGINA), MAXIMO)
    : POR_PAGINA;

  return {
    persona: persona === "sistema" || (persona && UUID.test(persona)) ? persona : null,
    seccion: SECCIONES.some((s) => s.valor === seccion) ? (seccion as Seccion) : null,
    hizo: hizo === "creo" || hizo === "cambio" || hizo === "borro" ? hizo : null,
    cuando,
    periodo: periodos[cuando],
    registro,
    ver,
  };
}

/** De días de Iquitos (UTC−5, sin horario de verano) a instantes para la base. */
export function limitesDelPeriodo(periodo: Periodo): { desde: string; hasta: string } {
  return {
    desde: `${periodo.desde}T05:00:00.000Z`,
    hasta: `${sumarDias(periodo.hasta, 1)}T05:00:00.000Z`,
  };
}

/** Los filtros, de vuelta a parámetros de la dirección (para «Ver más» y las pestañas). */
export function aParametros(f: Filtros, cambios: Partial<{ ver: number }> = {}): URLSearchParams {
  const p = new URLSearchParams();
  if (f.persona) p.set("persona", f.persona);
  if (f.seccion) p.set("seccion", f.seccion);
  if (f.hizo) p.set("hizo", f.hizo);
  if (f.registro) {
    p.set("registro", f.registro.id);
    p.set("de", f.registro.de);
  }
  if (f.cuando !== (f.registro ? "todo" : "7")) p.set("cuando", f.cuando);
  if (f.cuando === "rango" && f.periodo) {
    p.set("desde", f.periodo.desde);
    p.set("hasta", f.periodo.hasta);
  }
  const ver = cambios.ver ?? f.ver;
  if (ver !== POR_PAGINA) p.set("ver", String(ver));
  return p;
}
```

- [ ] Ejecutar: `pnpm test -- src/lib/auditoria/`
      **Esperado:** PASAN las cuatro (catálogo 8, campos 9, redactor 17, filtros 6).

### Paso 5 — «Historial» en el menú

- [ ] En `src/lib/panel/navegacion.test.ts`, la prueba del administrador pasa a esperar
      `["Inicio", "Contenido", "Insumos", "Clientes", "Usuarios", "Historial", "Configuración"]`, y se
      añade:

```ts
it("el historial es solo de la administración", () => {
  expect(nombres("superadmin")).toContain("Historial");
  expect(nombres("ingeniero")).not.toContain("Historial");
  expect(nombres("repartidor")).not.toContain("Historial");
});
```

- [ ] `pnpm test -- src/lib/panel/navegacion.test.ts` → **Esperado:** FALLAN esas dos.
- [ ] En `src/lib/panel/navegacion.ts`: `NombreIcono` gana `"historial"`, y en `SECCIONES`, entre
      Usuarios y Configuración:

```ts
  // Dentro de «Más» en el celular: la barra inferior ya lleva sus cuatro botones.
  { ruta: "/admin/auditoria", nombre: "Historial", icono: "historial", enBarraInferior: false },
```

- [ ] En `src/components/panel/barra-lateral.tsx`, importar `History` de `lucide-react` y añadir
      `historial: History,` a `ICONOS`.
- [ ] `pnpm test -- src/lib/panel/navegacion.test.ts` → **Esperado:** PASAN.

### Paso 6 — Las lecturas

- [ ] Crear `src/lib/auditoria/datos.ts`:

```ts
import "server-only";

import { crearClienteServidor } from "@/lib/supabase/servidor";

import { type Datos, HIJOS_DE, type Nombres, tablasVisibles } from "./catalogo";
import { type Filtros, limitesDelPeriodo } from "./filtros";
import { type Cambio, idsReferidos } from "./redactar";

const COLUMNAS =
  "id, tabla, registro_id, operacion, usuario_id, usuario_correo, usuario_nombre, rol, datos_antes, datos_despues, ocurrido_en";

type FilaDeLaVista = {
  id: number | null;
  tabla: string | null;
  registro_id: string | null;
  operacion: string | null;
  usuario_id: string | null;
  usuario_correo: string | null;
  usuario_nombre: string | null;
  rol: string | null;
  datos_antes: unknown;
  datos_despues: unknown;
  ocurrido_en: string | null;
};

const objeto = (v: unknown): Datos | null =>
  v !== null && typeof v === "object" && !Array.isArray(v) ? (v as Datos) : null;

/** Las columnas de una vista salen nullables en los tipos: se normalizan aquí (AGENTS.md). */
function aCambio(f: FilaDeLaVista): Cambio | null {
  if (f.id === null || !f.tabla || !f.ocurrido_en) return null;
  const operacion = f.operacion === "INSERT" || f.operacion === "DELETE" ? f.operacion : "UPDATE";
  return {
    id: f.id,
    tabla: f.tabla,
    registro_id: f.registro_id,
    operacion,
    usuario_id: f.usuario_id,
    usuario_nombre: f.usuario_nombre,
    usuario_correo: f.usuario_correo,
    rol: f.rol,
    datos_antes: objeto(f.datos_antes),
    datos_despues: objeto(f.datos_despues),
    ocurrido_en: f.ocurrido_en,
  };
}

/**
 * La lista de la pestaña Cambios. `null` si la base no respondió (la página lo
 * dice en vez de enseñar una lista vacía). Pide una fila de más para saber si
 * hay «Ver más» sin contar toda la tabla.
 */
export async function leerCambios(
  f: Filtros,
): Promise<{ cambios: Cambio[]; hayMas: boolean } | null> {
  const supabase = await crearClienteServidor();
  let consulta = supabase
    .from("auditoria")
    .select(COLUMNAS)
    .order("ocurrido_en", { ascending: false })
    .order("id", { ascending: false })
    .limit(f.ver + 1);

  if (f.registro) {
    // Lo suyo y lo que cuelga de él (sus presentaciones, sus movimientos, sus
    // fotos y permisos): ahí sí entran las tablas internas, como los lotes.
    const { campo } = HIJOS_DE[f.registro.de];
    const id = f.registro.id;
    consulta = consulta.or(
      `registro_id.eq.${id},datos_despues->>${campo}.eq.${id},datos_antes->>${campo}.eq.${id}`,
    );
  } else {
    consulta = consulta.in("tabla", tablasVisibles(f.seccion ?? undefined));
  }
  if (f.persona === "sistema") consulta = consulta.is("usuario_id", null);
  else if (f.persona) consulta = consulta.eq("usuario_id", f.persona);

  // «Borró» en el panel casi nunca es un DELETE: es la marca `deleted_at`.
  if (f.hizo === "creo") consulta = consulta.eq("operacion", "INSERT");
  if (f.hizo === "borro") {
    consulta = consulta.or(
      "operacion.eq.DELETE,and(operacion.eq.UPDATE,datos_despues->>deleted_at.not.is.null,datos_antes->>deleted_at.is.null)",
    );
  }
  if (f.hizo === "cambio") {
    consulta = consulta
      .eq("operacion", "UPDATE")
      .or("datos_despues->>deleted_at.is.null,datos_antes->>deleted_at.not.is.null");
  }
  if (f.periodo) {
    const { desde, hasta } = limitesDelPeriodo(f.periodo);
    consulta = consulta.gte("ocurrido_en", desde).lt("ocurrido_en", hasta);
  }

  const { data, error } = await consulta;
  if (error) {
    console.error("[historial] cambios:", error.message);
    return null;
  }
  const cambios = (data as FilaDeLaVista[]).map(aCambio).filter((c): c is Cambio => c !== null);
  return { cambios: cambios.slice(0, f.ver), hayMas: cambios.length > f.ver };
}

/** Un cambio por su número. También los de tablas internas: es el detalle técnico. */
export async function leerCambio(id: number): Promise<Cambio | null> {
  const supabase = await crearClienteServidor();
  const { data, error } = await supabase
    .from("auditoria")
    .select(COLUMNAS)
    .eq("id", id)
    .maybeSingle();
  if (error) console.error("[historial] cambio:", error.message);
  return data ? aCambio(data as FilaDeLaVista) : null;
}

/**
 * Los nombres de lo que estas filas señalan (un movimiento guarda el id del
 * insumo, no su nombre). Una consulta por tabla, con todos los ids de la
 * página: los uuid no se repiten entre tablas, así que caben en un solo mapa.
 * Lo que ya no existe no sale en el mapa, y el redactor dice «ya no existe».
 */
export async function resolverNombres(cambios: readonly Cambio[]): Promise<Nombres> {
  const ids = idsReferidos(cambios);
  if (ids.length === 0) return {};
  const supabase = await crearClienteServidor();
  const [
    insumos,
    productos,
    variantes,
    clientes,
    zonas,
    categorias,
    proveedores,
    unidades,
    almacenes,
    personas,
  ] = await Promise.all([
    supabase.from("insumos").select("id, nombre").in("id", ids),
    supabase.from("productos").select("id, nombre").in("id", ids),
    supabase.from("producto_variantes").select("id, nombre").in("id", ids),
    supabase.from("clientes").select("id, nombre:nombre_completo").in("id", ids),
    supabase.from("zonas_reparto").select("id, nombre").in("id", ids),
    supabase.from("categorias_producto").select("id, nombre").in("id", ids),
    supabase.from("proveedores").select("id, nombre").in("id", ids),
    supabase.from("unidades_medida").select("id, nombre:codigo").in("id", ids),
    supabase.from("almacenes").select("id, nombre").in("id", ids),
    supabase.from("perfiles").select("id, nombre:nombre_completo").in("id", ids),
  ]);
  const nombres: Record<string, string> = {};
  for (const { data } of [
    insumos,
    productos,
    variantes,
    clientes,
    zonas,
    categorias,
    proveedores,
    unidades,
    almacenes,
    personas,
  ]) {
    for (const fila of data ?? []) if (fila.nombre) nombres[fila.id] = fila.nombre;
  }
  return nombres;
}

/** Las personas del panel, para el filtro. La administración lee todos los perfiles. */
export async function personasDelPanel(): Promise<{ id: string; nombre: string }[]> {
  const supabase = await crearClienteServidor();
  const { data } = await supabase
    .from("perfiles")
    .select("id, nombre_completo")
    .order("nombre_completo");
  return (data ?? []).map((p) => ({ id: p.id, nombre: p.nombre_completo ?? "Sin nombre" }));
}
```

> **Tres cosas que comprobar al escribirlo, y anotar si resultan distintas:**
>
> - Con «Ver historial» puede haber muchos ids en un `.in()`: una página trae como mucho 500 filas,
>   así que caben en la dirección de la consulta. Si PostgREST respondiera `414`, partir `ids` en
>   trozos de 100.
> - Los filtros con `->>` dentro de `.or()` (`datos_despues->>producto_id.eq.<id>`) son sintaxis de
>   PostgREST sobre columnas `jsonb`; la E2E del paso 9 los ejercita con una sesión de verdad. Dos
>   `.or()` seguidos se combinan con «y».
> - `perfiles.nombre_completo` es `not null` (0003): el «Sin nombre» solo cubre el tipo. Los perfiles
>   borrados (`deleted_at`) siguen en la lista a propósito: sus cambios siguen en el historial.

### Paso 7 — Las piezas de la pantalla

- [ ] Crear `src/components/panel/pestanas-historial.tsx`:

```tsx
import Link from "next/link";

const PESTANAS = [
  { valor: "cambios", nombre: "Cambios", ruta: "/admin/auditoria" },
  { valor: "ingresos", nombre: "Ingresos", ruta: "/admin/auditoria/ingresos" },
  { valor: "borrados", nombre: "Datos borrados", ruta: "/admin/auditoria/borrados" },
  { valor: "descargas", nombre: "Descargas", ruta: "/admin/auditoria/descargas" },
] as const;

export type PestanaHistorial = (typeof PESTANAS)[number]["valor"];

/** Las cuatro vistas del historial. Son enlaces: cada una tiene su dirección. */
export function PestanasHistorial({ activa }: { activa: PestanaHistorial }) {
  return (
    <nav aria-label="Vistas del historial" className="mb-4 flex flex-wrap gap-2">
      {PESTANAS.map((p) => (
        <Link
          key={p.valor}
          href={p.ruta}
          className={p.valor === activa ? "boton-cta" : "boton-linea"}
          aria-current={p.valor === activa ? "page" : undefined}
        >
          {p.nombre}
        </Link>
      ))}
    </nav>
  );
}
```

- [ ] Crear `src/components/panel/filtros-historial.tsx`:

```tsx
"use client";

import { usePathname, useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";

type Opcion = { valor: string; nombre: string };

type Props = {
  personas: readonly Opcion[];
  secciones?: readonly Opcion[];
  conHizo?: boolean;
  /** «El sistema» entre las personas: los cambios del cron y de las migraciones. */
  conSistema?: boolean;
  valores: {
    persona: string;
    seccion?: string;
    hizo?: string;
    cuando: string;
    desde: string;
    hasta: string;
  };
  /** Parámetros que no son filtros y se conservan («Ver historial» de un registro). */
  conservar?: Readonly<Record<string, string>>;
};

const CONTROL = "border-input bg-card min-h-11 rounded-xl border px-3";

/**
 * Los filtros del historial se aplican al elegir, sin botón y sin recargar la
 * página (como `BuscadorEnVivo`): la dirección cambia con `router.replace`
 * dentro de una transición y la lista de antes sigue a la vista hasta que
 * llega la nueva. Las fechas del rango solo aparecen al elegir «Entre dos fechas».
 */
export function FiltrosHistorial({
  personas,
  secciones,
  conHizo = false,
  conSistema = false,
  valores,
  conservar = {},
}: Props) {
  const router = useRouter();
  const ruta = usePathname();
  const formulario = useRef<HTMLFormElement>(null);
  const [cuando, setCuando] = useState(valores.cuando);
  const [buscando, empezar] = useTransition();

  function aplicar() {
    const datos = new FormData(formulario.current ?? undefined);
    const parametros = new URLSearchParams();
    for (const [clave, v] of datos) {
      if (typeof v === "string" && v !== "") parametros.set(clave, v);
    }
    // Un rango a medias no se manda: la página caería a «los últimos 7 días»
    // y el desplegable diría otra cosa.
    if (
      parametros.get("cuando") === "rango" &&
      !(parametros.get("desde") && parametros.get("hasta"))
    ) {
      return;
    }
    const consulta = parametros.toString();
    empezar(() => router.replace(consulta ? `${ruta}?${consulta}` : ruta, { scroll: false }));
  }

  const lista = (nombre: string, etiqueta: string, valor: string, opciones: readonly Opcion[]) => (
    <label className="flex flex-col gap-1 text-sm">
      <span>{etiqueta}</span>
      <select name={nombre} defaultValue={valor} onChange={aplicar} className={CONTROL}>
        {opciones.map((o) => (
          <option key={o.valor} value={o.valor}>
            {o.nombre}
          </option>
        ))}
      </select>
    </label>
  );

  return (
    <form
      ref={formulario}
      aria-label="Filtros del historial"
      aria-busy={buscando}
      onSubmit={(e) => {
        e.preventDefault();
        aplicar();
      }}
      className="mb-4 flex flex-wrap items-end gap-2"
    >
      {Object.entries(conservar).map(([clave, v]) => (
        <input key={clave} type="hidden" name={clave} value={v} />
      ))}
      {lista("persona", "Persona", valores.persona, [
        { valor: "", nombre: "Todas" },
        ...personas,
        ...(conSistema ? [{ valor: "sistema", nombre: "El sistema" }] : []),
      ])}
      {secciones
        ? lista("seccion", "Sección", valores.seccion ?? "", [
            { valor: "", nombre: "Todas" },
            ...secciones,
          ])
        : null}
      {conHizo
        ? lista("hizo", "Qué hizo", valores.hizo ?? "", [
            { valor: "", nombre: "Todo" },
            { valor: "creo", nombre: "Creó" },
            { valor: "cambio", nombre: "Cambió" },
            { valor: "borro", nombre: "Borró" },
          ])
        : null}
      <label className="flex flex-col gap-1 text-sm">
        <span>Cuándo</span>
        <select
          name="cuando"
          defaultValue={valores.cuando}
          onChange={(e) => {
            setCuando(e.currentTarget.value);
            aplicar();
          }}
          className={CONTROL}
        >
          <option value="hoy">Hoy</option>
          <option value="7">Últimos 7 días</option>
          <option value="30">Últimos 30 días</option>
          <option value="rango">Entre dos fechas</option>
          <option value="todo">Siempre</option>
        </select>
      </label>
      {cuando === "rango" ? (
        <>
          <label className="flex flex-col gap-1 text-sm">
            <span>Desde</span>
            <input
              type="date"
              name="desde"
              defaultValue={valores.desde}
              onChange={aplicar}
              className={CONTROL}
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span>Hasta</span>
            <input
              type="date"
              name="hasta"
              defaultValue={valores.hasta}
              onChange={aplicar}
              className={CONTROL}
            />
          </label>
        </>
      ) : null}
    </form>
  );
}
```

- [ ] Crear `src/components/panel/lista-de-cambios.tsx`:

```tsx
import Link from "next/link";

import { NOMBRE_DEL_ROL, esRol } from "@/lib/auth/roles";
import type { Nombres } from "@/lib/auditoria/catalogo";
import { accion, type Cambio, quien } from "@/lib/auditoria/redactar";
import { formatearFechaLima } from "@/lib/panel/hora-lima";

/** «Ingeniero · 06/10/2026 10:05». Un cambio sin persona es «Automático». */
function pie(c: Cambio): string {
  const rol =
    c.usuario_id === null ? "Automático" : esRol(c.rol) ? NOMBRE_DEL_ROL[c.rol] : "Sin rol";
  return `${rol} · ${formatearFechaLima(c.ocurrido_en)}`;
}

/**
 * Una tarjeta por cambio, en el celular y en la computadora: es una frase, no
 * una tabla. Cada una lleva al detalle del cambio.
 */
export function ListaDeCambios({
  cambios,
  nombres,
  etiqueta,
}: {
  cambios: readonly Cambio[];
  nombres: Nombres;
  etiqueta: string;
}) {
  return (
    <ul aria-label={etiqueta} className="flex flex-col gap-2">
      {cambios.map((c) => (
        <li key={c.id}>
          <Link
            href={`/admin/auditoria/${c.id}`}
            className="bg-card hover:bg-muted flex min-h-11 flex-col gap-0.5 rounded-xl border p-3 wrap-anywhere"
            data-cambio={c.id}
          >
            <span>
              <strong className="font-semibold">{quien(c)}</strong> {accion(c, nombres)}
            </span>
            <span className="text-muted-foreground text-sm">{pie(c)}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
```

> `esRol` y `NOMBRE_DEL_ROL` están en `src/lib/auth/roles.ts`. Las fechas van como en el resto del
> panel, «06/10/2026 10:05» (`formatearFechaLima`), no en forma relativa («ayer»): la spec ponía
> «ayer, 4:10 p. m.» como ejemplo de lectura, y una fecha relativa en una página que se queda
> abierta deja de ser cierta. Anotado para «Lo que resultó distinto».

### Paso 8 — La pestaña Cambios y el detalle

- [ ] Crear `src/app/(admin)/admin/auditoria/page.tsx`:

```tsx
import Link from "next/link";
import { Suspense } from "react";

import { EncabezadoPanel } from "@/components/panel/encabezado-panel";
import { FiltrosHistorial } from "@/components/panel/filtros-historial";
import { ListaDeCambios } from "@/components/panel/lista-de-cambios";
import { PestanasHistorial } from "@/components/panel/pestanas-historial";
import { exigirAcceso } from "@/lib/auth/sesion";
import { infoDeTabla, SECCIONES } from "@/lib/auditoria/catalogo";
import { leerCambios, personasDelPanel, resolverNombres } from "@/lib/auditoria/datos";
import { aParametros, leerFiltros, MAXIMO, POR_PAGINA } from "@/lib/auditoria/filtros";
import { hoyEnLima } from "@/lib/insumos/periodo";

const RUTA = "/admin/auditoria";

export default function Historial({ searchParams }: PageProps<"/admin/auditoria">) {
  return (
    <>
      <EncabezadoPanel
        titulo="Historial"
        descripcion="Quién cambió qué en el panel, y cuándo. Nadie puede editarlo ni borrarlo."
      />
      <PestanasHistorial activa="cambios" />
      <Suspense fallback={<p className="text-muted-foreground text-sm">Cargando…</p>}>
        <Cambios searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function Cambios({ searchParams }: Pick<PageProps<"/admin/auditoria">, "searchParams">) {
  const [params] = await Promise.all([searchParams, exigirAcceso(RUTA)]);
  // `new Date()` dentro de un componente dinámico (ya leyó `searchParams` y la sesión).
  const ahora = new Date();
  const filtros = leerFiltros(params, ahora);
  const [resultado, personas] = await Promise.all([leerCambios(filtros), personasDelPanel()]);
  const nombres = resultado ? await resolverNombres(resultado.cambios) : {};
  const hoy = hoyEnLima(ahora);

  // «Ver historial» de un registro: se dice de quién es, con su nombre.
  const propio = filtros.registro
    ? resultado?.cambios.find((c) => c.registro_id === filtros.registro?.id)
    : undefined;
  const deQuien = propio
    ? infoDeTabla(propio.tabla).referencia(
        propio.datos_despues ?? propio.datos_antes ?? {},
        nombres,
      )
    : null;

  return (
    <>
      {filtros.registro ? (
        <p className="bg-muted mb-4 rounded-xl p-3 text-sm" data-de-un-registro>
          Historial de {deQuien ?? "un registro"}, con todo lo que cuelga de él.{" "}
          <Link href={RUTA} className="underline">
            Ver todo el historial
          </Link>
        </p>
      ) : null}

      <FiltrosHistorial
        personas={personas.map((p) => ({ valor: p.id, nombre: p.nombre }))}
        secciones={filtros.registro ? undefined : SECCIONES}
        conHizo
        conSistema
        valores={{
          persona: filtros.persona ?? "",
          seccion: filtros.seccion ?? "",
          hizo: filtros.hizo ?? "",
          cuando: filtros.cuando,
          desde: filtros.periodo?.desde ?? hoy,
          hasta: filtros.periodo?.hasta ?? hoy,
        }}
        conservar={
          filtros.registro ? { registro: filtros.registro.id, de: filtros.registro.de } : {}
        }
      />

      {resultado === null ? (
        <p role="alert">No se pudo cargar el historial. Recarga la página.</p>
      ) : resultado.cambios.length === 0 ? (
        <p className="bg-card rounded-xl border p-6 text-center">
          No hay cambios con esos filtros. Prueba con un periodo más largo.
        </p>
      ) : (
        <>
          <ListaDeCambios
            cambios={resultado.cambios}
            nombres={nombres}
            etiqueta="Cambios en el panel"
          />
          {resultado.hayMas && filtros.ver < MAXIMO ? (
            <p className="mt-4">
              <Link
                href={`${RUTA}?${aParametros(filtros, { ver: filtros.ver + POR_PAGINA })}`}
                className="boton-linea"
                scroll={false}
              >
                Ver más
              </Link>
            </p>
          ) : null}
          {resultado.hayMas && filtros.ver >= MAXIMO ? (
            <p className="text-muted-foreground mt-4 text-sm" data-tope>
              Se muestran los {MAXIMO} más recientes. Acota el periodo o elige una persona o una
              sección para ver los demás.
            </p>
          ) : null}
        </>
      )}
    </>
  );
}
```

- [ ] Crear `src/app/(admin)/admin/auditoria/[id]/page.tsx`:

```tsx
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { EncabezadoPanel } from "@/components/panel/encabezado-panel";
import { exigirAcceso } from "@/lib/auth/sesion";
import { NOMBRE_DEL_ROL, esRol } from "@/lib/auth/roles";
import { infoDeTabla } from "@/lib/auditoria/catalogo";
import { leerCambio, resolverNombres } from "@/lib/auditoria/datos";
import { accion, diferencias, quien } from "@/lib/auditoria/redactar";
import { formatearFechaLima } from "@/lib/panel/hora-lima";

type Props = PageProps<"/admin/auditoria/[id]">;

const OPERACION = {
  INSERT: "Alta (INSERT)",
  UPDATE: "Cambio (UPDATE)",
  DELETE: "Eliminación (DELETE)",
};

export default function UnCambio({ params }: Props) {
  return (
    <Suspense fallback={<p className="text-muted-foreground text-sm">Cargando…</p>}>
      <Detalle params={params} />
    </Suspense>
  );
}

async function Detalle({ params }: Pick<Props, "params">) {
  const [{ id }] = await Promise.all([params, exigirAcceso("/admin/auditoria")]);
  // El número llega de la dirección: lo que no es un entero positivo no existe.
  if (!/^\d{1,15}$/.test(id)) notFound();
  const cambio = await leerCambio(Number(id));
  if (!cambio) notFound();

  const nombres = await resolverNombres([cambio]);
  const info = infoDeTabla(cambio.tabla);
  const lista = diferencias(cambio, nombres);
  // «Ir a…» solo si el registro sigue ahí: una eliminación no tiene a dónde ir.
  const ruta =
    cambio.operacion === "DELETE" ? null : (info.ruta?.(cambio.datos_despues ?? {}) ?? null);
  const rol =
    cambio.usuario_id === null
      ? "Automático"
      : esRol(cambio.rol)
        ? NOMBRE_DEL_ROL[cambio.rol]
        : "Sin rol";

  return (
    <>
      <EncabezadoPanel
        titulo="Un cambio"
        volver={{ ruta: "/admin/auditoria", nombre: "Historial" }}
        accion={
          ruta ? (
            <Link href={ruta} className="boton-linea">
              Ir a donde se hizo
            </Link>
          ) : null
        }
      />

      <section aria-labelledby="que-paso" className="tarjeta mb-6 p-4">
        <h2 id="que-paso" className="sr-only">
          Qué pasó
        </h2>
        <p className="text-lg wrap-anywhere" data-frase>
          <strong className="font-semibold">{quien(cambio)}</strong> {accion(cambio, nombres)}
        </p>
        <p className="text-muted-foreground mt-1 text-sm">
          {rol} · {formatearFechaLima(cambio.ocurrido_en)}
          {cambio.usuario_correo ? ` · ${cambio.usuario_correo}` : ""}
        </p>
      </section>

      <section aria-labelledby="que-cambio" className="mb-6">
        <h2 id="que-cambio" className="mb-2 font-semibold">
          {cambio.operacion === "UPDATE"
            ? "Qué cambió"
            : cambio.operacion === "INSERT"
              ? "Con qué datos"
              : "Qué había"}
        </h2>
        {lista.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            No hay datos que enseñar: no cambió ningún dato, o se borraron a pedido del cliente.
          </p>
        ) : (
          <dl className="bg-card divide-y rounded-xl border" data-diferencias>
            {lista.map((d) => (
              <div key={d.campo} className="grid gap-1 p-3 sm:grid-cols-[12rem_1fr]">
                <dt className="text-muted-foreground text-sm">{d.etiqueta}</dt>
                <dd className="wrap-anywhere">
                  {cambio.operacion === "UPDATE" ? (
                    <>
                      <span className="text-muted-foreground line-through">{d.antes}</span>{" "}
                      <span aria-hidden>→</span>
                      <span className="sr-only"> pasó a </span> <span>{d.despues}</span>
                    </>
                  ) : cambio.operacion === "INSERT" ? (
                    d.despues
                  ) : (
                    d.antes
                  )}
                </dd>
              </div>
            ))}
          </dl>
        )}
      </section>

      <details className="bg-card rounded-xl border p-3" data-detalle-tecnico>
        <summary className="min-h-11 cursor-pointer content-center font-semibold">
          Detalle técnico
        </summary>
        <dl className="mt-2 grid gap-x-4 gap-y-1 text-sm sm:grid-cols-[10rem_1fr]">
          <dt className="text-muted-foreground">Número</dt>
          <dd>{cambio.id}</dd>
          <dt className="text-muted-foreground">Tabla</dt>
          <dd>
            {cambio.tabla}
            {info.interna ? " (interna)" : ""}
          </dd>
          <dt className="text-muted-foreground">Operación</dt>
          <dd>{OPERACION[cambio.operacion]}</dd>
          <dt className="text-muted-foreground">Registro</dt>
          <dd className="wrap-anywhere">{cambio.registro_id ?? "—"}</dd>
        </dl>
        <h3 className="mt-3 text-sm font-semibold">Antes</h3>
        <pre className="bg-muted overflow-x-auto rounded-lg p-2 text-xs" tabIndex={0}>
          {cambio.datos_antes ? JSON.stringify(cambio.datos_antes, null, 2) : "—"}
        </pre>
        <h3 className="mt-3 text-sm font-semibold">Después</h3>
        <pre className="bg-muted overflow-x-auto rounded-lg p-2 text-xs" tabIndex={0}>
          {cambio.datos_despues ? JSON.stringify(cambio.datos_despues, null, 2) : "—"}
        </pre>
      </details>
    </>
  );
}
```

> El `<pre>` con desplazamiento lateral lleva `tabIndex={0}` para que axe no marque una región que
> se desplaza y no se puede enfocar con el teclado (`scrollable-region-focusable`). El `<div>` dentro
> del `<dl>` contiene **directamente** el `dt` y el `dd` (trampa de AGENTS.md).

### Paso 9 — Pruebas de navegador

- [ ] Crear `e2e/panel-historial.spec.ts`:

```ts
import { createClient } from "@supabase/supabase-js";
import { expect, test, type Page } from "@playwright/test";

import { entrarComo } from "./ayudas/sesion";
import { supabaseLocal } from "./ayudas/supabase-local";
import { borrarUsuario, type UsuarioDePrueba } from "./ayudas/usuarios";

// Todas cambian el precio de la misma presentación de la semilla: de una en una.
test.describe.configure({ mode: "serial" });

test.beforeEach(({}, info) => {
  test.skip(info.project.name !== "movil", "cambia un precio compartido; un proyecto basta");
});

/** La misma persona que entró al panel, por la API: sus cambios quedan a su nombre. */
async function apiDe(usuario: UsuarioDePrueba) {
  const { apiUrl, anonKey } = supabaseLocal();
  const cliente = createClient(apiUrl, anonKey, { auth: { persistSession: false } });
  const { error } = await cliente.auth.signInWithPassword({
    email: usuario.correo,
    password: usuario.clave,
  });
  if (error) throw new Error(`No se pudo entrar por la API: ${error.message}`);
  return cliente;
}

/** Cambia el precio de una presentación y devuelve cómo dejarla como estaba. */
async function cambiarUnPrecio(usuario: UsuarioDePrueba) {
  const api = await apiDe(usuario);
  const { data: v } = await api
    .from("producto_variantes")
    .select("id, nombre, precio, producto_id, productos(nombre)")
    .is("deleted_at", null)
    .order("id")
    .limit(1)
    .single();
  if (!v) throw new Error("No hay presentaciones en la semilla");
  const antes = Number(v.precio);
  const despues = Number((antes + 0.05).toFixed(2));
  await api.from("producto_variantes").update({ precio: despues }).eq("id", v.id);
  return {
    productoId: v.producto_id as string,
    antes,
    despues,
    restaurar: async () => {
      await api.from("producto_variantes").update({ precio: antes }).eq("id", v.id);
    },
  };
}

const soles = (n: number) => `S/ ${n.toFixed(2)}`;

async function abrirHistorial(page: Page, consulta = "") {
  await page.goto(`/admin/auditoria${consulta}`);
  await expect(page.getByRole("heading", { name: "Historial", level: 1 })).toBeVisible();
}

test("la administración encuentra un cambio de precio, lo abre y ve el antes y el después", async ({
  page,
}) => {
  const usuario = await entrarComo(page, "administrador");
  const precio = await cambiarUnPrecio(usuario);
  try {
    // Varias pruebas a la vez crean un «Prueba administrador»: se filtra por
    // esta persona, y de paso se prueba que el filtro de la dirección funciona.
    await abrirHistorial(page, `?seccion=productos&cuando=hoy&persona=${usuario.id}`);
    const fila = page.getByRole("link", {
      name: `Prueba administrador cambió la presentación`,
    });
    await expect(fila).toHaveCount(1);
    await expect(fila).toContainText(`Precio ${soles(precio.antes)} → ${soles(precio.despues)}`);
    await fila.click();
    await page.waitForURL(/\/admin\/auditoria\/\d+$/);

    await expect(page.locator("[data-frase]")).toContainText("cambió la presentación");
    const diferencias = page.locator("[data-diferencias]");
    await expect(diferencias).toContainText("Precio");
    await expect(diferencias).toContainText(soles(precio.antes));
    await expect(diferencias).toContainText(soles(precio.despues));

    const tecnico = page.locator("[data-detalle-tecnico]");
    await expect(tecnico.getByText("public.producto_variantes")).toBeHidden();
    await tecnico.getByText("Detalle técnico").click();
    await expect(tecnico.getByText("public.producto_variantes")).toBeVisible();
    await expect(page.getByRole("link", { name: "Ir a donde se hizo" })).toHaveAttribute(
      "href",
      `/admin/contenido/productos/${precio.productoId}`,
    );
  } finally {
    await precio.restaurar();
    await borrarUsuario(usuario.id);
  }
});

test("los filtros se aplican al elegir, sin recargar la página", async ({ page }) => {
  const usuario = await entrarComo(page, "administrador");
  const precio = await cambiarUnPrecio(usuario);
  try {
    await abrirHistorial(page);
    await page.evaluate(() => {
      (window as unknown as { sinRecargar: boolean }).sinRecargar = true;
    });
    await page.getByLabel("Persona").selectOption(usuario.id);
    await expect(page).toHaveURL(new RegExp(`persona=${usuario.id}`));
    await page.getByLabel("Qué hizo").selectOption("cambio");
    await expect(page).toHaveURL(/hizo=cambio/);
    await expect(page.getByRole("link", { name: /cambió la presentación/ }).first()).toBeVisible();
    // Con «Creó» ese cambio ya no está.
    await page.getByLabel("Qué hizo").selectOption("creo");
    await expect(page).toHaveURL(/hizo=creo/);
    await expect(page.getByRole("link", { name: /cambió la presentación/ })).toHaveCount(0);
    expect(
      await page.evaluate(() => (window as unknown as { sinRecargar?: boolean }).sinRecargar),
    ).toBe(true);
  } finally {
    await precio.restaurar();
    await borrarUsuario(usuario.id);
  }
});

test("una dirección con filtros inventados no rompe la página (Review Focus)", async ({ page }) => {
  const usuario = await entrarComo(page, "administrador");
  try {
    await abrirHistorial(
      page,
      "?persona=abc&seccion=otra&hizo=rompio&cuando=siempre&desde=ayer&ver=999999",
    );
    await expect(page.getByLabel("Cuándo")).toHaveValue("7");
    await expect(page.getByRole("alert")).toHaveCount(0);
    await page.goto("/admin/auditoria/no-es-un-numero");
    await expect(page.getByText("No encontramos esta página")).toBeVisible();
  } finally {
    await borrarUsuario(usuario.id);
  }
});

test("el ingeniero no ve «Historial» ni llega escribiendo la dirección", async ({ page }) => {
  const usuario = await entrarComo(page, "ingeniero");
  try {
    await expect(page.locator('[data-seccion="Historial"]')).toHaveCount(0);
    for (const ruta of ["/admin/auditoria", "/admin/auditoria/1"]) {
      await page.goto(ruta);
      await page.waitForURL("/admin?motivo=sin-acceso");
    }
  } finally {
    await borrarUsuario(usuario.id);
  }
});
```

> El panel no tiene 404 propio: `notFound()` cae en `src/app/not-found.tsx`, que pinta
> `PaginaNoEncontrada` («No encontramos esta página»). Y `crearUsuario` (`e2e/ayudas/usuarios.ts`)
> llama a todos sus usuarios «Prueba <rol>»: el nombre no distingue a una persona de otra, su `id` sí.

- [ ] En `e2e/panel-accesibilidad.spec.ts`, añadir `"/admin/auditoria"` a `RUTAS_DEL_PANEL`.
- [ ] `pnpm build` **en primer plano**, levantar el servidor y:
      `pnpm exec playwright test e2e/panel-historial.spec.ts --project=movil --workers=1`
      **Esperado:** 4 en verde.
- [ ] `pnpm exec playwright test e2e/panel-accesibilidad.spec.ts -g "auditoria" --workers=1` y
      `pnpm exec playwright test e2e/panel-cascara.spec.ts --workers=1` (el menú ganó una entrada).
      **Esperado:** verde.

### Paso 10 — Commit (sin PR: sigue la T3 en la misma rama)

- [ ] `pnpm typecheck && pnpm lint && pnpm test`
- [ ] Commit:

```bash
git add src/lib/auditoria src/lib/panel/navegacion.ts src/lib/panel/navegacion.test.ts \
        src/components/panel "src/app/(admin)/admin/auditoria" \
        e2e/panel-historial.spec.ts e2e/panel-accesibilidad.spec.ts
git commit -m "feat(historial): frases del historial y pestaña de cambios"
```

- [ ] **No se abre PR** (la T2 no trae migración): se sigue con la T3 en la misma rama.

---

## Tarea 3 — Ingresos, Datos borrados, Descargas, el inicio y «Ver historial»

**Rama:** la misma, `feat/f7-t2-t3-historial` · **Migración:** no · **PR:** uno con la T2 y la T3.

**Qué deja hecho:** las otras tres pestañas del historial; en el inicio del panel, «Actividad
reciente» con los últimos 5 cambios; y «Ver historial» en la pantalla de un producto, en la ficha de
un insumo y en la ficha de un cliente. Todo solo para la administración.

**Files:**

- Modify: `src/lib/auditoria/datos.ts`
- Create: `src/app/(admin)/admin/auditoria/ingresos/page.tsx`,
  `src/app/(admin)/admin/auditoria/borrados/page.tsx`,
  `src/app/(admin)/admin/auditoria/descargas/page.tsx`,
  `src/components/panel/enlace-historial.tsx`
- Modify: `src/app/(admin)/admin/page.tsx`,
  `src/app/(admin)/admin/contenido/productos/[id]/page.tsx`,
  `src/app/(admin)/admin/insumos/[id]/page.tsx`, `src/app/(admin)/admin/clientes/[id]/page.tsx`
- Test: `e2e/panel-historial.spec.ts`, `e2e/panel-accesibilidad.spec.ts`

**Interfaces:**

- Consumes (T1): `ingresos_al_sistema(p_desde, p_hasta, p_usuario)`, vistas
  `constancias_de_borrado` y `descargas_de_clientes`.
- Consumes (T2): `Filtros`, `leerFiltros`, `limitesDelPeriodo`, `leerCambios`, `resolverNombres`,
  `personasDelPanel`, `<PestanasHistorial>`, `<FiltrosHistorial>`, `<ListaDeCambios>`, `Dueno`.
- Produces: `leerIngresos(f: Filtros): Promise<Ingreso[] | null>`, `leerConstancias():
Promise<Constancia[] | null>`, `leerDescargas(): Promise<Descarga[] | null>`,
  `ultimosCambios(cuantos: number): Promise<Cambio[]>`, `<EnlaceHistorial de id />`.

### Paso 1 — Las lecturas que faltan

- [ ] Añadir al final de `src/lib/auditoria/datos.ts`:

```ts
export type Ingreso = {
  ocurrido_en: string;
  accion: "ingreso" | "salida";
  usuario_id: string | null;
  quien: string;
};

/** Sin periodo («Siempre»), la función igual pide dos instantes. */
const SIEMPRE = { desde: "2000-01-01T00:00:00.000Z", hasta: "2100-01-01T00:00:00.000Z" };

/** Quién entró y quién salió. La función (0045) devuelve como mucho 500, lo más reciente primero. */
export async function leerIngresos(f: Filtros): Promise<Ingreso[] | null> {
  const supabase = await crearClienteServidor();
  const { desde, hasta } = f.periodo ? limitesDelPeriodo(f.periodo) : SIEMPRE;
  const { data, error } = await supabase.rpc("ingresos_al_sistema", {
    p_desde: desde,
    p_hasta: hasta,
    // «El sistema» no entra ni sale: ese filtro aquí no existe.
    ...(f.persona && f.persona !== "sistema" ? { p_usuario: f.persona } : {}),
  });
  if (error) {
    console.error("[historial] ingresos:", error.message);
    return null;
  }
  return (data ?? []).map((i) => ({
    ocurrido_en: i.ocurrido_en,
    accion: i.accion === "salida" ? "salida" : "ingreso",
    usuario_id: i.usuario_id,
    quien: i.nombre?.trim() || i.correo?.trim() || "Alguien que ya no tiene cuenta",
  }));
}

export type Constancia = {
  id: string;
  cliente_id: string;
  borrado_en: string;
  motivo: string;
  quien: string;
};

/** Las constancias de borrado de datos de clientes. Son pocas: van todas, hasta 200. */
export async function leerConstancias(): Promise<Constancia[] | null> {
  const supabase = await crearClienteServidor();
  const { data, error } = await supabase
    .from("constancias_de_borrado")
    .select("id, cliente_id, borrado_en, motivo, borrado_por_nombre")
    .order("borrado_en", { ascending: false })
    .limit(200);
  if (error) {
    console.error("[historial] constancias:", error.message);
    return null;
  }
  return (data ?? []).flatMap((c) =>
    c.id && c.cliente_id && c.borrado_en
      ? [
          {
            id: c.id,
            cliente_id: c.cliente_id,
            borrado_en: c.borrado_en,
            motivo: c.motivo ?? "",
            quien: c.borrado_por_nombre?.trim() || "Alguien que ya no tiene cuenta",
          },
        ]
      : [],
  );
}

export type Descarga = {
  id: string;
  exportado_en: string;
  quien: string;
  formato: string;
  cantidad: number;
  zona: string | null;
  estado: string | null;
};

/** Las descargas de la lista de clientes. Hasta 200, lo más reciente primero. */
export async function leerDescargas(): Promise<Descarga[] | null> {
  const supabase = await crearClienteServidor();
  const { data, error } = await supabase
    .from("descargas_de_clientes")
    .select("id, exportado_en, exportado_por_nombre, formato, cantidad, zona, estado")
    .order("exportado_en", { ascending: false })
    .limit(200);
  if (error) {
    console.error("[historial] descargas:", error.message);
    return null;
  }
  return (data ?? []).flatMap((d) =>
    d.id && d.exportado_en
      ? [
          {
            id: d.id,
            exportado_en: d.exportado_en,
            quien: d.exportado_por_nombre?.trim() || "Alguien que ya no tiene cuenta",
            formato: d.formato ?? "",
            cantidad: d.cantidad ?? 0,
            zona: d.zona,
            estado: d.estado,
          },
        ]
      : [],
  );
}

/** Los últimos cambios, sin tablas internas, para el inicio del panel. */
export async function ultimosCambios(cuantos: number): Promise<Cambio[]> {
  const resultado = await leerCambios({
    persona: null,
    seccion: null,
    hizo: null,
    cuando: "todo",
    periodo: null,
    registro: null,
    ver: cuantos,
  });
  return resultado?.cambios ?? [];
}
```

- [ ] `pnpm typecheck` → **Esperado:** sin errores. Si el tipo generado de la función marca
      `ocurrido_en` o `accion` de otra forma (los tipos de 0045 los regeneró la T1), se ajusta **la
      normalización**, no el tipo generado.

### Paso 2 — Pruebas de navegador, primero (fallan)

- [ ] Añadir a `e2e/panel-historial.spec.ts` (los `import` que falten van arriba:
      `crearClienteDePrueba`, `borrarClienteDePrueba` de `./ayudas/clientes`; `borrarDeLaBase` de
      `./ayudas/base`):

```ts
test("«Ver historial» desde un producto trae también sus presentaciones", async ({ page }) => {
  const usuario = await entrarComo(page, "administrador");
  const precio = await cambiarUnPrecio(usuario);
  try {
    await page.goto(`/admin/contenido/productos/${precio.productoId}`);
    await page.getByRole("link", { name: "Ver historial" }).click();
    await page.waitForURL(new RegExp(`registro=${precio.productoId}.*de=producto`));
    await expect(page.locator("[data-de-un-registro]")).toBeVisible();
    // El cambio fue en `producto_variantes`, no en `productos`: cuelga de él.
    await expect(page.getByRole("link", { name: /cambió la presentación/ }).first()).toBeVisible();
    // Sin filtro de sección: ya es de un solo registro.
    await expect(page.getByLabel("Sección")).toHaveCount(0);
  } finally {
    await precio.restaurar();
    await borrarUsuario(usuario.id);
  }
});

test("Ingresos muestra el ingreso que la prueba acaba de hacer", async ({ page }) => {
  const usuario = await entrarComo(page, "administrador");
  try {
    await page.goto(`/admin/auditoria/ingresos?persona=${usuario.id}&cuando=hoy`);
    const lista = page.getByRole("list", { name: "Ingresos y salidas" });
    await expect(lista.getByRole("listitem")).toHaveCount(1);
    await expect(lista).toContainText("Prueba administrador entró");
  } finally {
    await borrarUsuario(usuario.id);
  }
});

test("Datos borrados y Descargas muestran lo que dejan un borrado y una descarga", async ({
  page,
}) => {
  const usuario = await entrarComo(page, "administrador");
  const cliente = await crearClienteDePrueba({ nombre: `Borrable ${Date.now()}` });
  const motivo = `Lo pidió por teléfono ${Date.now()}`;
  try {
    const api = await apiDe(usuario);
    const { error } = await api.rpc("borrar_datos_cliente", { p_id: cliente, p_motivo: motivo });
    expect(error).toBeNull();
    // La descarga, con la sesión del navegador: queda anotada antes de salir el archivo.
    const descarga = await page.request.get("/admin/clientes/excel");
    expect(descarga.status()).toBe(200);

    await page.goto("/admin/auditoria/borrados");
    const constancia = page.getByRole("listitem").filter({ hasText: motivo });
    await expect(constancia).toContainText("Prueba administrador borró los datos de un cliente");
    await expect(constancia.getByRole("link", { name: "Ver la ficha" })).toHaveAttribute(
      "href",
      `/admin/clientes/${cliente}`,
    );

    // Otras pruebas descargan a la vez y todas son de «Prueba administrador»:
    // la fila se busca por su número.
    const { data: anotada } = await api
      .from("exportaciones_clientes")
      .select("id")
      .eq("exportado_por", usuario.id)
      .single();
    await page.goto("/admin/auditoria/descargas");
    const fila = page.locator(`[data-descarga="${anotada?.id}"]`);
    await expect(fila).toContainText("Prueba administrador descargó");
    await expect(fila).toContainText("Excel");
    await expect(fila).toContainText("activos");

    // Review Focus: el registro ya no tiene datos. El historial del cliente lo
    // dice y no enseña ninguno de sus datos.
    await page.goto(`/admin/clientes/${cliente}`);
    await page.getByRole("link", { name: "Ver historial" }).click();
    await expect(
      page.getByRole("link", { name: /cuyos datos se borraron a pedido/ }).first(),
    ).toBeVisible();
    await expect(page.getByText("Jirón Próspero 100")).toHaveCount(0);
  } finally {
    // Primero lo que apunta al usuario, al final el usuario (AGENTS.md, trampas de F6).
    await borrarDeLaBase("exportaciones_clientes", "exportado_por", usuario.id);
    await borrarClienteDePrueba(cliente);
    await borrarUsuario(usuario.id);
  }
});

test("el inicio enseña la actividad reciente solo a la administración", async ({ page }) => {
  const usuario = await entrarComo(page, "administrador");
  const precio = await cambiarUnPrecio(usuario);
  try {
    await page.goto("/admin");
    const bloque = page.locator("[data-actividad-reciente]");
    await expect(bloque.getByRole("heading", { name: "Actividad reciente" })).toBeVisible();
    const filas = bloque.getByRole("listitem");
    expect(await filas.count()).toBeGreaterThan(0);
    expect(await filas.count()).toBeLessThanOrEqual(5);
    await expect(bloque.getByRole("link", { name: "Ver todo el historial" })).toHaveAttribute(
      "href",
      "/admin/auditoria",
    );
  } finally {
    await precio.restaurar();
    await borrarUsuario(usuario.id);
  }
});
```

- [ ] En la prueba del ingeniero (T2), dentro del `try` y antes del `for`, añadir:

```ts
await expect(page.locator("[data-actividad-reciente]")).toHaveCount(0);
for (const ruta of [
  "/admin/auditoria/ingresos",
  "/admin/auditoria/borrados",
  "/admin/auditoria/descargas",
]) {
  await page.goto(ruta);
  await page.waitForURL("/admin?motivo=sin-acceso");
}
```

> La frase de un cambio tachado es la del redactor de la T2: «hizo un cambio en un cliente cuyos
> datos se borraron a pedido». Y quien entra con `entrarComo` se llama «Prueba administrador», como
> todos los administradores de prueba: lo que distingue a esta persona es su `id` (el filtro de la
> dirección) o el número de la fila.

- [ ] No se ejecutan todavía (un solo build por tanda): se ven fallar en el paso 7 solo si algo
      falta. La garantía de que no pasan «solas» es que las rutas y el bloque aún no existen.

### Paso 3 — Ingresos

- [ ] Crear `src/app/(admin)/admin/auditoria/ingresos/page.tsx`:

```tsx
import { Suspense } from "react";

import { EncabezadoPanel } from "@/components/panel/encabezado-panel";
import { FiltrosHistorial } from "@/components/panel/filtros-historial";
import { PestanasHistorial } from "@/components/panel/pestanas-historial";
import { exigirAcceso } from "@/lib/auth/sesion";
import { leerIngresos, personasDelPanel } from "@/lib/auditoria/datos";
import { leerFiltros } from "@/lib/auditoria/filtros";
import { hoyEnLima } from "@/lib/insumos/periodo";
import { formatearFechaLima } from "@/lib/panel/hora-lima";

type Props = PageProps<"/admin/auditoria/ingresos">;

export default function Ingresos({ searchParams }: Props) {
  return (
    <>
      <EncabezadoPanel
        titulo="Historial"
        descripcion="Quién entró al panel y quién salió. No se anotan los intentos con la contraseña equivocada."
      />
      <PestanasHistorial activa="ingresos" />
      <Suspense fallback={<p className="text-muted-foreground text-sm">Cargando…</p>}>
        <Lista searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function Lista({ searchParams }: Pick<Props, "searchParams">) {
  const [params] = await Promise.all([searchParams, exigirAcceso("/admin/auditoria")]);
  const ahora = new Date();
  const filtros = leerFiltros(params, ahora);
  const [ingresos, personas] = await Promise.all([leerIngresos(filtros), personasDelPanel()]);
  const hoy = hoyEnLima(ahora);

  return (
    <>
      <FiltrosHistorial
        personas={personas.map((p) => ({ valor: p.id, nombre: p.nombre }))}
        valores={{
          persona: filtros.persona === "sistema" ? "" : (filtros.persona ?? ""),
          cuando: filtros.cuando,
          desde: filtros.periodo?.desde ?? hoy,
          hasta: filtros.periodo?.hasta ?? hoy,
        }}
      />
      {ingresos === null ? (
        <p role="alert">No se pudieron cargar los ingresos. Recarga la página.</p>
      ) : ingresos.length === 0 ? (
        <p className="bg-card rounded-xl border p-6 text-center">
          Nadie entró ni salió en ese periodo. Prueba con uno más largo.
        </p>
      ) : (
        <>
          <ul aria-label="Ingresos y salidas" className="flex flex-col gap-2">
            {ingresos.map((i, n) => (
              <li
                key={`${i.ocurrido_en}-${i.usuario_id}-${n}`}
                className="bg-card flex flex-col gap-0.5 rounded-xl border p-3 wrap-anywhere"
              >
                <span>
                  <strong className="font-semibold">{i.quien}</strong>{" "}
                  {i.accion === "ingreso" ? "entró" : "salió"}
                </span>
                <span className="text-muted-foreground text-sm">
                  {formatearFechaLima(i.ocurrido_en)}
                </span>
              </li>
            ))}
          </ul>
          {ingresos.length >= 500 ? (
            <p className="text-muted-foreground mt-4 text-sm">
              Se muestran los 500 más recientes. Acota el periodo o elige una persona para ver los
              demás.
            </p>
          ) : null}
        </>
      )}
    </>
  );
}
```

> «Salió» cubre la salida normal y la de las dos horas sin uso. Cuando la administración le cierra la
> sesión a alguien (al desactivarlo o cambiarle el rol) no hay «salió»: sale en Cambios (spec §1).

### Paso 4 — Datos borrados y Descargas

- [ ] Crear `src/app/(admin)/admin/auditoria/borrados/page.tsx`:

```tsx
import Link from "next/link";
import { Suspense } from "react";

import { EncabezadoPanel } from "@/components/panel/encabezado-panel";
import { PestanasHistorial } from "@/components/panel/pestanas-historial";
import { exigirAcceso } from "@/lib/auth/sesion";
import { leerConstancias } from "@/lib/auditoria/datos";
import { formatearFechaLima } from "@/lib/panel/hora-lima";

export default function DatosBorrados() {
  return (
    <>
      <EncabezadoPanel
        titulo="Historial"
        descripcion="Los clientes que pidieron que se borren sus datos. De cada uno queda solo esta constancia: cuándo, quién lo hizo y por qué."
      />
      <PestanasHistorial activa="borrados" />
      <Suspense fallback={<p className="text-muted-foreground text-sm">Cargando…</p>}>
        <Lista />
      </Suspense>
    </>
  );
}

async function Lista() {
  await exigirAcceso("/admin/auditoria");
  const constancias = await leerConstancias();
  if (constancias === null) {
    return <p role="alert">No se pudieron cargar las constancias. Recarga la página.</p>;
  }
  if (constancias.length === 0) {
    return (
      <p className="bg-card rounded-xl border p-6 text-center">
        Ningún cliente ha pedido que se borren sus datos.
      </p>
    );
  }
  return (
    <ul aria-label="Constancias de borrado" className="flex flex-col gap-2">
      {constancias.map((c) => (
        <li key={c.id} className="bg-card flex flex-col gap-1 rounded-xl border p-3 wrap-anywhere">
          <span>
            <strong className="font-semibold">{c.quien}</strong> borró los datos de un cliente
          </span>
          <span>Motivo: {c.motivo}</span>
          <span className="text-muted-foreground text-sm">{formatearFechaLima(c.borrado_en)}</span>
          <Link href={`/admin/clientes/${c.cliente_id}`} className="boton-linea mt-1 w-fit">
            Ver la ficha
          </Link>
        </li>
      ))}
    </ul>
  );
}
```

- [ ] Crear `src/app/(admin)/admin/auditoria/descargas/page.tsx`:

```tsx
import { Suspense } from "react";

import { EncabezadoPanel } from "@/components/panel/encabezado-panel";
import { PestanasHistorial } from "@/components/panel/pestanas-historial";
import { exigirAcceso } from "@/lib/auth/sesion";
import { type Descarga, leerDescargas } from "@/lib/auditoria/datos";
import { formatearFechaLima } from "@/lib/panel/hora-lima";

const FORMATO: Readonly<Record<string, string>> = { xlsx: "Excel", pdf: "PDF" };

/** «12 clientes activos de Belén, en Excel». */
function queSeLlevo(d: Descarga): string {
  const cuantos = `${d.cantidad} ${d.cantidad === 1 ? "cliente" : "clientes"}`;
  const estado = d.estado ? ` ${d.cantidad === 1 ? d.estado.replace(/s$/, "") : d.estado}` : "";
  const zona = d.zona ? ` de ${d.zona}` : " de todas las zonas";
  return `${cuantos}${estado}${zona}, en ${FORMATO[d.formato] ?? d.formato}`;
}

export default function Descargas() {
  return (
    <>
      <EncabezadoPanel
        titulo="Historial"
        descripcion="Cada vez que alguien descargó la lista de clientes en un archivo: quién, cuándo y cuántos se llevó."
      />
      <PestanasHistorial activa="descargas" />
      <Suspense fallback={<p className="text-muted-foreground text-sm">Cargando…</p>}>
        <Lista />
      </Suspense>
    </>
  );
}

async function Lista() {
  await exigirAcceso("/admin/auditoria");
  const descargas = await leerDescargas();
  if (descargas === null) {
    return <p role="alert">No se pudieron cargar las descargas. Recarga la página.</p>;
  }
  if (descargas.length === 0) {
    return (
      <p className="bg-card rounded-xl border p-6 text-center">
        Nadie ha descargado la lista de clientes.
      </p>
    );
  }
  return (
    <ul aria-label="Descargas de la lista de clientes" className="flex flex-col gap-2">
      {descargas.map((d) => (
        <li
          key={d.id}
          data-descarga={d.id}
          className="bg-card flex flex-col gap-0.5 rounded-xl border p-3 wrap-anywhere"
        >
          <span>
            <strong className="font-semibold">{d.quien}</strong> descargó {queSeLlevo(d)}
          </span>
          <span className="text-muted-foreground text-sm">
            {formatearFechaLima(d.exportado_en)}
          </span>
        </li>
      ))}
    </ul>
  );
}
```

> Comprobar con una fila real qué guarda `formato` (`descargarClientes`, `src/lib/clientes/
descargar.ts`, escribe la extensión) y qué dice `estado` («activos» / «desactivados»). Si la
> extensión fuera otra, se corrige `FORMATO`; lo que no esté en el mapa sale tal cual, no se rompe.

### Paso 5 — «Actividad reciente» en el inicio

- [ ] En `src/app/(admin)/admin/page.tsx`, importar:

```tsx
import { ListaDeCambios } from "@/components/panel/lista-de-cambios";
import { resolverNombres, ultimosCambios } from "@/lib/auditoria/datos";
```

- [ ] En `InicioConSesion`, después de `const avisos = …`:

```tsx
const administracion = sesion.rol === "superadmin" || sesion.rol === "administrador";
const recientes = administracion ? await ultimosCambios(5) : [];
const nombres = await resolverNombres(recientes);
```

- [ ] Y después del `</section>` de «Tus secciones», antes de cerrar el fragmento:

```tsx
{
  administracion && recientes.length > 0 ? (
    <section aria-labelledby="actividad" className="mt-6" data-actividad-reciente>
      <h2 id="actividad" className="mb-2 font-semibold">
        Actividad reciente
      </h2>
      <ListaDeCambios cambios={recientes} nombres={nombres} etiqueta="Los últimos cambios" />
      <p className="mt-3">
        <Link href="/admin/auditoria" className="boton-linea">
          Ver todo el historial
        </Link>
      </p>
    </section>
  ) : null;
}
```

> El inicio ya es dinámico (lee la sesión dentro de su `<Suspense>`), así que estas lecturas no tocan
> el prerenderizado. Van **debajo** de los avisos y de las secciones: lo que hay que hacer primero, lo
> que pasó después.

### Paso 6 — «Ver historial» en producto, insumo y cliente

- [ ] Crear `src/components/panel/enlace-historial.tsx`:

```tsx
import { History } from "lucide-react";
import Link from "next/link";

import type { Dueno } from "@/lib/auditoria/catalogo";

/**
 * Abre el historial filtrado a un registro, con lo que cuelga de él. Quien lo
 * pinta comprueba antes que la sesión es de la administración: los demás roles
 * no entran a `/admin/auditoria` y el enlace los llevaría a «sin acceso».
 */
export function EnlaceHistorial({ de, id }: { de: Dueno; id: string }) {
  return (
    <Link href={`/admin/auditoria?registro=${id}&de=${de}`} className="boton-linea">
      <History aria-hidden className="size-5" /> Ver historial
    </Link>
  );
}
```

- [ ] `src/app/(admin)/admin/contenido/productos/[id]/page.tsx`: guardar la sesión
      (`const sesion = await exigirAcceso("/admin/contenido/productos");`) y pasar al encabezado:

```tsx
        accion={
          sesion.rol === "superadmin" || sesion.rol === "administrador" ? (
            <EnlaceHistorial de="producto" id={producto.id} />
          ) : null
        }
```

- [ ] `src/app/(admin)/admin/insumos/[id]/page.tsx`: lo mismo con la sesión que ya pide la ficha
      (si hoy no la guarda en una variable, guardarla), y el `accion` pasa a:

```tsx
        accion={
          <div className="flex flex-wrap gap-2">
            <Link href={`/admin/insumos/${id}/editar`} className="boton-linea">
              <Pencil aria-hidden className="size-5" /> Editar datos
            </Link>
            {sesion.rol === "superadmin" || sesion.rol === "administrador" ? (
              <EnlaceHistorial de="insumo" id={id} />
            ) : null}
          </div>
        }
```

- [ ] `src/app/(admin)/admin/clientes/[id]/page.tsx`: ya tiene `administracion`. La ficha con los
      datos borrados también lleva el enlace (es donde la administración ve quién los borró):

```tsx
        accion={
          cliente.borrado ? (
            administracion ? (
              <EnlaceHistorial de="cliente" id={id} />
            ) : null
          ) : (
            <div className="flex flex-wrap gap-2">
              <Link
                href={`/admin/clientes/${id}/${encargado ? "editar" : "corregir"}`}
                className="boton-linea"
              >
                <Pencil aria-hidden className="size-5" />
                {encargado ? "Editar datos" : "Corregir ubicación y fotos"}
              </Link>
              {encargado ? <BotonActivoCliente id={id} activo={cliente.activo} /> : null}
              {administracion ? <EnlaceHistorial de="cliente" id={id} /> : null}
            </div>
          )
        }
```

> Tres botones junto al título a 375 px: el contenedor ya lleva `flex-wrap` y el título está en una
> fila que también envuelve (`EncabezadoPanel`). La prueba de área táctil lo mide en el paso 7; si
> el título quedara estrecho, los botones bajan a su propia fila (`w-full` en el contenedor).

### Paso 7 — Ejecutar, revisar y abrir el PR

- [ ] En `e2e/panel-accesibilidad.spec.ts`, añadir a `RUTAS_DEL_PANEL`:
      `"/admin/auditoria/ingresos"`, `"/admin/auditoria/borrados"`, `"/admin/auditoria/descargas"`.
- [ ] `pnpm typecheck && pnpm lint && pnpm test` → **Esperado:** sin errores.
- [ ] Liberar el puerto 3000, `pnpm build` **en primer plano**, levantar el servidor, y por tandas,
      con `--workers=1`:
  - `pnpm exec playwright test e2e/panel-historial.spec.ts` → **Esperado:** 8 pasan en `movil`, 8 se
    saltan en `escritorio`.
  - `pnpm exec playwright test e2e/panel-accesibilidad.spec.ts` → **Esperado:** verde en las 45
    rutas, las cuatro nuevas entre ellas.
  - Las pantallas que comparten lo que se tocó: `e2e/panel-cascara.spec.ts`,
    `e2e/panel-productos.spec.ts`, `e2e/panel-insumos.spec.ts`, `e2e/panel-kardex.spec.ts` (la ficha
    del insumo) y `e2e/panel-clientes*.spec.ts`.
    **Esperado:** verde. Una prueba vieja que busque «el único enlace» del encabezado de una ficha
    puede fallar por modo estricto ahora que hay dos: se le da el nombre exacto.
- [ ] Parar el servidor (comprobar que el puerto 3000 queda libre).
- [ ] Mirarlo a mano a 375 px y en escritorio con `pnpm dev`: la lista con frases largas, el detalle
      de un cambio de `configuracion_sitio` (el horario es un objeto: tiene que leerse, Review Focus),
      y una frase de alguien sin nombre.
- [ ] Commit:

```bash
git add src/lib/auditoria/datos.ts "src/app/(admin)/admin" src/components/panel/enlace-historial.tsx \
        e2e/panel-historial.spec.ts e2e/panel-accesibilidad.spec.ts
git commit -m "feat(historial): ingresos, datos borrados, descargas, actividad reciente y «Ver historial»"
```

- [ ] Revisión de la rama entera (T2 + T3) con un subagente opus. Qué pedirle que mire, además de lo
      de siempre: que ninguna lectura del historial use `service_role`; que un texto escrito por una
      persona no llegue a un `dangerouslySetInnerHTML` (no debe haber ninguno); que los filtros de
      `.or()` se armen solo con valores ya validados por `leerFiltros` (un uuid, nunca texto libre de
      la dirección); y los cinco puntos de Review Focus. Lo Importante, arreglado con su prueba vista
      fallar primero.
- [ ] PR con las dos tareas (sin atribución) y **parar** hasta que Dan fusione. No hay `db push`.

---

## Tarea 4 — Cierre del módulo

**Rama:** `docs/f7-t4-historial-cierre` (desde `main` actualizado) · **Migración:** no · **PR:** sola.

**Qué deja hecho:** la suite afectada corrida entera, el manual del historial para el negocio, la
documentación al día y la revisión final.

**Files:**

- Create: `docs/historial.md`
- Modify: `AGENTS.md`, `DOC/Avance del proyecto.md`, `DOC/Plan de Desarrollo 00 - General y
Fases.md`, `DOC/Plan de Desarrollo 02 - Backend y Base de Datos.md` (§5, auditoría),
  `DOC/Plan de Desarrollo 07 - Auditoría.md` («Lo que resultó distinto»), `docs/clientes.md`

### Paso 1 — La suite

- [ ] `supabase db reset`, `bash supabase/seeds/imagenes/subir-imagenes.sh`, `supabase test db`
      **Esperado:** `Result: PASS`, 729 (716 + 13). Anotar la cifra real.
- [ ] `pnpm typecheck && pnpm lint && pnpm test` → **Esperado:** verde; anotar cuántas unitarias y en
      cuántos archivos.
- [ ] Los tres guiones (`verificar-fase0.sh`, `verificar-storage.sh`, `verificar-sitio-publico.sh`).
- [ ] E2E **entera**, por tandas contra un mismo build (como al cerrar F6): el menú y el inicio
      cambiaron, y los comparten todas las pantallas del panel. `pnpm exec playwright test --list`
      da la cifra para la documentación. **Esperado:** 0 fallos; anotar cuántas pasan y cuántas se
      saltan.
- [ ] **Sin Lighthouse comparativo:** el módulo no toca el sitio público —ni una ruta, ni un
      componente, ni el CSS global (solo clases que ya existían)—. Se comprueba, no se supone:
      `git diff --stat <commit de antes de la T2>..HEAD -- src/estilos "src/app/(public)" src/components`
      no debe listar nada fuera de `src/components/panel/`. Si lista algo, entonces sí se mide,
      intercalado, como en F6.

### Paso 2 — El manual para el negocio

- [ ] Crear `docs/historial.md`, en el tono de `docs/clientes.md` (frases cortas, sin jerga), con
      estas secciones y este contenido:
  - **Para qué sirve.** Responder «¿quién cambió esto y cuándo?». Nadie puede editarlo ni borrarlo,
    tampoco el propietario.
  - **Quién lo ve.** El propietario y los administradores. Los ingenieros y los repartidores no.
  - **Cambios.** Cómo se lee una línea (quién, qué hizo, cuándo, en hora de Iquitos); los cuatro
    filtros; «Ver más»; qué es «El sistema» (lo que hace el panel solo: retirar una promoción
    vencida); abrir un cambio para ver el antes y el después; «Detalle técnico» es para el
    ingeniero, no hace falta abrirlo.
  - **Buscar el historial de una cosa.** El botón «Ver historial» en un producto, un insumo o un
    cliente, y que trae también sus presentaciones, movimientos, fotos y permisos.
  - **Ingresos.** Quién entró y quién salió. Lo que **no** anota: los intentos con la contraseña
    equivocada, ni desde qué equipo. Que «salió» incluye el cierre por dos horas sin uso; que si la
    administración desactiva a alguien, eso sale en Cambios.
  - **Datos borrados.** Qué es una constancia y por qué no se puede quitar. Que el historial de ese
    cliente dice que se borró y ya no enseña sus datos.
  - **Descargas.** Por qué se anotan (la lista sale del sistema con datos personales).
  - **Lo que el historial no hace.** No deshace cambios; no se descarga; no guarda cuánto tiempo
    estuvo alguien dentro.
  - **Preguntas que resuelve**, con el camino exacto para cada una: «¿Quién subió el precio del pan?»,
    «¿Quién registró este ingreso de harina?», «¿Quién desactivó a este cliente?», «¿Entró alguien
    el domingo?».
- [ ] En `docs/clientes.md`, donde dice que las constancias y las descargas solo se leen por SQL,
      cambiarlo por dónde se ven ahora (Historial → Datos borrados / Descargas).

### Paso 3 — La documentación

- [ ] `DOC/Plan de Desarrollo 07 - Auditoría.md`: añadir al final «Lo que resultó distinto», tarea a
      tarea, con lo que la ejecución cambió del plan (como en F5 y F6), y «Hallazgos menores
      aplazados» con lo que la revisión dejó. Dos entradas ya conocidas: las fechas van como
      «06/10/2026 10:05» y no en forma relativa; y la forma exacta de las frases.
- [ ] `AGENTS.md`: Estado (F7 en curso: módulo de auditoría cerrado, falta el resto de la fase);
      «La base hoy» con las cifras recontadas **con las mismas consultas** (45 migraciones, 15
      vistas); «Verificación» con las cifras del paso 1; la fila 0045 en la tabla de migraciones;
      en Arquitectura, un párrafo de `/admin/auditoria` y `src/lib/auditoria/` y la cuenta de rutas
      con prueba de accesibilidad; quitar «La auditoría queda para F7»; y «Trampas de F7» con las
      que haya pagado la ejecución.
- [ ] `DOC/Avance del proyecto.md` y `Plan 00`: el módulo, con fecha y PR.
- [ ] `Plan 02` §5: que la auditoría ya tiene pantalla, la función `ingresos_al_sistema` y las dos
      vistas.
- [ ] `pnpm format:check` (o `pnpm exec prettier --check` sobre los archivos tocados).

### Paso 4 — Revisión final y PR

- [ ] Revisión final del módulo con un subagente opus sobre `main` (ya con la T1 y la T2+T3
      fusionadas) más esta rama: la spec entera contra lo construido, sección por sección; las reglas
      de «Global Constraints»; y que `docs/historial.md` no prometa nada que el panel no haga.
- [ ] Si la revisión encuentra algo Importante en el código: se arregla **en esta rama**, con su
      prueba vista fallar primero. Si exige una migración, **no** va aquí: PR propio (0046), solo, y
      se para (regla de PR).
- [ ] Commit `docs(historial): cierre del módulo de auditoría`, PR (sin atribución) y **parar**.
- [ ] Al fusionar: producción no necesita nada más que el `db push` de la T1. Comprobar a mano en
      https://pimpos-system-iota.vercel.app, con el superadmin, que Historial carga y que Ingresos
      trae el ingreso que se acaba de hacer (es la única parte que depende de un permiso de la
      plataforma, el de leer `auth.audit_log_entries`).

---

## Lo que resultó distinto

Lo que la ejecución (06/10/2026, PR #86 a #88) cambió del texto de arriba. Donde este apartado y un
paso del plan no coinciden, manda este: es lo que quedó construido.

### Respecto a la spec

- **Las fechas van como en el resto del panel**, «06/10/2026 16:10» en hora de Iquitos, no en forma
  relativa («ayer, 4:10 p. m.»): una fecha relativa deja de ser cierta en una página que se queda
  abierta.
- **Un guardado es una línea** (decisión 6, «una fila por cambio», afinada). `guardar_producto`
  reescribe el producto, quita la marca de presentación principal, la vuelve a poner y reescribe cada
  presentación: cuatro filas para un precio. La lista junta las filas del mismo instante, de la misma
  persona y sobre el mismo registro (`fundir`, en `redactar.ts`), de cómo estaba antes a cómo quedó,
  y **no enseña los cambios que al final no movieron ningún dato**. El detalle de un cambio sigue
  enseñando cada fila tal cual; la línea fundida abre la última del grupo.
- **Ingresos empieza el 06/10/2026.** En el proyecto alojado el registro de Auth no se escribía en
  la base; se encendió ese día (Authentication → Audit Logs). Comprobado allí lo que en local no se
  veía: la salida sí queda anotada.
- **El reparto de un movimiento entre lotes** entra en «Ver historial» de un insumo buscándolo por
  los lotes del insumo, los 100 más recientes: esa tabla no guarda el insumo.

### Tarea 1

- La prueba «no salen ni las altas ni los refrescos» miraba la etiqueta (`accion`), y la función
  llama «salida» a todo lo que no es un ingreso: pasaba también sin el filtro. Cuenta la fixture.
- La guarda comprueba que el registro de Auth **se puede leer**, no que **se esté escribiendo**: lo
  segundo se comprobó a mano en producción antes del `db push`, y estaba apagado.
- En la T4 la prueba pasó de 13 a 18: el superadmin, los dos límites del periodo y el caso positivo
  de `constancias_de_borrado`.

### Tareas 2 y 3

- **Los nombres se buscan por tabla y en tandas.** El plan mandaba todos los ids a las diez tablas en
  una sola consulta cada una: con más de unos 200, PostgREST responde `414`, y el error se tragaba,
  así que la lista afirmaba «un insumo que ya no existe» de cosas que existen. Ahora cada campo sabe
  en qué tabla está su nombre (`tablaQueSenala`), van de 100 en 100 y un fallo queda en el registro
  del servidor.
- **Las pruebas de navegador usan un producto propio**, guardado con `guardar_producto` como lo hace
  el formulario, y lo borran antes que al usuario. Las del plan cambiaban el precio de un producto de
  la semilla con la sesión del usuario de prueba: `updated_by` quedaba apuntando a él y
  `borrarUsuario` fallaba sin avisar.
- **`role="alert"` no sirve para saber si hay un error en pantalla**: Next deja siempre uno vacío,
  su anunciador de rutas. La prueba mira el texto.
- **`signOut()` cierra todas las sesiones del usuario**, también la del navegador de la prueba. Para
  anotar una salida sin tumbar la sesión, `signOut({ scope: "local" })`.
- Un bloque JSX del plan salió con un `;` de más: Prettier lo había formateado como sentencia dentro
  del documento.
- «Ir a donde se hizo» tampoco sale si el registro lleva `deleted_at` o es una ficha con los datos
  borrados; `de` se valida con `Object.hasOwn` (`?de=constructor` pasaba); y el nombre del dueño de un
  «Ver historial» se pide aparte, porque con muchos movimientos su propia fila no cabe en la página.

### Tarea 4

Dan pidió (06/10/2026) que los menores aplazados de la revisión entraran todos:

- Dar de alta una cuenta se dice «dio de alta la cuenta de Debra como Ingeniero», no «cambió el rol
  de Debra: Repartidor → Ingeniero» (la cuenta nace desactivada y como repartidor, 0006).
- Las coordenadas se escriben con 6 decimales y el costo por unidad base con hasta 4.
- En los datos de un cambio ya no salen los identificadores de lote y de movimiento; «Suma o resta»
  dice Suma o Resta, la moneda dice Soles, y una persona que ya no está es «alguien que ya no tiene
  cuenta».
- Cada dato de la configuración se nombra como en su formulario («el horario de atención»), y el
  horario y los valores se escriben en texto corrido, no como JSON.
- Un texto largo que cambia al final se veía igual a los dos lados de la flecha: la línea dice solo
  qué cambió, y el detalle lo enseña entero.
- Un fallo de la base al abrir un cambio dice «No se pudo cargar», no «No encontramos esta página».
- Los filtros se vuelven a montar al pasar de «Ver historial» a todo el historial.
- Pruebas: el filtro «hoy» a las 11:30 p. m. de Iquitos, y que la actividad reciente no traiga tablas
  internas.

La revisión final del módulo encontró dos cosas más, arregladas en la misma rama:

- **La actividad reciente desaparecía después de guardar la Configuración**, y la primera página de
  Cambios podía salir vacía: se cortaba a las filas pedidas y después se juntaban, y un guardado de
  Configuración deja unas 27 filas casi todas sin cambio. Ahora se piden filas de más, se juntan y
  entonces se corta (`enLineas`); y «Ver más» sale también cuando lo más reciente no dejó ninguna
  línea.
- **Dar de alta a un repartidor se leía «reactivó la cuenta de…»**: la regla del alta miraba que
  cambiara el rol, y quien entra como repartidor no cambia de rol. El alta se reconoce porque la
  cuenta no se había tocado (`created_at = updated_at`).
- De paso: un costo como 12.00004 salía «S/ 12.» (ahora nunca pierde los dos decimales ni el
  separador de miles), y una palabra como `toString` en un campo con lista de palabras devolvía una
  función.

**Sin Lighthouse comparativo**, como preveía el plan: de `0c386f6` a la rama, lo único tocado en
`src/components` son cinco archivos de `src/components/panel/`; nada en `src/estilos`, en
`src/app/(public)` ni en el layout raíz.

### Después del cierre: los menores que quedaban (PR #89)

Dan pidió (06/10/2026) atacar lo que quedó anotado al cerrar. Sin migración.

- **El detalle de un cambio enseña el guardado entero**, igual que su línea en la lista: si la fila
  es una de las varias que dejó un mismo «Guardar» sobre ese registro, se juntan
  (`delMismoGuardado`). El «Detalle técnico» sigue siendo el de esa fila y enlaza a las demás («Del
  mismo guardado»).
- **«Ir a donde se hizo» pregunta a la base si el registro sigue ahí** (`destinoDe` +
  `existeDestino`): ya no sale desde un cambio antiguo de algo que se borró después. Una presentación
  pregunta por su producto, una foto por su cliente. Si la consulta falla, el botón sale.
- **El reparto entre lotes se dice con el insumo y la cantidad**: «apuntó en un lote de Sal la parte
  de un movimiento: 1». Un lote no tiene nombre; se busca el de su insumo.
- **Un texto largo que cambia al final dice qué dato fue**: «cambió el producto Pan francés
  (descripción)». En la configuración la cosa ya es el dato.
- **Los filtros son controles controlados** y se vuelven a poner como diga la dirección cuando esta
  cambia por otro camino (pulsar una pestaña, «Ver todo el historial»). Con `defaultValue`, al
  volver a la misma ruta sin filtros los desplegables seguían diciendo los de antes.
- Un cambio que solo mueve un identificador que no se enseña dice «cambió …», no «guardó … sin
  cambiar nada».
- Pruebas: la partición en tandas (`enTandas`); la actividad reciente se mira después de un ajuste
  de stock, que deja filas de tablas internas como lo último del registro (antes la comprobación no
  podía fallar); el detalle del guardado entero; «Ir a…» tras borrar el producto; los desplegables
  tras pulsar la pestaña; y el reparto entre lotes en «Ver historial» de un insumo.

La revisión de esa rama encontró, y quedó arreglado antes del PR:

- **«Ir a…» seguía saliendo en seis pantallas de contenido** (novedades, portada, preguntas, galería,
  guías, testimonios): la comprobación reutilizaba la lista de tablas de las que se saca un nombre.
  Tiene su propia lista (`TABLAS_CON_PANTALLA`, 13 tablas, todas con `deleted_at`), una prueba que
  recorre el catálogo, y la E2E borra el producto como lo hace el panel (con su marca), no solo
  físicamente. De paso, la consulta pide `id, deleted_at`, no la fila entera.
- **Con los filtros controlados, las fechas de un rango se intercambiaban al escribir**: la página
  ordena «desde» y «hasta», y el control se reajustaba a eso. Un rango al revés ya no navega. La
  regla de qué va a la dirección es ahora una función pura con sus pruebas (`aDireccion`, en
  `direccion.ts`, sin dependencias: la importa un componente de cliente).
- Una persona que venía en la dirección y no está entre las opciones (una cuenta eliminada) ya no se
  reenvía con cada filtro; y las filas de un mismo guardado se piden ordenadas.

## Hallazgos menores que quedan

Lo que queda es lo que no tiene arreglo razonable hoy, con su porqué:

- **El filtro por registro no usa índice** (`registro_id` o un campo dentro de `datos_*`): recorre
  `app.auditoria` entera. Exige una migración y seis índices de expresión que encarecen cada
  escritura del panel, para una consulta que hoy recorre unas mil filas. A revisar si el historial
  pasa de unas cien mil.
- **`auth.audit_log_entries` no tiene índice por fecha** y no se puede crear desde las migraciones:
  la tabla es de la plataforma.
- **Una cuenta eliminada** sale en Ingresos con su correo y sin nombre, y no se puede elegir en el
  filtro de personas: al eliminarla se va su perfil, que es donde estaba el nombre. No es un defecto
  del historial; el panel desactiva cuentas, casi nunca las elimina.
- **«Ver historial» de un insumo** trae el reparto entre lotes de sus 100 lotes más recientes: los
  ids viajan en la dirección de la consulta.
- El `grant select` de las dos vistas de 0045 es redundante (inofensivo); quitarlo es una migración.
- `sesionDeApi` (`e2e/ayudas/insumos.ts`) crea un usuario en cada llamada y no lo borra. Viene de F5
  y no se puede arreglar borrándolos: los movimientos que registran (`responsable_id`) no se pueden
  borrar, y con ellos vivos el usuario tampoco. Solo afecta a la base local.
- **La línea del reparto entre lotes no dice la unidad ni si suma o resta**: un ingreso y un consumo
  se leen igual («…la parte de un movimiento: 10»). La línea del movimiento, justo al lado, sí lo
  dice; añadirlo aquí pide traer la unidad del insumo y el sentido del movimiento por cada fila.
- **Con un rango a medias** (una fecha vacía o las dos al revés), cambiar otro filtro tampoco navega
  hasta completar el rango: los desplegables dicen lo elegido y la lista, lo anterior.
- La prueba de los desplegables tras pulsar la pestaña no se vio fallar contra el código anterior
  (habría hecho falta otro build); las demás de este apartado sí.
