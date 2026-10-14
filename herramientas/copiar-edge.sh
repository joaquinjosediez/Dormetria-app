#!/bin/bash
# ═══════════════════════════════════════════════════════════════════════
#  Copiar la Edge Function al portapapeles
#
#      ./herramientas/copiar-edge.sh
#
#  La función `informe-clinico` NO se publica con git push: vive en
#  Supabase, no en GitHub Pages. Hay que pegarla a mano, y copiarla desde
#  un editor es donde se pierde un pedazo sin que nadie se entere.
# ═══════════════════════════════════════════════════════════════════════
set -eu
cd "$(dirname "$0")/.."
F="edge-functions/informe-clinico.ts"

if [ ! -f "$F" ]; then echo "No encuentro $F"; exit 1; fi

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
echo "   3. Tocá  informe-clinico"
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
