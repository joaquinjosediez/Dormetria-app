// Un profesional que entra por primera vez ve "Todavía no recibiste
// calificaciones" y no puede enseñar para qué sirve esa pantalla. Mostrar una
// muestra resuelve eso. Pero hay una línea que no se cruza:
//
// Los campos `rating` y `comment` de `doctor_patients` alimentan
// `opiniones_publicas`, que es lo que ve un PACIENTE REAL eligiendo
// profesional en el Directorio. Calificaciones inventadas escritas ahí serían
// publicidad falsa sobre una persona de verdad, con su matrícula al lado.
//
// Por eso la muestra se DIBUJA y no se guarda, y por eso tiene que estar
// rotulada en la propia pantalla: lo que el profesional ve no puede parecer
// una calificación suya ni en una captura de pantalla.

const C = require('./comun');
const vm = require('vm');
const r = C.crearReporte('Los datos de ejemplo no se guardan');

const app = C.leerApp();
const ctx = C.appEvaluada({ silencioso: true });
r.ok(!!ctx, 'la app arranca');

const h = vm.runInContext('dmRatingsDemoHtml()', ctx);

r.seccion('Se ve que es un ejemplo, sin tener que buscarlo:');

r.ok(/Ejemplo — no son calificaciones tuyas/.test(h),
     'lo dice primero, arriba de todo');
r.ok(/no se publica[\s\S]{0,40}Directorio/.test(h),
     'y aclara que no sale en el Directorio');
const _firmas = (h.match(/dm-aguja-x|EJEMPLO/g) || []).length;
const _tarjetas = (h.match(/letter-spacing:1px/g) || []).length;
r.ok(_firmas === _tarjetas && _tarjetas >= 4,
     'cada firma va marcada: una captura recortada tampoco engaña',
     _tarjetas + ' calificaciones, ' + _firmas + ' marcas');
r.ok(/calificaciones de ejemplo/.test(h),
     'y el contador también lo dice');

r.seccion('No se escribe nada en la base:');

const i = app.indexOf('const DM_RATINGS_DEMO');
const bloque = app.slice(i, app.indexOf('async function renderDoctorRatings', i));
r.ok(!/db\.(post|patch|put)/.test(bloque),
     'el bloque de ejemplo no tiene ninguna escritura');
r.ok(!/doctor_patients/.test(bloque),
     'ni toca la tabla que alimenta las opiniones públicas');
r.ok(/No se inventa ningún paciente|pacientes DEMO/.test(app.slice(i - 900, i)),
     'y las firmas son de cuentas demo declaradas, no de personas inventadas');

r.seccion('Solo aparece donde no puede confundir:');

// Con un paciente real vinculado, el panel tiene que decir la verdad sobre
// ese paciente — aunque todavía no haya calificado.
const soloDemos = app.slice(app.indexOf('function dmPanelSoloDemos'),
                            app.indexOf('function dmRatingsDemoHtml'));
r.ok(/ems\.every\(/.test(soloDemos),
     'hacen falta TODOS los pacientes de ejemplo, no alguno');
r.ok(/if\(!ems \|\| !ems\.length\) return false/.test(soloDemos),
     'y sin ningún paciente tampoco: ahí el mensaje correcto es el vacío');
r.ok(/esPropio && dmPanelSoloDemos\(\)/.test(app),
     'y solo en el panel propio');
// En el perfil público de un colega, "sin opiniones" es la verdad.
const llamada = app.slice(app.indexOf('if(esPropio && dmPanelSoloDemos())'),
                          app.indexOf('if(esPropio && dmPanelSoloDemos())') + 300);
r.ok(/return;/.test(llamada), 'se corta ahí, sin mezclar con lo real');

r.seccion('La cuenta de ejemplo se reconoce por la base, no por el nombre:');

r.ok(/dmEsCuentaDemo\(/.test(soloDemos),
     'usa el mismo criterio que el resto de la app');
// Recibe correos sueltos (desde localStorage) o filas de paciente (desde la
// adherencia). Si solo aceptara una de las dos formas, el panel de métricas
// pediría un helper paralelo y las dos reglas se irían separando.
r.ok(/e\.email\|\|e\.patient_email/.test(soloDemos),
     'y acepta tanto el correo suelto como la fila entera');

r.cerrar('Mostrar una muestra está bien. Guardarla sería publicidad falsa sobre una persona real.');
