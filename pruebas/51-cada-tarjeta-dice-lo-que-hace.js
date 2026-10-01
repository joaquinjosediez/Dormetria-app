// Había dos tarjetas con nombres casi iguales y contenidos distintos:
//
//   "Hábitos vs. calidad que reporta"  → comparaba los hábitos contra
//      sueño total, latencia y despertares. O sea contra lo MEDIDO.
//      El título decía lo que la tarjeta no hace.
//   "Hábitos y calidad reportada"      → esa sí cruza contra lo percibido.
//
// Y encima el resumen gráfico de la primera vivía en OTRA tarjeta
// ("Pilares del sueño"), a tres tarjetas de distancia del detalle que
// explica.
//
// Es el mismo problema que la prueba 17 ya había intentado evitar entre
// los dos paneles de correlación — y que esa misma prueba terminó
// fijando, porque asertaba el título equivocado.

const C = require('./comun');
const r = C.crearReporte('Cada tarjeta dice lo que hace');

const app = C.leerApp();
const ctx = C.appEvaluada({ silencioso: true });
r.ok(!!ctx, 'la app arranca');
const vm = require('vm');

r.seccion('El título dice contra qué compara:');

r.ok(/Hábitos vs\. métricas clínicas/.test(app),
     'la tarjeta que cruza contra lo medido lo dice');
r.ok(!/Hábitos vs\. calidad que reporta/.test(app),
     'y no queda rastro del nombre que decía lo contrario');
r.ok(/sobre lo MEDIDO/.test(app),
     'el subtítulo nombra las variables: sueño total, latencia, despertares');
r.ok(/es otra\s*'\+\s*'tarjeta, la de la derecha|es otra/.test(app),
     'y señala cuál es la otra, para que no se confundan');

r.seccion('El resumen gráfico está junto al detalle que explica:');

let h = '';
try {
  let semilla = 7;
  const rnd = () => { semilla = (semilla * 1103515245 + 12345) % 2147483648; return semilla / 2147483648; };
  const ns = [];
  for (let k = 0; k < 44; k++) {
    const caf = k % 2 === 0;
    const d = new Date(2026, 7, 1 + k);
    ns.push({
      diary_date: d.toISOString().slice(0, 10), bedtime: '23:30', wake_time: '07:00',
      sleep_minutes: Math.round((caf ? 400 : 440) + rnd() * 50 - 25),
      sleep_latency_mins: Math.round((caf ? 38 : 22) + rnd() * 18 - 9),
      awakenings: Math.round((caf ? 1.8 : 1.1) + rnd() * 1.4 - 0.7),
      sleep_quality: Math.round((caf ? 3 : 4) + rnd() * 1.6 - 0.8),
      coffee_cups: caf ? 300 : 0, alcohol_drinks: 0, exercise_mins: 0, screen_minutes: 0,
      day_type: (d.getDay() === 0 || d.getDay() === 6) ? 'free' : 'work'
    });
  }
  ctx._nsT = ns;
  h = vm.runInContext('renderHabitsImpactHtml(_nsT)', ctx);
} catch (e) { h = 'ERROR ' + e.message; }

r.ok(/dm-aguja-fila/.test(h), 'el forest plot se dibuja dentro de esa tarjeta');
r.ok(/El detalle, factor por factor/.test(h), 'con el detalle debajo');
r.ok(h.indexOf('dm-aguja') < h.indexOf('El detalle, factor por factor'),
     'y en ese orden: primero el resumen, después la tabla');
r.ok(!/id="dr-aguja"/.test(app),
     'ya no cuelga de la tarjeta de pilares, donde estaba huérfano');

r.seccion('La concordancia se junta con lo que se lee al lado:');

r.ok(/Lo que reporta vs\. lo que se mide/.test(app),
     'la tarjeta de la derecha cubre los dos cruces contra lo percibido');
const i = app.indexOf('Lo que reporta vs. lo que se mide');
const caja = app.slice(i, i + 900);
r.ok(/dr-quality-concord/.test(caja) && /dr-quality-factores/.test(caja),
     'y contiene la concordancia Y los factores, que antes estaban separados');

r.seccion('La división peor/mejor se ve:');

r.ok(/class="peor"/.test(h) && /class="mejor"/.test(h),
     'los dos extremos están rotulados y coloreados');
const css = C.leerCss();
r.ok(/\.dm-aguja-escala i\.peor\s*\{\s*color:#b91c1c/.test(css.replace(/\s+/g, ' ')) ||
     /i\.peor \{ color:#b91c1c/.test(css),
     'peor en rojo');
r.ok(/linear-gradient\(90deg,\s*\n?\s*rgba\(185,28,28/.test(css),
     'y las dos mitades del eje están teñidas, no solo el texto');

r.cerrar('Dos tarjetas con nombres casi iguales y contenidos distintos no se leen: se adivinan.');
