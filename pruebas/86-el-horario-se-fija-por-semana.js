// "Una paciente me dice que todos los días le recomienda uno distinto. Eso
//  no ayuda a mantener la estabilidad; que el horario se vaya modificando
//  solo en la medida que cambia la eficiencia de sueño."
//
// Y era literalmente así. `computeSleepWindow` promedia las últimas 14
// noches y se vuelve a ejecutar en cada render: cada noche nueva entra al
// promedio, la más vieja sale, y la hora de acostarse se corre unos minutos
// todos los días. Una media móvil disfrazada de indicación.
//
// Eso no es restricción de tiempo en cama: es su contrario. El mecanismo
// del tratamiento es sostener una ventana FIJA hasta que la presión de
// sueño consolide el dormir, y recién entonces moverla. Un horario que
// cambia solo no se puede cumplir, no se puede evaluar, y le enseña a la
// persona que el número no significa nada.
//
// Lo peor: el propio texto de la app ya decía "la próxima semana podés
// adelantar 15 minutos" mientras el número se movía a diario. La copia
// describía el protocolo correcto y el código hacía otra cosa — el mismo
// patrón que el comentario de Lichstein citando el criterio de frecuencia
// sobre un código que sólo miraba el promedio.

const C = require('./comun');
const vm = require('vm');
const r = C.crearReporte('El horario se fija por semana');

const app = C.leerApp();

r.seccion('El protocolo, escrito donde está el código:');

r.ok(/const DM_VENTANA_DIAS = 7;/.test(app), 'se sostiene 7 noches');
r.ok(/const DM_VENTANA_PASO = 15;/.test(app), 'se mueve de a 15 minutos');
r.ok(/const DM_VENTANA_PISO = 300;/.test(app), 'con piso de 5 h');
r.ok(/Spielman 1987/.test(app) && /AASM Clinical\s*\n?\/\/ Practice Guideline 2021|AASM Clinical/.test(app),
     'con las fuentes');

r.seccion('Se titula desde la ventana vigente, no desde cero:');

// Ésta es la diferencia de fondo. Recalcular el promedio cada vez ES el bug.
r.ok(/let dur = dmWindowDuration\(p\.bed, p\.wake\);/.test(app),
     'se parte de la duración que la persona tiene prescripta');
r.ok(/dur \+= DM_VENTANA_PASO/.test(app) && /dur - DM_VENTANA_PASO/.test(app),
     'y se le suma o resta el paso');
r.ok(/No se recalcula el promedio desde cero/.test(app),
     'con el motivo escrito');
// El ancla es la hora de levantarse y no se mueve: Spielman, y además es
// lo que ajusta el reloj circadiano.
r.ok(/const nuevaBed = \(\(p\.wake - dur\)%1440\+1440\)%1440;/.test(app),
     'y se corre la hora de acostarse, no la de levantarse');
r.ok(/El ancla es la hora de LEVANTARSE y no se mueve/.test(app),
     'con el motivo escrito');

r.seccion('Y la eficiencia que titula es la DE ESA SEMANA:');

r.ok(/function dmEficienciaDesde\(entries, desdeISO, minNoches\)/.test(app),
     'se calcula sobre las noches posteriores a la prescripción');
r.ok(/e\.diary_date > desdeISO/.test(app), 'filtrando por fecha');
r.ok(/if\(v\.length < \(minNoches\|\|5\)\) return \{eff:null/.test(app),
     'y con menos de 5 noches no se titula nada');

r.seccion('Corriéndolo:');

const ctx = C.appEvaluada();
r.ok(!!ctx, 'la app se evalúa entera');
if (ctx) {
  // localStorage de mentira, que es donde vive la prescripción.
  vm.runInContext(
    'var __ls={}; localStorage={getItem:function(k){return __ls[k]===undefined?null:__ls[k];},' +
    'setItem:function(k,v){__ls[k]=String(v);},removeItem:function(k){delete __ls[k];}};', ctx);

  const iso = function (d) { return d.toISOString().slice(0, 10); };
  const noches = function (n, tst, finDia) {
    // Devuelve n noches terminando en `finDia` (Date), en orden descendente,
    // que es como vienen del diario.
    const o = [];
    for (let i = 0; i < n; i++) {
      const d = new Date(finDia.getTime() - i * 86400000);
      o.push({ diary_date: iso(d), bedtime: '23:30', wake_time: '07:30',
               get_up_time: '07:30', sleep_minutes: tst });
    }
    return o;
  };
  const hoy = new Date();
  const corre = function (ns) {
    ctx.__ns = ns;
    return vm.runInContext('dmVentanaPrescripta(__ns, null)', ctx);
  };
  const resetear = function () { vm.runInContext('__ls={};', ctx); };

  // ── Primera vez: se fija ──
  resetear();
  const v1 = corre(noches(14, 400, hoy));
  r.ok(!v1.error, 'con 14 noches se puede calcular', v1.error || '');
  r.ok(v1.congelada === true, 'queda congelada desde el primer día');
  r.ok(v1.diasRestantes === 7, 'y se sostiene 7 noches', String(v1.diasRestantes));
  r.ok(v1.ciclo === 1, 'ciclo 1');

  // ── Al día siguiente, con una noche más y otro promedio: NO se mueve ──
  // Éste es el caso que reportó la paciente: antes, esta llamada devolvía
  // un bedTarget distinto.
  const v2 = corre(noches(14, 455, hoy));   // 55 min más de sueño promedio
  r.ok(v2.bedTarget === v1.bedTarget && v2.wakeTarget === v1.wakeTarget,
       'al día siguiente, con otro promedio, el horario es EL MISMO',
       v1.fmt(v1.bedTarget) + '→' + v1.fmt(v1.wakeTarget) + '  vs  ' +
       v2.fmt(v2.bedTarget) + '→' + v2.fmt(v2.wakeTarget));
  r.ok(v2.ciclo === 1, 'y sigue en el mismo ciclo');

  // ── A los 7 días, con eficiencia alta: se amplía 15 min ──
  //
  // `desde` se sella con la fecha de HOY cuando se prescribe, así que para
  // probar la titulación hay que sembrar una prescripción vieja. Se siembra
  // en localStorage, que es exactamente de donde la lee la app: la prueba
  // recorre el mismo camino que la paciente la semana que viene.
  const sembrar = function (bed, wake, diasAtras, ciclo) {
    const d = new Date(hoy.getTime() - diasAtras * 86400000);
    ctx.__p = JSON.stringify({ bed: bed, wake: wake, desde: iso(d), ciclo: ciclo || 1 });
    vm.runInContext("localStorage.setItem('dm_tcci_ventana', __p);", ctx);
  };
  // Ventana de 8 h: 23:30 \u2192 07:30.
  const BED = 23 * 60 + 30, WAKE = 7 * 60 + 30;

  resetear();
  sembrar(BED, WAKE, 8, 1);
  // Ocho noches posteriores con eficiencia alta: TIB 8 h, TST 7 h 40 = 96 %.
  const v3 = corre(noches(8, 460, hoy));
  r.ok(v3.ajuste === '+', 'con eficiencia \u226590 % el ajuste es +', String(v3.ajuste));
  r.ok(v3.windowMin === 480 + 15,
       'y la ventana crece exactamente 15 min', '480 \u2192 ' + v3.windowMin);
  r.ok(v3.wakeTarget === WAKE, 'sin mover la hora de levantarse');
  r.ok(v3.ciclo === 2, 'y pasa al ciclo 2');
  r.ok(v3.diasRestantes === 7, 'que vuelve a sostenerse 7 noches');

  // ── Eficiencia baja: se recorta ──
  resetear();
  sembrar(BED, WAKE, 8, 1);
  // TIB 8 h, TST 6 h = 75 %.
  const v4 = corre(noches(8, 360, hoy));
  r.ok(v4.ajuste === '-', 'con eficiencia <85 % el ajuste es \u2212', String(v4.ajuste));
  r.ok(v4.windowMin === 480 - 15, 'y se recorta 15 min', '480 \u2192 ' + v4.windowMin);

  // ── El piso de 5 h ──
  // Por debajo de 5 h la restricción deja de ser segura: somnolencia diurna
  // y riesgo al conducir. El recorte se frena ahí aunque la eficiencia siga
  // baja.
  resetear();
  sembrar(((WAKE - 300) % 1440 + 1440) % 1440, WAKE, 8, 3);
  const v5 = corre(noches(8, 200, hoy));
  r.ok(v5.windowMin === 300, 'y nunca baja de 5 h', String(v5.windowMin) + ' min');

  // ── Eficiencia intermedia: no se toca ──
  resetear();
  sembrar(BED, WAKE, 8, 1);
  // TIB 8 h, TST 6 h 56 = 87 %.
  const v6 = corre(noches(8, 416, hoy));
  r.ok(v6.ajuste === '=', 'entre 85 y 90 % se mantiene', String(v6.ajuste));
  r.ok(v6.windowMin === 480, 'con la misma ventana');

  // ── Sin noches de la semana no se titula ──
  resetear();
  sembrar(BED, WAKE, 8, 1);
  const viejas = new Date(hoy.getTime() - 20 * 86400000);
  const v7 = corre(noches(14, 400, viejas));   // nada posterior a la prescripción
  r.ok(v7.ajuste === 'sin_datos',
       'sin noches nuevas no se mueve nada, y se dice por qu\u00e9', String(v7.ajuste));
  r.ok(v7.bedTarget === BED && v7.wakeTarget === WAKE,
       'y el horario vigente se mantiene mientras tanto');
}

r.seccion('Y la pantalla lo dice:');

const fs = require('fs');
const path = require('path');
const tcci = fs.readFileSync(
  path.join(__dirname, '..', 'js', 'dormetria-tcci.js'), 'utf8');
r.ok(/dmVentanaPrescripta\(_d\|\|\[\], _anchor\)/.test(tcci),
     'la vista del paciente usa la ventana sostenida');
r.ok(/Este horario se mantiene igual/.test(tcci),
     'y dice cuántas noches se mantiene igual');
// Lo más importante de la tarjeta no es el horario: es que no va a cambiar.
r.ok(/sostenerlo es lo que hace el tratamiento/.test(tcci),
     'y por qué eso es el tratamiento y no un detalle');
r.ok(/Se ajustó hoy/.test(tcci), 'y cuando se ajusta, avisa que se ajustó');

r.cerrar('Un horario que cambia solo no se puede cumplir ni evaluar: le enseña a la persona que el número no significa nada.');
