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
//
// ── mod266 ───────────────────────────────────────────────────────────
// El bloque del DÍA ya no viaja: las siestas pasaron a ser un separador
// adentro de la misma tarjeta que la noche. Dos cajas de alto distinto en una
// fila de dos celdas dejaban media columna en blanco, porque casi ningún
// adulto tiene suficientes datos de siesta para llenarla.
//
// Lo que esta prueba sigue cuidando es el defecto de fondo, que no era el
// layout: buscar por id un bloque que existe DOS VECES en el DOM. Sigue
// pasando con el técnico de regularidad y con el resumen de 24 h, que sí
// viajan. Las aserciones sobre la tarjeta de día se reemplazan por su
// contrario: que no vuelva.

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
r.ok(/class="dm-bloque-reg"/.test(app),
     'y el técnico de regularidad, que no tenía marca');
r.ok(/class="dm-bloque-resumen24 /.test(app),
     'y el resumen de 24 h, que también viaja');
r.ok(!/id="dm-bloque-(dia|reg|resumen24)"/.test(app),
     'ninguno usa id, que se duplicaba entre pantallas');

// Dos variantes del bloque de regularidad: con noches suficientes y sin
// ellas. Si solo una lleva la marca, la otra se queda en la izquierda.
r.ok((app.match(/class="dm-bloque-reg"/g) || []).length >= 2,
     'las dos variantes del bloque la llevan, no solo la que tiene datos');

r.seccion('Y se los busca DENTRO del contenedor del profesional:');

const bloque = app.slice(app.indexOf("const _regSlot=document.getElementById('dr-reg-slot')"),
                         app.indexOf("const _regSlot=document.getElementById('dr-reg-slot')") + 4000);
r.ok(/dme\.querySelector\('\.dm-bloque-reg'\)/.test(bloque),
     'la regularidad, acotada a dme');
r.ok(/dme\.querySelector\('\.dm-bloque-resumen24'\)/.test(bloque),
     'el resumen de 24 h también');
r.ok(!/getElementById\('dm-bloque/.test(app),
     'y no queda ninguna búsqueda global de estos bloques');
r.ok(!/dme\.children\[1\]/.test(bloque),
     'ni children[1], que apuntaba al elemento equivocado');

r.seccion('El día NO va a una columna aparte: va en la misma caja:');

// La fila de dos celdas se hizo para comparar noche y día de un vistazo. En
// la práctica, la caja del día casi siempre es mucho más baja —tres filas
// contra diez— y queda media columna en blanco. Una debajo de la otra, en la
// misma grilla de rótulo y valor, se comparan mejor que en diagonal.
r.ok(!/dm-bloque-dia/.test(app), 'ya no hay tarjeta de día');
r.ok(!/_nd\.appendChild\(_dia\)/.test(app), 'ni nada que mudarla');
r.ok(/<div class="dm-met-col-h" style="margin-top:14px">Día · siestas<\/div>/.test(app),
     'es un separador, el mismo recurso que ya separa "Noche"');
r.ok(/#dr-noche-dia:empty[^}]*display:none/.test(css.replace(/\s+/g, ' ')),
     'y el contenedor que la alojaba se esconde solo al quedar vacío');

// Esto se comprueba RENDERIZANDO, no buscando un texto. La primera versión
// de aquel arreglo falló justamente acá: `dmFilasSiestas` devolvía una fila
// que decía "Ninguna" —texto, no vacío— así que la guarda nunca se activaba.
// Un `test()` sobre el fuente no lo habría visto.
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
const cajasDe = function (expr) {
  const h = vm.runInContext(expr, ctx);
  const d = new JSDOM('<div id="c">' + h + '</div>');
  const c = d.window.document.getElementById('c');
  return { n: c.querySelectorAll(':scope > .dm-metricas').length,
           txt: (c.textContent || '').replace(/\s+/g, ' '),
           html: h };
};
const sinDia = cajasDe('renderClinicalMetricsHtml(_sinS, "doctor", 35)');
const conDia = cajasDe('renderClinicalMetricsHtml(_conS, "doctor", 35)');

r.ok(sinDia.n === 1 && conDia.n === 1,
     'en un adulto es UNA caja, haya siestas o no',
     sinDia.n + ' y ' + conDia.n);
r.ok(/Día · siestas/.test(sinDia.txt) && /Día · siestas/.test(conDia.txt),
     'y el separador está en los dos casos');
r.ok(/Ninguna siesta en los 20 días/.test(sinDia.txt),
     'sin siestas, la ausencia se informa adentro');
r.ok(/Días con siesta/.test(conDia.txt), 'con siestas, van las cifras');
// Un div sin cerrar se ve como "se me cortó media ficha" y no deja error.
[sinDia, conDia].forEach(function (c, i) {
  r.ok((c.html.match(/<div/g) || []).length === (c.html.match(/<\/div>/g) || []).length,
       '  los div cierran (' + (i ? 'con' : 'sin') + ' siestas)');
});

// "No durmió siesta en 20 días con el dato" es un hallazgo; "no cargó el
// dato" no dice nada del paciente. No pueden decir lo mismo.
const vacias = sinSiestas.map(function (e) {
  const c = Object.assign({}, e); delete c.nap_minutes; delete c.notes; return c;
});
ctx._vac = vacias;
r.ok(/Sin el dato de siestas cargado/.test(cajasDe('renderClinicalMetricsHtml(_vac, "doctor", 35)').txt),
     'y no se confunde con no haber cargado el dato');

r.seccion('En pediatría, las tres cifras de 24 h van arriba y a lo ancho:');

// Si viven adentro del bloque de la noche, la tarjeta de la izquierda
// arranca con ellas y la de la derecha con "Sueño diurno": los dos
// encabezados que uno quiere comparar quedan a alturas distintas.
r.ok(/dm-bloque-resumen24/.test(app), 'el resumen de 24 h es su propio bloque');
r.ok(/id="dr-resumen24"/.test(app), 'con su propia fila');
r.ok(/_res\.appendChild\(_r24\)/.test(bloque), 'y se lo muda ahí');
r.ok(/Sueño nocturno/.test(app) && /Día · siestas/.test(app),
     'y debajo arranca el detalle de la noche y el del día, en la misma caja');

r.seccion('La regularidad técnica queda bajo el actograma:');

r.ok(/_regSlot\.appendChild\(_reg\)/.test(bloque),
     'en la columna derecha, que es donde se lee junto a los horarios');

r.seccion('Y la variante clara es blanca de verdad (no es cosa del CSS):');

// Se le pregunta al motor, no a la hoja: si las dos variantes computaran
// igual, el síntoma podría ser de CSS y no de un id repetido.
const dom = C.domConCss(
  '<div class="dm-metricas dm-metricas-claro" id="a">x</div>' +
  '<div class="dm-metricas" id="b">x</div>');
const gc = function (id) {
  const el = dom.window.document.getElementById(id);
  return dom.window.getComputedStyle(el).backgroundColor;
};
r.ok(/rgb\(255,\s*255,\s*255\)|#fff/i.test(gc('a')),
     'con la clase clara, fondo blanco', gc('a'));
r.ok(gc('a') !== gc('b'),
     'y sin ella no: por eso se notaba cuál de las dos tarjetas se había movido');

r.cerrar('Un cuadro que aparece en la columna de al lado no tira ningún error.');
