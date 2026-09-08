/**
 * Nueva lógica para la pestaña Resumen usando motor de orientación
 * Reemplaza la lógica antigua de showDrPTab_ cuando tab==='summary'
 */
let dmCurrentMotorResult = null;
let dmCurrentEmail = null;

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
      try {
        const todas = await db.get(`sleep_diary?patient_email=eq.${encodeURIComponent(email)}&select=diary_date`);
        S._dmNochesTotales = (todas || []).length;
      } catch (_) { S._dmNochesTotales = null; }
    } catch (e) {
      console.warn('No se pudo traer el diario:', e);
      diaryEntries = [];
    }

    // Guardar para usar en el toggle
    dmCurrentMotorResult = dmMotorOrientacion(recs, diaryEntries, S.viewData);
    dmCurrentMotorResult.nochesTotalesDiario = S._dmNochesTotales;
    dmCurrentEmail = email;

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

  const html = dmRenderSummaryResumen(dmCurrentMotorResult, modo, dmCurrentEmail);
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
