/* ChartQuest — service worker (asset cache + installability).
 *
 * IMPORTANT: page navigations are intentionally NOT intercepted.
 * Cloudflare Pages serves clean URLs (/play.html -> 308 -> /play). A service
 * worker must never return a *redirected* response for a navigation — the
 * browser rejects it with ERR_FAILED ("This site can't be reached"). Letting
 * the browser handle HTML navigation (and its redirects) natively avoids that
 * entire class of bug for /play, /bosses, /courses, etc.
 */
/* BUMP THIS IN THE SAME COMMIT AS ANY CHANGE TO A PRECACHED OR RUNTIME-CACHED ASSET.
   Static assets below are cache-first with NO revalidation, so a returning tester keeps the
   old copy until this string changes. v8: config.js now gates the courses page off and
   site.js drops the fake signup form — without a bump, anyone who had visited before would
   have kept the old pair and still seen both.
   v9: site.js again — it no longer animates the invisible #cqnet canvas behind the game on
   the play page. That IS the desktop lag fix, so it must actually reach returning testers.
   v10: the tracker itself changed (one session per visit, durable retry, build tag). cq-track.js
   is now precached EXPLICITLY rather than only runtime-cached, so it is unambiguously versioned.
   v12: repairing this comment. v10's text was appended AFTER the block's closing delimiter, so
   from build 332 until now this file was a SyntaxError and the service worker never registered
   at all — no precache, no offline page, and a console error on every load. */
/* BUMP THIS ON ANY CHANGE TO A PRECACHED FILE — assets/cq-track.js ESPECIALLY.
   v12 → v13 (2026-08-05): build 343 added play_clicked + movement_tutorial_completed to
   cq-track.js, but this version string did not move. The activate handler only purges caches
   whose key differs from CACHE, so every returning visitor kept being served the v12 copy of
   cq-track.js — 21,642 bytes, no new event names — while the network copy was 32,916 bytes.
   CQTrack.event('play_clicked') simply returned false for them and the two stages recorded
   NOTHING. Caught live, by testing the emit path in a browser that had visited before; a fresh
   browser works fine, which is exactly why this class of bug survives local checking.
   The precache list is not "just marketing assets" — it contains the ANALYTICS CLIENT.
   v13 → v14 (2026-08-07): build 355 changed cq-track.js (dev-session props.dev tag +
   tutorial_step_reached breadcrumb) but this version string did not move IN THAT COMMIT — the
   same miss as v12→v13. Bumping now so returning landing/play visitors get the new tracker.
   (The game itself is game.html, served network-first, so gameplay was never stale — only the
   precached assets/cq-track.js on the marketing pages were.)
   v14 → v15 (build 368): analytics and surveys become Cloudflare-first.
   v15 → v16 (build 369): every production data path is same-origin Cloudflare-only; tracker,
   boot-crash capture and cloud-data adapter fail closed into their durable on-device queues.
   v16 → v17 (build 370): the tracker captures expiring opaque cohort/invite attribution for the
   next beta round, so returning testers must not keep the un-attributed v16 client.
   v17 → v18 (build 373): public pain-point/Bitcoin-first truth copy changed in site.js and the
   manifest; returning testers must receive those precached assets rather than the old claims.
   v18 → v19 (build 373 visibility follow-up): the precached landing page promotes the pain point
   from fine print to a readable hero panel, so returning/offline visitors need the new root.
   v19 → v20: an owed response-specific survey survives offline reloads and worker replacement;
   the survey shell is precached and is served for offline /survey navigations. */
const CACHE = 'chartquest-site-v20';
const OFFLINE_URL = './offline.html';
const SURVEY_URL = './survey.html';
const ASSETS = [
  './',
  OFFLINE_URL, SURVEY_URL,
  './assets/site.css', './assets/site.js', './assets/config.js', './assets/cq-track.js',
  './assets/cq-boot-crash.js', './assets/cq-cloud-data.js',
  './assets/chartquest-poster.jpg', './manifest.webmanifest',
  './assets/pwa/icon-192.png', './assets/pwa/icon-512.png', './assets/pwa/icon-180.png'
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

  // Page/iframe navigations. While ONLINE we still do not intercept at all, so the
  // browser follows Cloudflare's clean-URL 308s natively and we can never hand it a
  // *redirected* response (that returns ERR_FAILED and once broke the Play button).
  // Only when the device is offline do we take over, purely to serve offline.html.
  if (req.mode === 'navigate') {
    if (!self.navigator.onLine) {
      const navigationURL = new URL(req.url);
      const owedSurveyRoute = /(?:^|\/)survey(?:\.html)?\/?$/.test(navigationURL.pathname);
      e.respondWith(caches.match(owedSurveyRoute ? SURVEY_URL : OFFLINE_URL).then(hit => {
        if (!hit) return fetch(req);
        // Rebuild the response so `.redirected` is false. On Cloudflare, ./offline.html
        // 308s to /offline, so `addAll` stored a REDIRECTED response — and a SW may not
        // hand a redirected response to a navigation (ERR_FAILED). Reconstructing from
        // the body strips that flag; harmless when the cached entry wasn't redirected.
        return hit.blob().then(body => new Response(body, {
          status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' }
        }));
      }));
    }
    return;
  }

  // Founder data and every API response are private/live data, never offline
  // assets. Bypass CacheStorage completely so Access logout/revocation cannot
  // leave survey or player records readable from this service worker, and so
  // dashboard refreshes always reach the authenticated origin.
  const requestURL = new URL(req.url);
  // Cross-origin CORS responses can contain authenticated account/save data or live
  // prices. Browser HTTP caching may obey their response policy; ChartQuest CacheStorage
  // must never pin them or reuse an Authorization response across an account switch.
  if (requestURL.origin !== self.location.origin) {
    e.respondWith(fetch(req));
    return;
  }
  if (requestURL.pathname === '/api' || requestURL.pathname.startsWith('/api/') ||
      requestURL.pathname === '/founder' || requestURL.pathname.startsWith('/founder/')) {
    e.respondWith(fetch(req));
    return;
  }

  // The live game needs fresh market data. So does the homepage OHLC snapshot —
  // it is regenerated by scripts/fetch_markets.py, so it must never be pinned
  // cache-first (the vendored chart lib is immutable and stays cache-first).
  if (req.url.includes('game.html') || req.url.includes('market-data.js')) {
    e.respondWith(fetch(req).catch(() => caches.match(req)));
    return;
  }

  // Static assets: cache-first; only cache clean (ok, non-redirected) responses.
  e.respondWith(
    // HTML references versioned static assets (`?v=...`) while precache keys are deliberately
    // canonical. Ignoring the query here lets the offline survey load its verified local tracker.
    caches.match(req, { ignoreSearch: true }).then(hit => hit || fetch(req).then(res => {
      if (res && res.ok && !res.redirected) {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(req, copy)).catch(() => {});
      }
      return res;
    }).catch(() => undefined))
  );
});
