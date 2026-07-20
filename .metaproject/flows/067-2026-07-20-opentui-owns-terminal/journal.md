# Flow Journal

- 2026-07-20T10:56:50.700Z - flow created
- 2026-07-20T10:59:44.960Z - task-added: T5: refactor launch + shellCommand
- 2026-07-20T10:59:45.042Z - task-added: T6: verify
- 2026-07-20T10:59:45.123Z - frozen: 4 criteria; checksum recorded
- 2026-07-20T10:59:45.204Z - started

## Phase 2/3 — implement + verify (orchestrator)
- tui-shell.ts: launchTuiAgentShell now takes { detected, initial?, makeAgentDeps } and owns the terminal from the start (no onBeforeInit/readline). New selectProviderModelInTui: provider SelectRenderable → model SelectRenderable (↑/↓+Enter, own focus). deps built via makeAgentDeps(sel) after selection; the rest of the agent UI unchanged.
- shell.ts: early `--tui` block BEFORE readline.createInterface — builds makeAgentDeps + detect/initial and calls launchTuiAgentShell; falls through to readline on decline. Removed the old in-agent-branch launchTuiAgentShell call.
- Verify: tsc CLEAN; bun test 1506 pass/0 fail; default --agent (no --tui) → readline (smoke). Real-terminal --tui (clean init + in-TUI picker) = user. Default stays readline; TUI opt-in.
- AC1-AC4 satisfied.
- 2026-07-20T10:59:45.288Z - task-done: T1: Collect remaining context
- 2026-07-20T10:59:45.361Z - task-done: T2: Implement per plan
- 2026-07-20T10:59:45.432Z - task-done: T3: Add/adjust tests and make them pass
- 2026-07-20T10:59:45.508Z - task-done: T5: refactor launch + shellCommand
- 2026-07-20T10:59:45.576Z - task-done: T6: verify
