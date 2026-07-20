# Multi-Agent Engine: cost/token budget hook (maxCostUnits in the ledger)

Status: ready to freeze
Source: user description + docs/requirements/keryx-multi-agent-engine/ (deferred extension point; PRD R3, spec §Data Contracts.2)

## Problem

The subagent budget ledger (flow 090) bounds fan-out by runtime + tool-calls, but
NOT by cost/tokens. Cost enforcement was deliberately deferred (Critic Q3:
providers report usage inconsistently), leaving a documented `maxCostUnits`
extension point. Without it, a fleet mixing cheap and expensive models can bound
time/calls but not spend.

## Expected Outcome

An OPTIONAL, provider-neutral cost dimension on `RemainingBudgetLedger`: a
`maxCostUnits` ceiling plus a per-reservation `costUnits` estimate the ledger
decrements alongside runtime/tool-calls, fail-closed when a reservation would
breach the remaining cost. Cost is a caller-supplied estimate (from a pricing
table / token estimate), keeping the ledger provider-neutral. Fully additive and
backward-compatible: with no `maxCostUnits` set, ledger behavior is unchanged, and
`inheritBudget` stays subset-only on runtime/tool-calls (cost is the ledger's
aggregation concern, not the containment check).

## Out of Scope

- A concrete pricing/token table per provider (the caller supplies cost estimates;
  a real table can live in a later flow).
- Changing `inheritBudget` to consider cost (it stays runtime/tool-calls only).
- Retroactive cost accounting from provider-reported usage (the monitor's job).
