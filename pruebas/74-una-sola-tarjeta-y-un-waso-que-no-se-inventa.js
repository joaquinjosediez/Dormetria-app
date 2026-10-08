// Tres cosas de una misma sesión.
//
// 1 · Dafne Yudcovsky: "insomnio de mantenimiento" con 0 despertares anotados.
//
//     El motor deriva la vigilia intrasueño cuando el paciente no la
//     registra: resto = tiempo en cama − latencia − sueño. Dos defectos, y
//     los dos inventan despertares que nadie tuvo.
//
//     El primero lo introduje yo en mod261. Al unificar el TIB para que
//     cuente hasta LEVANTARSE —que es lo correcto para la eficiencia—, el
//     resto pasó a incluir el rato que la persona se queda en la cama DESPUÉS
//     de despertarse. Eso no es vigilia intrasueño: es exceso de tiempo en
//     cama, que es otro eje y se corrige con otra cosa. En Dafne daba 31 min
//     y el corte de mantenimiento es 30: la etiquetó por un minuto, y de ahí
//     salió también el tag automático "Insomnio".
//
//     El segundo es más viejo: "anoté 0 despertares" se trataba igual que "no
//     contesté". El histograma noche a noche ya hace esa distinción; el motor
//     no la hacía, y derivaba un número que contradice al paciente.
//
// 2 · Las siestas pasan a vivir adentro de la misma tarjeta que la noche.
//
// 3 · Los histogramas por semana se extienden al resto del panel de admin.

const C = require('./comun');
const vm = require('vm');
const r = C.crearReporte('Una sola tarjeta y un WASO que no se inventa');

const app = C.leerApp();
const fs = require('fs');
const path = require('path');
const motor = fs.readFileSync(
  path.join(__dirname, '..', 'js', 'dormetria-motor-orientacion.js'), 'utf8');

r.seccion('1 · La vigilia intrasueño no sale del tiempo en cama:');

r.ok(/hasta === 'despertar'/.test(app),
     'dmTIBNoche sabe devolver la ventana hasta DESPERTARSE, que es otra cosa');
r.ok(/if \(dormM != null\) ventanas\.push\(dormM\)/.test(motor),
     'y el motor la acumula aparte del tiempo en cama');
r.ok(/Math\.max\(0, ventana - latenciaMedia - tst\)/.test(motor),
     'el resto se calcula sobre esa ventana, no sobre el TIB');
r.ok(!/tib - latenciaMedia - tst/.test(motor),
     'y no quedó la resta vieja');

// "Anoté 0" no es "no contesté".
r.ok(/const dijoSinDespertares = despertares\.length > 0 && prom\(despertares\) === 0/.test(motor),
     'si el paciente anotó 0 despertares, el WASO es 0');
r.ok(/\(dijoSinDespertares \|\| ventana <= 0\)\s*\?\s*0/.test(motor.replace(/\s+/g, ' ')),
     'no se deriva nada: derivarlo es contradecirlo con una resta');

r.seccion('Y un número derivado no se presenta como medido:');

r.ok(/const wasoEsDerivado = wasos\.length === 0 && wasoDerivado > 0/.test(motor),
     'se marca cuando la vigilia salió de una resta');
r.ok(/estimada: no registró despertares/.test(motor),
     'y la orientación lo dice en el texto');
// El corte de Lichstein 2003 vale para WASO medido. Sobre un residuo que
// arrastra el error de tres cifras, 31 contra 30 no distingue nada.
r.ok(/metrics\.wasoEsDerivado\s*\?\s*metrics\.vigiliaIntrasueño > 60/.test(motor.replace(/\s+/g, ' ')),
     'y para etiquetar mantenimiento sobre un derivado se pide el doble del corte');

r.seccion('La cuenta, con los números de Dafne:');

const ctx = C.appEvaluada();
r.ok(!!ctx, 'la app se evalúa entera');
if (ctx) {
  const noches = function (extra) {
    const out = [];
    for (let i = 0; i < 4; i++) {
      out.push(Object.assign({
        diary_date: '2026-10-0' + (2 + i),
        bedtime: '00:53', wake_time: '07:24', get_up_time: '07:55',
        sleep_minutes: 416, sleep_latency_mins: 7, awakenings: 0, sleep_quality: 3
      }, extra || {}));
    }
    return out;
  };
  const orienta = function (ns) {
    return vm.runInContext('dmMotorOrientacion([], ' + JSON.stringify(ns) + ', {email:"d@x.com"})',
                           ctx, { timeout: 20000 }).orientacion.texto;
  };

  // Se despierta 07:24 y se queda en la cama hasta 07:55: 31 min que NO son
  // despertares. Y ella anotó 0.
  r.ok(!/mantenimiento/.test(orienta(noches())),
       'con 0 despertares anotados ya no dice mantenimiento', orienta(noches()));

  // Lo que SÍ tiene que seguir diciéndolo: WASO medido por encima del corte.
  r.ok(/mantenimiento/.test(orienta(noches({ awakenings: 3, wake_in_bed_mins: 70 }))),
       'con 70 min de WASO anotados, sí');

  // Sin dato de despertares: se deriva, pero con el corte al doble.
  const sinDato = noches();
  sinDato.forEach(function (e) { delete e.awakenings; e.sleep_minutes = 300; });
  r.ok(/mantenimiento/.test(orienta(sinDato)),
       'sin dato y con un residuo grande de verdad (84 min), también');
  const chico = noches();
  chico.forEach(function (e) { delete e.awakenings; e.sleep_minutes = 346; });
  r.ok(!/mantenimiento/.test(orienta(chico)),
       'sin dato y con un residuo de 38 min, no: cae en alteraciones leves',
       orienta(chico));
}

r.seccion('2 · Las siestas, adentro de la tarjeta de la noche:');

r.ok(/<div class="dm-met-col-h" style="margin-top:14px">Día · siestas<\/div>/.test(app),
     'un separador, no una tarjeta nueva');
r.ok(!/dm-bloque-dia/.test(app),
     'y la tarjeta aparte ya no existe');
// Dos cajas de alto distinto en una fila de dos celdas dejaban media columna
// en blanco, que es lo que se reportó. Sin segunda caja no hay nada que
// emparejar.
r.ok(!/_nd\.appendChild\(_dia\)/.test(app) && !/_filasEnDia/.test(app),
     'ni el reacomodo que las emparejaba');

const filas = app.slice(app.indexOf('function dmFilasSiestas(entries, row, C, ageYears){'),
                        app.indexOf('function dmTieneEscolaridad'));
r.ok(/const _detalle = \(ageYears == null\) \? false : \(ageYears < 13\)/.test(filas),
     'en un chico va el detalle completo; en un adulto, tres cifras');
r.ok(/if\(_detalle && S2\.sdInicio != null\)/.test(filas),
     'la regularidad de la siesta es pediátrica');
r.ok(/if\(_detalle && conN\.length >= 4/.test(filas),
     'la comparación de noches con y sin siesta, también');
// Lo que SÍ le sirve a un adulto: con qué frecuencia, cuánto dura, y cuánto
// falta de ahí a la cama, que es lo único que se modifica.
r.ok(/row\('Días con siesta'/.test(filas) &&
     /row\('Duración media'/.test(filas) &&
     /row\('De la siesta a la noche'/.test(filas),
     'y las tres del adulto quedan siempre');

r.seccion('Y las dos fuentes de "cuánta siesta" dejan de contradecirse:');

// Con las dos cifras ahora en la MISMA tarjeta, el desacuerdo quedaba a la
// vista: "no hay siestas registradas en el período" tres renglones arriba de
// "Días con siesta: 12 de 24".
r.ok(/const _diurno = \(_c24 && _c24\.avgNapMin\) \? _c24\.avgNapMin/.test(app),
     'si una de las dos ve siestas, hay siestas');

if (ctx) {
  const { JSDOM } = require('jsdom');
  const dias = [];
  for (let i = 0; i < 24; i++) {
    dias.push({ diary_date: new Date(Date.UTC(2026, 8, 1 + i)).toISOString().slice(0, 10),
      bedtime: '23:10', wake_time: '07:00', get_up_time: '07:20', sleep_minutes: 430,
      sleep_latency_mins: 20, awakenings: 1, wake_in_bed_mins: 25,
      nap_minutes: (i % 2 ? 45 : 0), sleep_quality: 3, day_type: 'work' });
  }
  const pinta = function (edad) {
    const html = vm.runInContext('renderClinicalMetricsHtml(' + JSON.stringify(dias) +
      ', "doctor", ' + edad + ')', ctx, { timeout: 20000 });
    const d = new JSDOM('<div id="x"></div>');
    d.window.document.getElementById('x').innerHTML = html;
    return { html: html, doc: d.window.document,
             texto: d.window.document.getElementById('x').textContent.replace(/\s+/g, ' ') };
  };
  const ad = pinta(40);
  r.ok(ad.doc.querySelectorAll('#x > .dm-metricas').length === 1,
       'en un adulto es UNA sola tarjeta',
       ad.doc.querySelectorAll('#x > .dm-metricas').length + '');
  r.ok(!/No hay siestas registradas/.test(ad.texto),
       'y el encabezado ya no desmiente al bloque de abajo');
  r.ok(!/Regularidad de la siesta/.test(ad.texto),
       'sin las métricas pediátricas');
  const ni = pinta(4);
  r.ok(/Siestas por día/.test(ni.texto),
       'en un chico sí están');
  // Un div sin cerrar en una plantilla de 200 líneas se ve como "la mitad de
  // la ficha desapareció", y no deja error en consola.
  [40, 4, 10, 15, 70].forEach(function (e) {
    const h = pinta(e).html;
    r.ok((h.match(/<div/g) || []).length === (h.match(/<\/div>/g) || []).length,
         '  los div cierran a los ' + e + ' años');
  });
}

r.seccion('3 · Los histogramas, en el resto del panel de admin:');

r.ok(/serie:_altasPts/.test(app) && /serie:_altasDrs/.test(app),
     'altas de pacientes y de profesionales por semana');
r.ok(/serie:_serieAct30/.test(app), 'activos de 30 días');
r.ok(/serie:_accesosDrs/.test(app), 'y profesionales que abrieron la app');
// Un flujo semanal debajo de un acumulado se lee como "el total subió".
r.ok(/altas por semana/.test(app),
     'y el pie aclara que la barra es un flujo, no el acumulado de arriba');
// La serie de 30 días es una ventana móvil: no la mueve una semana floja.
r.ok(/t > hasta \|\| t <= hasta - 30\*86400000/.test(app),
     'la de 30 días es una ventana móvil, no semanas sueltas');
// accesos_diarios se pedía solo de los últimos 30 días: con eso el
// histograma tendría cuatro barras y diez huecos.
r.ok(/Date\.now\(\) - 95\*86400000/.test(app),
     'y los accesos se piden por 13 semanas, no por 30 días');

r.seccion('Permanencia dice lo que es y lo que no:');

r.ok(/const medStay = \(function\(\)\{/.test(app),
     'se agrega la mediana: en una cola larga el promedio describe los extremos');
r.ok(/No cuenta a quien nunca registró nada/.test(app),
     'y el pie dice a quién deja afuera');
r.ok(/mezcla al que se fue con el que sigue/.test(app),
     'y que no distingue al que abandonó del que sigue activo');

r.cerrar('Un número derivado de una resta no puede sostener una etiqueta clínica como si lo hubiera medido alguien.');
