// El progreso del programa autogestionado vive en el localStorage del
// PACIENTE. O sea que el profesional no tenía ninguna forma de saber si
// su paciente empezó la TCC-I ni por dónde iba: tenía que preguntárselo
// en consulta, lo que llega tarde y depende de la memoria del otro.
//
// Ahora el paciente sincroniza un RESUMEN a patients.tcci_estado y el
// resumen del profesional lo muestra.

const C = require('./comun');
const r = C.crearReporte('El profesional ve si el paciente arrancó la TCC-I');

const html = C.leerApp();
const fs = require('fs');
const path = require('path');
const render = fs.readFileSync(
  path.join(__dirname, '..', 'js', 'dormetria-render-resumen.js'), 'utf8');

r.seccion('El paciente sube un resumen, no el detalle:');

const i = html.indexOf('async function dmTcciSincronizarEstado(');
r.ok(i > 0, 'existe la sincronización');
const sync = html.slice(i, i + 2200);

r.ok(/tcci_estado: estado/.test(sync), 'va a patients.tcci_estado');
r.ok(/semanas_cerradas/.test(sync) && /tareas_hechas/.test(sync),
     'sube qué semanas cerró y cuántas tareas marcó');
// Las respuestas de las encuestas NO son seguimiento clínico: son del
// paciente y de la investigación. Que el profesional vea el avance no lo
// habilita a leer lo que su paciente contestó sobre el producto.
r.ok(!/respuestas/.test(sync) && !/encuestas/.test(sync),
     'y NO sube las respuestas de las encuestas ni los comentarios');

r.seccion('Nada de esto puede frenar al paciente:');

r.ok(/console\.warn\('\[TCCI-ESTADO\]/.test(sync),
     'si la columna no existe, falla en silencio');
r.ok(/if\(!email \|\| S\.role!=='patient'\) return;/.test(sync),
     'solo escribe el propio paciente sobre su fila');

r.seccion('Se actualiza en los tres momentos que cambian el estado:');

r.ok(/toast\('Programa iniciado ✓'\);\s*\n\s*try\{ dmTcciSincronizarEstado\(\); \}/.test(html),
     'al empezar el programa');
r.ok(/_dmTcciSyncT = setTimeout/.test(html),
     'al marcar tareas, con retardo para no escribir cuatro veces seguidas');
const cerr = html.slice(html.indexOf('function dmTcciCerrarSemanaYa(n){'), 0) === -1 ? '' :
             html.slice(html.indexOf('function dmTcciCerrarSemanaYa(n){'),
                        html.indexOf('function dmTcciCerrarSemanaYa(n){') + 500);
r.ok(/dmTcciSincronizarEstado\(\)/.test(cerr), 'y al cerrar una semana');

r.seccion('Reiniciar también limpia lo que ve el profesional:');

const rst = html.slice(html.indexOf('function dmTcciReiniciar('),
                       html.indexOf('window.dmTcciReiniciar'));
r.ok(/tcci_estado: null/.test(rst),
     'si no, seguiría viendo un avance que ya no existe');

r.seccion('Y el resumen lo muestra:');

r.ok(/paciente\.tcci_estado/.test(render), 'la tarjeta lee el estado');
r.ok(/Arrancó la TCC-I/.test(render),     'dice que arrancó');
r.ok(/if \(!t \|\| !t\.inicio\) return;/.test(render),
     'sin dato NO dibuja la tarjeta — un 0% falso es peor que nada');
r.ok(/semana ' \+ enCurso \+ ' de ' \+ total/.test(render),
     'y dice por qué semana va');
r.ok(/quieto >= 14/.test(render),
     'avisa cuando hace dos semanas que no se mueve: eso no es "va por la 3", es abandono');

r.cerrar('Preguntar en consulta si arrancó llega tarde y depende de la memoria del otro.');
