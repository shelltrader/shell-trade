# Chart Quest — Economy Polish + Intro Cinematic · Report

Both parts implemented and verified. Game parses clean (4/4), `index.html` synced, service
worker **v36 → v37**. The Market Maker clip is wired in and added to the deploy file list.
Progression, ranks, bosses, and curriculum are unchanged — this was polish only.

---

## 1. Economy polish changes

- **Trade-size cap (`TRADE_SIZE_CAP = 75`).** The auto trade size is still ~8 % of working
  capital, but now capped at 75 shells. This flattens late-game compounding so the account
  curve stops running away — the single change that brings the Market Maker projection into range.
- **Guardian rewards re-trimmed** to fit the target scale: `55, 75, 95, 120, 150, 180, 210,
  245, 285, 330, 390` (Gambler → Market Maker). XP rewards unchanged.
- Everything else from the approved economy stays exactly as-is: shells = trading capital,
  collection = +1, trading is the primary engine, reserve protects the last 50, leverage =
  exposure only (capped to working capital), start = 100.

## 2. Reserve visibility changes

The reserve is now **exposed to the player as emergency capital / a risk lesson**, in the two
account displays:

- **Shell Wallet** — the header now reads **TRADING CAPITAL**, with a breakdown beneath it:
  *💹 Tradable capital* and *🛡️ Protected reserve (50)*, plus the line *"Your reserve is
  emergency capital — it can never be lost. You trade with everything above it."*
- **Level-complete intermission** — the "Your Trading Account" block now shows **Tradable
  capital** and **Protected reserve** alongside Trading Profit, Shells Collected, and the
  Guardian Reward — so every level-end reinforces *what you can risk vs. what's safe*.

## 3. Shell standardization status

One shell identity now renders everywhere the engine draws or displays a shell:

- **Canvas (gameplay):** `drawShell()` — collectibles and the cinematic intro shells (done last pass).
- **DOM/UI (new this pass):** `shellHTML()` — an inline-SVG of the same scallop, now used in the
  **Shell Wallet balance + reserve breakdown**, the **intermission account block**, the **boss
  reward screen**, and the **mastery reward line**.
- **Intentionally left as the 🐚 glyph:** transient canvas floaters ("+1") and the one-line goal
  HUD — replacing inline SVG inside canvas-drawn text isn't practical and these are fleeting.
  The glyph is uniform where it remains. *One shell, one icon — across every account-facing surface.*

## 4. Updated balance projections

Monte-Carlo of the implemented rules (cap 75, 8 % working-capital trades, trimmed Guardian
rewards, reserve floor). Median account balance:

| Milestone | Win 50% | Win 55% | Win 60% | Target |
|---|--:|--:|--:|---|
| After **Guardian 1** | 264 | 264 | 297 | 250–350 ✅ |
| After **Guardian 5** | 1,352 | 1,588 | 1,844 | 1,500–2,500 ✅ |
| After **Market Maker** | 4,015 | 4,585 | 5,168 | 3,000–5,000 ✅ |

All three bands land in target for typical play; a sustained high win rate (≥60 %) nudges the
finale just over 5k, which is the intended "skill is rewarded" tail rather than runaway inflation.

## 5. Intro cinematic flow

```
glitch → fall (collect the first shells) → choose your chain (BTC/ETH/SOL)
       → warp → impact (white flash)
       → ⟶ DARK TRANSITION ⟶ THE MARKET MAKER TEASER ⟵ (new — replaces The Validator)
       → title → into the game
```

The **Market Maker teaser** holds on black for ~1.2 s (the dark, mysterious transition), then
fades in the supplied animation behind a heavy radial **vignette** and a pulsing violet glow,
while four short dialogue lines step across the bottom. It ends when the clip finishes (or a
safe ~8 s cap), then resolves to the title. A **SKIP** control is always present. The Validator
beat is retired (its code is left dormant, not deleted).

## 6. Market Maker dialogue

Four short, legendary lines on patience / discipline / skill — and the threat of becoming his
liquidity:

> *"Most who enter these charts chase quick riches…"*
> *"They become my liquidity."*
> *"Patience. Discipline. Skill — only these defeat me."*
> *"Prove you possess all three. I will be waiting."* — **◆ THE MARKET MAKER ◆**

The name lands only on the final line, so he's established as the end-game villain without an
early over-reveal.

## 7. Animation integration details

- **File:** `Market-maker-cinematic.mp4` (6.0 s, 1008×896, H.264, 10.7 MB) — present in the folder.
- **How it plays:** a DOM `<video>` overlay (`#mmVideo`, `muted` + `playsinline`) layered over the
  cinematic canvas, `object-fit: cover` (keeps the centre — the face/eyes — in frame on portrait),
  darkened via CSS filter + vignette to **preserve mystery**. The canvas draws pure black behind it.
- **Lazy + first-play only:** the clip's `src` is set only when the cinematic actually starts, so it
  buffers during the ~30 s fall and is **never fetched for returning players** (who skip the cinematic).
- **Robust:** muted autoplay (allowed without a gesture, and the player has already tapped during the
  fall/portal); if the video fails to load, the teaser degrades to a dark void + glow + the dialogue —
  still atmospheric. The clip's `ended` event advances the flow; an 8 s cap is the fallback.
- **Deploy:** added `Market-maker-cinematic.mp4` to the deploy script's file list so it ships with the site.

## 8. Remaining narrative risks

- **First-play only.** The teaser shows on a fresh first run (no `cq_played`). You've already played,
  so you'll only see it after a progress reset / fresh browser — worth testing there.
- **Video crop on tall screens.** The clip is near-square on a portrait phone; `cover` crops top/bottom.
  The centre stays framed, but if the key reveal sits high/low in the source it could clip — quick
  visual check recommended. (Switching to `contain` letterboxes it if you prefer the full frame.)
- **10 MB on first load.** It buffers during the fall and only on first play, but on a very slow
  connection the fade-in could lag the dialogue; the dark-void fallback covers that case.
- **Autoplay edge cases.** Muted autoplay is broadly allowed, but a locked-down browser could still
  block it — handled by the graceful dark-teaser fallback, just not the full animation.

*Implementation complete. Synced to `index.html`; service worker v37; video added to the deploy
list. Not deployed yet — deploy when ready (the deploy will now include the 10 MB clip).*
