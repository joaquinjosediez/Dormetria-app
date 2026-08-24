#!/bin/bash
# ═══════════════════════════════════════════════════════════════════════
#  Publicar una versión nueva de Dormetria
#
#    ./publicar.sh mod165
#    ./publicar.sh mod165 "arreglo el gráfico de pilares"
#
#  Toma los dos archivos de tu carpeta de Descargas, CORRE LAS PRUEBAS, y
#  recién si pasan todas hace el push.
#
#  Si alguna prueba falla, no se publica nada y tu carpeta queda como
#  estaba: podés seguir usando la app sin ningún cambio.
# ═══════════════════════════════════════════════════════════════════════
set -eu
cd "$(dirname "$0")"

VER="${1:-}"
if [ -z "$VER" ]; then
  echo "Falta decir qué versión publicar."
  echo
  echo "  ./publicar.sh mod165"
  echo
  exit 1
fi

MENSAJE="${2:-$VER}"

ORIGEN_HTML="$HOME/Downloads/APP-index-$VER.html"
ORIGEN_CSS="$HOME/Downloads/APP-styles-$VER.css"

if [ ! -f "$ORIGEN_HTML" ]; then
  echo "No encuentro este archivo:"
  echo "   $ORIGEN_HTML"
  echo
  echo "Descargalo primero, o revisá que el número de versión sea el correcto."
  exit 1
fi
if [ ! -f "$ORIGEN_CSS" ]; then
  echo "No encuentro este archivo:"
  echo "   $ORIGEN_CSS"
  exit 1
fi

echo "── Publicando $VER ──"

# Traer lo que haya en GitHub antes de tocar nada.
# --autostash: si quedó algo suelto en la carpeta, git lo guarda y lo devuelve
# solo, en vez de morir con un mensaje que no dice nada.
if ! git pull --rebase --autostash; then
  echo
  echo "No pude traer lo último de GitHub. Suele ser falta de internet."
  echo "Probá de nuevo en un minuto."
  exit 1
fi

# Guardo lo que hay ahora, por si las pruebas fallan y hay que dejar todo
# como estaba.
ANTES=$(grep -o 'hoy79-mod[0-9]*' index.html | head -1 || echo "(desconocida)")
echo "   Versión publicada ahora: $ANTES"

cp "$ORIGEN_HTML" index.html
cp "$ORIGEN_CSS" css/styles.css

# Control de que los archivos son los que decís que son. Ya pasó de copiar
# uno viejo sin darse cuenta.
if ! grep -q "hoy79-$VER" index.html; then
  echo
  echo "El archivo que copiaste NO dice hoy79-$VER por dentro."
  echo "Probablemente sea de otra versión. No publico nada."
  git checkout -- index.html css/styles.css
  exit 1
fi

# Las pruebas necesitan Node.js. Si no está, se avisa cómo instalarlo y se
# ofrece publicar igual: quedarse sin poder publicar sería peor que publicar
# sin red de seguridad, que es como se venía haciendo hasta ahora.
if ! command -v npm >/dev/null 2>&1; then
  echo
  echo "───────────────────────────────────────────────────────────"
  echo " No encuentro Node.js, así que NO puedo correr las pruebas."
  echo
  echo " Se instala una sola vez y queda para siempre:"
  echo "   1. Entrá a  https://nodejs.org/en/download"
  echo "   2. Descargá la versión que dice LTS (archivo .pkg)"
  echo "   3. Doble clic, Siguiente hasta el final"
  echo "   4. Cerrá esta ventana de Terminal y abrí una nueva"
  echo
  echo " Mientras tanto podés publicar sin red de seguridad, igual"
  echo " que hasta ahora. Si sale mal:  ./volver-atras.sh"
  echo "───────────────────────────────────────────────────────────"
  echo
  printf "¿Publicar sin correr las pruebas? (s/n) "
  read -r SIN_PRUEBAS
  case "$SIN_PRUEBAS" in
    s|S|si|SI|Si|y|Y) echo "   Va sin pruebas." ;;
    *) echo "   No publiqué nada."; git checkout -- index.html css/styles.css; exit 0 ;;
  esac
else
  if [ ! -d node_modules ]; then
    echo "   Instalando lo que necesitan las pruebas (solo esta vez)…"
    npm install --silent --no-audit --no-fund
  fi
  echo
  if ! npm test; then
    echo
    echo "═══════════════════════════════════════════════════════════"
    echo " NO SE PUBLICÓ NADA."
    echo " Arriba dice qué falló. Tu carpeta quedó como estaba y la"
    echo " app en internet sigue en $ANTES, intacta."
    echo "═══════════════════════════════════════════════════════════"
    git checkout -- index.html css/styles.css
    exit 1
  fi
fi

echo
git add -A
git commit -m "$VER: $MENSAJE"
git push

echo
echo "═══════════════════════════════════════════════════════════"
echo " Publicado: $VER"
echo " GitHub tarda alrededor de un minuto en servirlo."
echo
echo " Si algo sale mal:   ./volver-atras.sh"
echo "═══════════════════════════════════════════════════════════"
