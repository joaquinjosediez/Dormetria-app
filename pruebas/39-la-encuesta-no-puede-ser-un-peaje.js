// En la fase de prueba, cerrar una semana pide dos preguntas: si sirvió y
// cuánto costó sostenerlo. Y al cerrar la primera se suma el sondeo de
// precio, que es lo que abre la semana 2.
//
// Acá hay una línea que no se puede cruzar, y está escrita en el propio
// código del alta: "un consentimiento no voluntario no es válido ni para
// la ley de datos ni para un comité".
//
// Por eso la distinción:
//   · FEEDBACK DEL PRODUCTO (¿te sirvió? ¿cuánto te costó?) → se puede
//     pedir: es el precio razonable de una beta gratuita.
//   · TODO LO DEMÁS (cuánto pagarías, comentarios libres) → salteable.
//     Condicionar el acceso al tratamiento a entregar eso sería el peaje
//     que no corresponde.
//
// Y con profesional NO se pide nada: ahí el seguimiento se hace en
// consulta, y meterle un formulario en el medio del tratamiento sobra.

const C = require('./comun');
const r = C.crearReporte('La encuesta no puede ser un peaje');

const html = C.leerHtml();

r.seccion('Las dos preguntas que definen si el programa sirve:');

const i = html.indexOf('const DM_TCCI_CIERRE_PREG');
const cierre = html.slice(i, html.indexOf('const DM_TCCI_FINAL_PREG'));
r.ok(/id:'sirvio'/.test(cierre), 'se pregunta si le sirvió');
r.ok(/id:'costo'/.test(cierre),  'y cuánto le costó sostenerlo');
// Las dos juntas o ninguna: la utilidad sola no distingue una semana buena
// de una que funciona pero nadie puede sostener.
r.ok(/id:'sirvio'[\s\S]*id:'costo'/.test(cierre),
     'las dos van juntas, que es lo único que las hace interpretables');

r.seccion('Lo obligatorio es feedback; lo demás se puede saltear:');

r.ok(/id:'comentario'[\s\S]{0,120}opcional:true/.test(cierre),
     'el comentario libre está marcado opcional');

const j = html.indexOf('function dmTcciSondeoPrecio(');
const precio = html.slice(j, j + 2200);
r.ok(/saltear:'Prefiero no contestar'/.test(precio),
     'el sondeo de precio tiene salida explícita');
r.ok(/alSaltear:function/.test(precio),
     'y saltearlo igual deja seguir el programa');
r.ok(/salteada:true/.test(precio),
     'se registra que lo salteó, sin trabarlo');

r.seccion('Con profesional no se pide nada:');

const k = html.indexOf('function dmTcciCerrarSemana(n){');
const cerrar = html.slice(k, k + 1500);
r.ok(/dmTcciModo\(\)!=='guiado'/.test(cerrar),
     'el cierre solo pregunta en modo autogestionado');

const m = html.indexOf('function dmTcciAbrirSemana(n){', html.indexOf('function dmTcciLecturasHtml('));
const abrir = html.slice(m, m + 2000);
r.ok(/dmTcciModo\(\)!=='guiado'/.test(abrir),
     'el compromiso previo tampoco se pide con profesional');

r.seccion('Se guarda sin poder trabar a nadie:');

const g = html.indexOf('async function dmTcciGuardarEncuesta(');
const guardar = html.slice(g, g + 1200);
r.ok(/localStorage\.setItem\('dm_tcci_encuestas'/.test(guardar),
     'primero al dispositivo');
r.ok(/console\.warn\('\[TCCI-ENCUESTA\]/.test(guardar),
     'y si el servidor falla, solo se avisa en consola');
r.ok(guardar.indexOf("localStorage.setItem('dm_tcci_encuestas'") < guardar.indexOf("db.post('tcci_encuestas'"),
     'en ese orden: que la tabla no exista no puede frenar un tratamiento');

r.seccion('El reinicio es solo para cuentas de prueba:');

const rst = html.slice(html.indexOf('function dmTcciReiniciar('), html.indexOf('window.dmTcciReiniciar'));
r.ok(/if\(!dmTcciTieneAcceso\(\)\) return;/.test(rst),
     'un paciente no puede borrarse el progreso sin querer');
r.ok(/confirm\(/.test(rst), 'y aun teniendo acceso, se confirma');

r.cerrar('Preguntar está bien. Cobrar el tratamiento en datos, no.');
