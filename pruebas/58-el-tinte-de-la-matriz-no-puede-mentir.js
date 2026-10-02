// Pintar el fondo de las celdas acelera la lectura: el ojo va directo a lo
// que tiene color. Por eso mismo es la clase de ayuda visual que, mal hecha,
// convierte una tabla exploratoria en una conclusión.
//
// En esta matriz se comparan hasta seis factores por cuatro variables: con 24
// comparaciones, algún p<0,05 aislado es esperable por azar. Y un p<0,05 con
// 2 minutos de diferencia no es el mismo hallazgo que uno con 40.
//
// De ahí los tres tramos, y de ahí que el de la tendencia tenga que ser
// visiblemente MÁS DÉBIL que los otros dos:
//
//   t3  p<0,05 Y supera el umbral clínico   → hallazgo
//   t2  p<0,05, diferencia chica            → existe, no mueve nada
//   t1  0,05 ≤ p < 0,10                     → tendencia, NO es un hallazgo

const C = require('./comun');
const vm = require('vm');
const r = C.crearReporte('El tinte de la matriz no puede mentir');

const app = C.leerApp();
const css = C.leerCss();
const ctx = C.appEvaluada({ silencioso: true });
r.ok(!!ctx, 'la app arranca');

// ── Un set por tramo, construido para caer donde tiene que caer ───────
// Nada de ruido aleatorio: los valores son deterministas para que la p
// quede donde se busca y la prueba no dependa de la semilla.
const off = [-45, -35, -25, -15, -5, 5, 15, 25, 35, 45];   // media 0
const armar = function (difTst, difLat, ruido) {
  const ns = [];
  for (let k = 0; k < 40; k++) {
    const ej = k % 2 === 0;
    const o = off[Math.floor(k / 2) % 10];
    ns.push({
      diary_date: new Date(2026, 3, 1 + k).toISOString().slice(0, 10),
      bedtime: '23:30', wake_time: '07:30',
      sleep_minutes: 440 + (ej ? difTst : 0) + Math.round(o * ruido),
      sleep_latency_mins: 28 - (ej ? difLat : 0) + Math.round(o * 0.08),
      awakenings: 1, sleep_quality: 3, day_type: 'work',
      exercise_mins: ej ? 40 : 0, screen_minutes: 10, coffee_cups: 0
    });
  }
  return ns;
};
const tintes = function (ns) {
  ctx._mz = ns;
  const h = vm.runInContext('renderHabitsImpactHtml(_mz)', ctx);
  return (h.match(/class="dm-mtz-c ([^"]*)"/g) || [])
    .map(function (c) { return c.replace('class="dm-mtz-c ', '').replace('"', ''); });
};
const pDe = function (ns, id) {
  ctx._mz2 = ns;
  const R = vm.runInContext('computeHabitsImpact(_mz2)', ctx);
  let out = null;
  (R.habitos || []).forEach(function (h) {
    (h.efectos || []).forEach(function (e) { if (e.id === id) out = e; });
  });
  return out;
};

r.seccion('Tramo fuerte: p<0,05 y diferencia que importa');

const fuerte = armar(60, 0, 0.7);
const eF = pDe(fuerte, 'tst');
r.ok(eF && eF.p < 0.05 && eF.relevante,
     'el caso está bien armado',
     eF ? ('dif ' + eF.diff.toFixed(0) + ' min · p=' + eF.p.toFixed(4)) : '—');
r.ok(tintes(fuerte).some(function (t) { return /t3 pos/.test(t); }),
     'pinta verde fuerte');

r.seccion('Tramo medio: p<0,05 pero la diferencia es chica');

// 7 minutos de sueño total: por debajo del umbral clínico de 15.
const medio = armar(7, 0, 0.18);
const eM = pDe(medio, 'tst');
r.ok(eM && eM.p < 0.05 && !eM.relevante,
     'significativo pero clínicamente irrelevante',
     eM ? ('dif ' + eM.diff.toFixed(0) + ' min · p=' + eM.p.toFixed(4)) : '—');
r.ok(tintes(medio).some(function (t) { return /t2 pos/.test(t); }),
     'pinta más tenue que el fuerte');
r.ok(!tintes(medio).some(function (t) { return /t3/.test(t); }),
     'y NO como hallazgo: 7 minutos no cambian ninguna conducta');

r.seccion('Tramo de tendencia: 0,05 ≤ p < 0,10');

const tend = armar(18, 0, 1);
const eT = pDe(tend, 'tst');
r.ok(eT && eT.p >= 0.05 && eT.p < 0.10,
     'la p cae en la banda de tendencia',
     eT ? ('dif ' + eT.diff.toFixed(0) + ' min · p=' + eT.p.toFixed(4)) : '—');
r.ok(eT && eT.signo === 0,
     'y el efecto NO se marca como neto, aunque la diferencia sea grande');
r.ok(tintes(tend).some(function (t) { return /t1 pos/.test(t); }),
     'pinta, pero en el tramo más débil');

r.seccion('Por encima de 0,10 no se pinta nada:');

const nada = armar(18, 0, 2.6);
const eN = pDe(nada, 'tst');
r.ok(eN && eN.p >= 0.10, 'el caso está armado', eN ? ('p=' + eN.p.toFixed(3)) : '—');
r.ok(!tintes(nada).some(function (t) { return /t[123]/.test(t); }),
     'sin tinte: "no se puede afirmar" también es un resultado');

r.seccion('Las tres intensidades son distintas y en ese orden:');

const reglas = C.reglasDe(css);
const alfa = function (sel) {
  const rg = reglas.filter(function (x) { return x.sel === '.dm-mtz-c.' + sel + '.pos'; })[0];
  if (!rg) return null;
  const m = rg.cuerpo.match(/rgba\(21,\s*128,\s*61,\s*([.\d]+)\)/);
  return m ? parseFloat(m[1]) : null;
};
const a1 = alfa('t1'), a2 = alfa('t2'), a3 = alfa('t3');
r.ok(a1 != null && a2 != null && a3 != null, 'las tres están definidas');
r.ok(a1 < a2 && a2 < a3,
     'y van de menor a mayor: la tendencia es la más débil',
     a1 + ' < ' + a2 + ' < ' + a3);

r.seccion('El color no es el único canal:');

// Quien no distingue rojo de verde tiene que poder leer la tabla igual.
r.ok(/\.dm-mtz-c\.t3\.pos\{[^}]*inset 3px 0 0 #15803d/.test(css.replace(/\s+/g, ' ')),
     'el tramo fuerte lleva además un borde al costado');
r.ok(/dm-mtz-leyenda/.test(app), 'y hay leyenda del tinte');
r.ok(/no es un hallazgo/.test(app),
     'que dice explícitamente que la tendencia no es un hallazgo');

r.cerrar('Un fondo de color sin decodificador es una invitación a inventarle un significado.');
