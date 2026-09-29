// En el actograma de una paciente aparecían barras dobles: la misma noche
// cargada dos veces. No es un problema de dibujo — el análisis promedia
// las dos filas como si fueran dos noches distintas, así que una noche
// mala cargada dos veces pesa el doble en la eficiencia, en la latencia y
// en todo lo que sale de ahí.
//
// Nada lo impedía: ni la base (no hay índice único) ni la app.
//
// Y había un segundo bicho de la misma familia: showDiaryNew() NO limpiaba
// S._editingDiaryId. Quien entraba a editar una noche y se volvía sin
// guardar dejaba la marca puesta, y el siguiente "+ Nuevo" PISABA la noche
// vieja en vez de crear una.

const C = require('./comun');
const r = C.crearReporte('Una noche, una fila');

const app = C.leerApp();

r.seccion('Antes de crear, se mira si esa noche ya está:');

const i = app.indexOf('const workPayload=Object.assign({},payload);');
const save = app.slice(i, i + 1500);
r.ok(/diary_date=eq\./.test(save),
     'se consulta por paciente y fecha');
r.ok(/S\._editingDiaryId = _yaHay\[0\]\.id/.test(save),
     'si existe, se actualiza esa fila en vez de crear otra');

r.seccion('Pero un fallo de red no puede costarle la carga a nadie:');

r.ok(/no se pudo verificar duplicado/.test(save),
     'si la verificación falla, se sigue igual y queda el aviso en consola');

r.seccion('El diario infantil hace lo mismo:');

const j = app.indexOf('[DIARIO-NIÑO] ya existía la noche');
r.ok(j > 0, 'misma protección del lado del niño');

r.seccion('Y editar dejó de ser un estado pegajoso:');

const k = app.indexOf('function showDiaryNew(editandoId){');
r.ok(k > 0, 'showDiaryNew recibe explícitamente qué se está editando');
r.ok(/S\._editingDiaryId = editandoId \|\| null;/.test(app.slice(k, k + 400)),
     'y abrir sin declararlo limpia la marca');
r.ok(/showDiaryNew\(id\);/.test(app),
     'la edición pasa el id, en vez de dejarlo en una variable suelta');
r.ok(/function showChildDiaryNew\(editandoId\)\{/.test(app),
     'lo mismo en el diario infantil');

r.cerrar('Dos filas para la misma noche hacen que esa noche pese el doble.');
