# Build 366 Cosmetic Closeout Investigation

## Founder report

The physical Build 365 retest was the strongest ChartQuest playthrough so far. Three presentation issues remained before the 10–15-person beta:

1. The Journal and Gambler-defeat card still showed the retired purple Gambler portrait.
2. The Journal Mastery completion screen presented the existing book as an oversized floating crop.
3. Finn's signature compass necklace disappeared in the Gambler-defeat cinematic.

## Root causes

- The Journal constructed `bosses/boss-1.webp` directly, while the victory surface used the shared portrait accessor; the current cinematic Gambler had no versioned level-1 portrait owner.
- The mastery finale already used the correct `journal-book.webp`, but its full-screen feathered treatment had no compact card, safe-area, or phone-height owner.
- The missing necklace was baked into the inherited defeat MP4. There is no live Finn layer over that full-screen video, so a runtime overlay would drift across aspect ratios and Finn's turn.

## Decision

Advance one bounded Build 366 cosmetic strike: create one current Gambler portrait used by both surfaces; retain the existing Journal book but redesign its presentation; repair the necklace in a cache-versioned copy of the existing defeat clip. Preserve reward/timing, boss flow, curriculum, trading, saves, movement, release controls, credentials, providers, and production.
