# Flow 007 — W5 provider & tool ports (P-01, P-02)

Status: formalized
Source: user description (harness implementation runbook, Phase 5)

## Problem

The harness needs provider-neutral and tool boundaries before a fake provider
(W6) or a Release 0 slice (W7) can run. Today `src/harness/` is empty (freed in
W3). W5 defines the runtime **ports** (interfaces + normalized types + schema
validation), reusing the W4 deterministic validator — no real/fake provider and
no real tools yet.

## Expected Outcome

- **P-01 (provider port)** — `src/harness/provider/`: a `ProviderPort` with a
  normalized request, the 8 normalized event kinds (sequence-numbered,
  attempt-scoped), a typed error taxonomy, and a capability descriptor; unknown
  provider extensions preserved in a namespaced/redacted field; **no provider SDK
  type crosses the port**. Payloads validated via `src/contracts`
  (model-request/response/error, harness-event, provider-descriptor).
- **P-02 (tool ports)** — `src/harness/tool/`: `ToolDefinition`, `ToolRegistry`
  (+ snapshot), and a `ToolExecutorPort` with input-schema validation, budget,
  cancellation, provenance, replay metadata, and `ToolExecutionState`; **the model
  cannot reach filesystem/shell directly** — only registered tools via
  registry+policy. Payloads validated via `src/contracts`.

## Out of Scope (do NOT touch)

- Any wave other than W5. **Port-only** — no real/fake provider (W6), no real
  tools (W6/R0), no CLI wiring, no session/persistence (later waves).
- The frozen requirements package (schemas/spec/protocols) — read/cite, never edit.
- `src/contracts/` (W4 validator — reuse, don't modify), `src/eval/`, ADRs.
- No new production dependency; no provider SDK import.
- Deferred OPEN values (budgets, retention) — fields present, production values OPEN.
