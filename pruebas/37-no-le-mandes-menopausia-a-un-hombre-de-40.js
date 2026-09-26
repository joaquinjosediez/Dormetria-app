// En el inicio del paciente, la sección "Para leer, si te interesa" le
// ofrecía a Joaquín —varón, 43 años— "Menopausia y sueño" y "Dormir
// durante el embarazo".
//
// No era un criterio malo: no había criterio. dmLeerHoy rotaba por día
// sobre la lista completa de artículos, sin mirar a quién se los estaba
// mostrando.
//
// Y esto no es cosmético: un artículo que claramente no aplica hace dudar
// de todo lo demás que dice la app, incluido lo clínico.

const C = require('./comun');
const r = C.crearReporte('No le mandes menopausia a un hombre de 40');

const html = C.leerHtml();

const i = html.indexOf('function dmEduAplica(');
r.ok(i > 0, 'encuentro el filtro');
const fns = eval('(function(){' + html.slice(i, html.indexOf('window.dmEduAplica')) +
                 '; return {aplica: dmEduAplica};})()');
const aplica = fns.aplica;

const MENOPAUSIA = { id:'menopausia', publico:{ sexo:'F', edad:[40,70] } };
const EMBARAZO   = { id:'embarazo',   publico:{ sexo:'F', edad:[15,50] } };
const MAYORES    = { id:'mayores',    publico:{ edad:[60,120] } };
const GUARDIAS   = { id:'guardias',   publico:{ solo:'ocupacional' } };
const HIGIENE    = { id:'higiene' };   // sin público: para cualquiera

r.seccion('El caso que lo originó:');

const joaquin = { sexo:'M', edad:43, ocupacional:false };
r.ok(!aplica(MENOPAUSIA, joaquin), 'a un varón de 43 no se le ofrece menopausia');
r.ok(!aplica(EMBARAZO,   joaquin), 'ni embarazo');
r.ok( aplica(HIGIENE,    joaquin), 'pero sí higiene del sueño');

r.seccion('A quien sí le corresponde, le llega:');

r.ok(aplica(MENOPAUSIA, {sexo:'F', edad:52}), 'mujer de 52 → menopausia');
r.ok(aplica(EMBARAZO,   {sexo:'F', edad:31}), 'mujer de 31 → embarazo');
r.ok(aplica(MAYORES,    {sexo:'M', edad:71}), 'varón de 71 → sueño después de los 65');

r.seccion('Y la edad también descarta:');

r.ok(!aplica(MENOPAUSIA, {sexo:'F', edad:24}), 'mujer de 24 → todavía no');
r.ok(!aplica(EMBARAZO,   {sexo:'F', edad:68}), 'mujer de 68 → ya no');
r.ok(!aplica(MAYORES,    {sexo:'F', edad:30}), 'persona de 30 → no es su tema');

r.seccion('Sin el dato, se muestra — no se esconde:');

// Filtrar de más es peor que filtrar de menos: dejaría a alguien sin
// material que le sirve solo porque no cargó el sexo al registrarse.
r.ok(aplica(MENOPAUSIA, {sexo:'', edad:52}),  'sin sexo cargado, se ofrece igual');
r.ok(aplica(MENOPAUSIA, {sexo:'F', edad:null}), 'sin edad cargada, se ofrece igual');
r.ok(aplica(EMBARAZO,   {}),                   'sin ningún dato, se ofrece igual');

r.seccion('Lo ocupacional pide que la persona lo haya dicho:');

r.ok(!aplica(GUARDIAS, {sexo:'M', edad:40, ocupacional:false}),
     'sin trabajo por turnos declarado, no aparece');
r.ok( aplica(GUARDIAS, {sexo:'M', edad:40, ocupacional:true}),
     'con turnos declarados, sí');

r.seccion('El profesional sigue viendo todo:');

const bib = html.slice(html.indexOf('const _todos = (typeof PATIENT_EDU_TOPICS'), 0) === -1 ? '' :
            html.slice(html.indexOf('const _todos = (typeof PATIENT_EDU_TOPICS'), html.indexOf('const _todos = (typeof PATIENT_EDU_TOPICS')+700);
r.ok(/idsAsignados\.indexOf\(t\.id\)>=0/.test(bib),
     'lo que el profesional asignó a mano nunca se filtra');

r.cerrar('Un artículo que no aplica hace dudar de todo lo demás que dice la app.');
