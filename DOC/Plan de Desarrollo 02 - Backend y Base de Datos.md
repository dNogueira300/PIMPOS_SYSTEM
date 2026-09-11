# Plan de Desarrollo — 02. Backend y Base de Datos

**Fases cubiertas:** F1 (fundación de datos) y F2 (esquema completo)
**Requisito previo:** Fase 0 cerrada (`Plan de Desarrollo 01`)

> Los fragmentos de SQL de este documento son **de diseño**, para fijar la forma de las tablas y las reglas. La implementación real se escribe como migraciones versionadas en `supabase/migrations/` cuando arranque F2.

---

## 1. Principios

1. **La seguridad vive en la base, no en el frontend.** Toda tabla tiene RLS activada. Si el frontend tuviera un error, la base sigue negando lo que debe negar.
2. **Ninguna tabla se crea sin su política** en la misma migración.
3. **El esquema se versiona en Git.** Nada se toca a mano en el panel de Supabase; lo que no está en una migración, no existe.
4. **Las migraciones no se editan** una vez aplicadas. Se corrige con una migración nueva.
5. **El dinero es `numeric`, nunca `float`.**
6. **Toda fecha es `timestamptz`.**
7. **El saldo de stock se deriva de los movimientos**, nunca se edita a mano.

---

## 2. Esquemas

| Esquema           | Contenido                                                  | Expuesto por la API |
| ----------------- | ---------------------------------------------------------- | ------------------- |
| `public`          | Tablas de negocio que el frontend consulta                 | Sí                  |
| `app`             | Auditoría, funciones internas, hooks, trabajos programados | **No**              |
| `auth`, `storage` | Gestionados por Supabase                                   | Parcial             |

Separar `app` reduce la superficie que PostgREST publica. Todo lo que no necesita salir, no sale.

---

## 3. Orden de migraciones

**Aplicadas (Fase 0 y F1):**

| #    | Archivo                       | Contenido                                                                                         |
| ---- | ----------------------------- | ------------------------------------------------------------------------------------------------- |
| 0001 | `extensiones.sql`             | `pgcrypto`, `pg_cron`, `pg_trgm`, `unaccent`, `pgtap`; esquema `app`                              |
| 0002 | `comunes.sql`                 | Tipos enumerados, `app.set_updated_at()`, `app.rol_actual()`, `app.es_rol()`                      |
| 0003 | `roles_perfiles.sql`          | `roles`, `perfiles`, hook del JWT, RLS                                                            |
| 0004 | `catalogo_roles.sql`          | Las 4 filas de `roles`, con comprobación de que ningún valor del enum quede sin fila              |
| 0005 | `perfil_automatico.sql`       | Trigger sobre `auth.users` que crea el perfil                                                     |
| 0006 | `perfil_siempre_inactivo.sql` | El trigger deja de leer el rol de los metadatos                                                   |
| 0007 | `auditoria.sql`               | Tabla `app.auditoria`, trigger genérico y vista `public.auditoria`                                |
| 0008 | `configuracion.sql`           | `configuracion_sitio` con sus valores iniciales de la ficha                                       |
| 0009 | `catalogo.sql`                | `categorias_producto`, `productos`, `producto_variantes`, `producto_imagenes`, `precio_historial` |
| 0010 | `contenido.sql`               | `novedades` con aprobación, `slides`, `guias`, `galeria`, `faqs`, `testimonios`                   |

**Fase 2, ya aplicadas.** El kárdex acabó necesitando migración propia y los índices se
quedaron en la migración de cada tabla, que es donde se entienden:

| #    | Archivo                 | Contenido                                                                                            |
| ---- | ----------------------- | ---------------------------------------------------------------------------------------------------- |
| 0011 | `insumos.sql`           | `unidades_medida`, `equivalencias`, `proveedores`, `almacenes`, `insumos` y `app.convertir_a_base()` |
| 0012 | `kardex.sql`            | `lotes_insumo`, `movimientos_insumo`, `saldos_insumo` y `app.recalcular_saldos()`                    |
| 0013 | `clientes.sql`          | `zonas_reparto`, `clientes`, `cliente_fotos`, `consentimientos`, `app.sin_tildes()`                  |
| 0014 | `storage_politicas.sql` | Las 12 políticas de los 7 buckets                                                                    |
| 0015 | `cron_alertas.sql`      | `notificaciones`, `app.evaluar_alertas()` y los dos trabajos de `pg_cron`                            |
| 0016 | `vistas.sql`            | Las 9 vistas de lectura del sitio público                                                            |
| 0017 | `pedidos.sql`           | Condiciones del delivery en `configuracion_sitio` (F3, tras el cierre), con la forma comprobada      |
| 0018 | `faq_horario.sql`       | La respuesta del horario en preguntas frecuentes, de 24 h a 12 h, solo si nadie la había reescrito   |
| 0019 | `historia.sql`          | La historia del negocio, reescrita en la voz de la marca, solo si nadie la había reescrito           |
| 0020 | `slides_enfoque.sql`    | `slides.enfoque` (0–100) y la vista ampliada: por qué altura se recorta la foto de cada diapositiva  |

Semillas aparte, en `supabase/seeds/` — y solo para lo que únicamente necesita el entorno de
desarrollo, por el motivo de §3.2.

### 3.1 Estado y verificación

**Fase 2 cerrada el 08/09/2026.** Las 16 migraciones aplican limpio sobre una base vacía.

**27 tablas, todas con RLS activada** — cero sin proteger. 11 vistas, **todas con
`security_invoker`**. 78 políticas (66 en `public`/`app` y 12 en `storage`), 2 trabajos de
`pg_cron`. **326 pruebas pgTAP** en verde, que corren en cada PR.

**Después del cierre** (11/09/2026, F3): `0017_pedidos` añade a `configuracion_sitio` un grupo
`pedidos` con cinco claves —zonas, costo, mínimo, tiempo y formas de pago— y una restricción que
comprueba la forma de cada valor. `0018_faq_horario` pasa a 12 h la respuesta del horario en
preguntas frecuentes, sin pisarla si el negocio ya la había cambiado. `0019_historia` hace lo mismo
con la historia del negocio, y `0020_slides_enfoque` añade a cada diapositiva por qué altura se
recorta su foto. Hoy son **20 migraciones y 359 pruebas pgTAP**.

Las tres últimas comparten una regla: **un texto que el negocio puede haber editado solo se corrige
si sigue siendo el de fábrica**, reconocido por su contenido, y la corrección no se audita, porque
no es un cambio que hiciera una persona.

Las 9 pruebas obligatorias de §11.3 pasan las 9:

| #   | Prueba                                           | Estado |
| --- | ------------------------------------------------ | ------ |
| 1   | Un anónimo no ve productos en borrador           | ✅     |
| 2   | Un anónimo no ve insumos ni clientes             | ✅     |
| 3   | Un repartidor no puede leer insumos              | ✅     |
| 4   | Un repartidor no puede modificar productos       | ✅     |
| 5   | Un ingeniero no puede publicar una promoción     | ✅     |
| 6   | Un administrador sí puede                        | ✅     |
| 7   | Nadie puede alterar `app.auditoria`              | ✅     |
| 8   | Solo el superadmin elimina un perfil             | ✅     |
| 9   | Una baja de insumo sin autorización es rechazada | ✅     |

Y tres comprobaciones que **pgTAP no puede hacer**, porque prueban lo que hay más allá de SQL. Las
tres corren en cada PR:

| Guion                                | Qué prueba que una consulta no probaría                                                                 |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------- |
| `scripts/verificar-fase0.sh`         | Que el registro público está cerrado y el rol viaja dentro del JWT                                      |
| `scripts/verificar-storage.sh`       | Que un archivo del bucket `clientes` no se descarga. Quien decide eso es la API de Storage, no una fila |
| `scripts/verificar-sitio-publico.sh` | El camino entero del navegador: PostgREST, los permisos de la vista y el bucket público                 |

### 3.2 Cinco correcciones que salieron de aplicar esto de verdad

**`app.rol_actual()` devuelve NULL sin sesión**, no `'repartidor'` como proponía §4.3. Quien no
trae JWT no debe heredar el rol menos privilegiado, porque `repartidor` lee `clientes` — con
direcciones y fotos de domicilios. `app.es_rol()` traduce ese NULL a `false`, así que las políticas
fallan cerradas.

**El catálogo de roles es una migración, no una semilla** (0004). `supabase db push` **no aplica
semillas** salvo con `--include-seed`, así que el primer despliegue dejó `public.roles` vacía en
producción; como `perfiles.rol` tiene clave foránea contra ella, la primera alta de usuario habría
fallado con un error de FK ilegible. Regla que sale de ahí: **si un dato tiene que existir en todos
los entornos, va en una migración.** Las semillas son solo para desarrollo.

**Ningún metadato concede el rol** (0006). La primera versión del trigger lo leía de
`raw_user_meta_data`, que el propio usuario puede escribir (`updateUser`, u `options.data` al
registrarse): con los registros abiertos, cualquiera se daría de alta como `superadmin`. La salida
aparente era `raw_app_meta_data`, que solo escribe la Admin API — pero GoTrue inserta la fila
primero y añade ese metadato en un **UPDATE posterior**, de modo que un trigger `AFTER INSERT` nunca
llega a verlo (comprobado: un alta con `{"rol":"superadmin"}` producía un perfil `repartidor`
inactivo). El trigger conserva lo que sí aportaba: garantizar que toda alta tenga su perfil, y que
nazca **inactiva**. El rol lo asigna siempre una persona, con una escritura explícita.

**El correo del autor se guarda en la fila de auditoría, no se resuelve al leer** (0007). La vista
tiene que declarar `security_invoker` —sin él saltaría la RLS y cualquiera con sesión vería el
historial completo—, y eso obliga a que quien consulta tenga privilegios sobre todo lo que la vista
toca. Resolver el correo al leer habría exigido dar acceso a `auth.users` a cualquier autenticado,
exponiendo los datos de todos los usuarios. Guardarlo en el momento además es mejor auditoría:
sobrevive a que la cuenta se borre.

**El historial de precios se ordena por secuencia, no por fecha** (0009). `vigente_desde` toma
`now()`, que es la hora de **inicio de la transacción**: dos cambios dentro de la misma quedaban con
marca idéntica y sin desempate posible. Con una clave secuencial el orden de inserción está
garantizado. Mismo criterio que `app.auditoria`.

---

## 4. Piezas comunes

### 4.1 Convención de columnas

Toda tabla de negocio lleva:

```sql
id           uuid primary key default gen_random_uuid(),
created_at   timestamptz not null default now(),
updated_at   timestamptz not null default now(),
created_by   uuid references auth.users(id),
updated_by   uuid references auth.users(id),
deleted_at   timestamptz            -- borrado lógico
```

Las tablas con datos de ejemplo llevan además `es_demo boolean not null default false`, para poder purgarlas de un golpe cuando llegue el contenido real.

### 4.2 Tipos enumerados

```sql
create type app.rol_usuario         as enum ('superadmin','administrador','ingeniero','repartidor');
create type app.estado_publicacion  as enum ('borrador','en_revision','publicado','archivado');
create type app.tipo_novedad        as enum ('promocion','nuevo_producto','campania','evento','aviso');
create type app.tipo_movimiento     as enum ('ingreso','consumo','baja');
create type app.motivo_baja         as enum ('merma','vencimiento','danado','devolucion_proveedor','consumo_interno');
create type app.origen_consumo      as enum ('produccion','retiro_directo');
```

`estado_publicacion` existe desde el inicio aunque hoy solo las promociones exijan aprobación (R10). Añadir un flujo de aprobación después, con datos ya cargados, es mucho más caro.

### 4.3 Helper de rol

Las políticas RLS lo usan en todas partes. Lee el claim que el hook del JWT inyectó (Fase 0, §3.4), sin consultar ninguna tabla:

```sql
create or replace function app.rol_actual() returns app.rol_usuario
language sql stable as $$
  select coalesce(
    nullif(current_setting('request.jwt.claims', true)::jsonb ->> 'rol',''),
    'repartidor'
  )::app.rol_usuario;
$$;

create or replace function app.es_rol(variadic roles app.rol_usuario[]) returns boolean
language sql stable as $$ select app.rol_actual() = any(roles); $$;
```

---

## 5. Auditoría (R9)

Requisito de la ficha 6.5 y 9.2: registrar quién modificó y cuándo. Se hace con un trigger genérico, no confiando en que la aplicación se acuerde de registrarlo.

```sql
create table app.auditoria (
  id           bigint generated always as identity primary key,
  tabla        text        not null,
  registro_id  uuid,
  operacion    text        not null,          -- INSERT | UPDATE | DELETE
  usuario_id   uuid,
  rol          text,
  datos_antes  jsonb,
  datos_despues jsonb,
  ocurrido_en  timestamptz not null default now()
);
```

Un único `app.registrar_auditoria()` se engancha `AFTER INSERT OR UPDATE OR DELETE` a cada tabla auditable.

**Se auditan:** productos, variantes, precios, novedades, slides, configuración, insumos, movimientos, clientes, fotos de clientes, perfiles y usuarios.

> **La auditoría solo la lee el SuperAdmin y el Administrador. Nadie la puede modificar ni borrar** — sin política de `UPDATE` ni de `DELETE`, ni siquiera para ellos. Una auditoría editable no sirve de nada.

---

## 6. Configuración del sitio (R21, R5)

Lo que hace administrables el logo, el favicon, las coordenadas y los datos de contacto.

```sql
create table public.configuracion_sitio (
  clave        text primary key,             -- 'logo_url', 'favicon_url', 'coordenadas', ...
  valor        jsonb not null,
  descripcion  text  not null,               -- se muestra al administrador en el panel
  grupo        text  not null,               -- 'marca' | 'contacto' | 'ubicacion' | 'horarios' | 'redes'
  updated_at   timestamptz not null default now(),
  updated_by   uuid references auth.users(id)
);
```

Claves iniciales:

| Grupo       | Claves                                                                              |
| ----------- | ----------------------------------------------------------------------------------- |
| `marca`     | `logo_url`, `logo_alt`, `favicon_url`, `isotipo_url`, `nombre_comercial`, `eslogan` |
| `contacto`  | `telefono`, `whatsapp`, `correo`, `correo_reclamos`                                 |
| `ubicacion` | `direccion`, `referencia`, `distrito`, `provincia`, **`coordenadas`**               |
| `horarios`  | `horario_semanal` (jsonb con los dos turnos por día, ficha 1.9)                     |
| `redes`     | `facebook`, `instagram`                                                             |
| `textos`    | `historia`, `mision`, `vision`, `valores`                                           |

Valor semilla de coordenadas, tomado del dato entregado el 05/09:

```sql
('coordenadas',
 '{"lat": -3.759545048266943, "lng": -73.2516156605442}'::jsonb,
 'Punto exacto del local en el mapa', 'ubicacion')
```

**Cómo se vuelve administrable el favicon en Next.js:** `app/icon.tsx` y `app/apple-icon.tsx` son rutas dinámicas que leen `favicon_url` de esta tabla. Al guardar desde el panel se dispara `revalidateTag('marca')` y el sitio toma el archivo nuevo sin volver a desplegar.

---

## 7. Catálogo, preparado para e-commerce (R22)

### 7.1 Producto y variantes

El catálogo real ya tiene variantes: _Hamburguesa grande de S/ 0.30_ y _de S/ 0.40_ son la misma familia con distinto precio. Partir un producto plano en variantes más adelante es la migración más dolorosa de un e-commerce, así que se hace ahora.

```sql
create table public.productos (
  id            uuid primary key default gen_random_uuid(),
  categoria_id  uuid not null references public.categorias_producto(id),
  nombre        text not null,
  slug          text not null unique,          -- /productos/pan-frances-chico
  descripcion   text,
  destacado     boolean not null default false, -- ficha 6.2
  estado        app.estado_publicacion not null default 'borrador',
  orden         integer not null default 0,
  es_demo       boolean not null default false,
  -- created_at / updated_at / created_by / updated_by / deleted_at
);

create table public.producto_variantes (
  id             uuid primary key default gen_random_uuid(),
  producto_id    uuid not null references public.productos(id) on delete cascade,
  nombre         text not null,                  -- 'Chico', 'Grande con ajonjolí'
  sku            text unique,
  precio         numeric(12,4) not null check (precio >= 0),
  moneda         char(3) not null default 'PEN',
  unidad_venta   text not null,                  -- 'unidad' | 'docena' | 'kilo' | 'bolsa'
  es_predeterminada boolean not null default false,
  activo         boolean not null default true,
  -- campos previstos para e-commerce, sin usar todavía:
  stock_disponible integer,
  peso_gramos      integer
);
```

**Por qué `numeric(12,4)` y no `(10,2)`:** hay productos a S/ 0.10. Con dos decimales no se puede expresar un descuento del 15 %, ni un costo unitario derivado del kárdex, sin arrastrar error de redondeo.

### 7.2 Historial de precios

```sql
create table public.precio_historial (
  id           uuid primary key default gen_random_uuid(),
  variante_id  uuid not null references public.producto_variantes(id) on delete cascade,
  precio       numeric(12,4) not null,
  vigente_desde timestamptz not null default now(),
  registrado_por uuid references auth.users(id)
);
```

Un trigger sobre `producto_variantes` inserta aquí cada vez que cambia `precio`. El negocio necesita saber cuándo subió cada precio, y eso no se puede reconstruir después.

### 7.3 Categorías

Las 6 de la ficha (§6.1): panes clásicos, panes especiales, panes integrales, panes tostados, snacks, bodega. Con `slug`, `orden` e `imagen_url` (placeholder para los productos aún sin foto).

---

## 8. Contenido

### 8.1 Novedades con aprobación (R7, R10)

```sql
create table public.novedades (
  id              uuid primary key default gen_random_uuid(),
  tipo            app.tipo_novedad not null,
  titulo          text not null,
  slug            text not null unique,
  contenido       text not null,
  imagen_url      text,
  estado          app.estado_publicacion not null default 'borrador',
  vigencia_inicio timestamptz,
  vigencia_fin    timestamptz,
  aprobada_por    uuid references auth.users(id),
  aprobada_en     timestamptz,
  es_demo         boolean not null default false,
  constraint vigencia_coherente check (
    vigencia_fin is null or vigencia_inicio is null or vigencia_fin > vigencia_inicio
  )
);
```

**La regla de aprobación se impone en la base**, no solo en la interfaz:

```sql
-- Una promoción no puede quedar publicada sin aprobación de administrador o superadmin
create or replace function app.exigir_aprobacion_promocion() returns trigger
language plpgsql as $$
begin
  if new.tipo = 'promocion' and new.estado = 'publicado' then
    if not app.es_rol('administrador','superadmin') then
      raise exception 'Las promociones requieren aprobación de un administrador';
    end if;
    new.aprobada_por := auth.uid();
    new.aprobada_en  := now();
  end if;
  return new;
end $$;
```

Así, un ingeniero puede crear y editar una promoción, pero al intentar publicarla la base lo rechaza. El resto de tipos de novedad se publica sin aprobación.

### 8.2 Slides del carrusel (R2)

`slides`: `titulo`, `subtitulo`, `imagen_url`, `imagen_movil_url`, `enlace_url`, `texto_boton`, `orden`, `estado`, `vigencia_inicio`, `vigencia_fin`, `es_demo`.

`imagen_movil_url` separada porque una imagen apaisada de portada recortada a un celular deja el texto fuera de cuadro, y el móvil es prioritario (R6).

### 8.3 Otras tablas

`guias` (ficha 6.4: "cómo hacer un pedido", "cómo realizar un reclamo") · `galeria` (con `categoria`: fachada, interior, atención, hornos, productos) · `faqs` (las 5 de la ficha 5.9) · `testimonios` (3 semillas con `es_demo = true`).

---

## 9. Insumos — el módulo con más lógica (R11)

### 9.1 Unidades y equivalencias (ficha 7.4)

```sql
create table public.unidades_medida (
  id      uuid primary key default gen_random_uuid(),
  codigo  text not null unique,   -- 'kg','g','l','unidad','saco','caja','bolsa','paquete','botella','rollo'
  nombre  text not null,
  tipo    text not null           -- 'masa' | 'volumen' | 'conteo'
);

create table public.equivalencias (
  id           uuid primary key default gen_random_uuid(),
  insumo_id    uuid not null references public.insumos(id) on delete cascade,
  unidad_desde uuid not null references public.unidades_medida(id),  -- saco
  unidad_hacia uuid not null references public.unidades_medida(id),  -- kg
  factor       numeric(14,6) not null check (factor > 0),            -- 50
  unique (insumo_id, unidad_desde, unidad_hacia)
);
```

La equivalencia cuelga del **insumo**, no es global: un saco de harina son 50 kg, pero un saco de sal son 25 kg (ficha 7.2). Una tabla global de conversiones sería incorrecta desde el primer registro.

> Esta es la lógica con más riesgo de error silencioso del sistema. **Va cubierta con pruebas de Vitest antes de escribir la interfaz**, y con restricciones `check` en la base.

### 9.2 Kárdex: una sola tabla

```sql
create table public.movimientos_insumo (
  id             uuid primary key default gen_random_uuid(),
  tipo           app.tipo_movimiento not null,
  insumo_id      uuid not null references public.insumos(id),
  almacen_id     uuid not null references public.almacenes(id),
  lote_id        uuid references public.lotes_insumo(id),
  cantidad       numeric(14,4) not null check (cantidad > 0),
  unidad_id      uuid not null references public.unidades_medida(id),
  cantidad_base  numeric(14,4) not null,     -- convertida a la unidad base del insumo
  ocurrido_en    timestamptz not null default now(),
  responsable_id uuid not null references auth.users(id),
  observacion    text,

  -- solo ingreso (ficha 7.5)
  proveedor_id      uuid references public.proveedores(id),
  documento_tipo    text,                    -- boleta | factura | guia
  documento_numero  text,
  precio_unitario   numeric(12,4),
  costo_total       numeric(14,4),
  fecha_vencimiento date,

  -- solo consumo (ficha 7.6)
  origen_consumo  app.origen_consumo,
  destino_lote    text,
  area_turno      text,

  -- solo baja (ficha 7.7)
  motivo_baja     app.motivo_baja,
  autorizado_por  uuid references auth.users(id),

  constraint ingreso_completo check (
    tipo <> 'ingreso' or (proveedor_id is not null and documento_tipo is not null)
  ),
  constraint baja_autorizada check (
    tipo <> 'baja' or (motivo_baja is not null and autorizado_por is not null)
  )
);
```

Tres decisiones que sostienen todo el módulo:

1. **Una sola tabla, un solo kárdex.** Tres tablas separadas terminan contradiciéndose y nadie sabe cuál tiene razón.
2. **`cantidad_base` se calcula por trigger** al insertar, aplicando la equivalencia. El saldo suma siempre la misma unidad; nadie suma sacos con kilos.
3. **`baja_autorizada` es una restricción de la base.** La ficha 7.7 exige autorización del encargado para registrar una baja; si eso vive solo en la interfaz, se salta con una petición directa a la API.

### 9.3 Saldos

`saldos_insumo` (`insumo_id`, `almacen_id`, `cantidad_base`, `actualizado_en`) se mantiene por trigger sobre `movimientos_insumo` y **nunca se edita a mano**. Se puede recalcular en cualquier momento desde los movimientos, que es lo que hace confiable el número.

### 9.4 Alertas (R12, prioridad 1)

Dos trabajos de `pg_cron`, diarios:

```sql
-- Novedades vencidas: se despublican solas (R7)
select cron.schedule('despublicar-novedades', '5 5 * * *', $$
  update public.novedades
     set estado = 'archivado'
   where estado = 'publicado'
     and vigencia_fin is not null
     and vigencia_fin < now();
$$);

-- Alertas de stock e insumos por vencer (R12)
select cron.schedule('evaluar-alertas', '10 11 * * *', $$ select app.evaluar_alertas(); $$);
```

Horas en UTC: `5 5 * * *` es 00:05 en Iquitos; `10 11 * * *` es 06:10, justo antes del turno de la mañana (la panadería abre 4:00 am).

`app.evaluar_alertas()` inserta en `notificaciones`: stock por debajo del mínimo, y lotes que vencen dentro de 15 días.

> Recordatorio: **si el proyecto Supabase se pausa, `pg_cron` no corre.** El keep-alive de la Fase 0 sostiene esto.

---

## 10. Clientes y datos personales (R14, R19)

```sql
create table public.clientes (
  id             uuid primary key default gen_random_uuid(),
  nombre_completo text not null,
  celular        text not null,
  direccion      text not null,
  referencia     text,
  zona_id        uuid references public.zonas_reparto(id),
  latitud        numeric(10,7),           -- previsto; hoy se captura solo la dirección (ficha 8.3)
  longitud       numeric(10,7),
  activo         boolean not null default true,
  es_demo        boolean not null default false
);

create table public.cliente_fotos (
  id          uuid primary key default gen_random_uuid(),
  cliente_id  uuid not null references public.clientes(id) on delete cascade,
  ruta        text not null,               -- ruta en el bucket PRIVADO 'clientes'
  orden       smallint not null check (orden between 1 and 3)   -- máximo 3 (ficha 8.3)
);

create table public.consentimientos (
  id           uuid primary key default gen_random_uuid(),
  cliente_id   uuid not null references public.clientes(id) on delete cascade,
  modo         text not null default 'verbal',   -- ficha 8.4
  otorgado_en  timestamptz not null default now(),
  registrado_por uuid not null references auth.users(id),
  texto_version text not null                    -- versión del texto que se le leyó
);
```

**El límite de 3 fotos es una restricción de la base** (`check` + índice único por `(cliente_id, orden)`), no una validación de formulario.

`texto_version` guarda **qué** se le leyó al cliente. Si el texto de consentimiento cambia, se sabe qué aceptó cada persona — que es justamente lo que respalda a la empresa ante un reclamo.

---

## 11. RLS — matriz de políticas

Toda tabla arranca con `alter table ... enable row level security;` y **sin ninguna política**, es decir, negando todo. Después se abre lo estrictamente necesario.

| Tabla                                                                           | Lectura anónima (sitio público)                           | Lectura autenticada                                  | Escritura                                                                         |
| ------------------------------------------------------------------------------- | --------------------------------------------------------- | ---------------------------------------------------- | --------------------------------------------------------------------------------- |
| `productos`, `producto_variantes`, `producto_imagenes`                          | Solo `estado='publicado'` y `deleted_at is null`          | Todos los roles                                      | superadmin, administrador, ingeniero                                              |
| `categorias_producto`, `faqs`, `guias`, `galeria`, `testimonios`                | Solo publicados                                           | Todos                                                | superadmin, administrador, ingeniero                                              |
| `novedades`, `slides`                                                           | Publicados **y vigentes** (`now()` dentro de la vigencia) | Todos                                                | Crear/editar: los tres. **Publicar promociones: solo administrador y superadmin** |
| `configuracion_sitio`                                                           | Solo el grupo público                                     | Todos                                                | superadmin, administrador                                                         |
| `insumos`, `movimientos_insumo`, `saldos_insumo`, `proveedores`, `lotes_insumo` | **Ninguna**                                               | superadmin, administrador, ingeniero                 | Los mismos. Bajas exigen `autorizado_por`                                         |
| `clientes`, `cliente_fotos`, `consentimientos`                                  | **Ninguna**                                               | superadmin, administrador, ingeniero, **repartidor** | Los mismos cuatro                                                                 |
| `perfiles`, `roles`                                                             | Ninguna                                                   | Todos ven el suyo; los admins ven todos              | superadmin, administrador. **Eliminar: solo superadmin** (ficha 12.1)             |
| `app.auditoria`                                                                 | Ninguna                                                   | superadmin, administrador                            | **Nadie.** Solo el trigger inserta                                                |

### 11.1 Ejemplo de política pública

```sql
create policy "publico ve productos publicados"
on public.productos for select to anon
using (estado = 'publicado' and deleted_at is null);
```

### 11.2 Ejemplo con vigencia (R7)

```sql
create policy "publico ve novedades vigentes"
on public.novedades for select to anon
using (
  estado = 'publicado'
  and (vigencia_inicio is null or vigencia_inicio <= now())
  and (vigencia_fin    is null or vigencia_fin    >= now())
);
```

Doble red: la política filtra por vigencia **y** el cron archiva las vencidas. Si el cron no corriera, el público igual no vería una promoción caducada.

### 11.3 Pruebas pgTAP obligatorias

`supabase/tests/` debe verificar, como mínimo:

- [ ] Un usuario anónimo **no** ve productos en borrador
- [ ] Un usuario anónimo **no** ve ninguna fila de `insumos` ni de `clientes`
- [ ] Un **repartidor** no puede leer `insumos`
- [ ] Un **repartidor** no puede modificar `productos`
- [ ] Un **ingeniero** no puede publicar una novedad de tipo `promocion`
- [ ] Un **administrador** sí puede
- [ ] Nadie puede hacer `update` ni `delete` sobre `app.auditoria`
- [ ] Solo el **superadmin** puede eliminar un perfil
- [ ] Una baja de insumo sin `autorizado_por` es rechazada

> Estas pruebas son las que convierten la matriz de arriba en algo verificable. Sin ellas, la seguridad es una intención.

---

## 12. Políticas de Storage

| Bucket                                               | `select`                                                          | `insert` / `update` / `delete`       |
| ---------------------------------------------------- | ----------------------------------------------------------------- | ------------------------------------ |
| `marca`, `productos`, `galeria`, `slides`, `insumos` | Público                                                           | superadmin, administrador, ingeniero |
| **`clientes`**                                       | **Solo autenticados con permiso sobre clientes**, vía URL firmada | Los cuatro roles                     |
| `documentos`                                         | Solo autenticados                                                 | superadmin, administrador            |

Convención de rutas: `productos/{producto_id}/{uuid}.webp`, `clientes/{cliente_id}/{orden}.webp`. Poner el id de la entidad en la ruta permite escribir políticas que dependan del registro dueño del archivo.

---

## 13. Índices

```sql
-- Búsqueda de clientes por nombre (ficha 8.6, prioridad 1) — tolerante a tildes y errores
create index idx_clientes_nombre_trgm
  on public.clientes using gin (unaccent(lower(nombre_completo)) gin_trgm_ops);

create index idx_clientes_celular on public.clientes (celular);
create index idx_clientes_zona    on public.clientes (zona_id) where activo;

-- Kárdex: el reporte más consultado es "movimientos de un insumo en un periodo"
create index idx_mov_insumo_fecha on public.movimientos_insumo (insumo_id, ocurrido_en desc);
create index idx_mov_tipo_fecha   on public.movimientos_insumo (tipo, ocurrido_en desc);

-- Vencimientos próximos (R12)
create index idx_lotes_vencimiento on public.lotes_insumo (fecha_vencimiento)
  where fecha_vencimiento is not null;

-- Sitio público
create index idx_productos_publicados on public.productos (categoria_id, orden)
  where estado = 'publicado' and deleted_at is null;
```

Los índices parciales (`where`) son deliberados: el sitio público solo consulta lo publicado, y ese índice es una fracción del total.

---

## 13.1 Las vistas de lectura (0016)

Regla que fija la migración 0016: **el sitio público lee vistas, nunca tablas.** Cada página de la
Fase 3 tiene la suya —`productos_publicos`, `categorias_publicas`, `novedades_publicas`,
`slides_publicos`, `guias_publicas`, `galeria_publica`, `faqs_publicas`, `testimonios_publicos`,
`configuracion_publica`— con las columnas listas y sin los metadatos internos (`created_by`,
`updated_by`, `deleted_at`, ni quién aprobó una promoción).

**`security_invoker = true` es lo único innegociable del archivo.** Una vista de Postgres se ejecuta
por omisión con los privilegios de quien la creó, que aquí es `postgres` y salta toda la RLS. Una
sola vista sin esa opción convierte la API pública en un agujero: bastaría consultarla para leer los
borradores y las promociones sin aprobar, con las políticas de las tablas intactas y sin que nada
parezca roto. Y **no se puede activar RLS sobre una vista**: la protección es esa opción más la RLS
de debajo, no hay segunda línea. Por eso la prueba pgTAP no recorre las nueve vistas nuevas sino
**todas las de `public`**, para que la siguiente que se escriba tampoco pueda olvidarla.

La segunda decisión, menos obvia: **cada vista repite en su `where` la condición de publicado**,
aunque la RLS ya la imponga al anónimo. No sobra. Un administrador con sesión sí puede leer los
borradores, así que sin ese `where` la misma vista significaría una cosa para el visitante y otra
para el panel — y la vista previa mostraría un "desde S/" calculado con variantes desactivadas.
Quien niega el acceso es la RLS; quien define el contenido es el `where`. Hay prueba de que al
administrador le sale exactamente el mismo precio que al visitante.

`productos_publicos` resuelve en una fila la categoría, el rango de precios, la variante
predeterminada y la imagen principal; sin ella el frontend haría cuatro consultas y agruparía en el
navegador. El precio va en la tarjeta y no escondido en el detalle: hay panes a S/ 0.10 y eso se
enseña con orgullo. `configuracion_publica` devuelve las claves públicas como un único objeto
`jsonb` —el layout necesita logo, horarios, teléfono y redes en todas las páginas— y deja fuera
`correo_alertas` y `dias_aviso_vencimiento`, que son de uso interno.

---

## 14. Semillas

`supabase/seeds/` se divide en dos, y la diferencia importa:

**`01_maestros.sql` — datos reales, permanentes** (`es_demo = false`)

- Catálogo de `LISTAPRODUCTOS.docx`: **34 productos y 36 variantes** con los precios confirmados
- **22 insumos** con presentación, stock mínimo y perecibilidad (ficha 7.2), y sus equivalencias
- **6 proveedores** (ficha 7.9) y 1 almacén ("Almacén principal")
- **10 fotos del local** para la galería, y las fotos de producto e insumo que se pudieron asignar

Lo que el borrador ponía aquí y acabó en una **migración**, porque tiene que existir en todos los
entornos y `db push` no aplica semillas: los 4 roles (0004), la configuración del sitio (0008), las
6 categorías (0009), las 5 preguntas frecuentes y las 2 guías (0010), las 11 unidades de medida
(0011) y las zonas de reparto (0013).

Para cargarlo en producción una vez: `supabase db push --include-seed`.

**`02_demo.sql` — datos de ejemplo, desechables** (`es_demo = true`)

- 3 slides de portada, con fotos reales del local y textos de relleno
- 3 testimonios, firmados como "Cliente de ejemplo"
- 3 clientes de ejemplo, con celulares 900000001-3

Dos decisiones sobre el relleno, y el motivo:

- **Los testimonios no llevan nombre de persona.** Un testimonio inventado con nombre y apellido es
  una reseña falsa en cuanto alguien lo publica sin mirar. Estos existen para que la maqueta tenga
  bloques del largo correcto y se nota que lo son.
- **Los clientes son inventados y se nota.** En una tabla que en producción guardará nombres,
  celulares y direcciones de vecinos del barrio, un dato de relleno que parezca auténtico es el que
  acaba colándose en una captura de pantalla o en un reporte.

Con un `delete from ... where es_demo` se limpian todos los datos de ejemplo cuando llegue el contenido real. Sin esa bandera, los datos falsos se quedan mezclados para siempre. Además, `02_demo.sql` no llega a producción por construcción: `db push` no aplica semillas, y la de datos reales se carga aparte.

### 14.1 Carga de imágenes semilla

Los archivos de `DOC\Fotos y documentos Adjuntados Pimpos\_OPTIMIZADO\` se suben a los buckets con `supabase/seeds/imagenes/subir-imagenes.sh` (62 archivos, se puede repetir sin borrar antes):

| Origen                                               | Bucket destino |
| ---------------------------------------------------- | -------------- |
| `marca/` (19 archivos: logo, isotipo, favicons)      | `marca`        |
| `productos/` (10 archivos: 5 fotos y sus miniaturas) | `productos`    |
| `insumos/` (10 archivos)                             | `insumos`      |
| `lugar/` (20 archivos)                               | `galeria`      |
| 3 fotos del local, reutilizadas para la portada      | `slides`       |

**Convención de rutas:** cada columna de imagen guarda la **ruta dentro de su bucket**, no una URL.
El bucket lo determina la tabla (`galeria` → bucket `galeria`) y la URL pública la compone el
frontend. Guardar la URL entera ataría las filas al dominio del proyecto: bastaría cambiar de
proyecto para romper todas las imágenes a la vez.

Dos avisos que salieron al hacerlo:

- **`supabase db reset` vacía los buckets** (recrea los contenedores de Storage). Las filas de la
  base sobreviven, los archivos no: después de cada reset hay que volver a correr el guion.
- **De las 5 fotos de producto solo 2 se pudieron asignar.** El catálogo no tiene ninguna
  "hamburguesa mediana" —hay chica, suave y grande— ni "kekito" ni "palitos salados". Las tres
  quedan subidas al bucket pero sin fila: se asignan desde el panel en la Fase 4, que es donde se
  ven la foto y el producto a la vez. Adivinar la talla en una foto es rotular mal el catálogo
  público.

---

## 15. Checklist de cierre de F2

Cerrado el **08/09/2026**. Cada línea se marcó ejecutándola, no leyéndola.

- [x] Las 16 migraciones aplican limpio sobre una base vacía
- [x] `supabase db reset` reconstruye todo desde cero sin errores
- [x] **Todas** las tablas tienen RLS activada — 27 de 27, comprobado con `pg_class.relrowsecurity`
- [x] **Todas** las vistas llevan `security_invoker` — 11 de 11, y la prueba recorre las que vengan después
- [x] Las 9 pruebas pgTAP de §11.3 pasan
- [x] Los tipos TypeScript se generan sin errores (`supabase gen types typescript`)
- [x] Los dos trabajos de `pg_cron` están programados; sus funciones se ejecutan en las pruebas
- [x] Las semillas cargan, son idempotentes, y las 62 imágenes están en sus buckets
- [x] El bucket `clientes` sigue siendo privado tras cargar las semillas
- [x] Un `db dump` restaura correctamente en local — ensayo completo, ver §15.1

### 15.1 El ensayo de restauración, y lo que encontró

El plan gratuito no hace copias automáticas, así que este punto no se podía marcar leyendo la
documentación. Se hizo el simulacro entero: volcar, vaciar la base, aplicar migraciones, restaurar,
y volver a pasar las 326 pruebas. Encontró tres cosas:

1. **`psql < datos.sql` no funciona.** Las migraciones no dejan la base vacía —`0004` carga los
   roles, `0008` las 26 claves de configuración, `0009` las categorías— y el trigger de auditoría
   registra cada una. El volcado trae esas mismas filas y la carga muere en la primera tabla, con
   `duplicate key ... auditoria_pkey`. Hay que vaciar antes.
2. **El volcado no lleva las políticas de Storage ni los trabajos de cron**, porque viven en los
   esquemas `storage` y `cron` y `supabase db dump` vuelca `public` y `app`. Una restauración que
   solo cargue el volcado deja el bucket `clientes` sin políticas —inalcanzable para el panel— y
   sin alertas de stock. Por eso el orden empieza siempre por `supabase db push`.
3. **El volcado sí lleva los usuarios**, con su contraseña cifrada: tras restaurar, el usuario de
   prueba entró con su contraseña de siempre. Eso es una buena noticia para la recuperación y una
   mala para el manejo del archivo: **un respaldo de esta base es material sensible** — usuarios,
   y nombres, celulares y direcciones de clientes (Ley N.° 29733). `respaldos/` está en
   `.gitignore`.

El procedimiento quedó en `PIMPOS_SYSTEM/docs/respaldo-y-restauracion.md` y automatizado en
`scripts/restaurar-respaldo.sh`, que vacía, descarta los buckets del volcado y comprueba al
terminar que las políticas de Storage y el cron siguen en pie.
