#!/usr/bin/env python3
"""Splice ops/cq-ops.js into chart-quest.html — the operational foundation (window.CQOPS).

The game is ONE self-contained document; it cannot <script src> a sibling file. So the ops
module has to exist twice. Two copies drift; this script is what stops them.

    python3 scripts/sync_ops.py            # write the inlined copy from the canonical file
    python3 scripts/sync_ops.py --check    # exit 1 if they have drifted (runs in the ship gate)
    python3 scripts/sync_ops.py --stamp    # refresh ONLY the deploy stamp (commit + timestamp)

── WHERE THE BLOCK GOES, AND WHY ────────────────────────────────────────────────────────────
Immediately AFTER the <head> boot-crash-capture block and BEFORE every other script. Two
reasons, both load-bearing:

  1. Infrastructure that other code logs to must exist before the code that logs. Putting it
     first means all four game script blocks, CQTrack, CQBeta and CQBEAT can use window.CQOPS
     with no ordering dance and no buffering shim.
  2. MERGE SAFETY. Every other injected subsystem in this project appends a trailing IIFE at
     the END of the document, so that is where concurrent sessions collide. The head is ~28,000
     lines away from that traffic and has been stable for months.

The region is delimited by CQOPS:BEGIN / CQOPS:END and contains TWO things:

    <meta name="cq-build" content="<sha>" data-built-at="<iso>">
    <script> …ops/cq-ops.js… </script>

The meta line is the deployment stamp, written by `scripts/cq.sh ship` (or --stamp here). It is
NOT part of the canonical source, so --check compares only the <script> body. Re-syncing
preserves whatever stamp is already present rather than resetting it.

Only chart-quest.html is written. Run `scripts/cq.sh mirror` + `site` afterwards, exactly as
with any other source change.
"""
import re
import subprocess
import sys
import datetime
import pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
SRC = ROOT / 'ops' / 'cq-ops.js'
DST = ROOT / 'chart-quest.html'

BEGIN = '<!-- CQOPS:BEGIN — generated from ops/cq-ops.js by scripts/sync_ops.py — DO NOT EDIT HERE -->'
END = '<!-- CQOPS:END -->'

# Inserted immediately after this — the <head> boot-crash capture block's closing tag.
ANCHOR = "  }, 8000);\n})();\n</script>\n"

META_RE = re.compile(r'<meta name="cq-build"[^>]*>')
DEFAULT_META = '<meta name="cq-build" content="unstamped" data-built-at="">'


def git(*args: str) -> str:
    try:
        return subprocess.run(['git', *args], cwd=ROOT, capture_output=True, text=True,
                              check=True).stdout.strip()
    except Exception:
        return ''


def make_meta() -> str:
    """The deploy stamp: which source produced this artifact, and when.

    `content` is HEAD at stamp time — the BASE commit this build was made from, not the commit
    that will contain it. A build cannot carry the hash of the commit that contains it, and
    stamping is necessarily the last thing before the commit, so the base commit is the honest
    value. Read it as "built on top of abc1234"; the very next commit is the one that shipped.

    Deliberately NOT flagged dirty: `cq.sh ship` runs immediately before a commit, so the tree
    is dirty every single time. A flag that is always on carries no information.

    Production could give the exact commit only if the deploy had a build step to inject it —
    Cloudflare Pages serves this repo statically, so it does not. `scripts/cq.sh smoke` closes
    the loop from the other end by reading the stamp back off the live site.
    """
    sha = git('rev-parse', '--short=10', 'HEAD') or 'unstamped'
    now = datetime.datetime.now(datetime.timezone.utc).replace(microsecond=0).isoformat().replace('+00:00', 'Z')
    return f'<meta name="cq-build" content="{sha}" data-built-at="{now}">'


def build_block(js: str, meta: str) -> str:
    return (BEGIN + '\n' + meta + '\n<script>\n' + js.rstrip() + '\n</script>\n' + END + '\n')


def find_region(html: str):
    """Return (start, end) character offsets of the whole CQOPS region, or None."""
    if BEGIN not in html or END not in html:
        return None
    start = html.index(BEGIN)
    end = html.index(END, start) + len(END) + 1  # include the trailing newline
    return start, end


def current_meta(html: str) -> str:
    region = find_region(html)
    if not region:
        return DEFAULT_META
    m = META_RE.search(html[region[0]:region[1]])
    return m.group(0) if m else DEFAULT_META


def main() -> int:
    check = '--check' in sys.argv
    stamp_only = '--stamp' in sys.argv

    if not SRC.exists():
        print(f'✗ canonical source missing: {SRC}')
        return 1
    js = SRC.read_text(encoding='utf-8')

    # A stray </script> inside the JS would terminate the block early and silently truncate the
    # rest of the game. Cheap guard, catastrophic failure mode.
    if '</script>' in js.lower():
        print('✗ cq-ops.js contains a literal </script> — it would break the inlined block')
        return 1

    html = DST.read_text(encoding='utf-8')
    region = find_region(html)

    if stamp_only:
        if not region:
            print('✗ no CQOPS block to stamp — run: python3 scripts/sync_ops.py')
            return 1
        meta = make_meta()
        start, end = region
        block = html[start:end]
        new_block = META_RE.sub(lambda _m: meta, block, count=1) if META_RE.search(block) \
            else block.replace(BEGIN + '\n', BEGIN + '\n' + meta + '\n', 1)
        if new_block == block:
            print('✓ deploy stamp unchanged')
            return 0
        DST.write_text(html[:start] + new_block + html[end:], encoding='utf-8')
        print(f'✓ deploy stamp → {meta}')
        return 0

    # Preserve the existing stamp: a re-sync is a source change, not a deploy.
    block = build_block(js, current_meta(html))

    if region:
        start, end = region
        if html[start:end] == block:
            print('✓ inlined CQOPS matches ops/cq-ops.js')
            return 0
        if check:
            print('✗ inlined CQOPS has DRIFTED from ops/cq-ops.js')
            print('  run: python3 scripts/sync_ops.py')
            return 1
        html = html[:start] + block + html[end:]
        print('✓ inlined CQOPS updated')
    else:
        if check:
            print('✗ chart-quest.html has no CQOPS block — run: python3 scripts/sync_ops.py')
            return 1
        if ANCHOR not in html:
            print('✗ anchor not found in chart-quest.html (the <head> boot-crash block)')
            return 1
        i = html.index(ANCHOR) + len(ANCHOR)
        html = html[:i] + block + html[i:]
        print('✓ inlined CQOPS inserted after the <head> boot-crash block')

    DST.write_text(html, encoding='utf-8')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
