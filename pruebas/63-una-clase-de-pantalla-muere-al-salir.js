// El panel del profesional se desarmó solo: las dos columnas (listado +
// ficha) pasaron a una pila, con la barra de abajo apareciendo en el medio.
// Se arreglaba recargando, que es justo lo que lo hace difícil de atribuir a
// un cambio.
//
// La causa: `showConsultDir` le pone al body la clase `dm-dir-abierto`, y la
// sacaba SOLO el onclick del botón Volver. Al esconder ese botón en
// escritorio —porque la barra de arriba ya está siempre visible— no quedó
// nadie que la sacara, y la clase se pegó al body para siempre.
//
// Y no es cosmética: `body.dm-dir-abierto #app{display:flex}` tiene la MISMA
// especificidad que `body.dr-desktop #app{display:grid}` y está más abajo en
// la hoja, así que gana.
//
// Dos arreglos, porque uno solo no alcanza:
//   1. La clase se limpia al cambiar de pantalla, en UN lugar.
//   2. Y aunque sobreviviera, ya no puede pisar el layout del panel.

const C = require('./comun');
const r = C.crearReporte('Una clase de pantalla muere al salir de ella');

const app = C.leerApp();
const css = C.leerCss();

r.seccion('La clase se limpia al cambiar de pantalla:');

r.ok(/classList\.toggle\('dm-dir-abierto', id === 'consult'\)/.test(app),
     'showScreen la pone o la saca según la pantalla, no según un botón');
// El handler del botón puede seguir sacándola; lo que no puede es ser el
// único que lo haga.
const i = app.indexOf("classList.toggle('dm-dir-abierto'");
r.ok(i > 0 && i < app.indexOf('function showDrTab(tab,el){'),
     'y eso vive en showScreen, que corre siempre');

r.seccion('Y aunque sobreviva, no puede pisar el panel:');

const reglas = C.reglasDe(css);
const dir = reglas.filter(function (x) { return /dm-dir-abierto/.test(x.sel) && /#app/.test(x.sel); });
r.ok(dir.length === 1, 'hay una sola regla que toca #app con esa clase', dir.length + '');
r.ok(dir.every(function (x) { return /:not\(\.dr-desktop\)/.test(x.sel); }),
     'y está excluida del layout de dos paneles',
     dir.map(function (x) { return x.sel; }).join(' | '));

r.seccion('El texto de la bandeja se lee sobre el verde del panel:');

// Medido, no "se ve bien": var(--label-3) daba 3,83:1 y el texto de la
// columna derecha quedaba prácticamente invisible.
const fondo = C.aRgb('#16352a');
const mide = function (col) { return C.contraste(C.sobre(C.aRgb(col), fondo), fondo); };
[['.dm-solic-vacio', 'rgba(244,239,229,.72)'],
 ['.dm-bandeja-pie', 'rgba(244,239,229,.68)'],
 ['.dm-bandeja-col > .sec-title', 'rgba(244,239,229,.82)']].forEach(function (par) {
  const rg = reglas.filter(function (x) { return x.sel === par[0]; })[0];
  r.ok(!!rg && rg.cuerpo.indexOf(par[1]) >= 0, par[0] + ' usa el color nuevo');
  const c = mide(par[1]);
  r.ok(c >= C.MINIMO_LEGIBLE, '…y llega al mínimo legible', c.toFixed(2) + ':1');
});

r.seccion('Las vistas van a la columna derecha, no al tacho:');

// Antes se descartaban ANTES de llegar a la bandeja (`return` seco) y lo
// único que quedaba era un renglón diciendo "8 marcada(s) como vista(s)".
// O sea: la columna derecha vacía mientras había ocho cosas que mostrar.
r.ok(!/if\(reviewedSet\.has\(String\(r\.id\)\)\) return;/.test(app),
     'ya no se descartan');
r.ok(/const _visto = reviewedSet\.has\(String\(r\.id\)\);/.test(app),
     'se marcan');
r.ok(/_visto:_visto\}\)/.test(app), 'y viajan marcadas');
r.ok(/leido:list\.every\(function \(r\) \{ return r\._visto === true; \}\)/.test(app)
     || /leido:list\.every\(function\(r\)\{ return r\._visto === true; \}\)/.test(app),
     'una tarjeta está vista solo si lo están TODAS sus escalas');
r.ok(/'<div class="sec-title">Vistas'/.test(app),
     'la columna derecha se llama por lo que tiene');
r.ok(!/<summary>Resueltas · '\+hecho\.length/.test(app),
     'y ya no vive plegada detrás de un desplegable cerrado');

r.cerrar('Una clase que dice "estoy en tal pantalla" se limpia al salir, no en el handler de un botón.');
