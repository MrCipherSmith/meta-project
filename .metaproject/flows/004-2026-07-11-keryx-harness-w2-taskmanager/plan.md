# Implementation Plan — Flow 004 (W2 Task Manager evolution)

Status: frozen scope (W2 only)

## Approach

Evolve `src/flow` with **additive, all-optional** task/run-link fields plus a
deterministic v1→v2 migration, driven test-first. Preserve the D-02 invariant
(Task Manager is the single coordinator; harness never advances state or writes
`flow.json`). Backward compatibility is the hard constraint: existing flows
`001…004` keep loading and every `keryx flow` command keeps working.

Pipeline (strict order, per Depends): **TM-01 spec → TM-02 RED tests → TM-03
GREEN implementation → code-verifier + review.**

## Worker routing & Model Policy (runbook)

| Task | Kind | Worker | Model | Rationale |
|---|---|---|---|---|
| T1 | context | orchestrator inline | Haiku-class | gather from current code + frozen docs (done in context.md) |
| T5 (TM-01) | docs | job-documenter | **Haiku 4.5** | migration proposal + compat matrix (orchestrator validates before TM-02) |
| T6 (TM-02) | test | tests-creator | **Sonnet** | migration + transition fixtures, RED |
| T7 (TM-03) | implement | task-implementer | **Opus 4.8** | src/flow service/CLI + migration; make tests green |
| T8 | review | review-orchestrator + code-verifier | **Opus 4.8** | tsc + bun test + logic/architecture + D-02 invariant |
| T2/T3/T4 | umbrella | orchestrator | Opus | seed phases closed once specifics done |

Orchestrator = Opus (this session). Workers via `subagent-dispatch` →
`subagent-result`.

## Additive fields (all optional, on FlowTask)

`dependsOn`, `attempts` (+immutable attempt log), `disposition`
(`completed|blocked|failed|skipped`), `acRefs`, `evidenceRefs`, `budget`,
`runLink` (reference only). Production budget/retention values remain OPEN.

## Migration strategy (approved)

`schemaVersion 1 → 2`; `readFlow` normalizes v1→v2 on read; write v2 only on next
mutation; `check` accepts `{1,2}`; old files untouched until mutated. TM-01
produces the versioned migration proposal + backward-compatibility matrix; the
orchestrator reviews it before dispatching TM-02.

## Steps

1. T1: context assembled (`context.md`).
2. T5 (TM-01): `docs/decisions/keryx-harness/TM-01-task-manager-evolution.md`
   (field spec + versioned migration proposal + backward-compatibility matrix).
3. Orchestrator validates the TM-01 proposal (fields optional, migration
   deterministic, D-02 preserved) before proceeding.
4. T6 (TM-02): RED tests + fixtures under `src/flow/` — old→new deterministic
   mapping, blocked/failed/skipped/completed dispositions, negative migrations.
5. T7 (TM-03): implement types/store(migration)/machine(dispositions)/service/CLI
   to make TM-02 green; keep backward compat; harness stays evidence producer.
6. T8: `tsc --noEmit` + full `bun test` (code-verifier) + logic/architecture
   review + explicit D-02 invariant check.
7. `keryx health run`; confirm ACs; completion choice (ask user A/B/C).

## Verification (TDD, real code)

TM-02 tests must be RED before TM-03 and GREEN after. Code-verifier gate: `tsc
--noEmit` clean, full `bun test` green (incl. existing flow tests), no circular
imports. Backward-compat check: existing flows `001…004` load and summarize
identically; `flow list/status/check` unchanged for them.

## Risks

- **Breaking existing flows** → mitigate with read-time migration + defaults +
  fixtures for `001/002/003`-shaped values; never rewrite old files on read.
- **Disrupting the live flow 003 / 004 state** → migration is read-normalization
  only; no forced rewrite; verify 003/004 still `flow status` cleanly.
- **Scope creep into W11 integration** → W2 only prepares schema+migration; no
  harness→flow.json writes, no second coordinator (D-02 invariant, AC4).
- **TM-01 drafted by Haiku underspecifies migration** → orchestrator validates
  before TM-02; architecture review in T8.
