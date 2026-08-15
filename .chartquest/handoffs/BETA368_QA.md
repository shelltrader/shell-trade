# Build 368 Exact-Byte QA

## Verdict

**PASS FOR LOCAL ENGINEERING CANDIDATE — DO NOT DEPLOY — CLOUDFLARE SETUP AND LIVE SMOKE PENDING — BUILD 367 REMAINS LIVE.**

This QA is bound to Build 368 payload commit
`b8f671adf4982bb2997a4bf2f5d02207b19cfe68` on branch `codex/cloudflare-only-beta`, parent
`8c858aabd27aa0c4032fef9599d958735d959283`, and the exact fingerprints below. Any byte change to an
evidence-bound file requires proportional reruns.

## Exact candidate fingerprints

- `chart-quest.html`, `index.html`, `website/game.html`:
  `4e11d01d9b5b5bc662ce153e880ce1466de529f77cef40152bbd525fb4e2b5ca`
- Browser bridge:
  `cf9c0cadc8b3cd7c45d4a411c475ba789893d5a8e0712e177fc39b352addd7c0`
- Browser harness:
  `bffb1cd227314642d23f8b913de100855a29b7188e9f75b2c77c84e629c76dd1`
- Cloudflare service contracts:
  `0cc78f7e32b063eac7a2cec4659905670ae47b7396e1ad8417fe86d7199723fc`
- Client/queue/service-worker contracts:
  `45c1c9f52edc016fe98bc659223f62f757c3cd5d6af7842c3a343968f196575a`
- Founder dashboard contracts:
  `efd054ce1fd69bd5d90eff73d044e3b0c8d4ad843002e3fed9bbf1bec4c617b2`

## Automated results

| Check | Result |
|---|---|
| Cloudflare ingest/D1/Access/export contracts | **PASS — 23/23** |
| Tracker/receipt/queue/service-worker contracts | **PASS — 7/7** |
| Founder dashboard contracts | **PASS — 5/5** |
| Focused CQSAFE/gameplay suite | **PASS — 27/27** |
| Release-control suite | **PASS — 15/15** |
| Artifact-parity fixture suite | **PASS — 5/5** |
| Boss 1 audio-media regression | **PASS — 5/5** |
| Full verifier | **PASS — 26 pass, 0 fail, 0 warn, 1 allowed Puppeteer skip** |
| D1 schema apply/integrity | **PASS** |
| Three game artifacts and canonical tracker sync | **PASS** |
| Syntax, QA-server self-test, diff integrity | **PASS** |

## Game Browser regression

- Exact Build 368 Run All: **37/37 PASS**, 0 fail, 0 pending.
- Immediate same-iframe repeat: **74/74 cumulative PASS** with no leaked tutorial, portal, replay,
  audio, or fixture state.
- No captured runtime/console error.

## Founder dashboard Browser QA

- Desktop 1440×900: all eight views, filters, search, full-history player timeline, every survey
  response, raw data, and exports passed with no page-level overflow.
- Mobile 390×844: all eight views passed; the document remained exactly 390px wide, tables/tabs
  scrolled only inside their panels, and the player dialog/export menu stayed usable.
- 403 Access denial and 503 feed outage rendered explicit errors with no false KPI cards.
- A failed refresh preserved the last verified data, marked it stale, and restored the last committed
  time filter.
- Browser console: **0 errors, 0 warnings**.

## Unverified external boundary

No production D1 database, binding, secret, Access policy, route, deployment, or live row was created
or changed during QA. Therefore this is not a release verdict. Live acceptance must prove exact JSON
write receipts, persistence, survey confirmation, denied and allowed Founder access, complete
exports, v14 upgrade privacy, empty-at-cutover state, and rollback before Build 368 is deployed.

Build 367 and existing beta collection remain unaffected until that release operation.
