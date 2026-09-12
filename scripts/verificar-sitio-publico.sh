#!/usr/bin/env bash
# =============================================================================
# Comprueba que el sitio publico llega a su contenido con la llave anonima.
#
# Las pruebas pgTAP ya verifican las vistas por dentro, pero lo hacen con `set
# role anon` dentro de una transaccion. Entre eso y lo que ve un visitante hay
# tres piezas mas -- PostgREST, los permisos de la vista y el bucket publico --
# y ninguna de las tres la ejerce una prueba en SQL. Esto es el camino entero,
# el mismo que hara el navegador.
#
# Se ejecuta desde la raiz del repositorio, con `supabase start` corriendo.
# =============================================================================
set -u

eval "$(supabase status -o env 2>/dev/null | grep -E '^(API_URL|ANON_KEY)=')"
: "${API_URL:?No se pudo leer supabase status. Ejecuta esto desde la raiz del repo, con supabase start corriendo.}"

fallos=0
ok()   { echo "  [OK]    $1"; }
fail() { echo "  [FALLA] $1"; fallos=$((fallos + 1)); }

# Consulta una vista con la llave anonima y devuelve el cuerpo.
anon() { curl -s "$API_URL/rest/v1/$1" -H "apikey: $ANON_KEY"; }

# Cuenta las filas del array JSON que devuelve PostgREST. Si la respuesta no es
# un array (un error, por ejemplo), imprime el cuerpo: un "0" a secas no diria
# si la vista esta vacia o si la peticion fue rechazada.
filas() {
  python -c "
import sys, json
cuerpo = sys.stdin.read()
try:
    datos = json.loads(cuerpo)
except Exception:
    print('NO-JSON: ' + cuerpo[:200]); raise SystemExit
print(len(datos) if isinstance(datos, list) else 'NO-ARRAY: ' + cuerpo[:200])
"
}

echo "== Las vistas responden a un anonimo =="
for vista in productos_publicos categorias_publicas galeria_publica slides_publicos \
             faqs_publicas guias_publicas; do
  n=$(anon "$vista?select=*" | filas)
  case "$n" in
    0)   fail "$vista responde pero no trae ninguna fila" ;;
    ''|*[!0-9]*) fail "$vista -> $n" ;;
    *)   ok "$vista -> $n filas" ;;
  esac
done

# Las novedades son la excepcion: hoy no hay ninguna publicada y eso es el
# estado correcto, no un fallo. Lo que se comprueba es que la vista responde.
n=$(anon "novedades_publicas?select=*" | filas)
case "$n" in
  ''|*[!0-9]*) fail "novedades_publicas -> $n" ;;
  *)   ok "novedades_publicas responde -> $n filas (aun no hay ninguna publicada)" ;;
esac

# Los testimonios son la otra excepcion, desde 0021: los de ejemplo no salen
# --uno inventado con nombre de persona es una resena falsa-- y hoy en la base
# solo hay de esos. Cero filas es el estado correcto, no un fallo; exigir filas
# aqui era pedirle al sitio que publicara relleno.
#
# Lo que si se comprueba, y antes no: que la vista no deje escapar ninguno
# marcado como ejemplo. Las pruebas pgTAP lo miran por dentro; esto lo mira por
# el mismo camino que hace el navegador, con PostgREST de por medio.
n=$(anon "testimonios_publicos?select=*" | filas)
case "$n" in
  ''|*[!0-9]*) fail "testimonios_publicos -> $n" ;;
  *)   ok "testimonios_publicos responde -> $n filas" ;;
esac

demo=$(anon "testimonios_publicos?select=id&es_demo=is.true" | filas)
case "$demo" in
  0)   ok "y ningun testimonio de ejemplo llega al sitio" ;;
  ''|*[!0-9]*) fail "testimonios_publicos (ejemplo) -> $demo" ;;
  *)   fail "$demo testimonio(s) de ejemplo se estan publicando" ;;
esac

echo
echo "== La configuracion llega en una sola fila =="
cfg=$(anon "configuracion_publica?select=valores")
echo "$cfg" | python -c "
import sys, json
d = json.load(sys.stdin)
v = d[0]['valores']
assert 'telefono' in v,  'falta el telefono'
assert 'logo_url' in v,  'falta el logo'
assert 'correo_alertas' not in v, 'el correo interno de alertas se esta publicando'
print('claves=%d' % len(v))
" >/tmp/cfg.$$ 2>/tmp/cfgerr.$$ \
  && ok "configuracion_publica -> $(cat /tmp/cfg.$$), sin claves internas" \
  || fail "configuracion_publica -> $(cat /tmp/cfgerr.$$ | tail -2 | tr '\n' ' ')"
rm -f /tmp/cfg.$$ /tmp/cfgerr.$$

echo
echo "== Un borrador nunca sale =="
cod=$(curl -s -o /dev/null -w "%{http_code}" \
  "$API_URL/rest/v1/productos_publicos?select=id&limit=1" -H "apikey: $ANON_KEY")
[ "$cod" = "200" ] && ok "la vista de catalogo se sirve con la llave anonima -> $cod" \
                   || fail "la vista de catalogo no responde -> $cod"

borradores=$(anon "productos?select=id&estado=eq.borrador" | filas)
[ "$borradores" = "0" ] && ok "y un anonimo no alcanza ningun producto en borrador" \
                        || fail "un anonimo ve $borradores productos en borrador"

echo
echo "== Las imagenes de las filas existen en sus buckets =="
# Ojo: `supabase db reset` recrea los contenedores de Storage y deja los buckets
# vacios. Tras cada reset hay que volver a correr subir-imagenes.sh; las filas
# sobreviven en la base, los archivos no.
# Se toma una ruta real de cada tabla y se pide el archivo como lo pediria el
# navegador. Si las imagenes semilla no se han subido todavia, se dice -- pero
# no se da por buena una comprobacion que no se hizo.
comprobar_imagen() { # $1 vista  $2 campo  $3 bucket
  local ruta cod
  # `not.is.null`: solo dos de los 34 productos tienen foto todavia, y la
  # primera fila cualquiera no la tiene. Sin el filtro, la comprobacion fallaria
  # por un producto sin foto en vez de por una imagen que falta en el bucket.
  ruta=$(anon "$1?select=$2&$2=not.is.null&limit=1" |
    python -c "
import sys, json
d = json.load(sys.stdin)
print(d[0]['$2'] if d and d[0].get('$2') else '')
" 2>/dev/null)

  if [ -z "$ruta" ]; then
    fail "$1 no trae ninguna ruta en $2"
    return
  fi

  cod=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL/storage/v1/object/public/$3/$ruta")
  case "$cod" in
    200) ok "$3/$ruta se sirve en publico -> $cod" ;;
    400|404) fail "$3/$ruta no esta en el bucket -> $cod. Falta correr supabase/seeds/imagenes/subir-imagenes.sh" ;;
    *)   fail "$3/$ruta -> $cod" ;;
  esac
}

# Las imagenes semilla no viven en el repositorio (estan en la carpeta del
# cliente), asi que en CI los buckets estan vacios. En ese caso se dice que la
# comprobacion no se hizo, en vez de darla por buena: un [OK] que no probo nada
# es peor que un hueco declarado.
if [ "$(curl -s -o /dev/null -w '%{http_code}'         "$API_URL/storage/v1/object/public/galeria/fachada1.webp")" = "200" ]; then
  comprobar_imagen galeria_publica     ruta        galeria
  comprobar_imagen slides_publicos     imagen_url  slides
  comprobar_imagen productos_publicos  imagen_ruta productos
else
  echo "  [SALTA] las imagenes semilla no estan subidas en este entorno."
  echo "          No van en el repositorio: se cargan con"
  echo "          bash supabase/seeds/imagenes/subir-imagenes.sh"
fi

echo
[ "$fallos" -eq 0 ] && echo "RESULTADO: el sitio publico alcanza su contenido." \
                    || echo "RESULTADO: $fallos comprobacion(es) fallaron."
exit "$fallos"
