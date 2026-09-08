// Guardar el diario tiene que andar SIEMPRE, y cuando no anda tiene que
// decirlo.
//
// Caso real (Camila Destefano, piloto): completaba los cinco pasos, tocaba
// "Guardar mi noche" y no pasaba nada. Ni registro guardado, ni error, ni
// nada. Tres cosas distintas producían ese mismo silencio:
//
//   1. saveDiary hacía `btn.disabled = true` antes de guardar y solo lo
//      volvía a habilitar dentro del `catch`. Guardada la primera noche, el
//      botón —que vive en el HTML estático, no se vuelve a crear— quedaba
//      muerto para el resto de la sesión. dmPasoGuardar le manda un .click()
//      y un botón deshabilitado descarta el click sin ruido.
//
//   2. El bloque de "no me dormí" leía `getup` unas líneas ANTES de su
//      propia declaración con const. Zona muerta temporal: ReferenceError.
//      Como saveDiary es async, eso queda en una promesa rechazada que nadie
//      escucha — otra vez, silencio.
//
//   3. El botón del diario infantil se llamaba igual que el del adulto, así
//      que getElementById devolvía siempre el primero.
//
// Lo que se comprueba acá no es la estética: es que un guardado que falla no
// pueda volver a fallar callado.

const C = require('./comun');
const r = C.crearReporte('El diario se puede guardar dos veces');

const html = C.leerHtml();

r.seccion('El botón vuelve a quedar utilizable:');

// El `finally` es lo que distingue "se re-habilita siempre" de "se
// re-habilita solo si falló".
const bloqueAdulto = html.slice(
  html.indexOf('async function saveDiary()'),
  html.indexOf('function getCircRef('));

r.ok(bloqueAdulto.length > 0, 'encuentro el guardado del diario adulto',
     Math.round(bloqueAdulto.length / 1024) + ' KB');

r.ok(/\}finally\{|\} *finally *\{/.test(bloqueAdulto),
     'saveDiary re-habilita el botón en un finally');

const soloEnCatch = /catch\s*\(e\)\s*\{[^}]*btn\.disabled\s*=\s*false[^}]*\}\s*\n\s*\}/.test(bloqueAdulto);
r.ok(!soloEnCatch,
     'y NO solo dentro del catch, que es lo que dejaba el botón muerto');

r.seccion('El paso final no dispara un click a ciegas:');

const bloquePaso = html.slice(
  html.indexOf('function dmPasoGuardar()'),
  html.indexOf('async function dmCifrasInicio()'));

r.ok(/b\.disabled\s*=\s*false/.test(bloquePaso),
     'dmPasoGuardar habilita el botón antes de dispararlo');

r.ok(/catch/.test(bloquePaso),
     'y atrapa lo que saveDiary pueda tirar');

r.ok(/function dmFalloAlGuardar/.test(html),
     'hay un camino explícito para avisar que no se guardó');

r.ok(/No se pudo guardar/.test(html),
     'y el mensaje se lo dice al paciente, no solo a la consola');

r.seccion('Nada se lee antes de existir:');

// La declaración de getup tiene que venir ANTES del bloque que la usa.
const decl = bloqueAdulto.indexOf("const getup=document.getElementById('d-getup')");
const uso  = bloqueAdulto.indexOf('const _sinDormir =');
r.ok(decl >= 0 && uso >= 0 && decl < uso,
     'getup se declara antes del bloque de "no me dormí"',
     'declaración en ' + decl + ', uso en ' + uso);

r.ok((bloqueAdulto.match(/const getup=/g) || []).length === 1,
     'y se declara una sola vez');

r.seccion('Cada diario tiene su propio botón:');

const idAdulto = (html.match(/id="save-diary-btn"/g) || []).length;
const idNino   = (html.match(/id="save-child-diary-btn"/g) || []).length;
r.ok(idAdulto === 1, 'el botón del diario adulto es único', idAdulto + ' vez/veces');
r.ok(idNino === 1, 'el del infantil también, y con otro nombre', idNino + ' vez/veces');

r.cerrar('Un guardado que falla en silencio hace que el paciente crea que registró.');
