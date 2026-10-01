// En la ficha de Mora Silvero, 2 años, la regularidad decía:
//
//     Jet lag social 268 min · Requiere atención
//     Score de regularidad 0 % — Muy baja
//     SD del punto medio 242 min
//     Ref: NHANES 2011-2014 (n=9981)
//
// Cuatro problemas encadenados, y los cuatro son del mismo tipo: afirmar
// con datos que no alcanzan.
//
//  1. El jet lag social compara "finde" contra "semana". Con UNA noche
//     libre, "el promedio de los días libres" es esa noche: lo que haya
//     pasado ese día se convierte en el jet lag del paciente.
//  2. Un nene de 2 años no tiene rutina escolar, así que los dos grupos
//     son el mismo. renderClinicalMetricsHtml YA suprimía el jet lag por
//     eso — pero la tarjeta de pilares no, y encima decía "Este pilar SÍ
//     pesa en el puntaje".
//  3. computeSleepRegularity calculaba con 2 noches. La SD existe
//     matemáticamente y no significa nada, pero salía como "0 % — Muy
//     baja", que es una afirmación sobre el chico.
//  4. La referencia es NHANES, adultos de 18 o más, citada sin aclararlo
//     en la ficha de alguien de 2 años.

const C = require('./comun');
const r = C.crearReporte('No afirmar sobre dos noches');

const app = C.leerApp();
const ctx = C.appEvaluada({ silencioso: true });
r.ok(!!ctx, 'la app arranca');
const vm = require('vm');

r.seccion('El jet lag social necesita noches de los dos tipos:');

const noche = (fecha, bed, min) => ({ diary_date: fecha, bedtime: bed, sleep_minutes: min });
// Cuatro noches de semana y UNA sola libre: con eso no se puede promediar.
ctx._pocas = [
  noche('2026-09-07', '21:00', 600), noche('2026-09-08', '21:10', 600),
  noche('2026-09-09', '21:05', 600), noche('2026-09-10', '20:55', 600),
  noche('2026-09-12', '01:30', 600)
];
r.ok(vm.runInContext('socialJetLagMin(_pocas)', ctx) === null,
     'con una sola noche libre devuelve null, no un número de cuatro horas');

// Tres y tres: ahí sí.
ctx._bastan = [
  noche('2026-09-07', '21:00', 600), noche('2026-09-08', '21:00', 600),
  noche('2026-09-09', '21:00', 600), noche('2026-09-10', '21:00', 600),
  noche('2026-09-05', '22:00', 600), noche('2026-09-06', '22:00', 600),
  noche('2026-09-12', '22:00', 600), noche('2026-09-13', '22:00', 600)
];
r.ok(typeof vm.runInContext('socialJetLagMin(_bastan)', ctx) === 'number',
     'con tres de cada tipo sí lo calcula');

r.seccion('La regularidad necesita una semana, no dos noches:');

const n2 = [
  { diary_date: '2026-09-07', bedtime: '23:00', wake_time: '07:00' },
  { diary_date: '2026-09-08', bedtime: '01:00', wake_time: '09:00' }
];
ctx._n2 = n2;
const reg2 = vm.runInContext('computeSleepRegularity(_n2)', ctx);
r.ok(reg2 && reg2.score === null, 'con 2 noches no devuelve score');
r.ok(reg2 && reg2.sd_midpoint_min === null, 'ni SD del punto medio');
r.ok(reg2 && /al menos 5 noches/.test(reg2.method || ''),
     'y dice cuántas faltan: ' + (reg2 && reg2.method || ''));

ctx._n6 = [];
for (let k = 0; k < 6; k++) {
  ctx._n6.push({ diary_date: '2026-09-0' + (k + 1), bedtime: '23:00', wake_time: '07:00' });
}
const reg6 = vm.runInContext('computeSleepRegularity(_n6)', ctx);
r.ok(reg6 && reg6.score !== null, 'con 6 noches sí calcula');

r.seccion('Sin rutina escolar, el jet lag no se muestra ni puntúa:');

r.ok(vm.runInContext("dmTieneEscolaridad({dob:'2024-01-26'})", ctx) === false,
     'un nene de 2 años se considera sin rutina escolar');
r.ok(/_rutinaP \? socialJetLagMin\(sorted\) : null/.test(app),
     'la tarjeta de pilares respeta esa marca — antes no lo hacía');
r.ok(/La regularidad no puntúa en este caso/.test(app),
     'y lo dice, en vez de mostrar "Requiere atención"');

r.seccion('Y la referencia no se cita fuera de su población:');

r.ok(/Cortes de ADULTOS/.test(app),
     'en una ficha pediátrica se avisa que NHANES es de 18 o más');
r.ok(/No hay valores normativos pediátricos publicados/.test(app),
     'y que no hay norma pediátrica para comparar');

r.seccion('El hueco tampoco puede quedar mudo:');

r.ok(/el hueco se lee como "no se calculó\s*\n?\s*\/\/ porque está todo bien"|hueco se lee como/.test(app),
     'cuando no se puede calcular, se dice — un bloque vacío se lee como "está todo bien"');

r.cerrar('Un número que no se puede calcular no es cero: es que no se sabe.');
