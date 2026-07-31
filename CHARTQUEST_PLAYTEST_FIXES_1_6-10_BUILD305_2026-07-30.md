# ChartQuest — Playtest Fixes 1 and 6–10 (builds 304–305)

**Date:** 2026-07-30
**Builds:** 303 → **305** · `sw.js` cache `v302 → v305` · all three copies byte-identical
**Gate:** 15 pass · 0 fail · 1 skip
**Status:** Fixes 1, 6, 7, 8 DONE and verified · Fix 9 partially done · **Fix 10 BLOCKED — see §Fix 9/10**

---

## Fix 1 — One journal cinematic, and it's the good one

**1a. The pop-up notebook is gone.** `finn-journal.mp4` already tells the whole story: the CHART
QUEST book descends in the golden beam, Finn catches it, opens it, and a portal spirals open in the
pages. On top of that we fired `playJournalUnlock()` — a *second*, worse cinematic built from an
emoji book and a page-flip. That's the "random notebook" you saw. **Deleted: 90 lines of JS and 68
lines of CSS.** The outro chain now ends on the real cinematic's portal and hands straight to the
interactive quest.

**1b. The finale shows the real book.** It was rendering `📓` (U+1F4D3), which Apple draws as the
black-and-white marbled composition notebook — exactly the "random black and white notepad" you
described. It now shows `journal-book.webp`: that exact book, cut from frame **11.0s of the
cinematic itself**, edge-feathered so it reads as coming out of the beam rather than as a pasted
rectangle. 292×480, 17KB.

**Rescued along the way:** the "📜 N LOST CHAPTERS RESTORED" payoff lived inside the deleted
overlay. Recovering pre-Journal pages has to stay worth something, so it now appears on the quest's
finale card under the +10 shells. Verified showing "2 LOST CHAPTERS RESTORED".

**1c. The QR can no longer lie to you.** Root cause of your missing tutorial: another worktree had
already claimed port 8795, so `scripts/cq.sh qr` pointed at **feature/home-market-ceremony** while
the work under test sat in main — and nothing anywhere said so. `cq.sh qr` now compares the
`BUILD_TAG` **on the wire** against the one **on disk** and refuses to print a misleading QR,
naming the offending checkout when they differ.

```
✗ PORT 8795 IS SERVING A DIFFERENT CHECKOUT — refusing to print a misleading QR.
    on the wire : build 320
    in this dir : build 305
    that port is being served from: …/.claude/worktrees/home-market-ceremony
```

Two bugs found in that guard while testing it: it was matching prose in old comments instead of the
tag line, and `[0-9]*` matched the bare word "build" so both sides came back empty and compared
equal. Both fixed; all three paths (right port / wrong port / dead port) verified.

---

## Fix 6 — The Guardian summons is readable

It was a loose floater pinned at `y=104`, sitting directly behind the canvas-drawn CURRENT LESSON
badge — so you read a Guardian summons with its first words covered. It's now the **boxed plate**:
the same centred, framed, auto-fitted card Lost Wisdom uses, which exists precisely because loose
headlines overflow narrow phones. Verified rendering at screen-centre (y=325 on a 812px screen),
clear of the badge.

> Note on "better font": the plate uses the game's canonical plate typography, shared with Lost
> Wisdom and every other announcement card. I kept it consistent rather than inventing a one-off
> face. If you want a different one, it's a single change in the floater renderer — but it moves
> every plate in the game, so I left that to you.

---

## Fix 7 — The music says a boss is coming

The stretch between the last trade and the gate was still the calm 84bpm `explore` loop. There's now
an **APPROACH** bed — 108bpm, minor instead of pentatonic, drums in — that starts the moment the
gate appears. It sits deliberately *between* explore and the boss theme in pace and density, so
walking into the arena is still an escalation rather than an anticlimax. It ends itself:
`bossFinish()` already restores `explore`. Respects the mute toggle.

---

## Fix 8 — The gate pulls

The approach was a dark vignette closing in, which reads as the screen getting *dimmer*, not as
something ahead pulling you toward it. Two additive gold layers now ride on the **same
`bossApproachT`** the vignette already uses (0 at 20 candles out → 1 at the gate), so the whole
approach intensifies as one motion:

1. **A gold rim that breathes** — and breathes *faster* the closer you get. The gate's light
   bleeding in around the edges of the world.
2. **Embers streaming past Finn toward the gate** — the air itself moving the way he's going.

Render-only and allocation-free: ember positions are hashed from the index, so there's no particle
array to leak. Clocked off `performance.now()` — never `turtle.animT`, which is reset in the
victory-idle path — so the drift is smooth and survives a pause.

---

## Fix 9 / Fix 10 — the flinch cinematic and the roar

**This is the one to read carefully.**

**The flinch system does not exist in main.** Zero references. It lives in the
**home-market-ceremony worktree** (build 320, 24 references) — the same branch you were
accidentally playtesting. The clips exist as separate per-worktree copies, so changing main's copy
does not affect that branch, and vice versa.

**Fix 9 — partially done.** I re-encoded `boss-1-flinch-3.mp4` to **true 60fps** using
motion-compensated interpolation (not naive frame duplication): 331 frames, 2.3MB.

But **the frame rate was not the root cause**, and you should know that before we spend more on it:

- All four flinch clips are 24fps. The other three are fine.
- Clip 3 is simply **the longest by far** — 5.6s, versus 3.1s for clip 2. A hit reaction that runs
  5.6 seconds will read as laggy no matter how smooth it is.
- It **opens mid-explosion** — frame one is a full-screen spark burst with no ramp-in, so cutting to
  it flashes.
- There's AI-video morphing in the creature's body between frames, which interpolation smooths but
  cannot remove.

My read: trimming the opening and shortening it will do far more than the frame rate did. But that's
a judgement about a feature I can't see running, on a branch I don't own.

**Fix 10 — not done, deliberately.** The roar has to hook into the flinch playback, which only
exists on the other branch. Doing it from main would mean either duplicating another agent's system
or writing into their active working tree — that agent moved from build 307 to 320 *during this
session*, so they're mid-flight. You explicitly asked me not to create merge conflicts with
concurrent work, so I stopped and am flagging it instead.

**What I need from you:** either merge home-market-ceremony into main and I'll do 9 and 10 properly
there, or tell me to work directly in that worktree and I will — but I won't do it silently.

---

## Verification

| Check | Result |
|---|---|
| Old journal overlay removed (JS + CSS) | **PASS** — `playJournalUnlock` undefined, no `#jUnlock` rules |
| Book asset loads at the finale | **PASS** — 292×480 |
| Lost Wisdom payoff on the finale card | **PASS** — "2 LOST CHAPTERS RESTORED" |
| QR guard: wrong port | **PASS** — refuses, names the worktree |
| QR guard: dead port | **PASS** — refuses with guidance |
| QR guard: correct port | **PASS** — prints, states the verified build |
| Summons is a centred plate | **PASS** — y=325, clear of the badge |
| APPROACH music bed exists and plays | **PASS** |
| Gate-pull renders without error at full intensity | **PASS** |
| flinch-3 re-encode | **PASS** — 24fps → true 60fps |
| Regression gate | **15 pass · 0 fail · 1 skip** |
| Mirrors | byte-identical |

---

## Concerns

1. **Fix 10 is blocked**, and Fix 9 is treating a symptom. See above — this needs your call.
2. **The 60fps clip is 2.3MB, up from 1.1MB.** Fine for the gate (<5MB) but it doubles the download
   for one flinch. If all four get this treatment that's ~9MB of flinch video on a mobile game.
3. **The gold gate-pull is tuned blind.** I verified it draws correctly at full intensity but I
   can't judge "cool" from a static frame — it needs your eyes during a real approach.
4. **The book feather is a taste call.** First pass was a hard rectangle, second dissolved too far;
   the shipped value is between them. Easy to nudge either way.
5. Still uncommitted; the tree still holds the earlier build-301 collectible work that isn't mine.
