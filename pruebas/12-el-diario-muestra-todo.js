// El diario arranca mostrando TODO el historial, no los últimos 30 días.
//
// Antes arrancaba en 30 días y eso escondía más de lo que mostraba: quien
// venía registrando hace meses veía un recorte sin enterarse de que había más
// atrás, y los promedios de la pantalla no eran los de su historia sino los
// del último mes. Con un paciente demo de 8 semanas, el colega que abre la
// app ve poco más de la mitad de lo que hay cargado.
//
// Son cuatro defaults en dos pantallas distintas (la del paciente y la del
// profesional) y alcanza con que uno vuelva a 30 para que las dos vistas
// dejen de coincidir. Por eso se comprueban los cuatro.

const C = require('./comun');
const r = C.crearReporte('El diario muestra todo');

const html = C.leerHtml();

r.seccion('Ningún período arranca recortado:');

const treinta = html.match(/tipo:'dias',\s*valor:\s*30/g) || [];
r.ok(treinta.length === 0,
     'no quedó ningún período por defecto en 30 días',
     treinta.length ? treinta.length + ' encontrados' : 'ninguno');

const ceros = html.match(/tipo:'dias',\s*valor:\s*0\b/g) || [];
r.ok(ceros.length >= 3,
     'los períodos del profesional arrancan en "todo"',
     ceros.length + ' lugares');

r.seccion('En la pantalla del paciente:');

r.ok(/const scoreEntries = subjEntries;/.test(html),
     'el panel usa todas las noches, no las de los últimos 30 días');

r.ok(/_dmPeriodoInicial = 0\b/.test(html),
     'y el período inicial es 0, que significa todo el historial');

r.seccion('Y el botón que aparece marcado es el correcto:');

// Si el botón resaltado no coincide con lo que se está mostrando, la pantalla
// miente: dice "30 d" mientras dibuja el historial completo.
const btnAll = /id="score-period-all"[^>]*class="dm-per dm-per-on"/.test(html)
            || /score-period-all[\s\S]{0,120}?dm-per dm-per-on/.test(html);
r.ok(btnAll, '"Todo" arranca resaltado');

const btn30on = /id="score-period-30"[^>]*dm-per dm-per-on/.test(html);
r.ok(!btn30on, '"30 d" ya no arranca resaltado');

r.seccion('Pero los botones para achicar siguen estando:');

for (const [id, txt] of [['score-period-7', '7 d'], ['score-period-30', '30 d'],
                         ['score-period-all', 'Todo']]) {
  r.ok(html.includes(id), 'sigue el botón ' + txt);
}
r.ok(/switchScorePeriod\(0\)/.test(html),
     'y el 0 sigue queriendo decir "todo el historial"');

r.cerrar('Mostrar de menos sin avisar es peor que mostrar de más.');
