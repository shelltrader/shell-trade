CHART QUEST — BOSS PORTRAIT IMAGES
==================================

Drop a rendered image for each boss into THIS folder. The game will use it as the
boss portrait everywhere (intro cinematic, health bar, victory, defeat). If a file
is missing or fails to load, the game automatically falls back to the built-in
animated SVG crest for that boss — so you can add them one at a time.

CURRENT STATUS: all 11 portraits are installed as .webp (see list below).
The game is set to load .webp (BOSS_IMG_EXT='webp' in chart-quest.html).

FILE NAMING  (level number → file)   [* = cropped from the 11-card poster, lower-res]
----------------------------------
  boss-0.webp    The Sprat Dealer      (The Casino Floor)        *
  boss-1.webp    The Reversal Eel      (Hall of Mirrors)          full-res
  boss-2.webp    The Trend Crab        (The Grid)                *
  boss-3.webp    The Structure Serpent (The Deep)                *
  boss-4.webp    The VWAP Oracle       (The Haunt)               *
  boss-5.webp    The Risk Hydra        (The Liquidation Pit)     *
  boss-6.webp    The Timeframe Titan   (The Tides)               *
  boss-7.webp    The Margin King       (The Throne Room)         *
  boss-8.webp    The Order-Block Golem (The Citadel)             *
  boss-9.webp    The Confluence Kraken (The Crypt)               *
  boss-10.webp   The Market Maker      (The Abyss)               *

HELD ASIDE (not wired into the game — progression unchanged):
  extra-abyssal-core.webp   "The Final Boss / Abyssal Core" (card 11 of the poster).
  To use it, rename it to boss-10.webp (replaces Market Maker) or tell the dev.

TO REPLACE A PORTRAIT WITH A CRISPER VERSION
  The poster-cropped ones (*) are only ~250-350px. Export that boss as its own
  full-res image (like the eel), name it boss-<level>.webp, drop it here, redeploy.

IMAGE TIPS
----------
- Square images work best (e.g. 1024x1024). The art is shown "contain"-fit, so it
  won't stretch — transparent PNGs sit cleanly over the arena.
- A transparent background (PNG) looks best: the creature floats in the scene.
  A solid-background image also works, it just fills the portrait box.
- Keep each file reasonably small for mobile — aim for under ~400 KB. WebP is
  smaller than PNG; if you export WebP, name them boss-2.webp etc. and change
  BOSS_IMG_EXT in chart-quest.html from 'png' to 'webp' (one line).

TO PUBLISH
----------
1. Put your boss-N.png files in this folder.
2. Double-click  netlify-direct-deploy.command  (one folder up).
   It re-packs everything (including these images) and pushes it live.
3. On your phone, fully close and reopen the game to pull the new version.

That's it. No code editing required.
