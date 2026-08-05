#!/usr/bin/env python3
"""The QR you send to REAL beta testers — production, clean URL, no dev flags.

    python3 scripts/tester_qr.py              # -> ~/Desktop/ChartQuest-Tester-QR.svg
    python3 scripts/tester_qr.py --out FILE
    python3 scripts/tester_qr.py --url https://playchartquest.com/play

NOT scripts/desktop_qr.py. That one points at the LAN dev server with `?fresh=1` and is for the
founder's own device. Handing it to a tester breaks two things at once:

  1. `?fresh=1` WIPES cq_pid. The player id is what makes a tester ONE person across the funnel,
     so a fresh flag mints a brand-new "tester" on every launch. Ten launches by one person read
     as ten testers who each bounced at landing. On a ten-person beta that is not noise, it is
     the entire dataset.
  2. The LAN address is unreachable from anywhere but the founder's own Wi-Fi.

So this script refuses to emit a QR carrying a dev flag at all — see FORBIDDEN_PARAMS. A quiet
mistake here poisons the data for the whole round and looks like real behaviour on the dashboard.
"""
import argparse
import pathlib
import re
import subprocess
import sys
import urllib.request

DEFAULT_URL = 'https://playchartquest.com'
# Anything that changes what the game measures, or that only works on a dev machine.
FORBIDDEN_PARAMS = ('fresh', 'dev', 'qa', 'beat', 'mute', 'pt')


def build_tag(url):
    """Read the live build so the QR can be labelled with what testers will actually get — the
    point is to catch 'I sent the link but forgot to deploy' before the testers do."""
    try:
        req = urllib.request.Request(url.rstrip('/') + '/game', headers={'User-Agent': 'cq-qr'})
        with urllib.request.urlopen(req, timeout=25) as r:
            head = r.read(400_000).decode('utf-8', 'replace')
        m = re.search(r"BUILD_TAG\s*=\s*'build\s+(\d+)", head)
        return m.group(1) if m else None
    except Exception:
        return None


def qr_svg_inner(url):
    """qrencode if present, else a pure-python fallback so this never hard-depends on brew."""
    try:
        out = subprocess.run(['qrencode', '-t', 'SVG', '-m', '0', '-o', '-', url],
                             capture_output=True, check=True).stdout.decode()
        m = re.search(r'<svg[^>]*viewBox="([^"]+)"[^>]*>(.*)</svg>', out, re.S)
        if m:
            return m.group(1), m.group(2)
    except Exception:
        pass
    try:
        import qrcode                                             # noqa
        q = qrcode.QRCode(border=0); q.add_data(url); q.make(fit=True)
        mods = q.get_matrix(); n = len(mods)
        rects = ''.join(f'<rect x="{x}" y="{y}" width="1" height="1"/>'
                        for y, row in enumerate(mods) for x, v in enumerate(row) if v)
        return f'0 0 {n} {n}', rects
    except Exception:
        return None, None


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--url', default=DEFAULT_URL)
    ap.add_argument('--out', default=str(pathlib.Path.home() / 'Desktop' / 'ChartQuest-Tester-QR.svg'))
    args = ap.parse_args()

    url = args.url.strip()
    if not url.startswith('https://'):
        sys.exit(f'Refusing: a tester link must be https, got {url!r}')
    q = url.split('?', 1)[1] if '?' in url else ''
    hit = [p for p in FORBIDDEN_PARAMS if re.search(rf'(^|&){p}=', q)]
    if hit:
        sys.exit(f'Refusing: {", ".join(hit)} is a DEV flag and must never reach a tester.\n'
                 f'  ?fresh wipes cq_pid, so one tester is counted as a new person on every launch\n'
                 f'  and the funnel reports bounces that never happened.\n'
                 f'  For your own device use: python3 scripts/desktop_qr.py')

    build = build_tag(url)
    vb, inner = qr_svg_inner(url)
    if not inner:
        sys.exit('No QR encoder available. Install one:  brew install qrencode   (or pip install qrcode)')

    W, H = 760, 940
    label = f'build {build}' if build else 'build unknown — is it deployed?'
    svg = f'''<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}">
  <rect width="{W}" height="{H}" fill="#ffffff"/>
  <text x="{W//2}" y="86" text-anchor="middle" font-family="-apple-system,Helvetica,sans-serif"
        font-size="44" font-weight="700" fill="#111">ChartQuest — Beta</text>
  <text x="{W//2}" y="134" text-anchor="middle" font-family="-apple-system,Helvetica,sans-serif"
        font-size="24" fill="#666">Scan to play · no download, no sign-up</text>
  <svg x="130" y="180" width="500" height="500" viewBox="{vb}" fill="#000">{inner}</svg>
  <text x="{W//2}" y="740" text-anchor="middle" font-family="-apple-system,Helvetica,sans-serif"
        font-size="30" font-weight="600" fill="#111">{url}</text>
  <text x="{W//2}" y="792" text-anchor="middle" font-family="-apple-system,Helvetica,sans-serif"
        font-size="22" fill="#888">{label}</text>
  <text x="{W//2}" y="858" text-anchor="middle" font-family="-apple-system,Helvetica,sans-serif"
        font-size="21" fill="#888">Play to the end, then the 5-question survey</text>
  <text x="{W//2}" y="892" text-anchor="middle" font-family="-apple-system,Helvetica,sans-serif"
        font-size="19" fill="#aaa">Takes about 15 minutes</text>
</svg>
'''
    out = pathlib.Path(args.out).expanduser()
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(svg, encoding='utf-8')
    print(f'✓ {out}')
    print(f'  {url}  ·  live {label}')
    print('  clean URL — no dev flags, so every tester counts as one person across the funnel')


if __name__ == '__main__':
    main()
