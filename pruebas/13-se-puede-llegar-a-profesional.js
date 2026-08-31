// Se tiene que poder cambiar de Paciente a Profesional al crear la cuenta.
//
// El bug: `.login-outer` centraba con `align-items:center`. Cuando el
// formulario es más alto que la ventana, el navegador lo desborda por arriba
// Y por abajo en partes iguales. Lo de abajo se alcanza scrolleando; lo de
// arriba NO — queda fuera del área scrolleable y no hay manera de llegar.
//
// Las pestañas Paciente/Profesional están arriba de todo. En una laptop con
// la ventana a media altura quedaban inalcanzables: el colega entraba, veía
// el formulario de paciente y no tenía forma de cambiar. Se creaba la cuenta
// equivocada, o abandonaba.
//
// No es un problema de scroll "que a veces pasa": es determinístico, y por
// eso se puede comprobar leyendo el CSS.

const C = require('./comun');
const r = C.crearReporte('Se puede llegar a Profesional');

const html = C.leerHtml();
const css = C.leerCss();

r.seccion('Las dos opciones existen y son alcanzables:');

r.ok(/setMode\('patient'/.test(html), 'está la pestaña Paciente');
r.ok(/setMode\('doctor'/.test(html), 'está la pestaña Profesional');

// reglasDe() devuelve TODAS las reglas; hay que buscar la que interesa.
// Si .login-outer estuviera declarada más de una vez, gana la última.
const propias = C.reglasDe(css).filter(x =>
  x.sel.split(',').some(s => s.trim() === '.login-outer'));

r.ok(propias.length > 0, 'existe la regla .login-outer',
     propias.length + ' declaración' + (propias.length === 1 ? '' : 'es'));

const decl = propias.map(x => x.cuerpo).join(';').replace(/\s+/g, '');

r.ok(/align-items:safecenter/.test(decl),
     'el centrado es "safe": se cae solo a arriba cuando no entra');

r.ok(/align-items:flex-start/.test(decl),
     'y hay un flex-start antes, para el navegador que no entienda "safe"');

// Ésta es la que importa: si vuelve a quedar SOLO `align-items:center`,
// el contenido de arriba se vuelve inalcanzable otra vez.
const soloCenter = /align-items:center/.test(decl) && !/align-items:safecenter/.test(decl);
r.ok(!soloCenter,
     'NO quedó un align-items:center suelto, que es lo que causaba el bug');

r.ok(/overflow-y:auto/.test(decl),
     'y el contenedor puede scrollear');

r.seccion('Y el formulario no repite lo mismo dos veces:');

const yaTenes = (html.match(/¿Ya tenés cuenta\?/g) || []).length;
r.ok(yaTenes === 1, 'el enlace "¿Ya tenés cuenta?" aparece una sola vez',
     yaTenes + ' vez' + (yaTenes === 1 ? '' : 'es'));

r.cerrar('Centrar contenido más alto que la ventana lo vuelve inalcanzable por arriba.');
