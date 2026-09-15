// Un colega que entra por primera vez veía un panel vacío y un botón que le
// pedía un código que todavía no tiene. No podía juzgar nada de la app hasta
// conseguir su primer paciente y esperar dos semanas de diario.
//
// Ahora el listado se siembra con los cinco casos de ejemplo, que ya están
// cargados en la base con noches y escalas, y el recorrido guiado se armó
// alrededor de ellos en vez de mandar a buscar un código.
//
// Lo que se cuida acá es que la siembra no ensucie la cartera de nadie: se
// hace SOLO con el listado vacío, se marca cada ejemplo como tal, y se puede
// deshacer.

const C = require('./comun');
const r = C.crearReporte('El panel no arranca vacío');

const html = C.leerHtml();

r.seccion('Los cinco ejemplos:');

['KAFKA1','CURIE1','PETER1','KAHLO1','WINKLE'].forEach(function(cod){
  r.ok(html.indexOf("'" + cod + "'") >= 0, 'está el código ' + cod);
});

r.ok(/function dmSembrarDemos/.test(html), 'existe la siembra');
r.ok(/find_patient_by_code/.test(html.slice(
       html.indexOf('async function dmSembrarDemos'),
       html.indexOf('window.dmSembrarDemos'))),
     'resuelve por código, no por emails escritos a mano');

r.seccion('No se le meten ejemplos a quien ya tiene pacientes:');

const bloqueEnganche = html.slice(
  html.indexOf('// Panel vacío: antes de mostrar el cartel'),
  html.indexOf('// Panel vacío: antes de mostrar el cartel') + 900);
r.ok(/if\(!cachedEmails\.length\)/.test(bloqueEnganche),
     'la siembra corre solo con el listado vacío');
r.ok(/dmSembrarDemos\(false\)/.test(bloqueEnganche),
     'y respeta la marca de "ya sembrado"');

r.seccion('Se distinguen de un paciente real:');

r.ok(/function dmEsDemo/.test(html), 'hay una función que los reconoce');
r.ok(/>EJEMPLO</.test(html), 'y el listado los marca con una etiqueta');
r.ok(/is_demo === true/.test(html),
     'la marca sale de la base, no solo de una heurística');

r.seccion('Se pueden sacar:');

r.ok(/function dmQuitarDemos/.test(html), 'existe la función de quitarlos');
r.ok(/Quitar los ejemplos<\/button>/.test(html),
     'y está en el menú, no escondida en la consola');
const bloqueQuitar = html.slice(html.indexOf('async function dmQuitarDemos'),
                                html.indexOf('window.dmQuitarDemos'));
r.ok(/No se borran/.test(bloqueQuitar),
     'y avisa que solo se desvinculan, porque son de todos los profesionales');

r.seccion('La guía se armó sobre los ejemplos:');

const tour = html.slice(html.indexOf("'doctor_home': {"),
                        html.indexOf("'doctor_home': {") + 5200);
r.ok(/cinco casos de ejemplo/.test(tour),
     'el primer paso dice que el panel ya viene cargado');
r.ok(/retraso de fase/.test(tour),
     'y nombra qué muestra cada caso');
r.ok(tour.indexOf('Bienvenido') < tour.indexOf('c\\u00f3digo de 6 caracteres') ||
     tour.indexOf('código de 6 caracteres') > tour.indexOf('cinco casos de ejemplo'),
     'vincular pacientes reales quedó al final, no en el paso 2');

r.seccion('El recorrido espera a que los ejemplos estén:');

r.ok(/_dmSembrandoDemos/.test(html),
     'hay una bandera de "siembra en curso"');
const bloqueEspera = html.slice(html.indexOf('function esperarSiembra'),
                                html.indexOf('function esperarSiembra') + 600);
r.ok(/intentos < 20/.test(bloqueEspera),
     'y el tour la espera con un tope, sin quedarse colgado');

r.cerrar('Una app vacía no se puede evaluar, y el colega solo la abre una primera vez.');
