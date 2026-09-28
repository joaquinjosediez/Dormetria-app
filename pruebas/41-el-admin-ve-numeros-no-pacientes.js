// La pestaña TCC-I del panel de administrador responde una pregunta de
// producto: ¿el programa funciona, y dónde se rompe?
//
// Lo que NO puede hacer es contestarla leyendo las fichas de pacientes que
// no son de quien mira. Ya se fijó ese criterio en las otras estadísticas:
// las cuentas se hacen adentro de la base y salen números.
//
// Esta prueba mira que la pestaña nueva no haya abierto una puerta lateral.

const C = require('./comun');
const r = C.crearReporte('El admin ve números, no pacientes');

const html = C.leerHtml();
const i = html.indexOf('async function dmAdminTcci(');
r.ok(i > 0, 'encuentro la pestaña');
const panel = html.slice(i, html.indexOf('window.dmAdminTcci'));

r.seccion('Todo sale de funciones agregadas del servidor:');

['admin_stats_tcci', 'admin_stats_tcci_abandono',
 'admin_stats_tcci_encuestas', 'admin_stats_tcci_precio'].forEach(function (fn) {
  r.ok(new RegExp("rpc\\('" + fn + "'\\)|'" + fn + "'").test(panel),
       'usa ' + fn + '()');
});

r.seccion('Y ninguna puerta lateral:');

// Un db.get a patients, sleep_diary, evaluations o tcci_encuestas desde acá
// traería filas de gente. Las funciones existen justamente para no hacerlo.
const tablas = ['patients', 'sleep_diary', 'evaluations', 'tcci_encuestas', 'cbti_progress'];
tablas.forEach(function (t) {
  r.ok(!new RegExp("db\\.get\\(['\"`]" + t).test(panel),
       'no consulta ' + t + ' directo');
});
r.ok(!/select=\*/.test(panel), 'no pide select=* de nada');

r.seccion('Las funciones chequean admin por dentro:');

const fs = require('fs');
const path = require('path');
const sql = fs.readFileSync(path.join(__dirname, '..', 'SQL-estadisticas-tcci.md'), 'utf8');
const guardas = (sql.match(/public\.es_admin\(\)/g) || []).length;
r.ok(guardas >= 4, 'las cuatro funciones llevan la guarda es_admin() (encontradas: ' + guardas + ')');
r.ok(/security definer/.test(sql), 'son security definer');
const revokes = (sql.match(/revoke all on function public\.admin_stats_tcci/g) || []).length;
r.ok(revokes >= 4, 'y se les revoca el acceso público (encontradas: ' + revokes + ')');

r.seccion('Las demo no ensucian la estadística:');

r.ok(/is_demo,false\) = false/.test(sql), 'se excluyen las cuentas de ejemplo');
r.ok(/@demo\.dormetria\.com/.test(sql),   'y los mails de demo');

r.seccion('Si falta el SQL se dice, no se muestran ceros:');

r.ok(/Falta correr el SQL/.test(panel),
     'un 0 que en realidad significa "la función no existe" se lee como "nadie lo usa"');
r.ok(/faltan\.length===4/.test(panel), 'se distingue "falta todo" de "falta una"');

r.seccion('Y se dice de dónde sale el número:');

r.ok(/inicio → última señal, no inicio → fin real/.test(panel),
     'el tiempo de principio a fin lleva su advertencia');
r.ok(/No se lee ni un email, ni una noche, ni un comentario/.test(panel),
     'y la pantalla declara qué NO está leyendo');

r.cerrar('Para saber si el programa funciona no hace falta leer la ficha de nadie.');
