// Bump this version on every deploy so iOS/clients drop the old cache.
const CACHE = 'chart-quest-v202';
const ASSETS = ['/', '/index.html', '/icon-192.png', '/icon-512.png', '/manifest.json'];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET' || !e.request.url.startsWith(self.location.origin)) return;

  const isHTML = e.request.mode === 'navigate' ||
                 /\.html($|\?)/.test(e.request.url) ||
                 e.request.url.replace(self.location.origin, '').replace(/\?.*$/, '') === '/';
  // Boss portrait images are network-first too, so swapping in new art shows up
  // immediately instead of being pinned to an old cached copy of the same name.
  const isBossArt = /\/bosses\//.test(e.request.url);

  if (isHTML || isBossArt) {
    // NETWORK-FIRST: always try the freshest copy so code/art updates appear on
    // the next load. Fall back to cache only when offline.
    e.respondWith(
      fetch(e.request).then(res => {
        if (res && res.status === 200) {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return res;
      }).catch(() => caches.match(e.request).then(c => c || caches.match('/index.html')))
    );
    return;
  }

  // CACHE-FIRST for static assets (icons, manifest) with background refresh.
  e.respondWith(
    caches.match(e.request).then(cached => {
      const network = fetch(e.request).then(res => {
        if (res && res.status === 200) {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return res;
      });
      return cached || network;
    })
  );
});
