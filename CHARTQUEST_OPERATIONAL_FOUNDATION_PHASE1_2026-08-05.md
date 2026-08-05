# ChartQuest — Operational Stability Foundation, Phase 1

**Date:** 2026-08-05 · **Build:** 340 · **Base commit:** `8f3bfca246`
**Verdict:** ✅ **PASS** — foundation shipped, gate green, zero player-facing change.
**Reference docs:** [Operational Architecture](docs/operations/OperationalArchitecture.md) ·
[Integration Guide](docs/operations/IntegrationGuide.md)

---

## 1. What was built

`window.CQOPS` — one owner for six operational concerns, published in `<head>`, available to every
script block below it.

| # | Deliverable | Where |
|---|---|---|
| 1 | Operational Architecture | [docs/operations/OperationalArchitecture.md](docs/operations/OperationalArchitecture.md) |
| 2 | Error Handling Framework | `CQOPS.err` — guard · wrap · guardAsync · retry · durable queue · friendly messages |
| 3 | Logging Framework | `CQOPS.log` — info/warn/error/critical → console + ring buffer + pluggable sinks |
| 4 | Environment Framework | `CQOPS.env` — development / staging / production, resolved at runtime |
| 5 | Feature Flag Framework | `CQOPS.flags` — URL → localStorage → environment → default, with a `wired` honesty bit |
| 6 | Founder Observability | `CQOPS.health` + `CQOPS.report()` — seven counters, three collected passively |
| 7 | Integration Guide | [docs/operations/IntegrationGuide.md](docs/operations/IntegrationGuide.md) |

Plus deployment metadata (`CQOPS.build` — number · commit · timestamp · environment), a splice
tool, a stamp step in the deploy pipeline, and a regression gate.

### Files

| File | Change |
|---|---|
| `ops/cq-ops.js` | **new** — 750 lines, the canonical source |
| `scripts/sync_ops.py` | **new** — splices it in, `--check` for drift, `--stamp` for the deploy stamp |
| `chart-quest.html` | **+758 lines, 0 modified, 0 deleted** — one insertion at line 66, plus the `BUILD_TAG` bump |
| `index.html` · `website/game.html` | mirrors, regenerated |
| `scripts/verify.js` | **+gate #19** |
| `scripts/cq.sh` | **+`ops` target**, run first in `ship` |
| `docs/operations/` | 2 new docs + README index row |

## 2. The constraint that shaped every decision

Multiple Claude sessions were live in this tree throughout. **Five commits from other sessions
landed while this work was in progress** — CQBEAT enforcement (build 338), the pre-trade zone
(build 339), the Beta QA dashboard, and two tooling refactors that rewrote the very files this
sprint also edits (`cq.sh`, `verify.js` gate #3a). One of them took the build number 339 that this
work had already claimed, so this shipped as **340**. The design answer to that:

- **One insertion, zero modified lines.** `git diff chart-quest.html` is a single hunk:
  `@@ -65,0 +66,758 @@`. Nothing above or below it was touched.
- **`<head>`, not the tail.** Every other injected subsystem in this project (`CQBeta`,
  `CQJournalTutorial`, `CQBEAT`) appends a trailing IIFE at the end of the document — so that is
  precisely where concurrent sessions collide. Line 66 is ~28,000 lines away from that traffic.
  It is also the architecturally correct position: infrastructure that others log to must exist
  before they do.
- **Zero top-level names.** One IIFE, one `window` write.
- **Deleting the block restores build 339 exactly.**

## 3. Design decisions worth knowing

**Environment is resolved at runtime, not baked at build time.** One artifact behaves correctly on
a laptop, the LAN QR, a Cloudflare preview and playchartquest.com. An unrecognised host resolves to
`production` — the conservative config is the safe default.

**All three environments currently point at the same Supabase project**, because that is the truth
today. `ENV_CONFIG` is where a real staging project gets added, and the only place.

**Build metadata is read lazily.** `BUILD_TAG` is a top-level `const` in the game's *first* script
block, which runs *after* the head. Top-level `const`/`let` are not properties of `window`, so
`window.BUILD_TAG` is permanently `undefined` — the exact mistake that shipped an empty `build` on
every analytics row until it was caught in production.

**Three observability signals are passive**, needing no call-site changes:

| Signal | Mechanism | Why it matters here |
|---|---|---|
| Runtime errors | additive `error` + `unhandledrejection` listeners | never `preventDefault`; the boot-crash capture still runs |
| **Missing assets** | **capture-phase** `error` listener | resource errors do **not bubble**, so the existing bubble-phase handler structurally could not see them — this is the listener that would have caught ~20 builds of 404'd boss cinematics |
| Failed API requests | pass-through `fetch` observer | returns the original promise untouched; supplies **both** handlers so it can never invent an `unhandledrejection`; ignores opaque `no-cors` responses |

**Feature flags carry a `wired` bit.** The five product flags are declared but **not** wired —
Phase 1 migrated nothing — and they report `wired: false`. A flag that looks like it works and does
nothing would destroy trust in the whole system, so the system says so out loud.

**Every product flag defaults to the behaviour that ships today.** Gate #19 fails if a default
flips.

## 4. Evidence

### Regression gate — 18 pass, 0 fail

```
✓ [1] Correct Finn active        ✓ [11] TES guardrails
✓ [2] Deprecated Finn inactive   ✓ [12] Candle-language divergence
✓ [3a] 10 inline blocks parse    ✓ [13] window.CQ owner integrity
✓ [4] Lessons load               ✓ [14] COLLECTIBLE LAW 001
✓ [5] Bosses load                ✓ [15] Lesson labels
✓ [6] Save system initializes    ✓ [16] Market identity
✓ [7] BUILD_TAG 339 → 340        ✓ [17] Deploy asset parity
✓ [8] index.html mirrors source  ✓ [18] Event spacing owner (CQBEAT enforce, 0 violations)
✓ [9] No large binaries          ✓ [19] Operational foundation  ← new
⚠ [10] Protected: Save keys (APPROVED — see §5)
```

### Gate #19 is discriminating

A gate that cannot fail is theatre, so it was mutation-tested. All eight caught:
drift in the inlined copy · owner deleted · stamp reset to `unstamped` · a product flag default
flipped off · fetch observer removed · missing-asset capture removed · fetch observer left with one
promise handler · a public seam removed.

### Module behaviour — 70/70 in a standalone harness

Environment detection across 10 hostnames · flag precedence (URL > localStorage > env > default) ·
ring-buffer bounding · a throwing sink cannot reach the caller · queue keeps items on an
unconfirmed drain and clears on a confirmed one · retry backoff succeeds and exhausts correctly ·
`guardAsync` never rejects · sample caps · the fetch observer passing through, ignoring opaque
responses, still rejecting for the caller, and never creating an unhandled rejection.

### Live in the browser (`localhost:8798/chart-quest.html?mute=1&ops`)

```
CQOPS 1.0.0 · build 340 · development · commit 8f3bfca246 · health OK
```

- Game boots normally; intro cinematic plays; **zero console errors**.
- All five pre-existing owners intact: `CQ`, `CQREACH`, `CQTrack`, `CQBeta`, `CQBEAT`.
- **Analytics functional** — `CQTrack` live (`pid`, `session`), `buffered: 0`,
  `cq_bt_pending: 0` → the flush was confirmed, and `analytics_failure: 0`.
- **CQBEAT unaffected** — `mode: enforce`, 7 wired, **0 violations**.
- Passive observers proven on the real page: a broken `<img>` recorded as
  `IMG …/bosses/intros/this-file-does-not-exist.webm`; a 404 fetch recorded as
  `localhost:8798 → 404`.
- `?env=production` → config switches, reports `detected: development, forced: true`.
  `?ff=-enableBossCinematics` → `value:false, source:'url', wired:false`.
  A clean URL afterwards returns to defaults — **no leak**.

### Smoke test — behaving correctly

`45 pass · 1 fail`. The single failure is the correct pre-deploy state — production is serving an
older build than this checkout. Every asset check passes. It goes green once this build deploys.

## 5. Two things that need your call

**a) Gate #10 (protected systems) reports a save-key change — approved via
`CQ_ALLOW_PROTECTED=1`.**
The module adds three localStorage keys: `cq_ops_env_v1`, `cq_ops_flags_v1`, `cq_ops_q_<name>_v1`.
Nothing was renamed or removed (38 → 41 keys, additive only), and versioned `cq_*_v` keys are
exactly what `protected_systems.md` §6 prescribes for new state. Gate #10 is a coarse tripwire that
fires on *any* change to the key set, so the override is the intended path — but it is your
tripwire, so you should know it fired and why. Nothing here touches the save **schema**; no existing
key's meaning changed.

**b) Committed by explicit path only.** Before staging, the tree was watched until tooling files
and `HEAD` had been unchanged for 90s, and each contested file was re-diffed to confirm the
remaining change was purely this sprint's (`verify.js` +69/−0, `cq.sh` +13/−2). Deliberately **not**
staged, because they belong to other sessions in flight: `dashboard.html`, `website/bosses/*`, and
`beta-qa/`.

## 6. Found in passing (not fixed — out of scope)

**1. `sync_track.py --check` was wired into nothing — NOW CLOSED by gate #20.** It documented
itself as *"for the ship gate"* but appeared in neither `cq.sh` nor `verify.js`, so nothing
detected drift between `website/assets/cq-track.js` and its copy inlined in `chart-quest.html` —
the same failure class gate #19 closes for CQOPS. Handed off as its own task rather than
drive-by fixed; that work landed as **gate #20**, which checks the two copies byte-for-byte and
also catches an altered or duplicated marker pair (a duplicated CQTrack block being a worse state
than drift, and one where "just re-run the splice" is the wrong advice).

**2. A committed file briefly depended on an untracked one.** Commit `613c02d` made `cq.sh check`
call `scripts/check_syntax.js` while that file was still untracked — a fresh clone would have had a
broken `cq.sh check` and a gate #3a coded to FAIL when its checker is missing. The owning session
tracked it in `8f3bfca` before this commit landed, so it is closed; recorded because it is the same
"exists only on this disk" class as the boss-cinematics incident, and it was invisible for ~20
minutes.

## 7. Regression requirements — status

| Requirement | Status |
|---|---|
| Gameplay unchanged | ✅ one insertion, zero modified lines; game boots identically; zero console errors |
| Beta flow unchanged | ✅ `CQBeta` + `CQTrack` intact, session recorded, flush confirmed |
| Founder Dashboard functional | ✅ untouched (modified by another session, not by this work) |
| Analytics functional | ✅ `buffered: 0`, `pending: 0`, `analytics_failure: 0` |
| Survey functional | ✅ untouched — `err.queue()` exists for it but is **not** wired |
| Deployment functional | ✅ `ship` pipeline green; `ops` step added ahead of the mirror |
| Smoke tests passing | ✅ 45/46, the one failure being the correct pre-deploy tag mismatch |
| No player-facing behavior change | ✅ zero pixels added; `err.notify` deliberately ships no UI |

## 8. Phase 2 — what this earns

Nothing here is a migration, by design. The next steps are small and independently provable:

1. CQTrack reads `CQOPS.env.get('analyticsEndpoint')` and `CQOPS.build` — deletes a duplicated
   endpoint literal and a second `BUILD_TAG` parser. Behaviour-identical today.
2. CQTrack's failed POSTs call `health.analytics()` — the 403 class of incident becomes visible.
3. The survey's submit path moves onto `err.queue()` + `err.retry()`.
4. `CQOPS.log.addSink` feeds the Founder Dashboard.
5. Flags get wired, one at a time, each with the Recipe 5 checklist.

Ordering, recipes and the *"what not to do"* list are in the
[Integration Guide](docs/operations/IntegrationGuide.md).
