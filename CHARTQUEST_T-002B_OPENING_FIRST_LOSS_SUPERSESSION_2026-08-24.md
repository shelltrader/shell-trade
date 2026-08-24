# ADR-TES-1 — Opening First Loss and 2–1 Record

Status:        Approved by Founder direction; canonical re-ratification pending
Date:          2026-08-24
Owning doc:    `CHARTQUEST_TRADING_EXPERIENCE_SYSTEM_v1.1.md`
SoT level:     0

## Problem

The three automatic opening guided trades were all guaranteed wins. A skilled beta tester said this
made the opening feel less like trading because the player did not feel the possibility of losing
shells, and the Founder approved a 2–1 opening record. The existing later Level-2 First Loss would
then duplicate the lesson and contradict the intended opening sequence.

## Root cause

TES v1.1 placed the First Loss in early Level 2 and required all three onboarding trades to be clean
wins. That design protected confidence but delayed the emotional and educational value of a small,
explained, stop-protected loss. The runtime therefore had two different outcome owners: the three
opening results and a later Level-2 loss injector.

## Alternatives considered

1. Keep three opening wins and the later Level-2 First Loss. This preserves the old confidence curve
   but does not answer the Founder-approved tester finding.
2. Make the opening outcome random. Rejected because a tutorial loss must be authored, explained,
   bounded, and reproducible; luck cannot own progression.
3. Use an authored WIN → LOSS → WIN opening and retire the later injector. Chosen because it creates
   one emotionally real loss, teaches the stop immediately, and recovers confidence in the next
   guided trade without changing trade truth or player pacing.

## Decision

For the Build-373 local candidate's three automatic opening guided trades, the sequence is
**WIN → LOSS → WIN**.
Opening trade two is the sole planned, stop-protected **First Loss**. Opening trade three is the
immediate recovery win. The retired Level-2 loss injector must not fire again.

“2–1” describes the player's opening win/loss record. It does **not** describe reward:risk: every
automatic guided trade retains **2:1 R:R**. Player-paced traversal, visible body/wick first-touch
truth, the 30–60-candle automatic path envelope, manual-close truth, replay, rewards, and trade-time
world-event suppression remain unchanged.

The second result is authored rather than random. Finn's loss coaching identifies the protected
stop and the third result provides the recovery beat. Completed-result persistence must prevent a
restart from paying or replaying an already completed opening trade.

## Impact (documents / schemas / validators / assets)

For the local candidate, this decision departs narrowly from the following outcome-placement
statements. The old text remains formal architecture canon until re-ratification, must not be
deleted or silently rewritten, and also preserves the historical baseline.

| Source | Superseded scope | Still binding |
|---|---|---|
| `CHARTQUEST_TRADING_EXPERIENCE_SYSTEM_v1.1.md` §0, §3, §5, §6, A3 | Three opening wins and the First Loss being a later Level-2 event | Confidence recovery, authored/explained outcomes, stop protection, one-concept teaching, and all unrelated TES laws |
| `CHARTQUEST_TRADE_EXPERIENCE_CONSTITUTION.md` N3/N4, EC-8, progression guidance | The prohibition on this Founder-authorized outcome-placement change and the later-loss location | Trade truth, staging/agency rules, manual-close truth, and all unrelated experience laws |
| `CHARTQUEST_EDUCATIONAL_MARKET_DNA.md` Level-2 First-Loss references | Later placement of the first loss | The educational setup and market-DNA rules |
| Historical Build-257/282 and T-002 curriculum audits | Their recorded three-win/later-loss state | Their historical evidence; they are not current Build-373 behavior |
| `.chartquest/handoffs/BETA371_PREVIEW_QA.md` | Build-371-specific “second Level-2/eighth trade” placement | The exact Build-371 Preview evidence it records |
| `CHARTQUEST_T-002_PLAYER_PACED_TRADE_SUPERSESSION_2026-08-23.md` law 7 | Only its statement that outcome placement could not change | Laws 1–6 and every pacing, first-touch, replay, duration, suppression, manual-close, and pause/background rule |

No storage schema, provider schema, account model, reward amount, soundtrack, or production
configuration is changed by this ADR. Runtime validators are `scripts/build373_feedback.test.js`,
`scripts/beta_restart_safety.test.js`, `scripts/trade_pacing.test.js`, and `scripts/verify.js`.

## Migration plan (breaking?)

This is a breaking curriculum-placement change for the closed-beta opening only, implemented in
Build 373:

1. Author opening results as WIN → LOSS → WIN.
2. Give trade two the existing stop-protected First Loss identity and coaching.
3. Make trade three the recovery win.
4. Disable the former Level-2 loss injector so no player receives a duplicate scripted loss.
5. Use the versioned device-local flow ledger to resume only at completed safe boundaries.
6. Retain all old documents as historical evidence and gate production on exact Preview and
   physical-phone verification.

Existing player saves and established keys are not renamed or deleted. Malformed or newer ledger
versions fall back to legacy durable evidence.

## Tradeoffs

The opening now includes a deliberate confidence dip earlier than TES v1.1 prescribed. That risk is
bounded by a small protected loss, immediate explanation, and the authored recovery win. The gain is
earlier emotional credibility and a concrete reason for stops.

## Long-term benefits

There is one First Loss owner, one deterministic opening sequence, and executable protection against
duplicate loss injection. Future feedback can evaluate a clear 2–1 experiment rather than a mixed or
random curriculum.

## Future risks

- A physical-phone cohort may find the second-trade loss too early or too discouraging.
- A restart at an unsafe boundary could duplicate a result or reward if continuity invariants drift.
- Old doctrine may be mistakenly treated as current unless this supersession remains visible.
- This approved product amendment is not architecture canon until the formal index/manifest/header
  re-ratification workflow is completed; that reconciliation remains a release gate.

## Review date

Review after the exact Build-373 Preview/phone matrix and before any production authorization.
