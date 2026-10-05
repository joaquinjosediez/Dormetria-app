// "¿Dónde quedó el actograma en el perfil del hijo?" Estaba. Detrás de un
// botón que decía "Ver historial · Gráficos y tendencias", junto con la lista
// de registros, el gráfico de horas y el cuadro de regularidad — todo en una
// sola pantalla sin encabezados que la partieran.
//
// Que el autor de la app no lo encuentre es el dato: el nombre del botón no
// decía lo que había adentro, y lo que un padre busca ahí son DOS cosas
// distintas —"¿cómo viene durmiendo?" y "¿dónde corrijo lo de anoche?"—
// metidas una abajo de la otra.
//
// Ahora son dos botones en el inicio y dos pestañas en el panel.

const C = require('./comun');
const r = C.crearReporte('El actograma del hijo no está escondido');

const app = C.leerApp();

const i = app.indexOf('function renderChildQuickActions(){');
r.ok(i > 0, 'se encuentran los accesos del inicio infantil');
const acciones = app.slice(i, app.indexOf('</button>`', i));

r.seccion('Dos botones, cada uno con su nombre:');

r.ok(/label:'Gráficos'/.test(acciones), 'Gráficos');
r.ok(/Actograma, horas y regularidad/.test(acciones),
     'y dice qué hay adentro, no "gráficos y tendencias"');
r.ok(/label:'Registros'/.test(acciones), 'Registros');
r.ok(/Ver y corregir lo cargado/.test(acciones),
     'y dice que ahí se corrige, que es para lo que se entra');
r.ok(!/label:'Ver historial'/.test(acciones),
     'ya no está el botón que los tapaba a los dos');

r.seccion('Cada uno abre su vista, no la de al lado:');

r.ok(/window\._chDiarioModo='graficos';showChildTab\('diary'\)/.test(acciones),
     'Gráficos marca su modo antes de abrir');
r.ok(/window\._chDiarioModo='registros';showChildTab\('diary'\)/.test(acciones),
     'Registros, el suyo');
// Marcar y que showChildTab dibuje: llamar al re-render acá también lo
// dibujaría dos veces, la primera sobre un panel todavía oculto.
r.ok(!/dmChDiarioModo\('graficos'\);showChildTab/.test(acciones),
     'sin dibujar dos veces');

r.seccion('Y adentro se puede cambiar sin volver al inicio:');

const panel = app.slice(app.indexOf('const _modo = (window._chDiarioModo'),
                        app.indexOf('const _modo = (window._chDiarioModo') + 1800);
r.ok(/dmChDiarioModo/.test(panel), 'hay un selector Gráficos / Registros');
r.ok(/_sel\('graficos','Gráficos'\)\+_sel\('registros','Registros'\)/.test(panel),
     'con las dos opciones');
r.ok(/function dmChDiarioModo\(m\)\{/.test(app), 'y la función que las cambia');

r.seccion('El actograma está en Gráficos y la lista en Registros:');

r.ok(/_modo === 'graficos'[\s\S]{0,200}actogramHtml/.test(panel),
     'el actograma va en Gráficos');
r.ok(/noches cargadas[\s\S]{0,200}listHtml/.test(panel),
     'y la lista editable en Registros');
r.ok(/Para corregir una noche mal cargada, entrá en <b>Registros<\/b>/.test(panel),
     'y desde Gráficos se dice dónde está lo otro');

r.cerrar('Si el que escribió la app no encuentra el actograma, el botón no se llama como debería.');
