# Chart Quest — Shell Economy Rework · Report

Shells are now unambiguously **trading capital** — a balance you grow by trading, not coins
you hoard. The game parses clean (4/4), `index.html` is synced, and the service worker is
bumped **v35 → v36**.

**Untouched** (as required): curriculum, bosses (identity/rounds/order/art/realms/lore),
progression, lessons, Guardian systems, and **XP** (shells ≠ XP — XP values are unchanged).
Only the shell economy and shell visuals changed.

---

## 1. Economy audit (what it was)

| Lever | Before | Problem |
|---|---|---|
| Starting balance | **0 shells** | No capital; nothing to protect; bankruptcy at 0. |
| Collectible value | **10 × (1 + combo/3)** | Inflationary — a combo run printed 20–40 per shell; collection rivalled trading. |
| Trade payout | `risk × leverage × R:R`, floored at **0** | Fine shape, but no reserve → you could bust to 0. |
| Leverage | 1/2/3/5× multiplies **both** risk and reward, uncapped | A single 5× win could balloon the account → exponential inflation. |
| Boss rewards | **200 → 1100** | On a ~0–100 economy these were 2–11× the whole balance — runaway. |
| Reserve | none | Bankruptcy possible; no "emergency capital" fantasy. |
| Shell visuals | collectible = teal orb + 🐚 overlay; cinematic = **gold coin**; UI = 🐚 | Three different shell designs. |

---

## 2. New shell design (one canonical shell)

One design now renders every gameplay shell: a **ribbed ocean scallop** with a pearl sheen
and a soft cyan glow — memorable silhouette, premium feel, readable from ~10 px (collectibles)
up to large UI sizes. Implemented as **`drawShell(ctx, cx, cy, r, pulse)`** and applied to:

- the **collectible shells** on the chart (replaced the teal orb), and
- the **cinematic intro shells** (replaced the gold coin — `drawShellIcon` now calls `drawShell`).

A standalone vector of the design is in **`canonical-shell.svg`** (shown alongside this report).
UI text uses the 🐚 glyph, which is already uniform across the interface; the canonical
`drawShell` is the single *drawn* shell everywhere the engine renders one.

---

## 3. Reserve system (no bankruptcy)

- **`RESERVE = 50`** — a permanent, protected floor. The account can never drop below it.
- Players now **start at 100 shells** (`START_SHELLS`) = 50 protected reserve + 50 working capital.
- Every shell sink floors at the reserve: trade losses (`Math.max(RESERVE, …)`) and the
  liquidity-sweep zap (only working capital can be swept). The intermission shows a
  **"🛡️ Protected reserve — 50 🐚"** line so the fantasy is explicit: *emergency capital you
  can always trade back from.*

## 4. Trade reward balancing (trading is the engine)

- **Collection = exactly 1 shell** (`SHELL_PICKUP`), flat — the combo bonus on shells is gone
  (combo is kept purely for the streak flair). Every shell matters; collection *funds* trading.
- **Trades scale with the account.** The recommended/auto trade size is **~8 % of working
  capital with a 5-shell floor** (`recommendedRiskAmt`), so trades are meaningful early and
  grow as the account grows. A winning trade returns `risk × R:R` (typically ~2×).
- Net effect (modelled): at ~400 capital, trading earns **~7× more than collection per level**,
  and the gap widens as capital grows. Trading is decisively the primary income.

## 5. Leverage balancing (exposure only, sustainable)

- Leverage still amplifies a trade symmetrically (more leverage = more reward **and** more risk
  on that trade — the real lesson), but it is now **capped to exposure you actually hold**:
  `risk × leverage ≤ working capital` (`clampAmt`). A single leveraged trade can scale the
  position up, but can **never breach the protected reserve** and can't print a balance-multiplying
  windfall — which kills the exponential-inflation path.
- The leverage tier panel only appears once leverage is **taught (Level 7)** *and* unlocked, so
  it's introduced as an educational tool, not stumbled into early.

## 6. Estimated account-progression curve

Monte-Carlo of the implemented rules (start 100, +1/collectible, ~8 % working-capital trades at
~2:1, rescaled Guardian rewards, reserve floor). Median balance:

| Milestone | Win rate 50% | Win rate 55% | Win rate 60% |
|---|--:|--:|--:|
| After **Level 1 / Guardian 1** | ~298 | ~298 | ~333 |
| After **Guardian 5** | ~1,730 | ~2,080 | ~2,520 |
| After **Market Maker (Guardian 10)** | ~9,700 | ~13,600 | ~20,000 |

Steady ~1.4× growth per Guardian, no runaway, no grind wall — and **trading skill (win rate)
clearly accelerates wealth**, which is exactly the intended incentive. Rescaled Guardian rewards
(milestone bonuses): 60 · 100 · 130 · 170 · 220 · 280 · 360 · 460 · 600 · 780 · 1200.

## 7. Files modified

| File | Change |
|---|---|
| `chart-quest.html` | RESERVE/START/PICKUP constants; start at 100; reserve floors (trade + sweep); collection = 1; `recommendedRiskAmt`; leverage exposure cap (`clampAmt`) + Level-7 gate; rescaled 11 Guardian shell rewards; canonical `drawShell` + collectible/cinematic unified; per-level `session.collected`; intermission "Your Trading Account" (Trading Capital / Trading Profit / Shells Collected / Guardian Reward / Protected Reserve). |
| `index.html` | Re-synced — byte-identical. |
| `sw.js` | Cache **v35 → v36**. |
| `canonical-shell.svg` | New — the canonical shell design reference. |

## 8. Remaining economy risks

- **Bottomed-out working capital.** If a player loses all working capital they sit at the 50
  reserve, where trades are capped near zero; they rebuild via collection (1/shell) and Guardian
  rewards. Intended as a real lesson, but a cold streak makes rebuilding slow — worth a playtest.
- **Win-rate sensitivity.** The curve assumes ~50–60 % wins. A persistently sub-50 % player still
  progresses (boss rewards + collection keep the account afloat above the reserve) but grows
  slowly — by design, but verify it doesn't feel punishing.
- **R:R is player-set at Level 5+.** A player who always sets very high R:R targets can skew
  growth upward; the leverage/exposure cap bounds the per-trade swing, but extreme R:R is a free
  variable — flag for tuning if late-game balances run hot.
- **UI text still uses the 🐚 glyph** (uniform, but not the vector shell). If you want the custom
  vector in the wallet/HUD too, that's a follow-up (it'd mean swapping emoji for inline SVG in
  the DOM/canvas text — larger, lower-value change). Flagged, not done.

*Implementation complete. Synced to `index.html`; service worker at v36. Not deployed yet —
deploy when you're ready.*
