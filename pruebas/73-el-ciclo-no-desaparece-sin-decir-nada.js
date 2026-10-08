// "Una paciente no ve dónde poner si está en su día menstrual."
//
// No se había cambiado nada: el bloque "Tu ciclo" está en el paso 4 del
// diario desde siempre. Lo que estaba mal era la pregunta.
//
// La condición era `S.user.sex === 'F'`, a secas, desde mod119. O sea: el
// bloque aparecía solo si podíamos demostrar que la persona es mujer. Y el
// sexo es OPCIONAL en el perfil — nada en el alta obliga a cargarlo —, así
// que quien nunca lo completó no tiene 'F' ni nada y el bloque desaparecía
// sin una sola pista. Desde afuera se ve como una app rota, no como un
// perfil incompleto.
//
// Ahora la pregunta es la otra, que es la que se puede contestar con lo que
// hay: ¿sabemos que NO corresponde? Se oculta únicamente con una respuesta
// explícita.
//
// El costo de los dos errores no es simétrico, y por eso el default es
// mostrar: a un hombre que nunca cargó el sexo le aparece un botón de más
// que apaga con un toque; a una mujer se le perdían dos factores del
// análisis —los días de sangrado y los cinco previos— sin que se enterara
// ninguno de los dos.

const C = require('./comun');
const r = C.crearReporte('El ciclo no desaparece sin decir nada');

const app = C.leerApp();
const css = C.leerCss();

r.seccion('Se muestra salvo que haya una respuesta explícita:');

r.ok(/\$\{dmSigueCiclo\(S\.user\) \? /.test(app),
     'el diario pregunta por un criterio con nombre');
r.ok(!/\(\(S\.user&&S\.user\.sex\)==='F'\)/.test(app),
     'y no quedó la comparación literal contra una sola cadena');

const fn = app.slice(app.indexOf('// ¿Se muestra "Tu ciclo" en el diario?'),
                     app.indexOf('window.dmSigueCiclo'));
// Un comentario va partido en varias líneas con "// " al principio: buscar
// una frase entera en crudo no encuentra nada. Y al revés, buscar un nombre
// de columna en crudo lo encuentra aunque solo esté nombrado en el comentario
// para decir que NO se usa. Las dos vistas, por separado.
const prosa  = (t) => t.replace(/^\s*\/\/ ?/gm, '').replace(/\s+/g, ' ');
const codigo = (t) => t.split('\n').filter(l => !/^\s*\/\//.test(l)).join('\n');
// La inversión es el arreglo: antes había que demostrar que SÍ, ahora hay que
// demostrar que NO.
r.ok(/return true;\n\}/.test(fn),
     'el default es mostrarlo: lo que se demuestra es la excepción');
r.ok(/sx === 'M' \|\| sx === 'X'/.test(fn),
     'se oculta con sexo masculino u otro');
r.ok(/const sx = dmSexoNorm\(u\.sex\)/.test(fn),
     'leyendo el campo con la MISMA normalización que los filtros de escalas');
r.ok(/u\.has_menarche === false/.test(fn), 'o con "todavía no tuve la menarca"');
r.ok(/edad < 9/.test(fn), 'o con una edad en que no puede haberla');
r.ok(/El costo de los dos errores no es el mismo/i.test(prosa(fn)),
     'y queda escrito por qué el default es ese y no el otro');

r.seccion('`track_menstrual` NO se usa, y está dicho por qué:');

// Esa columna la escribe un checkbox con display:none que está `checked` de
// fábrica y no se destilda nunca: vale true para todo paciente que haya
// guardado Mi Perfil, hombres incluidos.
r.ok(/NO se usa `track_menstrual`/.test(fn), 'queda escrito que no sirve como señal');
r.ok(!/track_menstrual/.test(codigo(fn)),
     'y no se la consulta en el código');

const guardar = app.slice(app.indexOf("track_menstrual:(function(){"),
                          app.indexOf("track_menstrual:(function(){") + 420);
r.ok(/_sx==='f' \|\| _sx==='femenino'/.test(guardar),
     'de ahora en más sigue al sexo elegido, que es lo que decía representar');

r.seccion('Se apaga igual que el alcohol, que es lo que el paciente ya conoce:');

r.ok(/No menstrúo · no me preguntes más/.test(app), 'mismo texto y mismo lugar');
r.ok(/class="dm-alc-nunca" onclick="dmNoTengoCiclo\(\)"/.test(app),
     'y la misma clase, así que se ve igual');

const apagar = app.slice(app.indexOf('// ── El ciclo se apaga como el alcohol'),
                         app.indexOf('window.dmNoTengoCiclo=dmNoTengoCiclo'));
r.ok(/localStorage\.setItem\('dm_sin_ciclo','1'\)/.test(apagar),
     'la preferencia vive donde la del alcohol');
// Esto es lo que NO hay que hacer, y por eso está fijado: poner "ya llegó a
// la menopausia" en la ficha de una mujer de 30 con anticoncepción continua,
// solo para esconder un botón, es inventar un diagnóstico. Y encima
// habilitaría la MRS y bloquearía la PSST.
r.ok(!/has_menopause/.test(codigo(apagar)),
     'y NO escribe has_menopause: esconder un botón no es un diagnóstico');
r.ok(/inventar un diagnostico/i.test(prosa(apagar)),
     'con el motivo escrito, para que nadie lo "simplifique" después');
r.ok(/_periodActive\) return/.test(apagar),
     'y editando una noche que TIENE el período marcado, no se esconde');

const volver = app.slice(app.indexOf('function dmVuelveElCiclo(){'),
                         app.indexOf('function dmAplicarSinCiclo(){'));
r.ok(/localStorage\.removeItem\('dm_sin_ciclo'\)/.test(volver), 'y se puede volver atrás');
r.ok(/Ciclo: no lo registro/.test(app) && /dmVuelveElCiclo\(\)/.test(app),
     'con el aviso y el "cambiar" a la vista, no escondido en el perfil');
r.ok(/\.dm-alc-aviso\{/.test(css) && /\.dm-alc-oculto\{/.test(css),
     'reusando el CSS que ya existía');

r.seccion('Y se aplica al abrir el formulario, con el del alcohol:');

r.ok(/try\{ dmAplicarSinAlcohol\(\); \}catch\(_\)\{\}\n\s*try\{ dmAplicarSinCiclo\(\); \}catch\(_\)\{\}/.test(app),
     'en el mismo timeout, cada uno en su try');

r.seccion('El bloque sigue donde estaba, en el paso 4:');

const paso4 = app.slice(app.indexOf('<div class="dm-paso" data-paso="4"'),
                        app.indexOf('<div class="dm-paso" data-paso="5"'));
r.ok(/id="dm-campo-ciclo"/.test(paso4), '"Tu ciclo" está en el paso 4');
r.ok(/id="period-section"/.test(paso4) && /id="period-btn"/.test(paso4),
     'con el botón de marcar la noche');
r.ok(/id="dm-vars-slot"/.test(paso4), 'y las variables propias también');
// El agrupador por títulos (DM_PASOS.titulos) quedó desactivado: los pasos se
// escriben directo en el HTML. Si siguiera vivo, el renombre de "Tu propia
// variable" de mod260 habría mandado ese bloque al paso 5 sin que se notara.
r.ok(app.indexOf("return;\n  }catch(e){ console.warn('[DIARIO]'") <
     app.indexOf('const k=p.titulos.findIndex'),
     'y el agrupador por títulos sigue desactivado: renombrar no mueve nada');

r.seccion('Lo que se pierde si no está, para que no se subestime:');

r.ok(/id:'premenstrual'/.test(app) && /DM_DIAS_PREMENSTRUAL/.test(app),
     'la menstruación y los días previos son dos factores del análisis');
r.ok(/has_period/.test(app), 'y se guardan en su propia columna');

r.seccion('Y no hay un segundo interruptor que lo tape después:');

// Esta es la que de verdad le escondía el bloque a la paciente que lo
// reportó, y la encontré recién cuando vino su ficha: sex='F', 45 años,
// menopausia sin marcar... y track_menstrual=false.
//
// showPeriodSectionIfFemale corría 100 ms después de abrir el diario y hacía
// display:none si track_menstrual era false. El formulario dibujaba la
// sección y esto la tapaba. Desde afuera es idéntico a que no exista.
//
// Y track_menstrual no lo eligió nadie: sale de un checkbox con display:none
// y `checked` de fábrica, leído como `(g('mp-menstrual') && ...checked) ||
// false`. Si el perfil se guarda por un camino donde ese input no está en el
// DOM, el `|| false` escribe false solo.
const ver = app.slice(app.indexOf('function showPeriodSectionIfFemale(){'),
                      app.indexOf('// Mi perfil: por default se muestra un resumen'));
r.ok(!/track_menstrual/.test(codigo(ver)),
     'ya no lee track_menstrual');
r.ok(!/display = .*\? 'block' : 'none'/.test(ver) && !/: 'none'/.test(codigo(ver)),
     'y no puede esconder nada: solo destapa');
r.ok(/style\.display === 'none'\) campo\.style\.display = ''/.test(ver),
     'destapa lo que haya quedado oculto en una app instalada con el DOM viejo');
r.ok(/ERA EL INTERRUPTOR ESCONDIDO/.test(ver),
     'y queda escrito qué era, para que nadie lo "restaure"');

// Un ajuste visible que no hace nada es peor que no tenerlo: quien lo lee
// cree que ahí está el problema.
r.ok(!/_mpRow\('Seguimiento menstrual'/.test(app),
     'y el renglón muerto del perfil se fue con él');

// El único que puede esconder el bloque es la decisión de la persona.
r.ok(/localStorage\.getItem\('dm_sin_ciclo'\)==='1'/.test(app),
     'lo único que lo esconde es que ella haya dicho que no menstrúa');

r.seccion('Una sola forma de leer el sexo en toda la app:');

// Este campo ya costó dos bugs. El de "Tu ciclo", y otro que no deja rastro:
// los filtros de escalas declaran sex:['F'] y comparaban la cadena cruda, así
// que una paciente guardada como 'Femenino' —como las guarda el registro de
// profesionales, y como pueden haber quedado perfiles migrados— se quedaba
// sin MRS, sin PSST y sin FSFI. Una escala que no aparece no se nota.
const norm = app.slice(app.indexOf("function dmSexoNorm(v){"),
                       app.indexOf('window.dmSexoNorm'));
r.ok(/s==='f' \|\| s==='femenino' \|\| s==='female' \|\| s==='mujer'/.test(norm),
     'dmSexoNorm entiende las formas que de verdad hay en la base');
r.ok(/if\(!s\) return null/.test(norm),
     'y devuelve null sin dato: "no se sabe" no es "no es"');
r.ok(/const _sx = dmSexoNorm\(user\.sex\);/.test(app) &&
     /if\(f\.sex && _sx && !f\.sex\.includes\(_sx\)\) return false/.test(app),
     'los filtros de escalas la usan');
r.ok(!/f\.sex && user\.sex && !f\.sex\.includes\(user\.sex\)/.test(app),
     'y no quedó la comparación cruda');

r.cerrar('Cuando no se sabe, el default tiene que ser el error barato. Acá era mostrar de más, no perder un dato.');
