// La barra "Material para el paciente" del Resumen tenía seis
// <button type="button"> SIN onclick. Se veían como botones, tenían
// cursor de mano, y no hacían absolutamente nada.
//
// Peor: las etiquetas estaban escritas a mano —"Sueño y ansiedad",
// "Entender el insomnio"— y no correspondían a ningún tema real de la
// biblioteca. Aunque alguien les hubiera puesto un onclick, no habrían
// tenido qué abrir.
//
// Un control que parece accionable y no lo es no es un detalle estético:
// enseña que la app miente, y después el profesional desconfía también de
// lo que sí funciona.

const C = require('./comun');
const fs = require('fs');
const path = require('path');
const r = C.crearReporte('Un botón que no hace nada miente');

const render = fs.readFileSync(
  path.join(C.RAIZ, 'js', 'dormetria-render-resumen.js'), 'utf8');
const app = C.leerApp();

r.seccion('Los chips salen de la biblioteca de verdad:');

r.ok(/PATIENT_EDU_TOPICS\.filter/.test(render),
     'se construyen desde PATIENT_EDU_TOPICS');
r.ok(!/btnMat\('📋', 'Higiene del sueño'\)/.test(render),
     'desaparecieron las etiquetas escritas a mano');
// Se mira el CÓDIGO, no los comentarios: el comentario que explica por qué
// se sacaron nombra justamente los que se sacaron.
const soloCodigo = render.replace(/\/\/[^\n]*/g, '').replace(/\/\*[\s\S]*?\*\//g, '');
r.ok(!/Sueño y ansiedad|Entender el insomnio/.test(soloCodigo),
     'y las que no correspondían a ningún tema');

r.seccion('Y ahora son botones de verdad:');

r.ok(/onclick="dmMatToggle\(/.test(render), 'cada chip tiene onclick');
r.ok(/function dmMatToggle\(/.test(app),    'la función existe');
r.ok(/toggleEduAssignment\(topicId/.test(app),
     'y usa la misma ruta de guardado que la pestaña Material');

r.seccion('El estado no se inventa:');

const i = app.indexOf('async function dmMatPintarEstado(');
const pinta = app.slice(i, i + 1600);
r.ok(/patient_education\?patient_email=eq\./.test(pinta),
     'se lee de la base qué está asignado');
r.ok(/c\.classList\.add\('err'\)/.test(pinta),
     'si no se pudo leer, el chip queda neutro en vez de decir "sin asignar"');
r.ok(/read_at/.test(pinta),
     'y se distingue asignado de ya leído');

r.seccion('Asignar desde el Resumen no te saca de la pantalla:');

const j = app.indexOf('async function toggleEduAssignment(');
const toggle = app.slice(j, j + 2600);
r.ok(/_cont\.dataset\.tab === 'edumat'/.test(toggle),
     'solo refresca la pestaña Material si es la que está abierta');

r.seccion('Y el botón no se muere en el primer clic:');

r.ok(/const _revivir = function/.test(toggle),
     'se re-habilita pase lo que pase, no solo en el catch');

r.seccion('Las diez pestañas de la ficha se ven en el celular:');

const css = C.leerCss();
const k = css.indexOf('mod228 · Las pestañas de la ficha del paciente');
r.ok(k > 0, 'hay una regla para la barra de pestañas en pantalla angosta');
const bloque = css.slice(k, k + 1200);
r.ok(/flex-wrap:wrap/.test(bloque),
     'se envuelven en vez de quedar fuera de pantalla');
r.ok(/overflow-x:visible/.test(bloque),
     'y se saca el scroll horizontal, que escondía seis de las diez');
r.ok(/\.tab\.active\{[^}]*background/.test(bloque.replace(/\s/g, '')) ||
     /background:rgba\(26,74,58/.test(bloque),
     'la activa se marca con fondo: el subrayado se pierde entre renglones');

r.cerrar('Un control que parece accionable y no lo es enseña que la app miente.');
