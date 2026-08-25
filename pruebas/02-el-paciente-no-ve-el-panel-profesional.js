// ESTA PRUEBA EXISTE POR UN INCIDENTE REAL.
//
// En mod161 se escribió esta regla de CSS:
//
//     @media (max-width:899px){
//       #screen-doctor-home, #screen-doctor-patient, #screen-admin{
//         display:flex !important; ...
//
// Le faltaba ".active". Ese !important le gana a la regla que esconde las
// pantallas inactivas, así que las tres pantallas del panel profesional
// quedaron visibles para CUALQUIERA que entrara desde un celular. Lo
// descubrió un paciente, Nicolas, que abrió su app y vio el panel del
// médico encima de la suya.
//
// Se revisa de dos maneras, porque una sola no alcanza:
//   1. Leyendo TODAS las reglas del CSS, para encontrar la clase de error.
//   2. Armando la página de verdad y preguntándole al motor qué se ve.
//
// OJO CON LA SEGUNDA: jsdom no tiene tamaño de ventana, así que NO aplica
// las reglas dentro de @media. El bug original vivía justamente adentro de
// un @media (max-width:899px), o sea que la comprobación 2 sola lo habría
// dejado pasar. Está verificado: reintroduciendo el bug tal cual, la que lo
// caza es la 1. Si alguna vez hay que sacar una de las dos, la que se queda
// es la primera.

const C = require('./comun');
const r = C.crearReporte('El paciente no ve el panel profesional');

// ── 1. Ninguna regla puede mostrar una pantalla que no está activa ─────
const css = C.leerCss();
const PANTALLAS_PRO = ['#screen-doctor-home', '#screen-doctor-patient', '#screen-admin'];

const reglas = C.reglasDe(css);

const culpables = reglas.filter(x => {
  const muestra = /display\s*:\s*(flex|block|grid)/i.test(x.cuerpo);
  if (!muestra) return false;
  const tocaPantallaPro = PANTALLAS_PRO.some(p => x.sel.includes(p));
  if (!tocaPantallaPro) return false;
  // Está bien si exige .active, o si exige el rol profesional en el body.
  const protegida = /\.active/.test(x.sel) ||
                    /body\.(dr-desktop|dm-rol-pro)/.test(x.sel);
  return !protegida;
});

r.ok(culpables.length === 0,
     'ninguna regla muestra una pantalla del profesional sin ".active"',
     'revisadas ' + reglas.length + ' reglas');
culpables.forEach(x => console.log('       → ' + x.sel.slice(0, 100)));

// La barra de abajo del profesional, lo mismo.
const navSueltas = reglas.filter(x =>
  x.sel.includes('#dr-bottomnav') &&
  /display\s*:\s*(flex|block|grid)/i.test(x.cuerpo) &&
  !/body\.dm-rol-pro/.test(x.sel));
r.ok(navSueltas.length === 0, 'la barra del profesional tampoco se escapa');

// ── 2. Armar la página de verdad y mirar ───────────────────────────────
const html = C.leerHtml();

// El CSS se inyecta buscando el <link> por su forma, NO por el número de
// versión. La versión anterior de esta prueba lo buscaba con la versión
// exacta escrita a mano: al pasar a mod162 dejó de encontrarlo, dejó de
// inyectar el CSS y siguió informando resultados como si lo hubiera mirado.
// Una prueba que se rompe en silencio es peor que no tener prueba.
const enlaceCss = /<link[^>]+href=["']css\/styles\.css[^"']*["'][^>]*>/i;
if (!enlaceCss.test(html)) {
  console.log('  MAL  no encuentro el <link> al CSS en el index — no puedo probar nada');
  process.exitCode = 1;
  return;
}
const paginaConCss = html.replace(enlaceCss, '<style>' + css + '</style>');

const { JSDOM } = require('jsdom');
const dom = new JSDOM(paginaConCss, { runScripts: 'outside-only' });
const w = dom.window, d = w.document;

// jsdom no ejecuta la app; se pone a mano el estado que dejaría un paciente
// entrando desde el celular.
function comoPaciente() {
  d.body.className = '';                       // sin dm-rol-pro ni dr-desktop
  d.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  const inicio = d.getElementById('screen-home');
  if (inicio) inicio.classList.add('active');
}
function comoProfesional() {
  d.body.className = 'dm-rol-pro';
  d.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  const casa = d.getElementById('screen-doctor-home');
  if (casa) casa.classList.add('active');
}
const visible = id => {
  const el = d.getElementById(id);
  if (!el) return '(no existe)';
  return w.getComputedStyle(el).display;
};

r.seccion('Un paciente, en su pantalla de inicio:');
comoPaciente();
['screen-doctor-home', 'screen-doctor-patient', 'screen-admin'].forEach(id => {
  const dsp = visible(id);
  r.ok(dsp === 'none' || dsp === '(no existe)', 'no ve ' + id, 'display: ' + dsp);
});

// La barra de abajo NO se comprueba con el motor: depende de resolver un
// !important contra otro, y ahí jsdom 24 y jsdom 30 no contestan lo mismo.
// La regla sí se puede leer, y es lo que importa de todos modos.
const navOculta  = reglas.some(x => x.sel === '#dr-bottomnav' &&
                                    /display\s*:\s*none\s*!important/i.test(x.cuerpo));
const navSoloPro = reglas.some(x => /body\.dm-rol-pro\s+#dr-bottomnav/.test(x.sel) &&
                                    /display\s*:\s*flex/i.test(x.cuerpo));
r.ok(navOculta, 'la barra del profesional arranca oculta para todos');
r.ok(navSoloPro, 'y solo se enciende con el rol profesional en el body');

r.seccion('Y el profesional sí ve la suya:');
comoProfesional();
r.ok(visible('screen-doctor-home') !== 'none', 've su pantalla',
     'display: ' + visible('screen-doctor-home'));
r.ok(visible('dr-bottomnav') !== 'none', 've su barra de abajo',
     'display: ' + visible('dr-bottomnav'));

r.cerrar('Cada rol ve lo suyo y nada más.');

// ── 3. En el celular tiene que haber DÓNDE scrollear ───────────────────
// Tres versiones seguidas salieron con el panel profesional atascado
// arriba: se veía el encabezado y no había forma de bajar. Las tres veces
// el motivo fue el mismo: ningún contenedor con overflow-y:auto, o uno que
// dependía de un reparto de alto entre padres que terminaba en cero.
// jsdom no puede medir alturas, pero sí puede confirmar que la regla existe.
//
// Verificado contra el CSS de mod165: esta comprobación lo reprueba, y de
// paso destapó que #screen-admin no tenía scroll de ninguna clase.
const r2 = C.crearReporte('El panel profesional scrollea en el celular');

const bloquesMovil = [...css.matchAll(/@media[^{]*max-width\s*:\s*899px[^{]*\{([\s\S]*?)\n\}/g)]
  .map(m => m[1]);
r2.ok(bloquesMovil.length > 0, 'existe el bloque de celular en el CSS',
      bloquesMovil.length + ' bloques');

const cssMovil = bloquesMovil.join('\n');
const reglasMovil = C.reglasDe(cssMovil);

PANTALLAS_PRO.forEach(p => {
  const conScroll = reglasMovil.some(x =>
    x.sel.includes(p + '.active') && /overflow-y\s*:\s*(auto|scroll)/i.test(x.cuerpo));
  r2.ok(conScroll, 'en ' + p + ' se puede bajar');
});

// Y que no queden dos scrolls anidados peleándose el dedo.
const anidados = reglasMovil.filter(x =>
  PANTALLAS_PRO.some(p => x.sel.includes(p + '.active >') || x.sel.includes(p + '.active #')) &&
  /overflow-y\s*:\s*(auto|scroll)/i.test(x.cuerpo));
r2.ok(anidados.length === 0, 'sin un segundo scroll adentro del primero',
      anidados.length ? anidados.map(a => a.sel).join(' · ') : 'ninguno');

r2.cerrar('En el celular el panel profesional se puede recorrer entero.');
