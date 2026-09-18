// "De 100 pacientes que doy de alta, la mitad nunca entró" es un problema de
// invitación, no de adherencia. Y hasta ahora la app los mezclaba: quien nunca
// activó su cuenta caía en el mismo contador que quien registró un mes y
// aflojó, y recibía el mismo mensaje — "completá tu diario de sueño" — que no
// le dice nada a alguien que todavía no tiene cuenta.
//
// La diferencia se puede medir con exactitud: patients.auth_id queda NULL
// hasta que la persona termina de registrarse. Ficha sin auth_id = ficha que
// el profesional cargó y la persona nunca activó.

const C = require('./comun');
const r = C.crearReporte('Nunca entró no es abandono');

const html = C.leerHtml();

r.seccion('Se distingue con el dato que lo prueba:');

r.ok(/select=email,name,lname,phone,dob,height_cm,weight_kg,auth_id,code/.test(html),
     'la consulta del panel trae auth_id y el código');
r.ok(/select=email,name,lname,phone,dob,height_cm,weight_kg'\)\.catch/.test(html.replace(/\s+/g,' ')) ||
     /catch\(\(\)=>\s*db\.get\('patients\?email=in\./.test(html.replace(/\s+/g,' ')),
     'y si esas columnas no están, cae a la consulta vieja en vez de romperse');

const bloqueFila = html.slice(html.indexOf('sinCuenta: (p.auth_id'),
                              html.indexOf('sinCuenta: (p.auth_id') + 400);
r.ok(/\('auth_id' in p\) \? true : null/.test(bloqueFila),
     'sin la columna no se afirma que nunca entró: queda en null');

r.seccion('Tiene su propio contador:');

r.ok(/const sinCuenta=rows\.filter/.test(html), 'se cuentan aparte');
r.ok(/Nunca entró<br>\(sin cuenta\)/.test(html), 'con su propia tarjeta');
r.ok(/Dejó de registrar<br>\(\+14 días\)/.test(html),
     'y la de al lado deja de decir "sin registrar", que los confundía');
const bloquePerdidos = html.slice(html.indexOf('const perdidos=rows.filter'),
                                  html.indexOf('const perdidos=rows.filter') + 220);
r.ok(/!\(r\.sinCuenta===true && r\.daysSince==null\)/.test(bloquePerdidos),
     'y ya no se cuentan dos veces');

r.seccion('Y reciben otro mensaje:');

const bloqueMsg = html.slice(html.indexOf('const msg = _nunca'),
                             html.indexOf('const msg = _nunca') + 1200);
r.ok(/Registrate como paciente con este mismo mail/.test(bloqueMsg),
     'al que nunca entró se le explica cómo activar la cuenta');
r.ok(/tu código es/.test(bloqueMsg), 'con su código, si lo tiene');
r.ok(/completes tu diario de sueño/.test(bloqueMsg),
     'y al que sí entró se le sigue recordando el diario');
r.ok(/Activá tu perfil en Dormetria/.test(html),
     'el asunto del mail también cambia');
r.ok(/💬 Invitar/.test(html), 'y el botón dice invitar, no recordar');

r.ok(/Falta activar la cuenta/.test(html), 'la fila lo muestra con su etiqueta');
r.ok(/sbtn\('sincuenta','🚪 Nunca entraron'\)/.test(html),
     'y se puede ordenar por eso');

r.seccion('El botón de marcar prueba dice lo que hace:');

// Se mira lo que se RENDERIZA, no el comentario que cuenta por qué cambió.
r.ok(!/>· demo\?</.test(html),
     'ya no dice "demo?" pegado al nombre del profesional');
// Pasó a ser una casilla en su propia columna: un botón por fila, con un
// texto que había que leer sesenta veces, era ruido.
r.ok(/>Prueba<\/th>/.test(html), 'es una columna con su encabezado');
r.ok(/Las marcadas no cuentan en ninguna estadística/.test(html),
     'y el encabezado explica para qué sirve, una sola vez');
r.ok(/onchange="dmMarcarDemo\(/.test(html), 'la casilla marca y desmarca');

r.cerrar('Mandarle "completá tu diario" a alguien que no tiene cuenta no falla: no significa nada.');
