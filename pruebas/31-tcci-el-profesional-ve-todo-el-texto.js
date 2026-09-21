// El texto que lee el paciente en TCC-I vive en DOS objetos, no en uno:
//
//   · DM_TCCI_PROGRAMA      — las 7 semanas del programa autoguiado. Es el
//                             material largo: ~11.500 caracteres de prosa.
//   · CBTI_PATIENT_CONTENT  — las 27 consignas del checklist, una línea cada
//                             una, ~690 palabras en total.
//
// Hasta mod205 el profesional solo veía el segundo, y encima repartido de a
// una línea dentro de cada ítem. Lo que de verdad lee el paciente —el
// programa— no aparecía en ningún lado del perfil profesional: para saber qué
// decía había que entrar con la cuenta del paciente.
//
// Esta prueba fija eso: el mismo objeto, sin recortar, en las dos vistas.

const C = require('./comun');
const r = C.crearReporte('TCC-I · el profesional ve todo el texto del paciente');

const html = C.leerHtml();
const css = C.leerCss();

r.seccion('Existen los dos cuerpos de texto:');

const iProg = html.indexOf('const DM_TCCI_PROGRAMA = [');
const jProg = html.indexOf('\n];', iProg) + 3;
r.ok(iProg > 0, 'encuentro el programa de semanas');

const prog = eval('(function(){' + html.slice(iProg, jProg) + '; return DM_TCCI_PROGRAMA;})()');
r.ok(prog.length >= 6, 'tiene ' + prog.length + ' semanas');

const letras = prog.reduce((a, s) => a + String(s.contenido || '').length, 0);
r.ok(letras > 8000,
     'y ' + letras.toLocaleString('es-AR') + ' caracteres de texto — no es un resumen');

const sinTexto = prog.filter(s => !s.contenido || !s.objetivo);
r.ok(sinTexto.length === 0, 'ninguna semana viene vacía');

r.seccion('El profesional tiene una pantalla que los muestra:');

r.ok(/id="screen-cbti-programa"/.test(html), 'existe la pantalla');
r.ok(/function dmCbtiVerPrograma\(/.test(html), 'y la función que la llena');

const i = html.indexOf('function dmCbtiVerPrograma(');
const j = html.indexOf('\nasync function toggleCbtiItem', i);
r.ok(j > i, 'la puedo aislar para revisarla');
const fn = html.slice(i, j);

// Lo importante: que renderice el objeto, no una copia recortada a mano.
r.ok(/DM_TCCI_PROGRAMA/.test(fn),
     'renderiza el objeto del programa, no un texto copiado aparte');
r.ok(/sem\.contenido/.test(fn),
     'y muestra el contenido entero de cada semana');
r.ok(/sem\.tareas|\(sem\.tareas\|\|\[\]\)/.test(fn),
     'con las tareas de la semana');
r.ok(/CBTI_PATIENT_CONTENT/.test(fn),
     'también incluye las 27 consignas del checklist');

// Un recorte silencioso sería el modo obvio de romper esto sin que se note.
r.ok(!/\.slice\(0,\s*\d+\)/.test(fn) && !/substring\(/.test(fn),
     'y no recorta el texto por el camino');

r.seccion('Se llega sin pasar por un botón que no decide nada:');

const iNav = html.indexOf('function showDrTab(tab,el){');
const fnNav = html.slice(iNav, iNav + 1400);
r.ok(/if\(tab==='more'\)\{[^}]*openCbtiModule\(\)/.test(fnNav),
     'la pestaña TCC-I entra derecho a la lista de pacientes');

r.ok(/cbti-portada[\s\S]{0,400}dmCbtiVerPrograma\(\)/.test(html),
     'y arriba de la lista está el acceso al material del paciente');

r.seccion('Y en escritorio no queda media pantalla en blanco:');

r.ok(/\.cbti-mod-grid\{[\s\S]{0,200}grid/.test(css),
     'los módulos del protocolo van en grilla');
r.ok(/min-width:900px\)\{[\s\S]{0,400}\.cbti-mod-grid\{[^}]*repeat\(auto-fill/.test(css),
     'con varias columnas a partir de 900 px');
r.ok(/\.cbti-mod-grid > div\.abierto\{\s*grid-column:1\/-1/.test(css),
     'y el módulo abierto toma el ancho entero, para poder leerlo');
// Va dentro de un atributo onclick, así que las comillas van escapadas.
r.ok(/self\.parentElement\.classList\.toggle\(\\?'abierto\\?'/.test(html),
     'la clase se pone al abrir, no queda escrita a mano');
r.ok(/#cbti-protocol-content,[\s\S]{0,120}max-width:1180px/.test(css),
     'el contenido no se estira a lo ancho de un monitor de 27"');

r.cerrar('El profesional no puede corregir un texto que no puede leer.');
