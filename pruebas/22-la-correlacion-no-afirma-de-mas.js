// El panel "Percepción vs. lo medido" mostraba tres números de correlación y
// les ponía un adjetivo a cada uno, sin decir sobre cuántas noches ni con qué
// margen. En un caso real: "acompaña algo a los despertares (+0,35)" sobre
// 13 noches. Con n=13, el intervalo de confianza de r=0,35 va de −0,25 a
// +0,76: incluye el cero, así que el signo ni siquiera está establecido.
//
// Llamativo porque el panel de hábitos, que está justo al lado, sí es
// cuidadoso: t de Welch, p<0,05, mínimo de noches por grupo y marca de
// "preliminar". Dos tablas contiguas con dos varas distintas.
//
// Y había un problema anterior a la estadística: los rótulos no nombraban lo
// que se estaba correlacionando.

const C = require('./comun');
const r = C.crearReporte('La correlación no afirma de más');

const html = C.leerHtml();

r.seccion('Se correlaciona lo que el rótulo dice:');

const bloque = html.slice(html.indexOf('const _pearson=(xs,ys)=>{'),
                          html.indexOf('const _cEl=document.getElementById'));

r.ok(/e\.sleep_minutes!=null&&e\.sleep_minutes>0\)\?e\.sleep_minutes\/60/.test(bloque.replace(/\s/g,'')) ||
     /_horas=sorted\.map/.test(bloque),
     '"las horas que durmió" son horas, no el puntaje de cantidad');
r.ok(/_desp\s*=sorted\.map/.test(bloque),
     '"los despertares" son la cuenta de despertares, no un puntaje invertido');
r.ok(!/_pearson\(_qual,pillarData\.map\(p=>p\.qty\)\)/.test(bloque),
     'ya no se usa el puntaje de cantidad, que no es monótono');
r.ok(!/_pearson\(_qual,pillarData\.map\(p=>p\.frag\)\)/.test(bloque),
     'ni el de fragmentación, donde más alto quería decir menos despertares');

r.seccion('Cada r viene con su intervalo:');

r.ok(/Math\.atanh\(r\)/.test(bloque), 'se calcula por la z de Fisher');
r.ok(/1\/Math\.sqrt\(n-3\)/.test(bloque), 'con el error estándar que corresponde');
r.ok(/firme:\(lo>0 \|\| hi<0\)/.test(bloque),
     'y "firme" es exactamente que el intervalo no cruce el cero');
r.ok(/if\(n<10\) return null/.test(bloque),
     'con menos de 10 pares no se calcula nada');

r.seccion('Y no se afirma lo que el intervalo no sostiene:');

const lectura = html.slice(html.indexOf('const _frase=function'),
                           html.indexOf('const _frase=function') + 1100);
r.ok(/if\(!v\.firme\) return 'no alcanza para decir nada sobre '/.test(lectura),
     'si el intervalo cruza el cero, lo dice en vez de poner un adjetivo');
r.ok(/const acorde = \(v\.r>0\) === \(esperado>0\)/.test(lectura),
     'compara contra el signo esperado de cada variable');

// Más despertares debería ir con PEOR calidad: el esperado es negativo. Sin
// esto, una r negativa ahí se leería como hallazgo cuando es lo normal.
r.ok(/_frase\(_rFrag, 'los despertares',      -1\)/.test(html),
     'en despertares el signo esperado es negativo');
r.ok(/_frase\(_rQty,  'las horas que durmió', \+1\)/.test(html),
     'en horas dormidas, positivo');

r.seccion('La discordancia se marca solo si está establecida:');

const nota = html.slice(html.indexOf('const _discorda ='),
                        html.indexOf('const _discorda =') + 500);
r.ok(/_rQty\.firme/.test(nota) && /_rFrag\.firme/.test(nota) && /_rReg\.firme/.test(nota),
     'las tres condiciones exigen intervalo que no cruce el cero');
r.ok(/insomnio paradójico/.test(html),
     'y ahí sí aparece la lectura clínica');
r.ok(/todavía no hay con qué afirmarlo/.test(html),
     'cuando nada queda establecido, se dice que faltan noches, no que no hay relación');

r.cerrar('Con 13 noches, un r de 0,35 va de −0,25 a +0,76: no se puede decir ni el signo.');
