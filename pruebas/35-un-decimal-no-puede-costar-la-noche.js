// Una paciente cargó su diario y le saltó:
//
//     Error al guardar: invalid input syntax for type integer: "0.8"
//
// Había tomado una bebida de 0,8 unidades de alcohol. alcohol_drinks es
// integer en la base, PostgREST rechazó el INSERT y se perdió LA NOCHE
// ENTERA — no el dato del alcohol: el registro completo, con los horarios,
// la calidad, el ánimo y todo lo demás.
//
// Lo mismo puede pasar con la cafeína, que suma miligramos y puede dar
// 62.5.
//
// La solución de fondo es que esas columnas sean numeric. Hasta que corra
// esa migración, redondear el valor culpable y dejar constancia es mucho
// menos grave que perder la noche.

const C = require('./comun');
const r = C.crearReporte('Un decimal no puede costar la noche entera');

const html = C.leerHtml();
const i = html.indexOf('const workPayload=Object.assign({},payload);');
r.ok(i > 0, 'encuentro el bucle de guardado del diario');
const bucle = html.slice(i, i + 3400);

r.seccion('El error de tipo se reconoce:');

r.ok(/invalid input syntax for type integer/.test(bucle),
     'se detecta el mensaje exacto de PostgREST');
r.ok(/\[-0-9\.\]|\[0-9\.\]/.test(bucle),
     'y se extrae el valor que lo causó');

r.seccion('Se encuentra el campo culpable por su valor:');

r.ok(/Object\.keys\(workPayload\)\.find/.test(bucle),
     'se busca en el payload cuál campo tiene ese número');
r.ok(/Math\.round/.test(bucle),
     'y se redondea');

r.seccion('Pero el dato original no se tira:');

r.ok(/workPayload\.notes/.test(bucle),
     'el valor real queda escrito en las notas del registro');

r.seccion('Y sigue habiendo un límite de reintentos:');

r.ok(/attempt<maxRetries/.test(bucle),
     'no se puede entrar en un ciclo infinito de redondeos');
r.ok(/attempt\+\+/.test(bucle),
     'cada reintento cuenta');

r.cerrar('Perder la precisión de una copa es preferible a perder la noche.');
