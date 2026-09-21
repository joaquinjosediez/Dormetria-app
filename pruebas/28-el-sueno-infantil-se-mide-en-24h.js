// Un lactante de 9 meses aparecía con el pilar de CANTIDAD en 4% y el score
// en "Deficiente" con un sueño perfectamente normal.
//
// Dos causas encimadas:
//
// 1. La vista del PROFESIONAL medía solo el sueño nocturno. Antes de los 6
//    años la siesta no es un extra: es parte del sueño de 24 h, y así lo
//    definen las dos recomendaciones. Un bebé que duerme 11 h de noche y 3 h
//    de siestas queda 5 h por debajo de su rango si se mide solo la noche.
//    El score del propio paciente (computePillarScore) ya sumaba las siestas;
//    la del profesional no. Dos caminos, dos respuestas distintas.
//
// 2. El rango se elegía por AÑOS cumplidos. Un bebé de 2 meses y uno de 11
//    caen los dos en "0 años" y compartían rango — y los rangos son
//    distintos (14–17 h contra 12–15 h). Encima el cartel decía "para 0 años".
//
// Y de paso: el comentario del código citaba NSF 2015 pero los valores eran
// los de la AASM 2016.

const C = require('./comun');
const fs = require('fs');
const path = require('path');
const r = C.crearReporte('El sueño infantil se mide en 24 h');

const html = C.leerHtml();
const metrics = fs.readFileSync(
  path.join(__dirname, '..', 'js', 'dormetria-sleep-metrics.js'), 'utf8');
eval(metrics);

r.seccion('Los rangos son los de la NSF y van por meses:');

const casos = [
  [ 2, 14, 17, '2 meses'],
  [ 9, 12, 15, '9 meses'],
  [18, 11, 14, '18 meses'],
  [24, 11, 14, '2 años'],
  [48, 10, 13, '4 años'],
  [96,  9, 11, '8 años'],
];
casos.forEach(function(c){
  const b = rangoSuenoPorMeses(c[0]);
  r.ok(b.lo === c[1] && b.hi === c[2],
       c[3] + ' → ' + c[1] + '–' + c[2] + ' h', b.lo + '–' + b.hi);
});

// El que importa: dos bebés que antes compartían "0 años".
r.ok(rangoSuenoPorMeses(2).lo !== rangoSuenoPorMeses(9).lo,
     'un bebé de 2 meses y uno de 9 ya no comparten rango');

r.ok(/NSF 2015/.test(metrics) && /Hirshkowitz/.test(metrics),
     'la referencia está citada');
r.ok(/Paruthi/.test(metrics),
     'y también la de la AASM, donde difiere');
r.ok(rangoSuenoPorMeses(9).aasm != null,
     'en lactantes se guarda el rango de la AASM aparte, que no coincide');

r.seccion('La edad se dice como se habla:');

r.ok(etiquetaEdad(9) === '9 meses', '"9 meses", no "0 años"', etiquetaEdad(9));
r.ok(etiquetaEdad(1) === '1 mes', 'singular en el primer mes', etiquetaEdad(1));
r.ok(etiquetaEdad(24) === '2 años', 'y a partir de los dos, en años', etiquetaEdad(24));
r.ok(!/\(para '\+_ageForPillar\+' años\)/.test(html),
     'el cartel ya no arma la edad con los años crudos');

r.seccion('Antes de los 6 años se cuenta el sueño de 24 h:');

r.ok(/const _ped24 = \(_ageForPillar!=null && _ageForPillar<6\)/.test(html),
     'la vista del profesional distingue la franja pediátrica');
const bloque24 = html.slice(html.indexOf('const _minutos24 = function(e)'),
                            html.indexOf('const _minutos24 = function(e)') + 700);
r.ok(/parseChildNaps\(e\)/.test(bloque24), 'suma las siestas del detalle');
r.ok(/e\.nap_minutes>0/.test(bloque24), 'y el total suelto si no hay detalle');
r.ok(/hrs=_minutos24\(e\)\/60/.test(html.replace(/\s/g,'')),
     'y el pilar puntúa sobre eso, no sobre la noche sola');
r.ok(/siestas incluidas/.test(html),
     'el cartel dice que el rango es de 24 h con siestas');

r.seccion('El puntaje da lo que tiene que dar:');

// Lactante de 9 meses: 10,8 h de noche + 2,8 h de siestas = 13,6 h.
const noche = 10.8, siestas = 2.8;
r.ok(qtyScoreForMeses(noche + siestas, 9) === 50,
     'con las siestas, un lactante normal puntúa completo',
     qtyScoreForMeses(noche + siestas, 9) + '/50');
r.ok(qtyScoreForMeses(noche, 9) < 35,
     'y sin ellas se lo castiga, que es lo que pasaba',
     qtyScoreForMeses(noche, 9) + '/50');

// Preescolar de 2 años: 11 h de noche + 1,5 h de siesta.
r.ok(qtyScoreForMeses(11 + 1.5, 24) === 50,
     'lo mismo con un preescolar de 2 años y su siesta de tarde');

r.seccion('El score no se calcula con el rango de un adulto:');

// La mitad de las llamadas a calcSleepScore omitía la edad, y sin edad el
// score caía al rango del adulto (7-9 h): un bebé normal daba "Deficiente".
const bloqueScore = html.slice(html.indexOf('function calcSleepScore(entries, ageYears){'),
                               html.indexOf('function calcSleepScore(entries, ageYears){') + 1800);
r.ok(/if\(ageYears == null\)\{/.test(bloqueScore.replace(/\s/g,'')) ||
     /if\(ageYears == null\)\s*\{/.test(bloqueScore),
     'si no se la pasan, la toma del paciente que se está mirando');
r.ok(/edadAniosExacta\(_dob\)/.test(bloqueScore),
     'y en años con decimales, no floor — que manda todo el primer año a "0"');
r.ok(/const _ped24 = \(ageYears != null && ageYears < 6\)/.test(bloqueScore),
     'antes de los 6 suma las siestas');

r.ok(/function edadAniosExacta/.test(metrics), 'existe el cálculo de edad con decimales');
// Un 0 entero no puede distinguir 2 meses de 11: se elige el rango que cubre
// la mayor parte del primer año y se marca como impreciso.
r.ok(optimalSleepHours(0).impreciso === true,
     'un "0 años" entero se marca como impreciso en vez de fingir precisión');
r.ok(optimalSleepHours(0.17).lo === 14, 'con decimales sí distingue a un bebé de 2 meses');

r.seccion('La explicación del score habla de la edad que corresponde:');

r.ok(!/Lo óptimo está entre 7 y 9 horas/.test(html),
     'ya no dice "7 a 9 horas" en la ficha de un bebé');
r.ok(/Lo esperable/.test(html) && /optimalSleepHours\(ageYears\)/.test(html),
     'el rango sale de la edad');
r.ok(/en 24 horas, contando las siestas/.test(html),
     'y en menores de 6 aclara que es de 24 h');
r.ok(/se informa pero no puntúa/.test(html),
     'en chicos explica que la fragmentación no puntúa');
r.ok(/jet lag social/.test(html),
     'y que la regularidad se mide por jet lag social');

r.seccion('El actograma dibuja todas las siestas:');

r.ok(/const napsPorNoche=sorted\.map/.test(html),
     'se recolectan todas, no solo la primera');
r.ok(/_maxNaps/.test(html),
     'y se arma un dataset por cada posición de siesta');
const bloqueDr = html.slice(html.indexOf('const drNapBars=sorted.map'),
                            html.indexOf('const drNapBars=sorted.map') + 900);
r.ok(/if\(!salidas\.length && e\.nap_start/.test(bloqueDr),
     'en la vista del profesional el detalle manda sobre las columnas');
// Empujar los dos daba tres barras: las dos reales más una falsa que duraba
// lo que las dos juntas.
r.ok(bloqueDr.indexOf('Siestas:') < bloqueDr.indexOf('e.nap_start'),
     'y ya no se suman las dos fuentes a la vez');

r.cerrar('La siesta de un lactante no es un extra: es la mitad de por qué su sueño alcanza.');
