// El programa TCC-I de siete semanas.
//
// Es la parte de la app donde una persona con insomnio trabaja todos los días
// durante casi dos meses. Un error acá no se ve como un error: se ve como que
// el programa no registra el esfuerzo, y la persona abandona.
//
// Tres cosas que esta prueba cuida:
//   · Que el orden clínico sea el correcto (psicoeducación antes de pedir
//     cambios de horario).
//   · Que al marcar la última tarea pase algo EN EL MOMENTO.
//   · Que a nadie se le pierda el progreso al cambiar la numeración.

const C = require('./comun');
const r = C.crearReporte('El programa TCC-I');

const ctx = C.appEvaluada();
if (!ctx) { console.log('  La app no arranca.'); process.exitCode = 1; return; }
const { D, $, corr } = C.conDom(ctx);
const prog = corr('DM_TCCI_PROGRAMA');

r.seccion('El programa, semana por semana:');
r.ok(prog.length === 7, 'son 7 semanas', prog.length);
const esperado = ['Cómo funciona tu sueño', 'Restricción del tiempo en cama', 'Control de estímulos',
                  'Ajuste del horario', 'Reestructuración cognitiva', 'Técnicas de desactivación',
                  'Prevención de recaídas'];
esperado.forEach((t, i) => {
  r.ok(prog[i] && prog[i].titulo === t, 'semana ' + (i + 1) + ': ' + t,
       prog[i] ? prog[i].titulo : 'falta');
  r.ok(prog[i] && prog[i].n === i + 1, '  numerada como ' + (i + 1), prog[i] && prog[i].n);
});

r.seccion('La primera semana no cambia horarios, enseña:');
const s1 = prog[0];
r.ok(/presión de sueño/i.test(s1.contenido), 'explica la presión de sueño');
r.ok(/reloj biológico/i.test(s1.contenido), 'explica el reloj biológico');
r.ok(/higiene/i.test(s1.contenido), 'incluye higiene del sueño');
r.ok(/no alcanza|solo no alcanza/i.test(s1.contenido), 'y aclara que la higiene sola no alcanza');
r.ok(!/acostarte más tarde|achicá/i.test(s1.contenido), 'no pide cambiar el horario todavía');
r.ok(s1.libre === true, 'es gratuita: es la puerta de entrada');
r.ok(s1.contenido.length > 2000, 'tiene información de verdad', s1.contenido.length + ' caracteres');

r.seccion('El nombre que confundía:');
// "Restricción de sueño" es el nombre clásico del protocolo, pero le hace
// entender al paciente exactamente lo contrario: que va a dormir menos.
const todos = JSON.stringify(prog);
r.ok(!/Restricción de sueño/.test(todos), 'ya no dice "restricción de sueño" en ningún lado');
r.ok(/Restricción del tiempo en cama/.test(todos), 'dice "del tiempo en cama"');
r.ok(/lo que se achica es el tiempo ACOSTADO/i.test(prog[1].contenido),
     'y lo explica en la primera línea');

r.seccion('Control de estímulos: la cama como señal:');
const s3 = prog[2];
r.ok(/es una señal/i.test(s3.contenido), 'arranca por el concepto, no por la regla');
r.ok(/sillón|café/i.test(s3.contenido), 'con un ejemplo cotidiano');
r.ok(/dos trabajos/i.test(s3.contenido), 'separa los dos trabajos');
const iAsociacion = s3.contenido.indexOf('sacar de la cama');
const iLevantarse = s3.contenido.indexOf('no quedarte despierto');
r.ok(iAsociacion > 0 && (iLevantarse < 0 || iAsociacion < iLevantarse),
     'lo conceptual va ANTES que el levantarse');
r.ok(s3.tareas[0].indexOf('dormir y para tener relaciones') > 0,
     'y la primera tarea es desarmar la asociación', s3.tareas[0]);

r.seccion('Cerrar una semana:');
corr("localStorage.clear(); localStorage.setItem('dm_tcci_inicio', String(Date.now()));");
D.body.innerHTML = '<div id="dm-tcci-tareas-1"></div><div id="dm-tcci-cierre-1"></div>';
const nTareas = prog[0].tareas.length;
for (let i = 0; i < nTareas - 1; i++) corr('dmTcciMarcar(1,' + i + ')');
r.ok(/Te faltan 1 de/.test($('dm-tcci-cierre-1').innerHTML), 'con una tarea pendiente no deja cerrar');
// Marcar la última y que no pase nada era el motivo de la queja: había que
// salir de la semana y volver a entrar para ver el botón.
corr('dmTcciMarcar(1,' + (nTareas - 1) + ')');
r.ok(/Terminé la semana 1/.test($('dm-tcci-cierre-1').innerHTML),
     'al marcar la última aparece el botón en el momento');

r.seccion('El festejo:');
r.ok(typeof ctx.dmConfeti === 'function', 'existe el confeti');
D.body.innerHTML = '';
corr('dmConfeti()');
r.ok(D.body.children.length > 0, 'dibuja algo');
const papelitos = D.body.firstElementChild ? D.body.firstElementChild.children.length : 0;
r.ok(papelitos > 10, 'con varios papelitos', papelitos);
D.body.innerHTML = '';
ctx.matchMedia = q => ({ matches: /reduced-motion/.test(q), media: q,
                         addListener(){}, addEventListener(){} });
corr('dmConfeti()');
r.ok(D.body.children.length === 0, 'y no se dibuja si pediste menos animaciones');

r.seccion('El progreso viejo no se pierde:');
// Al meter la semana de psicoeducación adelante, todas las demás corrieron un
// número. Sin migración, quien venía haciendo el programa vería su semana 1
// vacía y la de psicoeducación marcada como leída sin haberla abierto.
corr('localStorage.clear();');
corr("localStorage.setItem('dm_tcci_hechos', JSON.stringify({'1.0':true,'1.1':true,'6.0':true}));");
corr("localStorage.setItem('dm_tcci_cerradas', JSON.stringify({'1':true}));");
const hechos = corr('dmTcciHechos()');
r.ok(hechos['2.0'] === true && hechos['2.1'] === true,
     'lo hecho en la vieja semana 1 aparece en la nueva 2');
r.ok(hechos['7.0'] === true, 'y la vieja 6 pasa a ser la 7');
r.ok(!hechos['1.0'], 'sin dejar marcada la semana de psicoeducación sin leer');
const cerradas = corr("JSON.parse(localStorage.getItem('dm_tcci_cerradas'))");
r.ok(cerradas['2'] === true && !cerradas['1'], 'las semanas cerradas también se corren');
corr('dmTcciHechos()');
const h2 = corr('dmTcciHechos()');
r.ok(h2['2.0'] === true && !h2['3.0'], 'la corrección se hace una sola vez');

r.cerrar('El programa tiene 7 semanas, cierra al momento y no pierde lo hecho.');
