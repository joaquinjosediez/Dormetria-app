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
const css47 = C.leerCss();

r.seccion('Regla 1 — el color solo se usa cuando hay algo que afirmar:');

r.ok(/soloNetos && e\.signo===0/.test(fn),
     'se prefiere el efecto que pasó umbral clínico Y p<0,05');
r.ok(/f\.lo<=0 && f\.hi>=0/.test(fn),
     'pero además, si el IC toca el cero, no se afirma nada');
r.ok(/GRIS/.test(fn),
     'esa fila va en gris — el color es una afirmación');
r.ok(/es un resultado/.test(fn),
     'y la fila se dibuja igual: "lo miramos y cruza el cero" es información');

r.seccion('Regla 2 — el eje es el tamaño del efecto, no minutos ni %:');

// El primer intento usaba cambio porcentual y reventaba con las variables
// de base chica: pasar de 1 a 2 despertares es "+100 %" y se come el eje,
// mientras que 40 minutos menos sobre 440 queda pegado al cero.
r.ok(/d de Cohen/.test(fn),
     'se usa d, que es adimensional y compara peras con peras');
r.ok(/0,2 chico · 0,5 medio · 0,8 grande/.test(fn),
     'con las anclas de interpretación a la vista');
r.ok(/const TOPE = 2/.test(fn),
     'y con tope: un efecto enorme no puede aplastar al resto contra el cero');
r.ok(/dm-aguja-corte/.test(fn),
     'lo que se sale del eje se marca, en vez de fingir que termina en el borde');

r.seccion('El eje está orientado: la derecha siempre es mejor sueño');

r.ok(/dirGood \|\| 1/.test(fn),
     'se multiplica por dirGood, así "+37 min de latencia" cae a la izquierda');
r.ok(/peor sueño/.test(fn) && /mejor sueño/.test(fn),
     'y los extremos están rotulados');

r.seccion('La media y su intervalo, como pidió:');

r.ok(/dm-aguja-media/.test(fn) && /dm-aguja-ic/.test(fn),
     'se dibujan las dos cosas');
r.ok(/CI_dif \/ sp|v\/sp\)\*g/.test(fn),
     'el IC de la d sale del IC de la diferencia sobre la misma desviación combinada');
r.ok(/\.dm-aguja-ic\{[^}]*opacity:\.28/.test(css47.replace(/\s+/g, '')) ||
     /opacity:\.28/.test(css47.slice(css47.indexOf('.dm-aguja-ic{'), css47.indexOf('.dm-aguja-ic{') + 300)),
     'el intervalo va más sombreado que el centro');

r.seccion('Regla 3 — no se afirma causalidad:');

r.ok(/no para concluir\s*'\+\s*'causalidad|concluir causalidad|no para concluir/i.test(fn),
     'el pie lo dice explícitamente');
r.ok(/t de Welch/.test(fn), 'y nombra la prueba que se usó');
r.ok(/noches/.test(fn), 'cada fila muestra sobre cuántas noches se calculó');

r.seccion('El veredicto no depende del color:');

// Un panel que solo distingue por rojo/verde no lo puede leer una de cada
// doce personas con daltonismo — y encima "↓ Latencia +37 min" mezclaba
// dos direcciones en la misma línea.
r.ok(/f\.signo>0\?'mejor':'peor'/.test(fn),
     'dice "mejor" o "peor" en palabra');
r.ok(/sin diferencia concluyente/.test(fn),
     'y cuando el intervalo toca el cero, lo dice así — no "sin efecto"');

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
  // Con ruido: sin varianza, Welch toma el camino de separación perfecta
  // y el intervalo queda degenerado. Datos así no existen.
  let semilla = 7;
  const rnd = () => { semilla = (semilla * 1103515245 + 12345) % 2147483648; return semilla / 2147483648; };
  const ns = [];
  for (let k = 0; k < 40; k++) {
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
  ctx._nsPrueba = ns;
  let html = '';
  try { html = vm.runInContext('dmAgujaHtml(_nsPrueba)', ctx); } catch (e) { html = 'ERROR ' + e.message; }
  r.ok(/dm-aguja-fila/.test(html), 'con datos sintéticos dibuja al menos una fila');
  r.ok(/peor/.test(html), 'y con cafeína que empeora el sueño, lo llama "peor"');
  r.ok(/d=−/.test(html), 'con la d orientada en negativo (peor sueño)');
  r.ok(/IC95%/.test(html), 'y su intervalo de confianza');
  r.ok(/#b91c1c/.test(html), 'en rojo');
}

r.cerrar('Lo que hay que leer en cuatro tablas tiene que verse de un vistazo.');
