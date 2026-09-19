// ── Dormetria · módulo de métricas de sueño (pediátrico + edad) ──
// Primer paso de modularización: funciones puras, sin dependencias del DOM
// ni del estado global. Se cargan como <script src> ANTES del script
// principal, quedando disponibles como funciones globales.

// ── Rangos de sueño recomendados ──────────────────────────────────────
// Referencia: National Sleep Foundation 2015 (Hirshkowitz et al.,
// Sleep Health 1(1):40-43). Se agrega entre paréntesis el rango de la AASM
// 2016 (Paruthi et al., J Clin Sleep Med 12(6):785-6) donde difiere, que es
// en lactantes y en escolares.
//
// En pediatría el rango es de sueño TOTAL en 24 h, INCLUYENDO las siestas.
// Un lactante de 9 meses duerme ~11 h de noche y ~3 h de siestas: si se mide
// solo la noche, queda 5 h por debajo del rango y el puntaje lo marca como
// grave cuando es un sueño normal.
//
// La tabla va en MESES, no en años. Con años, un bebé de 2 meses y uno de 11
// caen los dos en "0 años" y comparten rango, y los rangos son distintos.
const DM_RANGOS_SUENO = [
  { max_meses:3,   etiqueta:'0–3 meses',   lo:14, hi:17, fuente:'NSF 2015',
    nota:'La AASM no emite recomendación por debajo de los 4 meses.' },
  { max_meses:11,  etiqueta:'4–11 meses',  lo:12, hi:15, fuente:'NSF 2015', aasm:[12,16] },
  { max_meses:35,  etiqueta:'1–2 años',    lo:11, hi:14, fuente:'NSF 2015 y AASM 2016' },
  { max_meses:71,  etiqueta:'3–5 años',    lo:10, hi:13, fuente:'NSF 2015 y AASM 2016' },
  { max_meses:167, etiqueta:'6–13 años',   lo:9,  hi:11, fuente:'NSF 2015', aasm:[9,12] },
  { max_meses:215, etiqueta:'14–17 años',  lo:8,  hi:10, fuente:'NSF 2015 y AASM 2016' },
  { max_meses:779, etiqueta:'18–64 años',  lo:7,  hi:9,  fuente:'NSF 2015' },
  { max_meses:9999,etiqueta:'65 años o más', lo:7, hi:8, fuente:'NSF 2015' }
];

// Rango por edad en MESES. Es la función de referencia; la de años delega acá.
function rangoSuenoPorMeses(meses){
  const m = (meses==null) ? 360 : meses;
  for(let i=0;i<DM_RANGOS_SUENO.length;i++){
    if(m <= DM_RANGOS_SUENO[i].max_meses) return DM_RANGOS_SUENO[i];
  }
  return DM_RANGOS_SUENO[DM_RANGOS_SUENO.length-1];
}

// Edad en meses desde la fecha de nacimiento. Devuelve null sin fecha.
function edadEnMeses(dob){
  if(!dob) return null;
  const d = new Date(dob);
  if(isNaN(d)) return null;
  const h = new Date();
  let m = (h.getFullYear()-d.getFullYear())*12 + (h.getMonth()-d.getMonth());
  if(h.getDate() < d.getDate()) m--;
  return m < 0 ? null : m;
}

// Cómo se nombra la edad. "0 años" no le dice nada a nadie: hasta los dos
// años se cuenta en meses, que es como se habla en pediatría.
function etiquetaEdad(meses){
  if(meses==null) return '';
  if(meses < 24) return meses + (meses===1 ? ' mes' : ' meses');
  const a = Math.floor(meses/12);
  return a + (a===1 ? ' año' : ' años');
}

// Compatibilidad: sigue recibiendo AÑOS y acepta fracciones (0.75 = 9 meses).
function optimalSleepHours(ageYears){
  const r = rangoSuenoPorMeses(ageYears==null ? null : Math.round(ageYears*12));
  return {lo:r.lo, hi:r.hi, etiqueta:r.etiqueta, fuente:r.fuente, aasm:r.aasm};
}
// ── Modo pediátrico ──
// Umbral <13 años (escolares y menores). Fundamento: en niños los despertares
// y la fragmentación DISMINUYEN con la edad (Scholle 2011; Stores & Crawford
// 2000) y la actigrafía/diario los SOBREESTIMA por el mayor movimiento
// (Meltzer). No hay cortes clínicos de fragmentación ni de SRI validados en
// pediatría, así que esos pilares se muestran descriptivos y el puntaje de
// regularidad se apoya en el JET LAG SOCIAL, que sí tiene respaldo pediátrico
// (Sun 2019). Cantidad usa el rango de Paruthi/AASM 2016 por edad.
function isPediatric(ageYears){ return ageYears!=null && ageYears<13; }
// Jet lag social (min) desde un set de entradas: |punto medio finde − semana|.
function socialJetLagMin(entries){
  const wd=[], we=[];
  (entries||[]).forEach(e=>{
    if(!e.bedtime||!e.sleep_minutes) return;
    const day=new Date(e.diary_date+'T12:00').getDay();
    const [bh,bm]=e.bedtime.split(':').map(Number);
    let bed=bh*60+bm; if(bed<12*60) bed+=24*60;
    const mid=bed+e.sleep_minutes/2;
    const isFree=(e.day_type==='free')||(day===0||day===6);
    (isFree?we:wd).push(mid);
  });
  if(!wd.length||!we.length) return null;
  const m=a=>a.reduce((x,y)=>x+y,0)/a.length;
  return Math.round(Math.abs(m(we)-m(wd)));
}
// Puntaje 0–30 de regularidad a partir del jet lag social (para el score
// pediátrico). Cortes prácticos: <30 óptimo … >120 alto.
function jetLagRegScore(sjl){
  if(sjl==null) return 15; // neutral sin datos
  if(sjl<30) return 30; if(sjl<60) return 24; if(sjl<90) return 18;
  if(sjl<120) return 12; if(sjl<150) return 6; return 0;
}
// Puntaje de cantidad 0–50 relativo al rango de la edad, en MESES.
function qtyScoreForMeses(hrs, meses){
  const r = rangoSuenoPorMeses(meses);
  if(hrs>=r.lo && hrs<=r.hi) return 50;
  if(hrs<r.lo){ const d=r.lo-hrs; return Math.max(0, Math.round(50 - d*18)); }
  const d=hrs-r.hi; return Math.max(0, Math.round(50 - d*8));
}

// Puntaje de cantidad 0–50 relativo al rango óptimo de la edad.
function qtyScoreForAge(hrs, ageYears){
  const {lo,hi}=optimalSleepHours(ageYears);
  if(hrs>=lo && hrs<=hi) return 50;
  if(hrs<lo){ const d=lo-hrs; return Math.max(0, Math.round(50 - d*18)); }
  const d=hrs-hi; return Math.max(0, Math.round(50 - d*8));
}
