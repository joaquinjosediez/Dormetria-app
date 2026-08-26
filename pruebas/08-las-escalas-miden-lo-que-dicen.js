// Las escalas tienen que declarar lo que realmente miden.
//
// ESTA PRUEBA NACIÓ DE UN ERROR CLÍNICO, NO DE UNO TÉCNICO.
//
// El DBAS-16 tenía ítems de 0 a 6 —máximo real 96— pero los cortes de
// interpretación eran 80 y 120, heredados de cuando los ítems iban de 0 a 10.
// Con un máximo de 96, la banda "creencias disfuncionales severas" (>120) era
// literalmente inalcanzable, y alguien que contestaba 80 sobre 96 —el 83% del
// máximo posible— aparecía clasificado como "sin creencias disfuncionales".
//
// Al escribirla apareció que no era un caso aislado: otras nueve escalas
// declaraban un tope que no coincidía con sus preguntas. El FSFI decía 36 y
// suma 90. Ninguna de esas nueve clasificaba mal, pero el "42/36" que veía el
// profesional no significaba nada.

const C = require('./comun');
const r = C.crearReporte('Las escalas miden lo que dicen');

const ctx = C.appEvaluada();
if (!ctx) { console.log('  La app no arranca.'); process.exitCode = 1; return; }
const { corr } = C.conDom(ctx);
const SCALES = corr('SCALES');

r.seccion('Ninguna escala puede mostrar un máximo que no se pueda alcanzar:');
SCALES.forEach(e => {
  if (!e.qs || !e.qs.length || e.max == null || e.customScore) return;
  const max = e.qs.reduce((a, q) => a + Math.max.apply(null, q.sc), 0);
  // Lo que importa es lo que SE MUESTRA. Si la declaración no coincide con
  // las preguntas, dmMaxReal la corrige: lo que se comprueba es eso.
  const mostrado = corr('dmMaxReal(SCALES.find(x=>x.id===' + JSON.stringify(e.id) + '))');
  r.ok(mostrado === max, e.id + ': muestra el máximo real',
       'muestra ' + mostrado + ', suma ' + max + (max !== e.max ? ' (declaraba ' + e.max + ')' : ''));
});

r.seccion('Y todas las bandas de interpretación tienen que ser alcanzables:');
SCALES.forEach(e => {
  if (!e.qs || !e.qs.length || typeof e.interp !== 'function' || e.customScore) return;
  const min = e.qs.reduce((a, q) => a + Math.min.apply(null, q.sc), 0);
  const max = e.qs.reduce((a, q) => a + Math.max.apply(null, q.sc), 0);
  const vistas = new Set();
  for (let v = min; v <= max; v++) {
    try { const i = e.interp(v); if (i && i.l) vistas.add(i.l); } catch (_) {}
  }
  // Recorriendo TODO el rango posible tienen que aparecer al menos dos
  // categorías: si sale una sola, la escala no distingue nada.
  r.ok(vistas.size >= 2, e.id + ': distingue más de una categoría',
       [...vistas].join(' · '));
});

r.seccion('Las dos que se corrigieron:');
const psas = SCALES.find(x => x.id === 'psas');
r.ok(psas.qs.length === 16, 'el PSAS tiene los 16 ítems validados', psas.qs.length);
r.ok(psas.subescalas && psas.subescalas.cognitiva.length === 8 &&
     psas.subescalas.somatica.length === 8,
     'con ocho cognitivos y ocho somáticos',
     psas.subescalas ? psas.subescalas.cognitiva.length + ' y ' + psas.subescalas.somatica.length : 'sin subescalas');

const dbas = SCALES.find(x => x.id === 'dbas');
r.ok(dbas.qs.length === 16, 'el DBAS tiene 16 ítems', dbas.qs.length);
r.ok(dbas.qs.every(q => q.sc.length === 11), 'cada ítem va de 0 a 10, como el publicado');
r.ok(dbas.qs.some(q => q.sc[0] > q.sc[q.sc.length - 1]), 'con el ítem invertido que lleva');
// El corte publicado es una media de 3,8 por ítem → 60,8 sobre 160.
r.ok(/rango esperable/.test(dbas.interp(16 * 3).l), 'media 3,0 → rango esperable');
r.ok(!/rango esperable/.test(dbas.interp(16 * 4).l), 'media 4,0 → ya no lo es');
r.ok(/marcadas/.test(dbas.interp(16 * 6).l), 'media 6,0 → creencias marcadas');

r.seccion('Lo cargado con las escalas viejas queda marcado:');
// En la base conviven dos versiones de cada una. Mezclarlas en un gráfico de
// evolución mostraría una mejoría o un empeoramiento que nunca ocurrió.
const viejo = { scale_id: 'dbas', created_at: '2026-08-01T10:00:00Z', score: 60 };
const nuevo = { scale_id: 'dbas', created_at: '2026-09-01T10:00:00Z', score: 60 };
const otra  = { scale_id: 'isi',  created_at: '2026-08-01T10:00:00Z', score: 12 };
r.ok(ctx.dmEscalaVieja(viejo) === true, 'un DBAS anterior al cambio se marca');
r.ok(ctx.dmEscalaVieja(nuevo) === false, 'uno posterior no');
r.ok(ctx.dmEscalaVieja(otra) === false, 'y las escalas que no cambiaron tampoco');
r.ok(/escala anterior/.test(ctx.dmMarcaEscalaVieja(viejo)), 'la etiqueta lo dice con todas las letras');
r.ok(ctx.dmMarcaEscalaVieja(nuevo) === '', 'y no aparece donde no corresponde');

const html = C.leerHtml();
r.ok(/dmEscalaVieja\(_prev\) \|\| dmEscalaVieja\(r\)/.test(html),
     'la comparación antes/ahora se corta si cruza dos versiones');

r.cerrar('Las escalas declaran lo que miden y lo viejo no se mezcla con lo nuevo.');
