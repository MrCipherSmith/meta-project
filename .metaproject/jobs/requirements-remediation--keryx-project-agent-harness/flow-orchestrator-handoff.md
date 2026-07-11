# Flow-Orchestrator Handoff
Version: 1.0.0

## Readiness

This handoff is the boundary between documentation remediation and the later
implementation flow. It is valid only when review iteration 2 reports zero
BLOCKER/P0/P1 findings. The remediation job itself makes no production code
claim and does not create a branch, commit, or pull request.

## Frozen objective

Implement the Keryx project agent harness as an opt-in, provider-neutral runtime
whose Release 0 is an offline fake-provider/read-only vertical slice. Preserve
the deterministic Keryx floor when disabled. Keep `.metaproject/` authoritative
for project context and keep Task Manager/`flow-orchestrator` as the sole owner
of managed-flow task state, retries, review/fix lifecycle, and completion.

## Execution contract

- Begin with the prerequisite Task Manager evolution (`TM-01`–`TM-03`) and
  the existing corpus move from `src/harness` to `src/eval`.
- Implement only the dependency DAG in `implementation-plan.md`; do not revive
  the superseded T1–T30 plan.
- Use `execution/turn-control` for a local harness turn loop. It is not a
  second managed-flow orchestrator and may not write `flow.json`.
- Validate every durable record against its schema and the machine-readable
  `schemas/schema-version-registry.json`; reject incompatible versions with the
  typed behavior declared there.
- Treat `harness-agent-task` as migration-reader-only. New child transport and
  persistence use canonical `subagent-dispatch`/`subagent-result` contracts.

## Wave order

| Wave | Scope | Release |
|---|---|---|
| W1 | Decisions, platform and capability-off boundary | prerequisite |
| W2 | Task Manager prerequisite and backward-compatible migration | prerequisite |
| W3 | Corpus ownership move to `src/eval` | prerequisite |
| W4 | Contract registry, validator, fixtures, semantic checks | R0 foundation |
| W5–W7 | Provider/tool ports, fakes, offline read-only loop | Release 0 |
| W8–W10 | Resume, branch/compaction, guarded mutation/approval | Release 1 |
| W11–W13 | Flow bridge, canonical child adapter, bounded parallelism | Release 1/2 |
| W14–W15 | Real provider, hardening and extensions | Release 1/2 |
| W16 | Evidence, gates, docs and final review | all |

The stable task IDs, dependencies, contract IDs, scenario IDs, evidence gates,
reviewer and release assignments are normative in `implementation-plan.md`.

## Required evidence before promotion

1. Disabled-mode import/network audit and byte-identical deterministic-floor
   regression.
2. Draft 2020-12 schema validation for all active contracts, positive and
   negative fixture rejection, and semantic/recovery fixture results.
3. Parser/tag/requirement/contract/task/release/evidence gates for
   `acceptance.feature` with the feature hash recorded.
4. Offline fake-provider transcript, read-only tool, append-only session,
   bounded context, evidence-linked output, and CLI/JSONL/RPC parity.
5. Completion gate rejects missing evidence, failed blocking checks, active
   approvals/retries/children, and undisposed blockers.
6. Security profiles fail closed; Release 0 opens no provider/network socket
   and executes no mutating tool.
7. Review-orchestrator plus strict review report zero BLOCKER/P0/P1.

## Context bundle

Read in order: this handoff, `context_v1.md`, `decisions.md`,
`contract-inventory.md`, `schema-validation-report.md`,
`gherkin-coverage-report.md`, the target package README, and the immutable
source-review manifest. Refresh context only when a new library, contract, or
repository rule is discovered.

## Explicit non-goals

No provider SDK lock-in, unrestricted shell, network egress, TUI, third-party
extension execution, provider-side session authority, branch merge, or
production runtime implementation is included in Release 0.
