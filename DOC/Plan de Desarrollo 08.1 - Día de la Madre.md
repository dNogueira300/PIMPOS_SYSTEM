# Plan de Desarrollo 08.1 — Día de la Madre

Diseño acordado con Dan el 20/11/2026. Es la segunda temática del plan 08 (que montó la base y
Navidad). Arriba va el diseño y debajo, cuando esté, el plan de tareas. Maquetas en
`DOC/Maquetas/tematicas/dia-de-la-madre/`.

---

## 1. Para qué

Que el sitio público **salude a las mamás** en su día. Es un **saludo festivo, no una campaña de
venta** (Dan): lo central es el saludo, con la cuenta regresiva, y no empujar a encargar. Si el negocio
quiere sacar tortas, las añade desde el panel como en Navidad, pero la temática no depende de eso.

En Perú el Día de la Madre es el **segundo domingo de mayo**: el **9 de mayo de 2027**. Cae fuera de
la ventana de la práctica (set–nov 2026), así que la temática se deja **lista**: el negocio la ve en
el panel, con fechas de fábrica, y puede cambiarlas o encenderla a mano **cuando se acerque mayo**.

**Encenderla antes de tiempo** (decidido con Dan el 20/11/2026: la regla de cruces de 0047 no se toca).
Encender a mano vale «desde hoy hasta la fecha de fin», así que encender hoy el Día de la Madre lo
dejaría puesto del 20/11 al 10/05, encima de la Navidad, y la base lo rechaza («Las fechas se cruzan con
«Navidad»»). Apagar Navidad no lo arregla: sus fechas cuentan igual. Para enseñarla antes (una
demostración, la sustentación) se cambian **las fechas del propio Día de la Madre** a unos días que no
toquen diciembre (p. ej. del 20/11 al 25/11), y al terminar se le devuelven las suyas. Si alguien se
olvida, falla del lado seguro: el panel avisa de que las fechas pasaron y no se enciende. En producción
lo verían los clientes: para enseñarla sin público, la base local o las capturas. Va en
`docs/tematicas.md`.

## 2. Objetivos, lo que no entra y lo que lo haría fracasar

**Objetivos**

- Una temática `dia-de-la-madre` con dos estilos, como Navidad: **«Rosa sobre crema»** (puesto) y
  **«Todo en rosa»** (alterna). Los dos con los mismos adornos; cambian los colores.
- **Cada temática con sus propios estilos**, en la base y en el panel: el panel de una temática enseña
  solo los suyos, y la base no admite una combinación sin CSS (Navidad en «rosa», el Día de la Madre en
  «noche»).
- La cuenta regresiva y las frases dicen bien el nombre de la fiesta: «Faltan 3 días para **el** Día de
  la Madre», «¡Hoy es **el** Día de la Madre!». Navidad sigue sin artículo.
- Mismo listón que Navidad: axe en cero en las páginas públicas con los dos estilos, contrastes AA
  medidos, nada se anima con «menos movimiento», ningún adorno al imprimir, ninguno recibe clics ni
  tapa la cabecera, sin desborde a 375 px ni a 1280 px.

**No entra**

- Productos de temporada de fábrica. La temática nace **sin productos**; la pantalla de productos del
  panel ya sirve para añadirlos.
- Cambiar cómo se enciende una temática, las reglas de cruces o la caché: todo eso es del plan 08 y se
  reutiliza tal cual.
- Otras temáticas (San Juan, Fiestas Patrias…).
- Que el negocio diseñe estilos o elija colores: los estilos los crea el código.

**Lo haría fracasar** (aunque funcione)

- Que el saludo parezca un anuncio: botones de «encarga ya», urgencia o precios en primer plano.
- Que algo de Navidad se cuele en el Día de la Madre o al revés (el borde nevado, la nieve, las luces,
  los nombres «Noche de Navidad» en el panel del Día de la Madre).
- Que la base acepte un par temática-estilo sin CSS y el sitio salga a medio vestir.
- Una portada más lenta o un sitio que se mueve para quien pidió menos movimiento.

## 3. Lo decidido

**Por Dan (20/11/2026), sobre las maquetas:**

- **Saludo festivo**, no venta.
- **Estilo principal: «Rosa sobre crema»** = los colores de la dirección A (el crema de siempre, con
  vino y rosa en lugar del terracota) **con los banderines y los corazones de la dirección B**.
- **Estilo alterno: «Todo en rosa»** = la dirección B tal cual (fondo entero rosa empolvado, vino y
  dorado, banderines y corazones).
- **Cada temática con sus propios estilos, guardados como pares válidos en la base** (enfoque 1, ver §5).
- Aceptó mis propuestas de fechas, textos, banderines rosa palo, sin productos y el artículo en las
  frases (§4).

**Las maquetas:** `estilos-aprobados.jpg` y `estilos-aprobados.html` (los dos estilos), y
`direcciones-propuestas.html` (las tres de partida, A, B y C). En las maquetas los adornos se mueven
girando el SVG entero; eso es solo de la maqueta (ver §6.3).

## 4. La temática, con sus datos de partida

Los pone la migración (como 0047 con Navidad), sin autoría ni auditoría: es el estado de partida, no un
cambio de una persona (trampa de 0024).

| Campo            | Valor                                                                                   |
| ---------------- | --------------------------------------------------------------------------------------- |
| `slug`           | `dia-de-la-madre`                                                                       |
| `nombre`         | `Día de la Madre`                                                                       |
| `inicio` / `fin` | `2027-05-03` / `2027-05-10` (una semana antes y el día después; _llamada mía_)          |
| `fecha_evento`   | `2027-05-09` (segundo domingo de mayo)                                                  |
| `encendido`      | `fechas`                                                                                |
| `estilo`         | `rosa-crema`                                                                            |
| `texto_aviso`    | «Feliz Día de la Madre: gracias por todo, mamá»                                         |
| `mensajes_cinta` | «Feliz día, mamá», «Gracias por todo», «Delivery a todo Iquitos»                        |
| `titulo`         | «Feliz Día de la Madre» (la caligrafía cae sola en «Día de la Madre», que es el nombre) |
| `entradilla`     | «Gracias, mamá, por las mañanas de pan caliente. Hoy horneamos pensando en ti.»         |
| Productos        | ninguno                                                                                 |

Sin productos, la sección de temporada sale mientras haya cuenta regresiva (del 3 al 9) y desaparece
sola el 10, que es como ya funciona `SeccionTemporada` (no sale sin productos ni cuenta). Las fechas no
se cruzan con Navidad (01–26/12/2026).

## 5. Cómo se construye: los enfoques

1. **Cada temática con sus propios estilos — elegido por Dan.** La base admite solo los pares válidos
   (`navidad`: `noche`, `crema`; `dia-de-la-madre`: `rosa-crema`, `rosa`). En el código, los estilos van
   por temática, con nombre y ayuda; el panel enseña solo los de la temática que se edita y el Historial
   nombra cada uno. Ninguna vía (panel o API) puede guardar una combinación sin CSS. El coste: la
   migración reemplaza la restricción de 0048.
2. **Una lista común ampliada.** Añadir `rosa-crema` y `rosa` a la lista de 0048 y filtrar en el panel.
   Migración mínima, pero la base aceptaría Navidad en «rosa», sin CSS: una regla de formulario donde
   el proyecto pone las reglas en la base. Descartado.
3. **Una tabla de estilos en la base.** Un estilo sin su CSS no sirve, así que un catálogo editable se
   desincroniza del código (el mismo motivo por el que `roles` no admite escrituras). Descartado.

## 6. Diseño

### 6.1 Base (migración 0049)

- `tematicas_slug_conocido`: admite `'navidad'` y `'dia-de-la-madre'`.
- `tematicas_estilo_conocido` (0048) se reemplaza por una restricción de **pares**:
  `(slug = 'navidad' and estilo in ('noche','crema')) or (slug = 'dia-de-la-madre' and estilo in
('rosa-crema','rosa'))`. El nombre de la restricción nueva es del constructor; si cambia, hay que
  revisar dónde se traduce el error a una frase del panel.
- La fila del Día de la Madre (§4), con los triggers de autoría y auditoría apagados al insertarla,
  como 0019/0023.
- `guardar_tematica` no cambia: el estilo lo valida la restricción.
- Producción no carga semillas: la fila va en la migración. Va **sola en su PR** y se para hasta que
  Dan haga `supabase db push` (regla de F6).
- La prueba pgTAP de 0047 crea una temática de prueba (`prueba-0047`) con estilo `noche`: la
  restricción de pares la rechazaría, así que su arreglo se adapta (con un slug y un estilo admitidos,
  o con la restricción relajada solo dentro de la prueba).
- pgTAP: la fila existe con sus datos; Navidad con `rosa` y el Día de la Madre con `noche` se
  rechazan; los cuatro pares válidos se aceptan; las dos filas conviven sin cruce; con el Día de la
  Madre en sus fechas, `tematica_activa_id()` la devuelve y `tematica_publica` trae su estilo.

### 6.2 Código (sin cambios de base)

- **Estilos por temática** (`src/lib/tematicas/estilos.ts`): una definición por slug con sus estilos
  (valor, nombre, ayuda) y el estilo por defecto (`navidad` → `noche`, `dia-de-la-madre` →
  `rosa-crema`). Nombres y ayudas:
  - `rosa-crema` — «Rosa sobre crema»: «El crema de siempre, con vino y rosa en los botones y las
    franjas.»
  - `rosa` — «Todo en rosa»: «Todo el sitio sobre rosa empolvado, con vino y dorado.»
  - `noche` y `crema` conservan sus textos.
    `comoEstilo` pasa a recibir el slug (lo desconocido cae al estilo por defecto de esa temática).
- **Panel** (`formulario-tematica.tsx`, `[slug]/page.tsx`, `validaciones/tematica.ts`): la pestaña
  Estilo enseña solo los estilos de la temática; la validación Zod admite solo esos (con el slug), para
  que el error salga como frase y no como restricción de la base.
- **Sitio** (`src/lib/datos/tematica.ts`): `dia-de-la-madre` entra en `SLUGS_CON_DISENO`; los tipos de
  `slug` y `estilo` se amplían.
- **El nombre en una frase** (_llamada mía_, tras la revisión del diseño): junto a los estilos de cada
  temática, su artículo (`navidad` → ninguno, `dia-de-la-madre` → «el»), y dos ayudas que lo usan:
  «el Día de la Madre» y «del Día de la Madre» (con «de» + «el» → «del»; Navidad queda «Navidad» y «de
  Navidad»). Se usan **en todos los sitios donde el nombre va dentro de una frase**, no solo en la cuenta
  regresiva: la cuenta regresiva («Faltan 3 días para el Día de la Madre», «¡Hoy es el Día de la
  Madre!»), la etiqueta del panel «Fecha del Día de la Madre», el nombre de la región de la cinta
  «Mensajes del Día de la Madre» y el estado del producto en el panel «Solo se vende en el Día de la
  Madre». El `nombre` solo sigue en títulos y listas. Una temática sin entrada usa su `nombre` tal cual.
  Las pruebas de Navidad que buscan esos textos no cambian.
- **Historial** (`src/lib/auditoria/campos.ts`): `rosa-crema` → «Rosa sobre crema», `rosa` → «Todo en
  rosa». Los valores no se repiten entre temáticas, así que la tabla plana de etiquetas sigue sirviendo.

### 6.3 Aspecto (`src/estilos/tematicas.css`)

Todo bajo `[data-tematica="dia-de-la-madre"]`, con los tokens también en `:root:has(...)` y dentro de
`@media screen`, igual que Navidad (trampas de las temáticas). Ningún componente cambia de clases.

**Tokens de partida**, de las maquetas aprobadas. El constructor los ajusta lo justo para que
`tematicas.test.ts` mida AA en cada par, como en Navidad:

| Token / uso                 | Rosa sobre crema           | Todo en rosa            |
| --------------------------- | -------------------------- | ----------------------- |
| Fondo                       | el de siempre (`#f7f5f0`)  | `#fbeef0`               |
| Texto                       | el de siempre              | `#3a2228`               |
| Tarjetas                    | las de siempre             | `#ffffff`               |
| Titulares (`--primary`)     | `#8e2448`                  | `#5c1630`               |
| Botón principal (`--cta-*`) | `#8e2448` con blanco       | `#a8325a` con blanco    |
| Acento (caligrafía, sellos) | `#b0305a`                  | `#a8325a`               |
| Barra de aviso              | `#8e2448` con blanco       | `#5c1630` con `#f7d9a8` |
| Franja y cinta              | `#f6dbe1` con `#6e1a36`    | `#5c1630` con `#f7d9a8` |
| Cuenta regresiva (sello)    | `#fbeef2`, borde `#e3b3c2` | blanco, borde `#d9a3b3` |
| WhatsApp                    | el verde de siempre        | el verde de siempre     |

**Adornos (los mismos en los dos estilos; cambian los colores):**

- **Banderines bajo la cabecera**: un cordel ondulado (el `header::after`, con máscara y el color de un
  token, como el cable de las luces) y banderines triangulares en rosa, dorado y un tercer color (el
  `header::before`, SVG en data URI, repetido en horizontal). En «Rosa sobre crema» el tercero es **rosa
  palo con un borde fino** (el blanco de B no se ve sobre el crema); en «Todo en rosa», **blanco**. Dos
  banderines de cada baldosa llevan un corazón vino. _Llamada mía:_ **sin girar la tira entera** —en la
  maqueta gira el SVG y a 1280 px los extremos subirían ~30 px sobre la cabecera—; quietos o con un
  vaivén vertical de 1–2 px. La cabecera sigue sin `position: relative`.
- **Corazones que suben**: pocos y repartidos, en los dos seudoelementos de la envoltura (los que en
  Navidad son la nieve y los copos), en dos colores (rosa y dorado), con una máscara y el color de un
  token. Suben despacio y se mueven con `translate` sobre una capa una baldosa más alta que la pantalla,
  como los copos: sin repintar en cada fotograma. Por debajo de la cabecera (z-20), sin clics.
- **Borde de la sección de temporada**: el de Navidad es nieve (`.seccion-temporada::before`, hoy sin
  temática en el selector). _Llamada mía:_ se acota a Navidad y el Día de la Madre lleva **un festón de
  ondas, como el borde de un mantelito**, del color del fondo de la sección.
- **Cinta**: los separadores pasan de ✦ a ♥ (decorativos, sin leerse en voz alta, como hoy).
- Con `prefers-reduced-motion: reduce`, todo quieto; al imprimir, ningún adorno y la letra de la marca
  (los tokens van en `@media screen`).

Nada de Navidad aplica al Día de la Madre: las reglas de Navidad ya van acotadas a
`[data-tematica="navidad"]`, salvo el borde nevado, que se acota en este trabajo.

## 7. Pruebas

- **pgTAP** (0049): §6.1.
- **Vitest**: estilos por temática (opciones, por defecto, `comoEstilo` con slug), el nombre en una
  frase y la cuenta regresiva con artículo («Faltan 3 días para el Día de la Madre», «¡Hoy es el Día de
  la Madre!»), contrastes de los dos estilos nuevos en `tematicas.test.ts`, la validación por temática
  y las etiquetas del Historial.
- **E2E** `e2e/tematica-dia-de-la-madre.spec.ts`, en el proyecto `tematicas` (se añade a
  `PRUEBAS_DE_TEMATICAS`), encendiendo **desde el panel**:
  - la pestaña Estilo del Día de la Madre enseña solo «Rosa sobre crema» y «Todo en rosa» (y la de
    Navidad, solo las suyas);
  - el sitio lleva `data-tematica="dia-de-la-madre"` con cada estilo; la barra dice el aviso; la sección
    dice «Feliz Día de la Madre» y la cuenta regresiva con artículo; ningún adorno de Navidad (luces,
    bolas, nieve, borde nevado);
  - banderines y corazones: se mueven con movimiento, nada se anima con «menos movimiento», nada sale
    al imprimir, no reciben clics, no suben sobre la cabecera, sin desborde a 375 y 1280 px;
  - axe en cero en las 11 páginas públicas con los dos estilos y sin controles de menos de 44 px;
  - al pasar a «Según fechas» (fuera de mayo) el sitio vuelve a como estaba.
    La prueba enciende el Día de la Madre **con fechas propias cercanas a hoy** (como hace la de Navidad),
    sin mover Navidad. Si corre en diciembre, esas fechas se cruzarían con las de Navidad: entonces aparta
    antes por SQL las fechas de Navidad y las devuelve en el `finally`.
    Navidad y el Día de la Madre escriben filas distintas pero **no pueden estar encendidas a la vez**:
    las dos pruebas comparten cerrojo (el de `tematica-navidad` pasa a llamarse de forma general).
- Las E2E existentes de Navidad y del panel siguen pasando.

## 8. Lo que queda al constructor

- Los SVG de banderines, corazones y festón (formas, tamaños y separación), y los tokens finales que
  hagan pasar AA.
- Si los banderines llevan vaivén o van quietos (§6.3).
- El nombre de la restricción de pares y cómo se traduce su error en el panel.
- Cómo partir el trabajo en PR respetando la regla: la 0049 sola; lo que no lleva migración, de dos en
  dos como mucho.
- Manual (`docs/tematicas.md`), `AGENTS.md` (tabla de migraciones, temáticas y trampas) y capturas a
  375 y 1280 px con los dos estilos.

---

# Plan de tareas

> **Para quien lo ejecute:** como en F6 y F7, la sesión principal implementa
> (`superpowers:executing-plans`) y un subagente (opus) revisa la rama antes de cada PR; lo Importante
> se arregla con su prueba vista fallar primero. Los pasos van con casillas (`- [ ]`).

**Objetivo:** la temática `dia-de-la-madre`, con dos estilos y sus adornos, y cada temática con sus
propios estilos en la base y en el panel.

**Arquitectura:** un catálogo en el código (`src/lib/tematicas/disenos.ts`) dice qué temáticas tienen
diseño, sus estilos y su artículo; la base repite la misma lista como restricción de pares (0049). El
aspecto es CSS bajo `[data-tematica="dia-de-la-madre"]`, sin componentes nuevos.

**Stack:** Next 16, Postgres (Supabase) con pgTAP, Vitest, Playwright con axe.

**Spec:** la mitad de arriba de este documento.

## Restricciones de todo el plan

- Commits y PR **solo con Dan de autor**: nada de `Co-Authored-By: Claude`, `Claude-Session:` ni «Generated with Claude Code». Conventional Commits en español.
- **PR 1 = T1** (lleva la 0049), solo; se para hasta que Dan haga `supabase db push` desde `PIMPOS_SYSTEM` y fusione. **PR 2 = T2 + T3** (sin migración). Cada uno desde `main` actualizado.
- Los tokens de una temática van en `@media screen` y también en `:root:has([data-tematica=…][data-estilo=…])`.
- La cabecera es `sticky`: **nunca** `position: relative`. Ningún adorno recibe clics.
- Todo movimiento dentro de `prefers-reduced-motion: no-preference`; al imprimir, ningún adorno.
- Sin temática activa el HTML no cambia. Sin JavaScript para los adornos ni librerías nuevas.
- Textos en español y sin jerga. AA medido en `src/estilos/tematicas.test.ts`.
- E2E contra el build (`pnpm build` + `pnpm start`), liberando antes el puerto 3000; las de temáticas con `pnpm exec playwright test --project=tematicas --no-deps`.
- Una E2E enciende la temática **desde el panel**; el SQL solo prepara y limpia.

## Lo que más puede morder (y la prueba que lo fija)

1. **Guardar Navidad después de la 0049** sigue funcionando con sus dos estilos, y su panel enseña solo esos → T1, E2E del panel.
2. **Un estilo de otra temática que llega en el formulario** (manipulado o de un borrador viejo) → frase de Zod, no un error de la base → T1, Vitest de la validación.
3. **El negocio pone el Día de la Madre en diciembre** → la base dice «Las fechas se cruzan con «Navidad»» → T1, pgTAP.
4. **Un estilo nulo o desconocido desde la vista** → cae al estilo por defecto **de esa temática**, no a «noche» → T1, Vitest.
5. **Adornos de Navidad con el Día de la Madre** (luces, bolas, nieve, borde nevado) → no se ven → T3, E2E.

---

### Tarea 1: Cada temática con sus estilos, y la fila del Día de la Madre (0049) — PR 1

**Archivos:**

- Crear: `supabase/migrations/0049_dia_de_la_madre.sql`, `supabase/tests/0049_dia_de_la_madre.test.sql`, `src/lib/tematicas/disenos.ts`, `src/lib/tematicas/disenos.test.ts`
- Modificar: `supabase/tests/0047_tematicas.test.sql` (fixture), `src/lib/tematicas/estilos.ts` (+ test), `src/lib/validaciones/tematica.ts` (+ test), `src/app/(admin)/admin/contenido/tematicas/[slug]/page.tsx`, `…/[slug]/formulario-tematica.tsx`, `src/lib/datos/tematica.ts`, `src/lib/auditoria/campos.ts`, `src/tipos/database.types.ts` (regenerado), `e2e/panel-tematicas.spec.ts`, `AGENTS.md` (tabla de migraciones)

**Interfaces:**

- Produce (`src/lib/tematicas/disenos.ts`, sin dependencias):
  - `DISENOS: Record<SlugConDiseno, { articulo: "" | "el"; estilos: readonly OpcionEstilo[] }>`; el primer estilo de cada lista es el de por defecto.
  - `type SlugConDiseno = "navidad" | "dia-de-la-madre"`, `SLUGS_CON_DISENO: readonly SlugConDiseno[]`, `esSlugConDiseno(s: string | null | undefined): s is SlugConDiseno`.
  - `type OpcionEstilo = { valor: Estilo; nombre: string; ayuda: string }`.
- Produce (`src/lib/tematicas/estilos.ts`): `ESTILOS = ["noche", "crema", "rosa-crema", "rosa"] as const`, `type Estilo`, `opcionesDeEstilo(slug: string): readonly OpcionEstilo[]` (`[]` si no tiene diseño), `comoEstilo(slug: string, valor: string | null | undefined): Estilo`, `esEstiloDe(slug: string, estilo: string): boolean`. `OPCIONES_DE_ESTILO` desaparece.
- Produce (base): restricción `tematicas_estilo_de_su_tematica`; fila `dia-de-la-madre`.

- [ ] **Paso 1: pgTAP que falla** — `0049_dia_de_la_madre.test.sql`:
  - la fila existe: `nombre = 'Día de la Madre'`, `inicio = '2027-05-03'`, `fin = '2027-05-10'`, `fecha_evento = '2027-05-09'`, `estilo = 'rosa-crema'`, `encendido = 'fechas'`, `cardinality(mensajes_cinta) = 3`, título y aviso de §4, sin filas en `tematica_productos`;
  - `throws_ok` 23514: `navidad` con `rosa`; `dia-de-la-madre` con `noche`; `dia-de-la-madre` con `neon`;
  - `lives_ok`: `navidad` con `crema` y con `noche`; `dia-de-la-madre` con `rosa` y con `rosa-crema`;
  - `throws_ok` P0001, con un mensaje que contiene `Navidad`, al poner el Día de la Madre del 2026-12-05 al 2026-12-10 (Navidad en sus fechas de fábrica);
  - con las fechas del Día de la Madre alrededor de hoy (y Navidad apartada), `app.tematica_activa_id()` es la suya y `tematica_publica.estilo = 'rosa-crema'`;
  - la fila no dejó autoría (`created_by is null`) ni filas en la auditoría.
- [ ] **Paso 2:** `supabase test db supabase/tests/0049_dia_de_la_madre.test.sql` → falla (no existe la fila).
- [ ] **Paso 3: la migración.** Amplía `tematicas_slug_conocido` (drop + add) a `('navidad','dia-de-la-madre')`; borra `tematicas_estilo_conocido` y crea `tematicas_estilo_de_su_tematica` con los pares de §6.1; inserta la fila de §4 con los triggers de autoría (`tematicas_sellar_autoria`) y de auditoría apagados y vueltos a encender, como 0019/0023. Cabecera comentada como las demás.
- [ ] **Paso 4: el arreglo de 0047.** En su fixture, además de `tematicas_slug_conocido`, `drop constraint tematicas_estilo_de_su_tematica` (la temática de prueba no tiene diseño). Aparta también el Día de la Madre si sus fechas de prueba pudieran cruzarse.
- [ ] **Paso 5:** `supabase db reset` (luego `bash supabase/seeds/imagenes/subir-imagenes.sh`) y `supabase test db` → **todas** pasan (0047, 0048 y 0049 incluidas).
- [ ] **Paso 6:** `pnpm supabase:tipos`.
- [ ] **Paso 7: Vitest que falla.**
  - `disenos.test.ts`: `SLUGS_CON_DISENO` es `["navidad", "dia-de-la-madre"]`; los valores de estilo no se repiten entre temáticas; la unión de los estilos es `ESTILOS`.
  - `estilos.test.ts`: `opcionesDeEstilo("dia-de-la-madre").map((o) => o.nombre)` es `["Rosa sobre crema", "Todo en rosa"]`, el de Navidad `["Noche de Navidad", "Crema navideña"]`, `opcionesDeEstilo("san-juan")` es `[]`; `comoEstilo("dia-de-la-madre", null)` y `comoEstilo("dia-de-la-madre", "noche")` son `"rosa-crema"`; `comoEstilo("navidad", "neon")` es `"noche"`; `esEstiloDe("navidad", "rosa")` es `false`.
  - `tematica.test.ts` (validación): con `slug: "dia-de-la-madre", estilo: "noche"` falla en `estilo` con «Elige uno de los estilos de esta temática.»; con `estilo: "rosa"` pasa.
- [ ] **Paso 8:** `pnpm test` → fallan esas.
- [ ] **Paso 9: el código.**
  - `disenos.ts` con los nombres y ayudas de §6.2 (artículos: Navidad `""`, Día de la Madre `"el"`); `estilos.ts` sobre `DISENOS`.
  - Validación: el esquema recibe `slug` (campo oculto `slug` en el formulario, leído en `leerTematica`) y un `refine` con `esEstiloDe` y la frase del paso 7.
  - Panel: `TematicaEditable` lleva `slug`; la pestaña Estilo pinta `opcionesDeEstilo(tematica.slug)`; `page.tsx` usa `comoEstilo(slug, t.estilo)`.
  - `datos/tematica.ts`: `SLUGS_CON_DISENO` y `comoEstilo` salen del catálogo.
  - `campos.ts`: `"rosa-crema": "Rosa sobre crema"`, `rosa: "Todo en rosa"`.
  - El comentario de `estilos.ts` deja de nombrar `tematicas_estilo_conocido`.
- [ ] **Paso 10:** `pnpm typecheck`, `pnpm lint`, `pnpm test` → en verde.
- [ ] **Paso 11: E2E del panel** (`panel-tematicas.spec.ts`, prueba nueva): como administrador, en `/admin/contenido/tematicas/dia-de-la-madre` la pestaña Estilo tiene exactamente los radios «Rosa sobre crema» y «Todo en rosa»; en la de Navidad, exactamente «Noche de Navidad» y «Crema navideña»; elegir «Todo en rosa» y guardar deja `estilo = 'rosa'` (por `sqlLocal`), y al final se devuelve a `rosa-crema`. La lista enseña las dos temáticas. Verla fallar contra un build sin el paso 9; después, pasar todas las E2E de temáticas.
- [ ] **Paso 12:** `AGENTS.md`: fila `0049_dia_de_la_madre` en la tabla de migraciones y la cuenta de migraciones. Revisión de la rama por un subagente y arreglos. Commit `feat(tematicas): cada temática con sus estilos y el Día de la Madre (0049)`, PR 1 y **parar**.

### Tarea 2: El nombre de la fiesta dentro de una frase — PR 2

**Archivos:**

- Crear: `src/lib/tematicas/nombre.ts`, `src/lib/tematicas/nombre.test.ts`
- Modificar: `src/lib/tematicas/cuenta-regresiva.test.ts`, `src/lib/tematicas/estado.test.ts`, `src/app/(public)/page.tsx`, `src/components/publico/tematica/cinta-tematica.tsx`, `…/tematicas/[slug]/formulario-tematica.tsx`, `src/app/(admin)/admin/contenido/productos/[id]/page.tsx`

**Interfaces:**

- Consume: `DISENOS`, `esSlugConDiseno` (T1).
- Produce: `nombreEnFrase(slug: string, nombre: string): string` («el Día de la Madre», «Navidad»; el `nombre` tal cual si el slug no tiene diseño) y `nombreConDe(slug: string, nombre: string): string` («del Día de la Madre», «de Navidad»). `CintaTematica` recibe `slug` además de `nombre`.

- [ ] **Paso 1: Vitest que falla.**
  - `nombre.test.ts`: los cuatro casos de arriba, más `nombreEnFrase("san-juan", "San Juan")` = `"San Juan"` y `nombreConDe("san-juan", "San Juan")` = `"de San Juan"`.
  - `cuenta-regresiva.test.ts`: con `nombreEnFrase("dia-de-la-madre", "Día de la Madre")` como evento, el 2027-05-06 da «Faltan 3 días para el Día de la Madre», el 2027-05-08 «Falta 1 día para el Día de la Madre» y el 2027-05-09 «¡Hoy es el Día de la Madre!».
  - `estado.test.ts`: `avisoSoloTemporada([{ nombre: "Navidad", activa: false }, { nombre: "el Día de la Madre", activa: true }])` = «Solo se vende en Navidad y el Día de la Madre · hoy se ve en el sitio» (la función no cambia: recibe ya el nombre en frase).
- [ ] **Paso 2:** `pnpm test` → falla (no existe `nombre.ts`).
- [ ] **Paso 3: el código.** `nombre.ts` sobre `DISENOS` («de» + «el» → «del»). La portada pasa `nombreEnFrase(tematica.slug, tematica.nombre)` a `cuentaRegresivaDeHoy`; la cinta, `aria-label` = «Mensajes » + `nombreConDe(slug, nombre)`; el formulario, «Fecha » + `nombreConDe(tematica.slug, tematica.nombre)`; la ficha de producto selecciona también `tematicas(nombre, slug)` y pasa `nombreEnFrase(slug, nombre)` a `avisoSoloTemporada`.
- [ ] **Paso 4:** `pnpm typecheck`, `pnpm lint`, `pnpm test` → en verde. Los textos de Navidad («Mensajes de Navidad», «Fecha de Navidad», «Faltan 12 días para Navidad») no cambian: lo vigilan las E2E existentes, que se corren en T3.
- [ ] **Paso 5:** commit `fix(tematicas): el nombre de la fiesta con su artículo en las frases`.

### Tarea 3: El Día de la Madre en el sitio — PR 2

**Archivos:**

- Modificar: `src/estilos/tematicas.css`, `src/estilos/tematicas.test.ts`, `playwright.config.ts` (`PRUEBAS_DE_TEMATICAS`), `e2e/tematica-navidad.spec.ts` y `e2e/panel-tematicas.spec.ts` (cerrojo y ayudas), `docs/tematicas.md`, `AGENTS.md`, este documento («Lo que resultó distinto»)
- Crear: `e2e/tematica-dia-de-la-madre.spec.ts`, `e2e/ayudas/tematicas.ts`, capturas en `DOC/Maquetas/tematicas/dia-de-la-madre/implementada/`

**Interfaces:**

- Consume: `opcionesDeEstilo` (T1), `nombreEnFrase` (T2).
- Produce: tokens `--cordel-banderines`, `--corazones-1`, `--corazones-2` (y los semánticos de globals.css) bajo `[data-tematica="dia-de-la-madre"][data-estilo="rosa-crema" | "rosa"]`.

- [ ] **Paso 1: Vitest que falla.** En `tematicas.test.ts`, `tokensDe` recibe la temática y el estilo, y se añaden los pares de los dos estilos nuevos al nivel de los de Navidad: texto sobre fondo y sobre tarjetas, titulares, botón, barra de aviso, franja, acento y sello de la cuenta regresiva, todos ≥ `AA.texto`. Correr: falla (no están los bloques).
- [ ] **Paso 2: tokens** de §6.3 en `tematicas.css`, en `@media screen` y con `:root:has(...)`, ajustados lo justo hasta que pase el paso 1.
- [ ] **Paso 3: E2E que falla** — `tematica-dia-de-la-madre.spec.ts`, en el proyecto `tematicas` (añadirla a `PRUEBAS_DE_TEMATICAS`) y con el cerrojo común (renombrar `"tematica-navidad"` a `"tematicas"` en las tres pruebas). Sigue la estructura de `tematica-navidad.spec.ts`: guarda lo de fábrica y enciende desde el panel con fechas `dia(1)`–`dia(6)` y evento `dia(3)`; si alguna cae entre el 1 y el 26/12, aparta antes por SQL las fechas de Navidad y las devuelve en el `finally`. Comprueba:
  - `[data-tematica="dia-de-la-madre"][data-estilo="rosa-crema"]`; la barra dice el aviso de §4; la región «Mensajes del Día de la Madre»; la sección con «Feliz Día de la Madre» y «Faltan 3 días para el Día de la Madre»;
  - banderines (`header::before`, `header::after`) y corazones (`::before` y `::after` de la envoltura) se animan con movimiento; con `reducedMotion: "reduce"`, nada animado en la página; con `media: "print"`, ningún adorno visible; ninguno recibe clics; nada sobre la cabecera; sin desborde a 375 y 1280 px;
  - ningún adorno de Navidad: `.adornos-tematica` con `display: none`, y `.seccion-temporada::before` con el festón, no con la nieve;
  - axe en cero en las 11 rutas a 375 px y en escritorio, con los dos estilos; ningún control de menos de 44 px en la sección;
  - «Según fechas» con sus fechas de fábrica → sin `data-tematica`.
    Las ayudas que corren en el navegador (`leerAdornos`, `listarAnimados`, `listarAdornosVisibles`) pasan a `e2e/ayudas/tematicas.ts`, generalizadas, y las usan las dos pruebas. Correr contra un build sin el CSS de adornos: falla.
- [ ] **Paso 4: adornos** en `tematicas.css`, bajo `[data-tematica="dia-de-la-madre"]`:
  - banderines: cordel en `header::after` (máscara y `--cordel-banderines`); banderines en `header::before`, una baldosa SVG por estilo; el tercer color, rosa palo con borde en `rosa-crema` y blanco en `rosa`; dos de cada baldosa con corazón vino; sin girar la tira;
  - corazones en los seudoelementos de la envoltura, una máscara por capa con `--corazones-1` y `--corazones-2`, subiendo con `translate` sobre una capa una baldosa más alta, como los copos;
  - festón en `.seccion-temporada::before`, y el borde nevado actual acotado a `[data-tematica="navidad"]`;
  - ♥ en `.cinta-tematica li::before` (`content: "♥" / ""`);
  - movimiento solo con `no-preference`; todo en el `@media print`.
- [ ] **Paso 5:** build y E2E de temáticas enteras (las de Navidad y del panel siguen pasando) → en verde. `pnpm typecheck`, `pnpm lint`, `pnpm test`.
- [ ] **Paso 6: capturas** a 375 y 1280 px, con los dos estilos, encendiendo desde el panel; mirarlas. Después, el Día de la Madre y Navidad en «Según fechas», con sus fechas y estilos de fábrica.
- [ ] **Paso 7: documentación.** `docs/tematicas.md`: el Día de la Madre, sus estilos y cómo encenderla antes de tiempo (§1). `AGENTS.md`: temáticas (lo que hay y cómo se añade una, ahora con `disenos.ts`) y una trampa si sale alguna. Este documento: «Lo que resultó distinto».
- [ ] **Paso 8:** revisión de la rama por un subagente; arreglos con su prueba vista fallar. Commits `feat(tematicas): el Día de la Madre en el sitio, con sus dos estilos` y `docs(tematicas): …`; PR 2 y parar.
