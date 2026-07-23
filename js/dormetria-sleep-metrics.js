// ── Dormetria · módulo de métricas de sueño (pediátrico + edad) ──
// Primer paso de modularización: funciones puras, sin dependencias del DOM
// ni del estado global. Se cargan como <script src> ANTES del script
// principal, quedando disponibles como funciones globales.

// Rango de horas de sueño recomendado por edad (National Sleep Foundation
// 2015). El score de "cantidad" del adulto (7–9h) castiga injustamente a un
// niño que duerme 10h, que para su edad es normal.
function optimalSleepHours(ageYears){
  const a = (ageYears==null) ? 30 : ageYears;
  if(a<1)  return {lo:12, hi:16};
  if(a<3)  return {lo:11, hi:14};
  if(a<6)  return {lo:10, hi:13};
  if(a<13) return {lo:9,  hi:12};
  if(a<18) return {lo:8,  hi:10};
  if(a<65) return {lo:7,  hi:9};
  return {lo:7, hi:8};
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
// Puntaje de cantidad 0–50 relativo al rango óptimo de la edad.
function qtyScoreForAge(hrs, ageYears){
  const {lo,hi}=optimalSleepHours(ageYears);
  if(hrs>=lo && hrs<=hi) return 50;
  if(hrs<lo){ const d=lo-hrs; return Math.max(0, Math.round(50 - d*18)); }
  const d=hrs-hi; return Math.max(0, Math.round(50 - d*8));
}
