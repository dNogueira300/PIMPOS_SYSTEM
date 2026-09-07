#!/usr/bin/env bash
# =============================================================================
# Verificacion de SOLO LECTURA contra el proyecto alojado.
#
# El script hermano (verificar-fase0.sh) corre contra el Docker local, y el
# local miente: no valida la apikey en /rest/v1/ y su Auth no esta configurado
# desde el panel. Estas comprobaciones solo significan algo en produccion.
#
# No escribe nada. No crea usuarios. No sube archivos.
#
#   export SUPABASE_URL="https://<ref>.supabase.co"
#   export SUPABASE_ANON_KEY="..."
#   bash scripts/verificar-produccion.sh
#
# Opcional, para comprobar que el hook del JWT funciona de verdad. Usa un
# usuario real ya creado desde el panel, con su perfil cargado:
#   export PIMPOS_CORREO="..." PIMPOS_CLAVE="..."
# =============================================================================
set -u

: "${SUPABASE_URL:?Falta SUPABASE_URL (https://<ref>.supabase.co)}"
: "${SUPABASE_ANON_KEY:?Falta SUPABASE_ANON_KEY}"

URL="${SUPABASE_URL%/}"
fallos=0
ok()    { echo "  [OK]    $1"; }
fail()  { echo "  [FALLA] $1"; fallos=$((fallos + 1)); }
aviso() { echo "  [ .. ]  $1"; }
titulo(){ echo; echo "== $1 =="; }

echo "Proyecto: $URL"

# --- 1. La API responde ------------------------------------------------------
titulo "1. El proyecto responde"
# La raiz /rest/v1/ NO sirve: en el alojado exige service_role. Se consulta una
# tabla real, igual que el keep-alive.
cod=$(curl -s -o /dev/null -w "%{http_code}" \
  "$URL/rest/v1/roles?select=codigo&limit=1" -H "apikey: $SUPABASE_ANON_KEY")
[ "$cod" = "200" ] && ok "GET /rest/v1/roles -> $cod" \
                   || fail "GET /rest/v1/roles -> $cod (esperaba 200)"

# --- 2. Las migraciones estan aplicadas --------------------------------------
titulo "2. El esquema esta en produccion"
# anon no tiene politica de lectura sobre `roles`, asi que la respuesta correcta
# es `[]`: la tabla existe y la RLS la esta protegiendo. Si devolviera filas,
# alguien le abrio una politica publica que no deberia tener.
cuerpo=$(curl -s "$URL/rest/v1/roles?select=codigo" -H "apikey: $SUPABASE_ANON_KEY")
case "$cuerpo" in
  "[]")      ok "la tabla roles existe y anon no ve ninguna fila" ;;
  *PGRST205*) fail "la tabla roles no existe: faltan migraciones (supabase db push)" ;;
  \[*)       fail "anon VE filas de roles: hay una politica de lectura publica que sobra" ;;
  *)         fail "respuesta inesperada: $(printf '%s' "$cuerpo" | head -c 160)" ;;
esac

# --- 3. Registro publico cerrado ---------------------------------------------
titulo "3. El registro publico esta cerrado (ficha 9.1)"
resp=$(curl -s -X POST "$URL/auth/v1/signup" \
  -H "apikey: $SUPABASE_ANON_KEY" -H "Content-Type: application/json" \
  -d '{"email":"verificacion-colado@pimpos.test","password":"UnaClaveLarga123"}')
if printf '%s' "$resp" | grep -q "signup_disabled"; then
  ok "signUp rechazado con signup_disabled"
else
  fail "signUp NO fue rechazado. Revisa 'Allow new users to sign up'."
  echo "          respuesta: $(printf '%s' "$resp" | head -c 200)"
fi

# El proveedor de correo tiene que seguir ENCENDIDO: apagarlo cierra el registro
# de paso, pero tambien deja fuera a los usuarios que crea el administrador.
resp=$(curl -s -X POST "$URL/auth/v1/token?grant_type=password" \
  -H "apikey: $SUPABASE_ANON_KEY" -H "Content-Type: application/json" \
  -d '{"email":"no-existe@pimpos.test","password":"loquesea1234"}')
if printf '%s' "$resp" | grep -q "email_provider_disabled"; then
  fail "el proveedor Email esta APAGADO: nadie podra iniciar sesion"
else
  ok "el proveedor Email sigue activo"
fi

# --- 4. El rol viaja en el JWT -----------------------------------------------
titulo "4. El rol viaja dentro del JWT"
if [ -z "${PIMPOS_CORREO:-}" ] || [ -z "${PIMPOS_CLAVE:-}" ]; then
  aviso "omitido: exporta PIMPOS_CORREO y PIMPOS_CLAVE de un usuario real"
  aviso "para comprobar que el hook del panel inyecta el claim de verdad"
else
  tok=$(curl -s -X POST "$URL/auth/v1/token?grant_type=password" \
    -H "apikey: $SUPABASE_ANON_KEY" -H "Content-Type: application/json" \
    -d "{\"email\":\"$PIMPOS_CORREO\",\"password\":\"$PIMPOS_CLAVE\"}" |
    python -c "import sys,json; print(json.load(sys.stdin).get('access_token',''))" 2>/dev/null)
  if [ -z "$tok" ]; then
    fail "no se pudo iniciar sesion con ese usuario"
  else
    rol=$(python - "$tok" <<'PY'
import sys, json, base64
p = sys.argv[1].split('.')[1]; p += '=' * (-len(p) % 4)
v = json.loads(base64.urlsafe_b64decode(p)).get('rol', '<<AUSENTE>>')
print('null' if v is None else v)
PY
)
    case "$rol" in
      superadmin|administrador|ingeniero|repartidor)
        ok "el JWT contiene rol=$rol" ;;
      "<<AUSENTE>>")
        fail "el JWT NO trae el claim rol: el hook no esta registrado en el panel"
        echo "          Authentication -> Hooks -> Customize Access Token (JWT) Claims" ;;
      null)
        fail "el JWT trae rol=null: el usuario no tiene fila en perfiles, o esta inactivo" ;;
      *)
        fail "el JWT trae un rol inesperado: $rol" ;;
    esac
  fi
fi

# --- 5. El bucket clientes es privado (R19, Ley N.o 29733) -------------------
titulo "5. El bucket clientes es privado"
# Un bucket publico responde 400 (objeto no encontrado) a una ruta inventada;
# uno privado responde 400 tambien, asi que se pregunta por el bucket en si.
cod=$(curl -s -o /dev/null -w "%{http_code}" \
  "$URL/storage/v1/object/public/clientes/sonda-inexistente.webp")
if [ "$cod" = "200" ]; then
  fail "el bucket clientes sirve contenido publico: NO es privado"
else
  ok "la ruta publica de clientes no sirve contenido -> $cod"
fi
aviso "confirma ademas en el panel que 'clientes' figura como Private"

# --- Resumen -----------------------------------------------------------------
echo
if [ "$fallos" -eq 0 ]; then
  echo "RESULTADO: produccion responde como debe."
else
  echo "RESULTADO: $fallos comprobacion(es) fallaron."
fi
exit "$fallos"
