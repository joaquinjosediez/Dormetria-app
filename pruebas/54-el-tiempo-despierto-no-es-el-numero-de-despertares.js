// La franja de "Despertares" en el cuadro noche a noche dibujaba el NÚMERO
// de despertares. Ahí dos noches muy distintas salen iguales: despertarse
// tres veces y volver a dormirse en un minuto, o despertarse una sola vez y
// quedarse una hora dando vueltas. La segunda es insomnio de mantenimiento;
// la primera, para la mayoría de las edades, no es nada.
//
// Lo que define el cuadro, lo que responde a control de estímulos y lo que
// se mide en los ensayos es el WASO: minutos despierto en la cama después de
// haberse dormido. Corte ≥30 min (Lichstein 2003; Edinger 2004, criterios
// cuantitativos de investigación para insomnio).
//
// Y una trampa propia: si el paciente marcó "no me desperté", eso son CERO
// minutos, no un dato faltante. Tratarlo como faltante borra justo las
// noches buenas y sube el porcentaje de noches malas.

const C = require('./comun');
const vm = require('vm');
const r = C.crearReporte('El tiempo despierto no es el número de despertares');

const app = C.leerApp();
const ctx = C.appEvaluada({ silencioso: true });
r.ok(!!ctx, 'la app arranca');

let semilla = 11;
const rnd = () => { semilla = (semilla * 1103515245 + 12345) % 2147483648; return semilla / 2147483648; };

// Noches con WASO cargado: un despertar largo y varios cortos.
const conWaso = [];
for (let k = 0; k < 20; k++) {
  conWaso.push({
    diary_date: new Date(2026, 7, 1 + k).toISOString().slice(0, 10),
    bedtime: '23:30', wake_time: '07:30',
    sleep_minutes: Math.round((6 + rnd() * 2) * 60),
    sleep_latency_mins: Math.round(10 + rnd() * 40),
    awakenings: 3,                       // muchos despertares…
    wake_in_bed_mins: k % 2 ? 4 : 65,    // …pero la mitad de las noches son cortos
    sleep_quality: 3
  });
}
ctx._nsW = conWaso;
const h = vm.runInContext('dmSerieNocheHtml(_nsW)', ctx);

r.seccion('La barra es el tiempo despierto, no la cantidad de veces:');

r.ok(/Tiempo despierto de noche/.test(h), 'la franja se llama por lo que mide');
r.ok(/30 min o más despierto/.test(h), 'y el umbral es el clínico, no "dos o más"');
r.ok(/min despierto en la cama/.test(h), 'cada barra dice los minutos de esa noche');

// Con 3 despertares TODAS las noches, el conteo habría marcado el 100 % como
// malas. Con WASO, solo la mitad pasa los 30 min.
const pct = (h.match(/30 min o más despierto · <b>(\d+)%/) || [])[1];
r.ok(pct === '50',
     'tres despertares todas las noches no son tres noches malas: el 50 %, no el 100 %',
     pct + '% de las noches');

r.seccion('"No me desperté" son 0 minutos, no falta de dato:');

const fn = app.slice(app.indexOf('function dmSerieNocheHtml(entries, dias){'),
                     app.indexOf('function dmSerieNocheHtml(entries, dias){') + 4000);
r.ok(/else if\(awk === 0\)\{? ?was = 0;/.test(fn),
     'si marcó que no se despertó, el WASO es cero');
// Pero ese cero deducido no alcanza para decidir que la franja pasa a
// minutos: si no, un paciente que nunca cargó minutos dibuja una línea de
// ceros que se lee como "no se despierta nunca".
r.ok(/n\.wasoExpl/.test(fn),
     'y para elegir la franja se cuentan solo las noches con el minuto cargado');

// El caso real: algunas noches con los minutos cargados y el resto con
// "no me desperté". Esas últimas tienen que contar como noches BUENAS, no
// desaparecer del denominador.
const mixto = conWaso.map(function (e, i) {
  return (i < 5)
    ? Object.assign({}, e, { awakenings: 3, wake_in_bed_mins: 65 })
    : Object.assign({}, e, { awakenings: 0, wake_in_bed_mins: null });
});
ctx._nsZ = mixto;
const h0 = vm.runInContext('dmSerieNocheHtml(_nsZ)', ctx);
r.ok(/Tiempo despierto de noche/.test(h0),
     'con cinco noches de minutos cargados ya se dibuja en minutos');
const pct0 = (h0.match(/30 min o más despierto · <b>(\d+)%/) || [])[1];
r.ok(pct0 === '25',
     'y las quince noches sin despertarse entran como buenas: 5 de 20, no 5 de 5',
     pct0 + '% de las noches');

r.seccion('Sin el dato cargado se cae al conteo, no a una franja vacía:');

// Pacientes viejos tienen awakenings pero nunca cargaron minutos.
const soloConteo = conWaso.map(function (e, i) {
  return Object.assign({}, e, { wake_in_bed_mins: null, awakenings: i % 3 });
});
ctx._nsC2 = soloConteo;
const hc = vm.runInContext('dmSerieNocheHtml(_nsC2)', ctx);
r.ok(/dm-nn-tit">Despertares</.test(hc),
     'vuelve a la franja de conteo');
r.ok(/dos o más/.test(hc), 'con su umbral de siempre');

r.cerrar('Una hora despierto y tres vueltas de un minuto no dibujan igual.');
