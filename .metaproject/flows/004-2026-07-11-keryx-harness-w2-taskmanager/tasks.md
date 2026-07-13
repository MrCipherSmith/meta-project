# Tasks — Flow 004 (W2 Task Manager evolution)

Task definitions live here; task **statuses** live in flow.json and are managed
only via `keryx flow task done <id> <taskId>`.

Scope: **only W2** (implementation-plan.md §W2). No other wave. Backward
compatibility is mandatory.

| ID | Kind | Model | Title / definition |
|----|------|-------|--------------------|
| T1 | context | Haiku | Collect W2 context: current `src/flow` surface + frozen spec §W2 + ADR-0002 (done in context.md). |
| T2 | implement | — | Umbrella: implement per plan (closed when T7 done). |
| T3 | test | — | Umbrella: TDD tests (closed when T6 authored + T7 makes them green). |
| T4 | review | — | Umbrella: self-review + completion prep (closed when T8 + completion done). |
| T5 | docs (TM-01) | Haiku | Specify additive, all-optional task/run-link fields (dependsOn, attempts, disposition, acRefs, evidenceRefs, budget, runLink) + versioned migration proposal (schemaVersion 1→2) + backward-compatibility matrix. Evidence: `docs/decisions/keryx-harness/TM-01-task-manager-evolution.md`. Reviewer: architecture. |
| T6 | test (TM-02) | Sonnet | RED tests + fixtures under `src/flow/`: existing FlowTask values map deterministically old→new; blocked/failed/skipped/completed disposition semantics explicit; negative-migration cases. Must be RED before TM-03. Reviewer: testing. |
| T7 | implement (TM-03) | Opus | Implement types/store(read-time migration)/machine(task dispositions)/service/CLI to make TM-02 green; keep flows 001…004 loading; new fields settable; `check` accepts {1,2}; harness stays evidence producer only. Reviewer: logic. |
| T8 | review | Opus | code-verifier (`tsc --noEmit` + full `bun test`) + logic/architecture review + explicit D-02 invariant check (no harness→flow.json writes, no second coordinator). |
