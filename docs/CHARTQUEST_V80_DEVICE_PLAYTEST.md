# ChartQuest v80 — Device Playtest Checklist

Focus: the v79→v80 changes (L1 fullscreen leak, trade→lesson→celebration→boss timing,
merged card, trimmed onboarding) + the v78 candle exaggeration. ~5–8 min on a real phone.

## 0. Setup (do this first)
- [ ] **Back up your save** before any fresh-save run: in the browser console run
      `copy(localStorage.getItem('cq_save'))` (or your usual key) and paste it somewhere safe.
- [ ] Hard-refresh / reopen so the service worker updates. Confirm **v80** is live
      (DevTools → Application → Service Workers, or fetch `/sw.js` → `chart-quest-v80`).
- [ ] Clear the keys that gate the intro so you see it fresh: `cq_played`,
      `cq_firstwin_v1` (and your save key). Reload.

## 1. First 5 minutes feel like PLAYING (trim — #3)
- [ ] Cinematic still plays (kept on purpose) → drops you into live play, not a reading wall.
- [ ] **"📡 THIS IS A LIVE MARKET"** is now **one line**, not 4 bullets.
- [ ] **Control coach:** only the **JUMP** hint shows at first. BOOST appears only after you
      jump; TUCK only after you boost. An ignored hint fades after ~9s (it does **not**
      skip ahead to a control you haven't reached).
- [ ] **Flash Quiz is ONE card** (green = up), header reads "1 / 1" → straight to the bet.

## 2. The L1 first trade is a real prediction (#1 — the leak)
- [ ] Panel shows the candle + "WHAT HAPPENS NEXT?" with **no hint / no recommended side**.
- [ ] **Tap "⤢ TAP TO EXPAND"** (the optional fullscreen) — the key fix:
  - [ ] Title reads **"READ THE CHART"** (not "MOMENTUM SETUP").
  - [ ] Prompt pill reads **"WHAT HAPPENS NEXT — ↑ UP or ↓ DOWN?"** (no "LONG/SHORT — BET PRICE GOES…").
  - [ ] The future zone shows a **neutral ↑/↓ fork**, not a single coloured directional arrow.
  - [ ] Signal candle box is **yellow** with "👉 THIS CANDLE — WHAT NEXT?" (not red/green).
- [ ] One tap on ↑UP / ↓DOWN commits instantly.

## 3. Hard sequence: trade → lesson → celebration → boss (#2 + #4)
- [ ] After the result, **one merged card** appears: the "why it moved" explanation **+**
      a "🔎 THAT WAS 1 CLUE" confluence note below a divider (not two separate cards).
- [ ] The big **🏆 FIRST WIN** confetti fires **when you dismiss that card** (tap OK) —
      **not** while the card is still open.
- [ ] The Gambler boss reveal comes **after** the confetti, not on top of it.
- [ ] Idle check (optional): if you *don't* tap OK, the celebration still fires (~7s) and
      the boss still arrives (~12s) — nothing soft-locks.

## 4. v78 candle exaggeration (realism/readability)
- [ ] Candles read clearly at a glance on the small screen — bodies are legible, the
      exaggeration helps you *see* the move without looking cartoonish.
- [ ] No squashed/clipped candles in the panel **or** the fullscreen expand.
- [ ] Wicks/highlights line up with the candle they point at (no drift on tall candles).

## 5. Quick regression (don't let the funnel break)
- [ ] L2+ fullscreen still **reveals** the recommended direction (only L1 is neutralized).
- [ ] Trade journal logs the first trade; shells update correctly.
- [ ] Restore your backed-up save when done (paste it back into the save key, reload).

---
**Report back:** which boxes failed + a note on how the timing *felt* (#2 is the one thing
I can't eyeball from here). That tells me whether the 2.2s confetti→boss beat needs tuning.
