// Cada fila del listado traía tres renglones: nombre, correo y los chips de
// patología. El correo no es cómo se reconoce a un paciente —nunca se mira— y
// los chips repetían lo que ya dice la franja de color de la izquierda, que
// además apila varias patologías.
//
// Con 90 pacientes eso es la diferencia entre ver seis de un vistazo y ver
// dieciocho. Buscar en una lista que entra en la pantalla es otra cosa.
//
// Las dos cosas que NO se pueden perder al compactar:
//   1. Se sigue pudiendo buscar por correo. Y si el resultado apareció por el
//      correo y el correo no se ve, la fila es inexplicable: ahí sí se muestra.
//   2. La franja de color sola deja afuera a quien no distingue rojo de verde.

const C = require('./comun');
const r = C.crearReporte('La lista de pacientes entra en la pantalla');

const app = C.leerApp();
const i = app.indexOf('return`<div class="pat-row${(S.viewEmail');
r.ok(i > 0, 'se encuentra la fila del listado');
const fila = app.slice(i, app.indexOf('`;', i));

r.seccion('Lo que se sacó:');

r.ok(fila.indexOf('${u.email}</div>') < 0,
     'el correo ya no ocupa un renglón');
r.ok(fila.indexOf('dmChipsFila(u)') < 0,
     'y los chips de patología tampoco');
// Si alguien vuelve a engancharlos desde el relleno en segundo plano, la fila
// crece de nuevo sin que nadie lo note.
r.ok(!/querySelector\('\.dm-patlist-chips'\)/.test(app),
     'ni se inyectan después, al rellenar las etiquetas que faltaban');

r.seccion('Lo que se queda, porque es lo que distingue una fila de otra:');

r.ok(/dm-patlist-stripe/.test(fila), 'la franja de color');
r.ok(/nameDisplay/.test(fila), 'el nombre');
r.ok(/31557600000/.test(fila), 'y la edad');
r.ok(/EJEMPLO/.test(fila), 'y la marca de paciente de ejemplo');

r.seccion('Buscar por correo sigue andando, y se entiende:');

const fn = app.slice(app.indexOf('async function renderPatientList(filter){'),
                     app.indexOf('async function renderPatientList(filter){') + 1600);
r.ok(/u\.email\.toLowerCase\(\)\.includes\(f\)/.test(fn),
     'el filtro sigue mirando el correo');
r.ok(/_soloPorEmail/.test(fila),
     'y si la fila salió SOLO por el correo, el correo se muestra');
const cond = app.slice(app.indexOf('const _soloPorEmail'),
                       app.indexOf('const _soloPorEmail') + 420);
r.ok(/!_n\.includes\(f\)/.test(cond),
     'solo en ese caso: si también coincide el nombre, no hace falta');
r.ok(/if\(!f\) return false/.test(cond),
     'y sin búsqueda, nunca');

r.seccion('El color no puede ser el único canal:');

r.ok(/_tituloFila/.test(fila), 'la fila tiene título');
const tit = app.slice(app.indexOf('const _tituloFila'),
                      app.indexOf('const _tituloFila') + 420);
r.ok(/PATHOLOGY_TAGS\[t\]\|\|\{label:t\}/.test(tit),
     'que incluye las patologías EN PALABRAS, no solo en colores');
r.ok(/u\.email/.test(tit), 'y el correo que se sacó de la fila');

r.cerrar('Sacar un dato de la pantalla no es lo mismo que dejar de tenerlo.');
