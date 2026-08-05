// ⚠ THIS FILE IS NOT SERVED IN PRODUCTION. Cloudflare Pages builds from website/, so
// https://playchartquest.com/sw.js is website/sw.js ('chartquest-site-v12'), not this file.
// Verified 2026-08-05. The "bump per release" instruction below is therefore dead: this version
// string has been stuck at v325 while builds reached 340, and nothing noticed, because nothing
// depends on it. The DEPLOYED service worker is website/sw.js — bump THAT one, and note that its
// precache list is marketing-only and it does not intercept navigations while online, so it plays
// no part in whether players get a fresh build. Kept for the local/Netlify path only.
// See website/_headers and docs/operations/CloudflareDeployment.md §2.
const CACHE = 'chart-quest-v325';   /* not served; see the note above before "bumping per release" */
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
