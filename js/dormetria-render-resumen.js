/**
 * Resumen — usa las MISMAS clases y tokens que la pestaña Perfil:
 *   .dm-card          fondo #1d3a2b, borde 0.5px rgba(126,200,164,.14), radio --rxl
 *   .dm-card-title    11px / 700 / uppercase / #7EC8A4
 *   texto principal   #F4EFE5
 *   texto secundario  rgba(244,239,229,0.65)
 *   acento verde      #7EC8A4      acento dorado #C8A96E
 *
 * Importante: NO se envuelve todo en un div con fondo propio. Perfil escribe
 * las tarjetas directamente en el contenedor; hacerlo distinto era la razón
 * por la que Resumen "no se parecía" aunque los colores fueran los mismos.
 */

// Fila etiqueta/valor, igual que el helper kv() de Perfil.
function dmKv(label, val, primera) {
  return '<div style="display:flex;justify-content:space-between;gap:12px;padding:6px 0' +
    (primera ? '' : ';border-top:0.5px solid rgba(126,200,164,0.08)') + '">' +
    '<span style="font-size:13px;color:rgba(244,239,229,.84)">' + label + '</span>' +
    '<span style="font-size:13px;font-weight:500;color:#F4EFE5;text-align:right">' + val + '</span></div>';
}

function dmCardResumen(icon, titulo, cuerpo) {
  return '<div class="dm-card">' +
    '<div class="dm-card-title"><span style="font-size:14px">' + icon + '</span><span>' + titulo + '</span></div>' +
    cuerpo + '</div>';
}

function dmRenderSummaryResumen(motorResult, modo, email) {
  const o = motorResult.orientacion || {};
  const c = motorResult.conducta || {};
  const b = motorResult.banderas || [];
  const e = motorResult.evolucion || null;
  const med = motorResult.medicacion || { items: [], texto: '' };
  const met = motorResult.metricas || {};

  const paciente = S.viewData || {};

  let edad = null;
  try {
    if (paciente.dob) {
      edad = Math.floor((Date.now() - new Date(paciente.dob)) / 31557600000);
    }
  } catch (_) {}

  const bmi = (paciente.weight_kg && paciente.height_cm)
    ? (paciente.weight_kg / ((paciente.height_cm / 100) ** 2)).toFixed(1)
    : null;

  // ── Punto 3: "51 años · IMC 33.5" ──────────────────────────────────
  const edadImc = (edad != null ? edad + ' años' : '—') + (bmi ? ' · IMC ' + bmi : '');

  // ── Punto 4: medicación completa, sin "..." ────────────────────────
  let medHtml;
  if (med.items && med.items.length) {
    medHtml = med.items.map(function (i) {
      const noches = (i.noches != null)
        ? ' <span style="color:rgba(244,239,229,.72);font-size:11.5px">(' + i.noches + ' de ' + med.nochesTotales + ' noches)</span>'
        : '';
      return '<div style="font-size:13px;color:#F4EFE5;padding:4px 0;line-height:1.5">• ' + escHtml(i.nombre) + noches + '</div>';
    }).join('');
  } else {
    medHtml = '<div style="font-size:12.5px;color:rgba(244,239,229,.72);font-style:italic">Sin medicación registrada</div>';
  }

  // ── Toggle Generalista / Especialista ──────────────────────────────
  const toggle =
    '<div style="display:inline-flex;gap:2px;background:rgba(126,200,164,0.08);border:0.5px solid rgba(126,200,164,0.2);border-radius:999px;padding:3px;margin-bottom:16px">' +
      '<button id="dm-mode-gen" type="button" style="appearance:none;border:none;cursor:pointer;font-family:inherit;border-radius:999px;padding:7px 15px;font-size:12px;font-weight:700;' +
        'background:' + (modo === 'gen' ? 'rgba(126,200,164,0.22)' : 'transparent') + ';color:' + (modo === 'gen' ? '#7EC8A4' : 'rgba(244,239,229,0.6)') + '">Generalista</button>' +
      '<button id="dm-mode-esp" type="button" style="appearance:none;border:none;cursor:pointer;font-family:inherit;border-radius:999px;padding:7px 15px;font-size:12px;font-weight:700;' +
        'background:' + (modo === 'esp' ? 'rgba(126,200,164,0.22)' : 'transparent') + ';color:' + (modo === 'esp' ? '#7EC8A4' : 'rgba(244,239,229,0.6)') + '">Especialista</button>' +
    '</div>';

  // ── Punto 6: etiquetas clínicas (se rellena async desde el motor) ───
  const tarjetaTags = dmCardResumen('🏷️', 'Etiquetas clínicas',
    '<div id="drp-tags-card-body">' +
      '<div style="color:rgba(244,239,229,.72);font-style:italic;font-size:12px">Cargando…</div>' +
    '</div>');

  // ── Datos rápidos ──────────────────────────────────────────────────
  const tarjetaDatos = dmCardResumen('🆔', 'Datos',
    dmKv('Edad / IMC', edadImc, true) +
    '<div style="border-top:0.5px solid rgba(126,200,164,0.08);margin-top:6px;padding-top:8px">' +
      '<div style="font-size:11px;color:rgba(244,239,229,.76);margin-bottom:4px">Medicación</div>' +
      medHtml +
    '</div>');

  // ── Orientación (punto 2: texto legible) ───────────────────────────
  const banderasOrient = (o.banderas || []).map(function (f) {
    return '<div style="background:rgba(200,169,110,0.12);border:0.5px solid rgba(200,169,110,0.32);border-radius:12px;padding:12px 13px;margin-top:10px">' +
      '<div style="font-weight:700;color:#C8A96E;font-size:13.5px;line-height:1.4">' + (f.icono || '⚠️') + ' ' + escHtml(f.texto) + '</div>' +
      // Punto 5: este texto era 12px sobre #a09080 y no se leía. Ahora 13px
      // sobre rgba(244,239,229,0.78), que es el contraste que usa Perfil.
      '<div style="font-size:13px;color:rgba(244,239,229,.92);margin-top:5px;line-height:1.55">' + escHtml(f.detalles || '') + '</div>' +
    '</div>';
  }).join('');

  const preguntasHtml = (modo === 'esp' && (o.preguntas || []).length)
    ? '<div style="background:rgba(126,200,164,0.07);border-radius:12px;padding:12px 13px;margin-top:12px">' +
        '<div style="font-size:11px;font-weight:700;color:#7EC8A4;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:8px">Para confirmar en consulta</div>' +
        (o.preguntas || []).map(function (p) {
          return '<div style="margin-bottom:9px">' +
            '<div style="font-size:13px;color:#F4EFE5;font-weight:600;line-height:1.45">' + escHtml(p.texto) + '</div>' +
            '<div style="font-size:11.5px;color:rgba(244,239,229,.82);margin-top:2px;line-height:1.45">' + escHtml(p.criterio) + '</div>' +
          '</div>';
        }).join('') +
      '</div>'
    : '';

  const tarjetaOrientacion = dmCardResumen('🧭', 'Orientación clínica',
    '<div style="font-size:19px;font-weight:600;line-height:1.3;color:#F4EFE5;margin-bottom:8px">' +
      escHtml(o.texto || 'Evaluación pendiente') + '</div>' +
    // Punto 2: era 13px sobre #a09080. Ahora 14px sobre rgba(244,239,229,0.75).
    '<div style="font-size:14px;color:rgba(244,239,229,.92);line-height:1.6">' +
      escHtml(o.base || '') + '</div>' +
    banderasOrient + preguntasHtml);

  // ── Conducta sugerida ──────────────────────────────────────────────
  const maticesHtml = (modo === 'esp' && (c.matices || []).length)
    ? '<div style="border-top:0.5px solid rgba(126,200,164,0.08);margin-top:10px;padding-top:10px">' +
        '<div style="font-size:11px;color:rgba(244,239,229,.76);margin-bottom:6px">Matices</div>' +
        (c.matices || []).map(function (m) {
          return '<div style="font-size:13px;color:rgba(244,239,229,.97);line-height:1.55;margin-bottom:7px">→ ' + escHtml(m) + '</div>';
        }).join('') +
      '</div>'
    : '';

  // Cuando no hay base (pocos datos) o el sueño está dentro de rango, el motor
  // devuelve procede:false. En ese caso NO se muestra ni primera línea ni
  // fármaco ni el botón de iniciar: se dice por qué y qué haría falta.
  let tarjetaConducta;
  if (c.procede === false) {
    const faltanHtml = (c.faltan || []).length
      ? '<div style="background:rgba(200,169,110,0.10);border:0.5px solid rgba(200,169,110,0.28);border-radius:11px;padding:11px 13px;margin-top:11px">' +
          '<div style="font-size:11px;font-weight:700;color:#C8A96E;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:7px">Qué falta</div>' +
          (c.faltan || []).map(function (f) {
            return '<div style="font-size:12.5px;color:rgba(244,239,229,.88);line-height:1.55;margin-bottom:5px">• ' + escHtml(f) + '</div>';
          }).join('') +
        '</div>'
      : '';
    tarjetaConducta = dmCardResumen('🩺', 'Conducta sugerida',
      '<div style="font-size:15px;font-weight:600;color:#F4EFE5;line-height:1.35;margin-bottom:7px">' +
        escHtml(c.titulo || 'Sin conducta sugerida') + '</div>' +
      '<div style="font-size:13px;color:rgba(244,239,229,.86);line-height:1.6">' +
        escHtml(c.base || '') + '</div>' +
      faltanHtml);
  } else {
    tarjetaConducta = dmCardResumen('🩺', 'Conducta sugerida',
      dmKv('Primera línea', escHtml(c.primeraLinea || '—'), true) +
      dmKv('Fármaco', '<span style="color:#C8A96E">' + escHtml(c.farmaco || '—') + '</span>') +
      maticesHtml +
      '<div style="font-size:12px;color:rgba(244,239,229,.76);line-height:1.55;margin-top:10px">' + escHtml(c.base || '') + '</div>' +
      '<button type="button" style="width:100%;margin-top:12px;padding:11px;border:1px solid rgba(126,200,164,0.35);border-radius:9px;background:rgba(126,200,164,0.12);color:#7EC8A4;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit">' +
        escHtml((c.ctaTexto || 'Iniciar programa').replace('▶ ', '')) + '</button>');
  }

  // ── Banderas de seguridad (especialista) ───────────────────────────
  let tarjetaBanderas = '';
  if (modo === 'esp') {
    const filas = (b || []).length
      ? (b || []).map(function (f) {
          const crit = f.severidad === 'crit';
          const ok = f.severidad === 'ok';
          const color = crit ? '#E88' : ok ? '#7EC8A4' : '#C8A96E';
          const fondo = crit ? 'rgba(232,136,136,0.10)' : ok ? 'rgba(126,200,164,0.08)' : 'rgba(200,169,110,0.10)';
          const borde = crit ? 'rgba(232,136,136,0.30)' : ok ? 'rgba(126,200,164,0.22)' : 'rgba(200,169,110,0.28)';
          return '<div style="background:' + fondo + ';border:0.5px solid ' + borde + ';border-radius:12px;padding:11px 13px;margin-bottom:8px">' +
            '<div style="display:flex;justify-content:space-between;align-items:baseline;gap:10px">' +
              '<span style="font-size:13.5px;font-weight:700;color:' + color + '">' + escHtml(f.nombre) + '</span>' +
              '<span style="font-size:12px;font-weight:600;color:' + color + ';white-space:nowrap">' + escHtml(f.score || '') + '</span>' +
            '</div>' +
            (f.detalles ? '<div style="font-size:12.5px;color:rgba(244,239,229,.9);margin-top:5px;line-height:1.5">' + escHtml(f.detalles) + '</div>' : '') +
          '</div>';
        }).join('')
      : '<div style="font-size:12.5px;color:rgba(244,239,229,.72);font-style:italic">Sin banderas de alerta</div>';
    tarjetaBanderas = dmCardResumen('🚩', 'Banderas de seguridad', filas);
  }

  // ── Punto 9: evolución con las 4 métricas del demo ─────────────────
  let tarjetaEvolucion = '';
  if (modo === 'esp') {
    const celda = function (rotulo, valor, pie) {
      return '<div style="background:rgba(126,200,164,0.07);border:0.5px solid rgba(126,200,164,0.14);border-radius:12px;padding:11px 10px;text-align:center">' +
        '<div style="font-size:10.5px;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;color:rgba(244,239,229,.76);margin-bottom:6px">' + rotulo + '</div>' +
        '<div style="font-size:19px;font-weight:600;color:#F4EFE5;line-height:1.1">' + valor + '</div>' +
        (pie ? '<div style="font-size:11px;color:rgba(244,239,229,.76);margin-top:4px">' + pie + '</div>' : '') +
      '</div>';
    };

    const num = function (v, suf) {
      return (v == null || isNaN(v)) ? '—' : Math.round(v) + (suf || '');
    };

    const efPie = (e && e.anterior != null && !isNaN(e.anterior))
      ? (e.delta > 0 ? '▲ ' : e.delta < 0 ? '▼ ' : '') + Math.abs(e.delta || 0) + ' pts desde ' + Math.round(e.anterior)
      : '';

    const veredicto = e && e.veredicto ? e.veredicto : 'Sin datos suficientes';
    const colorVer = (e && e.delta >= 5) ? '#7EC8A4' : (e && e.delta <= -5) ? '#E88' : 'rgba(244,239,229,0.7)';

    tarjetaEvolucion = dmCardResumen('📈', 'Evolución en un vistazo',
      '<div style="display:inline-flex;align-items:center;gap:7px;background:rgba(126,200,164,0.08);border-radius:999px;padding:5px 12px;margin-bottom:12px">' +
        '<span style="width:7px;height:7px;border-radius:50%;background:' + colorVer + '"></span>' +
        '<span style="font-size:12.5px;font-weight:600;color:' + colorVer + '">' + escHtml(veredicto) + '</span>' +
      '</div>' +
      '<div style="display:grid;grid-template-columns:repeat(2,1fr);gap:8px">' +
        celda('Latencia', num(met.latenciaMedia, ' min'), met.latenciaMedia > 30 ? 'sobre umbral' : 'dentro de rango') +
        celda('Eficiencia', num(e ? e.actual : met.eficiencia, '%'), efPie) +
        celda('Despertares', (met.despertaresMedia == null || isNaN(met.despertaresMedia)) ? '—' : met.despertaresMedia + ' /noche', '') +
        celda('Adherencia', e ? num(e.adherencia, '%') : '—', motorResult.nochesRegistradas ? motorResult.nochesRegistradas + ' noches' : '') +
      '</div>');
  }

  // ── Cuestionarios (solo especialista) ──────────────────────────────
  // El Resumen es una vista de decisión: si entran las ocho escalas con su
  // histórico se vuelve una planilla. Acá va solo lo que cambia la conducta
  // —las que están fuera de rango— y un acceso al detalle completo.
  let tarjetaEscalas = '';
  if (modo === 'esp') {
    let filas = '';
    try {
      const recs = (typeof S !== 'undefined' && S.viewRecs) ? S.viewRecs : [];
      const ultimas = {};
      recs.forEach(function (r) {
        if (!ultimas[r.scale_id] || new Date(r.created_at) > new Date(ultimas[r.scale_id].created_at)) {
          ultimas[r.scale_id] = r;
        }
      });
      const lista = Object.values(ultimas).map(function (r) {
        const sc = (typeof SCALES !== 'undefined') ? SCALES.find(function (x) { return x.id === r.scale_id; }) : null;
        if (!sc) return null;
        const i = sc.interp(r.score) || {};
        const alterada = i.bg === '#fee2e2' || i.bg === '#fef2f2';
        return { nombre: sc.name, score: r.score, max: r.max_score || sc.max || null,
                 etiqueta: i.l || '', alterada: alterada, fecha: r.created_at };
      }).filter(Boolean)
        .sort(function (a, b) { return (b.alterada ? 1 : 0) - (a.alterada ? 1 : 0); });

      // Se muestran las alteradas; las normales se resumen en una línea, para
      // que se vea que fueron evaluadas sin ocupar la tarjeta entera.
      const alteradas = lista.filter(function (x) { return x.alterada; });
      const normales  = lista.filter(function (x) { return !x.alterada; });

      filas = alteradas.map(function (x) {
        const f = x.fecha ? new Date(x.fecha).toLocaleDateString('es-AR', { day: '2-digit', month: 'short' }) : '';
        return '<div style="display:flex;justify-content:space-between;align-items:baseline;gap:10px;padding:7px 0;border-top:0.5px solid rgba(126,200,164,0.08)">' +
          '<span style="font-size:13px;color:#F4EFE5;font-weight:600">' + escHtml(x.nombre) + '</span>' +
          '<span style="font-size:12.5px;color:#E88;font-weight:700;white-space:nowrap">' +
            x.score + (x.max ? '/' + x.max : '') + ' · ' + escHtml(x.etiqueta) +
            (f ? ' <span style="color:rgba(244,239,229,.72);font-weight:500">' + f + '</span>' : '') +
          '</span></div>';
      }).join('');

      if (normales.length) {
        filas += '<div style="font-size:12px;color:rgba(244,239,229,.78);line-height:1.5;padding-top:9px;' +
          (alteradas.length ? 'border-top:0.5px solid rgba(126,200,164,0.08);margin-top:4px' : '') + '">' +
          'Dentro de rango: ' + normales.map(function (x) { return escHtml(x.nombre); }).join(', ') + '.</div>';
      }
      if (!lista.length) {
        filas = '<div style="font-size:12.5px;color:rgba(244,239,229,.78);font-style:italic">Sin cuestionarios cargados.</div>';
      }
    } catch (err) {
      filas = '<div style="font-size:12.5px;color:rgba(244,239,229,.78);font-style:italic">No se pudieron leer los cuestionarios.</div>';
    }
    tarjetaEscalas = dmCardResumen('📊', 'Cuestionarios', filas);
  }

  // ── Material para el paciente ──────────────────────────────────────
  // Eran tres botones de ancho completo apilados: mucha superficie para tres
  // etiquetas cortas. Como chips que envuelven ocupan una fila o dos y se
  // leen igual.
  const btnMat = function (icono, texto) {
    return '<button type="button" style="text-align:left;padding:7px 11px;border:1px solid rgba(126,200,164,0.28);' +
      'border-radius:999px;background:rgba(126,200,164,0.07);color:#F4EFE5;font-size:12.5px;font-weight:600;' +
      'cursor:pointer;font-family:inherit;white-space:nowrap">' + icono + ' ' + texto + '</button>';
  };

  // Material general de psicoeducación. "Restricción de tiempo en cama" salió
  // de acá: es una técnica del módulo TCC-I, no algo para entregar suelto en
  // la consulta. En su lugar entran temas que aplican a cualquier paciente.
  const chipsMaterial =
    btnMat('📋', 'Higiene del sueño') +
    btnMat('📚', 'Entender el insomnio') +
    btnMat('📱', 'Impacto de las pantallas') +
    btnMat('☕', 'Cafeína y alcohol') +
    btnMat('🌡️', 'Sueño y menopausia') +
    btnMat('🧠', 'Sueño y ansiedad');

  // En especialista va como tarjeta en la columna derecha.
  const tarjetaMaterial = dmCardResumen('📎', 'Material para el paciente',
    '<div style="display:flex;flex-wrap:wrap;gap:7px">' + chipsMaterial + '</div>');

  // En generalista va como barra de punta a punta: el rótulo a la izquierda y
  // los chips fluyendo a la derecha. Ocupa una franja en vez de una tarjeta
  // alta, así se elige el material sin tener que bajar.
  const barraMaterial =
    '<div class="dm-card" style="display:flex;align-items:center;gap:14px;flex-wrap:wrap;margin-top:16px">' +
      '<div class="dm-card-title" style="margin:0;flex:0 0 auto;white-space:nowrap">' +
        '<span style="font-size:14px">📎</span><span>Material para el paciente</span></div>' +
      '<div style="display:flex;flex-wrap:wrap;gap:7px;flex:1 1 auto">' + chipsMaterial + '</div>' +
    '</div>';

  // ── Armado final ───────────────────────────────────────────────────
  // Etiquetas y Datos son dos tarjetas de contenido corto: apiladas a lo
  // ancho empujaban la orientación clínica —lo que el profesional viene a
  // leer— por debajo del pliegue. Van en una fila de dos columnas.
  const cabecera =
    '<div class="dm-resumen-head" style="display:grid;grid-template-columns:1fr 1fr;gap:14px;align-items:start">' +
      tarjetaTags + tarjetaDatos +
    '</div>';

  // En generalista eran tres tarjetas de ancho completo apiladas: en monitor
  // quedaban muy anchas para el texto que tienen y obligaban a bajar para ver
  // la conducta. Van en dos columnas, con más peso a la orientación, que es
  // lo que se lee primero.
  if (modo === 'gen') {
    return toggle + cabecera +
      '<div class="dm-resumen-cols" style="display:grid;grid-template-columns:1.35fr 1fr;gap:16px;align-items:start">' +
        '<div>' + tarjetaOrientacion + '</div>' +
        '<div>' + tarjetaConducta + '</div>' +
      '</div>' +
      barraMaterial;
  }
  return toggle + cabecera +
    '<div class="dm-resumen-cols" style="display:grid;grid-template-columns:1fr 1fr;gap:16px;align-items:start">' +
      '<div>' + tarjetaOrientacion + tarjetaConducta + '</div>' +
      '<div>' + tarjetaBanderas + tarjetaEscalas + tarjetaEvolucion + tarjetaMaterial + '</div>' +
    '</div>';
}
