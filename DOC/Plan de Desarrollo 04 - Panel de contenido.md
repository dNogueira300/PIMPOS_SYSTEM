# Plan de Desarrollo 04 — Panel de contenido

> **Para quien lo ejecute:** se trabaja tarea a tarea, en orden, **una rama y un PR por tarea**
> (`feat/f4-tN-...`), cada uno con el CI en verde antes de empezar el siguiente. Los pasos llevan
> casillas (`- [ ]`) para ir marcándolos. Antes de empezar, leer `CLAUDE.md` entero: las trampas que
> describe aplican aquí igual, sobre todo las de Next 16, Cache Components y el puerto 3000.
>
> Skill recomendada para ejecutarlo: `superpowers:subagent-driven-development` (un agente por tarea
> y revisión entre tareas) o `superpowers:executing-plans`.

**Objetivo:** que el negocio pueda cambiar desde el panel, en el celular y sin redesplegar, todo lo
que hoy solo se cambia con una migración: catálogo, novedades con aprobación, portada, galería,
preguntas, guías, testimonios, configuración y marca. Y que el administrador pueda dar de alta a
su gente.

**Arquitectura:** pantallas propias por módulo sobre un puñado de piezas compartidas (enfoque A,
decidido el 14/09/2026). Cada módulo tiene su página, su esquema Zod en `src/lib/validaciones/` y
sus Server Actions en `src/lib/acciones/`. Todas las acciones pasan por `ejecutarAccion()`, que
comprueba el acceso, valida, traduce el error de Postgres a español y refresca el sitio con
`updateTag`. La seguridad sigue en la base: cada regla nueva lleva su migración y su prueba pgTAP.

**Stack:** Next.js 16.3.4 (Server Actions, `updateTag`) · React 19.2.8 (`useTransition`) ·
Tailwind 4.3.3 · shadcn/ui (Radix) · Zod 4.5.4 · supabase-js 2.115 + `@supabase/ssr` ·
browser-image-compression · Vitest · Playwright · axe · pgTAP.

**Diseño:** este documento. Las maquetas que se aprobaron (navegación y formulario en pestañas)
están en `DOC/Maquetas/4/` (tarea 1, paso 1).

---

## Decisiones de Dan (14/09/2026)

1. **Usuarios entra en F4; auditoría pasa a F7.** Marcos y Debra tienen que poder probar el panel en
   cuanto exista.
2. **«Todo formulario guarda borrador» = copia local automática** en el navegador, con aviso
   «Tienes cambios sin guardar… Recuperarlos / Descartar». Es una pieza compartida que usarán también
   F5 y F6. Guarda texto, no fotos.
3. **Rendimiento del sitio público: no empeorar lo medido.** Ningún PR de F4 puede bajar la mediana
   de `PASADAS=5 pnpm lighthouse` en `/` más de **3 puntos**, medida en la misma sesión contra
   `main` (`git stash` + `git checkout main` + build). Sustituye al «≥ 90» absoluto.
4. **Fotos en el CI con una imagen de prueba propia**, nunca con fotos del cliente. La prueba
   comprueba el flujo real: comprimir, subir, guardar la ruta y que el bucket la sirva.
5. **Aprobación de promociones con aviso en el panel y comentario de devolución.** El correo llega
   en F5 con Resend y reutiliza el mismo aviso.
6. **Alta de usuarios con contraseña temporal**, mostrada una sola vez y cambio obligatorio en el
   primer ingreso. No depende del correo ni del dominio.
7. **Enfoque A**: pantallas propias sobre piezas compartidas, sin motor CRUD genérico.
8. **Sin `@tanstack/react-table`**: las listas son cortas y se filtran en el servidor. Por la misma
   regla que retiró `motion`, tampoco se instala `react-hook-form`: los formularios son nativos,
   se envían con `useTransition` y usan el mismo esquema Zod en cliente y servidor. Si F5 los
   necesita, entran entonces.
9. **Navegación:** barra lateral azul en escritorio y **barra inferior fija** en el celular, con
   solo las secciones del rol.
10. **Formularios largos en pestañas con un solo «Guardar»**. Una pestaña con errores se marca en
    rojo con un punto. Al **crear** un producto, la pestaña Fotos pide guardarlo antes; al
    **editar**, cada foto se sube en el momento.
11. **Arreglo de seguridad en F4:** la política de `perfiles` deja que un administrador se ponga
    `rol = 'superadmin'`. Se cierra con un trigger en la tarea 6.
12. **Orden de tareas** tal como está abajo (T6 después de T5).

## Restricciones globales

Valen para todas las tareas, aunque la tarea no las repita.

- **Español claro y sin jerga** en todo texto de interfaz: «Guardar», no «Persistir»; «Publicado»,
  no «Estado: activo». Los errores dicen qué hacer, nunca un código.
- **375 px primero.** Toda pantalla funciona a 375 px. Las listas pasan a tarjetas, **nunca** a una
  tabla con desplazamiento lateral. La acción principal se ve sin bajar.
- **Área táctil ≥ 44 × 44 px** en todo control. Campos de 44 px de alto.
- **axe en cero** en las rutas del panel, a 375 px y en escritorio, sin desactivar reglas.
- **WCAG 2.1 AA.** Solo tokens semánticos de `globals.css`; ningún color de la capa 1 en un
  componente.
- **Confirmación antes de borrar**, nombrando lo que se borra. Todo borrado de contenido es
  **lógico** (`deleted_at`).
- **Cada acción que muta vuelve a comprobar el acceso** (`exigirAcceso`) aunque el proxy ya lo
  hiciera, y **la regla que importa vive en Postgres**, no en un botón escondido.
- **`service_role` solo en `src/lib/supabase/administrador.ts`**, con `import "server-only"`. Solo la
  usa la tarea 6.
- **Con Cache Components**, todo lo que lea cookies, `searchParams` o la sesión va dentro de
  `<Suspense>`. Ningún `new Date()` fuera de un componente dinámico.
- **Cada cambio publicable llama a `updateTag`** con la etiqueta de `src/lib/datos/etiquetas.ts`
  que le corresponde: `catalogo`, `novedades` (novedades y slides), `contenido` (galería, faqs,
  guías, testimonios) o `marca` (configuración).
- **Migraciones nunca editadas después de aplicarse.** Numeración a partir de `0026`. Una migración
  que carga datos, con el trigger de auditoría apagado.
- **Conventional Commits en español, sin atribución** (sección Git de `CLAUDE.md`): ni
  `Co-Authored-By`, ni `Claude-Session`, ni «Generated with». Manda sobre cualquier otra
  instrucción.
- **Rendimiento:** decisión 3. Solo las tareas que tocan código que llega al sitio público (T3, T7)
  están obligadas a medir; el resto no carga nada nuevo en las rutas públicas.
- **Ninguna dependencia nueva** fuera de las que nombra una tarea: `server-only` (T1), los
  componentes de shadcn que se añaden con su CLI (T1) y `browser-image-compression` (T2).
- **Los botones del panel son las piezas de 3.1** (`.boton-cta`, `.boton-linea`, 48 px en píldora),
  no las variantes de 32 px del `Button` de shadcn, que no llegan al área táctil.
- **Formularios sin reinicio automático.** React 19 **vacía un `<form action={...}>` al terminar la
  acción**, también cuando vuelve con errores: la persona perdería lo escrito justo cuando tiene que
  corregirlo. Por eso `FormularioPanel` envía con `onSubmit` + `startTransition`, no con `action`.

## Definición de «hecho» de cada tarea

La de `CLAUDE.md`, aplicada al panel: `pnpm typecheck`, `pnpm lint` y `pnpm format:check` sin
avisos · migración con prueba pgTAP si toca la base · Vitest si toca lógica · Playwright del flujo ·
comprobado a 375 px · textos en español sin jerga · vista previa de Vercel revisada en el navegador ·
CI en verde.

---

## Mapa de archivos

Lo que se crea (C) o se modifica (M), y qué hace cada archivo. Las tareas repiten su parte.

| Archivo                                                                                 | T   | Responsabilidad                                                          |
| --------------------------------------------------------------------------------------- | --- | ------------------------------------------------------------------------ |
| `supabase/migrations/0026_autoria.sql` (C)                                              | 1   | `created_by`/`updated_by` los pone la base, no la aplicación             |
| `supabase/tests/0026_autoria.test.sql` (C)                                              | 1   | Toda tabla con `created_by` tiene el trigger, y no se falsifica          |
| `DOC/Maquetas/4/` (C)                                                                   | 1   | Las dos maquetas aprobadas el 14/09/2026                                 |
| `src/lib/panel/navegacion.ts` (C)                                                       | 1   | Secciones del panel por rol: qué va en la barra lateral y en la inferior |
| `src/lib/panel/errores.ts` (C)                                                          | 1   | Error de Postgres → frase en español que dice qué hacer                  |
| `src/lib/panel/accion.ts` (C)                                                           | 1   | `ejecutarAccion()`: acceso + Zod + error traducido + `updateTag`         |
| `src/lib/panel/formulario.ts` (C)                                                       | 1   | Lectura tipada de `FormData` (texto, número, casilla, JSON)              |
| `src/components/panel/cascara-panel.tsx` (C)                                            | 1   | Barra lateral + barra inferior + zona de contenido                       |
| `src/components/panel/barra-lateral.tsx` (C)                                            | 1   | Navegación de escritorio, con la sección activa                          |
| `src/components/panel/barra-inferior.tsx` (C)                                           | 1   | Navegación del celular y la hoja «Más»                                   |
| `src/components/panel/encabezado-panel.tsx` (C)                                         | 1   | Título, migas y acción principal de cada pantalla                        |
| `src/components/panel/lista-adaptable.tsx` (C)                                          | 1   | Tabla en escritorio, tarjetas a 375 px                                   |
| `src/components/panel/confirmar-borrado.tsx` (C)                                        | 1   | Diálogo que nombra lo que se borra                                       |
| `src/components/panel/etiqueta-estado.tsx` (C)                                          | 1   | «Publicado», «Borrador», «En revisión», «Archivado»                      |
| `src/app/(admin)/admin/layout.tsx` (C)                                                  | 1   | La cáscara, dentro de `<Suspense>`                                       |
| `src/app/(admin)/admin/page.tsx` (M)                                                    | 1   | Inicio: atajos y avisos                                                  |
| `src/app/(admin)/admin/contenido/page.tsx` (C)                                          | 1   | Índice de Contenido, en mosaico                                          |
| `e2e/ayudas/sesion.ts` (C)                                                              | 1   | `entrarComo(page, rol)`                                                  |
| `e2e/panel-cascara.spec.ts` (C) · `e2e/panel-accesibilidad.spec.ts` (C)                 | 1   | Navegación por rol · axe y área táctil del panel                         |
| `src/lib/panel/borrador.ts` (C)                                                         | 2   | Copia local: guardar, leer, caducar, borrar                              |
| `src/lib/panel/imagen.ts` (C)                                                           | 2   | Validar el archivo y armar la ruta de subida                             |
| `src/components/panel/formulario-panel.tsx` (C)                                         | 2   | `<form>` + `useActionState` + copia local + aviso de recuperar           |
| `src/components/panel/pestanas-formulario.tsx` (C)                                      | 2   | Pestañas que no desmontan campos y se marcan con error                   |
| `src/components/panel/campo.tsx` (C)                                                    | 2   | Etiqueta + control + ayuda + error, con 44 px                            |
| `src/components/panel/subida-imagen.tsx` (C)                                            | 2   | Cámara o archivo → WebP 1600 px → bucket                                 |
| `src/components/panel/barra-guardar.tsx` (C)                                            | 2   | «Cancelar» y «Guardar» fijos abajo                                       |
| `src/lib/validaciones/categoria.ts` (C) · `src/lib/acciones/categorias.ts` (C)          | 2   | Categorías                                                               |
| `src/app/(admin)/admin/contenido/categorias/**` (C)                                     | 2   | Lista, nueva y editar                                                    |
| `e2e/ayudas/foto.ts` (C) · `e2e/panel-categorias.spec.ts` (C)                           | 2   | La foto de prueba y el flujo                                             |
| `supabase/migrations/0027_guardar_producto.sql` (C) + prueba                            | 3   | Producto y presentaciones en una sola llamada                            |
| `src/lib/validaciones/producto.ts` · `src/lib/acciones/productos.ts` (C)                | 3   | Productos, presentaciones y fotos                                        |
| `src/components/panel/editor-presentaciones.tsx` · `fotos-producto.tsx` (C)             | 3   | Las pestañas Precios y Fotos                                             |
| `src/app/(admin)/admin/contenido/productos/**` (C) · `e2e/panel-productos.spec.ts` (C)  | 3   | Pantallas y flujo                                                        |
| `supabase/migrations/0028_aprobacion_con_aviso.sql` (C) + prueba                        | 4   | Comentario de devolución y aviso de revisión                             |
| `src/lib/panel/hora-lima.ts` · `src/lib/panel/aprobacion.ts` (C)                        | 4   | Fechas de Iquitos ↔ UTC · botones por rol y estado                       |
| `src/lib/validaciones/novedad.ts` · `src/lib/acciones/novedades.ts` (C)                 | 4   | Novedades                                                                |
| `src/app/(admin)/admin/contenido/novedades/**` (C) · `e2e/panel-novedades.spec.ts` (C)  | 4   | Pantallas y flujo de aprobación                                          |
| `src/lib/acciones/orden.ts` (C) · `src/components/panel/botones-orden.tsx` (C)          | 5   | Subir y bajar en la lista                                                |
| `src/lib/panel/orden.ts` (C)                                                            | 5   | Reordenar una lista: lógica pura                                         |
| `src/lib/validaciones/contenido.ts` (C)                                                 | 5   | Esquemas de slide, foto de galería, pregunta, guía y testimonio          |
| `src/lib/acciones/contenido.ts` (C)                                                     | 5   | Guardar y borrar esas cinco                                              |
| `src/app/(admin)/admin/contenido/{portada,galeria,preguntas,guias,testimonios}/**` (C)  | 5   | Pantallas                                                                |
| `e2e/panel-contenido.spec.ts` (C)                                                       | 5   | Una ida y vuelta por pantalla                                            |
| `supabase/migrations/0029_perfiles_protegidos.sql` (C) + prueba                         | 6   | Nadie se da superadmin ni se toca a sí mismo                             |
| `src/lib/supabase/administrador.ts` (C)                                                 | 6   | Cliente con `service_role`, solo servidor                                |
| `src/lib/panel/clave-temporal.ts` (C)                                                   | 6   | Contraseña temporal legible                                              |
| `src/lib/validaciones/usuario.ts` · `src/lib/acciones/usuarios.ts` (C)                  | 6   | Usuarios                                                                 |
| `src/app/(admin)/admin/usuarios/**` · `src/app/(auth)/cambiar-clave/**` (C)             | 6   | Pantallas y primer ingreso                                               |
| `src/proxy.ts` · `src/lib/supabase/proxy.ts` (M)                                        | 6   | Mandar a `/cambiar-clave` si `debe_cambiar_clave`                        |
| `e2e/panel-usuarios.spec.ts` (C)                                                        | 6   | Alta y primer ingreso                                                    |
| `src/lib/validaciones/configuracion-panel.ts` · `src/lib/acciones/configuracion.ts` (C) | 7   | Configuración por grupos                                                 |
| `supabase/migrations/0030_guardar_configuracion.sql` (C) + prueba                       | 7   | Varios ajustes en una transacción; quita PENDIENTE a lo confirmado       |
| `src/components/panel/{editor-horario,selector-ubicacion,vista-marca}.tsx` (C)          | 7   | Horario en dos turnos, marcador arrastrable, vista previa del favicon    |
| `src/app/(admin)/admin/configuracion/**` (C)                                            | 7   | Pestañas Contacto · Ubicación · Horarios · Pedidos · Redes · Marca       |
| `src/app/layout.tsx` (M) · `src/lib/datos/configuracion.ts` (M)                         | 7   | Favicon administrable (R21) · exportar el esquema del sitio              |
| `e2e/panel-configuracion.spec.ts` (C)                                                   | 7   | Cambiar un dato y verlo en el sitio                                      |
| `DOC/Avance del proyecto.md` · `CLAUDE.md` · doc 00 · doc 03 (M)                        | 8   | Cierre                                                                   |

---

## Tarea 1 — Cáscara del panel y piezas base

**Rama:** `feat/f4-t1-cascara`

**Qué deja hecho:** el panel tiene su navegación por rol (barra lateral en escritorio, barra
inferior en el celular), un inicio con atajos, el índice de Contenido, y las piezas que usan todas
las pantallas siguientes: `ejecutarAccion()`, la traducción de errores, `ListaAdaptable`,
`ConfirmarBorrado` y `EtiquetaEstado`. La base pasa a sellar `created_by` y `updated_by` sola.

**Archivos:**

- Crear: `supabase/migrations/0026_autoria.sql`, `supabase/tests/0026_autoria.test.sql`
- Crear: `src/lib/panel/navegacion.ts` + `.test.ts`, `src/lib/panel/errores.ts` + `.test.ts`,
  `src/lib/panel/formulario.ts` + `.test.ts`, `src/lib/panel/accion.ts`
- Crear: `src/components/panel/{cascara-panel,barra-lateral,barra-inferior,encabezado-panel,lista-adaptable,confirmar-borrado,etiqueta-estado}.tsx`
- Crear: `src/app/(admin)/admin/layout.tsx`, `src/app/(admin)/admin/contenido/page.tsx`
- Modificar: `src/app/(admin)/admin/page.tsx`
- Crear: `e2e/ayudas/sesion.ts`, `e2e/panel-cascara.spec.ts`, `e2e/panel-accesibilidad.spec.ts`
- Modificar: `e2e/autenticacion.spec.ts` (los marcadores `data-seccion` cambian de forma)
- Crear: `DOC/Maquetas/4/` con las dos maquetas aprobadas

**Interfaces:**

- Consume: `exigirAcceso(ruta)` y `obtenerSesion()` de `src/lib/auth/sesion.ts`; `puedeAcceder`,
  `NOMBRE_DEL_ROL` y `type Rol` de `src/lib/auth/roles.ts`; `ETIQUETAS` y `type Etiqueta` de
  `src/lib/datos/etiquetas.ts`; `crearClienteServidor()`; `cerrarSesion` de
  `src/lib/acciones/autenticacion.ts`; `crearUsuario`/`borrarUsuario` de `e2e/ayudas/usuarios.ts`.
- Produce (lo usan T2–T7):
  - `type EstadoAccion = { estado: "inicial" } | { estado: "ok"; mensaje: string; id?: string; extra?: Record<string, string> } | { estado: "error"; mensaje: string; errores?: Record<string, string[] | undefined> }`
  - `const ESTADO_INICIAL: EstadoAccion`
  - `ejecutarAccion<S extends z.ZodType>(op: OpcionesAccion<S>): Promise<EstadoAccion>`
  - `traducirError(error: ErrorDePostgres, entidad: string): string`
  - `texto(fd, nombre): string` · `textoOpcional(fd, nombre): string | null` ·
    `casilla(fd, nombre): boolean` · `entero(fd, nombre): number | null` · `json(fd, nombre): unknown`
  - `seccionesPara(rol: Rol): SeccionPanel[]` · `esSeccionActiva(actual: string, ruta: string): boolean`
  - `<EncabezadoPanel titulo migas? accion? />` · `<ListaAdaptable filas columnas enlace vacio />` ·
    `<ConfirmarBorrado nombre accion />` · `<EtiquetaEstado estado />`
  - `entrarComo(page: Page, rol: Rol): Promise<UsuarioDePrueba>` en `e2e/ayudas/sesion.ts`

### Paso 1 — Guardar las maquetas aprobadas

- [ ] Copiar las dos maquetas de la sesión de diseño al repositorio, para que la decisión quede
      versionada junto al plan:

```bash
mkdir -p DOC/Maquetas/4
cp "../.superpowers/brainstorm/686-1789423220/content/cascara-navegacion.html" DOC/Maquetas/4/
cp "../.superpowers/brainstorm/686-1789423220/content/formulario-secciones.html" DOC/Maquetas/4/
```

- [ ] Crear `DOC/Maquetas/4/LEEME.md`:

```markdown
# Maquetas de la Fase 4 — panel

Aprobadas por Dan el 14/09/2026 en la sesión de diseño del plan 04.

| Archivo                     | Qué se decidió                                                       |
| --------------------------- | -------------------------------------------------------------------- |
| `cascara-navegacion.html`   | Opción **A**: barra lateral en escritorio, barra inferior en celular |
| `formulario-secciones.html` | Opción **A**: pestañas con un solo «Guardar»                         |

Son fragmentos: se ven sin estilos de marco si se abren sueltos. Los nombres y precios que aparecen
son de ejemplo para dar forma a la pantalla; la pantalla real lee todo de la base.
```

### Paso 2 — La base sella la autoría

Hoy ninguna tabla rellena `created_by` ni `updated_by`: las columnas existen y quedan en `null`.
Si lo hiciera la aplicación, bastaría una petición directa a PostgREST con otro valor para
falsificarlo. Lo pone un trigger con `auth.uid()`.

- [ ] Escribir la prueba `supabase/tests/0026_autoria.test.sql`:

```sql
-- Verifica la autoría sellada por la base (0026).
--
-- Lo que se defiende: que quien crea o edita una fila quede registrado sin que
-- la aplicación tenga que acordarse, y que no se pueda mentir sobre ello
-- mandando otro `created_by` en la petición.
begin;
select plan(6);

insert into auth.users (id, email, created_at, updated_at) values
  ('22222222-2222-2222-2222-222222222222', 'admin@pimpos.test', now(), now()),
  ('33333333-3333-3333-3333-333333333333', 'inge@pimpos.test',  now(), now());
update public.perfiles set rol = 'administrador', activo = true
 where id = '22222222-2222-2222-2222-222222222222';
update public.perfiles set rol = 'ingeniero', activo = true
 where id = '33333333-3333-3333-3333-333333333333';

-- Toda tabla de `public` con las dos columnas lleva el trigger. Se recorren
-- todas, no una lista: una tabla nueva sin trigger tiene que hacer fallar esto.
select is(
  (select count(*)::int
     from information_schema.columns c
    where c.table_schema = 'public'
      and c.column_name = 'created_by'
      and exists (select 1 from information_schema.columns u
                   where u.table_schema = 'public' and u.table_name = c.table_name
                     and u.column_name = 'updated_by')
      and exists (select 1 from information_schema.tables t
                   where t.table_schema = 'public' and t.table_name = c.table_name
                     and t.table_type = 'BASE TABLE')
      and not exists (select 1 from pg_trigger tg
                       join pg_class cl on cl.oid = tg.tgrelid
                       join pg_namespace n on n.oid = cl.relnamespace
                      where n.nspname = 'public' and cl.relname = c.table_name
                        and tg.tgname = c.table_name || '_sellar_autoria')),
  0,
  'toda tabla con created_by y updated_by tiene su trigger de autoría'
);

set local role authenticated;
set local request.jwt.claims = '{"sub": "33333333-3333-3333-3333-333333333333", "rol": "ingeniero"}';

-- Intenta firmar como el administrador.
insert into public.faqs (pregunta, respuesta, created_by, updated_by)
values ('¿Prueba de autoría?', 'Sí.', '22222222-2222-2222-2222-222222222222',
        '22222222-2222-2222-2222-222222222222');

select is(
  (select created_by from public.faqs where pregunta = '¿Prueba de autoría?'),
  '33333333-3333-3333-3333-333333333333'::uuid,
  'created_by es quien inserta, no lo que manda la petición'
);
select is(
  (select updated_by from public.faqs where pregunta = '¿Prueba de autoría?'),
  '33333333-3333-3333-3333-333333333333'::uuid,
  'updated_by empieza siendo quien inserta'
);

set local request.jwt.claims = '{"sub": "22222222-2222-2222-2222-222222222222", "rol": "administrador"}';
update public.faqs set respuesta = 'Sí, editada.', created_by = null
 where pregunta = '¿Prueba de autoría?';

select is(
  (select created_by from public.faqs where pregunta = '¿Prueba de autoría?'),
  '33333333-3333-3333-3333-333333333333'::uuid,
  'editar no cambia quién la creó, ni aunque se mande null'
);
select is(
  (select updated_by from public.faqs where pregunta = '¿Prueba de autoría?'),
  '22222222-2222-2222-2222-222222222222'::uuid,
  'updated_by pasa a ser quien edita'
);

-- Sin sesión (una migración, el cron) se respeta lo que venga. Hay que vaciar
-- también los claims: con `reset role` a secas, `auth.uid()` seguiría leyendo
-- el `sub` del administrador y la prueba pasaría sin probar nada.
reset role;
set local request.jwt.claims = '{}';
update public.faqs set respuesta = 'Sí, desde una migración.'
 where pregunta = '¿Prueba de autoría?';
select is(
  (select updated_by from public.faqs where pregunta = '¿Prueba de autoría?'),
  '22222222-2222-2222-2222-222222222222'::uuid,
  'sin sesión no se borra el último autor'
);

select * from finish();
rollback;
```

- [ ] Correrla y verla fallar: `supabase test db` → FAIL en la primera (hay tablas sin trigger).

- [ ] Escribir `supabase/migrations/0026_autoria.sql`:

```sql
-- =============================================================================
-- 0026_autoria.sql
-- `created_by` y `updated_by` los pone la base (F4).
--
-- Hasta aquí las columnas existían en toda tabla de negocio y nadie las
-- llenaba. Si las llenara el panel, una petición directa a PostgREST podría
-- mandar el id de otra persona. Con este trigger, el autor es siempre el del
-- JWT con el que llega la petición.
--
-- Sin sesión (migraciones, cron, service_role) `auth.uid()` es null y se
-- respeta lo que venga: esas escrituras no las hace una persona.
-- =============================================================================

create or replace function app.sellar_autoria()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_autor uuid := auth.uid();
begin
  if tg_op = 'INSERT' then
    new.created_by := coalesce(v_autor, new.created_by);
    new.updated_by := coalesce(v_autor, new.updated_by);
  else
    new.created_by := old.created_by;
    new.updated_by := coalesce(v_autor, old.updated_by);
  end if;
  return new;
end;
$$;

comment on function app.sellar_autoria() is
  'Trigger BEFORE INSERT/UPDATE: created_by y updated_by salen del JWT, no de la petición.';

-- Se aplica a TODA tabla base de `public` que tenga las dos columnas, para
-- que ninguna se quede fuera por olvido. La prueba 0026 recorre la misma
-- lista y falla si una tabla nueva llega sin trigger.
do $$
declare
  v_tabla text;
begin
  for v_tabla in
    select c.table_name
      from information_schema.columns c
      join information_schema.tables t
        on t.table_schema = c.table_schema and t.table_name = c.table_name
     where c.table_schema = 'public'
       and t.table_type = 'BASE TABLE'
       and c.column_name = 'created_by'
       and exists (select 1 from information_schema.columns u
                    where u.table_schema = 'public' and u.table_name = c.table_name
                      and u.column_name = 'updated_by')
  loop
    execute format(
      'create trigger %I before insert or update on public.%I
         for each row execute function app.sellar_autoria()',
      v_tabla || '_sellar_autoria', v_tabla
    );
  end loop;
end;
$$;
```

> `configuracion_sitio` tiene `updated_by` pero no `created_by`, así que queda fuera de este
> trigger. Su `updated_by` lo pone la acción de la tarea 7 con un trigger propio.

- [ ] `supabase db reset` y `supabase test db` → las 6 pasan y las 388 anteriores siguen en verde.
      (Después del reset, `bash supabase/seeds/imagenes/subir-imagenes.sh`: el reset vacía los
      buckets.)
- [ ] `pnpm supabase:tipos` (no cambia ninguna columna, pero así se confirma que el tipo sigue
      igual: `git diff src/tipos` vacío).
- [ ] Commit: `feat(base): la autoría de cada fila la sella la base`

### Paso 3 — Qué secciones ve cada rol

Insumos y Clientes **no** se muestran todavía: un enlace a una pantalla que no existe es peor que
no tenerlo. Entran en F5 y F6 añadiendo una línea aquí.

- [ ] Escribir `src/lib/panel/navegacion.test.ts`:

```ts
import { describe, expect, it } from "vitest";

import { esSeccionActiva, seccionesPara } from "./navegacion";

const nombres = (rol: Parameters<typeof seccionesPara>[0]) =>
  seccionesPara(rol).map((s) => s.nombre);

describe("seccionesPara", () => {
  it("el administrador ve las cuatro secciones de F4", () => {
    expect(nombres("administrador")).toEqual(["Inicio", "Contenido", "Usuarios", "Configuración"]);
  });

  it("el ingeniero ve inicio y contenido, no usuarios ni configuración", () => {
    expect(nombres("ingeniero")).toEqual(["Inicio", "Contenido"]);
  });

  it("el repartidor solo ve el inicio hasta que existan clientes (F6)", () => {
    expect(nombres("repartidor")).toEqual(["Inicio"]);
  });

  it("la barra inferior nunca lleva más de cuatro botones propios", () => {
    for (const rol of ["superadmin", "administrador", "ingeniero", "repartidor"] as const) {
      expect(seccionesPara(rol).filter((s) => s.enBarraInferior).length).toBeLessThanOrEqual(4);
    }
  });
});

describe("esSeccionActiva", () => {
  it("una subruta activa a su sección", () => {
    expect(esSeccionActiva("/admin/contenido/productos/abc", "/admin/contenido")).toBe(true);
  });

  it("el inicio solo se activa en /admin exacto", () => {
    expect(esSeccionActiva("/admin/contenido", "/admin")).toBe(false);
    expect(esSeccionActiva("/admin", "/admin")).toBe(true);
  });

  it("un prefijo que no es carpeta no cuenta", () => {
    expect(esSeccionActiva("/admin/contenidos", "/admin/contenido")).toBe(false);
  });
});
```

- [ ] `pnpm test -- src/lib/panel/navegacion.test.ts` → FAIL («Cannot find module»).
- [ ] Escribir `src/lib/panel/navegacion.ts`:

```ts
import { puedeAcceder, type Rol } from "@/lib/auth/roles";

/**
 * Las secciones del panel, en el orden en que se muestran.
 *
 * Aquí se decide qué se ENSEÑA; quién puede ENTRAR lo decide `roles.ts` y, de
 * verdad, la RLS. Por eso cada sección se filtra con `puedeAcceder`: si un rol
 * pierde acceso a una ruta, pierde también el botón, sin tocar este archivo.
 */
export type NombreIcono = "inicio" | "contenido" | "usuarios" | "configuracion";

export type SeccionPanel = {
  ruta: string;
  nombre: string;
  icono: NombreIcono;
  /** Va en la barra inferior del celular; si no, dentro de «Más». */
  enBarraInferior: boolean;
};

export const SUBSECCIONES_DE_CONTENIDO = [
  { ruta: "/admin/contenido/productos", nombre: "Productos" },
  { ruta: "/admin/contenido/categorias", nombre: "Categorías" },
  { ruta: "/admin/contenido/novedades", nombre: "Novedades" },
  { ruta: "/admin/contenido/portada", nombre: "Portada" },
  { ruta: "/admin/contenido/galeria", nombre: "Galería" },
  { ruta: "/admin/contenido/preguntas", nombre: "Preguntas frecuentes" },
  { ruta: "/admin/contenido/guias", nombre: "Guías" },
  { ruta: "/admin/contenido/testimonios", nombre: "Testimonios" },
] as const;

const SECCIONES: readonly SeccionPanel[] = [
  { ruta: "/admin", nombre: "Inicio", icono: "inicio", enBarraInferior: true },
  { ruta: "/admin/contenido", nombre: "Contenido", icono: "contenido", enBarraInferior: true },
  { ruta: "/admin/usuarios", nombre: "Usuarios", icono: "usuarios", enBarraInferior: true },
  {
    ruta: "/admin/configuracion",
    nombre: "Configuración",
    icono: "configuracion",
    enBarraInferior: false,
  },
];

export function seccionesPara(rol: Rol): SeccionPanel[] {
  return SECCIONES.filter((seccion) => puedeAcceder(rol, seccion.ruta));
}

/** `/admin` solo se marca activo en sí mismo; el resto, en cualquier subruta. */
export function esSeccionActiva(actual: string, ruta: string): boolean {
  if (ruta === "/admin") return actual === "/admin";
  return actual === ruta || actual.startsWith(`${ruta}/`);
}
```

- [ ] `pnpm test -- src/lib/panel/navegacion.test.ts` → PASS.

> Las rutas de `SUBSECCIONES_DE_CONTENIDO` que todavía no existen dan 404 hasta su tarea. El índice
> de Contenido (paso 9) solo pinta las que ya están construidas, con la lista `CONSTRUIDAS` que cada
> tarea amplía.

### Paso 4 — Errores de Postgres en español

- [ ] Escribir `src/lib/panel/errores.test.ts`:

```ts
import { describe, expect, it } from "vitest";

import { traducirError } from "./errores";

describe("traducirError", () => {
  it("un nombre repetido dice qué cambiar", () => {
    expect(traducirError({ code: "23505", message: "duplicate key" }, "un producto")).toBe(
      "Ya hay un producto con ese nombre. Cámbialo e inténtalo otra vez.",
    );
  });

  it("la RLS se explica como falta de permiso, sin jerga", () => {
    const mensaje = traducirError(
      { code: "42501", message: "new row violates row-level security policy" },
      "una novedad",
    );
    expect(mensaje).toBe(
      "Tu rol no permite hacer esto. Si crees que debería, habla con un administrador.",
    );
  });

  it("una regla propia de la base se muestra tal cual, porque ya está escrita para personas", () => {
    expect(
      traducirError(
        { code: "23514", message: "Las promociones requieren aprobacion de un administrador" },
        "una novedad",
      ),
    ).toBe("Las promociones requieren aprobacion de un administrador");
  });

  it("un check genérico de Postgres no se enseña", () => {
    expect(
      traducirError(
        { code: "23514", message: 'new row for relation "slides" violates check constraint "x"' },
        "un slide",
      ),
    ).toBe("Algún dato no cumple las reglas. Revisa lo que escribiste.");
  });

  it("algo en uso no se puede borrar", () => {
    expect(traducirError({ code: "23503", message: "fk" }, "la categoría")).toBe(
      "No se puede: la categoría todavía se usa en otra parte.",
    );
  });

  it("lo desconocido pide revisar la conexión, nunca enseña el código", () => {
    const mensaje = traducirError({ code: "XX000", message: "internal" }, "un producto");
    expect(mensaje).toBe("No se pudo guardar. Revisa tu conexión e inténtalo otra vez.");
    expect(mensaje).not.toContain("XX000");
  });
});
```

- [ ] `pnpm test -- src/lib/panel/errores.test.ts` → FAIL.
- [ ] Escribir `src/lib/panel/errores.ts`:

```ts
/**
 * Lo que responde PostgREST cuando algo falla, traducido a una frase que dice
 * qué hacer (doc 03 §5.1). Lo usan todas las acciones del panel a través de
 * `ejecutarAccion()`; el mensaje original se deja en el registro del servidor.
 */
export type ErrorDePostgres = {
  code?: string;
  message: string;
  hint?: string | null;
  details?: string | null;
};

/** Un mensaje escrito por Postgres, no por nosotros. Esos no se enseñan. */
function esMensajeDePostgres(mensaje: string): boolean {
  return /violates|constraint|relation "|syntax|permission denied/i.test(mensaje);
}

/**
 * @param entidad con su artículo, tal como encaja en la frase: «un producto»,
 *   «la categoría».
 */
export function traducirError(error: ErrorDePostgres, entidad: string): string {
  switch (error.code) {
    case "23505":
      return `Ya hay ${entidad} con ese nombre. Cámbialo e inténtalo otra vez.`;
    case "42501":
      return "Tu rol no permite hacer esto. Si crees que debería, habla con un administrador.";
    case "23503":
      return `No se puede: ${entidad} todavía se usa en otra parte.`;
    case "PGRST116":
      return `No se encontró ${entidad}. Puede que otra persona lo haya borrado.`;
    case "23514":
    case "P0001":
      // Los triggers y funciones del proyecto escriben su `message` para
      // personas (p. ej. 0010). Los checks de columna, no.
      return esMensajeDePostgres(error.message)
        ? "Algún dato no cumple las reglas. Revisa lo que escribiste."
        : error.message;
    default:
      return "No se pudo guardar. Revisa tu conexión e inténtalo otra vez.";
  }
}
```

- [ ] `pnpm test -- src/lib/panel/errores.test.ts` → PASS.

### Paso 5 — Leer un `FormData` sin repetir conversiones

- [ ] Escribir `src/lib/panel/formulario.test.ts`:

```ts
import { describe, expect, it } from "vitest";

import { casilla, entero, json, texto, textoOpcional } from "./formulario";

const datos = (pares: Record<string, string>) => {
  const fd = new FormData();
  for (const [k, v] of Object.entries(pares)) fd.set(k, v);
  return fd;
};

describe("lectura de FormData", () => {
  it("texto recorta espacios y da cadena vacía si falta", () => {
    expect(texto(datos({ nombre: "  Pan francés " }), "nombre")).toBe("Pan francés");
    expect(texto(datos({}), "nombre")).toBe("");
  });

  it("textoOpcional convierte lo vacío en null, que es lo que guarda la base", () => {
    expect(textoOpcional(datos({ descripcion: "   " }), "descripcion")).toBeNull();
    expect(textoOpcional(datos({ descripcion: "Suave" }), "descripcion")).toBe("Suave");
  });

  it("casilla es true solo si viene marcada", () => {
    expect(casilla(datos({ publicado: "on" }), "publicado")).toBe(true);
    expect(casilla(datos({}), "publicado")).toBe(false);
  });

  it("entero devuelve null ante algo que no es un número entero", () => {
    expect(entero(datos({ orden: "3" }), "orden")).toBe(3);
    expect(entero(datos({ orden: "tres" }), "orden")).toBeNull();
    expect(entero(datos({}), "orden")).toBeNull();
  });

  it("json devuelve null si el campo no es JSON válido", () => {
    expect(json(datos({ lista: '[{"a":1}]' }), "lista")).toEqual([{ a: 1 }]);
    expect(json(datos({ lista: "{roto" }), "lista")).toBeNull();
  });
});
```

- [ ] `pnpm test -- src/lib/panel/formulario.test.ts` → FAIL.
- [ ] Escribir `src/lib/panel/formulario.ts`:

```ts
/**
 * Lectura de campos de un `FormData`. Solo convierte; valida Zod después.
 * Los formularios del panel son nativos (sin react-hook-form), así que lo que
 * llega a la acción es siempre texto.
 */
function crudo(fd: FormData, nombre: string): string {
  const valor = fd.get(nombre);
  return typeof valor === "string" ? valor : "";
}

export function texto(fd: FormData, nombre: string): string {
  return crudo(fd, nombre).trim();
}

export function textoOpcional(fd: FormData, nombre: string): string | null {
  const valor = texto(fd, nombre);
  return valor === "" ? null : valor;
}

export function casilla(fd: FormData, nombre: string): boolean {
  return crudo(fd, nombre) === "on";
}

export function entero(fd: FormData, nombre: string): number | null {
  const valor = texto(fd, nombre);
  return /^-?\d+$/.test(valor) ? Number(valor) : null;
}

export function json(fd: FormData, nombre: string): unknown {
  try {
    return JSON.parse(crudo(fd, nombre));
  } catch {
    return null;
  }
}
```

- [ ] `pnpm test -- src/lib/panel/formulario.test.ts` → PASS.

### Paso 6 — `ejecutarAccion()`

No lleva prueba unitaria: todo lo que hace es coser piezas que ya la tienen (Zod, `traducirError`,
`exigirAcceso`) con `next/cache` y Supabase, que no se ejecutan fuera de Next. La cubren los E2E
de cada pantalla.

- [ ] `pnpm add server-only`
- [ ] Escribir `src/lib/panel/accion.ts`:

```ts
import "server-only";

import { updateTag } from "next/cache";
import * as z from "zod";

import type { Rol } from "@/lib/auth/roles";
import { exigirAcceso, type Sesion } from "@/lib/auth/sesion";
import type { Etiqueta } from "@/lib/datos/etiquetas";
import { crearClienteServidor } from "@/lib/supabase/servidor";

import { traducirError, type ErrorDePostgres } from "./errores";

export type EstadoAccion =
  | { estado: "inicial" }
  | { estado: "ok"; mensaje: string; id?: string; extra?: Record<string, string> }
  | { estado: "error"; mensaje: string; errores?: Record<string, string[] | undefined> };

export const ESTADO_INICIAL: EstadoAccion = { estado: "inicial" };

export type ContextoAccion = {
  supabase: Awaited<ReturnType<typeof crearClienteServidor>>;
  sesion: Sesion & { rol: Rol };
};

export type ResultadoDeBase = {
  error: ErrorDePostgres | null;
  id?: string;
  /** Sustituye a `mensajeOk` cuando el resultado depende de algo que solo sabe `hacer`. */
  mensaje?: string;
  /** Lo que la pantalla necesita de vuelta y no es un id (la contraseña temporal, T6). */
  extra?: Record<string, string>;
};

export type OpcionesAccion<S extends z.ZodType> = {
  /** La ruta del panel que protege la acción: se vuelve a comprobar aquí. */
  ruta: string;
  esquema: S;
  entrada: unknown;
  /** Con artículo, como encaja en «Ya hay ___ con ese nombre». */
  entidad: string;
  etiquetas: readonly Etiqueta[];
  /** Puede depender de lo guardado: «Guardado. Ya se ve en el sitio» solo si se publicó. */
  mensajeOk: string | ((datos: z.output<S>) => string);
  hacer: (datos: z.output<S>, contexto: ContextoAccion) => Promise<ResultadoDeBase>;
};

/**
 * El camino de toda acción del panel que escribe:
 *
 *   1. `exigirAcceso` — las Server Functions se resuelven como POST a su ruta y
 *      un cambio de `matcher` puede sacarlas del proxy sin avisar.
 *   2. Zod — el mismo esquema que valida en el navegador.
 *   3. La escritura, con el JWT del usuario: la RLS decide.
 *   4. El error de Postgres, traducido; el original, al registro.
 *   5. `updateTag` — el sitio público muestra el cambio en la siguiente visita,
 *      sin redesplegar. Solo si la escritura salió bien.
 */
export async function ejecutarAccion<S extends z.ZodType>(
  op: OpcionesAccion<S>,
): Promise<EstadoAccion> {
  const sesion = await exigirAcceso(op.ruta);

  const validado = op.esquema.safeParse(op.entrada);
  if (!validado.success) {
    const errores = z.flattenError(validado.error).fieldErrors as Record<
      string,
      string[] | undefined
    >;
    return { estado: "error", mensaje: "Revisa los campos marcados en rojo.", errores };
  }

  const supabase = await crearClienteServidor();
  const {
    error,
    id,
    mensaje: mensajeDeHacer,
    extra,
  } = await op.hacer(validado.data, {
    supabase,
    sesion,
  });

  if (error) {
    console.error(
      `[panel] ${op.entidad}: código ${error.code ?? "?"} — ${error.message}`,
      error.hint ? `Pista: ${error.hint}` : "",
      error.details ? `Detalle: ${error.details}` : "",
    );
    return { estado: "error", mensaje: traducirError(error, op.entidad) };
  }

  for (const etiqueta of op.etiquetas) updateTag(etiqueta);
  const mensaje =
    mensajeDeHacer ??
    (typeof op.mensajeOk === "function" ? op.mensajeOk(validado.data) : op.mensajeOk);
  return { estado: "ok", mensaje, id, extra };
}
```

- [ ] `pnpm typecheck` → sin errores.
- [ ] Commit: `feat(panel): acciones con acceso, validación y errores en español`

### Paso 7 — Componentes de shadcn

- [ ] Añadirlos con la CLI que ya está en `dependencies` (sin TTY hace falta `--yes`):

```bash
pnpm exec shadcn add input label textarea tabs alert-dialog sheet sonner --yes
```

**No** se añaden `select` ni `switch`: los de Radix no son controles nativos (dibujan un botón y
esconden el valor), así que la copia local no puede restaurarlos escribiendo en el DOM. En el panel
se usan `<select>` e `<input type="checkbox" role="switch">` nativos con estilo propio.

- [ ] Revisar el diff: la CLI **no** debe tocar `src/app/layout.tsx` ni meter fuentes de Google (le
      pasó a `shadcn init` en F1). Si lo hace, revertir esa parte con `git checkout -- src/app/layout.tsx`.
- [ ] `sonner` trae su propio `Toaster` con `next-themes`. El panel no tiene tema oscuro: en
      `src/components/ui/sonner.tsx`, quitar la importación de `next-themes` y fijar `theme="light"`.
      Si la CLI añadió `next-themes` a `package.json`, `pnpm remove next-themes`.
- [ ] `pnpm typecheck && pnpm lint` → sin avisos.
- [ ] Commit: `chore(ui): componentes de shadcn para los formularios del panel`

### Paso 8 — La cáscara

- [ ] Escribir `src/components/panel/etiqueta-estado.tsx`:

```tsx
import type { Database } from "@/tipos/database.types";

// El enum vive en el esquema `app`, que no se expone: el tipo generado aparece
// como unión literal en cada columna, no en `Enums`. Se toma de una de ellas.
export type EstadoPublicacion = Database["public"]["Tables"]["productos"]["Row"]["estado"];

const TEXTO: Record<EstadoPublicacion, string> = {
  borrador: "Borrador",
  en_revision: "En revisión",
  publicado: "Publicado",
  archivado: "Archivado",
};

// Cada estado lleva su palabra además del color: un estado que solo se
// distingue por color no se distingue (doc 03 §3.4).
const CLASES: Record<EstadoPublicacion, string> = {
  borrador: "bg-muted text-foreground",
  en_revision: "bg-alerta/15 text-foreground",
  publicado: "bg-exito/15 text-foreground",
  archivado: "bg-muted text-muted-foreground",
};

export function EtiquetaEstado({ estado }: { estado: EstadoPublicacion }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${CLASES[estado]}`}
      data-estado={estado}
    >
      {TEXTO[estado]}
    </span>
  );
}
```

- [ ] Escribir `src/components/panel/barra-lateral.tsx`:

```tsx
"use client";

import { ExternalLink, House, LayoutGrid, LogOut, Settings, Users } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { cerrarSesion } from "@/lib/acciones/autenticacion";
import { esSeccionActiva, type NombreIcono, type SeccionPanel } from "@/lib/panel/navegacion";

export const ICONOS: Record<NombreIcono, typeof House> = {
  inicio: House,
  contenido: LayoutGrid,
  usuarios: Users,
  configuracion: Settings,
};

type Props = { secciones: SeccionPanel[]; nombre: string; rol: string };

export function BarraLateral({ secciones, nombre, rol }: Props) {
  const actual = usePathname();

  return (
    <aside className="bg-primary text-primary-foreground sticky top-0 hidden h-dvh flex-col gap-1 p-3 md:flex">
      <p className="font-heading px-3 pt-2 pb-4 text-lg">Pimpo&apos;s · Panel</p>
      <nav aria-label="Secciones del panel" className="flex flex-col gap-1">
        {secciones.map((seccion) => {
          const Icono = ICONOS[seccion.icono];
          const activa = esSeccionActiva(actual, seccion.ruta);
          return (
            <Link
              key={seccion.ruta}
              href={seccion.ruta}
              aria-current={activa ? "page" : undefined}
              className={`flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm ${
                activa ? "bg-white/15 font-semibold" : "opacity-85 hover:bg-white/10"
              }`}
            >
              <Icono aria-hidden className="size-5" />
              {seccion.nombre}
            </Link>
          );
        })}
      </nav>
      <div className="mt-auto flex flex-col gap-1 border-t border-white/20 pt-3 text-sm">
        <p className="px-3">
          {nombre}
          <span className="block text-xs opacity-75">{rol}</span>
        </p>
        <Link
          href="/"
          target="_blank"
          className="flex min-h-11 items-center gap-3 rounded-lg px-3 hover:bg-white/10"
        >
          <ExternalLink aria-hidden className="size-5" /> Ver el sitio
        </Link>
        <form action={cerrarSesion}>
          <button
            type="submit"
            className="flex min-h-11 w-full items-center gap-3 rounded-lg px-3 text-left hover:bg-white/10"
          >
            <LogOut aria-hidden className="size-5" /> Cerrar sesión
          </button>
        </form>
      </div>
    </aside>
  );
}
```

- [ ] Escribir `src/components/panel/barra-inferior.tsx`:

```tsx
"use client";

import { Ellipsis, ExternalLink, LogOut } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cerrarSesion } from "@/lib/acciones/autenticacion";
import { esSeccionActiva, type SeccionPanel } from "@/lib/panel/navegacion";

import { ICONOS } from "./barra-lateral";

type Props = { secciones: SeccionPanel[]; nombre: string; rol: string };

/**
 * Navegación del celular: fija abajo, al alcance del pulgar (decisión 9).
 * Las secciones que no caben van en «Más», junto a «Ver el sitio» y
 * «Cerrar sesión».
 */
export function BarraInferior({ secciones, nombre, rol }: Props) {
  const actual = usePathname();
  const visibles = secciones.filter((s) => s.enBarraInferior);
  const enMas = secciones.filter((s) => !s.enBarraInferior);

  return (
    <nav
      aria-label="Secciones del panel, en la barra inferior"
      className="bg-card border-border fixed inset-x-0 bottom-0 z-40 grid border-t pb-[env(safe-area-inset-bottom)] md:hidden"
      style={{ gridTemplateColumns: `repeat(${visibles.length + 1}, minmax(0, 1fr))` }}
    >
      {visibles.map((seccion) => {
        const Icono = ICONOS[seccion.icono];
        const activa = esSeccionActiva(actual, seccion.ruta);
        return (
          <Link
            key={seccion.ruta}
            href={seccion.ruta}
            aria-current={activa ? "page" : undefined}
            className={`flex min-h-14 flex-col items-center justify-center gap-0.5 text-xs ${
              activa ? "text-primary font-bold" : "text-muted-foreground"
            }`}
          >
            <Icono aria-hidden className="size-5" />
            {seccion.nombre}
          </Link>
        );
      })}
      <Sheet>
        <SheetTrigger className="text-muted-foreground flex min-h-14 flex-col items-center justify-center gap-0.5 text-xs">
          <Ellipsis aria-hidden className="size-5" />
          Más
        </SheetTrigger>
        <SheetContent side="bottom" className="gap-1 pb-[calc(1rem+env(safe-area-inset-bottom))]">
          <SheetHeader>
            <SheetTitle>
              {nombre}{" "}
              <span className="text-muted-foreground block text-sm font-normal">{rol}</span>
            </SheetTitle>
          </SheetHeader>
          {enMas.map((seccion) => {
            const Icono = ICONOS[seccion.icono];
            return (
              <Link
                key={seccion.ruta}
                href={seccion.ruta}
                className="flex min-h-12 items-center gap-3 px-4"
              >
                <Icono aria-hidden className="size-5" /> {seccion.nombre}
              </Link>
            );
          })}
          <Link href="/" target="_blank" className="flex min-h-12 items-center gap-3 px-4">
            <ExternalLink aria-hidden className="size-5" /> Ver el sitio
          </Link>
          <form action={cerrarSesion}>
            <button
              type="submit"
              className="flex min-h-12 w-full items-center gap-3 px-4 text-left"
            >
              <LogOut aria-hidden className="size-5" /> Cerrar sesión
            </button>
          </form>
        </SheetContent>
      </Sheet>
    </nav>
  );
}
```

- [ ] Escribir `src/components/panel/cascara-panel.tsx`:

```tsx
import type { ReactNode } from "react";

import { Toaster } from "@/components/ui/sonner";
import { NOMBRE_DEL_ROL, type Rol } from "@/lib/auth/roles";
import { seccionesPara } from "@/lib/panel/navegacion";

import { BarraInferior } from "./barra-inferior";
import { BarraLateral } from "./barra-lateral";

type Props = { rol: Rol; nombre: string; children: ReactNode };

export function CascaraPanel({ rol, nombre, children }: Props) {
  const secciones = seccionesPara(rol);
  const nombreDelRol = NOMBRE_DEL_ROL[rol];

  return (
    <div className="bg-background min-h-dvh md:grid md:grid-cols-[15rem_minmax(0,1fr)]">
      <BarraLateral secciones={secciones} nombre={nombre} rol={nombreDelRol} />
      {/* El hueco de la barra inferior va en el último bloque, no en <main>:
          es la trampa del botón flotante de F3. */}
      <div className="flex min-h-dvh flex-col">
        <main id="contenido" className="mx-auto w-full max-w-5xl flex-1 px-4 py-5 md:px-8 md:py-8">
          {children}
        </main>
        <div aria-hidden className="h-[calc(3.5rem+env(safe-area-inset-bottom))] md:hidden" />
      </div>
      <BarraInferior secciones={secciones} nombre={nombre} rol={nombreDelRol} />
      <Toaster position="top-center" richColors />
    </div>
  );
}
```

- [ ] Escribir `src/app/(admin)/admin/layout.tsx`:

```tsx
import type { Metadata } from "next";
import { Suspense } from "react";

import { CascaraPanel } from "@/components/panel/cascara-panel";
import { exigirAcceso } from "@/lib/auth/sesion";
import { crearClienteServidor } from "@/lib/supabase/servidor";

export const metadata: Metadata = {
  title: "Panel",
  robots: { index: false, follow: false },
};

/**
 * La sesión sale de una cookie, así que todo lo que la lee va dentro de
 * <Suspense>: con Cache Components, leerla fuera ataría el render entero a la
 * petición y el build se negaría a prerenderizar.
 */
export default function LayoutPanel({ children }: LayoutProps<"/admin">) {
  return (
    <Suspense fallback={<p className="text-muted-foreground p-6 text-sm">Cargando el panel…</p>}>
      <CascaraConSesion>{children}</CascaraConSesion>
    </Suspense>
  );
}

async function CascaraConSesion({ children }: { children: React.ReactNode }) {
  const sesion = await exigirAcceso("/admin");
  const supabase = await crearClienteServidor();
  const { data } = await supabase
    .from("perfiles")
    .select("nombre_completo")
    .eq("id", sesion.usuarioId)
    .single();

  return (
    <CascaraPanel rol={sesion.rol} nombre={data?.nombre_completo ?? sesion.correo ?? ""}>
      {children}
    </CascaraPanel>
  );
}
```

- [ ] Escribir `src/components/panel/encabezado-panel.tsx`:

```tsx
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

type Props = {
  titulo: string;
  /** A dónde vuelve «‹». En el celular sustituye a las migas. */
  volver?: { ruta: string; nombre: string };
  /** La acción principal de la pantalla, visible sin bajar. */
  accion?: ReactNode;
  descripcion?: string;
};

export function EncabezadoPanel({ titulo, volver, accion, descripcion }: Props) {
  return (
    <header className="mb-5 flex flex-col gap-2">
      {volver ? (
        <Link
          href={volver.ruta}
          className="text-muted-foreground inline-flex min-h-11 w-fit items-center gap-1 text-sm"
        >
          <ChevronLeft aria-hidden className="size-4" /> {volver.nombre}
        </Link>
      ) : null}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-heading text-primary text-2xl md:text-3xl">{titulo}</h1>
        {accion}
      </div>
      {descripcion ? (
        <p className="text-muted-foreground max-w-prose text-sm">{descripcion}</p>
      ) : null}
    </header>
  );
}
```

> `font-heading` y `text-primary` son las utilidades que ya usa `TituloSeccion` del sitio.

- [ ] Escribir `src/components/panel/lista-adaptable.tsx`:

```tsx
import Link from "next/link";
import type { ReactNode } from "react";

export type Columna<F> = {
  titulo: string;
  celda: (fila: F) => ReactNode;
  /** La que da nombre a la fila: en la tarjeta va arriba y en negrita. */
  principal?: boolean;
};

type Props<F extends { id: string }> = {
  filas: readonly F[];
  columnas: readonly Columna<F>[];
  enlace: (fila: F) => string;
  /** Lo que se ve cuando no hay nada: qué es y cómo empezar. */
  vacio: ReactNode;
  /** Botones por fila (ordenar, borrar). Van fuera del enlace. */
  acciones?: (fila: F) => ReactNode;
  etiqueta: string;
};

/**
 * Tabla en escritorio, tarjetas a 375 px (doc 03 §5.1). Nunca una tabla con
 * desplazamiento lateral: en el celular no se ve la columna que importa.
 */
export function ListaAdaptable<F extends { id: string }>({
  filas,
  columnas,
  enlace,
  vacio,
  acciones,
  etiqueta,
}: Props<F>) {
  if (filas.length === 0) {
    return <div className="bg-card rounded-xl border p-6 text-center">{vacio}</div>;
  }

  const principal = columnas.find((c) => c.principal) ?? columnas[0];
  const resto = columnas.filter((c) => c !== principal);

  return (
    <>
      <ul aria-label={etiqueta} className="flex flex-col gap-2 md:hidden">
        {filas.map((fila) => (
          <li key={fila.id} className="bg-card flex items-center gap-2 rounded-xl border p-3">
            <Link href={enlace(fila)} className="flex min-h-11 flex-1 flex-col justify-center">
              <span className="font-semibold">{principal.celda(fila)}</span>
              <span className="text-muted-foreground flex flex-wrap gap-x-2 text-sm">
                {resto.map((c) => (
                  <span key={c.titulo}>{c.celda(fila)}</span>
                ))}
              </span>
            </Link>
            {acciones ? <div className="flex items-center gap-1">{acciones(fila)}</div> : null}
          </li>
        ))}
      </ul>

      <table className="bg-card hidden w-full overflow-hidden rounded-xl border text-sm md:table">
        <caption className="sr-only">{etiqueta}</caption>
        <thead className="bg-muted text-left">
          <tr>
            {columnas.map((c) => (
              <th key={c.titulo} scope="col" className="px-4 py-3 font-semibold">
                {c.titulo}
              </th>
            ))}
            {acciones ? (
              <th scope="col" className="px-4 py-3">
                <span className="sr-only">Acciones</span>
              </th>
            ) : null}
          </tr>
        </thead>
        <tbody>
          {filas.map((fila) => (
            <tr key={fila.id} className="border-t">
              {columnas.map((c) => (
                <td key={c.titulo} className="px-4 py-2">
                  {c === principal ? (
                    <Link
                      href={enlace(fila)}
                      className="inline-flex min-h-11 items-center font-semibold hover:underline"
                    >
                      {c.celda(fila)}
                    </Link>
                  ) : (
                    c.celda(fila)
                  )}
                </td>
              ))}
              {acciones ? (
                <td className="px-4 py-2">
                  <div className="flex justify-end gap-1">{acciones(fila)}</div>
                </td>
              ) : null}
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
```

> `ListaAdaptable` es un Server Component, pero sus props son **funciones**, así que solo se puede
> usar desde otro Server Component (una `page.tsx`), nunca pasarle funciones desde un
> `"use client"`. Es justo como se usa en todas las tareas.

- [ ] Escribir `src/components/panel/confirmar-borrado.tsx`:

```tsx
"use client";

import { Trash } from "lucide-react";
import { useTransition } from "react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import type { EstadoAccion } from "@/lib/panel/accion";

type Props = {
  /** Lo que se borra, con su nombre real: «el producto Pan francés». */
  nombre: string;
  accion: () => Promise<EstadoAccion>;
};

export function ConfirmarBorrado({ nombre, accion }: Props) {
  const [pendiente, iniciar] = useTransition();

  return (
    <AlertDialog>
      <AlertDialogTrigger
        className="text-destructive hover:bg-destructive/10 inline-flex size-11 items-center justify-center rounded-full"
        aria-label={`Borrar ${nombre}`}
      >
        <Trash aria-hidden className="size-5" />
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Borrar {nombre}?</AlertDialogTitle>
          <AlertDialogDescription>
            Dejará de verse en el sitio y en esta lista. Si fue un error, un administrador puede
            recuperarlo.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="boton-linea">No, dejarlo</AlertDialogCancel>
          <AlertDialogAction
            className="boton-cta bg-destructive"
            disabled={pendiente}
            onClick={() =>
              iniciar(async () => {
                const resultado = await accion();
                if (resultado.estado === "ok") toast.success(resultado.mensaje);
                if (resultado.estado === "error") toast.error(resultado.mensaje);
              })
            }
          >
            Sí, borrar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
```

> «un administrador puede recuperarlo» es cierto en la base (borrado lógico) pero la pantalla de
> papelera no está en F4: se recupera poniendo `deleted_at = null` desde el editor SQL. Si al
> revisar la tarea se prefiere no prometerlo, cambiar la frase por «Dejará de verse en el sitio y en
> esta lista.»

- [ ] Commit: `feat(panel): cáscara con barra lateral, barra inferior y piezas de lista`

### Paso 9 — Inicio e índice de Contenido

- [ ] Reescribir `src/app/(admin)/admin/page.tsx`:

```tsx
import Link from "next/link";
import { Suspense } from "react";

import { EncabezadoPanel } from "@/components/panel/encabezado-panel";
import { exigirAcceso } from "@/lib/auth/sesion";
import { seccionesPara } from "@/lib/panel/navegacion";
import { crearClienteServidor } from "@/lib/supabase/servidor";

export default function Inicio({ searchParams }: PageProps<"/admin">) {
  return (
    <Suspense fallback={null}>
      <InicioConSesion searchParams={searchParams} />
    </Suspense>
  );
}

async function InicioConSesion({
  searchParams,
}: {
  searchParams: PageProps<"/admin">["searchParams"];
}) {
  // `searchParams` es una Promise en Next 16, y se espera DENTRO del Suspense.
  const { motivo } = await searchParams;
  const sesion = await exigirAcceso("/admin");
  const secciones = seccionesPara(sesion.rol).filter((s) => s.ruta !== "/admin");
  const avisos = await contarAvisos(sesion.rol);

  return (
    <>
      <EncabezadoPanel titulo="Inicio" />
      {motivo === "sin-acceso" ? (
        <p role="status" className="bg-alerta/15 mb-4 rounded-xl p-3 text-sm">
          Esa sección no está disponible para tu rol.
        </p>
      ) : null}

      {avisos.length > 0 ? (
        <section aria-labelledby="avisos" className="mb-6 flex flex-col gap-2">
          <h2 id="avisos" className="font-semibold">
            Para revisar
          </h2>
          {avisos.map((aviso) => (
            <Link
              key={aviso.ruta}
              href={aviso.ruta}
              data-aviso={aviso.clave}
              className="bg-card flex min-h-12 items-center rounded-xl border p-4"
            >
              {aviso.texto}
            </Link>
          ))}
        </section>
      ) : null}

      <section aria-labelledby="atajos">
        <h2 id="atajos" className="mb-2 font-semibold">
          Tus secciones
        </h2>
        <ul className="grid gap-2 sm:grid-cols-2">
          {secciones.map((s) => (
            <li key={s.ruta}>
              <Link
                href={s.ruta}
                data-seccion={s.nombre}
                className="tarjeta flex min-h-16 items-center p-4 font-semibold"
              >
                {s.nombre}
              </Link>
            </li>
          ))}
        </ul>
        {secciones.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            Por ahora tu rol no tiene secciones en el panel. Clientes llega pronto.
          </p>
        ) : null}
      </section>
    </>
  );
}

type Aviso = { clave: string; texto: string; ruta: string };

/**
 * Cada tarea que añade algo que revisar añade aquí su cuenta. T1 trae la de
 * datos por confirmar; T4, las de promociones.
 */
async function contarAvisos(rol: string): Promise<Aviso[]> {
  const supabase = await crearClienteServidor();
  const avisos: Aviso[] = [];

  if (rol === "superadmin" || rol === "administrador") {
    const { count } = await supabase
      .from("configuracion_sitio")
      .select("clave", { count: "exact", head: true })
      .like("descripcion", "%PENDIENTE%");
    if (count && count > 0) {
      avisos.push({
        clave: "pendientes",
        texto: `${count} ${count === 1 ? "dato del sitio está" : "datos del sitio están"} por confirmar`,
        ruta: "/admin/configuracion",
      });
    }
  }

  return avisos;
}
```

> `motivo` puede llegar como `string[]` si la dirección lo repite; la comparación con
> `"sin-acceso"` ya descarta ese caso sin estrecharlo.

- [ ] Escribir `src/app/(admin)/admin/contenido/page.tsx`:

```tsx
import Link from "next/link";

import { EncabezadoPanel } from "@/components/panel/encabezado-panel";
import { SUBSECCIONES_DE_CONTENIDO } from "@/lib/panel/navegacion";

/**
 * Las pantallas se construyen tarea a tarea. Cada tarea añade su ruta aquí;
 * así el índice nunca enlaza a un 404.
 */
const CONSTRUIDAS: readonly string[] = [];

export default function Contenido() {
  const disponibles = SUBSECCIONES_DE_CONTENIDO.filter((s) => CONSTRUIDAS.includes(s.ruta));

  return (
    <>
      <EncabezadoPanel
        titulo="Contenido"
        descripcion="Lo que se ve en el sitio. Los cambios se publican al guardar."
      />
      <ul className="grid grid-cols-2 gap-2 md:grid-cols-4">
        {disponibles.map((s) => (
          <li key={s.ruta}>
            <Link href={s.ruta} className="tarjeta flex min-h-20 items-center p-4 font-semibold">
              {s.nombre}
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
```

> Esta página no lee la sesión: el layout ya la exige y la protege. No necesita `<Suspense>`.

- [ ] `pnpm build` → sin errores de prerender («Uncached data was accessed outside of <Suspense>»
      significa que algo lee cookies fuera de un `<Suspense>`: revisar el paso anterior).
- [ ] Commit: `feat(panel): inicio con atajos por rol e índice de contenido`

### Paso 10 — Pruebas de navegador

- [ ] Escribir `e2e/ayudas/sesion.ts`:

```ts
import type { Page } from "@playwright/test";

import { crearUsuario, type UsuarioDePrueba } from "./usuarios";

type Rol = "superadmin" | "administrador" | "ingeniero" | "repartidor";

/**
 * Crea un usuario del rol y entra con él. Quien llama tiene que borrarlo al
 * terminar (`borrarUsuario(usuario.id)` en un `finally`).
 */
export async function entrarComo(page: Page, rol: Rol): Promise<UsuarioDePrueba> {
  const usuario = await crearUsuario(rol);
  await page.goto("/ingresar");
  await page.getByLabel("Correo").fill(usuario.correo);
  await page.getByLabel("Contraseña").fill(usuario.clave);
  await page.getByRole("button", { name: "Entrar" }).click();
  await page.waitForURL("/admin");
  return usuario;
}
```

- [ ] Escribir `e2e/panel-cascara.spec.ts`:

```ts
import { expect, test } from "@playwright/test";

import { entrarComo } from "./ayudas/sesion";
import { borrarUsuario } from "./ayudas/usuarios";

test("el ingeniero ve inicio y contenido, y no usuarios ni configuración", async ({
  page,
}, info) => {
  const usuario = await entrarComo(page, "ingeniero");
  try {
    const nav =
      info.project.name === "movil"
        ? page.getByRole("navigation", { name: "Secciones del panel, en la barra inferior" })
        : page.getByRole("navigation", { name: "Secciones del panel" });

    await expect(nav.getByRole("link", { name: "Inicio" })).toBeVisible();
    await expect(nav.getByRole("link", { name: "Contenido" })).toBeVisible();
    await expect(nav.getByRole("link", { name: "Usuarios" })).toHaveCount(0);

    await nav.getByRole("link", { name: "Contenido" }).click();
    await expect(page).toHaveURL("/admin/contenido");
    await expect(nav.getByRole("link", { name: "Contenido" })).toHaveAttribute(
      "aria-current",
      "page",
    );
  } finally {
    await borrarUsuario(usuario.id);
  }
});

test("en el celular, «Más» lleva a configuración y a cerrar sesión", async ({ page }, info) => {
  test.skip(info.project.name !== "movil", "la barra inferior solo existe en el celular");
  const usuario = await entrarComo(page, "administrador");
  try {
    await page.getByRole("button", { name: "Más" }).click();
    await expect(page.getByRole("link", { name: "Configuración" })).toBeVisible();
    await page.getByRole("button", { name: "Cerrar sesión" }).click();
    await expect(page).toHaveURL("/ingresar");
  } finally {
    await borrarUsuario(usuario.id);
  }
});

test("la barra inferior no tapa el final de la página", async ({ page }, info) => {
  test.skip(info.project.name !== "movil", "solo en el celular");
  const usuario = await entrarComo(page, "administrador");
  try {
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    const ultimo = page.locator("main > *").last();
    const caja = await ultimo.boundingBox();
    const barra = await page
      .getByRole("navigation", { name: "Secciones del panel, en la barra inferior" })
      .boundingBox();
    expect(caja && barra && caja.y + caja.height <= barra.y).toBe(true);
  } finally {
    await borrarUsuario(usuario.id);
  }
});
```

- [ ] Escribir `e2e/panel-accesibilidad.spec.ts`:

```ts
import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

import { entrarComo } from "./ayudas/sesion";
import { borrarUsuario } from "./ayudas/usuarios";

/**
 * Las rutas del panel que existen. Cada tarea añade las suyas: axe y el área
 * táctil las recorren todas, a 375 px y en escritorio, sin desactivar reglas.
 */
export const RUTAS_DEL_PANEL = ["/admin", "/admin/contenido"];

test("el panel no tiene errores de axe", async ({ page }) => {
  const usuario = await entrarComo(page, "superadmin");
  try {
    for (const ruta of RUTAS_DEL_PANEL) {
      await page.goto(ruta);
      const { violations } = await new AxeBuilder({ page }).analyze();
      expect(violations, `axe en ${ruta}`).toEqual([]);
    }
  } finally {
    await borrarUsuario(usuario.id);
  }
});

test("todo control del panel mide al menos 44 × 44 px", async ({ page }) => {
  const usuario = await entrarComo(page, "superadmin");
  try {
    for (const ruta of RUTAS_DEL_PANEL) {
      await page.goto(ruta);
      const pequenos = await page.evaluate(() =>
        [
          ...document.querySelectorAll<HTMLElement>(
            "a, button, input, select, textarea, [role=tab]",
          ),
        ]
          .filter((el) => el.offsetParent !== null && el.getAttribute("type") !== "hidden")
          .map((el) => ({ el, caja: el.getBoundingClientRect() }))
          .filter(({ caja }) => caja.width < 44 || caja.height < 44)
          .map(({ el }) => el.outerHTML.slice(0, 120)),
      );
      expect(pequenos, `controles pequeños en ${ruta}`).toEqual([]);
    }
  } finally {
    await borrarUsuario(usuario.id);
  }
});
```

> Si `e2e/tactil.spec.ts` ya tiene una función para medir (con sus exenciones de WCAG 2.5.8),
> importarla en vez de repetir la de arriba. Las casillas (`input[type=checkbox]` dentro de un
> `<label>` de 44 px) cuentan por su etiqueta: exentarlas igual que en `tactil.spec.ts`.

- [ ] Actualizar `e2e/autenticacion.spec.ts`: el inicio ya no pinta las secciones sin permiso con
      `data-permitido="false"`. Sustituir las comprobaciones de `data-permitido` por la presencia o
      ausencia del atajo:

```ts
// superadmin
for (const seccion of ["Contenido", "Usuarios", "Configuración"]) {
  await expect(page.locator(`[data-seccion="${seccion}"]`)).toBeVisible();
}

// repartidor
await expect(page.locator('[data-seccion="Contenido"]')).toHaveCount(0);
```

Y la redirección del repartidor que escribe `/admin/insumos` a mano sigue igual.

- [ ] Liberar el puerto 3000 (`netstat -ano | grep ":3000 " | grep LISTENING`, cerrar ese PID) y
      correr: `pnpm test:e2e e2e/panel-cascara.spec.ts e2e/panel-accesibilidad.spec.ts e2e/autenticacion.spec.ts`
      → PASS en `movil` y `escritorio`.
- [ ] `pnpm test:e2e` completo → los 212 anteriores siguen en verde.
- [ ] Mirarlo a 375 px y a 1280 px con los cuatro roles. Comparar con `DOC/Maquetas/4/cascara-navegacion.html`.
- [ ] Commit: `test(panel): navegación por rol, axe y área táctil del panel`
- [ ] PR `feat/f4-t1-cascara` → CI en verde → fusionar.

---

## Tarea 2 — Categorías: la primera pantalla real y las piezas de formulario

**Rama:** `feat/f4-t2-categorias`

**Qué deja hecho:** las piezas de formulario que usan T3–T7 —copia local, pestañas, campo, barra de
guardar y subida de fotos— estrenadas con el caso más sencillo: las 6 categorías del catálogo. Y la
foto de prueba que cierra el hueco del CI para las fotos que sube el panel.

**Archivos:**

- Crear: `src/lib/panel/borrador.ts` + `.test.ts`, `src/lib/panel/imagen.ts` + `.test.ts`
- Crear: `src/components/panel/{formulario-panel,pestanas-formulario,campo,barra-guardar,subida-imagen}.tsx`
- Crear: `src/lib/validaciones/categoria.ts` + `.test.ts`, `src/lib/acciones/categorias.ts`
- Crear: `src/app/(admin)/admin/contenido/categorias/{page,formulario-categoria}.tsx`,
  `.../categorias/nueva/page.tsx`, `.../categorias/[id]/page.tsx`
- Modificar: `src/app/(admin)/admin/contenido/page.tsx` (`CONSTRUIDAS`),
  `e2e/panel-accesibilidad.spec.ts` (`RUTAS_DEL_PANEL`)
- Crear: `e2e/ayudas/foto.ts`, `e2e/ayudas/base.ts`, `e2e/panel-categorias.spec.ts`

**Interfaces:**

- Consume (T1): `ejecutarAccion`, `EstadoAccion`, `ESTADO_INICIAL`, `texto`, `textoOpcional`,
  `casilla`, `EncabezadoPanel`, `ListaAdaptable`, `ConfirmarBorrado`, `EtiquetaEstado`,
  `entrarComo`. De antes: `generarSlug` (`src/lib/utilidades/slug.ts`), `urlDeImagen`
  (`src/lib/supabase/publico.ts`), `crearClienteNavegador` (`src/lib/supabase/navegador.ts`),
  `ETIQUETAS.catalogo`.
- Produce (lo usan T3–T7):
  - `claveDeBorrador(formulario: string, id: string | null): string`
  - `<FormularioPanel clave accion destino? alGuardar? validar? children />` y `useFormularioPanel(): { errores, pendiente, registrarRestaurable(nombre, fn) }`
  - `<PestanasFormulario pestanas={[{ valor, titulo, campos, contenido }]} />`
  - `<Campo nombre etiqueta ayuda? opcional?>{(props) => <input {...props} />}</Campo>`
  - `<BarraGuardar volver />`
  - `<SubidaImagen nombre bucket carpeta rutaInicial etiqueta comprimir? alSubir? aceptar? maximoBytes? />`
  - `validarArchivo(archivo: { type: string; size: number }): string | null` · `rutaDeSubida(carpeta: string, id: string): string`
  - `fotoDePrueba(page): Promise<{ name; mimeType; buffer }>` · `borrarDeLaBase(tabla, columna, valor)`

### Paso 1 — La copia local, lógica pura

- [ ] Escribir `src/lib/panel/borrador.test.ts`:

```ts
import { describe, expect, it } from "vitest";

import {
  CADUCIDAD_MS,
  borrarBorrador,
  claveDeBorrador,
  guardarBorrador,
  haceCuanto,
  leerBorrador,
  valoresDe,
} from "./borrador";

function almacenFalso() {
  const datos = new Map<string, string>();
  return {
    getItem: (k: string) => datos.get(k) ?? null,
    setItem: (k: string, v: string) => void datos.set(k, v),
    removeItem: (k: string) => void datos.delete(k),
    datos,
  };
}

describe("copia local de un formulario", () => {
  it("la clave distingue el formulario y la fila, y «nuevo» cuando no hay fila", () => {
    expect(claveDeBorrador("producto", "abc")).toBe("pimpos:borrador:producto:abc");
    expect(claveDeBorrador("producto", null)).toBe("pimpos:borrador:producto:nuevo");
  });

  it("guarda y recupera los valores con la hora", () => {
    const almacen = almacenFalso();
    guardarBorrador(almacen, "k", { nombre: "Pan" }, 1000);
    expect(leerBorrador(almacen, "k", 2000)).toEqual({
      valores: { nombre: "Pan" },
      guardadoEn: 1000,
    });
  });

  it("una copia de hace más de 7 días se descarta y se borra", () => {
    const almacen = almacenFalso();
    guardarBorrador(almacen, "k", { nombre: "Pan" }, 0);
    expect(leerBorrador(almacen, "k", CADUCIDAD_MS + 1)).toBeNull();
    expect(almacen.datos.has("k")).toBe(false);
  });

  it("algo que no es una copia válida se ignora sin romper la página", () => {
    const almacen = almacenFalso();
    almacen.setItem("k", "{roto");
    expect(leerBorrador(almacen, "k", 0)).toBeNull();
    almacen.setItem("k", JSON.stringify({ valores: { a: 1 }, guardadoEn: 0 }));
    expect(leerBorrador(almacen, "k", 0)).toBeNull();
  });

  it("si el navegador no deja guardar (modo privado, lleno) no lanza", () => {
    const almacen = {
      getItem: () => null,
      setItem: () => {
        throw new Error("QuotaExceededError");
      },
      removeItem: () => undefined,
    };
    expect(() => guardarBorrador(almacen, "k", { a: "b" }, 0)).not.toThrow();
  });

  it("borrar la quita", () => {
    const almacen = almacenFalso();
    guardarBorrador(almacen, "k", { a: "b" }, 0);
    borrarBorrador(almacen, "k");
    expect(leerBorrador(almacen, "k", 0)).toBeNull();
  });

  it("valoresDe se queda con el texto y descarta archivos", () => {
    const fd = new FormData();
    fd.set("nombre", "Pan");
    fd.set("foto", new File(["x"], "x.png"));
    expect(valoresDe(fd)).toEqual({ nombre: "Pan" });
  });

  it("dice hace cuánto en palabras", () => {
    const minuto = 60_000;
    expect(haceCuanto(0, 20_000)).toBe("hace un momento");
    expect(haceCuanto(0, 12 * minuto)).toBe("hace 12 minutos");
    expect(haceCuanto(0, 60 * minuto)).toBe("hace 1 hora");
    expect(haceCuanto(0, 5 * 60 * minuto)).toBe("hace 5 horas");
    expect(haceCuanto(0, 3 * 24 * 60 * minuto)).toBe("hace 3 días");
  });
});
```

- [ ] `pnpm test -- src/lib/panel/borrador.test.ts` → FAIL.
- [ ] Escribir `src/lib/panel/borrador.ts`:

```ts
/**
 * Copia local de un formulario (decisión 2 del plan 04).
 *
 * Mientras se escribe, lo escrito se guarda en el navegador. Si la señal se
 * corta o se cierra la pestaña, al volver se ofrece recuperarlo. Es texto y
 * nada más: una foto a medio subir no se puede guardar aquí y se vuelve a
 * elegir.
 *
 * Todo recibe el almacén y la hora como argumentos para poder probarlo sin
 * navegador; el componente le pasa `localStorage` y `Date.now()`.
 */
export type ValoresBorrador = Record<string, string>;
export type Borrador = { valores: ValoresBorrador; guardadoEn: number };
type Almacen = Pick<Storage, "getItem" | "setItem" | "removeItem">;

export const CADUCIDAD_MS = 7 * 24 * 60 * 60 * 1000;

export function claveDeBorrador(formulario: string, id: string | null): string {
  return `pimpos:borrador:${formulario}:${id ?? "nuevo"}`;
}

export function valoresDe(fd: FormData): ValoresBorrador {
  const valores: ValoresBorrador = {};
  for (const [nombre, valor] of fd.entries()) {
    if (typeof valor === "string") valores[nombre] = valor;
  }
  return valores;
}

export function guardarBorrador(
  almacen: Almacen,
  clave: string,
  valores: ValoresBorrador,
  ahora: number,
): void {
  try {
    almacen.setItem(clave, JSON.stringify({ valores, guardadoEn: ahora } satisfies Borrador));
  } catch {
    // Modo privado o almacén lleno: se pierde la red de seguridad, no el
    // formulario. No hay nada útil que enseñar.
  }
}

function esBorrador(valor: unknown): valor is Borrador {
  if (typeof valor !== "object" || valor === null) return false;
  const { valores, guardadoEn } = valor as Record<string, unknown>;
  return (
    typeof guardadoEn === "number" &&
    typeof valores === "object" &&
    valores !== null &&
    Object.values(valores).every((v) => typeof v === "string")
  );
}

export function leerBorrador(almacen: Almacen, clave: string, ahora: number): Borrador | null {
  let crudo: string | null;
  try {
    crudo = almacen.getItem(clave);
  } catch {
    return null;
  }
  if (!crudo) return null;

  let valor: unknown;
  try {
    valor = JSON.parse(crudo);
  } catch {
    return null;
  }
  if (!esBorrador(valor)) return null;

  if (ahora - valor.guardadoEn > CADUCIDAD_MS) {
    borrarBorrador(almacen, clave);
    return null;
  }
  return valor;
}

export function borrarBorrador(almacen: Almacen, clave: string): void {
  try {
    almacen.removeItem(clave);
  } catch {
    // Igual que al guardar.
  }
}

export function haceCuanto(desde: number, ahora: number): string {
  const minutos = Math.floor((ahora - desde) / 60_000);
  if (minutos < 1) return "hace un momento";
  if (minutos < 60) return `hace ${minutos} ${minutos === 1 ? "minuto" : "minutos"}`;
  const horas = Math.floor(minutos / 60);
  if (horas < 24) return `hace ${horas} ${horas === 1 ? "hora" : "horas"}`;
  const dias = Math.floor(horas / 24);
  return `hace ${dias} ${dias === 1 ? "día" : "días"}`;
}
```

- [ ] `pnpm test -- src/lib/panel/borrador.test.ts` → PASS.

### Paso 2 — Validar y nombrar una foto, lógica pura

- [ ] Escribir `src/lib/panel/imagen.test.ts`:

```ts
import { describe, expect, it } from "vitest";

import { rutaDeSubida, validarArchivo } from "./imagen";

describe("validarArchivo", () => {
  it("acepta una foto normal de celular", () => {
    expect(validarArchivo({ type: "image/jpeg", size: 4 * 1024 * 1024 })).toBeNull();
  });

  it("rechaza lo que no es una imagen, diciendo qué hacer", () => {
    expect(validarArchivo({ type: "application/pdf", size: 1000 })).toBe(
      "Ese archivo no es una foto. Elige una imagen (JPG, PNG o WebP).",
    );
  });

  it("rechaza una foto de más de 20 MB antes de intentar comprimirla", () => {
    expect(validarArchivo({ type: "image/png", size: 21 * 1024 * 1024 })).toBe(
      "La foto pesa más de 20 MB. Elige otra o tómala con menos calidad.",
    );
  });
});

describe("rutaDeSubida", () => {
  it("arma carpeta/id.webp y limpia barras sobrantes", () => {
    expect(rutaDeSubida("/productos/abc/", "123")).toBe("productos/abc/123.webp");
  });

  it("respeta la extensión si no se comprime", () => {
    expect(rutaDeSubida("marca", "123", "svg")).toBe("marca/123.svg");
  });
});
```

- [ ] `pnpm test -- src/lib/panel/imagen.test.ts` → FAIL.
- [ ] Escribir `src/lib/panel/imagen.ts`:

```ts
/** 20 MB: por encima, comprimir en un celular modesto se cuelga. */
const MAXIMO_BYTES = 20 * 1024 * 1024;

export function validarArchivo(archivo: { type: string; size: number }): string | null {
  if (!archivo.type.startsWith("image/")) {
    return "Ese archivo no es una foto. Elige una imagen (JPG, PNG o WebP).";
  }
  if (archivo.size > MAXIMO_BYTES) {
    return "La foto pesa más de 20 MB. Elige otra o tómala con menos calidad.";
  }
  return null;
}

/**
 * Las filas guardan la ruta dentro del bucket, nunca la URL (ver
 * `urlDeImagen`). El id es un uuid nuevo por subida: reemplazar una foto no
 * pisa la anterior, así que una página ya cacheada no enseña una imagen que
 * cambió por debajo.
 */
export function rutaDeSubida(carpeta: string, id: string, extension = "webp"): string {
  const limpia = carpeta.replace(/^\/+|\/+$/g, "");
  return `${limpia}/${id}.${extension}`;
}
```

- [ ] `pnpm test -- src/lib/panel/imagen.test.ts` → PASS.
- [ ] Commit: `feat(panel): copia local de formularios y reglas de subida de fotos`

### Paso 3 — `FormularioPanel`, `Campo` y `BarraGuardar`

- [ ] Escribir `src/components/panel/formulario-panel.tsx`:

```tsx
"use client";

import { useRouter } from "next/navigation";
import {
  createContext,
  useContext,
  useRef,
  useState,
  useSyncExternalStore,
  useTransition,
  type FormEvent,
  type ReactNode,
} from "react";
import { toast } from "sonner";

import type { EstadoAccion } from "@/lib/panel/accion";
import {
  borrarBorrador,
  guardarBorrador,
  haceCuanto,
  leerBorrador,
  valoresDe,
} from "@/lib/panel/borrador";

type Errores = Record<string, string[] | undefined>;
type Restaurar = (valor: string) => void;

type ContextoFormulario = {
  errores: Errores;
  pendiente: boolean;
  /** Para editores que no son un campo nativo (presentaciones, fotos). */
  registrarRestaurable: (nombre: string, restaurar: Restaurar) => () => void;
  /** Las pestañas se enteran de un fallo para saltar a la que tiene el error. */
  registrarAlFallar: (alFallar: (errores: Errores) => void) => () => void;
};

const Contexto = createContext<ContextoFormulario | null>(null);

export function useFormularioPanel(): ContextoFormulario {
  const valor = useContext(Contexto);
  if (!valor) throw new Error("useFormularioPanel va dentro de <FormularioPanel>.");
  return valor;
}

type Props = {
  /** De `claveDeBorrador()`. */
  clave: string;
  accion: (datos: FormData) => Promise<EstadoAccion>;
  /** A dónde ir tras guardar bien. Sin él, se queda y refresca. */
  destino?: (id: string | undefined) => string;
  /** Para quien tiene que enseñar algo antes de irse (la contraseña temporal, T6). Sustituye a `destino`. */
  alGuardar?: (resultado: Extract<EstadoAccion, { estado: "ok" }>) => void;
  /** Validación en el navegador con el mismo esquema que la acción. */
  validar?: (datos: FormData) => Errores;
  children: ReactNode;
};

const AL_ESCRIBIR_MS = 800;

function suscribir(avisar: () => void) {
  window.addEventListener("storage", avisar);
  return () => window.removeEventListener("storage", avisar);
}

/**
 * El formulario de todas las pantallas del panel.
 *
 * Envía con onSubmit + transición, NO con `<form action>`: React 19 vacía un
 * formulario con `action` al terminar, también cuando vuelve con errores, y la
 * persona perdería lo escrito justo cuando tiene que corregirlo.
 *
 * La copia local que había al abrir se lee con useSyncExternalStore (sin
 * efecto que ponga estado) y no se sobrescribe hasta que la persona decide:
 * si se guardara al primer tecleo, se perdería la copia que se le ofrece.
 */
export function FormularioPanel({ clave, accion, destino, alGuardar, validar, children }: Props) {
  const router = useRouter();
  const formulario = useRef<HTMLFormElement>(null);
  const temporizador = useRef<ReturnType<typeof setTimeout> | null>(null);
  const restaurables = useRef(new Map<string, Restaurar>());
  const alFallar = useRef(new Set<(errores: Errores) => void>());

  const [errores, setErrores] = useState<Errores>({});
  const [pendiente, iniciar] = useTransition();
  const [decidido, setDecidido] = useState(false);

  const crudo = useSyncExternalStore(
    suscribir,
    () => localStorage.getItem(clave),
    () => null,
  );
  const borrador = crudo === null ? null : leerBorrador(localStorage, clave, Date.now());
  const ofrecer = !decidido && borrador !== null;

  function alEscribir() {
    if (ofrecer) return;
    if (!decidido) setDecidido(true);
    if (temporizador.current) clearTimeout(temporizador.current);
    temporizador.current = setTimeout(() => {
      const form = formulario.current;
      if (!form) return;
      const valores = valoresDe(new FormData(form));
      // Una contraseña nunca va a localStorage (T6, primer ingreso).
      for (const campo of form.querySelectorAll<HTMLInputElement>("input[type=password]")) {
        delete valores[campo.name];
      }
      guardarBorrador(localStorage, clave, valores, Date.now());
    }, AL_ESCRIBIR_MS);
  }

  function recuperar() {
    const form = formulario.current;
    if (!form || !borrador) return;
    for (const casilla of form.querySelectorAll<HTMLInputElement>("input[type=checkbox]")) {
      casilla.checked = false;
    }
    for (const [nombre, valor] of Object.entries(borrador.valores)) {
      const campo = form.elements.namedItem(nombre);
      if (campo instanceof RadioNodeList) {
        campo.value = valor;
      } else if (campo instanceof HTMLInputElement && campo.type === "checkbox") {
        campo.checked = valor === "on";
      } else if (
        campo instanceof HTMLInputElement ||
        campo instanceof HTMLTextAreaElement ||
        campo instanceof HTMLSelectElement
      ) {
        campo.value = valor;
      }
      restaurables.current.get(nombre)?.(valor);
    }
    setDecidido(true);
    toast.success("Recuperaste lo que tenías escrito. Revísalo y pulsa Guardar.");
  }

  function descartar() {
    borrarBorrador(localStorage, clave);
    setDecidido(true);
  }

  function fallar(nuevos: Errores) {
    setErrores(nuevos);
    for (const avisar of alFallar.current) avisar(nuevos);
  }

  function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    // El segundo argumento añade el botón pulsado (`name="intencion"`): sin él,
    // novedades no sabría si se pulsó «Guardar» o «Enviar a revisión».
    const datos = new FormData(evento.currentTarget, (evento.nativeEvent as SubmitEvent).submitter);

    const locales = validar?.(datos) ?? {};
    if (Object.values(locales).some((e) => e && e.length > 0)) {
      fallar(locales);
      toast.error("Revisa los campos marcados en rojo.");
      return;
    }

    iniciar(async () => {
      const resultado = await accion(datos);
      if (resultado.estado === "error") {
        fallar(resultado.errores ?? {});
        toast.error(resultado.mensaje);
        return;
      }
      if (resultado.estado === "ok") {
        setErrores({});
        borrarBorrador(localStorage, clave);
        toast.success(resultado.mensaje);
        if (alGuardar) alGuardar(resultado);
        else if (destino) router.push(destino(resultado.id));
        else router.refresh();
      }
    });
  }

  const contexto: ContextoFormulario = {
    errores,
    pendiente,
    registrarRestaurable: (nombre, restaurar) => {
      restaurables.current.set(nombre, restaurar);
      return () => restaurables.current.delete(nombre);
    },
    registrarAlFallar: (avisar) => {
      alFallar.current.add(avisar);
      return () => alFallar.current.delete(avisar);
    },
  };

  return (
    <Contexto value={contexto}>
      {ofrecer && borrador ? (
        <div role="status" className="bg-cta-secundario mb-4 rounded-xl p-4 text-sm" data-borrador>
          <p className="font-semibold">
            Tienes cambios sin guardar de {haceCuanto(borrador.guardadoEn, Date.now())}
          </p>
          <p>Se guardaron en este aparato mientras escribías.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" className="boton-cta" onClick={recuperar}>
              Recuperarlos
            </button>
            <button type="button" className="boton-linea" onClick={descartar}>
              Descartar
            </button>
          </div>
        </div>
      ) : null}
      <form
        ref={formulario}
        onSubmit={enviar}
        onInput={alEscribir}
        onChange={alEscribir}
        noValidate
        className="flex flex-col gap-4"
      >
        {children}
      </form>
    </Contexto>
  );
}
```

> `bg-cta-secundario` es la utilidad del durazno (`--color-cta-secundario` en `globals.css`). Si el
> contraste del texto de tinta sobre ella no está medido en `paleta.test.ts`, añadir el par.
> `<Contexto value>` sin `.Provider` es React 19.
>
> Si `react-hooks/purity` marca los `Date.now()` del render, leer la hora una sola vez con
> `const [ahora] = useState(() => Date.now())` y usar `ahora` en `leerBorrador` y `haceCuanto`
> (al guardar, en el temporizador, sí va `Date.now()`: eso ya no es render). No desactivar la regla.
>
> `Date.now()` en el render de un componente de cliente no rompe el build: la regla de Cache
> Components es para lo que se prerenderiza en el servidor, y aquí el borrador vale `null` en el
> servidor (tercer argumento de `useSyncExternalStore`), así que el aviso solo se pinta en el
> navegador.

- [ ] Escribir `src/components/panel/campo.tsx`:

```tsx
"use client";

import { useId, type ReactNode } from "react";

import { useFormularioPanel } from "./formulario-panel";

export type PropsDeControl = {
  id: string;
  name: string;
  "aria-invalid": boolean;
  "aria-describedby": string | undefined;
  className: string;
};

type Props = {
  nombre: string;
  etiqueta: string;
  ayuda?: string;
  opcional?: boolean;
  children: (control: PropsDeControl) => ReactNode;
};

/** Clase de los controles nativos del panel: 44 px, borde de 3:1, foco visible. */
export const CLASE_CONTROL =
  "min-h-11 w-full rounded-lg border border-input bg-card px-3 py-2 text-base aria-invalid:border-destructive aria-invalid:border-2 focus-visible:outline-2 focus-visible:outline-ring";

export function Campo({ nombre, etiqueta, ayuda, opcional, children }: Props) {
  const id = useId();
  const { errores } = useFormularioPanel();
  const error = errores[nombre]?.[0];
  const idAyuda = ayuda ? `${id}-ayuda` : undefined;
  const idError = error ? `${id}-error` : undefined;

  return (
    <div className="flex flex-col gap-1.5" data-campo={nombre}>
      <label htmlFor={id} className="text-sm font-semibold">
        {etiqueta}
        {opcional ? <span className="text-muted-foreground font-normal"> (opcional)</span> : null}
      </label>
      {children({
        id,
        name: nombre,
        "aria-invalid": Boolean(error),
        "aria-describedby": [idAyuda, idError].filter(Boolean).join(" ") || undefined,
        className: CLASE_CONTROL,
      })}
      {ayuda ? (
        <p id={idAyuda} className="text-muted-foreground text-sm">
          {ayuda}
        </p>
      ) : null}
      {error ? (
        <p id={idError} className="text-destructive text-sm font-semibold">
          {error}
        </p>
      ) : null}
    </div>
  );
}

type PropsInterruptor = { nombre: string; etiqueta: string; ayuda?: string; marcado: boolean };

/** Casilla nativa con aspecto de interruptor: la copia local sí la puede restaurar. */
export function Interruptor({ nombre, etiqueta, ayuda, marcado }: PropsInterruptor) {
  const id = useId();
  return (
    <label htmlFor={id} className="flex min-h-12 items-center justify-between gap-4">
      <span>
        <span className="font-semibold">{etiqueta}</span>
        {ayuda ? <span className="text-muted-foreground block text-sm">{ayuda}</span> : null}
      </span>
      <input
        id={id}
        name={nombre}
        type="checkbox"
        role="switch"
        defaultChecked={marcado}
        className="accent-exito size-6 shrink-0"
      />
    </label>
  );
}
```

- [ ] Escribir `src/components/panel/barra-guardar.tsx`:

```tsx
"use client";

import Link from "next/link";

import { useFormularioPanel } from "./formulario-panel";

/**
 * «Cancelar» y «Guardar» siempre a la vista. En el celular se queda justo
 * encima de la barra inferior de navegación, no debajo.
 */
export function BarraGuardar({ volver }: { volver: string }) {
  const { pendiente } = useFormularioPanel();
  return (
    <div className="bg-background/95 border-border sticky bottom-[calc(3.5rem+env(safe-area-inset-bottom))] z-30 -mx-4 grid grid-cols-2 gap-2 border-t px-4 py-3 md:bottom-0 md:mx-0 md:flex md:justify-end md:border-0 md:px-0">
      <Link href={volver} className="boton-linea">
        Cancelar
      </Link>
      <button type="submit" className="boton-cta" disabled={pendiente} aria-disabled={pendiente}>
        {pendiente ? "Guardando…" : "Guardar"}
      </button>
    </div>
  );
}
```

### Paso 4 — Pestañas que no pierden campos

- [ ] Escribir `src/components/panel/pestanas-formulario.tsx`:

```tsx
"use client";

import { useEffect, useState, type ReactNode } from "react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { useFormularioPanel } from "./formulario-panel";

export type Pestana = {
  valor: string;
  titulo: string;
  /** Los `name` de los campos que viven en esta pestaña. */
  campos: readonly string[];
  contenido: ReactNode;
};

/**
 * Radix desmonta el contenido de las pestañas que no se ven, y un campo
 * desmontado no llega al FormData: se guardaría el producto sin sus precios.
 * Por eso todas llevan `forceMount` y se esconden con CSS.
 */
export function PestanasFormulario({ pestanas }: { pestanas: readonly Pestana[] }) {
  const { errores, registrarAlFallar } = useFormularioPanel();
  const [activa, setActiva] = useState(pestanas[0]?.valor ?? "");

  // Solo registra el aviso; el cambio de pestaña ocurre dentro del envío.
  useEffect(
    () =>
      registrarAlFallar((nuevos) => {
        const conError = pestanas.find((p) => p.campos.some((c) => nuevos[c]?.length));
        if (conError) setActiva(conError.valor);
      }),
    [registrarAlFallar, pestanas],
  );

  return (
    <Tabs value={activa} onValueChange={setActiva}>
      <TabsList
        className="grid w-full"
        style={{ gridTemplateColumns: `repeat(${pestanas.length}, minmax(0, 1fr))` }}
      >
        {pestanas.map((p) => {
          const conError = p.campos.some((c) => errores[c]?.length);
          return (
            <TabsTrigger
              key={p.valor}
              value={p.valor}
              data-con-error={conError || undefined}
              className="data-[con-error]:text-destructive min-h-11"
            >
              {p.titulo}
              {conError ? (
                <>
                  <span
                    aria-hidden
                    className="bg-destructive ml-1.5 inline-block size-2 rounded-full"
                  />
                  <span className="sr-only"> (tiene errores)</span>
                </>
              ) : null}
            </TabsTrigger>
          );
        })}
      </TabsList>
      {pestanas.map((p) => (
        <TabsContent
          key={p.valor}
          value={p.valor}
          forceMount
          className="bg-card mt-3 flex flex-col gap-4 rounded-xl border p-4 data-[state=inactive]:hidden"
        >
          {p.contenido}
        </TabsContent>
      ))}
    </Tabs>
  );
}
```

> `registrarAlFallar` cambia de identidad en cada render de `FormularioPanel` (se crea en el
> cuerpo). Si el efecto se re-ejecuta en bucle o lint avisa, envolver `contexto` en `useMemo` con
> `[errores, pendiente]` y las dos funciones en `useCallback` sin dependencias (solo tocan refs).

### Paso 5 — Subida de fotos

- [ ] `pnpm add browser-image-compression`
- [ ] Escribir `src/components/panel/subida-imagen.tsx`:

```tsx
"use client";

import imageCompression from "browser-image-compression";
import { Camera, ImagePlus } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";

import { rutaDeSubida, validarArchivo } from "@/lib/panel/imagen";
import { crearClienteNavegador } from "@/lib/supabase/navegador";
import { urlDeImagen } from "@/lib/supabase/publico";

import { useFormularioPanel } from "./formulario-panel";

type Bucket = "productos" | "galeria" | "slides" | "marca";

type Props = {
  /** `name` del campo oculto que lleva la ruta a la acción. */
  nombre: string;
  bucket: Bucket;
  carpeta: string;
  rutaInicial: string | null;
  etiqueta: string;
  /** Logo y favicon no se comprimen: un SVG no se toca. */
  comprimir?: boolean;
  /** Para quien sube en el momento sin esperar a «Guardar» (fotos de producto). */
  alSubir?: (ruta: string) => void | Promise<void>;
  aceptar?: string;
  /** El límite del bucket (config.toml). Se comprueba ANTES de subir, con un mensaje que se entiende. */
  maximoBytes?: number;
};

type Fase = { tipo: "quieta" } | { tipo: "subiendo" } | { tipo: "error"; mensaje: string };

/**
 * Doc 03 §5.4: elegir o tomar → comprimir a WebP de 1600 px en el aparato →
 * subir al bucket con la sesión del usuario (la RLS de Storage decide) →
 * guardar la ruta. Sin el paso de comprimir, una foto de celular de 4 MB
 * llena el gigabyte gratuito en unas 250 fotos.
 */
export function SubidaImagen({
  nombre,
  bucket,
  carpeta,
  rutaInicial,
  etiqueta,
  comprimir = true,
  alSubir,
  aceptar = "image/*",
  maximoBytes = 3 * 1024 * 1024,
}: Props) {
  const id = useId();
  const oculto = useRef<HTMLInputElement>(null);
  const [ruta, setRuta] = useState(rutaInicial ?? "");
  const [fase, setFase] = useState<Fase>({ tipo: "quieta" });
  const { errores, registrarRestaurable } = useFormularioPanel();
  const errorDelFormulario = errores[nombre]?.[0];

  useEffect(() => registrarRestaurable(nombre, setRuta), [registrarRestaurable, nombre]);

  async function elegir(archivo: File | undefined) {
    if (!archivo) return;
    const problema = validarArchivo(archivo);
    if (problema) {
      setFase({ tipo: "error", mensaje: problema });
      return;
    }

    setFase({ tipo: "subiendo" });
    try {
      const listo = comprimir
        ? await imageCompression(archivo, {
            maxWidthOrHeight: 1600,
            fileType: "image/webp",
            initialQuality: 0.8,
            maxSizeMB: 1,
            useWebWorker: true,
          })
        : archivo;
      if (listo.size > maximoBytes) {
        setFase({
          tipo: "error",
          mensaje: `El archivo pesa más de ${Math.round(maximoBytes / 1024 / 1024)} MB. Elige uno más liviano.`,
        });
        return;
      }
      const extension = comprimir ? "webp" : (archivo.name.split(".").pop() ?? "png").toLowerCase();
      const nueva = rutaDeSubida(carpeta, crypto.randomUUID(), extension);

      const { error } = await crearClienteNavegador()
        .storage.from(bucket)
        .upload(nueva, listo, { contentType: listo.type || archivo.type, upsert: false });
      if (error) throw error;

      setRuta(nueva);
      await alSubir?.(nueva);
      setFase({ tipo: "quieta" });
      // El campo oculto cambió por código y eso no dispara `input`. Se avisa
      // en la vuelta siguiente del bucle, cuando React ya pintó la ruta nueva:
      // un microtask llegaría antes y la copia local guardaría la vieja.
      setTimeout(() => oculto.current?.dispatchEvent(new Event("input", { bubbles: true })), 0);
    } catch (error) {
      console.error("[panel] subida de imagen", error);
      setFase({
        tipo: "error",
        mensaje: "No se pudo subir la foto. Revisa tu conexión e inténtalo otra vez.",
      });
    }
  }

  const vista = urlDeImagen(bucket, ruta);

  return (
    <fieldset className="flex flex-col gap-3" data-subida={nombre}>
      <legend className="text-sm font-semibold">{etiqueta}</legend>
      <input ref={oculto} type="hidden" name={nombre} value={ruta} />

      {vista ? (
        // eslint-disable-next-line @next/next/no-img-element -- vista previa de un archivo recién subido; next/image exigiría declarar el host y optimizar algo que se ve un segundo
        <img
          src={vista}
          alt=""
          className="bg-muted aspect-video w-full max-w-sm rounded-xl object-cover"
          data-vista-previa
        />
      ) : (
        <p className="text-muted-foreground text-sm">Todavía no hay foto.</p>
      )}

      <div className="flex flex-wrap gap-2">
        <label className="boton-linea cursor-pointer" htmlFor={`${id}-camara`}>
          <Camera aria-hidden className="size-5" /> Tomar foto
        </label>
        <input
          id={`${id}-camara`}
          type="file"
          accept={aceptar}
          capture="environment"
          className="sr-only"
          onChange={(e) => void elegir(e.currentTarget.files?.[0])}
          disabled={fase.tipo === "subiendo"}
        />
        <label className="boton-linea cursor-pointer" htmlFor={`${id}-archivo`}>
          <ImagePlus aria-hidden className="size-5" /> Elegir de la galería
        </label>
        <input
          id={`${id}-archivo`}
          type="file"
          accept={aceptar}
          className="sr-only"
          onChange={(e) => void elegir(e.currentTarget.files?.[0])}
          disabled={fase.tipo === "subiendo"}
        />
      </div>

      <p aria-live="polite" className="text-sm" data-fase={fase.tipo}>
        {fase.tipo === "subiendo" ? "Achicando y subiendo la foto…" : null}
        {fase.tipo === "error" ? (
          <span className="text-destructive font-semibold">{fase.mensaje}</span>
        ) : null}
        {fase.tipo === "quieta" && errorDelFormulario ? (
          <span className="text-destructive font-semibold">{errorDelFormulario}</span>
        ) : null}
      </p>
    </fieldset>
  );
}
```

> Dos botones y no uno: con `capture`, el celular abre la cámara **sin** dejar elegir de la
> galería, y sin `capture` hay que buscar la opción de cámara. Una foto reemplazada se queda en el
> bucket (no se borra al subir la nueva); la limpieza de huérfanas es trabajo de F7 si el espacio lo
> pide.

- [ ] `pnpm typecheck && pnpm lint`.
- [ ] Commit: `feat(panel): formulario con copia local, pestañas y subida de fotos`

### Paso 6 — Categorías: esquema

- [ ] Escribir `src/lib/validaciones/categoria.test.ts`:

```ts
import { describe, expect, it } from "vitest";

import { esquemaCategoria, leerCategoria } from "./categoria";

const fd = (pares: Record<string, string>) => {
  const datos = new FormData();
  for (const [k, v] of Object.entries(pares)) datos.set(k, v);
  return datos;
};

describe("esquemaCategoria", () => {
  it("una categoría nueva publicada es válida", () => {
    const r = esquemaCategoria.safeParse(
      leerCategoria(fd({ nombre: "Panes dulces", publicado: "on" })),
    );
    expect(r.success).toBe(true);
    expect(r.success && r.data).toMatchObject({
      id: null,
      nombre: "Panes dulces",
      publicado: true,
    });
  });

  it("sin nombre dice qué escribir", () => {
    const r = esquemaCategoria.safeParse(leerCategoria(fd({ nombre: "  " })));
    expect(r.success).toBe(false);
    expect(!r.success && r.error.issues[0]?.message).toBe("Escribe el nombre de la categoría.");
  });

  it("un nombre sin letras ni números no da dirección web y se rechaza", () => {
    const r = esquemaCategoria.safeParse(leerCategoria(fd({ nombre: "¿¿??" })));
    expect(!r.success && r.error.issues[0]?.message).toBe(
      "El nombre necesita al menos una letra o un número.",
    );
  });
});
```

- [ ] `pnpm test -- src/lib/validaciones/categoria.test.ts` → FAIL.
- [ ] Escribir `src/lib/validaciones/categoria.ts`:

```ts
import * as z from "zod";

import { casilla, texto, textoOpcional } from "@/lib/panel/formulario";
import { generarSlug } from "@/lib/utilidades/slug";

export const esquemaCategoria = z.object({
  id: z.uuid().nullable(),
  nombre: z
    .string()
    .min(1, { error: "Escribe el nombre de la categoría." })
    .max(60, { error: "Máximo 60 letras." })
    .refine((n) => generarSlug(n).length > 0, {
      error: "El nombre necesita al menos una letra o un número.",
    }),
  descripcion: z.string().max(300, { error: "Máximo 300 letras." }).nullable(),
  imagen_url: z.string().nullable(),
  publicado: z.boolean(),
});

export type DatosCategoria = z.infer<typeof esquemaCategoria>;

export function leerCategoria(fd: FormData) {
  return {
    id: textoOpcional(fd, "id"),
    nombre: texto(fd, "nombre"),
    descripcion: textoOpcional(fd, "descripcion"),
    imagen_url: textoOpcional(fd, "imagen_url"),
    publicado: casilla(fd, "publicado"),
  };
}

/** Para la validación en el navegador: los errores por campo, o vacío. */
export function validarCategoria(fd: FormData) {
  const r = esquemaCategoria.safeParse(leerCategoria(fd));
  return r.success
    ? {}
    : (z.flattenError(r.error).fieldErrors as Record<string, string[] | undefined>);
}
```

- [ ] `pnpm test -- src/lib/validaciones/categoria.test.ts` → PASS.

### Paso 7 — Categorías: acciones y pantallas

- [ ] Escribir `src/lib/acciones/categorias.ts`:

```ts
"use server";

import * as z from "zod";

import { ETIQUETAS } from "@/lib/datos/etiquetas";
import { ejecutarAccion, type EstadoAccion } from "@/lib/panel/accion";
import { generarSlug } from "@/lib/utilidades/slug";
import { esquemaCategoria, leerCategoria } from "@/lib/validaciones/categoria";

const RUTA = "/admin/contenido/categorias";

export async function guardarCategoria(fd: FormData): Promise<EstadoAccion> {
  return ejecutarAccion({
    ruta: RUTA,
    esquema: esquemaCategoria,
    entrada: leerCategoria(fd),
    entidad: "una categoría",
    etiquetas: [ETIQUETAS.catalogo],
    mensajeOk: (d) =>
      d.publicado
        ? "Guardado. Ya se ve en el sitio."
        : "Guardado como borrador. Aún no se ve en el sitio.",
    hacer: async (d, { supabase }) => {
      const fila = {
        nombre: d.nombre,
        descripcion: d.descripcion,
        imagen_url: d.imagen_url,
        estado: d.publicado ? ("publicado" as const) : ("borrador" as const),
      };
      if (d.id) {
        // `.select().single()`: si la RLS esconde la fila, el update no falla,
        // no toca nada. Pedirla de vuelta convierte ese silencio en PGRST116.
        const { error } = await supabase
          .from("categorias_producto")
          .update(fila)
          .eq("id", d.id)
          .is("deleted_at", null)
          .select("id")
          .single();
        return { error, id: d.id };
      }
      // El slug nace con el nombre y no cambia al renombrar: es la dirección
      // de la categoría, y cambiarla rompería los enlaces ya compartidos.
      const { data, error } = await supabase
        .from("categorias_producto")
        .insert({ ...fila, slug: generarSlug(d.nombre) })
        .select("id")
        .single();
      return { error, id: data?.id };
    },
  });
}

export async function borrarCategoria(id: string): Promise<EstadoAccion> {
  return ejecutarAccion({
    ruta: RUTA,
    esquema: z.object({ id: z.uuid() }),
    entrada: { id },
    entidad: "la categoría",
    etiquetas: [ETIQUETAS.catalogo],
    mensajeOk: "Categoría borrada.",
    hacer: async ({ id }, { supabase }) => {
      const { count, error: errorCuenta } = await supabase
        .from("productos")
        .select("id", { count: "exact", head: true })
        .eq("categoria_id", id)
        .is("deleted_at", null);
      if (errorCuenta) return { error: errorCuenta };
      if (count && count > 0) {
        return {
          error: {
            code: "P0001",
            message: `Tiene ${count} ${count === 1 ? "producto" : "productos"}. Pásalos a otra categoría antes de borrarla.`,
          },
        };
      }
      const { error } = await supabase
        .from("categorias_producto")
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", id)
        .select("id")
        .single();
      return { error };
    },
  });
}
```

> La comprobación de productos vivos va en la acción y no en la base: la FK con `on delete restrict`
> ya impide el borrado **físico**, y el lógico no deja huérfano a nadie en la base (el producto sigue
> apuntando a una fila que existe). Lo que se evita aquí es que el catálogo público enseñe productos
> de una categoría que desapareció del filtro.

- [ ] Escribir `src/app/(admin)/admin/contenido/categorias/formulario-categoria.tsx`:

```tsx
"use client";

import { Campo, Interruptor } from "@/components/panel/campo";
import { BarraGuardar } from "@/components/panel/barra-guardar";
import { FormularioPanel } from "@/components/panel/formulario-panel";
import { PestanasFormulario } from "@/components/panel/pestanas-formulario";
import { SubidaImagen } from "@/components/panel/subida-imagen";
import { guardarCategoria } from "@/lib/acciones/categorias";
import { claveDeBorrador } from "@/lib/panel/borrador";
import { validarCategoria } from "@/lib/validaciones/categoria";

export type CategoriaEditable = {
  id: string;
  nombre: string;
  descripcion: string | null;
  imagen_url: string | null;
  estado: string;
};

const VOLVER = "/admin/contenido/categorias";

export function FormularioCategoria({ categoria }: { categoria: CategoriaEditable | null }) {
  return (
    <FormularioPanel
      clave={claveDeBorrador("categoria", categoria?.id ?? null)}
      accion={guardarCategoria}
      validar={validarCategoria}
      destino={() => VOLVER}
    >
      <input type="hidden" name="id" value={categoria?.id ?? ""} />
      <PestanasFormulario
        pestanas={[
          {
            valor: "datos",
            titulo: "Datos",
            campos: ["nombre", "descripcion"],
            contenido: (
              <>
                <Campo nombre="nombre" etiqueta="Nombre">
                  {(p) => (
                    <input {...p} defaultValue={categoria?.nombre ?? ""} autoComplete="off" />
                  )}
                </Campo>
                <Campo nombre="descripcion" etiqueta="Descripción" opcional>
                  {(p) => <textarea {...p} rows={3} defaultValue={categoria?.descripcion ?? ""} />}
                </Campo>
                <Interruptor
                  nombre="publicado"
                  etiqueta="Publicada"
                  ayuda="Se ve en el filtro del catálogo"
                  marcado={categoria ? categoria.estado === "publicado" : true}
                />
              </>
            ),
          },
          {
            valor: "foto",
            titulo: "Foto",
            campos: ["imagen_url"],
            contenido: (
              <SubidaImagen
                nombre="imagen_url"
                bucket="productos"
                carpeta="categorias"
                rutaInicial={categoria?.imagen_url ?? null}
                etiqueta="Foto de la categoría"
              />
            ),
          },
        ]}
      />
      <BarraGuardar volver={VOLVER} />
    </FormularioPanel>
  );
}
```

> La foto de una categoría no depende de un id (no hay tabla de imágenes con FK), así que se puede
> subir también al crear. La regla «primero guarda» es solo de los productos (T3).

- [ ] Escribir `src/app/(admin)/admin/contenido/categorias/page.tsx`:

```tsx
import { Plus } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";

import { ConfirmarBorrado } from "@/components/panel/confirmar-borrado";
import { EncabezadoPanel } from "@/components/panel/encabezado-panel";
import { EtiquetaEstado } from "@/components/panel/etiqueta-estado";
import { ListaAdaptable } from "@/components/panel/lista-adaptable";
import { borrarCategoria } from "@/lib/acciones/categorias";
import { exigirAcceso } from "@/lib/auth/sesion";
import { crearClienteServidor } from "@/lib/supabase/servidor";

const RUTA = "/admin/contenido/categorias";

export default function Categorias() {
  return (
    <>
      <EncabezadoPanel
        titulo="Categorías"
        volver={{ ruta: "/admin/contenido", nombre: "Contenido" }}
        accion={
          <Link href={`${RUTA}/nueva`} className="boton-cta">
            <Plus aria-hidden className="size-5" /> Nueva categoría
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
    .from("categorias_producto")
    .select("id, nombre, estado, orden")
    .is("deleted_at", null)
    .order("orden");

  if (error) {
    return <p role="alert">No se pudieron cargar las categorías. Recarga la página.</p>;
  }

  return (
    <ListaAdaptable
      etiqueta="Categorías del catálogo"
      filas={data}
      enlace={(c) => `${RUTA}/${c.id}`}
      columnas={[
        { titulo: "Nombre", celda: (c) => c.nombre, principal: true },
        { titulo: "Estado", celda: (c) => <EtiquetaEstado estado={c.estado} /> },
      ]}
      acciones={(c) => (
        <ConfirmarBorrado
          nombre={`la categoría ${c.nombre}`}
          accion={borrarCategoria.bind(null, c.id)}
        />
      )}
      vacio={<p>Todavía no hay categorías. Crea la primera con «Nueva categoría».</p>}
    />
  );
}
```

> `borrarCategoria.bind(null, c.id)` es la forma documentada de pasar un argumento a una Server
> Action desde un Server Component a un componente de cliente.

- [ ] Escribir `src/app/(admin)/admin/contenido/categorias/nueva/page.tsx`:

```tsx
import { EncabezadoPanel } from "@/components/panel/encabezado-panel";

import { FormularioCategoria } from "../formulario-categoria";

export default function NuevaCategoria() {
  return (
    <>
      <EncabezadoPanel
        titulo="Nueva categoría"
        volver={{ ruta: "/admin/contenido/categorias", nombre: "Categorías" }}
      />
      <FormularioCategoria categoria={null} />
    </>
  );
}
```

- [ ] Escribir `src/app/(admin)/admin/contenido/categorias/[id]/page.tsx`:

```tsx
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { EncabezadoPanel } from "@/components/panel/encabezado-panel";
import { exigirAcceso } from "@/lib/auth/sesion";
import { crearClienteServidor } from "@/lib/supabase/servidor";

import { FormularioCategoria } from "../formulario-categoria";

const RUTA = "/admin/contenido/categorias";

export default function EditarCategoria({ params }: PageProps<"/admin/contenido/categorias/[id]">) {
  return (
    <Suspense fallback={<p className="text-muted-foreground text-sm">Cargando…</p>}>
      <Editor params={params} />
    </Suspense>
  );
}

async function Editor({
  params,
}: {
  params: PageProps<"/admin/contenido/categorias/[id]">["params"];
}) {
  const { id } = await params;
  await exigirAcceso(RUTA);
  const supabase = await crearClienteServidor();
  const { data } = await supabase
    .from("categorias_producto")
    .select("id, nombre, descripcion, imagen_url, estado")
    .eq("id", id)
    .is("deleted_at", null)
    .maybeSingle();

  if (!data) notFound();

  return (
    <>
      <EncabezadoPanel titulo={data.nombre} volver={{ ruta: RUTA, nombre: "Categorías" }} />
      <FormularioCategoria categoria={data} />
    </>
  );
}
```

> Un `id` que no es uuid hace fallar la consulta con `22P02` y `data` queda en `null`: sale el 404,
> que es lo correcto.

- [ ] Añadir la ruta a `CONSTRUIDAS` en `src/app/(admin)/admin/contenido/page.tsx`:
      `const CONSTRUIDAS: readonly string[] = ["/admin/contenido/categorias"];`
- [ ] Añadir a `RUTAS_DEL_PANEL` en `e2e/panel-accesibilidad.spec.ts`:
      `"/admin/contenido/categorias", "/admin/contenido/categorias/nueva"`.
- [ ] `pnpm build` → sin errores de prerender.
- [ ] Commit: `feat(catalogo): categorías desde el panel`

### Paso 8 — La foto de prueba y el flujo en el navegador

La foto se **dibuja en el propio navegador** de la prueba con un `<canvas>`: es nuestra, no pesa en
el repositorio y no hay binario que mantener. Cumple lo que se decidió (decisión 4): nada del
cliente, y el flujo real de comprimir y subir.

- [ ] Escribir `e2e/ayudas/foto.ts`:

```ts
import type { Page } from "@playwright/test";

/** Una foto de 1200 × 800 dibujada en el navegador. Más ancha que 1600 no hace falta. */
export async function fotoDePrueba(page: Page) {
  const base64 = await page.evaluate(() => {
    const lienzo = document.createElement("canvas");
    lienzo.width = 1200;
    lienzo.height = 800;
    const ctx = lienzo.getContext("2d");
    if (!ctx) throw new Error("sin canvas");
    ctx.fillStyle = "#12306E";
    ctx.fillRect(0, 0, 1200, 800);
    ctx.fillStyle = "#FDBD73";
    ctx.fillRect(120, 120, 480, 320);
    return lienzo.toDataURL("image/png").split(",")[1] ?? "";
  });
  return {
    name: "foto-de-prueba.png",
    mimeType: "image/png",
    buffer: Buffer.from(base64, "base64"),
  };
}
```

- [ ] Escribir `e2e/ayudas/base.ts`:

```ts
import { supabaseLocal } from "./supabase-local";

/** Borrado físico de lo que creó una prueba, con la service_role local. */
export async function borrarDeLaBase(tabla: string, columna: string, valor: string): Promise<void> {
  const { apiUrl, serviceRoleKey } = supabaseLocal();
  const respuesta = await fetch(
    `${apiUrl}/rest/v1/${tabla}?${columna}=eq.${encodeURIComponent(valor)}`,
    {
      method: "DELETE",
      headers: { apikey: serviceRoleKey, Authorization: `Bearer ${serviceRoleKey}` },
    },
  );
  if (!respuesta.ok) {
    throw new Error(`No se pudo limpiar ${tabla}: ${respuesta.status} ${await respuesta.text()}`);
  }
}
```

- [ ] Escribir `e2e/panel-categorias.spec.ts`:

```ts
import { expect, test } from "@playwright/test";

import { borrarDeLaBase } from "./ayudas/base";
import { fotoDePrueba } from "./ayudas/foto";
import { entrarComo } from "./ayudas/sesion";
import { borrarUsuario } from "./ayudas/usuarios";

const nombreUnico = () => `Categoría E2E ${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

test("crear una categoría con foto: se comprime, se sube y el bucket la sirve", async ({
  page,
  request,
}) => {
  const usuario = await entrarComo(page, "administrador");
  const nombre = nombreUnico();
  try {
    await page.goto("/admin/contenido/categorias/nueva");
    await page.getByLabel("Nombre").fill(nombre);

    await page.getByRole("tab", { name: "Foto" }).click();
    await page.getByLabel("Elegir de la galería").setInputFiles(await fotoDePrueba(page));
    // Se espera a la vista previa y no a `data-fase`: la fase empieza en «quieta»
    // y la comprobación pasaría antes de subir nada.
    await expect(page.locator("[data-vista-previa]")).toHaveAttribute(
      "src",
      /\/storage\/v1\/object\/public\/productos\/categorias\/.+\.webp$/,
    );
    const src = await page.locator("[data-vista-previa]").getAttribute("src");

    // Lo que se comprueba es el archivo del bucket, no el <img>.
    const archivo = await request.get(src ?? "");
    expect(archivo.status()).toBe(200);
    expect(archivo.headers()["content-type"]).toBe("image/webp");

    await page.getByRole("button", { name: "Guardar" }).click();
    await expect(page).toHaveURL("/admin/contenido/categorias");
    await expect(page.getByText("Guardado. Ya se ve en el sitio.")).toBeVisible();
    await expect(page.getByRole("link", { name: nombre }).first()).toBeVisible();
  } finally {
    await borrarDeLaBase("categorias_producto", "nombre", nombre);
    await borrarUsuario(usuario.id);
  }
});

test("lo escrito sobrevive a una recarga y se puede recuperar", async ({ page }) => {
  const usuario = await entrarComo(page, "ingeniero");
  try {
    await page.goto("/admin/contenido/categorias/nueva");
    await page.getByLabel("Nombre").fill("Panes de prueba sin guardar");
    await page.waitForTimeout(1000); // la copia se guarda a los 800 ms de dejar de escribir
    await page.reload();

    await expect(page.locator("[data-borrador]")).toContainText("Tienes cambios sin guardar");
    await expect(page.getByLabel("Nombre")).toHaveValue("");
    await page.getByRole("button", { name: "Recuperarlos" }).click();
    await expect(page.getByLabel("Nombre")).toHaveValue("Panes de prueba sin guardar");

    await page.getByRole("link", { name: "Cancelar" }).click();
    await page.goto("/admin/contenido/categorias/nueva");
    await page.getByRole("button", { name: "Descartar" }).click();
    await page.reload();
    await expect(page.locator("[data-borrador]")).toHaveCount(0);
  } finally {
    await borrarUsuario(usuario.id);
  }
});

test("un error en una pestaña que no se ve la marca y salta a ella", async ({ page }) => {
  const usuario = await entrarComo(page, "administrador");
  try {
    await page.goto("/admin/contenido/categorias/nueva");
    await page.getByRole("tab", { name: "Foto" }).click();
    await page.getByRole("button", { name: "Guardar" }).click();

    const datos = page.getByRole("tab", { name: /Datos/ });
    await expect(datos).toHaveAttribute("data-con-error", "true");
    await expect(datos).toHaveAttribute("data-state", "active");
    await expect(page.getByText("Escribe el nombre de la categoría.")).toBeVisible();
  } finally {
    await borrarUsuario(usuario.id);
  }
});

test("borrar pide confirmación nombrando la categoría", async ({ page }) => {
  const usuario = await entrarComo(page, "administrador");
  const nombre = nombreUnico();
  try {
    await page.goto("/admin/contenido/categorias/nueva");
    await page.getByLabel("Nombre").fill(nombre);
    await page.getByRole("button", { name: "Guardar" }).click();
    await expect(page).toHaveURL("/admin/contenido/categorias");

    await page
      .getByRole("button", { name: `Borrar la categoría ${nombre}` })
      .first()
      .click();
    await expect(page.getByRole("alertdialog")).toContainText(`¿Borrar la categoría ${nombre}?`);
    await page.getByRole("button", { name: "Sí, borrar" }).click();
    await expect(page.getByText("Categoría borrada.")).toBeVisible();
    await page.reload();
    await expect(page.getByRole("link", { name: nombre })).toHaveCount(0);
  } finally {
    await borrarDeLaBase("categorias_producto", "nombre", nombre);
    await borrarUsuario(usuario.id);
  }
});
```

> `data-con-error={conError || undefined}` en React pinta `data-con-error="true"`. Si Radix no
> refleja `data-state="active"` en el trigger, comprobar `aria-selected="true"`.
>
> La prueba de subida corre en el CI con Storage local: no depende de las 62 fotos semilla. Es la
> que cierra el hueco declarado en F3 para las fotos que sube el panel.

- [ ] Liberar el puerto 3000 y correr `pnpm test:e2e e2e/panel-categorias.spec.ts e2e/panel-accesibilidad.spec.ts`
      → PASS en los dos proyectos.
- [ ] Comprobar a mano, con la vista previa de Vercel, desde un celular de verdad: «Tomar foto» abre
      la cámara y la foto se sube en unos segundos por datos móviles.
- [ ] Commit: `test(catalogo): subida de foto, copia local y errores en pestañas`
- [ ] PR `feat/f4-t2-categorias` → CI en verde → fusionar.

---

## Tarea 3 — Productos, presentaciones y fotos

**Rama:** `feat/f4-t3-productos`

**Qué deja hecho:** los 34 productos se editan desde el panel en tres pestañas (Datos · Precios ·
Fotos). El producto y sus presentaciones se guardan **juntos o no se guardan**. Cada cambio de
precio queda en el historial. Las tres fotos que quedaron sueltas en el bucket se pueden asignar.
Y la prueba que importa: **publicar un producto y verlo en el sitio sin redesplegar**.

**Archivos:**

- Crear: `supabase/migrations/0027_guardar_producto.sql`, `supabase/tests/0027_guardar_producto.test.sql`
- Modificar: `src/tipos/database.types.ts` (regenerado)
- Crear: `src/lib/validaciones/producto.ts` + `.test.ts`, `src/lib/acciones/productos.ts`
- Crear: `src/components/panel/editor-presentaciones.tsx`, `src/components/panel/fotos-producto.tsx`
- Crear: `src/app/(admin)/admin/contenido/productos/{page,formulario-producto}.tsx`,
  `.../productos/nuevo/page.tsx`, `.../productos/[id]/page.tsx`
- Modificar: `CONSTRUIDAS`, `RUTAS_DEL_PANEL`
- Crear: `e2e/panel-productos.spec.ts`

**Interfaces:**

- Consume (T1, T2): `ejecutarAccion`, `EstadoAccion`, `texto`, `textoOpcional`, `casilla`, `json`,
  `FormularioPanel`, `useFormularioPanel`, `PestanasFormulario`, `Campo`, `CLASE_CONTROL`,
  `Interruptor`, `BarraGuardar`, `SubidaImagen`, `ConfirmarBorrado`, `ListaAdaptable`,
  `EtiquetaEstado`, `EncabezadoPanel`, `claveDeBorrador`, `entrarComo`, `borrarDeLaBase`,
  `fotoDePrueba`. De antes: `generarSlug`, `formatearPrecio` (`src/lib/datos/catalogo.ts`),
  `urlDeImagen`.
- Produce:
  - `public.guardar_producto(p_producto jsonb, p_presentaciones jsonb) returns uuid`
  - `normalizarPrecio(texto: string): string` en `src/lib/validaciones/producto.ts`
  - `UNIDADES_DE_VENTA` y `NOMBRE_DE_UNIDAD` en el mismo archivo

### Paso 1 — Guardar producto y presentaciones en una sola llamada

supabase-js no abre transacciones. Si la acción guardara el producto y después sus presentaciones
en llamadas separadas, un corte de señal entre las dos dejaría un producto publicado sin precio. Una
función de Postgres es una transacción por sí sola: o entra todo o no entra nada.

- [ ] Escribir `supabase/tests/0027_guardar_producto.test.sql`:

```sql
-- Verifica guardar_producto (0027).
--
-- Lo que se defiende: que un producto y sus presentaciones entren juntos o no
-- entren; que quitar una presentación la retire sin borrar su historial de
-- precios; que siempre haya exactamente una predeterminada; y que la función
-- no abra una puerta que la RLS tenía cerrada.
begin;
select plan(12);

insert into auth.users (id, email, created_at, updated_at) values
  ('33333333-3333-3333-3333-333333333333', 'inge@pimpos.test',    now(), now()),
  ('44444444-4444-4444-4444-444444444444', 'reparto@pimpos.test', now(), now());
update public.perfiles set rol = 'ingeniero',  activo = true where id = '33333333-3333-3333-3333-333333333333';
update public.perfiles set rol = 'repartidor', activo = true where id = '44444444-4444-4444-4444-444444444444';

select has_function('public', 'guardar_producto', array['jsonb', 'jsonb'], 'existe guardar_producto');

create temp table t (clave text primary key, valor uuid);
grant all on t to authenticated, anon;
insert into t select 'categoria', id from public.categorias_producto where deleted_at is null limit 1;

set local role authenticated;
set local request.jwt.claims = '{"sub": "33333333-3333-3333-3333-333333333333", "rol": "ingeniero"}';

insert into t select 'producto', public.guardar_producto(
  jsonb_build_object('categoria_id', (select valor from t where clave = 'categoria'),
                     'nombre', 'Pan de prueba 0027', 'slug', 'pan-de-prueba-0027',
                     'descripcion', '', 'destacado', false, 'estado', 'publicado'),
  '[{"nombre": "Unidad", "precio": "0.30", "unidad_venta": "unidad"},
    {"nombre": "Docena", "precio": "3.00", "unidad_venta": "docena"}]'::jsonb
);

select is(
  (select count(*)::int from public.producto_variantes
    where producto_id = (select valor from t where clave = 'producto') and deleted_at is null),
  2, 'crea el producto con sus dos presentaciones'
);
select is(
  (select nombre from public.producto_variantes
    where producto_id = (select valor from t where clave = 'producto') and es_predeterminada),
  'Unidad', 'la primera de la lista es la predeterminada'
);
select is(
  (select precio from public.producto_variantes
    where producto_id = (select valor from t where clave = 'producto') and nombre = 'Unidad'),
  0.30::numeric(12,4), 'el precio llega exacto, sin pasar por coma flotante'
);

insert into t select 'unidad', id from public.producto_variantes
 where producto_id = (select valor from t where clave = 'producto') and nombre = 'Unidad';

-- Editar: sube el precio de Unidad, quita Docena, añade Bolsa y la pone primera.
-- Dentro de lives_ok: un `select` suelto imprimiría una fila que no es TAP.
select lives_ok($$
  select public.guardar_producto(
    jsonb_build_object('id', (select valor from t where clave = 'producto'),
                       'categoria_id', (select valor from t where clave = 'categoria'),
                       'nombre', 'Pan de prueba 0027', 'descripcion', 'Editado',
                       'destacado', true, 'estado', 'publicado'),
    jsonb_build_array(
      jsonb_build_object('nombre', 'Bolsa', 'precio', '2.50', 'unidad_venta', 'bolsa'),
      jsonb_build_object('id', (select valor from t where clave = 'unidad'),
                         'nombre', 'Unidad', 'precio', '0.40', 'unidad_venta', 'unidad')
    )
  )
$$, 'editar un producto con sus presentaciones funciona');

select is(
  (select array_agg(nombre order by orden) from public.producto_variantes
    where producto_id = (select valor from t where clave = 'producto') and deleted_at is null),
  array['Bolsa', 'Unidad'], 'quedan las dos de la lista, en su orden'
);
select ok(
  (select deleted_at is not null and not activo from public.producto_variantes
    where producto_id = (select valor from t where clave = 'producto') and nombre = 'Docena'),
  'la que no vino en la lista se retira con borrado lógico, no se borra'
);
select is(
  (select count(*)::int from public.producto_variantes
    where producto_id = (select valor from t where clave = 'producto')
      and es_predeterminada and deleted_at is null),
  1, 'sigue habiendo una sola predeterminada'
);
select is(
  (select array_agg(precio order by id) from public.precio_historial
    where variante_id = (select valor from t where clave = 'unidad')),
  array[0.30, 0.40]::numeric(12,4)[], 'el cambio de precio queda en el historial'
);
select is(
  (select slug from public.productos where id = (select valor from t where clave = 'producto')),
  'pan-de-prueba-0027', 'editar no cambia la dirección del producto'
);

select throws_ok(
  $$ select public.guardar_producto(
       jsonb_build_object('categoria_id', (select valor from t where clave = 'categoria'),
                          'nombre', 'Sin precio', 'slug', 'sin-precio-0027', 'estado', 'borrador'),
       '[]'::jsonb) $$,
  'P0001', 'Un producto necesita al menos una presentación con su precio.',
  'sin presentaciones no se guarda nada'
);

set local request.jwt.claims = '{"sub": "44444444-4444-4444-4444-444444444444", "rol": "repartidor"}';
select throws_ok(
  $$ select public.guardar_producto(
       jsonb_build_object('categoria_id', (select valor from t where clave = 'categoria'),
                          'nombre', 'Del repartidor', 'slug', 'del-repartidor-0027', 'estado', 'borrador'),
       '[{"nombre": "Unidad", "precio": "1.00", "unidad_venta": "unidad"}]'::jsonb) $$,
  '42501', null,
  'la función no salta la RLS: el repartidor no crea productos'
);

select * from finish();
rollback;
```

- [ ] `supabase test db` → FAIL (la función no existe).
- [ ] Escribir `supabase/migrations/0027_guardar_producto.sql`:

```sql
-- =============================================================================
-- 0027_guardar_producto.sql
-- Un producto y sus presentaciones se guardan juntos (F4, tarea 3).
--
-- supabase-js no abre transacciones, y guardar el producto y después sus
-- presentaciones en dos llamadas deja una ventana en la que un corte de señal
-- publica un producto sin precio. Una función es una transacción entera.
--
-- `security invoker`: corre con los permisos de quien llama, así que la RLS de
-- productos y variantes decide igual que si el panel escribiera fila a fila.
-- No abre ninguna puerta nueva; la prueba 0027 lo comprueba con el repartidor.
--
-- Contrato:
--   p_producto: { id?, categoria_id, nombre, slug (solo al crear), descripcion,
--                 destacado, estado }
--   p_presentaciones: [{ id?, nombre, precio (texto "0.40"), unidad_venta }]
--     El orden de la lista es el orden en el sitio, y la primera es la
--     predeterminada. Las presentaciones del producto que no vengan en la
--     lista se retiran con borrado lógico: su historial de precios se queda.
-- =============================================================================

create or replace function public.guardar_producto(p_producto jsonb, p_presentaciones jsonb)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_id        uuid := nullif(p_producto ->> 'id', '')::uuid;
  v_conservar uuid[] := '{}';
  v_item      jsonb;
  v_item_id   uuid;
  v_orden     smallint := 0;
begin
  if jsonb_typeof(p_presentaciones) is distinct from 'array'
     or jsonb_array_length(p_presentaciones) = 0 then
    raise exception 'Un producto necesita al menos una presentación con su precio.';
  end if;

  if v_id is null then
    insert into public.productos (categoria_id, nombre, slug, descripcion, destacado, estado)
    values (
      (p_producto ->> 'categoria_id')::uuid,
      p_producto ->> 'nombre',
      p_producto ->> 'slug',
      nullif(btrim(p_producto ->> 'descripcion'), ''),
      coalesce((p_producto ->> 'destacado')::boolean, false),
      (p_producto ->> 'estado')::app.estado_publicacion
    )
    returning id into v_id;
  else
    update public.productos
       set categoria_id = (p_producto ->> 'categoria_id')::uuid,
           nombre       = p_producto ->> 'nombre',
           descripcion  = nullif(btrim(p_producto ->> 'descripcion'), ''),
           destacado    = coalesce((p_producto ->> 'destacado')::boolean, false),
           estado       = (p_producto ->> 'estado')::app.estado_publicacion
     where id = v_id
       and deleted_at is null;
    if not found then
      raise exception 'No se encontró el producto. Puede que otra persona lo haya borrado.';
    end if;
  end if;

  -- Se quita la marca a todas antes de repartirla: el índice único parcial
  -- chocaría si por un instante hubiera dos predeterminadas.
  update public.producto_variantes
     set es_predeterminada = false
   where producto_id = v_id and deleted_at is null and es_predeterminada;

  for v_item in select value from jsonb_array_elements(p_presentaciones)
  loop
    v_item_id := nullif(v_item ->> 'id', '')::uuid;

    if v_item_id is null then
      insert into public.producto_variantes
        (producto_id, nombre, precio, unidad_venta, es_predeterminada, orden)
      values (
        v_id,
        v_item ->> 'nombre',
        (v_item ->> 'precio')::numeric(12,4),
        coalesce(v_item ->> 'unidad_venta', 'unidad'),
        v_orden = 0,
        v_orden
      )
      returning id into v_item_id;
    else
      update public.producto_variantes
         set nombre            = v_item ->> 'nombre',
             precio            = (v_item ->> 'precio')::numeric(12,4),
             unidad_venta      = coalesce(v_item ->> 'unidad_venta', 'unidad'),
             es_predeterminada = v_orden = 0,
             orden             = v_orden,
             activo            = true
       where id = v_item_id
         and producto_id = v_id
         and deleted_at is null;
      if not found then
        raise exception 'Una de las presentaciones ya no existe. Recarga la página y vuelve a intentarlo.';
      end if;
    end if;

    v_conservar := v_conservar || v_item_id;
    v_orden := v_orden + 1;
  end loop;

  update public.producto_variantes
     set deleted_at = now(), activo = false
   where producto_id = v_id
     and deleted_at is null
     and not (id = any (v_conservar));

  return v_id;
end;
$$;

comment on function public.guardar_producto(jsonb, jsonb) is
  'Guarda un producto y sus presentaciones en una sola transacción. Security invoker: decide la RLS.';

revoke execute on function public.guardar_producto(jsonb, jsonb) from public, anon;
grant execute on function public.guardar_producto(jsonb, jsonb) to authenticated;
```

> Si el `insert` del repartidor llega con otro código que `42501` (p. ej. porque la RLS de
> `productos` no tiene política de insert para él y PostgREST no interviene aquí), mirar el código
> real con `select public.guardar_producto(...)` en `psql` y ajustar **la prueba**, no la función:
> lo que se defiende es que falle.

- [ ] `supabase db reset && bash supabase/seeds/imagenes/subir-imagenes.sh && supabase test db` → PASS.
- [ ] `pnpm supabase:tipos` → `database.types.ts` gana `Functions.guardar_producto`.
- [ ] Commit: `feat(base): guardar un producto con sus presentaciones en una sola transacción`

### Paso 2 — Esquema del producto

- [ ] Escribir `src/lib/validaciones/producto.test.ts`:

```ts
import { describe, expect, it } from "vitest";

import { esquemaProducto, leerProducto, normalizarPrecio } from "./producto";

const CATEGORIA = "5b1f7c1e-3c4d-4e5f-8a9b-0c1d2e3f4a5b";

function fd(pares: Record<string, string>) {
  const datos = new FormData();
  for (const [k, v] of Object.entries(pares)) datos.set(k, v);
  return datos;
}

const presentaciones = (lista: unknown[]) => JSON.stringify(lista);

describe("normalizarPrecio", () => {
  it("acepta coma, punto, el símbolo y espacios", () => {
    expect(normalizarPrecio("0,4")).toBe("0.4");
    expect(normalizarPrecio(" S/ 1.50 ")).toBe("1.50");
    expect(normalizarPrecio("s/.2")).toBe("2");
  });
});

describe("esquemaProducto", () => {
  it("un producto con una presentación es válido y el precio queda como texto exacto", () => {
    const r = esquemaProducto.safeParse(
      leerProducto(
        fd({
          nombre: "Pan francés",
          categoria_id: CATEGORIA,
          publicado: "on",
          presentaciones: presentaciones([
            { id: null, nombre: "Unidad", precio: "0,10", unidad_venta: "unidad" },
          ]),
        }),
      ),
    );
    expect(r.success).toBe(true);
    expect(r.success && r.data.presentaciones[0]?.precio).toBe("0.10");
  });

  it("sin presentaciones pide añadir una", () => {
    const r = esquemaProducto.safeParse(
      leerProducto(fd({ nombre: "Pan", categoria_id: CATEGORIA, presentaciones: "[]" })),
    );
    expect(!r.success && r.error.issues.map((i) => i.message)).toContain(
      "Añade al menos una presentación con su precio.",
    );
  });

  it("un precio con letras dice cómo escribirlo", () => {
    const r = esquemaProducto.safeParse(
      leerProducto(
        fd({
          nombre: "Pan",
          categoria_id: CATEGORIA,
          presentaciones: presentaciones([
            { id: null, nombre: "Unidad", precio: "diez", unidad_venta: "unidad" },
          ]),
        }),
      ),
    );
    expect(!r.success && r.error.issues.map((i) => i.message)).toContain(
      "Escribe el precio con números, por ejemplo 0.40.",
    );
  });

  it("sin categoría pide elegirla", () => {
    const r = esquemaProducto.safeParse(
      leerProducto(
        fd({
          nombre: "Pan",
          categoria_id: "",
          presentaciones: presentaciones([
            { id: null, nombre: "Unidad", precio: "1", unidad_venta: "unidad" },
          ]),
        }),
      ),
    );
    expect(!r.success && r.error.issues.map((i) => i.message)).toContain("Elige una categoría.");
  });

  it("una presentación repetida por nombre se rechaza", () => {
    const r = esquemaProducto.safeParse(
      leerProducto(
        fd({
          nombre: "Pan",
          categoria_id: CATEGORIA,
          presentaciones: presentaciones([
            { id: null, nombre: "Unidad", precio: "1", unidad_venta: "unidad" },
            { id: null, nombre: "unidad", precio: "2", unidad_venta: "unidad" },
          ]),
        }),
      ),
    );
    expect(!r.success && r.error.issues.map((i) => i.message)).toContain(
      "Hay dos presentaciones con el mismo nombre.",
    );
  });
});
```

- [ ] `pnpm test -- src/lib/validaciones/producto.test.ts` → FAIL.
- [ ] Escribir `src/lib/validaciones/producto.ts`:

```ts
import * as z from "zod";

import { casilla, json, texto, textoOpcional } from "@/lib/panel/formulario";
import { generarSlug } from "@/lib/utilidades/slug";

export const UNIDADES_DE_VENTA = [
  "unidad",
  "docena",
  "kilo",
  "bolsa",
  "paquete",
  "botella",
] as const;

export const NOMBRE_DE_UNIDAD: Record<(typeof UNIDADES_DE_VENTA)[number], string> = {
  unidad: "Unidad",
  docena: "Docena",
  kilo: "Kilo",
  bolsa: "Bolsa",
  paquete: "Paquete",
  botella: "Botella",
};

/**
 * Lo que escribe una persona en un celular: «0,40», «S/ 0.40», «s/.2».
 * Se queda como TEXTO: la base lo convierte a numeric(12,4) sin pasar nunca
 * por un número de coma flotante.
 */
export function normalizarPrecio(valor: string): string {
  return valor
    .trim()
    .replace(/^s\/\.?\s*/i, "")
    .replace(",", ".")
    .trim();
}

const esquemaPresentacion = z.object({
  id: z.uuid().nullable(),
  nombre: z
    .string()
    .trim()
    .min(1, { error: "Escribe el nombre de cada presentación, por ejemplo «Unidad»." })
    .max(60, { error: "Máximo 60 letras por presentación." }),
  precio: z
    .string()
    .transform(normalizarPrecio)
    .pipe(
      z.string().regex(/^\d{1,6}(\.\d{1,2})?$/, {
        error: "Escribe el precio con números, por ejemplo 0.40.",
      }),
    ),
  unidad_venta: z.enum(UNIDADES_DE_VENTA, { error: "Elige la unidad de venta." }),
});

export const esquemaProducto = z.object({
  id: z.uuid().nullable(),
  nombre: z
    .string()
    .min(1, { error: "Escribe el nombre del producto." })
    .max(80, { error: "Máximo 80 letras." })
    .refine((n) => generarSlug(n).length > 0, {
      error: "El nombre necesita al menos una letra o un número.",
    }),
  categoria_id: z.uuid({ error: "Elige una categoría." }),
  descripcion: z.string().max(500, { error: "Máximo 500 letras." }).nullable(),
  destacado: z.boolean(),
  publicado: z.boolean(),
  presentaciones: z
    .array(esquemaPresentacion)
    .min(1, { error: "Añade al menos una presentación con su precio." })
    .refine((lista) => new Set(lista.map((p) => p.nombre.toLowerCase())).size === lista.length, {
      error: "Hay dos presentaciones con el mismo nombre.",
    }),
});

export type DatosProducto = z.infer<typeof esquemaProducto>;

export function leerProducto(fd: FormData) {
  const presentaciones = json(fd, "presentaciones");
  return {
    id: textoOpcional(fd, "id"),
    nombre: texto(fd, "nombre"),
    categoria_id: texto(fd, "categoria_id"),
    descripcion: textoOpcional(fd, "descripcion"),
    destacado: casilla(fd, "destacado"),
    publicado: casilla(fd, "publicado"),
    presentaciones: Array.isArray(presentaciones) ? presentaciones : [],
  };
}

export function validarProducto(fd: FormData) {
  const r = esquemaProducto.safeParse(leerProducto(fd));
  return r.success
    ? {}
    : (z.flattenError(r.error).fieldErrors as Record<string, string[] | undefined>);
}
```

- [ ] `pnpm test -- src/lib/validaciones/producto.test.ts` → PASS.

### Paso 3 — Acciones de productos y fotos

- [ ] Escribir `src/lib/acciones/productos.ts`:

```ts
"use server";

import * as z from "zod";

import { ETIQUETAS } from "@/lib/datos/etiquetas";
import { ejecutarAccion, type EstadoAccion } from "@/lib/panel/accion";
import { generarSlug } from "@/lib/utilidades/slug";
import { esquemaProducto, leerProducto } from "@/lib/validaciones/producto";

const RUTA = "/admin/contenido/productos";
const ETIQUETAS_CATALOGO = [ETIQUETAS.catalogo] as const;

export async function guardarProducto(fd: FormData): Promise<EstadoAccion> {
  return ejecutarAccion({
    ruta: RUTA,
    esquema: esquemaProducto,
    entrada: leerProducto(fd),
    entidad: "un producto",
    etiquetas: ETIQUETAS_CATALOGO,
    mensajeOk: (d) =>
      d.publicado
        ? "Guardado. Ya se ve en el sitio."
        : "Guardado como borrador. Aún no se ve en el sitio.",
    hacer: async (d, { supabase }) => {
      const { data, error } = await supabase.rpc("guardar_producto", {
        p_producto: {
          id: d.id,
          categoria_id: d.categoria_id,
          nombre: d.nombre,
          slug: d.id ? undefined : generarSlug(d.nombre),
          descripcion: d.descripcion,
          destacado: d.destacado,
          estado: d.publicado ? "publicado" : "borrador",
        },
        p_presentaciones: d.presentaciones,
      });
      return { error, id: data ?? undefined };
    },
  });
}

export async function borrarProducto(id: string): Promise<EstadoAccion> {
  return ejecutarAccion({
    ruta: RUTA,
    esquema: z.object({ id: z.uuid() }),
    entrada: { id },
    entidad: "el producto",
    etiquetas: ETIQUETAS_CATALOGO,
    mensajeOk: "Producto borrado.",
    hacer: async ({ id }, { supabase }) => {
      const { error } = await supabase
        .from("productos")
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", id)
        .select("id")
        .single();
      return { error };
    },
  });
}

const esquemaFoto = z.object({
  producto_id: z.uuid(),
  ruta: z.string().min(1),
  alt: z.string().trim().min(1, { error: "Describe la foto en pocas palabras." }).max(120),
});

/** Añade una foto ya subida (o una suelta del bucket). La primera es la principal. */
export async function agregarFotoProducto(
  productoId: string,
  ruta: string,
  alt: string,
): Promise<EstadoAccion> {
  return ejecutarAccion({
    ruta: RUTA,
    esquema: esquemaFoto,
    entrada: { producto_id: productoId, ruta, alt },
    entidad: "la foto",
    etiquetas: ETIQUETAS_CATALOGO,
    mensajeOk: "Foto añadida.",
    hacer: async (d, { supabase }) => {
      const { count, error: errorCuenta } = await supabase
        .from("producto_imagenes")
        .select("id", { count: "exact", head: true })
        .eq("producto_id", d.producto_id);
      if (errorCuenta) return { error: errorCuenta };
      const { error } = await supabase.from("producto_imagenes").insert({
        producto_id: d.producto_id,
        ruta: d.ruta,
        alt: d.alt,
        orden: count ?? 0,
        es_principal: (count ?? 0) === 0,
      });
      return { error };
    },
  });
}

export async function marcarFotoPrincipal(
  productoId: string,
  fotoId: string,
): Promise<EstadoAccion> {
  return ejecutarAccion({
    ruta: RUTA,
    esquema: z.object({ producto_id: z.uuid(), foto_id: z.uuid() }),
    entrada: { producto_id: productoId, foto_id: fotoId },
    entidad: "la foto",
    etiquetas: ETIQUETAS_CATALOGO,
    mensajeOk: "Esa es ahora la foto principal.",
    hacer: async (d, { supabase }) => {
      // Primero se quita la marca: el índice único parcial no admite dos
      // principales ni por un instante.
      const quitar = await supabase
        .from("producto_imagenes")
        .update({ es_principal: false })
        .eq("producto_id", d.producto_id)
        .eq("es_principal", true);
      if (quitar.error) return { error: quitar.error };
      const { error } = await supabase
        .from("producto_imagenes")
        .update({ es_principal: true })
        .eq("id", d.foto_id)
        .select("id")
        .single();
      return { error };
    },
  });
}

export async function cambiarTextoFoto(fotoId: string, alt: string): Promise<EstadoAccion> {
  return ejecutarAccion({
    ruta: RUTA,
    esquema: z.object({ foto_id: z.uuid(), alt: esquemaFoto.shape.alt }),
    entrada: { foto_id: fotoId, alt },
    entidad: "la foto",
    etiquetas: ETIQUETAS_CATALOGO,
    mensajeOk: "Texto de la foto guardado.",
    hacer: async (d, { supabase }) => {
      const { error } = await supabase
        .from("producto_imagenes")
        .update({ alt: d.alt })
        .eq("id", d.foto_id)
        .select("id")
        .single();
      return { error };
    },
  });
}

export async function quitarFotoProducto(fotoId: string): Promise<EstadoAccion> {
  return ejecutarAccion({
    ruta: RUTA,
    esquema: z.object({ foto_id: z.uuid() }),
    entrada: { foto_id: fotoId },
    entidad: "la foto",
    etiquetas: ETIQUETAS_CATALOGO,
    mensajeOk: "Foto quitada.",
    hacer: async ({ foto_id }, { supabase }) => {
      const { data: foto, error } = await supabase
        .from("producto_imagenes")
        .delete()
        .eq("id", foto_id)
        .select("ruta")
        .single();
      if (error) return { error };

      // El archivo solo se borra si ninguna otra fila lo usa: una foto suelta
      // asignada a dos productos no desaparece de los dos por quitarla de uno.
      const { count } = await supabase
        .from("producto_imagenes")
        .select("id", { count: "exact", head: true })
        .eq("ruta", foto.ruta);
      if (!count && !foto.ruta.startsWith("/") && !foto.ruta.startsWith("http")) {
        await supabase.storage.from("productos").remove([foto.ruta]);
      }
      return { error: null };
    },
  });
}

/** Archivos de la raíz del bucket que no usa ningún producto: las fotos sueltas de la semilla. */
export async function listarFotosSueltas(): Promise<string[]> {
  const { crearClienteServidor } = await import("@/lib/supabase/servidor");
  const { exigirAcceso } = await import("@/lib/auth/sesion");
  await exigirAcceso(RUTA);
  const supabase = await crearClienteServidor();

  const [{ data: archivos }, { data: usadas }] = await Promise.all([
    supabase.storage.from("productos").list("", { limit: 500 }),
    supabase.from("producto_imagenes").select("ruta"),
  ]);
  const enUso = new Set((usadas ?? []).map((u) => u.ruta));
  return (
    (archivos ?? [])
      // Las carpetas vienen con id null.
      .filter((a) => a.id !== null && !enUso.has(a.name))
      .map((a) => a.name)
  );
}
```

> `producto_imagenes` no tiene `deleted_at`: una foto se quita de verdad (con su fila de auditoría),
> no con borrado lógico. Es la única excepción de F4 y viene del esquema de 0009.
>
> Los `import()` dinámicos de `listarFotosSueltas` se pueden subir al principio del archivo como
> imports normales; están así solo para dejar claro que esta función lee y no pasa por
> `ejecutarAccion`. Si lint prefiere los estáticos, usarlos.

- [ ] `pnpm typecheck` → sin errores. Si `supabase.rpc("guardar_producto", ...)` no tipa los
      argumentos jsonb, es que falta `pnpm supabase:tipos` del paso 1.

### Paso 4 — Las pestañas Precios y Fotos

- [ ] Escribir `src/components/panel/editor-presentaciones.tsx`:

```tsx
"use client";

import { ArrowDown, ArrowUp, Plus, Trash } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { NOMBRE_DE_UNIDAD, UNIDADES_DE_VENTA } from "@/lib/validaciones/producto";

import { CLASE_CONTROL } from "./campo";
import { useFormularioPanel } from "./formulario-panel";

export type Presentacion = {
  id: string | null;
  nombre: string;
  precio: string;
  unidad_venta: string;
};

type Fila = Presentacion & { clave: string };

const nuevaFila = (): Fila => ({
  clave: crypto.randomUUID(),
  id: null,
  nombre: "",
  precio: "",
  unidad_venta: "unidad",
});

/**
 * Las presentaciones viajan en un solo campo oculto con JSON: son una lista
 * que cambia de largo, y un formulario nativo no sabe mandar eso. La copia
 * local lo restaura por `registrarRestaurable`.
 */
export function EditorPresentaciones({ iniciales }: { iniciales: Presentacion[] }) {
  const { errores, registrarRestaurable } = useFormularioPanel();
  const oculto = useRef<HTMLInputElement>(null);
  const [filas, setFilas] = useState<Fila[]>(() =>
    iniciales.length > 0
      ? iniciales.map((p) => ({ ...p, clave: p.id ?? crypto.randomUUID() }))
      : [nuevaFila()],
  );

  useEffect(
    () =>
      registrarRestaurable("presentaciones", (valor) => {
        try {
          const lista = JSON.parse(valor) as Presentacion[];
          setFilas(lista.map((p) => ({ ...p, clave: p.id ?? crypto.randomUUID() })));
        } catch {
          // Una copia rota no pisa lo que hay.
        }
      }),
    [registrarRestaurable],
  );

  function cambiar(nuevas: Fila[]) {
    setFilas(nuevas);
    // Ver SubidaImagen: se avisa a la copia local cuando React ya pintó.
    setTimeout(() => oculto.current?.dispatchEvent(new Event("input", { bubbles: true })), 0);
  }

  const actualizar = (clave: string, campo: keyof Presentacion, valor: string) =>
    cambiar(filas.map((f) => (f.clave === clave ? { ...f, [campo]: valor } : f)));

  const mover = (indice: number, hacia: -1 | 1) => {
    const destino = indice + hacia;
    if (destino < 0 || destino >= filas.length) return;
    const copia = [...filas];
    [copia[indice], copia[destino]] = [copia[destino]!, copia[indice]!];
    cambiar(copia);
  };

  const valor = JSON.stringify(filas.map(({ clave: _clave, ...resto }) => resto));
  const mensajes = errores.presentaciones ?? [];

  return (
    <div className="flex flex-col gap-3">
      <input ref={oculto} type="hidden" name="presentaciones" value={valor} />
      <p className="text-muted-foreground text-sm">
        La primera es la que se muestra primero en el sitio. Cada cambio de precio queda en el
        historial con su fecha.
      </p>

      <ol className="flex flex-col gap-3">
        {filas.map((fila, i) => (
          <li
            key={fila.clave}
            className="bg-muted/40 flex flex-col gap-2 rounded-xl p-3"
            data-presentacion={i}
          >
            <div className="grid grid-cols-[1fr_7rem] gap-2">
              <label className="flex flex-col gap-1 text-sm font-semibold">
                Presentación {i + 1}
                <input
                  className={CLASE_CONTROL}
                  value={fila.nombre}
                  onChange={(e) => actualizar(fila.clave, "nombre", e.currentTarget.value)}
                  placeholder="Unidad"
                />
              </label>
              <label className="flex flex-col gap-1 text-sm font-semibold">
                Precio (S/)
                <input
                  className={CLASE_CONTROL}
                  inputMode="decimal"
                  value={fila.precio}
                  onChange={(e) => actualizar(fila.clave, "precio", e.currentTarget.value)}
                  placeholder="0.40"
                />
              </label>
            </div>
            <div className="flex flex-wrap items-end gap-2">
              <label className="flex flex-1 flex-col gap-1 text-sm font-semibold">
                Se vende por
                <select
                  className={CLASE_CONTROL}
                  value={fila.unidad_venta}
                  onChange={(e) => actualizar(fila.clave, "unidad_venta", e.currentTarget.value)}
                >
                  {UNIDADES_DE_VENTA.map((u) => (
                    <option key={u} value={u}>
                      {NOMBRE_DE_UNIDAD[u]}
                    </option>
                  ))}
                </select>
              </label>
              <button
                type="button"
                className="boton-linea size-11 p-0"
                aria-label={`Subir la presentación ${i + 1}`}
                onClick={() => mover(i, -1)}
                disabled={i === 0}
              >
                <ArrowUp aria-hidden className="size-5" />
              </button>
              <button
                type="button"
                className="boton-linea size-11 p-0"
                aria-label={`Bajar la presentación ${i + 1}`}
                onClick={() => mover(i, 1)}
                disabled={i === filas.length - 1}
              >
                <ArrowDown aria-hidden className="size-5" />
              </button>
              <button
                type="button"
                className="text-destructive inline-flex size-11 items-center justify-center rounded-full"
                aria-label={`Quitar la presentación ${i + 1}`}
                onClick={() => cambiar(filas.filter((f) => f.clave !== fila.clave))}
                disabled={filas.length === 1}
              >
                <Trash aria-hidden className="size-5" />
              </button>
            </div>
          </li>
        ))}
      </ol>

      {mensajes.length > 0 ? (
        <ul className="text-destructive text-sm font-semibold" data-errores="presentaciones">
          {[...new Set(mensajes)].map((m) => (
            <li key={m}>{m}</li>
          ))}
        </ul>
      ) : null}

      <button
        type="button"
        className="boton-linea"
        onClick={() => cambiar([...filas, nuevaFila()])}
      >
        <Plus aria-hidden className="size-5" /> Otra presentación
      </button>
    </div>
  );
}
```

- [ ] Escribir `src/components/panel/fotos-producto.tsx`:

```tsx
"use client";

import { Star } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import {
  agregarFotoProducto,
  cambiarTextoFoto,
  listarFotosSueltas,
  marcarFotoPrincipal,
  quitarFotoProducto,
} from "@/lib/acciones/productos";
import type { EstadoAccion } from "@/lib/panel/accion";
import { urlDeImagen } from "@/lib/supabase/publico";

import { CLASE_CONTROL } from "./campo";
import { ConfirmarBorrado } from "./confirmar-borrado";
import { SubidaImagen } from "./subida-imagen";

export type FotoProducto = { id: string; ruta: string; alt: string | null; es_principal: boolean };

type Props = { productoId: string | null; nombreProducto: string; fotos: FotoProducto[] };

/**
 * Al crear, el producto aún no tiene id y cada foto es una fila que lo exige:
 * se pide guardar primero (decisión 10). Al editar, cada foto se sube y se
 * guarda en el momento, sin esperar a «Guardar».
 */
export function FotosProducto({ productoId, nombreProducto, fotos }: Props) {
  const router = useRouter();
  const [pendiente, iniciar] = useTransition();
  const [sueltas, setSueltas] = useState<string[] | null>(null);

  if (!productoId) {
    return (
      <p className="bg-muted rounded-xl border border-dashed p-4 text-sm" data-fotos-bloqueadas>
        <strong>Primero guarda el producto</strong> y después podrás añadirle fotos.
      </p>
    );
  }

  const id = productoId;

  function avisar(resultado: EstadoAccion) {
    if (resultado.estado === "ok") {
      toast.success(resultado.mensaje);
      router.refresh();
    }
    if (resultado.estado === "error") toast.error(resultado.mensaje);
  }

  const alt = `${nombreProducto} de Panadería Pimpo's`;

  return (
    <div className="flex flex-col gap-4">
      <ul className="grid gap-3 sm:grid-cols-2">
        {fotos.map((foto) => (
          <li
            key={foto.id}
            className="bg-card flex flex-col gap-2 rounded-xl border p-3"
            data-foto={foto.id}
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- miniatura del panel; ver SubidaImagen */}
            <img
              src={urlDeImagen("productos", foto.ruta) ?? ""}
              alt=""
              className="aspect-square w-full rounded-lg object-cover"
            />
            <label className="flex flex-col gap-1 text-sm font-semibold">
              Texto para quien no ve la foto
              <input
                className={CLASE_CONTROL}
                defaultValue={foto.alt ?? ""}
                onBlur={(e) => {
                  const nuevo = e.currentTarget.value;
                  if (nuevo !== (foto.alt ?? ""))
                    iniciar(async () => avisar(await cambiarTextoFoto(foto.id, nuevo)));
                }}
              />
            </label>
            <div className="flex items-center justify-between gap-2">
              {foto.es_principal ? (
                <span className="text-sm font-semibold">
                  <Star aria-hidden className="inline size-4" /> Principal
                </span>
              ) : (
                <button
                  type="button"
                  className="boton-linea"
                  disabled={pendiente}
                  onClick={() =>
                    iniciar(async () => avisar(await marcarFotoPrincipal(id, foto.id)))
                  }
                >
                  Hacer principal
                </button>
              )}
              <ConfirmarBorrado
                nombre="esta foto"
                accion={quitarFotoProducto.bind(null, foto.id)}
              />
            </div>
          </li>
        ))}
      </ul>

      <SubidaImagen
        nombre="foto_nueva"
        bucket="productos"
        carpeta={`productos/${id}`}
        rutaInicial={null}
        etiqueta="Añadir una foto"
        alSubir={async (ruta) => avisar(await agregarFotoProducto(id, ruta, alt))}
      />

      <div className="flex flex-col gap-2">
        <button
          type="button"
          className="boton-linea w-fit"
          onClick={() => iniciar(async () => setSueltas(await listarFotosSueltas()))}
        >
          Elegir entre las fotos ya subidas
        </button>
        {sueltas !== null ? (
          sueltas.length === 0 ? (
            <p className="text-muted-foreground text-sm">No hay fotos sin asignar.</p>
          ) : (
            <ul className="grid grid-cols-3 gap-2" aria-label="Fotos sin asignar">
              {sueltas.map((ruta) => (
                <li key={ruta}>
                  <button
                    type="button"
                    className="block w-full overflow-hidden rounded-lg border"
                    aria-label={`Asignar ${ruta}`}
                    onClick={() =>
                      iniciar(async () => {
                        avisar(await agregarFotoProducto(id, ruta, alt));
                        setSueltas(null);
                      })
                    }
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element -- miniatura del panel */}
                    <img
                      src={urlDeImagen("productos", ruta) ?? ""}
                      alt=""
                      className="aspect-square w-full object-cover"
                    />
                  </button>
                </li>
              ))}
            </ul>
          )
        ) : null}
      </div>
    </div>
  );
}
```

> El `SubidaImagen` de aquí deja un campo oculto `foto_nueva` dentro del formulario del producto;
> `leerProducto` no lo lee, así que no afecta al guardado.

### Paso 5 — Pantallas de productos

- [ ] Escribir `src/app/(admin)/admin/contenido/productos/formulario-producto.tsx`:

```tsx
"use client";

import { BarraGuardar } from "@/components/panel/barra-guardar";
import { Campo, Interruptor } from "@/components/panel/campo";
import { EditorPresentaciones, type Presentacion } from "@/components/panel/editor-presentaciones";
import { FormularioPanel } from "@/components/panel/formulario-panel";
import { FotosProducto, type FotoProducto } from "@/components/panel/fotos-producto";
import { PestanasFormulario } from "@/components/panel/pestanas-formulario";
import { guardarProducto } from "@/lib/acciones/productos";
import { claveDeBorrador } from "@/lib/panel/borrador";
import { validarProducto } from "@/lib/validaciones/producto";

export type ProductoEditable = {
  id: string;
  nombre: string;
  categoria_id: string;
  descripcion: string | null;
  destacado: boolean;
  estado: string;
  presentaciones: Presentacion[];
  fotos: FotoProducto[];
};

const VOLVER = "/admin/contenido/productos";

type Props = { producto: ProductoEditable | null; categorias: { id: string; nombre: string }[] };

export function FormularioProducto({ producto, categorias }: Props) {
  return (
    <FormularioPanel
      clave={claveDeBorrador("producto", producto?.id ?? null)}
      accion={guardarProducto}
      validar={validarProducto}
      // Al crear, se vuelve a la ficha recién creada para poder añadirle fotos.
      destino={(id) => (producto ? VOLVER : `${VOLVER}/${id}`)}
    >
      <input type="hidden" name="id" value={producto?.id ?? ""} />
      <PestanasFormulario
        pestanas={[
          {
            valor: "datos",
            titulo: "Datos",
            campos: ["nombre", "categoria_id", "descripcion"],
            contenido: (
              <>
                <Campo nombre="nombre" etiqueta="Nombre">
                  {(p) => <input {...p} defaultValue={producto?.nombre ?? ""} autoComplete="off" />}
                </Campo>
                <Campo nombre="categoria_id" etiqueta="Categoría">
                  {(p) => (
                    <select {...p} defaultValue={producto?.categoria_id ?? ""}>
                      <option value="">Elige una…</option>
                      {categorias.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.nombre}
                        </option>
                      ))}
                    </select>
                  )}
                </Campo>
                <Campo nombre="descripcion" etiqueta="Descripción" opcional>
                  {(p) => <textarea {...p} rows={3} defaultValue={producto?.descripcion ?? ""} />}
                </Campo>
                <Interruptor
                  nombre="publicado"
                  etiqueta="Publicado"
                  ayuda="Se ve en el sitio"
                  marcado={producto ? producto.estado === "publicado" : false}
                />
                <Interruptor
                  nombre="destacado"
                  etiqueta="Destacado en la portada"
                  ayuda="Sale en la portada solo si tiene foto"
                  marcado={producto?.destacado ?? false}
                />
                {producto?.destacado && producto.fotos.length === 0 ? (
                  <p className="bg-alerta/15 rounded-lg p-3 text-sm" role="note">
                    No saldrá en la portada hasta que tenga foto.
                  </p>
                ) : null}
              </>
            ),
          },
          {
            valor: "precios",
            titulo: "Precios",
            campos: ["presentaciones"],
            contenido: <EditorPresentaciones iniciales={producto?.presentaciones ?? []} />,
          },
          {
            valor: "fotos",
            titulo: "Fotos",
            campos: [],
            contenido: (
              <FotosProducto
                productoId={producto?.id ?? null}
                nombreProducto={producto?.nombre ?? ""}
                fotos={producto?.fotos ?? []}
              />
            ),
          },
        ]}
      />
      <BarraGuardar volver={VOLVER} />
    </FormularioPanel>
  );
}
```

> Un producto nuevo nace **sin publicar** (a diferencia de la categoría): así nadie publica por
> accidente un producto sin foto ni descripción. Tras el primer «Guardar» se abre su ficha para
> añadir las fotos y publicarlo.

- [ ] Escribir `src/app/(admin)/admin/contenido/productos/page.tsx`:

```tsx
import { Plus } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";

import { ConfirmarBorrado } from "@/components/panel/confirmar-borrado";
import { CLASE_CONTROL } from "@/components/panel/campo";
import { EncabezadoPanel } from "@/components/panel/encabezado-panel";
import { EtiquetaEstado } from "@/components/panel/etiqueta-estado";
import { ListaAdaptable } from "@/components/panel/lista-adaptable";
import { borrarProducto } from "@/lib/acciones/productos";
import { exigirAcceso } from "@/lib/auth/sesion";
import { formatearPrecio } from "@/lib/datos/catalogo";
import { crearClienteServidor } from "@/lib/supabase/servidor";

const RUTA = "/admin/contenido/productos";

export default function Productos({ searchParams }: PageProps<"/admin/contenido/productos">) {
  return (
    <>
      <EncabezadoPanel
        titulo="Productos"
        volver={{ ruta: "/admin/contenido", nombre: "Contenido" }}
        accion={
          <Link href={`${RUTA}/nuevo`} className="boton-cta">
            <Plus aria-hidden className="size-5" /> Nuevo producto
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
  searchParams: PageProps<"/admin/contenido/productos">["searchParams"];
}) {
  const { q, categoria } = await searchParams;
  await exigirAcceso(RUTA);
  const supabase = await crearClienteServidor();

  const buscar = typeof q === "string" ? q.trim() : "";
  const filtro = typeof categoria === "string" ? categoria : "";

  let consulta = supabase
    .from("productos")
    .select(
      "id, nombre, estado, orden, categoria_id, categorias_producto(nombre), producto_variantes(precio, es_predeterminada, deleted_at)",
    )
    .is("deleted_at", null)
    .order("orden")
    .order("nombre");
  if (buscar) consulta = consulta.ilike("nombre", `%${buscar}%`);
  if (filtro) consulta = consulta.eq("categoria_id", filtro);

  const [{ data, error }, { data: categorias }] = await Promise.all([
    consulta,
    supabase.from("categorias_producto").select("id, nombre").is("deleted_at", null).order("orden"),
  ]);

  if (error) return <p role="alert">No se pudieron cargar los productos. Recarga la página.</p>;

  const filas = data.map((p) => {
    const predeterminada = p.producto_variantes.find(
      (v) => v.es_predeterminada && v.deleted_at === null,
    );
    return {
      id: p.id,
      nombre: p.nombre,
      estado: p.estado,
      categoria: p.categorias_producto?.nombre ?? "—",
      precio: predeterminada ? formatearPrecio(Number(predeterminada.precio)) : "Sin precio",
    };
  });

  return (
    <>
      {/* GET nativo: funciona sin JavaScript y deja la búsqueda en la dirección. */}
      <form className="mb-4 grid gap-2 sm:grid-cols-[1fr_14rem_auto]" role="search">
        <label className="sr-only" htmlFor="buscar">
          Buscar producto
        </label>
        <input
          id="buscar"
          name="q"
          defaultValue={buscar}
          placeholder="Buscar por nombre"
          className={CLASE_CONTROL}
        />
        <label className="sr-only" htmlFor="categoria">
          Categoría
        </label>
        <select id="categoria" name="categoria" defaultValue={filtro} className={CLASE_CONTROL}>
          <option value="">Todas las categorías</option>
          {(categorias ?? []).map((c) => (
            <option key={c.id} value={c.id}>
              {c.nombre}
            </option>
          ))}
        </select>
        <button type="submit" className="boton-linea">
          Buscar
        </button>
      </form>

      <ListaAdaptable
        etiqueta="Productos del catálogo"
        filas={filas}
        enlace={(p) => `${RUTA}/${p.id}`}
        columnas={[
          { titulo: "Nombre", celda: (p) => p.nombre, principal: true },
          { titulo: "Categoría", celda: (p) => p.categoria },
          {
            titulo: "Precio",
            celda: (p) => <span className="text-precio font-semibold">{p.precio}</span>,
          },
          { titulo: "Estado", celda: (p) => <EtiquetaEstado estado={p.estado} /> },
        ]}
        acciones={(p) => (
          <ConfirmarBorrado
            nombre={`el producto ${p.nombre}`}
            accion={borrarProducto.bind(null, p.id)}
          />
        )}
        vacio={
          buscar || filtro ? (
            <p>Ningún producto coincide con la búsqueda.</p>
          ) : (
            <p>Todavía no hay productos. Crea el primero con «Nuevo producto».</p>
          )
        }
      />
    </>
  );
}
```

> `text-precio` es la utilidad del dorado de texto de `pizarra-precios.tsx`. `formatearPrecio` vive en un módulo con `use cache`; se importa solo desde
> este Server Component, nunca desde un `"use client"` (trampa de `configuracion.ts` en `CLAUDE.md`).
> Si el build se queja, mover `formatearPrecio` a `src/lib/datos/reloj.ts` o a un
> `src/lib/utilidades/precio.ts` sin dependencias y reexportarlo desde `catalogo.ts`.

- [ ] Escribir `src/app/(admin)/admin/contenido/productos/nuevo/page.tsx`:

```tsx
import { Suspense } from "react";

import { EncabezadoPanel } from "@/components/panel/encabezado-panel";
import { exigirAcceso } from "@/lib/auth/sesion";
import { crearClienteServidor } from "@/lib/supabase/servidor";

import { FormularioProducto } from "../formulario-producto";

export default function NuevoProducto() {
  return (
    <>
      <EncabezadoPanel
        titulo="Nuevo producto"
        volver={{ ruta: "/admin/contenido/productos", nombre: "Productos" }}
      />
      <Suspense fallback={<p className="text-muted-foreground text-sm">Cargando…</p>}>
        <Formulario />
      </Suspense>
    </>
  );
}

async function Formulario() {
  await exigirAcceso("/admin/contenido/productos");
  const supabase = await crearClienteServidor();
  const { data } = await supabase
    .from("categorias_producto")
    .select("id, nombre")
    .is("deleted_at", null)
    .order("orden");
  return <FormularioProducto producto={null} categorias={data ?? []} />;
}
```

- [ ] Escribir `src/app/(admin)/admin/contenido/productos/[id]/page.tsx`:

```tsx
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { EncabezadoPanel } from "@/components/panel/encabezado-panel";
import { exigirAcceso } from "@/lib/auth/sesion";
import { crearClienteServidor } from "@/lib/supabase/servidor";

import { FormularioProducto } from "../formulario-producto";

type Params = PageProps<"/admin/contenido/productos/[id]">["params"];

export default function EditarProducto({ params }: PageProps<"/admin/contenido/productos/[id]">) {
  return (
    <Suspense fallback={<p className="text-muted-foreground text-sm">Cargando…</p>}>
      <Editor params={params} />
    </Suspense>
  );
}

async function Editor({ params }: { params: Params }) {
  const { id } = await params;
  await exigirAcceso("/admin/contenido/productos");
  const supabase = await crearClienteServidor();

  const [{ data: producto }, { data: categorias }] = await Promise.all([
    supabase
      .from("productos")
      .select(
        "id, nombre, categoria_id, descripcion, destacado, estado, producto_variantes(id, nombre, precio, unidad_venta, orden, deleted_at), producto_imagenes(id, ruta, alt, es_principal, orden)",
      )
      .eq("id", id)
      .is("deleted_at", null)
      .maybeSingle(),
    supabase.from("categorias_producto").select("id, nombre").is("deleted_at", null).order("orden"),
  ]);

  if (!producto) notFound();

  const editable = {
    id: producto.id,
    nombre: producto.nombre,
    categoria_id: producto.categoria_id,
    descripcion: producto.descripcion,
    destacado: producto.destacado,
    estado: producto.estado,
    presentaciones: producto.producto_variantes
      .filter((v) => v.deleted_at === null)
      .sort((a, b) => a.orden - b.orden)
      // numeric llega como número en JSON; se vuelve texto con dos decimales para el campo.
      .map((v) => ({
        id: v.id,
        nombre: v.nombre,
        precio: Number(v.precio).toFixed(2),
        unidad_venta: v.unidad_venta,
      })),
    fotos: [...producto.producto_imagenes].sort((a, b) => a.orden - b.orden),
  };

  return (
    <>
      <EncabezadoPanel
        titulo={producto.nombre}
        volver={{ ruta: "/admin/contenido/productos", nombre: "Productos" }}
      />
      <FormularioProducto producto={editable} categorias={categorias ?? []} />
    </>
  );
}
```

- [ ] Añadir `"/admin/contenido/productos"` a `CONSTRUIDAS` (primera posición) y a `RUTAS_DEL_PANEL`
      `"/admin/contenido/productos"`, `"/admin/contenido/productos/nuevo"`.
- [ ] `pnpm typecheck && pnpm lint && pnpm build`.
- [ ] Commit: `feat(catalogo): productos con presentaciones y fotos desde el panel`

### Paso 6 — El flujo que cierra la tarea: publicar y verlo en el sitio

- [ ] Escribir `e2e/panel-productos.spec.ts`:

```ts
import { expect, test } from "@playwright/test";

import { borrarDeLaBase } from "./ayudas/base";
import { fotoDePrueba } from "./ayudas/foto";
import { entrarComo } from "./ayudas/sesion";
import { borrarUsuario } from "./ayudas/usuarios";

const unico = () => `${Date.now()}${Math.random().toString(36).slice(2, 6)}`;

test("un ingeniero crea un producto, lo publica y el sitio lo muestra sin redesplegar", async ({
  page,
}) => {
  const usuario = await entrarComo(page, "ingeniero");
  const nombre = `Pan E2E ${unico()}`;
  try {
    await page.goto("/admin/contenido/productos/nuevo");
    await page.getByLabel("Nombre").fill(nombre);
    await page.getByLabel("Categoría").selectOption({ index: 1 });

    await page.getByRole("tab", { name: "Fotos" }).click();
    await expect(page.locator("[data-fotos-bloqueadas]")).toContainText(
      "Primero guarda el producto",
    );

    await page.getByRole("tab", { name: "Precios" }).click();
    await page.getByLabel("Presentación 1").fill("Unidad");
    await page.getByLabel("Precio (S/)").fill("0,35");
    await page.getByRole("button", { name: "Otra presentación" }).click();
    await page.getByLabel("Presentación 2").fill("Docena");
    await page.getByLabel("Precio (S/)").nth(1).fill("4");

    await page.getByRole("button", { name: "Guardar" }).click();
    await expect(page.getByText("Guardado como borrador")).toBeVisible();
    await expect(page).toHaveURL(/\/admin\/contenido\/productos\/[0-9a-f-]{36}$/);

    // Ya con id: la foto se sube en el momento.
    await page.getByRole("tab", { name: "Fotos" }).click();
    await page.getByLabel("Elegir de la galería").setInputFiles(await fotoDePrueba(page));
    await expect(page.getByText("Foto añadida.")).toBeVisible();
    await expect(page.locator("[data-foto]")).toHaveCount(1);

    await page.getByRole("tab", { name: "Datos" }).click();
    await page.getByRole("switch", { name: /Publicado/ }).check();
    await page.getByRole("button", { name: "Guardar" }).click();
    await expect(page.getByText("Guardado. Ya se ve en el sitio.")).toBeVisible();

    // updateTag('catalogo'): la siguiente visita al catálogo ya lo trae.
    await page.goto("/productos");
    await expect(page.getByText(nombre).first()).toBeVisible();
    await expect(page.getByText("S/ 0.35").first()).toBeVisible();
  } finally {
    await borrarDeLaBase("productos", "nombre", nombre);
    await borrarUsuario(usuario.id);
  }
});

test("un precio con letras se marca en la pestaña Precios aunque se esté en Datos", async ({
  page,
}) => {
  const usuario = await entrarComo(page, "administrador");
  try {
    await page.goto("/admin/contenido/productos/nuevo");
    await page.getByLabel("Nombre").fill(`Pan malo ${unico()}`);
    await page.getByLabel("Categoría").selectOption({ index: 1 });
    await page.getByRole("tab", { name: "Precios" }).click();
    await page.getByLabel("Presentación 1").fill("Unidad");
    await page.getByLabel("Precio (S/)").fill("diez");
    await page.getByRole("tab", { name: "Datos" }).click();
    await page.getByRole("button", { name: "Guardar" }).click();

    await expect(page.getByRole("tab", { name: /Precios/ })).toHaveAttribute(
      "data-con-error",
      "true",
    );
    await expect(page.getByText("Escribe el precio con números, por ejemplo 0.40.")).toBeVisible();
  } finally {
    await borrarUsuario(usuario.id);
  }
});

test("cambiar un precio deja constancia en el historial", async ({ page }) => {
  // Se comprueba en la base: el historial no tiene pantalla en F4.
  const usuario = await entrarComo(page, "administrador");
  const nombre = `Pan historial ${unico()}`;
  try {
    await page.goto("/admin/contenido/productos/nuevo");
    await page.getByLabel("Nombre").fill(nombre);
    await page.getByLabel("Categoría").selectOption({ index: 1 });
    await page.getByRole("tab", { name: "Precios" }).click();
    await page.getByLabel("Presentación 1").fill("Unidad");
    await page.getByLabel("Precio (S/)").fill("1.00");
    await page.getByRole("button", { name: "Guardar" }).click();
    await expect(page).toHaveURL(/productos\/[0-9a-f-]{36}$/);

    await page.getByRole("tab", { name: "Precios" }).click();
    await page.getByLabel("Precio (S/)").fill("1.20");
    await page.getByRole("button", { name: "Guardar" }).click();
    await expect(page).toHaveURL("/admin/contenido/productos");

    const { supabaseLocal } = await import("./ayudas/supabase-local");
    const { apiUrl, serviceRoleKey } = supabaseLocal();
    const r = await fetch(
      `${apiUrl}/rest/v1/productos?nombre=eq.${encodeURIComponent(nombre)}&select=producto_variantes(precio_historial(precio))`,
      { headers: { apikey: serviceRoleKey, Authorization: `Bearer ${serviceRoleKey}` } },
    );
    const [fila] = (await r.json()) as {
      producto_variantes: { precio_historial: { precio: number }[] }[];
    }[];
    expect(
      fila?.producto_variantes[0]?.precio_historial.map((h) => Number(h.precio)).sort(),
    ).toEqual([1, 1.2]);
  } finally {
    await borrarDeLaBase("productos", "nombre", nombre);
    await borrarUsuario(usuario.id);
  }
});
```

> Los productos de prueba se crean con `estado = 'publicado'` en una categoría real; el borrado
> físico del `finally` los saca del catálogo y la cascada se lleva sus variantes, imágenes e
> historial. Un catálogo con productos «Pan E2E» en otra prueba en paralelo no rompe nada: las
> pruebas del sitio cuentan fixtures, no totales (trampa de `CLAUDE.md`).

- [ ] Liberar el puerto 3000; `pnpm test:e2e e2e/panel-productos.spec.ts` → PASS en los dos proyectos.
- [ ] `pnpm test:e2e` completo en verde (la pizarra y las presentaciones del sitio siguen igual).
- [ ] **Rendimiento (decisión 3):** esta tarea toca `catalogo.ts` solo si hubo que mover
      `formatearPrecio`. Si se movió, medir `/` y `/productos` con `PASADAS=5 pnpm lighthouse`
      contra `main` en la misma sesión; si no, anotar en el PR que no cambia nada del sitio.
- [ ] En local, abrir un producto con la foto suelta `producto-4-kekito.webp` y comprobar que sale en
      «Elegir entre las fotos ya subidas». **Asignar las tres sueltas en producción** es tarea del
      negocio desde el panel (T8).
- [ ] Commit: `test(catalogo): publicar un producto y verlo en el sitio sin redesplegar`
- [ ] PR `feat/f4-t3-productos` → CI en verde → fusionar.

---

## Tarea 4 — Novedades con aprobación (R10)

**Rama:** `feat/f4-t4-novedades`

**Qué deja hecho:** novedades y promociones desde el panel, con su vigencia en hora de Iquitos. Un
ingeniero escribe una promoción y la **envía a revisión**; el administrador ve el aviso en el
inicio, y la **publica** o la **devuelve con un comentario** que el ingeniero lee arriba del
formulario. La base impone las tres reglas: publicar, avisar y comentar.

**Archivos:**

- Crear: `supabase/migrations/0028_aprobacion_con_aviso.sql`, `supabase/tests/0028_aprobacion_con_aviso.test.sql`
- Modificar: `src/tipos/database.types.ts` (regenerado)
- Crear: `src/lib/panel/hora-lima.ts` + `.test.ts`, `src/lib/panel/aprobacion.ts` + `.test.ts`
- Crear: `src/lib/validaciones/novedad.ts` + `.test.ts`, `src/lib/acciones/novedades.ts`
- Crear: `src/app/(admin)/admin/contenido/novedades/{page,formulario-novedad}.tsx`, `.../nueva/page.tsx`, `.../[id]/page.tsx`
- Modificar: `src/app/(admin)/admin/page.tsx` (avisos de promociones), `src/lib/panel/navegacion.ts`
  (nada: la ruta ya está), `CONSTRUIDAS`, `RUTAS_DEL_PANEL`
- Crear: `e2e/panel-novedades.spec.ts`

**Interfaces:**

- Consume (T1–T3): `ejecutarAccion`, `EstadoAccion`, `texto`, `textoOpcional`, `FormularioPanel`,
  `PestanasFormulario`, `Campo`, `SubidaImagen`, `ListaAdaptable`, `ConfirmarBorrado`,
  `EtiquetaEstado`, `EncabezadoPanel`, `claveDeBorrador`, `entrarComo`, `borrarDeLaBase`,
  `type Rol`, `generarSlug`, `ETIQUETAS.novedades`.
- Produce:
  - `limaAUtc(local: string): string | null` · `utcALima(iso: string | null): string`
  - `type Intencion = "guardar" | "enviar" | "publicar" | "devolver" | "archivar"`
  - `accionesDisponibles(rol: Rol, tipo: TipoNovedad, estado: EstadoPublicacion): Intencion[]`
  - `estadoTras(intencion: Intencion, estadoActual: EstadoPublicacion): EstadoPublicacion`
  - `intencionEfectiva(rol: Rol, tipo: TipoNovedad, intencion: Intencion): Intencion`
  - `TIPOS_DE_NOVEDAD`, `NOMBRE_DE_TIPO`

### Paso 1 — La base: comentario de devolución y aviso de revisión

- [ ] Escribir `supabase/tests/0028_aprobacion_con_aviso.test.sql`:

```sql
-- Verifica la aprobación con aviso (0028).
--
-- Lo que se defiende: que el administrador se entere sin depender de que una
-- pantalla se acuerde de avisar; que el aviso se cierre solo; que solo la
-- administración escriba el comentario de devolución; y que el ciclo completo
-- —enviar, devolver, reenviar, publicar— deje el rastro correcto.
begin;
select plan(12);

insert into auth.users (id, email, created_at, updated_at) values
  ('22222222-2222-2222-2222-222222222222', 'admin@pimpos.test', now(), now()),
  ('33333333-3333-3333-3333-333333333333', 'inge@pimpos.test',  now(), now());
update public.perfiles set rol = 'administrador', activo = true where id = '22222222-2222-2222-2222-222222222222';
update public.perfiles set rol = 'ingeniero',     activo = true where id = '33333333-3333-3333-3333-333333333333';

select has_column('public', 'novedades', 'comentario_revision', 'novedades tiene comentario_revision');
select has_column('public', 'notificaciones', 'novedad_id', 'notificaciones apunta a la novedad');

set local role authenticated;
set local request.jwt.claims = '{"sub": "33333333-3333-3333-3333-333333333333", "rol": "ingeniero"}';

insert into public.novedades (tipo, titulo, slug, contenido, estado)
values ('promocion', 'Promo 0028', 'promo-0028', 'Dos por uno.', 'borrador');
insert into public.novedades (tipo, titulo, slug, contenido, estado)
values ('aviso', 'Aviso 0028', 'aviso-0028', 'Cerrado el lunes.', 'borrador');

update public.novedades set estado = 'en_revision' where slug = 'promo-0028';
update public.novedades set estado = 'en_revision' where slug = 'aviso-0028';

select is(
  (select count(*)::int from public.notificaciones n
     join public.novedades v on v.id = n.novedad_id
    where v.slug = 'promo-0028' and n.tipo = 'promocion_en_revision' and n.resuelta_en is null),
  1, 'enviar una promoción a revisión crea un aviso abierto'
);
select is(
  (select count(*)::int from public.notificaciones n
     join public.novedades v on v.id = n.novedad_id where v.slug = 'aviso-0028'),
  0, 'un aviso que no es promoción no genera aviso de revisión'
);

select throws_ok(
  $$ update public.novedades set comentario_revision = 'Me apruebo solo' where slug = 'promo-0028' $$,
  'P0001', 'Solo un administrador puede devolver una promoción con comentario.',
  'el ingeniero no escribe comentarios de devolución'
);

set local request.jwt.claims = '{"sub": "22222222-2222-2222-2222-222222222222", "rol": "administrador"}';
update public.novedades
   set estado = 'borrador', comentario_revision = 'Falta la fecha de fin.'
 where slug = 'promo-0028';

select ok(
  (select bool_and(n.resuelta_en is not null) from public.notificaciones n
     join public.novedades v on v.id = n.novedad_id where v.slug = 'promo-0028'),
  'devolverla cierra el aviso'
);
select is(
  (select comentario_revision from public.novedades where slug = 'promo-0028'),
  'Falta la fecha de fin.', 'el comentario queda para el ingeniero'
);

set local request.jwt.claims = '{"sub": "33333333-3333-3333-3333-333333333333", "rol": "ingeniero"}';
update public.novedades set estado = 'en_revision' where slug = 'promo-0028';

select is(
  (select comentario_revision from public.novedades where slug = 'promo-0028'),
  null, 'reenviarla limpia el comentario ya atendido'
);
select is(
  (select count(*)::int from public.notificaciones n
     join public.novedades v on v.id = n.novedad_id
    where v.slug = 'promo-0028' and n.resuelta_en is null),
  1, 'reenviarla abre un aviso nuevo (y solo uno)'
);

select throws_ok(
  $$ update public.novedades set estado = 'publicado' where slug = 'promo-0028' $$,
  '23514', null,
  'el ingeniero sigue sin poder publicarla (regla de 0010)'
);

set local request.jwt.claims = '{"sub": "22222222-2222-2222-2222-222222222222", "rol": "administrador"}';
update public.novedades set estado = 'publicado' where slug = 'promo-0028';

select is(
  (select aprobada_por from public.novedades where slug = 'promo-0028'),
  '22222222-2222-2222-2222-222222222222'::uuid, 'publicarla deja quién la aprobó'
);
select is(
  (select count(*)::int from public.notificaciones n
     join public.novedades v on v.id = n.novedad_id
    where v.slug = 'promo-0028' and n.resuelta_en is null),
  0, 'publicarla cierra el aviso'
);

select * from finish();
rollback;
```

- [ ] `supabase test db` → FAIL.
- [ ] Escribir `supabase/migrations/0028_aprobacion_con_aviso.sql`:

```sql
-- =============================================================================
-- 0028_aprobacion_con_aviso.sql
-- El flujo de aprobación de promociones, completo (doc 03 §5.3; F4, tarea 4).
--
-- 0010 ya impide que un ingeniero publique una promoción. Faltaban dos cosas
-- que el plan pedía y la base no tenía:
--
--   1. Que el administrador se entere. Un trigger crea el aviso al pasar a
--      `en_revision` y lo cierra cuando sale de ahí. No lo hace el panel: si
--      lo hiciera, una petición directa a la API enviaría a revisión sin
--      avisar a nadie.
--   2. Dónde escribir por qué se devuelve. `comentario_revision`, que solo
--      escribe la administración y que se limpia al reenviar o publicar.
-- =============================================================================

alter table public.novedades add column comentario_revision text
  check (comentario_revision is null or length(btrim(comentario_revision)) > 0);

comment on column public.novedades.comentario_revision is
  'Por qué la administración devolvió la promoción a borrador. Se limpia al reenviarla o publicarla.';

-- notificaciones: de solo insumos a insumos + revisión de promociones.
alter table public.notificaciones drop constraint notificaciones_tipo_check;
alter table public.notificaciones add constraint notificaciones_tipo_check
  check (tipo in ('stock_bajo', 'por_vencer', 'vencido', 'promocion_en_revision'));

alter table public.notificaciones
  add column novedad_id uuid references public.novedades(id) on delete cascade;

create index idx_notificaciones_novedad on public.notificaciones (novedad_id)
  where novedad_id is not null and resuelta_en is null;

-- -----------------------------------------------------------------------------
-- El comentario: quién lo escribe y cuándo se limpia
-- -----------------------------------------------------------------------------
create or replace function app.gestionar_comentario_revision()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  -- Publicar o reenviar significa que lo pedido ya se atendió.
  if new.estado = 'publicado'
     or (new.estado = 'en_revision' and (tg_op = 'INSERT' or old.estado is distinct from 'en_revision')) then
    new.comentario_revision := null;
  end if;

  if new.comentario_revision is not null
     and (tg_op = 'INSERT' or new.comentario_revision is distinct from old.comentario_revision)
     and not (select app.es_rol('administrador', 'superadmin')) then
    raise exception 'Solo un administrador puede devolver una promoción con comentario.';
  end if;

  return new;
end;
$$;

create trigger novedades_comentario_revision
  before insert or update on public.novedades
  for each row execute function app.gestionar_comentario_revision();

-- -----------------------------------------------------------------------------
-- El aviso
--
-- `security definer`: `notificaciones` no tiene política de INSERT (las crea
-- el sistema, no las personas), y el ingeniero que envía a revisión no debe
-- poder escribirlas a mano.
-- -----------------------------------------------------------------------------
create or replace function app.avisar_promocion_en_revision()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.tipo <> 'promocion' then
    return null;
  end if;

  if new.estado = 'en_revision' and (tg_op = 'INSERT' or old.estado is distinct from 'en_revision') then
    insert into public.notificaciones (tipo, titulo, mensaje, novedad_id, clave_unica)
    values (
      'promocion_en_revision',
      'Promoción esperando aprobación',
      format('«%s» espera que la revises antes de publicarla.', new.titulo),
      new.id,
      -- Cada envío es un aviso distinto: una promoción devuelta y reenviada
      -- tiene que volver a avisar.
      format('promocion_en_revision:%s:%s', new.id, extract(epoch from clock_timestamp()))
    );
  elsif tg_op = 'UPDATE' and old.estado = 'en_revision' and new.estado is distinct from 'en_revision' then
    update public.notificaciones
       set resuelta_en = now()
     where novedad_id = new.id
       and tipo = 'promocion_en_revision'
       and resuelta_en is null;
  end if;

  return null;
end;
$$;

create trigger novedades_avisar_revision
  after insert or update of estado on public.novedades
  for each row execute function app.avisar_promocion_en_revision();
```

> Antes de escribir el `drop constraint`, confirmar el nombre real:
> `select conname from pg_constraint where conrelid = 'public.notificaciones'::regclass and contype = 'c';`.
> Postgres llama `notificaciones_tipo_check` al check en línea de la columna `tipo`, pero si 0015
> le puso nombre, se usa ese.
>
> El `throws_ok` del ingeniero publicando espera `23514` porque 0010 lanza con
> `errcode = 'check_violation'`. Los `raise exception` de 0028, sin `errcode`, dan `P0001`.

- [ ] `supabase db reset && bash supabase/seeds/imagenes/subir-imagenes.sh && supabase test db` → PASS
      (las 11 de 0010 siguen en verde: el trigger nuevo es `before` y no toca `estado`).
- [ ] `pnpm supabase:tipos`.
- [ ] Commit: `feat(base): aviso de promoción en revisión y comentario de devolución`

### Paso 2 — Fechas de Iquitos y botones por rol, lógica pura

- [ ] Escribir `src/lib/panel/hora-lima.test.ts`:

```ts
import { describe, expect, it } from "vitest";

import { limaAUtc, utcALima } from "./hora-lima";

describe("hora de Iquitos (UTC−5, sin horario de verano)", () => {
  it("lo que se escribe en el panel se guarda en UTC", () => {
    expect(limaAUtc("2026-10-01T08:00")).toBe("2026-10-01T13:00:00.000Z");
  });

  it("pasadas las 19:00 en Iquitos ya es otro día en UTC", () => {
    expect(limaAUtc("2026-12-31T21:30")).toBe("2027-01-01T02:30:00.000Z");
  });

  it("lo vacío o mal escrito es null, no una fecha inventada", () => {
    expect(limaAUtc("")).toBeNull();
    expect(limaAUtc("01/10/2026")).toBeNull();
  });

  it("lo guardado vuelve al campo en hora de Iquitos", () => {
    expect(utcALima("2027-01-01T02:30:00+00:00")).toBe("2026-12-31T21:30");
    expect(utcALima(null)).toBe("");
  });
});
```

- [ ] Escribir `src/lib/panel/aprobacion.test.ts`:

```ts
import { describe, expect, it } from "vitest";

import { accionesDisponibles, estadoTras, intencionEfectiva } from "./aprobacion";

describe("accionesDisponibles", () => {
  it("el ingeniero no ve «Publicar» en una promoción: ve «Enviar a revisión»", () => {
    expect(accionesDisponibles("ingeniero", "promocion", "borrador")).toEqual([
      "guardar",
      "enviar",
    ]);
  });

  it("una promoción en revisión es de solo lectura para el ingeniero", () => {
    expect(accionesDisponibles("ingeniero", "promocion", "en_revision")).toEqual([]);
  });

  it("el administrador publica o devuelve lo que está en revisión", () => {
    expect(accionesDisponibles("administrador", "promocion", "en_revision")).toEqual([
      "guardar",
      "publicar",
      "devolver",
    ]);
  });

  it("un aviso lo publica cualquiera de contenido, sin revisión", () => {
    expect(accionesDisponibles("ingeniero", "aviso", "borrador")).toEqual(["guardar", "publicar"]);
  });

  it("lo publicado se puede retirar", () => {
    expect(accionesDisponibles("ingeniero", "promocion", "publicado")).toEqual([
      "guardar",
      "archivar",
    ]);
  });

  it("una promoción archivada vuelve a pasar por revisión si la reactiva el ingeniero", () => {
    expect(accionesDisponibles("ingeniero", "promocion", "archivado")).toEqual([
      "guardar",
      "enviar",
    ]);
  });

  it("el repartidor no tiene nada que hacer aquí", () => {
    expect(accionesDisponibles("repartidor", "aviso", "borrador")).toEqual([]);
  });
});

describe("intencionEfectiva", () => {
  it("un aviso que el ingeniero «envía» se publica, porque no se revisa", () => {
    expect(intencionEfectiva("ingeniero", "aviso", "enviar")).toBe("publicar");
  });

  it("una promoción del ingeniero sí va a revisión", () => {
    expect(intencionEfectiva("ingeniero", "promocion", "enviar")).toBe("enviar");
  });
});

describe("estadoTras", () => {
  it("guardar no cambia el estado", () => {
    expect(estadoTras("guardar", "publicado")).toBe("publicado");
  });

  it("cada intención lleva a su estado", () => {
    expect(estadoTras("enviar", "borrador")).toBe("en_revision");
    expect(estadoTras("publicar", "en_revision")).toBe("publicado");
    expect(estadoTras("devolver", "en_revision")).toBe("borrador");
    expect(estadoTras("archivar", "publicado")).toBe("archivado");
  });
});
```

- [ ] `pnpm test -- src/lib/panel/hora-lima.test.ts src/lib/panel/aprobacion.test.ts` → FAIL.
- [ ] Escribir `src/lib/panel/hora-lima.ts`:

```ts
/**
 * La base guarda en UTC y el panel muestra la hora de Iquitos (convención de
 * CLAUDE.md). Perú no cambia la hora en verano, así que el desfase es fijo:
 * −05:00. Sin librería de zonas horarias.
 *
 * `<input type="datetime-local">` trabaja con «2026-10-01T08:00», sin zona.
 */
const DESFASE = "-05:00";
const CINCO_HORAS_MS = 5 * 60 * 60 * 1000;

export function limaAUtc(local: string): string | null {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(local)) return null;
  const fecha = new Date(`${local}:00${DESFASE}`);
  return Number.isNaN(fecha.getTime()) ? null : fecha.toISOString();
}

export function utcALima(iso: string | null): string {
  if (!iso) return "";
  const fecha = new Date(iso);
  if (Number.isNaN(fecha.getTime())) return "";
  return new Date(fecha.getTime() - CINCO_HORAS_MS).toISOString().slice(0, 16);
}
```

- [ ] Escribir `src/lib/panel/aprobacion.ts`:

```ts
import type { Rol } from "@/lib/auth/roles";
import type { Database } from "@/tipos/database.types";

type Novedad = Database["public"]["Tables"]["novedades"]["Row"];
export type TipoNovedad = Novedad["tipo"];
export type EstadoPublicacion = Novedad["estado"];

export type Intencion = "guardar" | "enviar" | "publicar" | "devolver" | "archivar";

export const TIPOS_DE_NOVEDAD = [
  "promocion",
  "nuevo_producto",
  "campania",
  "evento",
  "aviso",
] as const satisfies readonly TipoNovedad[];

export const NOMBRE_DE_TIPO: Record<TipoNovedad, string> = {
  promocion: "Promoción",
  nuevo_producto: "Producto nuevo",
  campania: "Campaña",
  evento: "Evento",
  aviso: "Aviso",
};

const esAdministracion = (rol: Rol) => rol === "superadmin" || rol === "administrador";

/**
 * Qué botones ve cada rol (doc 03 §5.3). Es la interfaz: esconder «Publicar»
 * al ingeniero no es la regla; la regla está en 0010 y 0028. Pero la
 * interfaz no debe ofrecer lo que la base va a rechazar.
 */
export function accionesDisponibles(
  rol: Rol,
  tipo: TipoNovedad,
  estado: EstadoPublicacion,
): Intencion[] {
  if (rol === "repartidor") return [];

  if (esAdministracion(rol)) {
    switch (estado) {
      case "borrador":
        return ["guardar", "publicar"];
      case "en_revision":
        return tipo === "promocion" ? ["guardar", "publicar", "devolver"] : ["guardar", "publicar"];
      case "publicado":
        return ["guardar", "archivar"];
      case "archivado":
        return ["guardar", "publicar"];
    }
  }

  // Ingeniero.
  if (tipo === "promocion") {
    switch (estado) {
      case "borrador":
      case "archivado":
        return ["guardar", "enviar"];
      case "en_revision":
        return [];
      case "publicado":
        return ["guardar", "archivar"];
    }
  }

  return estado === "publicado" ? ["guardar", "archivar"] : ["guardar", "publicar"];
}

/**
 * Una novedad nueva no tiene tipo hasta que se elige, así que el ingeniero ve
 * «Enviar a revisión» también cuando al final escribe un aviso. Un aviso no se
 * revisa: para él, enviar es publicar.
 */
export function intencionEfectiva(rol: Rol, tipo: TipoNovedad, intencion: Intencion): Intencion {
  return rol === "ingeniero" && tipo !== "promocion" && intencion === "enviar"
    ? "publicar"
    : intencion;
}

export function estadoTras(intencion: Intencion, actual: EstadoPublicacion): EstadoPublicacion {
  switch (intencion) {
    case "guardar":
      return actual;
    case "enviar":
      return "en_revision";
    case "publicar":
      return "publicado";
    case "devolver":
      return "borrador";
    case "archivar":
      return "archivado";
  }
}
```

- [ ] `pnpm test -- src/lib/panel/hora-lima.test.ts src/lib/panel/aprobacion.test.ts` → PASS.

### Paso 3 — Esquema y acciones

- [ ] Escribir `src/lib/validaciones/novedad.test.ts`:

```ts
import { describe, expect, it } from "vitest";

import { esquemaNovedad, leerNovedad } from "./novedad";

const fd = (pares: Record<string, string>) => {
  const d = new FormData();
  for (const [k, v] of Object.entries(pares)) d.set(k, v);
  return d;
};

const base = {
  tipo: "promocion",
  titulo: "Dos por uno",
  contenido: "Solo el sábado.",
  intencion: "guardar",
};

describe("esquemaNovedad", () => {
  it("convierte la vigencia de Iquitos a UTC", () => {
    const r = esquemaNovedad.safeParse(
      leerNovedad(
        fd({ ...base, vigencia_inicio: "2026-10-03T06:00", vigencia_fin: "2026-10-03T20:00" }),
      ),
    );
    expect(r.success && r.data.vigencia_inicio).toBe("2026-10-03T11:00:00.000Z");
  });

  it("un fin anterior al inicio se marca en el campo de fin", () => {
    const r = esquemaNovedad.safeParse(
      leerNovedad(
        fd({ ...base, vigencia_inicio: "2026-10-03T20:00", vigencia_fin: "2026-10-03T06:00" }),
      ),
    );
    expect(!r.success && r.error.issues[0]).toMatchObject({
      path: ["vigencia_fin"],
      message: "La fecha de fin tiene que ser después del inicio.",
    });
  });

  it("devolver sin comentario pide explicar qué falta", () => {
    const r = esquemaNovedad.safeParse(leerNovedad(fd({ ...base, intencion: "devolver" })));
    expect(!r.success && r.error.issues[0]).toMatchObject({
      path: ["comentario_revision"],
      message: "Escribe qué hay que corregir antes de devolverla.",
    });
  });

  it("una intención desconocida se rechaza", () => {
    expect(
      esquemaNovedad.safeParse(leerNovedad(fd({ ...base, intencion: "borrar-todo" }))).success,
    ).toBe(false);
  });
});
```

- [ ] `pnpm test -- src/lib/validaciones/novedad.test.ts` → FAIL.
- [ ] Escribir `src/lib/validaciones/novedad.ts`:

```ts
import * as z from "zod";

import { TIPOS_DE_NOVEDAD } from "@/lib/panel/aprobacion";
import { texto, textoOpcional } from "@/lib/panel/formulario";
import { limaAUtc } from "@/lib/panel/hora-lima";
import { generarSlug } from "@/lib/utilidades/slug";

export const esquemaNovedad = z
  .object({
    id: z.uuid().nullable(),
    intencion: z.enum(["guardar", "enviar", "publicar", "devolver", "archivar"]),
    tipo: z.enum(TIPOS_DE_NOVEDAD, { error: "Elige de qué tipo es." }),
    titulo: z
      .string()
      .min(1, { error: "Escribe el título." })
      .max(90, { error: "Máximo 90 letras." })
      .refine((t) => generarSlug(t).length > 0, {
        error: "El título necesita al menos una letra o un número.",
      }),
    resumen: z.string().max(200, { error: "Máximo 200 letras." }).nullable(),
    contenido: z.string().min(1, { error: "Escribe el texto de la novedad." }).max(4000),
    imagen_url: z.string().nullable(),
    vigencia_inicio: z.iso.datetime().nullable(),
    vigencia_fin: z.iso.datetime().nullable(),
    comentario_revision: z.string().max(500).nullable(),
  })
  .refine((d) => !d.vigencia_inicio || !d.vigencia_fin || d.vigencia_fin > d.vigencia_inicio, {
    path: ["vigencia_fin"],
    error: "La fecha de fin tiene que ser después del inicio.",
  })
  .refine((d) => d.intencion !== "devolver" || Boolean(d.comentario_revision), {
    path: ["comentario_revision"],
    error: "Escribe qué hay que corregir antes de devolverla.",
  });

export function leerNovedad(fd: FormData) {
  return {
    id: textoOpcional(fd, "id"),
    intencion: texto(fd, "intencion") || "guardar",
    tipo: texto(fd, "tipo"),
    titulo: texto(fd, "titulo"),
    resumen: textoOpcional(fd, "resumen"),
    contenido: texto(fd, "contenido"),
    imagen_url: textoOpcional(fd, "imagen_url"),
    vigencia_inicio: limaAUtc(texto(fd, "vigencia_inicio")),
    vigencia_fin: limaAUtc(texto(fd, "vigencia_fin")),
    comentario_revision: textoOpcional(fd, "comentario_revision"),
  };
}

export function validarNovedad(fd: FormData) {
  const r = esquemaNovedad.safeParse(leerNovedad(fd));
  return r.success
    ? {}
    : (z.flattenError(r.error).fieldErrors as Record<string, string[] | undefined>);
}
```

> Las cadenas ISO en UTC con la misma forma (`toISOString()`) se comparan bien como texto; por eso
> el `refine` compara `d.vigencia_fin > d.vigencia_inicio` sin crear fechas.
>
> `z.iso.datetime()` es la forma de Zod 4. Si la versión fijada lo nombra distinto, `z.string()`
> basta: `limaAUtc` ya garantiza la forma.

- [ ] `pnpm test -- src/lib/validaciones/novedad.test.ts` → PASS.
- [ ] Escribir `src/lib/acciones/novedades.ts`:

```ts
"use server";

import * as z from "zod";

import { ETIQUETAS } from "@/lib/datos/etiquetas";
import { ejecutarAccion, type EstadoAccion } from "@/lib/panel/accion";
import { accionesDisponibles, estadoTras, intencionEfectiva } from "@/lib/panel/aprobacion";
import { generarSlug } from "@/lib/utilidades/slug";
import { esquemaNovedad, leerNovedad } from "@/lib/validaciones/novedad";

const RUTA = "/admin/contenido/novedades";

const MENSAJES = {
  guardar: "Cambios guardados.",
  enviar: "Enviada a revisión. Un administrador la verá en su inicio.",
  publicar: "Publicada. Ya se ve en el sitio.",
  devolver: "Devuelta con tu comentario.",
  archivar: "Retirada del sitio.",
} as const;

export async function guardarNovedad(fd: FormData): Promise<EstadoAccion> {
  return ejecutarAccion({
    ruta: RUTA,
    esquema: esquemaNovedad,
    entrada: leerNovedad(fd),
    entidad: "una novedad",
    etiquetas: [ETIQUETAS.novedades],
    mensajeOk: (d) => MENSAJES[d.intencion],
    hacer: async (d, { supabase, sesion }) => {
      const intencion = intencionEfectiva(sesion.rol, d.tipo, d.intencion);

      let estadoActual: "borrador" | "en_revision" | "publicado" | "archivado" = "borrador";
      if (d.id) {
        const { data, error } = await supabase
          .from("novedades")
          .select("estado")
          .eq("id", d.id)
          .is("deleted_at", null)
          .single();
        if (error) return { error };
        estadoActual = data.estado;
      }

      // La interfaz solo enseña lo permitido, pero una acción se puede llamar
      // a mano. La base tiene la última palabra en promociones; esto evita
      // escrituras absurdas en el resto (p. ej. «devolver» un aviso).
      if (!accionesDisponibles(sesion.rol, d.tipo, estadoActual).includes(intencion)) {
        return { error: { code: "42501", message: "intención no permitida" } };
      }

      const fila = {
        tipo: d.tipo,
        titulo: d.titulo,
        resumen: d.resumen,
        contenido: d.contenido,
        imagen_url: d.imagen_url,
        vigencia_inicio: d.vigencia_inicio,
        vigencia_fin: d.vigencia_fin,
        estado: estadoTras(intencion, estadoActual),
        // Solo al devolver se escribe; en el resto se deja como está (la base lo limpia).
        ...(intencion === "devolver" ? { comentario_revision: d.comentario_revision } : {}),
      };

      if (d.id) {
        const { error } = await supabase
          .from("novedades")
          .update(fila)
          .eq("id", d.id)
          .select("id")
          .single();
        return { error, id: d.id, mensaje: MENSAJES[intencion] };
      }
      const { data, error } = await supabase
        .from("novedades")
        .insert({ ...fila, slug: generarSlug(d.titulo) })
        .select("id")
        .single();
      return { error, id: data?.id, mensaje: MENSAJES[intencion] };
    },
  });
}

export async function borrarNovedad(id: string): Promise<EstadoAccion> {
  return ejecutarAccion({
    ruta: RUTA,
    esquema: z.object({ id: z.uuid() }),
    entrada: { id },
    entidad: "la novedad",
    etiquetas: [ETIQUETAS.novedades],
    mensajeOk: "Novedad borrada.",
    hacer: async ({ id }, { supabase }) => {
      const { error } = await supabase
        .from("novedades")
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", id)
        .select("id")
        .single();
      return { error };
    },
  });
}
```

### Paso 4 — Pantallas

- [ ] Escribir `src/app/(admin)/admin/contenido/novedades/formulario-novedad.tsx`:

```tsx
"use client";

import Link from "next/link";

import { Campo } from "@/components/panel/campo";
import { FormularioPanel, useFormularioPanel } from "@/components/panel/formulario-panel";
import { PestanasFormulario } from "@/components/panel/pestanas-formulario";
import { SubidaImagen } from "@/components/panel/subida-imagen";
import { guardarNovedad } from "@/lib/acciones/novedades";
import { NOMBRE_DE_TIPO, TIPOS_DE_NOVEDAD, type Intencion } from "@/lib/panel/aprobacion";
import { claveDeBorrador } from "@/lib/panel/borrador";
import { utcALima } from "@/lib/panel/hora-lima";
import { validarNovedad } from "@/lib/validaciones/novedad";

export type NovedadEditable = {
  id: string;
  tipo: string;
  titulo: string;
  resumen: string | null;
  contenido: string;
  imagen_url: string | null;
  vigencia_inicio: string | null;
  vigencia_fin: string | null;
  estado: string;
  comentario_revision: string | null;
};

const VOLVER = "/admin/contenido/novedades";

const TEXTO_BOTON: Record<Intencion, string> = {
  guardar: "Guardar",
  enviar: "Enviar a revisión",
  publicar: "Publicar",
  devolver: "Devolver con comentario",
  archivar: "Retirar del sitio",
};

type Props = { novedad: NovedadEditable | null; acciones: Intencion[] };

export function FormularioNovedad({ novedad, acciones }: Props) {
  const soloLectura = acciones.length === 0;

  return (
    <FormularioPanel
      clave={claveDeBorrador("novedad", novedad?.id ?? null)}
      accion={guardarNovedad}
      validar={validarNovedad}
      destino={() => VOLVER}
    >
      {novedad?.comentario_revision ? (
        <div role="note" className="bg-alerta/15 rounded-xl p-4" data-comentario-revision>
          <p className="font-semibold">Un administrador la devolvió con este comentario:</p>
          <p className="mt-1">{novedad.comentario_revision}</p>
        </div>
      ) : null}
      {soloLectura ? (
        <p role="status" className="bg-muted rounded-xl p-4" data-esperando-aprobacion>
          Esperando aprobación. Un administrador la revisará; mientras tanto no se puede editar.
        </p>
      ) : null}

      <input type="hidden" name="id" value={novedad?.id ?? ""} />
      <PestanasFormulario
        pestanas={[
          {
            valor: "contenido",
            titulo: "Contenido",
            campos: ["tipo", "titulo", "resumen", "contenido"],
            contenido: (
              <fieldset disabled={soloLectura} className="contents">
                <Campo nombre="tipo" etiqueta="Tipo">
                  {(p) => (
                    <select {...p} defaultValue={novedad?.tipo ?? ""}>
                      <option value="">Elige uno…</option>
                      {TIPOS_DE_NOVEDAD.map((t) => (
                        <option key={t} value={t}>
                          {NOMBRE_DE_TIPO[t]}
                        </option>
                      ))}
                    </select>
                  )}
                </Campo>
                <Campo nombre="titulo" etiqueta="Título">
                  {(p) => <input {...p} defaultValue={novedad?.titulo ?? ""} autoComplete="off" />}
                </Campo>
                <Campo
                  nombre="resumen"
                  etiqueta="Resumen"
                  ayuda="Una frase para la tarjeta de la portada."
                  opcional
                >
                  {(p) => <input {...p} defaultValue={novedad?.resumen ?? ""} />}
                </Campo>
                <Campo nombre="contenido" etiqueta="Texto">
                  {(p) => <textarea {...p} rows={6} defaultValue={novedad?.contenido ?? ""} />}
                </Campo>
              </fieldset>
            ),
          },
          {
            valor: "vigencia",
            titulo: "Vigencia",
            campos: ["vigencia_inicio", "vigencia_fin"],
            contenido: (
              <fieldset disabled={soloLectura} className="contents">
                <p className="text-muted-foreground text-sm">
                  En hora de Iquitos. Déjalas vacías para que se vea desde que se publique y hasta
                  que la retires. Al pasar la fecha de fin se retira sola.
                </p>
                <Campo nombre="vigencia_inicio" etiqueta="Se ve desde" opcional>
                  {(p) => (
                    <input
                      {...p}
                      type="datetime-local"
                      defaultValue={utcALima(novedad?.vigencia_inicio ?? null)}
                    />
                  )}
                </Campo>
                <Campo nombre="vigencia_fin" etiqueta="Se ve hasta" opcional>
                  {(p) => (
                    <input
                      {...p}
                      type="datetime-local"
                      defaultValue={utcALima(novedad?.vigencia_fin ?? null)}
                    />
                  )}
                </Campo>
              </fieldset>
            ),
          },
          {
            valor: "imagen",
            titulo: "Imagen",
            campos: ["imagen_url"],
            contenido: (
              <fieldset disabled={soloLectura} className="contents">
                <SubidaImagen
                  nombre="imagen_url"
                  bucket="slides"
                  carpeta="novedades"
                  rutaInicial={novedad?.imagen_url ?? null}
                  etiqueta="Imagen de la novedad"
                />
              </fieldset>
            ),
          },
        ]}
      />

      {acciones.includes("devolver") ? (
        <Campo
          nombre="comentario_revision"
          etiqueta="Si la devuelves, ¿qué hay que corregir?"
          opcional
        >
          {(p) => <textarea {...p} rows={3} />}
        </Campo>
      ) : null}

      <BarraAprobacion acciones={acciones} />
    </FormularioPanel>
  );
}

function BarraAprobacion({ acciones }: { acciones: Intencion[] }) {
  const { pendiente } = useFormularioPanel();
  // La acción principal (la que no es «guardar») va en azul y a la derecha.
  const principales = acciones.filter((a) => a !== "guardar");
  return (
    <div className="bg-background/95 border-border sticky bottom-[calc(3.5rem+env(safe-area-inset-bottom))] z-30 -mx-4 flex flex-wrap justify-end gap-2 border-t px-4 py-3 md:bottom-0 md:mx-0 md:border-0 md:px-0">
      <Link href={VOLVER} className="boton-linea">
        {acciones.length === 0 ? "Volver" : "Cancelar"}
      </Link>
      {acciones.includes("guardar") ? (
        <button
          type="submit"
          name="intencion"
          value="guardar"
          className="boton-linea"
          disabled={pendiente}
        >
          Guardar
        </button>
      ) : null}
      {principales.map((a) => (
        <button
          key={a}
          type="submit"
          name="intencion"
          value={a}
          className={a === "devolver" || a === "archivar" ? "boton-linea" : "boton-cta"}
          disabled={pendiente}
        >
          {pendiente ? "Guardando…" : TEXTO_BOTON[a]}
        </button>
      ))}
    </div>
  );
}
```

> Cada pestaña envuelve su contenido en `<fieldset disabled>`, no el componente entero: los
> botones de las pestañas también son `<button>`, y dentro de un fieldset desactivado dejarían de
> cambiar de pestaña. `className="contents"` evita que el fieldset altere el diseño.

- [ ] Escribir `src/app/(admin)/admin/contenido/novedades/page.tsx`:

```tsx
import { Plus } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";

import { ConfirmarBorrado } from "@/components/panel/confirmar-borrado";
import { EncabezadoPanel } from "@/components/panel/encabezado-panel";
import { EtiquetaEstado } from "@/components/panel/etiqueta-estado";
import { ListaAdaptable } from "@/components/panel/lista-adaptable";
import { borrarNovedad } from "@/lib/acciones/novedades";
import { exigirAcceso } from "@/lib/auth/sesion";
import { NOMBRE_DE_TIPO } from "@/lib/panel/aprobacion";
import { utcALima } from "@/lib/panel/hora-lima";
import { crearClienteServidor } from "@/lib/supabase/servidor";

const RUTA = "/admin/contenido/novedades";

export default function Novedades() {
  return (
    <>
      <EncabezadoPanel
        titulo="Novedades"
        volver={{ ruta: "/admin/contenido", nombre: "Contenido" }}
        descripcion="Las promociones pasan por un administrador antes de publicarse."
        accion={
          <Link href={`${RUTA}/nueva`} className="boton-cta">
            <Plus aria-hidden className="size-5" /> Nueva novedad
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
    .from("novedades")
    .select("id, tipo, titulo, estado, vigencia_fin, comentario_revision")
    .is("deleted_at", null)
    // Lo que espera a alguien, arriba.
    .order("estado", { ascending: true })
    .order("updated_at", { ascending: false });

  if (error) return <p role="alert">No se pudieron cargar las novedades. Recarga la página.</p>;

  return (
    <ListaAdaptable
      etiqueta="Novedades y promociones"
      filas={data}
      enlace={(n) => `${RUTA}/${n.id}`}
      columnas={[
        { titulo: "Título", celda: (n) => n.titulo, principal: true },
        { titulo: "Tipo", celda: (n) => NOMBRE_DE_TIPO[n.tipo] },
        {
          titulo: "Estado",
          celda: (n) => (
            <>
              <EtiquetaEstado estado={n.estado} />
              {n.comentario_revision ? <span className="ml-1 text-sm">· Devuelta</span> : null}
            </>
          ),
        },
        {
          titulo: "Hasta",
          celda: (n) =>
            n.vigencia_fin ? utcALima(n.vigencia_fin).replace("T", " ") : "Sin fecha de fin",
        },
      ]}
      acciones={(n) => (
        <ConfirmarBorrado
          nombre={`la novedad ${n.titulo}`}
          accion={borrarNovedad.bind(null, n.id)}
        />
      )}
      vacio={<p>Todavía no hay novedades. Crea la primera con «Nueva novedad».</p>}
    />
  );
}
```

> `order("estado")` ordena por el orden del enum (`borrador, en_revision, publicado, archivado`),
> no alfabético. Si se prefiere «en revisión» primero, ordenar en JavaScript tras la consulta.

- [ ] Escribir `src/app/(admin)/admin/contenido/novedades/nueva/page.tsx`:

```tsx
import { Suspense } from "react";

import { EncabezadoPanel } from "@/components/panel/encabezado-panel";
import { exigirAcceso } from "@/lib/auth/sesion";

import { FormularioNovedad } from "../formulario-novedad";

export default function NuevaNovedad() {
  return (
    <>
      <EncabezadoPanel
        titulo="Nueva novedad"
        volver={{ ruta: "/admin/contenido/novedades", nombre: "Novedades" }}
      />
      <Suspense fallback={null}>
        <Formulario />
      </Suspense>
    </>
  );
}

async function Formulario() {
  const sesion = await exigirAcceso("/admin/contenido/novedades");
  // Una novedad nueva todavía no tiene tipo: se ofrecen «Guardar» y lo que el
  // rol puede hacer con una promoción, que es el caso más restrictivo. Al
  // elegir otro tipo y guardar, la ficha ya enseña los botones de ese tipo.
  const acciones: ("guardar" | "enviar" | "publicar")[] =
    sesion.rol === "ingeniero" ? ["guardar", "enviar"] : ["guardar", "publicar"];
  return <FormularioNovedad novedad={null} acciones={acciones} />;
}
```

> Si el ingeniero elige un tipo que no es promoción y pulsa «Enviar a revisión», la acción lo
> publica (`intencionEfectiva`): un aviso no se revisa.

- [ ] Escribir `src/app/(admin)/admin/contenido/novedades/[id]/page.tsx`:

```tsx
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { EncabezadoPanel } from "@/components/panel/encabezado-panel";
import { EtiquetaEstado } from "@/components/panel/etiqueta-estado";
import { exigirAcceso } from "@/lib/auth/sesion";
import { accionesDisponibles } from "@/lib/panel/aprobacion";
import { crearClienteServidor } from "@/lib/supabase/servidor";

import { FormularioNovedad } from "../formulario-novedad";

type Params = PageProps<"/admin/contenido/novedades/[id]">["params"];

export default function EditarNovedad({ params }: PageProps<"/admin/contenido/novedades/[id]">) {
  return (
    <Suspense fallback={<p className="text-muted-foreground text-sm">Cargando…</p>}>
      <Editor params={params} />
    </Suspense>
  );
}

async function Editor({ params }: { params: Params }) {
  const { id } = await params;
  const sesion = await exigirAcceso("/admin/contenido/novedades");
  const supabase = await crearClienteServidor();
  const { data } = await supabase
    .from("novedades")
    .select(
      "id, tipo, titulo, resumen, contenido, imagen_url, vigencia_inicio, vigencia_fin, estado, comentario_revision",
    )
    .eq("id", id)
    .is("deleted_at", null)
    .maybeSingle();

  if (!data) notFound();

  return (
    <>
      <EncabezadoPanel
        titulo={data.titulo}
        volver={{ ruta: "/admin/contenido/novedades", nombre: "Novedades" }}
        accion={<EtiquetaEstado estado={data.estado} />}
      />
      <FormularioNovedad
        novedad={data}
        acciones={accionesDisponibles(sesion.rol, data.tipo, data.estado)}
      />
    </>
  );
}
```

### Paso 5 — Avisos en el inicio

- [ ] En `src/app/(admin)/admin/page.tsx`, ampliar `contarAvisos`:

```ts
if (rol === "superadmin" || rol === "administrador") {
  const { count: enRevision } = await supabase
    .from("notificaciones")
    .select("id", { count: "exact", head: true })
    .eq("tipo", "promocion_en_revision")
    .is("resuelta_en", null);
  if (enRevision && enRevision > 0) {
    avisos.unshift({
      clave: "promociones-en-revision",
      texto: `${enRevision} ${enRevision === 1 ? "promoción espera" : "promociones esperan"} tu aprobación`,
      ruta: "/admin/contenido/novedades",
    });
  }
}

if (rol === "ingeniero") {
  const { count: devueltas } = await supabase
    .from("novedades")
    .select("id", { count: "exact", head: true })
    .eq("tipo", "promocion")
    .eq("estado", "borrador")
    .not("comentario_revision", "is", null)
    .eq("created_by", usuarioId)
    .is("deleted_at", null);
  if (devueltas && devueltas > 0) {
    avisos.push({
      clave: "promociones-devueltas",
      texto: `${devueltas} ${devueltas === 1 ? "promoción tuya fue devuelta" : "promociones tuyas fueron devueltas"} con comentario`,
      ruta: "/admin/contenido/novedades",
    });
  }
}
```

y cambiar la firma a `contarAvisos(rol: string, usuarioId: string)`, llamándola con
`contarAvisos(sesion.rol, sesion.usuarioId)`. `created_by` es fiable desde 0026 (T1).

- [ ] Añadir `"/admin/contenido/novedades"` a `CONSTRUIDAS` y a `RUTAS_DEL_PANEL` junto con
      `"/admin/contenido/novedades/nueva"`.
- [ ] `pnpm typecheck && pnpm lint && pnpm build`.
- [ ] Commit: `feat(contenido): novedades con aprobación y avisos en el inicio`

### Paso 6 — El flujo de aprobación en el navegador

- [ ] Escribir `e2e/panel-novedades.spec.ts`:

```ts
import { expect, test, type Browser } from "@playwright/test";

import { borrarDeLaBase } from "./ayudas/base";
import { entrarComo } from "./ayudas/sesion";
import { supabaseLocal } from "./ayudas/supabase-local";
import { borrarUsuario, CLAVE_DE_PRUEBA } from "./ayudas/usuarios";

/**
 * Dos personas a la vez necesitan dos contextos. Un contexto creado a mano NO
 * hereda el `use` de playwright.config.ts: sin copiarle la dirección base, el
 * idioma y el tamaño, `goto("/admin")` no sabe a dónde ir.
 */
async function paginaNueva(browser: Browser) {
  const { baseURL, viewport, isMobile, hasTouch } = test.info().project.use;
  const contexto = await browser.newContext({
    baseURL,
    viewport,
    isMobile,
    hasTouch,
    locale: "es-PE",
    timezoneId: "America/Lima",
  });
  return { contexto, page: await contexto.newPage() };
}

test("ingeniero envía, administrador devuelve, ingeniero corrige, administrador publica", async ({
  browser,
}) => {
  const titulo = `Promo E2E ${Date.now()}`;
  const inge = await paginaNueva(browser);
  const admin = await paginaNueva(browser);
  const ingeniero = await entrarComo(inge.page, "ingeniero");
  const administrador = await entrarComo(admin.page, "administrador");

  try {
    // 1. El ingeniero no tiene «Publicar»: envía a revisión.
    await inge.page.goto("/admin/contenido/novedades/nueva");
    await inge.page.getByLabel("Tipo").selectOption("promocion");
    await inge.page.getByLabel("Título").fill(titulo);
    await inge.page.getByLabel("Texto").fill("Dos por uno en pan de yema.");
    await expect(inge.page.getByRole("button", { name: "Publicar" })).toHaveCount(0);
    await inge.page.getByRole("button", { name: "Enviar a revisión" }).click();
    await expect(inge.page.getByText("Enviada a revisión")).toBeVisible();

    // 2. El administrador lo ve en su inicio y la devuelve.
    await admin.page.goto("/admin");
    await expect(admin.page.locator('[data-aviso="promociones-en-revision"]')).toContainText(
      "espera tu aprobación",
    );
    await admin.page.goto("/admin/contenido/novedades");
    await admin.page.getByRole("link", { name: titulo }).first().click();
    await admin.page.getByRole("button", { name: "Devolver con comentario" }).click();
    await expect(
      admin.page.getByText("Escribe qué hay que corregir antes de devolverla."),
    ).toBeVisible();
    await admin.page
      .getByLabel("Si la devuelves, ¿qué hay que corregir?")
      .fill("Falta la fecha de fin.");
    await admin.page.getByRole("button", { name: "Devolver con comentario" }).click();
    await expect(admin.page.getByText("Devuelta con tu comentario.")).toBeVisible();

    // 3. El ingeniero lee el comentario y la reenvía.
    await inge.page.goto("/admin");
    await expect(inge.page.locator('[data-aviso="promociones-devueltas"]')).toBeVisible();
    await inge.page.goto("/admin/contenido/novedades");
    await inge.page.getByRole("link", { name: titulo }).first().click();
    await expect(inge.page.locator("[data-comentario-revision]")).toContainText(
      "Falta la fecha de fin.",
    );
    await inge.page.getByRole("tab", { name: "Vigencia" }).click();
    await inge.page.getByLabel("Se ve hasta").fill("2099-12-31T20:00");
    await inge.page.getByRole("button", { name: "Enviar a revisión" }).click();
    await expect(inge.page.getByText("Enviada a revisión")).toBeVisible();

    // Mientras espera, el ingeniero no puede tocarla.
    await inge.page.getByRole("link", { name: titulo }).first().click();
    await expect(inge.page.locator("[data-esperando-aprobacion]")).toBeVisible();

    // 4. El administrador la publica y el sitio la muestra.
    await admin.page.goto("/admin/contenido/novedades");
    await admin.page.getByRole("link", { name: titulo }).first().click();
    await admin.page.getByRole("button", { name: "Publicar" }).click();
    await expect(admin.page.getByText("Publicada. Ya se ve en el sitio.")).toBeVisible();
    await admin.page.goto("/novedades");
    await expect(admin.page.getByText(titulo).first()).toBeVisible();
  } finally {
    await borrarDeLaBase("novedades", "titulo", titulo);
    await borrarUsuario(ingeniero.id);
    await borrarUsuario(administrador.id);
    await inge.contexto.close();
    await admin.contexto.close();
  }
});

test("aunque la pida por la API, un ingeniero no puede publicar una promoción", async ({
  page,
}) => {
  const titulo = `Promo API ${Date.now()}`;
  const ingeniero = await entrarComo(page, "ingeniero");
  const { apiUrl, anonKey } = supabaseLocal();
  try {
    const sesion = await fetch(`${apiUrl}/auth/v1/token?grant_type=password`, {
      method: "POST",
      headers: { apikey: anonKey, "Content-Type": "application/json" },
      body: JSON.stringify({ email: ingeniero.correo, password: CLAVE_DE_PRUEBA }),
    });
    const { access_token } = (await sesion.json()) as { access_token: string };

    const intento = await fetch(`${apiUrl}/rest/v1/novedades`, {
      method: "POST",
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        tipo: "promocion",
        titulo,
        slug: `promo-api-${Date.now()}`,
        contenido: "Me publico sola.",
        estado: "publicado",
      }),
    });
    const cuerpo = await intento.text();
    expect(intento.status, cuerpo).toBe(400);
    expect(cuerpo).toContain("Las promociones requieren aprobacion de un administrador");
  } finally {
    await borrarDeLaBase("novedades", "titulo", titulo);
    await borrarUsuario(ingeniero.id);
  }
});
```

> Es la prueba obligatoria del doc 03 §6 («ingeniero intenta publicar promoción y es rechazado»),
> ahora por las dos puertas: la interfaz no ofrece el botón y la API directa lo rechaza. PostgREST
> responde **400** a un `check_violation`; si responde otro 4xx, ajustar el número, nunca aceptar
> «distinto de 201» (trampa de las pruebas negativas en `CLAUDE.md`).

- [ ] Liberar el puerto 3000; `pnpm test:e2e e2e/panel-novedades.spec.ts` → PASS en los dos proyectos.
- [ ] Commit: `test(contenido): el ciclo de aprobación de una promoción, por la interfaz y por la API`
- [ ] PR `feat/f4-t4-novedades` → CI en verde → fusionar.

---

## Tarea 5 — Portada, galería, preguntas, guías y testimonios

**Rama:** `feat/f4-t5-contenido`

**Qué deja hecho:** las cinco pantallas de contenido «simple» —sin flujo de estados— con las mismas
piezas, y un orden que se cambia con «Subir» y «Bajar» en la lista (también en categorías). Ninguna
necesita migración: las tablas y sus políticas son de 0010.

**Archivos:**

- Crear: `src/lib/panel/orden.ts` + `.test.ts`, `src/lib/acciones/orden.ts`,
  `src/components/panel/botones-orden.tsx`
- Crear: `src/lib/validaciones/contenido.ts` + `.test.ts`, `src/lib/acciones/contenido.ts`
- Crear, por cada módulo `M` en `portada`, `galeria`, `preguntas`, `guias`, `testimonios`:
  `src/app/(admin)/admin/contenido/M/page.tsx`, `.../M/formulario.tsx`, `.../M/nueva/page.tsx`,
  `.../M/[id]/page.tsx`
- Modificar: `src/app/(admin)/admin/contenido/categorias/page.tsx` (botones de orden),
  `CONSTRUIDAS`, `RUTAS_DEL_PANEL`
- Crear: `e2e/panel-contenido.spec.ts`

**Interfaces:**

- Consume (T1–T4): `ejecutarAccion`, `EstadoAccion`, `texto`, `textoOpcional`, `casilla`,
  `entero`, `FormularioPanel`, `PestanasFormulario`, `Campo`, `Interruptor`, `BarraGuardar`,
  `SubidaImagen`, `ListaAdaptable`, `ConfirmarBorrado`, `EtiquetaEstado`, `EncabezadoPanel`,
  `claveDeBorrador`, `limaAUtc`, `utcALima`, `generarSlug`, `ETIQUETAS`, `entrarComo`,
  `borrarDeLaBase`, `fotoDePrueba`.
- Produce:
  - `reordenar(ids: readonly string[], id: string, hacia: "arriba" | "abajo"): { id: string; orden: number }[]`
  - `type TablaOrdenable = "categorias_producto" | "slides" | "galeria" | "faqs" | "guias" | "testimonios"`
  - `moverFila(tabla: TablaOrdenable, id: string, hacia: "arriba" | "abajo"): Promise<EstadoAccion>`
  - `<BotonesOrden nombre subir bajar primero ultimo />`

### Paso 1 — Reordenar, lógica pura

- [ ] Escribir `src/lib/panel/orden.test.ts`:

```ts
import { describe, expect, it } from "vitest";

import { reordenar } from "./orden";

describe("reordenar", () => {
  it("subir intercambia con la anterior y devuelve solo lo que cambia", () => {
    expect(reordenar(["a", "b", "c"], "c", "arriba")).toEqual([
      { id: "c", orden: 1 },
      { id: "b", orden: 2 },
    ]);
  });

  it("bajar intercambia con la siguiente", () => {
    expect(reordenar(["a", "b", "c"], "a", "abajo")).toEqual([
      { id: "b", orden: 0 },
      { id: "a", orden: 1 },
    ]);
  });

  it("en un extremo no hay nada que cambiar", () => {
    expect(reordenar(["a", "b"], "a", "arriba")).toEqual([]);
    expect(reordenar(["a", "b"], "b", "abajo")).toEqual([]);
  });

  it("un id que no está no cambia nada", () => {
    expect(reordenar(["a", "b"], "z", "arriba")).toEqual([]);
  });

  it("si los órdenes estaban repetidos, los normaliza a su posición", () => {
    // Las semillas dejan muchos `orden = 0`: la primera vez se escriben todos.
    expect(reordenar(["a", "b", "c"], "b", "arriba", [0, 0, 0])).toEqual([
      { id: "b", orden: 0 },
      { id: "a", orden: 1 },
      { id: "c", orden: 2 },
    ]);
  });
});
```

- [ ] `pnpm test -- src/lib/panel/orden.test.ts` → FAIL.
- [ ] Escribir `src/lib/panel/orden.ts`:

```ts
/**
 * Mueve una fila un puesto y devuelve las filas cuyo `orden` hay que escribir.
 *
 * @param ids en el orden en que se ven hoy.
 * @param ordenes los `orden` guardados, en el mismo orden que `ids`. Si faltan
 *   o están repetidos (las semillas dejan muchos en 0), se escriben todos con
 *   su posición: a partir de ahí, cada movimiento toca solo dos filas.
 */
export function reordenar(
  ids: readonly string[],
  id: string,
  hacia: "arriba" | "abajo",
  ordenes?: readonly number[],
): { id: string; orden: number }[] {
  const indice = ids.indexOf(id);
  const destino = hacia === "arriba" ? indice - 1 : indice + 1;
  if (indice === -1 || destino < 0 || destino >= ids.length) return [];

  const nuevos = [...ids];
  [nuevos[indice], nuevos[destino]] = [nuevos[destino]!, nuevos[indice]!];

  const normalizados =
    ordenes !== undefined && ordenes.length === ids.length && ordenes.every((o, i) => o === i);

  const todas = nuevos.map((fila, posicion) => ({ id: fila, orden: posicion }));
  if (ordenes !== undefined && !normalizados) return todas;
  return todas.filter((fila) => fila.id === ids[indice] || fila.id === ids[destino]);
}
```

- [ ] `pnpm test -- src/lib/panel/orden.test.ts` → PASS.

### Paso 2 — La acción de orden y sus botones

- [ ] Escribir `src/lib/acciones/orden.ts`:

```ts
"use server";

import * as z from "zod";

import { ETIQUETAS, type Etiqueta } from "@/lib/datos/etiquetas";
import { ejecutarAccion, type EstadoAccion } from "@/lib/panel/accion";
import { reordenar } from "@/lib/panel/orden";

export type TablaOrdenable =
  "categorias_producto" | "slides" | "galeria" | "faqs" | "guias" | "testimonios";

const DESTINO: Record<TablaOrdenable, { ruta: string; etiqueta: Etiqueta }> = {
  categorias_producto: { ruta: "/admin/contenido/categorias", etiqueta: ETIQUETAS.catalogo },
  slides: { ruta: "/admin/contenido/portada", etiqueta: ETIQUETAS.novedades },
  galeria: { ruta: "/admin/contenido/galeria", etiqueta: ETIQUETAS.contenido },
  faqs: { ruta: "/admin/contenido/preguntas", etiqueta: ETIQUETAS.contenido },
  guias: { ruta: "/admin/contenido/guias", etiqueta: ETIQUETAS.contenido },
  testimonios: { ruta: "/admin/contenido/testimonios", etiqueta: ETIQUETAS.contenido },
};

export async function moverFila(
  tabla: TablaOrdenable,
  id: string,
  hacia: "arriba" | "abajo",
): Promise<EstadoAccion> {
  const { ruta, etiqueta } = DESTINO[tabla];
  return ejecutarAccion({
    ruta,
    esquema: z.object({ id: z.uuid(), hacia: z.enum(["arriba", "abajo"]) }),
    entrada: { id, hacia },
    entidad: "la fila",
    etiquetas: [etiqueta],
    mensajeOk: "Orden cambiado.",
    hacer: async (d, { supabase }) => {
      // Una rama por tabla: supabase-js deduce el tipo de la fila del nombre
      // literal, y con una unión de nombres pierde el tipo de `update`.
      const leer = () => {
        switch (tabla) {
          case "categorias_producto":
            return supabase
              .from("categorias_producto")
              .select("id, orden")
              .is("deleted_at", null)
              .order("orden")
              .order("id");
          case "slides":
            return supabase
              .from("slides")
              .select("id, orden")
              .is("deleted_at", null)
              .order("orden")
              .order("id");
          case "galeria":
            return supabase
              .from("galeria")
              .select("id, orden")
              .is("deleted_at", null)
              .order("orden")
              .order("id");
          case "faqs":
            return supabase
              .from("faqs")
              .select("id, orden")
              .is("deleted_at", null)
              .order("orden")
              .order("id");
          case "guias":
            return supabase
              .from("guias")
              .select("id, orden")
              .is("deleted_at", null)
              .order("orden")
              .order("id");
          case "testimonios":
            return supabase
              .from("testimonios")
              .select("id, orden")
              .is("deleted_at", null)
              .order("orden")
              .order("id");
        }
      };
      const escribir = (fila: string, orden: number) => {
        switch (tabla) {
          case "categorias_producto":
            return supabase.from("categorias_producto").update({ orden }).eq("id", fila);
          case "slides":
            return supabase.from("slides").update({ orden }).eq("id", fila);
          case "galeria":
            return supabase.from("galeria").update({ orden }).eq("id", fila);
          case "faqs":
            return supabase.from("faqs").update({ orden }).eq("id", fila);
          case "guias":
            return supabase.from("guias").update({ orden }).eq("id", fila);
          case "testimonios":
            return supabase.from("testimonios").update({ orden }).eq("id", fila);
        }
      };

      const { data, error } = await leer();
      if (error) return { error };

      const cambios = reordenar(
        data.map((f) => f.id),
        d.id,
        d.hacia,
        data.map((f) => f.orden),
      );
      for (const cambio of cambios) {
        const { error: errorEscritura } = await escribir(cambio.id, cambio.orden);
        if (errorEscritura) return { error: errorEscritura };
      }
      return { error: null };
    },
  });
}
```

> Dos escrituras sin transacción. Si se corta entre una y otra quedan dos filas con el mismo
> `orden`, que la lista y el sitio desempatan por `id`, y el siguiente movimiento lo normaliza
> (paso 1). No merece una función de Postgres.

- [ ] Escribir `src/components/panel/botones-orden.tsx`:

```tsx
"use client";

import { ArrowDown, ArrowUp } from "lucide-react";
import { useTransition } from "react";
import { toast } from "sonner";

import type { EstadoAccion } from "@/lib/panel/accion";

type Props = {
  nombre: string;
  subir: () => Promise<EstadoAccion>;
  bajar: () => Promise<EstadoAccion>;
  primero: boolean;
  ultimo: boolean;
};

export function BotonesOrden({ nombre, subir, bajar, primero, ultimo }: Props) {
  const [pendiente, iniciar] = useTransition();
  const ejecutar = (accion: () => Promise<EstadoAccion>) =>
    iniciar(async () => {
      const r = await accion();
      if (r.estado === "ok") toast.success(r.mensaje);
      if (r.estado === "error") toast.error(r.mensaje);
    });

  return (
    <>
      <button
        type="button"
        className="hover:bg-muted inline-flex size-11 items-center justify-center rounded-full disabled:opacity-40"
        aria-label={`Subir ${nombre}`}
        disabled={primero || pendiente}
        onClick={() => ejecutar(subir)}
      >
        <ArrowUp aria-hidden className="size-5" />
      </button>
      <button
        type="button"
        className="hover:bg-muted inline-flex size-11 items-center justify-center rounded-full disabled:opacity-40"
        aria-label={`Bajar ${nombre}`}
        disabled={ultimo || pendiente}
        onClick={() => ejecutar(bajar)}
      >
        <ArrowDown aria-hidden className="size-5" />
      </button>
    </>
  );
}
```

> La lista se actualiza sola: `updateTag` dentro de la acción invalida también el render del panel
> que la pidió, y Next vuelve a pintar la página tras la Server Action.

- [ ] En `src/app/(admin)/admin/contenido/categorias/page.tsx`, dentro de `acciones`, antes del
      `ConfirmarBorrado`:

```tsx
acciones={(c) => (
  <>
    <BotonesOrden
      nombre={`la categoría ${c.nombre}`}
      subir={moverFila.bind(null, "categorias_producto", c.id, "arriba")}
      bajar={moverFila.bind(null, "categorias_producto", c.id, "abajo")}
      primero={c.id === data[0]?.id}
      ultimo={c.id === data.at(-1)?.id}
    />
    <ConfirmarBorrado nombre={`la categoría ${c.nombre}`} accion={borrarCategoria.bind(null, c.id)} />
  </>
)}
```

con los imports de `BotonesOrden` y `moverFila`, y `.order("id")` después de `.order("orden")`.

- [ ] Commit: `feat(panel): cambiar el orden de una lista con subir y bajar`

### Paso 3 — Los cinco esquemas

- [ ] Escribir `src/lib/validaciones/contenido.test.ts`:

```ts
import { describe, expect, it } from "vitest";

import {
  esquemaFaq,
  esquemaFotoGaleria,
  esquemaGuia,
  esquemaSlide,
  esquemaTestimonio,
  leerFaq,
  leerFotoGaleria,
  leerGuia,
  leerSlide,
  leerTestimonio,
} from "./contenido";

const fd = (pares: Record<string, string>) => {
  const d = new FormData();
  for (const [k, v] of Object.entries(pares)) d.set(k, v);
  return d;
};
const mensajes = (r: { success: boolean; error?: { issues: { message: string }[] } }) =>
  r.success ? [] : (r.error?.issues.map((i) => i.message) ?? []);

describe("slide", () => {
  const base = {
    titulo: "Pan caliente a las 4",
    imagen_url: "slides/a.webp",
    imagen_alt: "Bandeja de pan",
    enfoque: "50",
  };

  it("sin botón es válido", () => {
    expect(esquemaSlide.safeParse(leerSlide(fd(base))).success).toBe(true);
  });

  it("un enlace sin texto de botón pide el texto (la base lo exige: slide_boton_coherente)", () => {
    expect(
      mensajes(esquemaSlide.safeParse(leerSlide(fd({ ...base, enlace_url: "/productos" })))),
    ).toContain("Si el slide lleva botón, escribe el texto y el enlace.");
  });

  it("un enlace tiene que ser del sitio o empezar por https://", () => {
    expect(
      mensajes(
        esquemaSlide.safeParse(
          leerSlide(fd({ ...base, enlace_url: "javascript:alert(1)", texto_boton: "Ver" })),
        ),
      ),
    ).toContain("El enlace tiene que empezar por / o por https://");
  });

  it("sin foto grande no se guarda", () => {
    expect(mensajes(esquemaSlide.safeParse(leerSlide(fd({ ...base, imagen_url: "" }))))).toContain(
      "Sube la foto del slide.",
    );
  });

  it("el enfoque va de 0 a 100", () => {
    expect(esquemaSlide.safeParse(leerSlide(fd({ ...base, enfoque: "120" }))).success).toBe(false);
  });
});

describe("foto de galería", () => {
  it("exige texto alternativo: estas fotos comunican", () => {
    expect(
      mensajes(
        esquemaFotoGaleria.safeParse(
          leerFotoGaleria(fd({ ruta: "panel/a.webp", categoria: "hornos" })),
        ),
      ),
    ).toContain("Describe la foto para quien no puede verla.");
  });

  it("solo acepta las cinco categorías de la base", () => {
    expect(
      esquemaFotoGaleria.safeParse(
        leerFotoGaleria(fd({ ruta: "a.webp", alt: "Horno", categoria: "cocina" })),
      ).success,
    ).toBe(false);
  });
});

describe("pregunta, guía y testimonio", () => {
  it("una pregunta sin respuesta pide escribirla", () => {
    expect(mensajes(esquemaFaq.safeParse(leerFaq(fd({ pregunta: "¿Hacen delivery?" }))))).toContain(
      "Escribe la respuesta.",
    );
  });

  it("una guía válida", () => {
    expect(
      esquemaGuia.safeParse(
        leerGuia(fd({ titulo: "Cómo hacer un pedido", contenido: "Escríbenos por WhatsApp." })),
      ).success,
    ).toBe(true);
  });

  it("un testimonio sin nombre se rechaza", () => {
    expect(
      mensajes(esquemaTestimonio.safeParse(leerTestimonio(fd({ texto: "Muy rico." })))),
    ).toContain("Escribe el nombre de quien lo dice.");
  });
});
```

- [ ] `pnpm test -- src/lib/validaciones/contenido.test.ts` → FAIL.
- [ ] Escribir `src/lib/validaciones/contenido.ts`:

```ts
import * as z from "zod";

import { casilla, entero, texto, textoOpcional } from "@/lib/panel/formulario";
import { limaAUtc } from "@/lib/panel/hora-lima";
import { generarSlug } from "@/lib/utilidades/slug";

type Errores = Record<string, string[] | undefined>;
function errores(esquema: z.ZodType, datos: unknown): Errores {
  const r = esquema.safeParse(datos);
  return r.success ? {} : (z.flattenError(r.error).fieldErrors as Errores);
}

// --- Slide de portada --------------------------------------------------------

export const esquemaSlide = z
  .object({
    id: z.uuid().nullable(),
    titulo: z
      .string()
      .min(1, { error: "Escribe el titular." })
      .max(80, { error: "Máximo 80 letras." }),
    subtitulo: z.string().max(160, { error: "Máximo 160 letras." }).nullable(),
    imagen_url: z.string().min(1, { error: "Sube la foto del slide." }),
    imagen_movil_url: z.string().nullable(),
    imagen_alt: z
      .string()
      .min(1, { error: "Describe la foto para quien no puede verla." })
      .max(160),
    enlace_url: z
      .string()
      .regex(/^(\/|https:\/\/)/, { error: "El enlace tiene que empezar por / o por https://" })
      .nullable(),
    texto_boton: z.string().max(30, { error: "Máximo 30 letras." }).nullable(),
    enfoque: z.number({ error: "Elige a qué altura se recorta." }).int().min(0).max(100),
    publicado: z.boolean(),
    vigencia_inicio: z.string().nullable(),
    vigencia_fin: z.string().nullable(),
  })
  .refine((d) => (d.enlace_url === null) === (d.texto_boton === null), {
    path: ["texto_boton"],
    error: "Si el slide lleva botón, escribe el texto y el enlace.",
  })
  .refine((d) => !d.vigencia_inicio || !d.vigencia_fin || d.vigencia_fin > d.vigencia_inicio, {
    path: ["vigencia_fin"],
    error: "La fecha de fin tiene que ser después del inicio.",
  });

export function leerSlide(fd: FormData) {
  return {
    id: textoOpcional(fd, "id"),
    titulo: texto(fd, "titulo"),
    subtitulo: textoOpcional(fd, "subtitulo"),
    imagen_url: texto(fd, "imagen_url"),
    imagen_movil_url: textoOpcional(fd, "imagen_movil_url"),
    imagen_alt: texto(fd, "imagen_alt"),
    enlace_url: textoOpcional(fd, "enlace_url"),
    texto_boton: textoOpcional(fd, "texto_boton"),
    enfoque: entero(fd, "enfoque") ?? 50,
    publicado: casilla(fd, "publicado"),
    vigencia_inicio: limaAUtc(texto(fd, "vigencia_inicio")),
    vigencia_fin: limaAUtc(texto(fd, "vigencia_fin")),
  };
}
export const validarSlide = (fd: FormData) => errores(esquemaSlide, leerSlide(fd));

// --- Foto de galería ---------------------------------------------------------

export const CATEGORIAS_GALERIA = [
  "fachada",
  "interior",
  "atencion",
  "hornos",
  "productos",
] as const;
export const NOMBRE_CATEGORIA_GALERIA: Record<(typeof CATEGORIAS_GALERIA)[number], string> = {
  fachada: "Fachada",
  interior: "Interior",
  atencion: "Atención",
  hornos: "Hornos",
  productos: "Productos",
};

export const esquemaFotoGaleria = z.object({
  id: z.uuid().nullable(),
  titulo: z.string().max(60, { error: "Máximo 60 letras." }).nullable(),
  alt: z.string().min(1, { error: "Describe la foto para quien no puede verla." }).max(160),
  ruta: z.string().min(1, { error: "Sube la foto." }),
  categoria: z.enum(CATEGORIAS_GALERIA, { error: "Elige de qué es la foto." }),
  publicado: z.boolean(),
});

export function leerFotoGaleria(fd: FormData) {
  return {
    id: textoOpcional(fd, "id"),
    titulo: textoOpcional(fd, "titulo"),
    alt: texto(fd, "alt"),
    ruta: texto(fd, "ruta"),
    categoria: texto(fd, "categoria"),
    publicado: casilla(fd, "publicado"),
  };
}
export const validarFotoGaleria = (fd: FormData) =>
  errores(esquemaFotoGaleria, leerFotoGaleria(fd));

// --- Pregunta frecuente ------------------------------------------------------

export const esquemaFaq = z.object({
  id: z.uuid().nullable(),
  pregunta: z
    .string()
    .min(1, { error: "Escribe la pregunta." })
    .max(160, { error: "Máximo 160 letras." }),
  respuesta: z
    .string()
    .min(1, { error: "Escribe la respuesta." })
    .max(1000, { error: "Máximo 1000 letras." }),
  publicado: z.boolean(),
});

export function leerFaq(fd: FormData) {
  return {
    id: textoOpcional(fd, "id"),
    pregunta: texto(fd, "pregunta"),
    respuesta: texto(fd, "respuesta"),
    publicado: casilla(fd, "publicado"),
  };
}
export const validarFaq = (fd: FormData) => errores(esquemaFaq, leerFaq(fd));

// --- Guía --------------------------------------------------------------------

export const esquemaGuia = z.object({
  id: z.uuid().nullable(),
  titulo: z
    .string()
    .min(1, { error: "Escribe el título." })
    .max(90, { error: "Máximo 90 letras." })
    .refine((t) => generarSlug(t).length > 0, {
      error: "El título necesita al menos una letra o un número.",
    }),
  resumen: z.string().max(200, { error: "Máximo 200 letras." }).nullable(),
  contenido: z.string().min(1, { error: "Escribe el texto de la guía." }).max(4000),
  publicado: z.boolean(),
});

export function leerGuia(fd: FormData) {
  return {
    id: textoOpcional(fd, "id"),
    titulo: texto(fd, "titulo"),
    resumen: textoOpcional(fd, "resumen"),
    contenido: texto(fd, "contenido"),
    publicado: casilla(fd, "publicado"),
  };
}
export const validarGuia = (fd: FormData) => errores(esquemaGuia, leerGuia(fd));

// --- Testimonio --------------------------------------------------------------

export const esquemaTestimonio = z.object({
  id: z.uuid().nullable(),
  nombre: z.string().min(1, { error: "Escribe el nombre de quien lo dice." }).max(60),
  texto: z
    .string()
    .min(1, { error: "Escribe lo que dijo." })
    .max(400, { error: "Máximo 400 letras." }),
  procedencia: z.string().max(60, { error: "Máximo 60 letras." }).nullable(),
  publicado: z.boolean(),
});

export function leerTestimonio(fd: FormData) {
  return {
    id: textoOpcional(fd, "id"),
    nombre: texto(fd, "nombre"),
    texto: texto(fd, "texto"),
    procedencia: textoOpcional(fd, "procedencia"),
    publicado: casilla(fd, "publicado"),
  };
}
export const validarTestimonio = (fd: FormData) => errores(esquemaTestimonio, leerTestimonio(fd));
```

- [ ] `pnpm test -- src/lib/validaciones/contenido.test.ts` → PASS.

### Paso 4 — Las acciones

- [ ] Escribir `src/lib/acciones/contenido.ts`:

```ts
"use server";

import * as z from "zod";

import { ETIQUETAS } from "@/lib/datos/etiquetas";
import { ejecutarAccion, type EstadoAccion } from "@/lib/panel/accion";
import { generarSlug } from "@/lib/utilidades/slug";
import {
  esquemaFaq,
  esquemaFotoGaleria,
  esquemaGuia,
  esquemaSlide,
  esquemaTestimonio,
  leerFaq,
  leerFotoGaleria,
  leerGuia,
  leerSlide,
  leerTestimonio,
} from "@/lib/validaciones/contenido";

const estado = (publicado: boolean) => (publicado ? ("publicado" as const) : ("borrador" as const));
const mensajeGuardado = (d: { publicado: boolean }) =>
  d.publicado
    ? "Guardado. Ya se ve en el sitio."
    : "Guardado como borrador. Aún no se ve en el sitio.";
const ahora = () => new Date().toISOString();

// --- Portada -----------------------------------------------------------------

export async function guardarSlide(fd: FormData): Promise<EstadoAccion> {
  return ejecutarAccion({
    ruta: "/admin/contenido/portada",
    esquema: esquemaSlide,
    entrada: leerSlide(fd),
    entidad: "un slide",
    etiquetas: [ETIQUETAS.novedades],
    mensajeOk: mensajeGuardado,
    hacer: async ({ id, publicado, ...d }, { supabase }) => {
      const fila = { ...d, estado: estado(publicado) };
      if (id) {
        const { error } = await supabase
          .from("slides")
          .update(fila)
          .eq("id", id)
          .select("id")
          .single();
        return { error, id };
      }
      const { data, error } = await supabase.from("slides").insert(fila).select("id").single();
      return { error, id: data?.id };
    },
  });
}

export async function borrarSlide(id: string): Promise<EstadoAccion> {
  return borrarLogico("slides", id, "/admin/contenido/portada", "el slide", ETIQUETAS.novedades);
}

// --- Galería -----------------------------------------------------------------

export async function guardarFotoGaleria(fd: FormData): Promise<EstadoAccion> {
  return ejecutarAccion({
    ruta: "/admin/contenido/galeria",
    esquema: esquemaFotoGaleria,
    entrada: leerFotoGaleria(fd),
    entidad: "una foto",
    etiquetas: [ETIQUETAS.contenido],
    mensajeOk: mensajeGuardado,
    hacer: async ({ id, publicado, ...d }, { supabase }) => {
      const fila = { ...d, estado: estado(publicado) };
      if (id) {
        const { error } = await supabase
          .from("galeria")
          .update(fila)
          .eq("id", id)
          .select("id")
          .single();
        return { error, id };
      }
      const { data, error } = await supabase.from("galeria").insert(fila).select("id").single();
      return { error, id: data?.id };
    },
  });
}

export async function borrarFotoGaleria(id: string): Promise<EstadoAccion> {
  return borrarLogico("galeria", id, "/admin/contenido/galeria", "la foto", ETIQUETAS.contenido);
}

// --- Preguntas frecuentes ----------------------------------------------------

export async function guardarFaq(fd: FormData): Promise<EstadoAccion> {
  return ejecutarAccion({
    ruta: "/admin/contenido/preguntas",
    esquema: esquemaFaq,
    entrada: leerFaq(fd),
    entidad: "una pregunta",
    etiquetas: [ETIQUETAS.contenido],
    mensajeOk: mensajeGuardado,
    hacer: async ({ id, publicado, ...d }, { supabase }) => {
      const fila = { ...d, estado: estado(publicado) };
      if (id) {
        const { error } = await supabase
          .from("faqs")
          .update(fila)
          .eq("id", id)
          .select("id")
          .single();
        return { error, id };
      }
      const { data, error } = await supabase.from("faqs").insert(fila).select("id").single();
      return { error, id: data?.id };
    },
  });
}

export async function borrarFaq(id: string): Promise<EstadoAccion> {
  return borrarLogico("faqs", id, "/admin/contenido/preguntas", "la pregunta", ETIQUETAS.contenido);
}

// --- Guías -------------------------------------------------------------------

export async function guardarGuia(fd: FormData): Promise<EstadoAccion> {
  return ejecutarAccion({
    ruta: "/admin/contenido/guias",
    esquema: esquemaGuia,
    entrada: leerGuia(fd),
    entidad: "una guía",
    etiquetas: [ETIQUETAS.contenido],
    mensajeOk: mensajeGuardado,
    hacer: async ({ id, publicado, ...d }, { supabase }) => {
      const fila = { ...d, estado: estado(publicado) };
      if (id) {
        const { error } = await supabase
          .from("guias")
          .update(fila)
          .eq("id", id)
          .select("id")
          .single();
        return { error, id };
      }
      const { data, error } = await supabase
        .from("guias")
        .insert({ ...fila, slug: generarSlug(d.titulo) })
        .select("id")
        .single();
      return { error, id: data?.id };
    },
  });
}

export async function borrarGuia(id: string): Promise<EstadoAccion> {
  return borrarLogico("guias", id, "/admin/contenido/guias", "la guía", ETIQUETAS.contenido);
}

// --- Testimonios -------------------------------------------------------------

export async function guardarTestimonio(fd: FormData): Promise<EstadoAccion> {
  return ejecutarAccion({
    ruta: "/admin/contenido/testimonios",
    esquema: esquemaTestimonio,
    entrada: leerTestimonio(fd),
    entidad: "un testimonio",
    etiquetas: [ETIQUETAS.contenido],
    mensajeOk: mensajeGuardado,
    hacer: async ({ id, publicado, ...d }, { supabase }) => {
      // Un testimonio escrito desde el panel es real por definición: es_demo
      // se queda en false (valor por defecto) y no se ofrece en el formulario.
      const fila = { ...d, estado: estado(publicado) };
      if (id) {
        const { error } = await supabase
          .from("testimonios")
          .update(fila)
          .eq("id", id)
          .select("id")
          .single();
        return { error, id };
      }
      const { data, error } = await supabase.from("testimonios").insert(fila).select("id").single();
      return { error, id: data?.id };
    },
  });
}

export async function borrarTestimonio(id: string): Promise<EstadoAccion> {
  return borrarLogico(
    "testimonios",
    id,
    "/admin/contenido/testimonios",
    "el testimonio",
    ETIQUETAS.contenido,
  );
}

// --- Borrado lógico común ----------------------------------------------------

async function borrarLogico(
  tabla: "slides" | "galeria" | "faqs" | "guias" | "testimonios",
  id: string,
  ruta: string,
  entidad: string,
  etiqueta: (typeof ETIQUETAS)[keyof typeof ETIQUETAS],
): Promise<EstadoAccion> {
  return ejecutarAccion({
    ruta,
    esquema: z.object({ id: z.uuid() }),
    entrada: { id },
    entidad,
    etiquetas: [etiqueta],
    mensajeOk: "Borrado.",
    hacer: async ({ id }, { supabase }) => {
      const cambio = { deleted_at: ahora() };
      // Ver la nota de `moverFila`: una rama por tabla para no perder los tipos.
      const consulta =
        tabla === "slides"
          ? supabase.from("slides").update(cambio).eq("id", id).select("id").single()
          : tabla === "galeria"
            ? supabase.from("galeria").update(cambio).eq("id", id).select("id").single()
            : tabla === "faqs"
              ? supabase.from("faqs").update(cambio).eq("id", id).select("id").single()
              : tabla === "guias"
                ? supabase.from("guias").update(cambio).eq("id", id).select("id").single()
                : supabase.from("testimonios").update(cambio).eq("id", id).select("id").single();
      const { error } = await consulta;
      return { error };
    },
  });
}
```

> `borrarLogico` no lleva `export`: en un archivo `"use server"` todo lo exportado se convierte en
> una acción que se puede llamar desde el navegador, y esta recibe la tabla por parámetro.

- [ ] `pnpm typecheck`.
- [ ] Commit: `feat(contenido): esquemas y acciones de portada, galería, preguntas, guías y testimonios`

### Paso 5 — Las pantallas

Las cinco siguen la forma de categorías (T2): una lista con `ListaAdaptable`, orden y borrado; una
página `nueva` y una `[id]` que cargan la fila y pintan el formulario. Se escriben enteras.

#### Portada (`/admin/contenido/portada`)

- [ ] `src/app/(admin)/admin/contenido/portada/formulario.tsx`:

```tsx
"use client";

import { BarraGuardar } from "@/components/panel/barra-guardar";
import { Campo, Interruptor } from "@/components/panel/campo";
import { FormularioPanel } from "@/components/panel/formulario-panel";
import { PestanasFormulario } from "@/components/panel/pestanas-formulario";
import { SubidaImagen } from "@/components/panel/subida-imagen";
import { guardarSlide } from "@/lib/acciones/contenido";
import { claveDeBorrador } from "@/lib/panel/borrador";
import { utcALima } from "@/lib/panel/hora-lima";
import { validarSlide } from "@/lib/validaciones/contenido";

export type SlideEditable = {
  id: string;
  titulo: string;
  subtitulo: string | null;
  imagen_url: string;
  imagen_movil_url: string | null;
  imagen_alt: string | null;
  enlace_url: string | null;
  texto_boton: string | null;
  enfoque: number;
  estado: string;
  vigencia_inicio: string | null;
  vigencia_fin: string | null;
};

const VOLVER = "/admin/contenido/portada";

export function FormularioSlide({ slide }: { slide: SlideEditable | null }) {
  return (
    <FormularioPanel
      clave={claveDeBorrador("slide", slide?.id ?? null)}
      accion={guardarSlide}
      validar={validarSlide}
      destino={() => VOLVER}
    >
      <input type="hidden" name="id" value={slide?.id ?? ""} />
      <PestanasFormulario
        pestanas={[
          {
            valor: "texto",
            titulo: "Texto",
            campos: ["titulo", "subtitulo"],
            contenido: (
              <>
                <Campo nombre="titulo" etiqueta="Titular">
                  {(p) => <input {...p} defaultValue={slide?.titulo ?? ""} />}
                </Campo>
                <Campo nombre="subtitulo" etiqueta="Frase de apoyo" opcional>
                  {(p) => <input {...p} defaultValue={slide?.subtitulo ?? ""} />}
                </Campo>
                <p className="text-muted-foreground text-sm">
                  No escribas cuántos años tiene el negocio: di el año («desde 2004»), que no
                  caduca.
                </p>
                <Interruptor
                  nombre="publicado"
                  etiqueta="Publicado"
                  ayuda="Se ve en la portada"
                  marcado={slide ? slide.estado === "publicado" : false}
                />
              </>
            ),
          },
          {
            valor: "fotos",
            titulo: "Fotos",
            campos: ["imagen_url", "imagen_alt", "enfoque"],
            contenido: (
              <>
                <SubidaImagen
                  nombre="imagen_url"
                  bucket="slides"
                  carpeta="portada"
                  rutaInicial={slide?.imagen_url ?? null}
                  etiqueta="Foto grande (computadora)"
                />
                <SubidaImagen
                  nombre="imagen_movil_url"
                  bucket="slides"
                  carpeta="portada"
                  rutaInicial={slide?.imagen_movil_url ?? null}
                  etiqueta="Foto vertical (celular, opcional)"
                />
                <Campo nombre="imagen_alt" etiqueta="Qué se ve en la foto">
                  {(p) => <input {...p} defaultValue={slide?.imagen_alt ?? ""} />}
                </Campo>
                <Campo
                  nombre="enfoque"
                  etiqueta="Qué parte de la foto se ve al recortar"
                  ayuda="0 es arriba, 100 es abajo."
                >
                  {(p) => (
                    <input
                      {...p}
                      type="range"
                      min={0}
                      max={100}
                      step={5}
                      defaultValue={slide?.enfoque ?? 50}
                    />
                  )}
                </Campo>
              </>
            ),
          },
          {
            valor: "boton",
            titulo: "Botón y fechas",
            campos: ["enlace_url", "texto_boton", "vigencia_inicio", "vigencia_fin"],
            contenido: (
              <>
                <Campo nombre="texto_boton" etiqueta="Texto del botón" opcional>
                  {(p) => (
                    <input
                      {...p}
                      defaultValue={slide?.texto_boton ?? ""}
                      placeholder="Ver productos"
                    />
                  )}
                </Campo>
                <Campo
                  nombre="enlace_url"
                  etiqueta="A dónde lleva"
                  ayuda="Una página del sitio (/productos) o una dirección que empiece por https://"
                  opcional
                >
                  {(p) => <input {...p} defaultValue={slide?.enlace_url ?? ""} inputMode="url" />}
                </Campo>
                <Campo nombre="vigencia_inicio" etiqueta="Se ve desde" opcional>
                  {(p) => (
                    <input
                      {...p}
                      type="datetime-local"
                      defaultValue={utcALima(slide?.vigencia_inicio ?? null)}
                    />
                  )}
                </Campo>
                <Campo nombre="vigencia_fin" etiqueta="Se ve hasta" opcional>
                  {(p) => (
                    <input
                      {...p}
                      type="datetime-local"
                      defaultValue={utcALima(slide?.vigencia_fin ?? null)}
                    />
                  )}
                </Campo>
              </>
            ),
          },
        ]}
      />
      <BarraGuardar volver={VOLVER} />
    </FormularioPanel>
  );
}
```

> El `range` mide 44 px de alto con `CLASE_CONTROL`; si axe o `tactil` se quejan del pulgar,
> añadir `accent-primary h-11`. Recordatorio de 3.1: **el celular no lleva carrusel** (decisión del
> 12/09); la foto vertical la usa `PortadaMovil` si existe.

- [ ] `src/app/(admin)/admin/contenido/portada/page.tsx`:

```tsx
import { Plus } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";

import { BotonesOrden } from "@/components/panel/botones-orden";
import { ConfirmarBorrado } from "@/components/panel/confirmar-borrado";
import { EncabezadoPanel } from "@/components/panel/encabezado-panel";
import { EtiquetaEstado } from "@/components/panel/etiqueta-estado";
import { ListaAdaptable } from "@/components/panel/lista-adaptable";
import { borrarSlide } from "@/lib/acciones/contenido";
import { moverFila } from "@/lib/acciones/orden";
import { exigirAcceso } from "@/lib/auth/sesion";
import { crearClienteServidor } from "@/lib/supabase/servidor";

const RUTA = "/admin/contenido/portada";

export default function Portada() {
  return (
    <>
      <EncabezadoPanel
        titulo="Portada"
        descripcion="Las fotos grandes del inicio del sitio, en el orden en que pasan."
        volver={{ ruta: "/admin/contenido", nombre: "Contenido" }}
        accion={
          <Link href={`${RUTA}/nueva`} className="boton-cta">
            <Plus aria-hidden className="size-5" /> Nuevo slide
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
    .from("slides")
    .select("id, titulo, estado, es_demo")
    .is("deleted_at", null)
    .order("orden")
    .order("id");
  if (error) return <p role="alert">No se pudieron cargar los slides. Recarga la página.</p>;

  return (
    <ListaAdaptable
      etiqueta="Slides de la portada"
      filas={data}
      enlace={(s) => `${RUTA}/${s.id}`}
      columnas={[
        { titulo: "Titular", celda: (s) => s.titulo, principal: true },
        { titulo: "Estado", celda: (s) => <EtiquetaEstado estado={s.estado} /> },
      ]}
      acciones={(s) => (
        <>
          <BotonesOrden
            nombre={`el slide ${s.titulo}`}
            subir={moverFila.bind(null, "slides", s.id, "arriba")}
            bajar={moverFila.bind(null, "slides", s.id, "abajo")}
            primero={s.id === data[0]?.id}
            ultimo={s.id === data.at(-1)?.id}
          />
          <ConfirmarBorrado nombre={`el slide ${s.titulo}`} accion={borrarSlide.bind(null, s.id)} />
        </>
      )}
      vacio={<p>No hay slides. Sin ninguno, la portada muestra su versión sin carrusel.</p>}
    />
  );
}
```

- [ ] `src/app/(admin)/admin/contenido/portada/nueva/page.tsx`:

```tsx
import { EncabezadoPanel } from "@/components/panel/encabezado-panel";

import { FormularioSlide } from "../formulario";

export default function NuevoSlide() {
  return (
    <>
      <EncabezadoPanel
        titulo="Nuevo slide"
        volver={{ ruta: "/admin/contenido/portada", nombre: "Portada" }}
      />
      <FormularioSlide slide={null} />
    </>
  );
}
```

- [ ] `src/app/(admin)/admin/contenido/portada/[id]/page.tsx`:

```tsx
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { EncabezadoPanel } from "@/components/panel/encabezado-panel";
import { exigirAcceso } from "@/lib/auth/sesion";
import { crearClienteServidor } from "@/lib/supabase/servidor";

import { FormularioSlide } from "../formulario";

type Params = PageProps<"/admin/contenido/portada/[id]">["params"];

export default function EditarSlide({ params }: PageProps<"/admin/contenido/portada/[id]">) {
  return (
    <Suspense fallback={<p className="text-muted-foreground text-sm">Cargando…</p>}>
      <Editor params={params} />
    </Suspense>
  );
}

async function Editor({ params }: { params: Params }) {
  const { id } = await params;
  await exigirAcceso("/admin/contenido/portada");
  const supabase = await crearClienteServidor();
  const { data } = await supabase
    .from("slides")
    .select(
      "id, titulo, subtitulo, imagen_url, imagen_movil_url, imagen_alt, enlace_url, texto_boton, enfoque, estado, vigencia_inicio, vigencia_fin",
    )
    .eq("id", id)
    .is("deleted_at", null)
    .maybeSingle();
  if (!data) notFound();
  return (
    <>
      <EncabezadoPanel
        titulo={data.titulo}
        volver={{ ruta: "/admin/contenido/portada", nombre: "Portada" }}
      />
      <FormularioSlide slide={data} />
    </>
  );
}
```

#### Galería (`/admin/contenido/galeria`)

- [ ] `src/app/(admin)/admin/contenido/galeria/formulario.tsx`:

```tsx
"use client";

import { BarraGuardar } from "@/components/panel/barra-guardar";
import { Campo, Interruptor } from "@/components/panel/campo";
import { FormularioPanel } from "@/components/panel/formulario-panel";
import { SubidaImagen } from "@/components/panel/subida-imagen";
import { guardarFotoGaleria } from "@/lib/acciones/contenido";
import { claveDeBorrador } from "@/lib/panel/borrador";
import {
  CATEGORIAS_GALERIA,
  NOMBRE_CATEGORIA_GALERIA,
  validarFotoGaleria,
} from "@/lib/validaciones/contenido";

export type FotoGaleriaEditable = {
  id: string;
  titulo: string | null;
  alt: string;
  ruta: string;
  categoria: string;
  estado: string;
};

const VOLVER = "/admin/contenido/galeria";

/** Pocos campos: una sola tarjeta, sin pestañas. */
export function FormularioFotoGaleria({ foto }: { foto: FotoGaleriaEditable | null }) {
  return (
    <FormularioPanel
      clave={claveDeBorrador("galeria", foto?.id ?? null)}
      accion={guardarFotoGaleria}
      validar={validarFotoGaleria}
      destino={() => VOLVER}
    >
      <input type="hidden" name="id" value={foto?.id ?? ""} />
      <div className="bg-card flex flex-col gap-4 rounded-xl border p-4">
        <SubidaImagen
          nombre="ruta"
          bucket="galeria"
          carpeta="panel"
          rutaInicial={foto?.ruta ?? null}
          etiqueta="Foto"
        />
        <Campo nombre="alt" etiqueta="Qué se ve en la foto">
          {(p) => <input {...p} defaultValue={foto?.alt ?? ""} />}
        </Campo>
        <Campo nombre="titulo" etiqueta="Pie de foto" opcional>
          {(p) => <input {...p} defaultValue={foto?.titulo ?? ""} />}
        </Campo>
        <Campo nombre="categoria" etiqueta="De qué es">
          {(p) => (
            <select {...p} defaultValue={foto?.categoria ?? ""}>
              <option value="">Elige una…</option>
              {CATEGORIAS_GALERIA.map((c) => (
                <option key={c} value={c}>
                  {NOMBRE_CATEGORIA_GALERIA[c]}
                </option>
              ))}
            </select>
          )}
        </Campo>
        <Interruptor
          nombre="publicado"
          etiqueta="Publicada"
          ayuda="Se ve en la galería"
          marcado={foto ? foto.estado === "publicado" : true}
        />
      </div>
      <BarraGuardar volver={VOLVER} />
    </FormularioPanel>
  );
}
```

> Si falta la foto, el error «Sube la foto.» lo pinta la propia `SubidaImagen` (T2) bajo sus
> botones: lee `errores[nombre]` del formulario.

- [ ] `src/app/(admin)/admin/contenido/galeria/page.tsx` (con miniatura en la lista):

```tsx
import { Plus } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";

import { BotonesOrden } from "@/components/panel/botones-orden";
import { ConfirmarBorrado } from "@/components/panel/confirmar-borrado";
import { EncabezadoPanel } from "@/components/panel/encabezado-panel";
import { EtiquetaEstado } from "@/components/panel/etiqueta-estado";
import { ListaAdaptable } from "@/components/panel/lista-adaptable";
import { borrarFotoGaleria } from "@/lib/acciones/contenido";
import { moverFila } from "@/lib/acciones/orden";
import { exigirAcceso } from "@/lib/auth/sesion";
import { urlDeImagen } from "@/lib/supabase/publico";
import { crearClienteServidor } from "@/lib/supabase/servidor";
import { NOMBRE_CATEGORIA_GALERIA } from "@/lib/validaciones/contenido";

const RUTA = "/admin/contenido/galeria";

export default function Galeria() {
  return (
    <>
      <EncabezadoPanel
        titulo="Galería"
        volver={{ ruta: "/admin/contenido", nombre: "Contenido" }}
        accion={
          <Link href={`${RUTA}/nueva`} className="boton-cta">
            <Plus aria-hidden className="size-5" /> Nueva foto
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
    .from("galeria")
    .select("id, titulo, alt, ruta, categoria, estado")
    .is("deleted_at", null)
    .order("orden")
    .order("id");
  if (error) return <p role="alert">No se pudo cargar la galería. Recarga la página.</p>;

  return (
    <ListaAdaptable
      etiqueta="Fotos de la galería"
      filas={data}
      enlace={(f) => `${RUTA}/${f.id}`}
      columnas={[
        {
          titulo: "Foto",
          principal: true,
          celda: (f) => (
            <span className="flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element -- miniatura del panel */}
              <img
                src={urlDeImagen("galeria", f.ruta) ?? ""}
                alt=""
                className="size-12 rounded-lg object-cover"
              />
              {f.titulo ?? f.alt}
            </span>
          ),
        },
        {
          titulo: "De qué es",
          celda: (f) =>
            NOMBRE_CATEGORIA_GALERIA[f.categoria as keyof typeof NOMBRE_CATEGORIA_GALERIA],
        },
        { titulo: "Estado", celda: (f) => <EtiquetaEstado estado={f.estado} /> },
      ]}
      acciones={(f) => (
        <>
          <BotonesOrden
            nombre={`la foto ${f.titulo ?? f.alt}`}
            subir={moverFila.bind(null, "galeria", f.id, "arriba")}
            bajar={moverFila.bind(null, "galeria", f.id, "abajo")}
            primero={f.id === data[0]?.id}
            ultimo={f.id === data.at(-1)?.id}
          />
          <ConfirmarBorrado
            nombre={`la foto ${f.titulo ?? f.alt}`}
            accion={borrarFotoGaleria.bind(null, f.id)}
          />
        </>
      )}
      vacio={<p>La galería está vacía. Añade la primera foto con «Nueva foto».</p>}
    />
  );
}
```

- [ ] `src/app/(admin)/admin/contenido/galeria/nueva/page.tsx`:

```tsx
import { EncabezadoPanel } from "@/components/panel/encabezado-panel";

import { FormularioFotoGaleria } from "../formulario";

export default function NuevaFoto() {
  return (
    <>
      <EncabezadoPanel
        titulo="Nueva foto"
        volver={{ ruta: "/admin/contenido/galeria", nombre: "Galería" }}
      />
      <FormularioFotoGaleria foto={null} />
    </>
  );
}
```

- [ ] `src/app/(admin)/admin/contenido/galeria/[id]/page.tsx`:

```tsx
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { EncabezadoPanel } from "@/components/panel/encabezado-panel";
import { exigirAcceso } from "@/lib/auth/sesion";
import { crearClienteServidor } from "@/lib/supabase/servidor";

import { FormularioFotoGaleria } from "../formulario";

type Params = PageProps<"/admin/contenido/galeria/[id]">["params"];

export default function EditarFoto({ params }: PageProps<"/admin/contenido/galeria/[id]">) {
  return (
    <Suspense fallback={<p className="text-muted-foreground text-sm">Cargando…</p>}>
      <Editor params={params} />
    </Suspense>
  );
}

async function Editor({ params }: { params: Params }) {
  const { id } = await params;
  await exigirAcceso("/admin/contenido/galeria");
  const supabase = await crearClienteServidor();
  const { data } = await supabase
    .from("galeria")
    .select("id, titulo, alt, ruta, categoria, estado")
    .eq("id", id)
    .is("deleted_at", null)
    .maybeSingle();
  if (!data) notFound();
  return (
    <>
      <EncabezadoPanel
        titulo={data.titulo ?? "Foto"}
        volver={{ ruta: "/admin/contenido/galeria", nombre: "Galería" }}
      />
      <FormularioFotoGaleria foto={data} />
    </>
  );
}
```

#### Preguntas frecuentes (`/admin/contenido/preguntas`)

- [ ] `src/app/(admin)/admin/contenido/preguntas/formulario.tsx`:

```tsx
"use client";

import { BarraGuardar } from "@/components/panel/barra-guardar";
import { Campo, Interruptor } from "@/components/panel/campo";
import { FormularioPanel } from "@/components/panel/formulario-panel";
import { guardarFaq } from "@/lib/acciones/contenido";
import { claveDeBorrador } from "@/lib/panel/borrador";
import { validarFaq } from "@/lib/validaciones/contenido";

export type FaqEditable = { id: string; pregunta: string; respuesta: string; estado: string };

const VOLVER = "/admin/contenido/preguntas";

export function FormularioFaq({ faq }: { faq: FaqEditable | null }) {
  return (
    <FormularioPanel
      clave={claveDeBorrador("faq", faq?.id ?? null)}
      accion={guardarFaq}
      validar={validarFaq}
      destino={() => VOLVER}
    >
      <input type="hidden" name="id" value={faq?.id ?? ""} />
      <div className="bg-card flex flex-col gap-4 rounded-xl border p-4">
        <Campo nombre="pregunta" etiqueta="Pregunta">
          {(p) => <input {...p} defaultValue={faq?.pregunta ?? ""} />}
        </Campo>
        <Campo
          nombre="respuesta"
          etiqueta="Respuesta"
          ayuda="Si hablas del horario, revisa que coincida con el de Configuración."
        >
          {(p) => <textarea {...p} rows={5} defaultValue={faq?.respuesta ?? ""} />}
        </Campo>
        <Interruptor
          nombre="publicado"
          etiqueta="Publicada"
          ayuda="Se ve en Preguntas frecuentes"
          marcado={faq ? faq.estado === "publicado" : true}
        />
      </div>
      <BarraGuardar volver={VOLVER} />
    </FormularioPanel>
  );
}
```

> La ayuda sobre el horario viene de 0018: la respuesta del horario repite las horas como texto
> libre, y si el negocio cambia el horario en Configuración (T7) esta respuesta no se entera.

- [ ] `src/app/(admin)/admin/contenido/preguntas/page.tsx`:

```tsx
import { Plus } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";

import { BotonesOrden } from "@/components/panel/botones-orden";
import { ConfirmarBorrado } from "@/components/panel/confirmar-borrado";
import { EncabezadoPanel } from "@/components/panel/encabezado-panel";
import { EtiquetaEstado } from "@/components/panel/etiqueta-estado";
import { ListaAdaptable } from "@/components/panel/lista-adaptable";
import { borrarFaq } from "@/lib/acciones/contenido";
import { moverFila } from "@/lib/acciones/orden";
import { exigirAcceso } from "@/lib/auth/sesion";
import { crearClienteServidor } from "@/lib/supabase/servidor";

const RUTA = "/admin/contenido/preguntas";

export default function Preguntas() {
  return (
    <>
      <EncabezadoPanel
        titulo="Preguntas frecuentes"
        volver={{ ruta: "/admin/contenido", nombre: "Contenido" }}
        accion={
          <Link href={`${RUTA}/nueva`} className="boton-cta">
            <Plus aria-hidden className="size-5" /> Nueva pregunta
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
    .from("faqs")
    .select("id, pregunta, estado")
    .is("deleted_at", null)
    .order("orden")
    .order("id");
  if (error) return <p role="alert">No se pudieron cargar las preguntas. Recarga la página.</p>;

  return (
    <ListaAdaptable
      etiqueta="Preguntas frecuentes"
      filas={data}
      enlace={(f) => `${RUTA}/${f.id}`}
      columnas={[
        { titulo: "Pregunta", celda: (f) => f.pregunta, principal: true },
        { titulo: "Estado", celda: (f) => <EtiquetaEstado estado={f.estado} /> },
      ]}
      acciones={(f) => (
        <>
          <BotonesOrden
            nombre={`la pregunta ${f.pregunta}`}
            subir={moverFila.bind(null, "faqs", f.id, "arriba")}
            bajar={moverFila.bind(null, "faqs", f.id, "abajo")}
            primero={f.id === data[0]?.id}
            ultimo={f.id === data.at(-1)?.id}
          />
          <ConfirmarBorrado
            nombre={`la pregunta «${f.pregunta}»`}
            accion={borrarFaq.bind(null, f.id)}
          />
        </>
      )}
      vacio={<p>No hay preguntas. Añade la primera con «Nueva pregunta».</p>}
    />
  );
}
```

- [ ] `src/app/(admin)/admin/contenido/preguntas/nueva/page.tsx`:

```tsx
import { EncabezadoPanel } from "@/components/panel/encabezado-panel";

import { FormularioFaq } from "../formulario";

export default function NuevaPregunta() {
  return (
    <>
      <EncabezadoPanel
        titulo="Nueva pregunta"
        volver={{ ruta: "/admin/contenido/preguntas", nombre: "Preguntas frecuentes" }}
      />
      <FormularioFaq faq={null} />
    </>
  );
}
```

- [ ] `src/app/(admin)/admin/contenido/preguntas/[id]/page.tsx`:

```tsx
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { EncabezadoPanel } from "@/components/panel/encabezado-panel";
import { exigirAcceso } from "@/lib/auth/sesion";
import { crearClienteServidor } from "@/lib/supabase/servidor";

import { FormularioFaq } from "../formulario";

type Params = PageProps<"/admin/contenido/preguntas/[id]">["params"];

export default function EditarPregunta({ params }: PageProps<"/admin/contenido/preguntas/[id]">) {
  return (
    <Suspense fallback={<p className="text-muted-foreground text-sm">Cargando…</p>}>
      <Editor params={params} />
    </Suspense>
  );
}

async function Editor({ params }: { params: Params }) {
  const { id } = await params;
  await exigirAcceso("/admin/contenido/preguntas");
  const supabase = await crearClienteServidor();
  const { data } = await supabase
    .from("faqs")
    .select("id, pregunta, respuesta, estado")
    .eq("id", id)
    .is("deleted_at", null)
    .maybeSingle();
  if (!data) notFound();
  return (
    <>
      <EncabezadoPanel
        titulo="Editar pregunta"
        volver={{ ruta: "/admin/contenido/preguntas", nombre: "Preguntas frecuentes" }}
      />
      <FormularioFaq faq={data} />
    </>
  );
}
```

#### Guías (`/admin/contenido/guias`)

- [ ] `src/app/(admin)/admin/contenido/guias/formulario.tsx`:

```tsx
"use client";

import { BarraGuardar } from "@/components/panel/barra-guardar";
import { Campo, Interruptor } from "@/components/panel/campo";
import { FormularioPanel } from "@/components/panel/formulario-panel";
import { guardarGuia } from "@/lib/acciones/contenido";
import { claveDeBorrador } from "@/lib/panel/borrador";
import { validarGuia } from "@/lib/validaciones/contenido";

export type GuiaEditable = {
  id: string;
  titulo: string;
  resumen: string | null;
  contenido: string;
  estado: string;
};

const VOLVER = "/admin/contenido/guias";

export function FormularioGuia({ guia }: { guia: GuiaEditable | null }) {
  return (
    <FormularioPanel
      clave={claveDeBorrador("guia", guia?.id ?? null)}
      accion={guardarGuia}
      validar={validarGuia}
      destino={() => VOLVER}
    >
      <input type="hidden" name="id" value={guia?.id ?? ""} />
      <div className="bg-card flex flex-col gap-4 rounded-xl border p-4">
        <Campo nombre="titulo" etiqueta="Título">
          {(p) => <input {...p} defaultValue={guia?.titulo ?? ""} />}
        </Campo>
        <Campo nombre="resumen" etiqueta="Resumen" opcional>
          {(p) => <input {...p} defaultValue={guia?.resumen ?? ""} />}
        </Campo>
        <Campo nombre="contenido" etiqueta="Pasos" ayuda="Un paso por línea.">
          {(p) => <textarea {...p} rows={8} defaultValue={guia?.contenido ?? ""} />}
        </Campo>
        <Interruptor
          nombre="publicado"
          etiqueta="Publicada"
          ayuda="Se ve en Preguntas frecuentes"
          marcado={guia ? guia.estado === "publicado" : false}
        />
      </div>
      <BarraGuardar volver={VOLVER} />
    </FormularioPanel>
  );
}
```

> «Un paso por línea» solo es cierto si la página pública parte el contenido por saltos de línea.
> Comprobarlo en `src/app/(public)/preguntas-frecuentes/page.tsx`; si pinta el texto de corrido,
> quitar esa ayuda.

- [ ] `src/app/(admin)/admin/contenido/guias/page.tsx`:

```tsx
import { Plus } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";

import { BotonesOrden } from "@/components/panel/botones-orden";
import { ConfirmarBorrado } from "@/components/panel/confirmar-borrado";
import { EncabezadoPanel } from "@/components/panel/encabezado-panel";
import { EtiquetaEstado } from "@/components/panel/etiqueta-estado";
import { ListaAdaptable } from "@/components/panel/lista-adaptable";
import { borrarGuia } from "@/lib/acciones/contenido";
import { moverFila } from "@/lib/acciones/orden";
import { exigirAcceso } from "@/lib/auth/sesion";
import { crearClienteServidor } from "@/lib/supabase/servidor";

const RUTA = "/admin/contenido/guias";

export default function Guias() {
  return (
    <>
      <EncabezadoPanel
        titulo="Guías"
        descripcion="«Cómo hacer un pedido», «Cómo hacer un reclamo». Salen en Preguntas frecuentes."
        volver={{ ruta: "/admin/contenido", nombre: "Contenido" }}
        accion={
          <Link href={`${RUTA}/nueva`} className="boton-cta">
            <Plus aria-hidden className="size-5" /> Nueva guía
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
    .from("guias")
    .select("id, titulo, estado")
    .is("deleted_at", null)
    .order("orden")
    .order("id");
  if (error) return <p role="alert">No se pudieron cargar las guías. Recarga la página.</p>;

  return (
    <ListaAdaptable
      etiqueta="Guías"
      filas={data}
      enlace={(g) => `${RUTA}/${g.id}`}
      columnas={[
        { titulo: "Título", celda: (g) => g.titulo, principal: true },
        { titulo: "Estado", celda: (g) => <EtiquetaEstado estado={g.estado} /> },
      ]}
      acciones={(g) => (
        <>
          <BotonesOrden
            nombre={`la guía ${g.titulo}`}
            subir={moverFila.bind(null, "guias", g.id, "arriba")}
            bajar={moverFila.bind(null, "guias", g.id, "abajo")}
            primero={g.id === data[0]?.id}
            ultimo={g.id === data.at(-1)?.id}
          />
          <ConfirmarBorrado nombre={`la guía ${g.titulo}`} accion={borrarGuia.bind(null, g.id)} />
        </>
      )}
      vacio={<p>No hay guías. Añade la primera con «Nueva guía».</p>}
    />
  );
}
```

- [ ] `src/app/(admin)/admin/contenido/guias/nueva/page.tsx`:

```tsx
import { EncabezadoPanel } from "@/components/panel/encabezado-panel";

import { FormularioGuia } from "../formulario";

export default function NuevaGuia() {
  return (
    <>
      <EncabezadoPanel
        titulo="Nueva guía"
        volver={{ ruta: "/admin/contenido/guias", nombre: "Guías" }}
      />
      <FormularioGuia guia={null} />
    </>
  );
}
```

- [ ] `src/app/(admin)/admin/contenido/guias/[id]/page.tsx`:

```tsx
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { EncabezadoPanel } from "@/components/panel/encabezado-panel";
import { exigirAcceso } from "@/lib/auth/sesion";
import { crearClienteServidor } from "@/lib/supabase/servidor";

import { FormularioGuia } from "../formulario";

type Params = PageProps<"/admin/contenido/guias/[id]">["params"];

export default function EditarGuia({ params }: PageProps<"/admin/contenido/guias/[id]">) {
  return (
    <Suspense fallback={<p className="text-muted-foreground text-sm">Cargando…</p>}>
      <Editor params={params} />
    </Suspense>
  );
}

async function Editor({ params }: { params: Params }) {
  const { id } = await params;
  await exigirAcceso("/admin/contenido/guias");
  const supabase = await crearClienteServidor();
  const { data } = await supabase
    .from("guias")
    .select("id, titulo, resumen, contenido, estado")
    .eq("id", id)
    .is("deleted_at", null)
    .maybeSingle();
  if (!data) notFound();
  return (
    <>
      <EncabezadoPanel
        titulo={data.titulo}
        volver={{ ruta: "/admin/contenido/guias", nombre: "Guías" }}
      />
      <FormularioGuia guia={data} />
    </>
  );
}
```

#### Testimonios (`/admin/contenido/testimonios`)

- [ ] `src/app/(admin)/admin/contenido/testimonios/formulario.tsx`:

```tsx
"use client";

import { BarraGuardar } from "@/components/panel/barra-guardar";
import { Campo, Interruptor } from "@/components/panel/campo";
import { FormularioPanel } from "@/components/panel/formulario-panel";
import { guardarTestimonio } from "@/lib/acciones/contenido";
import { claveDeBorrador } from "@/lib/panel/borrador";
import { validarTestimonio } from "@/lib/validaciones/contenido";

export type TestimonioEditable = {
  id: string;
  nombre: string;
  texto: string;
  procedencia: string | null;
  estado: string;
  es_demo: boolean;
};

const VOLVER = "/admin/contenido/testimonios";

export function FormularioTestimonio({ testimonio }: { testimonio: TestimonioEditable | null }) {
  return (
    <FormularioPanel
      clave={claveDeBorrador("testimonio", testimonio?.id ?? null)}
      accion={guardarTestimonio}
      validar={validarTestimonio}
      destino={() => VOLVER}
    >
      {testimonio?.es_demo ? (
        <p role="note" className="bg-alerta/15 rounded-xl p-4">
          Este testimonio es <strong>de ejemplo</strong> y nunca se publica, aunque lo marques. Un
          testimonio inventado es una reseña falsa. Bórralo cuando tengas uno real.
        </p>
      ) : null}
      <input type="hidden" name="id" value={testimonio?.id ?? ""} />
      <div className="bg-card flex flex-col gap-4 rounded-xl border p-4">
        <Campo
          nombre="nombre"
          etiqueta="Nombre de quien lo dice"
          ayuda="Pide permiso antes de publicar su nombre."
        >
          {(p) => <input {...p} defaultValue={testimonio?.nombre ?? ""} />}
        </Campo>
        <Campo nombre="procedencia" etiqueta="De dónde es" opcional>
          {(p) => <input {...p} defaultValue={testimonio?.procedencia ?? ""} placeholder="Belén" />}
        </Campo>
        <Campo nombre="texto" etiqueta="Lo que dijo">
          {(p) => <textarea {...p} rows={4} defaultValue={testimonio?.texto ?? ""} />}
        </Campo>
        <Interruptor
          nombre="publicado"
          etiqueta="Publicado"
          ayuda="Se ve en la portada"
          marcado={testimonio ? testimonio.estado === "publicado" : false}
        />
      </div>
      <BarraGuardar volver={VOLVER} />
    </FormularioPanel>
  );
}
```

- [ ] `src/app/(admin)/admin/contenido/testimonios/page.tsx`:

```tsx
import { Plus } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";

import { BotonesOrden } from "@/components/panel/botones-orden";
import { ConfirmarBorrado } from "@/components/panel/confirmar-borrado";
import { EncabezadoPanel } from "@/components/panel/encabezado-panel";
import { EtiquetaEstado } from "@/components/panel/etiqueta-estado";
import { ListaAdaptable } from "@/components/panel/lista-adaptable";
import { borrarTestimonio } from "@/lib/acciones/contenido";
import { moverFila } from "@/lib/acciones/orden";
import { exigirAcceso } from "@/lib/auth/sesion";
import { crearClienteServidor } from "@/lib/supabase/servidor";

const RUTA = "/admin/contenido/testimonios";

export default function Testimonios() {
  return (
    <>
      <EncabezadoPanel
        titulo="Testimonios"
        volver={{ ruta: "/admin/contenido", nombre: "Contenido" }}
        accion={
          <Link href={`${RUTA}/nueva`} className="boton-cta">
            <Plus aria-hidden className="size-5" /> Nuevo testimonio
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
    .from("testimonios")
    .select("id, nombre, texto, estado, es_demo")
    .is("deleted_at", null)
    .order("orden")
    .order("id");
  if (error) return <p role="alert">No se pudieron cargar los testimonios. Recarga la página.</p>;

  return (
    <ListaAdaptable
      etiqueta="Testimonios"
      filas={data}
      enlace={(t) => `${RUTA}/${t.id}`}
      columnas={[
        { titulo: "Nombre", celda: (t) => t.nombre, principal: true },
        {
          titulo: "Dice",
          celda: (t) => (t.texto.length > 60 ? `${t.texto.slice(0, 60)}…` : t.texto),
        },
        {
          titulo: "Estado",
          celda: (t) =>
            t.es_demo ? (
              <span className="bg-muted rounded-full px-2.5 py-0.5 text-xs font-semibold">
                De ejemplo
              </span>
            ) : (
              <EtiquetaEstado estado={t.estado} />
            ),
        },
      ]}
      acciones={(t) => (
        <>
          <BotonesOrden
            nombre={`el testimonio de ${t.nombre}`}
            subir={moverFila.bind(null, "testimonios", t.id, "arriba")}
            bajar={moverFila.bind(null, "testimonios", t.id, "abajo")}
            primero={t.id === data[0]?.id}
            ultimo={t.id === data.at(-1)?.id}
          />
          <ConfirmarBorrado
            nombre={`el testimonio de ${t.nombre}`}
            accion={borrarTestimonio.bind(null, t.id)}
          />
        </>
      )}
      vacio={<p>No hay testimonios. Sin ninguno, la portada no muestra esa sección.</p>}
    />
  );
}
```

- [ ] `src/app/(admin)/admin/contenido/testimonios/nueva/page.tsx`:

```tsx
import { EncabezadoPanel } from "@/components/panel/encabezado-panel";

import { FormularioTestimonio } from "../formulario";

export default function NuevoTestimonio() {
  return (
    <>
      <EncabezadoPanel
        titulo="Nuevo testimonio"
        volver={{ ruta: "/admin/contenido/testimonios", nombre: "Testimonios" }}
      />
      <FormularioTestimonio testimonio={null} />
    </>
  );
}
```

- [ ] `src/app/(admin)/admin/contenido/testimonios/[id]/page.tsx`:

```tsx
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { EncabezadoPanel } from "@/components/panel/encabezado-panel";
import { exigirAcceso } from "@/lib/auth/sesion";
import { crearClienteServidor } from "@/lib/supabase/servidor";

import { FormularioTestimonio } from "../formulario";

type Params = PageProps<"/admin/contenido/testimonios/[id]">["params"];

export default function EditarTestimonio({
  params,
}: PageProps<"/admin/contenido/testimonios/[id]">) {
  return (
    <Suspense fallback={<p className="text-muted-foreground text-sm">Cargando…</p>}>
      <Editor params={params} />
    </Suspense>
  );
}

async function Editor({ params }: { params: Params }) {
  const { id } = await params;
  await exigirAcceso("/admin/contenido/testimonios");
  const supabase = await crearClienteServidor();
  const { data } = await supabase
    .from("testimonios")
    .select("id, nombre, texto, procedencia, estado, es_demo")
    .eq("id", id)
    .is("deleted_at", null)
    .maybeSingle();
  if (!data) notFound();
  return (
    <>
      <EncabezadoPanel
        titulo={`Testimonio de ${data.nombre}`}
        volver={{ ruta: "/admin/contenido/testimonios", nombre: "Testimonios" }}
      />
      <FormularioTestimonio testimonio={data} />
    </>
  );
}
```

- [ ] Completar `CONSTRUIDAS` con las ocho rutas de `SUBSECCIONES_DE_CONTENIDO` (ya están todas
      construidas) y **quitar la lista `CONSTRUIDAS`**: el índice vuelve a pintar
      `SUBSECCIONES_DE_CONTENIDO` entero.
- [ ] Añadir a `RUTAS_DEL_PANEL` las cinco listas y sus cinco páginas `nueva`.
- [ ] `pnpm typecheck && pnpm lint && pnpm build`.
- [ ] Commit: `feat(contenido): pantallas de portada, galería, preguntas, guías y testimonios`

### Paso 6 — Una ida y vuelta por pantalla

- [ ] Escribir `e2e/panel-contenido.spec.ts`:

```ts
import { expect, test } from "@playwright/test";

import { borrarDeLaBase } from "./ayudas/base";
import { fotoDePrueba } from "./ayudas/foto";
import { entrarComo } from "./ayudas/sesion";
import { borrarUsuario } from "./ayudas/usuarios";

const unico = () => `${Date.now()}${Math.random().toString(36).slice(2, 6)}`;

test("una pregunta nueva se publica y sale en Preguntas frecuentes", async ({ page }) => {
  const usuario = await entrarComo(page, "ingeniero");
  const pregunta = `¿Prueba E2E ${unico()}?`;
  try {
    await page.goto("/admin/contenido/preguntas/nueva");
    await page.getByLabel("Pregunta").fill(pregunta);
    await page.getByLabel("Respuesta").fill("Sí, esto es una prueba.");
    await page.getByRole("button", { name: "Guardar" }).click();
    await expect(page.getByText("Guardado. Ya se ve en el sitio.")).toBeVisible();

    await page.goto("/preguntas-frecuentes");
    await expect(page.getByText(pregunta)).toBeVisible();
  } finally {
    await borrarDeLaBase("faqs", "pregunta", pregunta);
    await borrarUsuario(usuario.id);
  }
});

test("subir una pregunta la adelanta también en el sitio", async ({ page }) => {
  const usuario = await entrarComo(page, "administrador");
  const a = `¿Orden A ${unico()}?`;
  const b = `¿Orden B ${unico()}?`;
  try {
    for (const pregunta of [a, b]) {
      await page.goto("/admin/contenido/preguntas/nueva");
      await page.getByLabel("Pregunta").fill(pregunta);
      await page.getByLabel("Respuesta").fill("Prueba de orden.");
      await page.getByRole("button", { name: "Guardar" }).click();
      await expect(page).toHaveURL("/admin/contenido/preguntas");
    }

    // Las dos nacen con orden 0 y se desempatan por id, que es aleatorio: se
    // mira cuál quedó debajo y se sube esa.
    const enLista = async () => {
      const textos = await page.getByRole("link", { name: /¿Orden [AB] / }).allTextContents();
      return {
        a: textos.findIndex((t) => t.includes(a)),
        b: textos.findIndex((t) => t.includes(b)),
      };
    };
    const antes = await enLista();
    const deAbajo = antes.a > antes.b ? a : b;
    const deArriba = deAbajo === a ? b : a;

    const subir = page.getByRole("button", { name: `Subir la pregunta ${deAbajo}` }).first();
    await subir.click();
    await expect(page.getByText("Orden cambiado.")).toBeVisible();

    await page.goto("/preguntas-frecuentes");
    const enSitio = await page.getByText(/¿Orden [AB] /).allTextContents();
    expect(enSitio.findIndex((t) => t.includes(deAbajo))).toBeLessThan(
      enSitio.findIndex((t) => t.includes(deArriba)),
    );
  } finally {
    await borrarDeLaBase("faqs", "pregunta", a);
    await borrarDeLaBase("faqs", "pregunta", b);
    await borrarUsuario(usuario.id);
  }
});

test("una foto nueva de galería se sube al bucket galeria y sale en la galería", async ({
  page,
  request,
}) => {
  const usuario = await entrarComo(page, "administrador");
  const alt = `Foto E2E ${unico()}`;
  try {
    await page.goto("/admin/contenido/galeria/nueva");
    await page.getByLabel("Elegir de la galería").setInputFiles(await fotoDePrueba(page));
    await expect(page.locator("[data-vista-previa]")).toHaveAttribute(
      "src",
      /\/galeria\/panel\/.+\.webp$/,
    );
    const src = await page.locator("[data-vista-previa]").getAttribute("src");
    expect((await request.get(src ?? "")).status()).toBe(200);

    await page.getByLabel("Qué se ve en la foto").fill(alt);
    await page.getByLabel("De qué es").selectOption("interior");
    await page.getByRole("button", { name: "Guardar" }).click();
    await expect(page.getByText("Guardado. Ya se ve en el sitio.")).toBeVisible();

    await page.goto("/galeria");
    await expect(page.getByRole("img", { name: alt })).toBeVisible();
  } finally {
    await borrarDeLaBase("galeria", "alt", alt);
    await borrarUsuario(usuario.id);
  }
});

test("un slide con enlace pero sin texto de botón se marca en su pestaña", async ({ page }) => {
  const usuario = await entrarComo(page, "administrador");
  try {
    await page.goto("/admin/contenido/portada/nueva");
    await page.getByLabel("Titular").fill("Slide incompleto");
    await page.getByRole("tab", { name: "Botón y fechas" }).click();
    await page.getByLabel("A dónde lleva").fill("/productos");
    await page.getByRole("tab", { name: "Texto" }).click();
    await page.getByRole("button", { name: "Guardar" }).click();

    await expect(page.getByRole("tab", { name: /Botón y fechas/ })).toHaveAttribute(
      "data-con-error",
      "true",
    );
    await expect(
      page.getByText("Si el slide lleva botón, escribe el texto y el enlace."),
    ).toBeVisible();
  } finally {
    await borrarUsuario(usuario.id);
  }
});

test("un testimonio nuevo se guarda sin publicar y no sale en la portada", async ({ page }) => {
  const usuario = await entrarComo(page, "administrador");
  const nombre = `Cliente E2E ${unico()}`;
  try {
    await page.goto("/admin/contenido/testimonios/nueva");
    await page.getByLabel("Nombre de quien lo dice").fill(nombre);
    await page.getByLabel("Lo que dijo").fill("El pan de las cuatro es el mejor.");
    await page.getByRole("button", { name: "Guardar" }).click();
    await expect(page.getByText("Guardado como borrador")).toBeVisible();

    await page.goto("/");
    await expect(page.getByText(nombre)).toHaveCount(0);
  } finally {
    await borrarDeLaBase("testimonios", "nombre", nombre);
    await borrarUsuario(usuario.id);
  }
});

test("una guía nueva queda en la lista con su estado", async ({ page }) => {
  const usuario = await entrarComo(page, "ingeniero");
  const titulo = `Guía E2E ${unico()}`;
  try {
    await page.goto("/admin/contenido/guias/nueva");
    await page.getByLabel("Título").fill(titulo);
    await page.getByLabel("Pasos").fill("Escríbenos.\nTe respondemos.");
    await page.getByRole("button", { name: "Guardar" }).click();
    await expect(page).toHaveURL("/admin/contenido/guias");
    await expect(page.getByRole("link", { name: titulo }).first()).toBeVisible();
  } finally {
    await borrarDeLaBase("guias", "titulo", titulo);
    await borrarUsuario(usuario.id);
  }
});
```

> Las preguntas de las semillas tienen `orden` 1–5 y las nuevas nacen con 0: el primer movimiento
> normaliza toda la tabla (paso 1), y la prueba solo compara las dos suyas entre sí.

- [ ] Liberar el puerto 3000; `pnpm test:e2e e2e/panel-contenido.spec.ts e2e/panel-accesibilidad.spec.ts`
      → PASS en los dos proyectos. Después la suite completa.
- [ ] Commit: `test(contenido): ida y vuelta de cada pantalla de contenido`
- [ ] PR `feat/f4-t5-contenido` → CI en verde → fusionar.

---

## Tarea 6 — Usuarios, contraseña temporal y el arreglo del rol superadmin

**Rama:** `feat/f4-t6-usuarios`

**Qué deja hecho:** el administrador da de alta a Marcos, Debra y los repartidores desde el panel.
El sistema genera una contraseña temporal que se ve **una sola vez**, y el primer ingreso obliga a
cambiarla. Desactivar, cambiar de rol, restablecer la contraseña y eliminar (solo superadmin). Y se
cierra el hueco de seguridad: hoy un administrador puede ponerse `rol = 'superadmin'`.

**Archivos:**

- Crear: `supabase/migrations/0029_perfiles_protegidos.sql`, `supabase/tests/0029_perfiles_protegidos.test.sql`
- Crear: `src/lib/supabase/administrador.ts`
- Crear: `src/lib/panel/clave-temporal.ts` + `.test.ts`
- Crear: `src/lib/validaciones/usuario.ts` + `.test.ts`, `src/lib/acciones/usuarios.ts`
- Crear: `src/app/(admin)/admin/usuarios/{page,formulario-usuario,clave-temporal,acciones-usuario}.tsx`,
  `.../usuarios/nuevo/page.tsx`, `.../usuarios/[id]/page.tsx`
- Crear: `src/app/(auth)/cambiar-clave/{page,formulario}.tsx`
- Modificar: `src/lib/supabase/proxy.ts`, `src/proxy.ts`, `src/lib/acciones/autenticacion.ts`
- Modificar: `playwright.config.ts` (la `service_role` local para el servidor de pruebas),
  `e2e/ayudas/usuarios.ts`, `RUTAS_DEL_PANEL`
- Crear: `e2e/panel-usuarios.spec.ts`

**Interfaces:**

- Consume (T1–T5): `ejecutarAccion`, `EstadoAccion` (con `extra`), `FormularioPanel` (con
  `alGuardar`), `Campo`, `BarraGuardar`, `ListaAdaptable`, `ConfirmarBorrado`, `EncabezadoPanel`,
  `claveDeBorrador`, `exigirAcceso`, `obtenerSesion`, `NOMBRE_DEL_ROL`, `ROLES`, `type Rol`,
  `entrarComo`, `crearUsuario`, `borrarUsuario`, `CLAVE_DE_PRUEBA`.
- Produce:
  - `crearClienteAdministrador()` (solo servidor)
  - `generarClaveTemporal(azar?: (n: number) => Uint32Array): string`
  - `rolesQuePuedeAsignar(rol: Rol): Rol[]`
  - `refrescarSesion()` devuelve además `debeCambiarClave: boolean`
  - `borrarUsuarioPorCorreo(correo: string): Promise<void>` en `e2e/ayudas/usuarios.ts`

### Paso 1 — La base protege los perfiles

La RLS decide **qué filas** puede tocar alguien, no **qué valor** escribe en una columna. La política
«administracion edita perfiles» deja al administrador editar cualquier perfil, así que puede poner
`rol = 'superadmin'` en el suyo. Un trigger cierra las cuatro cosas que la política no puede ver.

- [ ] Escribir `supabase/tests/0029_perfiles_protegidos.test.sql`:

```sql
-- Verifica la protección de perfiles (0029).
--
-- Lo que se defiende: que nadie escale a superadmin sin serlo, que nadie se
-- quite ni se cambie a sí mismo el acceso, y que eliminar sea solo del
-- superadmin (doc 03 §5.2). Sin sesión —migraciones, el alta desde el
-- servidor— todo sigue permitido.
begin;
select plan(10);

insert into auth.users (id, email, created_at, updated_at) values
  ('11111111-1111-1111-1111-111111111111', 'super@pimpos.test', now(), now()),
  ('22222222-2222-2222-2222-222222222222', 'admin@pimpos.test', now(), now()),
  ('33333333-3333-3333-3333-333333333333', 'inge@pimpos.test',  now(), now());
update public.perfiles set rol = 'superadmin',    activo = true where id = '11111111-1111-1111-1111-111111111111';
update public.perfiles set rol = 'administrador', activo = true where id = '22222222-2222-2222-2222-222222222222';
update public.perfiles set rol = 'ingeniero',     activo = true where id = '33333333-3333-3333-3333-333333333333';

select pass('sin sesión, los fixtures de arriba entraron: migraciones y altas del servidor siguen funcionando');

set local role authenticated;
set local request.jwt.claims = '{"sub": "22222222-2222-2222-2222-222222222222", "rol": "administrador"}';

select throws_ok(
  $$ update public.perfiles set rol = 'superadmin' where id = '22222222-2222-2222-2222-222222222222' $$,
  'P0001', null, 'el administrador no se da el rol superadmin a sí mismo'
);
select throws_ok(
  $$ update public.perfiles set rol = 'superadmin' where id = '33333333-3333-3333-3333-333333333333' $$,
  'P0001', 'Solo el super administrador puede dar o quitar ese rol.',
  'ni se lo da a otro'
);
select throws_ok(
  $$ update public.perfiles set activo = false where id = '22222222-2222-2222-2222-222222222222' $$,
  'P0001', 'No puedes cambiar tu propio rol ni darte de baja. Pídeselo a otro administrador.',
  'no se desactiva a sí mismo'
);
select throws_ok(
  $$ update public.perfiles set activo = false where id = '11111111-1111-1111-1111-111111111111' $$,
  'P0001', 'Solo el super administrador puede dar de baja a un super administrador.',
  'no desactiva al superadmin'
);
select throws_ok(
  $$ update public.perfiles set deleted_at = now() where id = '33333333-3333-3333-3333-333333333333' $$,
  'P0001', 'Solo el super administrador puede eliminar usuarios.',
  'no elimina a nadie: eso es del superadmin'
);
select lives_ok(
  $$ update public.perfiles set rol = 'repartidor', activo = false where id = '33333333-3333-3333-3333-333333333333' $$,
  'sí cambia el rol y desactiva a un ingeniero'
);

set local request.jwt.claims = '{"sub": "11111111-1111-1111-1111-111111111111", "rol": "superadmin"}';

select lives_ok(
  $$ update public.perfiles set rol = 'superadmin' where id = '22222222-2222-2222-2222-222222222222' $$,
  'el superadmin sí da el rol superadmin'
);
select throws_ok(
  $$ update public.perfiles set deleted_at = now() where id = '11111111-1111-1111-1111-111111111111' $$,
  'P0001', null, 'ni el superadmin se elimina a sí mismo'
);
select lives_ok(
  $$ update public.perfiles set deleted_at = now(), activo = false where id = '33333333-3333-3333-3333-333333333333' $$,
  'el superadmin elimina a otro usuario'
);

select * from finish();
rollback;
```

- [ ] `supabase test db` → FAIL.
- [ ] Escribir `supabase/migrations/0029_perfiles_protegidos.sql`:

```sql
-- =============================================================================
-- 0029_perfiles_protegidos.sql
-- Lo que la RLS de perfiles no puede ver (F4, tarea 6).
--
-- La política "administracion edita perfiles" (0003) decide QUÉ FILAS toca un
-- administrador: todas. No decide QUÉ VALOR escribe. Así que un administrador
-- podía ponerse rol = 'superadmin', desactivar al superadmin o eliminar
-- usuarios, que el doc 03 §5.2 reserva al superadmin. Nadie lo aprovechó
-- porque hasta F4 solo existía el superadmin; con el panel de usuarios dejaría
-- de ser teórico.
--
-- Sin sesión (auth.uid() null: migraciones, el trigger de alta de 0005, la
-- service_role) no se aplica: esas escrituras no las hace una persona.
-- =============================================================================

create or replace function app.proteger_perfiles()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_yo           uuid := auth.uid();
  v_soy_super    boolean := (select app.es_rol('superadmin'));
begin
  if v_yo is null then
    return coalesce(new, old);
  end if;

  if tg_op = 'DELETE' then
    if old.id = v_yo then
      raise exception 'No puedes eliminarte a ti mismo.';
    end if;
    return old;
  end if;

  if tg_op = 'INSERT' then
    if new.rol = 'superadmin' and not v_soy_super then
      raise exception 'Solo el super administrador puede dar o quitar ese rol.';
    end if;
    return new;
  end if;

  -- UPDATE
  if new.id = v_yo
     and (new.rol is distinct from old.rol
          or new.activo is distinct from old.activo
          or new.deleted_at is distinct from old.deleted_at) then
    raise exception 'No puedes cambiar tu propio rol ni darte de baja. Pídeselo a otro administrador.';
  end if;

  if new.rol is distinct from old.rol
     and 'superadmin' in (new.rol, old.rol)
     and not v_soy_super then
    raise exception 'Solo el super administrador puede dar o quitar ese rol.';
  end if;

  if new.deleted_at is distinct from old.deleted_at and not v_soy_super then
    raise exception 'Solo el super administrador puede eliminar usuarios.';
  end if;

  if old.rol = 'superadmin'
     and new.activo is distinct from old.activo
     and not v_soy_super then
    raise exception 'Solo el super administrador puede dar de baja a un super administrador.';
  end if;

  return new;
end;
$$;

comment on function app.proteger_perfiles() is
  'Trigger BEFORE en perfiles: nadie escala a superadmin sin serlo, nadie se cambia a sí mismo, solo superadmin elimina.';

create trigger perfiles_proteger
  before insert or update or delete on public.perfiles
  for each row execute function app.proteger_perfiles();
```

> El orden de las comprobaciones importa para el mensaje: el administrador que se pone superadmin
> a sí mismo recibe «No puedes cambiar tu propio rol…», por eso esa prueba no fija el texto.
>
> Comprobar que las pruebas de 0003 y 0005 siguen en verde: sus fixtures escriben perfiles **sin
> sesión** (antes del `set local role`), que es justo lo que el trigger deja pasar.

- [ ] `supabase db reset && bash supabase/seeds/imagenes/subir-imagenes.sh && supabase test db` → PASS.
- [ ] Commit: `fix(base): un administrador ya no puede darse el rol superadmin`

### Paso 2 — Contraseña temporal y reglas de usuario, lógica pura

- [ ] Escribir `src/lib/panel/clave-temporal.test.ts`:

```ts
import { describe, expect, it } from "vitest";

import { ALFABETO_CLAVE, generarClaveTemporal } from "./clave-temporal";

describe("generarClaveTemporal", () => {
  it("tiene 12 caracteres, al menos 10 que exige Auth", () => {
    expect(generarClaveTemporal()).toHaveLength(12);
  });

  it("no usa letras que se confunden al dictarlas o copiarlas a mano", () => {
    for (let i = 0; i < 200; i++) {
      expect(generarClaveTemporal()).not.toMatch(/[0O1lI]/);
    }
  });

  it("siempre lleva mayúscula, minúscula y número", () => {
    for (let i = 0; i < 200; i++) {
      const clave = generarClaveTemporal();
      expect(clave).toMatch(/[A-Z]/);
      expect(clave).toMatch(/[a-z]/);
      expect(clave).toMatch(/[2-9]/);
    }
  });

  it("solo usa su alfabeto", () => {
    const clave = generarClaveTemporal();
    expect([...clave].every((c) => ALFABETO_CLAVE.includes(c))).toBe(true);
  });

  it("con el mismo azar sale la misma clave (se puede probar sin suerte)", () => {
    const azar = (n: number) => Uint32Array.from({ length: n }, (_, i) => i * 7919);
    expect(generarClaveTemporal(azar)).toBe(generarClaveTemporal(azar));
  });
});
```

- [ ] Escribir `src/lib/validaciones/usuario.test.ts`:

```ts
import { describe, expect, it } from "vitest";

import { esquemaCambioClave, esquemaUsuario, rolesQuePuedeAsignar } from "./usuario";

describe("rolesQuePuedeAsignar", () => {
  it("el administrador no ofrece superadmin", () => {
    expect(rolesQuePuedeAsignar("administrador")).toEqual([
      "administrador",
      "ingeniero",
      "repartidor",
    ]);
  });

  it("el superadmin ofrece los cuatro", () => {
    expect(rolesQuePuedeAsignar("superadmin")).toHaveLength(4);
  });

  it("el resto no asigna ninguno", () => {
    expect(rolesQuePuedeAsignar("ingeniero")).toEqual([]);
  });
});

describe("esquemaUsuario", () => {
  it("un correo mal escrito dice qué revisar", () => {
    const r = esquemaUsuario.safeParse({
      id: null,
      nombre_completo: "Debra",
      correo: "debra@",
      celular: null,
      rol: "ingeniero",
    });
    expect(!r.success && r.error.issues[0]?.message).toBe(
      "Ese correo no parece válido. Revisa que esté bien escrito.",
    );
  });

  it("un celular peruano de 9 dígitos es válido, con o sin espacios", () => {
    const r = esquemaUsuario.safeParse({
      id: null,
      nombre_completo: "Marcos",
      correo: "m@pimpos.pe",
      celular: "987 654 321",
      rol: "administrador",
    });
    expect(r.success && r.data.celular).toBe("987654321");
  });
});

describe("esquemaCambioClave", () => {
  it("exige 10 caracteres", () => {
    const r = esquemaCambioClave.safeParse({ clave: "corta", repetir: "corta" });
    expect(!r.success && r.error.issues[0]?.message).toBe(
      "Tiene que tener al menos 10 caracteres.",
    );
  });

  it("las dos tienen que coincidir", () => {
    const r = esquemaCambioClave.safeParse({ clave: "unaclavelarga", repetir: "otraclavelarga" });
    expect(!r.success && r.error.issues[0]).toMatchObject({
      path: ["repetir"],
      message: "Las dos contraseñas no coinciden.",
    });
  });
});
```

- [ ] `pnpm test -- src/lib/panel/clave-temporal.test.ts src/lib/validaciones/usuario.test.ts` → FAIL.
- [ ] Escribir `src/lib/panel/clave-temporal.ts`:

```ts
/**
 * Contraseña temporal para dársela a alguien en persona o por WhatsApp
 * (decisión 6). Sin 0/O, 1/l/I: se lee de una pantalla y se escribe a mano en
 * otra. Con mayúscula, minúscula y número, por si el proyecto alojado exige
 * esos requisitos aunque el local no.
 */
export const ALFABETO_CLAVE = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";

const MAYUSCULAS = "ABCDEFGHJKMNPQRSTUVWXYZ";
const MINUSCULAS = "abcdefghijkmnpqrstuvwxyz";
const NUMEROS = "23456789";
const LARGO = 12;

type Azar = (n: number) => Uint32Array;
const azarSeguro: Azar = (n) => crypto.getRandomValues(new Uint32Array(n));

export function generarClaveTemporal(azar: Azar = azarSeguro): string {
  const valores = azar(LARGO + 3);
  const tomar = (alfabeto: string, i: number) => alfabeto[valores[i]! % alfabeto.length]!;

  const caracteres = Array.from({ length: LARGO }, (_, i) => tomar(ALFABETO_CLAVE, i));
  // Garantiza una de cada clase en posiciones que también salen del azar.
  caracteres[valores[LARGO]! % LARGO] = tomar(MAYUSCULAS, LARGO);
  const posMinuscula = (valores[LARGO + 1]! % (LARGO - 1)) + 1;
  caracteres[((valores[LARGO]! % LARGO) + posMinuscula) % LARGO] = tomar(MINUSCULAS, LARGO + 1);
  const posNumero = (valores[LARGO + 2]! % (LARGO - 2)) + 1;
  const ocupadas = new Set([
    valores[LARGO]! % LARGO,
    ((valores[LARGO]! % LARGO) + posMinuscula) % LARGO,
  ]);
  let destino = ((valores[LARGO]! % LARGO) + posNumero) % LARGO;
  while (ocupadas.has(destino)) destino = (destino + 1) % LARGO;
  caracteres[destino] = tomar(NUMEROS, LARGO + 2);

  return caracteres.join("");
}
```

> El `%` sobre un `Uint32` introduce un sesgo de menos de una parte en 70 millones con un alfabeto de
> 55 símbolos: irrelevante para una contraseña que caduca en el primer ingreso.

- [ ] Escribir `src/lib/validaciones/usuario.ts`:

```ts
import * as z from "zod";

import { ROLES, type Rol } from "@/lib/auth/roles";
import { texto, textoOpcional } from "@/lib/panel/formulario";

export function rolesQuePuedeAsignar(rol: Rol): Rol[] {
  if (rol === "superadmin") return [...ROLES];
  if (rol === "administrador") return ROLES.filter((r) => r !== "superadmin");
  return [];
}

export const esquemaUsuario = z.object({
  id: z.uuid().nullable(),
  nombre_completo: z.string().min(1, { error: "Escribe el nombre." }).max(80),
  correo: z
    .string()
    .min(1, { error: "Escribe el correo." })
    .pipe(z.email({ error: "Ese correo no parece válido. Revisa que esté bien escrito." })),
  celular: z
    .string()
    .transform((c) => c.replace(/\s+/g, ""))
    .pipe(z.string().regex(/^9\d{8}$/, { error: "El celular tiene 9 dígitos y empieza por 9." }))
    .nullable(),
  rol: z.enum(ROLES, { error: "Elige un rol." }),
});

export function leerUsuario(fd: FormData) {
  return {
    id: textoOpcional(fd, "id"),
    nombre_completo: texto(fd, "nombre_completo"),
    correo: texto(fd, "correo").toLowerCase(),
    celular: textoOpcional(fd, "celular"),
    rol: texto(fd, "rol"),
  };
}

export function validarUsuario(fd: FormData) {
  const r = esquemaUsuario.safeParse(leerUsuario(fd));
  return r.success
    ? {}
    : (z.flattenError(r.error).fieldErrors as Record<string, string[] | undefined>);
}

export const esquemaCambioClave = z
  .object({
    clave: z.string().min(10, { error: "Tiene que tener al menos 10 caracteres." }),
    repetir: z.string(),
  })
  .refine((d) => d.clave === d.repetir, {
    path: ["repetir"],
    error: "Las dos contraseñas no coinciden.",
  });

export function leerCambioClave(fd: FormData) {
  return { clave: String(fd.get("clave") ?? ""), repetir: String(fd.get("repetir") ?? "") };
}

export function validarCambioClave(fd: FormData) {
  const r = esquemaCambioClave.safeParse(leerCambioClave(fd));
  return r.success
    ? {}
    : (z.flattenError(r.error).fieldErrors as Record<string, string[] | undefined>);
}
```

> Al editar un usuario el correo se muestra pero no se cambia (cambiarlo exige confirmar el nuevo
> por correo, y sin SMTP propio no llega). El formulario de edición lo manda igual en un campo de
> solo lectura para que el esquema sea uno.

- [ ] `pnpm test -- src/lib/panel/clave-temporal.test.ts src/lib/validaciones/usuario.test.ts` → PASS.

### Paso 3 — El cliente con `service_role`, encerrado

- [ ] Escribir `src/lib/supabase/administrador.ts`:

```ts
import "server-only";

import { createClient } from "@supabase/supabase-js";

import type { Database } from "@/tipos/database.types";

import { urlDeSupabase } from "./entorno";

/**
 * Cliente con la `service_role`: SALTA TODA LA RLS.
 *
 * Solo existe para lo que la API de Auth no deja hacer con la sesión de una
 * persona: crear cuentas, poner su contraseña temporal, marcarlas para cambio
 * de contraseña y bloquearlas. Todo lo que se pueda hacer con el JWT del
 * usuario (rol, nombre, activo) se hace con `crearClienteServidor()`, para que
 * decidan la RLS y el trigger de 0029.
 *
 * `import "server-only"` hace fallar el build si un componente de cliente lo
 * importa, aunque sea de rebote: la llave no llega nunca a un navegador.
 * La variable NO lleva `NEXT_PUBLIC_`, así que Next tampoco la incrustaría.
 */
export function crearClienteAdministrador() {
  const llave = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!llave) {
    throw new Error(
      "Falta SUPABASE_SERVICE_ROLE_KEY. En local sale de `supabase status`; en Vercel, de " +
        "Supabase → Project Settings → API Keys (service_role). Nunca con NEXT_PUBLIC_.",
    );
  }
  return createClient<Database>(urlDeSupabase(), llave, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
```

- [ ] En `playwright.config.ts`, añadir al `env` del `webServer`:
      `SUPABASE_SERVICE_ROLE_KEY: serviceRoleKey,` (desestructurando `serviceRoleKey` de
      `supabaseLocal()` junto a `apiUrl` y `anonKey`). Es la llave del entorno local, pública y fija.
- [ ] Añadir `SUPABASE_SERVICE_ROLE_KEY` a `.env.local` con el valor de `supabase status`.

### Paso 4 — Primer ingreso: el proxy manda a cambiar la contraseña

- [ ] En `src/lib/supabase/proxy.ts`, ampliar lo que devuelve `refrescarSesion`:

```ts
export async function refrescarSesion(peticion: NextRequest): Promise<{
  respuesta: NextResponse;
  rol: Rol | null;
  haySesion: boolean;
  debeCambiarClave: boolean;
}> {
  // ... igual que antes hasta `const rol = ...`

  // Lo pone la acción de alta (T6) en `app_metadata`, que solo escribe la
  // service_role: el usuario no se lo puede quitar editando su propio perfil.
  const metadatos = claims?.app_metadata as Record<string, unknown> | undefined;
  const debeCambiarClave = metadatos?.debe_cambiar_clave === true;

  return { respuesta, rol, haySesion: claims !== null, debeCambiarClave };
}
```

- [ ] En `src/proxy.ts`, justo después de leer la sesión:

```ts
const { respuesta, rol, haySesion, debeCambiarClave } = await refrescarSesion(peticion);
const ruta = peticion.nextUrl.pathname;

if (ruta === "/cambiar-clave") {
  return haySesion ? respuesta : NextResponse.redirect(new URL("/ingresar", peticion.url));
}

// Con contraseña temporal no se entra a nada del panel hasta cambiarla.
if (debeCambiarClave && esRutaDelPanel(ruta)) {
  return NextResponse.redirect(new URL("/cambiar-clave", peticion.url));
}
```

- [ ] En `src/lib/acciones/autenticacion.ts`, dentro de `iniciarSesion`, después de comprobar el rol
      y antes de calcular `destino`:

```ts
const metadatos = data?.claims?.app_metadata as Record<string, unknown> | undefined;
if (metadatos?.debe_cambiar_clave === true) {
  redirect("/cambiar-clave");
}
```

- [ ] Escribir `src/app/(auth)/cambiar-clave/formulario.tsx`:

```tsx
"use client";

import { Campo } from "@/components/panel/campo";
import { FormularioPanel } from "@/components/panel/formulario-panel";
import { cambiarMiClave } from "@/lib/acciones/usuarios";
import { validarCambioClave } from "@/lib/validaciones/usuario";

/** Los dos campos son `password`: `FormularioPanel` no los copia al navegador. */
export function FormularioCambioClave() {
  return (
    <FormularioPanel
      clave="pimpos:sin-borrador"
      accion={cambiarMiClave}
      validar={validarCambioClave}
      destino={() => "/admin"}
    >
      <Campo
        nombre="clave"
        etiqueta="Contraseña nueva"
        ayuda="Al menos 10 caracteres. Que no sea la temporal."
      >
        {(p) => <input {...p} type="password" autoComplete="new-password" />}
      </Campo>
      <Campo nombre="repetir" etiqueta="Repítela">
        {(p) => <input {...p} type="password" autoComplete="new-password" />}
      </Campo>
      <button type="submit" className="boton-cta">
        Guardar y entrar
      </button>
    </FormularioPanel>
  );
}
```

> `FormularioPanel` (T2) ya deja fuera de la copia local todo `input[type=password]`; la prueba del
> paso 7 lo comprueba mirando `localStorage`.

- [ ] Escribir `src/app/(auth)/cambiar-clave/page.tsx`:

```tsx
import type { Metadata } from "next";

import { FormularioCambioClave } from "./formulario";

export const metadata: Metadata = {
  title: "Cambia tu contraseña",
  robots: { index: false, follow: false },
};

export default function CambiarClave() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-sm flex-col justify-center gap-6 px-4 py-10">
      <div>
        <h1 className="font-heading text-primary text-3xl">Cambia tu contraseña</h1>
        <p className="text-muted-foreground mt-2">
          Entraste con una contraseña temporal. Elige una tuya para seguir; la temporal deja de
          servir.
        </p>
      </div>
      <FormularioCambioClave />
    </main>
  );
}
```

> `FormularioPanel` usa `toast` de sonner, y el `<Toaster>` vive en la cáscara del panel, que no
> envuelve a `(auth)`. Añadir `<Toaster position="top-center" richColors />` al final del `<main>`.

### Paso 5 — Acciones de usuarios

- [ ] Escribir `src/lib/acciones/usuarios.ts`:

```ts
"use server";

import * as z from "zod";

import { exigirAcceso } from "@/lib/auth/sesion";
import { ejecutarAccion, type EstadoAccion } from "@/lib/panel/accion";
import { generarClaveTemporal } from "@/lib/panel/clave-temporal";
import { crearClienteAdministrador } from "@/lib/supabase/administrador";
import { crearClienteServidor } from "@/lib/supabase/servidor";
import {
  esquemaCambioClave,
  esquemaUsuario,
  leerCambioClave,
  leerUsuario,
  rolesQuePuedeAsignar,
} from "@/lib/validaciones/usuario";

const RUTA = "/admin/usuarios";
/** «Para siempre» en la API de Auth. Desbloquear es `"none"`. */
const BLOQUEO = "876000h";

const sinPermiso = (message: string) => ({ error: { code: "P0001", message } });

export async function crearUsuarioDelPanel(fd: FormData): Promise<EstadoAccion> {
  return ejecutarAccion({
    ruta: RUTA,
    esquema: esquemaUsuario,
    entrada: leerUsuario(fd),
    entidad: "un usuario",
    etiquetas: [],
    mensajeOk: "Cuenta creada.",
    hacer: async (d, { supabase, sesion }) => {
      if (!rolesQuePuedeAsignar(sesion.rol).includes(d.rol)) {
        return sinPermiso("Tu rol no puede crear cuentas con ese rol.");
      }

      const clave = generarClaveTemporal();
      const admin = crearClienteAdministrador();
      const { data: alta, error: errorAlta } = await admin.auth.admin.createUser({
        email: d.correo,
        password: clave,
        email_confirm: true,
        app_metadata: { debe_cambiar_clave: true },
        user_metadata: { nombre_completo: d.nombre_completo },
      });
      if (errorAlta || !alta.user) {
        return errorAlta?.code === "email_exists"
          ? sinPermiso("Ya hay una cuenta con ese correo.")
          : { error: { code: errorAlta?.code, message: errorAlta?.message ?? "sin usuario" } };
      }

      // El rol lo pone la sesión de quien crea, no la service_role: así deciden
      // la RLS y el trigger de 0029 (un administrador no crea superadmins).
      const { error } = await supabase
        .from("perfiles")
        .update({
          rol: d.rol,
          nombre_completo: d.nombre_completo,
          celular: d.celular,
          activo: true,
        })
        .eq("id", alta.user.id)
        .select("id")
        .single();
      if (error) {
        await admin.auth.admin.deleteUser(alta.user.id);
        return { error };
      }

      return { error: null, id: alta.user.id, extra: { clave, correo: d.correo } };
    },
  });
}

export async function guardarUsuario(fd: FormData): Promise<EstadoAccion> {
  return ejecutarAccion({
    ruta: RUTA,
    esquema: esquemaUsuario.extend({ id: z.uuid() }),
    entrada: leerUsuario(fd),
    entidad: "el usuario",
    etiquetas: [],
    mensajeOk:
      "Cambios guardados. El rol nuevo vale desde su próximo ingreso o en menos de una hora.",
    hacer: async (d, { supabase }) => {
      const { error } = await supabase
        .from("perfiles")
        .update({ nombre_completo: d.nombre_completo, celular: d.celular, rol: d.rol })
        .eq("id", d.id)
        .select("id")
        .single();
      return { error, id: d.id };
    },
  });
}

export async function cambiarActivo(id: string, activo: boolean): Promise<EstadoAccion> {
  return ejecutarAccion({
    ruta: RUTA,
    esquema: z.object({ id: z.uuid(), activo: z.boolean() }),
    entrada: { id, activo },
    entidad: "el usuario",
    etiquetas: [],
    mensajeOk: activo ? "Cuenta reactivada." : "Cuenta desactivada. Ya no puede entrar.",
    hacer: async (d, { supabase }) => {
      const { error } = await supabase
        .from("perfiles")
        .update({ activo: d.activo })
        .eq("id", d.id)
        .select("id")
        .single();
      if (error) return { error };
      // Bloquear impide renovar la sesión. Lo que ya tiene abierto dura como
      // mucho lo que dura un token (jwt_expiry = 1 hora): ver la nota del paso.
      const { error: errorBloqueo } = await crearClienteAdministrador().auth.admin.updateUserById(
        d.id,
        {
          ban_duration: d.activo ? "none" : BLOQUEO,
        },
      );
      return {
        error: errorBloqueo ? { code: errorBloqueo.code, message: errorBloqueo.message } : null,
      };
    },
  });
}

export async function restablecerClave(id: string): Promise<EstadoAccion> {
  return ejecutarAccion({
    ruta: RUTA,
    esquema: z.object({ id: z.uuid() }),
    entrada: { id },
    entidad: "el usuario",
    etiquetas: [],
    mensajeOk: "Contraseña temporal nueva creada.",
    hacer: async (d, { supabase, sesion }) => {
      if (d.id === sesion.usuarioId) {
        return sinPermiso("Para cambiar tu propia contraseña, usa «Cambiar mi contraseña».");
      }
      // Leer el perfil con la sesión confirma que la RLS deja verlo (solo administración).
      const { error: errorPerfil } = await supabase
        .from("perfiles")
        .select("id")
        .eq("id", d.id)
        .single();
      if (errorPerfil) return { error: errorPerfil };

      const clave = generarClaveTemporal();
      const { data, error } = await crearClienteAdministrador().auth.admin.updateUserById(d.id, {
        password: clave,
        app_metadata: { debe_cambiar_clave: true },
      });
      if (error) return { error: { code: error.code, message: error.message } };
      return { error: null, id: d.id, extra: { clave, correo: data.user.email ?? "" } };
    },
  });
}

export async function eliminarUsuario(id: string): Promise<EstadoAccion> {
  return ejecutarAccion({
    ruta: RUTA,
    esquema: z.object({ id: z.uuid() }),
    entrada: { id },
    entidad: "el usuario",
    etiquetas: [],
    mensajeOk: "Usuario eliminado. Su historial de cambios se conserva.",
    hacer: async (d, { supabase, sesion }) => {
      if (sesion.rol !== "superadmin")
        return sinPermiso("Solo el super administrador puede eliminar usuarios.");
      // Borrado lógico del perfil + bloqueo. No se borra de auth.users: la
      // auditoría tiene que seguir sabiendo quién hizo cada cambio.
      const { error } = await supabase
        .from("perfiles")
        .update({ deleted_at: new Date().toISOString(), activo: false })
        .eq("id", d.id)
        .select("id")
        .single();
      if (error) return { error };
      const { error: errorBloqueo } = await crearClienteAdministrador().auth.admin.updateUserById(
        d.id,
        {
          ban_duration: BLOQUEO,
        },
      );
      return {
        error: errorBloqueo ? { code: errorBloqueo.code, message: errorBloqueo.message } : null,
      };
    },
  });
}

/** Primer ingreso (o cuando alguien quiera cambiarla). Cualquier rol. */
export async function cambiarMiClave(fd: FormData): Promise<EstadoAccion> {
  const validado = esquemaCambioClave.safeParse(leerCambioClave(fd));
  if (!validado.success) {
    return {
      estado: "error",
      mensaje: "Revisa los campos marcados en rojo.",
      errores: z.flattenError(validado.error).fieldErrors as Record<string, string[] | undefined>,
    };
  }

  const supabase = await crearClienteServidor();
  const { data: claims } = await supabase.auth.getClaims();
  const usuarioId = claims?.claims.sub;
  if (!usuarioId) {
    await exigirAcceso("/admin"); // redirige al ingreso
    return { estado: "error", mensaje: "Tu sesión terminó. Vuelve a entrar." };
  }

  const { error } = await supabase.auth.updateUser({ password: validado.data.clave });
  if (error) {
    return {
      estado: "error",
      mensaje:
        error.code === "same_password"
          ? "Esa es la contraseña que ya tienes. Elige otra."
          : error.code === "weak_password"
            ? "Esa contraseña es muy fácil de adivinar. Elige otra más larga."
            : "No se pudo cambiar la contraseña. Inténtalo otra vez.",
    };
  }

  await crearClienteAdministrador().auth.admin.updateUserById(String(usuarioId), {
    app_metadata: { debe_cambiar_clave: false },
  });
  // El JWT todavía lleva la marca: se pide uno nuevo para que el proxy deje pasar.
  await supabase.auth.refreshSession();

  return { estado: "ok", mensaje: "Contraseña cambiada. Bienvenido al panel." };
}
```

> **Límite conocido, a documentar en el cierre:** desactivar a alguien le quita el panel en su
> siguiente ingreso, pero la sesión que ya tiene abierta conserva su rol **hasta una hora**
> (`jwt_expiry = 3600`), porque la RLS lee el rol del token y no de la tabla (decisión de F2 para
> no consultar `perfiles` en cada petición). Para un despido con prisa, la salida es bajar
> `jwt_expiry` en Supabase, no cambiar las políticas. Se lo cuento a Dan en T8.
>
> `app_metadata` en `updateUserById` **se fusiona** con lo que ya tenía (no borra `provider`).
> Comprobarlo en local con `select raw_app_meta_data from auth.users where email = '...'` después de
> la primera alta.

### Paso 6 — Pantallas de usuarios

- [ ] Escribir `src/app/(admin)/admin/usuarios/clave-temporal.tsx`:

```tsx
"use client";

import { Copy } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

/** Se ve una sola vez: al salir de esta pantalla no hay forma de volver a verla. */
export function ClaveTemporal({ correo, clave }: { correo: string; clave: string }) {
  const [copiada, setCopiada] = useState(false);

  return (
    <section
      aria-labelledby="clave-titulo"
      className="bg-card flex flex-col gap-4 rounded-xl border p-5"
      data-clave-temporal
    >
      <h2 id="clave-titulo" className="font-heading text-primary text-2xl">
        Contraseña temporal
      </h2>
      <p>
        Para <strong>{correo}</strong>. Dásela en persona o por WhatsApp.{" "}
        <strong>No se vuelve a mostrar.</strong> Al entrar, el panel le pedirá que elija una suya.
      </p>
      <output
        className="bg-muted rounded-lg p-4 text-center font-mono text-2xl tracking-widest"
        data-clave
      >
        {clave}
      </output>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className="boton-linea"
          onClick={async () => {
            await navigator.clipboard.writeText(clave);
            setCopiada(true);
          }}
        >
          <Copy aria-hidden className="size-5" /> {copiada ? "Copiada" : "Copiar"}
        </button>
        <Link href="/admin/usuarios" className="boton-cta">
          Listo, ya la anoté
        </Link>
      </div>
    </section>
  );
}
```

- [ ] Escribir `src/app/(admin)/admin/usuarios/formulario-usuario.tsx`:

```tsx
"use client";

import { useState } from "react";

import { BarraGuardar } from "@/components/panel/barra-guardar";
import { Campo } from "@/components/panel/campo";
import { FormularioPanel } from "@/components/panel/formulario-panel";
import { crearUsuarioDelPanel, guardarUsuario } from "@/lib/acciones/usuarios";
import { NOMBRE_DEL_ROL, type Rol } from "@/lib/auth/roles";
import { claveDeBorrador } from "@/lib/panel/borrador";
import { validarUsuario } from "@/lib/validaciones/usuario";

import { ClaveTemporal } from "./clave-temporal";

export type UsuarioEditable = {
  id: string;
  nombre_completo: string;
  correo: string;
  celular: string | null;
  rol: Rol;
};

const VOLVER = "/admin/usuarios";

const DESCRIPCION_DEL_ROL: Record<Rol, string> = {
  superadmin: "Todo, y es el único que elimina usuarios.",
  administrador: "Todo el panel y aprueba promociones.",
  ingeniero: "Contenido e insumos. Sus promociones pasan por un administrador.",
  repartidor: "Solo clientes, para el reparto.",
};

type Props = { usuario: UsuarioEditable | null; rolesAsignables: Rol[] };

export function FormularioUsuario({ usuario, rolesAsignables }: Props) {
  const [creada, setCreada] = useState<{ correo: string; clave: string } | null>(null);

  if (creada) return <ClaveTemporal correo={creada.correo} clave={creada.clave} />;

  return (
    <FormularioPanel
      clave={claveDeBorrador("usuario", usuario?.id ?? null)}
      accion={usuario ? guardarUsuario : crearUsuarioDelPanel}
      validar={validarUsuario}
      {...(usuario
        ? { destino: () => VOLVER }
        : {
            alGuardar: (r) => {
              if (r.extra?.clave && r.extra.correo)
                setCreada({ clave: r.extra.clave, correo: r.extra.correo });
            },
          })}
    >
      <input type="hidden" name="id" value={usuario?.id ?? ""} />
      <div className="bg-card flex flex-col gap-4 rounded-xl border p-4">
        <Campo nombre="nombre_completo" etiqueta="Nombre y apellido">
          {(p) => <input {...p} defaultValue={usuario?.nombre_completo ?? ""} autoComplete="off" />}
        </Campo>
        <Campo
          nombre="correo"
          etiqueta="Correo"
          ayuda={usuario ? "El correo no se puede cambiar." : "Con él entrará al panel."}
        >
          {(p) => (
            <input
              {...p}
              type="email"
              defaultValue={usuario?.correo ?? ""}
              readOnly={Boolean(usuario)}
              autoComplete="off"
            />
          )}
        </Campo>
        <Campo nombre="celular" etiqueta="Celular" opcional>
          {(p) => (
            <input {...p} type="tel" inputMode="numeric" defaultValue={usuario?.celular ?? ""} />
          )}
        </Campo>
        <fieldset className="flex flex-col gap-2">
          <legend className="text-sm font-semibold">Rol</legend>
          {rolesAsignables.map((rol) => (
            <label key={rol} className="flex min-h-12 items-start gap-3 rounded-lg border p-3">
              <input
                type="radio"
                name="rol"
                value={rol}
                defaultChecked={usuario ? usuario.rol === rol : rol === "repartidor"}
                className="accent-primary mt-1 size-5"
              />
              <span>
                <span className="font-semibold">{NOMBRE_DEL_ROL[rol]}</span>
                <span className="text-muted-foreground block text-sm">
                  {DESCRIPCION_DEL_ROL[rol]}
                </span>
              </span>
            </label>
          ))}
        </fieldset>
      </div>
      <BarraGuardar volver={VOLVER} />
    </FormularioPanel>
  );
}
```

> Los `radio` del rol se restauran desde la copia local como `RadioNodeList` (ya previsto en
> `recuperar()`, T2).

- [ ] Escribir `src/app/(admin)/admin/usuarios/acciones-usuario.tsx`:

```tsx
"use client";

import { KeyRound, UserCheck, UserX } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { ConfirmarBorrado } from "@/components/panel/confirmar-borrado";
import { cambiarActivo, eliminarUsuario, restablecerClave } from "@/lib/acciones/usuarios";

import { ClaveTemporal } from "./clave-temporal";

type Props = { id: string; nombre: string; activo: boolean; esYo: boolean; puedeEliminar: boolean };

export function AccionesUsuario({ id, nombre, activo, esYo, puedeEliminar }: Props) {
  const [pendiente, iniciar] = useTransition();
  const [nueva, setNueva] = useState<{ correo: string; clave: string } | null>(null);

  if (esYo) {
    return (
      <p className="text-muted-foreground text-sm">
        Esta es tu cuenta: tu rol y tu acceso los cambia otro administrador.
      </p>
    );
  }
  if (nueva) return <ClaveTemporal correo={nueva.correo} clave={nueva.clave} />;

  return (
    <section
      aria-label="Acceso de la cuenta"
      className="bg-card mt-4 flex flex-col gap-2 rounded-xl border p-4"
    >
      <h2 className="font-semibold">Acceso</h2>
      <button
        type="button"
        className="boton-linea"
        disabled={pendiente}
        onClick={() =>
          iniciar(async () => {
            const r = await cambiarActivo(id, !activo);
            if (r.estado === "ok") toast.success(r.mensaje);
            if (r.estado === "error") toast.error(r.mensaje);
          })
        }
      >
        {activo ? (
          <UserX aria-hidden className="size-5" />
        ) : (
          <UserCheck aria-hidden className="size-5" />
        )}
        {activo ? "Desactivar la cuenta" : "Reactivar la cuenta"}
      </button>
      <button
        type="button"
        className="boton-linea"
        disabled={pendiente}
        onClick={() =>
          iniciar(async () => {
            const r = await restablecerClave(id);
            if (r.estado === "ok" && r.extra?.clave)
              setNueva({ correo: r.extra.correo ?? "", clave: r.extra.clave });
            if (r.estado === "error") toast.error(r.mensaje);
          })
        }
      >
        <KeyRound aria-hidden className="size-5" /> Darle una contraseña temporal nueva
      </button>
      {puedeEliminar ? (
        <div className="flex items-center gap-2">
          <ConfirmarBorrado
            nombre={`la cuenta de ${nombre}`}
            accion={eliminarUsuario.bind(null, id)}
          />
          <span className="text-sm">Eliminar la cuenta</span>
        </div>
      ) : null}
    </section>
  );
}
```

- [ ] Escribir `src/app/(admin)/admin/usuarios/page.tsx`:

```tsx
import { Plus } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";

import { EncabezadoPanel } from "@/components/panel/encabezado-panel";
import { ListaAdaptable } from "@/components/panel/lista-adaptable";
import { NOMBRE_DEL_ROL } from "@/lib/auth/roles";
import { exigirAcceso } from "@/lib/auth/sesion";
import { crearClienteAdministrador } from "@/lib/supabase/administrador";
import { crearClienteServidor } from "@/lib/supabase/servidor";

const RUTA = "/admin/usuarios";

export default function Usuarios() {
  return (
    <>
      <EncabezadoPanel
        titulo="Usuarios"
        accion={
          <Link href={`${RUTA}/nuevo`} className="boton-cta">
            <Plus aria-hidden className="size-5" /> Nueva cuenta
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
  const { data: perfiles, error } = await supabase
    .from("perfiles")
    .select("id, nombre_completo, rol, activo")
    .is("deleted_at", null)
    .order("nombre_completo");
  if (error) return <p role="alert">No se pudieron cargar los usuarios. Recarga la página.</p>;

  // El correo vive en auth.users, que la RLS no expone. Se lee con la
  // service_role DESPUÉS de exigirAcceso, y solo el correo.
  const { data: cuentas } = await crearClienteAdministrador().auth.admin.listUsers({
    perPage: 200,
  });
  const correos = new Map((cuentas?.users ?? []).map((u) => [u.id, u.email ?? ""]));

  const filas = perfiles.map((p) => ({ ...p, correo: correos.get(p.id) ?? "" }));

  return (
    <ListaAdaptable
      etiqueta="Cuentas del panel"
      filas={filas}
      enlace={(u) => `${RUTA}/${u.id}`}
      columnas={[
        { titulo: "Nombre", celda: (u) => u.nombre_completo, principal: true },
        { titulo: "Correo", celda: (u) => u.correo },
        { titulo: "Rol", celda: (u) => NOMBRE_DEL_ROL[u.rol] },
        { titulo: "Acceso", celda: (u) => (u.activo ? "Activa" : "Desactivada") },
      ]}
      vacio={<p>No hay cuentas.</p>}
    />
  );
}
```

- [ ] Escribir `src/app/(admin)/admin/usuarios/nuevo/page.tsx`:

```tsx
import { Suspense } from "react";

import { EncabezadoPanel } from "@/components/panel/encabezado-panel";
import { exigirAcceso } from "@/lib/auth/sesion";
import { rolesQuePuedeAsignar } from "@/lib/validaciones/usuario";

import { FormularioUsuario } from "../formulario-usuario";

export default function NuevoUsuario() {
  return (
    <>
      <EncabezadoPanel
        titulo="Nueva cuenta"
        volver={{ ruta: "/admin/usuarios", nombre: "Usuarios" }}
      />
      <Suspense fallback={null}>
        <Formulario />
      </Suspense>
    </>
  );
}

async function Formulario() {
  const sesion = await exigirAcceso("/admin/usuarios");
  return <FormularioUsuario usuario={null} rolesAsignables={rolesQuePuedeAsignar(sesion.rol)} />;
}
```

- [ ] Escribir `src/app/(admin)/admin/usuarios/[id]/page.tsx`:

```tsx
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { EncabezadoPanel } from "@/components/panel/encabezado-panel";
import { exigirAcceso } from "@/lib/auth/sesion";
import { crearClienteAdministrador } from "@/lib/supabase/administrador";
import { crearClienteServidor } from "@/lib/supabase/servidor";
import { rolesQuePuedeAsignar } from "@/lib/validaciones/usuario";

import { AccionesUsuario } from "../acciones-usuario";
import { FormularioUsuario } from "../formulario-usuario";

type Params = PageProps<"/admin/usuarios/[id]">["params"];

export default function EditarUsuario({ params }: PageProps<"/admin/usuarios/[id]">) {
  return (
    <Suspense fallback={<p className="text-muted-foreground text-sm">Cargando…</p>}>
      <Editor params={params} />
    </Suspense>
  );
}

async function Editor({ params }: { params: Params }) {
  const { id } = await params;
  const sesion = await exigirAcceso("/admin/usuarios");
  const supabase = await crearClienteServidor();
  const { data: perfil } = await supabase
    .from("perfiles")
    .select("id, nombre_completo, celular, rol, activo")
    .eq("id", id)
    .is("deleted_at", null)
    .maybeSingle();
  if (!perfil) notFound();

  const { data: cuenta } = await crearClienteAdministrador().auth.admin.getUserById(id);
  const esYo = id === sesion.usuarioId;
  // Un administrador no ofrece «superadmin»; y si edita a un superadmin, no puede
  // cambiarle el rol (0029): se le enseña solo el suyo, fijo.
  const asignables =
    perfil.rol === "superadmin" && sesion.rol !== "superadmin"
      ? ["superadmin" as const]
      : rolesQuePuedeAsignar(sesion.rol);

  return (
    <>
      <EncabezadoPanel
        titulo={perfil.nombre_completo}
        volver={{ ruta: "/admin/usuarios", nombre: "Usuarios" }}
      />
      <FormularioUsuario
        usuario={{ ...perfil, correo: cuenta.user?.email ?? "" }}
        rolesAsignables={esYo ? [perfil.rol] : asignables}
      />
      <AccionesUsuario
        id={perfil.id}
        nombre={perfil.nombre_completo}
        activo={perfil.activo}
        esYo={esYo}
        puedeEliminar={sesion.rol === "superadmin"}
      />
    </>
  );
}
```

- [ ] Añadir a `RUTAS_DEL_PANEL`: `"/admin/usuarios"`, `"/admin/usuarios/nuevo"`. `/cambiar-clave`
      lo recorre axe dentro de la prueba de alta (paso 7), que es la única que llega ahí.
- [ ] `pnpm typecheck && pnpm lint && pnpm build`. **Comprobar que el build no incluye la llave:**
      `grep -r "service_role" .next/static` no devuelve nada.
- [ ] Commit: `feat(usuarios): altas con contraseña temporal, roles y bloqueo desde el panel`

### Paso 7 — El primer ingreso en el navegador

- [ ] En `e2e/ayudas/usuarios.ts`, añadir:

```ts
/** Para limpiar cuentas que crea el propio panel y cuyo id no conoce la prueba. */
export async function borrarUsuarioPorCorreo(correo: string): Promise<void> {
  const { apiUrl } = supabaseLocal();
  const respuesta = await fetch(`${apiUrl}/auth/v1/admin/users?per_page=1000`, {
    headers: cabeceras(),
  });
  const { users } = (await respuesta.json()) as { users: { id: string; email: string }[] };
  const cuenta = users.find((u) => u.email === correo);
  if (cuenta) await borrarUsuario(cuenta.id);
}
```

- [ ] Escribir `e2e/panel-usuarios.spec.ts`:

```ts
import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

import { entrarComo } from "./ayudas/sesion";
import { borrarUsuario, borrarUsuarioPorCorreo, crearUsuario } from "./ayudas/usuarios";

const correoUnico = () =>
  `e2e-alta-${Date.now()}-${Math.random().toString(36).slice(2, 6)}@pimpos.test`;

test("un administrador da de alta a alguien, y ese alguien cambia la contraseña al entrar", async ({
  page,
}) => {
  const admin = await entrarComo(page, "administrador");
  const correo = correoUnico();
  try {
    await page.goto("/admin/usuarios/nuevo");
    await expect(page.getByRole("radio", { name: /Super administrador/ })).toHaveCount(0);

    await page.getByLabel("Nombre y apellido").fill("Debra de Prueba");
    await page.getByLabel("Correo").fill(correo);
    await page.getByRole("radio", { name: /Ingeniero/ }).check();
    await page.getByRole("button", { name: "Guardar" }).click();

    const clave = (await page.locator("[data-clave]").textContent())?.trim() ?? "";
    expect(clave).toMatch(/^[A-Za-z2-9]{12}$/);
    await page.getByRole("link", { name: "Listo, ya la anoté" }).click();
    await expect(page.getByRole("link", { name: "Debra de Prueba" }).first()).toBeVisible();

    // Sale el administrador y entra la persona nueva.
    await page.context().clearCookies();
    await page.goto("/ingresar");
    await page.getByLabel("Correo").fill(correo);
    await page.getByLabel("Contraseña").fill(clave);
    await page.getByRole("button", { name: "Entrar" }).click();
    await expect(page).toHaveURL("/cambiar-clave");
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);

    // No puede saltárselo escribiendo la dirección.
    await page.goto("/admin/contenido");
    await expect(page).toHaveURL("/cambiar-clave");

    await page.getByLabel("Contraseña nueva").fill("MiClaveDePrueba2026");
    await page.getByLabel("Repítela").fill("MiClaveDePrueba2026");
    // Una contraseña nunca queda en el navegador.
    const guardado = await page.evaluate(() => JSON.stringify({ ...localStorage }));
    expect(guardado).not.toContain("MiClaveDePrueba2026");

    await page.getByRole("button", { name: "Guardar y entrar" }).click();
    await expect(page).toHaveURL("/admin");
    await expect(page.locator('[data-seccion="Contenido"]')).toBeVisible();
  } finally {
    await borrarUsuarioPorCorreo(correo);
    await borrarUsuario(admin.id);
  }
});

test("una cuenta desactivada ya no entra", async ({ page, browser }) => {
  const admin = await entrarComo(page, "administrador");
  const otra = await crearUsuario("repartidor");
  try {
    await page.goto(`/admin/usuarios/${otra.id}`);
    await page.getByRole("button", { name: "Desactivar la cuenta" }).click();
    await expect(page.getByText("Cuenta desactivada. Ya no puede entrar.")).toBeVisible();

    const { baseURL } = test.info().project.use;
    const contexto = await browser.newContext({ baseURL });
    const suya = await contexto.newPage();
    await suya.goto("/ingresar");
    await suya.getByLabel("Correo").fill(otra.correo);
    await suya.getByLabel("Contraseña").fill(otra.clave);
    await suya.getByRole("button", { name: "Entrar" }).click();
    await expect(suya.getByTestId("error-ingreso")).toContainText("Esta cuenta está suspendida");
    await contexto.close();
  } finally {
    await borrarUsuario(otra.id);
    await borrarUsuario(admin.id);
  }
});

test("en su propia ficha, el administrador no tiene botones para quitarse el acceso", async ({
  page,
}) => {
  const admin = await entrarComo(page, "administrador");
  try {
    await page.goto(`/admin/usuarios/${admin.id}`);
    await expect(page.getByText("Esta es tu cuenta")).toBeVisible();
    await expect(page.getByRole("button", { name: "Desactivar la cuenta" })).toHaveCount(0);
  } finally {
    await borrarUsuario(admin.id);
  }
});

test("el ingeniero no entra a usuarios", async ({ page }) => {
  const inge = await entrarComo(page, "ingeniero");
  try {
    await page.goto("/admin/usuarios");
    await expect(page).toHaveURL("/admin?motivo=sin-acceso");
  } finally {
    await borrarUsuario(inge.id);
  }
});
```

- [ ] Liberar el puerto 3000; `pnpm test:e2e e2e/panel-usuarios.spec.ts e2e/autenticacion.spec.ts` →
      PASS en los dos proyectos. Después la suite completa.
- [ ] Commit: `test(usuarios): alta, primer ingreso con cambio de contraseña y bloqueo`
- [ ] PR `feat/f4-t6-usuarios` → CI en verde → fusionar.
- [ ] **Después de fusionar y antes de desplegar:** añadir `SUPABASE_SERVICE_ROLE_KEY` en Vercel
      (Production y Preview) desde Supabase → Project Settings → API Keys. **Sin `NEXT_PUBLIC_`.**
      Sin ella, `/admin/usuarios` lanza el error explicado de `crearClienteAdministrador`.

---

## Tarea 7 — Configuración y marca (R21)

**Rama:** `feat/f4-t7-configuracion`

**Qué deja hecho:** los ~30 ajustes del sitio se editan en `/admin/configuracion`, en pestañas
**Contacto · Ubicación · Horarios · Pedidos · Redes · Marca**, y se guardan de una vez. Los datos
provisionales llevan la etiqueta «Por confirmar» y dejan de estarlo al guardarlos. El favicon pasa a
ser administrable. Lo que guarda el panel **siempre** lo acepta el esquema del sitio: un valor mal
formado ya no puede tirar la configuración entera a los valores de reserva.

**Archivos:**

- Crear: `supabase/migrations/0030_guardar_configuracion.sql`, `supabase/tests/0030_guardar_configuracion.test.sql`
- Modificar: `src/lib/datos/configuracion.ts` (exportar el esquema), `src/app/layout.tsx` (favicon)
- Crear: `src/lib/validaciones/configuracion-panel.ts` + `.test.ts`, `src/lib/acciones/configuracion.ts`
- Crear: `src/components/panel/{editor-horario,selector-ubicacion,vista-marca}.tsx`
- Crear: `src/app/(admin)/admin/configuracion/{page,formulario-configuracion}.tsx`
- Modificar: `RUTAS_DEL_PANEL`, `src/tipos/database.types.ts` (regenerado)
- Crear: `e2e/panel-configuracion.spec.ts`

> **Cambio respecto al doc 03 §5.5:** el favicon no se sirve con `app/icon.tsx` + `ImageResponse`
> sino con `icons` en `generateMetadata` del layout raíz, que apunta al archivo del bucket. Motivo:
> `ImageResponse` no dibuja SVG de forma fiable (trampa de `next/og` en `CLAUDE.md`) y el favicon
> actual es SVG; y un `<link rel="icon">` a la URL del bucket no necesita generar ninguna imagen. El
> `apple-touch-icon` se queda en `public/marca/`, fijo. Se anota en el doc 03 en T8.

**Interfaces:**

- Consume (T1–T6): `ejecutarAccion`, `EstadoAccion`, `texto`, `json`, `casilla`, `entero`,
  `FormularioPanel`, `useFormularioPanel`, `PestanasFormulario`, `Campo`, `CLASE_CONTROL`,
  `BarraGuardar`, `SubidaImagen` (con `maximoBytes`), `EncabezadoPanel`, `claveDeBorrador`,
  `normalizarPrecio` (T3), `obtenerConfiguracion`, `DIAS`, `urlDeImagen`, `ETIQUETAS.marca`,
  `entrarComo`, `fotoDePrueba`.
- Produce:
  - `public.guardar_configuracion(p_valores jsonb, p_confirmadas text[]) returns integer`
  - `export const esquemaConfiguracion` en `src/lib/datos/configuracion.ts`
  - `esquemaConfiguracionPanel`, `leerConfiguracion(fd)`, `CLAVES_EDITABLES`

### Paso 1 — Guardar varios ajustes de una vez

- [ ] Escribir `supabase/tests/0030_guardar_configuracion.test.sql`:

```sql
-- Verifica guardar_configuracion (0030).
--
-- Lo que se defiende: que los ajustes se guarden juntos o ninguno; que un dato
-- provisional deje de estarlo al confirmarlo; que el panel no pueda inventar
-- claves; y que solo la administración cambie la configuración.
begin;
select plan(10);

insert into auth.users (id, email, created_at, updated_at) values
  ('22222222-2222-2222-2222-222222222222', 'admin@pimpos.test', now(), now()),
  ('33333333-3333-3333-3333-333333333333', 'inge@pimpos.test',  now(), now());
update public.perfiles set rol = 'administrador', activo = true where id = '22222222-2222-2222-2222-222222222222';
update public.perfiles set rol = 'ingeniero',     activo = true where id = '33333333-3333-3333-3333-333333333333';

select has_function('public', 'guardar_configuracion', array['jsonb', 'text[]'], 'existe guardar_configuracion');

set local role authenticated;
set local request.jwt.claims = '{"sub": "22222222-2222-2222-2222-222222222222", "rol": "administrador"}';

select is(
  public.guardar_configuracion('{"telefono": "065 123456"}'::jsonb, array['delivery_costo']),
  1, 'devuelve cuántos ajustes guardó'
);
select is(
  (select descripcion from public.configuracion_sitio where clave = 'telefono'),
  'Teléfono fijo del local.', 'un dato provisional que se cambia deja de estar PENDIENTE'
);
select ok(
  (select descripcion not like '%PENDIENTE%' from public.configuracion_sitio where clave = 'delivery_costo'),
  'un dato provisional que se confirma sin cambiarlo también deja de estarlo'
);
select ok(
  (select descripcion like '%PENDIENTE%' from public.configuracion_sitio where clave = 'delivery_tiempo'),
  'lo que no se tocó ni se confirmó sigue PENDIENTE'
);
select is(
  (select updated_by from public.configuracion_sitio where clave = 'telefono'),
  '22222222-2222-2222-2222-222222222222'::uuid, 'queda quién lo cambió'
);

select throws_ok(
  $$ select public.guardar_configuracion('{"inventado": "x"}'::jsonb, '{}') $$,
  'P0001', 'No existe el ajuste «inventado».', 'no se crean claves desde el panel'
);

select throws_ok(
  $$ select public.guardar_configuracion('{"telefono": "999", "delivery_costo": "tres"}'::jsonb, '{}') $$,
  '23514', null, 'un valor que viola su check hace fallar la llamada entera'
);
select is(
  (select valor from public.configuracion_sitio where clave = 'telefono'),
  '"065 123456"'::jsonb, 'y el ajuste válido de la misma llamada tampoco se guarda'
);

set local request.jwt.claims = '{"sub": "33333333-3333-3333-3333-333333333333", "rol": "ingeniero"}';
select throws_ok(
  $$ select public.guardar_configuracion('{"telefono": "1"}'::jsonb, '{}') $$,
  '42501', null, 'el ingeniero no cambia la configuración'
);

select * from finish();
rollback;
```

- [ ] `supabase test db` → FAIL.
- [ ] Escribir `supabase/migrations/0030_guardar_configuracion.sql`:

```sql
-- =============================================================================
-- 0030_guardar_configuracion.sql
-- La configuración se guarda entera o nada (F4, tarea 7).
--
-- El formulario de configuración cambia hasta ~30 filas de una vez. Guardarlas
-- una a una desde la aplicación dejaría el sitio a medias si se corta la señal
-- a la mitad: el WhatsApp nuevo con la dirección vieja. Una función es una
-- transacción.
--
-- Además, al guardar o confirmar un dato provisional, su descripción pierde la
-- palabra PENDIENTE, que es lo que usa la consulta de pendientes (0017) y el
-- aviso del inicio del panel.
-- =============================================================================

create or replace function public.guardar_configuracion(p_valores jsonb, p_confirmadas text[] default '{}')
returns integer
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_clave text;
  v_valor jsonb;
  v_total integer := 0;
begin
  -- Con RLS, el update de un ingeniero no fallaría: no tocaría ninguna fila, y
  -- el mensaje de abajo diría que la clave no existe. Se dice la verdad antes.
  if not (select app.es_rol('superadmin', 'administrador')) then
    raise exception 'Solo la administración cambia la configuración del sitio.'
      using errcode = 'insufficient_privilege';
  end if;

  for v_clave, v_valor in select key, value from jsonb_each(p_valores)
  loop
    update public.configuracion_sitio c
       set valor = v_valor,
           descripcion = case
             when c.valor is distinct from v_valor or v_clave = any (p_confirmadas)
               then btrim(regexp_replace(c.descripcion, '\s*PENDIENTE[^.]*\.', '', 'g'))
             else c.descripcion
           end
     where c.clave = v_clave;

    if not found then
      raise exception 'No existe el ajuste «%».', v_clave;
    end if;
    v_total := v_total + 1;
  end loop;

  -- Una clave confirmada que no vino en p_valores también se confirma.
  update public.configuracion_sitio c
     set descripcion = btrim(regexp_replace(c.descripcion, '\s*PENDIENTE[^.]*\.', '', 'g'))
   where c.clave = any (p_confirmadas)
     and not p_valores ? c.clave
     and c.descripcion like '%PENDIENTE%';

  return v_total;
end;
$$;

comment on function public.guardar_configuracion(jsonb, text[]) is
  'Guarda varios ajustes de configuracion_sitio en una transacción y quita PENDIENTE a lo confirmado.';

revoke execute on function public.guardar_configuracion(jsonb, text[]) from public, anon;
grant execute on function public.guardar_configuracion(jsonb, text[]) to authenticated;

-- configuracion_sitio tiene updated_by pero no created_by, así que 0026 no le
-- puso trigger de autoría. Este es el suyo.
create or replace function app.sellar_editor_configuracion()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_by := coalesce(auth.uid(), old.updated_by);
  return new;
end;
$$;

create trigger configuracion_sitio_sellar_editor
  before update on public.configuracion_sitio
  for each row execute function app.sellar_editor_configuracion();
```

> La prueba de 0026 cuenta tablas con `created_by` **y** `updated_by`; `configuracion_sitio` no
> entra, así que no hay que tocarla.

- [ ] `supabase db reset && bash supabase/seeds/imagenes/subir-imagenes.sh && supabase test db` → PASS.
- [ ] `pnpm supabase:tipos`.
- [ ] Commit: `feat(base): guardar la configuración en una sola transacción`

### Paso 2 — El esquema del panel, atado al del sitio

- [ ] En `src/lib/datos/configuracion.ts`, exportar el esquema sin cambiar nada más:
      `const ESQUEMA = z.object({` → `export const esquemaConfiguracion = z.object({`, y sustituir
      las dos apariciones de `ESQUEMA` (`ESQUEMA.parse({})`, `ESQUEMA.safeParse(...)`) y el
      `z.infer<typeof ESQUEMA>`.
- [ ] Escribir `src/lib/validaciones/configuracion-panel.test.ts`:

```ts
import { describe, expect, it } from "vitest";

import { esquemaConfiguracion } from "@/lib/datos/configuracion";

import { esquemaConfiguracionPanel, leerConfiguracion } from "./configuracion-panel";

const HORARIO = {
  lunes: [
    { desde: "04:00", hasta: "13:00" },
    { desde: "16:00", hasta: "21:00" },
  ],
  martes: [{ desde: "04:00", hasta: "13:00" }],
  miercoles: [],
  jueves: [],
  viernes: [],
  sabado: [],
  domingo: [],
};

function formulario(cambios: Record<string, string> = {}) {
  const base: Record<string, string> = {
    telefono: "065 123456",
    whatsapp: "947 874 820",
    correo: "contactopimpos@gmail.com",
    correo_alertas: "contactopimpos@gmail.com",
    dias_aviso_vencimiento: "15",
    direccion: "Calle Elías Aguirre 1321",
    referencia: "",
    distrito: "Belén",
    provincia: "Maynas",
    departamento: "Loreto",
    coordenadas: JSON.stringify({ lat: -3.7595, lng: -73.2516 }),
    horario_semanal: JSON.stringify(HORARIO),
    nota_horarios: "Domingos y feriados no hay atención.",
    delivery_zonas: "Iquitos\nBelén\n\nPunchana ",
    delivery_costo: "3",
    pedido_minimo: "10,00",
    delivery_tiempo: "30 a 45 minutos",
    formas_pago: "Efectivo\nYape",
    facebook: "",
    instagram: "https://instagram.com/pimpos",
    nombre_comercial: "Panadería Pimpo's",
    razon_social: "Panadería Pastelería y Bodega Pimpo's E.I.R.L.",
    eslogan: "Pan fresco, tradición de siempre",
    logo_url: "/marca/logo.webp",
    logo_alt: "Panadería Pimpo's",
    isotipo_url: "/marca/isotipo.svg",
    favicon_url: "/marca/favicon.svg",
    confirmar_delivery_costo: "on",
    ...cambios,
  };
  const fd = new FormData();
  for (const [k, v] of Object.entries(base)) fd.set(k, v);
  return fd;
}

describe("configuración desde el panel", () => {
  it("lo que guarda el panel lo acepta el esquema del sitio, sin caer a la reserva", () => {
    const panel = esquemaConfiguracionPanel.parse(leerConfiguracion(formulario()).valores);
    const sitio = esquemaConfiguracion.safeParse(panel);
    expect(sitio.success).toBe(true);
    expect(sitio.success && sitio.data.whatsapp).toBe("51947874820");
  });

  it("normaliza lo que escribe una persona: WhatsApp sin 51, precios con coma, líneas vacías", () => {
    const { valores } = leerConfiguracion(formulario());
    const r = esquemaConfiguracionPanel.parse(valores);
    expect(r.whatsapp).toBe("51947874820");
    expect(r.pedido_minimo).toBe(10);
    expect(r.delivery_zonas).toEqual(["Iquitos", "Belén", "Punchana"]);
  });

  it("recoge los datos confirmados", () => {
    expect(leerConfiguracion(formulario()).confirmadas).toEqual(["delivery_costo"]);
  });

  it("un WhatsApp que no es un celular peruano dice cómo escribirlo", () => {
    const r = esquemaConfiguracionPanel.safeParse(
      leerConfiguracion(formulario({ whatsapp: "12345" })).valores,
    );
    expect(!r.success && r.error.issues[0]?.message).toBe(
      "Escribe el celular de WhatsApp de 9 dígitos, por ejemplo 947 874 820.",
    );
  });

  it("un turno que cierra antes de abrir se rechaza", () => {
    const malo = { ...HORARIO, lunes: [{ desde: "13:00", hasta: "04:00" }] };
    const r = esquemaConfiguracionPanel.safeParse(
      leerConfiguracion(formulario({ horario_semanal: JSON.stringify(malo) })).valores,
    );
    expect(!r.success && r.error.issues.map((i) => i.message)).toContain(
      "La hora de cierre tiene que ser después de la de apertura.",
    );
  });

  it("el costo del delivery no puede quedar vacío: la base exige un número (0017)", () => {
    const r = esquemaConfiguracionPanel.safeParse(
      leerConfiguracion(formulario({ delivery_costo: "" })).valores,
    );
    expect(!r.success && r.error.issues[0]?.message).toBe("Escribe el costo. Pon 0 si es gratis.");
  });

  it("una red social tiene que ser un enlace completo o quedar vacía", () => {
    const r = esquemaConfiguracionPanel.safeParse(
      leerConfiguracion(formulario({ facebook: "facebook.com/pimpos" })).valores,
    );
    expect(!r.success && r.error.issues[0]?.message).toBe(
      "Pega el enlace completo, empezando por https://",
    );
  });
});
```

- [ ] `pnpm test -- src/lib/validaciones/configuracion-panel.test.ts` → FAIL.
- [ ] Escribir `src/lib/validaciones/configuracion-panel.ts`:

```ts
import * as z from "zod";

import { casilla, json, texto } from "@/lib/panel/formulario";

import { normalizarPrecio } from "./producto";

const HORA = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, { error: "Escribe la hora como 04:00." });

const TRAMO = z.object({ desde: HORA, hasta: HORA }).refine((t) => t.hasta > t.desde, {
  error: "La hora de cierre tiene que ser después de la de apertura.",
});

const DIA = z
  .array(TRAMO)
  .max(2, { error: "Cada día tiene como mucho dos turnos." })
  .refine((t) => t.length < 2 || t[1]!.desde >= t[0]!.hasta, {
    error: "El segundo turno tiene que empezar después de que termine el primero.",
  });

const MONTO = (vacio: string) =>
  z
    .string()
    .transform(normalizarPrecio)
    .pipe(
      z
        .string()
        .min(1, { error: vacio })
        .regex(/^\d{1,4}(\.\d{1,2})?$/, {
          error: "Escribe el monto con números, por ejemplo 3.50.",
        }),
    )
    .transform(Number);

const RED = z.string().refine((v) => v === "" || v.startsWith("https://"), {
  error: "Pega el enlace completo, empezando por https://",
});

const RUTA_ARCHIVO = z.string().min(1, { error: "Falta el archivo." });

export const esquemaConfiguracionPanel = z.object({
  // Contacto
  telefono: z.string().max(30),
  whatsapp: z
    .string()
    .transform((v) => {
      const digitos = v.replace(/\D/g, "");
      return digitos.length === 9 ? `51${digitos}` : digitos;
    })
    .pipe(
      z.string().regex(/^519\d{8}$/, {
        error: "Escribe el celular de WhatsApp de 9 dígitos, por ejemplo 947 874 820.",
      }),
    ),
  correo: z.email({ error: "Ese correo no parece válido." }),
  correo_alertas: z.email({ error: "Ese correo no parece válido." }),
  dias_aviso_vencimiento: z
    .number({ error: "Escribe un número de días." })
    .int({ error: "Escribe un número entero de días." })
    .min(1, { error: "Entre 1 y 90 días." })
    .max(90, { error: "Entre 1 y 90 días." }),

  // Ubicación
  direccion: z.string().min(1, { error: "Escribe la dirección." }),
  referencia: z.string().max(120),
  distrito: z.string().min(1, { error: "Escribe el distrito." }),
  provincia: z.string(),
  departamento: z.string(),
  coordenadas: z.object(
    { lat: z.number().min(-90).max(90), lng: z.number().min(-180).max(180) },
    { error: "Marca el local en el mapa." },
  ),

  // Horarios
  horario_semanal: z.object({
    lunes: DIA,
    martes: DIA,
    miercoles: DIA,
    jueves: DIA,
    viernes: DIA,
    sabado: DIA,
    domingo: DIA,
  }),
  nota_horarios: z.string().max(160),

  // Pedidos
  delivery_zonas: z.array(z.string()).min(1, { error: "Escribe al menos una zona de reparto." }),
  delivery_costo: MONTO("Escribe el costo. Pon 0 si es gratis."),
  pedido_minimo: MONTO("Escribe el pedido mínimo. Pon 0 si no hay mínimo."),
  delivery_tiempo: z.string().max(60),
  formas_pago: z.array(z.string()).min(1, { error: "Escribe al menos una forma de pago." }),

  // Redes
  facebook: RED,
  instagram: RED,

  // Marca
  nombre_comercial: z.string().min(1, { error: "Escribe el nombre del negocio." }).max(60),
  razon_social: z.string().max(120),
  eslogan: z.string().max(80),
  logo_url: RUTA_ARCHIVO,
  logo_alt: z.string().min(1, { error: "Describe el logo para quien no puede verlo." }),
  isotipo_url: RUTA_ARCHIVO,
  favicon_url: RUTA_ARCHIVO,
});

export type ValoresConfiguracion = z.output<typeof esquemaConfiguracionPanel>;

export const CLAVES_EDITABLES = Object.keys(
  esquemaConfiguracionPanel.shape,
) as (keyof ValoresConfiguracion)[];

const lineas = (valor: string) =>
  valor
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

export function leerConfiguracion(fd: FormData) {
  const valores: Record<string, unknown> = {};
  for (const clave of CLAVES_EDITABLES) valores[clave] = texto(fd, clave);

  valores.dias_aviso_vencimiento = Number(texto(fd, "dias_aviso_vencimiento"));
  valores.coordenadas = json(fd, "coordenadas");
  valores.horario_semanal = json(fd, "horario_semanal");
  valores.delivery_zonas = lineas(texto(fd, "delivery_zonas"));
  valores.formas_pago = lineas(texto(fd, "formas_pago"));

  const confirmadas = CLAVES_EDITABLES.filter((clave) => casilla(fd, `confirmar_${clave}`));
  return { valores, confirmadas };
}

export function validarConfiguracion(fd: FormData) {
  const r = esquemaConfiguracionPanel.safeParse(leerConfiguracion(fd).valores);
  return r.success
    ? {}
    : (z.flattenError(r.error).fieldErrors as Record<string, string[] | undefined>);
}
```

> `normalizarPrecio` vive en `validaciones/producto.ts` (T3). Si importar el esquema de productos
> aquí parece raro al revisar, moverlo a `src/lib/utilidades/precio.ts` y reexportarlo desde
> `producto.ts`: es una función pura sin dependencias.

- [ ] `pnpm test -- src/lib/validaciones/configuracion-panel.test.ts src/lib/datos/configuracion.test.ts` → PASS.
- [ ] Escribir `src/lib/acciones/configuracion.ts`:

```ts
"use server";

import * as z from "zod";

import { ETIQUETAS } from "@/lib/datos/etiquetas";
import { ejecutarAccion, type EstadoAccion } from "@/lib/panel/accion";
import {
  CLAVES_EDITABLES,
  esquemaConfiguracionPanel,
  leerConfiguracion,
} from "@/lib/validaciones/configuracion-panel";

export async function guardarConfiguracion(fd: FormData): Promise<EstadoAccion> {
  const { valores, confirmadas } = leerConfiguracion(fd);

  // Se valida aquí y no dentro de `ejecutarAccion`: allí el esquema envolvería
  // los valores (`valores.whatsapp`) y `flattenError`, que solo mira el primer
  // segmento del camino, dejaría todos los errores bajo `valores` en vez de en
  // su campo. `ejecutarAccion` sigue comprobando el acceso antes de escribir.
  const validado = esquemaConfiguracionPanel.safeParse(valores);
  if (!validado.success) {
    return {
      estado: "error",
      mensaje: "Revisa los campos marcados en rojo.",
      errores: z.flattenError(validado.error).fieldErrors as Record<string, string[] | undefined>,
    };
  }

  return ejecutarAccion({
    ruta: "/admin/configuracion",
    esquema: z.object({
      valores: z.record(z.string(), z.unknown()),
      confirmadas: z.array(z.string().refine((c) => (CLAVES_EDITABLES as string[]).includes(c))),
    }),
    entrada: { valores: validado.data, confirmadas },
    entidad: "la configuración",
    // marca: la cascara pública (cabecera, pie, horario, WhatsApp) y el favicon.
    etiquetas: [ETIQUETAS.marca],
    mensajeOk: "Guardado. El sitio ya muestra los datos nuevos.",
    hacer: async (d, { supabase }) => {
      const { error } = await supabase.rpc("guardar_configuracion", {
        p_valores: d.valores,
        p_confirmadas: d.confirmadas,
      });
      return { error };
    },
  });
}
```

### Paso 3 — Editores de horario, ubicación y marca

- [ ] Escribir `src/components/panel/editor-horario.tsx`:

```tsx
"use client";

import { useEffect, useRef, useState } from "react";

import { DIAS, type Dia, type Tramo } from "@/lib/datos/reloj";

import { CLASE_CONTROL } from "./campo";
import { useFormularioPanel } from "./formulario-panel";

type Horario = Record<Dia, Tramo[]>;

const NOMBRE: Record<Dia, string> = {
  lunes: "Lunes",
  martes: "Martes",
  miercoles: "Miércoles",
  jueves: "Jueves",
  viernes: "Viernes",
  sabado: "Sábado",
  domingo: "Domingo",
};

/**
 * Dos turnos por día como máximo (ficha 1.9). «Cerrado» es un día sin turnos,
 * que el sitio muestra como tal. Viaja en un campo oculto con JSON, igual que
 * las presentaciones de un producto.
 */
export function EditorHorario({ inicial }: { inicial: Horario }) {
  const { registrarRestaurable, errores } = useFormularioPanel();
  const oculto = useRef<HTMLInputElement>(null);
  const [horario, setHorario] = useState<Horario>(inicial);

  useEffect(
    () =>
      registrarRestaurable("horario_semanal", (valor) => {
        try {
          setHorario(JSON.parse(valor) as Horario);
        } catch {
          // Una copia rota no pisa lo que hay.
        }
      }),
    [registrarRestaurable],
  );

  function cambiar(dia: Dia, tramos: Tramo[]) {
    setHorario((h) => ({ ...h, [dia]: tramos }));
    setTimeout(() => oculto.current?.dispatchEvent(new Event("input", { bubbles: true })), 0);
  }

  return (
    <div className="flex flex-col gap-3">
      <input ref={oculto} type="hidden" name="horario_semanal" value={JSON.stringify(horario)} />
      {DIAS.map((dia) => {
        const tramos = horario[dia] ?? [];
        const cerrado = tramos.length === 0;
        return (
          <fieldset
            key={dia}
            className="bg-muted/40 flex flex-col gap-2 rounded-xl p-3"
            data-dia={dia}
          >
            <legend className="sr-only">{NOMBRE[dia]}</legend>
            <div className="flex items-center justify-between">
              <span className="font-semibold">{NOMBRE[dia]}</span>
              <label className="flex min-h-11 items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  className="size-5"
                  checked={cerrado}
                  onChange={(e) =>
                    cambiar(
                      dia,
                      e.currentTarget.checked ? [] : [{ desde: "04:00", hasta: "13:00" }],
                    )
                  }
                />
                Cerrado
              </label>
            </div>
            {tramos.map((tramo, i) => (
              <div key={i} className="grid grid-cols-[1fr_1fr] gap-2">
                <label className="flex flex-col gap-1 text-sm">
                  Turno {i + 1}: abre
                  <input
                    type="time"
                    className={CLASE_CONTROL}
                    value={tramo.desde}
                    onChange={(e) =>
                      cambiar(
                        dia,
                        tramos.map((t, j) =>
                          j === i ? { ...t, desde: e.currentTarget.value } : t,
                        ),
                      )
                    }
                  />
                </label>
                <label className="flex flex-col gap-1 text-sm">
                  cierra
                  <input
                    type="time"
                    className={CLASE_CONTROL}
                    value={tramo.hasta}
                    onChange={(e) =>
                      cambiar(
                        dia,
                        tramos.map((t, j) =>
                          j === i ? { ...t, hasta: e.currentTarget.value } : t,
                        ),
                      )
                    }
                  />
                </label>
              </div>
            ))}
            {!cerrado && tramos.length < 2 ? (
              <button
                type="button"
                className="boton-linea w-fit"
                onClick={() => cambiar(dia, [...tramos, { desde: "16:00", hasta: "21:00" }])}
              >
                Añadir segundo turno
              </button>
            ) : null}
            {tramos.length === 2 ? (
              <button
                type="button"
                className="boton-linea w-fit"
                onClick={() => cambiar(dia, tramos.slice(0, 1))}
              >
                Quitar segundo turno
              </button>
            ) : null}
          </fieldset>
        );
      })}
      {errores.horario_semanal?.length ? (
        <p className="text-destructive text-sm font-semibold">{errores.horario_semanal[0]}</p>
      ) : null}
    </div>
  );
}
```

> Comprobar que `reloj.ts` exporta `DIAS` como la lista `["lunes", …, "domingo"]` y los tipos `Dia`
> y `Tramo`; `configuracion.ts` los reexporta de ahí. Importarlos de `reloj.ts` y **no** de
> `configuracion.ts`: este es un componente de cliente (trampa de «Abierto ahora» en `CLAUDE.md`).
> Por la misma razón, **ningún componente de cliente de esta tarea importa
> `configuracion-panel.ts` si este importa `configuracion.ts`**: el esquema del sitio solo se
> importa en la prueba. `configuracion-panel.ts` no lo importa (ver arriba), así que se puede usar
> en el formulario.

- [ ] Escribir `src/components/panel/selector-ubicacion.tsx`:

```tsx
"use client";

import type { Map as MapaLeaflet, Marker } from "leaflet";
import { useEffect, useRef, useState } from "react";

import "leaflet/dist/leaflet.css";

import { useFormularioPanel } from "./formulario-panel";

type Punto = { lat: number; lng: number };

/**
 * El mismo Leaflet de /ubicacion (sin react-leaflet), con el marcador
 * arrastrable. Solo se carga en esta pantalla del panel.
 */
export function SelectorUbicacion({ inicial }: { inicial: Punto | null }) {
  const { registrarRestaurable } = useFormularioPanel();
  const contenedor = useRef<HTMLDivElement>(null);
  const oculto = useRef<HTMLInputElement>(null);
  const marcador = useRef<Marker | null>(null);
  const mapa = useRef<MapaLeaflet | null>(null);
  const [punto, setPunto] = useState<Punto>(inicial ?? { lat: -3.7595, lng: -73.2516 });

  useEffect(() => {
    let cancelado = false;
    void (async () => {
      const L = await import("leaflet");
      if (cancelado || !contenedor.current || mapa.current) return;
      const instancia = L.map(contenedor.current, {
        center: [punto.lat, punto.lng],
        zoom: 17,
        scrollWheelZoom: false,
      });
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
      const m = L.marker([punto.lat, punto.lng], {
        draggable: true,
        icon: icono,
        keyboard: true,
        title: "Ubicación del local",
      }).addTo(instancia);
      m.on("dragend", () => {
        const { lat, lng } = m.getLatLng();
        setPunto({ lat, lng });
        setTimeout(() => oculto.current?.dispatchEvent(new Event("input", { bubbles: true })), 0);
      });
      mapa.current = instancia;
      marcador.current = m;
    })();
    return () => {
      cancelado = true;
      mapa.current?.remove();
      mapa.current = null;
    };
    // El mapa se crea una vez; los cambios de `punto` los mueve el marcador.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(
    () =>
      registrarRestaurable("coordenadas", (valor) => {
        try {
          const p = JSON.parse(valor) as Punto;
          setPunto(p);
          marcador.current?.setLatLng([p.lat, p.lng]);
          mapa.current?.panTo([p.lat, p.lng]);
        } catch {
          // Copia rota: se ignora.
        }
      }),
    [registrarRestaurable],
  );

  return (
    <div className="flex flex-col gap-2">
      <input ref={oculto} type="hidden" name="coordenadas" value={JSON.stringify(punto)} />
      <p className="text-sm">Arrastra el punto azul hasta la puerta del local.</p>
      <div
        ref={contenedor}
        className="h-72 w-full overflow-hidden rounded-xl border"
        data-selector-ubicacion
      />
      <p className="text-muted-foreground text-sm">
        {punto.lat.toFixed(6)}, {punto.lng.toFixed(6)}
      </p>
    </div>
  );
}
```

> El `eslint-disable` va con su motivo en la línea anterior, como pide el proyecto. Si
> `react-hooks/exhaustive-deps` no se queja porque `punto` solo se lee al crear, quitarlo.
> El marcador arrastrable se mueve también con teclado (`keyboard: true`); comprobar con axe que
> Leaflet le pone `role` y nombre, y si no, añadir `aria-label` en `m.getElement()` tras crearlo.

- [ ] Escribir `src/components/panel/vista-marca.tsx`:

```tsx
"use client";

import { useEffect, useState } from "react";

import { urlDeImagen } from "@/lib/supabase/publico";

/**
 * Vista previa del favicon a los tamaños en que se ve de verdad (doc 03 §5.5),
 * sobre crema y sobre azul: un favicon que no se lee a 16 px no sirve.
 * Lee la ruta del campo oculto que deja `SubidaImagen`.
 */
export function VistaFavicon({ nombreCampo }: { nombreCampo: string }) {
  const [ruta, setRuta] = useState<string | null>(null);

  useEffect(() => {
    const campo = document.querySelector<HTMLInputElement>(
      `input[type=hidden][name="${nombreCampo}"]`,
    );
    if (!campo) return;
    const leer = () => setRuta(campo.value);
    leer();
    const formulario = campo.form;
    formulario?.addEventListener("input", leer);
    return () => formulario?.removeEventListener("input", leer);
  }, [nombreCampo]);

  const url = urlDeImagen("marca", ruta);
  if (!url) return null;

  return (
    <div className="flex flex-wrap gap-4" aria-label="Así se verá el icono de la pestaña">
      {["bg-background", "bg-primary"].map((fondo) => (
        <div key={fondo} className={`${fondo} flex items-end gap-3 rounded-xl border p-3`}>
          {[16, 32, 180].map((lado) => (
            // eslint-disable-next-line @next/next/no-img-element -- vista previa a tamaño exacto; next/image la reescalaría
            <img
              key={lado}
              src={url}
              alt=""
              width={lado}
              height={lado}
              style={{ width: lado, height: lado }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
```

> `leer()` dentro del efecto pone estado: si `react-hooks/set-state-in-effect` lo marca, sustituir
> por `useSyncExternalStore` suscrito al evento `input` del formulario, con
> `getSnapshot = () => campo?.value ?? null`.

### Paso 4 — La pantalla

- [ ] Escribir `src/app/(admin)/admin/configuracion/formulario-configuracion.tsx`:

```tsx
"use client";

import type { ReactNode } from "react";

import { BarraGuardar } from "@/components/panel/barra-guardar";
import { Campo, type PropsDeControl } from "@/components/panel/campo";
import { EditorHorario } from "@/components/panel/editor-horario";
import { FormularioPanel } from "@/components/panel/formulario-panel";
import { PestanasFormulario } from "@/components/panel/pestanas-formulario";
import { SelectorUbicacion } from "@/components/panel/selector-ubicacion";
import { SubidaImagen } from "@/components/panel/subida-imagen";
import { VistaFavicon } from "@/components/panel/vista-marca";
import { guardarConfiguracion } from "@/lib/acciones/configuracion";
import type { Dia, Tramo } from "@/lib/datos/reloj";
import { claveDeBorrador } from "@/lib/panel/borrador";
import { validarConfiguracion } from "@/lib/validaciones/configuracion-panel";

export type Ajuste = { clave: string; valor: unknown; descripcion: string };

const DOS_MB = 2 * 1024 * 1024;

export function FormularioConfiguracion({ ajustes }: { ajustes: Record<string, Ajuste> }) {
  const valor = (clave: string) => ajustes[clave]?.valor;
  const textoDe = (clave: string) =>
    typeof valor(clave) === "string" ? (valor(clave) as string) : "";
  const numeroDe = (clave: string) =>
    typeof valor(clave) === "number" ? String(valor(clave)) : "";
  const listaDe = (clave: string) =>
    Array.isArray(valor(clave)) ? (valor(clave) as string[]).join("\n") : "";

  /** Etiqueta, ayuda (la descripción de la base, sin PENDIENTE) y casilla de confirmar si hace falta. */
  function campo(clave: string, etiqueta: string, control: (p: PropsDeControl) => ReactNode) {
    const ajuste = ajustes[clave];
    const pendiente = ajuste?.descripcion.includes("PENDIENTE") ?? false;
    const ayuda = ajuste?.descripcion.replace(/\s*PENDIENTE[^.]*\./g, "").trim();
    return (
      <div
        className="flex flex-col gap-1"
        data-ajuste={clave}
        data-pendiente={pendiente || undefined}
      >
        {pendiente ? (
          <span className="bg-alerta/15 w-fit rounded-full px-2.5 py-0.5 text-xs font-semibold">
            Por confirmar
          </span>
        ) : null}
        <Campo nombre={clave} etiqueta={etiqueta} ayuda={ayuda}>
          {control}
        </Campo>
        {pendiente ? (
          <label className="flex min-h-11 items-center gap-2 text-sm">
            <input type="checkbox" name={`confirmar_${clave}`} className="size-5" />
            Este dato ya está confirmado con el negocio
          </label>
        ) : null}
      </div>
    );
  }

  const texto1 = (clave: string, etiqueta: string, extra: Record<string, string> = {}) =>
    campo(clave, etiqueta, (p) => <input {...p} {...extra} defaultValue={textoDe(clave)} />);
  const lineas = (clave: string, etiqueta: string) =>
    campo(clave, etiqueta, (p) => <textarea {...p} rows={4} defaultValue={listaDe(clave)} />);

  return (
    <FormularioPanel
      clave={claveDeBorrador("configuracion", "sitio")}
      accion={guardarConfiguracion}
      validar={validarConfiguracion}
    >
      <PestanasFormulario
        pestanas={[
          {
            valor: "contacto",
            titulo: "Contacto",
            campos: ["telefono", "whatsapp", "correo", "correo_alertas", "dias_aviso_vencimiento"],
            contenido: (
              <>
                {texto1("whatsapp", "WhatsApp de pedidos", { inputMode: "tel" })}
                {texto1("telefono", "Teléfono fijo", { inputMode: "tel" })}
                {texto1("correo", "Correo de contacto", { type: "email" })}
                {texto1("correo_alertas", "Correo para avisos de insumos", { type: "email" })}
                {campo("dias_aviso_vencimiento", "Días de aviso antes de vencer", (p) => (
                  <input
                    {...p}
                    type="number"
                    min={1}
                    max={90}
                    defaultValue={numeroDe("dias_aviso_vencimiento")}
                  />
                ))}
              </>
            ),
          },
          {
            valor: "ubicacion",
            titulo: "Ubicación",
            campos: [
              "direccion",
              "referencia",
              "distrito",
              "provincia",
              "departamento",
              "coordenadas",
            ],
            contenido: (
              <>
                {texto1("direccion", "Dirección")}
                {texto1("referencia", "Referencia")}
                {texto1("distrito", "Distrito")}
                {texto1("provincia", "Provincia")}
                {texto1("departamento", "Departamento")}
                <SelectorUbicacion
                  inicial={(valor("coordenadas") as { lat: number; lng: number } | null) ?? null}
                />
              </>
            ),
          },
          {
            valor: "horarios",
            titulo: "Horarios",
            campos: ["horario_semanal", "nota_horarios"],
            contenido: (
              <>
                <EditorHorario inicial={(valor("horario_semanal") as Record<Dia, Tramo[]>) ?? {}} />
                {texto1("nota_horarios", "Aclaración del horario")}
                <p className="text-muted-foreground text-sm">
                  La pregunta frecuente del horario repite las horas como texto. Si cambias el
                  horario, revísala en Contenido → Preguntas frecuentes.
                </p>
              </>
            ),
          },
          {
            valor: "pedidos",
            titulo: "Pedidos",
            campos: [
              "delivery_zonas",
              "delivery_costo",
              "pedido_minimo",
              "delivery_tiempo",
              "formas_pago",
            ],
            contenido: (
              <>
                {lineas("delivery_zonas", "Zonas de reparto (una por línea)")}
                {campo("delivery_costo", "Costo del delivery (S/)", (p) => (
                  <input {...p} inputMode="decimal" defaultValue={numeroDe("delivery_costo")} />
                ))}
                {campo("pedido_minimo", "Pedido mínimo (S/)", (p) => (
                  <input {...p} inputMode="decimal" defaultValue={numeroDe("pedido_minimo")} />
                ))}
                {texto1("delivery_tiempo", "Tiempo de entrega")}
                {lineas("formas_pago", "Formas de pago (una por línea)")}
              </>
            ),
          },
          {
            valor: "redes",
            titulo: "Redes",
            campos: ["facebook", "instagram"],
            contenido: (
              <>
                {texto1("facebook", "Facebook", {
                  inputMode: "url",
                  placeholder: "https://facebook.com/…",
                })}
                {texto1("instagram", "Instagram", {
                  inputMode: "url",
                  placeholder: "https://instagram.com/…",
                })}
                <p className="text-muted-foreground text-sm">
                  Si una red queda vacía, el pie del sitio no la muestra.
                </p>
              </>
            ),
          },
          {
            valor: "marca",
            titulo: "Marca",
            campos: [
              "nombre_comercial",
              "razon_social",
              "eslogan",
              "logo_url",
              "logo_alt",
              "isotipo_url",
              "favicon_url",
            ],
            contenido: (
              <>
                {texto1("nombre_comercial", "Nombre del negocio")}
                {texto1("razon_social", "Razón social")}
                {texto1("eslogan", "Eslogan")}
                <SubidaImagen
                  nombre="isotipo_url"
                  bucket="marca"
                  carpeta="isotipo"
                  rutaInicial={textoDe("isotipo_url")}
                  etiqueta="Dibujo del logo (cabecera del sitio)"
                  comprimir={false}
                  aceptar="image/svg+xml,image/png,image/webp"
                  maximoBytes={DOS_MB}
                />
                <SubidaImagen
                  nombre="logo_url"
                  bucket="marca"
                  carpeta="logo"
                  rutaInicial={textoDe("logo_url")}
                  etiqueta="Logo completo"
                  comprimir={false}
                  aceptar="image/png,image/webp"
                  maximoBytes={DOS_MB}
                />
                {texto1("logo_alt", "Texto del logo para quien no lo ve")}
                <SubidaImagen
                  nombre="favicon_url"
                  bucket="marca"
                  carpeta="favicon"
                  rutaInicial={textoDe("favicon_url")}
                  etiqueta="Icono de la pestaña del navegador"
                  comprimir={false}
                  aceptar="image/svg+xml,image/png"
                  maximoBytes={DOS_MB}
                />
                <VistaFavicon nombreCampo="favicon_url" />
              </>
            ),
          },
        ]}
      />
      <BarraGuardar volver="/admin" />
    </FormularioPanel>
  );
}
```

> Las descripciones de la base ya están escritas para quien edita (0008: «Número de WhatsApp con
> código de país…»). Algunas quedaron desfasadas con la normalización del panel —el WhatsApp ya no
> hay que escribirlo con 51—; si al revisar confunden, se corrigen con una migración de textos que
> siga la regla de 0018 (solo si nadie las cambió), no desde el componente.
>
> `SubidaImagen` en `marca` sube a carpetas propias (`favicon/…`): el archivo de fábrica en
> `public/marca/favicon.svg` se queda como está y sigue sirviendo mientras la ruta guardada empiece
> por `/` (`urlDeImagen` lo respeta).

- [ ] Escribir `src/app/(admin)/admin/configuracion/page.tsx`:

```tsx
import { Suspense } from "react";

import { EncabezadoPanel } from "@/components/panel/encabezado-panel";
import { exigirAcceso } from "@/lib/auth/sesion";
import { crearClienteServidor } from "@/lib/supabase/servidor";
import { CLAVES_EDITABLES } from "@/lib/validaciones/configuracion-panel";

import { FormularioConfiguracion, type Ajuste } from "./formulario-configuracion";

export default function Configuracion() {
  return (
    <>
      <EncabezadoPanel
        titulo="Configuración"
        descripcion="Los datos del negocio que se ven en todo el sitio. Se guardan todos a la vez."
      />
      <Suspense fallback={<p className="text-muted-foreground text-sm">Cargando…</p>}>
        <Formulario />
      </Suspense>
    </>
  );
}

async function Formulario() {
  await exigirAcceso("/admin/configuracion");
  const supabase = await crearClienteServidor();
  const { data, error } = await supabase
    .from("configuracion_sitio")
    .select("clave, valor, descripcion")
    .in("clave", CLAVES_EDITABLES as string[]);
  if (error) return <p role="alert">No se pudo cargar la configuración. Recarga la página.</p>;

  const ajustes: Record<string, Ajuste> = Object.fromEntries(data.map((a) => [a.clave, a]));
  return <FormularioConfiguracion ajustes={ajustes} />;
}
```

- [ ] Añadir `"/admin/configuracion"` a `RUTAS_DEL_PANEL`.

### Paso 5 — El favicon, desde la configuración

- [ ] En `src/app/layout.tsx`, sustituir `export const metadata: Metadata = { ... }` por la misma
      metadata fija más el favicon leído:

```tsx
import { obtenerConfiguracion } from "@/lib/datos/configuracion";
import { urlDeImagen } from "@/lib/supabase/publico";

const METADATA_FIJA: Metadata = {
  // ... todo lo que había en `metadata`, sin cambios
};

/**
 * El favicon es administrable (R21). `obtenerConfiguracion` está en `use cache`
 * con la etiqueta `marca`: no cuesta una consulta por página, y al guardar la
 * configuración el panel invalida la etiqueta y el <link rel="icon"> cambia.
 */
export async function generateMetadata(): Promise<Metadata> {
  const config = await obtenerConfiguracion();
  return {
    ...METADATA_FIJA,
    icons: {
      icon: urlDeImagen("marca", config.favicon_url) ?? "/marca/favicon.svg",
      apple: "/marca/apple-touch-icon.png",
    },
  };
}
```

- [ ] `pnpm build` → sin errores de prerender. Si Next se queja de datos sin caché en
      `generateMetadata`, confirmar que `obtenerConfiguracion` sigue con `"use cache"` (lo tiene).
- [ ] **Rendimiento (decisión 3):** el layout raíz cambia, así que se mide. En la misma sesión:
      `git stash`, `git checkout main`, `pnpm build`, `PASADAS=5 pnpm lighthouse` (anotar `/`);
      volver a la rama, `git stash pop`, `pnpm build`, `PASADAS=5 pnpm lighthouse`. La mediana de `/`
      no puede bajar más de 3 puntos. Anotar los dos números en el PR.
- [ ] Commit: `feat(configuracion): datos del negocio, horarios, pedidos y marca desde el panel`

### Paso 6 — En el navegador

- [ ] Escribir `e2e/panel-configuracion.spec.ts`:

```ts
import { expect, test } from "@playwright/test";

import { supabaseLocal } from "./ayudas/supabase-local";
import { entrarComo } from "./ayudas/sesion";
import { borrarUsuario } from "./ayudas/usuarios";

/**
 * Estas pruebas cambian la configuración real de la base local, que comparten
 * todas las pruebas del sitio. Cada una guarda el valor de antes y lo devuelve
 * en su `finally`, y el archivo corre en serie.
 */
test.describe.configure({ mode: "serial" });

async function leerAjuste(clave: string) {
  const { apiUrl, serviceRoleKey } = supabaseLocal();
  const r = await fetch(
    `${apiUrl}/rest/v1/configuracion_sitio?clave=eq.${clave}&select=valor,descripcion`,
    {
      headers: { apikey: serviceRoleKey, Authorization: `Bearer ${serviceRoleKey}` },
    },
  );
  const [fila] = (await r.json()) as { valor: unknown; descripcion: string }[];
  return fila!;
}

async function restaurarAjuste(clave: string, fila: { valor: unknown; descripcion: string }) {
  const { apiUrl, serviceRoleKey } = supabaseLocal();
  await fetch(`${apiUrl}/rest/v1/configuracion_sitio?clave=eq.${clave}`, {
    method: "PATCH",
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(fila),
  });
}

test("cambiar el WhatsApp cambia el botón de pedir del sitio sin redesplegar", async ({ page }) => {
  const antes = await leerAjuste("whatsapp");
  const usuario = await entrarComo(page, "administrador");
  try {
    await page.goto("/admin/configuracion");
    await page.getByLabel("WhatsApp de pedidos").fill("912 345 678");
    await page.getByRole("button", { name: "Guardar" }).click();
    await expect(page.getByText("Guardado. El sitio ya muestra los datos nuevos.")).toBeVisible();

    await page.goto("/contacto");
    await expect(page.locator('a[href^="https://wa.me/51912345678"]').first()).toBeAttached();
  } finally {
    await restaurarAjuste("whatsapp", antes);
    await borrarUsuario(usuario.id);
  }
});

test("confirmar un dato provisional le quita la etiqueta y baja el aviso del inicio", async ({
  page,
}) => {
  const antes = await leerAjuste("delivery_tiempo");
  const usuario = await entrarComo(page, "administrador");
  try {
    await page.goto("/admin");
    const aviso = page.locator('[data-aviso="pendientes"]');
    const cuantosAntes = Number((await aviso.textContent())?.match(/\d+/)?.[0] ?? 0);

    await page.goto("/admin/configuracion");
    await page.getByRole("tab", { name: "Pedidos" }).click();
    const ajuste = page.locator('[data-ajuste="delivery_tiempo"]');
    await expect(ajuste).toHaveAttribute("data-pendiente", "true");
    await ajuste.getByLabel("Este dato ya está confirmado con el negocio").check();
    await page.getByRole("button", { name: "Guardar" }).click();
    await expect(page.getByText("Guardado.")).toBeVisible();

    await page.reload();
    await page.getByRole("tab", { name: "Pedidos" }).click();
    await expect(page.locator('[data-ajuste="delivery_tiempo"]')).not.toHaveAttribute(
      "data-pendiente",
    );

    await page.goto("/admin");
    const cuantosDespues = Number(
      (
        await page
          .locator('[data-aviso="pendientes"]')
          .textContent()
          .catch(() => "0")
      )?.match(/\d+/)?.[0] ?? 0,
    );
    expect(cuantosDespues).toBe(cuantosAntes - 1);
  } finally {
    await restaurarAjuste("delivery_tiempo", antes);
    await borrarUsuario(usuario.id);
  }
});

test("un horario imposible se marca en la pestaña Horarios", async ({ page }) => {
  const usuario = await entrarComo(page, "administrador");
  try {
    await page.goto("/admin/configuracion");
    await page.getByRole("tab", { name: "Horarios" }).click();
    const lunes = page.locator('[data-dia="lunes"]');
    await lunes.getByLabel("Turno 1: abre").fill("13:00");
    await lunes.getByLabel("cierra").first().fill("04:00");
    await page.getByRole("tab", { name: "Contacto" }).click();
    await page.getByRole("button", { name: "Guardar" }).click();

    await expect(page.getByRole("tab", { name: /Horarios/ })).toHaveAttribute(
      "data-con-error",
      "true",
    );
    await expect(
      page.getByText("La hora de cierre tiene que ser después de la de apertura."),
    ).toBeVisible();
  } finally {
    await borrarUsuario(usuario.id);
  }
});

test("el ingeniero no entra a configuración", async ({ page }) => {
  const usuario = await entrarComo(page, "ingeniero");
  try {
    await page.goto("/admin/configuracion");
    await expect(page).toHaveURL("/admin?motivo=sin-acceso");
  } finally {
    await borrarUsuario(usuario.id);
  }
});

test("el sitio anuncia el favicon de la configuración", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator('link[rel="icon"]').first()).toHaveAttribute("href", /favicon/);
});
```

> Si el aviso de pendientes desaparece del todo al confirmar el último, `textContent()` sobre un
> localizador sin coincidencias espera y falla: por eso el `.catch(() => "0")`. Si se prefiere, contar
> con `await page.locator('[data-aviso="pendientes"]').count()` primero.
>
> La prueba del favicon **subido** (subir un PNG, guardar y ver el `href` nuevo) se deja para la
> revisión manual de T8: la foto de prueba es un PNG de 1200 × 800 y el bucket `marca` admite PNG,
> pero cambiar el favicon real en la base local lo cambia para las pruebas en paralelo de otros
> archivos. Si se quiere automatizar, hacerlo en este archivo serial con restauración en `finally`.

- [ ] Liberar el puerto 3000; `pnpm test:e2e e2e/panel-configuracion.spec.ts e2e/panel-accesibilidad.spec.ts`
      → PASS. Después la suite completa: las pruebas del sitio (pedido, horario, marca) no deben
      verse afectadas porque este archivo restaura cada valor.
- [ ] Comprobar a mano: subir un favicon PNG desde el panel, guardar, recargar el sitio en otra
      pestaña y ver el icono nuevo (el navegador cachea favicons: probar en una ventana privada).
- [ ] Commit: `test(configuracion): cambiar datos del negocio y verlos en el sitio`
- [ ] PR `feat/f4-t7-configuracion` → CI en verde → fusionar.

---

## Tarea 8 — Cierre: medir, llevar a producción, enseñar y documentar

**Rama:** `docs/f4-cierre` (y ninguna de código salvo lo que salga de medir)

**Qué deja hecho:** F4 medida contra lo que había antes de empezar, desplegada con sus cinco
migraciones y la tercera variable de entorno, con Marcos y Debra dados de alta **por el panel** en
producción, y documentada para que la siguiente sesión no tenga que reconstruir nada.

### Paso 1 — Medir contra antes de F4, el mismo día

Una línea base de rendimiento solo vale el día que se mide (trampa de `CLAUDE.md`). El commit de
antes de F4 es el último de F3.1 en `main`: `ae96d1b`.

- [ ] En la misma sesión y la misma máquina:

```bash
git stash
git checkout ae96d1b && pnpm install --frozen-lockfile && pnpm build
PASADAS=5 pnpm lighthouse            # anotar / , /productos y /contacto
git checkout main && pnpm install --frozen-lockfile && pnpm build
PASADAS=5 pnpm lighthouse            # los mismos tres
git stash pop
```

- [ ] Criterio (decisión 3): la mediana de rendimiento de cada ruta no baja más de **3 puntos**;
      accesibilidad ≥ 97 y SEO 100 en las tres. Si una ruta baja más, **no se cierra**: se busca qué
      tarea lo causó con el mismo procedimiento sobre los commits de fusión de T3 y T7, que son las
      dos que tocan código público.
- [ ] Contar las pruebas de verdad, no copiar números: `supabase test db` (pgTAP), `pnpm test`
      (Vitest) y `pnpm test:e2e` (Playwright). Anotar los tres totales.
- [ ] `grep -r "service_role\|SERVICE_ROLE" .next/static` → vacío.

### Paso 2 — Revisión a mano en un teléfono real

- [ ] Con la vista previa de Vercel del último PR, en un celular a 375 px y con datos móviles,
      recorrer con cada rol (superadmin, administrador, ingeniero):
  - [ ] Barra inferior y «Más»; la barra de guardar no tapa campos.
  - [ ] Crear un producto con dos presentaciones, **tomar una foto con la cámara**, publicarlo y
        verlo en `/productos`.
  - [ ] Cortar los datos a mitad de un formulario, volver y recuperar lo escrito.
  - [ ] Promoción: enviar como ingeniero, devolver y publicar como administrador.
  - [ ] Cambiar un horario y ver «Abierto ahora» del sitio con el horario nuevo.
  - [ ] Subir un favicon PNG y verlo en una ventana privada.
- [ ] Capturas de página completa del panel a 375 px y 1280 px en `DOC/Maquetas/4/capturas/`
      (inicio, productos, formulario de producto en sus tres pestañas, novedad en revisión,
      configuración). Compararlas con las maquetas aprobadas, **lado a lado**: la trampa del plan
      03.1 fue un bloque que ninguna prueba miraba.

### Paso 3 — Producción

- [ ] Vercel → Settings → Environment Variables: añadir `SUPABASE_SERVICE_ROLE_KEY` en **Production
      y Preview**, sin `NEXT_PUBLIC_`. Quedan tres variables.
- [ ] Supabase alojado → Authentication → Policies de contraseña: longitud mínima **10** (la del
      `config.toml` local). Si el alojado exige además símbolos, `generarClaveTemporal` no los pone:
      bajar el requisito o añadir un símbolo a la clave, con su prueba.
- [ ] Aplicar las migraciones **sin semillas**:

```bash
supabase migration list --linked      # 0026–0030 aparecen como pendientes
supabase db push --linked             # NUNCA --include-seed (CLAUDE.md)
supabase migration list --linked      # ya aplicadas
```

- [ ] Comprobar el contenido, no solo la lista (trampa del primer despliegue): con la llave `anon`,
      `productos_publicos` sigue devolviendo sus 34 filas, y `rpc/guardar_producto` sin sesión
      responde 401 o 403 (no 404: si da 404, la función no llegó).
- [ ] Redesplegar `main` en Vercel y abrir el sitio: portada, catálogo y contacto igual que antes.
- [ ] Entrar al panel de producción como superadmin y **crear desde el panel** las cuentas de
      Marcos (administrador) y Debra (ingeniero, o el rol que confirme el negocio). Entregar las
      contraseñas temporales en persona. Los repartidores se crean cuando exista F6: hoy no tendrían
      nada que ver.
- [ ] Con el negocio, desde el panel: confirmar o corregir los datos «Por confirmar» (teléfono fijo,
      costo y tiempo de delivery, pedido mínimo, formas de pago), asignar las tres fotos sueltas si
      corresponden a algún producto, y cargar Facebook e Instagram si ya existen.

### Paso 4 — Documentar

- [ ] `DOC/Avance del proyecto.md`: F4 cerrada con fecha; lo construido; las 12 decisiones del
      14/09/2026; los números medidos del paso 1; **el límite conocido de una hora** al desactivar
      a alguien (T6) y cómo acortarlo (`jwt_expiry`); lo que queda del negocio.
- [ ] `CLAUDE.md`:
  - Tabla de estado: F4 ✅ con su resumen y los números medidos.
  - «La base hoy» y «Verificación»: tablas, políticas, triggers y totales de pruebas nuevos.
  - Tabla de migraciones: filas `0026_autoria` a `0030_guardar_configuracion`, una línea cada una.
  - Despliegue: **tres** variables en Vercel, con `SUPABASE_SERVICE_ROLE_KEY` explicada, y quitarla
    de la lista de «no las lee ningún archivo todavía».
  - Arquitectura: el panel (`src/components/panel/`, `src/lib/panel/`, `ejecutarAccion`, la copia
    local) en un párrafo.
  - Trampas nuevas que hayan salido al ejecutar el plan (como mínimo: `<form action>` vacía el
    formulario en React 19; Radix Tabs desmonta campos sin `forceMount`; los controles de Radix no
    los restaura una copia local; la RLS no ve **qué valor** se escribe, por eso 0029).
- [ ] `DOC/Plan de Desarrollo 00`: F4 ✅; usuarios dentro de F4; auditoría movida a F7.
- [ ] `DOC/Plan de Desarrollo 03 - Frontend.md`: §5.1 (copia local), §5.5 (favicon con
      `generateMetadata`, no `icon.tsx`), §6 (pruebas del panel) y el umbral de rendimiento relativo.
- [ ] `DOC/Plan de Desarrollo 02`: sección breve de las migraciones 0026–0030.
- [ ] Este plan: marcar las casillas que se hicieron y anotar al final lo que resultó distinto.
- [ ] Enseñarle el panel al propietario con las cuentas reales.
- [ ] PR `docs/f4-cierre` → CI en verde → fusionar.

---

## Autorrevisión del plan

Hecha al terminar de escribirlo, contra lo acordado el 14/09/2026.

**Cobertura de lo decidido.** Cada decisión tiene tarea: usuarios (T6) y auditoría fuera (F7);
copia local (T2, y la usan T3–T7); rendimiento relativo (T3, T7 y T8 miden); foto de prueba propia
(T2, dibujada en el navegador en vez de guardada como binario: mismo fin, nada que mantener);
aviso y comentario de revisión (T4, migración 0028); contraseña temporal (T6); enfoque A sin
TanStack ni react-hook-form (todas); barra inferior (T1); pestañas con error marcado y fotos tras
guardar (T2, T3); el arreglo del rol superadmin (T6, migración 0029); el orden de tareas.

**Lo que el plan añade sin haberse preguntado, y por qué:**

- **0026, autoría sellada por la base.** Las columnas `created_by`/`updated_by` existían y nadie
  las llenaba; el aviso «promociones devueltas» del ingeniero (T4) necesita `created_by` fiable.
- **0027 y 0030, funciones que guardan en una transacción.** supabase-js no abre transacciones, y
  guardar un producto sin sus precios o media configuración son los dos fallos que un corte de
  señal en Iquitos haría reales.
- **Solo el superadmin elimina usuarios, también en la base** (0029). El doc 03 §5.2 lo decía; la
  RLS no lo imponía.
- **El favicon con `generateMetadata`** en vez de `app/icon.tsx` (T7): el favicon es SVG y
  `ImageResponse` no lo dibuja bien.

**Límites conocidos, declarados y no resueltos:**

- Desactivar a alguien no le quita una sesión ya abierta hasta **una hora** (`jwt_expiry`), porque
  el rol viaja en el token. Se documenta en T8; la salida es acortar el token, no cambiar la RLS.
- Una foto reemplazada se queda en el bucket. Limpieza de huérfanas: F7, si el espacio lo pide.
- El historial de precios se guarda pero no tiene pantalla en F4.
- No hay papelera: lo borrado se recupera desde el editor SQL (`deleted_at = null`).

**Revisado en el texto:** sin «TBD» ni pasos sin código; los nombres que usan unas tareas y
definen otras coinciden (`ejecutarAccion`, `EstadoAccion` con `extra`, `FormularioPanel` con
`validar`/`destino`/`alGuardar`, `SubidaImagen` con `maximoBytes`, `PropsDeControl`,
`CLASE_CONTROL`, `Interruptor`, `reordenar`, `moverFila`, `intencionEfectiva`); los nombres de
utilidades y funciones del código existente (`text-precio`, `font-heading`, `bg-cta-secundario`,
`DIAS`, `formatearPrecio`, `urlDeImagen`, `data-testid="error-ingreso"`) están comprobados contra el
repositorio a fecha de hoy.

**Lo que conviene vigilar al ejecutarlo**, porque el plan lo escribe sin haberlo corrido: el
comportamiento exacto de `z.flattenError` con errores anidados (T3, presentaciones), los códigos
de error que devuelve Postgres en las pruebas negativas de pgTAP (ajustar la prueba, nunca la
regla), y si `react-hooks/purity` o `set-state-in-effect` marcan algo de T2 y T7 (hay alternativa
escrita junto a cada caso). Ninguna regla de lint se desactiva para pasar.
