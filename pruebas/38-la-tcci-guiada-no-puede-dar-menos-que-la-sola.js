// Había dos TCC-I distintas corriendo en paralelo:
//
//   · la AUTOGUIADA — DM_TCCI_PROGRAMA, siete semanas, lenguaje de
//     paciente, texto completo, tareas marcables, cierre de semana;
//   · la GUIADA — los 27 ítems de CBTI_PROTOCOL, casi todos bajo candado,
//     con CBTI_PATIENT_CONTENT como párrafos sueltos, sin tareas y sin
//     material de lectura.
//
// O sea: al paciente que conseguía un profesional se le daba MENOS
// contenido y peor organizado que al que iba solo. El acompañamiento
// tiene que agregar, nunca restar.
//
// Ahora el contenido es uno. Lo único que cambia es quién abre la semana.

const C = require('./comun');
const r = C.crearReporte('La TCC-I guiada no puede dar menos que la sola');

const html = C.leerHtml();

r.seccion('Las dos vistas dibujan el mismo programa:');

const i = html.indexOf('async function openPatientCbtiView(');
const vista = html.slice(i, html.indexOf('async function checkPatientTcciCard', i));
const veces = (vista.match(/dmTcciRenderPrograma\(\)/g) || []).length;
r.ok(veces >= 2,
     'se llama al mismo renderizador con y sin profesional (veces: ' + veces + ')');
r.ok(!/CBTI_PROTOCOL\.modules\.forEach/.test(vista),
     'la vista del paciente ya no arma el listado de 27 ítems aparte');
r.ok(!/Tu profesional lo desbloqueará cuando lo aborden en consulta/.test(vista),
     'y desaparecieron los 27 candados');

r.seccion('Lo único distinto es quién abre la semana:');

const j = html.indexOf('function dmTcciSemanaAbierta(');
const regla = html.slice(j, html.indexOf('function dmTcciAbrirSemana(', j));
r.ok(/dmTcciModo\(\)==='guiado'/.test(regla),
     'la regla distingue los dos modos');
r.ok(/dmTcciHabilitadasPorPro\(\)\[n\]===true/.test(regla),
     'guiado: la habilita el profesional');
r.ok(/dmTcciCerrada\(n-1\)/.test(regla),
     'autogestionado: se abre al cerrar la anterior');
r.ok(/n===1/.test(regla),
     'la primera semana está abierta en los dos casos');
r.ok(!/dias\/7|semanaActual|calendario/i.test(regla),
     'el calendario ya no decide nada');

r.seccion('El profesional habilita por semana, no por ítem:');

const k = html.indexOf('async function dmCbtiToggleSemana(');
const toggle = html.slice(k, k + 1400);
r.ok(/item_id:itemId/.test(toggle) && /'semana-'\+n/.test(toggle),
     'se guarda como semana-N en cbti_progress — sin tabla nueva ni RLS nueva');
r.ok(/CBTI_STATE\.progress\[itemId\]=\{\.\.\.\(CBTI_STATE\.progress\[itemId\]\|\|\{\}\), completed:!on\}/.test(toggle),
     'si falla el guardado se revierte el tilde');

r.seccion('Cada semana trae su lectura y su imagen:');

r.ok(/lecturas:\['higiene'/.test(html), 'las semanas declaran su material de lectura');
r.ok(/figura:'amanecer'/.test(html),   'y su ilustración');

const L = html.indexOf('function dmTcciLecturasHtml(');
const lect = html.slice(L, L + 1200);
r.ok(/dmEduAplica\(t,_perfil\)/.test(lect),
     'el material de la semana respeta el mismo filtro de edad y sexo');

const D = html.indexOf('function dmTcciAbrirSemana(n){', html.indexOf('function dmTcciLecturasHtml('));
const det = html.slice(D, D + 4200);
r.ok(/dmTcciBanner\(s\)/.test(det),   'la imagen va arriba, en el detalle de la semana');
r.ok(/dmTcciLecturasHtml\(s\)/.test(det), 'y las lecturas abajo');

r.seccion('Y el cobro no se le aplica a quien viene acompañado:');

r.ok(/dmTcciModo\(\)!=='guiado' && !s\.libre && !dmTcciTieneAcceso\(\)/.test(det),
     'con profesional, el programa es parte del tratamiento, no un producto');

r.cerrar('Conseguir un profesional no puede darte menos material que no tenerlo.');
