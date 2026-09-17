// Las siestas se registraban y no se mostraban en ningún lado del lado
// profesional, salvo como barritas azules en el actograma.
//
// Y hay una confusión que había que cerrar antes de mostrarlas: el "tiempo de
// sueño" que ve el profesional es NOCTURNO — sale de sleep_minutes, que se
// calcula de bedtime a wake_time. Las siestas nunca entraron ahí, con una sola
// excepción: el puntaje de cantidad de los menores de 6 años, donde el sueño
// de 24 h sí las incluye.
//
// Así que se agregan, pero SEPARADAS: el TST sigue siendo el nocturno y el
// total de 24 h va como pie, nunca fundido en la misma cifra.

const C = require('./comun');
const r = C.crearReporte('Las siestas existen');

const fs = require('fs');
const path = require('path');
const RAIZ = path.join(__dirname, '..');
const motor  = fs.readFileSync(path.join(RAIZ,'js/dormetria-motor-orientacion.js'),'utf8');
const render = fs.readFileSync(path.join(RAIZ,'js/dormetria-render-resumen.js'),'utf8');
const html   = C.leerHtml();

r.seccion('El motor las calcula:');

eval(motor);

const noche = (nap, detalle) => ({
  diary_date:'2026-09-01', bedtime:'23:00', wake_time:'07:00', get_up_time:'07:00',
  sleep_minutes:450, sleep_latency_mins:20, awakenings:0, wake_in_bed_mins:0,
  nap_minutes:nap, notes: detalle ? ('Siestas: '+JSON.stringify(detalle)) : null
});
const datos = [
  noche(60,[{start:'15:00',end:'16:00'}]), noche(0),
  noche(90,[{start:'14:00',end:'15:00'},{start:'18:00',end:'18:30'}]), noche(0),
  noche(30,[{start:'16:00',end:'16:30'}]), noche(0),
  noche(120,[{start:'14:00',end:'16:00'}]), noche(0), noche(0), noche(0)
];
const m = dmMetricasDiario(datos);

r.ok(m.tst === 450, 'el TST sigue siendo solo el nocturno', m.tst + ' min');
r.ok(m.siestaFrecPct === 40, 'frecuencia: 4 de 10 días', m.siestaFrecPct + '%');
r.ok(m.siestaMediaMin === 75,
     'duración media de los días CON siesta, no del total', m.siestaMediaMin + ' min');
r.ok(m.siestaCantMedia === 1.3, 'cuántas siestas por día', m.siestaCantMedia);
r.ok(m.tst24 === 480, 'y el total de 24 h va aparte', m.tst24 + ' min');

r.seccion('Sin dato no se inventa un cero:');

const sinDato = datos.map(e => Object.assign({}, e, {nap_minutes:null, notes:null}));
const m2 = dmMetricasDiario(sinDato);
r.ok(m2.siestaFrecPct === null, 'frecuencia queda en null');
r.ok(m2.siestaMediaMin === null, 'duración queda en null');
r.ok(m2.tst24 === null, 'y el total de 24 h no se calcula');
r.ok(m2.tst === 450, 'pero el nocturno se sigue informando igual');

// Un paciente que contesta "no dormí siesta" todos los días NO es lo mismo
// que uno del que no se sabe nada.
const ceros = datos.map(e => Object.assign({}, e, {nap_minutes:0, notes:null}));
const m3 = dmMetricasDiario(ceros);
r.ok(m3.siestaFrecPct === 0, '"no duerme siesta" se distingue de "sin dato"',
     'frec=' + m3.siestaFrecPct);
r.ok(m3.tst24 === 450, 'y ahí el total de 24 h es el nocturno');

r.seccion('El resumen del profesional las muestra:');

r.ok(/celda\('Siestas'/.test(render), 'hay una celda de siestas en Evolución');
r.ok(/'sin dato'/.test(render), 'que distingue el caso sin dato');
r.ok(/en 24 h/.test(render), 'y el pie del tiempo de sueño da el total de 24 h');
r.ok(/'nocturno'/.test(render),
     'aclarando que la cifra grande es la noche');

r.seccion('Y el paquete del informe también:');

r.ok(/paquete\.siestas/.test(html), 'el informe lleva un bloque de siestas');
r.ok(/es nocturno y NO incluye estas siestas/.test(html),
     'con la aclaración explícita, para que no se sumen dos veces');

r.cerrar('Un promedio de sueño que ignora una siesta diaria de 90 min describe otra persona.');
