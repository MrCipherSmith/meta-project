# Plan — flow 059
- T1 context: PRD/spec Phase 0 exit criteria, target platform. [done]
- T2 add dep + R1 gate: bun add @opentui/core; verify install + native load on darwin-arm64.
- T3 API map (R3) + prototype: inspect @opentui/core exports/types; build isolated `keryx shell --tui` (static transcript + live / dropdown over dummy commands); tsc clean; fallback-safe.
- T4 report + gate: write report.md (R1–R5 + recommendation); bun test >= baseline; hand real-TTY checks to user.
