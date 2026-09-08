# Stack Tecnológico — Plataforma Web y Sistema de Gestión Panadería Pimpo's

**Proyecto:** Plataforma web informativa + panel de administración
**Cliente:** Panadería Pastelería y Bodega Pimpo's E.I.R.L. — RUC 20409056009 — Iquitos, Loreto
**Responsable:** Dan Willy Chasnamote Navarro (práctica preprofesional FISI-UNAP, agosto–noviembre 2026)
**Repositorio:** `D:\300\OTROS\XXX\DAN\PIMPOS\PIMPOS_SYSTEM` → https://github.com/dNogueira300/PIMPOS_SYSTEM
**Documento:** decisión de arquitectura y stack — **versión 2.0**
**Fecha:** 05/09/2026

> **Cambios respecto a la v1.0:** versiones actualizadas a las vigentes (TypeScript 7, pnpm 12, Next.js 16); decisión de hosting cerrada (Opción A); material pendiente resuelto con datos semilla; logo, favicon y coordenadas pasan a ser administrables; el modelo de datos se diseña **preparado para e-commerce**; se agregan los assets ya optimizados.

---

## 1. Insumos revisados

| Fuente                                              | Estado                                                                                      |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| `Ficha recoleccion informacion pimpos llenado.docx` | Completa (12 secciones + Anexo B con 5 fichas de producto + Anexo C con 5 fichas de insumo) |
| `Plan de trabajo - DAN CHASNAMOTE - PIMPOS.docx`    | Cronograma agosto–noviembre 2026, 5 actividades                                             |
| `Fotos.../Diseño/`                                  | `LOGOPIMPOS.png` (logo oficial) y `logo.png` (render line-art)                              |
| `Fotos.../lugar/`                                   | 10 fotos: 3 fachada, 2 interior, 2 atención, 3 horno                                        |
| `Fotos.../ANEXO DOC/Productos/`                     | 5 fotos de producto                                                                         |
| `Fotos.../ANEXO DOC/Insumos/`                       | 5 fotos de insumo                                                                           |
| `Fotos.../productos/LISTAPRODUCTOS.docx`            | Catálogo general: ~36 productos en 4 bloques de precio + adicionales                        |

### 1.1 Material pendiente — resuelto

Ninguno de estos ítems bloquea ya el desarrollo. Todo el contenido es administrable, así que se arranca con datos semilla y el negocio los reemplaza desde el panel cuando los tenga.

| Ítem                                       | Decisión                                                                                                              |
| ------------------------------------------ | --------------------------------------------------------------------------------------------------------------------- |
| Foto del equipo de trabajo                 | **Se elimina.** No se incluirá en el sitio                                                                            |
| Banner / carrusel de portada               | Semilla con logo + fotos de local y producto. El administrador lo reemplaza desde el panel                            |
| Testimonios                                | Semilla con 3 testimonios de ejemplo, **marcados como `es_demo = true`** para poder purgarlos de un golpe             |
| Insumos, proveedores y clientes frecuentes | Semilla con los 22 insumos y 6 proveedores que **sí** están en la ficha, más 3 clientes de ejemplo (`es_demo = true`) |
| Coordenadas del local                      | **Resuelto:** `-3.759545048266943, -73.2516156605442`. Además pasa a ser **campo administrable**                      |
| Logo vectorial                             | **Resuelto parcialmente** — ver §1.3                                                                                  |
| Fotos de los ~31 productos restantes       | Se cargan cuando existan. Placeholder por categoría mientras tanto                                                    |

### 1.2 Imágenes optimizadas

Todas las imágenes entregadas fueron procesadas a `DOC\Fotos y documentos Adjuntados Pimpos\_OPTIMIZADO\`:

- **Conversión a WebP** (calidad 82, método 6), sin metadatos EXIF.
- **Dos tamaños por foto:** `nombre.webp` (lado mayor ≤ 1600 px) y `nombre-thumb.webp` (≤ 640 px).
- **Nombres normalizados** a kebab-case ASCII, aptos para URL (`Insumo 4 Mantequilla.jpg` → `insumo-4-mantequilla.webp`).

| Grupo                  | Archivos | Peso original | Peso web (1600 px) | Ahorro   |
| ---------------------- | -------- | ------------- | ------------------ | -------- |
| `lugar/` (10 fotos)    | 20       | 2 205 KB      | 1 538 KB           | **30 %** |
| `productos/` (5 fotos) | 10       | 449 KB        | 205 KB             | **54 %** |
| `insumos/` (5 fotos)   | 10       | 231 KB        | 105 KB             | **55 %** |

> **Observación:** las fotos de producto miden entre 447 × 447 y 747 × 1024 px, **por debajo del mínimo de 1200 × 1200** que la propia ficha fijó (§4). No se reescalaron hacia arriba porque eso no agrega detalle. Se recomienda repetir esas tomas cuando se fotografíe el resto del catálogo.

### 1.3 Marca: logo, isotipo y favicons

El logo oficial (`LOGOPIMPOS.png`) contiene una **fotografía real** de un niño. Eso no se puede vectorizar de forma útil: una traza automática produciría un SVG enorme y de peor calidad que el PNG. Por eso el resultado es mixto:

| Asset                                                   | Formato                               | Uso                                                                            |
| ------------------------------------------------------- | ------------------------------------- | ------------------------------------------------------------------------------ |
| `logo-1024/512/256.webp` y `.png`                       | Raster, fondo transparente, recortado | Logo horizontal completo — cabecera, pie, documentos                           |
| `isotipo-pimpos.svg`                                    | **Vector real (21 KB)**               | Isotipo del chef bebé, trazado desde la versión line-art. Escala infinitamente |
| `isotipo-1024/512/256.png` + `.webp`                    | Raster                                | El mismo isotipo, para donde no convenga SVG                                   |
| `favicon.svg`                                           | **Vector**                            | Favicon moderno (el que usan los navegadores actuales)                         |
| `favicon.ico` (16/32/48/64)                             | ICO multi-resolución                  | Compatibilidad con navegadores antiguos                                        |
| `favicon-16.png`, `favicon-32.png`                      | Raster                                | Respaldo explícito                                                             |
| `apple-touch-icon.png` (180)                            | Raster                                | iOS                                                                            |
| `icon-192.png`, `icon-512.png`, `icon-512-maskable.png` | Raster                                | PWA / Android                                                                  |

El isotipo se compuso sobre el azul institucional `#12306E`. **Todos estos archivos son semillas**: el logo y el favicon son administrables desde el panel (ver §4.4), así que el negocio puede sustituirlos sin tocar código.

---

## 2. Requisitos técnicos que se derivan de la ficha

| #       | Requisito                                                                                                 | Origen             | Implicancia técnica                                                              |
| ------- | --------------------------------------------------------------------------------------------------------- | ------------------ | -------------------------------------------------------------------------------- |
| R1      | Sitio público con 8 secciones (Inicio, Nosotros, Productos, Novedades, Galería, Contacto, Ubicación, FAQ) | 5.1                | Renderizado en servidor + SEO real (es su **primera** presencia digital)         |
| R2      | Carrusel de portada de 3–4 slides, **editable por el administrador**                                      | 5.6                | Los slides son datos, no código                                                  |
| R3      | Precios visibles de todos los productos                                                                   | 5.2                | Precio administrable, con historial                                              |
| R4      | Pedidos derivados a WhatsApp (no carrito, no pasarela de pago)                                            | 5.4, 5.5           | Enlaces `wa.me`                                                                  |
| R5      | Mapa interactivo de ubicación                                                                             | 3.1                | Mapa embebido, **coordenadas administrables**                                    |
| R6      | Móvil es prioritario                                                                                      | 5.8                | Mobile-first obligatorio                                                         |
| R7      | Novedades con vigencia inicio/fin que **se despublican solas**                                            | 6.3                | Tarea programada en base de datos                                                |
| R8      | Más de 3 usuarios en el panel, 4 roles + SuperAdmin                                                       | 9, 9.3, 12.1       | Autenticación con roles y permisos por módulo                                    |
| R9      | Historial de cambios: quién modificó y cuándo                                                             | 6.5, 9.2           | Auditoría por triggers                                                           |
| R10     | **Aprobación previa para promociones**                                                                    | 6.5                | Flujo borrador → en revisión → publicado, obligatorio solo en promociones        |
| R11     | Kárdex de insumos: ingreso, consumo y baja, con conversión de unidades                                    | 7.4–7.7            | Movimientos de inventario + equivalencias                                        |
| R12     | Alertas de stock mínimo y de vencimiento próximo                                                          | 7.8 (prio. 1)      | Consultas programadas + notificaciones                                           |
| R13     | Exportar reportes a Excel y PDF                                                                           | 7.8, 8.6           | Generación en servidor                                                           |
| R14     | Ficha de cliente con **hasta 3 fotos de la fachada**                                                      | 8.2, 8.3           | Storage privado + captura desde cámara                                           |
| R15     | Registro desde computadora **y** celular en campo                                                         | 8.5                | Panel responsive                                                                 |
| R16     | Funcionamiento offline con sincronización (deseable)                                                      | 8.5                | PWA — fase posterior                                                             |
| R17     | Enviar WhatsApp desde la ficha del cliente                                                                | 8.6                | Enlace `wa.me` prellenado                                                        |
| R18     | Usuarios con nivel de computadora **básico**                                                              | 6.5                | Panel simple; capacitación presencial + manual                                   |
| R19     | Datos personales: dirección, ubicación y foto del domicilio                                               | 8.3, Anexo D       | **Ley N.° 29733** de Protección de Datos Personales                              |
| R20     | El mantenimiento posterior lo asume Dan                                                                   | 11.5               | Mantenible por una sola persona                                                  |
| **R21** | **Logo y favicon administrables**                                                                         | Decisión del 05/09 | Tabla de configuración del sitio + Storage                                       |
| **R22** | **La base debe poder crecer a e-commerce**                                                                | Decisión del 05/09 | Ver §6: variantes, stock, pedidos y almacenes previstos desde el esquema inicial |

### 2.1 Fuera de alcance de la práctica (pero previsto en el modelo)

- **Facturación / comprobantes**: lo cubre el ERP existente. No se integra ni se reemplaza.
- Carrito y pagos en línea (5.4: solo WhatsApp) — **el esquema los admite sin migración destructiva**.
- Recetas insumo-por-producto (6.6 → "más adelante").
- Historial de pedidos por cliente (8.7 → "etapa posterior").

---

## 3. Hosting y dominio — decisión cerrada

### 3.1 Decisión

> **Opción A: Vercel + Supabase, con el dominio comprado por separado. No se contrata Hostinger Premium.**

El motivo técnico es simple: **Hostinger Premium es hosting compartido PHP/MySQL y no ejecuta Node.js.** Next.js no corre ahí. Para Node, Hostinger exige un VPS, que es otro producto.

### 3.2 ¿Se puede comprar el dominio en Hostinger y usarlo en Vercel o Cloudflare?

**Sí, sin ningún problema.** El registrador (quién te vende el dominio) y el hosting (quién sirve el sitio) son cosas independientes. Solo cambias a dónde apunta el dominio.

Hay dos formas, y para este proyecto conviene la primera:

**A. Delegar el DNS a Cloudflare (recomendada)**

1. Compras `panaderiapimpos.com` en Hostinger.
2. Creas una cuenta gratuita en Cloudflare y agregas el dominio.
3. Cloudflare te da dos nameservers (`xxx.ns.cloudflare.com`).
4. En el panel de Hostinger → _Dominios → DNS / Nameservers_ → los reemplazas por los de Cloudflare.
5. Desde ahí administras todo el DNS en Cloudflare: el registro para Vercel, o el de Workers si migras, y los registros MX del correo.

Ventaja: si más adelante cambias de Vercel a Cloudflare Workers, no vuelves a tocar Hostinger.

**B. Dejar el DNS en Hostinger** y agregar ahí los registros que Vercel te indique (un `A` a `76.76.21.21` y un `CNAME` para `www`). También funciona; solo que quedas administrando DNS en el panel de Hostinger, que es menos cómodo.

**Cosas a verificar al comprar en Hostinger:**

- El **precio de renovación**, no el de promoción. Los registradores baratos suelen renovar bastante más caro. Cloudflare Registrar vende a precio de costo justamente para evitar eso — si Hostinger te sale más barato el año 1 pero renueva a 3×, no era más barato.
- Que incluya **WHOIS privacy** sin costo extra.
- Que permita **cambiar nameservers** (Hostinger lo permite).
- Que el dominio quede **a nombre del negocio**, no a tu nombre personal. Es de la empresa, y evita problemas cuando termines la práctica.

Conclusión: **compra el dominio donde te salga mejor, incluido Hostinger.** Esa decisión es independiente del stack y puede tomarse al final, antes del despliegue. Lo único que no debe comprarse es el **plan de hosting** Premium.

### 3.3 Sobre la pausa de Supabase

El plan gratuito pausa el proyecto tras **7 días de cero peticiones**. Mitigación en tres capas:

1. **Keep-alive** con GitHub Actions (`select 1` cada 3 días). Gratis, desde el día uno.
2. **Tráfico real**: el sitio público sale a producción en setiembre; desde ahí no hay inactividad.
3. **Supabase Pro** (~US$ 25/mes) cuando el negocio lo justifique. La ficha (11.4) confirma que el negocio asume el costo del alojamiento.

> ⚠️ Ojo: si el proyecto llegara a pausarse, **`pg_cron` deja de correr**. Las novedades vencidas no se despublicarían solas hasta reactivarlo. Otra razón para no saltarse el keep-alive.

### 3.4 Configuración y costos

| Componente                            | Servicio                                                      | Costo año 1    |
| ------------------------------------- | ------------------------------------------------------------- | -------------- |
| Dominio `panaderiapimpos.com`         | Hostinger, Namecheap o Cloudflare Registrar — a elección      | ~US$ 10–15     |
| DNS                                   | Cloudflare (gratis)                                           | US$ 0          |
| Hosting de la aplicación              | Vercel (desarrollo) → evaluar Cloudflare Workers (producción) | US$ 0          |
| Base de datos + Auth + Storage        | Supabase Free + keep-alive                                    | US$ 0          |
| Correo `contacto@panaderiapimpos.com` | Zoho Mail plan gratuito                                       | US$ 0          |
| Correo transaccional (alertas)        | Resend Free (3 000/mes)                                       | US$ 0          |
| **Total**                             |                                                               | **~US$ 10–15** |

**Advertencia sobre Vercel:** el plan **Hobby es solo para uso no comercial** según sus términos, y el sitio de una panadería es uso comercial. Alternativa sin esa ambigüedad y también gratuita: **Cloudflare Workers con `@opennextjs/cloudflare`** — su plan gratuito sí permite uso comercial (100 000 peticiones/día). Plan: desarrollar en Vercel, decidir el destino final antes de octubre. Es un cambio de configuración, no de arquitectura.

---

## 4. Stack tecnológico

Versiones verificadas contra el registro de npm el **05/09/2026**.

### 4.1 Base

| Capa               | Tecnología               | Versión    | Justificación                                                                                                                                                                          |
| ------------------ | ------------------------ | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Lenguaje           | **TypeScript**           | **7.0.2**  | Compilador nativo: `tsc` y el type-checking del editor son un orden de magnitud más rápidos que TS 5. En un repo que va a crecer, esto se nota en cada `pnpm build` y en cada guardado |
| Framework          | **Next.js** (App Router) | **16.3.4** | Un solo proyecto para sitio público + panel. Server Components para SEO; Server Actions para las mutaciones del panel sin API REST aparte                                              |
| Runtime UI         | **React**                | **19.2.8** | Requerido por Next 16                                                                                                                                                                  |
| Gestor de paquetes | **pnpm**                 | **12.3.4** | Instalaciones deterministas y enlazado por store: menos disco y CI más rápido                                                                                                          |

> **Nota sobre TypeScript 7:** al ser un compilador reescrito, algún plugin del ecosistema puede ir por detrás. Si aparece una incompatibilidad puntual con ESLint o con algún tipo de librería, la salida es fijar `typescript@5.9` **solo en `devDependencies`** mientras se resuelve. No afecta al código de la aplicación.
>
> Lo que pasó de verdad: TypeScript 7 no lo alcanzan `typescript-eslint` (pide `<6.1`) ni ESLint 10 (`eslint-plugin-react` llega a `^9.7`). Se usan **TypeScript 5.9.3 y ESLint 9.39.5**, documentado en el README.

> **Cache Components está activado** (`cacheComponents: true` en `next.config.ts`). Es lo que permite el modelo que pide el plan: el sitio público sale como HTML estático, lo que depende de la petición llega después en streaming, y el panel invalidará por etiqueta con `revalidateTag` cuando publique (R21, R7). El precio a pagar: todo lo que lea `cookies()`, `headers()` o `searchParams` tiene que ir dentro de un `<Suspense>`, y un `new Date()` suelto rompe el build por ser un valor que cambia entre renderizados. Las dos cosas están resueltas y anotadas en `CLAUDE.md`.

### 4.2 Interfaz

| Capa          | Tecnología                          | Versión            | Justificación                                                          |
| ------------- | ----------------------------------- | ------------------ | ---------------------------------------------------------------------- |
| Estilos       | **Tailwind CSS**                    | **4.3.3**          | Motor CSS-first, configuración por variables CSS nativas               |
| Componentes   | **shadcn/ui** (sobre Radix)         | —                  | Código dentro del repo, modificable. Accesibilidad correcta de fábrica |
| Iconos        | **lucide-react**                    | 1.41.0             | Consistente con shadcn/ui                                              |
| Carrusel (R2) | **embla-carousel-react**            | 8.6.0              | Ligero, accesible, con autoplay                                        |
| Animación     | ~~motion~~ → **CSS nativo**         | —                  | Se instaló y se **quitó**: ver la nota de abajo                        |
| Tipografía    | **`next/font`** con fuentes locales | —                  | Sin peticiones a Google: mejor rendimiento y sin fuga de datos         |
| Tablas        | **@tanstack/react-table**           | 9.2.4              | Kárdex, clientes, productos                                            |
| Gráficos      | **recharts**                        | 3.10.1             | Dashboard de insumos y consumo                                         |
| Formularios   | **react-hook-form** + **zod**       | 7.87.0 / **4.5.4** | El mismo esquema Zod valida en cliente y en servidor                   |

**La animación se hace con CSS nativo guiado por el scroll** (`animation-timeline: view()`), no con
`motion`. La razón está medida, no supuesta: la portada pesa **150 KB de JavaScript comprimido** y
una página sin carrusel ni filtros pesa exactamente lo mismo. Esos 150 KB son React 19 más Next 16;
el código de la aplicación añade 0 KB. `motion` habría costado unos 40 KB, o sea **más que todo el
código de la aplicación junto**, y con la conectividad móvil de Iquitos eso se le cobra al visitante.

`motion` se quitó de `package.json` en lugar de dejarlo sin usar: una dependencia instalada es una
invitación a alcanzarla. Si el panel (F4–F6) la necesita para diálogos o transiciones, vuelve
entonces — ahí no hay presupuesto de portada que cuidar. Detalle: `react-leaflet` se quitó por lo
mismo, el mapa usa Leaflet directamente.

Lo que esto **no** cuesta: el sitio tiene aparición de bloques al bajar, escalonado de rejillas,
acercamiento de fotos y respuesta al pulsar. Ver doc 03 §4.6.

#### Dirección visual

Estilo declarado en 2.6: **tradicional / artesanal**. Colores extraídos de los archivos reales del cliente:

| Rol                           | Color     | Origen                                                                        |
| ----------------------------- | --------- | ----------------------------------------------------------------------------- |
| Azul institucional            | `#12306E` | Texto "PANADERÍA PASTELERÍA Y BODEGA" del logo                                |
| Azul fachada (secundario)     | `#0060A8` | Fachada del local                                                             |
| Crema / masa (fondo)          | `#F7EFE2` | Base cálida, evita el blanco puro                                             |
| Dorado corteza (acento / CTA) | `#C8801F` | Producto horneado                                                             |
| Tinta                         | `#231A14` | Marrón muy oscuro en vez de negro puro                                        |
| Arcoíris del logo             | degradado | **Solo como detalle** (filete divisor, subrayado). Nunca en fondos ni botones |

Tipografías: **Fraunces** (serif variable, cálida) para títulos + **Inter** para texto. Alternativa: **Bitter** + **Source Sans 3**.

### 4.3 Datos, autenticación y almacenamiento

| Capa                         | Tecnología                                           | Versión          | Justificación                                                                               |
| ---------------------------- | ---------------------------------------------------- | ---------------- | ------------------------------------------------------------------------------------------- |
| Base de datos                | **PostgreSQL 15+** en Supabase                       | —                | Transacciones para el kárdex, `numeric` exacto para dinero, `pg_cron` para tareas           |
| Cliente                      | **@supabase/supabase-js** + **@supabase/ssr**        | 2.115.0 / 0.12.6 | Sesión en cookies con Server Components                                                     |
| Tipos                        | `supabase gen types typescript`                      | —                | Los tipos se generan **desde** el esquema. Cambias una columna y el build falla donde debe  |
| Migraciones                  | **Supabase CLI**                                     | 2.116.0          | Esquema versionado en Git, reproducible                                                     |
| Autenticación (R8)           | **Supabase Auth** — email + contraseña               | —                | Usuarios internos; no hace falta OAuth social                                               |
| Autorización (R8)            | **RLS** + rol en el JWT (_custom access token hook_) | —                | La seguridad vive en la base, no en el frontend                                             |
| Almacenamiento               | **Supabase Storage**                                 | —                | Buckets públicos: `marca`, `productos`, `galeria`, `slides`. Bucket **privado**: `clientes` |
| Auditoría (R9)               | Triggers → tabla `auditoria` con `jsonb`             | —                | Automático, imposible de omitir desde la app                                                |
| Tareas programadas (R7, R12) | **pg_cron**                                          | —                | Despublicar novedades y evaluar alertas sin infraestructura extra                           |

**Sin ORM.** Se usa `supabase-js` con tipos generados. Añadir Prisma o Drizzle encima de Supabase duplicaría la definición del esquema y estorbaría a RLS. Los tipos generados ya dan seguridad de tipos, que es lo que aporta un ORM a esta escala.

### 4.4 Funcionalidades específicas

| Requisito                               | Solución                                                                                                                                                                                                                                                                                                                     | Costo                                  |
| --------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------- |
| R4, R17 — WhatsApp                      | Enlaces `https://wa.me/51947874820?text=...`                                                                                                                                                                                                                                                                                 | US$ 0 — sin API de WhatsApp Business   |
| R5 — Mapa                               | **leaflet 1.9.4** sobre OpenStreetMap, sin `react-leaflet`: el mapa se dibuja una vez y no tiene estado que compartir con React, así que envolverlo solo añadía otra librería. Cargado con `dynamic()`, fuera del paquete inicial. Coordenadas semilla `-3.759545048266943, -73.2516156605442`, **editables desde el panel** | US$ 0 — sin tarjeta de crédito         |
| R13 — Excel                             | **exceljs 4.4.0** en Server Action                                                                                                                                                                                                                                                                                           | US$ 0                                  |
| R13 — PDF                               | **@react-pdf/renderer 4.9.0**                                                                                                                                                                                                                                                                                                | US$ 0                                  |
| R14 — Cámara                            | `<input type="file" accept="image/*" capture="environment">`                                                                                                                                                                                                                                                                 | US$ 0                                  |
| Peso de imágenes                        | **browser-image-compression 2.0.2** antes de subir (máx. 1600 px, WebP)                                                                                                                                                                                                                                                      | Crítico: 1 GB de límite gratuito       |
| Optimización                            | `next/image` (AVIF/WebP, `srcset`, lazy)                                                                                                                                                                                                                                                                                     | Conectividad móvil variable en Iquitos |
| SEO (R1)                                | Metadata API, `sitemap.ts`, `robots.ts`, **JSON-LD `Bakery`** con dirección, horarios (1.9), teléfono y coordenadas                                                                                                                                                                                                          | Fundamental                            |
| **R21 — Logo y favicon administrables** | Tabla `configuracion_sitio` + bucket `marca`. El panel sube el archivo y `revalidateTag('marca')` refresca el sitio. Next.js sirve `/icon` y `/apple-icon` desde rutas dinámicas que leen esa configuración                                                                                                                  | US$ 0                                  |
| R12 — Alertas                           | Panel + **resend 6.26.0** (3 000 correos/mes) a `contactopimpos@gmail.com`                                                                                                                                                                                                                                                   | US$ 0                                  |
| R16 — Offline (fase 2)                  | **serwist 9.5.12** + cola en IndexedDB con **dexie 4.4.5**                                                                                                                                                                                                                                                                   | US$ 0                                  |

### 4.5 Herramientas de desarrollo

| Herramienta                             | Versión         | Uso                                                                           |
| --------------------------------------- | --------------- | ----------------------------------------------------------------------------- |
| **eslint** (flat config) + **prettier** | 10.10.0 / 3.9.6 | Estilo consistente                                                            |
| **vitest**                              | 5.0.0           | Unitarias — sobre todo **conversión de unidades** y cálculo de stock          |
| **@playwright/test**                    | 1.63.0          | E2E de flujos críticos: login por rol, alta de producto, movimiento de insumo |
| **pgTAP**                               | —               | Pruebas de RLS: verificar que un repartidor **no** pueda leer insumos         |
| **husky** + **lint-staged**             | —               | Bloquea commits que no compilan                                               |
| **GitHub Actions**                      | —               | CI (typecheck, lint, test) + keep-alive de Supabase                           |
| **Git + GitHub**                        | —               | `dNogueira300/PIMPOS_SYSTEM`, Conventional Commits                            |

---

## 5. Arquitectura

```
┌──────────────────────────────────────────────────────────────┐
│                      Navegador / Celular                     │
│   Sitio público (anónimo)          Panel admin (autenticado) │
└────────────────────────┬─────────────────────────────────────┘
                         │ HTTPS
┌────────────────────────▼─────────────────────────────────────┐
│        Next.js 16 · App Router   (Vercel → Cloudflare)        │
│                                                              │
│   app/(public)/            app/(admin)/                      │
│     inicio, nosotros,        dashboard, contenido,           │
│     productos, novedades,    insumos, clientes,              │
│     galeria, contacto,       usuarios, auditoria,            │
│     ubicacion, faq           configuracion                   │
│                                                              │
│   middleware.ts → refresco de sesión + guardia por rol       │
│   Server Actions → mutaciones validadas con Zod              │
│   ISR + revalidateTag → el sitio público es casi estático    │
└────────────────────────┬─────────────────────────────────────┘
                         │ supabase-js (SSR, cookies)
┌────────────────────────▼─────────────────────────────────────┐
│                         SUPABASE                             │
│  PostgreSQL  → RLS por rol · triggers de auditoría           │
│  Auth        → JWT con claim `rol`                           │
│  Storage     → marca / productos / galeria / slides (público)│
│                clientes (privado, URLs firmadas)             │
│  pg_cron     → despublicar novedades · evaluar alertas       │
└──────────────────────────────────────────────────────────────┘
```

**Un solo proyecto, dos zonas.** El sitio público se genera estáticamente y se revalida cuando el administrador publica (ISR con `revalidateTag`): páginas casi instantáneas incluso con conexión móvil lenta. El panel es dinámico y siempre autenticado.

---

## 6. Modelo de datos preparado para crecer

La ficha describe hoy un sitio informativo con pedidos por WhatsApp. La visión del negocio (2.2) es expandirse. Estas decisiones de esquema hacen que pasar a e-commerce sea **agregar tablas, no migrar las existentes**.

### 6.1 Decisiones estructurales

| Decisión                                                                                                            | Por qué                                                                                                                               | Qué evita mañana                                                                    |
| ------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| **Claves primarias `uuid`** (`gen_random_uuid()`, o `uuidv7()` si la versión de Postgres lo trae)                   | No revelan volumen de negocio en las URLs y no chocan al sincronizar desde el celular (R16)                                           | Renumerar todo al integrar otro sistema                                             |
| **`productos` + `producto_variantes`** desde el día uno                                                             | El catálogo real ya tiene variantes: "Hamburguesa grande de S/ 0.30" y "de S/ 0.40" son la misma familia con distinto tamaño y precio | La migración más dolorosa de un e-commerce es partir un producto plano en variantes |
| **Precio en la variante**, no en el producto, con `precio_historial`                                                | R3 pide precios visibles; el negocio necesita saber cuándo subió cada uno                                                             | Perder el histórico de precios                                                      |
| **`numeric(12,4)` para dinero + `moneda` (`PEN`)**                                                                  | Hay productos a S/ 0.10; con 2 decimales no se pueden expresar descuentos ni costos unitarios reales                                  | Errores de redondeo acumulados en el kárdex                                         |
| **`slug` único por producto y categoría**                                                                           | URLs `panaderiapimpos.com/productos/pan-frances-chico`, indexables                                                                    | Romper URLs ya posicionadas en Google                                               |
| **`almacenes` / `sucursales`** aunque hoy haya un solo local (1.7)                                                  | El stock se registra contra un almacén desde el inicio                                                                                | Reescribir todo el kárdex al abrir la segunda tienda                                |
| **Un solo `movimientos_insumo`** con `tipo` (`ingreso`/`consumo`/`baja`)                                            | Un único kárdex, un único punto de verdad para el saldo                                                                               | Cuadrar tres tablas que se contradicen                                              |
| **Stock como saldo derivado** (vista materializada o tabla de saldos actualizada por trigger), nunca editado a mano | El saldo siempre se puede recalcular desde los movimientos                                                                            | Stock "corregido" a mano que ya no cuadra con nada                                  |
| **Borrado lógico (`deleted_at`)** en catálogo, clientes y usuarios                                                  | R9 exige historial; un producto borrado sigue referenciado por movimientos pasados                                                    | Registros huérfanos y auditoría rota                                                |
| **`created_at` / `updated_at` `timestamptz`** en todas las tablas                                                   | Iquitos es UTC−5; guardar sin zona horaria es un error latente                                                                        | Reportes por periodo desfasados                                                     |
| **`estado_publicacion`** (`borrador`/`en_revision`/`publicado`/`archivado`) en todo contenido                       | R10: **las promociones exigen aprobación previa**                                                                                     | Añadir un flujo de aprobación después, con datos ya cargados                        |
| **Esquemas separados**: `public` (expuesto por la API) y `app` (interno: auditoría, jobs, semillas)                 | Reduce la superficie expuesta por PostgREST                                                                                           | Exponer sin querer tablas internas                                                  |
| **`es_demo boolean`** en las tablas con datos semilla                                                               | Permite borrar todos los datos de ejemplo con un `delete ... where es_demo`                                                           | Datos falsos mezclados con reales en producción                                     |
| **Tablas `pedidos` / `pedido_items` previstas** (no implementadas)                                                  | Las claves foráneas y los estados ya están pensados                                                                                   | Rediseñar el catálogo cuando llegue el carrito                                      |

### 6.2 Entidades

**Configuración (R21, R5)**

- `configuracion_sitio` — clave/valor tipado: logo, favicon, nombre comercial, eslogan, teléfono, WhatsApp, correo, dirección, **coordenadas**, horarios, redes sociales, textos de misión/visión

**Contenido (Módulo 2)**

- `categorias_producto` (6 categorías, §6.1 de la ficha) · `productos` · `producto_variantes` · `producto_imagenes` · `precio_historial`
- `novedades` con `vigencia_inicio`/`vigencia_fin` y `tipo` (**las de tipo `promocion` exigen aprobación**)
- `slides` (carrusel, con orden y vigencia) · `guias` · `galeria` · `faqs` · `testimonios`

**Insumos (Módulo 3)**

- `insumos` · `unidades_medida` · `equivalencias` (1 saco = 50 kg) · `proveedores` · `almacenes`
- `lotes_insumo` (vencimientos) · `movimientos_insumo` (kárdex único) · `saldos_insumo` (derivado)

**Clientes (Módulo 4)**

- `clientes` · `cliente_fotos` (máx. 3, bucket privado) · `zonas_reparto` · `consentimientos` (R19)

**Sistema**

- `perfiles` (extiende `auth.users`) · `roles` · `permisos` · `auditoria` · `notificaciones`

**Previstas, no implementadas:** `recetas` (6.6), `pedidos`, `pedido_items`, `direcciones_cliente` (8.7).

---

## 7. Roles y permisos (sección 9 de la ficha)

| Rol                          | Contenido | Insumos | Clientes | Usuarios         | Notas                                                                                    |
| ---------------------------- | --------- | ------- | -------- | ---------------- | ---------------------------------------------------------------------------------------- |
| **SuperAdmin** (propietario) | ✔         | ✔       | ✔        | ✔                | **Único** que elimina usuarios (12.1, 9.3). También el único que **aprueba promociones** |
| Administrador                | ✔         | ✔       | ✔        | ✔ (sin eliminar) | Aprueba promociones                                                                      |
| Ingeniero (Marcos, Debra)    | ✔         | ✔       | ✔        | ✔ (sin eliminar) | Crea promociones en estado `en_revision`; no las publica                                 |
| Repartidor (×2)              | —         | —       | ✔        | —                | Lectura + registro de clientes                                                           |

Todo se aplica con **políticas RLS**, no ocultando botones. El rol viaja en el JWT mediante un _custom access token hook_, de modo que las políticas lo leen sin una consulta extra por petición.

La ficha (9.1) indica que el propietario y el equipo de desarrollo crean y dan de baja usuarios: se contempla una cuenta de soporte técnico con rol `superadmin`, **documentada y con contraseña entregada al propietario** al cierre de la práctica.

---

## 8. Protección de datos personales (Ley N.° 29733)

El módulo de clientes guarda nombre, celular, dirección, ubicación y **foto del domicilio**. Medidas incluidas:

1. **Bucket `clientes` privado.** Solo URLs firmadas de corta duración. Nunca indexable.
2. **RLS restrictiva:** solo roles con permiso sobre clientes leen esos registros.
3. **Tabla `consentimientos`:** fecha, modo (verbal, según 8.4) y usuario que lo recogió.
4. **Texto de consentimiento** redactado y entregado al negocio (Anexo D).
5. **Auditoría** de todo acceso y modificación a datos de clientes.
6. **Política de retención** a definir con el propietario — decisión del negocio, no técnica.

> **Recomendación:** aunque 8.4 acepta autorización verbal, conviene registrarla en el sistema (casilla marcada por el encargado con fecha, hora y usuario). Es lo que respalda a la empresa ante un reclamo.

---

## 9. Riesgos y mitigaciones

| Riesgo                                           | Impacto                                    | Mitigación                                                                                              |
| ------------------------------------------------ | ------------------------------------------ | ------------------------------------------------------------------------------------------------------- |
| Supabase se pausa por inactividad                | Sitio caído y `pg_cron` detenido           | Keep-alive con GitHub Actions desde el día uno + tráfico real desde setiembre                           |
| Vercel Hobby prohíbe uso comercial               | Suspensión del proyecto                    | Decidir antes de octubre si el despliegue final va a Cloudflare Workers                                 |
| TypeScript 7 aún reciente                        | Algún plugin del ecosistema desactualizado | Fijar `typescript@5.9` en `devDependencies` si aparece un bloqueo puntual                               |
| Fotos de producto por debajo de 1200 px          | Catálogo con imágenes pobres               | Repetir tomas al fotografiar el resto del catálogo                                                      |
| 1 GB de almacenamiento gratuito                  | Se llena con fotos de clientes             | Compresión obligatoria en el navegador + monitoreo mensual                                              |
| Usuarios de nivel básico (R18)                   | El panel no se usa tras la entrega         | Interfaz en español sin jerga, confirmaciones explícitas, capacitación presencial + manual con capturas |
| Único desarrollador y mantenedor (R20)           | El proyecto muere tras la práctica         | Esquema versionado en Git, `README` de despliegue, credenciales entregadas al propietario               |
| Datos personales sin consentimiento formal (R19) | Riesgo legal para el negocio               | Registrar el consentimiento desde la primera versión del módulo                                         |

---

## 10. Decisiones pendientes

1. **Destino de despliegue final:** Vercel vs. Cloudflare Workers. Decidir antes de octubre.
2. **Dónde comprar el dominio** (ver §3.2). Decidir antes del despliegue de setiembre. Comparar **precio de renovación**, no el de promoción.
3. **Período de retención** de datos de clientes — decisión del propietario.
4. **Precios unitarios del catálogo completo:** `LISTAPRODUCTOS.docx` agrupa por bloques (S/ 0.10, 0.40, 0.50) pero varios ítems traen precio propio dentro del bloque. Se carga lo que está confirmado y el resto se completa desde el panel.
5. **Fuentes definitivas** (Fraunces + Inter, o Bitter + Source Sans 3) — a validar con el propietario sobre una maqueta.

---

## 11. Resumen ejecutivo

> **Next.js 16 + TypeScript 7 + Tailwind 4 + shadcn/ui** en el frontend, con **pnpm 12**.
> **Supabase** (PostgreSQL + Auth + Storage + RLS) como backend.
> **Vercel** en desarrollo, **Cloudflare Workers** como destino probable en producción.
> Dominio donde salga mejor precio — **incluido Hostinger** — con el DNS delegado a Cloudflare.
> **No se contrata el plan Premium de Hostinger:** es hosting PHP y no ejecuta la aplicación.
>
> El modelo de datos nace **preparado para e-commerce**: variantes, almacenes, historial de precios y esqueleto de pedidos.
> Todo el contenido —incluidos logo, favicon y coordenadas— es administrable.
>
> Costo del primer año: **~US$ 10–15**.

---

## 12. Documentos relacionados

| Documento                                            | Contenido                                                                                                    |
| ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `Plan de Desarrollo 00 - General y Fases.md`         | Fases F0–F6, cronograma, dependencias, convenciones y estructura del repositorio                             |
| `Plan de Desarrollo 01 - Preparacion y Servicios.md` | **Checklist previo:** qué debe estar listo en Supabase, GitHub, Vercel y el dominio antes de escribir código |
| `Plan de Desarrollo 02 - Backend y Base de Datos.md` | Esquema, migraciones, RLS, triggers, `pg_cron`, Storage y semillas                                           |
| `Plan de Desarrollo 03 - Frontend.md`                | Sitio público y panel de administración: rutas, componentes y sistema de diseño                              |
