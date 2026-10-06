// "Se me desactivaron los botones de Métricas, TCC-I, Directorio y Mi perfil."
//
// No estaban desactivados. El panel estaba en un estado que no significa
// nada, y en ese estado el CSS esconde TODO lo que esos botones pintan.
//
// El layout de dos columnas se decide con tres clases en el body:
//
//     dr-desktop         hay dos columnas
//     dr-tab-patients    la columna izquierda muestra la lista
//     dr-metrics-view    la columna derecha muestra métricas/perfil/avisos
//
// Y el CSS dice:
//
//     body.dr-desktop:not(.dr-tab-patients) #screen-doctor-home{display:none}
//     body.dr-desktop.dr-metrics-view #dr-metrics-desktop{display:block}
//
// Con dr-desktop puesto y NINGUNA de las otras dos, la lista se esconde por
// el :not y el panel no aparece porque le falta su clase. Queda la barra de
// arriba intacta sobre una pantalla vacía que dice "Seleccioná un paciente
// de la lista" — sin lista. Reproducido en producción (mod254).
//
// Cómo se llegaba: las dos clases las pone y las saca showDrTab_, que NO
// corre cuando se sale a TCC-I, al directorio o a admin, porque esos salen
// por otra puerta. Mismo defecto que dm-dir-abierto en mod252: una marca de
// "estoy en tal vista" que solo limpia un camino de los tres.

const C = require('./comun');
const r = C.crearReporte('El panel del profesional no puede quedar en blanco');

const app = C.leerApp();
const css = C.leerCss();

r.seccion('El estado imposible, descripto en el CSS:');

const plano = css.replace(/\s+/g, ' ');
r.ok(/body\.dr-desktop:not\(\.dr-tab-patients\) #screen-doctor-home\{ display:none !important; \}/.test(plano),
     'sin dr-tab-patients, la lista se esconde');
r.ok(/body\.dr-desktop\.dr-metrics-view #dr-metrics-desktop\{ display:block/.test(plano),
     'y el panel derecho pide dr-metrics-view para aparecer');

r.seccion('Al salir de doctor-home, las dos marcas mueren:');

const bloque = app.slice(app.indexOf("classList.toggle('dm-dir-abierto'"),
                         app.indexOf("classList.toggle('dm-dir-abierto'") + 2000);
r.ok(/if\(id !== 'doctor-home'\)\{/.test(bloque),
     'se limpian según la pantalla, en showScreen, que corre siempre');
r.ok(/remove\('dr-metrics-view'\)/.test(bloque), 'dr-metrics-view');
r.ok(/remove\('dr-tab-patients'\)/.test(bloque), 'dr-tab-patients');

r.seccion('Y al entrar, nunca las dos apagadas:');

// Esta es la otra mitad. Limpiarlas al salir, sin un default al entrar,
// CREA el estado en blanco en vez de evitarlo.
r.ok(/!_c\.contains\('dr-tab-patients'\) && !_c\.contains\('dr-metrics-view'\)/.test(bloque),
     'se comprueba que no estén las dos apagadas');
r.ok(/_c\.add\('dr-tab-patients'\)/.test(bloque),
     'y el default es la lista de pacientes');
r.ok(/\}else if\(_isDr\)\{/.test(bloque),
     'solo para el profesional: en el paciente estas clases no existen');

r.seccion('Si aun así no se ve nada, el botón lo dice y se destraba:');

const nav = app.slice(app.indexOf('function dmTopbarGo(tab){'),
                      app.indexOf('function dmTopbarToggleMenu'));
// El chequeo anterior solo miraba si la pantalla estaba ACTIVA. Estaba
// activa: lo que no estaba era visible.
r.ok(/offsetParent !== null/.test(nav),
     'no alcanza con que la pantalla esté activa: se mira si se VE');
r.ok(/getBoundingClientRect\(\)\.height > 20/.test(nav),
     'con alto real, no con una clase');
r.ok(/quedó invisible/.test(nav) && /dmEstadoPanel\(\)/.test(nav),
     'y lo registra con el estado completo del panel, no solo del body');
r.ok(/dmResetPanel\(\)/.test(nav) && /showDrTab\(tab===/.test(nav),
     'se destraba Y reintenta: sacar dos clases y quedarse ahí no alcanzaba');

r.seccion('Y hay cómo diagnosticarlo sin abrir la consola:');

// Tres veces en dos días apareció el mismo síntoma y las tres tuve que
// adivinar, porque desde afuera una pantalla escondida y un botón roto se
// ven igual.
r.ok(/function dmEstadoPanel\(\)\{/.test(app), 'hay una función que resume el estado');
['screen-doctor-home', 'dr-metrics-desktop', 'screen-doctor-patient',
 'dr-desktop-placeholder', 'dr-content-side'].forEach(function (id) {
  r.ok(app.slice(app.indexOf('function dmEstadoPanel')).indexOf(id) > 0 &&
       app.slice(app.indexOf('function dmEstadoPanel')).indexOf(id) < 1400, '  mide ' + id);
});
r.ok(/function dmResetPanel\(\)\{/.test(app), 'y una salida de emergencia');
r.ok(/Destrabar la vista/.test(app) && /Copiar diagnóstico/.test(app),
     'las dos, a mano, desde el menú del avatar');

r.cerrar('Un estado que no significa nada no puede existir: el CSS lo interpreta igual.');
