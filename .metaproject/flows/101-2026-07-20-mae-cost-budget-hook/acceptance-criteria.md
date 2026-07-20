# Acceptance Criteria

Rules:

- Criteria lines use the exact format `- ACn: <criterion>`.
- After `flow freeze` this file is checksum-protected: any edit outside
  `keryx flow ac update` fails every gate and status transition.
- Completion requires every ACn to be confirmed via
  `keryx flow ac confirm <id> <ACn>`.

## Criteria

- AC1: `BudgetReservation` gains an optional `costUnits?: number`; `inheritBudget` IGNORES it (its subset check stays runtime + tool-calls only — cost is never part of the containment check).
- AC2: `RemainingBudgetLedger` accepts an optional `maxCostUnits` (via `LedgerLimits`); when set, `admit(reservation)` decrements a cost dimension alongside runtime/tool-calls, and a reservation whose `costUnits` would exceed the remaining cost is denied fail-closed.
- AC3: Any denial (count cap, budget subset, OR cost) leaves ledger state UNCHANGED (no partial decrement / count bump) — all checks run before any mutation.
- AC4: With no `maxCostUnits` set, cost checks are skipped and ledger behavior is byte-for-byte the pre-hook behavior (backward-compatible); `remaining` exposes the remaining cost only when cost is tracked.
- AC5: A property test proves aggregate admitted `costUnits` never exceeds `maxCostUnits`; the ledger stays pure/deterministic (no `Date.now`/`Math.random`).
- AC6: `ledger.test.ts` covers the cost cap, aggregate-cost property, denial-leaves-state-unchanged (cost path), and backward compatibility; existing ledger/spawn/scheduler tests still pass; the full suite (incl. the zero-`dependencies` guard) passes and `tsc --noEmit` is clean.
