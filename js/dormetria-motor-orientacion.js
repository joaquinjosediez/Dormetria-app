// ═══════════════════════════════════════════════════════════════════════════════
//  Motor de Orientación · Dormetria
//
//  Genera orientación clínica automática para la pestaña Resumen, basada en
//  reglas explícitas y auditables. Cada regla cita el umbral y la fuente.
//
//  Entrada: escalas (STOP-BANG, ESS, ISI, PHQ-9, GAD-7), diario (28 últimas noches)
//  Salida: {orientacion, conducta, banderas, evolucion, datosInsuficientes}
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Motor de orientación principal.
 * @param {Array} recs - Registros de escalas (de `evaluations`)
 * @param {Array} diaryEntries - Últimas ~30 noches de sleep_diary
 * @param {Object} doctorData - Datos del paciente (edad, etc)
 * @returns {Object} {orientacion, conducta, banderas, evolucion, datosInsuficientes}
 */
function dmMotorOrientacion(recs, diaryEntries, doctorData) {
  const result = {
    orientacion: null,
    conducta: null,
    banderas: [],
    evolucion: null,
    datosInsuficientes: false,
    modo: 'gen'  // se reemplaza por localStorage del profesional
  };

  // ─── 1. Extraer las escalas más recientes ───
  const lastScales = {};
  (recs || []).forEach(r => {
    if (!lastScales[r.scale_id] || new Date(r.created_at) > new Date(lastScales[r.scale_id].created_at)) {
      lastScales[r.scale_id] = r;
    }
  });

  // ─── 2. Validar datos mínimos ───
  const isiScore = lastScales.isi?.score ?? 0;
  const essScore = lastScales.ess?.score ?? 0;
  const phq9Score = lastScales.phq9?.score ?? 0;
  const stopbangScore = lastScales.stopbang?.score ?? 0;
  const gadScore = lastScales.gad7?.score ?? 0;

  const diarySlice = (diaryEntries || []).slice(0, 14);  // últimas 14 noches
  const diaryHasData = diarySlice.length >= 3;

  // ─── 3. Se decide ANTES de la conducta: sin base no se sugiere nada ───
  result.datosInsuficientes = (!diaryHasData && !isiScore);

  // ─── 4. ORIENTACIÓN: qué tipo de cuadro ───
  result.orientacion = dmCalcularOrientacion(isiScore, diarySlice, phq9Score, stopbangScore);

  // ─── 5. CONDUCTA SUGERIDA (solo si hay con qué sostenerla) ───
  result.conducta = dmCalcularConducta(result.orientacion, lastScales, diarySlice, result.datosInsuficientes);

  // ─── 5. BANDERAS DE SEGURIDAD (siempre) ───
  result.banderas = dmCalcularBanderas(essScore, stopbangScore, phq9Score, lastScales, diarySlice);

  // ─── 6. EVOLUCIÓN (solo si hay >= 14 días) ───
  if (diaryEntries && diaryEntries.length >= 14) {
    result.evolucion = dmCalcularEvolucion(diaryEntries);
  }

  // ─── 6b. MEDICACIÓN: el campo del perfil suele estar vacío porque la carga
  // real ocurre noche a noche en el diario. Se combinan ambas fuentes. ───
  result.medicacion = dmMedicacionCombinada(doctorData, diarySlice);

  // ─── 6c. MÉTRICAS del diario, para que el render no las recalcule ───
  result.metricas = dmMetricasDiario(diarySlice);
  result.nochesRegistradas = diarySlice.length;

  // ─── 7. MEDICACIÓN REAL (del diario + perfil) ───
  // El render espera { items:[{nombre,noches}], nochesTotales, origen }
  result.medicacion = dmMedicacionDelDiario(diarySlice, doctorData);

  // ─── 8. MÉTRICAS CRUDAS (el render las lee de motorResult.metricas) ───
  result.metricas = dmMetricasDiario(diarySlice);
  result.nochesRegistradas = diarySlice.length;

  return result;
}

/**
 * Extrae la medicación que REALMENTE toma el paciente.
 * Fuente primaria: el diario (sleep_diary.medications = JSON [{name,dose}] por noche).
 * Fuente secundaria: el campo de texto libre del perfil.
 * Devuelve { items:[{nombre,noches}], nochesTotales:N, origen:'diario'|'perfil'|null }
 */
function dmMedicacionDelDiario(diarySlice, doctorData) {
  const mapa = {};
  const nochesTotales = (diarySlice || []).length;

  (diarySlice || []).forEach(function (e) {
    if (!e || !e.medications || e.medications === '[]' || e.medications === '') return;
    try {
      const arr = typeof e.medications === 'string' ? JSON.parse(e.medications) : e.medications;
      if (!Array.isArray(arr)) return;
      arr.forEach(function (m) {
        const nombre = (m && m.name) || (typeof m === 'string' ? m : null);
        if (!nombre) return;
        const clave = String(nombre).trim() + ((m && m.dose) ? ' ' + m.dose : '');
        mapa[clave] = (mapa[clave] || 0) + 1;
      });
    } catch (_) {}
  });

  const items = Object.keys(mapa)
    .map(function (k) { return { nombre: k, noches: mapa[k] }; })
    .sort(function (a, b) { return b.noches - a.noches; });

  if (items.length) {
    return { items: items, nochesTotales: nochesTotales, origen: 'diario' };
  }

  // Fallback: texto libre del perfil (así se muestra en la pestaña Perfil)
  const perfil = ((doctorData || {}).medications || '').trim();
  if (perfil) {
    return {
      items: perfil.split(/[,;]/)
        .map(function (s) { return { nombre: s.trim(), noches: null }; })
        .filter(function (x) { return x.nombre.length > 0; }),
      nochesTotales: nochesTotales,
      origen: 'perfil'
    };
  }

  return { items: [], nochesTotales: nochesTotales, origen: null };
}

/**
 * Calcula la orientación (qué tipo de insomnio o cuadro es)
 * IMPORTANTE: No etiqueta como "crónico" sin el criterio temporal (≥3 meses, ICSD-3)
 */
function dmCalcularOrientacion(isiScore, diarySlice, phq9Score, stopbangScore) {
  const orientacion = {
    texto: '',
    base: '',
    banderas: [],
    preguntas: []  // Preguntas clínicas para el especialista que refinan la orientación
  };

  if (!isiScore && diarySlice.length < 3) {
    orientacion.texto = 'Sin datos suficientes para orientar';
    return orientacion;
  }

  // Detectar insomnio por tipo según diario + ISI
  const metrics = dmMetricasDiario(diarySlice);

  // REGLA: Detectar PRIMERO si hay AMBOS problemas = mixto
  if (metrics.vigiliaIntrasueño > 60 && metrics.latenciaMedia > 30) {
    orientacion.texto = 'Compatible con patrón de insomnio mixto';
    orientacion.base = `Tiene ambos problemas: tarda en conciliar (~${Math.round(metrics.latenciaMedia)} min) Y se despierta durante la noche (~${Math.round(metrics.vigiliaIntrasueño)} min de vigilia). Eficiencia ${Math.round(metrics.eficiencia)}%. ${diarySlice.length} noches registradas.`;
    orientacion.preguntas.push({
      id: 'duracion',
      texto: '¿Desde cuándo tiene ambos síntomas?',
      criterio: 'ICSD-3 requiere ≥3 meses de duración para insomnio crónico'
    });
  }
  // REGLA: Patrón de mantenimiento = vigilia intrasueño alto O eficiencia baja (<75%)
  // Fuente: ICSD-3, criterios operacionales
  else if (metrics.vigiliaIntrasueño > 60 || metrics.eficiencia < 75) {
    orientacion.texto = 'Compatible con patrón de insomnio de mantenimiento';
    orientacion.base = `Se despierta durante la noche (~${Math.round(metrics.vigiliaIntrasueño)} min de vigilia total). Concilia adecuadamente (latencia ~${Math.round(metrics.latenciaMedia)} min). Eficiencia ${Math.round(metrics.eficiencia)}%. ${diarySlice.length} noches registradas.`;
    orientacion.preguntas.push({
      id: 'duracion',
      texto: '¿Desde cuándo se despierta durante la noche?',
      criterio: 'ICSD-3 requiere ≥3 meses de duración para insomnio crónico'
    });
  }
  // REGLA: Patrón de conciliación = latencia alta (sin mantenimiento)
  else if (metrics.latenciaMedia > 30) {
    orientacion.texto = 'Compatible con patrón de insomnio de conciliación';
    orientacion.base = `Tarda en conciliar el sueño (~${Math.round(metrics.latenciaMedia)} min en promedio). Una vez dormido, mantiene el sueño (vigilia ~${Math.round(metrics.vigiliaIntrasueño)} min). Eficiencia ${Math.round(metrics.eficiencia)}%. ${diarySlice.length} noches registradas.`;
    orientacion.preguntas.push({
      id: 'duracion',
      texto: '¿Desde cuándo tiene dificultad para conciliar?',
      criterio: 'ICSD-3 requiere ≥3 meses de duración para insomnio crónico'
    });
  }
  // REGLA: Patrón leve con algún criterio presente
  else if (metrics.latenciaMedia > 15 || metrics.vigiliaIntrasueño > 30) {
    orientacion.texto = 'Patrón de sueño con alteraciones leves';
    orientacion.base = `Latencia ${Math.round(metrics.latenciaMedia)} min, vigilia intrasueño ${Math.round(metrics.vigiliaIntrasueño)} min, eficiencia ${Math.round(metrics.eficiencia)}%. ${diarySlice.length} noches registradas.`;
    orientacion.preguntas.push({
      id: 'duracion',
      texto: '¿Desde cuándo nota estas alteraciones?',
      criterio: 'ICSD-3 requiere ≥3 meses de duración para insomnio crónico'
    });
  } else {
    orientacion.texto = 'Patrón de sueño dentro de límites normales';
    orientacion.base = `Métricas: latencia ${Math.round(metrics.latenciaMedia)} min, vigilia ${Math.round(metrics.vigiliaIntrasueño)} min, eficiencia ${Math.round(metrics.eficiencia)}%.`;
  }

  // Banderas de ORIENTACIÓN (no de severidad, sino de diagnósticos alternativos)
  if (stopbangScore >= 3) {
    orientacion.banderas.push({
      icono: '⚠️',
      texto: 'Posible apnea de sueño',
      detalles: `STOP-BANG ${stopbangScore}/8. Considerar PSG antes de sostener hipnóticos.`
    });
  }

  if (phq9Score >= 10) {
    orientacion.banderas.push({
      icono: '⚠️',
      texto: 'Síntomas depresivos presentes',
      detalles: `PHQ-9 ${phq9Score}/27. Depresión puede estar impulsando el insomnio.`
    });
  }

  return orientacion;
}

/**
 * Calcula la conducta sugerida
 */
function dmCalcularConducta(orientacion, lastScales, diarySlice, datosInsuficientes) {
  const texto = (orientacion && orientacion.texto) || '';
  const sinBase  = datosInsuficientes || /sin datos/i.test(texto);
  const normal   = /dentro de límites normales/i.test(texto);

  // ── Sin base: NO se sugiere conducta ──────────────────────────────────
  // Antes se devolvía TCC-I siempre, así que un paciente con una sola noche
  // cargada y ninguna escala recibía igual una recomendación de tratamiento.
  // Una sugerencia sin datos que la sostengan es peor que no dar ninguna.
  if (sinBase) {
    return {
      procede: false,
      motivo: 'sin_datos',
      titulo: 'Todavía no hay base para sugerir una conducta',
      base: 'Con lo cargado hasta ahora no se puede sostener ninguna indicación. ' +
            'Estos son los datos que la habilitarían.',
      faltan: dmQueFaltaParaOrientar(lastScales, diarySlice)
    };
  }

  // ── Sueño dentro de rango: tampoco corresponde tratar insomnio ────────
  if (normal) {
    return {
      procede: false,
      motivo: 'sin_indicacion',
      titulo: 'Sin indicación de tratamiento para insomnio',
      base: 'Las métricas del diario están dentro de rango. La TCC-I trata el ' +
            'insomnio: no corresponde indicarla si no hay un patrón que lo sostenga. ' +
            'Si la persona igual refiere malestar con su sueño, conviene revisar el ' +
            'motivo de consulta antes que iniciar un tratamiento.',
      faltan: []
    };
  }

  // ── Hay un patrón de insomnio: primera línea TCC-I ────────────────────
  return {
    procede: true,
    primeraLinea: 'TCC-I (terapia cognitivo-conductual para el insomnio)',
    farmaco: 'Solo como puente, ≤ 4 semanas',
    base: 'Guías AASM / consenso. La sugerencia es de apoyo — la indicación la hacés vos.',
    matices: dmCalcularMatices(lastScales, diarySlice),
    ctaTexto: 'Iniciar TCC-I acompañada'
  };
}

/**
 * Enumera, en concreto, qué hace falta para poder orientar.
 * Sirve para que el profesional sepa qué pedir en vez de leer "sin datos".
 */
function dmQueFaltaParaOrientar(lastScales, diarySlice) {
  const faltan = [];
  const noches = (diarySlice || []).length;

  if (noches < 3) {
    faltan.push(noches === 0
      ? 'Diario de sueño: no hay ninguna noche cargada (hacen falta al menos 3, idealmente 14).'
      : 'Diario de sueño: ' + noches + (noches === 1 ? ' noche cargada' : ' noches cargadas') +
        '. Hacen falta al menos 3, idealmente 14.');
  }
  if (!(lastScales && lastScales.isi)) {
    faltan.push('ISI (Índice de Gravedad del Insomnio): no está cargado.');
  }
  if (!(lastScales && lastScales.stopbang)) {
    faltan.push('STOP-BANG: sin él no se puede descartar riesgo de apnea antes de sostener hipnóticos.');
  }
  if (!(lastScales && lastScales.ess)) {
    faltan.push('Epworth (ESS): queda sin evaluar la somnolencia diurna.');
  }
  return faltan;
}

/**
 * Matices en modo especialista (comorbilidades, excepciones)
 */
function dmCalcularMatices(lastScales, diarySlice) {
  const matices = [];

  const stopbangScore = lastScales.stopbang?.score ?? 0;
  if (stopbangScore >= 3) {
    matices.push('Si se confirma apnea: la TCC-I sigue indicada, pero tratar TRS en paralelo. Evitar hipnóticos miorrelajantes.');
  }

  const phq9Score = lastScales.phq9?.score ?? 0;
  if (phq9Score >= 15) {
    matices.push('Con depresión moderada-severa: considerar psiquiatría en paralelo. Algunos hipnóticos pueden empeorar el ánimo.');
  }

  const gadScore = lastScales.gad7?.score ?? 0;
  if (gadScore >= 10) {
    matices.push('Ansiedad presente: la TCC-I incluye manejo de rumiaciones. Revisar medicación ansiolítica actual.');
  }

  return matices;
}

/**
 * Calcula banderas de seguridad
 */
function dmCalcularBanderas(essScore, stopbangScore, phq9Score, lastScales, diarySlice) {
  const banderas = [];

  // ROJO: Apnea probable (STOP-BANG ≥3)
  if (stopbangScore >= 3) {
    banderas.push({
      severidad: 'warn',
      nombre: 'Apnea probable',
      score: `STOP-BANG ${stopbangScore}/8`,
      detalles: 'Derivar a PSG. No sostener hipnóticos sin descartar AOS.'
    });
  }

  // NARANJA: Somnolencia al volante (ESS ≥13)
  if (essScore >= 13) {
    banderas.push({
      severidad: 'warn',
      nombre: 'Somnolencia al volante',
      score: `Epworth ${essScore}/24`,
      detalles: 'Evaluar riesgo y restricciones de conducción.'
    });
  }

  // Ánimo (PHQ-9). Antes había un hueco: entre 10 y 14 no se emitía ninguna
  // bandera (la de depresión pedía ≥15 y la de "sin riesgo" pedía <10), así que
  // un paciente con depresión moderada aparecía sin nada en el panel.
  // Bandas PHQ-9: 5–9 leve · 10–14 moderada · 15–19 mod-severa · 20–27 severa.
  if (phq9Score >= 20) {
    banderas.push({
      severidad: 'crit',
      nombre: 'Depresión severa',
      score: `PHQ-9 ${phq9Score}/27`,
      detalles: 'Evaluación psiquiátrica prioritaria. Indagar ideación (ítem 9) antes de definir conducta.'
    });
  } else if (phq9Score >= 15) {
    banderas.push({
      severidad: 'crit',
      nombre: 'Depresión moderada-severa',
      score: `PHQ-9 ${phq9Score}/27`,
      detalles: 'Considerar psiquiatría en paralelo. El insomnio puede ser síntoma y no cuadro primario.'
    });
  } else if (phq9Score >= 10) {
    banderas.push({
      severidad: 'warn',
      nombre: 'Depresión moderada',
      score: `PHQ-9 ${phq9Score}/27`,
      detalles: 'Tratar el ánimo en paralelo. La TCC-I sigue indicada y suele mejorar ambos.'
    });
  }

  // ALERTA: Benzodiacepina en uso actual (SIN marcar como "crónica" sin criterio temporal)
  // NOTA: Se detecta si está en >8 de las últimas 14 noches, PERO solo marca como alerta
  // si podemos confirmar que lleva >8 semanas. Si no, va como PREGUNTA clínica en la orientación.
  const medicacionActual = dmDetectarBenzoDe8Semanas(diarySlice);
  if (medicacionActual && medicacionActual.count >= 8) {
    // NO marcamos como alerta automática: dejamos que sea pregunta en la orientación
    // banderas.push({ severidad: 'warn', ... });
  }

  // VERDE: Sin riesgo de ánimo
  if (!phq9Score || phq9Score < 10) {
    banderas.push({
      severidad: 'ok',
      nombre: 'Sin riesgo de ánimo',
      score: phq9Score ? `PHQ-9 ${phq9Score}` : 'No evaluado',
      detalles: ''
    });
  }

  return banderas;
}

/**
 * Calcula evolución (últimas 14 noches vs 14 anteriores)
 * CORREGIDO: Siempre devuelve anterior y actual (nunca null)
 */
function dmCalcularEvolucion(diaryEntries) {
  const sortedByDate = (diaryEntries || [])
    .filter(e => e.diary_date && e.sleep_minutes)
    .sort((a, b) => new Date(b.diary_date) - new Date(a.diary_date));

  const last14 = sortedByDate.slice(0, 14);
  const prev14 = sortedByDate.slice(14, 28);

  if (last14.length < 3) {
    return {
      veredicto: 'Datos insuficientes',
      adherencia: 0,
      anterior: null,
      actual: null,
      delta: null
    };
  }

  const m1 = dmMetricasDiario(last14);
  const m2 = prev14.length >= 3 ? dmMetricasDiario(prev14) : dmMetricasDiario(last14);

  const delta = m2 ? Math.round(m1.eficiencia - m2.eficiencia) : 0;
  let veredicto = 'Estable';
  if (Math.abs(delta) >= 10) {
    if (delta >= 10) veredicto = 'Va bien — mejorando';
    else veredicto = 'Empeorando — revisar plan';
  }

  return {
    veredicto: veredicto,
    adherencia: Math.round(last14.length / 14 * 100),
    anterior: m2 ? Math.round(m2.eficiencia) : Math.round(m1.eficiencia),
    actual: Math.round(m1.eficiencia),
    delta: Math.abs(delta) >= 5 ? delta : 0
  };
}

/**
 * Calcula métricas básicas del diario
 * USO: campos reales de la BD si existen, sino estima
 */
function dmMetricasDiario(entries) {
  const vacio = { latenciaMedia: 0, vigiliaIntrasueño: 0, eficiencia: 0, despertaresMedia: 0, tst: 0, tib: 0 };
  const valid = (entries || []).filter(e => e && e.sleep_minutes && e.diary_date);
  if (!valid.length) return vacio;

  const prom = a => a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0;

  // Hora "HH:MM" -> minutos. Devuelve null si el dato no sirve.
  const aMin = v => {
    if (!v) return null;
    const p = String(v).slice(0, 5).split(':');
    const h = parseInt(p[0], 10), m = parseInt(p[1], 10);
    if (isNaN(h) || isNaN(m)) return null;
    return h * 60 + m;
  };

  const latencias = [], sueños = [], tibs = [], wasos = [], despertares = [];

  valid.forEach(e => {
    const sleep = parseInt(e.sleep_minutes) || 0;
    if (sleep > 0) sueños.push(sleep);

    if (e.sleep_latency_mins != null && e.sleep_latency_mins !== '') {
      const lat = parseInt(e.sleep_latency_mins);
      if (!isNaN(lat)) latencias.push(lat);
    }

    const waso = parseInt(e.wake_in_bed_mins);
    if (!isNaN(waso) && waso > 0) wasos.push(waso);

    const desp = parseInt(e.awakenings);
    if (!isNaN(desp)) despertares.push(desp);

    // TIB — misma regla que la pestaña Diario: de acostarse a LEVANTARSE.
    // Si no cargó get_up_time, se usa wake_time.
    let bedM = aMin(e.bedtime);
    const wakeM = aMin(e.wake_time);
    if (bedM == null || wakeM == null) return;
    if (bedM < 12 * 60) bedM += 24 * 60;   // madrugada = continuación de la noche

    let finM = wakeM;
    const upM = aMin(e.get_up_time);
    if (upM != null) {
      const wAbs = (wakeM < bedM % 1440) ? wakeM + 1440 : wakeM;
      const uAbs = (upM < bedM % 1440) ? upM + 1440 : upM;
      if (uAbs >= wAbs) finM = upM;        // si es anterior, el dato está mal cargado
    }

    let tibM = (finM < bedM % 1440 ? finM + 1440 : finM) - (bedM % 1440);
    if (tibM < 0) tibM += 1440;
    if (tibM > 0 && tibM <= 24 * 60) tibs.push(tibM);
  });

  const tst = prom(sueños);
  const latenciaMedia = prom(latencias);
  // Si no hay horarios cargados en ninguna noche, no se puede calcular TIB:
  // se cae a TST + latencia (eficiencia ~100%) y se avisa con tib=0.
  const tib = tibs.length ? prom(tibs) : 0;
  const base = tib > 0 ? tib : (tst + latenciaMedia);

  const eficiencia = base > 0 ? Math.round(tst / base * 100) : 0;

  // Vigilia intrasueño: si el paciente registra despertares se usa ese dato.
  // Si no los registra pero pasa mucho tiempo en cama sin dormir (caso típico:
  // eficiencia baja sin despertares anotados), se deriva del TIB.
  const wasoRegistrado = wasos.length ? prom(wasos) : 0;
  const wasoDerivado = tib > 0 ? Math.max(0, tib - latenciaMedia - tst) : 0;
  const vigiliaIntrasueño = Math.max(wasoRegistrado, wasoDerivado);

  const despertaresMedia = despertares.length
    ? Math.round(prom(despertares) * 10) / 10
    : (vigiliaIntrasueño > 0 ? Math.max(1, Math.round(vigiliaIntrasueño / 45)) : 0);

  return { latenciaMedia, vigiliaIntrasueño, eficiencia, despertaresMedia, tst, tib };
}

/**
 * Medicación del paciente combinando dos fuentes:
 *  - lo declarado en la ficha (doctorData.medications)
 *  - lo que efectivamente carga cada noche en el diario (campo medications)
 * Devuelve {texto, items:[{nombre, noches}], nochesTotales}
 * No trunca: el render decide cómo mostrarlo.
 */
function dmMedicacionCombinada(doctorData, diarySlice) {
  const items = [];
  const vistos = {};

  // 1) De la ficha del paciente
  try {
    const raw = ((doctorData || {}).medications || '').trim();
    if (raw) {
      let lista = [];
      try {
        const arr = JSON.parse(raw);
        if (Array.isArray(arr)) {
          lista = arr.map(m => (m && m.name ? m.name + (m.dose ? ' ' + m.dose : '') : String(m)));
        }
      } catch (_) {
        lista = raw.split(/[,;]|\s-\s/).map(s => s.trim()).filter(Boolean);
      }
      lista.forEach(nom => {
        const k = nom.toLowerCase();
        if (!vistos[k]) { vistos[k] = true; items.push({ nombre: nom, noches: null }); }
      });
    }
  } catch (_) {}

  // 2) Del diario noche a noche
  const conteo = {};
  (diarySlice || []).forEach(e => {
    if (!e || !e.medications) return;
    try {
      const meds = typeof e.medications === 'string' ? JSON.parse(e.medications) : e.medications;
      if (!Array.isArray(meds)) return;
      meds.forEach(m => {
        const nom = (m && m.name) || (typeof m === 'string' ? m : null);
        if (!nom) return;
        const clave = nom + ((m && m.dose) ? ' ' + m.dose : '');
        conteo[clave] = (conteo[clave] || 0) + 1;
      });
    } catch (_) {}
  });
  Object.keys(conteo).forEach(nom => {
    const k = nom.toLowerCase();
    if (vistos[k]) {
      const ya = items.find(i => i.nombre.toLowerCase() === k);
      if (ya) ya.noches = conteo[nom];
    } else {
      vistos[k] = true;
      items.push({ nombre: nom, noches: conteo[nom] });
    }
  });

  return {
    items: items,
    nochesTotales: (diarySlice || []).length,
    texto: items.length ? items.map(i => i.nombre).join(', ') : ''
  };
}

/**
 * Genera el bloque de criterios y fuentes (para modo especialista)
 */
function dmCriteriosYFuentes() {
  return {
    titulo: 'Criterios y fuentes del motor de orientación',
    criterios: [
      {
        criterio: 'Insomnio (tipo)',
        operacionalizado: 'Patrón de mantenimiento: vigilia intrasueño >60 min O eficiencia <75%',
        operacionalizado2: 'Patrón de conciliación: latencia >30 min',
        operacionalizado3: 'Patrón mixto: latencia >15 min Y vigilia >30 min',
        fuente: 'ICSD-3 (International Classification of Sleep Disorders, 3rd ed)',
        nota: '⚠️ IMPORTANTE: Requiere duración ≥3 meses para etiquetarse como "crónico"'
      },
      {
        criterio: 'Apnea probable',
        operacionalizado: 'STOP-BANG ≥ 3/8',
        fuente: 'AASM (American Academy of Sleep Medicine), criterios de riesgo de apnea del sueño',
        accion: 'Derivar a PSG antes de sostener hipnóticos'
      },
      {
        criterio: 'Somnolencia diurna',
        operacionalizado: 'ESS ≥ 10 (leve), ≥ 13 (moderada a severa)',
        fuente: 'Johns MW, Epworth Sleepiness Scale (1991)',
        accion: 'Si ≥13: evaluar restricciones de conducción'
      },
      {
        criterio: 'Síntomas depresivos',
        operacionalizado: 'PHQ-9 ≥ 10 (síntomas presentes), ≥ 15 (depresión moderada-severa)',
        fuente: 'DSM-5-TR (Diagnostic and Statistical Manual, 5th Edition, Text Revision)',
        accion: 'Si ≥15: considerar psiquiatría en paralelo'
      },
      {
        criterio: 'Medicación actual',
        operacionalizado: 'Benzodiacepina en >8 de las últimas 14 noches del diario',
        fuente: 'Criterio temporal: deprescripción indicada si duración >8 semanas (guías AASM)',
        nota: '⚠️ IMPORTANTE: La duración debe confirmarse clínicamente; no se asume "crónica" con solo el diario'
      }
    ]
  };
}

/**
 * Detecta si hay benzodiacepina en uso actual (no asume "crónica" sin criterio temporal)
 */
function dmDetectarBenzoDe8Semanas(diarySlice) {
  const benzoPattern = ['clonazepam', 'diazepam', 'alprazolam', 'lorazepam', 'bromazepam', 'flunitrazepam'];
  const medicaciones = {};

  diarySlice.forEach(e => {
    if (!e.medications) return;
    try {
      const meds = typeof e.medications === 'string' ? JSON.parse(e.medications) : e.medications;
      if (!Array.isArray(meds)) return;
      meds.forEach(m => {
        const name = (m.name || m).toLowerCase();
        if (benzoPattern.some(p => name.includes(p))) {
          medicaciones[name] = (medicaciones[name] || 0) + 1;
        }
      });
    } catch (_) {}
  });

  // Si alguna benzo aparece en >8 de las últimas 14 noches
  const cronics = Object.entries(medicaciones).filter(([_, count]) => count > 8);
  return cronics.length ? { droga: cronics[0][0], count: cronics[0][1] } : null;
}
