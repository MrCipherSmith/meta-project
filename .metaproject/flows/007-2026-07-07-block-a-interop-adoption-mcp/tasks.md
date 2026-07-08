# Tasks

Task definitions live here; task **statuses** live in flow.json and are managed
only via `gd-metapro flow task done <id> <taskId>`.

Maps the block spec's T1–T14 (docs/requirements/roadmap-2026/A-interop-mcp/tasks.md)
onto flow task units. E3 = {T7,T8,T9} ships WITH A (untrusted from day one).

| ID | Kind | Title | Spec tasks | Satisfies |
|----|------|-------|-----------|-----------|
| T1 | context | Study Block 0 seam + createXService facades + redactRaw/runDetectors seams (done Phase 1) | T0 | — |
| T2 | implement | `src/mcp/` scaffold + `commands/mcp.ts` + `cli.ts` route; MCP SDK under optionalDependencies; lazy import only in server.ts | T1 | AC9 |
| T3 | implement | Manifest+config wiring: `modules.mcp` (default off) via init `--mcp/--no-mcp` through Block 0 seam; loadMcpConfig deep-merge+fallback; discovery filtering | T2 | AC3 |
| T4 | implement | Tool registry (`tools.ts`): thin adapters → one createXService() method each (spec §6); no new logic | T3 | AC1 |
| T5 | implement | Resource registry (`resources.ts`): metaproject:// scheme, read-only, path-confined | T4 | AC2 |
| T6 | implement | stdio JSON-RPC server (`server.ts`+`transport/stdio.ts`): handshake, tools/list+call, resources/list+read; no socket; hard-fail on missing SDK | T5 | AC1, AC2, AC8, AC10 |
| T7 | implement | E3 redact-seam: route EVERY tool result through redactRaw({source:"tool-output"}), wired from first commit; never throws | T7 | AC4 |
| T8 | implement | E3 scan-mcp detector: `security/detect/mcp.ts` pure scanMcpManifest→DetectorMatch[] (poisoning/line-jumping/rug-pull+pinned-hash); runDetectors slot; `security scan-mcp` command+route; leak-safe | T8 | AC5 |
| T9 | implement | E3 corpus: `fixtures/mcp-threat/` (poisoning/line-jumping/rug-pull + benign) + test 100% flagged / no FP / output redaction-routed | T9 | AC4, AC5 |
| T10 | implement | Generators: `standard emit llms` (pure/deterministic/zero-dep + validator) + gdskills `--runtime plugin` export (round-trip + schema-valid) | T10, T11 | AC6, AC7 |
| T11 | implement | HTTP/SSE second opt-in: `transport/http-sse.ts` behind `mcp serve --http` + `capabilities.http.enabled`; isolated/removable; localhost, no auth | T13 | AC8 |
| T12 | test | Server tests: stdio round-trip + per-method parity + import-boundary (M-3) + no-network sandbox + package-wide byte-identical golden-rule gate | T6 | AC1, AC2, AC9, AC12 |
| T13 | docs | `metaproject-standard/` MCP-surface package doc + Standard-as-generator repositioning (doc-only) + roadmap-2026 status update | T12, T14 | AC11 |
| T14 | review | Adversarial review (golden-rule / M-3 boundary / E3 redaction / no-socket) + draft PR | — | AC9, AC12 |

## Notes
- **Golden rule is the block-completion gate:** T12's package-wide byte-identical + no-socket test with `modules.mcp.enabled=false` and SDK absent (AC9/AC12) must be green; extend the Block 0 no-top-level-import guard to the MCP SDK.
- E3 (T7/T8/T9) lands in the SAME cycle as the server — the MCP surface must never exist without redaction routing.
- Sanctioned exception: only `mcp serve` may hard-fail on a missing SDK (AC10). All other paths load no SDK.
