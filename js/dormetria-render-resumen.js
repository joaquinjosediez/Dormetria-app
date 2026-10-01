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

  // ── Cronotipo (se rellena async: el MCTQ sale del diario) ──────────
  const tarjetaCrono = dmCardResumen('🌙', 'Cronotipo',
    '<div id="drp-crono-card-body">' +
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

  // ── TCC-I en curso ─────────────────────────────────────────────────
  // El progreso del programa autogestionado vive en el dispositivo del
  // paciente. Lo que llega acá es el resumen que él sincroniza en
  // patients.tcci_estado. Si la columna no existe todavía, o si el
  // paciente no abrió la app desde que se publicó, no hay tarjeta: es
  // preferible no mostrar nada a mostrar un "0%" que no es cierto.
  let tarjetaTcci = '';
  (function(){
    const t = paciente.tcci_estado;
    if (!t || !t.inicio) return;
    const total   = t.total_semanas || 7;
    const cerrada = t.ultima_cerrada || 0;
    const enCurso = Math.min(total, cerrada + 1);
    const pctSem  = Math.round(cerrada / total * 100);
    const dias    = Math.max(0, Math.floor((Date.now() - new Date(t.inicio).getTime()) / 86400000));
    const guiado  = t.modo === 'guiado';
    // Días desde la última señal. Un programa que no se toca hace tres
    // semanas no está "en la semana 3": está abandonado, y decirlo es más
    // útil que el porcentaje.
    const quieto  = t.actualizado
      ? Math.floor((Date.now() - new Date(t.actualizado).getTime()) / 86400000)
      : null;
    const frenado = quieto != null && quieto >= 14 && cerrada < total;
    const color   = cerrada >= total ? '#7EC8A4' : frenado ? '#C8A96E' : '#7EC8A4';

    const titulo = cerrada >= total
      ? 'Terminó el programa de TCC-I'
      : 'Arrancó la TCC-I' + (guiado ? ' (con acompañamiento)' : ' por su cuenta');

    const barras = [];
    for (let i = 1; i <= total; i++) {
      const hecha = i <= cerrada;
      const actual = i === enCurso && cerrada < total;
      barras.push('<div title="Semana ' + i + '" style="flex:1;height:7px;border-radius:3px;background:' +
        (hecha ? color : actual ? 'rgba(200,169,110,.45)' : 'rgba(244,239,229,.12)') + '"></div>');
    }

    tarjetaTcci = dmCardResumen('🌿', 'Programa TCC-I',
      '<div style="display:flex;align-items:baseline;justify-content:space-between;gap:12px;margin-bottom:9px">' +
        '<div style="font-size:15px;font-weight:600;color:#F4EFE5;line-height:1.3">' + titulo + '</div>' +
        '<div style="font-size:20px;font-weight:700;color:' + color + ';flex-shrink:0">' + pctSem + '%</div>' +
      '</div>' +
      '<div style="display:flex;gap:4px;margin-bottom:8px">' + barras.join('') + '</div>' +
      '<div style="font-size:12.5px;color:rgba(244,239,229,.86);line-height:1.55">' +
        (cerrada >= total
          ? 'Completó las ' + total + ' semanas. Empezó hace ' + dias + ' días.'
          : 'Va por la <b>semana ' + enCurso + ' de ' + total + '</b>. ' +
            'Cerró ' + cerrada + (cerrada === 1 ? ' semana' : ' semanas') + ' desde que empezó, hace ' + dias + ' días.') +
      '</div>' +
      (t.tareas_total
        ? '<div style="font-size:12px;color:rgba(244,239,229,.7);margin-top:5px">' +
            t.tareas_hechas + ' de ' + t.tareas_total + ' tareas marcadas</div>'
        : '') +
      (frenado
        ? '<div style="background:rgba(200,169,110,.12);border-left:3px solid #C8A96E;border-radius:0 8px 8px 0;' +
          'padding:9px 11px;margin-top:10px;font-size:12.5px;color:rgba(244,239,229,.95);line-height:1.5">' +
          'Sin movimiento hace ' + quieto + ' días. La adherencia a la TCC-I cae sobre todo en la semana de ' +
          'restricción del tiempo en cama: si se frenó ahí, conviene preguntarlo antes de dar el programa por perdido.</div>'
        : '') +
      '<div style="font-size:11px;color:rgba(244,239,229,.6);margin-top:9px;line-height:1.45">' +
        'Lo marca el paciente en su app. Se actualiza cuando abre el programa.</div>');
  })();

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
      // La fila "Fármaco" salió de acá. Ver el comentario en el motor: sugerir
      // una molécula para este paciente es conducir el cuidado clínico, no
      // informarlo. En su lugar va la referencia de la guía, que es lo que
      // el criterio 4 de ANMAT pide poder revisar.
      (c.referencia ? dmKv('Según', '<span style="color:#C8A96E">' + escHtml(c.referencia) + '</span>') : '') +
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
            // De cuándo es el puntaje. Una escala vieja no deja de ser un dato,
            // pero deja de ser el estado actual del paciente, y la bandera se
            // leía como si fuera de hoy.
            (function () {
              if (!f.fecha) return '';
              const d = new Date(f.fecha);
              if (isNaN(d)) return '';
              const dias = Math.floor((Date.now() - d) / 86400000);
              const txt = d.toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' });
              const viejo = dias >= 90;
              const cuanto = dias < 1 ? 'hoy'
                : dias < 30 ? ('hace ' + dias + ' d')
                : dias < 365 ? ('hace ' + Math.round(dias / 30) + ' meses')
                : ('hace ' + Math.floor(dias / 365) + ' año' + (dias >= 730 ? 's' : ''));
              return '<div style="font-size:11px;margin-top:3px;color:' +
                (viejo ? '#C8A96E' : 'rgba(244,239,229,.6)') + '">' +
                txt + ' · ' + cuanto +
                (viejo ? ' — conviene repetirla' : '') + '</div>';
            })() +
            (f.detalles ? '<div style="font-size:12.5px;color:rgba(244,239,229,.9);margin-top:5px;line-height:1.5">' + escHtml(f.detalles) + '</div>' : '') +
            // La base del umbral, con su cita. El criterio 4 de exclusión de
            // ANMAT pide que el usuario pueda "revisar de forma independiente
            // la base de las recomendaciones": sin la referencia a la vista,
            // el puntaje es un número que hay que creer.
            (f.umbral ? '<div style="font-size:11px;color:rgba(244,239,229,.55);margin-top:5px;line-height:1.4">' + escHtml(f.umbral) + '</div>' : '') +
          '</div>';
        }).join('')
      : '<div style="font-size:12.5px;color:rgba(244,239,229,.72);font-style:italic">Sin banderas de alerta</div>';
    tarjetaBanderas = dmCardResumen('🚩', 'Banderas de seguridad', filas);
  }

  // ── Punto 9: evolución con las 4 métricas del demo ─────────────────
  let tarjetaEvolucion = '';
  if (modo === 'esp') {
    // Compacto: las cifras en una sola fila, centradas. Antes eran cuatro
    // recuadros grandes en 2x2 y la tarjeta ocupaba media pantalla.
    // primera = sin divisor a la izquierda; si no queda una línea suelta
    // separando la celda del rótulo "Evolución".
    // Las cinco cifras van en grilla (.dm-evo-cifras), no en una fila flex:
    // en un telefono cada celda quedaba en ~70px y "TIEMPO DE SUEÑO" salia
    // partido en tres renglones. El separador lo pone el CSS, que sabe cual
    // es la primera de cada fila; con border-left por celda quedaba una
    // linea colgando al envolver.
    const celda = function (rotulo, valor, pie) {
      return '<div class="dm-evo-celda">' +
        '<div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.04em;color:rgba(244,239,229,.76);line-height:1.3">' + rotulo + '</div>' +
        '<div style="font-size:17px;font-weight:600;color:#F4EFE5;line-height:1.2;margin-top:3px;white-space:nowrap">' + valor + '</div>' +
        (pie ? '<div style="font-size:10.5px;color:rgba(244,239,229,.72);margin-top:2px;line-height:1.3">' + pie + '</div>' : '') +
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

    // Noches de registro: el total cargado por el paciente, y debajo cuántas
    // entraron en el cálculo. Es lo que resolvía la discrepancia con Diario.
    const totalNoches = motorResult.nochesTotalesDiario;
    const usadas = motorResult.nochesRegistradas;
    // El rótulo decía "Últimas 14 de 24" sin explicar qué pasó con las otras
    // diez, y con una noche descartada por falta de horarios la cuenta no
    // cerraba contra la pestaña Diario. Ahora dice el período y lo descartado.
    const descartadas = motorResult.nochesDescartadas;
    const fmtF = function (f) {
      if (!f) return '';
      const p = String(f).slice(0, 10).split('-');
      return p.length === 3 ? (p[2] + '-' + p[1]) : String(f);
    };
    let muestraTxt = (usadas != null) ? (usadas + ' noches analizadas') : 'Sin noches registradas';
    if (usadas != null && motorResult.ventanaDesde && motorResult.ventanaHasta) {
      muestraTxt += ' · ' + fmtF(motorResult.ventanaDesde) + ' a ' + fmtF(motorResult.ventanaHasta);
    }
    if (usadas != null && totalNoches != null && totalNoches > usadas) {
      muestraTxt += ' (de ' + totalNoches + ' cargadas';
      muestraTxt += (descartadas > 0)
        ? '; ' + descartadas + ' sin horarios, fuera del cálculo)'
        : ')';
    }

    tarjetaEvolucion =
      '<div class="dm-card" style="padding:12px 14px">' +
        '<div style="display:flex;align-items:center;gap:14px;flex-wrap:wrap">' +
          // Rótulo y veredicto, uno debajo del otro.
          '<div style="flex:0 0 auto;min-width:0">' +
            '<div style="display:flex;align-items:center;gap:7px">' +
              '<span style="font-size:14px">📈</span>' +
              '<span style="font-size:11.5px;font-weight:700;text-transform:uppercase;letter-spacing:0.055em;color:#8FD4B0;white-space:nowrap">Evolución</span>' +
            '</div>' +
            // La muestra va acá y no como una cifra más: cuántas noches hay no
            // es una medición del sueño, es de qué tamaño es la base. Puesta
            // junto a Latencia y Eficiencia competía con lo que sí importa.
            '<div style="font-size:11px;color:rgba(244,239,229,.76);margin-top:2px;white-space:nowrap">' +
              muestraTxt + '</div>' +
            '<div style="display:flex;align-items:center;gap:6px;margin-top:3px">' +
              '<span style="width:7px;height:7px;border-radius:50%;background:' + colorVer + ';flex:0 0 auto"></span>' +
              '<span style="font-size:12px;font-weight:600;color:' + colorVer + ';white-space:nowrap">' + escHtml(veredicto) + '</span>' +
              '<span style="font-size:10.5px;color:rgba(244,239,229,.55);white-space:nowrap">· 14 vs 14 noches</span>' +
            '</div>' +
          '</div>' +
          // flex-basis 320px obligaba a la grilla a arrancar ancha y la
          // última celda se caía a un segundo renglón. Con 0 la grilla usa
          // el espacio que hay y entra todo en una fila.
          '<div class="dm-evo-cifras" style="flex:1 1 0;min-width:0">' +
            (function(){
              const hhmm = function(v){
                return (v==null || isNaN(v)) ? '—'
                  : (Math.floor(v/60) + 'h ' + String(Math.round(v%60)).padStart(2,'0') + 'm');
              };
              // Edad del paciente: define qué tres cifras se muestran.
              let _edad = null;
              try{
                const d = paciente.dob ? new Date(paciente.dob) : null;
                if(d && !isNaN(d)) _edad = Math.floor((Date.now()-d.getTime())/31557600000);
              }catch(_){}
              if(_edad != null && _edad < 13 && met.tst24 != null){
                // Pediátrico: nocturno, diurno y total. El total es el que
                // se compara contra el rango de la NSF y el que alimenta el
                // puntaje de cantidad — así que tiene que estar a la vista,
                // no deducirse de otras dos celdas.
                const _diurno = Math.max(0, met.tst24 - (met.tst||0));
                return celda('Sueño nocturno', hhmm(met.tst), 'de acostarse a despertarse') +
                       celda('Sueño diurno', _diurno ? hhmm(_diurno) : '—',
                             met.siestaFrecPct != null
                               ? ('siestas · ' + met.siestaFrecPct + '% de los días')
                               : 'siestas') +
                       celda('Total en 24 h', hhmm(met.tst24), 'contra el rango de la NSF');
              }
              return celda('Tiempo de sueño', hhmm(met.tst),
                  (met.tst24 != null && met.tst != null && met.tst24 > met.tst)
                    ? ('nocturno · ' + hhmm(met.tst24) + ' en 24 h')
                    : 'nocturno');
            })() +
            celda('Latencia', num(met.latenciaMedia, ' min'), met.latenciaMedia > 30 ? 'sobre umbral' : 'en rango') +
            // Una sola fuente. Antes esta celda mostraba e.actual —la
            // eficiencia de la ventana de la evolución— mientras las otras
            // cuatro celdas y la orientación clínica mostraban met.*. Con
            // ventanas distintas eso daba 83% acá y 87% tres centímetros
            // más abajo. El delta del pie sigue siendo contra las 14
            // anteriores, que es su trabajo.
            celda('Eficiencia', num(met.eficiencia, '%'), efPie) +
            celda('Despertares', (met.despertaresMedia == null || isNaN(met.despertaresMedia)) ? '—' : String(met.despertaresMedia), 'por noche') +
            // Siestas. El tiempo de sueño de la izquierda es NOCTURNO; esto va
            // aparte a proposito, y el pie dice el total en 24 h cuando se
            // puede calcular. Mezclarlos en una sola cifra esconde justo lo
            // que hay que ver en un insomnio.
            (function(){
              let _e2 = null;
              try{
                const d = paciente.dob ? new Date(paciente.dob) : null;
                if(d && !isNaN(d)) _e2 = Math.floor((Date.now()-d.getTime())/31557600000);
              }catch(_){}
              // En pediatría la siesta ya está arriba, como "Sueño diurno".
              if(_e2 != null && _e2 < 13 && met.tst24 != null) return '';
              return celda('Siestas',
              (met.siestaFrecPct == null)
                ? '—'
                : (met.siestaNoches === 0
                    ? 'No'
                    : met.siestaFrecPct + '%'),
              (met.siestaFrecPct == null)
                ? 'sin dato'
                : (met.siestaNoches === 0
                    ? 'ningun dia'
                    : (met.siestaMediaMin + ' min' +
                       (met.siestaCantMedia > 1.4 ? ' · ' + met.siestaCantMedia + '/dia' : ''))));
            })() +
            celda('Adherencia', e ? num(e.adherencia, '%') : '—', '') +
          '</div>' +
        '</div>' +
      '</div>';
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
                 etiqueta: i.l || '', alterada: alterada, fecha: r.created_at, id: r.id };
      }).filter(Boolean)
        .sort(function (a, b) { return (b.alterada ? 1 : 0) - (a.alterada ? 1 : 0); });

      // Se muestran las alteradas; las normales se resumen en una línea, para
      // que se vea que fueron evaluadas sin ocupar la tarjeta entera.
      const alteradas = lista.filter(function (x) { return x.alterada; });
      const normales  = lista.filter(function (x) { return !x.alterada; });

      filas = alteradas.map(function (x) {
        const f = x.fecha ? new Date(x.fecha).toLocaleDateString('es-AR', { day: '2-digit', month: 'short' }) : '';
        // Clicable: abre las respuestas del cuestionario sin salir del Resumen.
        return '<div onclick="showDrEvalAnswersById(\'' + x.id + '\')" style="display:flex;justify-content:space-between;align-items:baseline;gap:10px;padding:7px 0;border-top:0.5px solid rgba(126,200,164,0.08);cursor:pointer">' +
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

  // ── Criterios y fuentes (solo especialista) ────────────────────────
  // Va plegado: no estorba la lectura, pero permite auditar de dónde sale
  // cada umbral sin salir de la ficha.
  let tarjetaCriterios = '';
  if (modo === 'esp' && typeof dmCriteriosYFuentes === 'function') {
    try {
      const cf = dmCriteriosYFuentes();
      const items = (cf.criterios || []).map(function (c) {
        return '<div style="padding:11px 0;border-top:0.5px solid rgba(126,200,164,0.10)">' +
          '<div style="font-size:13px;font-weight:700;color:#F4EFE5;line-height:1.4">' + escHtml(c.criterio) + '</div>' +
          '<div style="font-size:12.5px;color:rgba(244,239,229,.9);line-height:1.55;margin-top:4px">' + escHtml(c.operacionalizado || '') + '</div>' +
          (c.fuente ? '<div style="font-size:12px;color:#7EC8A4;line-height:1.55;margin-top:5px">' + escHtml(c.fuente) + '</div>' : '') +
          (c.accion ? '<div style="font-size:12px;color:rgba(244,239,229,.82);line-height:1.55;margin-top:4px">→ ' + escHtml(c.accion) + '</div>' : '') +
          (c.nota ? '<div style="font-size:12px;color:#C8A96E;line-height:1.55;margin-top:5px">' + escHtml(c.nota) + '</div>' : '') +
        '</div>';
      }).join('');

      tarjetaCriterios =
        '<details class="dm-card" style="padding:0">' +
          '<summary style="list-style:none;cursor:pointer;padding:14px 16px;display:flex;align-items:center;justify-content:space-between;gap:10px">' +
            '<span style="margin:0;display:flex;align-items:center;gap:8px;font-size:11.5px;font-weight:700;' +
              'text-transform:uppercase;letter-spacing:0.055em;color:#8FD4B0">' +
              '<span style="font-size:14px">📐</span><span>' + escHtml(cf.titulo || 'Criterios y fuentes') + '</span></span>' +
            '<span style="color:#7EC8A4;font-size:15px">▾</span>' +
          '</summary>' +
          '<div style="padding:0 16px 14px">' +
            '<div style="font-size:12.5px;color:rgba(244,239,229,.86);line-height:1.6;margin-bottom:2px">' + escHtml(cf.intro || '') + '</div>' +
            items +
          '</div>' +
        '</details>';
    } catch (_) {}
  }

  // ── Material para el paciente ──────────────────────────────────────
  // Eran tres botones de ancho completo apilados: mucha superficie para tres
  // etiquetas cortas. Como chips que envuelven ocupan una fila o dos y se
  // leen igual.
  // Estos chips eran <button type="button"> SIN onclick: decoración pura.
  // Y encima con etiquetas escritas a mano ("Sueño y ansiedad") que no se
  // corresponden con ningún tema real de la biblioteca. Se veían como
  // botones, no eran botones.
  //
  // Ahora salen de PATIENT_EDU_TOPICS y asignan de verdad. El estado
  // (asignado / leído) se pinta después, con una pasada asíncrona: el
  // resumen se arma sincrónico y no puede esperar a la base.
  const btnMat = function (t) {
    return '<button type="button" class="dm-mat-chip" data-topic="' + t.id + '" ' +
      'onclick="dmMatToggle(\'' + t.id + '\',this)" title="' + String(t.title).replace(/"/g,'&quot;') + '">' +
      '<span class="dm-mat-ic">' + (t.icon || '📖') + '</span>' +
      '<span class="dm-mat-tx">' + t.title + '</span>' +
      '<span class="dm-mat-st"></span></button>';
  };

  // Solo los que le corresponden a ESTE paciente. El listado completo está
  // en la pestaña Material, que es donde se decide con calma; acá la barra
  // es para acercarle algo sin salir del resumen.
  const _temasMat = (function () {
    try {
      if (typeof PATIENT_EDU_TOPICS === 'undefined') return [];
      const perf = {
        sexo: paciente.sex || paciente.gender || '',
        edad: (function () {
          try { const d = paciente.dob ? new Date(paciente.dob) : null;
                return d && !isNaN(d) ? Math.floor((Date.now() - d.getTime()) / 31557600000) : null;
          } catch (_) { return null; }
        })(),
        ocupacional: true
      };
      return PATIENT_EDU_TOPICS.filter(function (t) {
        try { return typeof dmEduAplica === 'function' ? dmEduAplica(t, perf) : true; }
        catch (_) { return true; }
      });
    } catch (_) { return []; }
  })();

  const chipsMaterial = _temasMat.length
    ? _temasMat.map(btnMat).join('')
    : '<span style="font-size:12.5px;color:rgba(244,239,229,.6)">No hay temas cargados.</span>';

  // Se pinta el estado cuando el HTML ya está en pantalla. setTimeout(0)
  // alcanza: el que llama inserta el string inmediatamente después.
  if (_temasMat.length) {
    try { setTimeout(function () { dmMatPintarEstado(email); }, 0); } catch (_) {}
  }

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
    '<div class="dm-resumen-head" style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:14px;align-items:start">' +
      tarjetaTags + tarjetaDatos + tarjetaCrono +
    '</div>';

  // En generalista eran tres tarjetas de ancho completo apiladas: en monitor
  // quedaban muy anchas para el texto que tienen y obligaban a bajar para ver
  // la conducta. Van en dos columnas, con más peso a la orientación, que es
  // lo que se lee primero.
  if (modo === 'gen') {
    return toggle + cabecera +
      '<div class="dm-resumen-cols" style="display:grid;grid-template-columns:1.35fr 1fr;gap:16px;align-items:start">' +
        '<div>' + tarjetaOrientacion + '</div>' +
        '<div>' + tarjetaTcci + tarjetaConducta + '</div>' +
      '</div>' +
      barraMaterial;
  }
  // "Evolución en un vistazo" va a lo ancho, justo debajo de la cabecera: son
  // cuatro cifras en fila y dentro de una columna quedaban apretadas.
  return toggle + cabecera + tarjetaEvolucion +
    '<div class="dm-resumen-cols" style="display:grid;grid-template-columns:1fr 1fr;gap:16px;align-items:start">' +
      '<div>' + tarjetaOrientacion + tarjetaTcci + tarjetaConducta + '</div>' +
      '<div>' + tarjetaBanderas + tarjetaEscalas + '</div>' +
    '</div>' +
    // Material y Criterios van a lo ancho, abajo de todo: los dos son material
    // de consulta, no parte de la lectura clínica. Además la barra de chips se
    // lee mejor a lo ancho que apretada en media columna.
    barraMaterial + tarjetaCriterios;
}
