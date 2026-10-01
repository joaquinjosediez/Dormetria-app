// "Con cafeína" contra "sin cafeína" mete en el mismo grupo al que toma un
// café a las 8 de la mañana y al que lo toma a las 21. La vida media de la
// cafeína es de 5 a 6 horas: a las 8 no queda nada a la hora de dormir, a las
// 21 queda más de la mitad. Promediados, el efecto real se diluye hasta
// desaparecer — y el gráfico informa "sin diferencia relevante" sobre algo
// que sí la tiene.
//
// El corte va en 6 h y no en 4 por Drake 2013 (J Clin Sleep Med 9:1195), que
// dio 400 mg a 0, 3 y 6 h antes de acostarse y midió por polisomnografía: las
// TRES dosis alteraron el sueño, incluida la de 6 h.
//
// Esta prueba comprueba lo que importa: que el factor nuevo SEPARE dos cosas
// que el viejo mezcla. Con noches donde la cafeína tardía empeora el sueño y
// la temprana no, el factor viejo no tiene que encontrar nada y el nuevo sí.

const C = require('./comun');
const vm = require('vm');
const r = C.crearReporte('No es lo mismo el café de la mañana');

const app = C.leerApp();
const ctx = C.appEvaluada({ silencioso: true });
r.ok(!!ctx, 'la app arranca');

// ── Las noches ────────────────────────────────────────────────────────
// TODAS tienen cafeína. La mitad temprano (08:00) y duerme bien; la otra
// mitad tarde (21:30) y duerme mal. Para el factor viejo son todas iguales.
let semilla = 3;
const rnd = () => { semilla = (semilla * 1103515245 + 12345) % 2147483648; return semilla / 2147483648; };
const ns = [];
for (let k = 0; k < 40; k++) {
  const tarde = k % 2 === 0;
  ns.push({
    diary_date: new Date(2026, 7, 1 + k).toISOString().slice(0, 10),
    bedtime: '23:30', wake_time: '07:30',
    sleep_minutes: Math.round((tarde ? 370 : 460) + rnd() * 25),
    sleep_latency_mins: Math.round((tarde ? 70 : 18) + rnd() * 10),
    awakenings: tarde ? 2 : 0,
    wake_in_bed_mins: tarde ? 45 : 5,
    sleep_quality: tarde ? 2 : 4,
    day_type: 'work',
    coffee_cups: 200,
    last_caffeine_time: tarde ? '21:30' : '08:00'
  });
}
ctx._caf = ns;

const R = vm.runInContext('computeHabitsImpact(_caf)', ctx);
const porId = {};
(R.habitos || []).forEach(function (h) { porId[h.id] = h; });

r.seccion('El factor viejo no puede ver nada, porque no hay contraste:');

// Todas las noches tienen cafeína: no hay grupo "sin". El factor se cae solo.
r.ok(!porId.caffeine,
     'con cafeína todas las noches, "con/sin cafeína" ni siquiera se calcula');

r.seccion('El factor nuevo sí, porque compara temprano contra tarde:');

const late = porId.caffeine_late;
r.ok(!!late, 'aparece el factor de la hora');
if (late) {
  r.ok(late.nOn === 20 && late.nOff === 20,
       'veinte noches de cada lado', late.nOn + ' vs ' + late.nOff);
  r.ok(late.veredicto === 'negativo',
       'y el veredicto es que la cafeína tardía acompaña a peor sueño',
       late.veredicto);
  const lat = (late.efectos || []).filter(function (e) { return /latencia/i.test(e.label || ''); })[0];
  r.ok(lat && lat.signo !== 0,
       'la latencia sale como efecto neto, no como "sin diferencia"',
       lat ? (Math.round(lat.diff) + ' min · p=' + (lat.p != null ? lat.p.toExponential(1) : '—')) : 'no está');
}

r.seccion('El corte es el publicado, no uno inventado:');

const bloque = app.slice(app.indexOf("{ id:'caffeine_late'"),
                         app.indexOf("{ id:'caffeine_late'") + 1400);
r.ok(/< 360/.test(bloque), 'seis horas para la cafeína');
r.ok(/Drake 2013/.test(bloque), 'con la referencia adentro del código');
const bloqueAlc = app.slice(app.indexOf("{ id:'alcohol_late'"),
                            app.indexOf("{ id:'alcohol_late'") + 1200);
r.ok(/< 180/.test(bloqueAlc), 'tres horas para el alcohol');
r.ok(/Ebrahim 2013/.test(bloqueAlc), 'con la suya');

r.seccion('Sin la hora cargada, el factor no inventa:');

// Las noches viejas —las 90 fichas que ya existen— no tienen la columna.
const viejas = ns.map(function (e) {
  const c = Object.assign({}, e); delete c.last_caffeine_time; return c;
});
ctx._viejas = viejas;
const R2 = vm.runInContext('computeHabitsImpact(_viejas)', ctx);
const ids2 = (R2.habitos || []).map(function (h) { return h.id; });
r.ok(ids2.indexOf('caffeine_late') < 0,
     'sin el dato, el factor no aparece — no se asume "temprano"');

r.seccion('Y el margen se calcula contra la hora de acostarse:');

const margen = app.slice(app.indexOf('function dmMargenHastaCama'),
                         app.indexOf('function dmMargenHastaCama') + 700);
r.ok(/if\(d < 0\) d \+= 1440/.test(margen),
     'un café a las 21:30 y una cama a las 00:30 son 3 h, no −21');
r.ok(/18\*60/.test(margen),
     'y por encima de 18 h se descarta: es una hora mal cargada, no una medición');

// Caso que importa: acostarse después de medianoche.
ctx._cruce = [{ bedtime: '00:30', last_caffeine_time: '21:30' }];
const m = vm.runInContext("dmMargenHastaCama(_cruce[0],'last_caffeine_time')", ctx);
r.ok(m === 180, 'medido: 180 minutos', m + ' min');

r.cerrar('Un café a las 8 y uno a las 21 no son el mismo dato.');
