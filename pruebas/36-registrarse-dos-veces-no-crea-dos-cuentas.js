// Alejandro instaló Dormetria en la pantalla de inicio y quedó en bucle:
// cargaba sus datos, le llegaba el mail, lo confirmaba, volvía a la app y
// la app le pedía los datos otra vez. Y otra. Y otra.
//
// Dos causas encadenadas:
//
//   1. El link de confirmación abre en el navegador del sistema, NO dentro
//      de la PWA instalada. En iOS cada una tiene su propio almacenamiento,
//      así que la sesión que Supabase crea al confirmar queda del lado del
//      navegador y la app sigue sin sesión.
//
//   2. supa.auth.signUp NO devuelve error con un mail que ya tiene cuenta:
//      por privacidad devuelve un usuario con identities vacío y reenvía la
//      confirmación. Sin mirar eso, cada reintento parece un alta nueva.
//
// Resultado: la persona se registra en loop y solo recibe el mismo mail.

const C = require('./comun');
const r = C.crearReporte('Registrarse dos veces no crea dos cuentas');

const html = C.leerHtml();

r.seccion('Se reconoce que la cuenta ya existía:');

r.ok(/identities\s*&&\s*authData\.user\.identities\.length===0/.test(html),
     'se mira identities vacío, que es la señal de Supabase');
const veces = (html.match(/dmYaTenesCuenta\(email\)/g) || []).length;
r.ok(veces >= 2,
     'se comprueba en las dos altas: paciente y profesional (encontradas: ' + veces + ')');

r.seccion('Y no se lo deja parado en el formulario de alta:');

r.ok(/function dmEsperandoConfirmacion\(/.test(html),
     'existe el estado "esperando confirmación"');
r.ok(/function dmYaTenesCuenta\(/.test(html),
     'y el de "ya tenés cuenta"');

const i = html.indexOf('function dmMostrarAvisoAuth(');
const aviso = html.slice(i, i + 900);
r.ok(/showLogin\(\)/.test(aviso),
     'los dos llevan al ingreso, no al registro');
r.ok(/login-email/.test(aviso) && /le\.value = mail/.test(aviso),
     'con el mail ya puesto, para que no lo tipee de nuevo');

r.seccion('Se recuerda entre arranques:');

r.ok(/dm_alta_pendiente/.test(aviso),
     'queda marcado en el dispositivo');
const abrir = html.slice(html.indexOf('function dmAbrirAcceso'), html.indexOf('window.dmAbrirAcceso'));
r.ok(/dm_alta_pendiente/.test(abrir) && /dmEsperandoConfirmacion\(_pend\)/.test(abrir),
     'al volver a abrir la app va al ingreso, aunque venga con ?crear=1');

r.seccion('Y se apaga cuando por fin entra:');

r.ok(/removeItem\('dm_alta_pendiente'\)/.test(html),
     'entrando, el aviso desaparece');

r.cerrar('Reenviar el mismo mail no es crear una cuenta, y hay que decirlo.');
