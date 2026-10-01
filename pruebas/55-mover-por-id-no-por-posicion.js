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
// Mover por posición es apostar a que nadie agregue nada antes. Se mueve por
// id, que es lo único que sobrevive a que el HTML crezca.

const C = require('./comun');
const r = C.crearReporte('Mover por id, no por posición');

const app = C.leerApp();

r.seccion('Los dos bloques que viajan tienen id propio:');

r.ok(/id="dm-bloque-dia"/.test(app), 'el bloque de sueño diurno');
r.ok(/id=\\?"dm-bloque-reg\\?"|id="dm-bloque-reg"/.test(app),
     'y el técnico de regularidad, que no lo tenía');

// Dos variantes del bloque de regularidad: con noches suficientes y sin
// ellas. Si solo una lleva el id, la otra se queda en la izquierda.
r.ok((app.match(/dm-bloque-reg/g) || []).length >= 3,
     'las dos variantes del bloque lo llevan, no solo la que tiene datos');

r.seccion('Y se los mueve por id:');

const bloque = app.slice(app.indexOf("const _regSlot=document.getElementById('dr-reg-slot')"),
                         app.indexOf("const _regSlot=document.getElementById('dr-reg-slot')") + 1400);
r.ok(/getElementById\('dm-bloque-reg'\)/.test(bloque),
     'la regularidad se busca por id');
r.ok(/getElementById\('dm-bloque-dia'\)/.test(bloque),
     'el día también');
r.ok(!/dme\.children\[1\]/.test(bloque),
     'y ya no se usa children[1], que apuntaba al elemento equivocado');

r.seccion('El orden es regularidad primero, día después:');

// Es lo que empareja las alturas: a la izquierda las métricas nocturnas, a
// la derecha el actograma, la regularidad y recién entonces las siestas.
const iReg = bloque.indexOf("appendChild(_reg)");
const iDia = bloque.indexOf("appendChild(_dia)");
r.ok(iReg >= 0 && iDia >= 0 && iReg < iDia,
     'así el cuadro de sueño diurno queda a la altura del nocturno');

r.cerrar('Un cuadro que aparece en la columna de al lado no tira ningún error.');
