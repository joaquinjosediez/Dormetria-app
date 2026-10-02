// Tres botones de la barra del profesional "no funcionaban": TCC-I, Mi perfil
// y Directorio. Lo primero que hay que decir es que no se pudo reproducir en
// un DOM real — las seis pestañas navegan bien cuando se las clickea.
//
// Y eso es parte del problema. Los botones son `onclick=` en línea: si la
// función tira una excepción, el navegador no muestra NADA. No hay error, no
// hay rastro, no hay forma de saber cuál de los tres falló. Eso se siente
// exactamente igual que "el botón está muerto".
//
// Así que se arregló lo que SÍ se puede arreglar sin reproducirlo:
//   · un solo camino para las seis pestañas, en vez de tres distintos
//   · la excepción se ve, en consola y en un toast
//   · y se comprueba que la pantalla haya cambiado de verdad

const C = require('./comun');
const fs = require('fs');
const path = require('path');
const r = C.crearReporte('Ningún botón falla en silencio');

const app = C.leerApp();

r.seccion('Un solo camino para todas las pestañas:');

r.ok(/const DM_PANTALLA_DE_TAB = \{/.test(app),
     'hay un mapa pestaña → pantalla');
const mapa = app.slice(app.indexOf('const DM_PANTALLA_DE_TAB'),
                       app.indexOf('function dmTopbarGo(tab){'));
['patients', 'alerts', 'metrics', 'profile', 'more', 'dir', 'admin'].forEach(function (t) {
  r.ok(new RegExp(t + ':').test(mapa), t);
});
// Antes el Directorio llamaba showConsultDir() directo desde el onclick y
// Admin llamaba showAdminPanel(): dos caminos que no pasaban por ningún
// manejo de error.
// Se mira SOLO el armado de la barra: showConsultDir se sigue llamando
// directo desde las pantallas del paciente ("Mi especialista"), que no tienen
// barra ni la necesitan.
const barra = app.slice(app.indexOf('function dmBuildDoctorTopbar(){'),
                        app.indexOf('function dmTopbarGo(tab){'));
r.ok(!/dr-tb-tab[^']*onclick="showConsultDir/.test(barra),
     'el Directorio ya no entra por su propia puerta');
r.ok(!/dr-tb-tab[^']*onclick="showAdminPanel/.test(barra),
     'ni Admin');
r.ok((barra.match(/dmTopbarGo\(/g) || []).length >= 6,
     'las pestañas de la barra pasan todas por dmTopbarGo',
     (barra.match(/dmTopbarGo\(/g) || []).length + ' botones');

r.seccion('La excepción se ve:');

const fn = app.slice(app.indexOf('function dmTopbarGo(tab){'),
                     app.indexOf('function dmTopbarToggleMenu'));
r.ok(/\}catch\(e\)\{/.test(fn), 'hay un catch…');
r.ok(/console\.error\('\[NAV\] '\+tab, e\)/.test(fn), '…que registra cuál pestaña falló…');
r.ok(/toast\('Error al abrir: '/.test(fn), '…y se lo dice a quien apretó');

r.seccion('Y se comprueba que la pantalla haya cambiado:');

r.ok(/no llegó a/.test(fn), 'si no llegó, lo dice');
// Sin esto, cambiar de pestaña rápido dispararía una alarma falsa: el chequeo
// corre 700 ms después y para entonces el usuario ya está en otro lado.
r.ok(/if\(_id !== _antes\) return;/.test(fn),
     'y no grita si el usuario ya se fue a otra parte por su cuenta');

r.seccion('DM_CODIGOS_DEMO vuelve al nivel superior:');

// Estaba declarada DENTRO de la rama 'patients' de showDrTab_. Como
// dmSembrarDemos se llama desde otros caminos, el const todavía no se había
// inicializado: "Cannot access DM_CODIGOS_DEMO before initialization", que
// el catch se tragaba. La siembra no corría salvo que el profesional hubiera
// abierto antes la pestaña Pacientes.
const bloque = app.slice(app.indexOf('const SU='));
const iConst = bloque.indexOf("const DM_CODIGOS_DEMO = [");
const iShowDrTab = bloque.indexOf('function showDrTab(tab,el){');
r.ok(iConst >= 0 && iConst < iShowDrTab,
     'queda declarada antes de showDrTab, fuera de cualquier rama');
r.ok((app.match(/const DM_CODIGOS_DEMO = \[/g) || []).length === 1,
     'y una sola vez');

r.seccion('Las seis pestañas navegan, con la ficha de un paciente abierta:');

// El peor caso: entrar a cada pestaña desde screen-doctor-patient, que es
// donde uno está durante una demostración.
const { JSDOM } = require('jsdom');
const raiz = path.join(__dirname, '..');
let html = fs.readFileSync(path.join(raiz, 'index.html'), 'utf8')
  .replace(/<script src="https:\/\/[^"]*"[^>]*><\/script>/g, '');
const dom = new JSDOM(html, { runScripts: 'dangerously', url: 'https://app.dormetria.com/',
  beforeParse(w) {
    w.fetch = () => Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve([]), text: () => Promise.resolve('[]') });
    w.supabase = { createClient: () => ({ auth: { getSession: () => Promise.resolve({ data: {} }), onAuthStateChange() {}, signOut: () => Promise.resolve({}) }, rpc: () => Promise.resolve({ data: [] }), from: () => ({ select: () => Promise.resolve({ data: [] }) }) }) };
    w.Chart = function () { return { destroy() {}, update() {}, resize() {} }; };
    w.scrollTo = () => {};
  } });
['sleep-metrics', 'motor-orientacion', 'summary-nuevo', 'render-resumen', 'tcci'].forEach(function (m) {
  try { dom.window.eval(fs.readFileSync(path.join(raiz, 'js', 'dormetria-' + m + '.js'), 'utf8')); } catch (_) {}
});
const w = dom.window;
setTimeout(function () {
  try {
    w.eval("S.role='doctor'; S.user={email:'demo@dormetria.com',name:'Demo'};");
    w.dmBuildDoctorTopbar();
    const esperado = { patients: 'doctor-home', alerts: 'doctor-home', metrics: 'doctor-home',
                       more: 'cbti-list', profile: 'doctor-home', dir: 'consult' };
    Object.keys(esperado).forEach(function (t) {
      w.showScreen('doctor-patient');
      const b = w.document.querySelector('#dr-topbar-desktop .dr-tb-tab[data-tab="' + t + '"]');
      if (!b) { r.ok(false, 'existe el botón ' + t); return; }
      b.click();
      const a = w.document.querySelector('.screen.active');
      const id = a ? a.id.replace('screen-', '') : '(ninguna)';
      r.ok(id === esperado[t], t + ' → ' + esperado[t], id);
    });
  } catch (e) {
    r.ok(false, 'la barra se pudo construir y usar', e.message);
  }
  try { w.close(); } catch (_) {}
  r.cerrar('Un botón que no hace nada y no dice nada es el peor de los dos mundos.');
}, 900);
