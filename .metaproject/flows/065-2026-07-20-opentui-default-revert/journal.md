# Flow Journal

- 2026-07-20T10:02:45.139Z - flow created
- 2026-07-20T10:03:17.197Z - task-added: T5: revert default gate to --tui opt-in
- 2026-07-20T10:03:17.282Z - task-added: T6: verify + smokes
- 2026-07-20T10:03:17.366Z - frozen: 4 criteria; checksum recorded
- 2026-07-20T10:03:17.444Z - started
- 2026-07-20T10:03:17.522Z - task-done: T1: Collect remaining context

## Phase 2/3 — implement + verify (orchestrator)
- shell.ts: reverted the flow-064 default flip — the agent-branch gate is `tuiFlag && !noTuiFlag && isTTY` again (OpenTUI opt-in via --tui). readline is the default; --no-tui still overrides; TUI code (tui-shell.ts) unchanged. Known-issue report.md records the stdin-handoff root cause + planned fix.
- Verify: tsc CLEAN; `bun test` **1506 pass / 3 skip / 0 fail**; default `--agent` (no --tui) → readline (smoke). No new dependency.
- AC1-AC4 satisfied.
- 2026-07-20T10:04:25.773Z - task-done: T2: Implement per plan
- 2026-07-20T10:04:25.862Z - task-done: T3: Add/adjust tests and make them pass
- 2026-07-20T10:04:25.944Z - task-done: T5: revert default gate to --tui opt-in
- 2026-07-20T10:04:26.031Z - task-done: T6: verify + smokes
