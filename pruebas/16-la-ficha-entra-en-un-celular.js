// Tres arreglos de pantalla chica y una lectura clínica que decía lo contrario
// de lo que el número significa.
//
// - La cabecera del resumen del profesional trae grid-template-columns con
//   las tres columnas EN ESTILO INLINE, y el inline le gana a la hoja. En un
//   teléfono cada tarjeta quedaba en ~110px, con las etiquetas cortadas a la
//   mitad ("+ Cronodisrupci", "Insomnio · aut").
//
// - El renglón "Estuviste N min despierto/a en la cama" se pintaba con
//   var(--label-2), el gris pensado para fondo claro, sobre el verde del
//   diario. Invisible. Es la misma falla que ya apareció cuatro veces.
//
// - "Tus números" arrancaba plegado: el paciente abría Gráficos y veía el
//   actograma y dos botones cerrados.
//
// - Y la concordancia percepción/datos leía Math.abs(r), así que un r de
//   −0,55 —que significa que reporta MEJOR calidad las noches que el registro
//   mide PEOR, el patrón más orientador a insomnio paradójico— se anunciaba
//   como "coincide bastante".

const C = require('./comun');
const r = C.crearReporte('La ficha entra en un celular');

const html = C.leerHtml();
const css = C.leerCss();

r.seccion('La cabecera del resumen se apila en pantalla chica:');

const headRules = C.reglasDe(css).filter(x =>
  x.sel.split(',').some(s => s.trim().indexOf('.dm-resumen-head') >= 0));
r.ok(headRules.length >= 2, 'hay reglas para .dm-resumen-head',
     headRules.length + ' declaraciones');

const base = headRules.map(x => x.cuerpo).join(';').replace(/\s+/g, '');
r.ok(/grid-template-columns:1fr!important/.test(base),
     'la base es una sola columna, con !important para ganarle al inline');
r.ok(/1fr1fr1fr!important/.test(base),
     'y las tres columnas vuelven solo cuando hay ancho');

r.seccion('El renglón de tiempo en cama se lee sobre verde:');

const bloqueHint = html.slice(
  html.indexOf('Te levantaste apenas te despertaste'),
  html.indexOf('Te levantaste apenas te despertaste') + 900);
// Se mira lo que se ASIGNA, no el comentario que explica por qué se cambió.
r.ok(!/hint\.style\.color\s*=\s*'var\(--label-2\)'/.test(bloqueHint),
     'no pinta con var(--label-2), que es el gris de fondo claro');
r.ok(/rgba\(244,239,229/.test(bloqueHint),
     'usa crema sobre el verde');

r.seccion('"Tus números" arranca abierto:');

const bloqueNum = html.slice(
  html.indexOf('<span>Tus números</span>') - 200,
  html.indexOf('<span>Tus números</span>') + 220);
r.ok(/aria-expanded="true"/.test(bloqueNum), 'el botón arranca expandido');
r.ok(/dm-plegable dm-abierta/.test(bloqueNum), 'y el panel arranca visible');

r.seccion('Los perfiles de hijos no empujan lo propio del adulto:');

const iHist = html.indexOf('>Mi historial<');
const iHijos = html.indexOf('id="profile-children"');
r.ok(iHist > 0 && iHijos > 0 && iHijos > iHist,
     'la caja de hijos va después de "Mi historial"');

r.seccion('El signo de la correlación dice lo que significa:');

// El bloque pasó a llamarse _frase: además del signo mira si el intervalo
// de confianza cruza el cero (ver prueba 22).
const bloqueCorr = html.slice(
  html.indexOf('const _frase=function(v, rotulo, esperado){'),
  html.indexOf('const _frase=function(v, rotulo, esperado){') + 900);
r.ok(bloqueCorr.length > 100, 'encuentro la lectura de concordancia');
r.ok(/v\.r>0/.test(bloqueCorr),
     'mira el signo, no solo la magnitud');
r.ok(/al revés/.test(bloqueCorr),
     'y nombra el caso invertido en vez de llamarlo "coincide"');
r.ok(/va de −1 a \+1/.test(html),
     'y le explica al profesional qué es el número');
r.ok(/insomnio paradójico/.test(html),
     'con la lectura clínica que corresponde');

r.cerrar('Un número al que se le saca el signo puede decir exactamente lo contrario.');
