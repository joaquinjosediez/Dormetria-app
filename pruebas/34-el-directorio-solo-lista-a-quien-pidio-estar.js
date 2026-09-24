// Joaquín abrió el directorio de especialistas y se encontró a sí mismo,
// sin haberse listado nunca. No era un bug de vista: showConsultDir
// preguntaba por listed=eq.true y, si eso venía vacío, caía a
//
//     doctors?select=name,lname,email,specialty,mat,city,address,phone…
//
// sin ningún filtro, y se quedaba con "los que tienen especialidad
// cargada". El comentario original lo decía con todas las letras: "they
// opted in to the directory by filling their profile".
//
// Completar el campo especialidad no es consentimiento para publicar
// nombre, matrícula, ciudad, dirección y teléfono ante cualquier paciente
// que abra la pantalla. Ley 25.326, artículo 5: el consentimiento tiene
// que ser previo, expreso e informado.
//
// Esta prueba fija la regla: si nadie se listó, el directorio está vacío.

const C = require('./comun');
const r = C.crearReporte('El directorio solo lista a quien pidió estar');

const html = C.leerHtml();
const i = html.indexOf('async function showConsultDir(');
r.ok(i > 0, 'encuentro showConsultDir');
const fn = html.slice(i, html.indexOf('renderConsultList(_consultDoctorsCache)', i));

r.seccion('La consulta pregunta por el permiso, no por el perfil:');

r.ok(/public_profile=eq\.true/.test(fn),
     'pide public_profile=true');
r.ok(/listed=eq\.true/.test(fn),
     'y contempla el listed legacy');

r.seccion('Y no hay ninguna puerta de atrás:');

// Cualquier get a `doctors?` que no lleve uno de los dos filtros de
// consentimiento es una fuga: trae el padrón completo.
// La URL puede venir armada por concatenación ('doctors?'+filtro+'&select=').
// Se toma hasta el final de la expresión, no hasta la primera comilla.
const gets = fn.match(/doctors\?[^\n;]*/g) || [];
r.ok(gets.length > 0, 'hay consultas a doctors');
const sinFiltro = gets.filter(g =>
  !/public_profile=eq\.true/.test(g) && !/listed=eq\.true/.test(g) && !/\+\s*filtro\s*\+/.test(g));
r.ok(sinFiltro.length === 0,
     'ninguna consulta trae doctores sin filtro de consentimiento' +
     (sinFiltro.length ? ' — se filtró: ' + sinFiltro[0].slice(0, 60) : ''));

r.ok(!/dm_approved_doctors/.test(fn),
     'no se decide quién se publica con una lista de localStorage de este equipo');
r.ok(!/d\.specialty\s*&&\s*d\.specialty\s*!==\s*''/.test(fn),
     'tener especialidad cargada ya no equivale a haber pedido figurar');

r.seccion('Si nadie se listó, la respuesta correcta es "no hay nadie":');

r.ok(!/allDoctors|dbAll/.test(fn),
     'desapareció el padrón completo como plan B');

r.cerrar('Publicar los datos de un profesional necesita que él lo haya pedido.');
