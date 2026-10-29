// "Una paciente me dice que no puede pasar a la semana 2 de la TCC-I, que
//  está bloqueada. En esta instancia inicial dejalo desbloqueado para
//  todos, estamos en fase de prueba."
//
// Lo primero: NO estaba roto. En modo guiado —la paciente vinculada a un
// profesional— la semana 2 se abre cuando el profesional la habilita desde
// su panel, y nadie la había habilitado. La paciente quedó esperando un
// clic que no sabía que existía, y el mensaje que veía ("La habilita tu
// profesional cuando lo trabajen") no le decía que tenía que pedirlo.
//
// Durante el piloto esa compuerta cuesta más de lo que protege: cada
// semana trabada es una persona que abandona y un diario que deja de
// existir.
//
// ── Lo que NO se abre, y es lo que importa ───────────────────────────
//
// El cálculo de la ventana de sueño sigue pidiendo un mínimo de 5 noches
// de diario. Abrir el contenido de una semana no es lo mismo que
// recalcular la restricción de tiempo en cama sobre datos que no existen.
// La titulación de la restricción es semanal y se apoya en la eficiencia
// de las noches anteriores (Edinger et al., AASM Clinical Practice
// Guideline 2021). Eso queda igual, y esta prueba lo fija.
//
// ── Y es un interruptor, no un borrado ───────────────────────────────
//
// La lógica de apertura sigue escrita. Apagar DM_TCCI_PILOTO devuelve el
// comportamiento normal con una línea. Si en vez de eso se hubiera
// borrado la compuerta, reponerla el día que el piloto termine sería
// reescribirla de memoria.

const C = require('./comun');
const vm = require('vm');
const fs = require('fs');
const path = require('path');
const r = C.crearReporte('La TCC-I abierta durante el piloto');

const tcci = fs.readFileSync(
  path.join(__dirname, '..', 'js', 'dormetria-tcci.js'), 'utf8');

r.seccion('Hay un interruptor, y está encendido:');

r.ok(/const DM_TCCI_PILOTO = true;/.test(tcci), 'DM_TCCI_PILOTO = true');
r.ok(/Es UN interruptor, no un borrado de la compuerta/.test(tcci),
     'y queda escrito que es un interruptor, no un borrado');
// La compuerta de verdad sigue ahí abajo: apagar el interruptor la reactiva.
r.ok(/dmTcciHabilitadasPorPro\(\)\[n\]===true/.test(tcci),
     'la regla del modo guiado sigue escrita');
r.ok(/return dmTcciCerrada\(n-1\);/.test(tcci),
     'y la del autogestionado también');

r.seccion('Abre las dos compuertas, que eran distintas:');

const abierta = tcci.slice(tcci.indexOf('function dmTcciSemanaAbierta(n){'),
                           tcci.indexOf('// Por qué está cerrada'));
r.ok(/if\(DM_TCCI_PILOTO\) return true;/.test(abierta),
     'la clínica: el 🔒 de "la habilita tu profesional"');
// La otra era el paywall, que se veía como "Premium" y no como candado.
// Son dos bloqueos distintos y la persona los reporta igual.
r.ok(/const bloqueadaPorPago = !DM_TCCI_PILOTO &&/.test(tcci),
     'y la de cobro, que se mostraba como "Premium"');
r.ok(/if\(!DM_TCCI_PILOTO && dmTcciModo\(\)!=='guiado' && !s\.libre/.test(tcci),
     'incluida la hoja de suscripción al intentar entrar');

r.seccion('Pero la ventana de sueño NO se abre:');

// Esto es lo que hace que abrir las semanas sea defendible. Si cayera
// también, el programa propondría una restricción de tiempo en cama
// calculada sobre nada.
r.ok(/al menos <strong>5 noches<\/strong>/.test(tcci),
     'sigue pidiendo 5 noches de diario para calcular el horario');
r.ok(!/DM_TCCI_PILOTO/.test(tcci.slice(tcci.indexOf('al menos <strong>5 noches') - 1200,
                                       tcci.indexOf('al menos <strong>5 noches'))),
     'y el interruptor no toca esa rama');
r.ok(/AASM CPG 2021|AASM Clinical Practice|Edinger/.test(tcci),
     'con la referencia de por qué la titulación es semanal');

r.seccion('Y se le dice a la persona que está abierto por la prueba:');

// Si está todo abierto y nadie avisa, alguien hace la semana 4 antes que
// la 2 sin saber que el orden importa.
r.ok(/Durante la prueba están abiertas las siete semanas/.test(tcci),
     'hay un aviso arriba de la lista');
r.ok(/conviene hacerlas en orden/.test(tcci),
     'que dice que conviene hacerlas en orden');
r.ok(/cada una se apoya en la anterior/.test(tcci),
     'y por qué');

r.seccion('Corriéndolo:');

const ctx = C.appEvaluada();
r.ok(!!ctx, 'la app se evalúa entera');
if (ctx) {
  const abre = function (n) {
    ctx.__n = n;
    return vm.runInContext('dmTcciSemanaAbierta(__n)', ctx);
  };
  // Modo guiado, sin ninguna semana habilitada por el profesional: era el
  // caso exacto de la paciente.
  vm.runInContext("S._tcciGuiadoPor='pro@x.com'; S._tcciSemanasPro={};", ctx);
  r.ok(abre(1) === true, 'guiado · semana 1 abierta');
  r.ok(abre(2) === true, 'guiado · semana 2 abierta (era la que se trababa)');
  [3, 4, 5, 6, 7].forEach(function (n) {
    r.ok(abre(n) === true, '  y la ' + n);
  });
  // Autogestionado sin cerrar la anterior: también.
  vm.runInContext("S._tcciGuiadoPor=null; S._tcciSemanasPro={};", ctx);
  r.ok(abre(2) === true, 'autogestionado · semana 2 abierta sin cerrar la 1');
}

r.cerrar('Una compuerta que espera un clic que nadie sabe que existe no protege: hace abandonar.');
