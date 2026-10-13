// "Rever el tamaño de la letra para pacientes añosos con dificultades para
// la visión."
//
// Lo primero que apareció al mirarlo no fue el tamaño: era que la app le
// prohibía agrandar.
//
//     <meta name="viewport" content="...,maximum-scale=1.0">
//
// `maximum-scale=1.0` bloquea el zoom con dos dedos. En iOS, Safari lo ignora
// desde iOS 10 por accesibilidad; Android Chrome lo respeta. O sea: el gesto
// que esa persona usa en todas las demás apps no funcionaba, y fallaba en la
// mitad de los teléfonos y no en el de quien lo probaba.
//
// Lo segundo: la app tiene 2.100 declaraciones de font-size y NINGUNA en rem.
// El ajuste de tamaño de letra que el paciente ya configuró en su teléfono no
// mueve nada acá. Convertirlas una por una es tocar cada pantalla de una app
// clínica en producción para que cambie un número; no vale el riesgo. Se
// escala el contenido con `zoom`, que multiplica todo junto.

const C = require('./comun');
const vm = require('vm');
const r = C.crearReporte('Texto para quien no llega a leer');

const app = C.leerApp();
const css = C.leerCss();

r.seccion('La app ya no prohíbe agrandar:');

const vp = (app.match(/<meta name="viewport" content="([^"]*)"/) || [])[1] || '';
r.ok(vp.indexOf('maximum-scale') < 0, 'no hay maximum-scale', vp);
r.ok(vp.indexOf('user-scalable=no') < 0, 'ni user-scalable=no');
r.ok(/width=device-width/.test(vp), 'y sigue siendo responsive');
r.ok(/Android Chrome lo respeta|solo afectaba a Android/.test(app),
     'y queda escrito por qué el bug no se veía probando en iPhone');

// En Android, fijar text-size-adjust puede ANULAR el ajuste de tamaño de
// letra del sistema, que es justo lo que esta persona ya configuró. Agregarlo
// "por prolijidad" sería el arreglo al revés.
r.ok(!/text-size-adjust\s*:/.test(css) && !/text-size-adjust\s*:/.test(app),
     'y NO se agregó text-size-adjust, que puede anular el ajuste del sistema');
r.ok(/puede anular el ajuste de tamaño de letra del sistema/.test(app),
     'con el motivo escrito, para que nadie lo agregue después');

r.seccion('El escalado va donde no puede romper nada:');

const bloque = css.slice(css.indexOf('TAMAÑO DE LETRA · para quien no llega a leer'),
                         css.indexOf('.dm-esc-sel{'));
r.ok(/\.screen\.active \.scroll,/.test(bloque),
     'sobre el contenedor que ya scrollea');
r.ok(/div\[style\*="overflow-y:auto"\]/.test(bloque),
     'y sobre los que scrollean con estilo en línea, que son cuatro pantallas');
// Acá está todo el riesgo y por eso no se hace: #app mide 100dvh y con zoom
// ocuparía 120dvh de pantalla real. Dentro de un contenedor con overflow,
// que el contenido sea más alto es lo que ese contenedor resuelve.
r.ok(!/body\.dm-esc-g\s*\{/.test(css) && !/html\s*\{[^}]*zoom/.test(css),
     'nunca sobre #app ni sobre html: ahí sí rompería el alto de pantalla');
r.ok(/#app mide 100dvh/.test(bloque),
     'y queda escrito por qué');
// Un texto más grande con el mismo botón alrededor se corta. zoom multiplica
// el padding y el botón junto con la letra.
r.ok(/zoom:1\.22/.test(bloque) && /zoom:1\.45/.test(bloque),
     'dos niveles por encima del normal');

r.seccion('Lo que queda afuera, a propósito:');

r.ok(/#screen-pvt \.scroll[^}]*zoom:1/.test(css.replace(/\s+/g, ' ')),
     'el PVT: es una prueba de tiempo de reacción y el estímulo tiene que medir siempre lo mismo');
r.ok(/body\.dr-desktop[^}]*zoom:1/.test(css.replace(/\s+/g, ' ')),
     'y el panel del profesional, que es una grilla para pantalla grande');

r.seccion('Y de verdad escala lo que tiene que escalar:');

const dom = C.domConCss(
  '<div id="screen-home" class="screen active"><div class="scroll" id="a">x</div></div>' +
  '<div id="screen-edu" class="screen active"><div style="overflow-y:auto" id="c">x</div></div>' +
  '<div id="screen-pvt" class="screen active"><div class="scroll" id="d">x</div></div>' +
  '<div id="screen-doctor-patient" class="screen active"><div class="scroll" id="e">x</div></div>');
const w = dom.window, doc = w.document;
const z = function (id) { return String(w.getComputedStyle(doc.getElementById(id)).zoom || '1'); };

r.ok(z('a') === '1' && z('c') === '1', 'sin elegir nada, nada se escala');
doc.body.classList.add('dm-esc-g');
r.ok(z('a') === '1.22', 'en Grande, el inicio del paciente', z('a'));
r.ok(z('c') === '1.22', 'y las pantallas con overflow en línea', z('c'));
r.ok(z('d') === '1', 'el PVT no', z('d'));
doc.body.classList.remove('dm-esc-g');
doc.body.classList.add('dm-esc-xg');
r.ok(z('a') === '1.45', 'en Más grande, 1,45', z('a'));
doc.body.classList.add('dr-desktop');
r.ok(z('e') === '1' && z('a') === '1', 'y con el panel de escritorio, nada', z('e'));

r.seccion('La preferencia vive en el teléfono, no en la ficha:');

const fn = app.slice(app.indexOf('// ── Tamaño de letra ─'),
                     app.indexOf('function getPfPaths(){'));
r.ok(/localStorage\.setItem\('dm_escala_texto'/.test(fn),
     'se guarda en el dispositivo');
// Esto depende de los ojos Y de la pantalla: la misma persona puede
// necesitarlo grande en el teléfono y normal en la tablet. En la ficha, uno
// pisaría al otro.
r.ok(/depende de los ojos Y de la pantalla/.test(fn),
     'y está dicho por qué no va en la base');
r.ok(/\(v === 1 \|\| v === 2\) \? v : 0/.test(fn),
     'un valor guardado que no sea 1 ni 2 cae en normal, no rompe nada');

r.seccion('Se aplica antes de que la persona tenga que buscar nada:');

// Si se aplicara al abrir el perfil, quien lo necesita vería todo chico
// hasta llegar ahí, que es justo el recorrido que no puede hacer.
r.ok(/if\(document\.body\) dmAplicarEscala\(\);/.test(app),
     'apenas carga la app');
r.ok(/addEventListener\('DOMContentLoaded', dmAplicarEscala\)/.test(app),
     'y si todavía no hay body, cuando lo haya');
r.ok(/es justo el recorrido que no puede hacer/.test(app),
     'con el motivo escrito');

r.seccion('El control se ve y se entiende:');

r.ok(/Tamaño del texto/.test(app), 'tiene nombre');
r.ok(/dmEscalaCardHtml\(\)/.test(app) && /\$\{dmEscalaCardHtml\(\)\}/.test(app),
     'y está en Mi perfil');
// Arriba de todo: quien no ve bien no va a scrollear una pantalla que no lee
// para encontrar el botón que se la arregla.
const perfil = app.slice(app.indexOf('function renderProfileView(){'),
                         app.indexOf('function renderProfileView(){') + 1800);
r.ok(perfil.indexOf('dmEscalaCardHtml()') < perfil.indexOf('Info de perfil'),
     'arriba de todo, no al final de la pantalla');
r.ok(/dos dedos/.test(app),
     'y menciona el gesto de agrandar, que ahora sí funciona');
// Los tres botones muestran "Aa" en su tamaño real: el que elige tiene que
// poder comprobarlo con los ojos, no deducirlo de la palabra "grande".
r.ok(/\.dm-esc-btn:nth-child\(1\) b\{ font-size:15px/.test(css) &&
     /\.dm-esc-btn:nth-child\(3\) b\{ font-size:22px/.test(css),
     'y cada botón muestra su tamaño, no solo su nombre');

r.seccion('Y el control funciona corriendo la app:');

const ctx = C.appEvaluada();
r.ok(!!ctx, 'la app se evalúa entera');
if (ctx) {
  const d2 = C.conDom(ctx);
  const corr = function (s) { return d2.corr ? d2.corr(s) : vm.runInContext(s, ctx); };
  corr('document.body.innerHTML = "<div id=\'dm-esc-sel\'></div>"');
  r.ok(corr('dmEscalaActual()') === 0, 'arranca en normal');
  corr('dmSetEscala(1)');
  r.ok(corr('document.body.className') === 'dm-esc-g', 'elegir Grande pone la clase');
  r.ok(corr('localStorage.getItem("dm_escala_texto")') === '1', 'y la guarda');
  r.ok(/Grande/.test(String(corr('(document.querySelector(".dm-esc-btn.on span")||{}).textContent'))),
       'y el botón queda marcado');
  corr('dmSetEscala(2)');
  r.ok(corr('document.body.className') === 'dm-esc-xg',
       'cambiar de nivel reemplaza la clase, no la suma');
  corr('dmSetEscala(0)');
  r.ok(corr('document.body.className') === '', 'y volver a normal la saca');
  corr('localStorage.setItem("dm_escala_texto","banana"); document.body.className="";');
  corr('dmAplicarEscala()');
  r.ok(corr('document.body.className') === '',
       'con un valor corrupto guardado no pone ninguna clase');
}

r.cerrar('Antes de agrandar la letra había que dejar de prohibirle agrandarla.');
