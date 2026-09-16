// Dos cosas que faltaban del lado del paciente y del profesional.
//
// 1. La lista de medicamentos es fija y no cubre lo que de verdad toma la
//    gente. La progesterona, por ejemplo, no entra en ninguna categoría y en
//    menopausia es frecuente que ayude a dormir. Había una función
//    addCustomMed(), pero sus campos vivían en un modal viejo que ya no se
//    abre: desde el selector actual no había forma de agregar nada.
//
// 2. Las tres tarjetas de pilares se armaban con estilos en línea y cada una
//    medía lo que medía su contenido. "REGULARIDAD" ocupa dos renglones donde
//    "CANTIDAD" ocupa uno, así que su número y su estado caían más abajo. Y
//    encima el overflow-wrap:anywhere del contenedor la partía por la mitad:
//    "REGU / LARI / DAD".

const C = require('./comun');
const r = C.crearReporte('Medicación y pilares');

const html = C.leerHtml();
const css = C.leerCss();

r.seccion('Se puede agregar un medicamento que no está en la lista:');

r.ok(/function dmAgregarMedOtro/.test(html), 'existe la función');
r.ok(/id="med-otro-nombre"/.test(html) && /id="med-otro-dosis"/.test(html),
     'y los campos viven en el selector que se usa hoy');

const bloqueOtro = html.slice(html.indexOf('function dmAgregarMedOtro'),
                              html.indexOf('window.dmAgregarMedOtro'));
r.ok(/toLowerCase\(\) === nombre\.toLowerCase\(\)/.test(bloqueOtro),
     'no duplica si ya estaba: actualiza la dosis');
r.ok(/_medModalMeds\.push/.test(bloqueOtro),
     'y lo guarda donde lo lee el diario');

const bloqueRender = html.slice(html.indexOf('function renderMedInline()'),
                                html.indexOf('function dmAgregarMedOtro'));
r.ok(/_nPrev/.test(bloqueRender) && /_dPrev/.test(bloqueRender),
     'lo tipeado sobrevive al re-render que dispara cada pastilla');

r.seccion('Los tres pilares quedan parejos:');

r.ok(/class="dm-pil-card"/.test(html), 'las tarjetas tienen clase propia');
r.ok(/class="dm-pil-grid"/.test(html), 'y la grilla también');
r.ok(/dm-pil-rot/.test(html) && /dm-pil-pie/.test(html),
     'el rótulo y el pie se pueden alinear entre tarjetas');

const plano = css.replace(/\s+/g, '');
r.ok(/\.dm-pil-grid\{[^}]*repeat\(3,minmax\(0,1fr\)\)/.test(plano),
     'minmax(0,1fr): ninguna columna se ensancha por su palabra más larga');
r.ok(/\.dm-pil-rot\{[^}]*min-height:2\.5em/.test(plano),
     'el rótulo reserva dos renglones, entren uno o dos');
r.ok(/\.dm-pil-pie\{[^}]*margin-top:auto/.test(plano),
     'y el pie se apoya abajo, así queda a la misma altura en las tres');

r.seccion('Y ninguna palabra se corta por la mitad:');

const bloquePillar = css.slice(css.indexOf('#diary-pillar-bars > div > div'),
                               css.indexOf('#diary-pillar-bars > div > div') + 300);
r.ok(!/overflow-wrap:anywhere/.test(bloquePillar),
     'el contenedor viejo ya no usa anywhere');
r.ok(/hyphens:none/.test(plano.replace(/;/g,';')) || /hyphens:none/.test(css),
     'y las tarjetas nuevas no guionan');

r.cerrar('Una lista cerrada de medicamentos hace desaparecer lo que el paciente toma.');
