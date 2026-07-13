# Implementation Plan — Flow 014 (W11 flow integration)

Status: frozen scope (W11 only) — Release 1

## Approach

Add a `ManagedFlowPort` in `src/harness/flow/` so the harness consumes its
completion-gate + evidence through the evolved Task Manager API, test-first, and
verify a single coordinator owns retries/review-fix/completion. The only src/flow
change is a minimal, backward-compatible additive extension of `taskDone`
(optional `evidenceRefs?`/`runLink?`). D-02: the harness NEVER writes flow.json —
the Task Manager (src/flow) is the sole writer / loop authority. Reuse W7/W8/
src-contracts; deterministic.

## Worker routing & Model Policy

| Task | Kind | Worker | Model | Reviewer |
|---|---|---|---|---|
| T5 (FI-01 RED) | test | tests-creator | **Sonnet** | architecture |
| T6 (FI-01) | implement | task-implementer | **Opus 4.8** | architecture |
| T7 (FI-02) | test | tests-creator | **Sonnet** | logic |
| T8 | review | review-orchestrator | **Opus 4.8** | architecture/logic |
| T2/T3/T4 | umbrella | orchestrator | Opus | — |

Orchestrator = Opus. Workers via `subagent-dispatch` → `subagent-result`, each with
the worktree-guard (cd + pwd).

## Steps

1. T1: integration map + D-02 invariant (context.md).
2. T5 (FI-01 RED): `src/harness/flow/` tests — ManagedFlowPort maps harness gate/
   evidence/runLink → Task Manager via API; harness never writes flow.json;
   disposition mapping; TM-migration.
3. T6 (FI-01 GREEN): additive `taskDone(evidenceRefs?/runLink?)` in src/flow +
   `src/harness/flow/managed-flow-port.ts` adapter. Existing flow behavior + all
   prior flow tests unchanged.
4. T7 (FI-02 tests): single-coordinator parity + failure-disposition + no-duplicate-
   coordinator + TM-migration; `src/harness/flow/parity.ts` helper.
5. T8: `tsc` + full `bun test` (≥899 + new green); D-02 (`ctx rg writeFlow`/flow.json-
   writes outside src/flow = 0); single-coordinator; additive-only (W2 backward-compat,
   prior flow tests green); determinism; frozen + src/eval + src/contracts untouched.
6. `keryx health run`; confirm ACs; completion choice (ask user A/B/C).

## Verification (TDD)

Each task RED before impl, GREEN after. Gate: `tsc` clean; full `bun test` ≥899 +
new green; D-02 (harness never writes flow.json); prior W2 flow tests unchanged
(backward-compat); parity/failure-disposition asserted; no new dependency.

## Risks

- **Harness writing flow.json (D-02 breach)** → the port ONLY calls FlowService API;
  T8 greps for any writeFlow/flow.json write outside src/flow (must be 0).
- **Breaking W2 backward-compat** → taskDone extension is optional params only;
  prior flow tests must stay green; migration deterministic.
- **Duplicate coordinator** → the harness has no loop that transitions flow state;
  FI-02 asserts single-coordinator + parity.
- **Rewriting W7/W8** → reuse-only; the port composes CompletionGateResult/
  EvidenceRecord; if a W7/W8 change seems needed, STOP and report.
- **Wrong-worktree / tsc-cast / index-guard / frozen-array** → guard directives in
  every dispatch.
