#!/usr/bin/env bash
# =============================================================================
# Verificacion de las politicas de Storage (migracion 0014).
#
#   bash scripts/verificar-storage.sh
#
# Las politicas de Storage no se pueden probar con pgTAP: viven en
# `storage.objects`, pero quien decide si un archivo sale o no es la API de
# Storage, que aplica ademas los limites de tamano y de tipo MIME del bucket.
# Comprobar la politica en SQL diria que la fila es visible, no que el archivo
# se pueda descargar -- que es lo que de verdad importa con la foto del
# domicilio de un cliente.
#
# Se usan JWT de usuarios REALES, nunca la `service_role`: esa llave salta toda
# la seguridad, asi que una prueba hecha con ella pasaria siempre.
#
# Se ejecuta DESDE la raiz del repositorio (necesita `supabase status`).
#
# Las comprobaciones negativas exigen un codigo 4xx concreto y no un simple
# "distinto de 200": una peticion que no llega a salir tambien es distinta de
# 200, y eso haria pasar una prueba de seguridad sin haber probado nada.
set -u

eval "$(supabase status -o env 2>/dev/null | grep -E '^(API_URL|ANON_KEY|SERVICE_ROLE_KEY)=')"
: "${API_URL:?No se pudo leer supabase status. Ejecuta esto desde la raiz del repo, con supabase start corriendo.}"

CONT="supabase_db_PIMPOS_SYSTEM"
sql() { docker exec "$CONT" psql -U postgres -d postgres -tAc "$1"; }

fallos=0
ok()   { echo "  [OK]    $1"; }
fail() { echo "  [FALLA] $1"; fallos=$((fallos + 1)); }

# Comprueba que un codigo HTTP es de denegacion real (4xx), no un fallo de red.
denegado() { case "$1" in 4??) return 0 ;; *) return 1 ;; esac; }

declare -A TOKEN
for rol in ingeniero repartidor; do
  correo="storage-$rol-$(date +%s%N)@pimpos.test"
  uid=$(curl -s -X POST "$API_URL/auth/v1/admin/users" \
    -H "apikey: $SERVICE_ROLE_KEY" -H "Authorization: Bearer $SERVICE_ROLE_KEY" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"$correo\",\"password\":\"ClaveDePrueba123\",\"email_confirm\":true}" |
    python -c "import sys,json; print(json.load(sys.stdin).get('id',''))")
  [ -n "$uid" ] || { echo "No se pudo crear el usuario $rol"; exit 1; }
  sql "update public.perfiles set rol='$rol', activo=true where id='$uid';" >/dev/null
  TOKEN[$rol]=$(curl -s -X POST "$API_URL/auth/v1/token?grant_type=password" \
    -H "apikey: $ANON_KEY" -H "Content-Type: application/json" \
    -d "{\"email\":\"$correo\",\"password\":\"ClaveDePrueba123\"}" |
    python -c "import sys,json; print(json.load(sys.stdin).get('access_token',''))")
  [ -n "${TOKEN[$rol]}" ] || { echo "No se pudo obtener token de $rol"; exit 1; }
done

# `psql -tAc` con RETURNING imprime el id Y la etiqueta "INSERT 0 1" en la
# linea siguiente, y eso rompia la URL. Se toma solo la primera linea.
CLIENTE=$(sql "insert into public.clientes (nombre_completo, celular, direccion)
               values ('Cliente de prueba storage','965000111','Calle X')
               returning id;" | head -1 | tr -d '[:space:]')
[ -n "$CLIENTE" ] || { echo "No se pudo crear el cliente de prueba"; exit 1; }

# Sufijo unico por ejecucion: Storage rechaza subir dos veces a la misma ruta,
# y sin esto la segunda corrida daria un 400 que parece un fallo de politica.
EJEC=$(date +%s%N)
tmp=$(mktemp); echo "foto" > "$tmp"
subir() { # $1 token  $2 ruta  $3 content-type
  curl -s -o /dev/null -w "%{http_code}" -X POST "$API_URL/storage/v1/object/$2" \
    -H "Authorization: Bearer $1" -H "apikey: $ANON_KEY" \
    -H "Content-Type: $3" --data-binary "@$tmp"
}

echo "== 1. Buckets de contenido =="
cod=$(subir "${TOKEN[ingeniero]}" "productos/prueba/pan-$EJEC.webp" "image/webp")
[ "$cod" = "200" ] && ok "un ingeniero sube al bucket de productos -> $cod" \
                   || fail "el ingeniero no pudo subir -> $cod"

cod=$(subir "${TOKEN[repartidor]}" "productos/prueba/otro-$EJEC.webp" "image/webp")
denegado "$cod" && ok "un repartidor NO sube al bucket de productos -> $cod" \
                || fail "el repartidor subio fotos de producto -> $cod"

cod=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL/storage/v1/object/public/productos/prueba/pan-$EJEC.webp")
[ "$cod" = "200" ] && ok "y la foto de producto SI es publica -> $cod" \
                   || fail "la foto de producto no se sirve en publico -> $cod"

echo
echo "== 2. Bucket clientes: privado de verdad =="
cod=$(subir "${TOKEN[repartidor]}" "clientes/$CLIENTE/1.webp" "image/webp")
[ "$cod" = "200" ] && ok "un repartidor sube la foto de la fachada de su cliente -> $cod" \
                   || fail "el repartidor no pudo subir la foto del cliente -> $cod"

cod=$(subir "${TOKEN[repartidor]}" "clientes/00000000-0000-0000-0000-000000000000/1.webp" "image/webp")
denegado "$cod" && ok "pero NO en una carpeta que no es de ningun cliente -> $cod" \
                || fail "se dejo un archivo suelto en el bucket privado -> $cod"

cod=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL/storage/v1/object/public/clientes/$CLIENTE/1.webp")
denegado "$cod" && ok "la foto del domicilio NO se sirve en publico -> $cod" \
                || fail "la foto del domicilio es publica -> $cod"

cod=$(curl -s -o /dev/null -w "%{http_code}" \
  "$API_URL/storage/v1/object/clientes/$CLIENTE/1.webp" -H "apikey: $ANON_KEY")
denegado "$cod" && ok "ni sin sesion por la ruta autenticada -> $cod" \
                || fail "un anonimo alcanzo la foto del domicilio -> $cod"

firmada=$(curl -s -X POST "$API_URL/storage/v1/object/sign/clientes/$CLIENTE/1.webp" \
  -H "Authorization: Bearer ${TOKEN[repartidor]}" -H "apikey: $ANON_KEY" \
  -H "Content-Type: application/json" -d '{"expiresIn":60}')
echo "$firmada" | grep -q signedURL \
  && ok "y el repartidor SI obtiene una URL firmada" \
  || fail "no se pudo firmar la URL: $(echo "$firmada" | head -c 150)"

echo
echo "== 3. Bucket documentos =="
cod=$(subir "${TOKEN[ingeniero]}" "documentos/prueba/reporte-$EJEC.pdf" "application/pdf")
denegado "$cod" && ok "un ingeniero NO sube documentos -> $cod" \
                || fail "el ingeniero subio un documento -> $cod"

rm -f "$tmp"

# Se limpia lo que este guion creo. Dejarlo puesto contamina la base local: una
# prueba pgTAP que contara clientes empezaria a fallar por un dato que no es
# suyo, y el fallo no diria por que.
sql "delete from public.clientes where id = '$CLIENTE';" >/dev/null
sql "delete from auth.users where email like 'storage-%@pimpos.test';" >/dev/null

echo
[ "$fallos" -eq 0 ] && echo "RESULTADO: las politicas de Storage se comportan como deben." \
                    || echo "RESULTADO: $fallos comprobacion(es) fallaron."
exit "$fallos"
