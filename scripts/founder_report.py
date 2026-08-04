#!/usr/bin/env python3
"""ChartQuest — WEEKLY FOUNDER REPORT generator  (ticket 3)

Turns the closed-beta event stream + survey responses into the one document the founder
reads each week: what players loved, where they got confused, where they stopped playing,
and what to build next.

    # normal weekly run (needs a service key with read access)
    export SUPABASE_SERVICE_KEY=...
    python3 scripts/founder_report.py --days 7 > FOUNDER_REPORT_$(date +%F).md

    # offline / from a dump Claude fetched over MCP
    python3 scripts/founder_report.py --data beta.json --days 7

    # shape of --data:  {"events": [...rows of beta_events...],
    #                    "surveys": [...rows of beta_surveys...]}

WHAT THIS SCRIPT DOES AND DOES NOT DO
-------------------------------------
It computes every NUMBER honestly: cohort sizes, funnel conversion, drop-off, ratings,
session length, completion time, device split, crashes.

It does NOT pretend to do sentiment analysis. It clusters the free text by keyword into
candidate themes and prints the verbatims under each one. Reading those and writing the
actual synthesis is the job of whoever (or whatever) runs this — see
.claude/skills/founder-report/SKILL.md. A keyword counter dressed up as "sentiment" would
be worse than useless on a 10-person beta, because it would look authoritative while being
driven by two people using the same word.
"""
import argparse
import collections
import json
import os
import re
import sys
import urllib.request
from datetime import datetime, timedelta, timezone

PROJECT = 'ymxppzhczvmiuoncuqqu'
REST = f'https://{PROJECT}.supabase.co/rest/v1'

# ── the funnel, in order. (key, label, event name) ──────────────────────────────────────
# 'landing' is any session_start: the first thing that happens to anyone, on any page.
FUNNEL = [
    ('landing',  'Landing page',       'session_start'),
    ('tutorial', 'Tutorial started',   'tutorial_started'),
    ('trade',    'First trade',        'first_trade_started'),
    ('boss',     'Boss fight',         'boss_started'),
    ('journal',  'Journal Discovery',  'journal_discovery_completed'),
    ('survey',   'Survey submitted',   'survey_submitted'),
]

# Candidate themes for clustering free text. Deliberately ChartQuest-specific — generic
# sentiment lexicons say nothing useful about whether the boss telegraph is readable.
THEMES = {
    'Controls & movement': ['control', 'jump', 'move', 'boost', 'rocket', 'stuck', 'fell', 'falling',
                            'physics', 'touch', 'button', 'tap', 'swipe', 'joystick'],
    'Trading & setups':    ['trade', 'trading', 'setup', 'entry', 'stop', 'profit', 'buy', 'sell',
                            'long', 'short', 'position', 'risk'],
    'Boss fight':          ['boss', 'gambler', 'guardian', 'fight', 'battle', 'attack', 'roar'],
    'Teaching & clarity':  ['confus', 'unclear', 'understand', 'explain', 'lesson', 'tutorial',
                            'teach', 'learn', 'lost', 'know what', 'didn’t get', 'did not get'],
    'Chart & candles':     ['chart', 'candle', 'wick', 'green', 'red', 'price', 'market'],
    'Journal':             ['journal', 'notebook', 'page', 'chapter'],
    'Pacing & length':     ['slow', 'long', 'short', 'fast', 'drag', 'boring', 'repetitive', 'pace',
                            'wait', 'quick'],
    'Difficulty':          ['hard', 'easy', 'difficult', 'challeng', 'frustrat', 'unfair', 'died'],
    'Audio':               ['music', 'sound', 'audio', 'loud', 'mute', 'song'],
    'Visuals & art':       ['art', 'graphic', 'look', 'beautiful', 'pretty', 'ugly', 'visual',
                            'animation', 'colour', 'color'],
    'Performance & bugs':  ['lag', 'slow load', 'crash', 'bug', 'glitch', 'freeze', 'broke', 'stuck on',
                            'loading', 'wouldn’t load', 'would not load'],
    'Mobile experience':   ['phone', 'mobile', 'ipad', 'tablet', 'screen', 'portrait', 'landscape'],
    'Wanting more':        ['more level', 'world 2', 'next level', 'more content', 'keep going',
                            'more of', 'want more', 'continue'],
}

POSITIVE = ['love', 'loved', 'great', 'awesome', 'fun', 'brilliant', 'nice', 'cool', 'enjoy',
            'satisfying', 'addictive', 'clever', 'beautiful', 'smooth', 'good']
NEGATIVE = ['confus', 'boring', 'frustrat', 'annoying', 'hate', 'broke', 'bug', 'unclear',
            'hard to', 'too slow', 'too long', 'didn’t like', 'did not like', 'bad', 'worst']


# ── data access ─────────────────────────────────────────────────────────────────────────
def fetch(table, key, since_iso):
    url = f'{REST}/{table}?select=*&created_at=gte.{since_iso}&order=created_at.asc&limit=50000'
    req = urllib.request.Request(url, headers={
        'apikey': key, 'Authorization': f'Bearer {key}', 'Accept': 'application/json',
    })
    with urllib.request.urlopen(req, timeout=60) as r:
        return json.loads(r.read().decode())


def load(args):
    since = datetime.now(timezone.utc) - timedelta(days=args.days)
    since_iso = since.isoformat()
    if args.data:
        blob = json.load(open(args.data, encoding='utf-8'))
        ev, sv = blob.get('events', []), blob.get('surveys', [])
        keep = lambda r: str(r.get('created_at', '')) >= since_iso  # noqa: E731
        return [e for e in ev if keep(e)], [s for s in sv if keep(s)], since
    key = os.environ.get('SUPABASE_SERVICE_KEY')
    if not key:
        sys.exit('No --data file and SUPABASE_SERVICE_KEY is not set.\n'
                 'Either export the key, or pass a JSON dump with --data (see the docstring).')
    return fetch('beta_events', key, since_iso), fetch('beta_surveys', key, since_iso), since


# ── helpers ─────────────────────────────────────────────────────────────────────────────
def pct(n, d):
    return f'{(100.0 * n / d):.0f}%' if d else '—'


def bar(frac, width=22):
    fill = int(round(frac * width))
    return '█' * fill + '·' * (width - fill)


def players_with(events, name):
    return {e.get('player_id') for e in events if e.get('name') == name and e.get('player_id')}


def theme_hits(texts):
    """→ {theme: [verbatims]} — a response can land in several themes, which is correct:
    'the boss was confusing' is both a Boss and a Clarity data point."""
    out = collections.defaultdict(list)
    for t in texts:
        low = t.lower()
        for theme, words in THEMES.items():
            if any(w in low for w in words):
                out[theme].append(t)
    return out


def tone(text):
    low = text.lower()
    p = sum(1 for w in POSITIVE if w in low)
    n = sum(1 for w in NEGATIVE if w in low)
    return 'positive' if p > n else ('negative' if n > p else 'neutral')


def block(title, items, limit=6):
    if not items:
        return f'**{title}** — nothing yet.\n'
        # (an empty section is information: nobody mentioned it)
    lines = [f'**{title}** ({len(items)} mention{"s" if len(items) != 1 else ""})']
    for t in items[:limit]:
        t = re.sub(r'\s+', ' ', t).strip()
        lines.append(f'  - “{t[:240]}”')
    if len(items) > limit:
        lines.append(f'  - …and {len(items) - limit} more')
    return '\n'.join(lines) + '\n'


# ── report ──────────────────────────────────────────────────────────────────────────────
def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--days', type=int, default=7)
    ap.add_argument('--data', help='JSON dump instead of a live fetch')
    args = ap.parse_args()

    events, surveys, since = load(args)
    now = datetime.now(timezone.utc)

    out = []
    w = out.append

    w(f'# ChartQuest — Founder Report')
    w(f'**Window:** {since:%Y-%m-%d} → {now:%Y-%m-%d} ({args.days} days) · '
      f'generated {now:%Y-%m-%d %H:%M} UTC')
    w('')

    if not events and not surveys:
        w('> **No data in this window.** Either no one played, or the beta has not shipped yet.')
        w('> Before assuming the former, confirm analytics are actually reaching the database — '
          'the fastest check is a hard refresh of the landing page followed by '
          '`select count(*) from beta_events;`. A silent CORS or origin-allowlist failure looks '
          'exactly like "nobody played".')
        print('\n'.join(out))
        return

    players = {e.get('player_id') for e in events if e.get('player_id')}
    sessions = {e.get('session_id') for e in events if e.get('session_id')}
    returning = players_with(events, 'return_visit')
    new_players = players - returning

    # session length from session_end
    secs = [e['props'].get('seconds') for e in events
            if e.get('name') == 'session_end' and isinstance(e.get('props'), dict)
            and isinstance(e['props'].get('seconds'), (int, float))]
    avg_s = sum(secs) / len(secs) if secs else 0
    med_s = sorted(secs)[len(secs) // 2] if secs else 0

    comp = [e['props'].get('completion_seconds') for e in events
            if e.get('name') == 'session_end' and isinstance(e.get('props'), dict)
            and isinstance(e['props'].get('completion_seconds'), (int, float))]

    stage = {k: players_with(events, ev) for k, _, ev in FUNNEL}
    total = len(stage['landing']) or len(players)

    # ── 1 · overview ────────────────────────────────────────────────────────────────────
    w('## Beta Overview')
    w('')
    w('| | |')
    w('|---|---|')
    w(f'| Total testers | **{len(players)}** |')
    w(f'| New testers this window | {len(new_players)} |')
    w(f'| Returning testers | {len(returning)} |')
    w(f'| Sessions | {len(sessions)} |')
    w(f'| Average session | {avg_s / 60:.1f} min |')
    w(f'| Median session | {med_s / 60:.1f} min |')
    w(f'| Tutorial completion | {pct(len(players_with(events, "tutorial_completed")), total)} |')
    w(f'| Boss defeated | {pct(len(players_with(events, "boss_defeated")), total)} |')
    w(f'| Journal Discovery completed | {pct(len(stage["journal"]), total)} |')
    w(f'| Beta completed | {pct(len(players_with(events, "beta_completed")), total)} |')
    w(f'| Survey completion | {pct(len(surveys), total)} |')
    if comp:
        w(f'| Time to finish the beta (median) | {sorted(comp)[len(comp) // 2] / 60:.0f} min |')
    w('')

    # ── 2 · funnel ──────────────────────────────────────────────────────────────────────
    w('## Funnel')
    w('')
    w('| Stage | Players | % of landing | Kept from previous | |')
    w('|---|---:|---:|---:|---|')
    prev = None
    drops = []
    for key, label, _ in FUNNEL:
        n = len(stage[key])
        keep = pct(n, len(prev)) if prev is not None else '—'
        if prev is not None and len(prev):
            lost = len(prev) - n
            drops.append((lost, 100.0 * lost / len(prev), label, prev_label))
        w(f'| {label} | {n} | {pct(n, total)} | {keep} | `{bar(n / total if total else 0)}` |')
        prev, prev_label = stage[key], label
    w('')

    if drops:
        drops.sort(key=lambda d: (-d[1], -d[0]))
        worst = drops[0]
        w(f'**Biggest drop-off: {worst[3]} → {worst[2]}** — lost {worst[0]} of them '
          f'({worst[1]:.0f}%). This is the single highest-leverage thing to fix.')
        w('')
        others = [d for d in drops[1:] if d[1] >= 25 and d[0] > 0]
        if others:
            w('Also leaking:')
            for lost, p, label, prev_label in others:
                w(f'- {prev_label} → {label}: −{lost} ({p:.0f}%)')
            w('')

    # ── 3 · ratings ─────────────────────────────────────────────────────────────────────
    if surveys:
        ratings = [s['q1_rating'] for s in surveys if isinstance(s.get('q1_rating'), int)]
        w('## What they said')
        w('')
        if ratings:
            avg = sum(ratings) / len(ratings)
            w(f'**Overall experience: {avg:.1f} / 10** (n={len(ratings)})')
            w('')
            hist = collections.Counter(ratings)
            for score in range(10, 0, -1):
                c = hist.get(score, 0)
                if c:
                    w(f'`{score:>2}` {bar(c / len(ratings), 18)} {c}')
            w('')
        cont = collections.Counter(s.get('q4_continue') for s in surveys if s.get('q4_continue'))
        if cont:
            label = {'immediately': 'Would play World 2 immediately',
                     'later': 'Would probably continue later',
                     'not_interested': 'Not interested'}
            w('**If World 2 were available today:**')
            w('')
            for k in ('immediately', 'later', 'not_interested'):
                if cont.get(k):
                    w(f'- {label[k]}: **{cont[k]}** ({pct(cont[k], len(surveys))})')
            w('')

        # ── 4 · themes ──────────────────────────────────────────────────────────────────
        hooks = [s['q2_hook'] for s in surveys if (s.get('q2_hook') or '').strip()]
        improves = [s['q3_improvement'] for s in surveys if (s.get('q3_improvement') or '').strip()]
        extras = [s['q5_anything'] for s in surveys if (s.get('q5_anything') or '').strip()]

        w('### Themes')
        w('')
        w('_Keyword clusters over the free text, with the raw quotes underneath. '
          'These are candidates, not conclusions — read the quotes._')
        w('')

        praise = [t for t in hooks + extras if tone(t) == 'positive']
        criticism = [t for t in improves + extras if tone(t) == 'negative']
        confusion = theme_hits(hooks + improves + extras).get('Teaching & clarity', [])
        wants = theme_hits(improves + extras).get('Wanting more', [])

        w(block('Most common praise', praise))
        w(block('Most common criticism', criticism))
        w(block('Most common confusion', confusion))
        w(block('Most requested', wants))

        w('#### Every theme, by weight')
        w('')
        all_themes = theme_hits(hooks + improves + extras)
        for theme, items in sorted(all_themes.items(), key=lambda kv: -len(kv[1])):
            w(f'- **{theme}** — {len(items)}')
        w('')

        def quotes(heading, texts):
            if not texts:
                return
            w(f'### {heading}')
            w('')
            for t in texts:
                w('- “' + re.sub(r'\s+', ' ', t).strip()[:300] + '”')
            w('')

        quotes('The hook — when it clicked', hooks)
        quotes('One thing to change', improves)
        quotes('Anything else', extras)
    else:
        w('## What they said')
        w('')
        w('No survey responses in this window.')
        if stage['journal']:
            w('')
            w(f'> ⚠ {len(stage["journal"])} player(s) finished Journal Discovery but nobody '
              f'submitted the survey. That points at the survey handoff, not at the players — '
              f'check that the Continue button on the completion ceremony reaches survey.html.')
        w('')

    # ── 5 · technical ───────────────────────────────────────────────────────────────────
    w('## Technical')
    w('')
    dev = collections.Counter(e.get('device') for e in events if e.get('device'))
    brw = collections.Counter(e.get('browser') for e in events if e.get('browser'))
    res = collections.Counter(e.get('viewport') for e in events if e.get('viewport'))
    if dev:
        w('**Device:** ' + ' · '.join(f'{k} {pct(v, sum(dev.values()))}' for k, v in dev.most_common()))
    if brw:
        w('**Browser:** ' + ' · '.join(f'{k} {pct(v, sum(brw.values()))}' for k, v in brw.most_common(5)))
    if res:
        w('**Top viewports:** ' + ' · '.join(f'{k} ({v})' for k, v in res.most_common(5)))
    w('')

    crashes = [e for e in events if e.get('name') == 'crash']
    if crashes:
        w(f'### ⚠ Crashes — {len(crashes)} across {len({c.get("player_id") for c in crashes})} player(s)')
        w('')
        msgs = collections.Counter(
            (c.get('props') or {}).get('message', '')[:160] for c in crashes)
        for m, c in msgs.most_common(8):
            w(f'- `{m}` × {c}')
        w('')
    else:
        w('No crashes recorded. ')
        w('')

    # ── 6 · priorities ──────────────────────────────────────────────────────────────────
    w('## Top Five Founder Priorities')
    w('')
    w('_Generated from the drop-off table and the survey text. Ranked by how many players '
      'each one is currently costing._')
    w('')
    pri = []
    if drops:
        lost, p, label, prev_label = drops[0]
        if lost > 0:
            pri.append((lost * 10, f'**Fix the {prev_label} → {label} drop-off.** '
                                   f'{lost} player(s) — {p:.0f}% of everyone who reached '
                                   f'"{prev_label}" — stop here. Nothing else in this report '
                                   f'costs more players.'))
    th = theme_hits([s.get('q3_improvement') or '' for s in surveys])
    for theme, items in sorted(th.items(), key=lambda kv: -len(kv[1]))[:4]:
        pri.append((len(items) * 3, f'**{theme}** — named by {len(items)} tester(s) as the one thing to change.'))
    if surveys:
        rr = [s['q1_rating'] for s in surveys if isinstance(s.get('q1_rating'), int)]
        if rr and sum(rr) / len(rr) < 7:
            pri.append((25, f'**Overall enjoyment is {sum(rr) / len(rr):.1f}/10** — below the bar where '
                            f'people recommend a game unprompted. Treat the criticism themes above as the '
                            f'ranked backlog.'))
        ni = sum(1 for s in surveys if s.get('q4_continue') == 'not_interested')
        if ni:
            pri.append((ni * 8, f'**{ni} tester(s) would not continue.** Read their responses in full — '
                                f'a "not interested" on a beta this small is a category signal, not noise.'))
    if crashes:
        pri.append((len(crashes) * 6, f'**{len(crashes)} crash event(s).** See the Technical section.'))

    if not pri:
        w('_Not enough data yet to rank anything honestly. Get more testers through the funnel first._')
    else:
        pri.sort(key=lambda x: -x[0])
        for i, (_, text) in enumerate(pri[:5], 1):
            w(f'{i}. {text}')
    w('')
    w('---')
    w('')
    w(f'_{len(events)} events · {len(surveys)} survey responses · {len(players)} players_')

    print('\n'.join(out))


if __name__ == '__main__':
    main()
