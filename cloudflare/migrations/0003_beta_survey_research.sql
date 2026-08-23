-- Build 370 beta research fields.
--
-- Both columns are nullable so the six recovered surveys and any Build 369 client
-- that re-submits the original five-question form remain valid. The public ingest
-- contract validates the closed vocabularies whenever either field is present.

ALTER TABLE beta_surveys ADD COLUMN experience_level TEXT
  CHECK (
    experience_level IS NULL OR experience_level IN (
      'new_to_both',
      'gamer_not_trader',
      'trader_not_gamer',
      'familiar_with_both'
    )
  );

ALTER TABLE beta_surveys ADD COLUMN purchase_intent_19 TEXT
  CHECK (
    purchase_intent_19 IS NULL OR purchase_intent_19 IN (
      'definitely',
      'probably',
      'unsure',
      'probably_not',
      'definitely_not'
    )
  );
