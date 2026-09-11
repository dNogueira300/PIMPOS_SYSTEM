# Respaldo y restauración

El plan gratuito de Supabase **no hace copias automáticas**. Lo que hay es el flujo de trabajo
`respaldo semanal de Supabase` (domingos a las 04:00 de Iquitos), que vuelca roles, esquema y datos
y los guarda 90 días como artefacto de GitHub — más el respaldo a mano que se haga antes de tocar
la base. Este documento es el procedimiento de **restauración**, y está ensayado de principio a
fin: no es una lista de buenas intenciones.

> **El artefacto del respaldo es material sensible.** Lleva los usuarios con su contraseña cifrada
> y los datos personales de los clientes, y lo puede descargar cualquiera con acceso de lectura al
> repositorio. Conviene confirmar quién tiene ese acceso antes de que la tabla `clientes` empiece a
> llenarse de verdad en la Fase 6.

Última prueba completa: **08/09/2026**, sobre el entorno local, con 34 productos, 22 insumos,
3 clientes, 176 filas de auditoría y 1 usuario. Restauró todo, incluida la contraseña del usuario.

---

## 1. Hacer un respaldo

El semanal ya corre solo. Este es el de antes de un despliegue que toque la base:

```bash
mkdir -p respaldos
supabase db dump --linked --data-only -f "respaldos/datos-$(date +%F).sql"
```

`respaldos/` está en `.gitignore` y no se sube nunca. **Un volcado es material sensible**: lleva
los usuarios con su correo y su contraseña cifrada, y los nombres, celulares y direcciones de los
clientes (Ley N.° 29733). Se guarda donde se guardaría un documento con datos de clientes, no en
un chat ni en una carpeta compartida.

El semanal automático (`.github/workflows/backup-supabase.yml`) guarda además `esquema.sql` y
`roles.sql`. Para restaurar no hacen falta —el esquema sale de las migraciones, que es la copia
buena— pero sirven para comparar qué había en producción un domingo dado.

---

## 2. Qué lleva el volcado y qué no

Comprobado ejecutándolo, no deducido de la documentación:

|                                         | ¿Está en el volcado? | De dónde sale al restaurar                 |
| --------------------------------------- | -------------------- | ------------------------------------------ |
| Tablas de `public` y `app` (datos)      | ✅                   | el volcado                                 |
| Auditoría (`app.auditoria`)             | ✅                   | el volcado                                 |
| **Usuarios**, con su contraseña cifrada | ✅                   | el volcado                                 |
| Esquema, RLS, funciones, triggers       | ❌                   | `supabase db push`                         |
| **Políticas de Storage**                | ❌                   | migración `0014`                           |
| **Trabajos de `pg_cron`**               | ❌                   | migración `0015`                           |
| Buckets                                 | ✅ pero se descartan | `config.toml` / el panel                   |
| **Los archivos de Storage** (las fotos) | ❌                   | `subir-imagenes.sh` y la copia del negocio |

Las dos filas que más sorprenden son las políticas de Storage y el cron: `supabase db dump` vuelca
`public` y `app`, y esos dos viven en `storage` y en `cron`. Una restauración que solo cargue el
volcado deja el bucket `clientes` **sin políticas** —inalcanzable para el panel— y sin
las alertas de stock. Por eso el orden empieza siempre por las migraciones.

Los archivos son la pérdida que no tiene vuelta: el volcado es de la base de datos, y una foto es
un fichero. Las imágenes semilla se reponen con el guion; las que suba el negocio desde el panel,
solo desde su propia copia.

---

## 3. Restaurar

```bash
# 1. El esquema entero: tablas, RLS, políticas de Storage y trabajos de cron.
supabase db push

# 2. Los datos, incluidos los usuarios.
bash scripts/restaurar-respaldo.sh respaldos/datos-2026-09-08.sql

# 3. Las imágenes semilla.
bash supabase/seeds/imagenes/subir-imagenes.sh --produccion
```

**No basta con `psql < datos.sql`**, y es la trampa de este procedimiento. Las migraciones no dejan
la base vacía: `0004` carga los roles, `0008` las 26 claves de configuración, `0009` las categorías,
`0010` las faqs y las guías, `0011` las unidades — y el trigger de auditoría registra cada una de
esas inserciones. El volcado trae también esas filas, así que la carga muere en la primera tabla:

```
ERROR: duplicate key value violates unique constraint "auditoria_pkey"
```

`scripts/restaurar-respaldo.sh` vacía `public`, `app` y los usuarios antes de cargar, descarta las
filas de `storage.buckets` (un bucket es configuración, no un dato, y ya existe en el destino) y
comprueba al terminar que las políticas de Storage y los trabajos de cron siguen en pie. Si faltan,
avisa: significa que la base no tenía las migraciones aplicadas antes de empezar.

Pide confirmación escribiendo `RESTAURAR`. Borra datos: esa es la idea.

---

## 4. Después de restaurar

```bash
supabase test db                          # 343 pruebas
bash scripts/verificar-sitio-publico.sh   # el camino que hace el navegador
bash scripts/verificar-storage.sh         # que el bucket clientes siga privado
```

Y una comprobación que no automatiza nada: **entrar al panel con un usuario real**. La contraseña
viaja cifrada en el volcado y se restaura, pero es lo primero que hay que ver funcionando.

---

## 5. Lo que este procedimiento no cubre

- **Un proyecto pausado por inactividad.** Supabase pausa los proyectos gratuitos sin tráfico, y con
  el proyecto pausado `pg_cron` no corre: no se despublican las novedades vencidas ni salta ninguna
  alerta de stock. De ahí el keep-alive cada 3 días. No es un respaldo, es lo que evita necesitarlo.
- **Los archivos que suba el negocio desde el panel.** Hoy no hay copia de Storage; cuando el panel
  esté en uso (Fase 4) habrá que decidir si se hace, y con qué.
- **Un borrado lógico reciente.** `deleted_at` no borra nada, así que un `delete` del panel se
  deshace desde la base sin tocar el respaldo. Conviene mirar eso antes de restaurar: una
  restauración pierde todo lo hecho desde la fecha del volcado.
