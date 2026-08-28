// El consentimiento tiene que quedar en la BASE, no en el navegador.
//
// Hasta mod177 la app guardaba el consentimiento en localStorage y nada más.
// Eso rompía dos cosas a la vez:
//
//   1. Al cambiar de teléfono o limpiar el navegador, el consentimiento
//      desaparecía. No quedaba constancia de que la persona lo hubiera dado.
//   2. Los pacientes dados de alta por el profesional NUNCA veían la pantalla
//      de registro: entraban por el link del correo, ponían la contraseña y
//      empezaban a usar la app sin haber aceptado nada.
//
// Para investigación esto es fatal: sin el dato en la base no se puede armar
// la cohorte de quienes consintieron, y una cohorte que no se puede demostrar
// no se puede publicar.
//
// Esta prueba existe porque el agujero fue invisible durante meses. Nadie vio
// un error. La app funcionaba. El dato simplemente no estaba.

const C = require('./comun');
const r = C.crearReporte('El consentimiento queda anotado');

const html = C.leerHtml();
const ctx = C.appEvaluada();
if (!ctx) { console.log('  La app no arranca.'); process.exitCode = 1; return; }

r.seccion('Lo obligatorio va junto; lo de investigación va SEPARADO:');

// Agrupar los términos en un solo casillero es legítimo y es lo que hace
// cualquier app. Agrupar ahí adentro el de investigación no lo es: haría que
// aceptarlo sea la condición para usar la app, y un consentimiento que no se
// puede rechazar no es voluntario. Un comité lo rechaza por eso.
r.ok(/id="reg-c1"/.test(html), 'hay un único casillero obligatorio');
r.ok(!/id="reg-c2"/.test(html) && !/id="reg-c4"/.test(html),
     'los tres obligatorios quedaron agrupados en uno solo');
r.ok(/id="reg-c3"/.test(html), 'el de investigación sigue existiendo, aparte');
r.ok(/id="reg-c3"[\s\S]{0,600}?opcional/.test(html),
     'y dice que es opcional');
r.ok(/id="reg-c3"[\s\S]{0,700}?us&aacute;s la app exactamente igual/.test(html),
     'y aclara que rechazarlo no cambia nada de la app');

const val = html.slice(html.indexOf("const rc1=document.getElementById('reg-c1')"),
                       html.indexOf("const rc3=document.getElementById('reg-c3')"));
r.ok(!/rc3/.test(val),
     'el botón de crear cuenta NO exige el de investigación');

r.ok(!/id="reg-c3"[^>]*\schecked/.test(html),
     'viene DESMARCADO: el consentimiento se da activamente, no por omisión');

r.seccion('Y existe la hoja de información que evalúa un comité:');

r.ok(typeof ctx.dmVerDetalleInvestigacion === 'function', 'se puede abrir el detalle');
const info = ctx.DM_INFO_INVESTIGACION || [];
r.ok(info.length >= 8, 'cubre los puntos que se piden', info.length + ' secciones');
const titulos = info.map(x => x[0]).join(' | ');
for (const req of ['Para qué', 'Qué datos', 'voluntario', 'arrepentirte', 'responsable', 'Riesgos']) {
  r.ok(new RegExp(req, 'i').test(titulos), 'incluye: ' + req);
}
const cuerpo = info.map(x => x[1]).join(' ');
r.ok(/no se venden/i.test(cuerpo), 'dice explícitamente que los datos no se venden');
r.ok(/Perfil . Privacidad/i.test(cuerpo), 'dice dónde se revoca');

r.seccion('La revocación queda anotada, no se borra:');
r.ok(/research_withdrawn_date/.test(html),
     'se guarda la fecha en que alguien se dio de baja de investigación');

r.seccion('Y lo que se tilda se escribe en la base:');

r.ok(typeof ctx.dmGuardarConsentimiento === 'function',
     'existe la función que lo guarda');
r.ok(typeof ctx.dmConsentimientoSincronizar === 'function',
     'y la que lo revisa en cada entrada');
r.ok(typeof ctx.dmConsentimientoPreguntar === 'function',
     'y la que lo pregunta a quien nunca lo dio');

r.ok(/dmGuardarConsentimiento\(\{research: rc3/.test(html),
     'el registro normal guarda lo que la persona tildó');

const vecesEnRegistro = (html.match(/dmGuardarConsentimiento\(\{research: rc3/g) || []).length;
r.ok(vecesEnRegistro === 2,
     'los DOS caminos del registro lo guardan (ficha nueva y ficha ya creada por el profesional)',
     vecesEnRegistro + ' de 2');

r.ok(/dmConsentimientoSincronizar\(\);/.test(html),
     'y al entrar se revisa que esté');

r.seccion('La escritura no puede romper el alta:');

// Un insert con una columna que la base no conoce es rechazado ENTERO por
// PostgREST: la persona no podría registrarse. Por eso el consentimiento va
// en un patchFlexible aparte, que descarta lo que no existe y sigue.
r.ok(!/patientData\.(consent|research)/.test(html),
     'el consentimiento NO viaja en el insert de patients');
const bloque = html.slice(html.indexOf('async function dmGuardarConsentimiento'),
                          html.indexOf('window.dmGuardarConsentimiento'));
r.ok(/patchFlexible/.test(bloque),
     'se escribe con patchFlexible, que tolera columnas que todavía no existen');

r.seccion('Nadie queda dentro de investigación sin haberlo dicho:');

const bloqueSync = html.slice(html.indexOf('async function dmConsentimientoSincronizar'),
                              html.indexOf('window.dmConsentimientoSincronizar'));
r.ok(/previo\.storage && previo\.doctorAccess/.test(bloqueSync),
     'sólo se migra el consentimiento del dispositivo si estaba completo');
r.ok(/research: !!previo\.research/.test(bloqueSync),
     'y se migra el valor REAL, sin asumir que dijo que sí');

const bloqueModal = html.slice(html.indexOf('function dmConsentimientoPreguntar'),
                               html.indexOf('window.dmConsentimientoPreguntar'));
r.ok(/dmc-4/.test(bloqueModal) && /research = g\('dmc-4'\)\.checked/.test(bloqueModal),
     'la pregunta de primera entrada lee la respuesta real del casillero');
r.ok(!/id="dmc-4"[^>]*checked/.test(bloqueModal),
     'que también viene desmarcado');
r.ok(/if\(!g\('dmc-1'\)\.checked\)/.test(bloqueModal) && !/!g\('dmc-4'\)\.checked/.test(bloqueModal),
     'sólo se exige el obligatorio; se puede continuar diciendo que no a investigación');

r.cerrar('Quien no lo tildó queda fuera de investigación por diseño, no por memoria.');
