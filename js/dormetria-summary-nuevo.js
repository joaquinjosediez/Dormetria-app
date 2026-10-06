/**
 * Nueva lógica para la pestaña Resumen usando motor de orientación
 * Reemplaza la lógica antigua de showDrPTab_ cuando tab==='summary'
 */
let dmCurrentMotorResult = null;
let dmCurrentEmail = null;
// Historial completo del diario, para el histograma de progresión semanal.
let dmCurrentDiarioCompleto = [];

async function dmShowSummaryNuevo(email, cont) {
  cont.innerHTML = '<div style="padding:40px; text-align:center; color:#a09080;"><div style="font-size:14px;">⏳ Cargando resumen...</div></div>';

  try {
    // Escalas: SIEMPRE se piden frescas para ESTE paciente.
    //
    // Antes se reusaba S.viewRecs si no estaba vacío, pero esa caché es global
    // y no está atada a ningún correo: al abrir un paciente nuevo todavía tenía
    // las escalas del anterior, y el Resumen mostraba —bajo el nombre del
    // paciente actual— puntajes que no eran suyos, incluido PHQ-9. Al cambiar
    // de pestaña otra consulta los reemplazaba y "desaparecían".
    // Es el mismo error que ya se corrigió en las escalas de los hijos.
    // Una consulta de más es barata; mostrar el dato de otra persona no lo es.
    let recs = [];
    try {
      recs = await db.get(`evaluations?patient_email=eq.${encodeURIComponent(email)}&order=created_at.asc&select=*`) || [];
    } catch (e) {
      console.warn('No se pudo traer escalas:', e);
      recs = [];
    }
    // La caché se deja consistente con el paciente que se está viendo.
    S.viewRecs = recs;
    S._viewRecsEmail = email;

    // Traer diario (hasta 30 noches)
    let diaryEntries = [];
    try {
      diaryEntries = await db.get(`sleep_diary?patient_email=eq.${encodeURIComponent(email)}&order=diary_date.desc&limit=30`);
      // Total real de noches cargadas. El motor analiza solo las últimas 14
      // —es la ventana clínica— pero el Resumen decía "14 noches registradas",
      // que se leía como el total y no coincidía con la pestaña Diario.
      // Consulta liviana: una sola columna.
      // Misma consulta, con las columnas que necesita el puntaje semanal.
      // El histograma de progresión mira hasta 12 semanas hacia atrás y el
      // diario de arriba trae solo 30 noches: con eso se veían cuatro barras
      // de las nueve que tiene el paciente. Pedir cinco columnas más en una
      // consulta que ya se hacía es más barato que una segunda consulta.
      try {
        const todas = await db.get(`sleep_diary?patient_email=eq.${encodeURIComponent(email)}` +
          `&order=diary_date.asc&select=diary_date,bedtime,wake_time,sleep_minutes,nap_minutes,` +
          `awakenings,sleep_quality,day_type,notes`);
        S._dmNochesTotales = (todas || []).length;
        dmCurrentDiarioCompleto = todas || [];
      } catch (_) { S._dmNochesTotales = null; dmCurrentDiarioCompleto = []; }
    } catch (e) {
      console.warn('No se pudo traer el diario:', e);
      diaryEntries = [];
    }

    // Guardar para usar en el toggle
    dmCurrentMotorResult = dmMotorOrientacion(recs, diaryEntries, S.viewData);
    dmCurrentMotorResult.nochesTotalesDiario = S._dmNochesTotales;
    dmCurrentEmail = email;
    // El patrón de insomnio que sale del DIARIO queda publicado para que
    // las etiquetas clínicas lo puedan usar. Hasta ahora el resumen decía
    // "compatible con patrón de insomnio de mantenimiento" y la etiqueta
    // Insomnio seguía apagada, porque computeAutoTags solo miraba el ISI:
    // el diario no llegaba nunca a la etiqueta.
    try{
      window._dmPatronDiario = window._dmPatronDiario || {};
      window._dmPatronDiario[email] = String(
        (dmCurrentMotorResult.orientacion && dmCurrentMotorResult.orientacion.texto) || '');
      // Señales del diario que las etiquetas clínicas necesitan y que hasta
      // ahora no salían de acá: jet lag social y dispersión del punto medio.
      // Son las dos que definen cronodisrupción, y vivían solo en el gráfico.
      window._dmSenalesDiario = window._dmSenalesDiario || {};
      window._dmSenalesDiario[email] = {
        jetLagMin: (function(){
          try{ return typeof socialJetLagMin==='function' ? socialJetLagMin(diaryEntries) : null; }
          catch(_){ return null; }
        })(),
        sdMidMin: (function(){
          try{
            const r = typeof computeSleepRegularity==='function'
              ? computeSleepRegularity(dmNochesValidas(diaryEntries)) : null;
            return r && r.sd_midpoint_min != null ? Math.round(r.sd_midpoint_min) : null;
          }catch(_){ return null; }
        })(),
        noches: (diaryEntries||[]).length
      };
    }catch(_){}

    // Obtener el modo del profesional (Gen/Esp)
    // La preferencia se guardaba POR PACIENTE ('dm-mode-'+email), así que con
    // cada ficha nueva volvía a Generalista y había que cambiarla otra vez.
    // Es una preferencia del profesional, no del paciente: se guarda global.
    // Se respeta la del paciente si existe, por compatibilidad con lo guardado.
    let modo = 'gen';
    try {
      const global = localStorage.getItem('dm-mode');
      const porPaciente = localStorage.getItem('dm-mode-' + email);
      const elegido = global || porPaciente;
      if (elegido === 'gen' || elegido === 'esp') modo = elegido;
    } catch (_) {}

    // Renderizar la UI
    renderResumenWithMode(modo, cont);

  } catch (e) {
    console.error('Error en dmShowSummaryNuevo:', e);
    cont.innerHTML = '<div style="padding:20px; color:#ef4444; font-size:13px; line-height:1.6;"><strong>Error al cargar el resumen:</strong> ' + escHtml(e.message) + '</div>';
  }
}

function renderResumenWithMode(modo, cont) {
  if (!dmCurrentMotorResult || !dmCurrentEmail) return;

  const html = dmRenderSummaryResumen(dmCurrentMotorResult, modo, dmCurrentEmail, dmCurrentDiarioCompleto);
  cont.innerHTML = html;

  // Enganchar eventos del toggle
  setTimeout(() => {
    const genBtn = document.getElementById('dm-mode-gen');
    const espBtn = document.getElementById('dm-mode-esp');

    if (genBtn && espBtn) {
      genBtn.removeEventListener('click', handleToggleClick);
      espBtn.removeEventListener('click', handleToggleClick);

      genBtn.addEventListener('click', handleToggleClick);
      espBtn.addEventListener('click', handleToggleClick);
    }
  }, 50);

  // Etiquetas clínicas: se movieron de Perfil a Resumen. Se reutilizan las
  // mismas funciones de la app para que sigan siendo editables (toggleDrTag
  // busca #drp-tags-card-body, que es el id que usa el render).
  dmPintarEtiquetasResumen();
  dmPintarCronotipoResumen();
}

// El cronotipo se calcula con la misma función que usa Perfil, así que las
// dos pestañas no pueden divergir.
async function dmPintarCronotipoResumen() {
  const slot = document.getElementById('drp-crono-card-body');
  if (!slot) return;
  if (typeof dmCronotipoBody !== 'function') {
    slot.innerHTML = '<div style="color:rgba(244,239,229,.72);font-style:italic;font-size:12px">No disponible</div>';
    return;
  }
  try {
    slot.innerHTML = await dmCronotipoBody(S.viewData || {}, dmCurrentEmail);
  } catch (err) {
    console.warn('[Resumen] cronotipo:', err);
    slot.innerHTML = '<div style="color:rgba(244,239,229,.72);font-style:italic;font-size:12px">Sin datos</div>';
  }
}

async function dmPintarEtiquetasResumen() {
  const slot = document.getElementById('drp-tags-card-body');
  if (!slot) return;
  if (typeof computePatientTagState !== 'function' || typeof renderTagsCardBody !== 'function') {
    slot.innerHTML = '<div style="color:rgba(244,239,229,.72);font-style:italic;font-size:12px">Etiquetas no disponibles</div>';
    return;
  }
  try {
    const estado = await computePatientTagState(dmCurrentEmail);
    slot.innerHTML = renderTagsCardBody(estado);
    if (typeof renderTagHeaderPills === 'function' && S.viewData) {
      try { renderTagHeaderPills(S.viewData, estado); } catch (_) {}
    }
    // Y SE GUARDA. Acá estaba el agujero: esta es la única vez que las
    // etiquetas se resuelven con las señales del DIARIO disponibles —el motor
    // acaba de publicar _dmPatronDiario y _dmSenalesDiario unas líneas antes—,
    // pero el resultado se pintaba y se tiraba.
    //
    // El listado lateral no mira el diario: lee patients.tags.resolved, que lo
    // escribió un cálculo anterior hecho SOLO con las escalas. Por eso un
    // paciente con "Insomnio · auto · patrón de insomnio en el diario" en la
    // ficha no tenía la franja roja en la lista: en la base nunca se guardó.
    //
    // Peor: una vez que resolved existe como array, backgroundFillMissingTags
    // lo da por resuelto y no vuelve a calcularlo nunca.
    if (typeof persistResolvedTags === 'function') {
      try { await persistResolvedTags(dmCurrentEmail, estado); } catch (_) {}
    }
  } catch (err) {
    console.warn('[Resumen] etiquetas:', err);
    slot.innerHTML = '<div style="color:rgba(244,239,229,.72);font-style:italic;font-size:12px">No se pudieron cargar las etiquetas</div>';
  }
}

function handleToggleClick(e) {
  const newModo = e.target.id === 'dm-mode-gen' ? 'gen' : 'esp';

  // Guardar preferencia
  try {
    // Global: la elección vale para todas las fichas.
    localStorage.setItem('dm-mode', newModo);
  } catch (_) {}

  // Re-renderizar
  const cont = document.getElementById('drp-content');
  if (cont) {
    renderResumenWithMode(newModo, cont);
  }
}
