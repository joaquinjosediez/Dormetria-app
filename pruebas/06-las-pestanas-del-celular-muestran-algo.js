// Las cuatro pestañas que quedaban en blanco en el celular.
//
// Alertas, Métricas, Mi perfil y TCC-I mostraban un cartel que decía
// "Se está mostrando en el panel de la derecha →" y nada más. En un celular
// no hay panel de la derecha.
//
// La causa: la clase `dr-desktop` se pone según el ROL y la pantalla, no
// según el ancho de la ventana. Para el CSS alcanza, porque esas reglas
// viven dentro de @media (min-width:900px) y en el celular no aplican. Pero
// el JS la leía como si significara "hay dos paneles", mandaba el contenido
// a una columna inexistente y dejaba el cartel en su lugar.
//
// Es la misma clase de error que el de mod161: dar por sentado el escritorio
// sin preguntar por el ancho.
//
// Verificado contra mod167: esta prueba reprueba mod166 en las cuatro
// pestañas y aprueba la corregida.

const C = require('./comun');
const r = C.crearReporte('Las pestañas del profesional muestran algo en el celular');

const ctx = C.appEvaluada();
if (!ctx) { console.log('  La app no arranca.'); process.exitCode = 1; return; }
const { D, $, corr } = C.conDom(ctx);

// Un celular: 390 px de ancho, y matchMedia contestando como corresponde.
ctx.innerWidth = 390;
ctx.matchMedia = q => ({ matches: !/min-width:\s*900px/.test(q), media: q,
                         addListener(){}, addEventListener(){} });

corr("S.user={email:'dr@x.com',name:'Ana',lname:'P',gender:'Femenino'};");
ctx.__vacio = async () => [];
ctx.__nada = () => {};
corr('db.get=__vacio; db.post=__vacio; toast=__nada;');

const PESTANAS = ['alerts', 'metrics', 'profile', 'more'];

(async () => {
  r.seccion('En un celular de 390 px:');
  for (const t of PESTANAS) {
    D.body.innerHTML = '<div id="dr-content"></div><div id="dr-metrics-desktop"></div>';
    // dr-desktop se pone según el ROL, no según el ancho: así queda en el celular.
    D.body.className = 'dm-rol-pro dr-desktop';
    try { await corr("showDrTab_('" + t + "')"); } catch (e) { /* la pestaña puede pedir datos */ }
    await new Promise(res => setTimeout(res, 15));
    const izq = $('dr-content') ? $('dr-content').innerHTML : '';
    r.ok(!/panel de la derecha/.test(izq),
         'la pestaña "' + t + '" no manda a un panel que no existe');
  }

  r.seccion('Y en escritorio los dos paneles siguen funcionando:');
  ctx.innerWidth = 1400;
  ctx.matchMedia = q => ({ matches: /min-width:\s*900px/.test(q), media: q,
                           addListener(){}, addEventListener(){} });
  D.body.innerHTML = '<div id="dr-content"></div><div id="dr-metrics-desktop"></div>';
  D.body.className = 'dm-rol-pro dr-desktop';
  try { await corr("showDrTab_('metrics')"); } catch (e) {}
  await new Promise(res => setTimeout(res, 15));
  r.ok(/panel de la derecha/.test($('dr-content').innerHTML),
       'en pantalla grande sí usa la columna de la derecha');

  r.cerrar('Ninguna pestaña queda en blanco en el celular.');
})();
