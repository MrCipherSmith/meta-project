# Plan — flow 055
- T1 context: onToolResult + command handler + /help sites; summarizeToolOutput. [done]
- T2 implement: collapseToolOutput in ui.ts; REPL retain last output; collapsed render; /expand; /help.
- T3 test: collapseToolOutput unit tests (single/multi-line, clip, empty).
- T4 verify: tsc; bun test >= baseline; cli smoke.
