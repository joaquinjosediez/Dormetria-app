// Reporte de una paciente: marca el alcohol y las variables propias al cargar
// la noche, pero cuando vuelve a editar el registro aparecen desmarcados.
//
// Eran dos cosas distintas, y una de las dos borraba datos de verdad:
//
// 1. VARIABLES PROPIAS. editDiaryEntry() no restauraba custom_flags, y
//    dmRenderVarsPersonales() dibujaba todas con ⬜ fijo. Así que al editar
//    aparecían en blanco y, si guardaba sin volver a tocarlas, el guardado
//    escribía false en todas: editar una noche BORRABA lo marcado.
//
// 2. ALCOHOL. Quien alguna vez tocó "no tomo alcohol" deja
//    dm_sin_alcohol=1 en el dispositivo, y dmAplicarSinAlcohol() esconde el
//    campo a los 220 ms de abrir el formulario — también al editar una noche
//    donde sí había tomado. Veía "Alcohol: ninguno" encima de un dato real.
//
// Y de paso: el máximo de variables pasa de 2 a 5, con ids estables.

const C = require('./comun');
const r = C.crearReporte('Editar no borra lo marcado');

const html = C.leerHtml();

r.seccion('Las variables propias vuelven marcadas:');

const bloqueEdit = html.slice(html.indexOf('// ── Variables propias ──'),
                              html.indexOf('// ── Variables propias ──') + 1100);
r.ok(bloqueEdit.length > 100, 'editDiaryEntry restaura custom_flags');
r.ok(/_dmVarsNoche\[k\] = \(_cf\[k\] === true\)/.test(bloqueEdit),
     'y solo cuenta como marcado el true explícito');
r.ok(/JSON\.parse\(_cf\)/.test(bloqueEdit),
     'sirve tanto si viene como objeto o como texto');
r.ok(/dmRenderVarsPersonales\(\)/.test(bloqueEdit),
     'y vuelve a dibujar el bloque para que se vea');

const bloqueRender = html.slice(html.indexOf('function dmRenderVarsPersonales()'),
                                html.indexOf('function dmAbrirVarsPersonales()'));
r.ok(/_dmVarsNoche\[v\.id\]\?'✅':'⬜'/.test(bloqueRender),
     'el tilde refleja el estado en vez de estar fijo en ⬜');
r.ok(/const _on = !!_dmVarsNoche\[v\.id\]/.test(bloqueRender),
     'y el botón entero también, no solo el tilde');

r.seccion('El alcohol no se esconde sobre un dato que existe:');

const bloqueAlc = html.slice(html.indexOf('function dmAplicarSinAlcohol()'),
                             html.indexOf('function dmAplicarSinAlcohol()') + 900);
r.ok(/alcItems && alcItems\.length\) return/.test(bloqueAlc.replace(/\s+/g,' ')),
     'con alcohol cargado, el campo no se oculta');
r.ok(/dmVuelvoATomar\(\)/.test(html.slice(
       html.indexOf("alcItems=[{label:'Registrado previamente'"),
       html.indexOf("alcItems=[{label:'Registrado previamente'") + 600)),
     'y al editar una noche con alcohol se vuelve a mostrar');

r.seccion('Entran más de dos variables:');

r.ok(/const DM_MAX_VARS = 5;/.test(html), 'el máximo es 5');
r.ok(/for\(let i=0;i<n;i\+\+\)/.test(html.slice(
       html.indexOf('function dmAbrirVarsPersonales'),
       html.indexOf('function dmAbrirVarsPersonales') + 2600)),
     'el formulario arma los campos que hagan falta, no dos fijos');

r.seccion('Y los ids no se mueven de lugar:');

const bloqueGuardar = html.slice(html.indexOf('async function dmGuardarVarsPersonales'),
                                 html.indexOf('async function dmGuardarVarsPersonales') + 1600);
r.ok(/data-vid/.test(html) && /getAttribute\('data-vid'\)/.test(bloqueGuardar),
     'cada campo se acuerda del id que ya tenía');
r.ok(/while\(usados\['v'\+k\] \|\| previas\.some/.test(bloqueGuardar),
     'y un id nuevo nunca pisa uno usado');
// Con ids por posición, dar vuelta dos variables reasignaba v1 y v2 y las
// noches ya marcadas quedaban apuntando a la variable equivocada.
r.ok(!/vars\.push\(\{id:'v1'/.test(bloqueGuardar),
     'ya no se asignan v1 y v2 por posición');

r.cerrar('Una edición que guarda false donde había true no es un error de pantalla: borra el registro.');
