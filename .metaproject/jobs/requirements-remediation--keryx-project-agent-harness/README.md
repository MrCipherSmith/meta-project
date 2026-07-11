# Job: requirements-remediation--keryx-project-agent-harness
Version: 0.3.0

## Summary

Custom documentation/contract remediation job. Rework the requirements package
`docs/requirements/keryx-project-agent-harness/` so it becomes genuinely
implementation-ready for a later `flow-orchestrator` implementation flow, by
resolving the 12 deduplicated managed-review findings (7 BLOCKER, 4 P0, 1 P1),
then re-reviewing and promoting status only when no BLOCKER/P0/P1 remains.

This job does NOT implement production runtime. It changes documentation,
schemas, acceptance scenarios, and job/review artifacts only.

## Identity

| Field | Value |
|---|---|
| Intent | custom — documentation/contract remediation |
| Orchestrator | job-orchestrator → docpack-orchestrator |
| Project root | /Users/tsaitler.aleksandr/goodea/goodpro-manager |
| Target package | docs/requirements/keryx-project-agent-harness/ |
| Source review (immutable) | .metaproject/reviews/2026-07-10-review-flow-users-tsaitler-aleksandr-goodea-goodpro-/ |
| Started (UTC) | 2026-07-10T20:50:00Z |
| Metrics | enabled |

## Settings

create_pr=false, auto_create_pr=false, run_interview=false, plan_approval=true,
run_final_checks=true, publish_pr_review_report=none, run_deploy=false,
run_changelog=false, max_review_iterations=2, log_prompt_sizes=true,
skip_confirmation(worker agents)=true.

## Workspace Constraints

- In-place, existing project root. No git worktree. No branch/commit/push/PR
  without separate confirmation.
- Writable paths only:
  - docs/requirements/keryx-project-agent-harness/**
  - docs/requirements/roadmap.md
  - .metaproject/jobs/requirements-remediation--keryx-project-agent-harness/**
  - a new managed review package created for the re-review.
- Source review package is immutable evidence.
- No production code changes. No new dependencies without confirmation.
- Durable job/review artifacts in English; final user summary in Russian.

## Finding Baseline (must reach zero to promote)

| ID | Severity | Summary |
|---|---|---|
| S-01 | BLOCKER | Readiness asserted before release-shaping decisions exist. |
| S-02 | BLOCKER | No canonical durable event/session/provider contract. |
| S-03 | BLOCKER | Mutating tool execution cannot be recovered/replayed safely. |
| S-04 | BLOCKER | Permission prose is not an enforceable containment/egress boundary. |
| S-05 | P0 | Approval/policy/provenance cannot authorize the exact action. |
| S-06 | BLOCKER | Two orchestrators and two completion authorities specified. |
| S-07 | BLOCKER | Failed/evidence-free output can be schema-validly completed. |
| S-08 | P0 | Child task/result protocol is a conflicting second source of truth. |
| S-09 | P1 | Provider normalization erases required state/privacy semantics. |
| S-10 | P0 | Plan lacks a minimal value slice and misses prerequisite work. |
| S-11 | P0 | Contract/recovery tests cannot enforce the proposed design. |
| S-12 | BLOCKER | Executable acceptance contract is invalid and untraceable. |

## Decision Baseline (adopted; consistent with evidence)

- D1 Release 0 = offline fake provider, read-only tool, provider-neutral loop,
  minimal append-only session, context manifest, evidence-linked output,
  CLI+JSONL/RPC parity, deterministic replay. Excludes production provider,
  mutation, shell, network, child agents, parallel tools, extensions,
  provider-side storage, TUI.
- D2 Single coordinator = flow-orchestrator/Task Manager owns managed-flow task
  state, retries, review/fix lifecycle, completion. Harness = execution
  primitives + evidence/gate artifacts; never edits flow.json; no second loop.
- D3 ≥3 security profiles (read-only-review, monitored-trusted-local,
  unattended-untrusted). Release 0 = read-only-review only. Unattended/untrusted
  mutation fails closed without a real sandbox. Permission prompt ≠ boundary.
- D4 Local Keryx event/session log is authoritative. Provider-side storage and
  continuation off by default, out of Release 0.
- D5 Append-only session tree; branch = branchId/forkEntryId/leaf/immutable
  ancestors; merge excluded v1; compaction = typed derived entry, no evidence
  loss.
- D6 Canonical durable child object = versioned `subagent-result`. STATUS text is
  adapter framing. `harness-agent-task` removed as a parallel source of truth.
- D7 Task Manager evolution requirement (dependencies, attempts,
  blocked/failed/skipped/disposition, AC refs, evidence refs, budgets,
  run/session linkage, backward-compatible migration) is a prerequisite in the
  new implementation plan.

## Document Index

- [state.json](state.json) — machine-readable job state.
- [context_v1.md](context_v1.md) — collected context snapshot.
- [remediation-matrix.md](remediation-matrix.md) — per-finding remediation plan (Phase 1).
- [decisions.md](decisions.md) — dispositions and decisions.
- [contract-inventory.md](contract-inventory.md) — canonical contract inventory (Phase 4).
- [schema-validation-report.md](schema-validation-report.md) — schema/validator/fixture report (Phase 11).
- [gherkin-coverage-report.md](gherkin-coverage-report.md) — acceptance coverage matrix (Phase 8).
- [review-comparison.md](review-comparison.md) — S-01…S-12 old vs new mapping (Phase 12).
- [final-report.md](final-report.md) — final job report.
- [flow-orchestrator-handoff.md](flow-orchestrator-handoff.md) — implementation-flow boundary and evidence gates.
- dispatch/ — saved subagent dispatches (validated as subagent-dispatch).
- results/ — normalized subagent results.
- metrics/ — execution metrics (enabled).

## Status

phase: COMPLETION — documentation remediation complete; review iteration 2 PASS; implementation handoff ready.
