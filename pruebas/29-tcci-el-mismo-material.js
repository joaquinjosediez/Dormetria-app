// El protocolo TCC-I sale de un solo objeto (CBTI_PROTOCOL) y los textos para
// el paciente de otro (CBTI_PATIENT_CONTENT), pero el profesional nunca veía
// los segundos: para saber qué le llega al paciente tenía que abrir la app del
// paciente. Ahora cada ítem tiene un desplegable, PLEGADO por defecto, con el
// texto exacto que recibe.
//
// Y se comprueba lo que no se veía: que los dos objetos estén alineados. Un
// ítem sin texto no rompe nada — el paciente simplemente ve el título y nadie
// se entera.

const C = require('./comun');
const r = C.crearReporte('TCC-I · el mismo material en los dos perfiles');

const html = C.leerHtml();
const css = C.leerCss();

r.seccion('Los dos objetos están alineados:');

// Se extraen del HTML y se evalúan, para comprobar contra el contenido real.
const iP = html.indexOf('const CBTI_PROTOCOL = {');
const jP = html.indexOf('const CBTI_TOTAL_ITEMS');
const iC = html.indexOf('const CBTI_PATIENT_CONTENT = {');
const jC = html.indexOf('\n};', iC) + 3;
r.ok(iP > 0 && iC > 0, 'encuentro el protocolo y los textos del paciente');

const mod = eval('(function(){' + html.slice(iP, jP) + html.slice(iC, jC) +
                 '; return {P:CBTI_PROTOCOL, T:CBTI_PATIENT_CONTENT};})()');
const ids = [];
mod.P.modules.forEach(function(m){ m.items.forEach(function(it){ ids.push(it.id); }); });

const sinTexto = ids.filter(function(id){ return !mod.T[id]; });
r.ok(sinTexto.length === 0,
     'todo ítem del protocolo tiene su texto para el paciente',
     sinTexto.length ? 'faltan: ' + sinTexto.join(', ') : ids.length + ' ítems');

const huerfanos = Object.keys(mod.T).filter(function(id){ return ids.indexOf(id) < 0; });
r.ok(huerfanos.length === 0,
     'y no hay textos sueltos que no correspondan a ningún ítem',
     huerfanos.length ? huerfanos.join(', ') : 'ninguno');

r.ok(ids.length === mod.P.modules.reduce(function(n,m){ return n + m.items.length; }, 0),
     'el conteo de ítems cierra', ids.length + ' en ' + mod.P.modules.length + ' módulos');

r.seccion('El profesional puede ver ese texto:');

r.ok(/Ver lo que lee el paciente/.test(html), 'hay un desplegable por ítem');
r.ok(/CBTI_PATIENT_CONTENT\[it\.id\]/.test(
       html.slice(html.indexOf('// ── Lo que lee el paciente'),
                  html.indexOf('// ── Lo que lee el paciente') + 1400)),
     'y muestra el mismo texto que recibe el paciente, no una copia');

r.seccion('Pero plegado, porque el contenido ya lo sabe:');

const reglas = C.reglasDe(css).filter(function(x){
  return x.sel.split(',').some(function(s){ return s.trim().indexOf('.cbti-verpac') >= 0; });
});
r.ok(reglas.length >= 3, 'el desplegable tiene estilo propio',
     reglas.length + ' reglas');
// <details> sin el atributo open arranca cerrado: lo que se comprueba es que
// nadie lo haya abierto por defecto.
const bloque = html.slice(html.indexOf("'<details class=\"cbti-verpac\""),
                          html.indexOf("'<details class=\"cbti-verpac\"") + 200);
r.ok(!/ open/.test(bloque), 'y arranca cerrado');

r.seccion('Dice si el paciente todavía no lo ve:');

r.ok(/todavía no lo ve/.test(html),
     'avisa cuando el ítem no está tildado');
r.ok(/Se le desbloquea cuando tildes este punto/.test(html),
     'y explica qué hace falta');
// El acordeón no se re-renderiza al tildar, para no cerrarse solo: si el aviso
// no se actualizara aparte, quedaría diciendo "no lo ve" sobre un ítem tildado.
const bloqueBarras = html.slice(html.indexOf('function updateCbtiProgressBars()'),
                                html.indexOf('function updateCbtiProgressBars()') + 2000);
r.ok(/cbti-lock-/.test(bloqueBarras),
     'el aviso se actualiza al tildar, sin re-renderizar el acordeón');

r.seccion('Y un ítem sin texto no pasa desapercibido:');

r.ok(/no tiene texto para el paciente/.test(html),
     'si algún día falta un texto, el profesional lo ve dicho');

r.seccion('La biblioteca no cuelga de TCC-I:');

// La pestaña se llama TCC-I y el material educativo sirve para cualquier
// paciente, con protocolo o sin él. Vive en la pestaña Material de cada ficha,
// que además es donde se asigna y donde figura si lo leyó.
const bloqueMas = html.slice(html.indexOf("if(tab==='more'){"),
                             html.indexOf("if(tab==='more'){") + 2200);
r.ok(!/showEduLibrary\(\)/.test(bloqueMas),
     'la pestaña TCC-I ya no abre la biblioteca suelta');
r.ok(/¿Buscabas el material educativo\?/.test(bloqueMas),
     'y dice adónde se mudó, en vez de desaparecer sin más');
r.ok(/showDrPTab\('edumat'/.test(html),
     'la pestaña Material de cada paciente sigue estando');
r.ok(/previewEduTopic/.test(html),
     'y desde ahí se puede leer cada ficha');

r.cerrar('Si el profesional no puede leer lo que recibe su paciente, no puede corregirlo.');
