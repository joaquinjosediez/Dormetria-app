#!/bin/bash
# ═══════════════════════════════════════════════════════════════════════
#  Subir lo que ya está hecho
#
#      ./subir.sh
#
#  Corre las pruebas y, SOLO si pasan todas, publica.
#  Si alguna falla no sube nada y te dice cuál.
#
#  Es lo mismo que escribir  npm test && git push origin main,
#  pero sin tener que acordarse.
# ═══════════════════════════════════════════════════════════════════════
set -u
cd "$(dirname "$0")"

echo "── Dormetria · subir ──"
echo

# ── 1 · ¿Hay algo para subir? ──────────────────────────────────────────
PENDIENTES=$(git log --oneline origin/main..main 2>/dev/null | wc -l | tr -d ' ')
if [ "$PENDIENTES" = "0" ]; then
  echo "No hay nada nuevo para publicar: GitHub ya tiene lo último."
  echo
  echo "Si esperabas ver un cambio en la app y no aparece, no es el push:"
  echo "es la versión vieja guardada en caché. Abrí la app y apretá Cmd+R."
  exit 0
fi
echo "   Para publicar: $PENDIENTES cambio(s)."
git log --oneline origin/main..main | sed 's/^/     · /'
echo

# ── 2 · Las pruebas ────────────────────────────────────────────────────
if ! command -v npm >/dev/null 2>&1; then
  echo "No encuentro Node.js, así que no puedo correr las pruebas."
  echo "Se instala una sola vez desde https://nodejs.org (versión LTS)."
  printf "¿Publicar igual, sin red de seguridad? (s/n) "
  read -r R
  case "$R" in s|S|si|SI|Si|y|Y) ;; *) echo "No publiqué nada."; exit 0;; esac
else
  if [ ! -d node_modules ]; then
    echo "   Instalando lo que necesitan las pruebas (solo esta vez)…"
    npm install --silent --no-audit --no-fund
  fi
  echo "── Pruebas ──"
  if ! npm test; then
    echo
    echo "═══════════════════════════════════════════════════════════"
    echo " NO SE PUBLICÓ NADA."
    echo " Arriba dice qué falló. La app en internet sigue intacta."
    echo " Pasale a Claude el nombre de la prueba que dice 'x'."
    echo "═══════════════════════════════════════════════════════════"
    exit 1
  fi
fi

# ── 3 · Publicar ───────────────────────────────────────────────────────
echo
echo "── Publicando ──"
if ! git push origin main; then
  echo
  echo "No se pudo publicar. Suele ser falta de internet."
  echo "Probá de nuevo en un minuto; las pruebas ya pasaron."
  exit 1
fi

VER=$(grep -o "const APP_VERSION='[^']*'" index.html | head -1 | sed "s/.*'\(.*\)'/\1/")
echo
echo "═══════════════════════════════════════════════════════════"
echo " Publicado: $VER"
echo " GitHub tarda alrededor de un minuto en servirlo."
echo
echo " En la app vas a ver el aviso 'Hay una versión nueva ·"
echo " Actualizar'. Si no aparece, Cmd+R."
echo
echo " Si algo sale mal:   ./volver-atras.sh"
echo "═══════════════════════════════════════════════════════════"
