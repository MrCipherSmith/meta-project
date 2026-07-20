# Plan — flow 065
- T1 context: flow-064 default gating; the real-TTY handoff failure. [done]
- T2 implement: revert the agent-branch gate to `--tui` opt-in (readline default); keep --no-tui + fallback; TUI code unchanged.
- T3 verify: tsc; bun test; smokes (default → readline; --tui non-TTY → readline).
