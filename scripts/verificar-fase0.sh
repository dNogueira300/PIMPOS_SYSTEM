#!/usr/bin/env bash
# =============================================================================
# Verificacion de cierre de la Fase 0 (doc 01 §10) contra la instancia LOCAL.
#
# Comprueba que las cosas RESPONDEN, no solo que existen. Cubre 4 de las 8
# comprobaciones del plan; las otras 4 (keep-alive, CI, backup remoto y dominio)
# viven en GitHub y se verifican alli.
#
#   bash scripts/verificar-fase0.sh
#
# Requiere `supabase start` corriendo. No toca el proyecto remoto.
# Crea y borra sus propios usuarios de prueba.
# =============================================================================
set -u

cd "$(dirname "$0")/.." || exit 1

if ! command -v supabase >/dev/null 2>&1; then
  echo "No se encuentra la CLI de Supabase en el PATH." >&2
  exit 1
fi

# Las llaves locales son fijas y publicas (entorno de demo del CLI), pero se
# leen de `supabase status` para no fijarlas en el repositorio.
eval "$(supabase status -o env 2>/dev/null | grep -E '^(API_URL|ANON_KEY|SERVICE_ROLE_KEY)=')"

if [ -z "${API_URL:-}" ]; then
  echo "Supabase local no esta corriendo. Ejecuta: supabase start" >&2
  exit 1
fi

CONTENEDOR="supabase_db_$(grep -E '^project_id' supabase/config.toml | cut -d'"' -f2)"
sql() { docker exec "$CONTENEDOR" psql -U postgres -d postgres -tAc "$1"; }

fallos=0
ok()   { echo "  [OK]    $1"; }
fail() { echo "  [FALLA] $1"; fallos=$((fallos + 1)); }
titulo() { echo; echo "== $1 =="; }

# Crea un usuario por la Admin API. $1 = correo, $2 = json de user_metadata
# ("null" para no mandar ninguno). Imprime el uuid, o vacio si fallo.
crear_usuario() {
  local cuerpo
  if [ "$2" = "null" ]; then
    cuerpo=$(printf '{"email":"%s","password":"ClaveDePrueba123","email_confirm":true}' "$1")
  else
    cuerpo=$(printf '{"email":"%s","password":"ClaveDePrueba123","email_confirm":true,"user_metadata":%s}' "$1" "$2")
  fi
  curl -s -X POST "$API_URL/auth/v1/admin/users" \
    -H "apikey: $SERVICE_ROLE_KEY" -H "Authorization: Bearer $SERVICE_ROLE_KEY" \
    -H "Content-Type: application/json" -d "$cuerpo" |
    python -c "import sys,json; print(json.load(sys.stdin).get('id',''))" 2>/dev/null
}

borrar_usuario() {
  curl -s -X DELETE "$API_URL/auth/v1/admin/users/$1" \
    -H "apikey: $SERVICE_ROLE_KEY" -H "Authorization: Bearer $SERVICE_ROLE_KEY" >/dev/null
}

# Inicia sesion y devuelve el claim `rol` del token, o un marcador.
rol_de() {
  local token
  token=$(curl -s -X POST "$API_URL/auth/v1/token?grant_type=password" \
    -H "apikey: $ANON_KEY" -H "Content-Type: application/json" \
    -d "$(printf '{"email":"%s","password":"ClaveDePrueba123"}' "$1")" |
    python -c "import sys,json; print(json.load(sys.stdin).get('access_token',''))" 2>/dev/null)
  python - "$token" <<'PY'
import sys, json, base64
t = sys.argv[1]
if not t:
    print('<<SIN TOKEN>>'); raise SystemExit
p = t.split('.')[1]; p += '=' * (-len(p) % 4)
v = json.loads(base64.urlsafe_b64decode(p)).get('rol', '<<AUSENTE>>')
print('null' if v is None else v)
PY
}

# --- 1. La API REST responde -------------------------------------------------
titulo "1. El proyecto responde"
cod=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL/rest/v1/" -H "apikey: $ANON_KEY")
[ "$cod" = "200" ] && ok "GET /rest/v1/ -> $cod" || fail "GET /rest/v1/ -> $cod (esperaba 200)"

# --- 2. Extensiones ----------------------------------------------------------
titulo "2. Las extensiones estan activas"
for ext in pgcrypto pg_trgm unaccent pgtap pg_cron; do
  if [ "$(sql "select count(*) from pg_extension where extname = '$ext';")" = "1" ]; then
    ok "$ext"
  else
    fail "$ext no esta instalada"
  fi
done

# --- 3. Registro publico cerrado ---------------------------------------------
titulo "3. El registro publico esta cerrado"
resp=$(curl -s -X POST "$API_URL/auth/v1/signup" \
  -H "apikey: $ANON_KEY" -H "Content-Type: application/json" \
  -d '{"email":"colado@pimpos.test","password":"UnaClaveLarga123"}')
if echo "$resp" | grep -q "signup_disabled"; then
  ok "signUp rechazado con signup_disabled"
else
  fail "signUp NO fue rechazado: $(echo "$resp" | head -c 200)"
fi

# El proveedor de correo debe seguir ACTIVO: si se apaga, los usuarios que crea
# el administrador tampoco pueden entrar. Es un error facil de cometer.
resp=$(curl -s -X POST "$API_URL/auth/v1/token?grant_type=password" \
  -H "apikey: $ANON_KEY" -H "Content-Type: application/json" \
  -d '{"email":"inexistente@pimpos.test","password":"loquesea1234"}')
if echo "$resp" | grep -q "email_provider_disabled"; then
  fail "el proveedor de correo esta apagado: nadie podra iniciar sesion"
else
  ok "el proveedor de correo sigue activo"
fi

# --- 4. Alta de usuario y rol en el JWT --------------------------------------
titulo "4. El alta de usuario y el rol dentro del JWT"

# Se crea igual que en el panel de produccion: con el rol en los metadatos.
# Desde la migracion 0005 el perfil lo crea un trigger, asi que aqui no se
# inserta ninguna fila a mano; se ejercita el camino real.
correo="verificacion-$(date +%s)@pimpos.test"
uid=$(crear_usuario "$correo" '{"rol":"superadmin","nombre_completo":"Usuario de verificacion"}')

if [ -z "$uid" ]; then
  fail "no se pudo crear el usuario de prueba"
else
  # Ojo con el formato del booleano: `select activo` imprime t/f, pero
  # concatenado con || imprime true/false. Se fuerza ::text en ambos sitios
  # para que las comparaciones no dependan de ese detalle.
  perfil=$(sql "select rol || '|' || activo::text from public.perfiles where id = '$uid';")
  [ "$perfil" = "superadmin|true" ] \
    && ok "el trigger creo el perfil, activo y con su rol" \
    || fail "el trigger dejo el perfil como '$perfil' (esperaba superadmin|t)"

  rol=$(rol_de "$correo")
  [ "$rol" = "superadmin" ] && ok "el JWT contiene rol=superadmin" \
                            || fail "el JWT trae rol=$rol (esperaba superadmin)"

  # Dar de baja a alguien tiene que quitarle los permisos en el siguiente token.
  sql "update public.perfiles set activo = false where id = '$uid';" >/dev/null
  rol=$(rol_de "$correo")
  [ "$rol" = "null" ] && ok "un usuario inactivo recibe rol=null" \
                      || fail "usuario inactivo trae rol=$rol (esperaba null)"

  borrar_usuario "$uid"
fi

# Un alta SIN metadatos debe nacer inerte. Es una regla de seguridad (R19), no
# un detalle: el rol por defecto seria `repartidor`, que lee la tabla `clientes`
# con direcciones y fotos de domicilios. Nadie debe alcanzar datos personales
# porque quien creo la cuenta se distrajo.
correo_sin="descuido-$(date +%s)@pimpos.test"
uid_sin=$(crear_usuario "$correo_sin" null)
if [ -z "$uid_sin" ]; then
  fail "no se pudo crear el usuario sin metadatos"
else
  estado=$(sql "select activo::text from public.perfiles where id = '$uid_sin';")
  [ "$estado" = "false" ] \
    && ok "un alta sin rol en los metadatos nace inactiva" \
    || fail "un alta sin metadatos quedo activa: datos personales por descuido"

  rol=$(rol_de "$correo_sin")
  [ "$rol" = "null" ] && ok "y su JWT sale sin rol" \
                      || fail "su JWT trae rol=$rol (esperaba null)"

  borrar_usuario "$uid_sin"
fi

# --- 5. El bucket clientes es privado ----------------------------------------
titulo "5. El bucket clientes es privado (R19)"
tmp=$(mktemp); echo "foto de prueba" > "$tmp"
cod=$(curl -s -o /dev/null -w "%{http_code}" -X POST \
  "$API_URL/storage/v1/object/clientes/verificacion/fachada.webp" \
  -H "Authorization: Bearer $SERVICE_ROLE_KEY" -H "Content-Type: image/webp" \
  --data-binary "@$tmp")
[ "$cod" = "200" ] && ok "subida al bucket -> $cod" || fail "subida -> $cod"

cod=$(curl -s -o /dev/null -w "%{http_code}" \
  "$API_URL/storage/v1/object/public/clientes/verificacion/fachada.webp")
[ "$cod" != "200" ] && ok "la URL publica queda denegada -> $cod" \
                    || fail "la URL publica devolvio 200: el bucket NO es privado"

curl -s -X POST "$API_URL/storage/v1/object/sign/clientes/verificacion/fachada.webp" \
  -H "Authorization: Bearer $SERVICE_ROLE_KEY" -H "Content-Type: application/json" \
  -d '{"expiresIn":60}' | grep -q "signedURL" \
  && ok "la URL firmada si funciona" || fail "la URL firmada no funciona"

curl -s -X DELETE "$API_URL/storage/v1/object/clientes/verificacion/fachada.webp" \
  -H "Authorization: Bearer $SERVICE_ROLE_KEY" >/dev/null
rm -f "$tmp"

# --- Buckets: visibilidad y limites ------------------------------------------
titulo "Buckets configurados"
sql "select '  ' || id || ' | publico=' || public || ' | limite=' ||
     coalesce(pg_size_pretty(file_size_limit), '-') from storage.buckets order by id;"

echo
if [ "$fallos" -eq 0 ]; then
  echo "RESULTADO: todas las comprobaciones locales de la Fase 0 pasaron."
else
  echo "RESULTADO: $fallos comprobacion(es) fallaron."
fi
exit "$fallos"
