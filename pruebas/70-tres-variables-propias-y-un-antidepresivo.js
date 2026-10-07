// Dos pedidos chicos con una trampa adentro.
//
// 1 · Desvenlafaxina no estaba en la lista. Es el metabolito activo de la
//     venlafaxina y se prescribe como fármaco propio: quien la toma la
//     cargaba a mano en "Otro" y quedaba fuera de toda agrupación.
//
// 2 · "Que puedan agregar más variables al diario, hasta 3." La función ya
//     existía y el tope era 5 — lo que faltaba era que se notara: el bloque
//     del diario decía "Tu propia variable", en singular, y el modal mostraba
//     un campo por vez, así que para tener la tercera había que guardar y
//     volver a abrirlo. Nadie pasaba de dos.
//
//     Bajar el tope de 5 a 3 tiene una trampa: dmGetVarsPersonales hace
//     slice(0, tope). Con un solo número, a quien ya tenía cuatro o cinco se
//     le escondían las últimas Y su historial en custom_flags, sin aviso. Por
//     eso son DOS topes: el de crear (3) y el de leer (5).

const C = require('./comun');
const r = C.crearReporte('Tres variables propias y un antidepresivo');

const app = C.leerApp();

r.seccion('El antidepresivo:');

r.ok(/\{name:'Desvenlafaxina', cat:'IRSN'\}/.test(app),
     'desvenlafaxina está, y como IRSN');
const lista = app.slice(app.indexOf('const COMMON_MEDS = ['),
                        app.indexOf('let _medModalMeds'));
r.ok(lista.indexOf("Venlafaxina") < lista.indexOf("Desvenlafaxina") &&
     lista.indexOf("Desvenlafaxina") < lista.indexOf("Duloxetina"),
     'al lado de la venlafaxina, que es donde se la busca');

r.seccion('Dos topes, no uno:');

r.ok(/const DM_MAX_VARS = 3;/.test(app), 'se crean hasta 3');
r.ok(/const DM_MAX_VARS_LEE = 5;/.test(app), 'pero se leen hasta 5');
// Esta es la que importa: sin ella, bajar el tope borra de la vista las
// variables que un paciente ya venía marcando todas las noches.
r.ok(/slice\(0, DM_MAX_VARS_LEE\)/.test(app),
     'lo guardado se lee con el tope ALTO: bajar el tope no esconde historial');
r.ok(!/slice\(0, DM_MAX_VARS\)/.test(app),
     'y no quedó ningún slice con el tope de creación');
// Y la otra mitad del mismo problema: guardar con un for hasta 3 le borraba
// las dos últimas a quien tuviera cinco.
const guardar = app.slice(app.indexOf('async function dmGuardarVarsPersonales(){'),
                          app.indexOf('// ── PERIOD TRACKING ──'));
r.ok(/for\(let i=0;i<DM_MAX_VARS_LEE;i\+\+\)/.test(guardar),
     'y al guardar se recorren todos los campos, no solo los 3 primeros');

r.seccion('"Agregar otra", que es lo que se pidió:');

const agregar = app.slice(app.indexOf('function dmVarsAgregarCampo(){'),
                          app.indexOf('window.dmVarsAgregarCampo'));
r.ok(/function dmVarCampoHtml\(i, v\)\{/.test(app),
     'el campo se arma en una función aparte');
// Si se redibujara el modal entero, lo que la persona venía tipeando en los
// otros campos se borraría.
r.ok(/insertAdjacentHTML\('beforeend', dmVarCampoHtml\(n, null\)\)/.test(agregar),
     'y se AGREGA uno, no se redibuja el modal: no se pierde lo tipeado');
r.ok(/if\(n >= DM_MAX_VARS\)\{ return; \}/.test(agregar),
     'con el tope de creación');
r.ok(/b\.style\.display='none'/.test(agregar),
     'y al llegar al tope el botón desaparece');
// Un botón que sigue ahí y no hace nada se lee como una falla de la app.
r.ok(/\+ Agregar otra/.test(app), 'el botón existe y dice qué hace');

r.seccion('Y ahora se nota que pueden ser varias:');

const bloque = app.slice(app.indexOf('function dmRenderVarsPersonales(){'),
                         app.indexOf('function dmVarCampoHtml'));
r.ok(/Tus propias variables/.test(bloque),
     'el bloque del diario ya no habla en singular');
r.ok(/Crear mis variables/.test(bloque),
     'ni el botón');
r.ok(/hasta '\+DM_MAX_VARS\+' cosas/.test(bloque),
     'y dice cuántas entran, que es la pregunta que se hace al leerlo');

r.seccion('El id de cada variable sigue siendo su clave:');

// Si el id se reasignara por posición, mover una variable de lugar borraría
// el historial de noches marcadas sin que nadie se entere.
r.ok(/data-vid="'\+\(\(v&&v\.id\)\|\|''\)\+'"/.test(app),
     'el campo viaja con el id que ya tenía');
r.ok(/const previas = dmGetVarsPersonales\(\);/.test(guardar) &&
     /el id se conserva/i.test(guardar),
     'y al guardar se conserva, no se reasigna por posición');

r.cerrar('Bajar un tope es borrar datos de la vista, salvo que el tope de leer sea otro.');
