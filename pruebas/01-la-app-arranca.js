// ¿La app corre de punta a punta?
//
// Un chequeo de sintaxis NO alcanza. "async" suelto delante de una función
// es sintácticamente válido y aun así corta el bloque entero al evaluarse:
// todo lo que venía después de esa línea deja de existir, y en el navegador
// eso se ve como botones que no hacen nada, sin ningún error visible.
// Por eso acá se EJECUTA cada bloque, no se lee.

const C = require('./comun');
const r = C.crearReporte('La app arranca');

const html = C.leerHtml();
const bs = C.bloques();

r.ok(bs.length > 0, 'el index tiene bloques de código', bs.length + ' bloques');

const ctx = C.appEvaluada({ silencioso: true });
r.ok(!!ctx, 'los ' + bs.length + ' bloques se evalúan completos');

if (ctx) {
  // Un puñado de funciones que, si faltan, la app queda de adorno.
  const imprescindibles = [
    'showScreen', 'saveDiary', 'loadDoctorSuggestions',
    'computeSleepRegularity', 'computeHabitsImpact', 'dmClaro',
    'dmColorEstado', 'dmPromedioMovil', 'dmEnviarInvitacion'
  ];
  const faltan = imprescindibles.filter(n => typeof ctx[n] !== 'function');
  r.ok(faltan.length === 0, 'están todas las funciones centrales',
       faltan.length ? 'faltan: ' + faltan.join(', ') : imprescindibles.length + ' revisadas');
}

// El "async" huérfano: válido para el parser, mortal al evaluar.
const orfanos = (html.match(/\basync\s*(\/\/[^\n]*)?\n\s*(\/\/[^\n]*\n\s*)*function\b/g) || []).length;
r.ok(orfanos === 0, 'no hay "async" sueltos antes de una función',
     orfanos ? orfanos + ' encontrados' : 'ninguno');

// El archivo tiene que estar entero. Ya pasó una vez que un script lo dejó
// en cero bytes y el error apareció recién al abrir la app.
r.ok(html.length > 500000, 'el index no quedó truncado',
     Math.round(html.length / 1024) + ' KB');
r.ok(/<\/html>\s*$/.test(html.trim()), 'el index cierra bien');

// La versión del CSS tiene que acompañar a la del HTML, si no el navegador
// sirve la hoja vieja desde su caché y los estilos nuevos no aparecen.
const vHtml = C.version(html);
const mCss = html.match(/styles\.css\?v=([^"']+)/);
r.ok(!!mCss && mCss[1] === vHtml, 'el CSS pide la misma versión que el HTML',
     mCss ? mCss[1] + ' vs ' + vHtml : 'no encontré el enlace al CSS');

r.cerrar('La app carga entera y con todo en su lugar.');
