// Paciente Higgins, 22-sep-2026. La misma tarjeta mostraba dos eficiencias
// distintas: 83% en la celda y 87% tres centímetros más abajo, en la
// orientación clínica, las dos rotuladas "últimas 14 noches".
//
// La causa: el motor armaba DOS ventanas con criterios distintos.
//
//   dmMotorOrientacion   → diaryEntries.slice(0, 14)          (sin filtrar)
//   dmCalcularEvolucion  → filtra sleep_minutes y DESPUÉS corta
//
// Con una noche sin horarios entre las 14 últimas, la segunda alcanza una
// 15.ª noche más vieja y la primera se queda con 13. Dos ventanas, dos
// promedios, un solo rótulo.
//
// Esta prueba fija que la ventana se define una sola vez.

const C = require('./comun');
const r = C.crearReporte('Una sola ventana clínica');

const fs = require('fs');
const path = require('path');
const leer = f => fs.readFileSync(path.join(C.RAIZ, f), 'utf8');
const motor = leer('js/dormetria-motor-orientacion.js');
const render = leer('js/dormetria-render-resumen.js');

r.seccion('El motor define la ventana una sola vez:');

r.ok(/const diaryOrdenado = \(diaryEntries \|\| \[\]\)/.test(motor),
     'hay una lista ordenada y filtrada, explícita');
r.ok(/\.filter\(e => e && e\.diary_date && e\.sleep_minutes\)/.test(motor),
     'el criterio de noche útil es tener sueño registrado');
r.ok(/\.sort\(\(a, b\) => new Date\(b\.diary_date\) - new Date\(a\.diary_date\)\)/.test(motor),
     'y ordena acá, sin confiar en el order= de la consulta');
r.ok(/const diarySlice = diaryOrdenado\.slice\(0, 14\)/.test(motor),
     'la ventana sale de esa lista');
r.ok(/dmCalcularEvolucion\(diaryOrdenado\)/.test(motor),
     'y la evolución recibe la MISMA lista, no diaryEntries crudo');
// Ojo: la declaración de la función también se llama así. Lo que no puede
// existir es la LLAMADA con la lista cruda.
r.ok(!/=\s*dmCalcularEvolucion\(diaryEntries\)/.test(motor),
     'ya no se le pasa la lista sin ordenar');

r.seccion('Se puede decir de qué noches habla:');

r.ok(/result\.nochesDescartadas/.test(motor), 'cuántas quedaron afuera');
r.ok(/result\.ventanaDesde/.test(motor) && /result\.ventanaHasta/.test(motor),
     'y entre qué fechas está la ventana');
r.ok(/noches analizadas/.test(render),
     'el rótulo dice "analizadas", no "registradas" — no son lo mismo');
r.ok(/sin horarios, fuera del cálculo/.test(render),
     'y explica por qué la muestra es más chica que el total');

r.seccion('Una sola fuente para la eficiencia:');

r.ok(/celda\('Eficiencia', num\(met\.eficiencia, '%'\)/.test(render),
     'la celda usa met.eficiencia, igual que las otras cuatro');
r.ok(!/num\(e \? e\.actual : met\.eficiencia/.test(render),
     'ya no muestra la cifra de otra ventana');

r.seccion('Y el selector de período no se ignora en silencio:');

const html = C.leerHtml();
r.ok(/_drPeriodoIgnorado/.test(html),
     'queda anotado cuando la ventana elegida no alcanzaba');
r.ok(/function dmAvisoPeriodoIgnorado\(/.test(html),
     'y hay un cartel que lo dice');
r.ok(/Estás viendo todo el historial, no los últimos/.test(html),
     'el cartel nombra el problema, no lo insinúa');
r.ok(/El último registro es del/.test(html),
     'y dice de cuándo es el último dato, que es la pregunta siguiente');

r.seccion('El rótulo de la comparación corta dice lo que mide:');

r.ok(/Evolución · últimas 7 noches vs 7 anteriores/.test(html),
     'son noches registradas, no días');
r.ok(!/Evolución · últimos 7 días vs 7 anteriores/.test(html),
     'el rótulo viejo prometía días y contaba registros');

r.seccion('Las banderas dicen de cuándo es el puntaje:');

r.ok(/fecha: fechaDe\('phq9'\)/.test(motor), 'el PHQ-9 lleva su fecha');
r.ok(/fecha: fechaDe\('stopbang'\)/.test(motor), 'el STOP-BANG también');
r.ok(/fecha: fechaDe\('ess'\)/.test(motor), 'y el Epworth');
r.ok(/conviene repetirla/.test(render),
     'y una escala de más de 90 días se marca como vieja');

r.cerrar('Dos números distintos bajo el mismo rótulo no es un detalle de diseño.');
