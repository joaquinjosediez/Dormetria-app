// "Una paciente no ve dónde poner si está en su día menstrual."
//
// No se cambió nada: el bloque "Tu ciclo" está en el paso 4 del diario desde
// siempre, y la condición que lo muestra no se toca desde mod119. El problema
// es la condición en sí:
//
//     ${((S.user && S.user.sex) === 'F') ? ... : ''}
//
// Tres formas de que eso dé falso en alguien que menstrúa:
//
//   · El sexo es OPCIONAL en el perfil. Quien nunca lo completó no tiene 'F'
//     ni nada, y el bloque entero desaparece. Sin aviso, sin explicación:
//     desde afuera se ve como que la app lo sacó. Es, con diferencia, el caso
//     más probable, porque no hay nada en el alta que obligue a cargarlo.
//   · El registro de profesionales guarda 'Femenino', no 'F'. Un perfil
//     migrado o cargado por esa vía no entra.
//   · Cualquier variante de capitalización.
//
// Y un dato perdido acá no es cosmético: la menstruación y los cinco días
// previos se analizan como dos factores separados en el panel. Sin la marca,
// esos dos factores no existen para esa paciente.

const C = require('./comun');
const r = C.crearReporte('El ciclo no desaparece sin decir nada');

const app = C.leerApp();

r.seccion('La condición dejó de ser una comparación suelta:');

r.ok(/\$\{dmSigueCiclo\(S\.user\) \? /.test(app),
     'el diario pregunta por un criterio con nombre');
r.ok(!/\(\(S\.user&&S\.user\.sex\)==='F'\)/.test(app),
     'y no quedó la comparación literal contra una sola cadena');

// Desde el comentario que explica el criterio, no desde la firma: el porqué
// es la mitad del arreglo y tiene que estar fijado igual que el código.
const fn = app.slice(app.indexOf('// ¿Esta persona menstrua?'),
                     app.indexOf('window.dmSigueCiclo'));
r.ok(/sx === 'f' \|\| sx === 'femenino'/.test(fn),
     'acepta cualquier forma de femenino');
r.ok(/String\(u\.sex\|\|''\)\.trim\(\)\.toLowerCase\(\)/.test(fn),
     'sin importar mayúsculas ni espacios');
// Dos respuestas que solo puede haber dado alguien que menstrúa.
r.ok(/u\.has_menarche  === true/.test(fn), 'y "ya tuve la menarca" alcanza');
r.ok(/u\.has_menopause === false/.test(fn), 'y "no, aún menstruo" también');

r.seccion('`track_menstrual` NO se usa, y está dicho por qué:');

// Esa columna la escribe un checkbox con display:none que está `checked` de
// fábrica y no se destilda nunca: vale true para todo paciente que haya
// guardado Mi Perfil, hombres incluidos. Usarla como señal habría mostrado
// el bloque del ciclo a medio padrón.
r.ok(/NO se usa `track_menstrual`/.test(fn), 'queda escrito que no sirve como señal');
r.ok(!/track_menstrual/.test(fn.replace(/\/\/[^\n]*/g, '')),
     'y no se la consulta en el código, solo se la menciona en el comentario');

const guardar = app.slice(app.indexOf("track_menstrual:(function(){"),
                          app.indexOf("track_menstrual:(function(){") + 420);
r.ok(/_sx==='f' \|\| _sx==='femenino'/.test(guardar),
     'de ahora en más sigue al sexo elegido, que es lo que decía representar');

r.seccion('Y cuando no se sabe, se dice:');

const indef = app.slice(app.indexOf('function dmCicloIndefinido(u){'),
                        app.indexOf('window.dmCicloIndefinido'));
r.ok(/if\(dmSigueCiclo\(u\)\) return false/.test(indef),
     'no se ofrece si ya se muestra');
r.ok(/if\(sx\) return false/.test(indef),
     'ni a quien cargó un sexo distinto: ahí no hay nada que preguntar');
// Una nena de cuatro años y una señora de 75 no necesitan el ofrecimiento.
r.ok(/edad < 9 \|\| edad > 60/.test(indef),
     'ni fuera de la franja en que la pregunta tiene sentido');
r.ok(/Quiero registrar mi ciclo/.test(app),
     'y el aviso lleva un botón, no solo una explicación');
r.ok(/dmIrACargarSexo\(\)/.test(app), 'que va a donde se arregla');

const ir = app.slice(app.indexOf('function dmIrACargarSexo(){'),
                     app.indexOf('window.dmIrACargarSexo'));
// Mandar a la pantalla de perfil pierde la noche a medio cargar.
r.ok(/openMiPerfil\(\)/.test(ir),
     'el perfil se abre como modal ENCIMA del diario');
r.ok(/renderMiPerfilEdit\(c\)/.test(ir),
     'directo a la edición: quien tocó el botón ya sabe a qué viene');
r.ok(/sx\.scrollIntoView/.test(ir), 'y con el campo de sexo a la vista');

r.seccion('El bloque sigue donde estaba, en el paso 4:');

// El agrupador por títulos (DM_PASOS.titulos) quedó desactivado: los pasos se
// escriben directamente en el HTML. Vale la pena fijarlo, porque en mod260 se
// renombró "Tu propia variable" → "Tus propias variables" y si ese agrupador
// siguiera vivo, el bloque de variables se habría ido al paso 5 sin que nadie
// lo notara.
const paso4 = app.slice(app.indexOf('<div class="dm-paso" data-paso="4"'),
                        app.indexOf('<div class="dm-paso" data-paso="5"'));
r.ok(/id="period-section"/.test(paso4), '"Tu ciclo" está en el paso 4');
r.ok(/id="dm-vars-slot"/.test(paso4), 'y las variables propias también');
r.ok(/const k=p\.titulos\.findIndex/.test(app) &&
     app.indexOf('return;\n  }catch(e){ console.warn(\'[DIARIO]\'') <
     app.indexOf('const k=p.titulos.findIndex'),
     'y el agrupador por títulos sigue desactivado, así que renombrar no mueve nada');

r.seccion('Lo que se pierde si no está, para que no se subestime:');

r.ok(/id:'premenstrual'/.test(app) && /DM_DIAS_PREMENSTRUAL/.test(app),
     'la menstruación y los días previos son dos factores del análisis');
r.ok(/has_period/.test(app), 'y se guardan en su propia columna');

r.cerrar('Un campo que desaparece sin decir por qué se lee como una app rota, no como un perfil incompleto.');
