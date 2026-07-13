# Tasks — Flow 007 (W5 ports)

Task definitions live here; task **statuses** live in flow.json and are managed
only via `keryx flow task done <id> <taskId>`.

Scope: **only W5** (implementation-plan.md §W5). Port-only. No external dep, no
provider SDK. Reuse `src/contracts` validator. Worktree-guard in every worker.

| ID | Kind | Model | Title / definition |
|----|------|-------|--------------------|
| T1 | context | Haiku | Port map + boundaries + schema list (context.md). |
| T2 | implement | — | Umbrella: implement per plan (closed when T6+T8 done). |
| T3 | test | — | Umbrella: TDD tests (closed when T5+T7 authored + impls green). |
| T4 | review | — | Umbrella: self-review + completion prep (closed when T9 + completion done). |
| T5 | test (P-01 RED) | Sonnet | `src/harness/provider/` tests: ProviderPort contract — normalized events (8 kinds, sequence-numbered), attempt-scope, error taxonomy, unknown-extension preservation, src/contracts validation, no-SDK-leak. RED before T6. |
| T6 | impl (P-01) | Opus | `src/harness/provider/{provider-port,types}.ts`: ProviderPort interface + normalized request/event/error/capability types + validation via src/contracts; no provider SDK type crosses the port. Make T5 green. |
| T7 | test (P-02 RED) | Sonnet | `src/harness/tool/` tests: ToolDefinition/Registry/ExecutorPort — input-schema validation before invoke, budget/cancellation/provenance/replay metadata, registry snapshot, unregistered/invalid-call rejection, no fs/shell surface. RED before T8. |
| T8 | impl (P-02) | Opus | `src/harness/tool/{tool-port,registry,types}.ts`: ToolDefinition, ToolRegistry(+snapshot), ToolExecutorPort + ToolExecutionState + validation via src/contracts. Make T7 green. |
| T9 | review | Opus | code-verifier (`tsc` + full `bun test` ≥633 + new green); assert 0 provider-SDK imports under src/harness; assert no direct fs/shell surface on the ports; `dependencies` still `{}`; frozen pkg + src/contracts + src/eval + ADRs untouched. |
