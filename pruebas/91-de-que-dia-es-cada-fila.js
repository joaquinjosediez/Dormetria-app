// "OJO PORQUE LAS SIESTAS LAS PONE EN EL DÍA POSTERIOR Y NO ANTERIOR. Si
//  cargás la información del lunes y pusiste que dormiste siesta el domingo
//  a la tarde la anota para el lunes a la tarde."
//
// ── Qué estaba mal, exactamente ──────────────────────────────────────
//
// El dato estaba bien guardado y bien DIBUJADO. Lo que estaba mal era el
// RÓTULO de la fila, y eso hacía leer mal el gráfico entero.
//
// Las dos convenciones de la app:
//
//   · `diary_date` es la fecha en que la persona SE DESPERTÓ. El
//     formulario lo dice: "Poné la fecha del día en que te despertaste".
//   · Todo lo del día —siesta, ejercicio, pantallas, café, alcohol— se
//     pregunta por el día ANTERIOR a esa noche: "¿Dormiste siesta ayer?
//     Durante el día anterior a esa noche".
//
// Y el eje del actograma va de mediodía a mediodía: `toOff(t)` manda las
// 12:00 al offset 0, así que un bedtime de 23:30 cae en 11,5 y un despertar
// de 07:30 en 19,5. Para que esa barra sea una noche, el offset 0 tiene que
// ser el mediodía de `diary_date − 1`. O sea que la mitad izquierda de cada
// fila es el día PREVIO al que decía el rótulo.
//
// Una siesta de las 15:00 del domingo se dibujaba en el lugar correcto
// —offset 3, a la izquierda del sueño— en una fila rotulada "lun".
//
// ── Qué NO estaba mal ────────────────────────────────────────────────
//
// Esto es lo que importa del "revisá todos los análisis": casi todo estaba
// bien, y conviene que quede escrito para no "arreglar" lo que funciona.
//
//   · Las asociaciones de hábitos comparan noches CON siesta contra noches
//     SIN siesta usando la misma fila. La siesta precedió a esa noche, así
//     que la comparación es la correcta.
//   · Lo mismo para ejercicio, cafeína, alcohol y pantallas.
//   · El total de 24 h de los menores de 6 suma la siesta del día más la
//     noche que le sigue: es un bloque coherente.
//   · Ninguna parte del código hace aritmética de fechas sobre la siesta.

const C = require('./comun');
const vm = require('vm');
const r = C.crearReporte('De qué día es cada fila');

const app = C.leerApp();

r.seccion('Las dos convenciones están declaradas donde se usan:');

r.ok(/Poné la fecha del día en que te <b>despertaste<\/b>/.test(app),
     'diary_date es la fecha de despertar');
r.ok(/Durante el día anterior a esa noche/.test(app),
     'y la siesta es del día anterior a esa noche');
r.ok(/¿Dormiste siesta ayer\?/.test(app), 'la pregunta dice "ayer"');

r.seccion('La fila se rotula con el día en que EMPIEZA:');

r.ok(/function dmFilaActograma\(diaryDate\)\{/.test(app), 'hay una sola función');
r.ok(/d\.setDate\(d\.getDate\(\) - 1\);/.test(app), 'que resta un día');
// Las dos vistas, paciente y profesional, tienen que rotular igual.
r.ok((app.match(/dmFilaActograma\(e\.diary_date\)/g) || []).length === 2,
     'y la usan los dos actogramas',
     (app.match(/dmFilaActograma\(e\.diary_date\)/g) || []).length + ' usos');
r.ok(!/new Date\(e\.diary_date\+'T12:00:00'\)\.toLocaleDateString\('es-AR',\{weekday/.test(app),
     'no queda ningún rótulo armado con la fecha de despertar');
// La lista de noches y el globo de la nota usan la MISMA convención. Si la
// lista dijera una fecha y el gráfico otra para la misma noche, no se
// podría cruzar nada entre los dos.
r.ok(/function dmNocheDe\(diaryDate, largo\)\{/.test(app), 'hay una sola función para los dos formatos');
r.ok(/f='noche del '\+dmNocheDe\(e\.diary_date, true\)/.test(app),
     'el globo de la nota la usa');
r.ok(/fecha=dmNocheDe\(e\.diary_date, true\)/.test(app),
     'y la tarjeta de la lista de noches también');

r.seccion('Y el gráfico dice qué es una fila:');

// "Cada fila es un día" era la frase que hacía leer mal el gráfico.
r.ok(!/La medianoche queda al centro\. Cada fila es un día\./.test(app),
     'se fue "cada fila es un día"');
r.ok(/La fecha es la del día que empieza/.test(app), 'ahora dice cuál es la fecha');
r.ok(/la siesta, el ejercicio y la cafeína de la izquierda son de ese día/.test(app),
     'y que lo de la izquierda es de ese día');
r.ok(/el despertar de la derecha\s*\n?\s*es de la mañana siguiente/.test(app) ||
     /es de la mañana siguiente/.test(app),
     'y que el despertar es del día siguiente');

r.seccion('Corriéndolo:');

const ctx = C.appEvaluada();
r.ok(!!ctx, 'la app se evalúa entera');
if (ctx) {
  const fila = function (d) { ctx.__d = d; return vm.runInContext('dmFilaActograma(__d)', ctx); };
  // El caso que reportó: se despertó el lunes 9, la siesta fue el domingo 8.
  r.ok(/dom 08-11/.test(fila('2026-11-09')),
       'despertó el lunes 9 → la fila dice domingo 8', fila('2026-11-09'));
  // Cruces de mes y de año, que es donde restar un día a mano falla.
  r.ok(/sáb 31-10/.test(fila('2026-11-01')), 'cruce de mes', fila('2026-11-01'));
  r.ok(/31-12/.test(fila('2026-01-01')), 'y de año', fila('2026-01-01'));
  // Una fecha rota no puede romper el gráfico entero.
  r.ok(typeof fila('') === 'string' && typeof fila(null) === 'string',
       'y una fecha vacía devuelve texto, no una excepción');

  // ── La posición SÍ estaba bien, y esta prueba lo fija ──
  // Si alguien "arregla" la geometría creyendo que el bug era ése, rompe
  // lo que funcionaba. El offset 0 del eje es el mediodía del día que
  // ahora rotula la fila.
  const toOff = function (t) {
    const p = t.split(':').map(Number);
    return (p[0] >= 12 ? p[0] - 12 : p[0] + 12) + (p[1] || 0) / 60;
  };
  r.ok(toOff('12:00') === 0, 'el offset 0 es el mediodía');
  r.ok(toOff('15:00') === 3, 'la siesta de las 15 cae en 3');
  r.ok(toOff('23:30') === 11.5, 'el acostarse de las 23:30 en 11,5');
  r.ok(toOff('07:30') === 19.5, 'y el despertar de las 7:30 en 19,5');
  r.ok(toOff('15:00') < toOff('23:30'),
       'o sea: la siesta queda a la IZQUIERDA del sueño de esa noche, que es lo correcto');
}

r.seccion('Lo que NO había que tocar:');

// Las asociaciones comparan la siesta contra la noche que le SIGUE, que es
// la pregunta clínica. Si alguien corriera la siesta un día "para
// arreglarla", pasaría a compararse contra la noche anterior.
r.ok(/on:e=>Number\(e\.nap_minutes\)>0/.test(app),
     'la asociación de siesta usa la misma fila');
r.ok(/La siesta se lee de la columna nap_minutes/.test(app),
     'con su comentario');

r.seccion('Y el SRI no mide lo que el texto decía:');

// Apareció revisando esto: la señal del SRI se construye SÓLO con bedtime y
// wake_time. Las siestas no entran. El texto afirmaba "Captura siestas y
// despertares", y un profesional podía leer un SRI alto como "además duerme
// siestas regulares", que no es lo que mide.
r.ok(!/Captura siestas y despertares/.test(app), 'se fue la afirmación falsa');
r.ok(/Acá se calcula sólo con el sueño nocturno/.test(app), 'ahora dice qué entra');
r.ok(/el SRI de acá queda por encima/.test(app),
     'y en qué dirección se equivoca en quien duerme siesta a diario');

r.cerrar('El dato estaba bien y el rótulo mentía: un gráfico correcto mal rotulado se lee mal entero.');
