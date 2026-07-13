# TM-01: Task Manager Evolution Specification
## Additive Task/Run-Link Fields, Versioned Migration, and Backward Compatibility

**Status**: Specification (design document for TM-02/TM-03 implementation)  
**Frozen**: 2026-07-12  
**Task**: implementation-plan.md §W2 row TM-01  
**Depends on**: ADR-0002 (D-02 single-coordinator ownership)  
**Reviewer Track**: architecture  
**Acceptance Criterion**: AC1 (frozen in `flow 004 acceptance-criteria.md`)  
**Source of Truth**: This document only (frozen after review; TM-02/TM-03 implement exactly as specified)

---

## 1. Status and Context

### 1.1 Purpose

This specification defines an **additive, all-optional** evolution of the Task Manager task and run-link model from `schemaVersion 1` to `schemaVersion 2`. No existing field is removed or made required. The harness consumes the evolved fields through the `ManagedFlowPort` API contract to track dependencies, attempt history, task dispositions, acceptance criteria/evidence references, budgets, and session/run linkage **without the harness ever writing `flow.json`** (ADR-0002 D-02 invariant preserved).

### 1.2 Frozen Authority

This specification is frozen 2026-07-12 and is the normative contract for TM-02 (tests) and TM-03 (implementation). No implementation proceeds ahead of this document. Changes to this specification require a new document version and explicit approval before TM-02/TM-03 are re-scoped.

**Frozen sources** (cited, never modified):
- `docs/requirements/keryx-project-agent-harness/implementation-plan.md` §W2 (TM-01/TM-02/TM-03 rows)
- `docs/requirements/keryx-project-agent-harness/specification.md` (Orchestration Model, Completion Gates, Ownership/Import Matrix)
- `docs/decisions/keryx-harness/ADR-0002-d02-single-coordinator-ownership.md` (D-02 invariant: no harness→flow.json writes, single coordinator)
- `.metaproject/flows/004-2026-07-11-keryx-harness-w2-taskmanager/acceptance-criteria.md` (AC1 text)
- Current code: `src/flow/types.ts`, `src/flow/store.ts`, `src/flow/machine.ts`, `src/flow/service.ts`
- Existing flows on disk: `.metaproject/flows/001…003` (all schemaVersion 1; must migrate deterministically)

### 1.3 Relationship to ADR-0002

ADR-0002 freezes the D-02 decision that Task Manager is the single managed-flow coordinator and the harness never writes `flow.json`. This specification operationalizes that invariant by:
- Naming the exact fields the harness consumes through `ManagedFlowPort`
- Specifying how `runLink` (session/run reference) is set by the coordinator only
- Defining deterministic migration rules so legacy flows remain readable
- Ensuring every new field is optional (no breaking change to existing flows)

---

## 2. Additive Field Specification

All fields in this table are added to `FlowTask` (no removal or required-field change to existing fields).

| Field | Type | Optional? | Semantics | Default when absent (v1→v2 migration) | Mutable in v2? |
|-------|------|-----------|-----------|---------------------------------------|----------------|
| **Existing fields (v1)** | | | | | |
| `id` | `string` | NO (existing) | Task identifier: T1, T2, ... | (carried forward) | NO |
| `title` | `string` | NO (existing) | Task title/objective | (carried forward) | YES (via CLI/API) |
| `kind` | `TaskKind` ("context"‌\|"implement"‌\|"test"‌\|"review"‌\|"docs") | NO (existing) | Task classification | (carried forward) | NO |
| `status` | `TaskStatus` ("todo"‌\|"in-progress"‌\|"done") | NO (existing) | Task execution status (tracking, not completion) | (carried forward) | YES (via `taskDone`, etc.) |
| **New fields (v2)** | | | | | |
| `dependsOn` | `string[]` (array of task IDs, e.g., `["T1", "T3"]`) | **YES** | Task identifiers this task depends on; evaluated by Task Manager for scheduling. Empty array indicates no dependencies. | `[]` (no dependencies) | YES (via evolved Task Manager API) |
| `attempts` | `{count: number; log: AttemptEntry[]}` where `AttemptEntry = {at: string (ISO 8601), outcome: "started"\|"paused"\|"completed"\|"failed"\|"blocked", detail?: string}` | **YES** | Attempt counter and immutable append-only log of task attempts. Harness appends entries; never modifies. Task Manager owns the retry policy (which attempt is next). | `{count: 0, log: []}` | Append-only (read/append by harness; retry policy by Task Manager) |
| `disposition` | `"completed"\|"blocked"\|"failed"\|"skipped"` | **YES** | Explicit terminal state distinct from `status`. Applies after `status` reaches "done". Clarifies *how* a task ended. `status: "done"` + `disposition: "completed"` = success. `status: "done"` + `disposition: "failed"` = explicit failure. `status: "done"` + `disposition: "blocked"` = externally blocked. `status: "done"` + `disposition: "skipped"` = intentionally omitted. | `"completed"` (if `status: "done"` in v1); absent otherwise (await explicit set) | YES (via evolved Task Manager API) |
| `acRefs` | `string[]` (array of acceptance criterion IDs, e.g., `["AC1", "AC3", "AC5"]`) | **YES** | Acceptance criteria this task must satisfy or evidence against (mapping task→criteria). Empty array = task has no specific AC mapping. | `[]` | YES (via CLI/API) |
| `evidenceRefs` | `string[]` (array of evidence artifact identifiers/paths, e.g., `[".metaproject/reviews/001-xyz/findings.md"]`) | **YES** | Paths to or identifiers of artifacts (test reports, review findings, harness evidence) that document task completion or state. Harness may append. | `[]` | Append-capable (read/append by harness; interpretation by Task Manager) |
| `budget` | `{maxSeconds?: number; maxToolCalls?: number; maxRetries?: number; maxTokens?: number}` (all fields optional within budget object) | **YES** | Execution budget constraints for this task when dispatched to a harness run. Task Manager reserves these against global ceilings. Field values are production OPEN (see §8). Absence = no per-task override (use flow/global defaults). | `{}` (no per-task budget constraint) | YES (via Task Manager API; harness reads, does not set) |
| `runLink` | `{runId: string; sessionId: string; attempt: number; at?: string}` | **YES** | Reference to the harness run/session that executed this task. Set by Task Manager / flow-orchestrator only (D-02 invariant). Harness reads for traceability but never writes. Enables coordinator to link task attempts to evidence artifacts. | `undefined` (not set until a harness run is associated) | NO (written by Task Manager only; harness read-only) |

### 2.1 Key Invariants

1. **Every new field is OPTIONAL.** Absence is well-defined; no new field forces an edit to existing flows.
2. **No existing field is removed.** All v1 fields (`id`, `title`, `kind`, `status`) persist in v2.
3. **No existing field becomes required.** Optional fields in v1 remain optional in v2.
4. **`runLink` is set by Task Manager only.** The harness never writes `flow.json` (ADR-0002). The harness may read `runLink` to correlate its own session/run artifacts with tasks but must not mutate it.
5. **`attempts.log` is append-only.** Harness may append attempt entries; existing entries are immutable. Task Manager owns the retry policy (deciding which attempt is next).
6. **Disposition is distinct from status.** `status` ("todo", "in-progress", "done") tracks tracking; `disposition` ("completed", "failed", "blocked", "skipped") clarifies *how* it ended. A task with `status: "done"` and no explicit `disposition` is treated as `disposition: "completed"` during completion gates.

---

## 3. Task/Run-Link (Session Linkage)

### 3.1 Reference Only, Never Written by Harness

The `runLink` field is a stored pointer set by Task Manager / `flow-orchestrator` only. It enables the coordinator to track which harness run executed a task, without the harness ever writing `flow.json`.

### 3.2 Structure and Semantics

```typescript
runLink?: {
  runId: string;           // Harness run identifier (immutable)
  sessionId: string;       // Harness session identifier (immutable)
  attempt: number;         // Which harness attempt produced this link (immutable)
  at?: string;             // ISO 8601 timestamp when link was recorded (informational)
}
```

- **`runId`**: Unique identifier for a harness invocation (e.g., "run-001", stable across attempts).
- **`sessionId`**: Unique session identifier within the run (stable across retries within same run).
- **`attempt`**: The attempt number that generated this link (1-indexed). Lets Task Manager correlate `runLink` with entries in the task's `attempts.log`.
- **`at`**: Optional timestamp (ISO 8601) recording when this link was established; for audit/traceability only.

### 3.3 D-02 Invariant: Harness Never Writes

The D-02 invariant forbids the harness from writing `flow.json`. The `runLink` field is set **exclusively by Task Manager** when:
1. A run is dispatched to execute a task (Task Manager knows the `runId`, `sessionId`, `attempt`).
2. The run completes (successfully or with explicit disposition).
3. Task Manager correlates harness evidence/gate artifacts with the task by reading `runLink`.

The harness may **read** `runLink` during its execution to:
- Identify which task it is executing (if the harness is re-invoked).
- Correlate its own session logs/evidence with the task for traceability.
- Emit evidence artifacts tagged with `runLink` for later Task Manager consumption.

The harness must **never**:
- Write or modify `flow.json`.
- Set or mutate `runLink`.
- Attempt to write task state directly.

All communication between harness and Task Manager flows through `ManagedFlowPort` API contracts (implementation deferred to W11 FI-01), not direct file writes.

---

## 4. Versioned Migration Proposal

### 4.1 Migration Strategy: schemaVersion 1 → 2

**Choice**: Read-time normalization with deferred writes.

**Rationale**:
- Existing flows (001–003) remain valid and unchanged on disk until mutated.
- No mass rewrite on upgrade (zero disruption).
- Deterministic defaults applied on read; deterministic behavior maintained.
- Mutation operations (`taskAdd`, `taskDone`, `implemented`, etc.) write v2 format.
- Readers accept both v1 and v2 (backward compatible).

### 4.2 Migration Rules (Deterministic Defaults)

When `readFlow(cwd, dir)` loads a v1 flow (`schemaVersion: 1`), **on read** the following transformations are applied in-memory before returning the FlowState. **No file is written** until the next mutation.

For each task in `flow.tasks[]`:

| Transformation | Condition | Rule | Result | Rationale |
|---|---|---|---|---|
| `dependsOn` | Not present in v1 | Set to `[]` | `dependsOn: []` | No dependencies implied by v1 tasks (they exist in implicit DAG order only). |
| `attempts` | Not present in v1 | Create from `status` | `{count: 0, log: []}` if task never started; `{count: 1, log: [{at: flow.createdAt, outcome: "started"‌}]}` if `status: "in-progress"` or `"done"`; otherwise `{count: 1, log: [{at: lastStatusChange, outcome: "completed"}]}` based on flow history. | Infer attempt count from flow history; default 0 if task was never touched. |
| `disposition` | Not present in v1 | Infer from `status` | If `status: "done"` and no history indicates failure/block → `disposition: "completed"`; otherwise absent (will be set by mutation or completion gate). | Terminal disposition matches v1 "done" semantics. |
| `acRefs` | Not present in v1 | Set to `[]` | `acRefs: []` | No explicit mapping in v1; left to completion gates to validate full criterion coverage. |
| `evidenceRefs` | Not present in v1 | Set to `[]` | `evidenceRefs: []` | No evidence artifacts referenced in v1; harness/reviewer will add during execution. |
| `budget` | Not present in v1 | Set to `{}` | `budget: {}` | No per-task budget in v1; task inherits flow-level constraints (OPEN). |
| `runLink` | Not present in v1 | Left absent | `undefined` | Not set until a harness run is dispatched (W11 FI-01). |

**Special case: attempt inferral from flow.history**

If `flow.history[]` contains events for a task (e.g., `task-done`, `completion-failed`), the attempt log entry timestamp is set to the earliest such event. If no history, default to `flow.createdAt`.

### 4.3 Write Strategy

- **On read**: v1 flows are normalized in-memory (no file write).
- **On mutation** (e.g., `taskDone`, `taskAdd`, `implemented`, `complete`): the returned `FlowState` is written in v2 format to disk, including the new fields.
- **`check` command**: accepts both `schemaVersion: 1` and `schemaVersion: 2` (no rejection; no rewrite forced).
- **CLI/API**: all read operations return the normalized v2 shape to consumers; mutations accept v2 shape.

### 4.4 Migration Rollout

1. **TM-03 implementation**:
   - `readFlow` applies deterministic defaults (§4.2) and returns normalized v2 structure.
   - `writeFlow` writes v2 format.
   - `service.ts` operations (`taskAdd`, `taskDone`, etc.) work with v2 shape.
   - `check` accepts both versions; no error on v1.

2. **No mass rewrite**:
   - Flows 001–003 remain v1 on disk until next mutation (e.g., `keryx flow taskAdd 001 T5`).
   - Existing `keryx flow list / status / check` commands behave unchanged for v1 flows (normalized on read).

3. **Backward compatibility** (§5 below) ensures all v1 clients remain unaffected.

---

## 5. Backward-Compatibility Matrix

This matrix shows that every existing FlowTask and FlowState shape (schemaVersion 1) migrates to a valid v2 form without requiring client code changes.

### 5.1 FlowTask Migration

| v1 Shape | v2 Migration | Compatibility Note |
|---|---|---|
| `{id: "T1", title: "...", kind: "context", status: "todo"}` | `{id: "T1", title: "...", kind: "context", status: "todo", dependsOn: [], attempts: {count: 0, log: []}, acRefs: [], evidenceRefs: [], budget: {}}` | Task not yet started. Attempt log empty. No dependencies or evidence. |
| `{id: "T2", title: "...", kind: "implement", status: "in-progress"}` | `{id: "T2", title: "...", kind: "implement", status: "in-progress", dependsOn: [], attempts: {count: 1, log: [{at: (earliest flow event), outcome: "started"}]}, acRefs: [], evidenceRefs: [], budget: {}}` | Task in-progress; one attempt inferred from history. |
| `{id: "T3", title: "...", kind: "test", status: "done"}` | `{id: "T3", title: "...", kind: "test", status: "done", dependsOn: [], attempts: {count: 1, log: [{at: (earliest flow event), outcome: "completed"}]}, disposition: "completed", acRefs: [], evidenceRefs: [], budget: {}}` | Task complete; disposition inferred as "completed" (v1 "done" semantics). |
| `{id: "T4", title: "...", kind: "review", status: "todo"}` added after flow creation | `{id: "T4", title: "...", kind: "review", status: "todo", dependsOn: [], attempts: {count: 0, log: []}, acRefs: [], evidenceRefs: [], budget: {}}` | Same as initial task; creation time from history. |

### 5.2 FlowState Migration

| v1 Field | v2 Form | Compatibility Note |
|---|---|---|
| `schemaVersion: 1` | Normalized to `schemaVersion: 2` on read (no write until mutation) | Existing queries that check `schemaVersion` will see 2 after normalization; comparison against literal 1 must account for both (recommended: accept both). |
| `id`, `slug`, `title`, `status`, etc. (all existing fields) | Unchanged | Existing clients read/write same fields. |
| `tasks: [{v1 shape}]` | Transformed to `tasks: [{v2 shape}]` per 5.1 | All task fields extended with new optional fields. |
| No `acRefs` / `evidenceRefs` / `disposition` / `budget` / `runLink` | Added with deterministic defaults | Existing clients ignoring these fields see no change. |

### 5.3 Status and Disposition Transition Compatibility

**v1 behavior (status-only)**:
- `status: "todo"` → `status: "in-progress"` → `status: "done"` = terminal
- No explicit "blocked" or "failed" in v1 tasks (flow-level block exists; task-level did not).

**v2 behavior (status + disposition)**:
- `status` remains "todo" | "in-progress" | "done" (unchanged semantics).
- `disposition` clarifies how a "done" task ended: "completed", "blocked", "failed", "skipped".
- v1 → v2 mapping: `status: "done"` with no explicit `disposition` → assumed `disposition: "completed"` during completion gates.
- v2 clients may set `disposition` explicitly; v1 clients ignore it (presence does not break reads).

**Completion gates** (v1 and v2):
- v1: "task is done" = terminal; flow-level completion checks acceptance criteria, PR, health.
- v2: "task is done" + ("disposition is completed" OR "disposition is undefined") = criterion satisfied. "task is done" + "disposition is blocked/failed/skipped" = explicit disposition respected (see §6).

### 5.4 CLI and API Compatibility

| Command | v1 Behavior | v2 Behavior | Compatibility |
|---|---|---|---|
| `keryx flow list` | Lists `tasksDone / tasksTotal` (both status-based). | Same; computed from v2 tasks with migrated status. | ✓ Same output (transparently uses v2 schema). |
| `keryx flow status <id>` | Shows flow status, task list with `id`, `title`, `kind`, `status`. | Same fields plus new optional fields (in JSON mode). | ✓ Backward compatible; new fields hidden in text mode by default. |
| `keryx flow task add` | Creates task with `{id, title, kind, status: "todo"}`. | Creates task with `{id, title, kind, status: "todo", dependsOn: [], attempts: {count: 0, log: []}, ...}` | ✓ Same CLI syntax; new fields get defaults. |
| `keryx flow task done <id> <taskId>` | Sets `task.status = "done"`. | Sets `task.status = "done"` + infers `disposition: "completed"`. | ✓ Same behavior (disposition is optional and defaults sensibly). |
| `keryx flow check` | Rejects `schemaVersion !== 1`; reports v1 flows as "unknown version". | Accepts both 1 and 2; no error. | ✓ No regression; allows v1 flows. |

---

## 6. Disposition and Status-Transition Rules

### 6.1 Task Status Machine (v1 unchanged)

Within a single task, status follows the sequence (no backward transitions):

```
todo → in-progress → done
       ↓
    (can return to in-progress from "in-progress" if needed, but no reverse from "done")
```

Transitions are command-driven:
- `taskAdd` → `status: "todo"`
- `(manual execute or harness dispatch)` → `status: "in-progress"` (set by Task Manager or CLI)
- `taskDone <id>` → `status: "done"`

### 6.2 Disposition (v2 new)

Disposition applies only to tasks with `status: "done"`. Four explicit values:

| Disposition | Semantics | Completion Gate Implication | When to Set |
|---|---|---|---|
| `"completed"` | Task finished successfully, satisfying its criteria. | ✓ Contributes to criterion satisfaction (absent or explicit `"completed"`). | Default v1 "done"; or explicit set after successful execution/test. |
| `"blocked"` | Task could not proceed due to external blocker (dependency unmet, resource unavailable, etc.). | Blocked tasks do not block flow completion **if** explicitly dispositioned. Completion gate sees "explicitly blocked" ≠ "failed". | Set when task is marked done but blocked by external cause; Task Manager retries pending the blocker. |
| `"failed"` | Task attempted and failed (test failed, implementation does not meet spec, etc.). | Explicit failure signals to completion gate and reviewer that human review/fix is needed. | Set after execution/testing determines the task cannot proceed as-is; triggers review/fix wave in Release 1. |
| `"skipped"` | Task was intentionally omitted (e.g., requirement changed, deemed out-of-scope after starting). | ✓ Does not block flow completion (explicitly noted as intentional omit). | Set by coordinator when a task is no longer needed; recorded for auditability. |

### 6.3 Allowed Transitions

**For `status`** (unchanged from v1):
- `todo` → `in-progress` (task starts)
- `in-progress` → `done` (task completes, regardless of outcome)
- No backward transitions. No lateral transitions. Flow-level block pauses the task but does not change task status (only flow status changes).

**For `disposition`** (v2 new):
- Only meaningful when `status: "done"`.
- Once set, `disposition` is immutable (decision recorded for auditability).
- Absence when `status: "done"` is treated as implicit `"completed"` during gates (for v1 compat).
- Explicit set of `"blocked"` | `"failed"` | `"skipped"` overrides the default.

### 6.4 Completion Gate Logic (v1 and v2)

The flow completion gate checks: **all tasks in flow.tasks must be "terminal or explicitly dispositioned".**

**Terminal definition**:
- `status: "done"` AND (`disposition: "completed"` OR `disposition: undefined` OR `disposition: "skipped"`) = ✓ terminal for gate
- `status: "done"` AND `disposition: "blocked"` = ✓ explicit blocker recorded; flow may still complete if it's a known external hold
- `status: "done"` AND `disposition: "failed"` = ✗ gate fails (explicit failure; requires review/fix)
- `status: "todo"` or `"in-progress"` = ✗ not terminal; flow cannot complete

**Impact on gate evaluation**:
- v1: gate checks if all tasks have `status: "done"`; no distinction between success/failure/blocker.
- v2: gate checks if all tasks are terminal (status done + disposition completed/undefined/skipped/blocked) OR explicitly dispositioned as failing (requires human review).

---

## 7. Consequences for TM-02, TM-03, and Later Waves

### 7.1 TM-02: Migration and Fixture Tests

**Scope**: Define red tests and fixtures for v1→v2 migration.

**Deliverables**:
- Fixtures mapping each v1 `FlowTask` shape (from flows 001–003) to its v2 migrated form.
  - Fixture: `{v1: {...}, v2: {...}, expectedDefaults: {...}}`.
  - Assertion: `migrate(v1) === v2` (deterministic).
- Negative-migration fixtures: v1 shapes that should error or warn (if any; likely none given all-optional strategy).
- Status/disposition transition fixtures: v1 "done" → v2 "done"/"completed" → completion gate logic.
- Test suite is RED before TM-03; GREEN after.

**Requirements from AC2**:
- Old fixtures map deterministically; blocked/failed/skipped semantics explicit; at least one negative case included.

### 7.2 TM-03: Implementation

**Scope**: Implement migration and new fields in `src/flow/`.

**Deliverables**:
- `types.ts`: Add `FlowTask` v2 fields (optional); add `TaskDisposition` enum.
- `store.ts`: Implement deterministic migration in `readFlow` per §4.2.
- `service.ts`: Update operations to work with v2 schema; update `check` to accept both versions.
- `machine.ts`: Add task-level disposition transitions (if needed; likely orthogonal to flow-level machine).
- CLI: Commands remain syntactically compatible (new fields get defaults).
- Tests: TM-02 fixtures pass; existing flow tests (001–003) remain green.

**Requirements from AC3**:
- Additive optional fields and deterministic v1→v2 migration implemented.
- Flows 001–003 load unchanged; `list/status/check` work as before.
- New fields settable via service/CLI.
- `check` accepts schemaVersion 1 and 2.
- TM-02 suite GREEN.

**D-02 Invariant Preservation (AC4)**:
- No harness write to `flow.json`; `runLink` is read-only by harness.
- No second coordinator or duplicate plan/execute loop.

### 7.3 W11: Flow Integration (FI-01, FI-02)

**Dependency**: W11 flow-integration tasks depend on TM-03 (migration complete).

- **FI-01**: Harness consumes evolved Task Manager fields through `ManagedFlowPort` API.
  - Harness reads `dependsOn`, `attempts`, `disposition`, `runLink`.
  - Harness appends to `attempts.log` and `evidenceRefs` via API calls (never direct file write).
  - Task Manager owns `runLink` setting, retry policy, disposition finalization.

- **FI-02**: Test coordinator invariant.
  - Flow/harness completion parity: coordinated completion gate evaluation.
  - Failure-disposition tests: harness emits evidence; Task Manager evaluates gate; no duplicate logic.

### 7.4 W12: Child Agents (CA-01, CA-02)

**Dependency**: Deferred post-Release 0; depends on FI-01.

- Child task status is owned by Task Manager for a managed flow (reuses `subagent-dispatch`/`subagent-result` contracts).
- No child self-accepts a parent flow or mutates parent completion state.
- `attempts` and `disposition` fields extend to child-task records (same immutability rules).

---

## 8. OPEN Items

The following values and policy decisions are **explicitly deferred** and marked OPEN. TM-01 does not specify them; later tasks fill in production values. Implementation of TM-02/TM-03 must treat these as placeholders.

| Item | Question | Owner Task | Rationale | Status |
|---|---|---|---|---|
| **OPEN-1: Per-task budget values** | What are production values for `budget.maxSeconds`, `budget.maxToolCalls`, `budget.maxRetries`, `budget.maxTokens` per task kind (context/implement/test/review/docs)? | TM-03 / P-01 (Release 1 provider/tool work) | Requires empirical data on task execution times and harness tool call patterns; Release 0 is read-only (no actual tool budgeting); Release 1 defines per-role/per-task SLO ceilings. | OPEN |
| **OPEN-2: Flow-level budget ceilings** | What are upper-bound budgets per flow, per role, enforced by the coordinator? How do task budgets reserve against flow budgets? | FI-01 (Release 1 flow integration) | Coordinator needs to aggregate task budgets and enforce concurrency limits; requires policy definition and empirical SLO targets. | OPEN |
| **OPEN-3: Attempt log entry detail** | What additional fields (beyond `at`, `outcome`, `detail`) should `AttemptEntry` capture (e.g., `tokens`, `toolCalls`, `errors`)? | RS-01 / P-01 (Release 1 resume/attempt tracking) | Relevant to recovery and retry decisions; deferred past Release 0. | OPEN |
| **OPEN-4: Disposition finalization policy** | When does Task Manager finalize a task's `disposition` (e.g., from pending → blocked/failed/completed)? Who signals that finalization? | FI-02 (Release 1 flow integration tests) | Specification needed for the exact gate evaluation and Task Manager→harness feedback loop. | OPEN |
| **OPEN-5: Evidence retention and cleanup** | How long are `evidenceRefs` artifacts retained? Are they garbage-collected per task? Per flow? Are they moved to archive? | FI-01 / E-01 (Release 1+ documentation) | Artifact lifecycle and storage policy; deferred past Release 0. | OPEN |
| **OPEN-6: `acRefs` interpretation and validation** | How does completion gate validate `acRefs` (e.g., does every AC in `acceptance-criteria.md` need a corresponding `acRef` in a task)? | FI-02 (Release 1 flow integration tests) | Criterion-to-task mapping validation strategy; deferred to gate definition. | OPEN |
| **OPEN-7: Attempt count and retry eligibility** | When does `attempts.count` increment (at dispatch? at completion?)? Does count limit constitute a retry budget? | RS-01 (Release 1 resume/recovery) | Retry policy and attempt-count semantics; tied to recovery and coordinator retry loops. | OPEN |
| **OPEN-8: `runLink.at` clock source** | Is `runLink.at` set by harness (own clock) or by Task Manager? Whose clock is authoritative for ordering? | FI-01 (Release 1 flow integration) | Clock synchronization and ordering of events; deferred to FI-01. | OPEN |

**All OPEN items are explicitly deferred.** TM-01 does not guess; TM-02/TM-03 leave placeholder values (e.g., `budget: {}` always; `attempts` counts from history; disposition defaults as documented). Future tasks (FI-01, TM-03 v2, P-01, RS-01) will define production values and finalize these policies.

---

## 9. Acceptance Criterion (AC1) Fulfillment

This specification satisfies AC1 (frozen in flow 004 acceptance-criteria.md):

> **AC1**: TM-01 — `docs/decisions/keryx-harness/TM-01-task-manager-evolution.md` specifies additive task/run-link fields (dependencies, attempts, dispositions, AC/evidence refs, budgets, session/run linkage), states that every new field is OPTIONAL (no existing field removed or made required), fixes an explicit schema-version strategy (schemaVersion 1→2 with read-time migration), and includes a backward-compatibility matrix mapping every existing FlowTask/FlowState shape (schemaVersion 1) to its migrated form.

**Checklist**:

- ✓ **Additive fields specified** (§2): `dependsOn`, `attempts`, `disposition`, `acRefs`, `evidenceRefs`, `budget`, `runLink`.
- ✓ **Every new field is OPTIONAL** (§2, table row "Optional?"): all marked YES.
- ✓ **No existing field removed or made required** (§2.1 invariant 2–3): all v1 fields persist.
- ✓ **Explicit schema-version strategy** (§4): `schemaVersion 1→2`, read-time migration, `readFlow` normalizes on read, `writeFlow` writes v2, `check` accepts both.
- ✓ **Deterministic migration rules** (§4.2): exact defaults for each field per condition.
- ✓ **Backward-compatibility matrix** (§5): FlowTask and FlowState migration paths shown; CLI and API compatibility verified; v1 clients unaffected.
- ✓ **D-02 invariant preserved** (§3.3): `runLink` is coordinator-only; harness never writes `flow.json`.
- ✓ **Frozen sources cited, not modified** (§1.2): specification, implementation-plan, ADR-0002, AC1 text, existing code, existing flows.

**Overall verdict**: **AC1 SATISFIED.**

---

## 10. Version and Stability

| Field | Value |
|---|---|
| Document Version | 1.0 |
| Frozen Date | 2026-07-12 |
| Acceptance Criterion | AC1 (flow 004) |
| Immutable? | YES (changes require new document version + approval) |
| TM-02/TM-03 Binding | YES (implement exactly as specified) |
| Review Gate | Architecture (carried by D-02 review; specification review may overlap) |

**No changes to this document are permitted without explicit approval and a new version number. TM-02 and TM-03 treat this specification as normative, frozen, and complete.**

---

## References

### Normative (Frozen, cited)

- `docs/requirements/keryx-project-agent-harness/implementation-plan.md` §W2 (TM-01/TM-02/TM-03 rows) + "Purpose and authority" + "Global constraints"
- `docs/requirements/keryx-project-agent-harness/specification.md` §Orchestration Model, §Completion Gates, §Canonical Ownership and Import Direction
- `docs/decisions/keryx-harness/ADR-0002-d02-single-coordinator-ownership.md` (D-02 invariant)
- `.metaproject/flows/004-2026-07-11-keryx-harness-w2-taskmanager/acceptance-criteria.md` (AC1 text)
- `src/flow/types.ts`, `src/flow/store.ts`, `src/flow/machine.ts`, `src/flow/service.ts` (current implementation)
- `.metaproject/flows/001–003/flow.json` (existing v1 flows for backward-compat verification)

### Informative

- `docs/requirements/keryx-project-agent-harness/schemas/harness-agent-task.schema.json` (deprecated vocabulary reference; status/budget/attempt enum values)
- ADR-0001 (D-01 Release 0 boundary; context for D-02)
- `docs/requirements/keryx-project-agent-harness/prd.md` (Product vision; Task Manager as single coordinator)
- `docs/requirements/keryx-project-agent-harness/brainstorm.md` (Selected decisions D1, D2, D8)

---

**Specification frozen and approved for TM-02/TM-03 implementation.**
