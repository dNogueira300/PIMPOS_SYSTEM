# Plan de Desarrollo 06 — Clientes

> **Para quien lo ejecute:** se trabaja tarea a tarea, en orden. **Regla de PR desde F6** (Dan,
> 30/09/2026): una tarea **con migración** va sola en su PR y se para hasta que Dan haga
> `supabase db push` desde `PIMPOS_SYSTEM` (con la carpeta quieta) y fusione; una tarea **sin
> migración** no abre PR sola: se sigue con la siguiente en la misma rama y se abre un PR con las
> dos. **Nunca más de dos tareas por PR**, y solo si ninguna lleva migración. Antes de empezar, leer
> `AGENTS.md` entero.
>
> Cómo se ejecuta: como F5 desde su T7 — la sesión principal implementa
> (`superpowers:executing-plans`) y un subagente hace la revisión final de cada PR; lo Importante se
> arregla antes de abrirlo, con una prueba vista fallar primero.

**Objetivo:** que los encargados registren a un cliente en un par de minutos, con su permiso
anotado, y que cualquiera del reparto lo encuentre por nombre o celular y sepa llegar a su casa —
tratando nombre, celular, dirección, ubicación y fotos de la fachada como lo que son: datos
personales protegidos por la Ley N.° 29733.

**Arquitectura:** enfoque A (Dan, 30/09/2026), el de F4 y F5. Las reglas viven en **Postgres**:
el alta con permiso en una sola transacción, lo que puede tocar el repartidor, el borrado de datos
a pedido, la conservación y el registro de exportaciones, cada una con su prueba pgTAP. Las
pantallas usan las piezas del panel que ya existen (`ListaAdaptable` con su lápiz, `BuscadorEnVivo`,
`FormularioPanel` con copia local, `PestanasFormulario`, la subida de fotos comprimidas, `ejecutarAccion`)
y el mapa de Leaflet del sitio público.

**Stack:** el de F5, sin dependencias nuevas. Excel y PDF con las mismas `exceljs` y
`@react-pdf/renderer` de F5 (T7); el mapa con `leaflet`, ya en el proyecto.

**Punto de partida:** migraciones 0013 (clientes, fotos, consentimientos, zonas, búsqueda sin
tildes) y 0014 (bucket privado `clientes`); doc 02 §10; ficha del negocio, sección 8. No hay ni una
pantalla de clientes: F6 es todo el panel.

---

## Lo que ya decidió el negocio (ficha, sección 8)

- **Datos obligatorios:** nombre completo, celular, dirección, referencia de la dirección y zona de
  reparto, más las fotos de la fachada. **No** se piden DNI, correo, tipo de cliente ni fecha de
  nacimiento.
- **Fotos:** hasta 3, **solo de la fachada**, desde la cámara del celular o desde la galería.
- **Permiso:** verbal (8.4).
- **Quién registra:** los ingenieros, en el local, desde la computadora o el celular (8.5).
- **Consultas** (8.6): buscar por nombre y por celular (prioridad 1); filtrar por zona, ver en un
  mapa, lista para la ruta de reparto, exportar a Excel o PDF, editar y desactivar (prioridad 2);
  WhatsApp desde la ficha (prioridad 3).
- **Historial de pedidos:** «en una etapa posterior» (8.7) — fuera de F6.
- **Prioridad del módulo:** la cuarta de cuatro (10.1).

## Decisiones de Dan (30/09/2026)

1. **Ubicación: dirección escrita obligatoria y punto en el mapa opcional.** La ficha se
   contradecía (8.2 pedía ubicación en mapa, 8.3 «solo la dirección escrita»). Al registrar se
   puede tocar el mapa para marcar la casa o usar «Usar mi ubicación»; los clientes con punto salen
   en el mapa, los demás solo en la lista.
2. **El repartidor ve todo y corrige lo de campo.** Ve y busca a todos los clientes, abre el mapa,
   llama o escribe por WhatsApp. Puede corregir la **referencia**, el **punto en el mapa** y
   **añadir o cambiar fotos**; no crea ni desactiva clientes, no borra fotos y no cambia nombre,
   celular, dirección ni zona. Lo impone la base, no la pantalla.
3. **Desactivar y, a pedido, borrar de verdad.** «Desactivar» saca al cliente de la lista y del
   reparto sin perder nada, y se puede deshacer. «Borrar sus datos», solo la administración y a
   pedido del cliente, borra nombre, celular, dirección, referencia, punto y fotos, también de la
   auditoría; queda solo la constancia de que se borró, cuándo, quién y por qué.
4. **Conservación: aviso a los 2 años sin actividad.** Nada se borra solo. Si la ficha de un cliente
   activo lleva 2 años sin cambios (datos, fotos o permiso), el inicio del panel avisa a la
   administración, que elige «Sigue siendo cliente» (renueva la fecha) o «Borrar sus datos».
5. **El permiso va primero.** No se guarda un cliente sin marcar «Se lo leí y aceptó», y la base lo
   impone. Se guarda con fecha, quién lo registró y la **versión del texto** leído.
6. **Exportar: solo la administración, sin fotos, con registro.** Superadmin y administrador bajan
   Excel o PDF de la lista filtrada (nombre, celular, dirección, referencia, zona); cada descarga
   queda registrada con quién, cuándo, cuántos clientes, filtro y formato.
7. **La ruta de reparto es la lista por zona con su mapa.** Cada cliente con «Llamar», «WhatsApp»
   y «Cómo llegar» (Google Maps en el punto, si lo tiene). Sin elegir entregas del día: eso llegará
   con los pedidos.
8. **Celular repetido: avisar y dejar seguir.** «Este celular ya es de Rosa Pérez (Belén) — Ver su
   ficha», y un botón para registrar igual (una familia o una bodega comparten número).
9. **Sin modo offline en F6.** Basta la copia local del formulario (F4); las fotos necesitan
   conexión para subir. La PWA offline (R16) queda para F7 si sobra tiempo.
10. **Zonas administrables.** Una pantalla sencilla para renombrar, añadir, ordenar y desactivar
    zonas, solo para la administración; una zona con clientes activos no se retira.
11. **Enfoque A** (reglas en la base) y la **regla de PR** del encabezado.

## El texto del permiso (versión `v1-2026-10`)

Se le lee al cliente antes de registrarlo. El número del negocio sale de la configuración
(`configuracion_sitio`), no se escribe en el código:

> «Para llevarle sus pedidos, Panadería Pimpo's guardará su nombre, su celular, su dirección con una
> referencia, la ubicación de su casa y hasta tres fotos de la fachada. Solo los ve el personal de la
> panadería y no se comparten con nadie. Los guardamos mientras sea nuestro cliente; si pasan dos
> años sin que su ficha se use, los revisamos para borrarlos. Puede pedir en cualquier momento que
> los corrijamos o los borremos, llamando o escribiendo al {celular del negocio}. ¿Está de acuerdo?»

El texto vive **en el código**, versionado, y la base guarda la versión que se leyó. No se edita
desde el panel: un texto legal cambiado por error cambiaría lo que «aceptó» cada cliente. Cambiarlo
exige una versión nueva, y una prueba lo comprueba (un hash del texto fijado en la prueba).

---

## Diseño

### 1. La base (migraciones 0042 y 0043)

- **Alta con permiso, todo o nada.** `public.registrar_cliente(p_cliente jsonb, p_version_texto
text)` crea el cliente y su consentimiento en una transacción. Además, un trigger de restricción
  **diferido** (se comprueba al terminar la transacción) rechaza todo cliente que quede sin
  consentimiento vigente, para que un `insert` directo por la API no se salte la regla. Los
  `es_demo` quedan fuera.
- **Lo que puede el repartidor.** La política de alta de `clientes` deja de incluirlo; un trigger
  (como `app.proteger_perfiles`, 0029) solo le deja cambiar `referencia`, `latitud` y `longitud`.
  Fotos: puede añadir y reemplazar, no borrar. Desactivar y reactivar: administración e ingenieros.
- **Borrar sus datos.** `public.borrar_datos_cliente(p_id uuid, p_motivo text)`, `security definer`
  con comprobación de rol (superadmin, administrador):
  1. sobrescribe nombre, celular, dirección, referencia, observación y punto («Datos borrados a
     pedido del cliente» o `null`) y desactiva la ficha;
  2. borra las filas de `cliente_fotos` (los archivos del bucket los borra después la acción del
     servidor: SQL no borra archivos de Storage);
  3. revoca el consentimiento;
  4. **en `app.auditoria` no borra filas: tacha su contenido** — las de ese cliente conservan quién,
     cuándo y qué operación, pero su `datos_antes`/`datos_despues` pasa a `{"borrado": true}`. Es la
     única excepción a «la auditoría no se toca», y queda escrita en la migración;
  5. deja una fila en `supresiones` (cliente, fecha, quién, motivo; sin datos personales).
- **Conservación.** Vista `clientes_para_revisar` (activos sin cambios en datos, fotos ni permiso
  desde hace más de 2 años) y «Sigue siendo cliente», que renueva la fecha.
- **Registro de exportaciones.** Tabla `exportaciones_clientes` (quién, cuándo, cuántos, filtro,
  formato): solo la administración inserta y lee; nadie edita ni borra.
- **Zonas.** Solo la administración las gestiona (los ingenieros dejan de poder, como decidió Dan), y
  un trigger impide retirar una zona con clientes activos.

### 2. Las pantallas

Todo bajo **Clientes** (barra lateral y barra inferior), para los cuatro roles.

- **`/admin/clientes`** — buscador en vivo por nombre (sin tildes y con errores de tecleo, con el
  índice de 0013) y por celular; filtro por zona y activos/desactivados (este, solo
  administración e ingenieros); vista **Lista** (tarjetas con nombre, zona, dirección y referencia,
  y **Llamar**, **WhatsApp** con el 51, **Cómo llegar** si hay punto; el lápiz lleva a editar o, al
  repartidor, a «Corregir») y vista **Mapa** (marcadores; al tocar, nombre y «Ver ficha»; debajo,
  cuántos no tienen punto). La administración ve «Descargar Excel / PDF».
- **`/admin/clientes/nuevo`** (administración e ingenieros) — pestañas con un solo «Guardar»:
  **Datos** (con el aviso de celular repetido), **Ubicación y fotos** (mapa opcional con «Usar mi
  ubicación», hasta 3 fotos de cámara o galería, comprimidas), **Permiso** (el texto en letra grande
  y la casilla «Se lo leí y aceptó»).
- **`/admin/clientes/[id]`** — la ficha: datos, fotos por URL firmada de pocos minutos, mapa
  pequeño, los tres botones, el permiso (versión, fecha, quién). Acciones según el rol: Editar
  (administración, ingenieros), Corregir ubicación, referencia y fotos (repartidor), Desactivar o
  reactivar (administración, ingenieros), Borrar sus datos (administración: diálogo con motivo y
  aviso de que no se deshace).
- **`/admin/clientes/zonas`** (administración) — como categorías en F4.
- **Inicio** (administración) — «N clientes sin cambios en 2 años — Revisar», que lleva a
  `/admin/clientes/revisar`, con «Sigue siendo cliente» o «Borrar sus datos» en cada uno.

### 3. Las pruebas

- **pgTAP**: alta sin permiso rechazada (también por `insert` directo); el repartidor no cambia
  nombre, celular, dirección, zona ni `activo`, no crea clientes, no borra fotos, y sí cambia
  referencia y punto; `borrar_datos_cliente` solo para la administración, y tras el borrado **ni un
  dato personal** del cliente en `clientes`, `cliente_fotos`, `consentimientos` **ni en
  `app.auditoria`** (buscando su nombre y celular originales), con la fila en `supresiones`;
  `clientes_para_revisar` en el borde de los 2 años; exportaciones solo de la administración;
  zonas con clientes que no se retiran; ninguna política `to anon` y toda vista con
  `security_invoker`.
- **Vitest**: normalizar el celular para WhatsApp (51, espacios, guiones), los enlaces de WhatsApp y
  de «Cómo llegar», los esquemas Zod del cliente y de la corrección del repartidor, y el hash del
  texto del permiso contra su versión.
- **E2E**: registrar con foto, punto y permiso y encontrarlo por nombre sin tildes y por celular; el
  aviso de celular repetido; el repartidor corrige referencia y punto y no ve lo que no puede; la
  administración borra los datos de un cliente; la exportación queda registrada y solo la ve la
  administración; el mapa enseña los clientes con punto; la foto no se ve sin sesión (la URL
  caduca y el archivo no es público, comprobado contra Storage). Las rutas nuevas entran en
  `RUTAS_DEL_PANEL` (axe y 44 px). Todo a 375 px.
- **Guion**: `verificar-storage.sh` comprueba que un anónimo no lee nada del bucket `clientes`
  (exigiendo el 4xx concreto).

### 4. Las tareas

| Tarea | Qué deja                                                                                                                     | Migración | PR            |
| ----- | ---------------------------------------------------------------------------------------------------------------------------- | --------- | ------------- |
| T1    | Reglas de clientes en la base: `registrar_cliente`, permiso obligatorio, lo del repartidor, fotos, zonas                     | 0042      | Solo; se para |
| T2    | Borrado a pedido (con la auditoría tachada), `supresiones`, conservación, `exportaciones_clientes`                           | 0043      | Solo; se para |
| T3    | Consultar: navegación, lista con buscador y filtros, mapa, ficha con fotos firmadas, Llamar / WhatsApp / Cómo llegar         | —         | Con T4        |
| T4    | Registrar y corregir: alta en pestañas, aviso de celular repetido, editar, «Corregir» del repartidor, desactivar y reactivar | —         | ↑ T3 + T4     |
| T5    | Zonas, «Borrar sus datos» (con los archivos de Storage), aviso de conservación y «Revisar»                                   | —         | Con T6        |
| T6    | Exportar Excel y PDF de la lista filtrada, solo administración, con registro                                                 | —         | ↑ T5 + T6     |
| T7    | Cierre: suite completa, rendimiento contra el cierre de F5, `docs/clientes.md` y revisión final de la fase                   | —         | Solo          |

## Fuera de F6

- El historial de pedidos y la ruta del día con entregas (ficha 8.7: «en una etapa posterior»).
- El modo sin conexión (PWA, R16): F7, si sobra tiempo.
- Tipo de cliente, DNI y correo: la ficha no los pide.

---

# Plan paso a paso

> **Para quien lo ejecute:** skill `superpowers:executing-plans` (la sesión principal implementa) y,
> al cerrar cada PR, una revisión de la rama con un subagente (`superpowers:requesting-code-review`).
> Los pasos llevan casillas (`- [ ]`). Cada paso con comando dice qué debe salir (**Esperado**).
> **Spec:** la primera parte de este documento («Decisiones de Dan» y «Diseño»): el plan argumenta
> desde ella; si un paso la contradice, manda la spec y se anota en «Lo que resultó distinto».

**Goal:** el módulo de clientes del panel (ficha 8) con las reglas de datos personales en la base.

**Architecture:** reglas en Postgres (0042: alta con permiso, lo del repartidor, fotos, zonas,
búsqueda; 0043: borrado a pedido con la auditoría tachada, conservación, registro de
exportaciones), lecturas en `src/lib/clientes/`, escrituras por `ejecutarAccion()` en
`src/lib/acciones/clientes.ts`, pantallas bajo `src/app/(admin)/admin/clientes/`.

**Tech Stack:** Next.js 16.3.4 · React 19.2.8 · Tailwind 4.3.3 · Zod 4.5.4 · supabase-js +
`@supabase/ssr` · Leaflet (sin react-leaflet) · `browser-image-compression` · `exceljs` ·
`@react-pdf/renderer` · Vitest · Playwright · axe · pgTAP.

## Global Constraints

- Textos de interfaz **en español y sin jerga** (usuarios con nivel básico de computadora).
- Todo funciona a **375 px**, con área táctil **≥ 44 × 44 px** y **axe en cero**; cada ruta nueva
  entra en `RUTAS_DEL_PANEL` (`e2e/panel-accesibilidad.spec.ts`).
- Datos personales (Ley N.° 29733): **ninguna política `to anon`** en tablas de clientes; el bucket
  `clientes` es **privado** y sus fotos solo se sirven por **URL firmada de 10 minutos** (`600` s).
- **La seguridad vive en la base**: toda regla de quién puede qué va como política, trigger o
  función en Postgres, con su prueba pgTAP; ocultar un botón no cuenta.
- Migraciones numeradas, **nunca editadas tras aplicarse**; RLS en la misma migración que la tabla.
- Toda escritura del panel pasa por `ejecutarAccion()` con **`etiquetas: []`** (clientes no toca el
  sitio público).
- **Sin dependencias nuevas.** Sin `service_role` en F6: todo con la sesión del usuario.
- Texto del permiso: versión **`v1-2026-10`**, en `src/lib/clientes/permiso.ts`; cambiarlo exige
  versión nueva (lo comprueba un hash en Vitest).
- Conservación: **`interval '2 years'`** sin cambios en datos, fotos ni permiso.
- Mapas: Leaflet con `import("leaflet")` dinámico y contenedor `isolate` (ver `selector-ubicacion.tsx`).
- Commits en español (Conventional Commits) **sin** `Co-Authored-By` ni `Claude-Session` (AGENTS.md).
- Regla de PR de F6 (encabezado del documento): T1 y T2 solas; T3+T4 y T5+T6 juntas; T7 sola.

## Review Focus

- **Restaurar un respaldo** con el permiso obligatorio: el volcado mete `clientes` antes que
  `consentimientos`; si la carga no corre en réplica, el trigger diferido la rompe. Se ensaya en T7.
- **Un celular escrito de muchas formas** («965 111 222», «+51 965111222», «965-111-222») tiene que
  ser el mismo para el aviso de repetido, la búsqueda y el enlace de WhatsApp. T1 (Vitest de
  `normalizarCelular`) y T4 (E2E del aviso con espacios).
- **Borrar los datos cuando falla Storage** después de que la base ya borró: los archivos no
  pueden quedar huérfanos sin que nadie se entere. T5: la acción borra por carpeta (idempotente) y,
  si falla, lo dice y deja reintentarlo.
- **El alta pulsada dos veces** (conexión lenta, doble toque): no deja dos clientes; el botón se
  bloquea mientras guarda. T4 (E2E con doble clic).
- **Ningún cliente con punto** (o todos sin él): la vista Mapa no se rompe y dice cuántos faltan. T3.

## Mapa de archivos

| Archivo                                                                | Tarea | Qué hace                                                           |
| ---------------------------------------------------------------------- | ----- | ------------------------------------------------------------------ |
| `supabase/migrations/0042_clientes_reglas.sql` (C) + prueba            | 1     | Alta con permiso, repartidor, fotos, zonas, `buscar_clientes`      |
| `supabase/tests/0013_clientes.test.sql` (M)                            | 1     | El repartidor ya no da altas                                       |
| `scripts/verificar-storage.sh` (M)                                     | 1     | El cliente de prueba nace con su permiso                           |
| `src/lib/clientes/contacto.ts` (C) + prueba                            | 1     | `normalizarCelular`, enlaces de llamar, WhatsApp y cómo llegar     |
| `src/lib/clientes/permiso.ts` (C) + prueba                             | 1     | Texto y versión del permiso                                        |
| `supabase/migrations/0043_clientes_datos_personales.sql` (C) + prueba  | 2     | `borrar_datos_cliente`, `supresiones`, conservación, exportaciones |
| `src/lib/auth/roles.ts` (M), `src/lib/panel/navegacion.ts` (M)         | 3     | Clientes en el menú; rutas solo de administración                  |
| `src/lib/clientes/datos.ts` (C)                                        | 3     | Lecturas: lista, ficha con fotos firmadas, zonas                   |
| `src/components/panel/mapa-clientes.tsx` (C)                           | 3     | Mapa con un marcador por cliente                                   |
| `src/components/panel/botones-contacto.tsx` (C)                        | 3     | Llamar · WhatsApp · Cómo llegar                                    |
| `src/app/(admin)/admin/clientes/page.tsx`, `[id]/page.tsx` (C)         | 3     | Lista y ficha                                                      |
| `src/lib/validaciones/cliente.ts` (C) + prueba                         | 4     | Esquemas del alta, la edición y la corrección                      |
| `src/lib/acciones/clientes.ts` (C)                                     | 4–6   | Todas las escrituras de clientes                                   |
| `src/components/panel/selector-ubicacion.tsx` (M)                      | 4     | Punto opcional y «Usar mi ubicación»                               |
| `src/components/panel/subida-imagen.tsx` (M)                           | 4     | Bucket privado `clientes`                                          |
| `src/components/panel/fotos-cliente.tsx` (C)                           | 4     | Hasta 3 fotos de la fachada                                        |
| `src/app/(admin)/admin/clientes/{nuevo,[id]/editar,[id]/corregir}` (C) | 4     | Alta, edición y corrección                                         |
| `src/app/(admin)/admin/clientes/zonas/**` (C)                          | 5     | Zonas                                                              |
| `src/app/(admin)/admin/clientes/revisar/page.tsx` (C)                  | 5     | Conservación                                                       |
| `src/app/(admin)/admin/page.tsx` (M)                                   | 5     | Aviso de conservación                                              |
| `src/lib/insumos/exportar-{excel,pdf}` (M)                             | 6     | Aceptan cualquier tabla, no solo un reporte de insumos             |
| `src/app/(admin)/admin/clientes/{excel,pdf}/route.ts` (C)              | 6     | Descargas con registro                                             |
| `src/lib/clientes/tabla.ts` (C) + prueba, `descargar.ts` (C)           | 6     | La lista a tabla exportable; acceso, registro y respuesta          |
| `src/lib/validaciones/zona.ts` (C) + prueba, `acciones/zonas.ts` (C)   | 5     | Zonas: esquema y escrituras                                        |
| `src/lib/acciones/orden.ts` (M)                                        | 5     | `zonas_reparto` se ordena con las flechas                          |
| `e2e/ayudas/clientes.ts` (C), `e2e/ayudas/base.ts` (M)                 | 3, 5  | Clientes de prueba; `sqlLocal` para envejecer filas                |
| `next.config.ts` (M)                                                   | 6     | Las fuentes del PDF viajan con la ruta de clientes                 |
| `scripts/restaurar-respaldo.sh` (M)                                    | 7     | Cuenta clientes, permisos y supresiones al restaurar               |
| `docs/clientes.md` (C)                                                 | 7     | Manual del negocio                                                 |

---

## Tarea 1 — Reglas de clientes en la base

**Rama:** `feat/f6-t1-reglas` · **Migración:** 0042 · **PR:** solo; al abrirlo, se para hasta el
`db push` y la fusión de Dan.

**Qué deja hecho:** un cliente y su permiso se guardan juntos o no se guarda nada (también por la
API); el repartidor solo corrige referencia y punto, añade o cambia fotos y no borra; las zonas son
de la administración y no se retiran con clientes activos; `buscar_clientes` encuentra por nombre
sin tildes, con errores de tecleo o por celular escrito de cualquier forma. Y la lógica pura de
contacto y del texto del permiso, con sus pruebas.

**Files:**

- Create: `supabase/migrations/0042_clientes_reglas.sql`, `supabase/tests/0042_clientes_reglas.test.sql`
- Modify: `supabase/tests/0013_clientes.test.sql` (el repartidor ya no da altas)
- Modify: `scripts/verificar-storage.sh` (el cliente de prueba nace con permiso)
- Create: `src/lib/clientes/contacto.ts` + `.test.ts`, `src/lib/clientes/permiso.ts` + `.test.ts`
- Modify: `src/tipos/database.types.ts` (regenerado)

**Interfaces:**

- Produces (SQL): `public.registrar_cliente(p_cliente jsonb, p_version_texto text) returns uuid`;
  `public.buscar_clientes(p_texto text default null, p_zona uuid default null, p_activos boolean
default true) returns table (id uuid, nombre_completo text, celular text, direccion text,
referencia text, zona_id uuid, zona text, latitud numeric, longitud numeric, activo boolean)`;
  triggers `clientes_exige_permiso` (diferido), `clientes_proteger`, `zonas_bloquear_retiro`.
- Produces (TS): `normalizarCelular(texto: string): string`, `celularParaLeer(celular: string):
string`, `enlaceLlamar(celular: string): string`, `enlaceWhatsAppCliente(celular: string): string |
null`, `enlaceComoLlegar(latitud: number | null, longitud: number | null): string | null` en
  `src/lib/clientes/contacto.ts`; `VERSION_PERMISO`, `PLANTILLA_PERMISO`,
  `textoDelPermiso(celularNegocio: string): string` en `src/lib/clientes/permiso.ts`.

> **Una trampa de las pruebas.** El trigger del permiso es **diferido**: se comprueba al terminar la
> transacción. Las pruebas pgTAP terminan con `rollback`, así que nunca lo verían. Para probarlo se
> fuerza con `set constraints clientes_exige_permiso immediate`, que dispara lo pendiente en ese
> momento. **No** se pone `immediate` antes de llamar a `registrar_cliente`: el trigger saltaría al
> terminar el `insert` del cliente, antes del del permiso, dentro de la misma función.

### Paso 1 — La lógica pura, primero la prueba

- [ ] Crear `src/lib/clientes/contacto.test.ts`:

```ts
import { describe, expect, it } from "vitest";

import {
  celularParaLeer,
  enlaceComoLlegar,
  enlaceLlamar,
  enlaceWhatsAppCliente,
  normalizarCelular,
} from "./contacto";

describe("normalizarCelular", () => {
  it("el mismo celular escrito de muchas formas es el mismo", () => {
    for (const escrito of [
      "965111222",
      "965 111 222",
      "965-111-222",
      "+51 965 111 222",
      "51965111222",
      "(51) 965111222",
    ]) {
      expect(normalizarCelular(escrito), escrito).toBe("965111222");
    }
  });

  it("un fijo con código de ciudad se deja como está", () => {
    expect(normalizarCelular("065 231 000")).toBe("065231000");
  });
});

describe("enlaces de contacto", () => {
  it("llamar lleva el prefijo de Perú en un celular", () => {
    expect(enlaceLlamar("965 111 222")).toBe("tel:+51965111222");
    expect(enlaceLlamar("065231000")).toBe("tel:065231000");
  });

  it("WhatsApp solo para un celular (9 dígitos que empiezan por 9)", () => {
    expect(enlaceWhatsAppCliente("+51 965 111 222")).toBe("https://wa.me/51965111222");
    expect(enlaceWhatsAppCliente("065231000")).toBeNull();
  });

  it("cómo llegar solo con punto en el mapa", () => {
    expect(enlaceComoLlegar(-3.7437, -73.2516)).toBe(
      "https://www.google.com/maps/dir/?api=1&destination=-3.7437,-73.2516",
    );
    expect(enlaceComoLlegar(null, -73.25)).toBeNull();
  });

  it("para leerlo en voz alta, de tres en tres", () => {
    expect(celularParaLeer("965111222")).toBe("965 111 222");
  });
});
```

- [ ] Crear `src/lib/clientes/permiso.test.ts`:

```ts
import { createHash } from "node:crypto";

import { describe, expect, it } from "vitest";

import { PLANTILLA_PERMISO, VERSION_PERMISO, textoDelPermiso } from "./permiso";

/**
 * La huella de cada versión del texto. Si alguien cambia el texto sin subir
 * `VERSION_PERMISO`, esta prueba falla: la base guarda la VERSIÓN que se leyó
 * a cada cliente, y una versión con dos textos distintos no prueba nada.
 * Para una versión nueva: se añade aquí su huella, sin tocar las anteriores.
 */
const HUELLAS: Record<string, string> = {
  "v1-2026-10": "PEGAR-AQUI-LA-HUELLA-DEL-PASO-3",
};

describe("texto del permiso", () => {
  it("la versión actual tiene su huella, y es la del texto", () => {
    const huella = createHash("sha256").update(PLANTILLA_PERMISO).digest("hex");
    expect(HUELLAS[VERSION_PERMISO]).toBe(huella);
  });

  it("dice qué se guarda, quién lo ve, cuánto tiempo y cómo pedir que se borre", () => {
    const texto = textoDelPermiso("947 874 820");
    for (const parte of [
      "nombre",
      "celular",
      "dirección",
      "ubicación",
      "tres fotos",
      "personal de la panadería",
      "dos años",
      "borremos",
      "947 874 820",
    ]) {
      expect(texto).toContain(parte);
    }
    expect(texto).not.toContain("{celular}");
  });
});
```

> La huella de `v1-2026-10` se fija en el paso 3, cuando el texto ya existe: se calcula y se pega.
> Es el único valor de la prueba que no se escribe a mano, porque es una función del texto.

- [ ] Ejecutar: `pnpm test -- src/lib/clientes/`
      **Esperado:** FALLAN las dos, «Cannot find module './contacto'» y «'./permiso'».

### Paso 2 — Implementar

- [ ] Crear `src/lib/clientes/contacto.ts`:

```ts
/**
 * El celular se guarda y se compara normalizado: solo dígitos, y sin el 51
 * cuando es un celular peruano escrito con prefijo. Así «965 111 222» y
 * «+51 965111222» son el mismo cliente para el aviso de repetido, la búsqueda
 * y el enlace de WhatsApp (Review Focus).
 */
export function normalizarCelular(texto: string): string {
  const digitos = texto.replace(/\D/g, "");
  return digitos.length === 11 && digitos.startsWith("51") ? digitos.slice(2) : digitos;
}

const esCelular = (n: string) => /^9\d{8}$/.test(n);

export function celularParaLeer(celular: string): string {
  const n = normalizarCelular(celular);
  return n.length === 9 ? `${n.slice(0, 3)} ${n.slice(3, 6)} ${n.slice(6)}` : n;
}

export function enlaceLlamar(celular: string): string {
  const n = normalizarCelular(celular);
  return esCelular(n) ? `tel:+51${n}` : `tel:${n}`;
}

/** Solo un celular tiene WhatsApp; un fijo no. */
export function enlaceWhatsAppCliente(celular: string): string | null {
  const n = normalizarCelular(celular);
  return esCelular(n) ? `https://wa.me/51${n}` : null;
}

/** Google Maps con la ruta hasta el punto. Sin punto, no hay a dónde llevar. */
export function enlaceComoLlegar(latitud: number | null, longitud: number | null): string | null {
  if (latitud === null || longitud === null) return null;
  return `https://www.google.com/maps/dir/?api=1&destination=${latitud},${longitud}`;
}
```

- [ ] Crear `src/lib/clientes/permiso.ts`:

```ts
/**
 * El texto que se le lee al cliente antes de registrarlo (decisión 5, Ley
 * N.° 29733). Vive en el código y no en la configuración: un texto legal
 * cambiado por error cambiaría lo que «aceptó» cada cliente. La base guarda
 * la VERSIÓN que se leyó (`consentimientos.texto_version`).
 *
 * Cambiar el texto = versión nueva + su huella en `permiso.test.ts`.
 */
export const VERSION_PERMISO = "v1-2026-10";

export const PLANTILLA_PERMISO =
  "Para llevarle sus pedidos, Panadería Pimpo's guardará su nombre, su celular, su dirección con una referencia, la ubicación de su casa y hasta tres fotos de la fachada. Solo los ve el personal de la panadería y no se comparten con nadie. Los guardamos mientras sea nuestro cliente; si pasan dos años sin que su ficha se use, los revisamos para borrarlos. Puede pedir en cualquier momento que los corrijamos o los borremos, llamando o escribiendo al {celular}. ¿Está de acuerdo?";

/** El número del negocio sale de la configuración (`numeroParaLeer(config.whatsapp)`). */
export function textoDelPermiso(celularNegocio: string): string {
  return PLANTILLA_PERMISO.replace("{celular}", celularNegocio);
}
```

### Paso 3 — Fijar la huella y ver pasar

- [ ] Calcular la huella del texto:

```bash
node -e "const {createHash}=require('node:crypto');const {readFileSync}=require('node:fs');const m=readFileSync('src/lib/clientes/permiso.ts','utf8').match(/PLANTILLA_PERMISO =\s*\"([^\"]+)\"/);console.log(createHash('sha256').update(m[1]).digest('hex'))"
```

- [ ] Sustituir `PEGAR-AQUI-LA-HUELLA-DEL-PASO-3` en `permiso.test.ts` por esa cadena de 64
      caracteres.
- [ ] Ejecutar: `pnpm test -- src/lib/clientes/`
      **Esperado:** PASAN las dos (7 pruebas).
- [ ] Comprobar que la huella muerde: cambiar una letra de `PLANTILLA_PERMISO`, ejecutar la prueba
      (**Esperado:** FALLA «la versión actual tiene su huella»), y deshacer el cambio.

### Paso 4 — La prueba de la base

- [ ] Crear `supabase/tests/0042_clientes_reglas.test.sql`:

```sql
-- Verifica las reglas de clientes (0042).
--
-- Lo que se defiende: que no entre un cliente sin su permiso, ni por la API;
-- que el repartidor solo corrija referencia y punto, y no borre fotos; que las
-- zonas sean de la administración y no se retiren con clientes; y que la
-- búsqueda encuentre por nombre sin tildes, con errores y por celular.
begin;
select plan(26);

insert into auth.users (id, email, created_at, updated_at) values
  ('22222222-2222-2222-2222-222222222222', 'admin@pimpos.test',   now(), now()),
  ('33333333-3333-3333-3333-333333333333', 'inge@pimpos.test',    now(), now()),
  ('44444444-4444-4444-4444-444444444444', 'reparto@pimpos.test', now(), now());
update public.perfiles set rol = 'administrador', activo = true where id = '22222222-2222-2222-2222-222222222222';
update public.perfiles set rol = 'ingeniero',     activo = true where id = '33333333-3333-3333-3333-333333333333';
update public.perfiles set rol = 'repartidor',    activo = true where id = '44444444-4444-4444-4444-444444444444';

-- Zonas propias: las de la semilla pueden tener clientes de ejemplo, y el
-- mensaje de «tiene N clientes activos» dejaría de ser exacto.
insert into public.zonas_reparto (id, nombre, orden) values
  ('eeee0000-0000-0000-0000-000000000001', 'Prueba 0042',       90),
  ('eeee0000-0000-0000-0000-000000000002', 'Prueba 0042 vacía', 91);
create temp table ref as
select 'eeee0000-0000-0000-0000-000000000001'::uuid as belen,
       'eeee0000-0000-0000-0000-000000000002'::uuid as punchana;
create temp table t (clave text primary key, valor uuid);
grant select on ref to authenticated;
grant all on t to authenticated;

select has_function('public', 'registrar_cliente', array['jsonb', 'text'], 'existe registrar_cliente');
select has_function('public', 'buscar_clientes', array['text', 'uuid', 'boolean'], 'existe buscar_clientes');

-- ---------------------------------------------------------------------------
-- Alta con permiso
-- ---------------------------------------------------------------------------
set local role authenticated;
set local request.jwt.claims = '{"sub": "33333333-3333-3333-3333-333333333333", "rol": "ingeniero"}';

insert into t select 'maria', public.registrar_cliente(
  jsonb_build_object('nombre_completo', 'María Núñez Rodríguez', 'celular', '965111222',
    'direccion', 'Calle Próspero 123', 'referencia', 'Frente a la bodega azul',
    'zona_id', (select belen from ref), 'latitud', -3.76, 'longitud', -73.25),
  'v1-2026-10');
select isnt((select valor from t where clave = 'maria'), null, 'el ingeniero registra un cliente');
select is(
  (select texto_version || ' / ' || (registrado_por = '33333333-3333-3333-3333-333333333333')::text
     from public.consentimientos where cliente_id = (select valor from t where clave = 'maria')),
  'v1-2026-10 / true', 'con su permiso: versión leída y quién lo registró');
select lives_ok($$ set constraints clientes_exige_permiso immediate $$,
  'al terminar, el cliente tiene su permiso');
set constraints clientes_exige_permiso deferred;

set local request.jwt.claims = '{"sub": "44444444-4444-4444-4444-444444444444", "rol": "repartidor"}';
select throws_ok($$
  select public.registrar_cliente(
    jsonb_build_object('nombre_completo', 'Otro', 'celular', '965000000', 'direccion', 'X',
      'referencia', 'Y', 'zona_id', (select belen from ref)), 'v1-2026-10')
$$, '42501', null, 'el repartidor no registra clientes (decisión 2)');

-- Por la API, sin permiso: el insert entra, pero al terminar la transacción no.
set local request.jwt.claims = '{"sub": "33333333-3333-3333-3333-333333333333", "rol": "ingeniero"}';
with x as (
  insert into public.clientes (nombre_completo, celular, direccion, referencia, zona_id)
  values ('Sin Permiso', '965000001', 'Calle 1', 'Ref', (select belen from ref)) returning id)
insert into t select 'sin_permiso', id from x;
select throws_ok($$ set constraints clientes_exige_permiso immediate $$,
  'P0001', 'Sin el permiso del cliente no se puede registrar. Léele el texto y marca «Se lo leí y aceptó».',
  'un cliente sin permiso no llega a guardarse');
set constraints clientes_exige_permiso deferred;
reset role;
delete from public.clientes where id = (select valor from t where clave = 'sin_permiso');

set local role authenticated;
set local request.jwt.claims = '{"sub": "44444444-4444-4444-4444-444444444444", "rol": "repartidor"}';
select throws_ok($$
  insert into public.consentimientos (cliente_id, registrado_por, texto_version)
  values ((select valor from t where clave = 'maria'), '44444444-4444-4444-4444-444444444444', 'v1-2026-10')
$$, '42501', null, 'ni anota permisos');

-- ---------------------------------------------------------------------------
-- Lo que corrige el repartidor
-- ---------------------------------------------------------------------------
select lives_ok($$
  update public.clientes set referencia = 'Portón verde', latitud = -3.7601, longitud = -73.2502
   where id = (select valor from t where clave = 'maria')
$$, 'el repartidor corrige la referencia y el punto');
select is((select referencia from public.clientes where id = (select valor from t where clave = 'maria')),
  'Portón verde', 'y queda corregido');
select throws_ok($$ update public.clientes set celular = '965999999' where id = (select valor from t where clave = 'maria') $$,
  '42501', 'Tu rol solo puede corregir la referencia y el punto en el mapa.', 'no cambia el celular');
select throws_ok($$ update public.clientes set nombre_completo = 'Otra' where id = (select valor from t where clave = 'maria') $$,
  '42501', null, 'ni el nombre');
select throws_ok($$ update public.clientes set zona_id = (select punchana from ref) where id = (select valor from t where clave = 'maria') $$,
  '42501', null, 'ni la zona');
select throws_ok($$ update public.clientes set activo = false where id = (select valor from t where clave = 'maria') $$,
  '42501', null, 'ni lo desactiva');

-- Fotos: añade, no borra.
select lives_ok($$
  insert into public.cliente_fotos (cliente_id, ruta, orden)
  values ((select valor from t where clave = 'maria'), (select valor from t where clave = 'maria')::text || '/a.webp', 1)
$$, 'el repartidor añade una foto');
delete from public.cliente_fotos where cliente_id = (select valor from t where clave = 'maria');
select is((select count(*)::int from public.cliente_fotos where cliente_id = (select valor from t where clave = 'maria')),
  1, 'pero no la borra (sin política, el borrado no toca nada)');

set local request.jwt.claims = '{"sub": "33333333-3333-3333-3333-333333333333", "rol": "ingeniero"}';
delete from public.cliente_fotos where cliente_id = (select valor from t where clave = 'maria');
select is((select count(*)::int from public.cliente_fotos where cliente_id = (select valor from t where clave = 'maria')),
  0, 'el ingeniero sí quita una foto');
select lives_ok($$ update public.clientes set activo = false where id = (select valor from t where clave = 'maria') $$,
  'y desactiva un cliente');
update public.clientes set activo = true where id = (select valor from t where clave = 'maria');

-- ---------------------------------------------------------------------------
-- Zonas
-- ---------------------------------------------------------------------------
update public.zonas_reparto set nombre = 'Cambiada' where id = (select belen from ref);
select is((select nombre from public.zonas_reparto where id = (select belen from ref)), 'Prueba 0042',
  'el ingeniero ya no edita zonas (decisión 10)');

set local request.jwt.claims = '{"sub": "22222222-2222-2222-2222-222222222222", "rol": "administrador"}';
select throws_ok($$ update public.zonas_reparto set activo = false where id = (select belen from ref) $$,
  'P0001', 'La zona Prueba 0042 tiene 1 cliente activo. Pásalos a otra zona antes de retirarla.',
  'una zona con clientes activos no se retira');
select lives_ok($$ update public.zonas_reparto set activo = false where id = (select punchana from ref) $$,
  'una zona sin clientes sí');

-- ---------------------------------------------------------------------------
-- Búsqueda
-- ---------------------------------------------------------------------------
set local request.jwt.claims = '{"sub": "44444444-4444-4444-4444-444444444444", "rol": "repartidor"}';
-- Se busca la fixture, no se cuenta la tabla: la semilla de ejemplo tiene clientes.
select ok(exists(select 1 from public.buscar_clientes('nunez') where id = (select valor from t where clave = 'maria')),
  'el repartidor busca «nunez» sin tildes');
select ok(exists(select 1 from public.buscar_clientes('Rodrigez') where id = (select valor from t where clave = 'maria')),
  'con el apellido mal escrito');
select ok(exists(select 1 from public.buscar_clientes('+51 965 111 222') where id = (select valor from t where clave = 'maria')),
  'y por el celular escrito con prefijo y espacios');
select is((select zona from public.buscar_clientes(null, (select belen from ref))), 'Prueba 0042',
  'filtra por zona y dice su nombre');
reset role;

-- ---------------------------------------------------------------------------
-- Nada anónimo
-- ---------------------------------------------------------------------------
select is(
  (select count(*)::int from pg_policies
    where schemaname = 'public' and tablename in ('clientes', 'cliente_fotos', 'consentimientos', 'zonas_reparto')
      and 'anon' = any(roles)),
  0, 'ninguna política de clientes es para anon');

select * from finish();
rollback;
```

- [ ] Ejecutar: `supabase test db`
      **Esperado:** FALLA `0042` («function public.registrar_cliente(jsonb, text) does not exist»).
      Si fallan también 0011, 0012 o 0034 por restos de E2E, `supabase db reset` antes (AGENTS.md).

### Paso 5 — La migración

- [ ] Crear `supabase/migrations/0042_clientes_reglas.sql`:

```sql
-- =============================================================================
-- 0042_clientes_reglas.sql
-- Reglas del módulo de clientes (F6, tarea 1). Decisiones de Dan del
-- 30/09/2026, doc 06.
--
--   1. Un cliente y su permiso se guardan juntos: `registrar_cliente`, y un
--      trigger DIFERIDO que rechaza al terminar la transacción todo cliente sin
--      permiso vigente (un insert directo por la API tampoco lo salta).
--   2. El repartidor solo corrige referencia y punto; añade o cambia fotos, no
--      las borra; no da altas ni anota permisos.
--   3. Zonas: solo la administración; una zona con clientes activos no se
--      retira.
--   4. `buscar_clientes`: nombre sin tildes y con errores, o celular escrito de
--      cualquier forma.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Alta con permiso
-- -----------------------------------------------------------------------------
create or replace function public.registrar_cliente(p_cliente jsonb, p_version_texto text)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_id uuid;
begin
  if coalesce(btrim(p_version_texto), '') = '' then
    raise exception 'Falta la versión del texto del permiso.' using errcode = 'P0001';
  end if;

  insert into public.clientes
    (nombre_completo, celular, direccion, referencia, zona_id, latitud, longitud, observacion)
  values (
    p_cliente->>'nombre_completo',
    p_cliente->>'celular',
    p_cliente->>'direccion',
    nullif(btrim(p_cliente->>'referencia'), ''),
    nullif(p_cliente->>'zona_id', '')::uuid,
    (p_cliente->>'latitud')::numeric,
    (p_cliente->>'longitud')::numeric,
    nullif(btrim(p_cliente->>'observacion'), '')
  )
  returning id into v_id;

  insert into public.consentimientos (cliente_id, modo, registrado_por, texto_version)
  values (v_id, 'verbal', auth.uid(), p_version_texto);

  return v_id;
end;
$$;

comment on function public.registrar_cliente(jsonb, text) is
  'Cliente y permiso en una transacción (decisión 5). security invoker: la RLS decide quién registra.';
revoke execute on function public.registrar_cliente(jsonb, text) from public, anon;
grant execute on function public.registrar_cliente(jsonb, text) to authenticated;

-- `security definer`: tiene que ver el permiso aunque la RLS de quien inserta
-- no lo dejara (hoy los cuatro roles leen consentimientos; mañana, quién sabe).
create or replace function app.exigir_permiso()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- Al terminar la transacción la fila puede ya no existir (se borró en la
  -- misma transacción) o ser de ejemplo: no hay nada que exigir.
  if not exists (select 1 from public.clientes c where c.id = new.id and not c.es_demo) then
    return null;
  end if;
  if not exists (
    select 1 from public.consentimientos k where k.cliente_id = new.id and k.revocado_en is null
  ) then
    raise exception 'Sin el permiso del cliente no se puede registrar. Léele el texto y marca «Se lo leí y aceptó».'
      using errcode = 'P0001';
  end if;
  return null;
end;
$$;
revoke execute on function app.exigir_permiso() from public, anon, authenticated;

create constraint trigger clientes_exige_permiso
  after insert on public.clientes
  deferrable initially deferred
  for each row execute function app.exigir_permiso();

-- -----------------------------------------------------------------------------
-- 2. Lo que puede el repartidor
-- -----------------------------------------------------------------------------
drop policy "reparto gestiona clientes" on public.clientes;
create policy "encargados registran clientes"
  on public.clientes for insert to authenticated
  with check ((select app.es_rol('superadmin', 'administrador', 'ingeniero')));
create policy "reparto actualiza clientes"
  on public.clientes for update to authenticated
  using      ((select app.es_rol('superadmin', 'administrador', 'ingeniero', 'repartidor')))
  with check ((select app.es_rol('superadmin', 'administrador', 'ingeniero', 'repartidor')));
-- Sin política de delete: un cliente se desactiva, y a pedido se borran sus
-- datos con `borrar_datos_cliente` (0043).

-- La RLS decide qué FILAS toca cada rol; qué COLUMNAS, un trigger (misma
-- lección que 0029): el repartidor solo corrige lo que descubre en la puerta.
create or replace function app.proteger_clientes()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if (select app.es_rol('repartidor')) and (
       new.nombre_completo is distinct from old.nombre_completo
    or new.celular         is distinct from old.celular
    or new.direccion       is distinct from old.direccion
    or new.zona_id         is distinct from old.zona_id
    or new.observacion     is distinct from old.observacion
    or new.activo          is distinct from old.activo
    or new.deleted_at      is distinct from old.deleted_at
    or new.es_demo         is distinct from old.es_demo
  ) then
    raise exception 'Tu rol solo puede corregir la referencia y el punto en el mapa.'
      using errcode = '42501';
  end if;
  return new;
end;
$$;

create trigger clientes_proteger
  before update on public.clientes
  for each row execute function app.proteger_clientes();

drop policy "reparto gestiona fotos de clientes" on public.cliente_fotos;
create policy "reparto añade fotos de clientes"
  on public.cliente_fotos for insert to authenticated
  with check ((select app.es_rol('superadmin', 'administrador', 'ingeniero', 'repartidor')));
create policy "reparto cambia fotos de clientes"
  on public.cliente_fotos for update to authenticated
  using      ((select app.es_rol('superadmin', 'administrador', 'ingeniero', 'repartidor')))
  with check ((select app.es_rol('superadmin', 'administrador', 'ingeniero', 'repartidor')));
create policy "encargados quitan fotos de clientes"
  on public.cliente_fotos for delete to authenticated
  using ((select app.es_rol('superadmin', 'administrador', 'ingeniero')));

-- El archivo también: 0014 no tenía política de borrado en el bucket privado.
create policy "encargados borran fotos de clientes"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'clientes'
    and (select app.es_rol('superadmin', 'administrador', 'ingeniero'))
    and app.carpeta_es_cliente_visible(name)
  );

drop policy "reparto registra consentimientos" on public.consentimientos;
create policy "encargados registran consentimientos"
  on public.consentimientos for insert to authenticated
  with check (
    (select app.es_rol('superadmin', 'administrador', 'ingeniero'))
    and registrado_por = (select auth.uid())
  );

-- -----------------------------------------------------------------------------
-- 3. Zonas
-- -----------------------------------------------------------------------------
drop policy "administracion gestiona zonas" on public.zonas_reparto;
create policy "administracion gestiona zonas"
  on public.zonas_reparto for all to authenticated
  using      ((select app.es_rol('superadmin', 'administrador')))
  with check ((select app.es_rol('superadmin', 'administrador')));

create or replace function app.bloquear_retiro_de_zona()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_n integer;
begin
  if (old.activo and not new.activo) or (old.deleted_at is null and new.deleted_at is not null) then
    select count(*) into v_n
      from public.clientes c
     where c.zona_id = new.id and c.activo and c.deleted_at is null;
    if v_n > 0 then
      raise exception 'La zona % tiene % %. Pásalos a otra zona antes de retirarla.',
        new.nombre, v_n, case when v_n = 1 then 'cliente activo' else 'clientes activos' end
        using errcode = 'P0001';
    end if;
  end if;
  return new;
end;
$$;

create trigger zonas_bloquear_retiro
  before update on public.zonas_reparto
  for each row execute function app.bloquear_retiro_de_zona();

-- -----------------------------------------------------------------------------
-- 4. Búsqueda
--
-- El mismo criterio que probó 0013: `sin_tildes(lower(...))` y la similitud de
-- trigramas (0.3, la del operador %). Por celular, solo dígitos y sin el 51
-- de un celular escrito con prefijo, igual que `normalizarCelular` en TS.
-- -----------------------------------------------------------------------------
create or replace function public.buscar_clientes(
  p_texto   text    default null,
  p_zona    uuid    default null,
  p_activos boolean default true
)
returns table (
  id              uuid,
  nombre_completo text,
  celular         text,
  direccion       text,
  referencia      text,
  zona_id         uuid,
  zona            text,
  latitud         numeric,
  longitud        numeric,
  activo          boolean
)
language sql
stable
security invoker
set search_path = ''
as $$
  with q as (
    select app.sin_tildes(lower(btrim(coalesce(p_texto, '')))) as t,
           regexp_replace(coalesce(p_texto, ''), '\D', '', 'g') as d
  ), q2 as (
    select t, case when length(d) = 11 and d like '51%' then substr(d, 3) else d end as d from q
  )
  select c.id, c.nombre_completo, c.celular, c.direccion, c.referencia, c.zona_id, z.nombre,
         c.latitud, c.longitud, c.activo
    from public.clientes c
    left join public.zonas_reparto z on z.id = c.zona_id
    cross join q2
   where c.deleted_at is null
     and c.activo = p_activos
     and (p_zona is null or c.zona_id = p_zona)
     and (
          q2.t = ''
       or app.sin_tildes(lower(c.nombre_completo)) like '%' || q2.t || '%'
       or extensions.similarity(app.sin_tildes(lower(c.nombre_completo)), q2.t) >= 0.3
       or (length(q2.d) >= 3 and regexp_replace(c.celular, '\D', '', 'g') like '%' || q2.d || '%')
     )
   order by extensions.similarity(app.sin_tildes(lower(c.nombre_completo)), q2.t) desc,
            c.nombre_completo
   limit 200;
$$;

comment on function public.buscar_clientes(text, uuid, boolean) is
  'Búsqueda de la ficha 8.6: nombre sin tildes y con errores, o celular. security invoker.';
revoke execute on function public.buscar_clientes(text, uuid, boolean) from public, anon;
grant execute on function public.buscar_clientes(text, uuid, boolean) to authenticated;
```

- [ ] Ejecutar: `supabase db reset && supabase test db`
      **Esperado:** todo en verde salvo `0013` (su prueba «y puede registrar uno nuevo en la calle»
      afirma lo que la 0042 prohíbe). Después, `bash supabase/seeds/imagenes/subir-imagenes.sh`.

### Paso 6 — La prueba de 0013 dice lo nuevo

- [ ] En `supabase/tests/0013_clientes.test.sql`, sustituir el bloque que empieza en
      `select lives_ok(` con `'y puede registrar uno nuevo en la calle'` y el siguiente
      (`'y registrar su consentimiento en el momento'`) por:

```sql
select throws_ok(
  $$ insert into public.clientes (nombre_completo, celular, direccion)
     values ('Cliente del reparto', '965999888', 'Calle Nueva 1') $$,
  '42501', null,
  'pero ya no registra uno nuevo: desde 0042 las altas son de los encargados (decisión 2)');
select pass('el permiso lo anotan los encargados (0042): lo prueba 0042_clientes_reglas');
```

> Se mantiene el número de pruebas (`plan(34)`): dos aserciones salen y dos entran.

- [ ] Ejecutar: `supabase test db`
      **Esperado:** `Result: PASS`.

### Paso 7 — El guion de Storage

- [ ] En `scripts/verificar-storage.sh`, sustituir la creación de `CLIENTE` por una que meta el
      permiso en la misma sentencia (con 0042, un cliente sin permiso no llega a guardarse):

```bash
# Desde 0042 un cliente sin permiso no llega a guardarse: cliente y permiso van
# en la MISMA sentencia (el trigger diferido se comprueba al terminarla).
CLIENTE=$(sql "with c as (
                 insert into public.clientes (nombre_completo, celular, direccion)
                 values ('Cliente de prueba storage','965000111','Calle X')
                 returning id)
               , k as (
                 insert into public.consentimientos (cliente_id, registrado_por, texto_version)
                 select c.id, (select id from auth.users where email like 'storage-%@pimpos.test' limit 1), 'v1-2026-10'
                   from c)
               select id from c;" | head -1 | tr -d '[:space:]')
```

- [ ] Ejecutar: `bash scripts/verificar-storage.sh`
      **Esperado:** `RESULTADO: las politicas de Storage se comportan como deben.`

> Si el guion crea sus usuarios **después** del cliente, mover este bloque detrás de la creación de
> usuarios: `registrado_por` necesita un usuario que exista.

### Paso 8 — Tipos y cierre

- [ ] `pnpm supabase:tipos` y `pnpm typecheck && pnpm lint && pnpm test`
      **Esperado:** sin errores; Vitest con las 7 pruebas nuevas.
- [ ] Commit:

```bash
git add supabase/migrations/0042_clientes_reglas.sql supabase/tests/0042_clientes_reglas.test.sql \
        supabase/tests/0013_clientes.test.sql scripts/verificar-storage.sh src/lib/clientes \
        src/tipos/database.types.ts
git commit -m "feat(clientes): reglas de clientes en la base: permiso obligatorio y lo del repartidor"
```

- [ ] Revisión de la rama con un subagente; lo Importante, arreglado con prueba vista fallar.
- [ ] PR (sin atribución) y **parar**: Dan hace `supabase db push` desde `PIMPOS_SYSTEM` y fusiona.

---

## Tarea 2 — Borrado a pedido, conservación y registro de exportaciones

**Rama:** `feat/f6-t2-datos-personales` · **Migración:** 0043 · **PR:** solo; se para hasta el
`db push` y la fusión de Dan.

**Qué deja hecho:** `borrar_datos_cliente` borra de verdad los datos personales de un cliente —
también de la auditoría, tachando su contenido sin borrar filas— y deja la constancia en
`supresiones`; `clientes_para_revisar` lista a los activos sin cambios en 2 años; y
`exportaciones_clientes` registra cada descarga. Solo la administración.

**Files:**

- Create: `supabase/migrations/0043_clientes_datos_personales.sql`,
  `supabase/tests/0043_clientes_datos_personales.test.sql`
- Modify: `src/tipos/database.types.ts` (regenerado)

**Interfaces:**

- Consumes (T1): `public.registrar_cliente(jsonb, text)`, el trigger `clientes_proteger`.
- Produces: `public.permiso_de_cliente(p_cliente uuid) returns table (texto_version text,
otorgado_en timestamptz, registrado_por text)`;
  `public.borrar_datos_cliente(p_id uuid, p_motivo text) returns table (ruta text)` — las
  rutas de las fotos que había, para que la acción del servidor borre los archivos;
  `public.supresiones (id, cliente_id unique, motivo, borrado_por, borrado_en)`;
  `public.clientes_para_revisar (id, nombre_completo, zona, ultima_actividad)`;
  `public.exportaciones_clientes (id, exportado_por, exportado_en, formato 'xlsx'|'pdf', cantidad,
filtro jsonb)`.

> **La única excepción a «la auditoría no se toca»** (decisión 3): `borrar_datos_cliente` no borra
> filas de `app.auditoria`, sustituye su `datos_antes`/`datos_despues` por `{"borrado": true}` en
> todas las del cliente, sus fotos y sus permisos. Quién, cuándo y qué operación siguen ahí.

### Paso 1 — La prueba de la base

- [ ] Crear `supabase/tests/0043_clientes_datos_personales.test.sql`:

```sql
-- Verifica el borrado a pedido, la conservación y el registro de exportaciones (0043).
--
-- Lo que se defiende: que solo la administración borre los datos de un
-- cliente; que después no quede NI UN dato personal suyo, tampoco en la
-- auditoría; que quede la constancia; que la conservación avise en el borde
-- de los 2 años; y que cada exportación quede registrada y no se pueda tocar.
begin;
select plan(27);

insert into auth.users (id, email, created_at, updated_at) values
  ('22222222-2222-2222-2222-222222222222', 'admin@pimpos.test',   now(), now()),
  ('33333333-3333-3333-3333-333333333333', 'inge@pimpos.test',    now(), now()),
  ('44444444-4444-4444-4444-444444444444', 'reparto@pimpos.test', now(), now());
update public.perfiles set rol = 'administrador', activo = true where id = '22222222-2222-2222-2222-222222222222';
update public.perfiles set rol = 'ingeniero',     activo = true, nombre_completo = 'Marcos Prueba' where id = '33333333-3333-3333-3333-333333333333';
update public.perfiles set rol = 'repartidor',    activo = true where id = '44444444-4444-4444-4444-444444444444';

create temp table t (clave text primary key, valor uuid);
grant all on t to authenticated;

select has_function('public', 'borrar_datos_cliente', array['uuid', 'text'], 'existe borrar_datos_cliente');
select has_table('public', 'supresiones', 'existe supresiones');
select has_table('public', 'exportaciones_clientes', 'existe exportaciones_clientes');

-- Un cliente con foto, y con un cambio que deja su dirección en la auditoría.
set local role authenticated;
set local request.jwt.claims = '{"sub": "33333333-3333-3333-3333-333333333333", "rol": "ingeniero"}';
insert into t select 'rosa', public.registrar_cliente(
  jsonb_build_object('nombre_completo', 'Rosa Quispe Tapullima', 'celular', '965444555',
    'direccion', 'Jirón Putumayo 777', 'referencia', 'Casa amarilla',
    'zona_id', (select id from public.zonas_reparto where nombre = 'Belén'),
    'latitud', -3.75, 'longitud', -73.24),
  'v1-2026-10');
insert into public.cliente_fotos (cliente_id, ruta, orden)
values ((select valor from t where clave = 'rosa'), (select valor from t where clave = 'rosa')::text || '/fachada.webp', 1);
update public.clientes set direccion = 'Jirón Putumayo 778' where id = (select valor from t where clave = 'rosa');

-- ---------------------------------------------------------------------------
-- Solo la administración
-- ---------------------------------------------------------------------------
select throws_ok($$ select * from public.borrar_datos_cliente((select valor from t where clave = 'rosa'), 'Lo pidió') $$,
  '42501', 'Solo la administración puede borrar los datos de un cliente.', 'el ingeniero no borra datos');
set local request.jwt.claims = '{"sub": "44444444-4444-4444-4444-444444444444", "rol": "repartidor"}';
select throws_ok($$ select * from public.borrar_datos_cliente((select valor from t where clave = 'rosa'), 'Lo pidió') $$,
  '42501', null, 'el repartidor tampoco');

set local request.jwt.claims = '{"sub": "22222222-2222-2222-2222-222222222222", "rol": "administrador"}';
select throws_ok($$ select * from public.borrar_datos_cliente((select valor from t where clave = 'rosa'), '  ') $$,
  'P0001', 'Escribe por qué se borran, por ejemplo «Lo pidió por WhatsApp el 3/10».', 'sin motivo, no');
select throws_ok($$ select * from public.borrar_datos_cliente('00000000-0000-0000-0000-000000000000', 'Lo pidió') $$,
  'P0002', 'No se encontró el cliente. Recarga la página.', 'un cliente que no existe lo dice');

-- ---------------------------------------------------------------------------
-- Borrar
-- ---------------------------------------------------------------------------
select is(
  (select array_agg(ruta) from public.borrar_datos_cliente((select valor from t where clave = 'rosa'), 'Lo pidió por WhatsApp')),
  array[(select valor from t where clave = 'rosa')::text || '/fachada.webp'],
  'devuelve las rutas de sus fotos, para borrar los archivos');
select is(
  (select nombre_completo || ' | ' || celular || ' | ' || direccion || ' | ' || coalesce(referencia, '-')
          || ' | ' || coalesce(latitud::text, '-') || ' | ' || activo::text
     from public.clientes where id = (select valor from t where clave = 'rosa')),
  'Datos borrados a pedido del cliente | 000000 | Datos borrados | - | - | false',
  'la ficha queda sin datos personales y desactivada');
select is((select count(*)::int from public.cliente_fotos where cliente_id = (select valor from t where clave = 'rosa')),
  0, 'sin filas de fotos');
select is((select count(*)::int from public.consentimientos
            where cliente_id = (select valor from t where clave = 'rosa') and revocado_en is null),
  0, 'con el permiso revocado');
reset role;

select is(
  (select count(*)::int from app.auditoria
    where coalesce(datos_antes::text, '') || coalesce(datos_despues::text, '')
          ~* '(Rosa Quispe|965444555|Putumayo|Casa amarilla|fachada\.webp)'),
  0, 'y NI UN dato suyo en la auditoría: ni nombre, ni celular, ni dirección, ni referencia, ni foto');
select cmp_ok(
  (select count(*)::int from app.auditoria
    where registro_id = (select valor from t where clave = 'rosa') and datos_despues = '{"borrado": true}'::jsonb),
  '>', 0, 'la auditoría conserva quién y cuándo, con el contenido tachado');
select is(
  (select motivo || ' | ' || (borrado_por = '22222222-2222-2222-2222-222222222222')::text from public.supresiones
    where cliente_id = (select valor from t where clave = 'rosa')),
  'Lo pidió por WhatsApp | true', 'queda la constancia: motivo y quién');

set local role authenticated;
set local request.jwt.claims = '{"sub": "22222222-2222-2222-2222-222222222222", "rol": "administrador"}';
select throws_ok($$ select * from public.borrar_datos_cliente((select valor from t where clave = 'rosa'), 'Otra vez') $$,
  'P0001', 'Los datos de este cliente ya se borraron.', 'no se borra dos veces');
select is((select count(*)::int from public.supresiones where cliente_id = (select valor from t where clave = 'rosa')),
  1, 'la administración lee las constancias');
set local request.jwt.claims = '{"sub": "33333333-3333-3333-3333-333333333333", "rol": "ingeniero"}';
select is((select count(*)::int from public.supresiones), 0, 'el ingeniero no');
select throws_ok($$ insert into public.supresiones (cliente_id, motivo, borrado_por)
  values ((select valor from t where clave = 'rosa'), 'Falsa', '33333333-3333-3333-3333-333333333333') $$,
  '42501', null, 'y nadie escribe una constancia a mano');
reset role;

-- ---------------------------------------------------------------------------
-- Conservación: el borde de los 2 años
-- ---------------------------------------------------------------------------
set local role authenticated;
set local request.jwt.claims = '{"sub": "33333333-3333-3333-3333-333333333333", "rol": "ingeniero"}';
insert into t select 'viejo', public.registrar_cliente(jsonb_build_object('nombre_completo', 'Cliente Viejo',
  'celular', '965000010', 'direccion', 'Calle 1', 'referencia', 'R',
  'zona_id', (select id from public.zonas_reparto where nombre = 'Belén')), 'v1-2026-10');
insert into t select 'casi', public.registrar_cliente(jsonb_build_object('nombre_completo', 'Cliente Casi',
  'celular', '965000011', 'direccion', 'Calle 2', 'referencia', 'R',
  'zona_id', (select id from public.zonas_reparto where nombre = 'Belén')), 'v1-2026-10');
reset role;
-- Se envejecen a mano: el trigger de updated_at pondría now().
alter table public.clientes disable trigger clientes_set_updated_at;
update public.clientes set updated_at = now() - interval '2 years 1 day' where id = (select valor from t where clave = 'viejo');
update public.clientes set updated_at = now() - interval '2 years' + interval '1 day' where id = (select valor from t where clave = 'casi');
alter table public.clientes enable trigger clientes_set_updated_at;
update public.consentimientos set created_at = now() - interval '3 years'
 where cliente_id in (select valor from t where clave in ('viejo', 'casi'));

set local role authenticated;
set local request.jwt.claims = '{"sub": "22222222-2222-2222-2222-222222222222", "rol": "administrador"}';
select ok(exists(select 1 from public.clientes_para_revisar where id = (select valor from t where clave = 'viejo')),
  'con 2 años y un día sin cambios, aparece para revisar');
select ok(not exists(select 1 from public.clientes_para_revisar where id = (select valor from t where clave = 'casi')),
  'con un día menos, todavía no');
update public.clientes set activo = true where id = (select valor from t where clave = 'viejo');
select ok(not exists(select 1 from public.clientes_para_revisar where id = (select valor from t where clave = 'viejo')),
  '«Sigue siendo cliente» renueva la fecha y sale de la lista');
set local request.jwt.claims = '{"sub": "33333333-3333-3333-3333-333333333333", "rol": "ingeniero"}';
select is((select count(*)::int from public.clientes_para_revisar), 0, 'la lista es solo de la administración');

select is(
  (select texto_version || ' | ' || registrado_por from public.permiso_de_cliente((select valor from t where clave = 'casi'))),
  'v1-2026-10 | Marcos Prueba',
  'la ficha dice qué versión se leyó y quién anotó el permiso');

-- ---------------------------------------------------------------------------
-- Exportaciones
-- ---------------------------------------------------------------------------
set local request.jwt.claims = '{"sub": "22222222-2222-2222-2222-222222222222", "rol": "administrador"}';
select lives_ok($$ insert into public.exportaciones_clientes (formato, cantidad, filtro)
  values ('xlsx', 12, '{"zona": "Belén"}') $$, 'la administración registra una exportación');
select is((select exportado_por from public.exportaciones_clientes where cantidad = 12),
  '22222222-2222-2222-2222-222222222222'::uuid, 'a su nombre, sin escribirlo');
select throws_ok($$ update public.exportaciones_clientes set cantidad = 1 $$, '42501', null,
  'y nadie la corrige después');
set local request.jwt.claims = '{"sub": "33333333-3333-3333-3333-333333333333", "rol": "ingeniero"}';
select throws_ok($$ insert into public.exportaciones_clientes (formato, cantidad) values ('pdf', 3) $$,
  '42501', null, 'el ingeniero no exporta');
reset role;

select * from finish();
rollback;
```

- [ ] Ejecutar: `supabase test db`
      **Esperado:** FALLA `0043` («function public.borrar_datos_cliente(uuid, text) does not exist»).

### Paso 2 — La migración

- [ ] Crear `supabase/migrations/0043_clientes_datos_personales.sql`:

```sql
-- =============================================================================
-- 0043_clientes_datos_personales.sql
-- Borrado a pedido, conservación y registro de exportaciones (F6, tarea 2).
-- Decisiones 3, 4 y 6 de Dan (30/09/2026), doc 06. Ley N.° 29733.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- La constancia de cada borrado. Sin datos personales: solo quién, cuándo y
-- por qué. La escribe `borrar_datos_cliente`, nunca una persona a mano.
-- -----------------------------------------------------------------------------
create table public.supresiones (
  id          uuid primary key default gen_random_uuid(),
  cliente_id  uuid not null unique references public.clientes(id) on delete restrict,
  motivo      text not null check (length(btrim(motivo)) >= 3),
  borrado_por uuid not null references auth.users(id) on delete restrict,
  borrado_en  timestamptz not null default now()
);

comment on table public.supresiones is
  'Constancia de que se borraron los datos de un cliente a su pedido (Ley 29733). Sin datos personales.';

alter table public.supresiones enable row level security;
alter table public.supresiones force row level security;
create policy "administracion lee supresiones"
  on public.supresiones for select to authenticated
  using ((select app.es_rol('superadmin', 'administrador')));
revoke insert, update, delete on public.supresiones from anon, authenticated;

-- -----------------------------------------------------------------------------
-- Borrar los datos de un cliente
-- -----------------------------------------------------------------------------
create or replace function public.borrar_datos_cliente(p_id uuid, p_motivo text)
returns table (ruta text)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_rutas text[];
begin
  if not (select app.es_rol('superadmin', 'administrador')) then
    raise exception 'Solo la administración puede borrar los datos de un cliente.' using errcode = '42501';
  end if;
  if coalesce(length(btrim(p_motivo)), 0) < 3 then
    raise exception 'Escribe por qué se borran, por ejemplo «Lo pidió por WhatsApp el 3/10».'
      using errcode = 'P0001';
  end if;

  perform 1 from public.clientes c where c.id = p_id for update;
  if not found then
    raise exception 'No se encontró el cliente. Recarga la página.' using errcode = 'P0002';
  end if;
  if exists (select 1 from public.supresiones s where s.cliente_id = p_id) then
    raise exception 'Los datos de este cliente ya se borraron.' using errcode = 'P0001';
  end if;

  select coalesce(array_agg(f.ruta order by f.orden), '{}') into v_rutas
    from public.cliente_fotos f where f.cliente_id = p_id;

  delete from public.cliente_fotos f where f.cliente_id = p_id;

  update public.consentimientos k
     set revocado_en = now(), revocado_por = auth.uid()
   where k.cliente_id = p_id and k.revocado_en is null;

  update public.clientes c
     set nombre_completo = 'Datos borrados a pedido del cliente',
         celular         = '000000',
         direccion       = 'Datos borrados',
         referencia      = null,
         observacion     = null,
         latitud         = null,
         longitud        = null,
         activo          = false
   where c.id = p_id;

  -- La única excepción a «la auditoría no se toca» (decisión 3): se tacha el
  -- CONTENIDO de todo lo que dejó este cliente —la ficha, sus fotos, también
  -- las ya quitadas, y sus permisos—, incluidas las filas que acaban de
  -- escribir los cambios de arriba. Quién, cuándo y qué operación se quedan.
  update app.auditoria a
     set datos_antes   = case when a.datos_antes   is null then null else '{"borrado": true}'::jsonb end,
         datos_despues = case when a.datos_despues is null then null else '{"borrado": true}'::jsonb end
   where (a.tabla = 'public.clientes' and a.registro_id = p_id)
      or (a.tabla in ('public.cliente_fotos', 'public.consentimientos')
          and p_id::text in (a.datos_antes ->> 'cliente_id', a.datos_despues ->> 'cliente_id'));

  insert into public.supresiones (cliente_id, motivo, borrado_por)
  values (p_id, btrim(p_motivo), auth.uid());

  return query select unnest(v_rutas);
end;
$$;

comment on function public.borrar_datos_cliente(uuid, text) is
  'Borra los datos personales de un cliente a su pedido, también de la auditoría (tachando el contenido), y deja la constancia. Devuelve las rutas de sus fotos para borrar los archivos.';
revoke execute on function public.borrar_datos_cliente(uuid, text) from public, anon;
grant execute on function public.borrar_datos_cliente(uuid, text) to authenticated;

-- -----------------------------------------------------------------------------
-- Conservación (decisión 4): nada se borra solo; la administración revisa.
-- «Actividad» es el último cambio en la ficha, sus fotos o su permiso.
-- -----------------------------------------------------------------------------
create view public.clientes_para_revisar
with (security_invoker = true) as
select c.id,
       c.nombre_completo,
       z.nombre as zona,
       x.ultima_actividad
  from public.clientes c
  left join public.zonas_reparto z on z.id = c.zona_id
  cross join lateral (
    select greatest(
      c.updated_at,
      (select max(f.updated_at) from public.cliente_fotos f where f.cliente_id = c.id),
      (select max(k.created_at) from public.consentimientos k where k.cliente_id = c.id)
    ) as ultima_actividad
  ) x
 where c.activo
   and c.deleted_at is null
   and not c.es_demo
   and not exists (select 1 from public.supresiones s where s.cliente_id = c.id)
   and x.ultima_actividad < now() - interval '2 years'
   and (select app.es_rol('superadmin', 'administrador'));

comment on view public.clientes_para_revisar is
  'Clientes activos sin cambios en 2 años (decisión 4). Solo administración. security_invoker.';
grant select on public.clientes_para_revisar to authenticated;

-- -----------------------------------------------------------------------------
-- El permiso vigente de un cliente, con el nombre de quien lo anotó, para la
-- ficha. `app.nombre_de_persona` (0037) solo da el nombre a los roles que ya
-- lo pueden ver; al repartidor le llega «otra persona».
-- -----------------------------------------------------------------------------
create or replace function public.permiso_de_cliente(p_cliente uuid)
returns table (texto_version text, otorgado_en timestamptz, registrado_por text)
language sql
stable
security invoker
set search_path = ''
as $$
  select k.texto_version,
         k.otorgado_en,
         coalesce(app.nombre_de_persona(k.registrado_por), 'otra persona')
    from public.consentimientos k
   where k.cliente_id = p_cliente and k.revocado_en is null
   order by k.otorgado_en desc
   limit 1;
$$;
revoke execute on function public.permiso_de_cliente(uuid) from public, anon;
grant execute on function public.permiso_de_cliente(uuid) to authenticated;

-- -----------------------------------------------------------------------------
-- Registro de exportaciones (decisión 6). Nadie lo corrige ni lo borra.
-- -----------------------------------------------------------------------------
create table public.exportaciones_clientes (
  id            uuid primary key default gen_random_uuid(),
  exportado_por uuid not null default auth.uid() references auth.users(id) on delete restrict,
  exportado_en  timestamptz not null default now(),
  formato       text not null check (formato in ('xlsx', 'pdf')),
  cantidad      integer not null check (cantidad >= 0),
  filtro        jsonb not null default '{}'::jsonb
);

comment on table public.exportaciones_clientes is
  'Cada descarga de la lista de clientes: quién, cuándo, cuántos, filtro y formato (decisión 6).';

alter table public.exportaciones_clientes enable row level security;
alter table public.exportaciones_clientes force row level security;
create policy "administracion registra exportaciones"
  on public.exportaciones_clientes for insert to authenticated
  with check (
    (select app.es_rol('superadmin', 'administrador'))
    and exportado_por = (select auth.uid())
  );
create policy "administracion lee exportaciones"
  on public.exportaciones_clientes for select to authenticated
  using ((select app.es_rol('superadmin', 'administrador')));
revoke update, delete on public.exportaciones_clientes from anon, authenticated;
```

- [ ] Ejecutar: `supabase db reset && supabase test db`
      **Esperado:** `Result: PASS`, `0043` incluida. Después, `subir-imagenes.sh`.

> Una cuenta que ya exportó no se puede eliminar (`on delete restrict`), igual que una con
> movimientos de insumos: se desactiva. Lo dirá `docs/clientes.md` (T7).

### Paso 3 — Tipos y cierre

- [ ] `pnpm supabase:tipos` y `pnpm typecheck && pnpm lint && pnpm test`
      **Esperado:** sin errores.
- [ ] Commit:

```bash
git add supabase/migrations/0043_clientes_datos_personales.sql \
        supabase/tests/0043_clientes_datos_personales.test.sql src/tipos/database.types.ts
git commit -m "feat(clientes): borrar datos a pedido, conservación y registro de exportaciones"
```

- [ ] Revisión de la rama con un subagente; lo Importante, arreglado con prueba vista fallar.
- [ ] PR (sin atribución) y **parar**: `db push` de la 0043 y fusión de Dan.

---

## Tarea 3 — Consultar: lista, mapa y ficha

**Rama:** `feat/f6-t3-t4-clientes` (la T4 sigue en la misma rama) · **Migración:** no · **PR:**
junto con la T4 (regla de F6).

**Qué deja hecho:** Clientes en el menú de los cuatro roles; la lista con buscador en vivo, filtro
por zona y activos/desactivados, vista Lista y vista Mapa; la ficha con datos, fotos por URL
firmada, mapa pequeño y el permiso; y en cada cliente **Llamar**, **WhatsApp** y **Cómo llegar**.

**Files:**

- Modify: `src/lib/auth/roles.ts` + `.test.ts`, `src/lib/panel/navegacion.ts` + `.test.ts`,
  `src/components/panel/barra-lateral.tsx` (icono), `src/components/panel/lista-adaptable.tsx`
  (`etiquetaEditar`), `src/app/(admin)/admin/page.tsx` (texto del repartidor)
- Create: `src/lib/clientes/datos.ts`, `src/components/panel/botones-contacto.tsx`,
  `src/components/panel/mapa-clientes.tsx`
- Create: `src/app/(admin)/admin/clientes/page.tsx`, `src/app/(admin)/admin/clientes/[id]/page.tsx`
- Create: `e2e/ayudas/clientes.ts`, `e2e/panel-clientes.spec.ts`
- Modify: `e2e/autenticacion.spec.ts` (el repartidor ya tiene sección), `e2e/panel-accesibilidad.spec.ts`
  (`/admin/clientes`)

**Interfaces:**

- Consumes (T1, T2): `public.buscar_clientes`, `public.permiso_de_cliente`, `normalizarCelular`,
  `celularParaLeer`, `enlaceLlamar`, `enlaceWhatsAppCliente`, `enlaceComoLlegar`.
- Produces: en `src/lib/clientes/datos.ts` (`server-only`):
  `type ClienteDeLista = { id: string; nombre_completo: string; celular: string; direccion: string;
referencia: string | null; zona_id: string | null; zona: string | null; latitud: number | null;
longitud: number | null; activo: boolean }`,
  `buscarClientes(f: { texto?: string; zona?: string; activos?: boolean }): Promise<ClienteDeLista[] | null>`
  (null = no se pudo leer),
  `type FotoCliente = { id: string; orden: number; ruta: string; url: string | null }`,
  `type FichaCliente = ClienteDeLista & { observacion: string | null; fotos: FotoCliente[];
permiso: { texto_version: string; otorgado_en: string; registrado_por: string } | null;
borrado: boolean }`,
  `leerFicha(id: string): Promise<FichaCliente | null>`,
  `zonasActivas(): Promise<{ id: string; nombre: string }[]>`, `SEGUNDOS_URL_FIRMADA = 600`.
  `<BotonesContacto nombre celular latitud longitud grande? />`,
  `<MapaClientes clientes={{ id, nombre, latitud, longitud }[]} />`.
  En `e2e/ayudas/clientes.ts`: `crearClienteDePrueba(datos?: Partial<{ nombre: string; celular:
string; zona: string; latitud: number; longitud: number }>): Promise<string>` y
  `borrarClienteDePrueba(id: string): Promise<void>`.

### Paso 1 — Quién entra a qué, primero la prueba

- [ ] En `src/lib/auth/roles.test.ts`, en «el repartidor solo llega a clientes y al tablero»,
      sustituir `expect(puedeAcceder("repartidor", "/admin/clientes/nuevo")).toBe(true);` por:

```ts
// Decisión 2 de F6: el repartidor consulta y corrige; no da altas.
expect(puedeAcceder("repartidor", "/admin/clientes/nuevo")).toBe(false);
expect(puedeAcceder("repartidor", "/admin/clientes/zonas")).toBe(false);
```

      y añadir al final del `describe` principal:

```ts
it("zonas, revisar y exportar clientes son de la administración (decisiones 4, 6 y 10)", () => {
  for (const ruta of [
    "/admin/clientes/zonas",
    "/admin/clientes/revisar",
    "/admin/clientes/excel",
    "/admin/clientes/pdf",
  ]) {
    expect(puedeAcceder("administrador", ruta), ruta).toBe(true);
    expect(puedeAcceder("ingeniero", ruta), ruta).toBe(false);
    expect(puedeAcceder("repartidor", ruta), ruta).toBe(false);
  }
  expect(puedeAcceder("ingeniero", "/admin/clientes/nuevo")).toBe(true);
});
```

- [ ] En `src/lib/panel/navegacion.test.ts`, sustituir los tres primeros `it` por:

```ts
it("el administrador ve clientes después de insumos", () => {
  expect(nombres("administrador")).toEqual([
    "Inicio",
    "Contenido",
    "Insumos",
    "Clientes",
    "Usuarios",
    "Configuración",
  ]);
});

it("el ingeniero ve inicio, contenido, insumos y clientes", () => {
  expect(nombres("ingeniero")).toEqual(["Inicio", "Contenido", "Insumos", "Clientes"]);
});

it("el repartidor ve el inicio y clientes (F6)", () => {
  expect(nombres("repartidor")).toEqual(["Inicio", "Clientes"]);
});
```

- [ ] Ejecutar: `pnpm test -- src/lib/auth/roles.test.ts src/lib/panel/navegacion.test.ts`
      **Esperado:** FALLAN las nuevas (el repartidor todavía entra a `nuevo`; no hay «Clientes»).

### Paso 2 — Implementar el acceso y el menú

- [ ] En `src/lib/auth/roles.ts`, en `ACCESO_POR_SECCION`, justo antes de la línea de
      `"/admin/clientes"`, añadir:

```ts
  // Decisiones de F6: el repartidor consulta y corrige, no da altas; zonas,
  // conservación y exportación son de la administración. El prefijo más largo
  // gana, así que estas mandan sobre `/admin/clientes`.
  ["/admin/clientes/nuevo", ["superadmin", "administrador", "ingeniero"]],
  ["/admin/clientes/zonas", ["superadmin", "administrador"]],
  ["/admin/clientes/revisar", ["superadmin", "administrador"]],
  ["/admin/clientes/excel", ["superadmin", "administrador"]],
  ["/admin/clientes/pdf", ["superadmin", "administrador"]],
```

- [ ] En `src/lib/panel/navegacion.ts`: `NombreIcono` pasa a
      `"inicio" | "contenido" | "insumos" | "clientes" | "usuarios" | "configuracion"`, y
      `SECCIONES` queda:

```ts
const SECCIONES: readonly SeccionPanel[] = [
  { ruta: "/admin", nombre: "Inicio", icono: "inicio", enBarraInferior: true },
  { ruta: "/admin/contenido", nombre: "Contenido", icono: "contenido", enBarraInferior: true },
  { ruta: "/admin/insumos", nombre: "Insumos", icono: "insumos", enBarraInferior: true },
  // En el celular, clientes va en la barra (es el módulo del reparto) y
  // usuarios pasa a «Más»: la barra no lleva más de cuatro botones propios.
  { ruta: "/admin/clientes", nombre: "Clientes", icono: "clientes", enBarraInferior: true },
  { ruta: "/admin/usuarios", nombre: "Usuarios", icono: "usuarios", enBarraInferior: false },
  {
    ruta: "/admin/configuracion",
    nombre: "Configuración",
    icono: "configuracion",
    enBarraInferior: false,
  },
];
```

- [ ] En `src/components/panel/barra-lateral.tsx`, importar `Contact` de `lucide-react` y añadir
      `clientes: Contact,` a `ICONOS`.
- [ ] En `src/app/(admin)/admin/page.tsx`, sustituir «Por ahora tu rol no tiene secciones en el
      panel. Clientes llega pronto.» por «Por ahora tu rol no tiene secciones en el panel. Pide a un
      administrador que revise tu cuenta.».
- [ ] Ejecutar: `pnpm test -- src/lib/auth/roles.test.ts src/lib/panel/navegacion.test.ts`
      **Esperado:** PASAN.

### Paso 3 — Lecturas

- [ ] Crear `src/lib/clientes/datos.ts`:

```ts
import "server-only";

import { crearClienteServidor } from "@/lib/supabase/servidor";

/** Las fotos del bucket privado se sirven por URL firmada, 10 minutos (Global Constraints). */
export const SEGUNDOS_URL_FIRMADA = 600;

export type ClienteDeLista = {
  id: string;
  nombre_completo: string;
  celular: string;
  direccion: string;
  referencia: string | null;
  zona_id: string | null;
  zona: string | null;
  latitud: number | null;
  longitud: number | null;
  activo: boolean;
};

export type FotoCliente = { id: string; orden: number; ruta: string; url: string | null };

export type FichaCliente = ClienteDeLista & {
  observacion: string | null;
  fotos: FotoCliente[];
  permiso: { texto_version: string; otorgado_en: string; registrado_por: string } | null;
  borrado: boolean;
};

const numero = (v: unknown) => (v === null || v === undefined ? null : Number(v));

/** `null` si la base no respondió: la página lo dice en vez de enseñar una lista vacía. */
export async function buscarClientes(f: {
  texto?: string;
  zona?: string;
  activos?: boolean;
}): Promise<ClienteDeLista[] | null> {
  const supabase = await crearClienteServidor();
  const { data, error } = await supabase.rpc("buscar_clientes", {
    p_texto: f.texto?.trim() || undefined,
    p_zona: f.zona || undefined,
    p_activos: f.activos ?? true,
  });
  if (error) {
    console.error("[clientes] buscar:", error.message);
    return null;
  }
  return data.map((c) => ({
    id: c.id,
    nombre_completo: c.nombre_completo,
    celular: c.celular,
    direccion: c.direccion,
    referencia: c.referencia,
    zona_id: c.zona_id,
    zona: c.zona,
    latitud: numero(c.latitud),
    longitud: numero(c.longitud),
    activo: c.activo,
  }));
}

export async function leerFicha(id: string): Promise<FichaCliente | null> {
  const supabase = await crearClienteServidor();
  const [{ data: c }, { data: fotos }, { data: permiso }, { data: supresion }] = await Promise.all([
    supabase
      .from("clientes")
      .select(
        "id, nombre_completo, celular, direccion, referencia, zona_id, latitud, longitud, observacion, activo, zonas_reparto(nombre)",
      )
      .eq("id", id)
      .is("deleted_at", null)
      .maybeSingle(),
    supabase.from("cliente_fotos").select("id, orden, ruta").eq("cliente_id", id).order("orden"),
    supabase.rpc("permiso_de_cliente", { p_cliente: id }).maybeSingle(),
    supabase.from("supresiones").select("id").eq("cliente_id", id).maybeSingle(),
  ]);
  if (!c) return null;

  const rutas = (fotos ?? []).map((f) => f.ruta);
  const { data: firmadas } = rutas.length
    ? await supabase.storage.from("clientes").createSignedUrls(rutas, SEGUNDOS_URL_FIRMADA)
    : { data: [] };
  const urlDe = new Map((firmadas ?? []).map((f) => [f.path, f.signedUrl]));

  return {
    id: c.id,
    nombre_completo: c.nombre_completo,
    celular: c.celular,
    direccion: c.direccion,
    referencia: c.referencia,
    zona_id: c.zona_id,
    zona: c.zonas_reparto?.nombre ?? null,
    latitud: numero(c.latitud),
    longitud: numero(c.longitud),
    observacion: c.observacion,
    activo: c.activo,
    fotos: (fotos ?? []).map((f) => ({ ...f, url: urlDe.get(f.ruta) ?? null })),
    permiso: permiso ?? null,
    // La administración ve la constancia; los demás, la ficha tachada por su nombre.
    borrado: Boolean(supresion) || c.nombre_completo === "Datos borrados a pedido del cliente",
  };
}

export async function zonasActivas(): Promise<{ id: string; nombre: string }[]> {
  const supabase = await crearClienteServidor();
  const { data } = await supabase
    .from("zonas_reparto")
    .select("id, nombre")
    .eq("activo", true)
    .is("deleted_at", null)
    .order("orden")
    .order("nombre");
  return data ?? [];
}
```

> Si `pnpm typecheck` protesta por el tipo de `permiso` (`maybeSingle()` sobre una función que
> devuelve tabla), se normaliza al leer: `permiso ? { texto_version: permiso.texto_version ?? "",
otorgado_en: permiso.otorgado_en ?? "", registrado_por: permiso.registrado_por ?? "" } : null`
> (las columnas de una función salen nullables en los tipos generados, como las de una vista).

### Paso 4 — Llamar, WhatsApp y Cómo llegar

- [ ] Crear `src/components/panel/botones-contacto.tsx`:

```tsx
import { MessageCircle, Navigation, Phone } from "lucide-react";

import { enlaceComoLlegar, enlaceLlamar, enlaceWhatsAppCliente } from "@/lib/clientes/contacto";

type Props = {
  nombre: string;
  celular: string;
  latitud: number | null;
  longitud: number | null;
  /** En la ficha van con su texto; en la lista, solo el icono (con su nombre accesible). */
  grande?: boolean;
};

const CIRCULO =
  "text-primary hover:bg-primary/10 inline-flex size-11 items-center justify-center rounded-full";

/** Decisión 7: la ruta de reparto es la lista con estos tres botones. */
export function BotonesContacto({ nombre, celular, latitud, longitud, grande = false }: Props) {
  const whatsapp = enlaceWhatsAppCliente(celular);
  const llegar = enlaceComoLlegar(latitud, longitud);
  const botones = [
    { href: enlaceLlamar(celular), texto: "Llamar", icono: Phone, externo: false },
    ...(whatsapp
      ? [{ href: whatsapp, texto: "WhatsApp", icono: MessageCircle, externo: true }]
      : []),
    ...(llegar ? [{ href: llegar, texto: "Cómo llegar", icono: Navigation, externo: true }] : []),
  ];
  return (
    <>
      {botones.map(({ href, texto, icono: Icono, externo }) => (
        <a
          key={texto}
          href={href}
          {...(externo ? { target: "_blank", rel: "noopener noreferrer" } : {})}
          aria-label={grande ? undefined : `${texto}: ${nombre}`}
          className={grande ? "boton-linea" : CIRCULO}
        >
          <Icono aria-hidden className="size-5" />
          {grande ? texto : null}
        </a>
      ))}
    </>
  );
}
```

### Paso 5 — El mapa de clientes

- [ ] Crear `src/components/panel/mapa-clientes.tsx`:

```tsx
"use client";

import type { Map as MapaLeaflet } from "leaflet";
import { useEffect, useRef } from "react";

import "leaflet/dist/leaflet.css";

type Punto = { id: string; nombre: string; latitud: number; longitud: number };

const escapar = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/**
 * Los clientes con punto, cada uno con su marcador; al tocarlo, el nombre y
 * «Ver ficha». El mismo Leaflet sin react-leaflet del sitio público y de
 * `selector-ubicacion.tsx`, con `isolate` para no pintarse encima de la barra
 * inferior del panel.
 */
export function MapaClientes({ clientes }: { clientes: Punto[] }) {
  const contenedor = useRef<HTMLDivElement>(null);
  const mapa = useRef<MapaLeaflet | null>(null);

  useEffect(() => {
    let cancelado = false;
    void (async () => {
      const L = await import("leaflet");
      if (cancelado || !contenedor.current || mapa.current || clientes.length === 0) return;
      const instancia = L.map(contenedor.current, { scrollWheelZoom: false });
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution:
          '&copy; colaboradores de <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(instancia);
      const icono = L.divIcon({
        className: "",
        html: '<span class="block size-6 rounded-full border-4 border-white bg-primary shadow"></span>',
        iconSize: [24, 24],
      });
      for (const c of clientes) {
        L.marker([c.latitud, c.longitud], {
          icon: icono,
          keyboard: true,
          title: c.nombre,
          alt: c.nombre,
        })
          .bindPopup(
            `<strong>${escapar(c.nombre)}</strong><br><a href="/admin/clientes/${c.id}">Ver ficha</a>`,
          )
          .addTo(instancia);
      }
      instancia.fitBounds(
        L.latLngBounds(clientes.map((c) => [c.latitud, c.longitud] as [number, number])),
        { padding: [32, 32], maxZoom: 17 },
      );
      mapa.current = instancia;
    })();
    return () => {
      cancelado = true;
      mapa.current?.remove();
      mapa.current = null;
    };
  }, [clientes]);

  return (
    <div
      ref={contenedor}
      className="isolate h-[60vh] min-h-72 w-full overflow-hidden rounded-xl border"
      data-mapa-clientes
      role="region"
      aria-label="Mapa de clientes"
    />
  );
}
```

### Paso 6 — El lápiz dice «Corregir» al repartidor

- [ ] En `src/components/panel/lista-adaptable.tsx`, añadir a `Props`:

```ts
  /** El texto del lápiz: «Editar» por defecto; «Corregir» para el repartidor (F6). */
  etiquetaEditar?: string;
```

      recibirlo en la firma (`etiquetaEditar = "Editar",`) y usarlo en el `aria-label` del lápiz:
      `` aria-label={`${etiquetaEditar} ${nombreDe(fila)}`.trim()} ``.

### Paso 7 — La lista

- [ ] Crear `src/app/(admin)/admin/clientes/page.tsx`:

```tsx
import { Plus } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";

import { BotonesContacto } from "@/components/panel/botones-contacto";
import { BuscadorEnVivo } from "@/components/panel/buscador-en-vivo";
import { EncabezadoPanel } from "@/components/panel/encabezado-panel";
import { ListaAdaptable } from "@/components/panel/lista-adaptable";
import { MapaClientes } from "@/components/panel/mapa-clientes";
import { exigirAcceso } from "@/lib/auth/sesion";
import { buscarClientes, type ClienteDeLista, zonasActivas } from "@/lib/clientes/datos";

const RUTA = "/admin/clientes";

export default function Clientes({ searchParams }: PageProps<"/admin/clientes">) {
  return (
    <Suspense fallback={<p className="text-muted-foreground text-sm">Cargando…</p>}>
      <Contenido searchParams={searchParams} />
    </Suspense>
  );
}

async function Contenido({
  searchParams,
}: {
  searchParams: PageProps<"/admin/clientes">["searchParams"];
}) {
  const [{ q, zona, estado, vista }, sesion] = await Promise.all([
    searchParams,
    exigirAcceso(RUTA),
  ]);
  const texto = typeof q === "string" ? q : "";
  const filtroZona = typeof zona === "string" ? zona : "";
  const encargado = sesion.rol !== "repartidor";
  // Solo los encargados ven los desactivados (decisión 3).
  const verDesactivados = encargado && estado === "desactivados";
  const enMapa = vista === "mapa";

  const [clientes, zonas] = await Promise.all([
    buscarClientes({ texto, zona: filtroZona, activos: !verDesactivados }),
    zonasActivas(),
  ]);

  const parametros = new URLSearchParams({
    ...(texto ? { q: texto } : {}),
    ...(filtroZona ? { zona: filtroZona } : {}),
    ...(verDesactivados ? { estado: "desactivados" } : {}),
  });
  const enlaceVista = (v: "lista" | "mapa") => {
    const p = new URLSearchParams(parametros);
    if (v === "mapa") p.set("vista", "mapa");
    return `${RUTA}${p.size ? `?${p}` : ""}`;
  };

  return (
    <>
      <EncabezadoPanel
        titulo="Clientes"
        descripcion="Para el reparto: busca por nombre o celular, filtra por zona, llama, escribe o mira cómo llegar."
        accion={
          encargado ? (
            <Link href={`${RUTA}/nuevo`} className="boton-cta">
              <Plus aria-hidden className="size-5" /> Nuevo cliente
            </Link>
          ) : null
        }
      />

      <BuscadorEnVivo
        nombre="q"
        etiqueta="Buscar cliente"
        placeholder="Nombre o celular"
        valor={texto}
        filtros={[
          {
            nombre: "zona",
            etiqueta: "Zona",
            valor: filtroZona,
            opciones: [
              { valor: "", nombre: "Todas las zonas" },
              ...zonas.map((z) => ({ valor: z.id, nombre: z.nombre })),
            ],
          },
          ...(encargado
            ? [
                {
                  nombre: "estado",
                  etiqueta: "Mostrar",
                  valor: verDesactivados ? "desactivados" : "",
                  opciones: [
                    { valor: "", nombre: "Activos" },
                    { valor: "desactivados", nombre: "Desactivados" },
                  ],
                },
              ]
            : []),
        ]}
      />

      <nav aria-label="Ver como" className="mb-4 flex gap-2">
        <Link
          href={enlaceVista("lista")}
          className={enMapa ? "boton-linea" : "boton-cta"}
          aria-current={enMapa ? undefined : "page"}
        >
          Lista
        </Link>
        <Link
          href={enlaceVista("mapa")}
          className={enMapa ? "boton-cta" : "boton-linea"}
          aria-current={enMapa ? "page" : undefined}
        >
          Mapa
        </Link>
      </nav>

      {clientes === null ? (
        <p role="alert">No se pudieron cargar los clientes. Recarga la página.</p>
      ) : enMapa ? (
        <VistaMapa clientes={clientes} />
      ) : (
        <ListaAdaptable
          etiqueta="Clientes"
          filas={clientes}
          enlace={(c) => `${RUTA}/${c.id}`}
          editar={(c) => `${RUTA}/${c.id}/${encargado ? "editar" : "corregir"}`}
          etiquetaEditar={encargado ? "Editar" : "Corregir"}
          columnas={[
            { titulo: "Nombre", celda: (c) => c.nombre_completo, principal: true },
            { titulo: "Zona", celda: (c) => c.zona ?? "Sin zona" },
            {
              titulo: "Dirección",
              celda: (c) => (c.referencia ? `${c.direccion} · ${c.referencia}` : c.direccion),
            },
          ]}
          acciones={(c) => (
            <BotonesContacto
              nombre={c.nombre_completo}
              celular={c.celular}
              latitud={c.latitud}
              longitud={c.longitud}
            />
          )}
          vacio={
            texto || filtroZona ? (
              <p>Ningún cliente coincide con la búsqueda.</p>
            ) : (
              <p>
                Todavía no hay clientes.
                {encargado ? " Registra el primero con «Nuevo cliente»." : ""}
              </p>
            )
          }
        />
      )}
    </>
  );
}

function VistaMapa({ clientes }: { clientes: ClienteDeLista[] }) {
  const conPunto = clientes.flatMap((c) =>
    c.latitud !== null && c.longitud !== null
      ? [{ id: c.id, nombre: c.nombre_completo, latitud: c.latitud, longitud: c.longitud }]
      : [],
  );
  const sinPunto = clientes.length - conPunto.length;
  return (
    <>
      {conPunto.length > 0 ? (
        <MapaClientes clientes={conPunto} />
      ) : (
        <p className="bg-card rounded-xl border p-6 text-center">
          Ningún cliente de esta lista tiene su casa marcada en el mapa.
        </p>
      )}
      {sinPunto > 0 ? (
        <p className="text-muted-foreground mt-2 text-sm" data-sin-punto>
          {sinPunto} {sinPunto === 1 ? "cliente no tiene" : "clientes no tienen"} punto en el mapa:
          están en la lista.
        </p>
      ) : null}
    </>
  );
}
```

### Paso 8 — La ficha

- [ ] Crear `src/app/(admin)/admin/clientes/[id]/page.tsx`:

```tsx
import { Pencil } from "lucide-react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { BotonesContacto } from "@/components/panel/botones-contacto";
import { EncabezadoPanel } from "@/components/panel/encabezado-panel";
import { exigirAcceso } from "@/lib/auth/sesion";
import { celularParaLeer } from "@/lib/clientes/contacto";
import { leerFicha } from "@/lib/clientes/datos";
import { formatearFechaLima } from "@/lib/panel/hora-lima";

const Mapa = dynamic(() => import("@/components/publico/mapa").then((m) => m.Mapa));

type Props = PageProps<"/admin/clientes/[id]">;

export default function FichaDeCliente({ params }: Props) {
  return (
    <Suspense fallback={<p className="text-muted-foreground text-sm">Cargando…</p>}>
      <Contenido params={params} />
    </Suspense>
  );
}

async function Contenido({ params }: Pick<Props, "params">) {
  const [{ id }, sesion] = await Promise.all([params, exigirAcceso("/admin/clientes")]);
  const cliente = await leerFicha(id);
  if (!cliente) notFound();
  const encargado = sesion.rol !== "repartidor";

  return (
    <>
      <EncabezadoPanel
        titulo={cliente.nombre_completo}
        descripcion={cliente.activo ? undefined : "Desactivado: no sale en la lista ni en el mapa."}
        volver={{ ruta: "/admin/clientes", nombre: "Clientes" }}
        accion={
          cliente.borrado ? null : (
            <Link
              href={`/admin/clientes/${id}/${encargado ? "editar" : "corregir"}`}
              className="boton-linea"
            >
              <Pencil aria-hidden className="size-5" />
              {encargado ? "Editar datos" : "Corregir ubicación y fotos"}
            </Link>
          )
        }
      />

      {cliente.borrado ? (
        <p className="bg-card rounded-xl border p-4">
          Los datos de este cliente se borraron a su pedido. Solo queda la constancia.
        </p>
      ) : (
        <>
          <div className="mb-4 flex flex-wrap gap-2">
            <BotonesContacto
              grande
              nombre={cliente.nombre_completo}
              celular={cliente.celular}
              latitud={cliente.latitud}
              longitud={cliente.longitud}
            />
          </div>

          <section aria-labelledby="datos" className="tarjeta mb-6 p-4">
            <h2 id="datos" className="mb-2 font-semibold">
              Datos
            </h2>
            <dl className="grid gap-x-4 gap-y-2 sm:grid-cols-[10rem_1fr]">
              <dt className="text-muted-foreground">Celular</dt>
              <dd>{celularParaLeer(cliente.celular)}</dd>
              <dt className="text-muted-foreground">Dirección</dt>
              <dd>{cliente.direccion}</dd>
              <dt className="text-muted-foreground">Referencia</dt>
              <dd>{cliente.referencia ?? "—"}</dd>
              <dt className="text-muted-foreground">Zona</dt>
              <dd>{cliente.zona ?? "Sin zona"}</dd>
              {cliente.observacion ? (
                <>
                  <dt className="text-muted-foreground">Observación</dt>
                  <dd>{cliente.observacion}</dd>
                </>
              ) : null}
            </dl>
          </section>

          <section aria-labelledby="fotos" className="mb-6">
            <h2 id="fotos" className="mb-2 font-semibold">
              Fotos de la fachada
            </h2>
            {cliente.fotos.length === 0 ? (
              <p className="text-muted-foreground text-sm">Todavía no tiene fotos.</p>
            ) : (
              <ul className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                {cliente.fotos.map((f) =>
                  f.url ? (
                    <li key={f.id}>
                      {/* eslint-disable-next-line @next/next/no-img-element -- URL firmada de un bucket privado: next/image la guardaría en su caché, y caduca a los 10 minutos */}
                      <img
                        src={f.url}
                        alt={`Fachada de la casa, foto ${f.orden}`}
                        className="aspect-[4/3] w-full rounded-xl border object-cover"
                      />
                    </li>
                  ) : null,
                )}
              </ul>
            )}
          </section>

          <section aria-labelledby="ubicacion" className="mb-6">
            <h2 id="ubicacion" className="mb-2 font-semibold">
              Ubicación
            </h2>
            {cliente.latitud !== null && cliente.longitud !== null ? (
              <Mapa
                lat={cliente.latitud}
                lng={cliente.longitud}
                titulo={cliente.nombre_completo}
                direccion={cliente.direccion}
              />
            ) : (
              <p className="text-muted-foreground text-sm">
                Sin punto en el mapa: se llega por la dirección y la referencia.
              </p>
            )}
          </section>

          <section aria-labelledby="permiso" className="mb-6">
            <h2 id="permiso" className="mb-2 font-semibold">
              Permiso para guardar sus datos
            </h2>
            {cliente.permiso ? (
              <p className="text-sm" data-permiso>
                Aceptó el texto {cliente.permiso.texto_version} el{" "}
                {formatearFechaLima(cliente.permiso.otorgado_en)}. Lo anotó{" "}
                {cliente.permiso.registrado_por}.
              </p>
            ) : (
              <p className="text-sm">Sin permiso vigente.</p>
            )}
          </section>
        </>
      )}
    </>
  );
}
```

> `Mapa` del sitio público ya maneja `import("leaflet")` dinámico; `next/dynamic` además lo saca del
> paquete de la página. Si su texto «Cómo llegar» choca con los botones de contacto en las pruebas,
> acotar los localizadores a su sección (`getByRole("region", …)`).

### Paso 9 — Pruebas de navegador

- [ ] Crear `e2e/ayudas/clientes.ts`:

```ts
import { supabaseLocal } from "./supabase-local";
import { sesionDeApi } from "./insumos";

/**
 * Un cliente real, con su permiso, registrado por un ingeniero por la API
 * (`registrar_cliente`, 0042). Devuelve su id.
 */
export async function crearClienteDePrueba(
  datos: Partial<{
    nombre: string;
    celular: string;
    zona: string;
    latitud: number;
    longitud: number;
  }> = {},
): Promise<string> {
  const ingeniero = await sesionDeApi("ingeniero");
  const { data: zona } = await ingeniero
    .from("zonas_reparto")
    .select("id")
    .eq("nombre", datos.zona ?? "Belén")
    .single();
  const { data, error } = await ingeniero.rpc("registrar_cliente", {
    p_cliente: {
      nombre_completo: datos.nombre ?? `Cliente E2E ${Date.now()}`,
      celular: datos.celular ?? `9${String(Date.now()).slice(-8)}`,
      direccion: "Jirón Próspero 100",
      referencia: "Portón verde",
      zona_id: zona!.id,
      ...(datos.latitud !== undefined ? { latitud: datos.latitud, longitud: datos.longitud } : {}),
    },
    p_version_texto: "v1-2026-10",
  });
  if (error) throw new Error(`No se pudo crear el cliente de prueba: ${error.message}`);
  return data as string;
}

/** Borrado físico con la service_role local (no hay política de delete, a propósito). */
export async function borrarClienteDePrueba(id: string): Promise<void> {
  const { apiUrl, serviceRoleKey } = supabaseLocal();
  const cabeceras = { apikey: serviceRoleKey, Authorization: `Bearer ${serviceRoleKey}` };
  await fetch(`${apiUrl}/storage/v1/object/clientes`, {
    method: "DELETE",
    headers: { ...cabeceras, "Content-Type": "application/json" },
    body: JSON.stringify({ prefixes: [`${id}/`] }),
  });
  // La constancia de un borrado a pedido (0043, T5) no deja borrar al cliente.
  await fetch(`${apiUrl}/rest/v1/supresiones?cliente_id=eq.${id}`, {
    method: "DELETE",
    headers: cabeceras,
  });
  const r = await fetch(`${apiUrl}/rest/v1/clientes?id=eq.${id}`, {
    method: "DELETE",
    headers: cabeceras,
  });
  if (!r.ok)
    throw new Error(`No se pudo borrar el cliente de prueba: ${r.status} ${await r.text()}`);
}
```

> El borrado de archivos por prefijo es un intento de limpieza: si la API de Storage no lo admite
> así, no rompe la prueba (no se comprueba su respuesta). La fila sí se comprueba.
>
> **El orden de la limpieza importa.** `created_by` de `clientes` y `registrado_por` de
> `consentimientos` apuntan a `auth.users` sin `on delete`: si se borra antes al usuario de prueba,
> `borrarUsuario` falla **sin avisar** (no comprueba la respuesta) y el usuario queda en la base.
> En cada `finally`, primero el cliente (con él se van, en cascada, fotos y permisos) y **al final**
> `borrarUsuario`. Lo mismo con una zona creada en la prueba (`created_by`).

- [ ] Crear `e2e/panel-clientes.spec.ts`:

```ts
import { expect, test } from "@playwright/test";

import { borrarClienteDePrueba, crearClienteDePrueba } from "./ayudas/clientes";
import { sesionDeApi } from "./ayudas/insumos";
import { entrarComo } from "./ayudas/sesion";
import { supabaseLocal } from "./ayudas/supabase-local";
import { borrarUsuario } from "./ayudas/usuarios";

test.beforeEach(({}, info) => {
  test.skip(info.project.name !== "movil", "el reparto trabaja en el celular");
});

test("el repartidor encuentra a un cliente por nombre sin tildes y por celular con espacios", async ({
  page,
}) => {
  const marca = Date.now();
  const id = await crearClienteDePrueba({
    nombre: `Ñusta Pérez ${marca}`,
    celular: `9${String(marca).slice(-8)}`,
  });
  const celular = `9${String(marca).slice(-8)}`;
  const usuario = await entrarComo(page, "repartidor");
  try {
    await page
      .getByRole("navigation", { name: /barra inferior/ })
      .getByRole("link", { name: "Clientes" })
      .click();
    const buscador = page.getByRole("searchbox", { name: "Buscar cliente" });
    await buscador.fill(`nusta perez ${marca}`);
    await expect(
      page.getByRole("link", { name: new RegExp(`Ñusta Pérez ${marca}`) }).first(),
    ).toBeVisible();
    await buscador.fill(`${celular.slice(0, 3)} ${celular.slice(3, 6)} ${celular.slice(6)}`);
    await expect(
      page.getByRole("link", { name: new RegExp(`Ñusta Pérez ${marca}`) }).first(),
    ).toBeVisible();
    await expect(page.getByRole("link", { name: `Llamar: Ñusta Pérez ${marca}` })).toHaveAttribute(
      "href",
      `tel:+51${celular}`,
    );
    // El repartidor no da altas: no ve «Nuevo cliente», y su lápiz dice «Corregir».
    await expect(page.getByRole("link", { name: "Nuevo cliente" })).toHaveCount(0);
    await expect(page.getByRole("link", { name: `Corregir Ñusta Pérez ${marca}` })).toBeVisible();
  } finally {
    await borrarUsuario(usuario.id);
    await borrarClienteDePrueba(id);
  }
});

test("la ficha tiene sus botones, su permiso y la foto solo por URL firmada", async ({ page }) => {
  const marca = Date.now();
  const id = await crearClienteDePrueba({
    nombre: `Cliente Ficha ${marca}`,
    latitud: -3.7595,
    longitud: -73.2516,
  });
  // Una foto subida como lo haría el panel, con la sesión de un ingeniero.
  const ingeniero = await sesionDeApi("ingeniero");
  const ruta = `${id}/fachada-${marca}.webp`;
  const webp = Buffer.from("UklGRhoAAABXRUJQVlA4TA0AAAAvAAAAEAcQERGIiP4HAA==", "base64");
  const { error: errorSubida } = await ingeniero.storage
    .from("clientes")
    .upload(ruta, webp, { contentType: "image/webp" });
  expect(errorSubida).toBeNull();
  await ingeniero.from("cliente_fotos").insert({ cliente_id: id, ruta, orden: 1 });

  const usuario = await entrarComo(page, "repartidor");
  try {
    await page.goto(`/admin/clientes/${id}`);
    await expect(page.getByRole("heading", { name: `Cliente Ficha ${marca}` })).toBeVisible();
    await expect(page.getByRole("link", { name: "Cómo llegar" })).toHaveAttribute(
      "href",
      "https://www.google.com/maps/dir/?api=1&destination=-3.7595,-73.2516",
    );
    await expect(page.locator("[data-permiso]")).toContainText("v1-2026-10");

    const src = await page
      .getByRole("img", { name: /Fachada de la casa, foto 1/ })
      .getAttribute("src");
    expect(src).toContain("/storage/v1/object/sign/clientes/");
    // La firmada se ve…
    expect((await fetch(src!)).status).toBe(200);
    // …y la misma foto por la dirección pública no (bucket privado).
    const { apiUrl } = supabaseLocal();
    const publica = await fetch(`${apiUrl}/storage/v1/object/public/clientes/${ruta}`);
    expect(publica.status).toBeGreaterThanOrEqual(400);
    expect(publica.status).toBeLessThan(500);
  } finally {
    await borrarUsuario(usuario.id);
    await borrarClienteDePrueba(id);
  }
});

test("la vista mapa enseña a los clientes con punto y dice cuántos no lo tienen", async ({
  page,
}) => {
  const marca = Date.now();
  const conPunto = await crearClienteDePrueba({
    nombre: `Con Punto ${marca}`,
    zona: "Punchana",
    latitud: -3.73,
    longitud: -73.24,
  });
  const sinPunto = await crearClienteDePrueba({ nombre: `Sin Punto ${marca}`, zona: "Punchana" });
  const usuario = await entrarComo(page, "ingeniero");
  try {
    await page.goto(`/admin/clientes?q=${marca}&vista=mapa`);
    await expect(page.getByRole("region", { name: "Mapa de clientes" })).toBeVisible();
    await expect(page.locator("[data-mapa-clientes] .leaflet-marker-icon")).toHaveCount(1);
    await expect(page.locator("[data-sin-punto]")).toContainText("1 cliente no tiene punto");
  } finally {
    await borrarUsuario(usuario.id);
    await borrarClienteDePrueba(conPunto);
    await borrarClienteDePrueba(sinPunto);
  }
});
```

> El webp de la segunda prueba es una imagen de 1 × 1 escrita en base64: el bucket solo admite
> `image/webp` y `image/jpeg` (`config.toml`), y la prueba no necesita una foto grande.

- [ ] En `e2e/autenticacion.spec.ts`, en la prueba del repartidor: título «un repartidor entra y
      solo ve clientes», y tras `toHaveURL("/admin")` añadir
      `await expect(page.locator('[data-seccion="Clientes"]')).toBeVisible();`.
- [ ] En `e2e/panel-accesibilidad.spec.ts`, añadir `"/admin/clientes"` a `RUTAS_DEL_PANEL`.
- [ ] `pnpm build` (con el puerto 3000 libre) y
      `pnpm exec playwright test e2e/panel-clientes.spec.ts e2e/autenticacion.spec.ts e2e/panel-accesibilidad.spec.ts -g "clientes|repartidor"`
      **Esperado:** verde.

### Paso 10 — Cerrar la tarea (sin PR: sigue la T4 en la misma rama)

- [ ] `pnpm typecheck && pnpm lint && pnpm test`
- [ ] Commit:

```bash
git add src/lib/auth src/lib/panel/navegacion.ts src/lib/panel/navegacion.test.ts \
        src/components/panel/barra-lateral.tsx src/components/panel/lista-adaptable.tsx \
        src/components/panel/botones-contacto.tsx src/components/panel/mapa-clientes.tsx \
        src/lib/clientes/datos.ts "src/app/(admin)/admin/clientes" "src/app/(admin)/admin/page.tsx" \
        e2e/ayudas/clientes.ts e2e/panel-clientes.spec.ts e2e/autenticacion.spec.ts e2e/panel-accesibilidad.spec.ts
git commit -m "feat(clientes): consultar clientes: lista, mapa, ficha y llamar, WhatsApp o cómo llegar"
```

---

## Tarea 4 — Registrar y corregir

**Rama:** la misma de la T3 (`feat/f6-t3-t4-clientes`) · **Migración:** no · **PR:** al terminar
esta tarea, **un PR con la T3 y la T4**; revisión de la rama con un subagente antes de abrirlo.

**Qué deja hecho:** el alta en pestañas (Datos · Ubicación y fotos · Permiso) con el aviso de
celular repetido y el punto opcional («Usar mi ubicación» o tocar el mapa); al guardar, lleva a
añadir las fotos (las fotos necesitan que el cliente exista: la política de Storage de 0014 solo
deja subir a la carpeta de un cliente que ya está); la edición; la «Corrección» del repartidor;
y desactivar o reactivar.

> **Ajuste sobre la sección 2 del diseño:** las fotos no van en el alta sino justo después, como en
> los productos de F4 («Primero guarda el producto y después podrás añadirle fotos»). La causa es
> la política del bucket privado (0014), que exige que la carpeta sea de un cliente que ya existe.
> Al guardar el alta, la pantalla lleva directamente a la pestaña de fotos.

**Files:**

- Create: `src/lib/validaciones/cliente.ts` + `.test.ts`, `src/lib/acciones/clientes.ts`
- Modify: `src/components/panel/selector-ubicacion.tsx` (punto opcional y «Usar mi ubicación»),
  `src/components/panel/subida-imagen.tsx` (bucket `clientes`), `src/components/panel/pestanas-formulario.tsx`
  (pestaña inicial)
- Create: `src/components/panel/fotos-cliente.tsx`, `src/components/panel/boton-activo-cliente.tsx`
- Create: `src/app/(admin)/admin/clientes/formulario-cliente.tsx`, `.../nuevo/page.tsx`,
  `.../[id]/editar/page.tsx`, `.../[id]/corregir/page.tsx`, `.../[id]/corregir/formulario-correccion.tsx`
- Modify: `src/app/(admin)/admin/clientes/[id]/page.tsx` (desactivar / reactivar)
- Create: `e2e/panel-clientes-registro.spec.ts` · Modify: `e2e/panel-accesibilidad.spec.ts`

**Interfaces:**

- Consumes (T1–T3): `registrar_cliente`, `normalizarCelular`, `VERSION_PERMISO`, `textoDelPermiso`,
  `leerFicha`, `zonasActivas`, `FotoCliente`, `crearClienteDePrueba`, `borrarClienteDePrueba`.
- Produces: `esquemaCliente`, `leerCliente(fd)`, `validarCliente(fd)`, `esquemaCorreccion`,
  `leerCorreccion(fd)`, `validarCorreccion(fd)` en `src/lib/validaciones/cliente.ts`;
  en `src/lib/acciones/clientes.ts` (`"use server"`): `registrarCliente(fd)`, `editarCliente(fd)`,
  `corregirCliente(fd)`, `cambiarActivoCliente(id: string, activo: boolean)`,
  `agregarFotoCliente(id: string, ruta: string)`, `quitarFotoCliente(fotoId: string)`,
  `buscarCelularRepetido(celular: string, excluir: string | null): Promise<{ id: string; nombre:
string; zona: string | null } | null>`. `<SelectorUbicacion opcional instruccion? />`,
  `<FotosCliente clienteId fotos puedeQuitar />`, `<PestanasFormulario inicial? />`.

### Paso 1 — Los esquemas, primero la prueba

- [ ] Crear `src/lib/validaciones/cliente.test.ts`:

```ts
import { describe, expect, it } from "vitest";

import { esquemaCliente, esquemaCorreccion } from "./cliente";

const ZONA = "0a1f3a52-6b1e-4f7e-9d3a-0a1b2c3d4e5f";
const ID = "1b2f3a52-6b1e-4f7e-9d3a-0a1b2c3d4e5f";

const alta = {
  id: null,
  nombre_completo: "Rosa Quispe",
  celular: "+51 965 111 222",
  direccion: "Jr. Próspero 123",
  referencia: "Portón verde",
  zona_id: ZONA,
  observacion: null,
  ubicacion: null,
  permiso: true,
};

describe("esquemaCliente", () => {
  it("guarda el celular normalizado", () => {
    const r = esquemaCliente.safeParse(alta);
    expect(r.success && r.data.celular).toBe("965111222");
  });

  it("un alta sin permiso no pasa, y lo dice en la casilla (decisión 5)", () => {
    const r = esquemaCliente.safeParse({ ...alta, permiso: false });
    expect(r.success).toBe(false);
    expect(r.error?.issues[0]?.path).toEqual(["permiso"]);
  });

  it("editar no vuelve a pedir el permiso", () => {
    expect(esquemaCliente.safeParse({ ...alta, id: ID, permiso: false }).success).toBe(true);
  });

  it("el punto en el mapa es opcional (decisión 1), pero si viene tiene que ser un punto", () => {
    expect(
      esquemaCliente.safeParse({ ...alta, ubicacion: { lat: -3.75, lng: -73.25 } }).success,
    ).toBe(true);
    expect(esquemaCliente.safeParse({ ...alta, ubicacion: { lat: 200, lng: 0 } }).success).toBe(
      false,
    );
  });

  it("referencia y zona son obligatorias (ficha 8.2)", () => {
    expect(esquemaCliente.safeParse({ ...alta, referencia: "" }).success).toBe(false);
    expect(esquemaCliente.safeParse({ ...alta, zona_id: "" }).success).toBe(false);
  });

  it("un celular con letras no pasa", () => {
    expect(esquemaCliente.safeParse({ ...alta, celular: "no tiene" }).success).toBe(false);
  });
});

describe("esquemaCorreccion", () => {
  it("el repartidor corrige referencia y punto; nada más", () => {
    const r = esquemaCorreccion.safeParse({
      id: ID,
      referencia: "Portón azul",
      ubicacion: null,
      nombre_completo: "Otro nombre",
    });
    expect(r.success).toBe(true);
    expect(r.success && "nombre_completo" in r.data).toBe(false);
  });
});
```

- [ ] Ejecutar: `pnpm test -- src/lib/validaciones/cliente.test.ts`
      **Esperado:** FALLA («Cannot find module './cliente'»).

- [ ] Crear `src/lib/validaciones/cliente.ts`:

```ts
import * as z from "zod";

import { normalizarCelular } from "@/lib/clientes/contacto";
import { casilla, json, texto, textoOpcional } from "@/lib/panel/formulario";

import { erroresPorCampo } from "./movimiento";

const referencia = z
  .string()
  .trim()
  .min(3, {
    error: "Escribe cómo reconocer la casa, por ejemplo «portón verde, frente a la bodega».",
  })
  .max(200, { error: "Máximo 200 letras." });

const ubicacion = z
  .object({
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
  })
  .nullable();

export const esquemaCliente = z
  .object({
    id: z.uuid().nullable(),
    nombre_completo: z
      .string()
      .trim()
      .min(3, { error: "Escribe su nombre y apellido." })
      .max(120, { error: "Máximo 120 letras." }),
    celular: z
      .string()
      .transform(normalizarCelular)
      .pipe(
        z
          .string()
          .min(6, { error: "Escribe el celular con números, por ejemplo 965 111 222." })
          .max(15, { error: "Ese número es demasiado largo." }),
      ),
    direccion: z
      .string()
      .trim()
      .min(5, { error: "Escribe la dirección, por ejemplo «Jr. Próspero 123»." })
      .max(200, { error: "Máximo 200 letras." }),
    referencia,
    zona_id: z.uuid({ error: "Elige la zona." }),
    observacion: z.string().trim().max(300, { error: "Máximo 300 letras." }).nullable(),
    ubicacion,
    permiso: z.boolean(),
  })
  .refine((d) => d.id !== null || d.permiso, {
    error: "Léele el texto y marca «Se lo leí y aceptó». Sin su permiso no se puede registrar.",
    path: ["permiso"],
  });

/** `coordenadas` llega vacío (sin punto) o como JSON de `SelectorUbicacion`. */
function leerUbicacion(fd: FormData) {
  const valor = json(fd, "coordenadas");
  return valor && typeof valor === "object" ? valor : null;
}

export function leerCliente(fd: FormData) {
  return {
    id: textoOpcional(fd, "id"),
    nombre_completo: texto(fd, "nombre_completo"),
    celular: texto(fd, "celular"),
    direccion: texto(fd, "direccion"),
    referencia: texto(fd, "referencia"),
    zona_id: texto(fd, "zona_id"),
    observacion: textoOpcional(fd, "observacion"),
    ubicacion: leerUbicacion(fd),
    permiso: casilla(fd, "permiso"),
  };
}

export function validarCliente(fd: FormData) {
  const r = esquemaCliente.safeParse(leerCliente(fd));
  return r.success ? {} : erroresPorCampo(r.error);
}

/** Lo que corrige el repartidor en la puerta (decisión 2). Zod descarta el resto. */
export const esquemaCorreccion = z.object({ id: z.uuid(), referencia, ubicacion });

export function leerCorreccion(fd: FormData) {
  return { id: texto(fd, "id"), referencia: texto(fd, "referencia"), ubicacion: leerUbicacion(fd) };
}

export function validarCorreccion(fd: FormData) {
  const r = esquemaCorreccion.safeParse(leerCorreccion(fd));
  return r.success ? {} : erroresPorCampo(r.error);
}
```

- [ ] Ejecutar: `pnpm test -- src/lib/validaciones/cliente.test.ts`
      **Esperado:** PASAN (7).

### Paso 2 — Las acciones

- [ ] Crear `src/lib/acciones/clientes.ts`:

```ts
"use server";

import * as z from "zod";

import { normalizarCelular } from "@/lib/clientes/contacto";
import { VERSION_PERMISO } from "@/lib/clientes/permiso";
import { ejecutarAccion, type EstadoAccion } from "@/lib/panel/accion";
import { crearClienteServidor } from "@/lib/supabase/servidor";
import { exigirAcceso } from "@/lib/auth/sesion";
import {
  esquemaCliente,
  esquemaCorreccion,
  leerCliente,
  leerCorreccion,
} from "@/lib/validaciones/cliente";

// `exigirAcceso` mira la ruta: `/admin/clientes/nuevo` es la de los encargados
// (roles.ts), `/admin/clientes` la de los cuatro roles. La regla de verdad está
// en la base (0042): RLS y el trigger `clientes_proteger`.
const ENCARGADOS = "/admin/clientes/nuevo";
const TODOS = "/admin/clientes";

export async function registrarCliente(fd: FormData): Promise<EstadoAccion> {
  return ejecutarAccion({
    ruta: ENCARGADOS,
    esquema: esquemaCliente,
    entrada: leerCliente(fd),
    entidad: "un cliente",
    etiquetas: [],
    mensajeOk: "Cliente registrado. Ahora añade las fotos de la fachada.",
    hacer: async (d, { supabase }) => {
      const { data, error } = await supabase.rpc("registrar_cliente", {
        p_cliente: {
          nombre_completo: d.nombre_completo,
          celular: d.celular,
          direccion: d.direccion,
          referencia: d.referencia,
          zona_id: d.zona_id,
          latitud: d.ubicacion?.lat ?? null,
          longitud: d.ubicacion?.lng ?? null,
          observacion: d.observacion,
        },
        p_version_texto: VERSION_PERMISO,
      });
      return { error, id: data ?? undefined };
    },
  });
}

export async function editarCliente(fd: FormData): Promise<EstadoAccion> {
  return ejecutarAccion({
    ruta: ENCARGADOS,
    esquema: esquemaCliente,
    entrada: leerCliente(fd),
    entidad: "el cliente",
    etiquetas: [],
    mensajeOk: "Cambios guardados.",
    hacer: async (d, { supabase }) => {
      if (!d.id) return { error: { code: "P0002", message: "Falta el cliente." } };
      const { error } = await supabase
        .from("clientes")
        .update({
          nombre_completo: d.nombre_completo,
          celular: d.celular,
          direccion: d.direccion,
          referencia: d.referencia,
          zona_id: d.zona_id,
          latitud: d.ubicacion?.lat ?? null,
          longitud: d.ubicacion?.lng ?? null,
          observacion: d.observacion,
        })
        .eq("id", d.id)
        .is("deleted_at", null)
        .select("id")
        .single();
      return { error, id: d.id };
    },
  });
}

export async function corregirCliente(fd: FormData): Promise<EstadoAccion> {
  return ejecutarAccion({
    ruta: TODOS,
    esquema: esquemaCorreccion,
    entrada: leerCorreccion(fd),
    entidad: "el cliente",
    etiquetas: [],
    mensajeOk: "Corrección guardada.",
    hacer: async (d, { supabase }) => {
      const { error } = await supabase
        .from("clientes")
        .update({
          referencia: d.referencia,
          latitud: d.ubicacion?.lat ?? null,
          longitud: d.ubicacion?.lng ?? null,
        })
        .eq("id", d.id)
        .is("deleted_at", null)
        .select("id")
        .single();
      return { error, id: d.id };
    },
  });
}

export async function cambiarActivoCliente(id: string, activo: boolean): Promise<EstadoAccion> {
  return ejecutarAccion({
    ruta: ENCARGADOS,
    esquema: z.object({ id: z.uuid(), activo: z.boolean() }),
    entrada: { id, activo },
    entidad: "el cliente",
    etiquetas: [],
    mensajeOk: activo
      ? "Cliente reactivado."
      : "Cliente desactivado. Ya no sale en la lista ni en el mapa.",
    hacer: async (d, { supabase }) => {
      const { error } = await supabase
        .from("clientes")
        .update({ activo: d.activo })
        .eq("id", d.id)
        .select("id")
        .single();
      return { error };
    },
  });
}

/** Hasta 3 fotos (ficha 8.3): toma el primer hueco libre del 1 al 3. */
export async function agregarFotoCliente(id: string, ruta: string): Promise<EstadoAccion> {
  return ejecutarAccion({
    ruta: TODOS,
    esquema: z.object({ id: z.uuid(), ruta: z.string().min(1) }),
    entrada: { id, ruta },
    entidad: "la foto",
    etiquetas: [],
    mensajeOk: "Foto añadida.",
    hacer: async (d, { supabase }) => {
      const { data: hay, error: errorLeer } = await supabase
        .from("cliente_fotos")
        .select("orden")
        .eq("cliente_id", d.id);
      if (errorLeer) return { error: errorLeer };
      const usados = new Set((hay ?? []).map((f) => f.orden));
      const orden = [1, 2, 3].find((n) => !usados.has(n));
      if (!orden) {
        return {
          error: { code: "P0001", message: "Ya tiene 3 fotos. Quita una antes de añadir otra." },
        };
      }
      const { error } = await supabase
        .from("cliente_fotos")
        .insert({ cliente_id: d.id, ruta: d.ruta, orden });
      return { error };
    },
  });
}

export async function quitarFotoCliente(fotoId: string): Promise<EstadoAccion> {
  return ejecutarAccion({
    ruta: ENCARGADOS,
    esquema: z.object({ id: z.uuid() }),
    entrada: { id: fotoId },
    entidad: "la foto",
    etiquetas: [],
    mensajeOk: "Foto quitada.",
    hacer: async ({ id }, { supabase }) => {
      const { data, error } = await supabase
        .from("cliente_fotos")
        .delete()
        .eq("id", id)
        .select("ruta")
        .single();
      if (error) return { error };
      // La fila ya no está; si el archivo no se borra, queda en el bucket
      // privado sin nadie que lo enseñe. Se registra para limpiarlo, no se
      // le echa la culpa a quien quitó la foto.
      const { error: errorArchivo } = await supabase.storage.from("clientes").remove([data.ruta]);
      if (errorArchivo)
        console.error(
          "[clientes] foto quitada, archivo sin borrar:",
          data.ruta,
          errorArchivo.message,
        );
      return { error: null };
    },
  });
}

/** Aviso de celular repetido (decisión 8). No bloquea: avisa. */
export async function buscarCelularRepetido(
  celular: string,
  excluir: string | null,
): Promise<{ id: string; nombre: string; zona: string | null } | null> {
  await exigirAcceso(TODOS);
  const numero = normalizarCelular(celular);
  if (numero.length < 6) return null;
  const supabase = await crearClienteServidor();
  let consulta = supabase
    .from("clientes")
    .select("id, nombre_completo, zonas_reparto(nombre)")
    .eq("celular", numero)
    .is("deleted_at", null)
    .limit(1);
  if (excluir) consulta = consulta.neq("id", excluir);
  const { data } = await consulta.maybeSingle();
  return data
    ? { id: data.id, nombre: data.nombre_completo, zona: data.zonas_reparto?.nombre ?? null }
    : null;
}
```

### Paso 3 — Las piezas

- [ ] En `src/components/panel/pestanas-formulario.tsx`: la firma pasa a
      `PestanasFormulario({ pestanas, inicial }: { pestanas: readonly Pestana[]; inicial?: string })`
      y el estado a `useState(inicial ?? pestanas[0]?.valor ?? "")`.

- [ ] En `src/components/panel/subida-imagen.tsx`: `type Bucket` añade `"clientes"`, y la vista
      previa no intenta una URL pública en el bucket privado:

```tsx
// El bucket `clientes` es privado: no hay URL pública que enseñar. La foto
// aparece en la lista de `FotosCliente` (por URL firmada) al refrescar.
const vista = bucket === "clientes" ? null : urlDeImagen(bucket, ruta);
```

      y en el texto de «Todavía no hay foto.», si `bucket === "clientes"` y hay `ruta`, decir
      «Foto subida.» en su lugar.

- [ ] En `src/components/panel/selector-ubicacion.tsx`, dos props nuevas, con los valores de hoy
      por defecto (configuración no cambia):

```tsx
type Props = {
  inicial: Punto | null;
  /** Clientes (F6, decisión 1): se puede dejar sin punto, tocar el mapa o usar el GPS. */
  opcional?: boolean;
  instruccion?: string;
};
```

      Con `opcional`: el estado es `Punto | null` (arranca en `inicial`); sin punto, el mapa se
      centra en Iquitos sin marcador y el campo oculto `coordenadas` va vacío; **tocar el mapa**
      pone o mueve el marcador (`instancia.on("click", …)`); un botón **«Usar mi ubicación»**
      (`navigator.geolocation.getCurrentPosition`, con un mensaje si el permiso se niega: «No se
      pudo leer tu ubicación. Toca el mapa en la casa del cliente.») y otro **«Quitar el punto»**.
      Los dos botones con la clase `boton-linea` (48 px). El texto de ayuda es `instruccion`, que por
      defecto sigue siendo «Arrastra el punto azul hasta la puerta del local.». El `aria-label` del
      marcador dice «Casa del cliente» cuando `opcional`.

- [ ] Crear `src/components/panel/fotos-cliente.tsx`:

```tsx
"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { agregarFotoCliente, quitarFotoCliente } from "@/lib/acciones/clientes";
import type { FotoCliente } from "@/lib/clientes/datos";

import { ConfirmarBorrado } from "./confirmar-borrado";
import { SubidaImagen } from "./subida-imagen";

type Props = { clienteId: string | null; fotos: FotoCliente[]; puedeQuitar: boolean };

/**
 * Hasta 3 fotos de la fachada (ficha 8.3), en el bucket PRIVADO: se ven por URL
 * firmada. Al crear no hay cliente todavía y la política de Storage (0014) exige
 * una carpeta de un cliente que exista: se pide guardar primero, como en F4.
 */
export function FotosCliente({ clienteId, fotos, puedeQuitar }: Props) {
  const router = useRouter();
  if (!clienteId) {
    return (
      <p className="bg-muted rounded-xl border border-dashed p-4 text-sm" data-fotos-bloqueadas>
        <strong>Primero guarda el cliente</strong> y después podrás añadir hasta 3 fotos de la
        fachada.
      </p>
    );
  }
  const id = clienteId;
  return (
    <div className="flex flex-col gap-4">
      {fotos.length > 0 ? (
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-3" aria-label="Fotos de la fachada">
          {fotos.map((f) => (
            <li key={f.id} className="bg-card flex flex-col gap-2 rounded-xl border p-2">
              {f.url ? (
                // eslint-disable-next-line @next/next/no-img-element -- URL firmada de un bucket privado (ver la ficha)
                <img
                  src={f.url}
                  alt={`Fachada de la casa, foto ${f.orden}`}
                  className="aspect-[4/3] w-full rounded-lg object-cover"
                />
              ) : null}
              {puedeQuitar ? (
                <ConfirmarBorrado
                  nombre={`la foto ${f.orden}`}
                  aviso="La foto se borra del sistema. No se puede deshacer."
                  accion={quitarFotoCliente.bind(null, f.id)}
                />
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}
      {fotos.length < 3 ? (
        <SubidaImagen
          nombre="foto_nueva"
          bucket="clientes"
          carpeta={id}
          rutaInicial={null}
          etiqueta={`Añadir una foto de la fachada (${fotos.length} de 3)`}
          aceptar="image/*"
          maximoBytes={2 * 1024 * 1024}
          alSubir={async (ruta) => {
            const r = await agregarFotoCliente(id, ruta);
            if (r.estado === "ok") {
              toast.success(r.mensaje);
              router.refresh();
            }
            if (r.estado === "error") toast.error(r.mensaje);
          }}
        />
      ) : (
        <p className="text-muted-foreground text-sm">
          Ya tiene 3 fotos. Quita una para añadir otra.
        </p>
      )}
    </div>
  );
}
```

> `maximoBytes` de 2 MB: el límite del bucket `clientes` en `config.toml`. Comprueba que
> `ConfirmarBorrado` acepta `aviso` (lo añadió F5 para insumos); si no, usar el aviso por defecto.

- [ ] Crear `src/components/panel/boton-activo-cliente.tsx`:

```tsx
"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";

import { cambiarActivoCliente } from "@/lib/acciones/clientes";

export function BotonActivoCliente({ id, activo }: { id: string; activo: boolean }) {
  const router = useRouter();
  const [pendiente, iniciar] = useTransition();
  return (
    <button
      type="button"
      className="boton-linea"
      disabled={pendiente}
      onClick={() =>
        iniciar(async () => {
          const r = await cambiarActivoCliente(id, !activo);
          if (r.estado === "ok") {
            toast.success(r.mensaje);
            router.refresh();
          }
          if (r.estado === "error") toast.error(r.mensaje);
        })
      }
    >
      {activo ? "Desactivar" : "Reactivar"}
    </button>
  );
}
```

### Paso 4 — El formulario del cliente

- [ ] Crear `src/app/(admin)/admin/clientes/formulario-cliente.tsx`:

```tsx
"use client";

import Link from "next/link";
import { useState } from "react";

import { BarraGuardar } from "@/components/panel/barra-guardar";
import { Campo } from "@/components/panel/campo";
import { FormularioPanel } from "@/components/panel/formulario-panel";
import { FotosCliente } from "@/components/panel/fotos-cliente";
import { PestanasFormulario } from "@/components/panel/pestanas-formulario";
import { SelectorUbicacion } from "@/components/panel/selector-ubicacion";
import { buscarCelularRepetido, editarCliente, registrarCliente } from "@/lib/acciones/clientes";
import type { FichaCliente } from "@/lib/clientes/datos";
import { claveDeBorrador } from "@/lib/panel/borrador";
import { validarCliente } from "@/lib/validaciones/cliente";

type Props = {
  cliente: FichaCliente | null;
  zonas: { id: string; nombre: string }[];
  /** El texto del permiso ya con el número del negocio (`textoDelPermiso`). */
  textoPermiso: string;
  pestana?: string;
};

export function FormularioCliente({ cliente, zonas, textoPermiso, pestana }: Props) {
  const [repetido, setRepetido] = useState<{
    id: string;
    nombre: string;
    zona: string | null;
  } | null>(null);
  const volver = cliente ? `/admin/clientes/${cliente.id}` : "/admin/clientes";

  return (
    <FormularioPanel
      clave={claveDeBorrador("cliente", cliente?.id ?? null)}
      accion={cliente ? editarCliente : registrarCliente}
      validar={validarCliente}
      destino={(id) =>
        cliente ? `/admin/clientes/${cliente.id}` : `/admin/clientes/${id}/editar?pestana=fotos`
      }
    >
      {cliente ? <input type="hidden" name="id" value={cliente.id} /> : null}
      <PestanasFormulario
        inicial={pestana}
        pestanas={[
          {
            valor: "datos",
            titulo: "Datos",
            campos: [
              "nombre_completo",
              "celular",
              "direccion",
              "referencia",
              "zona_id",
              "observacion",
            ],
            contenido: (
              <>
                <Campo nombre="nombre_completo" etiqueta="Nombre y apellido">
                  {(p) => (
                    <input
                      {...p}
                      defaultValue={cliente?.nombre_completo ?? ""}
                      autoComplete="off"
                    />
                  )}
                </Campo>
                <Campo nombre="celular" etiqueta="Celular">
                  {(p) => (
                    <input
                      {...p}
                      inputMode="tel"
                      defaultValue={cliente?.celular ?? ""}
                      onBlur={async (e) =>
                        setRepetido(
                          await buscarCelularRepetido(e.currentTarget.value, cliente?.id ?? null),
                        )
                      }
                    />
                  )}
                </Campo>
                {repetido ? (
                  <p
                    role="status"
                    className="bg-muted rounded-xl p-3 text-sm"
                    data-celular-repetido
                  >
                    Este celular ya es de {repetido.nombre}
                    {repetido.zona ? ` (${repetido.zona})` : ""}.{" "}
                    <Link href={`/admin/clientes/${repetido.id}`} className="underline">
                      Ver su ficha
                    </Link>
                    . Si es otra persona con el mismo número, puedes seguir.
                  </p>
                ) : null}
                <Campo nombre="direccion" etiqueta="Dirección">
                  {(p) => <input {...p} defaultValue={cliente?.direccion ?? ""} />}
                </Campo>
                <Campo
                  nombre="referencia"
                  etiqueta="Referencia"
                  ayuda="Cómo reconocer la casa: color del portón, qué hay al frente."
                >
                  {(p) => <input {...p} defaultValue={cliente?.referencia ?? ""} />}
                </Campo>
                <Campo nombre="zona_id" etiqueta="Zona">
                  {(p) => (
                    <select {...p} defaultValue={cliente?.zona_id ?? ""}>
                      <option value="">Elige…</option>
                      {zonas.map((z) => (
                        <option key={z.id} value={z.id}>
                          {z.nombre}
                        </option>
                      ))}
                    </select>
                  )}
                </Campo>
                <Campo nombre="observacion" etiqueta="Observación" opcional>
                  {(p) => <textarea {...p} rows={2} defaultValue={cliente?.observacion ?? ""} />}
                </Campo>
              </>
            ),
          },
          {
            valor: "fotos",
            titulo: "Ubicación y fotos",
            campos: ["coordenadas"],
            contenido: (
              <>
                <SelectorUbicacion
                  opcional
                  instruccion="Si sabes dónde está la casa, tócala en el mapa o usa tu ubicación. Si no, déjalo: basta la dirección."
                  inicial={
                    cliente?.latitud !== null &&
                    cliente?.latitud !== undefined &&
                    cliente.longitud !== null
                      ? { lat: cliente.latitud, lng: cliente.longitud }
                      : null
                  }
                />
                <FotosCliente
                  clienteId={cliente?.id ?? null}
                  fotos={cliente?.fotos ?? []}
                  puedeQuitar
                />
              </>
            ),
          },
          {
            valor: "permiso",
            titulo: "Permiso",
            campos: ["permiso"],
            contenido: cliente ? (
              <p className="text-sm">
                {cliente.permiso
                  ? `Aceptó el texto ${cliente.permiso.texto_version}. El permiso no se vuelve a pedir al editar.`
                  : "Sin permiso vigente."}
              </p>
            ) : (
              <>
                <p
                  className="bg-card rounded-xl border p-4 text-lg leading-relaxed"
                  data-texto-permiso
                >
                  {textoPermiso}
                </p>
                <Campo nombre="permiso" etiqueta="Se lo leí y aceptó">
                  {(p) => <input {...p} type="checkbox" className="size-6" />}
                </Campo>
              </>
            ),
          },
        ]}
      />
      <BarraGuardar volver={volver} />
    </FormularioPanel>
  );
}
```

> `Campo` pone la etiqueta y el error; si con `type="checkbox"` la etiqueta no queda al lado de la
> casilla, envolver la casilla en un `<label className="flex min-h-11 items-center gap-3">` propio
> con el mismo `name="permiso"`, y el error de `errores.permiso` debajo (patrón de `Interruptor`).

### Paso 5 — Las páginas

- [ ] Crear `src/app/(admin)/admin/clientes/nuevo/page.tsx`:

```tsx
import { Suspense } from "react";

import { EncabezadoPanel } from "@/components/panel/encabezado-panel";
import { exigirAcceso } from "@/lib/auth/sesion";
import { zonasActivas } from "@/lib/clientes/datos";
import { textoDelPermiso } from "@/lib/clientes/permiso";
import { obtenerConfiguracion } from "@/lib/datos/configuracion";
import { numeroParaLeer } from "@/lib/datos/pedido";

import { FormularioCliente } from "../formulario-cliente";

export default function NuevoCliente() {
  return (
    <>
      <EncabezadoPanel
        titulo="Nuevo cliente"
        descripcion="Antes de guardar, léele el texto de la pestaña Permiso."
        volver={{ ruta: "/admin/clientes", nombre: "Clientes" }}
      />
      <Suspense fallback={<p className="text-muted-foreground text-sm">Cargando…</p>}>
        <Formulario />
      </Suspense>
    </>
  );
}

async function Formulario() {
  await exigirAcceso("/admin/clientes/nuevo");
  const [zonas, config] = await Promise.all([zonasActivas(), obtenerConfiguracion()]);
  const texto = textoDelPermiso(numeroParaLeer(config.whatsapp) ?? config.whatsapp);
  return <FormularioCliente cliente={null} zonas={zonas} textoPermiso={texto} />;
}
```

- [ ] Crear `src/app/(admin)/admin/clientes/[id]/editar/page.tsx`:

```tsx
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";

import { EncabezadoPanel } from "@/components/panel/encabezado-panel";
import { exigirAcceso } from "@/lib/auth/sesion";
import { leerFicha, zonasActivas } from "@/lib/clientes/datos";

import { FormularioCliente } from "../../formulario-cliente";

type Props = PageProps<"/admin/clientes/[id]/editar">;

export default function EditarCliente(props: Props) {
  return (
    <Suspense fallback={<p className="text-muted-foreground text-sm">Cargando…</p>}>
      <Contenido {...props} />
    </Suspense>
  );
}

async function Contenido({ params, searchParams }: Props) {
  const [{ id }, { pestana }, sesion] = await Promise.all([
    params,
    searchParams,
    exigirAcceso("/admin/clientes"),
  ]);
  // El repartidor corrige; no edita (decisión 2). Su lápiz ya lleva a «corregir».
  if (sesion.rol === "repartidor") redirect(`/admin/clientes/${id}/corregir`);
  const [cliente, zonas] = await Promise.all([leerFicha(id), zonasActivas()]);
  if (!cliente || cliente.borrado) notFound();
  // Si su zona se desactivó, se sigue ofreciendo para no cambiársela sin querer.
  const conSuZona =
    cliente.zona_id && !zonas.some((z) => z.id === cliente.zona_id)
      ? [...zonas, { id: cliente.zona_id, nombre: `${cliente.zona ?? "Zona"} (desactivada)` }]
      : zonas;
  return (
    <>
      <EncabezadoPanel
        titulo={`Editar: ${cliente.nombre_completo}`}
        volver={{ ruta: `/admin/clientes/${id}`, nombre: "Ficha" }}
      />
      <FormularioCliente
        cliente={cliente}
        zonas={conSuZona}
        textoPermiso=""
        pestana={typeof pestana === "string" ? pestana : undefined}
      />
    </>
  );
}
```

- [ ] Crear `src/app/(admin)/admin/clientes/[id]/corregir/formulario-correccion.tsx`:

```tsx
"use client";

import { BarraGuardar } from "@/components/panel/barra-guardar";
import { Campo } from "@/components/panel/campo";
import { FormularioPanel } from "@/components/panel/formulario-panel";
import { FotosCliente } from "@/components/panel/fotos-cliente";
import { SelectorUbicacion } from "@/components/panel/selector-ubicacion";
import { corregirCliente } from "@/lib/acciones/clientes";
import type { FichaCliente } from "@/lib/clientes/datos";
import { claveDeBorrador } from "@/lib/panel/borrador";
import { validarCorreccion } from "@/lib/validaciones/cliente";

/** Lo que el repartidor descubre en la puerta (decisión 2): referencia, punto y fotos. */
export function FormularioCorreccion({
  cliente,
  puedeQuitarFotos,
}: {
  cliente: FichaCliente;
  puedeQuitarFotos: boolean;
}) {
  return (
    <FormularioPanel
      clave={claveDeBorrador("correccion-cliente", cliente.id)}
      accion={corregirCliente}
      validar={validarCorreccion}
      destino={() => `/admin/clientes/${cliente.id}`}
    >
      <input type="hidden" name="id" value={cliente.id} />
      <Campo
        nombre="referencia"
        etiqueta="Referencia"
        ayuda="Cómo reconocer la casa: color del portón, qué hay al frente."
      >
        {(p) => <input {...p} defaultValue={cliente.referencia ?? ""} />}
      </Campo>
      <SelectorUbicacion
        opcional
        instruccion="Toca la casa en el mapa o, si estás en la puerta, usa tu ubicación."
        inicial={
          cliente.latitud !== null && cliente.longitud !== null
            ? { lat: cliente.latitud, lng: cliente.longitud }
            : null
        }
      />
      <FotosCliente clienteId={cliente.id} fotos={cliente.fotos} puedeQuitar={puedeQuitarFotos} />
      <BarraGuardar volver={`/admin/clientes/${cliente.id}`} />
    </FormularioPanel>
  );
}
```

- [ ] Crear `src/app/(admin)/admin/clientes/[id]/corregir/page.tsx`:

```tsx
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { EncabezadoPanel } from "@/components/panel/encabezado-panel";
import { exigirAcceso } from "@/lib/auth/sesion";
import { leerFicha } from "@/lib/clientes/datos";

import { FormularioCorreccion } from "./formulario-correccion";

type Props = PageProps<"/admin/clientes/[id]/corregir">;

export default function CorregirCliente({ params }: Props) {
  return (
    <Suspense fallback={<p className="text-muted-foreground text-sm">Cargando…</p>}>
      <Contenido params={params} />
    </Suspense>
  );
}

async function Contenido({ params }: Pick<Props, "params">) {
  const [{ id }, sesion] = await Promise.all([params, exigirAcceso("/admin/clientes")]);
  const cliente = await leerFicha(id);
  if (!cliente || cliente.borrado) notFound();
  return (
    <>
      <EncabezadoPanel
        titulo={`Corregir: ${cliente.nombre_completo}`}
        descripcion="La referencia, el punto en el mapa y las fotos. El nombre y el celular los cambia un encargado."
        volver={{ ruta: `/admin/clientes/${id}`, nombre: "Ficha" }}
      />
      <FormularioCorreccion cliente={cliente} puedeQuitarFotos={sesion.rol !== "repartidor"} />
    </>
  );
}
```

- [ ] En `src/app/(admin)/admin/clientes/[id]/page.tsx`: importar `BotonActivoCliente` y, en la
      `accion` del encabezado, para los encargados y si no está borrado, poner
      `<BotonActivoCliente id={id} activo={cliente.activo} />` junto al enlace de editar (dentro de
      un `<div className="flex flex-wrap gap-2">`).

### Paso 6 — Pruebas de navegador

- [ ] Crear `e2e/panel-clientes-registro.spec.ts`:

```ts
import { expect, test } from "@playwright/test";

import { borrarClienteDePrueba, crearClienteDePrueba } from "./ayudas/clientes";
import { fotoDePrueba } from "./ayudas/foto";
import { sesionDeApi } from "./ayudas/insumos";
import { entrarComo } from "./ayudas/sesion";
import { borrarUsuario } from "./ayudas/usuarios";

test.beforeEach(({}, info) => {
  test.skip(
    info.project.name !== "movil",
    "el registro se hace desde el celular o la computadora; uno basta",
  );
});

async function idPorNombre(nombre: string): Promise<string[]> {
  const { data } = await (
    await sesionDeApi("administrador")
  )
    .from("clientes")
    .select("id")
    .eq("nombre_completo", nombre);
  return (data ?? []).map((c) => c.id);
}

async function llenarDatos(page: import("@playwright/test").Page, nombre: string, celular: string) {
  await page.goto("/admin/clientes/nuevo");
  await page.getByLabel("Nombre y apellido").fill(nombre);
  await page.getByLabel("Celular").fill(celular);
  await page.getByLabel("Dirección").fill("Jirón Próspero 450");
  await page.getByLabel("Referencia").fill("Portón verde, frente a la bodega");
  await page.getByLabel("Zona").selectOption({ label: "Belén" });
}

test("el ingeniero registra con permiso y punto, y añade la foto de la fachada", async ({
  page,
  context,
}) => {
  const nombre = `Registro E2E ${Date.now()}`;
  await context.grantPermissions(["geolocation"]);
  await context.setGeolocation({ latitude: -3.7612, longitude: -73.2489 });
  const usuario = await entrarComo(page, "ingeniero");
  try {
    await llenarDatos(page, nombre, "+51 912 345 678");
    await page.getByRole("tab", { name: "Ubicación y fotos" }).click();
    await page.getByRole("button", { name: "Usar mi ubicación" }).click();
    await expect(page.locator("[data-fotos-bloqueadas]")).toBeVisible();
    await page.getByRole("tab", { name: "Permiso" }).click();
    await expect(page.locator("[data-texto-permiso]")).toContainText("tres fotos de la fachada");
    await page.getByLabel("Se lo leí y aceptó").check();
    await page.getByRole("button", { name: "Guardar" }).click();

    await page.waitForURL(/\/admin\/clientes\/[0-9a-f-]{36}\/editar\?pestana=fotos/);
    await page
      .getByLabel(/Elegir de la galería para Añadir una foto de la fachada/)
      .setInputFiles(await fotoDePrueba(page));
    await expect(page.getByRole("img", { name: "Fachada de la casa, foto 1" })).toBeVisible();

    const [id] = await idPorNombre(nombre);
    await page.goto(`/admin/clientes/${id}`);
    await expect(page.getByText("912 345 678")).toBeVisible(); // guardado normalizado, sin el 51
    await expect(page.getByRole("link", { name: "Cómo llegar" })).toHaveAttribute(
      "href",
      /destination=-3\.7612,-73\.2489/,
    );
  } finally {
    for (const id of await idPorNombre(nombre)) await borrarClienteDePrueba(id);
    await borrarUsuario(usuario.id);
  }
});

test("sin el permiso marcado no se guarda, y lo dice en su pestaña", async ({ page }) => {
  const nombre = `Sin Permiso E2E ${Date.now()}`;
  const usuario = await entrarComo(page, "ingeniero");
  try {
    await llenarDatos(page, nombre, "912000111");
    await page.getByRole("button", { name: "Guardar" }).click();
    await expect(page.getByText("Léele el texto y marca «Se lo leí y aceptó»")).toBeVisible();
    expect(await idPorNombre(nombre)).toHaveLength(0);
  } finally {
    await borrarUsuario(usuario.id);
  }
});

test("un celular repetido avisa con enlace a su ficha, y deja seguir", async ({ page }) => {
  const marca = Date.now();
  const celular = `9${String(marca).slice(-8)}`;
  const existente = await crearClienteDePrueba({ nombre: `Dueña E2E ${marca}`, celular });
  const usuario = await entrarComo(page, "ingeniero");
  try {
    await llenarDatos(
      page,
      `Pariente E2E ${marca}`,
      `${celular.slice(0, 3)} ${celular.slice(3, 6)} ${celular.slice(6)}`,
    );
    await page.getByLabel("Dirección").click(); // sale del celular: se comprueba
    const aviso = page.locator("[data-celular-repetido]");
    await expect(aviso).toContainText(`Dueña E2E ${marca}`);
    await expect(aviso.getByRole("link", { name: "Ver su ficha" })).toHaveAttribute(
      "href",
      `/admin/clientes/${existente}`,
    );
  } finally {
    await borrarClienteDePrueba(existente);
    await borrarUsuario(usuario.id);
  }
});

test("el alta pulsada dos veces no deja dos clientes (Review Focus)", async ({ page }) => {
  const nombre = `Doble E2E ${Date.now()}`;
  const usuario = await entrarComo(page, "ingeniero");
  try {
    await llenarDatos(page, nombre, "912000222");
    await page.getByRole("tab", { name: "Permiso" }).click();
    await page.getByLabel("Se lo leí y aceptó").check();
    await page.getByRole("button", { name: "Guardar" }).dblclick();
    await page.waitForURL(/\/editar\?pestana=fotos/);
    expect(await idPorNombre(nombre)).toHaveLength(1);
  } finally {
    for (const id of await idPorNombre(nombre)) await borrarClienteDePrueba(id);
    await borrarUsuario(usuario.id);
  }
});

test("el repartidor corrige la referencia y el punto, y no llega a editar datos", async ({
  page,
  context,
}) => {
  const id = await crearClienteDePrueba({ nombre: `Corregir E2E ${Date.now()}` });
  await context.grantPermissions(["geolocation"]);
  await context.setGeolocation({ latitude: -3.7555, longitude: -73.2444 });
  const usuario = await entrarComo(page, "repartidor");
  try {
    await page.goto(`/admin/clientes/${id}/editar`);
    await page.waitForURL(`/admin/clientes/${id}/corregir`);
    await expect(page.getByLabel("Nombre y apellido")).toHaveCount(0);
    await page.getByLabel("Referencia").fill("Portón azul, al lado de la farmacia");
    await page.getByRole("button", { name: "Usar mi ubicación" }).click();
    await page.getByRole("button", { name: "Guardar" }).click();
    await page.waitForURL(`/admin/clientes/${id}`);
    await expect(page.getByText("Portón azul, al lado de la farmacia")).toBeVisible();
    await expect(page.getByRole("link", { name: "Cómo llegar" })).toHaveAttribute(
      "href",
      /-3\.7555,-73\.2444/,
    );
  } finally {
    await borrarClienteDePrueba(id);
    await borrarUsuario(usuario.id);
  }
});

test("el ingeniero desactiva y reactiva a un cliente", async ({ page }) => {
  const nombre = `Desactivar E2E ${Date.now()}`;
  const id = await crearClienteDePrueba({ nombre });
  const usuario = await entrarComo(page, "ingeniero");
  try {
    await page.goto(`/admin/clientes/${id}`);
    await page.getByRole("button", { name: "Desactivar" }).click();
    await expect(page.getByText("Desactivado: no sale en la lista ni en el mapa.")).toBeVisible();
    await page.goto(`/admin/clientes?q=${encodeURIComponent(nombre)}&estado=desactivados`);
    await expect(page.getByRole("link", { name: new RegExp(nombre) }).first()).toBeVisible();
    await page.goto(`/admin/clientes/${id}`);
    await page.getByRole("button", { name: "Reactivar" }).click();
    await expect(page.getByText("Desactivado: no sale en la lista ni en el mapa.")).toHaveCount(0);
  } finally {
    await borrarClienteDePrueba(id);
    await borrarUsuario(usuario.id);
  }
});
```

- [ ] En `e2e/panel-accesibilidad.spec.ts`, añadir `"/admin/clientes/nuevo"` a `RUTAS_DEL_PANEL`.
- [ ] `pnpm build` y `pnpm exec playwright test e2e/panel-clientes-registro.spec.ts e2e/panel-clientes.spec.ts`
      **Esperado:** verde. Si «el alta pulsada dos veces» deja dos clientes, el doble clic cuela
      un segundo envío antes de que `pendiente` pinte el botón bloqueado: en
      `src/components/panel/formulario-panel.tsx`, un `useRef(false)` `enviando` que `onSubmit`
      comprueba al principio (`if (enviando.current) return; enviando.current = true;`) y que se
      suelta al terminar la transición; y repetir la prueba (**Esperado:** 1 cliente).
- [ ] `pnpm exec playwright test e2e/panel-accesibilidad.spec.ts -g "clientes"`
      **Esperado:** verde (axe y 44 px en `/admin/clientes` y `/admin/clientes/nuevo`).

### Paso 7 — Cerrar la tarea y el PR de T3 + T4

- [ ] `pnpm typecheck && pnpm lint && pnpm test`
- [ ] Commit:

```bash
git add src/lib/validaciones/cliente.ts src/lib/validaciones/cliente.test.ts src/lib/acciones/clientes.ts \
        src/components/panel "src/app/(admin)/admin/clientes" e2e/panel-clientes-registro.spec.ts \
        e2e/panel-accesibilidad.spec.ts
git commit -m "feat(clientes): registrar con permiso, corregir en la puerta y desactivar"
```

- [ ] Revisión de la rama (T3 + T4) con un subagente; lo Importante, arreglado con prueba vista
      fallar.
- [ ] PR con las dos tareas (sin migración, sin atribución). Dan lo fusiona; no hay `db push`.

---

## Tarea 5 — Zonas, borrar a pedido y conservación

**Rama:** `feat/f6-t5-t6-administracion` (desde `main` con T3+T4 fusionadas) · **Migración:** no ·
**PR:** no se abre aquí; va junto con la T6.

**Qué deja hecho:** la administración gestiona las zonas (crear, renombrar, ordenar, retirar; la
base impide retirar una zona con clientes activos); borra de verdad los datos de un cliente que lo
pide, con motivo, y los archivos de sus fotos (con reintento si Storage falla); y ve, en el inicio y
en `/admin/clientes/revisar`, a los clientes sin cambios en dos años.

**Files:**

- Create: `src/lib/validaciones/zona.ts` + `.test.ts`, `src/lib/acciones/zonas.ts`
- Create: `src/app/(admin)/admin/clientes/zonas/{page.tsx,formulario-zona.tsx,nueva/page.tsx,[id]/page.tsx}`
- Modify: `src/lib/acciones/clientes.ts` (`borrarDatosCliente`, `borrarFotosQueQuedaron`)
- Create: `src/components/panel/borrar-datos-cliente.tsx`
- Modify: `src/app/(admin)/admin/clientes/[id]/page.tsx` (botón y aviso de fotos que quedaron)
- Create: `src/app/(admin)/admin/clientes/revisar/page.tsx`, `.../revisar/boton-sigue-cliente.tsx`
- Modify: `src/app/(admin)/admin/page.tsx` (aviso «clientes para revisar»)
- Modify: `src/app/(admin)/admin/clientes/page.tsx` (enlaces «Zonas» y «Para revisar», solo administración)
- Modify: `src/lib/acciones/orden.ts` (`zonas_reparto` ordenable)
- Create: `e2e/panel-clientes-administracion.spec.ts` · Modify: `e2e/panel-accesibilidad.spec.ts`,
  `e2e/ayudas/base.ts` (`sqlLocal`)

**Interfaces:**

- Consumes: `public.borrar_datos_cliente(p_id uuid, p_motivo text) returns table (ruta text)`,
  `public.clientes_para_revisar (id, nombre_completo, zona, ultima_actividad)`, el trigger
  `zonas_bloquear_retiro` (P0001 «La zona … tiene N clientes activos…»), `leerFicha`,
  `crearClienteDePrueba`, `borrarClienteDePrueba`, `moverFila`.
- Produces: `esquemaZona`, `leerZona`, `validarZona`; `guardarZona(fd)`, `cambiarActivaZona(id,
activa)`; `borrarDatosCliente(id: string, motivo: string): Promise<EstadoAccion>` (con
  `extra.fotosSinBorrar` = número, en texto, cuando Storage falla) y
  `borrarFotosQueQuedaron(id: string): Promise<EstadoAccion>`, `seguirComoCliente(id: string): Promise<EstadoAccion>`.

### Paso 1 — El esquema de la zona, primero la prueba

- [ ] Crear `src/lib/validaciones/zona.test.ts`:

```ts
import { describe, expect, it } from "vitest";

import { esquemaZona } from "./zona";

describe("esquemaZona", () => {
  it("pide un nombre", () => {
    expect(esquemaZona.safeParse({ id: null, nombre: " ", descripcion: null }).success).toBe(false);
  });
  it("limpia los espacios del nombre", () => {
    const r = esquemaZona.safeParse({ id: null, nombre: "  Carretera  ", descripcion: null });
    expect(r.success && r.data.nombre).toBe("Carretera");
  });
  it("la descripción es opcional y corta", () => {
    expect(
      esquemaZona.safeParse({ id: null, nombre: "Centro", descripcion: "x".repeat(201) }).success,
    ).toBe(false);
  });
});
```

- [ ] `pnpm test -- src/lib/validaciones/zona.test.ts` → **Esperado:** FALLA (no existe `./zona`).

- [ ] Crear `src/lib/validaciones/zona.ts`:

```ts
import * as z from "zod";

import { texto, textoOpcional } from "@/lib/panel/formulario";

import { erroresPorCampo } from "./movimiento";

export const esquemaZona = z.object({
  id: z.uuid().nullable(),
  nombre: z
    .string()
    .trim()
    .min(2, { error: "Escribe el nombre de la zona." })
    .max(60, { error: "Máximo 60 letras." }),
  descripcion: z.string().trim().max(200, { error: "Máximo 200 letras." }).nullable(),
});

export function leerZona(fd: FormData) {
  return {
    id: textoOpcional(fd, "id"),
    nombre: texto(fd, "nombre"),
    descripcion: textoOpcional(fd, "descripcion"),
  };
}

export function validarZona(fd: FormData) {
  const r = esquemaZona.safeParse(leerZona(fd));
  return r.success ? {} : erroresPorCampo(r.error);
}
```

- [ ] `pnpm test -- src/lib/validaciones/zona.test.ts` → **Esperado:** PASAN (3).

### Paso 2 — Acciones de zonas

- [ ] Crear `src/lib/acciones/zonas.ts`:

```ts
"use server";

import * as z from "zod";

import { ejecutarAccion, type EstadoAccion } from "@/lib/panel/accion";
import { esquemaZona, leerZona } from "@/lib/validaciones/zona";

const RUTA = "/admin/clientes/zonas";

export async function guardarZona(fd: FormData): Promise<EstadoAccion> {
  return ejecutarAccion({
    ruta: RUTA,
    esquema: esquemaZona,
    entrada: leerZona(fd),
    entidad: "una zona", // 23505 → «Ya hay una zona con ese nombre» (índice lower(nombre) de 0013)
    etiquetas: [],
    mensajeOk: "Zona guardada.",
    hacer: async (d, { supabase }) => {
      const fila = { nombre: d.nombre, descripcion: d.descripcion };
      if (d.id) {
        const { error } = await supabase
          .from("zonas_reparto")
          .update(fila)
          .eq("id", d.id)
          .is("deleted_at", null)
          .select("id")
          .single();
        return { error, id: d.id };
      }
      // Al final de la lista: el orden lo cambian las flechas.
      const { data: ultima } = await supabase
        .from("zonas_reparto")
        .select("orden")
        .order("orden", { ascending: false })
        .limit(1)
        .maybeSingle();
      const { data, error } = await supabase
        .from("zonas_reparto")
        .insert({ ...fila, orden: (ultima?.orden ?? 0) + 1 })
        .select("id")
        .single();
      return { error, id: data?.id };
    },
  });
}

/** Retirar una zona con clientes activos lo impide la base (0042) con la frase de qué hacer. */
export async function cambiarActivaZona(id: string, activa: boolean): Promise<EstadoAccion> {
  return ejecutarAccion({
    ruta: RUTA,
    esquema: z.object({ id: z.uuid(), activa: z.boolean() }),
    entrada: { id, activa },
    entidad: "la zona",
    etiquetas: [],
    mensajeOk: activa ? "Zona activada." : "Zona retirada. Ya no se ofrece al registrar clientes.",
    hacer: async (d, { supabase }) => {
      const { error } = await supabase
        .from("zonas_reparto")
        .update({ activo: d.activa })
        .eq("id", d.id)
        .select("id")
        .single();
      return { error };
    },
  });
}
```

- [ ] En `src/lib/acciones/orden.ts`, `zonas_reparto` entra en `TablaOrdenable` y en `DESTINO`
      con `{ ruta: "/admin/clientes/zonas", etiqueta: null }`, y la llamada a `ejecutarAccion` pasa
      `etiquetas: etiqueta ? [etiqueta] : []` (las zonas no tocan el sitio público). El tipo del mapa
      pasa a `{ ruta: string; etiqueta: Etiqueta | null }`. Añadir su rama en `leer()` y `escribir()`,
      igual que `categorias_producto` pero sobre `zonas_reparto` (el `switch` existe porque
      supabase-js pierde el tipo con una unión de nombres).

### Paso 3 — Pantallas de zonas

- [ ] Crear `src/app/(admin)/admin/clientes/zonas/page.tsx`:

```tsx
import { Plus } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";

import { BotonesOrden } from "@/components/panel/botones-orden";
import { EncabezadoPanel } from "@/components/panel/encabezado-panel";
import { ListaAdaptable } from "@/components/panel/lista-adaptable";
import { moverFila } from "@/lib/acciones/orden";
import { exigirAcceso } from "@/lib/auth/sesion";
import { crearClienteServidor } from "@/lib/supabase/servidor";

import { BotonActivaZona } from "./boton-activa-zona";

const RUTA = "/admin/clientes/zonas";

export default function Zonas() {
  return (
    <>
      <EncabezadoPanel
        titulo="Zonas de reparto"
        descripcion="Las que se ofrecen al registrar un cliente. Una zona con clientes activos no se puede retirar."
        volver={{ ruta: "/admin/clientes", nombre: "Clientes" }}
        accion={
          <Link href={`${RUTA}/nueva`} className="boton-cta">
            <Plus aria-hidden className="size-5" /> Nueva zona
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
    .from("zonas_reparto")
    .select("id, nombre, activo, orden, clientes(count)")
    .is("deleted_at", null)
    .eq("clientes.activo", true)
    .is("clientes.deleted_at", null)
    .order("orden")
    .order("id");
  if (error) return <p role="alert">No se pudieron cargar las zonas. Recarga la página.</p>;

  const filas = data.map((z) => ({ ...z, clientes: z.clientes[0]?.count ?? 0 }));
  return (
    <ListaAdaptable
      etiqueta="Zonas de reparto"
      filas={filas}
      enlace={(z) => `${RUTA}/${z.id}`}
      editar={(z) => `${RUTA}/${z.id}`}
      columnas={[
        { titulo: "Zona", celda: (z) => z.nombre, principal: true },
        { titulo: "Clientes activos", celda: (z) => String(z.clientes) },
        { titulo: "Estado", celda: (z) => (z.activo ? "Activa" : "Retirada") },
      ]}
      acciones={(z) => (
        <>
          <BotonesOrden
            nombre={`la zona ${z.nombre}`}
            subir={moverFila.bind(null, "zonas_reparto", z.id, "arriba")}
            bajar={moverFila.bind(null, "zonas_reparto", z.id, "abajo")}
            primero={z.id === filas[0]?.id}
            ultimo={z.id === filas.at(-1)?.id}
          />
          <BotonActivaZona id={z.id} nombre={z.nombre} activa={z.activo} />
        </>
      )}
      vacio={<p>No hay zonas. Crea la primera con «Nueva zona».</p>}
    />
  );
}
```

> Si el `select` con el filtro sobre la relación (`clientes(count)` + `.eq("clientes.activo", true)`)
> no cuadra con los tipos generados, contar aparte con una consulta por `zona_id` agrupada en JS
> (`select("zona_id").eq("activo", true).is("deleted_at", null)`) y sumar por zona.

- [ ] Crear `src/app/(admin)/admin/clientes/zonas/boton-activa-zona.tsx`:

```tsx
"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";

import { cambiarActivaZona } from "@/lib/acciones/zonas";

export function BotonActivaZona({
  id,
  nombre,
  activa,
}: {
  id: string;
  nombre: string;
  activa: boolean;
}) {
  const router = useRouter();
  const [pendiente, iniciar] = useTransition();
  return (
    <button
      type="button"
      className="boton-linea shrink-0"
      disabled={pendiente}
      aria-label={`${activa ? "Retirar" : "Activar"} la zona ${nombre}`}
      onClick={() =>
        iniciar(async () => {
          const r = await cambiarActivaZona(id, !activa);
          if (r.estado === "ok") {
            toast.success(r.mensaje);
            router.refresh();
          }
          if (r.estado === "error") toast.error(r.mensaje);
        })
      }
    >
      {activa ? "Retirar" : "Activar"}
    </button>
  );
}
```

- [ ] Crear `src/app/(admin)/admin/clientes/zonas/formulario-zona.tsx`:

```tsx
"use client";

import { BarraGuardar } from "@/components/panel/barra-guardar";
import { Campo } from "@/components/panel/campo";
import { FormularioPanel } from "@/components/panel/formulario-panel";
import { guardarZona } from "@/lib/acciones/zonas";
import { claveDeBorrador } from "@/lib/panel/borrador";
import { validarZona } from "@/lib/validaciones/zona";

const VOLVER = "/admin/clientes/zonas";

export function FormularioZona({
  zona,
}: {
  zona: { id: string; nombre: string; descripcion: string | null } | null;
}) {
  return (
    <FormularioPanel
      clave={claveDeBorrador("zona", zona?.id ?? null)}
      accion={guardarZona}
      validar={validarZona}
      destino={() => VOLVER}
    >
      <input type="hidden" name="id" value={zona?.id ?? ""} />
      <Campo nombre="nombre" etiqueta="Nombre de la zona">
        {(p) => <input {...p} defaultValue={zona?.nombre ?? ""} autoComplete="off" />}
      </Campo>
      <Campo
        nombre="descripcion"
        etiqueta="Descripción"
        opcional
        ayuda="Por ejemplo, qué calles o barrios entran."
      >
        {(p) => <textarea {...p} rows={2} defaultValue={zona?.descripcion ?? ""} />}
      </Campo>
      <BarraGuardar volver={VOLVER} />
    </FormularioPanel>
  );
}
```

- [ ] Crear `zonas/nueva/page.tsx` y `zonas/[id]/page.tsx` con el mismo patrón que
      `contenido/categorias/nueva/page.tsx` y `contenido/categorias/[id]/page.tsx` (encabezado +
      `Suspense` + `exigirAcceso(RUTA)` + lectura `zonas_reparto` `id, nombre, descripcion` con
      `.is("deleted_at", null).maybeSingle()`, `notFound()` si no está):

```tsx
// zonas/[id]/page.tsx
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { EncabezadoPanel } from "@/components/panel/encabezado-panel";
import { exigirAcceso } from "@/lib/auth/sesion";
import { crearClienteServidor } from "@/lib/supabase/servidor";

import { FormularioZona } from "../formulario-zona";

const RUTA = "/admin/clientes/zonas";

export default function EditarZona({ params }: PageProps<"/admin/clientes/zonas/[id]">) {
  return (
    <Suspense fallback={<p className="text-muted-foreground text-sm">Cargando…</p>}>
      <Editor params={params} />
    </Suspense>
  );
}

async function Editor({ params }: { params: PageProps<"/admin/clientes/zonas/[id]">["params"] }) {
  const { id } = await params;
  await exigirAcceso(RUTA);
  const supabase = await crearClienteServidor();
  const { data } = await supabase
    .from("zonas_reparto")
    .select("id, nombre, descripcion")
    .eq("id", id)
    .is("deleted_at", null)
    .maybeSingle();
  if (!data) notFound();
  return (
    <>
      <EncabezadoPanel titulo={data.nombre} volver={{ ruta: RUTA, nombre: "Zonas" }} />
      <FormularioZona zona={data} />
    </>
  );
}
```

```tsx
// zonas/nueva/page.tsx
import { Suspense } from "react";

import { EncabezadoPanel } from "@/components/panel/encabezado-panel";
import { exigirAcceso } from "@/lib/auth/sesion";

import { FormularioZona } from "../formulario-zona";

export default function NuevaZona() {
  return (
    <>
      <EncabezadoPanel
        titulo="Nueva zona"
        volver={{ ruta: "/admin/clientes/zonas", nombre: "Zonas" }}
      />
      <Suspense fallback={null}>
        <Protegido />
      </Suspense>
    </>
  );
}

async function Protegido() {
  await exigirAcceso("/admin/clientes/zonas");
  return <FormularioZona zona={null} />;
}
```

### Paso 4 — Borrar los datos a pedido del cliente

- [ ] Añadir a `src/lib/acciones/clientes.ts`:

```ts
const ADMINISTRACION = "/admin/clientes/zonas"; // prefijo solo de superadmin y administrador (roles.ts)

/**
 * Borra en Storage todo lo que quede en la carpeta del cliente. Por carpeta y
 * no por la lista de filas: si un intento anterior borró la base y falló aquí,
 * las filas ya no existen y la carpeta sí. Borrar lo que no está no falla, así
 * que repetirlo es seguro.
 */
async function vaciarCarpeta(
  supabase: ContextoAccion["supabase"],
  id: string,
): Promise<{ quedan: number }> {
  const { data, error } = await supabase.storage.from("clientes").list(id, { limit: 100 });
  if (error) {
    console.error("[clientes] no se pudo listar la carpeta", id, error.message);
    return { quedan: -1 };
  }
  const rutas = (data ?? []).map((f) => `${id}/${f.name}`);
  if (rutas.length === 0) return { quedan: 0 };
  const { error: errorBorrar } = await supabase.storage.from("clientes").remove(rutas);
  if (errorBorrar) {
    console.error("[clientes] fotos sin borrar", id, errorBorrar.message);
    return { quedan: rutas.length };
  }
  return { quedan: 0 };
}

/** Decisión 3: borra de verdad, con motivo. Solo la administración (la base lo exige también). */
export async function borrarDatosCliente(id: string, motivo: string): Promise<EstadoAccion> {
  return ejecutarAccion({
    ruta: ADMINISTRACION,
    esquema: z.object({
      id: z.uuid(),
      motivo: z
        .string()
        .trim()
        .min(3, { error: "Escribe por qué, por ejemplo «lo pidió por WhatsApp»." })
        .max(300),
    }),
    entrada: { id, motivo },
    entidad: "el cliente",
    etiquetas: [],
    mensajeOk: "Datos borrados. Queda solo la constancia de que se borraron.",
    hacer: async (d, { supabase }) => {
      const { error } = await supabase.rpc("borrar_datos_cliente", {
        p_id: d.id,
        p_motivo: d.motivo,
      });
      if (error) return { error };
      const { quedan } = await vaciarCarpeta(supabase, d.id);
      if (quedan !== 0) {
        return {
          error: null,
          mensaje:
            "Datos borrados, pero algunas fotos no se pudieron borrar. Pulsa «Borrar las fotos que quedaron» en la ficha.",
          extra: { fotosSinBorrar: String(quedan) },
        };
      }
      return { error: null };
    },
  });
}

export async function borrarFotosQueQuedaron(id: string): Promise<EstadoAccion> {
  return ejecutarAccion({
    ruta: ADMINISTRACION,
    esquema: z.object({ id: z.uuid() }),
    entrada: { id },
    entidad: "las fotos",
    etiquetas: [],
    mensajeOk: "Listo: ya no queda ninguna foto de este cliente.",
    hacer: async (d, { supabase }) => {
      const { quedan } = await vaciarCarpeta(supabase, d.id);
      return quedan === 0
        ? { error: null }
        : {
            error: {
              code: "P0001",
              message: "Todavía no se pudieron borrar. Inténtalo en un rato.",
            },
          };
    },
  });
}
```

      (importar `type ContextoAccion` junto a `ejecutarAccion`).

> La política de Storage de 0014 (`app.carpeta_es_cliente_visible`) exige que la fila del cliente
> exista y se vea: tras el borrado la fila sigue (anonimizada, `activo = false`, sin `deleted_at`),
> así que la administración aún puede listar y borrar su carpeta. Si al probar el `list` devuelve
> vacío con archivos dentro, es esa política: comprobarlo con `select app.carpeta_es_cliente_visible(...)`
> como administrador antes de tocar nada, y anotarlo en «Lo que resultó distinto».

- [ ] En `leerFicha` (`src/lib/clientes/datos.ts`), añadir `fotosEnCarpeta: number` a `FichaCliente`
      solo cuando `borrado`: `(await supabase.storage.from("clientes").list(id, { limit: 100 })).data?.length ?? 0`;
      `0` en los demás casos (y en los tipos del T3).

- [ ] Crear `src/components/panel/borrar-datos-cliente.tsx`:

```tsx
"use client";

import { useRouter } from "next/navigation";
import { useId, useState, useTransition } from "react";
import { toast } from "sonner";

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
import { CLASE_CONTROL } from "@/components/panel/campo";
import { borrarDatosCliente } from "@/lib/acciones/clientes";

/** Decisión 3. No es el tachito de siempre: pide motivo y no se deshace. */
export function BorrarDatosCliente({ id, nombre }: { id: string; nombre: string }) {
  const router = useRouter();
  const campo = useId();
  const [motivo, setMotivo] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [abierto, setAbierto] = useState(false);
  const [pendiente, iniciar] = useTransition();

  return (
    <AlertDialog open={abierto} onOpenChange={setAbierto}>
      <AlertDialogTrigger className="boton-linea text-destructive">
        Borrar sus datos
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Borrar los datos de {nombre}?</AlertDialogTitle>
          <AlertDialogDescription>
            Se borran su nombre, celular, dirección, punto en el mapa y fotos. No se puede deshacer.
            Queda solo la constancia de que se borraron, quién y por qué.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <label htmlFor={campo} className="text-sm font-semibold">
          ¿Por qué? (lo pidió el cliente, por ejemplo)
        </label>
        <textarea
          id={campo}
          rows={2}
          className={CLASE_CONTROL}
          value={motivo}
          onChange={(e) => setMotivo(e.target.value)}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${campo}-error` : undefined}
        />
        {error ? (
          <p id={`${campo}-error`} className="text-destructive text-sm">
            {error}
          </p>
        ) : null}
        <AlertDialogFooter>
          <AlertDialogCancel className="boton-linea">No, dejarlo</AlertDialogCancel>
          {/* Un <button> propio y no AlertDialogAction: esa cierra el diálogo al pulsar, y con un error hay que corregir el motivo. */}
          <button
            type="button"
            className="boton-cta bg-destructive"
            disabled={pendiente}
            onClick={() =>
              iniciar(async () => {
                const r = await borrarDatosCliente(id, motivo);
                if (r.estado === "error") {
                  setError(r.errores?.motivo?.[0] ?? r.mensaje);
                  return;
                }
                if (r.estado === "ok") {
                  setAbierto(false);
                  if (r.extra?.fotosSinBorrar) toast.warning(r.mensaje);
                  else toast.success(r.mensaje);
                  router.refresh();
                }
              })
            }
          >
            Sí, borrar sus datos
          </button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
```

- [ ] En `src/app/(admin)/admin/clientes/[id]/page.tsx` (el rol viene de `exigirAcceso`):
  - `const administracion = sesion.rol === "superadmin" || sesion.rol === "administrador";`
  - si `administracion && !cliente.borrado`, `<BorrarDatosCliente id={id} nombre={cliente.nombre_completo} />`
    al final de la ficha, en una sección «Datos personales» separada del resto;
  - si `cliente.borrado`, en lugar de datos y botones de contacto:
    `<p data-datos-borrados>Los datos de este cliente se borraron a su pedido.</p>` y, si
    `administracion && cliente.fotosEnCarpeta > 0`, un botón cliente (mismo patrón que
    `BotonActivoCliente`) «Borrar las fotos que quedaron» que llama a `borrarFotosQueQuedaron(id)`.

### Paso 5 — Conservación: la lista y el aviso

- [ ] Crear `src/app/(admin)/admin/clientes/revisar/page.tsx`:

```tsx
import { Suspense } from "react";

import { EncabezadoPanel } from "@/components/panel/encabezado-panel";
import { BorrarDatosCliente } from "@/components/panel/borrar-datos-cliente";
import { ListaAdaptable } from "@/components/panel/lista-adaptable";
import { exigirAcceso } from "@/lib/auth/sesion";
import { crearClienteServidor } from "@/lib/supabase/servidor";

import { BotonSigueCliente } from "./boton-sigue-cliente";

const FECHA = new Intl.DateTimeFormat("es-PE", { dateStyle: "long", timeZone: "America/Lima" });

export default function ClientesParaRevisar() {
  return (
    <>
      <EncabezadoPanel
        titulo="Clientes para revisar"
        descripcion="Sin cambios en dos años. Si sigue comprando, pulsa «Sigue siendo cliente». Si ya no, desactívalo desde su ficha o, si lo pidió, borra sus datos."
        volver={{ ruta: "/admin/clientes", nombre: "Clientes" }}
      />
      <Suspense fallback={<p className="text-muted-foreground text-sm">Cargando…</p>}>
        <Lista />
      </Suspense>
    </>
  );
}

async function Lista() {
  await exigirAcceso("/admin/clientes/revisar");
  const supabase = await crearClienteServidor();
  const { data, error } = await supabase
    .from("clientes_para_revisar")
    .select("id, nombre_completo, zona, ultima_actividad")
    .order("ultima_actividad");
  if (error) return <p role="alert">No se pudo cargar la lista. Recarga la página.</p>;
  const filas = data.map((c) => ({
    id: c.id ?? "",
    nombre: c.nombre_completo ?? "",
    zona: c.zona ?? "Sin zona",
    ultima: c.ultima_actividad ? FECHA.format(new Date(c.ultima_actividad)) : "—",
  }));
  return (
    <ListaAdaptable
      etiqueta="Clientes sin cambios en dos años"
      filas={filas}
      enlace={(c) => `/admin/clientes/${c.id}`}
      editar={(c) => `/admin/clientes/${c.id}/editar`}
      columnas={[
        { titulo: "Cliente", celda: (c) => c.nombre, principal: true },
        { titulo: "Zona", celda: (c) => c.zona },
        { titulo: "Último cambio", celda: (c) => c.ultima },
      ]}
      acciones={(c) => (
        <>
          <BotonSigueCliente id={c.id} nombre={c.nombre} />
          <BorrarDatosCliente id={c.id} nombre={c.nombre} />
        </>
      )}
      vacio={
        <p>No hay clientes para revisar. Todos tuvieron algún cambio en los últimos dos años.</p>
      }
    />
  );
}
```

> Las columnas de una vista salen nullables en los tipos generados (AGENTS.md): se normalizan con
> `??`, nunca con `!`. Si `ListaAdaptable` exige `acciones`, pasarle `() => null`.

- [ ] Añadir a `src/lib/acciones/clientes.ts`:

```ts
/**
 * «Sigue siendo cliente» (decisión 4): renueva la fecha sin cambiar nada. Un
 * `update` que no cambia ningún valor igual dispara `set_updated_at`, que es lo
 * que mide `clientes_para_revisar`.
 */
export async function seguirComoCliente(id: string): Promise<EstadoAccion> {
  return ejecutarAccion({
    ruta: ADMINISTRACION,
    esquema: z.object({ id: z.uuid() }),
    entrada: { id },
    entidad: "el cliente",
    etiquetas: [],
    mensajeOk: "Anotado. No vuelve a salir aquí hasta dentro de dos años.",
    hacer: async (d, { supabase }) => {
      const { error } = await supabase
        .from("clientes")
        .update({ activo: true })
        .eq("id", d.id)
        .is("deleted_at", null)
        .select("id")
        .single();
      return { error };
    },
  });
}
```

- [ ] Crear `src/app/(admin)/admin/clientes/revisar/boton-sigue-cliente.tsx`, con el patrón de
      `BotonActivoCliente` (T4): `"use client"`, `useTransition`, `toast` y `router.refresh()`; el
      botón `boton-linea shrink-0` dice «Sigue siendo cliente» con
      `aria-label={`${nombre} sigue siendo cliente`}` y llama a `seguirComoCliente(id)`.

- [ ] En `src/app/(admin)/admin/page.tsx`, dentro del bloque `superadmin`/`administrador` de
      `contarAvisos`:

```ts
const { count: paraRevisar } = await supabase
  .from("clientes_para_revisar")
  .select("id", { count: "exact", head: true });
if (paraRevisar && paraRevisar > 0) {
  avisos.push({
    clave: "clientes-para-revisar",
    texto: `${paraRevisar} ${paraRevisar === 1 ? "cliente lleva" : "clientes llevan"} dos años sin cambios`,
    ruta: "/admin/clientes/revisar",
  });
}
```

      y actualizar el comentario de `contarAvisos` («… F6, la de clientes para revisar»).

- [ ] En `src/app/(admin)/admin/clientes/page.tsx`, en la `accion` del encabezado y solo para la
      administración: enlaces `boton-linea` «Zonas» (`/admin/clientes/zonas`) y «Para revisar»
      (`/admin/clientes/revisar`), junto a «Nuevo cliente», en un `div` `flex flex-wrap gap-2`.

### Paso 6 — Pruebas de navegador

- [ ] Crear `e2e/panel-clientes-administracion.spec.ts`:

```ts
import { expect, test } from "@playwright/test";

import { borrarClienteDePrueba, crearClienteDePrueba } from "./ayudas/clientes";
import { sesionDeApi } from "./ayudas/insumos";
import { entrarComo } from "./ayudas/sesion";
import { sqlLocal } from "./ayudas/base";
import { borrarUsuario } from "./ayudas/usuarios";

test.beforeEach(({}, info) => {
  test.skip(info.project.name !== "movil", "escriben filas compartidas (zonas); un proyecto basta");
});

test("la administración crea una zona, no la puede retirar con clientes activos, y sí vacía", async ({
  page,
}) => {
  const nombre = `Zona E2E ${Date.now()}`;
  const usuario = await entrarComo(page, "administrador");
  let cliente: string | null = null;
  try {
    await page.goto("/admin/clientes/zonas/nueva");
    await page.getByLabel("Nombre de la zona").fill(nombre);
    await page.getByRole("button", { name: "Guardar" }).click();
    await page.waitForURL("/admin/clientes/zonas");

    cliente = await crearClienteDePrueba({ nombre: `En ${nombre}`, zona: nombre });
    await page.reload();
    await page.getByRole("button", { name: `Retirar la zona ${nombre}` }).click();
    await expect(page.getByText(/tiene 1 cliente activo\. Pásalos a otra zona/)).toBeVisible();

    await borrarClienteDePrueba(cliente);
    cliente = null;
    await page.reload();
    await page.getByRole("button", { name: `Retirar la zona ${nombre}` }).click();
    await expect(page.getByRole("button", { name: `Activar la zona ${nombre}` })).toBeVisible();
  } finally {
    if (cliente) await borrarClienteDePrueba(cliente);
    sqlLocal(`delete from public.zonas_reparto where nombre = '${nombre}'`);
    await borrarUsuario(usuario.id);
  }
});

test("el ingeniero no llega a las zonas ni a la lista para revisar", async ({ page }) => {
  const usuario = await entrarComo(page, "ingeniero");
  try {
    for (const ruta of ["/admin/clientes/zonas", "/admin/clientes/revisar"]) {
      await page.goto(ruta);
      await page.waitForURL("/admin?motivo=sin-acceso");
    }
  } finally {
    await borrarUsuario(usuario.id);
  }
});

test("borrar los datos a pedido: pide motivo, borra datos y fotos, y deja la constancia", async ({
  page,
}) => {
  const nombre = `Borrar E2E ${Date.now()}`;
  const id = await crearClienteDePrueba({ nombre });
  const api = await sesionDeApi("administrador");
  await api.storage
    .from("clientes")
    .upload(`${id}/fachada.webp`, new Blob([new Uint8Array(64)], { type: "image/webp" }));
  await api.from("cliente_fotos").insert({ cliente_id: id, ruta: `${id}/fachada.webp`, orden: 1 });
  const usuario = await entrarComo(page, "administrador");
  try {
    await page.goto(`/admin/clientes/${id}`);
    await page.getByRole("button", { name: "Borrar sus datos" }).click();
    await page.getByRole("button", { name: "Sí, borrar sus datos" }).click();
    await expect(page.getByText("Escribe por qué")).toBeVisible(); // sin motivo no borra
    await page.getByLabel(/¿Por qué\?/).fill("Lo pidió por WhatsApp");
    await page.getByRole("button", { name: "Sí, borrar sus datos" }).click();
    await expect(page.locator("[data-datos-borrados]")).toBeVisible();
    await expect(page.getByText(nombre)).toHaveCount(0);

    const { data: archivos } = await api.storage.from("clientes").list(id);
    expect(archivos ?? []).toHaveLength(0);
    const { data: supresion } = await api
      .from("supresiones")
      .select("motivo")
      .eq("cliente_id", id)
      .single();
    expect(supresion?.motivo).toBe("Lo pidió por WhatsApp");
  } finally {
    await borrarClienteDePrueba(id);
    await borrarUsuario(usuario.id);
  }
});

test("un cliente de hace dos años sale en el inicio y en «Para revisar»; «Sigue siendo cliente» lo quita", async ({
  page,
}) => {
  const nombre = `Viejo E2E ${Date.now()}`;
  const id = await crearClienteDePrueba({ nombre });
  // Envejecerlo sin que el trigger ponga la fecha de hoy.
  sqlLocal(`
    alter table public.clientes disable trigger clientes_set_updated_at;
    update public.clientes set updated_at = now() - interval '2 years 1 day' where id = '${id}';
    alter table public.clientes enable trigger clientes_set_updated_at;`);
  const usuario = await entrarComo(page, "administrador");
  try {
    await expect(page.locator('[data-aviso="clientes-para-revisar"]')).toBeVisible();
    await page.goto("/admin/clientes/revisar");
    await expect(page.getByRole("link", { name: new RegExp(nombre) }).first()).toBeVisible();

    await page.getByRole("button", { name: `${nombre} sigue siendo cliente` }).click();
    await expect(page.getByRole("link", { name: new RegExp(nombre) })).toHaveCount(0);
  } finally {
    await borrarClienteDePrueba(id);
    await borrarUsuario(usuario.id);
  }
});
```

> `crearClienteDePrueba({ zona })` busca la zona por nombre (T3). Si el `upload` del `Blob` falla
> por el tipo MIME permitido del bucket, subir `await fotoDePrueba(page)` leída con `fs.readFile`.

- [ ] Envejecer una fila exige apagar el trigger de `updated_at`, y eso no se hace por PostgREST.
      Añadir a `e2e/ayudas/base.ts` (el mismo contenedor que usan los guiones de `scripts/`):

```ts
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

/** SQL como `postgres` en la base local, para lo que PostgREST no deja (apagar un trigger). Solo pruebas. */
export function sqlLocal(sql: string): string {
  const proyecto = /^project_id\s*=\s*"([^"]+)"/m.exec(
    readFileSync("supabase/config.toml", "utf8"),
  )?.[1];
  if (!proyecto) throw new Error("No se encontró project_id en supabase/config.toml");
  return execFileSync(
    "docker",
    [
      "exec",
      "-i",
      `supabase_db_${proyecto}`,
      "psql",
      "-U",
      "postgres",
      "-d",
      "postgres",
      "-v",
      "ON_ERROR_STOP=1",
      "-tA",
    ],
    {
      input: sql,
      encoding: "utf8",
    },
  );
}
```

      (el SQL entra por la entrada estándar y no como argumento: así MSYS no convierte nada en Git
      Bash).

- [ ] En `e2e/panel-accesibilidad.spec.ts`, añadir a `RUTAS_DEL_PANEL`: `"/admin/clientes/zonas"`,
      `"/admin/clientes/zonas/nueva"` y `"/admin/clientes/revisar"`.

- [ ] `pnpm build`, liberar el puerto 3000, `pnpm start` y:
      `pnpm exec playwright test e2e/panel-clientes-administracion.spec.ts --workers=1`
      **Esperado:** 4 en verde en `movil` (los de `escritorio`, saltados diciendo por qué).
- [ ] `pnpm exec playwright test e2e/panel-accesibilidad.spec.ts -g "clientes"` → **Esperado:** verde.

### Paso 7 — Commit (sin PR)

- [ ] `pnpm typecheck && pnpm lint && pnpm test`
- [ ] Commit:

```bash
git add src/lib/validaciones/zona.ts src/lib/validaciones/zona.test.ts src/lib/acciones src/lib/clientes \
        src/components/panel/borrar-datos-cliente.tsx "src/app/(admin)/admin" \
        e2e/panel-clientes-administracion.spec.ts e2e/panel-accesibilidad.spec.ts
git commit -m "feat(clientes): zonas, borrar datos a pedido y clientes para revisar"
```

- [ ] **No se abre PR** (la T5 no trae migración): se sigue con la T6 en la misma rama.

---

## Tarea 6 — Exportar clientes a Excel y PDF

**Rama:** la misma de la T5 (`feat/f6-t5-t6-administracion`) · **Migración:** no · **PR:** al
terminar, **un PR con la T5 y la T6**, con revisión de la rama por un subagente antes de abrirlo.

**Qué deja hecho:** la administración descarga la lista de clientes (la zona y el estado que tenga
elegidos en pantalla) en Excel o PDF, **sin fotos** (decisión 6); cada descarga queda registrada en
`exportaciones_clientes` y, si el registro falla, no se descarga nada. Los exportadores de F5 pasan
a aceptar cualquier tabla, no solo un reporte de insumos.

**Files:**

- Modify: `src/lib/insumos/formato-reporte.ts` (`TablaExportable`), `src/lib/insumos/exportar-excel.ts`,
  `src/lib/insumos/exportar-pdf.tsx` (aceptan `TablaExportable`; texto de «vacío» propio)
- Create: `src/lib/clientes/tabla.ts` + `.test.ts` (filas → tabla, sin `server-only`)
- Create: `src/lib/clientes/descargar.ts` (`server-only`: acceso, lectura, registro, respuesta)
- Create: `src/app/(admin)/admin/clientes/excel/route.ts`, `src/app/(admin)/admin/clientes/pdf/route.ts`
- Modify: `next.config.ts` (`outputFileTracingIncludes` de la ruta del PDF)
- Modify: `src/app/(admin)/admin/clientes/page.tsx` (los dos botones, solo administración)
- Create: `e2e/panel-clientes-exportar.spec.ts`

**Interfaces:**

- Consumes: `reporteAExcel`, `reporteAPdf`, `textosDeLasFilas`, `celularParaLeer`, `generarSlug`,
  `hoyEnLima`, `public.exportaciones_clientes (formato 'xlsx'|'pdf', cantidad, filtro jsonb)`
  (`exportado_por` lo pone la base), `public.supresiones`.
- Produces: `type TablaExportable` (en `formato-reporte.ts`); `clientesATabla(filas: FilaExportable[],
subtitulo: string): TablaExportable`; `type FilaExportable = { nombre_completo: string; celular:
string; direccion: string; referencia: string | null; zona: string | null; con_punto: boolean;
activo: boolean }`; `descargarClientes(peticion: Request, extension: "xlsx" | "pdf", convertir:
(t: TablaExportable) => Promise<Buffer>): Promise<Response>`.

### Paso 1 — Los exportadores aceptan cualquier tabla

- [ ] En `src/lib/insumos/formato-reporte.ts`, añadir el tipo y usarlo en `textosDeLasFilas`:

```ts
import type { Columna, Fila } from "./reportes";

/**
 * Lo que necesitan el Excel y el PDF: un reporte de insumos lo cumple tal cual,
 * y la lista de clientes (F6) también, sin gráfico ni slug.
 */
export type TablaExportable = {
  titulo: string;
  subtitulo: string;
  columnas: Columna[];
  filas: Fila[];
  total: number | null;
  sinCosto: boolean[];
  hayCostosDesconocidos: boolean;
  /** Lo que dice el PDF sin filas. Por defecto, el de un reporte con periodo. */
  vacio?: string;
};
```

      y `export function textosDeLasFilas(reporte: TablaExportable): string[][]` (el cuerpo no cambia).
      Si `formato-reporte.ts` ya importa `Reporte` de `./reportes`, sustituir ese import por el de
      `Columna` y `Fila` cuando `Reporte` deje de usarse en el archivo.

- [ ] En `exportar-excel.ts`: `export async function reporteAExcel(reporte: TablaExportable)` (import
      de `TablaExportable` desde `./formato-reporte`, fuera el de `Reporte`).
- [ ] En `exportar-pdf.tsx`: `export async function reporteAPdf(reporte: TablaExportable)` y el texto
      vacío pasa a `{reporte.vacio ?? "No hay datos en ese periodo."}`.
- [ ] `pnpm typecheck && pnpm test -- src/lib/insumos` → **Esperado:** verde sin tocar ninguna
      prueba (un `Reporte` sigue siendo una `TablaExportable`: si alguna prueba de F5 falla, el
      cambio no fue solo de tipo).

### Paso 2 — Clientes a tabla, primero la prueba

- [ ] Crear `src/lib/clientes/tabla.test.ts`:

```ts
import { describe, expect, it } from "vitest";

import { clientesATabla } from "./tabla";

const rosa = {
  nombre_completo: "Rosa Quispe",
  celular: "965111222",
  direccion: "Jr. Próspero 123",
  referencia: "Portón verde",
  zona: "Belén",
  con_punto: true,
  activo: true,
};

describe("clientesATabla", () => {
  it("una fila por cliente, con el celular para leer y sin fotos (decisión 6)", () => {
    const t = clientesATabla([rosa], "Belén · activos · al 01/10/2026");
    expect(t.columnas.map((c) => c.titulo)).toEqual([
      "Cliente",
      "Celular",
      "Dirección",
      "Referencia",
      "Zona",
      "Punto en el mapa",
    ]);
    expect(t.filas[0]).toMatchObject({ celular: "965 111 222", punto: "Sí" });
    expect(JSON.stringify(t)).not.toMatch(/foto|clientes\//i);
  });

  it("todo es texto: sin total ni marca de costo", () => {
    const t = clientesATabla([rosa, { ...rosa, con_punto: false, zona: null }], "x");
    expect(t.columnas.every((c) => c.tipo === "texto")).toBe(true);
    expect(t.total).toBeNull();
    expect(t.sinCosto).toEqual([false, false]);
    expect(t.hayCostosDesconocidos).toBe(false);
    expect(t.filas[1]).toMatchObject({ zona: "Sin zona", punto: "No" });
  });

  it("sin clientes lo dice con sus palabras", () => {
    expect(clientesATabla([], "x").vacio).toBe("No hay clientes con ese filtro.");
  });
});
```

- [ ] `pnpm test -- src/lib/clientes/tabla.test.ts` → **Esperado:** FALLA (no existe `./tabla`).

- [ ] Crear `src/lib/clientes/tabla.ts`:

```ts
import type { TablaExportable } from "@/lib/insumos/formato-reporte";

import { celularParaLeer } from "./contacto";

export type FilaExportable = {
  nombre_completo: string;
  celular: string;
  direccion: string;
  referencia: string | null;
  zona: string | null;
  con_punto: boolean;
  activo: boolean;
};

/**
 * La lista para el Excel y el PDF. Sin fotos ni coordenadas (decisión 6):
 * solo si tiene punto, que es lo que sirve para repartir en papel.
 */
export function clientesATabla(filas: FilaExportable[], subtitulo: string): TablaExportable {
  return {
    titulo: "Clientes",
    subtitulo,
    columnas: [
      { clave: "cliente", titulo: "Cliente", tipo: "texto" },
      { clave: "celular", titulo: "Celular", tipo: "texto" },
      { clave: "direccion", titulo: "Dirección", tipo: "texto" },
      { clave: "referencia", titulo: "Referencia", tipo: "texto" },
      { clave: "zona", titulo: "Zona", tipo: "texto" },
      { clave: "punto", titulo: "Punto en el mapa", tipo: "texto" },
    ],
    filas: filas.map((c) => ({
      cliente: c.nombre_completo,
      celular: celularParaLeer(c.celular),
      direccion: c.direccion,
      referencia: c.referencia,
      zona: c.zona ?? "Sin zona",
      punto: c.con_punto ? "Sí" : "No",
    })),
    total: null,
    sinCosto: filas.map(() => false),
    hayCostosDesconocidos: false,
    vacio: "No hay clientes con ese filtro.",
  };
}
```

- [ ] `pnpm test -- src/lib/clientes/tabla.test.ts` → **Esperado:** PASAN (3).

### Paso 3 — La descarga, con registro

- [ ] Crear `src/lib/clientes/descargar.ts`:

```ts
import "server-only";

import type { TablaExportable } from "@/lib/insumos/formato-reporte";
import { hoyEnLima } from "@/lib/insumos/periodo";
import { exigirAcceso } from "@/lib/auth/sesion";
import { crearClienteServidor } from "@/lib/supabase/servidor";
import { generarSlug } from "@/lib/utilidades/slug";

import { clientesATabla } from "./tabla";

const TIPO = {
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  pdf: "application/pdf",
} as const;

/**
 * «Descargar Excel» y «Descargar PDF» de la lista de clientes: solo la
 * administración (roles.ts y la política de `exportaciones_clientes`), con la
 * zona y el estado de la pantalla. Primero se registra; si el registro falla,
 * no sale el archivo: una copia de datos personales sin constancia es justo lo
 * que la decisión 6 quiere evitar.
 */
export async function descargarClientes(
  peticion: Request,
  extension: keyof typeof TIPO,
  convertir: (tabla: TablaExportable) => Promise<Buffer>,
): Promise<Response> {
  await exigirAcceso(`/admin/clientes/${extension === "xlsx" ? "excel" : "pdf"}`);
  const parametros = new URL(peticion.url).searchParams;
  const zonaId = parametros.get("zona") || null;
  const desactivados = parametros.get("estado") === "desactivados";

  const supabase = await crearClienteServidor();
  const [{ data: zona }, { data: borrados, error: errorBorrados }] = await Promise.all([
    zonaId
      ? supabase.from("zonas_reparto").select("nombre").eq("id", zonaId).maybeSingle()
      : Promise.resolve({ data: null }),
    supabase.from("supresiones").select("cliente_id"),
  ]);
  if (errorBorrados)
    return new Response("No se pudo preparar la lista. Inténtalo otra vez.", { status: 500 });

  let consulta = supabase
    .from("clientes")
    .select(
      "id, nombre_completo, celular, direccion, referencia, latitud, activo, zonas_reparto(nombre)",
    )
    .is("deleted_at", null)
    .eq("activo", !desactivados)
    .order("nombre_completo");
  if (zonaId) consulta = consulta.eq("zona_id", zonaId);
  const { data, error } = await consulta;
  if (error)
    return new Response("No se pudo preparar la lista. Inténtalo otra vez.", { status: 500 });

  // Los de datos borrados a pedido no salen nunca: ya no son de nadie.
  const fuera = new Set((borrados ?? []).map((b) => b.cliente_id));
  const filas = data
    .filter((c) => !fuera.has(c.id))
    .map((c) => ({
      nombre_completo: c.nombre_completo,
      celular: c.celular,
      direccion: c.direccion,
      referencia: c.referencia,
      zona: c.zonas_reparto?.nombre ?? null,
      con_punto: c.latitud !== null,
      activo: c.activo,
    }));

  const { error: errorRegistro } = await supabase.from("exportaciones_clientes").insert({
    formato: extension,
    cantidad: filas.length,
    filtro: { zona: zona?.nombre ?? null, estado: desactivados ? "desactivados" : "activos" },
  });
  if (errorRegistro) {
    console.error("[clientes] exportación sin registrar:", errorRegistro.message);
    return new Response(
      "No se pudo registrar la descarga, así que no se descargó nada. Inténtalo otra vez.",
      {
        status: 500,
      },
    );
  }

  const dia = hoyEnLima(new Date());
  const fecha = dia.split("-").reverse().join("/");
  const subtitulo = `${zona?.nombre ?? "Todas las zonas"} · ${desactivados ? "desactivados" : "activos"} · al ${fecha}`;
  const archivo = await convertir(clientesATabla(filas, subtitulo));
  const nombre = `pimpos-clientes-${zona ? generarSlug(zona.nombre) : "todas"}-${dia}.${extension}`;

  return new Response(new Uint8Array(archivo), {
    headers: {
      "Content-Type": TIPO[extension],
      "Content-Disposition": `attachment; filename="${nombre}"`,
      "Cache-Control": "no-store",
    },
  });
}
```

- [ ] Crear `src/app/(admin)/admin/clientes/excel/route.ts`:

```ts
import { descargarClientes } from "@/lib/clientes/descargar";
import { reporteAExcel } from "@/lib/insumos/exportar-excel";

export async function GET(peticion: Request) {
  return descargarClientes(peticion, "xlsx", reporteAExcel);
}
```

- [ ] Crear `src/app/(admin)/admin/clientes/pdf/route.ts`:

```ts
import { descargarClientes } from "@/lib/clientes/descargar";
import { reporteAPdf } from "@/lib/insumos/exportar-pdf";

export async function GET(peticion: Request) {
  return descargarClientes(peticion, "pdf", reporteAPdf);
}
```

- [ ] En `next.config.ts`, `outputFileTracingIncludes` añade
      `"/admin/clientes/pdf": ["./src/recursos/compartir/*.ttf"]` (sin esto el PDF funciona en
      local y falla en Vercel, igual que en F5).

> `/admin/clientes/[id]` es una ruta dinámica hermana de `excel` y `pdf`: Next da prioridad a los
> segmentos estáticos, así que `/admin/clientes/excel` no llega nunca a la ficha. Si `pnpm build`
> dijera lo contrario, mover las dos rutas a `/admin/clientes/exportar/{excel,pdf}` y cambiar los
> prefijos de `roles.ts` en la misma línea.

### Paso 4 — Los botones

- [ ] En `src/app/(admin)/admin/clientes/page.tsx`, dentro de la vista Lista y solo para la
      administración, cuando hay clientes en pantalla:

```tsx
{
  administracion && clientes.length > 0 ? (
    <div className="mb-4 flex flex-wrap gap-2">
      {(["excel", "pdf"] as const).map((formato) => (
        // Un <a>, no <Link>, y sin `download`: ver el mismo bloque en reportes de insumos.
        <a
          key={formato}
          href={`/admin/clientes/${formato}?${new URLSearchParams({
            ...(filtroZona ? { zona: filtroZona } : {}),
            ...(verDesactivados ? { estado: "desactivados" } : {}),
          })}`}
          className="boton-linea"
        >
          Descargar {formato === "excel" ? "Excel" : "PDF"}
        </a>
      ))}
      <p className="text-muted-foreground w-full text-sm">
        Descarga todos los de la zona elegida, sin fotos. Queda anotado quién descargó y cuándo.
      </p>
    </div>
  ) : null;
}
```

> La descarga respeta la zona y el estado, **no** el texto buscado: una lista para repartir es por
> zona. Queda dicho en el texto bajo los botones.

### Paso 5 — Pruebas de navegador

- [ ] Crear `e2e/panel-clientes-exportar.spec.ts`:

```ts
import ExcelJS from "exceljs";
import { expect, test } from "@playwright/test";

import { borrarDeLaBase } from "./ayudas/base";
import { borrarClienteDePrueba, crearClienteDePrueba } from "./ayudas/clientes";
import { sesionDeApi } from "./ayudas/insumos";
import { entrarComo } from "./ayudas/sesion";
import { borrarUsuario } from "./ayudas/usuarios";

test.beforeEach(({}, info) => {
  test.skip(info.project.name !== "movil", "una descarga basta");
});

test("la administración descarga el Excel de una zona, sin fotos, y queda registrado", async ({
  page,
}) => {
  const nombre = `Exportar E2E ${Date.now()}`;
  const id = await crearClienteDePrueba({ nombre, zona: "Punchana", celular: "912333444" });
  const usuario = await entrarComo(page, "administrador");
  const api = await sesionDeApi("administrador");
  try {
    const { data: zona } = await api
      .from("zonas_reparto")
      .select("id")
      .eq("nombre", "Punchana")
      .single();
    await page.goto(`/admin/clientes?zona=${zona!.id}`);
    const [descarga] = await Promise.all([
      page.waitForEvent("download"),
      page.getByRole("link", { name: "Descargar Excel" }).click(),
    ]);
    expect(descarga.suggestedFilename()).toMatch(
      /^pimpos-clientes-punchana-\d{4}-\d{2}-\d{2}\.xlsx$/,
    );

    const libro = new ExcelJS.Workbook();
    await libro.xlsx.readFile(await descarga.path());
    const hoja = libro.worksheets[0]!;
    expect(hoja.getCell("A2").value).toMatch(/^Punchana · activos · al \d{2}\/\d{2}\/\d{4}$/);
    const filas: string[] = [];
    hoja.eachRow((fila, n) => {
      if (n >= 5) filas.push(fila.values!.toString());
    });
    expect(filas.find((f) => f.includes(nombre))).toContain("912 333 444");
    expect(filas.join("\n")).not.toMatch(/clientes\/|\.webp|\.jpg/);

    const { data: registro } = await api
      .from("exportaciones_clientes")
      .select("formato, exportado_por, filtro")
      .eq("exportado_por", usuario.id)
      .single();
    expect(registro).toMatchObject({
      formato: "xlsx",
      filtro: { zona: "Punchana", estado: "activos" },
    });
  } finally {
    await borrarClienteDePrueba(id);
    await borrarDeLaBase("exportaciones_clientes", "exportado_por", usuario.id);
    await borrarUsuario(usuario.id);
  }
});

test("el PDF se descarga", async ({ page }) => {
  const usuario = await entrarComo(page, "administrador");
  try {
    await page.goto("/admin/clientes");
    const [descarga] = await Promise.all([
      page.waitForEvent("download"),
      page.getByRole("link", { name: "Descargar PDF" }).click(),
    ]);
    expect(descarga.suggestedFilename()).toMatch(/^pimpos-clientes-todas-\d{4}-\d{2}-\d{2}\.pdf$/);
  } finally {
    await borrarDeLaBase("exportaciones_clientes", "exportado_por", usuario.id);
    await borrarUsuario(usuario.id);
  }
});

test("el ingeniero no ve los botones ni llega a la descarga", async ({ page }) => {
  const usuario = await entrarComo(page, "ingeniero");
  try {
    await page.goto("/admin/clientes");
    await expect(page.getByRole("link", { name: "Descargar Excel" })).toHaveCount(0);
    await page.goto("/admin/clientes/excel");
    await page.waitForURL("/admin?motivo=sin-acceso");
  } finally {
    await borrarUsuario(usuario.id);
  }
});
```

> `exportaciones_clientes.exportado_por` es `on delete restrict` (0043): la fila de la descarga se
> borra con `borrarDeLaBase` (la `service_role` local; por la API de un usuario la tabla no admite
> `delete`, y así debe seguir) **antes** de `borrarUsuario`, que si no fallaría sin avisar.

- [ ] `pnpm build`, liberar el puerto 3000, `pnpm start` y
      `pnpm exec playwright test e2e/panel-clientes-exportar.spec.ts e2e/panel-exportar.spec.ts --workers=1`
      **Esperado:** verde (las de insumos siguen igual con los exportadores ampliados).

### Paso 6 — Cerrar la tarea y el PR de T5 + T6

- [ ] `pnpm typecheck && pnpm lint && pnpm test`
- [ ] Commit:

```bash
git add src/lib/insumos src/lib/clientes "src/app/(admin)/admin/clientes" next.config.ts \
        e2e/panel-clientes-exportar.spec.ts
git commit -m "feat(clientes): exportar la lista a Excel y PDF, con registro"
```

- [ ] Revisión de la rama (T5 + T6) con un subagente; lo Importante, arreglado con prueba vista fallar.
- [ ] PR con las dos tareas (sin migración, sin atribución). Dan lo fusiona; no hay `db push`.

---

## Tarea 7 — Cierre de la fase

**Rama:** `docs/f6-cierre` (desde `main` con T5+T6 fusionadas) · **Migración:** no (salvo que la
revisión final exija una: entonces va sola en su propio PR antes de este, con su `db push`) ·
**PR:** solo esta tarea.

**Qué deja hecho:** la suite entera medida, el rendimiento del sitio público comparado con el cierre
de F5, un ensayo de restauración con clientes y permisos, el manual del negocio `docs/clientes.md`,
los documentos del proyecto al día y la revisión final de toda la fase.

**Files:**

- Create: `docs/clientes.md`
- Modify: `scripts/restaurar-respaldo.sh` (conteo de clientes y permisos en la comprobación)
- Modify: `docs/respaldo-y-restauracion.md`, `AGENTS.md`, `DOC/Avance del proyecto.md`,
  `DOC/Plan de Desarrollo 00 - General y Fases.md`, `DOC/Plan de Desarrollo 02 - Backend y Base de Datos.md`
  (matriz RLS §11 de clientes), este plan («Lo que resultó distinto»)

### Paso 1 — La suite entera

- [ ] `supabase db reset` (esperar a que `supabase start` haya terminado), después
      `bash supabase/seeds/imagenes/subir-imagenes.sh`.
- [ ] `supabase test db` → **Esperado:** todo en verde; anotar el número (616 al cierre de F5, más
      las de 0042 y 0043).
- [ ] `pnpm typecheck && pnpm lint && pnpm test` → **Esperado:** verde; anotar el número de pruebas.
- [ ] `bash scripts/verificar-fase0.sh && bash scripts/verificar-storage.sh && bash scripts/verificar-sitio-publico.sh`
      → **Esperado:** los tres OK (el de Storage con el cliente que nace con su permiso, T1).
- [ ] `pnpm build`, liberar el puerto 3000 (`netstat -ano | grep ":3000 " | grep LISTENING`, cerrar
      solo ese PID), `pnpm start` en segundo plano y, por tandas:
      `pnpm exec playwright test e2e/panel-clientes*.spec.ts --workers=1`,
      `pnpm exec playwright test e2e/panel-accesibilidad.spec.ts e2e/tactil.spec.ts e2e/accesibilidad.spec.ts`,
      `pnpm exec playwright test e2e/panel-*.spec.ts --workers=2` (el resto del panel, por si T3
      rompió la navegación o `ListaAdaptable`).
      **Esperado:** verde. Un fallo que sale a veces se corre también contra `main` antes de
      llamarlo intermitente (AGENTS.md).
- [ ] `pnpm exec playwright test --list | tail -1` → anotar el número de flujos listados.

### Paso 2 — Rendimiento del sitio público contra el cierre de F5

F6 no toca el sitio público, pero el CSS global sí puede crecer con las clases nuevas del panel
(pasó en F4). Se comprueba igual que entonces.

- [ ] `git stash -u` (si hay algo), `git checkout 371c202`, `pnpm build`, copiar `.next` a
      `$SCRATCHPAD/build-f5`; volver a la rama, `pnpm build`, copiar a `$SCRATCHPAD/build-f6`.
- [ ] Medir las dos builds **intercaladas** en la misma sesión con `PASADAS=5 pnpm lighthouse` sobre
      `/`, `/productos` y `/contacto` (arrancando cada build en el puerto 3000 por turnos).
      **Esperado:** accesibilidad ≥ 97 y SEO 100 en las tres; rendimiento sin una caída que se
      sostenga en las dos modas del LCP (ver la trampa de «LCP bimodal»: con `/` se cuentan las
      pasadas por encima y por debajo de 3 s, no solo la mediana).
- [ ] Anotar el tamaño comprimido del CSS global en las dos builds
      (`gzip -c .next/static/css/*.css | wc -c` en cada una). Si crece más de 1 KB, anotarlo como
      coste conocido en «Lo que resultó distinto» junto a la salida ya escrita en AGENTS.md
      (separar las utilidades del panel en su propia hoja); no se arregla en esta tarea.

### Paso 3 — Ensayo de restauración con clientes

Review Focus: con el permiso obligatorio (trigger diferido `clientes_exige_permiso`), una carga que
meta `clientes` antes que `consentimientos` fuera de réplica fallaría al cerrar la transacción.

- [ ] En la base local, con al menos un cliente con permiso y foto (crear uno desde el panel), y uno
      con los datos borrados a pedido: `supabase db dump --local --data-only -f "$SCRATCHPAD/datos-f6.sql"`.
- [ ] `grep -n "session_replication_role" "$SCRATCHPAD/datos-f6.sql" | head -3`
      **Esperado:** `SET session_replication_role = replica;` al principio del volcado. Los
      triggers de restricción (el del permiso lo es) no corren en réplica, así que el orden de las
      tablas no importa. **Si no aparece**, añadirlo en `scripts/restaurar-respaldo.sh` delante de
      la carga del paso 3/4 (`{ echo "set session_replication_role = replica;"; cat "$FILTRADO"; } | psql_ …`)
      y anotarlo.
- [ ] `bash scripts/restaurar-respaldo.sh "$SCRATCHPAD/datos-f6.sql"` (escribir `RESTAURAR`).
      **Esperado:** termina sin error.
- [ ] Añadir al `select` de comprobación del paso 4/4 del guion
      `|| ' clientes=' || (select count(*) from public.clientes) || ' permisos=' || (select count(*) from public.consentimientos) || ' supresiones=' || (select count(*) from public.supresiones)`
      y comprobar que coinciden con los de antes del volcado.
- [ ] Comprobar que el cliente restaurado sigue cumpliendo la regla:
      `docker exec supabase_db_PIMPOS_SYSTEM psql -U postgres -tAc "select count(*) from public.clientes c where not c.es_demo and c.deleted_at is null and c.nombre_completo <> 'Datos borrados a pedido del cliente' and not exists (select 1 from public.consentimientos k where k.cliente_id = c.id and k.revocado_en is null)"`
      **Esperado:** `0`.
- [ ] Las fotos **no** viajan en el volcado (Storage no está en él): lo dice ya
      `docs/respaldo-y-restauracion.md` §5 para los demás buckets; añadir que el bucket `clientes`
      es **privado** y que su copia se descarga aparte, se guarda cifrada y cuenta como dato
      personal (Ley N.° 29733), igual que el volcado.

### Paso 4 — El manual del negocio

- [ ] Crear `docs/clientes.md`, en el tono de `docs/insumos.md` (para Marcos, Debra y quien
      reparte; sin jerga), con estas secciones:
  1. **Qué es y quién hace qué** — tabla de los cuatro roles: ver, registrar, corregir, desactivar,
     zonas, borrar datos, exportar.
  2. **Registrar a un cliente** — los tres pasos (Datos · Ubicación y fotos · Permiso), el texto del
     permiso **tal cual** (versión `v1-2026-10`, copiado de `src/lib/clientes/permiso.ts`) y por qué
     se lee en voz alta; después, las fotos.
  3. **En la puerta (repartidor)** — Llamar, WhatsApp, Cómo llegar, y «Corregir» la referencia, el
     punto y las fotos.
  4. **Celular repetido** — qué significa el aviso y cuándo seguir.
  5. **Zonas** — crear, ordenar, retirar (y por qué no deja retirar una con clientes activos).
  6. **Si un cliente pide que borren sus datos** — desactivar no basta; «Borrar sus datos», el motivo,
     qué se borra y qué queda (la constancia), y «Borrar las fotos que quedaron» si sale el aviso.
  7. **Clientes para revisar** — el aviso de los dos años y qué hacer con cada uno.
  8. **Descargar la lista** — Excel o PDF, sin fotos, queda anotado; cómo guardar ese archivo.
  9. **Si cambia el texto del permiso** — no se edita a mano: versión nueva en el código, y los
     permisos ya dados siguen con la suya.

### Paso 5 — Los documentos del proyecto

- [ ] `AGENTS.md`: la tabla de estado (F6 ✅ con fecha y PRs), «La base hoy» (tablas, vistas,
      políticas, triggers y migraciones contadas **con SQL**, no a mano:
      `select count(*) from pg_tables where schemaname='public'`, etc.), «Verificación» con los
      números del paso 1, las 2 filas nuevas de la tabla de migraciones (0042, 0043), las rutas de
      clientes en «Arquitectura», y las trampas nuevas que haya dejado la fase.
- [ ] `DOC/Avance del proyecto.md`: sección de F6 (qué se hizo, decisiones de Dan del 30/09, qué
      quedó pendiente del negocio: texto del permiso revisado por el negocio, zonas propias).
- [ ] `DOC/Plan de Desarrollo 00`: F6 cerrada con su fecha. `DOC/Plan de Desarrollo 02` §11: las
      filas de clientes, fotos, permisos, zonas, supresiones y exportaciones en la matriz de RLS.
- [ ] Este plan: «Lo que resultó distinto» de cada tarea, rellenado.
- [ ] `pnpm format` sobre lo tocado y `pnpm format:check`.

### Paso 6 — Revisión final y PR

- [ ] Revisión de **toda la fase** (`git diff 371c202..HEAD`) con un subagente (opus), con el
      contexto de la spec y del Review Focus. Lo Importante se arregla con su prueba vista fallar;
      lo menor se anota en «Lo que resultó distinto» o se arregla si es de una línea.
- [ ] Commit (`docs(f6): cerrar la fase de clientes`), push y PR **sin atribución**. Dan fusiona.
- [ ] Después de fusionar, en producción (lo hace Dan o se le guía): entrar al panel alojado como
      superadmin y comprobar que `/admin/clientes`, `/admin/clientes/zonas` y
      `/admin/clientes/nuevo` cargan y que las cuatro zonas salen en el alta. **No** se registra un
      cliente de prueba en producción: dejaría una constancia de borrado en `supresiones` que no se
      puede quitar. El primer cliente real lo registra el negocio.

---

## Lo que resultó distinto

Escrito al fusionar la T6 (30/09/2026). Cada tarea se implementó en la sesión principal y una
revisión de la rama con un subagente (opus) antes del PR; lo Importante de cada revisión se arregló
con su prueba vista fallar primero. El registro completo está en
`.superpowers/sdd/Plan de Desarrollo 06 - Clientes/progress.md` (fuera de git).

**Adelantado a la T7** (a pedido de Dan, 30/09/2026): `docs/clientes.md`, la nota de clientes en
`docs/respaldo-y-restauracion.md` y la puesta al día de `AGENTS.md`, `DOC/Avance del proyecto.md` y
los planes 00 y 02 se escribieron al fusionar la T6. En la T7 quedan por revisar con las cifras del
cierre, no por escribir.

### Tarea 1 — Reglas en la base (0042, PR #78)

- **El plan se equivocaba con Storage:** decía que 0014 no tenía política de borrado en el bucket
  `clientes`, y tenía una para los cuatro roles («reparto borra fotos de clientes»). 0042 la retira y
  crea la de los encargados, como pide la decisión 2. `verificar-storage.sh` comprueba ahora que el
  repartidor no borra la foto y el ingeniero sí (vista fallar con la política vieja).
- **Otra prueba de 0013 dependía del alta del repartidor** (la 34, «con quien registro a cada
  persona»): el alta pasa al ingeniero, por `registrar_cliente`, y el número de pruebas no cambia.
- **Cuatro huecos que encontró la revisión**, cerrados en la misma 0042 antes del push:
  - el permiso obligatorio se saltaba creando el cliente «de ejemplo» y desmarcándolo después:
    `es_demo` solo lo ponen las semillas, y el trigger diferido despierta también al desmarcarlo;
  - un punto podía guardarse con una sola coordenada;
  - el celular podía guardarse con espacios o con el 51, y el aviso de celular repetido compara por
    igualdad: ahora solo dígitos;
  - una zona se podía borrar de verdad, saltándose la regla de no retirarla con clientes activos.

### Tarea 2 — Datos personales (0043, PR #79)

- **La prueba del plan chocaba con el permiso diferido de 0042** (eventos en cola impiden apagar un
  trigger, y una clienta registrada y borrada en la misma transacción dejaba su evento pendiente):
  se ajustó la prueba, no la migración. En el panel son transacciones distintas.
- **Dos huecos de la revisión**, cerrados en 0043: la nota del permiso (`observacion`) sobrevivía al
  borrado, y una ficha borrada se podía volver a activar, rellenar o recibir fotos (la regla estaba
  solo en la interfaz). Ahora lo impide la base, también en Storage.

### Tareas 3 y 4 — Consultar, registrar y corregir (PR #80)

- La lista avisa «Se muestran los primeros 200» cuando `buscar_clientes` llega a su tope.
- La casilla del permiso es un control propio de 44 px con su error debajo, no un `Campo`.
- `SelectorUbicacion` se reescribió con un modo opcional (tocar el mapa, «Usar mi ubicación»,
  «Quitar el punto»); sin él, Configuración se comporta igual.
- La limpieza de pruebas del plan no borraba nada en Storage (`prefixes` son nombres exactos): lista
  la carpeta y borra por nombre.
- **Cuatro arreglos de la revisión:** un nombre de cliente con código se ejecutaba en el globo del
  mapa (**crítico**: `escaparHtml`, también en el mapa público); el mapa nacía gris en su pestaña
  oculta (también el de Configuración); añadir una foto dejaba «cambios sin guardar» falsos
  (`SubidaImagen inmediata`); buscar en la vista Mapa volvía a la lista (`BuscadorEnVivo conservar`).

### Tareas 5 y 6 — Administración y exportar (PR #81)

- La prueba del plan para «Para revisar» solo envejecía la ficha; la vista mira también las fotos y
  el permiso, y se envejecen los tres.
- Esa misma prueba destapó que a 375 px dos botones de texto dejaban el nombre en 0 px:
  `ListaAdaptable accionesDebajo`. Y la de área táctil, con una fila en la lista, que el lápiz de la
  tabla de escritorio encogía por debajo de 44 px.
- Se incorporaron tres menores aplazados: el diálogo pide no escribir nombre ni número en el motivo;
  las fichas borradas salen de la lista y del aviso de celular repetido; y el borrado de fotos vuelve
  a listar la carpeta, porque `storage.remove()` no avisa cuando la RLS no deja borrar.
- El botón «Borrar sus datos» lleva el nombre del cliente para los lectores de pantalla.
- **Tres arreglos de la revisión:** si Storage fallaba al borrar desde «Para revisar», no quedaba
  camino para reintentar (ahora lleva a la ficha; la prueba simula el fallo quitando un momento la
  política de borrado); la descarga se cortaba en 1000 clientes (tope de PostgREST: `leerTodas`); y
  «Sigue siendo cliente» reactivaba a quien otra persona acababa de desactivar.

### Hallazgos menores aplazados (para la revisión final de la T7)

Ya resueltos por una tarea posterior: el aviso de los 200 (T3), el celular `000000` de las fichas
borradas (T5), el filtro de la descarga sin el texto buscado (T6), el motivo sin datos personales
(T5) y el `remove()` que no avisa (T5).

Siguen abiertos:

- **Base:** un administrador puede cambiar el `cliente_id` de un permiso (su política de edición
  cubre todas las columnas); el repartidor puede cambiar `created_at` de un cliente y el cliente o la
  ruta de una foto; `registrar_cliente` con una coordenada `''` da un error sin traducir (el panel
  manda `null`); `%` y `_` actúan como comodines en el buscador (inofensivo); el tachado de la
  auditoría depende de que el dueño tenga `BYPASSRLS` y, si le faltara, no tacharía ni avisaría (una
  guarda como la de 0030); `clientes_para_revisar` no cuenta una revocación como actividad; y
  `supresiones.borrado_por` y `exportaciones_clientes.exportado_por` impiden borrar a ese usuario
  (se desactiva, como con `consentimientos`).
- **Fotos:** si la foto se sube y su fila no llega a guardarse (carrera de tres fotos, o un `23505`
  que sale con el mensaje de «nombre repetido»), el archivo queda huérfano; `agregarFotoCliente` no
  comprueba que la ruta sea de la carpeta del cliente; y «cambiar foto» del repartidor tendrá que ser
  sobrescribir la misma ruta, porque ya no puede borrar.
- **Pantallas:** `leerFicha` y `zonasActivas` callan el error (pasar por `avisarDeConsulta`); la copia
  local guarda marcada la casilla del permiso; «1 cliente no tiene punto…: están» en singular; la
  decisión 8 pedía un botón «registrar igual» y el aviso dice «puedes seguir»; el `42501` del trigger
  del repartidor llega con el mensaje genérico; la ficha, editar y corregir no tienen prueba de axe
  (rutas con `[id]`); sin teclado no se marca el punto (solo con «Usar mi ubicación»).
- **Borrar y descargar:** el motivo de más de 300 letras da el error de Zod en inglés; el error del
  diálogo no se anuncia (`role="alert"`) y sobrevive a cerrar y abrir; la descarga no valida el
  parámetro `zona` (un texto que no es uuid da un 500 en texto plano); los botones de descarga se
  esconden si la búsqueda no encuentra a nadie, aunque la descarga no usa la búsqueda; si el archivo
  falla después de anotar la descarga, queda anotada sin archivo; y una zona con nombre sin letras deja
  `pimpos-clientes--<fecha>`.
- **Guion:** espacios sobrantes en tres líneas de `verificar-storage.sh`, de antes de F6.
