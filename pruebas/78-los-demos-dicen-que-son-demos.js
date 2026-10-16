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

r.seccion('Los ocho que se siembran al entrar por primera vez:');

const cods = (app.match(/const DM_CODIGOS_DEMO = \[([^\]]+)\]/) || [])[1] || '';
['JUANA1', 'QUIJAN', 'KAHLO1', 'FRANK1', 'PETER1', 'WINKLE', 'ELENA1', 'TOMAS1'].forEach(function (c) {
  r.ok(cods.indexOf("'" + c + "'") >= 0, '  ' + c);
});
// Seis mecanismos distintos sin repetir ninguno: es lo máximo que se
// aprende de una lista de ejemplo. Dos insomnios iguales no enseñan nada.
r.ok(/duerme bien pero a destiempo/.test(app),
     'y queda escrito qué muestra cada uno');
r.ok(/sobrediagnostica/.test(app),
     'incluido el control, que es el que muestra que la app no sobrediagnostica');


// ── Y un hallazgo que salió de armar el demo pediátrico ──────────────
//
// Al generarle 8 semanas a un chico de 4 años, el motor le sugirió
// "TCC-I (terapia cognitivo-conductual para el insomnio)".
//
// Es el algoritmo de adultos corriendo sobre un preescolar.
// dmCalcularConducta devolvía TCC-I para CUALQUIER cosa que no fuera
// "dentro de límites normales", sin mirar la edad ni una vez. La TCC-I está
// validada en adultos; en menores de 13 lo que tiene evidencia son las
// intervenciones conductuales del sueño infantil, que son otra cosa.
//
// Se descubrió preparando un video. Si no, se descubría en el video.

const fs2 = require('fs');
const path2 = require('path');
const motor2 = fs2.readFileSync(
  path2.join(__dirname, '..', 'js', 'dormetria-motor-orientacion.js'), 'utf8');

r.seccion('A un chico no se le sugiere TCC-I:');

r.ok(/function dmCalcularConducta\(orientacion, lastScales, diarySlice, datosInsuficientes, edadAnios\)/.test(motor2),
     'la conducta recibe la edad');
r.ok(/if \(edadAnios != null && edadAnios < 13\)/.test(motor2),
     'y por debajo de 13 no sugiere la de adultos');
r.ok(/motivo: 'pediatrico'/.test(motor2), 'con su propio motivo');
// Lo importante es lo que NO hace: no reemplaza una sugerencia por otra.
// Inventar una recomendación pediátrica sería repetir el error con otro
// texto. Dice que acá la app no sugiere, y por qué.
const ped = motor2.slice(motor2.indexOf("motivo: 'pediatrico'"),
                         motor2.indexOf("motivo: 'pediatrico'") + 900);
r.ok(/La app no las sugiere/.test(ped),
     'y no inventa una recomendación pediátrica en su lugar');
r.ok(/está validada en adultos/.test(ped), 'con el motivo clínico');

const vm2 = require('vm');
const ctx2 = C.appEvaluada();
if (ctx2) {
  const noche = function (i) {
    return { diary_date: '2026-09-' + String(1 + (i % 28)).padStart(2, '0'),
      bedtime: '21:30', wake_time: '07:00', get_up_time: '07:12',
      sleep_minutes: 540, sleep_latency_mins: 22, awakenings: 1,
      wake_in_bed_mins: 18, nap_minutes: 95, sleep_quality: 3, day_type: 'work' };
  };
  const d = []; for (let i = 0; i < 20; i++) d.push(noche(i));
  const corre = function (dob) {
    return vm2.runInContext('dmMotorOrientacion([], ' + JSON.stringify(d) +
      ', {email:"x@y.com", dob:' + JSON.stringify(dob) + '})', ctx2, { timeout: 30000 }).conducta;
  };
  const chico = corre('2022-05-10'), adulto = corre('1988-03-02');
  r.ok(chico.procede === false && chico.motivo === 'pediatrico',
       'con los mismos datos, a los 4 años no sugiere conducta', chico.titulo);
  r.ok(adulto.procede === true && /TCC-I/.test(adulto.primeraLinea),
       'y a los 38 sí', adulto.primeraLinea);
  r.ok(corre(null).procede === true,
       'sin fecha de nacimiento se comporta como antes: no se asume que es un chico');
}

r.cerrar('Un paciente de ejemplo sin el cartel de ejemplo es un paciente inventado presentado como real.');
