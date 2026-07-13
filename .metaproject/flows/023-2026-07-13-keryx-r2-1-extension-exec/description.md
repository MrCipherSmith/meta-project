# Flow 023 — Release 2 · Wave R2-1: extension-execution

Status: formalized
Source: user runbook prompt (Release 2, Wave R2-1). Frozen scope from
`docs/decisions/keryx-harness/E-03-release1-handoff.md` §4 AC-R2-1.

## Problem

W12 built a canonical child-contract adapter (CA-01) + fail-closed child isolation
(CA-02), and W15 added a fail-closed extension REGISTRY that only registers-and-denies
(`registerExtension` → `{ok,extensionId}`, no capability/authority/provenance). Nothing
lets a REGISTERED extension actually be DISPATCHED with bounded, policy-governed
execution authority. R2-1 adds that first extension-execution path — reusing CA-01's
canonical adapter + CA-02's per-capability containment + W15's registry — and pins the
security invariant that an extension gains NO capability without an explicit policy
grant (+ provenance + approval).

## Scope (frozen: E-03 §4 AC-R2-1)

"A registered extension gains bounded, policy-governed execution authority for the
first time." Covers three `@release-2` scenarios:
- **SC_R08_CHILD_DISPATCH_CANONICAL_RESULT** (acceptance.feature:376, @R8 @R9 @positive):
  a managed coordinator with reserved child budget dispatches a (registered) extension
  through the adapter; the payload validates as canonical `subagent-dispatch` and
  `subagent-result`; STATUS framing is normalized BEFORE persistence.
- **SC_R08_NEEDS_CONTEXT_ADAPTER** (acceptance.feature:459, @R8 @R12 @positive): a child
  result names ONE missing bounded artifact → the parent retries with the SAME dispatch
  id → only that artifact is added → the prior attempt remains immutable.
- **SC_R08_EXTENSION_ESCALATION_REQUIRES_POLICY** (acceptance.feature:384, @R8 @R18 @R15
  @negative): a registered extension requesting broader tools/provider access → the
  capability-grant evaluation requires explicit policy + provenance + approval →
  escalation without them is DENIED, with NO silent authority gain.

NOT in scope: R2-2 (registered-extension provenance beyond this), R2-3 (bound-parallel-
wave), R2-4 (TUI), R2-5 (real-subprocess).

## Expected Outcome

- New `src/harness/extension/execute.ts`:
  - **dispatchExtension** — given a REGISTERED extension (registry `ok`) + a coordinator's
    reserved child budget, build a canonical child dispatch (reuse
    `buildChildDispatchExtension`); the extension's execution authority is bounded to its
    granted capabilities ONLY. Round-trip: `parseChildResult` normalizes a STATUS-first
    result to canonical `subagent-result` BEFORE persistence (SC_R08_CHILD_DISPATCH_
    CANONICAL_RESULT). Validate dispatch/result against the canonical schemas + the frozen
    child-contract-extension schema (reuse src/contracts).
  - **evaluateExtensionGrant** — a registered extension requesting a capability BROADER
    than its `capabilityGrant` (broader tools / provider access) is an escalation:
    requires an explicit policy decision + provenance + approval; absent any → DENY, no
    silent authority gain (reuse W12 `inheritPolicy` unconditional per-capability
    containment + the W10 approval model + provenance). Fail-closed on out-of-enum.
    (SC_R08_EXTENSION_ESCALATION_REQUIRES_POLICY.)
  - **retryWithContext** — on a NEEDS_CONTEXT child result naming one missing bounded
    artifact, retry with the SAME dispatch id adding ONLY that artifact; the prior attempt
    is immutable (reuse W8 immutable-attempts). (SC_R08_NEEDS_CONTEXT_ADAPTER.)
- Additive edits to `src/harness/extension/registry.ts` / `src/harness/child/*` only if
  strictly needed (a grant lookup / a small helper) — no rewrite.

## Out of Scope (do NOT touch)

- R2-2/R2-3/R2-4/R2-5. No new dependency (`dependencies` stays `{}`), no provider SDK, no
  network. No real fs mutation in tests (fake/injected adapters). The harness / child /
  extension NEVER write flow.json — the parent owns completion via the W11 ManagedFlowPort
  (D-02). Deterministic (injected id/clock; no `Date.now`/`Math.random`).
- Rewriting W12 child (contract/isolation/spawn), W15 registry, W11 flow-port, W10
  approval, or W8 resume — REUSE them (composition/additive only). If a prior module seems
  to need a real refactor, STOP and report.
- The frozen requirements package + ADR-0001…0004 + canonical contract schemas + `src/eval/`
  + `src/contracts/` — read/cite only. Commits/PR carry NO co-authorship trailer.
- Fail-closed is the point: an extension gains NO tool/provider capability without an
  explicit policy grant + provenance + approval; escalation → deny.
