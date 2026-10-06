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
