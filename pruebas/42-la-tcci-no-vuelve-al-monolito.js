// index.html cambió en 30 de las últimas 30 versiones. Cada publicación
// hace que cada paciente vuelva a bajar 634 KB comprimidos, aunque lo que
// cambió no tenga nada que ver con lo que usa.
//
// La TCC-I salió a su propio archivo. Esta prueba existe para que no
// vuelva de a poco — que es exactamente lo que pasó con la promesa de
// "modularizar por goteo": desde mod189, el 91% del código nuevo terminó
// igual en el monolito.

const C = require('./comun');
const fs = require('fs');
const path = require('path');
const r = C.crearReporte('La TCC-I no vuelve al monolito');

const html = C.leerHtml();
const mods = C.rutasModulos().map(p => path.basename(p));

r.seccion('El módulo existe y está enganchado:');

r.ok(mods.indexOf('dormetria-tcci.js') >= 0,
     'index.html carga js/dormetria-tcci.js');
r.ok(/dormetria-tcci\.js\?v=[a-z]+\d+-[0-9a-f]{8}/.test(html),
     'con hash de contenido, para que se re-descargue solo cuando cambia');

const mod = fs.readFileSync(path.join(C.RAIZ, 'js', 'dormetria-tcci.js'), 'utf8');

r.seccion('Y el código de TCC-I vive ahí, no en el index:');

// Se mira SOLO el <script> inline del index: los onclick del HTML pueden
// (y deben) seguir nombrando funciones del módulo.
const inline = C.bloques().slice(C.rutasModulos().length).join('\n');
const declara = (txt, n) =>
  new RegExp('^\\s*(?:async\\s+)?function\\s+' + n + '\\s*\\(|^(?:const|let|var)\\s+' + n + '\\s*=', 'm').test(txt);

['dmTcciRenderPrograma', 'dmTcciAbrirSemana', 'openPatientCbtiView', 'openCbtiModule',
 'dmAdminTcci', 'dmTcciHojaEncuesta', 'dmTcciSincronizarEstado',
 'DM_TCCI_PROGRAMA', 'CBTI_PROTOCOL', 'CBTI_PATIENT_CONTENT'].forEach(function (n) {
  r.ok(declara(mod, n) && !declara(inline, n), n + ' está solo en el módulo');
});

r.seccion('Nada quedó definido dos veces:');

const nombres = txt => {
  const out = new Set();
  const re = /^\s*(?:async\s+)?function\s+([A-Za-z0-9_$]+)|^(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=/gm;
  let m; while ((m = re.exec(txt))) out.add(m[1] || m[2]);
  return out;
};
const dup = [...nombres(mod)].filter(n => nombres(inline).has(n));
r.ok(dup.length === 0,
     'ninguna definición duplicada entre el módulo y el index' +
     (dup.length ? ' — repetidas: ' + dup.slice(0, 6).join(', ') : ''));

r.seccion('Lo compartido se quedó donde estaba:');

// Estas las usan también el diario y el panel profesional. Mudarlas
// hubiera sido mudar media app.
['computeSleepWindow', 'dmComputeWindowFor', 'dmGetWindowOverride',
 'dmWindowDuration', 'dmMinsToHHMM'].forEach(function (n) {
  r.ok(declara(inline, n) && !declara(mod, n),
       n + ' sigue en index.html, que es donde la usan los demás');
});

r.seccion('Y la app entera sigue arrancando:');

const ctx = C.appEvaluada({ silencioso: true });
r.ok(!!ctx, 'el index y sus cinco módulos se evalúan de punta a punta');
if (ctx) {
  // Las diez que el resto de la app llama de verdad.
  ['openCbtiModule', 'openPatientCbtiView', 'dmAdminTcci', 'dmCbtiVerPrograma',
   'toggleCbtiItem', 'saveCbtiNote', 'confirmDeactivateCbti',
   'renderCbtiWindowPanel', 'dmTcciTieneAcceso', 'checkPatientTcciCard']
    .forEach(function (n) {
      r.ok(typeof ctx[n] === 'function', n + '() queda global');
    });
}

r.cerrar('Un archivo que cambia siempre obliga a todos a bajarlo todo, siempre.');
