#!/usr/bin/env python3
"""Pandoc 2.9 escribe las tablas SIN <w:tblGrid> ni <w:tcW>, y LibreOffice y
Word colapsan todas las columnas menos la primera. Esto se las agrega.

El ancho util = ancho de pagina - margenes, leido del propio documento, asi
que sirve igual para A4 que para Letter."""
import re, sys, zipfile, shutil, os, tempfile

def ancho_util(xml):
    m = re.search(r'<w:pgSz w:w="(\d+)"', xml)
    ancho = int(m.group(1)) if m else 11906          # A4 por defecto
    m = re.search(r'<w:pgMar[^>]*w:left="(\d+)"[^>]*w:right="(\d+)"', xml)
    if not m:
        m2 = re.search(r'<w:pgMar[^>]*w:right="(\d+)"[^>]*w:left="(\d+)"', xml)
        izq, der = (int(m2.group(2)), int(m2.group(1))) if m2 else (1440, 1440)
    else:
        izq, der = int(m.group(1)), int(m.group(2))
    return max(2000, ancho - izq - der)

def arreglar(xml):
    util = ancho_util(xml)
    salida, pos, n = [], 0, 0
    for m in re.finditer(r'<w:tbl>.*?</w:tbl>', xml, re.S):
        tbl = m.group(0)
        # Columnas = celdas de la primera fila
        fila = re.search(r'<w:tr\b.*?</w:tr>', tbl, re.S)
        if not fila:
            continue
        ncols = len(re.findall(r'<w:tc>', fila.group(0)))
        if ncols == 0:
            continue
        ancho = util // ncols
        resto = util - ancho * (ncols - 1)           # la ultima absorbe el redondeo
        grid = '<w:tblGrid>' + ''.join(
            '<w:gridCol w:w="%d"/>' % (ancho if i < ncols-1 else resto)
            for i in range(ncols)) + '</w:tblGrid>'

        nuevo = tbl
        # 1) tblW al 100% del ancho util + el grid, justo despues de tblPr
        if '<w:tblGrid>' not in nuevo:
            def _pr(mm):
                cuerpo = mm.group(1)
                if '<w:tblW' not in cuerpo:
                    cuerpo += '<w:tblW w:w="%d" w:type="dxa"/>' % util
                return '<w:tblPr>' + cuerpo + '</w:tblPr>' + grid
            nuevo = re.sub(r'<w:tblPr>(.*?)</w:tblPr>', _pr, nuevo, count=1, flags=re.S)
            if '<w:tblGrid>' not in nuevo:      # no habia tblPr
                nuevo = nuevo.replace('<w:tbl>',
                    '<w:tbl><w:tblPr><w:tblW w:w="%d" w:type="dxa"/></w:tblPr>%s' % (util, grid), 1)

        # 2) tcW en CADA celda: sin esto Word ignora el grid
        cont = [0]
        def _celda(mm):
            i = cont[0] % ncols; cont[0] += 1
            w = ancho if i < ncols-1 else resto
            cuerpo = mm.group(1)
            if '<w:tcW' in cuerpo:
                return mm.group(0)
            if '<w:tcPr>' in cuerpo:
                cuerpo = cuerpo.replace('<w:tcPr>',
                         '<w:tcPr><w:tcW w:w="%d" w:type="dxa"/>' % w, 1)
            else:
                cuerpo = '<w:tcPr><w:tcW w:w="%d" w:type="dxa"/></w:tcPr>' % w + cuerpo
            return '<w:tc>' + cuerpo + '</w:tc>'
        nuevo = re.sub(r'<w:tc>(.*?)</w:tc>', _celda, nuevo, flags=re.S)

        salida.append(xml[pos:m.start()]); salida.append(nuevo); pos = m.end(); n += 1
    salida.append(xml[pos:])
    return ''.join(salida), n

def procesar(ruta):
    tmp = tempfile.mkdtemp()
    with zipfile.ZipFile(ruta) as z:
        z.extractall(tmp)
        nombres = z.namelist()
    doc = os.path.join(tmp, 'word', 'document.xml')
    xml = open(doc, encoding='utf8').read()
    xml, n = arreglar(xml)
    open(doc, 'w', encoding='utf8').write(xml)
    with zipfile.ZipFile(ruta, 'w', zipfile.ZIP_DEFLATED) as z:
        for nm in nombres:
            z.write(os.path.join(tmp, nm), nm)
    shutil.rmtree(tmp)
    return n

for f in sys.argv[1:]:
    print('  %-46s %d tabla(s)' % (os.path.basename(f), procesar(f)))
