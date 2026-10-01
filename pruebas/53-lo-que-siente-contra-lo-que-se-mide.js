// En "Lo que reporta vs. lo que se mide" quedaba un hueco blanco: el
// cruce entre la calidad percibida y las mediciones era un PÁRRAFO con
// tres correlaciones y sus intervalos metidos en una oración larga.
// Nadie la leía, y cuando no alcanzaban las noches no se escribía nada.
//
// Es la pregunta que más orienta la conducta en un insomnio: si lo que la
// persona SIENTE a la mañana no acompaña a nada de lo que se mide, el
// trabajo es cognitivo y no conductual. Un párrafo no deja comparar las
// cuatro asociaciones entre sí; un forest plot sí.

const C = require('./comun');
const r = C.crearReporte('Lo que siente contra lo que se mide');

const app = C.leerApp();
const ctx = C.appEvaluada({ silencioso: true });
r.ok(!!ctx, 'la app arranca');
const vm = require('vm');

// Noches donde la calidad SÍ acompaña a las horas dormidas.
let semilla = 5;
const rnd = () => { semilla = (semilla * 1103515245 + 12345) % 2147483648; return semilla / 2147483648; };
const ns = [];
for (let k = 0; k < 40; k++) {
  const h = 6 + rnd() * 3;
  ns.push({
    diary_date: new Date(2026, 7, 1 + k).toISOString().slice(0, 10),
    bedtime: '23:30', wake_time: '07:30',
    sleep_minutes: Math.round(h * 60),
    sleep_latency_mins: Math.round(15 + rnd() * 60),
    awakenings: Math.round(rnd() * 2),
    sleep_quality: Math.max(1, Math.min(5, Math.round(h - 3.5 + rnd() * 1.2)))
  });
}
ctx._nsC = ns;
const h = vm.runInContext('dmConcordanciaHtml(_nsC)', ctx);

r.seccion('Las cuatro asociaciones, comparables entre sí:');

r.ok((h.match(/dm-aguja-fila/g) || []).length === 4, 'cuatro filas');
['Horas de sueño', 'Eficiencia', 'Latencia', 'Despertares'].forEach(function (v) {
  r.ok(h.indexOf(v) >= 0, v);
});
// La eficiencia no estaba y es la que más mueve en un insomnio.
r.ok(/Eficiencia/.test(h), 'incluida la eficiencia, que antes no se cruzaba');

r.seccion('Con el valor y su intervalo, como el de hábitos:');

r.ok(/r=\+0,8/.test(h) || /r=\+0,[5-9]/.test(h),
     'con datos donde la calidad acompaña a las horas, la r sale alta');
r.ok(/IC95%/.test(h), 'y su IC 95 %');
r.ok(/transformación z de Fisher/.test(app),
     'por la z de Fisher, que es lo que corresponde para una r');

r.seccion('El eje está orientado y no se afirma de más:');

const fn = app.slice(app.indexOf('function dmConcordanciaHtml(entries, campo){'),
                     app.indexOf('// Qué mueve la aguja'));
r.ok(/dir:-1/.test(fn),
     'latencia y despertares van invertidos: tardar MENOS es mejor');
r.ok(/const cruza = \(lo <= 0 && hi >= 0\)/.test(fn),
     'si el intervalo toca el cero, no se afirma');
r.ok(/no se puede afirmar/.test(fn), 'y se dice así');
r.ok(/lo percibe al revés/.test(fn),
     'y si la correlación va en contra, también se nombra — es un hallazgo, no un error');

r.seccion('El eje es fijo de −1 a +1:');

// Una escala que se adapta haría parecer grande a una correlación chica.
r.ok(/Math\.max\(-1, Math\.min\(1, r\)\)/.test(fn),
     'la r vive en ese rango y la escala no se adapta');

r.seccion('Y si NINGUNA se establece, eso es el hallazgo:');

r.ok(/Ninguna asociación llega a establecerse/.test(fn),
     'se dice explícitamente');
r.ok(/trabajo\s*'\+\s*'cognitivo|orienta a trabajo/.test(fn),
     'y qué implica: trabajo cognitivo antes que más ajuste conductual');

r.seccion('Mínimo de noches, como en todo lo demás:');

r.ok(/if\(n < 10\) return null/.test(fn), '10 pares con los dos datos');
const pocas = vm.runInContext('dmConcordanciaHtml(_nsC.slice(0,6))', ctx);
r.ok(pocas === '', 'con 6 noches no devuelve nada en vez de una r de dos pares');

r.cerrar('Si lo que siente no acompaña a nada de lo que se mide, el trabajo es otro.');
