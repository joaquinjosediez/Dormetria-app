// "Progresión semanal" mostraba el PUNTAJE agregado por semana —un
// compuesto de cinco variables, 0 a 100, una barra por semana.
//
// Eso esconde justo lo que se mira en consulta: cada cuánto aparece una
// noche mala y si se están espaciando. Un 72 semanal puede ser siete
// noches mediocres o cinco buenas y dos pésimas, y la conducta no es la
// misma.
//
// Ahora: una barra por NOCHE, de las tres variables sobre las que se
// decide, cada una con su umbral clínico dibujado.

const C = require('./comun');
const r = C.crearReporte('Noche a noche, no semana a semana');

const app = C.leerApp();
const ctx = C.appEvaluada({ silencioso: true });
r.ok(!!ctx, 'la app arranca');
const vm = require('vm');

// 15 noches malas seguidas y después 15 buenas.
let semilla = 3;
const rnd = () => { semilla = (semilla * 1103515245 + 12345) % 2147483648; return semilla / 2147483648; };
const ns = [];
for (let k = 0; k < 30; k++) {
  const d = new Date(2026, 8, 1 + k);
  const mala = k < 15;
  ns.push({
    diary_date: d.toISOString().slice(0, 10), bedtime: '23:30', wake_time: '07:30',
    sleep_minutes: Math.round((mala ? 380 : 450) + rnd() * 40 - 20),
    sleep_latency_mins: Math.round((mala ? 55 : 18) + rnd() * 20 - 10),
    awakenings: mala ? 2 : 1
  });
}
ctx._nsNN = ns;
const h = vm.runInContext('dmSerieNocheHtml(_nsNN)', ctx);

r.seccion('Las tres variables sobre las que se decide:');

r.ok(/>Latencia</.test(h), 'latencia');
r.ok(/>Eficiencia</.test(h), 'eficiencia');
r.ok(/>Despertares</.test(h), 'despertares');
r.ok((h.match(/dm-nn-franja/g) || []).length === 3, 'una franja por cada una');

r.seccion('Una barra por noche, no por semana:');

r.ok((h.match(/class="dm-nn-b/g) || []).length === 90,
     '30 noches × 3 variables = 90 barras');
r.ok(/últimas 30 noches/.test(h), 'y dice cuántas noches cubre');

r.seccion('Cada franja tiene su umbral clínico dibujado:');

r.ok(/30 min/.test(h), 'latencia: 30 min');
r.ok(/85 %/.test(h),   'eficiencia: 85 %');
r.ok(/dm-nn-umbral/.test(h), 'la línea se dibuja, no solo se nombra');
const pcts = [...h.matchAll(/<b>(\d+)%<\/b> de las noches/g)].map(function (m) { return +m[1]; });
r.ok(pcts.length === 3 && pcts.every(function (p) { return p === 50; }),
     'y se cuenta qué proporción la cruza — con 15 malas de 30 da 50% en las tres (dio ' +
     pcts.join(', ') + ')');

r.seccion('Una noche sin dato no es una noche de cero:');

ctx._nsHueco = ns.map(function (e, i) {
  return i === 5 ? { diary_date: e.diary_date, bedtime: e.bedtime, wake_time: e.wake_time, sleep_minutes: e.sleep_minutes } : e;
});
const h2 = vm.runInContext('dmSerieNocheHtml(_nsHueco)', ctx);
r.ok(/dm-nn-b sin/.test(h2),
     'la noche sin latencia cargada queda como hueco rayado');
r.ok(/quedan\s*'\+\s*'as un hueco|como un hueco, no como un cero/.test(app),
     'y está dicho en el pie');

r.seccion('La eficiencia se recalcula POR NOCHE:');

// El promedio del período no sirve para ver cuáles fueron las malas: si
// se dibujara el promedio, las 30 barras tendrían la misma altura.
const fn = app.slice(app.indexOf('function dmSerieNocheHtml(entries, dias){'),
                     app.indexOf('// PROGRESIÓN SEMANAL'));
r.ok(/let tib = wake - bed/.test(fn), 'se calcula el tiempo en cama de esa noche');
r.ok(/tst\/tib\*100/.test(fn), 'y la eficiencia de esa noche');
r.ok(/if\(ef > 100\) ef = 100/.test(fn), 'con tope en 100: un dato mal cargado no dibuja una barra imposible');

r.seccion('Y el puntaje semanal queda, pero plegado:');

r.ok(/Ver el puntaje semanal/.test(app),
     'sigue disponible — sirve para la tendencia gruesa');
r.ok(/compuesto de cinco\s*\n?\s*\/\/\s*variables|compuesto de cinco/.test(app),
     'y está escrito por qué no va primero');

r.seccion('…y en el Resumen va abierto, que es donde la pregunta SÍ es gruesa:');

// En Diario lo que se mira es cada noche, desglosada. En el Resumen la
// pregunta es "¿viene mejorando?", y para eso el compuesto por semana es
// exactamente el dato.
const resumen = require('fs').readFileSync(
  require('path').join(__dirname, '..', 'js', 'dormetria-render-resumen.js'), 'utf8');
r.ok(/renderWeeklyProgressionHtml\(diarioCompleto \|\| \[\], true\)/.test(resumen),
     'el Resumen dibuja el histograma');
r.ok(/function renderWeeklyProgressionHtml\(allDiary, oscuro\)/.test(app),
     'con la variante para fondo oscuro: los números iban en gris de tarjeta blanca');

// Y con el historial completo, no con las 30 noches que trae el motor: el
// histograma mira 12 semanas hacia atrás y con 30 noches se veían cuatro.
const resumenJs = require('fs').readFileSync(
  require('path').join(__dirname, '..', 'js', 'dormetria-summary-nuevo.js'), 'utf8');
r.ok(/dmCurrentDiarioCompleto/.test(resumenJs),
     'y sobre el historial completo, no sobre las últimas 30 noches');
r.ok(/select=diary_date,bedtime/.test(resumenJs),
     'pedido en la consulta que ya se hacía, sin una ida más al servidor');

r.cerrar('Un 72 semanal puede ser siete noches mediocres o cinco buenas y dos pésimas.');
