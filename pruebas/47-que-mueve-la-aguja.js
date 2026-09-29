// El gráfico de líneas de los pilares tenía cinco series superpuestas en
// un rango de 20 a 80 por ciento, con suavizado de ±3 días. Es de lectura
// técnica y en la práctica nadie lo miraba — y encima empujaba abajo de
// todo el análisis de factores, que con t de Welch y umbral clínico es lo
// mejor que tiene esa pestaña.
//
// "Qué mueve la aguja" es la misma información, como titular.
//
// Un panel así es fácil de volver deshonesto: alcanza con dibujar barras
// para todo, o con escalarlas por el efecto absoluto. Esta prueba fija las
// tres reglas que lo evitan.

const C = require('./comun');
const r = C.crearReporte('Qué mueve la aguja');

const app = C.leerApp();
const i = app.indexOf('function dmAgujaHtml(entries){');
r.ok(i > 0, 'existe el panel');
const fn = app.slice(i, app.indexOf('// La calidad percibida, cruzada con TODAS', i));

r.seccion('Regla 1 — solo se dibuja lo que pasó los dos filtros:');

r.ok(/e\.signo!==0/.test(fn),
     'la barra sale de signo, que ya exige umbral clínico Y p<0,05');
r.ok(/sin diferencia relevante/.test(fn),
     'lo que no llegó se dice, no se esconde: "no encontramos nada" es un resultado');
r.ok(/nula/.test(fn),
     'y va en gris, sin barra');

r.seccion('Regla 2 — el largo es el efecto RELATIVO:');

r.ok(/Math\.abs\(e\.diff\)\/base/.test(fn),
     '15 min sobre una latencia de 20 no es lo mismo que 15 sobre 120');
r.ok(/maxRel/.test(fn), 'y se escala contra el mayor, no contra un absoluto inventado');

r.seccion('Regla 3 — no se afirma causalidad:');

r.ok(/no causalidad|no es un ensayo|asociación dentro del mismo paciente/i.test(fn),
     'el pie lo dice explícitamente');
r.ok(/t de Welch/.test(fn), 'y nombra la prueba que se usó');
r.ok(/noches/.test(fn), 'cada fila muestra sobre cuántas noches se calculó');

r.seccion('El veredicto no depende del color:');

// Un panel que solo distingue por rojo/verde no lo puede leer una de cada
// doce personas con daltonismo — y encima "↓ Latencia +37 min" mezclaba
// dos direcciones en la misma línea.
r.ok(/mejor'\s*:\s*'peor'|\(mejor\?'mejor':'peor'\)/.test(fn),
     'dice "mejor" o "peor" en palabra');
r.ok(!/'↑ '/.test(fn),
     'y ya no usa la flecha, que contradecía el signo del número');

r.seccion('Los avisos de la tabla de abajo no se pierden:');

r.ok(/preliminar/.test(fn),   'se marca lo preliminar');
r.ok(/fisiológico/.test(fn),  'y los factores fisiológicos');

r.seccion('El gráfico viejo queda, plegado:');

r.ok(/Ver la evolución de los tres pilares noche a noche/.test(app),
     'quien lo quiera lo tiene');
r.ok(/id="dr-pillar-chart"/.test(app),
     'el canvas sigue existiendo — sacarlo rompería el resto del render');

r.seccion('Y se dibuja de verdad:');

const ctx = C.appEvaluada({ silencioso: true });
r.ok(!!ctx, 'la app arranca');
if (ctx) {
  const vm = require('vm');
  // Noches donde la cafeína empeora el sueño, con efecto grande y claro.
  const ns = [];
  for (let k = 0; k < 40; k++) {
    const caf = k % 2 === 0;
    const d = new Date(2026, 7, 1 + k);
    ns.push({
      diary_date: d.toISOString().slice(0, 10), bedtime: '23:30', wake_time: '07:00',
      sleep_minutes: caf ? 380 : 445, sleep_latency_mins: caf ? 55 : 18,
      awakenings: caf ? 2 : 1, sleep_quality: caf ? 2 : 4,
      coffee_cups: caf ? 300 : 0, alcohol_drinks: 0, exercise_mins: 0, screen_minutes: 0,
      day_type: (d.getDay() === 0 || d.getDay() === 6) ? 'free' : 'work'
    });
  }
  ctx._nsPrueba = ns;
  let html = '';
  try { html = vm.runInContext('dmAgujaHtml(_nsPrueba)', ctx); } catch (e) { html = 'ERROR ' + e.message; }
  r.ok(/dm-aguja-fila/.test(html), 'con datos sintéticos dibuja al menos una fila');
  r.ok(/peor/.test(html), 'y con cafeína que empeora el sueño, lo llama "peor"');
  r.ok(/#b91c1c/.test(html), 'en rojo');
}

r.cerrar('Lo que hay que leer en cuatro tablas tiene que verse de un vistazo.');
