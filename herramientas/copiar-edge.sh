#!/bin/bash
# ═══════════════════════════════════════════════════════════════════════
#  Copiar la Edge Function al portapapeles
#
#      ./herramientas/copiar-edge.sh                  ← informe-clinico
#      ./herramientas/copiar-edge.sh analizar-estudio
#
#  Las Edge Functions NO se publican con git push: viven en Supabase, no
#  en GitHub Pages. Hay que pegarlas a mano, y copiarlas desde un editor
#  es donde se pierde un pedazo sin que nadie se entere.
# ═════════════════════════════════════════════════════════════════════
set -eu
cd "$(dirname "$0")/.."
NOMBRE="${1:-informe-clinico}"
F="edge-functions/$NOMBRE.ts"

if [ ! -f "$F" ]; then
  echo "No encuentro $F"
  echo
  echo "Las que hay:"
  ls edge-functions/*.ts | sed "s#edge-functions/#   #;s#\.ts##"
  exit 1
fi

pbcopy < "$F"
L=$(wc -l < "$F" | tr -d ' ')
V=$(grep -o 'versión [0-9]*' "$F" | head -1)

echo "── Edge Function copiada ──"
echo
echo "   $L líneas · $V"
echo
echo "   Ya está en el portapapeles. Ahora:"
echo
echo "   1. Entrá a supabase.com y abrí el proyecto Dormetria"
echo "   2. Menú de la izquierda → Edge Functions"
echo "   3. Tocá  $NOMBRE"
echo "   4. Pestaña  Code"
echo "   5. Clic adentro del editor · Cmd+A  (selecciona todo)"
echo "   6. Cmd+V  (pega lo nuevo encima)"
echo "   7. Botón  Deploy  arriba a la derecha"
echo
echo "   Queda desplegada cuando el panel muestra una versión nueva"
echo "   con la fecha de hoy."
echo
echo "   Para probarla: abrí un paciente → Informe → Interconsulta."
echo "   Si sale completo y termina con 'Conclusión sugerida', anduvo."
