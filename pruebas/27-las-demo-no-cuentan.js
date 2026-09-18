// Las cinco cuentas de ejemplo se siembran en el panel de CADA profesional
// (mod191) y tienen semanas de diario cargadas a la perfección. Mientras
// entraron en las cuentas, estuvieron inflando todo:
//
//   · la adherencia del profesional — cinco pacientes que no son suyos y que
//     registran todas las noches;
//   · el conteo "Pacientes" y las columnas Activaron / 14+ noches del panel
//     de administración;
//   · los activos de 7 y 30 días de las Estadísticas de plataforma, que es
//     justo la métrica que uno mira para saber si la app se usa de verdad.
//
// Una definición sola de "cuenta de prueba", usada en todos lados.

const C = require('./comun');
const r = C.crearReporte('Las demo no cuentan');

const html = C.leerHtml();

r.seccion('Una sola definición:');

r.ok(/function dmEsCuentaDemo\(p, doctores\)/.test(html), 'existe el helper');
const h = html.slice(html.indexOf('function dmEsCuentaDemo'),
                     html.indexOf('window.dmEsCuentaDemo'));
r.ok(/p\.is_demo === true/.test(h), 'mira la marca explícita de la base');
r.ok(/@dormetria\\\.com\$/.test(h), 'el dominio de las cuentas de ejemplo');
r.ok(/demo@dormetria\\\.com\$/.test(h), 'y el profesional demo');
r.ok(/const esDemo = r => dmEsCuentaDemo\(r\);/.test(html),
     'el panel de administración usa ese mismo helper, no una copia');

r.seccion('Fuera de la adherencia del profesional:');

r.ok(/const rows=\(pats\|\|\[\]\)\.filter\(p=>!dmEsCuentaDemo\(p\)\)\.map/.test(html),
     'se filtran antes de calcular nada');
r.ok(/weight_kg,auth_id,code,is_demo/.test(html),
     'y la consulta trae is_demo para poder hacerlo');

r.seccion('Fuera del panel de administración:');

const bloqueDoc = html.slice(html.indexOf("tab==='doctors'"),
                             html.indexOf("tab==='doctors'") + 2600);
r.ok(/_admDemoEmails = _set/.test(bloqueDoc), 'se arma la lista de correos demo');
// Se calculaba DESPUÉS de contar los pacientes: el conteo salía con el set
// todavía vacío y no descontaba nada.
r.ok(bloqueDoc.indexOf('_admDemoEmails = _set') <
     bloqueDoc.indexOf('doctor_patients?select=doctor_email,patient_email'),
     'y se arma ANTES de contar, que es lo que estaba al revés');
r.ok(/if\(!_esDemoPac\) _c\[k\] = \(_c\[k\]\|\|0\) \+ 1/.test(html),
     'el conteo de pacientes las descuenta');
r.ok(/\.filter\(function\(p\)\{ return !_demoSet\[p\]; \}\)/.test(html),
     'y las columnas de cartera también');

r.seccion('Fuera de las estadísticas de plataforma:');

r.ok(/allPts    = \(allPts\|\|\[\]\)\.filter/.test(html), 'se filtran los pacientes');
r.ok(/diaryRows = \(diaryRows\|\|\[\]\)\.filter/.test(html), 'las noches');
r.ok(/evalRows  = \(evalRows\|\|\[\]\)\.filter/.test(html), 'y las escalas');
r.ok(/let \[allPts, allDrs, diaryRows, evalRows, suggRows\]/.test(html),
     'declaradas con let, si no la reasignación tira un error en silencio');

r.seccion('Y no molestan en la tabla:');

r.ok(/if\(window\._admSinDemo === undefined\) window\._admSinDemo = true;/.test(html),
     'arrancan ocultas');

r.seccion('El encabezado de las tablas no se va:');

const css = C.leerCss();
r.ok(/\.dm-tabla-fija\{/.test(css.replace(/\s+/g,'')) || /\.dm-tabla-fija\s*\{/.test(css),
     'existe el contenedor');
r.ok(/position:sticky;top:0/.test(css.replace(/\s+/g,'')),
     'con el encabezado pegado arriba');
r.ok(!/<div style="overflow-x:auto"><table/.test(html),
     'y ninguna tabla quedó con el contenedor viejo');

r.seccion('Los pacientes compartidos se pueden ver por profesional:');

r.ok(/_admDoctorFiltro/.test(html), 'hay filtro por profesional');
const bloqueFil = html.slice(html.indexOf('if(window._admDoctorFiltro){'),
                             html.indexOf('if(window._admDoctorFiltro){') + 400);
r.ok(/\(r\.doctors\|\|\[\]\)\.some\(/.test(bloqueFil),
     'un paciente compartido entra en la cartera de los dos, no solo del primero');

r.cerrar('Cinco pacientes de ejemplo que registran perfecto, en cada panel, mueven cualquier promedio.');
