// "En el inicio, abajo de 'Empezar' pone 'ya tengo cuenta ingresar'. Que los
// botones tengan el mismo tamaño, no tiene por qué estar medio escondido el
// ingreso con cuenta ya cargada."
//
// Estaba así:
//
//     #dm-btn   → 54 px de alto, ancho completo, degradado verde
//     #dm-login → font-size 12px, color rgba(255,255,255,0.28)
//
// Eso no es jerarquía, es un enlace que no se ve. Dos cosas medibles:
//
//   · Contraste. Blanco al 28 % sobre el verde del fondo queda cerca de 2:1.
//     WCAG 2.1 pide 4,5:1 para texto chico. No pasa, y por bastante.
//   · Objetivo táctil. Una línea de 12 px da unos 16 px de alto clicable, y
//     solo sobre la palabra "Ingresar": siete caracteres. El mínimo de Apple
//     son 44 px.
//
// Y es el camino de TODOS LOS DÍAS. Registrarse pasa una vez en la vida del
// usuario; entrar pasa cada mañana. El orden de prominencia estaba al revés
// de la frecuencia de uso.
//
// La jerarquía no se tira: se mueve del tamaño al estilo. Primario sólido,
// secundario de contorno, mismo rectángulo. Es lo que hace cualquier par de
// acciones primaria/secundaria y no le cuesta visibilidad a ninguna.

const C = require('./comun');
const r = C.crearReporte('Entrar no es menos que registrarse');

const app = C.leerApp();
const css = C.leerCss();

// Las reglas de los tres, recortadas de a una.
const regla = function (sel) {
  const i = css.indexOf(sel + '{');
  if (i < 0) return '';
  return css.slice(i, css.indexOf('}', i) + 1).replace(/\s+/g, '');
};
const btn   = regla('#dm-btn');
const login = regla('#dm-login');

r.seccion('Los dos botones miden lo mismo:');

// No alcanza con que los dos digan "54px": tienen que decir lo mismo que el
// otro. Se comparan los tres valores que definen el rectángulo.
['width:100%', 'height:54px', 'border-radius:27px'].forEach(function (p) {
  r.ok(btn.indexOf(p) >= 0 && login.indexOf(p) >= 0,
       '  ' + p + ' en los dos');
});
r.ok(/display:flex/.test(login) && /align-items:center/.test(login) &&
     /justify-content:center/.test(login),
     'y el texto va centrado en la caja, no pegado a un borde');

r.seccion('Y el de entrar ya se ve:');

// Esto es lo que había. Si vuelve a aparecer, volvió el problema entero.
r.ok(!/color:rgba\(255,255,255,0\.28\)/.test(login),
     'se fue el blanco al 28 %, que no llegaba ni a 2:1 de contraste');
r.ok(!/font-size:12px/.test(login), 'y el cuerpo de 12 px');
const fs = (login.match(/font-size:(\d+)px/) || [])[1];
r.ok(fs && Number(fs) >= 15, 'ahora son 15 px o más', fs + 'px');
r.ok(/font-weight:600/.test(login), 'con el mismo peso que "Empezar"');
// 0.92 sobre el fondo oscuro pasa 4,5:1 con margen.
r.ok(/color:rgba\(244,239,229,0\.92\)/.test(login),
     'y en crema casi opaco, que sí pasa el contraste de WCAG');

r.seccion('Pero sigue siendo el secundario:');

// El pedido era igualar el tamaño, no igualar el peso visual. Si los dos
// fueran sólidos y verdes, nadie sabría cuál es cuál.
r.ok(/linear-gradient/.test(btn), '"Empezar" es el sólido');
r.ok(!/linear-gradient/.test(login) && /background:rgba\(255,255,255,0\.05\)/.test(login),
     '"Ingresar" es de contorno, apenas levantado del fondo');
r.ok(/border:1pxsolidrgba\(126,200,164,0\.42\)/.test(login),
     'con el borde en menta de la marca');

r.seccion('Se toca toda la caja, no la palabra:');

const linea = (app.match(/<div id="dm-login"[^>]*>.*?<\/div>/) || [''])[0];
r.ok(/id="dm-login"[^>]*onclick="showConsentOrLogin\(\)"/.test(linea),
     'el onclick está en el contenedor');
// Antes vivía adentro del <span>: 54 px de botón de los cuales 7 caracteres
// hacían algo. El resto era un botón que no responde, que se lee como roto.
r.ok(!/<span onclick=/.test(linea),
     'y no adentro del span, que dejaba 54 px de botón que no responden');
r.ok(/role="button"/.test(linea) && /tabindex="0"/.test(linea),
     'con el rol que lo anuncia como botón');

r.seccion('Y el tercero sí es terciario, pero legible:');

const pro = regla('#dm-soy-pro');
r.ok(/font-size:13px/.test(pro), 'texto, no botón: 13 px');
r.ok(/color:rgba\(244,239,229,0\.6\)/.test(pro),
     'al 60 %, que es tenue pero se lee');
r.ok(/padding:8px4px/.test(pro),
     'con algo de área de toque alrededor');
// Un profesional crea su cuenta una vez. Que compita con los dos de arriba
// sería el error opuesto al que se está arreglando.
r.ok(!/height:54px/.test(pro),
     'y NO es un tercer botón: lo usa un profesional una sola vez');

r.seccion('El orden sigue siendo el de la frecuencia de uso:');

const bottom = app.slice(app.indexOf('<div id="dm-bottom">'),
                         app.indexOf('<script>(function(){'));
const iBtn = bottom.indexOf('id="dm-btn"');
const iLog = bottom.indexOf('id="dm-login"');
const iPro = bottom.indexOf('id="dm-soy-pro"');
r.ok(iBtn > 0 && iLog > iBtn && iPro > iLog,
     'Empezar, después Ingresar, después Soy profesional');

r.cerrar('Igualar el tamaño no es igualar la jerarquía: para eso está el estilo.');
