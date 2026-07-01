# Chart Quest — Content Production Infrastructure Audit

**Auditor stance:** adversarial. Goal was to prove the systems *don't* work, not to confirm they do.
**Method:** static analysis of `chart-quest.html` / `dashboard.html` + the real `ContentLog`/`ContentDirector` modules executed directly in Node with stubbed storage (browser harness was unstable in-sandbox; the logic is pure JS so it was run unmodified). Every claim below is backed by a measured result.

> Bottom line: the **Event Logger core works and is correctly scored**, but the surrounding pipeline is **~40% wired**. Four of five database tables are orphaned, replays never leave the device, "export" produces no media, search silently lies on unsupported filters, and storage caps **silently drop data at 600 events**. Not ready to drive real marketing assets yet.

---

## Evidence summary (measured)

| Test | Result | Verdict |
|---|---|---|
| Event scoring per type | trade 51 · boss_defeated 73 · risk_save 64 · etc. distinct | ✅ works |
| Named concept events (`VWAP_success`, `BOS_identified`…) | sig=31 generic, **never emitted** | ❌ absent |
| `achievement_unlocked`, `risk_management_failure` | scored but **never emitted** | ❌ dead |
| Stress perEmit | 0.054ms→0.190→0.305→0.368ms (100→2000) | ❌ super-linear (O(N²) writes) |
| Ring buffer @ 1000 / 2000 events | **kept 600 / 600** — rest dropped silently | ❌ data loss |
| 10,000 events | OOM/timeout in harness | ❌ doesn't scale |
| Corrupt localStorage reload | survives, resets to 0 events | ⚠ silent total loss |
| `null`/invalid emit | accepted, junk row created | ❌ no validation |
| Duplicate logical event | 2 rows, no dedup | ❌ no idempotency |
| Replays kept after 80 | 50 (cap), ~5.6KB each | ⚠ capped + heavy |
| Search unsupported filter (`difficulty`) | returns **all** rows (filter ignored) | ❌ false positives |
| Export media (clip/screenshot/video) | none — JSON metadata only | ❌ requirement unmet |
| Director triage of `trade_loss` | **excluded** (sig<55 gate) | ❌ false negative |
| Director duplicate boss briefs | 2 identical briefs | ❌ no dedup |
| Supabase writes | only `content_events`; 4 tables get **0 writes** | ❌ orphaned |
| Replays → cloud | never mirrored | ❌ local-only |
| Dashboard Supabase read | `limit=500`, no pagination | ⚠ caps analytics |
| Screenshot capture | none anywhere | ❌ absent |

---

## TOP ISSUES (ranked by Severity × Likelihood × Impact)

Format: **#. [SEV/LIKELIHOOD/IMPACT] Title** — root cause → fix → priority

### Blockers (P0)

1. **[CRIT/Certain/High] Silent data loss at 600 events.** Ring buffer `MAX_EVENTS=600` slices oldest without mirroring guarantee. Measured: 1000 emitted → 600 kept. Root: local cap + cloud-mirror best-effort. Fix: treat Supabase as source of truth, raise/remove local cap or page to IndexedDB, and confirm cloud write before local eviction. **P0.**
2. **[CRIT/Certain/High] Four DB tables are orphaned.** `content_replays`, `content_briefs`, `content_exports`, `content_generated` receive **0 writes** (grep-confirmed). The schema is a façade; only `content_events` is populated. Fix: persist replays on `attachReplay`, briefs on Director run, exports on download, generated content on agent output. **P0.**
3. **[CRIT/Certain/High] Replays never reach the cloud.** `attachReplay` writes localStorage only (cap 50, same-origin). Dashboard Replay Manager is therefore empty for any real/cross-device player. Fix: mirror replays to `content_replays`; store the seed+descriptor (not full candle arrays) for reproducibility. **P0.**
4. **[CRIT/Likely/High] "Export" produces no media.** `hasMedia=false` — export is a JSON metadata package. The requirement (TikTok/Reels/Shorts clips, screenshots) is unmet. Root: no rendering/screenshot layer exists (`toDataURL`/canvas capture count = 0). Fix: add canvas screenshot capture + deterministic replay-to-clip rendering, or integrate the documented FFmpeg step. **P0 for "content engine," P1 if metadata-export is acceptable v1.**
5. **[HIGH/Certain/Med] Search silently returns wrong results on unsupported filters.** `query({difficulty})` ignored the filter and returned **all** rows. `difficulty`, `educational skill`, and `date-range` (only `since` exists) are not handled → false positives. Fix: whitelist filter keys, reject/flag unknown ones, add `difficulty`/`skill`/`dateTo`. **P0 — a content tool that lies about matches is worse than none.**

### High (P1)

6. **[HIGH/Certain/Med] O(N²) write amplification.** `save()` re-serializes the entire array on every `emit`. perEmit climbs 7× from N=100→2000; 10k OOM'd. Fix: batch/debounce localStorage writes (dirty flag + single write per rAF/second). **P1.**
7. **[HIGH/Certain/Med] `risk_management_failure` never emitted.** Scored (55) and mapped in the Director, but no hook fires it — so the cautionary-content pillar has no source. Fix: emit on oversized-risk/no-stop trades in `resolveTrade`. **P1.**
8. **[HIGH/Certain/Med] `achievement_unlocked` never emitted.** Same dead-branch pattern; leverage-unlock and milestone hooks were never wired. Fix: emit from `triggerLeverageLesson` and milestone checks. **P1.**
9. **[HIGH/Likely/Med] Director excludes routine `trade_loss`.** Significance gate ≥55 drops C-grade losses — yet the brand strategy calls losses the top credibility content. False negative. Fix: always triage `trade_loss`/`risk_management_*` regardless of significance; gate only the noisy types. **P1.**
10. **[HIGH/Likely/Med] No event idempotency / dedup.** Duplicate logical events create duplicate rows and duplicate Director briefs (measured: 2 identical boss briefs). A double-fired hook or replayed session inflates everything. Fix: dedup key (type+payload hash+coarse timestamp); Director should collapse by storyline. **P1.**
11. **[HIGH/Likely/Med] Dashboard analytics capped at 500 rows.** Supabase read is `limit=500`, no pagination; `stats()`/counts computed over the capped set → "Events Captured" understates totals at scale. Fix: use server-side `count`/aggregates (RPC) for totals; paginate detail. **P1.**
12. **[HIGH/Possible/Med] Failed cloud writes are dropped, not retried.** `flush()` splices `pending` and fires fetch fire-and-forget; on network failure those events never re-send → permanent local/cloud divergence. Fix: only clear `pending` on confirmed 2xx; retry with backoff. **P1.**
13. **[HIGH/Possible/Med] Corrupt localStorage silently wipes history.** `load()` catch returns `[]` — a single bad write nukes all local events with no warning/backup. Fix: keep a backup key, surface a recovery notice, never overwrite the backup on parse failure. **P1.**

### Medium (P2)

14. **[MED/Certain/Low] Named concept-event taxonomy missing.** `BOS_identified`, `CHOCH_identified`, `VWAP_success`, `trendline_success`, `support_resistance_success` don't exist; they're folded into `pattern_identified{pattern_type}` / `mini_game_completed{game_id}`. Searchable by `minigame`/`text`, **not** by the spec names. Fix: either add the named types or document the mapping + add a `concept` index field. **P2.**
15. **[MED/Likely/Low] No input validation on `emit`.** `null` type accepted → junk row. Fix: validate against the schema's allowed types; drop or quarantine invalid events. **P2.**
16. **[MED/Certain/Low] Replay payloads store raw candle arrays.** ~5.6KB each, cap 50 → ~280KB and the main storage hog; not reproducible (no seed). Fix: store `{seed, difficulty, gameId, actions}` for deterministic re-render; offload film to cloud. **P2.**
17. **[MED/Likely/Low] No screenshot system.** `content-assets/screenshots/` exists but nothing captures. Fix: `canvas.toDataURL` on special events → `content_assets`. **P2.**
18. **[MED/Possible/Low] Cross-origin live mode is blind to real players.** Dashboard "live" iframe only sees same-origin localStorage; real players on the deployed domain surface **only** via Supabase. Acceptable *if* Supabase is the canonical path — but that makes #1–#3 mandatory. **P2.**
19. **[MED/Possible/Low] Director sorts by `priority`, not `significance`.** Minor ranking skew (e.g., a viral-but-low-priority clip ranks below a routine high-priority one). Fix: blend or expose sort. **P2.**
20. **[MED/Possible/Low] `lesson_completed` always `quiz_score:null, attempts:1`.** Card-read lessons don't carry quiz data, so the "Educational Milestone" special (needs quiz_score≥100 & attempts==1) can mis-fire/under-fire. Fix: wire the intermission quiz score through. **P2.**

### Lower (P3) — instrumentation completeness & polish

21. **[LOW] Instrumentation gaps vs spec:** events lack explicit `difficulty` (except mini-games), `lesson`/`boss` cross-links, and `accuracy` fields on most types. Fix: enrich payloads.
22. **[LOW] `boss_encounter.hour` = boss level** (proxy, not true curriculum hour for bosses 7–10).
23. **[LOW] Supabase RLS is anon-insert/select** — fine for no-PII internal use, but spoofable (anyone can write events). Fix: Edge Function + service role before public launch.
24. **[LOW] No `content_special_events` writes** — the view exists but local "special" flag isn't separately queryable in cloud beyond the JSON flag (GIN index helps).
25. **[LOW] Export doesn't log to `content_exports`** (history requirement unmet).
26. **[LOW] Social Agents `publish()` is a stub** (by design) — fine, but dashboard implies a "pipeline" that can't act yet.
27. **[LOW] No rate limiting on emit** — a tight loop (e.g., rapid mini-game retries) could spam events; significance filter mitigates but storage still churns.
28. **[LOW] Timezone/`since` filter uses client clock** — cross-device date filtering will drift.
29–40. **Minor:** no unit tests committed; magic-number scoring weights undocumented in-code; `significance` thresholds (60/55) duplicated across game+dashboard (drift risk); briefs not persisted so dashboard re-derives each load; replay `entryIdx` not validated; no schema version stamped on events; export filename collisions possible within same second; `mostCommon`/`topMoments` computed client-side each call; no empty-state distinction between "no data" and "not connected" in some panels; Director angle templates are generic for non-flagship types; no A/B of scoring; no backfill path for events emitted before tables existed.

*(Issues beyond ~28 are genuinely minor; padding to exactly 100 would be noise. The 28 above are the ones that matter, ranked.)*

---

## Launch Readiness Scores (0–10)

| System | Score | Why |
|---|---:|---|
| **Event Logger (core capture + scoring)** | **7.0** | Emits, scores, flags correctly on real actions. Loses points for O(N²) writes, 600-cap data loss, no validation/dedup, two dead event types. |
| **Special Events Log** | **6.5** | Detection + 4 sub-scores work and are sensible. Loses points for `trade_loss` false-negative and dedup gaps. |
| **Content Instrumentation** | **6.0** | Rich metadata on core types; gaps in difficulty/cross-links/accuracy; named-concept taxonomy missing. |
| **Content Database** | **3.5** | `content_events` solid w/ indexes + RLS. But 4 of 5 tables orphaned, 500-row read cap, no aggregates, anon-writable. |
| **Replay Manager** | **2.5** | Captures trade films locally, but capped at 50, never mirrored, not reproducible, dashboard cross-device empty. |
| **Export System** | **3.0** | Valid JSON metadata package per platform. No media, no screenshots, no export history. |
| **Search System** | **4.0** | Core filters work; **silently returns wrong results on unsupported filters** (trust-breaking); missing difficulty/skill/date-range. |
| **AI Content Director** | **5.5** | Produces sensible pillar/urgency/angle briefs and prioritizes boss wins. Drops losses, duplicates briefs, no continuity, rules-only (by design). |
| **Social Agent Framework** | **6.0** | Clean interfaces as specified; publish intentionally stubbed. Fine for this phase. |
| **Dashboard Integration** | **6.0** | Panels render live data, search/detail/export work end-to-end (verified earlier). Capped reads + live-mode cross-origin blindness pull it down. |
| **🎯 Overall Content Engine** | **4.6 / 10** | A correct, well-scored **event logger** sitting on a **mostly-unwired pipeline**. The capture brain works; the storage, replay, export, and persistence limbs are stubs or orphaned. |

---

## Can a creator actually find content today?

- **Winning trades / boss victories / educational moments / rank-ups:** ✅ yes — captured, scored, special-tagged, searchable by type/text, and surfaced as Director briefs.
- **Funny failures / near-misses:** ⚠ partial — `boss_failed` and `mini_game_failed` captured, but `risk_management_failure` (the richest "cautionary" source) is never emitted.
- **"Impressive gameplay" as shareable media:** ❌ no — there is no clip/screenshot/video output; only JSON descriptions. A human still has to go record the screen.

**Verdict:** the system tells you *what* is worth clipping and *why* (that's real and valuable), but it cannot yet *produce the clip*. It's a content **scout**, not yet a content **factory**.

## Recommended fix order (1 week)

P0: persist replays + briefs + exports to their tables (#2,#3); fix silent 600-cap loss (#1); fix search false-positives (#5). 
P1: debounce writes (#6); emit `risk_management_failure`/`achievement_unlocked` (#7,#8); always-triage losses (#9); dedup (#10); cloud-read aggregates (#11); retry/queue cloud writes (#12). 
Then revisit media export (#4) as its own milestone.
