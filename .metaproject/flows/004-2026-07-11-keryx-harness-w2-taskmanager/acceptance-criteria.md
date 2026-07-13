# Acceptance Criteria

Rules:

- Criteria lines use the exact format `- ACn: <criterion>`.
- After `flow freeze` this file is checksum-protected: any edit outside
  `keryx flow ac update` fails every gate and status transition.
- Completion requires every ACn to be confirmed via
  `keryx flow ac confirm <id> <ACn>`.

## Criteria

- AC1: TM-01 — `docs/decisions/keryx-harness/TM-01-task-manager-evolution.md` specifies additive task/run-link fields (dependencies, attempts, dispositions, AC/evidence refs, budgets, session/run linkage), states that every new field is OPTIONAL (no existing field removed or made required), fixes an explicit schema-version strategy (schemaVersion 1→2 with read-time migration), and includes a backward-compatibility matrix that maps every existing FlowTask/FlowState shape (schemaVersion 1) to its migrated form.
- AC2: TM-02 — RED tests + fixtures under `src/flow/` exist that (a) map existing FlowTask values (as in flows 001/002/003) deterministically to their migrated v2 form, (b) make blocked/failed/skipped/completed disposition semantics explicit and asserted, and (c) include at least one negative-migration case; the suite is RED (fails) before TM-03 is implemented.
- AC3: TM-03 — additive optional fields and a deterministic v1→v2 migration are implemented in `src/flow`; existing flows 001/002/003/004 still load and `keryx flow list/status/check` behave unchanged for them; the new fields/dispositions are settable through the service/CLI; `keryx flow check` accepts the migrated schema version (and legacy 1); the TM-02 suite is GREEN.
- AC4: The D-02 invariant is preserved and explicitly verified — the harness never advances Task Manager state or writes `flow.json`; `runLink`/session linkage is a stored reference only; no second coordinator or duplicate plan/execute loop is introduced. Consistent with ADR-0002.
- AC5: No regression — `tsc --noEmit` is clean and the full `bun test` suite is green (including pre-existing `src/flow` tests); reading legacy (schemaVersion 1) flows is behavior-compatible; code-verifier gate returns PASS.
