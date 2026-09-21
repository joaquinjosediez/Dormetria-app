// Le escribí a Ruffa porque el panel decía que todos sus pacientes estaban
// inactivos. Me mandó capturas de actogramas llenos.
//
// No estaban inactivos: la cuenta de administrador NO PUEDE LEER sus diarios.
// Las policies de sleep_diary dejan leer una fila al propio paciente y al
// profesional vinculado; el administrador no es ninguno de los dos para los
// pacientes de otro colega, así que esas filas no vuelven. Desde el cliente
// eso se ve idéntico a "no registró nada": una lista vacía.
//
// Es la misma familia de errores que veníamos arrastrando —el cero que en
// realidad es una ausencia de dato— pero acá el cero venía de un permiso, y
// no hay forma de distinguirlo mirando las filas. Hay que preguntarle al
// servidor cuántas hay.

const C = require('./comun');
const r = C.crearReporte('Un cero sin permiso no es un cero');

const html = C.leerHtml();

r.seccion('Se le puede preguntar al servidor cuántas filas hay:');

r.ok(/async contar\(path\)\{/.test(html), 'existe db.contar()');
const bloque = html.slice(html.indexOf('async contar(path){'),
                          html.indexOf('async contar(path){') + 900);
r.ok(/'Prefer':'count=exact'/.test(bloque),
     'pide el conteo exacto al servidor');
r.ok(/'Range':'0-0'/.test(bloque),
     'y trae una sola fila: el número viene en la cabecera, no en el cuerpo');
r.ok(/content-range/.test(bloque),
     'que es de donde se lee el total');

r.seccion('Las tres vistas del panel lo comprueban:');

r.ok(/_admSinPermisoDiario/.test(html),   'la pestaña Pacientes');
r.ok(/_admDocSinPermiso/.test(html),      'la de Profesionales');
r.ok(/_admStatsSinPermiso/.test(html),    'y la de Estadísticas');

// La condición tiene que descartar el recorte por límite: si la consulta
// llegó al tope, faltan filas por otro motivo y no hay que culpar a la RLS.
const cond = html.slice(html.indexOf('window._admSinPermisoDiario ='),
                        html.indexOf('window._admSinPermisoDiario =') + 260);
r.ok(/!window\._admRecorte/.test(cond),
     'y no confunden "me filtraron" con "llegué al tope de la consulta"');

r.seccion('Y lo dicen, en vez de mostrar ceros:');

r.ok(/Esta tabla NO es confiable ahora mismo/.test(html),
     'la tabla de pacientes avisa que no es confiable');
r.ok(/Activaron y 14\+ noches no son confiables/.test(html),
     'las columnas de cartera también');
r.ok(/Los activos están subestimados/.test(html),
     'y las estadísticas de plataforma');
r.ok(/no dejan al administrador ver los diarios/.test(html),
     'explicando la causa, no solo que algo falla');
// Sin el número, el aviso es una sospecha; con él, es un diagnóstico.
r.ok(/_admDiarioTotalReal/.test(html) && /_admDiarioLeidas/.test(html),
     'y muestra cuántas filas hay contra cuántas se pudieron leer');

r.cerrar('Las reglas de acceso devuelven menos filas, no un error: el silencio se lee como ausencia.');
