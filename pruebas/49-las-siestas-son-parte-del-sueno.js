// Tres cosas, y la primera es la que hacía dudar del puntaje entero.
//
//  1. "Sueño total promedio" significaba DOS cosas distintas en la misma
//     pantalla: en la tabla de métricas salía de sleep_minutes (NOCTURNO)
//     y el pilar Cantidad usaba computeChildSleep24h (noche + siestas,
//     24 HORAS). El puntaje podía decir "dentro del rango" mientras la
//     tabla mostraba un total que no llegaba — y las dos cosas estaban
//     bien, porque no eran lo mismo.
//
//  2. dmFilasSiestas() vivía DENTRO del guardado (_bebe || _sinRutina),
//     que existe para no mostrar deuda de sueño ni jet lag social a quien
//     no tiene rutina escolar. Se llevó puestas las siestas justamente en
//     los bebés y los chicos chicos, que son los únicos que siestean
//     todos los días.
//
//  3. Solo leía nap_minutes, la columna del diario ADULTO. El diario
//     infantil guarda las siestas en notes y las lee parseChildNaps().

const C = require('./comun');
const r = C.crearReporte('Las siestas son parte del sueño');

const app = C.leerApp();
const ctx = C.appEvaluada({ silencioso: true });
r.ok(!!ctx, 'la app arranca');
const vm = require('vm');

// Un nene de 2 años: diario infantil, siesta que se corre hasta 90 min.
const p = m => String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0');
const ns = [];
for (let k = 0; k < 12; k++) {
  const d = new Date(2026, 8, 1 + k);
  const ini = 13 * 60 + (k % 3) * 45;
  ns.push({
    diary_date: d.toISOString().slice(0, 10), bedtime: '21:0' + (k % 2), wake_time: '07:00',
    sleep_minutes: 600,
    notes: 'Siestas: [{"start":"' + p(ini) + '","end":"' + p(ini + 80) + '"}]'
  });
}
ctx._ns = ns;

r.seccion('Se leen las siestas del diario infantil, no solo las del adulto:');

const M = vm.runInContext('dmMetricasSiestas(_ns)', ctx);
r.ok(!!M, 'dmMetricasSiestas devuelve algo con notas del diario infantil');
r.ok(M && M.nConSiesta === 12, 'cuenta los 12 días con siesta');
r.ok(M && M.durMedia === 80, 'y su duración media (80 min)');

r.seccion('Lo que faltaba: regularidad de la siesta');

r.ok(M && M.sdInicio != null, 'hay dispersión de la hora de inicio');
r.ok(M && M.sdInicio > 20, 'y detecta que se corre: ±' + (M && M.sdInicio) + ' min');

r.seccion('Y lo accionable: cuánto falta de la siesta a la noche');

r.ok(M && M.gapMedio != null, 'se calcula el intervalo hasta acostarse');
r.ok(/ADELANTAR la siesta, no sacarla/.test(app),
     'y el consejo apunta a adelantarla, que es lo que se ajusta');

r.seccion('Las siestas ya no dependen de la rutina escolar:');

// El guardado era para deuda de sueño y jet lag social; se llevaba puesto
// todo lo demás que estuviera adentro del mismo paréntesis.
const html = vm.runInContext('renderClinicalMetricsHtml(_ns,"doctor",2)', ctx);
r.ok(/Días con siesta/.test(html),
     'un nene de 2 años (sin rutina escolar) VE sus métricas de siesta');
r.ok(/Regularidad de la siesta/.test(html), 'incluida la regularidad');
r.ok(!/Jet lag social/.test(html) || /sin rutina escolar/.test(html),
     'y el jet lag social sigue suprimido, que era el motivo del guardado');

r.seccion('"Sueño total" deja de significar dos cosas:');

r.ok(/Sueño nocturno promedio/.test(html),
     'la tabla dice "nocturno" cuando es solo la noche');
r.ok(/Sueño total en 24 h/.test(html),
     'y agrega el total de 24 h');
r.ok(/Este es el número que usa el puntaje de cantidad/.test(html),
     'diciendo cuál de los dos alimenta el puntaje');
r.ok(/prorrateadas por los \d+% de días con siesta/.test(html),
     'y se prorratea la siesta por su frecuencia — promediarla sobre los días CON siesta la infla');

r.seccion('No se le da consejo de adulto a un nene de dos años:');

r.ok(/A esta edad la siesta es parte del sueño normal/.test(html),
     'una siesta de 80 min a los 2 años no se marca como problema');
r.ok(!/interfiere con la noche en la mayoría de los adultos/.test(html),
     'el corte de 30 min es de adultos y no aparece acá');

const adulto = vm.runInContext(
  'renderClinicalMetricsHtml(_ns.map(function(e){return Object.assign({},e,{nap_minutes:80});}),"doctor",40)', ctx);
r.ok(/interfiere con la noche en la mayoría de los adultos/.test(adulto),
     'pero en un adulto con 80 min de siesta sí se señala');

r.cerrar('El mismo rótulo para dos medidas distintas hace dudar de todo el panel.');
