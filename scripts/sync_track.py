#!/usr/bin/env python3
"""Splice website/assets/cq-track.js into chart-quest.html.

The game is ONE self-contained document — it cannot <script src> a sibling file the way
index.html and play.html do. So the analytics client has to exist twice. Two copies drift;
this script is what stops them.

    python3 scripts/sync_track.py           # write the inlined copy from the canonical file
    python3 scripts/sync_track.py --check   # exit 1 if they have drifted (for the ship gate)

The inlined copy lives between CQTRACK:BEGIN / CQTRACK:END markers, immediately before the
window.CQBeta block so CQTrack is defined first (CQBeta buffers into window.__cqTrackQueue
if it isn't, so order is a nicety rather than a requirement).

Only chart-quest.html is written. Run `scripts/cq.sh mirror` + `site` afterwards, exactly as
with any other source change.
"""
import sys
import pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
SRC = ROOT / 'website' / 'assets' / 'cq-track.js'
DST = ROOT / 'chart-quest.html'

BEGIN = '/* CQTRACK:BEGIN — generated from website/assets/cq-track.js by scripts/sync_track.py — DO NOT EDIT HERE */'
END = '/* CQTRACK:END */'

# Inserted before this, so CQTrack is defined ahead of CQBeta.
ANCHOR = '   CLOSED BETA EXPERIENCE  —  window.CQBeta'


def build_block(js: str) -> str:
    return '<script>\n' + BEGIN + '\n' + js.rstrip() + '\n' + END + '\n</script>\n'


def main() -> int:
    check = '--check' in sys.argv

    if not SRC.exists():
        print(f'✗ canonical source missing: {SRC}')
        return 1
    js = SRC.read_text(encoding='utf-8')

    # A stray </script> inside the JS would terminate the block early and silently
    # truncate the game. Cheap guard, catastrophic failure mode.
    if '</script>' in js.lower():
        print('✗ cq-track.js contains a literal </script> — it would break the inlined block')
        return 1

    html = DST.read_text(encoding='utf-8')
    block = build_block(js)

    if BEGIN in html:
        i = html.index(BEGIN)
        start = html.rindex('<script>', 0, i)
        end = html.index('</script>', html.index(END, i)) + len('</script>\n')
        current = html[start:end]
        if current == block:
            print('✓ inlined CQTrack matches website/assets/cq-track.js')
            return 0
        if check:
            print('✗ inlined CQTrack has DRIFTED from website/assets/cq-track.js')
            print('  run: python3 scripts/sync_track.py')
            return 1
        html = html[:start] + block + html[end:]
        print('✓ inlined CQTrack updated')
    else:
        if check:
            print('✗ chart-quest.html has no CQTrack block — run: python3 scripts/sync_track.py')
            return 1
        if ANCHOR not in html:
            print(f'✗ anchor not found in chart-quest.html: {ANCHOR!r}')
            return 1
        i = html.index(ANCHOR)
        start = html.rindex('<script>', 0, i)
        html = html[:start] + block + html[start:]
        print('✓ inlined CQTrack inserted before the CQBeta block')

    DST.write_text(html, encoding='utf-8')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
