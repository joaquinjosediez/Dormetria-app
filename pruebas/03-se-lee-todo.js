// ¿Se lee lo que está escrito en pantalla?
//
// Es el reclamo que más veces se repitió: texto oscuro sobre fondo oscuro,
// blanco sobre blanco, números de color que se pierden. Pasa porque la app
// dibuja las MISMAS tarjetas sobre dos fondos distintos —el verde oscuro
// del paciente y la hoja blanca del profesional— y los colores clínicos
// están pensados para papel.
//
// Acá no se mira: se calcula el contraste WCAG. 4,5:1 es el mínimo para
// texto normal. Lo que a mí me parece legible en un monitor bueno puede ser
// ilegible en un celular al sol.

const C = require('./comun');
const r = C.crearReporte('Se lee todo');

const html = C.leerHtml();

// Los traductores de color salen del propio index: si mañana cambian ahí,
// esta prueba cambia sola y no se queda hablando de una versión vieja.
function sacar(re, nombre) {
  const m = html.match(re);
  if (!m) throw new Error('no encontré ' + nombre + ' en el index');
  return m[0];
}
const caja = {};
(function () {
  const codigo = sacar(/var DM_CLAROS = \{[\s\S]*?\n\};/, 'DM_CLAROS') + '\n' +
                 sacar(/var DM_ESTADOS = \{[\s\S]*?\n\};/, 'DM_ESTADOS');
  require('vm').runInNewContext(codigo + '\nthis.DM_CLAROS=DM_CLAROS;this.DM_ESTADOS=DM_ESTADOS;', caja);
})();
const dmClaro = c => caja.DM_CLAROS[String(c).trim().toLowerCase()] || c;
const dmColorEstado = (p, d) => caja.DM_ESTADOS[String(p || '').trim().toLowerCase()] || d || '#6b7280';
const pillarColor = v => v >= 90 ? '#14532d' : v >= 80 ? '#1a4a3a' : v >= 70 ? '#2d9e6b' : v >= 60 ? '#d97706' : '#dc2626';

// Los dos fondos reales sobre los que se dibuja.
const VERDE  = C.aRgb('#0F2820');
const TARJETA_OSCURA = C.sobre(C.aRgb('rgba(255,255,255,0.05)'), VERDE);
const HOJA_BLANCA = C.aRgb('#ffffff');

const mide = (color, fondo) => C.contraste(C.aRgb(color), fondo);

// ── Los pilares, del lado del paciente ─────────────────────────────────
r.seccion('Pilares del sueño (fondo oscuro):');
[['CANTIDAD', '#2d9e6b'], ['FRAGMENTACIÓN', '#0e7490'], ['REGULARIDAD', '#e67e22']]
  .forEach(([nombre, color]) => {
    const c = dmClaro(color);
    const v = mide(c, TARJETA_OSCURA);
    r.ok(v >= C.MINIMO_LEGIBLE, 'rótulo ' + nombre, c + ' → ' + v.toFixed(2) + ':1');
  });

const ESTADOS = ['Muy bien', 'Bien', 'Mejorable', 'Regular', 'Requiere atención',
                 'Excelente', 'Muy buena', 'Buena', 'Baja', 'Muy baja'];
ESTADOS.forEach(st => {
  const c = dmClaro(dmColorEstado(st, '#6b7280'));
  const v = mide(c, TARJETA_OSCURA);
  r.ok(v >= C.MINIMO_LEGIBLE, 'estado "' + st + '"', c + ' → ' + v.toFixed(2) + ':1');
});

// Y cualquier número, con cualquier color de fondo de la escala.
r.seccion('Los porcentajes, en todo su rango:');
let peor = { v: 99, q: '' };
[98, 85, 75, 63, 45, 20, 0].forEach(n => {
  ESTADOS.forEach(st => {
    const c = dmClaro(dmColorEstado(st, pillarColor(n)));
    const v = mide(c, TARJETA_OSCURA);
    if (v < peor.v) peor = { v, q: n + '% "' + st + '" ' + c };
  });
});
r.ok(peor.v >= C.MINIMO_LEGIBLE, 'el peor caso posible sigue siendo legible',
     peor.q + ' → ' + peor.v.toFixed(2) + ':1');

// ── La palabra y el color no pueden contradecirse ──────────────────────
// El 63% de regularidad salía pintado del naranja de advertencia con la
// palabra "Buena" al lado. Dos mensajes opuestos en la misma tarjeta,
// porque el color y la palabra venían de escalas distintas.
r.seccion('La palabra y el color dicen lo mismo:');
const FAMILIA = { '#14532d': 'bien', '#2d9e6b': 'bien', '#d97706': 'ojo',
                  '#dc2626': 'mal', '#991b1b': 'mal' };
const ESPERADO = { 'Muy bien': 'bien', 'Excelente': 'bien', 'Muy buena': 'bien',
                   'Bien': 'bien', 'Buena': 'bien', 'Mejorable': 'ojo',
                   'Regular': 'ojo', 'Baja': 'mal', 'Muy baja': 'mal',
                   'Requiere atención': 'mal' };
const contradicciones = [];
Object.keys(ESPERADO).forEach(st => {
  [98, 85, 75, 63, 45, 20].forEach(n => {
    const fam = FAMILIA[dmColorEstado(st, pillarColor(n))] || 'neutro';
    if (fam !== ESPERADO[st]) contradicciones.push(st + ' con ' + n + '% sale "' + fam + '"');
  });
});
r.ok(contradicciones.length === 0, 'ninguna palabra sale de un color que la desmienta');
contradicciones.forEach(x => console.log('       → ' + x));

// ── La geometría de las tarjetas ───────────────────────────────────────
// Salían de distinto ancho porque había dos grillas encimadas y porque cada
// columna medía "1fr", cuyo ancho mínimo es el de la palabra más larga:
// "FRAGMENTACIÓN" empujaba más que "CANTIDAD".
r.seccion('Las tres tarjetas son iguales:');
const dom = C.domConCss(
  '<div id="diary-pillar-bars"><div><div id="c1"></div><div id="c2"></div><div id="c3"></div></div></div>');
const w = dom.window, d = w.document;
const sinEspacios = x => String(x || '').replace(/\s+/g, '');
const cont = d.getElementById('diary-pillar-bars');
r.ok(sinEspacios(w.getComputedStyle(cont).display) === 'block',
     'el contenedor no es una segunda grilla', w.getComputedStyle(cont).display || '(vacío)');
const grilla = w.getComputedStyle(cont.firstElementChild).getPropertyValue('grid-template-columns');
r.ok(sinEspacios(grilla).includes('repeat(3,minmax(0,1fr))'),
     'las columnas pueden achicarse por igual', grilla || '(vacío)');
// El min-width tampoco se le pregunta al motor: jsdom 24 y jsdom 30 no
// contestan lo mismo. Se lee la regla, que es además lo correcto — esto es
// una decisión de CSS, no una medición de layout.
const reglasCss = C.reglasDe();
const puedenAchicarse = reglasCss.some(x =>
  x.sel.includes('#diary-pillar-bars > div > div') && /min-width\s*:\s*0/.test(x.cuerpo));
r.ok(puedenAchicarse, 'ninguna tarjeta se ensancha por su texto');

r.cerrar('Contraste por encima de 4,5:1 y tarjetas parejas.');
