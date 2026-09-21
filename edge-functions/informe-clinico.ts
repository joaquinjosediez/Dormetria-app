// ═══════════════════════════════════════════════════════════════════════
//  informe-clinico · Supabase Edge Function        (versión 4)
// ═══════════════════════════════════════════════════════════════════════
//
//  QUÉ CAMBIÓ RESPECTO DE LA VERSIÓN 3
//
//  La v3 terminaba la conversación con un mensaje del asistente que decía
//  solo "{", para que el modelo no pudiera arrancar con un preámbulo. Eso
//  se llama prefill y era válido con los modelos anteriores. claude-sonnet-5
//  lo rechaza con un 400:
//
//      This model does not support assistant message prefill.
//      The conversation must end with a user message.
//
//  Se saca ese mensaje. Lo que el prefill conseguía —que la respuesta
//  empiece en "{"— ahora se pide por escrito, y el parser tolera las dos
//  formas por si alguna vez vuelve a haber prefill.
//
//  QUÉ HACE
//  Recibe las métricas que Dormetria YA calculó y devuelve un informe
//  ESTRUCTURADO: secciones con tipo, ítems con estado. La app lo maqueta
//  igual en pantalla y en el PDF.
//
//  POR QUÉ ESTRUCTURA Y NO PROSA
//  Con texto corrido, cada informe salía con un formato distinto y el PDF
//  quedaba a merced de cómo hubiera redactado el modelo ese día. Con
//  secciones tipadas, el diseño lo pone la app y siempre se ve igual.
//
//  POR QUÉ NO MANDA LOS DATOS CRUDOS
//  Las métricas las calcula la app con criterios validados. Si el modelo
//  recalculara por su cuenta, el informe podría mostrar un número distinto
//  del que ve el paciente en pantalla. Acá el modelo redacta, no calcula.
//
//  DESPLIEGUE
//  Panel de Supabase → Edge Functions → informe-clinico → pegar y Deploy
//
//  SECRETOS
//  ANTHROPIC_API_KEY   (obligatorio)
//  ANTHROPIC_MODEL     (opcional, para fijar el modelo a mano)
// ═══════════════════════════════════════════════════════════════════════

// ── Qué modelo usar ────────────────────────────────────────────────────
// El nombre del modelo cambia con cada versión, y si queda fijo en el código
// un día deja de existir y todo falla con un mensaje que no dice nada.
// Se puede fijar con el secreto ANTHROPIC_MODEL; si no, se prueba el de
// referencia y, si no existe, se le pregunta a la API cuáles hay.
const MODELO_PREFERIDO = Deno.env.get('ANTHROPIC_MODEL') || 'claude-sonnet-5';

let _modeloCache: string | null = null;

async function elegirModelo(clave: string): Promise<{ modelo: string; disponibles?: string }> {
  if (_modeloCache) return { modelo: _modeloCache };
  try {
    const r = await fetch('https://api.anthropic.com/v1/models?limit=100', {
      headers: { 'x-api-key': clave, 'anthropic-version': '2023-06-01' }
    });
    if (!r.ok) return { modelo: MODELO_PREFERIDO };
    const lista = (await r.json())?.data || [];
    const ids: string[] = lista.map((m: any) => m.id).filter(Boolean);
    if (ids.includes(MODELO_PREFERIDO)) {
      _modeloCache = MODELO_PREFERIDO;
      return { modelo: MODELO_PREFERIDO };
    }
    // El preferido no está: se busca el Sonnet más nuevo que la cuenta tenga.
    // Los ids vienen ordenados del más reciente al más viejo.
    const sonnet = ids.find((x) => x.includes('sonnet'));
    const elegido = sonnet || ids[0] || MODELO_PREFERIDO;
    _modeloCache = elegido;
    console.log('Modelo elegido automáticamente:', elegido, '· disponibles:', ids.join(', '));
    return { modelo: elegido, disponibles: ids.join(', ') };
  } catch (e) {
    console.error('No se pudo listar modelos:', e);
    return { modelo: MODELO_PREFERIDO };
  }
}

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

const responder = (cuerpo: unknown, status = 200) =>
  new Response(JSON.stringify(cuerpo), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' }
  });

const ESQUEMA = `
Respondé ÚNICAMENTE con un objeto JSON válido, sin texto antes ni después,
sin bloques de código. Esta es la forma exacta:

{
  "titulo": "Nota de evolución",
  "subtitulo": "Registro del 01/08 al 19/08 · 14 noches válidas",
  "resumen": "Una o dos frases con lo esencial.",
  "secciones": [
    {
      "tipo": "datos",
      "titulo": "Parámetros del período",
      "items": [
        { "texto": "Eficiencia de sueño", "valor": "92%", "estado": "normal" }
      ]
    },
    {
      "tipo": "lista",
      "titulo": "Factores asociados",
      "items": [ { "texto": "...", "estado": "atencion" } ]
    },
    { "tipo": "texto", "titulo": "Impresión", "cuerpo": "Párrafo corrido." }
  ]
}

"estado" solo puede ser: "normal", "atencion" o "alterado". Es opcional.
"valor" es opcional.
Los tipos posibles son: "datos", "lista", "texto", "descartado", "hallazgos".
Máximo 8 ítems por sección. Máximo 5 secciones.
`;

// Esto reemplaza al prefill. Antes la respuesta venía empezada a la fuerza
// en "{"; ahora se pide, y el parser de abajo tolera que igual venga con
// algo alrededor.
const ARRANQUE = `
El primer carácter de tu respuesta tiene que ser "{" y el último "}".
Nada antes, nada después: ni saludo, ni "Aquí está el informe", ni
explicación de lo que vas a hacer, ni bloque de código con acentos graves.
`;

const CONSIGNAS: Record<string, string> = {
  evolucion: `Redactá una NOTA DE EVOLUCIÓN para la historia clínica.
Registro: técnico, telegráfico, para otro profesional.
Secciones sugeridas:
· "datos" con los parámetros del período y su estado.
· "lista" con los factores que alcanzaron significación.
· "texto" con la impresión y la conducta sugerida.
Menos de 250 palabras en total.`,

  interconsulta: `Redactá un INFORME DE INTERCONSULTA para un profesional que no
conoce al paciente. Tiene que ser autosuficiente: quien lo lee no ve la app.
Secciones sugeridas:
· "texto" con el motivo y la metodología (diario autoadministrado, N noches).
· "datos" con los hallazgos por dominio: cantidad, continuidad, regularidad.
· "lista" con los factores evaluados y su resultado.
· "texto" con la conclusión y la sugerencia.
Menos de 400 palabras en total.`,

  paciente: `Redactá un RESUMEN PARA EL PACIENTE, para que se lo lleve de la consulta.
Registro: segunda persona, vos. Cotidiano. Sin siglas sin explicar.
Secciones sugeridas:
· "hallazgos" con lo que está bien, marcado como "normal".
· "lista" con lo que conviene trabajar.
· "lista" con uno o dos cambios concretos para las próximas semanas.
Dos cambios que se sostengan valen más que ocho que se abandonan.
Menos de 200 palabras en total.`
};

const REGLAS = `
REGLAS QUE NO SE NEGOCIAN
· Usá EXCLUSIVAMENTE los números que están en los datos. No estimes, no
  redondees hacia donde suene mejor, no completes lo que falta.
· Si un dato no está, decilo. "No se registró" es información; inventarlo
  es un error clínico.
· Las asociaciones entre hábitos y sueño son observacionales, sobre las
  propias noches del paciente. No las presentes como causa.
· No diagnostiques. Podés decir que un patrón amerita evaluación; no que
  la persona tiene esa condición.
· Si las noches válidas son menos de 7, decilo en el resumen: con esa
  cantidad cualquier conclusión es preliminar.
· Español rioplatense. Vos, no tú.
`;

// El modelo ya no viene con la respuesta empezada, así que lo normal es que
// devuelva el objeto entero. Igual se toleran los otros casos: que lo
// envuelva en un bloque de código, que agregue una línea antes, o que
// vuelva a haber prefill algún día.
function sacarJSON(crudo: string) {
  const limpiar = (t: string) => {
    let s = String(t || '').trim();
    s = s.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
    const a = s.indexOf('{');
    const b = s.lastIndexOf('}');
    return (a >= 0 && b > a) ? s.slice(a, b + 1) : s;
  };
  // Primero tal cual viene, que ahora es el caso habitual. Después con la
  // llave adelante, por si el modelo la omitió o vuelve el prefill.
  for (const intento of [crudo, '{' + crudo]) {
    try { return JSON.parse(limpiar(intento)); } catch { /* sigue */ }
  }
  return null;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });

  const clave = Deno.env.get('ANTHROPIC_API_KEY');
  if (!clave) {
    return responder({
      error: 'Los informes no están configurados todavía.',
      detalle: 'Falta el secreto ANTHROPIC_API_KEY en Edge Functions → Secrets.'
    }, 500);
  }

  let tipo: string, datos: unknown, notas: string;
  try {
    const cuerpo = await req.json();
    tipo = cuerpo.tipo || 'evolucion';
    datos = cuerpo.datos;
    notas = cuerpo.notas || '';
  } catch {
    return responder({ error: 'Pedido mal formado.' }, 400);
  }

  if (!datos) return responder({ error: 'No llegaron los datos del paciente.' }, 400);
  if (!CONSIGNAS[tipo]) return responder({ error: 'Tipo de informe desconocido.' }, 400);

  // Un cinturón por si el cliente alguna vez manda de más: acá no tiene
  // que llegar nada que identifique a una persona.
  const comoTexto = JSON.stringify(datos);
  if (/@|"email"|"nombre"|"apellido"|"dni"|"telefono"/i.test(comoTexto)) {
    console.error('Se bloqueó un pedido con datos identificatorios');
    return responder({
      error: 'El pedido incluía datos personales y se bloqueó por seguridad.'
    }, 400);
  }

  const prompt =
    'Sos un médico especialista en medicina del sueño.\n\n' +
    CONSIGNAS[tipo] + '\n' + REGLAS + '\n' + ESQUEMA + '\n' + ARRANQUE +
    '\n\nDATOS DEL PACIENTE (anonimizados)\n' +
    JSON.stringify(datos, null, 2) +
    (notas ? '\n\nOBSERVACIONES DEL PROFESIONAL TRATANTE\n' + notas : '');

  const { modelo, disponibles } = await elegirModelo(clave);

  try {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': clave,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: modelo,
        max_tokens: 2000,
        messages: [
          { role: 'user', content: prompt }
          // NO va ningún { role: 'assistant' } acá. Eso es prefill y los
          // modelos nuevos lo rechazan con un 400. Lo que hacía —forzar el
          // arranque en "{"— ahora lo pide ARRANQUE, más arriba.
        ]
      })
    });

    const resp = await r.json();

    if (!r.ok) {
      const detalle = (resp?.error?.message || JSON.stringify(resp).slice(0, 300)) +
        ' · modelo usado: ' + modelo + (disponibles ? ' · disponibles: ' + disponibles : '');
      console.error('Anthropic respondió', r.status, detalle);
      const publico = r.status === 429
        ? 'Hay muchas consultas en este momento. Probá en unos minutos.'
        : r.status === 401 ? 'La clave de la IA no es válida.'
        : r.status === 404 ? 'El modelo configurado no está disponible en tu cuenta.'
        : r.status === 400 ? 'No se pudo generar el informe: es un problema de configuración, no de los datos del paciente.'
        : 'No se pudo generar el informe.';
      return responder({ error: publico, detalle }, r.status);
    }

    const crudo = (resp?.content || [])
      .filter((c: any) => c?.type === 'text')
      .map((c: any) => c.text)
      .join('')
      .trim();

    if (!crudo) {
      return responder({
        texto: '',
        detalle: 'La respuesta no trajo texto. stop_reason=' + (resp?.stop_reason || '?') +
          ' · bloques=' + JSON.stringify((resp?.content || []).map((c: any) => c?.type))
      });
    }

    const estructura = sacarJSON(crudo);
    if (!estructura) {
      console.error('No se pudo parsear el JSON:', crudo.slice(0, 300));
      return responder({ texto: crudo, estructura: null });
    }

    return responder({ estructura, texto: crudo });

  } catch (e) {
    console.error('Excepción:', e);
    return responder({
      error: 'No se pudo generar el informe en este momento.',
      detalle: String(e)
    }, 502);
  }
});
