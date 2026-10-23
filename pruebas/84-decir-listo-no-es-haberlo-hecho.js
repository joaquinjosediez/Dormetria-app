// Dos reportes del mismo día, con la misma forma:
//
//   "no me deja revocar profesionales desde el usuario paciente"
//   "un paciente me dijo que no le está guardando los test de alerta"
//
// En los dos la app decía que había funcionado sin comprobar que hubiera
// pasado algo. Y en los dos el servidor contestaba que sí.
//
// ── Revocar ──────────────────────────────────────────────────────────
// `unlinkDoctor` mandaba el DELETE con fetch y no miraba la respuesta.
// `fetch` sólo rechaza si no hay red: un 401, un 403 o un 404 resuelven
// normalmente, así que el catch no corría nunca y el toast de éxito salía
// igual. Y aunque mirara el estado tampoco alcanzaría: con RLS, un DELETE
// que no matchea ninguna fila devuelve **204**. Un éxito que no borró nada.
//
// ── El PVT ───────────────────────────────────────────────────────────
// El POST devolvía 201 y la pantalla decía "Test guardado ✓". En Registros
// no aparecía nada. Con RLS, INSERT y SELECT son políticas separadas: si la
// de INSERT es más amplia que la de SELECT, la fila entra y el dueño del
// dato no la ve. Para la persona el test se perdió, y no hay ningún error
// en ningún lado.
//
// La única comprobación que vale, en los dos casos, es volver a leer.

const C = require('./comun');
const r = C.crearReporte('Decir "listo" no es haberlo hecho');

const app = C.leerApp();

r.seccion('Revocar: se verifica que la fila ya no esté:');

const un = app.slice(app.indexOf('async function unlinkDoctor(email){'),
                     app.indexOf('// submitSuggestion se eliminó'));
r.ok(!/fetch\(SU\+'\/rest\/v1\/doctor_patients/.test(un),
     'se fue el fetch pelado que no miraba la respuesta');
r.ok(/await db\.del\(_f\)/.test(un), 'va por db.del, que sí tira si falla');
r.ok(/quedan = await db\.get\(_f\+'&select=doctor_email&limit=1'\)/.test(un),
     'y después se relee el mismo filtro');
r.ok(/if\(quedan && quedan\.length\)\{/.test(un), 'si la fila sigue ahí');
r.ok(/No se pudo desvincular|no permiti/.test(un), '  se dice que no se pudo');
// Lo importante: el toast de éxito NO puede estar antes de la verificación.
const iVerif = un.indexOf('quedan && quedan.length');
const iExito = un.indexOf("toast('Profesional desvinculado')");
r.ok(iVerif > 0 && iExito > iVerif,
     'y el "desvinculado" va DESPUÉS de comprobar, que era todo el problema');
r.ok(/falta una pol[ií]tica de DELETE en doctor_patients/.test(un),
     'con el diagnóstico en la consola: 204 sin borrar nada es falta de policy');
// Un DELETE que no borra es una revocación que no revoca, y eso es el
// derecho del titular a retirar el consentimiento (Ley 25.326, art. 6 y 11).
r.ok(/Deja de ver tus registros/.test(un),
     'y el confirm dice qué significa revocar');

r.seccion('PVT: se relee lo que se acaba de escribir:');

r.ok(/_vuelta = await db\.get\('pvt_tests\?patient_email=eq\.'\+/.test(app),
     'después del 201 se vuelve a leer');
r.ok(/if\(_vuelta && _vuelta\.length\)\{[\s\S]{0,200}Test guardado/.test(app),
     'y sólo entonces se dice "Test guardado"');
r.ok(/la pol[ií]tica de SELECT de pvt_tests no cubre al paciente/.test(app),
     'si entró y no se puede leer, queda el diagnóstico en la consola');
r.ok(/no aparece en tus registros/.test(app),
     'y la persona se entera, en vez de creer que lo tiene');
// Un fallo de red al releer no prueba nada en ninguna dirección: ahí no se
// afirma que se guardó ni que no.
r.ok(/Test enviado/.test(app),
     'y si no se pudo releer, no se afirma ni una cosa ni la otra');

r.seccion('Y la rama que no decía nada:');

// dur<3 con sesión abierta no guardaba y no avisaba. Hoy el mínimo está
// forzado en 3, pero era la única salida muda del guardado.
r.ok(/el m[ií]nimo son 3/.test(app), 'un test demasiado corto ahora lo dice');
r.ok(/es muy corto para interpretarlo/.test(app), 'y por qué');

r.seccion('El SQL de la otra mitad está escrito:');

const fs = require('fs');
const path = require('path');
const sql = fs.readFileSync(path.join(__dirname, '..', 'SQL-revocar-y-pvt.md'), 'utf8');
// Primero mirar, después tocar: no tengo acceso a la base y las policies de
// estas dos tablas no están en el repositorio.
r.ok(/from pg_policies/.test(sql), 'empieza por leer qué policies hay');
r.ok(sql.indexOf('from pg_policies') < sql.indexOf('create policy'),
     'y eso va ANTES de crear nada');
r.ok(/create policy dp_paciente_revoca/.test(sql), 'la de DELETE del paciente');
r.ok(/create policy pvt_paciente_lee_lo_suyo/.test(sql), 'la de lectura del PVT');
r.ok(/create policy pvt_profesional_vinculado_lee/.test(sql),
     'y la del profesional, colgada del vínculo');
// Que cuelgue de doctor_patients es lo que hace que revocar revoque: si el
// permiso fuera una copia, borrar el vínculo no sacaría el acceso.
r.ok(/from public\.doctor_patients dp/.test(sql),
     'contra doctor_patients, así revocar saca el acceso en el mismo momento');
r.ok(/las permisivas se combinan con OR/i.test(sql) || /PERMISSIVE/.test(sql),
     'y queda escrito que son permisivas: agregan, no sacan');
r.ok(/Ley 25\.326/.test(sql), 'con el marco legal de por qué esto no es cosmético');

r.cerrar('Con RLS, un DELETE que no matchea nada devuelve 204: el éxito no prueba que haya pasado algo.');
