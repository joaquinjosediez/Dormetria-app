#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Arregla el botón "Entrar" de la landing (dormetria.com), sin tocar nada más.

POR QUÉ ES UN SCRIPT Y NO UNA EDICIÓN
─────────────────────────────────────
La landing no está en el repositorio de la app: vive en
github.com/joaquinjosediez/Dormetria-landing, que Netlify publica. Su
index.html pesa 125 KB y lo único que pude leer de él fueron los primeros
71 KB, así que no puedo editarlo a ciegas. Este script hace el único
cambio que SÍ pude verificar entero, y de paso imprime los pedazos que me
faltan para terminar el resto.

QUÉ CAMBIA
──────────
Una sola regla de CSS, la de `.nav-entrar`:

    .nav-entrar{ color: rgba(255,255,255,0.62); font-weight: 400;
                 margin-right: 0.2rem; }

Texto pelado al lado de "Crear cuenta", que es un pill sólido de menta.
El contraste alcanza (~6,8:1 sobre el verde noche), así que el problema no
es de legibilidad como en la app: es de forma. Parece parte del menú y no
una acción, y es el camino que usa TODOS LOS DÍAS quien ya tiene cuenta.
Crear cuenta se hace una vez en la vida del usuario; entrar, cada mañana.

Pasa a ser un botón del mismo tamaño que `.nav-cta` —mismo padding, mismo
radio— pero de contorno en vez de sólido: la jerarquía la hace el relleno,
no el tamaño. Es la misma solución que se aplicó en la app en mod279.

LO QUE **NO** TOCA
──────────────────
Los dos botones del hero ya están bien: `.btn-primary` y `.btn-secondary`
comparten `padding: 0.9rem 2rem` y `border-radius: 100px`. Uno sólido y
otro de contorno. Ahí no hay nada que arreglar y el script no los mira.

CÓMO SE USA
───────────
    cd ~/Documents
    git clone https://github.com/joaquinjosediez/Dormetria-landing   # si no está
    python3 herramientas/arreglar-landing.py ~/Documents/Dormetria-landing

Deja una copia de respaldo al lado y no escribe nada si no encuentra
exactamente lo que espera. Después:

    cd ~/Documents/Dormetria-landing && git add -A && git commit -m "Entrar deja de ser un enlace suelto" && git push

Netlify publica solo.
"""

import io
import os
import re
import shutil
import sys

VIEJO_RX = re.compile(
    r"\.nav-entrar\{\s*"
    r"color:\s*rgba\(255,255,255,0\.62\);\s*"
    r"font-weight:\s*400;\s*"
    r"margin-right:\s*0\.2rem;\s*"
    r"\}"
)

NUEVO = """.nav-entrar{
    /* "Entrar" es la puerta de todos los días: "Crear cuenta" se usa una
       vez en la vida del usuario y ésta, cada mañana. Era texto pelado al
       lado de un pill sólido: el contraste alcanzaba, pero la forma decía
       "esto es parte del menú", no "esto es una acción".
       Mismo tamaño que .nav-cta; la jerarquía la hace el relleno. */
    padding: 0.55rem 1.3rem;
    border-radius: 100px;
    border: 1px solid rgba(126,200,164,0.40);
    background: rgba(255,255,255,0.04);
    color: rgba(244,239,229,0.92);
    font-weight: 500;
    margin-right: 0.45rem;
    transition: background 0.2s, border-color 0.2s, transform 0.2s;
  }
  .nav-entrar:hover{
    background: rgba(126,200,164,0.12);
    border-color: var(--menta);
    color: #fff;
    transform: translateY(-1px);
  }
  @media (max-width:520px){
    .nav-entrar{ padding: 8px 14px; font-size: .8rem; }
  }"""


def main():
    if len(sys.argv) < 2:
        print('Falta decir dónde está la landing. Por ejemplo:\n')
        print('    python3 herramientas/arreglar-landing.py ~/Documents/Dormetria-landing\n')
        return 1

    carpeta = os.path.expanduser(sys.argv[1])
    ruta = os.path.join(carpeta, 'index.html')
    if not os.path.isfile(ruta):
        print('No encuentro ' + ruta)
        print('¿Cloniste el repo?  git clone https://github.com/joaquinjosediez/Dormetria-landing')
        return 1

    s = io.open(ruta, encoding='utf-8').read()
    print('Leído: %s  (%d KB, %d líneas)\n' % (ruta, len(s.encode('utf-8')) // 1024,
                                               s.count('\n') + 1))

    # ── El cambio ────────────────────────────────────────────────────
    hallazgos = VIEJO_RX.findall(s)
    if len(hallazgos) != 1:
        print('NO TOCO NADA.')
        print('Esperaba encontrar la regla .nav-entrar exactamente una vez y '
              'encontré %d.' % len(hallazgos))
        print('Seguramente ya la cambiaste, o el archivo se movió. '
              'Pasame estas líneas y lo reviso:\n')
        for m in re.finditer(r'\.nav-entrar\s*[\{:]', s):
            ini = s.rfind('\n', 0, max(0, m.start() - 200)) + 1
            print(s[ini:m.start() + 400])
            print('  ' + '-' * 60)
        return 1

    s = VIEJO_RX.sub(lambda _m: NUEVO, s, count=1)
    # El :hover viejo quedaba DESPUES del nuevo y le pisaba el color.
    s = s.replace('.nav-entrar:hover{ color: #fff; }\n', '', 1)
    s = s.replace('  .nav-entrar:hover{ color: #fff; }\n', '', 1)

    respaldo = ruta + '.antes-del-boton'
    shutil.copyfile(ruta, respaldo)
    io.open(ruta, 'w', encoding='utf-8').write(s)
    print('✓ Listo. "Entrar" ahora es un botón del mismo tamaño que "Crear cuenta".')
    print('  Respaldo en: ' + respaldo + '\n')

    # ── Lo que me falta ver ──────────────────────────────────────────
    # En la página publicada hay tres cierres del tipo "¿Ya tenés cuenta?
    # Ingresá acá" / "Entrar al panel": texto suelto debajo de un botón.
    # Están en el tramo del archivo que no pude leer, así que no los toco.
    print('─' * 68)
    print('Y esto es lo que necesito para terminar el resto. Copiame la')
    print('salida de acá abajo y te mando el segundo paso.')
    print('─' * 68 + '\n')

    patrones = [r'Ya ten[\u00e9e]s cuenta', r'Ingres[\u00e1a] ac[\u00e1a]', r'Entrar al panel']
    # Un mismo cierre cae bajo varios patrones y las ventanas se pisan. Se
    # juntan primero los tramos y despues se imprimen: si no, el mismo
    # parrafo sale cuatro veces y copiar la salida es un castigo.
    tramos = []
    for pat in patrones:
        for m in re.finditer(pat, s, re.IGNORECASE):
            if s.rfind('<style', 0, m.start()) > s.rfind('</style>', 0, m.start()):
                continue        # esta adentro de una hoja de estilos
            ini = s.rfind('\n', 0, max(0, m.start() - 220)) + 1
            fin = s.find('\n', m.end() + 220)
            if fin < 0:
                fin = len(s)
            tramos.append([ini, fin])
    tramos.sort()
    juntos = []
    for t in tramos:
        if juntos and t[0] <= juntos[-1][1]:
            juntos[-1][1] = max(juntos[-1][1], t[1])
        else:
            juntos.append(t)
    encontrado = bool(juntos)
    for ini, fin in juntos:
        print('l\u00ednea %d:' % (s.count('\n', 0, ini) + 1))
        print(s[ini:fin])
        print('\n' + '\u00b7' * 68 + '\n')
    if not encontrado:
        print('(No aparecen en el archivo: puede que los genere el JavaScript.')
        print(' En ese caso avisame y lo busco por otro lado.)')
    return 0


if __name__ == '__main__':
    sys.exit(main())
