# Acceptance Criteria

Rules:

- Criteria lines use the exact format `- ACn: <criterion>`.
- After `flow freeze` this file is checksum-protected: any edit outside
  `keryx flow ac update` fails every gate and status transition.
- Completion requires every ACn to be confirmed via
  `keryx flow ac confirm <id> <ACn>`.

## Criteria

- AC1: FI-01 ManagedFlowPort — `src/harness/flow/managed-flow-port.ts` defines a `ManagedFlowPort` that consumes a harness `CompletionGateResult` + evidence (`evidenceRefs`) + `runLink` and advances a managed flow ONLY through the Task Manager `FlowService` API (never a direct flow.json write); the gate maps to a task disposition (gate pass → `completed`; gate fail or undisposed blocker → `failed`/`blocked`); evidenceRefs and runLink are attached to the task through the API.
- AC2: D-02 single-coordinator — the harness NEVER writes flow.json directly (verifiable: no `writeFlow`/flow.json write reachable from `src/harness/**`; only `src/flow` writes flow.json); a managed flow is advanced only through the Task Manager; there is no duplicate coordinator / second loop authority; direct flow-file mutation is denied (SC_R09_DIRECT_FLOW_FILE_EDIT_DENIED, SC_R09_SINGLE_COORDINATOR).
- AC3: additive Task Manager API — `FlowService.taskDone` is extended with optional `evidenceRefs?`/`runLink?` in a backward-compatible way: existing W2 behavior is unchanged and every prior `src/flow` test still passes; existing `taskDone` callers are unaffected; Task Manager task-state migrates deterministically before integration (SC_R09_TASK_MANAGER_MIGRATION, reusing the W2 read-time migration).
- AC4: FI-02 parity — a single coordinator (the Task Manager) owns retries, review/fix, and completion transitions; a harness completion-gate result is consistent with the Task Manager task completion (parity) via `src/harness/flow/parity.ts`; failure-disposition is correct (a failing harness run yields a `failed`/`blocked` task disposition, not a false completion); no second loop authority transitions flow state.
- AC5: No regression / reuse / scope — `tsc --noEmit` is clean and the full `bun test` suite is ≥ the pre-change baseline of 899 pass with the new tests green and 0 fail; the src/flow change is ONLY the minimal additive `taskDone` extension (backward-compatible); the W7 completion/evidence, W8 resume, W5 ports, W6 fakes, and `src/contracts` validator are REUSED (not rewritten); no new production dependency (`dependencies` `{}`), no provider SDK, no network; new harness code lives under `src/harness/`; the frozen requirements package, `src/eval/`, `src/contracts/`, and ADR-0001…0004 are NOT modified.
