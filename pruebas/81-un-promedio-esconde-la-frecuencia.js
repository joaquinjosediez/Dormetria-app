// "Me pone fragmentación 96 % pero en el actograma lo veo muy fragmentado, y
//  en el resumen me pone dentro de parámetros normales."
//
// Dos defectos distintos, los dos del mismo tipo: el número que se muestra no
// sale de los mismos datos que el dibujo de al lado.
//
// ── 1 · El pilar tenía TRES implementaciones ──────────────────────────
// mod278 arregló dos y dejó la tercera, la de la vista del profesional, que
// seguía siendo `20 - despertares*5`. Eso está en pruebas/79.
//
// ── 2 · El motor miraba sólo el PROMEDIO ──────────────────────────────
// Esta prueba. El comentario del propio motor cita Lichstein 2003 entero
// —"latencia o WASO ≥31 min, ≥3 noches por semana"— y el código usaba sólo
// la primera mitad. Catorce noches: ocho de 8 min de vigilia y seis de 45.
// El promedio da 24 y el motor contestaba "dentro de límites normales".
// Pero seis noches de cada catorce por encima del corte son tres por
// semana, que es el criterio, y el actograma al lado las dibuja.
//
// El criterio de frecuencia no es un agregado de la app: es parte de la
// definición. La ICSD-3 y el DSM-5 piden ≥3 noches por semana, igual que
// Lichstein. Un promedio sobre dos semanas puede cumplir el umbral de
// minutos y fallar el de frecuencia, o al revés — y hasta ahora la app sólo
// sabía mirar uno de los dos.

const C = require('./comun');
const vm = require('vm');
const fs = require('fs');
const path = require('path');
const r = C.crearReporte('Un promedio esconde la frecuencia');

const motor = fs.readFileSync(
  path.join(__dirname, '..', 'js', 'dormetria-motor-orientacion.js'), 'utf8');

r.seccion('El criterio está escrito, no sólo citado:');

r.ok(/const MIN_FREC = 5, UMBRAL_FREC = 3 \/ 7;/.test(motor),
     '≥3 noches de cada 7');
// Con tres noches, una sola mala ya da 33 % y eso no es una frecuencia.
r.ok(/MIN_FREC = 5/.test(motor),
     'y hace falta un mínimo de 5 noches con el dato para hablar de frecuencia');
r.ok(/nWaso\+\+; if \(waso > 30\) nWasoAlto\+\+;/.test(motor),
     'el denominador incluye las noches buenas');
r.ok(/Lichstein 2003/.test(motor), 'con la fuente');
// Sobre un WASO que sale de una resta, contar noches es contar errores de
// redondeo: la frecuencia sólo vale cuando el paciente lo registró.
r.ok(/sólo cuenta cuando el WASO está REGISTRADO/.test(motor),
     'y no se aplica sobre el WASO derivado');

r.seccion('Y corriendo el motor:');

const ctx = C.appEvaluada();
r.ok(!!ctx, 'la app se evalúa entera');

if (ctx) {
  // `patron(n)` devuelve la noche n-ésima. Así cada caso se lee como lo que
  // es: una secuencia de noches, no un promedio.
  const serie = function (patron, n) {
    const o = [];
    for (let i = 0; i < (n || 14); i++) {
      const p = patron(i);
      const lat = p.lat, waso = p.waso;
      o.push({
        diary_date: new Date(Date.UTC(2026, 9, 1 + i)).toISOString().slice(0, 10),
        bedtime: '23:30', wake_time: '07:30', get_up_time: '07:40',
        sleep_minutes: 480 - lat - waso,
        sleep_latency_mins: lat, awakenings: waso > 0 ? 1 : 0,
        wake_in_bed_mins: waso, sleep_quality: 3, day_type: 'work'
      });
    }
    return o;
  };
  const corre = function (d) {
    ctx.__d = d;
    return vm.runInContext('dmMotorOrientacion([], __d, {email:"x@y.com"})', ctx,
                           { timeout: 20000 });
  };

  // ── El caso que se reportó ──
  // 6 noches de 45 min y 8 de 8. Promedio ~24: bajo el umbral. Frecuencia
  // 6/14 = 3 por semana: en el umbral.
  const esconde = serie(i => (i % 7 < 3) ? { lat: 8, waso: 45 } : { lat: 8, waso: 8 });
  const media = esconde.reduce((a, e) => a + e.wake_in_bed_mins, 0) / esconde.length;
  r.ok(media <= 35, 'el promedio de vigilia queda bajo el umbral de 30-35 min',
       Math.round(media) + ' min');
  const res = corre(esconde);
  r.ok(!/dentro de límites normales/i.test(res.orientacion.texto),
       'y aun así ya no se llama normal', res.orientacion.texto);
  r.ok(/mantenimiento|mixto/i.test(res.orientacion.texto),
       'se reconoce como patrón de mantenimiento');
  // Lo que se muestra tiene que explicar por qué, o se lee como un error.
  r.ok(/criterio también es de frecuencia/.test(res.orientacion.base),
       'y el texto dice que lo dispara la frecuencia, no el promedio');
  r.ok(/\d+ de 14 noches con más de 30 min/.test(res.orientacion.base),
       'con las noches contadas', (res.orientacion.base.match(/\d+ de \d+ noches[^.]*/) || [''])[0]);

  // ── Lo mismo del lado de la latencia ──
  const latEsconde = serie(i => (i % 7 < 3) ? { lat: 45, waso: 5 } : { lat: 8, waso: 5 });
  const resL = corre(latEsconde);
  r.ok(/conciliación|mixto/i.test(resL.orientacion.texto),
       'tres noches por semana tardando 45 min también cuentan',
       resL.orientacion.texto);

  // ── Y lo que NO tiene que cambiar ──
  const sano = serie(() => ({ lat: 10, waso: 5 }));
  r.ok(/dentro de límites normales/i.test(corre(sano).orientacion.texto),
       'un diario parejo y bueno sigue siendo normal');
  // Una sola mala noche no es una frecuencia. 1 de 14 = 7 %.
  const unaMala = serie(i => (i === 3) ? { lat: 8, waso: 90 } : { lat: 8, waso: 5 });
  r.ok(/dentro de límites normales|alteraciones leves/i.test(corre(unaMala).orientacion.texto),
       'y una sola mala noche en catorce no enciende nada',
       corre(unaMala).orientacion.texto);
  // Dos de siete son 29 %: por debajo del umbral.
  const dosDeSiete = serie(i => (i % 7 < 2) ? { lat: 8, waso: 45 } : { lat: 8, waso: 5 });
  const rd = corre(dosDeSiete);
  r.ok(!/mantenimiento/i.test(rd.orientacion.texto),
       'dos noches de cada siete tampoco: el corte son tres', rd.orientacion.texto);
  // Y con pocas noches no se infiere una frecuencia.
  const pocas = serie(i => (i < 2) ? { lat: 8, waso: 45 } : { lat: 8, waso: 5 }, 4);
  r.ok(!/mantenimiento/i.test(corre(pocas).orientacion.texto),
       'con 4 noches cargadas no se habla de frecuencia');

  // ── El promedio sigue valiendo por sí solo ──
  // Si TODAS las noches están justo arriba del umbral, la frecuencia no
  // aporta nada nuevo y el promedio tiene que seguir alcanzando.
  const parejoMalo = serie(() => ({ lat: 10, waso: 45 }));
  r.ok(/mantenimiento/i.test(corre(parejoMalo).orientacion.texto),
       'y el promedio alto sigue alcanzando por sí solo');
}

r.cerrar('El insomnio se define por cuántas noches, no sólo por cuántos minutos en promedio.');
