# ChartQuest Codex Autonomy Policy

## Purpose

This is the durable, project-scoped permission posture for the persistent ChartQuest Command Center. It reduces routine approval interruptions without expanding production authority.

## Applied project configuration

The trusted-project file `.codex/config.toml` contains:

| Setting | Effect |
|---|---|
| `sandbox_mode = "workspace-write"` | Codex may read, edit, and run local commands within this repository without leaving the workspace boundary. |
| `approval_policy = "on-request"` | Routine in-workspace work proceeds autonomously; boundary-crossing or sensitive actions remain approval candidates. |
| `approvals_reviewer = "auto_review"` | Eligible approval requests are assessed automatically before they are surfaced to the Founder. |
| `sandbox_workspace_write.network_access = false` | Shell commands cannot contact deployment providers, Git hosts, or other external services by default. |

The global Codex configuration records the current repository path as `trusted`. Project configuration is therefore eligible to load in future local Codex sessions, subject to any stricter managed workspace policy. Trust is path-specific local application state: a fresh clone or moved checkout may require the normal one-time Codex trust confirmation, and the Git-hook bootstrap below does not grant it.

## Deliberate exclusions

This policy does **not** grant or enable:

- production deployment, provider-dashboard, or credential access;
- command network access;
- writing outside this repository or to Git metadata without a separate boundary approval;
- destructive Git operations; or
- automatic approval of critical-risk actions.

## Operating rule

The PM/CTO Command Center should use this project policy for routine investigation, implementation, tests, and `.chartquest/` handoffs. A release still requires the repository-local release gate plus the external GitHub and provider controls recorded in `handoffs/STEP6B_AUDIT.md`.

For a fresh or moved checkout, `scripts/setup_command_center.sh` performs the separate, network-free Git-hook bootstrap in project-local Git metadata. It does not expand Codex permissions or authorize production access.
