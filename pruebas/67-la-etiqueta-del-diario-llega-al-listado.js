// Un paciente con "Insomnio · auto — patrón de insomnio en el diario" en su
// ficha no tenía la franja roja en el listado lateral.
//
// Las etiquetas se resuelven con dos fuentes: las ESCALAS (ISI, PSQI…) y las
// señales del DIARIO (el patrón que detecta el motor, el jet lag, la SD del
// punto medio). Pero el listado no mira el diario: lee `patients.tags.resolved`
// de la base, que lo escribió un cálculo hecho SOLO con las escalas.
//
// La única vez que las etiquetas se calculan con el diario disponible es al
// pintar el Resumen —el motor publica _dmPatronDiario unas líneas antes— y ahí
// el resultado se pintaba y se tiraba. Nunca llegaba a la base.
//
// Y una vez que `resolved` existe como array, backgroundFillMissingTags lo da
// por resuelto y no vuelve a calcularlo nunca. O sea: no se arreglaba solo.

const fs = require('fs');
const path = require('path');
const C = require('./comun');
const r = C.crearReporte('La etiqueta del diario llega al listado');

const app = C.leerApp();
const resumen = fs.readFileSync(
  path.join(__dirname, '..', 'js', 'dormetria-summary-nuevo.js'), 'utf8');

r.seccion('Las señales del diario entran en la resolución:');

const iPills = app.indexOf('function renderTagHeaderPills');
const resolver = app.slice(Math.max(0, iPills - 6000), iPills);
r.ok(/_dmPatronDiario/.test(resolver), 'el patrón del diario');
r.ok(/marcar\('insomnio','patrón de insomnio en el diario'\)/.test(resolver),
     'y marca insomnio por esa vía');
r.ok(/_dmSenalesDiario/.test(resolver), 'y las otras señales del diario');

r.seccion('El Resumen es el único que las tiene cuando resuelve:');

// El orden importa: el motor publica las señales ANTES de pintar las
// etiquetas. Si se resolviera antes, el diario no estaría.
const iMotor = resumen.indexOf('window._dmPatronDiario[email]');
const iTags = resumen.indexOf('computePatientTagState(dmCurrentEmail)');
r.ok(iMotor > 0 && iTags > 0 && iMotor < iTags,
     'el motor publica el patrón antes de que se resuelvan las etiquetas');

r.seccion('Y ahora lo GUARDA:');

const fn = resumen.slice(resumen.indexOf('async function dmPintarEtiquetasResumen'));
r.ok(/persistResolvedTags\(dmCurrentEmail, estado\)/.test(fn),
     'se persiste el estado resuelto');
r.ok(/typeof persistResolvedTags === 'function'/.test(fn),
     'con guarda, porque vive en index.html y el módulo carga antes');
r.ok(/await persistResolvedTags/.test(fn),
     'y se espera: sin await, cambiar de paciente podía cancelarlo');

r.seccion('Lo que persiste es lo que el listado lee:');

const persist = app.slice(app.indexOf('async function persistResolvedTags'),
                          app.indexOf('async function toggleDrTag'));
r.ok(/db\.patch\('patients\?email=eq\.'/.test(persist), 'escribe en patients');
r.ok(/\{added:st\.added, dismissed:st\.dismissed, resolved:st\.resolved\}/.test(persist),
     'la terna entera: resolved sin added/dismissed perdería lo marcado a mano');
r.ok(/JSON\.stringify\(st\.resolved\)!==cur/.test(persist),
     'y solo si cambió: no una escritura por cada visita a la ficha');
// El listado dibuja la franja con eso mismo.
r.ok(/u\.tags&&u\.tags\.resolved&&u\.tags\.resolved\.length/.test(app),
     'y la franja del listado sale de tags.resolved');

r.cerrar('La ficha lo sabía y la lista no, porque nadie escribía lo que la ficha sabía.');
