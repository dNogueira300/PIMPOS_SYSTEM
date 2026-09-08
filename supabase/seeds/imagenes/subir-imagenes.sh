#!/usr/bin/env bash
# =============================================================================
# Sube las imagenes semilla a sus buckets (doc 02 §14.1).
#
# Los archivos NO viven en este repositorio: estan en la carpeta del cliente,
#   DOC/Fotos y documentos Adjuntados Pimpos/_OPTIMIZADO/
# ya optimizados. Duplicar 4 MB de binarios aqui solo crearia dos copias que se
# desincronizan; este guion es el puente, y es lo que se versiona.
#
#   bash supabase/seeds/imagenes/subir-imagenes.sh              # entorno local
#   bash supabase/seeds/imagenes/subir-imagenes.sh --produccion # proyecto alojado
#
# Con --produccion hacen falta dos variables, y la llave tiene que ser la de
# servicio: subir una imagen es escribir en Storage, y ninguna politica lo
# permite sin sesion.
#
#   export SUPABASE_URL=https://<ref>.supabase.co
#   export SUPABASE_SERVICE_ROLE_KEY=...
#
# Convencion de rutas, que la semilla SQL da por buena: **el archivo va en la
# raiz de su bucket, con su nombre original**. Las subidas que haga el panel a
# partir de la Fase 4 usan carpetas (`{id}/...`), asi que no chocan.
# =============================================================================
set -u

RAIZ="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
ORIGEN="${IMAGENES:-$RAIZ/../DOC/Fotos y documentos Adjuntados Pimpos/_OPTIMIZADO}"

if [ "${1:-}" = "--produccion" ]; then
  : "${SUPABASE_URL:?Falta SUPABASE_URL}"
  : "${SUPABASE_SERVICE_ROLE_KEY:?Falta SUPABASE_SERVICE_ROLE_KEY}"
  API_URL="$SUPABASE_URL"
  LLAVE="$SUPABASE_SERVICE_ROLE_KEY"
  echo "Destino: PRODUCCION -- $API_URL"
else
  eval "$(cd "$RAIZ" && supabase status -o env 2>/dev/null | grep -E '^(API_URL|SERVICE_ROLE_KEY)=')"
  : "${API_URL:?No se pudo leer supabase status. Arranca el entorno local con supabase start.}"
  LLAVE="$SERVICE_ROLE_KEY"
  echo "Destino: local -- $API_URL"
fi

if [ ! -d "$ORIGEN" ]; then
  echo "No encuentro las imagenes en:"
  echo "  $ORIGEN"
  echo
  echo "Es la carpeta _OPTIMIZADO que acompana al repositorio. Si la tienes en"
  echo "otro sitio, indicalo:  IMAGENES=/ruta/a/_OPTIMIZADO bash $0"
  exit 1
fi

echo "Origen:  $ORIGEN"
echo

subidas=0
fallos=0

tipo_mime() {
  case "${1,,}" in
    *.webp) echo "image/webp" ;;
    *.png)  echo "image/png"  ;;
    *.svg)  echo "image/svg+xml" ;;
    *.ico)  echo "image/x-icon" ;;
    *.jpg|*.jpeg) echo "image/jpeg" ;;
    *)      echo "" ;;
  esac
}

# `x-upsert` para que el guion se pueda volver a ejecutar sin borrar antes.
subir() { # $1 archivo  $2 bucket  $3 nombre destino
  local mime respuesta codigo
  mime="$(tipo_mime "$1")"
  if [ -z "$mime" ]; then
    echo "  [SALTA] $3 -- extension que ningun bucket acepta"
    return 0
  fi

  respuesta=$(curl -s -w $'\n%{http_code}' -X POST "$API_URL/storage/v1/object/$2/$3" \
    -H "Authorization: Bearer $LLAVE" \
    -H "apikey: $LLAVE" \
    -H "x-upsert: true" \
    -H "Content-Type: $mime" \
    --data-binary "@$1")
  codigo="${respuesta##*$'\n'}"

  if [ "$codigo" = "200" ]; then
    echo "  [OK]    $2/$3"
    subidas=$((subidas + 1))
  else
    # El cuerpo entero, no un "fallo" a secas: el mensaje del servidor
    # ("mime type not supported", "exceeded the maximum allowed size") es el
    # unico dato que dice que hacer, y no lleva secretos.
    echo "  [FALLA] $2/$3 -> $codigo :: ${respuesta%$'\n'*}"
    fallos=$((fallos + 1))
  fi
}

subir_carpeta() { # $1 subcarpeta de origen  $2 bucket
  local archivo
  if [ ! -d "$ORIGEN/$1" ]; then
    echo "  [SALTA] no hay carpeta $1/"
    return 0
  fi
  for archivo in "$ORIGEN/$1"/*; do
    [ -f "$archivo" ] || continue
    subir "$archivo" "$2" "$(basename "$archivo")"
  done
}

echo "== marca -> bucket marca (logo, isotipo, favicons; R21) =="
subir_carpeta marca marca

echo
echo "== productos -> bucket productos =="
subir_carpeta productos productos

echo
echo "== insumos -> bucket insumos =="
subir_carpeta insumos insumos

echo
echo "== lugar -> bucket galeria (R5) =="
subir_carpeta lugar galeria

echo
echo "== portada -> bucket slides (R2) =="
# Los tres slides de ejemplo salen de las mismas fotos del local. Se copian al
# bucket `slides` en vez de apuntar al de galeria: cada columna de imagen guarda
# una ruta dentro de SU bucket, y mezclar eso obligaria a guardar tambien de que
# bucket es cada ruta.
for base in fachada1 horno1 atencion1; do
  if [ -f "$ORIGEN/lugar/$base.webp" ]; then
    subir "$ORIGEN/lugar/$base.webp" slides "$base.webp"
  fi
done

echo
echo "Subidas: $subidas   Fallos: $fallos"
if [ "$fallos" -eq 0 ]; then
  echo "RESULTADO: las imagenes semilla estan en sus buckets."
else
  echo "RESULTADO: $fallos archivo(s) no se subieron."
fi
exit "$fallos"
