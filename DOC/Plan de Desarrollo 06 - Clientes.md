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
