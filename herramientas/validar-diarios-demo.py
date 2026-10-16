# -*- coding: utf-8 -*-
"""Valida que cada noche generada entre en el rango que la base acepta.

Existe porque mandé tres SQL que fallaron en produccion, y el tercero
—mood 1..10 cuando la columna acepta 1..5— lo habria agarrado esto en un
segundo. pglast valida la sintaxis; esto valida los VALORES.

Los rangos de los selectores salen del formulario de la app: los
data-val de cada botón de emoji.
"""
RANGOS = {
 'sleep_minutes':(60,900), 'sleep_latency_mins':(0,600), 'awakenings':(0,15),
 'wake_in_bed_mins':(0,600), 'awake_in_bed_after_mins':(0,400),
 'nap_minutes':(0,400), 'sleep_quality':(1,5), 'mood':(1,5), 'energy':(1,5),
 'coffee_cups':(0,15), 'alcohol_drinks':(0,20), 'screen_minutes':(0,600),
 'exercise_mins':(0,300),
}
HORAS = ('bedtime','wake_time','get_up_time','last_caffeine_time','last_alcohol_time')

def revisar(todo, mostrar=12):
    malos=[]
    for k, ns in todo.items():
        for n in ns:
            for c,(lo,hi) in RANGOS.items():
                v=n.get(c)
                if v is None: continue
                if not isinstance(v,int) or v<lo or v>hi:
                    malos.append('%s %s · %s=%r (rango %d..%d)'%(k,n['fecha'],c,v,lo,hi))
            for c in HORAS:
                v=n.get(c)
                if v is None: continue
                try:
                    h,m=str(v).split(':'); assert 0<=int(h)<=23 and 0<=int(m)<=59
                except Exception:
                    malos.append('%s %s · %s=%r no es hora'%(k,n['fecha'],c,v))
            if n.get('day_type') not in ('work','free'):
                malos.append('%s %s · day_type=%r'%(k,n['fecha'],n.get('day_type')))
            # Coherencia interna, que la base no chequea pero el motor sí mira:
            if n.get('awakenings')==0 and n.get('wake_in_bed_mins',0)>0:
                malos.append('%s %s · 0 despertares con WASO %d'%(k,n['fecha'],n['wake_in_bed_mins']))
            if n.get('sleep_minutes',0) and n.get('wake_in_bed_mins') is not None:
                pass
    for m in malos[:mostrar]: print('  x', m)
    if len(malos)>mostrar: print('  ... y', len(malos)-mostrar, 'más')
    return malos
