/* AstroTrip service worker.
   Must live as a separate same-origin file: browsers reject blob:/data: URLs
   as service-worker scripts, so this is the one thing that cannot be inlined
   into index.html.

   Strategy:
   - navigations: network-first, falling back to the cached shell. Online you
     always get the freshly deployed build; offline (or on a flaky mobile
     connection) you still get the app.
   - other same-origin GETs: cache-first with a background refresh, so icons
     and the manifest load instantly and quietly update.
   Bump CACHE on every deploy that changes a precached file. */
const CACHE = 'astrotrip-v3';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './icon-maskable-512.png',
  './apple-touch-icon.png',
  // Precached, not optional: without them offline falls back to a platform
  // font and the layout shifts, which is exactly what self-hosting prevents.
  './inter-400.woff2',
  './inter-500.woff2',
  './literata-500.woff2'
];

/* Split by criticality: CRITICAL must all land or the install fails, so the
   old worker keeps serving and the browser retries later. Silently swallowing
   a fetch blip here would leave a permanently incomplete v2 cache - offline
   would fall back to a platform font, the exact layout shift self-hosting
   exists to prevent. Icons are cosmetic and may miss. */
const CRITICAL = ASSETS.filter(u => u === './' || u.endsWith('.html') || u.endsWith('.woff2'));
const OPTIONAL = ASSETS.filter(u => !CRITICAL.includes(u));

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => Promise.all([
        c.addAll(CRITICAL),
        ...OPTIONAL.map(u => c.add(u).catch(() => {}))
      ]))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req)
        .then(res => {
          // Only a real 200 may replace the offline shell. Without this an
          // error page served mid-deploy overwrites index.html and the app
          // then boots into that error offline until the next good load.
          // Redirected/opaque responses are not storable, hence the type check.
          if (res && res.ok && res.type === 'basic' && !res.redirected) {
            const copy = res.clone();
            e.waitUntil(
              caches.open(CACHE)
                .then(c => c.put('./index.html', copy))
                .catch(() => {})
            );
          }
          return res;
        })
        .catch(() => caches.match('./index.html').then(r => r || caches.match('./')))
    );
    return;
  }

  e.respondWith(
    caches.match(req).then(hit => {
      const net = fetch(req).then(res => {
        if (res && res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(req, copy));
        }
        return res;
      }).catch(() => hit);
      return hit || net;
    })
  );
});
