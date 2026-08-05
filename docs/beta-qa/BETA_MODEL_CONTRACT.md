# BetaModel — the one data contract for the Beta Test QA dashboard

**Status:** canonical. Two independent engines implement this shape and a parity harness proves
they agree:

| Engine | Where | Mode | Scales to |
|---|---|---|---|
| SQL | `automation/migrations/0011…0013_*.sql` | **live** (admin JWT → PostgREST RPC) | thousands of testers — all aggregation server-side |
| JS  | `beta-qa/beta-model.js` | **snapshot** (`beta-data.json` from `scripts/beta_pull.py`) | a few thousand rows, in-browser |

The UI renders **only** this shape. It never touches `beta_events` rows directly, so swapping the
source cannot change a number.

---

## 0 · Ground truth about the event stream

Read this before adding any metric. Every line here is a bug someone already shipped.

1. **Milestones are once-per-player, forever** (`ONCE[]` in `cq-track.js`, backed by
   localStorage). `first_trade_won` is a funnel stage, not a counter. Never `count(*)` a
   milestone — always `count(distinct player_id)`.

2. **The funnel must be monotonic.** Six independently-collected sets will report "kept from
   previous > 100%" whenever an event is lost or arrives out of order. Take each player's
   **furthest** stage and credit every stage before it. (`monotonic_stages()` in
   `scripts/founder_report.py`.)

3. **`tutorial_completed` does not mean the tutorial.** It is wired to `introComplete()`, which
   the game calls from `bossFinish()` when `level == 1` — i.e. *after* Guardian 1. The honest
   label is **"Intro chain completed (ends after Guardian 1)"**. Labelling it tutorial
   completion invites exactly the wrong diagnosis: 0% tutorial and 0% boss are very different
   problems.

4. **One session per visit, not one per document.** A tester's journey loads `cq-track.js` four
   times (index → play → game iframe → survey), all same-origin, all sharing one
   `sessionStorage` session id. Only the document that mints it fires `session_start`.
   Consequence: **clicking Play fires no event at all.** `page='play'` on a `session_start` means
   the tester *arrived directly* at play.html, not that they clicked through.

5. **Session length must be filtered to game pages.** Pooling a 6-second landing-page view with
   a 15-minute play session made the median meaningless (read 0.2 min against a real 44s+).
   Count `session_end.props.seconds` only where `props.page ∈ ('game','chart-quest','play')`.

6. **`completion_seconds` is re-sent on every later `session_end`.** Counting rows lets one
   finisher dominate the median. Take **one value per player** (their first non-null).

7. **Test players pollute the numbers.** `founder_report.py` excludes
   `CERT-TEST*, e2e-*, selftest*, browsertest*, QA-*, DEV-*`. The live data also contains
   `VERIFY-*` and `GATE-*` ids that list misses and which *are currently being counted*. The
   canonical list below adds them. Exclusions are always **shown, never silent** — a
   suspiciously small cohort must never be a mystery.

8. **A 0% stage is more often broken instrumentation than a broken game.** `tutorial_started` is
   detected by polling `introFlow.active`, so a tester who skips the intro never fires it. And
   everything below `session_start` dies silently if the `beta-ingest` origin allowlist misses
   the domain being played on — which has bitten this project on a domain move. Any stage
   reading 0 renders with a **"check instrumentation"** affordance, not a red drop-off.

9. **Country and language are not collected, by design** (no cookies, no IP storage, no third
   parties). The dashboard states this explicitly rather than rendering an empty column.

10. **Not every crash is your crash.** `window.onerror` fires for every script on the page,
    including ones ChartQuest does not ship. Two rows thrown inside Cloudflare's analytics
    beacon (`t.entries.at is not a function`, Windows/Chrome) were read as an iOS Safari
    incompatibility in ChartQuest's own code and reported as a finding. **Nothing in this repo
    calls `.at()`.** Every crash therefore carries `origin` (`self` | `third_party` | `local`)
    and `source_host`, derived from `props.where` for rows collected before build 341, and *our*
    crashes always sort above the other two however many people the foreign script hit.

    A crash with **no** http(s) filename — inline code, or a CORS-sanitized `Script error.` —
    counts as **ours**. Over-owning is the safe direction: a false "ours" costs a wasted look,
    a false "theirs" files a real bug under someone else's name and it never gets fixed.

    A third value, **`local`**, marks a crash thrown on `localhost` / `127.0.0.1` / `[::1]` —
    someone on the team with the game open, not a beta tester. It exists because a dev
    build-tag syntax error was already sitting in `beta_events` counted as a real tester crash,
    and the test-player exclusion list *structurally cannot* catch it: that matches player-id
    **prefixes**, and a dev browser mints an ordinary `p-` id like anyone else.

    **Precedence: `local` > `third_party` > `self`.** On a dev machine nothing in the session is
    beta data, so which script threw is a detail — `source_host` still records it. The live
    stamp decides from the **page** host, not the script's; the retroactive derivation can only
    use `props.where`, so a pre-342 dev crash thrown by *inline* code stays `self`. Host tests
    are **anchored** — `localhost.evil.com` is not a dev machine.

    The cap in `cq-track.js` is per-origin for the same reason
    (`CAP_SELF=3`, `CAP_THIRD=2`, `CAP_LOCAL=3`).
    One shared cap of 3 meant two foreign errors ate two thirds of the session budget, so a
    third-party script throwing in a loop — exactly what a broken beacon does — would silently
    discard every real crash for that visit while the gap looked like a clean session.

### Canonical test-player prefixes

```
CERT-TEST · e2e- · selftest · browsertest · QA- · DEV- · VERIFY- · GATE- · SMOKE- · TEST-
```

**The match is case-INSENSITIVE.** This is part of the contract, not an implementation detail:
`beta-model.js` originally matched case-sensitively while the SQL lowercased first, so
`Gate-B-003` was excluded from the live dashboard and counted in snapshot mode — two different
average ratings for identical data, depending only on whether the founder was signed in. There
is no false-positive risk: real ids are `'p-' + base36` (`pid()` in `cq-track.js`), so no genuine
tester id can begin with any of these.

The list is implemented three times, in three languages, because the same rule must run in a
Python report, a browser engine and a Postgres function:

| Implementation | Symbol |
|---|---|
| `scripts/founder_report.py` | `EXCLUDE_PREFIXES` |
| `beta-qa/beta-model.js` | `TEST_PREFIXES` |
| `automation/migrations/0011_beta_analytics_rpcs.sql` | `cfg.test_prefixes` (lowercased LIKE patterns) |

They have drifted twice already, and both times it moved a headline number rather than breaking
anything visibly — a silent disagreement here is indistinguishable from a real change in the beta
numbers. **`python3 scripts/check_test_prefixes.py` asserts all three agree** (and that the
migration's repeated copies agree with each other). Run it after touching any of them.

---

## 1 · Funnel stages

`instrumented: false` stages render greyed with a "not instrumented" badge and are **excluded
from drop-off maths** — they must never manufacture a 100% loss.

**`gating: false` is a different thing and must not be confused with it.** A non-gating stage IS
measured: it reports the **raw** number of players who fired its event and a share of landing.
But it is not a gate anyone must pass through, so it takes no part in the monotonic chain and
claims no transition (`kept_from_prev_pct`, `drop_players`, `drop_pct` are null). The gating
chain closes over it, so `landing → tutorial` is still measured end to end.

Both build-343 stages are non-gating, for different reasons, and getting this wrong produces a
confident useless number rather than an obvious break:

- **`play_click`** — the monotonic pass credits every stage below a player's furthest, so a
  gating `play_click` would be credited to everyone who reached the tutorial: an exact clone of
  the tutorial count at 100% kept and 0 drop, **concealing the landing→play gap it exists to
  measure**. It would not even look broken — the "check instrumentation" affordance only fires
  at `players === 0`. It is also blind by construction to `bosses.html` / `courses.html` (no
  tracker), the PWA shortcut and direct `/play` arrivals, so it can legitimately read *lower*
  than the stage after it.
- **`movement`** — the Journey Through the Blockchain is **skippable**. A player can skip it and
  still reach the first trade, so monotonic credit would hand them a completion they never
  earned. As a raw count it answers a real question: how many testers actually learned to move.

> ⚠ **SQL lag.** `beta_funnel_stages` still marks both `instrumented = false`, so live mode
> renders them as "not instrumented". Teaching the SQL engine non-gating needs six coordinated
> changes to `beta_model()`'s funnel CTEs; half-applying it would reproduce the clone bug in
> live mode. Snapshot mode is fully correct.

| # | key | label | event | instrumented |
|---|---|---|---|---|
| 1 | `landing` | Landing page | `session_start` | ✅ |
| 2 | `play_click` | Play clicked | `play_clicked` | ✅ **non-gating** (build 343) |
| 3 | `tutorial` | Tutorial started | `tutorial_started` | ✅ |
| 4 | `movement` | Movement tutorial completed | `movement_tutorial_completed` | ✅ **non-gating** (build 343) |
| 5 | `intro_done` | Intro chain completed (ends after Guardian 1) | `tutorial_completed` | ✅ |
| 6 | `trade` | First trade | `first_trade_started` | ✅ |
| 7 | `boss` | Boss started | `boss_started` | ✅ |
| 8 | `boss_won` | Boss defeated | `boss_defeated` | ✅ |
| 9 | `journal_unlock` | Journal unlocked | `journal_unlocked` | ✅ |
| 10 | `journal` | Journal Discovery completed | `journal_discovery_completed` | ✅ |
| 11 | `completed` | Beta completed | `beta_completed` | ✅ |
| 12 | `survey_start` | Survey started | `survey_started` | ✅ |
| 13 | `survey` | Survey submitted | `survey_submitted` | ✅ |

> **Ordering is load-bearing — do not "fix" it to put completion last.** `beta_completed` is
> stamped by the completion ceremony, which then *hands off* to the survey. Verified in the live
> data: the only player with both fired `beta_completed` at 15:28:59 and `survey_submitted` at
> 15:32:53.
>
> An earlier draft of this contract put `completed` at the end. Because the monotonic pass credits
> every stage *before* a player's furthest one, that ordering silently credited `survey_started`
> and `survey_submitted` to all four players who merely finished the beta — reporting the survey
> stage as **4 players, 100% kept**. The true numbers are 4 started and **1 submitted**. The bad
> order did not just misreport a stage: it perfectly concealed a 75% drop-off at the survey
> handoff, which is the third-largest leak in the funnel.

---

## 2 · The shape

```jsonc
{
  "meta": {
    "generated_at": "ISO-8601",
    "source": "live" | "snapshot",
    "window_days": 7,                  // 0 = all time
    "window_from": "ISO-8601",
    "build_filter": "335" | null,
    "excluded_players": 3,             // test ids removed
    "excluded_events": 41,
    "event_count": 206,
    "survey_count": 2
  },

  "kpis": {
    // every entry: { value, prev, delta_pct, trend: "up"|"down"|"flat", n, unit, note }
    // `prev` is the immediately preceding window of equal length. trend is "flat" when the
    // window is too small to call (n < 5) — never render a 100% swing off one player.
    "players_total": {…}, "players_new": {…}, "players_returning": {…},
    "sessions": {…}, "completed_runs": {…},
    "avg_session_seconds": {…}, "median_session_seconds": {…},
    "avg_rating": {…},
    "survey_completion_pct": {…},      // survey_submitted ÷ beta_completed
    "intro_completion_pct": {…},       // NOT "tutorial" — see §0.3
    "boss_completion_pct": {…}, "journal_completion_pct": {…},
    "avg_time_to_boss_seconds": {…}, "median_time_to_completion_seconds": {…},
    "crash_players": {…},
    "health_score": {…}                // 0-100, see §3
  },

  "funnel": [
    { "key":"landing", "label":"Landing page", "instrumented":true,
      "players":25, "pct_of_top":100, "kept_from_prev_pct":null,
      "drop_players":0, "drop_pct":0,
      "median_seconds_from_start":0,   // null when unknown
      "is_bottleneck":false }
  ],

  "timeseries": [                       // one row per UTC day, ascending
    { "day":"2026-08-04", "players":17, "new_players":12, "sessions":31,
      "completions":3, "surveys":1, "avg_rating":8, "crashes":5,
      "avg_session_seconds":221, "reached_trade":3, "reached_boss":2 }
  ],

  "players": [                          // roster; live mode paginates, snapshot mode is complete
    { "player_id":"p-le781a1a7t", "first_seen":"…", "last_seen":"…",
      "sessions":6, "total_seconds":1840, "visits":6,
      "device":"mobile", "browser":"Safari", "os":"iOS",
      "screen":"390x844", "viewport":"390x699",
      "builds":["335"], "furthest_stage":"boss", "furthest_label":"Boss started",
      "exit_stage":"boss_started",
      "trade_result":"won"|"lost"|"started"|null,
      "boss_result":"defeated"|"started"|null,
      "journal_result":"completed"|"started"|"skipped"|"unlocked"|null,
      "survey_rating":9|null, "survey_continue":"immediately"|null,
      "completion_seconds":1022|null, "crashes":0, "is_test":false }
  ],
  "players_total": 25,                  // roster size before pagination

  "timeline": {                         // only when a player is selected (beta_player_detail)
    "player_id":"…",
    "events":[ { "ts":"…", "offset_seconds":0, "name":"session_start",
                 "label":"Website opened", "props":{…}, "kind":"milestone"|"session"|"crash" } ],
    "survey": { … full beta_surveys row … } | null
  },

  "surveys": {
    "n": 2, "avg_rating": 8.0,
    "rating_dist": { "1":0, …, "10":0 },
    "continue_dist": { "immediately":1, "later":1, "not_interested":0 },
    "rating_trend": [ { "day":"2026-08-04", "avg":8.0, "n":2 } ],
    "responses": [ { "player_id":"…", "created_at":"…", "q1_rating":7,
                     "q2_hook":"…", "q3_improvement":"…",
                     "q4_continue":"later", "q5_anything":"…",
                     "seconds_taken":229 } ]
  },

  "builds": [
    { "build":"335", "players":17, "sessions":31, "first_seen":"…", "last_seen":"…",
      "completion_pct":18, "avg_rating":8.0, "boss_pct":12, "journal_pct":6,
      "survey_pct":12, "median_completion_seconds":1022, "crashes":5, "crash_players":4 }
  ],

  "crashes": [
    { "message":"…", "kind":"boot", "where":"…", "build":"335",
      "count":3, "players":2, "first_seen":"…", "last_seen":"…",
      "origin":"self" | "third_party" | "local",   // see §0.10
      "source_host":"static.cloudflareinsights.com" | null }
  ],

  "tech": {
    "device":  { "desktop":18, "mobile":6, "tablet":1 },
    "browser": { "Chrome":20, "Safari":5 },
    "os":      { "macOS":18, "iOS":6 },
    "viewport":{ "390x699":6 }
  }
}
```

### Build attribution

A player is attributed to the build of their **first event in the window that carries a
non-empty `props.build`** — an entry cohort. This keeps `completion_pct` a real per-cohort rate
instead of double-counting a tester who spanned two builds. Rows with no build anywhere are
grouped under `"(unknown)"` and the UI says so.

---

## 3 · Health score

A single 0–100 number the founder can watch. Deliberately simple and **printed with its own
breakdown** — a composite nobody can decompose is a number nobody trusts.

| Component | Weight | Full marks at |
|---|---:|---|
| Funnel throughput — % of landing that reaches First trade | 30 | 40% |
| Completion — % of landing that reaches Beta completed | 25 | 25% |
| Enjoyment — mean `q1_rating` | 20 | 8.5 / 10 |
| Retention intent — % answering `immediately` or `later` | 15 | 85% |
| Stability — 1 − (players with a crash ÷ players) | 10 | 0 crashes |

Each component is `min(1, actual ÷ full_marks) × weight`. Components with **n < 3 are dropped
and the remaining weights renormalised**, and the UI shows which were dropped. A health score
driven by one survey response is worse than no score.

---

## 4 · Alerts

Computed from the model, never hand-written. Each: `{ level: "critical"|"warn"|"info", title,
detail, evidence, players_affected }`. An alert **must** carry the player count that triggered
it.

| Rule | Level | Fires when |
|---|---|---|
| Stage bottleneck | critical | a stage loses ≥40% of the previous stage **and** the previous stage has n ≥ 5 |
| Rating decline | warn | window mean `q1_rating` < 8 with n ≥ 3 |
| Rating collapse | critical | window mean drops ≥ 1.5 vs previous window, both n ≥ 3 |
| Survey completion | warn | `survey_submitted ÷ beta_completed` < 80% with ≥ 5 completions |
| Boss regression | critical | boss completion % down ≥ 15pts vs the previous build, both n ≥ 5 |
| Repeat crash | critical | the same crash message hits ≥ 2 players |
| Silent funnel | warn | ≥ 5 players landed and **zero** reached `tutorial_started` → suspect instrumentation, not players |
| No data | info | zero events in window → check the pipe before concluding nobody played |

`n ≥ 5` gates exist because a 1-of-1 loss must never outrank a 7-of-13 loss. This is the exact
mistake that would send week one at the wrong problem.

---

## 5 · Recommendations

Ranked by **players lost**, never by how loudly something was said. The funnel is the arbiter;
the quotes explain *why*.

```jsonc
{ "priority":"HIGH"|"MEDIUM"|"LOW", "title":"…", "reason":"…",
  "evidence":["verbatim or metric", …], "players_affected":8,
  "estimated_impact":"…", "estimated_effort":"Low"|"Medium"|"High",
  "confidence":"High"|"Medium"|"Low", "source":"funnel"|"survey"|"crash" }
```

Confidence is **Low** below n=3, **Medium** at 3–4, **High** at n ≥ 5. On a ten-person beta one
tester saying something twice is one data point; two independent people is a signal; three is a
priority.

---

## 6 · RPC surface (live mode)

All `security definer`, all guarded by `public.is_admin()`, all **revoked from `public` and
`anon` in the same migration**.

> Postgres grants `EXECUTE` to `PUBLIC` by default, so a new `SECURITY DEFINER` function is
> anon-callable with the publishable key the moment it is created. This project has already had
> a near-miss where `prune_beta_events(0)` could have deleted the entire beta dataset. The
> `REVOKE` is not optional and must be in the same migration as the `CREATE`.

| Function | Returns |
|---|---|
| `beta_model(p_days int, p_build text)` | `meta` + `kpis` + `funnel` + `timeseries` + `surveys` + `builds` + `crashes` + `tech` in one round trip |
| `beta_players(p_days, p_build, p_limit, p_offset, p_search, p_stage)` | `{ rows, total }` |
| `beta_player_detail(p_player_id text)` | `timeline` |
| `beta_search(p_q text, p_limit int)` | `{ players, surveys, crashes }` |

One round trip for the whole dashboard, one more per drill-down. No raw-row reads.
