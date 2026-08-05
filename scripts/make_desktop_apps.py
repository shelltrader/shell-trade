#!/usr/bin/env python3
"""Build the Desktop icon that opens the Beta Test QA dashboard.

    python3 scripts/make_beta_qa_app.py            # -> ~/Desktop/ChartQuest Beta QA.app
    python3 scripts/make_beta_qa_app.py --out DIR  # somewhere else

Re-run it any time; it replaces the bundle in place. Re-run it if the repo MOVES, because the
launcher has the project path baked in (an .app on the Desktop has no other way to find it).

WHY AN .app AND NOT A .command
A .command opens a Terminal window, shows a generic icon, and leaves the window sitting there
after the browser opens. An .app bundle is a directory with a plist and an executable: it runs
with no Terminal, and it can carry a real icon. The repo already writes to the Desktop for the
test QR (scripts/desktop_qr.py), so this follows an established habit rather than inventing one.

WHY NOT A .webloc POINTING AT THE URL
beta-qa.html loads its engines with <script src> and fetches the snapshot; file:// blocks both,
and the http server is usually not running. A URL shortcut would open a blank dashboard most of
the time, which is worse than no icon at all.
"""
import argparse
import os
import pathlib
import plistlib
import shutil
import subprocess
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
APP_NAME = 'ChartQuest Beta QA'
# Sizes iconutil expects. Anything missing is simply absent from the set — it does not fail — so
# the full ladder is listed to keep the icon crisp from the Dock down to a list view.
ICON_SIZES = [16, 32, 64, 128, 256, 512]


def run(cmd, **kw):
    return subprocess.run(cmd, check=True, capture_output=True, text=True, **kw)


def pick_icon_source():
    """The real logo first, then the PWA icons. logo-512.jpg is the current brand mark; the
    icon-*.png pair predates it and is a fallback rather than a preference."""
    for name in ('logo-512.jpg', 'icon-512.png', 'logo-512.webp', 'icon-192.png'):
        p = ROOT / name
        if p.exists():
            return p
    return None


def build_icns(src, work):
    """sips + iconutil are both in /usr/bin on every macOS — no Pillow, no brew dependency."""
    iconset = work / 'icon.iconset'
    iconset.mkdir(parents=True, exist_ok=True)
    for s in ICON_SIZES:
        for scale, suffix in ((1, f'icon_{s}x{s}.png'), (2, f'icon_{s}x{s}@2x.png')):
            px = s * scale
            if px > 1024:
                continue
            run(['/usr/bin/sips', '-s', 'format', 'png', '-z', str(px), str(px),
                 str(src), '--out', str(iconset / suffix)])
    icns = work / 'icon.icns'
    run(['/usr/bin/iconutil', '-c', 'icns', str(iconset), '-o', str(icns)])
    return icns


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--out', default=str(pathlib.Path.home() / 'Desktop'),
                    help='where to put the .app (default: ~/Desktop)')
    args = ap.parse_args()

    if sys.platform != 'darwin':
        sys.exit('This builds a macOS .app bundle and only runs on macOS.')

    launcher_src = ROOT / 'scripts' / 'beta_qa_open.sh'
    if not launcher_src.exists():
        sys.exit(f'missing {launcher_src.relative_to(ROOT)}')

    out_dir = pathlib.Path(args.out).expanduser()
    out_dir.mkdir(parents=True, exist_ok=True)
    app = out_dir / f'{APP_NAME}.app'

    # Replace wholesale. Editing in place leaves a stale executable if the launcher shrank, and
    # macOS caches bundle metadata by path — a clean rebuild is the only reliable refresh.
    if app.exists():
        shutil.rmtree(app)
    macos = app / 'Contents' / 'MacOS'
    res = app / 'Contents' / 'Resources'
    macos.mkdir(parents=True)
    res.mkdir(parents=True)

    # The launcher, with the project path baked in. An .app on the Desktop has no relative route
    # back to the repo, and resolving it at runtime would mean guessing.
    script = launcher_src.read_text(encoding='utf-8').replace('__CQ_ROOT__', str(ROOT))
    exe = macos / 'ChartQuestBetaQA'
    exe.write_text(script, encoding='utf-8')
    exe.chmod(0o755)

    info = {
        'CFBundleName': APP_NAME,
        'CFBundleDisplayName': APP_NAME,
        'CFBundleIdentifier': 'com.chartquest.betaqa.launcher',
        'CFBundleExecutable': exe.name,
        'CFBundleIconFile': 'icon',
        'CFBundlePackageType': 'APPL',
        'CFBundleVersion': '1.0',
        'CFBundleShortVersionString': '1.0',
        # No Dock tile and no menu bar: it opens a browser tab and exits, so a bouncing icon and
        # a stray application menu would be noise.
        'LSUIElement': True,
        'NSHighResolutionCapable': True,
    }
    with open(app / 'Contents' / 'Info.plist', 'wb') as f:
        plistlib.dump(info, f)

    src = pick_icon_source()
    if src:
        work = app / 'Contents' / '_iconbuild'
        try:
            icns = build_icns(src, work)
            shutil.move(str(icns), str(res / 'icon.icns'))
            icon_note = f'icon from {src.name}'
        except subprocess.CalledProcessError as e:
            icon_note = f'default icon (sips/iconutil failed: {(e.stderr or "").strip()[:80]})'
        finally:
            shutil.rmtree(work, ignore_errors=True)
    else:
        icon_note = 'default icon (no logo found in the repo root)'

    # Ad-hoc sign so Gatekeeper treats it as a stable identity rather than re-prompting on every
    # rebuild. Best-effort: an unsigned bundle still runs, it just may ask once.
    signed = 'unsigned'
    try:
        run(['/usr/bin/codesign', '--force', '--deep', '--sign', '-', str(app)])
        signed = 'ad-hoc signed'
    except Exception:
        pass

    # Nudge Finder to notice the new icon; harmless if it is not installed.
    subprocess.run(['/usr/bin/touch', str(app)], check=False)
    subprocess.run(['/System/Library/Frameworks/CoreServices.framework/Frameworks/'
                    'LaunchServices.framework/Support/lsregister', '-f', str(app)],
                   check=False, capture_output=True)

    print(f'✓ {app}')
    print(f'  {icon_note} · {signed}')
    print(f'  opens http://localhost:8798/beta-qa.html, starting the server first if it is down')
    print(f'  project path baked in: {ROOT}')
    print('  re-run this script if the repo moves')


if __name__ == '__main__':
    main()
