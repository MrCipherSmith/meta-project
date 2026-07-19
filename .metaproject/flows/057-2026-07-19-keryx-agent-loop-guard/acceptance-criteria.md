# Acceptance Criteria — flow 057 (agent runaway tool-loop guard)

- AC1: When the per-turn tool-call budget is exhausted, `runAgentTurn` ENDS the turn (emits a `[stopped]` system notice and returns) instead of re-requesting forever. A model that emits only tool calls can no longer spin the loop indefinitely — the turn is bounded.
- AC2: `runAgentTurn` aborts the turn early when the SAME tool call (name + input) fails `MAX_REPEAT_FAILS` (=3) times consecutively — emitting a `[stopped]` notice — so a model that repeats one invalid call (e.g. `memory_search` with no `query`) stops after 3 identical errors, not 8+budget-exhaustion spam. A successful call resets the counter.
- AC3: A validation failure's error message is actionable: it appends the tool's required fields, e.g. `invalid input for memory_search: $.query: Missing required property (required: query)`.
- AC4: `bunx tsc --noEmit` clean; `bun test` green with no reduction from baseline (1490 pass); new driver tests cover budget-exhaustion termination, repeated-identical-failure abort, counter reset on success, and the actionable message. Existing agent tests stay green. No new runtime dependency.
