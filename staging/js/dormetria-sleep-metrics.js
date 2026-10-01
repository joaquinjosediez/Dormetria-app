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
// Cada franja trae DOS rangos, porque la NSF publica dos y usar uno solo
// deforma el puntaje:
//   lo/hi          → "recommended"
//   may_lo/may_hi  → "may be appropriate", el rango ampliado
// Para un chico de 2 años lo recomendado es 11–14 h, pero entre 9 y 16 la
// propia NSF dice que puede estar bien. Con un único rango, 10 h de sueño en
// un chico que está perfecto caía como déficit y arrastraba el puntaje de
// Cantidad; con los dos, queda señalado pero sin castigo fuerte, que es lo
// que la evidencia permite afirmar.
// Ref: Hirshkowitz M et al., Sleep Health 2015;1(1):40-43, tabla 1.
const DM_RANGOS_SUENO = [
  { max_meses:3,   etiqueta:'0–3 meses',   lo:14, hi:17, may_lo:11, may_hi:19, fuente:'NSF 2015',
    nota:'La AASM no emite recomendación por debajo de los 4 meses.' },
  { max_meses:11,  etiqueta:'4–11 meses',  lo:12, hi:15, may_lo:10, may_hi:18, fuente:'NSF 2015', aasm:[12,16] },
  { max_meses:35,  etiqueta:'1–2 años',    lo:11, hi:14, may_lo:9,  may_hi:16, fuente:'NSF 2015 y AASM 2016' },
  { max_meses:71,  etiqueta:'3–5 años',    lo:10, hi:13, may_lo:8,  may_hi:14, fuente:'NSF 2015 y AASM 2016' },
  { max_meses:167, etiqueta:'6–13 años',   lo:9,  hi:11, may_lo:7,  may_hi:12, fuente:'NSF 2015', aasm:[9,12] },
  { max_meses:215, etiqueta:'14–17 años',  lo:8,  hi:10, may_lo:7,  may_hi:11, fuente:'NSF 2015 y AASM 2016' },
  // La NSF separa 18–25 de 26–64: lo recomendado es igual (7–9 h), pero el
  // rango ampliado del adulto joven llega a 11 h y el del adulto a 10.
  { max_meses:311, etiqueta:'18–25 años',  lo:7,  hi:9,  may_lo:6,  may_hi:11, fuente:'NSF 2015' },
  { max_meses:779, etiqueta:'26–64 años',  lo:7,  hi:9,  may_lo:6,  may_hi:10, fuente:'NSF 2015' },
  { max_meses:9999,etiqueta:'65 años o más', lo:7, hi:8, may_lo:5,  may_hi:9,  fuente:'NSF 2015' }
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
//
// OJO con el año 0. Si llega un 0 entero —que es lo que da Math.floor sobre
// cualquier bebé de menos de 12 meses— no se puede saber si son 2 meses o 11,
// y los rangos son distintos (14-17 h contra 12-15 h). En ese caso se devuelve
// el de 4-11 meses, que cubre la mayor parte del primer año, y se marca como
// impreciso para que quien lo use sepa que conviene pasarle los meses.
function optimalSleepHours(ageYears){
  if(ageYears!=null && ageYears>=0 && ageYears<1 && ageYears===Math.floor(ageYears)){
    const r0 = rangoSuenoPorMeses(9);
    return {lo:r0.lo, hi:r0.hi, may_lo:r0.may_lo, may_hi:r0.may_hi,
            etiqueta:r0.etiqueta, fuente:r0.fuente, aasm:r0.aasm, impreciso:true};
  }
  const r = rangoSuenoPorMeses(ageYears==null ? null : Math.round(ageYears*12));
  return {lo:r.lo, hi:r.hi, may_lo:r.may_lo, may_hi:r.may_hi,
          etiqueta:r.etiqueta, fuente:r.fuente, aasm:r.aasm};
}

// Edad en AÑOS con decimales. Math.floor manda a todo el primer año a "0", que
// es justo donde los rangos cambian más rápido.
function edadAniosExacta(dob){
  if(!dob) return null;
  const d = new Date(dob);
  if(isNaN(d)) return null;
  const a = (Date.now() - d.getTime()) / 31557600000;
  return a < 0 ? null : a;
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
function socialJetLagMin(entries, minPorGrupo){
  const MIN = minPorGrupo || 3;
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
  // Menos de MIN noches en cualquiera de los dos grupos: no se devuelve
  // un número. Un promedio de una o dos noches no es un promedio, y acá el
  // resultado se muestra como hallazgo clínico y además puntúa.
  if(wd.length < MIN || we.length < MIN) return null;
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
// ── Puntaje de cantidad 0–50, con los DOS rangos de la NSF ────────────
// La versión anterior tenía un solo escalón: dentro del rango recomendado,
// 50; fuera, caída de 18 puntos por hora. Eso trata igual a dos cosas que la
// NSF distingue expresamente. A los 2 años, 10 h de sueño está fuera de lo
// recomendado (11–14) pero DENTRO de lo que puede ser apropiado (9–16): con
// la regla vieja perdía 18 puntos de 50, un tercio del puntaje, por algo que
// la propia fuente no considera anormal.
//
// Tres tramos, continuos entre sí:
//   dentro del recomendado           → 50
//   dentro del ampliado              → caída suave (6/h por debajo, 4/h por
//                                      encima): queda señalado, no castigado
//   fuera del ampliado               → caída firme (18/h y 8/h), que es donde
//                                      sí hay motivo clínico para alarmarse
//
// Asimetría por debajo y por encima a propósito: dormir de menos tiene
// consecuencias mejor documentadas que dormir de más, donde el exceso suele
// ser marcador de otra cosa antes que causa.
function dmPuntajeCantidad(hrs, r){
  if(hrs==null || isNaN(hrs)) return null;
  const lo=r.lo, hi=r.hi;
  const mLo=(r.may_lo!=null?r.may_lo:lo), mHi=(r.may_hi!=null?r.may_hi:hi);
  if(hrs>=lo && hrs<=hi) return 50;
  if(hrs<lo){
    const enBorde = 50 - (lo-mLo)*6;              // puntaje justo en may_lo
    const p = (hrs>=mLo) ? 50 - (lo-hrs)*6
                         : enBorde - (mLo-hrs)*18;
    return Math.max(0, Math.min(50, Math.round(p)));
  }
  const enBorde = 50 - (mHi-hi)*4;                // puntaje justo en may_hi
  const p = (hrs<=mHi) ? 50 - (hrs-hi)*4
                       : enBorde - (hrs-mHi)*8;
  return Math.max(0, Math.min(50, Math.round(p)));
}

// Dónde cae una duración respecto de los dos rangos. Lo usa la interfaz para
// no decir "por debajo del rango" cuando la NSF dice que puede estar bien.
function dmTramoCantidad(hrs, r){
  if(hrs==null || isNaN(hrs) || !r) return null;
  if(hrs>=r.lo && hrs<=r.hi) return 'recomendado';
  const mLo=(r.may_lo!=null?r.may_lo:r.lo), mHi=(r.may_hi!=null?r.may_hi:r.hi);
  if(hrs>=mLo && hrs<=mHi) return 'aceptable';
  return hrs<mLo ? 'bajo' : 'alto';
}

// Puntaje de cantidad 0–50 relativo al rango de la edad, en MESES.
function qtyScoreForMeses(hrs, meses){
  return dmPuntajeCantidad(hrs, rangoSuenoPorMeses(meses));
}

// Puntaje de cantidad 0–50 relativo al rango óptimo de la edad.
function qtyScoreForAge(hrs, ageYears){
  return dmPuntajeCantidad(hrs, optimalSleepHours(ageYears));
}
