// "Benjamin Ocampo pone FRAGMENTACIÓN 100 % pero el diario muestra que
// tiene despertares, y largos."
//
// El pilar era, literal:
//
//     const frag = Math.max(0, 20 - awk*5);
//
// Contaba los despertares e ignoraba cuánto duraban. La propia app
// argumenta lo contrario tres tarjetas más abajo, en el pie del
// histograma de WASO: "tres despertares de un minuto y uno de una hora
// no son lo mismo". El pilar no lo usaba.
//
// Lo que se veía: FRAGMENTACIÓN 100 % · "Muy bien" en alguien con 0,3
// despertares por noche de una hora cada uno. El número era correcto y
// la lectura, falsa. Y ese pilar entra en el score compuesto, así que
// el error se propagaba al número grande de la pantalla.
//
// Y estaba TRIPLICADO. mod278 arregló dos copias —la global y la anidada
// del panel del paciente— y dejó la tercera, la de la vista del
// profesional, que seguía siendo `20 - despertares*5` pelado. Por eso la
// pestaña "Diario sueño" mostraba FRAGMENTACIÓN 96 % en una paciente cuyo
// actograma estaba lleno de cortes: el mismo paciente puntuaba distinto
// según la pestaña. mod280 lo deja en UNA función.

const C = require('./comun');
const vm = require('vm');
const r = C.crearReporte('Fragmentación no es contar despertares');

const app = C.leerApp();

r.seccion('El cálculo existe UNA vez:');

r.ok(!/const frag=Math\.max\(0,20-awk\*5\);/.test(app),
     'no queda ninguna copia que cuente solo despertares');
r.ok(!/const frag=Math\.max\(0,20-\(e\.awakenings\|\|0\)\*5\)/.test(app),
     'ni la de la vista del profesional, que fue la última en caer');
r.ok((app.match(/fragWaso - Math\.max\(0, awk-2\)\*2/g) || []).length === 1,
     'la fórmula está escrita una sola vez');
r.ok((app.match(/function dmFragPuntos\(/g) || []).length === 1,
     'en dmFragPuntos');
// Tres lugares la consumen: las dos computePillarScore y el panel del
// profesional. Si aparece un cuarto, que la llame a ella.
r.ok((app.match(/dmFragPuntos\(e\)/g) || []).length >= 3,
     'y los tres lugares que la necesitan la llaman', 
     (app.match(/dmFragPuntos\(e\)/g) || []).length + ' llamadas');

r.seccion('El dibujo y el puntaje salen de los mismos despertares:');

// El actograma dibuja los cortes naranjas desde awakening_detail; el pilar
// puntuaba desde las columnas awakenings / wake_in_bed_mins. Cuando las dos
// fuentes no coinciden —importados, registros viejos, carga a mano— se veía
// una noche rota y la tarjeta decía 96 %.
r.ok(/function dmFragDatos\(/.test(app), 'hay una reconciliación de las dos fuentes');
r.ok(/awk = Math\.max\(awk, det\.length\)/.test(app),
     'y se toma el PEOR de los dos conteos, no el de la columna');
r.ok(/_awakeningsByRow/.test(app) && /awakening_detail/.test(app),
     'que es la misma fuente de la que el actograma dibuja los cortes');
// El subtítulo de la tarjeta tiene que salir de esos mismos números.
r.ok(/const _fd=dmFragDatos\(e\); _awakSum\+=_fd\.awk/.test(app),
     'y el promedio que se muestra debajo del pilar también');
r.ok(/min despierto/.test(app),
     'con los minutos despierto a la vista, que son los que mandan el puntaje');

r.seccion('El corte es el que la app ya usa en todo lo demás:');

// ≥30 min es el criterio cuantitativo de insomnio de mantenimiento
// (Lichstein 2003). La app lo usa en el histograma y en el motor; el
// pilar era el único que no.
r.ok(/Lichstein/.test(app), 'Lichstein 2003 está citado');
r.ok(/if\(w<=10\)\s+fragWaso=20/.test(app.replace(/\s+/g, m => m.includes('\n') ? '\n' : ' ')) ||
     /w<=10\)\s*\{?\s*fragWaso=20/.test(app),
     'por debajo de 10 min no se penaliza: despertarse un momento es normal');

r.seccion('Y se comporta como debe:');

// Se extrae la fórmula del propio archivo y se la corre.
const frag = function (awk, waso) {
  const fragCant = Math.max(0, 20 - awk * 5);
  let f = fragCant;
  if (waso != null) {
    const w = Math.max(0, waso);
    let fw;
    if (w <= 10) fw = 20;
    else if (w <= 30) fw = 20 - (w - 10) * (6 / 20);
    else if (w <= 60) fw = 14 - (w - 30) * (6 / 30);
    else if (w <= 120) fw = 8 - (w - 60) * (8 / 60);
    else fw = 0;
    f = Math.max(0, fw - Math.max(0, awk - 2) * 2);
  }
  return Math.round(f / 20 * 100);
};

r.ok(frag(0, 0) === 100, 'noche sin despertares: 100 %');
// Esto era 75 % con la fórmula vieja Y con el primer intento de arreglo:
// un despertar breve es fisiológico y no puede bajar el pilar.
r.ok(frag(1, 8) === 100, 'un despertar de 8 min: sigue siendo 100 %', frag(1, 8) + '%');
r.ok(frag(1, 60) <= 45,
     'UNO de una hora —el caso que se reportó— ya no es "muy bien"', frag(1, 60) + '%');
r.ok(frag(1, 29) < 80 && frag(1, 29) > 60,
     'uno de 29 min, justo bajo el corte: baja pero no se desploma', frag(1, 29) + '%');
r.ok(frag(1, 120) === 0, 'uno de dos horas: 0 %');
// El número sigue pesando cuando es alto: pocos minutos repartidos en
// seis despertares son una noche rota igual.
r.ok(frag(6, 12) < 70, 'seis despertares de dos minutos: tampoco es buena noche',
     frag(6, 12) + '%');
r.ok(frag(3, 20) > frag(6, 12),
     'y tres cortos puntúan mejor que seis cortos');
// Sin el dato no se inventa una penalización: se cae al conteo, como antes.
r.ok(frag(0, null) === 100 && frag(2, null) === 50,
     'sin dato de WASO se usa el conteo, como antes');

r.seccion('Y corriendo la función de verdad, no una copia de la prueba:');

// Reimplementar la fórmula acá arriba sirve para leerla, pero una prueba que
// solo se compara consigo misma no agarra nada. Se evalúa la app y se le
// pregunta a dmFragPuntos.
const ctx = C.appEvaluada();
r.ok(!!ctx, 'la app se evalúa entera');
if (ctx) {
  const real = function (e) {
    ctx.__e = e;
    return Math.round(vm.runInContext('dmFragPuntos(__e)', ctx) / 20 * 100);
  };
  [[0, 0], [1, 8], [1, 60], [1, 29], [1, 120], [6, 12], [3, 20]].forEach(function (c) {
    const mio = frag(c[0], c[1]);
    const suyo = real({ awakenings: c[0], wake_in_bed_mins: c[1] });
    r.ok(mio === suyo, '  ' + c[0] + ' despertares / ' + c[1] + ' min → ' + suyo + ' %',
         mio === suyo ? '' : 'la prueba dice ' + mio);
  });
  // La reconciliación, con la función de verdad.
  const soloColumnas = real({ awakenings: 0, wake_in_bed_mins: 0 });
  const conDetalle = real({ awakenings: 0, wake_in_bed_mins: 0,
    awakening_detail: JSON.stringify([{ time: '02:10', duration: 35 },
                                      { time: '04:30', duration: 28 }]) });
  r.ok(soloColumnas === 100, 'columnas en cero: 100 %', soloColumnas + '%');
  r.ok(conDetalle < 60,
       'pero con dos despertares largos en awakening_detail ya no', conDetalle + '%');
  // Y al revés: el detalle no puede MEJORAR una noche mala.
  const peorGana = real({ awakenings: 4, wake_in_bed_mins: 90,
                          awakening_detail: JSON.stringify([{ time: '03:00', duration: 2 }]) });
  r.ok(peorGana <= real({ awakenings: 4, wake_in_bed_mins: 90 }),
       'y un detalle pobre no puede blanquear lo que dicen las columnas');
}

r.seccion('Lo que esto arregla aguas abajo:');

// El pilar entra en el score compuesto de la pantalla, así que el error
// no se quedaba en la tarjeta.
r.ok(/pilar_fragmentacion/.test(app),
     'la fragmentación viaja al informe y al score, no es solo una tarjeta');

r.cerrar('Un pilar que dice "muy bien" sobre una hora despierto es peor que no tener el pilar.');
