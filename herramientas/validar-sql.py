#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Valida el SQL del repo con el parser REAL de Postgres (pglast).

    python3 herramientas/validar-sql.py

Existe porque entregué un SQL con un error de sintaxis —`limit 1` antes de
`union all` sin paréntesis— que Postgres rechaza y que leyendo el archivo no
se ve. Un SQL que el usuario tiene que pegar en producción no puede salir de
acá sin pasar por un parser.

Valida los .sql sueltos y los bloques ```sql de los .md. En los .md hay
fragmentos de ejemplo que no son sentencias completas: esos se reportan
aparte, no como error.

    pip install pglast --break-system-packages
"""
import glob, os, re, sys
try:
    import pglast
except ImportError:
    print('Falta pglast:  pip install pglast --break-system-packages'); sys.exit(2)

raiz = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
os.chdir(raiz)
malos = parciales = ok = 0

def probar(sql, origen):
    global malos, parciales, ok
    try:
        pglast.parse_sql(sql); ok += 1; return
    except Exception as e:
        msg = str(e).split('\n')[0]
        # Un fragmento de ejemplo dentro de un .md no es un error del repo.
        # Se reconoce porque no arranca con una palabra que abra sentencia:
        # un bloque que empieza en "and lower(...)" es media condición
        # copiada de una policy para explicarla, no algo que se corra.
        arranque = re.match(r'\s*(?:--[^\n]*\n|\s)*([a-z]+)', sql, re.I)
        abre = (arranque.group(1).lower() if arranque else '') in (
            'select','insert','update','delete','create','alter','drop','with',
            'begin','commit','rollback','grant','revoke','do','comment','set','truncate')
        if origen.endswith('.md') and (not abre or re.search(r'\.\.\.|…|<[a-z_]+>', sql)):
            parciales += 1
            print('  ~ %-52s fragmento · %s' % (origen, msg[:60]))
        else:
            malos += 1
            print('  x %-52s %s' % (origen, msg[:80]))

for f in sorted(glob.glob('*.sql') + glob.glob('**/*.sql', recursive=True)):
    probar(open(f, encoding='utf-8').read(), f)

for f in sorted(glob.glob('*.md')):
    t = open(f, encoding='utf-8').read()
    for i, b in enumerate(re.findall(r'```sql\n(.*?)```', t, re.S), 1):
        if b.strip():
            probar(b, '%s [bloque %d]' % (f, i))

print()
print('%d válidos · %d fragmentos de ejemplo · %d CON ERROR' % (ok, parciales, malos))
sys.exit(1 if malos else 0)
