# Acceptance Criteria

Rules:

- Criteria lines use the exact format `- ACn: <criterion>`.
- After `flow freeze` this file is checksum-protected: any edit outside
  `keryx flow ac update` fails every gate and status transition.
- Completion requires every ACn to be confirmed via
  `keryx flow ac confirm <id> <ACn>`.

## Criteria

- AC1: P-01 — `src/harness/provider/` defines a provider-neutral `ProviderPort` with a normalized request, the 8 normalized event kinds (model_start, text_delta, tool_call_start, tool_call_delta, tool_call_end, usage_update, model_end, provider_error) that are sequence-numbered and attempt-scoped (stable attempt id with complete/fail/cancel/abandon outcomes), a typed error taxonomy (authentication/invalid-request/rate-limit/overloaded/context-overflow/unavailable/cancelled/malformed/unknown), and a capability descriptor; unknown provider extensions are preserved in a namespaced/redacted field rather than discarded; and NO provider SDK type appears in the port signatures (verifiable: zero provider-SDK imports under `src/harness/`).
- AC2: P-01 semantics — a streamed tool call is only surfaced as executable after its complete JSON input validates against the registered tool schema (partial tool-call deltas never authorize execution or retry reuse), enforced in the port and covered by tests.
- AC3: P-02 — `src/harness/tool/` defines `ToolDefinition`, a `ToolRegistry` (with a `ToolRegistrySnapshot`/registryHash), and a `ToolExecutorPort.invoke` that validates the tool-call input against the tool's `inputSchema` before execution and carries budget, cancellation, provenance, and replay metadata plus a `ToolExecutionState`; the model cannot reach filesystem/shell directly — there is no raw fs/shell method on the port surface and an unregistered or schema-invalid tool call is rejected (covered by tests).
- AC4: All port payload validation reuses the W4 `src/contracts` validator — `validateAgainstSchema` for file-based schemas, plus a minimal ADDITIVE inline-schema entry point (e.g. `validateAgainstSchemaObject`) that reuses the existing `validateNode` core to validate a tool call against the tool's inline `inputSchema`; no new validator engine is written and no new production dependency is added (`package.json` dependencies stay `{}`).
- AC5: No regression / scope — `tsc --noEmit` is clean and the full `bun test` suite is ≥ the pre-change baseline of 633 pass with the new tests green and 0 fail; all new code lives under `src/harness/` except a minimal additive export in `src/contracts` (inline-schema validation reusing `validateNode`, no change to existing exports/behavior); the frozen requirements package, `src/eval/`, and ADR-0001…0004 are NOT modified.
