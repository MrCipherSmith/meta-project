# Implementation Plan

Status: ready to freeze

## Approach

Additive, optional cost dimension owned by the ledger (the single aggregation
authority). `inheritBudget` is untouched — cost is not a subset/containment check.

## Steps

1. `src/harness/child/isolation.ts`: add optional `costUnits?: number` to
   `BudgetReservation` (and `ParentRemainingBudget` if a cost floor is passed
   there). `inheritBudget` IGNORES `costUnits` (stays runtime/tool-calls only).
2. `src/harness/child/ledger.ts`:
   - `LedgerLimits` gains `maxCostUnits?: number`.
   - Track `costRemaining` when set. `admit(reservation)` order: count cap →
     `inheritBudget` subset check → cost check (reservation.costUnits vs remaining
     cost) → THEN decrement runtime/tool-calls + cost + count. Any denial leaves
     ledger state UNCHANGED (all checks before mutation).
   - `remaining` exposes `costUnits` (remaining) when tracked; add a
     `costRemaining` getter.
   - Fail-closed: with `maxCostUnits` set, a reservation whose `costUnits` exceeds
     remaining cost is denied.
3. Extend `ledger.test.ts`: cost cap denial, aggregate-cost-never-exceeds property,
   denied-admit-leaves-state-unchanged (cost path), omitted-maxCostUnits backward
   compat.

## Risks

- Keep it ADDITIVE: no `maxCostUnits` ⇒ identical behavior; existing ledger/spawn/
  scheduler tests must stay green.
- Do NOT let cost leak into `inheritBudget` (Critic guidance).
- Cost units are caller estimates — the ledger enforces a ceiling, it does not
  measure real spend (documented).
- Deterministic: no clock/RNG.
