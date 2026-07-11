# Context Snapshot v1
Version: 1.0.0

## Purpose

Compact, self-contained context for all remediation subagents. Every dispatch
references this file. Subagents must also read the target project
`.metaproject/index.md` before acting (metaproject hard gate).

## What this job is

Rework `docs/requirements/keryx-project-agent-harness/` from a `draft` product
direction into an implementation-ready requirements package by resolving 12
deduplicated managed-review findings (S-01…S-12). Documentation/contract work
only — no production runtime, no production-code edits.

## Authoritative evidence (read-only, immutable)

- Source review dir: `.metaproject/reviews/2026-07-10-review-flow-users-tsaitler-aleksandr-goodea-goodpro-/`
  - `report.md`, `findings.json` (S-01…S-12), `decisions.md`,
    `implementation-readiness.md`, `coverage.md`, `context-manifest.md`,
    `research-sources.md`, `results/T01.md … results/T20.md`.
- Reviewer track → finding map (source_tracks in findings.json):
  - S-01 ← T01,T02,T17,T19; S-02 ← T01,T04,T05,T09,T15;
    S-03 ← T06,T09,T14; S-04 ← T07,T08; S-05 ← T07,T08,T09,T12,T15;
    S-06 ← T03,T10,T13,T17; S-07 ← T04,T13,T15; S-08 ← T11,T15,T16;
    S-09 ← T05,T18; S-10 ← T01,T02,T03,T17,T19; S-11 ← T14,T15;
    S-12 ← T16.

## Current package state (as read)

- README status line: "Specification ready; implementation is future work."
  (contradicts S-01 → must become `draft — decision pending`).
- Roadmap entry: "specification ready (future)" → must become `draft`.
- 8 schemas exist: config, run-input, event, tool-call, policy-decision,
  agent-task, context-manifest, run-output — all Draft 2020-12, `schemaVersion: const 1`.
- Concrete schema gaps confirmed by direct read:
  - `harness-event`: `payload` is unconstrained `{type:object}`; no discriminated
    payload union; `sessionId`/`parentEventId`/`dispatchId` optional; no shared
    reusable envelope. (S-02)
  - `harness-run-output`: `status:"completed"` can coexist with
    `gate.status:"fail"|"skipped"|"unknown"`, `finishedAt:null`, empty
    `artifacts`, and non-empty `unresolvedRisks`; no conditional invariant. (S-07)
  - `harness-agent-task`: independent parallel child contract; conflicts with
    canonical gdskills `subagent-dispatch`/`subagent-result`. (S-08)
  - `harness-tool-call`: has `risk`/`replayable` but no execution-state,
    receipt, idempotency-key, or result contract. (S-03)
  - `harness-policy-decision`: `approvalId` is a bare string; no action/schema/
    policy/actor/expiry/consumption fingerprints; no separate approval
    request/result schema. (S-05)
  - Missing durable schemas: session-manifest, session-entry, provider-descriptor,
    model-request/response/error, tool-definition, tool-registry-snapshot,
    tool-execution-state, tool-result+receipt, policy-profile, approval-request,
    approval-result, evidence-record/ledger, checkpoint, branch-metadata,
    compaction-entry, completion-gate-result, rpc-envelope, fake-provider-transcript,
    replay-fixture, replay-mismatch. (S-02/S-03/S-05/S-07/S-11)
- `acceptance.feature`: line 26 uses `Before the first model request` as a step
  (invalid — `Before` is a hook keyword; parser fails); the
  "Enforce allow, ask, and deny" scenario asserts all three outcomes at once
  (needs Scenario Outline); no `@R*`/`@T*` tags; missing negative/lifecycle
  scenarios. (S-12)
- `implementation-plan.md`: 30-task plan; no task owns `src/harness` relocation;
  fake fixtures (T5) ordered against interfaces; first vertical slice (T17)
  depends on compaction/branching (T16); final review (T29) is monolithic. (S-10)
- `src/harness/` currently = fixture-corpus evaluator; must relocate to `src/eval/`
  before reserving `src/harness/` for the runtime.

## Frozen decision baseline (D1–D7)

See job README. All seven are consistent with the evidence (S-01/S-04/S-06/
S-08/S-09/S-10 and readiness gates); adopted without contradiction.

## Standards to follow

- `rules/core/requirements-package-standard.mdc`: README/prd/specification
  required; every Markdown has `Version` under H1; bump on change; README links
  every package file; spec references schemas; honest status; roadmap updated.
- `rules/core/subagent-context-construction.md`: every dispatch has the 5 fields.
- `rules/core/subagent-status-protocol.md`: every result starts with `STATUS:`.
- docpack-orchestrator Iron Laws; docpack-review checklist for the re-review.
- Routing note: `requirements-management.mdc`/`implementation-plans.mdc`
  date-stamped ru/en/ai layout does NOT apply (this is a flat English
  requirements-package-standard package edited in place).

## Concurrency / workspace rules for subagents

- One writer per file. Shared multi-topic files (`specification.md`, `README.md`,
  `prd.md`, protocol docs) are edited by the orchestrator or a single owner in
  sequence. Isolated single-owner artifacts (each `schemas/*.json`,
  `acceptance.feature`, `implementation-plan.md`, job-doc analyses, research
  ledger) may be produced by parallel subagents.
- No git worktree, branch, commit, push, or PR. No production-code edits. No new
  dependencies. Do not modify the source review dir or unrelated user files.
