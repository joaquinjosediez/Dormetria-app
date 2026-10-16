// "En las cuentas demo femeninas pusiste la asociación de la menstruación con
//  algunas variables, pero no se ven las barras marcadas en el actograma."
//
// El dato está guardado DOS veces:
//
//     sleep_diary.has_period   → columna booleana
//     sleep_diary.notes        → el texto "🩸Período", de una versión anterior
//
// El formulario escribe las dos, así que mientras el registro venga de ahí
// nadie nota nada. Pero cada parte de la app leía una distinta:
//
//     análisis de factores, bloque del ciclo  → columna O notas
//     ACTOGRAMA, las dos vistas               → SÓLO notas
//
// Por eso la tabla de factores mostraba "Días de menstruación" con su
// diferencia calculada y el actograma de al lado no pintaba una sola barra
// rosa. Lo mismo le pasa a cualquier registro importado, a cualquier carga
// directa contra la base, y a los diarios de ejemplo.
//
// Es el tercer caso igual en el mismo mes: el TIB tenía tres copias, la
// fragmentación tres, y acá un hecho con dos fuentes y distintas partes
// leyendo fuentes distintas. Lo que se arregla es la pregunta, no el dato.

const C = require('./comun');
const vm = require('vm');
const r = C.crearReporte('La menstruación se lee de un solo lugar');

const app = C.leerApp();
const GOTA = '\u{1FA78}';
const MARCA = GOTA + 'Período';

r.seccion('Hay una sola función que contesta la pregunta:');

r.ok(/function dmEsPeriodo\(e\)\{/.test(app), 'dmEsPeriodo existe');
r.ok(app.indexOf('e.has_period === true ||') > 0,
     'y acepta las dos fuentes: la columna o el marcador viejo');
// Lo que importa es que NADIE MÁS pregunte por su cuenta. Se cuentan las
// lecturas sueltas del marcador que quedan en el archivo.
const sueltas = (app.match(new RegExp(MARCA + '/\\\\.test', 'g')) || []).length;
r.ok(sueltas <= 3,
     'y casi no quedan lecturas sueltas del marcador', sueltas + ' en todo el archivo');

r.seccion('El actograma ya no mira sólo las notas:');

// Las seis lecturas del actograma — tres en la vista del paciente, tres en
// la del profesional — son las que estaban mal.
r.ok(/const periodNights=sorted\.map\(\(e,i\)=>dmEsPeriodo\(e\)\?i:null\)/.test(app),
     'vista del paciente: las filas marcadas');
r.ok(/sleepBarColors=sorted\.map\(e=>dmEsPeriodo\(e\)\?'#c2547dcc'/.test(app),
     '  y el color de la barra');
r.ok(/sleepBarBorders=sorted\.map\(e=>dmEsPeriodo\(e\)\?'#c2547d'/.test(app),
     '  y su borde');
r.ok(/const drPeriodNights=sorted\.filter\(dmEsPeriodo\)\.length/.test(app),
     'vista del profesional: la leyenda sólo aparece si hay días');
r.ok(/drSleepColors[\s\S]{0,180}dmEsPeriodo\(e\)\?'#c2547dcc'/.test(app),
     '  el color de la barra');
r.ok(/drSleepBorders[\s\S]{0,180}dmEsPeriodo\(e\)\?'#c2547d'/.test(app),
     '  y su borde');

r.seccion('Y el resto de la app usa la misma:');

r.ok(/on:dmEsPeriodo,/.test(app), 'el análisis de factores');
r.ok(/var _esPeriodo = dmEsPeriodo;/.test(app), 'el bloque del ciclo');
// Abrir una noche para editarla leía sólo el marcador: con has_period=true y
// sin emoji, el toggle salía apagado y al guardar se perdía el dato.
r.ok(/if\(dmEsPeriodo\(e\)\)\{\s*\n\s*_periodActive = true;/.test(app),
     'y la precarga al editar una noche ya cargada');
r.ok(/se perdia el dato/.test(app),
     'con el motivo escrito, que es lo que evita que vuelva');

r.seccion('Corriendo la función:');

const ctx = C.appEvaluada();
r.ok(!!ctx, 'la app se evalúa entera');
if (ctx) {
  const es = function (e) { ctx.__e = e; return vm.runInContext('dmEsPeriodo(__e)', ctx); };
  r.ok(es({ has_period: true }) === true, 'la columna sola alcanza');
  r.ok(es({ notes: 'algo | ' + MARCA }) === true, 'el marcador viejo también');
  r.ok(es({ has_period: true, notes: MARCA }) === true, 'y las dos juntas');
  r.ok(es({ has_period: false }) === false, 'un false explícito es que NO');
  r.ok(es({}) === false && es(null) === false, 'y sin dato tampoco se inventa');
  // has_period viene como string desde algunos clientes de Postgres.
  r.ok(es({ has_period: 'true' }) === false,
       'un string "true" NO cuenta: si eso aparece, el problema está en el guardado');
}

r.cerrar('Un hecho guardado dos veces es un hecho que dos partes de la app van a leer distinto.');
