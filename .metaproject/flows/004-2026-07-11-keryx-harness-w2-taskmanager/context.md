# Context — Flow 004 (W2 Task Manager evolution)

Collected by `keryx flow init` and enriched for W2. (T1 context task.)

## Current Task Manager surface (to evolve — read before changing)

- `src/flow/types.ts` — `FlowTask = { id, title, kind, status }` with
  `TaskStatus = "todo"|"in-progress"|"done"`; `FlowState.schemaVersion: 1`;
  `TaskKind = context|implement|test|review|docs`. No deps/attempts/dispositions/
  refs/budgets/run-link.
- `src/flow/machine.ts` — flow-level status transitions only; **no** task-level
  disposition discipline (blocked/failed/skipped absent for tasks).
- `src/flow/store.ts` — `readFlow`/`writeFlow` (JSON), `resolveFlowDir`, AC
  checksum helpers. **Migration hook point = `readFlow`** (normalize on read).
- `src/flow/service.ts` — `init` writes `schemaVersion:1` + DEFAULT_TASKS;
  `taskAdd` pushes `{status:"todo"}`; `taskDone` → `"done"`; `complete` runs
  gates (acceptance-criteria/pull-request/main-merge/health/security); `check`
  **rejects `schemaVersion !== 1`** (must accept the new version + legacy).
- `src/commands/flow.ts` — CLI surface (`flow task add/done`, `ac`, etc.).
- Tests: `src/flow/service.test.ts`, `machine.test.ts`, `security-gate.test.ts`,
  `context-inject.test.ts`.
- Existing flows on disk: `.metaproject/flows/001…004`, all `schemaVersion:1`;
  `003` is the live in-progress W1 flow. Migration must not disrupt them.

## Frozen source of truth (cite, never modify)

- `docs/requirements/keryx-project-agent-harness/implementation-plan.md` §W2
  (TM-01/TM-02/TM-03 rows) and "Global constraints".
- `docs/requirements/keryx-project-agent-harness/specification.md` — Orchestration
  Model (managed flow deferred to Release 1; one loop authority), Completion Gates
  ("required tasks terminal or explicitly dispositioned"), ownership/import matrix
  (Task Manager owns task state/dependencies/dispositions/retries; harness supplies
  typed evidence, never advances Task Manager state).
- `docs/decisions/keryx-harness/ADR-0002-d02-single-coordinator-ownership.md` (D-02)
  — the invariant TM-* must preserve.
- Vocabulary reference (DEPRECATED for persistence): `schemas/harness-agent-task.schema.json`
  — status enum `todo|in-progress|waiting-approval|blocked|done|failed|skipped`,
  `budget`, `attempt`; canonical child contracts are `subagent-dispatch`/`subagent-result`
  + `harness-child-contract-extension.schema.json`.

## Additive fields to specify (all OPTIONAL, on FlowTask)

`dependsOn: string[]`; `attempts` (counter + append-only immutable attempt log);
`disposition: "completed"|"blocked"|"failed"|"skipped"` (terminality distinct from
`status`); `acRefs: string[]`; `evidenceRefs: string[]`; `budget?: {maxSeconds?,
maxToolCalls?, maxRetries?, maxTokens?}` (production values OPEN); `runLink?:
{runId, sessionId, ...}` (reference only — harness never writes flow.json).

## Backward-compat strategy (user-approved; TM-01 finalizes)

Bump `schemaVersion 1 → 2`; `readFlow` normalizes v1→v2 on read (defaults:
`dependsOn:[]`, `attempts:0/1`, `done→disposition:"completed"`); write v2 only on
next mutation; `check` accepts `{1,2}`. Old files not rewritten until touched.

## Operational

- keryx CLI = `bun ./src/cli.ts <cmd>` (no PATH binary).
- Worktree `feature/keryx-harness-impl` @ 690b376; never commit to `main`.
- State only via `keryx flow`; never hand-edit `flow.json` or frozen AC.
- Workers via `subagent-dispatch` → `subagent-result` (STATUS: first line).
- TDD: TM-01 spec → TM-02 RED tests → TM-03 GREEN → code-verifier.
