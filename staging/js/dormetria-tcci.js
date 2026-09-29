// ══════════════════════════════════════════════════════════════════════
//  Dormetria · TCC-I
//  ---------------------------------------------------------------------
//  Terapia cognitivo-conductual para el insomnio: el programa de siete
//  semanas del paciente, el protocolo del lado del profesional, la
//  ventana de sueño y las estadísticas del panel de administrador.
//
//  Sale de index.html por dos motivos concretos, no por prolijidad:
//
//   1. index.html cambió en 30 de las últimas 30 versiones. Cada vez que
//      se publica, cada paciente vuelve a bajar 634 KB comprimidos, aunque
//      lo que cambió no tenga nada que ver con lo que usa. Este archivo
//      solo se re-descarga cuando la TCC-I cambia de verdad.
//   2. Cada edición dentro del <script> inline es cirugía de strings sobre
//      1,8 MB en un solo bloque. En mod209 eso partió un `async function`
//      en dos y la app no arrancó.
//
//  Se eligió la TCC-I para empezar por una razón que puso Joaquín y que
//  pesa más que el acoplamiento: todavía no está lanzada y casi nadie la
//  usa. Si algo sale mal acá, no deja a un paciente sin poder cargar su
//  noche. Riesgo es probabilidad por impacto, y acá el impacto es mínimo.
//
//  ── Lo que este archivo NECESITA de index.html ───────────────────────
//  Globales (definidos allá, usados acá siempre en tiempo de ejecución,
//  nunca al cargar, así que el orden de los <script> no importa):
//    S · db · SU · SK · supa · toast · escHtml · showScreen · navTo
//    dmMinsToHHMM · dmHHMMToMins · dmWindowDuration · computeSleepWindow
//    dmComputeWindowFor · dmGetWindowOverride · dmAbrirBiblioteca
//    dmEduAplica · dmEduPerfil · showPatientCode · viewPatient
//    PATIENT_EDU_TOPICS · openCbtiModule (desde onclick del HTML)
//
//  Las funciones de ventana de sueño (computeSleepWindow y las cuatro
//  dm*Window*) se quedan allá A PROPÓSITO: las usan también el diario y
//  el panel profesional. Mudarlas sería mudar media app.
//
//  ── Lo que este archivo EXPONE ───────────────────────────────────────
//  Son declaraciones de función, así que quedan globales solas. Las que
//  el resto de la app llama de verdad son diez:
//    openCbtiModule · openPatientCbtiView · dmAdminTcci · dmCbtiVerPrograma
//    toggleCbtiItem · saveCbtiNote · confirmDeactivateCbti
//    renderCbtiWindowPanel · dmTcciTieneAcceso · checkPatientTcciCard
// ══════════════════════════════════════════════════════════════════════

// ─────────────────────────────────────────────────────────────────────
// El programa en el panel de administrador
// ─────────────────────────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════
// Panel de administrador · el programa TCC-I
// ----------------------------------------------------------------------
// Mismo criterio que el resto del panel: las cuentas se hacen ADENTRO de
// la base y salen números. Ninguna de estas cuatro funciones devuelve un
// email, una noche, una respuesta escrita ni un comentario. El admin
// necesita saber si el programa funciona, no quién lo está haciendo.
// ══════════════════════════════════════════════════════════════════════
const DM_TCCI_SEM_NOMBRE = {
  0:'No cerró ninguna', 1:'Cómo funciona tu sueño', 2:'Restricción del tiempo en cama',
  3:'Control de estímulos', 4:'Ajuste del horario', 5:'Reestructuración cognitiva',
  6:'Técnicas de desactivación', 7:'Prevención de recaídas'
};
const DM_TCCI_PRECIO_TXT = {
  a:'Menos de $30.000', b:'$30.000 a $60.000', c:'$60.000 a $100.000',
  d:'$100.000 a $180.000', e:'Más de $180.000', no:'No pagaría por esto',
  sin_respuesta:'Prefirió no contestar'
};

async function dmAdminTcci(){
  const cont=document.getElementById('admin-content');
  if(!cont) return;
  const rpc=async function(fn){
    try{
      const { data, error } = await supa.rpc(fn);
      if(error) return { err:error };
      return { data:data };
    }catch(e){ return { err:e }; }
  };
  const [g, ab, enc, pr] = await Promise.all([
    rpc('admin_stats_tcci'), rpc('admin_stats_tcci_abandono'),
    rpc('admin_stats_tcci_encuestas'), rpc('admin_stats_tcci_precio')
  ]);

  // Si las funciones no existen todavía se dice cuál falta, en vez de
  // mostrar ceros que se leen como "nadie lo está usando".
  const faltan=[];
  [['admin_stats_tcci',g],['admin_stats_tcci_abandono',ab],
   ['admin_stats_tcci_encuestas',enc],['admin_stats_tcci_precio',pr]]
    .forEach(function(p){ if(p[1].err) faltan.push(p[0]); });
  if(faltan.length===4){
    cont.innerHTML='<div style="background:#fef3c7;border:1px solid #fde68a;border-radius:12px;padding:16px;font-size:13.5px;color:#92400e;line-height:1.6">'+
      '<b>Falta correr el SQL.</b> Ninguna de las funciones de estadística del programa existe todavía en la base.<br><br>'+
      'Está en <code>SQL-estadisticas-tcci.md</code>. Necesita antes <code>es_admin()</code> y la columna <code>patients.tcci_estado</code>.<br><br>'+
      '<span style="opacity:.8">'+String((g.err&&g.err.message)||'')+'</span></div>';
    return;
  }

  const G = (g.data && (Array.isArray(g.data)?g.data[0]:g.data)) || {};
  const n = Number(G.arrancaron)||0;
  const pct=function(v){ return n ? Math.round(v/n*100) : 0; };
  const caja=function(v,rot,col,pie){
    return '<div style="flex:1;min-width:130px;background:#fff;border:1px solid var(--sep-opaque);border-radius:14px;padding:14px 15px">'+
      '<div style="font-size:26px;font-weight:700;color:'+(col||'#1a4a3a')+';line-height:1">'+v+'</div>'+
      '<div style="font-size:12.5px;color:#5C6B61;margin-top:4px;line-height:1.35">'+rot+'</div>'+
      (pie?'<div style="font-size:11px;color:#8A968E;margin-top:3px">'+pie+'</div>':'')+
    '</div>';
  };

  let h='';

  // ── El embudo ──
  h+='<div class="sec-title" style="margin:2px 0 10px">El programa, en números</div>';
  h+='<div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:10px">'+
    caja(n,'arrancaron el programa')+
    caja((Number(G.solos)||0),'por su cuenta', '#1a4a3a', pct(Number(G.solos)||0)+'%')+
    caja((Number(G.acompanados)||0),'con profesional', '#2D6B55', pct(Number(G.acompanados)||0)+'%')+
  '</div>';
  h+='<div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:16px">'+
    caja((Number(G.terminaron)||0),'lo terminaron','#15803d', pct(Number(G.terminaron)||0)+'%')+
    caja((Number(G.en_curso)||0),'en curso','#C8A96E')+
    caja((Number(G.abandonados)||0),'frenados','#9b1c1c','sin señal hace 14 días o más')+
  '</div>';

  if(G.dias_med_completo!=null || G.dias_prom_completo!=null){
    h+='<div style="background:#fff;border:1px solid var(--sep-opaque);border-radius:14px;padding:14px 16px;margin-bottom:18px">'+
      '<div style="font-size:12px;font-weight:700;color:#5C6B61;text-transform:uppercase;letter-spacing:.05em;margin-bottom:8px">De principio a fin</div>'+
      '<div style="display:flex;gap:22px;flex-wrap:wrap">'+
        '<div><div style="font-size:24px;font-weight:700;color:#1a4a3a">'+(G.dias_med_completo!=null?G.dias_med_completo:'—')+'<span style="font-size:13px"> días</span></div>'+
          '<div style="font-size:12px;color:#5C6B61">mediana</div></div>'+
        '<div><div style="font-size:24px;font-weight:700;color:#1a4a3a">'+(G.dias_prom_completo!=null?G.dias_prom_completo:'—')+'<span style="font-size:13px"> días</span></div>'+
          '<div style="font-size:12px;color:#5C6B61">promedio</div></div>'+
      '</div>'+
      '<div style="font-size:11.5px;color:#8A968E;line-height:1.5;margin-top:9px">'+
        'Solo de quienes lo completaron. El programa está pensado en 7 semanas (49 días): '+
        'bastante más que eso significa que lo están haciendo a su ritmo, no que fallaron.<br>'+
        '<b>Ojo con este número:</b> mide inicio → última señal, no inicio → fin real. '+
        'Si alguien terminó y siguió abriendo la app, se estira.</div>'+
    '</div>';
  }

  // ── Dónde se quedaron ──
  const filasAb = (ab.data||[]);
  if(filasAb.length){
    const maxP = Math.max.apply(null, filasAb.map(function(r){ return Number(r.personas)||0; }));
    h+='<div class="sec-title" style="margin:2px 0 4px">Dónde se quedaron</div>';
    h+='<div style="font-size:12.5px;color:#5C6B61;line-height:1.55;margin-bottom:10px">'+
      'Cada fila es la última semana que cerraron. La que acumula más gente parada es '+
      'donde el programa expulsa — y la primera candidata a reescribirse.</div>';
    h+='<div style="background:#fff;border:1px solid var(--sep-opaque);border-radius:14px;padding:6px 15px 12px;margin-bottom:18px">';
    filasAb.forEach(function(r){
      const k=Number(r.ultima_cerrada)||0;
      const p=Number(r.personas)||0;
      const f=Number(r.frenados)||0;
      const w=maxP?Math.round(p/maxP*100):0;
      h+='<div style="padding:9px 0;border-bottom:1px solid var(--sep-opaque)">'+
        '<div style="display:flex;justify-content:space-between;gap:12px;align-items:baseline">'+
          '<div style="font-size:13px;color:#0F2820"><b>'+(k===0?'—':k)+'</b> · '+(DM_TCCI_SEM_NOMBRE[k]||('Semana '+k))+'</div>'+
          '<div style="font-size:13px;font-weight:700;color:#1a4a3a;flex-shrink:0">'+p+
            (f?' <span style="font-size:11px;color:#9b1c1c;font-weight:600">('+f+' frenados)</span>':'')+'</div>'+
        '</div>'+
        '<div style="height:6px;background:#EEF2EF;border-radius:3px;overflow:hidden;margin-top:6px">'+
          '<div style="height:100%;width:'+w+'%;background:'+(f>p/2?'#C8A96E':'#1a4a3a')+'"></div></div>'+
      '</div>';
    });
    h+='</div>';
  }

  // ── Utilidad contra costo ──
  const filasE = (enc.data||[]);
  if(filasE.length){
    h+='<div class="sec-title" style="margin:2px 0 4px">Utilidad contra costo, semana por semana</div>';
    h+='<div style="font-size:12.5px;color:#5C6B61;line-height:1.55;margin-bottom:10px">'+
      'El saldo es utilidad menos costo. <b>Saldo negativo = la semana pide más de lo que devuelve</b>, '+
      'y esa es la que hace abandonar en la siguiente. Con la utilidad sola no se ve.</div>';
    h+='<div style="background:#fff;border:1px solid var(--sep-opaque);border-radius:14px;overflow:hidden;margin-bottom:18px">'+
      '<div style="display:grid;grid-template-columns:2.2fr repeat(4,1fr);gap:8px;padding:10px 15px;background:#F6F8F6;font-size:11px;font-weight:700;color:#5C6B61;text-transform:uppercase;letter-spacing:.04em">'+
        '<div>Semana</div><div style="text-align:right">n</div><div style="text-align:right">Sirvió</div>'+
        '<div style="text-align:right">Costó</div><div style="text-align:right">Saldo</div></div>';
    filasE.forEach(function(r){
      const sd = r.saldo==null ? null : Number(r.saldo);
      const col = sd==null ? '#8A968E' : sd<0 ? '#9b1c1c' : sd<1.5 ? '#92400e' : '#15803d';
      h+='<div style="display:grid;grid-template-columns:2.2fr repeat(4,1fr);gap:8px;padding:11px 15px;border-top:1px solid var(--sep-opaque);font-size:13px;align-items:baseline">'+
        '<div style="color:#0F2820"><b>'+r.semana+'</b> · <span style="color:#5C6B61">'+(DM_TCCI_SEM_NOMBRE[r.semana]||'')+'</span>'+
          (r.compromiso!=null?'<div style="font-size:11px;color:#8A968E;margin-top:2px">compromiso previo '+r.compromiso+'/10</div>':'')+'</div>'+
        '<div style="text-align:right;color:#5C6B61">'+(r.respuestas||0)+'</div>'+
        '<div style="text-align:right">'+(r.utilidad!=null?r.utilidad:'—')+'</div>'+
        '<div style="text-align:right">'+(r.costo!=null?r.costo:'—')+'</div>'+
        '<div style="text-align:right;font-weight:700;color:'+col+'">'+(sd!=null?(sd>0?'+':'')+sd:'—')+'</div>'+
      '</div>';
    });
    h+='</div>';
  }

  // ── Precio ──
  const filasP = (pr.data||[]);
  if(filasP.length){
    const tot = filasP.reduce(function(a,r){ return a+(Number(r.personas)||0); },0);
    h+='<div class="sec-title" style="margin:2px 0 4px">Cuánto pagarían</div>';
    h+='<div style="font-size:12.5px;color:#5C6B61;line-height:1.55;margin-bottom:10px">'+
      'Son personas que lo están usando <b>gratis</b> y que ya invirtieron una semana de tarea: '+
      'las dos cosas empujan la respuesta para arriba. El número duro acá es cuántos eligen '+
      '"no pagaría".</div>';
    h+='<div style="background:#fff;border:1px solid var(--sep-opaque);border-radius:14px;padding:6px 15px 12px;margin-bottom:18px">';
    filasP.forEach(function(r){
      const p=Number(r.personas)||0;
      const w=tot?Math.round(p/tot*100):0;
      const noPaga = r.tramo==='no';
      h+='<div style="padding:9px 0;border-bottom:1px solid var(--sep-opaque)">'+
        '<div style="display:flex;justify-content:space-between;gap:12px">'+
          '<div style="font-size:13px;color:'+(noPaga?'#9b1c1c':'#0F2820')+'">'+(DM_TCCI_PRECIO_TXT[r.tramo]||r.tramo)+'</div>'+
          '<div style="font-size:13px;font-weight:700;color:#1a4a3a;flex-shrink:0">'+p+' <span style="font-weight:500;color:#8A968E">('+w+'%)</span></div>'+
        '</div>'+
        '<div style="height:6px;background:#EEF2EF;border-radius:3px;overflow:hidden;margin-top:6px">'+
          '<div style="height:100%;width:'+w+'%;background:'+(noPaga?'#9b1c1c':'#C8A96E')+'"></div></div>'+
      '</div>';
    });
    h+='</div>';
  }

  if(faltan.length){
    h+='<div style="background:#fef3c7;border:1px solid #fde68a;border-radius:12px;padding:12px 14px;font-size:12.5px;color:#92400e;line-height:1.55">'+
      'Faltan estas funciones en la base: <b>'+faltan.join(', ')+'</b>. Están en <code>SQL-estadisticas-tcci.md</code>.</div>';
  }
  if(!n && !filasE.length && !filasP.length){
    h+='<div style="background:#fff;border:1px solid var(--sep-opaque);border-radius:14px;padding:20px;text-align:center;font-size:13.5px;color:#5C6B61;line-height:1.6">'+
      'Todavía no arrancó nadie el programa, o ningún paciente abrió la app desde que se publicó '+
      'la sincronización del avance.</div>';
  }

  h+='<div style="font-size:11.5px;color:#8A968E;line-height:1.55;margin-top:6px">'+
    'Todo lo de esta pantalla se calcula adentro de la base y sale como números. '+
    'No se lee ni un email, ni una noche, ni un comentario de ningún paciente.</div>';

  cont.innerHTML=h;
}
window.dmAdminTcci = dmAdminTcci;

// ─────────────────────────────────────────────────────────────────────
// El protocolo del lado del profesional
// ─────────────────────────────────────────────────────────────────────
// ── CBT-I MÓDULO (premium) ──
const CBTI_PROTOCOL = {
  modules: [
    {id:'M1', name:'Psicoeducación', icon:'📘', items:[
      {id:'M1_1', label:'Explicación del modelo del sueño normal (arquitectura, ciclos, REM/NREM)'},
      {id:'M1_2', label:'Modelo conductual del insomnio: 3 P de Spielman (predisponentes, precipitantes, perpetuantes)'},
      {id:'M1_3', label:'Introducción del diario de sueño y compromiso de registro diario'},
      {id:'M1_4', label:'Revisión de mitos comunes sobre el sueño (necesidad de 8h, recuperar el fin de semana, etc.)'},
      {id:'M1_5', label:'Expectativas del tratamiento y compromiso del paciente'}
    ]},
    {id:'M2', name:'Higiene del sueño + Control de estímulos', icon:'🛏️', items:[
      {id:'M2_1', label:'Revisión de cafeína, alcohol, ejercicio, exposición a luz y comidas'},
      {id:'M2_2', label:'Regla: la cama es solo para dormir y actividad sexual'},
      {id:'M2_3', label:'Salir de la cama si no se duerme en 15-20 minutos'},
      {id:'M2_4', label:'Hora de despertar fija (incluyendo fines de semana)'},
      {id:'M2_5', label:'Eliminar siestas o limitarlas a ≤30 min antes de las 15h'}
    ]},
    {id:'M3', name:'Restricción del sueño', icon:'⏱️', items:[
      {id:'M3_1', label:'Calcular eficiencia del sueño desde el diario (≥7 noches)'},
      {id:'M3_2', label:'Fijar el tiempo en cama = TST medio + 15 min'},
      {id:'M3_3', label:'Acordar hora de acostarse y despertarse'},
      {id:'M3_4', label:'Mínimo 5h en cama (regla de seguridad)'},
      {id:'M3_5', label:'Plan de ajuste semanal: +15 min si eficiencia >85%, -15 min si <80%'}
    ]},
    {id:'M4', name:'Reestructuración cognitiva', icon:'🧠', items:[
      {id:'M4_1', label:'Identificar creencias disfuncionales (vincular con DBAS si disponible)'},
      {id:'M4_2', label:'Trabajar catastrofización ("si no duermo 8 horas no funciono")'},
      {id:'M4_3', label:'Reestructuración guiada de pensamientos automáticos'},
      {id:'M4_4', label:'Constructive worry: programar tiempo de preocupación fuera de la cama'}
    ]},
    {id:'M5', name:'Relajación / manejo del arousal', icon:'🌊', items:[
      {id:'M5_1', label:'Entrenamiento en relajación muscular progresiva (Jacobson)'},
      {id:'M5_2', label:'Respiración diafragmática (4-7-8 u otra)'},
      {id:'M5_3', label:'Imaginería guiada / mindfulness'},
      {id:'M5_4', label:'Manejo de mente activa nocturna y rumiación'}
    ]},
    {id:'M6', name:'Consolidación y prevención de recaídas', icon:'🏁', items:[
      {id:'M6_1', label:'Revisión cuantitativa de avances (eficiencia, ISI, diario)'},
      {id:'M6_2', label:'Identificar disparadores de recaída posibles'},
      {id:'M6_3', label:'Plan de mantenimiento post-tratamiento'},
      {id:'M6_4', label:'Criterios de alta y seguimiento a 3-6 meses'}
    ]}
  ]
};
const CBTI_TOTAL_ITEMS = CBTI_PROTOCOL.modules.reduce((n,m)=>n+m.items.length,0);
let CBTI_STATE = { patientEmail:null, patientName:null, progress:{}, cbtiPatients:[] };

// Filtra el listado del módulo TCC-I por apellido o nombre.
function dmCbtiFiltrar(q){
  const t=String(q||'').trim().toLowerCase();
  document.querySelectorAll('[data-cbti-nombre]').forEach(function(el){
    el.style.display = (!t || el.getAttribute('data-cbti-nombre').indexOf(t)>=0) ? '' : 'none';
  });
}

async function openCbtiModule(){
  showScreen('cbti-list');
  const cont = document.getElementById('cbti-list-content');
  if(!cont) return;
  cont.innerHTML = '<div style="text-align:center;padding:40px 0;color:rgba(255,255,255,.76)"><div class="spinner" style="margin:0 auto 12px"></div>Cargando pacientes…</div>';
  try{
    const drEmail = S.user?.email;
    if(!drEmail){ cont.innerHTML='<div style="padding:20px">Sesión no iniciada.</div>'; return; }
    // Pacientes vinculados
    const links = await db.get('doctor_patients?doctor_email=eq.'+encodeURIComponent(drEmail)+'&select=patient_email').catch(()=>[]);
    const emails = (links||[]).map(l=>l.patient_email);
    if(!emails.length){
      cont.innerHTML = '<div style="text-align:center;padding:40px 16px;color:rgba(255,255,255,.76)"><div style="font-size:36px;margin-bottom:10px">👥</div>No tenés pacientes vinculados todavía.<br><br>Vinculá un paciente primero desde la pestaña Vincular.</div>';
      return;
    }
    // Datos de pacientes
    const patients = await db.get('patients?email=in.('+emails.map(e=>encodeURIComponent(e)).join(',')+')&select=email,name,lname').catch(()=>[]);
    // Pacientes ya marcados en CBT-I
    let cbtiPats = [];
    try{ cbtiPats = await db.get('cbti_patients?doctor_email=eq.'+encodeURIComponent(drEmail)+'&active=eq.true&select=patient_email'); }catch(_){}
    CBTI_STATE.cbtiPatients = (cbtiPats||[]).map(c=>c.patient_email);
    // Progreso por paciente
    let progressData = [];
    if(CBTI_STATE.cbtiPatients.length){
      try{ progressData = await db.get('cbti_progress?doctor_email=eq.'+encodeURIComponent(drEmail)+'&completed=eq.true&select=patient_email,item_id'); }catch(_){}
    }
    const progressByPatient = {};
    (progressData||[]).forEach(r=>{ progressByPatient[r.patient_email] = (progressByPatient[r.patient_email]||0)+1; });
    // Orden alfabético por APELLIDO dentro de cada grupo (antes venían en el
    // orden que devolvía la base, que no es ninguno).
    const cmpAp = (a,b)=>String((a.lname||a.name||a.email)).toLowerCase()
      .localeCompare(String((b.lname||b.name||b.email)).toLowerCase(), 'es', {sensitivity:'base'});
    const inCbti = patients.filter(p=>CBTI_STATE.cbtiPatients.includes(p.email)).sort(cmpAp);
    const notInCbti = patients.filter(p=>!CBTI_STATE.cbtiPatients.includes(p.email)).sort(cmpAp);
    let html =
      // Arriba de todo: el material que le llega al paciente y el marco
      // teórico. Antes esto no existía del lado del profesional — para saber
      // qué leía el paciente había que entrar con la cuenta del paciente.
      '<div class="cbti-portada" onclick="dmCbtiVerPrograma()">'+
        '<div class="cbti-portada-ic">📖</div>'+
        '<div style="flex:1;min-width:0">'+
          '<div class="cbti-portada-tit">Lo que lee el paciente</div>'+
          '<div class="cbti-portada-sub">Las 7 semanas del programa completas, las 27 consignas del checklist y el marco teórico del protocolo.</div>'+
        '</div>'+
        '<div class="cbti-portada-chev">›</div>'+
      '</div>'+
      '<div style="position:sticky;top:0;z-index:5;background:#0F2820;padding:2px 0 12px">'+
      '<input id="cbti-buscar" type="search" placeholder="🔍 Buscar por apellido…" oninput="dmCbtiFiltrar(this.value)" '+
      'style="width:100%;background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.16);border-radius:11px;padding:11px 13px;color:#fff;font-size:14px;font-family:var(--font);box-sizing:border-box"></div>';
    if(inCbti.length){
      html += '<div style="font-size:11px;color:#C8A96E;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:10px;font-weight:700">En tratamiento TCC-I</div>';
      html += '<div class="cbti-pac-grid">';
      html += inCbti.map(p=>{
        const done = progressByPatient[p.email]||0;
        const pct = Math.round(done/CBTI_TOTAL_ITEMS*100);
        // "Apellido, Nombre": con "Nombre Apellido" el orden alfabético por
        // apellido parecía desordenado a simple vista.
        const full = (p.lname? p.lname+', '+(p.name||'') : (p.name||p.email));
        return '<div data-cbti-nombre="'+((p.lname||'')+' '+(p.name||'')).toLowerCase()+'" onclick="openCbtiProtocol(\''+p.email+'\',\''+full.replace(/\\/g,"\\\\").replace(/'/g,"\\\'")+'\')" style="background:rgba(126,200,164,0.08);border:1px solid #7ec8a4;border-radius:12px;padding:14px;margin-bottom:10px;cursor:pointer">'+
          '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px"><div style="font-size:15px;font-weight:600;color:#fff">'+full+'</div><div style="font-size:13px;color:#7ec8a4;font-weight:700">'+done+'/'+CBTI_TOTAL_ITEMS+'</div></div>'+
          '<div style="height:6px;background:rgba(255,255,255,0.08);border-radius:3px;overflow:hidden"><div style="height:100%;width:'+pct+'%;background:linear-gradient(90deg,#7ec8a4,#C8A96E)"></div></div>'+
          '<div style="font-size:11px;color:rgba(255,255,255,.76);margin-top:6px">'+pct+'% del protocolo</div>'+
          '</div>';
      }).join('') + '</div>';
    }
    html += '<div style="font-size:11px;color:rgba(255,255,255,.72);text-transform:uppercase;letter-spacing:0.06em;margin:18px 0 10px;font-weight:700">Pacientes vinculados</div>';
    html += '<div style="font-size:12px;color:rgba(255,255,255,.76);margin-bottom:14px;line-height:1.5">Marcá los pacientes con los que estés trabajando un protocolo TCC-I (CBT-I).</div>';
    html += '<div class="cbti-pac-grid">';
    html += (notInCbti.length?notInCbti:patients.filter(p=>!CBTI_STATE.cbtiPatients.includes(p.email))).map(p=>{
      const full = (p.lname? p.lname+', '+(p.name||'') : (p.name||p.email));
      const etiqueta = (p.lname? p.lname+', '+(p.name||'') : (p.name||p.email));
      return '<div data-cbti-nombre="'+((p.lname||'')+' '+(p.name||'')).toLowerCase()+'" style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.1);border-radius:12px;padding:12px 14px;margin-bottom:8px;display:flex;justify-content:space-between;align-items:center">'+
        '<div style="font-size:14px;color:#fff;font-weight:500">'+etiqueta+'</div>'+
        '<button onclick="toggleCbtiPatient(\''+p.email+'\',\''+full.replace(/\\/g,"\\\\").replace(/'/g,"\\\'")+'\',true)" style="background:#1a4a3a;border:1px solid #7ec8a4;border-radius:8px;padding:6px 12px;color:#7ec8a4;font-size:12px;font-weight:600;cursor:pointer;font-family:var(--font)">+ Activar TCC-I</button>'+
        '</div>';
    }).join('') + '</div>';
    html += '<div class="cbti-pie-material">'+
      '<b style="color:#F4EFE5">¿Buscabas el material educativo?</b> Está en la pestaña '+
      '<b style="color:#7EC8A4">📚 Material</b> de cada paciente: ahí lo ves, lo asignás y '+
      'te dice si lo leyó. No cuelga de TCC-I porque sirve para cualquier paciente, con '+
      'protocolo o sin él.'+
    '</div>';
    cont.innerHTML = html;
  }catch(err){
    console.error('[CBT-I list] error:', err);
    cont.innerHTML = '<div style="padding:20px;color:#fca5a5">Error al cargar. Verificá que las tablas cbti_patients y cbti_progress estén creadas en la base.</div>';
  }
}

async function toggleCbtiPatient(patientEmail, patientName, activate){
  const drEmail = (S.user?.email||'').trim().toLowerCase(); if(!drEmail) return;
  const patNorm = (patientEmail||'').trim().toLowerCase();
  try{
    if(activate){
      // Insert or update
      await fetch(SU+'/rest/v1/cbti_patients',{method:'POST',headers:{'apikey':SK,'Authorization':await db._getAuthHeader(),'Content-Type':'application/json','Prefer':'resolution=merge-duplicates,return=minimal'},body:JSON.stringify({doctor_email:drEmail,patient_email:patNorm,active:true})});
      toast('✓ '+patientName+' activado en CBT-I');
    } else {
      await db.patch('cbti_patients?doctor_email=eq.'+encodeURIComponent(drEmail)+'&patient_email=eq.'+encodeURIComponent(patNorm),{active:false});
      toast('Desactivado de CBT-I');
    }
    openCbtiModule(); // refrescar lista
  }catch(e){ console.error('toggleCbtiPatient:', e); toast('⚠ Error al guardar'); }
}

async function openCbtiProtocol(patientEmail, patientName){
  CBTI_STATE.patientEmail = patientEmail;
  CBTI_STATE.patientName = patientName;
  CBTI_STATE.progress = {};
  showScreen('cbti-protocol');
  const titleEl = document.getElementById('cbti-protocol-title');
  if(titleEl) titleEl.textContent = patientName;
  const cont = document.getElementById('cbti-protocol-content');
  cont.innerHTML = '<div style="text-align:center;padding:40px 0;color:rgba(255,255,255,.76)"><div class="spinner" style="margin:0 auto 12px"></div>Cargando protocolo…</div>';
  try{
    const drEmail = S.user.email;
    const rows = await db.get('cbti_progress?doctor_email=eq.'+encodeURIComponent(drEmail)+'&patient_email=eq.'+encodeURIComponent(patientEmail)+'&select=item_id,completed,completed_at,notes').catch(()=>[]);
    (rows||[]).forEach(r=>{ CBTI_STATE.progress[r.item_id]={completed:!!r.completed,completed_at:r.completed_at,notes:r.notes||''}; });
    renderCbtiProtocol();
    try{ renderCbtiWindowPanel(patientEmail); }catch(e){ console.warn('[TCCI] panel ventana:', e); }
    try{ dmCbtiRenderSemanas(); }catch(e){ console.warn('[TCCI] semanas:', e); }
  }catch(err){
    console.error('[CBT-I protocol] load error:', err);
    cont.innerHTML = '<div style="padding:20px;color:#fca5a5">Error al cargar el protocolo. Asegurate de haber creado la tabla cbti_progress.</div>';
  }
}

function renderCbtiProtocol(){
  const cont = document.getElementById('cbti-protocol-content');
  if(!cont) return;
  const doneCount = Object.values(CBTI_STATE.progress).filter(p=>p.completed).length;
  const pct = Math.round(doneCount/CBTI_TOTAL_ITEMS*100);
  let html = '';
  // Ventana de sueño: lo primero, porque es la intervención activa del protocolo.
  html += '<div id="cbti-window-box"></div>';
  // El material completo, a un clic desde la ficha del paciente y no solo
  // desde la lista: es acá donde surge la pregunta de qué le llega.
  html += '<div class="cbti-portada cbti-portada-chica" onclick="dmCbtiVerPrograma()">'+
    '<div class="cbti-portada-ic">📖</div>'+
    '<div style="flex:1;min-width:0">'+
      '<div class="cbti-portada-tit">Lo que lee el paciente</div>'+
      '<div class="cbti-portada-sub">Las 7 semanas del programa y las 27 consignas, completas.</div>'+
    '</div>'+
    '<div class="cbti-portada-chev">›</div>'+
  '</div>';
  // ── Semanas habilitadas ──────────────────────────────────────────
  // Esto es lo ÚNICO que cambia lo que el paciente ve. El protocolo de
  // 27 ítems de más abajo es la checklist clínica del profesional: sirve
  // para registrar qué se trabajó, no para dosificar el material.
  html += '<div id="cbti-semanas-box"></div>';
  // Barra de progreso global
  html += '<div style="background:rgba(126,200,164,0.08);border:1px solid rgba(200,169,110,0.4);border-radius:14px;padding:16px;margin-bottom:18px">';
  html += '<div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:10px"><div style="font-size:12px;color:rgba(255,255,255,.9);text-transform:uppercase;letter-spacing:0.06em;font-weight:700">Progreso del protocolo</div><div id="cbti-global-pct" style="font-size:22px;font-weight:700;color:#C8A96E">'+pct+'%</div></div>';
  html += '<div style="height:10px;background:rgba(255,255,255,0.08);border-radius:5px;overflow:hidden"><div id="cbti-global-bar" style="height:100%;width:'+pct+'%;background:linear-gradient(90deg,#7ec8a4,#C8A96E);transition:width 0.3s"></div></div>';
  html += '<div id="cbti-global-count" style="font-size:12px;color:rgba(255,255,255,.76);margin-top:8px">'+doneCount+' de '+CBTI_TOTAL_ITEMS+' items completados</div>';
  html += '</div>';
  // Acordeón de módulos. En escritorio van en grilla: seis cajas cerradas
  // apiladas en una sola columna dejaban dos tercios de la pantalla vacíos.
  // El módulo que se abre pasa a ocupar el ancho completo.
  html += '<div class="cbti-mod-grid">';
  CBTI_PROTOCOL.modules.forEach((mod,mIdx)=>{
    const modDone = mod.items.filter(it=>CBTI_STATE.progress[it.id]?.completed).length;
    const modPct = Math.round(modDone/mod.items.length*100);
    const isComplete = modDone===mod.items.length;
    const isPartial = modDone>0 && modDone<mod.items.length;
    const accent = isComplete?'#7ec8a4':(isPartial?'#C8A96E':'rgba(255,255,255,0.15)');
    html += '<div style="background:rgba(255,255,255,0.04);border:1px solid '+accent+';border-radius:14px;margin-bottom:12px;overflow:hidden">';
    // Header
    html += '<div onclick="(function(self){var el=document.getElementById(\'cbti-mod-'+mod.id+'\');var open=el.style.display===\'block\';el.style.display=open?\'none\':\'block\';self.querySelector(\'.cbti-chev\').style.transform=open?\'rotate(0deg)\':\'rotate(90deg)\';if(self.parentElement)self.parentElement.classList.toggle(\'abierto\',!open);})(this);" style="padding:14px 16px;cursor:pointer;display:flex;align-items:center;gap:12px">';
    html += '<div style="font-size:24px">'+mod.icon+'</div>';
    html += '<div style="flex:1"><div style="font-size:15px;font-weight:700;color:#fff;margin-bottom:2px">'+mod.name+'</div>';
    html += '<div id="cbti-modcount-'+mod.id+'" style="font-size:12px;color:rgba(255,255,255,.82)">'+modDone+'/'+mod.items.length+' items'+(isComplete?' · ✓ completo':'')+'</div></div>';
    html += '<div id="cbti-modpct-'+mod.id+'" style="font-size:13px;font-weight:700;color:'+(isComplete?'#7ec8a4':(isPartial?'#C8A96E':'rgba(255,255,255,0.4)'))+'">'+modPct+'%</div>';
    html += '<div class="cbti-chev" style="color:rgba(255,255,255,.72);transition:transform 0.2s;font-size:14px">›</div>';
    html += '</div>';
    // Items (collapsible)
    html += '<div id="cbti-mod-'+mod.id+'" class="cbti-mod-body" style="display:none;padding:0 16px 14px">';
    html += '<div style="height:1px;background:rgba(255,255,255,0.08);margin-bottom:12px"></div>';
    // Todo el material del paciente de este módulo, junto y con su texto
    // entero. Va plegado: el contenido clínico ya lo sabe, lo que necesita es
    // poder consultar qué le llega textualmente.
    (function(){
      const _t = (typeof CBTI_PATIENT_CONTENT!=='undefined') ? CBTI_PATIENT_CONTENT : {};
      const _con = mod.items.filter(function(it){ return !!_t[it.id]; }).length;
      html += '<details class="cbti-verpac" style="margin-bottom:12px">'+
        '<summary>'+
          '<span class="cbti-verpac-tit">Lo que lee el paciente en este módulo</span>'+
          '<span class="cbti-verpac-meta">'+_con+' de '+mod.items.length+'</span>'+
        '</summary>'+
        '<div class="cbti-verpac-cuerpo">'+
          mod.items.map(function(it){
            const _visto = !!(CBTI_STATE.progress[it.id] && CBTI_STATE.progress[it.id].completed);
            const _txt = _t[it.id]||'';
            return '<div class="cbti-verpac-tarjeta">'+
              '<div class="cbti-verpac-cab">'+escHtml(it.label)+
                '<span class="cbti-verpac-lock" id="cbti-lock-'+it.id+'"'+
                  (_visto?' style="display:none"':'')+'>todavía no lo ve</span>'+
              '</div>'+
              '<div class="cbti-verpac-txt">'+
                (_txt ? escHtml(_txt)
                      : '<span style="font-style:italic;opacity:.75">Este punto no tiene texto propio: el paciente ve el título y nada más.</span>')+
              '</div>'+
            '</div>';
          }).join('')+
          '<div class="cbti-verpac-nota">Cada punto se le desbloquea cuando lo tildás.</div>'+
        '</div>'+
      '</details>';
    })();
    mod.items.forEach((it,iIdx)=>{
      const p = CBTI_STATE.progress[it.id]||{};
      const checked = !!p.completed;
      const completedDate = p.completed_at?new Date(p.completed_at).toLocaleDateString('es-AR',{day:'2-digit',month:'short',year:'numeric'}):'';
      html += '<div style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.05)">';
      html += '<label style="display:flex;align-items:flex-start;gap:10px;cursor:pointer">';
      html += '<input type="checkbox" '+(checked?'checked':'')+' onchange="toggleCbtiItem(\''+it.id+'\',this.checked)" style="margin-top:3px;width:18px;height:18px;accent-color:#7ec8a4;flex-shrink:0;cursor:pointer">';
      html += '<div style="flex:1"><div style="font-size:13px;color:'+(checked?'rgba(255,255,255,0.5)':'#fff')+';line-height:1.5;'+(checked?'text-decoration:line-through':'')+'">'+it.label+'</div>';
      if(completedDate) html += '<div style="font-size:10.5px;color:#7ec8a4;margin-top:2px">✓ '+completedDate+'</div>';
      html += '</div></label>';
      // El desplegable "En la app del paciente" vivía acá, uno por ítem:
      // veintisiete cajas para veintisiete líneas sueltas, cada una con su
      // propio título repetido. Se leía como un rótulo, no como el texto. El
      // material del módulo entero va ahora en un solo desplegable arriba.
      // Notas
      // La nota del clínico estaba siempre abierta debajo de cada ítem:
      // veintisiete cajas vacías ocupaban media pantalla. Se pliega, salvo
      // que tenga algo escrito.
      const _hayNota = !!(p.notes && p.notes.length);
      html += '<details class="cbti-nota"'+(_hayNota?' open':'')+' style="margin:6px 0 0 28px">'+
        '<summary>'+(_hayNota?'Tu nota':'Agregar una nota')+'</summary>'+
        '<textarea data-itemid="'+it.id+'" onblur="saveCbtiNote(\''+it.id+'\',this.value)" '+
          'placeholder="Lo que quieras recordar de cómo se trabajó este punto…">'+(p.notes||'')+'</textarea>'+
      '</details>';
      html += '</div>';
    });
    html += '</div></div>';
  });
  html += '</div>';
  // Botón "Desactivar CBT-I"
  html += '<div style="margin-top:24px;padding:16px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-radius:12px;text-align:center">';
  html += '<div style="font-size:12px;color:rgba(255,255,255,.72);margin-bottom:10px">Si terminás el tratamiento o el paciente abandona</div>';
  html += '<button onclick="confirmDeactivateCbti()" style="background:transparent;border:1px solid rgba(252,165,165,0.4);color:#fca5a5;padding:8px 16px;border-radius:8px;font-size:12px;font-weight:600;cursor:pointer;font-family:var(--font)">Desactivar paciente del módulo</button>';
  html += '</div>';
  cont.innerHTML = html;
}

// ── Lo que lee el paciente, del lado del profesional ───────────────────
// El texto del paciente vive en dos objetos distintos y el profesional no
// veía ninguno de los dos entero: DM_TCCI_PROGRAMA son las siete semanas del
// programa autoguiado (el material largo) y CBTI_PATIENT_CONTENT son las 27
// consignas que se desbloquean con el checklist. Esta pantalla es los dos,
// sin recortar. No hay contenido nuevo acá: es el mismo objeto que se
// renderiza en la app del paciente.
function dmCbtiVerPrograma(){
  showScreen('cbti-programa');
  const cont = document.getElementById('cbti-programa-content');
  if(!cont) return;
  const prog = (typeof DM_TCCI_PROGRAMA !== 'undefined') ? DM_TCCI_PROGRAMA : [];
  let h = '';

  h += '<div class="cbti-prog-marco">'+
    '<div class="cbti-prog-marco-tit">De qué está hecho el protocolo</div>'+
    '<div class="cbti-prog-marco-txt">'+
      'Los componentes con evidencia son <b>restricción de sueño</b>, <b>control de estímulos</b>, '+
      '<b>reestructuración cognitiva</b>, <b>relajación</b> y <b>prevención de recaídas</b> '+
      '(AASM 2021; ESRS 2023). La higiene del sueño sola no es tratamiento: va como apoyo y '+
      'nunca como núcleo, y así está puesta en la semana 1.<br><br>'+
      'El paciente ve la <b>semana 1 abierta</b>; el resto del acompañamiento semanal es de pago. '+
      'Las 27 consignas del checklist se le desbloquean de a una, cuando tildás el punto en su protocolo.'+
    '</div>'+
  '</div>';

  h += '<div class="cbti-prog-rotulo">El programa semanal · '+prog.length+' semanas</div>';
  h += '<div class="cbti-prog-grid">';
  prog.forEach(function(sem){
    const tareas = (sem.tareas||[]).map(function(t){
      return '<li>'+escHtml(t)+'</li>';
    }).join('');
    h += '<details class="cbti-prog-sem">'+
      '<summary>'+
        '<span class="cbti-prog-n">SEM '+sem.n+'</span>'+
        '<span style="flex:1;min-width:0">'+
          '<span class="cbti-prog-tit">'+escHtml(sem.titulo||'')+'</span>'+
          '<span class="cbti-prog-sub">'+escHtml(sem.subtitulo||'')+'</span>'+
        '</span>'+
        '<span class="cbti-prog-tag">'+(sem.libre?'abierta':'de pago')+'</span>'+
      '</summary>'+
      '<div class="cbti-prog-cuerpo">'+
        '<div class="cbti-prog-obj"><b>Objetivo.</b> '+escHtml(sem.objetivo||'')+'</div>'+
        // sem.contenido es HTML nuestro, escrito a mano en la constante: va
        // tal cual, igual que en la app del paciente.
        '<div class="cbti-prog-txt">'+(sem.contenido||'')+'</div>'+
        (tareas ? '<div class="cbti-prog-tareas"><div class="cbti-prog-tareas-tit">Tareas de la semana</div><ul>'+tareas+'</ul></div>' : '')+
      '</div>'+
    '</details>';
  });
  h += '</div>';

  // Las 27 consignas del checklist, agrupadas por módulo.
  const mods = (typeof CBTI_PROTOCOL !== 'undefined' && CBTI_PROTOCOL.modules) ? CBTI_PROTOCOL.modules : [];
  const txts = (typeof CBTI_PATIENT_CONTENT !== 'undefined') ? CBTI_PATIENT_CONTENT : {};
  let nItems = 0; mods.forEach(function(m){ nItems += (m.items||[]).length; });
  h += '<div class="cbti-prog-rotulo" style="margin-top:26px">Las consignas del checklist · '+nItems+' puntos</div>';
  h += '<div class="cbti-prog-nota">Cada una se le desbloquea al paciente cuando tildás ese punto en su protocolo.</div>';
  h += '<div class="cbti-prog-grid">';
  mods.forEach(function(mod){
    h += '<details class="cbti-prog-sem">'+
      '<summary>'+
        '<span class="cbti-prog-n" style="font-size:15px">'+(mod.icon||'•')+'</span>'+
        '<span style="flex:1;min-width:0">'+
          '<span class="cbti-prog-tit">'+escHtml(mod.name||'')+'</span>'+
          '<span class="cbti-prog-sub">'+(mod.items||[]).length+' puntos</span>'+
        '</span>'+
      '</summary>'+
      '<div class="cbti-prog-cuerpo">'+
        (mod.items||[]).map(function(it){
          const t = txts[it.id]||'';
          return '<div class="cbti-prog-item">'+
            '<div class="cbti-prog-item-tit">'+escHtml(it.label||'')+'</div>'+
            '<div class="cbti-prog-item-txt">'+
              (t ? escHtml(t) : '<i style="opacity:.7">Sin texto propio: el paciente ve solo el título.</i>')+
            '</div>'+
          '</div>';
        }).join('')+
      '</div>'+
    '</details>';
  });
  h += '</div>';

  cont.innerHTML = h;
}

// ══════════════════════════════════════════════════════════════════════
// Habilitar semanas del programa (lado profesional)
// ----------------------------------------------------------------------
// Se guardan en cbti_progress con item_id 'semana-N'. Se reusa la tabla
// que ya existe y ya tiene su RLS: una tabla nueva significaría escribir
// políticas nuevas, y las políticas nuevas son donde se filtran los datos.
// ══════════════════════════════════════════════════════════════════════
function dmCbtiSemanasHtml(){
  const prog = CBTI_STATE.progress || {};
  const abierta = function(n){ return !!(prog['semana-'+n] && prog['semana-'+n].completed); };
  const filas = DM_TCCI_PROGRAMA.map(function(s){
    // La primera va siempre: si activaste el programa, algo tiene que
    // poder leer mientras espera la consulta.
    const siempre = s.n===1;
    const on = siempre || abierta(s.n);
    return '<label class="dm-sem-fila'+(on?' on':'')+'">'+
      '<input type="checkbox" '+(on?'checked ':'')+(siempre?'disabled ':'')+
        'onchange="dmCbtiToggleSemana('+s.n+',this.checked)">'+
      '<span class="dm-sem-n">'+s.n+'</span>'+
      '<span class="dm-sem-txt"><b>'+s.titulo+'</b>'+
        '<span>'+(s.subtitulo||'')+'</span></span>'+
      (siempre?'<span class="dm-sem-tag">siempre visible</span>':'')+
    '</label>';
  }).join('');
  const n = DM_TCCI_PROGRAMA.filter(function(s){ return s.n===1 || abierta(s.n); }).length;
  return '<div class="dm-sem-box">'+
    '<div class="dm-sem-cab">'+
      '<div><div class="dm-sem-tit">Semanas habilitadas</div>'+
      '<div class="dm-sem-sub">Es lo único que define qué ve el paciente. '+
        'El contenido es el mismo del programa autogestionado; acá elegís el ritmo.</div></div>'+
      '<div class="dm-sem-cont">'+n+'<i>/'+DM_TCCI_PROGRAMA.length+'</i></div>'+
    '</div>'+ filas +
  '</div>';
}
function dmCbtiRenderSemanas(){
  const box=document.getElementById('cbti-semanas-box');
  if(box) box.innerHTML=dmCbtiSemanasHtml();
}
window.dmCbtiRenderSemanas = dmCbtiRenderSemanas;

async function dmCbtiToggleSemana(n, on){
  const drEmail = S.user && S.user.email;
  const patEmail = CBTI_STATE.patientEmail;
  if(!drEmail || !patEmail) return;
  const itemId='semana-'+n;
  const payload={ doctor_email:drEmail, patient_email:patEmail, module_id:'programa',
                  item_id:itemId, completed:!!on, completed_at:on?new Date().toISOString():null };
  CBTI_STATE.progress[itemId]={...(CBTI_STATE.progress[itemId]||{}), completed:!!on, completed_at:payload.completed_at};
  dmCbtiRenderSemanas();
  try{
    await fetch(SU+'/rest/v1/cbti_progress',{method:'POST',headers:{'apikey':SK,'Authorization':await db._getAuthHeader(),'Content-Type':'application/json','Prefer':'resolution=merge-duplicates,return=minimal'},body:JSON.stringify(payload)});
    toast(on?('Semana '+n+' habilitada'):('Semana '+n+' cerrada'));
  }catch(e){
    console.error('dmCbtiToggleSemana:', e);
    // Se revierte: dejar el tilde puesto haría creer al profesional que el
    // paciente ya tiene acceso a material que en realidad no puede ver.
    CBTI_STATE.progress[itemId]={...(CBTI_STATE.progress[itemId]||{}), completed:!on};
    dmCbtiRenderSemanas();
    toast('No se pudo guardar. Probá de nuevo.');
  }
}
window.dmCbtiToggleSemana = dmCbtiToggleSemana;

async function toggleCbtiItem(itemId, checked){
  const drEmail = S.user?.email; const patEmail = CBTI_STATE.patientEmail;
  if(!drEmail||!patEmail) return;
  const modId = itemId.split('_')[0];
  const payload = { doctor_email:drEmail, patient_email:patEmail, module_id:modId, item_id:itemId, completed:checked, completed_at:checked?new Date().toISOString():null };
  // Actualizar estado local primero (optimista)
  CBTI_STATE.progress[itemId] = {...(CBTI_STATE.progress[itemId]||{}), completed:checked, completed_at:payload.completed_at};
  // Actualizar SOLO la barra de progreso global y la del módulo, sin re-render total (no colapsa acordeones)
  updateCbtiProgressBars();
  try{
    await fetch(SU+'/rest/v1/cbti_progress',{method:'POST',headers:{'apikey':SK,'Authorization':await db._getAuthHeader(),'Content-Type':'application/json','Prefer':'resolution=merge-duplicates,return=minimal'},body:JSON.stringify(payload)});
  }catch(e){ console.error('toggleCbtiItem:', e); toast('⚠ Error al guardar'); }
}

// Actualiza barras de progreso y la fecha/strikethrough del item, SIN colapsar los acordeones
function updateCbtiProgressBars(){
  const doneCount = Object.values(CBTI_STATE.progress).filter(p=>p.completed).length;
  const pct = Math.round(doneCount/CBTI_TOTAL_ITEMS*100);
  const gp = document.getElementById('cbti-global-pct'); if(gp) gp.textContent = pct+'%';
  const gb = document.getElementById('cbti-global-bar'); if(gb) gb.style.width = pct+'%';
  const gc = document.getElementById('cbti-global-count'); if(gc) gc.textContent = doneCount+' de '+CBTI_TOTAL_ITEMS+' items completados';
  // Por módulo
  CBTI_PROTOCOL.modules.forEach(mod=>{
    const modDone = mod.items.filter(it=>CBTI_STATE.progress[it.id]?.completed).length;
    const modPct = Math.round(modDone/mod.items.length*100);
    const mc = document.getElementById('cbti-modcount-'+mod.id);
    if(mc) mc.textContent = modDone+'/'+mod.items.length+' items'+(modDone===mod.items.length?' · ✓ completo':'');
    const mp = document.getElementById('cbti-modpct-'+mod.id);
    if(mp) mp.textContent = modPct+'%';
    // El aviso de "todavía no lo ve" del desplegable: el acordeón no se
    // re-renderiza al tildar —para no cerrarse solo— así que se refresca acá.
    mod.items.forEach(function(it){
      const visto = !!(CBTI_STATE.progress[it.id] && CBTI_STATE.progress[it.id].completed);
      // El aviso vive ahora dentro del desplegable del módulo, uno por punto.
      const l = document.getElementById('cbti-lock-'+it.id);
      if(l) l.style.display = visto ? 'none' : '';
    });
  });
}

async function saveCbtiNote(itemId, notes){
  const drEmail = S.user?.email; const patEmail = CBTI_STATE.patientEmail;
  if(!drEmail||!patEmail) return;
  const modId = itemId.split('_')[0];
  const existing = CBTI_STATE.progress[itemId]||{};
  if((existing.notes||'')===(notes||'')) return; // sin cambios
  const payload = { doctor_email:drEmail, patient_email:patEmail, module_id:modId, item_id:itemId, notes:notes||'' };
  // Preservar completed si ya estaba marcado
  if(existing.completed){ payload.completed=true; payload.completed_at=existing.completed_at; }
  try{
    await fetch(SU+'/rest/v1/cbti_progress',{method:'POST',headers:{'apikey':SK,'Authorization':await db._getAuthHeader(),'Content-Type':'application/json','Prefer':'resolution=merge-duplicates,return=minimal'},body:JSON.stringify(payload)});
    CBTI_STATE.progress[itemId] = {...existing, notes};
  }catch(e){ console.error('saveCbtiNote:', e); }
}

function confirmDeactivateCbti(){
  if(!confirm('¿Desactivar a '+CBTI_STATE.patientName+' del módulo TCC-I? El progreso registrado se mantendrá guardado.')) return;
  toggleCbtiPatient(CBTI_STATE.patientEmail, CBTI_STATE.patientName, false);
  setTimeout(()=>openCbtiModule(),300);
}

// ─────────────────────────────────────────────────────────────────────
// Contenido por ítem (esquema viejo, se conserva por compatibilidad)
// ─────────────────────────────────────────────────────────────────────
// ── TCC-I VISTA DEL PACIENTE (desbloqueable a medida que el médico marca items) ──
// Contenido educativo breve por item, visible al paciente cuando el médico lo marca como completado
const CBTI_PATIENT_CONTENT = {
  M1_1: 'El sueño normal tiene varias fases (ligero, profundo y REM) que se alternan a lo largo de la noche. Saber cómo funciona te ayuda a entender por qué dormís como dormís.',
  M1_2: 'El modelo de las 3 P explica el insomnio: factores predisponentes (los que te hacen vulnerable), precipitantes (los que lo dispararon) y perpetuantes (los que lo mantienen). El tratamiento apunta a los perpetuantes.',
  M1_3: 'El diario de sueño es la herramienta más importante. Lo completás cada mañana al despertarte. Te ayuda a ver patrones que no son obvios mirando una sola noche.',
  M1_4: 'Hay muchos mitos sobre el sueño ("necesito 8 horas exactas", "si no dormí lo voy a pagar todo el día"). Tu profesional te va a ayudar a distinguir cuáles son ciertos y cuáles no.',
  M1_5: 'El TCC-I no es magia inmediata. Suele tomar 4 a 8 semanas verlo en plenitud. La constancia es lo que más cuenta.',
  M2_1: 'Cafeína, alcohol y nicotina alteran el sueño. La cafeína dura hasta 8 horas en el cuerpo. El alcohol parece relajar pero fragmenta el sueño profundo. Revisar exposición a pantallas, comidas tarde y luz también.',
  M2_2: 'La cama tiene que asociarse solo con dormir (y con tener sexo). Trabajar, mirar series, scrollear o discutir en la cama hace que tu cerebro asocie el lugar con vigilia.',
  M2_3: 'Si pasaron 15-20 minutos y no te dormís, levantate. Salí del dormitorio, hacé algo aburrido con luz tenue, y volvé solo cuando tengas sueño real. Suena contraintuitivo pero funciona.',
  M2_4: 'Despertarte siempre a la misma hora (incluso los fines de semana) es la herramienta más poderosa para regular tu reloj biológico. Más importante que la hora de acostarte.',
  M2_5: 'Si dormís de día, le robás presión de sueño a la noche. Lo ideal es eliminar siestas durante la fase aguda del tratamiento.',
  M3_1: 'La eficiencia del sueño se calcula así: horas dormidas / horas en la cama × 100. Si te metés a la cama 8 horas pero dormís 5, tu eficiencia es 62%. El objetivo es estar arriba del 85%.',
  M3_2: 'Vamos a limitar tu tiempo en la cama al promedio que estás durmiendo + 15 minutos. Al principio vas a estar más cansado, pero esto consolida el sueño rápidamente.',
  M3_3: 'Vamos a acordar una hora de acostarte y una de despertarte. No te acuestes antes (aunque tengas sueño), no te quedes después (aunque tengas sueño).',
  M3_4: 'Aunque tu sueño promedio sea de 4 horas, nunca pasamos de menos de 5 horas en cama. Es regla de seguridad.',
  M3_5: 'Cada semana revisamos cómo viene. Si la eficiencia supera el 85%, agregamos 15 minutos. Si está por debajo del 80%, los sacamos. Así se ajusta progresivamente.',
  M4_1: 'Las creencias sobre el sueño influyen muchísimo. "Si no duermo 8 horas no funciono", "tengo que dormirme rápido o se arruina la noche". Vamos a identificar las tuyas.',
  M4_2: 'Catastrofizar el sueño ("voy a estar destruido todo el día") activa el sistema de alerta y dificulta dormir. Es un círculo vicioso que vamos a romper.',
  M4_3: 'Vamos a aprender a cuestionar pensamientos automáticos. No reemplazar por positivos forzados, sino chequear qué evidencia tenés realmente para esa idea.',
  M4_4: 'Te voy a enseñar la técnica del "constructive worry": durante el día, dedicás 15 minutos a anotar tus preocupaciones y posibles soluciones. Así no te asaltan en la cama.',
  M5_1: 'Relajación muscular progresiva: tensar y relajar grupos musculares por turno. Se aprende y se practica fuera de la cama primero.',
  M5_2: 'Respiración diafragmática (4-7-8): inhalás 4 segundos, retenés 7, exhalás 8. Activa el sistema parasimpático.',
  M5_3: 'Imaginería guiada o mindfulness ayudan a sacar a la mente del bucle de preocupación. Hay apps que te pueden guiar.',
  M5_4: 'Si tu mente sigue activa en la cama, es señal de que necesitás bajar antes de acostarte. Implementamos rutina pre-sueño y "tiempo de mente activa" fuera del dormitorio.',
  M6_1: 'Vamos a revisar cómo viene tu progreso con datos concretos: eficiencia, escalas, diario.',
  M6_2: 'Las recaídas son comunes y no significan fracaso. Identificamos qué situaciones (viajes, estrés, cambios de horario) son riesgo para vos.',
  M6_3: 'Vas a salir con un plan claro de qué hacer si algunas técnicas se pierden con el tiempo.',
  M6_4: 'Vamos a definir cuándo se considera que terminamos el tratamiento, y plan de seguimiento a 3-6 meses para sostener los logros.'
};

// ── Motor de horario de sueño recomendado (restricción) para TCC-I autoguiado ──
// A partir del diario: calcula el tiempo dormido promedio y la eficiencia, y
// propone una horario de sueño recomendado consolidada + la regla semanal de ajuste
// (titración): eficiencia ≥90% amplía el horario, <85% la recorta. Es el
// mecanismo central de la restricción de sueño (SleepioRx / Spielman).
// anchorWake: hora fija de levantarse (minutos desde medianoche) acordada con
// el paciente. Es como manda el protocolo clásico de restricción de sueño: se
// ANCLA el despertar y se mueve solo la hora de acostarse. Promediar el
// despertar real, como hacíamos antes, arrastra el ancla hacia el desorden que
// justamente se quiere corregir. Si no se pasa ancla, se sugiere el despertar
// más TEMPRANO habitual (percentil 25) en vez del promedio, que es un punto de
// partida realista y no premia los días de mayor desfase.

// ─────────────────────────────────────────────────────────────────────
// Panel de la ventana de sueño que ve el profesional
// ─────────────────────────────────────────────────────────────────────
// Panel que ve el PROFESIONAL: propuesta del motor + campos editables.
async function renderCbtiWindowPanel(patientEmail){
  const box=document.getElementById('cbti-window-box');
  if(!box) return;
  const drEmail=S.user.email;
  const ov0 = await dmGetWindowOverride(patientEmail, drEmail);
  const sw  = await dmComputeWindowFor(patientEmail, ov0 && ov0.window_anchor!=null ? ov0.window_anchor : undefined);
  const ov  = ov0;
  window._cbtiWin = {sw, ov, patientEmail};
  let html='<div style="background:rgba(126,200,164,0.06);border:1px solid rgba(200,169,110,0.35);border-radius:14px;padding:16px;margin-bottom:18px">'+
    '<div style="font-size:12px;color:rgba(255,255,255,.9);text-transform:uppercase;letter-spacing:.06em;font-weight:700;margin-bottom:10px">Horario de sueño recomendado · restricción</div>';
  if(!sw || sw.error){
    html+='<div style="font-size:12.5px;color:rgba(255,255,255,.82);line-height:1.55">Todavía no hay diario suficiente para calcular la ventana'+
      (sw&&sw.n!=null?' ('+sw.n+' de 5 noches mínimas)':'')+'. Podés fijarla a mano igual.</div>';
  } else {
    const effCol = sw.eff>=90?'#7EC8A4':sw.eff>=85?'#C8A96E':'#fca5a5';
    html+='<div style="display:flex;gap:8px;margin-bottom:12px;flex-wrap:wrap">'+
      '<div style="flex:1;min-width:88px;background:rgba(255,255,255,0.05);border-radius:10px;padding:9px;text-align:center"><div style="font-size:9px;color:rgba(255,255,255,.72);letter-spacing:.05em">TST PROMEDIO</div><div style="font-size:16px;font-weight:700;color:#fff">'+sw.fmtDur(sw.avgTST)+'</div></div>'+
      '<div style="flex:1;min-width:88px;background:rgba(255,255,255,0.05);border-radius:10px;padding:9px;text-align:center"><div style="font-size:9px;color:rgba(255,255,255,.72);letter-spacing:.05em">TIB PROMEDIO</div><div style="font-size:16px;font-weight:700;color:#fff">'+sw.fmtDur(sw.avgTIB)+'</div></div>'+
      '<div style="flex:1;min-width:88px;background:rgba(255,255,255,0.05);border-radius:10px;padding:9px;text-align:center"><div style="font-size:9px;color:rgba(255,255,255,.72);letter-spacing:.05em">EFICIENCIA</div><div style="font-size:16px;font-weight:700;color:'+effCol+'">'+sw.eff+'%</div></div>'+
      '</div>'+
      '<div style="font-size:12px;color:rgba(255,255,255,.82);line-height:1.5;margin-bottom:10px;padding:9px 11px;background:rgba(255,255,255,0.04);border-radius:9px">'+
        '<strong style="color:#C8A96E">Propuesta del motor:</strong> '+sw.fmt(sw.bedTarget)+' → '+sw.fmt(sw.wakeTarget)+
        ' ('+sw.fmtDur(sw.windowMin)+', sobre '+sw.n+' noches). '+sw.titr.txt+'</div>'+
      // Ancla de despertar: es la decisión clínica que ordena todo el protocolo.
      '<div style="background:rgba(200,169,110,0.1);border:1px solid rgba(200,169,110,0.3);border-radius:10px;padding:10px 11px;margin-bottom:12px">'+
        '<div style="font-size:10px;color:#C8A96E;letter-spacing:.07em;font-weight:700;margin-bottom:5px">ANCLA DE DESPERTAR</div>'+
        '<div style="font-size:11.5px;color:rgba(255,255,255,.86);line-height:1.5;margin-bottom:8px">'+
          'La hora de levantarse se fija y NO se mueve; solo se ajusta la de acostarse. '+
          (sw.anchorFixed
            ? 'Ancla acordada: <strong style="color:#fff">'+sw.fmt(sw.wakeTarget)+'</strong>.'
            : 'Sin ancla acordada todavía — se está usando <strong style="color:#fff">'+sw.fmt(sw.anchorSug)+'</strong> (su despertar habitual más temprano).')+
          ' Su despertar real promedia '+sw.fmt(sw.avgWake)+' con una dispersión de '+sw.avgWakeSD+' min.</div>'+
        '<div style="display:flex;gap:8px;align-items:flex-end;flex-wrap:wrap">'+
          '<div style="flex:1;min-width:120px"><label style="font-size:9.5px;color:rgba(255,255,255,.72);display:block;margin-bottom:3px">HORA FIJA DE LEVANTARSE</label>'+
          '<input id="cbti-win-anchor" type="time" value="'+dmMinsToHHMM(sw.wakeTarget)+'" onchange="applyCbtiAnchor()" style="width:100%;background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.16);border-radius:9px;padding:9px;color:#fff;font-size:14px;font-family:var(--font)"></div>'+
          '<button onclick="applyCbtiAnchor()" style="background:rgba(200,169,110,0.25);border:1px solid rgba(200,169,110,0.5);color:#fff;border-radius:9px;padding:10px 13px;font-size:12px;cursor:pointer;font-family:var(--font)">Recalcular ventana</button>'+
        '</div>'+
      '</div>';
  }
  const curBed  = ov&&ov.window_bed!=null  ? ov.window_bed  : (sw&&!sw.error? sw.bedTarget : 23*60);
  const curWake = ov&&ov.window_wake!=null ? ov.window_wake : (sw&&!sw.error? sw.wakeTarget: 7*60);
  html+='<div style="display:flex;gap:10px;margin-bottom:10px;flex-wrap:wrap">'+
    '<div style="flex:1;min-width:120px"><label style="font-size:10px;color:rgba(255,255,255,.72);letter-spacing:.05em;display:block;margin-bottom:4px">ACOSTARSE</label>'+
      '<input id="cbti-win-bed" type="time" value="'+dmMinsToHHMM(curBed)+'" oninput="previewCbtiWindow()" style="width:100%;background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.16);border-radius:10px;padding:10px;color:#fff;font-size:15px;font-family:var(--font)"></div>'+
    '<div style="flex:1;min-width:120px"><label style="font-size:10px;color:rgba(255,255,255,.72);letter-spacing:.05em;display:block;margin-bottom:4px">LEVANTARSE</label>'+
      '<input id="cbti-win-wake" type="time" value="'+dmMinsToHHMM(curWake)+'" oninput="previewCbtiWindow()" style="width:100%;background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.16);border-radius:10px;padding:10px;color:#fff;font-size:15px;font-family:var(--font)"></div>'+
    '</div>'+
    '<div id="cbti-win-preview" style="font-size:12px;color:#7EC8A4;margin-bottom:10px"></div>'+
    '<label style="font-size:10px;color:rgba(255,255,255,.72);letter-spacing:.05em;display:block;margin-bottom:4px">INDICACIÓN PARA EL PACIENTE (opcional)</label>'+
    '<textarea id="cbti-win-note" rows="2" placeholder="Ej: sostené esta ventana 7 noches; si la eficiencia sube de 90% adelantamos 15 min." style="width:100%;background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.16);border-radius:10px;padding:10px;color:#fff;font-size:13px;font-family:var(--font);resize:vertical">'+((ov&&ov.window_note)?String(ov.window_note).replace(/</g,'&lt;'):'')+'</textarea>'+
    '<div style="display:flex;gap:8px;margin-top:10px;flex-wrap:wrap">'+
      '<button id="cbti-win-save" onclick="saveCbtiWindow()" style="flex:1;min-width:150px;background:#7EC8A4;color:#0F2820;border:none;border-radius:10px;padding:11px;font-size:13.5px;font-weight:700;cursor:pointer;font-family:var(--font)">Guardar ventana</button>'+
      (sw&&!sw.error?'<button onclick="resetCbtiWindowToEngine()" style="background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.2);color:#fff;border-radius:10px;padding:11px 14px;font-size:12.5px;cursor:pointer;font-family:var(--font)">Usar la del motor</button>':'')+
    '</div>';
  if(ov&&ov.window_set_at){
    html+='<div style="font-size:10.5px;color:rgba(255,255,255,.72);margin-top:8px">Ajustada el '+new Date(ov.window_set_at).toLocaleDateString('es-AR',{day:'2-digit',month:'short',year:'numeric'})+'. El paciente ve esta ventana, no la del motor.</div>';
  }
  html+='</div>';
  box.innerHTML=html;
  previewCbtiWindow();
}
function previewCbtiWindow(){
  const b=dmHHMMToMins(document.getElementById('cbti-win-bed')?.value);
  const w=dmHHMMToMins(document.getElementById('cbti-win-wake')?.value);
  const el=document.getElementById('cbti-win-preview');
  if(!el) return;
  if(b==null||w==null){ el.textContent=''; return; }
  const dur=dmWindowDuration(b,w);
  const hh=Math.floor(dur/60), mm=dur%60;
  let msg='Ventana: '+hh+' h '+String(mm).padStart(2,'0')+' m en cama.';
  if(dur<300){ el.style.color='#fca5a5'; msg+=' Por debajo del piso de seguridad de 5 h que recomiendan las guías.'; }
  else if(dur>540){ el.style.color='#C8A96E'; msg+=' Muy amplia para una fase de restricción.'; }
  else { el.style.color='#7EC8A4'; }
  el.textContent=msg;
}
// Cambiar el ancla recalcula la ventana entera: la hora de acostarse se
// deriva de (ancla − tiempo dormido promedio).
async function applyCbtiAnchor(){
  const st=window._cbtiWin||{};
  const a=dmHHMMToMins(document.getElementById('cbti-win-anchor')?.value);
  if(a==null) return;
  const sw=await dmComputeWindowFor(st.patientEmail, a);
  if(!sw||sw.error) return;
  const b=document.getElementById('cbti-win-bed'), w=document.getElementById('cbti-win-wake');
  if(b) b.value=dmMinsToHHMM(sw.bedTarget);
  if(w) w.value=dmMinsToHHMM(sw.wakeTarget);
  window._cbtiWin.sw=sw;
  previewCbtiWindow();
}
function resetCbtiWindowToEngine(){
  const sw=(window._cbtiWin||{}).sw; if(!sw||sw.error) return;
  const b=document.getElementById('cbti-win-bed'), w=document.getElementById('cbti-win-wake');
  if(b) b.value=dmMinsToHHMM(sw.bedTarget);
  if(w) w.value=dmMinsToHHMM(sw.wakeTarget);
  previewCbtiWindow();
}
async function saveCbtiWindow(){
  const st=window._cbtiWin||{};
  const patEmail=st.patientEmail||CBTI_STATE.patientEmail;
  if(!patEmail) return;
  const bed=dmHHMMToMins(document.getElementById('cbti-win-bed')?.value);
  const wake=dmHHMMToMins(document.getElementById('cbti-win-wake')?.value);
  if(bed==null||wake==null){ toast('Revisá los horarios'); return; }
  const dur=dmWindowDuration(bed,wake);
  if(dur<240){ toast('La ventana no puede ser menor a 4 h'); return; }
  const note=(document.getElementById('cbti-win-note')?.value||'').trim();
  setBtn('cbti-win-save', true);
  try{
    const drEmail=S.user.email;
    await fetch(SU+'/rest/v1/cbti_patients',{
      method:'POST',
      headers:{'apikey':SK,'Authorization':await db._getAuthHeader(),'Content-Type':'application/json',
               'Prefer':'resolution=merge-duplicates,return=minimal'},
      body:JSON.stringify({doctor_email:drEmail, patient_email:(patEmail||'').toLowerCase(), active:true,
                           window_bed:bed, window_wake:wake, window_note:note||null,
                           window_anchor:dmHHMMToMins(document.getElementById('cbti-win-anchor')?.value),
                           window_set_at:new Date().toISOString()})
    }).then(async r=>{ if(!r.ok){ throw new Error(await r.text()); } });
    toast('Ventana guardada ✓');
    renderCbtiWindowPanel(patEmail);
  }catch(e){
    console.error('[TCCI] guardar ventana:', e);
    toast('No se pudo guardar. Faltan las columnas de ventana en la base.');
  }finally{ setBtn('cbti-win-save', false, 'Guardar ventana'); }
}

// ═══════════════════════════════════════════════════════════════════════
// PROGRAMA TCC-I AUTOGUIADO · 6 semanas
// Estructura según las guías de primera línea (AASM 2021, ESRS 2023): los
// componentes con evidencia son restricción de sueño, control de estímulos,
// reestructuración cognitiva, relajación y prevención de recaídas. La higiene
// del sueño sola NO es tratamiento: va como apoyo, nunca como núcleo.
//
// MODELO DE ACCESO: el horario recomendado calculada es GRATUITA (es la prueba
// de que el cálculo sirve). El acompañamiento semana a semana es de pago.
// Todo el control pasa por dmTcciTieneAcceso(): cuando exista el cobro real,
// se cambia ahí y en ningún otro lado.

// ─────────────────────────────────────────────────────────────────────
// El programa de siete semanas, del lado del paciente
// ─────────────────────────────────────────────────────────────────────
const DM_TCCI_PROGRAMA = [
  {
    n:1, figura:'amanecer', lecturas:['higiene','horas','tcci'], titulo:'Cómo funciona tu sueño', subtitulo:'Lo que conviene entender antes de cambiar nada',
    objetivo:'Entender por qué se sostiene el insomnio y preparar el terreno. Esta semana no se cambia el horario: se observa y se aprende.',
    contenido:'Antes de tocar nada, conviene entender <b>qué mantiene</b> el insomnio. Porque lo que lo empieza y lo que lo sostiene casi nunca son la misma cosa.\n\nCasi siempre arranca por algo puntual: una mudanza, un duelo, un trabajo nuevo, una enfermedad. Eso pasa. Pero el insomnio se queda, y se queda por lo que uno hace para defenderse de él.\n\n<b>Dos fuerzas gobiernan el sueño.</b>\n\nLa primera es la <b>presión de sueño</b>. Desde que te despertás se va acumulando una sustancia (adenosina) que empuja a dormir. Cuanto más tiempo despierto, más empuje. Una siesta larga, o quedarse en la cama a la mañana, gasta esa presión antes de tiempo.\n\nLa segunda es el <b>reloj biológico</b>. Marca cuándo tu cuerpo espera dormir, y se ajusta sobre todo con la luz de la mañana y con la hora a la que te levantás. No con la hora a la que te acostás.\n\nCuando las dos coinciden, uno se duerme sin pensarlo. El insomnio crónico casi siempre es que se desalinearon.\n\n<b>Por qué se sostiene.</b> Después de varias noches malas empieza lo lógico: acostarse antes por las dudas, quedarse un rato más a la mañana, dormir una siesta, cancelar cosas por el cansancio. Cada una de esas medidas tiene sentido en el momento y todas empeoran el cuadro: diluyen la presión de sueño y corren el reloj.\n\nY se suma algo más: la cama deja de ser el lugar donde uno se duerme y pasa a ser el lugar donde uno lucha por dormirse. El cuerpo aprende eso, y se activa al acostarse.\n\n<b>Qué vas a hacer estas siete semanas.</b> Nada de esto es fuerza de voluntad. Vas a corregir esas dos fuerzas con cambios concretos, y a desarmar la asociación entre la cama y el estar despierto. Se hace en un orden probado y cada semana se apoya en la anterior.\n\n<b>La higiene del sueño, en su lugar justo.</b> Lo que sigue ayuda, pero conviene ser honesto: <b>si ya tenés un insomnio instalado, esto solo no alcanza</b>. Es el piso, no el tratamiento. La parte que de verdad mueve la aguja empieza la semana que viene.\n\n· <b>Levantarte siempre a la misma hora.</b> Es la más importante y la que menos se cumple. Incluye fines de semana.\n· <b>Luz de la mañana.</b> Diez o quince minutos de luz natural en la primera hora ordenan el reloj más que cualquier otra cosa.\n· <b>Cafeína hasta el mediodía.</b> Tarda entre 5 y 7 horas en bajar a la mitad. La de las 17 sigue actuando a medianoche.\n· <b>Alcohol, no.</b> Ayuda a dormirse y rompe la segunda mitad de la noche. Es de las cosas que más ensucian el sueño.\n· <b>El dormitorio: fresco, oscuro y silencioso.</b> Entre 18 y 20 grados.\n· <b>Nada de mirar el reloj de noche.</b> Calcular cuánto falta activa, y la activación es lo contrario del sueño.\n\n<b>Esta semana solo registrás.</b> No cambies el horario todavía. Completá el diario cada mañana: lo que anotes ahora es lo que va a definir tu ventana de sueño la semana que viene. Sin ese registro, el resto del programa no tiene con qué calcular.',
    tareas:['Completar el diario cada mañana, apenas te levantás','Levantarte todos los días a la misma hora, incluso el fin de semana','Tomar luz natural en la primera hora del día','Cortar la cafeína al mediodía','Sacar el reloj de la vista durante la noche'],
    libre:true
  },
  {
    n:2, figura:'cama', lecturas:['horas','cafe-alcohol'], titulo:'Restricción del tiempo en cama', subtitulo:'Pasar en la cama el tiempo que realmente dormís',
    objetivo:'Fijar tu horario de sueño y entender por qué achicar el tiempo en cama, aunque suene al revés, es lo que mejor funciona.',
    contenido:'A esto se lo llama <b>restricción del tiempo en cama</b>, y conviene leer bien el nombre: lo que se achica es el tiempo ACOSTADO, no el tiempo dormido. Vas a dormir lo mismo o más; lo que baja es el rato que pasás despierto en la cama.\n\nCuando dormís mal, lo natural es compensar: acostarse antes, levantarse más tarde, quedarse un rato más "por las dudas". Es lo que haría cualquiera. Y es justo lo que mantiene el problema.\n\nPensalo así: el sueño funciona como el hambre. Si picoteás todo el día, no llegás con hambre a la cena. Si pasás diez horas en la cama para dormir seis, esas cuatro horas de más son picoteo: gastás las ganas de dormir dando vueltas, y el sueño que queda se reparte fino y se despierta fácil.\n\nLo que vamos a hacer es lo contrario. Vas a pasar en la cama aproximadamente el tiempo que realmente dormís, ni más. No vas a dormir menos que ahora: vas a estar menos tiempo despierto en la cama. Ese sueño más concentrado es más profundo y se corta menos.\n\nTe lo decimos de frente: la primera semana suele ser la más dura. Es normal sentirse más cansado los primeros días. Ese cansancio no es un problema, es la señal de que se está acumulando el sueño que después vas a aprovechar mejor.',
    tareas:['Levantarte siempre a la misma hora, también sábados y domingos','No acostarte antes de la hora indicada, aunque tengas sueño en el sillón','Completar el diario cada mañana, apenas te levantás','No dormir siestas durante esta etapa'],
    libre:false
  },
  {
    n:3, figura:'puerta', lecturas:['pantallas','despertares'], titulo:'Control de estímulos', subtitulo:'Que la cama vuelva a significar dormir',
    objetivo:'Cortar la asociación entre la cama y estar despierto dando vueltas.',
    contenido:'El <b>control de estímulos</b> trabaja sobre una sola idea: <b>tu cama es una señal</b>, y esa señal se aprende.\n\nPensá en algo cotidiano: si todos los días tomás café al sentarte en el mismo sillón, con el tiempo sentarte ahí ya te da ganas de café. No lo decidís. El cuerpo aprendió que ese lugar significa eso.\n\nLa cama funciona igual, y ahí está el problema. Si pasaste meses acostado dando vueltas, revisando el teléfono, mirando series, contestando mensajes, trabajando con la notebook apoyada en las piernas, preocupándote por lo del día siguiente — tu cerebro aprendió que la cama es el lugar donde se está DESPIERTO. Y no lo aprendió como una idea: lo aprendió como un reflejo. Por eso mucha gente cabecea en el sillón y se despabila al acostarse. No es mala suerte ni nervios: es el reflejo funcionando.\n\n<b>Entonces hay dos trabajos, no uno.</b>\n\n<b>El primero es sacar de la cama todo lo que no sea dormir.</b> Es el que menos se habla y el que más rinde a largo plazo. La cama no es para mirar el teléfono, ni para trabajar, ni para comer, ni para ver una serie, ni para hacer llamadas, ni para dar vueltas pensando. Solo dormir y tener relaciones sexuales — esa es la única excepción, y es la clásica.\n\nSi leer en la cama te ayuda a dormirte, se puede: en papel, con luz tenue y hasta que aparezca el sueño. Si leer te despierta, no.\n\nEsto suena menor y no lo es. Cada rato que pasás despierto en la cama refuerza la asociación que estás tratando de romper. Si trabajás en la cama todas las tardes, la regla de levantarte a la noche no va a alcanzar.\n\n<b>El segundo es no quedarte despierto ahí.</b> Y se apoya en el primero: si la cama ya no es el lugar donde se hacen cosas, quedarse despierto se vuelve la excepción y no la costumbre.\n\nSi pasaste meses acostado sin poder dormir, tu cerebro aprendió algo: que la cama es el lugar donde uno se queda despierto pensando. No es una idea que tengas conscientemente; es un reflejo, como cuando se te hace agua la boca al ver comida.\n\nLa buena noticia es que ese aprendizaje se puede revertir, y se revierte con una regla simple de decir y difícil de sostener: si no te dormís en unos veinte minutos, levantate.\n\nNo mires el reloj para contarlos —eso te activa más—; usá tu propia sensación. Si sentís que estás dando vueltas, salí de la cama. Andá a otro ambiente, con la luz lo más baja posible, y hacé algo tranquilo y más bien aburrido: leer algo liviano, doblar ropa, escuchar algo suave. Nada de pantallas brillantes, trabajo ni noticias. Volvés a la cama recién cuando sentís sueño de verdad, no cuando te aburriste.\n\nPuede que la primera noche tengas que levantarte tres o cuatro veces. Es esperable y baja rápido: para la mayoría, en menos de una semana ya son una o ninguna.',
    tareas:['Usar la cama solamente para dormir y para tener relaciones','Sacar de la cama el teléfono, la notebook y la tele','No comer ni trabajar en la cama, tampoco de día','Levantarte de la cama cuando sientas que estás dando vueltas','Mantener el mismo horario de la semana pasada'],
    libre:false
  },
  {
    n:4, figura:'regla', lecturas:['horas'], titulo:'Ajuste del horario', subtitulo:'Ajustamos tu horario con tus propios datos',
    objetivo:'Ampliar o mantener tu tiempo en cama según cómo dormiste estas dos semanas.',
    contenido:'La <b>titulación</b> es simplemente ir ajustando la dosis de a poco hasta encontrar la justa. Acá la dosis es tu tiempo en cama.\n\nYa tenés dos semanas de registro, así que podemos ajustar con tus datos y no a ojo.\n\nLo que miramos se llama eficiencia de sueño, y es una cuenta simple: del tiempo que pasaste en la cama, qué porcentaje dormiste realmente. Si estuviste siete horas acostado y dormiste seis, tu eficiencia es del 86%. La app ya te la calcula.\n\nLa regla del ajuste:\n\n· Si tu eficiencia superó el 90%, estás durmiendo casi todo el tiempo que estás acostado. Podés adelantar quince minutos la hora de acostarte.\n· Si quedó entre 85 y 90, vas bien pero todavía no. Sostené el mismo horario una semana más.\n· Si quedó por debajo de 85, conviene recortar quince minutos más para volver a concentrar el sueño.\n\nUna sola cosa no se toca: la hora de levantarte. Es el ancla de todo el sistema. Si la movés, el reloj interno se desordena y perdés lo ganado. Los ajustes se hacen siempre corriendo la hora de acostarse.',
    tareas:['Mirar tu eficiencia de sueño en la app','Aplicar el ajuste que te corresponda','Seguir levantándote de la cama si estás dando vueltas','Mantener la hora de levantarte sin moverla'],
    libre:false
  },
  {
    n:5, figura:'nube', lecturas:['despertares'], titulo:'Reestructuración cognitiva', subtitulo:'Los pensamientos que no te dejan dormir',
    objetivo:'Reconocer las ideas que te activan al acostarte y ponerlas a prueba con tus propios datos.',
    contenido:'La <b>reestructuración cognitiva</b> suena complicado y es esto: revisar si lo que pensás sobre tu sueño es verdad.\n\n"Si no duermo ocho horas, mañana no funciono." "Ya perdí la capacidad de dormir." "Si no me duermo ahora, mañana es un desastre."\n\nEstos pensamientos parecen inofensivos, pero hacen algo muy concreto: te ponen en alerta justo cuando necesitás lo contrario. Convierten la cama en un examen que tenés que aprobar, y nadie se duerme rindiendo un examen.\n\nEl trabajo no es repetirse cosas positivas —eso no funciona y además no te lo creés—. Es contrastar la idea con lo que realmente pasó. Y para eso tenés algo que casi nadie tiene: semanas de registro.\n\nBuscá en tu diario una noche que dormiste mal. Ahora acordate de ese día siguiente. ¿Fue el desastre que anticipabas? Casi siempre la respuesta es que fue un día regular, cansador, pero que funcionaste. La catástrofe que temés a las tres de la mañana rara vez ocurre, y tus propios datos lo demuestran.\n\nOtra cosa que ayuda: si te acostás con la cabeza llena de pendientes, reservá quince minutos a la tarde para anotarlos en papel. No para resolverlos, solo para sacarlos de la cabeza. Suena menor y cambia bastante.',
    tareas:['Anotar qué pensamiento aparece cuando no podés dormir','Buscar en tu diario un día que lo contradiga','Reservar quince minutos a la tarde para anotar lo pendiente'],
    libre:false
  },
  {
    n:6, figura:'respirar', lecturas:['pantallas'], titulo:'Técnicas de desactivación', subtitulo:'Bajar las revoluciones antes de acostarte',
    objetivo:'Llegar a la cama menos activado, en cuerpo y en cabeza.',
    contenido:'Las <b>técnicas de desactivación</b> no sirven para dormirte: sirven para llegar a la cama con el cuerpo y la cabeza menos acelerados.\n\nHay una paradoja en el centro del insomnio: cuanto más te esforzás por dormir, menos dormís. El sueño no es algo que se hace, es algo que pasa cuando dejás de interferir. Es como intentar tragar a propósito o quedarse dormido a las órdenes: el esfuerzo mismo lo impide.\n\nAsí que no vamos a entrenarte para dormir. Vamos a bajar el nivel de activación con el que llegás a la cama, que es otra cosa.\n\nLo que sirve, en orden de facilidad:\n\n· Respiración lenta. Inhalá contando cuatro y exhalá contando seis u ocho. La exhalación larga es la que baja el pulso. Cinco minutos alcanzan.\n· Relajación muscular progresiva. Tensás un grupo de músculos cinco segundos y soltás, subiendo desde los pies. Le da a la cabeza algo concreto en qué ocuparse.\n· Media hora de descenso antes de acostarte, con luz baja, sin pantallas brillantes y sin conversaciones ni contenidos que te activen.\n\nY una recomendación que parece menor: sacá el reloj de la vista. Mirar la hora de noche no aporta nada y te hace calcular cuánto te queda, que es exactamente la clase de cuenta que te desvela.',
    tareas:['Practicar respiración lenta cinco minutos antes de acostarte','Armar una rutina de descenso de treinta minutos con luz baja','Sacar el reloj y el teléfono de donde puedas ver la hora'],
    libre:false
  },
  {
    n:7, figura:'brujula', lecturas:['higiene','tcci'], titulo:'Prevención de recaídas', subtitulo:'Que lo logrado dure en el tiempo',
    objetivo:'Consolidar lo que te funcionó y tener listo un plan para cuando vuelvan las malas noches.',
    contenido:'La <b>prevención de recaídas</b> es la parte que casi nadie hace y la que decide si esto dura seis meses o seis años.\n\nVas a volver a dormir mal alguna noche. No es una recaída: es cómo duerme todo el mundo. Un viaje, un problema, una gripe, y aparecen dos o tres noches malas. Eso le pasa también a quien nunca tuvo insomnio.\n\nLa recaída de verdad es otra cosa, y empieza siempre igual: ante unas noches malas, se vuelve a los viejos hábitos. Quedarse más tiempo en la cama para recuperar, dormir una siesta, adelantar la hora de acostarse. En una semana el problema está instalado otra vez.\n\nPor eso conviene tener el plan escrito de antemano, cuando estás bien y podés pensar con claridad:\n\n· Tus tres reglas innegociables. Casi siempre son: hora fija de levantarse, no quedarse en la cama sin dormir, y no compensar con siestas.\n· Tu señal de alarma. Por ejemplo, tres malas noches seguidas.\n· Tu plan de rescate. Volver al horario de la semana 1 durante siete días. En la mayoría de los casos, alcanza.\n\nSeguí registrando aunque sea unos días por mes. Es la forma de darte cuenta temprano, cuando todavía es fácil de corregir.',
    tareas:['Escribir tus tres reglas innegociables','Definir tu señal de alarma y tu plan de rescate','Seguir registrando al menos unos días por mes'],
    libre:false
  }
];


// Punto único de control del acceso al programa pago. Hoy devuelve false para
// todos salvo que exista la marca local; cuando esté el cobro, se reemplaza
// por la consulta real de suscripción.
// Cuentas con acceso completo al programa autogestionado sin pasar por el
// cobro. Es para poder recorrerlo entero desde adentro antes de abrirlo.
const DM_TCCI_ACCESO_LIBRE = ['diezjoaquinjose@gmail.com'];
function dmTcciTieneAcceso(){
  try{
    const _e = (S && S.user && S.user.email ? String(S.user.email) : '').toLowerCase().trim();
    if(_e && DM_TCCI_ACCESO_LIBRE.indexOf(_e) >= 0) return true;
  }catch(_){}
  try{ if(localStorage.getItem('dm_tcci_acceso')==='1') return true; }catch(_){}
  return false;
}
function dmTcciSemanaActual(){
  try{
    const ini=localStorage.getItem('dm_tcci_inicio');
    if(!ini) return 1;
    const dias=Math.floor((Date.now()-new Date(ini).getTime())/86400000);
    return Math.max(1, Math.min(DM_TCCI_PROGRAMA.length, Math.floor(dias/7)+1));
  }catch(_){ return 1; }
}
// Borra TODO el rastro local del programa: progreso, semanas cerradas,
// encuestas y disposición. Es para recorrerlo de nuevo desde cero durante
// la prueba, así que está limitado a las cuentas con acceso libre — no es
// algo que un paciente deba poder hacer sin querer.
function dmTcciReiniciar(){
  if(!dmTcciTieneAcceso()) return;
  if(!confirm('¿Volver el programa a cero?\n\nSe borra tu progreso, las semanas cerradas y las respuestas de las encuestas guardadas en este dispositivo. Lo que ya se subió al servidor queda.')) return;
  ['dm_tcci_inicio','dm_tcci_hechos','dm_tcci_cerradas','dm_tcci_encuestas',
   'dm_tcci_disposicion','dm_tcci_interes','dm_tcci_mig7'].forEach(function(k){
    try{ localStorage.removeItem(k); }catch(_){}
  });
  try{
    const _e = S && S.user && S.user.email;
    if(_e) db.patch('patients?email=eq.'+encodeURIComponent(_e), { tcci_estado: null }).catch(function(){});
  }catch(_){}
  try{ toast('Programa reiniciado. Arranca de cero.'); }catch(_){}
  try{ openPatientCbtiView(); }catch(_){}
}
window.dmTcciReiniciar = dmTcciReiniciar;

// ══════════════════════════════════════════════════════════════════════
// Que el profesional pueda ver el avance del programa
// ----------------------------------------------------------------------
// El progreso del autogestionado vive en el localStorage del PACIENTE: el
// profesional no tenía forma de saber si su paciente empezó la TCC-I ni
// por dónde va. Preguntárselo en consulta funciona, pero llega tarde y
// depende de la memoria del otro.
//
// Se sube un resumen —no el detalle— a patients.tcci_estado. Va en una
// columna jsonb de una tabla que ya existe y cuya RLS ya está escrita y
// probada (es la misma por la que el profesional lee `tags`). Una tabla
// nueva significaría policies nuevas, y las policies nuevas son donde se
// filtran los datos.
//
// Lo que se sube: cuándo empezó, qué semanas cerró, cuántas tareas lleva.
// Lo que NO se sube: las respuestas de las encuestas ni los comentarios.
// Eso es del paciente y de la investigación, no del seguimiento clínico.
async function dmTcciSincronizarEstado(){
  try{
    const email = S && S.user && S.user.email;
    if(!email || S.role!=='patient') return;
    let inicio=null;
    try{ inicio = localStorage.getItem('dm_tcci_inicio'); }catch(_){}
    if(!inicio) return;
    const cerradas = DM_TCCI_PROGRAMA
      .filter(function(s){ return dmTcciCerrada(s.n); })
      .map(function(s){ return s.n; });
    const p = dmTcciProgresoTotal();
    const estado = {
      inicio: inicio,
      semanas_cerradas: cerradas,
      ultima_cerrada: cerradas.length ? Math.max.apply(null, cerradas) : 0,
      total_semanas: DM_TCCI_PROGRAMA.length,
      tareas_hechas: p.hechas,
      tareas_total: p.total,
      pct: p.pct,
      modo: dmTcciModo(),
      actualizado: new Date().toISOString()
    };
    await db.patch('patients?email=eq.'+encodeURIComponent(email), { tcci_estado: estado });
  }catch(e){
    // Si la columna todavía no existe, esto falla y no pasa nada más: el
    // programa del paciente no puede depender de que el profesional lo vea.
    console.warn('[TCCI-ESTADO] no se pudo sincronizar:', (e&&e.message)||e);
  }
}
window.dmTcciSincronizarEstado = dmTcciSincronizarEstado;

function dmTcciEmpezar(){
  try{ if(!localStorage.getItem('dm_tcci_inicio')) localStorage.setItem('dm_tcci_inicio', new Date().toISOString()); }catch(_){}
  toast('Programa iniciado ✓');
  try{ dmTcciSincronizarEstado(); }catch(_){}
  openPatientCbtiView();
}
// ══ TCC-I · seguimiento de tareas ═══════════════════════════════════════
// Hasta ahora las tareas eran una lista con tildes decorativos: no se podia
// marcar nada y no habia forma de saber por donde iba uno. La adherencia a un
// programa conductual depende de poder ver el propio avance, asi que las
// tareas pasan a ser marcables y el progreso se muestra en las dos vistas.
// Se guarda en el dispositivo. No es dato clinico: es la lista de la persona.
function dmTcciHechos(){
  dmTcciMigrarSemanas();
  try{ return JSON.parse(localStorage.getItem('dm_tcci_hechos')||'{}'); }catch(_){ return {}; }
}
// Al agregar la semana de psicoeducación adelante, todas las demás corrieron
// un número. Quien ya venía haciendo el programa tenía su progreso guardado
// con la numeración vieja: sin esto, alguien con la semana 1 terminada la
// vería vacía y la de psicoeducación marcada como hecha sin haberla leído.
// Corre una sola vez y deja constancia para no repetirse.
function dmTcciMigrarSemanas(){
  try{
    if(localStorage.getItem('dm_tcci_mig7')==='1') return;
    const corrida = function(clave, esClaveCompuesta){
      let m={};
      try{ m=JSON.parse(localStorage.getItem(clave)||'{}'); }catch(_){ return; }
      if(!m || !Object.keys(m).length) return;
      const nuevo={};
      Object.keys(m).forEach(function(k){
        if(esClaveCompuesta){
          const partes=String(k).split('.');
          const n=parseInt(partes[0],10);
          if(!isNaN(n) && n>=1 && n<=6) nuevo[(n+1)+'.'+partes[1]]=m[k];
          else nuevo[k]=m[k];
        }else{
          const n=parseInt(k,10);
          if(!isNaN(n) && n>=1 && n<=6) nuevo[String(n+1)]=m[k];
          else nuevo[k]=m[k];
        }
      });
      localStorage.setItem(clave, JSON.stringify(nuevo));
    };
    corrida('dm_tcci_hechos', true);
    corrida('dm_tcci_cerradas', false);
    localStorage.setItem('dm_tcci_mig7','1');
    console.log('[TCC-I] progreso corrido a la numeración de 7 semanas');
  }catch(_){}
}

function dmTcciMarcar(semana, idx){
  const k = semana+'.'+idx;
  const m = dmTcciHechos();
  if(m[k]) delete m[k]; else m[k]=true;
  try{ localStorage.setItem('dm_tcci_hechos', JSON.stringify(m)); }catch(_){}
  // Con retardo: marcar cuatro tareas seguidas no tiene por qué ser cuatro
  // escrituras. La última gana.
  try{
    clearTimeout(window._dmTcciSyncT);
    window._dmTcciSyncT = setTimeout(function(){ dmTcciSincronizarEstado(); }, 1500);
  }catch(_){}
  const cont=document.getElementById('dm-tcci-tareas-'+semana);
  const s=DM_TCCI_PROGRAMA.find(x=>x.n===semana);
  if(cont && s) cont.innerHTML=dmTcciTareasHtml(s);
  const barra=document.getElementById('dm-tcci-progreso');
  if(barra) barra.outerHTML=dmTcciProgresoHtml();
  // El bloque del cierre TAMBIÉN. Sin esto, marcabas la última tarea y no
  // pasaba nada: el botón de "Terminé" recién aparecía al salir y volver.
  const cierre=document.getElementById('dm-tcci-cierre-'+semana);
  if(cierre && s) cierre.innerHTML=dmTcciCierreHtml(s);
  // La lista de semanas tambien muestra el avance de cada una.
  try{ if(typeof openPatientCbtiView==='function' && document.getElementById('dm-tcci-lista')) openPatientCbtiView(); }catch(_){}
}
function dmTcciProgresoSemana(s){
  const m=dmTcciHechos();
  const total=(s.tareas||[]).length;
  if(!total) return {hechas:0, total:0, pct:0};
  let hechas=0;
  for(let i=0;i<total;i++) if(m[s.n+'.'+i]) hechas++;
  return {hechas, total, pct: Math.round(hechas/total*100)};
}
function dmTcciProgresoTotal(){
  let h=0, t=0;
  DM_TCCI_PROGRAMA.forEach(function(s){ const p=dmTcciProgresoSemana(s); h+=p.hechas; t+=p.total; });
  return {hechas:h, total:t, pct: t?Math.round(h/t*100):0};
}
function dmTcciTareasHtml(s){
  const m=dmTcciHechos();
  const p=dmTcciProgresoSemana(s);
  return '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:9px">'+
      '<span style="font-size:11.5px;letter-spacing:.07em;color:rgba(244,239,229,.76);font-weight:700">TU TAREA ESTA SEMANA</span>'+
      '<span style="font-size:11px;font-weight:700;color:'+(p.pct===100?'#7EC8A4':'rgba(255,255,255,.55)')+'">'+p.hechas+' de '+p.total+'</span>'+
    '</div>'+
    '<div style="height:5px;background:rgba(255,255,255,.09);border-radius:3px;overflow:hidden;margin-bottom:10px">'+
      '<div style="height:100%;width:'+p.pct+'%;background:'+(p.pct===100?'#7EC8A4':'#C8A96E')+';border-radius:3px;transition:width .25s"></div>'+
    '</div>'+
    (s.tareas||[]).map(function(t,i){
      const hecho=!!m[s.n+'.'+i];
      return '<div onclick="dmTcciMarcar('+s.n+','+i+')" style="display:flex;gap:11px;align-items:flex-start;padding:9px 0;cursor:pointer;'+(i<s.tareas.length-1?'border-bottom:1px solid rgba(255,255,255,.06);':'')+'">'+
        '<span style="flex-shrink:0;width:20px;height:20px;border-radius:6px;border:1.5px solid '+(hecho?'#7EC8A4':'rgba(255,255,255,.28)')+';background:'+(hecho?'#7EC8A4':'transparent')+';color:#0f2b22;font-size:13px;font-weight:700;display:flex;align-items:center;justify-content:center;line-height:1">'+(hecho?'✓':'')+'</span>'+
        '<span style="flex:1;font-size:13.5px;line-height:1.55;color:'+(hecho?'rgba(255,255,255,.45)':'rgba(255,255,255,.85)')+';'+(hecho?'text-decoration:line-through;':'')+'">'+t+'</span></div>';
    }).join('');
}
// Cerrar la semana a mano. Marcar la ultima tarea y que no pase nada deja la
// sensacion de que el programa no registra el esfuerzo; un programa conductual
// de seis semanas vive de eso.
function dmTcciCierreHtml(s){
  const p=dmTcciProgresoSemana(s);
  if(!p.total) return '';
  const cerrada = (function(){ try{ return JSON.parse(localStorage.getItem('dm_tcci_cerradas')||'{}')[s.n]===true; }catch(_){ return false; } })();
  if(cerrada){
    return '<div style="background:rgba(126,200,164,.12);border:1px solid rgba(126,200,164,.35);border-radius:12px;padding:13px 15px;text-align:center">'+
      '<div style="font-size:22px;margin-bottom:3px">✓</div>'+
      '<div style="font-size:13.5px;font-weight:700;color:#7EC8A4">Semana '+s.n+' terminada</div>'+
      '<div style="font-size:12px;color:rgba(255,255,255,.82);margin-top:3px">Podés volver a leerla cuando quieras.</div></div>';
  }
  if(p.hechas < p.total){
    return '<div style="font-size:12px;color:rgba(255,255,255,.72);text-align:center;padding:6px 0">Te faltan '+(p.total-p.hechas)+' de '+p.total+' para cerrar la semana.</div>';
  }
  return '<button onclick="dmTcciCerrarSemana('+s.n+')" style="width:100%;background:#7EC8A4;border:none;border-radius:12px;padding:14px;color:#0F2820;font-size:14.5px;font-weight:700;cursor:pointer;font-family:var(--font)">¡Terminé la semana '+s.n+'!</button>';
}
// Un festejo corto al cerrar una semana. Seis semanas de tarea diaria se
// sostienen con lo que uno siente al terminar cada una, no con la barra.
function dmConfeti(){
  try{
    if(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  }catch(_){}
  const capa=document.createElement('div');
  capa.style.cssText='position:fixed;inset:0;pointer-events:none;z-index:10010;overflow:hidden';
  const colores=['#7EC8A4','#C8A96E','#5ee08a','#67d5e8','#fbbf24','#ffffff'];
  const cuantos=Math.min(70, Math.round((window.innerWidth||390)/6));
  for(let i=0;i<cuantos;i++){
    const p=document.createElement('div');
    const ancho=6+Math.random()*6;
    const izq=Math.random()*100;
    const demora=Math.random()*0.55;
    const dura=1.9+Math.random()*1.3;
    const giro=(Math.random()*720-360).toFixed(0);
    const desvio=(Math.random()*120-60).toFixed(0);
    p.style.cssText='position:absolute;top:-24px;left:'+izq+'%;width:'+ancho.toFixed(1)+'px;height:'+
      (ancho*(0.5+Math.random())).toFixed(1)+'px;background:'+colores[i%colores.length]+';'+
      'border-radius:'+(Math.random()<0.35?'50%':'2px')+';opacity:.95;'+
      'animation:dmConfetiCae '+dura.toFixed(2)+'s cubic-bezier(.25,.6,.5,1) '+demora.toFixed(2)+'s forwards;'+
      '--dm-giro:'+giro+'deg;--dm-desvio:'+desvio+'px';
    capa.appendChild(p);
  }
  document.body.appendChild(capa);
  setTimeout(function(){ capa.remove(); }, 3600);
}
window.dmConfeti = dmConfeti;

// ══════════════════════════════════════════════════════════════════════
// Encuestas del programa (fase de prueba)
// ----------------------------------------------------------------------
// Tres momentos, y conviene distinguirlos porque no piden lo mismo:
//
//   1. ANTES de cada semana — una sola pregunta: cuánto se compromete con
//      la tarea que viene. Sirve para dos cosas distintas: te dice a vos
//      dónde esperar abandono, y le dice a la persona que la tarea
//      requiere una decisión, no buena voluntad.
//   2. AL CERRAR cada semana — si le sirvió, y cuánto le costó
//      sostenerlo. Las dos juntas separan lo que funciona de lo que
//      funciona pero nadie puede sostener, que es la diferencia que
//      define si un programa conductual sirve fuera del laboratorio.
//   3. AL TERMINAR — el balance global.
//
// Sobre pedirlo para abrir la semana 2: lo que se exige es FEEDBACK DEL
// PRODUCTO, que es el precio razonable de una beta gratuita. Lo que NO se
// exige —y por eso el sondeo de precio y el comentario son salteables— es
// nada que se parezca a dato de investigación. Vos mismo lo escribiste en
// el alta: un consentimiento que no es voluntario no vale ni para la ley
// de datos ni para un comité. Condicionar el acceso al tratamiento a
// entregar datos de investigación sería exactamente eso.
// ══════════════════════════════════════════════════════════════════════

const DM_TCCI_COMPROMISO = {
  pregunta:'Antes de empezar: ¿qué tan decidido estás a sostener la tarea de esta semana?',
  bajo:'Lo voy a intentar', alto:'Estoy decidido'
};

const DM_TCCI_CIERRE_PREG = [
  { id:'sirvio', tipo:'regla', pregunta:'¿Te sirvió lo de esta semana?',
    bajo:'Nada', alto:'Mucho' },
  { id:'costo',  tipo:'regla', pregunta:'¿Cuánto te costó sostenerlo?',
    bajo:'Nada', alto:'Muchísimo' },
  { id:'comentario', tipo:'texto', opcional:true,
    pregunta:'¿Algo que quieras contarnos de esta semana?',
    placeholder:'Opcional. Lo que te sobró, lo que te faltó, lo que no se entendió.' }
];

const DM_TCCI_FINAL_PREG = [
  { id:'global',     tipo:'regla', pregunta:'En general, ¿cuánto te sirvió el programa completo?',
    bajo:'Nada', alto:'Muchísimo' },
  { id:'duerme',     tipo:'regla', pregunta:'¿Cuánto mejoró tu sueño respecto de cuando empezaste?',
    bajo:'Nada', alto:'Muchísimo' },
  { id:'recomendar', tipo:'regla', pregunta:'¿Se lo recomendarías a alguien que duerme mal?',
    bajo:'No', alto:'Sin dudas' },
  { id:'masutil',    tipo:'texto', opcional:true,
    pregunta:'¿Qué semana te sirvió más, y por qué?', placeholder:'Opcional.' },
  { id:'sobro',      tipo:'texto', opcional:true,
    pregunta:'¿Qué sacarías o cambiarías?', placeholder:'Opcional. Nos sirve más lo que no funcionó.' }
];

function dmTcciEncuestas(){
  try{ return JSON.parse(localStorage.getItem('dm_tcci_encuestas')||'{}'); }catch(_){ return {}; }
}
function dmTcciTieneEncuesta(clave){ return !!dmTcciEncuestas()[clave]; }

// Se guarda en el dispositivo Y se intenta subir. El orden importa: si la
// red falla, la persona no puede quedar trabada sin poder seguir el
// programa por un problema nuestro.
async function dmTcciGuardarEncuesta(clave, tipo, semana, datos){
  const reg = Object.assign({ fecha:new Date().toISOString() }, datos);
  try{
    const m = dmTcciEncuestas();
    m[clave] = reg;
    localStorage.setItem('dm_tcci_encuestas', JSON.stringify(m));
  }catch(_){}
  try{
    await db.post('tcci_encuestas', {
      patient_email: (S.user && S.user.email) || '',
      tipo: tipo,
      semana: semana,
      respuestas: datos
    }, '');
  }catch(e){
    // No se bloquea nada: el dato queda en el dispositivo y el programa
    // sigue. Que la tabla no exista todavía no puede frenar un tratamiento.
    console.warn('[TCCI-ENCUESTA] no se pudo subir:', (e&&e.message)||e);
  }
}

// ── La hoja de preguntas ─────────────────────────────────────────────
function dmTcciHojaEncuesta(cfg){
  const old=document.getElementById('dm-enc'); if(old) old.remove();
  const w=document.createElement('div');
  w.id='dm-enc';
  w.style.cssText='position:fixed;inset:0;background:rgba(6,18,13,.94);z-index:10006;overflow-y:auto;padding:0';
  const campos = cfg.preguntas.map(function(p){
    if(p.tipo==='texto'){
      return '<div class="dm-enc-bloque">'+
        '<div class="dm-enc-preg">'+p.pregunta+
          (p.opcional?'<span class="dm-enc-opt">opcional</span>':'')+'</div>'+
        '<textarea id="dm-enc-'+p.id+'" rows="3" class="dm-enc-texto" placeholder="'+(p.placeholder||'')+'"></textarea>'+
      '</div>';
    }
    return '<div class="dm-enc-bloque">'+
      '<div class="dm-enc-preg">'+p.pregunta+'</div>'+
      '<div class="dm-enc-num"><span id="dm-enc-n-'+p.id+'">5</span><i>/10</i></div>'+
      '<input type="range" min="1" max="10" value="5" id="dm-enc-'+p.id+'" '+
        'oninput="var e=document.getElementById(\'dm-enc-n-'+p.id+'\');if(e)e.textContent=this.value">'+
      '<div class="dm-enc-extremos"><span>'+(p.bajo||'')+'</span><span>'+(p.alto||'')+'</span></div>'+
    '</div>';
  }).join('');
  w.innerHTML='<div class="dm-enc-caja">'+
    (cfg.emoji?'<div class="dm-enc-emoji">'+cfg.emoji+'</div>':'')+
    '<div class="dm-enc-tit">'+cfg.titulo+'</div>'+
    (cfg.sub?'<div class="dm-enc-sub">'+cfg.sub+'</div>':'')+
    campos+
    (cfg.extra||'')+
    '<button id="dm-enc-ok" class="dm-enc-btn">'+(cfg.boton||'Continuar')+'</button>'+
    (cfg.saltear?'<div class="dm-enc-saltear" id="dm-enc-skip">'+cfg.saltear+'</div>':'')+
  '</div>';
  document.body.appendChild(w);
  const leer=function(){
    const d={};
    cfg.preguntas.forEach(function(p){
      const e=document.getElementById('dm-enc-'+p.id);
      if(!e) return;
      d[p.id] = (p.tipo==='texto') ? (e.value||'').trim() : Number(e.value);
    });
    return d;
  };
  document.getElementById('dm-enc-ok').onclick=function(){
    const d=leer();
    w.remove();
    try{ cfg.alTerminar(d); }catch(e){ console.warn('[encuesta]', e); }
  };
  const skip=document.getElementById('dm-enc-skip');
  if(skip) skip.onclick=function(){ w.remove(); try{ cfg.alSaltear&&cfg.alSaltear(); }catch(_){} };
  return w;
}

// Terminar la semana abre primero las preguntas de cierre. En modo
// autogestionado y en fase de prueba son obligatorias (menos el
// comentario y el precio): es el precio de una beta gratuita. Con
// profesional NO se piden: ahí el seguimiento lo hace él en consulta, y
// meterle un formulario en el medio del tratamiento sobra.
function dmTcciCerrarSemana(n){
  const clave='cierre-'+n;
  if(dmTcciModo()!=='guiado' && !dmTcciTieneEncuesta(clave)){
    dmTcciHojaEncuesta({
      emoji:'🌿',
      titulo:'Semana '+n+', terminada',
      sub:'Dos preguntas antes de seguir. Tardan menos de un minuto y son lo '+
          'único que nos dice si el programa sirve de verdad.',
      preguntas:DM_TCCI_CIERRE_PREG,
      boton:'Listo',
      alTerminar:function(d){
        dmTcciGuardarEncuesta(clave,'cierre-semana',n,d);
        // Al cerrar la PRIMERA se suma el sondeo de precio, que sí es
        // salteable: preguntar cuánto pagaría no puede ser el peaje para
        // seguir un tratamiento.
        if(n===1 && !dmTcciTieneEncuesta('precio')) dmTcciSondeoPrecio(function(){ dmTcciCerrarSemanaYa(n); });
        else dmTcciCerrarSemanaYa(n);
      }
    });
    return;
  }
  dmTcciCerrarSemanaYa(n);
}
window.dmTcciCerrarSemana = dmTcciCerrarSemana;

// El sondeo de precio, en su propio paso y con salida.
function dmTcciSondeoPrecio(despues){
  const opciones = DM_TCCI_PRECIOS.map(function(p){
    return '<label class="dm-enc-op"><input type="radio" name="dm-enc-precio" value="'+p.id+'">'+
      '<span>'+p.txt+(p.nota?' <i>'+p.nota+'</i>':'')+'</span></label>';
  }).join('');
  dmTcciHojaEncuesta({
    emoji:'💭',
    titulo:'Una más, y es la última',
    sub:'Estás usando gratis algo que va a ser pago. Si tuvieras que pagar las '+
        'siete semanas completas <b>una sola vez</b>, ¿cuánto te parecería razonable?<br>'+
        '<span style="opacity:.8">Como referencia: una consulta con especialista en sueño ronda '+
        'los $50.000 a $80.000, y el tratamiento suele llevar cinco o seis.</span>',
    preguntas:[],
    extra:'<div class="dm-enc-ops">'+opciones+'</div>',
    boton:'Enviar',
    saltear:'Prefiero no contestar',
    alTerminar:function(){
      const sel=document.querySelector('input[name="dm-enc-precio"]:checked');
      dmTcciGuardarEncuesta('precio','precio',null,{precio: sel?sel.value:null});
      try{ if(sel) db.post('tcci_interes',{patient_email:(S.user&&S.user.email)||'',precio_elegido:sel.value,semana_bloqueada:2},''); }catch(_){}
      if(despues) despues();
    },
    alSaltear:function(){
      dmTcciGuardarEncuesta('precio','precio',null,{precio:null, salteada:true});
      if(despues) despues();
    }
  });
}
window.dmTcciSondeoPrecio = dmTcciSondeoPrecio;

function dmTcciCerrarSemanaYa(n){
  let m={};
  try{ m=JSON.parse(localStorage.getItem('dm_tcci_cerradas')||'{}'); }catch(_){}
  m[n]=true;
  try{ localStorage.setItem('dm_tcci_cerradas', JSON.stringify(m)); }catch(_){}
  try{ dmTcciSincronizarEstado(); }catch(_){}
  const s=DM_TCCI_PROGRAMA.find(function(x){ return x.n===n; });
  const cont=document.getElementById('dm-tcci-cierre-'+n);
  if(cont && s) cont.innerHTML=dmTcciCierreHtml(s);
  const total=DM_TCCI_PROGRAMA.length;
  try{ dmConfeti(); }catch(_){}
  const mensajes={
    1:'Ya sabés cómo funciona tu sueño y por qué se sostiene el insomnio. Todo lo que viene se apoya en esto.',
    2:'Pasaste la semana que más cuesta. Achicar el tiempo en cama es lo más difícil del programa y ya está hecho.',
    3:'Tu cama está volviendo a significar dormir. Eso no se siente de un día para el otro, pero se está armando.',
    4:'Ya estás ajustando tu propio horario con tus propios datos. Poca gente llega hasta acá.',
    5:'Trabajaste sobre lo que pensás a la noche cuando no podés dormir. Es la parte menos visible y de las que más rinde.',
    6:'Sumaste herramientas para bajar la activación. Te van a servir mucho después de que termine el programa.',
    7:'Terminaste el programa entero. Lo que sigue es sostenerlo — y ya sabés cómo.'
  };
  const w=document.createElement('div');
  w.style.cssText='position:fixed;inset:0;background:rgba(6,18,13,.9);z-index:10005;display:flex;align-items:center;justify-content:center;padding:24px';
  w.onclick=function(){ w.remove(); };
  w.innerHTML='<div onclick="event.stopPropagation()" style="max-width:380px;background:#12302699;border:1px solid rgba(126,200,164,.35);border-radius:18px;padding:26px 24px;text-align:center;backdrop-filter:blur(8px)">'+
    '<div style="font-size:42px;line-height:1;margin-bottom:10px">🌿</div>'+
    '<div style="font-size:19px;font-weight:700;color:#fff;margin-bottom:8px">Semana '+n+' de '+total+', lista</div>'+
    '<div style="font-size:14px;color:rgba(255,255,255,.92);line-height:1.6;margin-bottom:18px">'+(mensajes[n]||'Un paso más.')+'</div>'+
    (n<total
      ? '<button onclick="document.querySelector(\'[style*=\\\'z-index:10005\\\']\')?.remove(); dmTcciAbrirSemana('+(n+1)+')" style="width:100%;background:#7EC8A4;border:none;border-radius:12px;padding:13px;color:#0F2820;font-size:14px;font-weight:700;cursor:pointer;font-family:var(--font)">Ver la semana '+(n+1)+'</button>'
      : '<div style="font-size:13px;color:#C8A96E;font-weight:600">Completaste el programa entero.</div>')+
    '<div onclick="this.parentNode.parentNode.remove()" style="font-size:12.5px;color:rgba(255,255,255,.72);margin-top:12px;cursor:pointer">Cerrar</div>'+
  '</div>';
  document.body.appendChild(w);
  try{ if(typeof openPatientCbtiView==='function' && document.getElementById('dm-tcci-lista')) openPatientCbtiView(); }catch(_){}
  // Última semana: el balance del programa entero. Va DESPUÉS del festejo,
  // no antes: primero se reconoce lo hecho y después se pregunta.
  if(n===total && dmTcciModo()!=='guiado' && !dmTcciTieneEncuesta('final')){
    setTimeout(function(){
      dmTcciHojaEncuesta({
        emoji:'🏁',
        titulo:'Terminaste el programa',
        sub:'Cinco preguntas finales. Las tres primeras son de escala; las dos '+
            'últimas, si querés escribirlas, son las que más nos sirven.',
        preguntas:DM_TCCI_FINAL_PREG,
        boton:'Enviar',
        alTerminar:function(d){
          dmTcciGuardarEncuesta('final','final',null,d);
          try{ toast('Gracias. Esto es lo que hace que el programa mejore.'); }catch(_){}
        }
      });
    }, 900);
  }
}

function dmTcciProgresoHtml(){
  const p=dmTcciProgresoTotal();
  const semanas=DM_TCCI_PROGRAMA.map(function(s){
    const q=dmTcciProgresoSemana(s);
    return '<div title="Semana '+s.n+'" style="flex:1;height:6px;border-radius:3px;background:rgba(255,255,255,.09);overflow:hidden">'+
      '<div style="height:100%;width:'+q.pct+'%;background:'+(q.pct===100?'#7EC8A4':'#C8A96E')+'"></div></div>';
  }).join('');
  return '<div id="dm-tcci-progreso" style="background:rgba(255,255,255,.05);border-radius:14px;padding:13px 15px;margin-bottom:14px">'+
    '<div style="display:flex;align-items:baseline;justify-content:space-between;margin-bottom:8px">'+
      '<span style="font-size:12px;font-weight:700;color:#fff">Tu progreso</span>'+
      '<span style="font-size:12px;color:'+(p.pct===100?'#7EC8A4':'rgba(255,255,255,.6)')+'"><b style="font-size:15px">'+p.pct+'%</b> · '+p.hechas+' de '+p.total+' tareas</span>'+
    '</div>'+
    '<div style="display:flex;gap:4px">'+semanas+'</div>'+
    '<div style="font-size:10.5px;color:rgba(255,255,255,.72);margin-top:6px">Una barra por semana. Se guarda en este dispositivo.</div>'+
  '</div>';
}

// ══════════════════════════════════════════════════════════════════════
// Ilustración de cada semana
// ----------------------------------------------------------------------
// Siete pantallas de texto corrido son siete paredes. Una imagen arriba
// no decora: parte el bloque, da un punto de descanso y hace que el
// contenido se lea. Son SVG inline —sin archivos, sin pedidos de red—
// con la paleta de marca.
// ══════════════════════════════════════════════════════════════════════
function dmTcciBanner(s){
  const V='#1A4A3A', M='#2D6B55', T='#7EC8A4', O='#C8A96E', N='#0F2820';
  const escena={
    // Semana 1 · las dos fuerzas: el sol que sube y la noche que baja
    amanecer:
      '<circle cx="118" cy="78" r="26" fill="'+O+'" opacity=".9"/>'+
      '<path d="M0 96 Q60 62 118 78 Q182 96 240 66" stroke="'+T+'" stroke-width="3" fill="none" opacity=".75"/>'+
      '<path d="M0 66 Q60 100 118 78 Q182 58 240 92" stroke="'+M+'" stroke-width="3" fill="none" opacity=".8"/>'+
      '<g fill="'+T+'" opacity=".5"><circle cx="34" cy="34" r="2.4"/><circle cx="206" cy="42" r="2"/><circle cx="168" cy="26" r="1.6"/></g>'+
      '<rect x="0" y="108" width="240" height="14" fill="'+V+'"/>',
    // Semana 2 · la cama, y el tiempo de más que sobra a los costados
    cama:
      '<rect x="56" y="62" width="128" height="34" rx="7" fill="'+M+'"/>'+
      '<rect x="56" y="54" width="42" height="18" rx="6" fill="'+T+'" opacity=".85"/>'+
      '<rect x="24" y="62" width="24" height="34" rx="6" fill="'+O+'" opacity=".26"/>'+
      '<rect x="192" y="62" width="24" height="34" rx="6" fill="'+O+'" opacity=".26"/>'+
      '<path d="M40 44 h-12 M40 44 l6 -5 M40 44 l6 5" stroke="'+O+'" stroke-width="2.4" fill="none" stroke-linecap="round"/>'+
      '<path d="M200 44 h12 M200 44 l-6 -5 M200 44 l-6 5" stroke="'+O+'" stroke-width="2.4" fill="none" stroke-linecap="round"/>'+
      '<rect x="0" y="108" width="240" height="14" fill="'+V+'"/>',
    // Semana 3 · una puerta: la cama de un lado, todo lo demás del otro
    puerta:
      '<rect x="88" y="34" width="64" height="74" rx="6" fill="'+M+'"/>'+
      '<circle cx="140" cy="72" r="3.4" fill="'+O+'"/>'+
      '<rect x="14" y="76" width="56" height="26" rx="6" fill="'+T+'" opacity=".55"/>'+
      '<rect x="172" y="60" width="26" height="18" rx="3" fill="'+O+'" opacity=".5"/>'+
      '<rect x="204" y="84" width="20" height="18" rx="3" fill="'+O+'" opacity=".35"/>'+
      '<path d="M168 96 l54 -44" stroke="'+O+'" stroke-width="2.4" opacity=".55"/>'+
      '<rect x="0" y="108" width="240" height="14" fill="'+V+'"/>',
    // Semana 4 · la regla: ajustar de a poco
    regla:
      '<rect x="24" y="66" width="192" height="24" rx="5" fill="'+M+'"/>'+
      '<g stroke="'+N+'" stroke-width="2" opacity=".55">'+
        '<path d="M48 66 v10"/><path d="M72 66 v14"/><path d="M96 66 v10"/><path d="M120 66 v14"/>'+
        '<path d="M144 66 v10"/><path d="M168 66 v14"/><path d="M192 66 v10"/></g>'+
      '<circle cx="144" cy="78" r="11" fill="'+O+'"/>'+
      '<path d="M144 44 v12 M138 50 l6 6 l6 -6" stroke="'+T+'" stroke-width="2.6" fill="none" stroke-linecap="round" stroke-linejoin="round"/>'+
      '<rect x="0" y="108" width="240" height="14" fill="'+V+'"/>',
    // Semana 5 · la cabeza y el pensamiento que da vueltas
    nube:
      '<circle cx="106" cy="74" r="26" fill="'+M+'"/>'+
      '<path d="M82 66 q24 -24 48 0 q-7 -21 -24 -21 q-17 0 -24 21z" fill="'+V+'"/>'+
      '<ellipse cx="170" cy="52" rx="34" ry="20" fill="'+T+'" opacity=".22"/>'+
      '<path d="M152 52 q18 -12 36 0 q-18 12 -36 0z" fill="none" stroke="'+O+'" stroke-width="2" opacity=".8"/>'+
      '<circle cx="138" cy="66" r="4" fill="'+T+'" opacity=".5"/>'+
      '<circle cx="128" cy="76" r="2.6" fill="'+T+'" opacity=".35"/>'+
      '<rect x="0" y="108" width="240" height="14" fill="'+V+'"/>',
    // Semana 6 · la respiración: entra corto, sale largo
    respirar:
      '<circle cx="120" cy="72" r="30" fill="none" stroke="'+M+'" stroke-width="3"/>'+
      '<circle cx="120" cy="72" r="20" fill="none" stroke="'+T+'" stroke-width="2.4" opacity=".8"/>'+
      '<circle cx="120" cy="72" r="9" fill="'+T+'" opacity=".45"/>'+
      '<path d="M48 72 h34" stroke="'+O+'" stroke-width="3" stroke-linecap="round"/>'+
      '<path d="M158 72 h56" stroke="'+O+'" stroke-width="3" stroke-linecap="round" opacity=".85"/>'+
      '<path d="M214 72 l-7 -5 M214 72 l-7 5" stroke="'+O+'" stroke-width="2.6" fill="none" stroke-linecap="round"/>'+
      '<rect x="0" y="108" width="240" height="14" fill="'+V+'"/>',
    // Semana 7 · la brújula: saber volver si el camino se pierde
    brujula:
      '<circle cx="120" cy="72" r="32" fill="'+M+'"/>'+
      '<circle cx="120" cy="72" r="32" fill="none" stroke="'+T+'" stroke-width="2.4" opacity=".7"/>'+
      '<path d="M120 48 l9 22 l-9 24 l-9 -24z" fill="'+O+'"/>'+
      '<circle cx="120" cy="72" r="3.4" fill="'+N+'"/>'+
      '<path d="M24 100 q34 -18 62 -4 q30 15 62 -8 q28 -20 68 -4" stroke="'+T+'" stroke-width="2.4" fill="none" opacity=".45" stroke-dasharray="5 6"/>'+
      '<rect x="0" y="108" width="240" height="14" fill="'+V+'"/>'
  }[(s&&s.figura)||'cama'] || '';
  return '<div class="dm-tcci-banner" aria-hidden="true">'+
    '<svg viewBox="0 0 240 122" preserveAspectRatio="xMidYMid slice" style="width:100%;height:100%;display:block">'+
      '<rect width="240" height="122" fill="'+N+'"/>'+escena+
    '</svg></div>';
}

// ── Material de lectura de la semana ─────────────────────────────────
// Cada etapa apunta a los artículos de la biblioteca que la acompañan.
// Es el mismo material que ya existe: acá se ofrece en el momento en que
// tiene sentido leerlo, no en una lista suelta.
function dmTcciLecturasHtml(s){
  const ids=(s&&s.lecturas)||[];
  if(!ids.length || typeof PATIENT_EDU_TOPICS==='undefined') return '';
  const _perfil=(typeof dmEduPerfil==='function') ? dmEduPerfil() : null;
  const temas=ids.map(function(id){
    return PATIENT_EDU_TOPICS.find(function(t){ return t.id===id; });
  }).filter(function(t){
    // Se respeta el mismo criterio de edad y sexo que el resto del
    // material: no tendría sentido filtrarlo en el inicio y colarlo acá.
    return t && (!_perfil || typeof dmEduAplica!=='function' || dmEduAplica(t,_perfil));
  });
  if(!temas.length) return '';
  return '<div class="dm-tcci-lecturas">'+
    '<div class="dm-tcci-lecturas-tit">Para leer esta semana</div>'+
    temas.map(function(t){
      return '<div class="dm-tcci-lectura" onclick="dmAbrirBiblioteca(\''+t.id+'\')">'+
        '<span class="dm-tcci-lectura-ic">'+(t.icon||'📖')+'</span>'+
        '<span class="dm-tcci-lectura-tit">'+t.title+'</span>'+
        '<span class="dm-tcci-lectura-ch">›</span></div>';
    }).join('')+
  '</div>';
}

// ══════════════════════════════════════════════════════════════════════
// Un solo programa, dos formas de avanzar
// ----------------------------------------------------------------------
// Antes había dos TCC-I distintas conviviendo:
//
//   · la AUTOGUIADA: DM_TCCI_PROGRAMA, siete semanas, lenguaje de
//     paciente, texto largo, tareas marcables;
//   · la GUIADA: CBTI_PROTOCOL, veintisiete ítems que el profesional
//     tildaba, con CBTI_PATIENT_CONTENT como textos sueltos.
//
// O sea que quien tenía profesional recibía MENOS contenido y peor
// organizado que quien iba solo. Eso está al revés: el acompañamiento
// tiene que agregar, nunca restar.
//
// Ahora el contenido es el mismo —las siete semanas, con su material de
// lectura y su ilustración— y lo único que cambia es quién habilita la
// semana siguiente:
//
//   · autogestionado → se habilita al cerrar la semana anterior;
//   · guiado         → la habilita el profesional cuando la trabajan.
//
// El protocolo de 27 ítems sigue existiendo, pero como lo que siempre
// fue: la checklist clínica del profesional, de su lado.
// ══════════════════════════════════════════════════════════════════════

// Modo actual del paciente. Se resuelve una vez y queda cacheado en S.
function dmTcciModo(){
  return (S && S._tcciGuiadoPor) ? 'guiado' : 'auto';
}
// Semanas que el profesional habilitó. Se guardan en cbti_progress con
// item_id 'semana-N', así que no hace falta tabla nueva ni tocar la RLS.
function dmTcciHabilitadasPorPro(){
  try{ return (S && S._tcciSemanasPro) || {}; }catch(_){ return {}; }
}
function dmTcciCerrada(n){
  try{ return JSON.parse(localStorage.getItem('dm_tcci_cerradas')||'{}')[n]===true; }catch(_){ return false; }
}
// ¿Puede entrar a esta semana?
function dmTcciSemanaAbierta(n){
  if(dmTcciModo()==='guiado'){
    // La primera va sola: si el profesional activó el programa, algo tiene
    // que poder leer mientras espera la consulta.
    return n===1 || dmTcciHabilitadasPorPro()[n]===true;
  }
  if(n===1) return true;
  // Autogestionado: se abre al cerrar la anterior. Con acceso libre se
  // puede recorrer entero, que es para lo que sirve el acceso libre.
  if(dmTcciTieneAcceso() && dmTcciCerrada(n-1)) return true;
  return dmTcciCerrada(n-1);
}
// Por qué está cerrada, en palabras de la persona.
function dmTcciMotivoCierre(n){
  return dmTcciModo()==='guiado'
    ? 'La habilita tu profesional cuando lo trabajen'
    : 'Se abre al terminar la semana '+(n-1);
}

function dmTcciAbrirSemana(n){
  const s=DM_TCCI_PROGRAMA.find(x=>x.n===n); if(!s) return;
  if(!dmTcciSemanaAbierta(n)){ toast(dmTcciMotivoCierre(n)); return; }
  // Una sola pregunta antes de abrir la semana, la primera vez que entra.
  // No es burocracia: una tarea conductual que se empieza sin decidirla se
  // abandona en tres días, y el número te dice a vos dónde esperar eso.
  // Con profesional no va: el compromiso se trabaja en consulta.
  const _kc='compromiso-'+n;
  if(dmTcciModo()!=='guiado' && !dmTcciCerrada(n) && !dmTcciTieneEncuesta(_kc)){
    dmTcciHojaEncuesta({
      emoji:'🌱',
      titulo:'Semana '+n+' · '+s.titulo,
      sub:s.objetivo,
      preguntas:[{ id:'compromiso', tipo:'regla',
                   pregunta:DM_TCCI_COMPROMISO.pregunta,
                   bajo:DM_TCCI_COMPROMISO.bajo, alto:DM_TCCI_COMPROMISO.alto }],
      boton:'Empezar la semana',
      alTerminar:function(d){
        dmTcciGuardarEncuesta(_kc,'compromiso',n,d);
        dmTcciAbrirSemana(n);
      }
    });
    return;
  }
  // El cobro no corre para quien viene acompañado por un profesional: ahí
  // el programa es parte del tratamiento, no un producto aparte.
  if(dmTcciModo()!=='guiado' && !s.libre && !dmTcciTieneAcceso()){
    window._dmTcciSemanaIntento=n; dmTcciMostrarSuscripcion(); return;
  }
  const old=document.getElementById('dm-tcci-sem'); if(old) old.remove();
  const w=document.createElement('div');
  w.id='dm-tcci-sem';
  w.style.cssText='position:fixed;inset:0;background:rgba(6,18,13,0.92);z-index:10002;overflow-y:auto;padding:0';
  w.innerHTML=
    '<div style="max-width:620px;margin:0 auto;padding:20px 18px 40px">'+
      '<div style="display:flex;align-items:center;gap:12px;margin-bottom:18px">'+
        '<button onclick="document.getElementById(\'dm-tcci-sem\').remove()" style="background:rgba(255,255,255,.1);border:none;border-radius:10px;width:36px;height:36px;color:#fff;font-size:18px;cursor:pointer">←</button>'+
        '<div><div style="font-size:10px;letter-spacing:.1em;color:#C8A96E;font-weight:700">SEMANA '+s.n+' DE '+DM_TCCI_PROGRAMA.length+'</div>'+
        '<div style="font-size:19px;font-weight:700;color:#fff">'+s.titulo+'</div>'+
        (s.subtitulo?'<div style="font-size:12.5px;color:rgba(255,255,255,.82);margin-top:2px">'+s.subtitulo+'</div>':'')+'</div>'+
      '</div>'+
      dmTcciBanner(s)+
      '<div style="background:rgba(126,200,164,.1);border-left:3px solid #7EC8A4;border-radius:8px;padding:12px 14px;margin-bottom:16px">'+
        '<div style="font-size:10px;letter-spacing:.07em;color:#7EC8A4;font-weight:700;margin-bottom:4px">OBJETIVO</div>'+
        '<div style="font-size:13.5px;color:rgba(255,255,255,.97);line-height:1.55">'+s.objetivo+'</div></div>'+
      '<div onclick="var c=document.getElementById(\'dm-tcci-texto\');var b=document.getElementById(\'dm-tcci-texto-btn\');var v=c.style.display===\'none\';c.style.display=v?\'\':\'none\';b.textContent=v?\'▲ Ocultar\':\'📖 Lo que tenés que saber esta semana\';" id="dm-tcci-texto-btn" style="background:rgba(255,255,255,.06);border:1px solid rgba(126,200,164,.22);border-radius:12px;padding:14px;text-align:center;font-size:15px;font-weight:600;color:#F4EFE5;cursor:pointer;margin-bottom:14px">📖 Lo que tenés que saber esta semana</div>'+'<div id="dm-tcci-texto" style="display:none;font-size:15.5px;color:rgba(255,255,255,.97);line-height:1.75;white-space:pre-line;margin-bottom:18px">'+s.contenido+'</div>'+
      '<div style="background:rgba(255,255,255,.05);border:1px solid rgba(126,200,164,.16);border-radius:16px;padding:16px 17px">'+
        '<div id="dm-tcci-tareas-'+s.n+'">'+dmTcciTareasHtml(s)+'</div>'+
      '</div>'+
      dmTcciLecturasHtml(s)+
      '<div id="dm-tcci-cierre-'+s.n+'" style="margin-top:14px">'+dmTcciCierreHtml(s)+'</div>'+
      
      '<div style="font-size:11px;color:rgba(255,255,255,.72);text-align:center;margin-top:14px;line-height:1.5">No reemplaza la consulta médica. Si tenés apnea del sueño, trabajás en turnos rotativos o tenés somnolencia peligrosa al volante, consultá antes de restringir el sueño.</div>'+
    '</div>';
  document.body.appendChild(w);
}
// Precios a sondear. Están acá arriba a propósito: cambiás estos números y
// cambia la encuesta entera, sin tocar nada más.
// Rangos anclados a la referencia real del rubro: una consulta ESPECIALIZADA
// en sueño en Argentina ronda los $50.000–$80.000 (bastante más que una
// sesión de psicología general). Seis semanas de tratamiento equivalen a
// cinco o seis consultas, o sea $250.000–$480.000 de terapia presencial.
const DM_TCCI_PRECIOS = [
  { id:'a',  txt:'Menos de $30.000' },
  { id:'b',  txt:'$30.000 a $60.000',   nota:'menos que una consulta' },
  { id:'c',  txt:'$60.000 a $100.000',  nota:'como una consulta' },
  { id:'d',  txt:'$100.000 a $180.000', nota:'como dos consultas' },
  { id:'e',  txt:'Más de $180.000' },
  { id:'no', txt:'No pagaría por esto' }
];

function dmTcciMostrarSuscripcion(){
  const old=document.getElementById('dm-tcci-pay'); if(old) old.remove();
  const w=document.createElement('div');
  w.id='dm-tcci-pay';
  w.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,.68);z-index:10003;display:flex;align-items:center;justify-content:center;padding:18px;overflow-y:auto';
  w.onclick=function(e){ if(e.target===w) w.remove(); };
  w.innerHTML=
    '<div id="dm-tcci-pay-box" style="background:linear-gradient(150deg,#1F4738,#0F2820);border:1px solid rgba(200,169,110,.5);border-radius:20px;padding:24px 22px;max-width:420px;width:100%;margin:auto">'+
      '<div style="display:inline-block;font-size:9.5px;letter-spacing:.09em;font-weight:700;background:rgba(200,169,110,.22);color:#C8A96E;border-radius:99px;padding:4px 10px;margin-bottom:12px">PREMIUM · PRÓXIMAMENTE</div>'+
      '<div style="font-size:19px;font-weight:700;color:#fff;margin-bottom:8px">Programa TCC-I de 7 semanas</div>'+
      '<div style="font-size:13px;color:rgba(255,255,255,.92);line-height:1.6;margin-bottom:14px">'+
        'Restricción del tiempo en cama con tu ventana calculada, control de estímulos, trabajo sobre los pensamientos que te desvelan, técnicas para bajar la activación y un plan de recaídas. '+
        'Es el tratamiento que las guías internacionales recomiendan <b>antes que la medicación</b> para el insomnio.</div>'+
      '<div style="background:rgba(255,255,255,.06);border-radius:12px;padding:12px 14px;font-size:12.5px;color:rgba(255,255,255,.92);line-height:1.55;margin-bottom:16px">'+
        'Va a ser una <b>función paga</b>. Todavía no está abierta: si te interesa, avisanos y te contactamos cuando la habilitemos, con condición preferencial por haber estado en la beta.</div>'+
      '<button onclick="dmTcciPasoInteres()" style="width:100%;background:#C8A96E;border:none;border-radius:12px;padding:13px;color:#0F2820;font-size:14.5px;font-weight:700;cursor:pointer;font-family:var(--font)">Me interesaría</button>'+
      '<button onclick="document.getElementById(\'dm-tcci-pay\').remove()" style="width:100%;background:none;border:none;color:rgba(255,255,255,.72);font-size:13px;margin-top:10px;cursor:pointer;font-family:var(--font)">Ahora no</button>'+
    '</div>';
  document.body.appendChild(w);
}

// Segundo paso: recién después de que dijo que le interesa se pregunta el
// precio. Preguntarlo antes espanta; preguntarlo después mide disposición
// real sobre quienes ya se mostraron interesados, que es el dato que sirve.
function dmTcciPasoInteres(){
  const box=document.getElementById('dm-tcci-pay-box'); if(!box) return;
  box.innerHTML=
    '<div style="font-size:26px;margin-bottom:8px">🌿</div>'+
    '<div style="font-size:18px;font-weight:700;color:#fff;margin-bottom:6px">Anotado. Una última cosa.</div>'+
    '<div style="font-size:13px;color:rgba(255,255,255,.92);line-height:1.6;margin-bottom:16px">'+
      'Nos ayuda a definir el precio: ¿cuánto te parecería razonable pagar, <b>una sola vez</b>, por las siete semanas completas?<br>'+
      '<span style="font-size:11.5px;color:rgba(255,255,255,.72)">Como referencia: una consulta con especialista en sueño ronda los $50.000 a $80.000, y el tratamiento completo suele llevar cinco o seis.</span></div>'+
    DM_TCCI_PRECIOS.map(function(p){
      return '<button onclick="dmTcciGuardarInteres(\''+p.id+'\')" style="width:100%;text-align:left;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.14);border-radius:11px;padding:11px 14px;color:#fff;font-size:13.5px;margin-bottom:7px;cursor:pointer;font-family:var(--font)">'+
        p.txt+(p.nota?'<span style="color:rgba(255,255,255,.72);font-size:11.5px"> · '+p.nota+'</span>':'')+'</button>';
    }).join('')+
    '<button onclick="dmTcciGuardarInteres(\'skip\')" style="width:100%;background:none;border:none;color:rgba(255,255,255,.72);font-size:12.5px;margin-top:6px;cursor:pointer;font-family:var(--font)">Prefiero no responder</button>';
}

async function dmTcciGuardarInteres(precio){
  const email=(S.user&&S.user.email)||'';
  try{ localStorage.setItem('dm_tcci_interes', JSON.stringify({precio:precio, fecha:new Date().toISOString()})); }catch(_){}
  let guardado = false;
  try{
    await db.post('tcci_interes',{
      patient_email: email,
      precio_elegido: precio,
      semana_bloqueada: (window._dmTcciSemanaIntento||null)
    }, '');
    guardado = true;
  }catch(e){
    // Este dato es el que te dice si el programa se puede cobrar y a qué
    // precio. Perderlo en silencio es perder la única señal de mercado que
    // tenés, así que si falla se ve.
    console.error('[TCCI-INTERES]', e);
  }
  const box=document.getElementById('dm-tcci-pay-box');
  if(box && !guardado){
    box.innerHTML='<div style="text-align:center;padding:14px 0">'+
      '<div style="font-size:15px;color:#fca5a5;line-height:1.6;margin-bottom:14px">No se pudo registrar tu respuesta. Probá de nuevo en un rato.</div>'+
      '<button onclick="document.getElementById(\'dm-tcci-pay\').remove()" style="width:100%;background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.2);border-radius:12px;padding:12px;color:#fff;font-size:14px;cursor:pointer;font-family:var(--font)">Cerrar</button></div>';
    return;
  }
  if(box){
    box.innerHTML='<div style="text-align:center;padding:10px 0">'+
      '<div style="font-size:34px;margin-bottom:10px">✓</div>'+
      '<div style="font-size:17px;font-weight:700;color:#fff;margin-bottom:6px">Listo, gracias</div>'+
      '<div style="font-size:13px;color:rgba(255,255,255,.9);line-height:1.6;margin-bottom:18px">Te vamos a escribir cuando el programa esté disponible.</div>'+
      '<button onclick="document.getElementById(\'dm-tcci-pay\').remove()" style="width:100%;background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.2);border-radius:12px;padding:12px;color:#fff;font-size:14px;cursor:pointer;font-family:var(--font)">Cerrar</button></div>';
  }
}

// ── DISPOSICIÓN AL CAMBIO, ANTES DE EMPEZAR ───────────────────────────
// REST pregunta una sola cosa —"¿qué tan dispuesto estás a cambiar tus
// rutinas?", 1 a 10— y está bien pensado: la TCC-I no falla por el contenido,
// falla por la adherencia, y saber con qué disposición arranca alguien
// permite ajustar lo que se le promete.
//
// Acá van DOS reglas y no una, porque en entrevista motivacional
// (Rollnick) son construcciones distintas y piden respuestas opuestas:
//
//   · IMPORTANCIA baja  → no sabe para qué lo haría. Hay que trabajar el
//                          porqué antes que el cómo.
//   · CONFIANZA baja    → quiere, pero no se cree capaz. Hay que achicar el
//                          primer paso, no insistir con el motivo.
//
// Un solo número mezcla las dos y pierde justamente lo accionable. La
// pregunta de abajo ("¿por qué ese número y no uno más bajo?") es la que
// hace hablar a la persona a favor del cambio, no en contra.
//
// Se guarda en el dispositivo. Para que el profesional lo vea hace falta una
// columna en la base: está el SQL en SQL-disposicion-al-cambio.md.
const DM_TCCI_REGLAS = [
  { id:'importancia', pregunta:'¿Qué tan importante es para vos dormir mejor?',
    bajo:'Nada importante', alto:'Lo más importante' },
  { id:'confianza',   pregunta:'¿Qué tanta confianza tenés en poder sostener cambios en tus rutinas?',
    bajo:'Ninguna', alto:'Mucha' }
];
function dmTcciDisposicion(){
  try{ return JSON.parse(localStorage.getItem('dm_tcci_disposicion')||'null'); }catch(_){ return null; }
}
function dmTcciGuardarDisposicion(){
  const d = { fecha:new Date().toISOString() };
  DM_TCCI_REGLAS.forEach(function(r){
    const e=document.getElementById('dm-disp-'+r.id);
    d[r.id] = e ? Number(e.value) : null;
  });
  const p=document.getElementById('dm-disp-porque');
  d.porque = p ? (p.value||'').trim() : '';
  try{ localStorage.setItem('dm_tcci_disposicion', JSON.stringify(d)); }catch(_){}
  try{ toast('Gracias. Lo tenemos en cuenta.'); }catch(_){}
  try{ dmTcciRenderPrograma(); }catch(_){}
}
window.dmTcciGuardarDisposicion = dmTcciGuardarDisposicion;
function dmDispMover(id,v){
  const n=document.getElementById('dm-disp-n-'+id); if(n) n.textContent=v;
}
window.dmDispMover = dmDispMover;

// Qué se le dice a alguien según con qué llegó. No es un puntaje ni una
// categoría: es ajustar lo que el programa promete, que es lo que pediste.
function dmTcciLecturaDisposicion(d){
  if(!d) return null;
  const imp=Number(d.importancia)||0, con=Number(d.confianza)||0;
  if(imp<=4) return { tono:'ambar', txt:'Dormir mejor no aparece hoy como una prioridad tuya, y eso está bien decirlo. '+
    'Empezá por la semana 1, que es solo entender cómo funciona tu sueño y registrar. '+
    'Si más adelante te importa más, el programa sigue acá.' };
  if(con<=4) return { tono:'ambar', txt:'Querés dormir mejor pero no te ves sosteniendo los cambios. '+
    'Es la situación más común y no es falta de voluntad. La respuesta es achicar el primer paso: '+
    'esta semana, una sola cosa — levantarte a la misma hora. Nada más.' };
  if(imp>=8 && con>=8) return { tono:'verde', txt:'Llegás con ganas y con confianza. '+
    'Un aviso, justamente por eso: las primeras dos semanas de la TCC-I suelen empeorar el cansancio diurno '+
    'antes de mejorar el sueño. Es esperable y es parte del mecanismo, no una señal de que no funciona.' };
  return { tono:'verde', txt:'Buen punto de partida. El programa va semana a semana y cada una se apoya en la anterior; '+
    'lo que más predice el resultado es completar el diario, no hacerlo perfecto.' };
}

function dmTcciRenderPrograma(){
  const actual=dmTcciSemanaActual();
  const empezado=(function(){ try{ return !!localStorage.getItem('dm_tcci_inicio'); }catch(_){ return false; } })();
  const acceso=dmTcciTieneAcceso();
  let html='<div style="background:rgba(255,255,255,0.05);border-radius:16px;padding:16px;margin-top:14px">'+
    '<div class="sec-title" style="margin:0 0 4px;color:rgba(244,239,229,.92)">Programa de '+DM_TCCI_PROGRAMA.length+' semanas</div>'+
    '<div style="font-size:12px;color:rgba(255,255,255,.82);line-height:1.55;margin-bottom:12px">'+
      (dmTcciModo()==='guiado'
        ? 'Cada semana se habilita cuando la trabajás con tu profesional. El contenido es el mismo del programa completo.'
        : empezado
          ? 'Cada semana se abre cuando terminás la anterior. Sin apuro y sin calendario: el ritmo lo ponés vos.'
          : 'Terapia cognitivo-conductual para el insomnio, paso a paso. Función premium — tu horario de sueño recomendado de arriba es sin costo.')+'</div>';
  // Las dos reglas, antes de todo lo demás, y solo si todavía no arrancó.
  if(!empezado){
    const _d = dmTcciDisposicion();
    if(!_d){
      html+='<div class="dm-disp">'+
        '<div class="dm-disp-tit">Antes de empezar</div>'+
        '<div class="dm-disp-sub">Dos preguntas. No hay respuesta correcta: sirven para '+
          'ajustar lo que sigue a cómo estás llegando.</div>'+
        DM_TCCI_REGLAS.map(function(r){
          return '<div class="dm-disp-bloque">'+
            '<div class="dm-disp-preg">'+r.pregunta+'</div>'+
            '<div class="dm-disp-num"><span id="dm-disp-n-'+r.id+'">5</span><i>/10</i></div>'+
            '<input type="range" min="1" max="10" value="5" id="dm-disp-'+r.id+'" '+
              'class="dm-disp-rango" oninput="dmDispMover(\''+r.id+'\', this.value)">'+
            '<div class="dm-disp-extremos"><span>'+r.bajo+'</span><span>'+r.alto+'</span></div>'+
          '</div>';
        }).join('')+
        '<div class="dm-disp-bloque">'+
          '<div class="dm-disp-preg">¿Por qué ese número, y no uno más bajo?</div>'+
          '<div class="dm-disp-ayuda">Opcional. Lo que escribas es para vos y para tu profesional '+
            'si tenés uno.</div>'+
          '<textarea id="dm-disp-porque" class="dm-disp-txt" rows="3" '+
            'placeholder="Porque ya no rindo en el trabajo…"></textarea>'+
        '</div>'+
        '<button class="dm-disp-btn" onclick="dmTcciGuardarDisposicion()">Continuar</button>'+
      '</div>';
    }else{
      const _l = dmTcciLecturaDisposicion(_d);
      if(_l){
        html+='<div class="dm-disp-lectura '+(_l.tono==='ambar'?'ambar':'')+'">'+
          '<div class="dm-disp-lectura-rot">Cómo estás llegando</div>'+
          '<div class="dm-disp-lectura-txt">'+_l.txt+'</div>'+
          '<div class="dm-disp-lectura-pie">Importancia '+(_d.importancia||'—')+'/10 · '+
            'Confianza '+(_d.confianza||'—')+'/10 · '+
            '<a onclick="try{localStorage.removeItem(\'dm_tcci_disposicion\');dmTcciRenderPrograma();}catch(_){}">volver a responder</a></div>'+
        '</div>';
      }
    }
    if(dmTcciModo()!=='guiado') html+='<div style="background:rgba(200,169,110,.1);border:1px solid rgba(200,169,110,.28);border-radius:12px;padding:13px 15px;margin-bottom:12px">'+
      '<div style="font-size:11px;color:#C8A96E;font-weight:700;letter-spacing:.05em;margin-bottom:5px">CON ACOMPAÑAMIENTO FUNCIONA MEJOR</div>'+
      '<div style="font-size:12.5px;color:rgba(255,255,255,.92);line-height:1.55;margin-bottom:10px">Este programa sigue la misma estructura que los tratamientos digitales aprobados por agencias regulatorias, que se indican <b>como complemento</b> de la atención profesional, no en reemplazo. Un profesional formado en TCC-I ajusta el ritmo a tu caso, resuelve las dudas del camino y acelera bastante los resultados. Si podés, buscá acompañamiento: te va a rendir más.</div>'+
      '<button onclick="showPatientCode()" style="width:100%;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.18);border-radius:11px;padding:11px;color:#F4EFE5;font-size:13px;font-weight:600;cursor:pointer;font-family:var(--font)">Vincular un profesional</button>'+
    '</div>';
    html+='<button onclick="dmTcciEmpezar()" style="width:100%;background:#7EC8A4;border:none;border-radius:12px;padding:13px;color:#0F2820;font-size:14px;font-weight:700;cursor:pointer;font-family:var(--font);margin-bottom:12px">Empezar el programa</button>';
  }
  // Progreso general, arriba de todo: es lo primero que uno quiere ver al
  // volver a un programa de seis semanas.
  if(dmTcciProgresoTotal().total) html+=dmTcciProgresoHtml();
  const _guiado = dmTcciModo()==='guiado';
  DM_TCCI_PROGRAMA.forEach(function(s){
    const _q0 = dmTcciProgresoSemana(s);
    const _cerrada = dmTcciCerrada(s.n);
    // Una sola regla de apertura para los dos modos: el calendario dejó de
    // mandar. Antes una semana podía estar "en 14 días" aunque la persona
    // ya hubiera terminado la anterior, y al revés.
    const abierta = dmTcciSemanaAbierta(s.n);
    // El cobro no corre para quien viene acompañado por un profesional.
    const bloqueadaPorPago = !_guiado && !s.libre && !acceso && !empezado;
    const activa = abierta && !bloqueadaPorPago;
    const borde = activa ? 'rgba(126,200,164,.35)' : 'rgba(255,255,255,.1)';
    let estado='';
    if(bloqueadaPorPago) estado='<span style="font-size:10px;background:rgba(200,169,110,.2);color:#C8A96E;border-radius:99px;padding:2px 8px;font-weight:700">Premium</span>';
    else if(_cerrada) estado='<span style="font-size:10px;background:rgba(126,200,164,.2);color:#7EC8A4;border-radius:99px;padding:3px 9px;font-weight:700">✓ Hecha</span>';
    else if(!abierta) estado='<span style="font-size:14px;opacity:.7">🔒</span>';
    else estado='<span style="color:#7EC8A4;font-size:16px">›</span>';
    html+='<div onclick="dmTcciAbrirSemana('+s.n+')" style="background:rgba(255,255,255,.04);border:1px solid '+borde+';border-radius:12px;padding:12px 14px;margin-bottom:8px;display:flex;align-items:center;gap:12px;'+(activa?'cursor:pointer':'opacity:.5;cursor:pointer')+'">'+
      '<div style="width:26px;height:26px;border-radius:50%;background:'+(activa?'#1a4a3a':'rgba(255,255,255,.08)')+';display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;color:'+(activa?'#fff':'rgba(255,255,255,.45)')+';flex-shrink:0">'+s.n+'</div>'+
      '<div style="flex:1;min-width:0"><div style="font-size:13.5px;font-weight:600;color:'+(activa?'#fff':'rgba(255,255,255,.6)')+'">'+s.titulo+'</div>'+
      '<div style="font-size:11px;color:rgba(255,255,255,.72);margin-top:2px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">'+
        (abierta ? (s.subtitulo||s.objetivo) : dmTcciMotivoCierre(s.n))+'</div>'+
      (function(){ const q=_q0; if(!q.total || (!abierta && !q.hechas)) return '';
        return '<div style="display:flex;align-items:center;gap:7px;margin-top:6px">'+
          '<div style="flex:1;height:4px;background:rgba(255,255,255,.09);border-radius:2px;overflow:hidden"><div style="height:100%;width:'+q.pct+'%;background:'+(q.pct===100?'#7EC8A4':'#C8A96E')+'"></div></div>'+
          '<span style="font-size:10px;color:'+(q.pct===100?'#7EC8A4':'rgba(255,255,255,.45)')+';white-space:nowrap">'+q.hechas+'/'+q.total+'</span></div>'; })()+'</div>'+
      '<div style="flex-shrink:0">'+estado+'</div></div>';
  });
  if(dmTcciTieneAcceso()){
    html+='<div onclick="dmTcciReiniciar()" style="text-align:center;margin-top:14px;padding:10px;'+
      'font-size:11.5px;color:rgba(255,255,255,.5);cursor:pointer;border-top:1px solid rgba(255,255,255,.07)">'+
      '↺ Reiniciar el programa (cuenta de prueba)</div>';
  }
  html+='</div>';
  return '<div id="dm-tcci-lista">'+html+'</div>';
}

async function openPatientCbtiView(){
  showScreen('patient-tcci');
  const cont = document.getElementById('patient-tcci-content');
  cont.innerHTML = '<div style="text-align:center;padding:40px 0;color:rgba(255,255,255,.76)"><div class="spinner" style="margin:0 auto 12px"></div>Cargando…</div>';
  try{
    const patEmail = S.user?.email;
    if(!patEmail){ cont.innerHTML='<div style="padding:20px">Sesión no iniciada.</div>'; return; }
    // Se recalcula siempre: si el profesional desactivó el acompañamiento,
    // la vista no puede seguir creyendo que hay alguien habilitando semanas.
    S._tcciGuiadoPor = null;
    S._tcciSemanasPro = {};
    // Buscar todos los médicos que activaron CBT-I para este paciente
    const active = await db.get('cbti_patients?patient_email=ilike.'+encodeURIComponent(patEmail)+'&active=eq.true&select=doctor_email').catch(()=>[]);
    if(!active || !active.length){
      // Sin protocolo del profesional → ofrecer la vía AUTOGUIADA basada en el
      // diario (restricción de sueño). El paciente puede empezar solo.
      let sw=null;
      try{
        const _d = await db.get('sleep_diary?patient_email=eq.'+encodeURIComponent(patEmail)+'&order=diary_date.desc&limit=30&select=bedtime,wake_time,sleep_minutes,notes,diary_date').catch(()=>[]);
        let _anchor;
        try{ const _o=await dmGetWindowOverride(patEmail,null); if(_o&&_o.window_anchor!=null) _anchor=_o.window_anchor; }catch(_){}
        sw = computeSleepWindow(_d||[], _anchor);
      }catch(_){}
      let html='<div style="background:linear-gradient(135deg,rgba(126,200,164,0.14),rgba(200,169,110,0.08));border:1px solid rgba(200,169,110,0.4);border-radius:16px;padding:18px;margin-bottom:16px">'+
        '<div style="font-size:34px;margin-bottom:6px">🌿</div>'+
        '<div style="font-size:17px;font-weight:700;color:#fff;margin-bottom:4px">Programa autoguiado para dormir mejor</div>'+
        '<div style="font-size:12.5px;color:rgba(255,255,255,.9);line-height:1.55">Terapia cognitivo-conductual para el insomnio (TCC-I), el tratamiento de primera línea. Podés seguirlo por tu cuenta a partir de tu diario, o pedirle a un profesional que te acompañe.</div>'+
      '</div>';
      if(!sw || sw.error){
        html+='<div style="background:rgba(255,255,255,0.05);border-radius:14px;padding:16px;text-align:center;color:rgba(255,255,255,.9);font-size:13px;line-height:1.6">📔 Para calcular tu <strong>horario de sueño recomendado</strong> personalizada necesitamos al menos <strong>5 noches</strong> registradas en el diario'+(sw&&sw.n?' (tenés '+sw.n+')':'')+'.<br><br>Registrá tu sueño unos días y volvé — la restricción del tiempo en cama arranca desde tus datos reales.</div>'+
          '<button onclick="navTo(\'diary\')" style="width:100%;margin-top:12px;background:#7EC8A4;color:#0F2820;border:none;border-radius:12px;padding:13px;font-size:14px;font-weight:600;cursor:pointer;font-family:var(--font)">Registrar mi noche</button>';
      } else {
        const effCol = sw.eff>=85?'#7EC8A4':sw.eff>=80?'#C8A96E':'#fca5a5';
        html+='<div style="background:rgba(255,255,255,0.05);border-radius:16px;padding:16px;margin-bottom:14px">'+
          '<div class="sec-title" style="margin:0 0 10px;color:rgba(244,239,229,.92)">Tu horario de sueño recomendado recomendada</div>'+
          '<div style="display:flex;gap:10px;margin-bottom:12px">'+
            '<div style="flex:1;background:rgba(126,200,164,0.1);border-radius:12px;padding:11px;text-align:center"><div style="font-size:9px;color:rgba(255,255,255,.72);letter-spacing:.06em">ACOSTARSE</div><div style="font-size:22px;font-weight:700;color:#fff">'+sw.fmt(sw.bedTarget)+'</div></div>'+
            '<div style="flex:1;background:rgba(126,200,164,0.1);border-radius:12px;padding:11px;text-align:center"><div style="font-size:9px;color:rgba(255,255,255,.72);letter-spacing:.06em">LEVANTARSE</div><div style="font-size:22px;font-weight:700;color:#fff">'+sw.fmt(sw.wakeTarget)+'</div></div>'+
          '</div>'+
          '<div style="display:flex;gap:10px;font-size:11.5px;color:rgba(255,255,255,.9)">'+
            '<div style="flex:1">Dormís en promedio <b style="color:#fff">'+sw.fmtDur(sw.avgTST)+'</b></div>'+
            '<div style="flex:1">Eficiencia <b style="color:'+effCol+'">'+sw.eff+'%</b></div>'+
          '</div>'+
          '<div style="background:rgba(200,169,110,0.12);border-left:3px solid #C8A96E;border-radius:6px;padding:10px 12px;margin-top:12px;font-size:12px;color:rgba(255,255,255,.97);line-height:1.5">'+sw.titr.txt+'</div>'+
        '</div>';
        html+='<div style="background:rgba(255,255,255,0.05);border-radius:14px;padding:14px 15px;font-size:12.5px;color:rgba(255,255,255,.9);line-height:1.6">'+
          '<div style="font-weight:600;color:#fff;margin-bottom:6px">Cómo aplicarla esta semana</div>'+
          '1. Acostate <b>solo</b> a la hora indicada, aunque tengas sueño antes.<br>'+
          '2. Levantate a la hora fija <b>todos los días</b>, incluidos los fines de semana.<br>'+
          '3. Si no dormís en ~20 min, levantate y volvé cuando tengas sueño (volver a asociar la cama con dormir).<br>'+
          '4. Nada de siestas. Seguí registrando: en 7 días recalculamos el horario.'+
        '</div>'+
        '<div style="font-size:11px;color:rgba(255,255,255,.72);text-align:center;margin-top:12px;line-height:1.5">Herramienta de apoyo, no reemplaza la consulta. Si tenés apnea, trabajás en turnos rotativos o hay somnolencia peligrosa, consultá antes de restringir el sueño.</div>';
      }
      // El programa de 6 semanas va SIEMPRE, haya o no ventana calculada.
      try{ html += dmTcciRenderPrograma(); }catch(_e){ console.warn('[TCCI programa]', _e); }
      cont.innerHTML=html;
      return;
    }
    // ══ Paciente CON profesional ═══════════════════════════════════════
    // Acá antes se dibujaba un programa COMPLETAMENTE DISTINTO: los 27
    // ítems de CBTI_PROTOCOL con textos sueltos, la mayoría bajo candado
    // y sin el material de lectura ni las tareas. O sea que tener
    // profesional daba MENOS contenido que ir solo. Eso está al revés.
    // Ahora es el mismo programa de siete semanas; lo único distinto es
    // que las habilita el profesional en vez del avance propio.
    const drEmail = active[0].doctor_email;
    S._tcciGuiadoPor = drEmail;
    // Semanas habilitadas: viven en cbti_progress con item_id 'semana-N',
    // que es la tabla que ya existe y ya tiene su RLS.
    S._tcciSemanasPro = {};
    try{
      const prog = await db.get('cbti_progress?doctor_email=ilike.'+encodeURIComponent(drEmail)+
        '&patient_email=ilike.'+encodeURIComponent(patEmail)+
        '&completed=eq.true&select=item_id') || [];
      prog.forEach(function(r){
        const m=/^semana-(\d+)$/.exec(String(r.item_id||''));
        if(m) S._tcciSemanasPro[parseInt(m[1],10)]=true;
      });
    }catch(e){ console.warn('[tcci] semanas del profesional:', e); }

    let html = '';
    // ── El horario: si el profesional lo ajustó, manda el suyo ─────────
    try{
      const ov = await dmGetWindowOverride(patEmail, null);
      let bed=null, wake=null, note='', fuente='';
      if(ov && ov.window_bed!=null && ov.window_wake!=null){
        bed=ov.window_bed; wake=ov.window_wake; note=ov.window_note||'';
        fuente='Indicada por tu profesional';
      } else {
        const sw = await dmComputeWindowFor(patEmail);
        if(sw && !sw.error){ bed=sw.bedTarget; wake=sw.wakeTarget; note=sw.titr.txt; fuente='Calculada desde tu diario'; }
      }
      if(bed!=null){
        const dur=dmWindowDuration(bed,wake);
        html += '<div style="background:linear-gradient(135deg,rgba(126,200,164,0.16),rgba(200,169,110,0.08));border:1px solid rgba(200,169,110,0.45);border-radius:16px;padding:16px;margin-bottom:16px">'+
          '<div style="font-size:10px;color:#C8A96E;letter-spacing:.09em;font-weight:700;text-transform:uppercase;margin-bottom:10px">'+fuente+'</div>'+
          '<div style="display:flex;gap:10px;margin-bottom:10px">'+
            '<div style="flex:1;background:rgba(255,255,255,0.07);border-radius:12px;padding:11px;text-align:center"><div style="font-size:9px;color:rgba(255,255,255,.72);letter-spacing:.06em">ACOSTARTE</div><div style="font-size:23px;font-weight:700;color:#fff">'+dmMinsToHHMM(bed)+'</div></div>'+
            '<div style="flex:1;background:rgba(255,255,255,0.07);border-radius:12px;padding:11px;text-align:center"><div style="font-size:9px;color:rgba(255,255,255,.72);letter-spacing:.06em">LEVANTARTE</div><div style="font-size:23px;font-weight:700;color:#fff">'+dmMinsToHHMM(wake)+'</div></div>'+
          '</div>'+
          '<div style="font-size:11.5px;color:rgba(255,255,255,.82);text-align:center;margin-bottom:'+(note?'10px':'0')+'">'+Math.floor(dur/60)+' h '+String(dur%60).padStart(2,'0')+' m en cama</div>'+
          (note?'<div style="font-size:12.5px;color:rgba(255,255,255,.95);line-height:1.55;background:rgba(255,255,255,0.05);border-radius:10px;padding:11px">'+String(note).replace(/</g,'&lt;')+'</div>':'')+
        '</div>';
      }
    }catch(e){ console.warn('[patient-tcci] ventana:', e); }

    // ── Quién lleva el ritmo ──────────────────────────────────────────
    let _drNom = '';
    try{
      const _d = await db.get('doctors?email=ilike.'+encodeURIComponent(drEmail)+'&select=name,lname,gender') || [];
      if(_d[0]) _drNom = ((_d[0].gender==='Femenino'?'Dra. ':'Dr. ')+(_d[0].name||'')+' '+(_d[0].lname||'')).trim();
    }catch(_){}
    const _habil = Object.keys(S._tcciSemanasPro).length + 1;
    html += '<div style="background:rgba(126,200,164,.1);border:1px solid rgba(126,200,164,.3);border-radius:14px;padding:14px 15px;margin-bottom:14px">'+
      '<div style="font-size:10px;letter-spacing:.08em;color:#7EC8A4;font-weight:700;margin-bottom:5px">PROGRAMA ACOMPAÑADO</div>'+
      '<div style="font-size:13px;color:rgba(255,255,255,.95);line-height:1.6">'+
        'Estás haciendo el programa con '+(_drNom?('<b>'+_drNom+'</b>'):'tu profesional')+'. '+
        'El contenido es exactamente el mismo que el autogestionado: lo que cambia es que '+
        '<b>las semanas las habilita '+(_drNom?'él o ella':'tu profesional')+'</b> a medida que las trabajan juntos, '+
        'en vez de abrirse solas.'+
        (_habil<=DM_TCCI_PROGRAMA.length
          ? '<br><br>Ahora tenés habilitadas <b>'+Math.min(_habil,DM_TCCI_PROGRAMA.length)+' de '+DM_TCCI_PROGRAMA.length+'</b> semanas.'
          : '')+
      '</div></div>';

    // Y de acá en más, EL MISMO programa que ve quien va solo.
    try{ html += dmTcciRenderPrograma(); }catch(_e){ console.warn('[TCCI programa]', _e); }
    cont.innerHTML = html;
  }catch(err){
    console.error('[patient-tcci] error:', err);
    cont.innerHTML = '<div style="padding:20px;color:#fca5a5">Error al cargar tu protocolo. Intentá de nuevo en un momento.</div>';
  }
}

// Detectar si el paciente tiene un protocolo TCC-I activo y mostrar la tarjeta en Más
async function checkPatientTcciCard(){
  try{
    const card = document.getElementById('patient-tcci-card');
    const patEmail = S.user?.email;
    console.log('[checkPatientTcciCard] patient_email=', patEmail, '· card exists?', !!card);
    if(!card || !patEmail) return;
    let active = null;
    try{
      active = await db.get('cbti_patients?patient_email=ilike.'+encodeURIComponent(patEmail)+'&active=eq.true&select=doctor_email');
      console.log('[checkPatientTcciCard] cbti_patients (active=true) response:', active);
      // Si vino vacío, reintentar sin el filtro active (por si la columna no existe o es null)
      if(!active || !active.length){
        const any = await db.get('cbti_patients?patient_email=ilike.'+encodeURIComponent(patEmail)+'&select=doctor_email,active').catch(()=>null);
        console.log('[checkPatientTcciCard] cbti_patients (sin filtro) response:', any);
        if(any && any.length){
          // Hay fila pero active no es true → la tomamos igual (el médico la creó)
          active = any.filter(r=>r.active!==false);
        }
      }
    }catch(err){
      console.error('[checkPatientTcciCard] DB ERROR:', err);
      card.innerHTML = '<div style="background:#fef2f2;border:1px solid #fca5a5;border-radius:12px;padding:12px;font-size:11px;color:#991b1b"><strong>⚠ No se pudo leer tu protocolo TCC-I.</strong><br>'+(err.message||'')+'<br>Probable política RLS faltante en cbti_patients.</div>';
      card.style.display='flex';
      return;
    }
    card.style.display='flex'; // flex, no block: los hijos van en fila como en las demás filas de Más
    const homeCard = document.getElementById('home-tcci-card');
    if(homeCard) homeCard.style.display='block';
    const homeSub = document.getElementById('home-tcci-sub');
    const pctEl = document.getElementById('patient-tcci-progress');
    if(active && active.length){
      const drEmail = active[0].doctor_email;
      const prog = await db.get('cbti_progress?doctor_email=ilike.'+encodeURIComponent(drEmail)+'&patient_email=ilike.'+encodeURIComponent(patEmail)+'&completed=eq.true&select=item_id').catch(()=>[]);
      const done = (prog||[]).length;
      if(pctEl) pctEl.textContent = done+' de '+CBTI_TOTAL_ITEMS+' temas desbloqueados';
      if(homeSub) homeSub.textContent = 'Tu profesional te lo configuró · '+done+' de '+CBTI_TOTAL_ITEMS+' temas desbloqueados';
    } else {
      if(pctEl) pctEl.textContent = 'Empezá el programa autoguiado desde tu diario';
      if(homeSub) homeSub.textContent = 'Terapia cognitivo-conductual guiada. Podés empezar por tu cuenta.';
    }
    // A quien cumple criterio de insomnio, la tarjeta no le dice lo mismo
    // que a quien entró a mirar. Es la indicación de primera línea de las
    // guías: si sus propias respuestas lo muestran, corresponde decírselo.
    try{ dmTcciDestacarSiInsomnio(homeCard, homeSub, !!(active && active.length)); }catch(_){}
  }catch(e){ console.warn('[checkPatientTcciCard] error:', e); }
}

// ── ¿Este paciente cumple criterio de insomnio? ──────────────────────
// Mismos cortes que las etiquetas del profesional, para que las dos caras
// de la app no digan cosas distintas del mismo puntaje.
//   · ISI ≥ 11  (Morin 2011)
//   · AIS ≥ 10  (Soldatos 2003)
//   · patrón de insomnio en el diario
function dmTcciCriterioInsomnio(){
  try{
    const ult={};
    (S.records||[]).forEach(function(r){
      if(!ult[r.scale_id] || new Date(r.created_at)>new Date(ult[r.scale_id].created_at)) ult[r.scale_id]=r;
    });
    if(ult.isi && Number(ult.isi.score)>=11) return {si:true, por:'ISI', v:Number(ult.isi.score)};
    if(ult.ais && Number(ult.ais.score)>=10) return {si:true, por:'AIS', v:Number(ult.ais.score)};
    const pat=(window._dmPatronDiario||{})[(S.user&&S.user.email)||''] || '';
    if(/patr[óo]n de insomnio/i.test(pat)) return {si:true, por:'diario', v:null};
  }catch(_){}
  return {si:false};
}
window.dmTcciCriterioInsomnio = dmTcciCriterioInsomnio;

function dmTcciDestacarSiInsomnio(card, sub, yaGuiado){
  if(!card) return;
  const c = dmTcciCriterioInsomnio();
  card.classList.toggle('dm-tcci-indicado', !!c.si);
  if(!c.si || yaGuiado) return;
  // El texto dice POR QUÉ aparece. Una recomendación sin motivo se lee
  // como publicidad del programa; con el motivo, se lee como lo que es.
  if(sub){
    sub.innerHTML = c.por==='diario'
      ? '<b>Tu diario muestra un patrón de insomnio.</b> La terapia cognitivo-conductual es lo primero que recomiendan las guías, antes que la medicación.'
      : '<b>Tus respuestas del '+c.por+' ('+c.v+') muestran criterio de insomnio.</b> La terapia cognitivo-conductual es lo primero que recomiendan las guías, antes que la medicación.';
  }
  const tag = card.querySelector('div[style*="PROGRAMA"], div');
  try{
    const et = card.firstElementChild;
    if(et && /PROGRAMA/.test(et.textContent)) et.textContent = 'RECOMENDADO';
  }catch(_){}
}
window.dmTcciDestacarSiInsomnio = dmTcciDestacarSiInsomnio;
