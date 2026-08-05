#!/usr/bin/env python3
"""ChartQuest — BETA SNAPSHOT PULLER  (Beta Test QA dashboard)

Pulls `public.beta_events` + `public.beta_surveys` into one local JSON file so the founder
dashboard works TODAY — before the admin account that live mode needs exists — and keeps
working on a plane afterwards.

    export SUPABASE_SERVICE_KEY=...
    python3 scripts/beta_pull.py                        # last 7 days → beta-qa/beta-data.json
    python3 scripts/beta_pull.py --days 30 --out /tmp/beta.json
    python3 scripts/beta_pull.py --days 0               # all time

WHAT COMES OUT
--------------
    { "pulled_at": "ISO", "days": 7, "window_from": "ISO", "pulled_by": "…",
      "truncated": false, "warnings": [],
      "events":      [...], "surveys":      [...],     ← the analysis window
      "prev_events": [...], "prev_surveys": [...] }    ← the window immediately before it

`events`/`surveys` are exactly the window the founder asked for — the array BetaModel.build()
consumes and, by happy accident, a valid `--data` blob for founder_report.py too.

`prev_events`/`prev_surveys` are a SEPARATE pair on purpose. Every KPI in
docs/beta-qa/BETA_MODEL_CONTRACT.md carries `prev` + `delta_pct` + `trend`, which needs the
preceding window of equal length; a snapshot holding only 7 days can only ever report
`prev: null`, and the JS engine would then disagree with the live SQL engine on every trend
the parity harness diffs. Merging the two windows into one `events` array would have been the
worse bug in the other direction: founder_report.py trusts the array it is handed and would
have silently reported double the players.

Rows are pulled RAW — no test-player filtering, no aggregation. Excluding `CERT-TEST*` here
would mean the dashboard could never print `excluded_players`, and an unexplained small cohort
is exactly the mystery §0.7 of the contract exists to prevent.

EXIT CODES
----------
    0  complete snapshot written
    1  snapshot written but INCOMPLETE (see "warnings" in the JSON — every number from it is
       a floor, not a total)
    2  cannot run at all (no key, bad arguments)
"""
import argparse
import json
import os
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timedelta, timezone

PROJECT = 'ymxppzhczvmiuoncuqqu'
REST = f'https://{PROJECT}.supabase.co/rest/v1'
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DEFAULT_OUT = os.path.join(ROOT, 'beta-qa', 'beta-data.json')

# PostgREST caps every response at `db-max-rows` (1000 on Supabase) NO MATTER WHAT `limit`
# says, and it truncates SILENTLY — the only tell is Content-Range. `founder_report.py` asks
# for limit=50000 and would quietly stop at a thousand rows the week this beta gets busy.
# So: one page at a time, keyset off the last `id`.
PAGE = 1000
MAX_ATTEMPTS = 4
SAFETY_CAP = 500_000
RETRYABLE = (408, 425, 429, 500, 502, 503, 504)

EPILOG = """\
the dashboard reads this file with fetch(), and Chrome blocks fetch() from file:// URLs —
serve the repo instead of double-clicking the html:

    python3 scripts/serve_nocache.py        # → http://localhost:8795/beta-qa/

the same file also feeds the weekly report:

    python3 scripts/founder_report.py --data beta-qa/beta-data.json --days 7
"""


class PullError(Exception):
    """A fetch that could not be completed. Carries a founder-readable reason, because the
    reason is what ends up in the JSON and on screen."""


# ── data access ─────────────────────────────────────────────────────────────────────────
def _get(url, key, extra_headers=None, timeout=90):
    """One GET, retried on the failures that are worth retrying. → (rows, Content-Range)."""
    headers = {'apikey': key, 'Authorization': f'Bearer {key}', 'Accept': 'application/json'}
    if extra_headers:
        headers.update(extra_headers)

    last = 'no attempt made'
    for attempt in range(1, MAX_ATTEMPTS + 1):
        try:
            req = urllib.request.Request(url, headers=headers)
            with urllib.request.urlopen(req, timeout=timeout) as r:
                return json.loads(r.read().decode('utf-8')), r.headers.get('Content-Range')
        except urllib.error.HTTPError as e:
            detail = e.read().decode('utf-8', 'replace')[:400].strip()
            if e.code in (401, 403):
                # Never retry an auth failure, and name the actual mistake: every beta table
                # has RLS on with no anon policy, so the publishable/anon key that ships in
                # the game returns an empty 200-or-401 here and looks like "no data".
                raise PullError(
                    f'HTTP {e.code} — the key was rejected. SUPABASE_SERVICE_KEY must be the '
                    f'service_role key (Supabase → Project Settings → API), not the '
                    f'publishable/anon key the game ships with: beta_events has RLS on with no '
                    f'anon policy. Server said: {detail}')
            if e.code not in RETRYABLE:
                raise PullError(f'HTTP {e.code} from PostgREST: {detail}')
            last = f'HTTP {e.code}: {detail}'
        except (OSError, ValueError) as e:          # URLError/timeout/socket, or bad JSON
            last = f'{type(e).__name__}: {e}'
        if attempt < MAX_ATTEMPTS:
            time.sleep(2 ** (attempt - 1))          # 1s, 2s, 4s
    raise PullError(f'gave up after {MAX_ATTEMPTS} attempts — {last}')


def fetch_table(table, key, since_iso, cap):
    """Page a whole window out of one table. → (rows, count_the_server_reported, error).

    Keyset pagination on the bigint identity `id`, never OFFSET. beta-ingest writes batches of
    up to 40 rows in a single statement, so those rows share one `created_at` to the
    microsecond; ordering by created_at alone leaves ties in an arbitrary order and an OFFSET
    page boundary landing inside a tie group both DUPLICATES and DROPS rows. `id` is unique,
    monotonic and assigned in insert order, so the walk is provably duplicate-free and new
    rows arriving mid-pull can only ever appear after the cursor.
    """
    rows, last_id, total, err = [], None, None, None
    while True:
        params = [('select', '*'), ('order', 'id.asc'), ('limit', str(PAGE))]
        if since_iso:
            # urlencode, ALWAYS. An ISO timestamp ends in '+00:00' and a raw '+' in a query
            # string decodes to a SPACE — the window silently shifts by the UTC offset.
            params.append(('created_at', f'gte.{since_iso}'))
        if last_id is not None:
            params.append(('id', f'gt.{last_id}'))
        url = f'{REST}/{table}?' + urllib.parse.urlencode(params)

        # count=exact costs a full count scan, so ask once — it exists to prove afterwards
        # that we actually carried everything home.
        extra = {'Prefer': 'count=exact'} if last_id is None else None

        try:
            page, crange = _get(url, key, extra)
        except PullError as e:
            err = f'{table}: {e}'
            break

        if total is None and crange:
            tail = str(crange).rsplit('/', 1)[-1]
            total = int(tail) if tail.isdigit() else None

        # Stop on an EMPTY page, never on a short one. If the server's db-max-rows is below
        # PAGE, EVERY page comes back short, and "short page = last page" would end the pull
        # at the first request while looking like a clean finish.
        if not page:
            break

        ids = [r.get('id') for r in page if isinstance(r.get('id'), int)]
        if not ids:
            err = (f'{table}: rows came back with no integer id — cannot page safely, '
                   f'stopped at {len(rows)} rows')
            break
        nxt = max(ids)
        if last_id is not None and nxt <= last_id:
            err = f'{table}: cursor stopped advancing at id={last_id} — stopped early'
            break

        rows.extend(page)
        last_id = nxt

        if len(rows) >= cap:
            err = (f'{table}: hit the --max-rows safety cap of {cap:,} — the window holds more '
                   f'than this. Raise --max-rows or narrow --days')
            break

    return rows, total, err


# ── helpers ─────────────────────────────────────────────────────────────────────────────
def parse_ts(v):
    """PostgREST returns '2026-08-04T21:00:00.123456+00:00'; a hand-made blob may use '…Z'.
    fromisoformat only learned 'Z' in 3.11 and this has to run on whatever python3 the
    founder's Mac happens to ship. Naive → assume UTC."""
    s = str(v or '')
    if not s:
        return None
    if s.endswith('Z'):
        s = s[:-1] + '+00:00'
    try:
        d = datetime.fromisoformat(s)
    except ValueError:
        return None
    return d if d.tzinfo else d.replace(tzinfo=timezone.utc)


def split_window(rows, window_from):
    """→ (in the analysis window, in the window before it, rows with an unreadable date).

    A row whose created_at will not parse is kept in the CURRENT window rather than dropped.
    Losing a row makes a funnel stage look smaller, which is indistinguishable in the report
    from a player who never got there — a silent, false finding."""
    if window_from is None:
        return list(rows), [], 0
    cur, prev, bad = [], [], 0
    for r in rows:
        t = parse_ts(r.get('created_at'))
        if t is None:
            bad += 1
            cur.append(r)
        elif t >= window_from:
            cur.append(r)
        else:
            prev.append(r)
    return cur, prev, bad


def human_bytes(n):
    size = float(n)
    for unit in ('B', 'KB', 'MB', 'GB'):
        if size < 1024 or unit == 'GB':
            return f'{size:.0f} B' if unit == 'B' else f'{size:.1f} {unit}'
        size /= 1024.0
    return f'{size:.1f} GB'


def no_key_message(days, out_path):
    """The founder does not always have the service key to hand — and a stack trace at that
    moment is a dead end. Print the exact query Claude can run over the Supabase MCP instead,
    already filled in with the window that was just asked for."""
    span = f"interval '{days} days'"
    prev = f"interval '{2 * days} days'"
    if days > 0:
        ev_where = f"where e.created_at >= now() - {span}"
        sv_where = f"where s.created_at >= now() - {span}"
        pev = (f"coalesce((select json_agg(e order by e.id) from public.beta_events e\n"
               f"                          where e.created_at >= now() - {prev}\n"
               f"                            and e.created_at <  now() - {span}), '[]'::json)")
        psv = (f"coalesce((select json_agg(s order by s.id) from public.beta_surveys s\n"
               f"                          where s.created_at >= now() - {prev}\n"
               f"                            and s.created_at <  now() - {span}), '[]'::json)")
        wfrom = f"to_char((now() - {span}) at time zone 'utc', 'YYYY-MM-DD\"T\"HH24:MI:SS\"Z\"')"
    else:
        # All time has no "before"; an empty previous window is the honest answer, and the
        # dashboard renders trend "flat" rather than inventing one.
        ev_where = sv_where = ''
        pev = psv = "'[]'::json"
        wfrom = 'null'

    return f"""\
SUPABASE_SERVICE_KEY is not set, so there is nothing to authenticate with.

Two ways forward.

 1 · Export the key and re-run (Supabase → Project Settings → API → service_role):

       export SUPABASE_SERVICE_KEY='eyJ...'
       python3 scripts/beta_pull.py --days {days} --out {out_path}

 2 · No key to hand? Ask Claude to run this over the Supabase MCP on project
     {PROJECT} and save the single returned value VERBATIM to
     {out_path} — it is the same snapshot this script writes:

------------------------------------------------------------------------------8<---------
select json_build_object(
  'pulled_at',    to_char(now() at time zone 'utc', 'YYYY-MM-DD"T"HH24:MI:SS"Z"'),
  'days',         {days},
  'window_from',  {wfrom},
  'pulled_by',    'supabase-mcp',
  'truncated',    false,
  'warnings',     json_build_array(),
  'events',       coalesce((select json_agg(e order by e.id) from public.beta_events e
                          {ev_where}), '[]'::json),
  'surveys',      coalesce((select json_agg(s order by s.id) from public.beta_surveys s
                          {sv_where}), '[]'::json),
  'prev_events',  {pev},
  'prev_surveys', {psv}
) as snapshot;
------------------------------------------------------------------------------8<---------

     If the MCP truncates the result (it is one giant cell), pull it a day at a time with
     --days 1 windows and concatenate, or use route 1. A truncated blob is worse than no
     blob: it looks like a quiet week.
"""


# ── main ────────────────────────────────────────────────────────────────────────────────
def main():
    ap = argparse.ArgumentParser(
        description='Pull the closed-beta dataset to a local JSON snapshot for the Beta Test '
                    'QA dashboard.',
        formatter_class=argparse.RawDescriptionHelpFormatter, epilog=EPILOG)
    ap.add_argument('--days', type=int, default=7,
                    help='window in days; 0 = all time (default: 7)')
    ap.add_argument('--out', default=None,
                    help='output path (default: beta-qa/beta-data.json at the repo root)')
    ap.add_argument('--no-prev', action='store_true',
                    help='skip the previous window — smaller file, but every KPI trend goes null')
    ap.add_argument('--max-rows', type=int, default=SAFETY_CAP,
                    help=f'per-table safety cap (default: {SAFETY_CAP:,})')
    ap.add_argument('--pretty', action='store_true',
                    help='indent the JSON (bigger file, readable diffs)')
    args = ap.parse_args()

    # ap.error() rather than sys.exit(): it exits 2, which is this script's "cannot run".
    if args.days < 0:
        ap.error('--days must be 0 (all time) or a positive number of days.')
    if args.max_rows < 1:
        ap.error('--max-rows must be at least 1.')

    # Default lands in the repo so `python3 scripts/beta_pull.py` writes the file the
    # dashboard loads no matter which directory it was run from; an explicit --out is
    # resolved against the caller's cwd, which is what anyone typing a path expects.
    out_path = os.path.abspath(args.out) if args.out else DEFAULT_OUT

    key = os.environ.get('SUPABASE_SERVICE_KEY')
    if not key:
        sys.stderr.write(no_key_message(args.days, out_path))
        return 2

    now = datetime.now(timezone.utc)
    if args.days > 0:
        window_from = now - timedelta(days=args.days)
        fetch_from = window_from if args.no_prev else now - timedelta(days=2 * args.days)
    else:
        window_from = fetch_from = None
    since_iso = fetch_from.isoformat() if fetch_from else None

    # `failures` are the reasons this snapshot is incomplete — they set `truncated` and get
    # the loud banner. `warnings` is everything worth telling the dashboard, failures
    # included, so notes like "no previous window" travel with the file without pretending
    # rows went missing.
    failures = []
    notes = []

    events, ev_total, ev_err = fetch_table('beta_events', key, since_iso, args.max_rows)
    surveys, sv_total, sv_err = fetch_table('beta_surveys', key, since_iso, args.max_rows)

    for err in (ev_err, sv_err):
        if err:
            failures.append(err)

    # The server told us how many rows the window held before we started. Fewer than that
    # means something stopped us; MORE is normal (testers keep playing while we page).
    for name, got, total in (('beta_events', len(events), ev_total),
                             ('beta_surveys', len(surveys), sv_total)):
        if total is not None and got < total:
            failures.append(f'{name}: carried home {got:,} of the {total:,} rows the server '
                            f'counted in this window')

    ev_cur, ev_prev, ev_bad = split_window(events, window_from)
    sv_cur, sv_prev, sv_bad = split_window(surveys, window_from)
    if ev_bad or sv_bad:
        notes.append(f'{ev_bad + sv_bad} row(s) had an unreadable created_at and were kept '
                     f'in the current window rather than dropped')
    if args.no_prev and args.days > 0:
        notes.append('--no-prev: the previous window was not pulled, so every KPI trend '
                     'will read flat regardless of what actually changed')
    if args.days == 0:
        notes.append('--days 0 (all time) has no preceding window, so KPI trends read flat')

    truncated = bool(failures)
    warnings = failures + notes

    blob = {
        'pulled_at': now.isoformat(),
        'days': args.days,
        # The analysis window is pinned HERE, at pull time. Recomputing it in the browser as
        # (opened_at − days) would slide the window every hour the snapshot sits on disk, and
        # the dashboard's numbers would drift away from the file that produced them.
        'window_from': window_from.isoformat() if window_from else None,
        'pulled_by': 'scripts/beta_pull.py',
        'truncated': truncated,
        'warnings': warnings,
        'events': ev_cur,
        'surveys': sv_cur,
        'prev_events': ev_prev,
        'prev_surveys': sv_prev,
    }

    # A failed pull that carried home NOTHING is a config or network problem, not a quiet
    # week — and writing it would clobber a perfectly good snapshot with an empty one. The
    # dashboard showing yesterday's real data beats it going blank because of a key typo.
    if truncated and not events and not surveys:
        sys.stderr.write('Pull failed and brought back no rows at all:\n')
        for wmsg in failures:
            sys.stderr.write(f'  · {wmsg}\n')
        existing = ' (left the existing one untouched)' if os.path.exists(out_path) else ''
        sys.stderr.write(f'Refusing to write an empty snapshot to {out_path}{existing}.\n')
        return 2

    os.makedirs(os.path.dirname(out_path) or '.', exist_ok=True)
    dump_kw = {'indent': 2} if args.pretty else {'separators': (',', ':')}
    # Write-then-rename: the dashboard may be fetching this file right now, and half a JSON
    # document reads as a broken dashboard rather than a stale one.
    tmp = out_path + '.tmp'
    with open(tmp, 'w', encoding='utf-8') as f:
        json.dump(blob, f, ensure_ascii=False, **dump_kw)
    os.replace(tmp, out_path)

    # ── summary ─────────────────────────────────────────────────────────────────────────
    size = human_bytes(os.path.getsize(out_path))
    span = 'all time' if args.days == 0 else f'{args.days} day(s)'
    print(f'{len(ev_cur):,} events · {len(sv_cur):,} surveys → {out_path}  ({size})')
    print(f'Window   {window_from.strftime("%Y-%m-%d %H:%M") if window_from else "beginning"} → '
          f'{now:%Y-%m-%d %H:%M} UTC  ({span})')
    if ev_prev or sv_prev:
        print(f'Previous {len(ev_prev):,} events · {len(sv_prev):,} surveys — powers every '
              f'KPI trend')
    players = len({e.get('player_id') for e in ev_cur if e.get('player_id')})
    print(f'{players:,} distinct player id(s) in the window (test ids included — the dashboard '
          f'excludes and reports them)')

    if not ev_cur and not sv_cur and not truncated:
        # Straight from founder_report.py's house rule: never let "nobody played" go
        # unchallenged, because a silent CORS or origin-allowlist failure looks identical.
        # Only when the pull itself SUCCEEDED, though — sending the founder to check the
        # ingest allowlist when the real problem was a failed fetch is its own wrong problem.
        print('\nNothing in this window. Before concluding nobody played, check the pipe — a '
              'silent CORS\nor beta-ingest origin-allowlist failure looks exactly like an '
              'empty week:\n'
              '  curl -sS -X OPTIONS '
              f'https://{PROJECT}.supabase.co/functions/v1/beta-ingest \\\n'
              '    -H "Origin: https://playchartquest.com" '
              '-H "Access-Control-Request-Method: POST" -D - -o /dev/null\n'
              'The access-control-allow-origin header must echo the origin EXACTLY.')

    if truncated:
        # Loud on purpose. A truncated snapshot that reports itself as fine is how a founder
        # ends up chasing a drop-off that is really a missing page of rows.
        # Flush first: stdout is block-buffered the moment this is piped to a file, and the
        # unbuffered banner would otherwise print BEFORE the summary it is warning about.
        sys.stdout.flush()
        sys.stderr.write('\n' + '!' * 86 + '\n')
        sys.stderr.write('!!  INCOMPLETE SNAPSHOT — every number from this file is a FLOOR, '
                         'not a total.\n')
        for wmsg in failures:
            sys.stderr.write(f'!!    · {wmsg}\n')
        sys.stderr.write('!!  Fix the cause and re-run before reading anything into the '
                         'funnel.\n')
        sys.stderr.write('!' * 86 + '\n')
        sys.stderr.flush()
        return 1
    return 0


if __name__ == '__main__':
    sys.exit(main())
