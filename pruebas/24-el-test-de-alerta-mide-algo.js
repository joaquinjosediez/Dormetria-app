// El test de alerta ofrecía una opción de 1 minuto.
//
// No existe un PVT de un minuto validado. El estándar son 10 minutos
// (Dinges & Powell 1985) y la versión breve validada es el PVT-B de 3 minutos
// (Basner, Mollicone & Dinges 2011, Acta Astronautica). Con estímulos cada
// 2-10 segundos, un minuto da unas 6 a 12 respuestas: no alcanza para estimar
// lapsos, que es la medida principal del test.
//
// Y sin embargo devolvía un semáforo, un tiempo de reacción promedio, una
// desviación estándar y una comparación contra la referencia circadiana. Un
// resultado con forma de resultado y nada atrás — peor que no ofrecer el test.
//
// Además, cuando el guardado fallaba, el resultado se mostraba igual y la
// persona se quedaba creyendo que había quedado registrado.

const C = require('./comun');
const r = C.crearReporte('El test de alerta mide algo');

const html = C.leerHtml();

r.seccion('La opción de 1 minuto no está:');

const opts = (html.match(/data-d="(\d+)"/g) || []).map(s => s.replace(/\D/g,''));
r.ok(opts.indexOf('1') < 0, 'no hay botón de 1 minuto', 'opciones: ' + opts.join(', '));
r.ok(opts.indexOf('3') >= 0, 'la más corta es la de 3 min, que sí está validada');
r.ok(opts.length >= 3, 'y siguen estando las otras', opts.length + ' opciones');

r.seccion('Y no se puede llegar por otro lado:');

r.ok(/S\.pvtDuration=Math\.max\(3, mins\)/.test(html),
     'el selector no acepta menos de 3 aunque lo llamen con otro valor');
r.ok(/if\(!S\.pvtDuration\|\|S\.pvtDuration<3\)S\.pvtDuration=5/.test(html),
     'y a quien tenía 1 guardado de antes se le corrige al abrir');

r.seccion('Un test corto no se guarda como si midiera lo mismo:');

const guardados = (html.match(/if\(dur>=3&&S\.user\)\{/g) || []).length;
r.ok(guardados === 2, 'el piso de 3 min vale en el test simple y en el de conducción',
     guardados + ' lugares');
r.ok(!/if\(dur>=1&&S\.user\)\{/.test(html), 'no quedó ningún dur>=1');

r.seccion('Y si no se guarda, se dice:');

r.ok(/El resultado NO se guardó/.test(html),
     'un error de red se avisa, no solo va a la consola');
r.ok((html.match(/no hay sesión iniciada/g)||[]).length >= 2,
     'y sin sesión se avisa en los dos modos');

r.seccion('La razón queda escrita donde se toca:');

r.ok(/Basner/.test(html), 'con la cita del PVT-B');
r.ok(/Dinges & Powell 1985/.test(html), 'y la del PVT original');

r.cerrar('Un test que no puede medir lapsos no debería devolver un semáforo.');
