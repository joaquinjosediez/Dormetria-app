// "El score debería integrar algo de la calidad subjetiva. Un score alto
//  que el paciente no se identifica no está bueno."
//
// La objeción que hice y que quedó registrada acá porque es lo que se
// pierde: al promediar lo medido con lo percibido, una percepción muy mala
// sobre un sueño objetivamente normal —insomnio paradójico, ICSD-3— deja
// de distinguirse de un sueño intermedio. Y lo inverso, buena percepción
// sobre sueño fragmentado, es el patrón de los cuadros respiratorios.
//
// Se decidió mezclar igual, porque un número que el paciente no reconoce
// le hace perder la confianza y el que no le cree deja de registrar. La
// discordancia se conserva: se calcula, se dibuja y se informa APARTE.
// Lo que ya no hace es mover el número.
//
// ── Lo que había antes, y era peor que cualquiera de las dos opciones ──
//
//   · Una CUARTA copia del cálculo de fragmentación (`20 - despertares*4`,
//     sin WASO) sólo para el número grande. mod280 unificó las tres de las
//     tarjetas y dejó ésta: el score y la tarjeta de FRAGMENTACIÓN podían
//     no hablar de lo mismo.
//   · La calidad subjetiva YA estaba adentro del score, escondida: un `+2`
//     si era ≥4 y un `-3` si era ≤2, metidos dentro de la fragmentación,
//     sin documentar y sin justificación.
//   · `nightScores[].total` hacía `s.qty + s.qual` con `s.qual` inexistente:
//     NaN en todas las noches. No se usaba, pero devolver NaN es invitar a
//     que alguien lo use.

const C = require('./comun');
const vm = require('vm');
const r = C.crearReporte('El score y lo que la persona siente');

const app = C.leerApp();
const css = C.leerCss();

r.seccion('Los pesos están declarados y suman 100:');

r.ok(/const PESOS = \{ qty:40, qual:20, reg:25, frag:15 \};/.test(app),
     'Cantidad 40 · Calidad 20 · Regularidad 25 · Fragmentación 15');
// Por qué 20 y no 30 ni 10, que es la pregunta que se va a volver a hacer.
r.ok(/El insomnio se define por la QUEJA/.test(app),
     'con el fundamento: ni la ICSD-3 ni el DSM-5 tienen criterio objetivo');
r.ok(/El ISI y el\s*\n?\s*\/\/\s*PSQI/.test(app) || /ISI y el/.test(app),
     'y que las medidas de resultado del campo son autoinforme');
r.ok(/Por eso 20 y no 30/.test(app) && /20 y no 10/.test(app),
     'y por qué ese peso y no otro');
// Lo que se pierde, escrito donde está el código que lo pierde.
r.ok(/LO QUE SE PIERDE, dicho para que no se olvide/.test(app),
     'y lo que se pierde al mezclar queda escrito');

r.seccion('Se fue lo que estaba escondido:');

r.ok(!/if\(e\.sleep_quality && e\.sleep_quality >= 4\) frag = Math\.min\(20, frag\+2\)/.test(app),
     'el +2 oculto dentro de la fragmentación');
r.ok(!/frag = Math\.max\(0, frag-3\)/.test(app), 'y el −3');
r.ok(/const qual = \(_q >= 1 && _q <= 5\) \? \(_q - 1\) \* 5 : null;/.test(app),
     'la calidad es ahora un componente propio, 1→0 … 5→20');
r.ok(/CUARTA copia del cálculo de fragmentación/.test(app),
     'y queda escrito que había una cuarta copia');
r.ok(/dmFragPuntos\(e\) \* 15 \/ 20/.test(app),
     'que ahora usa la función compartida');

r.seccion('Sin dato no se rellena con un neutro:');

// Rellenar movería el puntaje igual y nadie sabría que una parte salió de
// un relleno. Se reparte el peso entre los componentes que sí tienen dato.
r.ok(/Rellenarlo con un neutro movería el puntaje igual/.test(app),
     'el peso se reparte entre los que sí tienen dato');
r.ok(/_num \+= _n01\[k\] \* PESOS\[k\];\s*\n\s*_den \+= PESOS\[k\];/.test(app),
     'con el denominador acompañando');

r.seccion('El gráfico: tres carriles, mismo grosor, misma escala:');

r.ok(/function dmScoreGrafico\(sc, pro\)\{/.test(app), 'dmScoreGrafico');
// La primera versión los superponía en un solo carril y fallaba justo
// cuando la brecha era máxima.
r.ok(/fallaba justo en el\s*\n\/\/ caso que importa/.test(app),
     'con el motivo de por qué no van superpuestos en un solo carril');
r.ok(/\.dm-sg-carril\{[^}]*height:17px/.test(css.replace(/\s+/g, m => m.includes('\n') ? '\n' : ' ')) ||
     /height:17px/.test(css),
     'los carriles miden 17px');
// El del score era más fino y el ojo lo leía como menos importante.
r.ok(/LOS TRES CARRILES MIDEN LO MISMO/.test(css),
     'y los tres el mismo, incluido el del score');
r.ok(!/\.dm-sg-carril" style="height:10px/.test(app),
     'sin excepción para el carril del score');

r.seccion('Los rótulos de peso, centrados sobre su tramo:');

r.ok(/\.dm-sg-pl div\{[\s\S]{0,120}text-align:center/.test(css), 'van centrados');
r.ok(/'<div style="width:'\+P\[t\.k\]\+'%">'\+t\.rot\+'<br><b>'\+P\[t\.k\]\+'%<\/b><\/div>'/.test(app),
     'y cada uno ocupa exactamente el ancho de su tramo');
// "Fragmentación" no entra en un tramo del 15 % y se cortaba en "Fragmentac".
r.ok(/\{ k:'frag', rot:'Fragm\.',/.test(app),
     'y el que no entraba va abreviado, no cortado');
r.ok(/overflow-wrap:break-word/.test(css),
     'y "Calidad subjetiva" envuelve en vez de recortarse');

r.seccion('Dos registros, una sola función:');

r.ok(/Si fueran dos\s*\n\/\/ funciones, un día el paciente y su profesional/.test(app),
     'el mismo gráfico para los dos, sólo cambian las palabras');
r.ok(/pro \? 'Concordancia objetivo/.test(app), 'el título cambia');
r.ok(/pro \? 'Calidad subjetiva' : 'Cómo lo sentiste'/.test(app), 'y el rótulo del carril');
r.ok(/insomnio paradójico se define/.test(app),
     'al profesional se le nombra el insomnio paradójico');
r.ok(/STOP-BANG y Epworth/.test(app), 'y qué escalas mirar');
r.ok(/Hay cosas que/.test(app) && /no se notan desde adentro/.test(app),
     'y al paciente se le explica en su idioma');
r.ok(/dmScoreGrafico\(sc, _claro\)/.test(app),
     'y el panel lo llama con la audiencia que ya tenía');

r.seccion('Corriendo el motor:');

const ctx = C.appEvaluada();
r.ok(!!ctx, 'la app se evalúa entera');
if (ctx) {
  const serie = function (n, tst, q, awk, waso) {
    const o = [];
    for (let i = 0; i < n; i++) {
      o.push({ diary_date: new Date(Date.UTC(2026, 9, 1 + i)).toISOString().slice(0, 10),
        bedtime: '23:30', wake_time: '07:30', get_up_time: '07:40',
        sleep_minutes: tst, sleep_latency_mins: 10, awakenings: awk,
        wake_in_bed_mins: waso, sleep_quality: q, day_type: 'work' });
    }
    return o;
  };
  const sc = function (e) { ctx.__e = e; return vm.runInContext('calcSleepScore(__e, 40)', ctx); };

  const bienBien = sc(serie(14, 470, 5, 0, 0));
  const bienMal  = sc(serie(14, 470, 1, 0, 0));
  r.ok(bienBien.total > bienMal.total,
       'la calidad mueve el número, que era el pedido',
       bienBien.total + ' vs ' + bienMal.total);
  // 20 % de peso: la diferencia entre la mejor y la peor calificación
  // posible son 20 puntos. Ni más —sería una carita decidiendo el score—
  // ni menos —el paciente seguiría sin reconocerse—.
  r.ok((bienBien.total - bienMal.total) === 20,
       'y lo mueve exactamente 20 puntos de punta a punta',
       String(bienBien.total - bienMal.total));

  r.ok(bienMal.objetivo === 100 && bienMal.percibido === 0,
       'lo medido y lo percibido se informan por separado');
  r.ok(bienMal.brecha === -100, 'con la brecha calculada', String(bienMal.brecha));
  const malBien = sc(serie(14, 330, 5, 4, 70));
  r.ok(malBien.brecha > 0, 'y con signo: positivo si percibe mejor de lo que mide',
       String(malBien.brecha));

  const sinQ = sc(serie(14, 470, null, 0, 0));
  r.ok(sinQ.percibido === null, 'sin calidad contestada no se inventa un valor');
  r.ok(sinQ.total === sinQ.objetivo,
       'y el score se renormaliza sobre los otros tres',
       sinQ.total + ' / ' + sinQ.objetivo);

  // El NaN que devolvía antes en todas las noches.
  r.ok(bienBien.nightScores.every(function (n) { return n.total === null || !isNaN(n.total); }),
       'y el puntaje por noche ya no es NaN');

  // El gráfico se dibuja con los dos registros sin romperse.
  ctx.__sc = bienMal;
  const gPac = vm.runInContext('dmScoreGrafico(__sc, false)', ctx);
  const gPro = vm.runInContext('dmScoreGrafico(__sc, true)', ctx);
  r.ok(/Cómo lo sentiste/.test(gPac) && !/paradójico/.test(gPac),
       'al paciente no se le tira un diagnóstico encima');
  r.ok(/Calidad subjetiva/.test(gPro) && /paradójico/.test(gPro),
       'y al profesional sí se le nombra el cuadro');
  // Bajo 25 puntos la diferencia entra en el ruido de una carita diaria.
  ctx.__sc2 = { total: 80, objetivo: 80, percibido: 90, brecha: 10, pesos: bienMal.pesos };
  r.ok(/dm-sg-ok/.test(vm.runInContext('dmScoreGrafico(__sc2, false)', ctx)),
       'y una brecha chica se informa como concordancia, no como hallazgo');
}

r.cerrar('Mezclar hace el número más creíble y menos informativo: por eso la discordancia se conserva aparte.');

// ── La tarjeta del lado del paciente ──────────────────────────────────
// Era la excepción en toda la app: un recuadro casi blanco con el número
// en verde, en medio de una pantalla verde oscuro. Los colores de
// calcSleepScore están pensados para fondo claro —del lado del
// profesional siguen igual— y para el paciente se traducen con dmClaro,
// que es lo que el resto de la app ya venía haciendo.
const rt = C.crearReporte('La tarjeta del score, del lado del paciente');
rt.seccion('Verde oscuro con texto claro, como todo lo demás:');
rt.ok(/background:\$\{_claro \? sc\.bg : 'rgba\(255,255,255,0\.05\)'\}/.test(app),
      'el fondo se invierte según la audiencia');
rt.ok(/color:\$\{_claro \? sc\.color : dmClaro\(sc\.color\)\}/.test(app),
      'y el color del número pasa por dmClaro');
rt.ok((app.match(/_claro \? sc\.color : dmClaro\(sc\.color\)/g) || []).length >= 3,
      'en el rótulo, el número y la etiqueta');
rt.seccion('Y los colores del score están en la tabla:');
if (ctx) {
  // dmClaro busca la clave en MINÚSCULAS. Con las mayúsculas que devuelve
  // calcSleepScore el lookup fallaba en silencio y devolvía el color
  // original: el 54 salía en naranja puro sobre verde oscuro. Una tabla de
  // traducción que no traduce y no se queja es peor que no tenerla.
  [['#34C759','#5ee08a'],['#1a4a3a','#7ec8a4'],['#FF9500','#fbbf24'],
   ['#FF6B00','#fdba74'],['#FF3B30','#ff9d9d']].forEach(function (par) {
    ctx.__c = par[0];
    const got = vm.runInContext('dmClaro(__c)', ctx);
    rt.ok(got === par[1], '  ' + par[0] + ' → ' + par[1], got === par[1] ? '' : 'dio ' + got);
  });
  // El que se escapaba: las cinco bandas del score tienen que traducirse.
  const sinTraducir = ['#34C759','#1a4a3a','#FF9500','#FF6B00','#FF3B30']
    .filter(function (c) { ctx.__c = c; return vm.runInContext('dmClaro(__c)', ctx) === c; });
  rt.ok(sinTraducir.length === 0,
        'ninguna banda del score se queda con su color de fondo claro',
        sinTraducir.join(' '));
}
rt.cerrar('Una tabla de traducción que no traduce y no se queja es peor que no tenerla.');
