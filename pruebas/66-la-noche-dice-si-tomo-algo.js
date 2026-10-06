// Al tocar una noche en el actograma, el globo decía cuánto durmió, cuánto
// tardó y cuántas veces se despertó. Faltaba lo primero que se pregunta
// mirando una noche mala: si tomó algo y qué.
//
// El dato estaba guardado desde siempre —columna `medications` del diario—;
// había que abrir el registro entero para verlo, que es justo lo que el globo
// existe para evitar.
//
// Lo mismo con la cafeína y el alcohol de esa noche, ahora que además se
// guarda la HORA de la última (mod244): "200 mg · 21:30" en una noche de 70
// minutos de latencia es la explicación, y estaba a tres clics.

const fs = require('fs');
const path = require('path');
const C = require('./comun');
const r = C.crearReporte('La noche dice si tomó algo');

const app = C.leerApp();

r.seccion('Qué se agregó al globo:');

const fn = app.slice(app.indexOf('function dmVerNotaNoche(e, ev){'),
                     app.indexOf('function dmChartCuandoMida'));
r.ok(/_dato\('Medicación', _medTxt\)/.test(fn), 'la medicación');
r.ok(/m\.name \|\| m\.nombre/.test(fn), 'con el nombre de cada fármaco…');
r.ok(/m\.dose \|\| m\.dosis/.test(fn), '…y la dosis si está cargada');
r.ok(/_dato\('Cafeína'/.test(fn) && /_dato\('Alcohol'/.test(fn),
     'y las sustancias de esa noche');
r.ok(/last_caffeine_time/.test(fn) && /last_alcohol_time/.test(fn),
     'con la hora de la última, que es lo que decide si llega a la cama');

r.seccion('"No tomé nada" no es lo mismo que "no cargué el dato":');

r.ok(/_medTxt = 'ninguno'/.test(fn),
     'si cargó la lista vacía, se dice "ninguno"');
r.ok(/\(_medTxt \? _dato\('Medicación', _medTxt\) : ''\)/.test(fn),
     'y si nunca cargó nada, la fila no aparece: un guión sería afirmar de más');
// Una lista de ceros llena el globo y no dice nada. El comentario original de
// esta función ya advertía que el exceso de números hace que no se lea ninguno.
r.ok(/_caf > 0/.test(fn) && /_alc > 0/.test(fn),
     'cafeína y alcohol solo si hubo');

r.seccion('Y se dibuja de verdad, con datos:');

const { JSDOM } = require('jsdom');
const raiz = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(raiz, 'index.html'), 'utf8')
  .replace(/<script src="https:\/\/[^"]*"[^>]*><\/script>/g, '');
const dom = new JSDOM(html, { runScripts: 'dangerously', url: 'https://app.dormetria.com/',
  beforeParse(w) {
    w.fetch = () => Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve([]), text: () => Promise.resolve('[]') });
    w.supabase = { createClient: () => ({ auth: { getSession: () => Promise.resolve({ data: {} }), onAuthStateChange() {}, signOut: () => Promise.resolve({}) }, rpc: () => Promise.resolve({ data: [] }), from: () => ({ select: () => Promise.resolve({ data: [] }) }) }) };
    w.Chart = function () { return { destroy() {}, update() {}, resize() {} }; };
    w.scrollTo = () => {};
  } });
const w = dom.window;
setTimeout(function () {
  const globo = function (e) {
    const v = w.document.getElementById('dm-nota-noche');
    if (v) v.remove();
    try { w.dmVerNotaNoche(e, { clientX: 100, clientY: 100 }); } catch (_) {}
    const g = w.document.getElementById('dm-nota-noche');
    return g ? (g.textContent || '').replace(/\s+/g, ' ').trim() : '';
  };

  const conMeds = globo({
    diary_date: '2026-09-30', sleep_minutes: 420, sleep_latency_mins: 70, awakenings: 1,
    medications: [{ name: 'Zolpidem', dose: '10 mg' }, { name: 'Quetiapina', dose: '25 mg' }],
    coffee_cups: 200, last_caffeine_time: '21:30',
    alcohol_drinks: 2, last_alcohol_time: '22:10'
  });
  r.ok(/2 fármacos/.test(conMeds), 'dice cuántos', conMeds.slice(0, 80));
  r.ok(/Zolpidem/.test(conMeds) && /10 mg/.test(conMeds), 'y cuáles, con la dosis');
  r.ok(/Quetiapina/.test(conMeds), 'los dos, no solo el primero');
  r.ok(/200 mg/.test(conMeds) && /21:30/.test(conMeds), 'la cafeína con su hora');
  r.ok(/2 UA/.test(conMeds) && /22:10/.test(conMeds), 'y el alcohol');

  // El diario a veces guarda la columna como texto JSON.
  const texto = globo({ diary_date: '2026-09-30', sleep_minutes: 400,
                        medications: '[{"name":"Trazodona","dose":"50 mg"}]' });
  r.ok(/Trazodona/.test(texto), 'funciona aunque venga como texto JSON');

  const ninguno = globo({ diary_date: '2026-09-30', sleep_minutes: 400, medications: [] });
  r.ok(/ninguno/.test(ninguno), 'con la lista vacía dice "ninguno"');

  const sinDato = globo({ diary_date: '2026-09-30', sleep_minutes: 400 });
  r.ok(!/Medicación/.test(sinDato), 'y sin el dato no inventa la fila');
  r.ok(!/Cafeína/.test(sinDato) && !/Alcohol/.test(sinDato),
       'ni llena el globo con ceros');

  try { w.close(); } catch (_) {}
  r.cerrar('Si hay que abrir el registro entero para saber si tomó algo, el globo no sirve.');
}, 900);
