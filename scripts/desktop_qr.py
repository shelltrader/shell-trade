#!/usr/bin/env python3
"""
desktop_qr.py — write a labelled, always-current test QR to the Desktop.

The LAN test URL (http://<lan-ip>:<port>/chart-quest.html?fresh=1) is stable across
builds, so ONE file on the Desktop keeps working — but the laptop's Wi-Fi IP can change,
so cq.sh regenerates this on every `ship`. The file shows the current BUILD_TAG so a
glance confirms it's the build you just shipped, and it embeds a crisp PNG QR (scans
reliably off a Quick Look preview — hit spacebar on the Desktop file).

Usage:  python3 scripts/desktop_qr.py [port] [--out PATH]
        (port defaults to 8795; --out defaults to ~/Desktop/ChartQuest-Test-QR.svg)
Needs `qrencode` (brew install qrencode). Exits 0 quietly if it's missing, so `ship`
never fails just because the QR couldn't be written.
"""
import base64, os, re, subprocess, sys, tempfile

PORT = "8795"
OUT  = os.path.expanduser("~/Desktop/ChartQuest-Test-QR.svg")

args = sys.argv[1:]
i = 0
while i < len(args):
    if args[i] == "--out" and i + 1 < len(args):
        OUT = os.path.expanduser(args[i + 1]); i += 2
    elif args[i].isdigit():
        PORT = args[i]; i += 1
    else:
        i += 1

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def lan_ip():
    for iface in ("en0", "en1"):
        try:
            ip = subprocess.check_output(["ipconfig", "getifaddr", iface],
                                         stderr=subprocess.DEVNULL).decode().strip()
            if ip:
                return ip
        except Exception:
            pass
    return "127.0.0.1"


def build_tag():
    try:
        with open(os.path.join(ROOT, "chart-quest.html"), "r", encoding="utf-8") as f:
            head = f.read(200000)
        m = re.search(r"BUILD_TAG\s*=\s*'build (\d+)", head)
        if m:
            return "build " + m.group(1)
    except Exception:
        pass
    return "build ?"


def qr_png_datauri(url):
    """A PNG QR (reliable scan), base64 data-URI so it embeds in the SVG."""
    if not _have("qrencode"):
        return None
    with tempfile.NamedTemporaryFile(suffix=".png", delete=False) as tf:
        tmp = tf.name
    try:
        subprocess.check_call(["qrencode", "-o", tmp, "-s", "14", "-m", "2", url],
                              stderr=subprocess.DEVNULL)
        with open(tmp, "rb") as f:
            b = f.read()
        return "data:image/png;base64," + base64.b64encode(b).decode()
    finally:
        try: os.remove(tmp)
        except OSError: pass


def _have(cmd):
    from shutil import which
    return which(cmd) is not None


def main():
    ip = lan_ip()
    url = f"http://{ip}:{PORT}/chart-quest.html?fresh=1&mute=1"
    tag = build_tag()
    png = qr_png_datauri(url)
    if png is None:
        sys.stderr.write("desktop_qr: qrencode not found — `brew install qrencode` (skipped)\n")
        return 0

    # A clean light card: title · QR · build tag · URL. Sized so Quick Look renders it big.
    # XML-escape any text placed INTO the SVG: the URL now carries &mute=1, and a raw & is an illegal XML
    # entity ("EntityRef: expecting ';'") that makes the whole .svg fail to parse. The QR image itself
    # encodes the real (unescaped) URL fine — only the on-card text label needs escaping.
    esc = lambda s: str(s).replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
    urlx, tagx = esc(url), esc(tag)
    W, H = 520, 660
    svg = f"""<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}">
  <rect x="0" y="0" width="{W}" height="{H}" rx="28" fill="#0e1420"/>
  <rect x="14" y="14" width="{W-28}" height="{H-28}" rx="20" fill="#f6f8fc"/>
  <text x="{W/2}" y="70" text-anchor="middle" font-family="-apple-system,Helvetica,Arial,sans-serif" font-size="30" font-weight="800" fill="#0e1420">\U0001F4C8 ChartQuest</text>
  <text x="{W/2}" y="100" text-anchor="middle" font-family="-apple-system,Helvetica,Arial,sans-serif" font-size="15" font-weight="600" fill="#5a6b86">scan with your phone camera to test</text>
  <image x="{(W-380)/2}" y="128" width="380" height="380" href="{png}"/>
  <rect x="{(W-300)/2}" y="530" width="300" height="34" rx="17" fill="#16c784"/>
  <text x="{W/2}" y="553" text-anchor="middle" font-family="ui-monospace,Menlo,monospace" font-size="16" font-weight="800" fill="#04140b">{tagx} · BEGINNER MODE</text>
  <text x="{W/2}" y="596" text-anchor="middle" font-family="ui-monospace,Menlo,monospace" font-size="14" fill="#33415c">{urlx}</text>
  <text x="{W/2}" y="624" text-anchor="middle" font-family="-apple-system,Helvetica,Arial,sans-serif" font-size="12" fill="#8a99b3">Laptop must be running the dev server (scripts/cq.sh serve) · same Wi-Fi</text>
</svg>
"""
    try:
        with open(OUT, "w", encoding="utf-8") as f:
            f.write(svg)
    except Exception as e:
        sys.stderr.write(f"desktop_qr: could not write {OUT}: {e}\n")
        return 0
    print(f"✓ Desktop QR updated → {OUT}  ({tag} · {url})")
    return 0


if __name__ == "__main__":
    sys.exit(main())
