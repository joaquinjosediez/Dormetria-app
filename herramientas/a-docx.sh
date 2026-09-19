#!/bin/bash
# Pasa un .md del repo a .docx legible, en docs/
#
#   ./herramientas/a-docx.sh EEDSI-ruta-de-validacion.md
#   ./herramientas/a-docx.sh *.md
#
# Por que el post-proceso: pandoc 2.9 escribe las tablas SIN <w:tblGrid> ni
# <w:tcW>, y tanto Word como LibreOffice colapsan todas las columnas menos la
# primera. arreglar_tablas_docx.py se los agrega.
set -eu
cd "$(dirname "$0")/.."
mkdir -p docs
for f in "$@"; do
  base=$(basename "$f" .md)
  pandoc "$f" -o "docs/$base.docx" \
    --toc --toc-depth=2 \
    --metadata toc-title="Contenido" \
    --metadata lang=es-AR
  python3 herramientas/arreglar_tablas_docx.py "docs/$base.docx"
done
echo "Listo. Los .docx quedaron en docs/"
