/**
 * Nueva lógica para la pestaña Resumen usando motor de orientación
 * Reemplaza la lógica antigua de showDrPTab_ cuando tab==='summary'
 */
let dmCurrentMotorResult = null;
let dmCurrentEmail = null;

async function dmShowSummaryNuevo(email, cont) {
  cont.innerHTML = '<div style="padding:40px; text-align:center; color:#a09080;"><div style="font-size:14px;">⏳ Cargando resumen...</div></div>';

  try {
    // Traer escalas (ya deberían estar en S.viewRecs, pero lo traemos de seguro)
    let recs = S.viewRecs || [];
    if (!recs.length) {
      try {
        recs = await db.get(`evaluations?patient_email=eq.${encodeURIComponent(email)}&order=created_at.asc&select=*`);
        S.viewRecs = recs || [];
      } catch (e) {
        console.warn('No se pudo traer escalas:', e);
        recs = [];
      }
    }

    // Traer diario (hasta 30 noches)
    let diaryEntries = [];
    try {
      diaryEntries = await db.get(`sleep_diary?patient_email=eq.${encodeURIComponent(email)}&order=diary_date.desc&limit=30`);
    } catch (e) {
      console.warn('No se pudo traer el diario:', e);
      diaryEntries = [];
    }

    // Guardar para usar en el toggle
    dmCurrentMotorResult = dmMotorOrientacion(recs, diaryEntries, S.viewData);
    dmCurrentEmail = email;

    // Obtener el modo del profesional (Gen/Esp)
    let modo = 'gen';
    try {
      const saved = localStorage.getItem('dm-mode-' + email);
      if (saved) modo = saved;
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
    localStorage.setItem('dm-mode-' + dmCurrentEmail, newModo);
  } catch (_) {}

  // Re-renderizar
  const cont = document.getElementById('drp-content');
  if (cont) {
    renderResumenWithMode(newModo, cont);
  }
}
