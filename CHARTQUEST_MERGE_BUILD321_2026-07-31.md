# ChartQuest — The Merge (build 321)

**Date:** 2026-07-31
**Result:** main + `feature/home-market-ceremony` = **one lineage, build 321**
**Gates:** 16 pass · 0 fail · 1 skip · 500 frames clean · all three copies byte-identical
**Scan:** `~/Desktop/ChartQuest-BUILD321-MERGED-QR.png` (also regenerated `ChartQuest-Test-QR.svg`)

---

## 1. Why the build numbers made no sense

You were right to be suspicious. The numbers were genuinely meaningless.

**The build tag is a single global counter living in one file — but three working copies were each
incrementing it from the same fork point (298) at the same time.**

| Where | Build | What it actually was |
|---|---|---|
| Your desktop QR | 302 | a stale SVG, never regenerated, pointing at port 8795 |
| main working tree | 305 → 306 | my work, then a third agent's lesson-label work on top |
| ceremony branch, committed | 311 | that agent's last commit |
| ceremony worktree, uncommitted | 320 | nine builds past their last commit |
| port 8795 (what you played) | 307 → 320 | the ceremony worktree, not main |

So "311" was never newer than "306" — they were **parallel forks wearing sequential-looking
numbers**. Nobody was lying to you; the counter simply can't express a fork. That's also why your
playtest was missing the Journal tutorial: the QR pointed at a port another worktree had claimed.

**Fixed three ways:**
1. It's now one history. **321 is the only number**, and it's in all three copies plus `sw.js`.
2. `cq.sh qr` refuses to print unless the build on the wire matches the build on disk, and names the
   offending checkout when it doesn't (added in 304).
3. Port 8795 now serves the merged build, the stale desktop QR is regenerated, and the intermediate
   QRs I'd made are deleted so there's exactly one to scan.

---

## 2. What got combined

Both lineages were **committed first** so nothing could be lost — the ceremony worktree had nine
builds of work with no commit behind it.

**From the ceremony branch:** Home Market identity system, boss **flinch cinematics**, the new
intro/defeat/Finn-Journal clips, box + trade audit fixes.

**From main:** the interactive Journal quest, the lesson-label solver, playtest fixes 1–8.

**20 conflict hunks**, resolved individually. Most were the same code with differently-worded
comments. Two were places where **both agents had independently fixed the same problem** — for those
I took the **union**, not a side:

- **Box smash.** The branch's predicate is more forgiving (a late downward swipe still counts as a
  dive, so it feels strict rather than broken); main's adds `boxRefuse()` so a touch that *doesn't*
  smash visibly refuses. Now it has both.
- **The broken-candle rep.** The branch deferred it behind an event ledger so it stops stealing the
  third trade's moment; main made it a portal so it's earned like every other lesson. Now it's
  deferred *and* a portal.

The redundant DOM journal overlay stays deleted.

`verify.js` keeps all three agents' gates: collectible law (14), lesson labels (15), market identity
(16 — renumbered from the branch's 14, which collided).

---

## 3. A real bug the merge introduced, caught before you saw it

The ceremony branch forked **before** build 300 renumbered the boss roster. On that branch the
Gambler is level **0**; on main he's level **1**.

Its `BOSS_FLINCH_VIDEOS` was therefore keyed `0`, while main's `BOSS_OUTRO_VIDEOS` is keyed `1`. Left
alone, every flinch lookup would have missed and **the flinch cinematics would have silently never
played** — no error, no crash, just nothing. Exactly the kind of merge damage that survives to a
playtest.

Found by comparing both rosters at runtime after the merge, renumbered to 1, re-verified: rosters
agree, 4 flinch clips wired to the Gambler.

---

## 4. Verified

| Check | Result |
|---|---|
| Journal quest, book asset, box refusal, first-win gate, reward ledger, LIE portal, approach music, gate pull | all present |
| Flinch system + home markets + lesson-label solver | all present |
| Old journal overlay | still deleted |
| Flinch/outro rosters agree | **yes** — 4 clips on the Gambler |
| Cold boot, 500 frames | **clean, no errors** |
| Build number in all 3 copies + sw.js | **321** |
| Gate suite | **16 pass · 0 fail · 1 skip** |

---

## 5. Still open before you send this to ten people

1. **Fix 10 — the boss roar.** Now unblocked: the flinch system is finally in main, so I can wire
   the roar. Not done yet.
2. **Fix 9 is treating a symptom.** Clip 3 is re-encoded to true 60fps, but the frame rate was never
   the cause — it's the longest clip by far (5.6s vs 3.1s) and opens mid-explosion with no ramp.
   Trimming it will do more than the interpolation did.
3. **The 60fps clip is 2.3MB, up from 1.1MB.** Fine alone; if all four get the same treatment that's
   ~9MB of flinch video on a mobile game.
4. **Nothing here has had a human playtest yet.** The merge is verified structurally and at runtime,
   but "16 gates pass" is not "the first boss is 10/10". That's the next thing.
5. **The third agent (lesson labels) was still writing to main 23 minutes before I merged.** If they
   resume, they'll be working on a pre-merge file. Worth telling them to re-sync.
