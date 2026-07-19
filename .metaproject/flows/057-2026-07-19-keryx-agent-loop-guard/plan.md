# Plan — flow 057
- T1 context: runAgentTurn loop + executeCall budget/validation. [done]
- T2 implement: budget-exhaustion termination; repeated-identical-failure abort (MAX_REPEAT_FAILS=3); actionable invalid-input message.
- T3 test: budget termination, repeat abort, reset-on-success, actionable message.
- T4 verify: tsc; bun test >= baseline.
