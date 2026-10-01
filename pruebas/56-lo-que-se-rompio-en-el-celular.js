// Cuatro cosas que se veían bien en el monitor y mal en el teléfono. Las
// cuatro tienen la misma forma: un valor pensado para un contexto —un color
// de fondo, un padre en flujo normal, un ancho de 900 px— usado en otro.
//
//   1. Las unidades de los pilares ("h", "m", "min", "desp/noche") vienen
//      en crema fija dentro del HTML del valor. Sobre la tarjeta blanca del
//      panel quedaban blancas sobre blanco: "10h 05m" se leía "10  05".
//   2. La cabecera del forest plot centraba el cero con position:absolute
//      sobre un flex con space-between, y el rótulo de la escala era un
//      cuarto hijo del mismo flex. En el teléfono ese rótulo entra en flujo
//      con margin-left:auto y rompe el reparto: "paradójico" y "congruente"
//      terminaban los dos sobre la mitad roja.
//   3. El par Generalista/Especialista era un inline-flex dentro de un grid,
//      donde deja de encogerse al contenido y se estira a todo el ancho.
//   4. La tarjeta de Evolución ponía rótulo y cifras en la misma fila flex:
//      el rótulo con nowrap ocupaba la línea entera y las cifras, con
//      flex-basis 0, nunca llegaban a envolver — se quedaban con ~0 px y los
//      valores se desbordaban unos sobre otros.

const C = require('./comun');
const r = C.crearReporte('Lo que se rompió en el celular');

const app = C.leerApp();
const css = C.leerCss();
const reglas = C.reglasDe(css);
const sel = function (s) { return reglas.filter(function (x) { return x.sel === s; }); };

r.seccion('Las unidades de los pilares, legibles sobre blanco:');

r.ok(/dm-pil-card'\+\(_oscuroP\?'':' dm-pil-claro'\)/.test(app),
     'la tarjeta se marca cuando va sobre blanco');
const claro = sel('.dm-pil-claro [style*="rgba(244,239,229"]');
r.ok(claro.length === 1, 'y hay una regla que recolorea el crema fijo');

// Medido, no "se ve bien": el crema original sobre blanco da ~1,1:1.
const dom = C.domConCss(
  '<div class="dm-pil-card dm-pil-claro" style="background:#fff">' +
    '<div class="dm-pil-val" id="v">10<span id="u" style="color:rgba(244,239,229,.72)">h</span></div>' +
  '</div>' +
  '<div class="dm-pil-card" style="background:#1a3028">' +
    '<div class="dm-pil-val">10<span id="u2" style="color:rgba(244,239,229,.72)">h</span></div>' +
  '</div>');
const col = function (id) {
  return dom.window.getComputedStyle(dom.window.document.getElementById(id)).color;
};
const cr = C.contraste(C.sobre(C.aRgb(col('u')), C.aRgb('#ffffff')), C.aRgb('#ffffff'));
r.ok(cr >= C.MINIMO_LEGIBLE,
     'la unidad llega al mínimo legible sobre la tarjeta blanca',
     cr.toFixed(2) + ':1');
r.ok(col('u2') !== col('u'),
     'y sobre la tarjeta verde se sigue usando el crema, que es donde sí funciona');

r.seccion('El cero de la cabecera queda al medio por construcción:');

const esc = sel('.dm-aguja-escala');
const grid = esc.filter(function (x) { return /display:grid/.test(x.cuerpo); });
r.ok(grid.length >= 1, 'la píldora es una grilla, no un flex con space-between');
r.ok(grid.some(function (x) { return /grid-template-columns:\s*1fr auto 1fr/.test(x.cuerpo); }),
     '1fr / auto / 1fr: el cero no depende de un porcentaje');
r.ok(sel('.dm-aguja-escala b').some(function (x) { return /position:static/.test(x.cuerpo); }),
     'y ya no se lo posiciona en absoluto sobre el 50 %');
r.ok(/dm-aguja-escala-pie/.test(app),
     'el rótulo de la escala salió afuera de la píldora');
r.ok(!/<u>correlación|<u>tamaño del efecto/.test(app),
     'y no quedó como cuarto hijo del reparto');

r.seccion('El par Generalista / Especialista, del ancho de sus botones:');

r.ok(/class="dm-modo-wrap"/.test(app), 'el par va envuelto en un bloque');
r.ok(sel('.dm-modo-wrap').some(function (x) { return /display:block/.test(x.cuerpo); }),
     'que es de bloque, así el inline-flex de adentro vuelve a encogerse');

r.seccion('La tarjeta de Evolución se apila en pantalla angosta:');

r.ok(/class="dm-evo-fila"/.test(app), 'la fila tiene clase propia');
r.ok(/class="dm-evo-cab"/.test(app), 'y el rótulo también');
const apila = reglas.filter(function (x) {
  return x.sel === '.dm-evo-fila' && /flex-direction:column/.test(x.cuerpo);
});
r.ok(apila.length >= 1, 'y hay una regla que la apila');
r.ok(!/margin-top:2px;white-space:nowrap">' \+\s*\n?\s*muestraTxt/.test(app),
     'el texto de la muestra ya no va en nowrap');

r.cerrar('Un color, un padre y un ancho: los tres estaban bien en el contexto equivocado.');
