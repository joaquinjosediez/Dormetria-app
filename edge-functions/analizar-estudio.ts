// ═══════════════════════════════════════════════════════════════════════
//  analizar-estudio · Supabase Edge Function          (versión 2 · mod293)
// ═══════════════════════════════════════════════════════════════════════
//
//  ESTE ARCHIVO NO SE PUBLICA CON git push.
//
//  Vive en Supabase, no en GitHub Pages. Para que un cambio de acá tenga
//  efecto hay que pegarlo a mano:
//
//      ./herramientas/copiar-edge.sh analizar-estudio
//
//      supabase.com → proyecto Dormetria → Edge Functions
//      → analizar-estudio → Code → seleccionar todo → pegar → Deploy
//
//  ⚠️ ESTA VERSIÓN REEMPLAZA A LA QUE ESTÁ DESPLEGADA, Y NO PUDE VERLA.
//  La función anterior se escribió directamente en el panel de Supabase y
//  nunca estuvo en el repositorio, así que no sé si tenía algo que acá no
//  está. Antes de pegar: abrí la que está, copiá su código a un archivo
//  aparte, y recién después pegá ésta. Si algo faltaba, se repone mirando
//  esa copia.
//
//  QUÉ CAMBIA EN LA v2
//
//  Acepta FOTOS además de PDF. El botón 🤖 IA aparecía sólo en los PDF
//  porque la función sólo sabía armar un bloque `document`; una foto de
//  una polisomnografía —que es lo que la mayoría de los pacientes tiene—
//  no se podía analizar.
//
//  Ahora mira el tipo del archivo y arma el bloque que corresponde:
//
//      application/pdf          → { type: 'document' }
//      image/jpeg · png · webp  → { type: 'image' }
//
//  Y cuando lo que llega es una foto, se lo dice al modelo. No es un
//  detalle de redacción: leer un número de una tabla impresa, fotografiada
//  con reflejos y en diagonal, es una tarea con error, y un IAH mal leído
//  en una polisomnografía es peor que un IAH faltante. La consigna le pide
//  explícitamente que marque lo que no se lee con certeza en vez de
//  estimarlo, y la respuesta vuelve con `fuente` para que la app pueda
//  decir de dónde salió.
//
//  COMPATIBILIDAD HACIA ATRÁS
//
//  La app manda `pdf` (como siempre) y además `archivo:{datos,tipo}`. Si
//  alguien despliega una versión vieja, los PDF siguen andando. Y esta
//  versión acepta las dos formas, así que tampoco rompe si la app queda
//  atrasada.
//
//  SECRETOS
//      ANTHROPIC_API_KEY   (obligatorio)
//      ANTHROPIC_MODEL     (opcional, para fijar el modelo a mano)
// ═══════════════════════════════════════════════════════════════════════

// ── Qué modelo usar ────────────────────────────────────────────────────
// Misma lógica que informe-clinico: el nombre del modelo cambia con cada
// versión, y si queda fijo en el código un día deja de existir y todo
// falla con un mensaje que no dice nada.
const MODELO_PREFERIDO = Deno.env.get('ANTHROPIC_MODEL') || 'claude-sonnet-5';

let _modeloCache: string | null = null;

async function elegirModelo(clave: string): Promise<string> {
  if (_modeloCache) return _modeloCache;
  try {
    const r = await fetch('https://api.anthropic.com/v1/models?limit=100', {
      headers: { 'x-api-key': clave, 'anthropic-version': '2023-06-01' }
    });
    if (!r.ok) return MODELO_PREFERIDO;
    const ids: string[] = ((await r.json())?.data || []).map((m: any) => m.id).filter(Boolean);
    if (ids.includes(MODELO_PREFERIDO)) { _modeloCache = MODELO_PREFERIDO; return MODELO_PREFERIDO; }
    const elegido = ids.find((x) => x.includes('sonnet')) || ids[0] || MODELO_PREFERIDO;
    _modeloCache = elegido;
    console.log('Modelo elegido automáticamente:', elegido);
    return elegido;
  } catch (e) {
    console.error('No se pudo listar modelos:', e);
    return MODELO_PREFERIDO;
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

// Tipos de imagen que la API acepta. Un HEIC no entra: la app ya lo
// convierte a JPEG antes de guardarlo, pero un registro viejo podría
// tenerlo y conviene decirlo con claridad en vez de fallar con un 400.
const IMAGENES_OK = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

// ── Qué bloque mandar según lo que llegó ───────────────────────────────
function armarBloque(datos: string, tipo: string): { bloque: any; fuente: string } | { error: string } {
  const t = String(tipo || '').toLowerCase().split(';')[0].trim();
  if (t === 'application/pdf' || t === 'pdf' || !t) {
    return {
      bloque: { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: datos } },
      fuente: 'pdf'
    };
  }
  if (IMAGENES_OK.includes(t)) {
    return {
      bloque: { type: 'image', source: { type: 'base64', media_type: t, data: datos } },
      fuente: 'foto'
    };
  }
  if (t.startsWith('image/')) {
    return { error: 'Ese formato de imagen (' + t + ') no se puede analizar. ' +
                    'Volvé a cargar el estudio: la app lo convierte a JPG al subirlo.' };
  }
  return { error: 'No sé leer un archivo de tipo ' + t + '. Subí el estudio como PDF o como foto.' };
}

const AVISO_FOTO = `
IMPORTANTE SOBRE LA FUENTE: lo que estás viendo es una FOTOGRAFÍA de un
informe en papel, no un PDF con texto. Leer un número de una tabla impresa,
fotografiada con reflejos, sombra o en diagonal, es una tarea con error.

Por eso:
· Si un valor no se lee con certeza, escribí "no legible" y NO lo estimes.
  Un IAH mal leído en una polisomnografía es peor que un IAH faltante.
· Si falta una página o la foto corta una tabla, decilo.
· No completes con lo que "suele" traer ese tipo de estudio. Sólo lo que
  se ve.
`.trim();

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });

  const clave = Deno.env.get('ANTHROPIC_API_KEY');
  if (!clave) return responder({ error: 'Falta el secreto ANTHROPIC_API_KEY en la función.' }, 500);

  let cuerpo: any = {};
  try { cuerpo = await req.json(); }
  catch { return responder({ error: 'El pedido no trae un JSON válido.' }, 400); }

  // Las dos formas: la nueva (archivo) y la vieja (pdf).
  const datos = String(cuerpo?.archivo?.datos || cuerpo?.pdf || '').trim();
  const tipo = String(cuerpo?.archivo?.tipo || 'application/pdf');
  if (!datos) return responder({ error: 'No llegó ningún archivo para analizar.' }, 400);

  const armado = armarBloque(datos, tipo);
  if ('error' in armado) return responder({ error: armado.error }, 400);

  const contexto = String(cuerpo?.contexto || 'Analizá este estudio clínico de sueño.');
  const esFoto = armado.fuente === 'foto';

  const modelo = await elegirModelo(clave);

  const pedir = async (maxTokens: number) => fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': clave,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json'
    },
    body: JSON.stringify({
      model: modelo,
      max_tokens: maxTokens,
      messages: [{
        role: 'user',
        content: [
          armado.bloque,
          { type: 'text', text: contexto + (esFoto ? '\n\n' + AVISO_FOTO : '') }
        ]
      }]
    })
  });

  try {
    // Mismo criterio que informe-clinico: se pide amplio y, si el modelo
    // rechaza ese max_tokens, se reintenta con uno chico. No es un
    // presupuesto, se paga por lo que se usa.
    let r = await pedir(16000);
    if (r.status === 400) {
      const d = await r.clone().json().catch(() => ({}));
      console.warn('Reintento con max_tokens menor:', d?.error?.message || r.status);
      r = await pedir(8000);
    }

    if (!r.ok) {
      const d = await r.json().catch(() => ({}));
      const msg = d?.error?.message || ('Error ' + r.status);
      console.error('Anthropic:', r.status, msg);
      return responder({ error: 'La IA no pudo leer el estudio.', detalle: msg }, 502);
    }

    const d = await r.json();
    const texto = (d?.content || [])
      .filter((b: any) => b?.type === 'text')
      .map((b: any) => b.text)
      .join('\n')
      .trim();

    if (!texto) {
      return responder({
        error: 'La IA respondió sin texto.',
        detalle: 'stop_reason=' + (d?.stop_reason || '?')
      }, 502);
    }

    // `estructura` se devuelve sólo si el modelo contestó un JSON. La app
    // ya sabe mostrar las dos formas (dmRenderIA(estr, text)), así que no
    // se fuerza: un análisis libre no tiene por qué ser JSON.
    let estructura: unknown = null;
    const limpio = texto.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '').trim();
    if (limpio.startsWith('{')) {
      try { estructura = JSON.parse(limpio); } catch { estructura = null; }
    }

    return responder({
      texto,
      estructura,
      // De dónde salió el análisis. La app lo usa para avisar que un
      // informe leído de una foto hay que contrastarlo con el original.
      fuente: armado.fuente,
      cortado: d?.stop_reason === 'max_tokens'
    });
  } catch (e) {
    console.error('analizar-estudio:', e);
    return responder({ error: 'No se pudo analizar el estudio.', detalle: String(e?.message || e) }, 500);
  }
});
