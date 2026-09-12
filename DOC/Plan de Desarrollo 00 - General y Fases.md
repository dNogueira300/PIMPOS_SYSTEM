# Plan de Desarrollo — 00. General y Fases

**Proyecto:** Plataforma Web y Sistema de Gestión — Panadería Pimpo's E.I.R.L.
**Repositorio:** `D:\300\OTROS\XXX\DAN\PIMPOS\PIMPOS_SYSTEM` → https://github.com/dNogueira300/PIMPOS_SYSTEM
**Ventana de ejecución:** setiembre – noviembre 2026
**Documento maestro.** Ver también: `01 - Preparacion y Servicios`, `02 - Backend y Base de Datos`, `03 - Frontend`.

---

## 0. Regla de arranque

> **No se escribe código de aplicación hasta que la Fase 0 esté cerrada.**

La Fase 0 es la preparación de Supabase, GitHub, el entorno y las cuentas. Está detallada en `Plan de Desarrollo 01 - Preparacion y Servicios.md`, con checklist marcable. Mientras haya un solo ítem sin cerrar, el repositorio se queda con documentación y configuración, no con código.

El motivo no es formalismo: el esquema de la base, las políticas RLS y los buckets condicionan la forma del código. Escribir componentes antes de tener eso definido garantiza reescribirlos.

---

## 1. Estado a la fecha (07/09/2026)

> **Resumen ejecutivo del avance en `Avance del proyecto.md`.** Este documento mantiene el
> plan; aquel cuenta qué se hizo y por qué.

| Actividad del plan de trabajo                     | Estado                                                                                  |
| ------------------------------------------------- | --------------------------------------------------------------------------------------- |
| 1.1 Diagnóstico y levantamiento de requerimientos | ✅ Completo (ficha llenada, 12 secciones + anexos)                                      |
| 1.2 Diseño de arquitectura y stack                | ✅ Completo (`Stack Tecnologico - PIMPOS.md` v2.0)                                      |
| Material gráfico                                  | ✅ Recibido y optimizado (`_OPTIMIZADO/`), pendientes resueltos con datos semilla       |
| 1.3 Diseño de base de datos                       | ✅ Completo: 16 migraciones al cierre de F2, 17 desde F3                                |
| 2–5 Desarrollo                                    | 🔄 F0, F1 y F2 cerradas; F3 con secciones y SEO hechos; crítica de diseño 24/40 → 29/40 |

### 1.1 Fase 0 — cerrada el 06/09/2026

Las 8 comprobaciones de cierre (`01 - Preparacion y Servicios`, §10) pasaron, y las que dependían
del proyecto alojado se verificaron ahí, no solo en local. Producción tiene las migraciones
aplicadas, el hook del JWT registrado y el superadmin operativo.

Lo que **no** se cerró y sigue pendiente por decisión propia: Vercel. No bloquea nada mientras no
haya despliegue.

### 1.2 Fase 1 — en curso

| Entregable                 | Estado                                                                   |
| -------------------------- | ------------------------------------------------------------------------ |
| Proyecto Next.js corriendo | ✅ PR #3: scaffold con Vitest, Playwright, ESLint, Prettier y husky      |
| Autenticación con 4 roles  | ✅ PR #4: proxy, clientes SSR, ingreso, guardia por rol                  |
| Sistema de diseño aplicado | ✅ PR #5: `docs/marca.md`, tokens en tres capas y contrastes bajo prueba |

**Orden alterado a propósito.** El plan original ponía el sistema de diseño primero. Se dejó para
el final porque §3.2 del documento de frontend exige validar la tipografía con el propietario
**sobre una maqueta real de la portada**; con el scaffold y la autenticación ya en pie, esa maqueta
es la aplicación de verdad y no una muestra de texto.

**F1 cerrada el 07/09**, tipografía incluida: el propietario eligió Fraunces + Inter sobre una
maqueta real de la portada, y ya está implementada con `next/font/local`.

### 1.3 Fase 2 — cerrada el 08/09

Las 16 migraciones aplican limpio sobre una base vacía. El checklist de cierre del doc 02 §15 está
completo, marcado ejecutando cada línea.

| Migración | Contenido                                | Estado |
| --------- | ---------------------------------------- | ------ |
| 0007      | Auditoría por triggers                   | ✅     |
| 0008      | Configuración del sitio                  | ✅     |
| 0009      | Catálogo: productos, variantes, precios  | ✅     |
| 0010      | Contenido: novedades, slides, guías, FAQ | ✅     |
| 0011      | Insumos, unidades y equivalencias        | ✅     |
| 0012      | **Kárdex**: lotes, movimientos y saldos  | ✅     |
| 0013      | Clientes y consentimiento                | ✅     |
| 0014      | Políticas de los 7 buckets               | ✅     |
| 0015      | Alertas y tareas de `pg_cron`            | ✅     |
| 0016      | Vistas de lectura del sitio público      | ✅     |

**27 tablas, todas con RLS activada** — ninguna sin proteger. **11 vistas, todas con
`security_invoker`**. 78 políticas, 2 trabajos de cron, **326 pruebas pgTAP**. Las 9 pruebas de
seguridad obligatorias (doc 02 §11.3) pasan las 9.

Después del cierre, F3 sumó `0017_pedidos` (las condiciones del delivery que el sitio muestra antes
de pedir, con la forma de cada valor comprobada en la base) y `0018_faq_horario` (la respuesta del
horario en 12 h), `0019_historia` (la historia en la voz de la marca) y `0020_slides_enfoque` (el
encuadre de cada diapositiva) y `0021_testimonios_sin_demo` (los testimonios de ejemplo dejan de
publicarse): hoy son **21 migraciones y 364 pruebas pgTAP**.

Los índices se quedaron dentro de la migración de cada tabla —se entienden donde está la tabla— y el
kárdex acabó necesitando archivo propio, de ahí que la lista no cuadre con la del borrador.

**El cronograma va adelantado.** El plan daba la semana 1 a F0, la 2 a F1, la 3 a F2 y la 4 a F3;
las tres primeras están cerradas y F3 tiene ya sus ocho secciones construidas. Ese margen importa
porque no había semana de reserva.

### 1.4 Fase 3 — en curso

Las **ocho secciones del sitio público** están construidas y leen de la base: portada, catálogo,
ficha de producto, novedades, nosotros, galería, ubicación, preguntas frecuentes y contacto. El build
genera 52 páginas estáticas y las cubren 160 pruebas de navegador a 375 px y en escritorio.

**El SEO está hecho** (11/09/2026): datos estructurados de tipo `Bakery` y `FAQPage`, `sitemap` y
`robots` generados desde la base, e imagen para compartir el enlace. Falta el pulido de detalle y que
el panel de F4 dispare el refresco por etiqueta, que ya tiene sus etiquetas puestas.

Dos hallazgos que corrigen el plan y están explicados en el doc 03:

- **El presupuesto de «menos de 150 KB de JavaScript» estaba por debajo del suelo del framework.**
  Una página sin carrusel ni filtros pesa los mismos 150 KB: eso es React 19 más Next 16, y el código
  de la aplicación añade 0 KB. Ahora se vigila un techo con margen y, sobre todo, cuánto añade la
  portada sobre una página sin interacción.
- **El movimiento se hace con CSS nativo, no con una librería**, por lo anterior. `motion` se quitó
  de las dependencias.

---

## 2. Fases

| Fase   | Nombre                      | Entregable que la cierra                                                                     | Depende de |
| ------ | --------------------------- | -------------------------------------------------------------------------------------------- | ---------- |
| **F0** | Preparación de servicios    | ✅ Supabase, GitHub y entorno operativos y verificados                                       | —          |
| **F1** | Fundación técnica           | ✅ Proyecto Next.js corriendo, sistema de diseño aplicado, autenticación con los 4 roles     | F0         |
| **F2** | Backend de datos            | ✅ Esquema completo migrado, RLS probada con pgTAP, buckets con políticas, semillas cargadas | F1         |
| **F3** | Sitio público (Módulo 1)    | 🔄 Secciones y SEO hechos; falta pulido y dominio                                            | F2         |
| **F4** | Panel: contenido (Módulo 2) | CRUD de productos, novedades, slides, guías, galería, FAQ, testimonios y configuración       | F2, F3     |
| **F5** | Panel: insumos (Módulo 3)   | Kárdex operativo, alertas y reportes exportables                                             | F2         |
| **F6** | Panel: clientes (Módulo 4)  | Fichas con fotos, zonas, mapa, consentimiento y exportación                                  | F2         |
| **F7** | Cierre                      | Capacitación, manual, informe final y traspaso de credenciales                               | F3–F6      |

### 2.1 Por qué este orden

**F3 antes que F4.** El sitio público sale a producción antes que el panel. Razones:

1. Es la carencia más urgente del negocio (ficha 10.1: orden 1, importancia 5).
2. Genera tráfico real desde setiembre, lo que elimina de raíz el riesgo de pausa de Supabase.
3. Da algo demostrable al propietario temprano, que es lo que sostiene la colaboración durante los meses siguientes.

Mientras el panel no exista, el contenido inicial se carga por **semillas SQL versionadas** (F2). No es un parche: es contenido versionado en Git, reproducible y auditable.

**F5 y F6 son independientes entre sí.** Si el calendario aprieta, pueden reordenarse o solaparse. F6 (clientes) tiene la prioridad más baja según la ficha (10.1: orden 4).

---

## 3. Cronograma

| Semana                      | Fase    | Foco                                                                   |
| --------------------------- | ------- | ---------------------------------------------------------------------- |
| **Sem. 1** (8–12 set)       | **F0**  | Supabase, GitHub, entorno, dominio. **Sin código de aplicación**       |
| **Sem. 2** (15–19 set)      | F1      | Scaffold, sistema de diseño, auth con roles                            |
| **Sem. 3** (22–26 set)      | F2      | Esquema, migraciones, RLS, buckets, semillas                           |
| **Sem. 4** (29 set – 3 oct) | F3      | Inicio, Nosotros, Productos, Galería                                   |
| **Sem. 5** (6–10 oct)       | F3      | Novedades, Contacto, Ubicación, FAQ, SEO → **despliegue a producción** |
| **Sem. 6** (13–17 oct)      | F4      | Productos, variantes, categorías, imágenes                             |
| **Sem. 7** (20–24 oct)      | F4      | Novedades con aprobación, slides, guías, galería, FAQ, configuración   |
| **Sem. 8** (27–31 oct)      | F5      | Insumos, unidades, proveedores, ingresos                               |
| **Sem. 9** (3–7 nov)        | F5      | Consumos, bajas, alertas, reportes y exportación                       |
| **Sem. 10** (10–14 nov)     | F6      | Clientes, fotos, zonas, mapa, consentimiento                           |
| **Sem. 11** (17–21 nov)     | F6 + F7 | Integración final, pruebas E2E, corrección                             |
| **Sem. 12** (24–28 nov)     | F7      | Capacitación presencial, manual escrito, informe final, traspaso       |

**Holgura:** el cronograma no tiene semana de reserva. Si algo se atrasa, lo primero que se recorta es la PWA offline (R16, marcada como "deseable" en la ficha 8.5), y después el detalle de los reportes de F5. Nunca se recorta: SEO, RLS, auditoría ni consentimiento de datos personales.

---

## 4. Estructura del repositorio

```
PIMPOS_SYSTEM/
├─ .github/workflows/        ci.yml · keepalive-supabase.yml
├─ docs/                     decisiones de arquitectura (ADR), manual de usuario
├─ supabase/
│  ├─ config.toml
│  ├─ migrations/            0001_extensiones.sql, 0002_roles_perfiles.sql, ...
│  ├─ schemas/               esquema declarativo por dominio
│  ├─ seeds/                 seed.sql + datos demo (es_demo = true)
│  ├─ functions/             Edge Functions, si hicieran falta
│  └─ tests/                 pruebas pgTAP de RLS
├─ src/
│  ├─ app/
│  │  ├─ (public)/           inicio · nosotros · productos · novedades ·
│  │  │                      galeria · contacto · ubicacion · faq
│  │  ├─ (admin)/            dashboard · contenido · insumos · clientes ·
│  │  │                      usuarios · auditoria · configuracion
│  │  ├─ (auth)/             ingresar · recuperar-clave
│  │  ├─ api/                webhooks y endpoints puntuales
│  │  ├─ icon.tsx            favicon dinámico (R21)
│  │  ├─ apple-icon.tsx
│  │  ├─ sitemap.ts · robots.ts · manifest.ts
│  │  └─ layout.tsx
│  ├─ components/
│  │  ├─ ui/                 shadcn/ui
│  │  ├─ publico/            secciones del sitio
│  │  └─ admin/              tablas, formularios, subida de archivos
│  ├─ lib/
│  │  ├─ supabase/           cliente servidor · cliente navegador · middleware
│  │  ├─ validaciones/       esquemas Zod (compartidos cliente/servidor)
│  │  ├─ acciones/           Server Actions por módulo
│  │  ├─ consultas/          lecturas tipadas
│  │  └─ utilidades/         unidades, formato de moneda, whatsapp, slugs
│  ├─ tipos/                 database.types.ts (generado) + tipos de dominio
│  └─ estilos/               globals.css con los tokens de Tailwind 4
├─ e2e/                      Playwright
├─ public/                   favicons y marca por defecto
├─ middleware.ts
└─ README.md                 cómo levantar, cómo desplegar, cómo restaurar
```

**Idioma:** rutas, tablas, columnas, carpetas de dominio y textos de interfaz **en español**. Nombres del framework y de librerías en inglés (`layout.tsx`, `page.tsx`). El sistema lo mantiene gente que habla español; la coherencia vale más que la costumbre anglosajona.

---

## 5. Convenciones

### 5.1 Git

- **Rama principal:** `main`, siempre desplegable.
- **Ramas de trabajo:** `feat/f4-crud-productos`, `fix/f5-conversion-unidades`.
- **Conventional Commits** en español: `feat(insumos): registrar ingreso con lote y vencimiento`.
- Una fase = una rama larga; cada tarea = un PR pequeño hacia esa rama.
- Nunca se commitea `.env.local` ni la `service_role key`.

### 5.2 Base de datos

- Tablas y columnas en **`snake_case` singular para la tabla en plural**: `productos`, `movimientos_insumo`.
- Toda tabla lleva `id uuid`, `created_at timestamptz`, `updated_at timestamptz`.
- Migraciones numeradas y **nunca editadas después de aplicarse**: se corrige con una migración nueva.
- Ninguna tabla se crea sin su política RLS en la misma migración.

### 5.3 Código

- TypeScript `strict`. **`any` prohibido**; si algo no se puede tipar, se usa `unknown` y se estrecha.
- Toda mutación pasa por una Server Action que valida con Zod **antes** de tocar la base.
- Los componentes son Server Components por defecto; `'use client'` solo cuando hay estado o eventos.
- Nada de credenciales en el cliente: la `service_role key` jamás sale del servidor.

---

## 6. Definición de "hecho"

Una tarea no está hecha hasta que:

1. `pnpm typecheck` y `pnpm lint` pasan sin advertencias.
2. Si toca la base: hay migración versionada **y** prueba pgTAP de su RLS.
3. Si toca lógica de negocio (unidades, stock, precios): hay prueba en Vitest.
4. Si es un flujo de usuario crítico: hay prueba en Playwright.
5. Funciona en móvil (R6, R15), verificado a 375 px de ancho.
6. Los textos están en español y sin jerga técnica (R18).
7. Está desplegada en la vista previa de Vercel y revisada en el navegador.

---

## 7. Riesgos del plan

| Riesgo                                   | Señal temprana                                       | Respuesta                                                                                |
| ---------------------------------------- | ---------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| F0 se alarga                             | Termina la semana 1 sin proyecto Supabase verificado | Es bloqueante: se detiene todo lo demás hasta cerrarla                                   |
| El cronograma no tiene holgura           | Una fase termina con más de 3 días de atraso         | Recortar en este orden: PWA offline → detalle de reportes → testimonios                  |
| Falta de contenido real (fotos, precios) | Semillas siguen en producción en octubre             | No bloquea: todo es administrable. Se documenta en el informe como pendiente del negocio |
| Disponibilidad del cliente para validar  | Sin respuesta de Marcos/Debra por más de una semana  | Avanzar con lo decidido y registrar el supuesto por escrito                              |
| Supabase pausado                         | El sitio responde error de conexión                  | El keep-alive de F0 debe estar activo desde el día uno                                   |

---

## 8. Cómo se usa este conjunto de documentos

| Documento                        | Cuándo se lee                                                          |
| -------------------------------- | ---------------------------------------------------------------------- |
| **Avance del proyecto**          | **Primero, para ponerse al día.** Qué está hecho y qué se decidió      |
| **00 — General y Fases** (este)  | Al planificar la semana. Da el orden y las convenciones                |
| **01 — Preparación y Servicios** | Fase 0, ya cerrada. Se consulta por lo que resultó distinto            |
| **02 — Backend y Base de Datos** | Fases 1 y 2, y cada vez que se toque el esquema                        |
| **03 — Frontend**                | Fases 1, 3 y 4. Contiene la dirección de diseño y el uso de las skills |
