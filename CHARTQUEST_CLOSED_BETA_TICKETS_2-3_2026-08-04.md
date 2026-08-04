# ChartQuest — Closed Beta: tickets 2 & 3

**Date:** 2026-08-04 · **Branch:** `feature/closed-beta` · **Builds:** 326, 327
**Status:** IMPLEMENTED and verified end-to-end. **Not merged. Not deployed.**

---

## What now happens

```
Landing page → Play Free → Tutorial → Level 1 → First Trade → Boss 1 (the Gambler)
   → Boss Defeat → Journal Unlock → Journal Discovery
   → ✦ completion ceremony ✦ → Beta Survey (5 questions) → Thank You
```

Nothing past Journal Discovery is reachable. Verified by driving the real chain in a browser:
the game's Continue button posts to `play.html`, which navigates the top window to the survey;
the survey submits; the row lands in Postgres; the thank-you screen renders.

---

## Ticket 2 — the closed beta experience

### `window.CQBeta` — one `<script>` block at the end of `chart-quest.html`

**Built merge-safe on purpose**, because other sessions are editing that file right now:

- It **patches at runtime** (`introComplete`, `CQJournalTutorial.claimPostBoss`) instead of
  editing their call sites. Not one line above the new block changed.
- Deleting the block restores build 325 exactly.
- Every hook is `try`/caught — if any of it throws, the game behaves as if the module were absent.

**The handover is deterministic, not timed.** `claimPostBoss` returns `true` when the Journal
quest takes the moment over, and fires the callback it was handed when the quest finishes. We
wrap that callback, so the beta ends at the *true* end of Journal Discovery. We capture its
**return value** rather than polling `isActive()`, so there is no race against its 900 ms settle.
When it returns `false` — a veteran who already owns the Journal — an `introComplete` wrapper
finishes instead. A slow level guard catches any other route into L2+.

### The ceremony

Staged reveal (seal → confetti burst → title → three lines → button), gold/green to match the
game, `GameMusic.sting('bigwin')`, fully inline-styled so it cannot be broken by a stylesheet
another session is editing. Honours `prefers-reduced-motion`. Verified at a true 390×844 viewport.

### QA handles

| | |
|---|---|
| `?beta=0` | disable the gate for one load (play on into L2) |
| `CQBeta.devFinish()` | run the ceremony now |
| `CQBeta.reset()` | clear the completion flag |
| `CQBeta.state()` | `{enabled, done, finished, patched, surveyUrl}` |

---

## Ticket 3 — feedback, analytics, Founder Report

### Analytics — `window.CQTrack`

Cookieless. No third parties. No personal data. No IP stored. Player identity is the game's
existing random `cq_pid`, so a tester is **one person** across the landing page, the game and
the survey rather than three strangers.

Everything the ticket asked for is recorded with zero interaction: tutorial started/completed,
first trade started/won/lost, boss started/defeated, journal unlocked/discovery started/completed,
beta completed, survey started/submitted, session length, completion time, return visits, device,
browser, OS, screen, viewport, and crashes (`onerror` + `unhandledrejection`, capped at 3/session
so one broken frame cannot burn the rate limit).

Two properties worth knowing:

- **Milestones are once-per-player.** "First trade won" is a funnel stage, not a counter; a replay
  cannot inflate it.
- **Every event carries a client-generated id** which the edge function upserts on, so a retry
  after a flaky mobile connection cannot double-count a stage.

### The duplication, and the guard on it

The game is one self-contained document and cannot `<script src>` a sibling file, so the client
exists twice: `website/assets/cq-track.js` (canonical) and an inlined copy in `chart-quest.html`.

```bash
python3 scripts/sync_track.py           # regenerate the inlined copy
python3 scripts/sync_track.py --check   # fails if they have drifted
```

It already caught one real drift while this was being built. **Add `--check` to the ship gate.**

### Write path — new, isolated

A **new** `beta-ingest` edge function and **new** `beta_events` / `beta_surveys` tables. The live
`ingest` function and every existing table are untouched: a mistake in new beta code must not be
able to take down `player_mastery` or the content pipeline. RLS on, **no anon policies**,
service-role writes only, per-field whitelist, per-IP rate limit reusing `bump_ingest_throttle`.

### The survey

`website/survey.html` — five questions exactly as specified, three of them a single tap, one
question per screen with a progress bar, drafts saved to `localStorage` so a refresh cannot eat
someone's typing. Submits in well under a minute.

### The report

```bash
python3 scripts/founder_report.py --data /tmp/beta.json --days 7
```

Or `/founder-report` — the skill at `.claude/skills/founder-report/SKILL.md` documents the
weekly workflow (pull → generate → write the synthesis → save a dated `.md`).

It computes every **number** honestly: cohorts, conversion, drop-off, ratings, session length,
devices, crashes. It clusters the free text by keyword but labels those clusters **candidates**
and prints the verbatims underneath — because a keyword counter presented as sentiment analysis
would look authoritative while being driven by two people using the same word. Reading the quotes
and writing the real synthesis is the skill's job.

---

## Things you should decide

1. **I created live infrastructure.** Two new tables and one new edge function now exist in the
   production Supabase project. Both are additive and inert until this branch ships, and nothing
   existing was modified — but it is a real change to your production project and you should know
   it happened rather than find it later.

2. **Not merged, not deployed.** The branch is `feature/closed-beta`. Deploying is your call.

3. **`verify.js #10` needed the documented override.** The beta adds two save keys
   (`cq_beta_done`, `cq_beta_done_at`); the count went 29 → 31 with **nothing removed or renamed**.
   I confirmed that before using `CQ_ALLOW_PROTECTED=1`.

4. **A veteran with saved Level 2+ progress will get the completion ceremony on load.** That is
   the gate working as specified ("nothing beyond this point should be accessible") — they have
   already seen every piece of beta content. If you would rather they got something softer, say so.

5. **`tutorial_started` is detected by polling `introFlow.active`.** A player who skips the intro
   never fires it and will look like they dropped at stage 2 while actually playing on. The skill
   documents this; worth remembering before reading it as a real funnel leak.

---

## Blockers from the ticket-1 audit that still apply

The audit found four separate fixes that all need a live survey URL. **That dependency is now
resolved** — `survey.html` exists. But these remain open and are worth doing before testers arrive:

- **`/courses` is live in production**, selling $149.99 of product that does not exist, with a
  checkout that alerts *"Set the link in assets/config.js."* Nothing else is more scam-shaped.
- **`/privacy` and `/terms` do not exist** — they serve the homepage. `game.html:1207` has a
  **required** consent checkbox linking to both. This now matters more, not less: the beta
  collects analytics, so the privacy policy needs to exist and to say so.
- **The roadmap still claims "10 worlds, 11 Guardians, playable free"** as the current phase.
- **`logo.png` is 1.78 MB**, eager, on the auth overlay — ~9.4 s of pure logo on slow 4G, on the
  primary CTA path.

Full detail: `CHARTQUEST_WEBSITE_BETA_LAUNCH_AUDIT_2026-08-04.md`.

---

## Files

| Path | What |
|---|---|
| `chart-quest.html` | `window.CQBeta` + inlined `CQTrack` (mirrored to `index.html`, `website/game.html`) |
| `website/assets/cq-track.js` | analytics client — **canonical source** |
| `website/survey.html` | the 5-question survey + thank-you |
| `website/play.html` | survey handoff listener; also fixes Restart dropping `?fresh`/`?mute` |
| `website/index.html` | loads the tracker so the funnel starts at the landing page |
| `scripts/sync_track.py` | generates + drift-checks the inlined copy |
| `scripts/founder_report.py` | the weekly report |
| `.claude/skills/founder-report/SKILL.md` | `/founder-report` |
| `supabase/functions/beta-ingest/index.ts` | deployed write path (v2) |
