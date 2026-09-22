// ── Dormetria · Service Worker ──
// Hace la app instalable (PWA) y prepara el canal de notificaciones push.
// Estrategia de caché: "network first" para el HTML (así el paciente siempre
// recibe la última versión al publicar cambios) y "cache first" para estáticos.
const CACHE = 'dormetria-v3';
const SHELL = ['./', './index.html', './css/styles.css', './js/dormetria-sleep-metrics.js', './manifest.json'];

self.addEventListener('install', (ev) => {
  self.skipWaiting();
  ev.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(SHELL).catch(() => {}))
  );
});

self.addEventListener('activate', (ev) => {
  ev.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (ev) => {
  const req = ev.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  // Nunca cachear la API (Supabase) ni nada de otro origen dinámico
  if (url.origin !== self.location.origin) return;

  const isDoc = req.mode === 'navigate' || (req.headers.get('accept') || '').includes('text/html');
  if (isDoc) {
    ev.respondWith(
      // {cache:'reload'} es la clave: sin esto, fetch() se sirve de la caché
      // HTTP del navegador y el "network first" nunca ve la versión publicada.
      // Ese era el motivo de que el teléfono siguiera mostrando una versión vieja.
      fetch(req, { cache: 'reload' }).then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
        return res;
      }).catch(() => caches.match(req).then((r) => r || caches.match('./index.html')))
    );
    return;
  }
  ev.respondWith(
    caches.match(req).then((cached) => cached || fetch(req).then((res) => {
      const copy = res.clone();
      caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
      return res;
    }).catch(() => cached))
  );
});

// ── Push (requiere servidor con claves VAPID; queda listo para cuando exista) ──
self.addEventListener('push', (ev) => {
  let data = { title: 'Dormetria', body: 'Tenés un recordatorio pendiente.' };
  try { if (ev.data) data = Object.assign(data, ev.data.json()); } catch (_) {
    try { data.body = ev.data.text(); } catch (__) {}
  }
  ev.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: './icon-192.png',
      badge: './icon-192.png',
      tag: data.tag || 'dormetria',
      data: { url: data.url || './' },
      requireInteraction: false
    })
  );
});

self.addEventListener('notificationclick', (ev) => {
  ev.notification.close();
  const target = (ev.notification.data && ev.notification.data.url) || './';
  ev.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      for (const c of list) { if ('focus' in c) return c.focus(); }
      if (self.clients.openWindow) return self.clients.openWindow(target);
    })
  );
});
