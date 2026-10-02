// La barra superior del profesional se mostraba con `body.dr-desktop`. Pero
// esa clase no marca "soy profesional en escritorio": marca el LAYOUT de dos
// paneles (lista de pacientes + ficha), y showScreen solo la pone en
// doctor-home y doctor-patient.
//
// Resultado: al entrar a TCC-I, al directorio o al panel admin, la barra
// desaparecía. Pacientes y Métricas la conservaban porque son la misma
// pantalla; TCC-I y Directorio no, y quedabas sin ninguna navegación visible.
// El directorio además la escondía a propósito, porque con `display:flex` en
// #app la barra se le ponía AL LADO en vez de arriba.
//
// Son dos conceptos distintos y ahora son dos clases distintas:
//   dm-pro-nav   → hay que mostrar la navegación del profesional
//   dr-desktop   → el layout de dos paneles

const C = require('./comun');
const r = C.crearReporte('La barra del profesional no se va');

const app = C.leerApp();
const css = C.leerCss();
const reglas = C.reglasDe(css);
const unaSola = function (sel) {
  return reglas.filter(function (x) { return x.sel === sel; });
};

r.seccion('La barra se muestra por rol, no por layout:');

r.ok(unaSola('body.dm-pro-nav #dr-topbar-desktop').length >= 1,
     'hay una regla que la muestra con dm-pro-nav');
r.ok(/body\.dm-pro-nav #dr-topbar-desktop\{ display:flex !important; \}/.test(css.replace(/\s+/g, ' ')),
     'y en pantalla ancha se muestra siempre');
// La que quede atada a dr-desktop solo puede ser de UBICACIÓN en la grilla.
const soloGrid = unaSola('body.dr-desktop #dr-topbar-desktop');
r.ok(soloGrid.every(function (x) { return !/display:\s*(flex|block)/.test(x.cuerpo); }),
     'lo que queda bajo dr-desktop no decide si se ve, solo dónde cae en la grilla');

r.seccion('Las cuatro pantallas que se quedaban sin barra:');

const i = app.indexOf('const _PANT_PRO =');
r.ok(i > 0, 'existe la lista de pantallas del profesional');
const lista = app.slice(i, app.indexOf(';', i));
['doctor-home', 'doctor-patient', 'admin', 'cbti-list', 'cbti-protocol',
 'cbti-programa', 'consult'].forEach(function (p) {
  r.ok(lista.indexOf("'" + p + "'") >= 0, p);
});
r.ok(/classList\.toggle\('dm-pro-nav', _isDr && _PANT_PRO\.indexOf\(id\) >= 0\)/.test(app),
     'y la clase se pone solo si además es profesional');

r.seccion('El directorio ya no la esconde:');

r.ok(!/dm-dir-abierto[^{]*#dr-topbar-desktop\{[^}]*display:none/.test(css.replace(/\s+/g, ' ')),
     'se sacó la regla que la ocultaba');
// Por qué estaba: con display:flex en #app y sin dirección, la barra quedaba
// como columna al lado de la pantalla. Se le pregunta al motor.
const dom = C.domConCss('<div id="app"></div>');
dom.window.document.body.className = 'dm-dir-abierto dr-desktop';
const cs = dom.window.getComputedStyle(dom.window.document.getElementById('app'));
r.ok(cs.display === 'flex' && cs.flexDirection === 'column',
     'y #app apila en columna, que es lo que hacía falta para no esconderla',
     cs.display + ' / ' + cs.flexDirection);

r.seccion('Y la pestaña encendida es la que corresponde:');

// showDrTab no corre cuando se entra por otro camino: el directorio quedaba
// abierto con "Pacientes" resaltado.
r.ok(/const _TAB_DE = \{/.test(app), 'hay un mapa de pantalla → pestaña');
const j = app.indexOf('const _TAB_DE = {');
const mapa = app.slice(j, app.indexOf('};', j));
r.ok(/'consult':'dir'/.test(mapa), 'el directorio enciende Directorio');
r.ok(/'cbti-list':'more'/.test(mapa), 'TCC-I enciende TCC-I');
r.ok(/'admin':'admin'/.test(mapa), 'y admin, Admin');
r.ok(/data-tab="dir"/.test(app), 'el botón del directorio tiene su data-tab');
r.ok(/id="dr-tb-admin-tab" data-tab="admin"/.test(app), 'y el de admin también');

r.seccion('La bottomnav sigue sin aparecer donde está la barra:');

r.ok(/body\.dm-pro-nav #dr-bottomnav\{ display:none !important; \}/.test(css.replace(/\s+/g, ' ')),
     'una sola navegación por vez, no dos');

r.cerrar('Quedarse sin ninguna salida visible no es un problema estético.');
