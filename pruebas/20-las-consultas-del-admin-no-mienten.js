// Una paciente que carga el diario todos los días aparecía en el panel de
// administración como "hace 5 días".
//
// Causa: las consultas de actividad iban con `limit` y SIN `order`. PostgREST
// no garantiza ningún orden sin ORDER BY, así que el límite recorta un
// subconjunto arbitrario: a unos pacientes les llegan sus filas más nuevas y a
// otros no. El número no era ruidoso, era falso — y no había forma de notarlo
// desde la pantalla.
//
// Dos arreglos: pedir de lo más nuevo a lo más viejo (así la última actividad
// de cada uno está siempre), y avisar en pantalla cuando la consulta llegó al
// tope, porque ahí los conteos acumulados sí quedan cortos.

const C = require('./comun');
const r = C.crearReporte('Las consultas del admin no mienten');

const html = C.leerHtml();

r.seccion('Toda consulta con límite pide un orden:');

// Cualquier ?...limit= sobre estas tablas tiene que traer su order.
const sospechosas = [];
const re = /db\.get\((["'`])([^"'`]*(?:sleep_diary|evaluations)[^"'`]*)\1/g;
let m;
while((m = re.exec(html)) !== null){
  const q = m[2];
  if(/limit=/.test(q) && !/order=/.test(q)) sospechosas.push(q.slice(0, 70));
}
r.ok(sospechosas.length === 0,
     'ninguna consulta de diario o escalas recorta sin ordenar',
     sospechosas.length ? sospechosas.join(' | ') : 'ninguna');

// Y las de actividad, específicamente, de lo más nuevo a lo más viejo.
r.ok(/sleep_diary\?select=patient_email,created_at,diary_date&order=created_at\.desc/.test(html),
     'la actividad del diario se pide del registro más nuevo al más viejo');
r.ok(/evaluations\?select=patient_email,created_at&order=created_at\.desc/.test(html),
     'y la de escalas también');

r.seccion('Cuando el tope recorta, se dice:');

r.ok(/_admRecorte\b/.test(html), 'se detecta que la consulta llegó al tope');
r.ok(/Hay más registros de los que entran en una consulta/.test(html),
     'y el panel lo avisa en vez de mostrar un número que parece completo');

r.seccion('La última actividad mira las dos fechas:');

const bloque = html.slice(html.indexOf('(diaryRows||[]).forEach'),
                          html.indexOf('(diaryRows||[]).forEach') + 1200);
r.ok(/Math\.max\(_c,_d\)/.test(bloque),
     'toma la más reciente entre cuándo lo cargó y de qué noche habla');
r.ok(/r\.diary_date\+'T12:00:00'/.test(bloque),
     'y la fecha de la noche se lee al mediodía, sin corrimiento de zona');

r.seccion('La cartera del profesional, igual:');

r.ok(/order=diary_date\.desc&limit=/.test(html),
     'el conteo de noches por paciente también pide orden');
r.ok(/_admRecorteDoc/.test(html),
     'y también detecta el recorte');

r.cerrar('Un limit sin order no devuelve "los primeros": devuelve cualquiera.');
