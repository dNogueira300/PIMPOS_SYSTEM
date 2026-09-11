# PIMPOS_SYSTEM

Plataforma web y panel de gestión para **Panadería Pimpo's E.I.R.L.** (Iquitos, Perú).
Reúne el sitio público del negocio (productos, novedades, galería, ubicación y contacto) y un
panel interno para administrar contenido, kárdex de insumos y fichas de clientes de delivery.
Construido con Next.js y Supabase (Postgres + Auth + Storage + RLS).

> ⚠️ **Nunca se commitea `.env.local` ni la `service_role key`.** Esa llave salta toda la RLS:
> vive solo en variables de entorno del servidor y en el gestor de contraseñas. Si una variable no
> lleva el prefijo `NEXT_PUBLIC_`, no llega al navegador — esa es la regla que evita el accidente caro.

---

## Requisitos

| Herramienta    | Versión                       | Comprobación                         |
| -------------- | ----------------------------- | ------------------------------------ |
| Node.js        | 24 LTS (22 LTS también sirve) | `node -v`                            |
| pnpm           | 12.3.4                        | `pnpm -v`                            |
| Supabase CLI   | 2.116.0                       | `pnpm dlx supabase@latest --version` |
| Docker Desktop | reciente                      | `docker --version`                   |
| Git            | cualquiera reciente           | `git --version`                      |

pnpm se activa con **corepack**, nunca con `npm -g`:

```bash
corepack enable
corepack prepare pnpm@12.3.4 --activate
```

Docker Desktop es obligatorio porque el desarrollo se hace contra una instancia local de Supabase
(opción A del plan). Extensiones recomendadas de VS Code: ESLint, Prettier, Tailwind CSS
IntelliSense y Playwright.

---

## Puesta en marcha local

```bash
git clone https://github.com/dNogueira300/PIMPOS_SYSTEM.git
cd PIMPOS_SYSTEM

cp .env.example .env.local     # en PowerShell: Copy-Item .env.example .env.local

supabase start                 # levanta Postgres, Auth y Storage en Docker
supabase status                # imprime la API URL y las llaves locales
supabase db reset              # reconstruye la base desde migraciones + semillas

pnpm install                   # dependencias (activa los hooks de git via husky)
pnpm dev                       # http://localhost:3000
```

`supabase start` no toca el proyecto remoto: monta el entorno completo en contenedores, así que se
puede trabajar sin internet y reiniciar de cero cuando haga falta. Necesita **~4 GB de RAM libres**
y que Docker Desktop esté corriendo.

Los valores que imprime `supabase status` (API URL, `anon key`, `service_role key`) son los que van
en `.env.local` para desarrollo local. Las llaves del proyecto de producción no se copian aquí.

### Scripts

| Script                | Qué hace                                                       |
| --------------------- | -------------------------------------------------------------- |
| `pnpm dev`            | Servidor de desarrollo                                         |
| `pnpm build`          | Build de producción                                            |
| `pnpm typecheck`      | `next typegen` + `tsc --noEmit`                                |
| `pnpm lint`           | ESLint (`lint:fix` corrige lo que puede)                       |
| `pnpm format`         | Prettier sobre todo el repo (`format:check` solo comprueba)    |
| `pnpm test`           | Vitest: lógica de negocio pura (`test:watch` en modo continuo) |
| `pnpm test:e2e`       | Playwright: flujos completos, a 375 px y escritorio            |
| `pnpm supabase:tipos` | Regenera `src/tipos/database.types.ts` desde la base local     |

El hook `pre-commit` (husky) corre `typecheck` y `lint-staged` antes de cada commit: un commit que
no compila no entra.

### Dos versiones que no son las del plan, y por qué

- **TypeScript 5.9.3, no 7.** `typescript-eslint` (lo que usa `eslint-config-next/typescript`)
  declara `typescript <6.1`. Es exactamente el caso previsto en el documento de stack: se fija la
  5.9 en `devDependencies` hasta que el ecosistema alcance a la 7. No afecta al código.
- **ESLint 9.39.5, no 10.** `eslint-plugin-react` llega hasta `^9.7`; con la 10 revienta al
  cargar reglas (`context.getFilename` ya no existe). `create-next-app` fija `^9` por lo mismo.

Cuando alguna de las dos se destrabe, se sube en un PR propio y se borra esta nota.

---

## Migraciones

Las migraciones viven en `supabase/migrations/` con numeración correlativa: `0001_extensiones.sql`,
`0002_comunes.sql`, `0003_roles_perfiles.sql`, y así sucesivamente.

> **Regla dura: una migración ya aplicada nunca se edita. Se corrige con una migración nueva.**
> Editar una migración aplicada deja las bases de cada entorno en estados distintos y sin forma de
> reconciliarlos.

Además, ninguna tabla se crea sin su política RLS en la misma migración.

```bash
# Crear una migración nueva
supabase migration new nombre_descriptivo

# Aplicarlas en local (reconstruye desde cero: migraciones + semillas)
supabase db reset

# Aplicarlas al proyecto remoto
supabase db push
```

Después de cualquier cambio de esquema hay que regenerar los tipos de TypeScript:

```bash
supabase gen types typescript --local > src/tipos/database.types.ts
```

---

## Pruebas

```bash
supabase test db                         # 347 pruebas pgTAP
bash scripts/verificar-fase0.sh          # verificación funcional contra el Docker local
bash scripts/verificar-storage.sh        # las políticas de Storage, con JWT de usuario real
bash scripts/verificar-sitio-publico.sh  # el camino del navegador: PostgREST + vistas + bucket
bash scripts/verificar-produccion.sh     # solo lectura, contra el proyecto alojado
```

Los tres guiones intermedios corren también en el CI, y existen porque hay cosas que una consulta
SQL no prueba. **Que un archivo del bucket `clientes` no se descargue lo decide la API de Storage**,
no una fila: una comprobación en SQL diría que la fila es visible, no que el archivo salga. Y entre
una vista consultada con `set role anon` dentro de una transacción y lo que ve un visitante hay tres
piezas más —PostgREST, los permisos de la vista y el bucket público— que ninguna prueba en SQL
ejerce.

Un aviso sobre las comprobaciones negativas, que costó descubrir: tienen que exigir el **fallo
concreto**. Cuatro pruebas de Storage daban OK comparando "distinto de 200", y una petición que ni
llega a salir también es distinta de 200.

`scripts/verificar-fase0.sh` cubre las comprobaciones de cierre que se pueden probar en local
(doc 01 §10): que la API responde, que las extensiones están activas, que el registro público está
cerrado **sin haber apagado el proveedor de correo**, que el rol viaja dentro del JWT y que el
bucket `clientes` es realmente privado. Crea y borra sus propios datos de prueba. Las otras cuatro
comprobaciones (keep-alive, CI, backup remoto y dominio) se verifican en GitHub.

**Un hueco declarado, no cubierto.** Las imágenes semilla no viven en este repositorio: están en la
carpeta del cliente y se suben con `supabase/seeds/imagenes/subir-imagenes.sh`. En el CI los buckets
están vacíos, así que las comprobaciones que miran si una foto **se ve** se saltan diciendo por qué,
en vez de fallar o de darse por buenas. Localmente, con las imágenes subidas, sí se ejecutan.

`scripts/verificar-produccion.sh` repite las que solo significan algo contra el proyecto alojado, y
no escribe nada. Hace falta porque **el entorno local miente en un punto concreto**: no valida la
apikey en `/rest/v1/`, así que devuelve 200 con cualquier llave. Necesita `SUPABASE_URL` y
`SUPABASE_ANON_KEY` exportadas; con `PIMPOS_CORREO` y `PIMPOS_CLAVE` de un usuario real comprueba
además que el hook del JWT está registrado en el panel.

Las pruebas de RLS son parte de la definición de "hecho" para todo lo que toque la base.

**Vitest** (`pnpm test`) cubre la lógica de negocio pura: conversión de unidades, cálculo de
saldos, formato de moneda, enlaces `wa.me`, slugs. Las pruebas viven junto al código, como
`src/lib/utilidades/slug.test.ts`.

**Playwright** (`pnpm test:e2e`) cubre los flujos críticos de usuario, en `e2e/`. Corre Chromium en
dos tamaños: móvil a 375 px (el panel se usa desde el celular en campo) y escritorio. Levanta
`pnpm dev` por su cuenta; solo hace falta `pnpm exec playwright install chromium` la primera vez.

> **Las E2E ignoran `.env.local` a propósito.** Sacan la URL y las llaves de `supabase status`, así
> que siempre corren contra la instancia local. Estas pruebas **crean y borran usuarios**: si el
> `.env.local` de alguien apuntara al proyecto alojado, la suite daría de alta usuarios de prueba
> en producción. Como efecto secundario, funcionan en el CI sin preparar nada, porque `.env.local`
> no se versiona. Lo único que necesitan es `supabase start` corriendo.

---

## Usuarios

Los usuarios **no se crean por migración**: `auth.users` es de GoTrue, su esquema cambia entre
versiones, y las contraseñas iniciales quedarían en el historial de Git para siempre.

1. En el panel de Supabase, _Authentication → Users → Add user_: correo y contraseña. Marcar
   **Auto Confirm User**, o la cuenta no podrá iniciar sesión hasta confirmar por correo.
2. El trigger de la migración `0005` crea la fila en `perfiles` automáticamente, **inactiva**. Es
   deliberado: el rol por defecto sería `repartidor`, que lee la tabla `clientes` con direcciones y
   fotos de domicilios; nadie accede a datos personales porque quien creó la cuenta se distrajo.
3. Asignar el rol y activar desde el **SQL Editor**, por correo, sin copiar UUID:

   ```sql
   update public.perfiles p
      set rol = 'ingeniero', nombre_completo = 'Marcos', activo = true
     from auth.users u
    where u.id = p.id and u.email = 'correo@ejemplo.com';
   ```

Roles válidos: `superadmin`, `administrador`, `ingeniero`, `repartidor`.

**El segundo paso no se puede saltar, y es a propósito.** Ningún metadato concede el rol: una
cuenta recién creada entra pero su JWT sale sin `rol`, así que la RLS le niega todo. Si el trigger
asignase un rol por defecto sería `repartidor`, que lee la tabla `clientes` con direcciones y fotos
de domicilios (R19) — nadie debe alcanzar datos personales porque quien creó la cuenta se distrajo.

Para dar de baja a alguien basta `activo = false`: conserva la fila y su rastro en auditoría, y
pierde los permisos en cuanto renueve el token.

---

## Sistema de diseño

Tokens en tres capas, todos en `src/estilos/globals.css` (Tailwind 4 se configura por CSS, no por
`tailwind.config`):

| Capa       | Prefijo                      | Para qué                                                           |
| ---------- | ---------------------------- | ------------------------------------------------------------------ |
| Primitivos | `--pimpos-*`                 | Los colores crudos, sacados del logo y las fotos del local         |
| Semánticos | `--background`, `--primary`… | Qué significa cada color. Son los nombres que ya consume shadcn/ui |
| Componente | `--cta-*`, `--precio-texto`… | Lo que una pieza concreta necesita y no se deduce de la capa 2     |

**Ningún componente usa un primitivo directamente.** Reutilizar los nombres semánticos de shadcn en
vez de inventar otros propios hace que toda la librería quede tintada con la marca sin editar un
solo componente.

### El dorado tiene dos valores, y no es redundancia

- `--pimpos-dorado-500` (`#C8801F`) **solo como fondo**, con tinta encima (5.34). Con blanco da
  3.20 y no pasa AA.
- `--pimpos-dorado-700` (`#8F5A10`) para texto, precio, icono o enlace (5.06 sobre crema).

El plan original decía que bastaba con reservar `#C8801F` para texto de 18 px o más. Medido, da
**2.80**: tampoco llega al umbral de texto grande. Por eso existe el segundo valor.

### Los contrastes no se afirman, se miden

`src/estilos/paleta.test.ts` lee `globals.css`, extrae los primitivos y comprueba cada par
documentado contra su umbral AA, en tema claro y oscuro. Si alguien ajusta un color y rompe un
contraste, falla el commit — no se descubre meses después con un lector de pantalla.

```bash
pnpm test src/estilos/paleta.test.ts
```

La voz, el tono y las reglas de uso de marca están en [`docs/marca.md`](docs/marca.md).

### Tipografía

**Fraunces** para títulos e **Inter** para texto, elegidas por el propietario sobre una maqueta real
de la portada (doc 03 §3.2). Se definen en `src/estilos/fuentes.ts` y se sirven con
`next/font/local` desde `src/estilos/fuentes/` — nunca desde Google: así no se envía la IP de cada
visitante a un tercero y se ahorra la conexión a `fonts.gstatic.com`, que retrasa el primer render.

Ambas son variables y solo del subconjunto **latin**, que cubre todo el español. Un archivo por
familia sirve todo el rango 300–700; entre las dos suman unos 115 KB. Licencias y procedimiento de
actualización en [`src/estilos/fuentes/LICENCIA.md`](src/estilos/fuentes/LICENCIA.md).

Los `export` se llaman `fraunces` e `inter`, en inglés y saltándose la convención del proyecto,
porque `next/font` usa el nombre de la variable como nombre de la familia CSS: con `fuenteTitulo`,
las devtools mostraban `font-family: fuenteTitulo`, que no dice qué letra es.

---

## Autenticación

Sesión en cookies con `@supabase/ssr`, y el rol viajando dentro del JWT gracias al hook de la
migración `0003`. Tres capas, de menos a más fiable:

| Capa          | Archivo                  | Qué hace                                                       |
| ------------- | ------------------------ | -------------------------------------------------------------- |
| Navegación    | `src/proxy.ts`           | Refresca la sesión y redirige a quien no debe estar donde está |
| Servidor      | `src/lib/auth/sesion.ts` | `exigirAcceso(ruta)` al principio de cada página y acción      |
| Base de datos | Políticas RLS            | La que de verdad decide, vaya la petición por donde vaya       |

Las dos primeras son comodidad y defensa en profundidad. La documentación de Next avisa de que las
Server Functions se resuelven como POST a la ruta donde viven, así que un cambio de `matcher` puede
sacarlas de la guardia del proxy sin que nadie lo note; por eso cada acción vuelve a comprobar, y
por eso la autorización real vive en Postgres.

Dos detalles que conviene no deshacer:

- **Se usa `getClaims()`, nunca `getSession()`** en código de servidor. `getClaims()` verifica la
  firma del JWT; `getSession()` solo lee la cookie, que el cliente controla.
- **La `service_role` no aparece en ningún módulo de la aplicación.** Cada consulta viaja con el
  JWT del usuario y la RLS resuelve. Solo las ayudas de las pruebas E2E la usan, y nunca entran en
  el bundle.

`src/proxy.ts` se llamaba `middleware.ts` hasta Next 15; en la 16 cambió de nombre y de runtime.

---

## Despliegue

- **Vercel** conectado al repositorio `dNogueira300/PIMPOS_SYSTEM`. El framework se detecta como
  Next.js y el gestor de paquetes es pnpm.
- **Vistas previas automáticas por PR**: cada pull request genera su propia URL. Esa URL tiene que
  estar en las _Redirect URLs_ de Supabase Auth para que el inicio de sesión funcione en la vista previa.
- Las **variables de entorno** se cargan en los tres entornos de Vercel: Production, Preview y
  Development. Son las mismas que están en `.env.example`.
- `main` está protegida: exige PR y que el CI pase antes de fusionar.

> El destino final de producción sigue siendo una **decisión abierta hasta octubre**: Vercel (donde
> ya se desarrolla) frente a Cloudflare Workers. Nada del código debe depender de una u otra.

---

## Respaldo y restauración

El plan gratuito de Supabase **no incluye copias automáticas**. En su lugar,
`.github/workflows/backup-supabase.yml` vuelca roles, esquema y datos una vez por semana y los
guarda como **artefacto retenido 90 días**.

**El procedimiento completo está en [`docs/respaldo-y-restauracion.md`](docs/respaldo-y-restauracion.md)**,
y está ensayado de principio a fin (08/09/2026). En resumen:

```bash
supabase db push                                        # 1. esquema, RLS, Storage y cron
bash scripts/restaurar-respaldo.sh respaldos/datos.sql  # 2. datos, incluidos los usuarios
bash supabase/seeds/imagenes/subir-imagenes.sh          # 3. imágenes semilla
```

**`psql -f backup.sql` no funciona**, aunque sea lo que uno intenta primero. Las migraciones no
dejan la base vacía —cargan roles, configuración, categorías, faqs y unidades, y el trigger de
auditoría registra cada inserción—, así que el volcado choca con esas mismas filas y muere en la
primera tabla con `duplicate key ... auditoria_pkey`. Hay que vaciar antes, que es lo que hace el
guion.

Y dos cosas que un volcado **no lleva**: las políticas de Storage y los trabajos de `pg_cron`, que
viven en los esquemas `storage` y `cron`. Restaurar solo el volcado deja el bucket `clientes` sin
políticas —inalcanzable para el panel— y sin alertas de stock. Por eso el paso 1 es `db push`.

> **Un respaldo de esta base es material sensible.** Lleva los usuarios con su contraseña cifrada y
> los nombres, celulares y direcciones de los clientes (Ley N.° 29733). `respaldos/` está en
> `.gitignore`, y conviene saber quién puede descargar el artefacto de GitHub.

---

## Estado del proyecto

| Fase | Nombre                      | Estado       |
| ---- | --------------------------- | ------------ |
| F0   | Preparación de servicios    | ✅ Cerrada   |
| F1   | Fundación técnica           | ✅ Cerrada   |
| F2   | Backend de datos            | ✅ Cerrada   |
| F3   | Sitio público (Módulo 1)    | 🔄 En curso  |
| F4   | Panel: contenido (Módulo 2) | ⬜ Pendiente |
| F5   | Panel: insumos (Módulo 3)   | ⬜ Pendiente |
| F6   | Panel: clientes (Módulo 4)  | ⬜ Pendiente |
| F7   | Cierre                      | ⬜ Pendiente |

> La Fase 2 se cerró el 08/09/2026: 16 migraciones, 27 tablas todas con RLS, 11 vistas todas con
> `security_invoker`, 78 políticas, 2 trabajos de `pg_cron` y 326 pruebas pgTAP. El catálogo real
> cargado por semillas y 62 imágenes en sus buckets.
>
> La Fase 3 tiene sus **ocho secciones construidas y probadas**, leyendo de las vistas: 49 páginas
> estáticas y 80 pruebas de navegador a 375 px y en escritorio. Falta el SEO y el pulido de detalle.
> Detalle en `DOC/Avance del proyecto.md`.

---

## Documentación

Los planes de desarrollo viven en **`DOC/`, dentro de este repositorio**. Hasta el 08/09/2026
estaban en la carpeta padre, fuera del control de versiones: la «fuente de verdad del proyecto» no
tenía historial ni copia remota, que para un mantenedor solo es frágil. Ahora el código y la
documentación comparten historial y se revisan en el mismo PR.

Lo único de `DOC/` que **no** entra en git son las fotos del cliente (8 MB entre originales y
optimizadas). Siguen en disco, y `supabase/seeds/imagenes/subir-imagenes.sh` las busca ahí.

| Documento                                         | Cuándo se lee                                          |
| ------------------------------------------------- | ------------------------------------------------------ |
| `Plan de Desarrollo 00 - General y Fases`         | Al planificar la semana: orden de fases y convenciones |
| `Plan de Desarrollo 01 - Preparacion y Servicios` | Fase 0: Supabase, GitHub, entorno, dominio             |
| `Plan de Desarrollo 02 - Backend y Base de Datos` | Esquema, RLS, migraciones y semillas                   |
| `Plan de Desarrollo 03 - Frontend`                | Diseño, sitio público y panel                          |
| `Stack Tecnologico - PIMPOS`                      | Versiones exactas de librerías y por qué cada una      |

Dentro del repositorio, `docs/` queda reservado para decisiones de arquitectura (ADR) y el manual de
usuario.
