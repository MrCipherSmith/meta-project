# Implementation Plan — Flow 007 (W5 ports)

Status: frozen scope (W5 only)

## Approach

Define the runtime port primitives in `src/harness/` (freed in W3): a
provider-neutral `ProviderPort` (P-01) and the tool definition/registry/executor
ports (P-02), each with normalized types and schema validation via the W4
`src/contracts` validator. Port-only — no real/fake provider, no real tools, no
CLI wiring. Enforce the two boundaries by construction: no provider SDK type
crosses P-01; the model reaches fs/shell only through registered tools (P-02).
TDD: P-01 (RED→GREEN), then P-02 (RED→GREEN), then review.

## Worker routing & Model Policy

| Task | Kind | Worker | Model | Rationale |
|---|---|---|---|---|
| T1 | context | orchestrator inline | Haiku-class | port map + schemas (done) |
| T5 (P-01 RED) | test | tests-creator | **Sonnet** | provider-port contract tests |
| T6 (P-01) | implement | task-implementer | **Opus 4.8** | ProviderPort + normalized types + validation |
| T7 (P-02 RED) | test | tests-creator | **Sonnet** | tool-port contract tests |
| T8 (P-02) | implement | task-implementer | **Opus 4.8** | ToolDefinition/Registry/ExecutorPort + validation |
| T9 | review | review-orchestrator | **Opus 4.8** | code-verifier + boundaries + no-dep + frozen untouched |
| T2/T3/T4 | umbrella | orchestrator | Opus | seed phases |

Orchestrator = Opus. Workers via `subagent-dispatch` → `subagent-result` with a
worktree-guard (cd + pwd) in every writing dispatch.

## Steps

1. T1: port map + boundaries + schemas (context.md).
2. T5 (P-01 RED): tests in `src/harness/provider/` for the ProviderPort contract
   — normalized events (8 kinds, sequence-numbered), attempt-scope, error
   taxonomy, unknown-extension preservation, schema validation via src/contracts,
   no-SDK-leak. RED before T6.
3. T6 (P-01 GREEN): implement `src/harness/provider/{provider-port,types}.ts`
   (+ validation wiring). Make T5 green.
4. T7 (P-02 RED): tests in `src/harness/tool/` for ToolDefinition/Registry/
   ExecutorPort — input-schema validation before invoke, budget/cancel/provenance/
   replay, registry snapshot, unregistered/invalid-call rejection, no fs/shell
   surface. RED before T8.
5. T8 (P-02 GREEN): implement `src/harness/tool/{tool-port,registry,types}.ts`.
   Make T7 green.
6. T9: `tsc --noEmit` + full `bun test` (≥633 + new green); assert 0 provider-SDK
   imports under `src/harness/`; assert no direct fs/shell surface on the ports;
   `dependencies` still `{}`; frozen pkg + src/contracts + src/eval untouched.
7. `keryx health run`; confirm ACs; completion choice (ask user A/B/C).

## Verification (TDD, real code)

Each port's tests RED before its impl, GREEN after. Gate: `tsc` clean; full
`bun test` ≥ 633 baseline + new green; boundary checks (no SDK import; no fs/shell
method); no new dependency.

## Risks

- **Provider SDK leak into P-01** → interface uses only neutral types; T9 greps
  `src/harness` for any provider SDK import (must be 0); no dependency added.
- **fs/shell reachable by the model** → executor takes only a registered
  ToolDefinition with an injected adapter; no raw fs/shell method on the port;
  unregistered/invalid calls rejected; Release 0 tools read-only (none built here).
- **Reinventing the validator** → reuse `src/contracts/validateAgainstSchema`;
  AC forbids a new validator/dependency.
- **Scope creep into W6/W7** → port-only; no provider/tool implementations, no CLI.
- **Wrong-worktree writes** (W4 incident) → worktree-guard in every dispatch;
  verify file locations after each worker.
