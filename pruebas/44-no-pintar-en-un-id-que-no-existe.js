// Tres veces seguidas el mismo bicho:
//
//   · mod216 — loadConsultRequests() pintaba en 'doctor-list'. Ese id no
//     existe. La solicitud de consulta del paciente no llegaba a ningún
//     lado, y no había ni un error en consola.
//   · mod227 — el panel Material leía con .catch(()=>[]) y se dibujaba
//     entero aunque no pudiera guardar nada.
//   · mod228/229 — loadPatientEducation() pinta en 'home-edu-card'. Ese id
//     TAMPOCO existía. El profesional asignaba, la fila se guardaba bien, y
//     el paciente no veía nada.
//
// El patrón es siempre el mismo y siempre silencioso:
//
//     const el = document.getElementById('algo');
//     if (!el) return;
//
// Es la guarda correcta para un elemento opcional y es una trampa para uno
// obligatorio: la función se rinde sin dejar rastro, y el síntoma que se ve
// —"no aparece"— no apunta para nada al código que falló.
//
// Esta prueba no arregla la deuda que ya existe: la congela. Los 62 ids
// huérfanos de hoy están anotados en ids-huerfanos-conocidos.json. Si
// aparece uno NUEVO, la suite falla.

const C = require('./comun');
const fs = require('fs');
const path = require('path');
const r = C.crearReporte('No pintar en un id que no existe');

const txt = C.leerApp();

const pedidos = new Set(
  [...txt.matchAll(/getElementById\(\s*['"]([A-Za-z][\w:-]*)['"]\s*\)/g)].map(m => m[1]));
// Un id "existe" si en ALGÚN lado se escribe: en el HTML estático, dentro
// de un string que después va a innerHTML, o asignado con .id = '...'.
const creados = new Set([
  ...[...txt.matchAll(/id=\\?["']([A-Za-z][\w:-]*)/g)].map(m => m[1]),
  ...[...txt.matchAll(/\.id\s*=\s*['"]([A-Za-z][\w:-]*)['"]/g)].map(m => m[1])
]);

const huerfanos = [...pedidos].filter(id => !creados.has(id)).sort();
const conocidos = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'ids-huerfanos-conocidos.json'), 'utf8'));

r.seccion('El que originó esta prueba:');

r.ok(creados.has('home-edu-card'),
     "'home-edu-card' existe en el HTML — sin esto el material asignado no se muestra");
const i = txt.indexOf('async function loadPatientEducation(');
r.ok(/falta #home-edu-card en el HTML/.test(txt.slice(i, i + 700)),
     'y si vuelve a desaparecer, lo dice en la consola en vez de rendirse mudo');

r.seccion('La deuda que ya había, congelada:');

r.ok(conocidos.length > 0, conocidos.length + ' ids huérfanos anotados como deuda conocida');

const nuevos = huerfanos.filter(id => conocidos.indexOf(id) < 0);
r.ok(nuevos.length === 0,
     'ningún id huérfano NUEVO' +
     (nuevos.length ? ' — apareció: ' + nuevos.join(', ') : ''));

const arreglados = conocidos.filter(id => huerfanos.indexOf(id) < 0);
if (arreglados.length) {
  r.seccion('Y se arreglaron algunos, así que hay que sacarlos de la lista:');
  r.ok(false,
       'ya no son huérfanos: ' + arreglados.join(', ') +
       ' — sacalos de pruebas/ids-huerfanos-conocidos.json para que la lista no se afloje');
}

r.cerrar('`if (!el) return;` es correcto para lo opcional y una trampa para lo obligatorio.');
