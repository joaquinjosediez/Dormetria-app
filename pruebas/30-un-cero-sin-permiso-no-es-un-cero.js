// Le escribí a Ruffa porque el panel decía que sus pacientes estaban
// inactivos. Me mandó capturas de actogramas llenos.
//
// El panel traía las noches al navegador para contarlas ahí, y el servidor
// devuelve como mucho 1.000 filas (el tope de PostgREST). Con 2.318 noches en
// la base, los conteos salían cortos y los pacientes que quedaban afuera del
// recorte aparecían como si nunca hubieran registrado.
//
// Yo había diagnosticado RLS y afirmé esa causa en el cartel. Estaba mal: el
// número leído era exactamente 1.000, que es la firma del tope, no de un
// filtro de permisos. Esta prueba fija las dos lecciones:
//
//   1. El panel tiene que DETECTAR que le faltan filas — comparando contra el
//      conteo real del servidor, porque una lista corta y una lista filtrada
//      se ven igual.
//   2. Y tiene que decir QUÉ observa, sin inventar la causa.
//
// La solución de fondo es no traer filas: contar del lado del servidor, que
// además no expone ningún dato clínico.

const C = require('./comun');
const r = C.crearReporte('Un cero sin permiso no es un cero');

const html = C.leerHtml();

r.seccion('Se le puede preguntar al servidor cuántas filas hay:');

r.ok(/async contar\(path\)\{/.test(html), 'existe db.contar()');
const bloque = html.slice(html.indexOf('async contar(path){'),
                          html.indexOf('async contar(path){') + 900);
r.ok(/'Prefer':'count=exact'/.test(bloque), 'pide el conteo exacto');
r.ok(/'Range':'0-0'/.test(bloque),
     'y trae una sola fila: el número viene en la cabecera, no en el cuerpo');

r.seccion('Las tres vistas comprueban que no les falten filas:');

r.ok(/_admSinPermisoDiario/.test(html), 'la pestaña Pacientes');
r.ok(/_admDocSinPermiso/.test(html),    'la de Profesionales');
r.ok(/_admStatsSinPermiso/.test(html),  'y la de Estadísticas');

r.seccion('Y lo dicen sin inventar la causa:');

r.ok(/Estos números salen cortos/.test(html),
     'describe lo que se observa');
r.ok(/salen cortos|están subestimados/.test(html),
     'y que el número está por debajo del real');
// Afirmar RLS sobre un 1.000 exacto era adivinar. El tope del servidor deja
// esa huella y el permiso no.
r.ok(/es justo el tope de filas del servidor/.test(html),
     'y cuando la huella es de tope de filas, lo nombra');
r.ok(!/no dejan al administrador ver los diarios/.test(html),
     'ya no afirma que es un problema de permisos');
r.ok(/_admDiarioTotalReal/.test(html) && /_admDiarioLeidas/.test(html),
     'muestra cuántas hay contra cuántas se trajeron');

r.seccion('El arreglo de fondo: contar en el servidor, sin traer datos:');

r.ok(/admin_stats_profesionales/.test(html),
     'el panel llama a la función agregada');
const bloqueRpc = html.slice(html.indexOf("supa.rpc('admin_stats_profesionales')") - 900,
                             html.indexOf("supa.rpc('admin_stats_profesionales')") + 700);
r.ok(/SOLO números/.test(bloqueRpc),
     'que devuelve números, no noches');
r.ok(/window\._admCarteraServidor \? \[\] :/.test(html),
     'y si contesta, ni siquiera se piden las filas');
r.ok(/window\._admDocSinPermiso = false;   \/\/ los números vienen del servidor/.test(html),
     'ahí el aviso desaparece, porque ya no hay recorte posible');
r.ok(/if\(_srv\)\{/.test(html),
     'las columnas de cartera usan ese resultado');

r.cerrar('Una lista corta y una lista recortada se ven igual: hay que preguntar cuántas había.');
