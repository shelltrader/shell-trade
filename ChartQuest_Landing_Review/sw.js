/* Chart Quest — service worker (offline shell + installability) */
const CACHE = 'chartquest-site-v2';
const ASSETS = [
  './','./index.html','./bosses.html','./courses.html','./play.html',
  './assets/site.css','./assets/site.js','./assets/config.js',
  './assets/chartquest-poster.jpg','./icon-192.png','./icon-512.png','./manifest.webmanifest'
];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS).catch(()=>{})).then(()=>self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  // network-first for the live game (it needs fresh market data), cache-first for the rest
  if (req.url.includes('game.html')) {
    e.respondWith(fetch(req).catch(() => caches.match(req)));
    return;
  }
  e.respondWith(
    caches.match(req).then(hit => hit || fetch(req).then(res => {
      const copy = res.clone();
      caches.open(CACHE).then(c => c.put(req, copy)).catch(()=>{});
      return res;
    }).catch(()=>caches.match('./index.html')))
  );
});
