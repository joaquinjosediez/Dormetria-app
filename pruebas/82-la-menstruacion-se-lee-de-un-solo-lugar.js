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

// ── Y la espera, que ya no es un aro girando ──────────────────────────
// Va acá y no en una prueba propia porque es una sola regla de CSS.
const css = C.leerCss();
const rl = C.crearReporte('La espera es una luna que crece');
rl.seccion('Una regla, sin JS y sin imágenes:');
rl.ok(/@keyframes dmLunaCrece\{/.test(css), 'la animación existe');
rl.ok(/box-shadow: inset -3px  0 0 0 var\(--dm-luna\)/.test(css), 'arranca en luna fina');
rl.ok(/box-shadow: inset -30px 0 0 0 var\(--dm-luna\)/.test(css), 'y llega a llena');
rl.ok(!/animation:spin 0\.7s linear infinite/.test(css), 'y el aro girando se fue');
// La regla la comparten los 21 lugares que muestran "Cargando...": si
// alguien agrega uno nuevo, queda cubierto sin tocar nada.
rl.ok(/\.spinner\{/.test(css), 'sigue llam\u00e1ndose .spinner, as\u00ed que la heredan todos');
rl.seccion('El color se da vuelta con el fondo:');
// La app es oscura casi entera, asi que la luna es blanca por defecto: el
// mismo #f2f2ec del wordmark. Sobre el crema de las cajas claras, blanco
// da 1,05:1 y la luna llena y la nueva se verian iguales.
rl.ok(/--dm-luna:#f2f2ec/.test(css), 'blanca por defecto, el blanco del wordmark');
rl.ok(/\.caja-clara \.spinner, \.sobre-claro \.spinner[\s\S]{0,120}--dm-luna:#0F2820/.test(css),
      'y verde noche sobre las superficies claras');
// Por variable y no por una regla por lugar: cualquier caja que ya marque
// "aca el texto va oscuro" hereda la luna correcta sin acordarse de nada.
rl.ok(/var\(--dm-luna\)/.test(css) && (css.match(/var\(--dm-luna\)/g) || []).length >= 4,
      'la inversi\u00f3n va por variable, as\u00ed se hereda sola');
// Y NINGUN borde dibujado: la forma la hace el contraste, no una linea.
rl.ok(!/\.spinner\{[^}]*outline:/.test(css), 'sin borde dibujado alrededor');
rl.ok(/prefers-reduced-motion: reduce/.test(css),
      'y quien pidi\u00f3 no ver animaciones ve la luna quieta, no nada');
rl.cerrar('Esperar es el momento en que la persona mira la pantalla sin nada que hacer.');

// ── Y la misma luna en las esperas que no eran un spinner ─────────────
// Quedaban doce lugares con un reloj de arena ⏳ —un emoji que cada
// sistema dibuja distinto y que no se mueve— o directamente con el texto
// "Cargando…" pelado. El informe, el resumen, los hábitos, el directorio.
const app82 = C.leerApp();
const rm = C.crearReporte('La luna chica, en línea con el texto');
rm.seccion('Existe una variante para texto corrido:');
rm.ok(/\.spinner-mini\{/.test(css), '.spinner-mini');
rm.ok(/display:inline-block; vertical-align:-2px;/.test(css), 'que va en la línea');
rm.ok(/@keyframes dmLunaMini\{/.test(css),
      'con su propio recorrido: con el de la grande, 14 px quedan llenos media vuelta');
rm.ok(/\.caja-clara \.spinner-mini, \.sobre-claro \.spinner-mini\{ --dm-luna:#0F2820; \}/.test(css),
      'y se da vuelta con el fondo igual que la grande');
rm.seccion('Y ya no quedan relojes de arena en las esperas:');
rm.ok(!/⏳ Cargando/.test(app82), 'ni en el resumen');
rm.ok(!/⏳<\/div>Preparando/.test(app82) && !/empty-icon">⏳/.test(app82),
      'ni al preparar los pacientes de ejemplo');
rm.ok(!/<span>⏳<\/span> Componiendo/.test(app82), 'ni al componer el resumen');
rm.ok(!/⏳ Procesando/.test(app82), 'ni al procesar un archivo');
// Los ⏳ que SÍ quedan son estados, no esperas: "Pendiente de aprobación",
// "Asignado — aún sin leer". Ahí el reloj significa algo y se queda.
rm.ok(/⏳ Pendiente/.test(app82),
      'pero los que marcan un ESTADO —"Pendiente"— siguen, porque ahí significan algo');
rm.ok((app82.match(/class="spinner-mini"/g) || []).length >= 7,
      'la luna chica está en los lugares que esperaban sin decirlo',
      (app82.match(/class="spinner-mini"/g) || []).length + ' lugares');
rm.cerrar('Un reloj de arena que no se mueve no dice "esperá": dice "se colgó".');
