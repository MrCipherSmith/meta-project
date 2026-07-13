# Flow 014 — W11 flow integration (FI-01, FI-02) — Release 1

Status: formalized
Source: user description (harness runbook, Phase 11 — Release 1)

## Problem

The harness produces evidence + completion-gate results (W7) and the Task Manager
grew additive task fields (W2), but nothing connects them: a harness run cannot
advance a managed flow, and the D-02 invariant (harness never writes flow.json;
one coordinator) has no integration seam. W11 adds a `ManagedFlowPort` so the
harness consumes its evidence/gate through the evolved Task Manager API only, and
verifies a single coordinator owns retries, review/fix, and completion.

## Expected Outcome

- **FI-01 (implement)** — a minimal backward-compatible additive extension of the
  Task Manager API (`FlowService.taskDone` gains optional `evidenceRefs?`/`runLink?`)
  plus `src/harness/flow/managed-flow-port.ts`: the harness maps a run's
  completion-gate + evidence + runLink into a `taskDone(disposition, evidenceRefs,
  runLink)` call — the harness NEVER writes flow.json; the Task Manager is the sole
  writer / loop authority (D-02).
- **FI-02 (test)** — one coordinator owns retries, review/fix, and completion
  transitions: harness completion-gate ⟺ Task Manager task completion (parity),
  failure-disposition is correct, and there is no duplicate coordinator; Task
  Manager task-state migrates deterministically before integration.

## Out of Scope (do NOT touch)

- Any wave other than W11. No child (W12), parallel (W13), real provider (W14),
  hardening (W15).
- Rewriting the W7 completion/evidence, W8 resume, W5/W6, or the src/contracts
  validator — REUSE them. The only src/flow change is a minimal, backward-compatible
  ADDITIVE extension (existing W2 behavior + all prior flow tests unchanged).
- The frozen requirements package + frozen ADR-0001…0004 — read/cite only.
- No new production dependency; no provider SDK; no network; no real fs mutation in
  tests (Task Manager uses its own store; harness never writes flow.json directly).
