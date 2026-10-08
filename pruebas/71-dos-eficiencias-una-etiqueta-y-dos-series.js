// Tres cosas.
//
// 1 · "La eficiencia promedio dice 61 % y el histograma marca solo el 23 % de
//     las noches por debajo del 85 %."
//
//     Las dos estaban bien calculadas. Medían cosas distintas con el mismo
//     nombre, que es peor. Había TRES implementaciones del tiempo en cama:
//     las métricas clínicas y el motor contaban de acostarse a LEVANTARSE; el
//     histograma noche a noche contaba de acostarse a DESPERTARSE. En una
//     paciente que se despierta y se queda horas en la cama eso da dos
//     eficiencias distintas para la misma noche — y la del histograma puede
//     pasar de 100 %, que es cómo una noche mala terminaba pintada de verde.
//
// 2 · "Sigue habiendo pacientes con insomnio auto y sin la etiqueta en el
//     listado."
//
//     El arreglo anterior (persistir al pintar el Resumen) solo alcanzaba al
//     paciente cuya ficha se abría. El listado seguía resolviendo a ciegas:
//     backgroundFillMissingTags corría resolvePatientTags con _dmPatronDiario
//     vacío, porque esas señales solo las publicaba el Resumen. Y encima solo
//     recalculaba cuando `resolved` no existía: un [] escrito hace meses sin
//     mirar el diario quedaba fijo para siempre.
//
// 3 · Las series por semana del panel de administración.

const C = require('./comun');
const r = C.crearReporte('Dos eficiencias, una etiqueta y dos series');

const app = C.leerApp();
const css = C.leerCss();
const fs = require('fs');
const path = require('path');
const motor = fs.readFileSync(
  path.join(__dirname, '..', 'js', 'dormetria-motor-orientacion.js'), 'utf8');

r.seccion('1 · Un solo tiempo en cama para toda la app:');

r.ok(/function dmTIBNoche\(e\)\{/.test(app), 'existe una sola definición');
const tib = app.slice(app.indexOf('function dmTIBNoche(e){'),
                      app.indexOf('window.dmTIBNoche = dmTIBNoche;'));
r.ok(/aMin\(e\.get_up_time\)/.test(tib), 'cuenta hasta LEVANTARSE');
r.ok(/uAbs - wAbs <= 8\*60/.test(tib),
     'y descarta el horario imposible: levantarse 8 h después de despertarse');

// Las tres que divergían, ahora llaman a la misma.
const serie = app.slice(app.indexOf('function dmSerieNocheHtml'),
                        app.indexOf('function dmSerieNocheHtml') + 4000);
r.ok(/const tib = dmTIBNoche\(e\);/.test(serie),
     'el histograma noche a noche la usa');
r.ok(!/let tib = wake - bed/.test(app),
     'y ya no queda la cuenta vieja de acostarse a despertarse');
r.ok(/const tibM = dmTIBNoche\(e\);/.test(app),
     'las métricas clínicas también');
r.ok(/typeof dmTIBNoche === 'function'/.test(motor),
     'y el motor, en tiempo de ejecución para poder cargar antes del inline');

// Más sueño que tiempo en cama es un horario mal cargado. Pintarlo como
// 118 % lo esconde adentro de una barra verde.
r.ok(/if\(tst <= tib\) ef = Math\.round\(tst\/tib\*100\)/.test(serie),
     'y una eficiencia de más de 100 % queda sin dato, no en verde');

r.seccion('Y la cuenta da bien:');

// Reproducción del caso: se acuesta 21:48, se despierta 01:00, se levanta
// 04:51, durmió 4 h 20. Con la regla vieja el denominador eran 3 h 12 y la
// eficiencia daba 135 %; con la buena son 7 h 03 y da 61 %.
const fn = new Function('return ' + tib.slice(tib.indexOf('function dmTIBNoche')))();
const noche = { bedtime:'21:48', wake_time:'01:00', get_up_time:'04:51' };
r.ok(fn(noche) === 423, 'de 21:48 a 04:51 son 7 h 03 (423 min)', String(fn(noche)));
r.ok(Math.round(260 / fn(noche) * 100) === 61,
     'y con 4 h 20 dormidas la eficiencia es 61 %, la misma del promedio');
r.ok(fn({ bedtime:'23:00', wake_time:'07:00' }) === 480,
     'sin hora de levantarse se usa la de despertarse, como antes');
r.ok(fn({ bedtime:'23:00', wake_time:'07:00', get_up_time:'06:00' }) === 480,
     'y un "me levanté antes de despertarme" se descarta');
r.ok(fn({ bedtime:'23:00', wake_time:'07:00', get_up_time:'20:00' }) === 480,
     'igual que levantarse trece horas después');
r.ok(fn({ bedtime:'23:00' }) === null, 'sin horarios no se inventa un número');

r.seccion('2 · Las etiquetas del diario llegan al listado:');

r.ok(/const DM_TAGS_V = 2;/.test(app),
     'cada etiqueta guardada lleva la versión con la que se calculó');
const bg = app.slice(app.indexOf('async function backgroundFillMissingTags(patients){'),
                     app.indexOf('async function viewPatient(email){'));
r.ok(/Number\(t\.v\|\|0\) !== DM_TAGS_V/.test(bg),
     'y se recalcula si la versión no coincide, no solo si falta');
// Esta es la de fondo: sin las señales publicadas, resolvePatientTags corre
// a ciegas y las dos etiquetas que salen del diario no aparecen nunca.
r.ok(/await dmPublicarSenalesDiario\(u\.email, u, recs\)/.test(bg),
     'las señales del diario se calculan ANTES de resolver');
r.ok(/db\.patch/.test(bg) && /resolved:st\.resolved, v:DM_TAGS_V/.test(bg),
     'y lo que se guarda lleva el sello');
// Guardar también el vacío: si no, ese paciente se recalcula entero cada vez
// que se abre el listado, para nada.
r.ok(/Se guarda SIEMPRE/.test(bg), 'incluso cuando queda sin etiquetas');

const pub = app.slice(app.indexOf('async function dmPublicarSenalesDiario'),
                      app.indexOf('window.dmPublicarSenalesDiario'));
r.ok(/window\._dmPatronDiario\[email\] !== undefined\) return/.test(pub),
     'no se recalcula si ya están: una consulta por paciente y basta');
r.ok(/sleep_diary\?patient_email=eq\./.test(pub) && /limit=30/.test(pub),
     'trae hasta 30 noches');
r.ok(/select=diary_date,bedtime,wake_time,get_up_time/.test(pub),
     'y solo las columnas que el motor mira');
r.ok(/dmMotorOrientacion\(recs\|\|\[\], diary, u\|\|\{email:email\}\)/.test(pub),
     'corre el mismo motor que el Resumen, no una regla paralela');
r.ok(/socialJetLagMin/.test(pub) && /sd_midpoint_min/.test(pub),
     'y publica también las dos señales de cronodisrupción');

r.seccion('La franja de la fila se repinta, no solo se agrega:');

const franja = app.slice(app.indexOf('function dmPintarFranjaFila'),
                         app.indexOf('async function backgroundFillMissingTags'));
// Antes era `if(!row.querySelector('.dm-patlist-stripe'))`: una etiqueta que
// cambiaba, o que el profesional descartaba, dejaba la franja vieja puesta.
r.ok(/if\(vieja\) vieja\.remove\(\)/.test(franja),
     'se saca la anterior antes de dibujar');
r.ok(/if\(!resolved \|\| !resolved\.length\) return/.test(franja),
     'y sin etiquetas no queda ninguna franja colgada');
r.ok(!/row && !row\.querySelector\('\.dm-patlist-stripe'\)/.test(app),
     'no quedó el agregado condicional viejo');

const persist = app.slice(app.indexOf('async function persistResolvedTags'),
                          app.indexOf('async function toggleDrTag'));
r.ok(/Number\(_t\.v\|\|0\)!==DM_TAGS_V/.test(persist),
     'al pintar el Resumen también se sella la versión');
r.ok(/dmPintarFranjaFila\(email, st\.resolved\)/.test(persist),
     'y se repinta la fila, que en escritorio está a la vista al lado');

r.seccion('3 · Las series por semana del panel de administración:');

const sem = app.slice(app.indexOf('function dmSerieSemanal(rows, nSem, modo, campoEmail){'),
                      app.indexOf('function dmHistoSemanalHtml'));
r.ok(/modo==='unicos' \? new Set\(\) : 0/.test(sem),
     'cuenta filas o correos distintos, según lo que se pregunte');
r.ok(/if\(atras < 0 \|\| atras >= nSem\) return/.test(sem),
     'y descarta lo que cae fuera de la ventana');

const histo = app.slice(app.indexOf('function dmHistoSemanalHtml(serie, color){'),
                        app.indexOf('async function showAdminPanel'));
// La semana en curso está a medias por definición: dibujarla llena la hace
// parecer una caída que no existe.
r.ok(/dm-est-parcial/.test(histo), 'la semana en curso va marcada');
r.ok(/const cerr = serie\.slice\(0, -1\)/.test(histo),
     'y queda afuera del cálculo de la tendencia');
r.ok(/cerr\.slice\(-4\)/.test(histo) && /cerr\.slice\(-8,-4\)/.test(histo),
     'que compara 4 semanas contra 4, no dos puntos sueltos');
r.ok(/Math\.abs\(d\) < 15/.test(histo),
     'y por debajo del 15 % no se afirma nada: eso lo hace un feriado');
r.ok(/Hacen falta 9 semanas/.test(histo),
     'con poca historia se dice que no alcanza, en vez de dibujar una flecha');

// La trampa que haría del gráfico una mentira.
const stats = app.slice(app.indexOf('// ── Las dos series por semana'),
                        app.indexOf('const b1 = bloque(\'Pacientes\''));
r.ok(/const _serieOk = !window\._admStatsRecorte && !window\._admStatsSinPermiso/.test(stats),
     'sin lectura completa NO se dibuja');
// Las filas vienen ordenadas de nueva a vieja: con el tope alcanzado faltan
// las semanas viejas y el histograma sería una rampa perfecta hacia arriba.
r.ok(/artefacto del tope de filas/.test(stats),
     'y queda escrito por qué: faltarían las semanas viejas, no las nuevas');
r.ok(/serie:_serieAct/.test(app) && /serie:_serieReg/.test(app),
     'las dos series van adentro de las tarjetas que ya existían');

r.ok(/\.dm-est-histo\{/.test(css) && /\.dm-est-parcial\{/.test(css),
     'con su CSS');

r.cerrar('Dos cuentas distintas con el mismo nombre se leen como la misma, y una de las dos siempre miente.');
