// Que cada pantalla cierre todos sus <div>.
//
// Esta prueba existe porque mod179 salió a producción con UN <div> abierto de
// más en la pantalla de registro, y la app dejó de andar por completo.
//
// Lo grave no fue el error: fue que las 10 pruebas que había pasaron igual.
// El motivo es que jsdom —como cualquier navegador— NO se queja de un div sin
// cerrar: lo cierra solo, donde puede. Y las pruebas buscaban elementos con
// getElementById, que encuentra el elemento sin importar dónde haya quedado
// colgado. O sea: el HTML estaba mal, el árbol quedaba mal armado, y todas
// las pruebas seguían diciendo que sí.
//
// En el navegador real la consecuencia era otra: el div abierto se tragaba
// todas las pantallas siguientes, que pasaban a estar adentro de una pantalla
// oculta. Nada se dibujaba.
//
// Por eso esta prueba no usa jsdom. Cuenta las etiquetas a mano, que es la
// única forma de ver un descalce que el navegador disimula.

const C = require('./comun');
const r = C.crearReporte('El HTML cierra bien');

// Dentro de <script> hay HTML escrito como texto ('<div>' + x + '</div>') que
// no es estructura de la página. Contarlo da alarmas falsas, y una prueba que
// grita en falso es peor que no tenerla: se aprende a ignorarla.
const html = C.leerHtml().replace(/<script\b[\s\S]*?<\/script>/gi,
                                  m => '\n'.repeat((m.match(/\n/g) || []).length));

// Las etiquetas que se cierran solas no cuentan.
const HUERFANAS = /^(area|base|br|col|embed|hr|img|input|link|meta|param|source|track|wbr)$/i;

function descalce(trozo) {
  const pila = [];
  const re = /<(\/?)([a-zA-Z][a-zA-Z0-9-]*)\b([^>]*)>/g;
  let m, sobran = 0;
  while ((m = re.exec(trozo)) !== null) {
    const cierra = m[1] === '/', tag = m[2].toLowerCase(), resto = m[3];
    if (HUERFANAS.test(tag) || resto.trimEnd().endsWith('/')) continue;
    if (tag !== 'div') continue;          // sólo divs: son los que arman las pantallas
    if (cierra) { if (pila.length) pila.pop(); else sobran--; }
    else pila.push(tag);
  }
  return pila.length + sobran;
}

// Cada pantalla arranca en su <div id="screen-..."> y termina donde arranca
// la siguiente. Si una pantalla no cierra lo que abre, se come a la que sigue.
const marcas = [];
const re = /<div id="(screen-[a-z0-9-]+)"/g;
let m;
while ((m = re.exec(html)) !== null) marcas.push({ id: m[1], en: m.index });

r.seccion('Hay pantallas para revisar:');
r.ok(marcas.length > 20, 'se encontraron las pantallas', marcas.length);

r.seccion('Y cada una cierra todos sus <div>:');

// La última pantalla arrastra los cierres de los contenedores que envuelven a
// TODAS las pantallas y que se abrieron antes de la primera. No son un error:
// hay que descontarlos. Se cuentan solos, así que si mañana cambia el armado
// de la página la prueba se ajusta sola en vez de mentir.
const envoltorios = descalce(html.slice(0, marcas[0].en));

let rotas = 0;
for (let i = 0; i < marcas.length; i++) {
  const ultima = (i + 1 === marcas.length);
  const hasta = ultima ? html.indexOf('</body>') : marcas[i + 1].en;
  const d = descalce(html.slice(marcas[i].en, hasta > 0 ? hasta : html.length))
            + (ultima ? envoltorios : 0);
  if (d !== 0) {
    rotas++;
    r.ok(false, marcas[i].id + ' cierra todos sus <div>',
         (d > 0 ? d + ' sin cerrar' : (-d) + ' de más'));
  }
}
r.ok(rotas === 0, 'ninguna pantalla deja un <div> colgado',
     rotas === 0 ? marcas.length + ' revisadas' : rotas + ' con problemas');

r.seccion('Y todo lo que se enlaza con showScreen() existe de verdad:');

// Un showScreen('algo') que no existe no rompe la app al abrirla, pero el
// botón no hace nada y nadie se entera hasta que un paciente lo aprieta.
// Acá SÍ hay que mirar adentro de los <script>: la mayoría de los
// showScreen() se llaman desde el código, no desde un onclick del HTML.
const crudo = C.leerHtml();
const pedidas = new Set();
const re2 = /showScreen\(\s*'([a-z0-9-]+)'\s*\)/g;
while ((m = re2.exec(crudo)) !== null) pedidas.add(m[1]);

const existen = new Set(marcas.map(x => x.id.replace(/^screen-/, '')));
const faltan = [...pedidas].filter(x => !existen.has(x));

r.ok(faltan.length === 0, 'ninguna pantalla enlazada falta',
     faltan.length ? 'no existen: ' + faltan.join(', ') : pedidas.size + ' enlaces revisados');

r.cerrar('Un <div> sin cerrar no da error en ningún lado: hay que contarlos.');
