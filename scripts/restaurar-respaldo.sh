#!/usr/bin/env bash
# =============================================================================
# Restaura un volcado de datos sobre una base que ya tiene las migraciones.
#
#   bash scripts/restaurar-respaldo.sh respaldos/datos-2026-09-08.sql
#
# POR QUE HACE FALTA UN GUION Y NO BASTA `psql < datos.sql`
#
# Porque las migraciones no dejan la base vacia: 0004 carga los roles, 0008 las
# 26 claves de configuracion, 0009 las categorias, 0010 las faqs y las guias,
# 0011 las unidades... y ademas el trigger de auditoria registra cada una de
# esas inserciones. Al aplicar el volcado encima, la primera tabla ya revienta:
#
#   ERROR: duplicate key value violates unique constraint "auditoria_pkey"
#
# El volcado trae TODAS las filas, incluidas las que las migraciones acaban de
# poner, asi que la salida no es fusionar sino vaciar primero. Eso es lo que
# hace este guion, y por eso pide confirmacion: borra los datos que haya.
#
# LO QUE UN VOLCADO DE `supabase db dump` NO LLEVA -- comprobado, no supuesto:
#
#   * Las politicas de Storage (esquema `storage`) -- las repone la migracion 0014.
#   * Los trabajos de pg_cron -- los repone la 0015.
#   * Los ARCHIVOS de Storage. El volcado es de la base; las fotos son ficheros.
#     Las semillas se reponen con supabase/seeds/imagenes/subir-imagenes.sh; las
#     que subio el negocio desde el panel, solo desde su propia copia.
#
# Lo que SI lleva, y conviene saberlo antes de compartir un volcado con nadie:
# los usuarios de `auth.users`, con su correo y su contrasena cifrada. Un
# respaldo de esta base es material sensible y se guarda como tal.
#
# Los buckets de `storage.buckets` tambien vienen, pero se descartan al cargar:
# un bucket es configuracion (config.toml en local, el panel en el alojado), no
# un dato, y ya existe en el destino. Sin descartarlos la carga muere en
# "duplicate key ... buckets_pkey".
#
# De ahi el orden de una recuperacion completa:
#   1. supabase db push          (migraciones: esquema, RLS, Storage y cron)
#   2. este guion con el volcado (datos, incluidos los usuarios)
#   3. subir-imagenes.sh         (imagenes semilla)
# =============================================================================
set -euo pipefail

VOLCADO="${1:-}"
if [ -z "$VOLCADO" ] || [ ! -f "$VOLCADO" ]; then
  echo "Uso: bash scripts/restaurar-respaldo.sh <archivo-de-datos.sql>"
  echo
  echo "El volcado se genera con:  supabase db dump --local --data-only -f datos.sql"
  exit 1
fi

CONT="${CONTENEDOR:-supabase_db_PIMPOS_SYSTEM}"
psql_() { docker exec -i "$CONT" psql -U postgres -d postgres "$@"; }

echo "Contenedor: $CONT"
echo "Volcado:    $VOLCADO  ($(wc -l < "$VOLCADO") lineas)"
echo

if [ "${SIN_PREGUNTAR:-}" != "1" ]; then
  echo "Esto BORRA todos los datos de los esquemas public y app antes de restaurar."
  printf "Escribe RESTAURAR para continuar: "
  read -r respuesta
  [ "$respuesta" = "RESTAURAR" ] || { echo "Cancelado."; exit 1; }
fi

echo "1/4  Vaciando public, app y los usuarios..."
# `session_replication_role = replica` apaga los triggers durante el vaciado y
# la carga: si no, el trigger de auditoria registraria el borrado y volveria a
# dejar filas en app.auditoria, que es justo lo que se quiere vaciar.
psql_ -v ON_ERROR_STOP=1 -q <<'SQL'
set session_replication_role = replica;
do $$
declare
  v_tablas text;
begin
  select string_agg(format('%I.%I', n.nspname, c.relname), ', ')
    into v_tablas
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
   where n.nspname in ('public', 'app')
     and c.relkind = 'r';

  if v_tablas is not null then
    execute 'truncate table ' || v_tablas || ' restart identity cascade';
  end if;
end $$;

-- El volcado trae `auth.users`; si el destino ya tiene usuarios, la carga
-- chocaria por el correo. El cascade se lleva identidades y sesiones.
delete from auth.users;
SQL

echo "2/4  Descartando las filas de storage (son configuracion, no datos)..."
FILTRADO="$(mktemp)"
trap 'rm -f "$FILTRADO"' EXIT
# Un bloque de datos de pg_dump va desde su INSERT hasta la linea acabada en ";".
awk '
  /^INSERT INTO "storage"\./ { saltando = 1 }
  saltando { saltadas++; if (/;[ 	]*$/) saltando = 0; next }
  { print }
  END { print "     lineas descartadas: " saltadas + 0 > "/dev/stderr" }
' "$VOLCADO" > "$FILTRADO"

echo "3/4  Cargando el volcado..."
psql_ -v ON_ERROR_STOP=1 -q < "$FILTRADO"

echo "4/4  Comprobando..."
psql_ -tAc "
select 'productos='   || (select count(*) from public.productos)
    || ' variantes='  || (select count(*) from public.producto_variantes)
    || ' insumos='    || (select count(*) from public.insumos)
    || ' clientes='   || (select count(*) from public.clientes)
    || ' galeria='    || (select count(*) from public.galeria)
    || ' config='     || (select count(*) from public.configuracion_sitio)
    || ' roles='      || (select count(*) from public.roles)
    || ' auditoria='  || (select count(*) from app.auditoria)
    || ' usuarios='   || (select count(*) from auth.users);"

# Lo que NO viene del volcado tiene que seguir en pie: lo ponen las migraciones,
# y si falta es que la base no tenia las migraciones aplicadas antes de empezar.
faltan=0
politicas=$(psql_ -tAc "select count(*) from pg_policies where schemaname = 'storage';" | tr -d '[:space:]')
trabajos=$(psql_  -tAc "select count(*) from cron.job;" | tr -d '[:space:]')

[ "$politicas" -gt 0 ] || { echo "  [FALLA] no hay politicas de Storage: falta aplicar las migraciones"; faltan=1; }
[ "$trabajos"  -gt 0 ] || { echo "  [FALLA] no hay trabajos de cron: falta aplicar las migraciones";     faltan=1; }

echo "  politicas de Storage=$politicas  trabajos de cron=$trabajos"
echo
if [ "$faltan" -eq 0 ]; then
  echo "RESULTADO: restaurado. Faltan los ARCHIVOS de Storage (ver la cabecera)."
else
  echo "RESULTADO: los datos se cargaron, pero el esquema no esta completo."
  exit 1
fi
