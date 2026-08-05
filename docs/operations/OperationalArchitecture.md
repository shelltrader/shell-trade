# ChartQuest — Operational Architecture

**Status:** PERMANENT. The reference for how ChartQuest handles errors, logging, configuration,
feature flags and observability.
**Owner:** `window.CQOPS` · canonical source [`ops/cq-ops.js`](../../ops/cq-ops.js) · build 340.
**Guarded by:** regression gate **#19** (`scripts/verify.js`).
**Adoption:** [IntegrationGuide.md](IntegrationGuide.md).

---

## 1. Why this exists

ChartQuest has shipped ~340 builds without an operational layer. Every incident in the project's
history has the same shape: **something broke silently, and nothing on the client could see it.**

| Incident | Why it stayed invisible |
|---|---|
| Boss cinematics 404'd in production for ~20 builds | No 404 page (Cloudflare answers 200 with the landing page), the player degrades silently by design, and the LAN QR serves the repo root where the files exist |
| A Cloudflare migration 403'd **all** telemetry | The origin allowlist lived in one place, the client in another, and a failed POST looked exactly like a player who never got there |
| Analytics reported empty `build` on every row | `BUILD_TAG` was re-derived in a second place, via `window.BUILD_TAG`, which is permanently `undefined` |
| Boot-time crashes: zero rows in 118 events | The error listener installed at line ~27,400 of 28,100, so a parse-time throw was structurally unrecordable |

Note the pattern. None of these were logic bugs. They were **missing seams** — no single place that
owned "what is running", "where am I running", "what just failed". This layer is those seams.

## 2. The one rule

> **One owner per operational concern, published on `window`, read by everyone, re-derived by nobody.**

This is the same rule that already governs this codebase elsewhere and works:
`window.CQ` owns market behaviour (gate #13), `window.CQREACH` owns collectible placement
(gate #14), `window.CQBEAT` owns event spacing (gate #18). `window.CQOPS` owns operations
(gate #19). When a value is derived in two places, the two places drift, and the drift is silent.

## 3. Shape

```
                       <head>
  ┌──────────────────────────────────────────────────┐
  │  boot-crash capture  (pre-existing, unchanged)   │
  ├──────────────────────────────────────────────────┤
  │  <meta name="cq-build" …>   ← stamped by cq.sh   │
  │  window.CQOPS               ← ops/cq-ops.js      │
  └──────────────────────────────────────────────────┘
                          ↓  available to everything below
   game block 1 · block 2 · block 3 · block 4 · CQTrack · CQBeta · CQBEAT
```

**Loads first, in `<head>`.** Infrastructure that other code logs to must exist before the code
that logs. That also puts the splice point ~28,000 lines from the end of the document, where every
other injected subsystem appends its trailing IIFE — so concurrent sessions do not collide with it.

**Zero top-level names.** One IIFE, one global write. A duplicate top-level `const`/`let` across
inline `<script>` blocks is a parse-time `SyntaxError` that silently kills the whole block; in
`<head>` that is a white screen, not a missing feature.

**Non-throwing by construction.** Every public method is `try`/`catch`ed and returns a documented
fallback. A lost metric is a nuisance; a broken game is the beta.

**Deleting the block restores the previous build exactly.** It modifies no existing line.

## 4. The six frameworks

### 4.1 Environment — `CQOPS.env`

The environment is a property of **where the page is served from**, resolved at runtime. One build
artifact behaves correctly on a laptop, on the LAN QR, on a Cloudflare preview and on
playchartquest.com, with no build flags and no separate bundles.

| Resolves to | When |
|---|---|
| `development` | `file:`, `localhost`, `127.0.0.1`, `*.local`, RFC1918 LAN (the QR test URL) |
| `production` | `playchartquest.com`, `www.playchartquest.com`, `chartquest.pages.dev` |
| `staging` | any other `*.pages.dev` (branch/preview deploys), or a host containing `staging`/`preview` |
| `production` | **anything unrecognised** — the conservative config is the safe default |

```js
CQOPS.env.name                          // 'development' | 'staging' | 'production'
CQOPS.env.isProd / .isDev / .is(name)
CQOPS.env.get('analyticsEndpoint')      // the ONLY way to read config
CQOPS.env.force('production' | null)    // persist an override for this profile (QA)
```

Config keys today: `analyticsEndpoint`, `apiBase`, `surveyUrl`, `logLevel`, `debugOverlays`,
`remoteLogging`. Override per load with `?env=production`.

> **Phase 1 honesty:** all three environments currently point at the **same** Supabase project,
> because that is the truth today — there is no staging project yet. `ENV_CONFIG` in
> `ops/cq-ops.js` is where that changes, and the **only** place it changes. Do not add a second
> endpoint literal anywhere else in the codebase.

### 4.2 Deployment metadata — `CQOPS.build`

```js
CQOPS.build.number    // 340
CQOPS.build.tag       // the full BUILD_TAG paragraph
CQOPS.build.summary   // 'build 340 - OPERATIONAL FOUNDATION, PHASE 1'
CQOPS.build.commit    // 'fd7108e766'  — the BASE commit this build was made from
CQOPS.build.builtAt   // '2026-08-05T05:13:09Z'
CQOPS.build.env       // 'production'
CQOPS.build.stamped   // false on an unstamped working copy
```

`number`/`tag` are read **lazily** from `BUILD_TAG`. This matters: `BUILD_TAG` is a top-level
`const` in the game's *first* script block, which runs *after* this one. Top-level `const`/`let`
live in the global **lexical** scope and are **not** properties of `window`, so `window.BUILD_TAG`
is permanently `undefined` — the exact mistake that shipped an empty `build` on every analytics row
until it was caught in production.

`commit`/`builtAt` come from `<meta name="cq-build">`, written by `scripts/cq.sh ops` (which
`ship` runs first, before the mirror is taken). `commit` is HEAD **at stamp time** — the base
commit. A build cannot carry the hash of the commit that contains it; read it as *"built on top
of `fd7108e`"*, and the very next commit is the one that shipped.

### 4.3 Logging — `CQOPS.log`

One interface, three destinations, and **new destinations require no gameplay code change**.

```js
CQOPS.log.debug|info|warn|error|critical(scope, message, data?)
CQOPS.log.once(scope, message)          // de-duplicated — for "you have a typo" warnings
CQOPS.log.addSink(fn)                   // remote logging / dashboard feed / test harness
CQOPS.log.tail(n, minLevel)             // read the ring buffer
```

| Destination | Behaviour |
|---|---|
| Console | gated by the environment's `logLevel` — `debug` in dev, `warn` in production. `?ops` turns it up to `debug`. |
| Ring buffer | always captures `info` and above, hard-capped at 200 records, each field clipped. Feeds `CQOPS.report()`. |
| Sinks | `addSink(fn)` — how remote logging and the Founder Dashboard arrive later. A sink that throws is swallowed and can never reach the caller. |

Format matches the house style already in the file: `[CQ:scope] message`.

### 4.4 Error handling — `CQOPS.err`

The four cases from the brief, each with a primitive:

| Case | Primitive |
|---|---|
| Analytics fails → queue and retry, gameplay continues | `err.queue()` + `err.retry()` |
| Survey fails → friendly retry, never lose responses | `err.queue()` + `err.friendly('survey')` |
| A cinematic fails → skip it gracefully | `err.guard()` |
| A non-critical UI component fails → log it, continue | `err.wrap()` |

```js
err.guard(scope, fn, fallback)          // sync; returns fallback on a throw
err.wrap(scope, fn, fallback)           // returns a guarded fn — handlers, callbacks, rAF bodies
err.guardAsync(scope, fn, fallback)     // promise that NEVER rejects
err.retry(scope, fn, {tries, baseMs, maxMs, factor})   // exponential backoff WITH jitter
err.queue(name, {limit})                // durable localStorage queue
err.friendly(code)                      // player-facing copy, 10-year-old wording
err.notify(code, detail)                // log + `cq:ops:notice` event + optional notifier
err.setNotifier(fn)                     // a future UI layer registers here
```

**Jitter is not decoration.** Without it, every client that lost the same flaky mobile connection
retries at the same instant.

**The durable queue only releases on a *confirmed* success.** CQTrack learned this the hard way:
its first version spliced rows out of the buffer *before* the POST resolved, so one bad moment on
mobile permanently deleted a funnel stage — indistinguishable in the report from a player who never
got there, which means it manufactured false findings.

**`err.notify` ships no UI.** Phase 1 promised zero player-facing change, so it logs, fires
`cq:ops:notice`, and calls a notifier only if one has been registered.

### 4.5 Feature flags — `CQOPS.flags`

Resolution order, highest wins: **URL → localStorage → environment → default.**

```
?ff=enableBossCinematics:0,enableAnalytics:1        explicit
?ff=-enableBossCinematics,+enableExperimentalFeatures   shorthand
```

```js
CQOPS.flags.on(name)              // the call every consumer makes
CQOPS.flags.set(name, value)      // persist for this profile; null clears
CQOPS.flags.reset()
CQOPS.flags.markWired(name)       // a call site declares "I actually check this"
CQOPS.flags.all()                 // { value, source, wired, defaultValue } per flag
```

**Every product flag defaults to the behaviour that ships today.** That is not a style choice:
this sprint must not change what a player sees, and a flag defaulting to anything else does exactly
that the moment it is wired — and the break would look like a gameplay bug, not a config one.
Gate #19 fails if any product default flips.

**The `wired` bit is the honesty mechanism.** The thing that would destroy trust in a flag system is
a flag that looks like it works and does nothing. A flag is `wired` only once a real call site has
called `markWired()`. `flags.all()` and `CQOPS.report()` show it, and `flags.set()` on an unwired
flag prints a warning saying exactly that.

| Flag | Default | Wired today |
|---|---|---|
| `enableJournalDiscovery` | `true` | ✗ declared only |
| `enableBossCinematics` | `true` | ✗ declared only |
| `enableBetaSurvey` | `true` | ✗ declared only |
| `enableAnalytics` | `true` | ✗ declared only |
| `enableExperimentalFeatures` | `false` | ✗ declared only |
| `enableOpsConsole` | `true` | ✓ |
| `enableOpsErrorCapture` | `true` | ✓ |
| `enableOpsNetworkObserver` | `true` | ✓ |
| `enableOpsRemoteLogging` | `false` | ✓ |

### 4.6 Founder observability — `CQOPS.health` + `CQOPS.report()`

Seven counters, each with a count, first/last timestamp and up to five samples:

`runtime_error` · `analytics_failure` · `survey_failure` · `missing_asset` · `api_failure` ·
`state_transition` · `critical`

**Three are collected passively from day one**, because they need no call-site changes:

1. **Runtime errors** — an additive `error` + `unhandledrejection` listener. Never calls
   `preventDefault`; the existing boot-crash capture still runs.
2. **Missing assets** — a **capture-phase** listener. Resource-load failures (`<img>`, `<video>`,
   `<audio>`, `<script>`) fire an `error` event that does **not bubble**, so the existing
   bubble-phase handler structurally could not see them. This is the listener that would have made
   the 404'd boss cinematics visible on the client. *Verified live: a broken `<img>` is recorded as*
   `IMG http://…/bosses/intros/this-file-does-not-exist.webm`.
3. **Failed API requests** — a pass-through `fetch` observer. It returns the **original promise,
   untouched**, and attaches bookkeeping to a dropped branch supplying **both** handlers — supplying
   only one would create a rejected promise nobody handles, i.e. the observer would manufacture the
   very `unhandledrejection` it exists to count. Opaque (`no-cors`) responses are `ok:false` by
   design and are ignored. A failure against the analytics endpoint is recorded twice: once as
   `api_failure`, once as `analytics_failure`.

Three are interfaces awaiting adoption: `health.analytics()`, `health.survey()`,
`health.transition(system, from, to, allowedMap)`.

**The dashboard interface** — one call, one JSON object, no dependencies:

```js
CQOPS.report()
// { version, at, uptimeMs, build{}, env{}, flags{}, health{ ok, counters }, log[], ok }

CQOPS.summary()
// 'CQOPS 1.0.0 · build 340 · production · commit <sha> · health OK'
```

The Founder Dashboard is **not** built here. This is the seam it will read.

## 5. Operating it

| I want to… | Do this |
|---|---|
| See everything at once | `?ops` on any game URL, or `CQOPS.report()` in the console |
| Turn the console up | `?ops` (forces `logLevel` to `debug`) |
| Test production config locally | `?env=production` (per load) or `CQOPS.env.force('production')` (persists) |
| Flip a flag for one load | `?ff=-enableBossCinematics` |
| Flip a flag for this profile | `CQOPS.flags.set('enableBossCinematics', false)` |
| Undo all flag overrides | `CQOPS.flags.reset()` |
| Know exactly what production is serving | `scripts/cq.sh smoke` |

## 6. Change discipline

- **Run `node ops/cq-ops.test.js` after any edit** (70 behavioural assertions). Gate #19 is
  structural and never executes the module; this suite is the only thing that checks it *behaves*.
- **Edit `ops/cq-ops.js`, never the inlined copy.** Then `scripts/cq.sh ops` (or
  `python3 scripts/sync_ops.py`). `scripts/cq.sh ship` does it automatically, first, before the
  mirror is taken — if it ran after, `index.html` and `website/game.html` would ship the previous
  stamp and every deploy would report the wrong commit.
- **Gate #19 fails on drift**, on a deleted owner, on an unstamped build, on a product flag whose
  default flips, on a removed observer, and on a fetch observer that handles only one outcome.
  It has been mutation-tested against all eight of those.
- **New client state uses a versioned `cq_*_v1` key** (protected_systems.md §6). This module owns
  `cq_ops_env_v1`, `cq_ops_flags_v1`, `cq_ops_q_<name>_v1`.
- **Everything stays bounded.** Ring buffer 200, samples 5 per kind, queues capped, fields clipped.
  A four-hour playtest must not grow this module's memory without limit.

## 7. Related

- Adoption recipes → [IntegrationGuide.md](IntegrationGuide.md)
- Per-deploy checks → [ReleaseChecklist.md](ReleaseChecklist.md)
- What you may not touch → [`docs/canon/protected_systems.md`](../canon/protected_systems.md)
- Per-commit regression gate → [`docs/canon/regression_checklist.md`](../canon/regression_checklist.md)
