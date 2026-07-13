# Flow 003 — Freeze Keryx Harness W1 decisions (D-01…D-04)

Status: formalized
Source: user description (harness implementation runbook, Phase 1)

## Problem

The Keryx Project Agent Harness has a frozen requirements package
(`docs/requirements/keryx-project-agent-harness/`) but 0% implementation. The
implementation DAG (`implementation-plan.md`) starts with **Wave W1 —
Decisions and platform boundary**: four `docs` tasks that must *freeze* the
foundational decisions every later wave depends on. Until these are frozen and
contradiction-checked, no port, contract, or runtime work can start without
risking silent divergence from the spec.

## Expected Outcome

Four decision artifacts, traceable to the frozen requirements package and
schemas, that freeze:

- **D-01** — Release 0 boundary (offline / read-only) + measurable success
  criteria + signed decision table.
- **D-02** — single coordinator (Task Manager), ownership/import matrix, inward
  ports, with a contradiction check against the spec (S-06, R1-03).
- **D-03** — security profiles + required containment + explicit fail-closed
  decision (S-04, R1-01, M-02).
- **D-04** — provider-state, branch model, and child wire-framing decision
  records, each linked to the owning schemas (S-02, S-08, S-09) and the
  research ledger.

Deliverables land in `docs/decisions/keryx-harness/` (ADRs + a decision
registry). The frozen requirements package is **not** modified.

## Out of Scope (do NOT touch)

- Any wave other than W1 (TM-*, EV-*, C-*, P-*, F-*, R0-*, and all Release 1/2+).
- Any code under `src/` (W1 is documentation only; no runtime, ports, or tests).
- The frozen requirements package (source of truth — read, cite, never rewrite).
- Deferred open questions — recorded as `OPEN`, never guessed: concrete first
  real provider + credential shape, per-role budget values, retention windows,
  exact corpus→`src/eval/` migration.
