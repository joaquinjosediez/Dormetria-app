// "Pacientes que por el diario no tienen insomnio pero toman medicación para
// dormir siguen siendo insomnes."
//
// Como regla general es demasiado fuerte —la quetiapina de alguien con
// trastorno bipolar y la de alguien que no duerme se escriben igual en el
// diario, y la app no puede saber la indicación— pero el defecto que señala
// es real y es el peor de los que tenía el motor:
//
//     Un diario que da normal BAJO un hipnótico no describe el sueño de la
//     persona: describe su sueño TRATADO.
//
// Y la app leía esas métricas al pie de la letra. A alguien que toma zolpidem
// todas las noches le devolvía "Sin indicación de tratamiento para insomnio",
// que es el consejo exactamente al revés: de todos los pacientes, ése es el
// que con más claridad tiene indicación de TCC-I.
//
// Lo que se agrega NO es un diagnóstico. Es la advertencia de que las cifras
// están medidas bajo tratamiento, y una conducta que deja de cerrar el tema.

const C = require('./comun');
const vm = require('vm');
const r = C.crearReporte('Un diario normal bajo hipnótico');

const fs = require('fs');
const path = require('path');
const motor = fs.readFileSync(
  path.join(__dirname, '..', 'js', 'dormetria-motor-orientacion.js'), 'utf8');

r.seccion('Qué cuenta como sedante, y qué no:');

const lista = motor.slice(motor.indexOf('const DM_SEDANTES_SUENO = ['),
                          motor.indexOf('function dmSedantesEnDiario'));
['zolpidem', 'zopiclona', 'clonazepam', 'lorazepam', 'alprazolam',
 'trazodona', 'mirtazapina', 'quetiapina', 'doxepina'].forEach(function (m) {
  r.ok(lista.indexOf("'" + m + "'") > 0, '  ' + m);
});
// La melatonina actúa sobre la FASE, no sobre la continuidad: no borra un
// patrón de insomnio del modo en que lo hace un hipnótico. Y contar el
// magnesio diría "está medicado" de alguien que toma magnesio.
r.ok(lista.indexOf("'melatonina'") < 0, 'la melatonina NO: actúa sobre la fase');
r.ok(lista.indexOf("'magnesio'") < 0 && lista.indexOf("'valeriana'") < 0,
     'ni los suplementos sin efecto hipnótico establecido');
r.ok(/Melatonina y cronobioticos/.test(motor),
     'y está escrito por qué quedan afuera, que es lo que evita que alguien los agregue');

r.seccion('Ocasional no es lo mismo que todas las noches:');

const fn = motor.slice(motor.indexOf('function dmSedantesEnDiario(diarySlice) {'),
                       motor.indexOf('function dmDetectarBenzoDe8Semanas'));
r.ok(/if \(nConDato < 5\) return null/.test(fn),
     'con menos de 5 noches con el dato no se habla de frecuencia');
r.ok(/if \(conSedante \* 2 < nConDato\) return null/.test(fn),
     'y hace falta al menos la mitad de las noches');
// La columna ausente es "no se preguntó"; el array vacío es "no tomó nada".
// Sin esa distinción el denominador miente en las dos direcciones.
r.ok(/if \(!Array\.isArray\(meds\)\) return;\s*nConDato\+\+/.test(fn.replace(/\s+/g, ' ')),
     'y solo cuentan las noches donde el dato está cargado');

r.seccion('Qué dice, y qué NO dice:');

r.ok(/Sueño en rango, pero medido bajo tratamiento farmacológico/.test(motor),
     'el título dice que las cifras están bajo tratamiento');
r.ok(/describen el sueño TRATADO, no el sueño/.test(motor),
     'y por qué eso cambia la lectura');
// Esto es lo que NO puede decir: la app no conoce la indicación.
r.ok(/La app no puede saber para qué está indicado/.test(motor),
     'y que no puede saber si el fármaco es por insomnio o por otro cuadro');
// Las frases largas van partidas entre varias cadenas concatenadas, así que
// buscarlas enteras en el fuente no las encuentra. Se normaliza el espacio.
const txt = motor.replace(/'\s*\+\s*\n?\s*'/g, '').replace(/\s+/g, ' ');
r.ok(/pregunta para la entrevista, no una conclusión del diario/.test(txt),
     'queda como pregunta, no como diagnóstico');
// No toca las etiquetas clínicas: marcar "Insomnio" automáticamente desde
// una inferencia sobre la indicación de un fármaco sería afirmar de más.
r.ok(!/marcar\('insomnio'/.test(motor),
     'y no enciende ninguna etiqueta automática');

r.seccion('La rama que cerraba el tema ya no lo cierra:');

const cond = motor.slice(motor.indexOf('function dmCalcularConducta'),
                         motor.indexOf('function dmQueFaltaParaOrientar'));
r.ok(/if \(normal && !_sedC\)/.test(cond),
     '"sin indicación de tratamiento" solo si NO hay sedante');
r.ok(/if \(normal && _sedC\)/.test(cond),
     'y con sedante hay una rama propia');
r.ok(/no alcanza para descartar insomnio/.test(cond),
     'que dice en qué se apoya: no en un patrón medido, sino en el uso sostenido');
// El marco de ANMAT: informar lo que dicen las guías no es lo mismo que
// indicarle algo a esta persona. El campo `farmaco` ya se había sacado por eso.
const condTxt = cond.replace(/'\s*\+\s*\n?\s*'/g, '').replace(/\s+/g, ' ');
r.ok(/es una decisión de la entrevista/.test(condTxt),
     'y deja la decisión sobre la medicación fuera de la app');
r.ok(!/suspender|retirar|bajar la dosis|discontinuar/i.test(cond),
     'sin indicar nada sobre el fármaco de este paciente');

r.seccion('El estado viaja en el objeto, no en el texto:');

// dmCalcularConducta decidía leyendo `orientacion.texto` con una expresión
// regular. Al reescribir el título, dejaba de reconocer el caso justo en el
// único en que importa.
r.ok(/orientacion\.enRangoBajoSedante = /.test(motor),
     'se marca con una propiedad');
r.ok(/!!\(orientacion && orientacion\.enRangoBajoSedante\)/.test(cond),
     'y la conducta la lee de ahí, no del string que se le muestra al usuario');

r.seccion('Y corriendo el motor de verdad:');

const ctx = C.appEvaluada();
r.ok(!!ctx, 'la app se evalúa entera');
if (ctx) {
  const serie = function (meds, mala, n) {
    const o = [];
    for (let i = 0; i < (n || 14); i++) {
      o.push({ diary_date: new Date(Date.UTC(2026, 9, 1 + i)).toISOString().slice(0, 10),
        bedtime: '23:30', wake_time: mala ? '07:30' : '07:10', get_up_time: '07:30',
        sleep_minutes: mala ? 380 : 455, sleep_latency_mins: mala ? 75 : 9,
        awakenings: mala ? 3 : 0, wake_in_bed_mins: mala ? 55 : 0,
        sleep_quality: 3, day_type: 'work',
        medications: (typeof meds === 'function') ? meds(i) : meds });
    }
    return o;
  };
  const corre = function (d) {
    return vm.runInContext('dmMotorOrientacion([], ' + JSON.stringify(d) + ', {email:"x@y.com"})',
                           ctx, { timeout: 20000 });
  };
  const bandera = function (res) {
    return (res.orientacion.banderas || []).some(function (b) {
      return /farmacol/i.test(b.texto || ''); });
  };

  const zolpi = corre(serie([{ name: 'Zolpidem', dose: '10 mg' }], false));
  r.ok(/bajo tratamiento farmacológico/.test(zolpi.orientacion.texto),
       'diario normal + zolpidem todas las noches: lo dice', zolpi.orientacion.texto);
  r.ok(zolpi.conducta.procede === true && /TCC-I/.test(zolpi.conducta.primeraLinea),
       'y sugiere TCC-I, que era lo que faltaba');
  r.ok(bandera(zolpi), 'con su bandera en el Resumen');

  const limpio = corre(serie([], false));
  r.ok(limpio.conducta.procede === false,
       'diario normal sin medicación: sigue sin indicación');
  r.ok(!bandera(limpio), 'y sin bandera');

  const demanda = corre(serie(function (i) { return i < 3 ? [{ name: 'Zolpidem' }] : []; }, false));
  r.ok(demanda.conducta.procede === false,
       'zolpidem 3 de 14 noches: uso a demanda, no enmascara nada');

  const mela = corre(serie([{ name: 'Melatonina' }], false));
  r.ok(mela.conducta.procede === false && !bandera(mela),
       'melatonina todas las noches: no cuenta');
  const mg = corre(serie([{ name: 'Magnesio' }], false));
  r.ok(mg.conducta.procede === false && !bandera(mg),
       'magnesio tampoco');

  const quet = corre(serie([{ name: 'Quetiapina', dose: '25 mg' }], false));
  r.ok(/bajo tratamiento farmacológico/.test(quet.orientacion.texto),
       'quetiapina sí: se usa para dormir fuera de indicación');

  // Con patrón de insomnio A PESAR del fármaco, el título no se toca: ese
  // hallazgo es más fuerte todavía y ya se ve. Pero la bandera queda.
  const peor = corre(serie([{ name: 'Clonazepam' }], true));
  r.ok(/insomnio/i.test(peor.orientacion.texto),
       'con patrón de insomnio bajo clonazepam, el título sigue siendo el patrón',
       peor.orientacion.texto);
  r.ok(bandera(peor), 'y la bandera igual aparece');

  const sinDato = corre(serie(undefined, false));
  r.ok(sinDato.conducta.procede === false && !bandera(sinDato),
       'sin el dato de medicación cargado no se infiere nada');
  const pocas = corre(serie([{ name: 'Zolpidem' }], false, 4));
  r.ok(pocas.conducta.procede === false,
       'y con 4 noches de dato tampoco: no alcanza para hablar de frecuencia');
}

r.cerrar('Un diario medido bajo tratamiento describe el tratamiento, no a la persona.');
