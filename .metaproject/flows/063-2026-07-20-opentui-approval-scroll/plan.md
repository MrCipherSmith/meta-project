# Plan — flow 063
- T1 context: ScrollBox (.content/stickyScroll), requestApproval contract, resize. [done]
- T2 implement: ScrollBox transcript (append to .content); requestApproval (inline y/N, default-deny) + pure isShellApproved; wire in launchTuiAgentShell.
- T3 test: scrollbox render + isShellApproved units + resize-survives (headless).
- T4 verify: tsc; bun test >= baseline.
