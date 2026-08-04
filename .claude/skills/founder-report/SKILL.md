---
name: founder-report
description: Generate the weekly ChartQuest closed-beta Founder Report — funnel, drop-off, sentiment themes and the top five priorities — from the live beta_events and beta_surveys tables. Use when the founder asks for the beta report, weekly numbers, how the beta is going, what testers said, or where players are dropping off.
---

# Weekly Founder Report

Produces the one document the founder reads each week: **what players loved, where they got
confused, where they stopped playing, and what to build next** — without anyone reading every
survey response by hand.

## Run it

**1 · Pull the window.** Use the Supabase MCP (project `ymxppzhczvmiuoncuqqu`) and write the
result to a JSON file. Default window is 7 days; the founder may ask for a different one.

```sql
select json_build_object(
  'events',  coalesce((select json_agg(e) from public.beta_events  e
                        where e.created_at >= now() - interval '7 days'), '[]'::json),
  'surveys', coalesce((select json_agg(s) from public.beta_surveys s
                        where s.created_at >= now() - interval '7 days'), '[]'::json)
) as blob;
```

Save the `blob` value verbatim to `/tmp/beta.json`.

**2 · Generate the quantitative report.**

```bash
python3 scripts/founder_report.py --data /tmp/beta.json --days 7
```

**3 · Add the synthesis — this is the part that needs you.** The script clusters free text by
keyword and labels those clusters *candidates*. Read the verbatims it prints and rewrite the
**Themes** and **Top Five Founder Priorities** sections properly:

- Group by what testers actually *meant*, not which words they used. "my thumb covers the
  screen", "I kept falling" and "the jump feels floaty" are one finding about mobile controls,
  and the keyword clusterer will scatter them across three themes.
- One tester saying something twice is one data point. On a ten-person beta, two independent
  people is a signal and three is a priority.
- Rank priorities by **players lost**, not by how loudly something was said. The funnel table
  is the arbiter; the quotes explain *why*.
- Quote testers directly. The founder should be able to hear them.

**4 · Save it** to the project root as `CHARTQUEST_FOUNDER_REPORT_<YYYY-MM-DD>.md` (house rule:
every report is a dated markdown file in the root).

## Reading the funnel

The stages are `session_start → tutorial_started → first_trade_started → boss_started →
journal_discovery_completed → survey_submitted`. Each is once-per-player, so the columns are
true conversion rates, not event counts.

**Before concluding that a stage is broken, rule out instrumentation.** A stage that reads 0%
is far more often a reporting failure than a play failure:

- `tutorial_started` is detected by polling `introFlow.active`, so a player who skips the intro
  entirely never fires it and appears to have dropped at stage 2 while actually playing on.
- Everything after `session_start` comes from inside the game iframe. If the game fails to load,
  the whole funnel below the landing page reads zero.
- All of it dies silently if the origin allowlist in the `beta-ingest` edge function does not
  include the domain being played on. This has bitten this project before, on a domain move.

## If there is no data

Do not report "nobody played" without checking the pipe first:

```sql
select name, count(*), max(created_at) from public.beta_events group by name order by 2 desc;
```

Then confirm the edge function is reachable from the live origin:

```bash
curl -sS -X OPTIONS https://ymxppzhczvmiuoncuqqu.supabase.co/functions/v1/beta-ingest \
  -H "Origin: https://playchartquest.com" -H "Access-Control-Request-Method: POST" -D - -o /dev/null
```

The `access-control-allow-origin` header in the response must echo the origin **exactly**.
Returning a prefix (`https://playchartquest.com` vs a bare `https://playchartquest`) makes every
browser call fail with an opaque "Failed to fetch" while curl still succeeds, because curl does
not enforce CORS.

## What the system records

Zero-interaction, cookieless, no third parties, no personal data. Player identity is the game's
existing random `cq_pid` string.

`session_start` · `session_end` (with duration) · `return_visit` · `tutorial_started` ·
`tutorial_completed` · `first_trade_started` · `first_trade_won` · `first_trade_lost` ·
`boss_started` · `boss_defeated` · `journal_unlocked` · `journal_discovery_started` ·
`journal_discovery_completed` · `beta_completed` · `survey_started` · `survey_submitted` ·
`crash` — each with device, browser, OS, screen and viewport.

Progress milestones are recorded **once per player**, so a replay cannot inflate the funnel.

## Where the pieces live

| Piece | Path |
|---|---|
| Analytics client (canonical) | `website/assets/cq-track.js` |
| Inlined copy in the game | `chart-quest.html` — sync with `python3 scripts/sync_track.py` |
| Beta gate + completion ceremony | `chart-quest.html` — `window.CQBeta` |
| Survey (5 questions) | `website/survey.html` |
| Write path | Supabase edge function `beta-ingest` |
| Tables | `public.beta_events`, `public.beta_surveys` |
| This report | `scripts/founder_report.py` |
