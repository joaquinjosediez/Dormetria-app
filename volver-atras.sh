#!/bin/bash
# ═══════════════════════════════════════════════════════════════════════
#  Volver a una versión anterior
#
#    ./volver-atras.sh            → a la versión inmediatamente anterior
#    ./volver-atras.sh mod161     → a esa versión concreta
#    ./volver-atras.sh --ver      → solo mostrar el historial, sin tocar nada
#
#  POR QUÉ EXISTE
#  En mod161 una regla de CSS mal escrita le mostró el panel del profesional
#  a todos los pacientes que entraban desde el celular. Arreglarlo llevó una
#  sesión entera de trabajo, y mientras tanto la app estuvo rota para todos.
#  Volver a la versión anterior habría tardado treinta segundos.
#
#  Esto NO borra historial: agrega un commit nuevo que restaura los archivos
#  viejos. Si te arrepentís, podés volver para adelante igual.
# ═══════════════════════════════════════════════════════════════════════
set -eu
cd "$(dirname "$0")"

ACTUAL=$(grep -o 'hoy79-mod[0-9]*' index.html | head -1 || echo "")
CORTA=${ACTUAL#hoy79-}

if [ "${1:-}" = "--ver" ] || [ "${1:-}" = "-v" ] || [ "${1:-}" = "--lista" ]; then
  echo "Publicada ahora:  ${ACTUAL:-(no pude leerla)}"
  echo
  echo "Últimas versiones:"
  git log --format='   %ad   %s' --date=short -40 | grep -E 'mod[0-9]+' | head -15
  echo
  echo "Para volver a una:   ./volver-atras.sh mod163"
  exit 0
fi

DESTINO="${1:-}"

if [ -z "$DESTINO" ]; then
  # La versión anterior = el commit de versión más reciente que no sea el actual.
  DESTINO=$(git log --format='%s' -60 \
            | grep -oE '^mod[0-9]+' \
            | grep -v "^${CORTA}$" \
            | head -1 || true)
  if [ -z "$DESTINO" ]; then
    echo "No pude deducir cuál es la versión anterior."
    echo "Mirá el historial con:   ./volver-atras.sh --ver"
    exit 1
  fi
fi

SHA=$(git log --format='%H %s' -200 | grep -E "^[0-9a-f]+ ${DESTINO}[:. ]" | head -1 | cut -d' ' -f1 || true)
if [ -z "$SHA" ]; then
  echo "No encuentro ningún commit de $DESTINO."
  echo "Mirá el historial con:   ./volver-atras.sh --ver"
  exit 1
fi

echo "── Volver atrás ──"
echo "   Ahora está publicada:  ${ACTUAL:-(desconocida)}"
echo "   Se va a volver a:      $DESTINO"
echo
printf "¿Seguro? (s/n) "
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
git checkout "$SHA" -- index.html css/styles.css

NUEVA=$(grep -o 'hoy79-mod[0-9]*' index.html | head -1 || echo "")
if [ -z "$NUEVA" ]; then
  echo "Algo salió mal: el index restaurado no tiene versión. Cancelo."
  git checkout HEAD -- index.html css/styles.css
  exit 1
fi

git add index.html css/styles.css
git commit -m "volver a $DESTINO (estaba en ${ACTUAL:-?})"
git push

echo
echo "═══════════════════════════════════════════════════════════"
echo " Listo. La app volvió a $NUEVA."
echo " GitHub tarda alrededor de un minuto."
echo
echo " Si el paciente sigue viendo lo viejo, que cierre y vuelva"
echo " a abrir la app: el teléfono guarda una copia por un rato."
echo "═══════════════════════════════════════════════════════════"
