# Flow Journal

- 2026-07-20T08:04:41.813Z - flow created
- 2026-07-20T08:05:09.874Z - task-added: T5: ADR-0005 + dependency ratification
- 2026-07-20T08:05:09.957Z - task-added: T6: TuiShell skeleton + --tui wiring
- 2026-07-20T08:05:10.054Z - task-added: T7: headless test + verify
- 2026-07-20T08:05:10.150Z - frozen: 4 criteria; checksum recorded
- 2026-07-20T08:05:10.647Z - started
- 2026-07-20T08:05:11.061Z - task-done: T1: Collect remaining context

## Phase 2/3/4 — implement + test + verify (orchestrator)
- ADR-0005 (docs/decisions/keryx-harness): ratifies @opentui/core as the first UI-facing OPTIONAL native dependency (optionalDependencies + dynamic-import-only + graceful fallback; zero-dependencies floor unchanged).
- package.json: @opentui/core → optionalDependencies (deps stays {}); AC15 pin (block-d-no-network.test.ts) updated to {mcp-sdk, @opentui/core, web-tree-sitter} + rationale; no-top-level-import guard passes (dynamic import only).
- src/tui/tui-shell.ts: createTuiAgentIo (AgentIO → OpenTUI transcript, plain text) + launchTuiAgentShell(deps) driving runAgentTurn from a split-footer composer; --tui wired in shellCommand agent branch with readline fallback.
- src/tui/tui-shell.test.ts: headless driver→render proof (scripted provider → runAgentTurn(TuiShell IO) → captureCharFrame contains "Your directory is set." + "get_cwd") + Input primitive proof.
- Verify: tsc CLEAN; `bun test` **1496 pass / 3 skip / 0 fail**; `--tui` non-TTY fallback → readline agent shell (verified). runAgentTurn + pure helpers + chat + roleLabel unchanged. Markdown/gutter/collapse/reasoning parity deferred to Phase 2. Interactive look on a real TTY = user.
- AC1-AC4 satisfied.
- 2026-07-20T08:11:31.961Z - task-done: T2: Implement per plan
- 2026-07-20T08:11:32.055Z - task-done: T3: Add/adjust tests and make them pass
- 2026-07-20T08:11:32.134Z - task-done: T4: Self-review and prepare draft PR
- 2026-07-20T08:11:32.284Z - task-done: T5: ADR-0005 + dependency ratification
- 2026-07-20T08:11:32.406Z - task-done: T6: TuiShell skeleton + --tui wiring
- 2026-07-20T08:11:32.491Z - task-done: T7: headless test + verify
- 2026-07-20T08:11:42.263Z - implemented: draft PR: https://github.com/MrCipherSmith/keryx/pull/92
- 2026-07-20T08:11:42.422Z - ac-confirmed: AC1: ADR-0005 ratifies @opentui/core optional native dep (dynamic-import + fallback; zero-dep floor unchanged)
- 2026-07-20T08:11:42.503Z - ac-confirmed: AC2: optionalDependencies (deps={}); AC15 pin updated + rationale; no-top-level-import guard passes (dynamic import only)
- 2026-07-20T08:11:42.583Z - ac-confirmed: AC3: createTuiAgentIo (AgentIO→transcript) + launchTuiAgentShell(split-footer) driving runAgentTurn; --tui opt-in; non-TTY→readline fallback verified
- 2026-07-20T08:11:42.657Z - ac-confirmed: AC4: headless driver→render test (frame has assistant text + tool line); tsc clean; bun test 1496/0; driver+helpers+chat+roleLabel unchanged; parity deferred Phase 2
- 2026-07-20T08:12:09.458Z - completing
- 2026-07-20T08:12:09.541Z - done: all gates passed
