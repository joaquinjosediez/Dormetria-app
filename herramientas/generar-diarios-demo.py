#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Genera los 8 diarios de ejemplo de Dormetria, con un solo criterio.

POR QUÉ EXISTE ESTE ARCHIVO
───────────────────────────
La primera tanda se escribió a mano en SQL y pasó lo previsible:

  · El `delete` tenía una ventana de fechas (between 2026-08-21 y
    2026-10-15) y las noches anteriores de cada paciente quedaron abajo.
    Elena terminó con 101 noches: 45 viejas con un criterio y 56 nuevas
    con otro. En el actograma el empalme se ve de lejos.
  · La menstruación aparecía sólo en las primeras semanas, así que las
    pacientes "dejaban de menstruar" a mitad del registro.
  · Elena, que es la ficha de control y la que se va a usar para mostrar
    el análisis por fase del ciclo, no tenía ningún día marcado.

Con un generador, el criterio es uno solo y está escrito. Si hay que
volver a generar, se corre de nuevo y sale igual.

LO QUE EL GENERADOR GARANTIZA
─────────────────────────────
  · 56 noches (8 semanas) por paciente, sin huecos, mismo rango para todos.
  · Horarios con dispersión REALISTA y acotada: cada persona tiene su hora
    y se mueve alrededor de ella. Nada de saltos de tres horas entre dos
    martes seguidos, salvo en Peter, donde el salto ES el diagnóstico.
  · Despertares sin exagerar: el número y la duración salen del cuadro de
    cada uno, no de un random amplio.
  · Ciclo menstrual CONTINUO en las cuatro mujeres en edad de menstruar,
    de punta a punta del registro.

EL EFECTO DEL CICLO SOBRE EL SUEÑO
──────────────────────────────────
Se modela chico, que es como es. En la fase lútea tardía y los primeros
días de sangrado hay más despertares, algo más de vigilia intrasueño y
peor calidad percibida; el deterioro subjetivo es mayor que el objetivo
(Baker & Driver, Sleep Med 2007; Baker & Lee, Sleep Med Clin 2018). La
eficiencia cae unos pocos puntos, no se desploma.

  · 3 días premenstruales : latencia +10, WASO +8, despertares +1 a veces,
                            calidad −1, ánimo −1
  · días 1–2 de sangrado  : latencia +8, WASO +10, despertares +1,
                            calidad −1
  · días 3–5 de sangrado  : residual chico

Si se exagera esto, la app muestra un efecto que en la literatura no tiene
ese tamaño, y el que lo sabe deja de creerle al resto.

USO
    python3 herramientas/generar-diarios-demo.py > SQL-demos-diarios.sql
    python3 herramientas/validar-diarios-demo.py SQL-demos-diarios.sql
    python3 herramientas/validar-sql.py SQL-demos-diarios.sql
"""

import random
from datetime import date, timedelta

RANDOM_SEED = 20261016          # mismo archivo cada vez que se corre
FIN = date(2026, 10, 15)
NOCHES = 56
INICIO = FIN - timedelta(days=NOCHES - 1)

rnd = random.Random(RANDOM_SEED)


# ── Utilidades ────────────────────────────────────────────────────────
def hhmm(minutos):
    """Minutos desde medianoche (puede pasarse de 1440) → 'HH:MM'."""
    m = int(round(minutos)) % 1440
    return '%02d:%02d' % (m // 60, m % 60)


def jitter(sd):
    """Ruido normal truncado a ±2 SD: sin colas que inventen noches raras."""
    v = rnd.gauss(0, sd)
    return max(-2 * sd, min(2 * sd, v))


def acotar(v, lo, hi):
    return max(lo, min(hi, v))


# ── El ciclo menstrual ────────────────────────────────────────────────
class Ciclo:
    """
    Ciclos continuos de punta a punta del registro.

    `variabilidad` es la SD de la duración del ciclo. A los 25 años un
    ciclo es parejo (±1,5 días); a los 47, en transición menopáusica, no
    (±4 días, y alguno se saltea). Poner la misma regularidad a las dos
    sería el tipo de detalle que un colega que atiende mujeres nota.
    """

    def __init__(self, largo, variabilidad, dias_sangrado, dia_inicial, saltea=False):
        self.dias = {}          # fecha → día del ciclo (1 = primer día de sangrado)
        self.sangra = set()
        self.premens = set()
        d = INICIO - timedelta(days=dia_inicial)
        n_ciclo = 0
        while d <= FIN + timedelta(days=40):
            largo_este = int(round(largo + jitter(variabilidad)))
            largo_este = acotar(largo_este, 21, 45)
            sangrado = dias_sangrado + (1 if rnd.random() < 0.3 else 0)
            # En transición menopáusica un ciclo puede saltearse.
            # Un ciclo salteado es realista a los 47, pero si el unico que
            # entra en la ventana es el salteado, la ficha dice 'dejo de
            # menstruar', que es justo lo que habia que arreglar.
            saltado = saltea and n_ciclo > 1 and rnd.random() < 0.15
            for k in range(largo_este):
                f = d + timedelta(days=k)
                if INICIO <= f <= FIN:
                    self.dias[f] = k + 1
                    if k < sangrado and not saltado:
                        self.sangra.add(f)
                    if k >= largo_este - 3 and not saltado:
                        self.premens.add(f)
            d += timedelta(days=largo_este)
            n_ciclo += 1

    def efecto(self, f):
        """(latencia, waso, despertares, calidad, animo) a sumar esa noche."""
        if f in self.premens:
            return (10, 8, 1 if rnd.random() < 0.45 else 0, -1, -1)
        if f in self.sangra:
            dia = self.dias.get(f, 99)
            if dia <= 2:
                return (8, 10, 1, -1, 0)
            return (3, 4, 1 if rnd.random() < 0.25 else 0, 0, 0)
        return (0, 0, 0, 0, 0)


# ── Un perfil ─────────────────────────────────────────────────────────
class Perfil:
    def __init__(self, clave, nombre, **kw):
        self.clave = clave
        self.nombre = nombre
        self.ciclo = None          # antes de update(kw): si no, lo pisa
        self.__dict__.update(kw)


def libre(f):
    return f.weekday() >= 5


# NOTA sobre la dispersión horaria de cada uno.
#
# En la primera versión los ocho tenían bed_sd≈20 min y la SD del punto medio
# les daba 19–23 min a todos: el pilar de regularidad marcaba "Muy bien" en
# los ocho y dejaba de distinguir a nadie. Eso no es homogeneidad, es un
# pilar apagado.
#
# Ahora cada uno se mueve lo que su cuadro justifica: quien no duerme corre
# el horario probando ("hoy me acuesto más temprano a ver si engancho"), que
# es parte del insomnio y lo que la TCC-I después estabiliza; el retraso de
# fase se mueve mucho y encima entre semana y fin de semana; el control casi
# no se mueve. El rango queda ~22 a ~88 min de SD del punto medio, que es la
# dispersión real de una población clínica (mediana poblacional 30–40 min,
# Liang 2023, NHANES n=9.981).

# Cada perfil declara su noche TÍPICA y cuánto se mueve. La patología se
# expresa en esos números, no en excepciones sueltas.
PERFILES = [
    Perfil('juana', 'Juana de Arco · 25 · insomnio de conciliación',
           # Eficiencia objetivo ~72-76 %: se acuesta temprano "para darse
           # tiempo", tarda mas de una hora y se despierta. Es el patron que
           # la TCC-I busca, y el que justifica la restriccion de sueno.
           bed=22 * 60 + 50, bed_sd=56, fin=7 * 60 + 10, fin_sd=44,
           lat=(65, 105), lat_sd=14, awk=(1, 2), waso=(18, 40),
           getup_extra=(10, 22), calidad=2, animo=2, energia=2,
           cafe=(1, 3), alcohol=(0, 1), pantallas=(40, 90), ejercicio=(0, 30),
           siesta=0.10, siesta_min=(20, 40),
           ciclo=dict(largo=28, variabilidad=1.5, dias_sangrado=5, dia_inicial=6)),

    Perfil('quijano', 'Alonso Quijano · 58 · SAHOS',
           bed=23 * 60, bed_sd=26, fin=7 * 60, fin_sd=24,
           lat=(6, 16), lat_sd=4, awk=(3, 5), waso=(50, 80),
           getup_extra=(5, 15), calidad=2, animo=3, energia=2,
           cafe=(2, 4), alcohol=(0, 2), pantallas=(20, 60), ejercicio=(0, 20),
           siesta=0.55, siesta_min=(30, 70)),

    Perfil('kahlo', 'Frida Kahlo · 47 · síndrome de piernas inquietas',
           bed=23 * 60 + 30, bed_sd=46, fin=7 * 60, fin_sd=38,
           lat=(45, 80), lat_sd=12, awk=(2, 3), waso=(25, 45),
           getup_extra=(8, 20), calidad=2, animo=3, energia=2,
           cafe=(1, 2), alcohol=(0, 1), pantallas=(30, 70), ejercicio=(0, 35),
           siesta=0.22, siesta_min=(20, 45),
           # 47 años: transición menopáusica. Ciclos más largos, más
           # variables, y alguno que se saltea.
           ciclo=dict(largo=31, variabilidad=4.0, dias_sangrado=5,
                      dia_inicial=4, saltea=True)),

    Perfil('frank', 'Victor Frankenstein · 41 · parasomnia',
           bed=23 * 60 + 45, bed_sd=24, fin=7 * 60 + 15, fin_sd=20,
           lat=(10, 22), lat_sd=5, awk=(1, 2), waso=(15, 40),
           getup_extra=(5, 15), calidad=3, animo=3, energia=3,
           cafe=(1, 2), alcohol=(0, 2), pantallas=(20, 60), ejercicio=(0, 45),
           siesta=0.12, siesta_min=(20, 40)),

    Perfil('peter', 'Peter Pan · 17 · cronodisrupción (retraso de fase)',
           bed=25 * 60 + 45, bed_sd=28, fin=7 * 60, fin_sd=12,
           lat=(12, 28), lat_sd=6, awk=(0, 1), waso=(0, 10),
           getup_extra=(3, 12), calidad=3, animo=3, energia=2,
           cafe=(1, 3), alcohol=(0, 1), pantallas=(60, 150), ejercicio=(0, 40),
           siesta=0.30, siesta_min=(30, 80),
           # El fin de semana se va todavía más tarde y duerme hasta el
           # mediodía: ahí está el jet lag social, que es el diagnóstico.
           libre_bed=75, libre_fin=5 * 60 + 15),

    Perfil('aurora', 'Aurora Bosque · 30 · narcolepsia',
           bed=23 * 60 + 20, bed_sd=32, fin=7 * 60 + 10, fin_sd=28,
           # Latencia muy corta: se duerme apenas apoya la cabeza.
           lat=(1, 6), lat_sd=2, awk=(2, 4), waso=(25, 45),
           getup_extra=(5, 15), calidad=3, animo=3, energia=2,
           cafe=(2, 4), alcohol=(0, 1), pantallas=(20, 60), ejercicio=(0, 40),
           # Siestas cortas casi todos los días, y reparadoras: es el rasgo.
           siesta=0.80, siesta_min=(12, 25),
           ciclo=dict(largo=29, variabilidad=2.0, dias_sangrado=5, dia_inicial=19)),

    Perfil('elena', 'Elena Ferrante · 38 · control, sueño normal',
           bed=23 * 60 + 10, bed_sd=18, fin=7 * 60 + 5, fin_sd=15,
           # Un adulto sin queja de sueno rinde 88-93 %, no 97: despertarse
           # una vez y tardar un cuarto de hora en dormirse es lo normal.
           lat=(12, 25), lat_sd=5, awk=(0, 1), waso=(5, 18),
           getup_extra=(8, 18), calidad=4, animo=4, energia=4,
           cafe=(1, 2), alcohol=(0, 1), pantallas=(15, 45), ejercicio=(0, 45),
           siesta=0.08, siesta_min=(20, 35),
           ciclo=dict(largo=28, variabilidad=2.0, dias_sangrado=5, dia_inicial=2)),

    Perfil('tomas', 'Tomás Ferrante · 4 · pediátrico',
           bed=20 * 60 + 45, bed_sd=18, fin=7 * 60 + 15, fin_sd=18,
           lat=(12, 30), lat_sd=6, awk=(1, 2), waso=(8, 20),
           getup_extra=(3, 10), calidad=4, animo=4, energia=4,
           cafe=(0, 0), alcohol=(0, 0), pantallas=(10, 40), ejercicio=(20, 70),
           siesta=0.70, siesta_min=(45, 90)),
]


def noche(p, f):
    """Una noche de un perfil. Devuelve el dict listo para el SQL."""
    es_libre = libre(f)

    bed = p.bed + jitter(p.bed_sd)
    fin = p.fin + jitter(p.fin_sd)
    if es_libre:
        bed += getattr(p, 'libre_bed', 35) + jitter(14)
        fin += getattr(p, 'libre_fin', 55) + jitter(18)

    lat = rnd.uniform(*p.lat) + jitter(p.lat_sd)
    awk = rnd.randint(*p.awk)
    waso = rnd.uniform(*p.waso) if awk > 0 else 0.0

    cal, ani, ene = p.calidad, p.animo, p.energia
    periodo = False

    if p.ciclo is not None:
        dlat, dwaso, dawk, dcal, dani = p.ciclo.efecto(f)
        lat += dlat
        waso += dwaso
        awk += dawk
        cal += dcal
        ani += dani
        periodo = f in p.ciclo.sangra

    lat = acotar(lat, 1, 180)
    awk = int(acotar(awk, 0, 7))
    if awk == 0:
        waso = 0.0
    else:
        # Un despertar no puede durar cero, y la vigilia total tiene que ser
        # coherente con cuántos hubo: esto es lo que evita las dos
        # incoherencias que ya aparecieron (WASO negativo, y WASO con cero
        # despertares).
        waso = acotar(waso, 3.0 * awk, 45.0 * awk)

    tib = (fin - bed) % 1440
    tst = tib - lat - waso
    # Piso de seguridad: si la combinación de esta noche dejó el sueño
    # absurdo, se recorta la latencia antes que inventar una noche de 3 h.
    if tst < 180:
        lat = max(1, lat - (180 - tst))
        tst = tib - lat - waso

    getup = fin + rnd.uniform(*p.getup_extra)
    despues = (getup - fin)

    con_siesta = rnd.random() < p.siesta
    nap = int(round(rnd.uniform(*p.siesta_min))) if con_siesta else 0

    cal = int(acotar(cal + (1 if rnd.random() < 0.18 else 0)
                         - (1 if rnd.random() < 0.18 else 0), 1, 5))
    ani = int(acotar(ani + (1 if rnd.random() < 0.18 else 0)
                         - (1 if rnd.random() < 0.18 else 0), 1, 5))
    ene = int(acotar(ene + (1 if rnd.random() < 0.18 else 0)
                         - (1 if rnd.random() < 0.18 else 0), 1, 5))

    # El detalle de cada despertar: es de donde el actograma dibuja los
    # cortes naranjas. Si esto no existe, el dibujo y el puntaje hablan de
    # cosas distintas — que es exactamente el problema que se acaba de
    # arreglar del otro lado, en dmFragDatos.
    detalle = []
    if awk > 0:
        restante = waso
        for k in range(awk):
            dur = restante if k == awk - 1 else max(3.0, restante * rnd.uniform(0.25, 0.6))
            dur = min(dur, restante)
            restante -= dur
            # Repartidos por la noche, no todos juntos.
            t = bed + lat + (tst + waso) * (k + 1) / (awk + 1) + jitter(25)
            detalle.append({'time': hhmm(t), 'duration': int(round(dur))})
        detalle = [d for d in detalle if d['duration'] > 0]

    return dict(
        fecha=f.isoformat(),
        bedtime=hhmm(bed),
        wake_time=hhmm(fin),
        get_up_time=hhmm(getup),
        sleep_minutes=int(round(tst)),
        sleep_latency_mins=int(round(lat)),
        awakenings=len(detalle),
        wake_in_bed_mins=int(round(sum(d['duration'] for d in detalle))),
        awake_in_bed_after_mins=int(round(despues)),
        nap_minutes=nap,
        sleep_quality=cal, mood=ani, energy=ene,
        day_type='free' if es_libre else 'work',
        coffee_cups=rnd.randint(*p.cafe),
        alcohol_drinks=rnd.randint(*p.alcohol) if not es_libre else
                       min(p.alcohol[1] + 1, rnd.randint(p.alcohol[0], p.alcohol[1] + 1)),
        screen_minutes=int(round(rnd.uniform(*p.pantallas))),
        exercise_mins=int(round(rnd.uniform(*p.ejercicio))),
        has_period=periodo,
        detalle=detalle,
    )


def sql_bool(b):
    return 'true' if b else 'false'


def generar():
    for p in PERFILES:
        if isinstance(p.ciclo, dict):
            p.ciclo = Ciclo(**p.ciclo)
        elif not isinstance(p.ciclo, Ciclo):
            p.ciclo = None

    filas = []
    resumen = []
    for p in PERFILES:
        ns = []
        f = INICIO
        while f <= FIN:
            ns.append(noche(p, f))
            f += timedelta(days=1)
        filas.append((p, ns))
        tst = sum(n['sleep_minutes'] for n in ns) / len(ns)
        ef = sum(n['sleep_minutes'] for n in ns) / sum(
            (n['sleep_minutes'] + n['sleep_latency_mins'] + n['wake_in_bed_mins'])
            for n in ns) * 100
        resumen.append((p, len(ns), tst, ef,
                        sum(n['awakenings'] for n in ns) / len(ns),
                        sum(1 for n in ns if n['has_period'])))
    return filas, resumen


if __name__ == '__main__':
    import sys
    filas, resumen = generar()
    out = sys.stdout

    out.write("""-- ═══════════════════════════════════════════════════════════════════
--  Dormetria · los OCHO diarios de ejemplo, con UN SOLO criterio
--  Generado por herramientas/generar-diarios-demo.py (semilla %d)
--
--  REEMPLAZA TODO. El intento anterior borraba sólo entre el 21/08 y el
--  15/10, así que las noches viejas quedaron abajo y en el actograma de
--  Elena se veía el empalme: 101 noches, dos criterios distintos. Acá el
--  delete no tiene ventana de fechas.
--
--  Qué queda en cada ficha (8 semanas, %s a %s):
--
""" % (RANDOM_SEED, INICIO.isoformat(), FIN.isoformat()))
    for p, n, tst, ef, awk, per in resumen:
        out.write('--    %-52s %2d n · TST %4.0f min · ef %4.1f%% · %.1f desp%s\n'
                  % (p.nombre, n, tst, ef, awk,
                     (' · %d días de menstruación' % per) if per else ''))
    out.write("""--
--  Se puede correr las veces que quieras. Correlo ENTERO.
-- ═══════════════════════════════════════════════════════════════════

begin;

with gente as (
""")
    claves = [p.clave for p, _ in filas]
    codigos = {'juana': 'JUANA1', 'quijano': 'QUIJAN', 'kahlo': 'KAHLO1',
               'frank': 'FRANK1', 'peter': 'PETER1', 'aurora': 'AURORA',
               'elena': 'ELENA1', 'tomas': 'TOMAS1'}
    partes = ["  (select '%s'::text as k, email from public.patients where code = '%s' limit 1)"
              % (k, codigos[k]) for k in claves]
    out.write('\n  union all '.join(partes).replace('\n  union all   (', '\n  union all (') + '\n')
    out.write(""")
-- SIN ventana de fechas: la ficha queda sólo con lo que carga este archivo.
delete from public.sleep_diary s using gente g where s.patient_email = g.email;

with gente as (
""")
    out.write('\n  union all '.join(partes).replace('\n  union all   (', '\n  union all (') + '\n')
    out.write("""), d(k, diary_date, bedtime, wake_time, get_up_time, sleep_minutes,
     sleep_latency_mins, awakenings, wake_in_bed_mins, awake_in_bed_after_mins,
     awakening_detail, nap_minutes, sleep_quality, mood, energy, day_type,
     coffee_cups, alcohol_drinks, screen_minutes, exercise_mins, has_period) as (
  values
""")
    lineas = []
    for p, ns in filas:
        for n in ns:
            det = 'null' if not n['detalle'] else "'[%s]'" % ','.join(
                '{"time":"%s","duration":%d}' % (d['time'], d['duration'])
                for d in n['detalle'])
            lineas.append(
                "  ('%s', '%s', '%s', '%s', '%s', %d, %d, %d, %d, %d, %s, %d, %d, %d, %d, '%s', %d, %d, %d, %d, %s)"
                % (p.clave, n['fecha'], n['bedtime'], n['wake_time'], n['get_up_time'],
                   n['sleep_minutes'], n['sleep_latency_mins'], n['awakenings'],
                   n['wake_in_bed_mins'], n['awake_in_bed_after_mins'], det,
                   n['nap_minutes'], n['sleep_quality'], n['mood'], n['energy'],
                   n['day_type'], n['coffee_cups'], n['alcohol_drinks'],
                   n['screen_minutes'], n['exercise_mins'], sql_bool(n['has_period'])))
    out.write(',\n'.join(lineas) + '\n')
    out.write(""")
insert into public.sleep_diary (patient_email, diary_date, bedtime, wake_time,
  get_up_time, sleep_minutes, sleep_latency_mins, awakenings, wake_in_bed_mins,
  awake_in_bed_after_mins, awakening_detail, nap_minutes, sleep_quality, mood,
  energy, day_type, coffee_cups, alcohol_drinks, screen_minutes, exercise_mins,
  has_period, schema_version)
select g.email, d.diary_date::date, d.bedtime::time, d.wake_time::time,
       d.get_up_time::time, d.sleep_minutes, d.sleep_latency_mins, d.awakenings,
       d.wake_in_bed_mins, d.awake_in_bed_after_mins, d.awakening_detail::jsonb,
       d.nap_minutes, d.sleep_quality, d.mood, d.energy, d.day_type,
       d.coffee_cups, d.alcohol_drinks, d.screen_minutes, d.exercise_mins,
       d.has_period, 2
  from d join gente g on g.k = d.k;

commit;

-- Control: una fila por paciente con lo que quedó cargado.
select p.code, p.name || ' ' || p.lname as paciente,
       count(*) as noches,
       min(s.diary_date) as desde, max(s.diary_date) as hasta,
       round(avg(s.sleep_minutes)) as tst_min,
       round(avg(s.awakenings), 1) as desp_por_noche,
       round(avg(s.wake_in_bed_mins)) as waso_min,
       count(*) filter (where s.has_period) as dias_menstruacion
  from public.patients p
  join public.sleep_diary s on s.patient_email = p.email
 where p.code in ('JUANA1','QUIJAN','KAHLO1','FRANK1','PETER1','AURORA','ELENA1','TOMAS1')
 group by p.code, p.name, p.lname
 order by p.code;
""")
