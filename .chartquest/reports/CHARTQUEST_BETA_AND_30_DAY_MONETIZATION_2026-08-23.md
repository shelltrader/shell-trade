# ChartQuest Beta Findings and 30-Day Monetization Plan

**Report date:** 2026-08-23
**Decision posture:** Early-access preparation, not a finished-game launch
**Privacy:** Aggregate findings only; no player identifiers, emails, tokens, or verbatim survey responses

## Founder summary

The recovered beta evidence supports continuing, but it does not yet support a broad paid launch. The clearest positive signals are that all five valid survey respondents want to continue, the current-build survey average is 8.7/10, and everyone who defeated the boss on Build 367 completed the beta. The main product problem is earlier: too few players make it through the intro and from the first trade to the boss.

The recommended commercial path is a tightly scoped **Founding Access** release: a one-time $19 offer for the first 15 paid customers, followed by $29 while Early Access remains limited. Do not start a subscription yet. First collect five additional valid surveys, fix the clearest usability issues, observe the trading friction directly, and prove the purchase-and-access flow with at least two real pilot payments.

## 1. Data boundary and confidence

### Verified facts

- The three recovered archives contain **999 unique beta events and 6 raw surveys** after one overlapping event was deduplicated by its stable event identifier.
- Applying the documented QA, developer, smoke-test, harness, and historical-contamination exclusions leaves **702 eligible events and 5 genuine surveys** for product analysis.
- That audited set represents **130 browser identities and 189 sessions**. A browser identity is not the same as a unique human being; cleared storage, multiple browsers, repeated devices, and residual public traffic can create extra identities.
- **26 events after the snapshot cutoff are still pending** a final delta pull. The conclusions in this report are therefore bounded to the recovered snapshot.
- Database row IDs 391–439 are absent, but an intentional reset restarted numeric IDs. That range does not, by itself, prove that 49 committed rows were lost.

### Migration boundary

The Cloudflare beta archive should retain all **999 events and 6 raw surveys** for provenance and recovery. The private dashboard should apply the established exclusions so its decision-making view reports **702 eligible events and 5 genuine surveys**. Importing beta events and surveys does **not** migrate player accounts, authentication history, cloud saves, or other application tables; app/account history remains a separate migration and verification track.

The live Cloudflare import and its post-import counts must be recorded as deployment evidence. This report does not treat a local archive as proof that the production dashboard is populated.

## 2. What the beta actually shows

### Verified outcome counts

- **6 credible beta completions** across the audited history
- **5 genuine survey submissions**
- **5 of 6 completers submitted a survey: 83%**
- Build 367: **4 completions and 3 surveys**
- All valid survey ratings: **6, 7, 7, 9, 10**; mean **7.8/10**, median **7/10**
- Build 367 ratings: **7, 9, 10**; mean **8.7/10**
- Continue intent: **1 immediately, 4 later, 0 not interested**

These numbers are encouraging directional evidence, not statistical proof. “Later” is not the same as willingness to pay, and the current survey did not test a price.

### Truthful funnel

`Play clicked` is omitted because direct and installed-app visits can bypass it. Movement completion is also non-gating because the movement tutorial is skippable.

| Gating stage | All audited players | Kept from prior gate | Build 367 players | Kept from prior gate |
|---|---:|---:|---:|---:|
| Landing | 130 | — | 43 | — |
| Tutorial started | 65 | 50% | 43 | 100% |
| Intro chain completed | 15 | 23% | 8 | 19% |
| First trade | 15 | 100% | 8 | 100% |
| Boss started | 10 | 67% | 5 | 63% |
| Boss defeated | 9 | 90% | 4 | 80% |
| Journal unlocked | 8 | 89% | 4 | 100% |
| Journal completed | 6 | 75% | 4 | 100% |
| Beta completed | 6 | 100% | 4 | 100% |
| Survey submitted | 5 | 83% | 3 | 75% |

Landing denominators remain noisy. Twenty-one Build 367 identities share a repeated one-event mobile pattern, so the reliable headline is the absolute milestone count, not “130 players tested the game.”

### Build 367 movement breadcrumbs

| Milestone | Browser identities reaching it |
|---|---:|
| Movement step 1 | 18 |
| Movement step 2 | 15 |
| Movement step 3 | 10 |
| Movement step 4 | 9 |
| First trade | 8 |
| Boss started | 5 |
| Beta completed | 4 |

The largest actionable losses are **before the first trade** and **between the first trade and the boss**. The late game is not the main leak: once a Build 367 player defeated the boss, **4 of 4 completed**.

### Sessions, devices, and stability

- Median game session: **2.7 minutes** overall and **3.7 minutes** on Build 367
- Average game session: **6.9 minutes** overall and **7.2 minutes** on Build 367
- Median completion time: **20.5 minutes**
- Device mix: **69% mobile, 29% desktop, 2% tablet**; Build 367 was **95% mobile**
- All five valid surveys came from mobile: **2 iOS and 3 Android**
- Fourteen recorded errors across ten identities came from Cloudflare Insights and should not be scored as game crashes.
- Six first-party-classified iOS Safari autofill errors affected two Build 367 identities. Reproduce them on real iPhones before assigning root cause; one affected tester still reached the first trade, and no completer or survey respondent recorded a crash.

## 3. Survey themes

### Verified, paraphrased findings

1. **Movement and boost are the clearest hook.** Two respondents singled out the first boost or the flying-boost feeling as a favorite moment.
2. **The educational premise works.** A strong response came from a non-gamer who enjoyed learning how candles and market movement work.
3. **Players want more context around the chart.** Two respondents wanted more theory or knowledge, not simply a larger quantity of content.
4. **Information panels need explicit controls.** One respondent lost unread text after tapping a panel they expected to scroll. Use a visible Continue/Close action and preserve scroll state.
5. **Control reminders need to persist.** One respondent forgot how to open the diamond block and wanted the instruction to remain visible.
6. **The trading interaction needs observation.** One respondent described it as feeling odd, but that is too vague to justify a redesign. Watch players use it and locate the exact friction.

Two responses were sparse, so theme confidence is low. The Build 367 ratings are directionally better than the two older-build ratings, but the sample is too small to claim Build 367 caused the improvement.

## 4. Product work, in priority order

### Proposed priorities

1. **Clarify panels and controls.** Add visible Continue/Close actions, make scrolling safe, retain the diamond-block instruction, and add a short contextual bridge into the first chart.
2. **Observe three moderated mobile sessions.** Focus on movement step 2 through the first trade and boss. Record where the player hesitates, what they believe the trade action will do, and what they expect after submitting it.
3. **Preserve the boost mechanic.** It is the most consistent qualitative hook; do not remove or bury it while simplifying onboarding.
4. **Reproduce the iOS Safari autofill error.** Test on at least two physical iPhones. Fix it only if it is reproducibly caused by ChartQuest or blocks progress.
5. **Extend the survey for commercial learning.** Add experience level, intended use, recommendation intent, preferred payment model, and probable/definite purchase intent at an exact price.

## 5. Exact next-cohort plan: reach 10 valid surveys

The target requires **five additional valid surveys**.

1. Ship the clarity fixes and run the Cloudflare-only end-to-end checks before inviting anyone.
2. Create **8–10 individually attributable invite links** so the private dashboard can separate invited testers from residual public traffic without exposing their identities in reports.
3. Recruit mobile-first: include at least two iPhone Safari and two Android Chrome testers, plus a mix of trading and non-trading experience.
4. Ask every tester to play from a clean start, finish the beta, and submit the revised survey in the same sitting where practical.
5. Moderate three sessions live; let the remaining testers play unassisted.
6. At 72 hours, send one reminder to non-finishers. If fewer than five new valid surveys are complete, send a second wave only for the remaining number needed plus a two-person buffer.
7. Freeze feature scope as soon as ten valid surveys are reached. Analyze the second cohort separately, then compare it with Build 367 rather than blending away the change.

## 6. Early-access launch gates

These are **proposed thresholds**, not observed facts unless the current result is shown.

| Gate | Proposed threshold | Current observed result | Status |
|---|---:|---:|---|
| Valid survey evidence | At least 10 | 5 | Not met |
| First trade → beta completion | At least 60% | Build 367: 4/8, **50%** | Not met |
| Completion → survey submission | At least 80% | Overall: 5/6, **83%** | Met on a small sample |
| Mobile blocker | No reproducible first-party blocker on iOS or Android | iOS autofill issue unresolved | Needs reproduction |
| Exact-price intent | At least 3 probable/definite buyers | Not asked | Not measured |
| Paid delivery proof | At least 2 real pilot purchases with correct access and receipts | Not yet recorded | Not met |
| Data operations | Cloudflare dashboard receives new events/surveys and shows exact verified counts | Production verification required | Pending evidence |

Do not call Early Access a finished game. State exactly what buyers receive today, what is planned, the refund policy, the support contact, and that ChartQuest is educational entertainment—not financial advice or a promise of trading results.

## 7. Thirty-day monetization plan

### Offer decision

Use a **one-time Founding Access purchase**, not a subscription:

- First **15 paid customers: $19**
- Subsequent Early Access customers: **$29**
- Define the included content and access rights in plain language; do not imply “lifetime,” guaranteed future features, or a release date unless the business is prepared to honor those promises.
- Use a Stripe Payment Link or Checkout page with the terms, refund policy, support contact, UTM tracking, and a purchase limit for the founding cohort. Stripe documents that Payment Links can be reused or purchase-limited and customized without building a separate checkout.
- Grant access from an idempotent Stripe webhook after payment succeeds. Do not rely on the browser redirect as proof of payment.

Stripe’s current published US domestic-card rate is **2.9% + $0.30 per successful online card transaction**; hosted Payment Links are included with standard Payments pricing. Confirm the account’s actual country and pricing before launch. Sources: [Stripe pricing](https://stripe.com/pricing), [Stripe Payment Links](https://stripe.com/payments/payment-links), [customizing Payment Links](https://docs.stripe.com/payment-links/customize), [tracking with URL parameters](https://docs.stripe.com/payment-links/url-parameters), and [reliable Checkout fulfillment](https://docs.stripe.com/checkout/fulfillment).

### Calendar

| Days | Outcome |
|---|---|
| 1–3 | Populate and verify the private Cloudflare dashboard; record the snapshot boundary and exclusions; confirm that new production events and surveys arrive correctly. |
| 4–7 | Ship the panel/control clarity fixes, test the iOS Safari issue, revise the survey, and issue 8–10 unique cohort invites. |
| 8–12 | Reach ten valid surveys, complete three moderated sessions, compare the new cohort, and freeze launch scope. |
| 13–17 | Build the $19 and $29 offers, webhook-based entitlement, receipts, support path, terms, privacy notice, refund policy, analytics, and end-to-end payment tests. |
| 18–21 | Run at least two real paid pilot purchases, then open the $19 Founding Access offer to no more than 15 buyers. Provide hands-on support and measure activation. |
| 22–26 | If the launch gates remain green, move new customers to $29. Review refunds, activation, completion, survey handoff, and support burden daily. |
| 27–30 | Make a documented go/no-go decision: continue $29 Early Access, pause for fixes, or refund and regroup. Do not add a subscription merely to improve the revenue story. |

### Simple revenue scenarios

Figures below are **scenarios**, not forecasts. They assume US domestic cards at 2.9% + $0.30, one transaction per customer, and exclude tax, refunds, disputes, international-card fees, currency conversion, and operating costs.

| Paid customers | Price | Gross revenue | Estimated Stripe card fees | Estimated proceeds before other costs |
|---:|---:|---:|---:|---:|
| 10 | $19 | $190.00 | $8.51 | $181.49 |
| 25 | $29 | $725.00 | $28.53 | $696.48 |
| 50 | $29 | $1,450.00 | $57.05 | $1,392.95 |

If tax collection is required in a registered jurisdiction, Stripe currently lists Tax Basic at **0.5% per transaction** for no-code integrations. Stripe Billing currently adds **0.7% of Billing volume**, which is another reason not to introduce subscriptions before the product and retention case are proven. Stripe also states that processing fees from refunded payments generally are not returned. Sources: [Stripe Tax pricing](https://stripe.com/tax/pricing), [Stripe Billing pricing](https://stripe.com/billing/pricing), and [Stripe guidance on refund fees](https://support.stripe.com/questions/understanding-fees-for-refunded-payments).

### Minimum commercial safeguards

- Make all product, progress, scarcity, and timing claims truthful and supportable. See the [FTC’s advertising and marketing basics](https://www.ftc.gov/business-guidance/advertising-marketing/advertising-marketing-basics).
- Collect only the customer and player data needed, restrict dashboard access, and maintain a deletion/retention process. See the [FTC’s Start with Security guidance](https://www.ftc.gov/business-guidance/resources/start-security-guide-business).
- If ChartQuest is directed to children under 13, or there is actual knowledge that under-13 users are providing personal information, do not proceed on the adult-oriented privacy setup; review COPPA obligations first. See the [FTC’s COPPA business guidance](https://www.ftc.gov/business-guidance/resources/childrens-online-privacy-protection-rule-not-just-kids-sites).
- Confirm sales-tax, consumer-law, privacy, terms, and refund requirements with qualified professionals for every jurisdiction sold into. This report is a product plan, not legal, tax, investment, or financial advice.

## 8. Thirty-day success definition

The month is successful if ChartQuest ends it with reliable Cloudflare analytics, ten valid surveys, a demonstrably clearer first-trade path, mobile stability, three exact-price purchase-intent signals, two verified paid pilots, and an honest $29 Early Access offer. Revenue is useful evidence, but the decisive signal is whether paid players activate, reach the first trade, complete, and still want more.
