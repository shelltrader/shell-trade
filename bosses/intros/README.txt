CHART QUEST — BOSS INTRO CINEMATIC CLIPS
========================================

Drop each boss's 6-second intro cinematic video into THIS folder. These play right
before the Guardian fight begins (the "gold portal -> darken -> reveal" entrance).

NAMING  (must match the boss's PORTRAIT number in the parent /bosses/ folder)
----------------------------------------------------------------------------
Each clip is named after the SAME number as that boss's portrait image. So the
clip that plays for the boss whose portrait is  bosses/boss-3.webp  must be named
bosses/intros/boss-3.mp4 .

GUARDIANS ARE NUMBERED 1-11 (build 300). There is NO boss 0. The number in the filename IS
the Guardian number the player sees in the HUD, so "Guardian 1" is boss-1.mp4. The full roster,
verified against BOSS_CAST in chart-quest.html:

   1  THE GAMBLER              (Hall of Risks)      <- the FIRST boss
   2  THE FALSE BREAKOUT EEL   (Hall of Mirrors)
   3  THE TREND CRAB           (The Grid)
   4  THE STRUCTURE SERPENT    (The Deep)
   5  THE ORDER-BLOCK GOLEM
   6  THE RISK HYDRA
   7  THE VWAP ORACLE
   8  THE MARGIN KING
   9  THE TIMEFRAME TITAN
  10  THE CONFLUENCE KRAKEN
  11  THE MARKET MAKER         (The Abyss)          <- the FINAL challenge

DEFEAT / REWARD CLIPS  →  ../outros/
----------------------------------------------------------------------------
Clips that play AFTER a Guardian falls live in bosses/outros/ and are listed in
BOSS_OUTRO_VIDEOS in chart-quest.html (level → array of clips, played back-to-back
fullscreen over the victory card, then the reward ceremony runs). Currently:
  boss-1-defeat.mp4    The Gambler's defeat        (plays first)
  finn-journal.mp4     Finn receives the Journal   (transitions straight out of the defeat)
Adding a level to BOSS_OUTRO_VIDEOS is the ONLY code change needed to wire new outro clips.

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
