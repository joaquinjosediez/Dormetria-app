// La confusión SASS: dos escalas distintas con ids casi iguales.
//
//   sassv         = "Síntomas de apnea (SASS)"  — cribado de apnea (Berlin)
//   sassv_screen  = "Adicción al Smartphone (SAS-SV)" — Kwon 2013
//
// El id `sassv` es, literalmente, el acrónimo de la OTRA escala. Tres lugares
// terminaron apuntando a la equivocada: la app le describía al profesional el
// cuestionario de apnea como "Adicción al smartphone", y cuando el GASQ
// marcaba uso de pantallas sugería el cuestionario de apnea.
//
// Y de paso: el corte de palabra "anywhere" que se había puesto para evitar
// desbordes laterales cambia el tamaño min-content a un carácter, así que
// cualquier hijo flex se encoge hasta nada y los títulos salían partidos
// letra por letra.

const C = require('./comun');
const r = C.crearReporte('Cada escala es la que dice ser');

const html = C.leerHtml();
const css = C.leerCss();

r.seccion('La escala de pantallas es la de pantallas:');

const bloqueTech = html.slice(html.indexOf('tech:      {scales:'),
                              html.indexOf('tech:      {scales:') + 160);
r.ok(/sassv_screen/.test(bloqueTech),
     'la sugerencia por pantallas apunta a SAS-SV, no al cribado de apnea');

const bloqueQ11 = html.slice(html.indexOf('// Q11: Pantallas / celular'),
                             html.indexOf('// Q11: Pantallas / celular') + 260);
r.ok(/suggestedIds\.add\('sassv_screen'\)/.test(bloqueQ11),
     'y la regla Q11 del GASQ también');

r.seccion('Y cada una se describe como lo que es:');

r.ok(/sassv:'Síntomas de apnea/.test(html),
     'sassv se describe como cribado de apnea');
r.ok(/sassv_screen:'Adicción al smartphone/.test(html),
     'sassv_screen se describe como adicción al smartphone');
r.ok(!/sassv:'Adicción al smartphone/.test(html),
     'y ya no hay una apnea descrita como adicción al smartphone');

r.seccion('Los dos paneles de correlación no se llaman igual:');

r.ok(/Percepción vs\. lo medido/.test(html),
     'el de los pilares dice que compara con lo medido');
r.ok(/Hábitos vs\. calidad que reporta/.test(html),
     'el de los hábitos dice que compara con los hábitos');
r.ok(!/Factores asociados al sueño/.test(html),
     'y no quedó ninguno con el nombre viejo, que servía para los dos');

r.seccion('Nada se parte letra por letra:');

// Solo importa dentro de #drp-content, que es donde hay hijos flex que se
// pueden encoger. En #diary-pillar-bars el "anywhere" es inofensivo y viejo.
const bloqueDrp = css.slice(css.indexOf('#drp-content .dm-card'),
                            css.indexOf('#drp-content .dm-card') + 500);
r.ok(!/overflow-wrap:anywhere/.test(bloqueDrp),
     'las tarjetas de la ficha no usan overflow-wrap:anywhere');
r.ok(/overflow-wrap:break-word/.test(css),
     'se usa break-word, que no achica el min-content a un carácter');

r.seccion('El orden de la ficha en el celular está completo:');

const ordenes = (css.match(/#screen-doctor-patient\.active [^{]+\{ ?order:\d/g) || []);
r.ok(ordenes.length >= 7, 'todas las tarjetas tienen su orden asignado',
     ordenes.length + ' con order');
r.ok(/#dr-factores-card *\{ *order:3/.test(css),
     'la de hábitos va tercera, pegada a Pilares');

// Sin order explícito caía en 0 y se ponía delante de todo, incluso del
// selector de período. Es exactamente lo que se veía.
r.ok(/id="dr-factores-card"/.test(html),
     'y la tarjeta tiene el id que esa regla necesita');

r.seccion('La evolución del resumen se acomoda sola:');

r.ok(/\.dm-evo-cifras\{/.test(css.replace(/\s+/g,'')) ||
     /\.dm-evo-cifras\s*\{/.test(css),
     'existe la grilla de cifras');
// El mínimo bajó de 104 a 84 en mod213: con 104 la sexta celda
// (Adherencia) se caía a un segundo renglón en cuanto la tarjeta se
// angostaba. Lo que la prueba fija es que sea auto-fit, no el número.
r.ok(/auto-fit,minmax\(\d+px,1fr\)/.test(css.replace(/\s+/g,'')),
     'con columnas que se acomodan al ancho');
const _min = /auto-fit,minmax\((\d+)px,1fr\)/.exec(css.replace(/\s+/g,''));
r.ok(_min && Number(_min[1]) <= 96,
     'y con un mínimo que deja entrar las seis cifras en una fila');

r.seccion('"Mis pacientes" no se repite arriba de la pantalla que ya lo dice:');

const bloqueCab = html.slice(html.indexOf('function dmCabeceraMovil()'),
                             html.indexOf('window.dmCabeceraMovil'));
// Se mira la lista de pantallas que reciben encabezado, no el comentario
// que explica por qué una quedó afuera.
const listaCab = bloqueCab.slice(bloqueCab.indexOf('[['), bloqueCab.indexOf('.forEach'));
r.ok(!/screen-doctor-home/.test(listaCab),
     'la pantalla de la lista ya no lleva encabezado propio');
r.ok(/screen-doctor-patient/.test(bloqueCab) && /screen-admin/.test(bloqueCab),
     'las que sí tienen "volver" lo conservan');

r.cerrar('Un id que es el acrónimo de otra escala termina sugiriendo la equivocada.');
