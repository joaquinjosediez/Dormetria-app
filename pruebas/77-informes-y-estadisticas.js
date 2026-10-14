// Tres cosas que se pidieron juntas.
//
// 1 · Los informes generados no se podían borrar. La lista los acumula y
//     todos se llaman igual —"Nota de evolución"— y se diferencian por la
//     hora.
//
// 2 · El informe salía cortado, y la razón era un número puesto a dedo:
//     max_tokens 2000 en la Edge Function. Peor: la reparación del JSON se
//     queda con las secciones completas y descarta la última, así que un
//     informe truncado se mostraba y se GUARDABA como si estuviera
//     terminado. Lo que falta cuando se corta es justamente el final: la
//     conclusión.
//
// 3 · Las estadísticas: tres tarjetas con un código de color compartido, en
//     vez de cinco sueltas donde el color no significaba nada.

const C = require('./comun');
const r = C.crearReporte('Informes y estadísticas');

const app = C.leerApp();
const fs = require('fs');
const path = require('path');
const edge = fs.readFileSync(
  path.join(__dirname, '..', 'edge-functions', 'informe-clinico.ts'), 'utf8');

r.seccion('1 · Los informes guardados se pueden borrar:');

const lista = app.slice(app.indexOf('function dmInformesGuardadosHtml(filas){'),
                        app.indexOf('// Borrar un informe guardado.'));
r.ok(/dmBorrarInforme\(/.test(lista), 'cada fila tiene su tachito');
// La fila entera abre el informe: sin stopPropagation, tocar la papelera
// abre en vez de borrar.
r.ok(/event\.stopPropagation\(\);dmBorrarInforme/.test(lista),
     'y tocarlo no abre el informe');
r.ok(/width:40px;height:40px/.test(lista), 'con área de toque suficiente');
r.ok(/aria-label="Borrar este informe"/.test(lista), 'y nombre para lectores de pantalla');

const borrar = app.slice(app.indexOf('async function dmBorrarInforme(id){'),
                         app.indexOf('window.dmBorrarInforme'));
r.ok(/confirm\(/.test(borrar), 'pregunta antes');
// Todos los informes se llaman igual en la lista. Borrar el equivocado es
// fácil y no se deshace.
r.ok(/No se puede deshacer/.test(borrar), 'y avisa que no se deshace');
r.ok(/El diario y las escalas del paciente no se tocan/.test(borrar),
     'aclarando qué NO se borra, que es lo que da miedo');
r.ok(/method:'DELETE'/.test(borrar) && /ai_reports\?id=eq\./.test(borrar),
     'borra solo ese informe');
// Recargar la ficha entera perdería el informe abierto al lado.
r.ok(/fila\.remove\(\)/.test(borrar),
     'y saca la fila sin recargar la pantalla');

r.seccion('2 · El límite de 2000 era un número a dedo:');

r.ok(/max_tokens: 8000/.test(edge), 'sube a 8000');
r.ok(!/max_tokens: 2000/.test(edge), 'y no queda el viejo');
// No es un presupuesto: se paga por lo que se usa. Una nota de evolución de
// 250 palabras gasta lo mismo con el tope en 2000 que en 8000.
r.ok(/LIMITE DE SEGURIDAD/.test(edge),
     'y queda escrito que es un tope de seguridad, no un presupuesto');

const inter = edge.slice(edge.indexOf('interconsulta: `'), edge.indexOf('paciente: `'));
r.ok(!/Menos de 400 palabras/.test(inter),
     'la interconsulta ya no se limita a 400 palabras');
r.ok(/Sin límite de palabras/.test(inter), 'y lo dice explícitamente');
r.ok(/CONCLUSIÓN SUGERIDA/.test(inter), 'pide una conclusión, con ese título');
r.ok(/como la de un informe de polisomnografía/.test(inter),
     'con el modelo de referencia que se pidió');
// Una conclusión sugerida no es un diagnóstico: el informe lo lee un colega
// que decide.
r.ok(/"compatible con", "sugiere", "no permite\s*descartar"/.test(inter.replace(/\s+/g, ' ')),
     'y en lenguaje de sugerencia, no de diagnóstico');
['Arquitectura del sueño', 'Ritmo y regularidad', 'Sueño diurno',
 'Escalas administradas', 'Factores evaluados'].forEach(function (sec) {
  r.ok(inter.indexOf(sec) > 0, '  pide la sección: ' + sec);
});
// Que un factor se haya evaluado y dado negativo ES información para quien
// recibe el informe y no vio al paciente.
const interPlano = inter.replace(/\s+/g, ' ');
r.ok(/dado negativo ES información/.test(interPlano),
     'incluido lo que se evaluó y no dio nada');
r.ok(/"descartado"/.test(inter), 'y lo que NO se puede afirmar con este registro');

r.seccion('Y un informe cortado no se presenta como terminado:');

r.ok(/resp\?\.stop_reason === 'max_tokens'/.test(edge),
     'la función detecta que se quedó sin tokens');
r.ok(/responder\(\{ estructura, texto: crudo, cortado \}\)/.test(edge),
     'y lo informa a la app');
r.ok(/const _cortado = resp\.cortado === true/.test(app), 'que lo recibe');
r.ok(/Este informe está incompleto/.test(app), 'y lo dice');
// Si el aviso va al pie, quien lo lee ya lo dio por bueno.
r.ok(/se avisa ARRIBA, no al pie/.test(app),
     'arriba del informe, no debajo');
// Esta es la peor: la reparación del JSON se queda con las secciones
// enteras y descarta la última, así que el truncado PARECE completo.
r.ok(/if\(!_cortado\) dmGuardarSalidaIA/.test(app),
     'y no se guarda en "Generados antes", donde quedaría indistinguible');

r.seccion('3 · Las estadísticas: un color por categoría, repetido:');

// Desde el comentario que explica el criterio: el porqué es la mitad del
// arreglo y tiene que estar fijado igual que el código.
const est = app.slice(app.indexOf('// ── Tres tarjetas, un solo codigo de color'),
                      app.indexOf("const b2 = bloque('Uso'"));
r.ok(/const C_VINC = '#7EC8A4', C_SOLO = '#C8A96E'/.test(est),
     'dos colores, de la paleta de la marca');
// El color era decorativo: verde para activos, ámbar para sin profesional,
// elegidos uno por uno. Así dos tarjetas no se pueden cruzar de un vistazo.
const estPlano = est.replace(/^\s*\/\/ ?/gm, '').replace(/\s+/g, ' ');
r.ok(/el color ES la categoria y se repite en las tres/.test(estPlano),
     'y ahora significan algo');
r.ok(/const barraDoble = function\(a, b\)/.test(est),
     'la barra se parte en los dos grupos');
r.ok(/en el mismo orden siempre/.test(est),
     'en el mismo orden, para comparar por la forma');
r.ok(/const leyenda = function/.test(est) && /tabular-nums/.test(est),
     'con el número de cada grupo al lado de su color');

r.ok(/datoPartido\(\{label:'Cuentas creadas'/.test(app), 'cuentas creadas');
r.ok(/datoPartido\(\{label:'Activos · 7 días'/.test(app), 'activos de 7 días');
r.ok(/datoPartido\(\{label:'Activos · 30 días'/.test(app), 'y de 30 días');
r.ok(/const part7  = activosPartidos\(D7\)/.test(app) &&
     /const part30 = activosPartidos\(D30\)/.test(app),
     'con los activos partidos de verdad, no estimados');
r.ok(/window\._admConProf = _con;/.test(app),
     'leyendo quién está vinculado del mismo mapa que el resto');

// Sin el dato de vinculación no se puede partir nada, y pintar tres barras
// de un color inventado sería peor que no partirlas.
r.ok(/const _hayPart = \(window\._admSinProf != null\)/.test(app),
     'y si no se pudo leer la vinculación, no se inventa el desglose');
r.ok(/no se pudo leer la vinculación/.test(app), 'se dice');

r.cerrar('Un informe al que le falta la conclusión y no lo dice es peor que uno que falla.');
