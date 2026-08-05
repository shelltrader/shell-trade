# T-005c — The pre-trade zone

**Date:** 2026-08-05 · **Status:** **IMPLEMENTED, MEASURED — NOT COMMITTED** (see §4: the working tree holds another session's in-flight work)
**Verdict on the mechanism:** **marginal. It does not fix the worst case, and I can't claim it works.**

---

## 1 · WHAT I BUILT

A forward reservation, inside `window.CQBEAT`, using the game's own scheduler.

`genSetupIn` (`chart-quest.html:7854`, decremented `:6090`, fires `:6107`) is the **generation-side**
counter — *"filler candles to generate before the next scripted setup sequence"*. It lives in the
same coordinate space as box/page placement, so it turns a trade from an unpredictable player
action into something reservable:

```
zone = [ predicted − PAD , predicted + SETUP_SPAN + PAD ]
predicted = generationEdge + genSetupIn      (or the edge itself if a setup is already live)
```

A live `setupFlow` / `pending` / `tradeIncomingActive` is a certainty rather than a prediction, so
the zone anchors at the edge in that case. Only **placeables** (box, page, minigame — priority ≥
page) are held back; a trade, lesson or any moment is never refused by a prediction.

Also added `CQBEAT.setPretrade(bool)` and `CQBEAT.pretrade`, specifically so the thing could be
**A/B'd rather than argued about**.

---

## 2 · TUNING — the first attempt deleted the content it was pacing

`SETUP_SPAN 22` with the full trade gap (20) as padding on both sides = a **62-candle** exclusion
zone. On a Level-1 run whose trades land 40–60 candles apart, that swallows the level:

```
5 vetoes · 0 of 2 boxes placed
```

A pacing rule that removes the reward it is pacing has failed. Retuned to `SETUP_SPAN 12`,
`PRETRADE_PAD 8` (a 28-candle zone), and `MAX_DEFER` **40 → 3**, sized against how often a placeable
actually *asks* (~5 box attempts per level, because a box only asks at a confirmed valley) rather
than against candles — at 40 the starvation guard could never fire inside a level and was decorative.

---

## 3 · THE MEASUREMENT — A/B, n=4 per arm, 120 chunks each

| | boxes placed | trade violations | collisions < 10 candles | worst gap seen |
|---|---|---|---|---|
| **OFF** (build 338 behaviour) | 2.00 | 2.50 | 1.75 | **1** |
| **ON** (pre-trade zone) | 2.00 | 2.00 | 1.50 | **1** |

**Read it honestly:**

- ✅ **No progression cost.** Both arms placed the full `BOXES_PER_LEVEL` = 2 in every trial.
- 🟡 **Directional improvement only** — violations 2.50 → 2.00 (−20%), sub-10 collisions 1.75 → 1.50
  (−14%). With n=4 per arm and this variance, that is **not a result I can call significant**.
- ❌ **The worst case is unchanged.** A 1-candle collision occurred in *both* arms. The thing the
  founder actually complained about — an event landing effectively on top of another — still happens.
- The zone fired at all in only 1 of 4 ON trials once tuned narrow enough to keep the boxes.

## 3.1 · WHY — the structural limit, now proven twice

`genSetupIn` predicts when a setup begins **generating**. The trade commits when the player
*reaches* the armed setup and *chooses* to enter — a different, later, player-dependent moment. The
correlation is real but weak, which is exactly what the numbers show.

And relocation cannot rescue it either. The measured collisions look like:

```
box placed @139   (generation edge, Finn ~124)
trade committed @136   → the box is now 3 candles AHEAD of Finn — ON SCREEN
```

By the time the trade exists, the conflicting box is already visible. Moving it would be a visible
teleport; deleting it would remove a reward the player can see.

> **A trade's position is not knowable at placement time, and by the time it is known the
> conflicting object is already on screen. Neither prediction nor relocation can close this.**

This is the second serious attempt at trade-vs-object spacing (priority in build 338, prediction
here). Per the two-attempt rule I stopped rather than trying a third variant. The remaining honest
options are all founder calls:

- **(a) Accept it.** A reward occasionally sits near a trade. Boxes are 2 per level; the collision
  is rare and arguably unimportant next to the page/box/lesson spacing that build 336 did fix.
- **(b) Change trade scheduling** so setups avoid recently-placed rewards. That is the protected
  trading system (`protected_systems.md` #9) and I would not touch it without an explicit ask.
- **(c) Place boxes only in provably calm stretches** — e.g. require a minimum distance from the
  *previous* trade and cap boxes to the level's first third. A real design change to where rewards
  live, not a spacing rule.

My recommendation is **(a)**, and to spend the effort on the pre-trade *zone being off* rather than
carrying a mechanism whose benefit I cannot demonstrate.

---

## 4 · WHY NOTHING WAS COMMITTED

While I was working, another session made substantial uncommitted changes to the same tree:

```
M chart-quest.html      (CQOPS — a ~764-line operational foundation, spliced from ops/cq-ops.js)
M scripts/cq.sh         (new `ops` command; ship reordered to ops → mirror → site → verify)
M scripts/verify.js     (gate #19)
M scripts/founder_report.py
M dashboard.html
   BUILD_TAG already taken to build 339
```

`git` stages whole files, so committing `chart-quest.html` would sweep their in-flight work into my
commit under my message. `CLAUDE_RULES.md` #12–13 exist precisely to prevent that. **Their call, not
mine** — so the tree is left working and uncommitted.

Note gate **#10 currently reports "Save keys changed"**, which is *not* mine: CQBEAT and the
pre-trade zone touch no `cq_*` key. It comes from CQOPS.

---

## 5 · A BUILD-BREAKING BUG I FOUND AND FIXED (not mine)

**The game did not boot at all.** `window.CQ`, `CQREACH`, `frame` and even `BUILD_TAG` were all
unreachable — the entire MAIN script block failed to *parse*.

Cause: the build-339 `BUILD_TAG` contains an unescaped apostrophe —

```
…every product flag defaulting to today's shipped behaviour…
                                        ^ closes the single-quoted string
```

One character, and 28,000 lines of game stop existing. Fixed by escaping it (`today\'s`); nothing
else about that text was touched. All 10 inline blocks now parse.

### The reason nobody caught it: `cq.sh check` is now lying

```sh
# scripts/cq.sh:22 — grabs the FIRST <script> and the first </script>
node -e '…h.indexOf("<script>")…'
```

CQOPS was inserted in `<head>`, **above** MAIN. So `cq.sh check` has been syntax-checking the wrong
block and reporting `✓ syntax OK` on a file whose game block does not parse. Only `verify.js` gate
#3a — which parses *every* block — caught it.

**That is a real hazard and it is not fixed.** `cq.sh check` should parse every block, exactly like
gate #3a. I have not changed it, because `cq.sh` is one of the files the other session is editing
right now. It is the single highest-value follow-up in this document.

---

## 6 · FOUNDER REVIEW

The thing that bothers me most is not the marginal result — it is that **I shipped builds 337 and
338 saying "the pre-trade zone is the next slice and it is the one that will actually change what
you feel." I was wrong.** I said it twice, confidently, in two ticket documents. Having now built
and measured it, the honest answer is that it moves the average slightly and leaves the worst case
exactly where it was. If you had read those documents and expected this to fix the pacing, that was
my overclaim, and this is me correcting it.

Second: the only reason I know it is marginal is that I built the A/B switch. My instinct after the
first tuned run — 1 veto, 2 boxes, looks healthy — was that it worked. It took eight trials to see
it does not. I would rather have found that before writing "next slice" twice.

Third, and most urgent for you regardless of any of this: **the game currently does not boot from a
clean checkout of the working tree without the one-character fix in §5**, and the tool everyone uses
to check that (`cq.sh check`) says everything is fine.
