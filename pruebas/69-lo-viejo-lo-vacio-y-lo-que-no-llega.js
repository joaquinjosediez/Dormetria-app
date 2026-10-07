// Cuatro cosas que se veían bien y no estaban bien.
//
// 1 · El recordatorio local leía `Notification.permission` sin preguntar si
//     `Notification` existe. En una pestaña de Safari en iPhone no existe —la
//     API solo aparece en la app agregada a la pantalla de inicio—, y el
//     corto-circuito no salvaba nada porque `prefs.enabled` sale de
//     localStorage: justo quien ya lo había configurado y después abrió el
//     enlace desde WhatsApp entraba por la rama mala. ReferenceError en un
//     IIFE sin try, y el resto del script inline no se definía.
//
// 2 · Una escala alterada de hace cuatro meses seguía en rojo como si fuera
//     de hoy. El paciente tenía aviso desde los 30 días; el profesional, nada
//     —salvo las tres escalas que emiten bandera, y recién a los 90—. Ahora
//     son 60 días, en la tarjeta de cuestionarios, con el botón al lado.
//
// 3 · La tarjeta de siestas se emparejaba con las métricas nocturnas aunque
//     tuviera tres filas contra diez. En un adulto que durmió siesta un día
//     de veintitrés eso deja media columna en blanco.
//
// 4 · Lo que cruza la calidad reportada contra lo medido iba DESPUÉS de la
//     regularidad técnica. Se lee al lado del actograma, no después del
//     detalle fino.

const C = require('./comun');
const r = C.crearReporte('Lo viejo, lo vacío y lo que no llega');

const app = C.leerApp();
const css = C.leerCss();
const fs = require('fs');
const path = require('path');
const resumen = fs.readFileSync(
  path.join(__dirname, '..', 'js', 'dormetria-render-resumen.js'), 'utf8');

r.seccion('1 · El recordatorio no puede tumbar la app:');

const init = app.slice(app.indexOf('(function initReminders(){'),
                       app.indexOf('(function initReminders(){') + 1800);
r.ok(/typeof Notification === 'undefined'/.test(init),
     'se pregunta si la API existe antes de leerla');
// Sin los comentarios: el porqué del arreglo nombra `Notification.permission`
// varias líneas antes de la guarda, y buscarlo en crudo da el orden al revés.
const initCodigo = init.split('\n').filter(function (l) {
  return !/^\s*\/\//.test(l);
}).join('\n');
r.ok(initCodigo.indexOf("typeof Notification === 'undefined'") <
     initCodigo.indexOf('Notification.permission'),
     'y se pregunta ANTES: ese era todo el problema');
r.ok(/try\{/.test(init) && /catch/.test(init),
     'y hay try: un IIFE que tira en el parseo se lleva puesto lo que sigue');

// Lo que la función NO es. Sin esto, el próximo que lea el nombre va a
// creer que acá está el recordatorio diario y va a buscar el bug donde no está.
const sched = app.slice(app.indexOf('function scheduleLocalReminder(){'),
                        app.indexOf('function scheduleLocalReminder(){') + 1600);
r.ok(/NO ES EL RECORDATORIO DIARIO/.test(sched),
     'y queda escrito que esto solo dispara con la app abierta');
r.ok(/OneSignal/.test(sched) && /no vive en este/.test(sched),
     'y dónde está el envío de verdad, que no está en el repositorio');

r.seccion('2 · Una escala alterada vieja se pide de nuevo:');

r.ok(/dias >= 60 && f\.severidad !== 'ok'/.test(resumen),
     'las banderas avisan a los 60 días, no a los 90');
// "PHQ-9 bajo el punto de corte — conviene repetirla" es ruido: el criterio
// de la app ya dice que las normales no se vuelven a pedir solas.
r.ok(/f\.severidad !== 'ok'/.test(resumen),
     'y no se le pide repetición a lo que dio normal');

const cuest = resumen.slice(resumen.indexOf('filas = alteradas.map(function (x) {'),
                            resumen.indexOf("}).join('');",
                              resumen.indexOf('filas = alteradas.map(function (x) {')));
r.ok(/const vieja = dias != null && dias >= 60/.test(cuest),
     'la tarjeta de cuestionarios usa el mismo corte');
r.ok(/conviene repetirla/.test(cuest),
     'y lo dice con todas las letras');
r.ok(/dmPedirEscala\(/.test(cuest),
     'con el botón al lado: el aviso sin camino es lo que hace que no se repita');
r.ok(/scaleId: sc\.id/.test(resumen),
     'y el id de la escala viaja hasta ahí, que es lo que el botón necesita');

r.seccion('Y el atajo lleva de verdad a la escala:');

const pedir = app.slice(app.indexOf('function dmPedirEscala(id){'),
                        app.indexOf('function showDrPTab(tab,el){'));
r.ok(/Sugerir escalas/i.test(pedir),
     'busca la pestaña por su texto');
r.ok(/showDrPTab\('suggest', el\)/.test(pedir),
     'y la activa con su ELEMENTO: sin eso el subrayado se queda en Resumen');
// El listado se arma con un await adentro: no está en el DOM todavía.
r.ok(/setInterval/.test(pedir) && /suggest-scale-list input\[value="'\+id\+'"\]/.test(pedir),
     'espera a que el listado exista antes de tildar');
r.ok(/intentos > 40/.test(pedir),
     'con tope: si el perfil no habilita esa escala, no hay checkbox nunca');
r.ok(/dispatchEvent\(new Event\('change'\)\)/.test(pedir),
     'y dispara change, que es lo que pinta el borde de seleccionado');

r.seccion('3 · La tarjeta de siestas solo se empareja si tiene cuerpo:');

const mover = app.slice(app.indexOf("const _nd=document.getElementById('dr-noche-dia');"),
                        app.indexOf("const _nd=document.getElementById('dr-noche-dia');") + 900);
r.ok(/_filasEnDia = _dia \? Math\.max\(0, _dia\.children\.length - 1\) : 0/.test(mover),
     'se cuentan las filas del bloque, no se miden alturas');
r.ok(/_nd && _dia && _filasEnDia >= 5/.test(mover),
     'y van lado a lado desde 5 filas');
// Con menos, no se mueve nada: el bloque del día ya es hermano del de la
// noche dentro de #dr-clinical-metrics, así que queda justo debajo.
r.ok(/#dr-noche-dia:empty/.test(css),
     'y la fila vacía se esconde sola, sin dejar el hueco del gap');

r.seccion('4 · La interpretación va antes que el detalle fino:');

const iFact = app.indexOf('id="dr-factores-card"');
const iReg  = app.indexOf('id="dr-reg-slot"');
r.ok(iFact > 0 && iReg > 0 && iFact < iReg,
     'en el DOM, impacto subjetivo antes que regularidad técnica');
r.ok(/#dr-factores-card \{ order:8; \}/.test(css) && /#dr-reg-slot      \{ order:9; \}/.test(css),
     'y en el celular también, que es donde manda el order y no el DOM');

r.cerrar('Un dato viejo presentado como actual es peor que no tenerlo: se actúa sobre él.');
