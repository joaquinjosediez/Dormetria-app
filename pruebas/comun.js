// ═══════════════════════════════════════════════════════════════════════
//  Lo que comparten todas las pruebas
// ═══════════════════════════════════════════════════════════════════════
//
//  Antes cada prueba repetía las mismas 20 líneas para arrancar la app, y
//  una de ellas se quedó vieja sin que nadie lo notara: buscaba el CSS por
//  el número de versión exacto, así que al pasar de mod161 a mod162 dejó de
//  cargarlo y empezó a dar por buenas cosas que no había mirado.
//  Con el arranque en un solo lugar eso no puede volver a pasar.
//
//  Nada de esto toca la app: solo la lee.

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const RAIZ = path.join(__dirname, '..');

const RUTAS = {
  html:     path.join(RAIZ, 'index.html'),
  css:      path.join(RAIZ, 'css', 'styles.css'),
  metricas: path.join(RAIZ, 'js', 'dormetria-sleep-metrics.js')
};

const leerHtml = () => fs.readFileSync(RUTAS.html, 'utf8');
const leerCss  = () => fs.readFileSync(RUTAS.css, 'utf8');

// La versión que declara el archivo. Sirve para que los mensajes digan
// sobre QUÉ se corrió la prueba.
function version(html) {
  const m = (html || leerHtml()).match(/hoy79-mod\d+/);
  return m ? m[0] : '(sin versión)';
}

// Los <script> escritos dentro del index, en orden, más el archivo de
// métricas que se carga aparte. Sin ese último, funciones como isPediatric
// no existen y el fallo parece del index cuando no lo es.
function bloques() {
  const html = leerHtml();
  const b = [...html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi)].map(m => m[1]);
  try { b.unshift(fs.readFileSync(RUTAS.metricas, 'utf8')); }
  catch (e) { console.log('(aviso: no encontré ' + RUTAS.metricas + ')'); }
  return b;
}

// ── Un navegador de mentira ────────────────────────────────────────────
// Alcanza para que el código corra de punta a punta. Cuando una prueba
// necesita un DOM de verdad (medir, hacer clic, mirar lo que se dibujó) se
// le enchufa jsdom después, con conDom().
const noop = () => {};
function elemento() {
  return {
    style: { cssText: '', setProperty: noop }, dataset: {},
    classList: { add: noop, remove: noop, toggle: noop, contains: () => false },
    children: [], childNodes: [], innerHTML: '', outerHTML: '', textContent: '',
    value: '', checked: false,
    appendChild: x => x, removeChild: noop, remove: noop,
    setAttribute: noop, getAttribute: () => null,
    addEventListener: noop, removeEventListener: noop,
    querySelector: () => elemento(), querySelectorAll: () => [],
    closest: () => null, focus: noop, click: noop, insertAdjacentHTML: noop,
    getContext: () => ({}), parentElement: null, nextElementSibling: null,
    scrollIntoView: noop
  };
}

function navegadorFalso() {
  const almacen = {};
  const doc = {
    getElementById: () => elemento(), querySelector: () => elemento(),
    querySelectorAll: () => [], createElement: () => elemento(),
    createTextNode: () => elemento(), addEventListener: noop,
    body: elemento(), head: elemento(), documentElement: elemento(),
    readyState: 'complete', cookie: '', title: '', hidden: false,
    visibilityState: 'visible'
  };
  const ctx = {
    document: doc, console, window: null,
    navigator: { userAgent: 'node', language: 'es-AR', onLine: true,
                 serviceWorker: { register: () => Promise.resolve() } },
    location: { href: 'https://app.dormetria.com/', search: '', hash: '',
                hostname: 'app.dormetria.com', pathname: '/',
                origin: 'https://app.dormetria.com', reload: noop, replace: noop },
    localStorage: {
      getItem: k => (k in almacen ? almacen[k] : null),
      setItem: (k, v) => { almacen[k] = String(v); },
      removeItem: k => { delete almacen[k]; }, clear: () => {}
    },
    sessionStorage: { getItem: () => null, setItem: noop, removeItem: noop },
    fetch: () => Promise.resolve({ ok: true, json: () => Promise.resolve({}),
                                   text: () => Promise.resolve('') }),
    setTimeout: () => 0, clearTimeout: noop, setInterval: () => 0, clearInterval: noop,
    requestAnimationFrame: () => 0, alert: noop, confirm: () => true, prompt: () => null,
    matchMedia: () => ({ matches: false, addListener: noop, addEventListener: noop }),
    Chart: function () { return { destroy: noop, update: noop, resize: noop }; },
    Notification: { permission: 'default', requestPermission: () => Promise.resolve('default') },
    supabase: { createClient: () => ({
      auth: { getSession: () => Promise.resolve({ data: {} }), onAuthStateChange: noop,
              signOut: () => Promise.resolve({}) },
      from: () => ({ select: () => Promise.resolve({ data: [] }) })
    }) },
    OneSignal: { push: noop, init: noop },
    URL: { createObjectURL: () => '', revokeObjectURL: noop },
    Blob: function () {},
    FileReader: function () { return { readAsDataURL: noop, addEventListener: noop }; },
    screen: { width: 390, height: 844 }, innerWidth: 390, innerHeight: 844,
    devicePixelRatio: 2, scrollTo: noop, addEventListener: noop,
    removeEventListener: noop, history: { pushState: noop, back: noop },
    btoa: s => Buffer.from(String(s), 'binary').toString('base64'),
    atob: s => Buffer.from(String(s), 'base64').toString('binary')
  };
  ctx.window = ctx; ctx.globalThis = ctx; ctx.self = ctx; ctx.Chart.instances = {};
  vm.createContext(ctx);
  return ctx;
}

// Corre la app entera. Si algún bloque se corta, lo dice y devuelve null:
// seguir probando sobre una app a medio cargar da resultados inventados.
function appEvaluada({ silencioso = true } = {}) {
  const ctx = navegadorFalso();
  const bs = bloques();
  const anterior = console.log;
  if (silencioso) console.log = () => {};
  try {
    for (let i = 0; i < bs.length; i++) {
      try {
        vm.runInContext(bs[i], ctx, { filename: 'bloque' + i, timeout: 30000 });
      } catch (e) {
        console.log = anterior;
        console.log('  El bloque ' + i + ' se corta: ' + e.constructor.name + ': ' + e.message);
        return null;
      }
    }
  } finally { console.log = anterior; }
  return ctx;
}

// Le cambia el documento de mentira por uno de verdad y devuelve las dos
// herramientas que hacen falta para trabajar con él.
//
// corr() ejecuta código ADENTRO del sandbox. Hace falta porque S y db están
// declarados con const dentro del index: no viven en el objeto global, y
// asignarlos desde afuera no cambia nada de lo que la app ve.
function conDom(ctx) {
  const { JSDOM } = require('jsdom');
  const dom = new JSDOM('<!doctype html><html><body></body></html>');
  ctx.document = dom.window.document;
  ctx.Node = dom.window.Node;
  ctx.Event = dom.window.Event;
  return {
    dom,
    D: dom.window.document,
    $: id => dom.window.document.getElementById(id),
    corr: codigo => vm.runInContext(codigo, ctx, { filename: 'prueba' })
  };
}

// Un documento con el CSS de verdad adentro, para preguntarle al motor qué
// estilo le toca a cada cosa en vez de leer la hoja y suponerlo.
function domConCss(cuerpoHtml) {
  const { JSDOM } = require('jsdom');
  return new JSDOM('<!doctype html><html><head><style>' + leerCss() +
                   '</style></head><body>' + cuerpoHtml + '</body></html>');
}

// ── Contraste, calculado ───────────────────────────────────────────────
// Mirar la pantalla y decir "se ve bien" no sirve: lo que a mí me parece
// legible en un monitor bueno es ilegible en un celular al sol. WCAG pide
// 4,5:1 para texto normal y eso sí se puede medir.
function aRgb(color) {
  const c = String(color).trim();
  let m = c.match(/^#([0-9a-f]{6})$/i);
  if (m) { const n = parseInt(m[1], 16); return [n >> 16 & 255, n >> 8 & 255, n & 255, 1]; }
  m = c.match(/^#([0-9a-f]{3})$/i);
  if (m) { return [parseInt(m[1][0] + m[1][0], 16), parseInt(m[1][1] + m[1][1], 16),
                   parseInt(m[1][2] + m[1][2], 16), 1]; }
  m = c.match(/^rgba?\(([^)]+)\)$/i);
  if (m) { const p = m[1].split(',').map(s => parseFloat(s));
           return [p[0], p[1], p[2], p[3] == null ? 1 : p[3]]; }
  throw new Error('no sé leer este color: ' + color);
}
const sobre = (frente, fondo) => {
  const a = frente[3];
  return [0, 1, 2].map(i => frente[i] * a + fondo[i] * (1 - a)).concat([1]);
};
function luminancia(c) {
  const s = c.slice(0, 3).map(v => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * s[0] + 0.7152 * s[1] + 0.0722 * s[2];
}
function contraste(a, b) {
  const l1 = luminancia(a), l2 = luminancia(b);
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}
const MINIMO_LEGIBLE = 4.5;

// ── Cómo se informa ────────────────────────────────────────────────────
function crearReporte(titulo) {
  const malos = [];
  console.log('\n── ' + titulo + ' · ' + version() + ' ──');
  return {
    ok(condicion, rotulo, detalle) {
      console.log((condicion ? '  OK  ' : '  MAL ') + rotulo + (detalle ? '  · ' + detalle : ''));
      if (!condicion) malos.push(rotulo);
      return condicion;
    },
    seccion(t) { console.log('\n  ' + t); },
    cerrar(mensajeFinal) {
      if (malos.length) {
        console.log('\n  NO PASA:');
        malos.forEach(m => console.log('    x ' + m));
        process.exitCode = 1;
        return false;
      }
      console.log('\n  ' + (mensajeFinal || 'Todo bien.'));
      return true;
    }
  };
}

module.exports = {
  RAIZ, RUTAS, leerHtml, leerCss, version, bloques,
  navegadorFalso, appEvaluada, conDom, domConCss,
  aRgb, sobre, luminancia, contraste, MINIMO_LEGIBLE,
  crearReporte
};
