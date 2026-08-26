// ¿La noche del domingo al lunes es laboral o libre?
//
// El registro del diario es de la MAÑANA en que la persona se despertó — así
// lo dice el campo de la fecha y así lo calcula la detección automática. Lo
// que define si una noche fue "laboral" es si esa mañana había que levantarse
// con horario. La noche del domingo al lunes es una NOCHE LABORAL, aunque uno
// se haya acostado un domingo.
//
// Pero la pregunta decía «¿AYER fue día laboral o libre?», que apunta al día
// anterior. En un registro del lunes, la detección automática ponía "laboral"
// —bien— y la pregunta invitaba a contestar por el domingo, que es libre. El
// paciente corregía a mano lo que estaba bien.
//
// No es un detalle de redacción: de acá salen el jet lag social, el cronotipo
// MCTQ y toda la comparación entre noches libres y laborales. Un lunes
// marcado libre corre el punto medio del fin de semana e infla el jet lag
// social de esa persona.

const C = require('./comun');
const r = C.crearReporte('Día libre o laboral');

const ctx = C.appEvaluada();
if (!ctx) { console.log('  La app no arranca.'); process.exitCode = 1; return; }
const { D, $, corr } = C.conDom(ctx);

function formulario(fecha, badge, valor) {
  D.body.innerHTML = '<input id="d-date" value="' + fecha + '">' +
    '<span id="d-daytype-auto-badge">' + (badge || '') + '</span>' +
    '<div id="d-daytype-ayuda"></div>' +
    '<button id="d-daytype-work"></button><button id="d-daytype-free"></button>' +
    '<input type="hidden" id="d-daytype" value="' + (valor || '') + '">';
}

r.seccion('La detección automática mira la mañana, no la noche anterior:');
const casos = [
  ['2026-08-24', 'lunes',   'work'],
  ['2026-08-25', 'martes',  'work'],
  ['2026-08-28', 'viernes', 'work'],
  ['2026-08-29', 'sábado',  'free'],
  ['2026-08-30', 'domingo', 'free'],
  ['2026-08-31', 'lunes',   'work']
];
casos.forEach(([fecha, nombre, esperado]) => {
  formulario(fecha);
  corr('autoDetectDayType()');
  const v = $('d-daytype').value;
  r.ok(v === esperado, 'despertarse un ' + nombre + ' → ' + (esperado === 'work' ? 'laboral' : 'libre'),
       v || '(vacío)');
});

r.seccion('Y se lo dice al paciente sin ambigüedad:');
formulario('2026-08-24');
corr('autoDetectDayType()');
r.ok(/lunes/.test($('d-daytype-ayuda').innerHTML), 'la ayuda nombra el día del que habla');
r.ok(/mañana/.test($('d-daytype-ayuda').innerHTML), 'y aclara que es la mañana');

const html = C.leerHtml();
r.ok(!/¿Ayer fue día laboral o libre\?/.test(html),
     'la pregunta ya no dice "ayer", que apuntaba al día equivocado');

r.seccion('Todo el resto del cálculo usa el mismo criterio:');
// Si alguna parte de la app decidiera "libre" mirando el día anterior, el
// jet lag social y el cronotipo saldrían corridos un día entero.
const usos = (html.match(/getDay\(\)===0\|\|[^)]*getDay\(\)===6|_dow===0\|\|_dow===6|d===0\|\|d===6/g) || []).length;
r.ok(usos >= 3, 'sábado y domingo se calculan desde diary_date en todos lados', usos + ' lugares');
r.ok(!/diary_date.*-\s*1\s*\)\s*\.getDay\(\)/.test(html),
     'ningún cálculo resta un día antes de mirar el día de la semana');

r.seccion('Lo que el paciente marcó a mano manda sobre lo automático:');
// Turnos, francos, feriados, gente que trabaja sábados. La corrección manual
// no se puede pisar.
formulario('2026-08-24', 'Modificado', 'free');
corr('autoDetectDayType()');
r.ok($('d-daytype').value === 'free',
     'un lunes marcado libre a mano se respeta (turnos, francos, vacaciones)');

r.cerrar('La noche del domingo al lunes cuenta como laboral, que es lo correcto.');
