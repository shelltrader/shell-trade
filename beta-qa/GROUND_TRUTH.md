# Independent ground truth — snapshot of 2026-08-04 (all time)

Computed by hand, outside both engines, so engine output can be checked rather than trusted.
Regenerate with the script in this project's session notes if the snapshot changes.

Source: `beta-qa/beta-data.json` — 205 events, 2 surveys, 27 raw player ids.

## Exclusions
- 2 test players / 17 events removed: `GATE-B-003`, `VERIFY-335-DEPLOY`
- **Both are missed by `founder_report.py`'s prefix list** and are being counted in the
  weekly report today. Notably `GATE-B-003` carries a survey (rating 9), which lifts the
  reported average from a true **7.0 (n=1)** to **8.0 (n=2)**.
- After exclusion: 188 events · **1** survey · **25** players

## Monotonic funnel (the arbiter)

Stage order matters: `beta_completed` fires **before** `survey_submitted` (the completion
ceremony hands off to the survey). Ordering completion last credits the survey stages to
everyone who finished and hides the survey leak entirely.

| stage | players | % of landing | kept from prev | lost |
|---|---:|---:|---:|---:|
| landing | 24 | 100.0% | — | — |
| tutorial | 13 | 54.2% | **54%** | **−11** |
| intro_done | 6 | 25.0% | **46%** | **−7** |
| trade | 6 | 25.0% | 100% | 0 |
| boss | 5 | 20.8% | 83% | −1 |
| boss_won | 5 | 20.8% | 100% | 0 |
| journal_unlock | 5 | 20.8% | 100% | 0 |
| journal | 4 | 16.7% | 80% | −1 |
| completed | 4 | 16.7% | 100% | 0 |
| survey_start | 4 | 16.7% | 100% | 0 |
| survey | 1 | 4.2% | **25%** | **−3** |

**Three real leaks, ranked by players lost:**
1. **landing → tutorial: −11 (46%)** — the largest, and it is entirely pre-gameplay.
2. **tutorial → intro chain: −7 (54%)** — note the intro chain only ends after Guardian 1.
3. **survey started → submitted: −3 (75%)** — 4 opened the survey, 1 finished it.

Leaks 1 and 2 clear the n≥5 gate. Leak 3 does not (n=4) and must be reported as a candidate,
not a conclusion — but it is real: only one non-test survey row exists against four starts.

Raw distinct-player counts, no monotonic credit, for comparison:
`landing 23 · tutorial 12 · intro_done 2 · trade 3 · boss 2 · boss_won 2 · journal_unlock 2 ·
journal 1 · completed 4 · survey_start 4 · survey 1`

## Session length
- Game pages only (`page ∈ game|chart-quest|play`): n=31, avg **1036s**, median **46s**
- Unfiltered (the trap): n=52, avg 626s — pooling landing views changes the answer

## Completion time
Per-player (first non-null), n=2: `[780, 6731]` seconds.

## Technical
- Devices: desktop 105, mobile 83 events
- Builds: `(unknown)` 156, `334` 25, `335` 7 — build comparison is mostly unattributed
- Crashes: 4 distinct messages, **each affecting 1 player** → the "repeat crash ≥2 players"
  alert must NOT fire. Useful negative test.
  - `Uncaught TypeError: t.entries.at is not a function`
  - `Uncaught TypeError: this.i.at is not a function`
  - `Failed to update a ServiceWorker for scope ('https://playcha…`
  - `Uncaught ReferenceError: Cannot access 'candleAcademy' before initialization`

> The two `.at is not a function` crashes are a genuine compatibility bug, not noise:
> `Array.prototype.at` is unsupported on iOS Safari below 15.4, and 83 of 188 events are mobile.
