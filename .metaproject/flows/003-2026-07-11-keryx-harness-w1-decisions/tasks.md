# Tasks — Flow 003 (W1 decisions)

Task definitions live here; task **statuses** live in flow.json and are managed
only via `keryx flow task done <id> <taskId>`.

Scope: **only W1** (implementation-plan.md §W1). No other wave, no `src/` code.

| ID | Kind | Model | Title / definition |
|----|------|-------|--------------------|
| T1 | context | Haiku | Collect W1 decision context from the frozen requirements package (done in context.md). |
| T2 | implement | — | Umbrella: author decision records per plan (closed when T5–T8 done). |
| T3 | test | — | Umbrella: W1 verification = consistency/contradiction check (no code tests). |
| T4 | review | — | Umbrella: self-review + completion prep (closed when T9 + completion done). |
| T5 | docs (D-01) | Haiku | Freeze Release 0 boundary ADR (offline/read-only) + measurable success criteria + signed decision table. Evidence: `ADR-0001-d01-release0-boundary.md`; no unresolved R0 boundary. Reviewer: architecture. |
| T6 | docs (D-02) | Opus | Freeze single coordinator (Task Manager) + ownership/import matrix + inward ports; contradiction check vs S-06/R1-03. Evidence: `ADR-0002-d02-single-coordinator-ownership.md`. Reviewer: architecture. |
| T7 | docs (D-03) | Opus | Freeze security profiles + required containment + profile/isolation matrix + explicit fail-closed decision (S-04/R1-01/M-02). Evidence: `ADR-0003-d03-security-profiles-containment.md`. Reviewer: security. |
| T8 | docs (D-04) | Opus | Freeze provider-state/branch/child-wire decision records linked to schemas (S-02/S-08/S-09) + research ledger. Evidence: `ADR-0004-d04-provider-branch-child.md` + `research-ledger.md`. Reviewer: contract. |
| T9 | review | Opus | Consistency/contradiction check across all four ADRs vs frozen package; architecture/security/contract reviewer lenses. |
