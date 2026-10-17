// "Quiero grabar con el perfil demo pero me carga mal: no me registra la hora
//  de acostarse y finalmente me pone 00 hs de sueño."
//
// La captura de la pantalla de revisión lo muestra entero:
//
//     Hora de acostarte          sin completar
//     Cuánto tardaste en dormirte       5–15 min
//     Hora en que te despertaste           07:00
//     Hora en que te levantaste            07:10
//
// y la consola, inmediatamente después de guardar:
//
//     [DIARIO] verificación OK — todo lo cargado viaja al servidor
//
// Las dos cosas son ciertas a la vez, y ahí está el defecto. La
// verificación compara lo CARGADO contra lo que viaja: si el campo quedó
// vacío, no hay nada cargado, así que informa OK. Está mirando que no se
// pierda nada en el camino, no que el camino tenga sentido.
//
// Y saveDiary guardaba igual: bedtime null, sleep_minutes null. En la serie
// esa noche queda como 00 h de sueño — sin tiempo en cama, sin eficiencia,
// sin barra en el actograma — y arrastra el promedio del paciente. No es un
// registro incompleto: es un dato falso.
//
// La pantalla de revisión ya avisaba, en ámbar, "sin completar". Avisar sin
// frenar no alcanza: quien carga a las siete de la mañana aprieta Guardar
// igual. Y en Safari de escritorio el campo de hora es difícil de completar,
// así que pasa sin que la persona lo note.

const C = require('./comun');
const vm = require('vm');
const r = C.crearReporte('Una noche sin hora no es una noche');

const app = C.leerApp();
const css = C.leerCss();

r.seccion('No se puede guardar sin las dos horas:');

r.ok(/if\(!bed\)\s+_faltan\.push/.test(app), 'falta la hora de acostarse: frena');
r.ok(/if\(!wake\) _faltan\.push/.test(app), 'falta la de despertarse: frena');
// Frenar sin decir qué ni llevar al lugar es igual de inútil que no frenar.
r.ok(/toast\('Falta '\+_faltan\.map/.test(app), 'y dice qué falta');
r.ok(/dmCorregirDesdeRevision\(_faltan\[0\]\.paso\)/.test(app),
     'y vuelve al paso donde se carga');
r.ok(/boxShadow='0 0 0 2px #e11d48'/.test(app), 'con el campo marcado');
// Si el botón queda disabled de un intento anterior, el segundo click no
// hace nada y la persona concluye que la app está rota. Ya pasó.
r.ok(/_faltan\.length\)\{[\s\S]{0,900}save-diary-btn'\); if\(_b\) _b\.disabled=false;/.test(app),
     'y el botón de guardar se re-habilita antes de volver');

r.seccion('Pero la noche en vela sí se puede guardar:');

// "No me dormí en toda la noche" es un dato, y en ese caso lo que se pide
// es acostarse + levantarse, no acostarse + despertarse. Esa rama ya
// existía y el guardarraíl nuevo no puede pisarla.
r.ok(/if\(!_sinDormir\)\{\s*\n\s*const _faltan/.test(app),
     'el guardarraíl no se aplica a "no me dormí en toda la noche"');

r.seccion('Y en la revisión se ve que es obligatorio, no opcional:');

r.ok(/v:hhmm\(V\('d-bed'\)\), obl:true/.test(app), 'la hora de acostarse va marcada');
r.ok(/v:hhmm\(V\('d-wake'\)\), obl:true/.test(app), 'y la de despertarse');
r.ok(/f\.obl\?' dm-rev-falta':' dm-rev-vacio'/.test(app),
     'y se pintan distinto de lo que falta y es opcional');
r.ok(/\.dm-rev-falta\{/.test(css), 'con su regla');
r.ok(/color:#ff8b8b/.test(css), 'en rojo, no en ámbar');

r.seccion('Corriéndolo:');

const ctx = C.appEvaluada();
r.ok(!!ctx, 'la app se evalúa entera');
if (ctx) {
  const { D, $, corr } = C.conDom(ctx);
  // Después de guardar, la app navega al inicio del diario. Sin esos
  // contenedores el guardado funciona igual pero la navegación tira, y el
  // proceso se cae DESPUÉS de que las comprobaciones pasaron: una prueba
  // que termina en rojo por el decorado no distingue el día que falle de
  // verdad.
  D.body.innerHTML = '<div id="screen-diary-new" class="screen"><div class="scroll">' +
                     '<div id="diary-form-content"></div></div></div>' +
                     '<div id="screen-diary-home" class="screen"><div id="diary-list"></div>' +
                     '<div id="diary-graf"></div><div id="diary-pillar-bars"></div></div>' +
                     '<div id="toast"></div>';
  corr("S.user={email:'x@y.com',role:'patient',dob:'1988-03-21',sex:'F'," +
       "weight_kg:62,height_cm:164}; S.profile=S.user; S.ageGroup='adult';" +
       "window.__posts=[]; window.__toasts=[];" +
       "db.get=async function(){ return []; };" +
       "db.post=async function(u,b){ window.__posts.push(b); return [{id:1}]; };" +
       "db.patch=async function(u,b){ window.__posts.push(b); return [{id:1}]; };");
  try { corr('showDiaryNew()'); } catch (_) {}
  corr("try{ toast=function(m){ window.__toasts.push(m); }; }catch(_){}");

  const guardar = async function () {
    corr('window.__posts=[]; window.__toasts=[];');
    try { await corr('saveDiary()'); } catch (_) {}
    await new Promise(function (ok) { setTimeout(ok, 60); });
    return { posts: corr('window.__posts'), toasts: corr('window.__toasts') };
  };

  // La navegación posterior al guardado no es lo que esta prueba mide.
  process.on('uncaughtException', function (e) {
    if (!/innerHTML/.test(String(e && e.message))) throw e;
  });

  (async function () {
    if ($('d-date')) $('d-date').value = '2026-10-16';
    if ($('d-latency')) $('d-latency').value = '10';
    // Exactamente la captura: despertar y levantarse cargados, acostarse no.
    if ($('d-wake')) $('d-wake').value = '07:00';
    if ($('d-getup')) $('d-getup').value = '07:10';
    if ($('d-bed')) $('d-bed').value = '';

    const sinCama = await guardar();
    r.ok(sinCama.posts.length === 0,
         'sin hora de acostarse NO se guarda nada', sinCama.posts.length + ' escrituras');
    r.ok(sinCama.toasts.some(t => /Falta .*acostaste/.test(t)),
         'y se avisa qué falta', sinCama.toasts.join(' / '));

    // Con la hora puesta, se guarda como siempre.
    if ($('d-bed')) $('d-bed').value = '23:10';
    const ok = await guardar();
    r.ok(ok.posts.length === 1, 'con la hora puesta sí se guarda');
    if (ok.posts.length) {
      const p = ok.posts[0];
      r.ok(p.bedtime === '23:10', '  con su bedtime', String(p.bedtime));
      r.ok(p.sleep_minutes > 0,
           '  y con minutos de sueño de verdad, no 0', String(p.sleep_minutes));
    }

    r.cerrar('Avisar sin frenar deja entrar el dato igual, y después nadie sabe que esa noche no existió.');
  })();
}

// ── Lo que apareció de paso en la consola ─────────────────────────────
//
//     Failed to load resource: 400
//     doctor_patients?patient_email=eq...&select=doctor_email,rating,created_at
//
// Dos veces por carga, en rojo, y nadie lo miraba porque la llamada tenía
// .catch(()=>[]). `doctor_patients` no tiene columna `created_at`: la
// consulta siempre falla, siempre devuelve lista vacía, y el aviso de
// "¿querés calificar la atención?" NUNCA se mostró a ningún paciente.
//
// Un .catch que devuelve el valor neutro convierte un error en una
// función que no existe. Es el mismo problema que una prueba que no
// puede fallar.
const rc = C.crearReporte('La calificación que nunca se pedía');
rc.seccion('La consulta ya no muere en el 400:');
rc.ok(/\[CALIFICAR\] doctor_patients sin created_at/.test(app),
      'si falla, queda dicho en la consola');
rc.ok(/'&select=doctor_email,rating'\)\.catch/.test(app),
      'y se reintenta sin la columna que no existe');
rc.ok(/if\(vinculos === null\)\{/.test(app),
      'el primer intento distingue "fallo" de "no hay vínculos"');
// Esa diferencia es todo el arreglo: antes las dos cosas eran [].
rc.ok(/return null; \}\);\n    if\(vinculos === null\)/.test(app),
      'que antes eran lo mismo, y por eso no se notaba');
rc.cerrar('Un catch que devuelve el valor neutro convierte un error en una función que no existe.');

// ── La CAUSA, no la consecuencia ──────────────────────────────────────
//
// Lo de arriba impide guardar la noche rota. No explica por qué el campo
// quedó vacío teniendo al lado dos horas bien cargadas.
//
// `<input type="time">` no es un campo de texto: son casilleros separados
// —hora, minutos, y en locales de 12 h también AM/PM—. Si se completa uno
// y no los otros, la pantalla MUESTRA algo escrito y `.value` devuelve
// cadena vacía. Está en la especificación: un control de hora sin valor
// completo no tiene valor.
//
// O sea que el campo se ve lleno y la app lo lee vacío. En Safari de
// escritorio, que es donde pasó, los casilleros se completan tecleando y
// es fácil dejar uno a medio escribir sin notarlo.
//
// El navegador sí lo sabe: validity.badInput queda en true exactamente en
// ese caso. Nunca se le había preguntado.
const rb = C.crearReporte('Una hora a medio escribir');
rb.seccion('Ahora se le pregunta al navegador:');
rb.ok(/function dmHoraIncompleta\(el\)\{/.test(app), 'dmHoraIncompleta existe');
rb.ok(/!el\.value && !!\(el\.validity && el\.validity\.badInput\)/.test(app),
      'y mira badInput, que es la señal estándar para esto');
// Sin valor Y sin badInput es un campo que nunca se tocó: eso no es un error.
rb.ok(/!el\.value &&/.test(app),
      'un campo vacío sin tocar no cuenta como incompleto');

rb.seccion('Y se avisa en el campo, no cuatro pantallas después:');
rb.ok(/function dmAvisarHora\(el\)\{/.test(app), 'el aviso va pegado al campo');
rb.ok(/a medio escribir/.test(app), 'y dice qué pasó');
rb.ok(/\.dm-hora-mal\{/.test(css), 'con su regla');
// Un campo de hora incompleto NO dispara change —nunca llegó a tener
// valor—, así que engancharse sólo a change deja el aviso sin salir nunca.
rb.ok(/addEventListener\('blur'[\s\S]{0,220}dmAvisarHora/.test(app),
      'escuchando blur además de change, que es lo que lo hace aparecer');
rb.ok(/dmEcoHora\(el\); dmAvisarHora\(el\);/.test(app), 'y también en change');

rb.seccion('Y no se avanza de paso con una hora a medio escribir:');
rb.ok(/function dmHoraMalDelPaso\(n\)\{/.test(app), 'se busca en el paso que se está viendo');
rb.ok(/if\(mal\)\{ dmAvisarHora\(mal\);[\s\S]{0,120}return; \}/.test(app),
      'y si la hay, dmPasoIr frena');
// Volver ATRÁS a corregir no puede estar bloqueado por el mismo error.
rb.ok(/if\(n > \(window\._dmPaso\|\|1\)\)\{/.test(app),
      'pero sólo hacia adelante: volver a corregir nunca se bloquea');

rb.seccion('Y al guardar, "incompleta" no es lo mismo que "falta":');
rb.ok(/completar la hora en que te acostaste/.test(app),
      'si el campo tiene algo escrito, se dice "completar"');
// "Falta la hora" frente a un campo que muestra algo escrito suena a que
// la app está equivocada, y la persona la vuelve a escribir igual.
rb.ok(/_med\('d-bed'\)/.test(app) && /_med\('d-wake'\)/.test(app),
      'en los dos campos');
rb.cerrar('El campo se veía lleno y el valor era vacío: el navegador lo sabía y nadie le preguntó.');
