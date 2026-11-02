// "Si alguno dio un valor fuera de rango, que automáticamente le sugiera
//  contestarlo de nuevo. Y desde el perfil profesional que haya un botón
//  que apretándolo automáticamente se le sugieran esas, que no impliquen
//  más pasos que eso."
//
// Parte ya existía y parte no, y lo que existía tenía un defecto de fondo:
// un intervalo único para todas las escalas.
//
// ── Por qué 30 días para todo está mal ───────────────────────────────
//
// Lo que decide cada cuánto se puede repetir un cuestionario es su VENTANA
// DE RECUERDO. Dos tomas que se pisan dentro de la misma ventana no son
// dos medidas: son la misma pregunta hecha dos veces.
//
//   · ISI, PHQ-9, GAD-7 preguntan por las últimas 2 semanas → 14 días.
//   · PSQI pregunta por el último MES → 30 es el mínimo, no una
//     preferencia: antes de eso las dos tomas se superponen.
//   · STOP-BANG se arma con IMC, perímetro cervical, edad y sexo. No se
//     mueve en un mes. Pedirlo cada cuatro semanas es ruido que enseña a
//     ignorar los avisos → 180 días.
//   · MEQ y MCTQ son cronotipo, que es un rasgo → no se repiten solas.
//
// ── Y una sola lista para los dos lados ──────────────────────────────
//
// El aviso del paciente y el botón del profesional salen de la MISMA
// función. Si fueran dos, el paciente podría recibir un pedido que su
// profesional no hizo, o al revés — y ninguno de los dos se enteraría.

const C = require('./comun');
const vm = require('vm');
const fs = require('fs');
const path = require('path');
const r = C.crearReporte('Repetir los cuestionarios alterados');

const app = C.leerApp();

r.seccion('Cada escala tiene su intervalo, y está justificado:');

r.ok(/var DM_REPETIR_DIAS = \{/.test(app), 'hay una tabla de intervalos');
r.ok(/VENTANA DE RECUERDO/.test(app), 'con el criterio escrito');
r.ok(/isi:14, phq9:14, gad7:14/.test(app), 'las de 2 semanas, a los 14 días');
r.ok(/psqi:30/.test(app), 'PSQI a los 30, que es su ventana');
r.ok(/stopbang:180/.test(app), 'STOP-BANG a los 180: no se mueve en un mes');
r.ok(/meq:null, mctq:null/.test(app), 'y el cronotipo no se repite solo');
r.ok(/null = no se vuelve a pedir autom/.test(app), 'con el null documentado');

r.seccion('Una sola lista para el paciente y para el profesional:');

r.ok(/function dmEscalasARepetir\(recs\)\{/.test(app), 'dmEscalasARepetir');
r.ok(/Una sola función para los dos lados/.test(app), 'y queda escrito por qué');
// Ordenadas por antigüedad: la más vieja es la que peor se lee como "el
// estado de hoy".
r.ok(/out\.sort\(function\(a,b\)\{ return b\.dias - a\.dias; \}\)/.test(app),
     'primero la más vieja');

r.seccion('Lo que ve el paciente:');

const mp = app.slice(app.indexOf('async function maybePromptReevalScales(){'),
                     app.indexOf('function dmCerrarReeval(scaleId){'));
r.ok(/dmEscalasARepetir\(recs\)/.test(mp), 'sale de la lista compartida');
r.ok(!/cutoff/.test(mp), 'y ya no hay un corte de 30 días para todas');
// El texto que pidió, y la razón de cada parte.
r.ok(/completaste este cuestionario y dio/.test(mp), 'dice cuándo lo contestó y qué dio');
r.ok(/comparar como estas ahora y ver tu progreso/.test(mp),
     'y para qué sirve repetirlo, que es lo único que a la persona le importa');
r.ok(/Son unos minutos/.test(mp), 'y cuánto cuesta');
r.ok(/mas para repetir cuando puedas/.test(mp),
     'si hay más de uno, lo menciona sin abrumar');
// Uno por vez: tres avisos juntos se cierran los tres sin leer ninguno.
r.ok(/Uno por vez/.test(mp), 'se muestra uno por vez');
r.ok(/7\*86400000/.test(mp), 'y si lo cierra, no vuelve por una semana');

r.seccion('Y el botón del profesional no tiene pasos intermedios:');

r.ok(/async function dmSugerirRepeticiones\(btn\)\{/.test(app), 'dmSugerirRepeticiones');
r.ok(/const lista = dmEscalasARepetir\(recs\|\|\[\]\)/.test(app),
     'usa la misma lista que el paciente');
// dmPedirEscala sólo tildaba la casilla: había que ir a otra pestaña y
// apretar Enviar. Eso es lo que el pedido decía que no quería.
r.ok(/TILDABA la/.test(app), 'queda escrito qué hacía el camino anterior');
r.ok(/doctor_suggestions'/.test(app) && /method:'POST'/.test(app),
     'y manda las sugerencias directo');
r.ok(/if\(pendientes\.has\(String\(it\.scaleId\)\)\)\{ yaEstaban\+\+; continue; \}/.test(app),
     'sin duplicar las que ya estaban pendientes');
// El mensaje viaja con el pedido: el paciente ve por qué se lo piden.
r.ok(/message: 'La completaste '\+dmHaceCuanto/.test(app),
     'con el motivo adentro del pedido, no una tarea suelta');
r.ok(/if\(fallaron\) toast/.test(app), 'y si alguna falla, se dice');

r.seccion('El botón aparece donde están las escalas alteradas:');

const res = fs.readFileSync(
  path.join(__dirname, '..', 'js', 'dormetria-render-resumen.js'), 'utf8');
r.ok(/dmSugerirRepeticiones\(this\)/.test(res), 'en la tarjeta de cuestionarios');
r.ok(/if \(_repetibles\.length > 1\)/.test(res),
     'y sólo si hay más de una: con una sola, el botón de la fila alcanza');
r.ok(/const _cada = \(typeof dmRepetirCada === 'function'\)/.test(res),
     'y el aviso por fila también usa el intervalo de esa escala');
r.ok(!/dias >= 60;/.test(res), 'ya no hay un 60 para todas');

r.seccion('Corriéndolo:');

const ctx = C.appEvaluada();
r.ok(!!ctx, 'la app se evalúa entera');
if (ctx) {
  const haceDias = function (d) { return new Date(Date.now() - d * 86400000).toISOString(); };
  const corre = function (recs) {
    ctx.__r = recs;
    return vm.runInContext('dmEscalasARepetir(__r)', ctx);
  };
  // ISI 22 = insomnio grave, hace 20 días. Su intervalo son 14.
  const isi = corre([{ scale_id: 'isi', score: 22, created_at: haceDias(20) }]);
  r.ok(isi.length === 1 && isi[0].scaleId === 'isi',
       'un ISI alterado de hace 20 días entra', JSON.stringify(isi.map(x => x.scaleId)));
  // A los 10 días todavía no.
  r.ok(corre([{ scale_id: 'isi', score: 22, created_at: haceDias(10) }]).length === 0,
       'y a los 10 días todavía no: su ventana son 2 semanas');
  // PSQI a los 20 tampoco: su ventana es el mes.
  r.ok(corre([{ scale_id: 'psqi', score: 14, created_at: haceDias(20) }]).length === 0,
       'un PSQI a los 20 días no: su ventana es el último mes');
  r.ok(corre([{ scale_id: 'psqi', score: 14, created_at: haceDias(40) }]).length === 1,
       'a los 40 sí');
  // STOP-BANG alterado al mes: no se pide. Es anatomía, no estado.
  r.ok(corre([{ scale_id: 'stopbang', score: 6, created_at: haceDias(45) }]).length === 0,
       'un STOP-BANG de hace 45 días no se vuelve a pedir');
  // Cronotipo: nunca.
  r.ok(corre([{ scale_id: 'meq', score: 20, created_at: haceDias(400) }]).length === 0,
       'y el cronotipo no se repite ni al año: es un rasgo');
  // Lo que dio normal no se pide de nuevo.
  r.ok(corre([{ scale_id: 'isi', score: 3, created_at: haceDias(90) }]).length === 0,
       'y lo que dio dentro de rango no se repite solo');
  // Sólo la última toma de cada escala cuenta.
  const dos = corre([{ scale_id: 'isi', score: 22, created_at: haceDias(90) },
                     { scale_id: 'isi', score: 4,  created_at: haceDias(5) }]);
  r.ok(dos.length === 0,
       'si la repitió hace poco y dio bien, no se vuelve a pedir por la vieja');
  // Orden: la más vieja primero.
  const varias = corre([{ scale_id: 'isi',  score: 22, created_at: haceDias(30) },
                        { scale_id: 'phq9', score: 20, created_at: haceDias(200) }]);
  r.ok(varias.length === 2 && varias[0].scaleId === 'phq9',
       'y vienen ordenadas, la más vieja primero',
       varias.map(x => x.scaleId + ':' + x.dias).join(' '));

  // El texto en palabras, no en días sueltos.
  const hc = function (d) { ctx.__d = d; return vm.runInContext('dmHaceCuanto(__d)', ctx); };
  r.ok(hc(32) === 'hace un mes', '"hace un mes", no "hace 32 días"', hc(32));
  r.ok(hc(12) === 'hace 12 días', 'y en días cuando son pocos', hc(12));
  r.ok(hc(95) === 'hace 3 meses', hc(95));
}

r.cerrar('Dos tomas dentro de la misma ventana de recuerdo no son dos medidas: son la misma pregunta hecha dos veces.');

// ── El detector de "fuera de rango" ───────────────────────────────────
//
// Esto decidía olfateando el hex del FONDO:
//
//     /^(#fee|#fef[23]|#fff[a-f0-9]b)/i.test(interp.bg)
//
// Y ya estaba fallando antes de este cambio. La banda más grave del PHQ-9
// —"Depresión severa", a partir de 20 sobre 27— tiene bg #fecaca, que no
// entra en ese patrón: el aviso de reevaluación NUNCA se mostró para la
// depresión severa. Justamente la que más conviene volver a medir.
//
// Adivinar severidad desde un pastel de fondo es frágil por construcción.
// El color de TEXTO es la señal semántica y usa una paleta chica.
const rc = C.crearReporte('Fuera de rango no se adivina por el fondo');
rc.seccion('Se decide por el color de texto, que es el semántico:');
rc.ok(/var DM_COLOR_NORMAL = \[/.test(app), 'hay una lista de verdes');
rc.ok(/var DM_COLOR_ALTERADO = \[/.test(app), 'una de ámbares y rojos');
rc.ok(/var DM_COLOR_DESCRIPTIVO = \[/.test(app),
      'y una de descriptivas, donde no hay "peor"');
// Sin los comentarios: el porqué del arreglo CITA la expresión vieja, y
// buscarla en crudo la encuentra en la explicación de por qué se fue.
const appCodigo = app.split('\n').filter(function (l) {
  return !/^\s*\/\//.test(l);
}).join('\n');
rc.ok(!/#fef\[23\]/.test(appCodigo), 'y se fue el olfateo del fondo');
// Estaba en TRES lugares, no en uno. Uno de ellos es el resumen que se le
// manda al profesional: con el olfateo, una depresión severa no figuraba.
rc.ok((appCodigo.match(/dmEscalaAlterada\(/g) || []).length >= 4,
      'y los tres lugares que preguntaban por su cuenta ahora llaman a la función',
      (appCodigo.match(/dmEscalaAlterada\(/g) || []).length + ' llamadas');
rc.ok(/color sin clasificar/.test(app),
      'un tono nuevo deja constancia en vez de clasificarse mal en silencio');

rc.seccion('Y se barren TODAS las bandas de TODAS las escalas:');
// Una prueba que mira un caso no habría encontrado el PHQ-9. Ésta recorre
// cada puntaje posible de cada escala: si alguien agrega una banda con un
// tono nuevo, falla acá y no en un paciente.
if (ctx) {
  const barrido = vm.runInContext(`(function(){
    const sinClasificar = {}, severas = [];
    SCALES.forEach(function(s){
      if(typeof s.interp!=='function' || !s.max) return;
      for(var v=0; v<=s.max; v++){
        var i; try{ i=s.interp(v); }catch(e){ continue; }
        if(!i || !i.c) continue;
        var c=String(i.c).toLowerCase();
        if(DM_COLOR_NORMAL.indexOf(c)<0 && DM_COLOR_ALTERADO.indexOf(c)<0 &&
           DM_COLOR_DESCRIPTIVO.indexOf(c)<0){ sinClasificar[c]=(sinClasificar[c]||0)+1; }
      }
      // En varias escalas MAS puntaje es MEJOR (MEQ, PDSS, IIEF, FSFI,
      // PROMIS-GH), asi que mirar s.interp(s.max) no sirve: lo que tiene
      // que cumplirse es que toda escala con bandas de severidad tenga AL
      // MENOS UNA que se lea como alterada. Si no, hay un instrumento
      // entero que el aviso de reevaluacion no ve — que es exactamente lo
      // que pasaba con el PHQ-9.
      // Instrumentos que CLASIFICAN en vez de graduar: no tienen banda
      // alterada y no deben tenerla. meq y mctq son cronotipo. cctq y mesc
      // son andamios deshabilitados a la espera de licencia escrita
      // (Werner, Kinderspital Zurich; Carskadon, Brown) y no se activan.
      if(['meq','mctq','cctq','mesc'].indexOf(s.id)>=0) return;
      var algunaAlterada=false, algunaSeveridad=false;
      for(var w=0; w<=s.max; w++){
        var j; try{ j=s.interp(w); }catch(e){ continue; }
        if(!j || !j.c) continue;
        var cc=String(j.c).toLowerCase();
        if(DM_COLOR_DESCRIPTIVO.indexOf(cc)>=0) continue;
        algunaSeveridad=true;
        if(dmEscalaAlterada(j)) algunaAlterada=true;
      }
      if(algunaSeveridad && !algunaAlterada) severas.push(s.id);
    });
    return { sinClasificar: Object.keys(sinClasificar), severas: severas };
  })()`, ctx);
  rc.ok(barrido.sinClasificar.length === 0,
        'ningún color de ninguna banda queda sin clasificar',
        barrido.sinClasificar.join(' '));
  // Éste es el que habría agarrado el PHQ-9 el primer día.
  rc.ok(barrido.severas.length === 0,
        'y toda escala con bandas de severidad tiene al menos una que se lee como alterada',
        barrido.severas.join(' · '));
  const phq = vm.runInContext("dmEscalaAlterada(SCALES.find(s=>s.id==='phq9').interp(20))", ctx);
  rc.ok(phq === true, 'el PHQ-9 severo, que era el que se escapaba, ahora entra');
  const meq = vm.runInContext("dmEscalaAlterada(SCALES.find(s=>s.id==='meq').interp(20))", ctx);
  rc.ok(meq === false, 'y el cronotipo sigue sin ser "alterado": es descriptivo');
}
rc.cerrar('Una prueba que mira un caso no habría encontrado el PHQ-9: hay que barrer todas las bandas.');
