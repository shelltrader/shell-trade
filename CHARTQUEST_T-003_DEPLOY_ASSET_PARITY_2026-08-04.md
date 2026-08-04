# T-003 — Deploy asset parity: fix the boss-media copy + add the gate

**Date:** 2026-08-04 · **Build:** 335 (game untouched) · **Files:** `scripts/cq.sh`, `scripts/verify.js`
**Status:** **PASS — SHIPPED AND VERIFIED LIVE.** Commit `e6334bb`, pushed to `main`, deployed.

> ## ✅ DEPLOYED AND CONFIRMED ON PRODUCTION
>
> All **13/13** previously-broken assets now serve real media from `https://playchartquest.com`:
>
> | Asset | Before | After |
> |---|---|---|
> | `bosses/outros/boss-1-defeat.mp4` | `200 · text/html` | **`200 · video/mp4 · 3,265,565 b`** |
> | `bosses/outros/finn-journal.mp4` | `200 · text/html` | **`200 · video/mp4 · 3,590,001 b`** |
> | `bosses/intros/boss-1.mp4` (+ 2, 3, 11) | `200 · text/html` | **`200 · video/mp4`** |
> | `bosses/flinches/boss-1-flinch-1…4.mp4` | `200 · text/html` | **`200 · video/mp4`** |
> | `bosses/sfx/boss-roar-1…3.m4a` | `200 · text/html` | **`200 · audio/mp4`** |
>
> Sizes match the source byte-for-byte. **The Boss Defeat and Trading Journal Unlock cinematics now
> exist for external testers.** `boss-1-flinch-3.mp4` needed one extra CDN propagation cycle (~2 min);
> it is live and correct.
>
> **No collateral change:** production `/game` md5 is still `a4380ec7e3c19a8e437277413922e4dd` —
> identical to local `chart-quest.html`, build 335 untouched. Landing page unchanged. Gate: **15 pass,
> 0 fail, 0 warn.**
>
> One extra step was needed at commit time, described in §4.


---

## 1 · THE HEADLINE: I HAD THE ROOT CAUSE WRONG, AND THE GATE CAUGHT ME

In the verification report I told you the cause was `scripts/cq.sh:40` — `cp -f bosses/*.webp
website/bosses/`, non-recursive, so the subfolders never got copied. I recommended a one-line
`rsync -a`.

**That diagnosis was wrong, and the recommended fix would have been actively bad.** Two things I
had not checked:

1. **`bosses/intros/` is 113 MB.** The game references only boss-1/2/3/11 (`BOSS_INTRO_VIDEOS`);
   boss-0 and boss-4…boss-10 are ~97 MB of clips nothing loads. A recursive copy would have put all
   of it into the deploy **and into git**.
2. **The files were already in `website/bosses/`.** All four subfolders, 128 MB, on disk since
   late July. The copy was not the blocker.

The real cause is one line further down the chain:

> **Every one of those files is UNTRACKED in git. Cloudflare Pages builds from the git repo.
> An untracked file never reaches production, no matter how correct the folder looks locally.**

That is why production returned the 200-OK landing page for all 13 media files while the folder sat
right there in Finder. It also explains why `git status` looked clean at a glance — the default
output collapses untracked entries, and nobody was looking for absence.

**How it got caught:** I wrote the first version of gate #17 to assert "referenced asset exists
under `website/`". It **PASSED on the tree I had just proven broken in production**. A gate that
green-lights a known-broken deploy is worse than no gate, so I dug into the false pass — and the
untracked state is what came out. The corrected gate asserts *committed*, not *present on disk*.

---

## 2 · WHAT CHANGED

### `scripts/cq.sh` — `site` now copies referenced boss media, preserving structure

Derives the list from the game itself rather than a hand-maintained one, matching the existing
auto-discovery used for top-level media:

- **Literal paths** — `grep -oE "bosses/[…]\.(mp4|m4a|webp|png|jpg)"`.
- **Runtime-built paths** — `bossIntroVideoSrc` concatenates `'bosses/intros/boss-' + level +
  '.mp4'`, so no literal exists to grep. The gate and the copy both expand the authoritative
  `BOSS_INTRO_VIDEOS = new Set([1, 2, 3, 11])`.
- **Skips refs that resolve to nothing on disk** — `bosses/trend-crab.webp` and
  `bosses/sfx/boss-roar-1..3.m4a` are prose inside comments. Gate #17 reports them so a genuinely
  missing *source* asset is never mistaken for a comment artifact.
- **Copies 13 files, not 21.** The ~97 MB of unreferenced intros is deliberately excluded, and
  there is a comment in the file saying so, so the next person does not "fix" it with `cp -R`.

### `scripts/cq.sh` — `ship` step order

`mirror → verify → site` became **`mirror → site → verify`**. The gate has to observe the state
that actually ships; previously `site` ran *after* the gate, which is structurally how this class
of bug survived every ship. A FAIL still blocks the commit — it now just leaves a refreshed
`website/` behind, which the next ship overwrites.

### `scripts/verify.js` — new gate #17, "Deploy asset parity"

For every asset the game references that exists at the repo root, assert it is:
1. present under `website/`,
2. **git-tracked** (the assertion that actually maps to "a tester will receive this byte"),
3. byte-size-identical to the source.

Deviation from house style, deliberate: **an exception in this gate is a `FAIL`, not the `WARN`
used by gates #12–#16.** A gate whose entire purpose is to catch "the file silently was not there"
must not itself pass silently when it breaks.

---

## 3 · EVIDENCE

**Gate fails on the real defect, naming exactly the 13 files my production probe found missing:**

```
✗ [17] Deploy asset parity (every referenced asset present in website/, committed, same size)
     IN website/ BUT UNTRACKED — Cloudflare deploys from git, so production returns the
     200-OK landing page for these: bosses/flinches/boss-1-flinch-1.mp4 … -4.mp4,
     bosses/intros/boss-1.mp4, boss-2.mp4, boss-3.mp4, boss-11.mp4,
     bosses/outros/boss-1-defeat.mp4, bosses/outros/finn-journal.mp4,
     bosses/sfx/boss-roar-1.m4a, -2.m4a, -3.m4a → git add them

  14 pass · 1 fail · 0 warn · 3 skip        EXIT=1
```

The 13 named files are **the same 13** that returned `200 · text/html` from
`https://playchartquest.com` — independently derived, exact match.

**Positive control (proves the gate discriminates, rather than failing everything):** `finn/*.png`
and all 11 `bosses/boss-N.webp` portraits **PASS** — they are tracked, present and identical. Only
the untracked set fails.

**Copy verified:**
```
$ bash scripts/cq.sh site
  ↳ boss media: 13 referenced file(s) mirrored into website/bosses/
$ md5 source vs website, all 13        → identical=13 mismatched=0
$ unreferenced boss-0,4,5,6,7,8,9,10   → not copied (correctly excluded)
```

**No collateral damage:** `git status` shows only `scripts/cq.sh` and `scripts/verify.js` modified.
The game document was never read for writing, never bumped, never mirrored. Gates #1–#16 all still
pass.

---

## 4 · WHAT SHIPPED (and the one thing that blocked it)

Committed as `e6334bb` on `main`, pushed, auto-deployed by Cloudflare. **15 files, 24.3 MB**, staged
by explicit path — never `git add -A`.

**Gate #9 blocked the first commit attempt, correctly.** The ~97 MB of unreferenced intro clips I
flagged as a landmine in §5 tripped "No large binaries added (>5MB)" — `boss-8.mp4` alone is 20 MB.
Before removing anything I verified all 8 (`boss-0`, `boss-4`…`boss-10`) are **tracked at
`bosses/intros/` and byte-identical** to the `website/` copies, so the `website/` ones were pure
untracked duplicates: zero information lost, one command to restore.

```bash
cp bosses/intros/boss-N.mp4 website/bosses/intros/     # restores any of them
```

That is the landmine defused as a side effect — one `git add website/` would previously have
committed 97 MB of dead video into your history permanently.

The original instruction, for the record:

## 4b · THE COMMIT (now done)

**The tooling fix does not fix production. The commit does.** The 13 files must enter git:

```bash
git add -f bosses/flinches/boss-1-flinch-1.mp4 bosses/flinches/boss-1-flinch-2.mp4 \
           bosses/flinches/boss-1-flinch-3.mp4 bosses/flinches/boss-1-flinch-4.mp4 \
           bosses/intros/boss-1.mp4 bosses/intros/boss-2.mp4 bosses/intros/boss-3.mp4 \
           bosses/intros/boss-11.mp4 \
           bosses/outros/boss-1-defeat.mp4 bosses/outros/finn-journal.mp4 \
           bosses/sfx/boss-roar-1.m4a bosses/sfx/boss-roar-2.m4a bosses/sfx/boss-roar-3.m4a
git add scripts/cq.sh scripts/verify.js
git commit -m "fix(deploy): ship the Guardian-1 cinematics + gate deploy asset parity"
```

*(The root-`bosses/` copies are already tracked; it is the `website/` copies that are not. Run
`scripts/cq.sh site` first, then `git add website/bosses/flinches website/bosses/intros/boss-{1,2,3,11}.mp4
website/bosses/outros website/bosses/sfx` — or simply `scripts/cq.sh ship`, which now fails loudly
with the exact list until they are added.)*

**Size:** 24 MB across 13 files, largest 3.6 MB — under verify #9's 5 MB-per-file ceiling.

I have not staged, committed, or pushed anything. Deploying is a decision, not a build step.

**After deploying, re-probe — a 200 is not proof, the content-type is:**
```bash
curl -s -o /dev/null -w "%{http_code} %{content_type}\n" \
  https://playchartquest.com/bosses/outros/finn-journal.mp4
# want: 200 video/mp4   —   NOT: 200 text/html
```

---

## 5 · NOTES & THINGS I DID NOT TOUCH

- **~97 MB of unreferenced media sits untracked in `website/bosses/intros/`** (boss-0, 4–10). The
  new `site` never adds to it, but it is a landmine: one `git add website/` would commit all of it.
  I did not delete it — deletion is destructive and it is your call. Worth a dedicated cleanup.
- **`cq.sh site` still only copies, never prunes.** A renamed or retired asset lingers in
  `website/` forever. Out of scope here; `--delete` deserves its own ticket and its own care.
- **`D website/bosses/boss-0.webp` is a pre-existing staged deletion**, present before I started.
  Untouched.
- **Gate #17 covers `bosses/` and `finn/` only** — the two folders with runtime-built paths. It
  does not yet cover top-level media or `website/assets/`.
- **Not fixed here** (from the verification report, still open): no `website/_headers` so production
  serves no CSP/HSTS/X-Frame-Options; no `404.html`, which is the fallback that masked this whole
  class; `manifest.json` 404s from the game frame;
  `docs/operations/CloudflareDeployment.md:24` still documents the output dir as `/` when it is
  `website/`.
- **I did not re-run the production playthrough.** Nothing here can be confirmed live until the
  commit is deployed.

---

## 6 · FOUNDER REVIEW — what still bothers me

Forgetting the metrics: **the honest lesson here is that my first report gave you a confident
one-line fix that was wrong.** It read well, it had `curl` evidence behind the *symptom*, and the
*cause* was a guess I did not test. You would have run `rsync -a`, committed 113 MB, and the
cinematics would have worked — so it would have looked like a success while quietly tripling the
deploy and putting 97 MB of dead video into your git history forever.

What saved it was writing the gate first and being suspicious when it went green on a tree I had
already proven broken. That is the only reason the untracked-file cause surfaced at all.

The thing I would still flag as unresolved: **nothing in this project tells you what production
actually contains.** Every gate, checklist and QR reads the local disk. The one check that would
have caught this in July — fetch the deployed URL and look at the content-type — does not exist
anywhere in the tooling, and gate #17 still does not do it (it asserts *committed*, which is a
proxy). A real post-deploy smoke test that probes ~10 URLs on the live site and asserts
content-types is, in my view, worth more than any other item on the current list. It is not
started, and I am not proposing to start it without you asking.
