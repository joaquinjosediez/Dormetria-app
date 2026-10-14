// "Rever el tamaño de la letra para pacientes añosos con dificultades para
// la visión."
//
// Hubo dos intentos y el primero estuvo mal. Vale la pena que las dos cosas
// queden fijadas: la que funcionó y la que no, para que no vuelva.
//
// ── Lo que SÍ era el problema ────────────────────────────────────────
//
//     <meta name="viewport" content="...,maximum-scale=1.0">
//
// Eso bloquea el pellizco de dos dedos. En iOS, Safari lo ignora desde
// iOS 10 por accesibilidad; Android Chrome lo respeta. El gesto que esa
// persona usa en todas las demás apps no funcionaba, y fallaba en la mitad
// de los teléfonos y no en el de quien lo probaba.
//
// ── Lo que NO funcionó, y por qué no vuelve ──────────────────────────
//
// mod269 agregó un control de tres niveles que escalaba el contenido con
// `zoom`. Los motores no se ponen de acuerdo en qué hace `zoom` con el
// ancho disponible:
//
//   · Safari en el iPhone maqueta al ancho del padre y escala DESPUÉS: el
//     contenido pasa a medir 390 × 1,45 = 566 px reales y lo que sobra se
//     corta. Se vio con "8 semanas con datos" cortado al medio, "CANTI-DAD"
//     partido, y el 100 % en dos renglones.
//   · Otro motor divide el ancho disponible por la escala, así que la misma
//     regla deja una franja muerta a la derecha.
//
// La misma línea de CSS, dos resultados opuestos. Compensar uno rompe el
// otro. Se saca.

const C = require('./comun');
const r = C.crearReporte('Texto para quien no llega a leer');

const app = C.leerApp();
const css = C.leerCss();

r.seccion('La app ya no prohíbe agrandar:');

const vp = (app.match(/<meta name="viewport" content="([^"]*)"/) || [])[1] || '';
r.ok(vp.indexOf('maximum-scale') < 0, 'no hay maximum-scale', vp);
r.ok(vp.indexOf('user-scalable=no') < 0, 'ni user-scalable=no');
r.ok(/width=device-width/.test(vp), 'y sigue siendo responsive');

// En Android, fijar text-size-adjust puede ANULAR el ajuste de tamaño de
// letra del sistema, que es justo lo que esta persona ya configuró.
r.ok(!/text-size-adjust\s*:/.test(css) && !/text-size-adjust\s*:/.test(app),
     'y NO se agregó text-size-adjust, que puede anular el ajuste del sistema');

r.seccion('El control de escala se sacó, y queda escrito por qué:');

r.ok(!/dm-esc-g|dm-esc-xg/.test(css), 'no quedan reglas de escala en el CSS');
r.ok(!/dmSetEscala|dmAplicarEscala|dm_escala_texto/.test(app),
     'ni el control en el código');
// Que no haya nada no alcanza: sin el motivo escrito, el próximo que lea
// "los pacientes no pueden agrandar la letra" vuelve a poner lo mismo.
r.ok(/TAMAÑO DE LETRA · por qué acá no hay nada/.test(css),
     'y en su lugar está el motivo');
r.ok(/maqueta al ancho del padre y escala DESPUÉS/.test(css),
     'con las dos conductas de `zoom` descriptas');
r.ok(/migrar las 2\.100 declaraciones de font-size a unidades relativas/.test(css),
     'y cuál es la solución de fondo, para cuando haya tiempo de hacerla bien');

r.seccion('Lo que queda es el gesto, que no puede romper nada:');

const card = app.slice(app.indexOf('function dmLeerCardHtml(conCruz){'),
                       app.indexOf('function dmCerrarLeerHome'));
r.ok(/Agrandá apoyando dos dedos y separándolos/.test(card), 'enseña el pellizco');
// La tarjeta se reescribió entera después de una auditoría de diseño: la
// primera versión tenía cuatro párrafos, pesaba más que la tarjeta de
// cargar la noche —la acción principal— y encima iba ARRIBA de ella. Un
// aviso de accesibilidad con más texto que el resto de la pantalla es
// contraproducente: justo quien no lee bien es quien no lo va a leer.
r.ok(/como con una foto/.test(card),
     'con una comparación que no hace falta explicar');
r.ok(card.length < 2600,
     'y es corta: tres líneas, no cuatro párrafos', card.length + ' caracteres');
// La ruta del ajuste del sistema no es la misma en iPhone que en Android, y
// mandar a la pantalla equivocada es peor que no mandar a ninguna.
r.ok(/iPad\|iPhone\|iPod/.test(card) && /Pantalla y brillo/.test(card) &&
     /Tamaño de la letra/.test(card),
     'y la ruta del ajuste del sistema, distinta según el teléfono');

r.seccion('Dos lugares, dos comportamientos:');

r.ok(/id="dm-leer-home"/.test(app), 'hay una ranura en el inicio del paciente');
r.ok(/try\{ dmPintarLeerHome\(\); \}catch\(_\)\{\}/.test(app),
     'que se pinta al entrar');
r.ok(/\$\{dmLeerCardHtml\(false\)\}/.test(app), 'y la tarjeta vive también en Mi perfil');
const home = app.slice(app.indexOf('function dmPintarLeerHome(){'),
                       app.indexOf('window.dmPintarLeerHome'));
r.ok(/localStorage\.getItem\('dm_leer_visto'\) === '1'/.test(home),
     'en el inicio aparece una sola vez: se cierra y no vuelve');
r.ok(/dmLeerCardHtml\(true\)/.test(home), 'ahí lleva cruz');
r.ok(/Esto queda en <b[^>]*>Yo<\/b>/.test(card),
     'y antes de cerrarse dice dónde volver a encontrarla');
// 44 px es el mínimo de Apple para un objetivo táctil. La primera versión
// daba 34, chico para cualquiera y más para la mano a la que apunta.
r.ok(/width:44px;height:44px/.test(card),
     'y la cruz tiene el área de toque mínima');

r.seccion('Y no le roba el lugar a la acción principal:');

const inicio = app.slice(app.indexOf('<div id="home-noche-slot"></div>') - 200,
                         app.indexOf('<div id="home-noche-slot"></div>') + 600);
r.ok(inicio.indexOf('home-noche-slot') < inicio.indexOf('dm-leer-home'),
     'la tarjeta de cargar la noche va primero');
r.ok(/nunca encima/.test(inicio),
     'y queda escrito por qué: un aviso que la empuja hacia abajo le cuesta '+
     'un scroll a todos los días para ayudar a algunos una vez');

r.seccion('Y los dos arreglos de layout que SÍ valían por sí solos:');

// Estos no dependían de la escala: estaban rotos en tamaño normal y se
// vieron al armar el banco de pruebas.
const pil = css.slice(css.indexOf('.dm-pil-card{'), css.indexOf('.dm-pil-rot{'));
r.ok(/hyphens:auto/.test(pil),
     '"FRAGMENTACIÓN" se corta por sílaba en vez de desbordar la tarjeta');
r.ok(!/hyphens:none/.test(pil), 'ya no está hyphens:none, que la dejaba salirse');
// "−7 sem." mide 45 px y la columna 44: las ocho etiquetas se tocaban entre
// sí ya en tamaño normal.
r.ok(/\(isLast \? 'Hoy' : \('−'\+\(blocks\.length-1-i\)\)\)/.test(app),
     'la progresión semanal muestra solo el número, no "−7 sem."');
r.ok(/la unidad la da el\s*\/\/ titulo de la seccion/i.test(app.replace(/\s+/g, ' ')) ||
     /Progresión semanal/.test(app),
     'la unidad la sigue dando el título de la sección');

r.cerrar('Un mecanismo que da dos resultados opuestos según el teléfono no se puede poner en una app clínica.');
