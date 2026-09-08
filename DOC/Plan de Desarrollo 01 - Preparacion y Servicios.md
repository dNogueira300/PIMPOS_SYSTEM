# Plan de Desarrollo — 01. Preparación y Servicios (Fase 0)

> ## ✅ FASE 0 CERRADA — 06/09/2026
>
> Las 8 comprobaciones de §10 pasaron, y las que dependen del proyecto alojado se verificaron
> **en producción**, no solo en local: la API responde, el registro público está cerrado con el
> proveedor Email intacto, un login real devuelve `rol` dentro del JWT, y el bucket `clientes` no
> sirve contenido público. El CI corre en verde y el keep-alive responde contra producción.
>
> Reproducibles en cualquier momento:
> `bash scripts/verificar-fase0.sh` (local) y `bash scripts/verificar-produccion.sh` (alojado).
>
> **Pendiente y no bloqueante:** Vercel (§8), aplazado por decisión propia hasta que haya algo que
> desplegar. Y el dominio (§7), que el propio plan ya marcaba como no bloqueante.
>
> Cuatro cosas resultaron distintas de lo escrito aquí; están detalladas en §11.1.

---

**Esta era la fase bloqueante.** Hasta que todo lo de aquí estuviera marcado, no se escribía código de aplicación.

Marca cada casilla al completarla. Al final hay una **verificación de cierre** (§10) que confirma que todo funciona de verdad, no solo que está creado.

> Los nombres de menú de los paneles de Supabase, Vercel y Cloudflare cambian cada tanto. Cuando este documento diga "en _Ajustes → API_", busca la opción por su función si el rótulo no coincide exactamente.

---

## 1. Cuentas necesarias

| Servicio                | Para qué                       | Plan     | Estado                                     |
| ----------------------- | ------------------------------ | -------- | ------------------------------------------ |
| GitHub                  | Repositorio y CI               | Gratuito | ✅ Ya existe: `dNogueira300/PIMPOS_SYSTEM` |
| **Supabase**            | Base de datos, Auth, Storage   | Free     | ⬜                                         |
| Vercel                  | Despliegue y vistas previas    | Hobby    | ⬜                                         |
| Cloudflare              | DNS (y posible hosting final)  | Gratuito | ⬜                                         |
| Registrador del dominio | `panaderiapimpos.com`          | —        | ⬜ (decisión abierta, ver §7)              |
| Zoho Mail               | `contacto@panaderiapimpos.com` | Gratuito | ⬜                                         |
| Resend                  | Correos de alerta (R12)        | Free     | ⬜                                         |

- [x] Todas las cuentas se crean con un correo **del negocio o de proyecto**, no con el personal de Dan. Al terminar la práctica se traspasan (R20).
- [x] Todas las contraseñas se guardan en un **gestor de contraseñas** (Bitwarden gratuito sirve). Nunca en un `.txt` ni en el repositorio.
- [x] Se activa **verificación en dos pasos** al menos en GitHub y Supabase.

---

## 2. Entorno local

| Herramienta    | Versión             | Comprobación                                                       |
| -------------- | ------------------- | ------------------------------------------------------------------ |
| Node.js        | 22 LTS o 24 LTS     | `node -v`                                                          |
| pnpm           | 12.3.4              | `corepack enable && corepack prepare pnpm@12.3.4 --activate`       |
| Supabase CLI   | 2.116.0             | `pnpm dlx supabase@latest --version`                               |
| Git            | cualquiera reciente | `git --version`                                                    |
| Docker Desktop | reciente            | `docker --version` — **solo si se opta por Supabase local (§3.1)** |

- [x] Node instalado y verificado
- [x] pnpm activado vía corepack (no instalar pnpm con `npm -g`)
- [x] Supabase CLI responde
- [x] VS Code con las extensiones: ESLint, Prettier, Tailwind CSS IntelliSense, Playwright

---

## 3. Supabase — el bloque grande

### 3.1 Decisión previa: ¿dónde se desarrolla?

| Opción                                                    | Cómo                                                        | Ventaja                                                                                            | Costo                                                                        |
| --------------------------------------------------------- | ----------------------------------------------------------- | -------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| **A. Supabase local + 1 proyecto remoto** _(recomendada)_ | `supabase start` levanta Postgres, Auth y Storage en Docker | Desarrollo sin internet, reinicio instantáneo, no ensucia producción, no consume la cuota gratuita | Requiere Docker Desktop y ~4 GB de RAM libres                                |
| **B. 2 proyectos remotos** (`pimpos-dev` y `pimpos-prod`) | Todo en la nube                                             | No necesita Docker                                                                                 | Consume los 2 proyectos activos del plan gratuito; **ambos** pueden pausarse |

**Recomendación: A.** Si Docker no rinde en el equipo, se pasa a B sin cambiar nada del esquema — las migraciones son las mismas.

- [x] Decidida la opción: _**A**_

### 3.2 Crear el proyecto de producción

- [x] Organización creada en Supabase (nombre: `Panaderia Pimpos`)
- [x] Proyecto creado: **`pimpos-produccion`**
- [x] **Región: South America (São Paulo) — `sa-east-1`.** Es la más cercana a Iquitos; cualquier región de EE. UU. agrega latencia innecesaria en cada consulta
- [x] Contraseña de la base de datos generada (larga, aleatoria) y **guardada en el gestor de contraseñas**. Supabase no la vuelve a mostrar
- [x] Anotados en el gestor: `Project URL`, `anon key`, `service_role key` (_Ajustes → API_)
- [x] Anotada la cadena de conexión directa y la del _pooler_ (_Ajustes → Database_)

> ⚠️ La **`service_role key` salta toda la RLS**. Solo va en variables de entorno del servidor. Nunca en el cliente, nunca en el repositorio, nunca en una captura de pantalla.

### 3.3 Extensiones de Postgres

Se activan desde _Database → Extensions_, o mejor, por migración (`0001_extensiones.sql`) para que quede versionado.

| Extensión  | Para qué                                                                              | Obligatoria |
| ---------- | ------------------------------------------------------------------------------------- | ----------- |
| `pgcrypto` | `gen_random_uuid()` para las claves primarias                                         | ✅          |
| `pg_cron`  | Despublicar novedades vencidas (R7) y evaluar alertas de stock/vencimiento (R12)      | ✅          |
| `pg_trgm`  | Búsqueda por nombre parecido — "buscar cliente por nombre" es prioridad 1 (ficha 8.6) | ✅          |
| `unaccent` | Que "Nuñez" encuentre "Nunez" y "panetón" encuentre "paneton"                         | ✅          |
| `pgtap`    | Pruebas automatizadas de las políticas RLS                                            | ✅          |
| `pg_net`   | Llamadas HTTP desde la base (para disparar correos de alerta)                         | ⚪ Opcional |

- [ ] Extensiones activadas y confirmadas con `select * from pg_extension;`

> Recordatorio: si el proyecto se pausa por inactividad, **`pg_cron` deja de ejecutarse**. El keep-alive del §6.3 no es opcional.

### 3.4 Autenticación

Todo en _Authentication → Providers / Settings / Emails_.

- [ ] **Proveedor Email activado.** Ningún proveedor social (los usuarios son personal interno)
- [ ] **Registro público DESACTIVADO** (`Disable new user signups`). Los usuarios los crea el SuperAdmin o el equipo de desarrollo (ficha 9.1). Este es el ajuste más importante de esta sección: sin él, cualquiera podría crearse una cuenta
- [ ] Confirmación de correo **activada**
- [ ] **Site URL** apuntando al dominio de producción (provisionalmente, la URL de Vercel)
- [ ] **Redirect URLs** incluyendo: la URL de producción, `https://*-dNogueira300.vercel.app` para las vistas previas, y `http://localhost:3000`
- [ ] Plantillas de correo **traducidas al español** (confirmación, recuperación de contraseña, invitación). Llegan a personal con nivel de computadora básico (R18): deben ser cortas y claras
- [ ] Longitud mínima de contraseña: 10 caracteres
- [ ] Duración del JWT: 3600 s (1 hora), con refresco automático

#### Custom Access Token Hook — el rol dentro del token

Sin esto, cada consulta con RLS tendría que ir a buscar el rol del usuario a otra tabla, en cada petición.

- [ ] Función `app.custom_access_token(event jsonb) returns jsonb` creada por migración, que añade el claim `rol` leyendo `perfiles`
- [ ] Hook registrado en _Authentication → Hooks → Customize Access Token (JWT) Claims_
- [ ] Verificado: al iniciar sesión, el JWT decodificado contiene `"rol": "superadmin"` (se comprueba pegando el token en jwt.io, **nunca un token de producción real de otro usuario**)

### 3.5 Storage — buckets

Se crean en _Storage_, y sus políticas por migración.

| Bucket         | Acceso      | Límite por archivo | Tipos permitidos                                           | Contenido                                     |
| -------------- | ----------- | ------------------ | ---------------------------------------------------------- | --------------------------------------------- |
| `marca`        | Público     | 2 MB               | `image/webp`, `image/png`, `image/svg+xml`, `image/x-icon` | Logo y favicon administrables (R21)           |
| `productos`    | Público     | 3 MB               | `image/webp`, `image/jpeg`, `image/png`                    | Fotos de producto y variantes                 |
| `galeria`      | Público     | 3 MB               | `image/webp`, `image/jpeg`, `image/png`                    | Local, hornos, atención                       |
| `slides`       | Público     | 3 MB               | `image/webp`, `image/jpeg`, `image/png`                    | Carrusel de portada (R2)                      |
| `insumos`      | Público     | 2 MB               | `image/webp`, `image/jpeg`, `image/png`                    | Fotos de referencia de insumos                |
| **`clientes`** | **PRIVADO** | 2 MB               | `image/webp`, `image/jpeg`                                 | **Fotos de fachada de domicilios (R14, R19)** |
| `documentos`   | Privado     | 10 MB              | `application/pdf`                                          | Reportes generados, certificaciones           |

- [x] Los 7 buckets creados con esos límites y tipos MIME
- [x] **`clientes` verificado como privado**: pegar la URL pública de un objeto en una ventana de incógnito debe devolver error. Esto se comprueba, no se supone (R19)
- [x] Límite global de tamaño de subida configurado en 5 MB

> El límite de tipos MIME no es burocracia: impide que alguien suba un archivo ejecutable disfrazado a un bucket público.

### 3.6 Copias de seguridad

El plan gratuito **no incluye backups automáticos**. Con datos de clientes de por medio (R19), esto se resuelve ahora, no después.

- [ ] GitHub Action semanal que ejecuta `supabase db dump` y guarda el resultado como artefacto cifrado (ver §6.3)
- [ ] Probada **una restauración** sobre el entorno local antes de que haya datos reales. Un backup que nunca se restauró no es un backup

### 3.7 Zona horaria

- [ ] La base queda en **UTC** (el valor por defecto de Postgres). Todas las columnas de fecha son `timestamptz`
- [ ] La conversión a hora de Iquitos (UTC−5) se hace **en la interfaz**, nunca guardando horas locales

---

## 4. Repositorio GitHub

- [ ] `.gitignore` con: `node_modules`, `.next`, `.env*`, `supabase/.branches`, `supabase/.temp`, `*.log`
- [ ] `README.md` con: requisitos, cómo levantar en local, cómo aplicar migraciones, cómo desplegar, cómo restaurar un backup
- [ ] Rama `main` protegida: exige PR y que el CI pase antes de fusionar
- [ ] **Secrets del repositorio** (_Settings → Secrets and variables → Actions_):

| Secret                  | Para qué                       |
| ----------------------- | ------------------------------ |
| `SUPABASE_ACCESS_TOKEN` | Que el CLI opere desde Actions |
| `SUPABASE_PROJECT_REF`  | Referencia del proyecto        |
| `SUPABASE_DB_PASSWORD`  | Backups                        |
| `SUPABASE_URL`          | Keep-alive                     |
| `SUPABASE_ANON_KEY`     | Keep-alive                     |

- [ ] Verificado que **ningún secret está en el historial de commits**

---

## 5. Variables de entorno

Se crea `.env.example` **versionado** (sin valores) y `.env.local` **ignorado** (con valores).

```bash
# --- Supabase ---
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=          # SOLO servidor. Nunca con prefijo NEXT_PUBLIC_

# --- Sitio ---
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_WHATSAPP=51947874820    # R4, R17

# --- Correo (R12) ---
RESEND_API_KEY=
CORREO_ALERTAS=contactopimpos@gmail.com
```

- [ ] `.env.example` creado y versionado
- [ ] `.env.local` creado y **confirmado que `git status` no lo ve**
- [ ] Las mismas variables cargadas en Vercel para los tres entornos (Production, Preview, Development)

> Regla que evita el accidente más caro: **si una variable no lleva `NEXT_PUBLIC_`, no llega al navegador.** La `service_role key` nunca lo lleva.

---

## 6. Automatizaciones (GitHub Actions)

### 6.1 CI — `ci.yml`

- [ ] En cada PR: `pnpm install --frozen-lockfile`, `pnpm typecheck`, `pnpm lint`, `pnpm test`
- [ ] Ejecuta las pruebas pgTAP contra una instancia local de Supabase

### 6.2 Backup — `backup-supabase.yml`

- [ ] Semanal: `supabase db dump` → artefacto retenido 90 días

### 6.3 Keep-alive — `keepalive-supabase.yml`

- [ ] **Cada 3 días**, una consulta trivial contra la API REST del proyecto
- [ ] Verificado que corre y devuelve 200

```yaml
name: keepalive-supabase
on:
  schedule:
    - cron: "0 12 */3 * *" # cada 3 días, 12:00 UTC (07:00 en Iquitos)
  workflow_dispatch:
jobs:
  ping:
    runs-on: ubuntu-latest
    steps:
      - name: Consultar la API para evitar la pausa por inactividad
        run: |
          curl --fail --silent --show-error \
            "${{ secrets.SUPABASE_URL }}/rest/v1/configuracion_sitio?select=clave&limit=1" \
            -H "apikey: ${{ secrets.SUPABASE_ANON_KEY }}"
```

> El `cron` de GitHub Actions puede retrasarse cuando hay mucha carga en la plataforma. Cada 3 días deja margen de sobra frente al límite de 7 días de Supabase.

---

## 7. Dominio y DNS

- [ ] **Decidido el registrador.** Puede ser Hostinger si sale más barato — ver §3.2 del documento de stack. Comparar el **precio de renovación**, no el de promoción
- [ ] `panaderiapimpos.com` comprado **a nombre del negocio**, no de Dan
- [ ] WHOIS privacy activado
- [ ] Dominio agregado a Cloudflare
- [ ] Nameservers cambiados a los de Cloudflare en el panel del registrador
- [ ] Propagación verificada: `nslookup -type=NS panaderiapimpos.com`
- [ ] Registros MX de Zoho Mail configurados en Cloudflare
- [ ] `contacto@panaderiapimpos.com` recibe y envía correo correctamente

> Esta sección **no bloquea** el inicio del desarrollo: se trabaja sobre la URL de Vercel y se conecta el dominio antes del despliegue de la semana 5.

---

## 8. Vercel

- [ ] Proyecto creado e importado desde `dNogueira300/PIMPOS_SYSTEM`
- [ ] Framework detectado: Next.js. Gestor de paquetes: pnpm
- [ ] Variables de entorno cargadas en los tres entornos
- [ ] Vistas previas automáticas por PR activadas
- [ ] La URL de vista previa agregada a las Redirect URLs de Supabase Auth (§3.4)

---

## 9. Usuarios iniciales

Se crean desde el panel de Supabase (_Authentication → Users_), y sus filas en `perfiles` se cargan por semilla.

| Correo                   | Rol          | Persona                                                       |
| ------------------------ | ------------ | ------------------------------------------------------------- |
| (correo del propietario) | `superadmin` | Organda Sifuentes Pinedo                                      |
| (correo de soporte)      | `superadmin` | Cuenta técnica de Dan — **documentada y entregada al cierre** |
| (correo de Marcos)       | `ingeniero`  | Marcos                                                        |
| (correo de Debra)        | `ingeniero`  | Debra                                                         |
| —                        | `repartidor` | Repartidor 1 y 2 — se crean en F6                             |

- [ ] Correos reales solicitados a Marcos y Debra
- [ ] Contraseñas iniciales entregadas por un canal seguro, con cambio obligatorio en el primer ingreso
- [ ] Documento de credenciales iniciado (se entrega al propietario en F7)

---

## 10. Verificación de cierre de la Fase 0

No basta con que las cosas estén creadas: tienen que responder. Estas ocho comprobaciones cierran la fase.

| #   | Comprobación                     | Cómo se verifica                                                                    | ✔   |
| --- | -------------------------------- | ----------------------------------------------------------------------------------- | --- |
| 1   | El proyecto Supabase responde    | `curl "$SUPABASE_URL/rest/v1/" -H "apikey: $ANON"` devuelve 200                     | ⬜  |
| 2   | Las extensiones están activas    | `select extname from pg_extension;` lista `pg_cron`, `pg_trgm`, `unaccent`, `pgtap` | ⬜  |
| 3   | El registro público está cerrado | Intentar `signUp` con un correo nuevo → debe fallar                                 | ⬜  |
| 4   | El rol viaja en el JWT           | Iniciar sesión y decodificar el token: contiene `"rol"`                             | ⬜  |
| 5   | El bucket `clientes` es privado  | Pedir la URL pública de un objeto en incógnito → error                              | ⬜  |
| 6   | El keep-alive funciona           | Ejecutar el workflow a mano → verde                                                 | ⬜  |
| 7   | El backup se puede restaurar     | `db dump` y restaurar en local sin errores                                          | ⬜  |
| 8   | El CI corre                      | Abrir un PR de prueba → los checks pasan                                            | ⬜  |

- [ ] **Fase 0 cerrada.** A partir de aquí empieza F1 (`Plan de Desarrollo 03 - Frontend`, §Fundación) y F2 (`Plan de Desarrollo 02 - Backend`)

---

## 11.1 Cuatro cosas que resultaron distintas

**El registro público NO se cierra con el proveedor Email.** En `config.toml`, `[auth.email]
enable_signup` controla `GOTRUE_EXTERNAL_EMAIL_ENABLED`, es decir si el proveedor existe:
apagarlo deja fuera a todo el mundo, **incluidos los usuarios que crea el administrador**. Quien
cierra el registro es `[auth] enable_signup` (`GOTRUE_DISABLE_SIGNUP`). En el panel: desactivar
_Allow new users to sign up_, nunca el proveedor Email.

**El hook del JWT se registra a mano en el panel.** El bloque
`[auth.hook.custom_access_token]` de `config.toml` **solo aplica al entorno local**. En el proyecto
alojado hay que ir a _Authentication → Hooks → Customize Access Token (JWT) Claims_. Sin ese paso
los JWT salen sin el claim `rol`, la RLS niega todo, y el síntoma engaña: el login funciona y lo
que falla es cada consulta.

**El keep-alive no puede consultar la raíz de la API.** `GET /rest/v1/` devuelve el esquema
OpenAPI completo y en el proyecto alojado está restringida a la `service_role`
(`"Only the service_role API key can be used for this endpoint"`). El YAML de §6.3 apunta ahora a
una tabla real. Meter la `service_role` en el workflow no era opción: es una llave que salta toda
la RLS dentro de un ping.

**`db push` no aplica las semillas.** Hace falta `--include-seed`. El primer despliegue dejó
`public.roles` vacía en producción; se corrigió moviendo ese catálogo a una migración. Detalle en
`02 - Backend`, §3.1.

**Añadido no previsto:** el modal _Add user_ del panel solo tiene correo y contraseña — no hay
campo de metadatos. El alta de usuarios de §9 son dos pasos: crear en el panel con _Auto Confirm
User_, y asignar el rol desde el SQL Editor. El procedimiento exacto está en el `README` del
repositorio.

---

## 11. Resumen: lo que hay que tener listo en Supabase

Si solo se lee una parte de este documento, que sea esta.

1. **Proyecto** `pimpos-produccion` en la región **São Paulo (`sa-east-1`)**.
2. **Extensiones**: `pgcrypto`, `pg_cron`, `pg_trgm`, `unaccent`, `pgtap`.
3. **Auth**: solo email, **registro público desactivado**, confirmación por correo, Site URL y Redirect URLs, plantillas en español, y el **hook que mete el rol en el JWT**.
4. **7 buckets** de Storage, con `clientes` **privado y verificado**.
5. **Claves guardadas** en el gestor de contraseñas; la `service_role` nunca en el cliente.
6. **Keep-alive cada 3 días** funcionando, y **backup semanal** con una restauración ya probada.
7. **Usuarios iniciales** creados con sus roles.
8. Base en **UTC**, con `timestamptz` en todas las fechas.
