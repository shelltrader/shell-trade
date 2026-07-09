/* Chart Quest — service worker (asset cache + installability).
 *
 * IMPORTANT: page navigations are intentionally NOT intercepted.
 * Cloudflare Pages serves clean URLs (/play.html -> 308 -> /play). A service
 * worker must never return a *redirected* response for a navigation — the
 * browser rejects it with ERR_FAILED ("This site can't be reached"). Letting
 * the browser handle HTML navigation (and its redirects) natively avoids that
 * entire class of bug for /play, /bosses, /courses, etc.
 */
const CACHE = 'chartquest-site-v4';
const ASSETS = [
  './',
  './assets/site.css', './assets/site.js', './assets/config.js',
  './assets/chartquest-poster.jpg', './icon-192.png', './icon-512.png', './manifest.webmanifest'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS).catch(() => {})).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  // Drop every old cache (incl. the broken v2 that cached the redirected play.html).
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;

  // Page/iframe navigations: do NOT intercept. The browser follows Cloudflare's
  // clean-URL redirects natively, so no redirected response is ever served here.
  if (req.mode === 'navigate') return;

  // The live game needs fresh market data.
  if (req.url.includes('game.html')) {
    e.respondWith(fetch(req).catch(() => caches.match(req)));
    return;
  }

  // Static assets: cache-first; only cache clean (ok, non-redirected) responses.
  e.respondWith(
    caches.match(req).then(hit => hit || fetch(req).then(res => {
      if (res && res.ok && !res.redirected) {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(req, copy)).catch(() => {});
      }
      return res;
    }).catch(() => undefined))
  );
});
