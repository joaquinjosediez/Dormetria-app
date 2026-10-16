// "¿A los profesionales que se loguean por primera vez les aparece algún
// paciente DEMO, con el cartel de ejemplo?"
//
// Aparecían. Sin el cartel.
//
// Hay dos familias de cuentas demo y dmEsDemo reconocía una sola:
//
//     marta.demo@dormetria.com        ← los cinco viejos · SÍ
//     marie.curie@demo.dormetria.com  ← los trece reales · NO
//
// El patrón pedía ".demo@" y los trece tienen "@demo.". Marie Curie, Peter
// Pan y Frida Kahlo aparecían en el panel de un profesional nuevo
// indistinguibles de un paciente real. En una app clínica eso no es un
// detalle de etiquetado: es un colega mirando un actograma y creyendo que
// hay una persona del otro lado.
//
// Es el mismo defecto que ya se había arreglado en dmEsCuentaDemo para las
// estadísticas, y que quedó sin arreglar acá.

const C = require('./comun');
const r = C.crearReporte('Los demos dicen que son demos');

const app = C.leerApp();

r.seccion('Las dos familias de correos se reconocen:');

const fn = app.slice(app.indexOf('function dmEsDemo(u){'),
                     app.indexOf('function formatPatientName'));
const esDemo = new Function('return ' + fn.slice(fn.indexOf('function dmEsDemo')))();

[['marie.curie@demo.dormetria.com', true,  'los trece reales'],
 ['peter.pan@demo.dormetria.com',   true,  'idem'],
 ['marta.demo@dormetria.com',       true,  'los cinco viejos'],
 ['elena.demo@dormetria.com',       true,  'idem'],
 ['paciente.real@gmail.com',        false, 'un paciente de verdad'],
 ['alguien@dormetria.com',          false, 'el correo del equipo NO es demo'],
 ['dr.ruffa@dormetria.com',         false, 'ni el de un profesional']
].forEach(function (c) {
  r.ok(esDemo({email: c[0]}) === c[1],
       (c[1] ? 'EJEMPLO  ' : 'real     ') + c[0] + ' · ' + c[2]);
});

// is_demo en la base gana sobre cualquier patrón de correo: adivinar por
// el mail siempre va a tener un caso más.
r.ok(esDemo({email: 'cualquiera@gmail.com', is_demo: true}) === true,
     'y is_demo en la base manda sobre el correo');
r.ok(esDemo(null) === false && esDemo({}) === false,
     'sin dato no se marca a nadie como ejemplo');

r.seccion('Y el cartel llega a la fila del listado:');

r.ok(/dmEsDemo\(u\)\?' <span[^>]*>EJEMPLO<\/span>'/.test(app.replace(/\s+/g, ' ')) ||
     /EJEMPLO<\/span>/.test(app),
     'la fila del paciente lo muestra');

r.seccion('Los seis que se siembran al entrar por primera vez:');

const cods = (app.match(/const DM_CODIGOS_DEMO = \[([^\]]+)\]/) || [])[1] || '';
['CURIE1', 'JUANA1', 'KAHLO1', 'PETER1', 'ELENA1', 'TOMAS1'].forEach(function (c) {
  r.ok(cods.indexOf("'" + c + "'") >= 0, '  ' + c);
});
// Seis mecanismos distintos sin repetir ninguno: es lo máximo que se
// aprende de una lista de ejemplo. Dos insomnios iguales no enseñan nada.
r.ok(/cronodisrupción: duerme BIEN pero a destiempo/.test(app),
     'y queda escrito qué muestra cada uno');
r.ok(/NO sobrediagnostica/.test(app),
     'incluido el control, que es el que muestra que la app no sobrediagnostica');

r.cerrar('Un paciente de ejemplo sin el cartel de ejemplo es un paciente inventado presentado como real.');
