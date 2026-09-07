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
supabase test db                  # pruebas pgTAP sobre las políticas RLS
bash scripts/verificar-fase0.sh   # verificación funcional contra el Docker local
bash scripts/verificar-produccion.sh   # verificación de solo lectura contra el proyecto alojado
```

`scripts/verificar-fase0.sh` cubre las comprobaciones de cierre que se pueden probar en local
(doc 01 §10): que la API responde, que las extensiones están activas, que el registro público está
cerrado **sin haber apagado el proveedor de correo**, que el rol viaja dentro del JWT y que el
bucket `clientes` es realmente privado. Crea y borra sus propios datos de prueba. Las otras cuatro
comprobaciones (keep-alive, CI, backup remoto y dominio) se verifican en GitHub.

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

Roles válidos: `superadmin`, `administrador`, `ingeniero`, `repartidor`. El modal del panel no
tiene campo de metadatos; cuando exista el panel de usuarios (Fase 4) hará esto en un solo paso.

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

## Restaurar un backup

El plan gratuito de Supabase **no incluye backups automáticos**. En su lugar, el workflow
`.github/workflows/backup-supabase.yml` ejecuta `supabase db dump` una vez por semana y guarda el
resultado como **artefacto retenido 90 días**.

Para restaurar:

1. En GitHub → pestaña **Actions** → workflow `backup-supabase` → abrir la ejecución deseada y
   descargar el artefacto desde la sección _Artifacts_. Descomprimirlo para obtener el `.sql`.
2. Levantar la instancia local y averiguar la cadena de conexión:

   ```bash
   supabase start
   supabase status          # muestra la DB URL local
   ```

3. Restaurar el volcado sobre la base local:

   ```bash
   psql "postgresql://postgres:postgres@127.0.0.1:54322/postgres" -f ruta/al/backup.sql
   ```

4. Verificar que las tablas, los datos y las políticas quedaron completos antes de dar la
   restauración por buena.

> **Un backup que nunca se restauró no es un backup.** La restauración se prueba al menos una vez
> antes de que haya datos reales de clientes, y se repite cada tanto — nunca el día que hace falta.

---

## Estado del proyecto

| Fase | Nombre                      | Estado       |
| ---- | --------------------------- | ------------ |
| F0   | Preparación de servicios    | ✅ Cerrada   |
| F1   | Fundación técnica           | 🔄 En curso  |
| F2   | Backend de datos            | ⬜ Pendiente |
| F3   | Sitio público (Módulo 1)    | ⬜ Pendiente |
| F4   | Panel: contenido (Módulo 2) | ⬜ Pendiente |
| F5   | Panel: insumos (Módulo 3)   | ⬜ Pendiente |
| F6   | Panel: clientes (Módulo 4)  | ⬜ Pendiente |
| F7   | Cierre                      | ⬜ Pendiente |

> La Fase 0 se cerró el 06/09/2026: Supabase local y de producción operativos, esquema base migrado,
> hook del JWT registrado, CI en verde y keep-alive respondiendo contra producción.

---

## Documentación

Los planes de desarrollo **no viven en este repositorio**: están en la carpeta `DOC/` del proyecto,
fuera del control de versiones del código.

| Documento                                         | Cuándo se lee                                          |
| ------------------------------------------------- | ------------------------------------------------------ |
| `Plan de Desarrollo 00 - General y Fases`         | Al planificar la semana: orden de fases y convenciones |
| `Plan de Desarrollo 01 - Preparacion y Servicios` | Fase 0: Supabase, GitHub, entorno, dominio             |
| `Plan de Desarrollo 02 - Backend y Base de Datos` | Esquema, RLS, migraciones y semillas                   |
| `Plan de Desarrollo 03 - Frontend`                | Diseño, sitio público y panel                          |
| `Stack Tecnologico - PIMPOS`                      | Versiones exactas de librerías y por qué cada una      |

Dentro del repositorio, `docs/` queda reservado para decisiones de arquitectura (ADR) y el manual de
usuario.
