CHART QUEST — BOSS INTRO CINEMATIC CLIPS
========================================

Drop each boss's 6-second intro cinematic video into THIS folder. These play right
before the Guardian fight begins (the "gold portal -> darken -> reveal" entrance).

NAMING  (must match the boss's PORTRAIT number in the parent /bosses/ folder)
----------------------------------------------------------------------------
Each clip is named after the SAME number as that boss's portrait image. So the
clip that plays for the boss whose portrait is  bosses/boss-3.webp  must be named
bosses/intros/boss-3.mp4 .

READY NOW — the first 5 (clips you've generated):
  boss-0.mp4   The Sprat Dealer        (The Casino Floor)
  boss-1.mp4   The Reversal Eel        (Hall of Mirrors)
  boss-2.mp4   The Trend Crab          (The Grid)
  boss-3.mp4   The Structure Serpent   (The Deep)
  boss-4.mp4   The VWAP Oracle         (The Haunt)

ADD LATER (leave empty for now — the game falls back to the still portrait + the
existing entrance animation for any boss without a clip):
  boss-5.mp4   The Risk Hydra          (The Liquidation Pit)
  boss-6.mp4   The Timeframe Titan     (The Tides)
  boss-7.mp4   The Margin King         (The Throne Room)
  boss-8.mp4   The Order-Block Golem   (The Citadel)
  boss-9.mp4   The Confluence Kraken   (The Crypt)
  boss-10.mp4  The Market Maker        (The Abyss)

VIDEO FORMAT TIPS
-----------------
- Container/codec: .mp4  (H.264 video + AAC audio) — same as the opening
  Market-maker-cinematic.mp4, so it plays everywhere including iOS Safari.
- Length: ~6 seconds.
- The game plays these MUTED and inline (muted + playsinline), so design them to
  read without sound; any audio is a bonus, not required.
- Aspect: portrait or square reads best (the game is a portrait phone screen).
- Size: keep each clip small for mobile — aim for under ~3-4 MB. 720p is plenty.

DOES IT AUTO-PUBLISH?
---------------------
Yes — INCLUDING the clips in the build is automatic. The deploy script
(netlify-direct-deploy.command, two folders up) zips the whole /bosses/ folder
recursively, so any .mp4 you drop in here ships on the next deploy. No script edit.

NOTE: dropping the clips here makes them AVAILABLE, but the game won't PLAY them
until the boss-intro-video wiring is added in code — that's the next change.
