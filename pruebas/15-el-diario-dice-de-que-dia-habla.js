// Dos cosas que los pacientes pidieron, y una que pidieron sin saberlo.
//
// 1. "Y a media tarde" no decía de qué tarde hablaba. La ayuda decía "de
//    ayer", que solo es cierto si la persona registra a la mañana siguiente:
//    completando una noche atrasada —que es lo habitual— "ayer" apunta al día
//    equivocado y el dato entra mal. Ahora se nombra el día concreto, sacado
//    de la fecha del propio registro.
//
// 2. Lo mismo con la siesta, que tenía el mismo "ayer" sin fecha.
//
// 3. El recordatorio del diario vive detrás de un ícono 🔔 en una pantalla
//    interna. Quien nunca lo configuró no sabe que existe. Y quien lo activó
//    con las notificaciones bloqueadas cree que le van a avisar y no le llega
//    nada: eso hoy no se ve en ningún lado.

const C = require('./comun');
const r = C.crearReporte('El diario dice de qué día habla');

const html = C.leerHtml();

r.seccion('La energía de media tarde dice de cuándo:');

r.ok(/Tu energía a media tarde de ayer/.test(html),
     'la etiqueta es explícita, no "Y a media tarde"');

r.ok(/id="d-energy-pm-ayuda"/.test(html),
     'y tiene un renglón de ayuda propio para el horario');

r.ok(/id="d-nap-ayuda"/.test(html),
     'la siesta también aclara de qué día habla');

r.seccion('Y el día sale de la fecha del registro, no de un "ayer" fijo:');

r.ok(/function dmDiaPrevioTxt\(\)/.test(html),
     'existe el cálculo del día anterior');

r.ok(/function dmPintarAyudasDelDia\(\)/.test(html),
     'y quien lo escribe en pantalla');

// Si no se vuelve a pintar al cambiar la fecha, el texto queda mintiendo.
const bloqueFecha = html.slice(
  html.indexOf("dEl._daytypeWired") - 700,
  html.indexOf("dEl._daytypeWired") + 200);
r.ok(/dmPintarAyudasDelDia/.test(bloqueFecha),
     'se recalcula cuando el paciente cambia la fecha');

r.seccion('El aviso de recordatorios sin configurar:');

r.ok(/function maybePromptRecordatorios\(\)/.test(html),
     'existe la función');

r.ok(/maybePromptRecordatorios\(\); *\}catch/.test(html),
     'y se llama al armar el home del paciente');

const bloqueBanner = html.slice(
  html.indexOf('function maybePromptRecordatorios()'),
  html.indexOf('window.maybePromptRecordatorios'));

r.ok(/permiso === 'denied'/.test(bloqueBanner),
     'avisa cuando el permiso está bloqueado, que es el caso invisible');

r.ok(/return; *\/\/ apagado a propósito/.test(bloqueBanner),
     'y NO le insiste a quien lo apagó a propósito');

r.ok(/profile-reminder-banner/.test(bloqueBanner),
     'no se apila con el cartel de perfil incompleto');

r.ok(/dm_recordatorio_dismiss_/.test(bloqueBanner),
     'se puede descartar, y se respeta por una semana');

r.ok(/showReminderSettings\('diary'\)/.test(bloqueBanner),
     'y al tocarlo lleva a configurarlo');

r.cerrar('Un campo que no dice de qué día habla se llena mal, no se llena menos.');
