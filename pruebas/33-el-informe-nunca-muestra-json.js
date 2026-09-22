// A Eduardo Ruffa le apareció el informe como JSON crudo en pantalla: llaves,
// comillas y "tipo":"datos". Parece que la app se rompió, y encima el
// contenido clínico está ahí, ilegible.
//
// La causa: la función de Supabase devuelve el JSON del modelo dentro de
// `texto` cuando ella misma no logró parsearlo, y dmLeerEstructura era
// estricta — exigía que el primer carácter fuera '{'. Tres cosas del modelo
// rompen eso, y las tres son habituales:
//
//   1. envuelve la respuesta en ```json ... ```
//   2. antepone una línea de cortesía
//   3. se queda sin tokens y corta el JSON por la mitad
//
// Esta prueba corre la función real extraída del HTML.

const C = require('./comun');
const r = C.crearReporte('El informe nunca muestra JSON crudo');

const html = C.leerHtml();

// Se extraen las dos funciones y se evalúan.
const i = html.indexOf('function dmLeerEstructura(');
const j = html.indexOf('function dmRenderIA(');
r.ok(i > 0 && j > i, 'encuentro las funciones en el HTML');

const fns = eval('(function(){' + html.slice(i, j) +
                 '; return {leer: dmLeerEstructura, pareceJson: dmPareceJson};})()');
const leer = fns.leer;

const BUENO = {
  titulo: 'Nota de evolución',
  subtitulo: 'Registro del 25/08 al 21/09 · 21 noches válidas',
  resumen: 'Paciente varón de 29 años…',
  secciones: [
    { tipo: 'datos', titulo: 'Parámetros del período', items: [
      { texto: 'Eficiencia de sueño', valor: '78%', estado: 'alterado' },
      { texto: 'Latencia de inicio de sueño', valor: '35 min', estado: 'alterado' }
    ]}
  ]
};
const CRUDO = JSON.stringify(BUENO, null, 2);

r.seccion('Lo que ya funcionaba sigue funcionando:');

r.ok(leer(BUENO) === BUENO, 'un objeto pasa tal cual');
r.ok(leer(CRUDO) && leer(CRUDO).titulo === 'Nota de evolución', 'un JSON limpio se parsea');
r.ok(leer(null) === null && leer('') === null, 'lo vacío devuelve null');
r.ok(leer('El paciente refiere mejoría subjetiva.') === null,
     'un texto corrido no se confunde con estructura');

r.seccion('Los tres modos en que el modelo lo rompe:');

r.ok(leer('```json\n' + CRUDO + '\n```') !== null,
     '1 · envuelto en un cerco de código');
r.ok(leer('```\n' + CRUDO + '\n```') !== null,
     '   · y sin etiqueta de lenguaje');
r.ok(leer('Aquí está el informe solicitado:\n\n' + CRUDO) !== null,
     '2 · con una línea de cortesía adelante');
r.ok(leer(CRUDO + '\n\nEspero que sea útil.') !== null,
     '   · o una atrás');

// 3 · Truncado: se corta justo después de un ítem cerrado. Es lo que pasa
//     cuando se agota max_tokens, y es el caso de la captura de Ruffa.
const corte = CRUDO.indexOf('},', CRUDO.indexOf('Eficiencia de sueño'));
r.ok(corte > 0, 'armo un recorte realista, después de un ítem completo');
const cortado = CRUDO.slice(0, corte + 1);
const rep = leer(cortado);
r.ok(rep !== null, '3 · truncado a mitad de camino, se repara');
r.ok(rep && rep.titulo === 'Nota de evolución', '   · y conserva el encabezado');
r.ok(rep && rep.secciones && rep.secciones[0].items.length >= 1,
     '   · y los ítems que sí llegaron completos');

r.seccion('Pero no inventa cuando no puede:');

r.ok(leer(CRUDO.slice(0, CRUDO.indexOf('Eficien') + 4)) === null,
     'si cortó dentro de un string, devuelve null en vez de adivinar');
r.ok(leer('{ "hola": 1 }') === null,
     'un JSON sin secciones ni resumen no es un informe');

r.seccion('Y si no se puede reparar, no se le vuelca al médico:');

r.ok(fns.pareceJson('{ "titulo": "x"'), 'se reconoce que eso era JSON');
r.ok(fns.pareceJson('```json\n{ "a": 1'), 'aun con el cerco de código');
r.ok(!fns.pareceJson('El paciente refiere mejoría.'), 'y un texto normal no lo es');

const render = html.slice(j, j + 2600);
r.ok(/dmPareceJson\(textoPlano\)/.test(render),
     'el render pregunta antes de mostrar párrafos');
r.ok(/El informe llegó incompleto/.test(render),
     'y dice qué pasó, en vez de mostrar las llaves');
r.ok(/Rehacer/.test(render),
     'con la acción que corresponde');

r.seccion('Ni se copia a la historia clínica:');

const iT = html.indexOf('function dmIAaTexto(');
const aTexto = html.slice(iT, iT + 400);
r.ok(/dmPareceJson\(textoPlano\) \? '' :/.test(aTexto),
     'copiar un informe roto no pega un JSON en la historia clínica');

r.cerrar('Un JSON en pantalla no es un error de formato: es el informe perdido.');
