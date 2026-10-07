// renderClinicalMetricsHtml devuelve varias cajas y el panel del profesional
// muda dos de ellas a la columna derecha. Lo hacía con `dme.children[1]`.
//
// Cuando se agregó el bloque del DÍA, ese pasó a ser el segundo hijo. Así que
// `children[1]` lo movía a él, y dos líneas después se lo volvía a mover —al
// mismo elemento— mientras el bloque técnico de regularidad se quedaba en la
// columna izquierda. No tiró ningún error: simplemente el cuadro apareció
// donde no iba, y el de sueño diurno quedó desfasado del nocturno, que es
// justo la comparación para la que se los puso uno al lado del otro.
//
// Y el id tampoco servía: la MISMA función dibuja estos bloques en el diario
// del propio paciente, cuya pantalla queda en el DOM aunque esté oculta. Con
// el mismo id en las dos, getElementById devuelve el primero en orden de
// documento — el del paciente, pintado para fondo verde oscuro. Por eso la
// tarjeta de sueño diurno aparecía VERDE en medio de tarjetas blancas: no era
// un problema de CSS, era la tarjeta de otra pantalla.
//
// Se marcan con clase y se buscan dentro del contenedor del profesional.

const C = require('./comun');
const r = C.crearReporte('Las tarjetas que se mudan de columna');

const app = C.leerApp();
const css = C.leerCss();

r.seccion('Los dos bloques que viajan se marcan con CLASE, no con id:');

// La misma función dibuja estos bloques en el diario del propio paciente,
// que queda en el DOM aunque su pantalla esté oculta. Con id, los dos
// existen a la vez y `getElementById` devuelve el primero en orden de
// documento: el del paciente, pintado para fondo verde oscuro. Eso es lo
// que hacía aparecer la tarjeta de sueño diurno en verde en medio de
// tarjetas blancas. No era CSS: era la tarjeta de otra pantalla.
r.ok(/class="dm-bloque-dia/.test(app), 'el bloque de sueño diurno');
r.ok(/class="dm-bloque-reg"/.test(app),
     'y el técnico de regularidad, que no tenía marca');
r.ok(!/id="dm-bloque-(dia|reg)"/.test(app),
     'y ninguno de los dos usa id, que se duplicaba entre pantallas');

// Dos variantes del bloque de regularidad: con noches suficientes y sin
// ellas. Si solo una lleva la marca, la otra se queda en la izquierda.
r.ok((app.match(/class="dm-bloque-reg"/g) || []).length >= 2,
     'las dos variantes del bloque la llevan, no solo la que tiene datos');

r.seccion('Y se los busca DENTRO del contenedor del profesional:');

const bloque = app.slice(app.indexOf("const _regSlot=document.getElementById('dr-reg-slot')"),
                         app.indexOf("const _regSlot=document.getElementById('dr-reg-slot')") + 4000);
r.ok(/dme\.querySelector\('\.dm-bloque-reg'\)/.test(bloque),
     'la regularidad, acotada a dme');
r.ok(/dme\.querySelector\('\.dm-bloque-dia'\)/.test(bloque),
     'el día también');
r.ok(!/getElementById\('dm-bloque/.test(app),
     'y no queda ninguna búsqueda global de estos bloques');
r.ok(!/dme\.children\[1\]/.test(bloque),
     'ni children[1], que apuntaba al elemento equivocado');

r.seccion('Noche y día van a una fila propia, no a columnas distintas:');

// Emparejarlas "a ojo" no funciona: cada columna arranca donde termina lo
// que tiene encima, y eso no mide lo mismo de un lado que del otro. Las dos
// tarjetas que uno quiere comparar tienen que ser celdas de la MISMA fila.
r.ok(/id="dr-noche-dia"/.test(app), 'existe la fila');
r.ok(/_nd\.appendChild\(_noche\)/.test(bloque), 'las métricas nocturnas entran ahí');
r.ok(/_nd\.appendChild\(_dia\)/.test(bloque), 'y las diurnas también');
const iNoche = bloque.indexOf("_nd.appendChild(_noche)");
const iDia   = bloque.indexOf("_nd.appendChild(_dia)");
r.ok(iNoche >= 0 && iDia >= 0 && iNoche < iDia,
     'la noche a la izquierda, el día a la derecha');

r.seccion('Pero solo si hay algo que poner del lado del día:');

// Un adulto que no duerme siesta no necesita una tarjeta entera para
// informar que no duerme siesta — y menos que las métricas clínicas se
// corran media pantalla hacia abajo para emparejarse con un recuadro vacío.
// Y desde mod259, tampoco con una tarjeta de día ANÉMICA: tres filas al
// lado de diez dejan media columna en blanco. El criterio completo y su
// porqué están en pruebas/69; acá alcanza con que la guarda siga ahí.
r.ok(/if\(_nd && _dia && _filasEnDia >= 5\)\{/.test(bloque),
     'sin tarjeta de día —o con una de tres filas— no se mueve nada');
r.ok(/#dr-noche-dia:empty[^}]*display:none/.test(css.replace(/\s+/g, ' ')),
     'y el contenedor vacío no aporta un hueco');

// Esto se comprueba RENDERIZANDO, no buscando un texto. La primera versión
// del arreglo falló justamente acá: `dmFilasSiestas` devolvía una fila que
// decía "Ninguna" —texto, no vacío— así que la guarda nunca se activaba y la
// tarjeta se seguía emitiendo. Un `test()` sobre el fuente no lo habría visto.
const vm = require('vm');
const ctx = C.appEvaluada({ silencioso: true });
const { JSDOM } = require('jsdom');
const noche = function (k, conSiesta) {
  const d = new Date(2026, 7, 1 + k);
  const e = {
    diary_date: d.toISOString().slice(0, 10), bedtime: '23:30', wake_time: '07:30',
    sleep_minutes: 440, sleep_latency_mins: 25, awakenings: 1,
    wake_in_bed_mins: 20, sleep_quality: 3, day_type: 'work', nap_minutes: 0
  };
  if (conSiesta) e.notes = 'Siestas: [{"start":"13:' + (10 + k % 40) + '","end":"14:' + (40 + k % 15) + '"}]';
  return e;
};
const sinSiestas = [], conSiestas = [];
for (let k = 0; k < 20; k++) { sinSiestas.push(noche(k, false)); conSiestas.push(noche(k, true)); }
ctx._sinS = sinSiestas; ctx._conS = conSiestas;
const bloquesDe = function (expr) {
  const h = vm.runInContext(expr, ctx);
  const d = new JSDOM('<div id="c">' + h + '</div>');
  return [...d.window.document.getElementById('c').children]
    .map(function (x) { return { cls: x.className || '', txt: (x.textContent || '').replace(/\s+/g, ' ') }; });
};
const sinDia = bloquesDe('renderClinicalMetricsHtml(_sinS, "doctor", 35)');
const conDia = bloquesDe('renderClinicalMetricsHtml(_conS, "doctor", 35)');
const hayDia = function (bs) { return bs.some(function (b) { return /dm-bloque-dia/.test(b.cls); }); };

r.ok(!hayDia(sinDia), 'veinte noches sin siestas: NO se emite tarjeta de día',
     sinDia.length + ' bloques');
r.ok(hayDia(conDia), 'con siestas sí se emite', conDia.length + ' bloques');
r.ok(/Ninguna siesta en los 20 días/.test(sinDia[0].txt),
     'y la ausencia se informa adentro del bloque de la noche');
// "No durmió siesta en 20 días con el dato" es un hallazgo; "no cargó el
// dato" no dice nada del paciente. No pueden decir lo mismo.
const vacias = sinSiestas.map(function (e) {
  const c = Object.assign({}, e); delete c.nap_minutes; delete c.notes; return c;
});
ctx._vac = vacias;
const sinDato = bloquesDe('renderClinicalMetricsHtml(_vac, "doctor", 35)');
r.ok(/Sin el dato de siestas cargado/.test(sinDato[0].txt),
     'y no se confunde con no haber cargado el dato');

r.seccion('En pediatría, las tres cifras de 24 h van arriba y a lo ancho:');

// Si viven adentro del bloque de la noche, la tarjeta de la izquierda
// arranca con ellas y la de la derecha con "Sueño diurno": los dos
// encabezados que uno quiere comparar quedan a alturas distintas.
r.ok(/dm-bloque-resumen24/.test(app), 'el resumen de 24 h es su propio bloque');
r.ok(/id="dr-resumen24"/.test(app), 'con su propia fila');
r.ok(/_res\.appendChild\(_r24\)/.test(bloque), 'y se lo muda ahí');
r.ok(/Sueño nocturno/.test(app) && /Sueño diurno/.test(app),
     'así los dos detalles arrancan por su encabezado, parejos');
r.ok(/#dr-noche-dia\{[^}]*display:grid/.test(css),
     'y la fila es una grilla, así que las dos arrancan a la misma altura');
r.ok(/align-items:stretch/.test(css.slice(css.indexOf('#dr-noche-dia'))),
     'con la misma altura, no solo el mismo borde de arriba');

r.seccion('La regularidad técnica queda bajo el actograma:');

r.ok(/_regSlot\.appendChild\(_reg\)/.test(bloque),
     'en la columna derecha, que es donde se lee junto a los horarios');

r.seccion('Y la variante clara es blanca de verdad (no es cosa del CSS):');

// Se le pregunta al motor, no a la hoja: si las dos variantes computaran
// igual, el síntoma podría ser de CSS y no de un id repetido.
const dom = C.domConCss(
  '<div class="dm-bloque-dia dm-metricas dm-metricas-claro" id="a">x</div>' +
  '<div class="dm-bloque-dia dm-metricas" id="b">x</div>');
const gc = function (id) {
  const el = dom.window.document.getElementById(id);
  return dom.window.getComputedStyle(el).backgroundColor;
};
r.ok(/rgb\(255,\s*255,\s*255\)|#fff/i.test(gc('a')),
     'con la clase clara, fondo blanco', gc('a'));
r.ok(gc('a') !== gc('b'),
     'y sin ella no: por eso se notaba cuál de las dos tarjetas se había movido');

r.cerrar('Un cuadro que aparece en la columna de al lado no tira ningún error.');
