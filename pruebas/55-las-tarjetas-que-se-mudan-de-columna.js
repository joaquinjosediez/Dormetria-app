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
                         app.indexOf("const _regSlot=document.getElementById('dr-reg-slot')") + 2200);
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
