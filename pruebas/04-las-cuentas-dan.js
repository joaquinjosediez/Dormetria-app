// Las cuentas clínicas.
//
// Un error acá no se ve: la app muestra un número prolijo y equivocado.
// Ya pasó con la eficiencia de sueño — una paciente con insomnio severo,
// cuatro horas y media despierta en la cama, aparecía con 97% de eficiencia
// porque el tiempo en cama se medía hasta que se DESPERTABA y no hasta que
// se LEVANTABA. Sobre ese número se decide si hace falta restricción de
// tiempo en cama. Nadie lo hubiera notado mirando la pantalla.

const C = require('./comun');
const r = C.crearReporte('Las cuentas dan');

const ctx = C.appEvaluada();
if (!ctx) { console.log('  La app no arranca; no tiene sentido probar las cuentas.'); process.exitCode = 1; return; }

const vm = require('vm');
const corr = c => vm.runInContext(c, ctx);

// ── Eficiencia de sueño ────────────────────────────────────────────────
r.seccion('El tiempo en cama va hasta que se LEVANTA:');
function nocheEnCama(bed, wake, getUp, dormido) {
  return { diary_date: '2026-08-0', bedtime: bed, wake_time: wake,
           get_up_time: getUp, sleep_minutes: dormido, sleep_latency_mins: 20,
           awakenings: 1, wake_in_bed_mins: 30, day_type: 'work' };
}
const enCama = [];
for (let i = 1; i <= 9; i++) {
  const n = nocheEnCama('23:00', '03:30', '08:00', 210);
  n.diary_date = '2026-08-0' + i;
  enCama.push(n);
}
ctx.__cama = enCama;
const mCama = corr('computeDiaryMetrics(__cama)');
r.ok(mCama && mCama.sleepEfficiency != null, 'calcula la eficiencia');
// De 23:00 a 08:00 hay 9 h en cama. Con 3 h 30 dormidas eso es ~39%.
// Midiendo solo hasta las 03:30 daría 78% y parecería una noche aceptable.
r.ok(mCama && mCama.sleepEfficiency < 55,
     'una noche mayormente despierta NO da eficiencia alta',
     mCama ? mCama.sleepEfficiency + '%' : '');
r.ok(mCama && Math.abs(mCama.avgTIB - 540) < 5,
     'el tiempo en cama son las 9 horas reales',
     mCama ? Math.round(mCama.avgTIB) + ' min' : '');

// Y un dato imposible no puede romper la cuenta
const raro = enCama.map(n => Object.assign({}, n, { get_up_time: '01:00' }));
ctx.__raro = raro;
const mRaro = corr('computeDiaryMetrics(__raro)');
r.ok(mRaro && mRaro.avgTIB != null && mRaro.avgTIB > 0,
     'levantarse antes de despertarse no rompe nada',
     mRaro ? Math.round(mRaro.avgTIB) + ' min' : '');

// ── Regularidad ────────────────────────────────────────────────────────
r.seccion('Regularidad:');
const noches = [];
for (let i = 0; i < 14; i++) {
  const d = new Date(2026, 6, 1 + i);
  noches.push({ diary_date: d.toISOString().slice(0, 10),
                bedtime: '23:00', wake_time: '07:00', sleep_minutes: 460 });
}
ctx.__reg = noches;
const reg = corr('computeSleepRegularity(__reg)');
r.ok(reg && reg.score >= 90, 'horarios idénticos dan regularidad máxima',
     reg ? reg.score + ' · ' + reg.label : 'sin resultado');
r.ok(reg && reg.label === 'Excelente', 'y la palabra acompaña', reg && reg.label);

const caos = [];
for (let i = 0; i < 14; i++) {
  const d = new Date(2026, 6, 1 + i);
  caos.push({ diary_date: d.toISOString().slice(0, 10),
              bedtime: i % 2 ? '21:00' : '04:00', wake_time: i % 2 ? '05:00' : '13:00',
              sleep_minutes: 460 });
}
ctx.__caos = caos;
const reg2 = corr('computeSleepRegularity(__caos)');
r.ok(reg2 && reg2.score < 40, 'horarios que saltan 7 horas dan regularidad baja',
     reg2 ? reg2.score + ' · ' + reg2.label : 'sin resultado');

ctx.__una = [noches[0]];
const reg3 = corr('computeSleepRegularity(__una)');
r.ok(reg3 && reg3.score === null, 'con una sola noche no inventa un puntaje',
     reg3 && reg3.label);

// ── Promedio móvil del gráfico ─────────────────────────────────────────
r.seccion('El promedio de 7 noches del gráfico:');
const pm = ctx.dmPromedioMovil;
const amplitud = a => { const v = a.filter(x => x != null);
                        return Math.max.apply(null, v) - Math.min.apply(null, v); };
r.ok(JSON.stringify(pm([10, 10, 10, 10, 10, 10, 10], 7)) === '[10,10,10,10,10,10,10]',
     'una línea plana queda plana');
const ruido = [0, 100, 0, 100, 0, 100, 0, 100, 0, 100, 0, 100, 0];
r.ok(amplitud(pm(ruido, 7)) < amplitud(ruido) / 3, 'aplasta el ruido',
     'de ' + amplitud(ruido) + ' a ' + amplitud(pm(ruido, 7)).toFixed(1));
const datos = [12, 88, 34, 71, 50, 63, 29, 95, 41];
const suave = pm(datos, 7).filter(v => v != null);
r.ok(Math.min.apply(null, suave) >= Math.min.apply(null, datos) &&
     Math.max.apply(null, suave) <= Math.max.apply(null, datos),
     'nunca inventa un valor fuera del rango real');
r.ok(pm([], 7).length === 0, 'con cero noches no explota');

// ── Factores: no puede afirmar sobre poca evidencia ────────────────────
r.seccion('Los factores asociados:');
function diario(n, conPantalla) {
  const a = [];
  for (let i = 0; i < n; i++) {
    const d = new Date(2026, 5, 1 + i);
    const p = conPantalla ? i % 2 === 0 : false;
    a.push({ diary_date: d.toISOString().slice(0, 10), bedtime: '23:30',
             wake_time: '07:00', get_up_time: '07:15',
             sleep_minutes: p ? 360 : 450, sleep_latency_mins: p ? 45 : 15,
             awakenings: p ? 2 : 0, wake_in_bed_mins: p ? 30 : 0,
             sleep_quality: p ? 2 : 4, screen_minutes: p ? 90 : 0,
             exercise_mins: 0, coffee_cups: 0, alcohol_drinks: 0, nap_minutes: 0 });
  }
  return a;
}
ctx.__pocas = diario(6, true);
const pocas = corr('computeHabitsImpact(__pocas)');
r.ok(pocas && pocas.error === 'few_nights', 'con 6 noches no analiza nada', pocas && pocas.error);

ctx.__muchas = diario(30, true);
const muchas = corr('computeHabitsImpact(__muchas)');
const pantallas = muchas && muchas.habitos.find(x => x.id === 'screens');
r.ok(!!pantallas, 'con 30 noches sí analiza las pantallas');
if (pantallas) {
  const qual = pantallas.efectos.find(e => e.id === 'qual');
  r.ok(qual && qual.p < 0.05, 'y detecta la diferencia de calidad',
       qual ? 'p=' + qual.p.toFixed(5) : '');
  r.ok(qual && qual.signo !== 0, 'la marca como efecto real');
}

// Sin diferencia real, no puede marcar nada. Es la mitad que importa: un
// análisis que siempre encuentra algo no está encontrando nada.
ctx.__parejas = diario(30, true).map(e => Object.assign({}, e, {
  sleep_minutes: 420, sleep_latency_mins: 15, awakenings: 0,
  wake_in_bed_mins: 0, sleep_quality: 3 }));
const parejas = corr('computeHabitsImpact(__parejas)');
const p2 = parejas && parejas.habitos && parejas.habitos.find(x => x.id === 'screens');
r.ok(!p2 || p2.efectos.every(e => e.signo === 0),
     'si no hay diferencia real, no afirma que la hay');

// ── Calidad reportada cruzada con las variables ────────────────────────
r.seccion('Calidad reportada cruzada con las variables:');
const sal = corr('dmCalidadFactoresHtml(__muchas)');
r.ok(!!sal && /Pantallas/.test(sal), 'nombra el factor que mueve la calidad');
r.ok(/2,0 vs 4,0/.test(sal || ''), 'con las dos medias');
r.ok(/asociación, no causa/.test(sal || ''), 'y aclarando que no es causa');
const sal2 = corr('dmCalidadFactoresHtml(__parejas)');
r.ok(!/#b91c1c|#15803d/.test(sal2 || ''), 'sin diferencia real no pinta nada de color');
r.ok(corr('dmCalidadFactoresHtml(__pocas)') === '', 'con 6 noches no dice nada');

r.cerrar('Los números dicen lo que los datos sostienen.');

// ── La biblioteca de fichas ────────────────────────────────────────────
// En mod130 se reescribieron las fichas y se perdieron cuatro sin que nadie
// lo notara: embarazo, adultos mayores, trabajo por turnos y guardias.
// Estuvieron ausentes 37 versiones, hasta que Joaquín se acordó de que
// existían. Esta comprobación está para que no vuelva a pasar en silencio.
//
// Verificado: reprueba mod167 en las seis fichas que faltaban.
const r3 = C.crearReporte('La biblioteca de fichas está completa');
const fichas = corr('typeof PATIENT_EDU_TOPICS!=="undefined"?PATIENT_EDU_TOPICS:[]') || [];

r3.ok(fichas.length >= 12, 'hay al menos 12 fichas', fichas.length + ' fichas');

const IMPRESCINDIBLES = [
  ['higiene', 'higiene del sueño'], ['tcci', 'qué es la TCC-I'],
  ['cafe-alcohol', 'café y alcohol'], ['pantallas', 'pantallas'],
  ['horas', 'cuántas horas'], ['despertares', 'despertarse de noche'],
  ['embarazo', 'embarazo'], ['lactancia', 'recién nacido'],
  ['mayores', 'después de los 65'], ['turnos', 'trabajo por turnos'],
  ['guardias', 'guardias'], ['menopausia', 'menopausia']
];
IMPRESCINDIBLES.forEach(([id, queEs]) => {
  r3.ok(fichas.some(f => f.id === id), 'está la ficha de ' + queEs);
});

// Ninguna puede quedar vacía ni a medio escribir.
const flojas = fichas.filter(f => !f.title || !f.icon || !f.body ||
                                  f.body.replace(/\s+/g, ' ').length < 400);
r3.ok(flojas.length === 0, 'todas tienen título, ícono y cuerpo',
      flojas.length ? flojas.map(f => f.id).join(', ') : fichas.length + ' revisadas');

const sinCerrar = fichas.filter(f =>
  (f.body.match(/<p/g) || []).length !== (f.body.match(/<\/p>/g) || []).length);
r3.ok(sinCerrar.length === 0, 'el HTML de cada ficha cierra bien',
      sinCerrar.length ? sinCerrar.map(f => f.id).join(', ') : '');

const idsFichas = fichas.map(f => f.id);
r3.ok(new Set(idsFichas).size === idsFichas.length, 'sin identificadores repetidos');

r3.cerrar('Las 12 fichas están y están enteras.');
