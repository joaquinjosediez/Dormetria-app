// Las etiquetas automáticas eran tres reglas sueltas: STOP-BANG≥5,
// ISI≥15, IRLS≥15. Con eso, alguien que consulta por insomnio y puntúa 13
// en el ISI quedaba sin NINGUNA etiqueta. Y que un paciente no tenga nada
// es raro: por algo consulta.
//
// La regla que se siguió para ampliarlo: no inventar ningún corte. Cada
// uno sale de la validación del instrumento o de la interpretación que la
// app ya muestra en pantalla.

const C = require('./comun');
const r = C.crearReporte('Si consulta por algo, alguna etiqueta tiene');

const app = C.leerApp();
const i = app.indexOf('const DM_CORTES_TAG = {');
r.ok(i > 0, 'los cortes están en una tabla, no desparramados en ifs');
const tabla = app.slice(i, app.indexOf('};', i));

r.seccion('Insomnio: el corte clínico, no el de "moderado"');

r.ok(/isi:\s*\{ min:11/.test(tabla),
     'ISI ≥ 11 (Morin 2011) — 15 dejaba afuera el insomnio leve, que es el que más se beneficia de la TCC-I');
r.ok(/ais:\s*\{ min:10/.test(tabla), 'AIS ≥ 10 (Soldatos 2003)');

r.seccion('Apnea: alta especificidad, no "riesgo intermedio"');

r.ok(/stopbang:\s*\{ min:5/.test(tabla),
     'STOP-BANG ≥ 5 — bajarlo a 3 etiquetaría a medio padrón');
r.ok(/sassv:\s*\{ min:21/.test(tabla), 'Berlin > 20');

r.seccion('Y las que faltaban:');

r.ok(/irls:\s*\{ min:15/.test(tabla),    'IRLS ≥ 15');
r.ok(/rbdq:\s*\{ min:8/.test(tabla),     'RBDQ ≥ 8 → parasomnia');

r.seccion('Cronodisrupción, que era la que había que definir:');

const j = app.indexOf('function computeAutoTags(recs, email){');
const fn = app.slice(j, app.indexOf('function dmMotivoTag(', j));
r.ok(/d\.jetLagMin>=120/.test(fn),
     'jet lag social ≥ 2 h — el umbral operativo estándar (Wittmann 2006)');
r.ok(/d\.sdMidMin>=90/.test(fn),
     'o dispersión del punto medio ≥ 90 min');
r.ok(/extremo && d\.jetLagMin!=null && d\.jetLagMin>=60/.test(fn),
     'el cronotipo extremo NO alcanza solo: un vespertino con horario libre duerme bien');

r.seccion('Narcolepsia no se auto-marca, y está dicho por qué:');

r.ok(!/narcolepsia/.test(fn.replace(/\/\/[^\n]*/g, '')),
     'ninguna regla la enciende: no hay instrumento específico cargado');

r.seccion('Cada tilde dice de dónde salió:');

r.ok(/window\._dmMotivosTag/.test(fn), 'se guarda el motivo de cada etiqueta');
r.ok(/function dmMotivoTag\(/.test(app), 'y hay cómo leerlo');
r.ok(/Por qué se marcaron/.test(app),
     'la tarjeta lo muestra — un tilde automático sin explicación es una afirmación sin respaldo visible');

r.seccion('Y al paciente con criterio de insomnio se le ofrece la TCC-I:');

const k = app.indexOf('function dmTcciCriterioInsomnio(');
const crit = app.slice(k, k + 1200);
r.ok(/Number\(ult\.isi\.score\)>=11/.test(crit),
     'con el MISMO corte que usa el profesional');
r.ok(/patr\[óo\]n de insomnio|patr[óo]n de insomnio/.test(crit),
     'y también con el patrón del diario');
r.ok(/muestran criterio de insomnio/.test(app),
     'la tarjeta dice por qué aparece: sin el motivo se lee como publicidad del programa');

r.cerrar('Un corte inventado es peor que no tener etiqueta.');
