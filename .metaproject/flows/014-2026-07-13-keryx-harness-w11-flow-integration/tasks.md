# Tasks — Flow 014 (W11 flow integration)

Task definitions live here; task **statuses** live in flow.json and are managed
only via `keryx flow task done <id> <taskId>`.

Scope: **only W11** (implementation-plan.md §W11). ManagedFlowPort over W2/W7 —
reuse; the ONLY src/flow change is minimal additive (backward-compatible). D-02:
harness NEVER writes flow.json. Deterministic; no new dep/SDK/network. Worktree-guard.

| ID | Kind | Model | Title / definition |
|----|------|-------|--------------------|
| T1 | context | Haiku | Integration map + D-02 invariant (context.md). |
| T2 | implement | — | Umbrella: implement per plan (closed when T6 done). |
| T3 | test | — | Umbrella: TDD tests (closed when T5/T7 authored + impls green). |
| T4 | review | — | Umbrella: self-review + completion prep (closed when T8 + completion done). |
| T5 | test (FI-01 RED) | Sonnet | `src/harness/flow/` tests: `ManagedFlowPort` maps a harness `CompletionGateResult` + `EvidenceRecord`(evidenceRefs) + `runLink` into a Task Manager `taskDone(disposition, evidenceRefs, runLink)` call; the harness NEVER writes flow.json (advance only through FlowService API); gate→disposition mapping (pass→completed, fail/blocker→failed/blocked); Task Manager task-state migrates deterministically (reuse W2 migrateFlow). RED before T6. |
| T6 | impl (FI-01) | Opus | ADDITIVE: extend `FlowService.taskDone` input with optional `evidenceRefs?: string[]` / `runLink?: TaskRunLink` in `src/flow/{types,service}.ts` (backward-compatible; existing behavior + all prior flow tests unchanged; the Task Manager records them on the task). Add `src/harness/flow/managed-flow-port.ts`: `ManagedFlowPort` + adapter over FlowService; harness never writes flow.json. Make T5 green. |
| T7 | test (FI-02) | Sonnet | `src/harness/flow/parity.test.ts`: one coordinator owns retries/review-fix/completion; harness completion-gate ⟺ Task Manager task completion (parity); failure-disposition (fail run → task disposition failed/blocked); no duplicate coordinator; TM-migration before integration. Author a pure `src/harness/flow/parity.ts` helper (`completionParity(taskState, gateResult)`). |
| T8 | review | Opus | code-verifier (`tsc` + full `bun test` ≥899 + new green); D-02 invariant (`ctx rg` for writeFlow/flow.json writes outside `src/flow` = 0; harness never writes flow.json); single-coordinator + no-duplicate-coordinator; additive-only src/flow (backward-compat: all prior flow tests green, taskDone existing callers unaffected); determinism; W7/W8/src-contracts reused not rewritten; frozen requirements pkg + src/eval + src/contracts + ADRs untouched. |
