// "Una paciente tiene iPhone nuevo y Safari no le da la opción de agregar a
// pantalla de inicio: le aparece el símbolo de pestañas."
//
// No era su teléfono. iOS 26 cambió la barra de Safari: con el diseño
// "Compacto", que viene PUESTO POR DEFECTO, el botón Compartir ya no está a la
// vista — hay que entrar por el menú ··· de la página. El instructivo mandaba a
// tocar algo que en un iPhone nuevo no existe.
//
// Y eso importa más de lo que parece: en iPhone las notificaciones del diario
// SOLO funcionan si la app está en la pantalla de inicio. Un instructivo
// desactualizado no es un detalle cosmético, es un paciente que no recibe el
// recordatorio y deja de cargar.
//
// Lo mismo con el otro camino por el que llegan: si abrieron el enlace desde
// WhatsApp o Instagram están en el navegador de esa app, donde la opción no
// aparece nunca. Decir solo "tiene que ser Safari" no alcanza; hay que decir
// cómo salir de ahí.

const C = require('./comun');
const r = C.crearReporte('Instalar en un iPhone nuevo');

const app = C.leerApp();

const guia = app.slice(app.indexOf('function showIOSInstallGuide(){'),
                       app.indexOf('function showIOSInstallGuide(){') + 6000);
const ios = guia.slice(guia.indexOf('? \'<div style="background:#fff7ed'),
                       guia.indexOf('isSafariDesktop()'));

r.seccion('El primer paso es el que cambió:');

r.ok(/tocá <strong>···<\/strong>/.test(ios),
     'se empieza por el menú de la página, que es lo que se ve en iOS 26');
r.ok(/Si en vez de eso ves directamente una flecha para compartir/.test(ios),
     'y el camino viejo sigue sirviendo para quien tenga la barra clásica');
// Mandar a "el botón Compartir de la barra" como primer paso es exactamente
// lo que dejó a la paciente mirando el ícono de pestañas.
r.ok(!/step\(1,'Tocá el botón <strong>Compartir<\/strong>/.test(ios),
     'y ya no se da por sentado que Compartir está a la vista');

r.seccion('Los pasos que faltaban:');

r.ok(/Editar acciones/.test(ios),
     'si "Agregar a inicio" no está en la hoja, se agrega desde Editar acciones');
r.ok(/Ajustes → Apps → Safari/.test(ios) && /Compacto/.test(ios),
     'y hay cómo devolver el botón a la barra, para quien no encuentre los ···');

r.seccion('Y el otro motivo por el que la opción no aparece:');

r.ok(/WhatsApp o Instagram/.test(ios),
     'el navegador embebido de otra app');
r.ok(/Abrir en Safari/.test(ios),
     'con la salida concreta, no solo "tiene que ser Safari"');

r.seccion('Sigue estando el porqué:');

// Sin esto el instructivo es un trámite y se saltea.
r.ok(/solo funcionan si agregás la app a la pantalla de inicio/.test(ios),
     'que en iPhone las notificaciones dependen de esto');
r.ok(/aceptá las notificaciones cuando te las pida/.test(ios),
     'y que hay que abrirla DESDE el ícono para que las pida');

r.cerrar('Un instructivo que describe una pantalla que ya no existe se lee como una app que no funciona.');
