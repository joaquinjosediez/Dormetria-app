// El paso 2 del onboarding ("¿Cuál es tu objetivo principal?") dejaba elegir
// uno solo. Pero los objetivos no son excluyentes: quien viene derivado por su
// médico para seguimiento también quiere entender sus patrones y mejorar sus
// hábitos. Al obligar a elegir uno, la app se quedaba con una foto incompleta
// y las tarjetas del inicio se armaban sobre eso.
//
// Se vuelve multi-selección, como ya eran los síntomas del paso 3. El primero
// que marca queda como "principal" — es lo que lee el resto de la app y lo que
// guarda la columna onboarding_goal, que es de texto.

const C = require('./comun');
const r = C.crearReporte('El objetivo no es uno solo');

const html = C.leerHtml();

r.seccion('Se pueden marcar varios:');

r.ok(/Podés elegir más de uno/.test(html.slice(
       html.indexOf('id="ob-step-2"'),
       html.indexOf('id="ob-step-2"') + 600)),
     'el subtítulo lo dice');

const paso2 = html.slice(html.indexOf('<!-- Paso 2'), html.indexOf('<!-- Paso 3'));
const conToggle = (paso2.match(/obToggleGoal\('/g) || []).length;
r.ok(conToggle === 4, 'las cuatro opciones alternan en vez de excluirse',
     conToggle + ' con obToggleGoal');
r.ok(!/obSelect\(2,/.test(paso2), 'ninguna quedó con el selector excluyente');

r.ok(/function obToggleGoal/.test(html), 'existe la función');
const bloque = html.slice(html.indexOf('function obToggleGoal'),
                          html.indexOf('window.obToggleGoal'));
r.ok(/OB\.goals\.splice\(idx, 1\)/.test(bloque), 'desmarcar saca de la lista');
r.ok(/OB\.goal = OB\.goals\.length \? OB\.goals\[0\] : null/.test(bloque),
     'y el primero queda como principal');

r.seccion('Lo que ya leía el objetivo sigue andando:');

r.ok(/var _metas = \(ob\.goals && ob\.goals\.length\) \? ob\.goals : \(ob\.goal \? \[ob\.goal\] : \[\]\)/.test(html),
     'los registros viejos, con un solo goal, se siguen leyendo');
r.ok(/_quiere\('diagnose'\) \|\| _quiere\('followup'\)/.test(html),
     'las tarjetas del inicio preguntan si está entre los elegidos');
r.ok(!/ob\.goal===/.test(html),
     'no quedó ninguna comparación por igualdad');

r.seccion('Y el guardado no se pierde entero si falta la columna:');

const guardar = html.slice(html.indexOf('function obFinish()'),
                           html.indexOf('function obSkipAll()'));
r.ok(/db\.patchFlexible \? db\.patchFlexible : db\.patch/.test(guardar),
     'usa patchFlexible, que descarta la columna que no existe');
r.ok(/onboarding_goals: OB\.goals/.test(guardar), 'manda la lista completa');
r.ok(/onboarding_goal: OB\.goal/.test(guardar),
     'y sigue mandando el principal a la columna de texto de siempre');
r.ok(/console\.warn\('\[onboarding\] no se pudo guardar:'/.test(guardar),
     'y un fallo deja rastro: antes el .catch estaba vacío');

r.cerrar('Obligar a elegir un objetivo no simplifica al paciente: le borra la mitad de la respuesta.');
