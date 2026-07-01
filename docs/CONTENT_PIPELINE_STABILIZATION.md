# Content Pipeline — Stabilization Report

Scope: infrastructure reliability only. **No new features.** Addresses the 5 prioritized audit findings.
Validation method: the real `ContentLog`/`ContentDirector` modules extracted from `chart-quest.html` and executed in Node with a controllable network stub (`__net` on/off), plus syntax verification of both files. Every metric below is measured, not asserted.

---

## Before → After (measured)

| Behavior | BEFORE (audit) | AFTER (this pass) |
|---|---|---|
| **Event loss** | 1000 emitted → **600 kept**, 400 silently dropped | 1000 emitted offline → **0 dropped**; 1,667 rows (events+briefs) held in durable queue |
| **Cloud write on failure** | spliced + fire-and-forget → **lost on failure** | retained in queue, `failed` counter + `lastError` logged, exponential backoff (2s→60s) |
| **Reconnect recovery** | none | `online` event + interval drain → **flushed=1667, queue=0** (confirm-before-remove) |
| **Orphaned tables** | 4 of 5 had **0 writes** | **all 5** receive queued writes: `content_events, content_briefs, content_replays, content_exports, content_generated` |
| **Replay persistence** | local-only, cap 50, raw candle arrays, not reproducible | cloud-synced via queue; **300 frames → capped 80, rounded**; slim searchable descriptor (kind/setup/result/grade/seed); seed preferred when available; retrievable by id |
| **Search unknown filter** | silently returned **all** rows (false positives) | **throws** `Unsupported search filter(s): …` |
| **Difficulty / skill / date-range search** | absent | `difficulty:expert`→1 ✓, `skill:execution`→1 ✓, `since/until` window→2 ✓, `until:past`→0 ✓ |
| **Monitoring** | none | `ContentLog.health()` → `{queued, enqueued, flushed, failed, dropped, lastError, lastFlushAt, online, backoffMs}`, surfaced in dashboard status bar |

---

## What changed (files)

### `chart-quest.html` — `window.ContentLog`
- **Source-of-truth inversion.** localStorage is now an explicit *display cache* (`CACHE_EVENTS=600`, `CACHE_REPLAYS=60`); Supabase is the durable record. The cache may evict; the **durable queue may not**.
- **Durable outbound queue** (`cq_content_queue_v1`): every cloud write (`enqueue(table,row)`) is persisted before send and removed **only after a confirmed 2xx** (409 = already-persisted duplicate, also treated as success → idempotent retries). `QUEUE_MAX=8000` ceiling; overflow is counted in `mon.dropped` + `lastError`, never silent.
- **Retry/backoff/recovery** (`flush()`): batches ≤100/table, exponential backoff 2s→60s on failure, retries on the 8s interval, `online` event, `pagehide`, and `visibilitychange`.
- **Retention + monitoring**: persistent `mon` counters; `health()` exposes them.
- **P2 writes**: `emit()` also enqueues a Director brief for clip-worthy events (`content_briefs`); `attachReplay()` enqueues `content_replays`; new `logExport()` enqueues `content_exports` + `content_generated`.
- **P3 replay**: `compactFilm()` caps to 80 frames and rounds to 2dp; descriptor carries `seed/difficulty/game_id` (seed preferred over film when present).
- **P4 search**: `query()` validates against a `QUERY_KEYS` whitelist and **throws** on unknown keys; added `difficulty`, `skill`, `until`, `limit`.
- New bridge commands: `health`, `logExport`.

### `dashboard.html` — Content module
- Reads `content_replays` from Supabase (cloud retrieval) with live-bridge fallback.
- Pulls `health()` and shows cloud-sync status (queued / flushed / retried / dropped) in the status bar.
- Export now calls `logExport` → real `content_exports` + `content_generated` rows.

---

## Re-validation audit (this pass)

```
[P1 no-loss]   emitted 1000 OFFLINE -> display cache=600  durable queue=1667  dropped=0
[P5 offline]   flush offline -> queue retained=1667  failed=200  backoff=2000ms  lastError logged
[P5 reconnect] network restored -> queue=0  flushed=1667   (every event reached cloud)
[P2 tables]    queued writes: content_events✓ content_briefs✓ content_replays✓ content_exports✓ content_generated✓
[P3 replay]    raw 300 frames -> capped 80, rounded ✓  descriptor populated ✓  retrievable ✓
[P4 search]    unknown filter -> THROWS ✓  difficulty/skill/since-until -> correct counts ✓
```

## Honest limitations / not-in-scope (unchanged by design)
- **Live-insert smoke test against the real DB was deferred** — the Supabase MCP connector was intermittently unresponsive during this pass. Row keys match the columns created in `0001_content_pipeline.sql`, and PostgREST accepts JSON arrays for `text[]` and JSON objects for `jsonb`; recommend one manual insert per table to confirm end-to-end before relying on it in production.
- **Browser end-to-end of the dashboard wiring** was verified by syntax + the engine-level Node harness; the headless browser was unstable in-sandbox this session. The dashboard changes are additive and guarded.
- **Dashboard analytics still read newest-N from Supabase** (pagination/aggregate RPC remains a P1 from the original audit, not in this pass's 5-item scope).
- **No media export, no AI generation, no publishing** — explicitly out of scope.
- Local cache still caps at 600 for *display*; this is intentional (cache, not system of record). Totals should be read from Supabase.
