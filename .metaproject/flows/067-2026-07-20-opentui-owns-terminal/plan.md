# Plan — flow 067
- T1 context: readline↔OpenTUI contention; shellCommand structure; SelectRenderable ITEM_SELECTED. [done]
- T2 implement: launchTuiAgentShell(new signature + in-TUI picker); shellCommand early TUI block before readline; remove old in-branch call.
- T3 verify: tsc; bun test; default→readline smoke; real-TTY --tui = user.
