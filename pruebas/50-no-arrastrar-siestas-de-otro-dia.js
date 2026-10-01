// "¿Por qué dice 1,9 siestas por día si en el actograma no veo ningún día
// con más de una?"
//
// Porque eran siestas que no ocurrieron, escritas en la base.
//
// La pantalla del diario se REUSA: no se vuelve a construir. Las filas de
// siesta viven en el DOM (#siesta-list) y el JSON en un campo oculto
// (#d-nap-data). showChildDiaryNew() limpiaba _childAwakenings pero no las
// siestas. Entonces: cargás el lunes con una siesta, guardás, tocás
// "+ Nuevo" — y la fila del lunes sigue ahí. Agregás la del martes y se
// guardan DOS.
//
// Y si la fila arrastrada tenía el mismo horario, en el actograma las dos
// barras se superponen y se ve UNA. De ahí el 1,9 con un actograma que
// muestra 1.

const C = require('./comun');
const r = C.crearReporte('No arrastrar siestas de otro día');

const app = C.leerApp();
const ctx = C.appEvaluada({ silencioso: true });
r.ok(!!ctx, 'la app arranca');
const vm = require('vm');

r.seccion('Abrir un registro limpia las siestas del anterior:');

r.ok(/function dmLimpiarSiestas\(\)/.test(app), 'existe la función de limpieza');
const lim = app.slice(app.indexOf('function dmLimpiarSiestas()'), app.indexOf('window.dmLimpiarSiestas'));
r.ok(/siesta-list/.test(lim) && /innerHTML = ''/.test(lim), 'vacía las filas del DOM');
r.ok(/d-nap-data/.test(lim) && /'\[\]'/.test(lim), 'y el campo oculto');
r.ok(/_siestaCount = 0/.test(lim), 'y el contador de ids');

const abrir = app.slice(app.indexOf('function showChildDiaryNew(editandoId){'),
                        app.indexOf('function showChildDiaryNew(editandoId){') + 400);
r.ok(/dmLimpiarSiestas\(\)/.test(abrir),
     'showChildDiaryNew la llama — es la que abre TODOS los registros');

r.seccion('Pero editar vuelve a cargar las que sí estaban:');

// Si solo se limpiara, abrir una noche para corregir la hora y guardar
// borraría las siestas que ya tenía: el remedio sería peor.
const ed = app.slice(app.indexOf('async function editChildDiaryEntry(id){'),
                     app.indexOf('async function editChildDiaryEntry(id){') + 1600);
r.ok(/parseChildNaps\(e\)/.test(ed), 'lee las siestas guardadas del registro');
r.ok(/addSiestaRow\(\)/.test(ed), 'y repuebla el formulario');
r.ok(/updateNapData/.test(ed), 'dejando el campo oculto sincronizado');

r.seccion('Y al leer, dos siestas idénticas el mismo día son una:');

ctx._dup = {
  diary_date: '2026-09-01', bedtime: '21:00', sleep_minutes: 600,
  notes: 'Siestas: [{"start":"13:00","end":"14:20"},{"start":"13:00","end":"14:20"},{"start":"16:30","end":"17:00"}]'
};
const ss = vm.runInContext('dmSiestasDelDia(_dup)', ctx);
r.ok(ss.length === 2,
     'de tres entradas con una repetida quedan 2 (hay ' + ss.length + ')');
r.ok(ss[0].dur === 80 && ss[1].dur === 30,
     'y se conservan las dos distintas, no se colapsan todas');

// Esto limpia lo que ya quedó guardado sin tocar la base, y protege de
// cualquier otro camino que las duplique.
const dedup = app.slice(app.indexOf('function dmSiestasDelDia(e){'),
                        app.indexOf('function dmSiestasDelDia(e){') + 1800);
r.ok(/En el\s*\n?\s*\/\/ actograma se superponen/.test(dedup) || /se superponen/.test(dedup),
     'y está escrito por qué el actograma mostraba una sola');

r.cerrar('Un conteo que no coincide con el actograma no es un error de vista: son datos inventados.');
