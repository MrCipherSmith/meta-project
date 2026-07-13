# Flow 004 — W2 Task Manager evolution (TM-01…TM-03)

Status: formalized
Source: user description (harness implementation runbook, Phase 2)

## Problem

The harness implementation DAG requires the Task Manager (`src/flow`) to grow
additive task/run-link fields before any managed-flow integration (W11) or child
agents (W12) can consume harness evidence. Today `FlowTask` is minimal
(`id/title/kind/status`, `status: todo|in-progress|done`) with no dependencies,
attempts, dispositions, AC/evidence refs, budgets, or session/run linkage, and
`FlowState.schemaVersion` is `1`. W1 froze Task Manager as the single coordinator
(ADR-0002); W2 must evolve it **without breaking backward compatibility** — the
existing flows `001/002/003` (003 is the live W1 flow) must keep loading and all
`keryx flow` commands must keep working.

## Expected Outcome

- **TM-01 (docs)** — a specification of additive, all-optional fields
  (dependencies, attempts, dispositions, AC/evidence refs, budgets, session/run
  linkage), a versioned migration proposal, and a backward-compatibility matrix.
- **TM-02 (test)** — migration and status-transition fixtures for existing
  `FlowTask` values, RED before implementation, making blocked/failed/skipped
  disposition semantics explicit, plus negative-migration cases.
- **TM-03 (implement)** — the Task Manager service/CLI evolution and deterministic
  migration that turns the TM-02 tests green while preserving backward
  compatibility; the harness remains an evidence producer only.

## Out of Scope (do NOT touch)

- Any wave other than W2 (W1 is done; W3+ untouched).
- Actual managed-flow *integration* (that is W11/FI-*) — W2 only prepares the
  additive schema + migration; no new coordinator, no harness→flow.json writes.
- Provider/tool/harness runtime code (W4+).
- The frozen requirements package (`docs/requirements/`) — read, cite, never edit.
- Deferred OPEN values: concrete per-role budget numbers, retention windows —
  fields are specified but their production values stay OPEN.
