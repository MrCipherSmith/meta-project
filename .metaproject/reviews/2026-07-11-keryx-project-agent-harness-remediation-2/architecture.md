# Architecture and Ownership Review
Version: 1.0.0
Status: PASS

`specification.md` reserves `src/harness/execution/turn-control/` for one
local provider/tool turn. It explicitly forbids an `orchestration/` module,
managed-flow scheduling, review/fix loops, direct `flow.json` writes, and
harness-owned completion. Managed-flow state and completion remain owned by
Task Manager through `ManagedFlowPort`/`CompletionGatePort`. No BLOCKER/P0/P1.
