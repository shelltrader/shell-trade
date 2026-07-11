#!/usr/bin/env python3
"""Generate ChartQuest PWA icons + iOS splash screens.

The old raster icons were inconsistent and carried stale branding: icon-192 said
"CQ", icon-512 said "CHART QUEST" (two words, clipped at the edge). Both are
superseded here — every asset is DRAWN from the brand logomark (the green/red
candlestick pair used in the site nav), so the whole set is consistent, crisp at
any size, and free of stale wordmarks.

Outputs (website/assets/pwa/):
  icon-<n>.png            purpose "any"      — mark fills ~70% of the tile
  icon-maskable-<n>.png   purpose "maskable" — mark inside the 80% safe zone,
                          so Android's circle/squircle mask never clips it
  splash-<w>x<h>.png      iOS apple-touch-startup-image launch screens.
                          Apple's HIG: a launch screen is near-static and simple,
                          not a poster — so it's bg + mark, palette-quantised
                          (240KB for the whole set instead of ~9MB of key art).

Regenerate:  python3 scripts/make_pwa_assets.py
"""
import os
from PIL import Image, ImageDraw

OUT = "website/assets/pwa"
BG = (6, 9, 16)          # #060910 — site background
GREEN = (22, 199, 132)   # #16C784
RED = (234, 57, 67)      # #EA3943

ICON_SIZES = [96, 128, 144, 152, 167, 180, 192, 256, 384, 512]
MASKABLE_SIZES = [192, 512]
SPLASH = [
    (320, 568, 2), (375, 667, 2), (390, 844, 3), (393, 852, 3),
    (414, 896, 2), (414, 896, 3), (428, 926, 3), (430, 932, 3),
    (768, 1024, 2), (820, 1180, 2), (1024, 1366, 2),
]

# Brand logomark, in the same 32x32 space as the inline <svg> in the site nav.
# (x, y, w, h, radius, colour) — wick first so the body sits on top.
MARK = [
    (8, 4, 2, 24, 1, GREEN), (6, 10, 6, 14, 2, GREEN),
    (22, 4, 2, 24, 1, RED),  (20, 8, 6, 12, 2, RED),
]


def draw_mark(size, scale):
    """Transparent RGBA tile with the logomark centred, occupying `scale` of it."""
    ss = 4  # supersample for clean edges
    px = size * ss
    img = Image.new("RGBA", (px, px), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    unit = px * scale / 32.0
    off = (px - 32 * unit) / 2.0
    for x, y, w, h, r, col in MARK:
        d.rounded_rectangle(
            [off + x * unit, off + y * unit, off + (x + w) * unit, off + (y + h) * unit],
            radius=max(1, r * unit), fill=col + (255,))
    return img.resize((size, size), Image.LANCZOS)


def main():
    os.makedirs(OUT, exist_ok=True)

    for n in ICON_SIZES:
        tile = Image.new("RGB", (n, n), BG)
        tile.paste(m := draw_mark(n, 0.70), (0, 0), m)
        tile.save(f"{OUT}/icon-{n}.png", optimize=True)
    print(f"icons        {len(ICON_SIZES)} sizes")

    # Android masks to a circle inscribed in the tile; only the middle 80% is
    # guaranteed visible, so keep the mark well inside it.
    for n in MASKABLE_SIZES:
        tile = Image.new("RGB", (n, n), BG)
        tile.paste(m := draw_mark(n, 0.50), (0, 0), m)
        tile.save(f"{OUT}/icon-maskable-{n}.png", optimize=True)
    print(f"maskable     {len(MASKABLE_SIZES)} sizes (mark inside 80% safe zone)")

    for cw, ch, dpr in SPLASH:
        w, h = cw * dpr, ch * dpr
        canvas = Image.new("RGB", (w, h), BG)
        m = draw_mark(int(min(w, h) * 0.30), 0.80)
        canvas.paste(m, ((w - m.width) // 2, (h - m.height) // 2), m)
        canvas.convert("P", palette=Image.ADAPTIVE, colors=32).save(
            f"{OUT}/splash-{w}x{h}.png", optimize=True)
    print(f"splashes     {len(SPLASH)} device sizes")

    total = sum(os.path.getsize(os.path.join(OUT, f)) for f in os.listdir(OUT))
    print(f"total        {total/1024:.0f} KB in {OUT}/")


if __name__ == "__main__":
    main()
