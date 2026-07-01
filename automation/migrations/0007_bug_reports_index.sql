-- Chart Quest — add covering index for bug_reports.user_id foreign key
-- Apply to project ymxppzhczvmiuoncuqqu. Additive, non-destructive, idempotent.
--
-- The performance linter (0001_unindexed_foreign_keys) flagged
-- bug_reports.user_id as the one FK without a covering index. Cheap to add now;
-- keeps FK checks and any "my bug reports" lookups fast as the table grows.
create index if not exists idx_bug_reports_user_id
  on public.bug_reports (user_id);
