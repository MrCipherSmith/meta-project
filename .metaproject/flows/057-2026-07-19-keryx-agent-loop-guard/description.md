# Flow 057 — agent runaway tool-loop guard

## Problem
Observed: gpt-4o-mini called `memory_search` with no `query`, got a validation
error, and re-issued the identical call every round. The `maxToolCalls` budget
(8) capped executions but NOT the outer re-request loop: once exhausted, every
further call returned "budget exhausted", was appended, and the driver
re-requested again — an unbounded loop (20+ identical lines until Ctrl-C).

## Approach (driver-only, deterministic)
- Terminate the turn when `toolCallsUsed >= maxToolCalls` after a tool round
  (emit `[stopped] tool-call limit reached` and return) — no more re-request.
- Track consecutive identical FAILING calls (name+input); abort after 3 with a
  `[stopped]` notice. Reset on any success.
- Make validation errors actionable by appending the schema's required fields.

## Out of scope
Changing `maxToolCalls`, model-side prompt tuning, giving the model a final
tool-free summarization round (a possible later refinement).
