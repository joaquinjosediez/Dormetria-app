// Que el paciente pueda entrar es lo único que no puede fallar.
//
// Un gráfico feo se aguanta hasta la próxima versión. Una persona que no
// puede entrar a la app abandona y no vuelve. Acá se prueban los dos
// caminos por los que alguien llega a tener cuenta: el alta que hace el
// profesional y la invitación por mail.

const C = require('./comun');
const r = C.crearReporte('El paciente puede entrar');

const ctx = C.appEvaluada();
if (!ctx) { console.log('  La app no arranca.'); process.exitCode = 1; return; }
const { D, $, corr } = C.conDom(ctx);

// Sesión válida por defecto
corr("supa.auth.getSession=function(){return Promise.resolve({data:{session:{access_token:'tok'}}});};");

function servidorResponde(status, cuerpo, seCae) {
  ctx.__f = () => seCae
    ? Promise.reject(new Error('ECONNREFUSED'))
    : Promise.resolve({ ok: status >= 200 && status < 300, status,
                        json: () => Promise.resolve(cuerpo || {}) });
  corr('fetch=__f;');
}

(async () => {

  // ── La invitación, en todos sus desenlaces ───────────────────────────
  r.seccion('La invitación por mail:');

  servidorResponde(200, { ok: true });
  let x = await corr("dmEnviarInvitacion({email:'a@b.com',name:'Ana',lname:'P'})");
  r.ok(x.estado === 'enviado', 'salió bien', x.estado);

  servidorResponde(409, { error: 'Ya tiene cuenta con ese mail: puede entrar directamente.' });
  x = await corr("dmEnviarInvitacion({email:'a@b.com'})");
  r.ok(x.estado === 'ya_tiene_cuenta', 'ya tenía cuenta NO se cuenta como error', x.estado);

  servidorResponde(404, {});
  x = await corr("dmEnviarInvitacion({email:'a@b.com'})");
  r.ok(x.estado === 'sin_configurar', 'falta publicar la función → lo dice así', x.estado);
  r.ok(/Supabase/.test(x.mensaje), 'y nombra el panel donde publicarla');
  r.ok(/WhatsApp/.test(x.mensaje), 'y deja una salida mientras tanto');

  servidorResponde(0, null, true);
  x = await corr("dmEnviarInvitacion({email:'a@b.com'})");
  r.ok(x.estado === 'error', 'si no hay red, lo dice', x.estado);

  corr("supa.auth.getSession=function(){return Promise.resolve({data:{}});};");
  x = await corr("dmEnviarInvitacion({email:'a@b.com'})");
  r.ok(x.estado === 'sin_sesion', 'sesión vencida no se confunde con fallo del mail', x.estado);
  corr("supa.auth.getSession=function(){return Promise.resolve({data:{session:{access_token:'tok'}}});};");

  // Tiene que ir a Supabase, no a Netlify. La versión de Netlify fallaba
  // siempre con "no se pudo contactar al servidor" y el mensaje mandaba a
  // buscar el problema al lugar equivocado.
  let urls = [];
  ctx.__f2 = (url) => { urls.push(url);
    return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve({ ok: true }) }); };
  corr('fetch=__f2;');
  await corr("dmEnviarInvitacion({email:'a@b.com'})");
  r.ok(/\/functions\/v1\/invitar-paciente$/.test(urls[0] || ''),
       'la invitación viaja por Supabase', urls[0]);
  r.ok(!/netlify/i.test(urls[0] || ''), 'y ya no depende de Netlify');

  // ── El alta manda el mail sola ───────────────────────────────────────
  r.seccion('El alta que hace el profesional:');
  function formularioDeAlta(nombre, apellido, mail) {
    D.body.innerHTML =
      '<input id="ap-name" value="' + nombre + '"><input id="ap-lname" value="' + apellido + '">' +
      '<input id="ap-email" value="' + mail + '"><input id="ap-dob" value="1990-05-04">' +
      '<select id="ap-sex"></select><input id="ap-weight"><input id="ap-height">' +
      '<div id="ap-err"></div><div id="ap-resultado"></div>';
  }
  corr("S.user={email:'dr@x.com',name:'Ana',lname:'P',gender:'Femenino'};");
  ctx.__vacio = async () => []; ctx.__ok = async () => ({}); ctx.__nada = () => {};
  corr('db.get=__vacio; db.post=__ok; toast=__nada; loadDoctorPatients=function(){};');

  formularioDeAlta('Belén', 'Montaña', 'belen@mail.com');
  let enviados = [];
  ctx.__f3 = (url, opts) => { enviados.push(JSON.parse(opts.body));
    return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve({ ok: true }) }); };
  corr('fetch=__f3;');
  await corr('dmCrearPacienteGuardar()');
  await new Promise(res => setTimeout(res, 30));

  r.ok(enviados.length === 1, 'el mail sale solo, sin apretar ningún botón', 'n=' + enviados.length);
  r.ok(enviados[0] && enviados[0].email === 'belen@mail.com', 'al mail que se cargó');
  const panel = $('ap-resultado').innerHTML;
  r.ok(/Ficha creada/.test(panel), 'confirma que la creó');
  r.ok(/Pacientes/.test(panel), 'y dice dónde encontrarla');
  r.ok(($('ap-err').textContent || '').trim() === '', 'sin ningún cartel rojo');

  // Si el mail falla, la ficha se crea IGUAL y queda una salida
  formularioDeAlta('Juan', 'Gómez', 'juan@mail.com');
  ctx.__f4 = () => Promise.resolve({ ok: false, status: 404, json: () => Promise.resolve({}) });
  corr('fetch=__f4;');
  await corr('dmCrearPacienteGuardar()');
  await new Promise(res => setTimeout(res, 30));
  const panel2 = $('ap-resultado').innerHTML;
  r.ok(/Ficha creada/.test(panel2), 'si el mail falla, la ficha se crea igual');
  r.ok(/Reintentar/.test(panel2), 'y ofrece reintentar');
  r.ok(/app\.dormetria\.com/.test(panel2), 'y deja el texto para mandar a mano');

  // ── "Ya lo tenés" no es un error ─────────────────────────────────────
  r.seccion('Dar de alta a alguien que ya estaba:');
  formularioDeAlta('Belén', 'Montaña', 'belen@mail.com');
  D.body.innerHTML += '<div id="dm-alta-pac"></div>';
  ctx.__yaEsta = async (q) => {
    if (/^patients\?email=eq/.test(q)) return [{ id: 9, name: 'Belén', lname: 'Montaña',
                                                 created_at: '2026-08-20T10:00:00Z' }];
    if (/^doctor_patients\?patient_email/.test(q)) return [{ doctor_email: 'DR@x.com' }];
    return [];
  };
  corr('db.get=__yaEsta;');
  await corr('dmCrearPacienteGuardar()');
  await new Promise(res => setTimeout(res, 20));
  const res3 = $('ap-resultado').innerHTML;
  r.ok(($('ap-err').textContent || '').trim() === '', 'no escribe en el renglón de errores');
  r.ok(/ya está en tu listado/.test(res3), 'lo dice como confirmación');
  r.ok(!/#ff7979|#ff9d9d/.test(res3), 'y sin nada rojo');

  // ── Reenviar a alguien ya cargado ────────────────────────────────────
  r.seccion('Reenviar la invitación desde la ficha:');
  D.body.innerHTML = '<button id="drp-inv-btn">x</button><div id="drp-inv-estado"></div>';
  corr("S.viewData={email:'belen@mail.com',name:'Belén',lname:'Montaña',auth_id:null};");
  enviados = []; corr('fetch=__f3;');
  await corr('dmReinvitarPaciente()');
  await new Promise(res => setTimeout(res, 20));
  r.ok(enviados.length === 1, 'se puede reenviar sin volver a dar el alta');
  r.ok($('drp-inv-btn').disabled === false, 'el botón vuelve a quedar usable');

  corr('S.viewData=null;');
  await corr('dmReinvitarPaciente()');
  r.ok(/ningún paciente abierto/.test($('drp-inv-estado').textContent),
       'sin paciente abierto no manda nada');

  r.cerrar('Los dos caminos de entrada funcionan, y cuando no, avisan.');
})();
