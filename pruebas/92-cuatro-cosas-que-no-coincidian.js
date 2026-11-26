// Cuatro reportes del mismo día, y uno de ellos lo había causado yo.
//
// ── 1 · La lista decía una fecha y el formulario otra ────────────────
//
// mod295 cambió el rótulo de la fila del actograma al día en que la noche
// EMPIEZA —la convención correcta— y de paso cambió igual la lista de
// registros. Eso estuvo mal:
//
//     la lista decía   "Miércoles, 25 de noviembre"
//     y al tocarla el formulario decía   26/11/2026
//
// Las dos son ciertas: esa noche empezó el 25 y se despertó el 26. Pero en
// una lista donde cada fila se ABRE no se puede mostrar una sola de las
// dos: la persona lee una contradicción y concluye que le falta cargar una
// noche que ya cargó. Que es exactamente lo que reportó.
//
// En un eje de actograma una sola fecha alcanza, porque el gráfico explica
// arriba qué es una fila. En una lista no hay dónde explicarlo.
//
// ── 2 · "A veces no funciona el botón de Ver la semana 3" ────────────
//
// No era "a veces": no funcionaba nunca en la mayoría de los navegadores.
//
// ── 3 · 33 % del lado del paciente, 0 % del lado del profesional ─────
//
// Los dos correctos, midiendo cosas distintas, con el mismo símbolo.
//
// ── 4 · "En muchos pacientes no me marca la evolución" ───────────────
//
// El estado sólo se subía al abrir la pantalla del programa.

const C = require('./comun');
const vm = require('vm');
const fs = require('fs');
const path = require('path');
const r = C.crearReporte('Cuatro cosas que no coincidían');

const app = C.leerApp();
const tcci = fs.readFileSync(path.join(__dirname, '..', 'js', 'dormetria-tcci.js'), 'utf8');
const res  = fs.readFileSync(path.join(__dirname, '..', 'js', 'dormetria-render-resumen.js'), 'utf8');

r.seccion('1 · En una lista, la noche se nombra entera:');

r.ok(/function dmNocheRango\(diaryDate\)\{/.test(app), 'hay un formato de rango');
r.ok(/try\{ fecha=dmNocheRango\(e\.diary_date\); \}catch/.test(app),
     'y lo usa la lista de registros');
r.ok(/f='noche del '\+dmNocheRango\(e\.diary_date\)/.test(app),
     'y el globo de la nota');
// El actograma SÍ se queda con una sola fecha: ahí el encabezado explica
// qué es una fila, y un eje con rangos no entra.
r.ok(/const actoLabels=sorted\.map\(e=>dmFilaActograma\(e\.diary_date\)\)/.test(app),
     'el actograma se queda con el día de inicio, que es su convención');
r.ok(/En un eje de actograma una sola fecha alcanza/.test(app),
     'con el motivo de por qué son distintos');

if (true) {
  const ctx0 = C.appEvaluada();
  if (ctx0) {
    const rango = function (d) { ctx0.__d = d; return vm.runInContext('dmNocheRango(__d)', ctx0); };
    // El caso exacto del reporte.
    r.ok(/mié 25/.test(rango('2026-11-26')) && /jue 26/.test(rango('2026-11-26')),
         'la noche del 26 se nombra "mié 25 → jue 26"', rango('2026-11-26'));
    // Cruzando de mes, "30 → 1" no dice de qué meses.
    r.ok(/noviembre/.test(rango('2026-12-01')) && /diciembre/.test(rango('2026-12-01')),
         'y cruzando de mes se nombran los dos', rango('2026-12-01'));
    r.ok(rango('2026-11-26').indexOf('noviembre') === rango('2026-11-26').lastIndexOf('noviembre'),
         'dentro del mismo mes, el mes se nombra una sola vez', rango('2026-11-26'));
  }
}

r.seccion('2 · El botón del modal no se busca a sí mismo:');

// El botón buscaba su propio modal con un selector sobre el TEXTO del
// atributo style: [style*='z-index:10005']. El modal se crea con cssText y
// el navegador REESCRIBE esa cadena al guardarla — Chrome y Safari
// serializan "z-index: 10005", con espacio. El selector no matcheaba, el
// `?.` se tragaba el null, y la semana siguiente se abría DETRÁS del modal.
r.ok(!/querySelector\(\\?'\[style\*=/.test(tcci) && !/style\*=.*z-index/.test(tcci.replace(/^\s*\/\/.*$/gm, '')),
     'se fue el selector sobre el texto del style');
r.ok(/const ir = w\.querySelector\('\[data-ir\]'\)/.test(tcci),
     'los handlers se enganchan al nodo');
r.ok(/w\.remove\(\);\s*\/\/ primero se saca/.test(tcci),
     'y el modal se saca ANTES de abrir la semana siguiente');
r.ok(/el navegador REESCRIBE esa cadena/.test(tcci),
     'con el motivo escrito, que es lo que evita que vuelva');
// Si abrir la semana tira, tiene que verse.
r.ok(/catch\(e\)\{ console\.error\('\[TCCI\] abrir semana', e\); \}/.test(tcci),
     'y si abrir la semana falla, queda en la consola');

r.seccion('3 · El profesional ve el mismo número que el paciente:');

r.ok(/const pctTareas = \(t\.pct != null\) \? t\.pct/.test(res),
     'se usa el pct que el paciente ya sube');
r.ok(/de las tareas/.test(res), 'y se rotula qué es');
// Las semanas cerradas son el dato clínico y siguen estando, pero en la
// frase y en las barras, sin competir con el número grande.
r.ok(/\(' \+ pctSem \+ ' %\) desde que empezó/.test(res),
     'y las semanas cerradas quedan en la frase, con su propio porcentaje');
r.ok(/la conversación arranca\s*\n\s*\/\/ discutiendo cuál de los dos miente/.test(res),
     'con el motivo: dos números distintos rompen la consulta');

r.seccion('4 · Y el estado se sube al entrar a la app, no al programa:');

r.ok(/try\{\s*\n\s*if\(typeof dmTcciSincronizarEstado==='function'\) dmTcciSincronizarEstado\(\);/.test(app),
     'showHome lo sincroniza');
r.ok(/sube el estado al entrar a la app, no al entrar al programa/.test(app),
     'con el motivo escrito');

r.seccion('Y una que apareció buscando lo anterior:');

// maybePromptReevalScales no se invocaba desde NINGÚN lado. Todo el aviso
// de reevaluación de mod291 —con su tabla de intervalos por escala— estaba
// escrito, probado y muerto. Una prueba que mira el contenido de una
// función no detecta que nadie la llama.
r.ok(/try\{ maybePromptReevalScales\(\); \}catch/.test(app),
     'maybePromptReevalScales ahora SE LLAMA');
r.ok(/no se invocaba desde NINGÚN lado/.test(app),
     'y queda escrito que durante un tiempo no se llamó desde ningún lado');
// El guardarraíl: que cada función de pantalla del paciente tenga quien la
// llame. Se cuentan las invocaciones, no las definiciones.
['maybePromptReevalScales', 'dmPintarLeerHome', 'dmTcciSincronizarEstado'].forEach(function (f) {
  const usos = (app.match(new RegExp(f + '\\(\\)', 'g')) || []).length;
  r.ok(usos >= 2, '  ' + f + ' está definida Y llamada', usos + ' apariciones');
});

r.cerrar('Una función escrita, probada y que nadie llama es exactamente igual a no tenerla.');
