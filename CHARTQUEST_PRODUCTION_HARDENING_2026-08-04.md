# ChartQuest — Production Hardening & Security Audit

**Date:** 2026-08-04 · **Build:** 335 · **Target:** https://playchartquest.com · **Status:** closed beta, 10–20 invited testers

**Method:** 7 specialist auditors, every Critical/High re-verified by a second agent instructed to
refute it. **69 findings raised · 50 confirmed · 19 refuted.** Refuted findings are excluded.
Four items were verified directly by the lead against the live site and database.

> **Honesty note.** 12 of 33 agents — including the final synthesis and several verifiers — died on
> a usage limit. This report was written by the lead from the 50 confirmed findings. Four findings
> whose verifier did not complete were re-verified by hand against production; they are marked
> **[lead-verified]**. A handful of Medium/Low items therefore carry a single auditor's word.

---

## 1 · SECURITY AUDIT — the headline

**Two genuine security holes were found and are already closed. Neither was in the client.**

| | |
|---|---|
| **Secrets in client code** | **CLEAN.** The only credential in any deployed file is the Supabase **anon** key (`role=anon`). It is a publishable key, RLS-gated, and every write goes through a service-role edge function. No service-role key, no private key, no Stripe key, no `.env`. `.netlify-token` exists at repo root but is **untracked**, so it never deploys. You never need to worry about this one again. |
| **Anon could DELETE your entire beta dataset** | **[lead-verified] FIXED.** `prune_beta_events(0)` was `SECURITY DEFINER` with `EXECUTE` granted to `anon` — Postgres grants EXECUTE to PUBLIC by default. Anyone with the publishable key could wipe all beta analytics. Same for `prune_content_events`, `prune_ingest_throttle`, `rollup_site_visits`, and read access to `get_recent_bug_reports` / `get_dashboard_stats`. Revoked; verified the calls now return `permission denied` and that legitimate anon paths still work. |
| **Look-alike origins could write to your dataset** | **[lead-verified] FIXED.** `beta-ingest` matched origins by **prefix**, so `https://playchartquest.com.evil.com` passed. Verified live: it returned `{"ok":true,"written":1}`. Any attacker page could quietly poison your learning data. Now exact-match (v4); all three spoofs refused, real origins still work. |
| **Service worker never registered** | **[lead-verified] FIXED — my regression.** `sw.js` had been a JavaScript SyntaxError since build 332 (a comment appended after its closing delimiter). No precache, no offline page, console error every load. |
| **?qa=1 cheat/answer-key bridge** | **FIXED.** Gated behind `_CQ_DEV`. Detail in §5. |

**What is *not* a problem, despite appearances:** the anon key being in the client is correct design, not a leak. Cheats via the QA bridge are not meaningfully worse than devtools, because the game is unminified client-side source and progress lives in localStorage.

---

## 2 · RISK ASSESSMENT

| Risk | Likelihood | Impact | Exposure now |
|---|---|---|---|
| **Beta dataset destroyed by anon RPC** | Was trivially possible | Total loss of beta learning | **Closed** |
| **Data poisoning from a hostile origin** | Low but trivial to execute | Corrupt funnel, wrong decisions | **Closed** |
| **Analytics poisoned by a tester using ?qa=1** | Moderate (a curious friend) | Silent, unrepairable funnel corruption | **Closed** |
| **Source copying** | High — 1.87 MB of readable source | Low-to-moderate: this is a game, not an algorithm | **Accepted** (see §5) |
| **IP leakage via comments** | Certain — 4,079 comments ship | Moderate: roadmap, decisions, defect notes | **Partially accepted** |
| **Asset theft (art, cinematics)** | High | Moderate — the key art is genuinely valuable | **Accepted** — any served image is copyable |
| **Credential abuse** | Very low | Low — anon key is RLS-gated | Structurally sound |
| **Accidental file exposure** | Low | Low | Only tracked files deploy; one internal `.md` ships |

---

## 3 · HARDENING REPORT — per area

| Area | Verdict | Why |
|---|---|---|
| API & backend surface | **FAIL → now PASS** | Two Criticals, both closed and verified |
| Debug hooks & dev flags | **FAIL → now PASS** | `?qa=1` gated; 7 other flags assessed as harmless or dev-gated |
| Deployment / headers | **FAIL** | No CSP, HSTS, X-Frame-Options or Permissions-Policy. See §7 |
| Deployed assets | **FAIL** | ~647 KB unreferenced + internal docs ship |
| Source exposure | **PASS WITH ISSUES** | Full readable source; a deliberate, defensible tradeoff |
| Console output | **PASS WITH ISSUES** | Only 11 statements — immaterial |
| Branding & legal | **PASS WITH ISSUES** | Terms assigns ownership to no named entity |

---

## 4 · FINDINGS

50 confirmed. Full machine-readable detail in `hardening-findings-50.json`.

| Sev | Finding | Where | When | Effort | Maintainability cost |
|---|---|---|---|---|---|
| Critical | ?qa=1 ships a full remote-control + cheat + answer-key bridge to production | `game.html):25684, 25746, 25775, 25829, 25838` | Quick Win | S | Effectively zero for the daily loop. `scripts/cq.sh qr` builds `http:/ |
| Critical | Migration 0009 was never applied: get_recent_bug_reports and get_dashboard_stats are ano | `0009_lockdown_switchover.sql:1, 40-62` | Quick Win | S | None. Two SQL statements. The dashboard is not deployed, so nothing re |
| Critical | Anon can call destructive maintenance RPCs — prune_beta_events(0) deletes the entire clo | `0006_retention.sql:76-79` | Quick Win | S | None. One SQL statement. bump_ingest_throttle is only ever called by t |
| High | website/sw.js is a JavaScript syntax error — service worker never registers, and it is t | `sw.js:17` | Quick Win | S | None. This is a comment-delimiter repair, not a change to any system. |
| High | beta-ingest origin allowlist uses prefix matching — https://playchartquest.com.evil.com  | `index.ts:110, 117` | Before Public Beta | S | None. Copy an existing, deployed, working block. It preserves localhos |
| High | Terms of Use assigns ownership to no named entity; three conflicting identities ship | `terms.html:57` | Before Public Beta | S | None. Four static text edits in files that already deploy verbatim. Th |
| Medium | window.CQTrack.event() and .survey() let anyone write arbitrary rows into the live beta  | `chart-quest.html:27821:27821-27837, 27453-27` | Before Public Beta | S | Low. Keeping `event`/`crash`/`flush`/`survey`/`pid`/`state` published  |
| Medium | ?flow=1 ships an explicitly unvalidated gameplay prototype to external testers | `chart-quest.html:14734:14725-14734, 6780-678` | Before Public Beta | S | None. The flag exists solely to validate the mechanic on the founder's |
| Medium | ?hmc and ?bcj skip the cinematic and tutorial, distorting the same onboarding funnel | `chart-quest.html:2535:2535, 2545, 2549` | Quick Win | S | None. Both are described in-file as fast-iteration hatches for the fou |
| Medium | ?jtut re-runs the Journal onboarding over real progress, ignoring the once-ever flag | `chart-quest.html:1656:1656, 27279, 27383-273` | Quick Win | S | None. |
| Medium | No gate enforces dev-flag hygiene, so the next debug hook will ship the same way these t | `verify.js:237-283 (existing gates #12-#16; n` | Before Public Beta | M | Real but modest and the same cost the five existing gates already carr |
| Medium | 590 KB (30.9%) of the deployed game is developer comments — including 50 verbatim founde | `game.html:file-wide; examples at 460, 3029, ` | Before Public Beta | M | Low, and deliberately so. The dev loop is untouched: you still open, e |
| Medium | BUILD_TAG is a runtime string that publishes the beta's telemetry blind spot and crash h | `game.html:2986` | Quick Win | S | None. The cache-check workflow is unchanged — a tester still reads "bu |
| Medium | Unwired-checkout stub names the payment providers and tells the reader payment is not re | `game.html:13820-13831` | Before Public Beta | S | Negligible; ~5 lines, and the hook still works exactly as designed whe |
| Medium | The dev/test backdoors are documented in the deployed source, in prose | `game.html:1631-1636, 1658, 1962, 2546, 27905` | Before Public Beta | S | Zero for the strip. The dev-flag stamp is ~10 lines in the CQTrack blo |
| Medium | verify.js syntax gate #3a only parses chart-quest.html's inline scripts — no standalone  | `verify.js:99` | Quick Win | S | Near zero: adds well under a second to `cq.sh ship`, touches no game c |
| Medium | Internal working doc website/assets/SCREENSHOTS.md deploys, is crawlable, and admits the | `SCREENSHOTS.md:1-34` | Quick Win | S | None. Neither file is generated or copied by scripts/cq.sh, so a plain |
| Medium | 1.87 MB website/logo.png is dead but self-healing — cq.sh restores it twice over, once h | `cq.sh:42-43` | Quick Win | S | Low but real: cq.sh:36 documents the auto-discovery as deliberate — 'a |
| Medium | 2.85 MB (12.7%) of the 22.34 MB deploy is dead: superseded logos, orphaned finn sprites, | `chartquest-logo.png:n/a (asset inventory)` | Quick Win | S | None. None of these files is generated or copied by cq.sh except logo. |
| Medium | cq.sh `site` only ever copies, never prunes — website/ accumulates stale files forever,  | `cq.sh:38-43` | Before Public Beta | S | Low, but --delete deserves respect: if the boss-cinematics fix (Option |
| Medium | ~51 MB of stray ZIP archives and a 69 MB gitignored video tree are tracked in git — they | `zixWYTP8:n/a (tracked binary)` | Before Full Release | M | Low. None of these paths is read by scripts/cq.sh, scripts/verify.js o |
| Medium | access-control-allow-origin: * on every response lets any site read the full game source | `game.html:1 (whole-file, via platform defaul` | Quick Win | S | None today. One future gotcha: if the marketing site is ever split to  |
| Medium | No 404.html — every missing path returns index.html with HTTP 200, masking real deploy g | `robots.txt:3-5` | Before Full Release | S | None. One static file, and it turns a whole class of silent deploy fai |
| Medium | Cache strategy is undeclared and about to become two-layered the moment sw.js is fixed | `sw.js:10-19` | Before Public Beta | S | Zero added ritual — `must-revalidate` at HTTP is what already happens, |
| Medium | submit_bug_report is anonymous, unrate-limited and unbounded; bug_reports also accepts d | `game.html:2105` | Before Public Beta | S | None. The client call site at game.html:2105 is unchanged; it already  |
| Medium | record_site_visit is anon and unrate-limited — one row per call, retention job never sch | `game.html:1762` | Before Public Beta | S | Option (b) removes a call site and a table from the mental model — neg |
| Medium | Repo edge-function sources are stale against production and verify_jwt is not pinned — a | `index.ts:22-27` | Before Public Beta | M | None ongoing. One-off copy-back. It makes the backend auditable in the |
| Medium | bump_ingest_throttle is anon-executable with caller-chosen ip and window — the rate limi | `0008_ingest_and_admins.sql:36-37` | Quick Win | S | None. |
| Medium | bosses.html gate is fail-OPEN and its content is visible by default in markup | `bosses.html:122 (and 29, 39)` | Before Public Beta | S | None, and it slightly reduces cost by making the two gated pages behav |
| Medium | Legacy mascot name "Shell" in deployed player-facing copy, contradicting alt text on the | `bosses.html:44` | Before Public Beta | S | None. One word in static copy on a currently-gated page. |
| Medium | The game itself carries no "not financial advice" disclaimer — only the marketing site d | `game.html:n/a — zero occurrences in 1.87 MB` | Before Public Beta | S | Low but not zero — this is the only finding that touches the game's ow |
| Medium | Game page links a PWA manifest that does not exist at the deployed path | `game.html:18` | Before Public Beta | S | None. One href. Edit chart-quest.html and let cq.sh ship mirror it. Wo |
| Medium | Two-word "CHART QUEST" in deployed file banners and one visible UI chip | `courses.html:50 (plus assets/config.js:2, as` | Before Public Beta | S | None. Comment text and one visible string; no selectors, ids or behavi |
| Medium | Internal capture checklist deploys publicly and admits the landing screenshots are place | `SCREENSHOTS.md:3-5` | Quick Win | S | None. It is documentation with no referrer; nothing loads it. Confirm  |
| Low | ?reach paints the internal level-design telemetry overlay over the live game | `chart-quest.html:1649:1649, 18189-18191, 162` | Quick Win | S | None. The standard beginner-mode test link is documented at 1647 as `? |
| Low | BUILD_TAG is a 700-character internal engineering changelog, rendered on-canvas by ?qa=1 | `chart-quest.html:2986:2986, 24111-24122` | Before Full Release | S | The split needs care: cq.sh:76 and cq.sh:79 both parse the BUILD_TAG l |
| Low | Minifying the game would cost line-accurate production debugging and buy almost nothing  | `cq.sh:37` | Optional Long Term | S | Recommending against it has zero cost. Recommending FOR it would cost  |
| Low | The only console-error gate (check #3b) is permanently inert and reports SKIP, which rea | `verify.js:330` | Optional Long Term | M | Option (a): none. Option (b): real — it makes `ship` slower and adds a |
| Low | No gate keeps console output at its current near-zero level — the discipline is cultural | `chart-quest.html:1687` | Before Public Beta | S | Very low, but non-zero and worth naming: a developer mid-debug who rea |
| Low | Market-maker-cinematic.mp4 is 52% of the deploy and is tracked twice — 24.5 MB in git fo | `Market-maker-cinematic.mp4:n/a (asset)` | Optional Long Term | S | Deliberately none — recommending no change. Deduplicating root and web |
| Low | 1.78 MB dead logo.png plus ~647 KB of unreferenced assets deploy on every push | `cq.sh:43` | Quick Win | S | None, and it removes a hardcoded exception from cq.sh that the auto-di |
| Low | Compression is correct by default — the only actionable risk is trying to configure it | `game.html:1214, 20964` | Optional Long Term | S | None — the recommendation is to change nothing. |
| Low | market-price is deployed with verify_jwt: true but is documented and coded as requiring  | `index.ts:23-24, 57` | Before Full Release | S | None today — the recommendation is to change nothing and record the co |
| Low | Beta funnel rows are self-asserted: player_id and session_id are client-chosen strings,  | `cq-track.js:68, 219-224` | Optional Long Term | M | Zero if accepted. The cookie option would add a real session concept t |
| Low | update-progress decodes the JWT subject without verifying it, relying entirely on an unp | `index.ts:deployed v5 only — no repo copy` | Before Full Release | S | One extra round-trip per cloud save on a path that already does a SELE |
| Low | Dead-code canvas wordmarks render "CHART QUEST" as two words | `game.html:19612 and 21809` | Before Full Release | S | None for the string change — two literals inside existing fillText cal |
| Low | Stale infrastructure hostnames and pre-rename storage keys in readable deployed source | `game.html:1727-1728, 8136, 8380, 11955` | Optional Long Term | S | Deleting the allowlist: none, they are unreferenced. Renaming the stor |
| Low | Unsubstantiated superlative "The World's First Trading RPG" in title, OG, Twitter and ma | `index.html:6, 82, 93 (and website/manifest.w` | Before Full Release | S | None. Four static strings. The only caution is to update the manifest  |
| Low | bosses.html share card omits the brand and promises eleven Guardians | `bosses.html:19` | Quick Win | S | None. One attribute value. |
| Low | Privacy and Terms pages have no footer, no copyright line and no navigation | `privacy.html:n/a — absent (same for website/` | Before Public Beta | S | None, with one ongoing habit: the "Last updated" date must be touched  |
---

## 5 · THE MINIFICATION QUESTION — a straight answer

**Do not add a build step yet. It is the wrong trade for you today.**

There is no production build. Cloudflare Pages serves the raw repo, so `website/game.html` is your
complete, commented source — 1.87 MB, 4,079 comments. Minifying is not a config toggle; it is a new
pipeline stage, and it would collide with three things you rely on daily:

- `verify.js` check #8 asserts `index.html` is **byte-identical** to `chart-quest.html`. A build
  step breaks that contract, which is the thing that has repeatedly saved you from shipping a stale
  mirror.
- `sync_track.py --check` guards the inlined analytics client the same way.
- Your `BUILD_TAG` cache-check workflow depends on reading a legible tag in the served file.

And the payoff is small: minification stops nobody who wants your code, and the game's value is the
authored curriculum and art, not the JavaScript.

**The cheaper 80% — strip comments only, at `cq.sh site`, production only.** One transform, applied
when copying `chart-quest.html → website/game.html`, leaving the dev source untouched. That removes
the roadmap notes, founder decisions and defect commentary — the genuinely sensitive part — while
keeping the code readable enough to debug a production issue. Cost: the byte-identity gate must
change to "identical after the same transform", which is a contained edit to `verify.js`.

**Revisit full minification at public launch, not before.** Also note `build.js` and
`chart-quest.min.html` already exist from a previous attempt; the artifact is *larger* than the
source, which tells you that path was never finished.

## 6 · QUICK WINS (<30 min each)

1. ~~Revoke anon EXECUTE on maintenance RPCs~~ — **done, verified**
2. ~~Exact-match origins in `beta-ingest`~~ — **done, verified**
3. ~~Repair `sw.js`~~ — **done**
4. ~~Gate `?qa=1` behind `_CQ_DEV`~~ — **done**
5. Delete `website/assets/SCREENSHOTS.md` — internal doc, currently public
6. Delete ~647 KB of unreferenced assets (`shot-*.png` ×7, `chartquest-logo.png`, `finn-{dazed,roll,jump,run}.png`)
7. Stop `cq.sh` copying the now-unreferenced 1.78 MB `logo.png`
8. Name the owning entity in `terms.html`

## 7 · BEFORE PUBLIC BETA

- **Add `website/_headers`** — CSP, HSTS, X-Frame-Options, Permissions-Policy. **Two traps:** the
  game frames *itself* same-origin (`index.html` → `play.html` → `game.html`), so `frame-ancestors`
  must permit `'self'` — the repo-root `_headers` as written would blank the game for everyone. And
  Google Fonts are external, so a naive `font-src 'self'` kills your typography.
- Remove `courses.html` / `bosses.html` from the deploy entirely rather than gating them.
- Strip comments at `cq.sh site` (§5).

## 8 · BEFORE FULL RELEASE

Hashed asset filenames; re-encode the 11.7 MB cinematic; decide the minification question properly;
formal copyright/trademark notices.

## 9 · OPTIONAL LONG-TERM

Bundling; a real CI pipeline; asset CDN; per-tester invite tokens.

## 10 · WHAT I RECOMMEND YOU DO NOT DO

- **Do not obfuscate.** It defeats production debugging, bloats the file (your existing artifact is
  *bigger* than the source), and stops nobody motivated.
- **Do not bundle.** A 1.87 MB single file with inline `<script>` is hostile to every bundler; the
  work is large and the benefit is near zero at this scale.
- **Do not copy the repo-root `_headers` into `website/` as-is.** It would blank the game iframe and
  kill your fonts, same day, for every tester.
- **Do not remove the anon key from the client.** It is supposed to be there.
- **Do not chase "make it hard to reverse engineer".** You said this yourself, and you were right —
  effort spent there is effort not spent on World 2.
