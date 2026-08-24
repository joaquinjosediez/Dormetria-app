#!/bin/bash
# ═══════════════════════════════════════════════════════════════════════
#  Subir una versión a BETA, sin tocar lo que usan tus pacientes
#
#    ./probar-en-beta.sh mod166
#
#  Queda en   https://app.dormetria.com/beta/
#  Producción sigue intacta en https://app.dormetria.com/
#
#  Abrila en tu celular, mirá que esté todo bien, y recién ahí:
#    ./promover-beta.sh
#
#  ─────────────────────────────────────────────────────────────────────
#  OJO CON ESTO: beta usa LA MISMA BASE DE DATOS que producción.
#  Sirve para mirar cómo se ve y cómo se navega. NO sirve para probar
#  cosas que escriban o borren datos: lo que hagas ahí les pasa a tus
#  pacientes de verdad. Si vas a probar un alta, usá un mail tuyo.
#  ─────────────────────────────────────────────────────────────────────
# ═══════════════════════════════════════════════════════════════════════
set -eu
cd "$(dirname "$0")"

VER="${1:-}"
if [ -z "$VER" ]; then
  echo "Falta la versión.   ./probar-en-beta.sh mod166"
  exit 1
fi

ORIGEN_HTML="$HOME/Downloads/APP-index-$VER.html"
ORIGEN_CSS="$HOME/Downloads/APP-styles-$VER.css"
[ -f "$ORIGEN_HTML" ] || { echo "No encuentro $ORIGEN_HTML"; exit 1; }
[ -f "$ORIGEN_CSS" ]  || { echo "No encuentro $ORIGEN_CSS"; exit 1; }

echo "── Subiendo $VER a beta ──"
if ! git pull --rebase --autostash; then
  echo
  echo "No pude traer lo último de GitHub. Suele ser falta de internet."
  echo "Probá de nuevo en un minuto."
  exit 1
fi

mkdir -p beta/css beta/js
cp "$ORIGEN_CSS" beta/css/styles.css
cp js/dormetria-sleep-metrics.js beta/js/dormetria-sleep-metrics.js

# El index de beta lleva dos cambios respecto del de producción.
python3 - "$ORIGEN_HTML" "beta/index.html" <<'PYFIN'
import io, sys, re
origen, destino = sys.argv[1], sys.argv[2]
h = io.open(origen, encoding='utf-8').read()

# 1) Un cartel imposible de no ver.
#    Confundir beta con producción mientras se miran datos de pacientes
#    reales sería el peor error posible de todo este circuito.
cartel = (
  '<div style="position:fixed;top:0;left:0;right:0;z-index:2147483647;'
  'background:#C8A96E;color:#0F2820;font:700 12px/1.1 system-ui,sans-serif;'
  'text-align:center;padding:5px 8px;letter-spacing:.04em">'
  'VERSIÓN DE PRUEBA · los datos son los de verdad'
  '</div>'
)
h = h.replace('<body>', '<body>' + cartel, 1)

# 2) Beta NO instala el service worker. Si lo hiciera, la copia guardada
#    en el teléfono se mezclaría con la de producción y nunca sabrías cuál
#    de las dos versiones estás mirando.
h = re.sub(r"navigator\.serviceWorker\.register\('sw\.js'\)[^;]*;",
           "/* en beta no se registra el service worker */;", h)

io.open(destino, 'w', encoding='utf-8').write(h)
print('   beta/index.html armado')
PYFIN

VERSION_REAL=$(grep -o 'hoy79-mod[0-9]*' beta/index.html | head -1)
if [ "$VERSION_REAL" != "hoy79-$VER" ]; then
  echo "El archivo dice $VERSION_REAL y vos pediste hoy79-$VER. No subo nada."
  rm -rf beta
  exit 1
fi

git add beta
git commit -m "beta: $VER"
git push

echo
echo "═══════════════════════════════════════════════════════════"
echo " Beta arriba en:   https://app.dormetria.com/beta/"
echo " Producción sigue intacta."
echo
echo " Cuando te convenza:   ./promover-beta.sh"
echo "═══════════════════════════════════════════════════════════"
