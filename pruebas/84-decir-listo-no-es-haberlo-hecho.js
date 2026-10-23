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
r.ok(/const _contar = async function\(\)/.test(un),
     'y se cuentan las filas con el mismo filtro, antes y después');
r.ok(/if\(despues > 0\)\{/.test(un), 'si la fila sigue ahí');
r.ok(/No se pudo desvincular|no permiti/.test(un), '  se dice que no se pudo');
// Lo importante: el toast de éxito NO puede estar antes de la verificación.
const iVerif = un.indexOf('const despues = await _contar()');
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

// ── Segunda vuelta: seguía sin revocar ────────────────────────────────
//
// mod287 dejó de mentir pero no arregló nada, y además no decía nada.
// Revisando el camino entero aparecieron tres defectos más:
//
//   · El filtro del borrado NO era el del listado. La lista se arma con
//     `patient_email=ilike.` y el DELETE usaba `=eq.`. En Postgres `eq`
//     distingue mayúsculas: si el correo quedó guardado con otra
//     capitalización —y se tipean a mano al vincular— la pantalla lo
//     MUESTRA y el borrado no lo encuentra. Cero filas, 204, silencio.
//   · Eso ADEMÁS rompía la verificación de mod287: la relectura usaba el
//     mismo filtro malo, volvía vacía, y la app informaba éxito.
//     Comprobar con la misma pregunta equivocada no comprueba nada.
//   · Y los tres botones hacían `unlinkDoctor(...)` y en la misma línea
//     `.remove()` sobre la fila. unlinkDoctor es async: la pantalla se
//     limpiaba siempre, saliera bien o mal.
const r2 = C.crearReporte('Revocar, segunda vuelta');
const un2 = app.slice(app.indexOf('async function unlinkDoctor(email){'),
                      app.indexOf('// submitSuggestion se eliminó'));

r2.seccion('El filtro del borrado es el mismo que el del listado:');
r2.ok(/patient_email=ilike\.'\+encodeURIComponent\(S\.user\.email\)/.test(un2),
      'ilike en patient_email');
r2.ok(/doctor_email=ilike\.'\+encodeURIComponent\(email\)/.test(un2),
      'y en doctor_email');
r2.ok(!/patient_email=eq\./.test(un2), 'ya no queda ningún eq en este camino');
r2.ok(/eq. distingue may/.test(app) || /distingue mayúsculas/.test(app),
      'con el motivo escrito');

r2.seccion('Se cuenta ANTES y DESPUÉS, y son tres resultados distintos:');
r2.ok(/const antes = await _contar\(\)/.test(un2), 'antes');
r2.ok(/const despues = await _contar\(\)/.test(un2), 'y después');
// Este es el que faltaba: distingue "la app pregunta mal" de "el servidor
// no deja". Son arreglos completamente distintos.
r2.ok(/if\(antes === 0\)\{/.test(un2),
      'si antes ya no hay nada, el problema es el filtro, no el permiso');
r2.ok(/No encontré ese vínculo para borrar/.test(un2), '  y lo dice así');
r2.ok(/if\(despues > 0\)\{/.test(un2), 'si después sigue, es el permiso');
r2.ok(/falta una política de DELETE/.test(un2), '  y lo dice así');
r2.ok(/SQL-revocar-y-pvt\.md/.test(un2), '  con dónde está el arreglo');
// Sin red para verificar no se afirma nada.
r2.ok(/if\(despues === null\)\{/.test(un2) && /no pude confirmarlo/.test(un2),
      'y si no se pudo verificar, no se afirma ni una cosa ni la otra');

r2.seccion('Y la pantalla se limpia después de saber, no antes:');
r2.ok(/async function dmRevocarDesde\(btn, email, selectorAQuitar\)\{/.test(app),
      'hay un envoltorio único para los tres botones');
r2.ok(/ok = await unlinkDoctor\(email\)/.test(app), 'que espera el resultado');
r2.ok(/if\(ok && btn && selectorAQuitar\)\{/.test(app),
      'y sólo entonces saca la fila');
// Si alguno vuelve a encadenar remove() en el onclick, vuelve el bug.
r2.ok(!/unlinkDoctor\([^)]*\);this\.closest/.test(app),
      'ningún botón encadena unlinkDoctor con un remove() sincrónico');
r2.ok((app.match(/dmRevocarDesde\(/g) || []).length >= 4,
      'los tres botones pasan por el envoltorio',
      (app.match(/dmRevocarDesde\(/g) || []).length + ' usos');
// Doble confirm: el de la lista preguntaba y unlinkDoctor volvía a preguntar.
r2.ok(!/confirm\('¿Revocar acceso a '/.test(app),
      'y se fue el segundo confirm, que preguntaba dos veces lo mismo');
r2.ok(/btn\.disabled = true/.test(app),
      'con el botón deshabilitado mientras tanto, para no mandarlo dos veces');

r2.cerrar('Comprobar con la misma pregunta equivocada no comprueba nada.');

r2.seccion('Y el SQL distingue las dos causas:');
const sql2 = fs.readFileSync(path.join(__dirname, '..', 'SQL-revocar-y-pvt.md'), 'utf8');
r2.ok(/patient_email <> lower\(patient_email\)/.test(sql2),
      'hay una consulta para ver si los correos están desparejos');
r2.ok(/Si devuelve 0 filas, el problema \*\*no\*\* es\s*\n?> este/.test(sql2) ||
      /no\*\* es[\s\S]{0,40}este/.test(sql2),
      'y dice qué significa que dé cero: entonces es el permiso');
// El update de normalización ACERCA el dato a lo que la RLS ya compara.
r2.ok(/la RLS ya\s*\n?compara con `lower\(\)`/.test(sql2),
      'y por qué normalizar no debilita ninguna policy');
