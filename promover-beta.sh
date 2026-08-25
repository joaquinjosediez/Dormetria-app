#!/bin/bash
# ═══════════════════════════════════════════════════════════════════════
#  Pasar lo que está en beta a producción
#
#    ./promover-beta.sh
#
#  Toma lo que ya miraste en app.dormetria.com/beta/, le saca el cartel de
#  prueba, le devuelve el service worker, corre las pruebas y publica.
# ═══════════════════════════════════════════════════════════════════════
set -eu
cd "$(dirname "$0")"

[ -f beta/index.html ] || { echo "No hay nada en beta todavía."; exit 1; }

VER=$(grep -o 'hoy79-mod[0-9]*' beta/index.html | head -1)
ACTUAL=$(grep -o 'hoy79-mod[0-9]*' index.html | head -1 || echo "(desconocida)")

echo "── Promover beta a producción ──"
echo "   En beta:      $VER"
echo "   En producción: $ACTUAL"
echo
printf "¿Promover? (s/n) "
read -r RESPUESTA
case "$RESPUESTA" in
  s|S|si|SI|Si|y|Y) ;;
  *) echo "No hice nada."; exit 0 ;;
esac

if ! git pull --rebase --autostash; then
  echo
  echo "No pude traer lo último de GitHub. Suele ser falta de internet."
  echo "Probá de nuevo en un minuto."
  exit 1
fi

# Deshacer los dos cambios que solo tienen sentido en beta.
python3 - "beta/index.html" "index.html" <<'PYFIN'
import io, sys, re
origen, destino = sys.argv[1], sys.argv[2]
h = io.open(origen, encoding='utf-8').read()

antes = len(h)
h = re.sub(r'<div style="position:fixed;top:0;left:0;right:0;z-index:2147483647;.*?</div>',
           '', h, count=1, flags=re.S)
if len(h) == antes:
    print('   (aviso: no encontré el cartel de prueba para sacar)')

h = h.replace("/* en beta no se registra el service worker */;",
              "navigator.serviceWorker.register('sw.js').catch(e=>console.log('[PWA] sw:', e.message));")

io.open(destino, 'w', encoding='utf-8').write(h)
PYFIN

cp beta/css/styles.css css/styles.css

# Controles antes de seguir: que no quede nada de beta en producción.
if grep -q "VERSIÓN DE PRUEBA" index.html; then
  echo "Quedó el cartel de prueba adentro. Cancelo."
  git checkout -- index.html css/styles.css
  exit 1
fi
if ! grep -q "serviceWorker.register('sw.js')" index.html; then
  echo "No se restauró el service worker. Cancelo."
  git checkout -- index.html css/styles.css
  exit 1
fi
if ! grep -q "$VER" index.html; then
  echo "La versión no coincide. Cancelo."
  git checkout -- index.html css/styles.css
  exit 1
fi

ise_pueden_correr_las_pruebas=si
if ! command -v npm >/dev/null 2>&1; then
  echo
  echo "───────────────────────────────────────────────────────────"
  echo " No encuentro Node.js, así que NO puedo correr las pruebas."
  echo
  echo " Se instala una sola vez desde:"
  echo "   https://nodejs.org/en/download   (botón LTS, archivo .pkg)"
  echo " Después cerrá la Terminal y abrí una nueva."
  echo
  echo " Pero esto ya lo miraste vos en el celular, que es lo que"
  echo " las pruebas no pueden ver. Si algo sale mal:"
  echo "   ./volver-atras.sh"
  echo "───────────────────────────────────────────────────────────"
  echo
  printf "¿Promover igual, sin correr las pruebas? (s/n) "
  read -r SIN_PRUEBAS
  case "$SIN_PRUEBAS" in
    s|S|si|SI|Si|y|Y) echo "   Va sin pruebas." ;;
    *) echo "   No promoví nada."; git checkout -- index.html css/styles.css; exit 0 ;;
  esac
else
  if [ ! -d node_modules ]; then
    echo "   Instalando lo que necesitan las pruebas (solo esta vez)…"
    if ! npm install --silent --no-audit --no-fund; then
      echo "   No se pudieron instalar. Sigo sin pruebas."
    fi
  fi
  echo
  if ! npm test; then
    echo
    echo "NO SE PROMOVIÓ NADA. Producción sigue en $ACTUAL."
    git checkout -- index.html css/styles.css
    exit 1
  fi
fi

git add -A
git commit -m "${VER#hoy79-}: promovida desde beta"
git push

echo
echo "═══════════════════════════════════════════════════════════"
echo " $VER está en producción."
echo " Si algo sale mal:   ./volver-atras.sh"
echo "═══════════════════════════════════════════════════════════"
